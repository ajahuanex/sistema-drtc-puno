import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { Ruta } from '../../models/ruta.model';

export interface DetalleRutaModalData {
  ruta: Ruta;
  empresaNombre?: string;
  resolucionNumero?: string;
}

@Component({
  selector: 'app-detalle-ruta-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>info</mat-icon>
        Detalles de la Ruta
      </h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      <!-- Código y Estado -->
      <div class="header-info">
        <div class="codigo-section">
          <span class="codigo-badge">{{ data.ruta.codigoRuta }}</span>
          <h3 class="ruta-nombre">{{ data.ruta.nombre }}</h3>
        </div>
        <mat-chip [class]="'estado-' + data.ruta.estado.toLowerCase()">
          {{ getEstadoLabel(data.ruta.estado) }}
        </mat-chip>
      </div>

      <mat-divider></mat-divider>

      <!-- Información Principal -->
      <div class="info-section">
        <h4 class="section-title">
          <mat-icon>route</mat-icon>
          Información de la Ruta
        </h4>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">
              <mat-icon>place</mat-icon>
              Origen
            </div>
            <div class="info-value">{{ data.ruta.origen?.nombre || data.ruta.origen }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">
              <mat-icon>flag</mat-icon>
              Destino
            </div>
            <div class="info-value">{{ data.ruta.destino?.nombre || data.ruta.destino }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">
              <mat-icon>event_repeat</mat-icon>
              Frecuencias
            </div>
            <div class="info-value">{{ data.ruta.frecuencia?.descripcion || 'Sin frecuencia' }}</div>
          </div>
        </div>

        <!-- Itinerario (si existe) -->
        @if (data.ruta.itinerario && data.ruta.itinerario.length > 0) {
          <div class="itinerario-section">
            <h5 class="itinerario-title">
              <mat-icon>route</mat-icon>
              Itinerario (Recorrido)
            </h5>
            <div class="itinerario-list">
              @for (localidad of data.ruta.itinerario; track localidad.orden) {
                <div class="itinerario-item">
                  <span class="orden-badge">{{ localidad.orden }}</span>
                  <span class="localidad-nombre">{{ localidad.nombre }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <mat-divider></mat-divider>

      <!-- Información Administrativa -->
      <div class="info-section">
        <h4 class="section-title">
          <mat-icon>business</mat-icon>
          Información Administrativa
        </h4>

        <div class="info-grid">
          <div class="info-item" *ngIf="data.empresaNombre">
            <div class="info-label">
              <mat-icon>business</mat-icon>
              Empresa
            </div>
            <div class="info-value">{{ data.empresaNombre }}</div>
          </div>

          <div class="info-item" *ngIf="data.resolucionNumero">
            <div class="info-label">
              <mat-icon>description</mat-icon>
              Resolución
            </div>
            <div class="info-value">{{ data.resolucionNumero }}</div>
          </div>

          <div class="info-item" *ngIf="data.ruta.capacidadMaxima">
            <div class="info-label">
              <mat-icon>airline_seat_recline_normal</mat-icon>
              Capacidad Máxima
            </div>
            <div class="info-value">{{ data.ruta.capacidadMaxima }} pasajeros</div>
          </div>

          <div class="info-item" *ngIf="data.ruta.tarifaBase">
            <div class="info-label">
              <mat-icon>payments</mat-icon>
              Tarifa Base
            </div>
            <div class="info-value">S/ {{ data.ruta.tarifaBase?.toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- Observaciones -->
      <div class="info-section" *ngIf="data.ruta.observaciones">
        <mat-divider></mat-divider>
        <h4 class="section-title">
          <mat-icon>note</mat-icon>
          Observaciones
        </h4>
        <div class="observaciones-text">
          {{ data.ruta.observaciones }}
        </div>
      </div>

      <!-- Fechas -->
      <div class="info-section">
        <mat-divider></mat-divider>
        <h4 class="section-title">
          <mat-icon>calendar_today</mat-icon>
          Fechas
        </h4>

        <div class="info-grid">
          <div class="info-item" *ngIf="data.ruta.fechaRegistro">
            <div class="info-label">
              <mat-icon>add_circle</mat-icon>
              Fecha de Registro
            </div>
            <div class="info-value">{{ formatDate(data.ruta.fechaRegistro) }}</div>
          </div>

          <div class="info-item" *ngIf="data.ruta.fechaActualizacion">
            <div class="info-label">
              <mat-icon>update</mat-icon>
              Última Actualización
            </div>
            <div class="info-value">{{ formatDate(data.ruta.fechaActualizacion) }}</div>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button mat-raised-button color="primary" mat-dialog-close>
        <mat-icon>close</mat-icon>
        Cerrar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 16px 24px;
      border-bottom: 1px solid #e0e0e0;

      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        font-size: 20px;
        font-weight: 500;
        color: #212121;

        mat-icon {
          color: #1976d2;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }
    }

    .modal-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .header-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      .codigo-section {
        display: flex;
        align-items: center;
        gap: 16px;

        .codigo-badge {
          background-color: #1976d2;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 16px;
          font-weight: 600;
        }

        .ruta-nombre {
          margin: 0;
          font-size: 18px;
          font-weight: 500;
          color: #212121;
        }
      }
    }

    .info-section {
      margin: 24px 0;

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 500;
        color: #212121;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #1976d2;
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
      }

      .info-item {
        .info-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #757575;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }

        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: #212121;
        }
      }

      .observaciones-text {
        background-color: #f5f5f5;
        padding: 16px;
        border-radius: 8px;
        font-size: 14px;
        color: #212121;
        line-height: 1.6;
        white-space: pre-wrap;
      }

      .itinerario-section {
        margin-top: 16px;
        padding: 16px;
        background-color: #f8f9fa;
        border-radius: 8px;

        .itinerario-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 500;
          color: #212121;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: #1976d2;
          }
        }

        .itinerario-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .itinerario-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background-color: white;
          border-radius: 6px;
          border-left: 3px solid #1976d2;

          .orden-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 28px;
            background-color: #1976d2;
            color: white;
            border-radius: 50%;
            font-size: 12px;
            font-weight: 600;
          }

          .localidad-nombre {
            font-size: 14px;
            color: #212121;
            font-weight: 500;
          }
        }
      }
    }

    .modal-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;

      button {
        min-width: 120px;

        mat-icon {
          margin-right: 8px;
        }
      }
    }

    // Estados
    .estado-activa {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .estado-inactiva {
      background-color: rgba(117, 117, 117, 0.1);
      color: #757575;
    }

    .estado-suspendida {
      background-color: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    .estado-en_mantenimiento {
      background-color: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    mat-divider {
      margin: 24px 0;
    }

    @media (max-width: 768px) {
      .header-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DetalleRutaModalComponent {
  constructor(
    private dialogRef: MatDialogRef<DetalleRutaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetalleRutaModalData
  ) {}

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'ACTIVA': 'Activa',
      'INACTIVA': 'Inactiva',
      'SUSPENDIDA': 'Suspendida',
      'EN_MANTENIMIENTO': 'Mantenimiento',
      'ARCHIVADA': 'Archivada',
      'DADA_DE_BAJA': 'Dada de Baja'
    };
    return labels[estado] || estado;
  }

  getTipoRutaLabel(tipo: string): string {
    const labels: { [key: string]: string } = {
      'URBANA': 'Urbana',
      'INTERURBANA': 'Interurbana',
      'INTERPROVINCIAL': 'Interprovincial',
      'INTERREGIONAL': 'Interregional',
      'RURAL': 'Rural'
    };
    return labels[tipo] || tipo;
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
