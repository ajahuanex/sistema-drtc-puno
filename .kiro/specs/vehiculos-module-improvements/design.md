# Design Document

## Overview

Este documento describe el diseño técnico para mejorar el módulo de vehículos del sistema DRTC Puno. El objetivo es modernizar la interfaz, mejorar la experiencia de usuario, implementar búsquedas avanzadas y crear un sistema más eficiente para la gestión de la flota vehicular.

### Componentes del Módulo de Vehículos

1. **VehiculosComponent** - Vista principal con lista y filtros
2. **VehiculoFormComponent** - Formulario de crear/editar vehículo
3. **VehiculoDetailComponent** - Vista detallada de vehículo
4. **VehiculoModalComponent** - Modal para crear/editar vehículo
5. **TransferirVehiculoModalComponent** - Modal para transferencias
6. **SolicitarBajaVehiculoModalComponent** - Modal para solicitar bajas
7. **CargaMasivaVehiculosComponent** - Carga masiva desde Excel

### Objetivos del Diseño

- Integrar SmartIconComponent en todos los componentes
- Implementar selectores avanzados con búsqueda
- Mejorar filtros y búsqueda global
- Crear dashboard de estadísticas visual
- Optimizar formularios con validaciones inteligentes
- Implementar sistema de notificaciones
- Mejorar responsive design y accesibilidad

## Architecture

### Diagrama de Componentes Mejorados

```
┌─────────────────────────────────────────────────────────────┐
│                    MÓDULO DE VEHÍCULOS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  VehiculosComp   │◄────►│ VehiculoService  │            │
│  │  (Vista Principal)│      │                  │            │
│  └────────┬─────────┘      └──────────────────┘            │
│           │                                                  │
│           │ usa                                              │
│           ▼                                                  │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ SmartIconComp    │      │ EmpresaSelector  │            │
│  │ (Iconos)         │      │ (Búsqueda Avanz) │            │
│  └──────────────────┘      └──────────────────┘            │
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ VehiculoForm     │◄────►│ ResolucionSelect │            │
│  │ (Formularios)    │      │ (Búsqueda Avanz) │            │
│  └──────────────────┘      └──────────────────┘            │
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ VehiculoDetail   │◄────►│ NotificationSvc  │            │
│  │ (Detalles)       │      │ (Notificaciones) │            │
│  └──────────────────┘      └──────────────────┘            │
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ Modales Varios   │◄────►│ ValidationSvc    │            │
│  │ (Transfer, Baja) │      │ (Validaciones)   │            │
│  └──────────────────┘      └──────────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos Mejorado

1. **Carga Inicial**
   - VehiculosComponent carga lista de vehículos
   - Dashboard calcula estadísticas en tiempo real
   - SmartIconComponent verifica Material Icons

2. **Búsqueda y Filtros**
   - Usuario escribe en búsqueda global
   - Sistema busca en múltiples campos
   - Filtros avanzados se combinan con búsqueda
   - Resultados se actualizan en tiempo real

3. **Gestión de Vehículos**
   - Formularios usan selectores mejorados
   - Validaciones se ejecutan en tiempo real
   - Notificaciones se envían automáticamente
   - Historial se registra para auditoría

## Components and Interfaces

### 1. VehiculosComponent Mejorado

**Propósito:** Vista principal con dashboard, filtros avanzados y tabla mejorada

**Nuevas Funcionalidades:**
- Dashboard de estadísticas visual
- Búsqueda global inteligente
- Filtros avanzados con chips
- Tabla con acciones rápidas
- SmartIconComponent integrado

**Estructura del Dashboard:**
```typescript
interface VehiculoStats {
  total: number;
  activos: number;
  suspendidos: number;
  enRevision: number;
  empresasConVehiculos: number;
  tendencias: {
    totalChange: number;
    activosChange: number;
    suspendidosChange: number;
  };
}
```

**Integración de SmartIconComponent:**
```typescript
// Reemplazar todos los mat-icon
<mat-icon>directions_car</mat-icon>
// Por:
<app-smart-icon [iconName]="'directions_car'" [size]="24"></app-smart-icon>
```

**Búsqueda Global Mejorada:**
```typescript
interface BusquedaGlobal {
  termino: string;
  campos: ('placa' | 'marca' | 'modelo' | 'empresa' | 'resolucion')[];
  sugerencias: BusquedaSugerencia[];
}

