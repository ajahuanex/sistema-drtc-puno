# Mesa de Partes - Services

This directory contains all the frontend services for the Mesa de Partes module.

## Services Implemented

### 1. DocumentoService (`documento.service.ts`)
Handles all document-related operations.

**Methods:**
- `crearDocumento()` - Create new document
- `obtenerDocumento()` - Get document by ID
- `listarDocumentos()` - List documents with filters and pagination
- `actualizarDocumento()` - Update existing document
- `archivarDocumento()` - Archive a document
- `adjuntarArchivo()` - Attach file to document
- `generarComprobante()` - Generate receipt PDF
- `descargarComprobante()` - Download receipt
- `buscarPorQR()` - Search document by QR code
- `obtenerTiposDocumento()` - Get available document types
- `eliminarDocumento()` - Delete document (soft delete)
- `restaurarDocumento()` - Restore archived document
- `exportarExcel()` - Export documents to Excel
- `exportarPDF()` - Export documents to PDF

**Requirements:** 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 9.1, 9.2, 9.3, 9.5

---

### 2. DerivacionService (`derivacion.service.ts`)
Manages document routing and tracking between areas.

**Methods:**
- `derivarDocumento()` - Route document to another area
- `derivarDocumentoMultiple()` - Route document to multiple areas
- `recibirDocumento()` - Receive routed document
- `obtenerHistorial()` - Get complete routing history
- `obtenerDocumentosArea()` - Get documents for specific area
- `registrarAtencion()` - Register document attention
- `actualizarDerivacion()` - Update routing
- `obtenerDerivacion()` - Get routing by ID
- `obtenerDerivacionesPendientes()` - Get pending routings
- `obtenerDerivacionesUrgentes()` - Get urgent routings
- `obtenerDerivacionesProximasVencer()` - Get routings about to expire
- `obtenerDerivacionesVencidas()` - Get expired routings
- `cancelarDerivacion()` - Cancel routing
- `reasignarDerivacion()` - Reassign routing to another area

**Requirements:** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 8.2, 8.3

---

### 3. IntegracionService (`integracion.service.ts`)
Handles integrations with external document management systems.

**Methods:**
- `crearIntegracion()` - Create new integration
- `obtenerIntegracion()` - Get integration by ID
- `listarIntegraciones()` - List all integrations
- `actualizarIntegracion()` - Update integration
- `eliminarIntegracion()` - Delete integration
- `probarConexion()` - Test connection with external system
- `enviarDocumento()` - Send document to external system
- `recibirDocumentoExterno()` - Receive document from external system
- `obtenerLogSincronizacion()` - Get synchronization logs
- `configurarWebhook()` - Configure webhook
- `probarWebhook()` - Test webhook
- `toggleIntegracion()` - Activate/Deactivate integration
- `sincronizarEstado()` - Synchronize document status
- `obtenerEstadisticas()` - Get integration statistics
- `reintentarSincronizacion()` - Retry failed synchronization
- `validarMapeo()` - Validate field mapping
- `obtenerEventosDisponibles()` - Get available webhook events
- `regenerarSecretoWebhook()` - Regenerate webhook secret

**Requirements:** 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 10.1, 10.2, 10.3, 10.4

---

### 4. NotificacionService (`notificacion.service.ts`)
Manages real-time notifications and alerts using WebSocket.

**Methods:**
- `obtenerNotificaciones()` - Get user notifications
- `marcarComoLeida()` - Mark notification as read
- `marcarTodasComoLeidas()` - Mark all notifications as read
- `eliminarNotificacion()` - Delete notification
- `obtenerContadorNoLeidas()` - Get unread notifications count
- `conectarWebSocket()` - Connect WebSocket for real-time notifications
- `desconectarWebSocket()` - Disconnect WebSocket
- `suscribirseAEventos()` - Subscribe to specific events
- `desuscribirseDeEventos()` - Unsubscribe from events
- `obtenerPreferencias()` - Get notification preferences
- `actualizarPreferencias()` - Update notification preferences
- `enviarNotificacion()` - Send manual notification (admin)
- `obtenerHistorial()` - Get notification history
- `mostrarNotificacionNavegador()` - Show browser notification
- `solicitarPermisoNotificaciones()` - Request browser notification permission

