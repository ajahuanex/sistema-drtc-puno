# Design Document - Módulo de Mesa de Partes

## Overview

El módulo de Mesa de Partes es un sistema completo de gestión documental diseñado con arquitectura modular y capacidades de integración. El sistema se construirá utilizando Angular 18 en el frontend y FastAPI en el backend, con PostgreSQL como base de datos principal.

La arquitectura está diseñada para ser escalable, permitiendo la integración con múltiples mesas de partes externas mediante APIs REST y webhooks. El sistema implementará patrones de diseño como Repository, Service Layer, y Event-Driven Architecture para facilitar la extensibilidad y mantenimiento.

## Architecture

### Frontend Architecture

```
frontend/src/app/
├── components/
│   └── mesa-partes/
│       ├── mesa-partes.component.ts          # Componente principal con tabs
│       ├── registro-documento.component.ts    # Formulario de registro
│       ├── lista-documentos.component.ts      # Tabla de documentos
│       ├── detalle-documento.component.ts     # Vista detallada
│       ├── derivar-documento.component.ts     # Modal de derivación
│       ├── busqueda-documentos.component.ts   # Búsqueda avanzada
│       ├── dashboard-mesa.component.ts        # Dashboard con estadísticas
│       ├── configuracion-integraciones.component.ts  # Config de APIs externas
│       └── historial-documento.component.ts   # Timeline de movimientos
├── models/
│   └── mesa-partes/
│       ├── documento.model.ts                 # Modelo de documento
│       ├── derivacion.model.ts                # Modelo de derivación
│       ├── integracion.model.ts               # Modelo de integración externa
│       └── notificacion.model.ts              # Modelo de notificación
├── services/
│   └── mesa-partes/
│       ├── documento.service.ts               # CRUD de documentos
│       ├── derivacion.service.ts              # Gestión de derivaciones
│       ├── integracion.service.ts             # Manejo de integraciones
│       ├── notificacion.service.ts            # Sistema de notificaciones
│       └── reporte.service.ts                 # Generación de reportes
└── shared/
    ├── documento-card.component.ts            # Card de documento
    ├── estado-badge.component.ts              # Badge de estado
    ├── prioridad-indicator.component.ts       # Indicador de prioridad
    └── qr-code-generator.component.ts         # Generador de QR
```

### Backend Architecture

```
backend/app/
├── api/
│   └── v1/
│       └── endpoints/
│           ├── documentos.py                  # Endpoints de documentos
│           ├── derivaciones.py                # Endpoints de derivaciones
│           ├── integraciones.py               # Endpoints de integraciones
│           ├── notificaciones.py              # Endpoints de notificaciones
│           └── reportes.py                    # Endpoints de reportes
├── models/
│   ├── documento.py                           # Modelo SQLAlchemy
│   ├── derivacion.py                          # Modelo de derivación
│   ├── integracion.py                         # Modelo de integración
│   ├── notificacion.py                        # Modelo de notificación
│   └── archivo_adjunto.py                     # Modelo de archivos
├── schemas/
│   ├── documento.py                           # Schemas Pydantic
│   ├── derivacion.py                          # Schemas de derivación
│   └── integracion.py                         # Schemas de integración
├── services/
│   ├── documento_service.py                   # Lógica de negocio
│   ├── derivacion_service.py                  # Lógica de derivaciones
│   ├── integracion_service.py                 # Lógica de integración
│   ├── notificacion_service.py                # Sistema de notificaciones
│   └── webhook_service.py                     # Manejo de webhooks
├── repositories/
│   ├── documento_repository.py                # Acceso a datos
│   ├── derivacion_repository.py               # Acceso a derivaciones
│   └── integracion_repository.py              # Acceso a integraciones
└── integrations/
    ├── base_integration.py                    # Clase base para integraciones
    ├── mesa_partes_client.py                  # Cliente genérico
    └── adapters/
        ├── standard_adapter.py                # Adaptador estándar
        └── custom_adapter.py                  # Adaptadores personalizados
```

