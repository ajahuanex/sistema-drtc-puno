"""
Servicio para Verificación Masiva y Persistencia de Casilla Electrónica (MTC / DRTC Puno).
Permite verificar el estado de casilla de todas las empresas de transporte,
actualizar la base de datos MongoDB y registrar historial para auditoría y Dashboard.
"""
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import httpx

from app.dependencies.db import get_database

logger = logging.getLogger("casilla_service")

BASE_URL_CASILLA = "https://mtc.transportespuno.gob.pe/api/v2"
API_KEY_CASILLA = "topSecret123"

# Zona horaria Perú (UTC-5)
TZ_PERU = timezone(timedelta(hours=-5), name="America/Lima")

def _get_ahora_peru() -> datetime:
    return datetime.now(TZ_PERU)

# Estado global en memoria de la ejecución masiva
casilla_sync_state: Dict[str, Any] = {
    "en_ejecucion": False,
    "ultimo_inicio": None,
    "ultimo_fin": None,
    "total": 0,
    "procesadas": 0,
    "con_casilla": 0,
    "sin_casilla": 0,
    "errores": 0,
    "porcentaje": 0.0,
    "empresa_actual": None,
    "ruc_actual": None,
    "ultimo_error": None,
    "origen": None
}


def _extraer_nombre_empresa(rs: Any) -> str:
    """Obtiene el nombre en texto plano de la razón social."""
    if isinstance(rs, dict):
        return (rs.get("principal") or rs.get("sunat") or str(rs)).strip()
    return str(rs or "").strip()


async def consultar_casilla_api(nro_documento: str, tipo_persona: Optional[str] = None, tipo_documento: str = "00001") -> Dict[str, Any]:
    """
    Consulta la API Node-RED del MTC / DRTC Puno para verificar la casilla.
    - tipo_documento: '00001' (RUC) o '00002' (DNI)
    - tipo_persona: '00002' (Jurídica) o '00001' (Natural)
    """
    doc_limpio = str(nro_documento).strip()
    if not tipo_persona:
        # Si el RUC empieza con 10, es persona natural con negocio
        tipo_persona = "00001" if (doc_limpio.startswith("10") or len(doc_limpio) == 8) else "00002"

    params = {
        "codTipoPersona": tipo_persona,
        "codTipoDocumento": tipo_documento,
        "nroDocumento": doc_limpio
    }
    headers = {
        "x-api-key": API_KEY_CASILLA,
        "Content-Type": "application/json",
        "User-Agent": "DRTC-Puno-Verificador/2.0"
    }

    try:
        async with httpx.AsyncClient(verify=False, timeout=12.0) as client:
            resp = await client.get(f"{BASE_URL_CASILLA}/info", params=params, headers=headers)
            
            # Si el servicio responde 200 con datos válidos
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    info = data.get("info", {}) if isinstance(data, dict) else {}
                    data_obj = info.get("data", {}) if isinstance(info, dict) else {}
                    activo = bool(data_obj.get("activo") is True)
                    
                    return {
                        "exito": True,
                        "consultado": True,
                        "tiene_casilla": activo,
                        "activo": activo,
                        "nombre_completo": data_obj.get("nombreCompleto"),
                        "email": data_obj.get("email"),
                        "telefono": data_obj.get("telefono"),
                        "direccion": data_obj.get("direccion"),
                        "raw_data": data_obj,
                        "mensaje": "Casilla verificada exitosamente" if activo else "Sin casilla activa registrada"
                    }
                except Exception as parse_err:
                    logger.warning(f"Error parseando JSON 200 de casilla para {doc_limpio}: {parse_err}")

            # Si responde 401: en Node-RED indica administrado sin casilla activa
            if resp.status_code == 401:
                try:
                    data = resp.json()
                    # Si devuelve {"status":"exitoso","info":""} significa que no tiene casilla registrada
                    if data.get("status") == "exitoso" or "info" in data:
                        return {
                            "exito": True,
                            "consultado": True,
                            "tiene_casilla": False,
                            "activo": False,
                            "nombre_completo": None,
                            "email": None,
                            "raw_data": None,
                            "mensaje": "Administrado no cuenta con casilla electrónica registrada"
                        }
                except Exception:
                    pass

                return {
                    "exito": True,
                    "consultado": True,
                    "tiene_casilla": False,
                    "activo": False,
                    "mensaje": "Sin casilla electrónica activa en padrón DRTC"
                }

            # Si Cloudflare o firewall devuelve HTML
            if "html" in resp.headers.get("content-type", "").lower() or "<html" in resp.text[:200].lower():
                logger.warning(f"Servidor externo de casillas devolvió HTML para doc {doc_limpio} (Status: {resp.status_code})")
                return {
                    "exito": False,
                    "consultado": False,
                    "tiene_casilla": False,
                    "error": f"Servicio temporalmente no disponible (Cloudflare/Status {resp.status_code})"
                }

            # Otros códigos de respuesta
            return {
                "exito": False,
                "consultado": False,
                "tiene_casilla": False,
                "error": f"Servidor externo respondió con código {resp.status_code}"
            }

    except httpx.TimeoutException:
        logger.error(f"Timeout al consultar casilla para documento {doc_limpio}")
        return {
            "exito": False,
            "consultado": False,
            "tiene_casilla": False,
            "error": "Tiempo de espera agotado al conectar con el servicio de casillas"
        }
    except Exception as e:
        logger.error(f"Error general consultando casilla para {doc_limpio}: {e}")
        return {
            "exito": False,
            "consultado": False,
            "tiene_casilla": False,
            "error": str(e)
        }


