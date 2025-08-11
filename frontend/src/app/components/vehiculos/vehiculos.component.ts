import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VehiculoService } from '../../services/vehiculo.service';
import { AuthService } from '../../services/auth.service';
import { Vehiculo } from '../../models/vehiculo.model';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>Vehículos Registrados</h1>
          <p class="header-subtitle">Gestión de vehículos de transporte</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="nuevoVehiculo()" class="action-button">
            <mat-icon>add</mat-icon>
            Nuevo Vehículo
          </button>
        </div>
      </div>
    </div>

    <div class="content-section">
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <div class="loading-content">
            <mat-spinner diameter="60" class="loading-spinner"></mat-spinner>
            <h3>Cargando vehículos...</h3>
            <p>Obteniendo información de los vehículos registrados</p>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && vehiculos().length === 0) {
        <div class="empty-container">
          <div class="empty-content">
            <div class="empty-icon-container">
              <mat-icon class="empty-icon">directions_car</mat-icon>
            </div>
            <h2>No hay vehículos registrados</h2>
            <p>Comienza agregando el primer vehículo de transporte al sistema.</p>
            <div class="empty-actions">
              <button mat-raised-button color="primary" (click)="nuevoVehiculo()" class="primary-action">
                <mat-icon>add</mat-icon>
                Agregar Primer Vehículo
              </button>
              <button mat-button color="accent" (click)="recargarVehiculos()" class="secondary-action">
                <mat-icon>refresh</mat-icon>
                Recargar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Data Table -->
      @if (!isLoading() && vehiculos().length > 0) {
        <div class="table-section">
          <div class="table-header">
            <div class="table-info">
              <h3>Vehículos Registrados</h3>
              <p class="table-subtitle">Se encontraron {{ vehiculos().length }} vehículos</p>
            </div>
            <div class="table-actions">
              <button mat-button color="accent" (click)="recargarVehiculos()">
                <mat-icon>refresh</mat-icon>
                Recargar
              </button>
            </div>
          </div>

          <div class="table-container">
            <table mat-table [dataSource]="vehiculos()" class="modern-table">
              <!-- Placa Column -->
              <ng-container matColumnDef="placa">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>Placa</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                  <div class="cell-content">
                    <span class="placa-text">{{ vehiculo.placa }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Marca Column -->
              <ng-container matColumnDef="marca">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>Marca</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                  <div class="cell-content">
                    <span>{{ vehiculo.marca }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Modelo Column -->
              <ng-container matColumnDef="modelo">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>Modelo</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                  <div class="cell-content">
                    <span>{{ vehiculo.modelo }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Categoría Column -->
              <ng-container matColumnDef="categoria">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>Categoría</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                  <div class="cell-content">
                    <mat-chip [class]="'categoria-chip-' + vehiculo.categoria?.toLowerCase()">
                      {{ vehiculo.categoria }}
                    </mat-chip>
                  </div>
                </td>
              </ng-container>

              <!-- Estado Column -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>Estado</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                  <div class="cell-content">
                    <mat-chip [class]="'estado-chip-' + vehiculo.estado?.toLowerCase()">
                      {{ getEstadoDisplayName(vehiculo.estado) }}
                    </mat-chip>
                  </div>
                </td>
              </ng-container>

              <!-- Año Fabricación Column -->
              <ng-container matColumnDef="anioFabricacion">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>Año</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                  <div class="cell-content">
                    <span>{{ vehiculo.anioFabricacion }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Acciones Column -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>Acciones</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                  <div class="cell-content">
                    <div class="action-buttons">
                      <button mat-icon-button color="primary" 
                              matTooltip="Ver detalles" 
                              (click)="verVehiculo(vehiculo.id)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button color="accent" 
                              matTooltip="Editar" 
                              (click)="editarVehiculo(vehiculo.id)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" 
                              matTooltip="Eliminar" 
                              (click)="eliminarVehiculo(vehiculo.id)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                  class="table-row"
                  (click)="verVehiculo(row.id)"></tr>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .header-content {
      flex: 1;
    }

    .header-title {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .header-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
    }

    .header-subtitle {
      margin: 0;
      color: #6c757d;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.2s ease-in-out;
    }

    .action-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .action-button:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .primary-action {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .primary-action:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .secondary-action {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .secondary-action:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .content-section {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 80px 24px;
      text-align: center;
    }

    .loading-content h3 {
      margin: 24px 0 8px 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .loading-content p {
      margin: 0;
      color: #6c757d;
    }

    .empty-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 80px 24px;
      text-align: center;
    }

    .empty-content h2 {
      margin: 24px 0 8px 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .empty-content p {
      margin: 0 0 32px 0;
      color: #6c757d;
      font-size: 16px;
    }

    .empty-icon-container {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #6c757d;
    }

    .empty-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .table-section {
      padding: 24px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .table-info h3 {
      margin: 0 0 4px 0;
      color: #2c3e50;
      font-weight: 600;
    }

    .table-subtitle {
      margin: 0;
      color: #6c757d;
      font-size: 14px;
    }

    .table-actions {
      display: flex;
      gap: 8px;
    }

    .table-container {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .modern-table {
      width: 100%;
      background: white;
    }

    .table-header-cell {
      background-color: #f8f9fa;
      color: #2c3e50;
      font-weight: 600;
      font-size: 14px;
      padding: 16px;
      border-bottom: 2px solid #e9ecef;
    }

    .table-cell {
      padding: 16px;
      border-bottom: 1px solid #e9ecef;
      color: #2c3e50;
    }

    .table-row {
      transition: background-color 0.2s ease;
      cursor: pointer;
    }

    .table-row:hover {
      background-color: #f8f9fa;
    }

    .cell-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .placa-text {
      font-weight: 600;
      color: #1976d2;
    }

    .categoria-chip-autobus {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .categoria-chip-camion {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .categoria-chip-camioneta {
      background-color: #e8f5e8;
      color: #388e3c;
    }

    .categoria-chip-microbus {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .estado-chip-activo {
      background-color: #d4edda;
      color: #155724;
    }

    .estado-chip-inactivo {
      background-color: #f8d7da;
      color: #721c24;
    }

    .estado-chip-en_mantenimiento {
      background-color: #fff3cd;
      color: #856404;
    }

    .estado-chip-suspendido {
      background-color: #e2e3e5;
      color: #383d41;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .action-buttons button {
      transition: transform 0.2s ease;
    }

    .action-buttons button:hover {
      transform: scale(1.1);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .header-title h1 {
        font-size: 24px;
      }

      .table-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .table-actions {
        justify-content: center;
      }

      .action-buttons {
        flex-direction: column;
        gap: 2px;
      }
    }
  `]
})
export class VehiculosComponent implements OnInit {
  private vehiculoService = inject(VehiculoService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Signals
  vehiculos = signal<Vehiculo[]>([]);
  isLoading = signal(false);

  // Columnas de la tabla
  displayedColumns = ['placa', 'marca', 'modelo', 'categoria', 'estado', 'anioFabricacion', 'acciones'];

  ngOnInit(): void {
    this.loadVehiculos();
  }

  recargarVehiculos(): void {
    this.loadVehiculos();
  }

  loadVehiculos(): void {
    this.isLoading.set(true);
    this.vehiculoService.getVehiculos().subscribe({
      next: (vehiculos) => {
        this.vehiculos.set(vehiculos);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando vehículos:', error);
        this.snackBar.open('Error al cargar los vehículos', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  getEstadoDisplayName(estado?: string): string {
    if (!estado) return 'Desconocido';
    
    const estados: { [key: string]: string } = {
      'ACTIVO': 'Activo',
      'INACTIVO': 'Inactivo',
      'EN_MANTENIMIENTO': 'En Mantenimiento',
      'SUSPENDIDO': 'Suspendido'
    };
    return estados[estado] || estado;
  }

  verVehiculo(id: string): void {
    this.router.navigate(['/vehiculos', id]);
  }

  editarVehiculo(id: string): void {
    this.router.navigate(['/vehiculos', id, 'editar']);
  }

  nuevoVehiculo(): void {
    this.router.navigate(['/vehiculos/nuevo']);
  }

  eliminarVehiculo(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este vehículo?')) {
      this.vehiculoService.deleteVehiculo(id).subscribe({
        next: () => {
          this.snackBar.open('Vehículo eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadVehiculos();
        },
        error: (error) => {
          console.error('Error eliminando vehículo:', error);
          this.snackBar.open('Error al eliminar el vehículo', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
} 