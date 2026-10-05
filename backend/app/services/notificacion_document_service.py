import os
import re
import base64
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

_ESCUDO_B64: Optional[str] = None
_DRTC_LOGO_B64: Optional[str] = None

def _get_escudo_b64() -> str:
    global _ESCUDO_B64
    if _ESCUDO_B64 is None:
        posibles = [
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "src", "assets", "images", "escudo-region-puno.png"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist", "sirret-frontend", "assets", "images", "escudo-region-puno.png")
        ]
        for p in posibles:
            if os.path.exists(p):
                try:
                    with open(p, "rb") as f:
                        _ESCUDO_B64 = base64.b64encode(f.read()).decode("utf-8")
                        break
                except Exception:
                    pass
        if _ESCUDO_B64 is None:
            _ESCUDO_B64 = ""
    return _ESCUDO_B64

def _get_drtc_logo_b64() -> str:
    global _DRTC_LOGO_B64
    if _DRTC_LOGO_B64 is None:
        posibles = [
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "banner_drtc.png"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "src", "assets", "images", "drtc-logo-dark.png")
        ]
        for p in posibles:
            if os.path.exists(p):
                try:
                    with open(p, "rb") as f:
                        _DRTC_LOGO_B64 = base64.b64encode(f.read()).decode("utf-8")
                        break
                except Exception:
                    pass
        if _DRTC_LOGO_B64 is None:
            _DRTC_LOGO_B64 = ""
    return _DRTC_LOGO_B64

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
                query_flota["nro_resolucion_hija"] = nro_hija_raw
            else:
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

        # Obtener ruta por defecto si alguna unidad no tiene rutas asignadas
        ruta_default = "01"
        try:
            clean_res_query = clean_num_resolucion(nro_res)
            q_r = {
                "$or": [
                    {"resolucion.nroResolucion": {"$regex": f"{re.escape(clean_res_query)}", "$options": "i"}},
                    {"empresa.ruc": ruc},
                    {"ruc": ruc}
                ]
            }
            r_doc = await db.rutas.find_one(q_r)
            if r_doc:
                raw_c = r_doc.get("codigoRuta") or r_doc.get("codigo") or r_doc.get("codigo_ruta")
                if raw_c:
                    s_c = str(raw_c).strip()
                    ruta_default = s_c.zfill(2) if s_c.isdigit() else s_c
        except Exception as e_r:
            logger.warning(f"Error al buscar ruta para notificación: {e_r}")

        lista_vehiculos_tabla = []
        for index, v in enumerate(vehiculos_flota[:35], 1):
            p = (v.get("placa") or "-").strip().upper()
            v_data = await db.vehiculos_data.find_one({"$or": [{"placa_actual": p}, {"placa": p}]})
            
            # Año de fabricación
            anio = "-"
            if v_data:
                anio = str(v_data.get("anio_fabricacion") or v_data.get("anio_modelo") or "")
            if not anio or anio == "-":
                anio = str(v.get("anio_fabricacion") or v.get("anio_modelo") or "-")
            
            # Categoría
            cat = "-"
            if v_data:
                cat = (v_data.get("categoria") or "").strip().upper()
            if not cat or cat == "-":
                cat = (v.get("categoria") or "-").strip().upper()
            
            # Número TUC (limpiar prefijo T- si es numérico)
            raw_tuc = str(v.get("numero_tuc") or v.get("tuc") or "-").strip()
            if raw_tuc.startswith("T-") and len(raw_tuc) > 2:
                tuc_display = raw_tuc[2:].strip()
            elif raw_tuc.startswith("T") and len(raw_tuc) > 1 and raw_tuc[1:].isdigit():
                tuc_display = raw_tuc[1:].strip()
            else:
                tuc_display = raw_tuc

            # Rutas
            rutas_list = v.get("rutas", [])
            if rutas_list and isinstance(rutas_list, list):
                cods_fmt = []
                for c in rutas_list:
                    cs = str(c).strip()
                    cods_fmt.append(cs.zfill(2) if cs.isdigit() else cs)
                rutas_str = ", ".join(cods_fmt)
            elif v.get("ruta"):
                rs = str(v.get("ruta")).strip()
                rutas_str = rs.zfill(2) if rs.isdigit() else rs
            else:
                rutas_str = ruta_default

            lista_vehiculos_tabla.append({
                "item": index,
                "placa": p,
                "tuc": tuc_display,
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
        coincidiendo exactamente con el formato oficial de la DRTC Puno.
        """
        num_res = data.get("numRes", "-")
        fecha_res = data.get("fechaRes", "-")
        motivo_res = data.get("motivoRes", "-")
        razon_social = data.get("razonSocial", "-")
        ruc = data.get("ruc", "-")
        update_date = data.get("update", datetime.now().strftime("%d/%m/%Y"))
        vehiculos = data.get("vehiculos", [])

        # Subtítulo de resolución
        clean_res = str(num_res).strip()
        if "-GRP" in clean_res.upper():
            res_subtitle = f"RESOLUCIÓN DIRECTORAL REGIONAL N° {clean_res}({fecha_res})"
        else:
            res_subtitle = f"RESOLUCIÓN DIRECTORAL REGIONAL N° {clean_res}-GRP/GRI/DRTC({fecha_res})"

        escudo_b64 = _get_escudo_b64()
        drtc_b64 = _get_drtc_logo_b64()

        tabla_rows_html = ""
        if vehiculos:
            for v in vehiculos:
                tabla_rows_html += f"""
                <tr>
                    <td class="col-item">{v.get('item')}</td>
                    <td class="col-placa">{v.get('placa')}</td>
                    <td class="col-tuc">{v.get('tuc')}</td>
                    <td class="col-anio">{v.get('anio')}</td>
                    <td class="col-cat">{v.get('categoria')}</td>
                    <td class="col-ruta">{v.get('ruta')}</td>
                </tr>"""
        else:
            tabla_rows_html = '<tr><td colspan="6" style="text-align: center; font-style: italic; color: #64748b; padding: 12px;">SIN VEHÍCULOS REGISTRADOS</td></tr>'

        html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>NOTIFICACIÓN - {clean_res} | DRTC Puno</title>
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
        .btn-close:hover {{ background: rgba(255,255,255,0.25); }}

        /* HOJA A4 */
        .a4-sheet {{
            width: 210mm;
            min-height: 297mm;
            background: #ffffff;
            padding: 18mm 20mm;
            box-shadow: 0 15px 45px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
        }}

        /* BANNER INSTITUCIONAL */
        .banner-institucional {{
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 12px;
        }}
        .banner-escudo {{
            height: 52px;
            width: auto;
            object-fit: contain;
        }}
        .banner-bloques {{
            display: flex;
            align-items: center;
            height: 38px;
        }}
        .banner-block {{
            height: 38px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
            color: #ffffff !important;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 7.2px;
            font-weight: 800;
            line-height: 1.15;
            padding: 0 8px;
            letter-spacing: 0.1px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }}
        .banner-red {{
            background-color: #cc0000 !important;
        }}
        .banner-black {{
            background-color: #000000 !important;
        }}
        .banner-gray {{
            background-color: #71717a !important;
        }}
        .banner-drtc {{
            height: 48px;
            width: auto;
            object-fit: contain;
            margin-left: 4px;
        }}

        /* LEMA AÑO */
        .lema-header {{
            text-align: center;
            font-size: 10.5px;
            font-style: italic;
            margin-bottom: 16px;
            color: #1e293b;
        }}

        /* TITULO NOTIFICACION */
        .doc-title {{
            text-align: center;
            font-size: 14.5px;
            font-weight: bold;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }}

        .res-subtitle {{
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 4px;
        }}

        .res-motivo {{
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            font-style: italic;
            margin-bottom: 18px;
            text-transform: uppercase;
        }}

        /* TABLA DATOS EMPRESA */
        .empresa-table {{
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #d1d5db;
            margin-bottom: 18px;
            font-size: 11px;
        }}
        .empresa-table td {{
            border: 1px solid #e5e7eb;
            padding: 6px 8px;
            vertical-align: middle;
        }}
        .td-rs-lbl {{
            width: 55px;
            font-size: 10.5px;
            line-height: 1.2;
            color: #000;
        }}
        .td-sep {{
            width: 12px;
            text-align: center;
            font-weight: bold;
            padding: 6px 2px !important;
        }}
        .td-rs-val {{
            font-weight: bold;
            text-transform: uppercase;
            color: #000;
            font-size: 11px;
        }}
        .td-ruc-lbl {{
            width: 48px;
            text-align: right;
            white-space: nowrap;
            font-size: 10.5px;
        }}
        .td-ruc-val {{
            width: 120px;
            font-weight: bold;
            font-size: 11.5px;
            white-space: nowrap;
        }}

        /* FORMULARIO RECEPTOR DE NOTIFICACION */
        .receptor-box {{
            display: flex;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 10px 0;
            margin-bottom: 18px;
            font-size: 10.5px;
        }}
        .receptor-col-left {{
            flex: 1.15;
            padding-right: 16px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 10px;
        }}
        .receptor-col-right {{
            flex: 0.85;
            border-left: 1.5px solid #000;
            padding-left: 16px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }}
        .form-row {{
            display: flex;
            align-items: flex-end;
            gap: 6px;
        }}
        .lbl-multi {{
            width: 68px;
            line-height: 1.15;
            font-size: 10.5px;
            white-space: nowrap;
        }}
        .lbl-single {{
            width: 68px;
            font-size: 10.5px;
        }}
        .line-dotted {{
            flex: 1;
            border-bottom: 1.2px dotted #000;
            margin-bottom: 2px;
            min-height: 12px;
        }}
        .firma-header {{
            font-size: 10.5px;
            margin-bottom: 2px;
        }}
        .firma-space {{
            height: 48px;
        }}
        .firma-line-box {{
            display: flex;
            justify-content: flex-end;
            margin-bottom: 8px;
        }}
        .line-dotted-firma {{
            width: 84%;
            border-bottom: 1.2px dotted #000;
        }}
        .dni-row {{
            display: flex;
            align-items: flex-end;
            justify-content: flex-end;
            gap: 6px;
        }}
        .lbl-dni {{
            font-size: 10.5px;
        }}
        .line-dotted-dni {{
            width: 74%;
            border-bottom: 1.2px dotted #000;
            min-height: 12px;
        }}

        /* TABLA DE VEHICULOS INVOLUCRADOS */
        .tabla-vehiculos {{
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000;
            font-size: 10px;
            margin-bottom: 24px;
        }}
        .tabla-vehiculos th {{
            border: 1px solid #000;
            background-color: #ffffff;
            padding: 6px 4px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 0.2px;
            text-transform: uppercase;
        }}
        .tabla-vehiculos td {{
            border: 1px solid #000;
            padding: 5px 4px;
            vertical-align: middle;
        }}
        .col-item {{
            text-align: center;
            font-weight: bold;
            width: 45px;
        }}
        .col-placa {{
            text-align: center;
            font-weight: bold;
            font-family: 'Roboto Mono', monospace, Arial;
            width: 100px;
        }}
        .col-tuc {{
            text-align: center;
            font-family: 'Roboto Mono', monospace, Arial;
            width: 110px;
        }}
        .col-anio {{
            text-align: center;
            width: 70px;
        }}
        .col-cat {{
            text-align: center;
            width: 95px;
        }}
        .col-ruta {{
            text-align: center;
            font-weight: bold;
            width: 75px;
        }}

        /* PIE DE ELABORACION */
        .notif-footer {{
            margin-top: auto;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            padding: 25px 0 10px 0;
        }}

        @media print {{
            @page {{
                size: A4 portrait;
                margin: 12mm 15mm;
            }}
            body {{ background: #fff !important; padding: 0 !important; }}
            .toolbar {{ display: none !important; }}
            .a4-sheet {{ box-shadow: none !important; padding: 0 !important; width: 100% !important; min-height: auto !important; }}
            .banner-block {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}
            .banner-red {{ background-color: #cc0000 !important; }}
            .banner-black {{ background-color: #000000 !important; }}
            .banner-gray {{ background-color: #71717a !important; }}
        }}
    </style>
</head>
<body>

    <!-- TOOLBAR (Navegación) -->
    <div class="toolbar">
        <div class="toolbar-title">
            Cédula de Notificación — R.D.R. N° {clean_res} (Formato Oficial DRTC Puno)
        </div>
        <div>
            <button class="btn-print" onclick="window.print()">Imprimir Cédula (Ctrl+P)</button>
            <button class="btn-close" onclick="window.close()">Cerrar</button>
        </div>
    </div>

    <!-- HOJA A4 -->
    <div class="a4-sheet">

        <!-- BANNER INSTITUCIONAL OFICIAL -->
        <div class="banner-institucional">
            {f'<img src="data:image/png;base64,{escudo_b64}" class="banner-escudo" alt="Escudo">' if escudo_b64 else ''}
            <div class="banner-bloques">
                <div class="banner-block banner-red">
                    <span>GOBIERNO</span>
                    <span>REGIONAL</span>
                    <span>PUNO</span>
                </div>
                <div class="banner-block banner-black">
                    <span>DIRECCION REGIONAL DE</span>
                    <span>TRANSPORTES Y</span>
                    <span>COMUNICACIONES PUNO</span>
                </div>
                <div class="banner-block banner-gray">
                    <span>DIRECCIÓN DE</span>
                    <span>CIRCULACIÓN</span>
                    <span>TERRESTRE</span>
                </div>
            </div>
            {f'<img src="data:image/png;base64,{drtc_b64}" class="banner-drtc" alt="DRTC-P">' if drtc_b64 else ''}
        </div>

        <div class="lema-header">“Año del Fortalecimiento de la Soberanía Nacional”</div>

        <div class="doc-title">NOTIFICACIÓN</div>
        <div class="res-subtitle">{res_subtitle}</div>
        <div class="res-motivo">({motivo_res})</div>

        <!-- DATOS EMPRESA (TABLA OFICIAL) -->
        <table class="empresa-table">
            <tr>
                <td class="td-rs-lbl">Razón<br>Social</td>
                <td class="td-sep">:</td>
                <td class="td-rs-val">{razon_social}</td>
                <td class="td-ruc-lbl">RUC :</td>
                <td class="td-ruc-val">{ruc}</td>
            </tr>
        </table>

        <!-- FORMULARIO RECEPCION NOTIFICACION -->
        <div class="receptor-box">
            <div class="receptor-col-left">
                <div class="form-row">
                    <span class="lbl-multi">Nombres y<br>Apellidos:</span>
                    <div class="line-dotted"></div>
                </div>
                <div class="form-row">
                    <span class="lbl-single">Cargo:</span>
                    <div class="line-dotted"></div>
                </div>
                <div class="form-row">
                    <span class="lbl-single">Teléfono:</span>
                    <div class="line-dotted"></div>
                </div>
                <div class="form-row">
                    <span class="lbl-single">Fecha:</span>
                    <div class="line-dotted"></div>
                </div>
            </div>
            <div class="receptor-col-right">
                <div class="firma-header">Firma:</div>
                <div class="firma-space"></div>
                <div class="firma-line-box">
                    <div class="line-dotted-firma"></div>
                </div>
                <div class="dni-row">
                    <span class="lbl-dni">DNI:</span>
                    <div class="line-dotted-dni"></div>
                </div>
            </div>
        </div>

        <!-- TABLA VEHICULOS INVOLUCRADOS (ITEM, PLACA, NUMERO TUC, AÑO, CATEGORIA, RUTA) -->
        <table class="tabla-vehiculos">
            <thead>
                <tr>
                    <th style="width: 45px;">ITEM</th>
                    <th style="width: 100px;">PLACA</th>
                    <th style="width: 110px;">NUMERO TUC</th>
                    <th style="width: 70px;">AÑO</th>
                    <th style="width: 100px;">CATEGORIA</th>
                    <th style="width: 80px;">RUTA</th>
                </tr>
            </thead>
            <tbody>
                {tabla_rows_html}
            </tbody>
        </table>

        <!-- FOOTER ELABORACION TUC -->
        <div class="notif-footer">
            Fecha de elaboración de TUC:"{update_date}"
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
