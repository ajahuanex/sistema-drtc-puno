# Ejemplos de Uso de Componentes

## 📋 Descripción

Este documento proporciona ejemplos prácticos de uso de todos los componentes del módulo de mejoras de tabla de resoluciones.

## 🔍 ResolucionesFiltersComponent

### Ejemplo Básico

```typescript
import { Component } from '@angular/core';
import { ResolucionesFiltersComponent } from './shared';

@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [ResolucionesFiltersComponent],
  template: `
    <app-resoluciones-filters
      [filtros]="filtrosActivos"
      [empresas]="empresas"
      [tiposTramite]="tiposTramite"
      [estados]="estados"
      (filtrosChange)="onFiltrosChange($event)"
      (limpiarFiltros)="onLimpiarFiltros()">
    </app-resoluciones-filters>
  `
})
export class MiComponente {
  filtrosActivos: ResolucionFiltros = {};
  empresas: Empresa[] = [];
  tiposTramite = ['PRIMIGENIA', 'RENOVACION', 'INCREMENTO_FLOTA'];
  estados = ['APROBADA', 'EN_PROCESO', 'RECHAZADA'];

  onFiltrosChange(filtros: ResolucionFiltros) {
    console.log('Filtros aplicados:', filtros);
    this.filtrosActivos = filtros;
  }

  onLimpiarFiltros() {
    console.log('Filtros limpiados');
    this.filtrosActivos = {};
  }
}
```

### Ejemplo con Filtros Predefinidos

```typescript
export class MiComponente implements OnInit {
  filtrosActivos: ResolucionFiltros = {
    estados: ['APROBADA'],
    fechaInicio: new Date('2025-01-01'),
    fechaFin: new Date('2025-12-31')
  };

  ngOnInit() {
    // Los filtros se aplicarán automáticamente al cargar
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    // Lógica de filtrado
  }
}
```

### Ejemplo con Carga Dinámica de Empresas

```typescript
export class MiComponente implements OnInit {
  empresas: Empresa[] = [];
  cargandoEmpresas = false;

  constructor(private empresaService: EmpresaService) {}

  ngOnInit() {
    this.cargarEmpresas();
  }

  cargarEmpresas() {
    this.cargandoEmpresas = true;
    this.empresaService.getEmpresas()
      .subscribe({
        next: (empresas) => {
          this.empresas = empresas;
          this.cargandoEmpresas = false;
        },
        error: (error) => {
          console.error('Error al cargar empresas:', error);
          this.cargandoEmpresas = false;
        }
      });
  }
}
```

## 📊 ResolucionesTableComponent

### Ejemplo Básico

```typescript
import { Component } from '@angular/core';
import { ResolucionesTableComponent } from './shared';

@Component({
  selector: 'app-mi-tabla',
  standalone: true,
  imports: [ResolucionesTableComponent],
  template: `
    <app-resoluciones-table
      [resoluciones]="resoluciones"
      [configuracion]="tableConfig"
      [cargando]="cargando"
      (configuracionChange)="onConfigChange($event)"
      (resolucionSeleccionada)="onResolucionSelected($event)"
      (accionEjecutada)="onAccionEjecutada($event)">
    </app-resoluciones-table>
  `
})
export class MiTabla {
  resoluciones: ResolucionConEmpresa[] = [];
  tableConfig: ResolucionTableConfig;
  cargando = false;

  constructor(private tableService: ResolucionesTableService) {
    this.tableConfig = this.tableService.getConfiguracion();
  }

  onConfigChange(config: ResolucionTableConfig) {
    this.tableConfig = config;
    this.tableService.guardarConfiguracion(config);
  }

  onResolucionSelected(resolucion: Resolucion) {
    console.log('Resolución seleccionada:', resolucion);
  }

  onAccionEjecutada(evento: {accion: string, resolucion: Resolucion}) {
    console.log('Acción:', evento.accion, 'Resolución:', evento.resolucion);
  }
}
```

