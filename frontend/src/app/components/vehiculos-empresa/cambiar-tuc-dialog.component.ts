import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TucService } from '../../services/tuc.service';
import { VehiculoEmpresa } from '../../services/flota-empresa.service';

export interface CambiarTucDialogData {
  vehiculo: VehiculoEmpresa;
}

@Component({
  selector: 'app-cambiar-tuc-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="cambiar-tuc-container">
      <!-- HEADER -->
      <div class="dialog-header">
        <div class="header-content">
          <div class="icon-circle">
            <mat-icon>published_with_changes</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title">Rectificar Tarjeta TUC Física</h2>
            <p class="dialog-subtitle">Placa: <strong>{{ data.vehiculo.placa }}</strong> | {{ data.vehiculo.razon_social || 'Empresa' }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" class="close-btn" [disabled]="isSaving()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- BODY -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="dialog-body">
        
        <!-- RESUMEN TUC ACTUAL -->
        <div class="tuc-actual-box">
          <div class="tuc-info-col">
            <span class="label">Tarjeta Física Actual Asignada:</span>
            <span class="tuc-current-badge">
              <mat-icon>credit_card</mat-icon>
              {{ data.vehiculo.numero_tuc || 'SIN TUC' }}
            </span>
          </div>
          <div class="status-col">
            <span class="label">Resolución:</span>
            <span class="val-mono">{{ data.vehiculo.nro_resolucion_primigenia || '-' }}</span>
          </div>
        </div>

        <!-- ALERTA DE ANULACIÓN -->
        <div class="alerta-anulacion">
          <mat-icon class="alerta-icon">warning_amber</mat-icon>
          <div class="alerta-text">
            <strong>Atención:</strong> Al registrar el nuevo número de tarjeta física, la tarjeta actual 
            <strong>({{ data.vehiculo.numero_tuc || 'vigente' }})</strong> pasará automáticamente al estado 
            <span class="badge-anulado">ANULADO</span> en el catálogo oficial de TUCs, quedando registrado el motivo especificado para auditoría.
          </div>
        </div>

        <!-- FORMULARIO NUEVO TUC -->
        <div class="form-grid">
          
          <!-- NUEVO TUC FÍSICA -->
          <div class="input-tuc-wrapper">
            <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
              <mat-label>Nuevo Número de Tarjeta Física (TUC) *</mat-label>
              <input matInput formControlName="nuevo_tuc" placeholder="Ej: T-012345" (blur)="normalizarTucFisica()" required>
              <mat-icon matSuffix color="primary">credit_card</mat-icon>
              @if (form.get('nuevo_tuc')?.hasError('required') && form.get('nuevo_tuc')?.touched) {
                <mat-error>El nuevo número de tarjeta física es obligatorio.</mat-error>
              }
              @if (form.get('nuevo_tuc')?.hasError('mismoNumero')) {
                <mat-error>El nuevo número no puede ser idéntico al TUC actual.</mat-error>
              }
            </mat-form-field>
            <div class="field-hint">
              <mat-icon style="font-size:14px;width:14px;height:14px;color:#6366f1;">info</mat-icon>
              <span>Ingrese el correlativo de la nueva tarjeta física impresa (ej. <strong>T-012345</strong>).</span>
            </div>
          </div>

          <!-- MOTIVO PREDEFINIDO -->
          <div class="motivos-predefinidos">
            <span class="motivos-label">Selecciona el motivo de rectificación / anulación:</span>
            <div class="motivo-chips">
              @for (mot of motivosRapidos; track mot) {
                <button type="button" 
                        class="chip-btn" 
                        [class.chip-selected]="form.get('motivo_rapido')?.value === mot"
                        (click)="seleccionarMotivoRapido(mot)">
                  {{ mot }}
                </button>
              }
            </div>
          </div>

          <!-- DETALLE DEL MOTIVO -->
          <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
            <mat-label>Explicación detallada del motivo *</mat-label>
            <textarea matInput formControlName="motivo_detalle" rows="3" 
                      placeholder="Indique la causa específica (ej. Se detectó error en la impresión de la tarjeta física, corrección de asientos en datos técnicos, etc.)..." required></textarea>
            @if (form.get('motivo_detalle')?.hasError('required') && form.get('motivo_detalle')?.touched) {
              <mat-error>Debe ingresar la justificación para anular la tarjeta física anterior.</mat-error>
            }
          </mat-form-field>

        </div>

        <!-- FOOTER ACTIONS -->
        <div class="dialog-actions">
          <button type="button" mat-button (click)="cerrar()" [disabled]="isSaving()">
            Cancelar
          </button>
          <button type="submit" mat-raised-button color="primary" class="btn-confirmar" [disabled]="form.invalid || isSaving()">
            @if (isSaving()) {
              <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
              <span>Guardando cambio...</span>
            } @else {
              <mat-icon>check_circle</mat-icon>
              <span>Confirmar y Anular Tarjeta Anterior</span>
            }
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .cambiar-tuc-container {
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .dialog-header {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: #ffffff;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;

        .icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          mat-icon { color: #38bdf8; font-size: 22px; width: 22px; height: 22px; }
        }

        .dialog-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }

        .dialog-subtitle {
          margin: 2px 0 0;
          font-size: 12px;
          color: #cbd5e1;
        }
      }

      .close-btn {
        color: #ffffff;
        opacity: 0.8;
        &:hover { opacity: 1; }
      }
    }

    .dialog-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tuc-actual-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;

      .tuc-info-col, .status-col {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .label {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .tuc-current-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #eff6ff;
        color: #1d4ed8;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 800;
        font-family: monospace;
        border: 1px solid #bfdbfe;
        mat-icon { font-size: 16px; width: 16px; height: 16px; color: #2563eb; }
      }

      .val-mono {
        font-family: monospace;
        font-size: 13px;
        font-weight: 700;
        color: #1e293b;
      }
    }

    .alerta-anulacion {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #d97706;
      border-radius: 8px;
      padding: 12px 14px;

      .alerta-icon {
        color: #d97706;
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 1px;
      }

      .alerta-text {
        font-size: 12.5px;
        color: #92400e;
        line-height: 1.45;

        .badge-anulado {
          background: #fee2e2;
          color: #b91c1c;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 11px;
          border: 1px solid #fca5a5;
        }
      }
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .input-tuc-wrapper {
      display: flex;
      flex-direction: column;
      gap: 5px;

      .w-100 { width: 100%; }

      .field-hint {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11.5px;
        color: #64748b;
        padding-left: 2px;
      }
    }

    .motivos-predefinidos {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .motivos-label {
        font-size: 12px;
        font-weight: 700;
        color: #475569;
      }

      .motivo-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .chip-btn {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #334155;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            border-color: #94a3b8;
            background: #f1f5f9;
          }

          &.chip-selected {
            background: #312e81;
            color: #ffffff;
            border-color: #1e1b4b;
          }
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;

      .btn-confirmar {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: #ffffff;
        font-weight: 700;
        padding: 0 18px;
        height: 42px;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .btn-spinner {
        margin-right: 8px;
      }
    }
  `]
})
export class CambiarTucDialogComponent implements OnInit {
  isSaving = signal<boolean>(false);
  form!: FormGroup;

  motivosRapidos = [
    'Error de impresión en tarjeta física',
    'Atasco o falla de impresora en cartón/tarjeta',
    'Corrección de datos técnicos del vehículo',
    'Tarjeta física dañada o deteriorada',
    'Rectificación de datos a última hora',
    'Error de digitación en N° de tarjeta'
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CambiarTucDialogData,
    private dialogRef: MatDialogRef<CambiarTucDialogComponent>,
    private fb: FormBuilder,
    private tucService: TucService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const tucActual = (this.data.vehiculo.numero_tuc || '').trim().toUpperCase();

    this.form = this.fb.group({
      nuevo_tuc: ['', [Validators.required, this.validarDistinto(tucActual)]],
      motivo_rapido: ['Error de impresión en tarjeta física'],
      motivo_detalle: ['Error de impresión en tarjeta física. Se procede a anular la tarjeta actual y registrar la nueva tarjeta física correlativa emitida.', [Validators.required]]
    });
  }

  validarDistinto(tucActual: string) {
    return (control: any) => {
      const val = (control.value || '').trim().toUpperCase();
      if (tucActual && val && val === tucActual) {
        return { mismoNumero: true };
      }
      return null;
    };
  }

  seleccionarMotivoRapido(motivo: string): void {
    this.form.patchValue({
      motivo_rapido: motivo,
      motivo_detalle: `${motivo}. Se anula la tarjeta física actual y se asigna el número rectificado.`
    });
  }

  normalizarTucFisica(): void {
    let val = (this.form.get('nuevo_tuc')?.value || '').trim().toUpperCase();
    if (!val) return;
    if (/^\d+$/.test(val)) {
      val = `T-${val.padStart(6, '0')}`;
      this.form.patchValue({ nuevo_tuc: val });
    } else if (val.startsWith('T') && !val.startsWith('T-')) {
      const rest = val.substring(1).trim();
      if (/^\d+$/.test(rest)) {
        val = `T-${rest.padStart(6, '0')}`;
        this.form.patchValue({ nuevo_tuc: val });
      }
    }
  }

  cerrar(resultado = false): void {
    this.dialogRef.close(resultado);
  }

  guardar(): void {
    this.normalizarTucFisica();
    if (this.form.invalid || this.isSaving()) return;

    const tucActual = (this.data.vehiculo.numero_tuc || '').trim().toUpperCase();
    const nuevoTuc = (this.form.value.nuevo_tuc || '').trim().toUpperCase();
    const motivoFinal = `${this.form.value.motivo_rapido || ''} - ${this.form.value.motivo_detalle || ''}`.trim();

    this.isSaving.set(true);

    const payload = {
      vehiculo_id: this.data.vehiculo.id,
      placa: this.data.vehiculo.placa,
      tuc_actual: tucActual,
      nuevo_tuc: nuevoTuc,
      motivo: motivoFinal,
      usuario: 'OPERADOR DRTC'
    };

    this.tucService.cambiarAnularTuc(payload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.snackBar.open(`Tarjeta TUC física rectificada exitosamente. Tarjeta anterior anulada y asignada la nueva tarjeta ${nuevoTuc}.`, 'OK', { duration: 4500 });
        this.cerrar(true);
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err?.error?.detail || 'Error al modificar el número de tarjeta TUC.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }
}
