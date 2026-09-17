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
    "col_margen_izq": 99.2,
    "col_codigo": 28.0,
    "col_tramo": 172.0,
    "col_frecuencia": 45.0,
    "col_margen_der": 105.0,
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

            # 2. Reemplazar los marcadores de texto plano (excluyendo {{TABLA_RUTAS}} para manejarlo como tabla)
            requests = []
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

                        # Configurar anchos configurables de 5 columnas
                        col_izq = float(config.get("col_margen_izq", 99.2))
                        col_cod = float(config.get("col_codigo", 28.0))
                        col_tra = float(config.get("col_tramo", 172.0))
                        col_frec = float(config.get("col_frecuencia", 45.0))
                        col_der = float(config.get("col_margen_der", 105.0))

                        # Auto-detección inteligente: si la plantilla tiene la regla horizontal centrada, alinear exactamente con ella
                        if config.get("auto_detectar_margen", True):
                            if detected_indent_start is not None and detected_indent_start > 10:
                                col_izq = round(float(detected_indent_start), 1)
                            if detected_indent_end is not None and detected_indent_end > 10:
                                col_der = round(float(detected_indent_end), 1)

                        widths = [col_izq, col_cod, col_tra, col_frec, col_der]
                        logger.info(f"Aplicando anchos de tabla TUC: {widths}")

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
                        docs_service.documents().batchUpdate(documentId=nuevo_doc_id, body={'requests': style_reqs}).execute()

                        # Re-obtener doc para insertar contenido en las celdas
                        doc_for_text = docs_service.documents().get(documentId=nuevo_doc_id).execute()
                        for elem in doc_for_text.get('body', {}).get('content', []):
                            if 'table' in elem and elem.get('startIndex') == t_loc:
                                table_obj = elem['table']
                                break

                        insertions = []
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

                                # Limpiar paréntesis externos de la frecuencia si engloban todo el texto
                                if frec_val.startswith('(') and frec_val.endswith(')'):
                                    frec_val = frec_val[1:-1].strip()

                                # Col 1: Código de ruta separado (Ruta XX:)
                                c1_idx = row['tableCells'][1]['startIndex'] + 1
                                c1_text = f"Ruta {cod_val}:" if cod_val else ""
                                insertions.append({'index': c1_idx, 'text': c1_text})

                                # Col 2: Tramo / Itinerario
                                c2_idx = row['tableCells'][2]['startIndex'] + 1
                                insertions.append({'index': c2_idx, 'text': tramo_val})

                                # Col 3: Frecuencia (los días entre paréntesis van debajo de SEMANALES/SEMANAL)
                                m_day = re.search(r'^(.*?)(\([^\)]+\))$', frec_val.strip())
                                if m_day:
                                    frec_text = f"{m_day.group(1).strip()}\n{m_day.group(2).strip()}"
                                else:
                                    frec_text = frec_val.strip()

                                c3_idx = row['tableCells'][3]['startIndex'] + 1
                                insertions.append({'index': c3_idx, 'text': frec_text})
                        else:
                            row = table_obj['tableRows'][0]
                            c2_idx = row['tableCells'][2]['startIndex'] + 1
                            insertions.append({'index': c2_idx, 'text': 'No hay rutas asociadas.'})

                        insertions.sort(key=lambda x: x['index'], reverse=True)
                        insert_reqs = [{'insertText': {'location': {'index': ins['index']}, 'text': ins['text']}} for ins in insertions]
                        docs_service.documents().batchUpdate(documentId=nuevo_doc_id, body={'requests': insert_reqs}).execute()

                        # Estilizar tipografía: interlineado mínimo (100%), 0 espaciado arriba/abajo, Col 1 (Ruta) en 6.5pt Negrita, Col 2 (Tramo) en 6.0pt, Col 3 (Frecuencia) en 5.2pt con días debajo en 4.5pt
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
                                                # Columna 1: Código de ruta en Negrita
                                                text_style_reqs.append({
                                                    'updateTextStyle': {
                                                        'range': {'startIndex': p_s, 'endIndex': p_e - 1},
                                                        'textStyle': {
                                                            'fontSize': {'magnitude': f_cod, 'unit': 'PT'},
                                                            'weightedFontFamily': {'fontFamily': 'Roboto', 'weight': 700},
                                                            'bold': True
                                                        },
                                                        'fields': 'fontSize,weightedFontFamily,bold'
                                                    }
                                                })
                                            elif c_idx == 2:
                                                # Columna 2: Tramo en Normal
                                                text_style_reqs.append({
                                                    'updateTextStyle': {
                                                        'range': {'startIndex': p_s, 'endIndex': p_e - 1},
                                                        'textStyle': {
                                                            'fontSize': {'magnitude': f_tra, 'unit': 'PT'},
                                                            'weightedFontFamily': {'fontFamily': 'Roboto', 'weight': 400},
                                                            'bold': False
                                                        },
                                                        'fields': 'fontSize,weightedFontFamily,bold'
                                                    }
                                                })
                                            elif c_idx == 3:
                                                # Columna 3: Frecuencia. Línea de días entre paréntesis; base configurable
                                                is_day_line = p_txt.strip().startswith('(') and p_txt.strip().endswith(')')
                                                f_sz = f_dias if is_day_line else f_frec
                                                text_style_reqs.append({
                                                    'updateTextStyle': {
                                                        'range': {'startIndex': p_s, 'endIndex': p_e - 1},
                                                        'textStyle': {
                                                            'fontSize': {'magnitude': f_sz, 'unit': 'PT'},
                                                            'weightedFontFamily': {'fontFamily': 'Roboto', 'weight': 400},
                                                            'bold': False
                                                        },
                                                        'fields': 'fontSize,weightedFontFamily,bold'
                                                    }
                                                })

                        # Ajustar también el párrafo de la resolución final para que no tenga interlineado colapsado
                        for elem in doc_for_styles.get('body', {}).get('content', []):
                            if 'paragraph' in elem:
                                p_t = ''.join([e.get('textRun', {}).get('content', '') for e in elem['paragraph'].get('elements', [])])
                                if p_t.strip().startswith('R.D.R') or p_t.strip().startswith('R.D.'):
                                    text_style_reqs.append({
                                        'updateParagraphStyle': {
                                            'range': {'startIndex': elem['startIndex'], 'endIndex': elem['endIndex']},
                                            'paragraphStyle': {
                                                'alignment': 'CENTER',
                                                'lineSpacing': 115.0,
                                                'spaceAbove': {'magnitude': 2.0, 'unit': 'PT'},
                                                'spaceBelow': {'magnitude': 2.0, 'unit': 'PT'}
                                            },
                                            'fields': 'alignment,lineSpacing,spaceAbove,spaceBelow'
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
