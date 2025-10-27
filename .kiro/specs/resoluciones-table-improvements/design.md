# Diseño de Mejoras de Tabla de Gestión de Resoluciones

## Overview

Este documento describe el diseño técnico para implementar mejoras avanzadas en la tabla de gestión de resoluciones, incluyendo filtros, selección de columnas, ordenamiento y visualización mejorada de datos empresariales.

## Architecture

### Componentes Principales

```
ResolucionesComponent (Existente - Mejorado)
├── ResolucionesFiltersComponent (Nuevo)
│   ├── EmpresaSelectorComponent (Reutilizado)
│   ├── DateRangePickerComponent (Nuevo)
│   └── SmartIconComponent (Reutilizado)
├── ResolucionesTableComponent (Nuevo)
│   ├── ColumnSelectorComponent (Nuevo)
│   ├── SortableHeaderComponent (Nuevo)
│   └── SmartIconComponent (Reutilizado)
└── ResolucionesService (Existente - Extendido)
```

### Servicios y Modelos

```
ResolucionesTableService (Nuevo)
├── Gestión de filtros
├── Gestión de ordenamiento
├── Persistencia de configuración
└── Exportación de datos

ResolucionTableConfig (Nuevo Interface)
├── Configuración de columnas
├── Filtros aplicados
├── Ordenamiento activo
└── Preferencias de usuario
```

## Components and Interfaces

### 1. ResolucionesFiltersComponent

**Responsabilidad:** Proporcionar interfaz de filtrado avanzado

**Inputs:**
- `filtros: ResolucionFiltros` - Filtros actuales aplicados
- `empresas: Empresa[]` - Lista de empresas disponibles
- `tiposTramite: string[]` - Tipos de trámite disponibles
- `estados: string[]` - Estados disponibles

**Outputs:**
- `filtrosChange: EventEmitter<ResolucionFiltros>` - Cambios en filtros
- `limpiarFiltros: EventEmitter<void>` - Limpiar todos los filtros

**Template Structure:**
```html
<mat-expansion-panel>
  <mat-expansion-panel-header>
    <mat-panel-title>Filtros Avanzados</mat-panel-title>
  </mat-expansion-panel-header>
  
  <div class="filtros-grid">
    <!-- Filtro por número -->
    <mat-form-field>
      <input matInput placeholder="Número de resolución">
    </mat-form-field>
    
    <!-- Filtro por empresa -->
    <app-empresa-selector></app-empresa-selector>
    
    <!-- Filtro por tipo de trámite -->
    <mat-form-field>
      <mat-select multiple>
        <mat-option *ngFor="let tipo of tiposTramite" [value]="tipo">
          {{ tipo }}
        </mat-option>
      </mat-select>
    </mat-form-field>
    
    <!-- Filtro por estado -->
    <mat-form-field>
      <mat-select multiple>
        <mat-option *ngFor="let estado of estados" [value]="estado">
          {{ estado }}
        </mat-option>
      </mat-select>
    </mat-form-field>
    
    <!-- Filtro por rango de fechas -->
    <app-date-range-picker></app-date-range-picker>
  </div>
  
  <!-- Chips de filtros activos -->
  <div class="filtros-activos" *ngIf="tienesFiltrosActivos()">
    <mat-chip-set>
      <mat-chip *ngFor="let filtro of getFiltrosActivos()" 
                (removed)="removerFiltro(filtro)">
        {{ filtro.label }}
        <mat-icon matChipRemove>cancel</mat-icon>
      </mat-chip>
    </mat-chip-set>
  </div>
</mat-expansion-panel>
```

### 2. ResolucionesTableComponent

**Responsabilidad:** Tabla avanzada con ordenamiento y selección de columnas

**Inputs:**
- `resoluciones: Resolucion[]` - Datos de resoluciones
- `configuracion: ResolucionTableConfig` - Configuración de tabla
- `cargando: boolean` - Estado de carga

**Outputs:**
- `configuracionChange: EventEmitter<ResolucionTableConfig>` - Cambios en configuración
- `resolucionSeleccionada: EventEmitter<Resolucion>` - Resolución seleccionada
- `accionEjecutada: EventEmitter<{accion: string, resolucion: Resolucion}>` - Acciones de tabla

**Features:**
- Headers ordenables con indicadores visuales
- Menú de selección de columnas
- Paginación integrada
- Acciones por fila (ver, editar, eliminar)
- Selección múltiple opcional

### 3. ColumnSelectorComponent

**Responsabilidad:** Selector de columnas visibles y orden

**Template Structure:**
```html
<button mat-icon-button [matMenuTriggerFor]="columnMenu">
  <app-smart-icon iconName="view_column"></app-smart-icon>
</button>

<mat-menu #columnMenu="matMenu">
  <div class="column-selector-content">
    <h4>Columnas Visibles</h4>
    <mat-selection-list [(ngModel)]="columnasSeleccionadas">
      <mat-list-option *ngFor="let columna of columnasDisponibles" 
                       [value]="columna.key"
                       [disabled]="columna.required">
        {{ columna.label }}
      </mat-list-option>
    </mat-selection-list>
    
    <mat-divider></mat-divider>
    
    <div class="column-actions">
      <button mat-button (click)="restaurarDefecto()">
        Restaurar por Defecto
      </button>
      <button mat-raised-button color="primary" (click)="aplicarCambios()">
        Aplicar
      </button>
    </div>
  </div>
</mat-menu>
```

