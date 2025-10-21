# Design Document

## Overview

Este documento describe el diseño técnico para integrar los componentes y servicios no utilizados en el frontend de la aplicación DRTC Puno. El objetivo es eliminar las advertencias de TypeScript sobre archivos no utilizados y mejorar la funcionalidad de la aplicación mediante la integración de componentes ya implementados.

### Componentes a Integrar

1. **CodigoEmpresaInfoComponent** - Componente visual para mostrar información del código de empresa
2. **FlujoTrabajoService** - Servicio completo para gestión de flujos de trabajo de expedientes
3. **IconService** - Servicio para gestión de iconos con fallbacks automáticos
4. **SmartIconComponent** - Componente inteligente de iconos con fallbacks
5. **shared/index.ts** - Archivo de exportación de componentes compartidos
6. **EmpresaSelectorComponent** - Mejorar para usar en modal de resolución

### Objetivos del Diseño

- Integrar componentes existentes sin modificar su funcionalidad core
- Mejorar la experiencia de usuario en vistas de empresas y resoluciones
- Implementar sistema de fallback para iconos
- Preparar infraestructura para flujos de trabajo de expedientes
- Eliminar warnings de compilación de TypeScript

## Architecture

### Diagrama de Integración

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICACIÓN ANGULAR                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  EmpresaDetail   │      │ CrearResolucion  │            │
│  │   Component      │      │    Component     │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
│           │                         │                       │
│           │ usa                     │ usa                   │
│           ▼                         ▼                       │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ CodigoEmpresa    │      │ EmpresaSelector  │            │
│  │ InfoComponent    │      │   Component      │            │
│  └──────────────────┘      └──────────────────┘            │
│                                                              │
│  ┌──────────────────────────────────────────┐              │
│  │         TODOS LOS COMPONENTES            │              │
│  └────────────────┬─────────────────────────┘              │
│                   │ usan                                    │
│                   ▼                                         │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  SmartIcon       │◄─────│   IconService    │            │
│  │  Component       │      │                  │            │
│  └──────────────────┘      └──────────────────┘            │
│                                                              │
│  ┌──────────────────────────────────────────┐              │
│  │    COMPONENTES DE EXPEDIENTES/OFICINAS   │              │
│  └────────────────┬─────────────────────────┘              │
│                   │ usan                                    │
│                   ▼                                         │
│  ┌──────────────────────────────────────────┐              │
│  │       FlujoTrabajoService                │              │
│  │  (Preparado para uso futuro)             │              │
│  └──────────────────────────────────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```


### Flujo de Datos

1. **Carga Inicial**
   - IconService verifica disponibilidad de Material Icons
   - Si no están disponibles, activa modo fallback
   - Todos los SmartIconComponent usan IconService automáticamente

2. **Vista de Empresa**
   - EmpresaDetailComponent carga datos de empresa
   - CodigoEmpresaInfoComponent recibe código de empresa
   - Muestra información visual del código con chips de colores

3. **Creación de Resolución**
   - CrearResolucionComponent usa EmpresaSelectorComponent mejorado
   - Usuario busca empresa por RUC, razón social o código
   - Autocompletado filtra resultados en tiempo real
   - Selección actualiza formulario reactivo

4. **Flujo de Trabajo (Preparación)**
   - FlujoTrabajoService queda disponible para componentes futuros
   - Estructura lista para integración con backend
   - Métodos preparados para gestión de movimientos de expedientes

## Components and Interfaces

### 1. CodigoEmpresaInfoComponent

**Propósito:** Mostrar información visual y detallada del código de empresa

**Ubicación de Integración:** `empresa-detail.component.ts`

**Props de Entrada:**
```typescript
@Input() codigoEmpresa: Signal<string>
```

**Estructura del Código de Empresa:**
- Formato: `XXXXYYY` (4 dígitos + 3 letras)
- Ejemplo: `0123PRT`
  - `0123` = Número secuencial
  - `P` = Personas
  - `R` = Regional
  - `T` = Turismo

**Integración:**
```typescript
// En empresa-detail.component.ts
import { CodigoEmpresaInfoComponent } from '../shared/codigo-empresa-info.component';