async def ejecutar_verificacion_masiva_empresas(origen: str = "MANUAL_WEB", solo_pendientes: bool = True) -> Dict[str, Any]:
    """
    Recorre las empresas activas en MongoDB que aún no tienen casilla habilitada,
    verifica su estado en la API MTC y actualiza de forma compacta en MongoDB.
    Si solo_pendientes=True, omite consultar las empresas que ya tienen casilla habilitada.
    """
    global casilla_sync_state
    if casilla_sync_state["en_ejecucion"]:
        logger.warning("Intento de verificación masiva ignorado: ya existe una tarea en curso.")
        return {
            "status": "ocupado",
            "mensaje": "Ya existe una verificación masiva de casillas en ejecución.",
            "estado": casilla_sync_state
        }

    ahora_pe = _get_ahora_peru()
    casilla_sync_state["en_ejecucion"] = True
    casilla_sync_state["ultimo_inicio"] = ahora_pe.isoformat()
    casilla_sync_state["origen"] = origen
    casilla_sync_state["ultimo_error"] = None
    casilla_sync_state["procesadas"] = 0
    casilla_sync_state["con_casilla"] = 0
    casilla_sync_state["sin_casilla"] = 0
    casilla_sync_state["errores"] = 0
    casilla_sync_state["porcentaje"] = 0.0

    db = await get_database()
    if db is None:
        casilla_sync_state["en_ejecucion"] = False
        casilla_sync_state["ultimo_error"] = "No hay conexión a la base de datos MongoDB"
        return {"status": "error", "mensaje": "Base de datos no disponible"}

    empresas_col = db["empresas"]
    historial_col = db["casilla_verificaciones"]

    try:
        total_global = await empresas_col.count_documents({"estaActivo": True})
        habilitadas_previas = await empresas_col.count_documents({
            "estaActivo": True,
            "$or": [
                {"casillaElectronica.habilitada": True},
                {"tieneCasillaElectronica": True}
            ]
        })

        if solo_pendientes:
            query = {
                "estaActivo": True,
                "$or": [
                    {"casillaElectronica.habilitada": {"$ne": True}},
                    {"casillaElectronica": {"$exists": False}},
                    {"casillaElectronica": None}
                ]
            }
        else:
            query = {"estaActivo": True}

        cursor = empresas_col.find(
            query,
            {"_id": 1, "ruc": 1, "razonSocial": 1, "casillaElectronica": 1, "emailContacto": 1}
        )
        empresas = await cursor.to_list(length=10000)
    except Exception as e:
        casilla_sync_state["en_ejecucion"] = False
        casilla_sync_state["ultimo_error"] = f"Error obteniendo empresas: {e}"
        logger.error(f"Error obteniendo empresas: {e}")
        return {"status": "error", "mensaje": str(e)}

    total_pendientes = len(empresas)
    casilla_sync_state["total"] = total_pendientes
    casilla_sync_state["con_casilla"] = habilitadas_previas
    logger.info(f"🚀 Iniciando verificación de {total_pendientes} empresas pendientes ({habilitadas_previas} ya están habilitadas de un total de {total_global})...")

    nuevas_con_casilla = 0
    nuevas_sin_casilla = 0
    errores = 0
    detalles_resumen: List[Dict[str, Any]] = []

    # Control de concurrencia para no saturar Node-RED (3 consultas simultáneas)
    semaphore = asyncio.Semaphore(3)

    async def verificar_una_empresa(idx: int, emp: Dict[str, Any]):
        nonlocal nuevas_con_casilla, nuevas_sin_casilla, errores
        ruc = emp.get("ruc")
        rs_nombre = _extraer_nombre_empresa(emp.get("razonSocial"))
        emp_id = emp["_id"]

        if not ruc or len(str(ruc).strip()) != 11:
            nuevas_sin_casilla += 1
            casilla_sync_state["sin_casilla"] = nuevas_sin_casilla
            return

        async with semaphore:
            casilla_sync_state["ruc_actual"] = ruc
            casilla_sync_state["empresa_actual"] = rs_nombre

            resultado = await consultar_casilla_api(nro_documento=ruc, tipo_documento="00001")
            
            ahora_utc = datetime.utcnow()
            tiene_casilla = resultado.get("tiene_casilla", False)
            
            if resultado.get("exito"):
                if tiene_casilla:
                    nuevas_con_casilla += 1
                else:
                    nuevas_sin_casilla += 1

                # Guardar objeto compacto y eliminar campos obsoletos
                compact_casilla = {
                    "habilitada": tiene_casilla,
                    "fechaValidacion": ahora_utc
                }

                try:
                    await empresas_col.update_one(
                        {"_id": emp_id},
                        {
                            "$set": {"casillaElectronica": compact_casilla},
                            "$unset": {
                                "tieneCasillaElectronica": "",
                                "datosCasilla": "",
                                "ultimaValidacionCasilla": ""
                            }
                        }
                    )
                except Exception as upd_err:
                    logger.error(f"Error actualizando empresa RUC {ruc} en DB: {upd_err}")

                detalles_resumen.append({
                    "ruc": ruc,
                    "razonSocial": rs_nombre,
                    "tieneCasilla": tiene_casilla,
                    "email": resultado.get("email") or emp.get("emailContacto"),
                    "mensaje": resultado.get("mensaje"),
                    "fecha": ahora_utc.isoformat()
                })
            else:
                errores += 1
                logger.warning(f"Falla al verificar RUC {ruc}: {resultado.get('error')}")
                detalles_resumen.append({
                    "ruc": ruc,
                    "razonSocial": rs_nombre,
                    "tieneCasilla": False,
                    "error": resultado.get("error"),
                    "fecha": ahora_utc.isoformat()
                })

            casilla_sync_state["procesadas"] = idx
            casilla_sync_state["con_casilla"] = habilitadas_previas + nuevas_con_casilla
            casilla_sync_state["sin_casilla"] = nuevas_sin_casilla
            casilla_sync_state["errores"] = errores
            casilla_sync_state["porcentaje"] = round((idx / max(total_pendientes, 1)) * 100, 1)

            # Pequeña pausa para no saturar el servidor destino
            await asyncio.sleep(0.15)

    # Si no hay pendientes, terminar de inmediato
    if total_pendientes > 0:
        for i, emp in enumerate(empresas, 1):
            await verificar_una_empresa(i, emp)

    fin_pe = _get_ahora_peru()
    casilla_sync_state["en_ejecucion"] = False
    casilla_sync_state["ultimo_fin"] = fin_pe.isoformat()
    casilla_sync_state["porcentaje"] = 100.0
    casilla_sync_state["empresa_actual"] = None
    casilla_sync_state["ruc_actual"] = None

    con_casilla_total = habilitadas_previas + nuevas_con_casilla
    sin_casilla_total = max(0, total_global - con_casilla_total)

    # Guardar documento histórico en MongoDB para que la consulta NUNCA se pierda
    registro_auditoria = {
        "fecha": datetime.utcnow(),
        "fecha_peru": fin_pe.strftime("%Y-%m-%d %H:%M:%S"),
        "origen": origen,
        "totalEmpresas": total_global,
        "pendientesVerificadas": total_pendientes,
        "conCasilla": con_casilla_total,
        "sinCasilla": sin_casilla_total,
        "nuevasHabilitadas": nuevas_con_casilla,
        "errores": errores,
        "porcentajeConCasilla": round((con_casilla_total / max(total_global, 1)) * 100, 1),
        "totalDetalles": len(detalles_resumen),
        "creadoEn": datetime.utcnow()
    }

    try:
        await historial_col.insert_one(registro_auditoria)
        logger.info(f"✅ Verificación masiva de casillas guardada en DB con éxito: {con_casilla_total} con casilla, {sin_casilla_total} sin casilla.")
    except Exception as hist_err:
        logger.error(f"Error guardando auditoría de casilla en DB: {hist_err}")

    return {
        "status": "completado",
        "mensaje": f"Verificación completada: se evaluaron {total_pendientes} empresas pendientes ({nuevas_con_casilla} nuevas habilitadas). Total regional: {con_casilla_total} de {total_global}.",
        "resumen": registro_auditoria
    }


