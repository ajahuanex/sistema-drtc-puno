import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TransferirVehiculoModalComponent, TransferirVehiculoData } from './transferir-vehiculo-modal.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { VehiculoModalService } from '../../services/vehiculo-modal.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./vehiculos.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
  ],
  template: `
    <div class="vehiculos-container">
      <div class="page-header">
        <div>
          <h1>Gestión de Vehículos</h1>
          <p>Administra los vehículos del sistema</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button 
                  color="primary" 
                  (click)="nuevoVehiculo()">
            <mat-icon>add</mat-icon>
            Nuevo Vehículo
          </button>
        </div>
      </div>

      <!-- Dashboard de estadísticas -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card total">
            <div class="stat-icon">
              <mat-icon>directions_car</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ vehiculos().length }}</div>
              <div class="stat-label">TOTAL VEHÍCULOS</div>
              <div class="stat-trend positive">
                <mat-icon>trending_up</mat-icon>
                <span>+{{ getVehiculosActivos() }} activos</span>
              </div>
            </div>
          </div>
          
          <div class="stat-card activos">
            <div class="stat-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ getVehiculosActivos() }}</div>
              <div class="stat-label">VEHÍCULOS ACTIVOS</div>
              <div class="stat-percentage">
                {{ vehiculos().length > 0 ? ((getVehiculosActivos() / vehiculos().length) * 100).toFixed(1) : 0 }}%
              </div>
            </div>
          </div>
          
          <div class="stat-card suspendidos">
            <div class="stat-icon">
              <mat-icon>warning</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ getVehiculosPorEstado('SUSPENDIDO') }}</div>
              <div class="stat-label">SUSPENDIDOS</div>
              <div class="stat-percentage">
                {{ vehiculos().length > 0 ? ((getVehiculosPorEstado('SUSPENDIDO') / vehiculos().length) * 100).toFixed(1) : 0 }}%
              </div>
            </div>
          </div>
          
          <div class="stat-card empresas">
            <div class="stat-icon">
              <mat-icon>business</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ empresas().length }}</div>
              <div class="stat-label">EMPRESAS</div>
              <div class="stat-trend neutral">
                <mat-icon>business_center</mat-icon>
                <span>Operando en el sistema</span>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      <!-- Búsqueda rápida -->
      <mat-card class="search-card">
        <mat-card-content>
          <div class="search-container">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Búsqueda rápida</mat-label>
              <input matInput 
                     [formControl]="busquedaRapidaControl"
                     placeholder="Buscar por placa, marca, empresa, resolución..."
                     (keyup)="onBusquedaRapida()">
              <mat-icon matSuffix>search</mat-icon>
              <mat-hint>Presiona Enter para buscar</mat-hint>
            </mat-form-field>
            <button mat-icon-button 
                    color="primary" 
                    (click)="onBusquedaRapida()"
                    matTooltip="Buscar">
              <mat-icon>search</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Filtros avanzados -->
      <mat-card class="filters-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>filter_list</mat-icon>
            Filtros Avanzados
          </mat-card-title>
          <mat-card-subtitle>Filtra vehículos por criterios específicos</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="filters-row">
            <!-- Filtro por placa -->
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Placa</mat-label>
              <input matInput 
                     [formControl]="placaControl"
                     placeholder="Buscar por placa">
              <mat-icon matSuffix>directions_car</mat-icon>
            </mat-form-field>

            <!-- Filtro por empresa -->
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Empresa</mat-label>
              <input matInput 
                     [matAutocomplete]="empresaAuto" 
                     [formControl]="empresaControl"
                     placeholder="Buscar empresa">
              <mat-autocomplete #empresaAuto="matAutocomplete" 
                               [displayWith]="displayEmpresa"
                               (optionSelected)="onEmpresaSelected($event)">
                                 @for (empresa of empresasFiltradas | async; track empresa.id) {
                   <mat-option [value]="empresa">
                     {{ empresa.ruc }} - {{ empresa.razonSocial.principal }}
                   </mat-option>
                 }
              </mat-autocomplete>
              <mat-icon matSuffix>business</mat-icon>
              <button matSuffix mat-icon-button 
                      type="button" 
                      (click)="limpiarEmpresa()"
                      *ngIf="empresaControl.value"
                      matTooltip="Limpiar empresa">
                <mat-icon>clear</mat-icon>
              </button>
            </mat-form-field>

            <!-- Filtro por resolución -->
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Resolución</mat-label>
              <input matInput 
                     [matAutocomplete]="resolucionAuto" 
                     [formControl]="resolucionControl"
                     placeholder="Buscar resolución">
              <mat-autocomplete #resolucionAuto="matAutocomplete" 
                               [displayWith]="displayResolucion"
                               (optionSelected)="onResolucionSelected($event)">
                                 @for (resolucion of resolucionesFiltradas | async; track resolucion.id) {
                   <mat-option [value]="resolucion">
                     {{ resolucion.nroResolucion }} - {{ resolucion.tipoTramite }}
                   </mat-option>
                 }
              </mat-autocomplete>
              <mat-icon matSuffix>description</mat-icon>
              <button matSuffix mat-icon-button 
                      type="button" 
                      (click)="limpiarResolucion()"
                      *ngIf="resolucionControl.value"
                      matTooltip="Limpiar resolución">
                <mat-icon>clear</mat-icon>
              </button>
            </mat-form-field>

            <!-- Filtro por estado -->
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Estado</mat-label>
              <mat-select [formControl]="estadoControl">
                <mat-option value="">Todos los estados</mat-option>
                <mat-option value="ACTIVO">Activo</mat-option>
                <mat-option value="INACTIVO">Inactivo</mat-option>
                <mat-option value="SUSPENDIDO">Suspendido</mat-option>
                <mat-option value="EN_REVISION">En Revisión</mat-option>
              </mat-select>
              <mat-icon matSuffix>info</mat-icon>
            </mat-form-field>

            <!-- Botones de acción -->
            <div class="filter-actions">
              <button mat-raised-button 
                      color="primary" 
                      (click)="aplicarFiltros()">
                <mat-icon>search</mat-icon>
                Filtrar
              </button>
              <button mat-stroked-button 
                      color="warn" 
                      (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Información de filtros activos -->
      @if (tieneFiltrosActivos()) {
        <mat-card class="info-card">
          <mat-card-content>
            <div class="filter-info">
              <h4>Filtros Activos:</h4>
              <div class="filter-chips">
                @if (busquedaRapidaControl.value) {
                  <mat-chip color="primary" (removed)="limpiarBusquedaRapida()">
                    Búsqueda: "{{ busquedaRapidaControl.value }}"
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                }
                @if (placaControl.value) {
                  <mat-chip color="accent" (removed)="limpiarPlaca()">
                    Placa: {{ placaControl.value }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                }
                @if (empresaSeleccionada()) {
                  <mat-chip color="warn" (removed)="limpiarEmpresa()">
                    Empresa: {{ empresaSeleccionada()?.razonSocial?.principal }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                }
                @if (resolucionSeleccionada()) {
                  <mat-chip color="warn" (removed)="limpiarResolucion()">
                    Resolución: {{ resolucionSeleccionada()?.nroResolucion }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                }
                @if (estadoControl.value) {
                  <mat-chip color="warn" (removed)="limpiarEstado()">
                    Estado: {{ estadoControl.value }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                }
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Tabla de vehículos mejorada -->
      <mat-card class="table-card">
        <mat-card-content>
          @if (cargando()) {
            <div class="loading-container">
              <mat-spinner></mat-spinner>
              <p>Cargando vehículos...</p>
            </div>
          } @else {
            <div class="table-container">
              <!-- Controles de tabla -->
              <div class="table-controls">
                <div class="table-info">
                  <span class="results-count">
                    Mostrando {{ getPaginatedVehiculos().length }} de {{ vehiculosFiltrados().length }} vehículos
                  </span>
                </div>
                <div class="table-actions">
                  <button mat-icon-button 
                          [matMenuTriggerFor]="columnMenu"
                          matTooltip="Configurar columnas">
                    <mat-icon>view_column</mat-icon>
                  </button>
                  <mat-menu #columnMenu="matMenu">
                    @for (col of allColumns; track col) {
                      <button mat-menu-item 
                              (click)="toggleColumn(col)"
                              [class.selected]="isColumnVisible(col)">
                        <mat-icon>{{ isColumnVisible(col) ? 'visibility' : 'visibility_off' }}</mat-icon>
                        {{ getColumnDisplayName(col) }}
                      </button>
                    }
                  </mat-menu>
                  <button mat-icon-button 
                          (click)="exportarVehiculos()"
                          matTooltip="Exportar vehículos">
                    <mat-icon>download</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Tabla con ordenamiento -->
              <table mat-table [dataSource]="getPaginatedVehiculos()" 
                     matSort 
                     matSortActive="placa"
                     matSortDirection="asc"
                     class="vehiculos-table">
                
                <!-- Columna Placa -->
                <ng-container matColumnDef="placa">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>PLACA</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ vehiculo.placa }}</td>
                </ng-container>

                <!-- Columna Empresa -->
                <ng-container matColumnDef="empresa">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>EMPRESA</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ getEmpresaNombre(vehiculo.empresaActualId) }}</td>
                </ng-container>

                <!-- Columna Resolución -->
                <ng-container matColumnDef="resolucion">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>RESOLUCIÓN</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ getResolucionNumero(vehiculo.resolucionId) }}</td>
                </ng-container>

                <!-- Columna Categoría -->
                <ng-container matColumnDef="categoria">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>CATEGORÍA</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ vehiculo.categoria }}</td>
                </ng-container>

                <!-- Columna Marca -->
                <ng-container matColumnDef="marca">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>MARCA</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ vehiculo.marca }}</td>
                </ng-container>

                <!-- Columna Modelo -->
                <ng-container matColumnDef="modelo">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>MODELO</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ vehiculo.modelo || 'N/A' }}</td>
                </ng-container>

                <!-- Columna Año -->
                <ng-container matColumnDef="anioFabricacion">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>AÑO</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ vehiculo.anioFabricacion || 'N/A' }}</td>
                </ng-container>

                <!-- Columna Estado -->
                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>ESTADO</th>
                  <td mat-cell *matCellDef="let vehiculo">
                    <span class="estado-badge" [class]="getEstadoClass(vehiculo.estado)">
                      {{ vehiculo.estado }}
                    </span>
                  </td>
                </ng-container>

                <!-- Columna Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>ACCIONES</th>
                  <td mat-cell *matCellDef="let vehiculo">
                    <button mat-icon-button 
                            [matMenuTriggerFor]="actionMenu"
                            matTooltip="Acciones">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #actionMenu="matMenu">
                      <button mat-menu-item (click)="verDetalle(vehiculo)">
                        <mat-icon>visibility</mat-icon>
                        <span>Ver detalle</span>
                      </button>
                      <button mat-menu-item (click)="verHistorial(vehiculo)">
                        <mat-icon>history</mat-icon>
                        <span>Ver historial</span>
                      </button>
                      <button mat-menu-item (click)="transferirVehiculo(vehiculo)">
                        <mat-icon>swap_horiz</mat-icon>
                        <span>Transferir empresa</span>
                      </button>
                      <button mat-menu-item (click)="solicitarBajaVehiculo(vehiculo)">
                        <mat-icon>remove_circle</mat-icon>
                        <span>Solicitar baja</span>
                      </button>
                      <button mat-menu-item (click)="editarVehiculo(vehiculo)">
                        <mat-icon>edit</mat-icon>
                        <span>Editar</span>
                      </button>
                      <button mat-menu-item (click)="duplicarVehiculo(vehiculo)">
                        <mat-icon>content_copy</mat-icon>
                        <span>Duplicar</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item (click)="eliminarVehiculo(vehiculo)" 
                              class="danger-action">
                        <mat-icon>delete</mat-icon>
                        <span>Eliminar</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>

              <!-- Paginador -->
              <mat-paginator [length]="vehiculosFiltrados().length"
                            [pageSize]="pageSize"
                            [pageSizeOptions]="[5, 10, 25, 50, 100]"
                            [pageIndex]="currentPage"
                            (page)="onPageChange($event)"
                            showFirstLastButtons
                            aria-label="Seleccionar página de vehículos">
              </mat-paginator>

              @if (getPaginatedVehiculos().length === 0) {
                <div class="no-data">
                  <mat-icon>directions_car</mat-icon>
                  <p>No se encontraron vehículos</p>
                  <p class="no-data-hint">Intenta ajustar los filtros o la búsqueda</p>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class VehiculosComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Servicios
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  private vehiculoModalService = inject(VehiculoModalService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // Señales
  vehiculos = signal<Vehiculo[]>([]);
  empresas = signal<Empresa[]>([]);
  resoluciones = signal<Resolucion[]>([]);
  cargando = signal(false);
  empresaSeleccionada = signal<Empresa | null>(null);
  resolucionSeleccionada = signal<Resolucion | null>(null);

  // Formulario de filtros
  filtrosForm!: FormGroup;
  empresasFiltradas!: Observable<Empresa[]>;
  resolucionesFiltradas!: Observable<Resolucion[]>;

  // Búsqueda rápida
  busquedaRapidaControl = new FormControl('');

  // Paginación
  currentPage = 0;
  pageSize = 25;

  // Columnas de la tabla
  allColumns = ['placa', 'empresa', 'resolucion', 'categoria', 'marca', 'modelo', 'anioFabricacion', 'estado', 'acciones'];
  displayedColumns = ['placa', 'empresa', 'resolucion', 'categoria', 'marca', 'estado', 'acciones'];

  // Getters para los controles del formulario
  get placaControl(): FormControl {
    return this.filtrosForm.get('placa') as FormControl;
  }

  get empresaControl(): FormControl {
    return this.filtrosForm.get('empresa') as FormControl;
  }

  get resolucionControl(): FormControl {
    return this.filtrosForm.get('resolucion') as FormControl;
  }

  get estadoControl(): FormControl {
    return this.filtrosForm.get('estado') as FormControl;
  }

  ngOnInit() {
    this.inicializarFormulario();
    this.cargarDatos();
    this.configurarAutocompletado();
    this.configurarBusquedaRapida();
  }

  private inicializarFormulario() {
    this.filtrosForm = this.fb.group({
      placa: [''],
      empresa: [''],
      resolucion: [{ value: '', disabled: true }],
      estado: ['']
    });
  }

  private configurarBusquedaRapida() {
    this.busquedaRapidaControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.firstPage();
      }
    });
  }

  private configurarAutocompletado() {
    // Autocompletado para empresas
    this.empresasFiltradas = this.empresaControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filtrarEmpresas(value))
    );

    // Autocompletado para resoluciones
    this.resolucionesFiltradas = this.resolucionControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filtrarResoluciones(value))
    );

    // Escuchar cambios en el control de empresa para habilitar/deshabilitar resolución
    this.empresaControl.valueChanges.subscribe(value => {
      if (!value || value === '') {
        this.resolucionControl.disable();
        this.resolucionSeleccionada.set(null);
      } else {
        this.resolucionControl.enable();
      }
    });
  }

  // Métodos de paginación
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getPaginatedVehiculos(): Vehiculo[] {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.vehiculosFiltrados().slice(startIndex, endIndex);
  }

  // Métodos de filtrado mejorados
  vehiculosFiltrados(): Vehiculo[] {
    let vehiculos = this.vehiculos();

    // Búsqueda rápida
    if (this.busquedaRapidaControl.value) {
      const busqueda = this.busquedaRapidaControl.value.toLowerCase();
      vehiculos = vehiculos.filter(v => 
        v.placa.toLowerCase().includes(busqueda) ||
        v.marca.toLowerCase().includes(busqueda) ||
        v.categoria.toLowerCase().includes(busqueda) ||
        this.getEmpresaNombre(v.empresaActualId).toLowerCase().includes(busqueda) ||
        this.getResolucionNumero(v.resolucionId).toLowerCase().includes(busqueda)
      );
    }

    // Filtros específicos
    if (this.placaControl.value) {
      vehiculos = vehiculos.filter(v => 
        v.placa.toLowerCase().includes(this.placaControl.value.toLowerCase())
      );
    }

    if (this.empresaSeleccionada()) {
      vehiculos = vehiculos.filter(v => 
        v.empresaActualId === this.empresaSeleccionada()?.id
      );
    }

    if (this.resolucionSeleccionada()) {
      vehiculos = vehiculos.filter(v => 
        v.resolucionId === this.resolucionSeleccionada()?.id
      );
    }

    if (this.estadoControl.value) {
      vehiculos = vehiculos.filter(v => 
        v.estado === this.estadoControl.value
      );
    }

    // Aplicar ordenamiento
    if (this.sort && this.sort.active) {
      vehiculos = this.ordenarVehiculos(vehiculos, this.sort.active, this.sort.direction);
    }

    return vehiculos;
  }

  private ordenarVehiculos(vehiculos: Vehiculo[], active: string, direction: string): Vehiculo[] {
    return vehiculos.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (active) {
        case 'placa':
          aValue = a.placa;
          bValue = b.placa;
          break;
        case 'empresa':
          aValue = this.getEmpresaNombre(a.empresaActualId);
          bValue = this.getEmpresaNombre(b.empresaActualId);
          break;
        case 'resolucion':
          aValue = this.getResolucionNumero(a.resolucionId);
          bValue = this.getResolucionNumero(b.resolucionId);
          break;
        case 'categoria':
          aValue = a.categoria;
          bValue = b.categoria;
          break;
        case 'marca':
          aValue = a.marca;
          bValue = b.marca;
          break;
        case 'modelo':
          aValue = a.modelo || '';
          bValue = b.modelo || '';
          break;
        case 'anioFabricacion':
          aValue = a.anioFabricacion || 0;
          bValue = b.anioFabricacion || 0;
          break;
        case 'estado':
          aValue = a.estado;
          bValue = b.estado;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Métodos de utilidad
  tieneFiltrosActivos(): boolean {
    return !!(this.busquedaRapidaControl.value || 
              this.placaControl.value || 
              this.empresaSeleccionada() || 
              this.resolucionSeleccionada() || 
              this.estadoControl.value);
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'ACTIVO': return 'estado-activo';
      case 'INACTIVO': return 'estado-inactivo';
      case 'SUSPENDIDO': return 'estado-suspendido';
      case 'EN_REVISION': return 'estado-revision';
      default: return 'estado-default';
    }
  }

  getVehiculosActivos(): number {
    return this.vehiculos().filter(v => v.estado === 'ACTIVO').length;
  }

     getVehiculosPorEstado(estado: string): number {
     return this.vehiculos().filter(v => v.estado === estado).length;
   }

   getLastUpdateTime(): string {
     return new Date().toLocaleTimeString('es-ES');
   }

  // Métodos de columnas
  toggleColumn(col: string): void {
    const index = this.displayedColumns.indexOf(col);
    if (index > -1) {
      this.displayedColumns.splice(index, 1);
    } else {
      this.displayedColumns.push(col);
    }
  }

  isColumnVisible(col: string): boolean {
    return this.displayedColumns.includes(col);
  }

  getColumnDisplayName(col: string): string {
    const nombres: { [key: string]: string } = {
      'placa': 'Placa',
      'empresa': 'Empresa',
      'resolucion': 'Resolución',
      'categoria': 'Categoría',
      'marca': 'Marca',
      'modelo': 'Modelo',
      'anioFabricacion': 'Año',
      'estado': 'Estado',
      'acciones': 'Acciones'
    };
    return nombres[col] || col;
  }

  // Métodos de exportación
  exportarVehiculos(): void {
    const vehiculos = this.vehiculosFiltrados();
    const csvContent = this.convertirACSV(vehiculos);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vehiculos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.snackBar.open(`Se exportaron ${vehiculos.length} vehículos`, 'Cerrar', { duration: 3000 });
  }

  private convertirACSV(vehiculos: Vehiculo[]): string {
    const headers = ['Placa', 'Empresa', 'Resolución', 'Categoría', 'Marca', 'Modelo', 'Año', 'Estado'];
    const rows = vehiculos.map(v => [
      v.placa,
      this.getEmpresaNombre(v.empresaActualId),
      this.getResolucionNumero(v.resolucionId),
      v.categoria,
      v.marca,
      v.modelo || '',
      v.anioFabricacion || '',
      v.estado
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  // Métodos de limpieza mejorados
  limpiarBusquedaRapida(): void {
    this.busquedaRapidaControl.setValue('');
    this.currentPage = 0;
  }

  limpiarPlaca(): void {
    this.placaControl.setValue('');
  }

  limpiarEstado(): void {
    this.estadoControl.setValue('');
  }

  // Métodos de acciones
  duplicarVehiculo(vehiculo: Vehiculo): void {
    // Por ahora, solo mostrar un mensaje de funcionalidad en desarrollo
    this.snackBar.open('Funcionalidad de duplicación en desarrollo', 'Cerrar', { duration: 3000 });
    
    // TODO: Implementar duplicación cuando se actualice el servicio de modal
    // para que acepte datos de vehículo pre-llenados
  }

  // Métodos existentes (mantenidos del código original)
  private cargarDatos() {
    this.cargando.set(true);
    
    // Cargar empresas
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);
        console.log('✅ Empresas cargadas:', empresas.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar empresas:', error);
        this.snackBar.open('Error al cargar empresas', 'Cerrar', { duration: 3000 });
      }
    });

    // Cargar resoluciones
    this.resolucionService.getResoluciones().subscribe({
      next: (resoluciones) => {
        this.resoluciones.set(resoluciones);
        console.log('✅ Resoluciones cargadas:', resoluciones.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar resoluciones:', error);
        this.snackBar.open('Error al cargar resoluciones', 'Cerrar', { duration: 3000 });
      }
    });

    // Cargar vehículos
    this.vehiculoService.getVehiculos().subscribe({
      next: (vehiculos) => {
        this.vehiculos.set(vehiculos);
        console.log('✅ Vehículos cargados:', vehiculos.length);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('❌ Error al cargar vehículos:', error);
        this.snackBar.open('Error al cargar vehículos', 'Cerrar', { duration: 3000 });
        this.cargando.set(false);
      }
    });
  }

  // Métodos de filtrado
  private filtrarEmpresas(value: any): Empresa[] {
    if (!value) return this.empresas();
    
    const filterValue = typeof value === 'string' ? value.toLowerCase() : value.razonSocial?.principal?.toLowerCase() || '';
    return this.empresas().filter(empresa => 
      empresa.ruc.toLowerCase().includes(filterValue) ||
      empresa.razonSocial.principal.toLowerCase().includes(filterValue)
    );
  }

  private filtrarResoluciones(value: any): Resolucion[] {
    if (!value) return this.resoluciones();
    
    const filterValue = typeof value === 'string' ? value.toLowerCase() : value.nroResolucion?.toLowerCase() || '';
    return this.resoluciones().filter(resolucion => 
      resolucion.nroResolucion.toLowerCase().includes(filterValue)
    );
  }

  // Eventos de selección
  onEmpresaSelected(event: any) {
    const empresa = event.option.value;
    this.empresaSeleccionada.set(empresa);
    this.resolucionControl.setValue('');
    this.resolucionSeleccionada.set(null);
    this.resolucionControl.enable();
    this.cargarResolucionesPorEmpresa(empresa.id);
  }

  onResolucionSelected(event: any) {
    const resolucion = event.option.value;
    this.resolucionSeleccionada.set(resolucion);
  }

  // Cargar resoluciones por empresa
  private cargarResolucionesPorEmpresa(empresaId: string) {
    const resolucionesEmpresa = this.resoluciones().filter(r => r.empresaId === empresaId);
    this.resolucionesFiltradas = of(resolucionesEmpresa);
  }

  // Aplicar filtros
  aplicarFiltros() {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    
    const vehiculosFiltrados = this.vehiculosFiltrados();
    this.snackBar.open(`Se encontraron ${vehiculosFiltrados.length} vehículo(s)`, 'Cerrar', { duration: 2000 });
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.filtrosForm.reset();
    this.busquedaRapidaControl.setValue('');
    this.empresaSeleccionada.set(null);
    this.resolucionSeleccionada.set(null);
    this.resolucionControl.disable();
    this.currentPage = 0;
    this.cargarDatos();
  }

  // Método para limpiar solo la empresa
  limpiarEmpresa(): void {
    this.empresaControl.setValue('');
    this.empresaSeleccionada.set(null);
    this.resolucionControl.disable();
    this.resolucionSeleccionada.set(null);
  }

  // Método para limpiar solo la resolución
  limpiarResolucion(): void {
    this.resolucionControl.setValue('');
    this.resolucionSeleccionada.set(null);
  }

  // Búsqueda rápida
  onBusquedaRapida(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  // Métodos de utilidad
  displayEmpresa(empresa: Empresa): string {
    return empresa ? `${empresa.ruc} - ${empresa.razonSocial.principal}` : '';
  }

  displayResolucion(resolucion: Resolucion): string {
    return resolucion ? `${resolucion.nroResolucion} - ${resolucion.tipoTramite}` : '';
  }

  getEmpresaNombre(empresaId: string): string {
    const empresa = this.empresas().find(e => e.id === empresaId);
    return empresa ? empresa.razonSocial.principal : 'Desconocida';
  }

  getResolucionNumero(resolucionId: string): string {
    const resolucion = this.resoluciones().find(r => r.id === resolucionId);
    return resolucion ? resolucion.nroResolucion : 'Desconocida';
  }

  // Acciones
  nuevoVehiculo() {
    this.vehiculoModalService.openCreateModal().subscribe({
      next: (vehiculo: any) => {
        console.log('✅ Vehículo creado:', vehiculo);
        this.snackBar.open('Vehículo creado correctamente', 'Cerrar', { duration: 3000 });
        this.cargarDatos();
      },
      error: (error: any) => {
        console.error('❌ Error al crear vehículo:', error);
        this.snackBar.open('Error al crear vehículo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  verDetalle(vehiculo: Vehiculo) {
    this.router.navigate(['/vehiculos', vehiculo.id]);
  }

  verHistorial(vehiculo: Vehiculo) {
    this.router.navigate(['/vehiculos', vehiculo.id, 'historial']);
  }

  transferirVehiculo(vehiculo: Vehiculo) {
    const dialogRef = this.vehiculoModalService.openTransferirModal(vehiculo);

    dialogRef.subscribe((result: any) => {
      if (result?.success) {
        console.log('✅ Vehículo transferido:', result.vehiculo);
        this.snackBar.open('Vehículo transferido exitosamente', 'Cerrar', { duration: 3000 });
        this.cargarDatos(); // Recargar datos para mostrar cambios
      }
    });
  }

  solicitarBajaVehiculo(vehiculo: Vehiculo) {
    const dialogRef = this.vehiculoModalService.openSolicitarBajaModal(vehiculo);

    dialogRef.subscribe((result: any) => {
      if (result?.success) {
        console.log('✅ Solicitud de baja creada:', result.baja);
        this.snackBar.open('Solicitud de baja enviada exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  editarVehiculo(vehiculo: Vehiculo) {
    this.vehiculoModalService.openEditModal(vehiculo).subscribe({
      next: (vehiculoActualizado: any) => {
        console.log('✅ Vehículo actualizado:', vehiculoActualizado);
        this.snackBar.open('Vehículo actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.cargarDatos();
      },
      error: (error: any) => {
        console.error('❌ Error al actualizar vehículo:', error);
        this.snackBar.open('Error al actualizar vehículo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  eliminarVehiculo(vehiculo: Vehiculo) {
    if (confirm(`¿Estás seguro de que quieres eliminar el vehículo ${vehiculo.placa}?`)) {
      this.vehiculoService.deleteVehiculo(vehiculo.id).subscribe({
        next: () => {
          this.snackBar.open('Vehículo eliminado correctamente', 'Cerrar', { duration: 3000 });
          this.cargarDatos();
        },
        error: (error) => {
          console.error('Error al eliminar vehículo:', error);
          this.snackBar.open('Error al eliminar vehículo', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
} 