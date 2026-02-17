"""
Servicio de Infraestructura Complementaria
Lógica de negocio para gestión de infraestructuras
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.infraestructura import (
    Infraestructura,
    TipoInfraestructura,
    EstadoInfraestructura,
    DatosSunatInfraestructura,
    HistorialEstadoInfraestructura
)
from app.schemas.infraestructura import (
    InfraestructuraCreate,
    InfraestructuraUpdate,
    CambiarEstadoInfraestructura,
    InfraestructuraEstadisticas,
    FiltrosInfraestructura
)
import logging

logger = logging.getLogger(__name__)


class InfraestructuraService:
    """Servicio para gestión de infraestructuras"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.infraestructuras

    async def crear_infraestructura(
        self,
        infraestructura_data: InfraestructuraCreate,
        usuario_id: str
    ) -> Dict[str, Any]:
        """Crear nueva infraestructura"""
        try:
            # Verificar si el RUC ya existe
            existe = await self.collection.find_one({"ruc": infraestructura_data.ruc})
            if existe:
                raise ValueError(f"Ya existe una infraestructura con el RUC {infraestructura_data.ruc}")

            # Validar RUC con SUNAT (simulado por ahora)
            datos_sunat = await self._validar_ruc_sunat(infraestructura_data.ruc)

            # Crear infraestructura
            infraestructura = Infraestructura(
                **infraestructura_data.model_dump(),
                datos_sunat=datos_sunat,
                estado=EstadoInfraestructura.EN_TRAMITE,
                fecha_registro=datetime.now(),
                fecha_actualizacion=datetime.now(),
                ultima_validacion_sunat=datetime.now()
            )

            # Convertir a dict para MongoDB
            infraestructura_dict = infraestructura.model_dump(by_alias=True, exclude={"id"})
            
            # Insertar en la base de datos
            result = await self.collection.insert_one(infraestructura_dict)
            
            # Obtener el documento insertado
            infraestructura_creada = await self.collection.find_one({"_id": result.inserted_id})
            
            logger.info(f"✅ Infraestructura creada: {result.inserted_id}")
            return self._convertir_objectid(infraestructura_creada)

        except Exception as e:
            logger.error(f"❌ Error creando infraestructura: {str(e)}")
            raise

    async def obtener_infraestructura(self, infraestructura_id: str) -> Optional[Dict[str, Any]]:
        """Obtener infraestructura por ID"""
        try:
            infraestructura = await self.collection.find_one({"_id": ObjectId(infraestructura_id)})
            if infraestructura:
                return self._convertir_objectid(infraestructura)
            return None
        except Exception as e:
            logger.error(f"❌ Error obteniendo infraestructura: {str(e)}")
            raise

    async def listar_infraestructuras(
        self,
        pagina: int = 0,
        por_pagina: int = 50,
        filtros: Optional[FiltrosInfraestructura] = None
    ) -> Dict[str, Any]:
        """Listar infraestructuras con paginación y filtros"""
        try:
            # Construir query de filtros
            query = {}
            
            if filtros:
                if filtros.tipo_infraestructura:
                    query["tipo_infraestructura"] = {"$in": filtros.tipo_infraestructura}
                
                if filtros.estado:
                    query["estado"] = {"$in": filtros.estado}
                
                if filtros.capacidad_minima or filtros.capacidad_maxima:
                    capacidad_query = {}
                    if filtros.capacidad_minima:
                        capacidad_query["$gte"] = filtros.capacidad_minima
                    if filtros.capacidad_maxima:
                        capacidad_query["$lte"] = filtros.capacidad_maxima
                    query["especificaciones.capacidad_maxima"] = capacidad_query
                
                if filtros.fecha_registro_desde or filtros.fecha_registro_hasta:
                    fecha_query = {}
                    if filtros.fecha_registro_desde:
                        fecha_query["$gte"] = filtros.fecha_registro_desde
                    if filtros.fecha_registro_hasta:
                        fecha_query["$lte"] = filtros.fecha_registro_hasta
                    query["fecha_registro"] = fecha_query
                
                if filtros.score_riesgo_minimo or filtros.score_riesgo_maximo:
                    score_query = {}
                    if filtros.score_riesgo_minimo:
                        score_query["$gte"] = filtros.score_riesgo_minimo
                    if filtros.score_riesgo_maximo:
                        score_query["$lte"] = filtros.score_riesgo_maximo
                    query["score_riesgo"] = score_query
                
                if filtros.texto_busqueda:
                    query["$or"] = [
                        {"ruc": {"$regex": filtros.texto_busqueda, "$options": "i"}},
                        {"razon_social.principal": {"$regex": filtros.texto_busqueda, "$options": "i"}},
                        {"direccion_fiscal": {"$regex": filtros.texto_busqueda, "$options": "i"}}
                    ]

            # Contar total
            total = await self.collection.count_documents(query)
            
            # Obtener infraestructuras paginadas
            cursor = self.collection.find(query).skip(pagina * por_pagina).limit(por_pagina)
            infraestructuras = await cursor.to_list(length=por_pagina)
            
            # Convertir ObjectIds
            infraestructuras = [self._convertir_objectid(inf) for inf in infraestructuras]
            
            total_paginas = (total + por_pagina - 1) // por_pagina
            
            return {
                "infraestructuras": infraestructuras,
                "total": total,
                "pagina": pagina,
                "por_pagina": por_pagina,
                "total_paginas": total_paginas
            }

        except Exception as e:
            logger.error(f"❌ Error listando infraestructuras: {str(e)}")
            raise

    async def actualizar_infraestructura(
        self,
        infraestructura_id: str,
        infraestructura_data: InfraestructuraUpdate,
        usuario_id: str
    ) -> Optional[Dict[str, Any]]:
        """Actualizar infraestructura"""
        try:
            # Obtener infraestructura actual
            infraestructura_actual = await self.obtener_infraestructura(infraestructura_id)
            if not infraestructura_actual:
                return None

            # Preparar datos de actualización
            update_data = infraestructura_data.model_dump(exclude_unset=True)
            update_data["fecha_actualizacion"] = datetime.now()

            # Actualizar en la base de datos
            result = await self.collection.update_one(
                {"_id": ObjectId(infraestructura_id)},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                logger.info(f"✅ Infraestructura actualizada: {infraestructura_id}")
                return await self.obtener_infraestructura(infraestructura_id)
            
            return infraestructura_actual

        except Exception as e:
            logger.error(f"❌ Error actualizando infraestructura: {str(e)}")
            raise

    async def cambiar_estado(
        self,
        infraestructura_id: str,
        cambio_estado: CambiarEstadoInfraestructura,
        usuario_id: str
    ) -> Optional[Dict[str, Any]]:
        """Cambiar estado de infraestructura"""
        try:
            # Obtener infraestructura actual
            infraestructura = await self.obtener_infraestructura(infraestructura_id)
            if not infraestructura:
                return None

            estado_anterior = infraestructura["estado"]
            
            # Crear registro de historial
            historial = HistorialEstadoInfraestructura(
                fecha_cambio=datetime.now(),
                usuario_id=usuario_id,
                estado_anterior=EstadoInfraestructura(estado_anterior),
                estado_nuevo=cambio_estado.estado_nuevo,
                motivo=cambio_estado.motivo,
                tipo_documento_sustentatorio=cambio_estado.tipo_documento_sustentatorio,
                numero_documento_sustentatorio=cambio_estado.numero_documento_sustentatorio,
                es_documento_fisico=cambio_estado.es_documento_fisico,
                url_documento_sustentatorio=cambio_estado.url_documento_sustentatorio,
                fecha_documento=cambio_estado.fecha_documento,
                entidad_emisora=cambio_estado.entidad_emisora,
                observaciones=cambio_estado.observaciones
            )

            # Actualizar estado y agregar al historial
            result = await self.collection.update_one(
                {"_id": ObjectId(infraestructura_id)},
                {
                    "$set": {
                        "estado": cambio_estado.estado_nuevo.value,
                        "fecha_actualizacion": datetime.now()
                    },
                    "$push": {
                        "historial_estados": historial.model_dump()
                    }
                }
            )

            if result.modified_count > 0:
                logger.info(f"✅ Estado cambiado: {infraestructura_id} -> {cambio_estado.estado_nuevo}")
                return await self.obtener_infraestructura(infraestructura_id)
            
            return infraestructura

        except Exception as e:
            logger.error(f"❌ Error cambiando estado: {str(e)}")
            raise

    async def eliminar_infraestructura(self, infraestructura_id: str) -> bool:
        """Eliminar infraestructura (soft delete)"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(infraestructura_id)},
                {
                    "$set": {
                        "esta_activo": False,
                        "fecha_actualizacion": datetime.now()
                    }
                }
            )
            
            if result.modified_count > 0:
                logger.info(f"✅ Infraestructura eliminada (soft): {infraestructura_id}")
                return True
            
            return False

        except Exception as e:
            logger.error(f"❌ Error eliminando infraestructura: {str(e)}")
            raise

    async def obtener_estadisticas(self) -> InfraestructuraEstadisticas:
        """Obtener estadísticas de infraestructuras"""
        try:
            pipeline = [
                {
                    "$facet": {
                        "total": [{"$count": "count"}],
                        "por_estado": [
                            {"$group": {"_id": "$estado", "count": {"$sum": 1}}}
                        ],
                        "por_tipo": [
                            {"$group": {"_id": "$tipo_infraestructura", "count": {"$sum": 1}}}
                        ],
                        "capacidad": [
                            {
                                "$group": {
                                    "_id": None,
                                    "total": {"$sum": "$especificaciones.capacidad_maxima"},
                                    "promedio": {"$avg": "$especificaciones.capacidad_maxima"}
                                }
                            }
                        ]
                    }
                }
            ]

            result = await self.collection.aggregate(pipeline).to_list(length=1)
            
            if not result:
                return InfraestructuraEstadisticas(
                    total_infraestructuras=0,
                    autorizadas=0,
                    en_tramite=0,
                    suspendidas=0,
                    canceladas=0,
                    terminales_terrestre=0,
                    estaciones_ruta=0,
                    otros=0,
                    capacidad_total_instalada=0,
                    promedio_capacidad_por_infraestructura=0,
                    infraestructuras_con_documentos_vencidos=0,
                    infraestructuras_con_score_alto_riesgo=0
                )

            data = result[0]
            
            # Procesar resultados
            total = data["total"][0]["count"] if data["total"] else 0
            
            estados = {item["_id"]: item["count"] for item in data["por_estado"]}
            tipos = {item["_id"]: item["count"] for item in data["por_tipo"]}
            
            capacidad_data = data["capacidad"][0] if data["capacidad"] else {}
            
            return InfraestructuraEstadisticas(
                total_infraestructuras=total,
                autorizadas=estados.get("AUTORIZADA", 0),
                en_tramite=estados.get("EN_TRAMITE", 0),
                suspendidas=estados.get("SUSPENDIDA", 0),
                canceladas=estados.get("CANCELADA", 0),
                terminales_terrestre=tipos.get("TERMINAL_TERRESTRE", 0),
                estaciones_ruta=tipos.get("ESTACION_DE_RUTA", 0),
                otros=tipos.get("OTROS", 0),
                capacidad_total_instalada=int(capacidad_data.get("total", 0) or 0),
                promedio_capacidad_por_infraestructura=float(capacidad_data.get("promedio", 0) or 0),
                infraestructuras_con_documentos_vencidos=0,  # TODO: Implementar
                infraestructuras_con_score_alto_riesgo=0  # TODO: Implementar
            )

        except Exception as e:
            logger.error(f"❌ Error obteniendo estadísticas: {str(e)}")
            raise

    async def _validar_ruc_sunat(self, ruc: str) -> DatosSunatInfraestructura:
        """Validar RUC con SUNAT (simulado)"""
        # TODO: Implementar integración real con SUNAT
        return DatosSunatInfraestructura(
            valido=True,
            razon_social=f"Empresa con RUC {ruc}",
            estado="ACTIVO",
            condicion="HABIDO",
            fecha_actualizacion=datetime.now()
        )

    def _convertir_objectid(self, documento: Dict[str, Any]) -> Dict[str, Any]:
        """Convertir ObjectId a string"""
        if documento and "_id" in documento:
            documento["_id"] = str(documento["_id"])
        return documento
