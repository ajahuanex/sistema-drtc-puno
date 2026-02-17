"""
Servicio para ejecutar el protocolo de renovación de resoluciones padre
Gestiona la transferencia de vehículos, rutas y desactivación de resoluciones hijas
"""

from datetime import datetime
from typing import Dict, Any, List
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

logger = logging.getLogger(__name__)


class ProtocoloRenovacionService:
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.resoluciones_collection = db["resoluciones"]
        self.vehiculos_collection = db["vehiculos"]
        self.rutas_collection = db["rutas"]
    
    async def ejecutar_protocolo(
        self,
        resolucion_anterior_numero: str,
        resolucion_nueva_numero: str,
        fecha_renovacion: datetime = None
    ) -> Dict[str, Any]:
        """
        Ejecuta el protocolo de renovación de resoluciones padre
        
        Protocolo:
        1. Actualizar estado de resolución anterior a RENOVADA
        2. Agregar observaciones con tipificación
        3. Desactivar resoluciones hijas
        4. Transferir vehículos como PENDIENTES
        5. Transferir rutas como PENDIENTES
        
        Args:
            resolucion_anterior_numero: Número de la resolución que se renovó
            resolucion_nueva_numero: Número de la nueva resolución
            fecha_renovacion: Fecha de la renovación (si es None, usa fecha actual)
        
        Returns:
            Resultado del protocolo con estadísticas
        """
        
        if fecha_renovacion is None:
            fecha_renovacion = datetime.now()
        
        try:
            # 1. Obtener resolución anterior
            resolucion_anterior = await self.resoluciones_collection.find_one({
                "nroResolucion": resolucion_anterior_numero
            })
            
            if not resolucion_anterior:
                return {
                    "exito": False,
                    "mensaje": f"Resolución anterior '{resolucion_anterior_numero}' no encontrada"
                }
            
            # 2. Obtener resolución nueva
            resolucion_nueva = await self.resoluciones_collection.find_one({
                "nroResolucion": resolucion_nueva_numero
            })
            
            if not resolucion_nueva:
                return {
                    "exito": False,
                    "mensaje": f"Resolución nueva '{resolucion_nueva_numero}' no encontrada"
                }
            
            resolucion_anterior_id = str(resolucion_anterior["_id"])
            resolucion_nueva_id = str(resolucion_nueva["_id"])
            
            # 3. Actualizar estado de resolución anterior
            observaciones_renovacion = (
                f"Resolución renovada por {resolucion_nueva_numero} "
                f"el {fecha_renovacion.strftime('%d/%m/%Y')}"
            )
            
            await self.resoluciones_collection.update_one(
                {"_id": resolucion_anterior["_id"]},
                {
                    "$set": {
                        "estado": "RENOVADA",
                        "renovadaPor": resolucion_nueva_numero,
                        "observaciones": observaciones_renovacion,
                        "fechaActualizacion": datetime.now()
                    }
                }
            )
            
            logger.info(f"Resolución anterior {resolucion_anterior_numero} actualizada a RENOVADA")
            
            # 4. Desactivar resoluciones hijas
            resoluciones_hijas_ids = resolucion_anterior.get("resolucionesHijasIds", [])
            hijas_desactivadas = 0
            
            if resoluciones_hijas_ids:
                result = await self.resoluciones_collection.update_many(
                    {"_id": {"$in": [ObjectId(id) for id in resoluciones_hijas_ids]}},
                    {
                        "$set": {
                            "estaActivo": False,
                            "observaciones": f"Resolución padre renovada por {resolucion_nueva_numero}",
                            "fechaActualizacion": datetime.now()
                        }
                    }
                )
                hijas_desactivadas = result.modified_count
                logger.info(f"{hijas_desactivadas} resoluciones hijas desactivadas")
            
            # 5. Transferir vehículos como pendientes
            vehiculos_ids = resolucion_anterior.get("vehiculosHabilitadosIds", [])
            vehiculos_transferidos = 0
            
            if vehiculos_ids:
                # Actualizar vehículos
                result = await self.vehiculos_collection.update_many(
                    {"_id": {"$in": [ObjectId(id) for id in vehiculos_ids]}},
                    {
                        "$set": {
                            "resolucionId": resolucion_nueva_id,
                            "estadoEnResolucion": "PENDIENTE",
                            "resolucionAnteriorId": resolucion_anterior_id,
                            "fechaTransferencia": fecha_renovacion,
                            "observaciones": (
                                f"Transferido desde {resolucion_anterior_numero}. "
                                f"Pendiente de confirmación en {resolucion_nueva_numero}"
                            )
                        }
                    }
                )
                vehiculos_transferidos = result.modified_count
                
                # Agregar a resolución nueva como pendientes
                await self.resoluciones_collection.update_one(
                    {"_id": resolucion_nueva["_id"]},
                    {
                        "$set": {
                            "vehiculosPendientesIds": vehiculos_ids
                        }
                    }
                )
                
                # Limpiar de resolución anterior
                await self.resoluciones_collection.update_one(
                    {"_id": resolucion_anterior["_id"]},
                    {
                        "$set": {
                            "vehiculosHabilitadosIds": []
                        }
                    }
                )
                
                logger.info(f"{vehiculos_transferidos} vehículos transferidos como pendientes")
            
            # 6. Transferir rutas como pendientes
            rutas_ids = resolucion_anterior.get("rutasAutorizadasIds", [])
            rutas_transferidas = 0
            
            if rutas_ids:
                # Actualizar rutas
                result = await self.rutas_collection.update_many(
                    {"_id": {"$in": [ObjectId(id) for id in rutas_ids]}},
                    {
                        "$set": {
                            "resolucionId": resolucion_nueva_id,
                            "estadoEnResolucion": "PENDIENTE",
                            "resolucionAnteriorId": resolucion_anterior_id,
                            "fechaTransferencia": fecha_renovacion,
                            "requiereActualizacion": True,
                            "observaciones": (
                                f"Transferida desde {resolucion_anterior_numero}. "
                                f"Pendiente de actualización en {resolucion_nueva_numero}"
                            )
                        }
                    }
                )
                rutas_transferidas = result.modified_count
                
                # Agregar a resolución nueva como pendientes
                await self.resoluciones_collection.update_one(
                    {"_id": resolucion_nueva["_id"]},
                    {
                        "$set": {
                            "rutasPendientesIds": rutas_ids
                        }
                    }
                )
                
                # Limpiar de resolución anterior
                await self.resoluciones_collection.update_one(
                    {"_id": resolucion_anterior["_id"]},
                    {
                        "$set": {
                            "rutasAutorizadasIds": []
                        }
                    }
                )
                
                logger.info(f"{rutas_transferidas} rutas transferidas como pendientes")
            
            # 7. Marcar protocolo como ejecutado en resolución nueva
            await self.resoluciones_collection.update_one(
                {"_id": resolucion_nueva["_id"]},
                {
                    "$set": {
                        "protocoloRenovacionEjecutado": True,
                        "fechaProtocoloRenovacion": fecha_renovacion
                    }
                }
            )
            
            return {
                "exito": True,
                "mensaje": "Protocolo de renovación ejecutado exitosamente",
                "estadisticas": {
                    "resoluciones_hijas_desactivadas": hijas_desactivadas,
                    "vehiculos_transferidos": vehiculos_transferidos,
                    "rutas_transferidas": rutas_transferidas
                },
                "detalles": {
                    "resolucion_anterior": resolucion_anterior_numero,
                    "resolucion_nueva": resolucion_nueva_numero,
                    "fecha_renovacion": fecha_renovacion.strftime('%d/%m/%Y')
                }
            }
            
        except Exception as e:
            logger.error(f"Error ejecutando protocolo de renovación: {str(e)}")
            return {
                "exito": False,
                "mensaje": f"Error ejecutando protocolo: {str(e)}"
            }
    
    async def confirmar_vehiculo(
        self,
        vehiculo_id: str,
        resolucion_id: str,
        confirmar: bool = True
    ) -> Dict[str, Any]:
        """
        Confirma o rechaza un vehículo pendiente en una resolución
        
        Args:
            vehiculo_id: ID del vehículo
            resolucion_id: ID de la resolución
            confirmar: True para confirmar, False para rechazar
        
        Returns:
            Resultado de la operación
        """
        try:
            if confirmar:
                # Confirmar vehículo
                await self.vehiculos_collection.update_one(
                    {"_id": ObjectId(vehiculo_id)},
                    {
                        "$set": {
                            "estadoEnResolucion": "ACTIVO",
                            "fechaConfirmacion": datetime.now()
                        }
                    }
                )
                
                # Mover de pendientes a habilitados
                await self.resoluciones_collection.update_one(
                    {"_id": ObjectId(resolucion_id)},
                    {
                        "$pull": {"vehiculosPendientesIds": vehiculo_id},
                        "$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}
                    }
                )
                
                return {
                    "exito": True,
                    "mensaje": "Vehículo confirmado exitosamente"
                }
            else:
                # Rechazar vehículo
                await self.vehiculos_collection.update_one(
                    {"_id": ObjectId(vehiculo_id)},
                    {
                        "$set": {
                            "estadoEnResolucion": "RECHAZADO",
                            "resolucionId": None,
                            "fechaRechazo": datetime.now()
                        }
                    }
                )
                
                # Quitar de pendientes
                await self.resoluciones_collection.update_one(
                    {"_id": ObjectId(resolucion_id)},
                    {
                        "$pull": {"vehiculosPendientesIds": vehiculo_id}
                    }
                )
                
                return {
                    "exito": True,
                    "mensaje": "Vehículo rechazado exitosamente"
                }
                
        except Exception as e:
            logger.error(f"Error confirmando vehículo: {str(e)}")
            return {
                "exito": False,
                "mensaje": f"Error: {str(e)}"
            }
    
    async def confirmar_ruta(
        self,
        ruta_id: str,
        resolucion_id: str,
        confirmar: bool = True
    ) -> Dict[str, Any]:
        """
        Confirma o rechaza una ruta pendiente en una resolución
        
        Args:
            ruta_id: ID de la ruta
            resolucion_id: ID de la resolución
            confirmar: True para confirmar, False para rechazar
        
        Returns:
            Resultado de la operación
        """
        try:
            if confirmar:
                # Confirmar ruta
                await self.rutas_collection.update_one(
                    {"_id": ObjectId(ruta_id)},
                    {
                        "$set": {
                            "estadoEnResolucion": "ACTIVA",
                            "requiereActualizacion": False,
                            "fechaConfirmacion": datetime.now()
                        }
                    }
                )
                
                # Mover de pendientes a autorizadas
                await self.resoluciones_collection.update_one(
                    {"_id": ObjectId(resolucion_id)},
                    {
                        "$pull": {"rutasPendientesIds": ruta_id},
                        "$addToSet": {"rutasAutorizadasIds": ruta_id}
                    }
                )
                
                return {
                    "exito": True,
                    "mensaje": "Ruta confirmada exitosamente"
                }
            else:
                # Rechazar ruta
                await self.rutas_collection.update_one(
                    {"_id": ObjectId(ruta_id)},
                    {
                        "$set": {
                            "estadoEnResolucion": "RECHAZADA",
                            "resolucionId": None,
                            "fechaRechazo": datetime.now()
                        }
                    }
                )
                
                # Quitar de pendientes
                await self.resoluciones_collection.update_one(
                    {"_id": ObjectId(resolucion_id)},
                    {
                        "$pull": {"rutasPendientesIds": ruta_id}
                    }
                )
                
                return {
                    "exito": True,
                    "mensaje": "Ruta rechazada exitosamente"
                }
                
        except Exception as e:
            logger.error(f"Error confirmando ruta: {str(e)}")
            return {
                "exito": False,
                "mensaje": f"Error: {str(e)}"
            }
