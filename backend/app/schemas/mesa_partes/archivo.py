"""
Schemas para gestión de archivo documental
Requirements: 9.1, 9.2, 9.3, 9.6
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator
from enum import Enum

class ClasificacionArchivoEnum(str, Enum):
    """Clasificación de archivo según normativa"""
    TRAMITE_DOCUMENTARIO = "TRAMITE_DOCUMENTARIO"
    ADMINISTRATIVO = "ADMINISTRATIVO"
    LEGAL = "LEGAL"
    CONTABLE = "CONTABLE"
    RECURSOS_HUMANOS = "RECURSOS_HUMANOS"
    TECNICO = "TECNICO"
    OTROS = "OTROS"

class PoliticaRetencionEnum(str, Enum):
    """Políticas de retención de documentos"""
    PERMANENTE = "PERMANENTE"
    DIEZ_ANOS = "DIEZ_ANOS"
    CINCO_ANOS = "CINCO_ANOS"
    TRES_ANOS = "TRES_ANOS"
    UN_ANO = "UN_ANO"

class ArchivoCreate(BaseModel):
    """Schema para archivar un documento"""
    documento_id: str = Field(..., description="ID del documento a archivar")
    clasificacion: ClasificacionArchivoEnum = Field(..., description="Clasificación del archivo")
    politica_retencion: PoliticaRetencionEnum = Field(..., description="Política de retención")
    ubicacion_fisica: Optional[str] = Field(None, max_length=255, description="Ubicación física detallada")
    observaciones: Optional[str] = Field(None, max_length=2000, description="Observaciones del archivado")
    motivo_archivo: Optional[str] = Field(None, max_length=1000, description="Motivo del archivado")

    @validator('ubicacion_fisica')
    def validate_ubicacion(cls, v):
        if v and len(v.strip()) == 0:
            raise ValueError('La ubicación física no puede estar vacía')
        return v

class ArchivoUpdate(BaseModel):
    """Schema para actualizar información de archivo"""
    clasificacion: Optional[ClasificacionArchivoEnum] = Field(None, description="Clasificación del archivo")
    politica_retencion: Optional[PoliticaRetencionEnum] = Field(None, description="Política de retención")
    ubicacion_fisica: Optional[str] = Field(None, max_length=255, description="Ubicación física detallada")
    observaciones: Optional[str] = Field(None, max_length=2000, description="Observaciones del archivado")

class ArchivoRestaurar(BaseModel):
    """Schema para restaurar un documento archivado"""
    motivo_restauracion: str = Field(..., min_length=10, max_length=1000, description="Motivo de la restauración")

    @validator('motivo_restauracion')
    def validate_motivo(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('El motivo debe tener al menos 10 caracteres')
        return v

class ArchivoResponse(BaseModel):
    """Schema para respuesta de archivo"""
    id: str
    documento_id: str
    clasificacion: ClasificacionArchivoEnum
    politica_retencion: PoliticaRetencionEnum
    codigo_ubicacion: str
    ubicacion_fisica: Optional[str] = None
    fecha_archivado: datetime
    fecha_expiracion_retencion: Optional[datetime] = None
    usuario_archivo_id: str
    observaciones: Optional[str] = None
    motivo_archivo: Optional[str] = None
    activo: str
    fecha_restauracion: Optional[datetime] = None
    usuario_restauracion_id: Optional[str] = None
    motivo_restauracion: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ArchivoResumen(BaseModel):
    """Schema para resumen de archivo (para listas)"""
    id: str
    documento_id: str
    clasificacion: ClasificacionArchivoEnum
    politica_retencion: PoliticaRetencionEnum
    codigo_ubicacion: str
    fecha_archivado: datetime
    activo: str

    class Config:
        from_attributes = True

class FiltrosArchivo(BaseModel):
    """Schema para filtros de búsqueda en archivo"""
    clasificacion: Optional[ClasificacionArchivoEnum] = Field(None, description="Filtrar por clasificación")
    politica_retencion: Optional[PoliticaRetencionEnum] = Field(None, description="Filtrar por política de retención")
    codigo_ubicacion: Optional[str] = Field(None, description="Filtrar por código de ubicación")
    fecha_archivado_desde: Optional[datetime] = Field(None, description="Fecha de archivado desde")
    fecha_archivado_hasta: Optional[datetime] = Field(None, description="Fecha de archivado hasta")
    usuario_archivo_id: Optional[str] = Field(None, description="Filtrar por usuario que archivó")
    activo: Optional[str] = Field(None, description="Filtrar por estado (ARCHIVADO, RESTAURADO)")
    proximos_a_expirar: Optional[bool] = Field(None, description="Solo documentos próximos a expirar retención")
    
    # Búsqueda en documento relacionado
    numero_expediente: Optional[str] = Field(None, description="Buscar por número de expediente")
    remitente: Optional[str] = Field(None, description="Buscar por remitente")
    asunto: Optional[str] = Field(None, description="Buscar por asunto")
    
    # Parámetros de paginación
    page: int = Field(1, ge=1, description="Número de página")
    size: int = Field(20, ge=1, le=100, description="Tamaño de página")
    
    # Parámetros de ordenamiento
    sort_by: Optional[str] = Field("fecha_archivado", description="Campo por el cual ordenar")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$", description="Orden ascendente o descendente")

    @validator('fecha_archivado_hasta')
    def validate_fecha_range(cls, v, values):
        if v and 'fecha_archivado_desde' in values and values['fecha_archivado_desde']:
            if v <= values['fecha_archivado_desde']:
                raise ValueError('fecha_archivado_hasta debe ser mayor que fecha_archivado_desde')
        return v

class ArchivoEstadisticas(BaseModel):
    """Schema para estadísticas de archivo"""
    total_archivados: int
    por_clasificacion: dict
    por_politica_retencion: dict
    proximos_a_expirar: int
    espacio_utilizado_mb: Optional[float] = None
