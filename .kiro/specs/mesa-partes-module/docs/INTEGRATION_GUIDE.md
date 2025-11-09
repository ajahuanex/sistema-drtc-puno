# Guía de Configuración de Integraciones

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Tipos de Integración](#tipos-de-integración)
4. [Configuración Paso a Paso](#configuración-paso-a-paso)
5. [Mapeo de Campos](#mapeo-de-campos)
6. [Configuración de Webhooks](#configuración-de-webhooks)
7. [Pruebas de Integración](#pruebas-de-integración)
8. [Solución de Problemas](#solución-de-problemas)
9. [Ejemplos de Integración](#ejemplos-de-integración)
10. [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

El Módulo de Mesa de Partes permite integrarse con otras mesas de partes (internas o externas) para intercambiar documentos automáticamente. Esta guía explica cómo configurar y gestionar estas integraciones.

### Casos de Uso

- Intercambio de documentos entre diferentes dependencias de una institución
- Envío automático de documentos a entidades externas
- Recepción de documentos desde sistemas externos
- Sincronización de estados de documentos
- Notificaciones bidireccionales mediante webhooks

---

## Requisitos Previos

### Información Necesaria

Antes de configurar una integración, necesita:

1. **URL Base del Sistema Externo**
   - Ejemplo: `https://municipalidad.gob.pe/api/v1`

2. **Credenciales de Autenticación**
   - API Key, Bearer Token, o credenciales Basic Auth
   - Proporcionadas por el administrador del sistema externo

3. **Documentación de la API Externa**
   - Endpoints disponibles
   - Formato de datos esperado
   - Campos requeridos y opcionales

4. **Mapeo de Campos**
   - Correspondencia entre campos locales y remotos
   - Transformaciones necesarias

### Permisos Requeridos

Para configurar integraciones necesita el rol de **Administrador** en el sistema.

---

## Tipos de Integración

### 1. API REST

Integración mediante API REST estándar.

**Características:**
- Comunicación HTTP/HTTPS
- Formato JSON o XML
- Síncrona o asíncrona
- Autenticación mediante API Key, Bearer Token o Basic Auth

**Cuándo usar:**
- Sistema externo expone API REST
- Necesita control sobre cuándo enviar documentos
- Requiere respuesta inmediata

### 2. Webhooks

Notificaciones automáticas cuando ocurren eventos.

**Características:**
- Push de información en tiempo real
- Basado en eventos
- Requiere endpoint público accesible
- Validación mediante firma HMAC

**Cuándo usar:**
- Necesita notificaciones en tiempo real
- Sistema externo soporta webhooks
- Quiere reducir polling constante

### 3. SOAP (Legacy)

Integración con sistemas legacy mediante SOAP.

**Características:**
- Protocolo SOAP/XML
- WSDL para definición de servicios
- Más complejo que REST

**Cuándo usar:**
- Sistema externo solo soporta SOAP
- Integración con sistemas legacy

---

## Configuración Paso a Paso

### Paso 1: Acceder a Configuración

1. Inicie sesión como administrador
2. Navegue a **Mesa de Partes**
3. Haga clic en la pestaña **Configuración**
4. Seleccione **Integraciones**

### Paso 2: Crear Nueva Integración

1. Haga clic en **Nueva Integración**
2. Complete el formulario:

**Información Básica:**
```
Nombre: Mesa de Partes - Municipalidad Provincial
Descripción: Integración con mesa de partes de la municipalidad
Tipo: API REST
Estado: Activa
```

**Configuración de Conexión:**
```
URL Base: https://municipalidad.gob.pe/api/v1
Timeout (segundos): 30
Reintentos: 3
```

**Autenticación:**
```
Tipo: API Key
Header: X-API-Key
Valor: [su-api-key-aquí]
```

3. Haga clic en **Guardar**

### Paso 3: Configurar Mapeo de Campos

El mapeo de campos define cómo se traducen los datos entre sistemas.

1. En la integración creada, haga clic en **Configurar Mapeo**
2. Agregue mapeos para cada campo:

**Ejemplo de Mapeo:**

| Campo Local | Campo Remoto | Transformación |
|-------------|--------------|----------------|
| numero_expediente | nro_expediente | Ninguna |
| remitente | remitente_nombre | Ninguna |
| asunto | descripcion | Ninguna |
| fecha_recepcion | fecha_registro | Formato: ISO 8601 |
| prioridad | nivel_urgencia | ALTA → 1, NORMAL → 2, BAJA → 3 |

3. Guarde el mapeo

### Paso 4: Configurar Webhooks (Opcional)

Si el sistema externo soporta webhooks:

1. Haga clic en **Configurar Webhooks**
2. Complete la configuración:

```
URL del Webhook: https://municipalidad.gob.pe/api/v1/webhooks/mesa-partes
Secreto: [generar-secreto-seguro]
Eventos a Notificar:
  ☑ documento.creado
  ☑ documento.derivado
  ☑ documento.atendido
  ☐ documento.archivado
```

3. Guarde la configuración

### Paso 5: Probar Conexión

1. Haga clic en **Probar Conexión**
2. El sistema verificará:
   - Conectividad con el servidor
   - Validez de credenciales
   - Tiempo de respuesta

3. Si la prueba es exitosa, verá:
```
✓ Conexión exitosa
✓ Autenticación válida
✓ Tiempo de respuesta: 150ms
```

---

## Mapeo de Campos

### Campos Estándar

#### Campos Obligatorios

Estos campos deben mapearse siempre:

```json
{
  "numero_expediente": "nro_expediente",
  "tipo_documento": "tipo_doc",
  "remitente": "remitente",
  "asunto": "asunto"
}
```

#### Campos Opcionales

```json
{
  "numero_documento_externo": "nro_doc_externo",
  "numero_folios": "cantidad_folios",
  "tiene_anexos": "con_anexos",
  "prioridad": "nivel_prioridad",
  "fecha_limite": "fecha_vencimiento",
  "observaciones": "notas"
}
```

### Transformaciones

#### Transformación de Fechas

**De ISO 8601 a formato local:**
```javascript
// Entrada: "2025-01-15T10:30:00Z"
// Salida: "15/01/2025 10:30"
```

**Configuración:**
```json
{
  "campo_local": "fecha_recepcion",
  "campo_remoto": "fecha_registro",
  "transformacion": "fecha_iso_to_local"
}
```

#### Transformación de Enumeraciones

**Mapeo de prioridades:**
```json
{
  "campo_local": "prioridad",
  "campo_remoto": "nivel_urgencia",
  "transformacion": {
    "URGENTE": 1,
    "ALTA": 2,
    "NORMAL": 3,
    "BAJA": 4
  }
}
```

#### Transformación de Booleanos

```json
{
  "campo_local": "tiene_anexos",
  "campo_remoto": "con_anexos",
  "transformacion": {
    "true": "SI",
    "false": "NO"
  }
}
```

### Campos Anidados

Para campos anidados en objetos:

```json
{
  "campo_local": "tipo_documento.nombre",
  "campo_remoto": "documento.tipo.descripcion"
}
```

### Campos Calculados

Puede crear campos calculados usando expresiones:

```json
{
  "campo_remoto": "nombre_completo",
  "expresion": "concat(remitente.nombres, ' ', remitente.apellidos)"
}
```

---

## Configuración de Webhooks

### Configuración en Sistema Local

#### 1. Generar Secreto

Use un generador de secretos seguros:

```bash
openssl rand -hex 32
```

Resultado: `a1b2c3d4e5f6...`

#### 2. Configurar URL del Webhook

La URL debe ser accesible públicamente:

```
https://[su-servidor]/api/v1/integracion/webhook
```

#### 3. Seleccionar Eventos

Marque los eventos que desea notificar:

- `documento.creado`: Cuando se registra un documento
- `documento.derivado`: Cuando se deriva un documento
- `documento.recibido`: Cuando se recibe un documento
- `documento.atendido`: Cuando se completa la atención
- `documento.archivado`: Cuando se archiva un documento

### Configuración en Sistema Remoto

Proporcione al administrador del sistema remoto:

1. **URL del Webhook**: `https://[su-servidor]/api/v1/integracion/webhook`
2. **Secreto**: El secreto generado
3. **Eventos**: Lista de eventos a notificar
4. **Formato**: JSON

### Validación de Webhooks

El sistema valida webhooks entrantes usando firma HMAC-SHA256:

```python
import hmac
import hashlib

def validar_webhook(payload, firma, secreto):
    firma_calculada = hmac.new(
        secreto.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(firma_calculada, firma)
```

### Manejo de Errores

Si el webhook falla, el sistema:

1. Registra el error en el log
2. Reintenta según configuración
3. Notifica al administrador después de 5 fallos

---

## Pruebas de Integración

### Prueba de Conectividad

1. En la lista de integraciones, haga clic en **Probar Conexión**
2. Verifique el resultado:

```
✓ Servidor accesible
✓ Autenticación exitosa
✓ Tiempo de respuesta: 150ms
✓ Versión API: v1.2.0
```

### Prueba de Envío de Documento

1. Cree un documento de prueba
2. En el detalle del documento, haga clic en **Enviar a Integración**
3. Seleccione la integración
4. Haga clic en **Enviar**
5. Verifique el resultado:

```
✓ Documento enviado exitosamente
ID Externo: EXT-2025-0001
Tiempo: 250ms
```

### Prueba de Webhook

1. Configure un webhook de prueba usando herramientas como:
   - [webhook.site](https://webhook.site)
   - [requestbin.com](https://requestbin.com)

2. Configure la URL temporal en su integración
3. Realice una acción que dispare el webhook
4. Verifique que se reciba la notificación

### Monitoreo de Logs

Revise el log de sincronización:

1. En la integración, haga clic en **Ver Log**
2. Filtre por fecha y estado
3. Revise los detalles de cada operación:

```
[2025-01-15 10:30:00] ENVIO - EXITOSO
Documento: EXP-2025-0001
ID Externo: EXT-2025-0001
Tiempo: 250ms

[2025-01-15 10:35:00] RECEPCION - EXITOSO
Documento Externo: EXT-2025-0050
ID Local: EXP-2025-0002
Tiempo: 180ms

[2025-01-15 10:40:00] ENVIO - ERROR
Documento: EXP-2025-0003
Error: Timeout después de 30s
```

---

## Solución de Problemas

### Error: "Conexión Rechazada"

**Causa:** El servidor no es accesible

**Solución:**
1. Verifique que la URL sea correcta
2. Verifique que el servidor esté en línea
3. Verifique firewall y reglas de red
4. Pruebe la URL en un navegador o con curl

```bash
curl -I https://municipalidad.gob.pe/api/v1
```

### Error: "Autenticación Fallida"

**Causa:** Credenciales inválidas

**Solución:**
1. Verifique que la API Key sea correcta
2. Verifique que no haya espacios extra
3. Verifique que la API Key no haya expirado
4. Contacte al administrador del sistema externo

### Error: "Campo Requerido Faltante"

**Causa:** Mapeo de campos incompleto

**Solución:**
1. Revise la documentación de la API externa
2. Identifique campos obligatorios
3. Agregue mapeos para todos los campos requeridos
4. Pruebe nuevamente

### Error: "Timeout"

**Causa:** El servidor tarda mucho en responder

**Solución:**
1. Aumente el timeout en la configuración
2. Verifique la carga del servidor externo
3. Considere envíos en lotes más pequeños
4. Contacte al administrador del sistema externo

### Error: "Webhook No Recibido"

**Causa:** Configuración incorrecta de webhook

**Solución:**
1. Verifique que la URL sea accesible públicamente
2. Verifique que el secreto sea correcto
3. Revise logs del servidor para errores
4. Pruebe con herramienta de prueba de webhooks

### Error: "Mapeo de Campo Inválido"

**Causa:** Transformación incorrecta

**Solución:**
1. Revise el formato esperado del campo
2. Ajuste la transformación
3. Pruebe con datos de ejemplo
4. Consulte documentación de la API

---

## Ejemplos de Integración

### Ejemplo 1: Integración con Municipalidad

**Escenario:** Enviar documentos a la municipalidad provincial

**Configuración:**

```json
{
  "nombre": "Mesa de Partes - Municipalidad Provincial",
  "tipo": "API_REST",
  "url_base": "https://municipalidad.gob.pe/api/v1",
  "autenticacion": {
    "tipo": "API_KEY",
    "header": "X-API-Key",
    "valor": "muni-api-key-12345"
  },
  "mapeos": [
    {
      "campo_local": "numero_expediente",
      "campo_remoto": "nro_expediente"
    },
    {
      "campo_local": "remitente",
      "campo_remoto": "remitente_nombre"
    },
    {
      "campo_local": "asunto",
      "campo_remoto": "descripcion"
    }
  ]
}
```

**Uso:**
1. Registre un documento normalmente
2. En el detalle, haga clic en "Enviar a Municipalidad"
3. El documento se enviará automáticamente

### Ejemplo 2: Integración con Sistema Interno

**Escenario:** Intercambio entre oficinas descentralizadas

**Configuración:**

```json
{
  "nombre": "Oficina Descentralizada - Juliaca",
  "tipo": "API_REST",
  "url_base": "https://juliaca.drtc-puno.gob.pe/api/v1",
  "autenticacion": {
    "tipo": "BEARER",
    "valor": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "webhook": {
    "url": "https://puno.drtc-puno.gob.pe/api/v1/integracion/webhook",
    "secreto": "shared-secret-key",
    "eventos": [
      "documento.creado",
      "documento.derivado",
      "documento.atendido"
    ]
  }
}
```

**Flujo:**
1. Oficina Puno registra documento
2. Deriva a Oficina Juliaca
3. Sistema envía automáticamente vía API
4. Juliaca recibe y notifica vía webhook
5. Puno recibe actualización de estado

### Ejemplo 3: Integración Bidireccional

**Escenario:** Intercambio bidireccional con otra entidad

**Configuración en Sistema A:**
```json
{
  "nombre": "Entidad B",
  "tipo": "API_REST",
  "url_base": "https://entidadb.gob.pe/api/v1",
  "autenticacion": {...},
  "webhook": {
    "url": "https://entidada.gob.pe/api/v1/integracion/webhook",
    "eventos": ["documento.creado", "documento.atendido"]
  }
}
```

**Configuración en Sistema B:**
```json
{
  "nombre": "Entidad A",
  "tipo": "API_REST",
  "url_base": "https://entidada.gob.pe/api/v1",
  "autenticacion": {...},
  "webhook": {
    "url": "https://entidadb.gob.pe/api/v1/integracion/webhook",
    "eventos": ["documento.creado", "documento.atendido"]
  }
}
```

**Flujo:**
1. Entidad A envía documento a Entidad B
2. Entidad B recibe y registra automáticamente
3. Entidad B atiende el documento
4. Webhook notifica a Entidad A
5. Estado se actualiza automáticamente en Entidad A

---

## Mejores Prácticas

### Seguridad

1. **Use HTTPS siempre**
   - Nunca use HTTP para integraciones
   - Valide certificados SSL

2. **Proteja las Credenciales**
   - No comparta API Keys públicamente
   - Rote credenciales periódicamente
   - Use secretos fuertes para webhooks

3. **Valide Webhooks**
   - Siempre valide la firma HMAC
   - Rechace webhooks sin firma válida
   - Registre intentos de acceso no autorizado

4. **Limite Acceso**
   - Use IP whitelisting cuando sea posible
   - Implemente rate limiting
   - Monitoree uso anómalo

### Rendimiento

1. **Configure Timeouts Apropiados**
   - No muy cortos (causan fallos)
   - No muy largos (bloquean recursos)
   - Típicamente 30-60 segundos

2. **Implemente Reintentos**
   - Use backoff exponencial
   - Limite número de reintentos
   - Registre fallos persistentes

3. **Use Procesamiento Asíncrono**
   - No bloquee la interfaz de usuario
   - Use colas para envíos masivos
   - Notifique al usuario cuando complete

4. **Monitoree Rendimiento**
   - Revise tiempos de respuesta
   - Identifique cuellos de botella
   - Optimice según métricas

### Mantenimiento

1. **Documente Integraciones**
   - Mantenga documentación actualizada
   - Documente cambios en APIs
   - Registre contactos técnicos

2. **Monitoree Logs**
   - Revise logs regularmente
   - Configure alertas para errores
   - Analice tendencias

3. **Pruebe Cambios**
   - Use ambiente de pruebas
   - Valide antes de producción
   - Tenga plan de rollback

4. **Mantenga Comunicación**
   - Coordine cambios con otras entidades
   - Notifique mantenimientos programados
   - Establezca canales de soporte

### Escalabilidad

1. **Diseñe para Crecimiento**
   - Considere volumen futuro
   - Use paginación en listados
   - Implemente caché cuando apropiado

2. **Optimice Transferencias**
   - Comprima datos grandes
   - Use transferencia incremental
   - Evite enviar datos innecesarios

3. **Balancee Carga**
   - Distribuya envíos en el tiempo
   - Evite picos de tráfico
   - Use rate limiting inteligente

---

## Checklist de Configuración

Use este checklist al configurar una nueva integración:

- [ ] Información básica completada
- [ ] URL base verificada y accesible
- [ ] Credenciales configuradas y validadas
- [ ] Mapeo de campos obligatorios completado
- [ ] Transformaciones configuradas correctamente
- [ ] Webhook configurado (si aplica)
- [ ] Secreto de webhook generado y compartido
- [ ] Prueba de conectividad exitosa
- [ ] Prueba de envío de documento exitosa
- [ ] Prueba de recepción de documento exitosa
- [ ] Prueba de webhook exitosa
- [ ] Logs revisados sin errores
- [ ] Documentación actualizada
- [ ] Equipo técnico notificado
- [ ] Monitoreo configurado

---

## Soporte

Para asistencia con integraciones:

**Soporte Técnico:**
- Email: integraciones@[institucion].gob.pe
- Teléfono: [número]
- Horario: Lunes a Viernes, 8:00 AM - 5:00 PM

**Documentación Adicional:**
- API Documentation: `/docs/API_DOCUMENTATION.md`
- User Guide: `/docs/USER_GUIDE.md`
- Deployment Guide: `/docs/DEPLOYMENT_GUIDE.md`

---

**Versión**: 1.0  
**Última actualización**: Enero 2025  
**Módulo**: Mesa de Partes - Integraciones
