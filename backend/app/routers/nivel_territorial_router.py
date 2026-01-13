#!/usr/bin/env python3
"""
Router para análisis de niveles territoriales en rutas
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from datetime import datetime

from ..models.localidad import (
    NivelTerritorial,
    AnalisisNivelTerritorial,
    FiltroRutasPorNivel,
    EstadisticasNivelTerritorial,
    LocalidadConJerarquia,
    LocalidadEnRuta
)
from ..services.nivel_territorial_service import nivel_territorial_service

router = APIRouter(prefix="/nivel-territorial", tags=["Nivel Territorial"])

@router.get("/analizar-ruta/{ruta_id}", response_model=AnalisisNivelTerritorial)
async def analizar_ruta_territorial(ruta_id: str):
    """
    Analiza una ruta específica y determina los niveles territoriales involucrados
    """
    try:
        analisis = await nivel_territorial_service.analizar_ruta_completa(ruta_id)
        if not analisis:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")
        return analisis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analizando ruta: {str(e)}")

@router.get("/localidad/{localidad_id}", response_model=LocalidadEnRuta)
async def obtener_localidad_con_nivel(localidad_id: str):
    """
    Obtiene una localidad con su nivel territorial determinado
    """
    try:
        localidad = await nivel_territorial_service.obtener_localidad_con_nivel(localidad_id)
        if not localidad:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return localidad
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo localidad: {str(e)}")

@router.get("/jerarquia/{localidad_id}", response_model=LocalidadConJerarquia)
async def obtener_jerarquia_localidad(localidad_id: str):
    """
    Obtiene la jerarquía territorial completa de una localidad
    """
    try:
        jerarquia = await nivel_territorial_service.obtener_jerarquia_localidad(localidad_id)
        if not jerarquia:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return jerarquia
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo jerarquía: {str(e)}")

@router.post("/buscar-rutas", response_model=List[AnalisisNivelTerritorial])
async def buscar_rutas_por_nivel(filtros: FiltroRutasPorNivel):
    """
    Busca rutas que cumplan con criterios específicos de nivel territorial
    """
    try:
        rutas = await nivel_territorial_service.buscar_rutas_por_nivel(filtros)
        return rutas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error buscando rutas: {str(e)}")

@router.get("/estadisticas", response_model=EstadisticasNivelTerritorial)
async def obtener_estadisticas_territoriales():
    """
    Genera estadísticas completas de niveles territoriales en todas las rutas
    """
    try:
        estadisticas = await nivel_territorial_service.generar_estadisticas_territoriales()
        return estadisticas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando estadísticas: {str(e)}")

@router.get("/rutas-interdepartamentales", response_model=List[AnalisisNivelTerritorial])
async def obtener_rutas_interdepartamentales():
    """
    Obtiene todas las rutas que cruzan departamentos
    """
    try:
        filtros = FiltroRutasPorNivel()
        todas_rutas = await nivel_territorial_service.buscar_rutas_por_nivel(filtros)
        
        # Filtrar solo las interdepartamentales
        interdepartamentales = [
            ruta for ruta in todas_rutas 
            if ruta.clasificacion_territorial == "INTERDEPARTAMENTAL"
        ]
        
        return interdepartamentales
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo rutas interdepartamentales: {str(e)}")

@router.get("/rutas-interprovinciales", response_model=List[AnalisisNivelTerritorial])
async def obtener_rutas_interprovinciales():
    """
    Obtiene todas las rutas que cruzan provincias (pero no departamentos)
    """
    try:
        filtros = FiltroRutasPorNivel()
        todas_rutas = await nivel_territorial_service.buscar_rutas_por_nivel(filtros)
        
        # Filtrar solo las interprovinciales
        interprovinciales = [
            ruta for ruta in todas_rutas 
            if ruta.clasificacion_territorial == "INTERPROVINCIAL"
        ]
        
        return interprovinciales
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo rutas interprovinciales: {str(e)}")

@router.get("/rutas-locales", response_model=List[AnalisisNivelTerritorial])
async def obtener_rutas_locales():
    """
    Obtiene todas las rutas locales (dentro del mismo distrito)
    """
    try:
        filtros = FiltroRutasPorNivel()
        todas_rutas = await nivel_territorial_service.buscar_rutas_por_nivel(filtros)
        
        # Filtrar solo las locales
        locales = [
            ruta for ruta in todas_rutas 
            if ruta.clasificacion_territorial == "LOCAL"
        ]
        
        return locales
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo rutas locales: {str(e)}")

@router.get("/rutas-por-departamento/{departamento}", response_model=List[AnalisisNivelTerritorial])
async def obtener_rutas_por_departamento(
    departamento: str,
    como_origen: bool = Query(True, description="Buscar como origen"),
    como_destino: bool = Query(True, description="Buscar como destino")
):
    """
    Obtiene rutas que tienen origen o destino en un departamento específico
    """
    try:
        filtros = FiltroRutasPorNivel()
        
        if como_origen and not como_destino:
            filtros.departamento_origen = departamento.upper()
        elif como_destino and not como_origen:
            filtros.departamento_destino = departamento.upper()
        elif como_origen and como_destino:
            # Buscar rutas donde el departamento aparezca como origen O destino
            filtros_origen = FiltroRutasPorNivel(departamento_origen=departamento.upper())
            filtros_destino = FiltroRutasPorNivel(departamento_destino=departamento.upper())
            
            rutas_origen = await nivel_territorial_service.buscar_rutas_por_nivel(filtros_origen)
            rutas_destino = await nivel_territorial_service.buscar_rutas_por_nivel(filtros_destino)
            
            # Combinar y eliminar duplicados
            rutas_ids = set()
            rutas_combinadas = []
            
            for ruta in rutas_origen + rutas_destino:
                if ruta.ruta_id not in rutas_ids:
                    rutas_ids.add(ruta.ruta_id)
                    rutas_combinadas.append(ruta)
            
            return rutas_combinadas
        
        rutas = await nivel_territorial_service.buscar_rutas_por_nivel(filtros)
        return rutas
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo rutas por departamento: {str(e)}")

@router.get("/niveles-disponibles", response_model=List[str])
async def obtener_niveles_territoriales():
    """
    Obtiene la lista de niveles territoriales disponibles
    """
    return [nivel.value for nivel in NivelTerritorial]

@router.get("/clasificaciones-disponibles", response_model=List[str])
async def obtener_clasificaciones_territoriales():
    """
    Obtiene la lista de clasificaciones territoriales disponibles
    """
    return [
        "INTERDEPARTAMENTAL",
        "INTERPROVINCIAL", 
        "INTERDISTRITAL",
        "LOCAL"
    ]

@router.get("/resumen-ruta/{ruta_id}")
async def obtener_resumen_territorial_ruta(ruta_id: str):
    """
    Obtiene un resumen rápido del análisis territorial de una ruta
    """
    try:
        analisis = await nivel_territorial_service.analizar_ruta_completa(ruta_id)
        if not analisis:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
        return {
            "ruta_id": analisis.ruta_id,
            "codigo_ruta": analisis.codigo_ruta,
            "nombre_ruta": analisis.nombre_ruta,
            "clasificacion_territorial": analisis.clasificacion_territorial,
            "origen": {
                "nombre": analisis.origen.nombre,
                "nivel": analisis.origen.nivel_territorial.value,
                "departamento": analisis.origen.departamento,
                "provincia": analisis.origen.provincia
            },
            "destino": {
                "nombre": analisis.destino.nombre,
                "nivel": analisis.destino.nivel_territorial.value,
                "departamento": analisis.destino.departamento,
                "provincia": analisis.destino.provincia
            },
            "total_localidades": analisis.total_localidades,
            "niveles_involucrados": [nivel.value for nivel in analisis.niveles_involucrados],
            "cruza_departamentos": analisis.origen.departamento != analisis.destino.departamento,
            "cruza_provincias": analisis.origen.provincia != analisis.destino.provincia,
            "cruza_distritos": analisis.origen.distrito != analisis.destino.distrito
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo resumen: {str(e)}")

@router.get("/validar-nivel/{localidad_id}")
async def validar_nivel_territorial(localidad_id: str):
    """
    Valida y determina el nivel territorial de una localidad específica
    """
    try:
        localidad = await nivel_territorial_service.obtener_localidad_con_nivel(localidad_id)
        if not localidad:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        
        return {
            "localidad_id": localidad.localidad_id,
            "nombre": localidad.nombre,
            "ubigeo": localidad.ubigeo,
            "nivel_territorial": localidad.nivel_territorial.value,
            "departamento": localidad.departamento,
            "provincia": localidad.provincia,
            "distrito": localidad.distrito,
            "municipalidad": localidad.municipalidad_centro_poblado,
            "criterio_determinacion": "Basado en UBIGEO y tipo de municipalidad"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validando nivel territorial: {str(e)}")