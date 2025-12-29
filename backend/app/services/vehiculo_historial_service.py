"""
Servicio para gestión del historial de vehículos
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from collections import defaultdict

from app.models.vehiculo_historial import (
    VehiculoHistorialCreate,
    VehiculoHistorialUpdate,
    VehiculoHistorialInDB,
    VehiculoHistorialFiltros,
    EstadisticasHistorial,
    ResumenHistorialVehiculo,
    TipoMovimientoHistorial,
    OperacionHistorialResponse
)
from app.utils.exceptions import (
    VehiculoHistorialNotFoundException,
    ValidationErrorException
)


class VehiculoHistorialService:
    """Servicio para operaciones CRUD del historial de vehículos"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["vehiculos_historial"]
        self.vehiculos_collection = db["vehiculos"]
        self.empresas_collection = db["empresas"]
        self.resoluciones_collection = db["resoluciones"]
    
    async def create_historial(self, historial_data: VehiculoHistorialCreate) -> VehiculoHistorialInDB:
        """Crear un nuevo registro de historial"""
        
        # Obtener datos del vehículo actual
        vehiculo = await self.vehiculos_collection.find_one({"_id": ObjectId(historial_data.vehiculo_id)})
        if not vehiculo:
            raise ValidationErrorException("vehiculo_id", "Vehículo no encontrado")
        
        # Obtener el siguiente número de historial para este vehículo
        ultimo_historial = await self.collection.find_one(
            {"vehiculo_id": historial_data.vehiculo_id},
            sort=[("numero_historial", -1)]
        )
        numero_historial = (ultimo_historial["numero_historial"] + 1) if ultimo_historial else 1
        
        # Marcar registros anteriores como no actuales
        await self.collection.update_many(
            {"vehiculo_id": historial_data.vehiculo_id},
            {"$set": {"es_registro_actual": False, "fecha_actualizacion": datetime.now()}}
        )
        
        # Preparar datos del historial
        historial_dict = historial_data.model_dump()
        historial_dict.update({
            "numero_historial": numero_historial,
            "fecha_movimiento": datetime.now(),
            "placa": vehiculo["placa"],
            "marca": vehiculo["marca"],
            "modelo": vehiculo["modelo"],
            "anio_fabricacion": vehiculo["anioFabricacion"],
            "categoria": vehiculo["categoria"],
            "datos_tecnicos": vehiculo.get("datosTecnicos", {}),
            "es_registro_actual": True,
            "fecha_creacion": datetime.now(),
            "esta_activo": True
        })
        
        # Insertar en MongoDB
        insert_result = await self.collection.insert_one(historial_dict)
        historial_id = str(insert_result.inserted_id)
        
        # Obtener el historial creado
        created_historial = await self.collection.find_one({"_id": insert_result.inserted_id})
        created_historial["id"] = str(created_historial.pop("_id"))
        
        return VehiculoHistorialInDB(**created_historial)
    
    async def get_historial(self, historial_id: str) -> Optional[VehiculoHistorialInDB]:
        """Obtener un registro de historial por ID"""
        try:
            historial = await self.collection.find_one({"_id": ObjectId(historial_id)})
            if historial:
                historial["id"] = str(historial.pop("_id"))
                return VehiculoHistorialInDB(**historial)
            return None
        except Exception:
            return None
    
    async def get_historial_vehiculo(self, vehiculo_id: str) -> List[VehiculoHistorialInDB]:
        """Obtener todo el historial de un vehículo específico"""
        cursor = self.collection.find(
            {"vehiculo_id": vehiculo_id, "esta_activo": True}
        ).sort("numero_historial", -1)
        
        historial = []
        async for registro in cursor:
            registro["id"] = str(registro.pop("_id"))
            historial.append(VehiculoHistorialInDB(**registro))
        
        return historial
    
    async def get_historial_con_filtros(
        self,
        filtros: VehiculoHistorialFiltros,
        skip: int = 0,
        limit: int = 100
    ) -> List[VehiculoHistorialInDB]:
        """Obtener historial con filtros"""
        
        query = {"esta_activo": True}
        
        if filtros.vehiculo_id:
            query["vehiculo_id"] = filtros.vehiculo_id
        
        if filtros.empresa_id:
            query["$or"] = [
                {"empresa_actual_id": filtros.empresa_id},
                {"empresa_anterior_id": filtros.empresa_id}
            ]
        
        if filtros.resolucion_id:
            query["$or"] = [
                {"resolucion_actual_id": filtros.resolucion_id},
                {"resolucion_anterior_id": filtros.resolucion_id}
            ]
        
        if filtros.tipo_movimiento:
            query["tipo_movimiento"] = filtros.tipo_movimiento
        
        if filtros.fecha_desde or filtros.fecha_hasta:
            fecha_query = {}
            if filtros.fecha_desde:
                fecha_query["$gte"] = filtros.fecha_desde
            if filtros.fecha_hasta:
                fecha_query["$lte"] = filtros.fecha_hasta
            query["fecha_movimiento"] = fecha_query
        
        if filtros.usuario_id:
            query["usuario_id"] = filtros.usuario_id
        
        if filtros.es_registro_actual is not None:
            query["es_registro_actual"] = filtros.es_registro_actual
        
        cursor = self.collection.find(query).sort("fecha_movimiento", -1).skip(skip).limit(limit)
        
        historial = []
        async for registro in cursor:
            registro["id"] = str(registro.pop("_id"))
            historial.append(VehiculoHistorialInDB(**registro))
        
        return historial
    
    async def update_historial(
        self,
        historial_id: str,
        historial_data: VehiculoHistorialUpdate
    ) -> Optional[VehiculoHistorialInDB]:
        """Actualizar un registro de historial"""
        
        # Verificar que existe
        existing = await self.get_historial(historial_id)
        if not existing:
            raise VehiculoHistorialNotFoundException(historial_id)
        
        # Preparar datos de actualización
        update_data = historial_data.model_dump(exclude_unset=True)
        update_data["fecha_actualizacion"] = datetime.now()
        
        # Actualizar en MongoDB
        await self.collection.update_one(
            {"_id": ObjectId(historial_id)},
            {"$set": update_data}
        )
        
        # Obtener el historial actualizado
        return await self.get_historial(historial_id)
    
    async def delete_historial(self, historial_id: str) -> bool:
        """Eliminar un registro de historial (soft delete)"""
        
        # Verificar que existe
        existing = await self.get_historial(historial_id)
        if not existing:
            raise VehiculoHistorialNotFoundException(historial_id)
        
        # Soft delete
        await self.collection.update_one(
            {"_id": ObjectId(historial_id)},
            {"$set": {
                "esta_activo": False,
                "fecha_actualizacion": datetime.now()
            }}
        )
        
        return True
    
    async def registrar_movimiento_automatico(
        self,
        vehiculo_id: str,
        tipo_movimiento: TipoMovimientoHistorial,
        datos_anteriores: Dict[str, Any],
        datos_nuevos: Dict[str, Any],
        usuario_id: Optional[str] = None,
        motivo_cambio: Optional[str] = None
    ) -> VehiculoHistorialInDB:
        """Registrar automáticamente un movimiento en el historial"""
        
        historial_data = VehiculoHistorialCreate(
            vehiculo_id=vehiculo_id,
            tipo_movimiento=tipo_movimiento,
            empresa_anterior_id=datos_anteriores.get("empresaActualId"),
            empresa_actual_id=datos_nuevos.get("empresaActualId"),
            resolucion_anterior_id=datos_anteriores.get("resolucionId"),
            resolucion_actual_id=datos_nuevos.get("resolucionId"),
            estado_anterior=datos_anteriores.get("estado"),
            estado_actual=datos_nuevos.get("estado"),
            motivo_cambio=motivo_cambio,
            usuario_id=usuario_id
        )
        
        return await self.create_historial(historial_data)
    
    async def marcar_vehiculos_como_actuales(self) -> OperacionHistorialResponse:
        """Marcar todos los vehículos como registros actuales en el historial"""
        
        try:
            # Obtener todos los vehículos activos
            vehiculos = await self.vehiculos_collection.find({"estaActivo": True}).to_list(None)
            
            registros_procesados = 0
            registros_creados = 0
            errores = []
            
            for vehiculo in vehiculos:
                try:
                    vehiculo_id = str(vehiculo["_id"])
                    
                    # Verificar si ya tiene un registro actual
                    registro_actual = await self.collection.find_one({
                        "vehiculo_id": vehiculo_id,
                        "es_registro_actual": True
                    })
                    
                    if not registro_actual:
                        # Crear registro inicial
                        historial_data = VehiculoHistorialCreate(
                            vehiculo_id=vehiculo_id,
                            tipo_movimiento=TipoMovimientoHistorial.REGISTRO_INICIAL,
                            empresa_actual_id=vehiculo["empresaActualId"],
                            resolucion_actual_id=vehiculo.get("resolucionId"),
                            estado_actual=vehiculo["estado"],
                            motivo_cambio="Marcado como registro actual del sistema"
                        )
                        
                        await self.create_historial(historial_data)
                        registros_creados += 1
                    
                    registros_procesados += 1
                    
                except Exception as e:
                    errores.append(f"Error procesando vehículo {vehiculo.get('placa', 'N/A')}: {str(e)}")
            
            return OperacionHistorialResponse(
                success=True,
                message=f"Procesados {registros_procesados} vehículos, creados {registros_creados} registros",
                registros_procesados=registros_procesados,
                registros_creados=registros_creados,
                errores=errores
            )
            
        except Exception as e:
            return OperacionHistorialResponse(
                success=False,
                message=f"Error en la operación: {str(e)}",
                errores=[str(e)]
            )
    
    async def actualizar_historial_todos(self) -> OperacionHistorialResponse:
        """Actualizar números de historial de todos los vehículos"""
        
        try:
            # Obtener todos los vehículos únicos con historial
            vehiculos_con_historial = await self.collection.distinct("vehiculo_id")
            
            registros_procesados = 0
            registros_actualizados = 0
            errores = []
            
            for vehiculo_id in vehiculos_con_historial:
                try:
                    # Obtener todos los registros del vehículo ordenados por fecha
                    registros = await self.collection.find(
                        {"vehiculo_id": vehiculo_id, "esta_activo": True}
                    ).sort("fecha_movimiento", 1).to_list(None)
                    
                    # Actualizar números de historial secuenciales
                    for i, registro in enumerate(registros, 1):
                        await self.collection.update_one(
                            {"_id": registro["_id"]},
                            {"$set": {
                                "numero_historial": i,
                                "es_registro_actual": i == len(registros),
                                "fecha_actualizacion": datetime.now()
                            }}
                        )
                        registros_actualizados += 1
                    
                    registros_procesados += 1
                    
                except Exception as e:
                    errores.append(f"Error procesando vehículo {vehiculo_id}: {str(e)}")
            
            return OperacionHistorialResponse(
                success=True,
                message=f"Actualizados {registros_actualizados} registros de {registros_procesados} vehículos",
                registros_procesados=registros_procesados,
                registros_actualizados=registros_actualizados,
                errores=errores
            )
            
        except Exception as e:
            return OperacionHistorialResponse(
                success=False,
                message=f"Error en la operación: {str(e)}",
                errores=[str(e)]
            )
    
    async def get_estadisticas(self) -> EstadisticasHistorial:
        """Obtener estadísticas del historial"""
        
        # Total de registros
        total_registros = await self.collection.count_documents({"esta_activo": True})
        
        # Vehículos con historial
        vehiculos_con_historial = len(await self.collection.distinct("vehiculo_id", {"esta_activo": True}))
        
        # Movimientos por tipo
        pipeline_tipo = [
            {"$match": {"esta_activo": True}},
            {"$group": {"_id": "$tipo_movimiento", "count": {"$sum": 1}}}
        ]
        movimientos_tipo = await self.collection.aggregate(pipeline_tipo).to_list(None)
        movimientos_por_tipo = {item["_id"]: item["count"] for item in movimientos_tipo}
        
        # Movimientos por mes (últimos 12 meses)
        fecha_limite = datetime.now() - timedelta(days=365)
        pipeline_mes = [
            {"$match": {"esta_activo": True, "fecha_movimiento": {"$gte": fecha_limite}}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$fecha_movimiento"},
                    "month": {"$month": "$fecha_movimiento"}
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        movimientos_mes = await self.collection.aggregate(pipeline_mes).to_list(None)
        movimientos_por_mes = [
            {
                "mes": f"{item['_id']['year']}-{item['_id']['month']:02d}",
                "cantidad": item["count"]
            }
            for item in movimientos_mes
        ]
        
        # Empresas con más movimientos
        pipeline_empresa = [
            {"$match": {"esta_activo": True}},
            {"$group": {"_id": "$empresa_actual_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        empresas_movimientos = await self.collection.aggregate(pipeline_empresa).to_list(None)
        empresas_con_mas_movimientos = [
            {"empresaId": item["_id"], "cantidad": item["count"]}
            for item in empresas_movimientos
        ]
        
        return EstadisticasHistorial(
            total_registros=total_registros,
            vehiculos_con_historial=vehiculos_con_historial,
            movimientos_por_tipo=movimientos_por_tipo,
            movimientos_por_mes=movimientos_por_mes,
            empresas_con_mas_movimientos=empresas_con_mas_movimientos,
            ultima_actualizacion=datetime.now()
        )
    
    async def get_resumen_vehiculos(self) -> List[ResumenHistorialVehiculo]:
        """Obtener resumen del historial por vehículo"""
        
        pipeline = [
            {"$match": {"esta_activo": True}},
            {"$group": {
                "_id": "$vehiculo_id",
                "placa": {"$first": "$placa"},
                "total_movimientos": {"$sum": 1},
                "primer_registro": {"$min": "$fecha_movimiento"},
                "ultimo_movimiento": {"$max": "$fecha_movimiento"},
                "empresas_historicas": {"$addToSet": "$empresa_actual_id"},
                "resoluciones_historicas": {"$addToSet": "$resolucion_actual_id"},
                "estados_historicos": {"$addToSet": "$estado_actual"},
                "es_actual": {"$max": "$es_registro_actual"}
            }},
            {"$sort": {"ultimo_movimiento": -1}}
        ]
        
        resultados = await self.collection.aggregate(pipeline).to_list(None)
        
        resumen = []
        for item in resultados:
            resumen.append(ResumenHistorialVehiculo(
                vehiculo_id=item["_id"],
                placa=item["placa"],
                total_movimientos=item["total_movimientos"],
                primer_registro=item["primer_registro"],
                ultimo_movimiento=item["ultimo_movimiento"],
                empresas_historicas=[e for e in item["empresas_historicas"] if e],
                resoluciones_historicas=[r for r in item["resoluciones_historicas"] if r],
                estados_historicos=item["estados_historicos"],
                es_actual=item["es_actual"]
            ))
        
        return resumen