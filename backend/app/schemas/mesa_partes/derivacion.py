from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from enum import Enum

# Enums
class EstadoDerivacionEnum(str, Enum):
    PENDIENTE = "PENDIENTE"
    RECIBIDO = "RECIBIDO"
    ATENDIDO = "ATENDIDO"
    RECHAZADO = "RECHAZADO"

# Base schemas
class AreaBase(BaseModel):
    """Schema base para información de área"""
    id: str
    nombre: str
    codigo: Optional[str] = None
    descripcion: Optional[str] = None

class UsuarioBase(BaseModel):
    """Schema base para información de usuario"""
    id: str
    nombres: str
    apellidos: str
    email: Optional[str] = None

# Derivacion schemas
class DerivacionCreate(BaseModel):
    """Schema para crear una nueva derivación"""
    documento_id: str = Field(..., description="ID del documento a derivar")
    area_destino_id: str = Field(..., description="ID del área destino")
    instrucciones: Optional[str] = Field(None, max_length=2000, description="Instrucciones para el área destino")
    fecha_limite_atencion: Optional[datetime] = Field(None, description="Fecha límite para atención")
    es_urgente: bool = Field(False, description="Si la derivación es urgente")
    requiere_respuesta: bool = Field(False, description="Si requiere respuesta del área destino")
    es_copia: bool = Field(False, description="Si es solo para conocimiento/copia")
    
    # Campos para derivaciones múltiples
    areas_destino_ids: Optional[List[str]] = Field(None, description="IDs de múltiples áreas destino")
    
    # Campos para integración externa
    derivacion_externa_id: Optional[str] = Field(None, max_length=255, description="ID en sistema externo")

    @validator('fecha_limite_atencion')
    def validate_fecha_limite(cls, v):
        if v and v <= datetime.now():
            raise ValueError('La fecha límite debe ser futura')
        return v

    @validator('areas_destino_ids')
    def validate_areas_destino(cls, v, values):
        if v and 'area_destino_id' in values and values['area_destino_id']:
            raise ValueError('No se puede especificar area_destino_id y areas_destino_ids al mismo tiempo')
        if v and len(v) > 10:
            raise ValueError('Máximo 10 áreas destino permitidas')
        return v

class DerivacionUpdate(BaseModel):
    """Schema para actualizar una derivación existente"""
    instrucciones: Optional[str] = Field(None, max_length=2000, description="Instrucciones para el área destino")
    observaciones: Optional[str] = Field(None, max_length=2000, description="Observaciones del área receptora")
    motivo_rechazo: Optional[str] = Field(None, max_length=1000, description="Motivo de rechazo si aplica")
    estado: Optional[EstadoDerivacionEnum] = Field(None, description="Estado de la derivación")
    fecha_limite_atencion: Optional[datetime] = Field(None, description="Fecha límite para atención")
    es_urgente: Optional[bool] = Field(None, description="Si la derivación es urgente")
    requiere_respuesta: Optional[bool] = Field(None, description="Si requiere respuesta del área destino")

    @validator('fecha_limite_atencion')
    def validate_fecha_limite(cls, v):
        if v and v <= datetime.now():
            raise ValueError('La fecha límite debe ser futura')
        return v

class DerivacionResponse(BaseModel):
    """Schema para respuesta de derivación completa"""
    id: str
    documento_id: str
    area_origen_id: str
    area_destino_id: str
    usuario_deriva_id: str
    usuario_recibe_id: Optional[str] = None
    usuario_atiende_id: Optional[str] = None
    instrucciones: Optional[str] = None
    observaciones: Optional[str] = None
    motivo_rechazo: Optional[str] = None
    fecha_derivacion: datetime
    fecha_recepcion: Optional[datetime] = None
    fecha_atencion: Optional[datetime] = None
    fecha_limite_atencion: Optional[datetime] = None
    estado: EstadoDerivacionEnum
    es_urgente: bool
    requiere_respuesta: bool
    es_copia: bool
    numero_derivacion: Optional[str] = None
    derivacion_externa_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Información calculada
    dias_transcurridos: Optional[int] = None
    dias_restantes: Optional[int] = None
    esta_vencida: bool = False

    class Config:
        from_attributes = True

class DerivacionResumen(BaseModel):
    """Schema para resumen de derivación (para listas)"""
    id: str
    documento_id: str
    area_origen_id: str
    area_destino_id: str
    estado: EstadoDerivacionEnum
    fecha_derivacion: datetime
    fecha_limite_atencion: Optional[datetime] = None
    es_urgente: bool
    numero_derivacion: Optional[str] = None
    dias_restantes: Optional[int] = None
    esta_vencida: bool = False

    class Config:
        from_attributes = True

class DerivacionHistorial(BaseModel):
    """Schema para historial de derivaciones de un documento"""
    derivaciones: List[DerivacionResponse]
    total_derivaciones: int
    derivacion_actual: Optional[DerivacionResponse] = None
    areas_involucradas: List[str]
    tiempo_total_proceso_dias: Optional[int] = None

class DerivacionRecibir(BaseModel):
    """Schema para recibir una derivación"""
    observaciones_recepcion: Optional[str] = Field(None, max_length=1000, description="Observaciones al recibir")
    acepta_derivacion: bool = Field(True, description="Si acepta o rechaza la derivación")
    motivo_rechazo: Optional[str] = Field(None, max_length=1000, description="Motivo de rechazo si no acepta")

    @validator('motivo_rechazo')
    def validate_motivo_rechazo(cls, v, values):
        if not values.get('acepta_derivacion', True) and not v:
            raise ValueError('Debe proporcionar motivo de rechazo si no acepta la derivación')
        return v

