"""
Modelos Pydantic para el módulo Flota Empresa.
Colección MongoDB: flota_empresa
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class EstadoVehiculoEmpresa(str, Enum):
    HABILITADO = "HABILITADO"
    INHABILITADO = "INHABILITADO"
    OBSERVADO = "OBSERVADO"
    CANCELADO = "CANCELADO"
    SUSPENDIDO = "SUSPENDIDO"


class TipoResolucionHija(str, Enum):
    INCREMENTO = "I"
    SUSTITUCION = "S"
    MODIFICACION = "M"
    OTROS = "O"
    CANCELACION = "C"


class EntradaObservacion(BaseModel):
    texto: str
    fecha: Optional[datetime] = None
    fuente: Optional[str] = None  # "importacion", "manual", etc.

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}


class VehiculoEmpresaCreate(BaseModel):
    ruc: str = Field(..., min_length=11, max_length=11, description="RUC de la empresa (11 dígitos)")
    razon_social: Optional[str] = None
    nro_resolucion_primigenia: str = Field(..., description="Número de resolución primigenia (ej: R-0128-2024)")
    nro_resolucion_hija: Optional[str] = None
    tipo_resolucion_hija: Optional[str] = None  # I/S/M/O/C
    placa: str = Field(default="-", description="Placa del vehículo. '-' si es registro cronológico")
    es_cronologico: bool = Field(default=False, description="True si la placa es vacía/guion (solo cronología)")
    rutas: List[str] = Field(default_factory=list, description="Lista de códigos de ruta normalizados")
    numero_tuc: Optional[str] = None  # Normalizado: T-012345 o T-A2B-123
    estado: Optional[str] = None  # None si es solo cronológico
    observaciones_historial: List[EntradaObservacion] = Field(default_factory=list)
    fecha_cronologica: Optional[datetime] = None
    fecha_resolucion_hija: Optional[datetime] = None
    id_origen: Optional[str] = None
    notificado: Optional[str] = None
    estado_primigenia: Optional[str] = None  # ACTIVA/INACTIVA
    fecha_vigencia_hasta: Optional[datetime] = None
    num_expediente: Optional[str] = None
    fecha_expediente: Optional[datetime] = None
    link_tuc: Optional[str] = None
    link_notificacion: Optional[str] = None
    detalles: Optional[str] = None


class VehiculoEmpresaUpdate(BaseModel):
    razon_social: Optional[str] = None
    nro_resolucion_hija: Optional[str] = None
    tipo_resolucion_hija: Optional[str] = None
    placa: Optional[str] = None
    rutas: Optional[List[str]] = None
    numero_tuc: Optional[str] = None
    estado: Optional[str] = None
    fecha_cronologica: Optional[datetime] = None
    fecha_resolucion_hija: Optional[datetime] = None
    notificado: Optional[str] = None
    estado_primigenia: Optional[str] = None
    esta_activo: Optional[bool] = None
    num_expediente: Optional[str] = None
    fecha_expediente: Optional[datetime] = None
    link_tuc: Optional[str] = None
    link_notificacion: Optional[str] = None
    detalles: Optional[str] = None


class AgregarObservacionRequest(BaseModel):
    texto: str = Field(..., min_length=1, description="Texto de la nueva observación")
    fuente: Optional[str] = Field(default="manual", description="Fuente de la observación")


class VehiculoEmpresaResponse(BaseModel):
    id: str
    ruc: str
    razon_social: Optional[str] = None
    nro_resolucion_primigenia: str
    nro_resolucion_hija: Optional[str] = None
    tipo_resolucion_hija: Optional[str] = None
    placa: str
    es_cronologico: bool = False
    rutas: List[str] = []
    numero_tuc: Optional[str] = None
    estado: Optional[str] = None
    observaciones_historial: List[EntradaObservacion] = []
    fecha_cronologica: Optional[datetime] = None
    fecha_resolucion_hija: Optional[datetime] = None
    id_origen: Optional[str] = None
    notificado: Optional[str] = None
    estado_primigenia: Optional[str] = None
    num_expediente: Optional[str] = None
    fecha_expediente: Optional[datetime] = None
    link_tuc: Optional[str] = None
    link_notificacion: Optional[str] = None
    detalles: Optional[str] = None
    fecha_registro: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    esta_activo: bool = True

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}

    @classmethod
    def from_mongo(cls, doc: dict) -> "VehiculoEmpresaResponse":
        """Convertir documento MongoDB a modelo de respuesta."""
        if not doc:
            return None
        doc["id"] = str(doc.pop("_id", ""))
        # Convertir observaciones
        obs_raw = doc.get("observaciones_historial", [])
        doc["observaciones_historial"] = [
            EntradaObservacion(**o) if isinstance(o, dict) else EntradaObservacion(texto=str(o))
            for o in obs_raw
        ]
        return cls(**doc)
