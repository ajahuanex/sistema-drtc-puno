"""
Modelos para el historial vehicular - Sistema de eventos
Compatible con el frontend HistorialVehicularComponent
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from bson import ObjectId


class TipoEventoHistorial(str, Enum):
    """Tipos de eventos del historial vehicular"""
    CREACION = "CREACION"
    MODIFICACION = "MODIFICACION"
    TRANSFERENCIA_EMPRESA = "TRANSFERENCIA_EMPRESA"
    CAMBIO_RESOLUCION = "CAMBIO_RESOLUCION"
    CAMBIO_ESTADO = "CAMBIO_ESTADO"
    ASIGNACION_RUTA = "ASIGNACION_RUTA"
    DESASIGNACION_RUTA = "DESASIGNACION_RUTA"
    ACTUALIZACION_TUC = "ACTUALIZACION_TUC"
    RENOVACION_TUC = "RENOVACION_TUC"
    SUSPENSION = "SUSPENSION"
    REACTIVACION = "REACTIVACION"
    BAJA_DEFINITIVA = "BAJA_DEFINITIVA"
    MANTENIMIENTO = "MANTENIMIENTO"
    INSPECCION = "INSPECCION"
    ACCIDENTE = "ACCIDENTE"
    MULTA = "MULTA"
    REVISION_TECNICA = "REVISION_TECNICA"
    CAMBIO_PROPIETARIO = "CAMBIO_PROPIETARIO"
    ACTUALIZACION_DATOS_TECNICOS = "ACTUALIZACION_DATOS_TECNICOS"
    OTROS = "OTROS"


class HistorialVehicularBase(BaseModel):
    """Modelo base para eventos del historial vehicular"""
    vehiculoId: str = Field(..., description="ID del vehículo")
    placa: str = Field(..., description="Placa del vehículo en formato XXX-123")
    tipoEvento: TipoEventoHistorial = Field(..., description="Tipo de evento")
    fechaEvento: datetime = Field(default_factory=datetime.now, description="Fecha y hora del evento")
    descripcion: str = Field(..., description="Descripción del evento")
    
    # Datos relacionados (opcionales)
    empresaId: Optional[str] = Field(None, description="ID de la empresa relacionada")
    resolucionId: Optional[str] = Field(None, description="ID de la resolución relacionada")
    usuarioId: Optional[str] = Field(None, description="ID del usuario que realizó la acción")
    usuarioNombre: Optional[str] = Field(None, description="Nombre del usuario")
    
    # Información adicional
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales")
    datosAnteriores: Optional[Dict[str, Any]] = Field(None, description="Datos anteriores del vehículo")
    datosNuevos: Optional[Dict[str, Any]] = Field(None, description="Datos nuevos del vehículo")
    documentosSoporte: List[str] = Field(default_factory=list, description="IDs de documentos de soporte")
    metadatos: Optional[Dict[str, Any]] = Field(None, description="Metadatos adicionales del evento")


class HistorialVehicularCreate(BaseModel):
    """Modelo para crear un evento de historial vehicular"""
    vehiculoId: str = Field(..., description="ID del vehículo")
    placa: str = Field(..., description="Placa del vehículo")
    tipoEvento: TipoEventoHistorial = Field(..., description="Tipo de evento")
    descripcion: str = Field(..., description="Descripción del evento")
    empresaId: Optional[str] = Field(None, description="ID de la empresa")
    resolucionId: Optional[str] = Field(None, description="ID de la resolución")
    usuarioId: Optional[str] = Field(None, description="ID del usuario")
    usuarioNombre: Optional[str] = Field(None, description="Nombre del usuario")
    observaciones: Optional[str] = Field(None, description="Observaciones")
    datosAnteriores: Optional[Dict[str, Any]] = Field(None, description="Datos anteriores")
    datosNuevos: Optional[Dict[str, Any]] = Field(None, description="Datos nuevos")
    documentosSoporte: List[str] = Field(default_factory=list, description="Documentos de soporte")
    metadatos: Optional[Dict[str, Any]] = Field(None, description="Metadatos")


class HistorialVehicularUpdate(BaseModel):
    """Modelo para actualizar un evento de historial vehicular"""
    descripcion: Optional[str] = Field(None, description="Descripción del evento")
    observaciones: Optional[str] = Field(None, description="Observaciones")
    documentosSoporte: Optional[List[str]] = Field(None, description="Documentos de soporte")
    metadatos: Optional[Dict[str, Any]] = Field(None, description="Metadatos")


class HistorialVehicularInDB(HistorialVehicularBase):
    """Modelo de historial vehicular en base de datos"""
    id: str = Field(..., description="ID único del evento")
    
    class Config:
        populate_by_name = True  # Pydantic V2
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class HistorialVehicularResponse(HistorialVehicularInDB):
    """Modelo de respuesta para eventos de historial vehicular"""
    pass


class FiltrosHistorialVehicular(BaseModel):
    """Filtros para búsqueda de historial vehicular"""
    vehiculoId: Optional[str] = Field(None, description="ID del vehículo")
    placa: Optional[str] = Field(None, description="Placa del vehículo")
    tipoEvento: Optional[List[TipoEventoHistorial]] = Field(None, description="Tipos de evento")
    empresaId: Optional[str] = Field(None, description="ID de la empresa")
    resolucionId: Optional[str] = Field(None, description="ID de la resolución")
    usuarioId: Optional[str] = Field(None, description="ID del usuario")
    fechaDesde: Optional[str] = Field(None, description="Fecha desde (ISO string)")
    fechaHasta: Optional[str] = Field(None, description="Fecha hasta (ISO string)")
    
    # Paginación
    page: int = Field(1, description="Número de página", ge=1)
    limit: int = Field(25, description="Elementos por página", ge=1, le=100)
    
    # Ordenamiento
    sortBy: str = Field("fechaEvento", description="Campo para ordenar")
    sortOrder: str = Field("desc", description="Orden: asc o desc")


class HistorialVehicularListResponse(BaseModel):
    """Respuesta paginada de historial vehicular"""
    historial: List[HistorialVehicularResponse] = Field(..., description="Lista de eventos")
    total: int = Field(..., description="Total de eventos")
    page: int = Field(..., description="Página actual")
    limit: int = Field(..., description="Elementos por página")
    totalPages: int = Field(..., description="Total de páginas")
    hasNext: bool = Field(..., description="Si hay página siguiente")
    hasPrev: bool = Field(..., description="Si hay página anterior")


class ResumenHistorialVehicular(BaseModel):
    """Resumen del historial de un vehículo específico"""
    vehiculoId: str = Field(..., description="ID del vehículo")
    placa: str = Field(..., description="Placa del vehículo")
    totalEventos: int = Field(..., description="Total de eventos")
    primerEvento: Optional[HistorialVehicularResponse] = Field(None, description="Primer evento")
    ultimoEvento: Optional[HistorialVehicularResponse] = Field(None, description="Último evento")
    empresasHistoricas: List[str] = Field(..., description="IDs de empresas históricas")
    resolucionesHistoricas: List[str] = Field(..., description="IDs de resoluciones históricas")
    eventosPorTipo: Dict[str, int] = Field(..., description="Eventos agrupados por tipo")


class EstadisticasHistorialVehicular(BaseModel):
    """Estadísticas generales del historial vehicular"""
    totalEventos: int = Field(..., description="Total de eventos")
    vehiculosConHistorial: int = Field(..., description="Vehículos con historial")
    eventosPorTipo: Dict[str, int] = Field(..., description="Eventos por tipo")
    eventosPorMes: List[Dict[str, Any]] = Field(..., description="Eventos por mes")
    empresasConMasEventos: List[Dict[str, Any]] = Field(..., description="Empresas con más eventos")
    usuariosConMasEventos: List[Dict[str, Any]] = Field(..., description="Usuarios con más eventos")
    ultimaActualizacion: datetime = Field(..., description="Última actualización")


class OperacionHistorialResponse(BaseModel):
    """Respuesta de operaciones de historial"""
    success: bool = Field(..., description="Si la operación fue exitosa")
    message: str = Field(..., description="Mensaje de la operación")
    eventosCreados: int = Field(0, description="Eventos creados")
    eventosActualizados: int = Field(0, description="Eventos actualizados")
    errores: List[str] = Field(default_factory=list, description="Lista de errores")


# Funciones de utilidad para conversión de tipos
def convert_to_frontend_format(db_record: dict) -> dict:
    """Convierte un registro de BD al formato esperado por el frontend"""
    if "_id" in db_record:
        db_record["id"] = str(db_record["_id"])
        del db_record["_id"]
    
    # Convertir fechas a ISO string si es necesario
    if "fechaEvento" in db_record and isinstance(db_record["fechaEvento"], datetime):
        db_record["fechaEvento"] = db_record["fechaEvento"].isoformat()
    
    return db_record


def convert_from_frontend_format(frontend_data: dict) -> dict:
    """Convierte datos del frontend al formato de BD"""
    if "id" in frontend_data:
        frontend_data["_id"] = ObjectId(frontend_data["id"])
        del frontend_data["id"]
    
    # Convertir fechas ISO string a datetime si es necesario
    if "fechaEvento" in frontend_data and isinstance(frontend_data["fechaEvento"], str):
        frontend_data["fechaEvento"] = datetime.fromisoformat(frontend_data["fechaEvento"].replace("Z", "+00:00"))
    
    return frontend_data