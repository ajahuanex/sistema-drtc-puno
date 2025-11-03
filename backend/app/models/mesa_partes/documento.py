from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from .base import BaseModel

class PrioridadEnum(enum.Enum):
    NORMAL = "NORMAL"
    ALTA = "ALTA"
    URGENTE = "URGENTE"

class EstadoDocumentoEnum(enum.Enum):
    REGISTRADO = "REGISTRADO"
    EN_PROCESO = "EN_PROCESO"
    ATENDIDO = "ATENDIDO"
    ARCHIVADO = "ARCHIVADO"

class TipoDocumento(BaseModel):
    """Modelo para tipos de documento"""
    __tablename__ = "tipos_documento"
    
    nombre = Column(String(255), nullable=False)
    codigo = Column(String(50), unique=True, nullable=False)
    descripcion = Column(Text)
    activo = Column(Boolean, default=True)
    
    # Relationships
    documentos = relationship("Documento", back_populates="tipo_documento")
    
    # Indexes
    __table_args__ = (
        Index('idx_tipo_documento_codigo', 'codigo'),
        Index('idx_tipo_documento_activo', 'activo'),
    )

class Documento(BaseModel):
    """Modelo principal para documentos de Mesa de Partes"""
    __tablename__ = "documentos"
    
    # Campos básicos del documento
    numero_expediente = Column(String(50), unique=True, nullable=False)
    tipo_documento_id = Column(UUID(as_uuid=True), ForeignKey("tipos_documento.id"), nullable=False)
    numero_documento_externo = Column(String(100))
    remitente = Column(String(255), nullable=False)
    asunto = Column(Text, nullable=False)
    numero_folios = Column(Integer, default=0)
    tiene_anexos = Column(Boolean, default=False)
    
    # Estado y prioridad
    prioridad = Column(SQLEnum(PrioridadEnum), default=PrioridadEnum.NORMAL)
    estado = Column(SQLEnum(EstadoDocumentoEnum), default=EstadoDocumentoEnum.REGISTRADO)
    
    # Fechas
    fecha_recepcion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_limite = Column(DateTime, nullable=True)
    
    # Referencias a usuarios y áreas (usando UUID como string por compatibilidad)
    usuario_registro_id = Column(String(255), nullable=False)  # ID del usuario que registró
    area_actual_id = Column(String(255), nullable=True)  # ID del área donde está actualmente
    
    # Campos adicionales
    codigo_qr = Column(String(255), unique=True)
    expediente_relacionado_id = Column(UUID(as_uuid=True), ForeignKey("documentos.id"), nullable=True)
    etiquetas = Column(ARRAY(String), default=[])
    observaciones = Column(Text)
    
    # Campos de integración externa
    origen_externo = Column(String(255))  # ID de la mesa de partes externa si aplica
    id_externo = Column(String(255))  # ID en el sistema externo
    
    # Relationships
    tipo_documento = relationship("TipoDocumento", back_populates="documentos")
    archivos_adjuntos = relationship("ArchivoAdjunto", back_populates="documento", cascade="all, delete-orphan")
    derivaciones = relationship("Derivacion", back_populates="documento", cascade="all, delete-orphan")
    expediente_relacionado = relationship("Documento", remote_side=[id])
    
    # Indexes para optimización de consultas
    __table_args__ = (
        Index('idx_documento_numero_expediente', 'numero_expediente'),
        Index('idx_documento_estado', 'estado'),
        Index('idx_documento_prioridad', 'prioridad'),
        Index('idx_documento_fecha_recepcion', 'fecha_recepcion'),
        Index('idx_documento_fecha_limite', 'fecha_limite'),
        Index('idx_documento_remitente', 'remitente'),
        Index('idx_documento_usuario_registro', 'usuario_registro_id'),
        Index('idx_documento_area_actual', 'area_actual_id'),
        Index('idx_documento_tipo', 'tipo_documento_id'),
        Index('idx_documento_codigo_qr', 'codigo_qr'),
        Index('idx_documento_origen_externo', 'origen_externo'),
        Index('idx_documento_id_externo', 'id_externo'),
        # Índices compuestos para consultas frecuentes
        Index('idx_documento_estado_fecha', 'estado', 'fecha_recepcion'),
        Index('idx_documento_area_estado', 'area_actual_id', 'estado'),
        Index('idx_documento_usuario_fecha', 'usuario_registro_id', 'fecha_recepcion'),
    )

class ArchivoAdjunto(BaseModel):
    """Modelo para archivos adjuntos a documentos"""
    __tablename__ = "archivos_adjuntos"
    
    documento_id = Column(UUID(as_uuid=True), ForeignKey("documentos.id"), nullable=False)
    nombre_archivo = Column(String(255), nullable=False)
    nombre_original = Column(String(255), nullable=False)
    tipo_mime = Column(String(100), nullable=False)
    tamano = Column(Integer, nullable=False)  # Tamaño en bytes
    url = Column(String(500), nullable=False)  # URL del archivo en storage
    hash_archivo = Column(String(255))  # Hash para verificar integridad
    
    # Metadata del archivo
    descripcion = Column(Text)
    es_principal = Column(Boolean, default=False)  # Si es el archivo principal del documento
    
    # Relationships
    documento = relationship("Documento", back_populates="archivos_adjuntos")
    
    # Indexes
    __table_args__ = (
        Index('idx_archivo_documento', 'documento_id'),
        Index('idx_archivo_tipo_mime', 'tipo_mime'),
        Index('idx_archivo_hash', 'hash_archivo'),
        Index('idx_archivo_principal', 'es_principal'),
    )