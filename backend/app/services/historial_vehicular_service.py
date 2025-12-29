"""
Servicio para gestión del historial vehicular - Sistema de eventos
Compatible con el frontend HistorialVehicularComponent
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import math

from app.models.historial_vehicular import (
    HistorialVehicularCreate,
    HistorialVehicularUpdate,
    HistorialVehicularInDB,
    HistorialVehicularResponse,
    FiltrosHistorialVehicular,
    HistorialVehicularListResponse,
    ResumenHistorialVehicular,
    EstadisticasHistorialVehicular,
    TipoEventoHistorial,
    OperacionHistorialResponse,
    convert_to_frontend_format
)
from app.utils.exceptions import (
    ValidationErrorException,
    NotFoundError
)


class HistorialVehicularService:
    """Servicio para operaciones del historial vehicular basado en eventos"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["historial_vehicular"]
        self.vehiculos_collection = db["vehiculos"]
        self.empresas_collection = db["empresas"]
        self.resoluciones_collection = db["resoluciones"]
        self.usuarios_collection = db["usuarios"]
    
    async def crear_evento(self, evento_data: HistorialVehicularCreate) -> HistorialVehicularResponse:
        """Crear un nuevo evento en el historial vehicular"""
        
        # Verificar que el vehículo existe
        vehiculo = await self.vehiculos_collection.find_one({"_id": ObjectId(evento_data.vehiculoId)})
        if not vehiculo:
            raise ValidationErrorException("vehiculoId", "Vehículo no encontrado")
        
        # Preparar datos del evento
        evento_dict = evento_data.model_dump()
        evento_dict["fechaEvento"] = datetime.now()
        
        # Insertar en MongoDB
        insert_result = await self.collection.insert_one(evento_dict)
        
        # Obtener el evento creado
        created_evento = await self.collection.find_one({"_id": insert_result.inserted_id})
        created_evento = convert_to_frontend_format(created_evento)
        
        return HistorialVehicularResponse(**created_evento)
    
    async def obtener_evento(self, evento_id: str) -> Optional[HistorialVehicularResponse]:
        """Obtener un evento específico por ID"""
        try:
            evento = await self.collection.find_one({"_id": ObjectId(evento_id)})
            if evento:
                evento = convert_to_frontend_format(evento)
                return HistorialVehicularResponse(**evento)
            return None
        except Exception:
            return None
    
    async def obtener_historial_vehicular(
        self,
        filtros: FiltrosHistorialVehicular
    ) -> HistorialVehicularListResponse:
        """Obtener historial vehicular con filtros y paginación"""
        
        # Construir query de MongoDB
        query = {}
        
        if filtros.vehiculoId:
            query["vehiculoId"] = filtros.vehiculoId
        
        if filtros.placa:
            query["placa"] = {"$regex": filtros.placa, "$options": "i"}
        
        if filtros.tipoEvento:
            query["tipoEvento"] = {"$in": filtros.tipoEvento}
        
        if filtros.empresaId:
            query["empresaId"] = filtros.empresaId
        
        if filtros.resolucionId:
            query["resolucionId"] = filtros.resolucionId
        
        if filtros.usuarioId:
            query["usuarioId"] = filtros.usuarioId
        
        # Filtros de fecha
        if filtros.fechaDesde or filtros.fechaHasta:
            fecha_query = {}
            if filtros.fechaDesde:
                try:
                    fecha_desde = datetime.fromisoformat(filtros.fechaDesde.replace("Z", "+00:00"))
                    fecha_query["$gte"] = fecha_desde
                except:
                    pass
            if filtros.fechaHasta:
                try:
                    fecha_hasta = datetime.fromisoformat(filtros.fechaHasta.replace("Z", "+00:00"))
                    fecha_query["$lte"] = fecha_hasta
                except:
                    pass
            if fecha_query:
                query["fechaEvento"] = fecha_query
        
        # Contar total de documentos
        total = await self.collection.count_documents(query)
        
        # Calcular paginación
        skip = (filtros.page - 1) * filtros.limit
        total_pages = math.ceil(total / filtros.limit) if total > 0 else 1
        
        # Configurar ordenamiento
        sort_direction = -1 if filtros.sortOrder.lower() == "desc" else 1
        sort_field = filtros.sortBy
        
        # Ejecutar consulta con paginación
        cursor = self.collection.find(query).sort(sort_field, sort_direction).skip(skip).limit(filtros.limit)
        
        # Convertir resultados
        historial = []
        async for evento in cursor:
            evento = convert_to_frontend_format(evento)
            historial.append(HistorialVehicularResponse(**evento))
        
        return HistorialVehicularListResponse(
            historial=historial,
            total=total,
            page=filtros.page,
            limit=filtros.limit,
            totalPages=total_pages,
            hasNext=filtros.page < total_pages,
            hasPrev=filtros.page > 1
        )
    
    async def obtener_resumen_vehiculo(self, vehiculo_id: str) -> Optional[ResumenHistorialVehicular]:
        """Obtener resumen del historial de un vehículo específico"""
        
        # Verificar que el vehículo existe
        vehiculo = await self.vehiculos_collection.find_one({"_id": ObjectId(vehiculo_id)})
        if not vehiculo:
            return None
        
        # Obtener eventos del vehículo
        eventos = await self.collection.find({"vehiculoId": vehiculo_id}).sort("fechaEvento", 1).to_list(None)
        
        if not eventos:
            return None
        
        # Convertir eventos
        eventos_convertidos = []
        for evento in eventos:
            evento = convert_to_frontend_format(evento)
            eventos_convertidos.append(HistorialVehicularResponse(**evento))
        
        # Calcular estadísticas
        primer_evento = eventos_convertidos[0] if eventos_convertidos else None
        ultimo_evento = eventos_convertidos[-1] if eventos_convertidos else None
        
        # Empresas históricas únicas
        empresas_historicas = list(set([e.empresaId for e in eventos_convertidos if e.empresaId]))
        
        # Resoluciones históricas únicas
        resoluciones_historicas = list(set([e.resolucionId for e in eventos_convertidos if e.resolucionId]))
        
        # Eventos por tipo
        eventos_por_tipo = {}
        for evento in eventos_convertidos:
            tipo = evento.tipoEvento
            eventos_por_tipo[tipo] = eventos_por_tipo.get(tipo, 0) + 1
        
        return ResumenHistorialVehicular(
            vehiculoId=vehiculo_id,
            placa=vehiculo["placa"],
            totalEventos=len(eventos_convertidos),
            primerEvento=primer_evento,
            ultimoEvento=ultimo_evento,
            empresasHistoricas=empresas_historicas,
            resolucionesHistoricas=resoluciones_historicas,
            eventosPorTipo=eventos_por_tipo
        )
    
    async def actualizar_evento(
        self,
        evento_id: str,
        evento_data: HistorialVehicularUpdate
    ) -> Optional[HistorialVehicularResponse]:
        """Actualizar un evento del historial"""
        
        # Verificar que existe
        existing = await self.obtener_evento(evento_id)
        if not existing:
            raise NotFoundError("Evento de historial", evento_id)
        
        # Preparar datos de actualización
        update_data = evento_data.model_dump(exclude_unset=True)
        
        # Actualizar en MongoDB
        await self.collection.update_one(
            {"_id": ObjectId(evento_id)},
            {"$set": update_data}
        )
        
        # Obtener el evento actualizado
        return await self.obtener_evento(evento_id)
    
    async def eliminar_evento(self, evento_id: str) -> bool:
        """Eliminar un evento del historial"""
        
        # Verificar que existe
        existing = await self.obtener_evento(evento_id)
        if not existing:
            raise NotFoundError("Evento de historial", evento_id)
        
        # Eliminar de MongoDB
        result = await self.collection.delete_one({"_id": ObjectId(evento_id)})
        
        return result.deleted_count > 0
    
    async def registrar_evento_automatico(
        self,
        vehiculo_id: str,
        placa: str,
        tipo_evento: TipoEventoHistorial,
        descripcion: str,
        empresa_id: Optional[str] = None,
        resolucion_id: Optional[str] = None,
        usuario_id: Optional[str] = None,
        usuario_nombre: Optional[str] = None,
        observaciones: Optional[str] = None,
        datos_anteriores: Optional[Dict[str, Any]] = None,
        datos_nuevos: Optional[Dict[str, Any]] = None,
        metadatos: Optional[Dict[str, Any]] = None
    ) -> HistorialVehicularResponse:
        """Registrar automáticamente un evento en el historial"""
        
        evento_data = HistorialVehicularCreate(
            vehiculoId=vehiculo_id,
            placa=placa,
            tipoEvento=tipo_evento,
            descripcion=descripcion,
            empresaId=empresa_id,
            resolucionId=resolucion_id,
            usuarioId=usuario_id,
            usuarioNombre=usuario_nombre,
            observaciones=observaciones,
            datosAnteriores=datos_anteriores,
            datosNuevos=datos_nuevos,
            metadatos=metadatos or {
                "version": "1.0",
                "sistemaOrigen": "DRTC_PUNO",
                "generadoPor": "sistema_automatico"
            }
        )
        
        return await self.crear_evento(evento_data)
    
    async def exportar_historial(
        self,
        filtros: FiltrosHistorialVehicular,
        formato: str = "excel"
    ) -> bytes:
        """Exportar historial vehicular a Excel"""
        
        # Obtener todos los datos sin paginación
        filtros_export = filtros.model_copy()
        filtros_export.limit = 10000  # Límite alto para exportación
        
        response = await self.obtener_historial_vehicular(filtros_export)
        
        if formato.lower() == "excel":
            import pandas as pd
            from io import BytesIO
            
            # Convertir a DataFrame
            data = []
            for evento in response.historial:
                data.append({
                    "Fecha": evento.fechaEvento.strftime("%d/%m/%Y %H:%M:%S") if isinstance(evento.fechaEvento, datetime) else evento.fechaEvento,
                    "Placa": evento.placa,
                    "Tipo de Evento": evento.tipoEvento,
                    "Descripción": evento.descripcion,
                    "Usuario": evento.usuarioNombre or "Sistema",
                    "Observaciones": evento.observaciones or "",
                    "Empresa ID": evento.empresaId or "",
                    "Resolución ID": evento.resolucionId or ""
                })
            
            df = pd.DataFrame(data)
            
            # Crear archivo Excel en memoria
            output = BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Historial Vehicular', index=False)
            
            output.seek(0)
            return output.getvalue()
        
        else:
            raise ValidationErrorException("formato", "Formato no soportado")
    
    async def obtener_estadisticas(self) -> EstadisticasHistorialVehicular:
        """Obtener estadísticas generales del historial vehicular"""
        
        # Total de eventos
        total_eventos = await self.collection.count_documents({})
        
        # Vehículos con historial
        vehiculos_con_historial = len(await self.collection.distinct("vehiculoId"))
        
        # Eventos por tipo
        pipeline_tipo = [
            {"$group": {"_id": "$tipoEvento", "count": {"$sum": 1}}}
        ]
        eventos_tipo = await self.collection.aggregate(pipeline_tipo).to_list(None)
        eventos_por_tipo = {item["_id"]: item["count"] for item in eventos_tipo}
        
        # Eventos por mes (últimos 12 meses)
        fecha_limite = datetime.now() - timedelta(days=365)
        pipeline_mes = [
            {"$match": {"fechaEvento": {"$gte": fecha_limite}}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$fechaEvento"},
                    "month": {"$month": "$fechaEvento"}
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        eventos_mes = await self.collection.aggregate(pipeline_mes).to_list(None)
        eventos_por_mes = [
            {
                "mes": f"{item['_id']['year']}-{item['_id']['month']:02d}",
                "cantidad": item["count"]
            }
            for item in eventos_mes
        ]
        
        # Empresas con más eventos
        pipeline_empresa = [
            {"$match": {"empresaId": {"$ne": None}}},
            {"$group": {"_id": "$empresaId", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        empresas_eventos = await self.collection.aggregate(pipeline_empresa).to_list(None)
        empresas_con_mas_eventos = [
            {"empresaId": item["_id"], "cantidad": item["count"]}
            for item in empresas_eventos
        ]
        
        # Usuarios con más eventos
        pipeline_usuario = [
            {"$match": {"usuarioId": {"$ne": None}}},
            {"$group": {"_id": "$usuarioId", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        usuarios_eventos = await self.collection.aggregate(pipeline_usuario).to_list(None)
        usuarios_con_mas_eventos = [
            {"usuarioId": item["_id"], "cantidad": item["count"]}
            for item in usuarios_eventos
        ]
        
        return EstadisticasHistorialVehicular(
            totalEventos=total_eventos,
            vehiculosConHistorial=vehiculos_con_historial,
            eventosPorTipo=eventos_por_tipo,
            eventosPorMes=eventos_por_mes,
            empresasConMasEventos=empresas_con_mas_eventos,
            usuariosConMasEventos=usuarios_con_mas_eventos,
            ultimaActualizacion=datetime.now()
        )
    
    async def limpiar_cache(self) -> bool:
        """Limpiar cache del servicio (placeholder para futuras implementaciones)"""
        # Por ahora no hay cache, pero se puede implementar en el futuro
        return True
    
    async def migrar_datos_existentes(self) -> OperacionHistorialResponse:
        """Migrar datos existentes al nuevo formato de historial"""
        
        try:
            # Obtener todos los vehículos activos
            vehiculos = await self.vehiculos_collection.find({"estaActivo": True}).to_list(None)
            
            eventos_creados = 0
            errores = []
            
            for vehiculo in vehiculos:
                try:
                    vehiculo_id = str(vehiculo["_id"])
                    
                    # Verificar si ya tiene eventos
                    eventos_existentes = await self.collection.count_documents({"vehiculoId": vehiculo_id})
                    
                    if eventos_existentes == 0:
                        # Crear evento de creación inicial
                        await self.registrar_evento_automatico(
                            vehiculo_id=vehiculo_id,
                            placa=vehiculo["placa"],
                            tipo_evento=TipoEventoHistorial.CREACION,
                            descripcion="Vehículo registrado en el sistema",
                            empresa_id=vehiculo.get("empresaActualId"),
                            resolucion_id=vehiculo.get("resolucionId"),
                            usuario_id="sistema",
                            usuario_nombre="Sistema Automático",
                            observaciones="Evento creado durante migración de datos",
                            datos_nuevos={
                                "placa": vehiculo["placa"],
                                "marca": vehiculo.get("marca", ""),
                                "modelo": vehiculo.get("modelo", ""),
                                "estado": vehiculo.get("estado", "ACTIVO")
                            },
                            metadatos={
                                "version": "1.0",
                                "sistemaOrigen": "DRTC_PUNO",
                                "generadoPor": "migracion_automatica",
                                "fechaMigracion": datetime.now().isoformat()
                            }
                        )
                        eventos_creados += 1
                
                except Exception as e:
                    errores.append(f"Error procesando vehículo {vehiculo.get('placa', 'N/A')}: {str(e)}")
            
            return OperacionHistorialResponse(
                success=True,
                message=f"Migración completada: {eventos_creados} eventos creados",
                eventosCreados=eventos_creados,
                errores=errores
            )
            
        except Exception as e:
            return OperacionHistorialResponse(
                success=False,
                message=f"Error en la migración: {str(e)}",
                errores=[str(e)]
            )