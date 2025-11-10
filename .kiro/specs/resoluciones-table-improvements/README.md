# Mejoras de Tabla de Gestión de Resoluciones

## 📋 Descripción General

Este módulo implementa mejoras avanzadas para la tabla de gestión de resoluciones, incluyendo filtrado avanzado, selección de columnas personalizables, ordenamiento múltiple, y visualización mejorada de datos empresariales.

## ✨ Características Principales

### 🔍 Filtrado Avanzado
- Filtro por número de resolución con búsqueda parcial
- Filtro por empresa con selector inteligente
- Filtro por tipo de trámite (selección múltiple)
- Filtro por estado (selección múltiple)
- Filtro por rango de fechas
- Chips visuales de filtros activos
- Combinación de múltiples filtros

### 📊 Tabla Personalizable
- Selección de columnas visibles
- Reordenamiento de columnas mediante drag & drop
- Persistencia de configuración en localStorage
- Restauración de configuración por defecto
- Columna de empresa en lugar de descripción

### 🔄 Ordenamiento Avanzado
- Ordenamiento por cualquier columna
- Ordenamiento múltiple con prioridad visual
- Indicadores visuales de dirección (asc/desc)
- Mantenimiento de orden al aplicar filtros

### 🎨 Mejoras de UX
- Paginación integrada
- Estados de carga con spinners
- Mensajes informativos cuando no hay resultados
- Contador de resultados encontrados
- Exportación de datos (Excel/PDF)
- Diseño responsive para móviles

## 🏗️ Arquitectura

### Componentes Principales

```
ResolucionesComponent (Mejorado)
├── ResolucionesFiltersComponent
│   ├── EmpresaSelectorComponent
│   ├── DateRangePickerComponent
│   └── SmartIconComponent
├── ResolucionesTableComponent
│   ├── ColumnSelectorComponent
│   ├── SortableHeaderComponent
│   └── SmartIconComponent
└── ResolucionesTableService
```

### Servicios

- **ResolucionService**: Extendido con métodos de filtrado
- **ResolucionesTableService**: Gestión de estado de tabla
- **IconService**: Iconos inteligentes con fallbacks

## 📦 Componentes

### ResolucionesFiltersComponent

Componente de filtrado avanzado con expansion panel.

**Ubicación**: `frontend/src/app/shared/resoluciones-filters.component.ts`

**Inputs**:
```typescript
@Input() filtros: ResolucionFiltros = {};
@Input() empresas: Empresa[] = [];
@Input() tiposTramite: string[] = [];
@Input() estados: string[] = [];
```

**Outputs**:
```typescript
@Output() filtrosChange = new EventEmitter<ResolucionFiltros>();
@Output() limpiarFiltros = new EventEmitter<void>();
```

**Uso**:
```html
<app-resoluciones-filters
  [filtros]="filtrosActivos"
  [empresas]="empresas"
  [tiposTramite]="tiposTramite"
  [estados]="estados"
  (filtrosChange)="onFiltrosChange($event)"
  (limpiarFiltros)="onLimpiarFiltros()">
</app-resoluciones-filters>
```

### ResolucionesTableComponent

Tabla avanzada con ordenamiento y selección de columnas.

**Ubicación**: `frontend/src/app/shared/resoluciones-table.component.ts`

**Inputs**:
```typescript
@Input() resoluciones: ResolucionConEmpresa[] = [];
@Input() configuracion: ResolucionTableConfig;
@Input() cargando: boolean = false;
```

**Outputs**:
```typescript
@Output() configuracionChange = new EventEmitter<ResolucionTableConfig>();
@Output() resolucionSeleccionada = new EventEmitter<Resolucion>();
@Output() accionEjecutada = new EventEmitter<{accion: string, resolucion: Resolucion}>();
```

**Uso**:
```html
<app-resoluciones-table
  [resoluciones]="resoluciones"
  [configuracion]="tableConfig"
  [cargando]="cargando"
  (configuracionChange)="onConfigChange($event)"
  (resolucionSeleccionada)="onResolucionSelected($event)"
  (accionEjecutada)="onAccionEjecutada($event)">
</app-resoluciones-table>
```

