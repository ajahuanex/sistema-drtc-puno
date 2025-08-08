from fastapi import APIRouter, Depends
from typing import Dict, List
from app.dependencies.auth import get_current_active_user
from app.services.mock_data import mock_service
from app.models.usuario import UsuarioResponse
from app.models.empresa import EmpresaResponse

router = APIRouter(prefix="/mock", tags=["datos mock"])

@router.get("/info")
async def get_mock_info() -> Dict:
    """Obtener información sobre los datos mock disponibles"""
    return {
        "message": "Datos mock para desarrollo",
        "usuarios_disponibles": len(mock_service.usuarios),
        "empresas_disponibles": len(mock_service.empresas),
        "usuarios": [
            {
                "id": user.id,
                "dni": user.dni,
                "nombres": user.nombres,
                "apellidos": user.apellidos,
                "email": user.email,
                "rol_id": user.rol_id
            }
            for user in mock_service.usuarios.values()
        ],
        "empresas": [
            {
                "id": empresa.id,
                "ruc": empresa.ruc,
                "razon_social": empresa.razon_social.principal,
                "estado": empresa.estado
            }
            for empresa in mock_service.empresas.values()
        ]
    }

@router.get("/usuarios", response_model=List[UsuarioResponse])
async def get_mock_usuarios(
    current_user = Depends(get_current_active_user)
) -> List[UsuarioResponse]:
    """Obtener todos los usuarios mock"""
    return [
        UsuarioResponse(
            id=user.id,
            dni=user.dni,
            nombres=user.nombres,
            apellidos=user.apellidos,
            email=user.email,
            rol_id=user.rol_id,
            esta_activo=user.esta_activo,
            fecha_creacion=user.fecha_creacion
        )
        for user in mock_service.usuarios.values()
    ]

@router.get("/empresas", response_model=List[EmpresaResponse])
async def get_mock_empresas(
    current_user = Depends(get_current_active_user)
) -> List[EmpresaResponse]:
    """Obtener todas las empresas mock"""
    return [
        EmpresaResponse(
            id=empresa.id,
            ruc=empresa.ruc,
            razon_social=empresa.razon_social,
            direccion_fiscal=empresa.direccion_fiscal,
            estado=empresa.estado,
            esta_activo=empresa.esta_activo,
            fecha_registro=empresa.fecha_registro,
            representante_legal=empresa.representante_legal,
            resoluciones_primigenias_ids=empresa.resoluciones_primigenias_ids,
            vehiculos_habilitados_ids=empresa.vehiculos_habilitados_ids,
            conductores_habilitados_ids=empresa.conductores_habilitados_ids,
            rutas_autorizadas_ids=empresa.rutas_autorizadas_ids
        )
        for empresa in mock_service.empresas.values()
    ]

@router.get("/credenciales")
async def get_mock_credentials() -> Dict:
    """Obtener credenciales de prueba"""
    return {
        "message": "Credenciales de prueba disponibles",
        "usuarios": [
            {
                "dni": "12345678",
                "password": "password123",
                "rol": "admin",
                "descripcion": "Administrador del sistema"
            },
            {
                "dni": "87654321", 
                "password": "password123",
                "rol": "fiscalizador",
                "descripcion": "Fiscalizador de campo"
            },
            {
                "dni": "11223344",
                "password": "password123", 
                "rol": "usuario",
                "descripcion": "Usuario regular"
            }
        ],
        "nota": "Usa estas credenciales para hacer login en /api/v1/auth/login"
    } 