## Components and Interfaces

### Frontend Components

#### MesaPartesComponent
Componente principal que actúa como contenedor con navegación por tabs.

**Inputs:**
- Ninguno (componente raíz)

**Outputs:**
- Ninguno

**Features:**
- Tabs: Registro, Documentos, Búsqueda, Dashboard, Configuración
- Navegación entre secciones
- Contador de notificaciones pendientes

#### RegistroDocumentoComponent
Formulario para registrar nuevos documentos.

**Inputs:**
- `documentoId?: string` - Para edición de documento existente

**Outputs:**
- `documentoCreado: EventEmitter<Documento>` - Emite cuando se crea un documento

**Features:**
- Formulario reactivo con validaciones
- Upload de archivos múltiples
- Generación automática de número de expediente
- Vista previa de archivos adjuntos
- Selección de tipo y categoría
- Marcado de prioridad
- Generación de comprobante con QR

#### ListaDocumentosComponent
Tabla con lista de documentos y acciones.

**Inputs:**
- `filtros?: FiltrosDocumento` - Filtros aplicados
- `soloMiArea?: boolean` - Mostrar solo documentos del área del usuario

**Outputs:**
- `documentoSeleccionado: EventEmitter<Documento>` - Emite cuando se selecciona un documento

**Features:**
- Tabla con paginación y ordenamiento
- Filtros por estado, tipo, fecha, prioridad
- Acciones: Ver detalle, Derivar, Archivar
- Indicadores visuales de estado y prioridad
- Búsqueda rápida
- Exportación a Excel/PDF

#### DetalleDocumentoComponent
Vista detallada de un documento con toda su información.

**Inputs:**
- `documentoId: string` - ID del documento a mostrar

**Outputs:**
- `accionRealizada: EventEmitter<string>` - Emite cuando se realiza una acción

**Features:**
- Información completa del documento
- Historial de derivaciones (timeline)
- Archivos adjuntos con descarga
- Botones de acción según permisos
- Notas y observaciones
- Estado actual y ubicación

#### DerivarDocumentoComponent
Modal para derivar documentos a otras áreas.

**Inputs:**
- `documento: Documento` - Documento a derivar
- `areasDisponibles: Area[]` - Lista de áreas

**Outputs:**
- `derivacionRealizada: EventEmitter<Derivacion>` - Emite cuando se deriva

**Features:**
- Selección de área destino (múltiple)
- Campo de instrucciones/notas
- Opción de marcar como urgente
- Fecha límite de atención
- Confirmación antes de derivar

#### ConfiguracionIntegracionesComponent
Gestión de integraciones con mesas de partes externas.

**Inputs:**
- Ninguno

**Outputs:**
- Ninguno

**Features:**
- Lista de integraciones configuradas
- Formulario para nueva integración
- Test de conectividad
- Mapeo de campos
- Configuración de webhooks
- Log de sincronizaciones
- Estado de conexión en tiempo real

### Backend Services

#### DocumentoService
Servicio principal para gestión de documentos.

**Methods:**
```python
async def crear_documento(documento: DocumentoCreate, usuario_id: str) -> Documento
async def obtener_documento(documento_id: str) -> Documento
async def listar_documentos(filtros: FiltrosDocumento, usuario_id: str) -> List[Documento]
async def actualizar_documento(documento_id: str, datos: DocumentoUpdate) -> Documento
async def archivar_documento(documento_id: str, clasificacion: str) -> Documento
async def generar_numero_expediente() -> str
async def adjuntar_archivo(documento_id: str, archivo: UploadFile) -> ArchivoAdjunto
```

#### DerivacionService
Servicio para gestión de derivaciones.

**Methods:**
```python
async def derivar_documento(documento_id: str, derivacion: DerivacionCreate) -> Derivacion
async def recibir_documento(derivacion_id: str, usuario_id: str) -> Derivacion
async def obtener_historial(documento_id: str) -> List[Derivacion]
async def obtener_documentos_area(area_id: str, estado: str) -> List[Documento]
async def registrar_atencion(derivacion_id: str, observaciones: str) -> Derivacion
```

