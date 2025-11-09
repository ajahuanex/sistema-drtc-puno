# Sistema de Notificaciones en Tiempo Real - WebSocket

## Descripción General

El sistema de notificaciones en tiempo real utiliza WebSocket para proporcionar actualizaciones instantáneas a los usuarios sobre eventos importantes en el módulo de Mesa de Partes.

## Arquitectura

### Backend

#### WebSocket Service (`backend/app/services/mesa_partes/websocket_service.py`)

- **ConnectionManager**: Gestiona todas las conexiones WebSocket activas
  - Mantiene mapeo de usuarios a conexiones
  - Mantiene mapeo de áreas a conexiones
  - Maneja desconexiones automáticamente

- **WebSocketService**: Proporciona métodos de alto nivel para enviar notificaciones
  - `notify_documento_derivado()`: Notifica cuando se deriva un documento
  - `notify_documento_recibido()`: Notifica cuando se recibe un documento
  - `notify_documento_proximo_vencer()`: Notifica documentos próximos a vencer
  - `notify_documento_urgente()`: Notifica documentos urgentes
  - `notify_documento_atendido()`: Notifica cuando se atiende un documento

#### WebSocket Router (`backend/app/routers/mesa_partes/websocket_router.py`)

- Endpoint: `/api/v1/ws/notificaciones`
- Parámetros:
  - `token`: JWT token para autenticación
  - `area_id`: ID del área (opcional)

#### Notification Scheduler (`backend/app/services/mesa_partes/notification_scheduler.py`)

- Tarea en segundo plano que verifica documentos próximos a vencer
- Se ejecuta cada hora
- Envía notificaciones con 1, 2 y 3 días de anticipación

### Frontend

#### WebSocket Service (`frontend/src/app/services/mesa-partes/websocket.service.ts`)

Características principales:
- **Reconexión automática**: Intenta reconectar hasta 10 veces con backoff exponencial
- **Ping/Pong**: Mantiene la conexión activa con pings cada 30 segundos
- **Observables**: Expone streams reactivos para mensajes y notificaciones
- **Estado de conexión**: Proporciona información sobre el estado de la conexión

Métodos principales:
```typescript
connect(token: string, areaId?: string): void
disconnect(): void
send(message: any): void
subscribeToArea(areaId: string): void
getConnectionStatus(): Observable<ConnectionStatus>
getMessages(): Observable<WebSocketMessage>
getNotifications(): Observable<WebSocketMessage>
isConnected(): boolean
```

#### Componentes

##### NotificacionesBadgeComponent

Badge de notificaciones que se muestra en el header:
- Muestra contador de notificaciones no leídas
- Indicador de estado de conexión (conectado/reconectando)
- Reproduce sonido para notificaciones urgentes
- Muestra notificaciones del navegador

##### NotificacionesPanelComponent

Panel lateral con lista de notificaciones:
- Lista de notificaciones con filtros (todas/no leídas)
- Acciones: marcar como leída, eliminar
- Navegación al documento relacionado
- Actualización en tiempo real vía WebSocket

##### NotificacionesPreferenciasComponent

Configuración de preferencias de notificaciones:
- Habilitar/deshabilitar sonido
- Habilitar/deshabilitar notificaciones del navegador
- Habilitar/deshabilitar notificaciones por email
- Seleccionar tipos de notificaciones a recibir
- Configurar días de anticipación para vencimientos

## Tipos de Notificaciones

### 1. Documento Derivado
- **Evento**: Cuando se deriva un documento a un área
- **Destinatario**: Todos los usuarios del área destino
- **Prioridad**: Normal o Urgente (según el documento)
- **Datos**: documento_id, numero_expediente, usuario_deriva, es_urgente

### 2. Documento Recibido
- **Evento**: Cuando un usuario recibe un documento derivado
- **Destinatario**: Usuario específico que recibe
- **Prioridad**: Normal
- **Datos**: documento_id, numero_expediente, area_id

### 3. Documento Próximo a Vencer
- **Evento**: Documento con fecha límite próxima (1, 2 o 3 días)
- **Destinatario**: Todos los usuarios del área actual del documento
- **Prioridad**: Alta
- **Datos**: documento_id, numero_expediente, dias_restantes

