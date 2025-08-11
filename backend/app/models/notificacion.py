from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from enum import Enum

class TipoNotificacion(str, Enum):
    VENCIMIENTO_DOCUMENTO = "VENCIMIENTO_DOCUMENTO"
    VENCIMIENTO_LICENCIA = "VENCIMIENTO_LICENCIA"
    VENCIMIENTO_TUC = "VENCIMIENTO_TUC"
    VENCIMIENTO_RESOLUCION = "VENCIMIENTO_RESOLUCION"
    INFRACCION_DETECTADA = "INFRACCION_DETECTADA"
    SANCION_APLICADA = "SANCION_APLICADA"
    FISCALIZACION_PROGRAMADA = "FISCALIZACION_PROGRAMADA"
    RESOLUCION_APROBADA = "RESOLUCION_APROBADA"
    RESOLUCION_RECHAZADA = "RESOLUCION_RECHAZADA"
    EXPEDIENTE_ACTUALIZADO = "EXPEDIENTE_ACTUALIZADO"
    SISTEMA = "SISTEMA"
    OTRO = "OTRO"

class EstadoNotificacion(str, Enum):
    PENDIENTE = "PENDIENTE"
    ENVIADA = "ENVIADA"
    LEIDA = "LEIDA"
    ARCHIVADA = "ARCHIVADA"
    ERROR_ENVIO = "ERROR_ENVIO"

class PrioridadNotificacion(str, Enum):
    BAJA = "BAJA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"
    URGENTE = "URGENTE"

class CanalNotificacion(str, Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"
    PUSH_NOTIFICATION = "PUSH_NOTIFICATION"
    SISTEMA = "SISTEMA"
    WHATSAPP = "WHATSAPP"

class NotificacionBase(BaseModel):
    titulo: str = Field(..., min_length=5, max_length=200, description="Título de la notificación")
    mensaje: str = Field(..., min_length=10, max_length=2000, description="Mensaje de la notificación")
    tipo: TipoNotificacion = Field(..., description="Tipo de notificación")
    prioridad: PrioridadNotificacion = Field(default=PrioridadNotificacion.MEDIA, description="Prioridad de la notificación")
    canal: CanalNotificacion = Field(..., description="Canal de envío de la notificación")
    destinatario_id: str = Field(..., description="ID del destinatario")
    tipo_destinatario: str = Field(..., description="Tipo de destinatario (usuario, empresa, conductor, etc.)")
    entidad_asociada_id: Optional[str] = Field(None, description="ID de la entidad asociada a la notificación")
    tipo_entidad_asociada: Optional[str] = Field(None, description="Tipo de entidad asociada")
    fecha_envio_programado: Optional[datetime] = Field(None, description="Fecha programada para el envío")
    observaciones: Optional[str] = Field(None, max_length=1000, description="Observaciones adicionales")
    
    @validator('titulo')
    def validar_titulo(cls, v):
        if not v.strip():
            raise ValueError("El título de la notificación no puede estar vacío")
        return v.strip()
    
    @validator('mensaje')
    def validar_mensaje(cls, v):
        if not v.strip():
            raise ValueError("El mensaje de la notificación no puede estar vacío")
        return v.strip()

class NotificacionCreate(NotificacionBase):
    pass

class NotificacionUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=5, max_length=200)
    mensaje: Optional[str] = Field(None, min_length=10, max_length=2000)
    prioridad: Optional[PrioridadNotificacion] = None
    canal: Optional[CanalNotificacion] = None
    fecha_envio_programado: Optional[datetime] = None
    observaciones: Optional[str] = Field(None, max_length=1000)
    estado: Optional[EstadoNotificacion] = None

class NotificacionInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    titulo: str
    mensaje: str
    tipo: TipoNotificacion
    prioridad: PrioridadNotificacion
    canal: CanalNotificacion
    destinatario_id: str
    tipo_destinatario: str
    entidad_asociada_id: Optional[str]
    tipo_entidad_asociada: Optional[str]
    fecha_envio_programado: Optional[datetime]
    observaciones: Optional[str]
    estado: EstadoNotificacion = Field(default=EstadoNotificacion.PENDIENTE)
    esta_activo: bool = Field(default=True, alias="estaActivo")
    fecha_registro: datetime = Field(default_factory=datetime.utcnow, alias="fechaRegistro")
    fecha_actualizacion: Optional[datetime] = Field(None, alias="fechaActualizacion")
    fecha_envio: Optional[datetime] = Field(None, alias="fechaEnvio")
    fecha_lectura: Optional[datetime] = Field(None, alias="fechaLectura")
    usuario_registro_id: str = Field(..., alias="usuarioRegistroId")
    intentos_envio: int = Field(default=0, alias="intentosEnvio")
    max_intentos: int = Field(default=3, alias="maxIntentos")
    error_envio: Optional[str] = Field(None, max_length=1000, alias="errorEnvio")
    metadata: Optional[dict] = Field(default_factory=dict, description="Metadatos adicionales")
    notificaciones_relacionadas_ids: List[str] = Field(default_factory=list, alias="notificacionesRelacionadasIds")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class NotificacionResponse(BaseModel):
    id: str
    titulo: str
    mensaje: str
    tipo: TipoNotificacion
    prioridad: PrioridadNotificacion
    canal: CanalNotificacion
    destinatario_id: str
    tipo_destinatario: str
    entidad_asociada_id: Optional[str]
    tipo_entidad_asociada: Optional[str]
    fecha_envio_programado: Optional[datetime]
    observaciones: Optional[str]
    estado: EstadoNotificacion
    esta_activo: bool
    fecha_registro: datetime
    fecha_actualizacion: Optional[datetime]
    fecha_envio: Optional[datetime]
    fecha_lectura: Optional[datetime]
    usuario_registro_id: str
    intentos_envio: int
    max_intentos: int
    error_envio: Optional[str]
    metadata: Optional[dict]
    notificaciones_relacionadas_ids: List[str]

    class Config:
        from_attributes = True

class NotificacionFiltros(BaseModel):
    titulo: Optional[str] = None
    tipo: Optional[TipoNotificacion] = None
    prioridad: Optional[PrioridadNotificacion] = None
    canal: Optional[CanalNotificacion] = None
    estado: Optional[EstadoNotificacion] = None
    destinatario_id: Optional[str] = None
    tipo_destinatario: Optional[str] = None
    entidad_asociada_id: Optional[str] = None
    tipo_entidad_asociada: Optional[str] = None
    usuario_registro_id: Optional[str] = None
    fecha_registro_desde: Optional[datetime] = None
    fecha_registro_hasta: Optional[datetime] = None
    fecha_envio_desde: Optional[datetime] = None
    fecha_envio_hasta: Optional[datetime] = None
    fecha_lectura_desde: Optional[datetime] = None
    fecha_lectura_hasta: Optional[datetime] = None
    no_leidas: Optional[bool] = None
    con_error: Optional[bool] = None 