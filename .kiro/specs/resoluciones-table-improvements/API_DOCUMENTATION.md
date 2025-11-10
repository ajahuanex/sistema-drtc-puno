# API Documentation - Resoluciones Table Improvements

## 📋 Descripción General

Esta documentación describe las APIs de los servicios y componentes del módulo de mejoras de tabla de resoluciones.

## 🔧 Servicios

### ResolucionesTableService

Servicio para gestión de estado de tabla, filtrado, ordenamiento y persistencia.

**Ubicación**: `frontend/src/app/services/resoluciones-table.service.ts`

#### Configuración

##### `getConfiguracion(): ResolucionTableConfig`

Obtiene la configuración actual de la tabla desde localStorage.

**Returns**: `ResolucionTableConfig` - Configuración de la tabla

**Ejemplo**:
```typescript
const config = this.tableService.getConfiguracion();
console.log(config.columnasVisibles); // ['numeroResolucion', 'fechaEmision', ...]
```

##### `guardarConfiguracion(config: ResolucionTableConfig): void`

Guarda la configuración de la tabla en localStorage.

**Parameters**:
- `config: ResolucionTableConfig` - Configuración a guardar

**Ejemplo**:
```typescript
const config: ResolucionTableConfig = {
  columnasVisibles: ['numeroResolucion', 'empresa', 'estado'],
  ordenColumnas: ['numeroResolucion', 'empresa', 'estado'],
  ordenamiento: [{ columna: 'fechaEmision', direccion: 'desc' }],
  paginacion: { tamanoPagina: 25, paginaActual: 0 },
  filtros: {}
};

this.tableService.guardarConfiguracion(config);
```

##### `restaurarConfiguracionDefecto(): ResolucionTableConfig`

Restaura la configuración por defecto de la tabla.

**Returns**: `ResolucionTableConfig` - Configuración por defecto

**Ejemplo**:
```typescript
const configDefecto = this.tableService.restaurarConfiguracionDefecto();
```

#### Filtrado

##### `aplicarFiltros(resoluciones: Resolucion[], filtros: ResolucionFiltros): Resolucion[]`

Aplica filtros a un array de resoluciones.

**Parameters**:
- `resoluciones: Resolucion[]` - Array de resoluciones a filtrar
- `filtros: ResolucionFiltros` - Filtros a aplicar

**Returns**: `Resolucion[]` - Array filtrado

**Ejemplo**:
```typescript
const filtros: ResolucionFiltros = {
  numeroResolucion: 'R-0001',
  tiposTramite: ['PRIMIGENIA'],
  estados: ['APROBADA']
};

const filtradas = this.tableService.aplicarFiltros(this.resoluciones, filtros);
```

##### `getFiltrosActivos(filtros: ResolucionFiltros): FiltroActivo[]`

Obtiene un array de filtros activos para mostrar como chips.

**Parameters**:
- `filtros: ResolucionFiltros` - Filtros aplicados

**Returns**: `FiltroActivo[]` - Array de filtros activos

**Ejemplo**:
```typescript
const filtrosActivos = this.tableService.getFiltrosActivos(this.filtros);
// [{ key: 'numeroResolucion', label: 'Número: R-0001', value: 'R-0001' }]
```

#### Ordenamiento

##### `aplicarOrdenamiento(resoluciones: Resolucion[], ordenamiento: OrdenamientoConfig[]): Resolucion[]`

Aplica ordenamiento a un array de resoluciones.

**Parameters**:
- `resoluciones: Resolucion[]` - Array de resoluciones a ordenar
- `ordenamiento: OrdenamientoConfig[]` - Configuración de ordenamiento

**Returns**: `Resolucion[]` - Array ordenado

**Ejemplo**:
```typescript
const ordenamiento: OrdenamientoConfig[] = [
  { columna: 'fechaEmision', direccion: 'desc', prioridad: 1 },
  { columna: 'numeroResolucion', direccion: 'asc', prioridad: 2 }
];

const ordenadas = this.tableService.aplicarOrdenamiento(this.resoluciones, ordenamiento);
```

