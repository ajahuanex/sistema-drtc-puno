from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Depends, status
from fastapi.responses import StreamingResponse
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
from app.services.tuc_document_service import TucDocumentService
from app.services.google_docs_service import GoogleDocsTucService

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

class CambiarAnularTucRequest(BaseModel):
    vehiculo_id: str
    placa: str
    tuc_actual: Optional[str] = None
    nuevo_tuc: str
    motivo: str
    usuario: Optional[str] = "OPERADOR"

@router.post("/cambiar-anular-tuc", summary="Editar y corregir TUC anulando la anterior con motivo")
async def cambiar_anular_tuc(payload: CambiarAnularTucRequest):
    try:
        resultado = await TucService.cambiar_anular_tuc(payload.model_dump(), usuario=payload.usuario or "OPERADOR")
        return resultado
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cambiar/anular TUC: {str(e)}")

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

# =========================================================================
# Endpoints de Generación de TUC desde Plantilla Oficial (DOCX / Google Docs)
# =========================================================================

@router.get("/generar-documento/{placa_o_id}", summary="Descargar documento Word (.docx) generado desde plantilla oficial")
async def generar_documento_tuc(placa_o_id: str):
    try:
        doc_info = await TucDocumentService.generar_docx_tuc(placa_o_id)
        return StreamingResponse(
            doc_info["buffer"],
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{doc_info["filename"]}"'
            }
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar documento Word: {str(e)}")

@router.get("/datos-impresion/{placa_o_id}", summary="Obtener datos consolidados y estructurados para vista previa de impresión")
async def obtener_datos_impresion(placa_o_id: str):
    try:
        datos = await TucDocumentService.get_datos_impresion(placa_o_id)
        return datos
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener datos de impresión: {str(e)}")

class TucPlantillaConfigRequest(BaseModel):
    plantilla_id: str
    carpeta_destino_id: Optional[str] = None
    auto_detectar_margen: Optional[bool] = True
    col_margen_izq: Optional[float] = 99.2
    col_codigo: Optional[float] = 28.0
    col_tramo: Optional[float] = 172.0
    col_frecuencia: Optional[float] = 45.0
    col_margen_der: Optional[float] = 105.0
    fuente_tamanio_codigo: Optional[float] = 6.5
    fuente_tamanio_tramo: Optional[float] = 6.0
    fuente_tamanio_frecuencia: Optional[float] = 5.2
    fuente_tamanio_dias: Optional[float] = 4.5

@router.get("/google-docs-status", summary="Verificar si las credenciales de Google Docs están configuradas y obtener la plantilla activa")
async def status_google_docs():
    return await GoogleDocsTucService.get_status()

@router.get("/configuracion-plantilla", summary="Obtener configuración dinámica de plantilla de Google Docs y dimensiones de columnas")
async def obtener_configuracion_plantilla():
    return await GoogleDocsTucService.obtener_configuracion()

@router.put("/configuracion-plantilla", summary="Actualizar configuración dinámica de plantilla de Google Docs y dimensiones de columnas")
async def guardar_configuracion_plantilla(config: TucPlantillaConfigRequest):
    try:
        return await GoogleDocsTucService.guardar_configuracion(config.dict(exclude_unset=True))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar configuración: {str(e)}")

@router.post("/generar-google-doc/{placa_o_id}", summary="Crear una copia en Google Docs en la nube y editarla")
async def generar_google_doc(placa_o_id: str):
    try:
        resultado = await GoogleDocsTucService.generar_copia_google_doc(placa_o_id)
        return resultado
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar copia en Google Docs: {str(e)}")