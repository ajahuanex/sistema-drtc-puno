from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.dependencies.auth import get_current_active_user
# from app.services.mock_tuc_service import MockTucService  # COMENTADO: mock eliminado
# from app.dependencies.db import get_database
# from app.services.tuc_service import TucService  # NO EXISTE AÚN
from app.models.tuc import TucCreate, TucUpdate, TucInDB, TucResponse
from app.utils.exceptions import (
    TucNotFoundException, 
    TucAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/tucs", tags=["tucs"])

@router.post("/", response_model=TucResponse, status_code=201)
async def create_tuc(
    tuc_data: TucCreate
) -> TucResponse:
    """Crear nuevo TUC"""
    # Guard clauses al inicio
    if not tuc_data.nro_tuc.strip():
        raise ValidationErrorException("Número de TUC", "El número de TUC no puede estar vacío")
    
    tuc_service = MockTucService()
    
    try:
        tuc = await tuc_service.create_tuc(tuc_data)
        return TucResponse(
            id=tuc.id,
            nro_tuc=tuc.nro_tuc,
            vehiculo_id=tuc.vehiculo_id,
            empresa_id=tuc.empresa_id,
            resolucion_padre_id=tuc.resolucion_padre_id,
            fecha_emision=tuc.fecha_emision,
            estado=tuc.estado,
            razon_descarte=tuc.razon_descarte,
            observaciones=tuc.observaciones,
            esta_activo=tuc.esta_activo,
            fecha_registro=tuc.fecha_registro,
            fecha_actualizacion=tuc.fecha_actualizacion,
            documento_id=tuc.documento_id,
            qr_verification_url=tuc.qr_verification_url,
            usuario_emision_id=tuc.usuario_emision_id,
            fecha_vencimiento=tuc.fecha_vencimiento,
            motivo_baja=tuc.motivo_baja,
            fecha_baja=tuc.fecha_baja,
            usuario_baja_id=tuc.usuario_baja_id
        )
    except ValueError as e:
        if "número" in str(e).lower():
            raise TucAlreadyExistsException(tuc_data.nro_tuc)
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[TucResponse])
async def get_tucs(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado"),
    empresa_id: str = Query(None, description="Filtrar por empresa"),
    vehiculo_id: str = Query(None, description="Filtrar por vehículo")
) -> List[TucResponse]:
    """Obtener lista de TUCs con filtros opcionales"""
    tuc_service = MockTucService()
    
    if estado and empresa_id and vehiculo_id:
        tucs = await tuc_service.get_tucs_por_estado(estado)
        tucs = [t for t in tucs if t.empresa_id == empresa_id and t.vehiculo_id == vehiculo_id]
    elif estado and empresa_id:
        tucs = await tuc_service.get_tucs_por_estado(estado)
        tucs = [t for t in tucs if t.empresa_id == empresa_id]
    elif estado and vehiculo_id:
        tucs = await tuc_service.get_tucs_por_estado(estado)
        tucs = [t for t in tucs if t.vehiculo_id == vehiculo_id]
    elif empresa_id and vehiculo_id:
        tucs = await tuc_service.get_tucs_por_empresa(empresa_id)
        tucs = [t for t in tucs if t.vehiculo_id == vehiculo_id]
    elif estado:
        tucs = await tuc_service.get_tucs_por_estado(estado)
    elif empresa_id:
        tucs = await tuc_service.get_tucs_por_empresa(empresa_id)
    elif vehiculo_id:
        tucs = await tuc_service.get_tucs_por_vehiculo(vehiculo_id)
    else:
        tucs = await tuc_service.get_tucs_activos()
    
    # Aplicar paginación
    tucs = tucs[skip:skip + limit]
    
    # Log de debug para ver qué datos se están devolviendo
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"TUCs obtenidos del servicio: {len(tucs)}")
    for i, tuc in enumerate(tucs):
        logger.info(f"TUC {i+1}: id={tuc.id}, vehiculo_id={tuc.vehiculo_id}, empresa_id={tuc.empresa_id}, resolucion_padre_id={tuc.resolucion_padre_id}")
    
    # Crear respuestas
    responses = []
    for tuc in tucs:
        response = TucResponse(
            id=tuc.id,
            nro_tuc=tuc.nro_tuc,
            vehiculo_id=tuc.vehiculo_id,
            empresa_id=tuc.empresa_id,
            resolucion_padre_id=tuc.resolucion_padre_id,
            fecha_emision=tuc.fecha_emision,
            estado=tuc.estado,
            razon_descarte=tuc.razon_descarte,
            observaciones=tuc.observaciones,
            esta_activo=tuc.esta_activo,
            fecha_registro=tuc.fecha_registro,
            fecha_actualizacion=tuc.fecha_actualizacion,
            documento_id=tuc.documento_id,
            qr_verification_url=tuc.qr_verification_url,
            usuario_emision_id=tuc.usuario_emision_id,
            fecha_vencimiento=tuc.fecha_vencimiento,
            motivo_baja=tuc.motivo_baja,
            fecha_baja=tuc.fecha_baja,
            usuario_baja_id=tuc.usuario_baja_id
        )
        responses.append(response)
        logger.info(f"TUC Response {response.id}: vehiculo_id={response.vehiculo_id}, empresa_id={response.empresa_id}, resolucion_padre_id={response.resolucion_padre_id}")
    
    return responses

