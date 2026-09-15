from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Depends, status
from pydantic import BaseModel

from app.models.tuc import (
    Tuc,
    TucCreateRequest,
    TucDuplicadoRequest,
    TucKardexStock,
    TipoEmisionTuc,
    EstadoTuc,
    TucFiltros,
    TucVerificacionPublica
)
from app.services.tuc_service import TucService

router = APIRouter(prefix="/tucs", tags=["tucs"])

@router.get("/estadisticas", summary="Estadísticas generales para el Dashboard de TUCs")
async def obtener_estadisticas_tuc():
    return await TucService.obtener_estadisticas()

@router.get("/", summary="Catálogo general de TUCs con filtros y paginación")
async def listar_tucs(
    q: Optional[str] = Query(None, description="Búsqueda global por N° TUC, Placa, RUC, Razón Social o Resolución"),
    nroTuc: Optional[str] = None,
    placa: Optional[str] = None,
    ruc: Optional[str] = None,
    razonSocial: Optional[str] = None,
    nroResolucion: Optional[str] = None,
    tipoEmision: Optional[TipoEmisionTuc] = None,
    estado: Optional[EstadoTuc] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
):
    filtros = TucFiltros(
        q=q,
        nroTuc=nroTuc,
        placa=placa,
        ruc=ruc,
        razonSocial=razonSocial,
        nroResolucion=nroResolucion,
        tipoEmision=tipoEmision,
        estado=estado
    )
    return await TucService.listar_tucs(filtros, skip=skip, limit=limit)

@router.post("/sincronizar-flota", summary="Importar / Sincronizar automáticamente TUCs registradas en Flota por Empresa")
async def sincronizar_desde_flota_empresa():
    try:
        resultado = await TucService.sincronizar_desde_flota_empresa()
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al sincronizar TUCs desde Flota por Empresa: {str(e)}")

@router.get("/verificar/{hash_o_codigo}", summary="Portal público de verificación QR e inspección en campo (Sin Auth)")
async def verificar_tuc_publico(hash_o_codigo: str):
    try:
        return await TucService.obtener_verificacion_publica(hash_o_codigo)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al verificar TUC: {str(e)}")

@router.get("/verificar-unicidad/{nro_tuc}", summary="Validar si un N° de TUC ya existe antes de registrar")
async def verificar_unicidad(nro_tuc: str, excluir_id: Optional[str] = None):
    disponible = await TucService.verificar_unicidad_nro_tuc(nro_tuc, excluir_id)
    return {"nroTuc": nro_tuc, "disponible": disponible, "mensaje": "Número disponible" if disponible else "Número de TUC ya registrado"}

@router.get("/siguiente-numero", summary="Generar el siguiente número correlativo para E-TUC")
async def siguiente_numero(tipo: TipoEmisionTuc = TipoEmisionTuc.ELECTRONICA):
    siguiente = await TucService.generar_siguiente_nro_tuc(tipo)
    return {"siguienteNroTuc": siguiente}

@router.post("/emitir", summary="Emitir una nueva TUC (Electrónica o Física)")
async def emitir_tuc(payload: TucCreateRequest):
    try:
        tuc_creada = await TucService.emitir_tuc(payload)
        return tuc_creada
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al emitir TUC: {str(e)}")

@router.post("/duplicado", summary="Emitir duplicado de TUC por pérdida o deterioro")
async def emitir_duplicado(payload: TucDuplicadoRequest):
    try:
        nueva_tuc = await TucService.registrar_duplicado(payload)
        return nueva_tuc
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar duplicado: {str(e)}")

@router.post("/{id}/anular", summary="Anular una TUC por causal administrativa")
async def anular_tuc(id: str, motivo: str = Query(...)):
    exito = await TucService.anular_tuc(id, motivo=motivo, nuevo_estado=EstadoTuc.ANULADA)
    if not exito:
        raise HTTPException(status_code=404, detail="No se encontró la TUC o no pudo ser modificada.")
    return {"mensaje": "TUC anulada exitosamente."}

@router.post("/carga-masiva-excel", summary="Importar TUCs históricas desde archivo Excel")
async def carga_masiva_excel(file: UploadFile = File(...)):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="El archivo debe ser un documento Excel (.xlsx o .xls).")
    
    contenido = await file.read()
    try:
        resultado = await TucService.procesar_excel_carga_masiva(contenido)
        return resultado
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar carga masiva: {str(e)}")

# Endpoints Kárdex
@router.get("/kardex/lotes", summary="Listar lotes de especies valoradas del Kárdex de TUCs Físicas")
async def listar_lotes_kardex():
    from app.dependencies.db import db
    cursor = db.tuc_kardex.find({}).sort("fechaRecepcion", -1)
    lotes = await cursor.to_list(100)
    for l in lotes:
        l["_id"] = str(l["_id"])
        l["id"] = str(l["_id"])
    return lotes

@router.post("/kardex/lotes", summary="Registrar nuevo lote de TUCs Físicas impresas en Kárdex")
async def registrar_lote_kardex(payload: TucKardexStock):
    from app.dependencies.db import db
    doc = payload.model_dump(by_alias=True, exclude={"id"})
    doc["disponibles"] = doc["totalImpresos"]
    doc["asignados"] = 0
    doc["anulados"] = 0
    res = await db.tuc_kardex.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    doc["id"] = str(res.inserted_id)
    return doc