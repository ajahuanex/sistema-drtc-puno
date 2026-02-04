import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RutaService } from '../../services/ruta.service';
import { RutaUtilsService } from '../../services/ruta-utils.service';
import { EmpresaService } from '../../services/empresa.service';
import { ExportService } from '../../services/export.service';
import { Ruta } from '../../models/ruta.model';
import { Empresa } from '../../models/empresa.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RutaModalComponent, RutaModalData } from '../../shared/ruta-modal.component';
import { DetalleRutaModalComponent } from './detalle-ruta-modal.component';
import { FiltrosAvanzadosModalComponent, FiltrosAvanzados } from './filtros-avanzados-modal.component';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatChipsModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatDialogModule
  ],
  templateUrl: './rutas.component.html',
  styleUrls: ['./rutas.component.scss']
})
export class RutasComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private rutaService = inject(RutaService);
  private rutaUtilsService = inject(RutaUtilsService);
  private empresaService = inject(EmpresaService);
  private exportService = inject(ExportService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // Estados principales
  isLoading = signal(false);
  
  // Datos principales
  rutas = signal<Ruta[]>([]);
  empresas = signal<Empresa[]>([]);
  
  // Búsqueda simple
  terminoBusqueda = signal('');
  
  // Filtros avanzados
  filtrosAvanzados = signal<FiltrosAvanzados>({});
  
  // Paginación
  pageSize = signal(25);
  pageIndex = signal(0);
  
  // Selección múltiple
  rutasSeleccionadas = signal<Set<string>>(new Set());
  
  // Configuración de columnas
  columnasDisponibles = [
    { key: 'select', label: 'Seleccionar', visible: true, fixed: true },
    { key: 'empresa', label: 'Empresa', visible: false }, // No visible por defecto
    { key: 'ruc', label: 'RUC', visible: true },
    { key: 'resolucion', label: 'Resolución', visible: true },
    { key: 'codigoRuta', label: 'Código Ruta', visible: true },
    { key: 'origen', label: 'Origen', visible: true },
    { key: 'destino', label: 'Destino', visible: true },
    { key: 'itinerario', label: 'Itinerario', visible: true },
    { key: 'frecuencias', label: 'Frecuencias', visible: true },
    { key: 'tipoRuta', label: 'Tipo Ruta', visible: false },
    { key: 'tipoServicio', label: 'Tipo Servicio', visible: false },
    { key: 'estado', label: 'Estado', visible: true },
    { key: 'acciones', label: 'Acciones', visible: true, fixed: true }
  ];
  
  columnasVisibles = signal(this.columnasDisponibles.filter(col => col.visible));
  
  // Computed properties
  displayedColumns = computed(() => 
    this.columnasVisibles().map(col => col.key)
  );

  filtroActivo = computed(() => {
    const busqueda = this.terminoBusqueda();
    const filtros = this.filtrosAvanzados();
    const tieneFiltrosAvanzados = !!(filtros.origen || filtros.destino);
    
    if (busqueda && tieneFiltrosAvanzados) {
      return {
        tipo: 'busqueda-filtros',
        descripcion: `Búsqueda: "${busqueda}" + Filtros avanzados`
      };
    } else if (busqueda) {
      return {
        tipo: 'busqueda',
        descripcion: `Búsqueda: "${busqueda}"`
      };
    } else if (tieneFiltrosAvanzados) {
      return {
        tipo: 'filtros',
        descripcion: this.getDescripcionFiltrosAvanzados(filtros)
      };
    } else {
      return {
        tipo: 'todas',
        descripcion: 'Todas las Rutas del Sistema'
      };
    }
  });

  tieneFiltrosAvanzados = computed(() => {
    const filtros = this.filtrosAvanzados();
    return !!(filtros.origen || filtros.destino);
  });

  rutasFiltradas = computed(() => {
    let rutas = this.rutas();
    const busqueda = this.terminoBusqueda();
    const filtros = this.filtrosAvanzados();
    
    console.log('🔍 Filtrando rutas:', {
      totalRutas: rutas.length,
      terminoBusqueda: busqueda,
      filtrosAvanzados: filtros
    });
    
    // Aplicar filtros avanzados primero (más específicos)
    if (filtros.origen || filtros.destino) {
      rutas = this.aplicarFiltrosBidireccionales(rutas, filtros);
    }
    
    // Aplicar búsqueda de texto después
    if (busqueda && busqueda.trim().length > 0) {
      const terminoLower = busqueda.toLowerCase();
      const rutasAntes = rutas.length;
      rutas = rutas.filter(ruta => 
        ruta.codigoRuta.toLowerCase().includes(terminoLower) ||
        (ruta.nombre && ruta.nombre.toLowerCase().includes(terminoLower)) ||
        (ruta.descripcion && ruta.descripcion.toLowerCase().includes(terminoLower)) ||
        (ruta.empresa?.ruc && ruta.empresa.ruc.toLowerCase().includes(terminoLower)) ||
        this.getEmpresaNombre(ruta).toLowerCase().includes(terminoLower) ||
        (ruta.origen?.nombre && ruta.origen.nombre.toLowerCase().includes(terminoLower)) ||
        (ruta.destino?.nombre && ruta.destino.nombre.toLowerCase().includes(terminoLower)) ||
        (ruta.frecuencias && ruta.frecuencias.toLowerCase().includes(terminoLower)) ||
        (ruta.resolucion?.nroResolucion && ruta.resolucion.nroResolucion.toLowerCase().includes(terminoLower))
      );
      console.log('🔍 Después de búsqueda:', rutasAntes, '→', rutas.length);
    }
    
    return rutas;
  });

  rutasPaginadas = computed(() => {
    const rutas = this.rutasFiltradas();
    const pageSize = this.pageSize();
    const pageIndex = this.pageIndex();
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    
    return rutas.slice(startIndex, endIndex);
  });

  todasSeleccionadas = computed(() => {
    const rutasPagina = this.rutasPaginadas();
    const seleccionadas = this.rutasSeleccionadas();
    
    if (rutasPagina.length === 0) return false;
    return rutasPagina.every(ruta => seleccionadas.has(ruta.id));
  });

  ngOnInit(): void {
    this.cargarConfiguracionColumnas();
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async cargarDatos(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      const [empresas, rutas] = await Promise.all([
        this.empresaService.getEmpresas().pipe(takeUntil(this.destroy$)).toPromise(),
        this.rutaService.getRutas().pipe(takeUntil(this.destroy$)).toPromise()
      ]);
      
      this.empresas.set(empresas || []);
      this.rutas.set(rutas || []);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.snackBar.open('Error al cargar los datos', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  getNombreRuta(ruta: Ruta): string {
    return this.rutaUtilsService.getNombreRuta(ruta);
  }

  getEmpresaNombre(ruta: Ruta): string {
    return this.rutaUtilsService.getEmpresaNombre(ruta);
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA Y FILTROS
  // ========================================

  onBusquedaChange(event: any): void {
    const valor = event.target.value || '';
    console.log('🔍 Búsqueda cambiada:', valor);
    this.terminoBusqueda.set(valor);
    this.pageIndex.set(0);
  }

  buscarRutas(): void {
    this.pageIndex.set(0);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
    this.pageIndex.set(0);
  }

  // ========================================
  // MÉTODOS DE FILTROS AVANZADOS
  // ========================================

  abrirFiltrosAvanzados(): void {
    const dialogRef = this.dialog.open(FiltrosAvanzadosModalComponent, {
      width: '600px',
      data: {
        filtrosIniciales: this.filtrosAvanzados()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.filtrosAvanzados.set(result || {});
        this.pageIndex.set(0);
        
        if (result && Object.keys(result).length > 0) {
          this.snackBar.open('Filtros avanzados aplicados', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open('Filtros avanzados limpiados', 'Cerrar', { duration: 2000 });
        }
      }
    });
  }

  limpiarFiltrosAvanzados(): void {
    this.filtrosAvanzados.set({});
    this.pageIndex.set(0);
    this.snackBar.open('Filtros avanzados limpiados', 'Cerrar', { duration: 2000 });
  }

  limpiarTodo(): void {
    this.terminoBusqueda.set('');
    this.filtrosAvanzados.set({});
    this.pageIndex.set(0);
  }

  private aplicarFiltrosBidireccionales(rutas: Ruta[], filtros: FiltrosAvanzados): Ruta[] {
    const { origen, destino } = filtros;
    
    if (!origen && !destino) {
      return rutas;
    }
    
    const rutasAntes = rutas.length;
    
    const rutasFiltradas = rutas.filter(ruta => {
      const origenRuta = ruta.origen?.nombre?.toLowerCase() || '';
      const destinoRuta = ruta.destino?.nombre?.toLowerCase() || '';
      
      // Si solo hay origen, buscar en origen O destino
      if (origen && !destino) {
        const origenBusqueda = origen.toLowerCase();
        return origenRuta.includes(origenBusqueda) || destinoRuta.includes(origenBusqueda);
      }
      
      // Si solo hay destino, buscar en origen O destino
      if (destino && !origen) {
        const destinoBusqueda = destino.toLowerCase();
        return origenRuta.includes(destinoBusqueda) || destinoRuta.includes(destinoBusqueda);
      }
      
      // Si hay ambos, buscar bidireccional
      if (origen && destino) {
        const origenBusqueda = origen.toLowerCase();
        const destinoBusqueda = destino.toLowerCase();
        
        // Dirección normal: origen → destino
        const direccionNormal = origenRuta.includes(origenBusqueda) && destinoRuta.includes(destinoBusqueda);
        
        // Dirección inversa: destino → origen
        const direccionInversa = origenRuta.includes(destinoBusqueda) && destinoRuta.includes(origenBusqueda);
        
        return direccionNormal || direccionInversa;
      }
      
      return false;
    });
    
    console.log('🔍 Filtros bidireccionales aplicados:', rutasAntes, '→', rutasFiltradas.length, filtros);
    
    return rutasFiltradas;
  }

  private getDescripcionFiltrosAvanzados(filtros: FiltrosAvanzados): string {
    const partes: string[] = [];
    
    if (filtros.origen && filtros.destino) {
      partes.push(`${filtros.origen} ↔ ${filtros.destino}`);
    } else if (filtros.origen) {
      partes.push(`Origen/Destino: ${filtros.origen}`);
    } else if (filtros.destino) {
      partes.push(`Origen/Destino: ${filtros.destino}`);
    }
    
    return partes.length > 0 ? `Filtros: ${partes.join(', ')}` : 'Filtros avanzados';
  }

  getFiltrosActivosChips(): Array<{key: string, label: string, value: string}> {
    const filtros = this.filtrosAvanzados();
    const chips: Array<{key: string, label: string, value: string}> = [];
    
    if (filtros.origen) {
      chips.push({
        key: 'origen',
        label: 'Origen',
        value: filtros.origen
      });
    }
    
    if (filtros.destino) {
      chips.push({
        key: 'destino',
        label: 'Destino',
        value: filtros.destino
      });
    }
    
    return chips;
  }

  removerFiltro(key: string): void {
    const filtros = { ...this.filtrosAvanzados() };
    delete (filtros as any)[key];
    this.filtrosAvanzados.set(filtros);
    this.pageIndex.set(0);
  }

  // ========================================
  // MÉTODOS DE PAGINACIÓN
  // ========================================

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  // ========================================
  // MÉTODOS CRUD
  // ========================================

  recargarRutas(): void {
    this.cargarDatos();
  }

  nuevaRuta(): void {
    const dialogRef = this.dialog.open(RutaModalComponent, {
      width: '800px',
      disableClose: true,
      data: {
        titulo: 'Nueva Ruta',
        modoSimple: false
      } as RutaModalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.recargarRutas();
      }
    });
  }

  verDetalleRuta(ruta: Ruta): void {
    this.dialog.open(DetalleRutaModalComponent, {
      width: '600px',
      data: { ruta }
    });
  }

  editarRuta(ruta: Ruta): void {
    const dialogRef = this.dialog.open(RutaModalComponent, {
      width: '800px',
      data: {
        titulo: 'Editar Ruta',
        ruta: ruta,
        modoSimple: false
      } as RutaModalData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.recargarRutas();
      }
    });
  }

  eliminarRuta(ruta: Ruta): void {
    if (confirm(`¿Está seguro de eliminar la ruta ${ruta.codigoRuta}?`)) {
      this.rutaService.deleteRuta(ruta.id).subscribe({
        next: () => {
          this.snackBar.open('Ruta eliminada correctamente', 'Cerrar', { duration: 3000 });
          this.recargarRutas();
        },
        error: (error) => {
          console.error('Error al eliminar ruta:', error);
          this.snackBar.open('Error al eliminar la ruta', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  // ========================================
  // MÉTODOS DE SELECCIÓN MÚLTIPLE
  // ========================================

  toggleRutaSeleccionada(rutaId: string, seleccionada: boolean): void {
    const seleccionadas = new Set(this.rutasSeleccionadas());
    
    if (seleccionada) {
      seleccionadas.add(rutaId);
    } else {
      seleccionadas.delete(rutaId);
    }
    
    this.rutasSeleccionadas.set(seleccionadas);
  }

  toggleTodasSeleccionadas(seleccionar: boolean): void {
    const seleccionadas = new Set<string>();
    
    if (seleccionar) {
      this.rutasPaginadas().forEach(ruta => seleccionadas.add(ruta.id));
    }
    
    this.rutasSeleccionadas.set(seleccionadas);
  }

  limpiarSeleccion(): void {
    this.rutasSeleccionadas.set(new Set());
  }

  eliminarSeleccionadas(): void {
    const seleccionadas = Array.from(this.rutasSeleccionadas());
    if (seleccionadas.length === 0) return;

    const confirmacion = confirm(`¿Está seguro de eliminar ${seleccionadas.length} ruta(s) seleccionada(s)?`);
    if (!confirmacion) return;

    console.log('Eliminando rutas:', seleccionadas);
    this.snackBar.open(`${seleccionadas.length} rutas eliminadas`, 'Cerrar', { duration: 3000 });
    this.limpiarSeleccion();
    this.recargarRutas();
  }

  exportarSeleccionadas(): void {
    const idsSeleccionados = Array.from(this.rutasSeleccionadas());
    
    if (idsSeleccionados.length === 0) {
      this.snackBar.open('No hay rutas seleccionadas para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    // Usar rutasFiltradas() que incluye TODAS las rutas después de aplicar filtros
    const rutasDisponibles = this.rutasFiltradas();
    const rutasParaExportar = rutasDisponibles.filter(ruta => idsSeleccionados.includes(ruta.id));
    
    if (rutasParaExportar.length === 0) {
      this.snackBar.open('Error: No se encontraron las rutas seleccionadas', 'Cerrar', { duration: 3000 });
      return;
    }

    const columnasVisibles = this.getColumnasVisiblesParaExportacion();
    
    this.exportService.exportToExcel(rutasParaExportar, {
      filename: 'rutas_seleccionadas',
      customColumns: columnasVisibles
    });
    
    this.snackBar.open(`${rutasParaExportar.length} rutas exportadas con ${columnasVisibles.length} columnas`, 'Cerrar', { duration: 3000 });
  }

  // ========================================
  // MÉTODOS DE CONFIGURACIÓN DE COLUMNAS
  // ========================================

  toggleColumna(columnaKey: string, visible: boolean): void {
    const columna = this.columnasDisponibles.find(col => col.key === columnaKey);
    if (columna) {
      columna.visible = visible;
      this.actualizarColumnasVisibles();
      this.guardarConfiguracionColumnas();
    }
  }

  resetearColumnas(): void {
    this.columnasDisponibles.forEach(col => {
      col.visible = ['select', 'ruc', 'resolucion', 'codigoRuta', 'origen', 'destino', 'itinerario', 'frecuencias', 'estado', 'acciones'].includes(col.key);
    });
    this.actualizarColumnasVisibles();
    this.guardarConfiguracionColumnas();
  }

  private actualizarColumnasVisibles(): void {
    this.columnasVisibles.set(this.columnasDisponibles.filter(col => col.visible));
  }

  private cargarConfiguracionColumnas(): void {
    try {
      const config = localStorage.getItem('rutas_columnas_config');
      if (config) {
        const configuracion = JSON.parse(config);
        this.columnasDisponibles.forEach(col => {
          if (configuracion[col.key] !== undefined) {
            col.visible = configuracion[col.key];
          }
        });
        this.actualizarColumnasVisibles();
      }
    } catch (error) {
      console.error('Error cargando configuración de columnas:', error);
    }
  }

  private guardarConfiguracionColumnas(): void {
    try {
      const configuracion: { [key: string]: boolean } = {};
      this.columnasDisponibles.forEach(col => {
        configuracion[col.key] = col.visible;
      });
      localStorage.setItem('rutas_columnas_config', JSON.stringify(configuracion));
    } catch (error) {
      console.error('Error guardando configuración de columnas:', error);
    }
  }

  // ========================================
  // MÉTODOS DE EXPORTACIÓN
  // ========================================

  exportarTodas(formato: 'excel' | 'csv'): void {
    const rutas = this.rutasFiltradas();
    
    if (rutas.length === 0) {
      this.snackBar.open('No hay rutas para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const columnasVisibles = this.getColumnasVisiblesParaExportacion();
    const filename = `rutas_${new Date().toISOString().slice(0, 10)}`;

    switch (formato) {
      case 'excel':
        this.exportService.exportToExcel(rutas, { 
          filename,
          customColumns: columnasVisibles
        });
        break;
      case 'csv':
        this.exportService.exportToCSV(rutas, { 
          filename,
          customColumns: columnasVisibles
        });
        break;
    }

    this.snackBar.open(`${rutas.length} rutas exportadas a ${formato.toUpperCase()} con ${columnasVisibles.length} columnas`, 'Cerrar', { duration: 3000 });
  }

  /**
   * Obtiene las columnas visibles para exportación
   */
  private getColumnasVisiblesParaExportacion(): string[] {
    const mapeoColumnas: { [key: string]: string } = {
      'empresa': 'Empresa',
      'ruc': 'RUC',
      'resolucion': 'Resolución',
      'codigoRuta': 'Código Ruta',
      'origen': 'Origen',
      'destino': 'Destino',
      'itinerario': 'Itinerario',
      'frecuencias': 'Frecuencias',
      'tipoRuta': 'Tipo Ruta',
      'tipoServicio': 'Tipo Servicio',
      'estado': 'Estado'
    };

    return this.columnasVisibles()
      .filter(col => col.key !== 'select' && col.key !== 'acciones') // Excluir columnas de UI
      .map(col => mapeoColumnas[col.key])
      .filter(col => col !== undefined); // Solo columnas que tienen mapeo
  }
}