interface BusquedaSugerencia {
  tipo: 'vehiculo' | 'empresa' | 'resolucion';
  texto: string;
  valor: string;
  icono: string;
}
```
### 2. Selectores Avanzados

**EmpresaSelectorComponent Integrado:**
```typescript
// En VehiculoFormComponent
<app-empresa-selector
  [label]="'Empresa Propietaria'"
  [placeholder]="'Buscar por RUC, razón social o código'"
  [hint]="'Seleccione la empresa propietaria del vehículo'"
  [required]="true"
  [empresaId]="vehiculoForm.get('empresaId')?.value"
  (empresaSeleccionada)="onEmpresaSeleccionada($event)"
  (empresaIdChange)="vehiculoForm.patchValue({ empresaId: $event })">
</app-empresa-selector>
```

**ResolucionSelectorComponent (Nuevo):**
```typescript
@Component({
  selector: 'app-resolucion-selector',
  template: `
    <mat-form-field appearance="outline" [class.required]="required">
      <mat-label>{{ label }}</mat-label>
      <input matInput 
             [formControl]="resolucionControl"
             [placeholder]="placeholder"
             [matAutocomplete]="auto"
             [required]="required">
      <mat-autocomplete #auto="matAutocomplete" 
                       (optionSelected)="onResolucionSeleccionada($event)">
        <mat-option *ngFor="let resolucion of filteredResoluciones | async" 
                    [value]="resolucion.id">
          <div class="resolucion-option">
            <strong>{{ resolucion.nroResolucion }}</strong>
            <span>{{ resolucion.descripcion }}</span>
            <small>{{ resolucion.fechaEmision | date:'dd/MM/yyyy' }}</small>
          </div>
        </mat-option>
      </mat-autocomplete>
      <app-smart-icon [iconName]="'description'" matSuffix></app-smart-icon>
    </mat-form-field>
  `
})
export class ResolucionSelectorComponent {
  @Input() label: string = 'Resolución';
  @Input() placeholder: string = 'Buscar por número o descripción';
  @Input() required: boolean = false;
  @Input() empresaId: string = '';
  
  @Output() resolucionSeleccionada = new EventEmitter<Resolucion | null>();
  @Output() resolucionIdChange = new EventEmitter<string>();
  
