from sqlalchemy import Column, String, Text, DateTime, Boolean, Enum as SQLEnum, JSON, Index, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .base import BaseModel

class TipoNotificacionEnum(enum.Enum):
    DOCUMENTO_DERIVADO = "DOCUMENTO_DERIVADO"
    DOCUMENTO_RECIBIDO = "DOCUMENTO_RECIBIDO"
    DOCUMENTO_VENCIDO = "DOCUMENTO_VENCIDO"
    DOCUMENTO_PROXIMO_VENCER = "DOCUMENTO_PROXIMO_VENCER"
    DOCUMENTO_URGENTE = "DOCUMENTO_URGENTE"
    INTEGRACION_ERROR = "INTEGRACION_ERROR"
    SISTEMA_MANTENIMIENTO = "SISTEMA_MANTENIMIENTO"

class EstadoNotificacionEnum(enum.Enum):
    PENDIENTE = "PENDIENTE"
    ENVIADA = "ENVIADA"
    LEIDA = "LEIDA"
    ERROR = "ERROR"

class PrioridadNotificacionEnum(enum.Enum):
    BAJA = "BAJA"
    NORMAL = "NORMAL"
    ALTA = "ALTA"
    URGENTE = "URGENTE"

class TipoAlertaEnum(enum.Enum):
    VENCIMIENTO = "VENCIMIENTO"
    RETRASO = "RETRASO"
    URGENTE = "URGENTE"
    SISTEMA = "SISTEMA"
    INTEGRACION = "INTEGRACION"

class Notificacion(BaseModel):
    """Modelo para notificaciones del sistema"""
    __tablename__ = "notificaciones"
    
    # Usuario destinatario
    usuario_id = Column(String(255), nullable=False)
    
    # Información de la notificación
    tipo = Column(SQLEnum(TipoNotificacionEnum), nullable=False)
    titulo = Column(String(255), nullable=False)
    mensaje = Column(Text, nullable=False)
    prioridad = Column(SQLEnum(PrioridadNotificacionEnum), default=PrioridadNotificacionEnum.NORMAL)
    
    # Estado
    estado = Column(SQLEnum(EstadoNotificacionEnum), default=EstadoNotificacionEnum.PENDIENTE)
    fecha_leida = Column(DateTime, nullable=True)
    
    # Relación con documento (opcional)
    documento_id = Column(UUID(as_uuid=True), nullable=True)
    documento_numero_expediente = Column(String(50))
    
    # Información adicional
    datos_adicionales = Column(JSON, default={})  # Datos extra para la notificación
    url_accion = Column(String(500))  # URL a la que debe dirigirse el usuario
    icono = Column(String(100))  # Icono a mostrar
    color = Column(String(20))  # Color de la notificación
    
    # Configuración de envío
    enviar_email = Column(Boolean, default=False)
    email_enviado = Column(Boolean, default=False)
    fecha_envio_email = Column(DateTime, nullable=True)
    
    # Configuración de expiración
    fecha_expiracion = Column(DateTime, nullable=True)
    
    # Agrupación de notificaciones
    grupo = Column(String(100))  # Para agrupar notificaciones relacionadas
    
    # Indexes
    __table_args__ = (
        Index('idx_notificacion_usuario', 'usuario_id'),
        Index('idx_notificacion_tipo', 'tipo'),
        Index('idx_notificacion_estado', 'estado'),
        Index('idx_notificacion_prioridad', 'prioridad'),
        Index('idx_notificacion_documento', 'documento_id'),
        Index('idx_notificacion_fecha_creacion', 'created_at'),
        Index('idx_notificacion_fecha_leida', 'fecha_leida'),
        Index('idx_notificacion_grupo', 'grupo'),
        # Índices compuestos
        Index('idx_notificacion_usuario_estado', 'usuario_id', 'estado'),
        Index('idx_notificacion_usuario_fecha', 'usuario_id', 'created_at'),
        Index('idx_notificacion_tipo_estado', 'tipo', 'estado'),
    )

class Alerta(BaseModel):
    """Modelo para alertas automáticas del sistema"""
    __tablename__ = "alertas"
    
    # Información básica
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    tipo = Column(SQLEnum(TipoAlertaEnum), nullable=False)
    
    # Configuración de la alerta
    activa = Column(Boolean, default=True)
    condicion_sql = Column(Text)  # Condición SQL para evaluar la alerta
    frecuencia_minutos = Column(Integer, default=60)  # Cada cuántos minutos evaluar
    
    # Configuración de notificación
    usuarios_destinatarios = Column(JSON, default=[])  # Lista de IDs de usuarios
    areas_destinatarias = Column(JSON, default=[])  # Lista de IDs de áreas
    roles_destinatarios = Column(JSON, default=[])  # Lista de roles
    
    # Plantilla de notificación
    plantilla_titulo = Column(String(255))
    plantilla_mensaje = Column(Text)
    prioridad_notificacion = Column(SQLEnum(PrioridadNotificacionEnum), default=PrioridadNotificacionEnum.NORMAL)
    
    # Control de ejecución
    ultima_ejecucion = Column(DateTime, nullable=True)
    proxima_ejecucion = Column(DateTime, nullable=True)
    total_ejecuciones = Column(Integer, default=0)
    total_alertas_generadas = Column(Integer, default=0)
    
    # Configuración adicional
    parametros = Column(JSON, default={})  # Parámetros adicionales para la alerta
    
    # Información de error
    ultimo_error = Column(Text)
    fecha_ultimo_error = Column(DateTime, nullable=True)
    
    # Indexes
    __table_args__ = (
        Index('idx_alerta_tipo', 'tipo'),
        Index('idx_alerta_activa', 'activa'),
        Index('idx_alerta_proxima_ejecucion', 'proxima_ejecucion'),
        Index('idx_alerta_ultima_ejecucion', 'ultima_ejecucion'),
        Index('idx_alerta_frecuencia', 'frecuencia_minutos'),
    )