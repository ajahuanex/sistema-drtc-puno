import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RutaDetalleVehiculo } from '../../services/vehiculo.service';

export interface RutasVehiculoModalData {
  placa: string;
  empresa: string;
  resolucion?: string;
  rutas: RutaDetalleVehiculo[];
  rutas_codigos: string[];
}

@Component({
  selector: 'app-rutas-vehiculo-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="rutas-modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-main">
          <div class="icon-circle">
            <mat-icon>alt_route</mat-icon>
          </div>
          <div class="title-wrap">
            <div class="title-row">
              <h2>Rutas Autorizadas del Vehículo</h2>
              <span class="placa-badge">{{ data.placa }}</span>
            </div>
            <div class="subtitle-row">
              <span class="empresa-txt">{{ data.empresa }}</span>
              @if (data.resolucion) {
                <span class="dot-sep">•</span>
                <span class="res-txt">Res. Matriz: <strong>{{ data.resolucion }}</strong></span>
              }
            </div>
          </div>
        </div>
        <button mat-icon-button class="btn-close" (click)="cerrar()" matTooltip="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <div class="resumen-strip">
          <div class="strip-item">
            <mat-icon class="strip-icon">verified</mat-icon>
            <span>Rutas asignadas exclusivamente a esta unidad: <strong>{{ totalRutas }}</strong></span>
          </div>
          <span class="strip-tag">DRTC Puno</span>
        </div>

        @if (data.rutas && data.rutas.length > 0) {
          <div class="rutas-list">
            @for (ruta of data.rutas; track $index) {
              <div class="ruta-card">
                <div class="ruta-card-top">
                  <div class="ruta-badge-title">
                    <span class="badge-code">Ruta {{ ruta.codigo_ruta }}</span>
                    <span class="ruta-nombre">{{ ruta.nombre_ruta }}</span>
                  </div>
                  <div class="ruta-status-pills">
                    <span class="pill-servicio">{{ ruta.tipo_servicio || 'PASAJEROS REGULAR' }}</span>
                    <span class="pill-estado" [class.is-activa]="ruta.estado === 'ACTIVA'">{{ ruta.estado || 'ACTIVA' }}</span>
                  </div>
                </div>

                <!-- Diagrama visual de trayecto -->
                <div class="flow-diagram">
                  <div class="flow-node flow-origin">
                    <span class="dot-circle dot-origin"></span>
                    <div class="flow-info">
                      <span class="flow-role">ORIGEN</span>
                      <span class="flow-name">{{ ruta.origen }}</span>
                      <span class="flow-dep">{{ ruta.origen_departamento || 'PUNO' }}</span>
                    </div>
                  </div>

                  <div class="flow-connector">
                    <div class="line"></div>
                    @if (ruta.itinerario && ruta.itinerario.length > 0) {
                      <div class="itinerario-badge" [matTooltip]="'Escalas: ' + ruta.itinerario.join(' • ')">
                        <mat-icon class="itinerario-icon">pin_drop</mat-icon>
                        <span>Vía: {{ ruta.itinerario.join(' - ') }}</span>
                      </div>
                    } @else {
                      <div class="itinerario-badge direct">
                        <mat-icon class="itinerario-icon">navigation</mat-icon>
                        <span>Trayecto Directo</span>
                      </div>
                    }
                  </div>

                  <div class="flow-node flow-dest">
                    <span class="dot-circle dot-dest"></span>
                    <div class="flow-info">
                      <span class="flow-role">DESTINO</span>
                      <span class="flow-name">{{ ruta.destino }}</span>
                      <span class="flow-dep">{{ ruta.destino_departamento || 'PUNO' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Detalle técnico de la ruta -->
                <div class="ruta-card-meta">
                  <div class="meta-col">
                    <span class="meta-label"><mat-icon>schedule</mat-icon> Frecuencia:</span>
                    <span class="meta-val">{{ ruta.frecuencia || 'Diaria' }}</span>
                  </div>
                  <div class="meta-col">
                    <span class="meta-label"><mat-icon>map</mat-icon> Clasificación:</span>
                    <span class="meta-val">{{ ruta.tipo_ruta || 'Interprovincial' }}</span>
                  </div>
                  <div class="meta-col">
                    <span class="meta-label"><mat-icon>gavel</mat-icon> Resolución:</span>
                    <span class="meta-val code-font">{{ ruta.resolucion || data.resolucion || 'Concesión Matriz' }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else if (data.rutas_codigos && data.rutas_codigos.length > 0) {
          <div class="empty-rutas-card">
            <mat-icon class="empty-icon">alt_route</mat-icon>
            <h4>Códigos de Ruta Asignados</h4>
            <p>La unidad tiene registrados los siguientes códigos en su padrón de flota autorizada:</p>
            <div class="chips-codigos">
              @for (cod of data.rutas_codigos; track cod) {
                <span class="chip-code">Ruta {{ cod }}</span>
              }
            </div>
          </div>
        } @else {
          <div class="empty-rutas-card">
            <mat-icon class="empty-icon">info</mat-icon>
            <h4>Sin Rutas Asignadas</h4>
            <p>Esta unidad no cuenta con códigos de rutas comerciales asociados en la concesión activa.</p>
          </div>
        }
      </div>

      <!-- Footer Actions -->
      <div class="modal-footer">
        <button mat-stroked-button color="primary" class="btn-expediente" (click)="irAExpediente()">
          <mat-icon>tab</mat-icon> Ver en Pestaña del Expediente
        </button>
        <button mat-flat-button color="primary" class="btn-cerrar" (click)="cerrar()">
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .rutas-modal-container {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      font-family: inherit;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .header-main {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .icon-circle {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(245, 158, 11, 0.2);
        border: 1px solid rgba(245, 158, 11, 0.4);
        color: #f59e0b;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .title-wrap {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .title-row {
          display: flex;
          align-items: center;
          gap: 12px;

          h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.3px;
          }

          .placa-badge {
            font-family: 'Courier New', Courier, monospace;
            font-weight: 800;
            font-size: 14px;
            background: #ffffff;
            color: #0f172a;
            padding: 2px 10px;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            border-top: 3px solid #ea580c;
          }
        }

        .subtitle-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #94a3b8;

          .empresa-txt {
            font-weight: 600;
            color: #cbd5e1;
          }

          .dot-sep {
            color: #64748b;
          }

          .res-txt {
            color: #94a3b8;
            strong {
              color: #f8fafc;
            }
          }
        }
      }

      .btn-close {
        color: #94a3b8;
        transition: color 0.2s;
        &:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }

    .modal-body {
      padding: 20px 24px;
      overflow-y: auto;
      max-height: calc(90vh - 150px);
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #f8fafc;
    }

    .resumen-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 16px;

      .strip-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13.5px;
        color: #334155;

        .strip-icon {
          color: #10b981;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        strong {
          color: #0f172a;
        }
      }

      .strip-tag {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 3px 8px;
        background: #f1f5f9;
        color: #64748b;
        border-radius: 6px;
      }
    }

    .rutas-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .ruta-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      }

      .ruta-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;

        .ruta-badge-title {
          display: flex;
          align-items: center;
          gap: 10px;

          .badge-code {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
            font-size: 11.5px;
            font-weight: 800;
            padding: 3px 9px;
            border-radius: 6px;
            letter-spacing: 0.3px;
          }

          .ruta-nombre {
            font-size: 15.5px;
            font-weight: 800;
            color: #0f172a;
          }
        }

        .ruta-status-pills {
          display: flex;
          align-items: center;
          gap: 8px;

          .pill-servicio {
            font-size: 11px;
            font-weight: 700;
            background: #eff6ff;
            color: #1e40af;
            border: 1px solid #bfdbfe;
            padding: 2px 8px;
            border-radius: 6px;
          }

          .pill-estado {
            font-size: 11px;
            font-weight: 800;
            background: #f1f5f9;
            color: #475569;
            padding: 2px 8px;
            border-radius: 6px;

            &.is-activa {
              background: #dcfce7;
              color: #166534;
              border: 1px solid #bbf7d0;
            }
          }
        }
      }

      .flow-diagram {
        display: flex;
        align-items: center;
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 10px;
        padding: 12px 18px;
        gap: 14px;

        .flow-node {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 130px;

          .dot-circle {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            flex-shrink: 0;

            &.dot-origin {
              background: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
            }

            &.dot-dest {
              background: #10b981;
              box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
            }
          }

          .flow-info {
            display: flex;
            flex-direction: column;

            .flow-role {
              font-size: 9.5px;
              font-weight: 800;
              color: #64748b;
              letter-spacing: 0.5px;
            }

            .flow-name {
              font-size: 13.5px;
              font-weight: 700;
              color: #0f172a;
            }

            .flow-dep {
              font-size: 10px;
              color: #94a3b8;
            }
          }
        }

        .flow-connector {
          flex: 1;
          display: flex;
          align-items: center;
          position: relative;
          justify-content: center;

          .line {
            position: absolute;
            left: 0;
            right: 0;
            height: 2px;
            background: #cbd5e1;
            z-index: 1;
          }

          .itinerario-badge {
            position: relative;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            color: #475569;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            max-width: 300px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            .itinerario-icon {
              font-size: 14px;
              width: 14px;
              height: 14px;
              color: #f59e0b;
            }

            &.direct {
              color: #64748b;
              font-style: italic;
              .itinerario-icon {
                color: #3b82f6;
              }
            }
          }
        }
      }

      .ruta-card-meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        padding-top: 10px;
        border-top: 1px dashed #e2e8f0;

        .meta-col {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;

          .meta-label {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #64748b;
            font-weight: 500;

            mat-icon {
              font-size: 15px;
              width: 15px;
              height: 15px;
              color: #94a3b8;
            }
          }

          .meta-val {
            font-weight: 700;
            color: #1e293b;

            &.code-font {
              font-family: 'Courier New', Courier, monospace;
              color: #0369a1;
            }
          }
        }
      }
    }

    .empty-rutas-card {
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 32px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;

      .empty-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #94a3b8;
      }

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        max-width: 450px;
      }

      .chips-codigos {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 8px;

        .chip-code {
          background: #f1f5f9;
          color: #334155;
          font-weight: 700;
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
      }
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 24px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;

      .btn-expediente {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
      }

      .btn-cerrar {
        padding: 0 24px;
      }
    }
  `]
})
export class RutasVehiculoModalComponent {
  dialogRef = inject(MatDialogRef<RutasVehiculoModalComponent>);
  data: RutasVehiculoModalData = inject(MAT_DIALOG_DATA);

  get totalRutas(): number {
    return this.data.rutas?.length || this.data.rutas_codigos?.length || 0;
  }

  irAExpediente(): void {
    this.dialogRef.close('ir_a_tab');
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
