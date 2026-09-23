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
    FE_DE_ERRATAS = "FE_DE_ERRATAS"
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
    nro_resolucion: str = Field(..., description="Número normalizado de resolución hija (ej: R-0123-2026(S))")
    nro_resolucion_primigenia: str = Field(..., description="Número de resolución primigenia a la que modifica (ej: 0100-2021)")
    resolucion_primigenia_id: Optional[str] = Field(None, description="ID de resolución primigenia si está vinculada")
    ruc_empresa: str = Field(..., description="RUC de la empresa titular (11 dígitos)")
    razon_social: Optional[str] = Field(None, description="Razón social de la empresa de transporte")
    
    # Clasificación y fechas
    tipo_acto: TipoActoModificatorio = TipoActoModificatorio.INCREMENTO_FLOTA
    tipo_tramite_origen: Optional[str] = Field(None, description="Nombre o descripción original del trámite (SUSTITUCION, INCREMENTO, etc.)")
    fecha_resolucion: Optional[datetime] = Field(None, description="Fecha de emisión del acto modificatorio")
    fecha_inicio_efectos: Optional[datetime] = Field(None, description="Fecha en que surte efecto legal la modificación")
    
    # Expedientes y Documentación
    expediente_numero: Optional[str] = Field(None, description="Número normalizado de expediente (ej: E-0123-2026)")
    fecha_expediente: Optional[datetime] = Field(None, description="Fecha de presentación del expediente")
    link_documento: Optional[str] = Field(None, description="URL en Google Drive o almacenamiento del PDF de la resolución")
    link_notificacion: Optional[str] = Field(None, description="URL o constancia de notificación")
    
    # Flota, TUCs y Rutas Impactadas
    vehiculos_ingresantes: List[str] = Field(default_factory=list, description="Placas de vehículos dados de alta / ingresantes")
    vehiculos_salientes: List[str] = Field(default_factory=list, description="Placas de vehículos dados de baja / sustituidos")
    rutas_modificadas_ids: List[str] = Field(default_factory=list, description="Códigos de rutas designadas o modificadas (ej: ['01','02'])")
    numeros_tuc: List[str] = Field(default_factory=list, description="Números de TUC emitidos / de alta")
    tucs_baja: List[str] = Field(default_factory=list, description="Números de TUC en baja")
    
    # Observaciones y control
    id_origen: Optional[str] = Field(None, description="ID externo de origen")
    observaciones: Optional[str] = Field(None, description="Notas explicativas del acto modificatorio")
    esta_activo: bool = True
    fecha_registro: Optional[datetime] = Field(default=None, description="Fecha de creación en el sistema")
    fecha_actualizacion: Optional[datetime] = None

class ResolucionHijaCreate(BaseModel):
    nro_resolucion: str = Field(..., description="Número normalizado de la resolución hija (ej. R-0450-2023(I))")
    nro_resolucion_primigenia: str = Field(..., description="Número de la resolución primigenia a modificar")
    ruc_empresa: str = Field(..., description="RUC del titular (11 dígitos)")
    razon_social: Optional[str] = None
    tipo_acto: TipoActoModificatorio
    tipo_tramite_origen: Optional[str] = None
    fecha_resolucion: Optional[datetime] = None
    fecha_inicio_efectos: Optional[datetime] = None
    expediente_numero: Optional[str] = None
    fecha_expediente: Optional[datetime] = None
    link_documento: Optional[str] = None
    link_notificacion: Optional[str] = None
    vehiculos_ingresantes: List[str] = Field(default_factory=list)
    vehiculos_salientes: List[str] = Field(default_factory=list)
    rutas_modificadas_ids: List[str] = Field(default_factory=list)
    numeros_tuc: List[str] = Field(default_factory=list)
    tucs_baja: List[str] = Field(default_factory=list)
    id_origen: Optional[str] = None
    observaciones: Optional[str] = None

class ResolucionHijaUpdate(BaseModel):
    nro_resolucion: Optional[str] = None
    nro_resolucion_primigenia: Optional[str] = None
    ruc_empresa: Optional[str] = None
    razon_social: Optional[str] = None
    tipo_acto: Optional[TipoActoModificatorio] = None
    tipo_tramite_origen: Optional[str] = None
    fecha_resolucion: Optional[datetime] = None
    fecha_inicio_efectos: Optional[datetime] = None
    expediente_numero: Optional[str] = None
    fecha_expediente: Optional[datetime] = None
    link_documento: Optional[str] = None
    link_notificacion: Optional[str] = None
    vehiculos_ingresantes: Optional[List[str]] = None
    vehiculos_salientes: Optional[List[str]] = None
    rutas_modificadas_ids: Optional[List[str]] = None
    numeros_tuc: Optional[List[str]] = None
    tucs_baja: Optional[List[str]] = None
    id_origen: Optional[str] = None
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
