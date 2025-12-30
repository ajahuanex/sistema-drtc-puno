"""
Servicio para gestión de configuraciones del sistema
"""

from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
import json
import logging

from ..models.configuracion import (
    ConfiguracionSistema,
    ConfiguracionCreate,
    ConfiguracionUpdate,
    ConfiguracionResponse,
    CategoriaConfiguracion,
    TipoConfiguracion,
    ConfiguracionesPorCategoria,
    ConfiguracionesIniciales
)

logger = logging.getLogger(__name__)

class ConfiguracionService:
    """Servicio para gestión de configuraciones"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.configuraciones
    
    async def inicializar_configuraciones(self) -> bool:
        """Inicializa las configuraciones por defecto si no existen"""
        try:
            # Verificar si ya existen configuraciones
            count = await self.collection.count_documents({})
            if count > 0:
                logger.info(f"Ya existen {count} configuraciones en la base de datos")
                return True
            
            # Crear configuraciones por defecto
            configuraciones_default = ConfiguracionesIniciales.get_configuraciones_default()
            
            configuraciones_db = []
            for config in configuraciones_default:
                config_dict = config.dict()
                config_dict["fechaCreacion"] = datetime.utcnow()
                config_dict["fechaActualizacion"] = datetime.utcnow()
                config_dict["usuarioCreacion"] = "sistema"
                config_dict["usuarioActualizacion"] = "sistema"
                configuraciones_db.append(config_dict)
            
            # Insertar en la base de datos
            result = await self.collection.insert_many(configuraciones_db)
            
            logger.info(f"Configuraciones inicializadas: {len(result.inserted_ids)} configuraciones creadas")
            return True
            
        except Exception as e:
            logger.error(f"Error inicializando configuraciones: {str(e)}")
            return False
    
    async def obtener_todas(self) -> List[ConfiguracionResponse]:
        """Obtiene todas las configuraciones"""
        try:
            logger.info("🔍 Iniciando obtención de todas las configuraciones")
            cursor = self.collection.find({"activo": True}).sort("categoria", 1).sort("nombre", 1)
            configuraciones = []
            
            count = 0
            async for doc in cursor:
                count += 1
                logger.debug(f"Procesando configuración {count}: {doc.get('nombre')}")
                doc["id"] = str(doc["_id"])
                del doc["_id"]
                try:
                    config_response = ConfiguracionResponse(**doc)
                    configuraciones.append(config_response)
                except Exception as e:
                    logger.error(f"Error creando ConfiguracionResponse para {doc.get('nombre')}: {str(e)}")
                    logger.error(f"Documento problemático: {doc}")
            
            logger.info(f"✅ Obtenidas {len(configuraciones)} configuraciones de {count} documentos")
            return configuraciones
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo configuraciones: {str(e)}")
            return []
    
    async def obtener_por_categoria(self, categoria: CategoriaConfiguracion) -> ConfiguracionesPorCategoria:
        """Obtiene configuraciones por categoría"""
        try:
            cursor = self.collection.find({
                "categoria": categoria.value,
                "activo": True
            }).sort("nombre", 1)
            
            configuraciones = []
            async for doc in cursor:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
                configuraciones.append(ConfiguracionResponse(**doc))
            
            return ConfiguracionesPorCategoria(
                categoria=categoria,
                configuraciones=configuraciones,
                total=len(configuraciones)
            )
            
        except Exception as e:
            logger.error(f"Error obteniendo configuraciones por categoría {categoria}: {str(e)}")
            return ConfiguracionesPorCategoria(
                categoria=categoria,
                configuraciones=[],
                total=0
            )
    
    async def obtener_por_nombre(self, nombre: str) -> Optional[ConfiguracionResponse]:
        """Obtiene una configuración por nombre"""
        try:
            doc = await self.collection.find_one({"nombre": nombre, "activo": True})
            if not doc:
                return None
            
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            return ConfiguracionResponse(**doc)
            
        except Exception as e:
            logger.error(f"Error obteniendo configuración {nombre}: {str(e)}")
            return None
    
    async def obtener_por_id(self, config_id: str) -> Optional[ConfiguracionResponse]:
        """Obtiene una configuración por ID"""
        try:
            if not ObjectId.is_valid(config_id):
                return None
            
            doc = await self.collection.find_one({"_id": ObjectId(config_id)})
            if not doc:
                return None
            
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            return ConfiguracionResponse(**doc)
            
        except Exception as e:
            logger.error(f"Error obteniendo configuración por ID {config_id}: {str(e)}")
            return None
    
    async def crear(self, configuracion: ConfiguracionCreate, usuario_id: str = "sistema") -> Optional[ConfiguracionResponse]:
        """Crea una nueva configuración"""
        try:
            # Verificar que no exista una configuración con el mismo nombre
            existing = await self.collection.find_one({"nombre": configuracion.nombre})
            if existing:
                raise ValueError(f"Ya existe una configuración con el nombre '{configuracion.nombre}'")
            
            # Validar el valor según el tipo
            self._validar_valor(configuracion.valor, configuracion.tipo, configuracion.validacion)
            
            # Preparar documento para insertar
            config_dict = configuracion.dict()
            config_dict["fechaCreacion"] = datetime.utcnow()
            config_dict["fechaActualizacion"] = datetime.utcnow()
            config_dict["usuarioCreacion"] = usuario_id
            config_dict["usuarioActualizacion"] = usuario_id
            
            # Insertar en la base de datos
            result = await self.collection.insert_one(config_dict)
            
            # Obtener la configuración creada
            return await self.obtener_por_id(str(result.inserted_id))
            
        except Exception as e:
            logger.error(f"Error creando configuración: {str(e)}")
            raise
    
    async def actualizar(self, config_id: str, configuracion: ConfiguracionUpdate, usuario_id: str = "sistema") -> Optional[ConfiguracionResponse]:
        """Actualiza una configuración existente"""
        try:
            if not ObjectId.is_valid(config_id):
                return None
            
            # Obtener configuración actual
            config_actual = await self.obtener_por_id(config_id)
            if not config_actual:
                return None
            
            # Verificar que sea editable
            if not config_actual.esEditable:
                raise ValueError("Esta configuración no es editable")
            
            # Preparar datos de actualización
            update_data = {}
            if configuracion.valor is not None:
                # Validar el nuevo valor
                self._validar_valor(configuracion.valor, config_actual.tipo, config_actual.validacion)
                update_data["valor"] = configuracion.valor
            
            if configuracion.descripcion is not None:
                update_data["descripcion"] = configuracion.descripcion
            
            if configuracion.activo is not None:
                update_data["activo"] = configuracion.activo
            
            if configuracion.esEditable is not None:
                update_data["esEditable"] = configuracion.esEditable
            
            if configuracion.valorPorDefecto is not None:
                update_data["valorPorDefecto"] = configuracion.valorPorDefecto
            
            if configuracion.validacion is not None:
                update_data["validacion"] = configuracion.validacion
            
            if configuracion.metadatos is not None:
                update_data["metadatos"] = configuracion.metadatos
            
            # Agregar metadatos de actualización
            update_data["fechaActualizacion"] = datetime.utcnow()
            update_data["usuarioActualizacion"] = usuario_id
            
            # Actualizar en la base de datos
            await self.collection.update_one(
                {"_id": ObjectId(config_id)},
                {"$set": update_data}
            )
            
            # Retornar configuración actualizada
            return await self.obtener_por_id(config_id)
            
        except Exception as e:
            logger.error(f"Error actualizando configuración {config_id}: {str(e)}")
            raise
    
    async def eliminar(self, config_id: str) -> bool:
        """Elimina (desactiva) una configuración"""
        try:
            if not ObjectId.is_valid(config_id):
                return False
            
            # Obtener configuración actual
            config_actual = await self.obtener_por_id(config_id)
            if not config_actual:
                return False
            
            # Verificar que sea editable
            if not config_actual.esEditable:
                raise ValueError("Esta configuración no se puede eliminar")
            
            # Desactivar en lugar de eliminar
            await self.collection.update_one(
                {"_id": ObjectId(config_id)},
                {"$set": {
                    "activo": False,
                    "fechaActualizacion": datetime.utcnow()
                }}
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error eliminando configuración {config_id}: {str(e)}")
            raise
    
    async def obtener_valor(self, nombre: str, valor_default: Any = None) -> Any:
        """Obtiene el valor de una configuración, parseado según su tipo"""
        try:
            config = await self.obtener_por_nombre(nombre)
            if not config:
                return valor_default
            
            return self._parsear_valor(config.valor, config.tipo)
            
        except Exception as e:
            logger.error(f"Error obteniendo valor de configuración {nombre}: {str(e)}")
            return valor_default
    
    async def obtener_configuraciones_vehiculos(self) -> Dict[str, Any]:
        """Obtiene todas las configuraciones relacionadas con vehículos"""
        try:
            configs = await self.obtener_por_categoria(CategoriaConfiguracion.VEHICULOS)
            
            result = {}
            for config in configs.configuraciones:
                valor_parseado = self._parsear_valor(config.valor, config.tipo)
                result[config.nombre] = valor_parseado
            
            return result
            
        except Exception as e:
            logger.error(f"Error obteniendo configuraciones de vehículos: {str(e)}")
            return {}
    
    def _validar_valor(self, valor: str, tipo: TipoConfiguracion, validacion: Optional[Dict[str, Any]] = None):
        """Valida un valor según su tipo y reglas de validación"""
        try:
            if tipo == TipoConfiguracion.NUMBER:
                num_val = float(valor)
                if validacion:
                    if "min" in validacion and num_val < validacion["min"]:
                        raise ValueError(f"Valor debe ser mayor o igual a {validacion['min']}")
                    if "max" in validacion and num_val > validacion["max"]:
                        raise ValueError(f"Valor debe ser menor o igual a {validacion['max']}")
            
            elif tipo == TipoConfiguracion.BOOLEAN:
                if valor.lower() not in ["true", "false"]:
                    raise ValueError("Valor debe ser 'true' o 'false'")
            
            elif tipo == TipoConfiguracion.JSON:
                json.loads(valor)  # Verificar que sea JSON válido
            
            elif tipo == TipoConfiguracion.LIST:
                if validacion and "separator" in validacion:
                    items = valor.split(validacion["separator"])
                    if validacion.get("min_items", 0) > 0 and len(items) < validacion["min_items"]:
                        raise ValueError(f"Lista debe tener al menos {validacion['min_items']} elementos")
            
            elif tipo == TipoConfiguracion.STRING:
                if validacion and "enum" in validacion:
                    if valor not in validacion["enum"]:
                        raise ValueError(f"Valor debe ser uno de: {', '.join(validacion['enum'])}")
            
        except json.JSONDecodeError:
            raise ValueError("Valor JSON inválido")
        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f"Error validando valor: {str(e)}")
    
    def _parsear_valor(self, valor: str, tipo: TipoConfiguracion) -> Any:
        """Parsea un valor según su tipo"""
        try:
            if tipo == TipoConfiguracion.NUMBER:
                return float(valor) if "." in valor else int(valor)
            elif tipo == TipoConfiguracion.BOOLEAN:
                return valor.lower() == "true"
            elif tipo == TipoConfiguracion.JSON:
                return json.loads(valor)
            elif tipo == TipoConfiguracion.LIST:
                return [item.strip() for item in valor.split(",") if item.strip()]
            elif tipo == TipoConfiguracion.DATE:
                return datetime.fromisoformat(valor.replace("Z", "+00:00"))
            else:
                return valor
        except Exception as e:
            logger.error(f"Error parseando valor '{valor}' como {tipo}: {str(e)}")
            return valor