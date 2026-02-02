import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SolicitudBajaService } from '../../services/solicitud-baja.service';
import { 
  SolicitudBaja, 
  EstadoSolicitudBaja, 
  MotivoBaja,
  MOTIVOS_BAJA_LABELS,
  ESTADOS_SOLICITUD_LABELS
} from '../../models/solicitud-baja.model';

@Component({
  selector: 'app-solicitudes-baja',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    MatExpansionModule
  ],
  template: `
    <div class="solicitudes-baja-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>assignment</mat-icon>
            Solicitudes de Baja de Vehículos
          </mat-card-title>
          <mat-card-subtitle>
            Gestión y seguimiento de solicitudes de baja vehicular
          </mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <!-- Filtros -->
      <mat-card class="filtros-card">
        <mat-card-content>
          <form [formGroup]="filtrosForm" class="filtros-form">
            <div class="filtros-grid">
              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado" multiple>
                  <mat-option value="PENDIENTE">Pendiente</mat-option>
                  <mat-option value="EN_REVISION">En Revisión</mat-option>
                  <mat-option value="APROBADA">Aprobada</mat-option>
                  <mat-option value="RECHAZADA">Rechazada</mat-option>
                  <mat-option value="CANCELADA">Cancelada</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Motivo</mat-label>
                <mat-select formControlName="motivo" multiple>
                  <mat-option value="ACCIDENTE">Accidente Total</mat-option>
                  <mat-option value="DETERIORO">Deterioro por Uso</mat-option>
                  <mat-option value="OBSOLESCENCIA">Obsolescencia Tecnológica</mat-option>
                  <mat-option value="CAMBIO_FLOTA">Cambio de Flota</mat-option>
                  <mat-option value="VENTA">Venta del Vehículo</mat-option>
                  <mat-option value="ROBO_HURTO">Robo o Hurto</mat-option>
                  <mat-option value="INCUMPLIMIENTO">Incumplimiento Normativo</mat-option>
                  <mat-option value="OTROS">Otros</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Placa del Vehículo</mat-label>
                <input matInput formControlName="vehiculoPlaca" placeholder="Ej: ABC-123">
              </mat-form-field>

              <div class="filtros-actions">
                <button mat-raised-button color="primary" (click)="aplicarFiltros()">
                  <mat-icon>search</mat-icon>
                  Buscar
                </button>
                <button mat-button (click)="limpiarFiltros()">
                  <mat-icon>clear</mat-icon>
                  Limpiar
                </button>
              </div>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Tabla de solicitudes -->
      <mat-card class="tabla-card">
        <mat-card-content>
          @if (cargando()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Cargando solicitudes...</p>
            </div>
          } @else {
            <div class="tabla-container">
              <table mat-table [dataSource]="solicitudesFiltradas()" class="solicitudes-table">
                <!-- Columna de Placa -->
                <ng-container matColumnDef="placa">
                  <th mat-header-cell *matHeaderCellDef>Placa</th>
                  <td mat-cell *matCellDef="let solicitud">
                    <div class="placa-cell">
                      <strong>{{ solicitud.vehiculoPlaca }}</strong>
                    </div>
                  </td>
                </ng-container>

                <!-- Columna de Empresa -->
                <ng-container matColumnDef="empresa">
                  <th mat-header-cell *matHeaderCellDef>Empresa</th>
                  <td mat-cell *matCellDef="let solicitud">
                    <div class="empresa-cell">
                      {{ solicitud.empresaNombre || 'No asignada' }}
                    </div>
                  </td>
                </ng-container>

                <!-- Columna de Motivo -->
                <ng-container matColumnDef="motivo">
                  <th mat-header-cell *matHeaderCellDef>Motivo</th>
                  <td mat-cell *matCellDef="let solicitud">
                    <mat-chip class="motivo-chip">
                      {{ getMotivoBajaLabel(solicitud.motivo) }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Columna de Estado -->
                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let solicitud">
                    <mat-chip 
                      class="estado-chip"
                      [class]="'estado-' + solicitud.estado.toLowerCase()">
                      {{ getEstadoSolicitudLabel(solicitud.estado) }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Columna de Fecha -->
                <ng-container matColumnDef="fecha">
                  <th mat-header-cell *matHeaderCellDef>Fecha Solicitud</th>
                  <td mat-cell *matCellDef="let solicitud">
                    <div class="fecha-cell">
                      {{ formatearFecha(solicitud.fechaSolicitud) }}
                    </div>
                  </td>
                </ng-container>

                <!-- Columna de Solicitante -->
                <ng-container matColumnDef="solicitante">
                  <th mat-header-cell *matHeaderCellDef>Solicitante</th>
                  <td mat-cell *matCellDef="let solicitud">
                    <div class="solicitante-cell">
                      <div class="nombre">{{ solicitud.solicitadoPor.nombreUsuario }}</div>
                      <div class="email">{{ solicitud.solicitadoPor.email }}</div>
                    </div>
                  </td>
                </ng-container>

                <!-- Columna de Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let solicitud">
                    <div class="acciones-cell">
                      <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Más opciones">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #menu="matMenu">
                        <button mat-menu-item (click)="verDetalleSolicitud(solicitud)">
                          <mat-icon>visibility</mat-icon>
                          <span>Ver Detalle</span>
                        </button>
                        @if (solicitud.estado === 'PENDIENTE' || solicitud.estado === 'EN_REVISION') {
                          <button mat-menu-item (click)="aprobarSolicitud(solicitud)">
                            <mat-icon>check_circle</mat-icon>
                            <span>Aprobar</span>
                          </button>
                          <button mat-menu-item (click)="rechazarSolicitud(solicitud)">
                            <mat-icon>cancel</mat-icon>
                            <span>Rechazar</span>
                          </button>
                        }
                        @if (solicitud.estado === 'PENDIENTE') {
                          <button mat-menu-item (click)="cancelarSolicitud(solicitud)">
                            <mat-icon>close</mat-icon>
                            <span>Cancelar</span>
                          </button>
                        }
                      </mat-menu>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>

              @if (solicitudesFiltradas().length === 0) {
                <div class="no-data">
                  <mat-icon>assignment</mat-icon>
                  <h3>No hay solicitudes de baja</h3>
                  <p>No se encontraron solicitudes que coincidan con los filtros aplicados.</p>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .solicitudes-baja-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-card {
      margin-bottom: 20px;
    }

    .header-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
    }

    .filtros-card {
      margin-bottom: 20px;
    }

    .filtros-form {
      width: 100%;
    }

    .filtros-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      align-items: end;
    }

    .filtros-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .tabla-card {
      margin-bottom: 20px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
    }

    .tabla-container {
      overflow-x: auto;
    }

    .solicitudes-table {
      width: 100%;
      min-width: 800px;
    }

    .placa-cell strong {
      font-size: 16px;
      color: #1976d2;
    }

    .empresa-cell {
      font-size: 14px;
      color: #666;
    }

    .motivo-chip {
      background-color: #e3f2fd;
      color: #1976d2;
      font-size: 12px;
    }

    .estado-chip {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .estado-pendiente {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .estado-en_revision {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .estado-aprobada {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .estado-rechazada {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .estado-cancelada {
      background-color: #f5f5f5;
      color: #757575;
    }

    .fecha-cell {
      font-size: 14px;
      color: #666;
    }

    .solicitante-cell .nombre {
      font-weight: 500;
      font-size: 14px;
    }

    .solicitante-cell .email {
      font-size: 12px;
      color: #666;
    }

    .acciones-cell {
      display: flex;
      justify-content: center;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: #666;
    }

    .no-data mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-data h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
    }

    .no-data p {
      margin: 0;
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .solicitudes-baja-container {
        padding: 16px;
      }

      .filtros-grid {
        grid-template-columns: 1fr;
      }

      .filtros-actions {
        justify-content: stretch;
      }

      .filtros-actions button {
        flex: 1;
      }
    }
  `]
})
export class SolicitudesBajaComponent implements OnInit {
  private solicitudBajaService = inject(SolicitudBajaService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Signals
  solicitudes = signal<SolicitudBaja[]>([]);
  cargando = signal(false);

  // Formulario de filtros
  filtrosForm: FormGroup = this.fb.group({
    estado: [[]],
    motivo: [[]],
    vehiculoPlaca: ['']
  });

  // Columnas de la tabla
  displayedColumns = ['placa', 'empresa', 'motivo', 'estado', 'fecha', 'solicitante', 'acciones'];

  // Computed para solicitudes filtradas
  solicitudesFiltradas = computed(() => {
    const solicitudes = this.solicitudes();
    const filtros = this.filtrosForm.value;

    let solicitudesFiltradas = [...solicitudes];

    if (filtros.estado?.length > 0) {
      solicitudesFiltradas = solicitudesFiltradas.filter((s: any) => 
        filtros.estado.includes(s.estado)
      );
    }

    if (filtros.motivo?.length > 0) {
      solicitudesFiltradas = solicitudesFiltradas.filter((s: any) => 
        filtros.motivo.includes(s.motivo)
      );
    }

    if (filtros.vehiculoPlaca) {
      solicitudesFiltradas = solicitudesFiltradas.filter((s: any) => 
        s.vehiculoPlaca.toLowerCase().includes(filtros.vehiculoPlaca.toLowerCase())
      );
    }

    return solicitudesFiltradas;
  });

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.cargando.set(true);
    this.solicitudBajaService.getSolicitudesBaja().subscribe({
      next: (solicitudes: SolicitudBaja[]) => {
        this.solicitudes.set(solicitudes);
        this.cargando.set(false);
      },
      error: (error: any) => {
        console.error('Error cargando solicitudes::', error);
        this.snackBar.open('Error al cargar las solicitudes de baja', 'Cerrar', { duration: 3000 });
        this.cargando.set(false);
      }
    });
  }