// En imports del componente
imports: [
  // ... otros imports
  CodigoEmpresaInfoComponent
]

// En el template, dentro del tab "Información General"
<app-codigo-empresa-info 
  [codigoEmpresa]="signal(empresa?.codigoEmpresa || '')">
</app-codigo-empresa-info>
```

**Características Visuales:**
- Card con gradiente de fondo
- Código dividido visualmente (número | letras)
- Chips de colores para cada tipo de empresa
- Información del formato con ejemplos
- Estado "sin código" cuando no hay código asignado


### 2. EmpresaSelectorComponent (Mejora)

**Propósito:** Selector de empresas con búsqueda y autocompletado

**Ubicación de Integración:** `crear-resolucion.component.ts`

**Props de Entrada:**
```typescript
@Input() label: string = 'Empresa'
@Input() placeholder: string = 'Buscar empresa por RUC o razón social'
@Input() hint: string = 'Selecciona una empresa'
@Input() required: boolean = false
@Input() empresaId: string = ''
@Input() disabled: boolean = false
```

**Props de Salida:**
```typescript
@Output() empresaSeleccionada = new EventEmitter<Empresa | null>()
@Output() empresaIdChange = new EventEmitter<string>()
```

**Funcionalidad de Búsqueda:**
- Búsqueda por RUC (completo o parcial)
- Búsqueda por razón social (principal o mínimo)
- Búsqueda por código de empresa
- Filtrado en tiempo real mientras se escribe
- Autocompletado con Material Autocomplete

**Integración en CrearResolucionComponent:**
```typescript
// Reemplazar el mat-select actual por:
<app-empresa-selector
  [label]="'EMPRESA'"
  [placeholder]="'Buscar por RUC, razón social o código'"
  [hint]="'Seleccione la empresa para la cual se creará la resolución'"
  [required]="true"
  [empresaId]="resolucionForm.get('empresaId')?.value"
  (empresaSeleccionada)="onEmpresaSeleccionadaBuscador($event)"
  (empresaIdChange)="resolucionForm.patchValue({ empresaId: $event })">
</app-empresa-selector>
```

**Mejoras Visuales:**
- Icono de empresa en el campo
- Opciones con formato: RUC en negrita + razón social
- Mensaje cuando no hay resultados
- Indicador de campo requerido

### 3. IconService

**Propósito:** Gestionar iconos con fallbacks automáticos cuando Material Icons no se carga

**Características:**
- Detección automática de Material Icons
- Mapeo de 80+ iconos comunes con emojis de fallback
- Signal reactivo para estado de carga
- Métodos para agregar/remover fallbacks personalizados

**API Principal:**
```typescript
class IconService {
  // Signals
  readonly materialIconsLoaded: Signal<boolean>
  
  // Métodos principales
  getIcon(iconName: string): string
  getIconText(iconName: string): string
  getIconInfo(iconName: string): IconFallback | null
  hasFallback(iconName: string): boolean
  
  // Gestión de fallbacks
  addFallback(iconName: string, fallback: IconFallback): void
  removeFallback(iconName: string): boolean
  getAllFallbacks(): IconFallback[]
  
  // Utilidades
  forceReload(): void
  getIconStatus(): { loaded: boolean; fallbackMode: boolean; totalFallbacks: number }
}
```

**Integración Global:**
```typescript
// En app.config.ts, agregar como provider
providers: [
  // ... otros providers
  IconService
]
```

**Uso en Componentes:**
```typescript
// Inyectar el servicio
private iconService = inject(IconService);

// Verificar estado
if (this.iconService.materialIconsLoaded()) {
  // Material Icons disponibles
} else {
  // Usar fallbacks
}
```


### 4. SmartIconComponent

**Propósito:** Componente de icono inteligente que usa IconService automáticamente

**Props de Entrada:**
```typescript
@Input() iconName: string = ''
@Input() size: number = 24
@Input() tooltipText: string = ''
@Input() clickable: boolean = false
@Input() disabled: boolean = false
```

**Características:**
- Usa Material Icons si están disponibles
- Fallback automático a emojis si no están disponibles
- Tooltip automático con descripción del icono
- Efectos hover para iconos clickables
- Estado disabled con opacidad reducida
- Tamaños predefinidos: small (18px), normal (24px), large (32px), xl (48px)

**Integración en Componentes:**
```typescript
// Importar en el componente
import { SmartIconComponent } from '../../shared/smart-icon.component';

