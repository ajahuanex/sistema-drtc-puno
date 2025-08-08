from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.dependencies.auth import get_current_active_user
from app.services.mock_resolucion_service import MockResolucionService
from app.models.resolucion import ResolucionCreate, ResolucionUpdate, ResolucionInDB, ResolucionResponse
from app.utils.exceptions import (
    ResolucionNotFoundException, 
    ResolucionAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/resoluciones", tags=["resoluciones"])

@router.post("/", response_model=ResolucionResponse, status_code=201)
async def create_resolucion(
    resolucion_data: ResolucionCreate
) -> ResolucionResponse:
    """Crear nueva resolución"""
    # Guard clauses al inicio
    if not resolucion_data.numero.strip():
        raise ValidationErrorException("Número", "El número de resolución no puede estar vacío")
    
    resolucion_service = MockResolucionService()
    
    try:
        resolucion = await resolucion_service.create_resolucion(resolucion_data)
        return ResolucionResponse(
            id=resolucion.id,
            numero=resolucion.numero,
            fecha_emision=resolucion.fecha_emision,
            fecha_vencimiento=resolucion.fecha_vencimiento,
            tipo=resolucion.tipo,
            empresa_id=resolucion.empresa_id,
            expediente_id=resolucion.expediente_id,
            estado=resolucion.estado,
            observaciones=resolucion.observaciones,
            esta_activo=resolucion.esta_activo,
            fecha_registro=resolucion.fecha_registro
        )
    except ValueError as e:
        if "número" in str(e).lower():
            raise ResolucionAlreadyExistsException(resolucion_data.numero)
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[ResolucionResponse])
async def get_resoluciones(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado"),
    empresa_id: str = Query(None, description="Filtrar por empresa"),
    tipo: str = Query(None, description="Filtrar por tipo")
) -> List[ResolucionResponse]:
    """Obtener lista de resoluciones con filtros opcionales"""
    resolucion_service = MockResolucionService()
    
    if estado and empresa_id and tipo:
        resoluciones = await resolucion_service.get_resoluciones_por_estado(estado)
        resoluciones = [r for r in resoluciones if r.empresa_id == empresa_id and r.tipo == tipo]
    elif estado and empresa_id:
        resoluciones = await resolucion_service.get_resoluciones_por_estado(estado)
        resoluciones = [r for r in resoluciones if r.empresa_id == empresa_id]
    elif estado and tipo:
        resoluciones = await resolucion_service.get_resoluciones_por_estado(estado)
        resoluciones = [r for r in resoluciones if r.tipo == tipo]
    elif empresa_id and tipo:
        resoluciones = await resolucion_service.get_resoluciones_por_empresa(empresa_id)
        resoluciones = [r for r in resoluciones if r.tipo == tipo]
    elif estado:
        resoluciones = await resolucion_service.get_resoluciones_por_estado(estado)
    elif empresa_id:
        resoluciones = await resolucion_service.get_resoluciones_por_empresa(empresa_id)
    elif tipo:
        resoluciones = await resolucion_service.get_resoluciones_por_tipo(tipo)
    else:
        resoluciones = await resolucion_service.get_resoluciones_activas()
    
    # Aplicar paginación
    resoluciones = resoluciones[skip:skip + limit]
    
    return [
        ResolucionResponse(
            id=resolucion.id,
            numero=resolucion.numero,
            fecha_emision=resolucion.fecha_emision,
            fecha_vencimiento=resolucion.fecha_vencimiento,
            tipo=resolucion.tipo,
            empresa_id=resolucion.empresa_id,
            expediente_id=resolucion.expediente_id,
            estado=resolucion.estado,
            observaciones=resolucion.observaciones,
            esta_activo=resolucion.esta_activo,
            fecha_registro=resolucion.fecha_registro
        )
        for resolucion in resoluciones
    ]

@router.get("/filtros", response_model=List[ResolucionResponse])
async def get_resoluciones_con_filtros(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None),
    numero: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    empresa_id: Optional[str] = Query(None),
    expediente_id: Optional[str] = Query(None),
    fecha_desde: Optional[datetime] = Query(None),
    fecha_hasta: Optional[datetime] = Query(None)
) -> List[ResolucionResponse]:
    """Obtener resoluciones con filtros avanzados"""
    resolucion_service = MockResolucionService()
    
    # Construir filtros
    filtros = {}
    if estado:
        filtros['estado'] = estado
    if numero:
        filtros['numero'] = numero
    if tipo:
        filtros['tipo'] = tipo
    if empresa_id:
        filtros['empresa_id'] = empresa_id
    if expediente_id:
        filtros['expediente_id'] = expediente_id
    if fecha_desde:
        filtros['fecha_desde'] = fecha_desde
    if fecha_hasta:
        filtros['fecha_hasta'] = fecha_hasta
    
    resoluciones = await resolucion_service.get_resoluciones_con_filtros(filtros)
    resoluciones = resoluciones[skip:skip + limit]
    
    return [
        ResolucionResponse(
            id=resolucion.id,
            numero=resolucion.numero,
            fecha_emision=resolucion.fecha_emision,
            fecha_vencimiento=resolucion.fecha_vencimiento,
            tipo=resolucion.tipo,
            empresa_id=resolucion.empresa_id,
            expediente_id=resolucion.expediente_id,
            estado=resolucion.estado,
            observaciones=resolucion.observaciones,
            esta_activo=resolucion.esta_activo,
            fecha_registro=resolucion.fecha_registro
        )
        for resolucion in resoluciones
    ]

