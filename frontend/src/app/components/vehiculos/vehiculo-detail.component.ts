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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VehiculoService } from '../../services/vehiculo.service';
import { SolicitudBajaService } from '../../services/solicitud-baja.service';
import { Vehiculo, EstadoVehiculo, ESTADOS_VEHICULO_LABELS, isVehiculoHabilitado, isVehiculoBaja } from '../../models/vehiculo.model';
import { SolicitudBajaCreate, MotivoBaja } from '../../models/solicitud-baja.model';
import { TransferirVehiculoModalComponent, TransferirVehiculoData } from './transferir-vehiculo-modal.component';
import { SolicitarBajaModalComponent } from './solicitar-baja-modal.component';

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
    MatChipsModule,
    MatDialogModule
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
        <button mat-raised-button color="primary" (click)="verHistorial()" class="action-button">
          <mat-icon>history</mat-icon>
          Ver Historial
        </button>
        <button mat-raised-button color="accent" (click)="transferirVehiculo()" class="action-button">
          <mat-icon>swap_horiz</mat-icon>
          Transferir Empresa
        </button>
        <button mat-raised-button color="warn" (click)="solicitarBajaVehiculo()" class="action-button">
          <mat-icon>remove_circle</mat-icon>
          Solicitar Baja
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
                <span class="info-value highlight">{{ vehiculo()?.placa }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Marca:</span>
                <span class="info-value">{{ vehiculo()?.marca || 'No especificada' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Modelo:</span>
                <span class="info-value">{{ vehiculo()?.modelo || 'No especificado' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Año:</span>
                <span class="info-value">{{ vehiculo()?.anioFabricacion || 'No especificado' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Color:</span>
                <span class="info-value">{{ vehiculo()?.color || 'No especificado' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Categoría:</span>
                <span class="info-value">{{ vehiculo()?.categoria || 'No especificada' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Estado:</span>
                <mat-chip class="status-chip" [class]="getEstadoClass(vehiculo())">
                  {{ getEstadoDisplay(vehiculo()) }}
                </mat-chip>
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
      align-items: flex-start;
      margin-bottom: 24px;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      flex: 1;
    }

    .header-title h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
    }

    .header-subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .action-button, .secondary-button {
      border-radius: 8px;
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0.5px;
    }

    .content-section {
      padding: 0 24px;
    }

    .loading-container, .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .loading-content, .error-content {
      text-align: center;
      max-width: 400px;
    }

    .loading-spinner {
      margin-bottom: 24px;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .details-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .detail-card {
      margin-bottom: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .detail-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #2c3e50;
      font-size: 18px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-label {
      font-weight: 600;
      color: #555;
      font-size: 14px;
    }

    .info-value {
      font-size: 14px;
      color: #333;
    }

    .info-value.highlight {
      font-weight: 600;
      color: #2196f3;
      font-size: 16px;
    }

    .status-chip {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-habilitado {
      background: #e8f5e8;
      color: #2e7d32;
      font-weight: 700;
    }

    .status-baja {
      background: #fce4ec;
      color: #c2185b;
      font-weight: 600;
    }

    .status-baja_de_oficio {
      background: #ffebee;
      color: #d32f2f;
      font-weight: 700;
      border: 2px solid #d32f2f;
    }

    .status-baja_definitiva {
      background: #f3e5f5;
      color: #7b1fa2;
      font-weight: 700;
      border: 2px solid #7b1fa2;
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
  private solicitudBajaService = inject(SolicitudBajaService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

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
    this.vehiculoService.getVehiculo(id).subscribe({
      next: (vehiculo) => {
        this.vehiculo.set(vehiculo);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error cargando vehículo:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error al cargar el vehículo', 'Cerrar', { duration: 3000 });
        this.volver();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/vehiculos']);
  }

  editarVehiculo(): void {
    if (this.vehiculo()) {
      this.router.navigate(['/vehiculos', this.vehiculo()!.id, 'editar']);
    }
  }

  verHistorial(): void {
    if (this.vehiculo()) {
      this.router.navigate(['/vehiculos', this.vehiculo()!.id, 'historial']);
    }
  }

  transferirVehiculo(): void {
    if (this.vehiculo()) {
      const dialogRef = this.dialog.open(TransferirVehiculoModalComponent, {
        width: '800px',
        maxHeight: '85vh',
        data: { vehiculo: this.vehiculo() } as TransferirVehiculoData,
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        if (result?.success) {
          console.log('✅ Transferencia exitosa:', result.transferencia);
          this.snackBar.open('Vehículo transferido exitosamente', 'Cerrar', { duration: 3000 });
          this.loadVehiculo();
        }
      });
    }
  }

  solicitarBajaVehiculo(): void {
    if (this.vehiculo()) {
      const dialogRef = this.dialog.open(SolicitarBajaModalComponent, {
        width: '700px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        data: { vehiculo: this.vehiculo() },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        if (result) {
          const solicitudBaja: SolicitudBajaCreate = {
            vehiculoId: this.vehiculo()!.id,
            motivo: result.motivo as MotivoBaja,
            descripcion: result.descripcion,
            fechaSolicitud: result.fechaSolicitud.toISOString()
          };

          this.solicitudBajaService.crearSolicitudBaja(solicitudBaja).subscribe({
            next: (solicitudCreada: any) => {
              this.snackBar.open(
                `Solicitud de baja enviada exitosamente para el vehículo ${this.vehiculo()!.placa}`,
                'Cerrar',
                { 
                  duration: 5000,
                  panelClass: ['snackbar-success']
                }
              );
            },
            error: (error: any) => {
              console.error('Error creando solicitud de baja:', error);
              
              let mensaje = 'Error al enviar la solicitud de baja';
              
              if (error.status === 422) {
                mensaje = 'No se puede solicitar la baja de este vehículo. Verifique que no tenga procesos pendientes.';
              } else if (error.status === 409) {
                mensaje = 'Ya existe una solicitud de baja pendiente para este vehículo.';
              } else if (error.status === 403) {
                mensaje = 'No tienes permisos para solicitar la baja de este vehículo.';
              } else if (error.status === 0) {
                mensaje = 'Error de conexión. Verifica tu conexión a internet.';
              }
              
              this.snackBar.open(mensaje, 'Cerrar', { 
                duration: 5000,
                panelClass: ['snackbar-error']
              });
            }
          });
        }
      });
    }
  }

  eliminarVehiculo(): void {
    if (this.vehiculo()) {
      if (confirm(
        `¿Estás seguro de que deseas eliminar el vehículo ${this.vehiculo()?.placa}?\n\n` +
        `El vehículo será marcado como eliminado pero se mantendrá en el sistema para fines de auditoría.`
      )) {
        this.vehiculoService.deleteVehiculo(this.vehiculo()!.id).subscribe({
          next: () => {
            this.snackBar.open('Vehículo eliminado exitosamente', 'Cerrar', { duration: 3000 });
            this.volver();
          },
          error: (error: any) => {
            console.error('Error eliminando vehículo:', error);
            this.snackBar.open('Error al eliminar el vehículo', 'Cerrar', { duration: 3000 });
          }
        });
      }
    }
  }

  // Funciones helper para mostrar el estado del vehículo
  getEstadoDisplay(vehiculo: Vehiculo | null): string {
    if (!vehiculo) return '';
    
    return ESTADOS_VEHICULO_LABELS[vehiculo.estado as EstadoVehiculo] || vehiculo.estado || 'Sin Estado';
  }

  getEstadoClass(vehiculo: Vehiculo | null): string {
    if (!vehiculo) return '';
    
    return `status-${vehiculo.estado?.toLowerCase()}` || '';
  }
}