from typing import List, Optional, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import logging
import uuid
from app.models.parametro_sistema import ParametroSistemaCreate, ParametroSistemaUpdate, ParametroSistemaInDB

logger = logging.getLogger(__name__)

class ParametroSistemaService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["parametros_sistema"]

    async def get_all_parametros(self) -> List[ParametroSistemaInDB]:
        cursor = self.collection.find({})
        parametros = []
        async for doc in cursor:
            parametros.append(ParametroSistemaInDB(**doc))
        return parametros

    async def get_parametro_by_clave(self, clave: str) -> Optional[ParametroSistemaInDB]:
        doc = await self.collection.find_one({"clave": clave})
        if doc:
            return ParametroSistemaInDB(**doc)
        return None

    async def update_parametro(self, id: str, update_data: ParametroSistemaUpdate) -> Optional[ParametroSistemaInDB]:
        update_dict = update_data.model_dump(exclude_unset=True)
        if not update_dict:
            # Nada que actualizar
            doc = await self.collection.find_one({"id": id})
            return ParametroSistemaInDB(**doc) if doc else None

        update_dict["fechaActualizacion"] = datetime.utcnow()
        
        result = await self.collection.find_one_and_update(
            {"id": id},
            {"$set": update_dict},
            return_document=True
        )
        
        if result:
            logger.info(f"Parametro actualizado: {id} - {update_dict.keys()}")
            return ParametroSistemaInDB(**result)
        return None

    # Función helper rápida para obtener solo el valor (usada en todo el backend)
    async def get_valor(self, clave: str, default: Any = None) -> Any:
        doc = await self.collection.find_one({"clave": clave})
        if doc and "valor" in doc:
            return doc["valor"]
        return default
