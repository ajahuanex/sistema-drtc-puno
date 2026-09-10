from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
from io import BytesIO

from app.dependencies.db import get_database
from app.models.resolucion_hija import (
    ResolucionHijaCreate,
    ResolucionHijaUpdate,
    ResolucionHijaResponse,
    TipoActoModificatorio
)
from app.services.resolucion_hija_service import ResolucionHijaService
from app.services.resolucion_hija_excel_service import ResolucionHijaExcelService
from app.utils.exceptions import ResolucionNotFoundException, ResolucionAlreadyExistsException, ValidationErrorException

router = APIRouter(prefix="/resoluciones-hijas", tags=["resoluciones-hijas"])

async def get_service():
    db = await get_database()
    return ResolucionHijaService(db)

async def get_excel_service():
    db = await get_database()
    return ResolucionHijaExcelService(db)

@router.post("", response_model=ResolucionHijaResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ResolucionHijaResponse, status_code=status.HTTP_201_CREATED)
async def create_resolucion_hija(
    data: ResolucionHijaCreate,
    service: ResolucionHijaService = Depends(get_service)
) -> ResolucionHijaResponse:
    """Crear nueva resolución hija / modificatoria"""
    if not data.nro_resolucion.strip():
        raise ValidationErrorException("nro_resolucion", "El número de resolución hija no puede estar vacío")
    if not data.nro_resolucion_primigenia.strip():
        raise ValidationErrorException("nro_resolucion_primigenia", "El número de resolución primigenia asociada es obligatorio")
    if not data.ruc_empresa.strip() or len(data.ruc_empresa.strip()) != 11:
        raise ValidationErrorException("ruc_empresa", "El RUC de la empresa debe tener 11 dígitos")

    try:
        res = await service.create_resolucion_hija(data)
        return ResolucionHijaResponse.model_validate(res)
    except ResolucionAlreadyExistsException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[ResolucionHijaResponse])
@router.get("/", response_model=List[ResolucionHijaResponse])
async def get_resoluciones_hijas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    nro_resolucion: Optional[str] = Query(None, description="Filtrar por número de resolución hija"),
    nro_resolucion_primigenia: Optional[str] = Query(None, description="Filtrar por número de resolución primigenia asociada"),
    ruc_empresa: Optional[str] = Query(None, description="Filtrar por RUC de empresa"),
    tipo_acto: Optional[TipoActoModificatorio] = Query(None, description="Filtrar por tipo de acto modificatorio"),
    fecha_desde: Optional[datetime] = Query(None),
    fecha_hasta: Optional[datetime] = Query(None),
    service: ResolucionHijaService = Depends(get_service)
) -> List[ResolucionHijaResponse]:
    """Obtener lista de resoluciones hijas con filtros opcionales"""
    filtros = {}
    if nro_resolucion: filtros["nro_resolucion"] = nro_resolucion
    if nro_resolucion_primigenia: filtros["nro_resolucion_primigenia"] = nro_resolucion_primigenia
    if ruc_empresa: filtros["ruc_empresa"] = ruc_empresa
    if tipo_acto: filtros["tipo_acto"] = tipo_acto.value
    if fecha_desde: filtros["fecha_desde"] = fecha_desde
    if fecha_hasta: filtros["fecha_hasta"] = fecha_hasta

    resoluciones = await service.get_resoluciones_hijas_con_filtros(filtros)
    paginadas = resoluciones[skip:skip + limit]
    return [ResolucionHijaResponse.model_validate(r) for r in paginadas]

@router.get("/primigenia/{nro_resolucion_primigenia}", response_model=List[ResolucionHijaResponse])
async def get_hijas_by_primigenia(
    nro_resolucion_primigenia: str,
    service: ResolucionHijaService = Depends(get_service)
) -> List[ResolucionHijaResponse]:
    """Obtener todas las resoluciones hijas vinculadas a una resolución primigenia específica"""
    hijas = await service.get_hijas_by_primigenia(nro_resolucion_primigenia)
    return [ResolucionHijaResponse.model_validate(h) for h in hijas]

