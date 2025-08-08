import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VehiculoService } from '../../services/vehiculo.service';
import { AuthService } from '../../services/auth.service';
import { Vehiculo } from '../../models/vehiculo.model';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>Vehículos Registrados</h1>
        </div>
        <p class="header-subtitle">Gestión de vehículos de transporte</p>
      </div>
      <div class="header-actions">
        <button mat-raised-button color="primary" (click)="nuevoVehiculo()" class="action-button">
          <mat-icon>add</mat-icon>
          Nuevo Vehículo
        </button>
      </div>
    </div>

    <div class="content-section">
      <!-- Loading State -->
      @if (isLoading) {
        <div class="loading-container">
          <div class="loading-content">
            <mat-spinner diameter="60" class="loading-spinner"></mat-spinner>
            <h3>Cargando vehículos...</h3>
            <p>Obteniendo información de los vehículos registrados</p>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading && vehiculos.length === 0) {
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
      @if (!isLoading && vehiculos.length > 0) {
        <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <h3>Vehículos Registrados</h3>
            <p class="table-subtitle">Se encontraron {{vehiculos.length}} vehículos</p>
          </div>
          <div class="table-actions">
            <button mat-button color="accent" (click)="recargarVehiculos()">
              <mat-icon>refresh</mat-icon>
              Recargar
            </button>
          </div>
        </div>

        <div class="table-container">
          <table mat-table [dataSource]="vehiculos" class="modern-table">
            <!-- Placa Column -->
            <ng-container matColumnDef="placa">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                <div class="header-content">
                  <span>Placa</span>
                </div>
              </th>
              <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                <div class="cell-content">
                  <span class="cell-text">{{ vehiculo.placa }}</span>
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
                  <span class="cell-text">{{ vehiculo.marca }}</span>
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
                  <span class="cell-text">{{ vehiculo.categoria }}</span>
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
                  <span class="status-badge" [class]="'status-' + vehiculo.estado.toLowerCase()">
                    {{ vehiculo.estado }}
                  </span>
                </div>
              </td>
            </ng-container>

            <!-- TUC Column -->
            <ng-container matColumnDef="tuc">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                <div class="header-content">
                  <span>TUC</span>
                </div>
              </th>
              <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                <div class="cell-content">
                  <span class="cell-text" *ngIf="vehiculo.tuc">{{ vehiculo.tuc.nroTuc }}</span>
                  <span class="cell-text text-muted" *ngIf="!vehiculo.tuc">Sin TUC</span>
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
                <div class="cell-content actions-content">
                  <button mat-icon-button 
                          color="primary" 
                          (click)="verVehiculo(vehiculo.id)"
                          matTooltip="Ver detalles"
                          class="action-button">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="accent" 
                          (click)="editarVehiculo(vehiculo.id)"
                          matTooltip="Editar vehículo"
                          class="action-button">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="warn" 
                          (click)="eliminarVehiculo(vehiculo.id)"
                          matTooltip="Eliminar vehículo"
                          class="action-button">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
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
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
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

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 4px;
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
      border-radius: 4px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.2s ease-in-out;
    }

    .primary-action:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .secondary-action {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 4px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.2s ease-in-out;
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
      margin: 24px 0 12px 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .empty-content p {
      margin: 0 0 32px 0;
      color: #6c757d;
      font-size: 16px;
    }

    .empty-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .table-section {
      padding: 0;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #e9ecef;
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

    .table-container {
      overflow-x: auto;
    }

    .modern-table {
      width: 100%;
      border-collapse: collapse;
    }

    .table-header-cell {
      background: #f8f9fa;
      padding: 16px;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 2px solid #e9ecef;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .table-cell {
      padding: 16px;
      border-bottom: 1px solid #e9ecef;
      vertical-align: middle;
    }

    .cell-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cell-text {
      color: #2c3e50;
      font-weight: 500;
    }

    .text-muted {
      color: #6c757d;
      font-weight: 400;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-activo {
      background: #d4edda;
      color: #155724;
    }

    .status-inactivo {
      background: #f8d7da;
      color: #721c24;
    }

    .status-en_tramite {
      background: #fff3cd;
      color: #856404;
    }

    .actions-content {
      display: flex;
      gap: 8px;
      justify-content: flex-start;
    }

    .action-button {
      width: 36px;
      height: 36px;
      line-height: 36px;
    }

    .action-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
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

      .actions-content {
        justify-content: center;
      }
    }
  `]
})
export class VehiculosComponent implements OnInit {
  vehiculos: Vehiculo[] = [];
  displayedColumns: string[] = ['placa', 'marca', 'categoria', 'estado', 'tuc', 'acciones'];
  isLoading = false;

  constructor(
    private vehiculoService: VehiculoService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      console.log('Usuario no autenticado, redirigiendo a login...');
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('Usuario autenticado:', this.authService.getCurrentUser());
    console.log('Token disponible:', !!this.authService.getToken());
    
    // Cargar vehículos inmediatamente
    this.loadVehiculos();
  }

  recargarVehiculos(): void {
    console.log('Recargando vehículos manualmente...');
    this.loadVehiculos();
  }

  loadVehiculos(): void {
    this.isLoading = true;
    console.log('Iniciando carga de vehículos...');
    
    this.vehiculoService.getVehiculos().subscribe({
      next: (vehiculos) => {
        console.log('Vehículos cargados exitosamente:', vehiculos);
        this.vehiculos = vehiculos;
        this.isLoading = false;
        // Forzar la detección de cambios
        this.cdr.detectChanges();
        console.log('Detección de cambios forzada, vehículos en vista:', this.vehiculos);
      },
      error: (error) => {
        console.error('Error cargando vehículos:', error);
        console.error('Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        
        let errorMessage = 'Error al cargar vehículos';
        
        if (error.status === 401) {
          errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
        } else if (error.status === 404) {
          errorMessage = 'Endpoint no encontrado. Verifique la configuración del backend.';
        } else if (error.status === 0) {
          errorMessage = 'No se puede conectar al servidor. Verifique que el backend esté ejecutándose.';
        }
        
        this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
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
    if (confirm('¿Estás seguro de que deseas eliminar este vehículo? Esta acción no se puede deshacer.')) {
      this.vehiculoService.deleteVehiculo(id).subscribe({
        next: () => {
          this.snackBar.open('Vehículo eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadVehiculos(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error eliminando vehículo:', error);
          this.snackBar.open('Error al eliminar el vehículo', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }
} 