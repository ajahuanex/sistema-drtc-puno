"""
Servicio para manejo de configuraciones del sistema - Versión híbrida
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.configuracion import (
    ConfiguracionResponse, ConfiguracionCreate, ConfiguracionUpdate, 
    CategoriaConfiguracion, ConfiguracionesPorCategoria,
    TipoConfiguracion, ConfiguracionItem, CONFIGURACIONES_PREDEFINIDAS
)

class ConfiguracionService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.configuraciones

    def _convert_id(self, doc: dict) -> dict:
        """Convertir ObjectId a string"""
        if doc and "_id" in doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
        return doc

    # ========================================
    # MÉTODOS NUEVOS (para el sistema actual)
    # ========================================
    
    async def obtener_todas(self) -> List[ConfiguracionResponse]:
        """Obtener todas las configuraciones activas"""
        configuraciones = []
        async for doc in self.collection.find({"activo": True}):
            configuraciones.append(ConfiguracionResponse(**self._convert_id(doc)))
        return configuraciones

    async def obtener_por_categoria(self, categoria: CategoriaConfiguracion) -> ConfiguracionesPorCategoria:
        """Obtener configuraciones por categoría"""
        configuraciones = []
        async for doc in self.collection.find({"categoria": categoria, "activo": True}):
            configuraciones.append(ConfiguracionResponse(**self._convert_id(doc)))
        
        return ConfiguracionesPorCategoria(
            categoria=categoria,
            configuraciones=configuraciones,
            total=len(configuraciones)
        )

    async def obtener_por_nombre(self, nombre: str) -> Optional[ConfiguracionResponse]:
        """Obtener configuración por nombre"""
        doc = await self.collection.find_one({"nombre": nombre, "activo": True})
        if doc:
            return ConfiguracionResponse(**self._convert_id(doc))
        return None

    async def obtener_por_id(self, config_id: str) -> Optional[ConfiguracionResponse]:
        """Obtener configuración por ID"""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(config_id), "activo": True})
            if doc:
                return ConfiguracionResponse(**self._convert_id(doc))
        except Exception:
            pass
        return None

    async def crear(self, configuracion: ConfiguracionCreate, usuario_id: str) -> ConfiguracionResponse:
        """Crear nueva configuración"""
        
        # Verificar si ya existe configuración con el mismo nombre
        existente = await self.obtener_por_nombre(configuracion.nombre)
        if existente:
            raise ValueError(f"Ya existe una configuración con el nombre {configuracion.nombre}")

        config_data = {
            **configuracion.dict(),
            "activo": True,
            "fechaCreacion": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow(),
            "creadoPor": usuario_id,
            "actualizadoPor": usuario_id
        }

        resultado = await self.collection.insert_one(config_data)
        config_data["id"] = str(resultado.inserted_id)
        del config_data["_id"]
        
        return ConfiguracionResponse(**config_data)

    async def actualizar(self, config_id: str, configuracion: ConfiguracionUpdate, usuario_id: str) -> Optional[ConfiguracionResponse]:
        """Actualizar configuración existente"""
        
        update_data = {k: v for k, v in configuracion.dict().items() if v is not None}
        update_data["actualizadoPor"] = usuario_id
        update_data["fechaActualizacion"] = datetime.utcnow()

        try:
            resultado = await self.collection.update_one(
                {"_id": ObjectId(config_id), "activo": True},
                {"$set": update_data}
            )

            if resultado.modified_count > 0:
                return await self.obtener_por_id(config_id)
        except Exception:
            pass
        
        return None

    async def eliminar(self, config_id: str) -> bool:
        """Eliminar (desactivar) configuración"""
        try:
            resultado = await self.collection.update_one(
                {"_id": ObjectId(config_id)},
                {"$set": {"activo": False, "fechaActualizacion": datetime.utcnow()}}
            )
            return resultado.modified_count > 0
        except Exception:
            return False

    async def obtener_configuraciones_vehiculos(self) -> Dict[str, Any]:
        """Obtener todas las configuraciones relacionadas con vehículos"""
        configuraciones_vehiculos = {}
        
        # Configuraciones específicas de vehículos
        nombres_vehiculos = [
            'CATEGORIAS_VEHICULOS',
            'ESTADOS_VEHICULOS_CONFIG',
            'TIPOS_COMBUSTIBLE',
            'TIPOS_CARROCERIA',
            'PERMITIR_CAMBIO_ESTADO_MASIVO',
            'MOTIVO_OBLIGATORIO_CAMBIO_ESTADO'
        ]
        
        for nombre in nombres_vehiculos:
            config = await self.obtener_por_nombre(nombre)
            if config:
                configuraciones_vehiculos[nombre] = config.valor
        
        return configuraciones_vehiculos

    async def inicializar_configuraciones(self) -> bool:
        """Inicializar configuraciones por defecto del sistema"""
        try:
            configuraciones_default = self._get_configuraciones_default()
            
            for config_data in configuraciones_default:
                # Verificar si ya existe
                existente = await self.obtener_por_nombre(config_data["nombre"])
                if not existente:
                    # Crear configuración
                    await self.collection.insert_one(config_data)
            
            return True
        except Exception as e:
            print(f"Error inicializando configuraciones: {e}")
            return False

    def _get_configuraciones_default(self) -> List[Dict[str, Any]]:
        """Obtener configuraciones por defecto"""
        return [
            {
                "nombre": "SEDES_DISPONIBLES",
                "valor": "PUNO,LIMA,AREQUIPA,JULIACA,CUSCO,TACNA",
                "descripcion": "Sedes disponibles en el sistema",
                "categoria": CategoriaConfiguracion.GENERAL,
                "activo": True,
                "esEditable": True,
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "SISTEMA",
                "actualizadoPor": "SISTEMA"
            },
            {
                "nombre": "CATEGORIAS_VEHICULOS",
                "valor": "M1,M2,M2-C3,M3,N1,N2,N3",
                "descripcion": "Categorías de vehículos disponibles",
                "categoria": CategoriaConfiguracion.VEHICULOS,
                "activo": True,
                "esEditable": True,
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "SISTEMA",
                "actualizadoPor": "SISTEMA"
            },
            {
                "nombre": "TIPOS_COMBUSTIBLE",
                "valor": "DIESEL,GASOLINA,GAS_NATURAL,ELECTRICO,HIBRIDO",
                "descripcion": "Tipos de combustible disponibles",
                "categoria": CategoriaConfiguracion.VEHICULOS,
                "activo": True,
                "esEditable": True,
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "SISTEMA",
                "actualizadoPor": "SISTEMA"
            },
            {
                "nombre": "TIPOS_CARROCERIA",
                "valor": "MICROBUS,MINIBUS,OMNIBUS,COASTER,FURGON,CAMIONETA",
                "descripcion": "Tipos de carrocería disponibles",
                "categoria": CategoriaConfiguracion.VEHICULOS,
                "activo": True,
                "esEditable": True,
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "SISTEMA",
                "actualizadoPor": "SISTEMA"
            },
            {
                "nombre": "ESTADOS_VEHICULOS_CONFIG",
                "valor": '[{"codigo":"HABILITADO","nombre":"Habilitado","color":"#4CAF50","descripcion":"Vehículo operativo y disponible para servicio","esDefault":true},{"codigo":"NO_HABILITADO","nombre":"No Habilitado","color":"#F44336","descripcion":"Vehículo temporalmente fuera de servicio","esDefault":false},{"codigo":"SUSPENDIDO","nombre":"Suspendido","color":"#FF9800","descripcion":"Vehículo suspendido por motivos administrativos","esDefault":false},{"codigo":"MANTENIMIENTO","nombre":"Mantenimiento","color":"#9C27B0","descripcion":"Vehículo en proceso de reparación o mantenimiento","esDefault":false}]',
                "descripcion": "Configuración de estados disponibles para vehículos",
                "categoria": CategoriaConfiguracion.VEHICULOS,
                "activo": True,
                "esEditable": True,
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "SISTEMA",
                "actualizadoPor": "SISTEMA"
            },
            {
                "nombre": "PERMITIR_CAMBIO_ESTADO_MASIVO",
                "valor": "true",
                "descripcion": "Habilita cambio de estado masivo para vehículos",
                "categoria": CategoriaConfiguracion.VEHICULOS,
                "activo": True,
                "esEditable": True,
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "SISTEMA",
                "actualizadoPor": "SISTEMA"
            },
            {
                "nombre": "TIPOS_SERVICIO",
                "valor": "PERSONAS,TURISMO,TRABAJADORES,MERCANCIAS,ESTUDIANTES,TERMINAL_TERRESTRE,ESTACION_DE_RUTA,OTROS",
                "descripcion": "Tipos de servicio disponibles para empresas",
                "categoria": CategoriaConfiguracion.EMPRESAS,
                "activo": True,
                "esEditable": True,
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "SISTEMA",
                "actualizadoPor": "SISTEMA"
            }
        ]

    # ========================================
    # MÉTODOS DE COMPATIBILIDAD (para empresa_excel_service)
    # ========================================
    
    async def get_tipos_servicio_codigos(self) -> List[str]:
        """Obtener códigos de tipos de servicio (compatibilidad)"""
        config = await self.obtener_por_nombre("TIPOS_SERVICIO")
        if config and config.valor:
            return [tipo.strip().upper() for tipo in config.valor.split(',')]
        return ['PERSONAS', 'TURISMO', 'TRABAJADORES', 'MERCANCIAS', 'ESTUDIANTES', 'TERMINAL_TERRESTRE', 'ESTACION_DE_RUTA', 'OTROS']

    async def get_configuracion_por_tipo(self, tipo: TipoConfiguracion) -> Optional[Dict[str, Any]]:
        """Obtener configuración por tipo (compatibilidad)"""
        # Mapear tipos antiguos a nombres nuevos
        mapeo_tipos = {
            TipoConfiguracion.TIPOS_SERVICIO: "TIPOS_SERVICIO",
            TipoConfiguracion.ESTADOS_EMPRESA: "ESTADOS_EMPRESA",
            TipoConfiguracion.TIPOS_DOCUMENTO: "TIPOS_DOCUMENTO",
            TipoConfiguracion.PARAMETROS_SISTEMA: "PARAMETROS_SISTEMA"
        }
        
        nombre = mapeo_tipos.get(tipo)
        if nombre:
            config = await self.obtener_por_nombre(nombre)
            if config:
                # Convertir a formato compatible con el modelo antiguo
                items = []
                if config.valor:
                    codigos = [c.strip() for c in config.valor.split(',')]
                    for i, codigo in enumerate(codigos):
                        items.append(ConfiguracionItem(
                            codigo=codigo,
                            nombre=codigo.replace('_', ' ').title(),
                            descripcion=f"Servicio de {codigo.lower().replace('_', ' ')}",
                            estaActivo=True,
                            orden=i+1
                        ))
                
                # Crear objeto compatible
                return {
                    "id": config.id,
                    "tipo": tipo,
                    "nombre": config.nombre,
                    "descripcion": config.descripcion,
                    "items": items,
                    "estaActivo": config.activo,
                    "fechaCreacion": config.fechaCreacion,
                    "fechaActualizacion": config.fechaActualizacion,
                    "creadoPor": config.creadoPor,
                    "actualizadoPor": config.actualizadoPor
                }
        return None

    async def get_tipos_servicio_activos(self) -> List[ConfiguracionItem]:
        """Obtener tipos de servicio activos (compatibilidad)"""
        codigos = await self.get_tipos_servicio_codigos()
        items = []
        for i, codigo in enumerate(codigos):
            items.append(ConfiguracionItem(
                codigo=codigo,
                nombre=codigo.replace('_', ' ').title(),
                descripcion=f"Servicio de {codigo.lower().replace('_', ' ')}",
                estaActivo=True,
                orden=i+1
            ))
        return items

    async def inicializar_configuraciones_predefinidas(self, usuario_id: str = "SISTEMA") -> bool:
        """Inicializar configuraciones predefinidas del sistema (compatibilidad)"""
        return await self.inicializar_configuraciones()