from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
from io import BytesIO

from app.dependencies.db import get_database
from app.models.resolucion_primigenia import (
    ResolucionPrimigeniaCreate,
    ResolucionPrimigeniaUpdate,
    ResolucionPrimigeniaResponse,
    ResolucionPrimigenia,
    FeErrata,
    ModificacionHistorial,
    EstadoResolucionPrimigenia
)
from app.services.resolucion_primigenia_service import ResolucionPrimigeniaService
from app.services.resolucion_primigenia_excel_service import ResolucionPrimigeniaExcelService
from app.utils.exceptions import ResolucionNotFoundException, ResolucionAlreadyExistsException, ValidationErrorException

router = APIRouter(prefix="/resoluciones-primigenias", tags=["resoluciones-primigenias"])

async def get_service():
    db = await get_database()
    return ResolucionPrimigeniaService(db)

async def get_excel_service():
    db = await get_database()
    return ResolucionPrimigeniaExcelService(db)

@router.post("", response_model=ResolucionPrimigeniaResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ResolucionPrimigeniaResponse, status_code=status.HTTP_201_CREATED)
async def create_resolucion_primigenia(
    data: ResolucionPrimigeniaCreate,
    service: ResolucionPrimigeniaService = Depends(get_service)
) -> ResolucionPrimigeniaResponse:
    """Crear nueva resolución primigenia"""
    if not data.nro_resolucion.strip():
        raise ValidationErrorException("nro_resolucion", "El número de resolución no puede estar vacío")
    if not data.ruc_empresa.strip() or len(data.ruc_empresa.strip()) != 11:
        raise ValidationErrorException("ruc_empresa", "El RUC de la empresa debe tener exactamente 11 dígitos")

    try:
        res = await service.create_resolucion_primigenia(data)
        return ResolucionPrimigeniaResponse.model_validate(res)
    except ResolucionAlreadyExistsException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[ResolucionPrimigeniaResponse])
@router.get("/", response_model=List[ResolucionPrimigeniaResponse])
async def get_resoluciones_primigenias(
    skip: int = Query(0, ge=0),
    limit: int = Query(10000, ge=1, le=100000),
    ruc_empresa: Optional[str] = Query(None, description="Filtrar por RUC de empresa"),
    nro_resolucion: Optional[str] = Query(None, description="Filtrar por número de resolución"),
    estado: Optional[EstadoResolucionPrimigenia] = Query(None, description="Filtrar por estado"),
    tipo_autorizacion: Optional[str] = Query(None, description="Filtrar por tipo de autorización"),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha de emisión desde"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha de emisión hasta"),
    service: ResolucionPrimigeniaService = Depends(get_service)
) -> List[ResolucionPrimigeniaResponse]:
    """Obtener lista de resoluciones primigenias con filtros"""
    filtros = {}
    if ruc_empresa: filtros["ruc_empresa"] = ruc_empresa
    if nro_resolucion: filtros["nro_resolucion"] = nro_resolucion
    if estado: filtros["estado"] = estado.value
    if tipo_autorizacion: filtros["tipo_autorizacion"] = tipo_autorizacion
    if fecha_desde: filtros["fecha_desde"] = fecha_desde
    if fecha_hasta: filtros["fecha_hasta"] = fecha_hasta

    resoluciones = await service.get_resoluciones_con_filtros(filtros)
    paginadas = resoluciones[skip:skip + limit]
    return [ResolucionPrimigeniaResponse.model_validate(r) for r in paginadas]

@router.get("/empresa/{ruc_empresa}", response_model=List[ResolucionPrimigeniaResponse])
async def get_resoluciones_by_empresa(
    ruc_empresa: str,
    service: ResolucionPrimigeniaService = Depends(get_service)
) -> List[ResolucionPrimigeniaResponse]:
    """Obtener todas las resoluciones primigenias asignadas a una empresa por su RUC"""
    resoluciones = await service.get_resoluciones_by_ruc(ruc_empresa)
    return [ResolucionPrimigeniaResponse.model_validate(r) for r in resoluciones]

@router.get("/numero/{nro_resolucion}", response_model=ResolucionPrimigeniaResponse)
async def get_resolucion_by_numero(
    nro_resolucion: str,
    service: ResolucionPrimigeniaService = Depends(get_service)
) -> ResolucionPrimigeniaResponse:
    """Buscar resolución primigenia por su número correlativo y año"""
    res = await service.get_resolucion_by_numero(nro_resolucion)
    if not res:
        raise HTTPException(status_code=404, detail=f"No se encontró resolución primigenia con número {nro_resolucion}")
    return ResolucionPrimigeniaResponse.model_validate(res)

