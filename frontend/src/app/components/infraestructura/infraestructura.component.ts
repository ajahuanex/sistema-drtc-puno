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
import { AuthService } from '../../services/auth.service';
import { InfraestructuraService } from '../../services/infraestructura.service';
import { Infraestructura, InfraestructuraEstadisticas, TipoInfraestructura, EstadoInfraestructura, InfraestructuraUtils } from '../../models/infraestructura.model';
import { InfraestructuraModalComponent, InfraestructuraModalData } from './infraestructura-modal.component';

@Component({
  selector: 'app-infraestructura',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    MatTabsModule
  ],
  templateUrl: './infraestructura.component.html',
  styleUrl: './infraestructura.component.scss'
})
export class InfraestructuraComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private infraestructuraService = inject(InfraestructuraService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Signals
  infraestructuras = signal<Infraestructura[]>([]);
  infraestructurasOriginales = signal<Infraestructura[]>([]);
  estadisticas = signal<InfraestructuraEstadisticas | null>(null);
  isLoading = signal(false);
  selectedTab = signal(0);
  searchText = signal('');
  showColumnConfig = signal(false);

  // Table configuration
  dataSource = new MatTableDataSource<Infraestructura>([]);
  displayedColumns = signal<string[]>([
    'select',
    'ruc',
    'razonSocial',
    'tipo',
    'ubicacion',
    'capacidad',
    'estado',
    'actions'
  ]);

  // Available columns for configuration
  availableColumns = [
    { key: 'select', label: 'Selección', enabled: true },
    { key: 'ruc', label: 'RUC', enabled: true },
    { key: 'razonSocial', label: 'Razón Social', enabled: true },
    { key: 'tipo', label: 'Tipo', enabled: true },
    { key: 'ubicacion', label: 'Ubicación', enabled: true },
    { key: 'capacidad', label: 'Capacidad', enabled: true },
    { key: 'estado', label: 'Estado', enabled: true },
    { key: 'fechaRegistro', label: 'Fecha Registro', enabled: false },
    { key: 'representante', label: 'Representante', enabled: false },
    { key: 'contacto', label: 'Contacto', enabled: false },
    { key: 'actions', label: 'Acciones', enabled: true }
  ];

  // Filters
  filtrosForm: FormGroup;
  tiposInfraestructura = Object.values(TipoInfraestructura);
  estadosInfraestructura = Object.values(EstadoInfraestructura);

  // Selection
  selectedInfraestructuras = signal<Infraestructura[]>([]);

  // Computed properties
  infraestructurasFiltradas = computed(() => {
    const infraestructuras = this.infraestructuras();
    const searchText = this.searchText().toLowerCase();
    
    if (!searchText) return infraestructuras;
    
    return infraestructuras.filter(infraestructura =>
      infraestructura.ruc.toLowerCase().includes(searchText) ||
      infraestructura.razonSocial.principal.toLowerCase().includes(searchText) ||
      infraestructura.direccionFiscal.toLowerCase().includes(searchText) ||
      infraestructura.representanteLegal.nombres.toLowerCase().includes(searchText) ||
      infraestructura.representanteLegal.apellidos.toLowerCase().includes(searchText)
    );
  });

  // Tab counts
  totalInfraestructuras = computed(() => this.infraestructuras().length);
  terminalesTerrestre = computed(() => 
    this.infraestructuras().filter(i => i.tipoInfraestructura === TipoInfraestructura.TERMINAL_TERRESTRE).length
  );
  estacionesRuta = computed(() => 
    this.infraestructuras().filter(i => i.tipoInfraestructura === TipoInfraestructura.ESTACION_DE_RUTA).length
  );
  otros = computed(() => 
    this.infraestructuras().filter(i => i.tipoInfraestructura === TipoInfraestructura.OTROS).length
  );

  constructor() {
    this.filtrosForm = this.fb.group({
      tipoInfraestructura: [[]],
      estado: [[]],
      departamento: [''],
      provincia: [''],
      distrito: [''],
      capacidadMinima: [''],
      capacidadMaxima: [''],
      fechaRegistroDesde: [''],
      fechaRegistroHasta: [''],
      conDocumentosVencidos: [false],
      scoreRiesgoMinimo: [''],
      scoreRiesgoMaximo: ['']
    });
  }

  ngOnInit(): void {
    this.loadInfraestructuras();
    this.loadEstadisticas();
    this.setupSearchSubscription();
  }

  ngAfterViewInit(): void {
    this.configurarDataSource();
  }

  setupSearchSubscription(): void {
    // Configurar búsqueda reactiva si es necesario
  }

  configurarDataSource(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  loadInfraestructuras(): void {
    this.isLoading.set(true);
    this.infraestructuraService.getInfraestructuras(0, 1000).subscribe({
      next: (infraestructuras) => {
        this.infraestructurasOriginales.set(infraestructuras);
        this.infraestructuras.set(infraestructuras);
        this.dataSource.data = infraestructuras;
        
        // Configurar DataSource después de cargar datos
        setTimeout(() => {
          this.configurarDataSource();
        }, 0);
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error cargando infraestructuras:', error);
        this.isLoading.set(false);
        this.snackBar.open('ERROR AL CARGAR INFRAESTRUCTURAS: ' + (error.message || 'Error desconocido'), 'CERRAR', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  loadEstadisticas(): void {
    this.infraestructuraService.getEstadisticas().subscribe({
      next: (estadisticas) => {
        this.estadisticas.set(estadisticas);
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas:', error);
      }
    });
  }

  // Métodos para obtener etiquetas e iconos
  getTipoInfraestructuraLabel(tipo: TipoInfraestructura): string {
    return InfraestructuraUtils.getTipoInfraestructuraLabel(tipo);
  }

  getTipoInfraestructuraIcon(tipo: TipoInfraestructura): string {
    return InfraestructuraUtils.getTipoInfraestructuraIcon(tipo);
  }

  getEstadoInfraestructuraLabel(estado: EstadoInfraestructura): string {
    return InfraestructuraUtils.getEstadoInfraestructuraLabel(estado);
  }

  getEstadoInfraestructuraColor(estado: EstadoInfraestructura): string {
    return InfraestructuraUtils.getEstadoInfraestructuraColor(estado);
  }

  // Métodos de navegación
  verDetalle(infraestructura: Infraestructura): void {
    this.router.navigate(['/infraestructura', infraestructura.id]);
  }

  verInfraestructura(id: string): void {
    this.router.navigate(['/infraestructura', id]);
  }

  editarInfraestructura(infraestructura: Infraestructura): void {
    this.abrirModalEditar(infraestructura);
  }

  nuevaInfraestructura(): void {
    this.abrirModalCrear();
  }

  // Métodos de modal
  abrirModalCrear(): void {
    const dialogRef = this.dialog.open(InfraestructuraModalComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: {
        modo: 'crear'
      } as InfraestructuraModalData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Infraestructura creada:', result);
        this.loadInfraestructuras();
        this.loadEstadisticas();
      }
    });
  }

  abrirModalEditar(infraestructura: Infraestructura): void {
    const dialogRef = this.dialog.open(InfraestructuraModalComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: {
        modo: 'editar',
        infraestructura: infraestructura
      } as InfraestructuraModalData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Infraestructura actualizada:', result);
        this.loadInfraestructuras();
        this.loadEstadisticas();
      }
    });
  }

  // Métodos de eliminación
  eliminarInfraestructura(infraestructura: Infraestructura): void {
    if (confirm(`¿Está seguro de eliminar la infraestructura "${infraestructura.razonSocial.principal}"?`)) {
      this.infraestructuraService.eliminarInfraestructura(infraestructura.id).subscribe({
        next: () => {
          this.snackBar.open('Infraestructura eliminada exitosamente', 'CERRAR', {
            duration: 3000
          });
          this.loadInfraestructuras();
          this.loadEstadisticas();
        },
        error: (error) => {
          this.snackBar.open('Error al eliminar la infraestructura: ' + error.message, 'CERRAR', {
            duration: 5000
          });
        }
      });
    }
  }

  // Métodos de filtrado
  onTabChange(index: number): void {
    this.selectedTab.set(index);
    this.aplicarFiltroTab(index);
  }

  aplicarFiltroTab(tabIndex: number): void {
    const todasInfraestructuras = this.infraestructurasOriginales();
    let infraestructurasFiltradas: Infraestructura[];

    switch (tabIndex) {
      case 0: // Todas
        infraestructurasFiltradas = todasInfraestructuras;
        break;
      case 1: // Terminales Terrestres
        infraestructurasFiltradas = todasInfraestructuras.filter(i => 
          i.tipoInfraestructura === TipoInfraestructura.TERMINAL_TERRESTRE
        );
        break;
      case 2: // Estaciones de Ruta
        infraestructurasFiltradas = todasInfraestructuras.filter(i => 
          i.tipoInfraestructura === TipoInfraestructura.ESTACION_DE_RUTA
        );
        break;
      case 3: // Otros
        infraestructurasFiltradas = todasInfraestructuras.filter(i => 
          i.tipoInfraestructura === TipoInfraestructura.OTROS
        );
        break;
      default:
        infraestructurasFiltradas = todasInfraestructuras;
    }

    this.infraestructuras.set(infraestructurasFiltradas);
    this.dataSource.data = infraestructurasFiltradas;
  }

  onSearchChange(searchText: string): void {
    this.searchText.set(searchText);
    this.dataSource.filter = searchText.trim().toLowerCase();
  }

  limpiarBusqueda(): void {
    this.searchText.set('');
    this.dataSource.filter = '';
  }

  // Métodos de configuración de columnas
  toggleColumnConfig(): void {
    this.showColumnConfig.set(!this.showColumnConfig());
  }

  onColumnToggle(column: any): void {
    column.enabled = !column.enabled;
    this.updateDisplayedColumns();
  }

  updateDisplayedColumns(): void {
    const enabledColumns = this.availableColumns
      .filter(col => col.enabled)
      .map(col => col.key);
    this.displayedColumns.set(enabledColumns);
  }

  resetColumns(): void {
    this.availableColumns.forEach(col => {
      col.enabled = ['select', 'ruc', 'razonSocial', 'tipo', 'ubicacion', 'capacidad', 'estado', 'actions'].includes(col.key);
    });
    this.updateDisplayedColumns();
  }

  isColumnVisible(columnKey: string): boolean {
    return this.displayedColumns().includes(columnKey);
  }

  // Métodos de selección
  isAllSelected(): boolean {
    const numSelected = this.selectedInfraestructuras().length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedInfraestructuras.set([]);
    } else {
      this.selectedInfraestructuras.set([...this.dataSource.data]);
    }
  }

  toggleSelection(infraestructura: Infraestructura): void {
    const selected = this.selectedInfraestructuras();
    const index = selected.findIndex(i => i.id === infraestructura.id);
    
    if (index >= 0) {
      const newSelected = [...selected];
      newSelected.splice(index, 1);
      this.selectedInfraestructuras.set(newSelected);
    } else {
      this.selectedInfraestructuras.set([...selected, infraestructura]);
    }
  }

  isSelected(infraestructura: Infraestructura): boolean {
    return this.selectedInfraestructuras().some(i => i.id === infraestructura.id);
  }

  // Métodos de exportación
  exportarExcel(): void {
    this.infraestructuraService.exportarExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `infraestructuras_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.snackBar.open('Error al exportar: ' + error.message, 'CERRAR', {
          duration: 5000
        });
      }
    });
  }

  exportarPDF(): void {
    this.infraestructuraService.exportarPDF().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `infraestructuras_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.snackBar.open('Error al exportar: ' + error.message, 'CERRAR', {
          duration: 5000
        });
      }
    });
  }

  // Métodos utilitarios
  formatearCapacidad(capacidad: number | undefined): string {
    if (!capacidad) return 'N/A';
    return InfraestructuraUtils.formatearCapacidad(capacidad);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}