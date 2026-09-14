import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlotaEmpresaService, VehiculoEmpresa } from '../../services/flota-empresa.service';

@Component({
  selector: 'app-editar-vehiculo-dialog',
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
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="edit-dialog-container">
      <div class="dialog-header">
        <h2>
          <mat-icon>edit</mat-icon>
          Editar Registro de Vehículo ({{ data.placa }})
        </h2>
        <button mat-icon-button (click)="cerrar()" [disabled]="saving">
          <mat-icon style="color:#fff;">close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="dialog-body" style="padding:24px; max-height:75vh; overflow-y:auto;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <mat-form-field appearance="outline">
            <mat-label>Placa</mat-label>
            <input matInput formControlName="placa" placeholder="Placa del vehículo" required>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Número TUC</mat-label>
            <input matInput formControlName="numero_tuc" placeholder="Número TUC">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Estado del Vehículo</mat-label>
            <mat-select formControlName="estado">
              <mat-option value="HABILITADO">HABILITADO</mat-option>
              <mat-option value="INHABILITADO">INHABILITADO</mat-option>
              <mat-option value="OBSERVADO">OBSERVADO</mat-option>
              <mat-option value="CANCELADO">CANCELADO</mat-option>
              <mat-option value="SUSPENDIDO">SUSPENDIDO</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Resolución Primigenia</mat-label>
            <input matInput formControlName="nro_resolucion_primigenia" placeholder="R-0000-0000">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Resolución Hija</mat-label>
            <input matInput formControlName="nro_resolucion_hija" placeholder="R-0000-0000-I">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tipo Res. Hija</mat-label>
            <mat-select formControlName="tipo_resolucion_hija">
              <mat-option value="">Ninguno</mat-option>
              <mat-option value="I">I - Incremento</mat-option>
              <mat-option value="S">S - Sustitución</mat-option>
              <mat-option value="M">M - Modificación</mat-option>
              <mat-option value="O">O - Otros</mat-option>
              <mat-option value="C">C - Cancelación</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Expediente</mat-label>
            <input matInput formControlName="expediente" placeholder="E-0123-2026">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Rutas (separadas por coma)</mat-label>
            <input matInput formControlName="rutas_str" placeholder="01, 02, 03">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" style="width:100%;">
          <mat-label>Link TUC (Google Drive)</mat-label>
          <input matInput formControlName="link_tuc" placeholder="https://drive.google.com/...">
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%;">
          <mat-label>Link Notificación (Google Drive)</mat-label>
          <input matInput formControlName="link_notificacion" placeholder="https://drive.google.com/...">
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%;">
          <mat-label>Detalles / Notas</mat-label>
          <textarea matInput formControlName="detalles" rows="2" placeholder="Notas internas..."></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%;">
          <mat-label>Agregar Nueva Observación al Historial</mat-label>
          <input matInput formControlName="nueva_observacion" placeholder="Escribe un comentario u observación...">
        </mat-form-field>

        <div mat-dialog-actions align="end" style="padding:16px 0 0; display:flex; gap:12px; justify-content:flex-end;">
          <button mat-button type="button" (click)="cerrar()" [disabled]="saving">Cancelar</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving">
            @if (saving) {
              <mat-spinner diameter="18" style="display:inline-block; margin-right:8px;"></mat-spinner>
            }
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  `
})
export class EditarVehiculoDialogComponent implements OnInit {
  form!: FormGroup;
  saving = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VehiculoEmpresa,
    private dialogRef: MatDialogRef<EditarVehiculoDialogComponent>,
    private fb: FormBuilder,
    private service: FlotaEmpresaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      placa: [this.data.placa, Validators.required],
      numero_tuc: [this.data.numero_tuc || ''],
      estado: [this.data.estado || 'HABILITADO'],
      nro_resolucion_primigenia: [this.data.nro_resolucion_primigenia || ''],
      nro_resolucion_hija: [this.data.nro_resolucion_hija || ''],
      tipo_resolucion_hija: [this.data.tipo_resolucion_hija || ''],
      expediente: [this.data.expediente || this.data.num_expediente || ''],
      rutas_str: [(this.data.rutas || []).join(', ')],
      link_tuc: [this.data.link_tuc || ''],
      link_notificacion: [this.data.link_notificacion || ''],
      detalles: [this.data.detalles || ''],
      nueva_observacion: ['']
    });
  }

  cerrar(updated = false): void {
    this.dialogRef.close(updated);
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const val = this.form.value;
    const rutasArray = val.rutas_str
      ? val.rutas_str.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const payload: Partial<VehiculoEmpresa> = {
      placa: val.placa.trim().toUpperCase(),
      numero_tuc: val.numero_tuc.trim() || undefined,
      estado: val.estado,
      nro_resolucion_primigenia: val.nro_resolucion_primigenia.trim() || undefined,
      nro_resolucion_hija: val.nro_resolucion_hija.trim() || undefined,
      tipo_resolucion_hija: val.tipo_resolucion_hija || undefined,
      num_expediente: val.expediente.trim() || undefined,
      expediente: val.expediente.trim() || undefined,
      rutas: rutasArray,
      link_tuc: val.link_tuc.trim() || undefined,
      link_notificacion: val.link_notificacion.trim() || undefined,
      detalles: val.detalles.trim() || undefined
    };

    if (val.nueva_observacion?.trim()) {
      const actualObs = this.data.observaciones_historial || [];
      payload.observaciones_historial = [
        ...actualObs,
        {
          fecha: new Date().toISOString(),
          texto: val.nueva_observacion.trim(),
          usuario: 'Operador DRTC'
        }
      ];
    }

    this.service.update(this.data.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Vehículo actualizado exitosamente.', 'OK', { duration: 3000 });
        this.cerrar(true);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Error al actualizar el registro.', 'Cerrar', { duration: 4000 });
      }
    });
  }
}
