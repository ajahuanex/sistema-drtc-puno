import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TucService } from '../../services/tuc.service';
import { TipoEmisionTuc, MotivoEmision, TucKardexStock } from '../../models/tuc.model';

@Component({
  selector: 'app-tuc-emitir-dialog',
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
      
      <!-- Encabezado del Modal -->
      <div class="dialog-header">
        <div class="header-title-box">
          <div class="header-icon-badge">
            <mat-icon class="icon-blue">card_membership</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title">Emitir Tarjeta Única de Circulación</h2>
            <p class="dialog-subtitle">Título habilitante otorgado por la DRTC Puno (D.S. N° 017-2009-MTC)</p>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" class="btn-close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="dialog-form">
        
        <!-- Seleccionar Tipo de Emisión y Motivo -->
        <div class="form-row grid-2">
          <div class="form-group">
            <label class="form-label">Tipo de Emisión <span class="required">*</span></label>
            <select formControlName="tipoEmision" (change)="onTipoEmisionChange()" class="form-select">
              <option value="ELECTRONICA">⚡ ELECTRÓNICA (Digital SHA-256 + QR)</option>
              <option value="FISICA">📜 FÍSICA (Cartulina de Seguridad Kárdex)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Motivo de Emisión <span class="required">*</span></label>
            <select formControlName="motivoEmision" class="form-select">
              <option value="AUTORIZACION_NUEVA">AUTORIZACIÓN NUEVA</option>
              <option value="RENOVACION">RENOVACIÓN</option>
              <option value="INCREMENTO_FLOTA">INCREMENTO DE FLOTA</option>
              <option value="SUSTITUCION_VEHICULAR">SUSTITUCIÓN VEHICULAR</option>
              <option value="CANJE_A_ELECTRONICA">CANJE A ELECTRÓNICA</option>
            </select>
          </div>
        </div>

        <!-- Número de TUC con validación de Unicidad -->
        <div class="unicidad-card">
          <div class="unicidad-header">
            <label class="unicidad-label">
              <mat-icon class="icon-sm">verified</mat-icon> N° de TUC (Correlativo Único MTC) <span class="required">*</span>
            </label>
            @if (form.get('tipoEmision')?.value === 'ELECTRONICA') {
              <button type="button" (click)="generarSiguienteCorrelativo()" class="btn-auto-gen">
                ↻ Auto-Generar TE-XXXXXX
              </button>
            }
          </div>
          
          <div class="unicidad-input-wrapper">
            <input formControlName="nroTuc" (blur)="validarUnicidad()" type="text" placeholder="Ej: TE-000001 o TF-000123" 
                   class="form-input input-mono"
                   [ngClass]="{
                     'border-success': unicidadValida() === true,
                     'border-danger': unicidadValida() === false
                   }">
          </div>

          @if (validandoUnicidad()) {
            <p class="status-msg text-slate">Verificando unicidad en MongoDB DRTC Puno...</p>
          } @else if (unicidadValida() === true) {
            <p class="status-msg text-success">
              <mat-icon class="icon-xs">check_circle</mat-icon> Número disponible para registro.
            </p>
          } @else if (unicidadValida() === false) {
            <p class="status-msg text-danger">
              <mat-icon class="icon-xs">error</mat-icon> {{ mensajeUnicidad() }}
            </p>
          }
        </div>

        <!-- Campos adicionales si es Física -->
        @if (form.get('tipoEmision')?.value === 'FISICA') {
          <div class="kardex-section">
            <h4 class="kardex-title">Vinculación a Kárdex Físico</h4>
            <div class="form-row grid-2">
              <div class="form-group">
                <label class="form-label">Lote de Cartulinas</label>
                <select formControlName="loteKardexId" class="form-select">
                  <option [value]="null">-- Seleccionar Lote --</option>
                  @for (lote of lotesKardex(); track lote.id) {
                    <option [value]="lote.id">Lote {{ lote.nroLote }} (Disp: {{ lote.disponibles }})</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Serie Impresa Físicamente</label>
                <input formControlName="serieFisica" type="text" placeholder="Ej: TF-000452" class="form-input">
              </div>
            </div>
          </div>
        }

        <!-- Placa, RUC, Resolución -->
        <div class="form-row grid-3">
          <div class="form-group">
            <label class="form-label">Placa Vehicular <span class="required">*</span></label>
            <input formControlName="placa" type="text" placeholder="Ej: Z1A-123" class="form-input input-uppercase input-mono">
          </div>
          <div class="form-group">
            <label class="form-label">RUC Empresa <span class="required">*</span></label>
            <input formControlName="ruc" type="text" placeholder="Ej: 20123456789" class="form-input input-mono">
          </div>
          <div class="form-group">
            <label class="form-label">N° Resolución <span class="required">*</span></label>
            <input formControlName="nroResolucion" type="text" placeholder="Ej: 0123-2024-DRTC/PUNO" class="form-input input-uppercase">
          </div>
        </div>

        <!-- Fechas de Emisión y Vencimiento -->
        <div class="form-row grid-2">
          <div class="form-group">
            <label class="form-label">Fecha de Emisión <span class="required">*</span></label>
            <input formControlName="fechaEmision" type="date" class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Fecha de Vencimiento</label>
            <input formControlName="fechaVencimiento" type="date" class="form-input">
          </div>
        </div>

        <!-- Observaciones -->
        <div class="form-group">
          <label class="form-label">Observaciones / Notas Adicionales</label>
          <textarea formControlName="observaciones" rows="2" placeholder="Notas sobre la entrega o habilitación..." class="form-textarea"></textarea>
        </div>

        <!-- Botones de Acción -->
        <div class="dialog-footer">
          <button type="button" (click)="cerrar()" class="btn-secondary">
            Cancelar
          </button>
          <button type="submit" [disabled]="form.invalid || guardando() || unicidadValida() === false" class="btn-primary">
            <mat-icon>check</mat-icon> Registrar y Emitir TUC
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      background-color: #ffffff;
      color: #0f172a;
      padding: 24px;
      border-radius: 16px;
      max-width: 640px;
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

    .header-title-box {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-icon-badge {
      background: rgba(37, 99, 235, 0.1);
      border: 1px solid rgba(37, 99, 235, 0.2);
      padding: 10px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-blue { color: #2563eb; }

    .dialog-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .dialog-subtitle {
      font-size: 12px;
      color: #64748b;
      margin: 2px 0 0 0;
    }

    .btn-close {
      color: #64748b;
    }

    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: grid;
      gap: 12px;
    }

    .grid-2 { grid-template-columns: 1fr 1fr; }
    .grid-3 { grid-template-columns: 1fr 1fr 1fr; }

    @media (max-width: 600px) {
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-label {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
    }

    .required { color: #f43f5e; }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      color: #0f172a;
      font-size: 13px;
      outline: none;
      transition: all 0.2s;
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: #2563eb;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .input-mono { font-family: monospace; font-weight: 700; }
    .input-uppercase { text-transform: uppercase; }

    /* Unicidad Card */
    .unicidad-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .unicidad-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .unicidad-label {
      font-size: 12px;
      font-weight: 700;
      color: #2563eb;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-auto-gen {
      background: none;
      border: none;
      color: #059669;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-auto-gen:hover { text-decoration: underline; }

    .status-msg {
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0;
    }

    .text-slate { color: #64748b; }
    .text-success { color: #059669; }
    .text-danger { color: #dc2626; }

    .border-success { border-color: #10b981 !important; }
    .border-danger { border-color: #f43f5e !important; }

    /* Kardex Section */
    .kardex-section {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .kardex-title {
      font-size: 11px;
      font-weight: 800;
      color: #b45309;
      text-transform: uppercase;
      margin: 0;
    }

    /* Footer Actions */
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      margin-top: 8px;
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

    .btn-primary {
      background: #2563eb;
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
    .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .icon-sm { font-size: 16px; width: 16px; height: 16px; }
    .icon-xs { font-size: 14px; width: 14px; height: 14px; }

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
        background: rgba(59, 130, 246, 0.15);
        border-color: rgba(59, 130, 246, 0.3);
      }
      .icon-blue { color: #60a5fa; }
      .dialog-title { color: white; }
      .dialog-subtitle { color: #94a3b8; }
      .btn-close { color: #94a3b8; }
      .form-label { color: #cbd5e1; }
      .form-input, .form-select, .form-textarea {
        background: #1e293b;
        border-color: #334155;
        color: white;
      }
      .form-input:focus, .form-select:focus, .form-textarea:focus {
        border-color: #3b82f6;
        background: #1e293b;
      }
      .unicidad-card {
        background: #1e293b;
        border-color: #334155;
      }
      .unicidad-label { color: #60a5fa; }
      .btn-auto-gen { color: #34d399; }
      .text-slate { color: #94a3b8; }
      .text-success { color: #34d399; }
      .text-danger { color: #f87171; }
      .kardex-section {
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.3);
      }
      .kardex-title { color: #fbbf24; }
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
export class TucEmitirDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tucService = inject(TucService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<TucEmitirDialogComponent>);

  guardando = signal<boolean>(false);
  validandoUnicidad = signal<boolean>(false);
  unicidadValida = signal<boolean | null>(null);
  mensajeUnicidad = signal<string>('');
  lotesKardex = signal<TucKardexStock[]>([]);

  form = this.fb.group({
    tipoEmision: ['ELECTRONICA' as TipoEmisionTuc, Validators.required],
    motivoEmision: ['AUTORIZACION_NUEVA' as MotivoEmision, Validators.required],
    nroTuc: ['', Validators.required],
    placa: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{1,3}-[A-Z0-9]{3,4}$/i)]],
    ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    nroResolucion: ['', Validators.required],
    fechaEmision: [new Date().toISOString().substring(0, 10), Validators.required],
    fechaVencimiento: [''],
    loteKardexId: [null as string | null],
    serieFisica: [''],
    observaciones: ['']
  });

  ngOnInit(): void {
    this.generarSiguienteCorrelativo();
    this.cargarLotesKardex();
  }

  onTipoEmisionChange(): void {
    const tipo = this.form.get('tipoEmision')?.value;
    if (tipo === 'ELECTRONICA') {
      this.generarSiguienteCorrelativo();
    } else {
      this.form.patchValue({ nroTuc: '' });
      this.unicidadValida.set(null);
    }
  }

  generarSiguienteCorrelativo(): void {
    const tipo = this.form.get('tipoEmision')?.value || 'ELECTRONICA';
    this.tucService.getSiguienteNumero(tipo).subscribe({
      next: (res) => {
        this.form.patchValue({ nroTuc: res.siguienteNroTuc });
        this.validarUnicidad();
      }
    });
  }

  cargarLotesKardex(): void {
    this.tucService.getLotesKardex().subscribe({
      next: (res) => this.lotesKardex.set(res)
    });
  }

  validarUnicidad(): void {
    const nroTuc = this.form.get('nroTuc')?.value;
    if (!nroTuc || !nroTuc.trim()) {
      this.unicidadValida.set(null);
      return;
    }

    this.validandoUnicidad.set(true);
    this.tucService.verificarUnicidad(nroTuc.trim()).subscribe({
      next: (res) => {
        this.validandoUnicidad.set(false);
        this.unicidadValida.set(res.disponible);
        this.mensajeUnicidad.set(res.mensaje);
      },
      error: () => this.validandoUnicidad.set(false)
    });
  }

  guardar(): void {
    if (this.form.invalid || this.unicidadValida() === false) return;

    this.guardando.set(true);
    const val = this.form.value;

    this.tucService.emitirTuc({
      nroTuc: val.nroTuc!,
      tipoEmision: val.tipoEmision!,
      motivoEmision: val.motivoEmision!,
      placa: val.placa!.toUpperCase(),
      ruc: val.ruc!,
      nroResolucion: val.nroResolucion!.toUpperCase(),
      fechaEmision: val.fechaEmision!,
      fechaVencimiento: val.fechaVencimiento || undefined,
      loteKardexId: val.loteKardexId || undefined,
      serieFisica: val.serieFisica || undefined,
      observaciones: val.observaciones || undefined
    }).subscribe({
      next: (res) => {
        this.snackBar.open(`TUC ${res.nroTuc} emitida exitosamente`, 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(`Error al emitir TUC: ${err?.error?.detail || err.message}`, 'Cerrar', { duration: 4000 });
        this.guardando.set(false);
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
