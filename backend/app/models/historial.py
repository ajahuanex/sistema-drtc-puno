from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class TipoCambioHistorial(str, Enum):
    # Vehículos
    CAMBIO_EMPRESA = "CAMBIO_EMPRESA"
    CAMBIO_ESTADO = "CAMBIO_ESTADO"
    DESVINCULACION = "DESVINCULACION"
    CAMBIO_PLACA = "CAMBIO_PLACA"
    CAMBIO_TUC = "CAMBIO_TUC"
    
    # Conductores
    ASOCIACION_EMPRESA = "ASOCIACION_EMPRESA"
    DESASOCIACION_EMPRESA = "DESASOCIACION_EMPRESA"
    CAMBIO_LICENCIA = "CAMBIO_LICENCIA"
    INFRACCION = "INFRACCION"
    CAMBIO_ESTADO = "CAMBIO_ESTADO"
    
    # Expedientes
    CAMBIO_ESTADO = "CAMBIO_ESTADO"
    ADJUNTAR_DOCUMENTO = "ADJUNTAR_DOCUMENTO"
    CAMBIO_TIPO_TRAMITE = "CAMBIO_TIPO_TRAMITE"
    
    # Empresas
    APERTURA_TRAMITE = "APERTURA_TRAMITE"
    RESOLUCION_EMITIDA = "RESOLUCION_EMITIDA"
    CAMBIO_ESTADO = "CAMBIO_ESTADO"
    VALIDACION_SUNAT = "VALIDACION_SUNAT"

class HistorialBase(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    fechaCambio: datetime = Field(default_factory=datetime.utcnow)
    usuarioId: str
    tipoCambio: TipoCambioHistorial
    detalles: Dict[str, Any]
    observaciones: Optional[str] = None
    estaActivo: bool = True

class VehiculoHistorial(HistorialBase):
    vehiculoId: str
    tipoCambio: TipoCambioHistorial = Field(..., description="Tipos específicos para vehículos")
    
    class Config:
        json_schema_extra = {
            "example": {
                "vehiculoId": "507f1f77bcf86cd799439011",
                "usuarioId": "507f1f77bcf86cd799439012",
                "tipoCambio": "CAMBIO_EMPRESA",
                "detalles": {
                    "empresaAnteriorId": "507f1f77bcf86cd799439013",
                    "empresaNuevaId": "507f1f77bcf86cd799439014",
                    "placaAnterior": "ABC-123",
                    "placaNueva": "XYZ-789",
                    "motivo": "Cambio de titularidad"
                },
                "observaciones": "Transferencia de vehículo entre empresas"
            }
        }

class ConductorHistorial(HistorialBase):
    conductorId: str
    tipoCambio: TipoCambioHistorial = Field(..., description="Tipos específicos para conductores")
    
    class Config:
        json_schema_extra = {
            "example": {
                "conductorId": "507f1f77bcf86cd799439011",
                "usuarioId": "507f1f77bcf86cd799439012",
                "tipoCambio": "ASOCIACION_EMPRESA",
                "detalles": {
                    "empresaId": "507f1f77bcf86cd799439013",
                    "fechaAsociacion": "2025-01-15T10:00:00Z",
                    "cargo": "Conductor Principal"
                },
                "observaciones": "Nueva asociación laboral"
            }
        }

class ExpedienteHistorial(HistorialBase):
    expedienteId: str
    tipoCambio: TipoCambioHistorial = Field(..., description="Tipos específicos para expedientes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "expedienteId": "507f1f77bcf86cd799439011",
                "usuarioId": "507f1f77bcf86cd799439012",
                "tipoCambio": "CAMBIO_ESTADO",
                "detalles": {
                    "estadoAnterior": "EN PROCESO",
                    "estadoNuevo": "APROBADO",
                    "fechaCambio": "2025-01-15T10:00:00Z"
                },
                "observaciones": "Expediente aprobado por autoridad competente"
            }
        }

class EmpresaHistorial(HistorialBase):
    empresaId: str
    tipoCambio: TipoCambioHistorial = Field(..., description="Tipos específicos para empresas")
    
    class Config:
        json_schema_extra = {
            "example": {
                "empresaId": "507f1f77bcf86cd799439011",
                "usuarioId": "507f1f77bcf86cd799439012",
                "tipoCambio": "RESOLUCION_EMITIDA",
                "detalles": {
                    "resolucionId": "507f1f77bcf86cd799439013",
                    "nroResolucion": "R-1234-2025",
                    "fechaEmision": "2025-01-15T10:00:00Z"
                },
                "observaciones": "Resolución de autorización emitida"
            }
        }

class HistorialCreate(BaseModel):
    usuarioId: str
    tipoCambio: TipoCambioHistorial
    detalles: Dict[str, Any]
    observaciones: Optional[str] = None

class HistorialResponse(BaseModel):
    id: str
    fechaCambio: datetime
    usuarioId: str
    tipoCambio: TipoCambioHistorial
    detalles: Dict[str, Any]
    observaciones: Optional[str] = None
    estaActivo: bool

class HistorialFiltros(BaseModel):
    fechaDesde: Optional[datetime] = None
    fechaHasta: Optional[datetime] = None
    tipoCambio: Optional[TipoCambioHistorial] = None
    usuarioId: Optional[str] = None
    estaActivo: Optional[bool] = None 