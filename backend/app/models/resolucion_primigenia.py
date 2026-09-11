from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum

class EstadoResolucionPrimigenia(str, Enum):
    VIGENTE = "VIGENTE"
    CANCELADA = "CANCELADA"
    SUSPENDIDA = "SUSPENDIDA"
    VENCIDA = "VENCIDA"
    ANULADA = "ANULADA"

class FeErrata(BaseModel):
    """Modelo para fe de erratas o rectificación de error material"""
    numero_resolucion: str = Field(..., description="Número de la resolución que contiene la fe de erratas")
    fecha_emision: datetime = Field(..., description="Fecha de emisión de la fe de erratas")
    detalle_correccion: str = Field(..., description="Detalle de los datos rectificados")
    documento_link: Optional[str] = Field(None, description="Enlace a la fe de erratas digital")

class ModificacionHistorial(BaseModel):
    """Modelo para registrar modificaciones posteriores realizadas por resoluciones hijas"""
    resolucion_hija_id: Optional[str] = Field(None, description="ID de la resolución modificatoria si existe")
    nro_resolucion_hija: str = Field(..., description="Número de la resolución modificatoria (ej. 0450-2023)")
    tipo_modificacion: str = Field(..., description="Tipo de modificación: INCREMENTO_FLOTA, SUSTITUCION, CAMBIO_REPRESENTANTE, CANCELACION_RUTA, etc.")
    fecha_acto: datetime = Field(..., description="Fecha en que surte efecto la modificación")
    observacion: Optional[str] = Field(None, description="Detalles u observaciones de la modificación")

class ResolucionPrimigenia(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        arbitrary_types_allowed=True,
        validate_default=True
    )
    
    id: Optional[str] = None
    ruc_empresa: str = Field(..., description="RUC del titular de la autorización (11 dígitos)")
    nro_resolucion: str = Field(..., description="Número correlativo y año de la resolución primigenia (ej: 0100-2021)")
    siglas: Optional[str] = Field(None, description="Siglas institucionales (ej. GRP/GRI/DRTC, GR PUNO/GRI/DRTC, GRP/DRTC)")
    
    # Fechas y vigencia
    fecha_resolucion: Optional[datetime] = Field(None, description="Fecha oficial de emisión del acto originario (opcional)")
    fecha_inicio_vigencia: Optional[datetime] = Field(None, description="Fecha de inicio de efectos legales")
    anios_vigencia: int = Field(default=10, description="Período de vigencia otorgado en años (4 o 10)")
    fecha_fin_vigencia: Optional[datetime] = Field(None, description="Fecha exacta de vencimiento")
    
    # Clasificación y estado
    estado: EstadoResolucionPrimigenia = EstadoResolucionPrimigenia.VIGENTE
    tiene_eficacia_anticipada: bool = Field(default=False, description="Indica si aplica eficacia anticipada (retroactividad)")
    tipo_autorizacion: str = Field(..., description="Modalidad de servicio autorizada (TURISMO, PERSONAS, CARGA, etc.)")
    
    # Documentos y expedientes
    link_documento: Optional[str] = Field(None, description="Enlace al archivo o expediente digital en Google Drive")
    expedientes_codigos: List[str] = Field(default_factory=list, description="Lista de números de expedientes originarios")
    
    # Estructuras hijas y rectificaciones
    fe_erratas: List[FeErrata] = Field(default_factory=list, description="Lista de fe de erratas emitidas sobre esta resolución")
    historial_modificaciones: List[ModificacionHistorial] = Field(default_factory=list, description="Actos posteriores que modifican la primigenia")
    
    # Observaciones y control
    observaciones: Optional[str] = Field(None, description="Anotaciones operativas e incidencias generales")
    esta_activo: bool = True
    fecha_registro: datetime = Field(default_factory=datetime.utcnow)
    fecha_actualizacion: Optional[datetime] = None

class ResolucionPrimigeniaCreate(BaseModel):
    ruc_empresa: str = Field(..., description="RUC del titular de la autorización (11 dígitos)")
    nro_resolucion: str = Field(..., description="Número de resolución (ej. 0100-2021)")
    siglas: Optional[str] = Field(None, description="Siglas institucionales (ej: GRP/GRI/DRTC)")
    fecha_resolucion: Optional[datetime] = None
    fecha_inicio_vigencia: Optional[datetime] = None
    anios_vigencia: int = Field(default=10, description="Años de vigencia (4 o 10)")
    fecha_fin_vigencia: Optional[datetime] = None  # Si se omite, se calcula automáticamente
    estado: EstadoResolucionPrimigenia = EstadoResolucionPrimigenia.VIGENTE
    tiene_eficacia_anticipada: Optional[bool] = None
    tipo_autorizacion: str = Field(..., description="TURISMO, PERSONAS, CARGA, etc.")
    link_documento: Optional[str] = None
    expedientes_codigos: List[str] = Field(default_factory=list)
    observaciones: Optional[str] = None

class ResolucionPrimigeniaUpdate(BaseModel):
    nro_resolucion: Optional[str] = None
    siglas: Optional[str] = None
    fecha_resolucion: Optional[datetime] = None
    fecha_inicio_vigencia: Optional[datetime] = None
    anios_vigencia: Optional[int] = None
    fecha_fin_vigencia: Optional[datetime] = None
    estado: Optional[EstadoResolucionPrimigenia] = None
    tiene_eficacia_anticipada: Optional[bool] = None
    tipo_autorizacion: Optional[str] = None
    link_documento: Optional[str] = None
    expedientes_codigos: Optional[List[str]] = None
    observaciones: Optional[str] = None

class ResolucionPrimigeniaFiltros(BaseModel):
    ruc_empresa: Optional[str] = None
    nro_resolucion: Optional[str] = None
    estado: Optional[EstadoResolucionPrimigenia] = None
    tipo_autorizacion: Optional[str] = None
    fecha_resolucion_desde: Optional[datetime] = None
    fecha_resolucion_hasta: Optional[datetime] = None
    esta_activo: Optional[bool] = True

class ResolucionPrimigeniaResponse(ResolucionPrimigenia):
    pass
