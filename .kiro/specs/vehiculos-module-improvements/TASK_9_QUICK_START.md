# Task 9: Sistema de Notificaciones - Quick Start Guide

## Overview
This guide provides quick instructions for using the vehicle notification system implemented in Task 9.

## Services Created

### 1. VehiculoNotificationService
Main service for sending vehicle-related notifications.

**Location:** `frontend/src/app/services/vehiculo-notification.service.ts`

### 2. VehiculoEstadoService
Service for managing vehicle state changes with automatic notifications.

**Location:** `frontend/src/app/services/vehiculo-estado.service.ts`

### 3. VehiculoVencimientoService
Service for monitoring and notifying about document expirations.

**Location:** `frontend/src/app/services/vehiculo-vencimiento.service.ts`

---

## Quick Usage Examples

### 1. Send Transfer Notification

```typescript
import { inject } from '@angular/core';
import { VehiculoNotificationService } from './services/vehiculo-notification.service';

// In your component
const notificationService = inject(VehiculoNotificationService);

// Send transfer notification
notificationService.notificarTransferencia(
  vehiculo,              // Vehiculo object
  empresaOrigen,         // Empresa object (origin)
  empresaDestino,        // Empresa object (destination)
  usuarioId,             // Current user ID
  ['supervisor_1', 'admin_1']  // Recipients
);
```

### 2. Send Low Request Notification

```typescript
import { inject } from '@angular/core';
import { VehiculoNotificationService } from './services/vehiculo-notification.service';

const notificationService = inject(VehiculoNotificationService);

// Send low request notification
notificationService.notificarSolicitudBaja(
  vehiculo,              // Vehiculo object
  'Vehículo obsoleto',   // Reason
  empresa,               // Empresa object
  usuarioId,             // Requesting user ID
  ['supervisor_1', 'supervisor_2']  // Supervisors to notify
);
```

### 3. Change Vehicle State with Notifications

```typescript
import { inject } from '@angular/core';
import { VehiculoEstadoService } from './services/vehiculo-estado.service';

const estadoService = inject(VehiculoEstadoService);

// Suspend vehicle
estadoService.suspenderVehiculo(vehiculoId, ['supervisor_1']).subscribe({
  next: (vehiculo) => {
    console.log('Vehicle suspended and notifications sent');
  },
  error: (error) => {
    console.error('Error suspending vehicle:', error);
  }
});

// Activate vehicle
estadoService.activarVehiculo(vehiculoId, ['admin_1']).subscribe({
  next: (vehiculo) => {
    console.log('Vehicle activated');
  }
});

// Generic state change
estadoService.cambiarEstado(vehiculoId, 'EN_REVISION', ['supervisor_1']).subscribe({
  next: (vehiculo) => {
    console.log('State changed to EN_REVISION');
  }
});
```

### 4. Start Document Expiration Monitoring

```typescript
import { inject } from '@angular/core';
import { VehiculoVencimientoService } from './services/vehiculo-vencimiento.service';

// In app initialization (app.component.ts or main.ts)
const vencimientoService = inject(VehiculoVencimientoService);

// Start automatic monitoring (runs every 24 hours)
vencimientoService.iniciarJobVencimientos();
```

### 5. Configure Expiration Notifications

```typescript
const vencimientoService = inject(VehiculoVencimientoService);

// Update configuration
vencimientoService.actualizarConfiguracion({
  diasAnticipacion: [60, 30, 15, 7, 3, 1],  // Days before expiration
  horaVerificacion: '08:00',                 // Time to check
  habilitado: true                           // Enable/disable
});

// Get current configuration
const config = vencimientoService.obtenerConfiguracion();
console.log('Current config:', config);
```

### 6. Check Specific Vehicle Expirations

```typescript
const vencimientoService = inject(VehiculoVencimientoService);

// Check specific vehicle
vencimientoService.verificarVencimientosVehiculo(vehiculoId);

// Get expiration statistics
vencimientoService.obtenerEstadisticasVencimientos();
```

### 7. Batch State Changes

```typescript
const estadoService = inject(VehiculoEstadoService);

const vehiculosIds = ['vehiculo1', 'vehiculo2', 'vehiculo3'];

estadoService.cambiarEstadoLote(
  vehiculosIds,
  'SUSPENDIDO',
  ['supervisor_1', 'admin_1']
).subscribe({
  next: (vehiculos) => {
    console.log(`${vehiculos.length} vehicles updated`);
  }
});
```

---

## Integration in Components

### Transfer Modal Integration

The transfer modal already has notifications integrated:

```typescript
// In transferir-vehiculo-modal.component.ts
private vehiculoNotificationService = inject(VehiculoNotificationService);
private authService = inject(AuthService);

// After successful transfer
const empresaOrigen = this.empresaActual();
const empresaDestino = this.empresaDestinoSeleccionada();
const usuarioActual = this.authService.getCurrentUser();

if (empresaOrigen && empresaDestino && usuarioActual) {
  const destinatariosIds = ['supervisor_1', 'admin_1'];
  
  this.vehiculoNotificationService.notificarTransferencia(
    vehiculo,
    empresaOrigen,
    empresaDestino,
    usuarioActual.id,
    destinatariosIds
  );
}
```