#### IntegracionService
Servicio para manejo de integraciones externas.

**Methods:**
```python
async def crear_integracion(integracion: IntegracionCreate) -> Integracion
async def probar_conexion(integracion_id: str) -> bool
async def enviar_documento(documento_id: str, integracion_id: str) -> bool
async def recibir_documento_externo(datos: dict, integracion_id: str) -> Documento
async def sincronizar_estado(documento_id: str, integracion_id: str) -> bool
async def obtener_log_sincronizacion(integracion_id: str) -> List[LogSincronizacion]
```

#### NotificacionService
Servicio para sistema de notificaciones.

**Methods:**
```python
async def enviar_notificacion(usuario_id: str, notificacion: NotificacionCreate) -> Notificacion
async def obtener_notificaciones(usuario_id: str, leidas: bool = None) -> List[Notificacion]
async def marcar_como_leida(notificacion_id: str) -> Notificacion
async def enviar_email(destinatario: str, asunto: str, contenido: str) -> bool
async def programar_alerta(documento_id: str, fecha: datetime) -> Alerta
```

## Data Models

### Documento Model

```typescript
// Frontend
interface Documento {
  id: string;
  numeroExpediente: string;
  tipoDocumento: TipoDocumento;
  numeroDocumentoExterno?: string;
  remitente: string;
  asunto: string;
  numeroFolios: number;
  tieneAnexos: boolean;
  prioridad: 'NORMAL' | 'ALTA' | 'URGENTE';
  estado: 'REGISTRADO' | 'EN_PROCESO' | 'ATENDIDO' | 'ARCHIVADO';
  fechaRecepcion: Date;
  fechaLimite?: Date;
  usuarioRegistro: Usuario;
  areaActual?: Area;
  archivosAdjuntos: ArchivoAdjunto[];
  etiquetas: string[];
  codigoQR: string;
  expedienteRelacionado?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TipoDocumento {
  id: string;
  nombre: string;
  codigo: string;
  categorias: Categoria[];
}

interface ArchivoAdjunto {
  id: string;
  nombreArchivo: string;
  tipoMime: string;
  tamano: number;
  url: string;
  fechaSubida: Date;
}
```

```python
# Backend
class Documento(Base):
    __tablename__ = "documentos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    numero_expediente = Column(String(50), unique=True, nullable=False, index=True)
    tipo_documento_id = Column(UUID(as_uuid=True), ForeignKey("tipos_documento.id"))
    numero_documento_externo = Column(String(100))
    remitente = Column(String(255), nullable=False)
    asunto = Column(Text, nullable=False)
    numero_folios = Column(Integer, default=0)
    tiene_anexos = Column(Boolean, default=False)
    prioridad = Column(Enum(PrioridadEnum), default=PrioridadEnum.NORMAL)
    estado = Column(Enum(EstadoDocumentoEnum), default=EstadoDocumentoEnum.REGISTRADO)
    fecha_recepcion = Column(DateTime, default=datetime.utcnow)
    fecha_limite = Column(DateTime, nullable=True)
    usuario_registro_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))
    area_actual_id = Column(UUID(as_uuid=True), ForeignKey("areas.id"))
    codigo_qr = Column(String(255))
    expediente_relacionado_id = Column(UUID(as_uuid=True), ForeignKey("documentos.id"))
    etiquetas = Column(ARRAY(String))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tipo_documento = relationship("TipoDocumento")
    usuario_registro = relationship("Usuario")
    area_actual = relationship("Area")
    archivos_adjuntos = relationship("ArchivoAdjunto", back_populates="documento")
    derivaciones = relationship("Derivacion", back_populates="documento")
```

### Derivacion Model

