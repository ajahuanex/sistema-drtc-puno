# API Documentation - Módulo de Mesa de Partes

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Endpoints de Documentos](#endpoints-de-documentos)
4. [Endpoints de Derivaciones](#endpoints-de-derivaciones)
5. [Endpoints de Integraciones](#endpoints-de-integraciones)
6. [Endpoints de Notificaciones](#endpoints-de-notificaciones)
7. [Endpoints de Reportes](#endpoints-de-reportes)
8. [Webhooks](#webhooks)
9. [Códigos de Error](#códigos-de-error)
10. [Rate Limiting](#rate-limiting)

---

## Introducción

La API REST del Módulo de Mesa de Partes permite la integración con sistemas externos para automatizar el registro, consulta y gestión de documentos.

### Base URL

```
https://[servidor]/api/v1
```

### Formato de Respuesta

Todas las respuestas están en formato JSON.

### Versionado

La API utiliza versionado en la URL. La versión actual es `v1`.

---

## Autenticación

### Métodos de Autenticación

#### 1. JWT Token (Para usuarios)

```http
POST /auth/login
Content-Type: application/json

{
  "username": "usuario",
  "password": "contraseña"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Uso del Token:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 2. API Key (Para integraciones)

```http
X-API-Key: your-api-key-here
X-Integration-ID: integration-uuid
```

---

## Endpoints de Documentos

### Crear Documento

Registra un nuevo documento en el sistema.

**Endpoint:** `POST /documentos`

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "tipo_documento_id": "uuid",
  "numero_documento_externo": "OF-2025-001",
  "remitente": "Juan Pérez García",
  "asunto": "Solicitud de información pública",
  "numero_folios": 5,
  "tiene_anexos": true,
  "prioridad": "ALTA",
  "fecha_limite": "2025-02-15T23:59:59Z",
  "expediente_relacionado_id": "uuid",
  "etiquetas": ["urgente", "legal"]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "numero_expediente": "EXP-2025-0001",
  "tipo_documento": {
    "id": "uuid",
    "nombre": "Solicitud",
    "codigo": "SOL"
  },
  "numero_documento_externo": "OF-2025-001",
  "remitente": "Juan Pérez García",
  "asunto": "Solicitud de información pública",
  "numero_folios": 5,
  "tiene_anexos": true,
  "prioridad": "ALTA",
  "estado": "REGISTRADO",
  "fecha_recepcion": "2025-01-15T10:30:00Z",
  "fecha_limite": "2025-02-15T23:59:59Z",
  "usuario_registro": {
    "id": "uuid",
    "nombre": "María López"
  },
  "codigo_qr": "https://[servidor]/consulta/EXP-2025-0001",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

### Obtener Documento

**Endpoint:** `GET /documentos/{id}`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "numero_expediente": "EXP-2025-0001",
  "tipo_documento": {...},
  "remitente": "Juan Pérez García",
  "asunto": "Solicitud de información pública",
  "estado": "EN_PROCESO",
  "area_actual": {
    "id": "uuid",
    "nombre": "Área Legal"
  },
  "archivos_adjuntos": [
    {
      "id": "uuid",
      "nombre_archivo": "solicitud.pdf",
      "tipo_mime": "application/pdf",
      "tamano": 1024000,
      "url": "https://[servidor]/archivos/uuid",
      "fecha_subida": "2025-01-15T10:30:00Z"
    }
  ],
  "derivaciones": [...],
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

### Listar Documentos

**Endpoint:** `GET /documentos`

**Query Parameters:**
- `page` (int): Número de página (default: 1)
- `page_size` (int): Tamaño de página (default: 20, max: 100)
- `estado` (string): Filtrar por estado
- `tipo_documento_id` (uuid): Filtrar por tipo
- `fecha_desde` (date): Fecha inicio
- `fecha_hasta` (date): Fecha fin
- `prioridad` (string): Filtrar por prioridad
- `area_id` (uuid): Filtrar por área actual
- `search` (string): Búsqueda en expediente, remitente, asunto

**Example:**
```http
GET /documentos?page=1&page_size=20&estado=EN_PROCESO&prioridad=ALTA
```

**Response:** `200 OK`
```json
{
  "total": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8,
  "items": [
    {
      "id": "uuid",
      "numero_expediente": "EXP-2025-0001",
      "tipo_documento": {...},
      "remitente": "Juan Pérez García",
      "asunto": "Solicitud de información pública",
      "estado": "EN_PROCESO",
      "prioridad": "ALTA",
      "fecha_recepcion": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Actualizar Documento

**Endpoint:** `PUT /documentos/{id}`

**Request Body:**
```json
{
  "asunto": "Solicitud de información pública - Actualizado",
  "prioridad": "URGENTE",
  "fecha_limite": "2025-02-10T23:59:59Z"
}
```

**Response:** `200 OK`

### Archivar Documento

**Endpoint:** `DELETE /documentos/{id}`

**Request Body:**
```json
{
  "clasificacion": "LEGAL-2025",
  "motivo": "Trámite finalizado"
}
```

**Response:** `200 OK`

### Adjuntar Archivo

**Endpoint:** `POST /documentos/{id}/archivos`

**Headers:**
```http
Content-Type: multipart/form-data
```

**Form Data:**
- `archivo`: File

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "nombre_archivo": "documento.pdf",
  "tipo_mime": "application/pdf",
  "tamano": 1024000,
  "url": "https://[servidor]/archivos/uuid",
  "fecha_subida": "2025-01-15T10:30:00Z"
}
```

### Generar Comprobante

**Endpoint:** `GET /documentos/{id}/comprobante`

**Response:** `200 OK`
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="comprobante-EXP-2025-0001.pdf"

[PDF Binary Data]
```

---

## Endpoints de Derivaciones

### Derivar Documento

**Endpoint:** `POST /derivaciones`

**Request Body:**
```json
{
  "documento_id": "uuid",
  "area_destino_id": "uuid",
  "instrucciones": "Revisar y emitir opinión legal",
  "es_urgente": true,
  "fecha_limite": "2025-02-01T23:59:59Z",
  "notificar_email": true
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "documento_id": "uuid",
  "area_origen": {
    "id": "uuid",
    "nombre": "Mesa de Partes"
  },
  "area_destino": {
    "id": "uuid",
    "nombre": "Área Legal"
  },
  "usuario_deriva": {
    "id": "uuid",
    "nombre": "María López"
  },
  "instrucciones": "Revisar y emitir opinión legal",
  "fecha_derivacion": "2025-01-15T10:30:00Z",
  "estado": "PENDIENTE",
  "es_urgente": true
}
```

### Recibir Documento

**Endpoint:** `PUT /derivaciones/{id}/recibir`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "estado": "RECIBIDO",
  "fecha_recepcion": "2025-01-15T14:00:00Z",
  "usuario_recibe": {
    "id": "uuid",
    "nombre": "Carlos Ruiz"
  }
}
```

### Obtener Historial de Derivaciones

**Endpoint:** `GET /derivaciones/documento/{documento_id}`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "area_origen": {...},
    "area_destino": {...},
    "usuario_deriva": {...},
    "usuario_recibe": {...},
    "instrucciones": "Revisar y emitir opinión legal",
    "fecha_derivacion": "2025-01-15T10:30:00Z",
    "fecha_recepcion": "2025-01-15T14:00:00Z",
    "fecha_atencion": "2025-01-16T16:00:00Z",
    "estado": "ATENDIDO",
    "observaciones": "Opinión legal emitida",
    "es_urgente": true
  }
]
```

### Obtener Documentos por Área

**Endpoint:** `GET /derivaciones/area/{area_id}`

**Query Parameters:**
- `estado` (string): Filtrar por estado de derivación
- `page` (int): Número de página
- `page_size` (int): Tamaño de página

**Response:** `200 OK`

### Registrar Atención

**Endpoint:** `PUT /derivaciones/{id}/atender`

**Request Body:**
```json
{
  "observaciones": "Se emitió opinión legal favorable",
  "archivos_respuesta": ["uuid1", "uuid2"]
}
```

**Response:** `200 OK`

---

## Endpoints de Integraciones

### Crear Integración

**Endpoint:** `POST /integraciones`

**Request Body:**
```json
{
  "nombre": "Mesa de Partes - Municipalidad Provincial",
  "descripcion": "Integración con mesa de partes de la municipalidad",
  "tipo": "API_REST",
  "url_base": "https://municipalidad.gob.pe/api/v1",
  "tipo_autenticacion": "API_KEY",
  "credenciales": {
    "api_key": "secret-key-here"
  },
  "mapeos_campos": [
    {
      "campo_local": "numero_expediente",
      "campo_remoto": "nro_expediente"
    },
    {
      "campo_local": "remitente",
      "campo_remoto": "remitente_nombre"
    }
  ],
  "configuracion_webhook": {
    "url": "https://[servidor]/api/v1/integracion/webhook",
    "eventos": ["documento.creado", "documento.derivado"],
    "secreto": "webhook-secret"
  }
}
```

**Response:** `201 Created`

### Probar Conexión

**Endpoint:** `POST /integraciones/{id}/probar`

**Response:** `200 OK`
```json
{
  "conectado": true,
  "mensaje": "Conexión exitosa",
  "tiempo_respuesta_ms": 150
}
```

### Enviar Documento a Integración

**Endpoint:** `POST /integraciones/{id}/enviar/{documento_id}`

**Response:** `200 OK`
```json
{
  "success": true,
  "id_externo": "EXT-2025-0001",
  "mensaje": "Documento enviado exitosamente"
}
```

### Obtener Log de Sincronización

**Endpoint:** `GET /integraciones/{id}/log`

**Query Parameters:**
- `fecha_desde` (date)
- `fecha_hasta` (date)
- `estado` (string): EXITOSO, ERROR

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "documento_id": "uuid",
    "tipo_operacion": "ENVIO",
    "estado": "EXITOSO",
    "mensaje": "Documento enviado correctamente",
    "fecha": "2025-01-15T10:30:00Z",
    "datos_adicionales": {...}
  }
]
```

---

## Endpoints de Integración Externa

### Recibir Documento Externo

**Endpoint:** `POST /integracion/recibir-documento`

**Headers:**
```http
X-API-Key: your-api-key
X-Integration-ID: integration-uuid
Content-Type: application/json
```

**Request Body:**
```json
{
  "numero_expediente_externo": "EXT-2025-0001",
  "tipo_documento": "Oficio",
  "remitente": "Municipalidad Provincial",
  "asunto": "Solicitud de coordinación",
  "numero_folios": 3,
  "prioridad": "NORMAL",
  "archivos": [
    {
      "nombre": "oficio.pdf",
      "contenido_base64": "JVBERi0xLjQK...",
      "tipo_mime": "application/pdf"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "numero_expediente": "EXP-2025-0050",
  "mensaje": "Documento recibido y registrado exitosamente"
}
```

### Recibir Webhook

**Endpoint:** `POST /integracion/webhook`

**Headers:**
```http
X-Webhook-Signature: hmac-sha256-signature
X-Webhook-Event: documento.actualizado
Content-Type: application/json
```

**Request Body:**
```json
{
  "evento": "documento.actualizado",
  "timestamp": "2025-01-15T10:30:00Z",
  "datos": {
    "id_externo": "EXT-2025-0001",
    "estado": "ATENDIDO",
    "observaciones": "Trámite finalizado"
  }
}
```

**Response:** `200 OK`

### Consultar Estado de Documento

**Endpoint:** `GET /integracion/estado/{id_externo}`

**Headers:**
```http
X-API-Key: your-api-key
X-Integration-ID: integration-uuid
```

**Response:** `200 OK`
```json
{
  "id_externo": "EXT-2025-0001",
  "numero_expediente_local": "EXP-2025-0050",
  "estado": "EN_PROCESO",
  "area_actual": "Área Legal",
  "fecha_ultima_actualizacion": "2025-01-15T14:00:00Z"
}
```

---

## Endpoints de Notificaciones

### Obtener Notificaciones

**Endpoint:** `GET /notificaciones`

**Query Parameters:**
- `leidas` (boolean): Filtrar por leídas/no leídas
- `tipo` (string): Tipo de notificación
- `page` (int)
- `page_size` (int)

**Response:** `200 OK`
```json
{
  "total": 25,
  "no_leidas": 5,
  "items": [
    {
      "id": "uuid",
      "tipo": "DOCUMENTO_DERIVADO",
      "titulo": "Nuevo documento recibido",
      "mensaje": "Se le ha derivado el documento EXP-2025-0001",
      "documento_id": "uuid",
      "leida": false,
      "fecha": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Marcar como Leída

**Endpoint:** `PUT /notificaciones/{id}/leer`

**Response:** `200 OK`

### Eliminar Notificación

**Endpoint:** `DELETE /notificaciones/{id}`

**Response:** `204 No Content`

---

## Endpoints de Reportes

### Obtener Estadísticas

**Endpoint:** `GET /reportes/estadisticas`

**Query Parameters:**
- `fecha_desde` (date)
- `fecha_hasta` (date)
- `area_id` (uuid)

**Response:** `200 OK`
```json
{
  "periodo": {
    "desde": "2025-01-01",
    "hasta": "2025-01-31"
  },
  "totales": {
    "recibidos": 150,
    "en_proceso": 45,
    "atendidos": 100,
    "vencidos": 5
  },
  "por_tipo": [
    {
      "tipo": "Solicitud",
      "cantidad": 80,
      "porcentaje": 53.3
    }
  ],
  "por_area": [
    {
      "area": "Área Legal",
      "cantidad": 50,
      "tiempo_promedio_dias": 3.5
    }
  ],
  "tendencias": [
    {
      "fecha": "2025-01-01",
      "cantidad": 5
    }
  ]
}
```

### Generar Reporte

**Endpoint:** `POST /reportes/generar`

**Request Body:**
```json
{
  "tipo_reporte": "GENERAL",
  "fecha_desde": "2025-01-01",
  "fecha_hasta": "2025-01-31",
  "filtros": {
    "area_id": "uuid",
    "tipo_documento_id": "uuid",
    "estado": "ATENDIDO"
  },
  "incluir_graficos": true
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "tipo_reporte": "GENERAL",
  "estado": "GENERANDO",
  "url_descarga": null
}
```

### Exportar a Excel

**Endpoint:** `GET /reportes/exportar/excel`

**Query Parameters:**
- `fecha_desde` (date)
- `fecha_hasta` (date)
- `filtros` (json)

**Response:** `200 OK`
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="reporte-2025-01.xlsx"

[Excel Binary Data]
```

### Exportar a PDF

**Endpoint:** `GET /reportes/exportar/pdf`

**Response:** `200 OK`
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="reporte-2025-01.pdf"

[PDF Binary Data]
```

---

## Webhooks

### Configuración de Webhooks

Los webhooks permiten recibir notificaciones en tiempo real cuando ocurren eventos en el sistema.

### Eventos Disponibles

- `documento.creado`: Cuando se registra un nuevo documento
- `documento.derivado`: Cuando se deriva un documento
- `documento.recibido`: Cuando se recibe un documento derivado
- `documento.atendido`: Cuando se completa la atención
- `documento.archivado`: Cuando se archiva un documento

### Formato de Webhook

**Headers:**
```http
Content-Type: application/json
X-Webhook-Signature: hmac-sha256-signature
X-Webhook-Event: documento.creado
X-Webhook-ID: uuid
X-Webhook-Timestamp: 2025-01-15T10:30:00Z
```

**Body:**
```json
{
  "evento": "documento.creado",
  "timestamp": "2025-01-15T10:30:00Z",
  "datos": {
    "id": "uuid",
    "numero_expediente": "EXP-2025-0001",
    "tipo_documento": "Solicitud",
    "remitente": "Juan Pérez García",
    "asunto": "Solicitud de información pública",
    "estado": "REGISTRADO",
    "prioridad": "ALTA"
  }
}
```

### Validación de Firma

La firma HMAC-SHA256 se calcula así:

```python
import hmac
import hashlib
import json

def validar_firma(payload, firma_recibida, secreto):
    firma_calculada = hmac.new(
        secreto.encode(),
        json.dumps(payload).encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(firma_calculada, firma_recibida)
```

### Reintentos

Si el webhook falla, el sistema reintentará:
- 1er reintento: Inmediato
- 2do reintento: Después de 1 minuto
- 3er reintento: Después de 5 minutos
- 4to reintento: Después de 15 minutos
- 5to reintento: Después de 1 hora

---

## Códigos de Error

### Códigos HTTP

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `204 No Content`: Solicitud exitosa sin contenido
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: Sin permisos
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto con estado actual
- `422 Unprocessable Entity`: Validación fallida
- `429 Too Many Requests`: Rate limit excedido
- `500 Internal Server Error`: Error del servidor

### Formato de Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos",
    "details": [
      {
        "field": "remitente",
        "message": "Este campo es obligatorio"
      }
    ]
  }
}
```

### Códigos de Error Personalizados

- `DOCUMENTO_NOT_FOUND`: Documento no encontrado
- `DERIVACION_NOT_ALLOWED`: No tiene permisos para derivar
- `INTEGRACION_ERROR`: Error en integración externa
- `VALIDATION_ERROR`: Error de validación
- `AUTHENTICATION_ERROR`: Error de autenticación
- `RATE_LIMIT_EXCEEDED`: Límite de peticiones excedido

---

## Rate Limiting

### Límites por Tipo de Cliente

**Usuarios Autenticados:**
- 1000 peticiones por hora
- 100 peticiones por minuto

**Integraciones (API Key):**
- 5000 peticiones por hora
- 500 peticiones por minuto

### Headers de Rate Limit

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1642248000
```

### Respuesta cuando se excede el límite

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 3600

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Ha excedido el límite de peticiones",
    "retry_after": 3600
  }
}
```

---

## Ejemplos de Uso

### Python

```python
import requests

# Autenticación
response = requests.post(
    "https://[servidor]/api/v1/auth/login",
    json={"username": "usuario", "password": "contraseña"}
)
token = response.json()["access_token"]

# Crear documento
headers = {"Authorization": f"Bearer {token}"}
documento = {
    "tipo_documento_id": "uuid",
    "remitente": "Juan Pérez",
    "asunto": "Solicitud de información"
}
response = requests.post(
    "https://[servidor]/api/v1/documentos",
    json=documento,
    headers=headers
)
print(response.json())
```

### JavaScript

```javascript
// Autenticación
const response = await fetch('https://[servidor]/api/v1/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'usuario',
    password: 'contraseña'
  })
});
const {access_token} = await response.json();

// Crear documento
const documento = {
  tipo_documento_id: 'uuid',
  remitente: 'Juan Pérez',
  asunto: 'Solicitud de información'
};
const docResponse = await fetch('https://[servidor]/api/v1/documentos', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(documento)
});
console.log(await docResponse.json());
```

---

**Versión**: 1.0  
**Última actualización**: Enero 2025  
**Base URL**: https://[servidor]/api/v1
