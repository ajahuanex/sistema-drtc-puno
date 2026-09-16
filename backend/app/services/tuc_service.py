import re
import hashlib
import logging
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from io import BytesIO
import pandas as pd
from bson import ObjectId

from app.dependencies.db import get_database
from app.models.tuc import (
    Tuc,
    TucCreateRequest,
    TucDuplicadoRequest,
    TucKardexStock,
    TipoEmisionTuc,
    EstadoTuc,
    MotivoEmision,
    TucFiltros,
    TucVerificacionPublica
)

logger = logging.getLogger(__name__)
SECRET_SALT = "DRTC_PUNO_TUC_HASH_KEY_2025"

async def _get_db():
    database = await get_database()
    if database is None:
        raise RuntimeError("No se pudo conectar a la base de datos MongoDB")
    return database

def _to_str_id(doc: dict) -> dict:
    if not doc:
        return doc
    if "_id" in doc and isinstance(doc["_id"], ObjectId):
        doc["_id"] = str(doc["_id"])
        doc["id"] = doc["_id"]
    elif "_id" in doc:
        doc["id"] = str(doc["_id"])
    return doc

def generar_hash_tuc(nro_tuc: str, placa: str, ruc: str, fecha_emision: str) -> str:
    raw = f"{nro_tuc.upper().strip()}|{placa.upper().strip()}|{ruc.strip()}|{fecha_emision}|{SECRET_SALT}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

