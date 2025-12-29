"""
Modelos para el historial de vehículos
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from bson import ObjectId


class TipoMovimientoHistorial(str, Enum):
    """Tipos de movimientos en el historial de vehículos"""
    REGISTRO_INICIAL = "REGISTRO_INICIAL"
    CAMBIO_EMPRESA = "CAMBIO_EMPRESA"
    CAMBIO_RESOLUCION = "CAMBIO_RESOLUCION"
    CAMBIO_ESTADO = "CAMBIO_ESTADO"
    ACTUALIZACION_DATOS = "ACTUALIZACION_DATOS"
    CAMBIO_PLACA = "CAMBIO_PLACA"
    BAJA_VEHICULO = "BAJA_VEHICULO"
    REACTIVACION = "REACTIVACION"
    MANTENIMIENTO = "MANTENIMIENTO"
    INSPECCION = "INSPECCION"
    OTRO = "OTRO"


class VehiculoHistorialBase(BaseModel):
    """Modelo base para historial de vehículos"""
    vehiculo_id: str = Field(..., description="ID del vehículo")
    numero_historial: int = Field(..., description="Número secuencial del historial")
    tipo_movimiento: TipoMovimientoHistorial = Field(..., description="Tipo de movimiento")
    fecha_movimiento: datetime = Field(default_factory=datetime.now, description="Fecha del movimiento")
    usuario_id: Optional[str] = Field(None, description="ID del usuario que realizó el cambio")
    
    # Datos del vehículo en ese momento
    placa: str = Field(..., description="Placa del vehículo")
    empresa_anterior_id: Optional[str] = Field(None, description="ID de la empresa anterior")
    empresa_actual_id: str = Field(..., description="ID de la empresa actual")
    resolucion_anterior_id: Optional[str] = Field(None, description="ID de la resolución anterior")
    resolucion_actual_id: Optional[str] = Field(None, description="ID de la resolución actual")
    estado_anterior: Optional[str] = Field(None, description="Estado anterior del vehículo")
    estado_actual: str = Field(..., description="Estado actual del vehículo")
    
    # Datos técnicos en ese momento (snapshot)
    marca: str = Field(..., description="Marca del vehículo")
    modelo: str = Field(..., description="Modelo del vehículo")
    anio_fabricacion: int = Field(..., description="Año de fabricación")
    categoria: str = Field(..., description="Categoría del vehículo")
    datos_tecnicos: Dict[str, Any] = Field(default_factory=dict, description="Snapshot de datos técnicos")
    
    # Metadatos del cambio
    motivo_cambio: Optional[str] = Field(None, description="Motivo del cambio")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales")
    documentos_relacionados: List[str] = Field(default_factory=list, description="IDs de documentos relacionados")
    
    # Control de historial
    es_registro_actual: bool = Field(True, description="Si es el registro más reciente")
    fecha_creacion: datetime = Field(default_factory=datetime.now, description="Fecha de creación del registro")
    fecha_actualizacion: Optional[datetime] = Field(None, description="Fecha de última actualización")
    esta_activo: bool = Field(True, description="Si el registro está activo")


class VehiculoHistorialCreate(BaseModel):
    """Modelo para crear historial de vehículo"""
    vehiculo_id: str = Field(..., description="ID del vehículo")
    tipo_movimiento: TipoMovimientoHistorial = Field(..., description="Tipo de movimiento")
    empresa_anterior_id: Optional[str] = Field(None, description="ID de la empresa anterior")
    empresa_actual_id: str = Field(..., description="ID de la empresa actual")
    resolucion_anterior_id: Optional[str] = Field(None, description="ID de la resolución anterior")
    resolucion_actual_id: Optional[str] = Field(None, description="ID de la resolución actual")
    estado_anterior: Optional[str] = Field(None, description="Estado anterior")
    estado_actual: str = Field(..., description="Estado actual")
    motivo_cambio: Optional[str] = Field(None, description="Motivo del cambio")
    observaciones: Optional[str] = Field(None, description="Observaciones")
    usuario_id: Optional[str] = Field(None, description="ID del usuario")


class VehiculoHistorialUpdate(BaseModel):
    """Modelo para actualizar historial de vehículo"""
    motivo_cambio: Optional[str] = Field(None, description="Motivo del cambio")
    observaciones: Optional[str] = Field(None, description="Observaciones")
    documentos_relacionados: Optional[List[str]] = Field(None, description="Documentos relacionados")
    esta_activo: Optional[bool] = Field(None, description="Estado activo")


class VehiculoHistorialInDB(VehiculoHistorialBase):
    """Modelo de historial de vehículo en base de datos"""
    id: str = Field(..., description="ID único del registro de historial")
    
    class Config:
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class VehiculoHistorialResponse(VehiculoHistorialInDB):
    """Modelo de respuesta para historial de vehículo"""
    pass


class VehiculoHistorialFiltros(BaseModel):
    """Filtros para búsqueda de historial"""
    vehiculo_id: Optional[str] = Field(None, description="ID del vehículo")
    empresa_id: Optional[str] = Field(None, description="ID de la empresa")
    resolucion_id: Optional[str] = Field(None, description="ID de la resolución")
    tipo_movimiento: Optional[TipoMovimientoHistorial] = Field(None, description="Tipo de movimiento")
    fecha_desde: Optional[datetime] = Field(None, description="Fecha desde")
    fecha_hasta: Optional[datetime] = Field(None, description="Fecha hasta")
    usuario_id: Optional[str] = Field(None, description="ID del usuario")
    es_registro_actual: Optional[bool] = Field(None, description="Si es registro actual")


class EstadisticasHistorial(BaseModel):
    """Estadísticas del historial de vehículos"""
    total_registros: int = Field(..., description="Total de registros de historial")
    vehiculos_con_historial: int = Field(..., description="Vehículos con historial")
    movimientos_por_tipo: Dict[str, int] = Field(..., description="Movimientos por tipo")
    movimientos_por_mes: List[Dict[str, Any]] = Field(..., description="Movimientos por mes")
    empresas_con_mas_movimientos: List[Dict[str, Any]] = Field(..., description="Empresas con más movimientos")
    ultima_actualizacion: datetime = Field(..., description="Última actualización")


class ResumenHistorialVehiculo(BaseModel):
    """Resumen del historial de un vehículo"""
    vehiculo_id: str = Field(..., description="ID del vehículo")
    placa: str = Field(..., description="Placa del vehículo")
    total_movimientos: int = Field(..., description="Total de movimientos")
    primer_registro: datetime = Field(..., description="Fecha del primer registro")
    ultimo_movimiento: datetime = Field(..., description="Fecha del último movimiento")
    empresas_historicas: List[str] = Field(..., description="Empresas históricas")
    resoluciones_historicas: List[str] = Field(..., description="Resoluciones históricas")
    estados_historicos: List[str] = Field(..., description="Estados históricos")
    es_actual: bool = Field(..., description="Si es el registro actual")


class OperacionHistorialResponse(BaseModel):
    """Respuesta de operaciones masivas de historial"""
    success: bool = Field(..., description="Si la operación fue exitosa")
    message: str = Field(..., description="Mensaje de la operación")
    registros_procesados: int = Field(0, description="Registros procesados")
    registros_creados: int = Field(0, description="Registros creados")
    registros_actualizados: int = Field(0, description="Registros actualizados")
    errores: List[str] = Field(default_factory=list, description="Lista de errores")