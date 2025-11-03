"""
Service layer for Notificacion operations
Handles business logic for notifications and alerts in Mesa de Partes
"""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text
from datetime import datetime, timedelta
import uuid
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
import os

from app.models.mesa_partes.notificacion import (
    Notificacion, Alerta,
    TipoNotificacionEnum, EstadoNotificacionEnum, PrioridadNotificacionEnum,
    TipoAlertaEnum
)
from app.repositories.mesa_partes.base_repository import BaseRepository
from app.utils.exceptions import NotFoundError, ValidationError, BusinessLogicError


class NotificacionRepository(BaseRepository[Notificacion]):
    """Repository for Notificacion operations"""
    
    def __init__(self, db: Session):
        super().__init__(db, Notificacion)
    
    def get_by_usuario(self, usuario_id: str, estado: Optional[EstadoNotificacionEnum] = None,
                      limit: int = 50, offset: int = 0) -> List[Notificacion]:
        """Get notifications by user"""
        query = self.db.query(Notificacion).filter(Notificacion.usuario_id == usuario_id)
        
        if estado:
            query = query.filter(Notificacion.estado == estado)
        
        return query.order_by(Notificacion.created_at.desc()).offset(offset).limit(limit).all()
    
    def count_by_usuario(self, usuario_id: str, estado: Optional[EstadoNotificacionEnum] = None) -> int:
        """Count notifications by user"""
        query = self.db.query(Notificacion).filter(Notificacion.usuario_id == usuario_id)
        
        if estado:
            query = query.filter(Notificacion.estado == estado)
        
        return query.count()
    
    def marcar_como_leida(self, notificacion_id: str, usuario_id: str) -> Optional[Notificacion]:
        """Mark notification as read"""
        notificacion = self.db.query(Notificacion).filter(
            and_(
                Notificacion.id == uuid.UUID(notificacion_id),
                Notificacion.usuario_id == usuario_id
            )
        ).first()
        
        if notificacion and notificacion.estado != EstadoNotificacionEnum.LEIDA:
            notificacion.estado = EstadoNotificacionEnum.LEIDA
            notificacion.fecha_leida = datetime.utcnow()
            self.db.commit()
            self.db.refresh(notificacion)
        
        return notificacion
    
    def marcar_todas_como_leidas(self, usuario_id: str) -> int:
        """Mark all notifications as read for user"""
        count = self.db.query(Notificacion).filter(
            and_(
                Notificacion.usuario_id == usuario_id,
                Notificacion.estado != EstadoNotificacionEnum.LEIDA
            )
        ).update({
            "estado": EstadoNotificacionEnum.LEIDA,
            "fecha_leida": datetime.utcnow()
        })
        
        self.db.commit()
        return count
    
    def get_pendientes_email(self) -> List[Notificacion]:
        """Get notifications pending email sending"""
        return self.db.query(Notificacion).filter(
            and_(
                Notificacion.enviar_email == True,
                Notificacion.email_enviado == False,
                Notificacion.estado == EstadoNotificacionEnum.PENDIENTE
            )
        ).all()
    
    def limpiar_notificaciones_antiguas(self, dias_antiguedad: int = 30) -> int:
        """Clean old read notifications"""
        fecha_limite = datetime.utcnow() - timedelta(days=dias_antiguedad)
        
        count = self.db.query(Notificacion).filter(
            and_(
                Notificacion.estado == EstadoNotificacionEnum.LEIDA,
                Notificacion.fecha_leida < fecha_limite
            )
        ).delete()
        
        self.db.commit()
        return count
    
    def limpiar_notificaciones_expiradas(self) -> int:
        """Clean expired notifications"""
        count = self.db.query(Notificacion).filter(
            and_(
                Notificacion.fecha_expiracion.isnot(None),
                Notificacion.fecha_expiracion < datetime.utcnow()
            )
        ).delete()
        
        self.db.commit()
        return count