  aplicarFiltros(): void {
    // Los filtros se aplican automáticamente a través del computed
    this.snackBar.open('Filtros aplicados', 'Cerrar', { duration: 2000 });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      estado: [],
      motivo: [],
      vehiculoPlaca: ''
    });
  }

  verDetalleSolicitud(solicitud: SolicitudBaja): void {
    // TODO: Implementar modal de detalle
    this.snackBar.open('Funcionalidad de detalle en desarrollo', 'Cerrar', { duration: 3000 });
  }

  aprobarSolicitud(solicitud: SolicitudBaja): void {
    const confirmar = confirm(
      `¿Estás seguro de que deseas aprobar la solicitud de baja del vehículo ${solicitud.vehiculoPlaca}?\n\n` +
      `IMPORTANTE: Al aprobar esta solicitud, el vehículo será marcado automáticamente como "BAJA DEFINITIVA" y no podrá ser utilizado en operaciones futuras.`
    );

    if (confirmar) {
      this.solicitudBajaService.aprobarSolicitudBaja(solicitud.id).subscribe({
        next: () => {
          this.snackBar.open(
            `Solicitud de baja aprobada para el vehículo ${solicitud.vehiculoPlaca}. El vehículo ha sido marcado como BAJA DEFINITIVA.`,
            'Cerrar',
            { duration: 5000, panelClass: ['snackbar-success'] }
          );
          this.cargarSolicitudes();
        },
        error: (error: unknown) => {
          console.error('Error aprobando solicitud::', error);
          this.snackBar.open('Error al aprobar la solicitud', 'Cerrar', { 
            duration: 3000, 
            panelClass: ['snackbar-error'] 
          });
        }
      });
    }
  }

  rechazarSolicitud(solicitud: SolicitudBaja): void {
    const observaciones = prompt(
      `Ingrese las observaciones para rechazar la solicitud del vehículo ${solicitud.vehiculoPlaca}:`
    );

    if (observaciones !== null && observaciones.trim()) {
      this.solicitudBajaService.rechazarSolicitudBaja(solicitud.id, observaciones).subscribe({
        next: () => {
          this.snackBar.open(
            `Solicitud de baja rechazada para el vehículo ${solicitud.vehiculoPlaca}`,
            'Cerrar',
            { duration: 3000, panelClass: ['snackbar-success'] }
          );
          this.cargarSolicitudes();
        },
        error: (error: unknown) => {
          console.error('Error rechazando solicitud::', error);
          this.snackBar.open('Error al rechazar la solicitud', 'Cerrar', { 
            duration: 3000, 
            panelClass: ['snackbar-error'] 
          });
        }
      });
    }
  }

  cancelarSolicitud(solicitud: SolicitudBaja): void {
    const confirmar = confirm(
      `¿Estás seguro de que deseas cancelar la solicitud de baja del vehículo ${solicitud.vehiculoPlaca}?`
    );

    if (confirmar) {
      this.solicitudBajaService.cancelarSolicitudBaja(solicitud.id).subscribe({
        next: () => {
          this.snackBar.open(
            `Solicitud de baja cancelada para el vehículo ${solicitud.vehiculoPlaca}`,
            'Cerrar',
            { duration: 3000, panelClass: ['snackbar-success'] }
          );
          this.cargarSolicitudes();
        },
        error: (error: unknown) => {
          console.error('Error cancelando solicitud::', error);
          this.snackBar.open('Error al cancelar la solicitud', 'Cerrar', { 
            duration: 3000, 
            panelClass: ['snackbar-error'] 
          });
        }
      });
    }
  }

  getMotivoBajaLabel(motivo: MotivoBaja): string {
    return MOTIVOS_BAJA_LABELS[motivo] || motivo;
  }

  getEstadoSolicitudLabel(estado: EstadoSolicitudBaja): string {
    return ESTADOS_SOLICITUD_LABELS[estado] || estado;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}