import re
import logging
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from bson import ObjectId

from app.dependencies.db import get_database

logger = logging.getLogger(__name__)

async def _get_db():
    database = await get_database()
    if database is None:
        raise RuntimeError("No se pudo conectar a la base de datos MongoDB")
    return database

def format_fecha(val: Any) -> str:
    if not val:
        return "-"
    if isinstance(val, (datetime, date)):
        return val.strftime("%d/%m/%Y")
    if isinstance(val, str):
        val_s = val.strip()
        try:
            dt = datetime.fromisoformat(val_s.replace("Z", "+00:00"))
            return dt.strftime("%d/%m/%Y")
        except Exception:
            m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", val_s)
            if m:
                return f"{m.group(3)}/{m.group(2)}/{m.group(1)}"
            return val_s
    return str(val)

def clean_num_resolucion(res_str: Optional[str]) -> str:
    if not res_str:
        return "-"
    s = res_str.strip().upper()
    if s.startswith("R-"):
        s = s[2:].strip()
    return s

class NotificacionDocumentService:

    @staticmethod
    async def get_datos_notificacion_por_vehiculo(placa_o_id: str) -> Dict[str, Any]:
        """
        Obtiene los datos para la cédula de notificación a partir de la placa o ID de un vehículo.
        """
        db = await _get_db()
        term = placa_o_id.strip()

        # 1. Buscar vehículo en flota_empresa
        query: Dict[str, Any] = {}
        if ObjectId.is_valid(term):
            query = {"_id": ObjectId(term)}
        else:
            query = {
                "$or": [
                    {"id": term},
                    {"placa": {"$regex": f"^{re.escape(term)}$", "$options": "i"}},
                    {"numero_tuc": {"$regex": f"^{re.escape(term)}$", "$options": "i"}}
                ]
            }

        vehiculo = await db.flota_empresa.find_one(query)
        if not vehiculo and "-" in term:
            placa_alt = term.replace("-", "")
            vehiculo = await db.flota_empresa.find_one({"placa": {"$regex": f"^{re.escape(placa_alt)}$", "$options": "i"}})

        if not vehiculo:
            raise ValueError(f"No se encontró el vehículo '{placa_o_id}' en la flota.")

        placa = (vehiculo.get("placa") or "").strip().upper()
        ruc = (vehiculo.get("ruc") or "").strip()
        razon_social = (vehiculo.get("razon_social") or "").strip()
        nro_hija_raw = (vehiculo.get("nro_resolucion_hija") or "").strip()
        nro_primigenia_raw = (vehiculo.get("nro_resolucion_primigenia") or "").strip()
        tipo_hija = (vehiculo.get("tipo_resolucion_hija") or "").strip()
        fecha_hija = vehiculo.get("fecha_resolucion_hija")

        # Buscar todos los vehículos pertenecientes a la misma empresa y resolución para la tabla de vehículos
        nro_res = nro_hija_raw or nro_primigenia_raw
        vehiculos_flota = []
        if ruc:
            query_flota = {"ruc": ruc}
            if nro_hija_raw:
                # Si el vehículo tiene resolución hija, listamos los que comparten esa resolución hija
                query_flota["nro_resolucion_hija"] = nro_hija_raw
            else:
                # Si no tiene resolución hija (ej. renovación pura), listamos los de la misma primigenia 
                # que TAMPOCO tengan resolución hija
                query_flota["nro_resolucion_primigenia"] = nro_primigenia_raw
                query_flota["$or"] = [
                    {"nro_resolucion_hija": {"$exists": False}},
                    {"nro_resolucion_hija": ""},
                    {"nro_resolucion_hija": None}
                ]
            
            query_flota["esta_activo"] = {"$ne": False}
            vehiculos_cursor = db.flota_empresa.find(query_flota)
            vehiculos_flota = await vehiculos_cursor.to_list(length=100)

        if not vehiculos_flota:
            vehiculos_flota = [vehiculo]

        lista_vehiculos_tabla = []
        for index, v in enumerate(vehiculos_flota[:20], 1):
            p = (v.get("placa") or "-").strip().upper()
            v_data = await db.vehiculos_data.find_one({"$or": [{"placa_actual": p}, {"placa": p}]})
            anio = str(v_data.get("anio_fabricacion") or v_data.get("anio_modelo") or "-") if v_data else "-"
            cat = (v_data.get("categoria") or "-").strip().upper() if v_data else "-"
            tuc_num = v.get("numero_tuc") or v.get("tuc") or "-"
            
            rutas_list = v.get("rutas", [])
            rutas_str = ",".join(rutas_list) if rutas_list else "-"

            lista_vehiculos_tabla.append({
                "item": index,
                "placa": p,
                "tuc": tuc_num,
                "anio": anio,
                "categoria": cat,
                "ruta": rutas_str,
                "estado": v.get("estado") or "HABILITADO"
            })

        fecha_res_str = format_fecha(fecha_hija) if fecha_hija else "-"
        if fecha_res_str == "-" and nro_primigenia_raw:
            norm_res = clean_num_resolucion(nro_primigenia_raw)
            res_p = await db.resoluciones_primigenias.find_one({"nro_resolucion": {"$regex": f"{re.escape(norm_res)}$", "$options": "i"}})
            if res_p:
                fecha_res_str = format_fecha(res_p.get("fecha_emision") or res_p.get("fecha_resolucion"))

        tipo_hija_str = (vehiculo.get("tipo_resolucion_hija") or "").strip().upper()
        map_tipos = {
            "I": "INCREMENTO",
            "S": "SUSTITUCION",
            "M": "MODIFICACION",
            "O": "OTROS",
            "C": "CANCELACION",
            "D": "DUPLICADO"
        }
        if tipo_hija_str in map_tipos:
            tipo_hija_str = map_tipos[tipo_hija_str]

        if not tipo_hija_str:
            motivo_res = "RENOVACION"
        elif "DUPLICADO" in tipo_hija_str:
            exp_hija = vehiculo.get("num_expediente") or "-"
            f_exp_hija = vehiculo.get("fecha_expediente")
            f_exp_str = format_fecha(f_exp_hija) if f_exp_hija else "-"
            motivo_res = f"DUPLICADO ({exp_hija} - {f_exp_str})"
        else:
            motivo_res = tipo_hija_str

        return {
            "numRes": clean_num_resolucion(nro_res),
            "fechaRes": fecha_res_str,
            "motivoRes": motivo_res,
            "razonSocial": razon_social or "EMPRESA DE TRANSPORTES",
            "ruc": ruc or "-",
            "vehiculos": lista_vehiculos_tabla,
            "update": datetime.now().strftime("%d/%m/%Y")
        }

    @staticmethod
    def generar_html_notificacion(data: Dict[str, Any]) -> str:
        """
        Genera la página HTML en formato A4 para la Cédula de Notificación,
        coincidiendo exactamente con la plantilla oficial de Google Docs.
        """
        num_res = data.get("numRes", "-")
        fecha_res = data.get("fechaRes", "-")
        motivo_res = data.get("motivoRes", "-")
        razon_social = data.get("razonSocial", "-")
        ruc = data.get("ruc", "-")
        update_date = data.get("update", datetime.now().strftime("%d/%m/%Y"))
        vehiculos = data.get("vehiculos", [])

        tabla_rows_html = ""
        if vehiculos:
            for v in vehiculos:
                tabla_rows_html += f"""
                <tr>
                    <td style="text-align:center; font-weight:bold;">{v.get('item')}</td>
                    <td style="font-weight:bold; font-family:'Roboto Mono', monospace;">{v.get('placa')}</td>
                    <td>{v.get('marca')}</td>
                    <td style="text-align:center;">{v.get('anio')}</td>
                    <td style="font-family:'Roboto Mono', monospace;">{v.get('vin')}</td>
                    <td style="text-align:center;">{v.get('categoria')}</td>
                    <td style="text-align:center; font-family:'Roboto Mono', monospace; font-weight:bold;">{v.get('tuc')}</td>
                </tr>"""
        else:
            tabla_rows_html = '<tr><td colspan="7" style="text-align:center; font-style:italic; color:#64748b;">SIN VEHÍCULOS REGISTRADOS</td></tr>'

        html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>NOTIFICACIÓN - R.D.R. N° {num_res} | DRTC Puno</title>
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
        .toolbar-title {{ font-weight: bold; }}
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

        /* HOJA A4 */
        .a4-sheet {{
            width: 210mm;
            min-height: 297mm;
            background: #ffffff;
            padding: 22mm 20mm;
            box-shadow: 0 15px 45px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
        }}

        /* LEMA AÑO */
        .lema-header {{
            text-align: center;
            font-size: 11px;
            font-style: italic;
            margin-bottom: 25px;
        }}

        /* TITULO NOTIFICACION */
        .doc-title {{
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }}

        .res-subtitle {{
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 4px;
        }}

        .res-motivo {{
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 25px;
            text-transform: uppercase;
        }}

        /* DATOS EMPRESA */
        .empresa-box {{
            font-size: 12px;
            line-height: 1.6;
            margin-bottom: 20px;
        }}
        .empresa-box strong {{ font-weight: bold; }}

        .divider-line {{
            border-bottom: 1.5px solid #000;
            margin: 15px 0 20px;
        }}

        /* RECEPTOR FORMULARIO */
        .receptor-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 25px;
            font-size: 11px;
            margin-bottom: 25px;
        }}

        .form-field {{
            display: flex;
            align-items: baseline;
            gap: 6px;
        }}
        .form-field .field-label {{
            font-weight: bold;
            white-space: nowrap;
        }}
        .form-field .field-line {{
            flex: 1;
            border-bottom: 1px dashed #475569;
            min-height: 16px;
        }}

        /* TABLA DE VEHICULOS INVOLUCRADOS */
        .tablita-title {{
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 6px;
            text-transform: uppercase;
        }}

        .tablita-vehiculos {{
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-bottom: 25px;
        }}

        .tablita-vehiculos th {{
            border: 1px solid #000;
            background: #f1f5f9;
            padding: 6px 4px;
            font-weight: bold;
            text-align: center;
        }}

        .tablita-vehiculos td {{
            border: 1px solid #000;
            padding: 5px 4px;
        }}

        /* PIE DE ELABORACION */
        .notif-footer {{
            margin-top: auto;
            font-size: 11px;
            font-weight: bold;
            padding-top: 15px;
        }}

        @media print {{
            @page {{
                size: A4 portrait;
                margin: 15mm 18mm;
            }}
            body {{ background: #fff !important; padding: 0 !important; }}
            .toolbar {{ display: none !important; }}
            .a4-sheet {{ box-shadow: none !important; padding: 0 !important; width: 100% !important; }}
            .tablita-vehiculos th {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}
        }}
    </style>
</head>
<body>

    <!-- TOOLBAR (Navegación) -->
    <div class="toolbar">
        <div class="toolbar-title">
            Cédula de Notificación — R.D.R. N° {num_res} (Formato Oficial A4)
        </div>
        <div>
            <button class="btn-print" onclick="window.print()">Imprimir Cédula (Ctrl+P)</button>
            <button class="btn-close" onclick="window.close()">Cerrar</button>
        </div>
    </div>

    <!-- HOJA A4 -->
    <div class="a4-sheet">

        <div class="lema-header">“Año del Fortalecimiento de la Soberanía Nacional”</div>

        <div class="doc-title">NOTIFICACIÓN</div>
        <div class="res-subtitle">RESOLUCIÓN DIRECTORAL REGIONAL N° {num_res}-GRP/GRI/DRTC({fecha_res})</div>
        <div class="res-motivo">({motivo_res})</div>

        <!-- DATOS EMPRESA -->
        <div class="empresa-box">
            <div><strong>Razón Social :</strong> {razon_social}</div>
            <div><strong>RUC :</strong> {ruc}</div>
        </div>

        <div class="divider-line"></div>

        <!-- FORMULARIO RECEPCION NOTIFICACION -->
        <div class="receptor-grid">
            <div class="form-field" style="grid-column: 1 / -1;">
                <span class="field-label">Nombres y Apellidos:</span>
                <span class="field-line"></span>
            </div>
            <div class="form-field">
                <span class="field-label">Firma:</span>
                <span class="field-line"></span>
            </div>
            <div class="form-field">
                <span class="field-label">Cargo:</span>
                <span class="field-line"></span>
            </div>
            <div class="form-field">
                <span class="field-label">Teléfono:</span>
                <span class="field-line"></span>
            </div>
            <div class="form-field">
                <span class="field-label">Fecha:</span>
                <span class="field-line"></span>
            </div>
            <div class="form-field" style="grid-column: 1 / -1;">
                <span class="field-label">DNI:</span>
                <span class="field-line"></span>
            </div>
        </div>

        <div class="divider-line"></div>

        <!-- TABLA VEHICULOS {{tablita}} -->
        <div class="tablita-title">Vehículos Involucrados en el Trámite:</div>
        <table class="tablita-vehiculos">
            <thead>
                <tr>
                    <th style="width: 30px;">N°</th>
                    <th style="width: 80px;">Placa</th>
                    <th>Marca</th>
                    <th style="width: 60px;">Año</th>
                    <th>VIN / Serie</th>
                    <th style="width: 60px;">Cat.</th>
                    <th style="width: 90px;">N° TUC</th>
                </tr>
            </thead>
            <tbody>
                {tabla_rows_html}
            </tbody>
        </table>

        <!-- FOOTER ELABORACION TUC -->
        <div class="notif-footer">
            Fecha de elaboración de TUC: ”{update_date}”
        </div>

    </div>

    <script>
        window.focus();
    </script>
</body>
</html>"""
        return html

    @staticmethod
    async def generar_copia_google_doc(placa_o_id: str) -> Dict[str, Any]:
        """
        Clona la plantilla oficial de Google Docs de Notificación y reemplaza las etiquetas.
        Plantilla ID: 1twz-0Hhk5S1EurHty8Dk0haydhiaNVXT9T8bWOtH4ow
        Carpeta Destino ID: 1E6ZRAdq6xTUTd5RVddrOt9gzTKDUA2bvUn2oq3mEv-k
        """
        import os
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        from datetime import datetime

        CREDENTIALS_PATHS = [
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config", "credentials.json"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "credentials.json"),
            os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
        ]
        
        creds_path = None
        for path in CREDENTIALS_PATHS:
            if path and os.path.exists(path):
                creds_path = path
                break
                
        if not creds_path:
            return {
                "exito": False,
                "mensaje": "No se encontraron credenciales de Google API en backend/config/credentials.json.",
                "url": None
            }

        try:
            scopes = [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/documents'
            ]
            creds = service_account.Credentials.from_service_account_file(creds_path, scopes=scopes)
            drive_service = build('drive', 'v3', credentials=creds)
            docs_service = build('docs', 'v1', credentials=creds)

            # Obtener datos de la notificación
            data = await NotificacionDocumentService.get_datos_notificacion_por_vehiculo(placa_o_id)
            vehiculos = data.get("vehiculos", [])
            
            plantilla_id = "1twz-0Hhk5S1EurHty8Dk0haydhiaNVXT9T8bWOtH4ow"
            # Carpeta específica para Notificaciones proveída por el usuario
            carpeta_destino_id = "1iALu3DbxG0N7HaH-0V00pSjHvPJv9EKd"
            
            placa_ref = vehiculos[0]["placa"] if vehiculos else placa_o_id
            nombre_doc = f"Notificacion_RDR_{data['numRes']}_{placa_ref}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            # 1. Clonar la plantilla
            copy_metadata = {
                'name': nombre_doc,
                'parents': [carpeta_destino_id]
            }

            copia = drive_service.files().copy(
                fileId=plantilla_id,
                body=copy_metadata,
                supportsAllDrives=True
            ).execute()

            nuevo_doc_id = copia.get('id')
            logger.info(f"Copia de Notificación creada: {nuevo_doc_id}")

            # 2. Reemplazar marcadores simples
            placeholders = {
                "{{numRes}}": data.get("numRes", "-"),
                "{{fechaRes}}": data.get("fechaRes", "-"),
                "{{motivoRes}}": data.get("motivoRes", "-"),
                "{{razonSocial}}": data.get("razonSocial", "-"),
                "{{ruc}}": data.get("ruc", "-"),
                "{{update}}": data.get("update", "-")
            }

            requests = []
            for k, v in placeholders.items():
                requests.append({
                    'replaceAllText': {
                        'containsText': {
                            'text': k,
                            'matchCase': True
                        },
                        'replaceText': str(v)
                    }
                })

            docs_service.documents().batchUpdate(
                documentId=nuevo_doc_id,
                body={'requests': requests}
            ).execute()

            # 3. Insertar Tabla de Vehículos
            try:
                doc_actual = docs_service.documents().get(documentId=nuevo_doc_id).execute()
                content_list = doc_actual.get('body', {}).get('content', [])
                
                t_start = None
                t_end = None
                for idx_c, elem in enumerate(content_list):
                    if 'paragraph' in elem:
                        p_txt = ''.join([el.get('textRun', {}).get('content', '') for el in elem['paragraph'].get('elements', [])])
                        if '{{tablita}}' in p_txt or '{{TABLA_VEHICULOS}}' in p_txt:
                            t_start = elem.get('startIndex')
                            t_end = elem.get('endIndex')
                            break

                if t_start is not None and t_end is not None:
                    num_rows = len(vehiculos) + 1 if vehiculos else 2
                    
                    reqs_table_insert = [
                        {'deleteContentRange': {'range': {'startIndex': t_start, 'endIndex': t_end - 1}}},
                        {'insertTable': {'rows': num_rows, 'columns': 6, 'location': {'index': t_start}}}
                    ]
                    docs_service.documents().batchUpdate(documentId=nuevo_doc_id, body={'requests': reqs_table_insert}).execute()

                    # Llenar la tabla
                    doc_after_tbl = docs_service.documents().get(documentId=nuevo_doc_id).execute()
                    table_elem = None
                    for elem in doc_after_tbl.get('body', {}).get('content', []):
                        if 'table' in elem and elem.get('startIndex') >= t_start:
                            table_elem = elem
                            break

                    if table_elem:
                        t_loc = table_elem['startIndex']
                        table_obj = table_elem['table']
                        
                        # Anchos de columna fijos sugeridos
                        widths = [45.0, 80.0, 95.0, 50.0, 80.0, 105.0]
                        style_reqs = []
                        for c_idx, w in enumerate(widths):
                            style_reqs.append({
                                'updateTableColumnProperties': {
                                    'tableStartLocation': {'index': t_loc},
                                    'columnIndices': [c_idx],
                                    'tableColumnProperties': {
                                        'widthType': 'FIXED_WIDTH',
                                        'width': {'magnitude': w, 'unit': 'PT'}
                                    },
                                    'fields': 'widthType,width'
                                }
                            })
                        docs_service.documents().batchUpdate(documentId=nuevo_doc_id, body={'requests': style_reqs}).execute()

                        # Insertar Cabeceras y Datos
                        doc_for_text = docs_service.documents().get(documentId=nuevo_doc_id).execute()
                        for elem in doc_for_text.get('body', {}).get('content', []):
                            if 'table' in elem and elem.get('startIndex') == t_loc:
                                table_obj = elem['table']
                                break

                        insertions = []
                        headers = ["ITEM", "PLACA", "NUMERO TUC", "AÑO", "CATEGORIA", "RUTA"]
                        
                        # Fila 0: Cabeceras
                        row_0 = table_obj['tableRows'][0]
                        for c_idx, header in enumerate(headers):
                            cell_idx = row_0['tableCells'][c_idx]['startIndex'] + 1
                            insertions.append({'index': cell_idx, 'text': header})
                            
                        # Filas datos
                        if vehiculos:
                            for r_idx, v in enumerate(vehiculos):
                                if r_idx + 1 >= len(table_obj['tableRows']):
                                    break
                                row = table_obj['tableRows'][r_idx + 1]
                                
                                val_item = str(v.get('item', ''))
                                val_placa = str(v.get('placa', ''))
                                val_tuc = str(v.get('tuc', ''))
                                val_anio = str(v.get('anio', ''))
                                val_cat = str(v.get('categoria', ''))
                                val_ruta = str(v.get('ruta', ''))
                                
                                vals = [val_item, val_placa, val_tuc, val_anio, val_cat, val_ruta]
                                for c_idx, val in enumerate(vals):
                                    cell_idx = row['tableCells'][c_idx]['startIndex'] + 1
                                    insertions.append({'index': cell_idx, 'text': val})
                        else:
                            row_1 = table_obj['tableRows'][1]
                            cell_idx = row_1['tableCells'][0]['startIndex'] + 1
                            insertions.append({'index': cell_idx, 'text': 'SIN VEHÍCULOS REGISTRADOS'})

                        insertions.sort(key=lambda x: x['index'], reverse=True)
                        insert_reqs = [{'insertText': {'location': {'index': ins['index']}, 'text': ins['text']}} for ins in insertions]
                        docs_service.documents().batchUpdate(documentId=nuevo_doc_id, body={'requests': insert_reqs}).execute()
                        
                        # Aplicar estilo de texto de la tabla (fuente más pequeña)
                        doc_for_styles = docs_service.documents().get(documentId=nuevo_doc_id).execute()
                        for elem in doc_for_styles.get('body', {}).get('content', []):
                            if 'table' in elem and elem.get('startIndex') == t_loc:
                                table_obj = elem['table']
                                break
                        
                        text_style_reqs = []
                        for r_idx, row in enumerate(table_obj['tableRows']):
                            for c_idx, cell in enumerate(row['tableCells']):
                                for c_el in cell.get('content', []):
                                    if 'paragraph' in c_el:
                                        p_s = c_el['startIndex']
                                        p_e = c_el['endIndex']
                                        
                                        text_style_reqs.append({
                                            'updateTextStyle': {
                                                'range': {'startIndex': p_s, 'endIndex': p_e - 1 if p_e > p_s + 1 else p_e},
                                                'textStyle': {
                                                    'fontSize': {'magnitude': 8.0, 'unit': 'PT'},
                                                    'bold': True if r_idx == 0 or c_idx in [0, 1, 6] else False
                                                },
                                                'fields': 'fontSize,bold'
                                            }
                                        })
                                        text_style_reqs.append({
                                            'updateParagraphStyle': {
                                                'range': {'startIndex': p_s, 'endIndex': p_e},
                                                'paragraphStyle': {
                                                    'alignment': 'CENTER' if c_idx in [0, 1, 3, 5, 6] else 'START'
                                                },
                                                'fields': 'alignment'
                                            }
                                        })

                        if text_style_reqs:
                            docs_service.documents().batchUpdate(documentId=nuevo_doc_id, body={'requests': text_style_reqs}).execute()

            except Exception as table_err:
                logger.warning(f"Error al construir tabla en Google Doc de notificación: {table_err}")

            google_doc_url = f"https://docs.google.com/document/d/{nuevo_doc_id}/edit"

            # 4. Intentar configurar permiso de lectura/escritura
            try:
                drive_service.permissions().create(
                    fileId=nuevo_doc_id,
                    body={'type': 'anyone', 'role': 'writer'},
                    supportsAllDrives=True
                ).execute()
            except Exception as perm_err:
                logger.info(f"Nota permisos drive (puede estar restringido por dominio): {perm_err}")

            return {
                "exito": True,
                "mensaje": "Notificación en Google Docs generada exitosamente.",
                "nuevo_doc_id": nuevo_doc_id,
                "url": google_doc_url,
                "placa": placa_ref
            }

        except Exception as e:
            logger.error(f"Error al generar Notificación en Google Docs: {e}", exc_info=True)
            return {
                "exito": False,
                "mensaje": f"Error al interactuar con Google Docs API: {str(e)}",
                "url": None
            }