### Low Request Modal Integration

The low request modal also has notifications integrated:

```typescript
// In solicitar-baja-vehiculo-modal.component.ts
private vehiculoNotificationService = inject(VehiculoNotificationService);
private authService = inject(AuthService);

// After successful low request
const empresaActual = this.empresa();
const usuarioActual = this.authService.getCurrentUser();

if (empresaActual && usuarioActual) {
  const supervisoresIds = ['supervisor_1', 'supervisor_2'];
  
  this.vehiculoNotificationService.notificarSolicitudBaja(
    this.data.vehiculo,
    formData.motivo,
    empresaActual,
    usuarioActual.id,
    supervisoresIds
  );
}
```

---

## Notification Priority Levels

The system automatically assigns priorities based on the event type:

| Priority | Use Cases | Color |
|----------|-----------|-------|
| **CRITICA** | Documents expiring in ≤7 days, critical errors | Red |
| **ALTA** | Low requests, suspensions, documents expiring in ≤15 days | Orange |
| **MEDIA** | Transfers, approvals, documents expiring in ≤30 days | Yellow |
| **BAJA** | Activations, general state changes | Gray |

---

## Document Types Monitored

The expiration service monitors these document types:

1. **TUC** (Tarjeta Única de Circulación)
   - Expires 1 year after emission
   - Critical for vehicle operation

2. **Revisión Técnica**
   - Expires every 6 months
   - Required for public transport vehicles

3. **SOAT** (Seguro Obligatorio de Accidentes de Tránsito)
   - Expires annually
   - Mandatory insurance

---

## Testing the Implementation

### 1. Open Test Page

Open `frontend/test-vehiculo-notifications.html` in your browser to see:
- Implementation statistics
- All methods documented
- Usage examples
- Notification examples
- Requirements coverage

### 2. Manual Testing

```typescript
// In browser console or component
const notificationService = inject(VehiculoNotificationService);

// Test transfer notification
notificationService.notificarTransferencia(
  mockVehiculo,
  mockEmpresaOrigen,
  mockEmpresaDestino,
  'user123',
  ['supervisor_1']
);

// Check console for logs
// Check notification service for created notifications
```

### 3. Verify Job Execution

```typescript
const vencimientoService = inject(VehiculoVencimientoService);

// Start job
vencimientoService.iniciarJobVencimientos();

// Check console for:
// "🚀 Iniciando job de verificación de vencimientos"
// "🔍 Verificando vencimientos de documentos..."
// "✅ No hay documentos próximos a vencer" or notification logs
```

---

## Configuration

### Default Configuration

```typescript
{
  diasAnticipacion: [30, 15, 7, 3, 1],  // Notify at these days before expiration
  horaVerificacion: '09:00',             // Check at 9:00 AM
  habilitado: true                       // Service enabled
}
```

### Custom Configuration

```typescript
vencimientoService.actualizarConfiguracion({
  diasAnticipacion: [60, 45, 30, 15, 7, 3, 1],  // More frequent notifications
  horaVerificacion: '08:00',                     // Earlier check time
  habilitado: true
});
```

---

## Troubleshooting

### Notifications Not Sending

1. **Check service injection:**
   ```typescript
   private notificationService = inject(VehiculoNotificationService);
   ```

2. **Verify user authentication:**
   ```typescript
   const user = this.authService.getCurrentUser();
   if (!user) {
     console.error('User not authenticated');
   }
   ```

3. **Check console for errors:**
   - Look for error messages in browser console
   - Verify API endpoints are accessible

### Job Not Running

1. **Verify job started:**
   ```typescript
   vencimientoService.iniciarJobVencimientos();
   // Should see: "🚀 Iniciando job de verificación de vencimientos"
   ```

2. **Check configuration:**
   ```typescript
   const config = vencimientoService.obtenerConfiguracion();
   console.log('Enabled:', config.habilitado);
   ```

3. **Verify interval:**
   - Default is 24 hours
   - For testing, you can modify `intervaloVerificacion` in the service

---

## Next Steps

1. **Replace Hardcoded IDs:**
   - Update `['supervisor_1', 'admin_1']` with dynamic role-based queries
   - Implement user role service

2. **Add Notification Preferences:**
   - Allow users to configure which notifications they want to receive
   - Implement notification settings UI

3. **Extend to Email/SMS:**
   - Integrate email service for critical notifications
   - Add SMS for urgent alerts

4. **Add Notification History:**
   - Track sent notifications
   - Provide notification history view for users

5. **Real-time Updates:**
   - Integrate with WebSocket for instant notifications
   - Add push notifications for mobile

---

## Support

For issues or questions:
1. Check the completion summary: `TASK_9_COMPLETION_SUMMARY.md`
2. Review the test page: `test-vehiculo-notifications.html`
3. Check service implementations in `frontend/src/app/services/`

---

**Status:** ✅ COMPLETE
**Version:** 1.0.0
**Last Updated:** December 2025