```typescript
// Frontend
interface Derivacion {
  id: string;
  documentoId: string;
  areaOrigen: Area;
  areaDestino: Area;
  usuarioDeriva: Usuario;
  usuarioRecibe?: Usuario;
  instrucciones: string;
  fechaDerivacion: Date;
  fechaRecepcion?: Date;
  fechaAtencion?: Date;
  estado: 'PENDIENTE' | 'RECIBIDO' | 'ATENDIDO';
  observaciones?: string;
  esUrgente: boolean;
}
```

```python
# Backend
class Derivacion(Base):
    __tablename__ = "derivaciones"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    documento_id = Column(UUID(as_uuid=True), ForeignKey("documentos.id"), nullable=False)
    area_origen_id = Column(UUID(as_uuid=True), ForeignKey("areas.id"))
    area_destino_id = Column(UUID(as_uuid=True), ForeignKey("areas.id"))
    usuario_deriva_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))
    usuario_recibe_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))
    instrucciones = Column(Text)
    fecha_derivacion = Column(DateTime, default=datetime.utcnow)
    fecha_recepcion = Column(DateTime)
    fecha_atencion = Column(DateTime)
    estado = Column(Enum(EstadoDerivacionEnum), default=EstadoDerivacionEnum.PENDIENTE)
    observaciones = Column(Text)
    es_urgente = Column(Boolean, default=False)
    
    # Relationships
    documento = relationship("Documento", back_populates="derivaciones")
    area_origen = relationship("Area", foreign_keys=[area_origen_id])
    area_destino = relationship("Area", foreign_keys=[area_destino_id])
    usuario_deriva = relationship("Usuario", foreign_keys=[usuario_deriva_id])
    usuario_recibe = relationship("Usuario", foreign_keys=[usuario_recibe_id])
```

### Integracion Model

```typescript
// Frontend
interface Integracion {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'API_REST' | 'WEBHOOK' | 'SOAP';
  urlBase: string;
  autenticacion: {
    tipo: 'API_KEY' | 'BEARER' | 'BASIC';
    credenciales: string; // Encriptado
  };
  mapeosCampos: MapeoCampo[];
  activa: boolean;
  ultimaSincronizacion?: Date;
  estadoConexion: 'CONECTADO' | 'DESCONECTADO' | 'ERROR';
  configuracionWebhook?: ConfiguracionWebhook;
}

interface MapeoCampo {
  campoLocal: string;
  campoRemoto: string;
  transformacion?: string;
}

interface ConfiguracionWebhook {
  url: string;
  eventos: string[];
  secreto: string;
}
```

```python
# Backend
class Integracion(Base):
    __tablename__ = "integraciones"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    tipo = Column(Enum(TipoIntegracionEnum))
    url_base = Column(String(500))
    tipo_autenticacion = Column(Enum(TipoAutenticacionEnum))
    credenciales_encriptadas = Column(Text)
    mapeos_campos = Column(JSON)
    activa = Column(Boolean, default=True)
    ultima_sincronizacion = Column(DateTime)
    estado_conexion = Column(Enum(EstadoConexionEnum))
    configuracion_webhook = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    logs_sincronizacion = relationship("LogSincronizacion", back_populates="integracion")
```

## Error Handling

### Frontend Error Handling

```typescript
// Interceptor para manejo centralizado de errores
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ha ocurrido un error';
        
        if (error.error instanceof ErrorEvent) {
          // Error del cliente
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Error del servidor
          switch (error.status) {
            case 400:
              errorMessage = 'Datos inválidos';
              break;
            case 401:
              errorMessage = 'No autorizado';
              break;
            case 403:
              errorMessage = 'Acceso denegado';
              break;
            case 404:
              errorMessage = 'Recurso no encontrado';
              break;
            case 500:
              errorMessage = 'Error del servidor';
              break;
          }
        }
        
        this.notificationService.showError(errorMessage);
        return throwError(() => error);
      })
    );
  }
}
```

### Backend Error Handling

