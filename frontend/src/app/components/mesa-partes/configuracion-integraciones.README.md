# ConfiguracionIntegracionesComponent

## Overview

El `ConfiguracionIntegracionesComponent` es un componente completo para la gestión de integraciones con sistemas externos. Permite crear, editar, configurar y monitorear integraciones, así como gestionar webhooks y revisar logs de sincronización.

## Features Implementadas

### ✅ Lista de Integraciones (Requirement 11.1)
- **Tabla de integraciones configuradas**: Muestra todas las integraciones con información detallada
- **Estado de conexión**: Indicador visual del estado de cada integración
- **Última sincronización**: Información de la última operación realizada
- **Botón de prueba de conexión**: Permite verificar la conectividad en tiempo real
- **Acciones por integración**: Editar, ver logs, configurar webhook, eliminar

### ✅ Formulario de Integración (Requirement 11.2)
- **Modal de creación/edición**: Formulario completo con validaciones
- **Campos básicos**: Nombre, descripción, tipo de integración
- **Configuración de conexión**: URL base, timeout, reintentos
- **Tipos soportados**: API REST, SOAP, FTP, Email
- **Validaciones en tiempo real**: Campos requeridos y formatos válidos

### ✅ Mapeo de Campos (Requirement 11.3)
- **Interfaz de mapeo**: Permite mapear campos locales a campos remotos
- **Mapeos dinámicos**: Agregar/eliminar mapeos según necesidad
- **Transformaciones**: Opción de aplicar transformaciones a los datos
- **Validación de mapeos**: Verificación de campos requeridos

### ✅ Configuración de Webhooks (Requirement 11.4)
- **Modal de configuración**: Interfaz completa para configurar webhooks
- **URL y método HTTP**: Configuración de endpoint y método
- **Seguridad**: Generación de secretos para firma HMAC
- **Eventos configurables**: Selección de eventos a notificar
- **Headers personalizados**: Configuración de headers adicionales
- **Configuración avanzada**: Reintentos, timeouts, verificación SSL

### ✅ Log de Sincronizaciones (Requirement 11.5)
- **Historial completo**: Registro de todas las operaciones de sincronización
- **Filtros avanzados**: Por integración, estado, fecha
- **Información detallada**: Fecha, operación, estado, tiempo de respuesta
- **Detalles de errores**: Información específica sobre fallos

## Estructura del Componente

```typescript
ConfiguracionIntegracionesComponent
├── integraciones: Integracion[]           // Lista de integraciones
├── logs: LogSincronizacion[]             // Logs de sincronización
├── selectedTabIndex: number              // Tab activo
├── probandoConexion: object             // Estados de prueba
├── filtroIntegracion: string            // Filtro de logs por integración
├── filtroEstadoLog: string              // Filtro de logs por estado
└── displayedColumns: string[]           // Columnas de tabla
```

## Componentes Relacionados

### IntegracionFormModalComponent
Modal para crear y editar integraciones con:
- **Configuración general**: Información básica y conexión
- **Autenticación**: Soporte para múltiples tipos de auth
- **Mapeo de campos**: Interfaz para mapear datos
- **Validaciones**: Formulario reactivo con validaciones

### WebhookConfigModalComponent  
Modal para configurar webhooks con:
- **Configuración básica**: URL, método, timeout
- **Seguridad**: Secretos y firma HMAC
- **Eventos**: Selección de eventos a notificar
- **Headers**: Configuración de headers personalizados
- **Configuración avanzada**: Reintentos y SSL

## Métodos Principales

### Gestión de Integraciones
- `cargarIntegraciones()`: Carga lista de integraciones
- `abrirFormularioIntegracion()`: Abre modal para nueva integración
- `editarIntegracion(integracion)`: Abre modal para editar
- `probarConexion(integracion)`: Prueba conectividad
- `eliminarIntegracion(integracion)`: Elimina integración

### Gestión de Logs
- `cargarLogs()`: Carga logs con filtros aplicados
- `verLogs(integracion)`: Navega a logs de integración específica
- `verDetallesLog(log)`: Muestra detalles de log específico

### Configuración de Webhooks
- `configurarWebhook(integracion)`: Abre modal de configuración

