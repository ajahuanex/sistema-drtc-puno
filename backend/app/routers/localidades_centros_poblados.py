"""
Router para centros poblados
Endpoints específicos para gestión de centros poblados
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies.db import get_database
from app.services.localidad_service import LocalidadService
from app.models.localidad import (
    LocalidadResponse, FiltroLocalidades, TipoLocalidad, LocalidadUpdate
)

router = APIRouter(prefix="/localidades/centros-poblados", tags=["centros-poblados"])

async def get_localidad_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> LocalidadService:
    return LocalidadService(db)

@router.get("/distrito/{distrito_id}", response_model=List[LocalidadResponse])
async def obtener_centros_poblados_por_distrito(
    distrito_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """Obtener centros poblados de un distrito específico"""
    distrito = await service.get_localidad_by_id(distrito_id)
    if not distrito:
        raise HTTPException(status_code=404, detail="Distrito no encontrado")
    
    filtros = FiltroLocalidades(
        tipo=TipoLocalidad.CENTRO_POBLADO,
        distrito=distrito.distrito,
        estaActiva=True
    )
    
    centros_poblados = await service.get_localidades(filtros)
    return [LocalidadResponse(**cp.model_dump()) for cp in centros_poblados]

@router.get("/estadisticas")
async def obtener_estadisticas_centros_poblados(
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Obtener estadísticas de centros poblados"""
    try:
        filtros = FiltroLocalidades(tipo=TipoLocalidad.CENTRO_POBLADO)
        centros_poblados = await service.get_localidades(filtros, skip=0, limit=10000)
        
        total = len(centros_poblados)
        activos = sum(1 for cp in centros_poblados if cp.estaActiva)
        con_coordenadas = sum(1 for cp in centros_poblados if cp.coordenadas)
        
        # Estadísticas por distrito
        por_distrito = {}
        for cp in centros_poblados:
            distrito = cp.distrito or "Sin distrito"
            por_distrito[distrito] = por_distrito.get(distrito, 0) + 1
        
        # Estadísticas por tipo de área
        por_tipo_area = {}
        for cp in centros_poblados:
            tipo_area = cp.tipo_area or "Sin especificar"
            por_tipo_area[tipo_area] = por_tipo_area.get(tipo_area, 0) + 1
        
        return {
            "total": total,
            "activos": activos,
            "inactivos": total - activos,
            "con_coordenadas": con_coordenadas,
            "sin_coordenadas": total - con_coordenadas,
            "por_distrito": dict(sorted(por_distrito.items(), key=lambda x: x[1], reverse=True)[:10]),
            "por_tipo_area": por_tipo_area
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")

@router.post("/validar-limpiar")
async def validar_y_limpiar_centros_poblados(
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Validar y limpiar datos de centros poblados"""
    try:
        filtros = FiltroLocalidades(tipo=TipoLocalidad.CENTRO_POBLADO)
        centros_poblados = await service.get_localidades(filtros, skip=0, limit=10000)
        
        procesados = 0
        corregidos = 0
        errores = []
        
        for cp in centros_poblados:
            try:
                procesados += 1
                cambios = {}
                
                # Normalizar nombres
                if cp.nombre:
                    nombre_normalizado = cp.nombre.upper().strip()
                    if nombre_normalizado != cp.nombre:
                        cambios['nombre'] = nombre_normalizado
                
                # Validar coordenadas (rango de Puno)
                if cp.coordenadas:
                    if (cp.coordenadas.latitud < -18.5 or cp.coordenadas.latitud > -13.0 or
                        cp.coordenadas.longitud < -71.5 or cp.coordenadas.longitud > -68.0):
                        cambios['coordenadas'] = None
                        errores.append(f"Coordenadas inválidas para {cp.nombre}")
                
                # Aplicar cambios
                if cambios:
                    await service.update_localidad(cp.id, LocalidadUpdate(**cambios))
                    corregidos += 1
                    
            except Exception as e:
                errores.append(f"Error procesando {cp.nombre}: {str(e)}")
        
        return {
            'procesados': procesados,
            'corregidos': corregidos,
            'errores': errores[:20]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validando datos: {str(e)}")