##### `toggleOrdenamiento(columna: string, ordenamiento: OrdenamientoConfig[]): OrdenamientoConfig[]`

Alterna el ordenamiento de una columna (asc → desc → sin orden).

**Parameters**:
- `columna: string` - Nombre de la columna
- `ordenamiento: OrdenamientoConfig[]` - Ordenamiento actual

**Returns**: `OrdenamientoConfig[]` - Nuevo ordenamiento

**Ejemplo**:
```typescript
// Primera vez: orden ascendente
let orden = this.tableService.toggleOrdenamiento('numeroResolucion', []);
// [{ columna: 'numeroResolucion', direccion: 'asc' }]

// Segunda vez: orden descendente
orden = this.tableService.toggleOrdenamiento('numeroResolucion', orden);
// [{ columna: 'numeroResolucion', direccion: 'desc' }]

// Tercera vez: sin orden
orden = this.tableService.toggleOrdenamiento('numeroResolucion', orden);
// []
```

#### Exportación

##### `exportarExcel(resoluciones: Resolucion[], filtros: ResolucionFiltros): void`

Exporta resoluciones a formato Excel.

**Parameters**:
- `resoluciones: Resolucion[]` - Resoluciones a exportar
- `filtros: ResolucionFiltros` - Filtros aplicados (para metadata)

**Ejemplo**:
```typescript
this.tableService.exportarExcel(this.resolucionesFiltradas, this.filtrosActivos);
// Descarga: resoluciones_2025-11-09.xlsx
```

##### `exportarPDF(resoluciones: Resolucion[], filtros: ResolucionFiltros): void`

Exporta resoluciones a formato PDF.

**Parameters**:
- `resoluciones: Resolucion[]` - Resoluciones a exportar
- `filtros: ResolucionFiltros` - Filtros aplicados (para metadata)

**Ejemplo**:
```typescript
this.tableService.exportarPDF(this.resolucionesFiltradas, this.filtrosActivos);
// Descarga: resoluciones_2025-11-09.pdf
```

---

### ResolucionService (Extendido)

Servicio para gestión de resoluciones con métodos extendidos.

**Ubicación**: `frontend/src/app/services/resolucion.service.ts`

#### Métodos Extendidos

##### `getResolucionesConEmpresa(): Observable<ResolucionConEmpresa[]>`

Obtiene todas las resoluciones con datos de empresa incluidos.

**Returns**: `Observable<ResolucionConEmpresa[]>` - Observable con resoluciones

**Ejemplo**:
```typescript
this.resolucionService.getResolucionesConEmpresa()
  .subscribe({
    next: (resoluciones) => {
      console.log(resoluciones[0].empresa?.razonSocial.principal);
    },
    error: (error) => console.error(error)
  });
```

##### `getResolucionesFiltradas(filtros: ResolucionFiltros): Observable<ResolucionConEmpresa[]>`

Obtiene resoluciones filtradas desde el backend.

**Parameters**:
- `filtros: ResolucionFiltros` - Filtros a aplicar

**Returns**: `Observable<ResolucionConEmpresa[]>` - Observable con resoluciones filtradas

**Ejemplo**:
```typescript
const filtros: ResolucionFiltros = {
  empresaId: 'empresa-123',
  estados: ['APROBADA'],
  fechaInicio: new Date('2025-01-01'),
  fechaFin: new Date('2025-12-31')
};

this.resolucionService.getResolucionesFiltradas(filtros)
  .subscribe({
    next: (resoluciones) => {
      console.log(`Encontradas ${resoluciones.length} resoluciones`);
    }
  });
```

##### `exportarResoluciones(filtros: ResolucionFiltros, formato: 'excel' | 'pdf'): Observable<Blob>`

Exporta resoluciones desde el backend.

**Parameters**:
- `filtros: ResolucionFiltros` - Filtros a aplicar
- `formato: 'excel' | 'pdf'` - Formato de exportación

**Returns**: `Observable<Blob>` - Observable con archivo

