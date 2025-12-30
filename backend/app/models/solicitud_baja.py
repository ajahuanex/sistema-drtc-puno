from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

class MotivoBaja(str, Enum):
    ACCIDENTE = "ACCIDENTE"
    DETERIORO = "DETERIORO"
    OBSOLESCENCIA = "OBSOLESCENCIA"
    CAMBIO_FLOTA = "CAMBIO_FLOTA"
    VENTA = "VENTA"
    ROBO_HURTO = "ROBO_HURTO"
    INCUMPLIMIENTO = "INCUMPLIMIENTO"
    OTROS = "OTROS"

class EstadoSolicitudBaja(str, Enum):
    PENDIENTE = "PENDIENTE"
    EN_REVISION = "EN_REVISION"
    APROBADA = "APROBADA"
    RECHAZADA = "RECHAZADA"
    CANCELADA = "CANCELADA"

class UsuarioInfo(BaseModel):
    usuarioId: str
    nombreUsuario: str
    email: str

class DocumentoSoporte(BaseModel):
    id: str
    nombre: str
    tipo: str
    tamaño: int = Field(alias="tamaño")
    url: str
    fechaSubida: datetime

class SolicitudBajaBase(BaseModel):
    vehiculoId: str
    motivo: MotivoBaja
    descripcion: str
    fechaSolicitud: datetime

class SolicitudBajaCreate(SolicitudBajaBase):
    pass

class SolicitudBajaUpdate(BaseModel):
    estado: Optional[EstadoSolicitudBaja] = None
    observaciones: Optional[str] = None
    fechaRevision: Optional[datetime] = None
    fechaAprobacion: Optional[datetime] = None
    revisadoPor: Optional[UsuarioInfo] = None
    aprobadoPor: Optional[UsuarioInfo] = None

class SolicitudBaja(SolicitudBajaBase):
    id: str
    vehiculoPlaca: str
    empresaId: Optional[str] = None
    empresaNombre: Optional[str] = None
    estado: EstadoSolicitudBaja = EstadoSolicitudBaja.PENDIENTE
    solicitadoPor: UsuarioInfo
    revisadoPor: Optional[UsuarioInfo] = None
    aprobadoPor: Optional[UsuarioInfo] = None
    observaciones: Optional[str] = None
    documentosSoporte: Optional[List[DocumentoSoporte]] = []
    fechaRevision: Optional[datetime] = None
    fechaAprobacion: Optional[datetime] = None
    fechaCreacion: datetime
    fechaActualizacion: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

class SolicitudBajaFilter(BaseModel):
    estado: Optional[List[EstadoSolicitudBaja]] = None
    motivo: Optional[List[MotivoBaja]] = None
    fechaDesde: Optional[datetime] = None
    fechaHasta: Optional[datetime] = None
    empresaId: Optional[str] = None
    vehiculoPlaca: Optional[str] = None
    solicitadoPor: Optional[str] = None