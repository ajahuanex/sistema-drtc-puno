"""
Router para gestión de permisos y roles
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...core.security import get_current_user, require_permission, require_role
from ...models.mesa_partes.roles import RolEnum, PermisoEnum
from ...services.mesa_partes.permissions_service import PermissionsService
from ...schemas.mesa_partes.permissions import (
    RolCreate, RolUpdate, RolResponse,
    PermisoCreate, PermisoResponse,
    PermisoUsuarioCreate, PermisoUsuarioResponse,
    AsignarRolRequest, RemoverRolRequest,
    VerificarPermisoRequest, VerificarRolRequest,
    PermisosUsuarioResponse, VerificacionResponse,
    InicializarSistemaResponse
)

router = APIRouter(prefix="/api/v1/permissions", tags=["Permisos y Roles"])


# Endpoints para Roles
@router.post("/roles", response_model=RolResponse)
@require_permission(PermisoEnum.GESTIONAR_ROLES)
async def crear_rol(
    rol_data: RolCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Crear un nuevo rol"""
    service = PermissionsService(db)
    try:
        rol = await service.crear_rol(rol_data)
        return rol
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/roles", response_model=List[RolResponse])
@require_permission(PermisoEnum.GESTIONAR_ROLES)
async def listar_roles(
    activos_solo: bool = True,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Listar todos los roles"""
    service = PermissionsService(db)
    roles = await service.listar_roles(activos_solo)
    return roles


@router.get("/roles/{rol_id}", response_model=RolResponse)
@require_permission(PermisoEnum.GESTIONAR_ROLES)
async def obtener_rol(
    rol_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener un rol por ID"""
    service = PermissionsService(db)
    rol = await service.obtener_rol(rol_id)
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return rol


@router.put("/roles/{rol_id}", response_model=RolResponse)
@require_permission(PermisoEnum.GESTIONAR_ROLES)
async def actualizar_rol(
    rol_id: str,
    rol_data: RolUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Actualizar un rol"""
    service = PermissionsService(db)
    try:
        rol = await service.actualizar_rol(rol_id, rol_data)
        if not rol:
            raise HTTPException(status_code=404, detail="Rol no encontrado")
        return rol
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/roles/{rol_id}")
@require_permission(PermisoEnum.GESTIONAR_ROLES)
async def eliminar_rol(
    rol_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Eliminar un rol"""
    service = PermissionsService(db)
    success = await service.eliminar_rol(rol_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return {"message": "Rol eliminado exitosamente"}


# Endpoints para Permisos
@router.post("/permisos", response_model=PermisoResponse)
@require_role(RolEnum.ADMINISTRADOR)
async def crear_permiso(
    permiso_data: PermisoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Crear un nuevo permiso"""
    service = PermissionsService(db)
    permiso = await service.crear_permiso(permiso_data)
    return permiso


@router.get("/permisos", response_model=List[PermisoResponse])
@require_permission(PermisoEnum.GESTIONAR_ROLES)
async def listar_permisos(
    categoria: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Listar permisos, opcionalmente filtrados por categoría"""
    service = PermissionsService(db)
    permisos = await service.listar_permisos(categoria)
    return permisos


# Endpoints para asignación de roles
@router.post("/usuarios/asignar-rol")
@require_permission(PermisoEnum.GESTIONAR_USUARIOS)
async def asignar_rol_a_usuario(
    request: AsignarRolRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Asignar un rol a un usuario"""
    service = PermissionsService(db)
    success = await service.asignar_rol_a_usuario(request.usuario_id, request.rol_id)
    if not success:
        raise HTTPException(status_code=400, detail="No se pudo asignar el rol")
    return {"message": "Rol asignado exitosamente"}


@router.post("/usuarios/remover-rol")
@require_permission(PermisoEnum.GESTIONAR_USUARIOS)
async def remover_rol_de_usuario(
    request: RemoverRolRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Remover un rol de un usuario"""
    service = PermissionsService(db)
    success = await service.remover_rol_de_usuario(request.usuario_id, request.rol_id)
    if not success:
        raise HTTPException(status_code=400, detail="No se pudo remover el rol")
    return {"message": "Rol removido exitosamente"}


@router.post("/usuarios/asignar-permiso", response_model=PermisoUsuarioResponse)
@require_permission(PermisoEnum.GESTIONAR_USUARIOS)
async def asignar_permiso_especifico(
    permiso_data: PermisoUsuarioCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Asignar un permiso específico a un usuario"""
    service = PermissionsService(db)
    permiso_usuario = await service.asignar_permiso_especifico(
        permiso_data.usuario_id,
        permiso_data.permiso_id,
        permiso_data.concedido,
        current_user["id"]
    )
    return permiso_usuario


# Endpoints para verificación de permisos
@router.post("/verificar-permiso", response_model=VerificacionResponse)
async def verificar_permiso(
    request: VerificarPermisoRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Verificar si un usuario tiene un permiso específico"""
    service = PermissionsService(db)
    
    # Solo administradores pueden verificar permisos de otros usuarios
    if request.usuario_id != current_user["id"]:
        if not await service.usuario_tiene_rol(current_user["id"], RolEnum.ADMINISTRADOR.value):
            raise HTTPException(
                status_code=403, 
                detail="Solo puede verificar sus propios permisos"
            )
    
    tiene_permiso = await service.usuario_tiene_permiso(request.usuario_id, request.permiso)
    return VerificacionResponse(
        tiene_acceso=tiene_permiso,
        motivo=None if tiene_permiso else f"No tiene el permiso: {request.permiso}"
    )


@router.post("/verificar-rol", response_model=VerificacionResponse)
async def verificar_rol(
    request: VerificarRolRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Verificar si un usuario tiene un rol específico"""
    service = PermissionsService(db)
    
    # Solo administradores pueden verificar roles de otros usuarios
    if request.usuario_id != current_user["id"]:
        if not await service.usuario_tiene_rol(current_user["id"], RolEnum.ADMINISTRADOR.value):
            raise HTTPException(
                status_code=403, 
                detail="Solo puede verificar sus propios roles"
            )
    
    tiene_rol = await service.usuario_tiene_rol(request.usuario_id, request.rol)
    return VerificacionResponse(
        tiene_acceso=tiene_rol,
        motivo=None if tiene_rol else f"No tiene el rol: {request.rol}"
    )


@router.get("/usuarios/{usuario_id}/permisos", response_model=PermisosUsuarioResponse)
async def obtener_permisos_usuario(
    usuario_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener todos los permisos y roles de un usuario"""
    service = PermissionsService(db)
    
    # Solo administradores pueden ver permisos de otros usuarios
    if usuario_id != current_user["id"]:
        if not await service.usuario_tiene_rol(current_user["id"], RolEnum.ADMINISTRADOR.value):
            raise HTTPException(
                status_code=403, 
                detail="Solo puede ver sus propios permisos"
            )
    
    roles = await service.obtener_roles_usuario(usuario_id)
    permisos = await service.obtener_permisos_usuario(usuario_id)
    
    # Obtener permisos específicos
    permisos_especificos = db.query(PermisoUsuario).filter(
        PermisoUsuario.usuario_id == usuario_id
    ).all()
    
    return PermisosUsuarioResponse(
        usuario_id=usuario_id,
        roles=roles,
        permisos=permisos,
        permisos_especificos=permisos_especificos
    )


# Endpoint para inicialización del sistema
@router.post("/inicializar-sistema", response_model=InicializarSistemaResponse)
@require_role(RolEnum.ADMINISTRADOR)
async def inicializar_sistema(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Inicializar roles y permisos del sistema"""
    service = PermissionsService(db)
    
    # Contar roles y permisos antes
    roles_antes = len(await service.listar_roles(activos_solo=False))
    permisos_antes = len(await service.listar_permisos())
    
    await service.inicializar_roles_sistema()
    
    # Contar después
    roles_despues = len(await service.listar_roles(activos_solo=False))
    permisos_despues = len(await service.listar_permisos())
    
    return InicializarSistemaResponse(
        roles_creados=roles_despues - roles_antes,
        permisos_creados=permisos_despues - permisos_antes,
        mensaje="Sistema inicializado correctamente"
    )


# Endpoints públicos para información básica
@router.get("/roles-disponibles")
async def obtener_roles_disponibles():
    """Obtener lista de roles disponibles (público)"""
    return {
        "roles": [
            {"nombre": "administrador", "descripcion": "Administrador del sistema"},
            {"nombre": "operador_mesa", "descripcion": "Operador de mesa de partes"},
            {"nombre": "usuario_area", "descripcion": "Usuario de área específica"},
            {"nombre": "consulta", "descripcion": "Solo consulta de documentos"}
        ]
    }


@router.get("/permisos-disponibles")
async def obtener_permisos_disponibles():
    """Obtener lista de permisos disponibles (público)"""
    return {
        "permisos": [
            {"nombre": perm.value, "categoria": "sistema"} 
            for perm in PermisoEnum
        ]
    }