class TucService:
    @staticmethod
    async def generar_siguiente_nro_tuc(tipo_emision: TipoEmisionTuc) -> str:
        db = await _get_db()
        prefijo = "TE-" if tipo_emision == TipoEmisionTuc.ELECTRONICA else "TF-"
        regex_pattern = f"^{prefijo}\\d{{6}}$"
        
        cursor = db.tucs.find({"nroTuc": {"$regex": regex_pattern}}).sort("nroTuc", -1).limit(1)
        docs = await cursor.to_list(length=1)
        
        if docs and "nroTuc" in docs[0]:
            ultimo_nro = docs[0]["nroTuc"]
            match = re.search(r"\d{6}", ultimo_nro)
            if match:
                siguiente = int(match.group(0)) + 1
                return f"{prefijo}{siguiente:06d}"
        
        return f"{prefijo}000001"

    @staticmethod
    async def verificar_unicidad_nro_tuc(nro_tuc: str, excluir_id: Optional[str] = None) -> bool:
        db = await _get_db()
        nro_limpio = nro_tuc.strip().upper()
        query: Dict[str, Any] = {"nroTuc": {"$regex": f"^{re.escape(nro_limpio)}$", "$options": "i"}}
        if excluir_id:
            try:
                query["_id"] = {"$ne": ObjectId(excluir_id)}
            except Exception:
                query["_id"] = {"$ne": excluir_id}
        
        existente = await db.tucs.find_one(query)
        return existente is None

    @staticmethod
    async def listar_tucs(filtros: TucFiltros, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
        db = await _get_db()
        query: Dict[str, Any] = {}
        
        # Búsqueda global 'q'
        if filtros.q and filtros.q.strip():
            raw_q = filtros.q.strip()
            clean_q = re.escape(raw_q)
            clean_placa_q = re.escape(raw_q.replace("-", "").strip())
            
            query["$or"] = [
                {"nroTuc": {"$regex": clean_q, "$options": "i"}},
                {"placa": {"$regex": clean_q, "$options": "i"}},
                {"placa": {"$regex": clean_placa_q, "$options": "i"}},
                {"ruc": {"$regex": clean_q, "$options": "i"}},
                {"razonSocial": {"$regex": clean_q, "$options": "i"}},
                {"datosEmpresa.razonSocial": {"$regex": clean_q, "$options": "i"}},
                {"nroResolucion": {"$regex": clean_q, "$options": "i"}},
                {"datosResolucion.nroResolucion": {"$regex": clean_q, "$options": "i"}},
                {"datosVehiculo.placa": {"$regex": clean_q, "$options": "i"}},
                {"datosVehiculo.marca": {"$regex": clean_q, "$options": "i"}},
                {"datosVehiculo.modelo": {"$regex": clean_q, "$options": "i"}}
            ]
        
        if filtros.nroTuc:
            query["nroTuc"] = {"$regex": re.escape(filtros.nroTuc.strip()), "$options": "i"}
        if filtros.placa:
            raw_p = filtros.placa.strip()
            clean_p = raw_p.replace("-", "").strip()
            query["$or"] = [
                {"placa": {"$regex": re.escape(raw_p), "$options": "i"}},
                {"placa": {"$regex": re.escape(clean_p), "$options": "i"}},
                {"datosVehiculo.placa": {"$regex": re.escape(raw_p), "$options": "i"}}
            ]
        if filtros.ruc:
            query["ruc"] = {"$regex": re.escape(filtros.ruc.strip()), "$options": "i"}
        if filtros.razonSocial:
            query["$or"] = [
                {"razonSocial": {"$regex": re.escape(filtros.razonSocial.strip()), "$options": "i"}},
                {"datosEmpresa.razonSocial": {"$regex": re.escape(filtros.razonSocial.strip()), "$options": "i"}}
            ]
        if filtros.nroResolucion:
            query["$or"] = [
                {"nroResolucion": {"$regex": re.escape(filtros.nroResolucion.strip()), "$options": "i"}},
                {"datosResolucion.nroResolucion": {"$regex": re.escape(filtros.nroResolucion.strip()), "$options": "i"}}
            ]
        if filtros.tipoEmision:
            t_val = filtros.tipoEmision.value if hasattr(filtros.tipoEmision, "value") else str(filtros.tipoEmision)
            query["tipoEmision"] = {"$regex": f"^{re.escape(t_val)}$", "$options": "i"}
        if filtros.estado:
            e_val = filtros.estado.value if hasattr(filtros.estado, "value") else str(filtros.estado)
            query["estado"] = {"$regex": f"^{re.escape(e_val)}$", "$options": "i"}
        if filtros.fechaEmisionDesde:
            query["fechaEmision"] = {"$gte": filtros.fechaEmisionDesde}
        if filtros.fechaEmisionHasta:
            query.setdefault("fechaEmision", {})["$lte"] = filtros.fechaEmisionHasta

        total = await db.tucs.count_documents(query)
        cursor = db.tucs.find(query).sort("fechaRegistro", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        
        items = [_to_str_id(doc) for doc in docs]
        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "items": items
        }

    @staticmethod
    async def emitir_tuc(data: TucCreateRequest, registrado_por: str = "ADMIN") -> Dict[str, Any]:
        db = await _get_db()
        nro_tuc = data.nroTuc.strip().upper() if data.nroTuc and data.nroTuc.strip() else None
        if not nro_tuc:
            nro_tuc = await TucService.generar_siguiente_nro_tuc(data.tipoEmision)
        
        unicidad_ok = await TucService.verificar_unicidad_nro_tuc(nro_tuc)
        if not unicidad_ok:
            raise ValueError(f"El N° de TUC '{nro_tuc}' ya se encuentra registrado en el sistema.")
        
        placa = data.placa.strip().upper()
        ruc = data.ruc.strip()
        nro_resolucion = data.nroResolucion.strip().upper()
        
        # Buscar Ficha congelada de Vehículo
        vehiculo_doc = await db.vehiculos.find_one({"placa": {"$regex": f"^{re.escape(placa)}$", "$options": "i"}})
        datos_vehiculo = {}
        vehiculo_id = None
        if vehiculo_doc:
            vehiculo_id = str(vehiculo_doc["_id"])
            datos_vehiculo = {
                "placa": vehiculo_doc.get("placa"),
                "categoria": vehiculo_doc.get("categoria"),
                "marca": vehiculo_doc.get("marca"),
                "modelo": vehiculo_doc.get("modelo"),
                "anioFabricacion": vehiculo_doc.get("anioFabricacion"),
                "numeroMotor": vehiculo_doc.get("numeroMotor"),
                "numeroSerie": vehiculo_doc.get("numeroSerie"),
                "chasis": vehiculo_doc.get("chasis"),
                "carroceria": vehiculo_doc.get("carroceria"),
                "color": vehiculo_doc.get("color")
            }
        else:
            datos_vehiculo = {"placa": placa}
        
        # Buscar Empresa
        empresa_doc = await db.empresas.find_one({"ruc": ruc})
        datos_empresa = {}
        empresa_id = None
        razon_social = ruc
        if empresa_doc:
            empresa_id = str(empresa_doc["_id"])
            razon_social = empresa_doc.get("razonSocial", ruc)
            datos_empresa = {
                "ruc": empresa_doc.get("ruc"),
                "razonSocial": empresa_doc.get("razonSocial"),
                "direccion": empresa_doc.get("direccion"),
                "departamento": empresa_doc.get("departamento", "PUNO"),
                "provincia": empresa_doc.get("provincia"),
                "distrito": empresa_doc.get("distrito")
            }
        else:
            datos_empresa = {"ruc": ruc, "razonSocial": ruc}
        
        # Buscar Resolución y Rutas
        res_prim = await db.resoluciones_primigenias.find_one({"nroResolucion": {"$regex": f"^{re.escape(nro_resolucion)}$", "$options": "i"}})
        datos_resolucion = {}
        resolucion_id = None
        rutas_habilitadas = []
        
        if res_prim:
            resolucion_id = str(res_prim["_id"])
            datos_resolucion = {
                "nroResolucion": res_prim.get("nroResolucion"),
                "fechaEmision": res_prim.get("fechaEmision"),
                "fechaInicioVigencia": res_prim.get("fechaInicioVigencia"),
                "fechaFinVigencia": res_prim.get("fechaFinVigencia"),
                "tipoServicio": res_prim.get("tipoServicio")
            }
            rutas_ids = res_prim.get("rutasIds", [])
            if rutas_ids:
                from bson import ObjectId
                obj_ids = [ObjectId(r) for r in rutas_ids if ObjectId.is_valid(r)]
                rutas_cursor = db.rutas.find({"_id": {"$in": obj_ids}})
                rutas_docs = await rutas_cursor.to_list(length=100)
                rutas_habilitadas = [
                    {
                        "codigo": r.get("codigo"),
                        "origen": r.get("origen"),
                        "destino": r.get("destino"),
                        "itinerario": r.get("itinerario"),
                        "frecuencia": r.get("frecuencia")
                    } for r in rutas_docs
                ]
        else:
            datos_resolucion = {"nroResolucion": nro_resolucion}
        
        hash_seg = generar_hash_tuc(nro_tuc, placa, ruc, data.fechaEmision)
        qr_url = f"/verificar-tuc/{hash_seg}"
        
        if data.tucAnteriorId:
            await TucService.anular_tuc(data.tucAnteriorId, motivo="REEMPLAZADA POR NUEVA EMISION", nuevo_estado=EstadoTuc.REEMPLAZADA)

        nuevo_tuc = {
            "nroTuc": nro_tuc,
            "tipoEmision": data.tipoEmision.value,
            "estado": EstadoTuc.VIGENTE.value,
            "motivoEmision": data.motivoEmision.value,
            "placa": placa,
            "vehiculoId": vehiculo_id,
            "ruc": ruc,
            "razonSocial": razon_social,
            "empresaId": empresa_id,
            "nroResolucion": nro_resolucion,
            "resolucionId": resolucion_id,
            "fechaEmision": data.fechaEmision,
            "fechaVencimiento": data.fechaVencimiento,
            "hashSeguridad": hash_seg,
            "qrVerificationUrl": qr_url,
            "loteKardexId": data.loteKardexId,
            "serieFisica": data.serieFisica,
            "datosVehiculo": datos_vehiculo,
            "datosEmpresa": datos_empresa,
            "datosResolucion": datos_resolucion,
            "rutasHabilitadas": rutas_habilitadas,
            "observaciones": data.observaciones,
            "tucAnteriorId": data.tucAnteriorId,
            "historialCambios": [
                {
                    "fecha": datetime.now().isoformat(),
                    "accion": "EMISION_TUC",
                    "usuario": registrado_por,
                    "detalle": f"Emisión de TUC {nro_tuc} ({data.tipoEmision.value})"
                }
            ],
            "fechaRegistro": datetime.now().isoformat(),
            "fechaActualizacion": datetime.now().isoformat()
        }

        res = await db.tucs.insert_one(nuevo_tuc)
        nuevo_tuc["_id"] = str(res.inserted_id)
        nuevo_tuc["id"] = str(res.inserted_id)
        
        if data.tipoEmision == TipoEmisionTuc.FISICA and data.loteKardexId:
            try:
                from bson import ObjectId
                lote_obj_id = ObjectId(data.loteKardexId) if ObjectId.is_valid(data.loteKardexId) else data.loteKardexId
                await db.tuc_kardex.update_one(
                    {"_id": lote_obj_id},
                    {"$inc": {"asignados": 1, "disponibles": -1}}
                )
            except Exception as e:
                logger.warning(f"No se pudo actualizar stock en Kárdex: {e}")
                
        return _to_str_id(nuevo_tuc)

    @staticmethod
    async def sincronizar_desde_flota_empresa(usuario: str = "ADMIN") -> Dict[str, Any]:
        """
        Sincroniza e importa masivamente todas las TUCs registradas en la colección 'flota_empresa'
        asociando vehículo, empresa, resolución y rutas de forma ultrarrápida (Batch Processing).
        """
        db = await _get_db()
        cursor = db.flota_empresa.find({
            "$or": [
                {"numero_tuc": {"$exists": True, "$ne": None, "$ne": ""}},
                {"tuc": {"$exists": True, "$ne": None, "$ne": ""}}
            ],
            "placa": {"$ne": "-"}
        })
        
        registros_flota = await cursor.to_list(length=50000)
        total_flota = len(registros_flota)
        if not total_flota:
            return {
                "totalFlota": 0,
                "importados": 0,
                "actualizados": 0,
                "omitidos": 0,
                "errores": []
            }

        # Precargar mapa de empresas para resolver razón social y datos rápidamente
        rucs_list = list({str(r.get("ruc") or "").strip() for r in registros_flota if r.get("ruc")})
        emp_map = {}
        if rucs_list:
            emp_cursor = db.empresas.find({"ruc": {"$in": rucs_list}})
            async for emp in emp_cursor:
                r_key = emp.get("ruc")
                if r_key:
                    rs = emp.get("razonSocial")
                    if isinstance(rs, dict):
                        rs = rs.get("principal") or rs.get("sunat") or rs.get("minimo")
                    emp_map[r_key] = {
                        "razonSocial": rs or emp.get("razon_social") or r_key,
                        "direccion": emp.get("direccion") or ""
                    }

        # Precargar mapa de resoluciones hijas para validar tipo exacto de trámite
        hijas_map = {}
        async for h_doc in db.resoluciones_hijas.find({}, {"nro_resolucion": 1, "tipo_acto": 1, "tipo_tramite_origen": 1}):
            nro_h = str(h_doc.get("nro_resolucion") or "").strip().upper()
            if nro_h:
                hijas_map[nro_h] = h_doc
                clean_h = re.sub(r"[^A-Z0-9]", "", nro_h)
                if clean_h:
                    hijas_map[clean_h] = h_doc

        from pymongo import UpdateOne
        operaciones = []
        importados = 0
        actualizados = 0
        omitidos = 0
        errores = []
        now_iso = datetime.now().isoformat()

        # Obtener TUCs ya existentes en lote
        tucs_existentes_cursor = db.tucs.find({}, {"nroTuc": 1, "placa": 1})
        tucs_set = set()
        async for doc_t in tucs_existentes_cursor:
            if doc_t.get("nroTuc"):
                tucs_set.add(str(doc_t["nroTuc"]).strip().upper())

        for reg in registros_flota:
            try:
                placa = str(reg.get("placa") or "").strip().upper()
                ruc = str(reg.get("ruc") or "").strip()
                
                raw_tuc = str(reg.get("numero_tuc") or reg.get("tuc") or "").strip().upper()
                if not raw_tuc or raw_tuc in ("NAN", "NONE", "-", "", "S/N", "SIN TUC"):
                    omitidos += 1
                    continue
                
                nro_hija_raw = str(reg.get("nro_resolucion_hija") or "").strip().upper()
                nro_prim_raw = str(reg.get("nro_resolucion_primigenia") or "").strip().upper()
                nro_resolucion = nro_hija_raw or nro_prim_raw or "RDR-FLOTA-EMPRESA"
                
                tipo_emision = TipoEmisionTuc.ELECTRONICA.value if raw_tuc.startswith("TE-") or "E-" in raw_tuc else TipoEmisionTuc.FISICA.value
                estado_tuc = EstadoTuc.VIGENTE.value if reg.get("estado") == "HABILITADO" else EstadoTuc.ANULADA.value
                
                f_emision_raw = reg.get("fecha_emision_resolucion") or reg.get("fecha_cronologica") or reg.get("fecha_expediente")
                f_emision = str(f_emision_raw)[:10] if f_emision_raw and str(f_emision_raw) != "NaT" else date.today().isoformat()
                f_venc = str(reg.get("fecha_vigencia_hasta"))[:10] if reg.get("fecha_vigencia_hasta") else None

                # Validar tipo de resolución hija contra el módulo 'resoluciones_hijas'
                tipo_hija_val = reg.get("tipo_resolucion_hija")
                hija_info = None
                if nro_hija_raw:
                    hija_info = hijas_map.get(nro_hija_raw) or hijas_map.get(re.sub(r"[^A-Z0-9]", "", nro_hija_raw))
                if not hija_info and nro_prim_raw:
                    hija_info = hijas_map.get(nro_prim_raw) or hijas_map.get(re.sub(r"[^A-Z0-9]", "", nro_prim_raw))

                if hija_info:
                    t_acto = str(hija_info.get("tipo_acto") or hija_info.get("tipo_tramite_origen") or "").upper()
                    if "SUSTITUCION" in t_acto:
                        tipo_hija_val = "S"
                    elif "INCREMENTO" in t_acto:
                        tipo_hija_val = "I"
                    elif "ERRATA" in t_acto or "FE" in t_acto:
                        tipo_hija_val = "FE"
                    elif "MODIFICACION" in t_acto:
                        tipo_hija_val = "M"
                    elif "RENOVACION" in t_acto:
                        tipo_hija_val = "R"
                    elif "DUPLICADO" in t_acto:
                        tipo_hija_val = "D"
                    elif "CANJE" in t_acto or "CANCELACION" in t_acto:
                        tipo_hija_val = "C"

                if not tipo_hija_val and nro_hija_raw:
                    s_match = re.search(r"[-_ ]\s*(FE|[ISRMDCO])$", nro_hija_raw)
                    if s_match:
                        tipo_hija_val = s_match.group(1).upper()

                map_motivo = {
                    "S": MotivoEmision.SUSTITUCION_VEHICULO.value,
                    "I": MotivoEmision.INCREMENTO_FLOTA.value,
                    "FE": "FE_DE_ERRATAS",
                    "M": "MODIFICACION",
                    "R": MotivoEmision.RENOVACION_AUTORIZACION.value,
                    "D": MotivoEmision.DUPLICADO_TUC.value,
                    "C": MotivoEmision.CANJE_TUC.value,
                    "O": "OTROS"
                }
                motivo_val = map_motivo.get(tipo_hija_val, MotivoEmision.INCREMENTO_FLOTA.value)

                datos_vehiculo = {
                    "placa": placa,
                    "categoria": reg.get("categoria", "M2"),
                    "marca": reg.get("marca", ""),
                    "modelo": reg.get("modelo", ""),
                    "anioFabricacion": reg.get("anio_fabricacion"),
                    "color": reg.get("color", ""),
                    "carroceria": reg.get("carroceria", ""),
                    "clase": reg.get("clase", ""),
                    "combustible": reg.get("combustible", "DIESEL"),
                    "numeroMotor": reg.get("numero_motor", ""),
                    "numeroSerie": reg.get("numero_serie", ""),
                    "chasis": reg.get("vin", "")
                }

                emp_info = emp_map.get(ruc, {})
                razon_social = reg.get("razon_social") or emp_info.get("razonSocial") or ruc
                datos_empresa = {
                    "ruc": ruc,
                    "razonSocial": razon_social,
                    "direccion": emp_info.get("direccion", "")
                }

                datos_resolucion = {
                    "nroResolucion": nro_resolucion,
                    "fechaEmision": f_emision
                }

                rutas_codigos = reg.get("rutas", [])
                rutas_habilitadas = [{"codigo": str(rc).strip()} for rc in rutas_codigos if str(rc).strip()]

                hash_seg = generar_hash_tuc(raw_tuc, placa, ruc, f_emision)
                qr_url = f"/verificar-tuc/{hash_seg}"

                tuc_doc = {
                    "nroTuc": raw_tuc,
                    "tipoEmision": tipo_emision,
                    "estado": estado_tuc,
                    "motivoEmision": motivo_val,
                    "tipo_resolucion_hija": tipo_hija_val,
                    "placa": placa,
                    "ruc": ruc,
                    "razonSocial": razon_social,
                    "nroResolucion": nro_resolucion,
                    "fechaEmision": f_emision,
                    "fechaVencimiento": f_venc,
                    "hashSeguridad": hash_seg,
                    "qrVerificationUrl": qr_url,
                    "datosVehiculo": datos_vehiculo,
                    "datosEmpresa": datos_empresa,
                    "datosResolucion": datos_resolucion,
                    "rutasHabilitadas": rutas_habilitadas,
                    "observaciones": reg.get("observaciones") or reg.get("detalles") or "Sincronizado desde Flota por Empresa",
                    "fechaActualizacion": now_iso
                }

                if raw_tuc in tucs_set:
                    actualizados += 1
                else:
                    importados += 1
                    tucs_set.add(raw_tuc)

                operaciones.append(
                    UpdateOne(
                        {"nroTuc": raw_tuc},
                        {
                            "$set": tuc_doc,
                            "$setOnInsert": {
                                "fechaRegistro": now_iso,
                                "historialCambios": [{
                                    "fecha": now_iso,
                                    "accion": "MIGRACION_FLOTA_EMPRESA",
                                    "usuario": usuario,
                                    "detalle": f"TUC importada desde registro histórico de Flota Empresa ({placa})"
                                }]
                            }
                        },
                        upsert=True
                    )
                )

                if len(operaciones) >= 1000:
                    await db.tucs.bulk_write(operaciones, ordered=False)
                    operaciones = []

            except Exception as ex:
                errores.append(f"Error procesando {reg.get('placa')}: {str(ex)}")

        if operaciones:
            await db.tucs.bulk_write(operaciones, ordered=False)

        return {
            "totalFlota": total_flota,
            "importados": importados,
            "actualizados": actualizados,
            "omitidos": omitidos,
            "errores": errores[:20]
        }

    @staticmethod
    async def registrar_duplicado(data: TucDuplicadoRequest, usuario: str = "ADMIN") -> Dict[str, Any]:
        db = await _get_db()
        from bson import ObjectId
        query = {"_id": ObjectId(data.tucAnteriorId)} if ObjectId.is_valid(data.tucAnteriorId) else {"_id": data.tucAnteriorId}
        tuc_anterior = await db.tucs.find_one(query)

        if not tuc_anterior:
            raise ValueError("No se encontró la TUC anterior especificada para el duplicado.")
        
        await db.tucs.update_one(
            query,
            {
                "$set": {
                    "estado": EstadoTuc.ANULADA_POR_DUPLICADO.value,
                    "fechaActualizacion": datetime.now().isoformat()
                },
                "$push": {
                    "historialCambios": {
                        "fecha": datetime.now().isoformat(),
                        "accion": "ANULADA_POR_DUPLICADO",
                        "usuario": usuario,
                        "detalle": f"Anulada por emisión de duplicado motivo {data.motivo.value}"
                    }
                }
            }
        )
        
        create_req = TucCreateRequest(
            tipoEmision=data.tipoEmision,
            motivoEmision=data.motivo,
            placa=tuc_anterior.get("placa"),
            ruc=tuc_anterior.get("ruc"),
            nroResolucion=tuc_anterior.get("nroResolucion"),
            fechaEmision=date.today().isoformat(),
            fechaVencimiento=tuc_anterior.get("fechaVencimiento"),
            loteKardexId=data.loteKardexId,
            serieFisica=data.serieFisica,
            observaciones=data.observaciones or f"Duplicado emitido de la TUC previa N° {tuc_anterior.get('nroTuc')}",
            tucAnteriorId=str(tuc_anterior.get("_id"))
        )
        
        return await TucService.emitir_tuc(create_req, registrado_por=usuario)

    @staticmethod
    async def anular_tuc(tuc_id: str, motivo: str, nuevo_estado: EstadoTuc = EstadoTuc.ANULADA, usuario: str = "ADMIN") -> bool:
        db = await _get_db()
        from bson import ObjectId
        query = {"_id": ObjectId(tuc_id)} if ObjectId.is_valid(tuc_id) else {"_id": tuc_id}
        res = await db.tucs.update_one(
            query,
            {
                "$set": {
                    "estado": nuevo_estado.value,
                    "fechaActualizacion": datetime.now().isoformat()
                },
                "$push": {
                    "historialCambios": {
                        "fecha": datetime.now().isoformat(),
                        "accion": f"CAMBIO_ESTADO_{nuevo_estado.value}",
                        "usuario": usuario,
                        "detalle": motivo
                    }
                }
            }
        )
        return res.modified_count > 0

    @staticmethod
    async def cambiar_anular_tuc(data: Dict[str, Any], usuario: str = "ADMIN") -> Dict[str, Any]:
        db = await _get_db()
        from bson import ObjectId
        
        vehiculo_id = data.get("vehiculo_id")
        placa = (data.get("placa") or "").strip().upper()
        tuc_actual = (data.get("tuc_actual") or "").strip().upper()
        nuevo_tuc = (data.get("nuevo_tuc") or "").strip().upper()
        motivo = (data.get("motivo") or "").strip()
        
        if not nuevo_tuc:
            raise ValueError("El nuevo número de TUC es obligatorio.")
        if not motivo:
            raise ValueError("Debe ingresar el motivo de la anulación o cambio de TUC.")
            
        now_dt = datetime.now()
        now_iso = now_dt.isoformat()
        
        # 1. Localizar vehículo en flota_empresa
        query_veh = {}
        if vehiculo_id and ObjectId.is_valid(vehiculo_id):
            query_veh["_id"] = ObjectId(vehiculo_id)
        elif vehiculo_id:
            query_veh["id"] = vehiculo_id
        else:
            query_veh["placa"] = placa
            
        veh = await db.flota_empresa.find_one(query_veh)
        if not veh:
            raise ValueError(f"No se encontró el vehículo con placa {placa}")
            
        ruc = veh.get("ruc")
        razon_social = veh.get("razon_social")
        nro_resolucion = veh.get("nro_resolucion_primigenia")
        tuc_prev = tuc_actual or veh.get("numero_tuc") or ""
        
        # 2. Anular el TUC actual en la colección 'tucs'
        if tuc_prev:
            await db.tucs.update_many(
                {"nroTuc": {"$regex": f"^{re.escape(tuc_prev)}$", "$options": "i"}},
                {
                    "$set": {
                        "estado": EstadoTuc.ANULADA.value,
                        "motivoAnulacion": motivo,
                        "fechaAnulacion": now_iso,
                        "fechaActualizacion": now_iso
                    },
                    "$push": {
                        "historialCambios": {
                            "fecha": now_iso,
                            "accion": "ANULADA_POR_RECTIFICACION",
                            "usuario": usuario,
                            "detalle": f"TUC anulada por corrección/cambio de impresión. Motivo: {motivo}. Reemplazada por N° {nuevo_tuc}"
                        }
                    }
                }
            )
            
        # 3. Registrar / Actualizar el nuevo TUC en la colección 'tucs'
        tipo_emision = TipoEmisionTuc.ELECTRONICA.value if nuevo_tuc.startswith("TE-") or "E-" in nuevo_tuc else TipoEmisionTuc.FISICA.value
        hash_seg = generar_hash_tuc(nuevo_tuc, placa, ruc or "", date.today().isoformat())
        qr_url = f"/verificar-tuc/{hash_seg}"
        
        nuevo_tuc_doc = {
            "nroTuc": nuevo_tuc,
            "tipoEmision": tipo_emision,
            "estado": EstadoTuc.VIGENTE.value,
            "motivoEmision": "CORRECCION_ERROR_IMPRESION",
            "placa": placa,
            "vehiculoId": str(veh["_id"]),
            "ruc": ruc,
            "razonSocial": razon_social,
            "nroResolucion": nro_resolucion,
            "fechaEmision": date.today().isoformat(),
            "fechaVencimiento": veh.get("fecha_vigencia_hasta"),
            "hashSeguridad": hash_seg,
            "qrVerificationUrl": qr_url,
            "observaciones": f"Emitido por corrección de TUC previo {tuc_prev}. Motivo: {motivo}",
            "historialCambios": [
                {
                    "fecha": now_iso,
                    "accion": "EMISION_POR_CORRECCION",
                    "usuario": usuario,
                    "detalle": f"Nuevo TUC emitido tras anular {tuc_prev}. Motivo: {motivo}"
                }
            ],
            "fechaRegistro": now_iso,
            "fechaActualizacion": now_iso
        }
        
        await db.tucs.update_one(
            {"nroTuc": nuevo_tuc},
            {"$set": nuevo_tuc_doc},
            upsert=True
        )
        
        # 4. Actualizar flota_empresa con el nuevo TUC y registrar observación
        nueva_obs = {
            "fecha": now_dt,
            "texto": f"Cambio de TUC: Anulado TUC previo '{tuc_prev}' por motivo '{motivo}'. Nuevo TUC asignado: '{nuevo_tuc}'.",
            "fuente": "correccion_tuc"
        }
        
        await db.flota_empresa.update_one(
            {"_id": veh["_id"]},
            {
                "$set": {
                    "numero_tuc": nuevo_tuc,
                    "tuc": nuevo_tuc,
                    "fecha_actualizacion": now_dt
                },
                "$push": {
                    "observaciones_historial": nueva_obs
                }
            }
        )
        
        return {
            "mensaje": f"TUC actualizada exitosamente. TUC previa {tuc_prev} anulada y nuevo TUC {nuevo_tuc} asignado.",
            "nuevo_tuc": nuevo_tuc,
            "tuc_anterior": tuc_prev,
            "placa": placa
        }

    @staticmethod
    async def obtener_verificacion_publica(hash_o_codigo: str) -> TucVerificacionPublica:
        db = await _get_db()
        hash_limpio = hash_o_codigo.strip()
        from bson import ObjectId
        
        query = {
            "$or": [
                {"hashSeguridad": hash_limpio},
                {"nroTuc": {"$regex": f"^{re.escape(hash_limpio)}$", "$options": "i"}},
            ]
        }
        if ObjectId.is_valid(hash_limpio):
            query["$or"].append({"_id": ObjectId(hash_limpio)})
            
        doc = await db.tucs.find_one(query)
        if not doc:
            raise ValueError("No se encontró ningún Título Habilitante (TUC) con el código o hash proporcionado.")
        
        estado_str = doc.get("estado", EstadoTuc.VIGENTE.value)
        fecha_venc = doc.get("fechaVencimiento")
        es_vigente = estado_str == EstadoTuc.VIGENTE.value
        
        if es_vigente and fecha_venc:
            try:
                fv = datetime.strptime(fecha_venc, "%Y-%m-%d").date()
                if fv < date.today():
                    es_vigente = False
                    estado_str = EstadoTuc.VENCIDA.value
            except Exception:
                pass
        
        mensaje = "HABILITADO PARA CIRCULAR - TÍTULO VIGENTE" if es_vigente else f"NO HABILITADO - TUC EN ESTADO {estado_str}"
        
        return TucVerificacionPublica(
            nroTuc=doc.get("nroTuc", "SIN-NUMERO"),
            tipoEmision=doc.get("tipoEmision", "ELECTRONICA"),
            estado=estado_str,
            esVigente=es_vigente,
            mensajeEstado=mensaje,
            fechaEmision=doc.get("fechaEmision", ""),
            fechaVencimiento=doc.get("fechaVencimiento"),
            hashSeguridad=doc.get("hashSeguridad"),
            empresa=doc.get("datosEmpresa") or {"ruc": doc.get("ruc"), "razonSocial": doc.get("razonSocial")},
            vehiculo=doc.get("datosVehiculo") or {"placa": doc.get("placa")},
            resolucion=doc.get("datosResolucion") or {"nroResolucion": doc.get("nroResolucion")},
            rutas=doc.get("rutasHabilitadas", []),
            observaciones=doc.get("observaciones")
        )

    @staticmethod
    async def procesar_excel_carga_masiva(file_bytes: bytes, usuario: str = "ADMIN") -> Dict[str, Any]:
        try:
            df = pd.read_excel(BytesIO(file_bytes))
        except Exception as e:
            raise ValueError(f"Error al leer el archivo Excel: {str(e)}")

        df.columns = [str(c).strip().upper().replace(" ", "_") for c in df.columns]
        
        total_filas = len(df)
        exitosos = 0
        fallidos = 0
        errores = []

        for idx, row in df.iterrows():
            fila_num = idx + 2
            try:
                nro_tuc = str(row.get("NRO_TUC") or "").strip().upper()
                placa = str(row.get("PLACA") or "").strip().upper()
                ruc = str(row.get("RUC") or "").strip()
                nro_res = str(row.get("NRO_RESOLUCION") or "").strip().upper()
                
                if not placa or placa in ("NAN", "NONE", ""):
                    fallidos += 1
                    errores.append(f"Fila {fila_num}: Falta la Placa del vehículo.")
                    continue
                
                if not ruc or ruc in ("NAN", "NONE", ""):
                    fallidos += 1
                    errores.append(f"Fila {fila_num}: Falta el RUC de la empresa.")
                    continue
                
                tipo_raw = str(row.get("TIPO_EMISION") or "ELECTRONICA").strip().upper()
                tipo_emision = TipoEmisionTuc.FISICA if "FIS" in tipo_raw else TipoEmisionTuc.ELECTRONICA
                
                f_emision_raw = row.get("FECHA_EMISION")
                f_venc_raw = row.get("FECHA_VENCIMIENTO")
                
                f_emision = str(f_emision_raw)[:10] if pd.notna(f_emision_raw) else date.today().isoformat()
                f_venc = str(f_venc_raw)[:10] if pd.notna(f_venc_raw) else None

                create_req = TucCreateRequest(
                    nroTuc=nro_tuc if nro_tuc and nro_tuc not in ("NAN", "NONE", "") else None,
                    tipoEmision=tipo_emision,
                    motivoEmision=MotivoEmision.HISTORICO_MIGRADO,
                    placa=placa,
                    ruc=ruc,
                    nroResolucion=nro_res if nro_res not in ("NAN", "NONE", "") else "RDR-HISTORICA",
                    fechaEmision=f_emision,
                    fechaVencimiento=f_venc,
                    observaciones=str(row.get("OBSERVACIONES") or "Importado masivamente desde Excel histórico.")
                )

                await TucService.emitir_tuc(create_req, registrado_por=usuario)
                exitosos += 1

            except Exception as ex:
                fallidos += 1
                errores.append(f"Fila {fila_num}: {str(ex)}")

        return {
            "totalFilas": total_filas,
            "exitosos": exitosos,
            "fallidos": fallidos,
            "errores": errores[:50]
        }

    @staticmethod
    async def obtener_estadisticas() -> Dict[str, Any]:
        db = await _get_db()
        total = await db.tucs.count_documents({})
        vigentes = await db.tucs.count_documents({"estado": EstadoTuc.VIGENTE.value})
        electronicas = await db.tucs.count_documents({"tipoEmision": TipoEmisionTuc.ELECTRONICA.value})
        fisicas = await db.tucs.count_documents({"tipoEmision": TipoEmisionTuc.FISICA.value})
        anuladas = await db.tucs.count_documents({"estado": {"$in": [EstadoTuc.ANULADA.value, EstadoTuc.ANULADA_POR_DUPLICADO.value]}})
        reemplazadas = await db.tucs.count_documents({"estado": EstadoTuc.REEMPLAZADA.value})

        kardex_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "totalDisponibles": {"$sum": "$disponibles"},
                    "totalAsignados": {"$sum": "$asignados"}
                }
            }
        ]
        kardex_res = await db.tuc_kardex.aggregate(kardex_pipeline).to_list(1)
        stock_fisico_disponible = kardex_res[0]["totalDisponibles"] if kardex_res else 0

        return {
            "totalTucs": total,
            "vigentes": vigentes,
            "electronicas": electronicas,
            "fisicas": fisicas,
            "anuladas": anuladas,
            "reemplazadas": reemplazadas,
            "stockFisicoDisponible": stock_fisico_disponible
        }
