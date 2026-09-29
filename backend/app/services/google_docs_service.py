import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from app.services.tuc_document_service import TucDocumentService

logger = logging.getLogger(__name__)

OFFICIAL_TEMPLATE_DOC_ID = "1crxKiKG74B4zeTbNNByvoEWr_1IRsQ5qkj1a_tNs8lo"
DEFAULT_OUTPUT_FOLDER_ID = "1Yy6q47onyA7flX5MmI8EKuK61YtzGGiA"
CREDENTIALS_PATHS = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config", "credentials.json"),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "credentials.json"),
    os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
]

DEFAULT_CONFIG: Dict[str, Any] = {
    "plantilla_id": OFFICIAL_TEMPLATE_DOC_ID,
    "carpeta_destino_id": DEFAULT_OUTPUT_FOLDER_ID,
    "auto_detectar_margen": True,
    "offset_expansion_margen": 18.0,
    "col_margen_izq": 80.0,
    "col_codigo": 38.0,
    "col_tramo": 196.0,
    "col_frecuencia": 50.0,
    "col_margen_der": 85.0,
    "fuente_tamanio_codigo": 6.5,
    "fuente_tamanio_tramo": 6.0,
    "fuente_tamanio_frecuencia": 5.2,
    "fuente_tamanio_dias": 4.5,
}

