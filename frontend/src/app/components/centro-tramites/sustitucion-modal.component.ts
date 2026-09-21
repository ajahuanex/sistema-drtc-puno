import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-sustitucion-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <div class="header-title">
          <mat-icon style="color: #2563eb; margin-right: 8px;">sync_alt</mat-icon>
          <h2>Configurar Sustitución</h2>
        </div>
        <button mat-icon-button (click)="cerrar()" style="color: #64748b;">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <form [formGroup]="form" class="sustitucion-form">
          <!-- Vehículo Saliente -->
          <div class="section-box saliente-box">
            <div class="section-badge badge-saliente">SALIENTE</div>
            <h3>Seleccione Vehículo a Retirar</h3>
            <mat-form-field appearance="outline" style="width: 100%; margin-top: 1rem;">
              <mat-label>Vehículo Saliente (Placa)</mat-label>
              <mat-select formControlName="placa_saliente">
                @for (v of data.vehiculosDisponibles; track v.placa) {
                  <mat-option [value]="v.placa">
                    <span style="font-weight: 600; font-family: monospace;">{{v.placa}}</span> - {{v.marca}} {{v.modelo}}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Icono Central -->
          <div class="sync-icon-wrapper">
            <mat-icon>arrow_downward</mat-icon>
          </div>

          <!-- Vehículo Entrante -->
          <div class="section-box entrante-box">
            <div class="section-badge badge-entrante">ENTRANTE</div>
            <h3>Datos del Nuevo Vehículo</h3>
            
            <div class="grid-form">
              <mat-form-field appearance="outline">
                <mat-label>Placa Entrante</mat-label>
                <input matInput formControlName="placa_entrante" placeholder="Ej. ABC-123" style="font-family: monospace; text-transform: uppercase;">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Marca</mat-label>
                <input matInput formControlName="marca" placeholder="Ej. TOYOTA">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Modelo</mat-label>
                <input matInput formControlName="modelo" placeholder="Ej. HIACE">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Año Fab.</mat-label>
                <input matInput type="number" formControlName="anio_fabricacion" placeholder="2024">
              </mat-form-field>
              
              <mat-form-field appearance="outline" style="grid-column: 1 / -1;">
                <mat-label>N° TUC (Opcional)</mat-label>
                <input matInput formControlName="numero_tuc" placeholder="Ej. 12345678">
              </mat-form-field>
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button mat-button (click)="cerrar()" style="color: #64748b;">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()" style="border-radius: 8px;">
          <mat-icon>check</mat-icon> Confirmar Sustitución
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      background: #f8fafc;
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header-title {
      display: flex;
      align-items: center;
      h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
    }
    .modal-content {
      padding: 1.5rem;
      overflow-y: auto;
    }
    .section-box {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      position: relative;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
      
      h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #1e293b; }
    }
    .saliente-box { border-left: 4px solid #f59e0b; }
    .entrante-box { border-left: 4px solid #10b981; }
    
    .section-badge {
      position: absolute;
      top: -10px;
      right: 1.5rem;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      color: white;
    }
    .badge-saliente { background: #f59e0b; }
    .badge-entrante { background: #10b981; }

    .sync-icon-wrapper {
      display: flex;
      justify-content: center;
      margin: -10px 0;
      position: relative;
      z-index: 5;
      mat-icon {
        background: white;
        color: #94a3b8;
        border: 1px solid #e2e8f0;
        border-radius: 50%;
        padding: 4px;
        width: 24px;
        height: 24px;
        font-size: 24px;
      }
    }

    .grid-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-top: 1rem;
    }

    .modal-footer {
      padding: 1.25rem 1.5rem;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      position: sticky;
      bottom: 0;
    }
  `]
})
export class SustitucionModalComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SustitucionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { vehiculosDisponibles: any[] }
  ) {
    this.form = this.fb.group({
      placa_saliente: ['', Validators.required],
      placa_entrante: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]{6,8}$/i)]],
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      anio_fabricacion: ['', [Validators.required, Validators.min(1980), Validators.max(2027)]],
      numero_tuc: ['']
    });
  }

  cerrar() {
    this.dialogRef.close();
  }

  guardar() {
    if (this.form.valid) {
      const value = this.form.value;
      value.placa_entrante = value.placa_entrante.toUpperCase();
      this.dialogRef.close(value);
    }
  }
}
