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
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
import { SeleccionarEmpresaResolucionDialogComponent } from '../../shared/seleccionar-empresa-resolucion-dialog.component';
import { VerificarCoordenadasModalComponent } from './verificar-coordenadas-modal.component';
import { CorregirCoordenadasModalComponent } from './corregir-coordenadas-modal.component';

// Interfaz temporal para filtros avanzados
interface FiltrosAvanzados {
  empresaId?: string;
  resolucionId?: string;
  tipoRuta?: string;
  tipoServicio?: string;
  estado?: string;
  origenId?: string;
  destinoId?: string;
}

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

  // Referencia al modal de verificación para mantenerlo abierto
  private modalVerificacionRef: MatDialogRef<VerificarCoordenadasModalComponent> | null = null;

  // Historial de modificaciones de coordenadas (últimas 3)
  private historialModificaciones: Array<{
    timestamp: Date;
    tipo: 'reemplazo' | 'desactivacion';
    rutaId: string;
    codigoRuta: string;
    descripcion: string;
    datosAnteriores: any;
  }> = [];

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
    const tieneFiltrosAvanzados = !!(filtros.origenId || filtros.destinoId);

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
    return !!(filtros.origenId || filtros.destinoId);
  });

  rutasFiltradas = computed(() => {
    let rutas = this.rutas();
    const busqueda = this.terminoBusqueda();
    const filtros = this.filtrosAvanzados();

    // Aplicar filtros avanzados primero (más específicos)
    if (filtros.origenId || filtros.destinoId) {
      rutas = this.aplicarFiltrosBidireccionales(rutas, filtros);
    }

    // Aplicar búsqueda de texto después
    if (busqueda && busqueda.trim().length > 0) {
      // Limpiar el término de búsqueda: remover comillas y espacios extra
      const terminoLower = busqueda.replace(/['"]/g, '').trim().toLowerCase();
      rutas = rutas.filter(ruta =>
        ruta.codigoRuta.toLowerCase().includes(terminoLower) ||
        (ruta.nombre && ruta.nombre.toLowerCase().includes(terminoLower)) ||
        (ruta.descripcion && ruta.descripcion.toLowerCase().includes(terminoLower)) ||
        (ruta.empresa?.ruc && ruta.empresa.ruc.toLowerCase().includes(terminoLower)) ||
        this.getEmpresaNombre(ruta).toLowerCase().includes(terminoLower) ||
        (ruta.origen?.nombre && ruta.origen.nombre.toLowerCase().includes(terminoLower)) ||
        (ruta.destino?.nombre && ruta.destino.nombre.toLowerCase().includes(terminoLower)) ||
        this.getItinerarioFormateado(ruta).toLowerCase().includes(terminoLower) ||
        (ruta.frecuencia?.descripcion && ruta.frecuencia.descripcion.toLowerCase().includes(terminoLower)) ||
        (ruta.resolucion?.nroResolucion && ruta.resolucion.nroResolucion.toLowerCase().includes(terminoLower))
      );
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
      console.error('❌ [RUTAS] Error al cargar datos:', error);
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

  getItinerarioFormateado(ruta: Ruta): string {
    if (!ruta.itinerario || ruta.itinerario.length === 0) {
      return 'Sin itinerario';
    }

    // Ordenar por el campo 'orden' y extraer los nombres
    const localidades = [...ruta.itinerario]
      .sort((a, b) => a.orden - b.orden)
      .map(loc => loc.nombre);

    return localidades.join(' - ');
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA Y FILTROS
  // ========================================

  onBusquedaChange(event: any): void {
    const valor = event.target.value || '';
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
    this.snackBar.open('Filtros avanzados en desarrollo', 'Cerrar', { duration: 3000 });
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
    const { origenId, destinoId } = filtros;

    if (!origenId && !destinoId) {
      return rutas;
    }

    const rutasFiltradas = rutas.filter(ruta => {
      const origenRuta = ruta.origen?.id || '';
      const destinoRuta = ruta.destino?.id || '';

      // Si solo hay origen, buscar en origen O destino
      if (origenId && !destinoId) {
        return origenRuta === origenId || destinoRuta === origenId;
      }

      // Si solo hay destino, buscar en origen O destino
      if (destinoId && !origenId) {
        return origenRuta === destinoId || destinoRuta === destinoId;
      }

      // Si hay ambos, buscar bidireccional
      if (origenId && destinoId) {
        // Dirección normal: origen → destino
        const direccionNormal = origenRuta === origenId && destinoRuta === destinoId;

        // Dirección inversa: destino → origen
        const direccionInversa = origenRuta === destinoId && destinoRuta === origenId;

        return direccionNormal || direccionInversa;
      }

      return false;
    });

    return rutasFiltradas;
  }

  private getDescripcionFiltrosAvanzados(filtros: FiltrosAvanzados): string {
    const partes: string[] = [];

    if (filtros.origenId && filtros.destinoId) {
      partes.push(`${filtros.origenId} ↔ ${filtros.destinoId}`);
    } else if (filtros.origenId) {
      partes.push(`Origen/Destino: ${filtros.origenId}`);
    } else if (filtros.destinoId) {
      partes.push(`Origen/Destino: ${filtros.destinoId}`);
    }

    return partes.length > 0 ? `Filtros: ${partes.join(', ')}` : 'Filtros avanzados';
  }

  getFiltrosActivosChips(): Array<{ key: string, label: string, value: string }> {
    const filtros = this.filtrosAvanzados();
    const chips: Array<{ key: string, label: string, value: string }> = [];

    if (filtros.origenId) {
      chips.push({
        key: 'origenId',
        label: 'Origen',
        value: filtros.origenId
      });
    }

    if (filtros.destinoId) {
      chips.push({
        key: 'destinoId',
        label: 'Destino',
        value: filtros.destinoId
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
    // Primero abrir diálogo para seleccionar empresa y resolución
    const dialogRef = this.dialog.open(SeleccionarEmpresaResolucionDialogComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.empresa && result.resolucion) {
        // Cargar las rutas existentes de esta resolución
        this.rutaService.getRutasPorResolucion(result.resolucion.id).subscribe({
          next: (rutasExistentes) => {
            // Ahora abrir el modal de crear ruta con la empresa, resolución y rutas existentes
            const rutaDialogRef = this.dialog.open(RutaModalComponent, {
              width: '900px',
              data: {
                titulo: 'Nueva Ruta',
                empresa: result.empresa,
                resolucion: result.resolucion,
                rutasExistentes: rutasExistentes || [],
                modoSimple: false
              } as RutaModalData
            });

            rutaDialogRef.afterClosed().subscribe(ruta => {
              if (ruta) {
                this.recargarRutas();
              }
            });
          },
          error: (error) => {
            console.error('Error cargando rutas de la resolución:', error);
            // Continuar sin rutas existentes
            const rutaDialogRef = this.dialog.open(RutaModalComponent, {
              width: '900px',
              data: {
                titulo: 'Nueva Ruta',
                empresa: result.empresa,
                resolucion: result.resolucion,
                rutasExistentes: [],
                modoSimple: false
              } as RutaModalData
            });

            rutaDialogRef.afterClosed().subscribe(ruta => {
              if (ruta) {
                this.recargarRutas();
              }
            });
          }
        });
      }
    });
  }

  verDetalleRuta(ruta: Ruta): void {
    // Obtener el nombre de la empresa correctamente
    let empresaNombre = 'N/A';
    if (ruta.empresa?.razonSocial) {
      if (typeof ruta.empresa.razonSocial === 'string') {
        empresaNombre = ruta.empresa.razonSocial;
      } else if (typeof ruta.empresa.razonSocial === 'object' && ruta.empresa.razonSocial.principal) {
        empresaNombre = ruta.empresa.razonSocial.principal;
      }
    }

    this.dialog.open(DetalleRutaModalComponent, {
      width: '600px',
      data: {
        ruta,
        empresaNombre,
        resolucionNumero: ruta.resolucion?.nroResolucion || 'N/A'
      }
    });
  }

  editarRuta(ruta: Ruta): void {
    const dialogRef = this.dialog.open(RutaModalComponent, {
      width: '800px',
      data: {
        titulo: 'Editar Ruta',
        ruta: ruta,
        empresa: ruta.empresa,
        resolucion: ruta.resolucion,
        modoSimple: false
      } as RutaModalData
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
      .filter(col => col.key !== 'select' && col.key !== 'acciones')
      .map(col => mapeoColumnas[col.key])
      .filter(col => col !== undefined);
  }

  // ========================================
  // VERIFICACIÓN DE COORDENADAS
  // ========================================

  /**
   * Verificar que todas las rutas tengan coordenadas desde el módulo de localidades
   */
  async verificarCoordenadasRutas(): Promise<void> {
    this.isLoading.set(true);

    try {
      const resultado = await this.rutaService.verificarCoordenadasRutas().toPromise();

      if (!resultado) {
        this.snackBar.open('No se pudo verificar las coordenadas', 'Cerrar', { duration: 3000 });
        return;
      }

      this.isLoading.set(false);
      
      // Abrir modal con resultados
      this.abrirModalVerificacion(resultado);

    } catch (error) {
      console.error('Error verificando coordenadas:', error);
      this.snackBar.open('Error al verificar coordenadas de rutas', 'Cerrar', { duration: 3000 });
      this.isLoading.set(false);
    }
  }

  /**
   * Abrir modal de verificación de coordenadas (puede ser llamado recursivamente)
   */
  private abrirModalVerificacion(resultado: any): void {
    // Si ya hay un modal abierto, actualizarlo en lugar de abrir uno nuevo
    if (this.modalVerificacionRef) {
      this.modalVerificacionRef.componentInstance.data = resultado;
      return;
    }

    // Agregar historial al resultado
    (resultado as any).historial = this.historialModificaciones;

    this.modalVerificacionRef = this.dialog.open(VerificarCoordenadasModalComponent, {
      width: '800px',
      data: resultado,
      disableClose: false
    });

    this.modalVerificacionRef.afterClosed().subscribe(async (action: any) => {
      this.modalVerificacionRef = null; // Limpiar referencia
      
      if (action === 'sincronizar') {
        await this.sincronizarLocalidades();
        // Volver a verificar después de sincronizar
        this.verificarCoordenadasRutas();
      } else if (action && action.action === 'corregir') {
        // Abrir modal de corrección SIN cerrar el modal de verificación
        this.abrirModalCorreccionCoordenadasConContexto(action.ruta, resultado);
      } else if (action && action.action === 'revertir') {
        // Revertir modificación
        await this.revertirModificacion(action.modificacion);
      }
    });
  }

  /**
   * Abrir modal de corrección manteniendo el contexto del modal de verificación
   */
  private async abrirModalCorreccionCoordenadasConContexto(rutaData: any, resultadoVerificacion: any): Promise<void> {
    // Guardar estado actual de la ruta antes de modificar
    const rutaActual = await this.rutaService.getRutaById(rutaData.ruta_id).toPromise();
    
    const dialogRef = this.dialog.open(CorregirCoordenadasModalComponent, {
      width: '700px',
      data: rutaData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        if (result.action === 'localidad_reemplazada') {
          // Agregar al historial
          this.agregarAlHistorial({
            timestamp: new Date(),
            tipo: 'reemplazo',
            rutaId: rutaData.ruta_id,
            codigoRuta: rutaData.codigo_ruta,
            descripcion: `Localidad reemplazada en ruta ${rutaData.codigo_ruta}`,
            datosAnteriores: {
              origen: rutaActual?.origen,
              destino: rutaActual?.destino,
              itinerario: rutaActual?.itinerario,
              estaActivo: rutaActual?.estaActivo,
              estado: rutaActual?.estado
            }
          });

          this.snackBar.open('Localidad reemplazada correctamente', 'Cerrar', { duration: 2000 });
          
          // Recargar datos
          this.isLoading.set(true);
          await this.cargarDatos();
          
          // Volver a verificar y actualizar el modal
          try {
            const nuevoResultado = await this.rutaService.verificarCoordenadasRutas().toPromise();
            
            if (nuevoResultado) {
              // Reabrir el modal de verificación con datos actualizados
              setTimeout(() => {
                this.abrirModalVerificacion(nuevoResultado);
              }, 500);
            }
          } catch (error) {
            console.error('Error re-verificando coordenadas:', error);
          } finally {
            this.isLoading.set(false);
          }
          
        } else if (result.action === 'ruta_desactivada') {
          // Agregar al historial
          this.agregarAlHistorial({
            timestamp: new Date(),
            tipo: 'desactivacion',
            rutaId: rutaData.ruta_id,
            codigoRuta: rutaData.codigo_ruta,
            descripcion: `Ruta ${rutaData.codigo_ruta} desactivada`,
            datosAnteriores: {
              origen: rutaActual?.origen,
              destino: rutaActual?.destino,
              itinerario: rutaActual?.itinerario,
              estaActivo: rutaActual?.estaActivo,
              estado: rutaActual?.estado
            }
          });

          this.snackBar.open('Ruta desactivada correctamente', 'Cerrar', { duration: 2000 });
          
          // Recargar datos
          this.isLoading.set(true);
          await this.cargarDatos();
          
          // Volver a verificar y actualizar el modal
          try {
            const nuevoResultado = await this.rutaService.verificarCoordenadasRutas().toPromise();
            
            if (nuevoResultado) {
              // Reabrir el modal de verificación con datos actualizados
              setTimeout(() => {
                this.abrirModalVerificacion(nuevoResultado);
              }, 500);
            }
          } catch (error) {
            console.error('Error re-verificando coordenadas:', error);
          } finally {
            this.isLoading.set(false);
          }
        }
      } else {
        // Si se canceló, volver a abrir el modal de verificación con historial
        (resultadoVerificacion as any).historial = this.historialModificaciones;
        setTimeout(() => {
          this.abrirModalVerificacion(resultadoVerificacion);
        }, 100);
      }
    });
  }

  /**
   * Agregar modificación al historial (mantener solo las últimas 3)
   */
  private agregarAlHistorial(modificacion: any): void {
    this.historialModificaciones.unshift(modificacion);
    if (this.historialModificaciones.length > 3) {
      this.historialModificaciones.pop();
    }
  }

  /**
   * Revertir una modificación del historial
   */
  async revertirModificacion(modificacion: any): Promise<void> {
    const confirmacion = confirm(
      `¿Revertir la modificación?\n\n${modificacion.descripcion}\n\nEsto restaurará el estado anterior de la ruta.`
    );

    if (!confirmacion) return;

    this.isLoading.set(true);
    try {
      // Restaurar datos anteriores
      await this.rutaService.updateRuta(modificacion.rutaId, {
        origen: modificacion.datosAnteriores.origen,
        destino: modificacion.datosAnteriores.destino,
        itinerario: modificacion.datosAnteriores.itinerario,
        estaActivo: modificacion.datosAnteriores.estaActivo,
        estado: modificacion.datosAnteriores.estado
      }).toPromise();

      // Eliminar del historial
      const index = this.historialModificaciones.indexOf(modificacion);
      if (index > -1) {
        this.historialModificaciones.splice(index, 1);
      }

      this.snackBar.open('Modificación revertida correctamente', 'Cerrar', { duration: 2000 });

      // Recargar y volver a verificar
      await this.cargarDatos();
      const nuevoResultado = await this.rutaService.verificarCoordenadasRutas().toPromise();
      
      if (nuevoResultado) {
        (nuevoResultado as any).historial = this.historialModificaciones;
        setTimeout(() => {
          this.abrirModalVerificacion(nuevoResultado);
        }, 500);
      }
    } catch (error) {
      console.error('Error revirtiendo modificación:', error);
      this.snackBar.open('Error al revertir la modificación', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Sincronizar todas las rutas con información completa de localidades
   */
  async sincronizarLocalidades(): Promise<void> {
    const confirmacion = confirm(
      '¿Deseas sincronizar todas las rutas con la información completa de localidades?\n\n' +
      'Esto actualizará los campos: tipo, ubigeo, departamento, provincia, distrito y coordenadas.'
    );

    if (!confirmacion) return;

    this.isLoading.set(true);

    try {
      const resultado = await this.rutaService.sincronizarLocalidades().toPromise();

      if (!resultado) {
        this.snackBar.open('No se pudo sincronizar las localidades', 'Cerrar', { duration: 3000 });
        return;
      }

      console.log('SINCRONIZACIÓN COMPLETADA:', resultado);
      
      const mensaje = `Sincronización completada: ${resultado.rutas_actualizadas || 0} de ${resultado.total_rutas || 0} rutas actualizadas`;
      this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });

      // Recargar rutas para ver los cambios
      await this.cargarDatos();

    } catch (error) {
      console.error('Error sincronizando localidades:', error);
      this.snackBar.open('Error al sincronizar localidades', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Verificar el estado de sincronización de localidades
   */
  async verificarEstadoSincronizacion(): Promise<void> {
    this.isLoading.set(true);

    try {
      const resultado = await this.rutaService.verificarSincronizacionLocalidades().toPromise();

      if (!resultado) {
        this.snackBar.open('No se pudo verificar el estado', 'Cerrar', { duration: 3000 });
        return;
      }

      const porcentaje = resultado.porcentaje_completo || 0;
      const mensaje = `Estado: ${resultado.rutas_con_info_completa || 0} de ${resultado.total_rutas || 0} rutas sincronizadas (${porcentaje.toFixed(1)}%)`;
      
      this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });

      if (resultado.necesita_sincronizacion) {
        const confirmar = confirm(
          `Se encontraron ${resultado.total_rutas - resultado.rutas_con_info_completa} rutas que necesitan sincronización.\n\n` +
          `¿Deseas sincronizarlas ahora?`
        );

        if (confirmar) {
          await this.sincronizarLocalidades();
        }
      }

    } catch (error) {
      console.error('Error verificando estado:', error);
      this.snackBar.open('Error al verificar estado de sincronización', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }
}