**Ejemplo**:
```typescript
this.resolucionService.exportarResoluciones(this.filtros, 'excel')
  .subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resoluciones.xlsx';
      a.click();
    }
  });
```

##### `getEstadisticasFiltros(filtros: ResolucionFiltros): Observable<EstadisticasResoluciones>`

Obtiene estadísticas de resoluciones según filtros.

**Parameters**:
- `filtros: ResolucionFiltros` - Filtros a aplicar

**Returns**: `Observable<EstadisticasResoluciones>` - Observable con estadísticas

**Ejemplo**:
```typescript
this.resolucionService.getEstadisticasFiltros(this.filtros)
  .subscribe({
    next: (stats) => {
      console.log(`Total: ${stats.total}`);
      console.log(`Aprobadas: ${stats.porEstado.APROBADA}`);
      console.log(`En proceso: ${stats.porEstado.EN_PROCESO}`);
    }
  });
```

---

## 🧩 Componentes

### ResolucionesFiltersComponent

Componente de filtrado avanzado.

**Ubicación**: `frontend/src/app/shared/resoluciones-filters.component.ts`

#### Inputs

##### `@Input() filtros: ResolucionFiltros`

Filtros actuales aplicados.

**Type**: `ResolucionFiltros`  
**Default**: `{}`

##### `@Input() empresas: Empresa[]`

Lista de empresas disponibles para filtro.

**Type**: `Empresa[]`  
**Default**: `[]`

##### `@Input() tiposTramite: string[]`

Tipos de trámite disponibles.

**Type**: `string[]`  
**Default**: `[]`

##### `@Input() estados: string[]`

Estados disponibles.

**Type**: `string[]`  
**Default**: `[]`

#### Outputs

##### `@Output() filtrosChange: EventEmitter<ResolucionFiltros>`

Emite cuando los filtros cambian.

**Type**: `EventEmitter<ResolucionFiltros>`

**Ejemplo**:
```typescript
onFiltrosChange(filtros: ResolucionFiltros) {
  console.log('Nuevos filtros:', filtros);
  this.aplicarFiltros(filtros);
}
```

##### `@Output() limpiarFiltros: EventEmitter<void>`

Emite cuando se limpian todos los filtros.

**Type**: `EventEmitter<void>`

**Ejemplo**:
```typescript
onLimpiarFiltros() {
  console.log('Filtros limpiados');
  this.filtros = {};
  this.cargarResoluciones();
}
```

#### Métodos Públicos

##### `aplicarFiltros(): void`

Aplica los filtros actuales y emite el evento.

**Ejemplo**:
```typescript
// Desde el template
<button (click)="filtersComponent.aplicarFiltros()">Aplicar</button>
```

##### `limpiar(): void`

Limpia todos los filtros y emite el evento.

**Ejemplo**:
```typescript
// Desde el template
<button (click)="filtersComponent.limpiar()">Limpiar</button>
```

---

### ResolucionesTableComponent

Componente de tabla avanzada.

**Ubicación**: `frontend/src/app/shared/resoluciones-table.component.ts`

#### Inputs

##### `@Input() resoluciones: ResolucionConEmpresa[]`

Array de resoluciones a mostrar.

**Type**: `ResolucionConEmpresa[]`  
**Default**: `[]`

##### `@Input() configuracion: ResolucionTableConfig`

Configuración de la tabla.

**Type**: `ResolucionTableConfig`  
**Required**: Yes

##### `@Input() cargando: boolean`

Indica si la tabla está cargando datos.

**Type**: `boolean`  
**Default**: `false`

#### Outputs

##### `@Output() configuracionChange: EventEmitter<ResolucionTableConfig>`

Emite cuando la configuración cambia.

**Type**: `EventEmitter<ResolucionTableConfig>`

**Ejemplo**:
```typescript
onConfigChange(config: ResolucionTableConfig) {
  this.tableConfig = config;
  this.guardarConfiguracion(config);
}
```

##### `@Output() resolucionSeleccionada: EventEmitter<Resolucion>`

Emite cuando se selecciona una resolución.

