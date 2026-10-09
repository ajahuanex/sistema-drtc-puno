from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum
from .base import CamelModel

class AmbitoTramite(str, Enum):
    EMPRESA = "EMPRESA"
    CONCESION = "CONCESION"

class TipoTramiteAdministrativo(str, Enum):
    CAMBIO_REPRESENTANTE = "CAMBIO_REPRESENTANTE"
    CAMBIO_DOMICILIO = "CAMBIO_DOMICILIO"
    MODIFICACION_RUTA = "MODIFICACION_RUTA"
    MODIFICACION_FRECUENCIA = "MODIFICACION_FRECUENCIA"
    FE_DE_ERRATAS = "FE_DE_ERRATAS"
    REACTIVACION_JUDICIAL = "REACTIVACION_JUDICIAL"

class TramiteAdministrativoCreate(CamelModel):
    ruc_empresa: str = Field(..., description="RUC de la empresa titular (11 dígitos)")
    razon_social: Optional[str] = Field(None, description="Razón social de la empresa")
    ambito: AmbitoTramite = Field(..., description="Ámbito de afectación: EMPRESA o CONCESION")
    tipo_tramite: TipoTramiteAdministrativo = Field(..., description="Tipo específico de trámite")
    
    # Documento resolutivo aprobatorio
    nro_resolucion: str = Field(..., description="Número de resolución que aprueba el acto (ej: R-0123-2026)")
    fecha_resolucion: Optional[datetime] = Field(None, description="Fecha de emisión de la resolución")
    
    # Expediente administrativo
    nro_expediente: Optional[str] = Field(None, description="Número de expediente TUPA (ej: E-0123-2026)")
    fecha_expediente: Optional[datetime] = Field(None, description="Fecha del expediente")
    
    # Si ámbito == CONCESION
    nro_resolucion_primigenia: Optional[str] = Field(None, description="Resolución de concesión afectada")
    
    # Datos específicos del trámite (payload flexible según el tipo)
    detalles: Dict[str, Any] = Field(default_factory=dict, description="Datos modificados (nuevo representante, nuevo domicilio, itinerario, etc.)")
    
    link_documento: Optional[str] = Field(None, description="Enlace a archivo PDF de la resolución")
    link_notificacion: Optional[str] = Field(None, description="Enlace a constancia de notificación")
    observaciones: Optional[str] = Field(None, description="Observaciones o sustento legal")
    usuario: Optional[str] = Field(None, description="Usuario responsable del registro")

class TramiteAdministrativo(TramiteAdministrativoCreate):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
    
    id: str = Field(..., description="Identificador único del trámite")
    estado: str = Field(default="APROBADO", description="Estado del acto administrativo: APROBADO, REGISTRADO, ANULADO")
    fecha_registro: datetime = Field(default_factory=datetime.utcnow)
    fecha_actualizacion: Optional[datetime] = None
