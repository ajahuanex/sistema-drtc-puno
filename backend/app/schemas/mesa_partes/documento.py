from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from enum import Enum

# Enums
class PrioridadEnum(str, Enum):
    NORMAL = "NORMAL"
    ALTA = "ALTA"
    URGENTE = "URGENTE"

class EstadoDocumentoEnum(str, Enum):
    REGISTRADO = "REGISTRADO"
    EN_PROCESO = "EN_PROCESO"
    ATENDIDO = "ATENDIDO"
    ARCHIVADO = "ARCHIVADO"

# Base schemas
class TipoDocumentoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=255, description="Nombre del tipo de documento")
    codigo: str = Field(..., min_length=1, max_length=50, description="Código único del tipo")
    descripcion: Optional[str] = Field(None, max_length=1000, description="Descripción del tipo de documento")
    activo: bool = Field(True, description="Si el tipo está activo")

class TipoDocumentoResponse(TipoDocumentoBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ArchivoAdjuntoBase(BaseModel):
    nombre_archivo: str = Field(..., min_length=1, max_length=255, description="Nombre del archivo")
    nombre_original: str = Field(..., min_length=1, max_length=255, description="Nombre original del archivo")
    tipo_mime: str = Field(..., max_length=100, description="Tipo MIME del archivo")
    tamano: int = Field(..., gt=0, description="Tamaño del archivo en bytes")
    descripcion: Optional[str] = Field(None, max_length=500, description="Descripción del archivo")
    es_principal: bool = Field(False, description="Si es el archivo principal del documento")

class ArchivoAdjuntoCreate(ArchivoAdjuntoBase):
    pass

class ArchivoAdjuntoResponse(ArchivoAdjuntoBase):
    id: str
    documento_id: str
    url: str
    hash_archivo: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Documento schemas
class DocumentoCreate(BaseModel):
    """Schema para crear un nuevo documento"""
    tipo_documento_id: str = Field(..., description="ID del tipo de documento")
    numero_documento_externo: Optional[str] = Field(None, max_length=100, description="Número del documento externo")
    remitente: str = Field(..., min_length=1, max_length=255, description="Nombre del remitente")
    asunto: str = Field(..., min_length=1, max_length=2000, description="Asunto del documento")
    numero_folios: int = Field(0, ge=0, description="Número de folios")
    tiene_anexos: bool = Field(False, description="Si el documento tiene anexos")
    prioridad: PrioridadEnum = Field(PrioridadEnum.NORMAL, description="Prioridad del documento")
    fecha_limite: Optional[datetime] = Field(None, description="Fecha límite de atención")
    expediente_relacionado_id: Optional[str] = Field(None, description="ID del expediente relacionado")
    etiquetas: List[str] = Field(default_factory=list, description="Etiquetas del documento")
    observaciones: Optional[str] = Field(None, max_length=2000, description="Observaciones adicionales")
    
    # Campos para integración externa
    origen_externo: Optional[str] = Field(None, max_length=255, description="Origen externo del documento")
    id_externo: Optional[str] = Field(None, max_length=255, description="ID en sistema externo")

    @validator('etiquetas')
    def validate_etiquetas(cls, v):
        if v and len(v) > 10:
            raise ValueError('Máximo 10 etiquetas permitidas')
        return v

    @validator('fecha_limite')
    def validate_fecha_limite(cls, v):
        if v and v <= datetime.now():
            raise ValueError('La fecha límite debe ser futura')
        return v

class DocumentoUpdate(BaseModel):
    """Schema para actualizar un documento existente"""
    tipo_documento_id: Optional[str] = Field(None, description="ID del tipo de documento")
    numero_documento_externo: Optional[str] = Field(None, max_length=100, description="Número del documento externo")
    remitente: Optional[str] = Field(None, min_length=1, max_length=255, description="Nombre del remitente")
    asunto: Optional[str] = Field(None, min_length=1, max_length=2000, description="Asunto del documento")
    numero_folios: Optional[int] = Field(None, ge=0, description="Número de folios")
    tiene_anexos: Optional[bool] = Field(None, description="Si el documento tiene anexos")
    prioridad: Optional[PrioridadEnum] = Field(None, description="Prioridad del documento")
    estado: Optional[EstadoDocumentoEnum] = Field(None, description="Estado del documento")
    fecha_limite: Optional[datetime] = Field(None, description="Fecha límite de atención")
    area_actual_id: Optional[str] = Field(None, description="ID del área actual")
    expediente_relacionado_id: Optional[str] = Field(None, description="ID del expediente relacionado")
    etiquetas: Optional[List[str]] = Field(None, description="Etiquetas del documento")
    observaciones: Optional[str] = Field(None, max_length=2000, description="Observaciones adicionales")

    @validator('etiquetas')
    def validate_etiquetas(cls, v):
        if v and len(v) > 10:
            raise ValueError('Máximo 10 etiquetas permitidas')
        return v

    @validator('fecha_limite')
    def validate_fecha_limite(cls, v):
        if v and v <= datetime.now():
            raise ValueError('La fecha límite debe ser futura')
        return v

class DocumentoResponse(BaseModel):
    """Schema para respuesta de documento completo"""
    id: str
    numero_expediente: str
    tipo_documento_id: str
    numero_documento_externo: Optional[str] = None
    remitente: str
    asunto: str
    numero_folios: int
    tiene_anexos: bool
    prioridad: PrioridadEnum
    estado: EstadoDocumentoEnum
    fecha_recepcion: datetime
    fecha_limite: Optional[datetime] = None
    usuario_registro_id: str
    area_actual_id: Optional[str] = None
    codigo_qr: Optional[str] = None
    expediente_relacionado_id: Optional[str] = None
    etiquetas: List[str]
    observaciones: Optional[str] = None
    origen_externo: Optional[str] = None
    id_externo: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Relaciones
    tipo_documento: Optional[TipoDocumentoResponse] = None
    archivos_adjuntos: List[ArchivoAdjuntoResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

class DocumentoResumen(BaseModel):
    """Schema para resumen de documento (para listas)"""
    id: str
    numero_expediente: str
    remitente: str
    asunto: str
    prioridad: PrioridadEnum
    estado: EstadoDocumentoEnum
    fecha_recepcion: datetime
    fecha_limite: Optional[datetime] = None
    area_actual_id: Optional[str] = None
    tipo_documento: Optional[TipoDocumentoResponse] = None

    class Config:
        from_attributes = True

class FiltrosDocumento(BaseModel):
    """Schema para filtros de búsqueda de documentos"""
    numero_expediente: Optional[str] = Field(None, description="Filtrar por número de expediente")
    remitente: Optional[str] = Field(None, description="Filtrar por remitente")
    asunto: Optional[str] = Field(None, description="Filtrar por asunto")
    tipo_documento_id: Optional[str] = Field(None, description="Filtrar por tipo de documento")
    estado: Optional[EstadoDocumentoEnum] = Field(None, description="Filtrar por estado")
    prioridad: Optional[PrioridadEnum] = Field(None, description="Filtrar por prioridad")
    area_actual_id: Optional[str] = Field(None, description="Filtrar por área actual")
    usuario_registro_id: Optional[str] = Field(None, description="Filtrar por usuario que registró")
    fecha_recepcion_desde: Optional[datetime] = Field(None, description="Fecha de recepción desde")
    fecha_recepcion_hasta: Optional[datetime] = Field(None, description="Fecha de recepción hasta")
    fecha_limite_desde: Optional[datetime] = Field(None, description="Fecha límite desde")
    fecha_limite_hasta: Optional[datetime] = Field(None, description="Fecha límite hasta")
    tiene_anexos: Optional[bool] = Field(None, description="Filtrar por documentos con anexos")
    etiquetas: Optional[List[str]] = Field(None, description="Filtrar por etiquetas")
    origen_externo: Optional[str] = Field(None, description="Filtrar por origen externo")
    solo_vencidos: Optional[bool] = Field(None, description="Solo documentos vencidos")
    solo_urgentes: Optional[bool] = Field(None, description="Solo documentos urgentes")
    
    # Parámetros de paginación
    page: int = Field(1, ge=1, description="Número de página")
    size: int = Field(20, ge=1, le=100, description="Tamaño de página")
    
    # Parámetros de ordenamiento
    sort_by: Optional[str] = Field("fecha_recepcion", description="Campo por el cual ordenar")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$", description="Orden ascendente o descendente")

    @validator('fecha_recepcion_hasta')
    def validate_fecha_recepcion_range(cls, v, values):
        if v and 'fecha_recepcion_desde' in values and values['fecha_recepcion_desde']:
            if v <= values['fecha_recepcion_desde']:
                raise ValueError('fecha_recepcion_hasta debe ser mayor que fecha_recepcion_desde')
        return v

    @validator('fecha_limite_hasta')
    def validate_fecha_limite_range(cls, v, values):
        if v and 'fecha_limite_desde' in values and values['fecha_limite_desde']:
            if v <= values['fecha_limite_desde']:
                raise ValueError('fecha_limite_hasta debe ser mayor que fecha_limite_desde')
        return v

class DocumentoEstadisticas(BaseModel):
    """Schema para estadísticas de documentos"""
    total_documentos: int
    documentos_registrados: int
    documentos_en_proceso: int
    documentos_atendidos: int
    documentos_archivados: int
    documentos_vencidos: int
    documentos_urgentes: int
    documentos_por_tipo: dict
    documentos_por_area: dict
    promedio_tiempo_atencion_dias: Optional[float] = None

class DocumentoComprobante(BaseModel):
    """Schema para comprobante de documento"""
    numero_expediente: str
    fecha_recepcion: datetime
    remitente: str
    asunto: str
    codigo_qr: str
    url_consulta: str

class DocumentoArchivar(BaseModel):
    """Schema para archivar documento"""
    clasificacion_archivo: str = Field(..., min_length=1, max_length=100, description="Clasificación del archivo")
    ubicacion_fisica: Optional[str] = Field(None, max_length=255, description="Ubicación física del documento")
    observaciones_archivo: Optional[str] = Field(None, max_length=500, description="Observaciones del archivado")