import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
// import { MatChipListboxModule } from '@angular/material/chips';

// Componentes compartidos
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { MatConfirmDialogComponent } from '../../shared/mat-confirm-dialog.component';
import { ConductorFormComponent } from './conductor-form.component';

// Modelos y servicios
import { ConductorService } from '../../services/conductor.service';
import {
  Conductor,
  ConductorCreate,
  ConductorUpdate,
  ConductorFiltros,
  ConductorEstadisticas,
  EstadoConductor,
  EstadoLicencia,
  TipoLicencia,
  Genero,
  EstadoCivil,
  ESTADOS_CONDUCTOR,
  ESTADOS_LICENCIA,
  TIPOS_LICENCIA,
  GENEROS,
  ESTADOS_CIVIL,
  getEstadoConductorLabel,
  getEstadoLicenciaLabel,
  getTipoLicenciaLabel,
  getGeneroLabel,
  getEstadoCivilLabel,
  getEstadoConductorColor,
  getEstadoLicenciaColor,
  calcularEdad,
  formatearFecha,
  formatearTelefono,
  validarDNI,
  validarTelefono,
  validarEmail
} from '../../models/conductor.model';

@Component({
  selector: 'app-conductores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatExpansionModule,
    MatTabsModule,
    MatBadgeModule,
    MatDividerModule,
    MatListModule,
    // MatChipListboxModule,
    SmartIconComponent,
    ConductorFormComponent
  ],
  templateUrl: './conductores.component.html',
  styleUrls: ['./conductores.component.scss']
})
export class ConductoresComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Datos
  conductores: Conductor[] = [];
  conductorSeleccionado: Conductor | null = null;
  estadisticas: ConductorEstadisticas | null = null;
  
  // Estados
  loading = false;
  error: string | null = null;
  modoVista: 'lista' | 'detalle' | 'crear' | 'editar' = 'lista';
  
  // Filtros
  filtrosForm: FormGroup;
  filtrosActivos: ConductorFiltros = {};
  mostrarFiltros = false;
  
  // Búsqueda
  terminoBusqueda = '';
  busquedaSubject = new Subject<string>();
  
  // Paginación
  totalRegistros = 0;
  registrosPorPagina = 10;
  paginaActual = 0;
  
  // Tabla
  displayedColumns: string[] = [
    'dni',
    'nombreCompleto',
    'numeroLicencia',
    'categoriaLicencia',
    'estadoLicencia',
    'estado',
    'empresaId',
    'acciones'
  ];
  
  // Constantes
  readonly ESTADOS_CONDUCTOR = ESTADOS_CONDUCTOR;
  readonly ESTADOS_LICENCIA = ESTADOS_LICENCIA;
  readonly TIPOS_LICENCIA = TIPOS_LICENCIA;
  readonly GENEROS = GENEROS;
  readonly ESTADOS_CIVIL = ESTADOS_CIVIL;
  
  // Enums para el template
  readonly EstadoConductor = EstadoConductor;
  
  // Destructor
  private destroy$ = new Subject<void>();

  constructor(
    private conductorService: ConductorService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filtrosForm = this.formBuilder.group({
      dni: [''],
      nombres: [''],
      apellidoPaterno: [''],
      apellidoMaterno: [''],
      numeroLicencia: [''],
      categoriaLicencia: [''],
      estadoLicencia: [''],
      estado: [''],
      empresaId: [''],
      distrito: [''],
      provincia: [''],
      departamento: [''],
      fechaVencimientoDesde: [''],
      fechaVencimientoHasta: [''],
      experienciaMinima: [''],
      experienciaMaxima: ['']
    });

    // Configurar búsqueda con debounce
    this.busquedaSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarConductores(termino);
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
    this.suscribirseAServicios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== SUSCRIPCIONES ====================

  private suscribirseAServicios(): void {
    // Suscribirse a conductores
    this.conductorService.conductores$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(conductores => {
      this.conductores = conductores;
      this.totalRegistros = conductores.length;
    });

    // Suscribirse a conductor seleccionado
    this.conductorService.conductor$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(conductor => {
      this.conductorSeleccionado = conductor;
    });

    // Suscribirse a estadísticas
    this.conductorService.estadisticas$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(estadisticas => {
      this.estadisticas = estadisticas;
    });

    // Suscribirse a loading
    this.conductorService.loading$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(loading => {
      this.loading = loading;
    });

    // Suscribirse a errores
    this.conductorService.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      this.error = error;
      if (error) {
        this.mostrarError(error);
      }
    });
  }

  // ==================== CARGA DE DATOS ====================

  private cargarDatos(): void {
    this.conductorService.getConductores().subscribe({
      next: (conductores) => {
        console.log('Conductores cargados:', conductores);
      },
      error: (error) => {
        console.error('Error al cargar conductores:', error);
        this.error = error.message || 'Error al cargar conductores';
      }
    });
    
    this.conductorService.getEstadisticas().subscribe({
      next: (estadisticas) => {
        console.log('Estadísticas cargadas:', estadisticas);
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  // ==================== NAVEGACIÓN ====================

  navegarALista(): void {
    this.modoVista = 'lista';
    this.conductorSeleccionado = null;
    this.conductorService.clearConductor();
  }

  navegarADetalle(conductor: Conductor): void {
    this.conductorSeleccionado = conductor;
    this.modoVista = 'detalle';
  }

  navegarACrear(): void {
    this.modoVista = 'crear';
  }

  navegarAEditar(conductor: Conductor): void {
    this.conductorSeleccionado = conductor;
    this.modoVista = 'editar';
  }

  // ==================== OPERACIONES CRUD ====================

  crearConductor(conductorData: ConductorCreate): void {
    this.conductorService.createConductor(conductorData).subscribe({
      next: (conductor) => {
        this.mostrarExito('Conductor creado exitosamente');
        this.navegarALista();
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error al crear conductor:', error);
      }
    });
  }

  actualizarConductor(id: string, conductorData: ConductorUpdate): void {
    this.conductorService.updateConductor(id, conductorData).subscribe({
      next: (conductor) => {
        this.mostrarExito('Conductor actualizado exitosamente');
        this.navegarADetalle(conductor);
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error al actualizar conductor:', error);
      }
    });
  }

  eliminarConductor(conductor: Conductor): void {
    const dialogRef = this.dialog.open(MatConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Confirmar eliminación',
        mensaje: `¿Está seguro que desea eliminar al conductor ${conductor.nombreCompleto}?`,
        confirmacion: 'Eliminar',
        cancelacion: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.conductorService.deleteConductor(conductor.id).subscribe({
          next: () => {
            this.mostrarExito('Conductor eliminado exitosamente');
            this.cargarDatos();
          },
          error: (error) => {
            console.error('Error al eliminar conductor:', error);
          }
        });
      }
    });
  }

  // ==================== OPERACIONES ESPECIALES ====================

  cambiarEstadoConductor(conductor: Conductor, nuevoEstado: EstadoConductor): void {
    this.conductorService.cambiarEstadoConductor(conductor.id, nuevoEstado).subscribe({
      next: (conductorActualizado) => {
        this.mostrarExito(`Estado del conductor cambiado a ${getEstadoConductorLabel(nuevoEstado)}`);
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
      }
    });
  }

  asignarEmpresa(conductor: Conductor, empresaId: string, cargo?: string): void {
    this.conductorService.asignarEmpresa(conductor.id, empresaId, cargo).subscribe({
      next: (conductorActualizado) => {
        this.mostrarExito('Conductor asignado a empresa exitosamente');
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error al asignar empresa:', error);
      }
    });
  }

  desasignarEmpresa(conductor: Conductor): void {
    const dialogRef = this.dialog.open(MatConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Confirmar desasignación',
        mensaje: `¿Está seguro que desea desasignar al conductor ${conductor.nombreCompleto} de la empresa?`,
        confirmacion: 'Desasignar',
        cancelacion: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.conductorService.desasignarEmpresa(conductor.id).subscribe({
          next: (conductorActualizado) => {
            this.mostrarExito('Conductor desasignado exitosamente');
            this.cargarDatos();
          },
          error: (error) => {
            console.error('Error al desasignar empresa:', error);
          }
        });
      }
    });
  }

  verificarLicencia(conductor: Conductor): void {
    this.conductorService.verificarLicencia(conductor.id).subscribe({
      next: (conductorActualizado) => {
        this.mostrarExito('Licencia verificada exitosamente');
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error al verificar licencia:', error);
      }
    });
  }

  // ==================== FILTROS Y BÚSQUEDA ====================

  aplicarFiltros(): void {
    const filtros = this.filtrosForm.value;
    
    // Limpiar filtros vacíos
    Object.keys(filtros).forEach(key => {
      if (!filtros[key] || filtros[key] === '') {
        delete filtros[key];
      }
    });

    this.filtrosActivos = filtros;
    this.paginaActual = 0;
    
    if (this.paginator) {
      this.paginator.firstPage();
    }

    this.conductorService.getConductoresConFiltros(filtros, 0, this.registrosPorPagina);
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.filtrosActivos = {};
    this.paginaActual = 0;
    
    if (this.paginator) {
      this.paginator.firstPage();
    }

    this.conductorService.getConductores();
  }

  buscarConductores(termino: string): void {
    if (termino.trim()) {
      this.conductorService.searchConductores(termino);
    } else {
      this.conductorService.getConductores();
    }
  }

  onBusquedaChange(event: any): void {
    const termino = event.target.value;
    this.terminoBusqueda = termino;
    this.busquedaSubject.next(termino);
  }

  // ==================== PAGINACIÓN ====================

  onPageChange(event: any): void {
    this.paginaActual = event.pageIndex;
    this.registrosPorPagina = event.pageSize;
    
    const skip = this.paginaActual * this.registrosPorPagina;
    
    if (Object.keys(this.filtrosActivos).length > 0) {
      this.conductorService.getConductoresConFiltros(this.filtrosActivos, skip, this.registrosPorPagina);
    } else {
      this.conductorService.getConductores(skip, this.registrosPorPagina);
    }
  }

  // ==================== ORDENAMIENTO ====================

  onSortChange(event: any): void {
    // Implementar ordenamiento si es necesario
    console.log('Ordenamiento cambiado:', event);
  }

  // ==================== EXPORTACIÓN ====================

  exportarConductores(formato: 'pdf' | 'excel' | 'csv'): void {
    this.conductorService.exportarConductores(formato).subscribe({
      next: (response) => {
        this.mostrarExito(`Exportación a ${formato.toUpperCase()} iniciada`);
      },
      error: (error) => {
        console.error('Error al exportar:', error);
        this.mostrarError('Error al exportar conductores');
      }
    });
  }

  // ==================== VALIDACIONES ====================

  validarDNI(dni: string): boolean {
    return validarDNI(dni);
  }

  validarTelefono(telefono: string): boolean {
    return validarTelefono(telefono);
  }

  validarEmail(email: string): boolean {
    return validarEmail(email);
  }

  // ==================== UTILIDADES ====================

  getEstadoConductorLabel(estado: EstadoConductor): string {
    return getEstadoConductorLabel(estado);
  }

  getEstadoLicenciaLabel(estado: EstadoLicencia): string {
    return getEstadoLicenciaLabel(estado);
  }

  getTipoLicenciaLabel(tipo: TipoLicencia): string {
    return getTipoLicenciaLabel(tipo);
  }

  getGeneroLabel(genero: Genero): string {
    return getGeneroLabel(genero);
  }

  getEstadoCivilLabel(estadoCivil: EstadoCivil): string {
    return getEstadoCivilLabel(estadoCivil);
  }

  getEstadoConductorColor(estado: EstadoConductor): string {
    return getEstadoConductorColor(estado);
  }

  getEstadoLicenciaColor(estado: EstadoLicencia): string {
    return getEstadoLicenciaColor(estado);
  }

  calcularEdad(fechaNacimiento: Date | string): number {
    // Convertir string a Date si es necesario
    const fecha = typeof fechaNacimiento === 'string' ? new Date(fechaNacimiento) : fechaNacimiento;
    return calcularEdad(fecha);
  }

  formatearFecha(fecha: Date | string): string {
    // Convertir string a Date si es necesario
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return formatearFecha(fechaObj);
  }

  formatearTelefono(telefono: string): string {
    return formatearTelefono(telefono);
  }

  // ==================== NOTIFICACIONES ====================

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

  // ==================== REFRESCAR ====================

  refrescar(): void {
    this.conductorService.refresh();
  }

  // ==================== TOGGLE FILTROS ====================

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  // ==================== LIMPIAR ERROR ====================

  limpiarError(): void {
    this.error = null;
  }
} 