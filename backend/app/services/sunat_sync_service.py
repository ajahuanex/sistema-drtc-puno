"""
Servicio de sincronización automática y periódica de datos SUNAT para empresas (SIRRETT).
Ejecuta la validación en un horario específico diario (por defecto 07:00 AM hora local de Perú / UTC-5)
y permite la ejecución manual en cualquier momento por parte de administradores.
Mantiene actualizados los estados (ACTIVO, HABIDO, razón social oficial, etc.) en MongoDB.
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
import httpx

from app.config.settings import settings
from app.dependencies.db import get_database

logger = logging.getLogger("sunat_sync_service")

# Zona horaria oficial para Perú (UTC-5, permanente sin DST)
TZ_PERU = timezone(timedelta(hours=-5), name="America/Lima")

def _get_ahora_peru() -> datetime:
    """Retorna la fecha y hora actual en zona horaria de Perú (UTC-5)."""
    return datetime.now(TZ_PERU)

def calcular_proxima_ejecucion(horario_str: str = "07:00") -> datetime:
    """
    Calcula el siguiente datetime (en TZ_PERU) en el que debe ejecutarse el cron
    según la hora y minutos especificados en formato 'HH:MM'.
    Si la hora de hoy ya pasó, programa para el día siguiente a la misma hora.
    """
    try:
        partes = str(horario_str).strip().split(":")
        hora = int(partes[0])
        minuto = int(partes[1]) if len(partes) > 1 else 0
        if not (0 <= hora <= 23 and 0 <= minuto <= 59):
            hora, minuto = 7, 0
    except Exception:
        hora, minuto = 7, 0

    ahora = _get_ahora_peru()
    objetivo = ahora.replace(hour=hora, minute=minuto, second=0, microsecond=0)
    if objetivo <= ahora:
        objetivo += timedelta(days=1)
    return objetivo

# Estado global del proceso cron y sincronización SUNAT
_default_hora = getattr(settings, "SUNAT_CRON_HORA", "07:00")
_default_activo = getattr(settings, "SUNAT_CRON_ACTIVO", True)

sunat_cron_state: Dict[str, Any] = {
    "activo": _default_activo,
    "en_ejecucion": False,
    "horario_programado": _default_hora,
    "timezone": "America/Lima (UTC-5)",
    "proxima_ejecucion": calcular_proxima_ejecucion(_default_hora).isoformat(),
    "ultimo_inicio": None,
    "ultimo_fin": None,
    "total_procesadas": 0,
    "total_actualizadas": 0,
    "total_errores": 0,
    "ultimo_error": None,
    "origen_ultima_ejecucion": None,  # "AUTOMATICO_CRON" | "MANUAL_ADMIN"
    "progreso": {
        "actual": 0,
        "total": 0,
        "porcentaje": 0.0,
        "ruc_actual": None
    }
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

async def ejecutar_validacion_sunat_masiva(
    forzar_todas: bool = False,
    origen: str = "MANUAL_ADMIN"
) -> Dict[str, Any]:
    """
    Recorre las empresas en MongoDB y consulta la API de SUNAT para actualizar
    los datos registrales tributarios de cada una.
    
    - forzar_todas: Si es True, actualiza todas sin importar cuándo se validaron por última vez.
                    Si es False, solo actualiza las pendientes o validadas hace más de 24 horas.
    - origen: Indica si fue disparado automáticamente por el cron diario ('AUTOMATICO_CRON')
              o manualmente por el administrador ('MANUAL_ADMIN').
    """
    global sunat_cron_state
    if sunat_cron_state["en_ejecucion"]:
        logger.warning("⚠️ Intento de sincronización SUNAT ignorado: ya existe una tarea en curso.")
        return {
            "status": "ocupado",
            "mensaje": "Ya existe una sincronización SUNAT en ejecución.",
            "estado": sunat_cron_state
        }

    ahora_pe = _get_ahora_peru()
    sunat_cron_state["en_ejecucion"] = True
    sunat_cron_state["ultimo_inicio"] = ahora_pe.isoformat()
    sunat_cron_state["origen_ultima_ejecucion"] = origen
    sunat_cron_state["ultimo_error"] = None
    sunat_cron_state["progreso"] = {
        "actual": 0,
        "total": 0,
        "porcentaje": 0.0,
        "ruc_actual": None
    }

    db = await get_database()
    if db is None:
        sunat_cron_state["en_ejecucion"] = False
        sunat_cron_state["ultimo_error"] = "No hay conexión a la base de datos MongoDB"
        return {"status": "error", "mensaje": "Base de datos no disponible"}

    empresas_col = db["empresas"]
    ahora_utc = datetime.utcnow()
    hace_24h_utc = ahora_utc - timedelta(hours=24)

    # Buscar empresas que requieran validación
    filtro: Dict[str, Any] = {}
    if not forzar_todas:
        filtro = {
            "$or": [
                {"ultimaValidacionSunat": {"$exists": False}},
                {"ultimaValidacionSunat": None},
                {"ultimaValidacionSunat": {"$lt": hace_24h_utc}}
            ]
        }

    try:
        cursor = empresas_col.find(filtro, {"_id": 1, "ruc": 1, "razonSocial": 1, "datosSunat": 1})
        empresas_a_procesar = await cursor.to_list(length=10000)
    except Exception as e:
        sunat_cron_state["en_ejecucion"] = False
        sunat_cron_state["ultimo_error"] = f"Error obteniendo lista de empresas: {e}"
        logger.error(f"❌ {sunat_cron_state['ultimo_error']}")
        return {"status": "error", "mensaje": sunat_cron_state["ultimo_error"]}

    total = len(empresas_a_procesar)
    actualizadas = 0
    errores = 0

    sunat_cron_state["progreso"]["total"] = total
    logger.info(f"🔄 [SUNAT SYNC | {origen}] Iniciando validación de {total} empresas (forzar={forzar_todas})...")

    for i, emp in enumerate(empresas_a_procesar, 1):
        ruc = emp.get("ruc")
        sunat_cron_state["progreso"]["actual"] = i
        sunat_cron_state["progreso"]["porcentaje"] = round((i / max(total, 1)) * 100, 1)
        sunat_cron_state["progreso"]["ruc_actual"] = ruc

        if not ruc or len(ruc) != 11:
            continue

        try:
            sunat_raw = await _fetch_sunat_data(ruc)
            if sunat_raw:
                payload = _build_datos_sunat_payload(sunat_raw, ahora_utc)
                update_fields: Dict[str, Any] = {
                    "datosSunat": payload,
                    "ultimaValidacionSunat": ahora_utc,
                    "estadoSunat": payload.get("desc_estado", "ACTIVO")
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

        # Pequeño delay de cortesía (0.8s) para no saturar la API externa
        await asyncio.sleep(0.8)

    fin_pe = _get_ahora_peru()
    sunat_cron_state["en_ejecucion"] = False
    sunat_cron_state["ultimo_fin"] = fin_pe.isoformat()
    sunat_cron_state["total_procesadas"] = total
    sunat_cron_state["total_actualizadas"] = actualizadas
    sunat_cron_state["total_errores"] = errores
    sunat_cron_state["progreso"]["actual"] = total
    sunat_cron_state["progreso"]["porcentaje"] = 100.0
    sunat_cron_state["progreso"]["ruc_actual"] = None

    # Recalcular próxima ejecución programada
    prox = calcular_proxima_ejecucion(sunat_cron_state["horario_programado"])
    sunat_cron_state["proxima_ejecucion"] = prox.isoformat()

    duracion = (fin_pe - ahora_pe).total_seconds()
    logger.info(
        f"🏁 [SUNAT SYNC | {origen}] Proceso finalizado en {round(duracion, 1)}s: "
        f"{actualizadas} actualizadas, {errores} errores de {total} totales. "
        f"Próxima ejecución: {prox.isoformat()}"
    )

    return {
        "status": "completado",
        "origen": origen,
        "total": total,
        "actualizadas": actualizadas,
        "errores": errores,
        "duracion_segundos": duracion,
        "proxima_ejecucion": sunat_cron_state["proxima_ejecucion"]
    }

async def loop_cron_sunat_diario():
    """
    Planificador en segundo plano que vigila el reloj y dispara la consulta masiva
    a SUNAT diariamente en el horario configurado (ej. 07:00 AM hora de Perú).
    """
    logger.info("⏰ [CRON SUNAT] Inicializando planificador diario automático de validación SUNAT...")
    
    # Calcular próxima ejecución inicial
    prox = calcular_proxima_ejecucion(sunat_cron_state["horario_programado"])
    sunat_cron_state["proxima_ejecucion"] = prox.isoformat()
    logger.info(
        f"⏰ [CRON SUNAT] Horario programado: {sunat_cron_state['horario_programado']} (Hora Perú / UTC-5). "
        f"Primera ejecución programada para: {prox.strftime('%Y-%m-%d %H:%M:%S %Z')}"
    )

    # Espera inicial de 15 segundos para que la BD termine de iniciar
    await asyncio.sleep(15)

    while True:
        try:
            if not sunat_cron_state.get("activo", True):
                await asyncio.sleep(60)
                continue

            ahora_pe = _get_ahora_peru()
            prox_dt = None
            if sunat_cron_state.get("proxima_ejecucion"):
                try:
                    prox_dt = datetime.fromisoformat(sunat_cron_state["proxima_ejecucion"])
                except Exception:
                    prox_dt = None

            # Si ya se alcanzó o superó la hora fijada y no está corriendo
            if prox_dt and ahora_pe >= prox_dt and not sunat_cron_state["en_ejecucion"]:
                logger.info(
                    f"🚀 [CRON SUNAT] ¡Hora configurada alcanzada ({sunat_cron_state['horario_programado']})! "
                    "Disparando validación automática diaria de empresas..."
                )
                await ejecutar_validacion_sunat_masiva(forzar_todas=False, origen="AUTOMATICO_CRON")
                
                # Programar para el día siguiente a la hora configurada
                nuevo_prox = calcular_proxima_ejecucion(sunat_cron_state["horario_programado"])
                sunat_cron_state["proxima_ejecucion"] = nuevo_prox.isoformat()
                logger.info(f"⏳ [CRON SUNAT] Siguiente validación diaria programada para: {nuevo_prox.strftime('%Y-%m-%d %H:%M:%S %Z')}")

            # Dormir 30 segundos y volver a evaluar el reloj
            await asyncio.sleep(30)

        except asyncio.CancelledError:
            logger.info("🛑 [CRON SUNAT] Tarea diaria cancelada.")
            break
        except Exception as e:
            logger.error(f"💥 [CRON SUNAT] Error inesperado en ciclo cron: {e}")
            await asyncio.sleep(60)

def obtener_estado_cron_sunat() -> Dict[str, Any]:
    """Devuelve el estado detallado de la sincronización y cron SUNAT."""
    return dict(sunat_cron_state)

def actualizar_configuracion_cron(horario_str: Optional[str] = None, activo: Optional[bool] = None) -> Dict[str, Any]:
    """Permite al administrador modificar el horario y activación del cron diario."""
    global sunat_cron_state
    if activo is not None:
        sunat_cron_state["activo"] = bool(activo)

    if horario_str:
        horario_limpio = str(horario_str).strip()
        partes = horario_limpio.split(":")
        if len(partes) >= 1 and partes[0].isdigit():
            hora = int(partes[0])
            minuto = int(partes[1]) if len(partes) > 1 and partes[1].isdigit() else 0
            if 0 <= hora <= 23 and 0 <= minuto <= 59:
                sunat_cron_state["horario_programado"] = f"{hora:02d}:{minuto:02d}"
                # Recalcular inmediatamente la próxima ejecución
                prox = calcular_proxima_ejecucion(sunat_cron_state["horario_programado"])
                sunat_cron_state["proxima_ejecucion"] = prox.isoformat()
                logger.info(f"⚙️ [CRON SUNAT] Horario actualizado a las {sunat_cron_state['horario_programado']} (Hora Perú). Próxima: {prox.isoformat()}")

    return obtener_estado_cron_sunat()
