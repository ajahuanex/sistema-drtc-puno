"""
Schemas Pydantic para VehiculoSolo
Re-exporta y consolida desde vehiculo_solo_schemas.py para evitar duplicidad.
"""
from app.schemas.vehiculo_solo_schemas import (
    CategoriaVehiculo,
    TipoCarroceria,
    TipoCombustible,
    EstadoFisicoVehiculo,
    FuenteDatos,
    VehiculoSoloBase,
    VehiculoSoloCreate,
    VehiculoSoloUpdate,
    VehiculoSoloInDB,
    VehiculoSoloResponse,
    FiltrosVehiculoSolo,
    EstadisticasVehiculoSolo,
    HistorialPlacaBase,
    HistorialPlacaCreate,
    HistorialPlacaInDB,
    PropietarioRegistralBase,
    PropietarioRegistralCreate,
    PropietarioRegistralInDB,
    InspeccionTecnicaBase,
    InspeccionTecnicaCreate,
    InspeccionTecnicaInDB,
)

# Alias de compatibilidad
VehiculoSolo = VehiculoSoloInDB
HistorialPlaca = HistorialPlacaInDB
PropietarioRegistral = PropietarioRegistralInDB
InspeccionTecnica = InspeccionTecnicaInDB

__all__ = [
    "CategoriaVehiculo",
    "TipoCarroceria",
    "TipoCombustible",
    "EstadoFisicoVehiculo",
    "FuenteDatos",
    "VehiculoSoloBase",
    "VehiculoSoloCreate",
    "VehiculoSoloUpdate",
    "VehiculoSoloInDB",
    "VehiculoSoloResponse",
    "FiltrosVehiculoSolo",
    "EstadisticasVehiculoSolo",
    "HistorialPlacaBase",
    "HistorialPlacaCreate",
    "HistorialPlacaInDB",
    "PropietarioRegistralBase",
    "PropietarioRegistralCreate",
    "PropietarioRegistralInDB",
    "InspeccionTecnicaBase",
    "InspeccionTecnicaCreate",
    "InspeccionTecnicaInDB",
    "VehiculoSolo",
    "HistorialPlaca",
    "PropietarioRegistral",
    "InspeccionTecnica",
]
