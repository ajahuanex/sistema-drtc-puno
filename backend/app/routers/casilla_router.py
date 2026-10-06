from fastapi import APIRouter, Query, HTTPException, BackgroundTasks, Depends
from typing import Optional
import httpx
import logging

from app.dependencies.db import get_database
from app.services.casilla_service import (
    ejecutar_verificacion_masiva_empresas,
    obtener_resumen_empresas_casilla,
    verificar_empresa_individual_y_guardar,
    casilla_sync_state
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/casilla", tags=["Casilla Electrónica"])

BASE_URL_CASILLA = "https://mtc.transportespuno.gob.pe/api/v2"
API_KEY_CASILLA = "topSecret123"

@router.get("/verificar")
async def verificar_casilla(
    codTipoPersona: str = Query(..., description="00001: Natural, 00002: Jurídica"),
    codTipoDocumento: str = Query(..., description="00002: DNI, 00001: RUC"),
    nroDocumento: str = Query(..., description="Número de documento de identidad")
):
    """
    Verifica la existencia y vigencia de la casilla electrónica de un administrado.
    """
    params = {
        "codTipoPersona": codTipoPersona,
        "codTipoDocumento": codTipoDocumento,
        "nroDocumento": nroDocumento.strip()
    }
    headers = {
        "x-api-key": API_KEY_CASILLA,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 DRTC-Puno/1.0"
    }

    try:
        async with httpx.AsyncClient(verify=False, timeout=12.0) as client:
            resp = await client.get(f"{BASE_URL_CASILLA}/info", params=params, headers=headers)
            
            # Si responde JSON válido
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    return data
                except Exception:
                    pass

            # Si Cloudflare o el servidor devuelve HTML o error
            if "html" in resp.headers.get("content-type", "").lower() or "<html" in resp.text[:200].lower():
                logger.warning(f"[Casilla Proxy] El servidor externo devolvió HTML (posible Cloudflare/Challenge). Status: {resp.status_code}")
                return {
                    "status": "observacion",
                    "info": {
                        "success": False,
                        "message": f"Servicio Node-RED protegido temporalmente por Cloudflare (Status {resp.status_code}).",
                        "data": {
                            "activo": False,
                            "nombreCompleto": None
                        }
                    }
                }

            # En otros códigos de estado
            try:
                return resp.json()
            except Exception:
                return {
                    "status": "error",
                    "info": {
                        "success": False,
                        "message": f"Error del servidor externo (Status {resp.status_code}): {resp.text[:200]}"
                    }
                }

    except httpx.TimeoutException:
        logger.error("[Casilla Proxy] Timeout al conectar con Node-RED DRTC Puno")
        return {
            "status": "error",
            "info": {
                "success": False,
                "message": "Tiempo de espera agotado al conectar con el servicio de casillas electrónicas."
            }
        }
    except Exception as e:
        logger.error(f"[Casilla Proxy] Excepción general: {str(e)}")
        return {
            "status": "error",
            "info": {
                "success": False,
                "message": f"No se pudo conectar con el servicio de casillas: {str(e)}"
            }
        }


@router.get("/resumen-empresas")
async def get_resumen_empresas_casilla(db = Depends(get_database)):
    """
    Obtiene las estadísticas y lista de todas las empresas con su estado
    de casilla electrónica almacenado en la base de datos MongoDB.
    """
    try:
        resumen = await obtener_resumen_empresas_casilla(db)
        return resumen
    except Exception as e:
        logger.error(f"Error obteniendo resumen de casillas de empresas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/estado-verificacion-masiva")
async def get_estado_verificacion_masiva():
    """
    Retorna el estado de la tarea en segundo plano de verificación masiva.
    """
    return casilla_sync_state


@router.post("/verificar-todas-empresas")
async def iniciar_verificacion_todas_empresas(
    background_tasks: BackgroundTasks,
    origen: str = Query("MANUAL_WEB", description="Origen de la solicitud")
):
    """
    Dispara la verificación masiva de casilla electrónica para todas las empresas activas.
    Los resultados se guardan permanentemente en MongoDB.
    """
    if casilla_sync_state["en_ejecucion"]:
        return {
            "status": "ocupado",
            "mensaje": "Ya existe una verificación masiva en ejecución actualmente.",
            "estado": casilla_sync_state
        }

    background_tasks.add_task(ejecutar_verificacion_masiva_empresas, origen=origen)

    return {
        "status": "iniciado",
        "mensaje": "Verificación masiva de casillas iniciada en segundo plano con persistencia en base de datos.",
        "estado": casilla_sync_state
    }


@router.post("/verificar-empresa/{ruc}")
async def verificar_empresa_individual(
    ruc: str,
    db = Depends(get_database)
):
    """
    Verifica individualmente la casilla electrónica de una empresa y actualiza MongoDB.
    """
    try:
        resultado = await verificar_empresa_individual_y_guardar(db, ruc)
        if "error" in resultado:
            raise HTTPException(status_code=400, detail=resultado["error"])
        return resultado
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al verificar empresa individual {ruc}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/historial")
async def get_historial_verificaciones_masivas(
    limit: int = Query(10, ge=1, le=50),
    db = Depends(get_database)
):
    """
    Obtiene el historial de verificaciones masivas guardadas en la base de datos.
    """
    try:
        cursor = db["casilla_verificaciones"].find({}, {"_id": 0}).sort("fecha", -1).limit(limit)
        historial = await cursor.to_list(length=limit)
        return historial
    except Exception as e:
        logger.error(f"Error obteniendo historial de verificaciones: {e}")
        raise HTTPException(status_code=500, detail=str(e))
