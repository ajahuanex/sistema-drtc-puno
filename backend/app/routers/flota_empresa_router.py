"""
Router FastAPI para el módulo Flota Empresa.
Prefijo: /flota-empresa
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import StreamingResponse
from typing import List, Optional
from io import BytesIO

from app.dependencies.db import get_database
from app.models.flota_empresa import (
    VehiculoEmpresaCreate,
    VehiculoEmpresaUpdate,
    VehiculoEmpresaResponse,
    AgregarObservacionRequest
)
from app.services.flota_empresa_service import FlotaEmpresaService
from app.services.flota_empresa_excel_service import FlotaEmpresaExcelService

router = APIRouter(prefix="/flota-empresa", tags=["flota-empresa"])


async def get_service():
    db = await get_database()
    return FlotaEmpresaService(db)


async def get_excel_service():
    db = await get_database()
    return FlotaEmpresaExcelService(db)


# ======================================================================
# ENDPOINTS DE CONSULTA
# ======================================================================

@router.get("", summary="Listar flota con filtros y paginación")
@router.get("/", summary="Listar flota con filtros y paginación")
async def get_flota(
    skip: int = Query(0, ge=0),
    limit: int = Query(10000, ge=1, le=100000),
    ruc: Optional[str] = Query(None, description="Filtrar por RUC de empresa"),
    estado: Optional[str] = Query(None, description="Filtrar por estado vehicular"),
    placa: Optional[str] = Query(None, description="Filtrar por placa (búsqueda parcial)"),
    nro_resolucion_primigenia: Optional[str] = Query(None, description="Filtrar por N° resolución primigenia"),
    q: Optional[str] = Query(None, description="Búsqueda libre: placa, RUC, empresa, TUC, resolución"),
    solo_activos: bool = Query(False, description="Solo vehículos con estado activo (no cronológicos)"),
    service: FlotaEmpresaService = Depends(get_service)
):
    """Obtener flota empresa paginada con filtros opcionales."""
    return await service.get_flota_paginada(
        skip=skip, limit=limit, ruc=ruc, estado=estado,
        placa=placa, nro_resolucion_primigenia=nro_resolucion_primigenia,
        q=q, solo_activos=solo_activos
    )


@router.get("/empresas-resumen", summary="Listar todas las empresas con resumen de flota")
async def get_resumen_empresas(
    service: FlotaEmpresaService = Depends(get_service)
):
    """Obtener catálogo de empresas registradas con totales de flota y resoluciones."""
    empresas = await service.get_resumen_empresas()
    return {"total": len(empresas), "data": empresas}


@router.get("/empresa/{ruc}", summary="Flota de una empresa por RUC")
async def get_flota_by_empresa(
    ruc: str,
    solo_activos: bool = Query(False, description="Solo vehículos activos (excluye cronológicos)"),
    service: FlotaEmpresaService = Depends(get_service)
):
    """Obtener todos los registros de flota para un RUC de empresa."""
    docs = await service.get_flota_by_ruc(ruc, solo_activos=solo_activos)
    return {"ruc": ruc, "total": len(docs), "data": docs}


@router.get("/estadisticas/{ruc}", summary="Estadísticas de flota por empresa")
async def get_estadisticas(
    ruc: str,
    service: FlotaEmpresaService = Depends(get_service)
):
    """Obtener estadísticas de flota (por estado) para una empresa."""
    return await service.get_estadisticas_by_ruc(ruc)


@router.get("/cronologia/{nro_primigenia}", summary="Cronología completa de una resolución primigenia")
async def get_cronologia_primigenia(
    nro_primigenia: str,
    service: FlotaEmpresaService = Depends(get_service)
):
    """
    Obtener la línea de tiempo completa de una resolución primigenia,
    incluyendo todos los registros cronológicos (placa='-').
    """
    docs = await service.get_cronologia_by_primigenia(nro_primigenia)
    return {"nro_resolucion_primigenia": nro_primigenia, "total": len(docs), "data": docs}


@router.get("/{doc_id}", response_model=VehiculoEmpresaResponse, summary="Obtener registro por ID")
async def get_by_id(
    doc_id: str,
    service: FlotaEmpresaService = Depends(get_service)
):
    doc = await service.get_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Registro {doc_id} no encontrado")
    return doc


# ======================================================================
# ENDPOINTS DE ESCRITURA
# ======================================================================

@router.post("", response_model=VehiculoEmpresaResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=VehiculoEmpresaResponse, status_code=status.HTTP_201_CREATED)
async def create_vehiculo_empresa(
    data: VehiculoEmpresaCreate,
    service: FlotaEmpresaService = Depends(get_service)
):
    """Crear nuevo registro de vehículo en flota empresa."""
    if not data.ruc or len(data.ruc) < 8:
        raise HTTPException(status_code=400, detail="RUC inválido (mínimo 8 dígitos)")
    if not data.nro_resolucion_primigenia.strip():
        raise HTTPException(status_code=400, detail="El número de resolución primigenia es obligatorio")
    return await service.create(data)


@router.put("/{doc_id}", response_model=VehiculoEmpresaResponse)
async def update_vehiculo_empresa(
    doc_id: str,
    data: VehiculoEmpresaUpdate,
    service: FlotaEmpresaService = Depends(get_service)
):
    """Actualizar registro de vehículo en flota empresa."""
    doc = await service.update(doc_id, data)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Registro {doc_id} no encontrado")
    return doc


@router.post("/{doc_id}/observacion", response_model=VehiculoEmpresaResponse)
async def agregar_observacion(
    doc_id: str,
    req: AgregarObservacionRequest,
    service: FlotaEmpresaService = Depends(get_service)
):
    """
    Agregar una nueva observación al historial del vehículo.
    Las observaciones anteriores se preservan.
    """
    doc = await service.agregar_observacion(doc_id, req)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Registro {doc_id} no encontrado")
    return doc


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehiculo_empresa(
    doc_id: str,
    service: FlotaEmpresaService = Depends(get_service)
):
    """Borrado lógico de registro en flota empresa."""
    success = await service.soft_delete(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Registro {doc_id} no encontrado")


# ======================================================================
# ENDPOINTS DE CARGA MASIVA
# ======================================================================

@router.get("/carga-masiva/plantilla", summary="Descargar plantilla Excel")
async def descargar_plantilla(
    excel_service: FlotaEmpresaExcelService = Depends(get_excel_service)
):
    """Descargar plantilla Excel para carga masiva de flota empresa."""
    try:
        buffer = excel_service.generar_plantilla_excel()
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=plantilla_flota_empresa.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando plantilla: {str(e)}")


@router.post("/carga-masiva/validar", summary="Validar archivo sin guardar (preview)")
async def validar_archivo(
    archivo: UploadFile = File(..., description="Archivo Excel (.xlsx, .xls) o CSV"),
    n_filas: int = Query(15, ge=1, le=100, description="Número de filas a previsualizar"),
    excel_service: FlotaEmpresaExcelService = Depends(get_excel_service)
):
    """
    Validar el archivo y retornar preview de las primeras N filas
    sin guardar nada en la base de datos.
    """
    if not archivo.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="El archivo debe ser Excel (.xlsx, .xls) o CSV (.csv)")
    try:
        contenido = await archivo.read()
        buffer = BytesIO(contenido)
        preview = await excel_service.procesar_preview(buffer, n_filas=n_filas)
        validos = sum(1 for r in preview if r.get("es_valido"))
        return {
            "archivo": archivo.filename,
            "total_preview": len(preview),
            "validos": validos,
            "invalidos": len(preview) - validos,
            "preview": preview
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al validar archivo: {str(e)}")


@router.post("/carga-masiva/procesar", summary="Importar archivo Excel/CSV a base de datos")
async def procesar_carga_masiva(
    archivo: UploadFile = File(..., description="Archivo Excel (.xlsx, .xls) o CSV"),
    modo: str = Query("upsert", description="'upsert' (crear o actualizar) o 'crear' (solo nuevos)"),
    excel_service: FlotaEmpresaExcelService = Depends(get_excel_service)
):
    """
    Procesar carga masiva del archivo DB_VEHICULOS a la colección flota_empresa.
    Normaliza TUC, rutas, observaciones y estados automáticamente.
    """
    if not archivo.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="El archivo debe ser Excel (.xlsx, .xls) o CSV (.csv)")
    if modo not in ("upsert", "crear"):
        raise HTTPException(status_code=400, detail="Modo debe ser 'upsert' o 'crear'")
    try:
        contenido = await archivo.read()
        buffer = BytesIO(contenido)
        resultado = await excel_service.procesar_carga_masiva(buffer, modo=modo)
        return {
            "archivo": archivo.filename,
            "resultado": resultado,
            "mensaje": (
                f"Carga masiva completada: {resultado['creados']} creados, "
                f"{resultado['actualizados']} actualizados, "
                f"{resultado['omitidos']} omitidos de {resultado['total_filas']} filas."
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar archivo: {str(e)}")