@router.get("/estadisticas")
async def get_estadisticas_resoluciones():
    """Obtener estadísticas de resoluciones"""
    resolucion_service = MockResolucionService()
    estadisticas = await resolucion_service.get_estadisticas()
    
    return {
        "totalResoluciones": estadisticas['total'],
        "resolucionesVigentes": estadisticas['vigentes'],
        "resolucionesVencidas": estadisticas['vencidas'],
        "resolucionesSuspendidas": estadisticas['suspendidas'],
        "porVencer": estadisticas['por_vencer'],
        "porTipo": estadisticas['por_tipo']
    }

@router.get("/vencidas", response_model=List[ResolucionResponse])
async def get_resoluciones_vencidas():
    """Obtener resoluciones vencidas"""
    resolucion_service = MockResolucionService()
    resoluciones = await resolucion_service.get_resoluciones_vencidas()
    
    return [
        ResolucionResponse(
            id=resolucion.id,
            numero=resolucion.numero,
            fecha_emision=resolucion.fecha_emision,
            fecha_vencimiento=resolucion.fecha_vencimiento,
            tipo=resolucion.tipo,
            empresa_id=resolucion.empresa_id,
            expediente_id=resolucion.expediente_id,
            estado=resolucion.estado,
            observaciones=resolucion.observaciones,
            esta_activo=resolucion.esta_activo,
            fecha_registro=resolucion.fecha_registro
        )
        for resolucion in resoluciones
    ]

@router.get("/{resolucion_id}", response_model=ResolucionResponse)
async def get_resolucion(
    resolucion_id: str
) -> ResolucionResponse:
    """Obtener resolución por ID"""
    # Guard clause
    if not resolucion_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de resolución inválido")
    
    resolucion_service = MockResolucionService()
    resolucion = await resolucion_service.get_resolucion_by_id(resolucion_id)
    
    if not resolucion:
        raise ResolucionNotFoundException(resolucion_id)
    
    return ResolucionResponse(
        id=resolucion.id,
        numero=resolucion.numero,
        fecha_emision=resolucion.fecha_emision,
        fecha_vencimiento=resolucion.fecha_vencimiento,
        tipo=resolucion.tipo,
        empresa_id=resolucion.empresa_id,
        expediente_id=resolucion.expediente_id,
        estado=resolucion.estado,
        observaciones=resolucion.observaciones,
        esta_activo=resolucion.esta_activo,
        fecha_registro=resolucion.fecha_registro
    )

@router.get("/numero/{numero}", response_model=ResolucionResponse)
async def get_resolucion_by_numero(
    numero: str
) -> ResolucionResponse:
    """Obtener resolución por número"""
    resolucion_service = MockResolucionService()
    resolucion = await resolucion_service.get_resolucion_by_numero(numero)
    
    if not resolucion:
        raise ResolucionNotFoundException(f"Número {numero}")
    
    return ResolucionResponse(
        id=resolucion.id,
        numero=resolucion.numero,
        fecha_emision=resolucion.fecha_emision,
        fecha_vencimiento=resolucion.fecha_vencimiento,
        tipo=resolucion.tipo,
        empresa_id=resolucion.empresa_id,
        expediente_id=resolucion.expediente_id,
        estado=resolucion.estado,
        observaciones=resolucion.observaciones,
        esta_activo=resolucion.esta_activo,
        fecha_registro=resolucion.fecha_registro
    )

@router.get("/validar-numero/{numero}")
async def validar_numero_resolucion(numero: str):
    """Validar si un número de resolución ya existe"""
    resolucion_service = MockResolucionService()
    resolucion_existente = await resolucion_service.get_resolucion_by_numero(numero)
    
    return {
        "valido": not resolucion_existente,
        "resolucion": resolucion_existente
    }

@router.put("/{resolucion_id}", response_model=ResolucionResponse)
async def update_resolucion(
    resolucion_id: str,
    resolucion_data: ResolucionUpdate
) -> ResolucionResponse:
    """Actualizar resolución"""
    # Guard clauses
    if not resolucion_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de resolución inválido")
    
    if not resolucion_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    resolucion_service = MockResolucionService()
    updated_resolucion = await resolucion_service.update_resolucion(resolucion_id, resolucion_data)
    
    if not updated_resolucion:
        raise ResolucionNotFoundException(resolucion_id)
    
    return ResolucionResponse(
        id=updated_resolucion.id,
        numero=updated_resolucion.numero,
        fecha_emision=updated_resolucion.fecha_emision,
        fecha_vencimiento=updated_resolucion.fecha_vencimiento,
        tipo=updated_resolucion.tipo,
        empresa_id=updated_resolucion.empresa_id,
        expediente_id=updated_resolucion.expediente_id,
        estado=updated_resolucion.estado,
        observaciones=updated_resolucion.observaciones,
        esta_activo=updated_resolucion.esta_activo,
        fecha_registro=updated_resolucion.fecha_registro
    )

