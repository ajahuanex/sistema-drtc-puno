from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum

class TipoActoModificatorio(str, Enum):
    RENOVACION = "RENOVACION"
    INCREMENTO_FLOTA = "INCREMENTO_FLOTA"
    SUSTITUCION_VEHICULAR = "SUSTITUCION_VEHICULAR"
    BAJA_VEHICULAR = "BAJA_VEHICULAR"
    MODIFICACION_RUTA = "MODIFICACION_RUTA"
    CAMBIO_REPRESENTANTE = "CAMBIO_REPRESENTANTE"
    SUSPENSION_TEMPORAL = "SUSPENSION_TEMPORAL"
    CANCELACION_PARCIAL = "CANCELACION_PARCIAL"
    OTROS = "OTROS"

class ResolucionHija(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        arbitrary_types_allowed=True,
        validate_default=True
    )

    id: Optional[str] = None
    nro_resolucion: str = Field(..., description="Número correlativo y año de la resolución hija (ej: 0450-2023)")
    nro_resolucion_primigenia: str = Field(..., description="Número de la resolución primigenia a la que modifica (ej: 0100-2021)")
    resolucion_primigenia_id: Optional[str] = Field(None, description="ID de la resolución primigenia si está vinculada")
    ruc_empresa: str = Field(..., description="RUC de la empresa titular (11 dígitos)")
    
    # Clasificación y fechas
    tipo_acto: TipoActoModificatorio = TipoActoModificatorio.INCREMENTO_FLOTA
    fecha_resolucion: datetime = Field(..., description="Fecha de emisión del acto modificatorio")
    fecha_inicio_efectos: datetime = Field(..., description="Fecha en que surte efecto legal la modificación")
    
    # Expedientes y Documentación
    expediente_numero: Optional[str] = Field(None, description="Número de expediente administrativo de origen")
    link_documento: Optional[str] = Field(None, description="URL en Google Drive o almacenamiento digital del PDF")
    
    # Flota y Rutas Impactadas
    vehiculos_ingresantes: List[str] = Field(default_factory=list, description="Placas o IDs de vehículos dados de alta")
    vehiculos_salientes: List[str] = Field(default_factory=list, description="Placas o IDs de vehículos dados de baja / sustituidos")
    rutas_modificadas_ids: List[str] = Field(default_factory=list, description="IDs o códigos de rutas modificadas")
    
    # Observaciones y control
    observaciones: Optional[str] = Field(None, description="Notas explicativas del acto modificatorio")
    esta_activo: bool = True
    fecha_registro: datetime = Field(default_factory=datetime.utcnow)
    fecha_actualizacion: Optional[datetime] = None

class ResolucionHijaCreate(BaseModel):
    nro_resolucion: str = Field(..., description="Número de la resolución hija (ej. 0450-2023)")
    nro_resolucion_primigenia: str = Field(..., description="Número de la resolución primigenia a modificar (ej. 0100-2021)")
    ruc_empresa: str = Field(..., description="RUC del titular (11 dígitos)")
    tipo_acto: TipoActoModificatorio
    fecha_resolucion: datetime
    fecha_inicio_efectos: Optional[datetime] = None  # Si se omite, se usa fecha_resolucion
    expediente_numero: Optional[str] = None
    link_documento: Optional[str] = None
    vehiculos_ingresantes: List[str] = Field(default_factory=list)
    vehiculos_salientes: List[str] = Field(default_factory=list)
    rutas_modificadas_ids: List[str] = Field(default_factory=list)
    observaciones: Optional[str] = None

class ResolucionHijaUpdate(BaseModel):
    nro_resolucion: Optional[str] = None
    nro_resolucion_primigenia: Optional[str] = None
    ruc_empresa: Optional[str] = None
    tipo_acto: Optional[TipoActoModificatorio] = None
    fecha_resolucion: Optional[datetime] = None
    fecha_inicio_efectos: Optional[datetime] = None
    expediente_numero: Optional[str] = None
    link_documento: Optional[str] = None
    vehiculos_ingresantes: Optional[List[str]] = None
    vehiculos_salientes: Optional[List[str]] = None
    rutas_modificadas_ids: Optional[List[str]] = None
    observaciones: Optional[str] = None

class ResolucionHijaFiltros(BaseModel):
    nro_resolucion: Optional[str] = None
    nro_resolucion_primigenia: Optional[str] = None
    ruc_empresa: Optional[str] = None
    tipo_acto: Optional[TipoActoModificatorio] = None
    fecha_desde: Optional[datetime] = None
    fecha_hasta: Optional[datetime] = None

class ResolucionHijaResponse(ResolucionHija):
    pass