### Ejemplo con Navegación

```typescript
import { Router } from '@angular/router';

export class MiTabla {
  constructor(
    private router: Router,
    private tableService: ResolucionesTableService
  ) {}

  onResolucionSelected(resolucion: Resolucion) {
    // Navegar a la vista de detalle
    this.router.navigate(['/resoluciones', resolucion.id]);
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
        this.confirmarEliminacion(evento.resolucion);
        break;
    }
  }

  verDetalle(resolucion: Resolucion) {
    this.router.navigate(['/resoluciones', resolucion.id]);
  }

  editarResolucion(resolucion: Resolucion) {
    this.router.navigate(['/resoluciones', resolucion.id, 'editar']);
  }

  confirmarEliminacion(resolucion: Resolucion) {
    if (confirm(`¿Eliminar resolución ${resolucion.numeroResolucion}?`)) {
      this.eliminarResolucion(resolucion);
    }
  }

  eliminarResolucion(resolucion: Resolucion) {
    // Lógica de eliminación
  }
}
```

### Ejemplo con Modal de Edición

```typescript
import { MatDialog } from '@angular/material/dialog';
import { EditarResolucionModalComponent } from './modals';

export class MiTabla {
  constructor(
    private dialog: MatDialog,
    private resolucionService: ResolucionService
  ) {}

  onAccionEjecutada(evento: {accion: string, resolucion: Resolucion}) {
    if (evento.accion === 'editar') {
      this.abrirModalEdicion(evento.resolucion);
    }
  }

  abrirModalEdicion(resolucion: Resolucion) {
    const dialogRef = this.dialog.open(EditarResolucionModalComponent, {
      width: '800px',
      data: { resolucion }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.actualizarResolucion(result);
      }
    });
  }

  actualizarResolucion(resolucion: Resolucion) {
    this.resolucionService.updateResolucion(resolucion.id, resolucion)
      .subscribe({
        next: () => {
          console.log('Resolución actualizada');
          this.cargarResoluciones();
        },
        error: (error) => console.error(error)
      });
  }
}
```

## 🔧 ColumnSelectorComponent

### Ejemplo Básico

```typescript
import { Component } from '@angular/core';
import { ColumnSelectorComponent } from './shared';

@Component({
  selector: 'app-mi-selector',
  standalone: true,
  imports: [ColumnSelectorComponent],
  template: `
    <app-column-selector
      [columnas]="columnasDisponibles"
      [columnasVisibles]="columnasActuales"
      (columnasChange)="onColumnasChange($event)"
      (restaurarDefecto)="onRestaurarDefecto()">
    </app-column-selector>
  `
})
export class MiSelector {
  columnasDisponibles: ColumnaDefinicion[] = [
    { key: 'numeroResolucion', label: 'Número', sortable: true, required: true, tipo: 'text' },
    { key: 'fechaEmision', label: 'Fecha', sortable: true, required: false, tipo: 'date' },
    { key: 'empresa', label: 'Empresa', sortable: true, required: false, tipo: 'empresa' },
    { key: 'tipoTramite', label: 'Tipo', sortable: true, required: false, tipo: 'badge' },
    { key: 'estado', label: 'Estado', sortable: true, required: false, tipo: 'badge' },
    { key: 'acciones', label: 'Acciones', sortable: false, required: true, tipo: 'actions' }
  ];

  columnasActuales: string[] = [
    'numeroResolucion',
    'fechaEmision',
    'empresa',
    'estado',
    'acciones'
  ];

  onColumnasChange(columnas: string[]) {
    console.log('Columnas seleccionadas:', columnas);
    this.columnasActuales = columnas;
    this.guardarPreferencias();
  }

  onRestaurarDefecto() {
    console.log('Restaurando configuración por defecto');
    this.columnasActuales = this.getColumnasDefecto();
  }

  getColumnasDefecto(): string[] {
    return this.columnasDisponibles.map(c => c.key);
  }

  guardarPreferencias() {
    localStorage.setItem('columnas-resoluciones', JSON.stringify(this.columnasActuales));
  }
}
```

