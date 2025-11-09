"""
Modelo para gestión de archivo documental
Requirements: 9.1, 9.2, 9.3, 9.6
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .base import BaseModel

class ClasificacionArchivoEnum(enum.Enum):
    """Clasificación de archivo según normativa"""
    TRAMITE_DOCUMENTARIO = "TRAMITE_DOCUMENTARIO"
    ADMINISTRATIVO = "ADMINISTRATIVO"
    LEGAL = "LEGAL"
    CONTABLE = "CONTABLE"
    RECURSOS_HUMANOS = "RECURSOS_HUMANOS"
    TECNICO = "TECNICO"
    OTROS = "OTROS"

class PoliticaRetencionEnum(enum.Enum):
    """Políticas de retención de documentos"""
    PERMANENTE = "PERMANENTE"  # Conservación permanente
    DIEZ_ANOS = "DIEZ_ANOS"  # 10 años
    CINCO_ANOS = "CINCO_ANOS"  # 5 años
    TRES_ANOS = "TRES_ANOS"  # 3 años
    UN_ANO = "UN_ANO"  # 1 año

class Archivo(BaseModel):
    """Modelo para registro de documentos archivados"""
    __tablename__ = "archivos"
    
    # Relación con documento
    documento_id = Column(UUID(as_uuid=True), ForeignKey("documentos.id"), nullable=False, unique=True)
    
    # Información de archivado
    clasificacion = Column(SQLEnum(ClasificacionArchivoEnum), nullable=False)
    politica_retencion = Column(SQLEnum(PoliticaRetencionEnum), nullable=False)
    
    # Ubicación física
    codigo_ubicacion = Column(String(100), unique=True, nullable=False)  # Ej: EST-A-03-CAJ-045
    ubicacion_fisica = Column(String(255))  # Descripción detallada
    
    # Fechas importantes
    fecha_archivado = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_expiracion_retencion = Column(DateTime)  # Fecha en que expira la retención
    
    # Usuario que archivó
    usuario_archivo_id = Column(String(255), nullable=False)
    
    # Observaciones y notas
    observaciones = Column(Text)
    motivo_archivo = Column(Text)
    
    # Estado del archivo
    activo = Column(String(50), default="ARCHIVADO")  # ARCHIVADO, RESTAURADO, ELIMINADO
    
    # Fecha de restauración si aplica
    fecha_restauracion = Column(DateTime)
    usuario_restauracion_id = Column(String(255))
    motivo_restauracion = Column(Text)
    
    # Relationships
    documento = relationship("Documento", backref="archivo_info")
    
    # Indexes
    __table_args__ = (
        Index('idx_archivo_documento', 'documento_id'),
        Index('idx_archivo_clasificacion', 'clasificacion'),
        Index('idx_archivo_politica', 'politica_retencion'),
        Index('idx_archivo_codigo_ubicacion', 'codigo_ubicacion'),
        Index('idx_archivo_fecha_archivado', 'fecha_archivado'),
        Index('idx_archivo_fecha_expiracion', 'fecha_expiracion_retencion'),
        Index('idx_archivo_usuario', 'usuario_archivo_id'),
        Index('idx_archivo_activo', 'activo'),
        # Índices compuestos
        Index('idx_archivo_clasificacion_fecha', 'clasificacion', 'fecha_archivado'),
        Index('idx_archivo_activo_clasificacion', 'activo', 'clasificacion'),
    )