### Métodos de Utilidad
- `getTipoIcon/Label()`: Obtiene icono/etiqueta de tipo
- `getEstadoConexionIcon/Label/Class()`: Maneja estados de conexión
- `getOperacionIcon()`: Obtiene icono de operación
- `getLogEstadoIcon/Label()`: Maneja estados de logs

## Tipos de Integración Soportados

### API REST
- **Autenticación**: API Key, Bearer Token, Basic Auth, OAuth 2.0
- **Métodos**: GET, POST, PUT, DELETE, PATCH
- **Formatos**: JSON, XML
- **Headers personalizados**: Soporte completo

### SOAP
- **WSDL**: Importación automática de definiciones
- **Autenticación**: WS-Security, Basic Auth
- **Envelope**: Construcción automática de mensajes

### FTP/SFTP
- **Protocolos**: FTP, FTPS, SFTP
- **Autenticación**: Usuario/contraseña, claves SSH
- **Operaciones**: Upload, download, listado

### Email
- **Protocolos**: SMTP, IMAP, POP3
- **Autenticación**: Basic, OAuth 2.0
- **Formatos**: Texto plano, HTML, adjuntos

## Tipos de Autenticación

### Sin Autenticación
- Para APIs públicas o internas sin seguridad

### API Key
- **Header personalizable**: X-API-Key, Authorization, etc.
- **Ubicación**: Header, query parameter, body

### Bearer Token
- **JWT**: Soporte para tokens JWT
- **Refresh**: Manejo automático de renovación

### Basic Auth
- **Usuario/contraseña**: Codificación Base64 automática
- **Headers**: Authorization header estándar

### OAuth 2.0
- **Flujos**: Client Credentials, Authorization Code
- **Tokens**: Access token y refresh token
- **Scopes**: Configuración de permisos

## Configuración de Webhooks

### Eventos Disponibles
```typescript
const eventos = [
  'documento_creado',      // Nuevo documento registrado
  'documento_derivado',    // Documento derivado a área
  'documento_recibido',    // Documento recibido en área
  'documento_atendido',    // Documento marcado como atendido
  'documento_archivado',   // Documento archivado
  'documento_vencido'      // Documento superó fecha límite
];
```

### Seguridad de Webhooks
- **Firma HMAC-SHA256**: Validación de integridad
- **Headers de seguridad**: X-Signature, X-Timestamp
- **Secretos únicos**: Generación automática o manual
- **Verificación SSL**: Opcional para desarrollo

### Configuración Avanzada
- **Reintentos**: 0-5 intentos con backoff exponencial
- **Timeout**: 1-60 segundos por request
- **Headers personalizados**: Ilimitados
- **Verificación SSL**: Habilitada por defecto

## Mapeo de Campos

### Campos Locales Disponibles
```typescript
const camposLocales = [
  'numeroExpediente',    // Número de expediente
  'tipoDocumento',       // Tipo de documento
  'remitente',          // Remitente
  'asunto',             // Asunto
  'fechaRecepcion',     // Fecha de recepción
  'estado',             // Estado actual
  'prioridad',          // Prioridad
  'numeroFolios',       // Número de folios
  'usuarioRegistro'     // Usuario que registró
];
```

### Transformaciones
- **Funciones JavaScript**: Código personalizado para transformar datos
- **Validación**: Verificación de sintaxis antes de guardar
- **Ejemplos**: Formateo de fechas, conversión de tipos, cálculos

## Logs de Sincronización

### Información Registrada
```typescript
interface LogSincronizacion {
  id: string;
  integracionId: string;
  integracionNombre: string;
  operacion: string;           // enviar, recibir, sincronizar, probar
  estado: string;              // exitoso, error, pendiente
  fecha: Date;
  detalles: string;
  documentoId?: string;
  tiempoRespuesta?: number;    // En milisegundos
  codigoRespuesta?: number;    // HTTP status code
  mensajeError?: string;
  datosEnviados?: any;
  datosRecibidos?: any;
}
```

### Filtros Disponibles
- **Por integración**: Logs de integración específica
- **Por estado**: Exitoso, error, pendiente
- **Por fecha**: Rango de fechas personalizable
- **Por operación**: Tipo de operación realizada

## Estilos y UX