### Ejemplo con Persistencia

```typescript
export class MiSelector implements OnInit {
  columnasActuales: string[] = [];

  ngOnInit() {
    this.cargarPreferencias();
  }

  cargarPreferencias() {
    const guardadas = localStorage.getItem('columnas-resoluciones');
    if (guardadas) {
      this.columnasActuales = JSON.parse(guardadas);
    } else {
      this.columnasActuales = this.getColumnasDefecto();
    }
  }

  onColumnasChange(columnas: string[]) {
    this.columnasActuales = columnas;
    this.guardarPreferencias();
  }

  guardarPreferencias() {
    localStorage.setItem('columnas-resoluciones', JSON.stringify(this.columnasActuales));
  }
}
```

## 🔄 SortableHeaderComponent

### Ejemplo Básico

```typescript
import { Component } from '@angular/core';
import { SortableHeaderComponent } from './shared';

@Component({
  selector: 'app-mi-header',
  standalone: true,
  imports: [SortableHeaderComponent],
  template: `
    <table>
      <thead>
        <tr>
          <th>
            <app-sortable-header
              [columna]="'numeroResolucion'"
              [label]="'Número'"
              [ordenamiento]="ordenamientoActual"
              (ordenar)="onOrdenar($event)">
            </app-sortable-header>
          </th>
          <th>
            <app-sortable-header
              [columna]="'fechaEmision'"
              [label]="'Fecha'"
              [ordenamiento]="ordenamientoActual"
              (ordenar)="onOrdenar($event)">
            </app-sortable-header>
          </th>
        </tr>
      </thead>
    </table>
  `
})
export class MiHeader {
  ordenamientoActual: OrdenamientoConfig[] = [];

  onOrdenar(columna: string) {
    console.log('Ordenar por:', columna);
    this.ordenamientoActual = this.toggleOrdenamiento(columna);
    this.aplicarOrdenamiento();
  }

  toggleOrdenamiento(columna: string): OrdenamientoConfig[] {
    const index = this.ordenamientoActual.findIndex(o => o.columna === columna);
    
    if (index === -1) {
      // Agregar orden ascendente
      return [...this.ordenamientoActual, { columna, direccion: 'asc' }];
    } else {
      const actual = this.ordenamientoActual[index];
      if (actual.direccion === 'asc') {
        // Cambiar a descendente
        return this.ordenamientoActual.map(o => 
          o.columna === columna ? { ...o, direccion: 'desc' as const } : o
        );
      } else {
        // Remover ordenamiento
        return this.ordenamientoActual.filter(o => o.columna !== columna);
      }
    }
  }

  aplicarOrdenamiento() {
    // Lógica de ordenamiento
  }
}
```

### Ejemplo con Ordenamiento Múltiple

```typescript
export class MiHeader {
  ordenamientoActual: OrdenamientoConfig[] = [];

  onOrdenar(columna: string, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      // Ordenamiento múltiple
      this.agregarOrdenamiento(columna);
    } else {
      // Ordenamiento simple
      this.ordenamientoActual = this.toggleOrdenamiento(columna);
    }
    this.aplicarOrdenamiento();
  }

  agregarOrdenamiento(columna: string) {
    const index = this.ordenamientoActual.findIndex(o => o.columna === columna);
    
    if (index === -1) {
      // Agregar nuevo ordenamiento
      this.ordenamientoActual.push({
        columna,
        direccion: 'asc',
        prioridad: this.ordenamientoActual.length + 1
      });
    } else {
      // Cambiar dirección o remover
      const actual = this.ordenamientoActual[index];
      if (actual.direccion === 'asc') {
        this.ordenamientoActual[index].direccion = 'desc';
      } else {
        this.ordenamientoActual.splice(index, 1);
        // Reajustar prioridades
        this.ordenamientoActual.forEach((o, i) => o.prioridad = i + 1);
      }
    }
  }
}
```

