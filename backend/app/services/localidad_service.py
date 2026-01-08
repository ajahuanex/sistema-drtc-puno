from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
import math

from app.models.localidad import (
    Localidad, LocalidadCreate, LocalidadUpdate, 
    FiltroLocalidades, LocalidadesPaginadas,
    TipoLocalidad, Coordenadas
)

class LocalidadService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.localidades

    async def create_localidad(self, localidad_data: LocalidadCreate) -> Localidad:
        """Crear una nueva localidad"""
        # Verificar que el UBIGEO sea único si se proporciona
        if localidad_data.ubigeo:
            existing = await self.collection.find_one({"ubigeo": localidad_data.ubigeo})
            if existing:
                raise ValueError(f"Ya existe una localidad con el UBIGEO {localidad_data.ubigeo}")

        # Crear documento
        localidad_dict = localidad_data.model_dump()
        localidad_dict.update({
            "_id": ObjectId(),
            "estaActiva": True,
            "fechaCreacion": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow()
        })

        # Insertar en la base de datos
        result = await self.collection.insert_one(localidad_dict)
        
        # Obtener el documento creado
        created_localidad = await self.collection.find_one({"_id": result.inserted_id})
        return self._document_to_localidad(created_localidad)

    async def get_localidades(
        self, 
        filtros: Optional[FiltroLocalidades] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Localidad]:
        """Obtener localidades con filtros opcionales"""
        query = {}
        
        if filtros:
            if filtros.nombre:
                query["nombre"] = {"$regex": filtros.nombre, "$options": "i"}
            if filtros.tipo:
                query["tipo"] = filtros.tipo
            if filtros.departamento:
                query["departamento"] = {"$regex": filtros.departamento, "$options": "i"}
            if filtros.provincia:
                query["provincia"] = {"$regex": filtros.provincia, "$options": "i"}
            if filtros.estaActiva is not None:
                query["estaActiva"] = filtros.estaActiva

        cursor = self.collection.find(query).skip(skip).limit(limit).sort("nombre", 1)
        localidades = []
        
        async for doc in cursor:
            localidades.append(self._document_to_localidad(doc))
            
        return localidades

    async def get_localidades_paginadas(
        self,
        pagina: int = 1,
        limite: int = 10,
        filtros: Optional[FiltroLocalidades] = None
    ) -> LocalidadesPaginadas:
        """Obtener localidades paginadas"""
        skip = (pagina - 1) * limite
        
        # Construir query
        query = {}
        if filtros:
            if filtros.nombre:
                query["nombre"] = {"$regex": filtros.nombre, "$options": "i"}
            if filtros.tipo:
                query["tipo"] = filtros.tipo
            if filtros.departamento:
                query["departamento"] = {"$regex": filtros.departamento, "$options": "i"}
            if filtros.provincia:
                query["provincia"] = {"$regex": filtros.provincia, "$options": "i"}
            if filtros.estaActiva is not None:
                query["estaActiva"] = filtros.estaActiva

        # Contar total
        total = await self.collection.count_documents(query)
        
        # Obtener localidades
        localidades = await self.get_localidades(filtros, skip, limite)
        
        total_paginas = math.ceil(total / limite) if total > 0 else 1
        
        return LocalidadesPaginadas(
            localidades=localidades,
            total=total,
            pagina=pagina,
            totalPaginas=total_paginas
        )

    async def get_localidad_by_id(self, localidad_id: str) -> Optional[Localidad]:
        """Obtener localidad por ID"""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(localidad_id)})
            return self._document_to_localidad(doc) if doc else None
        except:
            return None

    async def update_localidad(self, localidad_id: str, localidad_data: LocalidadUpdate) -> Optional[Localidad]:
        """Actualizar localidad"""
        try:
            # Verificar que existe
            existing = await self.collection.find_one({"_id": ObjectId(localidad_id)})
            if not existing:
                return None

            # Verificar UBIGEO único si se está actualizando y se proporciona
            update_data = localidad_data.model_dump(exclude_unset=True)
            if "ubigeo" in update_data and update_data["ubigeo"]:
                ubigeo_exists = await self.collection.find_one({
                    "ubigeo": update_data["ubigeo"],
                    "_id": {"$ne": ObjectId(localidad_id)}
                })
                if ubigeo_exists:
                    raise ValueError(f"Ya existe una localidad con el UBIGEO {update_data['ubigeo']}")

            # Verificar código único si se está actualizando (compatibilidad)
            if "codigo" in update_data and update_data["codigo"]:
                codigo_exists = await self.collection.find_one({
                    "codigo": update_data["codigo"],
                    "_id": {"$ne": ObjectId(localidad_id)}
                })
                if codigo_exists:
                    raise ValueError(f"Ya existe una localidad con el código {update_data['codigo']}")

            # Actualizar fecha de modificación
            update_data["fechaActualizacion"] = datetime.utcnow()

            # Actualizar documento
            await self.collection.update_one(
                {"_id": ObjectId(localidad_id)},
                {"$set": update_data}
            )

            # Obtener documento actualizado
            updated_doc = await self.collection.find_one({"_id": ObjectId(localidad_id)})
            return self._document_to_localidad(updated_doc)
        except Exception as e:
            if "Ya existe una localidad" in str(e):
                raise e
            return None

    async def delete_localidad(self, localidad_id: str) -> bool:
        """Eliminar (desactivar) localidad"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(localidad_id)},
                {"$set": {"estaActiva": False, "fechaActualizacion": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except:
            return False

    async def toggle_estado_localidad(self, localidad_id: str) -> Optional[Localidad]:
        """Cambiar estado activo/inactivo de localidad"""
        try:
            localidad = await self.get_localidad_by_id(localidad_id)
            if not localidad:
                return None

            nuevo_estado = not localidad.estaActiva
            await self.collection.update_one(
                {"_id": ObjectId(localidad_id)},
                {"$set": {"estaActiva": nuevo_estado, "fechaActualizacion": datetime.utcnow()}}
            )

            return await self.get_localidad_by_id(localidad_id)
        except:
            return None

    async def validar_codigo_unico(self, codigo: str, id_excluir: Optional[str] = None) -> bool:
        """Validar que un código sea único"""
        query = {"codigo": codigo}
        if id_excluir:
            try:
                query["_id"] = {"$ne": ObjectId(id_excluir)}
            except:
                pass

        existing = await self.collection.find_one(query)
        return existing is None

    async def validar_ubigeo_unico(self, ubigeo: str, id_excluir: Optional[str] = None) -> bool:
        """Validar que un UBIGEO sea único"""
        query = {"ubigeo": ubigeo}
        if id_excluir:
            try:
                query["_id"] = {"$ne": ObjectId(id_excluir)}
            except:
                pass

        existing = await self.collection.find_one(query)
        return existing is None

    async def get_localidades_activas(self) -> List[Localidad]:
        """Obtener solo localidades activas"""
        filtros = FiltroLocalidades(estaActiva=True)
        return await self.get_localidades(filtros)

    async def buscar_localidades(self, termino: str) -> List[Localidad]:
        """Buscar localidades por término"""
        query = {
            "$or": [
                {"nombre": {"$regex": termino, "$options": "i"}},
                {"codigo": {"$regex": termino, "$options": "i"}},
                {"departamento": {"$regex": termino, "$options": "i"}},
                {"provincia": {"$regex": termino, "$options": "i"}}
            ],
            "estaActiva": True
        }
        
        cursor = self.collection.find(query).sort("nombre", 1).limit(20)
        localidades = []
        
        async for doc in cursor:
            localidades.append(self._document_to_localidad(doc))
            
        return localidades

    async def calcular_distancia(self, origen_id: str, destino_id: str) -> float:
        """Calcular distancia entre dos localidades"""
        origen = await self.get_localidad_by_id(origen_id)
        destino = await self.get_localidad_by_id(destino_id)
        
        if not origen or not destino:
            return 0.0

        # Si ambas tienen coordenadas, calcular distancia real
        if origen.coordenadas and destino.coordenadas:
            return self._calcular_distancia_haversine(
                origen.coordenadas.latitud,
                origen.coordenadas.longitud,
                destino.coordenadas.latitud,
                destino.coordenadas.longitud
            )

        # Distancias aproximadas por defecto
        distancias_aproximadas = {
            f"{origen.codigo}-{destino.codigo}": self._obtener_distancia_aproximada(origen.codigo, destino.codigo),
            f"{destino.codigo}-{origen.codigo}": self._obtener_distancia_aproximada(destino.codigo, origen.codigo)
        }
        
        clave1 = f"{origen.codigo}-{destino.codigo}"
        clave2 = f"{destino.codigo}-{origen.codigo}"
        
        return distancias_aproximadas.get(clave1, distancias_aproximadas.get(clave2, 100.0))

    def _calcular_distancia_haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calcular distancia usando fórmula de Haversine"""
        R = 6371  # Radio de la Tierra en km
        
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c

    def _obtener_distancia_aproximada(self, codigo_origen: str, codigo_destino: str) -> float:
        """Obtener distancia aproximada entre localidades conocidas"""
        distancias = {
            'PUN001-JUL001': 45,    # Puno - Juliaca
            'PUN001-LIM001': 1320,  # Puno - Lima
            'PUN001-ARE001': 290,   # Puno - Arequipa
            'PUN001-CUS001': 390,   # Puno - Cusco
            'JUL001-LIM001': 1275,  # Juliaca - Lima
            'JUL001-ARE001': 280,   # Juliaca - Arequipa
            'PUN001-LAP001': 150,   # Puno - La Paz
            'DES001-LAP001': 10,    # Desaguadero - La Paz
        }
        
        return distancias.get(f"{codigo_origen}-{codigo_destino}", 100.0)

    def _document_to_localidad(self, doc: Dict[str, Any]) -> Localidad:
        """Convertir documento de MongoDB a modelo Localidad"""
        if not doc:
            return None
            
        # Convertir ObjectId a string
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        
        return Localidad(**doc)

    async def inicializar_localidades_default(self) -> List[Localidad]:
        """Inicializar localidades por defecto si no existen"""
        count = await self.collection.count_documents({})
        if count > 0:
            return await self.get_localidades_activas()

        # Localidades por defecto para Puno
        localidades_default = [
            {
                "ubigeo": "210101",
                "ubigeo_identificador_mcp": "210101-MCP-001",
                "departamento": "PUNO",
                "provincia": "PUNO",
                "distrito": "PUNO",
                "municipalidad_centro_poblado": "Municipalidad Provincial de Puno",
                "nivel_territorial": "DISTRITO",
                "nombre": "Puno",
                "codigo": "PUN001",
                "tipo": "CIUDAD",
                "descripcion": "Capital del departamento de Puno",
                "coordenadas": {"latitud": -15.8402, "longitud": -70.0219}
            },
            {
                "ubigeo": "211301",
                "ubigeo_identificador_mcp": "211301-MCP-001",
                "departamento": "PUNO",
                "provincia": "SAN ROMAN",
                "distrito": "JULIACA",
                "municipalidad_centro_poblado": "Municipalidad Provincial de San Román",
                "nivel_territorial": "DISTRITO",
                "nombre": "Juliaca",
                "codigo": "JUL001", 
                "tipo": "CIUDAD",
                "descripcion": "Ciudad comercial importante de Puno",
                "coordenadas": {"latitud": -15.5000, "longitud": -70.1333}
            },
            {
                "ubigeo": "150101",
                "ubigeo_identificador_mcp": "150101-MCP-001",
                "departamento": "LIMA",
                "provincia": "LIMA",
                "distrito": "LIMA",
                "municipalidad_centro_poblado": "Municipalidad Metropolitana de Lima",
                "nivel_territorial": "DISTRITO",
                "nombre": "Lima",
                "codigo": "LIM001",
                "tipo": "CIUDAD", 
                "descripcion": "Capital del Perú",
                "coordenadas": {"latitud": -12.0464, "longitud": -77.0428}
            },
            {
                "ubigeo": "040101",
                "ubigeo_identificador_mcp": "040101-MCP-001",
                "departamento": "AREQUIPA",
                "provincia": "AREQUIPA",
                "distrito": "AREQUIPA",
                "municipalidad_centro_poblado": "Municipalidad Provincial de Arequipa",
                "nivel_territorial": "DISTRITO",
                "nombre": "Arequipa",
                "codigo": "ARE001",
                "tipo": "CIUDAD",
                "descripcion": "Ciudad Blanca del sur del Perú",
                "coordenadas": {"latitud": -16.4090, "longitud": -71.5375}
            },
            {
                "ubigeo": "080101",
                "ubigeo_identificador_mcp": "080101-MCP-001",
                "departamento": "CUSCO",
                "provincia": "CUSCO",
                "distrito": "CUSCO",
                "municipalidad_centro_poblado": "Municipalidad Provincial del Cusco",
                "nivel_territorial": "DISTRITO",
                "nombre": "Cusco",
                "codigo": "CUS001",
                "tipo": "CIUDAD",
                "descripcion": "Capital histórica del Perú",
                "coordenadas": {"latitud": -13.5319, "longitud": -71.9675}
            }
        ]

        localidades_creadas = []
        for localidad_data in localidades_default:
            try:
                localidad_create = LocalidadCreate(**localidad_data)
                localidad = await self.create_localidad(localidad_create)
                localidades_creadas.append(localidad)
            except Exception as e:
                print(f"Error creando localidad {localidad_data['nombre']}: {e}")

        return localidades_creadas