### Responsive Design
- **Desktop**: Layout completo con todas las columnas
- **Tablet**: Ajuste de espaciado y navegación por tabs
- **Mobile**: Columnas optimizadas y formularios apilados

### Indicadores Visuales
- **Estados de conexión**: Verde (exitosa), rojo (error), amarillo (pendiente)
- **Estados de integración**: Activa/inactiva con colores diferenciados
- **Estados de logs**: Iconos y colores para cada tipo de resultado
- **Loading states**: Spinners durante operaciones asíncronas

### Accesibilidad
- **Labels descriptivos**: Todos los campos tienen labels claros
- **Tooltips informativos**: Ayuda contextual en botones
- **Navegación por teclado**: Soporte completo
- **Contraste**: Colores que cumplen estándares WCAG

## Integración con Servicios

### IntegracionService
```typescript
// Gestión de integraciones
listarIntegraciones(): Observable<Integracion[]>
crearIntegracion(datos: IntegracionCreate): Observable<Integracion>
actualizarIntegracion(id: string, datos: IntegracionUpdate): Observable<Integracion>
eliminarIntegracion(id: string): Observable<void>

// Pruebas de conexión
probarConexion(id: string): Observable<ResultadoPrueba>
probarConexionTemporal(datos: IntegracionCreate): Observable<ResultadoPrueba>

// Webhooks
configurarWebhook(id: string, config: ConfiguracionWebhook): Observable<ConfiguracionWebhook>
probarWebhook(id: string, config: ConfiguracionWebhook): Observable<ResultadoPrueba>

// Logs
obtenerLogSincronizacion(filtros?: FiltrosLog): Observable<LogSincronizacion[]>
```

## Testing

### Cobertura de Tests
- ✅ Inicialización del componente
- ✅ Carga de integraciones y logs
- ✅ Gestión de integraciones (crear, editar, eliminar)
- ✅ Pruebas de conexión
- ✅ Filtrado de logs
- ✅ Integración con modales
- ✅ Métodos de utilidad
- ✅ Manejo de errores
- ✅ Estados de UI

### Casos de Test Principales
```typescript
describe('ConfiguracionIntegracionesComponent', () => {
  it('should load integraciones on init')
  it('should test connection successfully')
  it('should handle connection test error')
  it('should delete integracion with confirmation')
  it('should load logs with filters')
  it('should open integracion form modal')
  it('should open webhook config modal')
  it('should get correct helper method results')
})
```

## Optimizaciones Implementadas

### Performance
- **Lazy loading**: Carga de datos bajo demanda
- **Debounce**: En filtros de búsqueda
- **Virtual scrolling**: Preparado para listas grandes
- **Caché**: Datos de tipos y configuraciones

### UX
- **Loading states**: Indicadores claros de progreso
- **Error handling**: Mensajes informativos
- **Confirmaciones**: Para acciones destructivas
- **Feedback visual**: Estados de éxito/error

## Próximas Mejoras

### Funcionalidades Pendientes
- [ ] Importación masiva de integraciones
- [ ] Plantillas de integración predefinidas
- [ ] Monitoreo en tiempo real de conexiones
- [ ] Alertas automáticas por fallos
- [ ] Backup y restauración de configuraciones

### Optimizaciones Futuras
- [ ] Caché inteligente de configuraciones
- [ ] Compresión de logs antiguos
- [ ] Dashboard de métricas de integraciones
- [ ] Integración con sistemas de monitoreo externos

## Uso del Componente

```html
<!-- En mesa-partes.component.html -->
<mat-tab label="Configuración">
  <div class="tab-content">
    <app-configuracion-integraciones></app-configuracion-integraciones>
  </div>
</mat-tab>
```

```typescript
// En mesa-partes.component.ts
import { ConfiguracionIntegracionesComponent } from './configuracion-integraciones.component';

@Component({
  imports: [
    // ... otros imports
    ConfiguracionIntegracionesComponent
  ]
})
```

## Conclusión

El `ConfiguracionIntegracionesComponent` proporciona una solución completa para la gestión de integraciones con sistemas externos, cumpliendo todos los requirements especificados y ofreciendo una interfaz intuitiva para configurar, monitorear y mantener las integraciones del sistema de Mesa de Partes.