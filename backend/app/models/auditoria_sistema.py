from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class ModuloAuditoria(str, Enum):
    VEHICULOS = "VEHICULOS"
    RUTAS = "RUTAS"
    EMPRESAS = "EMPRESAS"
    RESOLUCIONES = "RESOLUCIONES"
    TUCS = "TUCS"
    INFRAESTRUCTURA = "INFRAESTRUCTURA"
    SEGURIDAD = "SEGURIDAD"

class AccionAuditoria(str, Enum):
    REGISTRO = "REGISTRO"
    MODIFICACION = "MODIFICACION"
    ELIMINACION = "ELIMINACION"
    SUSTITUCION = "SUSTITUCION"
    INCREMENTO = "INCREMENTO"
    BAJA_VEHICULAR = "BAJA_VEHICULAR"
    CAMBIO_ESTADO = "CAMBIO_ESTADO"
    CAMBIO_REPRESENTANTE = "CAMBIO_REPRESENTANTE"
    ASIGNACION_RUTA = "ASIGNACION_RUTA"
    DESASIGNACION_RUTA = "DESASIGNACION_RUTA"
    EMISION_TUC = "EMISION_TUC"
    ANULACION_TUC = "ANULACION_TUC"
    IMPORTACION_MASIVA = "IMPORTACION_MASIVA"

class SeveridadAuditoria(str, Enum):
    CRITICA = "CRITICA"   # Bajas definitivas, inhabilitaciones, cesiones
    ALTA = "ALTA"         # Sustituciones, incrementos, modificación de ruta
    MEDIA = "MEDIA"       # Actualización de datos generales, representantes
    BAJA = "BAJA"         # Operaciones menores o informativas

class UsuarioAuditoria(BaseModel):
    id: Optional[str] = None
    dni: Optional[str] = "SISTEMA"
    nombre: Optional[str] = "Administrador del Sistema"
    email: Optional[str] = "admin@sirret.gob.pe"
    rol: Optional[str] = "ADMIN"

class LogAuditoriaSistema(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    usuario: UsuarioAuditoria = Field(default_factory=UsuarioAuditoria)
    ip_address: Optional[str] = "127.0.0.1"
    user_agent: Optional[str] = None
    modulo: ModuloAuditoria
    accion: AccionAuditoria
    severidad: SeveridadAuditoria = SeveridadAuditoria.MEDIA
    
    # Entidad intervenida
    entidad_tipo: str = Field(..., description="Nombre de la entidad, ej: empresa, ruta, flota_empresa, resolucion")
    entidad_id: str = Field(..., description="ID, placa, RUC o número de resolución principal")
    entidad_referencia: Optional[str] = Field(None, description="Nombre legible, ej: Empresa XYZ - Placa V0P-965")
    
    # Trazabilidad y sustento legal
    descripcion: str = Field(..., description="Resumen descriptivo del cambio para el auditor")
    acto_resolutivo_sustento: Optional[str] = Field(None, description="Resolución, expediente u oficio que ampara el cambio")
    expediente_numero: Optional[str] = Field(None, description="Número de expediente administrativo")
    
    # Valores de cambio (Diff)
    valores_anteriores: Optional[Dict[str, Any]] = None
    valores_nuevos: Optional[Dict[str, Any]] = None
    campos_modificados: Optional[List[str]] = Field(default_factory=list)
    
    # Metadatos adicionales
    metadatos: Optional[Dict[str, Any]] = Field(default_factory=dict)
    es_historico_migrado: bool = False

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class FiltrosAuditoriaQuery(BaseModel):
    modulo: Optional[ModuloAuditoria] = None
    accion: Optional[AccionAuditoria] = None
    severidad: Optional[SeveridadAuditoria] = None
    q: Optional[str] = None
    fecha_desde: Optional[datetime] = None
    fecha_hasta: Optional[datetime] = None
    usuario_dni: Optional[str] = None
    page: int = 1
    page_size: int = 25

class AuditoriaKPIsResponse(BaseModel):
    totalEventos: int
    eventosUltimas24h: int
    eventosUltimos7d: int
    eventosCriticos: int
    eventosAltos: int
    porModulo: Dict[str, int]
    porAccion: Dict[str, int]
    porSeveridad: Dict[str, int]
    topUsuarios: List[Dict[str, Any]]
