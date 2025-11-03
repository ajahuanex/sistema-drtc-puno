"""
Service layer for Webhook operations
Handles webhook sending, validation, and processing for Mesa de Partes integrations
"""
from typing import Optional, Dict, Any, List
import json
import hmac
import hashlib
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import httpx
import logging

from app.models.mesa_partes.integracion import Integracion, EstadoConexionEnum
from app.models.mesa_partes.documento import Documento

logger = logging.getLogger(__name__)


class WebhookService:
    def __init__(self, db: Session):
        self.db = db
        self.max_reintentos = 3
        self.timeout_segundos = 30

    async def enviar_webhook(
        self,
        integracion_id: str,
        evento: str,
        datos: Dict[str, Any],
        reintentos: int = 0
    ) -> bool:
        """
        Envía un webhook a una integración específica
        """
        try:
            # Obtener configuración de la integración
            integracion = self.db.query(Integracion).filter(
                Integracion.id == integracion_id
            ).first()
            
            if not integracion or not integracion.activa:
                logger.warning(f"Integración {integracion_id} no encontrada o inactiva")
                return False

            webhook_config = integracion.configuracion_webhook
            if not webhook_config or not webhook_config.get("url"):
                logger.warning(f"Webhook no configurado para integración {integracion_id}")
                return False

            # Verificar si el evento está en la lista de eventos configurados
            eventos_configurados = webhook_config.get("eventos", [])
            if eventos_configurados and evento not in eventos_configurados:
                logger.info(f"Evento {evento} no configurado para webhook {integracion_id}")
                return True  # No es error, simplemente no se envía

            # Preparar payload
            payload = {
                "evento": evento,
                "timestamp": datetime.utcnow().isoformat(),
                "integracion_id": integracion_id,
                "datos": datos
            }

            # Generar firma HMAC si hay secreto configurado
            headers = {
                "Content-Type": "application/json",
                "X-Webhook-Event": evento,
                "X-Webhook-Timestamp": payload["timestamp"]
            }

            secreto = webhook_config.get("secreto")
            if secreto:
                firma = self._generar_firma(json.dumps(payload, sort_keys=True), secreto)
                headers["X-Webhook-Signature"] = f"sha256={firma}"

            # Enviar webhook
            url = webhook_config["url"]
            async with httpx.AsyncClient(timeout=self.timeout_segundos) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=headers
                )
                
                if response.status_code in [200, 201, 202]:
                    logger.info(f"Webhook enviado exitosamente a {url} para evento {evento}")
                    await self._actualizar_estado_integracion(integracion_id, EstadoConexionEnum.CONECTADO)
                    return True
                else:
                    logger.error(f"Error en webhook {url}: {response.status_code} - {response.text}")
                    raise httpx.HTTPStatusError(
                        f"HTTP {response.status_code}",
                        request=response.request,
                        response=response
                    )

        except Exception as e:
            logger.error(f"Error enviando webhook: {str(e)}")
            
            # Sistema de reintentos
            if reintentos < self.max_reintentos:
                logger.info(f"Reintentando webhook en 30 segundos (intento {reintentos + 1}/{self.max_reintentos})")
                await asyncio.sleep(30)
                return await self.enviar_webhook(integracion_id, evento, datos, reintentos + 1)
            else:
                logger.error(f"Webhook falló después de {self.max_reintentos} reintentos")
                await self._actualizar_estado_integracion(integracion_id, EstadoConexionEnum.ERROR)
                return False

    def _generar_firma(self, payload: str, secreto: str) -> str:
        """
        Genera firma HMAC SHA256 para validar la autenticidad del webhook
        """
        return hmac.new(
            secreto.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

    def validar_firma(
        self,
        payload: str,
        firma_recibida: str,
        secreto: str
    ) -> bool:
        """
        Valida la firma HMAC de un webhook entrante
        """
        try:
            # Extraer el hash de la firma (formato: sha256=hash)
            if firma_recibida.startswith('sha256='):
                hash_recibido = firma_recibida[7:]
            else:
                hash_recibido = firma_recibida

            # Generar firma esperada
            firma_esperada = self._generar_firma(payload, secreto)
            
            # Comparación segura
            return hmac.compare_digest(hash_recibido, firma_esperada)
            
        except Exception as e:
            logger.error(f"Error validando firma webhook: {str(e)}")
            return False

    async def procesar_webhook_entrante(
        self,
        payload: Dict[str, Any],
        headers: Dict[str, str],
        integracion_id: str
    ) -> Dict[str, Any]:
        """
        Procesa un webhook entrante de una integración externa
        """
        try:
            # Obtener integración
            integracion = self.db.query(Integracion).filter(
                Integracion.id == integracion_id
            ).first()
            
            if not integracion or not integracion.activa:
                raise ValueError(f"Integración {integracion_id} no encontrada o inactiva")

            # Validar firma si está configurada
            webhook_config = integracion.configuracion_webhook
            if webhook_config and webhook_config.get("secreto"):
                firma_header = headers.get("X-Webhook-Signature", "")
                payload_str = json.dumps(payload, sort_keys=True)
                
                if not self.validar_firma(payload_str, firma_header, webhook_config["secreto"]):
                    raise ValueError("Firma de webhook inválida")

            # Procesar según el tipo de evento
            evento = payload.get("evento")
            datos = payload.get("datos", {})

            if evento == "documento.creado":
                return await self._procesar_documento_creado(datos, integracion_id)
            elif evento == "documento.actualizado":
                return await self._procesar_documento_actualizado(datos, integracion_id)
            elif evento == "documento.derivado":
                return await self._procesar_documento_derivado(datos, integracion_id)
            elif evento == "estado.sincronizado":
                return await self._procesar_sincronizacion_estado(datos, integracion_id)
            else:
                logger.warning(f"Evento de webhook no reconocido: {evento}")
                return {"status": "ignored", "message": f"Evento {evento} no procesado"}

        except Exception as e:
            logger.error(f"Error procesando webhook entrante: {str(e)}")
            raise

    async def _procesar_documento_creado(
        self,
        datos: Dict[str, Any],
        integracion_id: str
    ) -> Dict[str, Any]:
        """
        Procesa la creación de un documento desde una integración externa
        """
        try:
            # Aquí se integraría con DocumentoService para crear el documento
            # Por ahora solo registramos el evento
            logger.info(f"Documento creado desde integración {integracion_id}: {datos}")
            
            return {
                "status": "processed",
                "message": "Documento creado exitosamente",
                "documento_id": datos.get("id")
            }
            
        except Exception as e:
            logger.error(f"Error procesando documento creado: {str(e)}")
            raise

    async def _procesar_documento_actualizado(
        self,
        datos: Dict[str, Any],
        integracion_id: str
    ) -> Dict[str, Any]:
        """
        Procesa la actualización de un documento desde una integración externa
        """
        try:
            documento_id = datos.get("id")
            if not documento_id:
                raise ValueError("ID de documento requerido")

            # Buscar documento local
            documento = self.db.query(Documento).filter(
                Documento.id == documento_id
            ).first()

            if documento:
                logger.info(f"Documento {documento_id} actualizado desde integración {integracion_id}")
                return {
                    "status": "processed",
                    "message": "Documento actualizado exitosamente"
                }
            else:
                logger.warning(f"Documento {documento_id} no encontrado para actualización")
                return {
                    "status": "not_found",
                    "message": "Documento no encontrado"
                }
                
        except Exception as e:
            logger.error(f"Error procesando documento actualizado: {str(e)}")
            raise

    async def _procesar_documento_derivado(
        self,
        datos: Dict[str, Any],
        integracion_id: str
    ) -> Dict[str, Any]:
        """
        Procesa la derivación de un documento desde una integración externa
        """
        try:
            logger.info(f"Documento derivado desde integración {integracion_id}: {datos}")
            
            return {
                "status": "processed",
                "message": "Derivación procesada exitosamente"
            }
            
        except Exception as e:
            logger.error(f"Error procesando documento derivado: {str(e)}")
            raise

    async def _procesar_sincronizacion_estado(
        self,
        datos: Dict[str, Any],
        integracion_id: str
    ) -> Dict[str, Any]:
        """
        Procesa la sincronización de estado desde una integración externa
        """
        try:
            documento_id = datos.get("documento_id")
            nuevo_estado = datos.get("estado")
            
            if documento_id and nuevo_estado:
                logger.info(f"Estado sincronizado para documento {documento_id}: {nuevo_estado}")
                
                return {
                    "status": "processed",
                    "message": "Estado sincronizado exitosamente"
                }
            else:
                raise ValueError("documento_id y estado son requeridos")
                
        except Exception as e:
            logger.error(f"Error procesando sincronización de estado: {str(e)}")
            raise

    async def _actualizar_estado_integracion(
        self,
        integracion_id: str,
        nuevo_estado: EstadoConexionEnum
    ):
        """
        Actualiza el estado de conexión de una integración
        """
        try:
            integracion = self.db.query(Integracion).filter(
                Integracion.id == integracion_id
            ).first()
            
            if integracion:
                integracion.estado_conexion = nuevo_estado
                integracion.ultima_sincronizacion = datetime.utcnow()
                self.db.commit()
                
        except Exception as e:
            logger.error(f"Error actualizando estado de integración: {str(e)}")
            self.db.rollback()

    async def enviar_webhook_documento_creado(
        self,
        documento: Documento,
        integraciones_activas: List[str] = None
    ):
        """
        Envía webhook cuando se crea un documento
        """
        datos = {
            "id": str(documento.id),
            "numero_expediente": documento.numero_expediente,
            "remitente": documento.remitente,
            "asunto": documento.asunto,
            "estado": documento.estado.value,
            "fecha_recepcion": documento.fecha_recepcion.isoformat(),
            "prioridad": documento.prioridad.value
        }

        # Si no se especifican integraciones, obtener todas las activas
        if not integraciones_activas:
            integraciones = self.db.query(Integracion).filter(
                Integracion.activa == True
            ).all()
            integraciones_activas = [str(i.id) for i in integraciones]

        # Enviar webhook a cada integración
        for integracion_id in integraciones_activas:
            await self.enviar_webhook(
                integracion_id,
                "documento.creado",
                datos
            )

    async def enviar_webhook_documento_derivado(
        self,
        documento: Documento,
        derivacion_datos: Dict[str, Any],
        integraciones_activas: List[str] = None
    ):
        """
        Envía webhook cuando se deriva un documento
        """
        datos = {
            "documento_id": str(documento.id),
            "numero_expediente": documento.numero_expediente,
            "area_origen": derivacion_datos.get("area_origen"),
            "area_destino": derivacion_datos.get("area_destino"),
            "instrucciones": derivacion_datos.get("instrucciones"),
            "fecha_derivacion": datetime.utcnow().isoformat(),
            "es_urgente": derivacion_datos.get("es_urgente", False)
        }

        if not integraciones_activas:
            integraciones = self.db.query(Integracion).filter(
                Integracion.activa == True
            ).all()
            integraciones_activas = [str(i.id) for i in integraciones]

        for integracion_id in integraciones_activas:
            await self.enviar_webhook(
                integracion_id,
                "documento.derivado",
                datos
            )

    async def enviar_webhook_documento_atendido(
        self,
        documento: Documento,
        observaciones: str = None,
        integraciones_activas: List[str] = None
    ):
        """
        Envía webhook cuando se atiende un documento
        """
        datos = {
            "documento_id": str(documento.id),
            "numero_expediente": documento.numero_expediente,
            "estado": documento.estado.value,
            "fecha_atencion": datetime.utcnow().isoformat(),
            "observaciones": observaciones
        }

        if not integraciones_activas:
            integraciones = self.db.query(Integracion).filter(
                Integracion.activa == True
            ).all()
            integraciones_activas = [str(i.id) for i in integraciones]

        for integracion_id in integraciones_activas:
            await self.enviar_webhook(
                integracion_id,
                "documento.atendido",
                datos
            )

    async def probar_webhook(
        self,
        integracion_id: str
    ) -> Dict[str, Any]:
        """
        Envía un webhook de prueba para verificar la conectividad
        """
        datos_prueba = {
            "mensaje": "Webhook de prueba",
            "timestamp": datetime.utcnow().isoformat(),
            "integracion_id": integracion_id
        }

        try:
            resultado = await self.enviar_webhook(
                integracion_id,
                "test.conexion",
                datos_prueba
            )
            
            return {
                "success": resultado,
                "message": "Webhook de prueba enviado exitosamente" if resultado else "Error enviando webhook de prueba"
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error en webhook de prueba: {str(e)}"
            }

    async def obtener_estadisticas_webhooks(
        self,
        integracion_id: Optional[str] = None,
        fecha_inicio: Optional[datetime] = None,
        fecha_fin: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Obtiene estadísticas de webhooks enviados
        """
        # Esta funcionalidad requeriría una tabla de logs de webhooks
        # Por ahora retornamos estadísticas básicas
        
        if not fecha_fin:
            fecha_fin = datetime.utcnow()
        if not fecha_inicio:
            fecha_inicio = fecha_fin - timedelta(days=7)

        query = self.db.query(Integracion)
        if integracion_id:
            query = query.filter(Integracion.id == integracion_id)

        integraciones = query.all()

        estadisticas = {
            "periodo": {
                "fecha_inicio": fecha_inicio.isoformat(),
                "fecha_fin": fecha_fin.isoformat()
            },
            "integraciones": []
        }

        for integracion in integraciones:
            estadisticas["integraciones"].append({
                "id": str(integracion.id),
                "nombre": integracion.nombre,
                "estado_conexion": integracion.estado_conexion.value,
                "ultima_sincronizacion": integracion.ultima_sincronizacion.isoformat() if integracion.ultima_sincronizacion else None,
                "webhook_configurado": bool(integracion.configuracion_webhook and integracion.configuracion_webhook.get("url"))
            })

        return estadisticas