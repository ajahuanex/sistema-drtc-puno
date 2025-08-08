import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VehiculoService } from '../../services/vehiculo.service';
import { Vehiculo } from '../../models/vehiculo.model';

@Component({
  selector: 'app-vehiculo-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>Detalles del Vehículo</h1>
        </div>
        <p class="header-subtitle">Información completa del vehículo registrado</p>
      </div>
      <div class="header-actions">
        <button mat-button (click)="volver()" class="secondary-button">
          <mat-icon>arrow_back</mat-icon>
          Volver
        </button>
        <button mat-raised-button color="accent" (click)="editarVehiculo()" class="action-button">
          <mat-icon>edit</mat-icon>
          Editar
        </button>
      </div>
    </div>

    <div class="content-section">
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <div class="loading-content">
            <mat-spinner diameter="60" class="loading-spinner"></mat-spinner>
            <h3>Cargando información...</h3>
            <p>Obteniendo detalles del vehículo</p>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (!isLoading() && !vehiculo()) {
        <div class="error-container">
          <div class="error-content">
            <mat-icon class="error-icon">error</mat-icon>
            <h2>Vehículo no encontrado</h2>
            <p>El vehículo que buscas no existe o ha sido eliminado.</p>
            <button mat-raised-button color="primary" (click)="volver()">
              <mat-icon>arrow_back</mat-icon>
              Volver a Vehículos
            </button>
          </div>
        </div>
      }

      <!-- Vehicle Details -->
      @if (!isLoading() && vehiculo()) {
        <div class="details-container">
        
        <!-- Basic Information -->
        <mat-card class="detail-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>directions_car</mat-icon>
              Información Básica
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Placa:</span>
                <span class="info-value">{{ vehiculo()?.placa }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Marca:</span>
                <span class="info-value">{{ vehiculo()?.marca }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Categoría:</span>
                <span class="info-value">{{ vehiculo()?.categoria }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Año de Fabricación:</span>
                <span class="info-value">{{ vehiculo()?.anioFabricacion }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Estado:</span>
                <span class="status-chip" [class]="'status-' + vehiculo()?.estado?.toLowerCase()">
                  {{ vehiculo()?.estado }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Technical Data -->
        <mat-card class="detail-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>build</mat-icon>
              Datos Técnicos
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Motor:</span>
                <span class="info-value">{{ vehiculo()?.datosTecnicos?.motor }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Chasis:</span>
                <span class="info-value">{{ vehiculo()?.datosTecnicos?.chasis }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Número de Ejes:</span>
                <span class="info-value">{{ vehiculo()?.datosTecnicos?.ejes }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Número de Asientos:</span>
                <span class="info-value">{{ vehiculo()?.datosTecnicos?.asientos }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Peso Neto:</span>
                <span class="info-value">{{ vehiculo()?.datosTecnicos?.pesoNeto }} kg</span>
              </div>
              <div class="info-item">
                <span class="info-label">Peso Bruto:</span>
                <span class="info-value">{{ vehiculo()?.datosTecnicos?.pesoBruto }} kg</span>
              </div>
            </div>

            <mat-divider class="divider"></mat-divider>

            <h4 class="section-title">Medidas del Vehículo</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Largo:</span>
                <span class="info-value">{{ vehiculo()?.datosTecnicos?.medidas?.largo }} m</span>
              </div>
              <div class="info-item">
                <span class="info-label">Ancho:</span>
                <span class="info-value">{{ vehiculo()?.datosTecnicos?.medidas?.ancho }} m</span>
              </div>
              <div class="info-item">
                <span class="info-label">Alto:</span>
                <span class="info-value">{{ vehiculo()?.datosTecnicos?.medidas?.alto }} m</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- TUC Information -->
        @if (vehiculo()?.tuc) {
          <mat-card class="detail-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>receipt</mat-icon>
              Información TUC
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Número TUC:</span>
                <span class="info-value">{{ vehiculo()?.tuc?.nroTuc }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha de Emisión:</span>
                <span class="info-value">{{ vehiculo()?.tuc?.fechaEmision | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        }

        <!-- Company Information -->
        <mat-card class="detail-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>business</mat-icon>
              Información de Empresa
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">ID de Empresa:</span>
                <span class="info-value">{{ vehiculo()?.empresaActualId }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">ID de Resolución:</span>
                <span class="info-value">{{ vehiculo()?.resolucionId }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Rutas Asignadas:</span>
                <span class="info-value">{{ vehiculo()?.rutasAsignadasIds?.length || 0 }} rutas</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button mat-raised-button color="warn" (click)="eliminarVehiculo()" class="danger-button">
            <mat-icon>delete</mat-icon>
            Eliminar Vehículo
          </button>
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

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .secondary-button, .action-button {
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

    .secondary-button:hover, .action-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .secondary-button:active, .action-button:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .danger-button {
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

    .danger-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .danger-button:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .content-section {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .loading-container, .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 80px 24px;
      text-align: center;
    }

    .loading-content h3, .error-content h2 {
      margin: 24px 0 8px 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .loading-content p, .error-content p {
      margin: 0 0 24px 0;
      color: #6c757d;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #dc3545;
    }

    .details-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .detail-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .detail-card mat-card-header {
      padding: 16px 16px 0 16px;
    }

    .detail-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
    }

    .detail-card mat-card-content {
      padding: 16px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f1f3f4;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #6c757d;
      font-size: 14px;
    }

    .info-value {
      font-weight: 500;
      color: #2c3e50;
      text-align: right;
    }

    .status-chip {
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

    .status-suspendido {
      background: #f8d7da;
      color: #721c24;
    }

    .divider {
      margin: 24px 0;
    }

    .section-title {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-weight: 600;
      font-size: 16px;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      padding-top: 24px;
      border-top: 1px solid #e9ecef;
    }

    .danger-button {
      border-radius: 8px;
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0.5px;
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

      .header-actions {
        flex-direction: column;
        width: 100%;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .info-value {
        text-align: left;
      }
    }
  `]
})
export class VehiculoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehiculoService = inject(VehiculoService);
  private snackBar = inject(MatSnackBar);

  vehiculo = signal<Vehiculo | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadVehiculo();
  }

  private loadVehiculo(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.volver();
      return;
    }

    this.isLoading.set(true);
    this.vehiculoService.getVehiculoById(id).subscribe({
      next: (vehiculo) => {
        this.vehiculo.set(vehiculo);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando vehículo:', error);
        this.snackBar.open('Error al cargar el vehículo', 'Cerrar', { duration: 5000 });
        this.isLoading.set(false);
        this.volver();
      }
    });
  }

  editarVehiculo(): void {
    if (this.vehiculo()) {
      this.router.navigate(['/vehiculos', this.vehiculo()!.id, 'editar']);
    }
  }

  eliminarVehiculo(): void {
    if (this.vehiculo()) {
      if (confirm('¿Estás seguro de que deseas eliminar este vehículo? Esta acción no se puede deshacer.')) {
        this.vehiculoService.deleteVehiculo(this.vehiculo()!.id).subscribe({
          next: () => {
            this.snackBar.open('Vehículo eliminado exitosamente', 'Cerrar', { duration: 3000 });
            this.volver();
          },
          error: (error) => {
            console.error('Error eliminando vehículo:', error);
            this.snackBar.open('Error al eliminar el vehículo', 'Cerrar', { duration: 5000 });
          }
        });
      }
    }
  }

  volver(): void {
    this.router.navigate(['/vehiculos']);
  }
} 