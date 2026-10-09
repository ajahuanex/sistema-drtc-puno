import io
import re
from html import escape as html_escape
import base64
import json
import copy
from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
from pathlib import Path
import logging
import qrcode

from app.dependencies.db import get_database
from app.services.tuc_document_service import TucDocumentService
from app.utils.resolucion_utils import determinar_siglas_resolucion

logger = logging.getLogger(__name__)

def resolver_imagen_a_base64_o_url(url_o_path: str) -> str:
    """
    Si la imagen es una ruta relativa local a assets (ej. /assets/images/... o assets/images/...),
    la busca en el filesystem del proyecto y la convierte a un Data URI en Base64
    (data:image/png;base64,...) para garantizar que se renderice instantáneamente en la
    impresión sin fallas de red ni errores 404 del servidor.
    """
    if not url_o_path:
        return ""
    if url_o_path.startswith("data:image/"):
        return url_o_path

    try:
        # Ubicar la raíz del proyecto SIRRETT
        # __file__ está en backend/app/services/tuc_calibrador_service.py -> 4 niveles arriba es la raíz
        repo_root = Path(__file__).resolve().parents[3]
        limpio = url_o_path.lstrip("/\\")

        candidatos = [
            repo_root / "frontend" / "src" / limpio,
            repo_root / "frontend" / "public" / limpio,
            repo_root / "frontend" / limpio,
            repo_root / limpio,
            Path(limpio)
        ]

        for p in candidatos:
            if p.exists() and p.is_file():
                ext = p.suffix.lower().lstrip(".")
                mime = "svg+xml" if ext == "svg" else ("jpeg" if ext in ("jpg", "jpeg") else "png")
                b64_str = base64.b64encode(p.read_bytes()).decode("utf-8")
                return f"data:image/{mime};base64,{b64_str}"
    except Exception as e:
        logger.warning(f"No se pudo resolver imagen '{url_o_path}' a Base64: {e}")

    return url_o_path

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
        "suffix": "-GR PUNO/GRI/DRTC",
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
    {
        "id": "linea_rutas",
        "tag": "{{LINEA_RUTAS}}",
        "label": "Línea / Imagen Decorativa (Bajo Rutas)",
        "categoria": "rutas",
        "seccion": "reverso",
        "tipo": "linea",
        "x_mm": 12.0,
        "y_mm": 72.0,
        "width_mm": 68.0,
        "height_mm": 1.5,
        "grosor_mm": 0.8,
        "color": "#1e3a8a",
        "estilo_linea": "solid",
        "imagen_url": "",
        "visible": True,
        "imprimible": True
    },

    # --- ACTO RESOLUTIVO MODIFICATORIO (REVERSO) ---
    {
        "id": "num_resolucion",
        "tag": "{{NUM_RESOLUCION}}",
        "label": "N° Resolución Hija / Acto Reverso",
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
        "bloqueado": False,
        "prefix": "R.D.R N° ",
        "suffix": "-GR PUNO/GRI/DRTC",
        "suffix2": " (15/03/2024)",
        "suffix3": " (S)",
        "valor_ejemplo": "0452-2024"
    },
    {
        "id": "fecha_res",
        "tag": "{{FECHA_RES}}",
        "label": "Fecha Resolución Hija (Integrada en Sufijo 2)",
        "categoria": "acto_reverso",
        "seccion": "reverso",
        "x_mm": 56.0,
        "y_mm": 88.0,
        "font_size_pt": 7.0,
        "font_weight": "normal",
        "color": "#000000",
        "align": "left",
        "visible": False,
        "bloqueado": False,
        "prefix": "(",
        "suffix": ")",
        "valor_ejemplo": "15/03/2024"
    },
    {
        "id": "tipo_res",
        "tag": "{{TIPO_RES}}",
        "label": "Sigla Trámite (Integrada en Sufijo 3)",
        "categoria": "acto_reverso",
        "seccion": "reverso",
        "x_mm": 72.0,
        "y_mm": 88.0,
        "font_size_pt": 7.0,
        "font_weight": "bold",
        "color": "#000000",
        "align": "left",
        "visible": False,
        "bloqueado": False,
        "prefix": "(",
        "suffix": ")",
        "valor_ejemplo": "S"
    },

    # --- SELLOS DE TRÁMITE OFICIALES ---
    {
        "id": "sello_duplicado",
        "tag": "{{DUPLICADO}}",
        "label": "Sello Vertical DUPLICADO (Rojo)",
        "categoria": "sellos",
        "seccion": "anverso",
        "x_mm": 78.0,
        "y_mm": 35.0,
        "font_size_pt": 7.0,
        "font_weight": "bold",
        "color": "#eb0a0a",
        "align": "left",
        "visible": True,
        "bloqueado": False,
        "es_dinamica": False,
        "orientacion_texto": "vertical_270",
        "rotacion": 270,
        "valor_ejemplo": "DUPLICADO"
    },
    {
        "id": "sello_renovacion",
        "tag": "{{RENOVACION}}",
        "label": "Sello RENOVACIÓN (Azul)",
        "categoria": "sellos",
        "seccion": "reverso",
        "x_mm": 65.0,
        "y_mm": 50.0,
        "font_size_pt": 7.0,
        "font_weight": "bold",
        "color": "#067cea",
        "align": "left",
        "visible": True,
        "bloqueado": False,
        "es_dinamica": False,
        "valor_ejemplo": "RENOVACIÓN"
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

JSON_CATALOGO_PATH = Path(__file__).resolve().parent.parent / "templates" / "tuc_plantillas_catalogo.json"

DEFAULT_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "oficial_a4_vertical",
        "nombre": "Plantilla Oficial DRTC Puno (A4 Vertical)",
        "descripcion": "Formato estándar oficial A4 vertical con márgenes milimétricos para cartón e impresión directa.",
        "formato_papel": "A4",
        "orientacion": "portrait",
        "modo_hojas": "UNA_HOJA",
        "ancho_mm": 210.0,
        "alto_mm": 297.0,
        "anverso_alto_mm": 54.0,
        "reverso_alto_mm": 54.0,
        "margen_izq_mm": 10.0,
        "margen_der_mm": 10.0,
        "margen_top_mm": 10.0,
        "margen_bottom_mm": 10.0,
        "linea_horizontal": {
            "activa": True,
            "y_mm": 50.0,
            "x_mm": 0.0,
            "ancho_mm": 210.0,
            "grosor_mm": 1.0,
            "color": "#2563eb",
            "estilo": "dashed",
            "imprimible": False,
            "etiqueta": "Línea Límite Superior (Inicio de Contenido)",
            "limitar_contenido_superior": True
        },
        "variables": copy.deepcopy(DEFAULT_VARIABLES),
        "activa": True,
        "es_oficial": True
    },
    {
        "id": "oficial_dual_pvc",
        "nombre": "Plantilla Tarjeta Dual PVC (85.6 × 108 mm)",
        "descripcion": "Formato compacto oficial de 85.6 × 108 mm para tarjetas PVC y plásticas con doblez central.",
        "formato_papel": "DUAL_PVC",
        "orientacion": "portrait",
        "modo_hojas": "UNA_HOJA",
        "ancho_mm": 85.6,
        "alto_mm": 108.0,
        "anverso_alto_mm": 54.0,
        "reverso_alto_mm": 54.0,
        "margen_izq_mm": 5.0,
        "margen_der_mm": 5.0,
        "margen_top_mm": 5.0,
        "margen_bottom_mm": 5.0,
        "linea_horizontal": {
            "activa": False,
            "y_mm": 54.0,
            "x_mm": 0.0,
            "ancho_mm": 85.6,
            "grosor_mm": 1.0,
            "color": "#d97706",
            "estilo": "dashed",
            "imprimible": False,
            "etiqueta": "Doblez / Eje Central PVC"
        },
        "variables": copy.deepcopy(DEFAULT_VARIABLES),
        "activa": False,
        "es_oficial": True
    },
    {
        "id": "oficial_a4_duplex",
        "nombre": "Plantilla A4 Dúplex (2 Hojas Anverso/Reverso)",
        "descripcion": "Formato en dos páginas separadas (Hoja 1: Anverso, Hoja 2: Reverso) para impresión a doble cara.",
        "formato_papel": "A4",
        "orientacion": "portrait",
        "modo_hojas": "DOS_HOJAS",
        "ancho_mm": 210.0,
        "alto_mm": 297.0,
        "anverso_alto_mm": 54.0,
        "reverso_alto_mm": 54.0,
        "margen_izq_mm": 10.0,
        "margen_der_mm": 10.0,
        "margen_top_mm": 10.0,
        "margen_bottom_mm": 10.0,
        "linea_horizontal": {
            "activa": True,
            "y_mm": 50.0,
            "x_mm": 0.0,
            "ancho_mm": 210.0,
            "grosor_mm": 1.0,
            "color": "#2563eb",
            "estilo": "dashed",
            "imprimible": False,
            "etiqueta": "Línea Límite Superior (Inicio de Contenido)",
            "limitar_contenido_superior": True
        },
        "variables": copy.deepcopy(DEFAULT_VARIABLES),
        "activa": False,
        "es_oficial": True
    }
]