### ColumnSelectorComponent

Selector de columnas visibles con reordenamiento.

**Ubicación**: `frontend/src/app/shared/column-selector.component.ts`

**Inputs**:
```typescript
@Input() columnas: ColumnaDefinicion[] = [];
@Input() columnasVisibles: string[] = [];
```

**Outputs**:
```typescript
@Output() columnasChange = new EventEmitter<string[]>();
@Output() restaurarDefecto = new EventEmitter<void>();
```

**Uso**:
```html
<app-column-selector
  [columnas]="columnasDisponibles"
  [columnasVisibles]="columnasActuales"
  (columnasChange)="onColumnasChange($event)"
  (restaurarDefecto)="onRestaurarDefecto()">
</app-column-selector>
```

### SortableHeaderComponent

Header de tabla con ordenamiento.

**Ubicación**: `frontend/src/app/shared/sortable-header.component.ts`

**Inputs**:
```typescript
@Input() columna: string = '';
@Input() label: string = '';
@Input() ordenamiento: OrdenamientoConfig[] = [];
```

**Outputs**:
```typescript
@Output() ordenar = new EventEmitter<string>();
```

**Uso**:
```html
<app-sortable-header
  [columna]="'numeroResolucion'"
  [label]="'Número'"
  [ordenamiento]="ordenamientoActual"
  (ordenar)="onOrdenar($event)">
</app-sortable-header>
```

### DateRangePickerComponent

Selector de rango de fechas.

**Ubicación**: `frontend/src/app/shared/date-range-picker.component.ts`

**Inputs**:
```typescript
@Input() fechaInicio: Date | null = null;
@Input() fechaFin: Date | null = null;
@Input() label: string = 'Rango de Fechas';
```

**Outputs**:
```typescript
@Output() rangoChange = new EventEmitter<{inicio: Date | null, fin: Date | null}>();
```

**Uso**:
```html
<app-date-range-picker
  [fechaInicio]="filtros.fechaInicio"
  [fechaFin]="filtros.fechaFin"
  [label]="'Fecha de Emisión'"
  (rangoChange)="onRangoChange($event)">
</app-date-range-picker>
```

## 🔧 Servicios

### ResolucionesTableService

Gestión de estado de tabla y persistencia.

**Ubicación**: `frontend/src/app/services/resoluciones-table.service.ts`

**API Principal**:
```typescript
// Configuración
getConfiguracion(): ResolucionTableConfig
guardarConfiguracion(config: ResolucionTableConfig): void
restaurarConfiguracionDefecto(): void

// Filtros
aplicarFiltros(resoluciones: Resolucion[], filtros: ResolucionFiltros): Resolucion[]
getFiltrosActivos(filtros: ResolucionFiltros): FiltroActivo[]

// Ordenamiento
aplicarOrdenamiento(resoluciones: Resolucion[], ordenamiento: OrdenamientoConfig[]): Resolucion[]
toggleOrdenamiento(columna: string, ordenamiento: OrdenamientoConfig[]): OrdenamientoConfig[]

// Exportación
exportarExcel(resoluciones: Resolucion[], filtros: ResolucionFiltros): void
exportarPDF(resoluciones: Resolucion[], filtros: ResolucionFiltros): void
```

**Ejemplo de uso**:
```typescript
constructor(private tableService: ResolucionesTableService) {}

ngOnInit() {
  // Cargar configuración guardada
  this.tableConfig = this.tableService.getConfiguracion();
  
  // Aplicar filtros
  this.resolucionesFiltradas = this.tableService.aplicarFiltros(
    this.resoluciones,
    this.filtrosActivos
  );
  
  // Aplicar ordenamiento
  this.resolucionesFiltradas = this.tableService.aplicarOrdenamiento(
    this.resolucionesFiltradas,
    this.tableConfig.ordenamiento
  );
}

onExportar(formato: 'excel' | 'pdf') {
  if (formato === 'excel') {
    this.tableService.exportarExcel(this.resolucionesFiltradas, this.filtrosActivos);
  } else {
    this.tableService.exportarPDF(this.resolucionesFiltradas, this.filtrosActivos);
  }
}
```

