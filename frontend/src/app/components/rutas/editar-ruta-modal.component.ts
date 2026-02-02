import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RutaService } from '../../services/ruta.service';
import { Ruta, RutaUpdate } from '../../models/ruta.model';

export interface EditarRutaModalData {
  ruta: Ruta;
}

@Component({
  selector: 'app-editar-ruta-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>edit_road</mat-icon>
        Editar Ruta
      </h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      <div class="ruta-info">
        <div class="info-card">
          <div class="info-label">Código de Ruta:</div>
          <div class="info-value">{{ data.ruta.codigoRuta }}</div>
        </div>
      </div>

      <form [formGroup]="rutaForm" class="ruta-form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Origen</mat-label>
            <input matInput formControlName="origen" placeholder="Ciudad de origen">
            <mat-icon matSuffix>place</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Destino</mat-label>
            <input matInput formControlName="destino" placeholder="Ciudad de destino">
            <mat-icon matSuffix>flag</mat-icon>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Frecuencias</mat-label>
            <input matInput formControlName="frecuencias" placeholder="Ej: Diaria, Lunes a Viernes">
            <mat-icon matSuffix>schedule</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tipo de Ruta</mat-label>
            <mat-select formControlName="tipoRuta">
              <mat-option value="URBANA">Urbana</mat-option>
              <mat-option value="INTERURBANA">Interurbana</mat-option>
              <mat-option value="INTERPROVINCIAL">Interprovincial</mat-option>
              <mat-option value="INTERREGIONAL">Interregional</mat-option>
              <mat-option value="RURAL">Rural</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <mat-select formControlName="estado">
              <mat-option value="ACTIVA">Activa</mat-option>
              <mat-option value="INACTIVA">Inactiva</mat-option>
              <mat-option value="SUSPENDIDA">Suspendida</mat-option>
              <mat-option value="EN_MANTENIMIENTO">En Mantenimiento</mat-option>
            </mat-select>
            <mat-icon matSuffix>toggle_on</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Distancia (km)</mat-label>
            <input matInput type="number" formControlName="distancia" placeholder="0">
            <mat-icon matSuffix>straighten</mat-icon>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observaciones</mat-label>
            <textarea matInput 
                      formControlName="observaciones" 
                      rows="3" 
                      placeholder="Observaciones adicionales..."></textarea>
            <mat-icon matSuffix>note</mat-icon>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button mat-button mat-dialog-close type="button">
        <mat-icon>cancel</mat-icon>
        Cancelar
      </button>
      
      <button mat-raised-button 
              color="primary" 
              (click)="guardarCambios()"
              [disabled]="rutaForm.invalid || isSubmitting">
        <mat-spinner *ngIf="isSubmitting" diameter="20"></mat-spinner>
        <mat-icon *ngIf="!isSubmitting">save</mat-icon>
        {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
      </button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./crear-ruta-modal.component.scss']
})
export class EditarRutaModalComponent implements OnInit {
  rutaForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private rutaService: RutaService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditarRutaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditarRutaModalData
  ) {
    this.rutaForm = this.fb.group({
      origen: [data.ruta.origen?.nombre || data.ruta.origen, Validators.required],
      destino: [data.ruta.destino?.nombre || data.ruta.destino, Validators.required],
      frecuencias: [data.ruta.frecuencias, Validators.required],
      tipoRuta: [data.ruta.tipoRuta, Validators.required],
      estado: [data.ruta.estado, Validators.required],
      distancia: [data.ruta.distancia],
      observaciones: [data.ruta.observaciones || '']
    });
  }

  ngOnInit() {}

  guardarCambios() {
    if (this.rutaForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.rutaForm.value;

    const rutaActualizada: RutaUpdate = {
      frecuencias: formValue.frecuencias,
      tipoRuta: formValue.tipoRuta,
      estado: formValue.estado,
      observaciones: formValue.observaciones,
      nombre: `${formValue.origen} - ${formValue.destino}`
    };

    // console.log removed for production

    this.rutaService.updateRuta(this.data.ruta.id, rutaActualizada).subscribe({
      next: (rutaActualizada) => {
        // console.log removed for production
        this.snackBar.open('Ruta actualizada exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(rutaActualizada);
      },
      error: (error) => {
        console.error('❌ Error actualizando ruta::', error);
        this.snackBar.open('Error al actualizar la ruta', 'Cerrar', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }

  private marcarCamposComoTocados() {
    Object.keys(this.rutaForm.controls).forEach(key => {
      const control = this.rutaForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }
}
