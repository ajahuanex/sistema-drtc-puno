"""
Utilidad para buscar localidades priorizando coordenadas precisas.

Jerarquía de prioridad:
1. CENTRO_POBLADO  - coordenadas exactas del lugar
2. DISTRITO        - centroide del distrito
3. PROVINCIA       - centroide de la provincia
4. Cualquier tipo  - fallback

Cuando hay múltiples localidades con el mismo nombre (ej. 19 "HUAYRAPATA"),
se devuelve el que tenga coordenadas más precisas según esta jerarquía.
"""

import re
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase


ORDEN_TIPOS = {
    # Más preciso primero (menor número = mayor prioridad)
    "centro_poblado": 0,
    "CENTRO_POBLADO": 0,
    "centro poblado": 0,
    "ciudad": 0,
    "CIUDAD": 0,
    "distrito": 1,
    "DISTRITO": 1,
    "provincia": 2,
    "PROVINCIA": 2,
    "otros": 3,
    "OTROS": 3,
}


def _prioridad_tipo(tipo: Optional[str]) -> int:
    """Devuelve la prioridad del tipo de localidad (menor = más preciso)."""
    if not tipo:
        return 99
    return ORDEN_TIPOS.get(tipo, 3)


async def buscar_localidad_por_nombre(
    nombre: str,
    localidades_collection,
    provincia_hint: Optional[str] = None,
    distrito_hint: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Busca una localidad por nombre priorizando centros poblados.

    Estrategia:
    1. Busca coincidencia exacta (case-insensitive) de todas las localidades con ese nombre
    2. Ordena por prioridad de tipo (centro_poblado > distrito > provincia)
    3. Si hay hint de provincia/distrito, filtra primero por eso
    4. Devuelve la localidad con coordenadas más precisas

    Args:
        nombre: Nombre de la localidad a buscar
        localidades_collection: Colección de MongoDB
        provincia_hint: Provincia para filtrar (opcional, mejora precisión)
        distrito_hint: Distrito para filtrar (opcional, mejora precisión)

    Returns:
        Documento de localidad o None
    """
    nombre_limpio = nombre.strip().upper()
    regex_exacto = {"$regex": f"^{re.escape(nombre_limpio)}$", "$options": "i"}

    # 1. Buscar TODAS las coincidencias exactas activas
    candidatos = await localidades_collection.find(
        {"nombre": regex_exacto, "estaActiva": True}
    ).to_list(length=None)

    if not candidatos:
        # 2. Fallback: búsqueda parcial
        candidatos = await localidades_collection.find(
            {
                "nombre": {"$regex": re.escape(nombre_limpio), "$options": "i"},
                "estaActiva": True,
            }
        ).to_list(length=None)

    if not candidatos:
        return None

    if len(candidatos) == 1:
        return candidatos[0]

    # 3. Si hay hints geográficos, filtrar primero por ellos
    if distrito_hint:
        filtrados = [
            c for c in candidatos
            if c.get("distrito", "").upper() == distrito_hint.upper()
        ]
        if filtrados:
            candidatos = filtrados

    if provincia_hint:
        filtrados = [
            c for c in candidatos
            if c.get("provincia", "").upper() == provincia_hint.upper()
        ]
        if filtrados:
            candidatos = filtrados

    # 4. Ordenar por prioridad de tipo y tomar el mejor
    candidatos.sort(key=lambda c: _prioridad_tipo(c.get("tipo")))

    return candidatos[0]