class DerivacionAtender(BaseModel):
    """Schema para atender una derivación"""
    observaciones_atencion: str = Field(..., min_length=1, max_length=2000, description="Observaciones de la atención")
    requiere_derivacion_adicional: bool = Field(False, description="Si requiere derivar a otra área")
    area_siguiente_id: Optional[str] = Field(None, description="ID del área siguiente si requiere derivación")
    instrucciones_siguiente: Optional[str] = Field(None, max_length=1000, description="Instrucciones para siguiente área")

    @validator('area_siguiente_id')
    def validate_area_siguiente(cls, v, values):
        if values.get('requiere_derivacion_adicional', False) and not v:
            raise ValueError('Debe especificar área siguiente si requiere derivación adicional')
        return v

class FiltrosDerivacion(BaseModel):
    """Schema para filtros de búsqueda de derivaciones"""
    documento_id: Optional[str] = Field(None, description="Filtrar por documento")
    area_origen_id: Optional[str] = Field(None, description="Filtrar por área origen")
    area_destino_id: Optional[str] = Field(None, description="Filtrar por área destino")
    usuario_deriva_id: Optional[str] = Field(None, description="Filtrar por usuario que deriva")
    usuario_recibe_id: Optional[str] = Field(None, description="Filtrar por usuario que recibe")
    estado: Optional[EstadoDerivacionEnum] = Field(None, description="Filtrar por estado")
    es_urgente: Optional[bool] = Field(None, description="Filtrar por urgencia")
    requiere_respuesta: Optional[bool] = Field(None, description="Filtrar por requerimiento de respuesta")
    fecha_derivacion_desde: Optional[datetime] = Field(None, description="Fecha de derivación desde")
    fecha_derivacion_hasta: Optional[datetime] = Field(None, description="Fecha de derivación hasta")
    fecha_limite_desde: Optional[datetime] = Field(None, description="Fecha límite desde")
    fecha_limite_hasta: Optional[datetime] = Field(None, description="Fecha límite hasta")
    solo_vencidas: Optional[bool] = Field(None, description="Solo derivaciones vencidas")
    solo_pendientes: Optional[bool] = Field(None, description="Solo derivaciones pendientes")
    numero_derivacion: Optional[str] = Field(None, description="Filtrar por número de derivación")
    
    # Parámetros de paginación
    page: int = Field(1, ge=1, description="Número de página")
    size: int = Field(20, ge=1, le=100, description="Tamaño de página")
    
    # Parámetros de ordenamiento
    sort_by: Optional[str] = Field("fecha_derivacion", description="Campo por el cual ordenar")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$", description="Orden ascendente o descendente")

    @validator('fecha_derivacion_hasta')
    def validate_fecha_derivacion_range(cls, v, values):
        if v and 'fecha_derivacion_desde' in values and values['fecha_derivacion_desde']:
            if v <= values['fecha_derivacion_desde']:
                raise ValueError('fecha_derivacion_hasta debe ser mayor que fecha_derivacion_desde')
        return v

    @validator('fecha_limite_hasta')
    def validate_fecha_limite_range(cls, v, values):
        if v and 'fecha_limite_desde' in values and values['fecha_limite_desde']:
            if v <= values['fecha_limite_desde']:
                raise ValueError('fecha_limite_hasta debe ser mayor que fecha_limite_desde')
        return v

class DerivacionEstadisticas(BaseModel):
    """Schema para estadísticas de derivaciones"""
    total_derivaciones: int
    derivaciones_pendientes: int
    derivaciones_recibidas: int
    derivaciones_atendidas: int
    derivaciones_rechazadas: int
    derivaciones_vencidas: int
    derivaciones_urgentes: int
    derivaciones_por_area: dict
    tiempo_promedio_atencion_dias: Optional[float] = None
    tiempo_promedio_recepcion_horas: Optional[float] = None

class DerivacionNotificacion(BaseModel):
    """Schema para notificaciones de derivación"""
    derivacion_id: str
    tipo_notificacion: str  # NUEVA_DERIVACION, DERIVACION_RECIBIDA, DERIVACION_ATENDIDA, etc.
    mensaje: str
    destinatarios: List[str]  # IDs de usuarios destinatarios
    datos_adicionales: Optional[dict] = None

class DerivacionMasiva(BaseModel):
    """Schema para derivación masiva de documentos"""
    documentos_ids: List[str] = Field(..., min_items=1, max_items=50, description="IDs de documentos a derivar")
    area_destino_id: str = Field(..., description="ID del área destino")
    instrucciones: Optional[str] = Field(None, max_length=2000, description="Instrucciones comunes")
    fecha_limite_atencion: Optional[datetime] = Field(None, description="Fecha límite común")
    es_urgente: bool = Field(False, description="Si todas las derivaciones son urgentes")
    requiere_respuesta: bool = Field(False, description="Si todas requieren respuesta")

    @validator('fecha_limite_atencion')
    def validate_fecha_limite(cls, v):
        if v and v <= datetime.now():
            raise ValueError('La fecha límite debe ser futura')
        return v

class DerivacionMasivaResponse(BaseModel):
    """Schema para respuesta de derivación masiva"""
    total_documentos: int
    derivaciones_exitosas: int
    derivaciones_fallidas: int
    errores: List[dict]  # Lista de errores por documento
    derivaciones_creadas: List[str]  # IDs de derivaciones creadas