// Agregar a imports
imports: [
  // ... otros imports
  SmartIconComponent
]

// Usar en template
<app-smart-icon 
  [iconName]="'business'"
  [size]="32"
  [tooltipText]="'Información de empresa'"
  [clickable]="true">
</app-smart-icon>
```

**Casos de Uso:**
- Reemplazar `<mat-icon>` en componentes críticos
- Iconos en botones de acción
- Iconos en headers de cards
- Iconos en menús de navegación

### 5. FlujoTrabajoService

**Propósito:** Servicio completo para gestión de flujos de trabajo de expedientes

**Estado:** Preparado para uso futuro, no se integrará activamente en esta fase

**Características:**
- Gestión de flujos de trabajo
- Movimientos de expedientes entre oficinas
- Estados de flujo con historial
- Notificaciones automáticas
- Reportes y métricas
- Validaciones de flujo

**API Principal:**
```typescript
class FlujoTrabajoService {
  // Flujos de Trabajo
  getFlujos(filtros?: FlujoFiltros): Observable<FlujoTrabajo[]>
  getFlujoById(id: string): Observable<FlujoTrabajo>
  crearFlujo(flujo: Omit<FlujoTrabajo, 'id' | 'fechaCreacion'>): Observable<FlujoTrabajo>
  actualizarFlujo(id: string, flujo: Partial<FlujoTrabajo>): Observable<FlujoTrabajo>
  
  // Movimientos
  moverExpediente(movimiento: MovimientoExpediente): Observable<MovimientoExpediente>
  getMovimientos(expedienteId?: string): Observable<MovimientoExpediente[]>
  
  // Estados
  getEstadoFlujo(expedienteId: string): Observable<EstadoFlujo>
  actualizarEstado(expedienteId: string, estado: Partial<EstadoFlujo>): Observable<EstadoFlujo>
  
  // Reportes
  getReporteFlujo(flujoId: string, fechaDesde: Date, fechaHasta: Date): Observable<any>
  getDashboardFlujos(): Observable<any>
  
  // Utilidades
  calcularTiempoEstimado(flujo: FlujoTrabajo): number
  obtenerOficinaSiguiente(flujo: FlujoTrabajo, oficinaActualId: string): OficinaFlujo | null
  esUltimaOficina(flujo: FlujoTrabajo, oficinaId: string): boolean
}
```

**Preparación para Integración Futura:**
- Servicio ya está en `providedIn: 'root'`
- Listo para inyectar en componentes de expedientes
- Estructura de datos completa y documentada
- Métodos HTTP configurados con environment.apiUrl


### 6. shared/index.ts

**Propósito:** Archivo de exportación centralizado para componentes compartidos

**Contenido Actual:**
```typescript
export * from './ruta-form-shared.component';
export * from './mat-confirm-dialog.component';
export * from './smart-icon.component';
export * from './empresa-selector.component';
export * from './resolucion-number-validator.component';
export * from './expediente-number-validator.component';
export * from '../components/vehiculos/vehiculos-resolucion-modal.component';
export * from '../services/vehiculo-modal.service';
```

**Mejoras:**
- Agregar CodigoEmpresaInfoComponent a las exportaciones
- Verificar que todos los componentes exportados existan
- Documentar el propósito de cada exportación

**Uso:**
```typescript
// En lugar de múltiples imports
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { EmpresaSelectorComponent } from '../../shared/empresa-selector.component';