```python
# Exception handlers personalizados
class DocumentoNotFoundException(Exception):
    pass

class IntegracionException(Exception):
    pass

class DerivacionException(Exception):
    pass

@app.exception_handler(DocumentoNotFoundException)
async def documento_not_found_handler(request: Request, exc: DocumentoNotFoundException):
    return JSONResponse(
        status_code=404,
        content={"detail": "Documento no encontrado"}
    )

@app.exception_handler(IntegracionException)
async def integracion_error_handler(request: Request, exc: IntegracionException):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Error de integración: {str(exc)}"}
    )

# Logging de errores
import logging

logger = logging.getLogger(__name__)

try:
    # Operación
    pass
except Exception as e:
    logger.error(f"Error en operación: {str(e)}", exc_info=True)
    raise
```

## Testing Strategy

### Unit Tests

**Frontend:**
```typescript
describe('DocumentoService', () => {
  let service: DocumentoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentoService]
    });
    service = TestBed.inject(DocumentoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('debe crear un documento', () => {
    const mockDocumento: DocumentoCreate = {
      tipoDocumentoId: '123',
      remitente: 'Test',
      asunto: 'Test'
    };

    service.crearDocumento(mockDocumento).subscribe(doc => {
      expect(doc.numeroExpediente).toBeDefined();
    });

    const req = httpMock.expectOne(`${service.apiUrl}/documentos`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockDocumento, id: '456', numeroExpediente: 'EXP-2025-0001' });
  });
});
```

**Backend:**
```python
import pytest
from app.services.documento_service import DocumentoService

@pytest.mark.asyncio
async def test_crear_documento(db_session):
    service = DocumentoService(db_session)
    documento_data = DocumentoCreate(
        tipo_documento_id="123",
        remitente="Test",
        asunto="Test"
    )
    
    documento = await service.crear_documento(documento_data, usuario_id="user123")
    
    assert documento.id is not None
    assert documento.numero_expediente.startswith("EXP-")
    assert documento.estado == EstadoDocumentoEnum.REGISTRADO
```

### Integration Tests

```python
@pytest.mark.asyncio
async def test_flujo_completo_documento(client, db_session):
    # 1. Crear documento
    response = await client.post("/api/v1/documentos", json={
        "tipo_documento_id": "123",
        "remitente": "Test",
        "asunto": "Test"
    })
    assert response.status_code == 201
    documento_id = response.json()["id"]
    
    # 2. Derivar documento
    response = await client.post(f"/api/v1/derivaciones", json={
        "documento_id": documento_id,
        "area_destino_id": "area123",
        "instrucciones": "Atender"
    })
    assert response.status_code == 201
    
    # 3. Verificar estado
    response = await client.get(f"/api/v1/documentos/{documento_id}")
    assert response.json()["estado"] == "EN_PROCESO"
```

### E2E Tests

```typescript
describe('Flujo de Mesa de Partes', () => {
  it('debe registrar y derivar un documento', () => {
    cy.visit('/mesa-partes');
    
    // Registrar documento
    cy.get('[data-cy=btn-nuevo-documento]').click();
    cy.get('[data-cy=input-remitente]').type('Juan Pérez');
    cy.get('[data-cy=input-asunto]').type('Solicitud de información');
    cy.get('[data-cy=select-tipo]').select('Solicitud');
    cy.get('[data-cy=btn-guardar]').click();
    
    // Verificar creación
    cy.contains('Documento registrado exitosamente');
    
    // Derivar documento
    cy.get('[data-cy=btn-derivar]').first().click();
    cy.get('[data-cy=select-area]').select('Área Legal');
    cy.get('[data-cy=textarea-instrucciones]').type('Revisar y responder');
    cy.get('[data-cy=btn-confirmar-derivacion]').click();
    
    // Verificar derivación
    cy.contains('Documento derivado exitosamente');
  });
});
```

## Integration Architecture

### API REST para Integración Externa