@router.get("/filtros", response_model=List[TucResponse])
async def get_tucs_con_filtros(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None),
    numero: Optional[str] = Query(None),
    empresa_id: Optional[str] = Query(None),
    vehiculo_id: Optional[str] = Query(None),
    resolucion_padre_id: Optional[str] = Query(None),
    fecha_desde: Optional[datetime] = Query(None),
    fecha_hasta: Optional[datetime] = Query(None)
) -> List[TucResponse]:
    """Obtener TUCs con filtros avanzados"""
    tuc_service = MockTucService()
    
    # Construir filtros
    filtros = {}
    if estado:
        filtros['estado'] = estado
    if numero:
        filtros['numero'] = numero
    if empresa_id:
        filtros['empresa_id'] = empresa_id
    if vehiculo_id:
        filtros['vehiculo_id'] = vehiculo_id
    if resolucion_padre_id:
        filtros['resolucion_padre_id'] = resolucion_padre_id
    if fecha_desde:
        filtros['fecha_desde'] = fecha_desde
    if fecha_hasta:
        filtros['fecha_hasta'] = fecha_hasta
    
    tucs = await tuc_service.get_tucs_con_filtros(filtros)
    tucs = tucs[skip:skip + limit]
    
    return [
        TucResponse(
            id=tuc.id,
            nro_tuc=tuc.nro_tuc,
            vehiculo_id=tuc.vehiculo_id,
            empresa_id=tuc.empresa_id,
            resolucion_padre_id=tuc.resolucion_padre_id,
            fecha_emision=tuc.fecha_emision,
            estado=tuc.estado,
            razon_descarte=tuc.razon_descarte,
            observaciones=tuc.observaciones,
            esta_activo=tuc.esta_activo,
            fecha_registro=tuc.fecha_registro,
            fecha_actualizacion=tuc.fecha_actualizacion,
            documento_id=tuc.documento_id,
            qr_verification_url=tuc.qr_verification_url,
            usuario_emision_id=tuc.usuario_emision_id,
            fecha_vencimiento=tuc.fecha_vencimiento,
            motivo_baja=tuc.motivo_baja,
            fecha_baja=tuc.fecha_baja,
            usuario_baja_id=tuc.usuario_baja_id
        )
        for tuc in tucs
    ]

@router.get("/estadisticas")
async def get_estadisticas_tucs():
    """Obtener estadísticas de TUCs"""
    tuc_service = MockTucService()
    estadisticas = await tuc_service.get_estadisticas()
    
    return {
        "totalTucs": estadisticas['total'],
        "tucsVigentes": estadisticas['vigentes'],
        "tucsVencidos": estadisticas['vencidos'],
        "tucsSuspendidos": estadisticas['suspendidos'],
        "porVencer": estadisticas['por_vencer'],
        "vencidosHoy": estadisticas['vencidos_hoy']
    }

