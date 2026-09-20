"""
Router de Búsqueda Global Unificada para SIRRETT (DRTC Puno)
Consulta en paralelo múltiples colecciones de MongoDB:
- Empresas
- Flota / Vehículos
- Resoluciones Directorales
- Rutas y Red Vial
- Conductores
- Infracciones / Fiscalización
"""

import re
import asyncio
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query
from app.dependencies.db import get_database

router = APIRouter(
    prefix="/busqueda-global",
    tags=["Búsqueda Global SIRRETT"]
)


def extract_razon_social(doc: Dict[str, Any]) -> str:
    """Extrae la razón social independientemente de la estructura del documento."""
    if not doc:
        return ""
    rs = doc.get("razonSocial")
    if isinstance(rs, str):
        return rs.strip()
    if isinstance(rs, dict):
        return rs.get("principal") or rs.get("sunat") or ""
    if doc.get("razon_social"):
        return str(doc.get("razon_social")).strip()
    datos_sunat = doc.get("datosSunat")
    if isinstance(datos_sunat, dict):
        return datos_sunat.get("ddp_nombre") or datos_sunat.get("razonSocial") or ""
    return ""


@router.get("", summary="Búsqueda global unificada en tiempo real")
@router.get("/", summary="Búsqueda global unificada en tiempo real")
async def buscar_global(
    q: str = Query(..., min_length=1, description="Texto de búsqueda (RUC, Placa, R.D., DNI, Empresa, Ruta)"),
    limit_per_category: int = Query(5, ge=1, le=20, description="Límite de resultados por categoría"),
    db = Depends(get_database)
) -> Dict[str, Any]:
    query_str = q.strip()
    if not query_str or db is None:
        return {
            "query": query_str,
            "total_coincidencias": 0,
            "resultados": {
                "empresas": [],
                "vehiculos": [],
                "resoluciones": [],
                "rutas": [],
                "conductores": [],
                "infracciones": []
            }
        }

    # Escapar caracteres regex para evitar inyecciones
    safe_q = re.escape(query_str)
    regex_pattern = {"$regex": safe_q, "$options": "i"}

    # 1. Búsqueda en Empresas
    async def search_empresas():
        try:
            filter_q = {
                "$or": [
                    {"ruc": regex_pattern},
                    {"razonSocial": regex_pattern},
                    {"razonSocial.principal": regex_pattern},
                    {"razonSocial.sunat": regex_pattern},
                    {"razon_social": regex_pattern},
                    {"nombreComercial": regex_pattern},
                    {"representanteLegal": regex_pattern},
                    {"representanteLegal.nombreCompleto": regex_pattern},
                    {"socios.nombres": regex_pattern},
                    {"socios.apellidos": regex_pattern},
                    {"datosSunat.ddp_nombre": regex_pattern}
                ]
            }
            cursor = db["empresas"].find(filter_q).limit(limit_per_category)
            docs = await cursor.to_list(length=limit_per_category)
            results = []
            for d in docs:
                ruc = d.get("ruc") or ""
                rs = extract_razon_social(d)
                estado = d.get("estado") or d.get("estadoContribuyente") or "ACTIVO"
                results.append({
                    "id": str(d.get("_id", "")),
                    "tipo": "empresa",
                    "titulo": rs or f"Empresa RUC: {ruc}",
                    "subtitulo": f"RUC: {ruc} • {estado}",
                    "icono": "business",
                    "badge": estado,
                    "badgeColor": "success" if str(estado).upper() in ("ACTIVO", "HABIDO", "HABILITADO") else "warning",
                    "ruc": ruc,
                    "ruta": f"/vehiculos-empresa?ruc={ruc}",
                    "data": {
                        "ruc": ruc,
                        "razon_social": rs,
                        "telefono": d.get("telefonoContacto") or d.get("telefono"),
                        "email": d.get("emailContacto") or d.get("email")
                    }
                })
            return results
        except Exception as e:
            return []

    # 2. Búsqueda en Flota / Vehículos
    async def search_vehiculos():
        try:
            # Buscar en flota_empresa
            filter_flota = {
                "$or": [
                    {"placa": regex_pattern},
                    {"numero_tuc": regex_pattern},
                    {"nro_resolucion_primigenia": regex_pattern},
                    {"nro_resolucion_hija": regex_pattern},
                    {"num_expediente": regex_pattern},
                    {"expediente": regex_pattern},
                    {"vin": regex_pattern},
                    {"numero_motor": regex_pattern},
                    {"numero_serie": regex_pattern}
                ]
            }
            cursor = db["flota_empresa"].find(filter_flota).limit(limit_per_category)
            docs = await cursor.to_list(length=limit_per_category)
            
            # Si hay pocos, buscar también en colección vehiculos
            if len(docs) < limit_per_category:
                filter_vehs = {
                    "$or": [
                        {"placa": regex_pattern},
                        {"numeroTuc": regex_pattern},
                        {"numero_tuc": regex_pattern},
                        {"numeroSerie": regex_pattern},
                        {"vin": regex_pattern}
                    ]
                }
                extra_cursor = db["vehiculos"].find(filter_vehs).limit(limit_per_category - len(docs))
                extra_docs = await extra_cursor.to_list(length=limit_per_category - len(docs))
                placas_vistas = {d.get("placa") for d in docs if d.get("placa")}
                for ed in extra_docs:
                    if ed.get("placa") not in placas_vistas:
                        docs.append(ed)

            results = []
            for v in docs:
                placa = v.get("placa") or "S/P"
                tuc = v.get("numero_tuc") or v.get("numeroTuc") or "-"
                prim = v.get("nro_resolucion_primigenia") or v.get("resolucionPrimigenia") or "-"
                rs = v.get("razon_social") or v.get("razonSocial") or ""
                ruc = v.get("ruc") or v.get("rucEmpresa") or ""
                estado = v.get("estado") or "HABILITADO"
                results.append({
                    "id": str(v.get("_id", "")),
                    "tipo": "vehiculo",
                    "titulo": f"Placa: {placa}",
                    "subtitulo": f"TUC: {tuc} • R.D.: {prim}" + (f" • {rs[:30]}" if rs else ""),
                    "icono": "directions_car",
                    "badge": estado,
                    "badgeColor": "success" if str(estado).upper() == "HABILITADO" else "danger",
                    "placa": placa,
                    "ruc": ruc,
                    "ruta": f"/vehiculos-empresa?ruc={ruc}" if ruc else f"/vehiculos?placa={placa}",
                    "data": {
                        "placa": placa,
                        "numero_tuc": tuc,
                        "resolucion": prim,
                        "ruc": ruc,
                        "razon_social": rs,
                        "estado": estado
                    }
                })
            return results
        except Exception as e:
            return []

    # 3. Búsqueda en Resoluciones Directorales (Primigenias e Hijas)
    async def search_resoluciones():
        try:
            filter_res = {
                "$or": [
                    {"nro_resolucion": regex_pattern},
                    {"num_expediente": regex_pattern},
                    {"expediente": regex_pattern},
                    {"ruc_empresa": regex_pattern},
                    {"ruc": regex_pattern},
                    {"razon_social": regex_pattern}
                ]
            }
            cursor_prim = db["resoluciones_primigenias"].find(filter_res).limit(limit_per_category)
            docs_prim = await cursor_prim.to_list(length=limit_per_category)
            
            cursor_gen = db["resoluciones"].find(filter_res).limit(limit_per_category)
            docs_gen = await cursor_gen.to_list(length=limit_per_category)
            
            combined = docs_prim + [d for d in docs_gen if d.get("nro_resolucion") not in {p.get("nro_resolucion") for p in docs_prim}]
            results = []
            for r in combined[:limit_per_category]:
                nro = r.get("nro_resolucion") or r.get("nroResolucion") or "S/N"
                exp = r.get("num_expediente") or r.get("expediente") or "-"
                rs = r.get("razon_social") or r.get("razonSocial") or ""
                ruc = r.get("ruc_empresa") or r.get("ruc") or ""
                estado = r.get("estado") or "VIGENTE"
                results.append({
                    "id": str(r.get("_id", "")),
                    "tipo": "resolucion",
                    "titulo": f"Resolución {nro}",
                    "subtitulo": f"Expediente: {exp}" + (f" • {rs[:30]}" if rs else ""),
                    "icono": "description",
                    "badge": estado,
                    "badgeColor": "success" if str(estado).upper() in ("VIGENTE", "ACTIVA") else "warning",
                    "nro_resolucion": nro,
                    "ruc": ruc,
                    "ruta": f"/vehiculos-empresa?ruc={ruc}" if ruc else "/resoluciones-primigenias",
                    "data": {
                        "nro_resolucion": nro,
                        "num_expediente": exp,
                        "ruc_empresa": ruc,
                        "razon_social": rs,
                        "estado": estado
                    }
                })
            return results
        except Exception as e:
            return []

    # 4. Búsqueda en Rutas
    async def search_rutas():
        try:
            filter_rutas = {
                "$or": [
                    {"codigoRuta": regex_pattern},
                    {"codigo_ruta": regex_pattern},
                    {"nombre": regex_pattern},
                    {"origen.nombre": regex_pattern},
                    {"destino.nombre": regex_pattern},
                    {"itinerario.nombre": regex_pattern},
                    {"empresa.razonSocial": regex_pattern},
                    {"resolucion.nroResolucion": regex_pattern}
                ]
            }
            cursor = db["rutas"].find(filter_rutas).limit(limit_per_category)
            docs = await cursor.to_list(length=limit_per_category)
            results = []
            for r in docs:
                cod = r.get("codigoRuta") or r.get("codigo_ruta") or "S/C"
                nom = r.get("nombre")
                if not nom:
                    orig = r.get("origen", {}).get("nombre") if isinstance(r.get("origen"), dict) else ""
                    dest = r.get("destino", {}).get("nombre") if isinstance(r.get("destino"), dict) else ""
                    nom = f"{orig} - {dest}" if (orig and dest) else f"Ruta {cod}"
                
                serv = r.get("tipoServicio") or "PASAJEROS"
                emp_nom = r.get("empresa", {}).get("razonSocial") if isinstance(r.get("empresa"), dict) else ""
                results.append({
                    "id": str(r.get("_id", "")),
                    "tipo": "ruta",
                    "titulo": f"Ruta {cod}: {nom}",
                    "subtitulo": f"Servicio: {serv}" + (f" • {emp_nom[:25]}" if emp_nom else ""),
                    "icono": "route",
                    "badge": serv,
                    "badgeColor": "info",
                    "codigo_ruta": cod,
                    "ruta": "/rutas",
                    "data": {
                        "codigo_ruta": cod,
                        "nombre": nom,
                        "tipo_servicio": serv
                    }
                })
            return results
        except Exception as e:
            return []

    # 5. Búsqueda en Conductores
    async def search_conductores():
        try:
            filter_cond = {
                "$or": [
                    {"numeroDocumento": regex_pattern},
                    {"numero_documento": regex_pattern},
                    {"dni": regex_pattern},
                    {"nombres": regex_pattern},
                    {"apellidos": regex_pattern},
                    {"numeroLicencia": regex_pattern},
                    {"numero_licencia": regex_pattern}
                ]
            }
            cursor = db["conductores"].find(filter_cond).limit(limit_per_category)
            docs = await cursor.to_list(length=limit_per_category)
            results = []
            for c in docs:
                nombres = f"{c.get('nombres', '')} {c.get('apellidos', '')}".strip()
                dni = c.get("numeroDocumento") or c.get("numero_documento") or c.get("dni") or "-"
                lic = c.get("numeroLicencia") or c.get("numero_licencia") or "-"
                cat = c.get("categoriaLicencia") or c.get("categoria") or ""
                results.append({
                    "id": str(c.get("_id", "")),
                    "tipo": "conductor",
                    "titulo": nombres or f"Conductor DNI: {dni}",
                    "subtitulo": f"DNI: {dni} • Licencia: {lic}" + (f" ({cat})" if cat else ""),
                    "icono": "badge",
                    "badge": cat or "ACTIVO",
                    "badgeColor": "primary",
                    "dni": dni,
                    "ruta": f"/conductores?dni={dni}",
                    "data": {
                        "nombres_completos": nombres,
                        "dni": dni,
                        "licencia": lic
                    }
                })
            return results
        except Exception as e:
            return []

    # 6. Búsqueda en Infracciones / Fiscalización
    async def search_infracciones():
        try:
            filter_inf = {
                "$or": [
                    {"numero_acta": regex_pattern},
                    {"codigo_infraccion": regex_pattern},
                    {"placa": regex_pattern},
                    {"infractor_nombre": regex_pattern},
                    {"conductor_nombre": regex_pattern}
                ]
            }
            cursor = db["infracciones"].find(filter_inf).limit(limit_per_category)
            docs = await cursor.to_list(length=limit_per_category)
            results = []
            for i in docs:
                acta = i.get("numero_acta") or i.get("numeroActa") or "S/A"
                cod = i.get("codigo_infraccion") or i.get("codigoInfraccion") or "-"
                placa = i.get("placa") or "-"
                estado = i.get("estado") or "PENDIENTE"
                results.append({
                    "id": str(i.get("_id", "")),
                    "tipo": "infraccion",
                    "titulo": f"Acta N° {acta} (Infr. {cod})",
                    "subtitulo": f"Placa: {placa} • {i.get('infractor_nombre') or i.get('empresa_nombre') or ''}",
                    "icono": "gavel",
                    "badge": estado,
                    "badgeColor": "warning",
                    "ruta": "/infracciones",
                    "data": {
                        "numero_acta": acta,
                        "codigo_infraccion": cod,
                        "placa": placa
                    }
                })
            return results
        except Exception as e:
            return []

    # Ejecutar todas las consultas en paralelo con asyncio.gather
    res_emp, res_veh, res_res, res_rut, res_cond, res_inf = await asyncio.gather(
        search_empresas(),
        search_vehiculos(),
        search_resoluciones(),
        search_rutas(),
        search_conductores(),
        search_infracciones()
    )

    total = len(res_emp) + len(res_veh) + len(res_res) + len(res_rut) + len(res_cond) + len(res_inf)

    return {
        "query": query_str,
        "total_coincidencias": total,
        "resultados": {
            "empresas": res_emp,
            "vehiculos": res_veh,
            "resoluciones": res_res,
            "rutas": res_rut,
            "conductores": res_cond,
            "infracciones": res_inf
        }
    }
