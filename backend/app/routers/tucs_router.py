from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Depends, status
from fastapi.responses import StreamingResponse, HTMLResponse
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
from app.services.notificacion_document_service import NotificacionDocumentService

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

def _generar_sheet_tuc_html(tuc_info: dict) -> str:
    d = tuc_info.get("datos", {})
    numero_tuc = tuc_info.get("numero_tuc", "S/N")
    placa = d.get("placa", "-")

    def clean_val(val):
        if val is None:
            return "-"
        s = str(val).strip()
        return s if s else "-"

    rutas_rows_html = ""
    rutas_detalle = d.get("rutas_detalle", [])
    if rutas_detalle:
        for r in rutas_detalle:
            cod = r.get("codigo", "")
            origen = r.get("origen", "")
            itin = r.get("itinerario", "")
            destino = r.get("destino", "")
            frec = r.get("frecuencia", "")
            tramo_parts = [p for p in [origen, itin, destino] if p]
            tramo = " - ".join(tramo_parts) if tramo_parts else r.get("tramo", "")
            frec_val = f" ({frec})" if frec else ""
            
            rutas_rows_html += f"""
            <tr>
                <td style="font-weight:bold; white-space:nowrap; padding-right:8px;">Ruta {cod}:</td>
                <td>{tramo}{frec_val}</td>
            </tr>"""
    else:
        rutas_rows_html = '<tr><td colspan="2" style="font-style:italic; color:#64748b;">SIN RUTAS ASIGNADAS</td></tr>'

    return f"""
    <!-- HOJA A4 PARA PLACA {placa} -->
    <div class="a4-sheet">
        <!-- ═══ 1. ANVERSO (CARA PRINCIPAL) ═══ -->
        <div class="anverso-box">
            <div class="section-tag">ANVERSO (CARA PRINCIPAL) — TUC N° {clean_val(numero_tuc)}</div>

            <div class="anverso-header">
                <!-- LOGO DRTC-P -->
                <div class="logo-box">
                    <svg width="105" height="65" viewBox="0 0 110 70" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 25 32 C 35 12, 65 12, 75 32 Z" fill="#eab308" />
                        <path d="M 20 37 C 35 22, 65 22, 80 37 C 65 29, 35 29, 20 37 Z" fill="#0284c7" />
                        <path d="M 15 42 C 35 27, 65 27, 85 42 C 65 34, 35 34, 15 42 Z" fill="#0369a1" />
                        <path d="M 10 47 C 35 32, 65 32, 90 47 C 65 39, 35 39, 10 47 Z" fill="#0c4a6e" />
                        <text x="50" y="64" text-anchor="middle" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-style="italic" font-size="16" fill="#1e293b" letter-spacing="-0.5">DRTC-P</text>
                    </svg>
                </div>

                <!-- TEXTO CABECERA ANVERSO -->
                <div class="header-info">
                    <div class="row-auto">
                        AUTORIZACIÓN &nbsp;&nbsp; DEL: <strong>{clean_val(d.get('fecha_del'))}</strong> &nbsp;&nbsp; AL: <strong>{clean_val(d.get('fecha_al'))}</strong>
                    </div>
                    <div class="row-rdr">
                        R.D.R. N° <strong>{clean_val(d.get('nro_resolucion_primigenia'))}</strong>-GRP/GRI/DRTC
                    </div>
                    <div class="row-empresa">
                        {clean_val(d.get('empresa'))}
                    </div>
                    <div class="row-ruc-partida">
                        RUC : <strong>{clean_val(d.get('ruc'))}</strong> &nbsp;&nbsp;&nbsp;&nbsp; <strong>Partida Registral:</strong> {clean_val(d.get('partida'))}
                    </div>
                </div>
            </div>

            <!-- FICHA TECNICA ANVERSO -->
            <div class="tech-grid">
                <div class="grid-row-2col">
                    <div class="col-left-wide">Placa : <strong>{clean_val(d.get('placa'))}</strong></div>
                    <div>Color : <strong>{clean_val(d.get('color'))}</strong></div>
                </div>
                <div class="grid-row-2col">
                    <div class="col-left-wide">Marca: <strong>{clean_val(d.get('marca'))}</strong></div>
                    <div>VIN/Serie : <strong>{clean_val(d.get('vin'))}</strong></div>
                </div>
                <div class="grid-row-4col">
                    <div>Fab./Mod. : <strong>{clean_val(d.get('anio'))}</strong></div>
                    <div>Asientos : <strong>{clean_val(d.get('asientos'))}</strong></div>
                    <div>Alto: <strong>{clean_val(d.get('alto'))}</strong></div>
                    <div>Peso Neto : <strong>{clean_val(d.get('peso_neto'))}</strong></div>
                </div>
                <div class="grid-row-4col">
                    <div>Categoría. : <strong>{clean_val(d.get('categoria'))}</strong></div>
                    <div>Ejes : <strong>{clean_val(d.get('ejes'))}</strong></div>
                    <div>Ancho: <strong>{clean_val(d.get('ancho'))}</strong></div>
                    <div>Carga Útil : <strong>{clean_val(d.get('carga_util'))}</strong></div>
                </div>
                <div class="grid-row-4col">
                    <div></div>
                    <div></div>
                    <div>Largo : <strong>{clean_val(d.get('largo'))}</strong></div>
                    <div>Peso Bruto : <strong>{clean_val(d.get('peso_bruto'))}</strong></div>
                </div>
            </div>
        </div>

        <!-- ═══ 2. REVERSO (SELLO / RUTAS) ═══ -->
        <div class="reverso-box">
            <div class="section-tag">REVERSO (SELLO / RUTAS AUTORIZADAS)</div>

            <table class="rutas-table">
                <tbody>
                    {rutas_rows_html}
                </tbody>
            </table>

            <div class="reverso-acto">
                R.D.R N° <strong>{clean_val(d.get('num_resolucion_acto'))}</strong>-GRP/GRI/DRTC ({clean_val(d.get('fecha_resolucion_acto'))}) ({clean_val(d.get('tipo_resolucion_acto'))})
            </div>
        </div>
    </div>
    """