@router.get("/vencidos", response_model=List[TucResponse])
async def get_tucs_vencidos():
    """Obtener TUCs vencidos"""
    tuc_service = MockTucService()
    tucs = await tuc_service.get_tucs_vencidos()
    
    return [
        TucResponse(
            id=tuc.id,
            nro_tuc=tuc.nro_tuc,
            vehiculo_id=tuc.vehiculo_id,
            empresa_id=tuc.empresa_id,
            resolucion_padre_id=tuc.resolucion_padre_id,
            fecha_emision=tuc.fecha_emision,
            estado=tuc.estado,
            razon_descarte=tuc.razon_descarte,
            observaciones=tuc.observaciones,
            esta_activo=tuc.esta_activo,
            fecha_registro=tuc.fecha_registro,
            fecha_actualizacion=tuc.fecha_actualizacion,
            documento_id=tuc.documento_id,
            qr_verification_url=tuc.qr_verification_url,
            usuario_emision_id=tuc.usuario_emision_id,
            fecha_vencimiento=tuc.fecha_vencimiento,
            motivo_baja=tuc.motivo_baja,
            fecha_baja=tuc.fecha_baja,
            usuario_baja_id=tuc.usuario_baja_id
        )
        for tuc in tucs
    ]

@router.get("/por-vencer", response_model=List[TucResponse])
async def get_tucs_por_vencer(
    dias: int = Query(30, ge=1, le=365, description="Días para considerar por vencer")
):
    """Obtener TUCs por vencer"""
    tuc_service = MockTucService()
    tucs = await tuc_service.get_tucs_por_vencer(dias)
    
    return [
        TucResponse(
            id=tuc.id,
            nro_tuc=tuc.nro_tuc,
            vehiculo_id=tuc.vehiculo_id,
            empresa_id=tuc.empresa_id,
            resolucion_padre_id=tuc.resolucion_padre_id,
            fecha_emision=tuc.fecha_emision,
            estado=tuc.estado,
            razon_descarte=tuc.razon_descarte,
            observaciones=tuc.observaciones,
            esta_activo=tuc.esta_activo,
            fecha_registro=tuc.fecha_registro,
            fecha_actualizacion=tuc.fecha_actualizacion,
            documento_id=tuc.documento_id,
            qr_verification_url=tuc.qr_verification_url,
            usuario_emision_id=tuc.usuario_emision_id,
            fecha_vencimiento=tuc.fecha_vencimiento,
            motivo_baja=tuc.motivo_baja,
            fecha_baja=tuc.fecha_baja,
            usuario_baja_id=tuc.usuario_baja_id
        )
        for tuc in tucs
    ]

@router.get("/{tuc_id}", response_model=TucResponse)
async def get_tuc(
    tuc_id: str
) -> TucResponse:
    """Obtener TUC por ID"""
    # Guard clause
    if not tuc_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de TUC inválido")
    
    tuc_service = MockTucService()
    tuc = await tuc_service.get_tuc_by_id(tuc_id)
    
    if not tuc:
        raise TucNotFoundException(tuc_id)
    
    return TucResponse(
        id=tuc.id,
        nro_tuc=tuc.nro_tuc,
        vehiculo_id=tuc.vehiculo_id,
        empresa_id=tuc.empresa_id,
        resolucion_padre_id=tuc.resolucion_padre_id,
        fecha_emision=tuc.fecha_emision,
        estado=tuc.estado,
        razon_descarte=tuc.razon_descarte,
        observaciones=tuc.observaciones,
        esta_activo=tuc.esta_activo,
        fecha_registro=tuc.fecha_registro,
        fecha_actualizacion=tuc.fecha_actualizacion,
        documento_id=tuc.documento_id,
        qr_verification_url=tuc.qr_verification_url,
        usuario_emision_id=tuc.usuario_emision_id,
        fecha_vencimiento=tuc.fecha_vencimiento,
        motivo_baja=tuc.motivo_baja,
        fecha_baja=tuc.fecha_baja,
        usuario_baja_id=tuc.usuario_baja_id
    )