## 📅 DateRangePickerComponent

### Ejemplo Básico

```typescript
import { Component } from '@angular/core';
import { DateRangePickerComponent } from './shared';

@Component({
  selector: 'app-mi-picker',
  standalone: true,
  imports: [DateRangePickerComponent],
  template: `
    <app-date-range-picker
      [fechaInicio]="fechaInicio"
      [fechaFin]="fechaFin"
      [label]="'Fecha de Emisión'"
      (rangoChange)="onRangoChange($event)">
    </app-date-range-picker>
  `
})
export class MiPicker {
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  onRangoChange(rango: {inicio: Date | null, fin: Date | null}) {
    console.log('Rango seleccionado:', rango);
    this.fechaInicio = rango.inicio;
    this.fechaFin = rango.fin;
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    // Lógica de filtrado
  }
}
```

### Ejemplo con Rangos Predefinidos

```typescript
export class MiPicker {
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  seleccionarHoy() {
    const hoy = new Date();
    this.fechaInicio = hoy;
    this.fechaFin = hoy;
    this.aplicarFiltro();
  }

  seleccionarEstaSemana() {
    const hoy = new Date();
    const primerDia = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
    const ultimoDia = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + 6));
    
    this.fechaInicio = primerDia;
    this.fechaFin = ultimoDia;
    this.aplicarFiltro();
  }

  seleccionarEsteMes() {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    this.fechaInicio = primerDia;
    this.fechaFin = ultimoDia;
    this.aplicarFiltro();
  }

  seleccionarEsteAno() {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), 0, 1);
    const ultimoDia = new Date(hoy.getFullYear(), 11, 31);
    
    this.fechaInicio = primerDia;
    this.fechaFin = ultimoDia;
    this.aplicarFiltro();
  }
}
```

### Ejemplo con Validación

```typescript
export class MiPicker {
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  errorRango: string = '';

  onRangoChange(rango: {inicio: Date | null, fin: Date | null}) {
    this.fechaInicio = rango.inicio;
    this.fechaFin = rango.fin;
    
    if (this.validarRango()) {
      this.errorRango = '';
      this.aplicarFiltro();
    }
  }

  validarRango(): boolean {
    if (!this.fechaInicio || !this.fechaFin) {
      return true; // Permitir rangos parciales
    }

    if (this.fechaInicio > this.fechaFin) {
      this.errorRango = 'La fecha de inicio debe ser anterior a la fecha de fin';
      return false;
    }

    const diferenciaDias = Math.floor(
      (this.fechaFin.getTime() - this.fechaInicio.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diferenciaDias > 365) {
      this.errorRango = 'El rango no puede ser mayor a 1 año';
      return false;
    }

    return true;
  }
}
```

## 🔗 Integración Completa

### Ejemplo de Componente Completo

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ResolucionesFiltersComponent,
  ResolucionesTableComponent,
  ColumnSelectorComponent,
  SortableHeaderComponent,
  DateRangePickerComponent
} from './shared';
import { 
  ResolucionService,
  ResolucionesTableService,
  EmpresaService
} from './services';

