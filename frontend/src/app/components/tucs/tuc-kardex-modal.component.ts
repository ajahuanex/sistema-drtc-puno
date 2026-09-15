import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TucService } from '../../services/tuc.service';
import { TucKardexStock } from '../../models/tuc.model';

@Component({
  selector: 'app-tuc-kardex-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-title-box">
          <div class="header-icon-badge amber-badge">
            <mat-icon class="icon-amber">inventory_2</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title">Kárdex de Especies Valoradas</h2>
            <p class="dialog-subtitle">Control de stock e inventario de cartulinas físicas TUC</p>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" class="btn-close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Lotes Activos -->
      <div class="lotes-card">
        <h3 class="section-subtitle">Lotes de Cartulinas Registrados</h3>
        @if (cargando()) {
          <p class="status-msg">Cargando inventario...</p>
        } @else if (lotes().length === 0) {
          <p class="status-msg warning">No hay lotes de cartulinas físicas registrados en Kárdex.</p>
        } @else {
          <div class="lotes-list">
            @for (lote of lotes(); track lote.id || lote.nroLote) {
              <div class="lote-item">
                <div>
                  <span class="lote-name">Lote {{ lote.nroLote }}</span>
                  <span class="lote-series">Series: {{ lote.serieInicio }} - {{ lote.serieFin }}</span>
                </div>
                <span class="lote-stock-badge">
                  Disp: {{ lote.disponibles }} / {{ lote.totalImpresos }}
                </span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Formulario para agregar nuevo lote -->
      <form [formGroup]="form" (ngSubmit)="guardarLote()" class="dialog-form">
        <h3 class="form-section-title">
          <mat-icon class="icon-sm">add_box</mat-icon> Ingresar Nuevo Lote de Especies Valoradas
        </h3>
        
        <div class="form-row grid-2">
          <div class="form-group">
            <label class="form-label">N° de Lote / Guía Remisión <span class="required">*</span></label>
            <input formControlName="nroLote" type="text" placeholder="Ej: LOTE-2025-01" class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Total Cartulinas Impresas <span class="required">*</span></label>
            <input formControlName="totalImpresos" type="number" min="1" placeholder="Ej: 500" class="form-input">
          </div>
        </div>

        <div class="form-row grid-2">
          <div class="form-group">
            <label class="form-label">Serie Inicial <span class="required">*</span></label>
            <input formControlName="serieInicio" type="text" placeholder="Ej: TF-000100" class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Serie Final <span class="required">*</span></label>
            <input formControlName="serieFin" type="text" placeholder="Ej: TF-000599" class="form-input">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Observaciones</label>
          <textarea formControlName="observaciones" rows="2" placeholder="Detalles de la recepción..." class="form-textarea"></textarea>
        </div>

        <div class="dialog-footer">
          <button type="button" (click)="cerrar()" class="btn-secondary">
            Cancelar
          </button>
          <button type="submit" [disabled]="form.invalid || guardando()" class="btn-amber">
            <mat-icon>save</mat-icon> Registrar en Kárdex
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 24px;
      border-radius: 16px;
      max-width: 600px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid #1e293b;
      margin-bottom: 16px;
    }

    .header-title-box { display: flex; align-items: center; gap: 14px; }

    .header-icon-badge {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 10px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-amber { color: #fbbf24; }

    .dialog-title { font-size: 18px; font-weight: 800; color: white; margin: 0; }
    .dialog-subtitle { font-size: 12px; color: #94a3b8; margin: 2px 0 0 0; }
    .btn-close { color: #94a3b8; }

    .lotes-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 16px;
    }

    .section-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      margin: 0 0 10px 0;
    }

    .status-msg { font-size: 12px; color: #94a3b8; margin: 0; }
    .status-msg.warning { color: #fbbf24; }

    .lotes-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 160px;
      overflow-y: auto;
    }

    .lote-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #334155;
      font-size: 12px;
    }

    .lote-name { font-weight: 800; color: #fbbf24; margin-right: 8px; }
    .lote-series { color: #94a3b8; }

    .lote-stock-badge {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
    }

    .dialog-form { display: flex; flex-direction: column; gap: 14px; }
    .form-section-title {
      font-size: 13px;
      font-weight: 800;
      color: #fbbf24;
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
    }

    .form-row { display: grid; gap: 12px; }
    .grid-2 { grid-template-columns: 1fr 1fr; }

    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 12px; font-weight: 700; color: #cbd5e1; }
    .required { color: #f43f5e; }

    .form-input, .form-textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      color: white;
      font-size: 13px;
      outline: none;
    }

    .form-input:focus, .form-textarea:focus { border-color: #fbbf24; }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid #1e293b;
    }

    .btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }

    .btn-amber {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }
    .btn-amber:hover:not(:disabled) { background: #fbbf24; }
    .btn-amber:disabled { opacity: 0.5; cursor: not-allowed; }

    .icon-sm { font-size: 16px; width: 16px; height: 16px; }
  `]
})
export class TucKardexModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tucService = inject(TucService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<TucKardexModalComponent>);

  lotes = signal<TucKardexStock[]>([]);
  cargando = signal<boolean>(true);
  guardando = signal<boolean>(false);

  form = this.fb.group({
    nroLote: ['', Validators.required],
    totalImpresos: [500, [Validators.required, Validators.min(1)]],
    serieInicio: ['', Validators.required],
    serieFin: ['', Validators.required],
    observaciones: ['']
  });

  ngOnInit(): void {
    this.cargarLotes();
  }

  cargarLotes(): void {
    this.cargando.set(true);
    this.tucService.getLotesKardex().subscribe({
      next: (res) => {
        this.lotes.set(res);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  guardarLote(): void {
    if (this.form.invalid) return;

    this.guardando.set(true);
    const val = this.form.value;
    
    this.tucService.registrarLoteKardex({
      nroLote: val.nroLote!,
      totalImpresos: Number(val.totalImpresos),
      serieInicio: val.serieInicio!,
      serieFin: val.serieFin!,
      observaciones: val.observaciones || undefined
    }).subscribe({
      next: () => {
        this.snackBar.open('Lote de Kárdex registrado exitosamente', 'OK', { duration: 3000 });
        this.form.reset({ totalImpresos: 500 });
        this.guardando.set(false);
        this.cargarLotes();
      },
      error: (err) => {
        this.snackBar.open(`Error: ${err?.error?.detail || err.message}`, 'Cerrar', { duration: 4000 });
        this.guardando.set(false);
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
