from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator, HttpUrl
from enum import Enum

# Enums
class TipoIntegracionEnum(str, Enum):
    API_REST = "API_REST"
    WEBHOOK = "WEBHOOK"
    SOAP = "SOAP"
    FTP = "FTP"

class TipoAutenticacionEnum(str, Enum):
    API_KEY = "API_KEY"
    BEARER = "BEARER"
    BASIC = "BASIC"
    OAUTH2 = "OAUTH2"
    NONE = "NONE"

class EstadoConexionEnum(str, Enum):
    CONECTADO = "CONECTADO"
    DESCONECTADO = "DESCONECTADO"
    ERROR = "ERROR"
    PROBANDO = "PROBANDO"

class EstadoSincronizacionEnum(str, Enum):
    EXITOSO = "EXITOSO"
    ERROR = "ERROR"
    PENDIENTE = "PENDIENTE"
    REINTENTANDO = "REINTENTANDO"

# Base schemas
class MapeoCampo(BaseModel):
    """Schema para mapeo de campos entre sistemas"""
    campo_local: str = Field(..., min_length=1, max_length=100, description="Nombre del campo local")
    campo_remoto: str = Field(..., min_length=1, max_length=100, description="Nombre del campo remoto")
    transformacion: Optional[str] = Field(None, max_length=500, description="Regla de transformación")
    requerido: bool = Field(True, description="Si el campo es requerido")
    tipo_dato: Optional[str] = Field(None, description="Tipo de dato esperado")
    valor_defecto: Optional[str] = Field(None, description="Valor por defecto si no existe")

class ConfiguracionWebhook(BaseModel):
    """Schema para configuración de webhooks"""
    url: HttpUrl = Field(..., description="URL del webhook")
    eventos: List[str] = Field(..., min_items=1, description="Lista de eventos que disparan el webhook")
    secreto: Optional[str] = Field(None, min_length=8, description="Secreto para firma HMAC")
    headers_adicionales: Optional[Dict[str, str]] = Field(None, description="Headers adicionales")
    timeout_segundos: int = Field(30, ge=5, le=300, description="Timeout en segundos")
    max_reintentos: int = Field(3, ge=0, le=10, description="Máximo número de reintentos")

    @validator('eventos')
    def validate_eventos(cls, v):
        eventos_validos = [
            'documento.creado', 'documento.actualizado', 'documento.derivado',
            'documento.recibido', 'documento.atendido', 'documento.archivado',
            'derivacion.creada', 'derivacion.recibida', 'derivacion.atendida'
        ]
        for evento in v:
            if evento not in eventos_validos:
                raise ValueError(f'Evento no válido: {evento}. Eventos válidos: {eventos_validos}')
        return v

