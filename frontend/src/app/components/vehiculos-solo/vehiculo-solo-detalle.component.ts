import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { VehiculoSoloService } from '../../services/vehiculo-solo.service';

@Component({
  selector: 'app-vehiculo-solo-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <div class="container">
      @if (loading()) {
        <div class="loading">
          <mat-spinner></mat-spinner>
          <p>Cargando...</p>
        </div>
      } @else if (vehiculo()) {
        <!-- Header Card -->
        <mat-card class="header-card">
          <mat-card-content>
            <div class="header-content">
              <div class="placa-section">
                <mat-icon class="placa-icon">directions_car</mat-icon>
                <div>
                  <h1 class="placa-title">{{ vehiculo().placa_actual }}</h1>
                  <p class="placa-subtitle">{{ vehiculo().marca }} {{ vehiculo().modelo }} - {{ vehiculo().anio_fabricacion || 'Año N/D' }}</p>
                </div>
              </div>
              <div class="actions-section">
                <button mat-raised-button color="primary" (click)="editar()">
                  <mat-icon>edit</mat-icon>
                  Editar
                </button>
                <button mat-button (click)="volver()">
                  <mat-icon>arrow_back</mat-icon>
                  Volver
                </button>
              </div>
            </div>
            @if (vehiculo().porcentaje_completitud !== undefined) {
              <div class="completitud-bar">
                <div class="completitud-progress" 
                     [style.width.%]="vehiculo().porcentaje_completitud"
                     [class.low]="vehiculo().porcentaje_completitud < 50"
                     [class.medium]="vehiculo().porcentaje_completitud >= 50 && vehiculo().porcentaje_completitud < 80"
                     [class.high]="vehiculo().porcentaje_completitud >= 80">
                </div>
                <span class="completitud-text">{{ vehiculo().porcentaje_completitud }}% completado</span>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Main Content Card -->
        <mat-card class="content-card">
          <mat-card-content>
            <div class="sections-grid">
              <!-- Identificación -->
              <div class="section">
                <div class="section-header">
                  <mat-icon>badge</mat-icon>
                  <h3>Identificación</h3>
                </div>
                <div class="section-content">
                  <div class="data-item">
                    <span class="label">Placa</span>
                    <span class="value highlight">{{ vehiculo().placa_actual }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">VIN</span>
                    <span class="value">{{ vehiculo().vin || '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Número de Motor</span>
                    <span class="value">{{ vehiculo().numero_motor || '-' }}</span>
                  </div>
                </div>
              </div>

              <!-- Datos Técnicos -->
              <div class="section">
                <div class="section-header">
                  <mat-icon>build</mat-icon>
                  <h3>Datos Técnicos</h3>
                </div>
                <div class="section-content">
                  <div class="data-item">
                    <span class="label">Marca</span>
                    <span class="value">{{ vehiculo().marca || '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Modelo</span>
                    <span class="value">{{ vehiculo().modelo || '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Año</span>
                    <span class="value">{{ vehiculo().anio_fabricacion || '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Color</span>
                    <span class="value">{{ vehiculo().color || '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Categoría</span>
                    <span class="value badge">{{ vehiculo().categoria || '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Carrocería</span>
                    <span class="value">{{ vehiculo().tipo_carroceria || vehiculo().carroceria || '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Combustible</span>
                    <span class="value">{{ vehiculo().combustible || '-' }}</span>
                  </div>
                </div>
              </div>

              <!-- Capacidades -->
              <div class="section">
                <div class="section-header">
                  <mat-icon>airline_seat_recline_normal</mat-icon>
                  <h3>Capacidades</h3>
                </div>
                <div class="section-content">
                  <div class="data-item">
                    <span class="label">Asientos</span>
                    <span class="value">{{ vehiculo().numero_asientos || '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Pasajeros</span>
                    <span class="value">{{ vehiculo().numero_pasajeros || '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Cilindrada</span>
                    <span class="value">{{ vehiculo().cilindrada ? vehiculo().cilindrada + ' cc' : '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Ejes</span>
                    <span class="value">{{ vehiculo().numero_ejes || '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Ruedas</span>
                    <span class="value">{{ vehiculo().numero_ruedas || '-' }}</span>
                  </div>
                </div>
              </div>

              <!-- Pesos y Dimensiones -->
              <div class="section">
                <div class="section-header">
                  <mat-icon>straighten</mat-icon>
                  <h3>Pesos y Dimensiones</h3>
                </div>
                <div class="section-content">
                  <div class="data-item">
                    <span class="label">Peso Bruto</span>
                    <span class="value">{{ vehiculo().peso_bruto ? vehiculo().peso_bruto + ' kg' : '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Peso Neto</span>
                    <span class="value">{{ vehiculo().peso_seco ? vehiculo().peso_seco + ' kg' : '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Carga Útil</span>
                    <span class="value">{{ vehiculo().carga_util ? vehiculo().carga_util + ' kg' : '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Largo</span>
                    <span class="value">{{ vehiculo().longitud ? vehiculo().longitud + ' m' : '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Ancho</span>
                    <span class="value">{{ vehiculo().ancho ? vehiculo().ancho + ' m' : '-' }}</span>
                  </div>
                  <div class="data-item">
                    <span class="label">Alto</span>
                    <span class="value">{{ vehiculo().altura ? vehiculo().altura + ' m' : '-' }}</span>
                  </div>
                </div>
              </div>

              <!-- Observaciones -->
              @if (vehiculo().observaciones) {
                <div class="section full-width">
                  <div class="section-header">
                    <mat-icon>notes</mat-icon>
                    <h3>Observaciones</h3>
                  </div>
                  <div class="section-content">
                    <p class="observaciones-text">{{ vehiculo().observaciones }}</p>
                  </div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px;
      gap: 20px;
    }

    /* Header Card */
    .header-card {
      margin-bottom: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .header-card mat-card-content {
      padding: 20px !important;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;
    }

    .placa-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .placa-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: white;
    }

    .placa-title {
      margin: 0;
      font-size: 1.8em;
      font-weight: 700;
      color: white;
    }

    .placa-subtitle {
      margin: 4px 0 0 0;
      font-size: 1em;
      opacity: 0.9;
      color: white;
    }

    .actions-section {
      display: flex;
      gap: 10px;
    }

    .completitud-bar {
      position: relative;
      height: 28px;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      overflow: hidden;
    }

    .completitud-progress {
      height: 100%;
      transition: width 0.5s ease;
      border-radius: 14px;
    }

    .completitud-progress.low {
      background-color: #f44336;
    }

    .completitud-progress.medium {
      background-color: #ff9800;
    }

    .completitud-progress.high {
      background-color: #4caf50;
    }

    .completitud-text {
      position: absolute;
      top: 50%;
      left: 12px;
      transform: translateY(-50%);
      font-weight: 600;
      font-size: 0.85em;
      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }

    /* Content Card */
    .content-card {
      background: white;
    }

    .sections-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .section {
      border-left: 3px solid #1976d2;
      padding-left: 16px;
    }

    .section.full-width {
      grid-column: 1 / -1;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .section-header mat-icon {
      color: #1976d2;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1em;
      font-weight: 600;
      color: #333;
    }

    .section-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .data-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .data-item:last-child {
      border-bottom: none;
    }

    .data-item .label {
      font-size: 0.85em;
      color: #666;
      font-weight: 500;
    }

    .data-item .value {
      font-size: 0.95em;
      color: #333;
      font-weight: 600;
      text-align: right;
    }

    .data-item .value.highlight {
      color: #1976d2;
      font-size: 1.1em;
    }

    .data-item .value.badge {
      background-color: #1976d2;
      color: white;
      padding: 3px 10px;
      border-radius: 10px;
      font-size: 0.8em;
    }

    .observaciones-text {
      margin: 0;
      line-height: 1.6;
      color: #555;
      white-space: pre-wrap;
      font-size: 0.95em;
    }

    @media (max-width: 768px) {
      .sections-grid {
        grid-template-columns: 1fr;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .actions-section {
        width: 100%;
      }

      .actions-section button {
        flex: 1;
      }
    }
  `]
})
export class VehiculoSoloDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehiculoService = inject(VehiculoSoloService);

  loading = signal<boolean>(false);
  vehiculo = signal<any>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarVehiculo(id);
    }
  }

  cargarVehiculo(id: string): void {
    this.loading.set(true);
    this.vehiculoService.obtenerVehiculoPorId(id).subscribe({
      next: (vehiculo) => {
        console.log('Vehículo cargado:', vehiculo);
        this.vehiculo.set(vehiculo);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando vehículo:', error);
        this.loading.set(false);
        this.router.navigate(['/vehiculos-solo']);
      }
    });
  }

  editar(): void {
    // Usar el ID de la URL directamente
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      console.log('Navegando a editar con ID de URL:', id);
      this.router.navigate(['/vehiculos-solo/editar', id]);
    } else {
      console.error('No se encontró el ID en la URL');
      alert('Error: No se pudo obtener el ID del vehículo');
    }
  }

  volver(): void {
    this.router.navigate(['/vehiculos-solo']);
  }
}
