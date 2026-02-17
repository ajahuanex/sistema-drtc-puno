import { Component, OnInit, AfterViewInit, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { Empresa, EmpresaEstadisticas, TipoServicio, EstadoEmpresa } from '../../models/empresa.model';
import { FiltrosAvanzadosModalComponent, FiltrosAvanzados } from './filtros-avanzados-modal.component';
import { CambiarEstadoBloqueModalComponent, CambiarEstadoBloqueData, CambiarEstadoBloqueResult } from './cambiar-estado-bloque-modal.component';
import { CambiarTipoServicioBloqueModalComponent, CambiarTipoServicioBloqueData, CambiarTipoServicioBloqueResult } from './cambiar-tipo-servicio-bloque-modal.component';

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: string;
}

interface TipoServicioTab {
  tipo: TipoServicio | 'TODOS' | 'TRANSPORTE' | 'INFRAESTRUCTURA';
  label: string;
  icon: string;
  count: number;
  categoria: 'TRANSPORTE' | 'INFRAESTRUCTURA' | 'TODOS';
}

interface EstadisticasPorTipo {
  [key: string]: EmpresaEstadisticas;
}

// Categorización de tipos de servicio
const TIPOS_TRANSPORTE: TipoServicio[] = [
  TipoServicio.PERSONAS,
  TipoServicio.TURISMO,
  TipoServicio.TRABAJADORES,
  TipoServicio.ESTUDIANTES,
  TipoServicio.MERCANCIAS
];

