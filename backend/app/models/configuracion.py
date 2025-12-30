"""
Modelos para el sistema de configuraciones
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime

class CategoriaConfiguracion(str, Enum):
    """Categorías de configuraciones disponibles"""
    GENERAL = "GENERAL"
    VEHICULOS = "VEHICULOS"
    EMPRESAS = "EMPRESAS"
    RESOLUCIONES = "RESOLUCIONES"
    RUTAS = "RUTAS"
    USUARIOS = "USUARIOS"
    SISTEMA = "SISTEMA"
    NOTIFICACIONES = "NOTIFICACIONES"

class TipoConfiguracion(str, Enum):
    """Tipos de datos de configuración"""
    STRING = "STRING"
    NUMBER = "NUMBER"
    BOOLEAN = "BOOLEAN"
    JSON = "JSON"
    LIST = "LIST"
    DATE = "DATE"

class ConfiguracionSistema(BaseModel):
    """Modelo para configuraciones del sistema"""
    id: Optional[str] = None
    nombre: str = Field(..., description="Nombre único de la configuración")
    valor: str = Field(..., description="Valor de la configuración como string")
    descripcion: Optional[str] = Field(None, description="Descripción de la configuración")
    categoria: CategoriaConfiguracion = Field(..., description="Categoría de la configuración")
    tipo: TipoConfiguracion = Field(TipoConfiguracion.STRING, description="Tipo de dato")
    activo: bool = Field(True, description="Si la configuración está activa")
    esEditable: bool = Field(True, description="Si la configuración puede ser editada")
    valorPorDefecto: Optional[str] = Field(None, description="Valor por defecto")
    validacion: Optional[Dict[str, Any]] = Field(None, description="Reglas de validación")
    metadatos: Optional[Dict[str, Any]] = Field(None, description="Metadatos adicionales")
    fechaCreacion: Optional[datetime] = None
    fechaActualizacion: Optional[datetime] = None
    usuarioCreacion: Optional[str] = None
    usuarioActualizacion: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ConfiguracionCreate(BaseModel):
    """Modelo para crear configuraciones"""
    nombre: str = Field(..., description="Nombre único de la configuración")
    valor: str = Field(..., description="Valor de la configuración")
    descripcion: Optional[str] = None
    categoria: CategoriaConfiguracion
    tipo: TipoConfiguracion = TipoConfiguracion.STRING
    activo: bool = True
    esEditable: bool = True
    valorPorDefecto: Optional[str] = None
    validacion: Optional[Dict[str, Any]] = None
    metadatos: Optional[Dict[str, Any]] = None

class ConfiguracionUpdate(BaseModel):
    """Modelo para actualizar configuraciones"""
    valor: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None
    esEditable: Optional[bool] = None
    valorPorDefecto: Optional[str] = None
    validacion: Optional[Dict[str, Any]] = None
    metadatos: Optional[Dict[str, Any]] = None

class ConfiguracionResponse(BaseModel):
    """Modelo de respuesta para configuraciones"""
    id: str
    nombre: str
    valor: str
    descripcion: Optional[str] = None
    categoria: CategoriaConfiguracion
    tipo: TipoConfiguracion
    activo: bool
    esEditable: bool
    valorPorDefecto: Optional[str] = None
    validacion: Optional[Dict[str, Any]] = None
    metadatos: Optional[Dict[str, Any]] = None
    fechaCreacion: datetime
    fechaActualizacion: datetime
    usuarioCreacion: Optional[str] = None
    usuarioActualizacion: Optional[str] = None

class ConfiguracionesPorCategoria(BaseModel):
    """Modelo para agrupar configuraciones por categoría"""
    categoria: CategoriaConfiguracion
    configuraciones: List[ConfiguracionResponse]
    total: int

class ConfiguracionesIniciales(BaseModel):
    """Modelo para las configuraciones iniciales del sistema"""
    configuraciones: List[ConfiguracionCreate]
    
    @classmethod
    def get_configuraciones_default(cls) -> List[ConfiguracionCreate]:
        """Obtiene las configuraciones por defecto del sistema"""
        return [
            # Configuraciones Generales
            ConfiguracionCreate(
                nombre="SEDES_DISPONIBLES",
                valor="PUNO,LIMA,AREQUIPA,JULIACA,CUSCO,TACNA",
                descripcion="Sedes disponibles en el sistema",
                categoria=CategoriaConfiguracion.GENERAL,
                tipo=TipoConfiguracion.LIST,
                validacion={"min_items": 1, "separator": ","}
            ),
            ConfiguracionCreate(
                nombre="SEDE_DEFAULT",
                valor="PUNO",
                descripcion="Sede por defecto del sistema",
                categoria=CategoriaConfiguracion.GENERAL,
                tipo=TipoConfiguracion.STRING,
                validacion={"enum": ["PUNO", "LIMA", "AREQUIPA", "JULIACA", "CUSCO", "TACNA"]}
            ),
            
            # Configuraciones de Vehículos
            ConfiguracionCreate(
                nombre="CATEGORIAS_VEHICULOS",
                valor="M1,M2,M2-C3,M3,N1,N2,N3",
                descripcion="Categorías de vehículos disponibles",
                categoria=CategoriaConfiguracion.VEHICULOS,
                tipo=TipoConfiguracion.LIST,
                validacion={"min_items": 1, "separator": ","}
            ),
            ConfiguracionCreate(
                nombre="CATEGORIA_VEHICULO_DEFAULT",
                valor="M3",
                descripcion="Categoría por defecto para nuevos vehículos",
                categoria=CategoriaConfiguracion.VEHICULOS,
                tipo=TipoConfiguracion.STRING,
                validacion={"enum": ["M1", "M2", "M2-C3", "M3", "N1", "N2", "N3"]}
            ),
            ConfiguracionCreate(
                nombre="TIPOS_CARROCERIA",
                valor="MICROBUS,MINIBUS,OMNIBUS,COASTER,FURGON,CAMIONETA",
                descripcion="Tipos de carrocería disponibles",
                categoria=CategoriaConfiguracion.VEHICULOS,
                tipo=TipoConfiguracion.LIST,
                validacion={"min_items": 1, "separator": ","}
            ),
            ConfiguracionCreate(
                nombre="TIPO_CARROCERIA_DEFAULT",
                valor="MICROBUS",
                descripcion="Tipo de carrocería por defecto",
                categoria=CategoriaConfiguracion.VEHICULOS,
                tipo=TipoConfiguracion.STRING,
                validacion={"enum": ["MICROBUS", "MINIBUS", "OMNIBUS", "COASTER", "FURGON", "CAMIONETA"]}
            ),
            ConfiguracionCreate(
                nombre="ESTADOS_VEHICULOS",
                valor="HABILITADO,NO_HABILITADO,SUSPENDIDO,MANTENIMIENTO",
                descripcion="Estados posibles de los vehículos",
                categoria=CategoriaConfiguracion.VEHICULOS,
                tipo=TipoConfiguracion.LIST,
                validacion={"min_items": 1, "separator": ","}
            ),
            ConfiguracionCreate(
                nombre="ESTADO_VEHICULO_DEFAULT",
                valor="HABILITADO",
                descripcion="Estado por defecto para nuevos vehículos",
                categoria=CategoriaConfiguracion.VEHICULOS,
                tipo=TipoConfiguracion.STRING,
                validacion={"enum": ["HABILITADO", "NO_HABILITADO", "SUSPENDIDO", "MANTENIMIENTO"]}
            ),
            ConfiguracionCreate(
                nombre="TIPOS_COMBUSTIBLE",
                valor="DIESEL,GASOLINA,GAS_NATURAL,ELECTRICO,HIBRIDO",
                descripcion="Tipos de combustible disponibles",
                categoria=CategoriaConfiguracion.VEHICULOS,
                tipo=TipoConfiguracion.LIST,
                validacion={"min_items": 1, "separator": ","}
            ),
            ConfiguracionCreate(
                nombre="TIPO_COMBUSTIBLE_DEFAULT",
                valor="DIESEL",
                descripcion="Tipo de combustible por defecto",
                categoria=CategoriaConfiguracion.VEHICULOS,
                tipo=TipoConfiguracion.STRING,
                validacion={"enum": ["DIESEL", "GASOLINA", "GAS_NATURAL", "ELECTRICO", "HIBRIDO"]}
            ),
            
            # Configuraciones de Estados de Vehículos (JSON)
            ConfiguracionCreate(
                nombre="ESTADOS_VEHICULOS_CONFIG",
                valor='[{"codigo": "HABILITADO", "nombre": "Habilitado", "color": "#4CAF50", "descripcion": "Vehículo operativo y disponible para servicio"}, {"codigo": "NO_HABILITADO", "nombre": "No Habilitado", "color": "#F44336", "descripcion": "Vehículo temporalmente fuera de servicio"}, {"codigo": "SUSPENDIDO", "nombre": "Suspendido", "color": "#9C27B0", "descripcion": "Vehículo suspendido por motivos administrativos"}, {"codigo": "MANTENIMIENTO", "nombre": "Mantenimiento", "color": "#FF9800", "descripcion": "Vehículo en proceso de reparación o mantenimiento"}]',
                descripcion="Configuración detallada de estados de vehículos",
                categoria=CategoriaConfiguracion.VEHICULOS,
                tipo=TipoConfiguracion.JSON,
                validacion={"schema": "array_of_objects"}
            ),
            
            # Configuraciones de Sistema
            ConfiguracionCreate(
                nombre="PERMITIR_CAMBIO_ESTADO_MASIVO",
                valor="true",
                descripcion="Habilita cambio de estado masivo de vehículos",
                categoria=CategoriaConfiguracion.SISTEMA,
                tipo=TipoConfiguracion.BOOLEAN
            ),
            ConfiguracionCreate(
                nombre="MOTIVO_OBLIGATORIO_CAMBIO_ESTADO",
                valor="false",
                descripcion="Requiere motivo obligatorio para cambio de estado",
                categoria=CategoriaConfiguracion.SISTEMA,
                tipo=TipoConfiguracion.BOOLEAN
            ),
            
            # Configuraciones de Empresas
            ConfiguracionCreate(
                nombre="VALIDAR_RUC_SUNAT",
                valor="true",
                descripcion="Validar RUC contra SUNAT al crear empresas",
                categoria=CategoriaConfiguracion.EMPRESAS,
                tipo=TipoConfiguracion.BOOLEAN
            ),
            ConfiguracionCreate(
                nombre="PERMITIR_EMPRESAS_DUPLICADAS",
                valor="false",
                descripcion="Permitir empresas con el mismo RUC",
                categoria=CategoriaConfiguracion.EMPRESAS,
                tipo=TipoConfiguracion.BOOLEAN
            ),
            
            # Configuraciones de Resoluciones
            ConfiguracionCreate(
                nombre="ANIOS_VIGENCIA_DEFAULT",
                valor="4",
                descripcion="Años de vigencia por defecto para resoluciones",
                categoria=CategoriaConfiguracion.RESOLUCIONES,
                tipo=TipoConfiguracion.NUMBER,
                validacion={"min": 1, "max": 10}
            ),
            ConfiguracionCreate(
                nombre="MAX_ANIOS_VIGENCIA",
                valor="10",
                descripcion="Máximo de años de vigencia permitidos",
                categoria=CategoriaConfiguracion.RESOLUCIONES,
                tipo=TipoConfiguracion.NUMBER,
                validacion={"min": 1, "max": 20}
            ),
            ConfiguracionCreate(
                nombre="MIN_ANIOS_VIGENCIA",
                valor="1",
                descripcion="Mínimo de años de vigencia permitidos",
                categoria=CategoriaConfiguracion.RESOLUCIONES,
                tipo=TipoConfiguracion.NUMBER,
                validacion={"min": 1, "max": 5}
            )
        ]