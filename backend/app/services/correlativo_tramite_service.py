"""
Servicio de Correlativos Anuales de Trámites Administrativos y Resoluciones Hijas (DRTC Puno)
Garantiza la inmutabilidad y secuencialidad atómica de los correlativos 'TR-XXXX-AAAA'
segmentados por año en la colección 'contadores_tramites'.
"""
import re
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from pymongo import ReturnDocument

logger = logging.getLogger(__name__)

COLECCION_CONTADORES = "contadores_tramites"
COLECCION_HIJAS = "resoluciones_hijas"


def extraer_anio_de_resolucion(nro_resolucion: Optional[str], fecha_resolucion: Optional[datetime] = None) -> Optional[int]:
    """
    Extrae con precisión el año legal/oficial de una resolución:
    Ejemplo:
    - 'R-0123-2026' -> 2026
    - '0004-2026-I' -> 2026
    - 'R-2026-2025' -> 2025 (número 2026, año 2025)
    """
    if nro_resolucion:
        s = str(nro_resolucion).strip()
        # Buscar año de 4 dígitos entre guiones, barras o al final
        m = re.search(r'(?:[-_/]|\s)(19\d\d|20\d\d)(?:[-_/(\s]|$)', s)
        if m:
            return int(m.group(1))
    
    if fecha_resolucion and hasattr(fecha_resolucion, "year"):
        return fecha_resolucion.year
        
    return None


async def obtener_siguiente_correlativo_tramite(db, anio: Optional[int] = None) -> str:
    """
    Genera atómicamente el siguiente correlativo secuencial anual TR-XXXX-AAAA.
    Es thread-safe y previene colisiones concurrentes mediante find_one_and_update.
    """
    anio_val = anio or datetime.utcnow().year
    doc_id = f"tramite_{anio_val}"
    now = datetime.utcnow()

    res = await db[COLECCION_CONTADORES].find_one_and_update(
        {"_id": doc_id},
        {
            "$inc": {"secuencia": 1},
            "$setOnInsert": {
                "anio": anio_val,
                "fecha_creacion": now
            },
            "$set": {
                "fecha_actualizacion": now
            }
        },
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    secuencia = res.get("secuencia", 1)
    return f"TR-{secuencia:04d}-{anio_val}"


async def establecer_contador_tramite(db, anio: int, valor: int) -> int:
    """
    Fija o eleva la base del contador anual para un año específico.
    Si el valor actual es mayor, lo preserva para evitar solapamientos.
    """
    doc_id = f"tramite_{anio}"
    now = datetime.utcnow()

    doc_existente = await db[COLECCION_CONTADORES].find_one({"_id": doc_id})
    secuencia_actual = doc_existente.get("secuencia", 0) if doc_existente else 0

    nueva_secuencia = max(secuencia_actual, valor)
    await db[COLECCION_CONTADORES].update_one(
        {"_id": doc_id},
        {
            "$set": {
                "anio": anio,
                "secuencia": nueva_secuencia,
                "fecha_actualizacion": now
            },
            "$setOnInsert": {
                "fecha_creacion": now
            }
        },
        upsert=True
    )
    return nueva_secuencia


async def obtener_resumen_contadores(db) -> Dict[str, Any]:
    """Retorna el estado de los contadores registrados por año."""
    contadores = await db[COLECCION_CONTADORES].find().to_list(length=100)
    resultado = {}
    for c in contadores:
        resultado[str(c.get("anio", c.get("_id")))] = c.get("secuencia", 0)
    return resultado


async def inicializar_correlativos_2026(db, forzar_renumeracion: bool = False) -> Dict[str, Any]:
    """
    Escanea las resoluciones hijas del año 2026, las ordena de forma ascendente
    por su identificador y fecha de emisión oficial, y asigna de manera permanente
    e inmutable 'correlativo_tramite' (TR-0001-2026 ... TR-XXXX-2026).
    Fija el contador en 'contadores_tramites' en el valor máximo asignado.
    """
    docs_2026: List[Dict[str, Any]] = []
    async for d in db[COLECCION_HIJAS].find({"esta_activo": {"$ne": False}}):
        nro = d.get("nro_resolucion")
        f_res = d.get("fecha_resolucion")
        yr = extraer_anio_de_resolucion(nro, f_res)
        if yr == 2026:
            docs_2026.append(d)

    # Ordenar ascendente:
    # 1. Por fecha de resolución
    # 2. Por código de resolución ascendente
    def clave_orden(doc):
        nro = str(doc.get("nro_resolucion") or "")
        # Extraer número entero de la resolución para ordenar numéricamente ej. 0004 < 0010 < 0100
        m = re.search(r'R?-?0*(\d+)-2026', nro)
        num_int = int(m.group(1)) if m else 99999
        f = doc.get("fecha_resolucion")
        f_str = f.isoformat() if f and hasattr(f, "isoformat") else "9999-99-99"
        return (f_str, num_int, nro)

    docs_2026.sort(key=clave_orden)

    asignados = 0
    actualizados = 0
    now = datetime.utcnow()

    for idx, doc in enumerate(docs_2026, start=1):
        corr_actual = doc.get("correlativo_tramite")
        nuevo_corr = f"TR-{idx:04d}-2026"

        if not corr_actual or forzar_renumeracion:
            await db[COLECCION_HIJAS].update_one(
                {"_id": doc["_id"]},
                {
                    "$set": {
                        "correlativo_tramite": nuevo_corr,
                        "fecha_actualizacion": now
                    }
                }
            )
            if not corr_actual:
                asignados += 1
            else:
                actualizados += 1

    total_2026 = len(docs_2026)
    # Establecer el contador anual en base al total procesado
    contador_final = await establecer_contador_tramite(db, 2026, total_2026)

    logger.info(
        f"[CorrelativoTramite] Inicialización 2026 completada. "
        f"Total: {total_2026}, Nuevos asignados: {asignados}, Contador fijado en: {contador_final}"
    )

    return {
        "success": True,
        "anio": 2026,
        "total_tramites_2026": total_2026,
        "nuevos_asignados": asignados,
        "actualizados": actualizados,
        "contador_final": contador_final,
        "siguiente_correlativo_sugerido": f"TR-{contador_final + 1:04d}-2026"
    }