### ResolucionService (Extendido)

Servicio extendido con métodos de filtrado.

**Ubicación**: `frontend/src/app/services/resolucion.service.ts`

**Nuevos métodos**:
```typescript
// Obtener resoluciones con datos de empresa
getResolucionesConEmpresa(): Observable<ResolucionConEmpresa[]>

// Filtrado en backend
getResolucionesFiltradas(filtros: ResolucionFiltros): Observable<ResolucionConEmpresa[]>

// Exportación
exportarResoluciones(filtros: ResolucionFiltros, formato: 'excel' | 'pdf'): Observable<Blob>

// Estadísticas
getEstadisticasFiltros(filtros: ResolucionFiltros): Observable<EstadisticasResoluciones>
```

## 📊 Modelos de Datos

### ResolucionFiltros

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

### ResolucionTableConfig

```typescript
export interface ResolucionTableConfig {
  columnasVisibles: string[];
  ordenColumnas: string[];
  ordenamiento: OrdenamientoConfig[];
  paginacion: {
    tamanoPagina: number;
    paginaActual: number;
  };
  filtros: ResolucionFiltros;
}
```

### ColumnaDefinicion

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

### ResolucionConEmpresa

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

### OrdenamientoConfig

```typescript
export interface OrdenamientoConfig {
  columna: string;
  direccion: 'asc' | 'desc';
  prioridad?: number;
}
```

## 🚀 Guía de Uso

### Integración Básica

1. **Importar componentes en tu módulo**:
```typescript
import { 
  ResolucionesFiltersComponent,
  ResolucionesTableComponent,
  ColumnSelectorComponent,
  SortableHeaderComponent,
  DateRangePickerComponent
} from './shared';
```

2. **Agregar al template**:
```html
<div class="resoluciones-container">
  <!-- Filtros -->
  <app-resoluciones-filters
    [filtros]="filtrosActivos"
    [empresas]="empresas"
    [tiposTramite]="tiposTramite"
    [estados]="estados"
    (filtrosChange)="onFiltrosChange($event)"
    (limpiarFiltros)="onLimpiarFiltros()">
  </app-resoluciones-filters>

  <!-- Tabla -->
  <app-resoluciones-table
    [resoluciones]="resolucionesFiltradas"
    [configuracion]="tableConfig"
    [cargando]="cargando"
    (configuracionChange)="onConfigChange($event)"
    (resolucionSeleccionada)="onResolucionSelected($event)"
    (accionEjecutada)="onAccionEjecutada($event)">
  </app-resoluciones-table>
</div>
```

3. **Implementar lógica en el componente**:
```typescript
export class ResolucionesComponent implements OnInit {
  resoluciones: ResolucionConEmpresa[] = [];
  resolucionesFiltradas: ResolucionConEmpresa[] = [];
  filtrosActivos: ResolucionFiltros = {};
  tableConfig: ResolucionTableConfig;
  cargando = false;

  constructor(
    private resolucionService: ResolucionService,
    private tableService: ResolucionesTableService
  ) {
    this.tableConfig = this.tableService.getConfiguracion();
  }

  ngOnInit() {
    this.cargarResoluciones();
  }

  cargarResoluciones() {
    this.cargando = true;
    this.resolucionService.getResolucionesConEmpresa()
      .subscribe({
        next: (data) => {
          this.resoluciones = data;
          this.aplicarFiltrosYOrdenamiento();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar resoluciones:', error);
          this.cargando = false;
        }
      });
  }

  onFiltrosChange(filtros: ResolucionFiltros) {
    this.filtrosActivos = filtros;
    this.aplicarFiltrosYOrdenamiento();
  }

  onLimpiarFiltros() {
    this.filtrosActivos = {};
    this.aplicarFiltrosYOrdenamiento();
  }

  onConfigChange(config: ResolucionTableConfig) {
    this.tableConfig = config;
    this.tableService.guardarConfiguracion(config);
    this.aplicarFiltrosYOrdenamiento();
  }

  aplicarFiltrosYOrdenamiento() {
    let resultado = this.tableService.aplicarFiltros(
      this.resoluciones,
      this.filtrosActivos
    );
    
    resultado = this.tableService.aplicarOrdenamiento(
      resultado,
      this.tableConfig.ordenamiento
    );
    
    this.resolucionesFiltradas = resultado;
  }

  onResolucionSelected(resolucion: Resolucion) {
    // Navegar a detalle o abrir modal
    console.log('Resolución seleccionada:', resolucion);
  }

  onAccionEjecutada(evento: {accion: string, resolucion: Resolucion}) {
    switch(evento.accion) {
      case 'ver':
        this.verDetalle(evento.resolucion);
        break;
      case 'editar':
        this.editarResolucion(evento.resolucion);
        break;
      case 'eliminar':
        this.eliminarResolucion(evento.resolucion);
        break;
    }
  }
}
```