class AlertaRepository(BaseRepository[Alerta]):
    """Repository for Alerta operations"""
    
    def __init__(self, db: Session):
        super().__init__(db, Alerta)
    
    def get_alertas_activas(self) -> List[Alerta]:
        """Get active alerts"""
        return self.db.query(Alerta).filter(Alerta.activa == True).all()
    
    def get_alertas_para_ejecutar(self) -> List[Alerta]:
        """Get alerts ready for execution"""
        return self.db.query(Alerta).filter(
            and_(
                Alerta.activa == True,
                or_(
                    Alerta.proxima_ejecucion.is_(None),
                    Alerta.proxima_ejecucion <= datetime.utcnow()
                )
            )
        ).all()
    
    def actualizar_ejecucion(self, alerta_id: str, alertas_generadas: int = 0, error: Optional[str] = None) -> None:
        """Update alert execution info"""
        alerta = self.get_by_id(alerta_id)
        if not alerta:
            return
        
        alerta.ultima_ejecucion = datetime.utcnow()
        alerta.proxima_ejecucion = datetime.utcnow() + timedelta(minutes=alerta.frecuencia_minutos)
        alerta.total_ejecuciones += 1
        alerta.total_alertas_generadas += alertas_generadas
        
        if error:
            alerta.ultimo_error = error
            alerta.fecha_ultimo_error = datetime.utcnow()
        else:
            alerta.ultimo_error = None
            alerta.fecha_ultimo_error = None
        
        self.db.commit()


