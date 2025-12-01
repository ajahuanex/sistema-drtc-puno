from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
# from bson import ObjectId
from enum import Enum

class EstadoTuc(str, Enum):
    VIGENTE = "VIGENTE"
    DADA_DE_BAJA = "DADA_DE_BAJA"
    DESECHADA = "DESECHADA"

class TipoTramite(str, Enum):
    AUTORIZACION_NUEVA = "AUTORIZACION_NUEVA"
    RENOVACION = "RENOVACION"
    INCREMENTO = "INCREMENTO"
    SUSTITUCION = "SUSTITUCION"
    OTROS = "OTROS"

class Tuc(BaseModel):
    id: Optional[str] = None
    vehiculoId: str
    empresaId: str
    resolucionPadreId: str
    nroTuc: str
    fechaEmision: datetime
    fechaVencimiento: Optional[datetime] = None
    estado: EstadoTuc
    razonDescarte: Optional[str] = None
    estaActivo: bool = True
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    documentoId: Optional[str] = None
    qrVerificationUrl: str
    datosVehiculo: dict  # Datos del vehículo al momento de la emisión
    datosEmpresa: dict   # Datos de la empresa al momento de la emisión
    datosRuta: dict      # Datos de la ruta al momento de la emisión
    observaciones: Optional[str] = None
    historialIds: List[str] = []

class TucCreate(BaseModel):
    vehiculoId: str
    empresaId: str
    resolucionPadreId: str
    nroTuc: str
    fechaEmision: datetime
    fechaVencimiento: Optional[datetime] = None
    estado: EstadoTuc = EstadoTuc.VIGENTE
    documentoId: Optional[str] = None
    observaciones: Optional[str] = None

class TucUpdate(BaseModel):
    estado: Optional[EstadoTuc] = None
    razonDescarte: Optional[str] = None
    fechaVencimiento: Optional[datetime] = None
    documentoId: Optional[str] = None
    observaciones: Optional[str] = None

class TucInDB(Tuc):
    """Modelo para TUC en base de datos con campos adicionales de seguridad"""
    pass

class TucFiltros(BaseModel):
    nroTuc: Optional[str] = None
    vehiculoId: Optional[str] = None
    empresaId: Optional[str] = None
    resolucionPadreId: Optional[str] = None
    estado: Optional[EstadoTuc] = None
    fechaEmisionDesde: Optional[datetime] = None
    fechaEmisionHasta: Optional[datetime] = None
    fechaVencimientoDesde: Optional[datetime] = None
    fechaVencimientoHasta: Optional[datetime] = None
    tieneDocumento: Optional[bool] = None

class TucResponse(BaseModel):
    id: str
    vehiculoId: str
    empresaId: str
    resolucionPadreId: str
    nroTuc: str
    fechaEmision: datetime
    fechaVencimiento: Optional[datetime] = None
    estado: EstadoTuc
    razonDescarte: Optional[str] = None
    estaActivo: bool
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    documentoId: Optional[str] = None
    qrVerificationUrl: str
    datosVehiculo: dict
    datosEmpresa: dict
    datosRuta: dict
    observaciones: Optional[str] = None
    historialIds: List[str]

class TucEstadisticas(BaseModel):
    totalTucs: int
    tucsVigentes: int
    tucsDadasDeBaja: int
    tucsDesechadas: int
    tucsVencidos: int
    tucsPorVencer: int
    promedioTucsPorVehiculo: float
    promedioTucsPorEmpresa: float
    distribucionPorEstado: dict

class TucResumen(BaseModel):
    id: str
    nroTuc: str
    vehiculoId: str
    empresaId: str
    estado: EstadoTuc
    fechaEmision: datetime
    fechaVencimiento: Optional[datetime] = None
    tieneDocumento: bool
    qrVerificationUrl: str
    ultimaActualizacion: datetime

class VerificacionTuc(BaseModel):
    nroTuc: str
    valido: bool
    estado: EstadoTuc
    fechaEmision: datetime
    fechaVencimiento: Optional[datetime] = None
    vehiculo: dict
    empresa: dict
    ruta: dict
    documento: Optional[dict] = None
    fechaVerificacion: datetime
    error: Optional[str] = None

class GeneracionTuc(BaseModel):
    vehiculoId: str
    empresaId: str
    resolucionPadreId: str
    fechaEmision: datetime
    fechaVencimiento: Optional[datetime] = None
    observaciones: Optional[str] = None

class TucHistorial(BaseModel):
    id: Optional[str] = None
    tucId: str
    fechaCambio: datetime
    tipoCambio: str
    usuarioId: str
    campoAnterior: Optional[str] = None
    campoNuevo: Optional[str] = None
    observaciones: Optional[str] = None
    datosCompletos: dict  # Estado completo del TUC antes del cambio 