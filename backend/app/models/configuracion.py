"""
Modelos para configuraciones del sistema
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class CategoriaConfiguracion(str, Enum):
    RESOLUCIONES = 'RESOLUCIONES'
    EXPEDIENTES = 'EXPEDIENTES'
    EMPRESAS = 'EMPRESAS'
    USUARIOS = 'USUARIOS'
    SISTEMA = 'SISTEMA'
    NOTIFICACIONES = 'NOTIFICACIONES'
    REPORTES = 'REPORTES'
    GENERAL = 'GENERAL'
    VEHICULOS = 'VEHICULOS'

class ConfiguracionResponse(BaseModel):
    """Modelo de respuesta para configuración"""
    id: str
    nombre: str
    valor: str
    descripcion: Optional[str] = None
    categoria: CategoriaConfiguracion
    activo: bool = True
    esEditable: bool = True
    fechaCreacion: datetime
    fechaActualizacion: datetime
    creadoPor: Optional[str] = "SISTEMA"
    actualizadoPor: Optional[str] = "SISTEMA"

class ConfiguracionCreate(BaseModel):
    """Modelo para crear configuración"""
    nombre: str = Field(..., description="Nombre único de la configuración")
    valor: str = Field(..., description="Valor de la configuración")
    descripcion: Optional[str] = None
    categoria: CategoriaConfiguracion
    esEditable: bool = True

class ConfiguracionUpdate(BaseModel):
    """Modelo para actualizar configuración"""
    valor: Optional[str] = None
    descripcion: Optional[str] = None
    esEditable: Optional[bool] = None

class ConfiguracionesPorCategoria(BaseModel):
    """Modelo para respuesta de configuraciones por categoría"""
    categoria: CategoriaConfiguracion
    configuraciones: List[ConfiguracionResponse]
    total: int

# Mantener compatibilidad con el modelo anterior
class TipoConfiguracion(str, Enum):
    TIPOS_SERVICIO = "TIPOS_SERVICIO"
    ESTADOS_EMPRESA = "ESTADOS_EMPRESA"
    TIPOS_DOCUMENTO = "TIPOS_DOCUMENTO"
    PARAMETROS_SISTEMA = "PARAMETROS_SISTEMA"

class ConfiguracionItem(BaseModel):
    """Item individual de configuración"""
    codigo: str = Field(..., description="Código único del item")
    nombre: str = Field(..., description="Nombre descriptivo del item")
    descripcion: Optional[str] = None
    estaActivo: bool = True
    orden: int = 0
    metadatos: Optional[Dict[str, Any]] = None

class Configuracion(BaseModel):
    """Modelo principal de configuración (legacy)"""
    id: Optional[str] = None
    tipo: TipoConfiguracion
    nombre: str = Field(..., description="Nombre de la configuración")
    descripcion: Optional[str] = None
    items: List[ConfiguracionItem] = Field(default_factory=list)
    estaActivo: bool = True
    fechaCreacion: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    creadoPor: str
    actualizadoPor: Optional[str] = None

# Configuraciones predefinidas del sistema
CONFIGURACIONES_PREDEFINIDAS = {
    "TIPOS_SERVICIO": {
        "nombre": "Tipos de Servicio de Empresas",
        "descripcion": "Tipos de servicio que pueden ofrecer las empresas de transporte",
        "items": [
            {
                "codigo": "PERSONAS",
                "nombre": "Transporte de Personas",
                "descripcion": "Servicio de transporte de pasajeros",
                "orden": 1
            },
            {
                "codigo": "TURISMO",
                "nombre": "Turismo",
                "descripcion": "Servicio de transporte turístico",
                "orden": 2
            },
            {
                "codigo": "TRABAJADORES",
                "nombre": "Transporte de Trabajadores",
                "descripcion": "Servicio de transporte de personal laboral",
                "orden": 3
            },
            {
                "codigo": "MERCANCIAS",
                "nombre": "Transporte de Mercancías",
                "descripcion": "Servicio de transporte de carga y mercancías",
                "orden": 4
            },
            {
                "codigo": "ESTUDIANTES",
                "nombre": "Transporte de Estudiantes",
                "descripcion": "Servicio de transporte escolar y universitario",
                "orden": 5
            },
            {
                "codigo": "TERMINAL_TERRESTRE",
                "nombre": "Terminal Terrestre",
                "descripción": "Operación de terminal terrestre",
                "orden": 6
            },
            {
                "codigo": "ESTACION_DE_RUTA",
                "nombre": "Estación de Ruta",
                "descripcion": "Operación de estación de ruta",
                "orden": 7
            },
            {
                "codigo": "OTROS",
                "nombre": "Otros Servicios",
                "descripcion": "Otros tipos de servicio de transporte",
                "orden": 8
            }
        ]
    }
}