from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.dependencies.auth import get_current_active_user
from app.services.mock_empresa_service import MockEmpresaService
from app.models.empresa import EmpresaCreate, EmpresaUpdate, EmpresaInDB, EmpresaResponse
from app.utils.exceptions import (
    EmpresaNotFoundException, 
    EmpresaAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/empresas", tags=["empresas"])

def create_empresa_response(empresa: EmpresaInDB) -> EmpresaResponse:
    """Función helper para crear respuestas completas de EmpresaResponse"""
    return EmpresaResponse(
        id=empresa.id,
        ruc=empresa.ruc,
        razon_social=empresa.razon_social,
        direccion_fiscal=empresa.direccion_fiscal,
        estado=empresa.estado,
        esta_activo=empresa.esta_activo,
        fecha_registro=empresa.fecha_registro,
        fecha_actualizacion=empresa.fecha_actualizacion,
        representante_legal=empresa.representante_legal,
        email_contacto=empresa.email_contacto,
        telefono_contacto=empresa.telefono_contacto,
        sitio_web=empresa.sitio_web,
        documentos=empresa.documentos,
        auditoria=empresa.auditoria,
        resoluciones_primigenias_ids=empresa.resoluciones_primigenias_ids,
        vehiculos_habilitados_ids=empresa.vehiculos_habilitados_ids,
        conductores_habilitados_ids=empresa.conductores_habilitados_ids,
        rutas_autorizadas_ids=empresa.rutas_autorizadas_ids,
        datos_sunat=empresa.datos_sunat,
        ultima_validacion_sunat=empresa.ultima_validacion_sunat,
        score_riesgo=empresa.score_riesgo,
        observaciones=empresa.observaciones
    )

@router.post("/", response_model=EmpresaResponse, status_code=201)
async def create_empresa(
    empresa_data: EmpresaCreate
) -> EmpresaResponse:
    """Crear nueva empresa"""
    # Guard clauses al inicio
    if not empresa_data.ruc.strip():
        raise ValidationErrorException("RUC", "El RUC no puede estar vacío")
    
    empresa_service = MockEmpresaService()
    
    try:
        empresa = await empresa_service.create_empresa(empresa_data)
        return create_empresa_response(empresa)
    except ValueError as e:
        if "RUC" in str(e):
            raise EmpresaAlreadyExistsException(empresa_data.ruc)
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[EmpresaResponse])
async def get_empresas(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado")
) -> List[EmpresaResponse]:
    """Obtener lista de empresas con filtros opcionales"""
    empresa_service = MockEmpresaService()
    
    if estado:
        empresas = await empresa_service.get_empresas_por_estado(estado)
    else:
        empresas = await empresa_service.get_empresas_activas()
    
    # Aplicar paginación
    empresas = empresas[skip:skip + limit]
    
    return [
        create_empresa_response(empresa)
        for empresa in empresas
    ]

@router.get("/filtros", response_model=List[EmpresaResponse])
async def get_empresas_con_filtros(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None),
    ruc: Optional[str] = Query(None),
    razon_social: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None)
) -> List[EmpresaResponse]:
    """Obtener empresas con filtros avanzados"""
    empresa_service = MockEmpresaService()
    
    # Construir filtros
    filtros = {}
    if estado:
        filtros['estado'] = estado
    if ruc:
        filtros['ruc'] = ruc
    if razon_social:
        filtros['razon_social'] = razon_social
    if fecha_desde:
        filtros['fecha_desde'] = fecha_desde
    if fecha_hasta:
        filtros['fecha_hasta'] = fecha_hasta
    
    empresas = await empresa_service.get_empresas_con_filtros(filtros)
    empresas = empresas[skip:skip + limit]
    
    return [
        create_empresa_response(empresa)
        for empresa in empresas
    ]

@router.get("/estadisticas")
async def get_estadisticas_empresas():
    """Obtener estadísticas de empresas"""
    empresa_service = MockEmpresaService()
    estadisticas = await empresa_service.get_estadisticas()
    
    return {
        "totalEmpresas": estadisticas['total'],
        "empresasHabilitadas": estadisticas['habilitadas'],
        "empresasEnTramite": estadisticas['en_tramite'],
        "empresasSuspendidas": estadisticas['suspendidas'],
        "empresasCanceladas": estadisticas['canceladas']
    }

