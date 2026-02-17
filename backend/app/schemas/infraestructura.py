"""
Esquemas Pydantic para Infraestructura
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from app.models.infraestructura import (
    TipoInfraestructura,
    EstadoInfraestructura,
    RazonSocialInfraestructura,
    RepresentanteLegalInfraestructura,
    EspecificacionesInfraestructura,
    DatosSunatInfraestructura
)


class InfraestructuraBase(BaseModel):
    """Esquema base de infraestructura"""
    ruc: str = Field(..., min_length=11, max_length=11, description="RUC de 11 dígitos")
    razon_social: RazonSocialInfraestructura
    tipo_infraestructura: TipoInfraestructura
    direccion_fiscal: str = Field(..., min_length=10)
    representante_legal: RepresentanteLegalInfraestructura
    email_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    sitio_web: Optional[str] = None
    especificaciones: EspecificacionesInfraestructura
    observaciones: Optional[str] = None

    @validator('ruc')
    def validar_ruc(cls, v):
        if not v.isdigit():
            raise ValueError('El RUC debe contener solo dígitos')
        if len(v) != 11:
            raise ValueError('El RUC debe tener 11 dígitos')
        return v


class InfraestructuraCreate(InfraestructuraBase):
    """Esquema para crear infraestructura"""
    pass


class InfraestructuraUpdate(BaseModel):
    """Esquema para actualizar infraestructura"""
    razon_social: Optional[RazonSocialInfraestructura] = None
    direccion_fiscal: Optional[str] = None
    representante_legal: Optional[RepresentanteLegalInfraestructura] = None
    email_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    sitio_web: Optional[str] = None
    especificaciones: Optional[EspecificacionesInfraestructura] = None
    observaciones: Optional[str] = None


class CambiarEstadoInfraestructura(BaseModel):
    """Esquema para cambiar estado de infraestructura"""
    estado_nuevo: EstadoInfraestructura
    motivo: str = Field(..., min_length=10)
    tipo_documento_sustentatorio: Optional[str] = None
    numero_documento_sustentatorio: Optional[str] = None
    es_documento_fisico: bool = False
    url_documento_sustentatorio: Optional[str] = None
    fecha_documento: Optional[datetime] = None
    entidad_emisora: Optional[str] = None
    observaciones: Optional[str] = None


class InfraestructuraResponse(BaseModel):
    """Esquema de respuesta de infraestructura"""
    id: str = Field(..., alias="_id")
    ruc: str
    razon_social: RazonSocialInfraestructura
    tipo_infraestructura: TipoInfraestructura
    direccion_fiscal: str
    estado: EstadoInfraestructura
    esta_activo: bool
    fecha_registro: datetime
    fecha_actualizacion: datetime
    representante_legal: RepresentanteLegalInfraestructura
    email_contacto: Optional[str]
    telefono_contacto: Optional[str]
    sitio_web: Optional[str]
    datos_sunat: DatosSunatInfraestructura
    ultima_validacion_sunat: datetime
    score_riesgo: int
    observaciones: Optional[str]
    especificaciones: EspecificacionesInfraestructura
    resoluciones_primigenias_ids: List[str]
    licencias_operacion: List[str]
    certificaciones_calidad: List[str]

    class Config:
        populate_by_name = True
        from_attributes = True


class InfraestructuraListResponse(BaseModel):
    """Respuesta de lista de infraestructuras"""
    infraestructuras: List[InfraestructuraResponse]
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int


class InfraestructuraEstadisticas(BaseModel):
    """Estadísticas de infraestructuras"""
    total_infraestructuras: int
    autorizadas: int
    en_tramite: int
    suspendidas: int
    canceladas: int
    terminales_terrestre: int
    estaciones_ruta: int
    otros: int
    capacidad_total_instalada: int
    promedio_capacidad_por_infraestructura: float
    infraestructuras_con_documentos_vencidos: int
    infraestructuras_con_score_alto_riesgo: int


class FiltrosInfraestructura(BaseModel):
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
