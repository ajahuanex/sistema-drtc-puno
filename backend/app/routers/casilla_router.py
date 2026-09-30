"""
Router para Verificación de Casilla Electrónica (MTC / DRTC Puno)
Actúa como proxy seguro y puente hacia el API Node-RED institucional.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import httpx
import logging

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
                # Manejo amigable: si es status 403 o challenge, indicamos la situación
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
