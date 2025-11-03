"""
Schemas para sistema de auditoría
"""
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


# Enums
class TipoEventoEnum(str, Enum):
    # Eventos de documentos
    DOCUMENTO_CREADO = "documento_creado"
    DOCUMENTO_ACTUALIZADO = "documento_actualizado"
    DOCUMENTO_ELIMINADO = "documento_eliminado"
    DOCUMENTO_ARCHIVADO = "documento_archivado"
    ARCHIVO_ADJUNTADO = "archivo_adjuntado"
    
    # Eventos de derivación
    DOCUMENTO_DERIVADO = "documento_derivado"
    DOCUMENTO_RECIBIDO = "documento_recibido"
    DOCUMENTO_ATENDIDO = "documento_atendido"
    DERIVACION_REASIGNADA = "derivacion_reasignada"
    
    # Eventos de integración
    INTEGRACION_CREADA = "integracion_creada"
    INTEGRACION_ACTUALIZADA = "integracion_actualizada"
    INTEGRACION_ELIMINADA = "integracion_eliminada"
    DOCUMENTO_ENVIADO_EXTERNO = "documento_enviado_externo"
    DOCUMENTO_RECIBIDO_EXTERNO = "documento_recibido_externo"
    WEBHOOK_ENVIADO = "webhook_enviado"
    WEBHOOK_RECIBIDO = "webhook_recibido"
    
    # Eventos de seguridad
    LOGIN_EXITOSO = "login_exitoso"
    LOGIN_FALLIDO = "login_fallido"
    ACCESO_DENEGADO = "acceso_denegado"
    API_KEY_ROTADA = "api_key_rotada"
    WEBHOOK_SECRET_ROTADO = "webhook_secret_rotado"
    INTENTO_ACCESO_NO_AUTORIZADO = "intento_acceso_no_autorizado"
    
    # Eventos de administración
    USUARIO_CREADO = "usuario_creado"
    USUARIO_ACTUALIZADO = "usuario_actualizado"
    USUARIO_DESACTIVADO = "usuario_desactivado"
    ROL_ASIGNADO = "rol_asignado"
    ROL_REMOVIDO = "rol_removido"
    PERMISO_ASIGNADO = "permiso_asignado"
    PERMISO_REMOVIDO = "permiso_removido"
    
    # Eventos de sistema
    SISTEMA_INICIADO = "sistema_iniciado"
    SISTEMA_DETENIDO = "sistema_detenido"
    BACKUP_REALIZADO = "backup_realizado"
    MANTENIMIENTO_INICIADO = "mantenimiento_iniciado"
    MANTENIMIENTO_FINALIZADO = "mantenimiento_finalizado"