@router.get("/numero/{numero}", response_model=TucResponse)
async def get_tuc_by_numero(
    numero: str
) -> TucResponse:
    """Obtener TUC por número"""
    tuc_service = MockTucService()
    tuc = await tuc_service.get_tuc_by_numero(numero)
    
    if not tuc:
        raise TucNotFoundException(f"Número {numero}")
    
    return TucResponse(
        id=tuc.id,
        nro_tuc=tuc.nro_tuc,
        vehiculo_id=tuc.vehiculo_id,
        empresa_id=tuc.empresa_id,
        resolucion_padre_id=tuc.resolucion_padre_id,
        fecha_emision=tuc.fecha_emision,
        estado=tuc.estado,
        razon_descarte=tuc.razon_descarte,
        observaciones=tuc.observaciones,
        esta_activo=tuc.esta_activo,
        fecha_registro=tuc.fecha_registro,
        fecha_actualizacion=tuc.fecha_actualizacion,
        documento_id=tuc.documento_id,
        qr_verification_url=tuc.qr_verification_url,
        usuario_emision_id=tuc.usuario_emision_id,
        fecha_vencimiento=tuc.fecha_vencimiento,
        motivo_baja=tuc.motivo_baja,
        fecha_baja=tuc.fecha_baja,
        usuario_baja_id=tuc.usuario_baja_id
    )

@router.get("/validar/{numero}")
async def validar_tuc(numero: str):
    """Validar TUC por número"""
    tuc_service = MockTucService()
    resultado = await tuc_service.validar_tuc(numero)
    
    return resultado

@router.get("/validar-numero/{numero}")
async def validar_numero_tuc(numero: str):
    """Validar si un número de TUC ya existe"""
    tuc_service = MockTucService()
    tuc_existente = await tuc_service.get_tuc_by_numero(numero)
    
    return {
        "valido": not tuc_existente,
        "tuc": tuc_existente
    }

@router.put("/{tuc_id}", response_model=TucResponse)
async def update_tuc(
    tuc_id: str,
    tuc_data: TucUpdate
) -> TucResponse:
    """Actualizar TUC"""
    # Guard clauses
    if not tuc_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de TUC inválido")
    
    if not tuc_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    tuc_service = MockTucService()
    updated_tuc = await tuc_service.update_tuc(tuc_id, tuc_data)
    
    if not updated_tuc:
        raise TucNotFoundException(tuc_id)
    
    return TucResponse(
        id=updated_tuc.id,
        nro_tuc=updated_tuc.nro_tuc,
        vehiculo_id=updated_tuc.vehiculo_id,
        empresa_id=updated_tuc.empresa_id,
        resolucion_padre_id=updated_tuc.resolucion_padre_id,
        fecha_emision=updated_tuc.fecha_emision,
        estado=updated_tuc.estado,
        razon_descarte=updated_tuc.razon_descarte,
        observaciones=updated_tuc.observaciones,
        esta_activo=updated_tuc.esta_activo,
        fecha_registro=updated_tuc.fecha_registro,
        fecha_actualizacion=updated_tuc.fecha_actualizacion,
        documento_id=updated_tuc.documento_id,
        qr_verification_url=updated_tuc.qr_verification_url,
        usuario_emision_id=updated_tuc.usuario_emision_id,
        fecha_vencimiento=updated_tuc.fecha_vencimiento,
        motivo_baja=updated_tuc.motivo_baja,
        fecha_baja=updated_tuc.fecha_baja,
        usuario_baja_id=updated_tuc.usuario_baja_id
    )

@router.delete("/{tuc_id}", status_code=204)
async def delete_tuc(
    tuc_id: str
):
    """Desactivar TUC (borrado lógico)"""
    # Guard clause
    if not tuc_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de TUC inválido")
    
    tuc_service = MockTucService()
    success = await tuc_service.soft_delete_tuc(tuc_id)
    
    if not success:
        raise TucNotFoundException(tuc_id)

# Endpoints para gestión de estados
@router.put("/{tuc_id}/renovar", response_model=TucResponse)
async def renovar_tuc(
    tuc_id: str,
    nueva_fecha_vencimiento: datetime
) -> TucResponse:
    """Renovar TUC con nueva fecha de vencimiento"""
    tuc_service = MockTucService()
    tuc = await tuc_service.renovar_tuc(tuc_id, nueva_fecha_vencimiento)
    
    if not tuc:
        raise TucNotFoundException(tuc_id)
    
    return TucResponse(
        id=tuc.id,
        nro_tuc=tuc.nro_tuc,
        vehiculo_id=tuc.vehiculo_id,
        empresa_id=tuc.empresa_id,
        resolucion_padre_id=tuc.resolucion_padre_id,
        fecha_emision=tuc.fecha_emision,
        estado=tuc.estado,
        razon_descarte=tuc.razon_descarte,
        observaciones=tuc.observaciones,
        esta_activo=tuc.esta_activo,
        fecha_registro=tuc.fecha_registro,
        fecha_actualizacion=tuc.fecha_actualizacion,
        documento_id=tuc.documento_id,
        qr_verification_url=tuc.qr_verification_url,
        usuario_emision_id=tuc.usuario_emision_id,
        fecha_vencimiento=tuc.fecha_vencimiento,
        motivo_baja=tuc.motivo_baja,
        fecha_baja=tuc.fecha_baja,
        usuario_baja_id=tuc.usuario_baja_id
    )

