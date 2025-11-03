from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .base import BaseModel

class EstadoDerivacionEnum(enum.Enum):
    PENDIENTE = "PENDIENTE"
    RECIBIDO = "RECIBIDO"
    ATENDIDO = "ATENDIDO"
    RECHAZADO = "RECHAZADO"

class Derivacion(BaseModel):
    """Modelo para derivaciones de documentos entre áreas"""
    __tablename__ = "derivaciones"
    
    # Relación con documento
    documento_id = Column(UUID(as_uuid=True), ForeignKey("documentos.id"), nullable=False)
    
    # Áreas origen y destino (usando string IDs por compatibilidad con sistema existente)
    area_origen_id = Column(String(255), nullable=False)
    area_destino_id = Column(String(255), nullable=False)
    
    # Usuarios involucrados
    usuario_deriva_id = Column(String(255), nullable=False)  # Usuario que deriva
    usuario_recibe_id = Column(String(255), nullable=True)   # Usuario que recibe
    usuario_atiende_id = Column(String(255), nullable=True)  # Usuario que atiende
    
    # Información de la derivación
    instrucciones = Column(Text)
    observaciones = Column(Text)  # Observaciones del área receptora
    motivo_rechazo = Column(Text)  # Si es rechazada
    
    # Fechas del proceso
    fecha_derivacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_recepcion = Column(DateTime, nullable=True)
    fecha_atencion = Column(DateTime, nullable=True)
    fecha_limite_atencion = Column(DateTime, nullable=True)
    
    # Estado y características
    estado = Column(SQLEnum(EstadoDerivacionEnum), default=EstadoDerivacionEnum.PENDIENTE)
    es_urgente = Column(Boolean, default=False)
    requiere_respuesta = Column(Boolean, default=False)
    es_copia = Column(Boolean, default=False)  # Si es para conocimiento o copia
    
    # Número de derivación para seguimiento
    numero_derivacion = Column(String(50), unique=True)
    
    # Campos de integración externa
    derivacion_externa_id = Column(String(255))  # ID en sistema externo si aplica
    
    # Relationships
    documento = relationship("Documento", back_populates="derivaciones")
    
    # Indexes para optimización de consultas
    __table_args__ = (
        Index('idx_derivacion_documento', 'documento_id'),
        Index('idx_derivacion_area_origen', 'area_origen_id'),
        Index('idx_derivacion_area_destino', 'area_destino_id'),
        Index('idx_derivacion_usuario_deriva', 'usuario_deriva_id'),
        Index('idx_derivacion_usuario_recibe', 'usuario_recibe_id'),
        Index('idx_derivacion_estado', 'estado'),
        Index('idx_derivacion_fecha_derivacion', 'fecha_derivacion'),
        Index('idx_derivacion_fecha_limite', 'fecha_limite_atencion'),
        Index('idx_derivacion_urgente', 'es_urgente'),
        Index('idx_derivacion_numero', 'numero_derivacion'),
        # Índices compuestos para consultas frecuentes
        Index('idx_derivacion_area_estado', 'area_destino_id', 'estado'),
        Index('idx_derivacion_documento_estado', 'documento_id', 'estado'),
        Index('idx_derivacion_urgente_estado', 'es_urgente', 'estado'),
        Index('idx_derivacion_fecha_estado', 'fecha_derivacion', 'estado'),
    )