**Type**: `EventEmitter<Resolucion>`

**Ejemplo**:
```typescript
onResolucionSelected(resolucion: Resolucion) {
  this.router.navigate(['/resoluciones', resolucion.id]);
}
```

##### `@Output() accionEjecutada: EventEmitter<{accion: string, resolucion: Resolucion}>`

Emite cuando se ejecuta una acción sobre una resolución.

**Type**: `EventEmitter<{accion: string, resolucion: Resolucion}>`

**Ejemplo**:
```typescript
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
```

---

### ColumnSelectorComponent

Componente de selección de columnas.

**Ubicación**: `frontend/src/app/shared/column-selector.component.ts`

#### Inputs

##### `@Input() columnas: ColumnaDefinicion[]`

Definiciones de columnas disponibles.

**Type**: `ColumnaDefinicion[]`  
**Default**: `[]`

##### `@Input() columnasVisibles: string[]`

Columnas actualmente visibles.

**Type**: `string[]`  
**Default**: `[]`

#### Outputs

##### `@Output() columnasChange: EventEmitter<string[]>`

Emite cuando las columnas visibles cambian.

**Type**: `EventEmitter<string[]>`

**Ejemplo**:
```typescript
onColumnasChange(columnas: string[]) {
  this.columnasVisibles = columnas;
  this.actualizarTabla();
}
```

##### `@Output() restaurarDefecto: EventEmitter<void>`

Emite cuando se restaura la configuración por defecto.

**Type**: `EventEmitter<void>`

**Ejemplo**:
```typescript
onRestaurarDefecto() {
  this.columnasVisibles = this.columnasDefecto;
  this.actualizarTabla();
}
```

---

### SortableHeaderComponent

Componente de header ordenable.

**Ubicación**: `frontend/src/app/shared/sortable-header.component.ts`

#### Inputs

##### `@Input() columna: string`

Nombre de la columna.

**Type**: `string`  
**Required**: Yes

##### `@Input() label: string`

Etiqueta a mostrar.

**Type**: `string`  
**Required**: Yes

##### `@Input() ordenamiento: OrdenamientoConfig[]`

Configuración de ordenamiento actual.

**Type**: `OrdenamientoConfig[]`  
**Default**: `[]`

#### Outputs

##### `@Output() ordenar: EventEmitter<string>`

Emite cuando se hace clic para ordenar.

**Type**: `EventEmitter<string>`

**Ejemplo**:
```typescript
onOrdenar(columna: string) {
  this.ordenamiento = this.tableService.toggleOrdenamiento(
    columna,
    this.ordenamiento
  );
  this.aplicarOrdenamiento();
}
```

---

### DateRangePickerComponent

Componente de selector de rango de fechas.

**Ubicación**: `frontend/src/app/shared/date-range-picker.component.ts`

#### Inputs

##### `@Input() fechaInicio: Date | null`

Fecha de inicio del rango.

**Type**: `Date | null`  
**Default**: `null`

##### `@Input() fechaFin: Date | null`

Fecha de fin del rango.

**Type**: `Date | null`  
**Default**: `null`

##### `@Input() label: string`

Etiqueta del campo.

**Type**: `string`  
**Default**: `'Rango de Fechas'`

#### Outputs

##### `@Output() rangoChange: EventEmitter<{inicio: Date | null, fin: Date | null}>`

Emite cuando el rango cambia.

**Type**: `EventEmitter<{inicio: Date | null, fin: Date | null}>`

**Ejemplo**:
```typescript
onRangoChange(rango: {inicio: Date | null, fin: Date | null}) {
  this.filtros.fechaInicio = rango.inicio;
  this.filtros.fechaFin = rango.fin;
  this.aplicarFiltros();
}
```

---

## 📊 Interfaces y Tipos

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

### FiltroActivo

```typescript
export interface FiltroActivo {
  key: string;
  label: string;
  value: any;
}
```

### EstadisticasResoluciones