async def obtener_resumen_empresas_casilla(db) -> Dict[str, Any]:
    """
    Retorna el estado actual de todas las empresas y las estadísticas guardadas en la base de datos.
    Garantiza que la información persiste y está disponible de inmediato.
    """
    if db is None:
        return {"error": "Sin conexión a base de datos"}

    empresas_col = db["empresas"]
    historial_col = db["casilla_verificaciones"]

    # Conteo dinámico y consistente en MongoDB
    total_empresas = await empresas_col.count_documents({"estaActivo": True})
    con_casilla = await empresas_col.count_documents({
        "estaActivo": True,
        "$or": [
            {"casillaElectronica.habilitada": True},
            {"tieneCasillaElectronica": True}
        ]
    })
    sin_casilla = max(0, total_empresas - con_casilla)
    porcentaje = round((con_casilla / max(total_empresas, 1)) * 100, 1)

    # Última verificación registrada en el historial
    ultimo_registro = await historial_col.find_one(
        {},
        sort=[("fecha", -1)]
    )

    ultima_verificacion = None
    if ultimo_registro and ultimo_registro.get("fecha"):
        f_dt = ultimo_registro["fecha"]
        ultima_verificacion = f_dt.isoformat() if isinstance(f_dt, datetime) else str(f_dt)

    # Lista completa de empresas con su estado actual de casilla
    cursor = empresas_col.find(
        {"estaActivo": True},
        {
            "_id": 1,
            "ruc": 1,
            "razonSocial": 1,
            "tieneCasillaElectronica": 1,
            "casillaElectronica": 1,
            "ultimaValidacionCasilla": 1,
            "emailContacto": 1,
            "telefonoContacto": 1,
            "estado": 1
        }
    ).sort("ruc", 1)

    empresas_lista = []
    async for emp in cursor:
        rs_str = _extraer_nombre_empresa(emp.get("razonSocial"))
        ce = emp.get("casillaElectronica")
        if isinstance(ce, dict):
            hab = bool(ce.get("habilitada") is True)
            f_val = ce.get("fechaValidacion")
        else:
            hab = bool(emp.get("tieneCasillaElectronica") is True or ce == "HABILITADA")
            f_val = emp.get("ultimaValidacionCasilla")

        f_val_str = f_val.isoformat() if isinstance(f_val, datetime) else (str(f_val) if f_val else None)
        
        empresas_lista.append({
            "id": str(emp.get("_id")),
            "ruc": emp.get("ruc"),
            "razonSocial": rs_str,
            "tieneCasillaElectronica": hab,
            "casillaElectronica": {
                "habilitada": hab,
                "fechaValidacion": f_val_str
            },
            "ultimaValidacionCasilla": f_val_str,
            "emailContacto": emp.get("emailContacto"),
            "telefonoContacto": emp.get("telefonoContacto"),
            "estado": emp.get("estado", "ACTIVO")
        })

    # Ordenar alfabéticamente por razón social
    empresas_lista.sort(key=lambda x: x["razonSocial"].upper())

    return {
        "totalEmpresas": total_empresas,
        "conCasilla": con_casilla,
        "sinCasilla": sin_casilla,
        "porcentajeConCasilla": porcentaje,
        "ultimaVerificacion": ultima_verificacion,
        "estadoProceso": casilla_sync_state,
        "empresas": empresas_lista
    }