def _build_tuc_page_wrapper(title: str, toolbar_label: str, sheets_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title}</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}

        body {{
            font-family: Arial, Helvetica, sans-serif;
            background: #0f172a;
            color: #000000;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
        }}

        /* TOOLBAR PANTALLA */
        .toolbar {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            max-width: 210mm;
            margin-bottom: 16px;
            padding: 10px 20px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 10px;
            backdrop-filter: blur(10px);
            color: #fff;
            font-size: 13px;
        }}
        .toolbar-title {{ font-weight: bold; display: flex; align-items: center; gap: 8px; }}
        .btn-print {{
            background: #0284c7;
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            font-size: 13px;
        }}
        .btn-print:hover {{ background: #0369a1; }}
        .btn-close {{
            background: rgba(255,255,255,0.15);
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            font-size: 13px;
            margin-left: 8px;
        }}
        .btn-close:hover {{ background: rgba(255,255,255,0.25); }}

        /* CONTENEDOR HOJA A4 */
        .sheets-container {{
            display: flex;
            flex-direction: column;
            gap: 20px;
        }}

        .a4-sheet {{
            width: 210mm;
            min-height: 297mm;
            background: #ffffff;
            padding: 20mm 18mm;
            box-shadow: 0 15px 45px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            gap: 22mm;
        }}

        .section-tag {{
            font-size: 9px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 3px;
            margin-bottom: 10px;
        }}

        /* ═══ ANVERSO ═══ */
        .anverso-box {{
            width: 100%;
            font-size: 11px;
            line-height: 1.45;
            color: #000;
        }}

        .anverso-header {{
            display: flex;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 10px;
        }}

        .logo-box {{
            width: 110px;
            flex-shrink: 0;
            text-align: center;
        }}

        .header-info {{
            flex: 1;
        }}

        .row-auto {{
            font-size: 11px;
            margin-bottom: 2px;
        }}

        .row-rdr {{
            font-size: 11px;
            margin-bottom: 3px;
        }}

        .row-empresa {{
            font-size: 11.5px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 3px;
        }}

        .row-ruc-partida {{
            font-size: 10.5px;
            margin-bottom: 8px;
        }}

        /* GRID ESPECIFICACIONES TECNICAS */
        .tech-grid {{
            width: 100%;
        }}

        .grid-row-2col {{
            display: flex;
            margin-bottom: 3px;
            font-size: 11px;
        }}
        .col-left-wide {{ width: 190px; }}
        .col-left-wide strong {{ font-size: 12.5px; font-weight: bold; }}

        .grid-row-4col {{
            display: grid;
            grid-template-columns: 140px 105px 110px 1fr;
            margin-bottom: 3px;
            font-size: 10.5px;
        }}

        /* ═══ REVERSO ═══ */
        .reverso-box {{
            width: 100%;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
        }}

        .rutas-table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 10px;
        }}

        .rutas-table td {{
            padding: 3px 2px;
            vertical-align: top;
        }}

        .reverso-acto {{
            font-size: 10px;
            margin-top: 8px;
        }}

        /* ═══ MEDIA PRINT ═══ */
        @media print {{
            @page {{
                size: A4 portrait;
                margin: 15mm 18mm;
            }}
            body {{ background: #fff !important; padding: 0 !important; }}
            .toolbar {{ display: none !important; }}
            .sheets-container {{ gap: 0 !important; }}
            .a4-sheet {{
                box-shadow: none !important;
                padding: 0 !important;
                width: 100% !important;
                page-break-after: always !important;
                break-after: page !important;
            }}
            .a4-sheet:last-child {{
                page-break-after: auto !important;
                break-after: auto !important;
            }}
            .section-tag {{ display: none !important; }}
        }}
    </style>
</head>
<body>

    <!-- TOOLBAR (Navegación en pantalla) -->
    <div class="toolbar">
        <div class="toolbar-title">
            <span>{toolbar_label}</span>
        </div>
        <div>
            <button class="btn-print" onclick="window.print()">Imprimir (Ctrl+P)</button>
            <button class="btn-close" onclick="window.close()">Cerrar</button>
        </div>
    </div>

    <!-- HOJAS A4 -->
    <div class="sheets-container">
        {sheets_html}
    </div>

    <script>
        window.focus();
    </script>
</body>
</html>"""

@router.get("/vista-impresion/{placa_o_id}", summary="Página HTML A4 completa del TUC con Anverso y Reverso (Ctrl+P)", response_class=HTMLResponse)
async def vista_impresion_tuc(placa_o_id: str):
    """
    Genera una página HTML en formato A4 con la TUC renderizada en 2 secciones (Anverso y Reverso),
    coincidiendo exactamente con la plantilla oficial de Google Docs de la DRTC Puno.
    Optimizada para impresión directa en hoja A4 (Ctrl+P).
    """
    try:
        tuc_info = await TucDocumentService.get_datos_impresion(placa_o_id)
        d = tuc_info.get("datos", {})
        numero_tuc = tuc_info.get("numero_tuc", "S/N")
        placa = d.get("placa", "-")

        sheet_html = _generar_sheet_tuc_html(tuc_info)
        page_html = _build_tuc_page_wrapper(
            title=f"TUC {placa} - N° {numero_tuc} | DRTC Puno",
            toolbar_label=f"Impresión TUC — Placa: <strong>{placa}</strong> (Formato Oficial A4)",
            sheets_html=sheet_html
        )
        return HTMLResponse(content=page_html)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar vista de impresión A4: {str(e)}")

@router.get("/vista-impresion-lote", summary="Página HTML para imprimir lote de TUCs en A4 (Ctrl+P)", response_class=HTMLResponse)
async def vista_impresion_lote(
    placas: str = Query(..., description="Placas separadas por coma (ej: ABC-123,XYZ-789)")
):
    """
    Genera un documento HTML imprimible en A4 que concatena múltiples TUCs (una página A4 por vehículo),
    permitiendo la impresión masiva en lote con un solo Ctrl+P.
    """
    try:
        lista_placas = [p.strip().upper() for p in placas.split(",") if p.strip()]
        if not lista_placas:
            raise HTTPException(status_code=400, detail="Debe proporcionar al menos una placa")

        sheets = []
        for p in lista_placas:
            try:
                tuc_info = await TucDocumentService.get_datos_impresion(p)
                sheets.append(_generar_sheet_tuc_html(tuc_info))
            except Exception as item_err:
                logger.warning(f"No se pudo cargar datos de TUC para placa {p}: {item_err}")

        if not sheets:
            raise HTTPException(status_code=404, detail="No se pudo obtener información de TUC para ninguna de las placas indicadas")

        total_sheets = len(sheets)
        page_html = _build_tuc_page_wrapper(
            title=f"Lote de TUCs ({total_sheets} vehículos) | DRTC Puno",
            toolbar_label=f"Impresión de Lote TUCs — <strong>{total_sheets}</strong> Tarjeta(s) A4 listas para imprimir",
            sheets_html="\n".join(sheets)
        )
        return HTMLResponse(content=page_html)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar impresión de lote: {str(e)}")

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

@router.get("/vista-impresion-notificacion/{placa_o_id}", summary="Página HTML A4 completa de Cédula de Notificación de Resolución", response_class=HTMLResponse)
async def vista_impresion_notificacion(placa_o_id: str):
    """
    Genera una página HTML en formato A4 con la Cédula de Notificación de Resolución renderizada,
    coincidiendo con la plantilla oficial de Google Docs (con tabla de vehículos involucrados).
    Optimizada para impresión directa en hoja A4 (Ctrl+P).
    """
    try:
        data = await NotificacionDocumentService.get_datos_notificacion_por_vehiculo(placa_o_id)
        html = NotificacionDocumentService.generar_html_notificacion(data)
        return HTMLResponse(content=html)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar vista de notificación: {str(e)}")

@router.post("/generar-google-doc-notificacion/{placa_o_id}", summary="Crear una copia en Google Docs en la nube de la Notificación")
async def generar_google_doc_notificacion(placa_o_id: str):
    try:
        resultado = await NotificacionDocumentService.generar_copia_google_doc(placa_o_id)
        return resultado
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar copia de Notificación en Google Docs: {str(e)}")