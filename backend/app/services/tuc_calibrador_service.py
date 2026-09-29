import io
import re
from html import escape as html_escape
import base64
from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
import qrcode

from app.dependencies.db import get_database
from app.services.tuc_document_service import TucDocumentService

def formatear_comillas_y_estilos(texto: str, resaltar_comillas: bool = True) -> str:
    """
    Formatea el texto para el TUC. Si resaltar_comillas es True, las partes entre comillas
    ("...", “...”, o «...») se resaltan automáticamente en negrita y un tamaño más (+15% / +1.2pt).
    """
    if not texto:
        return ""
    if not resaltar_comillas:
        return html_escape(str(texto))

    patron = re.compile(r'(".*?"|“.*?”|«.*?»)')
    partes = patron.split(str(texto))
    res = []
    for parte in partes:
        if not parte:
            continue
        if (parte.startswith('"') and parte.endswith('"')) or \
           (parte.startswith('“') and parte.endswith('”')) or \
           (parte.startswith('«') and parte.endswith('»')):
            escaped = html_escape(parte)
            res.append(f'<span class="tuc-quoted" style="font-weight: bold; font-size: 1.15em; display: inline;">{escaped}</span>')
        else:
            res.append(html_escape(parte))
    return "".join(res)

def generar_qr_base64(contenido: str) -> str:
    """Genera una imagen PNG en Base64 con el código QR del contenido dado."""
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=4,
            border=1
        )
        qr.add_data(contenido)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("utf-8")
    except Exception as e:
        return ""


