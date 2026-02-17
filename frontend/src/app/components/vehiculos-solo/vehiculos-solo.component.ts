import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { SelectionModel } from '@angular/cdk/collections';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { VehiculoSoloService } from '../../services/vehiculo-solo.service';

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
}

@Component({
  selector: 'app-vehiculos-solo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>directions_car</mat-icon>
            Vehículos - Datos Técnicos
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="actions-bar">
            <div class="search-box">
              <mat-form-field appearance="outline">
                <mat-label>Buscar por placa</mat-label>
                <input matInput 
                       [(ngModel)]="filtroPlaca" 
                       (input)="onPlacaInput($event)"
                       (keyup.enter)="buscar()"
                       [matAutocomplete]="auto"
                       placeholder="Ej: A2B-123">
                <mat-icon matPrefix>search</mat-icon>
                @if (filtroPlaca) {
                  <button matSuffix mat-icon-button (click)="limpiarBusqueda()">
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </mat-form-field>
              <mat-autocomplete #auto="matAutocomplete" (optionSelected)="seleccionarPlaca($event)">
                @for (sugerencia of sugerenciasPlacas(); track sugerencia.placa) {
                  <mat-option [value]="sugerencia.placa">
                    <span class="placa-sugerencia">{{ sugerencia.placa }}</span>
                    <span class="descripcion-sugerencia">{{ sugerencia.descripcion }}</span>
                  </mat-option>
                }
              </mat-autocomplete>
              <button mat-raised-button (click)="buscar()">
                <mat-icon>search</mat-icon>
                Buscar
              </button>
            </div>
            <div class="action-buttons">
              <button mat-icon-button [matMenuTriggerFor]="columnasMenu" matTooltip="Configurar columnas">
                <mat-icon>view_column</mat-icon>
              </button>
              <button mat-raised-button color="primary" (click)="nuevo()">
                <mat-icon>add</mat-icon>
                Nuevo Vehículo
              </button>
              <button mat-raised-button color="accent" (click)="cargaMasiva()">
                <mat-icon>upload_file</mat-icon>
                Carga Masiva
              </button>
            </div>
          </div>

          <!-- Selección masiva -->
          @if (selection.hasValue()) {
            <div class="selection-bar">
              <mat-chip-set>
                <mat-chip>
                  {{ selection.selected.length }} seleccionado(s)
                  <button matChipRemove (click)="selection.clear()">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
              </mat-chip-set>
              <div class="selection-actions">
                <button mat-button color="warn" (click)="eliminarSeleccionados()">
                  <mat-icon>delete</mat-icon>
                  Eliminar seleccionados
                </button>
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          @if (loading()) {
            <div class="loading">
              <mat-spinner></mat-spinner>
              <p>Cargando vehículos...</p>
            </div>
          } @else if (vehiculos().length === 0) {
            <div class="empty-state">
              <mat-icon>directions_car</mat-icon>
              <p>No hay vehículos registrados</p>
              <button mat-raised-button color="primary" (click)="nuevo()">
                <mat-icon>add</mat-icon>
                Agregar Primer Vehículo
              </button>
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="vehiculos()" matSort (matSortChange)="sortData($event)" class="vehiculos-table">
                <!-- Columna de selección -->
                <ng-container matColumnDef="select">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-checkbox (change)="$event ? toggleAllRows() : null"
                                  [checked]="selection.hasValue() && isAllSelected()"
                                  [indeterminate]="selection.hasValue() && !isAllSelected()">
                    </mat-checkbox>
                  </th>
                  <td mat-cell *matCellDef="let row">
                    <mat-checkbox (click)="$event.stopPropagation()"
                                  (change)="$event ? selection.toggle(row) : null"
                                  [checked]="selection.isSelected(row)">
                    </mat-checkbox>
                  </td>
                </ng-container>

                <ng-container matColumnDef="placa">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Placa</th>
                  <td mat-cell *matCellDef="let v">
                    <strong>{{ v.placa_actual }}</strong>
                  </td>
                </ng-container>

                <ng-container matColumnDef="marca">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Marca</th>
                  <td mat-cell *matCellDef="let v">{{ v.marca || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="modelo">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Modelo</th>
                  <td mat-cell *matCellDef="let v">{{ v.modelo || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="anio">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Año</th>
                  <td mat-cell *matCellDef="let v">{{ v.anio_fabricacion || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="categoria">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Categoría</th>
                  <td mat-cell *matCellDef="let v">
                    <span class="badge">{{ v.categoria || '-' }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="pasajeros">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Pasajeros</th>
                  <td mat-cell *matCellDef="let v">{{ v.numero_pasajeros || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="completitud">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Completitud</th>
                  <td mat-cell *matCellDef="let v">
                    <div class="completitud-container">
                      <div class="progress-bar" [style.width.%]="v.porcentaje_completitud || 0"
                           [class.low]="(v.porcentaje_completitud || 0) < 50"
                           [class.medium]="(v.porcentaje_completitud || 0) >= 50 && (v.porcentaje_completitud || 0) < 80"
                           [class.high]="(v.porcentaje_completitud || 0) >= 80">
                      </div>
                      <span class="percentage">{{ v.porcentaje_completitud || 0 }}%</span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let v">
                    <button mat-icon-button [matMenuTriggerFor]="accionesMenu" [matMenuTriggerData]="{vehiculo: v}">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #accionesMenu="matMenu">
                      <ng-template matMenuContent let-vehiculo="vehiculo">
                        <button mat-menu-item (click)="ver(vehiculo.id)">
                          <mat-icon>visibility</mat-icon>
                          <span>Ver detalle</span>
                        </button>
                        <button mat-menu-item (click)="editar(vehiculo.id)">
                          <mat-icon>edit</mat-icon>
                          <span>Editar</span>
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item (click)="eliminar(vehiculo.id)" class="menu-item-danger">
                          <mat-icon color="warn">delete</mat-icon>
                          <span>Eliminar</span>
                        </button>
                      </ng-template>
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="getDisplayedColumns()"></tr>
                <tr mat-row *matRowDef="let row; columns: getDisplayedColumns();"></tr>
              </table>
            </div>

            <!-- Paginación -->
            <mat-paginator 
              [length]="total()"
              [pageSize]="pageSize"
              [pageSizeOptions]="[5, 10, 25, 50, 100]"
              [pageIndex]="pageIndex"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Menú de configuración de columnas -->
    <mat-menu #columnasMenu="matMenu">
      <div class="columnas-menu" (click)="$event.stopPropagation()">
        <h3>Mostrar columnas</h3>
        @for (col of availableColumns; track col.key) {
          <div class="columna-item">
            <mat-checkbox 
              [(ngModel)]="col.visible"
              [disabled]="col.key === 'placa' || col.key === 'acciones'"
              (change)="updateDisplayedColumns()">
              {{ col.label }}
            </mat-checkbox>
          </div>
        }
      </div>
    </mat-menu>
  `,
  styles: [`
    .container {
      padding: 20px;
    }

    .header-card {
      margin-bottom: 20px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      gap: 10px;
      align-items: center;
      flex: 1;
      max-width: 600px;
    }

    .search-box mat-form-field {
      flex: 1;
    }

    .placa-sugerencia {
      font-weight: 600;
      color: #1976d2;
      margin-right: 10px;
    }

    .descripcion-sugerencia {
      font-size: 0.85em;
      color: #666;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .selection-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 4px;
    }

    .selection-actions {
      display: flex;
      gap: 8px;
    }

    .loading, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 20px;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #999;
    }

    .table-container {
      overflow-x: auto;
    }

    .vehiculos-table {
      width: 100%;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      background-color: #1976d2;
      color: white;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 500;
    }

    .completitud-container {
      position: relative;
      width: 100%;
      min-width: 100px;
      height: 24px;
      background-color: #e0e0e0;
      border-radius: 12px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 12px;
    }

    .progress-bar.low {
      background-color: #f44336;
    }

    .progress-bar.medium {
      background-color: #ff9800;
    }

    .progress-bar.high {
      background-color: #4caf50;
    }

    .percentage {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.75em;
      font-weight: 600;
      color: #333;
      text-shadow: 0 0 2px white;
    }

    .menu-item-danger {
      color: #f44336;
    }

    .columnas-menu {
      padding: 16px;
      max-width: 300px;
    }

    .columnas-menu h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #666;
    }

    .columna-item {
      padding: 8px 0;
    }

    mat-paginator {
      border-top: 1px solid #e0e0e0;
    }
  `]
})
export class VehiculosSoloComponent implements OnInit {
  private router = inject(Router);
  private vehiculoService = inject(VehiculoSoloService);
  private snackBar = inject(MatSnackBar);

  loading = signal<boolean>(false);
  vehiculos = signal<any[]>([]);
  total = signal<number>(0);
  sugerenciasPlacas = signal<any[]>([]);
  filtroPlaca = '';

  // Paginación
  pageSize = 10;
  pageIndex = 0;

  // Ordenamiento
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Selección
  selection = new SelectionModel<any>(true, []);

  private placaInput$ = new Subject<string>();

  // Configuración de columnas
  availableColumns: ColumnConfig[] = [
    { key: 'select', label: 'Selección', visible: true, sortable: false },
    { key: 'placa', label: 'Placa', visible: true, sortable: true },
    { key: 'marca', label: 'Marca', visible: true, sortable: true },
    { key: 'modelo', label: 'Modelo', visible: true, sortable: true },
    { key: 'anio', label: 'Año', visible: true, sortable: true },
    { key: 'categoria', label: 'Categoría', visible: true, sortable: true },
    { key: 'pasajeros', label: 'Pasajeros', visible: true, sortable: true },
    { key: 'completitud', label: 'Completitud', visible: true, sortable: true },
    { key: 'acciones', label: 'Acciones', visible: true, sortable: false }
  ];

  ngOnInit(): void {
    this.cargarVehiculos();
    this.configurarAutocompletado();
  }

  getDisplayedColumns(): string[] {
    return this.availableColumns
      .filter(col => col.visible)
      .map(col => col.key);
  }

  updateDisplayedColumns(): void {
    // Forzar actualización de la vista
    this.vehiculos.set([...this.vehiculos()]);
  }

  configurarAutocompletado(): void {
    this.placaInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query && query.length >= 1) {
          return this.vehiculoService.autocompletarPlacas(query);
        }
        return [];
      })
    ).subscribe({
      next: (response: any) => {
        this.sugerenciasPlacas.set(response.sugerencias || []);
      },
      error: (error) => {
        console.error('Error en autocompletado:', error);
        this.sugerenciasPlacas.set([]);
      }
    });
  }

  onPlacaInput(event: any): void {
    const value = event.target.value;
    this.placaInput$.next(value);
  }

  seleccionarPlaca(event: any): void {
    this.filtroPlaca = event.option.value;
    this.buscar();
  }

  limpiarBusqueda(): void {
    this.filtroPlaca = '';
    this.sugerenciasPlacas.set([]);
    this.pageIndex = 0;
    this.cargarVehiculos();
  }

  cargarVehiculos(): void {
    this.loading.set(true);
    const filtros: any = {
      page: this.pageIndex + 1,
      limit: this.pageSize
    };

    if (this.filtroPlaca) {
      filtros.placa = this.filtroPlaca;
    }

    if (this.sortColumn) {
      filtros.sort = this.sortColumn;
      filtros.order = this.sortDirection;
    }
    
    this.vehiculoService.obtenerVehiculos(filtros).subscribe({
      next: (response) => {
        console.log('📦 Respuesta recibida del backend:', response);
        if (response.vehiculos && response.vehiculos.length > 0) {
          console.log('🔍 Primer vehículo:', response.vehiculos[0]);
          console.log('🔑 ID del primer vehículo:', response.vehiculos[0].id);
        }
        this.vehiculos.set(response.vehiculos);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando vehículos:', error);
        this.snackBar.open('Error al cargar vehículos', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  buscar(): void {
    this.pageIndex = 0;
    this.cargarVehiculos();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.cargarVehiculos();
  }

  sortData(sort: Sort): void {
    this.sortColumn = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc';
    this.cargarVehiculos();
  }

  // Selección masiva
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.vehiculos().length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.vehiculos().forEach(row => this.selection.select(row));
    }
  }

  eliminarSeleccionados(): void {
    const seleccionados = this.selection.selected;
    if (seleccionados.length === 0) return;

    const confirmacion = confirm(`¿Está seguro de eliminar ${seleccionados.length} vehículo(s)?`);
    if (!confirmacion) return;

    this.loading.set(true);
    let eliminados = 0;
    let errores = 0;

    seleccionados.forEach((vehiculo, index) => {
      this.vehiculoService.eliminarVehiculo(vehiculo.id).subscribe({
        next: () => {
          eliminados++;
          if (index === seleccionados.length - 1) {
            this.finalizarEliminacionMasiva(eliminados, errores);
          }
        },
        error: () => {
          errores++;
          if (index === seleccionados.length - 1) {
            this.finalizarEliminacionMasiva(eliminados, errores);
          }
        }
      });
    });
  }

  private finalizarEliminacionMasiva(eliminados: number, errores: number): void {
    this.selection.clear();
    this.cargarVehiculos();
    
    if (errores === 0) {
      this.snackBar.open(`${eliminados} vehículo(s) eliminado(s)`, 'Cerrar', { duration: 3000 });
    } else {
      this.snackBar.open(`${eliminados} eliminado(s), ${errores} error(es)`, 'Cerrar', { duration: 5000 });
    }
  }

  nuevo(): void {
    this.router.navigate(['/vehiculos-solo/nuevo']);
  }

  ver(id: string): void {
    console.log('👁️ Ver vehículo - ID recibido:', id, 'Tipo:', typeof id, 'Es undefined?:', id === undefined);
    if (!id) {
      console.error('❌ ID no válido para ver vehículo');
      this.snackBar.open('Error: ID de vehículo no válido', 'Cerrar', { duration: 3000 });
      return;
    }
    console.log('✅ Navegando a:', ['/vehiculos-solo', id]);
    this.router.navigate(['/vehiculos-solo', id]);
  }

  editar(id: string): void {
    console.log('✏️ Editar vehículo - ID recibido:', id, 'Tipo:', typeof id, 'Es undefined?:', id === undefined);
    if (!id) {
      console.error('❌ ID no válido para editar vehículo');
      this.snackBar.open('Error: ID de vehículo no válido', 'Cerrar', { duration: 3000 });
      return;
    }
    console.log('✅ Navegando a:', ['/vehiculos-solo/editar', id]);
    this.router.navigate(['/vehiculos-solo/editar', id]);
  }

  eliminar(id: string): void {
    if (confirm('¿Está seguro de eliminar este vehículo?')) {
      this.vehiculoService.eliminarVehiculo(id).subscribe({
        next: () => {
          this.snackBar.open('Vehículo eliminado', 'Cerrar', { duration: 3000 });
          this.cargarVehiculos();
        },
        error: (error) => {
          console.error('Error eliminando vehículo:', error);
          this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  cargaMasiva(): void {
    this.router.navigate(['/vehiculos-solo/carga-masiva']);
  }
}
