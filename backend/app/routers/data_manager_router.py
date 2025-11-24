from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Optional, Any
from app.services.data_manager_service import get_data_manager
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/data-manager", tags=["Data Manager"])

@router.get("/estadisticas", summary="Obtener estadísticas globales del sistema")
async def obtener_estadisticas_globales():
    """Obtener estadísticas completas del sistema"""
    try:
        data_manager = get_data_manager()
        estadisticas = data_manager.obtener_estadisticas_globales()
        return {
            "success": True,
            "data": estadisticas,
            "message": "Estadísticas globales obtenidas exitosamente"
        }
    except Exception as e:
        logger.error(f"Error al obtener estadísticas globales: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/relaciones", summary="Obtener mapa completo de relaciones")
async def obtener_mapa_relaciones():
    """Obtener el mapa completo de relaciones entre todos los módulos"""
    try:
        data_manager = get_data_manager()
        relaciones = data_manager.obtener_mapa_relaciones()
        return {
            "success": True,
            "data": relaciones,
            "message": "Mapa de relaciones obtenido exitosamente"
        }
    except Exception as e:
        logger.error(f"Error al obtener mapa de relaciones: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/empresa/{empresa_id}/completa", summary="Obtener empresa con todas sus relaciones")
async def obtener_empresa_completa(empresa_id: str):
    """Obtener empresa completa con todas sus relaciones"""
    try:
        data_manager = get_data_manager()
        empresa = data_manager.obtener_empresa_completa(empresa_id)
        if not empresa:
            raise HTTPException(status_code=404, detail=f"Empresa {empresa_id} no encontrada")
        
        return {
            "success": True,
            "data": empresa,
            "message": f"Empresa {empresa_id} obtenida exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener empresa completa {empresa_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/vehiculo/{vehiculo_id}/completo", summary="Obtener vehículo con todas sus relaciones")
async def obtener_vehiculo_completo(vehiculo_id: str):
    """Obtener vehículo completo con todas sus relaciones"""
    try:
        data_manager = get_data_manager()
        vehiculo = data_manager.obtener_vehiculo_completo(vehiculo_id)
        if not vehiculo:
            raise HTTPException(status_code=404, detail=f"Vehículo {vehiculo_id} no encontrado")
        
        return {
            "success": True,
            "data": vehiculo,
            "message": f"Vehículo {vehiculo_id} obtenido exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener vehículo completo {vehiculo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/vehiculo/{vehiculo_id}/flujo-completo", summary="Obtener flujo completo de un vehículo")
async def obtener_flujo_completo_vehiculo(vehiculo_id: str):
    """Obtener el flujo completo de un vehículo"""
    try:
        data_manager = get_data_manager()
        flujo = data_manager.obtener_flujo_completo_vehiculo(vehiculo_id)
        if not flujo:
            raise HTTPException(status_code=404, detail=f"Vehículo {vehiculo_id} no encontrado")
        
        return {
            "success": True,
            "data": flujo,
            "message": f"Flujo completo del vehículo {vehiculo_id} obtenido exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener flujo completo del vehículo {vehiculo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/buscar/{modulo}", summary="Buscar elementos por criterios")
