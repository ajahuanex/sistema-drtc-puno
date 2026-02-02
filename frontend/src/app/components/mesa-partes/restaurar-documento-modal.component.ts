/**
 * Modal Component for Restoring Archived Documents
 * Requirements: 9.5
 */
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ArchivoService } from '../../services/mesa-partes/archivo.service';
import { Archivo, ArchivoRestaurar } from '../../models/mesa-partes/archivo.model';

@Component({
  selector: 'app-restaurar-documento-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>restore</mat-icon>
      Restaurar Documento Archivado
    </h2>

    <mat-dialog-content>
      <div class="archivo-info">
        <p><strong>Código de Ubicación:</strong> {{ data.archivo.codigo_ubicacion }}</p>
        <p><strong>Clasificación:</strong> {{ data.archivo.clasificacion }}</p>
        <p><strong>Fecha de Archivado:</strong> {{ data.archivo.fecha_archivado | date:'dd/MM/yyyy' }}</p>
      </div>

      <form [formGroup]="restaurarForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motivo de Restauración</mat-label>
          <textarea 
            matInput 
            formControlName="motivo_restauracion"
            rows="4"
            placeholder="Explique el motivo por el cual se restaura este documento (mínimo 10 caracteres)"
            required>
          </textarea>
          <mat-error *ngIf="restaurarForm.get('motivo_restauracion')?.hasError('required')">
            El motivo es obligatorio
          </mat-error>
          <mat-error *ngIf="restaurarForm.get('motivo_restauracion')?.hasError('minlength')">
            El motivo debe tener al menos 10 caracteres
          </mat-error>
        </mat-form-field>
      </form>

      <div class="warning-message">
        <mat-icon>warning</mat-icon>
        <p>
          Al restaurar este documento, volverá al estado "EN_PROCESO" y estará disponible 
          nuevamente para su gestión. Esta acción quedará registrada en el historial.
        </p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="loading">
        Cancelar
      </button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onRestore()"
        [disabled]="!restaurarForm.valid || loading">
        <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
        <span *ngIf="!loading">Restaurar Documento</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .archivo-info {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .archivo-info p {
      margin: 5px 0;
    }

    .full-width {
      width: 100%;
    }

    .warning-message {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background-color: #fff3cd;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }

    .warning-message mat-icon {
      color: #856404;
    }

    .warning-message p {
      margin: 0;
      color: #856404;
      font-size: 14px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    mat-dialog-actions {
      padding: 16px 0;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class RestaurarDocumentoModalComponent {
  restaurarForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private archivoService: ArchivoService,
    public dialogRef: MatDialogRef<RestaurarDocumentoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { archivo: Archivo }
  ) {
    this.restaurarForm = this.fb.group({
      motivo_restauracion: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onRestore(): void {
    if (this.restaurarForm.valid) {
      this.loading = true;
      const restaurarData: ArchivoRestaurar = this.restaurarForm.value;

      this.archivoService.restaurarDocumento(this.data.archivo.id, restaurarData).subscribe({
        next: (archivo) => {
          this.loading = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error restoring document::', error);
          alert('Error al restaurar el documento. Por favor, intente nuevamente.');
        }
      });
    }
  }
}
