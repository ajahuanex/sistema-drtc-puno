# WebSocket Notification System - Integration Guide

## Quick Start

### 1. Add Badge to Header

In your header/navbar component:

```typescript
import { NotificacionesBadgeComponent } from './components/mesa-partes/notificaciones-badge.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NotificacionesBadgeComponent],
  template: `
    <header>
      <div class="header-left">
        <!-- Your logo and menu -->
      </div>
      <div class="header-right">
        <app-notificaciones-badge></app-notificaciones-badge>
        <!-- Other header items -->
      </div>
    </header>
  `
})
export class HeaderComponent {}
```

### 2. Add Panel to Main Layout

In your main layout component:

```typescript
import { NotificacionesPanelComponent } from './components/mesa-partes/notificaciones-panel.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, NotificacionesPanelComponent],
  template: `
    <div class="layout">
      <app-header></app-header>
      <main>
        <router-outlet></router-outlet>
      </main>
      <app-notificaciones-panel [isOpen]="notificationPanelOpen" (closed)="notificationPanelOpen = false">
      </app-notificaciones-panel>
    </div>
  `
})
export class LayoutComponent implements OnInit {
  notificationPanelOpen = false;
  
  ngOnInit() {
    // Listen for toggle event from badge
    window.addEventListener('toggle-notifications', () => {
      this.notificationPanelOpen = !this.notificationPanelOpen;
    });
  }
}
```

### 3. Initialize WebSocket Connection

In your app initialization (app.component.ts or auth service):

```typescript
import { WebSocketService } from './services/mesa-partes/websocket.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit, OnDestroy {
  
  constructor(
    private wsService: WebSocketService,
    private authService: AuthService
  ) {}
  
  ngOnInit() {
    // Connect when user is authenticated
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        const token = this.authService.getToken();
        const areaId = user.areaId;
        
        this.wsService.connect(token, areaId);
      } else {
        this.wsService.disconnect();
      }
    });
  }
  
  ngOnDestroy() {
    this.wsService.disconnect();
  }
}
```

### 4. Backend Setup

#### Enable WebSocket Router

In `backend/app/main.py`:

```python
from app.routers.mesa_partes.websocket_router import router as websocket_router

# Add to router includes
app.include_router(websocket_router, prefix=settings.API_V1_STR, tags=["WebSocket"])
```

#### Start Notification Scheduler

In `backend/app/main.py`:

```python
from app.services.mesa_partes.notification_scheduler import start_notification_scheduler, stop_notification_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting notification scheduler...")
    asyncio.create_task(start_notification_scheduler())
    
    yield
    
    # Shutdown
    logger.info("Stopping notification scheduler...")
    await stop_notification_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)
```

## Advanced Usage

### Subscribe to Notifications in Any Component

```typescript
import { WebSocketService } from '../../services/mesa-partes/websocket.service';

export class MyComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  
  constructor(private wsService: WebSocketService) {}
  
  ngOnInit() {
    // Listen for specific notification types
    this.subscription = this.wsService.getNotifications().subscribe(notification => {
      if (notification.notification_type === 'documento_urgente') {
        this.handleUrgentDocument(notification);
      }
    });
  }
  
  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
  
  handleUrgentDocument(notification: any) {
    // Custom handling for urgent documents
    console.log('Urgent document received:', notification);
  }
}
```

### Monitor Connection Status

```typescript
export class MyComponent implements OnInit {
  connectionStatus$ = this.wsService.getConnectionStatus();
  
  constructor(private wsService: WebSocketService) {}
  
  ngOnInit() {
    this.connectionStatus$.subscribe(status => {
      if (status.reconnecting) {
        console.log(`Reconnecting... Attempt ${status.reconnectAttempts}`);
      } else if (status.connected) {
        console.log('Connected to WebSocket');
      }
    });
  }
}
```

### Send Custom Messages

```typescript
// Subscribe to additional area
this.wsService.subscribeToArea('area-456');

// Request statistics
this.wsService.send({
  type: 'get_stats'
});

// Listen for response
this.wsService.getMessages().subscribe(message => {
  if (message.type === 'stats') {
    console.log('Connection stats:', message.data);
  }
});
```

## Backend: Sending Notifications

### From Any Service

```python
from app.services.mesa_partes.websocket_service import websocket_service

# Send to specific user
await websocket_service.manager.send_to_user(
    message={
        "type": "notification",
        "title": "Custom Notification",
        "message": "This is a custom message"
    },
    usuario_id="user-123"
)

# Send to area
await websocket_service.manager.send_to_area(
    message={
        "type": "notification",
        "title": "Area Notification",
        "message": "Message for all users in area"
    },
    area_id="area-456"
)

# Broadcast to all
await websocket_service.manager.broadcast(
    message={
        "type": "system",
        "message": "System maintenance in 10 minutes"
    }
)
```