async def verificar_empresa_individual_y_guardar(db, ruc: str) -> Dict[str, Any]:
    """
    Verifica individualmente una empresa por su RUC y actualiza de inmediato MongoDB.
    """
    if db is None:
        return {"error": "Sin conexión a base de datos"}

    ruc_limpio = str(ruc).strip()
    empresa = await db["empresas"].find_one({"ruc": ruc_limpio})
    if not empresa:
        return {"error": f"No se encontró ninguna empresa con RUC {ruc_limpio}"}

    res = await consultar_casilla_api(nro_documento=ruc_limpio, tipo_documento="00001")
    ahora_utc = datetime.utcnow()
    tiene_casilla = res.get("tiene_casilla", False)

    compact_casilla = {
        "habilitada": tiene_casilla,
        "fechaValidacion": ahora_utc
    }

    await db["empresas"].update_one(
        {"_id": empresa["_id"]},
        {
            "$set": {"casillaElectronica": compact_casilla},
            "$unset": {
                "tieneCasillaElectronica": "",
                "datosCasilla": "",
                "ultimaValidacionCasilla": ""
            }
        }
    )

    return {
        "ruc": ruc_limpio,
        "razonSocial": _extraer_nombre_empresa(empresa.get("razonSocial")),
        "tieneCasillaElectronica": tiene_casilla,
        "casillaElectronica": compact_casilla,
        "ultimaValidacionCasilla": ahora_utc.isoformat(),
        "mensaje": res.get("mensaje", "Verificación individual procesada")
    }