@router.put("/{tuc_id}/suspender", response_model=TucResponse)
async def suspender_tuc(
    tuc_id: str,
    motivo: str
) -> TucResponse:
    """Suspender TUC"""
    tuc_service = MockTucService()
    tuc = await tuc_service.suspender_tuc(tuc_id, motivo)
    
    if not tuc:
        raise TucNotFoundException(tuc_id)
    
    return TucResponse(
        id=tuc.id,
        nro_tuc=tuc.nro_tuc,
        vehiculo_id=tuc.vehiculo_id,
        empresa_id=tuc.empresa_id,
        resolucion_padre_id=tuc.resolucion_padre_id,
        fecha_emision=tuc.fecha_emision,
        estado=tuc.estado,
        razon_descarte=tuc.razon_descarte,
        observaciones=tuc.observaciones,
        esta_activo=tuc.esta_activo,
        fecha_registro=tuc.fecha_registro,
        fecha_actualizacion=tuc.fecha_actualizacion,
        documento_id=tuc.documento_id,
        qr_verification_url=tuc.qr_verification_url,
        usuario_emision_id=tuc.usuario_emision_id,
        fecha_vencimiento=tuc.fecha_vencimiento,
        motivo_baja=tuc.motivo_baja,
        fecha_baja=tuc.fecha_baja,
        usuario_baja_id=tuc.usuario_baja_id
    )

@router.put("/{tuc_id}/activar", response_model=TucResponse)
async def activar_tuc(
    tuc_id: str
) -> TucResponse:
    """Activar TUC suspendido"""
    tuc_service = MockTucService()
    tuc = await tuc_service.activar_tuc(tuc_id)
    
    if not tuc:
        raise TucNotFoundException(tuc_id)
    
    return TucResponse(
        id=tuc.id,
        nro_tuc=tuc.nro_tuc,
        vehiculo_id=tuc.vehiculo_id,
        empresa_id=tuc.empresa_id,
        resolucion_padre_id=tuc.resolucion_padre_id,
        fecha_emision=tuc.fecha_emision,
        estado=tuc.estado,
        razon_descarte=tuc.razon_descarte,
        observaciones=tuc.observaciones,
        esta_activo=tuc.esta_activo,
        fecha_registro=tuc.fecha_registro,
        fecha_actualizacion=tuc.fecha_actualizacion,
        documento_id=tuc.documento_id,
        qr_verification_url=tuc.qr_verification_url,
        usuario_emision_id=tuc.usuario_emision_id,
        fecha_vencimiento=tuc.fecha_vencimiento,
        motivo_baja=tuc.motivo_baja,
        fecha_baja=tuc.fecha_baja,
        usuario_baja_id=tuc.usuario_baja_id
    )

# Endpoints para exportación
@router.get("/exportar/{formato}")
async def exportar_tucs(
    formato: str,
    estado: Optional[str] = Query(None)
):
    """Exportar TUCs en diferentes formatos"""
    if formato not in ['pdf', 'excel', 'csv']:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    tuc_service = MockTucService()
    
    # Obtener TUCs según filtros
    if estado:
        tucs = await tuc_service.get_tucs_por_estado(estado)
    else:
        tucs = await tuc_service.get_tucs_activos()
    
    # Simular exportación
    if formato == 'excel':
        return {"message": f"Exportando {len(tucs)} TUCs a Excel"}
    elif formato == 'pdf':
        return {"message": f"Exportando {len(tucs)} TUCs a PDF"}
    elif formato == 'csv':
        return {"message": f"Exportando {len(tucs)} TUCs a CSV"} 