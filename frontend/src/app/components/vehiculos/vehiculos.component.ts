import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { VehiculoModalService } from '../../services/vehiculo-modal.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTooltipModule,
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

      <!-- Filtros principales -->
      <mat-card class="filters-card">
        <mat-card-header>
          <mat-card-title>Filtros</mat-card-title>
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
                     placeholder="Buscar resolución"
                     [formControl]="resolucionControl">
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

            <!-- Botones de acción -->
            <div class="filter-actions">
              <button mat-stroked-button 
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
      @if (empresaSeleccionada() || resolucionSeleccionada()) {
        <mat-card class="info-card">
          <mat-card-content>
            <div class="filter-info">
              @if (empresaSeleccionada()) {
                <div class="info-item">
                  <strong>Empresa:</strong> {{ empresaSeleccionada()?.ruc }} - {{ empresaSeleccionada()?.razonSocial?.principal }}
                </div>
              }
              @if (resolucionSeleccionada()) {
                <div class="info-item">
                  <strong>Resolución:</strong> {{ resolucionSeleccionada()?.nroResolucion }} - {{ resolucionSeleccionada()?.tipoTramite }}
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Tabla de vehículos -->
      <mat-card class="table-card">
        <mat-card-content>
          @if (cargando()) {
            <div class="loading-container">
              <mat-spinner></mat-spinner>
              <p>Cargando vehículos...</p>
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="vehiculos()" class="vehiculos-table">
                <!-- Columna Placa -->
                <ng-container matColumnDef="placa">
                  <th mat-header-cell *matHeaderCellDef>PLACA</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ vehiculo.placa }}</td>
                </ng-container>

                <!-- Columna Empresa -->
                <ng-container matColumnDef="empresa">
                  <th mat-header-cell *matHeaderCellDef>EMPRESA</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ getEmpresaNombre(vehiculo.empresaActualId) }}</td>
                </ng-container>

                <!-- Columna Resolución -->
                <ng-container matColumnDef="resolucion">
                  <th mat-header-cell *matHeaderCellDef>RESOLUCIÓN</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ getResolucionNumero(vehiculo.resolucionId) }}</td>
                </ng-container>

                <!-- Columna Categoría -->
                <ng-container matColumnDef="categoria">
                  <th mat-header-cell *matHeaderCellDef>CATEGORÍA</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ vehiculo.categoria }}</td>
                </ng-container>

                <!-- Columna Marca -->
                <ng-container matColumnDef="marca">
                  <th mat-header-cell *matHeaderCellDef>MARCA</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ vehiculo.marca }}</td>
                </ng-container>

                <!-- Columna Estado -->
                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef>ESTADO</th>
                  <td mat-cell *matCellDef="let vehiculo">{{ vehiculo.estado }}</td>
                </ng-container>

                <!-- Columna Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>ACCIONES</th>
                  <td mat-cell *matCellDef="let vehiculo">
                    <button mat-icon-button 
                            color="primary" 
                            (click)="verDetalle(vehiculo)"
                            matTooltip="Ver detalle">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    <button mat-icon-button 
                            color="accent" 
                            (click)="editarVehiculo(vehiculo)"
                            matTooltip="Editar">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button 
                            color="warn" 
                            (click)="eliminarVehiculo(vehiculo)"
                            matTooltip="Eliminar">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>

              @if (vehiculos().length === 0) {
                <div class="no-data">
                  <mat-icon>directions_car</mat-icon>
                  <p>No se encontraron vehículos</p>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Estadísticas -->
      <mat-card class="stats-card">
        <mat-card-header>
          <mat-card-title>Estadísticas</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">{{ vehiculos().length }}</div>
              <div class="stat-label">Total Vehículos</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ empresas().length }}</div>
              <div class="stat-label">Empresas</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ resoluciones().length }}</div>
              <div class="stat-label">Resoluciones</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class VehiculosComponent implements OnInit {
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

  // Columnas de la tabla
  displayedColumns = ['placa', 'empresa', 'resolucion', 'categoria', 'marca', 'estado', 'acciones'];

  ngOnInit() {
    this.inicializarFormulario();
    this.cargarDatos();
    this.configurarAutocompletado();
  }

  private inicializarFormulario() {
    this.filtrosForm = this.fb.group({
      placa: [''],
      empresa: [''],
      resolucion: [{ value: '', disabled: true }]
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
        // Si no hay empresa seleccionada, deshabilitar resolución
        this.resolucionControl.disable();
        this.resolucionSeleccionada.set(null);
      } else {
        // Si hay empresa seleccionada, habilitar resolución
        this.resolucionControl.enable();
      }
    });
  }

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
    
    // Habilitar el control de resolución
    this.resolucionControl.enable();
    
    // Filtrar resoluciones por empresa
    this.cargarResolucionesPorEmpresa(empresa.id);
  }

  onResolucionSelected(event: any) {
    const resolucion = event.option.value;
    this.resolucionSeleccionada.set(resolucion);
    
    // Opcional: Deshabilitar el control de resolución después de la selección
    // this.resolucionControl.disable();
  }

  // Cargar resoluciones por empresa
  private cargarResolucionesPorEmpresa(empresaId: string) {
    const resolucionesEmpresa = this.resoluciones().filter(r => r.empresaId === empresaId);
    this.resolucionesFiltradas = of(resolucionesEmpresa);
  }

  // Aplicar filtros
  aplicarFiltros() {
    const filtros = this.filtrosForm.value;
    let vehiculosFiltrados = this.vehiculos();

    // Filtrar por placa
    if (filtros.placa) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => 
        v.placa.toLowerCase().includes(filtros.placa.toLowerCase())
      );
    }

    // Filtrar por empresa
    if (this.empresaSeleccionada()) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => 
        v.empresaActualId === this.empresaSeleccionada()?.id
      );
    }

    // Filtrar por resolución
    if (this.resolucionSeleccionada()) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => 
        v.resolucionId === this.resolucionSeleccionada()?.id
      );
    }

    this.vehiculos.set(vehiculosFiltrados);
    this.snackBar.open(`Se encontraron ${vehiculosFiltrados.length} vehículo(s)`, 'Cerrar', { duration: 2000 });
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.filtrosForm.reset();
    this.empresaSeleccionada.set(null);
    this.resolucionSeleccionada.set(null);
    
    // Deshabilitar el control de resolución
    this.resolucionControl.disable();
    
    this.cargarDatos();
  }

  // Método para limpiar solo la empresa
  limpiarEmpresa(): void {
    this.empresaControl.setValue('');
    this.empresaSeleccionada.set(null);
    
    // Deshabilitar el control de resolución
    this.resolucionControl.disable();
    this.resolucionSeleccionada.set(null);
  }

  // Método para limpiar solo la resolución
  limpiarResolucion(): void {
    this.resolucionControl.setValue('');
    this.resolucionSeleccionada.set(null);
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
        this.cargarDatos(); // Recargar la lista
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

  editarVehiculo(vehiculo: Vehiculo) {
    this.vehiculoModalService.openEditModal(vehiculo).subscribe({
      next: (vehiculoActualizado: any) => {
        console.log('✅ Vehículo actualizado:', vehiculoActualizado);
        this.snackBar.open('Vehículo actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.cargarDatos(); // Recargar la lista
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