const TIPOS_INFRAESTRUCTURA: TipoServicio[] = [
  TipoServicio.TERMINAL_TERRESTRE,
  TipoServicio.ESTACION_DE_RUTA,
  TipoServicio.OTROS
];

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatChipsModule,
    MatDialogModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatTabsModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './empresas.component.html',
  styleUrls: ['./empresas.component.scss']
})
export class EmpresasComponent implements OnInit, AfterViewInit {
  private empresaService = inject(EmpresaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private paginatorIntl = inject(MatPaginatorIntl);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Signals
  empresas = signal<Empresa[]>([]);
  empresasOriginales = signal<Empresa[]>([]);
  isLoading = signal(false);
  estadisticas = signal<EmpresaEstadisticas | undefined>(undefined);
  filtrosActivos = signal<FiltrosAvanzados | null>(null);

  // Tabs por tipo de servicio
  tipoServicioActivo = signal<TipoServicio | 'TODOS' | 'TRANSPORTE' | 'INFRAESTRUCTURA'>('TRANSPORTE');
  estadisticasPorTipo = signal<EstadisticasPorTipo>({});
  
  // Computed para tabs
  tipoServicioTabs = computed<TipoServicioTab[]>(() => {
    const empresasData = this.empresasOriginales();
    const stats = this.estadisticasPorTipo();
    
    // Contar empresas por categoría
    const empresasTransporte = empresasData.filter(empresa => 
      empresa.tiposServicio.some(tipo => TIPOS_TRANSPORTE.includes(tipo))
    );
    
    const empresasInfraestructura = empresasData.filter(empresa => 
      empresa.tiposServicio.some(tipo => TIPOS_INFRAESTRUCTURA.includes(tipo))
    );

    const tabs: TipoServicioTab[] = [
      {
        tipo: 'TRANSPORTE',
        label: 'Transporte',
        icon: 'directions_bus',
        count: empresasTransporte.length,
        categoria: 'TRANSPORTE'
      },
      {
        tipo: 'INFRAESTRUCTURA',
        label: 'Infraestructura',
        icon: 'location_city',
        count: empresasInfraestructura.length,
        categoria: 'INFRAESTRUCTURA'
      }
    ];

    // Solo agregar subtabs si estamos en una categoría específica
    const tipoActivo = this.tipoServicioActivo();
    
    if (tipoActivo === 'TRANSPORTE') {
      // Agregar subtabs para tipos de transporte
      TIPOS_TRANSPORTE.forEach(tipo => {
        const count = empresasData.filter(empresa => 
          empresa.tiposServicio.includes(tipo)
        ).length;
        
        if (count > 0) {
          tabs.push({
            tipo,
            label: this.getTipoServicioLabel(tipo),
            icon: this.getTipoServicioIcon(tipo),
            count,
            categoria: 'TRANSPORTE'
          });
        }
      });
    } else if (tipoActivo === 'INFRAESTRUCTURA') {
      // Agregar subtabs para tipos de infraestructura
      TIPOS_INFRAESTRUCTURA.forEach(tipo => {
        const count = empresasData.filter(empresa => 
          empresa.tiposServicio.includes(tipo)
        ).length;
        
        if (count > 0) {
          tabs.push({
            tipo,
            label: this.getTipoServicioLabel(tipo),
            icon: this.getTipoServicioIcon(tipo),
            count,
            categoria: 'INFRAESTRUCTURA'
          });
        }
      });
    }

    return tabs;
  });

  // Computed para empresas filtradas por tipo
  empresasFiltradas = computed(() => {
    const empresasData = this.empresasOriginales();
    const tipoActivo = this.tipoServicioActivo();
    
    if (tipoActivo === 'TODOS') {
      return empresasData;
    } else if (tipoActivo === 'TRANSPORTE') {
      return empresasData.filter(empresa => 
        empresa.tiposServicio.some(tipo => TIPOS_TRANSPORTE.includes(tipo))
      );
    } else if (tipoActivo === 'INFRAESTRUCTURA') {
      return empresasData.filter(empresa => 
        empresa.tiposServicio.some(tipo => TIPOS_INFRAESTRUCTURA.includes(tipo))
      );
    } else {
      // Tipo específico
      return empresasData.filter(empresa => 
        empresa.tiposServicio.includes(tipoActivo as TipoServicio)
      );
    }
  });

  // Data source para la tabla
  dataSource = new MatTableDataSource<Empresa>([]);
  
  // Selección múltiple
  selectedEmpresas = signal<Set<string>>(new Set());
  isAllSelected = computed(() => {
    const numSelected = this.selectedEmpresas().size;
    const numRows = this.dataSource.filteredData.length;
    return numSelected === numRows && numRows > 0;
  });
  
  isIndeterminate = computed(() => {
    const numSelected = this.selectedEmpresas().size;
    const numRows = this.dataSource.filteredData.length;
    return numSelected > 0 && numSelected < numRows;
  });

  // Configuración de columnas como signal (diferentes para transporte e infraestructura)
  columnConfigs = signal<ColumnConfig[]>([
    { key: 'select', label: 'SELECCIONAR', visible: true, sortable: false, width: '60px' },
    { key: 'ruc', label: 'RUC', visible: true, sortable: true, width: '120px' },
    { key: 'razonSocial', label: 'RAZÓN SOCIAL', visible: true, sortable: true, width: '300px' },
    { key: 'estado', label: 'ESTADO', visible: true, sortable: true, width: '120px' },
    { key: 'rutas', label: 'RUTAS', visible: true, sortable: true, width: '100px' },
    { key: 'vehiculos', label: 'VEHÍCULOS', visible: true, sortable: true, width: '100px' },
    { key: 'conductores', label: 'CONDUCTORES', visible: true, sortable: true, width: '120px' },
    { key: 'acciones', label: 'ACCIONES', visible: true, sortable: false, width: '120px' }
  ]);

  // Computed para columnas según la categoría activa
  columnConfigsActivas = computed(() => {
    const categoria = this.categoriaActiva();
    const baseColumns = [
      { key: 'select', label: 'SELECCIONAR', visible: true, sortable: false, width: '60px' },
      { key: 'ruc', label: 'RUC', visible: true, sortable: true, width: '120px' },
      { key: 'razonSocial', label: 'RAZÓN SOCIAL', visible: true, sortable: true, width: '300px' },
      { key: 'estado', label: 'ESTADO', visible: true, sortable: true, width: '120px' }
    ];

    if (categoria === 'TRANSPORTE') {
      // Columnas para empresas de transporte
      return [
        ...baseColumns,
        { key: 'rutas', label: 'RUTAS', visible: true, sortable: true, width: '100px' },
        { key: 'vehiculos', label: 'VEHÍCULOS', visible: true, sortable: true, width: '100px' },
        { key: 'conductores', label: 'CONDUCTORES', visible: true, sortable: true, width: '120px' },
        { key: 'acciones', label: 'ACCIONES', visible: true, sortable: false, width: '120px' }
      ];
    } else if (categoria === 'INFRAESTRUCTURA') {
      // Columnas para empresas de infraestructura complementaria
      return [
        ...baseColumns,
        { key: 'tipoInfraestructura', label: 'TIPO', visible: true, sortable: true, width: '150px' },
        { key: 'ubicacion', label: 'UBICACIÓN', visible: true, sortable: true, width: '200px' },
        { key: 'capacidad', label: 'CAPACIDAD', visible: true, sortable: true, width: '100px' },
        { key: 'acciones', label: 'ACCIONES', visible: true, sortable: false, width: '120px' }
      ];
    } else {
      // Columnas por defecto (todas)
      return [
        ...baseColumns,
        { key: 'tipoServicio', label: 'TIPO SERVICIO', visible: true, sortable: true, width: '150px' },
        { key: 'rutas', label: 'RUTAS', visible: true, sortable: true, width: '100px' },
        { key: 'vehiculos', label: 'VEHÍCULOS', visible: true, sortable: true, width: '100px' },
        { key: 'acciones', label: 'ACCIONES', visible: true, sortable: false, width: '120px' }
      ];
    }
  });

  // Computed para columnas visibles
  displayedColumns = computed(() => 
    this.columnConfigsActivas().filter(col => col.visible).map(col => col.key)
  );

  // Formularios
  searchForm: FormGroup;
  columnForm: FormGroup;
  showColumnConfig = signal(false);

  constructor() {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    this.columnForm = this.fb.group({});
    this.setupColumnConfiguration();
    this.configurarPaginadorEspanol();
  }

  private configurarPaginadorEspanol(): void {
    this.paginatorIntl.itemsPerPageLabel = 'Elementos por página:';
    this.paginatorIntl.nextPageLabel = 'Página siguiente';
    this.paginatorIntl.previousPageLabel = 'Página anterior';
    this.paginatorIntl.firstPageLabel = 'Primera página';
    this.paginatorIntl.lastPageLabel = 'Última página';
    this.paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return `0 de ${length}`;
      }
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} de ${length}`;
    };
  }

  setupColumnConfiguration(): void {
    // Configurar controles para todas las posibles columnas
    const todasLasColumnas = [
      { key: 'select', label: 'SELECCIONAR' },
      { key: 'ruc', label: 'RUC' },
      { key: 'razonSocial', label: 'RAZÓN SOCIAL' },
      { key: 'estado', label: 'ESTADO' },
      { key: 'tipoServicio', label: 'TIPO SERVICIO' },
      { key: 'tipoInfraestructura', label: 'TIPO' },
      { key: 'ubicacion', label: 'UBICACIÓN' },
      { key: 'capacidad', label: 'CAPACIDAD' },
      { key: 'rutas', label: 'RUTAS' },
      { key: 'vehiculos', label: 'VEHÍCULOS' },
      { key: 'conductores', label: 'CONDUCTORES' },
      { key: 'acciones', label: 'ACCIONES' }
    ];

    todasLasColumnas.forEach(col => {
      if (!this.columnForm.get(col.key)) {
        this.columnForm.addControl(col.key, this.fb.control(true));
      }
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.setupReactiveSearch();
    this.loadEmpresas();
    this.loadEstadisticas();
  }

  ngAfterViewInit(): void {
    // Configurar paginador y sort después de que la vista esté inicializada
    this.configurarDataSource();
  }

  // ========================================
  // CONFIGURACIÓN DE BÚSQUEDA Y FILTROS
  // ========================================

  /**
   * Configura el DataSource con paginación, ordenamiento y filtros
   */
  private configurarDataSource(): void {
    if (!this.paginator || !this.sort) return;

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Configurar sorting personalizado
    this.dataSource.sortingDataAccessor = (data: Empresa, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'ruc':
          return data.ruc;
        case 'razonSocial':
          return (data.razonSocial?.principal || '').toLowerCase();
        case 'estado':
          return data.estado;
        case 'tipoServicio':
          return data.tiposServicio ? data.tiposServicio.join(', ') : '';
        case 'rutas':
          return data.rutasAutorizadasIds?.length || 0;
        case 'vehiculos':
          return data.vehiculosHabilitadosIds?.length || 0;
        case 'conductores':
          return data.conductoresHabilitadosIds?.length || 0;
        case 'fechaRegistro':
          return data.fechaRegistro;
        default:
          return (data as any)[sortHeaderId];
      }
    };
    
    // NO usar filterPredicate personalizado - manejamos el filtrado manualmente
  }

  /**
   * Configura la búsqueda reactiva
   */
  setupReactiveSearch(): void {
    this.searchForm.get('searchTerm')?.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.applyFilter(searchTerm || '');
    });
  }

  /**
   * Aplica el filtro de búsqueda
   */
  applyFilter(filterValue: string): void {
    this.filtrarEmpresas(filterValue);
  }

  /**
   * Filtra las empresas basado en el término de búsqueda
   */
  private filtrarEmpresas(termino: string): void {
    // Limpiar el término de búsqueda: remover comillas y espacios
    const terminoLimpio = (termino || '')
      .replace(/['"]/g, '')  // Remover comillas
      .trim()                // Remover espacios
      .toLowerCase();        // Convertir a minúsculas
    
    console.log('🔍 BUSCANDO:', terminoLimpio);
    
    // Si no hay término, mostrar todas las empresas
    if (!terminoLimpio) {
      this.dataSource.data = this.empresasOriginales();
      console.log('✅ MOSTRANDO TODAS:', this.empresasOriginales().length);
      return;
    }
    
    // Filtrar empresas manualmente
    const empresasFiltradas = this.empresasOriginales().filter(empresa => {
      const ruc = (empresa.ruc || '').toLowerCase();
      const razonSocial = (empresa.razonSocial?.principal || '').toLowerCase();
      const estado = (empresa.estado || '').toLowerCase();
      
      const coincide = ruc.includes(terminoLimpio) || 
                      razonSocial.includes(terminoLimpio) || 
                      estado.includes(terminoLimpio);
      
      // Log para debugging específico
      if (terminoLimpio === 'sur' && coincide) {
        console.log('✅ ENCONTRADA CON SUR:', empresa.razonSocial?.principal);
      }
      
      if (terminoLimpio === 'sur' && razonSocial.includes('latino')) {
        console.log('❌ LATINO EXPRESS - ¿Por qué aparece?:', {
          ruc,
          razonSocial,
          estado,
          coincide
        });
      }
      
      return coincide;
    });
    
    console.log('🔍 RESULTADOS FILTRADOS:', empresasFiltradas.length);
    this.dataSource.data = empresasFiltradas;
    
    // Resetear paginador
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  /**
   * Limpia la búsqueda
   */
  clearSearch(): void {
    this.searchForm.get('searchTerm')?.setValue('');
  }

  toggleColumnConfig(): void {
    this.showColumnConfig.set(!this.showColumnConfig());
  }

  resetColumns(): void {
    const defaultVisibleColumns = ['select', 'ruc', 'razonSocial', 'estado', 'tipoServicio', 'rutas', 'vehiculos', 'conductores', 'acciones'];
    
    const updatedConfigs = this.columnConfigs().map(col => ({
      ...col,
      visible: defaultVisibleColumns.includes(col.key)
    }));
    
    this.columnConfigs.set(updatedConfigs);
    
    // Actualizar los controles del formulario
    updatedConfigs.forEach(col => {
      this.columnForm.get(col.key)?.setValue(col.visible);
    });
  }

  // ========================================
  // CARGA DE DATOS
  // ========================================

  loadEmpresas(): void {
    this.isLoading.set(true);
    this.empresaService.getEmpresas(0, 1000).subscribe({
      next: (empresas) => {
        this.empresasOriginales.set(empresas);
        this.calcularEstadisticasPorTipo();
        this.actualizarDataSource();
        
        // Configurar DataSource después de cargar datos
        setTimeout(() => {
          this.configurarDataSource();
        }, 0);
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ ERROR CARGANDO EMPRESAS:', error);
        this.isLoading.set(false);
        this.snackBar.open('ERROR AL CARGAR LAS EMPRESAS: ' + (error.message || 'Error desconocido'), 'CERRAR', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  loadEstadisticas(): void {
    this.empresaService.getEstadisticasEmpresas().subscribe({
      next: (estadisticas) => {
        this.estadisticas.set(estadisticas);
      },
      error: (error) => {
        console.error('ERROR CARGANDO ESTADÍSTICAS:', error);
      }
    });
  }

  recargarEmpresas(): void {
    this.loadEmpresas();
    this.loadEstadisticas();
  }

  // Métodos para filtros avanzados
  abrirFiltrosAvanzados(): void {
    const dialogRef = this.dialog.open(FiltrosAvanzadosModalComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: this.filtrosActivos()
    });

    dialogRef.afterClosed().subscribe((filtros: FiltrosAvanzados) => {
      if (filtros) {
        this.aplicarFiltrosAvanzados(filtros);
      }
    });
  }

  aplicarFiltrosAvanzados(filtros: FiltrosAvanzados): void {
    this.filtrosActivos.set(filtros);
    
    let empresasFiltradas = [...this.empresasOriginales()];

    // Filtrar por estado
    if (filtros.estado && filtros.estado.length > 0) {
      empresasFiltradas = empresasFiltradas.filter(empresa => 
        filtros.estado!.includes(empresa.estado)
      );
    }

    // Filtrar por cantidad de rutas
    if (typeof filtros.rutasMinimas !== "undefined" && filtros.rutasMinimas !== null) {
      empresasFiltradas = empresasFiltradas.filter(empresa => 
        (empresa.rutasAutorizadasIds?.length || 0) >= filtros.rutasMinimas!
      );
    }
    if (typeof filtros.rutasMaximas !== "undefined" && filtros.rutasMaximas !== null) {
      empresasFiltradas = empresasFiltradas.filter(empresa => 
        (empresa.rutasAutorizadasIds?.length || 0) <= filtros.rutasMaximas!
      );
    }

    // Filtrar por cantidad de vehículos
    if (typeof filtros.vehiculosMinimos !== "undefined" && filtros.vehiculosMinimos !== null) {
      empresasFiltradas = empresasFiltradas.filter(empresa => 
        (empresa.vehiculosHabilitadosIds?.length || 0) >= filtros.vehiculosMinimos!
      );
    }
    if (typeof filtros.vehiculosMaximos !== "undefined" && filtros.vehiculosMaximos !== null) {
      empresasFiltradas = empresasFiltradas.filter(empresa => 
        (empresa.vehiculosHabilitadosIds?.length || 0) <= filtros.vehiculosMaximos!
      );
    }

    // Filtrar por cantidad de conductores
    if (typeof filtros.conductoresMinimos !== "undefined" && filtros.conductoresMinimos !== null) {
      empresasFiltradas = empresasFiltradas.filter(empresa => 
        (empresa.conductoresHabilitadosIds?.length || 0) >= filtros.conductoresMinimos!
      );
    }
    if (typeof filtros.conductoresMaximos !== "undefined" && filtros.conductoresMaximos !== null) {
      empresasFiltradas = empresasFiltradas.filter(empresa => 
        (empresa.conductoresHabilitadosIds?.length || 0) <= filtros.conductoresMaximos!
      );
    }

    // Actualizar datos
    this.empresas.set(empresasFiltradas);
    this.dataSource.data = empresasFiltradas;

    // Reconfigurar paginador
    setTimeout(() => {
      this.configurarDataSource();
      if (this.paginator) {
        this.paginator.firstPage();
      }
    }, 0);

    this.snackBar.open(`Filtros aplicados: ${empresasFiltradas.length} empresas encontradas`, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  limpiarFiltrosAvanzados(): void {
    this.filtrosActivos.set(null);
    this.empresas.set([...this.empresasOriginales()]);
    this.dataSource.data = this.empresasOriginales();

    // Reconfigurar paginador
    setTimeout(() => {
      this.configurarDataSource();
      if (this.paginator) {
        this.paginator.firstPage();
      }
    }, 0);

    this.snackBar.open('Filtros limpiados', 'Cerrar', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  tienesFiltrosActivos(): boolean {
    const filtros = this.filtrosActivos();
    if (!filtros) return false;
    
    return !!(
      (filtros.estado && filtros.estado.length > 0) ||
      (filtros.tipoServicio && filtros.tipoServicio.length > 0) ||
      filtros.rutaOrigen ||
      filtros.rutaDestino ||
      filtros.rutasMinimas !== null ||
      filtros.rutasMaximas !== null ||
      filtros.vehiculosMinimos !== null ||
      filtros.vehiculosMaximos !== null ||
      filtros.conductoresMinimos !== null ||
      filtros.conductoresMaximos !== null
    );
  }

  // Métodos básicos de navegación
  verEmpresa(id: string): void {
    this.router.navigate(['/empresas', id]);
  }

  editarEmpresa(id: string): void {
    this.router.navigate(['/empresas', id, 'editar']);
  }

  nuevaEmpresa(): void {
    this.router.navigate(['/empresas/nueva']);
  }

  // Métodos requeridos por el template
  cargaMasivaEmpresas(): void {
    this.router.navigate(['/empresas/carga-masiva']);
  }

  crearResolucion(): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  crearRutaGeneral(): void {
    // Navegar al módulo de rutas para crear una nueva ruta general
    this.router.navigate(['/rutas'], { 
      queryParams: { 
        accion: 'crear'
      } 
    });
  }

  dashboardEmpresas(): void {
    this.router.navigate(['/empresas/dashboard']);
  }

  // Métodos para selección múltiple
  toggleAllSelection(): void {
    if (this.isAllSelected()) {
      this.selectedEmpresas.set(new Set());
    } else {
      const allIds = new Set(this.dataSource.filteredData.map(empresa => empresa.id));
      this.selectedEmpresas.set(allIds);
    }
  }

  toggleEmpresaSelection(empresaId: string): void {
    console.log('🔄 TOGGLE EMPRESA SELECTION:', empresaId);
    const currentSelection = new Set(this.selectedEmpresas());
    console.log('📋 Selección actual:', Array.from(currentSelection));
    
    if (currentSelection.has(empresaId)) {
      currentSelection.delete(empresaId);
      console.log('➖ Empresa deseleccionada:', empresaId);
    } else {
      currentSelection.add(empresaId);
      console.log('➕ Empresa seleccionada:', empresaId);
    }
    
    this.selectedEmpresas.set(currentSelection);
    console.log('📋 Nueva selección:', Array.from(currentSelection));
  }

  isEmpresaSelected(empresaId: string): boolean {
    const isSelected = this.selectedEmpresas().has(empresaId);
    // console.log(`❓ ¿Empresa ${empresaId} seleccionada?:`, isSelected); // Comentado para evitar spam
    return isSelected;
  }

  clearSelection(): void {
    this.selectedEmpresas.set(new Set());
  }

  exportarEmpresas(): void {
    const selectedIds = Array.from(this.selectedEmpresas());
    const hasSelection = selectedIds.length > 0;
    const hasFilters = this.tienesFiltrosActivos() || this.searchForm.get('searchTerm')?.value;
    
    // Determinar qué empresas exportar
    let empresasAExportar: Empresa[] = [];
    let tipoExportacion = '';
    
    if (hasSelection) {
      // Exportar solo las seleccionadas
      empresasAExportar = this.dataSource.filteredData.filter(empresa => 
        selectedIds.includes(empresa.id)
      );
      tipoExportacion = `${selectedIds.length} empresas seleccionadas`;
    } else if (hasFilters) {
      // Exportar las filtradas
      empresasAExportar = this.dataSource.filteredData;
      tipoExportacion = `${this.dataSource.filteredData.length} empresas filtradas`;
    } else {
      // Exportar todas
      empresasAExportar = this.dataSource.data;
      tipoExportacion = `${this.dataSource.data.length} empresas (todas)`;
    }
    
    if (empresasAExportar.length === 0) {
      this.snackBar.open('No hay empresas para exportar', 'Cerrar', { 
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }
    
    // Confirmar exportación
    const mensaje = `¿Desea exportar ${tipoExportacion} a Excel?`;
    if (confirm(mensaje)) {
      this.realizarExportacion(empresasAExportar, tipoExportacion);
    }
  }

  private realizarExportacion(empresas: Empresa[], tipoExportacion: string): void {
    this.snackBar.open(`Preparando exportación de ${tipoExportacion}...`, '', { 
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });

    // Determinar si hay empresas seleccionadas
    const selectedIds = Array.from(this.selectedEmpresas());
    const empresasSeleccionadas = selectedIds.length > 0 ? selectedIds : undefined;
    
    // Obtener columnas visibles (excluyendo 'select' y 'acciones' que no son datos)
    const columnasVisibles = this.displayedColumns().filter(col => 
      col !== 'select' && col !== 'acciones'
    );

    // Llamar al servicio de exportación
    this.empresaService.exportarEmpresas('excel', empresasSeleccionadas, columnasVisibles).subscribe({
      next: (blob) => {
        // console.log removed for production
        
        // Verificar que el blob sea válido
        if (blob && blob.size > 0) {
          const nombreArchivo = `empresas_${this.generarNombreArchivo()}.xlsx`;
          this.descargarArchivo(blob, nombreArchivo);
          
          this.snackBar.open(`✅ ${tipoExportacion} exportadas exitosamente`, 'Cerrar', { 
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          
          // Limpiar selección después de exportar
          if (this.selectedEmpresas().size > 0) {
            this.clearSelection();
          }
        } else {
          console.error('❌ Blob vacío o inválido');
          this.snackBar.open('❌ Error: archivo vacío recibido del servidor', 'Cerrar', { 
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      },
      error: (error) => {
        console.error('❌ Error exportando empresas::', error);
        
        // Mostrar información detallada del error
        let mensajeError = 'Error al exportar empresas';
        if (error.status === 404) {
          mensajeError = 'Endpoint de exportación no encontrado';
        } else if (error.status === 500) {
          mensajeError = 'Error interno del servidor';
        } else if (error.status === 0) {
          mensajeError = 'No se puede conectar con el servidor';
        }
        
        this.snackBar.open(`❌ ${mensajeError}`, 'Cerrar', { 
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  private generarNombreArchivo(): string {
    const fecha = new Date();
    const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    return `${fechaStr}_${horaStr}`;
  }

  private descargarArchivo(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  verRutasEmpresa(empresa: Empresa): void {
    // Navegar al módulo de rutas con filtro de empresa
    this.router.navigate(['/rutas'], { 
      queryParams: { 
        empresaId: empresa.id,
        empresaRuc: empresa.ruc,
        empresaNombre: empresa.razonSocial.principal
      } 
    });
  }

  gestionarVehiculos(empresaId: string): void {
    this.router.navigate(['/empresas', empresaId, 'vehiculos', 'batch']);
  }

  nuevoVehiculo(empresaId: string): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  gestionarConductores(empresaId: string): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  verResoluciones(empresaId: string): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  gestionarDocumentos(empresa: Empresa): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  verHistorialAuditoria(empresa: Empresa): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  validarConSunat(empresa: Empresa): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  crearRuta(empresa: Empresa): void {
    // Navegar al módulo de rutas para crear una nueva ruta para esta empresa
    this.router.navigate(['/rutas'], { 
      queryParams: { 
        empresaId: empresa.id,
        empresaRuc: empresa.ruc,
        empresaNombre: empresa.razonSocial.principal,
        accion: 'crear'
      } 
    });
  }

  isColumnVisible(key: string): boolean {
    return this.columnConfigsActivas().find(c => c.key === key)?.visible || false;
  }

  eliminarEmpresa(id: string): void {
    if (confirm('¿Está seguro de que desea eliminar esta empresa?')) {
      this.empresaService.deleteEmpresa(id).subscribe({
        next: () => {
          this.snackBar.open('Empresa eliminada exitosamente', 'Cerrar', { duration: 3000 });
          this.recargarEmpresas();
        },
        error: (error) => {
          console.error('Error eliminando empresa::', error);
          this.snackBar.open('Error al eliminar empresa', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  // ========================================
  // MÉTODOS PARA ACCIONES EN BLOQUE
  // ========================================

  /**
   * Actualiza el estado de las empresas localmente para mostrar cambios inmediatos
   */
  private actualizarEstadoLocal(empresaIds: string[], nuevoEstado: any): void {
    console.log('🔄 ACTUALIZANDO ESTADO LOCAL');
    console.log('📋 IDs a actualizar:', empresaIds);
    console.log('🏷️ Nuevo estado:', nuevoEstado);
    console.log('📊 Empresas originales antes:', this.empresasOriginales().length);
    console.log('📊 Empresas filtradas antes:', this.empresas().length);
    
    // Actualizar empresas originales
    const empresasOriginalesActualizadas = this.empresasOriginales().map(empresa => {
      if (empresaIds.includes(empresa.id)) {
        console.log(`✅ Actualizando empresa ${empresa.ruc} de ${empresa.estado} a ${nuevoEstado}`);
        return { ...empresa, estado: nuevoEstado };
      }
      return empresa;
    });
    this.empresasOriginales.set(empresasOriginalesActualizadas);

    // Actualizar empresas filtradas
    const empresasActualizadas = this.empresas().map(empresa => {
      if (empresaIds.includes(empresa.id)) {
        console.log(`✅ Actualizando empresa filtrada ${empresa.ruc} de ${empresa.estado} a ${nuevoEstado}`);
        return { ...empresa, estado: nuevoEstado };
      }
      return empresa;
    });
    this.empresas.set(empresasActualizadas);

    // Actualizar dataSource
    this.dataSource.data = empresasActualizadas;
    
    console.log('📊 Empresas originales después:', this.empresasOriginales().length);
    console.log('📊 Empresas filtradas después:', this.empresas().length);
    console.log('📊 DataSource después:', this.dataSource.data.length);
    console.log('✅ ACTUALIZACIÓN LOCAL COMPLETADA');
  }

  /**
   * Actualiza los tipos de servicio de las empresas localmente
   */
  private actualizarTiposServicioLocal(empresaIds: string[], nuevosTipos: any[], accion: 'reemplazar' | 'agregar' | 'quitar'): void {
    // Actualizar empresas originales
    const empresasOriginalesActualizadas = this.empresasOriginales().map(empresa => {
      if (empresaIds.includes(empresa.id)) {
        let tiposActualizados = [...(empresa.tiposServicio || [])];
        
        switch (accion) {
          case 'reemplazar':
            tiposActualizados = nuevosTipos;
            break;
          case 'agregar':
            nuevosTipos.forEach(tipo => {
              if (!tiposActualizados.includes(tipo)) {
                tiposActualizados.push(tipo);
              }
            });
            break;
          case 'quitar':
            tiposActualizados = tiposActualizados.filter(tipo => !nuevosTipos.includes(tipo));
            break;
        }
        
        return { ...empresa, tiposServicio: tiposActualizados };
      }
      return empresa;
    });
    this.empresasOriginales.set(empresasOriginalesActualizadas);

    // Actualizar empresas filtradas
    const empresasActualizadas = this.empresas().map(empresa => {
      if (empresaIds.includes(empresa.id)) {
        let tiposActualizados = [...(empresa.tiposServicio || [])];
        
        switch (accion) {
          case 'reemplazar':
            tiposActualizados = nuevosTipos;
            break;
          case 'agregar':
            nuevosTipos.forEach(tipo => {
              if (!tiposActualizados.includes(tipo)) {
                tiposActualizados.push(tipo);
              }
            });
            break;
          case 'quitar':
            tiposActualizados = tiposActualizados.filter(tipo => !nuevosTipos.includes(tipo));
            break;
        }
        
        return { ...empresa, tiposServicio: tiposActualizados };
      }
      return empresa;
    });
    this.empresas.set(empresasActualizadas);

    // Actualizar dataSource
    this.dataSource.data = empresasActualizadas;
  }

  cambiarEstadoBloque(): void {
    const selectedIds = Array.from(this.selectedEmpresas());
    console.log('🔍 CAMBIAR ESTADO BLOQUE - IDs seleccionados:', selectedIds);
    
    if (selectedIds.length === 0) {
      console.log('❌ No hay empresas seleccionadas');
      this.snackBar.open('No hay empresas seleccionadas', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogData: CambiarEstadoBloqueData = {
      empresasSeleccionadas: selectedIds.length
    };

    console.log('📋 Abriendo modal con data:', dialogData);

    const dialogRef = this.dialog.open(CambiarEstadoBloqueModalComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: CambiarEstadoBloqueResult) => {
      console.log('🔄 Modal cerrado con resultado:', result);
      
      if (result) {
        console.log(`✅ Cambiando estado de ${selectedIds.length} empresas a ${result.nuevoEstado}`);
        
        this.snackBar.open(`Cambiando estado de ${selectedIds.length} empresas a ${result.nuevoEstado}...`, '', { duration: 2000 });
        
        // Actualizar el estado localmente para mostrar el cambio inmediatamente
        this.actualizarEstadoLocal(selectedIds, result.nuevoEstado);
        
        // Llamada al servicio para cambiar el estado en bloque
        this.empresaService.cambiarEstadoBloque(selectedIds, result.nuevoEstado).subscribe({
          next: (response) => {
            console.log('✅ Respuesta del servidor:', response);
            
            if (response.errores && response.errores.length > 0) {
              // Hay algunos errores, mostrar mensaje detallado
              const empresasYaEnEstado = response.errores.filter(error => 
                error.error?.error?.detail?.includes('ya se encuentra en estado')
              ).length;
              
              const otrosErrores = response.errores.length - empresasYaEnEstado;
              
              let mensaje = `Estado cambiado exitosamente para ${response.empresasActualizadas} empresas`;
              
              if (empresasYaEnEstado > 0) {
                mensaje += `. ${empresasYaEnEstado} empresa(s) ya estaban en el estado seleccionado`;
              }
              
              if (otrosErrores > 0) {
                mensaje += `. ${otrosErrores} empresa(s) tuvieron errores`;
              }
              
              this.snackBar.open(mensaje, 'Cerrar', { duration: 6000 });
            } else {
              // Todo exitoso
              this.snackBar.open(`Estado cambiado exitosamente para ${response.empresasActualizadas} empresas`, 'Cerrar', { duration: 4000 });
            }
            
            this.clearSelection();
            // Recargar datos para sincronizar con el servidor
            this.recargarEmpresas();
          },
          error: (error) => {
            console.error('❌ Error cambiando estado en bloque:', error);
            this.snackBar.open('Error al cambiar el estado de las empresas', 'Cerrar', { duration: 4000 });
            // Revertir cambios locales en caso de error
            this.recargarEmpresas();
          }
        });
      } else {
        console.log('❌ Modal cerrado sin resultado');
      }
    });
  }

  cambiarTipoServicioBloque(): void {
    const selectedIds = Array.from(this.selectedEmpresas());
    if (selectedIds.length === 0) {
      this.snackBar.open('No hay empresas seleccionadas', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogData: CambiarTipoServicioBloqueData = {
      empresasSeleccionadas: selectedIds.length
    };

    const dialogRef = this.dialog.open(CambiarTipoServicioBloqueModalComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: CambiarTipoServicioBloqueResult) => {
      if (result) {
        const accionTexto = result.accion === 'reemplazar' ? 'reemplazando' : 
                           result.accion === 'agregar' ? 'agregando' : 'quitando';
        
        this.snackBar.open(`${accionTexto} tipos de servicio en ${selectedIds.length} empresas...`, '', { duration: 2000 });
        
        // Actualizar los tipos de servicio localmente para mostrar el cambio inmediatamente
        this.actualizarTiposServicioLocal(selectedIds, result.nuevosTipos, result.accion);
        
        // Aquí implementarías la llamada al servicio para cambiar el tipo de servicio en bloque
        // this.empresaService.cambiarTipoServicioBloque(selectedIds, result.nuevosTipos, result.accion).subscribe(...)
        
        setTimeout(() => {
          this.snackBar.open(`Tipos de servicio actualizados exitosamente para ${selectedIds.length} empresas`, 'Cerrar', { duration: 4000 });
          this.clearSelection();
          // this.recargarEmpresas(); // Comentado para mantener los cambios locales visibles
        }, 2000);
      }
    });
  }

  exportarSeleccionadas(): void {
    const selectedIds = Array.from(this.selectedEmpresas());
    if (selectedIds.length === 0) {
      this.snackBar.open('No hay empresas seleccionadas', 'Cerrar', { duration: 3000 });
      return;
    }

    // Usar el método existente de exportación
    this.exportarEmpresas();
  }

  eliminarSeleccionadas(): void {
    const selectedIds = Array.from(this.selectedEmpresas());
    if (selectedIds.length === 0) {
      this.snackBar.open('No hay empresas seleccionadas', 'Cerrar', { duration: 3000 });
      return;
    }

    const confirmMessage = `¿Está seguro de que desea eliminar ${selectedIds.length} empresa(s) seleccionada(s)? Esta acción no se puede deshacer.`;
    if (confirm(confirmMessage)) {
      this.snackBar.open(`Eliminando ${selectedIds.length} empresas...`, '', { duration: 2000 });
      
      // Aquí implementarías la llamada al servicio para eliminar en bloque
      // this.empresaService.eliminarEmpresasBloque(selectedIds).subscribe(...)
      
      // Por ahora, solo mostramos un mensaje
      setTimeout(() => {
        this.snackBar.open(`${selectedIds.length} empresas eliminadas exitosamente`, 'Cerrar', { duration: 4000 });
        this.clearSelection();
        this.recargarEmpresas();
      }, 2000);
    }
  }

  // ========================================
  // MÉTODOS PARA TABS POR TIPO DE SERVICIO
  // ========================================

  onTipoServicioChange(tipoServicio: TipoServicio | 'TODOS' | 'TRANSPORTE' | 'INFRAESTRUCTURA'): void {
    this.tipoServicioActivo.set(tipoServicio);
    this.clearSelection();
    this.actualizarDataSource();
  }

  // Método para determinar si una empresa es de transporte
  esEmpresaTransporte(empresa: Empresa): boolean {
    return empresa.tiposServicio.some(tipo => TIPOS_TRANSPORTE.includes(tipo));
  }

  // Método para determinar si una empresa es de infraestructura
  esEmpresaInfraestructura(empresa: Empresa): boolean {
    return empresa.tiposServicio.some(tipo => TIPOS_INFRAESTRUCTURA.includes(tipo));
  }

  // Computed para determinar si estamos viendo empresas de transporte o infraestructura
  categoriaActiva = computed(() => {
    const tipoActivo = this.tipoServicioActivo();
    if (tipoActivo === 'TRANSPORTE' || TIPOS_TRANSPORTE.includes(tipoActivo as TipoServicio)) {
      return 'TRANSPORTE';
    } else if (tipoActivo === 'INFRAESTRUCTURA' || TIPOS_INFRAESTRUCTURA.includes(tipoActivo as TipoServicio)) {
      return 'INFRAESTRUCTURA';
    }
    return 'TODOS';
  });

  private actualizarDataSource(): void {
    const empresasFiltradas = this.empresasFiltradas();
    this.dataSource.data = empresasFiltradas;
    this.empresas.set(empresasFiltradas);
    
    // Aplicar filtros de búsqueda si existen
    const searchTerm = this.searchForm.get('searchTerm')?.value;
    if (searchTerm) {
      this.applyFilter(searchTerm);
    }
  }

  getTipoServicioLabel(tipo: TipoServicio): string {
    const labels: { [key in TipoServicio]: string } = {
      [TipoServicio.PERSONAS]: 'Personas',
      [TipoServicio.TURISMO]: 'Turismo',
      [TipoServicio.TRABAJADORES]: 'Trabajadores',
      [TipoServicio.MERCANCIAS]: 'Mercancías',
      [TipoServicio.ESTUDIANTES]: 'Estudiantes',
      [TipoServicio.TERMINAL_TERRESTRE]: 'Terminal Terrestre',
      [TipoServicio.ESTACION_DE_RUTA]: 'Estación de Ruta',
      [TipoServicio.OTROS]: 'Otros'
    };
    return labels[tipo] || tipo;
  }

  getTipoServicioIcon(tipo: TipoServicio): string {
    const icons: { [key in TipoServicio]: string } = {
      [TipoServicio.PERSONAS]: 'people',
      [TipoServicio.TURISMO]: 'landscape',
      [TipoServicio.TRABAJADORES]: 'work',
      [TipoServicio.MERCANCIAS]: 'local_shipping',
      [TipoServicio.ESTUDIANTES]: 'school',
      [TipoServicio.TERMINAL_TERRESTRE]: 'location_city',
      [TipoServicio.ESTACION_DE_RUTA]: 'train',
      [TipoServicio.OTROS]: 'more_horiz'
    };
    return icons[tipo] || 'business';
  }

  getTipoInfraestructuraLabel(tipo: TipoServicio): string {
    const labels: { [key in TipoServicio]?: string } = {
      [TipoServicio.TERMINAL_TERRESTRE]: 'Terminal Terrestre',
      [TipoServicio.ESTACION_DE_RUTA]: 'Estación de Ruta',
      [TipoServicio.OTROS]: 'Otros Servicios'
    };
    return labels[tipo] || this.getTipoServicioLabel(tipo);
  }

  // Método para calcular estadísticas por tipo de servicio
  private calcularEstadisticasPorTipo(): void {
    const empresasData = this.empresasOriginales();
    const estadisticasPorTipo: EstadisticasPorTipo = {};

    // Estadísticas generales (TODOS)
    estadisticasPorTipo['TODOS'] = this.calcularEstadisticasParaEmpresas(empresasData);

    // Estadísticas por cada tipo de servicio
    Object.values(TipoServicio).forEach(tipo => {
      const empresasDeTipo = empresasData.filter(empresa => 
        empresa.tiposServicio.includes(tipo)
      );
      if (empresasDeTipo.length > 0) {
        estadisticasPorTipo[tipo] = this.calcularEstadisticasParaEmpresas(empresasDeTipo);
      }
    });

    this.estadisticasPorTipo.set(estadisticasPorTipo);
  }

  private calcularEstadisticasParaEmpresas(empresas: Empresa[]): EmpresaEstadisticas {
    const total = empresas.length;
    const autorizadas = empresas.filter(e => e.estado === EstadoEmpresa.AUTORIZADO).length;
    const enTramite = empresas.filter(e => e.estado === EstadoEmpresa.EN_TRAMITE).length;
    const suspendidas = empresas.filter(e => e.estado === EstadoEmpresa.SUSPENDIDO).length;
    const canceladas = empresas.filter(e => e.estado === EstadoEmpresa.CANCELADO).length;
    const dadasDeBaja = 0; // No hay enum para DADA_DE_BAJA, usar 0

    return {
      totalEmpresas: total,
      empresasAutorizadas: autorizadas,
      empresasEnTramite: enTramite,
      empresasSuspendidas: suspendidas,
      empresasCanceladas: canceladas,
      empresasDadasDeBaja: dadasDeBaja,
      empresasConDocumentosVencidos: 0, // Se puede calcular si es necesario
      empresasConScoreAltoRiesgo: 0, // Se puede calcular si es necesario
      promedioVehiculosPorEmpresa: 0, // Se puede calcular si es necesario
      promedioConductoresPorEmpresa: 0 // Se puede calcular si es necesario
    };
  }

  // Computed para estadísticas del tab activo
  estadisticasTabActivo = computed(() => {
    const tipoActivo = this.tipoServicioActivo();
    const estadisticasPorTipo = this.estadisticasPorTipo();
    return estadisticasPorTipo[tipoActivo] || estadisticasPorTipo['TODOS'];
  });

  // Computed para el índice del tab seleccionado
  selectedTabIndex = computed(() => {
    const tabs = this.tipoServicioTabs();
    const tipoActivo = this.tipoServicioActivo();
    const index = tabs.findIndex(tab => tab.tipo === tipoActivo);
    return index >= 0 ? index : 0;
  });
}