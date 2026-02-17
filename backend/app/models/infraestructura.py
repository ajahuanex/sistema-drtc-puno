"""
Modelo de Infraestructura Complementaria
Representa terminales terrestres, estaciones de ruta y otros servicios complementarios
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class TipoInfraestructura(str, Enum):
    """Tipos de infraestructura complementaria"""
    TERMINAL_TERRESTRE = "TERMINAL_TERRESTRE"
    ESTACION_DE_RUTA = "ESTACION_DE_RUTA"
    OTROS = "OTROS"


class EstadoInfraestructura(str, Enum):
    """Estados de la infraestructura"""
    AUTORIZADA = "AUTORIZADA"
    EN_TRAMITE = "EN_TRAMITE"
    SUSPENDIDA = "SUSPENDIDA"
    CANCELADA = "CANCELADA"


class RazonSocialInfraestructura(BaseModel):
    """Razón social de la infraestructura"""
    principal: str
    sunat: Optional[str] = None
    minimo: Optional[str] = None


class RepresentanteLegalInfraestructura(BaseModel):
    """Representante legal de la infraestructura"""
    dni: str
    nombres: str
    apellidos: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None


class DocumentoInfraestructura(BaseModel):
    """Documento asociado a la infraestructura"""
    id: str
    tipo: str
    numero: str
    fecha_emision: datetime
    fecha_vencimiento: Optional[datetime] = None
    entidad_emisora: str
    url_archivo: Optional[str] = None
    es_documento_fisico: bool = False
    observaciones: Optional[str] = None


class AuditoriaInfraestructura(BaseModel):
    """Registro de auditoría"""
    fecha_cambio: datetime
    usuario_id: str
    tipo_cambio: str
    campo_anterior: Optional[str] = None
    campo_nuevo: str
    observaciones: Optional[str] = None


class HistorialEstadoInfraestructura(BaseModel):
    """Historial de cambios de estado"""
    fecha_cambio: datetime
    usuario_id: str
    estado_anterior: EstadoInfraestructura
    estado_nuevo: EstadoInfraestructura
    motivo: str
    tipo_documento_sustentatorio: Optional[str] = None
    numero_documento_sustentatorio: Optional[str] = None
    es_documento_fisico: bool = False
    url_documento_sustentatorio: Optional[str] = None
    fecha_documento: Optional[datetime] = None
    entidad_emisora: Optional[str] = None
    observaciones: Optional[str] = None


class DatosSunatInfraestructura(BaseModel):
    """Datos de validación SUNAT"""
    valido: bool
    razon_social: Optional[str] = None
    estado: Optional[str] = None
    condicion: Optional[str] = None
    direccion: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    error: Optional[str] = None


class HorarioOperacion(BaseModel):
    """Horario de operación"""
    apertura: str
    cierre: str
    dias_operacion: List[str]


class CoordenadasGPS(BaseModel):
    """Coordenadas GPS"""
    latitud: float
    longitud: float


class ZonaOperativa(BaseModel):
    """Zona operativa de la infraestructura"""
    nombre: str
    capacidad: int
    tipo: str


class EspecificacionesInfraestructura(BaseModel):
    """Especificaciones técnicas de la infraestructura"""
    capacidad_maxima: Optional[int] = None
    area_total: Optional[float] = None
    numero_andenes: Optional[int] = None
    numero_plataformas: Optional[int] = None
    servicios_disponibles: Optional[List[str]] = None
    horario_operacion: Optional[HorarioOperacion] = None
    coordenadas_gps: Optional[CoordenadasGPS] = None
    zonas_operativas: Optional[List[ZonaOperativa]] = None


class Infraestructura(BaseModel):
    """Modelo principal de Infraestructura Complementaria"""
    id: Optional[str] = Field(None, alias="_id")
    ruc: str
    razon_social: RazonSocialInfraestructura
    tipo_infraestructura: TipoInfraestructura
    direccion_fiscal: str
    estado: EstadoInfraestructura = EstadoInfraestructura.EN_TRAMITE
    esta_activo: bool = True
    fecha_registro: datetime = Field(default_factory=datetime.now)
    fecha_actualizacion: datetime = Field(default_factory=datetime.now)
    representante_legal: RepresentanteLegalInfraestructura
    email_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    sitio_web: Optional[str] = None
    documentos: List[DocumentoInfraestructura] = []
    auditoria: List[AuditoriaInfraestructura] = []
    historial_estados: List[HistorialEstadoInfraestructura] = []
    datos_sunat: DatosSunatInfraestructura
    ultima_validacion_sunat: datetime = Field(default_factory=datetime.now)
    score_riesgo: int = 0
    observaciones: Optional[str] = None
    especificaciones: EspecificacionesInfraestructura
    resoluciones_primigenias_ids: List[str] = []
    licencias_operacion: List[str] = []
    certificaciones_calidad: List[str] = []

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "ruc": "20123456789",
                "razon_social": {
                    "principal": "Terminal Terrestre Central Puno"
                },
                "tipo_infraestructura": "TERMINAL_TERRESTRE",
                "direccion_fiscal": "Av. Principal 123, Puno",
                "estado": "AUTORIZADA",
                "representante_legal": {
                    "dni": "12345678",
                    "nombres": "Juan Carlos",
                    "apellidos": "Pérez García"
                },
                "datos_sunat": {
                    "valido": True
                },
                "especificaciones": {
                    "capacidad_maxima": 1000,
                    "area_total": 5000,
                    "numero_andenes": 10,
                    "numero_plataformas": 5
                }
            }
        }
