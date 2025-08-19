import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { 
  BajaVehiculo, 
  TipoBajaVehiculo, 
  EstadoBajaVehiculo,
  FiltroBajaVehiculo,
  ResumenBajasVehiculo
} from '../../models/baja-vehiculo.model';
import { BajaVehiculoService } from '../../services/baja-vehiculo.service';
import { SolicitarBajaVehiculoModalComponent } from '../vehiculos/solicitar-baja-vehiculo-modal.component';

@Component({
  selector: 'app-bajas-vehiculos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="bajas-vehiculos-container">
      <!-- Header -->
      <div class="header-section">
        <div class="header-content">
          <div class="header-title">
            <mat-icon>remove_circle</mat-icon>
            <h1>GESTIÓN DE BAJAS VEHICULARES</h1>
          </div>
          <div class="header-actions">
            <button mat-raised-button 
                    color="warn" 
                    (click)="nuevaSolicitudBaja()"
                    [disabled]="!empresaId()">
              <mat-icon>add</mat-icon>
              NUEVA SOLICITUD
            </button>
          </div>
        </div>
        <p class="header-subtitle">
          Administra las solicitudes de baja de vehículos de la empresa
        </p>
      </div>

      <!-- Filtros -->
      <mat-card class="filtros-card">
        <mat-card-header>
          <mat-card-title>FILTROS DE BÚSQUEDA</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="filtrosForm" class="filtros-form">
            <div class="filtros-row">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>PLACA</mat-label>
                <input matInput 
                       formControlName="placa"
                       placeholder="Buscar por placa...">
                <mat-icon matSuffix>directions_car</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>TIPO DE BAJA</mat-label>
                <mat-select formControlName="tipoBaja">
                  <mat-option value="">Todos los tipos</mat-option>
                  @for (tipo of tiposBaja; track tipo) {
                    <mat-option [value]="tipo">
                      {{ obtenerNombreTipoBaja(tipo) }}
                    </mat-option>
                  }
                </mat-select>
                <mat-icon matSuffix>category</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>ESTADO</mat-label>
                <mat-select formControlName="estadoBaja">
                  <mat-option value="">Todos los estados</mat-option>
                  @for (estado of estadosBaja; track estado) {
                    <mat-option [value]="estado">
                      {{ obtenerNombreEstadoBaja(estado) }}
                    </mat-option>
                  }
                </mat-select>
                <mat-icon matSuffix>info</mat-icon>
              </mat-form-field>
            </div>

            <div class="filtros-row">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>FECHA DESDE</mat-label>
                <input matInput 
                       [matDatepicker]="pickerDesde" 
                       formControlName="fechaDesde">
                <mat-datepicker-toggle matSuffix [for]="pickerDesde"></mat-datepicker-toggle>
                <mat-datepicker #pickerDesde></mat-datepicker>
                <mat-icon matSuffix>event</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>FECHA HASTA</mat-label>
                <input matInput 
                       [matDatepicker]="pickerHasta" 
                       formControlName="fechaHasta">
                <mat-datepicker-toggle matSuffix [for]="pickerHasta"></mat-datepicker-toggle>
                <mat-datepicker #pickerHasta></mat-datepicker>
                <mat-icon matSuffix>event</mat-icon>
              </mat-form-field>

              <div class="filtro-actions">
                <button mat-button 
                        (click)="aplicarFiltros()"
                        [disabled]="loading()">
                  <mat-icon>search</mat-icon>
                  BUSCAR
                </button>
                <button mat-button 
                        (click)="limpiarFiltros()"
                        [disabled]="loading()">
                  <mat-icon>clear</mat-icon>
                  LIMPIAR
                </button>
              </div>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Resumen -->
      @if (resumen()) {
        <mat-card class="resumen-card">
          <mat-card-content>
            <div class="resumen-grid">
              <div class="resumen-item">
                <div class="resumen-icon total">
                  <mat-icon>remove_circle</mat-icon>
                </div>
                <div class="resumen-info">
                  <span class="resumen-label">TOTAL BAJAS</span>
                  <span class="resumen-value">{{ resumen()?.totalBajas }}</span>
                </div>
              </div>

              <div class="resumen-item">
                <div class="resumen-icon pendientes">
                  <mat-icon>schedule</mat-icon>
                </div>
                <div class="resumen-info">
                  <span class="resumen-label">PENDIENTES</span>
                  <span class="resumen-value">{{ resumen()?.bajasPendientes }}</span>
                </div>
              </div>

              <div class="resumen-item">
                <div class="resumen-icon aprobadas">
                  <mat-icon>check_circle</mat-icon>
                </div>
                <div class="resumen-info">
                  <span class="resumen-label">APROBADAS</span>
                  <span class="resumen-value">{{ resumen()?.bajasAprobadas }}</span>
                </div>
              </div>

              <div class="resumen-item">
                <div class="resumen-icon completadas">
                  <mat-icon>done_all</mat-icon>
                </div>
                <div class="resumen-info">
                  <span class="resumen-label">COMPLETADAS</span>
                  <span class="resumen-value">{{ resumen()?.bajasCompletadas }}</span>
                </div>
              </div>

              <div class="resumen-item">
                <div class="resumen-icon rechazadas">
                  <mat-icon>cancel</mat-icon>
                </div>
                <div class="resumen-info">
                  <span class="resumen-label">RECHAZADAS</span>
                  <span class="resumen-value">{{ resumen()?.bajasRechazadas }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Tabla de bajas -->
      <mat-card class="tabla-card">
        <mat-card-header>
          <mat-card-title>SOLICITUDES DE BAJA</mat-card-title>
          <mat-card-subtitle>
            {{ bajas().length }} solicitud(es) encontrada(s)
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loading()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Cargando solicitudes de baja...</p>
            </div>
          } @else if (bajas().length === 0) {
            <div class="empty-state">
              <mat-icon>inbox</mat-icon>
              <h3>No hay solicitudes de baja</h3>
              <p>No se encontraron solicitudes de baja con los filtros aplicados</p>
              <button mat-raised-button 
                      color="primary" 
                      (click)="nuevaSolicitudBaja()">
                Crear primera solicitud
              </button>
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="bajas()" matSort>
                <!-- Placa -->
                <ng-container matColumnDef="placa">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>PLACA</th>
                  <td mat-cell *matCellDef="let baja">
                    <div class="placa-info">
                      <span class="placa">{{ baja.placa }}</span>
                      <span class="vehiculo-info">{{ obtenerInfoVehiculo(baja) }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Tipo de Baja -->
                <ng-container matColumnDef="tipoBaja">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>TIPO</th>
                  <td mat-cell *matCellDef="let baja">
                    <mat-chip [style.background-color]="obtenerColorTipoBaja(baja.tipoBaja)"
                             [style.color]="'white'"
                             class="tipo-chip">
                      {{ obtenerNombreTipoBaja(baja.tipoBaja) }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Fecha de Baja -->
                <ng-container matColumnDef="fechaBaja">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>FECHA</th>
                  <td mat-cell *matCellDef="let baja">
                    {{ baja.fechaBaja | date:'dd/MM/yyyy' }}
                  </td>
                </ng-container>

                <!-- Motivo -->
                <ng-container matColumnDef="motivo">
                  <th mat-header-cell *matHeaderCellDef>MOTIVO</th>
                  <td mat-cell *matCellDef="let baja">
                    <div class="motivo-cell">
                      <span class="motivo-text">{{ baja.motivo }}</span>
                      @if (baja.descripcion) {
                        <mat-icon matTooltip="{{ baja.descripcion }}">info</mat-icon>
                      }
                    </div>
                  </td>
                </ng-container>

                <!-- Estado -->
                <ng-container matColumnDef="estadoBaja">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>ESTADO</th>
                  <td mat-cell *matCellDef="let baja">
                    <mat-chip [style.background-color]="obtenerColorEstadoBaja(baja.estadoBaja)"
                             [style.color]="'white'"
                             class="estado-chip">
                      {{ obtenerNombreEstadoBaja(baja.estadoBaja) }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Fecha Creación -->
                <ng-container matColumnDef="fechaCreacion">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>SOLICITADO</th>
                  <td mat-cell *matCellDef="let baja">
                    {{ baja.fechaCreacion | date:'dd/MM/yyyy' }}
                  </td>
                </ng-container>

                <!-- Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>ACCIONES</th>
                  <td mat-cell *matCellDef="let baja">
                    <button mat-icon-button 
                            [matMenuTriggerFor]="menu"
                            [matTooltip]="'Más acciones'">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="verDetalle(baja)">
                        <mat-icon>visibility</mat-icon>
                        <span>Ver detalle</span>
                      </button>
                      @if (baja.estadoBaja === 'PENDIENTE') {
                        <button mat-menu-item (click)="aprobarBaja(baja)">
                          <mat-icon>check_circle</mat-icon>
                          <span>Aprobar</span>
                        </button>
                        <button mat-menu-item (click)="rechazarBaja(baja)">
                          <mat-icon>cancel</mat-icon>
                          <span>Rechazar</span>
                        </button>
                      }
                      @if (baja.estadoBaja === 'APROBADA') {
                        <button mat-menu-item (click)="iniciarProceso(baja)">
                          <mat-icon>play_arrow</mat-icon>
                          <span>Iniciar proceso</span>
                        </button>
                      }
                      @if (baja.estadoBaja === 'EN_PROCESO') {
                        <button mat-menu-item (click)="completarBaja(baja)">
                          <mat-icon>done_all</mat-icon>
                          <span>Completar</span>
                        </button>
                      }
                      <button mat-menu-item (click)="editarBaja(baja)">
                        <mat-icon>edit</mat-icon>
                        <span>Editar</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="columnas"></tr>
                <tr mat-row *matRowDef="let row; columns: columnas;"></tr>
              </table>

              <mat-paginator [length]="totalBajas()"
                            [pageSize]="tamanoPagina()"
                            [pageSizeOptions]="[10, 25, 50, 100]"
                            (page)="onPageChange($event)"
                            showFirstLastButtons>
              </mat-paginator>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./bajas-vehiculos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BajasVehiculosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bajaService = inject(BajaVehiculoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Signals
  bajas = signal<BajaVehiculo[]>([]);
  resumen = signal<ResumenBajasVehiculo | null>(null);
  loading = signal(false);
  empresaId = signal<string>('');
  totalBajas = signal(0);
  tamanoPagina = signal(25);

  // Formulario de filtros
  filtrosForm!: FormGroup;

  // Columnas de la tabla
  columnas = ['placa', 'tipoBaja', 'fechaBaja', 'motivo', 'estadoBaja', 'fechaCreacion', 'acciones'];

  // Tipos y estados disponibles
  tiposBaja = this.bajaService.obtenerTiposBaja();
  estadosBaja = this.bajaService.obtenerEstadosBaja();

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarEmpresaId();
    this.cargarBajas();
    this.cargarResumen();
  }

  private inicializarFormulario(): void {
    this.filtrosForm = this.fb.group({
      placa: [''],
      tipoBaja: [''],
      estadoBaja: [''],
      fechaDesde: [''],
      fechaHasta: [''],
      pagina: [0],
      tamanoPagina: [25]
    });
  }

  private cargarEmpresaId(): void {
    // Obtener el ID de la empresa desde la ruta o del usuario logueado
    this.route.params.subscribe(params => {
      if (params['empresaId']) {
        this.empresaId.set(params['empresaId']);
      }
    });
  }

  private cargarBajas(): void {
    if (!this.empresaId()) return;

    this.loading.set(true);
    const filtros = this.obtenerFiltros();

    this.bajaService.obtenerBajasEmpresa(this.empresaId(), filtros).subscribe({
      next: (bajas: BajaVehiculo[]) => {
        this.bajas.set(bajas);
        this.totalBajas.set(bajas.length);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error al cargar bajas:', error);
        this.snackBar.open('Error al cargar las solicitudes de baja', 'Cerrar', { duration: 5000 });
        this.loading.set(false);
      }
    });
  }

  private cargarResumen(): void {
    if (!this.empresaId()) return;

    this.bajaService.obtenerResumenBajas(this.empresaId()).subscribe({
      next: (resumen: ResumenBajasVehiculo) => {
        this.resumen.set(resumen);
      },
      error: (error: any) => {
        console.error('Error al cargar resumen:', error);
      }
    });
  }

  private obtenerFiltros(): FiltroBajaVehiculo {
    const formValue = this.filtrosForm.value;
    return {
      placa: formValue.placa || undefined,
      tipoBaja: formValue.tipoBaja || undefined,
      estadoBaja: formValue.estadoBaja || undefined,
      fechaDesde: formValue.fechaDesde || undefined,
      fechaHasta: formValue.fechaHasta || undefined,
      pagina: formValue.pagina || 0,
      tamanoPagina: formValue.tamanoPagina || 25
    };
  }

  aplicarFiltros(): void {
    this.cargarBajas();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      pagina: 0,
      tamanoPagina: 25
    });
    this.cargarBajas();
  }

  onPageChange(event: PageEvent): void {
    this.tamanoPagina.set(event.pageSize);
    this.filtrosForm.patchValue({
      pagina: event.pageIndex,
      tamanoPagina: event.pageSize
    });
    this.cargarBajas();
  }

  nuevaSolicitudBaja(): void {
    // TODO: Implementar modal de nueva solicitud
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }

  verDetalle(baja: BajaVehiculo): void {
    // TODO: Implementar vista de detalle
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }

  aprobarBaja(baja: BajaVehiculo): void {
    this.bajaService.aprobarBaja(baja.id, 'usuario_actual').subscribe({
      next: () => {
        this.snackBar.open('Baja aprobada exitosamente', 'Cerrar', { duration: 3000 });
        this.cargarBajas();
        this.cargarResumen();
      },
      error: (error: any) => {
        console.error('Error al aprobar baja:', error);
        this.snackBar.open('Error al aprobar la baja', 'Cerrar', { duration: 5000 });
      }
    });
  }

  rechazarBaja(baja: BajaVehiculo): void {
    // TODO: Implementar modal de rechazo con motivo
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }

  iniciarProceso(baja: BajaVehiculo): void {
    this.bajaService.iniciarProcesoBaja(baja.id).subscribe({
      next: () => {
        this.snackBar.open('Proceso de baja iniciado', 'Cerrar', { duration: 3000 });
        this.cargarBajas();
        this.cargarResumen();
      },
      error: (error: any) => {
        console.error('Error al iniciar proceso:', error);
        this.snackBar.open('Error al iniciar el proceso', 'Cerrar', { duration: 5000 });
      }
    });
  }

  completarBaja(baja: BajaVehiculo): void {
    this.bajaService.completarBaja(baja.id).subscribe({
      next: () => {
        this.snackBar.open('Baja completada exitosamente', 'Cerrar', { duration: 3000 });
        this.cargarBajas();
        this.cargarResumen();
      },
      error: (error: any) => {
        console.error('Error al completar baja:', error);
        this.snackBar.open('Error al completar la baja', 'Cerrar', { duration: 5000 });
      }
    });
  }

  editarBaja(baja: BajaVehiculo): void {
    // TODO: Implementar modal de edición
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }

  // Métodos de utilidad
  obtenerNombreTipoBaja(tipo: TipoBajaVehiculo): string {
    return this.bajaService.obtenerNombreTipoBaja(tipo);
  }

  obtenerNombreEstadoBaja(estado: EstadoBajaVehiculo): string {
    return this.bajaService.obtenerNombreEstadoBaja(estado);
  }

  obtenerColorTipoBaja(tipo: TipoBajaVehiculo): string {
    return this.bajaService.obtenerColorTipoBaja(tipo);
  }

  obtenerColorEstadoBaja(estado: EstadoBajaVehiculo): string {
    return this.bajaService.obtenerColorEstadoBaja(estado);
  }

  obtenerInfoVehiculo(baja: BajaVehiculo): string {
    // TODO: Obtener información completa del vehículo
    return 'Información del vehículo';
  }
} 