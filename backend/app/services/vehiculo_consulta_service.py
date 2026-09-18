"""
Servicio especializado para Consulta Integral y Récord Vehicular 360°
Consolida datos técnicos (vehiculos_data), flota y resoluciones (flota_empresa),
tarjetas de circulación (tucs) y normativa del MTC (RNAT D.S. 017-2009-MTC).
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
import re
from motor.motor_asyncio import AsyncIOMotorDatabase


class VehiculoConsultaService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.col_vehiculos_data = db["vehiculos_data"]
        self.col_flota = db["flota_empresa"]
        self.col_tucs = db["tucs"]
        self.col_res_prim = db["resoluciones_primigenias"]
        self.col_res_hijas = db["resoluciones_hijas"]
        self.col_empresas = db["empresas"]
        self.col_rutas = db["rutas"]

    def _normalizar_placa(self, placa: str) -> Dict[str, str]:
        """Normaliza la placa generando variantes con y sin guion"""
        raw = re.sub(r'[^A-Za-z0-9]', '', placa.strip().upper())
        con_guion = f"{raw[:3]}-{raw[3:]}" if len(raw) >= 4 else raw
        return {
            "raw": raw,
            "con_guion": con_guion,
            "original": placa.strip().upper()
        }

    def _evaluar_normativa_mtc(self, anio_fabricacion: Optional[int], categoria: Optional[str]) -> Dict[str, Any]:
        """
        Evalúa el cumplimiento normativo dual:
        1. RNAT D.S. Nº 017-2009-MTC (Art. 25: Límite ordinario de 15 años de permanencia en el servicio regular).
        2. Régimen Extraordinario de Permanencia Región Puno (Resolución Ministerial Especial Puno - Cronograma Art. 1.1).
        3. Categorías vehiculares MTC (D.S. 058-2003-MTC).
        """
        anio_actual = datetime.now().year
        evaluacion = {
            "anio_actual": anio_actual,
            "anio_fabricacion": anio_fabricacion,
            "antiguedad_anios": None,
            "limite_permanencia_anios": 15,
            "anio_limite_salida_rnat": None,
            "estado_antiguedad_rnat": "NO_DETERMINADO",
            "badge_color": "gray",
            "mensaje_normativo": "Año de fabricación no registrado.",
            "categoria_valida_rnat": True,
            "observacion_categoria": "",
            # Evaluación bajo Resolución Ministerial N.° 585-2021-MTC/01 (Ámbito Región Puno)
            "regimen_puno": {
                "norma_legal": "Resolución Ministerial N.° 585-2021-MTC/01",
                "titulo_norma": "Régimen extraordinario de permanencia para los vehículos destinados al transporte regular de personas en el ámbito de la región Puno",
                "aplica_cronograma_puno": False,
                "fecha_retiro_puno": None,
                "estado_puno": "NO_APLICA",
                "mensaje_puno": "Aplica régimen nacional ordinario del RENAT (D.S. N.° 017-2009-MTC).",
                "condicion_citv_obligatoria": "Acreditación con Certificado de Inspección Técnica Vehicular (CITV) obtenido de conformidad con la normativa de la materia y aprobación de controles inopinados (Art. 2.1 inc. a, R.M. N.° 585-2021-MTC/01)."
            },
            # Dictamen técnico consolidado
            "norma_aplicable": "RENAT (D.S. N.° 017-2009-MTC)",
            "dictamen_final": "NO_DETERMINADO",
            "alerta_critica": False
        }

        if anio_fabricacion and anio_fabricacion > 1900:
            antiguedad = anio_actual - anio_fabricacion
            anio_limite_rnat = anio_fabricacion + 15
            evaluacion["antiguedad_anios"] = antiguedad
            evaluacion["anio_limite_salida_rnat"] = anio_limite_rnat

            # Cronograma oficial del Régimen Extraordinario Región Puno
            # Aprobado mediante Resolución Ministerial N.° 585-2021-MTC/01 (Artículo 1.1)
            # Solo aplicable a vehículos fabricados entre 1990 y 2009 habilitados por el GORE Puno
            cronograma_puno = [
                ((1990, 1991), 2021),
                ((1992, 1993), 2022),
                ((1994, 1995), 2023),
                ((1996, 1997), 2024),
                ((1998, 1999), 2025),
                ((2000, 2001), 2026),
                ((2002, 2004), 2027),
                ((2005, 2007), 2028),
                ((2008, 2009), 2029),
            ]

            retiro_puno = None
            for (inicio, fin), f_retiro in cronograma_puno:
                if inicio <= anio_fabricacion <= fin:
                    retiro_puno = f_retiro
                    break

            if retiro_puno is not None:
                # El vehículo se encuentra en el rango 1990 - 2009: APLICA R.M. N.° 585-2021-MTC/01
                evaluacion["norma_aplicable"] = "Resolución Ministerial N.° 585-2021-MTC/01 (Región Puno)"
                evaluacion["regimen_puno"]["aplica_cronograma_puno"] = True
                evaluacion["regimen_puno"]["fecha_retiro_puno"] = retiro_puno

                if retiro_puno < anio_actual:
                    evaluacion["regimen_puno"]["estado_puno"] = "RETIRO_VENCIDO"
                    evaluacion["regimen_puno"]["mensaje_puno"] = f"Fecha de retiro cumplida (31/12/{retiro_puno}) bajo R.M. N.° 585-2021-MTC/01. Unidad no autorizable para transporte público."
                    evaluacion["dictamen_final"] = "RETIRO_VENCIDO"
                    evaluacion["badge_color"] = "red"
                    evaluacion["mensaje_normativo"] = f"RETIRO VENCIDO (Fecha límite: 31/12/{retiro_puno}) conforme a la R.M. N.° 585-2021-MTC/01 (Región Puno)."
                    evaluacion["alerta_critica"] = True
                elif retiro_puno == anio_actual:
                    evaluacion["regimen_puno"]["estado_puno"] = "RETIRO_ANIO_ACTUAL_2026"
                    evaluacion["regimen_puno"]["mensaje_puno"] = f"¡ALERTA CRÍTICA!: Fecha de retiro improrrogable este año 2026 (31/12/2026) bajo R.M. N.° 585-2021-MTC/01."
                    evaluacion["dictamen_final"] = "RETIRO_2026"
                    evaluacion["badge_color"] = "amber"
                    evaluacion["mensaje_normativo"] = f"RETIRO OBLIGATORIO ESTE AÑO 2026 (31/12/2026) según R.M. N.° 585-2021-MTC/01. Requiere sustitución urgente de flota."
                    evaluacion["alerta_critica"] = True
                else:
                    evaluacion["regimen_puno"]["estado_puno"] = "VIGENTE_REGIMEN_PUNO"
                    evaluacion["regimen_puno"]["mensaje_puno"] = f"Amparado bajo el Régimen Extraordinario de Puno (R.M. N.° 585-2021-MTC/01) hasta el 31/12/{retiro_puno} (sujeto a CITV favorable)."
                    evaluacion["dictamen_final"] = "HABILITADO_REGIMEN_PUNO"
                    evaluacion["badge_color"] = "green"
                    evaluacion["mensaje_normativo"] = f"Habilitado bajo R.M. N.° 585-2021-MTC/01 hasta el 31/12/{retiro_puno} (Condición Art. 2: CITV obligatorio)."
            else:
                # Fuera del cronograma de Puno (año >= 2010 o año < 1990) -> APLICA MARCO NACIONAL RENAT
                evaluacion["norma_aplicable"] = "Reglamento Nacional de Administración de Transporte - RENAT (D.S. N.° 017-2009-MTC)"
                evaluacion["regimen_puno"]["aplica_cronograma_puno"] = False
                evaluacion["regimen_puno"]["estado_puno"] = "REGIMEN_GENERAL_RNAT"
                evaluacion["regimen_puno"]["mensaje_puno"] = "Unidad fuera del cronograma regional de Puno (1990-2009). Rige el Régimen Nacional del RENAT (D.S. N.° 017-2009-MTC, límite ordinario de 15 años)."

                if antiguedad < 13:
                    evaluacion["estado_antiguedad_rnat"] = "VIGENTE"
                    evaluacion["dictamen_final"] = "VIGENTE"
                    evaluacion["badge_color"] = "green"
                    evaluacion["mensaje_normativo"] = f"Vehículo operativo y apto ({antiguedad} años de antigüedad). Dentro del plazo legal ordinario del RENAT (Límite: año {anio_limite_rnat})."
                elif 13 <= antiguedad <= 15:
                    evaluacion["estado_antiguedad_rnat"] = "PROXIMO_A_VENCER"
                    evaluacion["dictamen_final"] = "PROXIMO_A_VENCER"
                    evaluacion["badge_color"] = "amber"
                    evaluacion["mensaje_normativo"] = f"Alerta preventiva de antigüedad ({antiguedad} años). Próximo a cumplir el límite de 15 años del RENAT (Año límite: {anio_limite_rnat})."
                else:
                    evaluacion["estado_antiguedad_rnat"] = "LIMITE_EXCEDIDO"
                    evaluacion["dictamen_final"] = "LIMITE_EXCEDIDO"
                    evaluacion["badge_color"] = "red"
                    evaluacion["mensaje_normativo"] = f"Vida útil excedida ({antiguedad} años). Superó los 15 años máximos de permanencia según RENAT. Inapto para renovación salvo prórroga expresa."

        if categoria:
            cat_upper = categoria.upper()
            if "M1" in cat_upper:
                evaluacion["categoria_valida_rnat"] = False
                evaluacion["observacion_categoria"] = "Categoría M1 no autorizada para servicio de transporte interprovincial regular según RNAT."
            elif "M2" in cat_upper:
                evaluacion["categoria_valida_rnat"] = True
                evaluacion["observacion_categoria"] = "Categoría M2 (Vehículo de pasajeros hasta 5 toneladas - Minibús/Combi)."
            elif "M3" in cat_upper:
                evaluacion["categoria_valida_rnat"] = True
                evaluacion["observacion_categoria"] = "Categoría M3 (Ómnibus de pasajeros mayor a 5 toneladas)."

        return evaluacion

    async def consultar_vehiculo_360(self, placa_param: str) -> Optional[Dict[str, Any]]:
        """
        Consulta 360° que reúne toda la vida del vehículo en el sistema:
        1. Ficha técnica (SUNARP / MTC)
        2. Estado administrativo actual
        3. Historial de empresas y resoluciones
        4. TUCs emitidas
        5. Semáforo y alertas normativas MTC
        """
        placa_norm = self._normalizar_placa(placa_param)
        placas_query = [placa_norm["con_guion"], placa_norm["raw"], placa_norm["original"]]

        # 1. Buscar datos técnicos en vehiculos_data
        tech = await self.col_vehiculos_data.find_one({
            "$or": [
                {"placa_actual": {"$in": placas_query}},
                {"placa": {"$in": placas_query}}
            ]
        })

        # 2. Buscar participaciones en flota_empresa
        flota_records = await self.col_flota.find({
            "placa": {"$in": placas_query}
        }).to_list(200)

        # 3. Buscar TUCs asociadas
        tucs_records = await self.col_tucs.find({
            "placa": {"$in": placas_query}
        }).to_list(100)

        # Si no existe en ningún lado, retornar None
        if not tech and not flota_records and not tucs_records:
            return None

        # Resolver placa principal oficial
        placa_oficial = placa_norm["con_guion"]
        if tech and tech.get("placa_actual"):
            placa_oficial = tech["placa_actual"]
        elif flota_records:
            placa_oficial = flota_records[0].get("placa") or placa_oficial

        # 4. Extraer datos técnicos
        datos_tecnicos = None
        anio_fab = None
        categoria_veh = None
        if tech:
            anio_fab = tech.get("anio_fabricacion")
            categoria_veh = tech.get("categoria")
            datos_tecnicos = {
                "marca": tech.get("marca"),
                "modelo": tech.get("modelo"),
                "anio_fabricacion": tech.get("anio_fabricacion"),
                "anio_modelo": tech.get("anio_modelo"),
                "categoria": tech.get("categoria"),
                "carroceria": tech.get("carroceria"),
                "clase": tech.get("clase"),
                "combustible": tech.get("combustible"),
                "color": tech.get("color"),
                "numero_motor": tech.get("numero_motor"),
                "vin": tech.get("vin") or tech.get("numero_serie"),
                "numero_serie": tech.get("numero_serie") or tech.get("vin"),
                "numero_asientos": tech.get("numero_asientos"),
                "numero_pasajeros": tech.get("numero_pasajeros"),
                "numero_ejes": tech.get("numero_ejes"),
                "numero_ruedas": tech.get("numero_ruedas"),
                "cilindrada": tech.get("cilindrada"),
                "peso_neto": tech.get("peso_neto"),
                "peso_bruto": tech.get("peso_bruto"),
                "carga_util": tech.get("carga_util"),
                "longitud": tech.get("longitud"),
                "ancho": tech.get("ancho"),
                "altura": tech.get("altura"),
                "fuente_datos": tech.get("fuente_datos", "SUNARP / SISTEMA"),
                "observaciones_tecnicas": tech.get("observaciones")
            }

        # 5. Evaluación de normativa MTC
        normativa_mtc = self._evaluar_normativa_mtc(anio_fab, categoria_veh)

        # 6. Analizar estado administrativo actual (de flota_empresa)
        # Buscar el registro más relevante (priorizando HABILITADO o el más reciente)
        registro_activo = None
        registros_habilitados = [f for f in flota_records if f.get("estado") == "HABILITADO"]
        if registros_habilitados:
            registro_activo = registros_habilitados[0]
        elif flota_records:
            registro_activo = flota_records[0]

        # 6.2 Detección de Modalidad de Servicio para el Color de la Placa MTC
        # Regular = Franja Naranja (#ea580c) (Transporte Regular de Personas)
        # Turismo = Franja Morada (#7e22ce) (Transporte Turístico - Servicio Especial)
        # NOTA TÉCNICA NORMATIVA MTC:
        # La razón social o denominación comercial de la empresa NO determina la modalidad.
        # En el Perú, múltiples empresas incluyen "Turismo" en su denominación social
        # (ej. 'TRANSPORTE DE TURISMO FLASH SAN ANTONIO E.I.R.L.'), pero su autorización
        # y concesión otorgada por la DRTC/MTC es de Servicio Regular de Pasajeros.
        tipo_servicio_upper = (registro_activo.get("tipoServicio") or "").upper() if registro_activo else ""
        obs_tech = str(tech.get("observaciones", "")).upper() if tech else ""

        # Es turismo únicamente si el tipo de servicio técnico autorizado está clasificado
        # explícitamente como TURISMO / TURISTICO (y no como PASAJEROS / REGULAR).
        es_turismo = (
            ("TURISM" in tipo_servicio_upper or "TURIST" in tipo_servicio_upper) and
            ("PASAJER" not in tipo_servicio_upper and "REGULAR" not in tipo_servicio_upper)
        ) or (
            ("TRANSPORTE TURISTICO" in obs_tech or "SERVICIO DE TURISMO" in obs_tech) and
            ("PASAJEROS" not in obs_tech and "REGULAR" not in obs_tech)
        )

        if es_turismo:
            modalidad_placa = {
                "codigo": "TURISMO",
                "nombre": "Transporte Turístico",
                "color_franja": "#7e22ce",
                "color_texto": "#ffffff",
                "color_nombre": "Morada",
                "normativa_referencia": "Reglamento de Placa Única Nacional de Rodaje (D.S. 017-2008-MTC)"
            }
        else:
            modalidad_placa = {
                "codigo": "REGULAR",
                "nombre": "Transporte Regular de Pasajeros",
                "color_franja": "#ea580c",
                "color_texto": "#ffffff",
                "color_nombre": "Naranja",
                "normativa_referencia": "Reglamento de Placa Única Nacional de Rodaje (D.S. 017-2008-MTC)"
            }

        # Alertas administrativas y normativas
        alertas = []
        if len(registros_habilitados) > 1:
            nombres_empresas = list(set(f.get("razon_social") for f in registros_habilitados))
            alertas.append({
                "tipo": "ADVERTENCIA",
                "titulo": "Posible Duplicidad de Habilitación",
                "descripcion": f"La unidad figura como HABILITADA en {len(registros_habilitados)} registros: {', '.join(nombres_empresas)}. Verifique si se dio de baja en la empresa anterior."
            })

        if normativa_mtc.get("alerta_critica"):
            alertas.append({
                "tipo": "PELIGRO" if normativa_mtc.get("dictamen_final") == "RETIRO_VENCIDO" else "ADVERTENCIA",
                "titulo": "Régimen Extraordinario Región Puno (R.M.)",
                "descripcion": f"{normativa_mtc['mensaje_normativo']} {normativa_mtc['regimen_puno'].get('mensaje_puno', '')}"
            })
        elif normativa_mtc.get("dictamen_final") == "LIMITE_EXCEDIDO":
            alertas.append({
                "tipo": "PELIGRO",
                "titulo": "Vida Útil Excedida (RNAT)",
                "descripcion": normativa_mtc["mensaje_normativo"]
            })
        elif normativa_mtc.get("dictamen_final") == "PROXIMO_A_VENCER":
            alertas.append({
                "tipo": "INFO",
                "titulo": "Próximo al Límite de Permanencia",
                "descripcion": normativa_mtc["mensaje_normativo"]
            })

        # 7. Obtener resoluciones asociadas y vigencia de resolución primigenia
        nros_primigenias = list(set(f.get("nro_resolucion_primigenia") for f in flota_records if f.get("nro_resolucion_primigenia")))
        nros_hijas = list(set(f.get("nro_resolucion_hija") for f in flota_records if f.get("nro_resolucion_hija")))

        # Generar variantes de búsqueda para resoluciones (con y sin prefijo 'R-')
        todas_prim_variantes = set()
        for np in nros_primigenias:
            if np:
                todas_prim_variantes.add(np)
                todas_prim_variantes.add(np.replace("R-", "").strip())
                if not np.startswith("R-"):
                    todas_prim_variantes.add(f"R-{np}")

        todas_hijas_variantes = set()
        for nh in nros_hijas:
            if nh:
                todas_hijas_variantes.add(nh)
                todas_hijas_variantes.add(nh.replace("R-", "").strip())

        resoluciones_dict = {}
        resolucion_primigenia_info = None

        if todas_prim_variantes:
            docs_prim = await self.col_res_prim.find({"nro_resolucion": {"$in": list(todas_prim_variantes)}}).to_list(50)
            for dp in docs_prim:
                nro_res = dp.get("nro_resolucion")
                f_ini = str(dp.get("fecha_inicio_vigencia"))[:10] if dp.get("fecha_inicio_vigencia") else None
                f_fin = str(dp.get("fecha_fin_vigencia"))[:10] if dp.get("fecha_fin_vigencia") else None
                f_res = str(dp.get("fecha_resolucion"))[:10] if dp.get("fecha_resolucion") else None
                
                # Calcular días restantes de vigencia de la concesión
                dias_restantes = None
                estado_vigencia = dp.get("estado", "VIGENTE")
                if dp.get("fecha_fin_vigencia"):
                    try:
                        raw_fin = dp["fecha_fin_vigencia"]
                        fin_date = raw_fin if isinstance(raw_fin, datetime) else datetime.fromisoformat(str(raw_fin)[:10])
                        dias_restantes = (fin_date.date() - datetime.now().date()).days
                        if dias_restantes < 0:
                            estado_vigencia = "VENCIDA"
                        elif dias_restantes <= 180:
                            estado_vigencia = "POR_VENCER"
                        else:
                            estado_vigencia = "VIGENTE"
                    except Exception:
                        pass

                info_res = {
                    "tipo": "PRIMIGENIA",
                    "nro_resolucion": nro_res,
                    "fecha_resolucion": f_res,
                    "fecha_inicio_vigencia": f_ini,
                    "fecha_fin_vigencia": f_fin,
                    "anios_vigencia": dp.get("anios_vigencia"),
                    "dias_restantes": dias_restantes,
                    "estado_vigencia": estado_vigencia,
                    "tipo_autorizacion": dp.get("tipo_autorizacion") or "CONCESION",
                    "tiene_eficacia_anticipada": dp.get("tiene_eficacia_anticipada", False),
                    "link_documento": dp.get("link_documento"),
                    "descripcion": dp.get("descripcion_servicio") or f"Resolución Primigenia de Concesión / Renovación ({nro_res})"
                }
                resoluciones_dict[nro_res] = info_res

                # Asociar como primigenia activa si coincide con el registro actual
                nro_prim_activa = registro_activo.get("nro_resolucion_primigenia") if registro_activo else None
                if nro_prim_activa and (nro_res == nro_prim_activa or nro_res.replace("R-", "") == nro_prim_activa.replace("R-", "")):
                    resolucion_primigenia_info = info_res

        # Fallback de búsqueda de resolución primigenia por RUC de empresa
        if not resolucion_primigenia_info and registro_activo and registro_activo.get("ruc"):
            doc_prim_ruc = await self.col_res_prim.find_one({"ruc_empresa": registro_activo.get("ruc")})
            if doc_prim_ruc:
                nro_res = doc_prim_ruc.get("nro_resolucion")
                f_ini = str(doc_prim_ruc.get("fecha_inicio_vigencia"))[:10] if doc_prim_ruc.get("fecha_inicio_vigencia") else None
                f_fin = str(doc_prim_ruc.get("fecha_fin_vigencia"))[:10] if doc_prim_ruc.get("fecha_fin_vigencia") else None
                f_res = str(doc_prim_ruc.get("fecha_resolucion"))[:10] if doc_prim_ruc.get("fecha_resolucion") else None
                
                dias_restantes = None
                estado_vigencia = doc_prim_ruc.get("estado", "VIGENTE")
                if doc_prim_ruc.get("fecha_fin_vigencia"):
                    try:
                        raw_fin = doc_prim_ruc["fecha_fin_vigencia"]
                        fin_date = raw_fin if isinstance(raw_fin, datetime) else datetime.fromisoformat(str(raw_fin)[:10])
                        dias_restantes = (fin_date.date() - datetime.now().date()).days
                        if dias_restantes < 0:
                            estado_vigencia = "VENCIDA"
                        elif dias_restantes <= 180:
                            estado_vigencia = "POR_VENCER"
                        else:
                            estado_vigencia = "VIGENTE"
                    except Exception:
                        pass

                resolucion_primigenia_info = {
                    "tipo": "PRIMIGENIA",
                    "nro_resolucion": nro_res,
                    "fecha_resolucion": f_res,
                    "fecha_inicio_vigencia": f_ini,
                    "fecha_fin_vigencia": f_fin,
                    "anios_vigencia": doc_prim_ruc.get("anios_vigencia"),
                    "dias_restantes": dias_restantes,
                    "estado_vigencia": estado_vigencia,
                    "tipo_autorizacion": doc_prim_ruc.get("tipo_autorizacion") or "CONCESION",
                    "tiene_eficacia_anticipada": doc_prim_ruc.get("tiene_eficacia_anticipada", False),
                    "link_documento": doc_prim_ruc.get("link_documento"),
                    "descripcion": doc_prim_ruc.get("descripcion_servicio") or f"Resolución Primigenia de Concesión ({nro_res})"
                }
                resoluciones_dict[nro_res] = resolucion_primigenia_info

        # Resoluciones Hijas
        if todas_hijas_variantes:
            docs_hijas = await self.col_res_hijas.find({"nro_resolucion": {"$in": list(todas_hijas_variantes)}}).to_list(50)
            for dh in docs_hijas:
                resoluciones_dict[dh["nro_resolucion"]] = {
                    "tipo": "HIJA",
                    "nro_resolucion": dh.get("nro_resolucion"),
                    "tipo_tramite": dh.get("tipo_tramite") or dh.get("tipo_resolucion_hija"),
                    "fecha_emision": str(dh.get("fecha_resolucion_hija")) if dh.get("fecha_resolucion_hija") else None,
                    "num_expediente": dh.get("num_expediente"),
                    "estado": dh.get("estado", "APROBADA"),
                    "descripcion": dh.get("descripcion") or f"Resolución de trámite ({dh.get('tipo_tramite', 'Hija')})"
                }

        # 7.2 Detalle Completo de Rutas Autorizadas (db.rutas)
        rutas_codigos = registro_activo.get("rutas", []) if registro_activo else []
        codigos_asignados_set = set()
        for c in rutas_codigos:
            if c:
                codigos_asignados_set.add(str(c).strip())
                codigos_asignados_set.add(str(c).strip().lstrip("0") or "0")
                if len(str(c).strip()) == 1:
                    codigos_asignados_set.add(f"0{str(c).strip()}")

        # Prioridad 1: Buscar rutas que pertenezcan estrictamente a la resolución de concesión del vehículo
        rutas_docs = []
        if todas_prim_variantes:
            rutas_docs = await self.col_rutas.find({
                "resolucion.nroResolucion": {"$in": list(todas_prim_variantes)}
            }).to_list(50)

        # Prioridad 2: Fallback si no se hallaron por resolución, buscar por RUC de la empresa
        if not rutas_docs and registro_activo and registro_activo.get("ruc"):
            rutas_docs = await self.col_rutas.find({
                "empresa.ruc": registro_activo.get("ruc")
            }).to_list(50)

        # Filtrar por los códigos de ruta asignados a esta unidad específica (evitar rutas de otras resoluciones o flota)
        if codigos_asignados_set and rutas_docs:
            rutas_filtradas = []
            for r in rutas_docs:
                c_ruta = str(r.get("codigoRuta") or "").strip()
                c_clean = c_ruta.lstrip("0") or "0"
                if c_ruta in codigos_asignados_set or c_clean in codigos_asignados_set:
                    rutas_filtradas.append(r)
            if rutas_filtradas:
                rutas_docs = rutas_filtradas

        rutas_encontradas = []
        for r in rutas_docs:
            origen_obj = r.get("origen") or {}
            destino_obj = r.get("destino") or {}
            origen_nom = origen_obj.get("nombre") if isinstance(origen_obj, dict) else str(origen_obj or "Puno")
            origen_dep = origen_obj.get("departamento", "PUNO") if isinstance(origen_obj, dict) else "PUNO"
            destino_nom = destino_obj.get("nombre") if isinstance(destino_obj, dict) else str(destino_obj or "Destino")
            destino_dep = destino_obj.get("departamento", "PUNO") if isinstance(destino_obj, dict) else "PUNO"

            itin_list = []
            if isinstance(r.get("itinerario"), list):
                for it in r["itinerario"]:
                    if isinstance(it, dict) and it.get("nombre"):
                        itin_list.append(it["nombre"])
                    elif isinstance(it, str):
                        itin_list.append(it)

            frec = r.get("frecuencia") or {}
            frec_desc = frec.get("descripcion") if isinstance(frec, dict) else str(frec or "07 DIARIAS")

            rutas_encontradas.append({
                "codigo_ruta": r.get("codigoRuta") or "01",
                "nombre_ruta": r.get("nombre") or f"{origen_nom} - {destino_nom}",
                "origen": origen_nom,
                "origen_departamento": origen_dep,
                "destino": destino_nom,
                "destino_departamento": destino_dep,
                "itinerario": itin_list,
                "frecuencia": frec_desc,
                "tipo_servicio": r.get("tipoServicio", "PASAJEROS"),
                "tipo_ruta": r.get("tipoRuta", "INTERPROVINCIAL"),
                "estado": r.get("estado", "ACTIVA"),
                "resolucion": r.get("resolucion", {}).get("nroResolucion") if isinstance(r.get("resolucion"), dict) else str(r.get("resolucion") or ""),
                "capacidad_vehiculos": r.get("cantidadVehiculos") or r.get("capacidadMaxima"),
                "distancia_km": r.get("distancia"),
                "tiempo_estimado": r.get("tiempoEstimado")
            })

        # Generar tarjeta detallada para los códigos asignados que no tengan ficha específica en db.rutas
        codigos_encontrados = set()
        for r in rutas_encontradas:
            codigos_encontrados.add(str(r["codigo_ruta"]).strip())
            codigos_encontrados.add(str(r["codigo_ruta"]).strip().lstrip("0") or "0")

        for c in rutas_codigos:
            c_str = str(c).strip()
            c_clean = c_str.lstrip("0") or "0"
            if c_str not in codigos_encontrados and c_clean not in codigos_encontrados:
                rutas_encontradas.append({
                    "codigo_ruta": c,
                    "nombre_ruta": f"Ruta {c} • Concesión {registro_activo.get('nro_resolucion_primigenia') or 'Regional'}",
                    "origen": "Ámbito Regional",
                    "origen_departamento": "PUNO",
                    "destino": "Ámbito Regional",
                    "destino_departamento": "PUNO",
                    "itinerario": [],
                    "frecuencia": "Salidas regulares según itinerario de concesión",
                    "tipo_servicio": "PASAJEROS",
                    "tipo_ruta": "INTERPROVINCIAL",
                    "estado": "AUTORIZADA",
                    "resolucion": registro_activo.get("nro_resolucion_primigenia") or "",
                    "capacidad_vehiculos": None,
                    "distancia_km": None,
                    "tiempo_estimado": None
                })

        # Reconfirmación de modalidad: si tiene rutas regulares de pasajeros asignadas,
        # prevalece categóricamente la modalidad REGULAR (Franja Naranja)
        tiene_rutas_pasajeros = any(
            r.get("tipo_servicio") == "PASAJEROS" or "PASAJER" in str(r.get("tipo_servicio", "")).upper()
            for r in rutas_encontradas
        )
        if tiene_rutas_pasajeros:
            modalidad_placa = {
                "codigo": "REGULAR",
                "nombre": "Transporte Regular de Pasajeros",
                "color_franja": "#ea580c",
                "color_texto": "#ffffff",
                "color_nombre": "Naranja",
                "normativa_referencia": "Reglamento de Placa Única Nacional de Rodaje (D.S. 017-2008-MTC)"
            }

        # 7.3 Evaluación Cruzada: Régimen de Permanencia vs. Vigencia de la Resolución Primigenia
        anio_actual = datetime.now().year
        anio_retiro = None
        norma_permanencia = normativa_mtc.get("norma_aplicable", "RENAT")
        if normativa_mtc.get("regimen_puno", {}).get("aplica_cronograma_puno"):
            anio_retiro = normativa_mtc["regimen_puno"].get("fecha_retiro_puno")
            norma_permanencia = "R.M. N.° 585-2021-MTC/01 (Puno)"
        elif normativa_mtc.get("anio_limite_salida_rnat"):
            anio_retiro = normativa_mtc.get("anio_limite_salida_rnat")
            norma_permanencia = "RENAT (D.S. N.° 017-2009-MTC)"

        eval_perm_res = {
            "es_compatible": True,
            "tipo_evaluacion": "COMPATIBLE",
            "anio_retiro_vehiculo": anio_retiro,
            "fecha_fin_concesion": resolucion_primigenia_info.get("fecha_fin_vigencia") if resolucion_primigenia_info else None,
            "dias_restantes_concesion": resolucion_primigenia_info.get("dias_restantes") if resolucion_primigenia_info else None,
            "mensaje": "",
            "badge_color": "green"
        }

        nro_res_matriz = resolucion_primigenia_info.get("nro_resolucion") if resolucion_primigenia_info else (registro_activo.get("nro_resolucion_primigenia") if registro_activo else "Concesión")
        f_fin_concesion = resolucion_primigenia_info.get("fecha_fin_vigencia") if resolucion_primigenia_info else None

        if anio_retiro and anio_retiro < anio_actual:
            eval_perm_res["es_compatible"] = False
            eval_perm_res["tipo_evaluacion"] = "RETIRO_VENCIDO"
            eval_perm_res["badge_color"] = "red"
            eval_perm_res["mensaje"] = f"CRÍTICO: El vehículo superó su régimen de permanencia vehicular (Retiro cumplido el 31/12/{anio_retiro} bajo {norma_permanencia}). No puede continuar operando en las rutas de la resolución {nro_res_matriz} y debe ser sustituido de inmediato."
            alertas.insert(0, {
                "tipo": "PELIGRO",
                "titulo": "Régimen de Permanencia Vencido para la Concesión",
                "descripcion": eval_perm_res["mensaje"]
            })
        elif f_fin_concesion and anio_retiro:
            try:
                anio_fin_res = int(f_fin_concesion[:4])
                if anio_retiro < anio_fin_res:
                    eval_perm_res["es_compatible"] = False
                    eval_perm_res["tipo_evaluacion"] = "RETIRO_PREVIO_A_CONCESION"
                    eval_perm_res["badge_color"] = "amber"
                    eval_perm_res["mensaje"] = f"ADVERTENCIA DE PERMANENCIA: La resolución primigenia ({nro_res_matriz}) está autorizada hasta el {f_fin_concesion}, pero el vehículo tiene fecha límite improrrogable de retiro el 31/12/{anio_retiro} ({norma_permanencia}). La unidad no alcanzará a completar la vigencia de la concesión y deberá ser sustituida antes de dicha fecha."
                    alertas.insert(0, {
                        "tipo": "ADVERTENCIA",
                        "titulo": "Incompatibilidad de Permanencia vs. Concesión Matriz",
                        "descripcion": eval_perm_res["mensaje"]
                    })
                else:
                    eval_perm_res["es_compatible"] = True
                    eval_perm_res["tipo_evaluacion"] = "COMPATIBLE"
                    eval_perm_res["badge_color"] = "green"
                    eval_perm_res["mensaje"] = f"CONFORME: El vehículo cuenta con permanencia vigente hasta el 31/12/{anio_retiro} ({norma_permanencia}), cubriendo plenamente la vigencia de la resolución matriz ({nro_res_matriz}) hasta el {f_fin_concesion}."
            except Exception:
                pass
        else:
            eval_perm_res["mensaje"] = f"El vehículo cuenta con permanencia vigente bajo {norma_permanencia} hasta el 31/12/{anio_retiro or '2030'}."

        if resolucion_primigenia_info and resolucion_primigenia_info.get("dias_restantes") is not None and resolucion_primigenia_info["dias_restantes"] < 0:
            alertas.append({
                "tipo": "ADVERTENCIA",
                "titulo": "Resolución Primigenia Vencida",
                "descripcion": f"La resolución de concesión matriz ({nro_res_matriz}) venció el {f_fin_concesion}. Verifique si la empresa operadora cuenta con trámite de renovación de autorización de ruta."
            })

        # 8. Analizar TUCs y estado actual de TUC
        lista_tucs = []
        tuc_actual = None
        for t in tucs_records:
            tuc_item = {
                "id": str(t.get("_id")),
                "numero_tuc": t.get("numero_tuc") or (registro_activo.get("numero_tuc") if registro_activo else None),
                "estado": t.get("estado", "VIGENTE"),
                "fecha_emision": str(t.get("fecha_emision")) if t.get("fecha_emision") else None,
                "fecha_vencimiento": str(t.get("fecha_vencimiento")) if t.get("fecha_vencimiento") else None,
                "resolucion": t.get("resolucion_autorizacion") or (registro_activo.get("nro_resolucion_primigenia") if registro_activo else None),
                "link_documento": t.get("link_documento") or (registro_activo.get("link_tuc") if registro_activo else None),
                "qr_hash": t.get("codigo_seguridad_qr") or t.get("qr_hash")
            }
            lista_tucs.append(tuc_item)
            if not tuc_actual and t.get("estado") == "VIGENTE":
                tuc_actual = tuc_item

        # Si no hubo TUC en colección tucs pero sí en flota_empresa
        if not tuc_actual and registro_activo and registro_activo.get("numero_tuc"):
            tuc_actual = {
                "numero_tuc": registro_activo.get("numero_tuc"),
                "estado": "REGISTRADA" if registro_activo.get("estado") == "HABILITADO" else "INACTIVA",
                "fecha_emision": None,
                "fecha_vencimiento": None,
                "resolucion": registro_activo.get("nro_resolucion_primigenia"),
                "link_documento": registro_activo.get("link_tuc")
            }

        # 9. Construir la Línea de Tiempo Histórica (Timeline de Trámites 360°)
        timeline = []

        # Agregar eventos desde flota_empresa
        for f in flota_records:
            empresa_nombre = f.get("razon_social") or "Empresa No Especificada"
            ruc = f.get("ruc")
            estado_reg = f.get("estado", "REGISTRO")
            prim = f.get("nro_resolucion_primigenia")
            hija = f.get("nro_resolucion_hija")
            tipo_hija = f.get("tipo_resolucion_hija")
            fecha_evento = f.get("fecha_resolucion_hija") or f.get("fecha_cronologica") or f.get("fecha_registro")

            tipo_desc = "Trámite Administrativo"
            if tipo_hija == "I":
                tipo_desc = "Incremento de Flota"
            elif tipo_hija == "S":
                tipo_desc = "Sustitución Vehicular"
            elif tipo_hija == "M":
                tipo_desc = "Modificación de Autorización"
            elif tipo_hija == "C":
                tipo_desc = "Cancelación / Baja"
            elif tipo_hija == "O":
                tipo_desc = "Otros Trámites"

            res_aplicable = hija or prim or "No especificada"

            timeline.append({
                "fecha": str(fecha_evento) if fecha_evento else "Fecha no registrada",
                "tipo_evento": "RESOLUCION" if (prim or hija) else "REGISTRO_FLOTA",
                "titulo": f"{tipo_desc} - {res_aplicable}",
                "empresa": empresa_nombre,
                "ruc": ruc,
                "resolucion": res_aplicable,
                "estado_resultado": estado_reg,
                "tuc_asociada": f.get("numero_tuc"),
                "rutas": f.get("rutas", []),
                "observaciones": [obs.get("texto") for obs in f.get("observaciones_historial", []) if obs.get("texto")]
            })

        # Agregar eventos de emisión de TUCs si tienen fecha
        for t in lista_tucs:
            if t.get("fecha_emision"):
                timeline.append({
                    "fecha": t["fecha_emision"],
                    "tipo_evento": "TUC_EMISION",
                    "titulo": f"Emisión de TUC N° {t.get('numero_tuc', 'S/N')}",
                    "empresa": registro_activo.get("razon_social") if registro_activo else "DRTC Puno",
                    "ruc": registro_activo.get("ruc") if registro_activo else "",
                    "resolucion": t.get("resolucion", "Autorización"),
                    "estado_resultado": t.get("estado"),
                    "tuc_asociada": t.get("numero_tuc"),
                    "rutas": [],
                    "observaciones": ["Emisión de Tarjeta Única de Circulación con código de verificación QR."]
                })

        # Ordenar timeline por fecha descendente
        timeline.sort(key=lambda x: str(x.get("fecha") or ""), reverse=True)

        # 10. Resumen de Empresas Históricas y Participación de Flota
        empresas_historicas = []
        empresas_vistas = set()
        for f in flota_records:
            ruc = f.get("ruc")
            if ruc and ruc not in empresas_vistas:
                empresas_vistas.add(ruc)
                
                # Determinar si es el operador actual activo
                es_actual = (
                    registro_activo and 
                    registro_activo.get("ruc") == ruc and 
                    (registro_activo.get("estado") == "HABILITADO" or f.get("estado") == "HABILITADO")
                )
                
                # Trámite o resolución asociada en este registro
                res_hija = f.get("nro_resolucion_hija")
                tipo_hija = f.get("tipo_resolucion_hija")
                tipo_tramite_desc = "Registro Inicial de Flota"
                if tipo_hija == "I":
                    tipo_tramite_desc = "Incremento de Flota"
                elif tipo_hija == "S":
                    tipo_tramite_desc = "Sustitución Vehicular"
                elif tipo_hija == "C":
                    tipo_tramite_desc = "Cancelación / Baja"
                elif tipo_hija == "M":
                    tipo_tramite_desc = "Modificación de Flota"

                obs_list = [obs.get("texto") for obs in f.get("observaciones_historial", []) if obs.get("texto")]

                empresas_historicas.append({
                    "ruc": ruc,
                    "razon_social": f.get("razon_social"),
                    "ultimo_estado": f.get("estado"),
                    "es_operador_actual": bool(es_actual),
                    "resolucion_primigenia": f.get("nro_resolucion_primigenia"),
                    "resolucion_tramite": res_hija,
                    "tipo_tramite": tipo_tramite_desc,
                    "rutas": f.get("rutas", []),
                    "numero_tuc": f.get("numero_tuc"),
                    "observaciones": obs_list
                })

        # Ordenar empresas históricas: operador actual primero, luego anteriores
        empresas_historicas.sort(key=lambda x: 0 if x.get("es_operador_actual") else 1)

        # Armar respuesta completa
        return {
            "placa": placa_oficial,
            "existe_en_base": True,
            "modalidad_placa": modalidad_placa,
            "situacion_actual": {
                "estado_habilitacion": registro_activo.get("estado", "NO_REGISTRADO") if registro_activo else "NO_REGISTRADO",
                "empresa_actual": registro_activo.get("razon_social") if registro_activo else "Sin empresa asignada",
                "ruc_empresa_actual": registro_activo.get("ruc") if registro_activo else None,
                "resolucion_primigenia": registro_activo.get("nro_resolucion_primigenia") if registro_activo else None,
                "resolucion_primigenia_info": resolucion_primigenia_info,
                "resolucion_hija": registro_activo.get("nro_resolucion_hija") if registro_activo else None,
                "tipo_resolucion_hija": registro_activo.get("tipo_resolucion_hija") if registro_activo else None,
                "rutas_autorizadas": rutas_codigos,
                "rutas_detalladas": rutas_encontradas,
                "evaluacion_permanencia_vs_resolucion": eval_perm_res,
                "tuc_actual": tuc_actual,
                "link_notificacion": registro_activo.get("link_notificacion") if registro_activo else None,
                "link_tuc": registro_activo.get("link_tuc") if registro_activo else None
            },
            "rutas_detalladas": rutas_encontradas,
            "resolucion_primigenia_info": resolucion_primigenia_info,
            "evaluacion_permanencia_vs_resolucion": eval_perm_res,
            "normativa_mtc": normativa_mtc,
            "datos_tecnicos": datos_tecnicos,
            "tucs": lista_tucs,
            "timeline_historial": timeline,
            "empresas_historicas": empresas_historicas,
            "resoluciones_detalles": resoluciones_dict,
            "alertas": alertas,
            "total_tramites_registrados": len(timeline),
            "total_empresas_participadas": len(empresas_historicas)
        }

    async def buscar_sugerencias(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Búsqueda predictiva de placas para autocompletado rápido, incluyendo empresas actuales e históricas"""
        clean = re.sub(r'[^A-Za-z0-9]', '', query.strip().upper())
        if not clean:
            return []

        # Buscar en flota_empresa
        regex = f"^{clean[:3]}-?{clean[3:]}"
        docs = await self.col_flota.find(
            {
                "placa": {"$regex": regex, "$options": "i"},
                "es_cronologico": False
            },
            {"placa": 1, "razon_social": 1, "estado": 1, "nro_resolucion_primigenia": 1, "nro_resolucion_hija": 1}
        ).limit(limit * 6).to_list(limit * 6)

        # Detectar la empresa HABILITADA (actual) para cada placa
        placas_habilitadas = {}
        for d in docs:
            p = d.get("placa")
            if not p or p == "-":
                continue
            if (d.get("estado") or "").upper() == "HABILITADO":
                placas_habilitadas[p] = d.get("razon_social")

        sugerencias_map = {}
        for d in docs:
            p = d.get("placa")
            if not p or p == "-":
                continue
            
            estado = (d.get("estado") or "REGISTRADO").upper()
            empresa = d.get("razon_social") or "Sin empresa asignada"
            key = f"{p}__{empresa}"

            if key not in sugerencias_map:
                empresa_act = placas_habilitadas.get(p)
                es_actual = (estado == "HABILITADO") or (empresa_act == empresa) or (empresa_act is None)
                
                sugerencias_map[key] = {
                    "placa": p,
                    "empresa": empresa,
                    "estado": estado,
                    "es_actual": es_actual,
                    "tipo_registro": "OPERADOR ACTUAL" if es_actual else "HISTORIAL ANTERIOR"
                }

        lista = list(sugerencias_map.values())
        clean_no_hyphen = clean.replace("-", "")
        # Ordenar: coincidencias exactas de placa primero, luego actual/habilitado
        lista.sort(key=lambda x: (
            0 if x["placa"].replace("-", "").startswith(clean_no_hyphen) else 1,
            0 if x.get("es_actual") else 1,
            0 if x.get("estado") == "HABILITADO" else 1,
            x["placa"]
        ))

        return lista[:limit]

    async def listar_resumen_vehiculos(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        estado: Optional[str] = None
    ) -> Dict[str, Any]:
        """Directorio general de vehículos paginado con cruce básico"""
        query: Dict[str, Any] = {"es_cronologico": False, "placa": {"$ne": "-"}}

        if estado and estado != "TODOS":
            query["estado"] = estado

        if search:
            clean = search.strip().upper()
            # Buscar también si coincide con marca o modelo en vehiculos_data
            tech_placas = await self.col_vehiculos_data.find(
                {"$or": [
                    {"marca": {"$regex": clean, "$options": "i"}},
                    {"modelo": {"$regex": clean, "$options": "i"}}
                ]},
                {"placa_actual": 1}
            ).limit(200).to_list(200)
            matched_placas = [tp["placa_actual"] for tp in tech_placas if tp.get("placa_actual")]

            or_clauses = [
                {"placa": {"$regex": clean, "$options": "i"}},
                {"razon_social": {"$regex": clean, "$options": "i"}},
                {"nro_resolucion_primigenia": {"$regex": clean, "$options": "i"}}
            ]
            if matched_placas:
                or_clauses.append({"placa": {"$in": matched_placas}})

            query["$or"] = or_clauses

        total = await self.col_flota.count_documents(query)
        items = await self.col_flota.find(query).skip(skip).limit(limit).to_list(limit)

        # Enriquecer con datos técnicos rápidos si existen
        placas = [item.get("placa") for item in items if item.get("placa")]
        tech_map = {}
        if placas:
            tech_docs = await self.col_vehiculos_data.find(
                {"placa_actual": {"$in": placas}},
                {"placa_actual": 1, "marca": 1, "modelo": 1, "anio_fabricacion": 1, "categoria": 1}
            ).to_list(len(placas))
            for td in tech_docs:
                tech_map[td["placa_actual"]] = td

        resumen_list = []
        anio_actual = datetime.now().year
        for item in items:
            p = item.get("placa")
            tech = tech_map.get(p)
            anio_fab = tech.get("anio_fabricacion") if tech else None
            antiguedad = (anio_actual - anio_fab) if anio_fab else None

            resumen_list.append({
                "placa": p,
                "razon_social": item.get("razon_social"),
                "ruc": item.get("ruc"),
                "estado": item.get("estado"),
                "nro_resolucion_primigenia": item.get("nro_resolucion_primigenia"),
                "numero_tuc": item.get("numero_tuc"),
                "marca": tech.get("marca") if tech else None,
                "modelo": tech.get("modelo") if tech else None,
                "anio_fabricacion": anio_fab,
                "antiguedad_anios": antiguedad,
                "categoria": tech.get("categoria") if tech else None
            })

        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "items": resumen_list
        }
