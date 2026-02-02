import { Component, OnInit, inject, signal, computed, effect, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { VehiculoConsolidadoService, BusquedaSugerencia, ResultadoBusquedaGlobal } from '../../services/vehiculo-consolidado.service';
import { EmpresaService } from '../../services/empresa.service';
import { RutaService } from '../../services/ruta.service';
import { SolicitudBajaService } from '../../services/solicitud-baja.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Ruta } from '../../models/ruta.model';
import { SolicitudBajaCreate, MotivoBaja } from '../../models/solicitud-baja.model';
import { VehiculoModalComponent } from './vehiculo-modal.component';
import { HistorialVehicularComponent } from './historial-vehicular.component';
import { VehiculosEliminadosModalComponent } from './vehiculos-eliminados-modal.component';
import { VehiculoDetalleComponent } from './vehiculo-detalle.component';
import { CambiarEstadoBloqueModalComponent } from './cambiar-estado-bloque-modal.component';
import { CargaMasivaVehiculosComponent } from './carga-masiva-vehiculos.component';
import { GestionarRutasEspecificasModalComponent } from './gestionar-rutas-especificas-modal.component';
import { TransferirEmpresaModalComponent } from './transferir-empresa-modal.component';
import { SolicitarBajaVehiculoUnifiedComponent } from './solicitar-baja-vehiculo-unified.component';
import { VehiculoEstadoSelectorComponent } from './vehiculo-estado-selector.component';
import { debounceTime, distinctUntilChanged, startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

/**
 * COMPONENTE CONSOLIDADO DE VEHÍCULOS
 * 
 * Características principales:
 * - Interfaz moderna y responsiva
 * - Búsqueda inteligente con sugerencias
 * - Filtros avanzados con persistencia
 * - Gestión de estados en lote
 * - Estadísticas en tiempo real
 * - Cache inteligente
 * - Herramientas de diagnóstico
 * - Carga masiva optimizada
 * - Historial automático
 */
@Component({
  selector: 'app-vehiculos-consolidado',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatTabsModule,
    MatBadgeModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatButtonToggleModule,
    VehiculoEstadoSelectorComponent
  ],
  templateUrl: './vehiculos-consolidado.component.html',
  styleUrls: ['./vehiculos-consolidado.component.scss']
})
export class VehiculosConsolidadoComponent implements OnInit {
  private vehiculoService = inject(VehiculoConsolidadoService);
  private empresaService = inject(EmpresaService);
  private rutaService = inject(RutaService);
  private solicitudBajaService = inject(SolicitudBajaService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ========================================
  // ESTADO DEL COMPONENTE CON SIGNALS
  // ========================================

  // Datos principales
  vehiculos = signal<Vehiculo[]>([]);
  empresas = signal<Empresa[]>([]);
  rutas = signal<Ruta[]>([]);
  
  // Estados de carga
  cargando = signal(false);
  cargandoBusqueda = signal(false);
  cargandoEstadisticas = signal(false);
  
  // Selección y filtros
  vehiculosSeleccionados = signal<Set<string>>(new Set());
  filtrosActivos = signal<any>({});
  
  // Búsqueda inteligente
  terminoBusqueda = signal('');
  resultadosBusqueda = signal<ResultadoBusquedaGlobal>({
    vehiculos: [],
    sugerencias: [],
    totalResultados: 0,
    terminoBusqueda: ''
  });
  
  // Estadísticas
  estadisticas = signal<any>({
    total: 0,
    activos: 0,
    inactivos: 0,
    porEstado: {},
    porEmpresa: {},
    porMarca: {},
    porModelo: {},
    tendenciaMensual: []
  });

  // Configuración de vista
  vistaActual = signal<'tabla' | 'tarjetas' | 'estadisticas'>('tabla');
  mostrarFiltrosAvanzados = signal(false);
  mostrarDiagnostico = signal(false);
  
  // Paginación
  paginaActual = signal(0);
  elementosPorPagina = signal(25);
  opcionesPaginacion = [10, 25, 50, 100];

  // ========================================
  // FORMULARIOS Y CONFIGURACIÓN
  // ========================================

  // Formulario de búsqueda
  formBusqueda = this.fb.group({
    termino: [''],
    campos: [['placa', 'marca', 'modelo', 'empresa']]
  });

  // Formulario de filtros avanzados
  formFiltros = this.fb.group({
    placa: [''],
    marca: [''],
    modelo: [''],
    empresaId: [''],
    estado: [''],
    categoria: [''],
    anioDesde: [''],
    anioHasta: [''],
    fechaRegistroDesde: [''],
    fechaRegistroHasta: [''],
    mostrarEliminados: [false],
    soloConRutas: [false],
    soloSinRutas: [false]
  });

  // Configuración de tabla
  columnasTabla = [
    'seleccionar',
    'placa',
    'marca',
    'modelo',
    'empresa',
    'estado',
    'categoria',
    'rutas',
    'fechaRegistro',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Vehiculo>([]);

  // Estados disponibles
  estadosVehiculo = [
    { valor: 'ACTIVO', etiqueta: 'Activo', color: 'primary' },
    { valor: 'INACTIVO', etiqueta: 'Inactivo', color: 'warn' },
    { valor: 'SUSPENDIDO', etiqueta: 'Suspendido', color: 'accent' },
    { valor: 'EN_REVISION', etiqueta: 'En Revisión', color: 'basic' },
    { valor: 'DADO_DE_BAJA', etiqueta: 'Dado de Baja', color: 'warn' }
  ];

  // Categorías de vehículos
  categoriasVehiculo = ['M1', 'M2', 'M3', 'N1', 'N2', 'N3'];

  // ========================================
  // COMPUTED PROPERTIES
  // ========================================

  // Vehículos filtrados
  vehiculosFiltrados = computed(() => {
    const vehiculos = this.vehiculos();
    const filtros = this.filtrosActivos();
    const termino = this.terminoBusqueda();

    let resultado = vehiculos;

    // Aplicar búsqueda si hay término
    if (termino) {
      const resultados = this.resultadosBusqueda();
      resultado = resultados.vehiculos;
    }

    // Aplicar filtros adicionales
    if (Object.keys(filtros).length > 0) {
      resultado = resultado.filter(vehiculo => this.aplicarFiltros(vehiculo, filtros));
    }

    return resultado;
  });

  // Estadísticas computadas
  estadisticasComputadas = computed(() => {
    const vehiculos = this.vehiculosFiltrados();
    return {
      total: vehiculos.length,
      seleccionados: this.vehiculosSeleccionados().size,
      porEstado: this.contarPorEstado(vehiculos),
      porEmpresa: this.contarPorEmpresa(vehiculos),
      porMarca: this.contarPorMarca(vehiculos)
    };
  });

  // Información del cache
  infoCache = computed(() => {
    return this.vehiculoService.getCacheStats();
  });

  // Estados de carga
  estadosCarga = computed(() => {
    return this.vehiculoService.getLoadingStates();
  });

  // ========================================
  // OBSERVABLES PARA AUTOCOMPLETADO
  // ========================================

  sugerenciasBusqueda$: Observable<BusquedaSugerencia[]> = this.formBusqueda.get('termino')!.valueChanges.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
    map(termino => {
      if (!termino || termino.length < 2) {
        return [];
      }
      return this.resultadosBusqueda().sugerencias.slice(0, 5);
    })
  );

  // ========================================
  // EFFECTS PARA REACTIVIDAD
  // ========================================

  constructor() {
    // Effect para actualizar la tabla cuando cambian los datos
    effect(() => {
      const vehiculos = this.vehiculosFiltrados();
      this.dataSource.data = vehiculos;
      
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    });

    // Effect para búsqueda en tiempo real
    effect(() => {
      const termino = this.formBusqueda.get('termino')?.value;
      if (termino && termino.length >= 2) {
        this.realizarBusqueda(termino);
      } else if (!termino) {
        this.limpiarBusqueda();
      }
    });

    // Effect para persistir filtros
    effect(() => {
      const filtros = this.filtrosActivos();
      if (Object.keys(filtros).length > 0) {
        localStorage.setItem('vehiculos-filtros', JSON.stringify(filtros));
      }
    });
  }

  // ========================================
  // LIFECYCLE HOOKS
  // ========================================

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.configurarFormularios();
    this.restaurarFiltros();
    this.cargarEstadisticas();
  }

  ngAfterViewInit(): void {
    // Configurar paginador y ordenamiento
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configurar filtro personalizado
    this.dataSource.filterPredicate = (data: Vehiculo, filter: string) => {
      return this.aplicarFiltroTexto(data, filter);
    };
  }

  // ========================================
  // MÉTODOS DE CARGA DE DATOS
  // ========================================

  private async cargarDatosIniciales(): Promise<void> {
    this.cargando.set(true);
    
    try {
      // Cargar vehículos con cache
      this.vehiculoService.getVehiculos().subscribe({
        next: (vehiculos) => {
          this.vehiculos.set(vehiculos);
        },
        error: (error) => {
          console.error('❌ [VEHICULOS-CONSOLIDADO] Error cargando vehículos::', error);
          this.mostrarError('Error cargando vehículos');
        }
      });

      // Cargar empresas
      this.empresaService.getEmpresas().subscribe({
        next: (empresas) => {
          this.empresas.set(empresas);
        },
        error: (error) => {
          console.error('❌ [VEHICULOS-CONSOLIDADO] Error cargando empresas::', error);
        }
      });

      // Cargar rutas
      this.rutaService.getRutas().subscribe({
        next: (rutas) => {
          this.rutas.set(rutas);
        },
        error: (error) => {
          console.error('❌ [VEHICULOS-CONSOLIDADO] Error cargando rutas::', error);
        }
      });

    } catch (error) {
      console.error('❌ [VEHICULOS-CONSOLIDADO] Error en carga inicial::', error);
      this.mostrarError('Error cargando datos iniciales');
    } finally {
      this.cargando.set(false);
    }
  }

  private cargarEstadisticas(): void {
    this.cargandoEstadisticas.set(true);
    
    this.vehiculoService.getEstadisticasVehiculos().subscribe({
      next: (estadisticas) => {
        this.estadisticas.set(estadisticas);
        this.cargandoEstadisticas.set(false);
      },
      error: (error) => {
        this.cargandoEstadisticas.set(false);
        console.error('❌ [VEHICULOS-CONSOLIDADO] Error cargando estadísticas::', error);
      }
    });
  }

  // ========================================
  // CONFIGURACIÓN DE FORMULARIOS
  // ========================================

  private configurarFormularios(): void {
    // Configurar búsqueda en tiempo real
    this.formBusqueda.get('termino')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.terminoBusqueda.set(termino || '');
    });

    // Configurar filtros avanzados
    this.formFiltros.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(filtros => {
      this.aplicarFiltrosAvanzados(filtros);
    });
  }

  private restaurarFiltros(): void {
    const filtrosGuardados = localStorage.getItem('vehiculos-filtros');
    if (filtrosGuardados) {
      try {
        const filtros = JSON.parse(filtrosGuardados);
        this.formFiltros.patchValue(filtros);
        this.filtrosActivos.set(filtros);
      } catch (error) {
        console.error('Error restaurando filtros::', error);
      }
    }
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA
  // ========================================

  private realizarBusqueda(termino: string): void {
    if (this.cargandoBusqueda()) {
      return;
    }

    this.cargandoBusqueda.set(true);
    const campos = this.formBusqueda.get('campos')?.value as ('placa' | 'marca' | 'modelo' | 'empresa' | 'resolucion')[] || ['placa', 'marca', 'modelo', 'empresa'];

    this.vehiculoService.buscarGlobal(termino, campos).subscribe({
      next: (resultados) => {
        this.resultadosBusqueda.set(resultados);
        this.cargandoBusqueda.set(false);
      },
      error: (error) => {
        this.cargandoBusqueda.set(false);
        console.error('❌ [VEHICULOS-CONSOLIDADO] Error en búsqueda::', error);
        this.mostrarError('Error realizando búsqueda');
      }
    });
  }

  private limpiarBusqueda(): void {
    this.resultadosBusqueda.set({
      vehiculos: [],
      sugerencias: [],
      totalResultados: 0,
      terminoBusqueda: ''
    });
  }

  onSugerenciaSeleccionada(sugerencia: BusquedaSugerencia): void {
    if (sugerencia.tipo === 'vehiculo') {
      this.verDetalleVehiculo(sugerencia.valor);
    } else if (sugerencia.tipo === 'empresa') {
      this.filtrarPorEmpresa(sugerencia.valor);
    } else if (sugerencia.tipo === 'resolucion') {
      this.filtrarPorResolucion(sugerencia.valor);
    }
  }

  // ========================================
  // MÉTODOS DE FILTRADO
  // ========================================

  private aplicarFiltrosAvanzados(filtros: any): void {
    // Limpiar filtros vacíos
    const filtrosLimpios = Object.entries(filtros)
      .filter(([key, value]) => value !== '' && value !== null && value !== false)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    this.filtrosActivos.set(filtrosLimpios);
  }

  private aplicarFiltros(vehiculo: Vehiculo, filtros: any): boolean {
    for (const [campo, valor] of Object.entries(filtros)) {
      if (!this.evaluarFiltro(vehiculo, campo, valor)) {
        return false;
      }
    }
    return true;
  }

  private evaluarFiltro(vehiculo: Vehiculo, campo: string, valor: any): boolean {
    switch (campo) {
      case 'placa':
        return vehiculo.placa.toLowerCase().includes(valor.toLowerCase());
      case 'marca':
        return vehiculo.marca.toLowerCase().includes(valor.toLowerCase());
      case 'modelo':
        return !vehiculo.modelo || vehiculo.modelo.toLowerCase().includes(valor.toLowerCase());
      case 'empresaId':
        return vehiculo.empresaActualId === valor;
      case 'estado':
        return vehiculo.estado === valor;
      case 'categoria':
        return vehiculo.categoria === valor;
      case 'anioDesde':
        return !vehiculo.anioFabricacion || vehiculo.anioFabricacion >= parseInt(valor);
      case 'anioHasta':
        return !vehiculo.anioFabricacion || vehiculo.anioFabricacion <= parseInt(valor);
      case 'mostrarEliminados':
        return valor ? true : vehiculo.estaActivo !== false;
      case 'soloConRutas':
        return valor ? (vehiculo.rutasAsignadasIds && vehiculo.rutasAsignadasIds.length > 0) : true;
      case 'soloSinRutas':
        return valor ? (!vehiculo.rutasAsignadasIds || vehiculo.rutasAsignadasIds.length === 0) : true;
      default:
        return true;
    }
  }

  private aplicarFiltroTexto(vehiculo: Vehiculo, filtro: string): boolean {
    const termino = filtro.toLowerCase();
    return vehiculo.placa.toLowerCase().includes(termino) ||
           vehiculo.marca.toLowerCase().includes(termino) ||
           (vehiculo.modelo && vehiculo.modelo.toLowerCase().includes(termino)) ||
           vehiculo.estado.toLowerCase().includes(termino);
  }

  filtrarPorEmpresa(empresaId: string): void {
    this.formFiltros.patchValue({ empresaId });
  }

  filtrarPorResolucion(resolucionId: string): void {
    // Implementar filtro por resolución si es necesario
  }

  limpiarFiltros(): void {
    this.formFiltros.reset();
    this.formBusqueda.reset();
    this.filtrosActivos.set({});
    this.terminoBusqueda.set('');
    this.limpiarBusqueda();
    localStorage.removeItem('vehiculos-filtros');
    
    this.mostrarExito('Filtros limpiados');
  }

  // ========================================
  // MÉTODOS DE SELECCIÓN
  // ========================================

  toggleSeleccionVehiculo(vehiculoId: string): void {
    const seleccionados = new Set(this.vehiculosSeleccionados());
    
    if (seleccionados.has(vehiculoId)) {
      seleccionados.delete(vehiculoId);
    } else {
      seleccionados.add(vehiculoId);
    }
    
    this.vehiculosSeleccionados.set(seleccionados);
  }

  seleccionarTodos(): void {
    const vehiculos = this.vehiculosFiltrados();
    const todosSeleccionados = new Set(vehiculos.map(v => v.id));
    this.vehiculosSeleccionados.set(todosSeleccionados);
  }

  limpiarSeleccion(): void {
    this.vehiculosSeleccionados.set(new Set());
  }

  estaSeleccionado(vehiculoId: string): boolean {
    return this.vehiculosSeleccionados().has(vehiculoId);
  }

  // ========================================
  // MÉTODOS DE ACCIONES
  // ========================================

  crearVehiculo(): void {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '800px',
      data: { modo: 'crear' }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.refrescarDatos();
        this.mostrarExito('Vehículo creado exitosamente');
      }
    });
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '800px',
      data: { modo: 'editar', vehiculo }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.refrescarDatos();
        this.mostrarExito('Vehículo actualizado exitosamente');
      }
    });
  }

  verDetalleVehiculo(vehiculoId: string): void {
    this.router.navigate(['/vehiculos', vehiculoId]);
  }

  eliminarVehiculo(vehiculo: Vehiculo): void {
    if (confirm(`¿Está seguro de eliminar el vehículo ${vehiculo.placa}?`)) {
      this.vehiculoService.deleteVehiculo(vehiculo.id).subscribe({
        next: () => {
          this.refrescarDatos();
          this.mostrarExito('Vehículo eliminado exitosamente');
        },
        error: (error) => {
          console.error('Error eliminando vehículo::', error);
          this.mostrarError('Error eliminando vehículo');
        }
      });
    }
  }

  // ========================================
  // MÉTODOS DE GESTIÓN DE ESTADOS
  // ========================================

  cambiarEstadoVehiculo(vehiculo: Vehiculo, nuevoEstado: string): void {
    const motivo = prompt(`Ingrese el motivo para cambiar el estado a ${nuevoEstado}:`);
    if (!motivo) return;

    this.vehiculoService.cambiarEstadoVehiculo(vehiculo.id, nuevoEstado, motivo).subscribe({
      next: () => {
        this.refrescarDatos();
        this.mostrarExito(`Estado del vehículo ${vehiculo.placa} cambiado a ${nuevoEstado}`);
      },
      error: (error) => {
        console.error('Error cambiando estado::', error);
        this.mostrarError('Error cambiando estado del vehículo');
      }
    });
  }

  cambiarEstadoLote(): void {
    const seleccionados = Array.from(this.vehiculosSeleccionados());
    if (seleccionados.length === 0) {
      this.mostrarError('Seleccione al menos un vehículo');
      return;
    }

    const dialogRef = this.dialog.open(CambiarEstadoBloqueModalComponent, {
      width: '600px',
      data: { vehiculosIds: seleccionados }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.refrescarDatos();
        this.limpiarSeleccion();
        this.mostrarExito(`Estado cambiado para ${seleccionados.length} vehículos`);
      }
    });
  }

  // ========================================
  // MÉTODOS DE UTILIDAD PÚBLICOS
  // ========================================

  // Exponer Object para el template
  Object = Object;

  private contarPorEstado(vehiculos: Vehiculo[]): { [key: string]: number } {
    return vehiculos.reduce((acc, vehiculo) => {
      acc[vehiculo.estado] = (acc[vehiculo.estado] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private contarPorEmpresa(vehiculos: Vehiculo[]): { [key: string]: number } {
    return vehiculos.reduce((acc, vehiculo) => {
      const empresaId = vehiculo.empresaActualId || 'Sin empresa';
      acc[empresaId] = (acc[empresaId] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private contarPorMarca(vehiculos: Vehiculo[]): { [key: string]: number } {
    return vehiculos.reduce((acc, vehiculo) => {
      acc[vehiculo.marca] = (acc[vehiculo.marca] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  obtenerNombreEmpresa(empresaId: string): string {
    const empresa = this.empresas().find(e => e.id === empresaId);
    return empresa?.razonSocial?.principal || 'Sin empresa';
  }

  obtenerColorEstado(estado: string): string {
    const estadoConfig = this.estadosVehiculo.find(e => e.valor === estado);
    return estadoConfig?.color || 'basic';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-PE');
  }

  // ========================================
  // MÉTODOS DE INTERFAZ
  // ========================================

  cambiarVista(vista: 'tabla' | 'tarjetas' | 'estadisticas'): void {
    this.vistaActual.set(vista);
  }

  toggleFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados.set(!this.mostrarFiltrosAvanzados());
  }

  toggleDiagnostico(): void {
    this.mostrarDiagnostico.set(!this.mostrarDiagnostico());
  }

  refrescarDatos(): void {
    this.vehiculoService.clearCache();
    this.cargarDatosIniciales();
    this.cargarEstadisticas();
  }

  // ========================================
  // MÉTODOS DE DIAGNÓSTICO
  // ========================================

  ejecutarDiagnostico(): void {
    this.vehiculoService.diagnosticar().subscribe({
      next: (diagnostico) => {
        this.mostrarExito('Diagnóstico completado - Ver consola para detalles');
      },
      error: (error) => {
        console.error('❌ [VEHICULOS-CONSOLIDADO] Error en diagnóstico::', error);
        this.mostrarError('Error ejecutando diagnóstico');
      }
    });
  }

  limpiarCache(): void {
    this.vehiculoService.clearCache();
    this.mostrarExito('Cache limpiado exitosamente');
  }

  // ========================================
  // MÉTODOS DE NOTIFICACIÓN
  // ========================================

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private mostrarInfo(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  // ========================================
  // MÉTODOS ADICIONALES
  // ========================================

  abrirCargaMasiva(): void {
    const dialogRef = this.dialog.open(CargaMasivaVehiculosComponent, {
      width: '900px',
      height: '700px'
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.refrescarDatos();
        this.mostrarExito('Carga masiva completada');
      }
    });
  }

  exportarDatos(): void {
    // Implementar exportación de datos
    this.mostrarInfo('Función de exportación en desarrollo');
  }

  verHistorial(vehiculo: Vehiculo): void {
    const dialogRef = this.dialog.open(HistorialVehicularComponent, {
      width: '1000px',
      height: '600px',
      data: { vehiculoId: vehiculo.id, placa: vehiculo.placa }
    });
  }

  gestionarRutas(vehiculo: Vehiculo): void {
    const dialogRef = this.dialog.open(GestionarRutasEspecificasModalComponent, {
      width: '800px',
      data: { vehiculo }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.refrescarDatos();
        this.mostrarExito('Rutas actualizadas exitosamente');
      }
    });
  }

  transferirEmpresa(vehiculo: Vehiculo): void {
    const dialogRef = this.dialog.open(TransferirEmpresaModalComponent, {
      width: '600px',
      data: { vehiculo }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.refrescarDatos();
        this.mostrarExito('Vehículo transferido exitosamente');
      }
    });
  }

  solicitarBaja(vehiculo: Vehiculo): void {
    const dialogRef = this.dialog.open(SolicitarBajaVehiculoUnifiedComponent, {
      width: '700px',
      data: { vehiculo }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.mostrarExito('Solicitud de baja enviada exitosamente');
      }
    });
  }
}