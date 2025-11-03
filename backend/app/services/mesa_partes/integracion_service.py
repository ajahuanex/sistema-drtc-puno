"""
Service layer for Integracion operations
Handles business logic for external integrations in Mesa de Partes
"""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import httpx
import json
import hashlib
import hmac
import asyncio
from urllib.parse import urljoin

from app.models.mesa_partes.integracion import (
    Integracion, LogSincronizacion, 
    TipoIntegracionEnum, TipoAutenticacionEnum, EstadoConexionEnum, EstadoSincronizacionEnum
)
from app.schemas.mesa_partes.integracion import (
    IntegracionCreate, IntegracionUpdate, IntegracionResponse, IntegracionResumen,
    DocumentoExterno, DocumentoExternoResponse, ProbarConexion, ProbarConexionResponse,
    LogSincronizacionCreate, LogSincronizacionResponse, FiltrosLogSincronizacion,
    IntegracionEstadisticas, WebhookPayload, WebhookResponse
)
from app.repositories.mesa_partes.integracion_repository import IntegracionRepository, LogSincronizacionRepository
from app.repositories.mesa_partes.documento_repository import DocumentoRepository
from app.utils.exceptions import NotFoundError, ValidationError, BusinessLogicError


class IntegracionService:
    """Service for integracion business logic"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = IntegracionRepository(db)
        self.log_repository = LogSincronizacionRepository(db)
        self.documento_repository = DocumentoRepository(db)
        self.http_timeout = 30.0
    
    async def crear_integracion(self, integracion_data: IntegracionCreate, usuario_id: str) -> IntegracionResponse:
        """
        Create a new integracion
        Requirements: 4.1, 4.2
        """
        try:
            # Validate codigo is unique
            existing = self.repository.get_by_codigo(integracion_data.codigo)
            if existing:
                raise ValidationError(f"Integration with code {integracion_data.codigo} already exists")
            
            # Validate URL accessibility
            await self._validate_url_accessibility(str(integracion_data.url_base))
            
            # Prepare integracion data
            integracion_dict = integracion_data.dict(exclude_unset=True)
            
            # Convert mapeos_campos to dict format for storage
            if integracion_data.mapeos_campos:
                integracion_dict['mapeos_campos'] = {
                    mapeo.campo_local: {
                        'campo_remoto': mapeo.campo_remoto,
                        'transformacion': mapeo.transformacion,
                        'requerido': mapeo.requerido,
                        'tipo_dato': mapeo.tipo_dato,
                        'valor_defecto': mapeo.valor_defecto
                    }
                    for mapeo in integracion_data.mapeos_campos
                }
            
            # Convert webhook configuration
            if integracion_data.configuracion_webhook:
                webhook_config = integracion_data.configuracion_webhook.dict()
                integracion_dict['webhook_url'] = str(webhook_config['url'])
                integracion_dict['webhook_eventos'] = webhook_config['eventos']
                integracion_dict['webhook_secreto'] = webhook_config.get('secreto')
                integracion_dict.pop('configuracion_webhook', None)
            
            # Create integracion
            integracion = self.repository.create(integracion_dict)
            
            # Test initial connection
            await self._test_connection_async(integracion)
            
            # Commit transaction
            self.db.commit()
            self.db.refresh(integracion)
            
            return self._enrich_integracion_response(IntegracionResponse.from_orm(integracion))
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error creating integracion: {str(e)}")
    
    async def probar_conexion(self, integracion_id: str, prueba_data: Optional[ProbarConexion] = None) -> ProbarConexionResponse:
        """
        Test connection to external integration
        Requirements: 4.2
        """
        integracion = self.repository.get_by_id(integracion_id)
        if not integracion:
            raise NotFoundError(f"Integracion with ID {integracion_id} not found")
        
        return await self._test_connection_async(integracion, prueba_data)
    
    async def enviar_documento(self, documento_id: str, integracion_id: str, usuario_id: str) -> bool:
        """
        Send documento to external integration
        Requirements: 4.3, 4.4
        """
        try:
            # Get documento and integracion
            documento = self.documento_repository.get_by_id(documento_id, include_relations=True)
            if not documento:
                raise NotFoundError(f"Documento with ID {documento_id} not found")
            
            integracion = self.repository.get_by_id(integracion_id)
            if not integracion:
                raise NotFoundError(f"Integracion with ID {integracion_id} not found")
            
            # Validate integracion is active and allows sending
            if not integracion.activa or not integracion.permite_envio:
                raise ValidationError("Integration is not active or does not allow sending")
            
            # Create log entry
            log_data = LogSincronizacionCreate(
                integracion_id=integracion_id,
                documento_id=documento_id,
                documento_numero_expediente=documento.numero_expediente,
                operacion="ENVIO",
                direccion="SALIDA"
            )
            
            # Map documento to external format
            documento_externo = await self._mapear_documento_salida(documento, integracion)
            log_data.datos_enviados = documento_externo.dict()
            
            # Create initial log
            log = self.log_repository.create_log(log_data.dict())
            
            try:
                # Send documento
                response_data = await self._send_documento_http(documento_externo, integracion)
                
                # Update log with success
                self.log_repository.actualizar_estado_log(
                    str(log.id),
                    EstadoSincronizacionEnum.EXITOSO,
                    datos_recibidos=response_data
                )
                
                # Update integracion last sync
                self.repository.actualizar_ultima_sincronizacion(integracion_id)
                self.repository.actualizar_estado_conexion(integracion_id, EstadoConexionEnum.CONECTADO)
                
                self.db.commit()
                return True
                
            except Exception as e:
                # Update log with error
                self.log_repository.actualizar_estado_log(
                    str(log.id),
                    EstadoSincronizacionEnum.ERROR,
                    mensaje_error=str(e)
                )
                
                # Update integracion error state
                self.repository.actualizar_estado_conexion(integracion_id, EstadoConexionEnum.ERROR, str(e))
                
                self.db.commit()
                
                # Schedule retry if configured
                if integracion.max_reintentos > log.numero_intento:
                    await self._schedule_retry(log, integracion)
                
                raise BusinessLogicError(f"Error sending documento: {str(e)}")
                
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error in enviar_documento: {str(e)}")
    
    async def recibir_documento_externo(self, documento_externo: DocumentoExterno, integracion_id: str) -> DocumentoExternoResponse:
        """
        Receive documento from external integration
        Requirements: 4.3, 4.4
        """
        try:
            # Get integracion
            integracion = self.repository.get_by_id(integracion_id)
            if not integracion:
                raise NotFoundError(f"Integracion with ID {integracion_id} not found")
            
            # Validate integracion allows reception
            if not integracion.activa or not integracion.permite_recepcion:
                raise ValidationError("Integration is not active or does not allow reception")
            
            # Create log entry
            log_data = LogSincronizacionCreate(
                integracion_id=integracion_id,
                operacion="RECEPCION",
                direccion="ENTRADA",
                datos_recibidos=documento_externo.dict(),
                id_externo=documento_externo.id_externo
            )
            
            log = self.log_repository.create_log(log_data.dict())
            
            try:
                # Map external documento to local format
                documento_local = await self._mapear_documento_entrada(documento_externo, integracion)
                
                # Create documento in local system
                from app.services.mesa_partes.documento_service import DocumentoService
                documento_service = DocumentoService(self.db)
                
                documento_response = await documento_service.crear_documento(
                    documento_local,
                    "sistema-externo"  # Special user for external documents
                )
                
                # Update log with success
                self.log_repository.actualizar_estado_log(
                    str(log.id),
                    EstadoSincronizacionEnum.EXITOSO,
                    datos_enviados=documento_local.dict()
                )
                
                # Update log with documento info
                self.log_repository.update(str(log.id), {
                    "documento_id": documento_response.id,
                    "documento_numero_expediente": documento_response.numero_expediente
                })
                
                # Update integracion last sync
                self.repository.actualizar_ultima_sincronizacion(integracion_id)
                
                self.db.commit()
                
                return DocumentoExternoResponse(
                    id_local=documento_response.id,
                    numero_expediente_local=documento_response.numero_expediente,
                    id_externo=documento_externo.id_externo,
                    estado_procesamiento="EXITOSO",
                    errores=[],
                    advertencias=[]
                )
                
            except Exception as e:
                # Update log with error
                self.log_repository.actualizar_estado_log(
                    str(log.id),
                    EstadoSincronizacionEnum.ERROR,
                    mensaje_error=str(e)
                )
                
                self.db.commit()
                
                return DocumentoExternoResponse(
                    id_local="",
                    numero_expediente_local="",
                    id_externo=documento_externo.id_externo,
                    estado_procesamiento="ERROR",
                    errores=[str(e)],
                    advertencias=[]
                )
                
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error receiving external documento: {str(e)}")
    
    async def sincronizar_estado(self, documento_id: str, integracion_id: str) -> bool:
        """
        Synchronize documento status with external system
        Requirements: 4.5, 4.6
        """
        try:
            # Get documento and integracion
            documento = self.documento_repository.get_by_id(documento_id)
            if not documento:
                raise NotFoundError(f"Documento with ID {documento_id} not found")
            
            integracion = self.repository.get_by_id(integracion_id)
            if not integracion:
                raise NotFoundError(f"Integracion with ID {integracion_id} not found")
            
            # Create log entry
            log_data = LogSincronizacionCreate(
                integracion_id=integracion_id,
                documento_id=documento_id,
                documento_numero_expediente=documento.numero_expediente,
                operacion="CONSULTA_ESTADO",
                direccion="SALIDA"
            )
            
            log = self.log_repository.create_log(log_data.dict())
            
            try:
                # Query external system for status
                estado_externo = await self._consultar_estado_externo(documento, integracion)
                
                # Update local documento if needed
                if estado_externo and estado_externo != documento.estado.value:
                    await self._actualizar_estado_local(documento_id, estado_externo)
                
                # Update log with success
                self.log_repository.actualizar_estado_log(
                    str(log.id),
                    EstadoSincronizacionEnum.EXITOSO,
                    datos_recibidos={"estado_externo": estado_externo}
                )
                
                self.db.commit()
                return True
                
            except Exception as e:
                # Update log with error
                self.log_repository.actualizar_estado_log(
                    str(log.id),
                    EstadoSincronizacionEnum.ERROR,
                    mensaje_error=str(e)
                )
                
                self.db.commit()
                raise BusinessLogicError(f"Error synchronizing status: {str(e)}")
                
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error in sincronizar_estado: {str(e)}")
    
    async def mapear_campos(self, integracion_id: str, datos_origen: Dict[str, Any], direccion: str = "salida") -> Dict[str, Any]:
        """
        Map fields between local and external systems
        Requirements: 4.8
        """
        integracion = self.repository.get_by_id(integracion_id)
        if not integracion:
            raise NotFoundError(f"Integracion with ID {integracion_id} not found")
        
        if not integracion.mapeos_campos:
            return datos_origen
        
        datos_mapeados = {}
        
        for campo_local, config in integracion.mapeos_campos.items():
            campo_remoto = config.get('campo_remoto', campo_local)
            transformacion = config.get('transformacion')
            valor_defecto = config.get('valor_defecto')
            
            if direccion == "salida":
                # Local to remote mapping
                valor = datos_origen.get(campo_local, valor_defecto)
            else:
                # Remote to local mapping
                valor = datos_origen.get(campo_remoto, valor_defecto)
            
            if valor is not None:
                # Apply transformation if configured
                if transformacion:
                    valor = await self._aplicar_transformacion(valor, transformacion)
                
                if direccion == "salida":
                    datos_mapeados[campo_remoto] = valor
                else:
                    datos_mapeados[campo_local] = valor
        
        return datos_mapeados
    
    async def encriptar_credenciales(self, credenciales: str) -> str:
        """
        Encrypt credentials for storage
        Requirements: 4.1, 4.2
        """
        # This is handled by the model's encriptar_credenciales method
        # This service method is for external use if needed
        integracion_temp = Integracion()
        integracion_temp.encriptar_credenciales(credenciales)
        return integracion_temp.credenciales_encriptadas or ""
    
    async def obtener_log_sincronizacion(self, integracion_id: str, filtros: Optional[FiltrosLogSincronizacion] = None) -> Tuple[List[LogSincronizacionResponse], int]:
        """
        Get synchronization logs for an integration
        Requirements: 4.5, 4.6
        """
        if not filtros:
            filtros = FiltrosLogSincronizacion(integracion_id=integracion_id)
        else:
            filtros.integracion_id = integracion_id
        
        logs, total = self.log_repository.list(filtros)
        
        logs_response = [LogSincronizacionResponse.from_orm(log) for log in logs]
        return logs_response, total
    
    async def listar_integraciones(self, skip: int = 0, limit: int = 100, activas_solo: bool = False) -> List[IntegracionResumen]:
        """
        List integraciones with basic info
        Requirements: 4.1, 4.2
        """
        integraciones = self.repository.list(skip, limit, activas_solo)
        
        integraciones_resumen = []
        for integracion in integraciones:
            resumen = IntegracionResumen.from_orm(integracion)
            # Add statistics
            stats = self.log_repository.get_estadisticas_integracion(str(integracion.id))
            resumen.total_sincronizaciones = stats.get('total_sincronizaciones', 0)
            integraciones_resumen.append(resumen)
        
        return integraciones_resumen
    
    async def obtener_integracion(self, integracion_id: str) -> IntegracionResponse:
        """
        Get integracion by ID with full details
        Requirements: 4.1, 4.2
        """
        integracion = self.repository.get_by_id(integracion_id)
        if not integracion:
            raise NotFoundError(f"Integracion with ID {integracion_id} not found")
        
        return self._enrich_integracion_response(IntegracionResponse.from_orm(integracion))
    
    async def actualizar_integracion(self, integracion_id: str, integracion_data: IntegracionUpdate) -> IntegracionResponse:
        """
        Update integracion
        Requirements: 4.1, 4.2
        """
        try:
            integracion = self.repository.get_by_id(integracion_id)
            if not integracion:
                raise NotFoundError(f"Integracion with ID {integracion_id} not found")
            
            # Prepare update data
            update_dict = integracion_data.dict(exclude_unset=True, exclude_none=True)
            
            # Convert mapeos_campos if provided
            if integracion_data.mapeos_campos:
                update_dict['mapeos_campos'] = {
                    mapeo.campo_local: {
                        'campo_remoto': mapeo.campo_remoto,
                        'transformacion': mapeo.transformacion,
                        'requerido': mapeo.requerido,
                        'tipo_dato': mapeo.tipo_dato,
                        'valor_defecto': mapeo.valor_defecto
                    }
                    for mapeo in integracion_data.mapeos_campos
                }
            
            # Convert webhook configuration if provided
            if integracion_data.configuracion_webhook:
                webhook_config = integracion_data.configuracion_webhook.dict()
                update_dict['webhook_url'] = str(webhook_config['url'])
                update_dict['webhook_eventos'] = webhook_config['eventos']
                update_dict['webhook_secreto'] = webhook_config.get('secreto')
                update_dict.pop('configuracion_webhook', None)
            
            # Update integracion
            integracion_updated = self.repository.update(integracion_id, update_dict)
            
            # Test connection if URL or credentials changed
            if 'url_base' in update_dict or 'credenciales' in update_dict:
                await self._test_connection_async(integracion_updated)
            
            self.db.commit()
            self.db.refresh(integracion_updated)
            
            return self._enrich_integracion_response(IntegracionResponse.from_orm(integracion_updated))
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error updating integracion: {str(e)}")
    
    async def eliminar_integracion(self, integracion_id: str) -> bool:
        """
        Delete integracion
        Requirements: 4.1, 4.2
        """
        try:
            integracion = self.repository.get_by_id(integracion_id)
            if not integracion:
                raise NotFoundError(f"Integracion with ID {integracion_id} not found")
            
            # Check if there are recent synchronizations
            recent_logs = self.log_repository.get_by_integracion(integracion_id, limit=1)
            if recent_logs:
                last_log = recent_logs[0]
                if (datetime.utcnow() - last_log.created_at).days < 30:
                    raise ValidationError("Cannot delete integration with recent synchronizations")
            
            # Delete integracion (this will cascade delete logs)
            success = self.repository.delete(integracion_id)
            
            if success:
                self.db.commit()
            
            return success
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error deleting integracion: {str(e)}")
    
    async def obtener_estadisticas(self, fecha_desde: Optional[datetime] = None, fecha_hasta: Optional[datetime] = None) -> IntegracionEstadisticas:
        """
        Get integration statistics
        Requirements: 4.5, 4.6
        """
        # Set default date range if not provided
        if not fecha_desde:
            fecha_desde = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        if not fecha_hasta:
            fecha_hasta = datetime.utcnow()
        
        stats = self.repository.get_estadisticas(fecha_desde, fecha_hasta)
        
        return IntegracionEstadisticas(
            total_integraciones=stats['total_integraciones'],
            integraciones_activas=stats['integraciones_activas'],
            integraciones_conectadas=stats['integraciones_conectadas'],
            integraciones_con_error=stats['integraciones_con_error'],
            total_sincronizaciones_hoy=stats['total_sincronizaciones'],
            sincronizaciones_exitosas_hoy=stats['sincronizaciones_exitosas'],
            sincronizaciones_fallidas_hoy=stats['sincronizaciones_fallidas'],
            documentos_enviados_hoy=stats['documentos_enviados'],
            documentos_recibidos_hoy=stats['documentos_recibidos'],
            tiempo_promedio_respuesta_ms=stats['tiempo_promedio_respuesta_ms']
        )
    
    # Private helper methods
    
    async def _validate_url_accessibility(self, url: str) -> None:
        """Validate that URL is accessible"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.head(url)
                if response.status_code >= 500:
                    raise ValidationError(f"URL {url} returned server error: {response.status_code}")
        except httpx.RequestError as e:
            raise ValidationError(f"URL {url} is not accessible: {str(e)}")
    
    async def _test_connection_async(self, integracion: Integracion, prueba_data: Optional[ProbarConexion] = None) -> ProbarConexionResponse:
        """Test connection to integration asynchronously"""
        start_time = datetime.utcnow()
        
        try:
            # Update status to testing
            self.repository.actualizar_estado_conexion(str(integracion.id), EstadoConexionEnum.PROBANDO)
            
            # Prepare request
            headers = self._prepare_headers(integracion)
            endpoint = prueba_data.endpoint_prueba if prueba_data and prueba_data.endpoint_prueba else "/health"
            url = urljoin(str(integracion.url_base), endpoint)
            
            # Make request
            async with httpx.AsyncClient(timeout=integracion.timeout_segundos) as client:
                response = await client.get(url, headers=headers)
                
                end_time = datetime.utcnow()
                tiempo_respuesta = int((end_time - start_time).total_seconds() * 1000)
                
                if response.status_code < 400:
                    # Success
                    self.repository.actualizar_estado_conexion(str(integracion.id), EstadoConexionEnum.CONECTADO)
                    
                    return ProbarConexionResponse(
                        exitoso=True,
                        tiempo_respuesta_ms=tiempo_respuesta,
                        codigo_respuesta=response.status_code,
                        mensaje="Connection successful",
                        fecha_prueba=end_time
                    )
                else:
                    # HTTP error
                    error_msg = f"HTTP {response.status_code}: {response.text[:200]}"
                    self.repository.actualizar_estado_conexion(str(integracion.id), EstadoConexionEnum.ERROR, error_msg)
                    
                    return ProbarConexionResponse(
                        exitoso=False,
                        tiempo_respuesta_ms=tiempo_respuesta,
                        codigo_respuesta=response.status_code,
                        mensaje="Connection failed",
                        detalles_error=error_msg,
                        fecha_prueba=end_time
                    )
                    
        except Exception as e:
            end_time = datetime.utcnow()
            tiempo_respuesta = int((end_time - start_time).total_seconds() * 1000)
            error_msg = str(e)
            
            self.repository.actualizar_estado_conexion(str(integracion.id), EstadoConexionEnum.ERROR, error_msg)
            
            return ProbarConexionResponse(
                exitoso=False,
                tiempo_respuesta_ms=tiempo_respuesta,
                mensaje="Connection failed",
                detalles_error=error_msg,
                fecha_prueba=end_time
            )
    
    def _prepare_headers(self, integracion: Integracion) -> Dict[str, str]:
        """Prepare HTTP headers for requests"""
        headers = {"Content-Type": "application/json"}
        
        # Add additional headers
        if integracion.headers_adicionales:
            headers.update(integracion.headers_adicionales)
        
        # Add authentication headers
        if integracion.tipo_autenticacion != TipoAutenticacionEnum.NONE:
            credenciales = integracion.desencriptar_credenciales()
            
            if integracion.tipo_autenticacion == TipoAutenticacionEnum.API_KEY:
                headers["X-API-Key"] = credenciales
            elif integracion.tipo_autenticacion == TipoAutenticacionEnum.BEARER:
                headers["Authorization"] = f"Bearer {credenciales}"
            elif integracion.tipo_autenticacion == TipoAutenticacionEnum.BASIC:
                import base64
                encoded = base64.b64encode(credenciales.encode()).decode()
                headers["Authorization"] = f"Basic {encoded}"
        
        return headers
    
    async def _send_documento_http(self, documento_externo: DocumentoExterno, integracion: Integracion) -> Dict[str, Any]:
        """Send documento via HTTP"""
        headers = self._prepare_headers(integracion)
        url = urljoin(str(integracion.url_base), "/api/v1/documentos")
        
        async with httpx.AsyncClient(timeout=integracion.timeout_segundos) as client:
            response = await client.post(
                url,
                json=documento_externo.dict(),
                headers=headers
            )
            
            if response.status_code >= 400:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
            
            return response.json()
    
    async def _mapear_documento_salida(self, documento, integracion: Integracion) -> DocumentoExterno:
        """Map local documento to external format"""
        # Basic mapping
        documento_externo = DocumentoExterno(
            numero_expediente_externo=documento.numero_expediente,
            tipo_documento=documento.tipo_documento.nombre if documento.tipo_documento else "Documento",
            numero_documento=documento.numero_documento_externo,
            remitente=documento.remitente,
            asunto=documento.asunto,
            numero_folios=documento.numero_folios,
            tiene_anexos=documento.tiene_anexos,
            fecha_documento=documento.fecha_recepcion,
            fecha_recepcion=documento.fecha_recepcion,
            fecha_limite=documento.fecha_limite,
            estado=documento.estado.value,
            prioridad=documento.prioridad.value,
            observaciones=documento.observaciones,
            etiquetas=documento.etiquetas or []
        )
        
        # Apply field mapping if configured
        if integracion.mapeos_campos:
            documento_dict = documento_externo.dict()
            documento_mapeado = await self.mapear_campos(str(integracion.id), documento_dict, "salida")
            documento_externo = DocumentoExterno(**documento_mapeado)
        
        return documento_externo
    
    async def _mapear_documento_entrada(self, documento_externo: DocumentoExterno, integracion: Integracion):
        """Map external documento to local format"""
        from app.schemas.mesa_partes.documento import DocumentoCreate
        
        # Apply field mapping if configured
        documento_dict = documento_externo.dict()
        if integracion.mapeos_campos:
            documento_dict = await self.mapear_campos(str(integracion.id), documento_dict, "entrada")
        
        # Map to local DocumentoCreate schema
        documento_local = DocumentoCreate(
            tipo_documento_id="tipo-documento-default",  # TODO: Map tipo_documento properly
            numero_documento_externo=documento_dict.get('numero_documento'),
            remitente=documento_dict.get('remitente', ''),
            asunto=documento_dict.get('asunto', ''),
            numero_folios=documento_dict.get('numero_folios', 0),
            tiene_anexos=documento_dict.get('tiene_anexos', False),
            fecha_limite=documento_dict.get('fecha_limite'),
            etiquetas=documento_dict.get('etiquetas', []),
            observaciones=documento_dict.get('observaciones'),
            origen_externo=integracion.codigo,
            id_externo=documento_externo.id_externo
        )
        
        return documento_local
    
    async def _consultar_estado_externo(self, documento, integracion: Integracion) -> Optional[str]:
        """Query external system for documento status"""
        headers = self._prepare_headers(integracion)
        url = urljoin(str(integracion.url_base), f"/api/v1/documentos/{documento.id_externo}/estado")
        
        try:
            async with httpx.AsyncClient(timeout=integracion.timeout_segundos) as client:
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get('estado')
                
        except Exception:
            pass
        
        return None
    
    async def _actualizar_estado_local(self, documento_id: str, estado_externo: str) -> None:
        """Update local documento status based on external status"""
        # Map external status to local status
        estado_mapping = {
            'REGISTRADO': 'REGISTRADO',
            'EN_PROCESO': 'EN_PROCESO',
            'ATENDIDO': 'ATENDIDO',
            'ARCHIVADO': 'ARCHIVADO'
        }
        
        estado_local = estado_mapping.get(estado_externo)
        if estado_local:
            self.documento_repository.update(documento_id, {"estado": estado_local})
    
    async def _aplicar_transformacion(self, valor: Any, transformacion: str) -> Any:
        """Apply transformation rule to value"""
        # Simple transformation rules
        if transformacion == "upper":
            return str(valor).upper() if valor else valor
        elif transformacion == "lower":
            return str(valor).lower() if valor else valor
        elif transformacion.startswith("prefix:"):
            prefix = transformacion.split(":", 1)[1]
            return f"{prefix}{valor}" if valor else valor
        elif transformacion.startswith("suffix:"):
            suffix = transformacion.split(":", 1)[1]
            return f"{valor}{suffix}" if valor else valor
        
        return valor
    
    async def _schedule_retry(self, log: LogSincronizacion, integracion: Integracion) -> None:
        """Schedule retry for failed synchronization"""
        fecha_reintento = datetime.utcnow() + timedelta(minutes=integracion.intervalo_reintento_minutos)
        self.log_repository.marcar_para_reintento(str(log.id), fecha_reintento)
    
    def _enrich_integracion_response(self, integracion: IntegracionResponse) -> IntegracionResponse:
        """Enrich integracion response with additional data"""
        # Add statistics
        stats = self.log_repository.get_estadisticas_integracion(integracion.id)
        integracion.total_sincronizaciones = stats.get('total_sincronizaciones', 0)
        integracion.sincronizaciones_exitosas = stats.get('sincronizaciones_exitosas', 0)
        integracion.sincronizaciones_fallidas = stats.get('sincronizaciones_fallidas', 0)
        
        return integracion