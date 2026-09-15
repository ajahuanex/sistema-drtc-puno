"""
Esquemas Pydantic para Infraestructura Complementaria (CamelCase & SnakeCase compatibles)
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator, field_validator
from pydantic.alias_generators import to_camel
from app.models.infraestructura import (
    TipoInfraestructura,
    EstadoInfraestructura,
    RazonSocialInfraestructura,
    RepresentanteLegalInfraestructura,
    EspecificacionesInfraestructura,
    DatosSunatInfraestructura,
    DocumentoInfraestructura,
    AuditoriaInfraestructura,
    HistorialEstadoInfraestructura
)


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )


class InfraestructuraBase(CamelModel):
    """Esquema base de infraestructura"""
    ruc: str = Field(..., min_length=11, max_length=11, description="RUC de 11 dígitos")
    razon_social: RazonSocialInfraestructura
    tipo_infraestructura: TipoInfraestructura
    direccion_fiscal: str = Field(..., min_length=5)
    representante_legal: RepresentanteLegalInfraestructura
    email_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    sitio_web: Optional[str] = None
    especificaciones: Optional[EspecificacionesInfraestructura] = None
    observaciones: Optional[str] = None
    resoluciones_primigenias_ids: List[str] = []
    licencias_operacion: List[str] = []
    certificaciones_calidad: List[str] = []

    @field_validator('ruc')
    @classmethod
    def validar_ruc(cls, v: str) -> str:
        v = str(v).strip()
        if not v.isdigit():
            raise ValueError('El RUC debe contener solo dígitos')
        if len(v) != 11:
            raise ValueError('El RUC debe tener 11 dígitos')
        return v


class InfraestructuraCreate(InfraestructuraBase):
    """Esquema para crear infraestructura"""
    pass


class InfraestructuraUpdate(CamelModel):
    """Esquema para actualizar infraestructura"""
    razon_social: Optional[RazonSocialInfraestructura] = None
    tipo_infraestructura: Optional[TipoInfraestructura] = None
    direccion_fiscal: Optional[str] = None
    representante_legal: Optional[RepresentanteLegalInfraestructura] = None
    email_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    sitio_web: Optional[str] = None
    especificaciones: Optional[EspecificacionesInfraestructura] = None
    observaciones: Optional[str] = None


class CambiarEstadoInfraestructura(CamelModel):
    """Esquema para cambiar estado de infraestructura"""
    estado_nuevo: EstadoInfraestructura
    motivo: str = Field(..., min_length=5)
    tipo_documento_sustentatorio: Optional[str] = None
    numero_documento_sustentatorio: Optional[str] = None
    es_documento_fisico: bool = False
    url_documento_sustentatorio: Optional[str] = None
    fecha_documento: Optional[datetime] = None
    entidad_emisora: Optional[str] = None
    observaciones: Optional[str] = None


class InfraestructuraResponse(CamelModel):
    """Esquema de respuesta de infraestructura serializado en CamelCase"""
    id: str = ""
    ruc: str
    razon_social: RazonSocialInfraestructura
    tipo_infraestructura: TipoInfraestructura
    direccion_fiscal: str
    estado: EstadoInfraestructura = EstadoInfraestructura.EN_TRAMITE
    esta_activo: bool = True
    fecha_registro: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    representante_legal: Optional[RepresentanteLegalInfraestructura] = None
    email_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    sitio_web: Optional[str] = None
    documentos: List[DocumentoInfraestructura] = []
    auditoria: List[AuditoriaInfraestructura] = []
    historial_estados: List[HistorialEstadoInfraestructura] = []
    datos_sunat: Optional[DatosSunatInfraestructura] = None
    ultima_validacion_sunat: Optional[datetime] = None
    score_riesgo: int = 0
    observaciones: Optional[str] = None
    especificaciones: Optional[EspecificacionesInfraestructura] = None
    capacidad_maxima: Optional[int] = None
    resoluciones_primigenias_ids: List[str] = []
    licencias_operacion: List[str] = []
    certificaciones_calidad: List[str] = []

    @model_validator(mode='before')
    @classmethod
    def extract_fields(cls, data):
        if isinstance(data, dict):
            # Asegurar id
            if "_id" in data and not data.get("id"):
                data["id"] = str(data["_id"])
            elif "id" in data:
                data["id"] = str(data["id"])
            # Asegurar capacidad_maxima accesible a nivel raíz
            esp = data.get("especificaciones") or {}
            if isinstance(esp, dict) and not data.get("capacidad_maxima") and not data.get("capacidadMaxima"):
                data["capacidad_maxima"] = esp.get("capacidad_maxima") or esp.get("capacidadMaxima")
        return data


class InfraestructuraListResponse(CamelModel):
    """Respuesta de lista de infraestructuras"""
    infraestructuras: List[InfraestructuraResponse]
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int


class InfraestructuraEstadisticas(CamelModel):
    """Estadísticas de infraestructuras"""
    total_infraestructuras: int = 0
    autorizadas: int = 0
    en_tramite: int = 0
    suspendidas: int = 0
    canceladas: int = 0
    terminales_terrestre: int = 0
    estaciones_ruta: int = 0
    otros: int = 0
    capacidad_total_instalada: int = 0
    promedio_capacidad_por_infraestructura: float = 0.0
    infraestructuras_con_documentos_vencidos: int = 0
    infraestructuras_con_score_alto_riesgo: int = 0


class FiltrosInfraestructura(CamelModel):
    """Filtros para búsqueda de infraestructuras"""
    tipo_infraestructura: Optional[List[TipoInfraestructura]] = None
    estado: Optional[List[EstadoInfraestructura]] = None
    departamento: Optional[str] = None
    provincia: Optional[str] = None
    distrito: Optional[str] = None
    capacidad_minima: Optional[int] = None
    capacidad_maxima: Optional[int] = None
    fecha_registro_desde: Optional[datetime] = None
    fecha_registro_hasta: Optional[datetime] = None
    con_documentos_vencidos: Optional[bool] = None
    score_riesgo_minimo: Optional[int] = None
    score_riesgo_maximo: Optional[int] = None
    texto_busqueda: Optional[str] = None