### 4. Documento Urgente
- **Evento**: Cuando se registra un documento con prioridad urgente
- **Destinatario**: Todos los usuarios del área asignada
- **Prioridad**: Urgente
- **Datos**: documento_id, numero_expediente, remitente

### 5. Documento Atendido
- **Evento**: Cuando se marca un documento como atendido
- **Destinatario**: Usuario que derivó el documento
- **Prioridad**: Normal
- **Datos**: documento_id, numero_expediente, observaciones

## Integración con Servicios Existentes

### DerivacionService

Las notificaciones se envían automáticamente en:
- `derivar_documento()`: Notifica al área destino
- `recibir_documento()`: Notifica al usuario que recibe
- `registrar_atencion()`: Notifica al usuario que derivó

### DocumentoService

Las notificaciones se envían automáticamente en:
- `crear_documento()`: Si el documento es urgente, notifica al área asignada

## Uso en Componentes

### Conectar al WebSocket

```typescript
import { WebSocketService } from '../../services/mesa-partes/websocket.service';

constructor(private wsService: WebSocketService) {}

ngOnInit() {
  const token = this.authService.getToken();
  const areaId = this.authService.getUserArea();
  
  this.wsService.connect(token, areaId);
  
  // Suscribirse a notificaciones
  this.wsService.getNotifications().subscribe(notification => {
    console.log('Nueva notificación:', notification);
  });
  
  // Monitorear estado de conexión
  this.wsService.getConnectionStatus().subscribe(status => {
    console.log('Estado de conexión:', status);
  });
}

ngOnDestroy() {
  this.wsService.disconnect();
}
```

### Enviar Mensaje al Servidor

```typescript
// Suscribirse a un área adicional
this.wsService.subscribeToArea('area-123');

// Obtener estadísticas
this.wsService.send({
  type: 'get_stats'
});
```

## Configuración

### Backend

Variables de entorno:
- `BASE_URL`: URL base del servidor (para WebSocket)

### Frontend

En `environment.ts`:
```typescript
export const environment = {
  apiUrl: 'http://localhost:8000',
  // WebSocket usará ws://localhost:8000
};
```

## Seguridad

1. **Autenticación**: Todas las conexiones requieren un token JWT válido
2. **Autorización**: Los usuarios solo reciben notificaciones de su área
3. **Validación**: Todos los mensajes son validados antes de procesarse

## Manejo de Errores

### Reconexión Automática

El servicio intenta reconectar automáticamente:
- Máximo 10 intentos
- Intervalo inicial: 3 segundos
- Backoff exponencial: 1.5x por intento

### Notificaciones Fallidas

Si falla el envío de una notificación:
- Se registra el error en logs
- No se interrumpe la operación principal
- El usuario puede ver notificaciones históricas en el panel

## Testing

### Backend

```python
# Test de conexión WebSocket
async def test_websocket_connection():
    async with websockets.connect('ws://localhost:8000/api/v1/ws/notificaciones?token=test') as ws:
        message = await ws.recv()
        assert message['type'] == 'connection'
```

### Frontend

```typescript
// Test de servicio WebSocket
it('should connect to WebSocket', () => {
  const service = TestBed.inject(WebSocketService);
  service.connect('test-token');
  expect(service.isConnected()).toBeTruthy();
});
```

## Mejoras Futuras

1. **Persistencia**: Guardar notificaciones en base de datos
2. **Filtros avanzados**: Más opciones de filtrado en el panel
3. **Agrupación**: Agrupar notificaciones similares
4. **Acciones rápidas**: Responder a notificaciones sin navegar
5. **Notificaciones push**: Integración con servicios push móviles
6. **Estadísticas**: Dashboard de notificaciones enviadas/recibidas

## Troubleshooting

### WebSocket no conecta

1. Verificar que el servidor esté corriendo
2. Verificar que el token sea válido
3. Revisar CORS en el servidor
4. Verificar firewall/proxy

### Notificaciones no llegan

1. Verificar que el usuario esté conectado
2. Verificar que el área sea correcta
3. Revisar logs del servidor
4. Verificar preferencias de notificación

### Reconexión constante

1. Verificar estabilidad de red
2. Revisar logs de errores
3. Verificar timeout del servidor
4. Considerar aumentar intervalo de ping