class GoogleDocsTucService:

    @staticmethod
    def get_credentials_path() -> Optional[str]:
        for path in CREDENTIALS_PATHS:
            if path and os.path.exists(path):
                return path
        return None

    @staticmethod
    async def obtener_configuracion() -> Dict[str, Any]:
        """Obtiene la configuración activa de plantilla de Google Docs desde la base de datos"""
        try:
            from app.dependencies.db import get_database
            db = await get_database()
            if db is not None:
                doc = await db.configuracion_sistema.find_one({"clave": "tuc_plantilla_google_docs"})
                if doc:
                    cfg = dict(DEFAULT_CONFIG)
                    for k, v in doc.items():
                        if k not in ["_id", "clave"]:
                            cfg[k] = v
                    return cfg
        except Exception as e:
            logger.warning(f"Error al leer configuración de plantilla de la BD: {e}")
        return dict(DEFAULT_CONFIG)

    @staticmethod
    async def guardar_configuracion(nuevos_valores: Dict[str, Any]) -> Dict[str, Any]:
        """Guarda los parámetros de la plantilla (ID, anchos de columnas, márgenes) en la BD"""
        try:
            from app.dependencies.db import get_database
            db = await get_database()
            if db is not None:
                update_data = {k: v for k, v in nuevos_valores.items() if k not in ["_id", "clave"]}
                update_data["fecha_actualizacion"] = datetime.utcnow()
                await db.configuracion_sistema.update_one(
                    {"clave": "tuc_plantilla_google_docs"},
                    {"$set": update_data},
                    upsert=True
                )
                logger.info(f"Configuración de plantilla TUC actualizada: {update_data}")
                return await GoogleDocsTucService.obtener_configuracion()
        except Exception as e:
            logger.error(f"Error al guardar configuración de plantilla en la BD: {e}")
            raise RuntimeError(f"Error al guardar configuración: {str(e)}")
        return dict(DEFAULT_CONFIG)

    @staticmethod
    async def get_status() -> Dict[str, Any]:
        creds_path = GoogleDocsTucService.get_credentials_path()
        config = await GoogleDocsTucService.obtener_configuracion()
        plantilla_id = config.get("plantilla_id") or OFFICIAL_TEMPLATE_DOC_ID
        if creds_path:
            return {
                "disponible": True,
                "mensaje": "Credenciales de Google API detectadas y listas para usar.",
                "credentials_file": os.path.basename(creds_path),
                "plantilla_id": plantilla_id,
                "configuracion": config
            }
        else:
            return {
                "disponible": False,
                "mensaje": "Para generar copias automáticas en la nube de Google Docs, coloque el archivo 'credentials.json' (Service Account o OAuth2) en backend/config/.",
                "credentials_file": None,
                "plantilla_id": plantilla_id,
                "configuracion": config
            }

    @staticmethod
    async def generar_copia_google_doc(placa_o_id: str, carpeta_destino_id: Optional[str] = DEFAULT_OUTPUT_FOLDER_ID) -> Dict[str, Any]:
        """
        Clona la plantilla oficial de Google Docs y reemplaza las etiquetas con la Google Docs API.
        """
        creds_path = GoogleDocsTucService.get_credentials_path()
        if not creds_path:
            return {
                "exito": False,
                "disponible": False,
                "mensaje": "No se encontraron credenciales de Google API en backend/config/credentials.json. Mientras tanto, utilice la opción de Descarga en Word (.docx) o Vista de Impresión directa del servidor.",
                "url": None
            }

        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build

            scopes = [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/documents'
            ]
            creds = service_account.Credentials.from_service_account_file(creds_path, scopes=scopes)

            # Obtener datos del vehículo y los 25 placeholders
            tuc_info = await TucDocumentService.get_tuc_data(placa_o_id)
            placeholders = tuc_info["placeholders"]
            placa = tuc_info["placa"]

            drive_service = build('drive', 'v3', credentials=creds)
            docs_service = build('docs', 'v1', credentials=creds)

            # Cargar configuración activa de la plantilla y márgenes
            config = await GoogleDocsTucService.obtener_configuracion()
            plantilla_id_activa = config.get("plantilla_id") or OFFICIAL_TEMPLATE_DOC_ID
            carpeta_activa = carpeta_destino_id or config.get("carpeta_destino_id") or DEFAULT_OUTPUT_FOLDER_ID

            # 1. Clonar la plantilla directamente en la carpeta destino del Shared Drive
            copy_metadata = {
                'name': f"TUC_{placa}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            }
            if carpeta_activa:
                copy_metadata['parents'] = [carpeta_activa]

            copia = drive_service.files().copy(
                fileId=plantilla_id_activa,
                body=copy_metadata,
                supportsAllDrives=True
            ).execute()

            nuevo_doc_id = copia.get('id')
            logger.info(f"Copia creada: {nuevo_doc_id} usando plantilla {plantilla_id_activa}")

            rutas_detalle = tuc_info.get("datos_estructurados", {}).get("rutas_detalle", [])
            es_fila_en_blanco = tuc_info.get("datos_estructurados", {}).get("es_fila_en_blanco", False)

            # 2. Reemplazar los marcadores de texto plano (excluyendo {{TABLA_RUTAS}} para manejarlo como tabla)
            requests = []

            # Si es renovación o sin trámite modificatorio, la fila de la resolución del reverso va toda en blanco
            if es_fila_en_blanco:
                requests.append({
                    'replaceAllText': {
                        'containsText': {
                            'text': 'R.D.R N° {{NUM_RESOLUCION}}-GRP/GRI/DRTC ({{FECHA_RES}}) ({{TIPO_RES}})',
                            'matchCase': False
                        },
                        'replaceText': ' '
                    }
                })
                requests.append({
                    'replaceAllText': {
                        'containsText': {
                            'text': 'R.D.R. N° {{NUM_RESOLUCION}}-GRP/GRI/DRTC ({{FECHA_RES}}) ({{TIPO_RES}})',
                            'matchCase': False
                        },
                        'replaceText': ' '
                    }
                })

            for k, v in placeholders.items():
                if k == "{{TABLA_RUTAS}}":
                    continue
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

            # 2.1 Construir la Tabla de Rutas estructurada (5 columnas dinámicas: margen izq, código ruta, tramo, frecuencia, margen der)
            try:
                import re
                doc_actual = docs_service.documents().get(documentId=nuevo_doc_id).execute()
                
                # Localizar el marcador {{TABLA_RUTAS}} y detectar si la plantilla tiene línea de sangría/centrado
                t_start = None
                t_end = None
                detected_indent_start = None
                detected_indent_end = None
                content_list = doc_actual.get('body', {}).get('content', [])

                for idx_c, elem in enumerate(content_list):
                    if 'paragraph' in elem:
                        p_txt = ''.join([el.get('textRun', {}).get('content', '') for el in elem['paragraph'].get('elements', [])])
                        if '{{TABLA_RUTAS}}' in p_txt or 'TABLA_RUTAS' in p_txt:
                            t_start = elem.get('startIndex')
                            t_end = elem.get('endIndex')
                            # Explorar elementos siguientes en busca de regla horizontal o párrafo con sangría
                            for next_elem in content_list[idx_c+1:idx_c+5]:
                                if 'paragraph' in next_elem:
                                    p_style = next_elem['paragraph'].get('paragraphStyle', {})
                                    ind_s = p_style.get('indentStart', {}).get('magnitude')
                                    ind_e = p_style.get('indentEnd', {}).get('magnitude')
                                    if ind_s is not None and ind_s > 0:
                                        detected_indent_start = ind_s
                                        detected_indent_end = ind_e
                                        break
                            break

                if t_start is not None and t_end is not None:
                    num_rows = len(rutas_detalle) if rutas_detalle else 1
                    
                    # Eliminar marcador e insertar tabla de 5 columnas
                    reqs_table_insert = [
                        {'deleteContentRange': {'range': {'startIndex': t_start, 'endIndex': t_end - 1}}},
                        {'insertTable': {'rows': num_rows, 'columns': 5, 'location': {'index': t_start}}}
                    ]
                    docs_service.documents().batchUpdate(documentId=nuevo_doc_id, body={'requests': reqs_table_insert}).execute()

                    # Obtener doc para ubicar la tabla recién insertada
                    doc_after_tbl = docs_service.documents().get(documentId=nuevo_doc_id).execute()
                    table_elem = None
                    for elem in doc_after_tbl.get('body', {}).get('content', []):
                        if 'table' in elem and elem.get('startIndex') >= t_start:
                            table_elem = elem
                            break

                    if table_elem:
                        t_loc = table_elem['startIndex']
                        table_obj = table_elem['table']

                        # Configurar anchos configurables de 5 columnas (abriendo hacia la izquierda y derecha)
                        col_izq = float(config.get("col_margen_izq", 80.0))
                        col_cod = float(config.get("col_codigo", 38.0))
                        col_tra = float(config.get("col_tramo", 196.0))
                        col_frec = float(config.get("col_frecuencia", 50.0))
                        col_der = float(config.get("col_margen_der", 85.0))

                        # Auto-detección inteligente: si la plantilla tiene la regla horizontal centrada, abrir hacia izquierda y derecha
                        if config.get("auto_detectar_margen", True):
                            offset_exp = float(config.get("offset_expansion_margen", 18.0))
                            if detected_indent_start is not None and detected_indent_start > 10:
                                # Abre hacia la izquierda reduciendo el margen izquierdo
                                col_izq = max(round(float(detected_indent_start) - offset_exp, 1), 60.0)
                            if detected_indent_end is not None and detected_indent_end > 10:
                                # Abre hacia la derecha reduciendo el margen derecho
                                col_der = max(round(float(detected_indent_end) - offset_exp, 1), 65.0)

                        # Garantizar siempre al menos 38pt para código de ruta (garantiza "Ruta 01:" en una sola línea)
                        if col_cod < 38.0:
                            col_cod = 38.0

                        # Ajustar el ancho del tramo para cubrir el espacio abierto disponible
                        ancho_total_pagina = 449.0
                        espacio_disp = ancho_total_pagina - (col_izq + col_cod + col_frec + col_der)
                        if espacio_disp > 100:
                            col_tra = round(espacio_disp, 1)

                        widths = [col_izq, col_cod, col_tra, col_frec, col_der]
                        logger.info(f"Aplicando anchos de tabla TUC ampliados: {widths}")

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

                        white_border = {
                            'color': {'color': {'rgbColor': {'red': 1, 'green': 1, 'blue': 1}}},
                            'width': {'magnitude': 0, 'unit': 'PT'},
                            'dashStyle': 'SOLID'
                        }
                        style_reqs.append({
                            'updateTableCellStyle': {
                                'tableRange': {
                                    'tableCellLocation': {
                                        'tableStartLocation': {'index': t_loc},
                                        'rowIndex': 0,
                                        'columnIndex': 0
                                    },
                                    'rowSpan': num_rows,
                                    'columnSpan': 5
                                },
                                'tableCellStyle': {
                                    'paddingTop': {'magnitude': 0, 'unit': 'PT'},
                                    'paddingBottom': {'magnitude': 0, 'unit': 'PT'},
                                    'paddingLeft': {'magnitude': 0, 'unit': 'PT'},
                                    'paddingRight': {'magnitude': 0, 'unit': 'PT'},
                                    'borderTop': white_border,
                                    'borderBottom': white_border,
                                    'borderLeft': white_border,
                                    'borderRight': white_border
                                },
                                'fields': 'paddingTop,paddingBottom,paddingLeft,paddingRight,borderTop,borderBottom,borderLeft,borderRight'
                            }
                        })
                        # Separación visual garantizada para la columna de frecuencia (col 3) respecto al tramo (col 2)
                        style_reqs.append({
                            'updateTableCellStyle': {
                                'tableRange': {
                                    'tableCellLocation': {
                                        'tableStartLocation': {'index': t_loc},
                                        'rowIndex': 0,
                                        'columnIndex': 3
                                    },
                                    'rowSpan': num_rows,
                                    'columnSpan': 1
                                },
                                'tableCellStyle': {
                                    'paddingLeft': {'magnitude': 8.0, 'unit': 'PT'},
                                    'paddingRight': {'magnitude': 0, 'unit': 'PT'},
                                    'borderTop': white_border,
                                    'borderBottom': white_border,
                                    'borderLeft': white_border,
                                    'borderRight': white_border
                                },
                                'fields': 'paddingLeft,paddingRight'
                            }
                        })
                        docs_service.documents().batchUpdate(documentId=nuevo_doc_id, body={'requests': style_reqs}).execute()

                        # Re-obtener doc para insertar contenido en las celdas
                        doc_for_text = docs_service.documents().get(documentId=nuevo_doc_id).execute()
                        for elem in doc_for_text.get('body', {}).get('content', []):
                            if 'table' in elem and elem.get('startIndex') == t_loc:
                                table_obj = elem['table']
                                break

                        insertions = []
                        rutas_meta = []
                        if rutas_detalle:
                            for r_idx, r_data in enumerate(rutas_detalle):
                                if r_idx >= len(table_obj['tableRows']):
                                    break
                                row = table_obj['tableRows'][r_idx]
                                cod_val = str(r_data.get('codigo') or '').strip()
                                tramo_val = str(r_data.get('tramo') or f"{r_data.get('origen', '')} - {r_data.get('destino', '')}").strip()
                                frec_val = str(r_data.get('frecuencia') or '').strip()

                                # Si el tramo ya traía "Ruta XX:" al inicio, extraerlo o removerlo para no duplicarlo
                                m_ruta = re.match(r'^(Ruta\s+[^:]+:|RUTA\s+[^:]+:)\s*(.*)$', tramo_val, re.IGNORECASE)
                                if m_ruta:
                                    if not cod_val:
                                        cod_val = m_ruta.group(1).replace('Ruta', '').replace('RUTA', '').replace(':', '').strip()
                                    tramo_val = m_ruta.group(2).strip()

                                if cod_val.isdigit() and len(cod_val) == 1:
                                    cod_val = cod_val.zfill(2)

                                # Limpiar paréntesis externos de la frecuencia si engloban todo el texto
                                if frec_val.startswith('(') and frec_val.endswith(')'):
                                    frec_val = frec_val[1:-1].strip()

                                # Col 1: Código de ruta siempre en una sola línea (Ruta 01:)
                                c1_idx = row['tableCells'][1]['startIndex'] + 1
                                c1_text = f"Ruta {cod_val}:" if cod_val else ""
                                insertions.append({'index': c1_idx, 'text': c1_text})

                                # Col 2: Tramo con origen y destino normal, itinerario en color negro ligero
                                origen = str(r_data.get('origen') or '').strip()
                                itin = str(r_data.get('itinerario') or '').strip()
                                destino = str(r_data.get('destino') or '').strip()

                                if not origen and not destino and tramo_val:
                                    parts = [p.strip() for p in tramo_val.split(' - ') if p.strip()]
                                    if len(parts) >= 3:
                                        origen = parts[0]
                                        itin = " - ".join(parts[1:-1])
                                        destino = parts[-1]
                                    elif len(parts) == 2:
                                        origen = parts[0]
                                        itin = ""
                                        destino = parts[1]
                                    elif len(parts) == 1:
                                        origen = parts[0]
                                        itin = ""
                                        destino = ""

                                if origen and itin and destino:
                                    seg1 = origen
                                    seg2 = f" - {itin} - "
                                    seg3 = destino
                                    c2_text = f"{seg1}{seg2}{seg3}"
                                    itin_rel_start = len(seg1)
                                    itin_rel_len = len(seg2)
                                elif origen and itin and not destino:
                                    seg1 = origen
                                    seg2 = f" - {itin}"
                                    seg3 = ""
                                    c2_text = f"{seg1}{seg2}"
                                    itin_rel_start = len(seg1)
                                    itin_rel_len = len(seg2)
                                elif origen and destino and not itin:
                                    c2_text = f"{origen} - {destino}"
                                    itin_rel_start = 0
                                    itin_rel_len = 0
                                elif itin and not origen and not destino:
                                    c2_text = itin
                                    itin_rel_start = 0
                                    itin_rel_len = len(itin)
                                else:
                                    c2_text = tramo_val or f"{origen} - {destino}".strip(" -")
                                    itin_rel_start = 0
                                    itin_rel_len = 0

                                c2_idx = row['tableCells'][2]['startIndex'] + 1
                                insertions.append({'index': c2_idx, 'text': c2_text})

                                # Col 3: Frecuencia (mismo color negro ligero que itinerario)
                                m_day = re.search(r'^(.*?)(\([^\)]+\))$', frec_val.strip())
                                if m_day:
                                    frec_text = f"{m_day.group(1).strip()}\n{m_day.group(2).strip()}"
                                else:
                                    frec_text = frec_val.strip()

                                c3_idx = row['tableCells'][3]['startIndex'] + 1
                                insertions.append({'index': c3_idx, 'text': frec_text})

                                rutas_meta.append({
                                    'r_idx': r_idx,
                                    'itin_rel_start': itin_rel_start,
                                    'itin_rel_len': itin_rel_len
                                })
                        else:
                            row = table_obj['tableRows'][0]
                            c2_idx = row['tableCells'][2]['startIndex'] + 1
                            insertions.append({'index': c2_idx, 'text': 'No hay rutas asociadas.'})

                        insertions.sort(key=lambda x: x['index'], reverse=True)
                        insert_reqs = [{'insertText': {'location': {'index': ins['index']}, 'text': ins['text']}} for ins in insertions]
                        docs_service.documents().batchUpdate(documentId=nuevo_doc_id, body={'requests': insert_reqs}).execute()

                        # Estilizar tipografía: interlineado mínimo (100%), 0 espaciado arriba/abajo
                        # Col 1 (Ruta 01:) en 6.5pt Negrita color normal, Col 2 (Origen/Destino normal, Itinerario negro ligero 6.0pt)
                        # Col 3 (Frecuencia) en negro ligero 5.2pt con días debajo en 4.5pt
                        doc_for_styles = docs_service.documents().get(documentId=nuevo_doc_id).execute()
                        for elem in doc_for_styles.get('body', {}).get('content', []):
                            if 'table' in elem and elem.get('startIndex') == t_loc:
                                table_obj = elem['table']
                                break

                        COLOR_NEGRO_NORMAL = {'red': 0.0, 'green': 0.0, 'blue': 0.0}
                        COLOR_NEGRO_LIGERO = {'red': 0.38, 'green': 0.38, 'blue': 0.38} # Color negro ligero para itinerario y frecuencia

                        text_style_reqs = []
                        for r_idx, row in enumerate(table_obj['tableRows']):
                            r_meta = rutas_meta[r_idx] if r_idx < len(rutas_meta) else None
                            for c_idx, cell in enumerate(row['tableCells']):
                                for c_el in cell.get('content', []):
                                    if 'paragraph' in c_el:
                                        p_s = c_el['startIndex']
                                        p_e = c_el['endIndex']
                                        p_txt = ''.join([elem.get('textRun', {}).get('content', '') for elem in c_el['paragraph'].get('elements', [])])
                                        
                                        # Espaciado mínimo entre filas
                                        text_style_reqs.append({
                                            'updateParagraphStyle': {
                                                'range': {'startIndex': p_s, 'endIndex': p_e},
                                                'paragraphStyle': {
                                                    'alignment': 'START',
                                                    'lineSpacing': 100.0,
                                                    'spaceAbove': {'magnitude': 0, 'unit': 'PT'},
                                                    'spaceBelow': {'magnitude': 0, 'unit': 'PT'}
                                                },
                                                'fields': 'alignment,lineSpacing,spaceAbove,spaceBelow'
                                            }
                                        })

                                        if p_e - 1 > p_s:
                                            f_cod = float(config.get("fuente_tamanio_codigo", 6.5))
                                            f_tra = float(config.get("fuente_tamanio_tramo", 6.0))
                                            f_frec = float(config.get("fuente_tamanio_frecuencia", 5.2))
                                            f_dias = float(config.get("fuente_tamanio_dias", 4.5))

                                            if c_idx == 1:
                                                # Columna 1: Código de ruta en Negrita siempre en una sola línea
                                                text_style_reqs.append({
                                                    'updateTextStyle': {
                                                        'range': {'startIndex': p_s, 'endIndex': p_e - 1},
                                                        'textStyle': {
                                                            'fontSize': {'magnitude': f_cod, 'unit': 'PT'},
                                                            'weightedFontFamily': {'fontFamily': 'Roboto', 'weight': 700},
                                                            'bold': True,
                                                            'foregroundColor': {'color': {'rgbColor': COLOR_NEGRO_NORMAL}}
                                                        },
                                                        'fields': 'fontSize,weightedFontFamily,bold,foregroundColor'
                                                    }
                                                })
                                            elif c_idx == 2:
                                                # Columna 2: Tramo - Origen y Destino normal, Itinerario negro ligero
                                                # 1. Base para toda la celda: negro normal regular
                                                text_style_reqs.append({
                                                    'updateTextStyle': {
                                                        'range': {'startIndex': p_s, 'endIndex': p_e - 1},
                                                        'textStyle': {
                                                            'fontSize': {'magnitude': f_tra, 'unit': 'PT'},
                                                            'weightedFontFamily': {'fontFamily': 'Roboto', 'weight': 400},
                                                            'bold': False,
                                                            'foregroundColor': {'color': {'rgbColor': COLOR_NEGRO_NORMAL}}
                                                        },
                                                        'fields': 'fontSize,weightedFontFamily,bold,foregroundColor'
                                                    }
                                                })
                                                # 2. Resaltar itinerario en color negro ligero
                                                if r_meta and r_meta.get('itin_rel_len', 0) > 0:
                                                    itin_s = p_s + r_meta['itin_rel_start']
                                                    itin_e = itin_s + r_meta['itin_rel_len']
                                                    if itin_e <= p_e - 1 and itin_s < itin_e:
                                                        text_style_reqs.append({
                                                            'updateTextStyle': {
                                                                'range': {'startIndex': itin_s, 'endIndex': itin_e},
                                                                'textStyle': {
                                                                    'foregroundColor': {'color': {'rgbColor': COLOR_NEGRO_LIGERO}}
                                                                },
                                                                'fields': 'foregroundColor'
                                                            }
                                                        })
                                            elif c_idx == 3:
                                                # Columna 3: Frecuencia en color negro ligero (igual que itinerario)
                                                is_day_line = p_txt.strip().startswith('(') and p_txt.strip().endswith(')')
                                                f_sz = f_dias if is_day_line else f_frec
                                                text_style_reqs.append({
                                                    'updateTextStyle': {
                                                        'range': {'startIndex': p_s, 'endIndex': p_e - 1},
                                                        'textStyle': {
                                                            'fontSize': {'magnitude': f_sz, 'unit': 'PT'},
                                                            'weightedFontFamily': {'fontFamily': 'Roboto', 'weight': 400},
                                                            'bold': False,
                                                            'foregroundColor': {'color': {'rgbColor': COLOR_NEGRO_LIGERO}}
                                                        },
                                                        'fields': 'fontSize,weightedFontFamily,bold,foregroundColor'
                                                    }
                                                })

                        # Ajustar los párrafos inmediatamente posteriores a la tabla:
                        # Colapsar párrafos vacíos y márgenes entre la tabla y la línea horizontal
                        for elem in doc_for_styles.get('body', {}).get('content', []):
                            if 'paragraph' in elem:
                                p_s = elem['startIndex']
                                p_e = elem['endIndex']
                                p_t = ''.join([e.get('textRun', {}).get('content', '') for e in elem['paragraph'].get('elements', [])])
                                has_hr = any('horizontalRule' in e for e in elem['paragraph'].get('elements', []))

                                if p_s >= t_loc:
                                    if p_t.strip().startswith('R.D.R') or p_t.strip().startswith('R.D.'):
                                        if es_fila_en_blanco:
                                            # Dejar toda la fila en blanco
                                            if p_e - 1 > p_s:
                                                text_style_reqs.append({
                                                    'updateTextStyle': {
                                                        'range': {'startIndex': p_s, 'endIndex': p_e - 1},
                                                        'textStyle': {
                                                            'fontSize': {'magnitude': 1.0, 'unit': 'PT'},
                                                            'foregroundColor': {'color': {'rgbColor': {'red': 1, 'green': 1, 'blue': 1}}}
                                                        },
                                                        'fields': 'fontSize,foregroundColor'
                                                    }
                                                })
                                        else:
                                            text_style_reqs.append({
                                                'updateParagraphStyle': {
                                                    'range': {'startIndex': p_s, 'endIndex': p_e},
                                                    'paragraphStyle': {
                                                        'alignment': 'CENTER',
                                                        'lineSpacing': 100.0,
                                                        'spaceAbove': {'magnitude': 1.0, 'unit': 'PT'},
                                                        'spaceBelow': {'magnitude': 1.0, 'unit': 'PT'}
                                                    },
                                                    'fields': 'alignment,lineSpacing,spaceAbove,spaceBelow'
                                                }
                                            })
                                    elif has_hr:
                                        # La línea horizontal: pegada a la tabla sin margen arriba ni abajo
                                        text_style_reqs.append({
                                            'updateParagraphStyle': {
                                                'range': {'startIndex': p_s, 'endIndex': p_e},
                                                'paragraphStyle': {
                                                    'alignment': 'CENTER',
                                                    'lineSpacing': 100.0,
                                                    'spaceAbove': {'magnitude': 0, 'unit': 'PT'},
                                                    'spaceBelow': {'magnitude': 0, 'unit': 'PT'}
                                                },
                                                'fields': 'alignment,lineSpacing,spaceAbove,spaceBelow'
                                            }
                                        })
                                    elif p_t.strip() == '' and (p_e - p_s) <= 2:
                                        # Párrafo vacío residual entre tabla y regla horizontal: colapsar a 1pt
                                        text_style_reqs.append({
                                            'updateParagraphStyle': {
                                                'range': {'startIndex': p_s, 'endIndex': p_e},
                                                'paragraphStyle': {
                                                    'lineSpacing': 100.0,
                                                    'spaceAbove': {'magnitude': 0, 'unit': 'PT'},
                                                    'spaceBelow': {'magnitude': 0, 'unit': 'PT'}
                                                },
                                                'fields': 'lineSpacing,spaceAbove,spaceBelow'
                                            }
                                        })
                                        text_style_reqs.append({
                                            'updateTextStyle': {
                                                'range': {'startIndex': p_s, 'endIndex': p_e - 1},
                                                'textStyle': {
                                                    'fontSize': {'magnitude': 1.0, 'unit': 'PT'}
                                                },
                                                'fields': 'fontSize'
                                            }
                                        })

                        if text_style_reqs:
                            docs_service.documents().batchUpdate(documentId=nuevo_doc_id, body={'requests': text_style_reqs}).execute()
                            logger.info(f"Tabla de 4 columnas de rutas construida con éxito en Google Doc {nuevo_doc_id}")

            except Exception as table_err:
                logger.warning(f"Aviso al construir tabla estructurada de rutas en Google Doc: {table_err}")

            google_doc_url = f"https://docs.google.com/document/d/{nuevo_doc_id}/edit"

            # 3. Intentar configurar permiso de acceso para usuarios con el enlace
            try:
                drive_service.permissions().create(
                    fileId=nuevo_doc_id,
                    body={'type': 'anyone', 'role': 'writer'},
                    supportsAllDrives=True
                ).execute()
            except Exception as perm_err:
                logger.info(f"Nota permisos drive (puede estar restringido por dominio): {perm_err}")

            # 4. Guardar automáticamente el enlace generado en el campo link_tuc del vehículo
            try:
                import re
                from bson import ObjectId
                from app.dependencies.db import get_database

                db = await get_database()
                if db is not None:
                    veh_id = tuc_info.get("vehiculo_id")
                    veh_raw_id = tuc_info.get("vehiculo_raw_id")

                    flota_filter = None
                    if veh_id and ObjectId.is_valid(veh_id):
                        flota_filter = {"_id": ObjectId(veh_id)}
                    elif veh_raw_id:
                        flota_filter = {"id": veh_raw_id}
                    elif placa:
                        flota_filter = {"placa": {"$regex": f"^{re.escape(placa)}$", "$options": "i"}}

                    if flota_filter:
                        await db.flota_empresa.update_one(
                            flota_filter,
                            {"$set": {"link_tuc": google_doc_url, "fecha_actualizacion": datetime.utcnow()}}
                        )
                        logger.info(f"Enlace Google Docs ({google_doc_url}) asignado a link_tuc en flota_empresa para vehículo {placa}")

                    # Sincronizar también en la colección tucs si existe el registro
                    if placa:
                        await db.tucs.update_many(
                            {"placa": {"$regex": f"^{re.escape(placa)}$", "$options": "i"}},
                            {"$set": {"link_tuc": google_doc_url, "linkDocumento": google_doc_url}}
                        )
            except Exception as db_err:
                logger.warning(f"No se pudo guardar automáticamente el link_tuc en la BD: {db_err}")

            return {
                "exito": True,
                "disponible": True,
                "mensaje": "Copia en Google Docs generada y guardada en la base de datos exitosamente.",
                "nuevo_doc_id": nuevo_doc_id,
                "url": google_doc_url,
                "link_tuc": google_doc_url,
                "placa": placa
            }

        except Exception as e:
            logger.error(f"Error al generar copia en Google Docs: {e}", exc_info=True)
            return {
                "exito": False,
                "disponible": True,
                "mensaje": f"Error al interactuar con Google Docs API: {str(e)}",
                "url": None
            }