// Usar un solo import
import { SmartIconComponent, EmpresaSelectorComponent } from '../../shared';
```

## Data Models

### IconFallback

```typescript
interface IconFallback {
  name: string;           // Nombre del icono de Material Icons
  unicode: string;        // Código unicode del icono
  fallback: string;       // Emoji de fallback
  description: string;    // Descripción del icono
}
```

### FlujoTrabajo

```typescript
interface FlujoTrabajo {
  id: string;
  nombre: string;
  descripcion: string;
  tipoTramite: string;
  oficinas: OficinaFlujo[];
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  version: string;
  creadoPor: string;
  modificadoPor?: string;
}
```

### OficinaFlujo

```typescript
interface OficinaFlujo {
  id: string;
  oficinaId: string;
  orden: number;
  tiempoEstimado: number;
  esObligatoria: boolean;
  puedeRechazar: boolean;
  puedeDevolver: boolean;
  documentosRequeridos: string[];
  condiciones: string[];
  responsableId?: string;
  notificaciones: NotificacionFlujo[];
}
```

### MovimientoExpediente

```typescript
interface MovimientoExpediente {
  id: string;
  expedienteId: string;
  flujoId: string;
  oficinaOrigenId?: string;
  oficinaDestinoId: string;
  fechaMovimiento: Date;
  usuarioId: string;
  usuarioNombre: string;
  motivo: string;
  observaciones?: string;
  documentosRequeridos: string[];
  documentosEntregados: string[];
  tiempoEstimado: number;
  prioridad: string;
  urgencia: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO' | 'DEVUELTO';
  fechaLimite: Date;
  fechaCompletado?: Date;
  comentarios?: string;
}
```

### EstadoFlujo

```typescript
interface EstadoFlujo {
  expedienteId: string;
  flujoId: string;
  oficinaActualId: string;
  pasoActual: number;
  totalPasos: number;
  porcentajeCompletado: number;
  tiempoTranscurrido: number;
  tiempoEstimado: number;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO' | 'PAUSADO';
  historial: HistorialPaso[];
  proximaRevision?: Date;
  recordatorios: RecordatorioFlujo[];
}
```


## Error Handling

### IconService

**Escenario:** Material Icons no se cargan

**Manejo:**
1. IconService detecta que Material Icons no están disponibles
2. Activa automáticamente modo fallback
3. Agrega clase CSS `material-icons-fallback` al body
4. SmartIconComponent usa emojis en lugar de iconos
5. Log de advertencia en consola: `⚠️ Material Icons no disponibles, usando fallbacks`

**Recuperación:**
- Usuario puede forzar recarga con `iconService.forceReload()`
- Sistema verifica automáticamente en cada carga de página

### EmpresaSelectorComponent

**Escenario:** No se encuentran empresas en la búsqueda

**Manejo:**
1. Mostrar opción "No se encontraron empresas" en el autocomplete
2. Mantener el campo habilitado para nueva búsqueda
3. No emitir evento de selección

**Escenario:** Error al cargar empresas del servicio

**Manejo:**
1. Capturar error en subscribe
2. Mostrar snackbar con mensaje de error
3. Deshabilitar el campo temporalmente
4. Ofrecer botón de reintento

### CodigoEmpresaInfoComponent

**Escenario:** Empresa sin código asignado

**Manejo:**
1. Mostrar estado "sin código" con icono de información
2. Mensaje: "No se ha asignado un código de empresa"
3. No mostrar chips de tipos de empresa
4. Mantener información del formato visible

**Escenario:** Código de empresa con formato inválido

**Manejo:**
1. Validar formato (4 dígitos + 3 letras)
2. Si es inválido, mostrar código tal cual
3. Agregar advertencia visual
4. No intentar parsear tipos de empresa

### FlujoTrabajoService

**Escenario:** Error en petición HTTP

**Manejo:**
1. Capturar error en Observable
2. Retornar Observable.throwError con mensaje descriptivo
3. Componente que consume muestra error al usuario
4. Log de error en consola con detalles

**Escenario:** Flujo de trabajo inválido

**Manejo:**
1. Usar método `validarFlujo()` antes de crear/actualizar
2. Retornar lista de errores de validación
3. Mostrar errores al usuario antes de enviar al backend
4. No permitir submit si hay errores

## Testing Strategy

### Unit Tests

#### CodigoEmpresaInfoComponent
```typescript
describe('CodigoEmpresaInfoComponent', () => {
  it('should display codigo empresa correctly', () => {
    // Arrange
    const codigo = '0123PRT';
    
    // Act
    component.codigoEmpresa.set(codigo);
    fixture.detectChanges();
    
    // Assert
    expect(component.obtenerNumero()).toBe('0123');
    expect(component.obtenerLetras()).toBe('PRT');
  });
  
  it('should show tipos de empresa chips', () => {
    // Arrange
    const codigo = '0123PRT';
    
    // Act
    component.codigoEmpresa.set(codigo);
    const tipos = component.obtenerTiposEmpresa();
    
    // Assert
    expect(tipos.length).toBe(3);
    expect(tipos[0].letra).toBe('P');
    expect(tipos[1].letra).toBe('R');
    expect(tipos[2].letra).toBe('T');
  });
  
  it('should show no-codigo state when empty', () => {
    // Arrange & Act
    component.codigoEmpresa.set('');
    fixture.detectChanges();
    
    // Assert
    const noCodigoElement = fixture.nativeElement.querySelector('.no-codigo');
    expect(noCodigoElement).toBeTruthy();
  });
});
```

#### IconService
```typescript
describe('IconService', () => {
  it('should detect Material Icons availability', () => {
    // Act
    service.checkMaterialIcons();
    
    // Assert
    expect(service.materialIconsLoaded()).toBeDefined();
  });
  
  it('should return fallback when Material Icons not loaded', () => {
    // Arrange
    service['_materialIconsLoaded'].set(false);
    
    // Act
    const icon = service.getIcon('home');
    
    // Assert
    expect(icon).toBe('🏠');
  });
  
  it('should return icon name when Material Icons loaded', () => {
    // Arrange
    service['_materialIconsLoaded'].set(true);
    
    // Act
    const icon = service.getIcon('home');
    
    // Assert
    expect(icon).toBe('home');
  });
});
```


#### SmartIconComponent
```typescript
describe('SmartIconComponent', () => {
  it('should use IconService to get icon content', () => {
    // Arrange
    component.iconName = 'home';
    
    // Act
    const content = component.iconContent();
    
    // Assert
    expect(content).toBeDefined();
  });
  
  it('should apply clickable class when clickable is true', () => {
    // Arrange
    component.clickable = true;
    
    // Act
    const classes = component.iconClass();
    
    // Assert
    expect(classes).toContain('clickable');
  });
  
  it('should apply disabled class when disabled is true', () => {
    // Arrange
    component.disabled = true;
    
    // Act
    const classes = component.iconClass();
    
    // Assert
    expect(classes).toContain('disabled');
  });
});
```

#### EmpresaSelectorComponent
```typescript
describe('EmpresaSelectorComponent', () => {
  it('should filter empresas by RUC', () => {
    // Arrange
    const empresas = [
      { id: '1', ruc: '20123456789', razonSocial: { principal: 'Empresa A' } },
      { id: '2', ruc: '20987654321', razonSocial: { principal: 'Empresa B' } }
    ];
    component.empresas.set(empresas);
    
    // Act
    const filtered = component['_filter']('20123');
    
    // Assert
    expect(filtered.length).toBe(1);
    expect(filtered[0].ruc).toBe('20123456789');
  });
  
  it('should filter empresas by razon social', () => {
    // Arrange
    const empresas = [
      { id: '1', ruc: '20123456789', razonSocial: { principal: 'Transportes ABC' } },
      { id: '2', ruc: '20987654321', razonSocial: { principal: 'Empresa XYZ' } }
    ];
    component.empresas.set(empresas);
    
    // Act
    const filtered = component['_filter']('ABC');
    
    // Assert
    expect(filtered.length).toBe(1);
    expect(filtered[0].razonSocial.principal).toBe('Transportes ABC');
  });
  
  it('should emit empresaSeleccionada when option selected', () => {
    // Arrange
    spyOn(component.empresaSeleccionada, 'emit');
    const empresa = { id: '1', ruc: '20123456789', razonSocial: { principal: 'Empresa A' } };
    component.empresas.set([empresa]);
    
    // Act
    component.onEmpresaSeleccionada({ option: { value: '1' } });
    
    // Assert
    expect(component.empresaSeleccionada.emit).toHaveBeenCalledWith(empresa);
  });
});
```

### Integration Tests

#### EmpresaDetailComponent con CodigoEmpresaInfoComponent
```typescript
describe('EmpresaDetailComponent Integration', () => {
  it('should display CodigoEmpresaInfoComponent with empresa codigo', () => {
    // Arrange
    const empresa = {
      id: '1',
      ruc: '20123456789',
      razonSocial: { principal: 'Empresa Test' },
      codigoEmpresa: '0123PRT'
    };
    
    // Act
    component.empresa = empresa;
    fixture.detectChanges();
    
    // Assert
    const codigoComponent = fixture.debugElement.query(By.directive(CodigoEmpresaInfoComponent));
    expect(codigoComponent).toBeTruthy();
    expect(codigoComponent.componentInstance.codigoEmpresa()).toBe('0123PRT');
  });
});
```

#### CrearResolucionComponent con EmpresaSelectorComponent
```typescript
describe('CrearResolucionComponent Integration', () => {
  it('should update form when empresa is selected', () => {
    // Arrange
    const empresa = {
      id: '1',
      ruc: '20123456789',
      razonSocial: { principal: 'Empresa Test' }
    };
    
    // Act
    const selectorComponent = fixture.debugElement.query(By.directive(EmpresaSelectorComponent));
    selectorComponent.componentInstance.empresaSeleccionada.emit(empresa);
    fixture.detectChanges();
    
    // Assert
    expect(component.resolucionForm.get('empresaId')?.value).toBe('1');
    expect(component.empresaSeleccionada()).toEqual(empresa);
  });
});
```

### E2E Tests

#### Flujo Completo de Creación de Resolución
```typescript
describe('Crear Resolución E2E', () => {
  it('should create resolucion with empresa selector', () => {
    // 1. Navegar a crear resolución
    cy.visit('/resoluciones/nuevo');
    
    // 2. Buscar empresa
    cy.get('app-empresa-selector input').type('20123456789');
    
    // 3. Seleccionar empresa del autocomplete
    cy.get('mat-option').contains('20123456789').click();
    
    // 4. Verificar que se seleccionó
    cy.get('.empresa-details').should('contain', '20123456789');
    
    // 5. Completar resto del formulario
    cy.get('input[formControlName="numeroBase"]').type('0001');
    cy.get('textarea[formControlName="descripcion"]').type('Resolución de prueba');
    
    // 6. Enviar formulario
    cy.get('button[type="submit"]').click();
    
    // 7. Verificar éxito
    cy.get('.mat-snack-bar-container').should('contain', 'Resolución creada exitosamente');
  });
});
```

### Manual Testing Checklist

- [ ] Verificar que CodigoEmpresaInfoComponent se muestra en empresa-detail
- [ ] Verificar que los chips de tipos de empresa tienen colores correctos
- [ ] Verificar que el buscador de empresas filtra correctamente por RUC
- [ ] Verificar que el buscador de empresas filtra correctamente por razón social
- [ ] Verificar que SmartIconComponent muestra Material Icons cuando están disponibles
- [ ] Verificar que SmartIconComponent muestra emojis cuando Material Icons no están disponibles
- [ ] Verificar que no aparecen warnings de TypeScript al compilar
- [ ] Verificar que el formulario de resolución funciona con el nuevo selector
- [ ] Verificar que los tooltips de SmartIconComponent funcionan correctamente
- [ ] Verificar que FlujoTrabajoService está disponible para inyección


## Performance Considerations

### IconService

**Optimizaciones:**
- Verificación de Material Icons solo una vez al inicializar
- Uso de Map para búsqueda O(1) de fallbacks
- Signal reactivo para evitar re-renders innecesarios
- Lazy loading de iconos no utilizados

**Impacto:**
- Overhead mínimo: ~1-2ms en inicialización
- Memoria: ~50KB para mapeo de 80+ iconos
- Sin impacto en runtime después de inicialización

### EmpresaSelectorComponent

**Optimizaciones:**
- Filtrado con RxJS operators (startWith, map)
- Debounce implícito de Material Autocomplete
- ChangeDetection OnPush para mejor rendimiento
- Signal para lista de empresas

**Impacto:**
- Filtrado: O(n) donde n = número de empresas
- Con 1000 empresas: ~5-10ms por búsqueda
- Memoria: Proporcional al número de empresas cargadas

**Mejora Futura:**
- Implementar búsqueda en backend para >1000 empresas
- Paginación de resultados
- Cache de búsquedas recientes

### CodigoEmpresaInfoComponent

**Optimizaciones:**
- Computed properties para parseo de código
- Renderizado condicional con @if
- Sin watchers innecesarios
- Estilos CSS optimizados

**Impacto:**
- Overhead mínimo: <1ms
- Memoria: ~10KB por instancia
- Sin impacto en performance general

### FlujoTrabajoService

**Optimizaciones:**
- BehaviorSubjects para estado reactivo
- Métodos de utilidad sin side effects
- HTTP requests con observables
- Cache local opcional (no implementado aún)

**Impacto:**
- Overhead: Mínimo hasta que se use activamente
- Memoria: ~20KB para el servicio
- HTTP requests: Según uso real

**Mejora Futura:**
- Implementar cache con TTL
- Implementar retry logic para requests fallidos
- Implementar optimistic updates

## Security Considerations

### EmpresaSelectorComponent

**Riesgos:**
- XSS en razón social de empresa
- Inyección de código en búsqueda

**Mitigaciones:**
- Angular sanitiza automáticamente el HTML
- Usar binding de propiedades en lugar de innerHTML
- Validar entrada en backend

### FlujoTrabajoService

**Riesgos:**
- Acceso no autorizado a flujos de trabajo
- Modificación de estados sin permisos
- Exposición de datos sensibles

**Mitigaciones:**
- AuthInterceptor agrega JWT a todas las requests
- Backend valida permisos en cada endpoint
- No almacenar datos sensibles en localStorage
- Usar HTTPS para todas las comunicaciones

### IconService

**Riesgos:**
- Inyección de código en fallbacks personalizados
- XSS a través de iconos maliciosos

**Mitigaciones:**
- Validar formato de fallbacks antes de agregar
- No permitir HTML en fallbacks, solo texto/emojis
- Sanitizar cualquier entrada de usuario

## Deployment Strategy

### Fase 1: Preparación (Día 1)
1. Actualizar shared/index.ts con nuevas exportaciones
2. Agregar IconService a app.config.ts providers
3. Verificar que todos los archivos compilan sin errores
4. Ejecutar tests unitarios existentes

### Fase 2: Integración de Iconos (Día 1-2)
1. Integrar SmartIconComponent en componentes principales
2. Reemplazar mat-icon críticos con app-smart-icon
3. Verificar fallbacks en navegadores sin Material Icons
4. Ejecutar tests de integración

### Fase 3: Integración de CodigoEmpresaInfo (Día 2)
1. Agregar CodigoEmpresaInfoComponent a empresa-detail
2. Verificar visualización correcta de códigos
3. Probar con diferentes formatos de código
4. Ejecutar tests E2E

### Fase 4: Mejora de EmpresaSelector (Día 2-3)
1. Reemplazar mat-select con app-empresa-selector en crear-resolucion
2. Implementar lógica de búsqueda y filtrado
3. Conectar eventos con formulario reactivo
4. Probar flujo completo de creación de resolución
5. Ejecutar tests E2E

### Fase 5: Preparación de FlujoTrabajo (Día 3)
1. Verificar que FlujoTrabajoService está disponible
2. Documentar API del servicio
3. Crear ejemplos de uso para futura integración
4. No integrar activamente (preparación para futuro)

### Fase 6: Verificación Final (Día 3)
1. Ejecutar ng build --configuration production
2. Verificar que no hay warnings de archivos no utilizados
3. Verificar que no hay errores de compilación
4. Ejecutar suite completa de tests
5. Verificar bundle size no aumentó significativamente
6. Realizar pruebas manuales de todos los flujos

### Rollback Plan

Si hay problemas críticos:
1. Revertir commits de integración
2. Restaurar versión anterior de archivos modificados
3. Ejecutar ng build para verificar
4. Notificar al equipo del rollback

### Monitoring Post-Deployment

- Monitorear errores en consola del navegador
- Verificar que Material Icons se cargan correctamente
- Monitorear performance de búsqueda de empresas
- Recopilar feedback de usuarios sobre nueva UI
- Verificar que no hay regresiones en funcionalidad existente