DEFAULT_CONFIG: Dict[str, Any] = DEFAULT_TEMPLATES[0]


def guardar_catalogo_json(plantillas: List[Dict[str, Any]]) -> bool:
    """Guarda la lista completa de plantillas en el archivo JSON local de respaldo."""
    try:
        clean_list = []
        for p in plantillas:
            item = dict(p)
            if "_id" in item:
                item["_id"] = str(item["_id"])
            if not item.get("id"):
                item["id"] = item.get("_id") or f"plantilla_{int(datetime.utcnow().timestamp())}"
            clean_list.append(item)
        JSON_CATALOGO_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(JSON_CATALOGO_PATH, "w", encoding="utf-8") as f:
            json.dump(clean_list, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error al guardar catálogo de plantillas en JSON ({JSON_CATALOGO_PATH}): {e}")
        return False


def cargar_catalogo_json() -> List[Dict[str, Any]]:
    """Carga las plantillas guardadas en el archivo JSON local si existe."""
    try:
        if JSON_CATALOGO_PATH.exists():
            with open(JSON_CATALOGO_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    return data
    except Exception as e:
        logger.warning(f"No se pudo cargar catálogo de plantillas desde JSON: {e}")
    return [copy.deepcopy(t) for t in DEFAULT_TEMPLATES]


class TucCalibradorService:
    @staticmethod
    async def asegurar_inicializacion_catalogo() -> List[Dict[str, Any]]:
        """
        Verifica que existan plantillas en MongoDB. Si la colección está vacía (despliegue nuevo o cold start):
        1. Intenta cargar desde el archivo JSON de respaldo.
        2. Si no existe el archivo JSON, toma las plantillas oficiales predeterminadas.
        3. Siembra la colección en MongoDB y asegura la sincronización del archivo JSON.
        """
        db = await get_database()
        if db is None:
            return cargar_catalogo_json()

        count = await db.tuc_plantillas_calibrador.count_documents({})
        if count == 0:
            logger.info("Colección tuc_plantillas_calibrador vacía. Sembrando desde JSON de respaldo o plantillas oficiales...")
            from_json = cargar_catalogo_json()
            if not from_json:
                from_json = [copy.deepcopy(t) for t in DEFAULT_TEMPLATES]

            tiene_activa = any(p.get("activa", False) for p in from_json)
            if not tiene_activa and from_json:
                from_json[0]["activa"] = True

            now = datetime.utcnow().isoformat()
            for p in from_json:
                p.pop("_id", None)
                if "id" not in p or not p["id"]:
                    p["id"] = re.sub(r'[^a-zA-Z0-9_]', '_', p.get("nombre", "").lower())[:30] or f"plantilla_{int(datetime.utcnow().timestamp())}"
                p.setdefault("fecha_creacion", now)
                p.setdefault("fecha_actualizacion", now)
                res = await db.tuc_plantillas_calibrador.insert_one(p)
                p["_id"] = str(res.inserted_id)

            guardar_catalogo_json(from_json)

        # Asegurar que existan las plantillas oficiales predeterminadas si no están
        existentes_ids = set()
        existentes_nombres = set()
        plantillas_actuales = await db.tuc_plantillas_calibrador.find({}).to_list(100)
        for p in plantillas_actuales:
            if p.get("id"):
                existentes_ids.add(p["id"])
            if p.get("nombre"):
                existentes_nombres.add(p["nombre"].strip().lower())

        hay_activa = any(p.get("activa", False) for p in plantillas_actuales)

        for t in DEFAULT_TEMPLATES:
            t_id = t["id"]
            t_nom = t["nombre"].strip().lower()
            if t_id not in existentes_ids and t_nom not in existentes_nombres:
                item = copy.deepcopy(t)
                item["activa"] = False if hay_activa else item.get("activa", False)
                item["fecha_creacion"] = datetime.utcnow().isoformat()
                item["fecha_actualizacion"] = datetime.utcnow().isoformat()
                await db.tuc_plantillas_calibrador.insert_one(item)
                if item["activa"]:
                    hay_activa = True

        plantillas = await db.tuc_plantillas_calibrador.find({}).to_list(100)
        for p in plantillas:
            p["_id"] = str(p["_id"])
        # Sincronizar hacia JSON para tener siempre el estado más fresco
        guardar_catalogo_json(plantillas)
        return plantillas

    @staticmethod
    async def listar_plantillas() -> List[Dict[str, Any]]:
        """Devuelve el resumen de todas las plantillas registradas en base de datos y JSON."""
        plantillas = await TucCalibradorService.asegurar_inicializacion_catalogo()
        resumen = []
        for p in plantillas:
            resumen.append({
                "_id": str(p.get("_id", "")),
                "id": p.get("id") or str(p.get("_id", "")),
                "nombre": p.get("nombre", "Plantilla sin nombre"),
                "descripcion": p.get("descripcion", ""),
                "formato_papel": p.get("formato_papel", "DUAL_PVC"),
                "orientacion": p.get("orientacion", "portrait"),
                "modo_hojas": p.get("modo_hojas", "UNA_HOJA"),
                "ancho_mm": p.get("ancho_mm", 210.0),
                "alto_mm": p.get("alto_mm", 297.0),
                "total_variables": len(p.get("variables", [])),
                "activa": p.get("activa", False),
                "es_oficial": p.get("es_oficial", False),
                "fecha_actualizacion": p.get("fecha_actualizacion", "")
            })
        return resumen

    @staticmethod
    async def obtener_plantilla(plantilla_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene una plantilla específica por _id o por slug id."""
        db = await get_database()
        if db is None:
            catalogo = cargar_catalogo_json()
            for p in catalogo:
                if str(p.get("_id")) == plantilla_id or p.get("id") == plantilla_id:
                    return p
            return catalogo[0] if catalogo else None

        query = {}
        if ObjectId.is_valid(plantilla_id):
            query = {"$or": [{"_id": ObjectId(plantilla_id)}, {"id": plantilla_id}]}
        else:
            query = {"id": plantilla_id}

        p = await db.tuc_plantillas_calibrador.find_one(query)
        if not p:
            # Buscar en catalogo JSON
            catalogo = cargar_catalogo_json()
            for item in catalogo:
                if str(item.get("_id")) == plantilla_id or item.get("id") == plantilla_id:
                    return item
            return None
        p["_id"] = str(p["_id"])
        return p

    @staticmethod
    async def obtener_configuracion(plantilla_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Obtiene la configuración activa o la plantilla indicada.
        Si la base de datos está vacía, la siembra automáticamente desde JSON o plantillas oficiales.
        """
        await TucCalibradorService.asegurar_inicializacion_catalogo()
        db = await get_database()
        if db is None:
            catalogo = cargar_catalogo_json()
            if plantilla_id:
                for p in catalogo:
                    if str(p.get("_id")) == plantilla_id or p.get("id") == plantilla_id:
                        return p
            for p in catalogo:
                if p.get("activa"):
                    return p
            return catalogo[0] if catalogo else dict(DEFAULT_CONFIG)

        if plantilla_id:
            cfg = await TucCalibradorService.obtener_plantilla(plantilla_id)
            if cfg:
                return cfg

        config = await db.tuc_plantillas_calibrador.find_one({"activa": True})
        if not config:
            config = await db.tuc_plantillas_calibrador.find_one({})
            if config:
                await db.tuc_plantillas_calibrador.update_one({"_id": config["_id"]}, {"$set": {"activa": True}})
                config["activa"] = True

        if not config:
            config = copy.deepcopy(DEFAULT_CONFIG)
            config["fecha_creacion"] = datetime.utcnow().isoformat()
            res = await db.tuc_plantillas_calibrador.insert_one(config)
            config["_id"] = str(res.inserted_id)
        else:
            config["_id"] = str(config["_id"])

        return config

    @staticmethod
    async def guardar_configuracion(config_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Guarda o actualiza las posiciones, estilos y nuevas variables en la base de datos y en JSON.
        """
        db = await get_database()
        config_data["fecha_actualizacion"] = datetime.utcnow().isoformat()

        # Determinar si debe marcarse activa
        es_activa = config_data.get("activa", True)

        doc_id = config_data.pop("_id", None)
        id_slug = config_data.get("id")

        if db is not None:
            if es_activa:
                # Si se guarda como activa, desactivar las demás
                await db.tuc_plantillas_calibrador.update_many({}, {"$set": {"activa": False}})

            config_data["activa"] = es_activa

            if doc_id and ObjectId.is_valid(doc_id):
                await db.tuc_plantillas_calibrador.update_one(
                    {"_id": ObjectId(doc_id)},
                    {"$set": config_data},
                    upsert=True
                )
                config_data["_id"] = doc_id
            elif id_slug:
                res = await db.tuc_plantillas_calibrador.update_one(
                    {"id": id_slug},
                    {"$set": config_data},
                    upsert=True
                )
                config_data["_id"] = str(res.upserted_id) if res.upserted_id else id_slug
            else:
                res = await db.tuc_plantillas_calibrador.update_one(
                    {"activa": True},
                    {"$set": config_data},
                    upsert=True
                )
                if res.upserted_id:
                    config_data["_id"] = str(res.upserted_id)

            # Sincronizar catálogo a archivo JSON físico
            plantillas = await db.tuc_plantillas_calibrador.find({}).to_list(100)
            for p in plantillas:
                p["_id"] = str(p["_id"])
            guardar_catalogo_json(plantillas)
        else:
            catalogo = cargar_catalogo_json()
            if doc_id:
                for idx, c in enumerate(catalogo):
                    if str(c.get("_id")) == str(doc_id) or c.get("id") == doc_id:
                        catalogo[idx] = config_data
                        break
            guardar_catalogo_json(catalogo)

        return config_data

    @staticmethod
    async def crear_nueva_plantilla(plantilla_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crea una nueva plantilla en el catálogo (BD y JSON).
        """
        db = await get_database()
        now = datetime.utcnow().isoformat()
        nombre = plantilla_data.get("nombre", "").strip() or f"Nueva Plantilla {int(datetime.utcnow().timestamp())}"
        slug = re.sub(r'[^a-zA-Z0-9_]', '_', nombre.lower())[:30]

        nueva = copy.deepcopy(plantilla_data)
        nueva.pop("_id", None)
        nueva["nombre"] = nombre
        nueva["id"] = f"{slug}_{int(datetime.utcnow().timestamp())}"
        nueva["fecha_creacion"] = now
        nueva["fecha_actualizacion"] = now
        nueva["es_oficial"] = False

        es_activa = nueva.get("activa", False)

        if db is not None:
            if es_activa:
                await db.tuc_plantillas_calibrador.update_many({}, {"$set": {"activa": False}})
            res = await db.tuc_plantillas_calibrador.insert_one(nueva)
            nueva["_id"] = str(res.inserted_id)

            plantillas = await db.tuc_plantillas_calibrador.find({}).to_list(100)
            for p in plantillas:
                p["_id"] = str(p["_id"])
            guardar_catalogo_json(plantillas)
        else:
            catalogo = cargar_catalogo_json()
            if es_activa:
                for c in catalogo: c["activa"] = False
            nueva["_id"] = nueva["id"]
            catalogo.append(nueva)
            guardar_catalogo_json(catalogo)

        return nueva

    @staticmethod
    async def activar_plantilla(plantilla_id: str) -> Dict[str, Any]:
        """
        Establece una plantilla como la predeterminada/activa para todo el sistema.
        """
        db = await get_database()
        query = {"_id": ObjectId(plantilla_id)} if ObjectId.is_valid(plantilla_id) else {"id": plantilla_id}

        if db is not None:
            await db.tuc_plantillas_calibrador.update_many({}, {"$set": {"activa": False}})
            await db.tuc_plantillas_calibrador.update_one(query, {"$set": {"activa": True, "fecha_actualizacion": datetime.utcnow().isoformat()}})

            plantillas = await db.tuc_plantillas_calibrador.find({}).to_list(100)
            for p in plantillas:
                p["_id"] = str(p["_id"])
            guardar_catalogo_json(plantillas)

            target = await db.tuc_plantillas_calibrador.find_one(query)
            if target:
                target["_id"] = str(target["_id"])
                return target
        else:
            catalogo = cargar_catalogo_json()
            target = None
            for p in catalogo:
                if str(p.get("_id")) == plantilla_id or p.get("id") == plantilla_id:
                    p["activa"] = True
                    target = p
                else:
                    p["activa"] = False
            guardar_catalogo_json(catalogo)
            if target: return target

        return await TucCalibradorService.obtener_configuracion()

    @staticmethod
    async def eliminar_plantilla(plantilla_id: str) -> bool:
        """
        Elimina una plantilla si no es la única existente.
        Si la plantilla eliminada era la activa, activa automáticamente otra.
        """
        db = await get_database()
        query = {"_id": ObjectId(plantilla_id)} if ObjectId.is_valid(plantilla_id) else {"id": plantilla_id}

        if db is not None:
            total = await db.tuc_plantillas_calibrador.count_documents({})
            if total <= 1:
                raise ValueError("No se puede eliminar la única plantilla registrada en el sistema.")

            target = await db.tuc_plantillas_calibrador.find_one(query)
            if not target:
                raise ValueError("La plantilla a eliminar no existe.")

            era_activa = target.get("activa", False)
            await db.tuc_plantillas_calibrador.delete_one(query)

            if era_activa:
                otra = await db.tuc_plantillas_calibrador.find_one({})
                if otra:
                    await db.tuc_plantillas_calibrador.update_one({"_id": otra["_id"]}, {"$set": {"activa": True}})

            plantillas = await db.tuc_plantillas_calibrador.find({}).to_list(100)
            for p in plantillas:
                p["_id"] = str(p["_id"])
            guardar_catalogo_json(plantillas)
            return True
        else:
            catalogo = cargar_catalogo_json()
            if len(catalogo) <= 1:
                raise ValueError("No se puede eliminar la única plantilla registrada.")
            catalogo = [c for c in catalogo if str(c.get("_id")) != plantilla_id and c.get("id") != plantilla_id]
            if not any(c.get("activa") for c in catalogo):
                catalogo[0]["activa"] = True
            guardar_catalogo_json(catalogo)
            return True

    @staticmethod
    async def restablecer_configuracion_oficial() -> Dict[str, Any]:
        """
        Restablece el catálogo completo a las plantillas y variables oficiales estándar de DRTC Puno.
        """
        db = await get_database()
        if db is not None:
            await db.tuc_plantillas_calibrador.delete_many({})

        # Escribir plantillas oficiales en JSON
        guardar_catalogo_json(DEFAULT_TEMPLATES)
        # Sembrar en BD
        await TucCalibradorService.asegurar_inicializacion_catalogo()
        return await TucCalibradorService.obtener_configuracion()

    @staticmethod
    async def generar_html_impresion(
        placa_o_id: str,
        config_override: Optional[Dict[str, Any]] = None,
        auto_print: bool = True,
        datos_override: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Genera el documento HTML completo, autónomo e instantáneo (<0.05s)
        con coordenadas milimétricas exactas listas para impresión física sobre el cartón TUC.
        """
        config = config_override or await TucCalibradorService.obtener_configuracion()
        variables: List[Dict[str, Any]] = config.get("variables", DEFAULT_VARIABLES)

        term = (placa_o_id or "").strip()
        es_muestra_ejemplo = False
        tuc_data = None

        try:
            if term:
                tuc_data = await TucDocumentService.get_tuc_data(term)
            if not tuc_data or not tuc_data.get("placeholders"):
                es_muestra_ejemplo = True
        except Exception as e:
            logger.info(f"Vehículo '{term}' no encontrado en flota o BD ({e}). Usando valores de plantilla para calibración.")
            es_muestra_ejemplo = True

        if not tuc_data or es_muestra_ejemplo:
            es_muestra_ejemplo = True
            sample_placeholders = {}
            for v in variables:
                tag = v.get("tag")
                val_ej = v.get("valor_ejemplo")
                if tag and val_ej is not None:
                    # DUPLICADO, RENOVACION y resolución hija no deben activarse por defecto en muestra base (resolución primigenia)
                    if tag in (
                        "{{DUPLICADO}}", "{{RENOVACION}}",
                        "{{NUM_RESOLUCION}}", "{{FECHA_RES}}", "{{TIPO_RES}}",
                        "{{SIGLAS_RES_ACTO}}", "{{NUM_RESOLUCION_ACTO_CON_SIGLAS}}"
                    ):
                        sample_placeholders[tag] = ""
                    else:
                        sample_placeholders[tag] = str(val_ej)

            placa_efectiva = term.upper() if (term and term.upper() != "VBE-959") else sample_placeholders.get("{{PLACA}}", "VBE-959")
            sample_placeholders["{{PLACA}}"] = placa_efectiva

            tuc_data = {
                "datos_estructurados": {
                    "placa": placa_efectiva,
                    "rutas_detalle": [
                        {
                            "codigo": "01",
                            "origen": "JULIACA",
                            "itinerario": "PUTINA - ANANEA",
                            "destino": "LA RINCONADA",
                            "frecuencia": ""
                        }
                    ]
                },
                "placeholders": sample_placeholders
            }

        datos = tuc_data.get("datos_estructurados", {})
        placeholders = tuc_data.get("placeholders", {})
        rutas_detalle = datos.get("rutas_detalle", [])
        es_fila_en_blanco = datos.get("es_fila_en_blanco", False)

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

        # Mapa de valores reales a inyectar (hereda todos los placeholders calculados o de ejemplo)
        valores_map = dict(placeholders)

        tag_map_override = {
            "fecha_del": "{{FECHA_DEL}}",
            "fecha_al": "{{FECHA_AL}}",
            "nro_resolucion_primigenia": "{{RES}}",
            "nro_resolucion": "{{RES}}",
            "res_primigenia": "{{RES}}",
            "res": "{{RES}}",
            "fecha_resolucion_primigenia": "{{FECHA_RES_P}}",
            "fecha_res_p": "{{FECHA_RES_P}}",
            "empresa": "{{EMPRESA}}",
            "razon_social": "{{EMPRESA}}",
            "ruc": "{{RUC}}",
            "partida": "{{PARTIDA}}",
            "partida_registral": "{{PARTIDA}}",
            "placa": "{{PLACA}}",
            "color": "{{COLOR}}",
            "marca": "{{MARCA}}",
            "modelo": "{{MODELO}}",
            "vin": "{{VIN}}",
            "anio": "{{ANIO}}",
            "anio_fabricacion": "{{ANIO}}",
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
            "num_resolucion": "{{NUM_RESOLUCION}}",
            "fecha_resolucion_acto": "{{FECHA_RES}}",
            "fecha_res": "{{FECHA_RES}}",
            "tipo_resolucion_acto": "{{TIPO_RES}}",
            "tipo_res": "{{TIPO_RES}}",
            "numero_tuc": "{{NUMERO_TUC}}",
            "tuc": "{{NUMERO_TUC}}"
        }

        # Aplicar datos editados si fueron enviados
        if datos_override:
            for k, val in datos_override.items():
                if val is None:
                    continue
                val_str = str(val).strip()
                if k.startswith("{{") and k.endswith("}}"):
                    valores_map[k] = val_str
                t_mapped = tag_map_override.get(k.lower())
                if t_mapped:
                    valores_map[t_mapped] = val_str
                datos[k] = val_str

            if "placa" in datos_override and datos_override["placa"]:
                p_clean = str(datos_override["placa"]).strip().upper()
                datos["placa"] = p_clean
                valores_map["{{PLACA}}"] = p_clean
            if "numero_tuc" in datos_override and datos_override["numero_tuc"]:
                n_tuc = str(datos_override["numero_tuc"]).strip()
                datos["numero_tuc"] = n_tuc
                valores_map["{{NUMERO_TUC}}"] = n_tuc
            if "tabla_rutas_text" in datos_override:
                valores_map["{{TABLA_RUTAS}}"] = str(datos_override["tabla_rutas_text"]).strip()
            elif "rutas" in datos_override:
                valores_map["{{TABLA_RUTAS}}"] = str(datos_override["rutas"]).strip()

            # Reglas condicionales según tipo_tramite recibido en override
            tramite_override = str(datos_override.get("tipo_tramite") or datos_override.get("tramite") or "").strip().upper()
            if tramite_override:
                if tramite_override in ("D", "DUPLICADO") or "DUPLICADO" in tramite_override:
                    valores_map["{{DUPLICADO}}"] = "DUPLICADO"
                    if "{{RENOVACION}}" not in datos_override:
                        valores_map["{{RENOVACION}}"] = ""
                elif tramite_override in ("R", "RENOVACION", "RENOVACIÓN") or "RENOVACION" in tramite_override:
                    valores_map["{{RENOVACION}}"] = "RENOVACIÓN"
                    if "{{DUPLICADO}}" not in datos_override:
                        valores_map["{{DUPLICADO}}"] = ""
                    es_fila_en_blanco = True
                    valores_map["{{NUM_RESOLUCION}}"] = ""
                    valores_map["{{FECHA_RES}}"] = ""
                    valores_map["{{TIPO_RES}}"] = ""
                elif tramite_override in ("N", "NUEVA", "AUTORIZACION", "AUTORIZACION_NUEVA"):
                    valores_map["{{DUPLICADO}}"] = ""
                    valores_map["{{RENOVACION}}"] = ""
                    es_fila_en_blanco = True
                    valores_map["{{NUM_RESOLUCION}}"] = ""
                    valores_map["{{FECHA_RES}}"] = ""
                    valores_map["{{TIPO_RES}}"] = ""
                elif tramite_override in ("I", "INCREMENTO"):
                    valores_map["{{DUPLICADO}}"] = ""
                    valores_map["{{RENOVACION}}"] = ""
                    es_fila_en_blanco = False
                    valores_map["{{TIPO_RES}}"] = "I"
                elif tramite_override in ("S", "SUSTITUCION", "SUSTITUCIÓN"):
                    valores_map["{{DUPLICADO}}"] = ""
                    valores_map["{{RENOVACION}}"] = ""
                    es_fila_en_blanco = False
                    valores_map["{{TIPO_RES}}"] = "S"

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

        for v in variables_ordenadas:
            seccion = v.get("seccion", "anverso")
            tipo = v.get("tipo", "texto")
            x = float(v.get("x_mm", 0.0))
            y = float(v.get("y_mm", 0.0))

            w = v.get("width_mm")
            h = v.get("height_mm")

            # --- TIPO IMAGEN / LOGO (Embebido autónomo en Base64) ---
            if tipo == "imagen":
                img_url = v.get("imagen_url", "")
                if not img_url:
                    continue
                img_src = resolver_imagen_a_base64_o_url(img_url)
                opac = v.get("opacidad", 1.0)
                w_str = f"width: {w}mm;" if w else "width: 18mm;"
                h_str = f"height: {h}mm;" if h else "height: 15mm;"
                img_style = f"position: absolute; left: {x}mm; top: {y}mm; {w_str} {h_str} max-width: {w or 18}mm; max-height: {h or 15}mm; object-fit: contain; opacity: {opac};"
                tag_html = f'<img src="{img_src}" style="{img_style}" alt="{v.get("label", "Logo")}" />'
                elementos_html.append(tag_html)
                if seccion == "anverso":
                    elementos_anverso.append(tag_html)
                else:
                    elementos_reverso.append(tag_html)
                continue

            # --- TIPO QR CODE DINÁMICO ---
            if tipo == "qr":
                placa_qr = datos.get('placa', '') or valores_map.get("{{PLACA}}", "") or "VBE-959"
                qr_tmpl = v.get("qr_contenido") or f"https://drtc-puno.gob.pe/verificar-tuc/{placa_qr}"
                for k_ph, v_ph in valores_map.items():
                    if k_ph in qr_tmpl:
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

            # --- TIPO LÍNEA HORIZONTAL / IMAGEN DECORATIVA ---
            if tipo == "linea":
                img_url = v.get("imagen_url", "")
                if img_url:
                    img_src = resolver_imagen_a_base64_o_url(img_url)
                    line_w = v.get("width_mm") or 68.0
                    line_h = v.get("height_mm") or v.get("grosor_mm") or 2.0
                    opac = v.get("opacidad", 1.0)
                    img_style = f"position: absolute; left: {x}mm; top: {y}mm; width: {line_w}mm; height: {line_h}mm; object-fit: contain; opacity: {opac}; pointer-events: none; z-index: 10;"
                    tag_html = f'<img src="{img_src}" style="{img_style}" alt="{v.get("label", "Línea Decorativa")}" />'
                else:
                    line_w = v.get("width_mm") or ancho_mm
                    line_grosor = v.get("grosor_mm") or v.get("height_mm") or 1.0
                    line_color = v.get("color") or "#000000"
                    line_estilo = v.get("estilo_linea") or "solid"
                    line_style = f"position: absolute; left: {x}mm; top: {y}mm; width: {line_w}mm; border-top: {line_grosor}mm {line_estilo} {line_color}; height: 0; pointer-events: none; z-index: 10;"
                    tag_html = f'<div class="tuc-linea-impresa" style="{line_style}"></div>'
                elementos_html.append(tag_html)
                if seccion == "anverso":
                    elementos_anverso.append(tag_html)
                else:
                    elementos_reverso.append(tag_html)
                continue

            # --- TIPO TEXTO / TABLA ---
            tag = v.get("tag", "")

            # Obtener el valor correspondiente
            val = valores_map.get(tag)
            if val is None or (str(val).strip() in ("", "-") and es_muestra_ejemplo):
                val = v.get("valor_ejemplo", "")

            # Si es la tabla de rutas, formatear adecuadamente
            if tag == "{{TABLA_RUTAS}}":
                filas_rutas_html = []
                val_custom = valores_map.get("{{TABLA_RUTAS}}")
                if datos_override and ("tabla_rutas_text" in datos_override or "rutas" in datos_override or "{{TABLA_RUTAS}}" in datos_override):
                    for l in str(val_custom or "").split("\n"):
                        l_clean = l.strip()
                        if l_clean:
                            filas_rutas_html.append(f'<div>{html_escape(l_clean)}</div>')
                else:
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

                if not filas_rutas_html and v.get("valor_ejemplo"):
                    filas_rutas_html.append(f'<div>{html_escape(str(v.get("valor_ejemplo")))}</div>')

                val_html = "".join(filas_rutas_html) if filas_rutas_html else "<div>SIN RUTAS ASIGNADAS</div>"
                wrap_style = "white-space: normal; line-height: 1.25;"
            else:
                if es_fila_en_blanco and v.get("categoria") == "acto_reverso":
                    continue  # Renovación deja la fila en blanco

                # Prefijo y Sufijo con negrita y tamaño independientes
                prefix = v.get("prefix") if v.get("prefix") is not None else v.get("etiqueta", "")
                suffix = v.get("suffix", "")

                # Sufijo dinámico de siglas institucionales oficiales DRTC para variables de resolución
                if tag in ("{{RES}}", "{{NUM_RESOLUCION}}") and val:
                    if not suffix or any(s in suffix for s in ("DRTC", "GRP", "GR PUNO")):
                        sigla_oficial = determinar_siglas_resolucion(str(val))
                        suffix = f"-{sigla_oficial}"

                base_size = v.get("font_size_pt", 7.0)

                prefix_weight = v.get("prefix_font_weight") or v.get("etiqueta_font_weight", "bold")
                prefix_size = v.get("prefix_font_size_pt") or base_size

                valor_weight = v.get("font_weight", "normal")
                valor_size = base_size
                resaltar_com = v.get("resaltar_comillas", True)

                suffix_weight = v.get("suffix_font_weight", "normal")
                suffix_size = v.get("suffix_font_size_pt") or base_size

                val_clean = str(val).strip() if val is not None else ""

                # REGLA CRÍTICA: Si el valor está vacío o es '-', no renderizar nada (evita prefijos/sufijos fantasma)
                if not val_clean or val_clean == "-":
                    continue

                # Formatear el valor aplicando resaltado de comillas (negrita y +1 tamaño)
                val_formateado = formatear_comillas_y_estilos(val_clean, resaltar_comillas=resaltar_com)

                suffix2 = v.get("suffix2") or ""
                suffix3 = v.get("suffix3") or ""

                # Para num_resolucion, integrar automáticamente fecha y trámite como 2do y 3er sufijo
                if tag == "{{NUM_RESOLUCION}}":
                    fecha_val = valores_map.get("{{FECHA_RES}}") or ""
                    tipo_val = valores_map.get("{{TIPO_RES}}") or ""
                    if fecha_val:
                        if not suffix2:
                            suffix2 = f" ({fecha_val})"
                        elif "{{FECHA_RES}}" in suffix2:
                            suffix2 = suffix2.replace("{{FECHA_RES}}", fecha_val)
                    if tipo_val:
                        if not suffix3:
                            suffix3 = f" ({tipo_val})"
                        elif "{{TIPO_RES}}" in suffix3:
                            suffix3 = suffix3.replace("{{TIPO_RES}}", tipo_val)

                partes_html = []
                if prefix:
                    prefix_escaped = html_escape(prefix)
                    partes_html.append(f'<span class="tuc-prefix" style="font-weight: {prefix_weight}; font-size: {prefix_size}pt;">{prefix_escaped}</span>')
                if val_formateado:
                    partes_html.append(f'<span class="tuc-valor" style="font-weight: {valor_weight}; font-size: {valor_size}pt;">{val_formateado}</span>')
                if suffix:
                    suffix_escaped = html_escape(suffix)
                    partes_html.append(f'<span class="tuc-suffix" style="font-weight: {suffix_weight}; font-size: {suffix_size}pt;">{suffix_escaped}</span>')
                if suffix2:
                    s2_weight = v.get("suffix2_font_weight", "normal")
                    s2_size = v.get("suffix2_font_size_pt") or base_size
                    partes_html.append(f' <span class="tuc-suffix2" style="font-weight: {s2_weight}; font-size: {s2_size}pt;">{html_escape(suffix2)}</span>')
                if suffix3:
                    s3_weight = v.get("suffix3_font_weight", "bold")
                    s3_size = v.get("suffix3_font_size_pt") or base_size
                    partes_html.append(f' <span class="tuc-suffix3" style="font-weight: {s3_weight}; font-size: {s3_size}pt;">{html_escape(suffix3)}</span>')

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

        # Línea horizontal personalizada imprimible de la plantilla (Independiente Anverso y Reverso)
        lh_anv = config.get("linea_horizontal_anverso") or config.get("linea_horizontal") or {}
        if lh_anv.get("activa", False) and lh_anv.get("imprimible", False):
            lh_y = float(lh_anv.get("y_mm", 54.0))
            lh_x = float(lh_anv.get("x_mm", 0.0))
            lh_w = float(lh_anv.get("ancho_mm") or ancho_mm)
            lh_grosor = float(lh_anv.get("grosor_mm", 1.0))
            lh_color = lh_anv.get("color", "#000000")
            lh_estilo = lh_anv.get("estilo", "solid")
            lh_html_anv = f'<div class="tuc-linea-horizontal-impresa" style="position: absolute; left: {lh_x}mm; top: {lh_y}mm; width: {lh_w}mm; border-top: {lh_grosor}mm {lh_estilo} {lh_color}; height: 0; pointer-events: none; z-index: 10;"></div>'
            elementos_html.append(lh_html_anv)
            elementos_anverso.append(lh_html_anv)

        lh_rev = config.get("linea_horizontal_reverso") or {}
        if lh_rev.get("activa", False) and lh_rev.get("imprimible", False):
            lh_rev_y = float(lh_rev.get("y_mm", 18.0))
            lh_rev_x = float(lh_rev.get("x_mm", 0.0))
            lh_rev_w = float(lh_rev.get("ancho_mm") or ancho_mm)
            lh_rev_grosor = float(lh_rev.get("grosor_mm", 1.0))
            lh_rev_color = lh_rev.get("color", "#000000")
            lh_rev_estilo = lh_rev.get("estilo", "solid")
            lh_html_rev = f'<div class="tuc-linea-horizontal-impresa" style="position: absolute; left: {lh_rev_x}mm; top: {lh_rev_y}mm; width: {lh_rev_w}mm; border-top: {lh_rev_grosor}mm {lh_rev_estilo} {lh_rev_color}; height: 0; pointer-events: none; z-index: 10;"></div>'
            elementos_html.append(lh_html_rev)
            elementos_reverso.append(lh_html_rev)

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

        onload_attr = ' onload="window.print()"' if auto_print else ""
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
  <script>
    window.addEventListener('afterprint', function() {{
      try {{
        if (window.opener || window.history.length === 1) {{
          window.close();
        }}
      }} catch(e) {{}}
    }});
  </script>
</head>
<body{onload_attr}>{body_content}
</body>
</html>"""
        return html

    @staticmethod
    async def generar_html_lote_impresion(placas: List[str], config_override: Optional[Dict[str, Any]] = None) -> str:
        """
        Genera un único documento HTML con múltiples páginas (una o dos por cada TUC),
        separadas por saltos de página de impresión (@page / break-after: page),
        listas para impresión en bloque o para 'Guardar como PDF' de muchas hojas.
        """
        config = config_override or await TucCalibradorService.obtener_configuracion()
        formato_papel = config.get("formato_papel", "DUAL_PVC")
        orientacion = config.get("orientacion", "portrait")

        if formato_papel == "A4":
            ancho_mm = 210.0 if orientacion == "portrait" else 297.0
            alto_mm = 297.0 if orientacion == "portrait" else 210.0
            css_page = f"size: A4 {orientacion};"
        else:
            ancho_mm = config.get("ancho_mm", 85.6)
            alto_mm = config.get("alto_mm", 108.0)
            css_page = f"size: {ancho_mm}mm {alto_mm}mm;"

        placas_limpias = [p.strip() for p in placas if p and p.strip()]
        if not placas_limpias:
            placas_limpias = ["VBE-959"]

        hojas_bodies = []
        for p in placas_limpias:
            single_html = await TucCalibradorService.generar_html_impresion(p, config_override=config)
            m = re.search(r'<body[^>]*>(.*?)</body>', single_html, re.DOTALL)
            if m:
                hojas_bodies.append(m.group(1).strip())

        separador = '\n  <div class="page-break" style="break-after: page; page-break-after: always; height: 0;"></div>\n'
        contenido_total = separador.join(hojas_bodies)

        html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Lote de TUCs DRTC Puno ({len(placas_limpias)} documentos)</title>
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
  <script>
    window.addEventListener('afterprint', function() {{
      try {{
        if (window.opener || window.history.length === 1) {{
          window.close();
        }}
      }} catch(e) {{}}
    }});
  </script>
</head>
<body onload="window.print()">
{contenido_total}
</body>
</html>"""
        return html
