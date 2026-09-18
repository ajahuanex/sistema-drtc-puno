from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from datetime import datetime
from app.dependencies.db import get_database
from app.services.reporte_google_docs import GoogleDocsReportService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/estadisticas")
async def get_dashboard_estadisticas(db = Depends(get_database)):
    """
    Obtener reporte estadístico para el dashboard
    """
    try:
        now = datetime.utcnow()

        # 1. Empresas habilitadas/activas
        empresas_cursor = db["empresas"].find({
            "estaActivo": True,
            "estado": {"$in": ["AUTORIZADA", "ACTIVO", "HABILITADO"]}
        }, {"ruc": 1, "razonSocial": 1})
        empresas_activas = {}
        async for emp in empresas_cursor:
            ruc = emp.get("ruc")
            if ruc:
                rs = emp.get("razonSocial")
                if isinstance(rs, dict):
                    rs_val = rs.get("principal") or rs.get("sunat") or str(rs)
                else:
                    rs_val = str(rs or "")
                empresas_activas[ruc] = rs_val

        # 2. Resoluciones primigenias estrictamente VIGENTES y NO VENCIDAS de empresas activas
        rp_cursor = db["resoluciones_primigenias"].find({
            "esta_activo": True,
            "estado": {"$in": ["VIGENTE", "ACTIVO", "ACTIVA"]}
        }, {
            "ruc_empresa": 1,
            "nro_resolucion": 1,
            "fecha_fin_vigencia": 1
        })

        empresas_res_vigentes_map = {}
        total_rp_vigentes_activas = 0
        resoluciones_por_vencer_30 = []
        resoluciones_por_vencer_60 = []

        async for rp in rp_cursor:
            ruc = rp.get("ruc_empresa")
            if not ruc or ruc not in empresas_activas:
                continue

            # Descartar si está vencida por fecha
            f_fin = rp.get("fecha_fin_vigencia")
            dias_restantes = None
            f_fin_naive = None
            if f_fin:
                if isinstance(f_fin, str):
                    try:
                        f_fin = datetime.fromisoformat(f_fin.replace("Z", "+00:00"))
                    except Exception:
                        pass
                if isinstance(f_fin, datetime):
                    f_fin_naive = f_fin.replace(tzinfo=None) if f_fin.tzinfo else f_fin
                    if f_fin_naive < now:
                        continue
                    dias_restantes = (f_fin_naive - now).days

            nro = rp.get("nro_resolucion")
            if nro:
                empresas_res_vigentes_map.setdefault(ruc, set()).add(nro)
                total_rp_vigentes_activas += 1

                if dias_restantes is not None and f_fin_naive:
                    item_v = {
                        "nroResolucion": nro,
                        "ruc": ruc,
                        "razonSocial": empresas_activas.get(ruc, f"Empresa RUC {ruc}"),
                        "fechaFinVigencia": f_fin_naive.strftime("%d/%m/%Y"),
                        "diasRestantes": dias_restantes
                    }
                    if 0 <= dias_restantes <= 30:
                        resoluciones_por_vencer_30.append(item_v)
                    if 0 <= dias_restantes <= 60:
                        resoluciones_por_vencer_60.append(item_v)

        empresas_por_resoluciones = {
            "con1": 0,
            "con2": 0,
            "con3": 0,
            "con4": 0,
            "con5Mas": 0,
            "totalEmpresas": len(empresas_res_vigentes_map)
        }
        detalle_empresas_multi_resolucion = []

        for ruc, res_set in empresas_res_vigentes_map.items():
            cant = len(res_set)
            if cant == 1:
                empresas_por_resoluciones["con1"] += 1
            elif cant == 2:
                empresas_por_resoluciones["con2"] += 1
            elif cant == 3:
                empresas_por_resoluciones["con3"] += 1
            elif cant == 4:
                empresas_por_resoluciones["con4"] += 1
            elif cant >= 5:
                empresas_por_resoluciones["con5Mas"] += 1

            if cant >= 2:
                razon = empresas_activas.get(ruc, f"Empresa RUC {ruc}")
                detalle_empresas_multi_resolucion.append({
                    "ruc": ruc,
                    "razonSocial": razon,
                    "totalResoluciones": cant,
                    "resoluciones": sorted(list(res_set))
                })

        detalle_empresas_multi_resolucion.sort(key=lambda x: (-x["totalResoluciones"], x["razonSocial"]))

        # 2. Flotas vehiculares por rutas (ORIGEN - DESTINO y viceversa)
        rutas_cursor = db["rutas"].find(
            {"estaActivo": True},
            {"codigoRuta": 1, "codigo_ruta": 1, "nombre": 1, "origen": 1, "destino": 1, "resolucion": 1}
        )
        mapa_rutas = {}
        async for r in rutas_cursor:
            res_obj = r.get("resolucion") or {}
            nro_res = res_obj.get("nroResolucion") if isinstance(res_obj, dict) else r.get("resolucion")
            cod_ruta = r.get("codigoRuta") or r.get("codigo_ruta")

            orig_obj = r.get("origen") or {}
            dest_obj = r.get("destino") or {}
            orig = orig_obj.get("nombre") if isinstance(orig_obj, dict) else str(orig_obj)
            dest = dest_obj.get("nombre") if isinstance(dest_obj, dict) else str(dest_obj)

            if not orig or not dest:
                partes = (r.get("nombre") or "").split(" - ")
                if len(partes) >= 2:
                    orig = orig or partes[0].strip()
                    dest = dest or partes[-1].strip()
            orig = (orig or "DESCONOCIDO").strip().upper()
            dest = (dest or "DESCONOCIDO").strip().upper()

            par = sorted([orig, dest])
            corredor = f"{par[0]} - {par[1]}"

            if nro_res and cod_ruta:
                res_key = nro_res.strip().upper()
                cod_str = str(cod_ruta).strip()
                mapa_rutas[(res_key, cod_str.zfill(2))] = (corredor, orig, dest)
                mapa_rutas[(res_key, cod_str)] = (corredor, orig, dest)
                if cod_str.isdigit():
                    mapa_rutas[(res_key, str(int(cod_str)))] = (corredor, orig, dest)

        flota_cursor = db["flota_empresa"].find(
            {"estado": "HABILITADO", "esta_activo": True},
            {"nro_resolucion_primigenia": 1, "rutas": 1, "razon_social": 1, "ruc": 1, "placa": 1}
        )
        corredores_dict = {}
        async for f in flota_cursor:
            nro_res = (f.get("nro_resolucion_primigenia") or "").strip().upper()
            rutas_asig = f.get("rutas") or []
            rs_emp = f.get("razon_social") or f.get("ruc") or "Desconocida"

            corredores_vehiculo = set()
            for r_item in rutas_asig:
                r_str = str(r_item).strip()
                m = mapa_rutas.get((nro_res, r_str)) or mapa_rutas.get((nro_res, r_str.zfill(2)))
                if not m and r_str.isdigit():
                    m = mapa_rutas.get((nro_res, str(int(r_str))))
                if m:
                    corredores_vehiculo.add(m)

            for c_info in corredores_vehiculo:
                corr_nombre = c_info[0]
                if corr_nombre not in corredores_dict:
                    corredores_dict[corr_nombre] = {
                        "corredor": corr_nombre,
                        "origen": c_info[1],
                        "destino": c_info[2],
                        "totalVehiculos": 0,
                        "empresas_set": set()
                    }
                corredores_dict[corr_nombre]["totalVehiculos"] += 1
                corredores_dict[corr_nombre]["empresas_set"].add(rs_emp)

        flotas_por_corredor = []
        for corr_data in sorted(corredores_dict.values(), key=lambda x: x["totalVehiculos"], reverse=True):
            flotas_por_corredor.append({
                "corredor": corr_data["corredor"],
                "origen": corr_data["origen"],
                "destino": corr_data["destino"],
                "totalVehiculos": corr_data["totalVehiculos"],
                "totalEmpresas": len(corr_data["empresas_set"]),
                "empresas": sorted(list(corr_data["empresas_set"]))[:10]
            })

        # 3. Rutas habilitadas en total
        rutas_habilitadas = await db["rutas"].count_documents({
            "estado": "ACTIVA", 
            "estaActivo": True
        })

        # 3.1 Rutas con más empresas autorizadas (Top 10)
        rutas_empresas_cursor = db["rutas"].aggregate([
            {"$match": {"estado": "ACTIVA", "estaActivo": True}},
            {"$group": {
                "_id": "$nombre",
                "empresas_unicas": {"$addToSet": "$empresa.ruc"}
            }},
            {"$project": {
                "nombre": "$_id",
                "totalEmpresas": {"$size": "$empresas_unicas"}
            }},
            {"$sort": {"totalEmpresas": -1}},
            {"$limit": 10}
        ])
        rutas_con_mas_empresas = []
        async for doc in rutas_empresas_cursor:
            rutas_con_mas_empresas.append({
                "nombre": doc["nombre"] or "DESCONOCIDO", 
                "totalEmpresas": doc["totalEmpresas"]
            })

        # 4. Resoluciones primigenias autorizadas (vigentes y no vencidas de empresas activas)
        resoluciones_primigenias = total_rp_vigentes_activas

        # 5. Total de sustituciones e incrementos y desglose por empresa
        total_sustituciones = await db["resoluciones_hijas"].count_documents({
            "tipo_acto": "SUSTITUCION_VEHICULAR",
            "esta_activo": True
        })

        total_incrementos = await db["resoluciones_hijas"].count_documents({
            "tipo_acto": "INCREMENTO_FLOTA",
            "esta_activo": True
        })

        tramites_cursor = db["resoluciones_hijas"].aggregate([
            {"$match": {"esta_activo": True, "tipo_acto": {"$in": ["SUSTITUCION_VEHICULAR", "INCREMENTO_FLOTA"]}}},
            {"$group": {
                "_id": "$ruc_empresa",
                "razon_social_doc": {"$first": "$razon_social"},
                "sustituciones": {"$sum": {"$cond": [{"$eq": ["$tipo_acto", "SUSTITUCION_VEHICULAR"]}, 1, 0]}},
                "incrementos": {"$sum": {"$cond": [{"$eq": ["$tipo_acto", "INCREMENTO_FLOTA"]}, 1, 0]}},
                "totalTramites": {"$sum": 1}
            }},
            {"$sort": {"totalTramites": -1}},
            {"$limit": 15}
        ])

        top_empresas_tramites = []
        async for doc in tramites_cursor:
            ruc_t = doc["_id"]
            if not ruc_t:
                continue
            rs_t = empresas_activas.get(ruc_t) or doc.get("razon_social_doc") or f"Empresa RUC {ruc_t}"
            top_empresas_tramites.append({
                "ruc": ruc_t,
                "razonSocial": rs_t,
                "sustituciones": doc["sustituciones"],
                "incrementos": doc["incrementos"],
                "totalTramites": doc["totalTramites"]
            })

        # 6. Cantidad flotas habilitadas por empresas (Top 10)
        flotas_por_empresa_cursor = db["flota_empresa"].aggregate([
            {"$match": {"estado": "HABILITADO", "esta_activo": True}},
            {"$group": {
                "_id": "$ruc", 
                "razonSocial": {"$first": "$razon_social"},
                "total": {"$sum": 1}
            }},
            {"$sort": {"total": -1}},
            {"$limit": 10}
        ])

        flotas_por_empresa = []
        async for doc in flotas_por_empresa_cursor:
            flotas_por_empresa.append({
                "ruc": doc["_id"],
                "razonSocial": doc.get("razonSocial", "Desconocido"),
                "total": doc["total"]
            })

        # Total flota habilitada (general)
        total_flota_habilitada = await db["flota_empresa"].count_documents({
            "estado": "HABILITADO", 
            "esta_activo": True
        })

        return {
            "flotasPorCorredor": flotas_por_corredor,
            "empresasPorResoluciones": empresas_por_resoluciones,
            "detalleEmpresasMultiResolucion": detalle_empresas_multi_resolucion,
            "rutasHabilitadasTotal": rutas_habilitadas,
            "rutasConMasEmpresas": rutas_con_mas_empresas,
            "resolucionesPrimigeniasAutorizadas": resoluciones_primigenias,
            "resolucionesPorVencer30": {
                "total": len(resoluciones_por_vencer_30),
                "items": sorted(resoluciones_por_vencer_30, key=lambda x: x["diasRestantes"])
            },
            "resolucionesPorVencer60": {
                "total": len(resoluciones_por_vencer_60),
                "items": sorted(resoluciones_por_vencer_60, key=lambda x: x["diasRestantes"])
            },
            "totalSustituciones": total_sustituciones,
            "totalIncrementos": total_incrementos,
            "totalTramitesFlota": total_sustituciones + total_incrementos,
            "topEmpresasTramites": top_empresas_tramites,
            "totalFlotaHabilitada": total_flota_habilitada,
            "topFlotasPorEmpresa": flotas_por_empresa
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas del dashboard: {str(e)}")

# =========================================================================
# ENDPOINTS PARA DESCARGA DE REPORTES DETALLADOS EN EXCEL
# =========================================================================

@router.get("/reporte-detalle/rutas")
async def get_reporte_detalle_rutas(db = Depends(get_database)):
    """
    Retorna el detalle completo de las 447 rutas habilitadas con todas sus características
    """
    try:
        empresas_cursor = db["empresas"].find({}, {"ruc": 1, "razonSocial": 1})
        empresas_map = {}
        async for emp in empresas_cursor:
            ruc = emp.get("ruc")
            if ruc:
                rs = emp.get("razonSocial")
                rs_val = rs.get("principal") or rs.get("sunat") or str(rs) if isinstance(rs, dict) else str(rs or "")
                empresas_map[ruc] = rs_val

        rutas_cursor = db["rutas"].find(
            {"estado": "ACTIVA", "estaActivo": True}
        ).sort("nombre", 1)

        lista_rutas = []
        idx = 1
        async for r in rutas_cursor:
            emp_obj = r.get("empresa") or {}
            ruc_emp = emp_obj.get("ruc") if isinstance(emp_obj, dict) else ""
            rs_emp = empresas_map.get(ruc_emp) or (emp_obj.get("razonSocial") if isinstance(emp_obj, dict) else "") or "Desconocida"

            orig_obj = r.get("origen") or {}
            orig_nom = orig_obj.get("nombre") if isinstance(orig_obj, dict) else str(orig_obj or "")

            dest_obj = r.get("destino") or {}
            dest_nom = dest_obj.get("nombre") if isinstance(dest_obj, dict) else str(dest_obj or "")

            res_obj = r.get("resolucion") or {}
            nro_res = res_obj.get("nroResolucion") if isinstance(res_obj, dict) else str(res_obj or "")

            freq_obj = r.get("frecuencia") or {}
            freq_desc = freq_obj.get("descripcion") if isinstance(freq_obj, dict) else str(freq_obj or "")

            itinerario_str = r.get("descripcion") or "Directo / Sin Escalas"

            lista_rutas.append({
                "numero": idx,
                "codigoRuta": r.get("codigoRuta") or r.get("codigo_ruta") or f"{idx:02d}",
                "nombreRuta": r.get("nombre") or f"{orig_nom} - {dest_nom}",
                "origen": orig_nom,
                "destino": dest_nom,
                "itinerario": itinerario_str,
                "frecuencia": freq_desc or "No especificada",
                "nroResolucion": nro_res,
                "ruc": ruc_emp,
                "razonSocial": rs_emp,
                "tipoServicio": r.get("tipoServicio", "PASAJEROS"),
                "tipoRuta": r.get("tipoRuta", "INTERREGIONAL"),
                "cantidadVehiculos": r.get("cantidadVehiculos", 0),
                "estado": r.get("estado", "ACTIVA")
            })
            idx += 1

        return lista_rutas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener detalle de rutas: {str(e)}")

@router.get("/reporte-detalle/resoluciones")
async def get_reporte_detalle_resoluciones(db = Depends(get_database)):
    """
    Retorna el detalle completo de las resoluciones primigenias con vigencia calculada y estado
    """
    try:
        now = datetime.utcnow()
        empresas_cursor = db["empresas"].find({}, {"ruc": 1, "razonSocial": 1})
        empresas_map = {}
        async for emp in empresas_cursor:
            ruc = emp.get("ruc")
            if ruc:
                rs = emp.get("razonSocial")
                rs_val = rs.get("principal") or rs.get("sunat") or str(rs) if isinstance(rs, dict) else str(rs or "")
                empresas_map[ruc] = rs_val

        rp_cursor = db["resoluciones_primigenias"].find({"esta_activo": True}).sort("nro_resolucion", 1)

        lista_rp = []
        idx = 1
        async for rp in rp_cursor:
            ruc = rp.get("ruc_empresa")
            rs_val = empresas_map.get(ruc, "Desconocida")

            f_res = rp.get("fecha_resolucion")
            f_ini = rp.get("fecha_inicio_vigencia")
            f_fin = rp.get("fecha_fin_vigencia")

            f_fin_dt = None
            if f_fin:
                if isinstance(f_fin, str):
                    try:
                        f_fin_dt = datetime.fromisoformat(f_fin.replace("Z", "+00:00"))
                    except Exception:
                        pass
                elif isinstance(f_fin, datetime):
                    f_fin_dt = f_fin

            dias_rest = 0
            es_vencida = False
            if f_fin_dt:
                f_naive = f_fin_dt.replace(tzinfo=None) if f_fin_dt.tzinfo else f_fin_dt
                dias_rest = (f_naive - now).days
                if dias_rest < 0:
                    es_vencida = True

            estado_legal = rp.get("estado", "VIGENTE")
            if es_vencida and estado_legal in ["VIGENTE", "ACTIVO"]:
                estado_legal = "VENCIDA"

            f_res_str = f_res.strftime("%d/%m/%Y") if isinstance(f_res, datetime) else str(f_res or "")
            f_ini_str = f_ini.strftime("%d/%m/%Y") if isinstance(f_ini, datetime) else str(f_ini or "")
            f_fin_str = f_fin_dt.strftime("%d/%m/%Y") if f_fin_dt else str(f_fin or "")

            lista_rp.append({
                "numero": idx,
                "nroResolucion": rp.get("nro_resolucion"),
                "ruc": ruc,
                "razonSocial": rs_val,
                "modalidad": rp.get("tipo_autorizacion", "PASAJEROS"),
                "fechaResolucion": f_res_str,
                "fechaInicioVigencia": f_ini_str,
                "fechaFinVigencia": f_fin_str,
                "aniosVigencia": rp.get("anios_vigencia", 10),
                "diasRestantes": dias_rest if not es_vencida else 0,
                "estado": estado_legal,
                "tieneEficaciaAnticipada": "SÍ" if rp.get("tiene_eficacia_anticipada") else "NO",
                "expedientes": ", ".join(rp.get("expedientes_codigos", [])) if rp.get("expedientes_codigos") else "",
                "linkDocumento": rp.get("link_documento") or ""
            })
            idx += 1

        return lista_rp
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener detalle de resoluciones: {str(e)}")

@router.get("/reporte-detalle/flota")
async def get_reporte_detalle_flota(db = Depends(get_database)):
    """
    Retorna el detalle completo de la flota vehicular habilitada (4,364 unidades)
    """
    try:
        empresas_cursor = db["empresas"].find({}, {"ruc": 1, "razonSocial": 1})
        empresas_map = {}
        async for emp in empresas_cursor:
            ruc = emp.get("ruc")
            if ruc:
                rs = emp.get("razonSocial")
                rs_val = rs.get("principal") or rs.get("sunat") or str(rs) if isinstance(rs, dict) else str(rs or "")
                empresas_map[ruc] = rs_val

        flota_cursor = db["flota_empresa"].find(
            {"estado": "HABILITADO", "esta_activo": True}
        ).sort("placa", 1)

        lista_flota = []
        idx = 1
        async for f in flota_cursor:
            ruc = f.get("ruc")
            rs = f.get("razon_social") or empresas_map.get(ruc, "Desconocida")
            rutas_list = f.get("rutas") or []
            rutas_str = ", ".join(str(r) for r in rutas_list) if rutas_list else "Sin rutas asignadas"

            lista_flota.append({
                "numero": idx,
                "placa": f.get("placa"),
                "ruc": ruc,
                "razonSocial": rs,
                "nroResolucionPrimigenia": f.get("nro_resolucion_primigenia") or "",
                "nroResolucionHija": f.get("nro_resolucion_hija") or "",
                "tipoResolucionHija": f.get("tipo_resolucion_hija") or "",
                "rutasAsignadas": rutas_str,
                "numeroTuc": f.get("numero_tuc") or "",
                "estado": f.get("estado", "HABILITADO")
            })
            idx += 1

        return lista_flota
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener detalle de flota: {str(e)}")

@router.get("/reporte-detalle/tramites")
async def get_reporte_detalle_tramites(db = Depends(get_database)):
    """
    Retorna el desglose completo de trámites de sustitución e incremento de flota por empresa
    """
    try:
        empresas_cursor = db["empresas"].find({}, {"ruc": 1, "razonSocial": 1})
        empresas_map = {}
        async for emp in empresas_cursor:
            ruc = emp.get("ruc")
            if ruc:
                rs = emp.get("razonSocial")
                rs_val = rs.get("principal") or rs.get("sunat") or str(rs) if isinstance(rs, dict) else str(rs or "")
                empresas_map[ruc] = rs_val

        pipeline = [
            {"$match": {"esta_activo": True, "tipo_acto": {"$in": ["SUSTITUCION_VEHICULAR", "INCREMENTO_FLOTA"]}}},
            {"$group": {
                "_id": "$ruc_empresa",
                "razon_social_doc": {"$first": "$razon_social"},
                "sustituciones": {"$sum": {"$cond": [{"$eq": ["$tipo_acto", "SUSTITUCION_VEHICULAR"]}, 1, 0]}},
                "incrementos": {"$sum": {"$cond": [{"$eq": ["$tipo_acto", "INCREMENTO_FLOTA"]}, 1, 0]}},
                "totalTramites": {"$sum": 1}
            }},
            {"$sort": {"totalTramites": -1}}
        ]

        cursor = db["resoluciones_hijas"].aggregate(pipeline)
        lista = []
        idx = 1
        async for doc in cursor:
            ruc = doc["_id"]
            if not ruc:
                continue
            rs = empresas_map.get(ruc) or doc.get("razon_social_doc") or f"Empresa RUC {ruc}"
            lista.append({
                "ranking": idx,
                "ruc": ruc,
                "razonSocial": rs,
                "sustituciones": doc["sustituciones"],
                "incrementos": doc["incrementos"],
                "totalTramites": doc["totalTramites"]
            })
            idx += 1

        return lista
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener trámites por empresa: {str(e)}")

@router.get("/reporte-detalle/por-vencer")
async def get_reporte_detalle_por_vencer(db = Depends(get_database)):
    """
    Retorna las resoluciones primigenias que vencen en los próximos 30 y 60 días
    """
    try:
        now = datetime.utcnow()
        empresas_cursor = db["empresas"].find({}, {"ruc": 1, "razonSocial": 1})
        empresas_map = {}
        async for emp in empresas_cursor:
            ruc = emp.get("ruc")
            if ruc:
                rs = emp.get("razonSocial")
                rs_val = rs.get("principal") or rs.get("sunat") or str(rs) if isinstance(rs, dict) else str(rs or "")
                empresas_map[ruc] = rs_val

        rp_cursor = db["resoluciones_primigenias"].find({
            "esta_activo": True,
            "estado": {"$in": ["VIGENTE", "ACTIVO", "ACTIVA"]}
        }).sort("fecha_fin_vigencia", 1)

        lista = []
        idx = 1
        async for rp in rp_cursor:
            f_fin = rp.get("fecha_fin_vigencia")
            if not f_fin:
                continue

            if isinstance(f_fin, str):
                try:
                    f_fin = datetime.fromisoformat(f_fin.replace("Z", "+00:00"))
                except Exception:
                    continue

            f_naive = f_fin.replace(tzinfo=None) if f_fin.tzinfo else f_fin
            dias = (f_naive - now).days
            if 0 <= dias <= 60:
                ruc = rp.get("ruc_empresa")
                lista.append({
                    "numero": idx,
                    "nroResolucion": rp.get("nro_resolucion"),
                    "ruc": ruc,
                    "razonSocial": empresas_map.get(ruc, "Desconocida"),
                    "modalidad": rp.get("tipo_autorizacion", "PASAJEROS"),
                    "fechaFinVigencia": f_naive.strftime("%d/%m/%Y"),
                    "diasRestantes": dias,
                    "urgencia": "CRÍTICA (≤ 30 días)" if dias <= 30 else "PREVENTIVA (31-60 días)",
                    "linkDocumento": rp.get("link_documento") or ""
                })
                idx += 1

        lista.sort(key=lambda x: x["diasRestantes"])
        return lista
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener resoluciones por vencer: {str(e)}")

@router.post("/generar-reporte")
async def generar_reporte_google_docs(db = Depends(get_database)):
    """
    Genera un reporte de Google Docs con las estadísticas actuales y lo sube al Drive configurado.
    """
    try:
        # Obtenemos las estadísticas reutilizando la lógica
        estadisticas = await get_dashboard_estadisticas(db)
        
        # Inicializamos el servicio y generamos el documento
        reporte_service = GoogleDocsReportService()
        url_documento = reporte_service.generar_reporte_estadistico(estadisticas)
        
        return {
            "success": True,
            "message": "Reporte generado y guardado en Google Drive exitosamente.",
            "url": url_documento
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al generar reporte: {str(e)}")