@router.delete("/{resolucion_id}", status_code=204)
async def delete_resolucion(
    resolucion_id: str
):
    """Desactivar resolución (borrado lógico)"""
    # Guard clause
    if not resolucion_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de resolución inválido")
    
    resolucion_service = MockResolucionService()
    success = await resolucion_service.soft_delete_resolucion(resolucion_id)
    
    if not success:
        raise ResolucionNotFoundException(resolucion_id)

# Endpoints para gestión de estados
@router.put("/{resolucion_id}/renovar", response_model=ResolucionResponse)
async def renovar_resolucion(
    resolucion_id: str,
    nueva_fecha_vencimiento: datetime
) -> ResolucionResponse:
    """Renovar resolución con nueva fecha de vencimiento"""
    resolucion_service = MockResolucionService()
    resolucion = await resolucion_service.renovar_resolucion(resolucion_id, nueva_fecha_vencimiento)
    
    if not resolucion:
        raise ResolucionNotFoundException(resolucion_id)
    
    return ResolucionResponse(
        id=resolucion.id,
        numero=resolucion.numero,
        fecha_emision=resolucion.fecha_emision,
        fecha_vencimiento=resolucion.fecha_vencimiento,
        tipo=resolucion.tipo,
        empresa_id=resolucion.empresa_id,
        expediente_id=resolucion.expediente_id,
        estado=resolucion.estado,
        observaciones=resolucion.observaciones,
        esta_activo=resolucion.esta_activo,
        fecha_registro=resolucion.fecha_registro
    )

@router.put("/{resolucion_id}/suspender", response_model=ResolucionResponse)
async def suspender_resolucion(
    resolucion_id: str,
    motivo: str
) -> ResolucionResponse:
    """Suspender resolución"""
    resolucion_service = MockResolucionService()
    resolucion = await resolucion_service.suspender_resolucion(resolucion_id, motivo)
    
    if not resolucion:
        raise ResolucionNotFoundException(resolucion_id)
    
    return ResolucionResponse(
        id=resolucion.id,
        numero=resolucion.numero,
        fecha_emision=resolucion.fecha_emision,
        fecha_vencimiento=resolucion.fecha_vencimiento,
        tipo=resolucion.tipo,
        empresa_id=resolucion.empresa_id,
        expediente_id=resolucion.expediente_id,
        estado=resolucion.estado,
        observaciones=resolucion.observaciones,
        esta_activo=resolucion.esta_activo,
        fecha_registro=resolucion.fecha_registro
    )

@router.put("/{resolucion_id}/activar", response_model=ResolucionResponse)
async def activar_resolucion(
    resolucion_id: str
) -> ResolucionResponse:
    """Activar resolución suspendida"""
    resolucion_service = MockResolucionService()
    resolucion = await resolucion_service.activar_resolucion(resolucion_id)
    
    if not resolucion:
        raise ResolucionNotFoundException(resolucion_id)
    
    return ResolucionResponse(
        id=resolucion.id,
        numero=resolucion.numero,
        fecha_emision=resolucion.fecha_emision,
        fecha_vencimiento=resolucion.fecha_vencimiento,
        tipo=resolucion.tipo,
        empresa_id=resolucion.empresa_id,
        expediente_id=resolucion.expediente_id,
        estado=resolucion.estado,
        observaciones=resolucion.observaciones,
        esta_activo=resolucion.esta_activo,
        fecha_registro=resolucion.fecha_registro
    )

# Endpoints para exportación
@router.get("/exportar/{formato}")
async def exportar_resoluciones(
    formato: str,
    estado: Optional[str] = Query(None)
):
    """Exportar resoluciones en diferentes formatos"""
    if formato not in ['pdf', 'excel', 'csv']:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    resolucion_service = MockResolucionService()
    
    # Obtener resoluciones según filtros
    if estado:
        resoluciones = await resolucion_service.get_resoluciones_por_estado(estado)
    else:
        resoluciones = await resolucion_service.get_resoluciones_activas()
    
    # Simular exportación
    if formato == 'excel':
        return {"message": f"Exportando {len(resoluciones)} resoluciones a Excel"}
    elif formato == 'pdf':
        return {"message": f"Exportando {len(resoluciones)} resoluciones a PDF"}
    elif formato == 'csv':
        return {"message": f"Exportando {len(resoluciones)} resoluciones a CSV"} 