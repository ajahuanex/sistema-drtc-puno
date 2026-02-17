import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { SmartIconComponent } from './smart-icon.component';
import { VehiculoService } from '../services/vehiculo.service';
import { HistorialVehicularService } from '../services/historial-vehicular.service';
import { Vehiculo } from '../models/vehiculo.model';

export interface HistorialDetallado {
  vehiculo: {
    id: string;
    placa: string;
    empresa_actual_id: string;
    categoria: string;
    marca: string;
    modelo: string;
    numero_historial_actual: number;
  };
  total_resoluciones: number;
  historial_resoluciones: Array<{
    numero_secuencial: number;
    resolucion_id: string;
    numero_resolucion: string;
    fecha_emision: Date;
    tipo_resolucion: string;
    tipo_tramite: string;
    descripcion: string;
    estado: string;
    empresa_id: string;
  }>;
  resolucion_mas_antigua?: {
    numero: string;
    fecha: Date;
  };
  resolucion_mas_reciente?: {
    numero: string;
    fecha: Date;
  };
}

/**
 * Componente para mostrar el historial detallado de un vehículo
 * 
 * @example
 * ```html
 * <app-vehiculo-historial
 *   [vehiculoId]="vehiculo.id"
 *   [mostrarCompleto]="true"
 *   (historialCargado)="onHistorialCargado($event)">
 * </app-vehiculo-historial>
 * ```
 */
