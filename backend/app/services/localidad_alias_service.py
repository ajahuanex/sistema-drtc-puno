"""
Servicio para gestión de alias de localidades
"""
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

from app.models.localidad_alias import (
    LocalidadAlias,
    LocalidadAliasCreate,
    LocalidadAliasUpdate,
    BusquedaLocalidadResult
)

class LocalidadAliasService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.localidades_alias
        self.localidades_collection = db.localidades
    
    async def create_alias(self, alias_data: LocalidadAliasCreate) -> LocalidadAlias:
        """Crear un nuevo alias de localidad"""
        # Verificar que la localidad existe
        try:
            localidad_id = ObjectId(alias_data.localidad_id)
        except:
            # Si no es un ObjectId válido, buscar por nombre
            localidad = await self.localidades_collection.find_one({
                "nombre": alias_data.localidad_nombre
            })
            if not localidad:
                raise ValueError(f"Localidad '{alias_data.localidad_nombre}' no encontrada")
            localidad_id = localidad["_id"]
        else:
            localidad = await self.localidades_collection.find_one({
                "_id": localidad_id
            })
            if not localidad:
                raise ValueError(f"Localidad con ID {alias_data.localidad_id} no encontrada")
        
        # Verificar que el alias no existe ya
        existing = await self.collection.find_one({
            "alias": {"$regex": f"^{alias_data.alias}$", "$options": "i"},
            "estaActivo": True
        })
        
        if existing:
            raise ValueError(f"Ya existe un alias '{alias_data.alias}'")
        
        # Crear documento
        alias_dict = alias_data.model_dump()
        alias_dict.update({
            "_id": ObjectId(),
            "localidad_id": str(localidad_id),
            "estaActivo": True,
            "fechaCreacion": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow(),
            "usos_como_origen": 0,
            "usos_como_destino": 0,
            "usos_en_itinerario": 0
        })
        
        result = await self.collection.insert_one(alias_dict)
        created_alias = await self.collection.find_one({"_id": result.inserted_id})
        
        return self._document_to_alias(created_alias)
    
    async def get_alias_by_id(self, alias_id: str) -> Optional[LocalidadAlias]:
        """Obtener alias por ID"""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(alias_id)})
            return self._document_to_alias(doc) if doc else None
        except:
            return None
    
    async def get_alias_by_localidad_id(self, localidad_id: str) -> Optional[LocalidadAlias]:
        """Obtener alias por ID de localidad"""
        try:
            doc = await self.collection.find_one({
                "localidad_id": localidad_id,
                "estaActivo": True
            })
            return self._document_to_alias(doc) if doc else None
        except:
            return None
    
    async def get_all_alias(
        self,
        skip: int = 0,
        limit: int = 100,
        solo_activos: bool = True
    ) -> List[LocalidadAlias]:
        """Obtener todos los alias"""
        query = {}
        if solo_activos:
            query["estaActivo"] = True
        
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("alias", 1)
        aliases = []
        
        async for doc in cursor:
            aliases.append(self._document_to_alias(doc))
        
        return aliases
    
    async def buscar_por_alias(self, nombre: str) -> Optional[BusquedaLocalidadResult]:
        """
        Buscar localidad por nombre o alias
        Retorna la localidad oficial si encuentra un alias
        """
        # Normalizar nombre (remover C.P., CP, etc.)
        import re
        nombre_normalizado = re.sub(r'^(C\.P\.|CP|C\.P)\s*', '', nombre, flags=re.IGNORECASE).strip()
        
        # Buscar alias exacto
        alias_doc = await self.collection.find_one({
            "alias": {"$regex": f"^{nombre}$", "$options": "i"},
            "estaActivo": True
        })
        
        if alias_doc:
            # Obtener localidad oficial
            localidad = await self.localidades_collection.find_one({
                "_id": ObjectId(alias_doc["localidad_id"])
            })
            
            if localidad:
                return BusquedaLocalidadResult(
                    localidad_id=str(localidad["_id"]),
                    localidad_nombre=localidad.get("nombre"),
                    es_alias=True,
                    alias_usado=alias_doc["alias"],
                    coordenadas=localidad.get("coordenadas")
                )
        
        # Si no es alias, buscar localidad directa
        localidad = await self.localidades_collection.find_one({
            "nombre": {"$regex": f"^{nombre}$", "$options": "i"},
            "estaActiva": True
        })
        
        if not localidad and nombre != nombre_normalizado:
            # Buscar con nombre normalizado
            localidad = await self.localidades_collection.find_one({
                "nombre": {"$regex": f"^{nombre_normalizado}$", "$options": "i"},
                "estaActiva": True
            })
        
        if localidad:
            return BusquedaLocalidadResult(
                localidad_id=str(localidad["_id"]),
                localidad_nombre=localidad.get("nombre"),
                es_alias=False,
                coordenadas=localidad.get("coordenadas")
            )
        
        return None
    
    async def update_alias(
        self,
        alias_id: str,
        alias_data: LocalidadAliasUpdate
    ) -> Optional[LocalidadAlias]:
        """Actualizar un alias"""
        try:
            existing = await self.collection.find_one({"_id": ObjectId(alias_id)})
            if not existing:
                return None
            
            update_data = alias_data.model_dump(exclude_unset=True)
            
            # Si se actualiza la localidad, verificar que existe
            if "localidad_id" in update_data:
                localidad = await self.localidades_collection.find_one({
                    "_id": ObjectId(update_data["localidad_id"])
                })
                if not localidad:
                    raise ValueError(f"Localidad con ID {update_data['localidad_id']} no encontrada")
            
            update_data["fechaActualizacion"] = datetime.utcnow()
            
            await self.collection.update_one(
                {"_id": ObjectId(alias_id)},
                {"$set": update_data}
            )
            
            updated_doc = await self.collection.find_one({"_id": ObjectId(alias_id)})
            return self._document_to_alias(updated_doc)
        except Exception as e:
            raise e
    
    async def delete_alias(self, alias_id: str) -> bool:
        """Eliminar (desactivar) un alias"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(alias_id)},
                {"$set": {
                    "estaActivo": False,
                    "fechaActualizacion": datetime.utcnow()
                }}
            )
            return result.modified_count > 0
        except:
            return False
    
    async def actualizar_estadisticas_uso(self, alias: str, tipo_uso: str):
        """Actualizar estadísticas de uso de un alias"""
        campo_map = {
            "origen": "usos_como_origen",
            "destino": "usos_como_destino",
            "itinerario": "usos_en_itinerario"
        }
        
        campo = campo_map.get(tipo_uso)
        if not campo:
            return
        
        await self.collection.update_one(
            {"alias": {"$regex": f"^{alias}$", "$options": "i"}},
            {"$inc": {campo: 1}}
        )
    
    async def get_alias_sin_usar(self) -> List[LocalidadAlias]:
        """Obtener alias que no se están usando"""
        cursor = self.collection.find({
            "estaActivo": True,
            "usos_como_origen": 0,
            "usos_como_destino": 0,
            "usos_en_itinerario": 0
        })
        
        aliases = []
        async for doc in cursor:
            aliases.append(self._document_to_alias(doc))
        
        return aliases
    
    async def get_alias_mas_usados(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Obtener los alias más usados"""
        pipeline = [
            {"$match": {"estaActivo": True}},
            {"$addFields": {
                "total_usos": {
                    "$add": ["$usos_como_origen", "$usos_como_destino", "$usos_en_itinerario"]
                }
            }},
            {"$sort": {"total_usos": -1}},
            {"$limit": limit}
        ]
        
        cursor = self.collection.aggregate(pipeline)
        aliases = []
        
        async for doc in cursor:
            aliases.append({
                "id": str(doc["_id"]),
                "alias": doc["alias"],
                "localidad_nombre": doc["localidad_nombre"],
                "total_usos": doc["total_usos"],
                "usos_como_origen": doc["usos_como_origen"],
                "usos_como_destino": doc["usos_como_destino"],
                "usos_en_itinerario": doc["usos_en_itinerario"]
            })
        
        return aliases
    
    def _document_to_alias(self, doc: Dict[str, Any]) -> LocalidadAlias:
        """Convertir documento de MongoDB a modelo LocalidadAlias"""
        if not doc:
            return None
        
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        
        return LocalidadAlias(**doc)
