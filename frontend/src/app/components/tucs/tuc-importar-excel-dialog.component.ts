import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { TucService } from '../../services/tuc.service';

@Component({
  selector: 'app-tuc-importar-excel-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-title-box">
          <div class="header-icon-badge emerald-badge">
            <mat-icon class="icon-emerald">table_view</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title">Importación Masiva de TUCs (Excel)</h2>
            <p class="dialog-subtitle">Migración de archivo histórico de Tarjetas Únicas de Circulación</p>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" class="btn-close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Área de Selección de Archivo -->
      <div class="dropzone-box">
        <input type="file" #fileInput (change)="onFileSelected($event)" accept=".xlsx, .xls" class="hidden-input">
        
        <div class="dropzone-content">
          <div class="icon-circle">
            <mat-icon class="upload-icon">upload_file</mat-icon>
          </div>
          <div>
            <p class="filename-text">
              {{ archivoSeleccionado() ? archivoSeleccionado()?.name : 'Haz clic para seleccionar el archivo Excel' }}
            </p>
            <p class="hint-text">Soporta formatos .XLSX y .XLS con encabezados de migración</p>
          </div>
          <button type="button" (click)="fileInput.click()" class="btn-select-file">
            Seleccionar Archivo
          </button>
        </div>
      </div>

      <!-- Resumen de Columnas Esperadas -->
      <div class="info-cols-box">
        <span class="info-title">Columnas recomendadas en el Excel:</span>
        <div class="cols-grid">
          <span>• NRO_TUC</span>
          <span>• PLACA</span>
          <span>• RUC</span>
          <span>• NRO_RESOLUCION</span>
          <span>• FECHA_EMISION</span>
          <span>• FECHA_VENCIMIENTO</span>
          <span>• TIPO_EMISION</span>
          <span>• OBSERVACIONES</span>
        </div>
      </div>

      <!-- Progreso y Resultados -->
      @if (procesando()) {
        <div class="progress-box">
          <p class="progress-msg">
            <mat-icon class="spinner-icon">sync</mat-icon> Procesando y validando unicidad en base de datos...
          </p>
          <mat-progress-bar mode="indeterminate" color="accent"></mat-progress-bar>
        </div>
      }

      @if (resultado()) {
        <div class="results-box">
          <h4 class="results-title">Resumen de Importación</h4>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">Total Filas</span>
              <span class="stat-val text-white">{{ resultado()?.totalFilas }}</span>
            </div>
            <div class="stat-card bg-emerald">
              <span class="stat-label text-emerald">Exitosos</span>
              <span class="stat-val text-emerald">{{ resultado()?.exitosos }}</span>
            </div>
            <div class="stat-card bg-rose">
              <span class="stat-label text-rose">Fallidos</span>
              <span class="stat-val text-rose">{{ resultado()?.fallidos }}</span>
            </div>
          </div>

          @if (resultado()?.errores && (resultado()?.errores)!.length > 0) {
            <div class="errors-list">
              @for (err of resultado()?.errores; track err) {
                <p>• {{ err }}</p>
              }
            </div>
          }
        </div>
      }

      <div class="dialog-footer">
        <button type="button" (click)="cerrar()" class="btn-secondary">
          {{ resultado() ? 'Cerrar' : 'Cancelar' }}
        </button>
        @if (!resultado()) {
          <button type="button" [disabled]="!archivoSeleccionado() || procesando()" (click)="procesarArchivo()" class="btn-emerald">
            <mat-icon>upload</mat-icon> Iniciar Carga Masiva
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      background-color: #ffffff;
      color: #0f172a;
      padding: 24px;
      border-radius: 16px;
      max-width: 600px;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 20px;
    }

    .header-title-box { display: flex; align-items: center; gap: 14px; }

    .header-icon-badge {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 10px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-emerald { color: #059669; }
    .dialog-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
    .dialog-subtitle { font-size: 12px; color: #64748b; margin: 2px 0 0 0; }
    .btn-close { color: #64748b; }

    .dropzone-box {
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      background: #f8fafc;
      padding: 32px;
      text-align: center;
      margin-bottom: 16px;
      transition: all 0.2s;
    }
    .dropzone-box:hover {
      border-color: #10b981;
      background: #f0fdf4;
    }

    .hidden-input { display: none; }

    .dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .icon-circle {
      background: rgba(16, 185, 129, 0.15);
      color: #059669;
      padding: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .upload-icon { font-size: 32px; width: 32px; height: 32px; }

    .filename-text { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
    .hint-text { font-size: 11px; color: #64748b; margin: 4px 0 0 0; }

    .btn-select-file {
      background: #ffffff;
      color: #059669;
      border: 1px solid #10b981;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-select-file:hover { background: #f0fdf4; }

    .info-cols-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 16px;
    }

    .info-title { font-weight: 700; color: #334155; display: block; margin-bottom: 6px; }

    .cols-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
      font-family: monospace;
      font-size: 11px;
      color: #059669;
    }

    .progress-box { margin-bottom: 16px; }
    .progress-msg { font-size: 12px; color: #059669; display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }

    .spinner-icon { animation: spin 1s linear infinite; font-size: 16px; width: 16px; height: 16px; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .results-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 16px;
    }

    .results-title { font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0 0 10px 0; }

    .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; }

    .stat-card { background: #ffffff; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .stat-card.bg-emerald { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }
    .stat-card.bg-rose { background: rgba(244, 63, 94, 0.1); border-color: rgba(244, 63, 94, 0.2); }

    .stat-label { font-size: 11px; color: #64748b; display: block; }
    .stat-val { font-size: 18px; font-weight: 800; color: #0f172a; }
    .text-emerald { color: #059669; }
    .text-rose { color: #dc2626; }

    .errors-list {
      margin-top: 10px;
      max-height: 120px;
      overflow-y: auto;
      padding: 8px;
      background: rgba(244, 63, 94, 0.1);
      border-radius: 6px;
      font-size: 11px;
      color: #b91c1c;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-secondary:hover { background: #e2e8f0; }

    .btn-emerald {
      background: #10b981;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-emerald:hover:not(:disabled) { background: #059669; }
    .btn-emerald:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ========================================================
       DARK THEME OVERRIDES
       ======================================================== */
    :host-context([data-theme="dark"]),
    :host-context(.dark-theme) {
      .dialog-container {
        background-color: #0f172a;
        color: #f8fafc;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        border: 1px solid #1e293b;
      }
      .dialog-header { border-bottom-color: #1e293b; }
      .header-icon-badge {
        background: rgba(16, 185, 129, 0.15);
        border-color: rgba(16, 185, 129, 0.3);
      }
      .icon-emerald { color: #34d399; }
      .dialog-title { color: white; }
      .dialog-subtitle { color: #94a3b8; }
      .btn-close { color: #94a3b8; }
      .dropzone-box {
        border-color: #334155;
        background: #1e293b;
      }
      .dropzone-box:hover { border-color: #10b981; }
      .icon-circle {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
      }
      .filename-text { color: white; }
      .hint-text { color: #94a3b8; }
      .btn-select-file {
        background: #0f172a;
        color: #34d399;
        border-color: rgba(16, 185, 129, 0.4);
      }
      .info-cols-box {
        background: #1e293b;
        border-color: #334155;
        color: #94a3b8;
      }
      .info-title { color: #cbd5e1; }
      .cols-grid { color: #34d399; }
      .progress-msg { color: #34d399; }
      .results-box {
        background: #1e293b;
        border-color: #334155;
      }
      .results-title { color: white; }
      .stat-card {
        background: #0f172a;
        border-color: #334155;
      }
      .stat-card.bg-emerald { background: rgba(16, 185, 129, 0.1); }
      .stat-card.bg-rose { background: rgba(244, 63, 94, 0.1); }
      .stat-label { color: #94a3b8; }
      .stat-val { color: white; }
      .text-emerald { color: #34d399; }
      .text-rose { color: #f87171; }
      .errors-list {
        background: rgba(244, 63, 94, 0.1);
        color: #fca5a5;
      }
      .dialog-footer { border-top-color: #1e293b; }
      .btn-secondary {
        background: #1e293b;
        color: #cbd5e1;
        border-color: #334155;
      }
      .btn-secondary:hover { background: #334155; }
    }
  `]
})
export class TucImportarExcelDialogComponent {
  private tucService = inject(TucService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<TucImportarExcelDialogComponent>);

  archivoSeleccionado = signal<File | null>(null);
  procesando = signal<boolean>(false);
  resultado = signal<{ totalFilas: number; exitosos: number; fallidos: number; errores: string[] } | null>(null);

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
      this.resultado.set(null);
    }
  }

  procesarArchivo(): void {
    const file = this.archivoSeleccionado();
    if (!file) return;

    this.procesando.set(true);
    this.tucService.cargaMasivaExcel(file).subscribe({
      next: (res) => {
        this.procesando.set(false);
        this.resultado.set(res);
        this.snackBar.open(`Importación finalizada: ${res.exitosos} registros procesados correctamente.`, 'OK', { duration: 4000 });
      },
      error: (err) => {
        this.procesando.set(false);
        this.snackBar.open(`Error en carga masiva: ${err?.error?.detail || err.message}`, 'Cerrar', { duration: 5000 });
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(this.resultado() ? true : false);
  }
}
