# Mesa de Partes - Pydantic Schemas

Este directorio contiene todos los schemas Pydantic para el módulo de Mesa de Partes. Los schemas definen la estructura de datos para validación de entrada, serialización de respuestas y documentación de la API.

## Estructura de Archivos

### `documento.py`
Contiene todos los schemas relacionados con documentos:

**Schemas principales:**
- `DocumentoCreate`: Para crear nuevos documentos
- `DocumentoUpdate`: Para actualizar documentos existentes
- `DocumentoResponse`: Para respuestas completas de documentos
- `DocumentoResumen`: Para listas de documentos (información resumida)
- `FiltrosDocumento`: Para filtros de búsqueda y paginación

**Schemas auxiliares:**
- `TipoDocumentoBase`, `TipoDocumentoResponse`: Para tipos de documento
- `ArchivoAdjuntoBase`, `ArchivoAdjuntoCreate`, `ArchivoAdjuntoResponse`: Para archivos adjuntos
- `DocumentoEstadisticas`: Para estadísticas de documentos
- `DocumentoComprobante`: Para comprobantes de recepción
- `DocumentoArchivar`: Para proceso de archivado

**Enums:**
- `PrioridadEnum`: NORMAL, ALTA, URGENTE
- `EstadoDocumentoEnum`: REGISTRADO, EN_PROCESO, ATENDIDO, ARCHIVADO

### `derivacion.py`
Contiene todos los schemas relacionados con derivaciones:

**Schemas principales:**
- `DerivacionCreate`: Para crear nuevas derivaciones
- `DerivacionUpdate`: Para actualizar derivaciones
- `DerivacionResponse`: Para respuestas completas de derivaciones
- `DerivacionResumen`: Para listas de derivaciones
- `FiltrosDerivacion`: Para filtros de búsqueda

**Schemas de proceso:**
- `DerivacionRecibir`: Para recibir una derivación
- `DerivacionAtender`: Para atender una derivación
- `DerivacionHistorial`: Para historial completo de derivaciones
- `DerivacionMasiva`: Para derivaciones masivas

**Schemas auxiliares:**
- `AreaBase`, `UsuarioBase`: Para información básica de áreas y usuarios
- `DerivacionEstadisticas`: Para estadísticas de derivaciones
- `DerivacionNotificacion`: Para notificaciones

**Enums:**
- `EstadoDerivacionEnum`: PENDIENTE, RECIBIDO, ATENDIDO, RECHAZADO

### `integracion.py`
Contiene todos los schemas relacionados con integraciones externas:

**Schemas principales:**
- `IntegracionCreate`: Para crear nuevas integraciones
- `IntegracionUpdate`: Para actualizar integraciones
- `IntegracionResponse`: Para respuestas completas de integraciones
- `IntegracionResumen`: Para listas de integraciones

**Schemas de intercambio:**
- `DocumentoExterno`: Para intercambio de documentos con sistemas externos
- `DocumentoExternoResponse`: Para respuestas de documentos externos procesados
- `WebhookPayload`, `WebhookResponse`: Para webhooks

**Schemas de configuración:**
- `MapeoCampo`: Para mapeo de campos entre sistemas
- `ConfiguracionWebhook`: Para configuración de webhooks
- `ProbarConexion`, `ProbarConexionResponse`: Para pruebas de conectividad

**Schemas de logging:**
- `LogSincronizacionCreate`, `LogSincronizacionResponse`: Para logs de sincronización
- `FiltrosLogSincronizacion`: Para filtros de logs

**Enums:**
- `TipoIntegracionEnum`: API_REST, WEBHOOK, SOAP, FTP
- `TipoAutenticacionEnum`: API_KEY, BEARER, BASIC, OAUTH2, NONE
- `EstadoConexionEnum`: CONECTADO, DESCONECTADO, ERROR, PROBANDO
- `EstadoSincronizacionEnum`: EXITOSO, ERROR, PENDIENTE, REINTENTANDO

## Características de los Schemas

### Validaciones
Todos los schemas incluyen validaciones apropiadas:
- Longitud mínima y máxima de strings
- Valores numéricos con rangos válidos
- Validaciones de fechas (fechas futuras para límites)
- Validaciones personalizadas con `@validator`

### Documentación
Cada campo incluye:
- Descripción clara del propósito
- Restricciones de validación
- Ejemplos cuando es apropiado

### Configuración
Los schemas de respuesta incluyen:
- `from_attributes = True` para compatibilidad con SQLAlchemy
- Configuración apropiada para serialización

### Paginación y Filtros
Los schemas de filtros incluyen:
- Parámetros de paginación estándar (`page`, `size`)
- Parámetros de ordenamiento (`sort_by`, `sort_order`)
- Validaciones de rangos de fechas

## Uso

```python
from app.schemas.mesa_partes import (
    DocumentoCreate,
    DocumentoResponse,
    DerivacionCreate,
    IntegracionCreate
)

# Crear un documento
documento_data = DocumentoCreate(
    tipo_documento_id="123",
    remitente="Juan Pérez",
    asunto="Solicitud de información",
    prioridad=PrioridadEnum.NORMAL
)

# Filtrar documentos
filtros = FiltrosDocumento(
    estado=EstadoDocumentoEnum.EN_PROCESO,
    page=1,
    size=20
)
```

## Integración con FastAPI

Los schemas se integran automáticamente con FastAPI para:
- Validación automática de request bodies
- Generación automática de documentación OpenAPI
- Serialización automática de respuestas
- Manejo de errores de validación

## Extensibilidad

Los schemas están diseñados para ser extensibles:
- Campos opcionales para futuras funcionalidades
- Configuración adicional mediante diccionarios JSON
- Soporte para metadatos personalizados