from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import time
import httpx
from app.dependencies.auth import get_admin_or_oti_user
from app.dependencies.db import get_database
from app.services.permisos_service import PermisosService
from app.models.permisos_roles import (
    ModuloSistema,
    RolPermisosConfig,
    RolPermisosUpdate,
    UsuarioPermisosResponse,
    UsuarioPermisosUpdate,
    TestInteroperabilidadRequest,
    TestInteroperabilidadResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/permisos", tags=["permisos y control de acceso"])

async def get_permisos_service():
    """Dependency para obtener el servicio de permisos"""
    db = await get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    return PermisosService(db)

@router.get("/modulos", response_model=List[ModuloSistema])
async def obtener_catalogo_modulos(
    permisos_service: PermisosService = Depends(get_permisos_service)
) -> List[ModuloSistema]:
    """Obtener el catálogo completo de módulos del sistema SIRRETT"""
    return permisos_service.get_catalogo_modulos()

@router.get("/roles", response_model=List[RolPermisosConfig])
async def obtener_roles_permisos(
    permisos_service: PermisosService = Depends(get_permisos_service),
    current_user = Depends(get_admin_or_oti_user)
) -> List[RolPermisosConfig]:
    """Obtener la configuración de módulos permitidos para cada rol (Solo Admin u OTI)"""
    return await permisos_service.get_roles_permisos()

@router.put("/roles/{rol_id}", response_model=RolPermisosConfig)
async def actualizar_permisos_rol(
    rol_id: str,
    update_data: RolPermisosUpdate,
    permisos_service: PermisosService = Depends(get_permisos_service),
    current_user = Depends(get_admin_or_oti_user)
) -> RolPermisosConfig:
    """Actualizar la lista de módulos permitidos para un rol específico (Solo Admin u OTI)"""
    config = await permisos_service.update_rol_permisos(rol_id, update_data.modulos)
    if not config:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    logger.info(f"Permisos del rol {rol_id} actualizados por {current_user.dni}: {update_data.modulos}")
    return config

@router.get("/usuarios/{usuario_id}", response_model=UsuarioPermisosResponse)
async def obtener_permisos_usuario(
    usuario_id: str,
    permisos_service: PermisosService = Depends(get_permisos_service),
    current_user = Depends(get_admin_or_oti_user)
) -> UsuarioPermisosResponse:
    """Consultar permisos detallados de un usuario (Solo Admin u OTI)"""
    detalle = await permisos_service.get_permisos_usuario(usuario_id)
    if not detalle:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return detalle

@router.put("/usuarios/{usuario_id}", response_model=UsuarioPermisosResponse)
async def actualizar_permisos_usuario(
    usuario_id: str,
    data: UsuarioPermisosUpdate,
    permisos_service: PermisosService = Depends(get_permisos_service),
    current_user = Depends(get_admin_or_oti_user)
) -> UsuarioPermisosResponse:
    """Personalizar módulos para un usuario o restablecer herencia de rol (Solo Admin u OTI)"""
    detalle = await permisos_service.update_permisos_usuario(
        usuario_id, 
        data.modulosPermitidos, 
        data.heredarRol
    )
    if not detalle:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    logger.info(f"Permisos del usuario {usuario_id} actualizados por {current_user.dni} (heredaRol={data.heredarRol})")
    return detalle

@router.post("/test-conexion", response_model=TestInteroperabilidadResponse)
async def test_conexion_interoperabilidad(
    req: TestInteroperabilidadRequest,
    current_user = Depends(get_admin_or_oti_user)
) -> TestInteroperabilidadResponse:
    """
    Prueba de conectividad en tiempo real al dominio base o endpoint de interoperabilidad.
    """
    url_target = req.url.strip()
    if not url_target.startswith("http://") and not url_target.startswith("https://"):
        url_target = f"https://{url_target}"

    headers = {}
    if req.apiKey:
        headers["Authorization"] = f"Bearer {req.apiKey}"

    start_time = time.time()
    try:
        async with httpx.AsyncClient(verify=False, timeout=req.timeoutSegundos) as client:
            resp = await client.get(url_target, headers=headers)
            elapsed = round((time.time() - start_time) * 1000, 2)
            
            # Cualquier respuesta HTTP (incluso 404/401) indica que el host responde en la red
            return TestInteroperabilidadResponse(
                success=resp.status_code < 500,
                url=url_target,
                statusCode=resp.status_code,
                tiempoMs=elapsed,
                mensaje=f"Servidor respondió con código HTTP {resp.status_code} ({elapsed} ms)",
                detalles={
                    "status_code": resp.status_code,
                    "content_type": resp.headers.get("content-type", "")
                }
            )
    except httpx.TimeoutException:
        elapsed = round((time.time() - start_time) * 1000, 2)
        return TestInteroperabilidadResponse(
            success=False,
            url=url_target,
            tiempoMs=elapsed,
            mensaje=f"Tiempo de espera agotado ({req.timeoutSegundos}s) al contactar {url_target}"
        )
    except Exception as e:
        elapsed = round((time.time() - start_time) * 1000, 2)
        return TestInteroperabilidadResponse(
            success=False,
            url=url_target,
            tiempoMs=elapsed,
            mensaje=f"Error al conectar con {url_target}: {str(e)}"
        )