### Using High-Level Methods

```python
from app.services.mesa_partes.websocket_service import websocket_service

# Notify urgent document
await websocket_service.notify_documento_urgente(
    documento_id="doc-123",
    numero_expediente="EXP-2025-0001",
    area_id="area-456",
    remitente="Juan Pérez"
)

# Notify document about to expire
await websocket_service.notify_documento_proximo_vencer(
    documento_id="doc-123",
    numero_expediente="EXP-2025-0001",
    area_id="area-456",
    dias_restantes=2
)
```

## Configuration

### Environment Variables

**Backend** (`.env`):
```env
BASE_URL=http://localhost:8000
STORAGE_PATH=storage/documentos
```

**Frontend** (`environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  // WebSocket will use: ws://localhost:8000
};
```

### Notification Preferences

Users can configure their preferences via the preferences component:

```typescript
import { NotificacionesPreferenciasComponent } from './components/mesa-partes/notificaciones-preferencias.component';

// Add to a settings page or modal
@Component({
  template: `
    <app-notificaciones-preferencias></app-notificaciones-preferencias>
  `
})
```

Preferences are stored in localStorage and include:
- Enable/disable sound
- Enable/disable browser notifications
- Enable/disable email notifications
- Select notification types
- Configure expiration warning days

## Troubleshooting

### WebSocket Not Connecting

1. **Check server is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Verify token is valid:**
   ```typescript
   console.log('Token:', this.authService.getToken());
   ```

3. **Check browser console for errors:**
   - Look for WebSocket connection errors
   - Verify URL is correct (ws:// not http://)

4. **Check CORS configuration:**
   ```python
   # In main.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:4200"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"]
   )
   ```

### Notifications Not Appearing

1. **Verify WebSocket is connected:**
   ```typescript
   console.log('Connected:', this.wsService.isConnected());
   ```

2. **Check notification preferences:**
   - Open preferences component
   - Ensure notification types are enabled

3. **Check browser notification permission:**
   ```typescript
   console.log('Permission:', Notification.permission);
   ```

4. **Verify area ID is correct:**
   ```typescript
   console.log('User area:', this.authService.getUserArea());
   ```

### Reconnection Issues

1. **Check reconnection status:**
   ```typescript
   this.wsService.getConnectionStatus().subscribe(status => {
     console.log('Status:', status);
   });
   ```

2. **Increase max reconnection attempts:**
   ```typescript
   // In websocket.service.ts
   private readonly MAX_RECONNECT_ATTEMPTS = 20; // Increase from 10
   ```

3. **Check network stability:**
   - Use browser DevTools Network tab
   - Look for WebSocket connection drops

## Testing

### Manual Testing

1. **Test Connection:**
   - Login to application
   - Check badge appears in header
   - Verify connection indicator is green

2. **Test Notifications:**
   - Create an urgent document
   - Verify notification appears in badge
   - Click badge to open panel
   - Verify notification is listed

3. **Test Reconnection:**
   - Stop backend server
   - Verify reconnecting indicator appears
   - Start backend server
   - Verify connection restores automatically

4. **Test Preferences:**
   - Open preferences
   - Disable sound
   - Create urgent document
   - Verify no sound plays

### Automated Testing

Run unit tests:
```bash
cd frontend
npm test -- --include='**/*websocket*.spec.ts'
npm test -- --include='**/notificaciones*.spec.ts'
```

## Performance Tips

1. **Limit notification history:**
   ```typescript
   // Keep only last 100 notifications
   if (this.notificaciones.length > 100) {
     this.notificaciones = this.notificaciones.slice(0, 100);
   }
   ```

2. **Debounce rapid notifications:**
   ```typescript
   this.wsService.getNotifications()
     .pipe(debounceTime(500))
     .subscribe(notification => {
       // Handle notification
     });
   ```

3. **Unsubscribe when not needed:**
   ```typescript
   ngOnDestroy() {
     this.subscriptions.forEach(sub => sub.unsubscribe());
   }
   ```

## Security Checklist

- ✅ JWT token required for WebSocket connection
- ✅ Users only receive notifications for their area
- ✅ Message validation on server
- ✅ No sensitive data in WebSocket messages
- ✅ CORS properly configured
- ✅ Rate limiting on WebSocket endpoint (TODO)
- ✅ Connection timeout configured (TODO)

## Support

For issues or questions:
1. Check the main documentation: `WEBSOCKET_NOTIFICATIONS.md`
2. Review the completion summary: `TASK_19_COMPLETION_SUMMARY.md`
3. Check backend logs for errors
4. Use browser DevTools to inspect WebSocket traffic