class NotificacionService:
    """Service for notification business logic"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = NotificacionRepository(db)
        self.alerta_repository = AlertaRepository(db)
        
        # Email configuration
        self.smtp_server = os.getenv("SMTP_SERVER", "localhost")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
        self.from_email = os.getenv("FROM_EMAIL", "noreply@mesapartes.gob.pe")
    
    async def enviar_notificacion(self, usuario_id: str, tipo: TipoNotificacionEnum, 
                                titulo: str, mensaje: str, 
                                documento_id: Optional[str] = None,
                                prioridad: PrioridadNotificacionEnum = PrioridadNotificacionEnum.NORMAL,
                                enviar_email: bool = False,
                                datos_adicionales: Optional[Dict[str, Any]] = None,
                                url_accion: Optional[str] = None) -> Notificacion:
        """
        Send notification to user
        Requirements: 8.1, 8.2, 8.3, 8.4
        """
        try:
            # Prepare notification data
            notificacion_data = {
                "usuario_id": usuario_id,
                "tipo": tipo,
                "titulo": titulo,
                "mensaje": mensaje,
                "prioridad": prioridad,
                "enviar_email": enviar_email,
                "datos_adicionales": datos_adicionales or {},
                "url_accion": url_accion
            }
            
            # Add documento info if provided
            if documento_id:
                notificacion_data["documento_id"] = uuid.UUID(documento_id)
                # Get documento number for reference
                documento_numero = await self._get_documento_numero(documento_id)
                if documento_numero:
                    notificacion_data["documento_numero_expediente"] = documento_numero
            
            # Set icon and color based on type and priority
            notificacion_data.update(self._get_notification_style(tipo, prioridad))
            
            # Create notification
            notificacion = self.repository.create(notificacion_data)
            
            # Send email if requested
            if enviar_email:
                await self._send_email_notification(notificacion)
            
            self.db.commit()
            self.db.refresh(notificacion)
            
            return notificacion
            
        except Exception as e:
            self.db.rollback()
            raise BusinessLogicError(f"Error sending notification: {str(e)}")
    
    async def obtener_notificaciones(self, usuario_id: str, leidas: Optional[bool] = None,
                                   limit: int = 50, offset: int = 0) -> Tuple[List[Notificacion], int]:
        """
        Get user notifications
        Requirements: 8.1, 8.2
        """
        estado = None
        if leidas is not None:
            estado = EstadoNotificacionEnum.LEIDA if leidas else EstadoNotificacionEnum.PENDIENTE
        
        notificaciones = self.repository.get_by_usuario(usuario_id, estado, limit, offset)
        total = self.repository.count_by_usuario(usuario_id, estado)
        
        return notificaciones, total
    
    async def marcar_como_leida(self, notificacion_id: str, usuario_id: str) -> Notificacion:
        """
        Mark notification as read
        Requirements: 8.2
        """
        notificacion = self.repository.marcar_como_leida(notificacion_id, usuario_id)
        if not notificacion:
            raise NotFoundError(f"Notification with ID {notificacion_id} not found")
        
        return notificacion
    
    async def marcar_todas_como_leidas(self, usuario_id: str) -> int:
        """
        Mark all notifications as read for user
        Requirements: 8.2
        """
        return self.repository.marcar_todas_como_leidas(usuario_id)
    
    async def enviar_email(self, destinatario: str, asunto: str, contenido: str, 
                         es_html: bool = False) -> bool:
        """
        Send email with templates
        Requirements: 8.4, 8.5
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = asunto
            msg['From'] = self.from_email
            msg['To'] = destinatario
            
            # Add content
            if es_html:
                msg.attach(MIMEText(contenido, 'html', 'utf-8'))
            else:
                msg.attach(MIMEText(contenido, 'plain', 'utf-8'))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.smtp_use_tls:
                    server.starttls()
                
                if self.smtp_username and self.smtp_password:
                    server.login(self.smtp_username, self.smtp_password)
                
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
    
    async def programar_alerta(self, nombre: str, tipo: TipoAlertaEnum, condicion_sql: str,
                             frecuencia_minutos: int = 60,
                             usuarios_destinatarios: Optional[List[str]] = None,
                             plantilla_titulo: str = "Alerta del Sistema",
                             plantilla_mensaje: str = "Se ha detectado una condición de alerta",
                             prioridad: PrioridadNotificacionEnum = PrioridadNotificacionEnum.NORMAL) -> Alerta:
        """
        Schedule automatic alert
        Requirements: 8.5, 8.6
        """
        try:
            alerta_data = {
                "nombre": nombre,
                "tipo": tipo,
                "condicion_sql": condicion_sql,
                "frecuencia_minutos": frecuencia_minutos,
                "usuarios_destinatarios": usuarios_destinatarios or [],
                "plantilla_titulo": plantilla_titulo,
                "plantilla_mensaje": plantilla_mensaje,
                "prioridad_notificacion": prioridad,
                "proxima_ejecucion": datetime.utcnow() + timedelta(minutes=frecuencia_minutos)
            }
            
            alerta = self.alerta_repository.create(alerta_data)
            
            self.db.commit()
            self.db.refresh(alerta)
            
            return alerta
            
        except Exception as e:
            self.db.rollback()
            raise BusinessLogicError(f"Error scheduling alert: {str(e)}")
    
    async def ejecutar_alertas_automaticas(self) -> Dict[str, Any]:
        """
        Execute automatic alerts
        Requirements: 8.5, 8.6, 8.7
        """
        alertas_ejecutadas = 0
        notificaciones_generadas = 0
        errores = []
        
        try:
            # Get alerts ready for execution
            alertas = self.alerta_repository.get_alertas_para_ejecutar()
            
            for alerta in alertas:
                try:
                    # Execute alert condition
                    resultados = await self._ejecutar_condicion_alerta(alerta)
                    
                    if resultados:
                        # Generate notifications for each result
                        for resultado in resultados:
                            await self._generar_notificacion_alerta(alerta, resultado)
                            notificaciones_generadas += 1
                    
                    # Update alert execution info
                    self.alerta_repository.actualizar_ejecucion(str(alerta.id), len(resultados))
                    alertas_ejecutadas += 1
                    
                except Exception as e:
                    error_msg = f"Error executing alert {alerta.nombre}: {str(e)}"
                    errores.append(error_msg)
                    self.alerta_repository.actualizar_ejecucion(str(alerta.id), 0, error_msg)
            
            return {
                "alertas_ejecutadas": alertas_ejecutadas,
                "notificaciones_generadas": notificaciones_generadas,
                "errores": errores
            }
            
        except Exception as e:
            raise BusinessLogicError(f"Error executing automatic alerts: {str(e)}")
    
    async def enviar_notificacion_derivacion(self, derivacion_id: str, area_destino_id: str) -> None:
        """
        Send notification for document derivation
        Requirements: 8.1, 8.3
        """
        # Get users in destination area
        usuarios_area = await self._get_usuarios_area(area_destino_id)
        
        for usuario_id in usuarios_area:
            await self.enviar_notificacion(
                usuario_id=usuario_id,
                tipo=TipoNotificacionEnum.DOCUMENTO_DERIVADO,
                titulo="Nuevo documento derivado",
                mensaje=f"Se ha derivado un nuevo documento a su área",
                prioridad=PrioridadNotificacionEnum.NORMAL,
                enviar_email=True,
                datos_adicionales={"derivacion_id": derivacion_id},
                url_accion=f"/mesa-partes/derivaciones/{derivacion_id}"
            )
    
    async def enviar_notificacion_vencimiento(self, documento_id: str, dias_restantes: int) -> None:
        """
        Send notification for document expiration
        Requirements: 8.2, 8.3
        """
        # Get documento info
        documento = await self._get_documento_info(documento_id)
        if not documento:
            return
        
        # Get users in current area
        usuarios_area = await self._get_usuarios_area(documento.get("area_actual_id"))
        
        tipo_notificacion = (TipoNotificacionEnum.DOCUMENTO_VENCIDO if dias_restantes <= 0 
                           else TipoNotificacionEnum.DOCUMENTO_PROXIMO_VENCER)
        
        titulo = ("Documento vencido" if dias_restantes <= 0 
                 else f"Documento próximo a vencer ({dias_restantes} días)")
        
        mensaje = f"El documento {documento.get('numero_expediente')} requiere atención"
        
        prioridad = (PrioridadNotificacionEnum.URGENTE if dias_restantes <= 0 
                    else PrioridadNotificacionEnum.ALTA)
        
        for usuario_id in usuarios_area:
            await self.enviar_notificacion(
                usuario_id=usuario_id,
                tipo=tipo_notificacion,
                titulo=titulo,
                mensaje=mensaje,
                documento_id=documento_id,
                prioridad=prioridad,
                enviar_email=True,
                url_accion=f"/mesa-partes/documentos/{documento_id}"
            )
    
    async def enviar_notificacion_urgente(self, documento_id: str) -> None:
        """
        Send urgent document notification
        Requirements: 8.3
        """
        # Get documento info
        documento = await self._get_documento_info(documento_id)
        if not documento:
            return
        
        # Get users in current area
        usuarios_area = await self._get_usuarios_area(documento.get("area_actual_id"))
        
        for usuario_id in usuarios_area:
            await self.enviar_notificacion(
                usuario_id=usuario_id,
                tipo=TipoNotificacionEnum.DOCUMENTO_URGENTE,
                titulo="Documento urgente",
                mensaje=f"El documento {documento.get('numero_expediente')} requiere atención urgente",
                documento_id=documento_id,
                prioridad=PrioridadNotificacionEnum.URGENTE,
                enviar_email=True,
                url_accion=f"/mesa-partes/documentos/{documento_id}"
            )
    
    async def procesar_notificaciones_email_pendientes(self) -> Dict[str, Any]:
        """
        Process pending email notifications
        Requirements: 8.4, 8.5
        """
        enviados = 0
        errores = 0
        
        try:
            notificaciones_pendientes = self.repository.get_pendientes_email()
            
            for notificacion in notificaciones_pendientes:
                try:
                    # Get user email
                    email_usuario = await self._get_usuario_email(notificacion.usuario_id)
                    if not email_usuario:
                        continue
                    
                    # Generate email content
                    asunto = f"[Mesa de Partes] {notificacion.titulo}"
                    contenido = await self._generar_contenido_email(notificacion)
                    
                    # Send email
                    if await self.enviar_email(email_usuario, asunto, contenido, es_html=True):
                        # Mark as sent
                        notificacion.email_enviado = True
                        notificacion.fecha_envio_email = datetime.utcnow()
                        enviados += 1
                    else:
                        errores += 1
                        
                except Exception as e:
                    print(f"Error sending email for notification {notificacion.id}: {str(e)}")
                    errores += 1
            
            self.db.commit()
            
            return {
                "emails_enviados": enviados,
                "errores": errores
            }
            
        except Exception as e:
            self.db.rollback()
            raise BusinessLogicError(f"Error processing email notifications: {str(e)}")
    
    async def limpiar_notificaciones_antiguas(self, dias_antiguedad: int = 30) -> Dict[str, int]:
        """
        Clean old notifications
        Requirements: System maintenance
        """
        try:
            # Clean old read notifications
            leidas_eliminadas = self.repository.limpiar_notificaciones_antiguas(dias_antiguedad)
            
            # Clean expired notifications
            expiradas_eliminadas = self.repository.limpiar_notificaciones_expiradas()
            
            return {
                "notificaciones_leidas_eliminadas": leidas_eliminadas,
                "notificaciones_expiradas_eliminadas": expiradas_eliminadas
            }
            
        except Exception as e:
            raise BusinessLogicError(f"Error cleaning old notifications: {str(e)}")
    
    # Private helper methods
    
    async def _send_email_notification(self, notificacion: Notificacion) -> None:
        """Send email for notification"""
        try:
            email_usuario = await self._get_usuario_email(notificacion.usuario_id)
            if not email_usuario:
                return
            
            asunto = f"[Mesa de Partes] {notificacion.titulo}"
            contenido = await self._generar_contenido_email(notificacion)
            
            if await self.enviar_email(email_usuario, asunto, contenido, es_html=True):
                notificacion.email_enviado = True
                notificacion.fecha_envio_email = datetime.utcnow()
                
        except Exception as e:
            print(f"Error sending email notification: {str(e)}")
    
    async def _generar_contenido_email(self, notificacion: Notificacion) -> str:
        """Generate email content from notification"""
        template_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{{ titulo }}</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="border-left: 4px solid {{ color }}; padding-left: 15px; margin-bottom: 20px;">
                    <h2 style="color: #333; margin: 0;">{{ titulo }}</h2>
                    <p style="color: #666; margin: 5px 0 0 0;">{{ fecha_formateada }}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <p style="color: #333; line-height: 1.6;">{{ mensaje }}</p>
                </div>
                
                {% if documento_numero_expediente %}
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                    <strong>Documento:</strong> {{ documento_numero_expediente }}
                </div>
                {% endif %}
                
                {% if url_accion %}
                <div style="text-align: center; margin: 20px 0;">
                    <a href="{{ url_base }}{{ url_accion }}" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Ver Documento
                    </a>
                </div>
                {% endif %}
                
                <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px; color: #666; font-size: 12px;">
                    <p>Este es un mensaje automático del Sistema de Mesa de Partes. Por favor no responda a este correo.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        template = Template(template_html)
        
        return template.render(
            titulo=notificacion.titulo,
            mensaje=notificacion.mensaje,
            fecha_formateada=notificacion.created_at.strftime("%d/%m/%Y %H:%M"),
            documento_numero_expediente=notificacion.documento_numero_expediente,
            url_accion=notificacion.url_accion,
            url_base=os.getenv("BASE_URL", "http://localhost:4200"),
            color=notificacion.color or "#007bff"
        )
    
    def _get_notification_style(self, tipo: TipoNotificacionEnum, prioridad: PrioridadNotificacionEnum) -> Dict[str, str]:
        """Get notification icon and color based on type and priority"""
        styles = {
            TipoNotificacionEnum.DOCUMENTO_DERIVADO: {"icono": "arrow-right", "color": "#17a2b8"},
            TipoNotificacionEnum.DOCUMENTO_RECIBIDO: {"icono": "inbox", "color": "#28a745"},
            TipoNotificacionEnum.DOCUMENTO_VENCIDO: {"icono": "exclamation-triangle", "color": "#dc3545"},
            TipoNotificacionEnum.DOCUMENTO_PROXIMO_VENCER: {"icono": "clock", "color": "#ffc107"},
            TipoNotificacionEnum.DOCUMENTO_URGENTE: {"icono": "exclamation", "color": "#dc3545"},
            TipoNotificacionEnum.INTEGRACION_ERROR: {"icono": "wifi-off", "color": "#6c757d"},
            TipoNotificacionEnum.SISTEMA_MANTENIMIENTO: {"icono": "settings", "color": "#6c757d"}
        }
        
        style = styles.get(tipo, {"icono": "bell", "color": "#007bff"})
        
        # Override color for urgent priority
        if prioridad == PrioridadNotificacionEnum.URGENTE:
            style["color"] = "#dc3545"
        
        return style
    
    async def _get_documento_numero(self, documento_id: str) -> Optional[str]:
        """Get documento numero_expediente"""
        try:
            from app.repositories.mesa_partes.documento_repository import DocumentoRepository
            doc_repo = DocumentoRepository(self.db)
            documento = doc_repo.get_by_id(documento_id, include_relations=False)
            return documento.numero_expediente if documento else None
        except Exception:
            return None
    
    async def _get_documento_info(self, documento_id: str) -> Optional[Dict[str, Any]]:
        """Get documento basic info"""
        try:
            from app.repositories.mesa_partes.documento_repository import DocumentoRepository
            doc_repo = DocumentoRepository(self.db)
            documento = doc_repo.get_by_id(documento_id, include_relations=False)
            if documento:
                return {
                    "numero_expediente": documento.numero_expediente,
                    "area_actual_id": documento.area_actual_id,
                    "estado": documento.estado.value,
                    "prioridad": documento.prioridad.value
                }
        except Exception:
            pass
        return None
    
    async def _get_usuarios_area(self, area_id: str) -> List[str]:
        """Get users in area"""
        # TODO: Implement proper user-area lookup
        return ["user1", "user2"]  # Placeholder
    
    async def _get_usuario_email(self, usuario_id: str) -> Optional[str]:
        """Get user email"""
        # TODO: Implement proper user email lookup
        return "user@example.com"  # Placeholder
    
    async def _ejecutar_condicion_alerta(self, alerta: Alerta) -> List[Dict[str, Any]]:
        """Execute alert condition SQL"""
        try:
            if not alerta.condicion_sql:
                return []
            
            result = self.db.execute(text(alerta.condicion_sql))
            rows = result.fetchall()
            
            # Convert rows to dictionaries
            columns = result.keys()
            return [dict(zip(columns, row)) for row in rows]
            
        except Exception as e:
            print(f"Error executing alert condition: {str(e)}")
            return []
    
    async def _generar_notificacion_alerta(self, alerta: Alerta, resultado: Dict[str, Any]) -> None:
        """Generate notification from alert result"""
        try:
            # Render templates with result data
            titulo_template = Template(alerta.plantilla_titulo)
            mensaje_template = Template(alerta.plantilla_mensaje)
            
            titulo = titulo_template.render(**resultado)
            mensaje = mensaje_template.render(**resultado)
            
            # Send notification to each destination user
            for usuario_id in alerta.usuarios_destinatarios:
                await self.enviar_notificacion(
                    usuario_id=usuario_id,
                    tipo=TipoNotificacionEnum.SISTEMA_MANTENIMIENTO,  # Default type for alerts
                    titulo=titulo,
                    mensaje=mensaje,
                    prioridad=alerta.prioridad_notificacion,
                    enviar_email=True,
                    datos_adicionales={"alerta_id": str(alerta.id), "resultado": resultado}
                )
                
        except Exception as e:
            print(f"Error generating alert notification: {str(e)}")