async def buscar_por_criterios(
    modulo: str,
    empresa_id: Optional[str] = Query(None, description="Filtrar por empresa"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    activo: Optional[bool] = Query(None, description="Filtrar por activo/inactivo")
):
    """Buscar elementos en un módulo específico por criterios"""
    try:
        data_manager = get_data_manager()
        modulos_validos = ["empresas", "vehiculos", "conductores", "rutas", "expedientes", "resoluciones"]
        if modulo not in modulos_validos:
            raise HTTPException(
                status_code=400, 
                detail=f"Módulo inválido. Válidos: {', '.join(modulos_validos)}"
            )
        
        # Construir criterios de búsqueda
        criterios = {}
        if empresa_id:
            criterios["empresaId"] = empresa_id
        if estado:
            criterios["estado"] = estado
        if tipo:
            if modulo == "conductores":
                criterios["tipoConductor"] = tipo
            elif modulo == "expedientes":
                criterios["tipoTramite"] = tipo
            elif modulo == "resoluciones":
                criterios["tipoResolucion"] = tipo
        if activo is not None:
            criterios["estaActivo"] = activo
        
        resultados = data_manager.buscar_por_criterios(modulo, criterios)
        
        return {
            "success": True,
            "data": {
                "modulo": modulo,
                "criterios": criterios,
                "total_encontrados": len(resultados),
                "resultados": resultados
            },
            "message": f"Búsqueda en {modulo} completada. {len(resultados)} resultados encontrados"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en búsqueda por criterios: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/datos/{modulo}", summary="Obtener todos los datos de un módulo")
async def obtener_datos_modulo(modulo: str):
    """Obtener todos los datos de un módulo específico"""
    try:
        data_manager = get_data_manager()
        modulos_validos = ["empresas", "vehiculos", "conductores", "rutas", "expedientes", "resoluciones"]
        if modulo not in modulos_validos:
            raise HTTPException(
                status_code=400, 
                detail=f"Módulo inválido. Válidos: {', '.join(modulos_validos)}"
            )
        
        if modulo == "empresas":
            datos = dict(data_manager.empresas)
        elif modulo == "vehiculos":
            datos = dict(data_manager.vehiculos)
        elif modulo == "conductores":
            datos = dict(data_manager.conductores)
        elif modulo == "rutas":
            datos = dict(data_manager.rutas)
        elif modulo == "expedientes":
            datos = dict(data_manager.expedientes)
        elif modulo == "resoluciones":
            datos = dict(data_manager.resoluciones)
        
        return {
            "success": True,
            "data": {
                "modulo": modulo,
                "total": len(datos),
                "datos": datos
            },
            "message": f"Datos del módulo {modulo} obtenidos exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener datos del módulo {modulo}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.post("/agregar/{modulo}", summary="Agregar nuevo elemento a un módulo")
async def agregar_elemento(modulo: str, datos: Dict[str, Any]):
    """Agregar un nuevo elemento a un módulo específico"""
    try:
        data_manager = get_data_manager()
        modulos_validos = ["empresas", "vehiculos", "conductores", "rutas", "expedientes", "resoluciones"]
        if modulo not in modulos_validos:
            raise HTTPException(
                status_code=400, 
                detail=f"Módulo inválido. Válidos: {', '.join(modulos_validos)}"
            )
        
        if modulo == "empresas":
            elemento_id = data_manager.agregar_empresa(datos)
        elif modulo == "vehiculos":
            elemento_id = data_manager.agregar_vehiculo(datos)
        elif modulo == "conductores":
            elemento_id = data_manager.agregar_conductor(datos)
        elif modulo == "rutas":
            elemento_id = data_manager.agregar_ruta(datos)
        elif modulo == "expedientes":
            elemento_id = data_manager.agregar_expediente(datos)
        elif modulo == "resoluciones":
            elemento_id = data_manager.agregar_resolucion(datos)
        
        return {
            "success": True,
            "data": {
                "modulo": modulo,
                "elemento_id": elemento_id,
                "datos": datos
            },
            "message": f"Elemento agregado exitosamente al módulo {modulo} con ID {elemento_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al agregar elemento al módulo {modulo}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/dashboard", summary="Dashboard completo del sistema")
async def obtener_dashboard():
    """Dashboard completo con resumen ejecutivo del sistema"""
    try:
        data_manager = get_data_manager()
        estadisticas = data_manager.obtener_estadisticas_globales()
        
        # Top empresas por cantidad de vehículos
        empresas_vehiculos = []
        for empresa_id, empresa_data in data_manager.empresas.items():
            vehiculos_count = len(data_manager.relaciones.empresas_vehiculos.get(empresa_id, []))
            empresas_vehiculos.append({
                "empresa_id": empresa_id,
                "razon_social": empresa_data.get("razonSocial", ""),
                "total_vehiculos": vehiculos_count
            })
        empresas_vehiculos.sort(key=lambda x: x["total_vehiculos"], reverse=True)
        
        dashboard = {
            "resumen_ejecutivo": estadisticas["estadisticas_generales"],
            "top_empresas": empresas_vehiculos[:5],
            "distribucion_estados": {
                "vehiculos": dict(estadisticas["estadisticas_por_estado"]["vehiculos"]),
                "conductores": dict(estadisticas["estadisticas_por_estado"]["conductores"]),
                "expedientes": dict(estadisticas["estadisticas_por_estado"]["expedientes"])
            },
            "informacion_sesion": estadisticas["informacion_sesion"],
            "operaciones_recientes": estadisticas["log_operaciones_recientes"]
        }
        
        return {
            "success": True,
            "data": dashboard,
            "message": "Dashboard obtenido exitosamente"
        }
    except Exception as e:
        logger.error(f"Error al obtener dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.post("/reset", summary="Resetear todos los datos del sistema")
async def reset_sistema():
    """⚠️ CUIDADO: Resetea todos los datos del sistema"""
    try:
        data_manager = get_data_manager()
        data_manager.reset_datos()
        return {
            "success": True,
            "message": "Sistema reseteado exitosamente. Datos reinicializados."
        }
    except Exception as e:
        logger.error(f"Error al resetear sistema: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/health", summary="Estado de salud del DataManager")
async def health_check():
    """Verificar el estado de salud del DataManager"""
    try:
        data_manager = get_data_manager()
        estadisticas = data_manager.obtener_estadisticas_globales()
        
        return {
            "success": True,
            "data": {
                "status": "healthy",
                "uptime": str(datetime.now() - data_manager.estadisticas.inicio_sesion),
                "total_entities": sum([
                    estadisticas["estadisticas_generales"]["total_empresas"],
                    estadisticas["estadisticas_generales"]["total_vehiculos"],
                    estadisticas["estadisticas_generales"]["total_conductores"],
                    estadisticas["estadisticas_generales"]["total_rutas"],
                    estadisticas["estadisticas_generales"]["total_expedientes"],
                    estadisticas["estadisticas_generales"]["total_resoluciones"]
                ]),
                "last_operation": data_manager.log_operaciones[-1] if data_manager.log_operaciones else None
            },
            "message": "DataManager funcionando correctamente"
        }
    except Exception as e:
        logger.error(f"Error en health check: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")