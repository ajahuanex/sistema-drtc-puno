from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class EstadoPapeleta(str, Enum):
    EMITIDA = "EMITIDA"
    PAGADA = "PAGADA"
    IMPUGNADA = "IMPUGNADA"
    ANULADA = "ANULADA"
    EN_PROCESO_IMPUGNACION = "EN_PROCESO_IMPUGNACION"

class ResultadoFiscalizacion(str, Enum):
    CON_INFRACCION = "CON_INFRACCION"
    SIN_INFRACCION = "SIN_INFRACCION"
    ADVERTENCIA = "ADVERTENCIA"

class TipoInfraccion(str, Enum):
    EXCESO_VELOCIDAD = "EXCESO_VELOCIDAD"
    EXCESO_PASAJEROS = "EXCESO_PASAJEROS"
    DOCUMENTACION_VENCIDA = "DOCUMENTACION_VENCIDA"
    LICENCIA_VENCIDA = "LICENCIA_VENCIDA"
    TUC_VENCIDO = "TUC_VENCIDO"
    RESOLUCION_VENCIDA = "RESOLUCION_VENCIDA"
    RUTA_NO_AUTORIZADA = "RUTA_NO_AUTORIZADA"
    VEHICULO_NO_AUTORIZADO = "VEHICULO_NO_AUTORIZADO"
    CONDUCTOR_NO_AUTORIZADO = "CONDUCTOR_NO_AUTORIZADO"
    OTROS = "OTROS"

class Infraccion(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    codigo: str
    descripcion: str
    tipo: TipoInfraccion
    montoMulta: float
    puntosPenalizacion: Optional[int] = 0
    normativa: str
    articulo: Optional[str] = None
    inciso: Optional[str] = None
    estaActivo: bool = True
    fechaCreacion: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "codigo": "I-001",
                "descripcion": "Exceso de velocidad en zona urbana",
                "tipo": "EXCESO_VELOCIDAD",
                "montoMulta": 500.00,
                "puntosPenalizacion": 10,
                "normativa": "Decreto Supremo N° 017-2009-MTC",
                "articulo": "Artículo 198",
                "inciso": "a)"
            }
        }

class InfraccionCreate(BaseModel):
    codigo: str
    descripcion: str
    tipo: TipoInfraccion
    montoMulta: float
    puntosPenalizacion: Optional[int] = 0
    normativa: str
    articulo: Optional[str] = None
    inciso: Optional[str] = None

class InfraccionUpdate(BaseModel):
    codigo: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[TipoInfraccion] = None
    montoMulta: Optional[float] = None
    puntosPenalizacion: Optional[int] = None
    normativa: Optional[str] = None
    articulo: Optional[str] = None
    inciso: Optional[str] = None

class Inspector(BaseModel):
    id: str
    dni: str
    nombres: str
    apellidos: str
    cargo: str
    area: str

class VehiculoInspeccionado(BaseModel):
    id: str
    placa: str
    empresaId: str
    empresaNombre: str

class Papeleta(BaseModel):
    nroPapeleta: str
    infraccionesIds: List[str]
    infracciones: Optional[List[Infraccion]] = []
    observaciones: Optional[str] = None
    montoTotal: float
    estado: EstadoPapeleta
    fechaEmision: datetime = Field(default_factory=datetime.utcnow)
    fechaVencimiento: Optional[datetime] = None
    fechaPago: Optional[datetime] = None
    fechaImpugnacion: Optional[datetime] = None
    motivoImpugnacion: Optional[str] = None
    resolucionImpugnacion: Optional[str] = None
    fechaResolucionImpugnacion: Optional[datetime] = None

class Fiscalizacion(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    fechaHora: datetime = Field(default_factory=datetime.utcnow)
    inspector: Inspector
    vehiculoInspeccionado: VehiculoInspeccionado
    ubicacion: Optional[str] = None
    coordenadas: Optional[dict] = None
    resultado: ResultadoFiscalizacion
    papeleta: Optional[Papeleta] = None
    fotos: Optional[List[str]] = []
    observacionesGenerales: Optional[str] = None
    estaActivo: bool = True
    fechaCreacion: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "inspector": {
                    "id": "507f1f77bcf86cd799439011",
                    "dni": "40123456",
                    "nombres": "Juan Carlos",
                    "apellidos": "Perez Quispe",
                    "cargo": "Inspector de Tránsito",
                    "area": "Fiscalización"
                },
                "vehiculoInspeccionado": {
                    "id": "507f1f77bcf86cd799439012",
                    "placa": "ABC-123",
                    "empresaId": "507f1f77bcf86cd799439013",
                    "empresaNombre": "Transportes El Veloz S.A.C."
                },
                "resultado": "CON_INFRACCION",
                "papeleta": {
                    "nroPapeleta": "P-001-2025",
                    "montoTotal": 500.00,
                    "estado": "EMITIDA"
                }
            }
        }

class FiscalizacionCreate(BaseModel):
    inspector: Inspector
    vehiculoInspeccionado: VehiculoInspeccionado
    ubicacion: Optional[str] = None
    coordenadas: Optional[dict] = None
    resultado: ResultadoFiscalizacion
    papeleta: Optional[Papeleta] = None
    fotos: Optional[List[str]] = []
    observacionesGenerales: Optional[str] = None

class FiscalizacionUpdate(BaseModel):
    ubicacion: Optional[str] = None
    coordenadas: Optional[dict] = None
    resultado: Optional[ResultadoFiscalizacion] = None
    papeleta: Optional[Papeleta] = None
    fotos: Optional[List[str]] = None
    observacionesGenerales: Optional[str] = None

class FiscalizacionFiltros(BaseModel):
    fechaDesde: Optional[datetime] = None
    fechaHasta: Optional[datetime] = None
    inspectorId: Optional[str] = None
    vehiculoPlaca: Optional[str] = None
    empresaId: Optional[str] = None
    resultado: Optional[ResultadoFiscalizacion] = None
    estadoPapeleta: Optional[EstadoPapeleta] = None
    estaActivo: Optional[bool] = None

class FiscalizacionEstadisticas(BaseModel):
    totalFiscalizaciones: int
    conInfraccion: int
    sinInfraccion: int
    advertencias: int
    papeletasEmitidas: int
    papeletasPagadas: int
    papeletasImpugnadas: int
    montoTotalMultas: float
    montoTotalPagado: float
    montoTotalPendiente: float

class InfraccionResponse(BaseModel):
    id: str
    codigo: str
    descripcion: str
    tipo: TipoInfraccion
    montoMulta: float
    puntosPenalizacion: int
    normativa: str
    articulo: Optional[str]
    inciso: Optional[str]
    estaActivo: bool
    fechaCreacion: datetime
    fechaActualizacion: Optional[datetime]

class FiscalizacionResponse(BaseModel):
    id: str
    fechaHora: datetime
    inspector: Inspector
    vehiculoInspeccionado: VehiculoInspeccionado
    ubicacion: Optional[str]
    coordenadas: Optional[dict]
    resultado: ResultadoFiscalizacion
    papeleta: Optional[Papeleta]
    fotos: List[str]
    observacionesGenerales: Optional[str]
    estaActivo: bool
    fechaCreacion: datetime
    fechaActualizacion: Optional[datetime] 