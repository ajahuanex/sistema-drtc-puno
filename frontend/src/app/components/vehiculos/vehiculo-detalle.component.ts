import { Component, inject, signal, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { Vehiculo } from '../../models/vehiculo.model';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';

@Component({
  selector: 'app-vehiculo-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTabsModule,
    MatDialogModule,
    SmartIconComponent
  ],
  template: `
    <div class="vehiculo-detalle">
      <!-- Header -->
      <div class="detalle-header">
        <div class="header-content">
          <div class="vehiculo-principal">
            <app-smart-icon [iconName]="'directions_car'" [size]="48" class="vehiculo-icon"></app-smart-icon>
            <div class="vehiculo-info">
              <h2>{{ vehiculo().placa }}</h2>
              <p>{{ vehiculo().marca }} {{ vehiculo().modelo }} ({{ vehiculo().anioFabricacion }})</p>
              <mat-chip [class]="'estado-chip estado-' + vehiculo().estado.toLowerCase()">
                <app-smart-icon [iconName]="getIconoEstado(vehiculo().estado)" [size]="16"></app-smart-icon>
                {{ vehiculo().estado }}
              </mat-chip>
            </div>
          </div>
          <button mat-icon-button (click)="cerrar()" class="close-button">
            <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
          </button>
        </div>
      </div>

      <!-- Contenido con tabs -->
      <mat-tab-group class="detalle-tabs">
        
        <!-- Tab: Información General -->
        <mat-tab label="Información General">
          <div class="tab-content">
            <div class="info-grid">
              
              <!-- Información Básica -->
              <mat-card class="info-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon [iconName]="'info'" [size]="20"></app-smart-icon>
                    Información Básica
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="info-row">
                    <span class="info-label">Placa:</span>
                    <span class="info-value placa-destacada">{{ vehiculo().placa }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Marca:</span>
                    <span class="info-value">{{ vehiculo().marca || 'No especificada' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Modelo:</span>
                    <span class="info-value">{{ vehiculo().modelo || 'No especificado' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Año:</span>
                    <span class="info-value">{{ vehiculo().anioFabricacion }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Categoría:</span>
                    <span class="info-value">{{ vehiculo().categoria }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Sede de Registro:</span>
                    <span class="info-value">{{ vehiculo().sedeRegistro || 'PUNO' }}</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Empresa Actual -->
              <mat-card class="info-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon [iconName]="'business'" [size]="20"></app-smart-icon>
                    Empresa Actual
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  @if (empresaInfo()) {
                    <div class="empresa-detalle">
                      <div class="info-row">
                        <span class="info-label">RUC:</span>
                        <span class="info-value">{{ empresaInfo()?.ruc }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Razón Social:</span>
                        <span class="info-value">{{ empresaInfo()?.razonSocial?.principal }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Estado:</span>
                        <mat-chip class="empresa-estado">{{ empresaInfo()?.estado }}</mat-chip>
                      </div>
                    </div>
                  } @else {
                    <p class="no-data">Sin empresa asignada</p>
                  }
                </mat-card-content>
              </mat-card>

              <!-- Resolución -->
              <mat-card class="info-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon [iconName]="'description'" [size]="20"></app-smart-icon>
                    Resolución
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  @if (resolucionInfo()) {
                    <div class="resolucion-detalle">
                      <div class="info-row">
                        <span class="info-label">Número:</span>
                        <span class="info-value">{{ resolucionInfo()?.nroResolucion }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Tipo:</span>
                        <mat-chip [class]="'tipo-' + resolucionInfo()?.tipoResolucion?.toLowerCase()">
                          {{ resolucionInfo()?.tipoResolucion }}
                        </mat-chip>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Vigencia:</span>
                        <span class="info-value">
                          {{ formatearFecha(resolucionInfo()?.fechaVigenciaInicio) }} - 
                          {{ formatearFecha(resolucionInfo()?.fechaVigenciaFin) }}
                        </span>
                      </div>
                    </div>
                  } @else {
                    <p class="no-data">Sin resolución asignada</p>
                  }
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Tab: Datos Técnicos -->
        <mat-tab label="Datos Técnicos">
          <div class="tab-content">
            @if (vehiculo().datosTecnicos) {
              <div class="info-grid">
                
                <!-- Motor y Chasis -->
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>
                      <app-smart-icon [iconName]="'settings'" [size]="20"></app-smart-icon>
                      Motor y Chasis
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <span class="info-label">Motor:</span>
                      <span class="info-value">{{ vehiculo().datosTecnicos.motor || 'No especificado' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Chasis:</span>
                      <span class="info-value">{{ vehiculo().datosTecnicos.chasis || 'No especificado' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Combustible:</span>
                      <span class="info-value">{{ vehiculo().datosTecnicos.tipoCombustible || 'No especificado' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Cilindrada:</span>
                      <span class="info-value">{{ vehiculo().datosTecnicos.cilindrada || 'No especificada' }} cc</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Potencia:</span>
                      <span class="info-value">{{ vehiculo().datosTecnicos.potencia || 'No especificada' }} HP</span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Capacidad -->
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>
                      <app-smart-icon [iconName]="'airline_seat_recline_normal'" [size]="20"></app-smart-icon>
                      Capacidad
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <span class="info-label">Asientos:</span>
                      <span class="info-value">{{ vehiculo().datosTecnicos.asientos || 'No especificado' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Ejes:</span>
                      <span class="info-value">{{ vehiculo().datosTecnicos.ejes || 'No especificado' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Peso Neto:</span>
                      <span class="info-value">{{ vehiculo().datosTecnicos.pesoNeto || 'No especificado' }} kg</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Peso Bruto:</span>
                      <span class="info-value">{{ vehiculo().datosTecnicos.pesoBruto || 'No especificado' }} kg</span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Medidas -->
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>
                      <app-smart-icon [iconName]="'straighten'" [size]="20"></app-smart-icon>
                      Medidas
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @if (vehiculo().datosTecnicos.medidas) {
                      <div class="info-row">
                        <span class="info-label">Largo:</span>
                        <span class="info-value">{{ vehiculo().datosTecnicos.medidas.largo || 'No especificado' }} m</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Ancho:</span>
                        <span class="info-value">{{ vehiculo().datosTecnicos.medidas.ancho || 'No especificado' }} m</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Alto:</span>
                        <span class="info-value">{{ vehiculo().datosTecnicos.medidas.alto || 'No especificado' }} m</span>
                      </div>
                    } @else {
                      <p class="no-data">Medidas no especificadas</p>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            } @else {
              <div class="no-data-container">
                <app-smart-icon [iconName]="'info'" [size]="48" class="no-data-icon"></app-smart-icon>
                <p>No hay datos técnicos disponibles</p>
              </div>
            }
          </div>
        </mat-tab>

        <!-- Tab: TUC -->
        <mat-tab label="TUC">
          <div class="tab-content">
            @if (vehiculo().tuc) {
              <mat-card class="info-card full-width">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon [iconName]="'receipt'" [size]="20"></app-smart-icon>
                    Tarjeta Única de Circulación
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="info-row">
                    <span class="info-label">Número TUC:</span>
                    <span class="info-value tuc-numero">{{ vehiculo().tuc?.nroTuc }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Fecha de Emisión:</span>
                    <span class="info-value">{{ formatearFecha(vehiculo().tuc?.fechaEmision) }}</span>
                  </div>
                </mat-card-content>
              </mat-card>
            } @else {
              <div class="no-data-container">
                <app-smart-icon [iconName]="'receipt_long'" [size]="48" class="no-data-icon"></app-smart-icon>
                <p>No hay TUC asignado</p>
                <button mat-raised-button color="primary">
                  <app-smart-icon [iconName]="'add'" [size]="20"></app-smart-icon>
                  Asignar TUC
                </button>
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Footer con acciones -->
      <div class="detalle-footer">
        <button mat-button (click)="cerrar()">
          <app-smart-icon [iconName]="'close'" [size]="20"></app-smart-icon>
          Cerrar
        </button>
        <button mat-raised-button color="primary" (click)="editarVehiculo()">
          <app-smart-icon [iconName]="'edit'" [size]="20"></app-smart-icon>
          Editar Vehículo
        </button>
      </div>
    </div>
  `,
  styles: [`
    .vehiculo-detalle {
      max-width: 1000px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .detalle-header {
      padding: 24px;
      border-bottom: 1px solid #e0e0e0;
      background: #f5f5f5;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .vehiculo-principal {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .vehiculo-icon {
      color: #1976d2;
      font-size: 48px;
    }

    .vehiculo-info h2 {
      margin: 0;
      color: #1976d2;
      font-size: 32px;
      font-weight: 600;
    }

    .vehiculo-info p {
      margin: 8px 0;
      color: #666;
      font-size: 16px;
    }

    .close-button {
      color: #666;
    }

    .detalle-tabs {
      padding: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .info-card {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 500;
      color: #666;
      min-width: 120px;
    }

    .info-value {
      color: #333;
      text-align: right;
      flex: 1;
    }

    .placa-destacada {
      font-size: 18px;
      font-weight: 600;
      color: #1976d2;
    }

    .tuc-numero {
      font-family: monospace;
      font-size: 16px;
      font-weight: 600;
      color: #1976d2;
    }

    .estado-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 12px;
    }

    .estado-activo { background-color: #e8f5e8; color: #2e7d32; }
    .estado-inactivo { background-color: #ffebee; color: #c62828; }
    .estado-mantenimiento { background-color: #fff3e0; color: #f57c00; }
    .estado-suspendido { background-color: #f3e5f5; color: #7b1fa2; }

    .empresa-estado {
      font-size: 11px;
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .tipo-padre { background-color: #e8f5e8; color: #2e7d32; }
    .tipo-hija { background-color: #f3e5f5; color: #7b1fa2; }

    .no-data {
      color: #999;
      font-style: italic;
      text-align: center;
      padding: 16px;
    }

    .no-data-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: #999;
    }

    .no-data-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .detalle-footer {
      padding: 24px;
      border-top: 1px solid #e0e0e0;
      background: #fafafa;
      display: flex;
      justify-content: flex-end;
      gap: 16px;
    }

    @media (max-width: 768px) {
      .vehiculo-detalle {
        max-width: 100%;
      }

      .detalle-header {
        padding: 16px;
      }

      .vehiculo-principal {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .info-row {
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
export class VehiculoDetalleComponent {
  // Datos del diálogo
  private dialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<VehiculoDetalleComponent>);
  
  // Servicios
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);

  // Señales
  vehiculo = signal<Vehiculo>(this.dialogData.vehiculo);
  empresaInfo = signal<any>(null);
  resolucionInfo = signal<any>(null);

  ngOnInit(): void {
    this.cargarInformacionAdicional();
  }

  private cargarInformacionAdicional(): void {
    const vehiculo = this.vehiculo();

    // Cargar información de la empresa
    if (vehiculo.empresaActualId) {
      this.empresaService.getEmpresa(vehiculo.empresaActualId).subscribe({
        next: (empresa) => this.empresaInfo.set(empresa),
        error: (error) => console.error('Error cargando empresa:', error)
      });
    }

    // Cargar información de la resolución
    if (vehiculo.resolucionId) {
      this.resolucionService.getResolucionById(vehiculo.resolucionId).subscribe({
        next: (resolucion: any) => this.resolucionInfo.set(resolucion),
        error: (error: any) => console.error('Error cargando resolución:', error)
      });
    }
  }

  getIconoEstado(estado: string): string {
    const iconos: { [key: string]: string } = {
      'ACTIVO': 'check_circle',
      'INACTIVO': 'cancel',
      'MANTENIMIENTO': 'build',
      'SUSPENDIDO': 'pause_circle'
    };
    return iconos[estado] || 'help';
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  editarVehiculo(): void {
    this.dialogRef.close({ action: 'edit', vehiculo: this.vehiculo() });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}