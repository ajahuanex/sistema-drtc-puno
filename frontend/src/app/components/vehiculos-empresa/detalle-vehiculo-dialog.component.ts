import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { VehiculoEmpresa } from '../../services/flota-empresa.service';

@Component({
  selector: 'app-detalle-vehiculo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="detalle-dialog-container">
      <div class="dialog-header">
        <h2>
          <mat-icon>directions_car</mat-icon>
          Detalle del Registro Vehicular
        </h2>
        <button mat-icon-button (click)="cerrar()" style="color:#fff;">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-body" style="padding: 24px; max-height: 75vh; overflow-y: auto;">
        <!-- INFORMACIÓN PRINCIPAL -->
        <div style="display:flex; gap:12px; align-items:center; margin-bottom:20px; flex-wrap:wrap;">
          <span style="background:#1e1b4b; color:#fff; font-size:18px; font-weight:800; padding:6px 14px; border-radius:8px; letter-spacing:0.05em;">
            {{ data.placa }}
          </span>
          <span [class]="'status-pill status-' + (data.estado || 'sin-datos').toLowerCase()" style="font-size:13px; padding:4px 12px;">
            {{ data.estado || 'SIN ESTADO' }}
          </span>
          @if (data.numero_tuc) {
            <span style="background:linear-gradient(135deg, #7c3aed, #4f46e5); color:#fff; font-size:13px; font-weight:700; padding:4px 12px; border-radius:8px;">
              TUC: {{ data.numero_tuc }}
            </span>
          }
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-bottom:20px;">
          <div class="detail-card">
            <div class="detail-label">Empresa / RUC</div>
            <div class="detail-value">{{ data.razon_social || 'SIN RAZÓN SOCIAL' }}</div>
            <div style="font-size:12px; color:#64748b; font-family:monospace; margin-top:2px;">RUC: {{ data.ruc }}</div>
          </div>

          <div class="detail-card">
            <div class="detail-label">Resolución Primigenia</div>
            <div class="detail-value" style="color:#16a34a; font-family:monospace;">
              {{ data.nro_resolucion_primigenia || '-' }}
            </div>
            <div style="font-size:11px; margin-top:3px;">
              Estado:
              <strong [style.color]="(data.estado_primigenia === 'CANCELADA' || data.estado_primigenia === 'INACTIVA') ? '#dc2626' : '#16a34a'">
                {{ data.estado_primigenia || 'VIGENTE' }}
              </strong>
            </div>
            @if (data.fecha_vigencia_hasta) {
              <div style="font-size:11px; color:#64748b; margin-top:2px;">
                Vigencia Hasta: <strong>{{ data.fecha_vigencia_hasta | date:'dd/MM/yyyy' }}</strong>
              </div>
            }
          </div>

          <div class="detail-card">
            <div class="detail-label">Resolución Hija</div>
            <div class="detail-value" style="color:#b45309; font-family:monospace;">
              {{ data.nro_resolucion_hija || 'Sin Res. Hija' }}
            </div>
            @if (data.tipo_resolucion_hija) {
              <div style="font-size:11px; color:#64748b; margin-top:2px;">
                Tipo: <strong>{{ getTipoHijaNombre(data.tipo_resolucion_hija) }}</strong>
              </div>
            }
            @if (data.fecha_resolucion_hija) {
              <div style="font-size:11px; color:#64748b; margin-top:2px;">
                Fecha Res: {{ data.fecha_resolucion_hija | date:'dd/MM/yyyy' }}
              </div>
            }
          </div>

          <div class="detail-card">
            <div class="detail-label">Expediente y Fecha</div>
            <div class="detail-value" style="font-family:monospace;">
              {{ data.expediente || data.num_expediente || 'Sin expediente' }}
            </div>
            @if (data.fecha_expediente) {
              <div style="font-size:11px; color:#64748b; margin-top:2px;">
                Fecha Exp: {{ data.fecha_expediente | date:'dd/MM/yyyy' }}
              </div>
            }
          </div>
        </div>

        <!-- RUTAS Y LINKS -->
        <mat-divider style="margin:20px 0;"></mat-divider>
        <h4 style="margin:0 0 12px; font-size:14px; font-weight:700; color:#334155; display:flex; align-items:center; gap:8px;">
          <mat-icon style="color:#3b82f6;">alt_route</mat-icon> Rutas Asignadas y Documentos Digitales
        </h4>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-bottom:20px;">
          <div class="detail-card">
            <div class="detail-label">Rutas Habilitadas</div>
            @if (data.rutas && data.rutas.length) {
              <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:6px;">
                @for (r of data.rutas; track r) {
                  <span style="background:#eff6ff; color:#2563eb; font-weight:700; font-size:12px; padding:3px 8px; border-radius:4px;">
                    {{ r }}
                  </span>
                }
              </div>
            } @else {
              <span style="color:#cbd5e1; font-style:italic;">No hay rutas asociadas</span>
            }
          </div>

          <div class="detail-card">
            <div class="detail-label">Enlaces a Google Drive / Documentos</div>
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:6px;">
              @if (data.link_tuc) {
                <a [href]="data.link_tuc" target="_blank" style="display:inline-flex; align-items:center; gap:6px; color:#2563eb; font-size:13px; font-weight:600; text-decoration:none;">
                  <mat-icon style="font-size:18px;">description</mat-icon> Abrir TUC en Google Drive
                </a>
              }
              @if (data.link_notificacion) {
                <a [href]="data.link_notificacion" target="_blank" style="display:inline-flex; align-items:center; gap:6px; color:#7c3aed; font-size:13px; font-weight:600; text-decoration:none;">
                  <mat-icon style="font-size:18px;">mark_email_read</mat-icon> Abrir Notificación en Drive
                </a>
              }
              @if (!data.link_tuc && !data.link_notificacion) {
                <span style="color:#cbd5e1; font-style:italic;">Sin enlaces adjuntos</span>
              }
            </div>
          </div>
        </div>

        <!-- DETALLES Y OBSERVACIONES HISTORIAL -->
        @if (data.detalles || (data.observaciones_historial && data.observaciones_historial.length)) {
          <mat-divider style="margin:20px 0;"></mat-divider>
          <h4 style="margin:0 0 12px; font-size:14px; font-weight:700; color:#334155; display:flex; align-items:center; gap:8px;">
            <mat-icon style="color:#d97706;">history</mat-icon> Historial de Observaciones y Notas
          </h4>

          @if (data.detalles) {
            <div class="detail-card" style="margin-bottom:12px;">
              <div class="detail-label">Detalles Adicionales</div>
              <div style="font-size:13px; color:#334155; font-style:italic;">{{ data.detalles }}</div>
            </div>
          }

          @if (data.observaciones_historial && data.observaciones_historial.length) {
            <div class="obs-timeline">
              @for (obs of data.observaciones_historial; track obs.fecha) {
                <div class="obs-item">
                  <div class="obs-header">
                    <span><strong>{{ obs.usuario || 'Sistema' }}</strong></span>
                    <span>{{ obs.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <div class="obs-body">{{ obs.texto }}</div>
                </div>
              }
            </div>
          }
        }
      </div>

      <div mat-dialog-actions align="end" style="padding:16px 24px; background:#f8fafc; border-top:1px solid #e2e8f0;">
        <button mat-flat-button color="primary" (click)="cerrar()">Cerrar</button>
      </div>
    </div>
  `
})
export class DetalleVehiculoDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VehiculoEmpresa,
    private dialogRef: MatDialogRef<DetalleVehiculoDialogComponent>
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }

  getTipoHijaNombre(tipo?: string): string {
    const map: Record<string, string> = {
      I: 'Incremento', S: 'Sustitución', M: 'Modificación', O: 'Otros', C: 'Cancelación'
    };
    return tipo ? (map[tipo] || tipo) : '';
  }
}
