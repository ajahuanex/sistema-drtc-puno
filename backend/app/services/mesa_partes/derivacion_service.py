"""
Service layer for Derivacion operations
Handles business logic for document derivation in Mesa de Partes
"""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid

from app.models.mesa_partes.derivacion import Derivacion, EstadoDerivacionEnum
from app.models.mesa_partes.documento import Documento, EstadoDocumentoEnum
from app.schemas.mesa_partes.derivacion import (
    DerivacionCreate, DerivacionUpdate, DerivacionResponse, DerivacionResumen,
    FiltrosDerivacion, DerivacionEstadisticas, DerivacionHistorial,
    DerivacionRecibir, DerivacionAtender, DerivacionMasiva, DerivacionMasivaResponse
)
from app.repositories.mesa_partes.derivacion_repository import DerivacionRepository
from app.repositories.mesa_partes.documento_repository import DocumentoRepository
from app.utils.exceptions import NotFoundError, ValidationError, BusinessLogicError


class DerivacionService:
    """Service for derivacion business logic"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DerivacionRepository(db)
        self.documento_repository = DocumentoRepository(db)
    
    async def derivar_documento(self, derivacion_data: DerivacionCreate, usuario_id: str) -> DerivacionResponse:
        """
        Derive documento to another area
        Requirements: 3.1, 3.2, 3.3
        """
        try:
            # Validate documento exists and can be derived
            documento = await self._validate_documento_for_derivation(derivacion_data.documento_id)
            
            # Get user's area as origen
            area_origen_id = await self._get_user_area(usuario_id)
            if not area_origen_id:
                raise ValidationError("User area not found")
            
            # Validate permissions
            await self._validate_derivation_permissions(documento, usuario_id, area_origen_id)
            
            # Handle multiple areas if specified
            if derivacion_data.areas_destino_ids:
                return await self._derivar_multiple_areas(derivacion_data, usuario_id, area_origen_id)
            
            # Validate area_destino exists
            await self._validate_area_exists(derivacion_data.area_destino_id)
            
            # Prepare derivacion data
            derivacion_dict = derivacion_data.dict(exclude={'areas_destino_ids'}, exclude_unset=True)
            derivacion_dict.update({
                "area_origen_id": area_origen_id,
                "usuario_deriva_id": usuario_id,
                "fecha_derivacion": datetime.utcnow()
            })
            
            # Create derivacion
            derivacion = self.repository.create(derivacion_dict)
            
            # Update documento estado and area
            await self._update_documento_after_derivation(documento, derivacion_data.area_destino_id)
            
            # Send notification
            await self._send_derivation_notification(derivacion)
            
            # Commit transaction
            self.db.commit()
            self.db.refresh(derivacion)
            
            return self._enrich_derivacion_response(DerivacionResponse.from_orm(derivacion))
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error deriving documento: {str(e)}")
    
    async def recibir_documento(self, derivacion_id: str, recepcion_data: DerivacionRecibir, usuario_id: str) -> DerivacionResponse:
        """
        Receive a derived documento
        Requirements: 3.4, 3.5
        """
        try:
            # Get derivacion
            derivacion = self.repository.get_by_id(derivacion_id)
            if not derivacion:
                raise NotFoundError(f"Derivacion with ID {derivacion_id} not found")
            
            # Validate permissions
            await self._validate_reception_permissions(derivacion, usuario_id)
            
            # Validate current state
            if derivacion.estado != EstadoDerivacionEnum.PENDIENTE:
                raise ValidationError("Derivacion is not in PENDIENTE state")
            
            # Update derivacion
            derivacion_updated = self.repository.recibir_derivacion(
                derivacion_id,
                usuario_id,
                recepcion_data.observaciones_recepcion,
                recepcion_data.acepta_derivacion,
                recepcion_data.motivo_rechazo
            )
            
            # If rejected, return documento to previous area
            if not recepcion_data.acepta_derivacion:
                await self._handle_derivation_rejection(derivacion)
            
            # Send notification
            await self._send_reception_notification(derivacion_updated, recepcion_data.acepta_derivacion)
            
            self.db.commit()
            self.db.refresh(derivacion_updated)
            
            return self._enrich_derivacion_response(DerivacionResponse.from_orm(derivacion_updated))
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error receiving documento: {str(e)}")
    
    async def obtener_historial(self, documento_id: str) -> DerivacionHistorial:
        """
        Get complete derivation history for a documento
        Requirements: 3.5, 3.6
        """
        # Validate documento exists
        documento = self.documento_repository.get_by_id(documento_id)
        if not documento:
            raise NotFoundError(f"Documento with ID {documento_id} not found")
        
        # Get all derivaciones
        derivaciones = self.repository.get_historial_documento(documento_id)
        
        # Enrich responses
        derivaciones_response = [
            self._enrich_derivacion_response(DerivacionResponse.from_orm(d)) 
            for d in derivaciones
        ]
        
        # Get current derivacion
        derivacion_actual = self.repository.get_derivacion_actual(documento_id)
        derivacion_actual_response = None
        if derivacion_actual:
            derivacion_actual_response = self._enrich_derivacion_response(
                DerivacionResponse.from_orm(derivacion_actual)
            )
        
        # Calculate involved areas
        areas_involucradas = list(set([d.area_origen_id for d in derivaciones] + 
                                    [d.area_destino_id for d in derivaciones]))
        
        # Calculate total process time
        tiempo_total = None
        if derivaciones:
            primera_derivacion = min(derivaciones, key=lambda x: x.fecha_derivacion)
            ultima_atencion = max([d for d in derivaciones if d.fecha_atencion], 
                                key=lambda x: x.fecha_atencion, default=None)
            
            if ultima_atencion:
                tiempo_total = (ultima_atencion.fecha_atencion - primera_derivacion.fecha_derivacion).days
        
        return DerivacionHistorial(
            derivaciones=derivaciones_response,
            total_derivaciones=len(derivaciones),
            derivacion_actual=derivacion_actual_response,
            areas_involucradas=areas_involucradas,
            tiempo_total_proceso_dias=tiempo_total
        )
    
    async def obtener_documentos_area(self, area_id: str, estado: Optional[EstadoDerivacionEnum] = None, usuario_id: Optional[str] = None) -> List[DerivacionResumen]:
        """
        Get documentos in an area
        Requirements: 3.4, 3.7
        """
        # Validate permissions
        if usuario_id:
            await self._validate_area_access_permissions(area_id, usuario_id)
        
        # Get derivaciones
        derivaciones = self.repository.get_by_area(area_id, estado)
        
        # Convert to resumen and enrich
        derivaciones_resumen = []
        for derivacion in derivaciones:
            resumen = DerivacionResumen.from_orm(derivacion)
            resumen = self._enrich_derivacion_resumen(resumen)
            derivaciones_resumen.append(resumen)
        
        return derivaciones_resumen
    
    async def registrar_atencion(self, derivacion_id: str, atencion_data: DerivacionAtender, usuario_id: str) -> DerivacionResponse:
        """
        Register attention to a derivacion
        Requirements: 3.8
        """
        try:
            # Get derivacion
            derivacion = self.repository.get_by_id(derivacion_id)
            if not derivacion:
                raise NotFoundError(f"Derivacion with ID {derivacion_id} not found")
            
            # Validate permissions
            await self._validate_attention_permissions(derivacion, usuario_id)
            
            # Validate current state
            if derivacion.estado not in [EstadoDerivacionEnum.PENDIENTE, EstadoDerivacionEnum.RECIBIDO]:
                raise ValidationError("Derivacion cannot be attended in current state")
            
            # Update derivacion
            derivacion_updated = self.repository.atender_derivacion(
                derivacion_id,
                usuario_id,
                atencion_data.observaciones_atencion
            )
            
            # Update documento estado
            await self._update_documento_after_attention(derivacion.documento_id)
            
            # Handle additional derivation if needed
            if atencion_data.requiere_derivacion_adicional and atencion_data.area_siguiente_id:
                await self._create_additional_derivation(
                    derivacion.documento_id,
                    atencion_data.area_siguiente_id,
                    atencion_data.instrucciones_siguiente,
                    usuario_id
                )
            
            # Send notification
            await self._send_attention_notification(derivacion_updated)
            
            self.db.commit()
            self.db.refresh(derivacion_updated)
            
            return self._enrich_derivacion_response(DerivacionResponse.from_orm(derivacion_updated))
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error registering attention: {str(e)}")
    
    async def validar_permisos_derivacion(self, documento_id: str, usuario_id: str) -> bool:
        """
        Validate if user can derive a documento
        Requirements: 7.1, 7.2, 7.3
        """
        try:
            documento = self.documento_repository.get_by_id(documento_id)
            if not documento:
                return False
            
            user_area = await self._get_user_area(usuario_id)
            if not user_area:
                return False
            
            # User can derive if:
            # 1. Document is in their area
            # 2. They are the one who registered it
            # 3. They have admin permissions
            return (
                documento.area_actual_id == user_area or
                documento.usuario_registro_id == usuario_id or
                await self._is_admin_user(usuario_id)
            )
            
        except Exception:
            return False
    
    async def obtener_derivaciones_vencidas(self, area_id: Optional[str] = None) -> List[DerivacionResumen]:
        """
        Get expired derivaciones
        Requirements: 8.2, 8.3
        """
        derivaciones = self.repository.get_derivaciones_vencidas()
        
        # Filter by area if specified
        if area_id:
            derivaciones = [d for d in derivaciones if d.area_destino_id == area_id]
        
        # Convert to resumen and enrich
        return [
            self._enrich_derivacion_resumen(DerivacionResumen.from_orm(d))
            for d in derivaciones
        ]
    
    async def obtener_derivaciones_urgentes_pendientes(self, area_id: Optional[str] = None) -> List[DerivacionResumen]:
        """
        Get urgent pending derivaciones
        Requirements: 8.3
        """
        derivaciones = self.repository.get_derivaciones_urgentes_pendientes()
        
        # Filter by area if specified
        if area_id:
            derivaciones = [d for d in derivaciones if d.area_destino_id == area_id]
        
        # Convert to resumen and enrich
        return [
            self._enrich_derivacion_resumen(DerivacionResumen.from_orm(d))
            for d in derivaciones
        ]
    
    async def obtener_derivaciones_por_atender(self, area_id: str, dias_limite: int = 3) -> List[DerivacionResumen]:
        """
        Get derivaciones that need attention soon
        Requirements: 8.2, 8.3
        """
        derivaciones = self.repository.get_derivaciones_por_atender(area_id, dias_limite)
        
        # Convert to resumen and enrich
        return [
            self._enrich_derivacion_resumen(DerivacionResumen.from_orm(d))
            for d in derivaciones
        ]
    
    async def listar_derivaciones(self, filtros: FiltrosDerivacion, usuario_id: Optional[str] = None) -> Tuple[List[DerivacionResumen], int]:
        """
        List derivaciones with filters and pagination
        Requirements: 3.5, 3.6
        """
        # Apply user-based filters if not admin
        if usuario_id and not await self._is_admin_user(usuario_id):
            user_area = await self._get_user_area(usuario_id)
            if not filtros.area_destino_id and not filtros.area_origen_id:
                filtros.area_destino_id = user_area
        
        derivaciones, total = self.repository.list(filtros, include_relations=True)
        
        # Convert to resumen and enrich
        derivaciones_resumen = [
            self._enrich_derivacion_resumen(DerivacionResumen.from_orm(d))
            for d in derivaciones
        ]
        
        return derivaciones_resumen, total
    
    async def obtener_estadisticas(self, area_id: Optional[str] = None, 
                                 fecha_desde: Optional[datetime] = None,
                                 fecha_hasta: Optional[datetime] = None) -> DerivacionEstadisticas:
        """
        Get derivacion statistics
        Requirements: 6.1, 6.2, 6.3
        """
        stats = self.repository.get_estadisticas(area_id, fecha_desde, fecha_hasta)
        
        # Add additional calculations
        stats["derivaciones_por_area"] = await self._get_derivaciones_por_area_stats(fecha_desde, fecha_hasta)
        stats["tiempo_promedio_recepcion_horas"] = await self._calcular_tiempo_promedio_recepcion(area_id, fecha_desde, fecha_hasta)
        
        return DerivacionEstadisticas(**stats)
    
    async def derivacion_masiva(self, derivacion_data: DerivacionMasiva, usuario_id: str) -> DerivacionMasivaResponse:
        """
        Derive multiple documentos to the same area
        Requirements: 3.1, 3.2
        """
        try:
            area_origen_id = await self._get_user_area(usuario_id)
            if not area_origen_id:
                raise ValidationError("User area not found")
            
            # Validate area_destino exists
            await self._validate_area_exists(derivacion_data.area_destino_id)
            
            derivaciones_exitosas = 0
            derivaciones_fallidas = 0
            errores = []
            derivaciones_creadas = []
            
            for documento_id in derivacion_data.documentos_ids:
                try:
                    # Create individual derivacion
                    derivacion_individual = DerivacionCreate(
                        documento_id=documento_id,
                        area_destino_id=derivacion_data.area_destino_id,
                        instrucciones=derivacion_data.instrucciones,
                        fecha_limite_atencion=derivacion_data.fecha_limite_atencion,
                        es_urgente=derivacion_data.es_urgente,
                        requiere_respuesta=derivacion_data.requiere_respuesta
                    )
                    
                    derivacion_response = await self.derivar_documento(derivacion_individual, usuario_id)
                    derivaciones_creadas.append(derivacion_response.id)
                    derivaciones_exitosas += 1
                    
                except Exception as e:
                    derivaciones_fallidas += 1
                    errores.append({
                        "documento_id": documento_id,
                        "error": str(e)
                    })
            
            return DerivacionMasivaResponse(
                total_documentos=len(derivacion_data.documentos_ids),
                derivaciones_exitosas=derivaciones_exitosas,
                derivaciones_fallidas=derivaciones_fallidas,
                errores=errores,
                derivaciones_creadas=derivaciones_creadas
            )
            
        except Exception as e:
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error in massive derivation: {str(e)}")
    
    # Private helper methods
    
    async def _validate_documento_for_derivation(self, documento_id: str) -> Documento:
        """Validate documento exists and can be derived"""
        documento = self.documento_repository.get_by_id(documento_id)
        if not documento:
            raise NotFoundError(f"Documento with ID {documento_id} not found")
        
        if documento.estado == EstadoDocumentoEnum.ARCHIVADO:
            raise ValidationError("Cannot derive archived documento")
        
        return documento
    
    async def _validate_derivation_permissions(self, documento: Documento, usuario_id: str, area_origen_id: str) -> None:
        """Validate user can derive documento"""
        # Check if documento is in user's area or user registered it
        if documento.area_actual_id != area_origen_id and documento.usuario_registro_id != usuario_id:
            if not await self._is_admin_user(usuario_id):
                raise ValidationError("No permission to derive this documento")
    
    async def _validate_reception_permissions(self, derivacion: Derivacion, usuario_id: str) -> None:
        """Validate user can receive derivacion"""
        user_area = await self._get_user_area(usuario_id)
        if derivacion.area_destino_id != user_area and not await self._is_admin_user(usuario_id):
            raise ValidationError("No permission to receive this derivacion")
    
    async def _validate_attention_permissions(self, derivacion: Derivacion, usuario_id: str) -> None:
        """Validate user can attend derivacion"""
        user_area = await self._get_user_area(usuario_id)
        if derivacion.area_destino_id != user_area and not await self._is_admin_user(usuario_id):
            raise ValidationError("No permission to attend this derivacion")
    
    async def _validate_area_access_permissions(self, area_id: str, usuario_id: str) -> None:
        """Validate user can access area documents"""
        user_area = await self._get_user_area(usuario_id)
        if area_id != user_area and not await self._is_admin_user(usuario_id):
            raise ValidationError("No permission to access this area's documents")
    
    async def _validate_area_exists(self, area_id: str) -> None:
        """Validate that area exists"""
        # TODO: Implement area validation
        pass
    
    async def _update_documento_after_derivation(self, documento: Documento, area_destino_id: str) -> None:
        """Update documento after derivation"""
        self.documento_repository.update(str(documento.id), {
            "estado": EstadoDocumentoEnum.EN_PROCESO,
            "area_actual_id": area_destino_id
        })
    
    async def _update_documento_after_attention(self, documento_id: str) -> None:
        """Update documento after attention"""
        # Check if there are more pending derivaciones
        derivacion_actual = self.repository.get_derivacion_actual(documento_id)
        
        if not derivacion_actual:
            # No more pending derivaciones, mark as attended
            self.documento_repository.update(documento_id, {
                "estado": EstadoDocumentoEnum.ATENDIDO
            })
    
    async def _handle_derivation_rejection(self, derivacion: Derivacion) -> None:
        """Handle when a derivation is rejected"""
        # Return documento to previous area
        self.documento_repository.update(str(derivacion.documento_id), {
            "area_actual_id": derivacion.area_origen_id,
            "estado": EstadoDocumentoEnum.EN_PROCESO
        })
    
    async def _create_additional_derivation(self, documento_id: str, area_siguiente_id: str, 
                                          instrucciones: Optional[str], usuario_id: str) -> None:
        """Create additional derivation after attention"""
        area_origen_id = await self._get_user_area(usuario_id)
        
        derivacion_adicional = DerivacionCreate(
            documento_id=documento_id,
            area_destino_id=area_siguiente_id,
            instrucciones=instrucciones
        )
        
        await self.derivar_documento(derivacion_adicional, usuario_id)
    
    async def _derivar_multiple_areas(self, derivacion_data: DerivacionCreate, usuario_id: str, area_origen_id: str) -> DerivacionResponse:
        """Handle derivation to multiple areas"""
        # For now, create separate derivations for each area
        # Return the first one as main response
        derivaciones_creadas = []
        
        for area_id in derivacion_data.areas_destino_ids:
            derivacion_individual = DerivacionCreate(
                documento_id=derivacion_data.documento_id,
                area_destino_id=area_id,
                instrucciones=derivacion_data.instrucciones,
                fecha_limite_atencion=derivacion_data.fecha_limite_atencion,
                es_urgente=derivacion_data.es_urgente,
                requiere_respuesta=derivacion_data.requiere_respuesta,
                es_copia=True  # Mark as copy for additional areas
            )
            
            # Create derivacion
            derivacion_dict = derivacion_individual.dict(exclude={'areas_destino_ids'}, exclude_unset=True)
            derivacion_dict.update({
                "area_origen_id": area_origen_id,
                "usuario_deriva_id": usuario_id,
                "fecha_derivacion": datetime.utcnow()
            })
            
            derivacion = self.repository.create(derivacion_dict)
            derivaciones_creadas.append(derivacion)
        
        # Return first derivacion as main response
        return self._enrich_derivacion_response(DerivacionResponse.from_orm(derivaciones_creadas[0]))
    
    def _enrich_derivacion_response(self, derivacion: DerivacionResponse) -> DerivacionResponse:
        """Enrich derivacion response with calculated fields"""
        now = datetime.utcnow()
        
        # Calculate dias_transcurridos
        derivacion.dias_transcurridos = (now - derivacion.fecha_derivacion).days
        
        # Calculate dias_restantes and esta_vencida
        if derivacion.fecha_limite_atencion:
            dias_restantes = (derivacion.fecha_limite_atencion - now).days
            derivacion.dias_restantes = max(0, dias_restantes)
            derivacion.esta_vencida = dias_restantes < 0
        
        return derivacion
    
    def _enrich_derivacion_resumen(self, derivacion: DerivacionResumen) -> DerivacionResumen:
        """Enrich derivacion resumen with calculated fields"""
        now = datetime.utcnow()
        
        # Calculate dias_restantes and esta_vencida
        if derivacion.fecha_limite_atencion:
            dias_restantes = (derivacion.fecha_limite_atencion - now).days
            derivacion.dias_restantes = max(0, dias_restantes)
            derivacion.esta_vencida = dias_restantes < 0
        
        return derivacion
    
    async def _send_derivation_notification(self, derivacion: Derivacion) -> None:
        """Send notification for new derivation"""
        # TODO: Implement notification sending
        pass
    
    async def _send_reception_notification(self, derivacion: Derivacion, acepta: bool) -> None:
        """Send notification for derivation reception"""
        # TODO: Implement notification sending
        pass
    
    async def _send_attention_notification(self, derivacion: Derivacion) -> None:
        """Send notification for derivation attention"""
        # TODO: Implement notification sending
        pass
    
    async def _get_user_area(self, usuario_id: str) -> Optional[str]:
        """Get user's area ID"""
        # TODO: Implement proper user area lookup
        return "area-default"
    
    async def _is_admin_user(self, usuario_id: str) -> bool:
        """Check if user is admin"""
        # TODO: Implement proper user role checking
        return False
    
    async def _get_derivaciones_por_area_stats(self, fecha_desde: Optional[datetime] = None, 
                                             fecha_hasta: Optional[datetime] = None) -> Dict[str, int]:
        """Get derivaciones count by area"""
        # TODO: Implement area statistics
        return {}
    
    async def _calcular_tiempo_promedio_recepcion(self, area_id: Optional[str] = None,
                                                fecha_desde: Optional[datetime] = None,
                                                fecha_hasta: Optional[datetime] = None) -> Optional[float]:
        """Calculate average reception time in hours"""
        # TODO: Implement calculation
        return None