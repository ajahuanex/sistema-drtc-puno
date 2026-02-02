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
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { Empresa, EmpresaEstadisticas } from '../../models/empresa.model';
import { FiltrosAvanzadosModalComponent, FiltrosAvanzados } from './filtros-avanzados-modal.component';

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: string;
}

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

  // Configuración de columnas como signal
  columnConfigs = signal<ColumnConfig[]>([
    { key: 'ruc', label: 'RUC', visible: true, sortable: true, width: '120px' },
    { key: 'razonSocial', label: 'RAZÓN SOCIAL', visible: true, sortable: true, width: '250px' },
    { key: 'estado', label: 'ESTADO', visible: true, sortable: true, width: '120px' },
    { key: 'tipoServicio', label: 'TIPO DE SERVICIO', visible: true, sortable: true, width: '150px' },
    { key: 'rutas', label: 'RUTAS', visible: true, sortable: true, width: '100px' },
    { key: 'vehiculos', label: 'VEHÍCULOS', visible: true, sortable: true, width: '100px' },
    { key: 'conductores', label: 'CONDUCTORES', visible: true, sortable: true, width: '120px' },
    { key: 'acciones', label: 'ACCIONES', visible: true, sortable: false, width: '120px' }
  ]);

  // Computed para columnas visibles
  displayedColumns = computed(() => 
    this.columnConfigs().filter(col => col.visible).map(col => col.key)
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
    this.columnConfigs().forEach(col => {
      this.columnForm.addControl(col.key, this.fb.control(col.visible));
      this.columnForm.get(col.key)?.valueChanges.subscribe(visible => {
        // Actualizar el signal con una nueva copia del array
        const currentConfigs = this.columnConfigs();
        const updatedConfigs = currentConfigs.map(config => 
          config.key === col.key ? { ...config, visible } : config
        );
        this.columnConfigs.set(updatedConfigs);
      });
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

  private configurarDataSource(): void {
    if (this.paginator && this.sort) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      
      // Configurar sorting personalizado para datos anidados
      this.dataSource.sortingDataAccessor = (data: Empresa, sortHeaderId: string) => {
        switch (sortHeaderId) {
          case 'ruc':
            return data.ruc;
          case 'razonSocial':
            // Remover comillas y normalizar para ordenamiento alfabético
            return data.razonSocial.principal
              .replace(/["""'']/g, '') // Remover comillas
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
          case 'estado':
            return data.estado;
          case 'direccion':
            return data.direccionFiscal || '';
          case 'tipoServicio':
            return data.tiposServicio ? data.tiposServicio.join(', ') : '';
          case 'representanteLegal':
            return data.representanteLegal ? 
              (data.representanteLegal.nombres + ' ' + data.representanteLegal.apellidos).toLowerCase() : '';
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
      
      // Configurar filtro personalizado
      this.dataSource.filterPredicate = (data: Empresa, filter: string) => {
        const searchTerm = filter.toLowerCase();
        return data.ruc.toLowerCase().includes(searchTerm) ||
               data.razonSocial.principal.toLowerCase().includes(searchTerm) ||
               data.estado.toLowerCase().includes(searchTerm);
      };
    }
  }

  setupReactiveSearch(): void {
    this.searchForm.get('searchTerm')?.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.applyFilter(searchTerm);
    });
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  toggleColumnConfig(): void {
    this.showColumnConfig.set(!this.showColumnConfig());
  }

  resetColumns(): void {
    const defaultVisibleColumns = ['ruc', 'razonSocial', 'estado', 'tipoServicio', 'rutas', 'vehiculos', 'conductores', 'acciones'];
    
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

  loadEmpresas(): void {
    this.isLoading.set(true);
    this.empresaService.getEmpresas(0, 1000).subscribe({
      next: (empresas) => {
        this.empresasOriginales.set(empresas);
        this.empresas.set(empresas);
        this.dataSource.data = empresas;
        
        // Reconfigurar el paginador después de cargar datos
        setTimeout(() => {
          this.configurarDataSource();
        }, 0);
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ ERROR CARGANDO EMPRESAS::', error);
        console.error('❌ Status::', error.status);
        console.error('❌ Message::', error.message);
        console.error('❌ Error completo::', error);
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
        console.error('ERROR CARGANDO ESTADÍSTICAS::', error);
      }
    });
  }

  recargarEmpresas(): void {
    this.loadEmpresas();
    this.loadEstadisticas();
  }

  clearSearch(): void {
    this.searchForm.get('searchTerm')?.setValue('');
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
    const currentSelection = new Set(this.selectedEmpresas());
    if (currentSelection.has(empresaId)) {
      currentSelection.delete(empresaId);
    } else {
      currentSelection.add(empresaId);
    }
    this.selectedEmpresas.set(currentSelection);
  }

  isEmpresaSelected(empresaId: string): boolean {
    return this.selectedEmpresas().has(empresaId);
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
}