@Component({
  selector: 'app-resoluciones-completo',
  standalone: true,
  imports: [
    CommonModule,
    ResolucionesFiltersComponent,
    ResolucionesTableComponent
  ],
  template: `
    <div class="resoluciones-container">
      <!-- Header con acciones -->
      <div class="header">
        <h1>Gestión de Resoluciones</h1>
        <div class="actions">
          <button (click)="exportarExcel()">Exportar Excel</button>
          <button (click)="exportarPDF()">Exportar PDF</button>
          <button (click)="crearResolucion()">Nueva Resolución</button>
        </div>
      </div>

      <!-- Filtros -->
      <app-resoluciones-filters
        [filtros]="filtrosActivos"
        [empresas]="empresas"
        [tiposTramite]="tiposTramite"
        [estados]="estados"
        (filtrosChange)="onFiltrosChange($event)"
        (limpiarFiltros)="onLimpiarFiltros()">
      </app-resoluciones-filters>

      <!-- Información de resultados -->
      <div class="info-resultados" *ngIf="!cargando">
        <p>
          Mostrando {{ resolucionesFiltradas.length }} de {{ resoluciones.length }} resoluciones
        </p>
      </div>

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
  `,
  styles: [`
    .resoluciones-container {
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .actions {
      display: flex;
      gap: 10px;
    }

    .info-resultados {
      margin: 10px 0;
      color: #666;
    }
  `]
})
export class ResolucionesCompletoComponent implements OnInit {
  // Datos
  resoluciones: ResolucionConEmpresa[] = [];
  resolucionesFiltradas: ResolucionConEmpresa[] = [];
  empresas: Empresa[] = [];

  // Configuración
  filtrosActivos: ResolucionFiltros = {};
  tableConfig: ResolucionTableConfig;
  
  // Estados
  cargando = false;
  exportando = false;

  // Opciones
  tiposTramite = ['PRIMIGENIA', 'RENOVACION', 'INCREMENTO_FLOTA', 'SUSTITUCION_VEHICULOS'];
  estados = ['APROBADA', 'EN_PROCESO', 'RECHAZADA', 'ANULADA', 'PENDIENTE'];

  constructor(
    private resolucionService: ResolucionService,
    private empresaService: EmpresaService,
    private tableService: ResolucionesTableService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.tableConfig = this.tableService.getConfiguracion();
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    
    // Cargar resoluciones y empresas en paralelo
    forkJoin({
      resoluciones: this.resolucionService.getResolucionesConEmpresa(),
      empresas: this.empresaService.getEmpresas()
    }).subscribe({
      next: (data) => {
        this.resoluciones = data.resoluciones;
        this.empresas = data.empresas;
        this.aplicarFiltrosYOrdenamiento();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
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
    this.router.navigate(['/resoluciones', resolucion.id]);
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
        this.confirmarEliminacion(evento.resolucion);
        break;
    }
  }

  verDetalle(resolucion: Resolucion) {
    this.router.navigate(['/resoluciones', resolucion.id]);
  }

  editarResolucion(resolucion: Resolucion) {
    const dialogRef = this.dialog.open(EditarResolucionModalComponent, {
      width: '800px',
      data: { resolucion }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarDatos();
      }
    });
  }

  confirmarEliminacion(resolucion: Resolucion) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Está seguro de eliminar la resolución ${resolucion.numeroResolucion}?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.eliminarResolucion(resolucion);
      }
    });
  }

  eliminarResolucion(resolucion: Resolucion) {
    this.resolucionService.deleteResolucion(resolucion.id)
      .subscribe({
        next: () => {
          console.log('Resolución eliminada');
          this.cargarDatos();
        },
        error: (error) => console.error(error)
      });
  }

  exportarExcel() {
    this.exportando = true;
    this.tableService.exportarExcel(this.resolucionesFiltradas, this.filtrosActivos);
    setTimeout(() => this.exportando = false, 1000);
  }

  exportarPDF() {
    this.exportando = true;
    this.tableService.exportarPDF(this.resolucionesFiltradas, this.filtrosActivos);
    setTimeout(() => this.exportando = false, 1000);
  }

  crearResolucion() {
    const dialogRef = this.dialog.open(CrearResolucionModalComponent, {
      width: '800px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarDatos();
      }
    });
  }
}
```

---

## 📚 Recursos Adicionales

- [README Principal](./README.md)
- [Guía de Usuario](./USER_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Testing Guide](./TESTING_GUIDE.md)

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0
