from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from app.models.ruta_especifica import (
    RutaEspecificaCreate, RutaEspecificaUpdate, RutaEspecificaResponse,
    RutaEspecificaFiltros, RutaEspecificaEstadisticas, RutaEspecificaResumen
)
from app.services.ruta_especifica_service import RutaEspecificaService
from app.dependencies.auth import get_current_user
from app.models.usuario import UsuarioInDB
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rutas-especificas", tags=["Rutas Específicas"])

# Instancia del servicio
ruta_especifica_service = RutaEspecificaService()

# Handler específico para OPTIONS (CORS preflight)
@router.options("/")
async def options_rutas_especificas():
    """Handle CORS preflight requests for rutas específicas"""
    return {"message": "OK"}

@router.options("/{path:path}")
async def options_rutas_especificas_path(path: str):
    """Handle CORS preflight requests for rutas específicas sub-paths"""
    return {"message": "OK"}

@router.post("/", response_model=RutaEspecificaResponse, status_code=status.HTTP_201_CREATED)
async def crear_ruta_especifica(
    ruta_data: RutaEspecificaCreate,
    current_user: UsuarioInDB = Depends(get_current_user)
):
    """
    Crear una nueva ruta específica
    
    - **codigo**: Código único de la ruta específica
    - **rutaGeneralId**: ID de la ruta general base
    - **vehiculoId**: ID del vehículo asignado
    - **resolucionId**: ID de la resolución asociada
    - **descripcion**: Descripción del servicio
    - **horarios**: Lista de horarios específicos (mínimo 1)
    - **paradasAdicionales**: Lista de paradas adicionales (opcional)
    """
    try:
        logger.info(f"Creando ruta específica: {ruta_data.codigo}")
        return await ruta_especifica_service.crear_ruta_especifica(ruta_data, current_user.id)
    except Exception as e:
        logger.error(f"Error creando ruta específica: {e}")
        raise

