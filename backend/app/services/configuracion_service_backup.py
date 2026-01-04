"""
Backup del servicio de configuraciones original
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.configuracion import (
    Configuracion, ConfiguracionCreate, ConfiguracionUpdate, 
    ConfiguracionResponse, TipoConfiguracion, ConfiguracionItem,
    CONFIGURACIONES_PREDEFINIDAS
)

class ConfiguracionServiceOriginal:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.configuraciones

    def _convert_id(self, doc: dict) -> dict:
        """Convertir ObjectId a string"""
        if doc and "_id" in doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
        return doc

    async def get_configuracion_por_tipo(self, tipo: TipoConfiguracion) -> Optional[ConfiguracionResponse]:
        """Obtener configuración por tipo"""
        doc = await self.collection.find_one({"tipo": tipo, "estaActivo": True})
        if doc:
            return ConfiguracionResponse(**self._convert_id(doc))
        return None

    async def get_tipos_servicio_activos(self) -> List[ConfiguracionItem]:
        """Obtener tipos de servicio activos"""
        config = await self.get_configuracion_por_tipo(TipoConfiguracion.TIPOS_SERVICIO)
        if config:
            return [item for item in config.items if item.estaActivo]
        return []

    async def get_tipos_servicio_codigos(self) -> List[str]:
        """Obtener solo los códigos de tipos de servicio activos"""
        items = await self.get_tipos_servicio_activos()
        return [item.codigo for item in items]