**Features:**
- WebSocket connection with automatic reconnection
- Real-time notification streaming
- Browser notifications support
- Sound alerts for urgent notifications
- Observable streams for reactive updates

**Requirements:** 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7

---

### 5. ReporteService (`reporte.service.ts`)
Generates reports and statistics for the document management system.

**Methods:**
- `obtenerEstadisticas()` - Get general statistics
- `obtenerEstadisticasPorArea()` - Get statistics by area
- `obtenerEstadisticasPorTipo()` - Get statistics by document type
- `obtenerMetricas()` - Get performance metrics
- `generarReporte()` - Generate custom report
- `exportarReporte()` - Export report to specific format
- `exportarExcel()` - Export statistics to Excel
- `exportarPDF()` - Export statistics to PDF
- `descargarReporte()` - Download exported report
- `obtenerDocumentosVencidos()` - Get expired documents
- `obtenerDocumentosProximosVencer()` - Get documents about to expire
- `obtenerTiemposAtencionPorArea()` - Get average attention times by area
- `obtenerTendencias()` - Get document trends
- `obtenerReportesGuardados()` - Get saved reports
- `guardarConfiguracionReporte()` - Save report configuration
- `eliminarReporte()` - Delete saved report
- `obtenerEstadisticasIntegraciones()` - Get integration statistics
- `programarReporteAutomatico()` - Schedule automatic report generation

**Requirements:** 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 4.5, 4.6

---

## Models

All services use strongly-typed models located in `frontend/src/app/models/mesa-partes/`:

- `documento.model.ts` - Document models and enums
- `derivacion.model.ts` - Routing models and enums
- `integracion.model.ts` - Integration models and enums
- `notificacion.model.ts` - Notification models and enums
- `reporte.model.ts` - Report models and enums

## API Integration

All services connect to the backend API at `http://localhost:8000/api/v1/`:
- `/documentos` - Document endpoints
- `/derivaciones` - Routing endpoints
- `/integraciones` - Integration endpoints
- `/notificaciones` - Notification endpoints
- `/reportes` - Report endpoints

WebSocket connection for real-time notifications: `ws://localhost:8000/ws/notificaciones`

## Usage Example

```typescript
import { inject } from '@angular/core';
import { DocumentoService } from './services/mesa-partes/documento.service';
import { NotificacionService } from './services/mesa-partes/notificacion.service';

export class MyComponent {
  private documentoService = inject(DocumentoService);
  private notificacionService = inject(NotificacionService);

  ngOnInit() {
    // Connect to real-time notifications
    this.notificacionService.conectarWebSocket(userId, token);
    
    // Subscribe to notifications
    this.notificacionService.notificaciones$.subscribe(notificacion => {
      console.log('Nueva notificación:', notificacion);
    });

    // Load documents
    this.documentoService.listarDocumentos({ estado: 'EN_PROCESO' })
      .subscribe(response => {
        console.log('Documentos:', response.documentos);
      });
  }

  ngOnDestroy() {
    // Disconnect WebSocket
    this.notificacionService.desconectarWebSocket();
  }
}
```

## Testing

All services are ready for unit testing with Angular's TestBed and HttpClientTestingModule.

## Next Steps

The following components need to be implemented to use these services:
- Task 4: MesaPartesComponent (main container)
- Task 5: RegistroDocumentoComponent (document registration)
- Task 6: ListaDocumentosComponent (document list)
- Task 7: DetalleDocumentoComponent (document details)
- Task 8: DerivarDocumentoComponent (routing modal)
- Task 9: BusquedaDocumentosComponent (advanced search)
- Task 10: DashboardMesaComponent (dashboard with statistics)
- Task 11: ConfiguracionIntegracionesComponent (integration configuration)