# Configuración base oficial por defecto con las 25 variables oficiales
DEFAULT_VARIABLES: List[Dict[str, Any]] = [
    # --- AUTORIZACIÓN Y EMPRESA (ANVERSO) ---
    {
        "id": "fecha_del",
        "tag": "{{FECHA_DEL}}",
        "label": "Fecha Inicio Vigencia",
        "categoria": "autorizacion",
        "seccion": "anverso",
        "x_mm": 44.0,
        "y_mm": 8.0,
        "font_size_pt": 7.5,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "DEL: ",
        "valor_ejemplo": "21/12/2022"
    },
    {
        "id": "fecha_al",
        "tag": "{{FECHA_AL}}",
        "label": "Fecha Fin Vigencia",
        "categoria": "autorizacion",
        "seccion": "anverso",
        "x_mm": 67.0,
        "y_mm": 8.0,
        "font_size_pt": 7.5,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "AL: ",
        "valor_ejemplo": "21/12/2026"
    },
    {
        "id": "res_primigenia",
        "tag": "{{RES}}",
        "label": "N° Resolución Primigenia",
        "categoria": "autorizacion",
        "seccion": "anverso",
        "x_mm": 40.0,
        "y_mm": 12.0,
        "font_size_pt": 7.5,
        "font_weight": "bold",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "R.D.R. N° ",
        "valor_ejemplo": "0392-2023"
    },
    {
        "id": "fecha_res_p",
        "tag": "{{FECHA_RES_P}}",
        "label": "Fecha Emisión Res. Primigenia",
        "categoria": "autorizacion",
        "seccion": "anverso",
        "x_mm": 68.0,
        "y_mm": 12.0,
        "font_size_pt": 7.5,
        "font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "(",
        "suffix": ")",
        "valor_ejemplo": "20/06/2023"
    },
    {
        "id": "empresa",
        "tag": "{{EMPRESA}}",
        "label": "Razón Social Empresa",
        "categoria": "autorizacion",
        "seccion": "anverso",
        "x_mm": 28.0,
        "y_mm": 16.5,
        "width_mm": 55.0,
        "font_size_pt": 7.5,
        "font_weight": "normal",
        "max_lineas": 2,
        "resaltar_comillas": True,
        "color": "#000000",
        "align": "left",
        "visible": True,
        "valor_ejemplo": "\"CORPORACION SAN MARCOS\" INDUSTRIA, COMERCIO Y SERVICIOS - EIRL"
    },
    {
        "id": "ruc",
        "tag": "{{RUC}}",
        "label": "RUC Empresa",
        "categoria": "autorizacion",
        "seccion": "anverso",
        "x_mm": 34.0,
        "y_mm": 24.0,
        "font_size_pt": 7.5,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "RUC : ",
        "valor_ejemplo": "20448217028"
    },
    {
        "id": "partida",
        "tag": "{{PARTIDA}}",
        "label": "Partida Registral",
        "categoria": "autorizacion",
        "seccion": "anverso",
        "x_mm": 68.0,
        "y_mm": 24.0,
        "font_size_pt": 7.5,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Partida: ",
        "valor_ejemplo": "11098008"
    },

    # --- FICHA TÉCNICA VEHICULAR (ANVERSO) ---
    {
        "id": "placa",
        "tag": "{{PLACA}}",
        "label": "Placa del Vehículo",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 16.0,
        "y_mm": 28.5,
        "font_size_pt": 8.0,
        "font_weight": "bold",
        "etiqueta_font_weight": "bold",
        "color": "#1d4ed8",
        "align": "left",
        "visible": True,
        "prefix": "Placa : ",
        "valor_ejemplo": "VBE-959"
    },
    {
        "id": "color",
        "tag": "{{COLOR}}",
        "label": "Color",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 48.0,
        "y_mm": 28.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Color : ",
        "valor_ejemplo": "BLANCO"
    },
    {
        "id": "marca",
        "tag": "{{MARCA}}",
        "label": "Marca",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 16.0,
        "y_mm": 32.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Marca : ",
        "valor_ejemplo": "MERCEDES BENZ"
    },
    {
        "id": "vin",
        "tag": "{{VIN}}",
        "label": "VIN / Serie",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 48.0,
        "y_mm": 32.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "VIN/Serie : ",
        "valor_ejemplo": "8AC906633GE128843"
    },
    {
        "id": "anio",
        "tag": "{{ANIO}}",
        "label": "Año Fabricación / Modelo",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 16.0,
        "y_mm": 36.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Fab./Mod. : ",
        "valor_ejemplo": "2016"
    },
    {
        "id": "asientos",
        "tag": "{{ASIENTOS}}",
        "label": "N° Asientos",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 38.0,
        "y_mm": 36.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Asientos : ",
        "valor_ejemplo": "16"
    },
    {
        "id": "alto",
        "tag": "{{ALTO}}",
        "label": "Altura (m)",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 54.0,
        "y_mm": 36.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Alto : ",
        "valor_ejemplo": "2.86"
    },
    {
        "id": "peso_neto",
        "tag": "{{PESO_NETO}}",
        "label": "Peso Neto (t)",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 70.0,
        "y_mm": 36.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Peso Neto : ",
        "valor_ejemplo": "2.63"
    },
    {
        "id": "categoria",
        "tag": "{{CATEGORIA}}",
        "label": "Categoría Vehicular",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 16.0,
        "y_mm": 40.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Categoría : ",
        "valor_ejemplo": "M2-C3"
    },
    {
        "id": "ejes",
        "tag": "{{EJES}}",
        "label": "N° Ejes",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 38.0,
        "y_mm": 40.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Ejes : ",
        "valor_ejemplo": "2"
    },
    {
        "id": "ancho",
        "tag": "{{ANCHO}}",
        "label": "Ancho (m)",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 54.0,
        "y_mm": 40.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Ancho : ",
        "valor_ejemplo": "1.99"
    },
    {
        "id": "carga_util",
        "tag": "{{CARGA_UTIL}}",
        "label": "Carga Útil (t)",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 70.0,
        "y_mm": 40.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Carga Útil : ",
        "valor_ejemplo": "1.25"
    },
    {
        "id": "largo",
        "tag": "{{LARGO}}",
        "label": "Largo (m)",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 54.0,
        "y_mm": 44.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Largo : ",
        "valor_ejemplo": "5.93"
    },
    {
        "id": "peso_bruto",
        "tag": "{{PESO_BRUTO}}",
        "label": "Peso Bruto (t)",
        "categoria": "vehiculo",
        "seccion": "anverso",
        "x_mm": 70.0,
        "y_mm": 44.5,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "Peso Bruto : ",
        "valor_ejemplo": "3.88"
    },

    # --- RUTAS AUTORIZADAS (REVERSO) ---
    {
        "id": "tabla_rutas",
        "tag": "{{TABLA_RUTAS}}",
        "label": "Tabla de Rutas Autorizadas",
        "categoria": "rutas",
        "seccion": "reverso",
        "x_mm": 12.0,
        "y_mm": 60.0,
        "width_mm": 68.0,
        "font_size_pt": 6.5,
        "font_weight": "normal",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "valor_ejemplo": "Ruta 01: JULIACA - PUTINA - QUILCAPUNO - ANANEA - C.P. LA RINCONADA - C.P. CERRO LUNAR 20 DIARIAS"
    },

    # --- ACTO RESOLUTIVO MODIFICATORIO (REVERSO) ---
    {
        "id": "num_resolucion",
        "tag": "{{NUM_RESOLUCION}}",
        "label": "N° Resolución Hija / Acto",
        "categoria": "acto_reverso",
        "seccion": "reverso",
        "x_mm": 26.0,
        "y_mm": 88.0,
        "font_size_pt": 7.0,
        "font_weight": "bold",
        "etiqueta_font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "R.D.R N° ",
        "valor_ejemplo": "0452-2024"
    },
    {
        "id": "fecha_res",
        "tag": "{{FECHA_RES}}",
        "label": "Fecha Resolución Hija",
        "categoria": "acto_reverso",
        "seccion": "reverso",
        "x_mm": 56.0,
        "y_mm": 88.0,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "(",
        "suffix": ")",
        "valor_ejemplo": "15/03/2024"
    },
    {
        "id": "tipo_res",
        "tag": "{{TIPO_RES}}",
        "label": "Sigla Trámite (I, S, o Blanco)",
        "categoria": "acto_reverso",
        "seccion": "reverso",
        "x_mm": 72.0,
        "y_mm": 88.0,
        "font_size_pt": 7.0,
        "font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "prefix": "(",
        "suffix": ")",
        "valor_ejemplo": "S"
    },
    # --- ELEMENTOS GRÁFICOS (LOGO Y QR) ---
    {
        "id": "logo_institucional",
        "tag": "{{LOGO}}",
        "label": "Logo Oficial DRTC Puno",
        "tipo": "imagen",
        "categoria": "graficos",
        "seccion": "anverso",
        "x_mm": 6.0,
        "y_mm": 5.0,
        "width_mm": 18.0,
        "height_mm": 15.0,
        "font_size_pt": 0,
        "font_weight": "normal",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "imagen_url": "/assets/images/drtc-logo-light.png",
        "opacidad": 1.0
    },
    {
        "id": "qr_seguridad",
        "tag": "{{QR}}",
        "label": "Código QR de Validación",
        "tipo": "qr",
        "categoria": "graficos",
        "seccion": "reverso",
        "x_mm": 8.0,
        "y_mm": 92.0,
        "width_mm": 14.0,
        "height_mm": 14.0,
        "font_size_pt": 0,
        "font_weight": "normal",
        "color": "#000000",
        "align": "left",
        "visible": True,
        "qr_contenido": "https://drtc-puno.gob.pe/verificar-tuc/{{PLACA}}"
    }
]

DEFAULT_CONFIG: Dict[str, Any] = {
    "nombre": "Plantilla Oficial TUC DRTC Puno",
    "formato_papel": "DUAL_PVC",  # "DUAL_PVC" (85.6x108mm) o "A4" (210x297mm)
    "orientacion": "portrait",    # "portrait" o "landscape"
    "modo_hojas": "UNA_HOJA",     # "UNA_HOJA" o "DOS_HOJAS" (Hoja 1: Anverso, Hoja 2: Reverso)
    "ancho_mm": 85.6,
    "alto_mm": 108.0,
    "anverso_alto_mm": 54.0,
    "reverso_alto_mm": 54.0,
    "margen_izq_mm": 10.0,
    "margen_der_mm": 10.0,
    "margen_top_mm": 10.0,
    "margen_bottom_mm": 10.0,
    "variables": DEFAULT_VARIABLES,
    "activa": True
}


class TucCalibradorService:
    @staticmethod
    async def obtener_configuracion() -> Dict[str, Any]:
        """
        Obtiene la configuración activa del calibrador de variables y posiciones.
        Si no existe en base de datos, inicializa y devuelve la plantilla por defecto.
        """
        db = await get_database()
        if db is None:
            return dict(DEFAULT_CONFIG)
        config = await db.tuc_plantillas_calibrador.find_one({"activa": True})
        if not config:
            config = dict(DEFAULT_CONFIG)
            config["fecha_creacion"] = datetime.utcnow().isoformat()
            res = await db.tuc_plantillas_calibrador.insert_one(config)
            config["_id"] = str(res.inserted_id)
        else:
            config["_id"] = str(config["_id"])
        return config

    @staticmethod
    async def guardar_configuracion(config_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Guarda o actualiza las posiciones, estilos y nuevas variables en la base de datos.
        """
        db = await get_database()
        config_data["fecha_actualizacion"] = datetime.utcnow().isoformat()
        config_data["activa"] = True

        # Limpiar _id si viene en string
        doc_id = config_data.pop("_id", None)
        if doc_id and ObjectId.is_valid(doc_id):
            await db.tuc_plantillas_calibrador.update_one(
                {"_id": ObjectId(doc_id)},
                {"$set": config_data},
                upsert=True
            )
            config_data["_id"] = doc_id
        else:
            res = await db.tuc_plantillas_calibrador.update_one(
                {"activa": True},
                {"$set": config_data},
                upsert=True
            )
            if res.upserted_id:
                config_data["_id"] = str(res.upserted_id)
        return config_data

    @staticmethod
    async def restablecer_configuracion_oficial() -> Dict[str, Any]:
        """
        Restablece la plantilla a las coordenadas y variables oficiales estándar.
        """
        db = await get_database()
        await db.tuc_plantillas_calibrador.delete_many({"activa": True})
        return await TucCalibradorService.obtener_configuracion()

    @staticmethod
    async def generar_html_impresion(placa_o_id: str, config_override: Optional[Dict[str, Any]] = None) -> str:
        """
        Genera el documento HTML completo, autónomo e instantáneo (<0.05s)
        con coordenadas milimétricas exactas listas para impresión física sobre el cartón TUC.
        """
        try:
            tuc_data = await TucDocumentService.get_tuc_data(placa_o_id)
        except Exception:
            tuc_data = {
                "datos_estructurados": {"placa": placa_o_id},
                "placeholders": {
                    "{{PLACA}}": placa_o_id,
                    "{{EMPRESA}}": "EMPRESA DE TRANSPORTE REGIONAL",
                    "{{RUC}}": "20448192031",
                    "{{NRO_TUC}}": "TUC-2025-001"
                }
            }
        datos = tuc_data.get("datos_estructurados", {})
        placeholders = tuc_data.get("placeholders", {})
        rutas_detalle = datos.get("rutas_detalle", [])
        es_fila_en_blanco = datos.get("es_fila_en_blanco", False)

        config = config_override or await TucCalibradorService.obtener_configuracion()
        variables: List[Dict[str, Any]] = config.get("variables", DEFAULT_VARIABLES)

        formato_papel = config.get("formato_papel", "DUAL_PVC")
        orientacion = config.get("orientacion", "portrait")

        if formato_papel == "A4":
            ancho_mm = 210.0 if orientacion == "portrait" else 297.0
            alto_mm = 297.0 if orientacion == "portrait" else 210.0
            css_page = f"size: A4 {orientacion};"
            tuc_card_class = "tuc-sheet a4-format"
        else:
            ancho_mm = config.get("ancho_mm", 85.6)
            alto_mm = config.get("alto_mm", 108.0)
            css_page = f"size: {ancho_mm}mm {alto_mm}mm;"
            tuc_card_class = "tuc-sheet dual-pvc-format"

        anverso_alto_mm = config.get("anverso_alto_mm", 54.0)

        # Mapa de valores reales a inyectar
        valores_map = {
            "{{FECHA_DEL}}": placeholders.get("{{FECHA_DEL}}", ""),
            "{{FECHA_AL}}": placeholders.get("{{FECHA_AL}}", ""),
            "{{RES}}": placeholders.get("{{RES}}", ""),
            "{{FECHA_RES_P}}": placeholders.get("{{FECHA_RES_P}}", ""),
            "{{EMPRESA}}": placeholders.get("{{EMPRESA}}", ""),
            "{{RUC}}": placeholders.get("{{RUC}}", ""),
            "{{PARTIDA}}": placeholders.get("{{PARTIDA}}", ""),
            "{{PLACA}}": placeholders.get("{{PLACA}}", ""),
            "{{COLOR}}": placeholders.get("{{COLOR}}", ""),
            "{{MARCA}}": placeholders.get("{{MARCA}}", ""),
            "{{VIN}}": placeholders.get("{{VIN}}", ""),
            "{{ANIO}}": placeholders.get("{{ANIO}}", ""),
            "{{ASIENTOS}}": placeholders.get("{{ASIENTOS}}", ""),
            "{{ALTO}}": placeholders.get("{{ALTO}}", ""),
            "{{PESO_NETO}}": placeholders.get("{{PESO_NETO}}", ""),
            "{{CATEGORIA}}": placeholders.get("{{CATEGORIA}}", ""),
            "{{EJES}}": placeholders.get("{{EJES}}", ""),
            "{{ANCHO}}": placeholders.get("{{ANCHO}}", ""),
            "{{CARGA_UTIL}}": placeholders.get("{{CARGA_UTIL}}", ""),
            "{{LARGO}}": placeholders.get("{{LARGO}}", ""),
            "{{PESO_BRUTO}}": placeholders.get("{{PESO_BRUTO}}", ""),
            "{{NUM_RESOLUCION}}": "" if es_fila_en_blanco else placeholders.get("{{NUM_RESOLUCION}}", ""),
            "{{FECHA_RES}}": "" if es_fila_en_blanco else placeholders.get("{{FECHA_RES}}", ""),
            "{{TIPO_RES}}": "" if es_fila_en_blanco else placeholders.get("{{TIPO_RES}}", ""),
        }

        modo_hojas = config.get("modo_hojas", "UNA_HOJA")
        margen_izq_mm = config.get("margen_izq_mm", 10.0)
        margen_der_mm = config.get("margen_der_mm", 10.0)

        # Generar bloques HTML posicionados con protección anti-solapamiento para multilínea
        elementos_anverso = []
        elementos_reverso = []
        elementos_html = []

        # Ordenar variables por sección y coordenada Y para asegurar el flujo vertical
        variables_ordenadas = sorted(
            [v for v in variables if v.get("visible", True)],
            key=lambda item: (item.get("seccion", "anverso"), float(item.get("y_mm", 0.0)), float(item.get("x_mm", 0.0)))
        )

        desplazamientos_seccion = {"anverso": 0.0, "reverso": 0.0}
        ultimo_bottom_multilinea = {"anverso": 0.0, "reverso": 0.0}
        ultimo_multilinea_y_orig = {"anverso": -1.0, "reverso": -1.0}

        for v in variables_ordenadas:
            seccion = v.get("seccion", "anverso")
            tipo = v.get("tipo", "texto")
            x = v.get("x_mm", 0.0)
            y_orig = float(v.get("y_mm", 0.0))

            # Si el elemento está situado debajo de un multilínea previo, verificar si debe bajar
            if y_orig > ultimo_multilinea_y_orig.get(seccion, -1.0):
                y_calc = y_orig + desplazamientos_seccion.get(seccion, 0.0)
                limite_ant = ultimo_bottom_multilinea.get(seccion, 0.0)
                if limite_ant > 0 and y_calc < limite_ant + 0.4:
                    delta_necesario = round((limite_ant + 0.4) - y_calc, 2)
                    desplazamientos_seccion[seccion] += delta_necesario
                    y_calc += delta_necesario
                y = y_calc
            else:
                y = y_orig

            w = v.get("width_mm")
            h = v.get("height_mm")

            # --- TIPO IMAGEN / LOGO ---
            if tipo == "imagen":
                img_url = v.get("imagen_url", "")
                if not img_url:
                    continue
                opac = v.get("opacidad", 1.0)
                w_str = f"width: {w}mm;" if w else "width: 18mm;"
                h_str = f"height: {h}mm;" if h else "height: 15mm;"
                img_style = f"position: absolute; left: {x}mm; top: {y}mm; {w_str} {h_str} object-fit: contain; opacity: {opac};"
                tag_html = f'<img src="{img_url}" style="{img_style}" alt="{v.get("label", "Logo")}" />'
                elementos_html.append(tag_html)
                if seccion == "anverso":
                    elementos_anverso.append(tag_html)
                else:
                    elementos_reverso.append(tag_html)
                continue

            # --- TIPO QR CODE DINÁMICO ---
            if tipo == "qr":
                qr_tmpl = v.get("qr_contenido") or f"https://drtc-puno.gob.pe/verificar-tuc/{datos.get('placa', '')}"
                for k_ph, v_ph in valores_map.items():
                    qr_tmpl = qr_tmpl.replace(k_ph, str(v_ph))
                qr_base64 = generar_qr_base64(qr_tmpl)
                w_str = f"width: {w}mm;" if w else "width: 14mm;"
                h_str = f"height: {h}mm;" if h else "height: 14mm;"
                qr_style = f"position: absolute; left: {x}mm; top: {y}mm; {w_str} {h_str} image-rendering: pixelated;"
                tag_html = f'<img src="{qr_base64}" style="{qr_style}" alt="QR" />'
                elementos_html.append(tag_html)
                if seccion == "anverso":
                    elementos_anverso.append(tag_html)
                else:
                    elementos_reverso.append(tag_html)
                continue

            # --- TIPO TEXTO / TABLA ---
            tag = v.get("tag", "")
            val = valores_map.get(tag, v.get("valor_ejemplo", ""))

            # Si es la tabla de rutas, formatear adecuadamente
            if tag == "{{TABLA_RUTAS}}":
                filas_rutas_html = []
                for idx, r in enumerate(rutas_detalle):
                    cod = str(r.get("codigo") or (idx + 1)).zfill(2)
                    orig = r.get("origen", "")
                    dest = r.get("destino", "")
                    itin = r.get("itinerario", "")
                    frec = r.get("frecuencia", "")
                    tramo = r.get("tramo", "")

                    if orig or dest:
                        itin_part = f' <span style="color:#616161;">- {itin} -</span> ' if itin else ' - '
                        frec_part = f' <span style="color:#616161; margin-left: 6px;">{frec}</span>' if frec else ''
                        fila = f'<div><strong>Ruta {cod}:</strong> <span>{orig}</span>{itin_part}<span>{dest}</span>{frec_part}</div>'
                    else:
                        fila = f'<div><strong>Ruta {cod}:</strong> <span>{tramo}</span></div>'
                    filas_rutas_html.append(fila)

                val_html = "".join(filas_rutas_html) if filas_rutas_html else "<div>SIN RUTAS ASIGNADAS</div>"
                wrap_style = "white-space: normal; line-height: 1.25;"
            else:
                if es_fila_en_blanco and v.get("categoria") == "acto_reverso":
                    continue  # Renovación deja la fila en blanco
                
                # Prefijo y Sufijo con negrita y tamaño independientes
                prefix = v.get("prefix") if v.get("prefix") is not None else v.get("etiqueta", "")
                suffix = v.get("suffix", "")
                base_size = v.get("font_size_pt", 7.0)

                prefix_weight = v.get("prefix_font_weight") or v.get("etiqueta_font_weight", "bold")
                prefix_size = v.get("prefix_font_size_pt") or base_size

                valor_weight = v.get("font_weight", "normal")
                valor_size = base_size
                resaltar_com = v.get("resaltar_comillas", True)

                suffix_weight = v.get("suffix_font_weight", "normal")
                suffix_size = v.get("suffix_font_size_pt") or base_size

                # Formatear el valor aplicando resaltado de comillas (negrita y +1 tamaño)
                val_formateado = formatear_comillas_y_estilos(str(val), resaltar_comillas=resaltar_com) if val else ""

                partes_html = []
                if prefix:
                    prefix_escaped = html_escape(prefix)
                    partes_html.append(f'<span class="tuc-prefix" style="font-weight: {prefix_weight}; font-size: {prefix_size}pt;">{prefix_escaped}</span>')
                if val_formateado:
                    partes_html.append(f'<span class="tuc-valor" style="font-weight: {valor_weight}; font-size: {valor_size}pt;">{val_formateado}</span>')
                if suffix:
                    suffix_escaped = html_escape(suffix)
                    partes_html.append(f'<span class="tuc-suffix" style="font-weight: {suffix_weight}; font-size: {suffix_size}pt;">{suffix_escaped}</span>')

                val_html = "".join(partes_html)

                # Interlineado muy cortito (espacio de salto de renglón compacto oficial TUC)
                line_height = v.get("line_height", 1.05)

                # Control de líneas y salto según ancho máximo (width_mm)
                max_lineas = v.get("max_lineas", 0)
                if max_lineas == 1:
                    wrap_style = f"white-space: nowrap; line-height: {line_height};"
                elif max_lineas == 2:
                    wrap_style = f"white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: {line_height}; word-break: break-word;"
                else:
                    wrap_style = f"white-space: normal; line-height: {line_height}; word-break: break-word;"

                # Registrar si este elemento es multilínea para que los de abajo bajen y no se sobreencimen
                num_filas = 1
                if max_lineas == 2:
                    num_filas = 2
                elif max_lineas == 0:
                    longitud_aprox = len(str(val)) if val else 0
                    ancho_disp = v.get("width_mm") or 55.0
                    if longitud_aprox * 1.6 > ancho_disp:
                        num_filas = 2

                if num_filas > 1:
                    alto_efectivo_mm = num_filas * (base_size * 0.3528 * line_height) + 0.6
                    ultimo_bottom_multilinea[seccion] = max(ultimo_bottom_multilinea.get(seccion, 0.0), y + alto_efectivo_mm)
                    ultimo_multilinea_y_orig[seccion] = y_orig

            if not val_html.strip():
                continue

            font_size = v.get("font_size_pt", 7.0)
            color = v.get("color", "#000000")
            align = v.get("align", "left")
            width = f"width: {v['width_mm']}mm; max-width: {v['width_mm']}mm;" if v.get("width_mm") else ""

            # Soporte de Orientación Vertical y Rotación
            orientacion_texto = v.get("orientacion_texto", "horizontal")
            rotacion = v.get("rotacion", 0)
            vert_style = ""
            if orientacion_texto == "vertical" or rotacion == 90:
                vert_style = "writing-mode: vertical-rl; text-orientation: mixed;"
            elif orientacion_texto == "vertical_270" or rotacion == 270 or rotacion == -90:
                vert_style = "writing-mode: vertical-rl; transform: rotate(180deg);"
            elif rotacion == 180:
                vert_style = "transform: rotate(180deg);"

            el_style = (
                f"position: absolute; "
                f"left: {x}mm; "
                f"top: {y}mm; "
                f"{width} "
                f"font-size: {font_size}pt; "
                f"color: {color}; "
                f"text-align: {align}; "
                f"{wrap_style} "
                f"{vert_style}"
            )
            tag_html = f'<div class="tuc-var" style="{el_style}">{val_html}</div>'
            elementos_html.append(tag_html)
            if seccion == "anverso":
                elementos_anverso.append(tag_html)
            else:
                elementos_reverso.append(tag_html)

        # Pliegue para tarjeta dual (solo en formato DUAL_PVC y UNA_HOJA)
        if formato_papel == "A4" or modo_hojas == "DOS_HOJAS":
            linea_pliegue_html = ""
        else:
            linea_pliegue_html = f'<div class="linea-pliegue" style="position: absolute; left: 0; top: {anverso_alto_mm}mm; width: {ancho_mm}mm; border-top: 1px dashed rgba(180, 180, 180, 0.6);"></div>'

        # Contenido del cuerpo según modo de hojas
        if modo_hojas == "DOS_HOJAS":
            body_content = f"""
  <div class="{tuc_card_class} hoja-anverso">
    {''.join(elementos_anverso)}
  </div>
  <div class="page-break" style="break-after: page; page-break-after: always; height: 0;"></div>
  <div class="{tuc_card_class} hoja-reverso">
    {''.join(elementos_reverso)}
  </div>"""
        else:
            body_content = f"""
  <div class="{tuc_card_class}">
    {linea_pliegue_html}
    {''.join(elementos_html)}
  </div>"""

        html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title></title>
  <style>
    @page {{
      {css_page}
      margin: 0mm;
    }}
    @media print {{
      html, body {{
        margin: 0 !important;
        padding: 0 !important;
        width: {ancho_mm}mm !important;
        height: {alto_mm}mm !important;
        background: #ffffff !important;
      }}
      .tuc-sheet {{
        border: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        page-break-inside: avoid;
        break-inside: avoid;
      }}
      .page-break {{
        break-after: page !important;
        page-break-after: always !important;
        height: 0 !important;
        margin: 0 !important;
      }}
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}
    body {{
      font-family: 'Roboto', Arial, sans-serif;
      position: relative;
      background: #ffffff;
    }}
    .tuc-sheet {{
      width: {ancho_mm}mm;
      height: {alto_mm}mm;
      position: relative;
      background: #ffffff;
      overflow: hidden;
    }}
    .tuc-etiqueta {{
      font-weight: bold;
      display: inline;
    }}
    .tuc-valor {{
      display: inline;
    }}
    .tuc-suffix {{
      display: inline;
    }}
    .tuc-quoted {{
      font-weight: bold !important;
      font-size: 1.15em !important;
      display: inline !important;
    }}
    @media screen {{
      body {{
        background: #f1f5f9;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        padding: 30px 0;
      }}
      .tuc-sheet {{
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        border: 1px solid #cbd5e1;
      }}
    }}
  </style>
</head>
<body onload="window.print()">{body_content}
</body>
</html>"""
        return html
