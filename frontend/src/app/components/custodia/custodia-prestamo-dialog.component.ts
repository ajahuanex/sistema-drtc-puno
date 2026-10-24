import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CustodiaService, DocumentoCustodia } from '../../services/custodia.service';

export interface PrestamoDialogData {
  documento: DocumentoCustodia;
  modo: 'PRESTAMO' | 'DEVOLUCION';
}

@Component({
  selector: 'app-custodia-prestamo-dialog',
  standalone: true,
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header" [class.header-devolucion]="data.modo === 'DEVOLUCION'">
        <div class="header-icon-box">
          <mat-icon>{{ data.modo === 'PRESTAMO' ? 'assignment_return' : 'task_alt' }}</mat-icon>
        </div>
        <div>
          <h2 class="dialog-title">
            {{ data.modo === 'PRESTAMO' ? 'Registrar Salida Temporal por Préstamo' : 'Registrar Devolución a Custodia' }}
          </h2>
          <p class="dialog-subtitle">
            Expediente: <strong>{{ data.documento.nro_expediente }}</strong> ({{ data.documento.codigo_custodia }}) • {{ data.documento.nro_folios }} folios
          </p>
        </div>
        <button mat-icon-button (click)="cerrar()" class="close-btn" type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- MODO PRESTAMO -->
      @if (data.modo === 'PRESTAMO') {
        <form [formGroup]="prestamoForm" (ngSubmit)="guardarPrestamo()" class="dialog-body">
          <div class="info-alert">
            <mat-icon>info</mat-icon>
            <span>
              El expediente saldrá temporalmente de custodia física. Se mantendrá el registro de trazabilidad institucional del funcionario receptor.
            </span>
          </div>

          <div class="grid-2">
            <mat-form-field appearance="outline">
              <mat-label>Servidor / Funcionario Solicitante *</mat-label>
              <input matInput formControlName="solicitante" placeholder="Ej. Abog. Carlos Mamani" required>
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Área o Dependencia Receptora *</mat-label>
              <mat-select formControlName="area_solicitante" required>
                @for (a of areasOpciones; track a) {
                  <mat-option [value]="a">{{ a }}</mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>corporate_fare</mat-icon>
            </mat-form-field>
          </div>

          <div class="grid-2">
            <mat-form-field appearance="outline">
              <mat-label>Cargo del Funcionario</mat-label>
              <input matInput formControlName="cargo_solicitante" placeholder="Ej. Asesor Legal / Especialista Técnico">
              <mat-icon matPrefix>badge</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Documento de Requerimiento / Cargo *</mat-label>
              <input matInput formControlName="documento_requerimiento" placeholder="Ej. Proveído N° 450-2026 / Papeleta N° 12" required>
              <mat-icon matPrefix>receipt_long</mat-icon>
            </mat-form-field>
          </div>

          <div class="grid-2">
            <mat-form-field appearance="outline">
              <mat-label>Fecha Límite Estimada de Devolución</mat-label>
              <input matInput type="date" formControlName="fecha_limite_devolucion">
              <mat-icon matPrefix>event</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Motivo del Préstamo *</mat-label>
              <input matInput formControlName="motivo_prestamo" placeholder="Ej. Elaboración de Informe Técnico Legal" required>
              <mat-icon matPrefix>edit_note</mat-icon>
            </mat-form-field>
          </div>

          <div class="dialog-actions">
            <button mat-button type="button" (click)="cerrar()" [disabled]="procesando()">Cancelar</button>
            <button mat-flat-button color="warn" type="submit" [disabled]="prestamoForm.invalid || procesando()">
              <mat-icon>outbox</mat-icon>
              <span>{{ procesando() ? 'Registrando...' : 'Confirmar Salida por Préstamo' }}</span>
            </button>
          </div>
        </form>
      }

      <!-- MODO DEVOLUCION -->
      @if (data.modo === 'DEVOLUCION') {
        <form [formGroup]="devolucionForm" (ngSubmit)="guardarDevolucion()" class="dialog-body">
          <div class="info-alert return-alert">
            <mat-icon>verified</mat-icon>
            <div>
              <strong>Reingreso físico a custodia</strong>
              <p style="margin: 2px 0 0 0; font-size: 0.76rem;">
                Préstamo actual registrado a: <strong>{{ data.documento.prestamo_actual?.solicitante }}</strong> ({{ data.documento.prestamo_actual?.area_solicitante }}). Verifique el conteo completo de los <strong>{{ data.documento.nro_folios }} folios</strong>.
              </p>
            </div>
          </div>

          <mat-form-field appearance="outline" style="width: 100%;">
            <mat-label>Observaciones de Devolución / Estado Físico de Reingreso</mat-label>
            <textarea matInput formControlName="observaciones_devolucion" rows="3" placeholder="Ej. Se recepcionó el expediente completo con sus 145 folios en perfecto estado físico y legibilidad."></textarea>
          </mat-form-field>

          <div class="dialog-actions">
            <button mat-button type="button" (click)="cerrar()" [disabled]="procesando()">Cancelar</button>
            <button mat-flat-button color="primary" type="submit" [disabled]="procesando()">
              <mat-icon>check_circle</mat-icon>
              <span>{{ procesando() ? 'Procesando...' : 'Confirmar Devolución Conforme' }}</span>
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      font-family: inherit;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 1.15rem 1.4rem;
      background: #fffbeb;
      border-bottom: 1px solid #fef3c7;
    }
    .dialog-header.header-devolucion {
      background: #f0fdf4;
      border-bottom-color: #dcfce7;
    }
    .header-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      background: white;
      color: #d97706;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .header-devolucion .header-icon-box {
      color: #16a34a;
    }
    .dialog-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .dialog-subtitle {
      font-size: 0.78rem;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .close-btn {
      margin-left: auto;
      color: #94a3b8;
    }
    .dialog-body {
      padding: 1.25rem 1.4rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .info-alert {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      background: #fff7ed;
      border: 1px solid #ffedd5;
      color: #9a3412;
      font-size: 0.79rem;
    }
    .info-alert.return-alert {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #15803d;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    @media (max-width: 600px) {
      .grid-2 { grid-template-columns: 1fr; }
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 0.5rem;
      border-top: 1px solid #f1f5f9;
    }
  `]
})
export class CustodiaPrestamoDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CustodiaPrestamoDialogComponent>);
  private custodiaService = inject(CustodiaService);
  private snackBar = inject(MatSnackBar);

  procesando = signal<boolean>(false);

  areasOpciones = [
    'ASESORÍA JURÍDICA',
    'DIRECCIÓN DE CIRCULACIÓN TERRESTRE',
    'SUBDIRECCIÓN DE AUTORIZACIONES',
    'SUBDIRECCIÓN DE FISCALIZACIÓN',
    'DIRECCIÓN REGIONAL DRTC PUNO',
    'MESA DE PARTES / TRÁMITE DOCUMENTARIO',
    'ÓRGANO DE CONTROL INSTITUCIONAL (OCI)',
    'PROCURADURÍA PÚBLICA REGIONAL'
  ];

  prestamoForm: FormGroup = this.fb.group({
    solicitante: ['', Validators.required],
    area_solicitante: ['ASESORÍA JURÍDICA', Validators.required],
    cargo_solicitante: ['Especialista Legal'],
    documento_requerimiento: ['', Validators.required],
    motivo_prestamo: ['Revisión legal y emisión de pronunciamiento', Validators.required],
    fecha_limite_devolucion: ['']
  });

  devolucionForm: FormGroup = this.fb.group({
    observaciones_devolucion: ['Se recepciona conforme con foliación completa']
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: PrestamoDialogData) {}

  guardarPrestamo(): void {
    if (this.prestamoForm.invalid) {
      this.prestamoForm.markAllAsTouched();
      return;
    }

    this.procesando.set(true);
    const docId = this.data.documento.id || this.data.documento._id!;
    this.custodiaService.registrarPrestamo(docId, this.prestamoForm.value).subscribe({
      next: () => {
        this.procesando.set(false);
        this.snackBar.open('✓ Salida por préstamo registrada con éxito', 'Cerrar', { duration: 3500 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.procesando.set(false);
        this.snackBar.open(`❌ ${err.error?.detail || 'Error al registrar préstamo'}`, 'Cerrar', { duration: 5000 });
      }
    });
  }

  guardarDevolucion(): void {
    this.procesando.set(true);
    const docId = this.data.documento.id || this.data.documento._id!;
    const obs = this.devolucionForm.get('observaciones_devolucion')?.value;
    this.custodiaService.registrarDevolucion(docId, obs).subscribe({
      next: () => {
        this.procesando.set(false);
        this.snackBar.open('✓ Expediente reingresado a custodia física conforme', 'Cerrar', { duration: 3500 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.procesando.set(false);
        this.snackBar.open(`❌ ${err.error?.detail || 'Error al registrar devolución'}`, 'Cerrar', { duration: 5000 });
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
