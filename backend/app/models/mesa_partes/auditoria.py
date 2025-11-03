"""
Modelos para sistema de auditoría de Mesa de Partes
"""
from sqlalchemy import Column, String, DateTime, Text, Boolean, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from enum import Enum

from .database import Base


class TipoEventoEnum(str, Enum):
    """Enum para tipos de eventos de auditoría"""
    # Eventos de documentos
    DOCUMENTO_CREADO = "documento_creado"
    DOCUMENTO_ACTUALIZADO = "documento_actualizado"
    DOCUMENTO_ELIMINADO = "documento_eliminado"
    DOCUMENTO_ARCHIVADO = "documento_archivado"
    ARCHIVO_ADJUNTADO = "archivo_adjuntado"
    
    # Eventos de derivación
    DOCUMENTO_DERIVADO = "documento_derivado"
    DOCUMENTO_RECIBIDO = "documento_recibido"
    DOCUMENTO_ATENDIDO = "documento_atendido"
    DERIVACION_REASIGNADA = "derivacion_reasignada"
    
    # Eventos de integración
    INTEGRACION_CREADA = "integracion_creada"
    INTEGRACION_ACTUALIZADA = "integracion_actualizada"
    INTEGRACION_ELIMINADA = "integracion_eliminada"
    DOCUMENTO_ENVIADO_EXTERNO = "documento_enviado_externo"
    DOCUMENTO_RECIBIDO_EXTERNO = "documento_recibido_externo"
    WEBHOOK_ENVIADO = "webhook_enviado"
    WEBHOOK_RECIBIDO = "webhook_recibido"
    
    # Eventos de seguridad
    LOGIN_EXITOSO = "login_exitoso"
    LOGIN_FALLIDO = "login_fallido"
    ACCESO_DENEGADO = "acceso_denegado"
    API_KEY_ROTADA = "api_key_rotada"
    WEBHOOK_SECRET_ROTADO = "webhook_secret_rotado"
    INTENTO_ACCESO_NO_AUTORIZADO = "intento_acceso_no_autorizado"
    
    # Eventos de administración
    USUARIO_CREADO = "usuario_creado"
    USUARIO_ACTUALIZADO = "usuario_actualizado"
    USUARIO_DESACTIVADO = "usuario_desactivado"
    ROL_ASIGNADO = "rol_asignado"
    ROL_REMOVIDO = "rol_removido"
    PERMISO_ASIGNADO = "permiso_asignado"
    PERMISO_REMOVIDO = "permiso_removido"
    
    # Eventos de sistema
    SISTEMA_INICIADO = "sistema_iniciado"
    SISTEMA_DETENIDO = "sistema_detenido"
    BACKUP_REALIZADO = "backup_realizado"
    MANTENIMIENTO_INICIADO = "mantenimiento_iniciado"
    MANTENIMIENTO_FINALIZADO = "mantenimiento_finalizado"


