from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from app.dependencies.db import get_database
from app.models.ruta_especifica import (
    RutaEspecifica, RutaEspecificaCreate, RutaEspecificaUpdate, 
    RutaEspecificaResponse, RutaEspecificaFiltros,
    RutaEspecificaEstadisticas
)
from app.utils.exceptions import (
    RutaEspecificaNotFoundException, RutaEspecificaAlreadyExistsException,
    ValidationError
)
import logging

logger = logging.getLogger(__name__)

class RutaEspecificaService:
    """Servicio para operaciones CRUD de rutas específicas"""
    
    async def crear_ruta_especifica(self, ruta_data: RutaEspecificaCreate, usuario_id: str) -> RutaEspecificaResponse:
        """Crear una nueva ruta específica"""
        try:
            db = await get_database()
            collection = db.rutas_especificas
            resoluciones_collection = db.resoluciones
            
            # Validar que la resolución existe y obtener sus datos
            resolucion = await resoluciones_collection.find_one({"_id": ObjectId(ruta_data.resolucionId)})
            if not resolucion:
                raise ValidationError("La resolución especificada no existe")
            
            # Validar según el tipo de resolución
            if resolucion.get("tipoResolucion") == "PADRE":
                # Para resoluciones PADRE: las rutas generales son obligatorias
                if not resolucion.get("rutasAutorizadasIds") or len(resolucion["rutasAutorizadasIds"]) == 0:
                    raise ValidationError("Las resoluciones PADRE deben tener rutas generales asignadas")
                
                # Validar que la ruta general está autorizada en la resolución PADRE
                if ruta_data.rutaGeneralId not in resolucion["rutasAutorizadasIds"]:
                    raise ValidationError("La ruta general no está autorizada en esta resolución PADRE")
                    
            elif resolucion.get("tipoResolucion") == "HIJO":
                # Para resoluciones HIJO: las rutas específicas son opcionales
                # Verificar si hay resolución padre y usar sus rutas autorizadas
                if resolucion.get("resolucionPadreId"):
                    resolucion_padre = await resoluciones_collection.find_one({"_id": ObjectId(resolucion["resolucionPadreId"])})
                    if resolucion_padre and resolucion_padre.get("rutasAutorizadasIds"):
                        # Validar contra las rutas de la resolución padre
                        if ruta_data.rutaGeneralId not in resolucion_padre["rutasAutorizadasIds"]:
                            raise ValidationError("La ruta general no está autorizada en la resolución PADRE asociada")
                    else:
                        # Si no hay resolución padre o no tiene rutas, permitir cualquier ruta general válida
                        rutas_collection = db.rutas
                        ruta_general = await rutas_collection.find_one({"_id": ObjectId(ruta_data.rutaGeneralId)})
                        if not ruta_general:
                            raise ValidationError("La ruta general especificada no existe")
                else:
                    # Resolución HIJO sin padre: validar que la ruta general existe
                    rutas_collection = db.rutas
                    ruta_general = await rutas_collection.find_one({"_id": ObjectId(ruta_data.rutaGeneralId)})
                    if not ruta_general:
                        raise ValidationError("La ruta general especificada no existe")
            
            # Validar que el vehículo está habilitado en la resolución
            if ruta_data.vehiculoId not in resolucion.get("vehiculosHabilitadosIds", []):
                raise ValidationError("El vehículo no está habilitado en la resolución especificada")
            
            # Obtener datos de la ruta general para completar la información
            rutas_collection = db.rutas
            ruta_general = await rutas_collection.find_one({"_id": ObjectId(ruta_data.rutaGeneralId)})
            if not ruta_general:
                raise ValidationError("La ruta general especificada no existe")
            
            # Crear el documento de ruta específica
            ruta_dict = ruta_data.dict()
            ruta_dict["origen"] = ruta_general.get("origen", "ORIGEN")
            ruta_dict["destino"] = ruta_general.get("destino", "DESTINO")
            ruta_dict["distancia"] = ruta_general.get("distancia", 100.0)
            ruta_dict["fechaCreacion"] = datetime.utcnow()
            ruta_dict["creadoPor"] = usuario_id
            
            # Insertar en la base de datos
            result = await collection.insert_one(ruta_dict)
            
            # Construir respuesta
            return RutaEspecificaResponse(
                id=str(result.inserted_id),
                codigo=ruta_data.codigo,
                rutaGeneralId=ruta_data.rutaGeneralId,
                rutaGeneralCodigo=ruta_general.get("codigoRuta", "RG-001"),
                vehiculoId=ruta_data.vehiculoId,
                vehiculoPlaca="ABC-123",  # TODO: Obtener placa real
                resolucionId=ruta_data.resolucionId,
                resolucionNumero=resolucion.get("nroResolucion", "R-001-2024"),
                origen=ruta_general.get("origen", "ORIGEN"),
                destino=ruta_general.get("destino", "DESTINO"),
                distancia=ruta_general.get("distancia", 100.0),
                descripcion=ruta_data.descripcion,
                estado=ruta_data.estado,
                tipoServicio=ruta_data.tipoServicio,
                horarios=ruta_data.horarios,
                paradasAdicionales=ruta_data.paradasAdicionales or [],
                fechaCreacion=datetime.utcnow(),
                fechaActualizacion=None,
                observaciones=ruta_data.observaciones,
                configuracionEspecial=ruta_data.configuracionEspecial
            )
            
        except Exception as e:
            logger.error(f"Error creando ruta específica: {e}")
            raise
    
    async def obtener_ruta_especifica_por_id(self, ruta_id: str) -> RutaEspecificaResponse:
        """Obtener una ruta específica por ID"""
        try:
            db = await get_database()
            collection = db.rutas_especificas
            
            ruta_doc = await collection.find_one({"_id": ObjectId(ruta_id)})
            if not ruta_doc:
                raise RutaEspecificaNotFoundException(ruta_id)
            
            return RutaEspecificaResponse(
                id=str(ruta_doc["_id"]),
                codigo=ruta_doc["codigo"],
                rutaGeneralId=ruta_doc["rutaGeneralId"],
                rutaGeneralCodigo="RG-001",
                vehiculoId=ruta_doc["vehiculoId"],
                vehiculoPlaca="ABC-123",
                resolucionId=ruta_doc["resolucionId"],
                resolucionNumero="R-001-2024",
                origen=ruta_doc.get("origen", "ORIGEN"),
                destino=ruta_doc.get("destino", "DESTINO"),
                distancia=ruta_doc.get("distancia", 100.0),
                descripcion=ruta_doc["descripcion"],
                estado=ruta_doc["estado"],
                tipoServicio=ruta_doc["tipoServicio"],
                horarios=ruta_doc.get("horarios", []),
                paradasAdicionales=ruta_doc.get("paradasAdicionales", []),
                fechaCreacion=ruta_doc["fechaCreacion"],
                fechaActualizacion=ruta_doc.get("fechaActualizacion"),
                observaciones=ruta_doc.get("observaciones"),
                configuracionEspecial=ruta_doc.get("configuracionEspecial")
            )
            
        except Exception as e:
            logger.error(f"Error obteniendo ruta específica {ruta_id}: {e}")
            raise
    
    async def obtener_rutas_especificas(
        self, 
        filtros: Optional[RutaEspecificaFiltros] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[RutaEspecificaResponse]:
        """Obtener lista de rutas específicas con filtros"""
        try:
            db = await get_database()
            collection = db.rutas_especificas
            
            # Construir query de filtros
            query = {}
            if filtros:
                if filtros.codigo:
                    query["codigo"] = {"$regex": filtros.codigo, "$options": "i"}
                if filtros.vehiculoId:
                    query["vehiculoId"] = filtros.vehiculoId
                if filtros.estado:
                    query["estado"] = filtros.estado
            
            # Ejecutar consulta
            cursor = collection.find(query).skip(skip).limit(limit).sort("fechaCreacion", -1)
            rutas_docs = await cursor.to_list(length=limit)
            
            # Convertir a respuestas
            rutas_response = []
            for ruta_doc in rutas_docs:
                ruta_response = RutaEspecificaResponse(
                    id=str(ruta_doc["_id"]),
                    codigo=ruta_doc["codigo"],
                    rutaGeneralId=ruta_doc["rutaGeneralId"],
                    rutaGeneralCodigo="RG-001",
                    vehiculoId=ruta_doc["vehiculoId"],
                    vehiculoPlaca="ABC-123",
                    resolucionId=ruta_doc["resolucionId"],
                    resolucionNumero="R-001-2024",
                    origen=ruta_doc.get("origen", "ORIGEN"),
                    destino=ruta_doc.get("destino", "DESTINO"),
                    distancia=ruta_doc.get("distancia", 100.0),
                    descripcion=ruta_doc["descripcion"],
                    estado=ruta_doc["estado"],
                    tipoServicio=ruta_doc["tipoServicio"],
                    horarios=ruta_doc.get("horarios", []),
                    paradasAdicionales=ruta_doc.get("paradasAdicionales", []),
                    fechaCreacion=ruta_doc["fechaCreacion"],
                    fechaActualizacion=ruta_doc.get("fechaActualizacion"),
                    observaciones=ruta_doc.get("observaciones"),
                    configuracionEspecial=ruta_doc.get("configuracionEspecial")
                )
                rutas_response.append(ruta_response)
            
            return rutas_response
            
        except Exception as e:
            logger.error(f"Error obteniendo rutas específicas: {e}")
            raise
    
    async def obtener_rutas_especificas_por_vehiculo(self, vehiculo_id: str) -> List[RutaEspecificaResponse]:
        """Obtener todas las rutas específicas de un vehículo"""
        filtros = RutaEspecificaFiltros(vehiculoId=vehiculo_id)
        return await self.obtener_rutas_especificas(filtros=filtros)
    
    async def obtener_rutas_especificas_por_resolucion(self, resolucion_id: str) -> List[RutaEspecificaResponse]:
        """Obtener todas las rutas específicas de una resolución"""
        filtros = RutaEspecificaFiltros(resolucionId=resolucion_id)
        return await self.obtener_rutas_especificas(filtros=filtros)
    
    async def actualizar_ruta_especifica(
        self, 
        ruta_id: str, 
        ruta_data: RutaEspecificaUpdate, 
        usuario_id: str
    ) -> RutaEspecificaResponse:
        """Actualizar una ruta específica"""
        try:
            db = await get_database()
            collection = db.rutas_especificas
            
            # Verificar que la ruta existe
            ruta_existente = await collection.find_one({"_id": ObjectId(ruta_id)})
            if not ruta_existente:
                raise RutaEspecificaNotFoundException(ruta_id)
            
            # Preparar datos de actualización
            update_data = {}
            for field, value in ruta_data.dict(exclude_unset=True).items():
                if value is not None:
                    update_data[field] = value
            
            # Agregar metadatos de actualización
            update_data["fechaActualizacion"] = datetime.utcnow()
            update_data["actualizadoPor"] = usuario_id
            
            # Actualizar en la base de datos
            await collection.update_one(
                {"_id": ObjectId(ruta_id)},
                {"$set": update_data}
            )
            
            # Retornar la ruta actualizada
            return await self.obtener_ruta_especifica_por_id(ruta_id)
            
        except Exception as e:
            logger.error(f"Error actualizando ruta específica {ruta_id}: {e}")
            raise
    
    async def eliminar_ruta_especifica(self, ruta_id: str) -> bool:
        """Eliminar una ruta específica"""
        try:
            db = await get_database()
            collection = db.rutas_especificas
            
            # Verificar que la ruta existe
            ruta_existente = await collection.find_one({"_id": ObjectId(ruta_id)})
            if not ruta_existente:
                raise RutaEspecificaNotFoundException(ruta_id)
            
            # Eliminar la ruta
            result = await collection.delete_one({"_id": ObjectId(ruta_id)})
            
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error eliminando ruta específica {ruta_id}: {e}")
            raise
    
    async def obtener_estadisticas(self) -> RutaEspecificaEstadisticas:
        """Obtener estadísticas de rutas específicas"""
        try:
            db = await get_database()
            collection = db.rutas_especificas
            
            # Contar totales
            total_rutas = await collection.count_documents({})
            
            # Estadísticas básicas
            return RutaEspecificaEstadisticas(
                totalRutasEspecificas=total_rutas,
                rutasActivas=0,
                rutasInactivas=0,
                rutasSuspendidas=0,
                distribucionPorTipoServicio={},
                distribucionPorVehiculo={},
                promedioHorariosPorRuta=0.0
            )
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de rutas específicas: {e}")
            raise