```typescript
export interface EstadisticasResoluciones {
  total: number;
  porEstado: {
    [estado: string]: number;
  };
  porTipo: {
    [tipo: string]: number;
  };
  porMes: {
    [mes: string]: number;
  };
}
```

---

## 🔄 Flujos de Datos

### Flujo de Filtrado

```
Usuario aplica filtros
  ↓
ResolucionesFiltersComponent emite filtrosChange
  ↓
ResolucionesComponent recibe filtros
  ↓
ResolucionesTableService.aplicarFiltros()
  ↓
Resoluciones filtradas se muestran en tabla
```

### Flujo de Ordenamiento

```
Usuario hace clic en header
  ↓
SortableHeaderComponent emite ordenar
  ↓
ResolucionesTableComponent actualiza ordenamiento
  ↓
ResolucionesTableService.aplicarOrdenamiento()
  ↓
Resoluciones ordenadas se muestran en tabla
```

### Flujo de Exportación

```
Usuario hace clic en exportar
  ↓
ResolucionesComponent llama a tableService.exportarExcel()
  ↓
Se genera archivo Excel con datos filtrados
  ↓
Archivo se descarga automáticamente
```

---

## 🧪 Ejemplos de Uso Completos

### Ejemplo 1: Implementación Básica

```typescript
import { Component, OnInit } from '@angular/core';
import { 
  ResolucionesFiltersComponent,
  ResolucionesTableComponent
} from './shared';
import { 
  ResolucionService,
  ResolucionesTableService
} from './services';

@Component({
  selector: 'app-resoluciones',
  standalone: true,
  imports: [
    ResolucionesFiltersComponent,
    ResolucionesTableComponent
  ],
  template: `
    <app-resoluciones-filters
      [filtros]="filtrosActivos"
      [empresas]="empresas"
      [tiposTramite]="tiposTramite"
      [estados]="estados"
      (filtrosChange)="onFiltrosChange($event)"
      (limpiarFiltros)="onLimpiarFiltros()">
    </app-resoluciones-filters>

    <app-resoluciones-table
      [resoluciones]="resolucionesFiltradas"
      [configuracion]="tableConfig"
      [cargando]="cargando"
      (configuracionChange)="onConfigChange($event)"
      (resolucionSeleccionada)="onResolucionSelected($event)"
      (accionEjecutada)="onAccionEjecutada($event)">
    </app-resoluciones-table>
  `
})
export class ResolucionesComponent implements OnInit {
  resoluciones: ResolucionConEmpresa[] = [];
  resolucionesFiltradas: ResolucionConEmpresa[] = [];
  filtrosActivos: ResolucionFiltros = {};
  tableConfig: ResolucionTableConfig;
  cargando = false;

  empresas: Empresa[] = [];
  tiposTramite = ['PRIMIGENIA', 'RENOVACION', 'INCREMENTO_FLOTA'];
  estados = ['APROBADA', 'EN_PROCESO', 'RECHAZADA'];

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
          console.error(error);
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
    console.log('Resolución seleccionada:', resolucion);
  }

  onAccionEjecutada(evento: {accion: string, resolucion: Resolucion}) {
    console.log('Acción ejecutada:', evento);
  }
}
```

### Ejemplo 2: Exportación Avanzada

```typescript
exportarDatos(formato: 'excel' | 'pdf') {
  // Mostrar loading
  this.exportando = true;

  // Exportar desde backend
  this.resolucionService.exportarResoluciones(this.filtrosActivos, formato)
    .subscribe({
      next: (blob) => {
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear elemento de descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = `resoluciones_${new Date().toISOString().split('T')[0]}.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
        
        // Descargar
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Limpiar URL
        window.URL.revokeObjectURL(url);
        
        this.exportando = false;
        this.mostrarNotificacion('Exportación completada');
      },
      error: (error) => {
        console.error('Error al exportar:', error);
        this.exportando = false;
        this.mostrarError('Error al exportar datos');
      }
    });
}
```

---

## 📚 Referencias

- [Angular Material Documentation](https://material.angular.io/)
- [RxJS Documentation](https://rxjs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0
