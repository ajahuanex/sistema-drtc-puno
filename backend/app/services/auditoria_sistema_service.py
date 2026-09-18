import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.auditoria_sistema import (
    LogAuditoriaSistema,
    ModuloAuditoria,
    AccionAuditoria,
    SeveridadAuditoria,
    UsuarioAuditoria
)

logger = logging.getLogger(__name__)

class AuditoriaSistemaService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["auditoria_sistema"]
        self._indices_creados = False

    async def _asegurar_indices(self):
        if not self._indices_creados:
            try:
                await self.collection.create_index([("timestamp", -1)])
                await self.collection.create_index([("modulo", 1)])
                await self.collection.create_index([("accion", 1)])
                await self.collection.create_index([("severidad", 1)])
                await self.collection.create_index([("entidad_id", 1)])
                await self.collection.create_index([("entidad_tipo", 1)])
                self._indices_creados = True
            except Exception as e:
                logger.warning(f"No se pudieron crear índices en auditoria_sistema: {e}")

    async def registrar_evento(
        self,
        modulo: ModuloAuditoria,
        accion: AccionAuditoria,
        entidad_tipo: str,
        entidad_id: str,
        descripcion: str,
        entidad_referencia: Optional[str] = None,
        acto_resolutivo_sustento: Optional[str] = None,
        expediente_numero: Optional[str] = None,
        valores_anteriores: Optional[Dict[str, Any]] = None,
        valores_nuevos: Optional[Dict[str, Any]] = None,
        campos_modificados: Optional[List[str]] = None,
        severidad: SeveridadAuditoria = SeveridadAuditoria.MEDIA,
        usuario: Optional[UsuarioAuditoria] = None,
        ip_address: Optional[str] = "127.0.0.1",
        user_agent: Optional[str] = None,
        metadatos: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
        es_historico_migrado: bool = False
    ) -> Optional[str]:
        """
        Registra un evento en la bitácora inmutable de auditoría del sistema de transportes.
        """
        try:
            await self._asegurar_indices()
            
            if usuario is None:
                usuario = UsuarioAuditoria(
                    dni="SISTEMA",
                    nombre="Sistema DRTC Puno",
                    email="admin@sirret.gob.pe",
                    rol="ADMIN"
                )

            # Detectar campos modificados automáticamente si no se especificaron
            if not campos_modificados and valores_anteriores and valores_nuevos:
                campos_modificados = [
                    k for k in valores_nuevos.keys()
                    if k in valores_anteriores and valores_anteriores[k] != valores_nuevos[k]
                ]

            doc = {
                "timestamp": timestamp or datetime.utcnow(),
                "usuario": usuario.dict() if hasattr(usuario, "dict") else dict(usuario),
                "ip_address": ip_address or "127.0.0.1",
                "user_agent": user_agent,
                "modulo": modulo.value if isinstance(modulo, ModuloAuditoria) else str(modulo),
                "accion": accion.value if isinstance(accion, AccionAuditoria) else str(accion),
                "severidad": severidad.value if isinstance(severidad, SeveridadAuditoria) else str(severidad),
                "entidad_tipo": entidad_tipo,
                "entidad_id": str(entidad_id),
                "entidad_referencia": entidad_referencia or str(entidad_id),
                "descripcion": descripcion,
                "acto_resolutivo_sustento": acto_resolutivo_sustento,
                "expediente_numero": expediente_numero,
                "valores_anteriores": valores_anteriores,
                "valores_nuevos": valores_nuevos,
                "campos_modificados": campos_modificados or [],
                "metadatos": metadatos or {},
                "es_historico_migrado": es_historico_migrado
            }

            res = await self.collection.insert_one(doc)
            return str(res.inserted_id)
        except Exception as e:
            logger.error(f"Error al registrar evento de auditoría: {e}", exc_info=True)
            return None

    async def consultar_auditoria(
        self,
        modulo: Optional[str] = None,
        accion: Optional[str] = None,
        severidad: Optional[str] = None,
        q: Optional[str] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 25
    ) -> Dict[str, Any]:
        """
        Consulta con filtros y búsqueda textual forense en la bitácora de auditoría.
        """
        await self._asegurar_indices()
        filtro: Dict[str, Any] = {}

        if modulo and modulo != "TODOS":
            filtro["modulo"] = modulo
        if accion and accion != "TODOS":
            filtro["accion"] = accion
        if severidad and severidad != "TODAS":
            filtro["severidad"] = severidad

        # Filtro de fechas
        if fecha_desde or fecha_hasta:
            rango_fecha: Dict[str, Any] = {}
            if fecha_desde:
                rango_fecha["$gte"] = fecha_desde
            if fecha_hasta:
                # incluir todo el día de fin
                fin = datetime(fecha_hasta.year, fecha_hasta.month, fecha_hasta.day, 23, 59, 59, 999999)
                rango_fecha["$lte"] = fin
            filtro["timestamp"] = rango_fecha

        # Búsqueda por texto libre
        if q and q.strip():
            term = q.strip()
            filtro["$or"] = [
                {"entidad_id": {"$regex": term, "$options": "i"}},
                {"entidad_referencia": {"$regex": term, "$options": "i"}},
                {"descripcion": {"$regex": term, "$options": "i"}},
                {"acto_resolutivo_sustento": {"$regex": term, "$options": "i"}},
                {"expediente_numero": {"$regex": term, "$options": "i"}},
                {"usuario.nombre": {"$regex": term, "$options": "i"}},
                {"usuario.dni": {"$regex": term, "$options": "i"}}
            ]

        total = await self.collection.count_documents(filtro)
        skip = max(0, (page - 1) * page_size)
        cursor = self.collection.find(filtro).sort("timestamp", -1).skip(skip).limit(page_size)

        items = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if isinstance(doc.get("timestamp"), datetime):
                doc["timestamp"] = doc["timestamp"].isoformat()
            items.append(doc)

        total_paginas = (total + page_size - 1) // page_size if total > 0 else 1

        return {
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_paginas,
            "items": items
        }

    async def obtener_log_por_id(self, log_id: str) -> Optional[Dict[str, Any]]:
        """
        Retorna el documento de auditoría específico con sus detalles y diff.
        """
        try:
            doc = await self.collection.find_one({"_id": ObjectId(log_id)})
            if doc:
                doc["_id"] = str(doc["_id"])
                if isinstance(doc.get("timestamp"), datetime):
                    doc["timestamp"] = doc["timestamp"].isoformat()
                return doc
        except Exception as e:
            logger.error(f"Error al obtener log por id {log_id}: {e}")
        return None

    async def obtener_kpis(self) -> Dict[str, Any]:
        """
        Calcula las estadísticas globales para el panel de control de auditoría.
        """
        now = datetime.utcnow()
        hace_24h = now - timedelta(hours=24)
        hace_7d = now - timedelta(days=7)

        total_eventos = await self.collection.count_documents({})
        eventos_24h = await self.collection.count_documents({"timestamp": {"$gte": hace_24h}})
        eventos_7d = await self.collection.count_documents({"timestamp": {"$gte": hace_7d}})
        eventos_criticos = await self.collection.count_documents({"severidad": "CRITICA"})
        eventos_altos = await self.collection.count_documents({"severidad": "ALTA"})

        # Agrupación por módulo
        pipeline_mod = [
            {"$group": {"_id": "$modulo", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        por_modulo = {}
        async for doc in self.collection.aggregate(pipeline_mod):
            if doc["_id"]:
                por_modulo[doc["_id"]] = doc["count"]

        # Agrupación por acción
        pipeline_acc = [
            {"$group": {"_id": "$accion", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        por_accion = {}
        async for doc in self.collection.aggregate(pipeline_acc):
            if doc["_id"]:
                por_accion[doc["_id"]] = doc["count"]

        # Agrupación por severidad
        pipeline_sev = [
            {"$group": {"_id": "$severidad", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        por_severidad = {}
        async for doc in self.collection.aggregate(pipeline_sev):
            if doc["_id"]:
                por_severidad[doc["_id"]] = doc["count"]

        # Top operadores/usuarios
        pipeline_usr = [
            {"$group": {
                "_id": "$usuario.dni",
                "nombre": {"$first": "$usuario.nombre"},
                "email": {"$first": "$usuario.email"},
                "rol": {"$first": "$usuario.rol"},
                "total": {"$sum": 1}
            }},
            {"$sort": {"total": -1}},
            {"$limit": 5}
        ]
        top_usuarios = []
        async for doc in self.collection.aggregate(pipeline_usr):
            top_usuarios.append({
                "dni": doc["_id"] or "SISTEMA",
                "nombre": doc.get("nombre") or "Administrador",
                "email": doc.get("email") or "",
                "rol": doc.get("rol") or "ADMIN",
                "total": doc["total"]
            })

        return {
            "totalEventos": total_eventos,
            "eventosUltimas24h": eventos_24h,
            "eventosUltimos7d": eventos_7d,
            "eventosCriticos": eventos_criticos,
            "eventosAltos": eventos_altos,
            "porModulo": por_modulo,
            "porAccion": por_accion,
            "porSeveridad": por_severidad,
            "topUsuarios": top_usuarios
        }

    async def sincronizar_historial_existente(self) -> Dict[str, int]:
        """
        Reconstruye de forma segura la bitácora histórica a partir de los datos operacionales:
        - Resoluciones Hijas (1,888 trámites de sustitución e incremento de flota)
        - Resoluciones Primigenias (210 autorizaciones matrices)
        - Rutas Habilitadas (447 rutas autorizadas)
        - Empresas (141 empresas concesionarias)
        """
        await self._asegurar_indices()
        
        conteo = {
            "sustituciones_e_incrementos": 0,
            "resoluciones_primigenias": 0,
            "rutas": 0,
            "empresas": 0,
            "total_generados": 0
        }

        # 1. Trámites de Flota (Resoluciones Hijas: Sustitución, Incremento)
        rh_cursor = self.db["resoluciones_hijas"].find({"esta_activo": True})
        async for rh in rh_cursor:
            rh_id_str = f"RH_{rh.get('nro_resolucion', '')}_{rh.get('id', '')}"
            # Verificar si ya fue migrado
            existe = await self.collection.find_one({"metadatos.origen_id": rh_id_str})
            if existe:
                continue

            tipo_acto = rh.get("tipo_acto") or "TRAMITE_FLOTA"
            nro_res = rh.get("nro_resolucion") or "S/N"
            nro_prim = rh.get("nro_resolucion_primigenia") or ""
            ruc = rh.get("ruc_empresa") or ""
            rs = rh.get("razon_social") or f"Empresa RUC {ruc}"
            ingresantes = rh.get("vehiculos_ingresantes") or []
            salientes = rh.get("vehiculos_salientes") or []
            tucs = rh.get("numeros_tuc") or []
            exp = rh.get("expediente_numero") or ""
            f_res = rh.get("fecha_resolucion") or rh.get("fecha_registro") or datetime.utcnow()

            accion = AccionAuditoria.SUSTITUCION if "SUSTITUCION" in tipo_acto else (
                AccionAuditoria.INCREMENTO if "INCREMENTO" in tipo_acto else AccionAuditoria.MODIFICACION
            )
            severidad = SeveridadAuditoria.ALTA

            # Descripción técnica precisa para el auditor
            if accion == AccionAuditoria.SUSTITUCION:
                sal_str = ", ".join(salientes) if salientes else "No especificada"
                ent_str = ", ".join(ingresantes) if ingresantes else "No especificada"
                desc = f"Sustitución vehicular autorizada: Sale unidad {sal_str} e ingresa unidad {ent_str}."
            elif accion == AccionAuditoria.INCREMENTO:
                ent_str = ", ".join(ingresantes) if ingresantes else "No especificada"
                desc = f"Incremento de flota vehicular: Incorporación de {len(ingresantes)} unidad(es) [{ent_str}]."
            else:
                desc = f"Trámite administrativo de flota: {tipo_acto}."

            if tucs:
                desc += f" TUCs asociados: {', '.join(tucs)}."

            ref_placas = ingresantes[0] if ingresantes else (salientes[0] if salientes else nro_res)
            
            await self.registrar_evento(
                modulo=ModuloAuditoria.VEHICULOS,
                accion=accion,
                entidad_tipo="flota_empresa",
                entidad_id=ref_placas,
                entidad_referencia=f"{rs} • {ref_placas}",
                descripcion=desc,
                acto_resolutivo_sustento=f"Resolución {nro_res} (Derivada de Res. Matriz {nro_prim})" if nro_prim else f"Resolución {nro_res}",
                expediente_numero=exp,
                valores_anteriores={"placas_salientes": salientes, "tucs_baja": rh.get("tucs_baja", [])} if salientes else None,
                valores_nuevos={"placas_ingresantes": ingresantes, "tucs_emitidos": tucs, "rutas_ids": rh.get("rutas_modificadas_ids", [])},
                campos_modificados=["flota_vehicular", "tuc", "rutas_asignadas"],
                severidad=severidad,
                usuario=UsuarioAuditoria(
                    dni="29562819",
                    nombre="Área Técnica de Autorizaciones DRTC",
                    email="transportes@drtcpuno.gob.pe",
                    rol="ESPECIALISTA_TRANSPORTE"
                ),
                timestamp=f_res if isinstance(f_res, datetime) else datetime.utcnow(),
                metadatos={"origen_id": rh_id_str, "ruc_empresa": ruc, "nro_resolucion": nro_res},
                es_historico_migrado=True
            )
            conteo["sustituciones_e_incrementos"] += 1

        # 2. Resoluciones Primigenias (Otorgamiento o Renovación de Concesión Matriz)
        rp_cursor = self.db["resoluciones_primigenias"].find({"esta_activo": True})
        async for rp in rp_cursor:
            nro_res = rp.get("nro_resolucion") or ""
            rp_id_str = f"RP_{nro_res}"
            existe = await self.collection.find_one({"metadatos.origen_id": rp_id_str})
            if existe:
                continue

            ruc = rp.get("ruc_empresa") or ""
            rs = rp.get("razon_social") or f"Empresa RUC {ruc}"
            modalidad = rp.get("tipo_autorizacion") or "PASAJEROS"
            f_res = rp.get("fecha_resolucion") or datetime.utcnow()
            anios = rp.get("anios_vigencia") or 10

            await self.registrar_evento(
                modulo=ModuloAuditoria.RESOLUCIONES,
                accion=AccionAuditoria.REGISTRO,
                entidad_tipo="resolucion_primigenia",
                entidad_id=nro_res,
                entidad_referencia=f"{rs} • {nro_res}",
                descripcion=f"Otorgamiento de Concesión / Autorización Matriz de Transporte ({modalidad}) por vigencia de {anios} años.",
                acto_resolutivo_sustento=f"Resolución Directoral Regional {nro_res}",
                expediente_numero=", ".join(rp.get("expedientes_codigos", [])) if rp.get("expedientes_codigos") else None,
                valores_nuevos={
                    "nro_resolucion": nro_res,
                    "modalidad": modalidad,
                    "anios_vigencia": anios,
                    "fecha_inicio_vigencia": str(rp.get("fecha_inicio_vigencia")),
                    "fecha_fin_vigencia": str(rp.get("fecha_fin_vigencia"))
                },
                campos_modificados=["autorizacion_concesion", "vigencia", "modalidad"],
                severidad=SeveridadAuditoria.CRITICA,
                usuario=UsuarioAuditoria(
                    dni="12345678",
                    nombre="Dirección Regional de Transportes DRTC",
                    email="direccion@drtcpuno.gob.pe",
                    rol="DIRECTOR_REGIONAL"
                ),
                timestamp=f_res if isinstance(f_res, datetime) else datetime.utcnow(),
                metadatos={"origen_id": rp_id_str, "ruc_empresa": ruc},
                es_historico_migrado=True
            )
            conteo["resoluciones_primigenias"] += 1

        # 3. Rutas Habilitadas
        rutas_cursor = self.db["rutas"].find({"estaActivo": True})
        async for r in rutas_cursor:
            r_id = str(r.get("_id"))
            cod_ruta = r.get("codigoRuta") or r.get("codigo_ruta") or r_id[:8]
            r_id_str = f"RUTA_{cod_ruta}_{r_id}"
            existe = await self.collection.find_one({"metadatos.origen_id": r_id_str})
            if existe:
                continue

            nom = r.get("nombre") or "Ruta Regional"
            emp_obj = r.get("empresa") or {}
            rs = emp_obj.get("razonSocial") if isinstance(emp_obj, dict) else "Empresa Concesionaria"
            res_obj = r.get("resolucion") or {}
            nro_res = res_obj.get("nroResolucion") if isinstance(res_obj, dict) else str(res_obj or "")
            f_crea = r.get("fechaCreacion") or datetime.utcnow()

            await self.registrar_evento(
                modulo=ModuloAuditoria.RUTAS,
                accion=AccionAuditoria.REGISTRO,
                entidad_tipo="ruta",
                entidad_id=cod_ruta,
                entidad_referencia=f"{nom} ({cod_ruta})",
                descripcion=f"Habilitación e inscripción de itinerario de ruta: {nom}. Servicio: {r.get('tipoServicio', 'PASAJEROS')}.",
                acto_resolutivo_sustento=f"Resolución {nro_res}" if nro_res else "Padrón de Rutas Autorizadas",
                valores_nuevos={
                    "codigoRuta": cod_ruta,
                    "nombre": nom,
                    "origen": r.get("origen", {}).get("nombre") if isinstance(r.get("origen"), dict) else str(r.get("origen")),
                    "destino": r.get("destino", {}).get("nombre") if isinstance(r.get("destino"), dict) else str(r.get("destino")),
                    "itinerario": r.get("descripcion", "Directo"),
                    "tipoServicio": r.get("tipoServicio", "PASAJEROS")
                },
                campos_modificados=["itinerario", "origen_destino", "concesion_ruta"],
                severidad=SeveridadAuditoria.ALTA,
                usuario=UsuarioAuditoria(
                    dni="40881920",
                    nombre="Subdirección de Rutas y Operaciones",
                    email="rutas@drtcpuno.gob.pe",
                    rol="ESPECIALISTA_TRANSPORTE"
                ),
                timestamp=f_crea if isinstance(f_crea, datetime) else datetime.utcnow(),
                metadatos={"origen_id": r_id_str, "empresa": rs},
                es_historico_migrado=True
            )
            conteo["rutas"] += 1

        # 4. Empresas Concesionarias
        emp_cursor = self.db["empresas"].find({"estaActivo": True})
        async for emp in emp_cursor:
            ruc = emp.get("ruc") or ""
            emp_id_str = f"EMP_{ruc}"
            existe = await self.collection.find_one({"metadatos.origen_id": emp_id_str})
            if existe:
                continue

            rs = emp.get("razonSocial")
            rs_val = rs.get("principal") or rs.get("sunat") or str(rs) if isinstance(rs, dict) else str(rs or f"Empresa {ruc}")
            rep = emp.get("representanteLegal") or {}
            rep_nom = rep.get("nombreCompleto") or rep.get("nombres") if isinstance(rep, dict) else str(rep or "No especificado")
            f_reg = emp.get("fechaRegistro") or datetime.utcnow()

            await self.registrar_evento(
                modulo=ModuloAuditoria.EMPRESAS,
                accion=AccionAuditoria.REGISTRO,
                entidad_tipo="empresa",
                entidad_id=ruc,
                entidad_referencia=f"{rs_val} (RUC {ruc})",
                descripcion=f"Registro y acreditación corporativa de empresa operadora de transportes. Representante: {rep_nom}.",
                acto_resolutivo_sustento="Partida Registral SUNARP / Ficha RUC",
                valores_nuevos={
                    "ruc": ruc,
                    "razonSocial": rs_val,
                    "representanteLegal": rep_nom,
                    "estado": emp.get("estado", "ACTIVA")
                },
                campos_modificados=["registro_empresa", "representante_legal", "estado"],
                severidad=SeveridadAuditoria.MEDIA,
                usuario=UsuarioAuditoria(
                    dni="12345678",
                    nombre="Mesa de Partes y Registro DRTC",
                    email="registro@drtcpuno.gob.pe",
                    rol="OPERADOR_REGISTRO"
                ),
                timestamp=f_reg if isinstance(f_reg, datetime) else datetime.utcnow(),
                metadatos={"origen_id": emp_id_str, "ruc": ruc},
                es_historico_migrado=True
            )
            conteo["empresas"] += 1

        conteo["total_generados"] = (
            conteo["sustituciones_e_incrementos"] +
            conteo["resoluciones_primigenias"] +
            conteo["rutas"] +
            conteo["empresas"]
        )

        return conteo
