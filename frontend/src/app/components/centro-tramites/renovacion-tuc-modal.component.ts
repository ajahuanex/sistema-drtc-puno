import { Component, Inject, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TucService } from '../../services/tuc.service';
import { GenerarTucDialogComponent } from '../vehiculos-empresa/generar-tuc-dialog.component';
import { environment } from '../../../environments/environment';

export interface VehiculoTucInfo {
  placa: string;
  numero_tuc?: string;
  orden?: number;
  marca?: string;
  modelo?: string;
  anio_fabricacion?: number;
  categoria?: string;
  color?: string;
  rutas?: string[];
  estado?: string;
}

export interface RenovacionTucModalData {
  nro_resolucion: string;
  ruc: string;
  razon_social: string;
  fecha_emision?: string;
  fecha_inicio_vigencia?: string;
  fecha_fin_vigencia?: string;
  duracion_anios?: number;
  vehiculos: VehiculoTucInfo[];
}

@Component({
  selector: 'app-renovacion-tuc-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="renovacion-tuc-dialog">
      <!-- HEADER -->
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon-badge">
            <mat-icon>print</mat-icon>
          </div>
          <div>
            <div class="badge-tag">
              <mat-icon style="font-size: 13px; width: 13px; height: 13px;">autorenew</mat-icon>
              Trámite de Renovación Procesado
            </div>
            <h2 class="modal-title">Emisión e Impresión de TUCs Oficiales</h2>
            <p class="modal-subtitle">
              Resolución: <strong>{{ data.nro_resolucion }}</strong> &bull; 
              Empresa: <strong>{{ data.razon_social }}</strong> (RUC: {{ data.ruc }})
            </p>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" class="btn-close" matTooltip="Cerrar ventana">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- STATS RIBBON -->
      <div class="stats-ribbon">
        <div class="stat-pill">
          <mat-icon style="color: #0284c7;">directions_bus</mat-icon>
          <span>Vehículos Renovados: <strong>{{ data.vehiculos.length }}</strong></span>
        </div>
        @if (rangoTucs()) {
          <div class="stat-pill">
            <mat-icon style="color: #059669;">badge</mat-icon>
            <span>Rango de TUCs: <strong>{{ rangoTucs() }}</strong></span>
          </div>
        }
        @if (data.fecha_inicio_vigencia && data.fecha_fin_vigencia) {
          <div class="stat-pill">
            <mat-icon style="color: #d97706;">event_available</mat-icon>
            <span>Vigencia: <strong>{{ data.fecha_inicio_vigencia | slice:0:10 }} al {{ data.fecha_fin_vigencia | slice:0:10 }}</strong></span>
          </div>
        }
      </div>

      <!-- ACTIONS BAR -->
      <div class="actions-bar">
        <div class="search-box">
          <mat-icon class="search-icon">search</mat-icon>
          <input 
            type="text" 
            placeholder="Filtrar por placa, TUC, marca..." 
            [(ngModel)]="filtroTexto" 
            (input)="onFiltroChange($event)"
            class="search-input"
          />
          @if (filtroTexto) {
            <button mat-icon-button class="clear-btn" (click)="limpiarFiltro()">
              <mat-icon style="font-size: 16px;">close</mat-icon>
            </button>
          }
        </div>

        <div class="batch-buttons">
          @if (data.vehiculos.length > 1) {
            <button mat-flat-button class="btn-batch-print" (click)="imprimirLoteA4()" matTooltip="Imprime todas las TUCs en un solo documento continuo A4">
              <mat-icon>print</mat-icon>
              <span>Imprimir Lote Completo ({{ data.vehiculos.length }} TUCs)</span>
            </button>
          }
          <button mat-stroked-button class="btn-notif" (click)="imprimirNotificacion()" matTooltip="Genera la Cédula de Notificación de Resolución en A4">
            <mat-icon>assignment</mat-icon>
            <span>Cédula de Notificación</span>
          </button>
        </div>
      </div>

      <!-- BODY: VEHICLES LIST -->
      <div class="modal-body">
        @if (vehiculosFiltrados().length === 0) {
          <div class="empty-state">
            <mat-icon>search_off</mat-icon>
            <p>No se encontraron vehículos que coincidan con "{{ filtroTexto }}"</p>
          </div>
        } @else {
          <div class="vehicles-table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">#</th>
                  <th style="width: 110px;">Placa</th>
                  <th style="width: 140px;">Número TUC</th>
                  <th>Datos Técnicos</th>
                  <th>Rutas Ratificadas</th>
                  <th style="width: 320px; text-align: center;">Acciones de Impresión</th>
                </tr>
              </thead>
              <tbody>
                @for (v of vehiculosFiltrados(); track v.placa; let i = $index) {
                  <tr class="vehicle-row">
                    <td class="text-center text-muted font-mono">{{ v.orden || (i + 1) }}</td>
                    
                    <!-- PLACA -->
                    <td>
                      <span class="placa-badge">{{ v.placa }}</span>
                    </td>

                    <!-- NRO TUC -->
                    <td>
                      @if (v.numero_tuc) {
                        <span class="tuc-badge">
                          <mat-icon style="font-size: 14px; width: 14px; height: 14px; margin-right: 4px;">badge</mat-icon>
                          {{ v.numero_tuc }}
                        </span>
                      } @else {
                        <span class="badge-sin-tuc">S/N</span>
                      }
                    </td>

                    <!-- DATOS TÉCNICOS -->
                    <td>
                      <div class="tech-info">
                        <span class="tech-main">{{ v.marca || 'S/M' }} {{ v.modelo || '' }}</span>
                        <span class="tech-sub">
                          {{ v.categoria || 'M2' }} &bull; Año: {{ v.anio_fabricacion || '-' }} &bull; {{ v.color || '' }}
                        </span>
                      </div>
                    </td>

                    <!-- RUTAS -->
                    <td>
                      <div class="rutas-chips">
                        @if (v.rutas && v.rutas.length > 0) {
                          @for (r of v.rutas; track r) {
                            <span class="chip-ruta">Ruta {{ r }}</span>
                          }
                        } @else {
                          <span class="text-muted" style="font-size: 12px; font-style: italic;">Todas las autorizadas</span>
                        }
                      </div>
                    </td>

                    <!-- ACCIONES -->
                    <td class="text-center">
                      <div class="actions-group">
                        <!-- Imprimir Plantilla Oficial Completa -->
                        <button 
                          mat-flat-button 
                          class="btn-action-primary" 
                          (click)="abrirGenerarTuc(v)"
                          matTooltip="Abre la plantilla oficial: tarjeta física, configuración de márgenes, Google Docs">
                          <mat-icon>print</mat-icon>
                          <span>Plantilla Oficial</span>
                        </button>

                        <!-- Vista Directa A4 (Ctrl+P) -->
                        <button 
                          mat-stroked-button 
                          class="btn-action-secondary" 
                          (click)="imprimirTucA4(v.placa)"
                          matTooltip="Abre la vista completa A4 con anverso y reverso para imprimir">
                          <mat-icon>open_in_new</mat-icon>
                          <span>Vista A4</span>
                        </button>

                        <!-- Descargar Word -->
                        <button 
                          mat-icon-button 
                          class="btn-icon-word" 
                          (click)="descargarWord(v.placa)"
                          [disabled]="descargandoWord()[v.placa]"
                          matTooltip="Descargar plantilla en Word (.docx)">
                          @if (descargandoWord()[v.placa]) {
                            <mat-spinner diameter="16"></mat-spinner>
                          } @else {
                            <mat-icon>description</mat-icon>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <div class="footer-note">
          <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #0284c7;">info</mat-icon>
          <span>Las TUCs han sido registradas en el catálogo oficial y habilitadas para esta empresa.</span>
        </div>
        <button mat-raised-button color="primary" class="btn-footer-close" (click)="cerrar()">
          <mat-icon>done</mat-icon>
          <span>Finalizar y Ver Historial</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .renovacion-tuc-dialog {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      background: #0f172a;
      color: #f8fafc;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }

    /* HEADER */
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .header-icon-badge {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
    }
    .badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      color: #ffffff;
      letter-spacing: -0.3px;
    }
    .modal-subtitle {
      font-size: 0.85rem;
      color: #94a3b8;
      margin: 2px 0 0 0;
    }
    .btn-close {
      color: #94a3b8;
      &:hover { color: #f8fafc; background: rgba(255, 255, 255, 0.05); }
    }

    /* STATS RIBBON */
    .stats-ribbon {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      padding: 0.75rem 1.5rem;
      background: rgba(15, 23, 42, 0.7);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .stat-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.04);
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      strong { color: #f8fafc; }
    }

    /* ACTIONS BAR */
    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      padding: 1rem 1.5rem 0.5rem 1.5rem;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      min-width: 260px;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0 8px;
    }
    .search-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #64748b;
      margin-right: 6px;
    }
    .search-input {
      background: transparent;
      border: none;
      outline: none;
      color: #f8fafc;
      font-size: 0.85rem;
      width: 100%;
      padding: 7px 0;
      &::placeholder { color: #64748b; }
    }
    .clear-btn {
      width: 24px;
      height: 24px;
      line-height: 24px;
      color: #94a3b8;
    }
    .batch-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn-batch-print {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff !important;
      font-weight: 600;
      font-size: 0.85rem;
      border-radius: 8px;
      padding: 0 16px;
      height: 38px;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
      mat-icon { margin-right: 4px; font-size: 18px; width: 18px; height: 18px; }
      &:hover { filter: brightness(1.1); }
    }
    .btn-notif {
      border-color: rgba(2, 132, 199, 0.4) !important;
      color: #38bdf8 !important;
      font-weight: 500;
      font-size: 0.85rem;
      border-radius: 8px;
      height: 38px;
      mat-icon { margin-right: 4px; font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: rgba(2, 132, 199, 0.1); }
    }

    /* BODY TABLE */
    .modal-body {
      padding: 0.5rem 1.5rem 1rem 1.5rem;
      overflow-y: auto;
      max-height: calc(85vh - 220px);
    }
    .vehicles-table-container {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      overflow: hidden;
    }
    .custom-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;

      thead th {
        background: #0f172a;
        color: #94a3b8;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 0.75rem;
        padding: 10px 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      tbody tr.vehicle-row {
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        transition: background 0.15s ease;
        &:hover { background: rgba(255, 255, 255, 0.03); }
        &:last-child { border-bottom: none; }
      }

      td {
        padding: 10px 14px;
        vertical-align: middle;
      }
    }

    .placa-badge {
      display: inline-block;
      font-family: 'Roboto Mono', monospace, sans-serif;
      font-size: 0.92rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #ffffff;
      background: #0284c7;
      padding: 3px 8px;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
    }

    .tuc-badge {
      display: inline-flex;
      align-items: center;
      font-family: 'Roboto Mono', monospace, sans-serif;
      font-size: 0.82rem;
      font-weight: 700;
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 3px 8px;
      border-radius: 6px;
    }

    .badge-sin-tuc {
      font-size: 0.8rem;
      color: #94a3b8;
      font-style: italic;
    }

    .tech-info {
      display: flex;
      flex-direction: column;
    }
    .tech-main {
      font-weight: 600;
      color: #f1f5f9;
    }
    .tech-sub {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .rutas-chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .chip-ruta {
      font-size: 0.72rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.06);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* ACCIONES DE CADA VEHÍCULO */
    .actions-group {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .btn-action-primary {
      background: #0284c7;
      color: #ffffff !important;
      font-size: 0.78rem;
      font-weight: 600;
      border-radius: 6px;
      padding: 0 10px;
      height: 32px;
      line-height: 32px;
      mat-icon { font-size: 15px; width: 15px; height: 15px; margin-right: 4px; }
      &:hover { background: #0369a1; }
    }
    .btn-action-secondary {
      border-color: rgba(255, 255, 255, 0.2) !important;
      color: #cbd5e1 !important;
      font-size: 0.78rem;
      font-weight: 500;
      border-radius: 6px;
      padding: 0 8px;
      height: 32px;
      line-height: 32px;
      mat-icon { font-size: 15px; width: 15px; height: 15px; margin-right: 3px; }
      &:hover { background: rgba(255, 255, 255, 0.06); color: #ffffff !important; }
    }
    .btn-icon-word {
      width: 32px;
      height: 32px;
      line-height: 32px;
      color: #38bdf8;
      &:hover { background: rgba(56, 189, 248, 0.15); }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .empty-state {
      padding: 3rem 1rem;
      text-align: center;
      color: #64748b;
      mat-icon { font-size: 42px; width: 42px; height: 42px; margin-bottom: 0.5rem; }
      p { margin: 0; font-size: 0.95rem; }
    }

    /* FOOTER */
    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #0f172a;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .footer-note {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .btn-footer-close {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      font-weight: 600;
      border-radius: 8px;
      padding: 0 20px;
      height: 40px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      mat-icon { margin-right: 4px; }
      &:hover { filter: brightness(1.1); }
    }
  `]
})
export class RenovacionTucModalComponent {
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<RenovacionTucModalComponent>);
  private tucService = inject(TucService);
  private snackBar = inject(MatSnackBar);

  filtroTexto = '';
  descargandoWord = signal<Record<string, boolean>>({});

  constructor(@Inject(MAT_DIALOG_DATA) public data: RenovacionTucModalData) {}

  onFiltroChange(event: any) {
    this.filtroTexto = (event.target.value || '').trim();
  }

  limpiarFiltro() {
    this.filtroTexto = '';
  }

  vehiculosFiltrados = computed(() => {
    const list = this.data.vehiculos || [];
    const q = this.filtroTexto.trim().toUpperCase();
    if (!q) return list;
    return list.filter(v =>
      (v.placa && v.placa.toUpperCase().includes(q)) ||
      (v.numero_tuc && v.numero_tuc.toUpperCase().includes(q)) ||
      (v.marca && v.marca.toUpperCase().includes(q)) ||
      (v.modelo && v.modelo.toUpperCase().includes(q))
    );
  });

  rangoTucs = computed(() => {
    const tucs = this.data.vehiculos
      .map(v => v.numero_tuc)
      .filter((t): t is string => !!t && t !== 'S/N');
    if (tucs.length === 0) return '';
    if (tucs.length === 1) return tucs[0];
    return `${tucs[0]} al ${tucs[tucs.length - 1]}`;
  });

  abrirGenerarTuc(v: VehiculoTucInfo) {
    const vehiculoParam: any = {
      id: v.placa,
      placa: v.placa,
      numero_tuc: v.numero_tuc,
      ruc: this.data.ruc,
      razon_social: this.data.razon_social,
      nro_resolucion_primigenia: this.data.nro_resolucion,
      fecha_emision_resolucion: this.data.fecha_emision,
      marca: v.marca,
      modelo: v.modelo,
      anio_fabricacion: v.anio_fabricacion,
      color: v.color,
      categoria: v.categoria || 'M2',
      estado: 'HABILITADO'
    };

    this.dialog.open(GenerarTucDialogComponent, {
      data: { vehiculo: vehiculoParam },
      width: '1020px',
      maxWidth: '96vw',
      panelClass: 'glass-dialog-panel'
    });
  }

  imprimirTucA4(placa: string) {
    const url = `${environment.apiUrl}/tucs/vista-impresion/${encodeURIComponent(placa)}`;
    window.open(url, '_blank');
    this.snackBar.open(`Vista A4 para ${placa} abierta en nueva pestaña. Use Ctrl+P para imprimir.`, 'OK', { duration: 3500 });
  }

  imprimirNotificacion(placa?: string) {
    const targetPlaca = placa || this.data.vehiculos[0]?.placa;
    if (!targetPlaca) {
      this.snackBar.open('No hay vehículos para generar la notificación.', 'Cerrar', { duration: 3000 });
      return;
    }
    const url = `${environment.apiUrl}/tucs/vista-impresion-notificacion/${encodeURIComponent(targetPlaca)}`;
    window.open(url, '_blank');
    this.snackBar.open('Cédula de Notificación abierta en nueva pestaña. Use Ctrl+P para imprimir.', 'OK', { duration: 3500 });
  }

  imprimirLoteA4() {
    const placas = this.data.vehiculos.map(v => v.placa.trim().toUpperCase()).filter(Boolean).join(',');
    if (!placas) {
      this.snackBar.open('No hay placas válidas para la impresión de lote.', 'Cerrar', { duration: 3000 });
      return;
    }
    const url = `${environment.apiUrl}/tucs/vista-impresion-lote?placas=${encodeURIComponent(placas)}`;
    window.open(url, '_blank');
    this.snackBar.open(`Lote de ${this.data.vehiculos.length} TUCs abierto en nueva pestaña. Presione Ctrl+P para imprimir todo el lote.`, 'OK', { duration: 4500 });
  }

  descargarWord(placa: string) {
    this.descargandoWord.update(m => ({ ...m, [placa]: true }));

    this.tucService.descargarDocxTuc(placa).subscribe({
      next: (blob) => {
        this.descargandoWord.update(m => ({ ...m, [placa]: false }));
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `TUC_${placa.replace('-', '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        this.snackBar.open(`✓ Plantilla Word de ${placa} descargada exitosamente`, 'OK', { duration: 3500 });
      },
      error: (err) => {
        this.descargandoWord.update(m => ({ ...m, [placa]: false }));
        const msg = err?.error?.detail || 'Error al descargar documento Word.';
        this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 4000 });
      }
    });
  }

  cerrar() {
    this.dialogRef.close();
  }
}
