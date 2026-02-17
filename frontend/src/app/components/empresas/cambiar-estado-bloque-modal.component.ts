import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { EstadoEmpresa } from '../../models/empresa.model';
import { ESTADOS_EMPRESA, ESTADOS_LABELS, ESTADOS_COLORS, ESTADOS_ICONS } from '../../config/estados.config';

export interface CambiarEstadoBloqueData {
  empresasSeleccionadas: number;
  estadoActual?: EstadoEmpresa;
}

export interface CambiarEstadoBloqueResult {
  nuevoEstado: EstadoEmpresa;
  motivo?: string;
}

@Component({
  selector: 'app-cambiar-estado-bloque-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>edit</mat-icon>
          Cambiar Estado en Bloque
        </h2>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <div class="info-section">
          <div class="info-card">
            <mat-icon class="info-icon">info</mat-icon>
            <div class="info-text">
              <p><strong>{{ data.empresasSeleccionadas }}</strong> empresa(s) seleccionada(s)</p>
              <p class="subtitle">Seleccione el nuevo estado que desea aplicar:</p>
            </div>
          </div>
        </div>

        <div class="estados-grid">
          <button 
            class="estado-card success"
            (click)="seleccionarAutorizado()"
            [class.selected]="estadoSeleccionado === EstadoEmpresa.AUTORIZADO">
            <mat-icon>check_circle</mat-icon>
            <div class="estado-info">
              <h3>AUTORIZADA</h3>
              <p>Empresa habilitada para operar</p>
            </div>
          </button>

          <button 
            class="estado-card info"
            (click)="seleccionarEnTramite()"
            [class.selected]="estadoSeleccionado === EstadoEmpresa.EN_TRAMITE">
            <mat-icon>hourglass_empty</mat-icon>
            <div class="estado-info">
              <h3>EN TRÁMITE</h3>
              <p>Proceso de autorización pendiente</p>
            </div>
          </button>

          <button 
            class="estado-card warning"
            (click)="seleccionarSuspendido()"
            [class.selected]="estadoSeleccionado === EstadoEmpresa.SUSPENDIDO">
            <mat-icon>pause_circle</mat-icon>
            <div class="estado-info">
              <h3>SUSPENDIDA</h3>
              <p>Operación temporalmente suspendida</p>
            </div>
          </button>

          <button 
            class="estado-card danger"
            (click)="seleccionarCancelado()"
            [class.selected]="estadoSeleccionado === EstadoEmpresa.CANCELADO">
            <mat-icon>cancel</mat-icon>
            <div class="estado-info">
              <h3>CANCELADA</h3>
              <p>Autorización cancelada definitivamente</p>
            </div>
          </button>
        </div>

        @if (estadoSeleccionado) {
          <div class="confirmation-section">
            <div class="confirmation-card">
              <mat-icon class="warning-icon">warning</mat-icon>
              <div class="confirmation-text">
                <p><strong>¿Está seguro?</strong></p>
                <p>Se cambiará el estado de {{ data.empresasSeleccionadas }} empresa(s) a <strong>{{ getEstadoLabel(estadoSeleccionado) }}</strong></p>
              </div>
            </div>
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions class="modal-actions">
        <button mat-button mat-dialog-close class="cancel-button">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        
        <button 
          mat-raised-button 
          color="primary" 
          [disabled]="!estadoSeleccionado"
          (click)="confirmarCambio()"
          class="confirm-button">
          <mat-icon>check</mat-icon>
          Cambiar Estado
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .modal-container {
      max-width: 600px;
      width: 100%;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0 24px;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 24px;

      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        color: #333;
        font-size: 20px;
        font-weight: 600;

        mat-icon {
          color: #2196f3;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .close-button {
        color: #666;
        
        &:hover {
          color: #333;
          background: #f0f0f0;
        }
      }
    }

    .modal-content {
      padding: 0 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .info-section {
      margin-bottom: 24px;

      .info-card {
        display: flex;
        align-items: center;
        gap: 16px;
        background: #e3f2fd;
        border: 1px solid #2196f3;
        border-radius: 12px;
        padding: 16px;

        .info-icon {
          color: #2196f3;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        .info-text {
          flex: 1;

          p {
            margin: 0 0 4px 0;
            color: #1565c0;

            &.subtitle {
              font-size: 14px;
              color: #1976d2;
            }
          }
        }
      }
    }

    .estados-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;

      .estado-card {
        display: flex;
        align-items: center;
        gap: 16px;
        background: white;
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;

        &:hover {
          border-color: #2196f3;
          background: #f8f9fa;
        }

        &.selected {
          border-color: #2196f3;
          background: #e3f2fd;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
        }

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }

        .estado-info {
          flex: 1;

          h3 {
            margin: 0 0 4px 0;
            font-size: 16px;
            font-weight: 600;
          }

          p {
            margin: 0;
            font-size: 14px;
            color: #666;
          }
        }

        &.success {
          mat-icon {
            color: #4caf50;
          }

          &.selected {
            background: #e8f5e8;
            border-color: #4caf50;
          }
        }

        &.info {
          mat-icon {
            color: #2196f3;
          }

          &.selected {
            background: #e3f2fd;
            border-color: #2196f3;
          }
        }

        &.warning {
          mat-icon {
            color: #ff9800;
          }

          &.selected {
            background: #fff3e0;
            border-color: #ff9800;
          }
        }

        &.danger {
          mat-icon {
            color: #f44336;
          }

          &.selected {
            background: #ffebee;
            border-color: #f44336;
          }
        }
      }
    }

    .confirmation-section {
      margin-bottom: 24px;

      .confirmation-card {
        display: flex;
        align-items: center;
        gap: 16px;
        background: #fff3e0;
        border: 1px solid #ff9800;
        border-radius: 12px;
        padding: 16px;

        .warning-icon {
          color: #ff9800;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        .confirmation-text {
          flex: 1;

          p {
            margin: 0 0 4px 0;
            color: #f57c00;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 24px;
      border-top: 1px solid #e0e0e0;
      margin-top: 24px;

      .cancel-button {
        color: #666;

        &:hover {
          background: #f0f0f0;
        }
      }

      .confirm-button {
        &:disabled {
          background: #e0e0e0;
          color: #999;
        }
      }
    }

    @media (max-width: 768px) {
      .estados-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CambiarEstadoBloqueModalComponent {
  estadoSeleccionado: EstadoEmpresa | null = null;
  EstadoEmpresa = EstadoEmpresa; // Para usar en el template

  constructor(
    public dialogRef: MatDialogRef<CambiarEstadoBloqueModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CambiarEstadoBloqueData
  ) {}

  seleccionarAutorizado(): void {
    this.estadoSeleccionado = EstadoEmpresa.AUTORIZADO;
  }

  seleccionarEnTramite(): void {
    this.estadoSeleccionado = EstadoEmpresa.EN_TRAMITE;
  }

  seleccionarSuspendido(): void {
    this.estadoSeleccionado = EstadoEmpresa.SUSPENDIDO;
  }

  seleccionarCancelado(): void {
    this.estadoSeleccionado = EstadoEmpresa.CANCELADO;
  }

  confirmarCambio(): void {
    if (this.estadoSeleccionado) {
      const result: CambiarEstadoBloqueResult = {
        nuevoEstado: this.estadoSeleccionado
      };
      this.dialogRef.close(result);
    }
  }

  getEstadoLabel(estado: EstadoEmpresa): string {
    return ESTADOS_LABELS[estado] || estado;
  }
}