class SeveridadEnum(str, Enum):
    """Enum para niveles de severidad"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class LogAuditoria(Base):
    """Modelo para logs de auditoría"""
    __tablename__ = "logs_auditoria"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Información del evento
    tipo_evento = Column(String(100), nullable=False, index=True)
    severidad = Column(String(20), default=SeveridadEnum.INFO, index=True)
    descripcion = Column(Text, nullable=False)
    
    # Información del usuario
    usuario_id = Column(UUID(as_uuid=True), index=True)  # Puede ser null para eventos del sistema
    usuario_email = Column(String(255))
    usuario_nombre = Column(String(255))
    
    # Información de la sesión/request
    session_id = Column(String(255))
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(Text)
    
    # Información del recurso afectado
    recurso_tipo = Column(String(50))  # documento, derivacion, integracion, etc.
    recurso_id = Column(String(255), index=True)
    recurso_nombre = Column(String(500))
    
    # Datos adicionales del evento
    datos_anteriores = Column(JSON)  # Estado anterior del recurso
    datos_nuevos = Column(JSON)      # Estado nuevo del recurso
    metadatos = Column(JSON)         # Información adicional del contexto
    
    # Información temporal
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    duracion_ms = Column(Integer)  # Duración de la operación en milisegundos
    
    # Información técnica
    endpoint = Column(String(255))
    metodo_http = Column(String(10))
    codigo_respuesta = Column(Integer)
    
    # Flags de control
    es_exitoso = Column(Boolean, default=True)
    requiere_atencion = Column(Boolean, default=False)
    procesado = Column(Boolean, default=False)
    
    # Información de contexto
    contexto_aplicacion = Column(String(100), default="mesa_partes")
    version_aplicacion = Column(String(50))
    
    # Timestamps adicionales
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ConfiguracionAuditoria(Base):
    """Configuración del sistema de auditoría"""
    __tablename__ = "configuracion_auditoria"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Configuración de retención
    dias_retencion = Column(Integer, default=365)  # 1 año por defecto
    max_logs_por_dia = Column(Integer, default=100000)
    
    # Configuración de eventos
    eventos_habilitados = Column(JSON, default=list)  # Lista de eventos a auditar
    severidades_habilitadas = Column(JSON, default=list)  # Severidades a registrar
    
    # Configuración de almacenamiento
    comprimir_logs_antiguos = Column(Boolean, default=True)
    archivar_logs_antiguos = Column(Boolean, default=True)
    ruta_archivo = Column(String(500))
    
    # Configuración de alertas
    alertas_habilitadas = Column(Boolean, default=True)
    email_alertas = Column(String(255))
    webhook_alertas = Column(String(500))
    
    # Configuración de rendimiento
    procesamiento_asincrono = Column(Boolean, default=True)
    batch_size = Column(Integer, default=100)
    
    # Metadatos
    activa = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))


class AlertaAuditoria(Base):
    """Alertas generadas por el sistema de auditoría"""
    __tablename__ = "alertas_auditoria"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Información de la alerta
    titulo = Column(String(255), nullable=False)
    descripcion = Column(Text)
    severidad = Column(String(20), nullable=False, index=True)
    
    # Relación con el log que generó la alerta
    log_auditoria_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Información del patrón detectado
    patron_detectado = Column(String(255))
    numero_ocurrencias = Column(Integer, default=1)
    ventana_tiempo_minutos = Column(Integer)
    
    # Estado de la alerta
    estado = Column(String(50), default="pendiente")  # pendiente, revisada, resuelta, falsa_alarma
    asignada_a = Column(UUID(as_uuid=True))
    
    # Acciones tomadas
    acciones_automaticas = Column(JSON)
    acciones_manuales = Column(JSON)
    notas = Column(Text)
    
    # Timestamps
    detectada_en = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    revisada_en = Column(DateTime(timezone=True))
    resuelta_en = Column(DateTime(timezone=True))
    
    # Metadatos
    metadatos = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class EstadisticasAuditoria(Base):
    """Estadísticas agregadas de auditoría"""
    __tablename__ = "estadisticas_auditoria"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Período de la estadística
    fecha = Column(DateTime(timezone=True), nullable=False, index=True)
    periodo = Column(String(20), nullable=False)  # hora, dia, semana, mes
    
    # Contadores por tipo de evento
    total_eventos = Column(Integer, default=0)
    eventos_por_tipo = Column(JSON, default=dict)
    eventos_por_severidad = Column(JSON, default=dict)
    eventos_por_usuario = Column(JSON, default=dict)
    
    # Contadores de seguridad
    intentos_acceso_fallidos = Column(Integer, default=0)
    accesos_exitosos = Column(Integer, default=0)
    alertas_generadas = Column(Integer, default=0)
    
    # Métricas de rendimiento
    tiempo_promedio_respuesta = Column(Integer)  # en milisegundos
    operaciones_exitosas = Column(Integer, default=0)
    operaciones_fallidas = Column(Integer, default=0)
    
    # Metadatos
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())