@router.get("/empresa/{ruc_empresa}", response_model=List[ResolucionHijaResponse])
async def get_hijas_by_empresa(
    ruc_empresa: str,
    service: ResolucionHijaService = Depends(get_service)
) -> List[ResolucionHijaResponse]:
    """Obtener todas las resoluciones hijas pertenecientes a una empresa por su RUC"""
    hijas = await service.get_hijas_by_ruc(ruc_empresa)
    return [ResolucionHijaResponse.model_validate(h) for h in hijas]

@router.get("/numero/{nro_resolucion}", response_model=ResolucionHijaResponse)
async def get_resolucion_hija_by_numero(
    nro_resolucion: str,
    service: ResolucionHijaService = Depends(get_service)
) -> ResolucionHijaResponse:
    """Buscar resolución hija por número correlativo"""
    hija = await service.get_resolucion_hija_by_numero(nro_resolucion)
    if not hija:
        raise HTTPException(status_code=404, detail=f"No se encontró resolución hija con número {nro_resolucion}")
    return ResolucionHijaResponse.model_validate(hija)

@router.get("/{hija_id}", response_model=ResolucionHijaResponse)
async def get_resolucion_hija_by_id(
    hija_id: str,
    service: ResolucionHijaService = Depends(get_service)
) -> ResolucionHijaResponse:
    """Obtener detalle de resolución hija por ID"""
    hija = await service.get_resolucion_hija_by_id(hija_id)
    if not hija:
        raise HTTPException(status_code=404, detail=f"No se encontró resolución hija con ID {hija_id}")
    return ResolucionHijaResponse.model_validate(hija)

@router.put("/{hija_id}", response_model=ResolucionHijaResponse)
async def update_resolucion_hija(
    hija_id: str,
    data: ResolucionHijaUpdate,
    service: ResolucionHijaService = Depends(get_service)
) -> ResolucionHijaResponse:
    """Actualizar datos de resolución hija"""
    hija = await service.update_resolucion_hija(hija_id, data)
    if not hija:
        raise HTTPException(status_code=404, detail=f"No se encontró resolución hija con ID {hija_id}")
    return ResolucionHijaResponse.model_validate(hija)

@router.delete("/{hija_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resolucion_hija(
    hija_id: str,
    service: ResolucionHijaService = Depends(get_service)
):
    """Desactivar (borrado lógico) resolución hija"""
    success = await service.soft_delete_resolucion_hija(hija_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"No se encontró resolución hija con ID {hija_id}")

# ========================================
# ENDPOINTS DE CARGA MASIVA
# ========================================

@router.get("/carga-masiva/plantilla")
async def descargar_plantilla_resoluciones_hijas(
    excel_service: ResolucionHijaExcelService = Depends(get_excel_service)
):
    """Descargar plantilla Excel oficial para Carga Masiva de Resoluciones Hijas"""
    try:
        buffer = excel_service.generar_plantilla_excel()
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=plantilla_resoluciones_hijas.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando plantilla: {str(e)}")

@router.post("/carga-masiva/procesar")
async def procesar_carga_masiva_resoluciones_hijas(
    archivo: UploadFile = File(..., description="Archivo Excel (.xlsx o .xls) con resoluciones hijas"),
    excel_service: ResolucionHijaExcelService = Depends(get_excel_service)
):
    """Procesar carga masiva de resoluciones hijas desde archivo Excel"""
    if not archivo.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="El archivo debe ser Excel (.xlsx, .xls) o CSV (.csv)")

    try:
        contenido = await archivo.read()
        buffer = BytesIO(contenido)
        resultado = await excel_service.procesar_carga_masiva(buffer)
        return {
            "archivo": archivo.filename,
            "resultado": resultado,
            "mensaje": f"Carga masiva completada: {resultado['creadas']} resoluciones hijas creadas."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar archivo: {str(e)}")
