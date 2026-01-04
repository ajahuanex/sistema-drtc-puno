from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.solicitud_baja import (
    SolicitudBaja, 
    SolicitudBajaCreate, 
    SolicitudBajaUpdate,
    SolicitudBajaFilter,
    EstadoSolicitudBaja,
    UsuarioInfo
)
from app.core.exceptions import NotFoundError, ValidationError

class SolicitudBajaService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.solicitudes_baja

    async def create_solicitud_baja(self, solicitud_data: SolicitudBajaCreate, usuario_actual: dict) -> SolicitudBaja:
        """Crear una nueva solicitud de baja"""
        
        # Verificar que el vehículo existe
        vehiculo = await self.db.vehiculos.find_one({"_id": ObjectId(solicitud_data.vehiculoId)})
        if not vehiculo:
            raise NotFoundError("Vehículo no encontrado")
        
        # Verificar que no existe una solicitud pendiente para este vehículo
        solicitud_existente = await self.collection.find_one({
            "vehiculoId": solicitud_data.vehiculoId,
            "estado": {"$in": [EstadoSolicitudBaja.PENDIENTE, EstadoSolicitudBaja.EN_REVISION]}
        })
        
        if solicitud_existente:
            raise ValidationError("Ya existe una solicitud de baja pendiente para este vehículo")
        
        # Obtener información de la empresa si está asignada
        empresa_info = None
        if vehiculo.get("empresaActualId"):
            empresa = await self.db.empresas.find_one({"_id": ObjectId(vehiculo["empresaActualId"])})
            if empresa:
                empresa_info = {
                    "empresaId": str(empresa["_id"]),
                    "empresaNombre": empresa.get("razonSocial", {}).get("principal", "")
                }
        
        # Crear la solicitud
        solicitud_dict = {
            "vehiculoId": solicitud_data.vehiculoId,
            "vehiculoPlaca": vehiculo.get("placa", ""),
            "motivo": solicitud_data.motivo,
            "descripcion": solicitud_data.descripcion,
            "fechaSolicitud": solicitud_data.fechaSolicitud,
            "estado": EstadoSolicitudBaja.PENDIENTE,
            "solicitadoPor": {
                "usuarioId": usuario_actual.get("id", "user-demo"),
                "nombreUsuario": usuario_actual.get("nombre", "Usuario Demo"),
                "email": usuario_actual.get("email", "usuario@transportespuno.gob.pe")
            },
            "fechaCreacion": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow()
        }
        
        # Agregar información de empresa si existe
        if empresa_info:
            solicitud_dict.update(empresa_info)
        
        # Insertar en la base de datos
        result = await self.collection.insert_one(solicitud_dict)
        solicitud_dict["_id"] = result.inserted_id
        
        # Convertir ObjectId a string para la respuesta
        solicitud_dict["id"] = str(solicitud_dict.pop("_id"))
        
        return SolicitudBaja(**solicitud_dict)

    async def get_solicitudes_baja(self, filtros: Optional[SolicitudBajaFilter] = None) -> List[SolicitudBaja]:
        """Obtener solicitudes de baja con filtros opcionales"""
        
        query = {}
        
        if filtros:
            if filtros.estado:
                query["estado"] = {"$in": filtros.estado}
            
            if filtros.motivo:
                query["motivo"] = {"$in": filtros.motivo}
            
            if filtros.fechaDesde or filtros.fechaHasta:
                fecha_query = {}
                if filtros.fechaDesde:
                    fecha_query["$gte"] = filtros.fechaDesde
                if filtros.fechaHasta:
                    fecha_query["$lte"] = filtros.fechaHasta
                query["fechaSolicitud"] = fecha_query
            
            if filtros.empresaId:
                query["empresaId"] = filtros.empresaId
            
            if filtros.vehiculoPlaca:
                query["vehiculoPlaca"] = {"$regex": filtros.vehiculoPlaca, "$options": "i"}
            
            if filtros.solicitadoPor:
                query["solicitadoPor.nombreUsuario"] = {"$regex": filtros.solicitadoPor, "$options": "i"}
        
        # Ordenar por fecha de solicitud descendente
        cursor = self.collection.find(query).sort("fechaSolicitud", -1)
        solicitudes = await cursor.to_list(length=None)
        
        # Convertir ObjectId a string
        for solicitud in solicitudes:
            solicitud["id"] = str(solicitud.pop("_id"))
        
        return [SolicitudBaja(**solicitud) for solicitud in solicitudes]

    async def get_solicitud_baja_by_id(self, solicitud_id: str) -> SolicitudBaja:
        """Obtener una solicitud de baja por ID"""
        
        try:
            object_id = ObjectId(solicitud_id)
        except:
            raise ValidationError("ID de solicitud inválido")
        
        solicitud = await self.collection.find_one({"_id": object_id})
        if not solicitud:
            raise NotFoundError("Solicitud de baja no encontrada")
        
        solicitud["id"] = str(solicitud.pop("_id"))
        return SolicitudBaja(**solicitud)

    async def update_solicitud_baja(self, solicitud_id: str, update_data: SolicitudBajaUpdate, usuario_actual: dict) -> SolicitudBaja:
        """Actualizar una solicitud de baja"""
        
        try:
            object_id = ObjectId(solicitud_id)
        except:
            raise ValidationError("ID de solicitud inválido")
        
        # Verificar que la solicitud existe
        solicitud_existente = await self.collection.find_one({"_id": object_id})
        if not solicitud_existente:
            raise NotFoundError("Solicitud de baja no encontrada")
        
        # Preparar datos de actualización
        update_dict = {"fechaActualizacion": datetime.utcnow()}
        
        if update_data.estado is not None:
            update_dict["estado"] = update_data.estado
        
        if update_data.observaciones is not None:
            update_dict["observaciones"] = update_data.observaciones
        
        if update_data.fechaRevision is not None:
            update_dict["fechaRevision"] = update_data.fechaRevision
        
        if update_data.fechaAprobacion is not None:
            update_dict["fechaAprobacion"] = update_data.fechaAprobacion
        
        if update_data.revisadoPor is not None:
            update_dict["revisadoPor"] = update_data.revisadoPor.dict()
        
        if update_data.aprobadoPor is not None:
            update_dict["aprobadoPor"] = update_data.aprobadoPor.dict()
        
        # Actualizar en la base de datos
        await self.collection.update_one(
            {"_id": object_id},
            {"$set": update_dict}
        )
        
        # Obtener la solicitud actualizada
        return await self.get_solicitud_baja_by_id(solicitud_id)

    async def aprobar_solicitud_baja(self, solicitud_id: str, usuario_actual: dict, observaciones: Optional[str] = None) -> SolicitudBaja:
        """Aprobar una solicitud de baja y actualizar el estado del vehículo"""
        
        # Primero obtener la solicitud para verificar que existe
        solicitud = await self.get_solicitud_baja_by_id(solicitud_id)
        
        # Actualizar la solicitud de baja
        update_data = SolicitudBajaUpdate(
            estado=EstadoSolicitudBaja.APROBADA,
            fechaAprobacion=datetime.utcnow(),
            observaciones=observaciones,
            aprobadoPor=UsuarioInfo(
                usuarioId=usuario_actual.get("id", "admin-demo"),
                nombreUsuario=usuario_actual.get("nombre", "Admin Demo"),
                email=usuario_actual.get("email", "admin@transportespuno.gob.pe")
            )
        )
        
        solicitud_actualizada = await self.update_solicitud_baja(solicitud_id, update_data, usuario_actual)
        
        # NUEVO: Actualizar el estado del vehículo según el tipo de baja
        try:
            vehiculo_id = ObjectId(solicitud.vehiculoId)
            
            # Determinar el estado según el motivo
            nuevo_estado = "BAJA_DEFINITIVA"  # Por defecto
            
            if solicitud.motivo in ["INCUMPLIMIENTO", "ROBO_HURTO"]:
                nuevo_estado = "BAJA_DE_OFICIO"
            elif solicitud.motivo in ["ACCIDENTE", "DETERIORO", "OBSOLESCENCIA"]:
                nuevo_estado = "BAJA_DEFINITIVA"
            else:
                nuevo_estado = "BAJA"  # Para otros casos como venta, cambio de flota
            
            await self.db.vehiculos.update_one(
                {"_id": vehiculo_id},
                {
                    "$set": {
                        "estado": nuevo_estado,  # Estado directo
                        "fechaBaja": datetime.utcnow(),
                        "motivoBaja": solicitud.motivo,
                        "observacionesBaja": observaciones or f"Baja aprobada mediante solicitud - Tipo: {nuevo_estado}",
                        "fechaActualizacion": datetime.utcnow()
                    }
                }
            )
            print(f"✅ Vehículo {solicitud.vehiculoPlaca} actualizado a estado {nuevo_estado}")
            
        except Exception as e:
            print(f"❌ Error actualizando estado del vehículo: {e}")
            # No fallar la aprobación de la solicitud por error en actualización del vehículo
            # pero registrar el error para seguimiento
        
        return solicitud_actualizada

    async def rechazar_solicitud_baja(self, solicitud_id: str, usuario_actual: dict, observaciones: str) -> SolicitudBaja:
        """Rechazar una solicitud de baja"""
        
        update_data = SolicitudBajaUpdate(
            estado=EstadoSolicitudBaja.RECHAZADA,
            fechaRevision=datetime.utcnow(),
            observaciones=observaciones,
            revisadoPor=UsuarioInfo(
                usuarioId=usuario_actual.get("id", "admin-demo"),
                nombreUsuario=usuario_actual.get("nombre", "Admin Demo"),
                email=usuario_actual.get("email", "admin@transportespuno.gob.pe")
            )
        )
        
        return await self.update_solicitud_baja(solicitud_id, update_data, usuario_actual)

    async def cancelar_solicitud_baja(self, solicitud_id: str, usuario_actual: dict) -> SolicitudBaja:
        """Cancelar una solicitud de baja"""
        
        update_data = SolicitudBajaUpdate(
            estado=EstadoSolicitudBaja.CANCELADA,
            fechaRevision=datetime.utcnow()
        )
        
        return await self.update_solicitud_baja(solicitud_id, update_data, usuario_actual)

    async def get_solicitudes_by_vehiculo(self, vehiculo_id: str) -> List[SolicitudBaja]:
        """Obtener solicitudes de baja por vehículo"""
        
        filtros = SolicitudBajaFilter()
        # Nota: Aquí deberíamos filtrar por vehiculoId, pero el filtro usa vehiculoPlaca
        # Por ahora, obtenemos todas y filtramos en memoria
        todas_solicitudes = await self.get_solicitudes_baja()
        
        return [s for s in todas_solicitudes if s.vehiculoId == vehiculo_id]