@router.get("/{resolucion_id}", response_model=ResolucionPrimigeniaResponse)
async def get_resolucion_by_id(
    resolucion_id: str,
    service: ResolucionPrimigeniaService = Depends(get_service)
) -> ResolucionPrimigeniaResponse:
    """Obtener detalle de resolución primigenia por ID"""
    res = await service.get_resolucion_by_id(resolucion_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"No se encontró resolución primigenia con ID {resolucion_id}")
    return ResolucionPrimigeniaResponse.model_validate(res)

@router.put("/{resolucion_id}", response_model=ResolucionPrimigeniaResponse)
async def update_resolucion_primigenia(
    resolucion_id: str,
    data: ResolucionPrimigeniaUpdate,
    service: ResolucionPrimigeniaService = Depends(get_service)
) -> ResolucionPrimigeniaResponse:
    """Actualizar resolución primigenia"""
    res = await service.update_resolucion_primigenia(resolucion_id, data)
    if not res:
        raise HTTPException(status_code=404, detail=f"No se encontró resolución primigenia con ID {resolucion_id}")
    return ResolucionPrimigeniaResponse.model_validate(res)

@router.post("/{resolucion_id}/fe-erratas", response_model=ResolucionPrimigeniaResponse)
async def agregar_fe_errata(
    resolucion_id: str,
    fe_errata: FeErrata,
    service: ResolucionPrimigeniaService = Depends(get_service)
) -> ResolucionPrimigeniaResponse:
    """Agregar un registro de fe de erratas a la resolución primigenia"""
    try:
        res = await service.agregar_fe_errata(resolucion_id, fe_errata)
        return ResolucionPrimigeniaResponse.model_validate(res)
    except ResolucionNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{resolucion_id}/historial-modificaciones", response_model=ResolucionPrimigeniaResponse)
async def agregar_modificacion_historial(
    resolucion_id: str,
    modificacion: ModificacionHistorial,
    service: ResolucionPrimigeniaService = Depends(get_service)
) -> ResolucionPrimigeniaResponse:
    """Registrar un acto modificatorio posterior (resolución hija) en el historial de la resolución primigenia"""
    try:
        res = await service.agregar_modificacion_historial(resolucion_id, modificacion)
        return ResolucionPrimigeniaResponse.model_validate(res)
    except ResolucionNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{resolucion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resolucion_primigenia(
    resolucion_id: str,
    service: ResolucionPrimigeniaService = Depends(get_service)
):
    """Desactivar (borrado lógico) resolución primigenia"""
    success = await service.soft_delete_resolucion_primigenia(resolucion_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"No se encontró resolución primigenia con ID {resolucion_id}")

# ========================================
# ENDPOINTS DE CARGA MASIVA
# ========================================

@router.get("/carga-masiva/plantilla")
async def descargar_plantilla_resoluciones_primigenias(
    excel_service: ResolucionPrimigeniaExcelService = Depends(get_excel_service)
):
    """Descargar plantilla Excel oficial para la Carga Masiva de Resoluciones Primigenias"""
    try:
        buffer = excel_service.generar_plantilla_excel()
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=plantilla_resoluciones_primigenias.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando plantilla: {str(e)}")

@router.post("/carga-masiva/procesar")
async def procesar_carga_masiva_resoluciones_primigenias(
    archivo: UploadFile = File(..., description="Archivo Excel (.xlsx o .xls) con resoluciones primigenias"),
    modo: str = Query("upsert", description="Modo de procesamiento: 'upsert' (crear o actualizar) o 'crear' (solo nuevos)"),
    excel_service: ResolucionPrimigeniaExcelService = Depends(get_excel_service)
):
    """Procesar carga masiva de resoluciones primigenias desde archivo Excel"""
    if not archivo.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="El archivo debe ser Excel (.xlsx, .xls) o CSV (.csv)")

    try:
        contenido = await archivo.read()
        buffer = BytesIO(contenido)
        resultado = await excel_service.procesar_carga_masiva(buffer, modo=modo)
        return {
            "archivo": archivo.filename,
            "resultado": resultado,
            "mensaje": f"Carga masiva completada: {resultado['creadas']} resoluciones primigenias procesadas/creadas."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar archivo: {str(e)}")