@router.get("/{empresa_id}", response_model=EmpresaResponse)
async def get_empresa(
    empresa_id: str
) -> EmpresaResponse:
    """Obtener empresa por ID"""
    # Guard clause
    if not empresa_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de empresa inválido")
    
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.get_empresa_by_id(empresa_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.get("/ruc/{ruc}", response_model=EmpresaResponse)
async def get_empresa_by_ruc(
    ruc: str
) -> EmpresaResponse:
    """Obtener empresa por RUC"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.get_empresa_by_ruc(ruc)
    
    if not empresa:
        raise EmpresaNotFoundException(f"RUC {ruc}")
    
    return create_empresa_response(empresa)

@router.get("/validar-ruc/{ruc}")
async def validar_ruc(ruc: str):
    """Validar si un RUC ya existe"""
    empresa_service = MockEmpresaService()
    empresa_existente = await empresa_service.get_empresa_by_ruc(ruc)
    
    return {
        "valido": not empresa_existente,
        "empresa": empresa_existente
    }

@router.put("/{empresa_id}", response_model=EmpresaResponse)
async def update_empresa(
    empresa_id: str,
    empresa_data: EmpresaUpdate
) -> EmpresaResponse:
    """Actualizar empresa"""
    # Guard clauses
    if not empresa_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de empresa inválido")
    
    if not empresa_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    empresa_service = MockEmpresaService()
    updated_empresa = await empresa_service.update_empresa(empresa_id, empresa_data)
    
    if not updated_empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(updated_empresa)

@router.delete("/{empresa_id}", status_code=204)
async def delete_empresa(
    empresa_id: str
):
    """Desactivar empresa (borrado lógico)"""
    # Guard clause
    if not empresa_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de empresa inválido")
    
    empresa_service = MockEmpresaService()
    success = await empresa_service.soft_delete_empresa(empresa_id)
    
    if not success:
        raise EmpresaNotFoundException(empresa_id)

# Endpoints para gestión de vehículos
@router.post("/{empresa_id}/vehiculos/{vehiculo_id}", response_model=EmpresaResponse)
async def agregar_vehiculo_a_empresa(
    empresa_id: str,
    vehiculo_id: str
) -> EmpresaResponse:
    """Agregar vehículo a empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.agregar_vehiculo_a_empresa(empresa_id, vehiculo_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.delete("/{empresa_id}/vehiculos/{vehiculo_id}", response_model=EmpresaResponse)
async def remover_vehiculo_de_empresa(
    empresa_id: str,
    vehiculo_id: str
) -> EmpresaResponse:
    """Remover vehículo de empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.remover_vehiculo_de_empresa(empresa_id, vehiculo_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

# Endpoints para gestión de conductores
@router.post("/{empresa_id}/conductores/{conductor_id}", response_model=EmpresaResponse)
async def agregar_conductor_a_empresa(
    empresa_id: str,
    conductor_id: str
) -> EmpresaResponse:
    """Agregar conductor a empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.agregar_conductor_a_empresa(empresa_id, conductor_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.delete("/{empresa_id}/conductores/{conductor_id}", response_model=EmpresaResponse)
async def remover_conductor_de_empresa(
    empresa_id: str,
    conductor_id: str
) -> EmpresaResponse:
    """Remover conductor de empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.remover_conductor_de_empresa(empresa_id, conductor_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

# Endpoints para gestión de rutas
@router.post("/{empresa_id}/rutas/{ruta_id}", response_model=EmpresaResponse)
async def agregar_ruta_a_empresa(
    empresa_id: str,
    ruta_id: str
) -> EmpresaResponse:
    """Agregar ruta a empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.agregar_ruta_a_empresa(empresa_id, ruta_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.delete("/{empresa_id}/rutas/{ruta_id}", response_model=EmpresaResponse)
async def remover_ruta_de_empresa(
    empresa_id: str,
    ruta_id: str
) -> EmpresaResponse:
    """Remover ruta de empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.remover_ruta_de_empresa(empresa_id, ruta_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

# Endpoints para gestión de resoluciones
@router.post("/{empresa_id}/resoluciones/{resolucion_id}", response_model=EmpresaResponse)
async def agregar_resolucion_a_empresa(
    empresa_id: str,
    resolucion_id: str
) -> EmpresaResponse:
    """Agregar resolución a empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.agregar_resolucion_a_empresa(empresa_id, resolucion_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.delete("/{empresa_id}/resoluciones/{resolucion_id}", response_model=EmpresaResponse)
async def remover_resolucion_de_empresa(
    empresa_id: str,
    resolucion_id: str
) -> EmpresaResponse:
    """Remover resolución de empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.remover_resolucion_de_empresa(empresa_id, resolucion_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.get("/{empresa_id}/resoluciones")
async def get_resoluciones_empresa(empresa_id: str):
    """Obtener resoluciones de una empresa"""
    empresa_service = MockEmpresaService()
    resoluciones = await empresa_service.get_resoluciones_empresa(empresa_id)
    
    return {
        "empresa_id": empresa_id,
        "resoluciones": resoluciones,
        "total": len(resoluciones)
    }

# Endpoints para exportación
@router.get("/exportar/{formato}")
async def exportar_empresas(
    formato: str,
    estado: Optional[str] = Query(None)
):
    """Exportar empresas en diferentes formatos"""
    if formato not in ['pdf', 'excel', 'csv']:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    empresa_service = MockEmpresaService()
    
    # Obtener empresas según filtros
    if estado:
        empresas = await empresa_service.get_empresas_por_estado(estado)
    else:
        empresas = await empresa_service.get_empresas_activas()
    
    # Simular exportación
    if formato == 'excel':
        # Aquí iría la lógica real de exportación a Excel
        return {"message": f"Exportando {len(empresas)} empresas a Excel"}
    elif formato == 'pdf':
        return {"message": f"Exportando {len(empresas)} empresas a PDF"}
    elif formato == 'csv':
        return {"message": f"Exportando {len(empresas)} empresas a CSV"} 