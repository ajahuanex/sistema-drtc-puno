import os
import re
import io
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional, List
from bson import ObjectId
import docx
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from app.dependencies.db import get_database

logger = logging.getLogger(__name__)

TEMPLATE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "plantilla_tuc.docx")

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

class TucDocumentService:

    @staticmethod
    def _build_routes_table(rutas_info: List[Dict[str, Any]]):
        """
        Construye el elemento XML de Table 1 (Tabla de Rutas del reverso de la TUC)
        con la disposición, anchos y fuentes exactos de la plantilla oficial de DRTC Puno.
        """
        tbl_xml = [
            '<w:tbl ' + nsdecls('w') + '>',
            '  <w:tblPr>',
            '    <w:tblStyle w:val="Table2"/>',
            '    <w:tblW w:w="9000.0" w:type="dxa"/>',
            '    <w:jc w:val="left"/>',
            '    <w:tblBorders>',
            '      <w:top w:color="ffffff" w:space="0" w:sz="8" w:val="single"/>',
            '      <w:left w:color="ffffff" w:space="0" w:sz="8" w:val="single"/>',
            '      <w:bottom w:color="ffffff" w:space="0" w:sz="8" w:val="single"/>',
            '      <w:right w:color="ffffff" w:space="0" w:sz="8" w:val="single"/>',
            '      <w:insideH w:color="ffffff" w:space="0" w:sz="8" w:val="single"/>',
            '      <w:insideV w:color="ffffff" w:space="0" w:sz="8" w:val="single"/>',
            '    </w:tblBorders>',
            '  </w:tblPr>',
            '  <w:tblGrid>',
            '    <w:gridCol w:w="80"/>',
            '    <w:gridCol w:w="760"/>',
            '    <w:gridCol w:w="3900"/>',
            '    <w:gridCol w:w="1000"/>',
            '    <w:gridCol w:w="3260"/>',
            '  </w:tblGrid>',
            '  <w:tr>',
            '    <w:trPr><w:cantSplit w:val="0"/><w:tblHeader w:val="0"/></w:trPr>',
            '    <w:tc><w:tcPr><w:tcW w:w="80" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0" w:before="0" w:line="192" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:sz w:val="13"/></w:rPr></w:pPr></w:p></w:tc>',
            '    <w:tc><w:tcPr><w:tcW w:w="760" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0" w:before="0" w:line="192" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:sz w:val="13"/></w:rPr></w:pPr></w:p></w:tc>',
            '    <w:tc><w:tcPr><w:tcW w:w="3900" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0" w:before="0" w:line="192" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:sz w:val="12"/></w:rPr></w:pPr></w:p></w:tc>',
            '    <w:tc><w:tcPr><w:tcW w:w="1000" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0" w:before="0" w:line="192" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:sz w:val="10"/></w:rPr></w:pPr></w:p></w:tc>',
            '    <w:tc><w:tcPr><w:tcW w:w="3260" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0" w:before="0" w:line="192" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:sz w:val="13"/></w:rPr></w:pPr></w:p></w:tc>',
            '  </w:tr>'
        ]

        lista = list(rutas_info) if rutas_info else [{"codigo": "", "tramo": "SIN RUTAS ASIGNADAS", "frecuencia": ""}]

        for r in lista:
            cod_val = str(r.get('codigo') or '').strip()
            tramo_str = str(r.get('tramo') or f"{r.get('origen', '')} - {r.get('destino', '')}").strip()
            frec_str = str(r.get('frecuencia', '')).strip()

            m_ruta = re.match(r'^(Ruta\s+[^:]+:|RUTA\s+[^:]+:)\s*(.*)$', tramo_str, re.IGNORECASE)
            if m_ruta:
                if not cod_val:
                    cod_val = m_ruta.group(1).replace('Ruta', '').replace('RUTA', '').replace(':', '').strip()
                tramo_str = m_ruta.group(2).strip()

            if cod_val.isdigit() and len(cod_val) == 1:
                cod_val = cod_val.zfill(2)

            cod_str = f"Ruta {cod_val}:" if cod_val else ""

            if frec_str.startswith('(') and frec_str.endswith(')'):
                frec_str = frec_str[1:-1].strip()

            # Sanitizar para XML
            cod_str = cod_str.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            frec_str = frec_str.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

            # Desglose de origen, itinerario y destino
            origen = str(r.get('origen') or '').strip()
            itin = str(r.get('itinerario') or '').strip()
            destino = str(r.get('destino') or '').strip()

            if not origen and not destino and tramo_str:
                parts = [p.strip() for p in tramo_str.split(' - ') if p.strip()]
                if len(parts) >= 3:
                    origen = parts[0]
                    itin = " - ".join(parts[1:-1])
                    destino = parts[-1]
                elif len(parts) == 2:
                    origen = parts[0]
                    destino = parts[1]
                else:
                    origen = tramo_str

            origen_xml = origen.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            itin_xml = itin.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            destino_xml = destino.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

            tramo_runs_xml = ""
            if origen_xml and itin_xml and destino_xml:
                tramo_runs_xml = f'''
                    <w:r>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:b w:val="0"/><w:color w:val="000000"/><w:sz w:val="12"/></w:rPr>
                      <w:t xml:space="preserve">{origen_xml}</w:t>
                    </w:r>
                    <w:r>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:b w:val="0"/><w:color w:val="616161"/><w:sz w:val="12"/></w:rPr>
                      <w:t xml:space="preserve"> - {itin_xml} - </w:t>
                    </w:r>
                    <w:r>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:b w:val="0"/><w:color w:val="000000"/><w:sz w:val="12"/></w:rPr>
                      <w:t xml:space="preserve">{destino_xml}</w:t>
                    </w:r>
                '''
            elif origen_xml and itin_xml and not destino_xml:
                tramo_runs_xml = f'''
                    <w:r>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:b w:val="0"/><w:color w:val="000000"/><w:sz w:val="12"/></w:rPr>
                      <w:t xml:space="preserve">{origen_xml}</w:t>
                    </w:r>
                    <w:r>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:b w:val="0"/><w:color w:val="616161"/><w:sz w:val="12"/></w:rPr>
                      <w:t xml:space="preserve"> - {itin_xml}</w:t>
                    </w:r>
                '''
            elif origen_xml and destino_xml and not itin_xml:
                tramo_runs_xml = f'''
                    <w:r>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:b w:val="0"/><w:color w:val="000000"/><w:sz w:val="12"/></w:rPr>
                      <w:t xml:space="preserve">{origen_xml} - {destino_xml}</w:t>
                    </w:r>
                '''
            elif itin_xml and not origen_xml and not destino_xml:
                tramo_runs_xml = f'''
                    <w:r>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:b w:val="0"/><w:color w:val="616161"/><w:sz w:val="12"/></w:rPr>
                      <w:t xml:space="preserve">{itin_xml}</w:t>
                    </w:r>
                '''
            else:
                safe_tramo = tramo_str.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                tramo_runs_xml = f'''
                    <w:r>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:b w:val="0"/><w:color w:val="000000"/><w:sz w:val="12"/></w:rPr>
                      <w:t xml:space="preserve">{safe_tramo}</w:t>
                    </w:r>
                '''

            m_day = re.search(r'^(.*?)(\([^\)]+\))$', frec_str)
            if m_day:
                frec_base = m_day.group(1).rstrip()
                frec_day = m_day.group(2)
                frec_runs_xml = f'''
                    <w:r>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:b w:val="0"/><w:color w:val="616161"/><w:sz w:val="10"/></w:rPr>
                      <w:t xml:space="preserve">{frec_base}</w:t>
                      <w:br/>
                    </w:r>
                    <w:r>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:b w:val="0"/><w:color w:val="616161"/><w:sz w:val="9"/></w:rPr>
                      <w:t xml:space="preserve">{frec_day}</w:t>
                    </w:r>
                '''
            else:
                frec_runs_xml = f'''
                    <w:r>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:b w:val="0"/><w:color w:val="616161"/><w:sz w:val="10"/></w:rPr>
                      <w:t xml:space="preserve">{frec_str}</w:t>
                    </w:r>
                '''

            row_xml = f'''
              <w:tr>
                <w:trPr><w:cantSplit w:val="0"/><w:tblHeader w:val="0"/></w:trPr>
                <w:tc>
                  <w:tcPr><w:tcW w:w="80" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>
                  <w:p><w:pPr><w:spacing w:after="0" w:before="0" w:line="192" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:sz w:val="13"/></w:rPr></w:pPr></w:p>
                </w:tc>
                <w:tc>
                  <w:tcPr><w:tcW w:w="760" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>
                  <w:p>
                    <w:pPr>
                      <w:spacing w:after="0" w:before="0" w:line="192" w:lineRule="auto"/>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:sz w:val="13"/></w:rPr>
                    </w:pPr>
                    <w:r>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:b w:val="1"/><w:color w:val="000000"/><w:sz w:val="13"/></w:rPr>
                      <w:t xml:space="preserve">{cod_str}</w:t>
                    </w:r>
                  </w:p>
                </w:tc>
                <w:tc>
                  <w:tcPr><w:tcW w:w="3900" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>
                  <w:p>
                    <w:pPr>
                      <w:spacing w:after="0" w:before="0" w:line="192" w:lineRule="auto"/>
                    </w:pPr>
                    {tramo_runs_xml}
                  </w:p>
                </w:tc>
                <w:tc>
                  <w:tcPr><w:tcW w:w="1000" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>
                  <w:p>
                    <w:pPr>
                      <w:spacing w:after="0" w:before="0" w:line="192" w:lineRule="auto"/>
                      <w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:sz w:val="10"/></w:rPr>
                    </w:pPr>
                    {frec_runs_xml}
                  </w:p>
                </w:tc>
                <w:tc>
                  <w:tcPr><w:tcW w:w="3260" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>
                  <w:p><w:pPr><w:spacing w:after="0" w:before="0" w:line="192" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Roboto" w:hAnsi="Roboto"/><w:sz w:val="13"/></w:rPr></w:pPr></w:p>
                </w:tc>
              </w:tr>
            '''
            tbl_xml.append(row_xml)

        tbl_xml.append('</w:tbl>')
        return parse_xml('\n'.join(tbl_xml))

    @staticmethod
    async def determinar_acto_resolutivo_reverso(db, vehiculo: dict, nro_primigenia_raw: str, fecha_res_p: Any) -> Dict[str, Any]:
        """
        Determina la información del acto resolutivo para el reverso de la TUC:
        - Si es Incremento: sigla (I)
        - Si es Sustitución: sigla (S)
        - Si es Renovación (o Autorización regular sin acto modificatorio): toda la fila en blanco
        - Si es Duplicado: se evalúa según su trámite original (I, S o Renovación en blanco)
        """
        placa = (vehiculo.get("placa") or "").strip().upper()
        nro_hija_raw = (vehiculo.get("nro_resolucion_hija") or "").strip()
        tipo_hija = (vehiculo.get("tipo_resolucion_hija") or vehiculo.get("tipo_tramite_origen") or vehiculo.get("tramite") or "").strip().upper()
        fecha_hija = vehiculo.get("fecha_resolucion_hija") or vehiculo.get("fecha_emision_resolucion")

        # 1. Si no tiene fecha_resolucion_hija explícita en vehiculo, buscar en resoluciones_hijas
        if not vehiculo.get("fecha_resolucion_hija") and nro_hija_raw:
            norm_h = clean_num_resolucion(nro_hija_raw)
            try:
                rh_doc = await db.resoluciones_hijas.find_one({
                    "$or": [
                        {"nro_resolucion": {"$regex": f"^{re.escape(nro_hija_raw)}$", "$options": "i"}},
                        {"nro_resolucion": {"$regex": f"{re.escape(norm_h)}$", "$options": "i"}},
                        {"id": vehiculo.get("resolucion_hija_id")},
                        {"id": vehiculo.get("tramite_id")}
                    ]
                })
                if rh_doc:
                    fecha_hija_bd = rh_doc.get("fecha_resolucion") or rh_doc.get("fecha_inicio_efectos") or rh_doc.get("fecha_emision")
                    if fecha_hija_bd:
                        fecha_hija = fecha_hija_bd
                    if not tipo_hija:
                        tipo_acto = str(rh_doc.get("tipo_acto") or rh_doc.get("tipo_tramite_origen") or "").upper()
                        if "SUSTITUCION" in tipo_acto:
                            tipo_hija = "S"
                        elif "INCREMENTO" in tipo_acto:
                            tipo_hija = "I"
            except Exception as e_hija:
                logger.warning(f"Error consultando resolucion_hija para acto reverso TUC: {e_hija}")

        # Si fecha_hija terminó siendo idéntica a la fecha de la primigenia por herencia incorrecta, descartar
        fecha_p_str = str(fecha_res_p or "").strip()
        if fecha_hija and fecha_p_str and fecha_p_str != "-":
            if format_fecha(fecha_hija) == fecha_p_str and not vehiculo.get("fecha_resolucion_hija"):
                fecha_hija = None

        # 2. Si es Duplicado, buscar el trámite original del vehículo
        if tipo_hija in ["D", "DUPLICADO"]:
            orig_veh = None
            if placa and placa != "-":
                cursor_orig = db.flota_empresa.find({
                    "placa": {"$regex": f"^{re.escape(placa)}$", "$options": "i"},
                    "tipo_resolucion_hija": {"$nin": ["D", "DUPLICADO", None, ""]},
                    "_id": {"$ne": vehiculo.get("_id")}
                }).sort("fecha_registro", -1)
                lista_orig = await cursor_orig.to_list(1)
                if lista_orig:
                    orig_veh = lista_orig[0]

            if orig_veh:
                tipo_hija = (orig_veh.get("tipo_resolucion_hija") or orig_veh.get("tipo_tramite_origen") or orig_veh.get("tramite") or "").strip().upper()
                nro_hija_raw = (orig_veh.get("nro_resolucion_hija") or nro_hija_raw).strip()
                fecha_hija = orig_veh.get("fecha_resolucion_hija") or orig_veh.get("fecha_emision_resolucion") or fecha_hija
            else:
                # Si no tiene trámite modificatorio previo en la flota, su origen fue autorización o renovación
                tipo_hija = "R"

        # 3. Normalizar tipo de trámite a sigla oficial DRTC
        # REGLA: Esta resolución hija SOLAMENTE aparece cuando es Sustitución (S) o Incremento (I)
        # (o en Duplicado si su origen fue S o I).
        # Si es RENOVACIÓN o AUTORIZACIÓN regular, toda la fila en blanco (NUNCA mostrar 'S' ni fecha).
        sigla = ""
        es_en_blanco = False

        if tipo_hija in ["R", "RENOVACION", "RENOVACIÓN"] or (vehiculo.get("tramite") or "").upper() in ["RENOVACION", "RENOVACIÓN"]:
            es_en_blanco = True
        elif not nro_hija_raw or (nro_primigenia_raw and clean_num_resolucion(nro_hija_raw) == clean_num_resolucion(nro_primigenia_raw)):
            es_en_blanco = True
        elif tipo_hija in ["I", "INCREMENTO", "INCREMENTO DE FLOTA"]:
            sigla = "I"
        elif tipo_hija in ["S", "SUSTITUCION", "SUSTITUCIÓN", "SUSTITUCION DE VEHICULO"]:
            sigla = "S"
        else:
            # Cualquier otro trámite no modificatorio queda totalmente en blanco
            es_en_blanco = True

        if es_en_blanco or not nro_hija_raw or not sigla:
            return {
                "es_en_blanco": True,
                "num_resolucion": "",
                "fecha_resolucion": "",
                "tipo_resolucion": "",
                "sigla": "",
                "siglas_institucion": "",
                "num_resolucion_completo": "",
                "texto_completo": ""
            }

        from app.utils.resolucion_utils import determinar_siglas_resolucion
        num_res_clean = clean_num_resolucion(nro_hija_raw)
        fecha_res_clean = format_fecha(fecha_hija) if fecha_hija else ""
        if fecha_res_clean == "-":
            fecha_res_clean = ""
        siglas_acto = determinar_siglas_resolucion(nro_hija_raw)
        
        if fecha_res_clean:
            texto = f"R.D.R N° {num_res_clean}-{siglas_acto} ({fecha_res_clean}) ({sigla})"
        else:
            texto = f"R.D.R N° {num_res_clean}-{siglas_acto} ({sigla})"

        return {
            "es_en_blanco": False,
            "num_resolucion": num_res_clean,
            "fecha_resolucion": fecha_res_clean,
            "tipo_resolucion": sigla,
            "sigla": sigla,
            "siglas_institucion": siglas_acto,
            "num_resolucion_completo": f"{num_res_clean}-{siglas_acto}",
            "texto_completo": texto
        }

    @staticmethod
    async def get_tuc_data(placa_o_id: str) -> Dict[str, Any]:
        """
        Recopila y cruza toda la información técnica y administrativa
        de un vehículo para rellenar la plantilla oficial de TUC.
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

        cursor = db.flota_empresa.find(query).sort([("esta_activo", -1), ("fecha_actualizacion", -1), ("fecha_registro", -1)])
        vehiculos_res = await cursor.to_list(1)
        vehiculo = vehiculos_res[0] if vehiculos_res else None
        if not vehiculo:
            placa_limpia = term.replace("-", "").strip()
            cursor2 = db.flota_empresa.find({
                "placa": {"$regex": f"^{re.escape(placa_limpia)}$", "$options": "i"}
            }).sort([("esta_activo", -1), ("fecha_actualizacion", -1), ("fecha_registro", -1)])
            vehiculos_res2 = await cursor2.to_list(1)
            vehiculo = vehiculos_res2[0] if vehiculos_res2 else None

        if not vehiculo:
            raise ValueError(f"No se encontró el vehículo con identificador o placa '{placa_o_id}' en la flota.")

        placa = (vehiculo.get("placa") or "").strip().upper()
        ruc = (vehiculo.get("ruc") or "").strip()
        razon_social = (vehiculo.get("razon_social") or "").strip()
        nro_primigenia_raw = (vehiculo.get("nro_resolucion_primigenia") or "").strip()
        nro_hija_raw = (vehiculo.get("nro_resolucion_hija") or "").strip()
        tipo_hija = (vehiculo.get("tipo_resolucion_hija") or "").strip()
        fecha_hija = vehiculo.get("fecha_resolucion_hija")
        rutas_codigos = vehiculo.get("rutas") or []

        # 2. Obtener datos técnicos de vehiculos_data
        v_data = await db.vehiculos_data.find_one({
            "$or": [
                {"placa_actual": {"$regex": f"^{re.escape(placa)}$", "$options": "i"}},
                {"placa": {"$regex": f"^{re.escape(placa)}$", "$options": "i"}}
            ]
        })
        if not v_data and "-" in placa:
            placa_alt = placa.replace("-", "")
            v_data = await db.vehiculos_data.find_one({
                "$or": [
                    {"placa_actual": {"$regex": f"^{re.escape(placa_alt)}$", "$options": "i"}},
                    {"placa": {"$regex": f"^{re.escape(placa_alt)}$", "$options": "i"}}
                ]
            })

        color = (v_data.get("color") or "-").strip().upper() if v_data else "-"
        marca = (v_data.get("marca") or "-").strip().upper() if v_data else "-"
        vin = (v_data.get("vin") or v_data.get("numero_serie") or "-").strip().upper() if v_data else "-"
        anio = str(v_data.get("anio_fabricacion") or v_data.get("anio_modelo") or "-") if v_data else "-"
        asientos = str(v_data.get("numero_asientos") or "-") if v_data else "-"
        alto = str(v_data.get("altura") or "-") if v_data else "-"
        ancho = str(v_data.get("ancho") or "-") if v_data else "-"
        largo = str(v_data.get("longitud") or "-") if v_data else "-"
        peso_neto = str(v_data.get("peso_neto") or v_data.get("peso_seco") or "-") if v_data else "-"
        peso_bruto = str(v_data.get("peso_bruto") or "-") if v_data else "-"
        carga_util = str(v_data.get("carga_util") or "-") if v_data else "-"
        categoria = (v_data.get("categoria") or "-").strip().upper() if v_data else "-"
        ejes = str(v_data.get("numero_ejes") or "-") if v_data else "-"

        # 3. Obtener datos de la empresa (Partida Registral)
        empresa = None
        if ruc:
            empresa = await db.empresas.find_one({"ruc": ruc})
        if not empresa and razon_social:
            empresa = await db.empresas.find_one({"razonSocial.principal": {"$regex": f"^{re.escape(razon_social)}$", "$options": "i"}})

        partida = "-"
        if empresa:
            partida = (
                empresa.get("partidaRegistral") or 
                empresa.get("partida_registral") or 
                empresa.get("partida") or 
                (empresa.get("datosSunat") or {}).get("ddp_numreg") or
                "-"
            )
            if not razon_social:
                rs = empresa.get("razonSocial")
                razon_social = (rs.get("principal") if isinstance(rs, dict) else str(rs or ""))

        if (not partida or partida == "-") and vehiculo:
            partida = vehiculo.get("partida_registral") or vehiculo.get("partida") or "-"

        if (not partida or partida == "-") and v_data:
            partida = v_data.get("partida_registral") or v_data.get("partida") or "-"

        # 4. Obtener datos de la resolución primigenia
        res_prim = None
        if nro_primigenia_raw:
            norm_res = clean_num_resolucion(nro_primigenia_raw)
            res_prim = await db.resoluciones_primigenias.find_one({
                "$or": [
                    {"nro_resolucion": {"$regex": f"^{re.escape(nro_primigenia_raw)}$", "$options": "i"}},
                    {"nro_resolucion": {"$regex": f"{re.escape(norm_res)}$", "$options": "i"}}
                ]
            })

        fecha_del = "-"
        fecha_al = "-"
        fecha_res_p = "-"
        nro_res_p = clean_num_resolucion(nro_primigenia_raw)
        siglas_res_p = ""

        if res_prim:
            siglas_res_p = res_prim.get("siglas") or ""
            fecha_del = format_fecha(res_prim.get("fecha_inicio_vigencia") or res_prim.get("fecha_resolucion"))
            fecha_al = format_fecha(res_prim.get("fecha_fin_vigencia"))
            fecha_res_p = format_fecha(res_prim.get("fecha_resolucion") or res_prim.get("fecha_emision"))
            if not nro_res_p or nro_res_p == "-":
                nro_res_p = clean_num_resolucion(res_prim.get("nro_resolucion"))
        else:
            fecha_al = format_fecha(vehiculo.get("fecha_vigencia_hasta"))

        if not siglas_res_p and nro_res_p and nro_res_p != "-":
            from app.utils.resolucion_utils import determinar_siglas_resolucion
            siglas_res_p = determinar_siglas_resolucion(nro_res_p or nro_primigenia_raw)

        # 5. Obtener detalle de las rutas asociadas a la resolución primigenia y al vehículo
        rutas_objs = []
        cods_limpios = [str(c).strip() for c in rutas_codigos if c and str(c).strip()] if isinstance(rutas_codigos, list) else []
        clean_res = clean_num_resolucion(nro_primigenia_raw) if nro_primigenia_raw else ""

        # Prioridad 1: Rutas autorizadas enlazadas directamente en la resolución primigenia
        if res_prim and res_prim.get("rutasAutorizadasIds"):
            r_ids = []
            for rid in res_prim.get("rutasAutorizadasIds", []):
                if ObjectId.is_valid(str(rid)):
                    r_ids.append(ObjectId(str(rid)))
                else:
                    r_ids.append(str(rid))
            if r_ids:
                q_rids = {
                    "$or": [
                        {"_id": {"$in": [i for i in r_ids if isinstance(i, ObjectId)]}},
                        {"id": {"$in": [str(i) for i in r_ids]}}
                    ]
                }
                rutas_objs = await db.rutas.find(q_rids).to_list(100)

        # Prioridad 2: Buscar en la colección de rutas por número de resolución primigenia
        if not rutas_objs and clean_res:
            q_res = {
                "$or": [
                    {"resolucion.nroResolucion": {"$regex": f"{re.escape(clean_res)}", "$options": "i"}},
                    {"resolucion.nroResolucion": {"$regex": f"{re.escape(nro_primigenia_raw)}", "$options": "i"}},
                    {"resolucion": {"$regex": f"{re.escape(clean_res)}", "$options": "i"}},
                    {"resolucion": {"$regex": f"{re.escape(nro_primigenia_raw)}", "$options": "i"}}
                ]
            }
            rutas_objs = await db.rutas.find(q_res).to_list(100)

        # Prioridad 3: Buscar en la colección de rutas por RUC de la empresa
        if not rutas_objs and ruc:
            q_emp = {
                "$or": [
                    {"empresa.ruc": ruc},
                    {"empresa_id": ruc},
                    {"ruc": ruc}
                ]
            }
            rutas_objs = await db.rutas.find(q_emp).to_list(100)

        rutas_map = {}
        for r_item in rutas_objs:
            raw_c = r_item.get("codigoRuta") or r_item.get("codigo") or r_item.get("codigo_ruta") or ""
            codigo_item = str(raw_c).strip()
            if codigo_item:
                rutas_map[codigo_item] = r_item
                if codigo_item.isdigit():
                    rutas_map[str(int(codigo_item))] = r_item
                    rutas_map[str(int(codigo_item)).zfill(2)] = r_item

        rutas_lineas = []
        rutas_para_frontend = []

        # Determinar lista de códigos ordenados a procesar
        if cods_limpios:
            cods_a_procesar = sorted(cods_limpios)
        elif rutas_map:
            cods_a_procesar = sorted(list(set(rutas_map.keys())))
        else:
            cods_a_procesar = []

        for cod in cods_a_procesar:
            if not cod:
                continue
            r_obj = (
                rutas_map.get(cod) or
                rutas_map.get(cod.zfill(2) if cod.isdigit() else cod) or
                rutas_map.get(str(int(cod)) if cod.isdigit() else cod)
            )
            if not r_obj and len(rutas_objs) == 1 and len(cods_a_procesar) == 1:
                r_obj = rutas_objs[0]
            if r_obj:
                origen = r_obj.get("origen")
                origen_nom = origen.get("nombre") if isinstance(origen, dict) else str(origen or "")

                destino = r_obj.get("destino")
                destino_nom = destino.get("nombre") if isinstance(destino, dict) else str(destino or "")

                itinerario = r_obj.get("itinerario")
                itin_items = []
                if isinstance(itinerario, list):
                    for it in itinerario:
                        if isinstance(it, dict):
                            nom = it.get("nombre") or it.get("descripcion") or ""
                            if nom:
                                itin_items.append(str(nom))
                        elif isinstance(it, str) and it.strip():
                            itin_items.append(it.strip())
                elif isinstance(itinerario, str) and itinerario.strip():
                    itin_items.append(itinerario.strip())
                itin_str = " - ".join(itin_items)

                frecuencia = r_obj.get("frecuencia")
                frec = ""
                if isinstance(frecuencia, dict):
                    frec = frecuencia.get("descripcion") or frecuencia.get("tipo") or ""
                elif isinstance(frecuencia, str):
                    frec = frecuencia
                frec = frec.strip()
                if frec.startswith("(") and frec.endswith(")"):
                    frec = frec[1:-1].strip()

                partes_tramo = [p for p in [origen_nom, itin_str, destino_nom] if p]
                tramo = " - ".join(partes_tramo)

                frec_display = f" {frec}" if frec else ""
                rutas_lineas.append(f"Ruta {cod}: {tramo}{frec_display}")
                rutas_para_frontend.append({
                    "codigo": cod,
                    "origen": origen_nom,
                    "itinerario": itin_str,
                    "destino": destino_nom,
                    "tramo": tramo,
                    "frecuencia": frec
                })
            else:
                rutas_lineas.append(f"Ruta {cod}")
                rutas_para_frontend.append({
                    "codigo": cod,
                    "origen": "",
                    "itinerario": "",
                    "destino": "",
                    "tramo": f"Ruta {cod}",
                    "frecuencia": ""
                })

        tabla_rutas_text = "\n".join(rutas_lineas) if rutas_lineas else "SIN RUTAS ASIGNADAS"

        # 6. Acto resolutivo final para el reverso de la TUC
        # Regla: Sigla de trámite si es Incremento (I) o Sustitución (S).
        # Si es Renovación (o autorización inicial), toda la fila en blanco.
        # Si es Duplicado, de acuerdo a su trámite original.
        acto_reverso = await TucDocumentService.determinar_acto_resolutivo_reverso(
            db, vehiculo, nro_primigenia_raw, fecha_res_p
        )
        es_fila_en_blanco = acto_reverso["es_en_blanco"]
        num_resolucion_final = acto_reverso["num_resolucion"]
        fecha_res_final = acto_reverso["fecha_resolucion"]
        tipo_res_final = acto_reverso["sigla"]
        siglas_acto = acto_reverso.get("siglas_institucion") or ""
        num_res_acto_completo = acto_reverso.get("num_resolucion_completo") or ""
        res_prim_completa = f"{nro_res_p}-{siglas_res_p}" if (nro_res_p and nro_res_p != "-" and siglas_res_p) else nro_res_p

        # 7. Determinar si corresponde texto condicional "DUPLICADO" o "RENOVACIÓN"
        tuc_doc = await db.tucs.find_one({"placa": {"$regex": f"^{re.escape(placa)}$", "$options": "i"}}) if (db is not None and placa) else None
        tipo_tramite_raw = (
            vehiculo.get("tipo_resolucion_hija") or 
            vehiculo.get("tipo_tramite_origen") or 
            vehiculo.get("tramite") or 
            (tuc_doc.get("motivoEmision") if tuc_doc else "") or 
            (tuc_doc.get("tipoTramite") if tuc_doc else "") or 
            ""
        ).strip().upper()

        es_duplicado = tipo_tramite_raw in ["D", "DUPLICADO"] or "DUPLICADO" in tipo_tramite_raw
        es_renovacion = tipo_tramite_raw in ["R", "RENOVACION", "RENOVACIÓN"] or "RENOVACION" in tipo_tramite_raw or "RENOVACIÓN" in tipo_tramite_raw

        texto_duplicado = "DUPLICADO" if es_duplicado else ""
        texto_renovacion = "RENOVACIÓN" if es_renovacion else ""

        # Mapeo completo de las etiquetas oficiales
        placeholders = {
            "{{FECHA_DEL}}": fecha_del,
            "{{FECHA_AL}}": fecha_al,
            "{{RES}}": nro_res_p,
            "{{SIGLAS_RES_P}}": siglas_res_p,
            "{{RES_CON_SIGLAS}}": res_prim_completa,
            "{{FECHA_RES_P}}": fecha_res_p,
            "{{EMPRESA}}": razon_social,
            "{{RUC}}": ruc,
            "{{PARTIDA}}": partida,
            "{{PLACA}}": placa,
            "{{COLOR}}": color,
            "{{MARCA}}": marca,
            "{{VIN}}": vin,
            "{{ANIO}}": anio,
            "{{ASIENTOS}}": asientos,
            "{{ALTO}}": alto,
            "{{PESO_NETO}}": peso_neto,
            "{{CATEGORIA}}": categoria,
            "{{EJES}}": ejes,
            "{{ANCHO}}": ancho,
            "{{CARGA_UTIL}}": carga_util,
            "{{LARGO}}": largo,
            "{{PESO_BRUTO}}": peso_bruto,
            "{{TABLA_RUTAS}}": tabla_rutas_text,
            "{{NUM_RESOLUCION}}": num_resolucion_final,
            "{{SIGLAS_RES_ACTO}}": siglas_acto,
            "{{NUM_RESOLUCION_ACTO_CON_SIGLAS}}": num_res_acto_completo,
            "{{FECHA_RES}}": fecha_res_final,
            "{{TIPO_RES}}": tipo_res_final,
            "{{DUPLICADO}}": texto_duplicado,
            "{{RENOVACION}}": texto_renovacion
        }

        datos_estructurados = {
            "placa": placa,
            "numero_tuc": vehiculo.get("numero_tuc") or vehiculo.get("tuc") or "",
            "ruc": ruc,
            "empresa": razon_social,
            "partida": partida,
            "fecha_del": fecha_del,
            "fecha_al": fecha_al,
            "nro_resolucion_primigenia": nro_res_p,
            "tipo_tramite": tipo_tramite_raw,
            "es_duplicado": es_duplicado,
            "es_renovacion": es_renovacion,
            "es_fila_en_blanco": es_fila_en_blanco,
            "siglas_resolucion_primigenia": siglas_res_p,
            "resolucion_primigenia_completa": res_prim_completa,
            "fecha_resolucion_primigenia": fecha_res_p,
            "color": color,
            "marca": marca,
            "vin": vin,
            "anio": anio,
            "asientos": asientos,
            "alto": alto,
            "ancho": ancho,
            "largo": largo,
            "peso_neto": peso_neto,
            "peso_bruto": peso_bruto,
            "carga_util": carga_util,
            "categoria": categoria,
            "ejes": ejes,
            "rutas_detalle": rutas_para_frontend,
            "tabla_rutas_text": tabla_rutas_text,
            "num_resolucion_acto": num_resolucion_final,
            "siglas_resolucion_acto": siglas_acto,
            "resolucion_acto_completa": num_res_acto_completo,
            "fecha_resolucion_acto": fecha_res_final,
            "tipo_resolucion_acto": tipo_res_final,
            "es_fila_en_blanco": es_fila_en_blanco,
            "texto_acto_reverso": acto_reverso["texto_completo"]
        }

        return {
            "placeholders": placeholders,
            "datos_estructurados": datos_estructurados,
            "placa": placa,
            "numero_tuc": vehiculo.get("numero_tuc") or vehiculo.get("tuc") or "",
            "vehiculo_id": str(vehiculo.get("_id")) if vehiculo.get("_id") else None,
            "vehiculo_raw_id": vehiculo.get("id"),
            "link_tuc": vehiculo.get("link_tuc"),
            "ruc": ruc
        }

    @staticmethod
    def _reemplazar_en_parrafo(p, old_text: str, new_text: str):
        if old_text not in p.text:
            return
        full_text = p.text.replace(old_text, str(new_text))
        if p.runs:
            p.runs[0].text = full_text
            for r in p.runs[1:]:
                r.text = ""
        else:
            p.text = full_text

    @staticmethod
    async def generar_docx_tuc(placa_o_id: str, placeholders_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Abre la plantilla oficial .docx y sustituye los campos con la data real,
        insertando la tabla de rutas estructurada con 4 columnas y bordes transparentes.
        """
        if not os.path.exists(TEMPLATE_PATH):
            raise FileNotFoundError(f"No se encontró la plantilla oficial de TUC en {TEMPLATE_PATH}")

        tuc_info = await TucDocumentService.get_tuc_data(placa_o_id)
        placeholders = tuc_info["placeholders"]
        placa = tuc_info["placa"]
        rutas_detalle = tuc_info["datos_estructurados"].get("rutas_detalle", [])
        es_fila_blanco = tuc_info["datos_estructurados"].get("es_fila_en_blanco", False)

        tag_map = {
            "fecha_del": "{{FECHA_DEL}}",
            "fecha_al": "{{FECHA_AL}}",
            "nro_resolucion_primigenia": "{{RES}}",
            "nro_resolucion": "{{RES}}",
            "res": "{{RES}}",
            "fecha_resolucion_primigenia": "{{FECHA_RES_P}}",
            "empresa": "{{EMPRESA}}",
            "razon_social": "{{EMPRESA}}",
            "ruc": "{{RUC}}",
            "partida": "{{PARTIDA}}",
            "placa": "{{PLACA}}",
            "color": "{{COLOR}}",
            "marca": "{{MARCA}}",
            "vin": "{{VIN}}",
            "anio": "{{ANIO}}",
            "asientos": "{{ASIENTOS}}",
            "alto": "{{ALTO}}",
            "peso_neto": "{{PESO_NETO}}",
            "categoria": "{{CATEGORIA}}",
            "ejes": "{{EJES}}",
            "ancho": "{{ANCHO}}",
            "carga_util": "{{CARGA_UTIL}}",
            "largo": "{{LARGO}}",
            "peso_bruto": "{{PESO_BRUTO}}",
            "tabla_rutas_text": "{{TABLA_RUTAS}}",
            "rutas": "{{TABLA_RUTAS}}",
            "num_resolucion_acto": "{{NUM_RESOLUCION}}",
            "fecha_resolucion_acto": "{{FECHA_RES}}",
            "tipo_resolucion_acto": "{{TIPO_RES}}"
        }

        if placeholders_override:
            for k, v in placeholders_override.items():
                if v is None:
                    continue
                v_str = str(v).strip()
                if k.startswith("{{") and k.endswith("}}"):
                    placeholders[k] = v_str
                else:
                    t = tag_map.get(k.lower())
                    if t:
                        placeholders[t] = v_str

        doc = docx.Document(TEMPLATE_PATH)

        # 1. Insertar la tabla de rutas en lugar del marcador {{TABLA_RUTAS}}
        for p in list(doc.paragraphs):
            if "{{TABLA_RUTAS}}" in p.text:
                tbl_el = TucDocumentService._build_routes_table(rutas_detalle)
                p._p.addprevious(tbl_el)
                p._p.getparent().remove(p._p)
                break

        # 2. Reemplazar los demás marcadores en párrafos restantes
        for p in doc.paragraphs:
            if es_fila_blanco and ("{{NUM_RESOLUCION}}" in p.text or p.text.strip().startswith("R.D.R")):
                p.text = ""
                continue
            for k, v in placeholders.items():
                if k == "{{TABLA_RUTAS}}":
                    continue
                TucDocumentService._reemplazar_en_parrafo(p, k, v)

        # 3. Reemplazar en tablas (Ficha técnica anverso)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        for k, v in placeholders.items():
                            if k == "{{TABLA_RUTAS}}":
                                continue
                            TucDocumentService._reemplazar_en_parrafo(p, k, v)

        # 3. Reemplazar en tablas (Ficha técnica anverso)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        for k, v in placeholders.items():
                            if k == "{{TABLA_RUTAS}}":
                                continue
                            TucDocumentService._reemplazar_en_parrafo(p, k, v)

        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)

        filename = f"TUC_{placa.replace('-', '_')}.docx"
        return {
            "buffer": buffer,
            "filename": filename,
            "placa": placa,
            "datos": tuc_info["datos_estructurados"]
        }

    @staticmethod
    async def get_datos_impresion(placa_o_id: str) -> Dict[str, Any]:
        """
        Retorna la data completa y estructurada lista para la vista previa de impresión
        HTML/CSS directamente en el navegador del operador.
        """
        tuc_info = await TucDocumentService.get_tuc_data(placa_o_id)
        return {
            "placa": tuc_info["placa"],
            "numero_tuc": tuc_info["numero_tuc"],
            "datos": tuc_info["datos_estructurados"],
            "placeholders": tuc_info["placeholders"]
        }
