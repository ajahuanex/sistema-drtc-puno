"""
Router para el historial vehicular - Sistema de eventos
Compatible con el frontend HistorialVehicularComponent
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.dependencies.db import get_database
from app.services.historial_vehicular_service import HistorialVehicularService
from app.models.historial_vehicular import (
    HistorialVehicularCreate,
    HistorialVehicularUpdate,
    HistorialVehicularResponse,
    HistorialVehicularListResponse,
    FiltrosHistorialVehicular,
    ResumenHistorialVehicular,
    EstadisticasHistorialVehicular,
    TipoEventoHistorial,
    OperacionHistorialResponse
)
from app.utils.exceptions import (
    ValidationErrorException,
    NotFoundError
)

router = APIRouter(prefix="/historial-vehicular", tags=["Historial Vehicular"])

async def get_historial_service():
    """Dependency para obtener el servicio de historial vehicular"""
    db = await get_database()
    return HistorialVehicularService(db)

@router.get("/", response_model=HistorialVehicularListResponse)
async def get_historial_vehicular(
    vehiculoId: Optional[str] = Query(None, description="ID del vehículo"),
    placa: Optional[str] = Query(None, description="Placa del vehículo"),
    tipoEvento: Optional[List[TipoEventoHistorial]] = Query(None, description="Tipos de evento"),
    empresaId: Optional[str] = Query(None, description="ID de la empresa"),
    resolucionId: Optional[str] = Query(None, description="ID de la resolución"),
    usuarioId: Optional[str] = Query(None, description="ID del usuario"),
    fechaDesde: Optional[str] = Query(None, description="Fecha desde (ISO string)"),
    fechaHasta: Optional[str] = Query(None, description="Fecha hasta (ISO string)"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(25, ge=1, le=100, description="Elementos por página"),
    sortBy: str = Query("fechaEvento", description="Campo para ordenar"),
    sortOrder: str = Query("desc", description="Orden: asc o desc"),
    historial_service: HistorialVehicularService = Depends(get_historial_service)
) -> HistorialVehicularListResponse:
    """Obtener historial vehicular con filtros y paginación"""
    
    filtros = FiltrosHistorialVehicular(
        vehiculoId=vehiculoId,
        placa=placa,
        tipoEvento=tipoEvento,
        empresaId=empresaId,
        resolucionId=resolucionId,
        usuarioId=usuarioId,
        fechaDesde=fechaDesde,
        fechaHasta=fechaHasta,
        page=page,
        limit=limit,
        sortBy=sortBy,
        sortOrder=sortOrder
    )
    
    return await historial_service.obtener_historial_vehicular(filtros)

@router.get("/vehiculos/{vehiculo_id}/historial", response_model=HistorialVehicularListResponse)
async def get_historial_vehiculo(
    vehiculo_id: str,
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(25, ge=1, le=100, description="Elementos por página"),
    sortBy: str = Query("fechaEvento", description="Campo para ordenar"),
    sortOrder: str = Query("desc", description="Orden: asc o desc"),
    historial_service: HistorialVehicularService = Depends(get_historial_service)
) -> HistorialVehicularListResponse:
    """Obtener historial de un vehículo específico"""
    
    if not ObjectId.is_valid(vehiculo_id):
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    filtros = FiltrosHistorialVehicular(
        vehiculoId=vehiculo_id,
        page=page,
        limit=limit,
        sortBy=sortBy,
        sortOrder=sortOrder
    )
    
    return await historial_service.obtener_historial_vehicular(filtros)

@router.get("/vehiculos/{vehiculo_id}/resumen", response_model=ResumenHistorialVehicular)
async def get_resumen_historial_vehiculo(
    vehiculo_id: str,
    historial_service: HistorialVehicularService = Depends(get_historial_service)
) -> ResumenHistorialVehicular:
    """Obtener resumen del historial de un vehículo específico"""
    
    if not ObjectId.is_valid(vehiculo_id):
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    resumen = await historial_service.obtener_resumen_vehiculo(vehiculo_id)
    
    if not resumen:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado o sin historial")
    
    return resumen

@router.get("/eventos/{evento_id}", response_model=HistorialVehicularResponse)
async def get_evento_historial(
    evento_id: str,
    historial_service: HistorialVehicularService = Depends(get_historial_service)
) -> HistorialVehicularResponse:
    """Obtener un evento específico del historial"""
    
    if not ObjectId.is_valid(evento_id):
        raise HTTPException(status_code=400, detail="ID de evento inválido")
    
    evento = await historial_service.obtener_evento(evento_id)
    
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    return evento

@router.post("/eventos", response_model=HistorialVehicularResponse, status_code=201)
async def crear_evento_historial(
    evento_data: HistorialVehicularCreate,
    historial_service: HistorialVehicularService = Depends(get_historial_service)
) -> HistorialVehicularResponse:
    """Crear un nuevo evento en el historial vehicular"""
    
    try:
        return await historial_service.crear_evento(evento_data)
    except ValidationErrorException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.put("/eventos/{evento_id}", response_model=HistorialVehicularResponse)
async def actualizar_evento_historial(
    evento_id: str,
    evento_data: HistorialVehicularUpdate,
    historial_service: HistorialVehicularService = Depends(get_historial_service)
) -> HistorialVehicularResponse:
    """Actualizar un evento del historial"""
    
    if not ObjectId.is_valid(evento_id):
        raise HTTPException(status_code=400, detail="ID de evento inválido")
    
    try:
        evento = await historial_service.actualizar_evento(evento_id, evento_data)
        
        if not evento:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
        
        return evento
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.delete("/eventos/{evento_id}", status_code=204)
async def eliminar_evento_historial(
    evento_id: str,
    historial_service: HistorialVehicularService = Depends(get_historial_service)
):
    """Eliminar un evento del historial"""
    
    if not ObjectId.is_valid(evento_id):
        raise HTTPException(status_code=400, detail="ID de evento inválido")
    
    try:
        success = await historial_service.eliminar_evento(evento_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/estadisticas", response_model=EstadisticasHistorialVehicular)
async def get_estadisticas_historial(
    historial_service: HistorialVehicularService = Depends(get_historial_service)
) -> EstadisticasHistorialVehicular:
    """Obtener estadísticas generales del historial vehicular"""
    return await historial_service.obtener_estadisticas()

@router.get("/tipos-evento", response_model=List[str])
async def get_tipos_evento() -> List[str]:
    """Obtener lista de tipos de evento disponibles"""
    return [tipo.value for tipo in TipoEventoHistorial]

@router.post("/exportar")
async def exportar_historial(
    vehiculoId: Optional[str] = Query(None, description="ID del vehículo"),
    placa: Optional[str] = Query(None, description="Placa del vehículo"),
    tipoEvento: Optional[List[TipoEventoHistorial]] = Query(None, description="Tipos de evento"),
    empresaId: Optional[str] = Query(None, description="ID de la empresa"),
    resolucionId: Optional[str] = Query(None, description="ID de la resolución"),
    usuarioId: Optional[str] = Query(None, description="ID del usuario"),
    fechaDesde: Optional[str] = Query(None, description="Fecha desde (ISO string)"),
    fechaHasta: Optional[str] = Query(None, description="Fecha hasta (ISO string)"),
    formato: str = Query("excel", description="Formato de exportación"),
    historial_service: HistorialVehicularService = Depends(get_historial_service)
):
    """Exportar historial vehicular a Excel"""
    
    filtros = FiltrosHistorialVehicular(
        vehiculoId=vehiculoId,
        placa=placa,
        tipoEvento=tipoEvento,
        empresaId=empresaId,
        resolucionId=resolucionId,
        usuarioId=usuarioId,
        fechaDesde=fechaDesde,
        fechaHasta=fechaHasta,
        page=1,
        limit=10000  # Límite alto para exportación
    )
    
    try:
        archivo_bytes = await historial_service.exportar_historial(filtros, formato)
        
        # Configurar headers para descarga
        filename = f"historial-vehicular-{datetime.now().strftime('%Y%m%d-%H%M%S')}.xlsx"
        headers = {
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
        
        return Response(content=archivo_bytes, headers=headers)
        
    except ValidationErrorException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exportando: {str(e)}")

@router.post("/limpiar-cache", response_model=dict)
async def limpiar_cache_historial(
    historial_service: HistorialVehicularService = Depends(get_historial_service)
) -> dict:
    """Limpiar cache del servicio de historial"""
    
    success = await historial_service.limpiar_cache()
    
    return {
        "success": success,
        "message": "Cache limpiado exitosamente" if success else "Error limpiando cache"
    }

@router.post("/migrar-datos", response_model=OperacionHistorialResponse)
async def migrar_datos_historial(
    historial_service: HistorialVehicularService = Depends(get_historial_service)
) -> OperacionHistorialResponse:
    """Migrar datos existentes al nuevo formato de historial"""
    return await historial_service.migrar_datos_existentes()

# Endpoints para integración con otros módulos
@router.post("/registrar-evento-automatico", response_model=HistorialVehicularResponse)
async def registrar_evento_automatico(
    vehiculoId: str,
    placa: str,
    tipoEvento: TipoEventoHistorial,
    descripcion: str,
    empresaId: Optional[str] = None,
    resolucionId: Optional[str] = None,
    usuarioId: Optional[str] = None,
    usuarioNombre: Optional[str] = None,
    observaciones: Optional[str] = None,
    datosAnteriores: Optional[dict] = None,
    datosNuevos: Optional[dict] = None,
    metadatos: Optional[dict] = None,
    historial_service: HistorialVehicularService = Depends(get_historial_service)
) -> HistorialVehicularResponse:
    """Registrar automáticamente un evento en el historial (para uso interno del sistema)"""
    
    if not ObjectId.is_valid(vehiculoId):
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    try:
        return await historial_service.registrar_evento_automatico(
            vehiculo_id=vehiculoId,
            placa=placa,
            tipo_evento=tipoEvento,
            descripcion=descripcion,
            empresa_id=empresaId,
            resolucion_id=resolucionId,
            usuario_id=usuarioId,
            usuario_nombre=usuarioNombre,
            observaciones=observaciones,
            datos_anteriores=datosAnteriores,
            datos_nuevos=datosNuevos,
            metadatos=metadatos
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registrando evento: {str(e)}")

# Endpoints específicos para empresas
@router.get("/empresas/{empresa_id}/historial", response_model=HistorialVehicularListResponse)
async def get_historial_empresa(
    empresa_id: str,
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(25, ge=1, le=100, description="Elementos por página"),
    sortBy: str = Query("fechaEvento", description="Campo para ordenar"),
    sortOrder: str = Query("desc", description="Orden: asc o desc"),
    historial_service: HistorialVehicularService = Depends(get_historial_service)
) -> HistorialVehicularListResponse:
    """Obtener historial de vehículos de una empresa específica"""
    
    filtros = FiltrosHistorialVehicular(
        empresaId=empresa_id,
        page=page,
        limit=limit,
        sortBy=sortBy,
        sortOrder=sortOrder
    )
    
    return await historial_service.obtener_historial_vehicular(filtros)

# Endpoints específicos para resoluciones
@router.get("/resoluciones/{resolucion_id}/historial", response_model=HistorialVehicularListResponse)
async def get_historial_resolucion(
    resolucion_id: str,
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(25, ge=1, le=100, description="Elementos por página"),
    sortBy: str = Query("fechaEvento", description="Campo para ordenar"),
    sortOrder: str = Query("desc", description="Orden: asc o desc"),
    historial_service: HistorialVehicularService = Depends(get_historial_service)
) -> HistorialVehicularListResponse:
    """Obtener historial de vehículos de una resolución específica"""
    
    filtros = FiltrosHistorialVehicular(
        resolucionId=resolucion_id,
        page=page,
        limit=limit,
        sortBy=sortBy,
        sortOrder=sortOrder
    )
    
    return await historial_service.obtener_historial_vehicular(filtros)