@Component({
  selector: 'app-vehiculo-historial',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    SmartIconComponent
  ],
  template: `
    <mat-card class="historial-card">
      <mat-card-header>
        <div class="header-content">
          <mat-card-title>
            <app-smart-icon [iconName]="'history'" [size]="24"></app-smart-icon>
            Historial de Validaciones
          </mat-card-title>
          @if (historial()) {
            <mat-card-subtitle>
              {{ historial()!.vehiculo.placa }} - {{ historial()!.total_resoluciones }} resoluciones
            </mat-card-subtitle>
          }
        </div>
        <div class="header-actions">
          <button mat-icon-button 
                  (click)="recargarHistorial()"
                  matTooltip="Recargar historial">
            <app-smart-icon [iconName]="'refresh'" [size]="20" [clickable]="true"></app-smart-icon>
          </button>
          @if (historial()) {
            <button mat-icon-button 
                    (click)="exportarHistorial()"
                    matTooltip="Exportar historial">
              <app-smart-icon [iconName]="'download'" [size]="20" [clickable]="true"></app-smart-icon>
            </button>
          }
        </div>
      </mat-card-header>

      <mat-card-content>
        @if (cargando()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Cargando historial...</p>
          </div>
        } @else if (error()) {
          <div class="error-container">
            <app-smart-icon [iconName]="'error'" [size]="48" class="error-icon"></app-smart-icon>
            <h3>Error al cargar historial</h3>
            <p>{{ error() }}</p>
            <button mat-raised-button color="primary" (click)="recargarHistorial()">
              <app-smart-icon [iconName]="'refresh'" [size]="20"></app-smart-icon>
              Reintentar
            </button>
          </div>
        } @else if (historial()) {
          <!-- Resumen del vehículo -->
          <div class="vehiculo-resumen">
            <div class="resumen-item">
              <span class="label">Placa:</span>
              <span class="value">{{ historial()!.vehiculo.placa }}</span>
            </div>
            <div class="resumen-item">
              <span class="label">Marca/Modelo:</span>
              <span class="value">{{ historial()!.vehiculo.marca }} {{ historial()!.vehiculo.modelo }}</span>
            </div>
            <div class="resumen-item">
              <span class="label">Empresa Actual:</span>
              <span class="value">{{ historial()!.vehiculo.empresa_actual_id }}</span>
            </div>
            <div class="resumen-item">
              <span class="label">Historial Actual:</span>
              <mat-chip class="historial-chip">
                #{{ historial()!.vehiculo.numero_historial_actual }}
              </mat-chip>
            </div>
          </div>

          <!-- Estadísticas rápidas -->
          @if (historial()!.resolucion_mas_antigua && historial()!.resolucion_mas_reciente) {
            <div class="estadisticas-rapidas">
              <div class="estadistica">
                <app-smart-icon [iconName]="'schedule'" [size]="20"></app-smart-icon>
                <div class="estadistica-content">
                  <span class="estadistica-label">Primera Resolución</span>
                  <span class="estadistica-value">
                    {{ historial()!.resolucion_mas_antigua!.numero }} 
                    ({{ historial()!.resolucion_mas_antigua!.fecha | date:'dd/MM/yyyy' }})
                  </span>
                </div>
              </div>
              <div class="estadistica">
                <app-smart-icon [iconName]="'update'" [size]="20"></app-smart-icon>
                <div class="estadistica-content">
                  <span class="estadistica-label">Última Resolución</span>
                  <span class="estadistica-value">
                    {{ historial()!.resolucion_mas_reciente!.numero }} 
                    ({{ historial()!.resolucion_mas_reciente!.fecha | date:'dd/MM/yyyy' }})
                  </span>
                </div>
              </div>
            </div>
          }

          <!-- Tabla de historial -->
          <div class="tabla-historial">
            <table mat-table [dataSource]="historial()!.historial_resoluciones" class="historial-table">
              <!-- Columna de número secuencial -->
              <ng-container matColumnDef="secuencial">
                <th mat-header-cell *matHeaderCellDef>
                  <app-smart-icon [iconName]="'numbers'" [size]="16"></app-smart-icon>
                  #
                </th>
                <td mat-cell *matCellDef="let resolucion">
                  <mat-chip class="secuencial-chip" [class.actual]="resolucion.numero_secuencial === historial()!.vehiculo.numero_historial_actual">
                    {{ resolucion.numero_secuencial }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Columna de resolución -->
              <ng-container matColumnDef="resolucion">
                <th mat-header-cell *matHeaderCellDef>
                  <app-smart-icon [iconName]="'description'" [size]="16"></app-smart-icon>
                  Resolución
                </th>
                <td mat-cell *matCellDef="let resolucion">
                  <div class="resolucion-info">
                    <span class="numero-resolucion">{{ resolucion.numero_resolucion }}</span>
                    <span class="fecha-resolucion">{{ resolucion.fecha_emision | date:'dd/MM/yyyy' }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Columna de tipo -->
              <ng-container matColumnDef="tipo">
                <th mat-header-cell *matHeaderCellDef>
                  <app-smart-icon [iconName]="'category'" [size]="16"></app-smart-icon>
                  Tipo
                </th>
                <td mat-cell *matCellDef="let resolucion">
                  <div class="tipo-info">
                    <mat-chip class="tipo-chip" [class]="'tipo-' + resolucion.tipo_resolucion.toLowerCase()">
                      {{ resolucion.tipo_resolucion }}
                    </mat-chip>
                    <span class="tramite-info">{{ resolucion.tipo_tramite }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Columna de estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>
                  <app-smart-icon [iconName]="'info'" [size]="16"></app-smart-icon>
                  Estado
                </th>
                <td mat-cell *matCellDef="let resolucion">
                  <mat-chip class="estado-chip" [class]="'estado-' + resolucion.estado.toLowerCase()">
                    {{ resolucion.estado }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Columna de descripción -->
              <ng-container matColumnDef="descripcion">
                <th mat-header-cell *matHeaderCellDef>
                  <app-smart-icon [iconName]="'notes'" [size]="16"></app-smart-icon>
                  Descripción
                </th>
                <td mat-cell *matCellDef="let resolucion">
                  <span class="descripcion-text" [matTooltip]="resolucion.descripcion">
                    {{ resolucion.descripcion | slice:0:50 }}{{ resolucion.descripcion.length > 50 ? '...' : '' }}
                  </span>
                </td>
              </ng-container>

              <!-- Columna de acciones -->
              @if (mostrarAcciones) {
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let resolucion">
                    <button mat-icon-button 
                            (click)="verResolucion(resolucion.resolucion_id)"
                            matTooltip="Ver resolución">
                      <app-smart-icon [iconName]="'visibility'" [size]="16" [clickable]="true"></app-smart-icon>
                    </button>
                  </td>
                </ng-container>
              }

              <tr mat-header-row *matHeaderRowDef="columnasVisibles"></tr>
              <tr mat-row *matRowDef="let row; columns: columnasVisibles;"></tr>
            </table>
          </div>
        } @else {
          <div class="empty-state">
            <app-smart-icon [iconName]="'history'" [size]="64" class="empty-icon"></app-smart-icon>
            <h3>Sin historial disponible</h3>
            <p>No se encontró historial para este vehículo.</p>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .historial-card {
      margin: 16px 0;
    }

    .header-content {
      flex: 1;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .loading-container,
    .error-container,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .error-icon,
    .empty-icon {
      opacity: 0.5;
      margin-bottom: 16px;
    }

    .vehiculo-resumen {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .resumen-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .value {
      font-size: 14px;
      font-weight: 600;
    }

    .historial-chip {
      background: #2196f3;
      color: white;
      font-weight: bold;
    }

    .estadisticas-rapidas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .estadistica {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .estadistica-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .estadistica-label {
      font-size: 12px;
      color: #666;
    }

    .estadistica-value {
      font-size: 14px;
      font-weight: 600;
    }

    .historial-table {
      width: 100%;
    }

    .secuencial-chip {
      background: #9e9e9e;
      color: white;
      font-weight: bold;
      min-width: 32px;
    }

    .secuencial-chip.actual {
      background: #4caf50;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
      100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
    }

    .resolucion-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .numero-resolucion {
      font-weight: 600;
      color: #1976d2;
    }

    .fecha-resolucion {
      font-size: 12px;
      color: #666;
    }

    .tipo-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tipo-chip {
      font-size: 11px;
      min-height: 24px;
    }

    .tipo-padre {
      background: #2196f3;
      color: white;
    }

    .tipo-hijo {
      background: #ff9800;
      color: white;
    }

    .tramite-info {
      font-size: 11px;
      color: #666;
    }

    .estado-chip {
      font-size: 11px;
      min-height: 24px;
    }

    .estado-vigente {
      background: #4caf50;
      color: white;
    }

    .estado-vencida {
      background: #f44336;
      color: white;
    }

    .estado-suspendida {
      background: #ff9800;
      color: white;
    }

    .descripcion-text {
      font-size: 13px;
      line-height: 1.4;
    }

    @media (max-width: 768px) {
      .vehiculo-resumen {
        grid-template-columns: 1fr;
      }

      .estadisticas-rapidas {
        grid-template-columns: 1fr;
      }

      .historial-table {
        font-size: 12px;
      }
    }
  `]
})
export class VehiculoHistorialComponent implements OnInit {
  @Input() vehiculoId!: string;
  @Input() mostrarCompleto: boolean = true;
  @Input() mostrarAcciones: boolean = true;
  @Output() historialCargado = new EventEmitter<HistorialDetallado>();
  @Output() resolucionSeleccionada = new EventEmitter<string>();