### 4. DateRangePickerComponent

**Responsabilidad:** Selector de rango de fechas

**Inputs:**
- `fechaInicio: Date | null` - Fecha de inicio
- `fechaFin: Date | null` - Fecha de fin
- `label: string` - Etiqueta del campo

**Outputs:**
- `rangoChange: EventEmitter<{inicio: Date | null, fin: Date | null}>` - Cambio de rango

## Data Models

### ResolucionFiltros Interface

```typescript
export interface ResolucionFiltros {
  numeroResolucion?: string;
  empresaId?: string;
  tiposTramite?: string[];
  estados?: string[];
  fechaInicio?: Date;
  fechaFin?: Date;
  activo?: boolean;
}
```

### ResolucionTableConfig Interface

```typescript
export interface ResolucionTableConfig {
  columnasVisibles: string[];
  ordenColumnas: string[];
  ordenamiento: {
    columna: string;
    direccion: 'asc' | 'desc';
  }[];
  paginacion: {
    tamanoPagina: number;
    paginaActual: number;
  };
  filtros: ResolucionFiltros;
}
```

### ColumnaDefinicion Interface

```typescript
export interface ColumnaDefinicion {
  key: string;
  label: string;
  sortable: boolean;
  required: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  tipo: 'text' | 'date' | 'badge' | 'actions' | 'empresa';
}
```

### ResolucionConEmpresa Interface

```typescript
export interface ResolucionConEmpresa extends Resolucion {
  empresa?: {
    id: string;
    razonSocial: {
      principal: string;
      comercial?: string;
    };
    ruc: string;
  };
}
```

## Error Handling

### Estrategias de Manejo de Errores

1. **Carga de Datos:**
   - Loading states durante fetch
   - Retry automático en caso de fallo
   - Mensajes de error user-friendly

2. **Filtros:**
   - Validación de rangos de fechas
   - Manejo de filtros inválidos
   - Fallback a configuración por defecto

3. **Persistencia:**
   - Manejo de errores de localStorage
   - Configuración por defecto como fallback
   - Notificaciones de éxito/error

## Testing Strategy

### Unit Tests

1. **ResolucionesFiltersComponent:**
   - Aplicación correcta de filtros
   - Limpieza de filtros
   - Validación de rangos de fechas
   - Emisión de eventos

2. **ResolucionesTableComponent:**
   - Ordenamiento por columnas
   - Selección de columnas
   - Paginación
   - Acciones de fila

3. **ResolucionesTableService:**
   - Lógica de filtrado
   - Persistencia de configuración
   - Transformación de datos

### Integration Tests

1. **Flujo completo de filtrado:**
   - Aplicar filtros → Ver resultados
   - Combinar múltiples filtros
   - Limpiar filtros

2. **Configuración de tabla:**
   - Cambiar columnas visibles
   - Reordenar columnas
   - Persistir configuración

3. **Ordenamiento:**
   - Ordenar por diferentes columnas
   - Ordenamiento múltiple
   - Mantener ordenamiento con filtros

### E2E Tests

1. **Escenarios de usuario:**
   - Buscar resolución específica
   - Filtrar por empresa y fecha
   - Personalizar vista de tabla
   - Exportar datos filtrados

## Performance Considerations

### Optimizaciones

1. **Virtual Scrolling:** Para tablas con muchos registros
2. **Debounce:** En filtros de texto para evitar requests excesivos
3. **Memoization:** Para cálculos de filtros complejos
4. **Lazy Loading:** Para datos de empresas en filtros
5. **Change Detection:** OnPush strategy para mejor performance

### Métricas

- Tiempo de carga inicial: < 2 segundos
- Tiempo de aplicación de filtros: < 500ms
- Tiempo de ordenamiento: < 300ms
- Memoria utilizada: Monitorear con grandes datasets

## Integration Points

### Servicios Existentes

1. **ResolucionService:** Extender con métodos de filtrado
2. **EmpresaService:** Para datos de empresas en filtros
3. **NotificationService:** Para feedback de acciones

### Componentes Reutilizados

1. **EmpresaSelectorComponent:** En filtros de empresa
2. **SmartIconComponent:** Para todos los iconos
3. **Material Design Components:** Para consistencia visual

### APIs

```typescript
// Nuevos métodos en ResolucionService
getResolucionesFiltradas(filtros: ResolucionFiltros): Observable<ResolucionConEmpresa[]>
exportarResoluciones(filtros: ResolucionFiltros, formato: 'excel' | 'pdf'): Observable<Blob>
getEstadisticasFiltros(filtros: ResolucionFiltros): Observable<EstadisticasResoluciones>
```

## Migration Strategy

### Fase 1: Preparación
- Crear nuevos componentes sin afectar existentes
- Extender modelos de datos
- Preparar servicios

### Fase 2: Implementación
- Integrar filtros en vista existente
- Reemplazar tabla simple con tabla avanzada
- Migrar configuración existente

### Fase 3: Optimización
- Implementar persistencia de configuración
- Agregar funcionalidades avanzadas
- Optimizar performance

### Rollback Plan
- Mantener componente original como fallback
- Feature flags para habilitar/deshabilitar
- Configuración por defecto funcional