class SeveridadEnum(str, Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


# Schemas para LogAuditoria
class LogAuditoriaBase(BaseModel):
    tipo_evento: str = Field(..., description="Tipo de evento")
    severidad: SeveridadEnum = Field(default=SeveridadEnum.INFO, description="Severidad del evento")
    descripcion: str = Field(..., description="Descripción del evento")
    
    usuario_id: Optional[str] = Field(None, description="ID del usuario")
    usuario_email: Optional[str] = Field(None, description="Email del usuario")
    usuario_nombre: Optional[str] = Field(None, description="Nombre del usuario")
    
    session_id: Optional[str] = Field(None, description="ID de sesión")
    ip_address: Optional[str] = Field(None, description="Dirección IP")
    user_agent: Optional[str] = Field(None, description="User Agent")
    
    recurso_tipo: Optional[str] = Field(None, description="Tipo de recurso afectado")
    recurso_id: Optional[str] = Field(None, description="ID del recurso")
    recurso_nombre: Optional[str] = Field(None, description="Nombre del recurso")
    
    datos_anteriores: Optional[Dict[str, Any]] = Field(None, description="Estado anterior")
    datos_nuevos: Optional[Dict[str, Any]] = Field(None, description="Estado nuevo")
    metadatos: Optional[Dict[str, Any]] = Field(None, description="Metadatos adicionales")
    
    endpoint: Optional[str] = Field(None, description="Endpoint accedido")
    metodo_http: Optional[str] = Field(None, description="Método HTTP")
    codigo_respuesta: Optional[int] = Field(None, description="Código de respuesta HTTP")
    duracion_ms: Optional[int] = Field(None, description="Duración en milisegundos")
    
    es_exitoso: bool = Field(True, description="Si la operación fue exitosa")


class LogAuditoriaCreate(LogAuditoriaBase):
    pass


class LogAuditoriaResponse(LogAuditoriaBase):
    id: str
    timestamp: datetime
    contexto_aplicacion: str
    version_aplicacion: Optional[str] = None
    requiere_atencion: bool
    procesado: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Schemas para filtros
class FiltrosAuditoria(BaseModel):
    fecha_inicio: Optional[datetime] = Field(None, description="Fecha de inicio del rango")
    fecha_fin: Optional[datetime] = Field(None, description="Fecha de fin del rango")
    tipo_evento: Optional[Union[str, List[str]]] = Field(None, description="Tipo(s) de evento")
    severidad: Optional[Union[SeveridadEnum, List[SeveridadEnum]]] = Field(None, description="Severidad(es)")
    usuario_id: Optional[str] = Field(None, description="ID del usuario")
    recurso_tipo: Optional[str] = Field(None, description="Tipo de recurso")
    recurso_id: Optional[str] = Field(None, description="ID del recurso")
    ip_address: Optional[str] = Field(None, description="Dirección IP")
    es_exitoso: Optional[bool] = Field(None, description="Si fue exitoso")
    busqueda: Optional[str] = Field(None, description="Búsqueda en texto libre")


# Schemas para ConfiguracionAuditoria
class ConfiguracionAuditoriaBase(BaseModel):
    dias_retencion: int = Field(365, description="Días de retención de logs")
    max_logs_por_dia: int = Field(100000, description="Máximo de logs por día")
    eventos_habilitados: List[str] = Field(default=[], description="Eventos a auditar")
    severidades_habilitadas: List[str] = Field(default=[], description="Severidades a registrar")
    comprimir_logs_antiguos: bool = Field(True, description="Comprimir logs antiguos")
    archivar_logs_antiguos: bool = Field(True, description="Archivar logs antiguos")
    ruta_archivo: Optional[str] = Field(None, description="Ruta de archivo")
    alertas_habilitadas: bool = Field(True, description="Habilitar alertas")
    email_alertas: Optional[str] = Field(None, description="Email para alertas")
    webhook_alertas: Optional[str] = Field(None, description="Webhook para alertas")
    procesamiento_asincrono: bool = Field(True, description="Procesamiento asíncrono")
    batch_size: int = Field(100, description="Tamaño de lote")


class ConfiguracionAuditoriaCreate(ConfiguracionAuditoriaBase):
    pass


class ConfiguracionAuditoriaUpdate(BaseModel):
    dias_retencion: Optional[int] = None
    max_logs_por_dia: Optional[int] = None
    eventos_habilitados: Optional[List[str]] = None
    severidades_habilitadas: Optional[List[str]] = None
    comprimir_logs_antiguos: Optional[bool] = None
    archivar_logs_antiguos: Optional[bool] = None
    ruta_archivo: Optional[str] = None
    alertas_habilitadas: Optional[bool] = None
    email_alertas: Optional[str] = None
    webhook_alertas: Optional[str] = None
    procesamiento_asincrono: Optional[bool] = None
    batch_size: Optional[int] = None


class ConfiguracionAuditoriaResponse(ConfiguracionAuditoriaBase):
    id: str
    activa: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True


# Schemas para AlertaAuditoria
class AlertaAuditoriaBase(BaseModel):
    titulo: str = Field(..., description="Título de la alerta")
    descripcion: Optional[str] = Field(None, description="Descripción de la alerta")
    severidad: SeveridadEnum = Field(..., description="Severidad de la alerta")
    patron_detectado: Optional[str] = Field(None, description="Patrón detectado")
    numero_ocurrencias: int = Field(1, description="Número de ocurrencias")
    ventana_tiempo_minutos: Optional[int] = Field(None, description="Ventana de tiempo en minutos")


class AlertaAuditoriaResponse(AlertaAuditoriaBase):
    id: str
    log_auditoria_id: str
    estado: str
    asignada_a: Optional[str] = None
    acciones_automaticas: Optional[Dict[str, Any]] = None
    acciones_manuales: Optional[Dict[str, Any]] = None
    notas: Optional[str] = None
    detectada_en: datetime
    revisada_en: Optional[datetime] = None
    resuelta_en: Optional[datetime] = None
    metadatos: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AlertaAuditoriaUpdate(BaseModel):
    estado: Optional[str] = Field(None, description="Estado de la alerta")
    asignada_a: Optional[str] = Field(None, description="Usuario asignado")
    acciones_manuales: Optional[Dict[str, Any]] = Field(None, description="Acciones manuales")
    notas: Optional[str] = Field(None, description="Notas adicionales")


# Schemas para EstadisticasAuditoria
class EstadisticasAuditoriaResponse(BaseModel):
    id: str
    fecha: datetime
    periodo: str
    total_eventos: int
    eventos_por_tipo: Dict[str, int]
    eventos_por_severidad: Dict[str, int]
    eventos_por_usuario: Dict[str, int]
    intentos_acceso_fallidos: int
    accesos_exitosos: int
    alertas_generadas: int
    tiempo_promedio_respuesta: Optional[int] = None
    operaciones_exitosas: int
    operaciones_fallidas: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Schemas para respuestas de estadísticas
class ResumenEstadisticas(BaseModel):
    total_eventos: int = Field(..., description="Total de eventos")
    eventos_exitosos: int = Field(..., description="Eventos exitosos")
    eventos_fallidos: int = Field(..., description="Eventos fallidos")
    tasa_exito: float = Field(..., description="Tasa de éxito en porcentaje")


class EstadisticasPeriodo(BaseModel):
    periodo: Dict[str, str] = Field(..., description="Información del período")
    resumen: ResumenEstadisticas = Field(..., description="Resumen estadístico")
    eventos_por_tipo: Dict[str, int] = Field(..., description="Eventos por tipo")
    eventos_por_severidad: Dict[str, int] = Field(..., description="Eventos por severidad")
    top_usuarios: List[Dict[str, Union[str, int]]] = Field(..., description="Usuarios más activos")
    top_ips: List[Dict[str, Union[str, int]]] = Field(..., description="IPs más activas")


# Schemas para requests específicos
class BusquedaAuditoriaRequest(BaseModel):
    filtros: FiltrosAuditoria = Field(..., description="Filtros de búsqueda")
    skip: int = Field(0, ge=0, description="Registros a omitir")
    limit: int = Field(100, ge=1, le=1000, description="Límite de registros")


class EstadisticasRequest(BaseModel):
    fecha_inicio: datetime = Field(..., description="Fecha de inicio")
    fecha_fin: datetime = Field(..., description="Fecha de fin")
    agrupar_por: str = Field("dia", pattern="^(hora|dia|semana|mes)$", description="Agrupación")


class MantenimientoRequest(BaseModel):
    accion: str = Field(..., pattern="^(limpiar_logs|generar_estadisticas|comprimir_logs)$")
    parametros: Optional[Dict[str, Any]] = Field(None, description="Parámetros adicionales")


# Schemas para respuestas de operaciones
class ResultadoOperacion(BaseModel):
    exitoso: bool = Field(..., description="Si la operación fue exitosa")
    mensaje: str = Field(..., description="Mensaje de resultado")
    datos: Optional[Dict[str, Any]] = Field(None, description="Datos adicionales")


class ResultadoLimpieza(BaseModel):
    logs_eliminados: int = Field(..., description="Número de logs eliminados")
    fecha_limite: datetime = Field(..., description="Fecha límite de limpieza")
    espacio_liberado_mb: Optional[float] = Field(None, description="Espacio liberado en MB")


# Schemas para exportación
class ExportarAuditoriaRequest(BaseModel):
    filtros: FiltrosAuditoria = Field(..., description="Filtros para exportación")
    formato: str = Field("csv", pattern="^(csv|json|xlsx)$", description="Formato de exportación")
    incluir_metadatos: bool = Field(True, description="Incluir metadatos")
    incluir_datos_sensibles: bool = Field(False, description="Incluir datos sensibles")


class ConfiguracionEventos(BaseModel):
    eventos_disponibles: List[Dict[str, str]] = Field(..., description="Eventos disponibles")
    severidades_disponibles: List[Dict[str, str]] = Field(..., description="Severidades disponibles")
    configuracion_actual: ConfiguracionAuditoriaResponse = Field(..., description="Configuración actual")