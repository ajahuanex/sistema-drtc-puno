import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TipoServicio } from '../../models/empresa.model';

export interface CambiarTipoServicioBloqueData {
  empresasSeleccionadas: number;
  tiposActuales?: TipoServicio[];
}

export interface CambiarTipoServicioBloqueResult {
  nuevosTipos: TipoServicio[];
  accion: 'reemplazar' | 'agregar' | 'quitar';
}

@Component({
  selector: 'app-cambiar-tipo-servicio-bloque-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>business</mat-icon>
          Cambiar Tipo de Servicio en Bloque
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
              <p class="subtitle">Seleccione los tipos de servicio que desea aplicar:</p>
            </div>
          </div>
        </div>

        <div class="action-selector">
          <h3>Acción a realizar:</h3>
          <div class="action-buttons">
            <button 
              class="action-btn"
              [class.selected]="accionSeleccionada === 'reemplazar'"
              (click)="seleccionarAccion('reemplazar')">
              <mat-icon>swap_horiz</mat-icon>
              <div>
                <strong>Reemplazar</strong>
                <p>Cambiar completamente los tipos de servicio</p>
              </div>
            </button>

            <button 
              class="action-btn"
              [class.selected]="accionSeleccionada === 'agregar'"
              (click)="seleccionarAccion('agregar')">
              <mat-icon>add</mat-icon>
              <div>
                <strong>Agregar</strong>
                <p>Añadir tipos de servicio adicionales</p>
              </div>
            </button>

            <button 
              class="action-btn"
              [class.selected]="accionSeleccionada === 'quitar'"
              (click)="seleccionarAccion('quitar')">
              <mat-icon>remove</mat-icon>
              <div>
                <strong>Quitar</strong>
                <p>Remover tipos de servicio específicos</p>
              </div>
            </button>
          </div>
        </div>

        @if (accionSeleccionada) {
          <div class="tipos-section">
            <h3>Tipos de Servicio:</h3>
            <div class="tipos-grid">
              <div 
                class="tipo-card"
                *ngFor="let tipo of tiposDisponibles"
                [class.selected]="tiposSeleccionados.includes(tipo.value)">
                <mat-checkbox 
                  [checked]="tiposSeleccionados.includes(tipo.value)"
                  (change)="toggleTipoServicio(tipo.value)">
                  <div class="tipo-info">
                    <mat-icon [style.color]="tipo.color">{{ tipo.icon }}</mat-icon>
                    <div>
                      <strong>{{ tipo.label }}</strong>
                      <p>{{ tipo.description }}</p>
                    </div>
                  </div>
                </mat-checkbox>
              </div>
            </div>
          </div>
        }

        @if (accionSeleccionada && tiposSeleccionados.length > 0) {
          <div class="confirmation-section">
            <div class="confirmation-card">
              <mat-icon class="warning-icon">warning</mat-icon>
              <div class="confirmation-text">
                <p><strong>¿Está seguro?</strong></p>
                <p>Se {{ getAccionTexto() }} {{ tiposSeleccionados.length }} tipo(s) de servicio en {{ data.empresasSeleccionadas }} empresa(s)</p>
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
          [disabled]="!accionSeleccionada || tiposSeleccionados.length === 0"
          (click)="confirmarCambio()"
          class="confirm-button">
          <mat-icon>check</mat-icon>
          Aplicar Cambios
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .modal-container {
      max-width: 700px;
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

    .action-selector {
      margin-bottom: 24px;

      h3 {
        margin: 0 0 16px 0;
        color: #333;
        font-size: 16px;
        font-weight: 600;
      }

      .action-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;

        .action-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px;
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
            color: #2196f3;
            font-size: 24px;
            width: 24px;
            height: 24px;
          }

          div {
            flex: 1;

            strong {
              display: block;
              margin-bottom: 4px;
              color: #333;
            }

            p {
              margin: 0;
              font-size: 12px;
              color: #666;
            }
          }
        }
      }
    }

    .tipos-section {
      margin-bottom: 24px;

      h3 {
        margin: 0 0 16px 0;
        color: #333;
        font-size: 16px;
        font-weight: 600;
      }

      .tipos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 12px;

        .tipo-card {
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s ease;

          &:hover {
            border-color: #2196f3;
            background: #f8f9fa;
          }

          &.selected {
            border-color: #2196f3;
            background: #e3f2fd;
          }

          ::ng-deep .mat-mdc-checkbox {
            width: 100%;

            .mat-mdc-checkbox-label {
              width: 100%;
            }
          }

          .tipo-info {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;

            mat-icon {
              font-size: 24px;
              width: 24px;
              height: 24px;
            }

            div {
              flex: 1;

              strong {
                display: block;
                margin-bottom: 4px;
                color: #333;
              }

              p {
                margin: 0;
                font-size: 12px;
                color: #666;
              }
            }
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
      .action-buttons {
        grid-template-columns: 1fr;
      }

      .tipos-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CambiarTipoServicioBloqueModalComponent {
  accionSeleccionada: 'reemplazar' | 'agregar' | 'quitar' | null = null;
  tiposSeleccionados: TipoServicio[] = [];
  TipoServicio = TipoServicio; // Para usar en el template

  tiposDisponibles = [
    {
      value: TipoServicio.PERSONAS,
      label: 'Personas',
      description: 'Transporte público de pasajeros',
      icon: 'person',
      color: '#2196f3'
    },
    {
      value: TipoServicio.TURISMO,
      label: 'Turismo',
      description: 'Servicios turísticos y excursiones',
      icon: 'camera_alt',
      color: '#4caf50'
    },
    {
      value: TipoServicio.TRABAJADORES,
      label: 'Trabajadores',
      description: 'Transporte de personal empresarial',
      icon: 'work',
      color: '#ff9800'
    },
    {
      value: TipoServicio.MERCANCIAS,
      label: 'Mercancías',
      description: 'Transporte de carga y mercancías',
      icon: 'local_shipping',
      color: '#9c27b0'
    },
    {
      value: TipoServicio.ESTUDIANTES,
      label: 'Estudiantes',
      description: 'Transporte escolar y universitario',
      icon: 'school',
      color: '#f44336'
    },
    {
      value: TipoServicio.TERMINAL_TERRESTRE,
      label: 'Terminal Terrestre',
      description: 'Servicios de terminal de buses',
      icon: 'location_city',
      color: '#607d8b'
    },
    {
      value: TipoServicio.ESTACION_DE_RUTA,
      label: 'Estación de Ruta',
      description: 'Paradas y estaciones intermedias',
      icon: 'place',
      color: '#795548'
    },
    {
      value: TipoServicio.OTROS,
      label: 'Otros',
      description: 'Otros tipos de servicios especiales',
      icon: 'more_horiz',
      color: '#9e9e9e'
    }
  ];

  constructor(
    public dialogRef: MatDialogRef<CambiarTipoServicioBloqueModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CambiarTipoServicioBloqueData
  ) {}

  seleccionarAccion(accion: 'reemplazar' | 'agregar' | 'quitar'): void {
    this.accionSeleccionada = accion;
    this.tiposSeleccionados = [];
  }

  toggleTipoServicio(tipo: TipoServicio): void {
    const index = this.tiposSeleccionados.indexOf(tipo);
    if (index > -1) {
      this.tiposSeleccionados.splice(index, 1);
    } else {
      this.tiposSeleccionados.push(tipo);
    }
  }

  getAccionTexto(): string {
    switch (this.accionSeleccionada) {
      case 'reemplazar':
        return 'reemplazarán con';
      case 'agregar':
        return 'agregarán';
      case 'quitar':
        return 'quitarán';
      default:
        return '';
    }
  }

  confirmarCambio(): void {
    if (this.accionSeleccionada && this.tiposSeleccionados.length > 0) {
      const result: CambiarTipoServicioBloqueResult = {
        nuevosTipos: this.tiposSeleccionados,
        accion: this.accionSeleccionada
      };
      this.dialogRef.close(result);
    }
  }
}