### Filtrado Avanzado

```typescript
// Filtrar por múltiples criterios
const filtros: ResolucionFiltros = {
  numeroResolucion: 'R-0001',
  empresaId: 'empresa-123',
  tiposTramite: ['PRIMIGENIA', 'RENOVACION'],
  estados: ['APROBADA', 'EN_PROCESO'],
  fechaInicio: new Date('2025-01-01'),
  fechaFin: new Date('2025-12-31')
};

this.onFiltrosChange(filtros);
```

### Ordenamiento Múltiple

```typescript
// Ordenar por fecha (desc) y luego por número (asc)
const ordenamiento: OrdenamientoConfig[] = [
  { columna: 'fechaEmision', direccion: 'desc', prioridad: 1 },
  { columna: 'numeroResolucion', direccion: 'asc', prioridad: 2 }
];

this.tableConfig.ordenamiento = ordenamiento;
this.aplicarFiltrosYOrdenamiento();
```

### Exportación de Datos

```typescript
// Exportar a Excel
exportarExcel() {
  this.tableService.exportarExcel(
    this.resolucionesFiltradas,
    this.filtrosActivos
  );
}

// Exportar a PDF
exportarPDF() {
  this.tableService.exportarPDF(
    this.resolucionesFiltradas,
    this.filtrosActivos
  );
}
```

### Personalización de Columnas

```typescript
// Definir columnas disponibles
const columnas: ColumnaDefinicion[] = [
  { key: 'numeroResolucion', label: 'Número', sortable: true, required: true, tipo: 'text' },
  { key: 'fechaEmision', label: 'Fecha', sortable: true, required: false, tipo: 'date' },
  { key: 'empresa', label: 'Empresa', sortable: true, required: false, tipo: 'empresa' },
  { key: 'tipoTramite', label: 'Tipo', sortable: true, required: false, tipo: 'badge' },
  { key: 'estado', label: 'Estado', sortable: true, required: false, tipo: 'badge' },
  { key: 'acciones', label: 'Acciones', sortable: false, required: true, tipo: 'actions' }
];

// Cambiar columnas visibles
onColumnasChange(columnasVisibles: string[]) {
  this.tableConfig.columnasVisibles = columnasVisibles;
  this.tableService.guardarConfiguracion(this.tableConfig);
}

// Restaurar configuración por defecto
onRestaurarDefecto() {
  this.tableConfig = this.tableService.restaurarConfiguracionDefecto();
}
```

## 🎨 Personalización de Estilos

### Variables CSS

```scss
// Colores de filtros
--filter-bg: #f5f5f5;
--filter-border: #e0e0e0;
--chip-bg: #e3f2fd;
--chip-color: #1976d2;

// Colores de tabla
--table-header-bg: #fafafa;
--table-row-hover: #f5f5f5;
--table-border: #e0e0e0;

// Colores de ordenamiento
--sort-active: #1976d2;
--sort-inactive: #9e9e9e;
```

### Clases CSS Personalizadas

```scss
// Personalizar filtros
.resoluciones-filters {
  .mat-expansion-panel {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
}

// Personalizar tabla
.resoluciones-table {
  .mat-table {
    border: 1px solid var(--table-border);
  }
  
  .mat-header-row {
    background-color: var(--table-header-bg);
  }
  
  .mat-row:hover {
    background-color: var(--table-row-hover);
  }
}
```

## 📱 Responsive Design

