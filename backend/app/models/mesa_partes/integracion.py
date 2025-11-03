from sqlalchemy import Column, String, Text, DateTime, Boolean, Enum as SQLEnum, JSON, Index, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from cryptography.fernet import Fernet
import base64
import os

from .base import BaseModel

class TipoIntegracionEnum(enum.Enum):
    API_REST = "API_REST"
    WEBHOOK = "WEBHOOK"
    SOAP = "SOAP"
    FTP = "FTP"

class TipoAutenticacionEnum(enum.Enum):
    API_KEY = "API_KEY"
    BEARER = "BEARER"
    BASIC = "BASIC"
    OAUTH2 = "OAUTH2"
    NONE = "NONE"

class EstadoConexionEnum(enum.Enum):
    CONECTADO = "CONECTADO"
    DESCONECTADO = "DESCONECTADO"
    ERROR = "ERROR"
    PROBANDO = "PROBANDO"

class EstadoSincronizacionEnum(enum.Enum):
    EXITOSO = "EXITOSO"
    ERROR = "ERROR"
    PENDIENTE = "PENDIENTE"
    REINTENTANDO = "REINTENTANDO"

class Integracion(BaseModel):
    """Modelo para configuración de integraciones con mesas de partes externas"""
    __tablename__ = "integraciones"
    
    # Información básica
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    codigo = Column(String(50), unique=True, nullable=False)  # Código único para la integración
    
    # Configuración de conexión
    tipo = Column(SQLEnum(TipoIntegracionEnum), nullable=False)
    url_base = Column(String(500), nullable=False)
    timeout_segundos = Column(Integer, default=30)
    
    # Autenticación
    tipo_autenticacion = Column(SQLEnum(TipoAutenticacionEnum), default=TipoAutenticacionEnum.API_KEY)
    credenciales_encriptadas = Column(Text)  # Credenciales encriptadas
    headers_adicionales = Column(JSON, default={})  # Headers adicionales para requests
    
    # Configuración de mapeo de campos
    mapeos_campos = Column(JSON, default={})  # Mapeo de campos locales a remotos
    transformaciones = Column(JSON, default={})  # Reglas de transformación de datos
    
    # Estado y configuración
    activa = Column(Boolean, default=True)
    permite_envio = Column(Boolean, default=True)
    permite_recepcion = Column(Boolean, default=True)
    
    # Información de estado
    estado_conexion = Column(SQLEnum(EstadoConexionEnum), default=EstadoConexionEnum.DESCONECTADO)
    ultima_sincronizacion = Column(DateTime, nullable=True)
    ultimo_error = Column(Text)
    fecha_ultimo_error = Column(DateTime, nullable=True)
    
    # Configuración de webhooks
    webhook_url = Column(String(500))
    webhook_secreto = Column(String(255))
    webhook_eventos = Column(JSON, default=[])  # Lista de eventos que disparan webhook
    
    # Configuración de reintentos
    max_reintentos = Column(Integer, default=3)
    intervalo_reintento_minutos = Column(Integer, default=5)
    
    # Metadatos adicionales
    configuracion_adicional = Column(JSON, default={})
    version_api = Column(String(50))
    
    # Relationships
    logs_sincronizacion = relationship("LogSincronizacion", back_populates="integracion", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_integracion_codigo', 'codigo'),
        Index('idx_integracion_tipo', 'tipo'),
        Index('idx_integracion_activa', 'activa'),
        Index('idx_integracion_estado', 'estado_conexion'),
        Index('idx_integracion_ultima_sync', 'ultima_sincronizacion'),
    )
    
    def encriptar_credenciales(self, credenciales: str) -> None:
        """Encripta las credenciales antes de guardarlas"""
        if not credenciales:
            return
        
        # Generar clave de encriptación (en producción debe venir de variables de entorno)
        key = os.environ.get('ENCRYPTION_KEY', Fernet.generate_key())
        if isinstance(key, str):
            key = key.encode()
        
        fernet = Fernet(key)
        credenciales_bytes = credenciales.encode()
        credenciales_encriptadas = fernet.encrypt(credenciales_bytes)
        self.credenciales_encriptadas = base64.b64encode(credenciales_encriptadas).decode()
    
    def desencriptar_credenciales(self) -> str:
        """Desencripta las credenciales para uso"""
        if not self.credenciales_encriptadas:
            return ""
        
        try:
            key = os.environ.get('ENCRYPTION_KEY', Fernet.generate_key())
            if isinstance(key, str):
                key = key.encode()
            
            fernet = Fernet(key)
            credenciales_encriptadas = base64.b64decode(self.credenciales_encriptadas.encode())
            credenciales_bytes = fernet.decrypt(credenciales_encriptadas)
            return credenciales_bytes.decode()
        except Exception:
            return ""

class LogSincronizacion(BaseModel):
    """Modelo para logs de sincronización con integraciones externas"""
    __tablename__ = "logs_sincronizacion"
    
    # Relación con integración
    integracion_id = Column(UUID(as_uuid=True), ForeignKey("integraciones.id"), nullable=False)
    
    # Información del documento sincronizado
    documento_id = Column(UUID(as_uuid=True), ForeignKey("documentos.id"), nullable=True)
    documento_numero_expediente = Column(String(50))
    
    # Información de la operación
    operacion = Column(String(50), nullable=False)  # ENVIO, RECEPCION, CONSULTA_ESTADO
    direccion = Column(String(20), nullable=False)  # SALIDA, ENTRADA
    
    # Estado y resultado
    estado = Column(SQLEnum(EstadoSincronizacionEnum), nullable=False)
    codigo_respuesta = Column(Integer)  # Código HTTP de respuesta
    mensaje_respuesta = Column(Text)
    
    # Datos intercambiados
    datos_enviados = Column(JSON)
    datos_recibidos = Column(JSON)
    
    # Información de error
    mensaje_error = Column(Text)
    stack_trace = Column(Text)
    
    # Información de reintento
    numero_intento = Column(Integer, default=1)
    fecha_proximo_reintento = Column(DateTime, nullable=True)
    
    # Metadatos
    tiempo_respuesta_ms = Column(Integer)  # Tiempo de respuesta en milisegundos
    ip_origen = Column(String(45))  # IP desde donde se hizo la petición
    user_agent = Column(String(500))
    
    # ID externo para seguimiento
    id_externo = Column(String(255))
    referencia_externa = Column(String(255))
    
    # Relationships
    integracion = relationship("Integracion", back_populates="logs_sincronizacion")
    
    # Indexes
    __table_args__ = (
        Index('idx_log_integracion', 'integracion_id'),
        Index('idx_log_documento', 'documento_id'),
        Index('idx_log_operacion', 'operacion'),
        Index('idx_log_estado', 'estado'),
        Index('idx_log_fecha', 'created_at'),
        Index('idx_log_numero_expediente', 'documento_numero_expediente'),
        Index('idx_log_id_externo', 'id_externo'),
        # Índices compuestos
        Index('idx_log_integracion_fecha', 'integracion_id', 'created_at'),
        Index('idx_log_integracion_estado', 'integracion_id', 'estado'),
        Index('idx_log_documento_operacion', 'documento_id', 'operacion'),
    )