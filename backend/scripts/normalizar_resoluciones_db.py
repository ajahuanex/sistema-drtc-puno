"""
Script de normalización completa de Resoluciones e Historial de Trámites.
Normaliza tanto resoluciones_hijas como flota_empresa y resoluciones_primigenias.
Corrige los sufijos de trámite (-S -> SUSTITUCION_VEHICULAR, -I -> INCREMENTO_FLOTA, -M -> MODIFICACION_RUTA, etc.)
"""

import asyncio
import re
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

def normalizar_codigo(val, fecha_ref=None):
    if not val:
        return ""
    s = str(val).strip().upper()
    if not s or s in ("NAN", "NONE", "NULL", "-", "S/N", "TUC", "REPRESENTANTE", "DUPLICADO", "D", "R----", "R-VARIOS"):
        return ""
    # Placas solas
    if re.match(r"^[A-Z0-9]{3}-?[A-Z0-9]{3}$", s) and not re.search(r"19\d\d|20\d\d", s):
        return ""

    s = re.sub(r"^(?:RESOLUCI[OÓ]N|RES\.|RES-|R\.|R\s+)", "R-", s)
    s = re.sub(r"^(?:N[°º]|N-)\s*", "", s)

    # Coincidencia con número y año de 4 dígitos
    m = re.search(r"^(?:R[-.\s]*)?0*(\d{1,6})[-/.\s]+(\d{4})", s)
    if m:
        num, anio = m.groups()
        return f"R-{int(num):04d}-{anio}"

    # Coincidencia con número y año de 2 dígitos
    m2 = re.search(r"^(?:R[-.\s]*)?0*(\d{1,6})[-/.\s]+(\d{2})(?:[-/.]?.*)?$", s)
    if m2:
        num, yr2 = m2.groups()
        anio = "20" + yr2 if int(yr2) < 50 else "19" + yr2
        return f"R-{int(num):04d}-{anio}"

    # Si es sólo un número correlativo y tenemos fecha de referencia
    if s.isdigit() and fecha_ref:
        if isinstance(fecha_ref, str):
            try:
                fecha_ref = datetime.fromisoformat(fecha_ref)
            except Exception:
                fecha_ref = None
        if hasattr(fecha_ref, "year"):
            return f"R-{int(s):04d}-{fecha_ref.year}"

    return s

def detectar_tipo_acto(nro_raw: str, tipo_actual: str = None) -> str:
    s = str(nro_raw or "").strip().upper()
    if re.search(r"[-_(\s](S|SUST)(?:[-_\s)]|$)", s):
        return "SUSTITUCION_VEHICULAR"
    if re.search(r"[-_(\s](I|INC)(?:[-_\s)]|$)", s):
        return "INCREMENTO_FLOTA"
    if re.search(r"[-_(\s](M|MOD)(?:[-_\s)]|$)", s):
        return "MODIFICACION_RUTA"
    if re.search(r"[-_(\s](C|CAN|B|BAJA)(?:[-_\s)]|$)", s):
        return "CANCELACION_PARCIAL"
    if re.search(r"[-_(\s](FE|ERRATA)(?:[-_\s)]|$)", s):
        return "FE_DE_ERRATAS"
    return tipo_actual or "INCREMENTO_FLOTA"

async def ejecutar_migracion():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    print("=" * 70)
    print("MIGRACIÓN Y NORMALIZACIÓN: Resoluciones Hijas, Flota y Primigenias")
    print("=" * 70)

    # 1. Normalizar resoluciones_primigenias
    col_prim = db.resoluciones_primigenias
    actualizadas_prim = 0
    async for p in col_prim.find({}):
        orig = p.get("nro_resolucion")
        norm = normalizar_codigo(orig, p.get("fecha_resolucion"))
        if norm and norm != orig and norm.startswith("R-"):
            await col_prim.update_one({"_id": p["_id"]}, {"$set": {"nro_resolucion": norm}})
            actualizadas_prim += 1
    print(f"Resoluciones Primigenias actualizadas: {actualizadas_prim}")

    # 2. Normalizar resoluciones_hijas
    col_hijas = db.resoluciones_hijas
    actualizadas_hijas = 0
    tipos_corregidos = 0
    prim_hijas_actualizadas = 0

    async for h in col_hijas.find({}):
        orig_res = h.get("nro_resolucion") or ""
        orig_prim = h.get("nro_resolucion_primigenia") or ""
        tipo_actual = h.get("tipo_acto")
        fecha_ref = h.get("fecha_resolucion") or h.get("fecha_registro")

        updates = {}

        # Normalizar número de resolución
        norm_res = normalizar_codigo(orig_res, fecha_ref)
        if norm_res and norm_res != orig_res and norm_res.startswith("R-"):
            updates["nro_resolucion"] = norm_res

        # Corregir tipo de acto si venía codificado en el número
        nuevo_tipo = detectar_tipo_acto(orig_res, tipo_actual)
        if nuevo_tipo and nuevo_tipo != tipo_actual:
            updates["tipo_acto"] = nuevo_tipo
            tipos_corregidos += 1

        # Normalizar resolución primigenia de referencia
        if orig_prim:
            norm_prim = normalizar_codigo(orig_prim)
            if norm_prim and norm_prim != orig_prim and norm_prim.startswith("R-"):
                updates["nro_resolucion_primigenia"] = norm_prim
                prim_hijas_actualizadas += 1

        if updates:
            await col_hijas.update_one({"_id": h["_id"]}, {"$set": updates})
            actualizadas_hijas += 1

    print(f"Resoluciones Hijas actualizadas (N° normalizado): {actualizadas_hijas}")
    print(f"Resoluciones Hijas con tipo_acto corregido (ej. -S -> SUSTITUCION): {tipos_corregidos}")
    print(f"Resoluciones Hijas con N° Primigenia padre normalizado: {prim_hijas_actualizadas}")

    # 3. Normalizar flota_empresa
    col_flota = db.flota_empresa
    actualizadas_flota_hija = 0
    actualizadas_flota_prim = 0

    async for f in col_flota.find({}):
        orig_hija = f.get("nro_resolucion_hija")
        orig_prim = f.get("nro_resolucion_primigenia")
        fecha_ref = f.get("fecha_resolucion_hija") or f.get("fecha_cronologica") or f.get("fecha_registro")

        updates = {}
        if orig_hija:
            norm_h = normalizar_codigo(orig_hija, fecha_ref)
            if norm_h and norm_h != orig_hija and norm_h.startswith("R-"):
                updates["nro_resolucion_hija"] = norm_h
                actualizadas_flota_hija += 1

        if orig_prim:
            norm_p = normalizar_codigo(orig_prim)
            if norm_p and norm_p != orig_prim and norm_p.startswith("R-"):
                updates["nro_resolucion_primigenia"] = norm_p
                actualizadas_flota_prim += 1

        if updates:
            await col_flota.update_one({"_id": f["_id"]}, {"$set": updates})

    print(f"Flota Empresa con nro_resolucion_hija normalizada: {actualizadas_flota_hija}")
    print(f"Flota Empresa con nro_resolucion_primigenia normalizada: {actualizadas_flota_prim}")

    print("=" * 70)
    print("MIGRACIÓN COMPLETADA CON ÉXITO")
    print("=" * 70)
    client.close()

if __name__ == "__main__":
    asyncio.run(ejecutar_migracion())
