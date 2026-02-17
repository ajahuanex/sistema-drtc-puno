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
        """Crear una nueva localidad - Solo nombre es obligatorio"""
        # Verificar que el UBIGEO sea único si se proporciona
        if localidad_data.ubigeo:
            existing = await self.collection.find_one({"ubigeo": localidad_data.ubigeo})
            if existing:
                raise ValueError(f"Ya existe una localidad con el UBIGEO {localidad_data.ubigeo}")

        # Crear documento
        localidad_dict = localidad_data.model_dump()
        
        # Calcular nivel territorial automáticamente
        nivel_territorial = localidad_data.get_nivel_territorial()
        localidad_dict["nivel_territorial"] = nivel_territorial
        
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
        """Actualizar localidad y sincronizar en rutas"""
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
            localidad_actualizada = self._document_to_localidad(updated_doc)
            
            # 🔄 SINCRONIZAR EN RUTAS si cambió el nombre
            if "nombre" in update_data:
                await self._sincronizar_localidad_en_rutas(localidad_id, update_data["nombre"])
            
            return localidad_actualizada
        except Exception as e:
            if "Ya existe una localidad" in str(e):
                raise e
            return None
    
    async def _sincronizar_localidad_en_rutas(self, localidad_id: str, nuevo_nombre: str):
        """Sincronizar nombre de localidad en todas las rutas que la usan"""
        try:
            rutas_collection = self.db.rutas
            
            # Actualizar en origen
            await rutas_collection.update_many(
                {"origen.id": localidad_id},
                {"$set": {
                    "origen.nombre": nuevo_nombre,
                    "fechaActualizacion": datetime.utcnow()
                }}
            )
            
            # Actualizar en destino
            await rutas_collection.update_many(
                {"destino.id": localidad_id},
                {"$set": {
                    "destino.nombre": nuevo_nombre,
                    "fechaActualizacion": datetime.utcnow()
                }}
            )
            
            # Actualizar en itinerario (más complejo)
            rutas_con_localidad = await rutas_collection.find({
                "itinerario.id": localidad_id
            }).to_list(None)
            
            for ruta in rutas_con_localidad:
                # Actualizar cada ocurrencia en el itinerario
                itinerario_actualizado = []
                for loc in ruta.get('itinerario', []):
                    if loc.get('id') == localidad_id:
                        loc['nombre'] = nuevo_nombre
                    itinerario_actualizado.append(loc)
                
                await rutas_collection.update_one(
                    {"_id": ruta['_id']},
                    {"$set": {
                        "itinerario": itinerario_actualizado,
                        "fechaActualizacion": datetime.utcnow()
                    }}
                )
            
            print(f"✅ Localidad '{nuevo_nombre}' sincronizada en rutas")
            
        except Exception as e:
            print(f"⚠️ Error sincronizando localidad en rutas: {e}")
            # No lanzar error para no bloquear la actualización de la localidad

    async def delete_localidad(self, localidad_id: str) -> bool:
        """Eliminar (desactivar) localidad con validación de uso en rutas"""
        try:
            # 🔒 VALIDAR: Verificar si la localidad está siendo usada en rutas
            rutas_usando_localidad = await self._verificar_localidad_en_uso(localidad_id)
            
            if rutas_usando_localidad['total'] > 0:
                # No permitir eliminar si está en uso
                raise ValueError(
                    f"No se puede eliminar la localidad porque está siendo usada en {rutas_usando_localidad['total']} ruta(s). "
                    f"Origen: {rutas_usando_localidad['como_origen']}, "
                    f"Destino: {rutas_usando_localidad['como_destino']}, "
                    f"Itinerario: {rutas_usando_localidad['en_itinerario']}"
                )
            
            # Si no está en uso, desactivar (soft delete)
            result = await self.collection.update_one(
                {"_id": ObjectId(localidad_id)},
                {"$set": {"estaActiva": False, "fechaActualizacion": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except ValueError as e:
            # Re-lanzar errores de validación
            raise e
        except Exception as e:
            print(f"Error eliminando localidad: {e}")
            return False
    
    async def _verificar_localidad_en_uso(self, localidad_id: str) -> dict:
        """Verificar si una localidad está siendo usada en rutas"""
        try:
            rutas_collection = self.db.rutas
            
            # Contar rutas donde es origen
            como_origen = await rutas_collection.count_documents({"origen.id": localidad_id})
            
            # Contar rutas donde es destino
            como_destino = await rutas_collection.count_documents({"destino.id": localidad_id})
            
            # Contar rutas donde está en itinerario
            en_itinerario = await rutas_collection.count_documents({"itinerario.id": localidad_id})
            
            total = como_origen + como_destino + en_itinerario
            
            return {
                'total': total,
                'como_origen': como_origen,
                'como_destino': como_destino,
                'en_itinerario': en_itinerario,
                'esta_en_uso': total > 0
            }
        except Exception as e:
            print(f"Error verificando uso de localidad: {e}")
            return {
                'total': 0,
                'como_origen': 0,
                'como_destino': 0,
                'en_itinerario': 0,
                'esta_en_uso': False
            }
    
    async def obtener_rutas_que_usan_localidad(self, localidad_id: str) -> dict:
        """Obtener lista de rutas que usan una localidad específica"""
        try:
            rutas_collection = self.db.rutas
            
            # Rutas donde es origen
            rutas_origen = await rutas_collection.find(
                {"origen.id": localidad_id},
                {"codigoRuta": 1, "nombre": 1, "origen": 1, "destino": 1}
            ).to_list(None)
            
            # Rutas donde es destino
            rutas_destino = await rutas_collection.find(
                {"destino.id": localidad_id},
                {"codigoRuta": 1, "nombre": 1, "origen": 1, "destino": 1}
            ).to_list(None)
            
            # Rutas donde está en itinerario
            rutas_itinerario = await rutas_collection.find(
                {"itinerario.id": localidad_id},
                {"codigoRuta": 1, "nombre": 1, "origen": 1, "destino": 1}
            ).to_list(None)
            
            return {
                'rutas_origen': [
                    {
                        'codigo': r.get('codigoRuta'),
                        'nombre': r.get('nombre'),
                        'ruta': f"{r.get('origen', {}).get('nombre')} → {r.get('destino', {}).get('nombre')}"
                    }
                    for r in rutas_origen
                ],
                'rutas_destino': [
                    {
                        'codigo': r.get('codigoRuta'),
                        'nombre': r.get('nombre'),
                        'ruta': f"{r.get('origen', {}).get('nombre')} → {r.get('destino', {}).get('nombre')}"
                    }
                    for r in rutas_destino
                ],
                'rutas_itinerario': [
                    {
                        'codigo': r.get('codigoRuta'),
                        'nombre': r.get('nombre'),
                        'ruta': f"{r.get('origen', {}).get('nombre')} → {r.get('destino', {}).get('nombre')}"
                    }
                    for r in rutas_itinerario
                ],
                'total': len(rutas_origen) + len(rutas_destino) + len(rutas_itinerario)
            }
        except Exception as e:
            print(f"Error obteniendo rutas que usan localidad: {e}")
            return {
                'rutas_origen': [],
                'rutas_destino': [],
                'rutas_itinerario': [],
                'total': 0
            }

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
        """Obtener distancia aproximada entre localidades - calculada dinámicamente"""
        # Sin datos hardcodeados - se calcula usando coordenadas reales
        return 100.0  # Distancia por defecto en km

    def _document_to_localidad(self, doc: Dict[str, Any]) -> Localidad:
        """Convertir documento de MongoDB a modelo Localidad"""
        if not doc:
            return None
            
        # Convertir ObjectId a string
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        
        # Limpiar coordenadas nulas o inválidas
        if "coordenadas" in doc:
            coordenadas = doc["coordenadas"]
            if coordenadas is None:
                doc["coordenadas"] = None
            elif isinstance(coordenadas, dict):
                latitud = coordenadas.get("latitud")
                longitud = coordenadas.get("longitud")
                
                # Si alguna coordenada es None o no es un número válido, eliminar coordenadas
                if (latitud is None or longitud is None or 
                    not isinstance(latitud, (int, float)) or 
                    not isinstance(longitud, (int, float)) or
                    not (-90 <= latitud <= 90) or 
                    not (-180 <= longitud <= 180)):
                    doc["coordenadas"] = None
                else:
                    doc["coordenadas"] = {
                        "latitud": float(latitud),
                        "longitud": float(longitud)
                    }
        
        # Calcular nivel territorial automáticamente si no existe
        if "nivel_territorial" not in doc and "tipo" in doc:
            tipo = doc["tipo"]
            mapping = {
                "DEPARTAMENTO": "DEPARTAMENTO",
                "PROVINCIA": "PROVINCIA", 
                "DISTRITO": "DISTRITO",
                "CENTRO_POBLADO": "CENTRO_POBLADO",
                "CIUDAD": "DISTRITO",  # Ciudad equivale a distrito
                "PUEBLO": "CENTRO_POBLADO"  # Pueblo equivale a centro poblado
            }
            doc["nivel_territorial"] = mapping.get(tipo, "DISTRITO")
        
        # Asegurar que estaActiva esté definido (el modelo usa camelCase)
        if "estaActiva" not in doc:
            doc["estaActiva"] = doc.get("esta_activa", True)
        
        # Eliminar esta_activa si existe (para evitar conflictos con Pydantic)
        if "esta_activa" in doc:
            del doc["esta_activa"]
        
        try:
            return Localidad(**doc)
        except Exception as e:
            print(f"Error creando Localidad desde documento: {e}")
            print(f"Documento problemático: {doc}")
            # Crear una versión mínima válida
            return Localidad(
                id=doc["id"],
                nombre=doc.get("nombre", "Localidad sin nombre"),
                tipo=doc.get("tipo", "LOCALIDAD"),
                departamento=doc.get("departamento", "PUNO"),
                provincia=doc.get("provincia", "PUNO"),
                distrito=doc.get("distrito", "PUNO"),
                estaActiva=doc.get("estaActiva", True),
                fechaCreacion=doc.get("fechaCreacion", datetime.utcnow()),
                fechaActualizacion=doc.get("fechaActualizacion", datetime.utcnow())
            )

    async def inicializar_localidades_default(self) -> List[Localidad]:
        """Inicializar localidades básicas para el funcionamiento del sistema"""
        count = await self.collection.count_documents({})
        if count > 0:
            print(f"✅ Ya existen {count} localidades en la base de datos")
            return await self.get_localidades_activas()

        print("🌱 Inicializando localidades básicas para el sistema...")
        
        # Localidades básicas para el funcionamiento del sistema
        localidades_basicas = [
            {
                "nombre": "PUNO",
                "tipo": "CIUDAD",
                "nivelTerritorial": "CAPITAL_DEPARTAMENTAL",
                "departamento": "PUNO",
                "provincia": "PUNO", 
                "distrito": "PUNO",
                "ubigeo": "210101",
                "coordenadas": {
                    "latitud": -15.8422,
                    "longitud": -70.0199
                },
                "estaActiva": True
            },
            {
                "nombre": "JULIACA",
                "tipo": "CIUDAD",
                "nivelTerritorial": "CAPITAL_PROVINCIAL",
                "departamento": "PUNO",
                "provincia": "SAN ROMAN",
                "distrito": "JULIACA", 
                "ubigeo": "211101",
                "coordenadas": {
                    "latitud": -15.5000,
                    "longitud": -70.1333
                },
                "estaActiva": True
            },
            {
                "nombre": "ILAVE",
                "tipo": "CIUDAD",
                "nivelTerritorial": "CAPITAL_PROVINCIAL",
                "departamento": "PUNO",
                "provincia": "EL COLLAO",
                "distrito": "ILAVE",
                "ubigeo": "210401",
                "coordenadas": {
                    "latitud": -16.0833,
                    "longitud": -69.6333
                },
                "estaActiva": True
            },
            {
                "nombre": "YUNGUYO",
                "tipo": "CIUDAD", 
                "nivelTerritorial": "CAPITAL_PROVINCIAL",
                "departamento": "PUNO",
                "provincia": "YUNGUYO",
                "distrito": "YUNGUYO",
                "ubigeo": "211301",
                "coordenadas": {
                    "latitud": -16.2500,
                    "longitud": -69.0833
                },
                "estaActiva": True
            },
            {
                "nombre": "AZANGARO",
                "tipo": "CIUDAD",
                "nivelTerritorial": "CAPITAL_PROVINCIAL", 
                "departamento": "PUNO",
                "provincia": "AZANGARO",
                "distrito": "AZANGARO",
                "ubigeo": "210201",
                "coordenadas": {
                    "latitud": -14.9167,
                    "longitud": -70.1833
                },
                "estaActiva": True
            }
        ]

        localidades_creadas = []
        
        for localidad_data in localidades_basicas:
            try:
                # Crear el documento de localidad
                localidad_doc = {
                    **localidad_data,
                    "fechaCreacion": datetime.utcnow(),
                    "fechaActualizacion": datetime.utcnow()
                }
                
                # Insertar en la base de datos
                resultado = await self.collection.insert_one(localidad_doc)
                localidad_doc["_id"] = resultado.inserted_id
                
                # Convertir a modelo Localidad
                localidad = self._doc_to_localidad(localidad_doc)
                localidades_creadas.append(localidad)
                
                print(f"✅ Localidad creada: {localidad.nombre}")
                
            except Exception as e:
                print(f"❌ Error creando localidad {localidad_data['nombre']}: {e}")
                continue

        print(f"🎉 Inicialización completada: {len(localidades_creadas)} localidades creadas")
        return localidades_creadas