### Breakpoints

- **Desktop**: > 1024px - Layout completo
- **Tablet**: 768px - 1024px - Layout adaptado
- **Mobile**: < 768px - Vista de cards

### Adaptaciones Móviles

```typescript
// Detectar tamaño de pantalla
@HostListener('window:resize', ['$event'])
onResize(event: any) {
  this.isMobile = event.target.innerWidth < 768;
  this.isTablet = event.target.innerWidth >= 768 && event.target.innerWidth < 1024;
}

// Cambiar vista según dispositivo
<div *ngIf="!isMobile">
  <app-resoluciones-table></app-resoluciones-table>
</div>

<div *ngIf="isMobile">
  <app-resolucion-card-mobile></app-resolucion-card-mobile>
</div>
```

## ♿ Accesibilidad

### Atributos ARIA

```html
<!-- Filtros -->
<mat-expansion-panel 
  role="region" 
  aria-label="Filtros de búsqueda">
</mat-expansion-panel>

<!-- Tabla -->
<table 
  mat-table 
  role="table" 
  aria-label="Tabla de resoluciones">
</table>

<!-- Headers ordenables -->
<th 
  mat-header-cell 
  role="columnheader" 
  [attr.aria-sort]="getSortDirection(columna)">
</th>
```

### Navegación por Teclado

- **Tab**: Navegar entre elementos
- **Enter/Space**: Activar botones y selecciones
- **Escape**: Cerrar menús y modales
- **Arrow Keys**: Navegar en listas y tablas

## 🧪 Testing

### Tests Unitarios

```typescript
// Ejemplo de test para ResolucionesFiltersComponent
describe('ResolucionesFiltersComponent', () => {
  it('debe emitir filtros cuando se aplican', () => {
    const filtros: ResolucionFiltros = {
      numeroResolucion: 'R-0001'
    };
    
    component.filtrosChange.subscribe((result) => {
      expect(result).toEqual(filtros);
    });
    
    component.aplicarFiltros(filtros);
  });
});
```

### Tests de Integración

```typescript
// Ejemplo de test de integración
describe('Flujo completo de filtrado', () => {
  it('debe filtrar y ordenar resoluciones correctamente', () => {
    // Aplicar filtros
    component.onFiltrosChange({
      tiposTramite: ['PRIMIGENIA']
    });
    
    // Verificar resultados
    expect(component.resolucionesFiltradas.length).toBe(5);
    expect(component.resolucionesFiltradas[0].tipoTramite).toBe('PRIMIGENIA');
  });
});
```

## 🐛 Troubleshooting

### Problema: Los filtros no se aplican

**Solución**: Verificar que el método `aplicarFiltrosYOrdenamiento()` se llame después de cambiar filtros.

```typescript
onFiltrosChange(filtros: ResolucionFiltros) {
  this.filtrosActivos = filtros;
  this.aplicarFiltrosYOrdenamiento(); // Importante
}
```

### Problema: La configuración no se persiste

**Solución**: Verificar que localStorage esté disponible y que se llame a `guardarConfiguracion()`.

```typescript
onConfigChange(config: ResolucionTableConfig) {
  this.tableConfig = config;
  this.tableService.guardarConfiguracion(config); // Importante
}
```

### Problema: El ordenamiento no funciona

**Solución**: Verificar que las columnas tengan la propiedad `sortable: true`.

```typescript
const columnas: ColumnaDefinicion[] = [
  { key: 'numeroResolucion', sortable: true, ... } // Debe ser true
];
```

## 📚 Recursos Adicionales

- [Guía de Usuario](./USER_GUIDE.md) - Guía completa para usuarios finales
- [API Documentation](./API_DOCUMENTATION.md) - Documentación de APIs
- [Testing Guide](./TESTING_GUIDE.md) - Guía de testing
- [Accessibility Guide](./ACCESSIBILITY_GUIDE.md) - Guía de accesibilidad

## 🤝 Contribución

Para contribuir a este módulo:

1. Crear una rama desde `main`
2. Implementar cambios siguiendo las convenciones
3. Agregar tests para nuevas funcionalidades
4. Actualizar documentación
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
