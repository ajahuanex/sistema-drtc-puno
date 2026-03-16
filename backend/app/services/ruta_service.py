"""
Servicio para gestión de rutas de transporte
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.ruta import Ruta, RutaCreate, RutaUpdate, EstadoRuta, LocalidadEmbebida, LocalidadItinerario
from app.services.localidad_service import LocalidadService


class RutaService:
    """Servicio para operaciones CRUD de rutas"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.rutas_collection = db["rutas"]
        self.resoluciones_collection = db["resoluciones"]
        self.empresas_collection = db["empresas"]
        self.localidad_service = LocalidadService(db)
    
    def _format_ruta_response(self, ruta: Dict[str, Any]) -> Dict[str, Any]:
        """Helper para formatear la respuesta de ruta de manera consistente"""
        # La empresa está directamente embebida en la ruta
        empresa_data = ruta.get("empresa", {})
        resolucion_data = ruta.get("resolucion", {})
        
        return {
            "id": str(ruta.pop("_id")),
            "codigoRuta": ruta.get("codigoRuta", ""),
            "nombre": ruta.get("nombre", ""),
            
            # Localidades embebidas
            "origen": ruta.get("origen", {}),
            "destino": ruta.get("destino", {}),
            "itinerario": ruta.get("itinerario", []),
            
            # Empresa embebida
            "empresa": {
                "id": empresa_data.get("id", ""),
                "ruc": empresa_data.get("ruc", ""),
                "razonSocial": empresa_data.get("razonSocial", "")
            },
            
            # Resolución embebida
            "resolucion": {
                "id": resolucion_data.get("id", ""),
                "nroResolucion": resolucion_data.get("nroResolucion", ""),
                "tipoResolucion": resolucion_data.get("tipoResolucion", ""),
                "estado": resolucion_data.get("estado", "")
            },
            
            # Frecuencia
            "frecuencia": {
                "tipo": ruta.get("frecuencia", {}).get("tipo", "DIARIO"),
                "cantidad": ruta.get("frecuencia", {}).get("cantidad", 1),
                "dias": ruta.get("frecuencia", {}).get("dias", []),
                "descripcion": ruta.get("frecuencia", {}).get("descripcion", "Sin frecuencia")
            },
            
            "horarios": [],
            "tipoRuta": ruta.get("tipoRuta", "INTERPROVINCIAL"),
            "tipoServicio": ruta.get("tipoServicio", "PASAJEROS"),
            "estado": ruta.get("estado", "ACTIVA"),
            "estaActivo": ruta.get("estaActivo", True),
            "fechaRegistro": ruta.get("fechaRegistro", datetime.utcnow()),
            "fechaActualizacion": ruta.get("fechaActualizacion"),
            
            # Campos opcionales
            "distancia": ruta.get("distancia"),
            "tiempoEstimado": ruta.get("tiempoEstimado"),
            "tarifaBase": ruta.get("tarifaBase"),
            "capacidadMaxima": ruta.get("capacidadMaxima"),
            "restricciones": ruta.get("restricciones", []),
            "observaciones": ruta.get("observaciones"),
            "descripcion": ruta.get("descripcion")
        }
    
    async def validar_localidad_existe(self, localidad_id: str, nombre_campo: str) -> LocalidadEmbebida:
        """
        Validar que una localidad existe y obtener sus datos embebidos
        
        Args:
            localidad_id: ID de la localidad a validar
            nombre_campo: Nombre del campo para el error (origen, destino, etc.)
            
        Returns:
            LocalidadEmbebida con los datos de la localidad
            
        Raises:
            HTTPException: Si la localidad no existe o no está activa
        """
        try:
            localidad = await self.localidad_service.get_localidad_by_id(localidad_id)
            
            if not localidad:
                raise HTTPException(
                    status_code=404,
                    detail=f"Localidad {nombre_campo} con ID {localidad_id} no encontrada"
                )
            
            if not localidad.estaActiva:
                raise HTTPException(
                    status_code=400,
                    detail=f"La localidad {nombre_campo} '{localidad.nombre}' no está activa"
                )
            
            # Retornar LocalidadEmbebida con información completa
            return LocalidadEmbebida(
                id=localidad.id,
                nombre=localidad.nombre,
                tipo=localidad.tipo if hasattr(localidad, 'tipo') else None,
                ubigeo=localidad.ubigeo if hasattr(localidad, 'ubigeo') else None,
                departamento=localidad.departamento if hasattr(localidad, 'departamento') else None,
                provincia=localidad.provincia if hasattr(localidad, 'provincia') else None,
                distrito=localidad.distrito if hasattr(localidad, 'distrito') else None,
                coordenadas=localidad.coordenadas if hasattr(localidad, 'coordenadas') else None
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al validar localidad {nombre_campo}: {str(e)}"
            )
    
    async def validar_itinerario(self, itinerario_data: List[Dict[str, Any]]) -> List[LocalidadItinerario]:
        """
        Validar y procesar itinerario de localidades
        
        Args:
            itinerario_data: Lista de diccionarios con {id, nombre, orden}
            
        Returns:
            Lista de LocalidadItinerario validadas
            
        Raises:
            HTTPException: Si hay errores en el itinerario
        """
        if not itinerario_data:
            return []
        
        localidades_itinerario = []
        ordenes_usados = set()
        
        for item in itinerario_data:
            # Validar estructura
            if not isinstance(item, dict) or 'id' not in item or 'orden' not in item:
                raise HTTPException(
                    status_code=400,
                    detail="Cada elemento del itinerario debe tener 'id' y 'orden'"
                )
            
            localidad_id = item['id']
            orden = item['orden']
            
            # Validar orden único
            if orden in ordenes_usados:
                raise HTTPException(
                    status_code=400,
                    detail=f"El orden {orden} está duplicado en el itinerario"
                )
            ordenes_usados.add(orden)
            
            # Validar que la localidad existe
            localidad = await self.localidad_service.get_localidad_by_id(localidad_id)
            if not localidad:
                raise HTTPException(
                    status_code=404,
                    detail=f"Localidad del itinerario con ID {localidad_id} no encontrada"
                )
            
            if not localidad.estaActiva:
                raise HTTPException(
                    status_code=400,
                    detail=f"La localidad del itinerario '{localidad.nombre}' no está activa"
                )
            
            # Crear LocalidadItinerario con información completa
            localidades_itinerario.append(LocalidadItinerario(
                id=localidad.id,
                nombre=localidad.nombre,
                tipo=localidad.tipo if hasattr(localidad, 'tipo') else None,
                ubigeo=localidad.ubigeo if hasattr(localidad, 'ubigeo') else None,
                departamento=localidad.departamento if hasattr(localidad, 'departamento') else None,
                provincia=localidad.provincia if hasattr(localidad, 'provincia') else None,
                distrito=localidad.distrito if hasattr(localidad, 'distrito') else None,
                coordenadas=localidad.coordenadas if hasattr(localidad, 'coordenadas') else None,
                orden=orden
            ))
        
        # Ordenar por orden
        localidades_itinerario.sort(key=lambda x: x.orden)
        
        return localidades_itinerario
    
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
            # 1. Validar localidades (origen, destino e itinerario)
            origen_embebido = await self.validar_localidad_existe(ruta_data.origen.id, "origen")
            destino_embebido = await self.validar_localidad_existe(ruta_data.destino.id, "destino")
            
            # Validar que origen y destino sean diferentes
            if ruta_data.origen.id == ruta_data.destino.id:
                raise HTTPException(
                    status_code=400,
                    detail="El origen y destino no pueden ser la misma localidad"
                )
            
            # Validar itinerario si se proporciona
            itinerario_validado = []
            if ruta_data.itinerario:
                itinerario_data = [
                    {"id": loc.id, "orden": loc.orden} 
                    for loc in ruta_data.itinerario
                ]
                itinerario_validado = await self.validar_itinerario(itinerario_data)
            
            # 2. Validar empresa
            empresa = await self.empresas_collection.find_one({
                "_id": ObjectId(ruta_data.empresa.id)
            })
            
            if not empresa:
                raise HTTPException(
                    status_code=404,
                    detail=f"Empresa con ID {ruta_data.empresa.id} no encontrada"
                )
            
            if not empresa.get("estaActivo", False):
                raise HTTPException(
                    status_code=400,
                    detail="La empresa no está activa"
                )
            
            # 3. Validar resolución VIGENTE y PADRE
            await self.validar_resolucion_vigente(ruta_data.resolucion.id)
            
            # 4. Validar código único en resolución
            await self.validar_codigo_unico(
                ruta_data.codigoRuta,
                ruta_data.resolucion.id
            )
            
            # 5. Preparar documento para inserción con datos embebidos validados
            ruta_dict = ruta_data.model_dump()
            
            print(f"🔍 DEBUG RUTA_SERVICE: Empresa recibida en ruta_data: {ruta_data.empresa}")
            print(f"🔍 DEBUG RUTA_SERVICE: Frecuencia recibida en ruta_data: {ruta_data.frecuencia}")
            print(f"🔍 DEBUG RUTA_SERVICE: ruta_dict empresa antes: {ruta_dict.get('empresa')}")
            print(f"🔍 DEBUG RUTA_SERVICE: ruta_dict frecuencia antes: {ruta_dict.get('frecuencia')}")
            
            # Actualizar con datos validados
            ruta_dict["origen"] = origen_embebido.model_dump()
            ruta_dict["destino"] = destino_embebido.model_dump()
            ruta_dict["itinerario"] = [loc.model_dump() for loc in itinerario_validado]
            
            print(f"🔍 DEBUG RUTA_SERVICE: ruta_dict empresa después: {ruta_dict.get('empresa')}")
            
            # Metadatos
            ruta_dict["fechaRegistro"] = datetime.utcnow()
            ruta_dict["fechaActualizacion"] = datetime.utcnow()
            ruta_dict["estaActivo"] = True
            ruta_dict["estado"] = EstadoRuta.ACTIVA
            
            # 6. Insertar ruta
            print(f"🔍 DEBUG RUTA_SERVICE: Insertando ruta en BD con empresa: {ruta_dict.get('empresa')}")
            result = await self.rutas_collection.insert_one(ruta_dict)
            ruta_id = str(result.inserted_id)
            print(f"🔍 DEBUG RUTA_SERVICE: Ruta insertada con ID: {ruta_id}")
            
            # Verificar lo que se guardó realmente
            ruta_guardada = await self.rutas_collection.find_one({"_id": result.inserted_id})
            print(f"🔍 DEBUG RUTA_SERVICE: Empresa en BD después de insertar: {ruta_guardada.get('empresa') if ruta_guardada else 'No encontrada'}")
            
            # 7. Actualizar relaciones en empresa
            await self.empresas_collection.update_one(
                {"_id": ObjectId(ruta_data.empresa.id)},
                {
                    "$addToSet": {"rutasAutorizadasIds": ruta_id},
                    "$set": {"fechaActualizacion": datetime.utcnow()}
                }
            )
            
            # 8. Actualizar relaciones en resolución
            await self.resoluciones_collection.update_one(
                {"_id": ObjectId(ruta_data.resolucion.id)},
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
            
            # Convertir a formato esperado
            empresa_data = ruta.get("empresa", {})  # Empresa está directamente en ruta.empresa
            resolucion_data = ruta.get("resolucion", {})
            
            ruta_dict = {
                "id": str(ruta.pop("_id")),
                "codigoRuta": ruta.get("codigoRuta", ""),
                "nombre": ruta.get("nombre", ""),
                
                # Localidades embebidas
                "origen": ruta.get("origen", {}),
                "destino": ruta.get("destino", {}),
                "itinerario": ruta.get("itinerario", []),
                
                # Empresa embebida
                "empresa": {
                    "id": empresa_data.get("id", ""),
                    "ruc": empresa_data.get("ruc", ""),
                    "razonSocial": empresa_data.get("razonSocial", "")
                },
                
                # Resolución embebida
                "resolucion": {
                    "id": resolucion_data.get("id", ""),
                    "nroResolucion": resolucion_data.get("nroResolucion", ""),
                    "tipoResolucion": resolucion_data.get("tipoResolucion", ""),
                    "estado": resolucion_data.get("estado", "")
                },
                
                # Frecuencia
                "frecuencia": {
                    "tipo": ruta.get("frecuencia", {}).get("tipo", "DIARIO"),
                    "cantidad": ruta.get("frecuencia", {}).get("cantidad", 1),
                    "dias": ruta.get("frecuencia", {}).get("dias", []),
                    "descripcion": ruta.get("frecuencias", "1 diario")
                },
                
                "horarios": [],
                "tipoRuta": ruta.get("tipoRuta", "INTERPROVINCIAL"),
                "tipoServicio": ruta.get("tipoServicio", "PASAJEROS"),
                "estado": ruta.get("estado", "ACTIVA"),
                "estaActivo": ruta.get("estaActivo", True),
                "fechaRegistro": ruta.get("fechaRegistro", datetime.utcnow()),
                "fechaActualizacion": ruta.get("fechaActualizacion"),
                
                # Campos opcionales
                "distancia": ruta.get("distancia"),
                "tiempoEstimado": ruta.get("tiempoEstimado"),
                "tarifaBase": ruta.get("tarifaBase"),
                "capacidadMaxima": ruta.get("capacidadMaxima"),
                "restricciones": ruta.get("restricciones", []),
                "observaciones": ruta.get("observaciones", ""),
                "descripcion": ruta.get("descripcion")
            }
            
            return Ruta(**ruta_dict)
            
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
            
            # Convertir a formato esperado
            rutas_convertidas = []
            for ruta in rutas:
                # La empresa está directamente embebida en la ruta
                empresa_data = ruta.get("empresa", {})
                resolucion_data = ruta.get("resolucion", {})
                
                ruta_dict = {
                    "id": str(ruta.pop("_id")),
                    "codigoRuta": ruta.get("codigoRuta", ""),
                    "nombre": ruta.get("nombre", ""),
                    
                    # Localidades embebidas
                    "origen": ruta.get("origen", {}),
                    "destino": ruta.get("destino", {}),
                    "itinerario": ruta.get("itinerario", []),
                    
                    # Empresa embebida
                    "empresa": {
                        "id": empresa_data.get("id", ""),
                        "ruc": empresa_data.get("ruc", ""),
                        "razonSocial": empresa_data.get("razonSocial", "")
                    },
                    
                    # Resolución embebida
                    "resolucion": {
                        "id": resolucion_data.get("id", ""),
                        "nroResolucion": resolucion_data.get("nroResolucion", ""),
                        "tipoResolucion": resolucion_data.get("tipoResolucion", ""),
                        "estado": resolucion_data.get("estado", "")
                    },
                    
                    # Frecuencia
                    "frecuencia": {
                        "tipo": ruta.get("frecuencia", {}).get("tipo", "DIARIO"),
                        "cantidad": ruta.get("frecuencia", {}).get("cantidad", 1),
                        "dias": ruta.get("frecuencia", {}).get("dias", []),
                        "descripcion": ruta.get("frecuencia", {}).get("descripcion", "Sin frecuencia")
                    },
                    
                    
                    "horarios": [],
                    "tipoRuta": ruta.get("tipoRuta", "INTERPROVINCIAL"),
                    "tipoServicio": ruta.get("tipoServicio", "PASAJEROS"),
                    "estado": ruta.get("estado", "ACTIVA"),
                    "estaActivo": ruta.get("estaActivo", True),
                    "fechaRegistro": ruta.get("fechaRegistro", datetime.utcnow()),
                    "fechaActualizacion": ruta.get("fechaActualizacion"),
                    
                    # Campos opcionales
                    "distancia": ruta.get("distancia"),
                    "tiempoEstimado": ruta.get("tiempoEstimado"),
                    "tarifaBase": ruta.get("tarifaBase"),
                    "capacidadMaxima": ruta.get("capacidadMaxima"),
                    "restricciones": ruta.get("restricciones", []),
                    "observaciones": ruta.get("observaciones", ""),
                    "descripcion": ruta.get("descripcion")
                }
                rutas_convertidas.append(ruta_dict)
            
            return rutas_convertidas
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al obtener rutas: {str(e)}"
            )
    
    async def get_rutas_por_empresa(self, empresa_id: str) -> List[Ruta]:
        """Obtener rutas de una empresa específica"""
        try:
            rutas = await self.rutas_collection.find({
                "resolucion.empresa.id": empresa_id,
                "estaActivo": True
            }).to_list(length=None)
            
            # Convertir a formato esperado
            rutas_convertidas = []
            for ruta in rutas:
                # La empresa está directamente embebida en la ruta
                empresa_data = ruta.get("empresa", {})
                resolucion_data = ruta.get("resolucion", {})
                
                ruta_dict = {
                    "id": str(ruta.pop("_id")),
                    "codigoRuta": ruta.get("codigoRuta", ""),
                    "nombre": ruta.get("nombre", ""),
                    
                    # Localidades embebidas
                    "origen": ruta.get("origen", {}),
                    "destino": ruta.get("destino", {}),
                    "itinerario": ruta.get("itinerario", []),
                    
                    # Empresa embebida
                    "empresa": {
                        "id": empresa_data.get("id", ""),
                        "ruc": empresa_data.get("ruc", ""),
                        "razonSocial": empresa_data.get("razonSocial", "")
                    },
                    
                    # Resolución embebida
                    "resolucion": {
                        "id": resolucion_data.get("id", ""),
                        "nroResolucion": resolucion_data.get("nroResolucion", ""),
                        "tipoResolucion": resolucion_data.get("tipoResolucion", ""),
                        "estado": resolucion_data.get("estado", "")
                    },
                    
                    # Frecuencia
                    "frecuencia": {
                        "tipo": ruta.get("frecuencia", {}).get("tipo", "DIARIO"),
                        "cantidad": ruta.get("frecuencia", {}).get("cantidad", 1),
                        "dias": ruta.get("frecuencia", {}).get("dias", []),
                        "descripcion": ruta.get("frecuencia", {}).get("descripcion", "Sin frecuencia")
                    },
                    
                    
                    "horarios": [],
                    "tipoRuta": ruta.get("tipoRuta", "INTERPROVINCIAL"),
                    "tipoServicio": ruta.get("tipoServicio", "PASAJEROS"),
                    "estado": ruta.get("estado", "ACTIVA"),
                    "estaActivo": ruta.get("estaActivo", True),
                    "fechaRegistro": ruta.get("fechaRegistro", datetime.utcnow()),
                    "fechaActualizacion": ruta.get("fechaActualizacion"),
                    
                    # Campos opcionales
                    "distancia": ruta.get("distancia"),
                    "tiempoEstimado": ruta.get("tiempoEstimado"),
                    "tarifaBase": ruta.get("tarifaBase"),
                    "capacidadMaxima": ruta.get("capacidadMaxima"),
                    "restricciones": ruta.get("restricciones", []),
                    "observaciones": ruta.get("observaciones", ""),
                    "descripcion": ruta.get("descripcion")
                }
                rutas_convertidas.append(ruta_dict)
            
            return rutas_convertidas
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al obtener rutas por empresa: {str(e)}"
            )
    
    async def get_rutas_por_resolucion(self, resolucion_id: str) -> List[Ruta]:
        """Obtener rutas de una resolución específica"""
        try:
            rutas = await self.rutas_collection.find({
                "resolucion.id": resolucion_id,
                "estaActivo": True
            }).to_list(length=None)
            
            # Convertir a formato esperado
            rutas_convertidas = []
            for ruta in rutas:
                # La empresa está directamente embebida en la ruta
                empresa_data = ruta.get("empresa", {})
                resolucion_data = ruta.get("resolucion", {})
                
                ruta_dict = {
                    "id": str(ruta.pop("_id")),
                    "codigoRuta": ruta.get("codigoRuta", ""),
                    "nombre": ruta.get("nombre", ""),
                    
                    # Localidades embebidas
                    "origen": ruta.get("origen", {}),
                    "destino": ruta.get("destino", {}),
                    "itinerario": ruta.get("itinerario", []),
                    
                    # Empresa embebida
                    "empresa": {
                        "id": empresa_data.get("id", ""),
                        "ruc": empresa_data.get("ruc", ""),
                        "razonSocial": empresa_data.get("razonSocial", "")
                    },
                    
                    # Resolución embebida
                    "resolucion": {
                        "id": resolucion_data.get("id", ""),
                        "nroResolucion": resolucion_data.get("nroResolucion", ""),
                        "tipoResolucion": resolucion_data.get("tipoResolucion", ""),
                        "estado": resolucion_data.get("estado", "")
                    },
                    
                    # Frecuencia
                    "frecuencia": {
                        "tipo": ruta.get("frecuencia", {}).get("tipo", "DIARIO"),
                        "cantidad": ruta.get("frecuencia", {}).get("cantidad", 1),
                        "dias": ruta.get("frecuencia", {}).get("dias", []),
                        "descripcion": ruta.get("frecuencia", {}).get("descripcion", "Sin frecuencia")
                    },
                    
                    
                    "horarios": [],
                    "tipoRuta": ruta.get("tipoRuta", "INTERPROVINCIAL"),
                    "tipoServicio": ruta.get("tipoServicio", "PASAJEROS"),
                    "estado": ruta.get("estado", "ACTIVA"),
                    "estaActivo": ruta.get("estaActivo", True),
                    "fechaRegistro": ruta.get("fechaRegistro", datetime.utcnow()),
                    "fechaActualizacion": ruta.get("fechaActualizacion"),
                    
                    # Campos opcionales
                    "distancia": ruta.get("distancia"),
                    "tiempoEstimado": ruta.get("tiempoEstimado"),
                    "tarifaBase": ruta.get("tarifaBase"),
                    "capacidadMaxima": ruta.get("capacidadMaxima"),
                    "restricciones": ruta.get("restricciones", []),
                    "observaciones": ruta.get("observaciones", ""),
                    "descripcion": ruta.get("descripcion")
                }
                rutas_convertidas.append(ruta_dict)
            
            return rutas_convertidas
            
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
            # Buscar rutas que tengan la empresa y resolución en sus objetos embebidos
            rutas = await self.rutas_collection.find({
                "resolucion.empresa.id": empresa_id,
                "resolucion.id": resolucion_id,
                "estaActivo": True
            }).to_list(length=None)
            
            # Convertir a formato esperado por el modelo
            rutas_convertidas = []
            for ruta in rutas:
                # Extraer datos de empresa y resolución embebidos
                # La empresa está directamente embebida en la ruta
                empresa_data = ruta.get("empresa", {})
                resolucion_data = ruta.get("resolucion", {})
                
                ruta_dict = {
                    "id": str(ruta.pop("_id")),
                    "codigoRuta": ruta.get("codigoRuta", ""),
                    "nombre": ruta.get("nombre", ""),
                    
                    # Localidades embebidas
                    "origen": ruta.get("origen", {}),
                    "destino": ruta.get("destino", {}),
                    "itinerario": ruta.get("itinerario", []),
                    
                    # Empresa embebida
                    "empresa": {
                        "id": empresa_data.get("id", ""),
                        "ruc": empresa_data.get("ruc", ""),
                        "razonSocial": empresa_data.get("razonSocial", "")
                    },
                    
                    # Resolución embebida
                    "resolucion": {
                        "id": resolucion_data.get("id", ""),
                        "nroResolucion": resolucion_data.get("nroResolucion", ""),
                        "tipoResolucion": resolucion_data.get("tipoResolucion", ""),
                        "estado": resolucion_data.get("estado", "")
                    },
                    
                    # Frecuencia
                    "frecuencia": {
                        "tipo": ruta.get("frecuencia", {}).get("tipo", "DIARIO"),
                        "cantidad": ruta.get("frecuencia", {}).get("cantidad", 1),
                        "dias": ruta.get("frecuencia", {}).get("dias", []),
                        "descripcion": ruta.get("frecuencia", {}).get("descripcion", "Sin frecuencia")
                    },
                    
                    
                    "horarios": [],
                    "tipoRuta": ruta.get("tipoRuta", "INTERPROVINCIAL"),
                    "tipoServicio": ruta.get("tipoServicio", "PASAJEROS"),
                    "estado": ruta.get("estado", "ACTIVA"),
                    "estaActivo": ruta.get("estaActivo", True),
                    "fechaRegistro": ruta.get("fechaRegistro", datetime.utcnow()),
                    "fechaActualizacion": ruta.get("fechaActualizacion"),
                    
                    # Campos opcionales
                    "distancia": ruta.get("distancia"),
                    "tiempoEstimado": ruta.get("tiempoEstimado"),
                    "tarifaBase": ruta.get("tarifaBase"),
                    "capacidadMaxima": ruta.get("capacidadMaxima"),
                    "restricciones": ruta.get("restricciones", []),
                    "observaciones": ruta.get("observaciones", ""),
                    "descripcion": ruta.get("descripcion")
                }
                rutas_convertidas.append(ruta_dict)
            
            return rutas_convertidas
            
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
            # Verificar que la ruta existe (SIN filtrar por estaActivo)
            ruta_actual = await self.rutas_collection.find_one({"_id": ObjectId(ruta_id)})
            if not ruta_actual:
                raise HTTPException(
                    status_code=404,
                    detail=f"Ruta {ruta_id} no encontrada"
                )
            
            # Si se está actualizando el código, validar unicidad
            if ruta_data.codigoRuta:
                resolucion_id = ruta_actual.get("resolucion", {}).get("id")
                if resolucion_id:
                    await self.validar_codigo_unico(
                        ruta_data.codigoRuta,
                        resolucion_id,
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
            
            if result.modified_count == 0 and result.matched_count == 0:
                raise HTTPException(
                    status_code=404,
                    detail=f"Ruta {ruta_id} no encontrada"
                )
            
            # Retornar ruta actualizada (buscar sin filtro de estaActivo)
            ruta_actualizada = await self.rutas_collection.find_one({"_id": ObjectId(ruta_id)})
            if ruta_actualizada:
                return await self._convert_ruta_to_model(ruta_actualizada)
            
            return None
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al actualizar ruta: {str(e)}"
            )
    
    async def _convert_ruta_to_model(self, ruta_dict: dict) -> Ruta:
        """Convertir documento de MongoDB a modelo Ruta"""
        empresa_data = ruta_dict.get("empresa", {})
        resolucion_data = ruta_dict.get("resolucion", {})
        
        return Ruta(
            id=str(ruta_dict.get("_id")),
            codigoRuta=ruta_dict.get("codigoRuta", ""),
            nombre=ruta_dict.get("nombre", ""),
            origen=ruta_dict.get("origen", {}),
            destino=ruta_dict.get("destino", {}),
            itinerario=ruta_dict.get("itinerario", []),
            empresa={
                "id": empresa_data.get("id", ""),
                "ruc": empresa_data.get("ruc", ""),
                "razonSocial": empresa_data.get("razonSocial", "")
            },
            resolucion={
                "id": resolucion_data.get("id", ""),
                "nroResolucion": resolucion_data.get("nroResolucion", ""),
                "tipoResolucion": resolucion_data.get("tipoResolucion", ""),
                "estado": resolucion_data.get("estado", "")
            },
            frecuencia=ruta_dict.get("frecuencia"),
            horarios=ruta_dict.get("horarios", []),
            tipoRuta=ruta_dict.get("tipoRuta"),
            tipoServicio=ruta_dict.get("tipoServicio", "PASAJEROS"),
            estado=ruta_dict.get("estado", "ACTIVA"),
            distancia=ruta_dict.get("distancia"),
            tiempoEstimado=ruta_dict.get("tiempoEstimado"),
            tarifaBase=ruta_dict.get("tarifaBase"),
            capacidadMaxima=ruta_dict.get("capacidadMaxima"),
            restricciones=ruta_dict.get("restricciones", []),
            observaciones=ruta_dict.get("observaciones"),
            descripcion=ruta_dict.get("descripcion"),
            estaActivo=ruta_dict.get("estaActivo", True),
            fechaRegistro=ruta_dict.get("fechaRegistro"),
            fechaActualizacion=ruta_dict.get("fechaActualizacion")
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
    
    async def delete_ruta(self, ruta_id: str) -> bool:
        """Eliminar ruta físicamente de la base de datos"""
        try:
            # Validar que la ruta existe
            ruta_existente = await self.get_ruta_by_id(ruta_id)
            if not ruta_existente:
                return False
            
            # Obtener datos de la ruta antes de eliminar
            ruta = await self.rutas_collection.find_one({"_id": ObjectId(ruta_id)})
            
            # Eliminar físicamente
            resultado = await self.rutas_collection.delete_one(
                {"_id": ObjectId(ruta_id)}
            )
            
            if resultado.deleted_count > 0:
                # Remover de relaciones si existían
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
            
            return resultado.deleted_count > 0
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al eliminar ruta físicamente: {str(e)}"
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
    
    async def get_estadisticas(self) -> Dict[str, Any]:
        """Obtener estadísticas de rutas"""
        try:
            pipeline = [
                {"$match": {"estaActivo": True}},
                {"$group": {
                    "_id": None,
                    "total": {"$sum": 1},
                    "activas": {"$sum": {"$cond": [{"$eq": ["$estado", "ACTIVA"]}, 1, 0]}},
                    "inactivas": {"$sum": {"$cond": [{"$eq": ["$estado", "INACTIVA"]}, 1, 0]}},
                    "suspendidas": {"$sum": {"$cond": [{"$eq": ["$estado", "SUSPENDIDA"]}, 1, 0]}},
                    "en_mantenimiento": {"$sum": {"$cond": [{"$eq": ["$estado", "EN_MANTENIMIENTO"]}, 1, 0]}},
                    "urbanas": {"$sum": {"$cond": [{"$eq": ["$tipoRuta", "URBANA"]}, 1, 0]}},
                    "interurbanas": {"$sum": {"$cond": [{"$eq": ["$tipoRuta", "INTERURBANA"]}, 1, 0]}},
                    "interprovinciales": {"$sum": {"$cond": [{"$eq": ["$tipoRuta", "INTERPROVINCIAL"]}, 1, 0]}},
                    "interregionales": {"$sum": {"$cond": [{"$eq": ["$tipoRuta", "INTERREGIONAL"]}, 1, 0]}},
                    "pasajeros": {"$sum": {"$cond": [{"$eq": ["$tipoServicio", "PASAJEROS"]}, 1, 0]}},
                    "carga": {"$sum": {"$cond": [{"$eq": ["$tipoServicio", "CARGA"]}, 1, 0]}},
                    "mixto": {"$sum": {"$cond": [{"$eq": ["$tipoServicio", "MIXTO"]}, 1, 0]}},
                    "distancia_promedio": {"$avg": "$distancia"},
                    "tarifa_promedio": {"$avg": "$tarifaBase"}
                }}
            ]
            
            resultado = await self.rutas_collection.aggregate(pipeline).to_list(1)
            
            if not resultado:
                return {
                    "total": 0,
                    "activas": 0,
                    "inactivas": 0,
                    "suspendidas": 0,
                    "en_mantenimiento": 0,
                    "urbanas": 0,
                    "interurbanas": 0,
                    "interprovinciales": 0,
                    "interregionales": 0,
                    "pasajeros": 0,
                    "carga": 0,
                    "mixto": 0,
                    "distancia_promedio": 0.0,
                    "tarifa_promedio": 0.0
                }
            
            stats = resultado[0]
            return {
                "total": stats.get("total", 0),
                "activas": stats.get("activas", 0),
                "inactivas": stats.get("inactivas", 0),
                "suspendidas": stats.get("suspendidas", 0),
                "en_mantenimiento": stats.get("en_mantenimiento", 0),
                "urbanas": stats.get("urbanas", 0),
                "interurbanas": stats.get("interurbanas", 0),
                "interprovinciales": stats.get("interprovinciales", 0),
                "interregionales": stats.get("interregionales", 0),
                "pasajeros": stats.get("pasajeros", 0),
                "carga": stats.get("carga", 0),
                "mixto": stats.get("mixto", 0),
                "distancia_promedio": round(stats.get("distancia_promedio") or 0.0, 2),
                "tarifa_promedio": round(stats.get("tarifa_promedio") or 0.0, 2)
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al obtener estadísticas: {str(e)}"
            )
    
    async def get_rutas_con_filtros(self, filtros: Dict[str, Any]) -> List[Ruta]:
        """Obtener rutas con filtros avanzados"""
        try:
            query = {"estaActivo": True}
            
            if filtros.get("estado"):
                query["estado"] = filtros["estado"]
            if filtros.get("codigo"):
                query["codigoRuta"] = {"$regex": filtros["codigo"], "$options": "i"}
            if filtros.get("nombre"):
                query["nombre"] = {"$regex": filtros["nombre"], "$options": "i"}
            if filtros.get("origen_id"):
                query["origenId"] = filtros["origen_id"]
            if filtros.get("destino_id"):
                query["destinoId"] = filtros["destino_id"]
            
            rutas = await self.rutas_collection.find(query).to_list(length=None)
            
            for ruta in rutas:
                ruta["id"] = str(ruta.pop("_id"))
            
            return [Ruta(**ruta) for ruta in rutas]
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al obtener rutas con filtros: {str(e)}"
            )
    async def get_origenes_destinos_unicos(self) -> Dict[str, List[str]]:
        """
        Obtener lista única de orígenes y destinos de todas las rutas
        
        Returns:
            Diccionario con listas de orígenes y destinos únicos
        """
        try:
            # Obtener todas las rutas activas
            rutas = await self.rutas_collection.find({"estaActivo": True}).to_list(length=None)
            
            origenes = set()
            destinos = set()
            
            for ruta in rutas:
                # Agregar origen
                origen = ruta.get('origen') or ruta.get('origenId')
                if origen:
                    origenes.add(origen)
                
                # Agregar destino
                destino = ruta.get('destino') or ruta.get('destinoId')
                if destino:
                    destinos.add(destino)
            
            return {
                "origenes": sorted(list(origenes)),
                "destinos": sorted(list(destinos))
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al obtener orígenes y destinos: {str(e)}"
            )