  // Filtrar resoluciones por empresa y término de búsqueda
  private _filter(value: string): Resolucion[] {
    const filterValue = value.toLowerCase();
    return this.resoluciones().filter(resolucion => 
      resolucion.nroResolucion.toLowerCase().includes(filterValue) ||
      resolucion.descripcion.toLowerCase().includes(filterValue)
    );
  }
}
```

### 3. Dashboard de Estadísticas Visual

**Componente de Estadísticas:**
```typescript
@Component({
  selector: 'app-vehiculos-dashboard',
  template: `
    <div class="stats-grid">
      <div class="stat-card" 
           *ngFor="let stat of estadisticas()" 
           [class]="stat.tipo"
           (click)="filtrarPorEstadistica(stat)">
        <div class="stat-icon">
          <app-smart-icon 
            [iconName]="stat.icono" 
            [size]="32"
            [clickable]="true">
          </app-smart-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value" 
               [countUp]="stat.valor">{{ stat.valor }}</div>
          <div class="stat-label">{{ stat.etiqueta }}</div>
          <div class="stat-trend" [class]="stat.tendencia.tipo">
            <app-smart-icon 
              [iconName]="stat.tendencia.icono" 
              [size]="16">
            </app-smart-icon>
            <span>{{ stat.tendencia.texto }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Gráfico de distribución -->
    <div class="chart-container">
      <canvas #chartCanvas></canvas>
    </div>
  `
})
export class VehiculosDashboardComponent {
  estadisticas = computed(() => [
    {
      tipo: 'total',
      icono: 'directions_car',
      valor: this.vehiculos().length,
      etiqueta: 'TOTAL VEHÍCULOS',
      tendencia: {
        tipo: 'positive',
        icono: 'trending_up',
        texto: `+${this.getVehiculosNuevos()} este mes`
      }
    },
    {
      tipo: 'activos',
      icono: 'check_circle',
      valor: this.getVehiculosActivos(),
      etiqueta: 'ACTIVOS',
      tendencia: {
        tipo: 'positive',
        icono: 'trending_up',
        texto: `${this.getPorcentajeActivos()}% del total`
      }
    },
    // ... más estadísticas
  ]);
}
```

### 4. Filtros Avanzados con Chips

**Componente de Filtros:**
```typescript
@Component({
  selector: 'app-vehiculos-filtros',
  template: `
    <mat-card class="filtros-card">
      <mat-card-header>
        <mat-card-title>
          <app-smart-icon [iconName]="'filter_list'" [size]="24"></app-smart-icon>
          Filtros Avanzados
        </mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <div class="filtros-grid">
          <!-- Filtro por placa -->
          <mat-form-field appearance="outline">
            <mat-label>Placa</mat-label>
            <input matInput [formControl]="placaControl" placeholder="ABC-123">
            <app-smart-icon [iconName]="'directions_car'" matSuffix></app-smart-icon>
          </mat-form-field>
          
          <!-- Filtro por empresa con selector mejorado -->
          <app-empresa-selector
            [label]="'Empresa'"
            [placeholder]="'Buscar empresa'"
            [empresaId]="filtros().empresaId"
            (empresaSeleccionada)="onFiltroEmpresa($event)">
          </app-empresa-selector>
          
          <!-- Filtro por resolución con selector mejorado -->
          <app-resolucion-selector
            [label]="'Resolución'"
            [placeholder]="'Buscar resolución'"
            [empresaId]="filtros().empresaId"
            [resolucionId]="filtros().resolucionId"
            (resolucionSeleccionada)="onFiltroResolucion($event)">
          </app-resolucion-selector>
          
          <!-- Filtro por estado -->
          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <mat-select [formControl]="estadoControl" multiple>
              <mat-option value="ACTIVO">Activo</mat-option>
              <mat-option value="SUSPENDIDO">Suspendido</mat-option>
              <mat-option value="EN_REVISION">En Revisión</mat-option>
            </mat-select>
            <app-smart-icon [iconName]="'info'" matSuffix></app-smart-icon>
          </mat-form-field>
        </div>
        
        <!-- Chips de filtros activos -->
        <div class="filtros-chips" *ngIf="tienesFiltrosActivos()">
          <mat-chip-set>
            <mat-chip *ngIf="filtros().placa" 
                     (removed)="limpiarFiltro('placa')">
              Placa: {{ filtros().placa }}
              <app-smart-icon [iconName]="'cancel'" matChipRemove></app-smart-icon>
            </mat-chip>
            
            <mat-chip *ngIf="filtros().empresa" 
                     (removed)="limpiarFiltro('empresa')">
              Empresa: {{ filtros().empresa.razonSocial.principal }}
              <app-smart-icon [iconName]="'cancel'" matChipRemove></app-smart-icon>
            </mat-chip>
            
            <!-- Más chips para otros filtros -->
          </mat-chip-set>
        </div>
        
        <!-- Acciones de filtros -->
        <div class="filtros-acciones">
          <button mat-raised-button color="primary" (click)="aplicarFiltros()">
            <app-smart-icon [iconName]="'search'" [size]="20"></app-smart-icon>
            Filtrar
          </button>
          <button mat-button color="warn" (click)="limpiarTodosFiltros()">
            <app-smart-icon [iconName]="'clear'" [size]="20"></app-smart-icon>
            Limpiar Todo
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class VehiculosFiltrosComponent {
  filtros = signal<VehiculoFiltros>({});
  
  interface VehiculoFiltros {
    placa?: string;
    empresaId?: string;
    empresa?: Empresa;
    resolucionId?: string;
    resolucion?: Resolucion;
    estados?: string[];
    fechaDesde?: Date;
    fechaHasta?: Date;
  }
}
```

### 5. Tabla Mejorada con Acciones Rápidas

**Tabla de Vehículos:**
```typescript
@Component({
  selector: 'app-vehiculos-tabla',
  template: `
    <div class="tabla-container">
      <mat-table [dataSource]="vehiculosFiltrados()" 
                 matSort 
                 class="vehiculos-table">
        
        <!-- Columna de selección -->
        <ng-container matColumnDef="select">
          <mat-header-cell *matHeaderCellDef>
            <mat-checkbox (change)="$event ? masterToggle() : null"
                         [checked]="selection.hasValue() && isAllSelected()"
                         [indeterminate]="selection.hasValue() && !isAllSelected()">
            </mat-checkbox>
          </mat-header-cell>
          <mat-cell *matCellDef="let vehiculo">
            <mat-checkbox (click)="$event.stopPropagation()"
                         (change)="$event ? selection.toggle(vehiculo) : null"
                         [checked]="selection.isSelected(vehiculo)">
            </mat-checkbox>
          </mat-cell>
        </ng-container>
        
        <!-- Columna de placa -->
        <ng-container matColumnDef="placa">
          <mat-header-cell *matHeaderCellDef mat-sort-header>
            <app-smart-icon [iconName]="'directions_car'" [size]="20"></app-smart-icon>
            Placa
          </mat-header-cell>
          <mat-cell *matCellDef="let vehiculo">
            <div class="placa-cell">
              <strong>{{ vehiculo.placa }}</strong>
              <small>{{ vehiculo.marca }} {{ vehiculo.modelo }}</small>
            </div>
          </mat-cell>
        </ng-container>
        
        <!-- Columna de empresa -->
        <ng-container matColumnDef="empresa">
          <mat-header-cell *matHeaderCellDef mat-sort-header>
            <app-smart-icon [iconName]="'business'" [size]="20"></app-smart-icon>
            Empresa
          </mat-header-cell>
          <mat-cell *matCellDef="let vehiculo">
            <div class="empresa-cell">
              <strong>{{ vehiculo.empresa?.razonSocial?.principal }}</strong>
              <small>RUC: {{ vehiculo.empresa?.ruc }}</small>
            </div>
          </mat-cell>
        </ng-container>
        
        <!-- Columna de estado -->
        <ng-container matColumnDef="estado">
          <mat-header-cell *matHeaderCellDef mat-sort-header>
            <app-smart-icon [iconName]="'info'" [size]="20"></app-smart-icon>
            Estado
          </mat-header-cell>
          <mat-cell *matCellDef="let vehiculo">
            <mat-chip [class]="'estado-' + vehiculo.estado.toLowerCase()">
              <app-smart-icon 
                [iconName]="getEstadoIcon(vehiculo.estado)" 
                [size]="16">
              </app-smart-icon>
              {{ vehiculo.estado }}
            </mat-chip>
          </mat-cell>
        </ng-container>
        
        <!-- Columna de acciones -->
        <ng-container matColumnDef="acciones">
          <mat-header-cell *matHeaderCellDef>Acciones</mat-header-cell>
          <mat-cell *matCellDef="let vehiculo">
            <button mat-icon-button [matMenuTriggerFor]="menu">
              <app-smart-icon [iconName]="'more_vert'" [size]="20"></app-smart-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="verDetalle(vehiculo)">
                <app-smart-icon [iconName]="'visibility'" [size]="20"></app-smart-icon>
                Ver Detalle
              </button>
              <button mat-menu-item (click)="editarVehiculo(vehiculo)">
                <app-smart-icon [iconName]="'edit'" [size]="20"></app-smart-icon>
                Editar
              </button>
              <button mat-menu-item (click)="transferirVehiculo(vehiculo)">
                <app-smart-icon [iconName]="'swap_horiz'" [size]="20"></app-smart-icon>
                Transferir
              </button>
              <button mat-menu-item (click)="solicitarBaja(vehiculo)">
                <app-smart-icon [iconName]="'remove_circle'" [size]="20"></app-smart-icon>
                Solicitar Baja
              </button>
            </mat-menu>
          </mat-cell>
        </ng-container>
        
        <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: displayedColumns;"
                 (click)="verDetalle(row)"
                 class="vehiculo-row">
        </mat-row>
      </mat-table>
      
      <!-- Paginación -->
      <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]"
                     [pageSize]="25"
                     showFirstLastButtons>
      </mat-paginator>
    </div>
    
    <!-- Acciones en lote -->
    <div class="acciones-lote" *ngIf="selection.hasValue()">
      <mat-card>
        <mat-card-content>
          <span>{{ selection.selected.length }} vehículo(s) seleccionado(s)</span>
          <div class="acciones-lote-botones">
            <button mat-raised-button color="accent" (click)="transferirLote()">
              <app-smart-icon [iconName]="'swap_horiz'" [size]="20"></app-smart-icon>
              Transferir Seleccionados
            </button>
            <button mat-raised-button color="warn" (click)="solicitarBajaLote()">
              <app-smart-icon [iconName]="'remove_circle'" [size]="20"></app-smart-icon>
              Solicitar Baja Seleccionados
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class VehiculosTablaComponent {
  displayedColumns = ['select', 'placa', 'empresa', 'estado', 'acciones'];
  selection = new SelectionModel<Vehiculo>(true, []);
  
  getEstadoIcon(estado: string): string {
    const iconMap = {
      'ACTIVO': 'check_circle',
      'SUSPENDIDO': 'warning',
      'EN_REVISION': 'schedule',
      'INACTIVO': 'cancel'
    };
    return iconMap[estado] || 'info';
  }
}
```
### 6. Formularios Mejorados con Validaciones

**VehiculoFormComponent Mejorado:**
```typescript
@Component({
  selector: 'app-vehiculo-form-mejorado',
  template: `
    <form [formGroup]="vehiculoForm" (ngSubmit)="onSubmit()">
      
      <!-- Sección de Empresa -->
      <mat-card class="form-section">
        <mat-card-header>
          <mat-card-title>
            <app-smart-icon [iconName]="'business'" [size]="24"></app-smart-icon>
            Información de la Empresa
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-empresa-selector
            [label]="'Empresa Propietaria'"
            [placeholder]="'Buscar por RUC, razón social o código'"
            [required]="true"
            [empresaId]="vehiculoForm.get('empresaId')?.value"
            (empresaSeleccionada)="onEmpresaSeleccionada($event)">
          </app-empresa-selector>
          
          <app-resolucion-selector
            [label]="'Resolución'"
            [placeholder]="'Buscar resolución'"
            [required]="true"
            [empresaId]="vehiculoForm.get('empresaId')?.value"
            [resolucionId]="vehiculoForm.get('resolucionId')?.value"
            (resolucionSeleccionada)="onResolucionSeleccionada($event)">
          </app-resolucion-selector>
        </mat-card-content>
      </mat-card>
      
      <!-- Sección de Datos del Vehículo -->
      <mat-card class="form-section">
        <mat-card-header>
          <mat-card-title>
            <app-smart-icon [iconName]="'directions_car'" [size]="24"></app-smart-icon>
            Datos del Vehículo
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="form-grid">
            <!-- Placa con validación -->
            <mat-form-field appearance="outline">
              <mat-label>Placa</mat-label>
              <input matInput 
                     formControlName="placa" 
                     placeholder="ABC-123"
                     (blur)="validarPlaca()"
                     [class.valid]="placaValida()"
                     [class.invalid]="placaInvalida()">
              <app-smart-icon [iconName]="'directions_car'" matSuffix></app-smart-icon>
              <mat-hint>Formato: ABC-123 o AB-1234</mat-hint>
              <mat-error *ngIf="vehiculoForm.get('placa')?.hasError('required')">
                La placa es requerida
              </mat-error>
              <mat-error *ngIf="vehiculoForm.get('placa')?.hasError('pattern')">
                Formato de placa inválido
              </mat-error>
              <mat-error *ngIf="vehiculoForm.get('placa')?.hasError('duplicate')">
                Esta placa ya está registrada
              </mat-error>
            </mat-form-field>
            
            <!-- Marca con autocompletado -->
            <mat-form-field appearance="outline">
              <mat-label>Marca</mat-label>
              <input matInput 
                     formControlName="marca"
                     [matAutocomplete]="autoMarca">
              <mat-autocomplete #autoMarca="matAutocomplete">
                <mat-option *ngFor="let marca of marcasPopulares" [value]="marca">
                  {{ marca }}
                </mat-option>
              </mat-autocomplete>
              <app-smart-icon [iconName]="'local_offer'" matSuffix></app-smart-icon>
            </mat-form-field>
            
            <!-- Modelo -->
            <mat-form-field appearance="outline">
              <mat-label>Modelo</mat-label>
              <input matInput formControlName="modelo">
              <app-smart-icon [iconName]="'directions_car'" matSuffix></app-smart-icon>
            </mat-form-field>
            
            <!-- Año con validación de rango -->
            <mat-form-field appearance="outline">
              <mat-label>Año</mat-label>
              <input matInput 
                     type="number" 
                     formControlName="anio"
                     [min]="anioMinimo"
                     [max]="anioMaximo">
              <app-smart-icon [iconName]="'calendar_today'" matSuffix></app-smart-icon>
              <mat-hint>Entre {{ anioMinimo }} y {{ anioMaximo }}</mat-hint>
              <mat-error *ngIf="vehiculoForm.get('anio')?.hasError('min')">
                Año mínimo: {{ anioMinimo }}
              </mat-error>
              <mat-error *ngIf="vehiculoForm.get('anio')?.hasError('max')">
                Año máximo: {{ anioMaximo }}
              </mat-error>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Sección de Datos Técnicos -->
      <mat-card class="form-section">
        <mat-card-header>
          <mat-card-title>
            <app-smart-icon [iconName]="'build'" [size]="24"></app-smart-icon>
            Datos Técnicos
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Capacidad de Pasajeros</mat-label>
              <input matInput 
                     type="number" 
                     formControlName="capacidadPasajeros"
                     min="1" 
                     max="100">
              <app-smart-icon [iconName]="'people'" matSuffix></app-smart-icon>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Número de Motor</mat-label>
              <input matInput formControlName="numeroMotor">
              <app-smart-icon [iconName]="'settings'" matSuffix></app-smart-icon>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Número de Chasis</mat-label>
              <input matInput formControlName="numeroChasis">
              <app-smart-icon [iconName]="'build'" matSuffix></app-smart-icon>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Acciones del formulario -->
      <div class="form-actions">
        <button mat-button type="button" (click)="cancelar()">
          <app-smart-icon [iconName]="'cancel'" [size]="20"></app-smart-icon>
          Cancelar
        </button>
        <button mat-raised-button 
                color="primary" 
                type="submit" 
                [disabled]="vehiculoForm.invalid || guardando()">
          <app-smart-icon 
            [iconName]="guardando() ? 'hourglass_empty' : 'save'" 
            [size]="20">
          </app-smart-icon>
          {{ isEditing() ? 'Actualizar' : 'Guardar' }} Vehículo
        </button>
      </div>
    </form>
  `
})
export class VehiculoFormMejoradoComponent {
  marcasPopulares = [
    'Toyota', 'Hyundai', 'Mercedes-Benz', 'Volvo', 'Scania', 
    'Iveco', 'Mitsubishi', 'Isuzu', 'Hino', 'JAC'
  ];
  
  anioMinimo = 1990;
  anioMaximo = new Date().getFullYear() + 1;
  
  // Validaciones personalizadas
  validarPlaca(): void {
    const placa = this.vehiculoForm.get('placa')?.value;
    if (placa) {
      // Validar formato peruano
      const formatoValido = /^[A-Z]{2,3}-\d{3,4}$/.test(placa);
      if (!formatoValido) {
        this.vehiculoForm.get('placa')?.setErrors({ pattern: true });
        return;
      }
      
      // Verificar duplicados
      this.vehiculoService.verificarPlacaDisponible(placa).subscribe(
        disponible => {
          if (!disponible) {
            this.vehiculoForm.get('placa')?.setErrors({ duplicate: true });
          }
        }
      );
    }
  }
  
  placaValida(): boolean {
    const placaControl = this.vehiculoForm.get('placa');
    return placaControl?.valid && placaControl?.value?.length > 0;
  }
  
  placaInvalida(): boolean {
    const placaControl = this.vehiculoForm.get('placa');
    return placaControl?.invalid && placaControl?.touched;
  }
}
```

### 7. Sistema de Notificaciones

**NotificationService para Vehículos:**
```typescript
@Injectable({
  providedIn: 'root'
})
export class VehiculoNotificationService {
  private notificationService = inject(NotificationService);
  
  // Notificación de transferencia
  notificarTransferencia(vehiculo: Vehiculo, empresaOrigen: Empresa, empresaDestino: Empresa): void {
    const mensaje = `Vehículo ${vehiculo.placa} transferido de ${empresaOrigen.razonSocial.principal} a ${empresaDestino.razonSocial.principal}`;
    
    this.notificationService.enviarNotificacion({
      tipo: 'TRANSFERENCIA_VEHICULO',
      titulo: 'Transferencia de Vehículo',
      mensaje,
      destinatarios: ['supervisores', 'administradores'],
      datos: {
        vehiculoId: vehiculo.id,
        empresaOrigenId: empresaOrigen.id,
        empresaDestinoId: empresaDestino.id
      },
      prioridad: 'MEDIA'
    });
  }
  
  // Notificación de baja solicitada
  notificarSolicitudBaja(vehiculo: Vehiculo, motivo: string): void {
    const mensaje = `Solicitud de baja para vehículo ${vehiculo.placa}. Motivo: ${motivo}`;
    
    this.notificationService.enviarNotificacion({
      tipo: 'SOLICITUD_BAJA_VEHICULO',
      titulo: 'Solicitud de Baja de Vehículo',
      mensaje,
      destinatarios: ['supervisores'],
      datos: {
        vehiculoId: vehiculo.id,
        motivo
      },
      prioridad: 'ALTA'
    });
  }
  
  // Notificación de vencimiento de documentos
  notificarVencimientoDocumentos(vehiculos: Vehiculo[]): void {
    vehiculos.forEach(vehiculo => {
      const mensaje = `Documentos del vehículo ${vehiculo.placa} vencen pronto`;
      
      this.notificationService.enviarNotificacion({
        tipo: 'VENCIMIENTO_DOCUMENTOS',
        titulo: 'Documentos por Vencer',
        mensaje,
        destinatarios: ['empresa_' + vehiculo.empresaId],
        datos: {
          vehiculoId: vehiculo.id,
          documentosVencimiento: vehiculo.documentosVencimiento
        },
        prioridad: 'ALTA'
      });
    });
  }
}
```

### 8. Responsive Design y Accesibilidad

**Breakpoints y Adaptaciones:**
```scss
// Estilos responsive para el módulo de vehículos
.vehiculos-container {
  padding: 16px;
  
  @media (min-width: 768px) {
    padding: 24px;
  }
  
  @media (min-width: 1200px) {
    padding: 32px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  
  @media (min-width: 576px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 992px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

// Tabla responsive
.vehiculos-table {
  @media (max-width: 768px) {
    .mat-column-empresa,
    .mat-column-resolucion {
      display: none;
    }
  }
}

// Accesibilidad
.stat-card {
  &:focus {
    outline: 2px solid #2196f3;
    outline-offset: 2px;
  }
  
  &[aria-pressed="true"] {
    background-color: #e3f2fd;
  }
}

// Alto contraste
@media (prefers-contrast: high) {
  .stat-card {
    border: 2px solid #000;
  }
  
  .estado-activo {
    background-color: #000;
    color: #fff;
  }
}

// Reducir movimiento
@media (prefers-reduced-motion: reduce) {
  .stat-value[countUp] {
    animation: none;
  }
  
  .chart-container canvas {
    animation: none;
  }
}
```

**Atributos ARIA:**
```html
<!-- Dashboard con ARIA -->
<div class="stats-grid" role="region" aria-label="Estadísticas de vehículos">
  <div class="stat-card" 
       role="button" 
       tabindex="0"
       [attr.aria-pressed]="filtroActivo === 'total'"
       aria-label="Total de vehículos: {{ estadisticas().total }}">
    <!-- Contenido -->
  </div>
</div>

<!-- Tabla con ARIA -->
<mat-table role="table" aria-label="Lista de vehículos">
  <mat-header-row role="row"></mat-header-row>
  <mat-row role="row" 
           [attr.aria-label]="'Vehículo ' + vehiculo.placa + ', empresa ' + vehiculo.empresa?.razonSocial?.principal">
  </mat-row>
</mat-table>

<!-- Formulario con ARIA -->
<form [formGroup]="vehiculoForm" 
      role="form" 
      aria-label="Formulario de vehículo">
  <mat-form-field>
    <mat-label>Placa</mat-label>
    <input matInput 
           formControlName="placa"
           aria-describedby="placa-hint placa-error"
           [attr.aria-invalid]="vehiculoForm.get('placa')?.invalid">
    <mat-hint id="placa-hint">Formato: ABC-123 o AB-1234</mat-hint>
    <mat-error id="placa-error">Formato de placa inválido</mat-error>
  </mat-form-field>
</form>
```

## Data Models

### VehiculoFiltros
```typescript
interface VehiculoFiltros {
  placa?: string;
  empresaId?: string;
  empresa?: Empresa;
  resolucionId?: string;
  resolucion?: Resolucion;
  estados?: EstadoVehiculo[];
  marcas?: string[];
  anioDesde?: number;
  anioHasta?: number;
  capacidadMinima?: number;
  capacidadMaxima?: number;
  fechaRegistroDesde?: Date;
  fechaRegistroHasta?: Date;
}
```

### VehiculoStats
```typescript
interface VehiculoStats {
  total: number;
  activos: number;
  suspendidos: number;
  enRevision: number;
  inactivos: number;
  empresasConVehiculos: number;
  promedioCapacidad: number;
  vehiculosPorMarca: { marca: string; cantidad: number }[];
  tendencias: {
    totalChange: number;
    activosChange: number;
    nuevosMes: number;
    bajasMes: number;
  };
  distribucionPorAnio: { anio: number; cantidad: number }[];
}
```

### BusquedaGlobal
```typescript
interface BusquedaGlobal {
  termino: string;
  campos: BusquedaCampo[];
  sugerencias: BusquedaSugerencia[];
  resultados: VehiculoBusqueda[];
}

interface BusquedaSugerencia {
  tipo: 'vehiculo' | 'empresa' | 'resolucion' | 'marca';
  texto: string;
  valor: string;
  icono: string;
  descripcion?: string;
}

interface VehiculoBusqueda extends Vehiculo {
  relevancia: number;
  camposCoincidentes: string[];
  textoResaltado: string;
}
```

### NotificacionVehiculo
```typescript
interface NotificacionVehiculo {
  id: string;
  tipo: 'TRANSFERENCIA' | 'BAJA_SOLICITADA' | 'DOCUMENTOS_VENCIMIENTO' | 'CAMBIO_ESTADO';
  vehiculoId: string;
  titulo: string;
  mensaje: string;
  destinatarios: string[];
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  fechaCreacion: Date;
  fechaEnvio?: Date;
  leida: boolean;
  datos: any;
}
```