# Integracion schemas
class IntegracionCreate(BaseModel):
    """Schema para crear una nueva integración"""
    nombre: str = Field(..., min_length=1, max_length=255, description="Nombre de la integración")
    descripcion: Optional[str] = Field(None, max_length=1000, description="Descripción de la integración")
    codigo: str = Field(..., min_length=1, max_length=50, description="Código único de la integración")
    tipo: TipoIntegracionEnum = Field(..., description="Tipo de integración")
    url_base: HttpUrl = Field(..., description="URL base del sistema externo")
    timeout_segundos: int = Field(30, ge=5, le=300, description="Timeout en segundos")
    
    # Autenticación
    tipo_autenticacion: TipoAutenticacionEnum = Field(TipoAutenticacionEnum.API_KEY, description="Tipo de autenticación")
    credenciales: Optional[str] = Field(None, description="Credenciales de autenticación (se encriptarán)")
    headers_adicionales: Optional[Dict[str, str]] = Field(None, description="Headers adicionales")
    
    # Configuración
    mapeos_campos: List[MapeoCampo] = Field(default_factory=list, description="Mapeos de campos")
    transformaciones: Optional[Dict[str, Any]] = Field(None, description="Reglas de transformación")
    permite_envio: bool = Field(True, description="Si permite envío de documentos")
    permite_recepcion: bool = Field(True, description="Si permite recepción de documentos")
    
    # Webhooks
    configuracion_webhook: Optional[ConfiguracionWebhook] = Field(None, description="Configuración de webhook")
    
    # Configuración de reintentos
    max_reintentos: int = Field(3, ge=0, le=10, description="Máximo número de reintentos")
    intervalo_reintento_minutos: int = Field(5, ge=1, le=60, description="Intervalo entre reintentos")
    
    # Metadatos
    configuracion_adicional: Optional[Dict[str, Any]] = Field(None, description="Configuración adicional")
    version_api: Optional[str] = Field(None, max_length=50, description="Versión de la API")

    @validator('codigo')
    def validate_codigo(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('El código solo puede contener letras, números, guiones y guiones bajos')
        return v.upper()

    @validator('credenciales')
    def validate_credenciales(cls, v, values):
        tipo_auth = values.get('tipo_autenticacion')
        if tipo_auth != TipoAutenticacionEnum.NONE and not v:
            raise ValueError('Las credenciales son requeridas para el tipo de autenticación seleccionado')
        return v

class IntegracionUpdate(BaseModel):
    """Schema para actualizar una integración existente"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=255, description="Nombre de la integración")
    descripcion: Optional[str] = Field(None, max_length=1000, description="Descripción de la integración")
    tipo: Optional[TipoIntegracionEnum] = Field(None, description="Tipo de integración")
    url_base: Optional[HttpUrl] = Field(None, description="URL base del sistema externo")
    timeout_segundos: Optional[int] = Field(None, ge=5, le=300, description="Timeout en segundos")
    
    # Autenticación
    tipo_autenticacion: Optional[TipoAutenticacionEnum] = Field(None, description="Tipo de autenticación")
    credenciales: Optional[str] = Field(None, description="Credenciales de autenticación")
    headers_adicionales: Optional[Dict[str, str]] = Field(None, description="Headers adicionales")
    
    # Configuración
    mapeos_campos: Optional[List[MapeoCampo]] = Field(None, description="Mapeos de campos")
    transformaciones: Optional[Dict[str, Any]] = Field(None, description="Reglas de transformación")
    activa: Optional[bool] = Field(None, description="Si la integración está activa")
    permite_envio: Optional[bool] = Field(None, description="Si permite envío de documentos")
    permite_recepcion: Optional[bool] = Field(None, description="Si permite recepción de documentos")
    
    # Webhooks
    configuracion_webhook: Optional[ConfiguracionWebhook] = Field(None, description="Configuración de webhook")
    
    # Configuración de reintentos
    max_reintentos: Optional[int] = Field(None, ge=0, le=10, description="Máximo número de reintentos")
    intervalo_reintento_minutos: Optional[int] = Field(None, ge=1, le=60, description="Intervalo entre reintentos")
    
    # Metadatos
    configuracion_adicional: Optional[Dict[str, Any]] = Field(None, description="Configuración adicional")
    version_api: Optional[str] = Field(None, max_length=50, description="Versión de la API")

class IntegracionResponse(BaseModel):
    """Schema para respuesta de integración completa"""
    id: str
    nombre: str
    descripcion: Optional[str] = None
    codigo: str
    tipo: TipoIntegracionEnum
    url_base: str
    timeout_segundos: int
    tipo_autenticacion: TipoAutenticacionEnum
    headers_adicionales: Optional[Dict[str, str]] = None
    mapeos_campos: List[MapeoCampo]
    transformaciones: Optional[Dict[str, Any]] = None
    activa: bool
    permite_envio: bool
    permite_recepcion: bool
    estado_conexion: EstadoConexionEnum
    ultima_sincronizacion: Optional[datetime] = None
    ultimo_error: Optional[str] = None
    fecha_ultimo_error: Optional[datetime] = None
    configuracion_webhook: Optional[ConfiguracionWebhook] = None
    max_reintentos: int
    intervalo_reintento_minutos: int
    configuracion_adicional: Optional[Dict[str, Any]] = None
    version_api: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Estadísticas calculadas
    total_sincronizaciones: Optional[int] = None
    sincronizaciones_exitosas: Optional[int] = None
    sincronizaciones_fallidas: Optional[int] = None
    ultima_prueba_conexion: Optional[datetime] = None

    class Config:
        from_attributes = True

class IntegracionResumen(BaseModel):
    """Schema para resumen de integración (para listas)"""
    id: str
    nombre: str
    codigo: str
    tipo: TipoIntegracionEnum
    activa: bool
    estado_conexion: EstadoConexionEnum
    ultima_sincronizacion: Optional[datetime] = None
    total_sincronizaciones: Optional[int] = None

    class Config:
        from_attributes = True

class DocumentoExterno(BaseModel):
    """Schema para intercambio de documentos con sistemas externos"""
    # Identificadores
    id_externo: Optional[str] = Field(None, description="ID en el sistema externo")
    numero_expediente_externo: Optional[str] = Field(None, description="Número de expediente externo")
    
    # Datos básicos del documento
    tipo_documento: str = Field(..., description="Tipo de documento")
    numero_documento: Optional[str] = Field(None, description="Número del documento")
    remitente: str = Field(..., description="Remitente del documento")
    asunto: str = Field(..., description="Asunto del documento")
    numero_folios: int = Field(0, ge=0, description="Número de folios")
    tiene_anexos: bool = Field(False, description="Si tiene anexos")
    
    # Fechas
    fecha_documento: Optional[datetime] = Field(None, description="Fecha del documento")
    fecha_recepcion: Optional[datetime] = Field(None, description="Fecha de recepción")
    fecha_limite: Optional[datetime] = Field(None, description="Fecha límite")
    
    # Estado y prioridad
    estado: Optional[str] = Field(None, description="Estado del documento")
    prioridad: Optional[str] = Field("NORMAL", description="Prioridad del documento")
    
    # Información adicional
    observaciones: Optional[str] = Field(None, description="Observaciones")
    etiquetas: List[str] = Field(default_factory=list, description="Etiquetas")
    
    # Archivos adjuntos
    archivos_adjuntos: List[Dict[str, Any]] = Field(default_factory=list, description="Archivos adjuntos")
    
    # Información del remitente/destinatario
    entidad_origen: Optional[str] = Field(None, description="Entidad de origen")
    entidad_destino: Optional[str] = Field(None, description="Entidad de destino")
    
    # Metadatos de integración
    metadatos_integracion: Optional[Dict[str, Any]] = Field(None, description="Metadatos específicos de la integración")

class DocumentoExternoResponse(BaseModel):
    """Schema para respuesta de documento externo procesado"""
    id_local: str = Field(..., description="ID asignado en el sistema local")
    numero_expediente_local: str = Field(..., description="Número de expediente local")
    id_externo: Optional[str] = Field(None, description="ID en el sistema externo")
    estado_procesamiento: str = Field(..., description="Estado del procesamiento")
    errores: List[str] = Field(default_factory=list, description="Lista de errores si los hay")
    advertencias: List[str] = Field(default_factory=list, description="Lista de advertencias")

class ProbarConexion(BaseModel):
    """Schema para probar conexión de integración"""
    incluir_autenticacion: bool = Field(True, description="Si incluir prueba de autenticación")
    endpoint_prueba: Optional[str] = Field(None, description="Endpoint específico para probar")

class ProbarConexionResponse(BaseModel):
    """Schema para respuesta de prueba de conexión"""
    exitoso: bool
    tiempo_respuesta_ms: int
    codigo_respuesta: Optional[int] = None
    mensaje: str
    detalles_error: Optional[str] = None
    fecha_prueba: datetime

class LogSincronizacionCreate(BaseModel):
    """Schema para crear log de sincronización"""
    integracion_id: str
    documento_id: Optional[str] = None
    documento_numero_expediente: Optional[str] = None
    operacion: str = Field(..., description="Tipo de operación: ENVIO, RECEPCION, CONSULTA_ESTADO")
    direccion: str = Field(..., description="Dirección: SALIDA, ENTRADA")
    datos_enviados: Optional[Dict[str, Any]] = None
    datos_recibidos: Optional[Dict[str, Any]] = None
    codigo_respuesta: Optional[int] = None
    mensaje_respuesta: Optional[str] = None
    mensaje_error: Optional[str] = None
    tiempo_respuesta_ms: Optional[int] = None
    id_externo: Optional[str] = None
    referencia_externa: Optional[str] = None

class LogSincronizacionResponse(BaseModel):
    """Schema para respuesta de log de sincronización"""
    id: str
    integracion_id: str
    documento_id: Optional[str] = None
    documento_numero_expediente: Optional[str] = None
    operacion: str
    direccion: str
    estado: EstadoSincronizacionEnum
    codigo_respuesta: Optional[int] = None
    mensaje_respuesta: Optional[str] = None
    datos_enviados: Optional[Dict[str, Any]] = None
    datos_recibidos: Optional[Dict[str, Any]] = None
    mensaje_error: Optional[str] = None
    stack_trace: Optional[str] = None
    numero_intento: int
    fecha_proximo_reintento: Optional[datetime] = None
    tiempo_respuesta_ms: Optional[int] = None
    ip_origen: Optional[str] = None
    user_agent: Optional[str] = None
    id_externo: Optional[str] = None
    referencia_externa: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FiltrosLogSincronizacion(BaseModel):
    """Schema para filtros de logs de sincronización"""
    integracion_id: Optional[str] = Field(None, description="Filtrar por integración")
    documento_id: Optional[str] = Field(None, description="Filtrar por documento")
    operacion: Optional[str] = Field(None, description="Filtrar por operación")
    estado: Optional[EstadoSincronizacionEnum] = Field(None, description="Filtrar por estado")
    fecha_desde: Optional[datetime] = Field(None, description="Fecha desde")
    fecha_hasta: Optional[datetime] = Field(None, description="Fecha hasta")
    solo_errores: Optional[bool] = Field(None, description="Solo logs con errores")
    
    # Parámetros de paginación
    page: int = Field(1, ge=1, description="Número de página")
    size: int = Field(20, ge=1, le=100, description="Tamaño de página")
    
    # Parámetros de ordenamiento
    sort_by: Optional[str] = Field("created_at", description="Campo por el cual ordenar")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$", description="Orden ascendente o descendente")

class IntegracionEstadisticas(BaseModel):
    """Schema para estadísticas de integraciones"""
    total_integraciones: int
    integraciones_activas: int
    integraciones_conectadas: int
    integraciones_con_error: int
    total_sincronizaciones_hoy: int
    sincronizaciones_exitosas_hoy: int
    sincronizaciones_fallidas_hoy: int
    documentos_enviados_hoy: int
    documentos_recibidos_hoy: int
    tiempo_promedio_respuesta_ms: Optional[float] = None

class WebhookPayload(BaseModel):
    """Schema para payload de webhook"""
    evento: str = Field(..., description="Tipo de evento")
    timestamp: datetime = Field(..., description="Timestamp del evento")
    datos: Dict[str, Any] = Field(..., description="Datos del evento")
    integracion_codigo: str = Field(..., description="Código de la integración")
    firma: Optional[str] = Field(None, description="Firma HMAC del payload")

class WebhookResponse(BaseModel):
    """Schema para respuesta de webhook"""
    recibido: bool = Field(True, description="Si el webhook fue recibido")
    procesado: bool = Field(..., description="Si el webhook fue procesado exitosamente")
    mensaje: Optional[str] = Field(None, description="Mensaje de respuesta")
    errores: List[str] = Field(default_factory=list, description="Lista de errores si los hay")