"""
Servicio para gestión de rutas de transporte
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.ruta import Ruta, RutaCreate, RutaUpdate, EstadoRuta


class RutaService:
    """Servicio para operaciones CRUD de rutas"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.rutas_collection = db["rutas"]
        self.resoluciones_collection = db["resoluciones"]
        self.empresas_collection = db["empresas"]
    
    async def validar_resolucion_vigente(self, resolucion_id: str) -> bool:
        """
        Validar que la resolución sea VIGENTE y PADRE
        
        Args:
            resolucion_id: ID de la resolución a validar
            
        Returns:
            True si la resolución es válida
            
        Raises:
            HTTPException: Si la resolución no es válida
        """
        try:
            resolucion = await self.resoluciones_collection.find_one({
                "_id": ObjectId(resolucion_id)
            })
            
            if not resolucion:
                raise HTTPException(
                    status_code=404,
                    detail=f"Resolución {resolucion_id} no encontrada"
                )
            
            # Validar estado VIGENTE
            if resolucion.get("estado") != "VIGENTE":
                raise HTTPException(
                    status_code=400,
                    detail=f"La resolución debe estar VIGENTE. Estado actual: {resolucion.get('estado')}"
                )
            
            # Validar tipo PADRE
            if resolucion.get("tipoResolucion") != "PADRE":
                raise HTTPException(
                    status_code=400,
                    detail="Solo se pueden asociar rutas a resoluciones PADRE (primigenias)"
                )
            
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al validar resolución: {str(e)}"
            )
    
    async def validar_codigo_unico(
        self, 
        codigo_ruta: str, 
        resolucion_id: str,
        ruta_id_excluir: Optional[str] = None
    ) -> bool:
        """
        Validar que el código de ruta sea único dentro de la resolución
        
        Args:
            codigo_ruta: Código a validar
            resolucion_id: ID de la resolución
            ruta_id_excluir: ID de ruta a excluir (para edición)
            
        Returns:
            True si el código es único
            
        Raises:
            HTTPException: Si el código ya existe
        """
        query = {
            "codigoRuta": codigo_ruta,
            "resolucionId": resolucion_id,
            "estaActivo": True
        }
        
        # Excluir ruta actual en caso de edición
        if ruta_id_excluir:
            query["_id"] = {"$ne": ObjectId(ruta_id_excluir)}
        
        ruta_existente = await self.rutas_collection.find_one(query)
        
        if ruta_existente:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe una ruta con código {codigo_ruta} en esta resolución"
            )
        
        return True
    
    async def create_ruta(self, ruta_data: RutaCreate) -> Ruta:
        """
        Crear nueva ruta con validaciones completas
        
        Args:
            ruta_data: Datos de la ruta a crear
            
        Returns:
            Ruta creada
            
        Raises:
            HTTPException: Si hay errores de validación
        """
        try:
            # 1. Validar empresa
            empresa = await self.empresas_collection.find_one({
                "_id": ObjectId(ruta_data.empresaId)
            })
            
            if not empresa:
                raise HTTPException(
                    status_code=404,
                    detail=f"Empresa {ruta_data.empresaId} no encontrada"
                )
            
            if not empresa.get("estaActivo", False):
                raise HTTPException(
                    status_code=400,
                    detail="La empresa no está activa"
                )
            
            # 2. Validar resolución VIGENTE y PADRE
            await self.validar_resolucion_vigente(ruta_data.resolucionId)
            
            # 3. Validar código único en resolución
            await self.validar_codigo_unico(
                ruta_data.codigoRuta,
                ruta_data.resolucionId
            )
            
            # 4. Validar origen y destino diferentes
            if ruta_data.origenId == ruta_data.destinoId:
                raise HTTPException(
                    status_code=400,
                    detail="El origen y destino no pueden ser iguales"
                )
            
            # 5. Preparar documento para inserción
            ruta_dict = ruta_data.model_dump()
            ruta_dict["fechaRegistro"] = datetime.utcnow()
            ruta_dict["fechaActualizacion"] = datetime.utcnow()
            ruta_dict["estaActivo"] = True
            ruta_dict["estado"] = EstadoRuta.ACTIVA
            
            # 6. Insertar ruta
            result = await self.rutas_collection.insert_one(ruta_dict)
            ruta_id = str(result.inserted_id)
            
            # 7. Actualizar relaciones en empresa
            await self.empresas_collection.update_one(
                {"_id": ObjectId(ruta_data.empresaId)},
                {
                    "$addToSet": {"rutasAutorizadasIds": ruta_id},
                    "$set": {"fechaActualizacion": datetime.utcnow()}
                }
            )
            
            # 8. Actualizar relaciones en resolución
            await self.resoluciones_collection.update_one(
                {"_id": ObjectId(ruta_data.resolucionId)},
                {
                    "$addToSet": {"rutasAutorizadasIds": ruta_id},
                    "$set": {"fechaActualizacion": datetime.utcnow()}
                }
            )
            
            # 9. Obtener y retornar ruta creada
            ruta_creada = await self.rutas_collection.find_one({"_id": result.inserted_id})
            ruta_creada["id"] = str(ruta_creada.pop("_id"))
            
            return Ruta(**ruta_creada)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al crear ruta: {str(e)}"
            )
    
    async def get_ruta_by_id(self, ruta_id: str) -> Optional[Ruta]:
        """Obtener ruta por ID"""
        try:
            ruta = await self.rutas_collection.find_one({
                "_id": ObjectId(ruta_id),
                "estaActivo": True
            })
            
            if not ruta:
                return None
            
            ruta["id"] = str(ruta.pop("_id"))
            return Ruta(**ruta)
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al obtener ruta: {str(e)}"
            )
    
    async def get_rutas(
        self,
        skip: int = 0,
        limit: int = 100,
        estado: Optional[str] = None
    ) -> List[Ruta]:
        """Obtener lista de rutas con filtros opcionales"""
        try:
            query = {"estaActivo": True}
            
            if estado:
                query["estado"] = estado
            
            cursor = self.rutas_collection.find(query).skip(skip).limit(limit)
            rutas = await cursor.to_list(length=limit)
            
            # Convertir ObjectId a string
            for ruta in rutas:
                ruta["id"] = str(ruta.pop("_id"))
            
            return [Ruta(**ruta) for ruta in rutas]
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al obtener rutas: {str(e)}"
            )
    
    async def get_rutas_por_empresa(self, empresa_id: str) -> List[Ruta]:
        """Obtener rutas de una empresa específica"""
        try:
            rutas = await self.rutas_collection.find({
                "empresaId": empresa_id,
                "estaActivo": True
            }).to_list(length=None)
            
            for ruta in rutas:
                ruta["id"] = str(ruta.pop("_id"))
            
            return [Ruta(**ruta) for ruta in rutas]
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al obtener rutas por empresa: {str(e)}"
            )
    
    async def get_rutas_por_resolucion(self, resolucion_id: str) -> List[Ruta]:
        """Obtener rutas de una resolución específica"""
        try:
            rutas = await self.rutas_collection.find({
                "resolucionId": resolucion_id,
                "estaActivo": True
            }).to_list(length=None)
            
            for ruta in rutas:
                ruta["id"] = str(ruta.pop("_id"))
            
            return [Ruta(**ruta) for ruta in rutas]
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al obtener rutas por resolución: {str(e)}"
            )
    
    async def get_rutas_por_empresa_y_resolucion(
        self,
        empresa_id: str,
        resolucion_id: str
    ) -> List[Ruta]:
        """Obtener rutas filtradas por empresa y resolución"""
        try:
            rutas = await self.rutas_collection.find({
                "empresaId": empresa_id,
                "resolucionId": resolucion_id,
                "estaActivo": True
            }).to_list(length=None)
            
            for ruta in rutas:
                ruta["id"] = str(ruta.pop("_id"))
            
            return [Ruta(**ruta) for ruta in rutas]
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al obtener rutas: {str(e)}"
            )
    
    async def update_ruta(
        self,
        ruta_id: str,
        ruta_data: RutaUpdate
    ) -> Optional[Ruta]:
        """
        Actualizar ruta existente
        
        Nota: No se permite cambiar empresaId ni resolucionId
        """
        try:
            # Verificar que la ruta existe
            ruta_actual = await self.get_ruta_by_id(ruta_id)
            if not ruta_actual:
                raise HTTPException(
                    status_code=404,
                    detail=f"Ruta {ruta_id} no encontrada"
                )
            
            # Si se está actualizando el código, validar unicidad
            if ruta_data.codigoRuta:
                await self.validar_codigo_unico(
                    ruta_data.codigoRuta,
                    ruta_actual.resolucionId,
                    ruta_id
                )
            
            # Preparar actualización
            update_data = ruta_data.model_dump(exclude_unset=True)
            update_data["fechaActualizacion"] = datetime.utcnow()
            
            # Actualizar ruta
            result = await self.rutas_collection.update_one(
                {"_id": ObjectId(ruta_id)},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                return ruta_actual  # No hubo cambios
            
            # Retornar ruta actualizada
            return await self.get_ruta_by_id(ruta_id)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al actualizar ruta: {str(e)}"
            )
    
    async def soft_delete_ruta(self, ruta_id: str) -> bool:
        """Desactivar ruta (borrado lógico)"""
        try:
            result = await self.rutas_collection.update_one(
                {"_id": ObjectId(ruta_id)},
                {
                    "$set": {
                        "estaActivo": False,
                        "estado": EstadoRuta.DADA_DE_BAJA,
                        "fechaActualizacion": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                # Remover de relaciones
                ruta = await self.rutas_collection.find_one({"_id": ObjectId(ruta_id)})
                
                if ruta and ruta.get("empresaId"):
                    await self.empresas_collection.update_one(
                        {"_id": ObjectId(ruta["empresaId"])},
                        {"$pull": {"rutasAutorizadasIds": ruta_id}}
                    )
                
                if ruta and ruta.get("resolucionId"):
                    await self.resoluciones_collection.update_one(
                        {"_id": ObjectId(ruta["resolucionId"])},
                        {"$pull": {"rutasAutorizadasIds": ruta_id}}
                    )
            
            return result.modified_count > 0
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al eliminar ruta: {str(e)}"
            )
    
    async def generar_siguiente_codigo(self, resolucion_id: str) -> str:
        """Generar el siguiente código disponible para una resolución"""
        try:
            rutas = await self.get_rutas_por_resolucion(resolucion_id)
            
            # Obtener códigos numéricos existentes
            codigos_existentes = []
            for ruta in rutas:
                try:
                    codigo_num = int(ruta.codigoRuta)
                    codigos_existentes.append(codigo_num)
                except ValueError:
                    continue
            
            # Encontrar el siguiente número disponible
            siguiente = 1
            while siguiente in codigos_existentes:
                siguiente += 1
            
            # Formatear con ceros a la izquierda (01, 02, 03...)
            return str(siguiente).zfill(2)
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al generar código: {str(e)}"
            )
