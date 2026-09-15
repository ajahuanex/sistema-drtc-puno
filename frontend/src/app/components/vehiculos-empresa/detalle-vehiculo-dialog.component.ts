import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VehiculoEmpresa } from '../../services/flota-empresa.service';
import { RutaService } from '../../services/ruta.service';
import { ResolucionPrimigeniaService } from '../../services/resolucion-primigenia.service';
import { Ruta } from '../../models/ruta.model';
import { environment } from '../../../environments/environment';

export interface RutaDetalleDisplay {
  codigo: string;
  nombre: string;
  origen: string;
  destino: string;
  frecuencia: string;
  estado: string;
  esActiva: boolean;
}

@Component({
  selector: 'app-detalle-vehiculo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="detalle-dialog-container">
      <!-- HEADER CON SUBTÍTULO RUC -->
      <div class="dialog-header">
        <div class="header-left">
          <div class="header-icon-box">
            <mat-icon class="header-icon">directions_car</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title">Detalle del Registro Vehicular</h2>
            <p class="dialog-subtitle">RUC: {{ data.ruc }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" class="close-btn" matTooltip="Cerrar ventana">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-body">
        <!-- BARRA VEHÍCULO (PLACA, ESTADO, TUC AL FINAL DE LA FILA) -->
        <div class="vehicle-identity-bar">
          <div class="identity-top-row">
            <div class="placa-box">
              <mat-icon class="placa-icon">subtitles</mat-icon>
              <span class="placa-text">{{ data.placa }}</span>
            </div>

            <div class="status-box">
              <span [class]="'status-pill status-' + (data.estado || 'sin-datos').toLowerCase()">
                <span class="status-dot"></span>
                {{ data.estado || 'SIN ESTADO' }}
              </span>
            </div>

            <!-- TUC AL FINAL DE LA MISMA FILA DE LA PLACA -->
            @if (data.numero_tuc) {
              <div class="tuc-box-end">
                <mat-icon>card_membership</mat-icon>
                <span>TUC: {{ data.numero_tuc }}</span>
              </div>
            }
          </div>

          <!-- CARACTERÍSTICAS DEL VEHÍCULO DEBAJO DE LA PLACA -->
          @if (techMarcaModelo() || techCategoria() || techAnio()) {
            <div class="identity-tech-row">
              @if (techMarcaModelo()) {
                <span class="brand-chip">
                  <mat-icon>directions_bus</mat-icon>
                  {{ techMarcaModelo() }}
                </span>
              }

              @if (techCategoria()) {
                <span class="tech-chip">
                  <mat-icon>category</mat-icon>
                  <span>Cat: <strong>{{ techCategoria() }}</strong></span>
                </span>
              }

              @if (techAnio()) {
                <span class="tech-chip">
                  <mat-icon>event</mat-icon>
                  <span>Año Fab./ Mod.: <strong>{{ techAnio() }}</strong></span>
                </span>
              }
            </div>
          }
        </div>

        <!-- TARJETAS DE INFORMACIÓN (DINÁMICAS) -->
        <div class="info-grid">
          <!-- CARD 1: EMPRESA -->
          <div class="info-card border-blue">
            <div class="card-icon-title">
              <mat-icon class="icon-blue">business</mat-icon>
              <span class="card-title">Empresa / RUC</span>
            </div>
            <div class="card-main-val">{{ data.razon_social || 'SIN RAZÓN SOCIAL' }}</div>
            <div class="card-sub-val font-mono">RUC: {{ data.ruc }}</div>
          </div>

          <!-- CARD 2: RESOLUCIÓN PRIMIGENIA Y FECHAS DE VIGENCIA -->
          <div class="info-card border-green">
            <div class="card-icon-title">
              <mat-icon class="icon-green">verified</mat-icon>
              <span class="card-title">Resolución Primigenia</span>
            </div>
            <div class="card-main-val font-mono text-green">
              {{ data.nro_resolucion_primigenia || '-' }}
            </div>
            <div class="card-flex-sub">
              <span>Estado:</span>
              <span [class]="'res-badge res-' + (data.estado_primigenia || 'VIGENTE').toLowerCase()">
                {{ data.estado_primigenia || 'VIGENTE' }}
              </span>
            </div>

            <!-- FECHAS DE VIGENCIA CON 'VIGENCIA DESDE' Y 'VIGENCIA HASTA' -->
            <div class="vigencia-box">
              <mat-icon class="vigencia-icon">event_available</mat-icon>
              <div class="vigencia-text">
                @if (fechaInicioVigencia() && fechaFinVigencia()) {
                  <div>Vigencia Desde: <strong>{{ fechaInicioVigencia() | date:'dd/MM/yyyy' }}</strong></div>
                  <div>Vigencia Hasta: <strong class="text-emerald">{{ fechaFinVigencia() | date:'dd/MM/yyyy' }}</strong></div>
                } @else if (fechaFinVigencia() || data.fecha_vigencia_hasta) {
                  <div>Vigencia Hasta: <strong class="text-emerald">{{ (fechaFinVigencia() || data.fecha_vigencia_hasta) | date:'dd/MM/yyyy' }}</strong></div>
                } @else {
                  <div>Vigencia: <strong class="text-emerald">VIGENTE EN CATÁLOGO</strong></div>
                }
              </div>
            </div>
          </div>

          <!-- CARD 3: RESOLUCIÓN (Solo si existe) -->
          @if (tieneResolucionHija) {
            <div class="info-card border-amber">
              <div class="card-icon-title">
                <mat-icon class="icon-amber">description</mat-icon>
                <span class="card-title">Resolución</span>
              </div>
              <div class="card-main-val font-mono text-amber">
                {{ data.nro_resolucion_hija }}
              </div>
              @if (data.tipo_resolucion_hija) {
                <div class="card-sub-val">
                  Tipo: <strong>{{ getTipoHijaNombre(data.tipo_resolucion_hija) }}</strong>
                </div>
              }
              @if (data.fecha_resolucion_hija) {
                <div class="card-sub-val">
                  Fecha Res: {{ data.fecha_resolucion_hija | date:'dd/MM/yyyy' }}
                </div>
              }
            </div>
          }

          <!-- CARD 4: EXPEDIENTE (Solo si existe) -->
          @if (tieneExpediente) {
            <div class="info-card border-purple">
              <div class="card-icon-title">
                <mat-icon class="icon-purple">folder_open</mat-icon>
                <span class="card-title">Expediente</span>
              </div>
              <div class="card-main-val font-mono text-purple">
                {{ data.expediente || data.num_expediente }}
              </div>
              @if (data.fecha_expediente) {
                <div class="card-sub-val">
                  Fecha Exp: {{ data.fecha_expediente | date:'dd/MM/yyyy' }}
                </div>
              }
            </div>
          }
        </div>

        <!-- SECCIÓN RUTAS -->
        <div class="section-divider"></div>
        
        <div class="section-header">
          <mat-icon class="section-icon text-blue">alt_route</mat-icon>
          <h3>Rutas Asignadas y Estado Operativo</h3>
        </div>

        @if (isLoadingRutas()) {
          <div class="loading-box">
            <mat-spinner diameter="24"></mat-spinner>
            <span>Cargando lista de rutas...</span>
          </div>
        } @else {
          <div class="rutas-container">
            <!-- TABLA DE RUTAS (ORIGEN Y DESTINO EN NEGRITA, ITINERARIO EN LETRA NORMAL MÁS PEQUEÑA) -->
            @if (rutasActivas().length > 0) {
              <div class="rutas-table-wrapper">
                <div class="table-header-title text-emerald">
                  <mat-icon>check_circle</mat-icon>
                  <span>Rutas Habilitadas / Activas ({{ rutasActivas().length }})</span>
                </div>
                
                <table class="rutas-table">
                  <thead>
                    <tr>
                      <th style="width: 65px;">COD</th>
                      <th style="width: 140px;">ORIGEN</th>
                      <th>ITINERARIO</th>
                      <th style="width: 140px;">DESTINO</th>
                      <th style="width: 130px;">FRECUENCIA</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of rutasActivas(); track r.codigo) {
                      <tr class="row-active">
                        <td>
                          <span class="table-code-badge">{{ r.codigo }}</span>
                        </td>
                        <td>
                          <span class="location-bold">{{ r.origen || '-' }}</span>
                        </td>
                        <td>
                          <span class="route-name-normal">{{ r.nombre }}</span>
                        </td>
                        <td>
                          <span class="location-bold">{{ r.destino || '-' }}</span>
                        </td>
                        <td>
                          <span class="frecuencia-text">{{ r.frecuencia || 'DIARIO' }}</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="empty-rutas-msg">
                <mat-icon>info</mat-icon> No hay rutas activas asociadas a este vehículo.
              </div>
            }

            <!-- OBSERVACIÓN DE RUTAS CANCELADAS O INHABILITADAS -->
            @if (rutasCanceladas().length > 0) {
              <div class="observacion-rutas-box">
                <div class="obs-rutas-header">
                  <mat-icon class="obs-icon">warning</mat-icon>
                  <span class="obs-rutas-title">Observación de Rutas Inhabilitadas / Canceladas:</span>
                </div>
                <div class="obs-rutas-list">
                  @for (r of rutasCanceladas(); track r.codigo) {
                    <div class="obs-ruta-item">
                      <span class="obs-ruta-code">{{ r.codigo }}</span>
                      <span class="obs-ruta-name">{{ r.nombre }}</span>
                      <span class="obs-ruta-status">({{ r.estado || 'CANCELADA' }})</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- DOCUMENTOS DIGITALES ENLACES -->
        <div class="docs-section">
          <div class="section-header small-header">
            <mat-icon class="section-icon text-purple">cloud_download</mat-icon>
            <h4>Documentos Digitales Adjuntos</h4>
          </div>
          <div class="docs-links-grid">
            @if (data.link_tuc) {
              <a [href]="data.link_tuc" target="_blank" class="doc-link-btn btn-tuc">
                <mat-icon>description</mat-icon>
                <span>Ver Tarjeta Única de Circulación (TUC) en Drive</span>
                <mat-icon class="external-icon">open_in_new</mat-icon>
              </a>
            }
            @if (data.link_notificacion) {
              <a [href]="data.link_notificacion" target="_blank" class="doc-link-btn btn-notif">
                <mat-icon>mark_email_read</mat-icon>
                <span>Ver Notificación Oficial en Drive</span>
                <mat-icon class="external-icon">open_in_new</mat-icon>
              </a>
            }
            @if (!data.link_tuc && !data.link_notificacion) {
              <div class="empty-docs-msg">
                <mat-icon>attachment</mat-icon> Sin documentos o enlaces adjuntos en Google Drive
              </div>
            }
          </div>
        </div>

        <!-- HISTORIAL OBSERVACIONES -->
        @if (data.detalles || (data.observaciones_historial && data.observaciones_historial.length)) {
          <div class="section-divider"></div>
          <div class="section-header">
            <mat-icon class="section-icon text-amber">history</mat-icon>
            <h3>Historial de Observaciones y Notas</h3>
          </div>

          @if (data.detalles) {
            <div class="detalles-box">
              <div class="detalles-label">Detalles Adicionales del Registro:</div>
              <div class="detalles-text">{{ data.detalles }}</div>
            </div>
          }

          @if (data.observaciones_historial && data.observaciones_historial.length) {
            <div class="obs-timeline">
              @for (obs of data.observaciones_historial; track obs.fecha) {
                <div class="obs-item">
                  <div class="obs-header">
                    <span class="obs-user">
                      <mat-icon>account_circle</mat-icon> {{ obs.usuario || 'Sistema' }}
                    </span>
                    <span class="obs-date">{{ obs.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <div class="obs-body">{{ obs.texto }}</div>
                </div>
              }
            </div>
          }
        }
      </div>

      <div class="dialog-actions">
        <button mat-flat-button color="primary" (click)="cerrar()" class="btn-close-action">
          <mat-icon>close</mat-icon> Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .detalle-dialog-container {
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .dialog-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: #ffffff;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .header-left {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .header-icon-box {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;

        .header-icon {
          color: #38bdf8;
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }

      .dialog-title {
        margin: 0;
        font-size: 17px;
        font-weight: 800;
        letter-spacing: -0.01em;
        color: #ffffff;
      }

      .dialog-subtitle {
        margin: 2px 0 0;
        font-size: 12px;
        color: #94a3b8;
        font-family: monospace;
      }

      .close-btn {
        color: #cbd5e1;
        transition: all 0.2s;
        &:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }
      }
    }

    .dialog-body {
      padding: 20px 24px;
      max-height: 75vh;
      overflow-y: auto;
      background: #f8fafc;
    }

    /* VEHICLE IDENTITY BAR */
    .vehicle-identity-bar {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 18px;
      padding: 12px 16px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

      .identity-top-row {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
      }

      .tuc-box-end {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        padding: 5px 12px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .identity-tech-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-top: 8px;
        border-top: 1px dashed #e2e8f0;
        flex-wrap: wrap;

        .brand-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12.5px;
          font-weight: 700;
          color: #0369a1;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 3px 10px;
          border-radius: 6px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: #0284c7;
          }
        }

        .tech-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f8fafc;
          color: #475569;
          font-size: 11.5px;
          font-weight: 500;
          padding: 3px 9px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;

          mat-icon {
            font-size: 15px;
            width: 15px;
            height: 15px;
            color: #64748b;
          }
        }
      }

      .placa-box {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #0f172a;
        color: #ffffff;
        padding: 5px 14px;
        border-radius: 8px;
        font-weight: 800;
        font-size: 16px;
        font-family: 'JetBrains Mono', monospace;
        letter-spacing: 0.06em;

        .placa-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #38bdf8;
        }
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 700;
        padding: 5px 12px;
        border-radius: 9999px;
        letter-spacing: 0.03em;
        text-transform: uppercase;

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        &.status-habilitado {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
          .status-dot { background: #22c55e; }
        }
        &.status-inhabilitado {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          .status-dot { background: #ef4444; }
        }
        &.status-observado {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
          .status-dot { background: #f59e0b; }
        }
      }
    }

    /* INFO GRID CARDS */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }

    .info-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 14px 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.2s;

      &.border-blue { border-top: 3px solid #2563eb; }
      &.border-green { border-top: 3px solid #059669; }
      &.border-amber { border-top: 3px solid #d97706; }
      &.border-purple { border-top: 3px solid #7c3aed; }

      .card-icon-title {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
        .icon-blue { color: #2563eb; }
        .icon-green { color: #059669; }
        .icon-amber { color: #d97706; }
        .icon-purple { color: #7c3aed; }

        .card-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
        }
      }

      .card-main-val {
        font-size: 13.5px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.3;
        word-break: break-word;

        &.font-mono { font-family: 'JetBrains Mono', monospace; }
        &.text-green { color: #059669; }
        &.text-amber { color: #d97706; }
        &.text-purple { color: #7c3aed; }
      }

      .card-sub-val {
        font-size: 11.5px;
        color: #64748b;
        margin-top: 4px;
        &.font-mono { font-family: monospace; }
      }

      .card-flex-sub {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11.5px;
        color: #64748b;
        margin-top: 4px;
      }
    }

    .vigencia-box {
      margin-top: 10px;
      padding: 8px 12px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 11.5px;
      color: #065f46;

      .vigencia-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #059669;
        margin-top: 1px;
      }

      .vigencia-text {
        line-height: 1.45;

        strong {
          color: #047857;
        }
      }
    }

    .res-badge {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;

      &.res-vigente {
        background: #dcfce7;
        color: #15803d;
      }
      &.res-cancelada, &.res-inactiva, &.res-vencida {
        background: #fee2e2;
        color: #b91c1c;
      }
    }

    /* SECTION DIVIDERS & HEADERS */
    .section-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 18px 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      .section-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        &.text-blue { color: #2563eb; }
        &.text-purple { color: #7c3aed; }
        &.text-amber { color: #d97706; }
      }

      h3 {
        margin: 0;
        font-size: 14.5px;
        font-weight: 700;
        color: #0f172a;
      }
      h4 {
        margin: 0;
        font-size: 13.5px;
        font-weight: 700;
        color: #334155;
      }

      &.small-header {
        margin-bottom: 10px;
      }
    }

    .loading-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 12.5px;
    }

    /* RUTAS TABLA */
    .rutas-container {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .rutas-table-wrapper {
      background: #ffffff;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      overflow: hidden;

      .table-header-title {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 14px;
        font-size: 12.5px;
        font-weight: 700;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
        &.text-emerald { color: #059669; }
      }
    }

    .rutas-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;

      th {
        background: #f1f5f9;
        color: #475569;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 10.5px;
        letter-spacing: 0.04em;
        padding: 9px 12px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }

      td {
        padding: 9px 12px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
        color: #1e293b;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover td {
        background: #f8fafc;
      }

      .table-code-badge {
        display: inline-block;
        background: #eff6ff;
        color: #1d4ed8;
        font-weight: 800;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
      }

      .location-bold {
        font-weight: 700;
        color: #0f172a;
        font-size: 12px;
      }

      .route-name-normal {
        font-weight: 400;
        color: #475569;
        font-size: 11px;
        line-height: 1.35;
      }

      .frecuencia-text {
        font-size: 11.5px;
        font-weight: 600;
        color: #2563eb;
        background: #eff6ff;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
      }
    }

    /* OBSERVACIÓN DE RUTAS BOX */
    .observacion-rutas-box {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      border-left: 4px solid #e11d48;
      border-radius: 8px;
      padding: 10px 14px;

      .obs-rutas-header {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #be123c;
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 6px;

        .obs-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .obs-rutas-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .obs-ruta-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11.5px;
        color: #881337;

        .obs-ruta-code {
          font-family: monospace;
          font-weight: 700;
          background: #ffe4e6;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .obs-ruta-name {
          font-weight: 600;
        }

        .obs-ruta-status {
          font-size: 10.5px;
          color: #9f1239;
          font-style: italic;
        }
      }
    }

    .empty-rutas-msg {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #94a3b8;
      font-size: 12.5px;
      font-style: italic;
      padding: 10px 14px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    /* DOCUMENTS SECTION */
    .docs-section {
      margin-top: 16px;
    }

    .docs-links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 10px;
    }

    .doc-link-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;
      border: 1px solid transparent;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .external-icon {
        margin-left: auto;
        font-size: 15px;
        width: 15px;
        height: 15px;
        opacity: 0.7;
      }

      &.btn-tuc {
        background: #eff6ff;
        color: #1d4ed8;
        border-color: #bfdbfe;
        &:hover {
          background: #dbeafe;
        }
      }

      &.btn-notif {
        background: #faf5ff;
        color: #6b21a8;
        border-color: #e9d5ff;
        &:hover {
          background: #f3e8ff;
        }
      }
    }

    .empty-docs-msg {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #94a3b8;
      font-size: 12px;
      font-style: italic;
      padding: 10px 14px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px dashed #cbd5e1;
    }

    /* HISTORIAL OBSERVACIONES */
    .detalles-box {
      background: #fffbe6;
      border: 1px solid #ffe58f;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;

      .detalles-label {
        font-size: 10.5px;
        font-weight: 700;
        color: #d48806;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 2px;
      }

      .detalles-text {
        font-size: 12.5px;
        color: #595959;
      }
    }

    .obs-timeline {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .obs-item {
        background: #ffffff;
        border-radius: 8px;
        padding: 10px 14px;
        border: 1px solid #e2e8f0;
        border-left: 3px solid #d97706;

        .obs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11.5px;
          margin-bottom: 4px;

          .obs-user {
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: 700;
            color: #1e293b;

            mat-icon {
              font-size: 15px;
              width: 15px;
              height: 15px;
              color: #d97706;
            }
          }

          .obs-date {
            color: #94a3b8;
            font-size: 10.5px;
          }
        }

        .obs-body {
          font-size: 12.5px;
          color: #334155;
          line-height: 1.35;
        }
      }
    }

    .dialog-actions {
      padding: 12px 24px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;

      .btn-close-action {
        border-radius: 8px;
        font-weight: 600;
        padding: 0 18px;
      }
    }
  `]
})
export class DetalleVehiculoDialogComponent implements OnInit {
  isLoadingRutas = signal(true);
  rutasActivas = signal<RutaDetalleDisplay[]>([]);
  rutasCanceladas = signal<RutaDetalleDisplay[]>([]);

  // Vigencia Primigenia
  fechaInicioVigencia = signal<string | null>(null);
  fechaFinVigencia = signal<string | null>(null);

  // Datos Técnicos del Vehículo
  techAnio = signal<string | null>(null);
  techCategoria = signal<string | null>(null);
  techMarcaModelo = signal<string | null>(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VehiculoEmpresa,
    private dialogRef: MatDialogRef<DetalleVehiculoDialogComponent>,
    private rutaService: RutaService,
    private resolucionPrimigeniaService: ResolucionPrimigeniaService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cargarVigenciaResolucion();
    this.cargarDatosTecnicosVehiculo();
    this.cargarRutasDetalladas();
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  get tieneResolucionHija(): boolean {
    const r = this.data.nro_resolucion_hija;
    if (!r) return false;
    const clean = String(r).trim().toLowerCase();
    return clean !== '' && clean !== '-' && !clean.includes('sin res') && clean !== 'none' && clean !== 'null';
  }

  get tieneExpediente(): boolean {
    const exp = this.data.expediente || this.data.num_expediente;
    if (!exp) return false;
    const clean = String(exp).trim().toLowerCase();
    return clean !== '' && clean !== '-' && !clean.includes('sin exp') && clean !== 'none' && clean !== 'null';
  }

  getTipoHijaNombre(tipo?: string): string {
    const map: Record<string, string> = {
      I: 'Incremento', S: 'Sustitución', M: 'Modificación', O: 'Otros', C: 'Cancelación'
    };
    return tipo ? (map[tipo] || tipo) : '';
  }

  private cargarVigenciaResolucion(): void {
    if (this.data.fecha_vigencia_hasta) {
      this.fechaFinVigencia.set(String(this.data.fecha_vigencia_hasta));
    }

    const nro = this.data.nro_resolucion_primigenia;
    const ruc = this.data.ruc;

    if (ruc) {
      this.resolucionPrimigeniaService.getResolucionesByRuc(ruc).subscribe({
        next: (resList) => {
          if (resList && resList.length > 0) {
            const match = resList.find(r => 
              (r.nro_resolucion || '').trim().toUpperCase() === (nro || '').trim().toUpperCase() ||
              (nro || '').includes(r.nro_resolucion || '___')
            ) || resList[0];

            if (match) {
              if (match.fecha_inicio_vigencia || match.fecha_resolucion) {
                this.fechaInicioVigencia.set(String(match.fecha_inicio_vigencia || match.fecha_resolucion));
              }
              if (match.fecha_fin_vigencia) {
                this.fechaFinVigencia.set(String(match.fecha_fin_vigencia));
              }
            }
          }
        },
        error: (err) => console.warn('No se pudo cargar vigencia oficial de la resolución:', err)
      });
    }
  }

  private cargarDatosTecnicosVehiculo(): void {
    const d = this.data as any;
    if (d.anio_fabricacion || d.anio || d.modelo) {
      this.techAnio.set(String(d.anio_fabricacion || d.anio || d.modelo));
    }
    if (d.categoria || d.categoria_vehiculo || d.clase) {
      this.techCategoria.set(String(d.categoria || d.categoria_vehiculo || d.clase));
    }
    if (d.marca || d.modelo) {
      this.techMarcaModelo.set(`${d.marca || ''} ${d.modelo || ''}`.trim());
    }

    const placa = (this.data.placa || '').trim();
    if (placa && placa !== '-') {
      this.http.get<any>(`${environment.apiUrl}/vehiculos-solo/placa/${placa}`).subscribe({
        next: (vData) => {
          if (vData) {
            if (vData.anio_fabricacion || vData.anio_modelo) {
              this.techAnio.set(String(vData.anio_fabricacion || vData.anio_modelo));
            }
            if (vData.categoria || vData.clase) {
              this.techCategoria.set(String(vData.categoria || vData.clase));
            }
            if (vData.marca || vData.modelo) {
              this.techMarcaModelo.set(`${vData.marca || ''} ${vData.modelo || ''}`.trim());
            }
          }
        },
        error: () => {
          this.http.get<any>(`${environment.apiUrl}/vehiculos-data/buscar/placa/${placa}`).subscribe({
            next: (resp) => {
              const v = resp?.data || resp;
              if (v) {
                if (v.anio_fabricacion || v.anio) this.techAnio.set(String(v.anio_fabricacion || v.anio));
                if (v.categoria || v.clase) this.techCategoria.set(String(v.categoria || v.clase));
                if (v.marca || v.modelo) this.techMarcaModelo.set(`${v.marca || ''} ${v.modelo || ''}`.trim());
              }
            },
            error: () => {}
          });
        }
      });
    }
  }

  private cargarRutasDetalladas(): void {
    this.isLoadingRutas.set(true);

    this.rutaService.getRutas().subscribe({
      next: (rutasApi) => {
        this.procesarRutas(rutasApi);
        this.isLoadingRutas.set(false);
      },
      error: (err) => {
        console.warn('Error al cargar rutas oficiales del backend, usando fallback:', err);
        this.procesarFallbackRutas();
        this.isLoadingRutas.set(false);
      }
    });
  }

  private procesarRutas(rutasApi: Ruta[]): void {
    const ruc = this.data.ruc;
    const resPrim = (this.data.nro_resolucion_primigenia || '').trim();
    const codigosVehiculo = this.data.rutas || [];

    const rutasEmpresa = (rutasApi || []).filter(r => {
      const rucMatch = r.empresa?.ruc === ruc || (r as any).ruc === ruc;
      const resMatch = resPrim && (
        (r.resolucion?.nroResolucion || (r as any).resolucion_numero || '').includes(resPrim) ||
        resPrim.includes(r.resolucion?.nroResolucion || '___')
      );
      return rucMatch || resMatch;
    });

    const activas: RutaDetalleDisplay[] = [];
    const canceladas: RutaDetalleDisplay[] = [];
    const codigosProcesados = new Set<string>();

    for (const itemCod of codigosVehiculo) {
      const itemClean = String(itemCod || '').trim();
      if (!itemClean) continue;

      const match = rutasEmpresa.find(r => 
        r.codigoRuta === itemClean || 
        r.id === itemClean || 
        (r.nombre && r.nombre.includes(itemClean))
      );

      if (match) {
        codigosProcesados.add(match.codigoRuta || itemClean);

        const origenNombre = match.origen?.nombre || (match as any).origenNombre || '';
        const destinoNombre = match.destino?.nombre || (match as any).destinoNombre || '';
        const itinerarioTxt = match.nombre || (match as any).descripcion || (origenNombre && destinoNombre ? `${origenNombre} - ${destinoNombre}` : `Ruta ${itemClean}`);
        const frecuenciaTxt = match.frecuencia?.descripcion || match.frecuencia?.tipo || (match as any).frecuencia || 'DIARIO';
        const estadoRuta = (match.estado || (match.estaActivo !== false ? 'ACTIVA' : 'INACTIVA')).toUpperCase();
        const esActiva = estadoRuta === 'ACTIVA' || (estadoRuta !== 'CANCELADA' && estadoRuta !== 'INACTIVA' && match.estaActivo !== false);

        const partes = itinerarioTxt.includes('-') ? itinerarioTxt.split('-').map((p: string) => p.trim()) : [];
        const origFinal = origenNombre || (partes.length > 0 ? partes[0] : '-');
        const destFinal = destinoNombre || (partes.length > 1 ? partes[partes.length - 1] : '-');

        const displayItem: RutaDetalleDisplay = {
          codigo: match.codigoRuta || itemClean,
          nombre: itinerarioTxt,
          origen: origFinal,
          destino: destFinal,
          frecuencia: frecuenciaTxt,
          estado: estadoRuta,
          esActiva
        };

        if (esActiva) {
          activas.push(displayItem);
        } else {
          canceladas.push(displayItem);
        }
      } else {
        const partes = itemClean.includes('-') ? itemClean.split('-').map((p: string) => p.trim()) : [];
        activas.push({
          codigo: itemClean,
          nombre: itemClean.includes('-') ? itemClean : `Ruta ${itemClean}`,
          origen: partes.length > 0 ? partes[0] : '-',
          destino: partes.length > 1 ? partes[partes.length - 1] : '-',
          frecuencia: 'DIARIO',
          estado: 'ACTIVA',
          esActiva: true
        });
      }
    }

    for (const r of rutasEmpresa) {
      const cod = r.codigoRuta || '00';
      if (!codigosProcesados.has(cod)) {
        const est = (r.estado || (r.estaActivo !== false ? 'ACTIVA' : 'CANCELADA')).toUpperCase();
        const esCancelada = est === 'CANCELADA' || est === 'INACTIVA' || r.estaActivo === false;

        if (esCancelada) {
          codigosProcesados.add(cod);
          const origenNombre = r.origen?.nombre || (r as any).origenNombre || '';
          const destinoNombre = r.destino?.nombre || (r as any).destinoNombre || '';
          const itinerarioTxt = r.nombre || (r as any).descripcion || `Ruta ${cod}`;
          const frecuenciaTxt = r.frecuencia?.descripcion || r.frecuencia?.tipo || 'DIARIO';

          const partes = itinerarioTxt.includes('-') ? itinerarioTxt.split('-').map((p: string) => p.trim()) : [];

          canceladas.push({
            codigo: cod,
            nombre: itinerarioTxt,
            origen: origenNombre || (partes.length > 0 ? partes[0] : '-'),
            destino: destinoNombre || (partes.length > 1 ? partes[partes.length - 1] : '-'),
            frecuencia: frecuenciaTxt,
            estado: est,
            esActiva: false
          });
        }
      }
    }

    this.rutasActivas.set(activas);
    this.rutasCanceladas.set(canceladas);
  }

  private procesarFallbackRutas(): void {
    const codigos = this.data.rutas || [];
    const activas: RutaDetalleDisplay[] = codigos.map(c => {
      const str = String(c);
      const partes = str.includes('-') ? str.split('-').map((p: string) => p.trim()) : [];
      return {
        codigo: str,
        nombre: str.includes('-') ? str : `Ruta ${str}`,
        origen: partes.length > 0 ? partes[0] : '-',
        destino: partes.length > 1 ? partes[partes.length - 1] : '-',
        frecuencia: 'DIARIO',
        estado: 'ACTIVA',
        esActiva: true
      };
    });
    this.rutasActivas.set(activas);
    this.rutasCanceladas.set([]);
  }
}