@router.get("/", response_model=List[RutaEspecificaResponse])
async def obtener_rutas_especificas(
    codigo: Optional[str] = Query(None, description="Filtrar por código"),
    ruta_general_id: Optional[str] = Query(None, description="Filtrar por ruta general"),
    vehiculo_id: Optional[str] = Query(None, description="Filtrar por vehículo"),
    resolucion_id: Optional[str] = Query(None, description="Filtrar por resolución"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    tipo_servicio: Optional[str] = Query(None, description="Filtrar por tipo de servicio"),
    origen: Optional[str] = Query(None, description="Filtrar por origen"),
    destino: Optional[str] = Query(None, description="Filtrar por destino"),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    current_user: UsuarioInDB = Depends(get_current_user)
):
    """
    Obtener lista de rutas específicas con filtros opcionales
    """
    try:
        filtros = RutaEspecificaFiltros(
            codigo=codigo,
            rutaGeneralId=ruta_general_id,
            vehiculoId=vehiculo_id,
            resolucionId=resolucion_id,
            estado=estado,
            tipoServicio=tipo_servicio,
            origen=origen,
            destino=destino
        )
        
        logger.info(f"Obteniendo rutas específicas con filtros: {filtros}")
        return await ruta_especifica_service.obtener_rutas_especificas(filtros, skip, limit)
    except Exception as e:
        logger.error(f"Error obteniendo rutas específicas: {e}")
        raise

@router.get("/{ruta_id}", response_model=RutaEspecificaResponse)
async def obtener_ruta_especifica(
    ruta_id: str,
    current_user: UsuarioInDB = Depends(get_current_user)
):
    """
    Obtener una ruta específica por ID
    """
    try:
        logger.info(f"Obteniendo ruta específica: {ruta_id}")
        return await ruta_especifica_service.obtener_ruta_especifica_por_id(ruta_id)
    except Exception as e:
        logger.error(f"Error obteniendo ruta específica {ruta_id}: {e}")
        raise

@router.put("/{ruta_id}", response_model=RutaEspecificaResponse)
async def actualizar_ruta_especifica(
    ruta_id: str,
    ruta_data: RutaEspecificaUpdate,
    current_user: UsuarioInDB = Depends(get_current_user)
):
    """
    Actualizar una ruta específica
    
    Solo se pueden actualizar ciertos campos:
    - codigo, descripcion, estado, tipoServicio
    - horarios, paradasAdicionales, observaciones
    """
    try:
        logger.info(f"Actualizando ruta específica: {ruta_id}")
        return await ruta_especifica_service.actualizar_ruta_especifica(ruta_id, ruta_data, current_user.id)
    except Exception as e:
        logger.error(f"Error actualizando ruta específica {ruta_id}: {e}")
        raise

@router.delete("/{ruta_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_ruta_especifica(
    ruta_id: str,
    current_user: UsuarioInDB = Depends(get_current_user)
):
    """
    Eliminar una ruta específica
    """
    try:
        logger.info(f"Eliminando ruta específica: {ruta_id}")
        success = await ruta_especifica_service.eliminar_ruta_especifica(ruta_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ruta específica no encontrada"
            )
    except Exception as e:
        logger.error(f"Error eliminando ruta específica {ruta_id}: {e}")
        raise

@router.get("/vehiculo/{vehiculo_id}", response_model=List[RutaEspecificaResponse])
async def obtener_rutas_especificas_por_vehiculo(
    vehiculo_id: str,
    current_user: UsuarioInDB = Depends(get_current_user)
):
    """
    Obtener todas las rutas específicas de un vehículo
    """
    try:
        logger.info(f"Obteniendo rutas específicas del vehículo: {vehiculo_id}")
        return await ruta_especifica_service.obtener_rutas_especificas_por_vehiculo(vehiculo_id)
    except Exception as e:
        logger.error(f"Error obteniendo rutas específicas del vehículo {vehiculo_id}: {e}")
        raise

@router.get("/resolucion/{resolucion_id}", response_model=List[RutaEspecificaResponse])
async def obtener_rutas_especificas_por_resolucion(
    resolucion_id: str,
    current_user: UsuarioInDB = Depends(get_current_user)
):
    """
    Obtener todas las rutas específicas de una resolución
    """
    try:
        logger.info(f"Obteniendo rutas específicas de la resolución: {resolucion_id}")
        return await ruta_especifica_service.obtener_rutas_especificas_por_resolucion(resolucion_id)
    except Exception as e:
        logger.error(f"Error obteniendo rutas específicas de la resolución {resolucion_id}: {e}")
        raise

@router.get("/estadisticas/resumen", response_model=RutaEspecificaEstadisticas)
async def obtener_estadisticas_rutas_especificas(
    current_user: UsuarioInDB = Depends(get_current_user)
):
    """
    Obtener estadísticas generales de rutas específicas
    """
    try:
        logger.info("Obteniendo estadísticas de rutas específicas")
        return await ruta_especifica_service.obtener_estadisticas()
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas de rutas específicas: {e}")
        raise

# Endpoints para operaciones en lote

@router.post("/lote/crear", response_model=List[RutaEspecificaResponse])
async def crear_rutas_especificas_lote(
    rutas_data: List[RutaEspecificaCreate],
    current_user: UsuarioInDB = Depends(get_current_user)
):
    """
    Crear múltiples rutas específicas en lote
    """
    try:
        logger.info(f"Creando {len(rutas_data)} rutas específicas en lote")
        
        rutas_creadas = []
        errores = []
        
        for i, ruta_data in enumerate(rutas_data):
            try:
                ruta_creada = await ruta_especifica_service.crear_ruta_especifica(ruta_data, current_user.id)
                rutas_creadas.append(ruta_creada)
            except Exception as e:
                errores.append(f"Error en ruta {i+1} ({ruta_data.codigo}): {str(e)}")
                logger.warning(f"Error creando ruta específica {ruta_data.codigo}: {e}")
        
        if errores:
            logger.warning(f"Se crearon {len(rutas_creadas)} rutas con {len(errores)} errores")
            # Podrías decidir si retornar las creadas exitosamente o lanzar excepción
        
        return rutas_creadas
        
    except Exception as e:
        logger.error(f"Error en creación en lote de rutas específicas: {e}")
        raise

@router.put("/lote/actualizar-estado")
async def actualizar_estado_rutas_especificas_lote(
    ruta_ids: List[str],
    nuevo_estado: str,
    current_user: UsuarioInDB = Depends(get_current_user)
):
    """
    Actualizar el estado de múltiples rutas específicas
    """
    try:
        logger.info(f"Actualizando estado de {len(ruta_ids)} rutas específicas a {nuevo_estado}")
        
        actualizadas = []
        errores = []
        
        for ruta_id in ruta_ids:
            try:
                ruta_data = RutaEspecificaUpdate(estado=nuevo_estado)
                ruta_actualizada = await ruta_especifica_service.actualizar_ruta_especifica(
                    ruta_id, ruta_data, current_user.id
                )
                actualizadas.append(ruta_actualizada)
            except Exception as e:
                errores.append(f"Error en ruta {ruta_id}: {str(e)}")
                logger.warning(f"Error actualizando ruta específica {ruta_id}: {e}")
        
        return {
            "actualizadas": len(actualizadas),
            "errores": len(errores),
            "detalles_errores": errores if errores else None
        }
        
    except Exception as e:
        logger.error(f"Error en actualización en lote de rutas específicas: {e}")
        raise

# Endpoints de validación

@router.post("/validar-codigo")
async def validar_codigo_ruta_especifica(
    codigo: str,
    current_user: UsuarioInDB = Depends(get_current_user)
):
    """
    Validar si un código de ruta específica está disponible
    """
    try:
        existe = await ruta_especifica_service._existe_codigo(codigo)
        return {
            "codigo": codigo,
            "disponible": not existe,
            "mensaje": "Código disponible" if not existe else "Código ya existe"
        }
    except Exception as e:
        logger.error(f"Error validando código de ruta específica {codigo}: {e}")
        raise