```python
# Endpoint para recibir documentos de mesas externas
@router.post("/api/v1/integracion/recibir-documento")
async def recibir_documento_externo(
    documento: DocumentoExternoSchema,
    integracion_id: str = Header(..., alias="X-Integration-ID"),
    api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    # Validar autenticación
    integracion = await validar_integracion(integracion_id, api_key, db)
    
    # Mapear campos según configuración
    documento_mapeado = await mapear_documento(documento, integracion)
    
    # Crear documento en sistema local
    documento_local = await documento_service.crear_documento_externo(
        documento_mapeado, 
        integracion_id
    )
    
    # Enviar webhook de confirmación si está configurado
    if integracion.configuracion_webhook:
        await webhook_service.enviar_confirmacion(
            integracion.configuracion_webhook.url,
            documento_local
        )
    
    return {"id": documento_local.id, "numero_expediente": documento_local.numero_expediente}

# Endpoint para enviar documentos a mesas externas
@router.post("/api/v1/integracion/enviar-documento/{documento_id}")
async def enviar_documento_externo(
    documento_id: str,
    integracion_id: str,
    db: Session = Depends(get_db)
):
    documento = await documento_service.obtener_documento(documento_id, db)
    integracion = await integracion_service.obtener_integracion(integracion_id, db)
    
    # Mapear documento al formato externo
    documento_externo = await mapear_documento_salida(documento, integracion)
    
    # Enviar a mesa externa
    resultado = await integracion_service.enviar_documento(
        documento_externo,
        integracion
    )
    
    # Registrar en log
    await log_service.registrar_sincronizacion(
        integracion_id,
        documento_id,
        "ENVIADO",
        resultado
    )
    
    return {"success": True, "id_externo": resultado.get("id")}
```

### Webhook System

```python
# Sistema de webhooks para notificar eventos
class WebhookService:
    async def enviar_webhook(
        self,
        url: str,
        evento: str,
        datos: dict,
        secreto: str
    ):
        # Generar firma HMAC
        firma = hmac.new(
            secreto.encode(),
            json.dumps(datos).encode(),
            hashlib.sha256
        ).hexdigest()
        
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": firma,
            "X-Webhook-Event": evento
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=datos,
                    headers=headers,
                    timeout=30.0
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Error enviando webhook: {str(e)}")
            return False

# Eventos que disparan webhooks
WEBHOOK_EVENTS = [
    "documento.creado",
    "documento.derivado",
    "documento.recibido",
    "documento.atendido",
    "documento.archivado"
]
```

## Security Considerations

1. **Autenticación y Autorización:**
   - JWT tokens para autenticación de usuarios
   - API Keys para integraciones externas
   - RBAC (Role-Based Access Control) para permisos

2. **Encriptación:**
   - Credenciales de integración encriptadas en base de datos
   - HTTPS obligatorio para todas las comunicaciones
   - Firma HMAC para webhooks

3. **Validación:**
   - Validación de entrada en frontend y backend
   - Sanitización de datos para prevenir XSS
   - Rate limiting en APIs

4. **Auditoría:**
   - Log de todas las operaciones críticas
   - Registro de accesos y cambios
   - Trazabilidad completa de documentos

## Performance Optimization

1. **Frontend:**
   - Lazy loading de módulos
   - Virtual scrolling para listas grandes
   - Caché de datos frecuentes
   - Optimización de imágenes y archivos

2. **Backend:**
   - Índices en campos de búsqueda frecuente
   - Paginación en listados
   - Caché con Redis para consultas frecuentes
   - Procesamiento asíncrono de tareas pesadas

3. **Base de Datos:**
   - Particionamiento de tablas por fecha
   - Archivado automático de documentos antiguos
   - Optimización de queries con EXPLAIN
   - Connection pooling

## Deployment Considerations

1. **Containerización:**
   - Docker para frontend y backend
   - Docker Compose para desarrollo
   - Kubernetes para producción

2. **CI/CD:**
   - GitHub Actions para pipeline
   - Tests automáticos en cada commit
   - Deploy automático a staging
   - Deploy manual a producción

3. **Monitoreo:**
   - Logs centralizados con ELK Stack
   - Métricas con Prometheus y Grafana
   - Alertas automáticas de errores
   - Health checks de servicios