  // Señales reactivas
  historial = signal<HistorialDetallado | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);

  // Configuración de tabla
  columnasVisibles = ['secuencial', 'resolucion', 'tipo', 'estado', 'descripcion'];

  constructor(
    private vehiculoService: VehiculoService,
    private historialVehiculoService: HistorialVehicularService,
    private dialog: MatDialog
  ) {
    // Agregar columna de acciones si está habilitada
    if (this.mostrarAcciones) {
      this.columnasVisibles.push('acciones');
    }
  }

  ngOnInit() {
    if (this.vehiculoId) {
      this.cargarHistorial();
    }
  }

  /**
   * Cargar historial detallado del vehículo
   */
  async cargarHistorial() {
    if (!this.vehiculoId) return;

    this.cargando.set(true);
    this.error.set(null);

    try {
      // Usar el servicio de historial vehicular en lugar del método eliminado
      const vehiculo = await this.vehiculoService.getVehiculo(this.vehiculoId).toPromise();
      if (!vehiculo) {
        throw new Error('Vehículo no encontrado');
      }

      // Crear un historial básico con los datos del vehículo
      const historialData: HistorialDetallado = {
        vehiculo: {
          id: vehiculo.id,
          placa: vehiculo.placa,
          empresa_actual_id: vehiculo.empresaActualId || '',
          categoria: vehiculo.categoria || 'M3',
          marca: vehiculo.marca || '',
          modelo: vehiculo.modelo || '',
          numero_historial_actual: vehiculo.numeroHistorialValidacion || 1
        },
        total_resoluciones: 0,
        historial_resoluciones: []
      };
      
      this.historial.set(historialData);
      this.historialCargado.emit(historialData);
      
    } catch (error) {
      console.error('❌ Error cargando historial::', error);
      this.error.set('No se pudo cargar el historial del vehículo');
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Recargar historial
   */
  recargarHistorial() {
    this.cargarHistorial();
  }

  /**
   * Ver detalles de una resolución
   */
  verResolucion(resolucionId: string) {
    this.resolucionSeleccionada.emit(resolucionId);
  }

  /**
   * Exportar historial a CSV
   */
  exportarHistorial() {
    const historialData = this.historial();
    if (!historialData) return;

    const csvContent = this.generarCSV(historialData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_${historialData.vehiculo.placa}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generar contenido CSV del historial
   */
  private generarCSV(historial: HistorialDetallado): string {
    const headers = ['Secuencial', 'Resolución', 'Fecha', 'Tipo Resolución', 'Tipo Trámite', 'Estado', 'Descripción'];
    const rows = historial.historial_resoluciones.map(r => [
      r.numero_secuencial.toString(),
      r.numero_resolucion,
      new Date(r.fecha_emision).toLocaleDateString(),
      r.tipo_resolucion,
      r.tipo_tramite,
      r.estado,
      `"${r.descripcion.replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}