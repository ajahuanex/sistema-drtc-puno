import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { ResolucionService } from '../../services/resolucion.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { Resolucion } from '../../models/resolucion.model';
import { Vehiculo } from '../../models/vehiculo.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface VehiculosHabilitadosModalData {
  resolucion: Resolucion;
}

@Component({
  selector: 'app-vehiculos-habilitados-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    SmartIconComponent
  ],
  template: `
    <div class="vehiculos-modal">
      <!-- Header del modal -->
      <div class="modal-header">
        <div class="header-content">
          <div class="header-title">
            <app-smart-icon iconName="directions_car" [size]="32" class="header-icon"></app-smart-icon>
            <div class="title-info">
              <h2>Vehículos Habilitados</h2>
              <p class="subtitle">{{ data.resolucion.nroResolucion }}</p>
            </div>
          </div>
          <button mat-icon-button (click)="cerrar()" class="close-button">
            <app-smart-icon iconName="close" [size]="24"></app-smart-icon>
          </button>
        </div>
      </div>

      <!-- Información de la resolución -->
      <div class="resolucion-info">
        <mat-card class="info-card">
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Tipo de Resolución:</span>
                <mat-chip-set>
                  <mat-chip [class]="'tipo-' + data.resolucion.tipoResolucion.toLowerCase()">
                    <app-smart-icon 
                      [iconName]="data.resolucion.tipoResolucion === 'PADRE' ? 'account_tree' : 'subdirectory_arrow_right'" 
                      [size]="16">
                    </app-smart-icon>
                    {{ data.resolucion.tipoResolucion }}
                  </mat-chip>
                </mat-chip-set>
              </div>
              
              <div class="info-item">
                <span class="info-label">Total de Vehículos:</span>
                <span class="info-value">{{ (vehiculosHabilitados())?.length || 0 }}</span>
              </div>
              
              @if (data.resolucion.tipoResolucion === 'HIJO' && data.resolucion.resolucionPadreId) {
                <div class="info-item herencia">
                  <app-smart-icon iconName="info" [size]="16" class="info-icon"></app-smart-icon>
                  <span class="herencia-text">
                    Esta resolución hereda vehículos de su resolución padre
                  </span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Loading state -->
      @if (cargando()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando vehículos habilitados...</p>
        </div>
      }

      <!-- Lista de vehículos -->
      @if (!cargando() && vehiculosHabilitados().length > 0) {
        <div class="vehiculos-container">
          <div class="vehiculos-header">
            <h3>
              <app-smart-icon iconName="directions_car" [size]="20"></app-smart-icon>
              Vehículos Habilitados ({{ (vehiculosHabilitados())?.length || 0 }})
            </h3>
          </div>
          
          <div class="vehiculos-grid">
            @for (vehiculo of vehiculosHabilitados(); track vehiculo.id) {
              <mat-card class="vehiculo-card">
                <mat-card-content>
                  <div class="vehiculo-header">
                    <div class="vehiculo-placa">
                      <app-smart-icon iconName="directions_car" [size]="20" class="placa-icon"></app-smart-icon>
                      <span class="placa-text">{{ vehiculo.placa }}</span>
                    </div>
                    <div class="vehiculo-estado" [class]="'estado-' + vehiculo.estado.toLowerCase()">
                      <app-smart-icon [iconName]="getEstadoIcon(vehiculo.estado)" [size]="16"></app-smart-icon>
                      <span>{{ vehiculo.estado }}</span>
                    </div>
                  </div>
                  
                  <div class="vehiculo-details">
                    @if (vehiculo.marca || vehiculo.modelo) {
                      <div class="detail-item">
                        <app-smart-icon iconName="branding_watermark" [size]="14"></app-smart-icon>
                        <span>{{ vehiculo.marca || 'Sin marca' }} {{ vehiculo.modelo || '' }}</span>
                      </div>
                    }
                    
                    @if (vehiculo.anioFabricacion) {
                      <div class="detail-item">
                        <app-smart-icon iconName="calendar_today" [size]="14"></app-smart-icon>
                        <span>{{ vehiculo.anioFabricacion }}</span>
                      </div>
                    }
                    
                    @if (vehiculo.datosTecnicos?.asientos) {
                      <div class="detail-item">
                        <app-smart-icon iconName="airline_seat_recline_normal" [size]="14"></app-smart-icon>
                        <span>{{ vehiculo.datosTecnicos?.asientos }} asientos</span>
                      </div>
                    }
                    
                    @if (vehiculo.tuc?.nroTuc) {
                      <div class="detail-item">
                        <app-smart-icon iconName="receipt" [size]="14"></app-smart-icon>
                        <span>{{ vehiculo.tuc?.nroTuc }}</span>
                      </div>
                    }
                  </div>
                  
                  <!-- Información de rutas específicas si las tiene -->
                  @if (tieneRutasEspecificas(vehiculo)) {
                    <mat-divider class="divider"></mat-divider>
                    <div class="rutas-especificas">
                      <div class="rutas-especificas-header">
                        <app-smart-icon iconName="route" [size]="14"></app-smart-icon>
                        <span>Rutas Específicas</span>
                      </div>
                      <div class="rutas-count">
                        {{ contarRutasEspecificas(vehiculo) }} configuradas
                      </div>
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            }
          </div>
        </div>
      }

      <!-- Estado sin vehículos -->
      @if (!cargando() && vehiculosHabilitados().length === 0) {
        <div class="empty-state">
          <app-smart-icon iconName="directions_car_filled" [size]="64" class="empty-icon"></app-smart-icon>
          <h3>Sin vehículos habilitados</h3>
          <p>Esta resolución no tiene vehículos habilitados asociados.</p>
        </div>
      }

      <!-- Acciones del modal -->
      <div class="modal-actions">
        <button mat-button (click)="cerrar()">
          <app-smart-icon iconName="close" [size]="20"></app-smart-icon>
          Cerrar
        </button>
        
        @if (vehiculosHabilitados().length > 0) {
          <button mat-raised-button color="primary" (click)="gestionarVehiculos()">
            <app-smart-icon iconName="settings" [size]="20"></app-smart-icon>
            Gestionar Vehículos
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .vehiculos-modal {
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 24px;
      border-bottom: 1px solid #e0e0e0;
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
      color: white;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .title-info h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .subtitle {
      margin: 4px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .close-button {
      color: white;
    }

    .resolucion-info {
      padding: 16px 24px;
      background-color: #f8f9fa;
    }

    .info-card {
      box-shadow: none;
      border: 1px solid #e0e0e0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      align-items: center;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item.herencia {
      grid-column: 1 / -1;
      flex-direction: row;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }

    .info-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .herencia-text {
      font-size: 14px;
      color: #1976d2;
    }

    .info-icon {
      color: #2196f3;
    }

    .tipo-padre {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .tipo-hijo {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }

    .vehiculos-container {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    .vehiculos-header {
      margin-bottom: 20px;
    }

    .vehiculos-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #333;
      font-weight: 600;
    }

    .vehiculos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .vehiculo-card {
      border: 1px solid #e0e0e0;
      transition: all 0.2s ease;
    }

    .vehiculo-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .vehiculo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .vehiculo-placa {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .placa-text {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .placa-icon {
      color: #4caf50;
    }

    .vehiculo-estado {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .estado-activo {
      background-color: #e8f5e8;
      color: #388e3c;
    }

    .estado-inactivo {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .estado-mantenimiento {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .estado-suspendido {
      background-color: #fce4ec;
      color: #c2185b;
    }

    .vehiculo-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #666;
    }

    .divider {
      margin: 12px 0;
    }

    .rutas-especificas {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background-color: #f8f9fa;
      border-radius: 6px;
    }

    .rutas-especificas-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .rutas-count {
      font-size: 11px;
      color: #1976d2;
      font-weight: 600;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .empty-state h3 {
      margin: 16px 0 8px 0;
      color: #666;
    }

    .empty-state p {
      margin: 0;
      color: #999;
    }

    .empty-icon {
      color: #ccc;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      background-color: #fafafa;
    }

    .modal-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .vehiculos-modal {
        max-width: 100%;
        max-height: 100vh;
      }

      .modal-header {
        padding: 16px;
      }

      .header-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .title-info h2 {
        font-size: 20px;
      }

      .vehiculos-container {
        padding: 16px;
      }

      .vehiculos-grid {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .modal-actions {
        flex-direction: column;
        padding: 12px 16px;
      }

      .modal-actions button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class VehiculosHabilitadosModalComponent {
  data = inject<VehiculosHabilitadosModalData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<VehiculosHabilitadosModalComponent>);
  private resolucionService = inject(ResolucionService);
  private vehiculoService = inject(VehiculoService);

  // Señales para el estado del componente
  cargando = signal(false);
  vehiculosHabilitados = signal<Vehiculo[]>([]);

  constructor() {
    this.cargarVehiculosHabilitados();
  }

  /**
   * Carga los vehículos habilitados de la resolución
   */
  private cargarVehiculosHabilitados(): void {
    if (!this.data.resolucion.vehiculosHabilitadosIds || this.data.resolucion.vehiculosHabilitadosIds.length === 0) {
      this.vehiculosHabilitados.set([]);
      return;
    }

    this.cargando.set(true);

    // Obtener información detallada de cada vehículo
    const vehiculosObservables = this.data.resolucion.vehiculosHabilitadosIds.map(vehiculoId =>
      this.vehiculoService.getVehiculo(vehiculoId).pipe(
        catchError(error => {
          console.error(`Error cargando vehículo ${vehiculoId}:`, error);
          return of(null);
        })
      )
    );

    forkJoin(vehiculosObservables).subscribe({
      next: (vehiculos) => {
        // Filtrar vehículos nulos (errores de carga)
        const vehiculosValidos = vehiculos.filter(v => v !== null) as Vehiculo[];
        this.vehiculosHabilitados.set(vehiculosValidos);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando vehículos habilitados::', error);
        this.vehiculosHabilitados.set([]);
        this.cargando.set(false);
      }
    });
  }

  /**
   * Obtiene el ícono según el estado del vehículo
   */
  getEstadoIcon(estado: string): string {
    switch (estado.toUpperCase()) {
      case 'ACTIVO':
        return 'check_circle';
      case 'INACTIVO':
        return 'cancel';
      case 'MANTENIMIENTO':
        return 'build';
      case 'SUSPENDIDO':
        return 'pause_circle';
      default:
        return 'help';
    }
  }

  /**
   * Verifica si un vehículo tiene rutas específicas configuradas
   */
  tieneRutasEspecificas(vehiculo: Vehiculo): boolean {
    // Aquí podrías hacer una consulta al servicio de rutas específicas
    // Por ahora, simulamos que algunos vehículos tienen rutas específicas
    return Math.random() > 0.5; // Simulación temporal
  }

  /**
   * Cuenta las rutas específicas de un vehículo
   */
  contarRutasEspecificas(vehiculo: Vehiculo): number {
    // Simulación temporal - en producción consultarías el servicio real
    return Math.floor(Math.random() * 5) + 1;
  }

  /**
   * Abre la gestión de vehículos
   */
  gestionarVehiculos(): void {
    this.dialogRef.close({
      accion: 'gestionar',
      resolucion: this.data.resolucion
    });
  }

  /**
   * Cierra el modal
   */
  cerrar(): void {
    this.dialogRef.close();
  }
}