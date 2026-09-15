"""
Servicio para gestión de VehiculoData (Datos Técnicos Puros)
Separado de la lógica administrativa de vehículos
"""
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.vehiculo_solo import (
    VehiculoSolo, CategoriaVehiculo, TipoCarroceria, 
    TipoCombustible, EstadoFisicoVehiculo
)
from app.utils.exceptions import ValidationErrorException


class VehiculoDataService:
    """Servicio para operaciones CRUD de datos técnicos de vehículos"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["vehiculos_data"]
    
    async def create_vehiculo_data(self, vehiculo_data: dict) -> dict:
        """Crear registro de datos técnicos"""
        
        # Verificar que la placa no exista
        existing = await self.collection.find_one({"placa_actual": vehiculo_data["placa_actual"]})
        if existing:
            raise ValidationErrorException("placa_actual", f"La placa {vehiculo_data['placa_actual']} ya existe")
        
        # Verificar que el VIN no exista
        if vehiculo_data.get("vin"):
            existing_vin = await self.collection.find_one({"vin": vehiculo_data["vin"]})
            if existing_vin:
                raise ValidationErrorException("vin", f"El VIN {vehiculo_data['vin']} ya existe")
        
        # Preparar datos
        vehiculo_data["fecha_creacion"] = datetime.utcnow()
        vehiculo_data["fecha_actualizacion"] = datetime.utcnow()
        
        # Insertar
        result = await self.collection.insert_one(vehiculo_data)
        vehiculo_id = str(result.inserted_id)
        
        # Obtener el registro creado
        created = await self.collection.find_one({"_id": result.inserted_id})
        created["id"] = str(created.pop("_id"))
        
        return created
    
    async def consultar_placa_pcm(self, placa: str) -> Optional[dict]:
        """Consulta placa en el servicio externo de SUNARP PCM guillermo.pe y cachea en MongoDB"""
        import httpx
        import logging
        logger = logging.getLogger("api.vehiculo_data")

        clean_placa = placa.replace("-", "").strip().upper()
        if not clean_placa or len(clean_placa) < 6:
            return None
        
        url = f"https://pcm.guillermo.pe/api/v1/sunarp/vehiculo/{clean_placa}"
        try:
            async with httpx.AsyncClient(verify=False, timeout=12.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("found") and data.get("vehiculo"):
                        v = data["vehiculo"]
                        
                        formatted_placa = f"{clean_placa[:3]}-{clean_placa[3:]}" if len(clean_placa) == 6 else clean_placa
                        
                        anio_val = None
                        if v.get("anoFabricacion") and str(v.get("anoFabricacion")).isdigit():
                            ano_int = int(v.get("anoFabricacion"))
                            if ano_int > 1900:
                                anio_val = ano_int
                        
                        # Categoría y Clase
                        cat_pcm = (v.get("codCategoria") or "M2").strip().upper()
                        # Clase: No es 'MICROBUS' (eso es carrocería). Si la categoría contiene C3, clase = 'C3', de lo contrario vacío.
                        clase_pcm = "C3" if "C3" in cat_pcm else ""
                        carroceria_pcm = v.get("carroceria") or ""

                        veh_dict = {
                            "placa_actual": formatted_placa,
                            "placa": formatted_placa,
                            "marca": v.get("marca"),
                            "modelo": v.get("modelo"),
                            "anio_fabricacion": anio_val,
                            "anio_modelo": anio_val,
                            "color": v.get("color"),
                            "categoria": cat_pcm,
                            "carroceria": carroceria_pcm,
                            "clase": clase_pcm,
                            "combustible": "DIESEL",
                            "numero_motor": v.get("nro_motor"),
                            "numero_serie": v.get("serie"),
                            "vin": v.get("vin") or v.get("serie"),
                            "sede": v.get("sede"),
                            "propietario": v.get("propietarios", {}).get("nombre") if isinstance(v.get("propietarios"), dict) else None,
                            "fuente_datos": "PCM_SUNARP_API",
                            "fecha_creacion": datetime.utcnow().isoformat(),
                            "fecha_actualizacion": datetime.utcnow().isoformat(),
                            "origen": "PCM_API"
                        }
                        
                        # Cachear en MongoDB vehiculos_data
                        try:
                            # Al guardar cache, no sobreescribir anio_fabricacion o categoria existentes si ya son válidos en BD
                            existing_v = await self.collection.find_one({"$or": [{"placa_actual": formatted_placa}, {"placa_actual": clean_placa}]})
                            if existing_v:
                                if existing_v.get("anio_fabricacion") and existing_v["anio_fabricacion"] > 1900:
                                    veh_dict["anio_fabricacion"] = existing_v["anio_fabricacion"]
                                    veh_dict["anio_modelo"] = existing_v.get("anio_modelo") or existing_v["anio_fabricacion"]
                                if existing_v.get("categoria"):
                                    veh_dict["categoria"] = existing_v["categoria"]
                                if existing_v.get("clase") and existing_v["clase"] != "MICROBUS":
                                    veh_dict["clase"] = existing_v["clase"]
                                elif "C3" in str(veh_dict.get("categoria", "")).upper():
                                    veh_dict["clase"] = "C3"

                            await self.collection.update_one(
                                {"$or": [{"placa_actual": formatted_placa}, {"placa_actual": clean_placa}]},
                                {"$set": veh_dict},
                                upsert=True
                            )
                        except Exception as cache_err:
                            logger.warning(f"No se pudo cachear vehiculo en vehiculos_data: {cache_err}")
                            
                        return veh_dict
        except Exception as e:
            logger.warning(f"Error consultando PCM para placa {placa}: {e}")
        return None

    async def get_vehiculo_data(self, vehiculo_data_id: str) -> Optional[dict]:
        """Obtener datos técnicos por ID"""
        try:
            vehiculo_data = await self.collection.find_one({"_id": ObjectId(vehiculo_data_id)})
            if vehiculo_data:
                vehiculo_data["id"] = str(vehiculo_data.pop("_id"))
                return vehiculo_data
            return None
        except Exception:
            return None
    
    async def get_vehiculo_data_by_placa(self, placa: str, consultar_pcm: bool = True) -> Optional[dict]:
        """Buscar datos técnicos por placa (PCM tiene prioridad para specs excepto año fab, categoría y clase)"""
        clean_placa = placa.replace("-", "").strip().upper()
        formatted_placa = f"{clean_placa[:3]}-{clean_placa[3:]}" if len(clean_placa) == 6 else clean_placa
        
        # 1. Buscar en BD local
        vehiculo_data = await self.collection.find_one({
            "$or": [
                {"placa_actual": formatted_placa},
                {"placa_actual": clean_placa},
                {"placa": formatted_placa},
                {"placa": clean_placa}
            ]
        })
        if vehiculo_data:
            vehiculo_data["id"] = str(vehiculo_data.pop("_id"))
            # Limpiar clase si tenía erróneamente 'MICROBUS'
            if vehiculo_data.get("clase") == "MICROBUS":
                cat = str(vehiculo_data.get("categoria", "")).upper()
                vehiculo_data["clase"] = "C3" if "C3" in cat else ""
            vehiculo_data["origen"] = "DB_LOCAL"

        # 2. Si consultar_pcm es True, consultar API PCM externa
        if consultar_pcm:
            pcm_data = await self.consultar_placa_pcm(placa)
            if pcm_data:
                if vehiculo_data:
                    # Mezclar: PCM tiene prioridad técnica (marca, modelo, color, carroceria, serie, motor, vin, propietario)
                    # EXCEPTO anio_fabricacion, categoria y clase donde la BD local o lógica manual tiene prioridad
                    merged = {**vehiculo_data}
                    for k, val in pcm_data.items():
                        if val is not None and val != "":
                            if k in ["anio_fabricacion", "anio_modelo"]:
                                # Prioridad local si es válido (> 1900)
                                if not merged.get(k) or merged[k] <= 1900:
                                    merged[k] = val
                            elif k in ["categoria", "clase"]:
                                # Prioridad local si ya está definida
                                if not merged.get(k):
                                    merged[k] = val
                            else:
                                # PCM tiene prioridad para marca, modelo, carrocería, color, motor, serie, vin, propietario, etc.
                                merged[k] = val
                    merged["origen"] = "PCM_API"
                    return merged
                return pcm_data
                
        return vehiculo_data
    
    async def get_vehiculo_data_by_vin(self, vin: str) -> Optional[dict]:
        """Buscar datos técnicos por VIN"""
        vehiculo_data = await self.collection.find_one({"vin": vin.upper()})
        if vehiculo_data:
            vehiculo_data["id"] = str(vehiculo_data.pop("_id"))
            return vehiculo_data
        return None
    
    async def update_vehiculo_data(self, vehiculo_data_id: str, update_data: dict) -> Optional[dict]:
        """Actualizar datos técnicos"""
        
        # Validar que existe
        existing = await self.get_vehiculo_data(vehiculo_data_id)
        if not existing:
            return None
        
        # Si se actualiza la placa, verificar que no exista
        if "placa_actual" in update_data:
            placa_existente = await self.collection.find_one({
                "placa_actual": update_data["placa_actual"],
                "_id": {"$ne": ObjectId(vehiculo_data_id)}
            })
            if placa_existente:
                raise ValidationErrorException("placa_actual", "La placa ya existe")
        
        # Si se actualiza el VIN, verificar que no exista
        if "vin" in update_data:
            vin_existente = await self.collection.find_one({
                "vin": update_data["vin"],
                "_id": {"$ne": ObjectId(vehiculo_data_id)}
            })
            if vin_existente:
                raise ValidationErrorException("vin", "El VIN ya existe")
        
        # Actualizar
        update_data["fecha_actualizacion"] = datetime.utcnow()
        
        await self.collection.update_one(
            {"_id": ObjectId(vehiculo_data_id)},
            {"$set": update_data}
        )
        
        return await self.get_vehiculo_data(vehiculo_data_id)
    
    async def delete_vehiculo_data(self, vehiculo_data_id: str) -> bool:
        """Eliminar datos técnicos (físicamente)"""
        result = await self.collection.delete_one({"_id": ObjectId(vehiculo_data_id)})
        return result.deleted_count > 0
    
    async def list_vehiculos_data(
        self,
        skip: int = 0,
        limit: int = 1000,
        marca: Optional[str] = None,
        categoria: Optional[str] = None,
        q: Optional[str] = None
    ) -> List[dict]:
        """Listar datos técnicos con filtros y búsqueda de texto libre"""
        
        query = self._build_query(q, marca, categoria)
        
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("placa_actual", 1)
        vehiculos_data = []
        
        async for vehiculo_data in cursor:
            vehiculo_data["id"] = str(vehiculo_data.pop("_id"))
            vehiculos_data.append(vehiculo_data)
        
        return vehiculos_data
    
    def _build_query(self, q: Optional[str] = None, marca: Optional[str] = None, categoria: Optional[str] = None) -> dict:
        """Construir query de MongoDB a partir de los filtros"""
        query: dict = {}
        
        if q and q.strip():
            texto = q.strip()
            query["$or"] = [
                {"placa_actual": {"$regex": texto, "$options": "i"}},
                {"marca": {"$regex": texto, "$options": "i"}},
                {"modelo": {"$regex": texto, "$options": "i"}},
                {"numero_motor": {"$regex": texto, "$options": "i"}},
                {"vin": {"$regex": texto, "$options": "i"}},
                {"pcmMetadata.pcm_propietario": {"$regex": texto, "$options": "i"}},
            ]
        
        if marca:
            query["marca"] = {"$regex": marca, "$options": "i"}
        
        if categoria:
            query["categoria"] = categoria
        
        return query
    
    async def count_vehiculos_data(self, q: Optional[str] = None, marca: Optional[str] = None, categoria: Optional[str] = None) -> int:
        """Contar total de registros con los mismos filtros"""
        query = self._build_query(q, marca, categoria)
        return await self.collection.count_documents(query)
