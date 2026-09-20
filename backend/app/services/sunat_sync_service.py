"""
Servicio de sincronización automática y periódica de datos SUNAT para empresas (SIRRET).
Ejecuta la validación diaria en segundo plano y mantiene actualizados los estados
(ACTIVO, HABIDO, razón social oficial, etc.) en MongoDB.
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import httpx

from app.dependencies.db import get_database

logger = logging.getLogger("sunat_sync_service")

# Estado global del proceso cron
sunat_cron_state: Dict[str, Any] = {
    "activo": True,
    "en_ejecucion": False,
    "ultimo_inicio": None,
    "ultimo_fin": None,
    "total_procesadas": 0,
    "total_actualizadas": 0,
    "total_errores": 0,
    "proxima_ejecucion": None,
    "ultimo_error": None
}

def _build_datos_sunat_payload(sunat_raw: dict, ahora: datetime) -> dict:
    """Construye el payload normalizado para datosSunat."""
    estados_ruc = {
        '00': 'ACTIVO', '10': 'SUSPENSION TEMPORAL', '11': 'BAJA DE OFICIO',
        '12': 'BAJA DEFINITIVA', '20': 'BAJA PROVISIONAL',
        '21': 'BAJA PROV. POR OFICIO', '22': 'SUSPENSION PROVISIONAL'
    }
    ddp_nombre = (sunat_raw.get('ddp_nombre') or '').strip()
    ddp_estado = sunat_raw.get('ddp_estado') or ''
    desc_estado = sunat_raw.get('desc_estado') or estados_ruc.get(ddp_estado, ddp_estado)
    desc_flag22 = sunat_raw.get('desc_flag22') or ('HABIDO' if sunat_raw.get('ddp_flag22') == '00' else 'NO HABIDO')
    
    es_activo = (ddp_estado == '00' or str(desc_estado).upper() == 'ACTIVO')
    es_habido = ('HABIDO' in str(desc_flag22).upper() or sunat_raw.get('ddp_flag22') == '00')

    tip_via = sunat_raw.get('desc_tipvia', '') or ''
    nom_via = sunat_raw.get('ddp_nomvia', '') or ''
    num1 = sunat_raw.get('ddp_numer1', '') or ''
    tip_zon = sunat_raw.get('desc_tipzon', '') or ''
    nom_zon = sunat_raw.get('ddp_nomzon', '') or ''
    dist = sunat_raw.get('desc_dist', '') or ''
    prov = sunat_raw.get('desc_prov', '') or ''
    dep = sunat_raw.get('desc_dep', '') or ''

    partes_dir = [p for p in [f"{tip_via} {nom_via}".strip(), num1, f"{tip_zon} {nom_zon}".strip(), f"{dist} - {prov} - {dep}".strip()] if p and p != '-']
    direccion_completa = ", ".join(partes_dir)

    return {
        "ddp_nombre": ddp_nombre,
        "ddp_estado": ddp_estado,
        "desc_estado": desc_estado,
        "desc_flag22": desc_flag22,
        "esActivo": es_activo,
        "esHabido": es_habido,
        "desc_ciiu": sunat_raw.get('desc_ciiu', '') or '',
        "desc_tpoemp": sunat_raw.get('desc_tpoemp', '') or '',
        "desc_dep": dep,
        "desc_prov": prov,
        "desc_dist": dist,
        "direccionFiscalSunat": direccion_completa,
        "ddp_ubigeo": sunat_raw.get('ddp_ubigeo', '') or '',
        "ddp_ciiu": sunat_raw.get('ddp_ciiu', '') or '',
        "ddp_fecalt": sunat_raw.get('ddp_fecalt', '') or '',
        "ddp_fecact": sunat_raw.get('ddp_fecact', '') or '',
        "fechaConsulta": ahora.isoformat(),
        "raw": sunat_raw,
        "valido": es_activo,
        "razonSocial": ddp_nombre,
        "condicion": desc_flag22
    }

async def _fetch_sunat_data(ruc: str) -> Optional[dict]:
    """Consulta el endpoint oficial/proxy de SUNAT para obtener los datos de la empresa."""
    if not ruc or len(ruc) != 11 or not ruc.isdigit():
        return None
    url = f"https://pcm.guillermo.pe/api/v1/consultas/sunat-ruc/datos-principales?transport=rest&rest_format=json&numruc={ruc}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                res_json = resp.json()
                if res_json and isinstance(res_json, dict) and 'data' in res_json:
                    return res_json['data']
    except Exception as e:
        logger.warning(f"Error consultando SUNAT para RUC {ruc}: {e}")
    return None

async def ejecutar_validacion_sunat_masiva(forzar_todas: bool = False) -> Dict[str, Any]:
    """
    Recorre las empresas en MongoDB y consulta la API de SUNAT para actualizar
    los datos registrales tributarios de cada una.
    """
    global sunat_cron_state
    if sunat_cron_state["en_ejecucion"]:
        return {
            "status": "ocupado",
            "mensaje": "Ya existe una sincronización SUNAT en ejecución.",
            "estado": sunat_cron_state
        }

    sunat_cron_state["en_ejecucion"] = True
    sunat_cron_state["ultimo_inicio"] = datetime.utcnow().isoformat()
    sunat_cron_state["ultimo_error"] = None

    db = await get_database()
    if db is None:
        sunat_cron_state["en_ejecucion"] = False
        sunat_cron_state["ultimo_error"] = "No hay conexión a la base de datos"
        return {"status": "error", "mensaje": "Base de datos no disponible"}

    empresas_col = db["empresas"]
    ahora = datetime.utcnow()
    hace_24h = ahora - timedelta(hours=24)

    # Buscar empresas que requieran validación (sin validación o con validación > 24h)
    filtro: Dict[str, Any] = {}
    if not forzar_todas:
        filtro = {
            "$or": [
                {"ultimaValidacionSunat": {"$exists": False}},
                {"ultimaValidacionSunat": None},
                {"ultimaValidacionSunat": {"$lt": hace_24h}}
            ]
        }

    cursor = empresas_col.find(filtro, {"_id": 1, "ruc": 1, "razonSocial": 1})
    empresas_a_procesar = await cursor.to_list(length=5000)

    total = len(empresas_a_procesar)
    actualizadas = 0
    errores = 0

    logger.info(f"🔄 [CRON SUNAT DIARIO] Iniciando validación de {total} empresas...")

    for i, emp in enumerate(empresas_a_procesar, 1):
        ruc = emp.get("ruc")
        if not ruc or len(ruc) != 11:
            continue

        try:
            sunat_raw = await _fetch_sunat_data(ruc)
            if sunat_raw:
                payload = _build_datos_sunat_payload(sunat_raw, ahora)
                update_fields: Dict[str, Any] = {
                    "datosSunat": payload,
                    "ultimaValidacionSunat": ahora
                }
                
                # Actualizar también razonSocial.sunat si aplica
                rz = emp.get("razonSocial")
                if isinstance(rz, dict):
                    rz_actualizada = {**rz, "sunat": payload["ddp_nombre"]}
                    update_fields["razonSocial"] = rz_actualizada
                elif isinstance(rz, str):
                    update_fields["razonSocial"] = {"principal": rz, "sunat": payload["ddp_nombre"]}

                await empresas_col.update_one(
                    {"_id": emp["_id"]},
                    {"$set": update_fields}
                )
                actualizadas += 1
                logger.debug(f"[{i}/{total}] ✅ SUNAT actualizado RUC {ruc}: {payload['desc_estado']} / {payload['desc_flag22']}")
            else:
                errores += 1
                logger.warning(f"[{i}/{total}] ⚠️ No se obtuvieron datos SUNAT para RUC {ruc}")

        except Exception as e:
            errores += 1
            logger.error(f"[{i}/{total}] ❌ Error validando RUC {ruc}: {e}")

        # Pequeño delay de cortesía (1.0s) para evitar saturar la API externa
        await asyncio.sleep(1.0)

    fin = datetime.utcnow()
    sunat_cron_state["en_ejecucion"] = False
    sunat_cron_state["ultimo_fin"] = fin.isoformat()
    sunat_cron_state["total_procesadas"] = total
    sunat_cron_state["total_actualizadas"] = actualizadas
    sunat_cron_state["total_errores"] = errores
    sunat_cron_state["proxima_ejecucion"] = (fin + timedelta(hours=24)).isoformat()

    logger.info(f"🏁 [CRON SUNAT DIARIO] Proceso finalizado: {actualizadas} actualizadas, {errores} errores de {total} totales.")

    return {
        "status": "completado",
        "total": total,
        "actualizadas": actualizadas,
        "errores": errores,
        "duracion_segundos": (fin - ahora).total_seconds(),
        "proxima_ejecucion": sunat_cron_state["proxima_ejecucion"]
    }

async def loop_cron_sunat_diario():
    """
    Tarea en bucle infinito que se ejecuta automáticamente cada día (cada 24 horas).
    """
    logger.info("⏰ [CRON SUNAT] Inicializando planificador diario automático de validación SUNAT...")
    
    # Espera inicial de 30 segundos tras levantar el servidor para permitir
    # que MongoDB y los demás servicios estén 100% listos.
    await asyncio.sleep(30)

    while True:
        try:
            logger.info("🚀 [CRON SUNAT] Disparando validación automática diaria de empresas con SUNAT...")
            await ejecutar_validacion_sunat_masiva(forzar_todas=False)
        except asyncio.CancelledError:
            logger.info("🛑 [CRON SUNAT] Tarea diaria cancelada.")
            break
        except Exception as e:
            logger.error(f"💥 [CRON SUNAT] Error inesperado en ciclo diario: {e}")

        # Esperar 24 horas (86400 segundos) para la siguiente validación diaria
        horas_espera = 24
        sunat_cron_state["proxima_ejecucion"] = (datetime.utcnow() + timedelta(hours=horas_espera)).isoformat()
        logger.info(f"⏳ [CRON SUNAT] Próxima ejecución programada en {horas_espera} horas.")
        
        try:
            await asyncio.sleep(horas_espera * 3600)
        except asyncio.CancelledError:
            logger.info("🛑 [CRON SUNAT] Tarea diaria detenida durante espera.")
            break

def obtener_estado_cron_sunat() -> Dict[str, Any]:
    """Devuelve el estado actual del cron de validación SUNAT."""
    return sunat_cron_state
