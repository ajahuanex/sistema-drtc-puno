/**
 * Modal Component for Archiving Documents
 * Requirements: 9.1, 9.2, 9.3, 9.7
 */
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ArchivoService } from '../../services/mesa-partes/archivo.service';
import { DocumentoService } from '../../services/mesa-partes/documento.service';
import {
  ArchivoCreate,
  ClasificacionArchivoEnum,
  PoliticaRetencionEnum,
  getClasificacionLabel,
  getPoliticaRetencionLabel
} from '../../models/mesa-partes/archivo.model';
import { Documento } from '../../models/mesa-partes/documento.model';

@Component({
  selector: 'app-archivar-documento-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>archive</mat-icon>
      Archivar Documento
    </h2>

    <mat-dialog-content>
      <div class="documento-info" *ngIf="documento">
        <p><strong>Expediente:</strong> {{ documento.numeroExpediente }}</p>
        <p><strong>Remitente:</strong> {{ documento.remitente }}</p>
        <p><strong>Asunto:</strong> {{ documento.asunto }}</p>
        <p><strong>Estado:</strong> {{ documento.estado }}</p>
      </div>

      <form [formGroup]="archivarForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Clasificación de Archivo</mat-label>
          <mat-select formControlName="clasificacion" required>
            <mat-option *ngFor="let clasificacion of clasificaciones" [value]="clasificacion.value">
              {{ clasificacion.label }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="archivarForm.get('clasificacion')?.hasError('required')">
            La clasificación es obligatoria
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Política de Retención</mat-label>
          <mat-select formControlName="politica_retencion" required>
            <mat-option *ngFor="let politica of politicas" [value]="politica.value">
              {{ politica.label }}
            </mat-option>
          </mat-select>
          <mat-hint>Define cuánto tiempo se conservará el documento</mat-hint>
          <mat-error *ngIf="archivarForm.get('politica_retencion')?.hasError('required')">
            La política de retención es obligatoria
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ubicación Física (Opcional)</mat-label>
          <input 
            matInput 
            formControlName="ubicacion_fisica"
            placeholder="Ej: Estante A, Caja 15">
          <mat-hint>Especifique dónde se guardará físicamente el documento</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motivo de Archivo</mat-label>
          <textarea 
            matInput 
            formControlName="motivo_archivo"
            rows="3"
            placeholder="Explique el motivo del archivado">
          </textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Observaciones</mat-label>
          <textarea 
            matInput 
            formControlName="observaciones"
            rows="3"
            placeholder="Observaciones adicionales">
          </textarea>
        </mat-form-field>
      </form>

      <div class="info-message">
        <mat-icon>info</mat-icon>
        <p>
          Se generará automáticamente un código de ubicación único para este documento.
          El documento pasará al estado "ARCHIVADO" y no estará disponible para gestión activa.
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
        (click)="onArchive()"
        [disabled]="!archivarForm.valid || loading">
        <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
        <span *ngIf="!loading">Archivar Documento</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .documento-info {
      background-color: #e3f2fd;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .documento-info p {
      margin: 5px 0;
    }

    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }

    .info-message {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background-color: #e8f5e9;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }

    .info-message mat-icon {
      color: #2e7d32;
    }

    .info-message p {
      margin: 0;
      color: #2e7d32;
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
export class ArchivarDocumentoModalComponent implements OnInit {
  archivarForm: FormGroup;
  loading = false;
  documento: Documento | null = null;

  clasificaciones = Object.values(ClasificacionArchivoEnum).map(value => ({
    value,
    label: getClasificacionLabel(value)
  }));

  politicas = Object.values(PoliticaRetencionEnum).map(value => ({
    value,
    label: getPoliticaRetencionLabel(value)
  }));

  constructor(
    private fb: FormBuilder,
    private archivoService: ArchivoService,
    private documentoService: DocumentoService,
    public dialogRef: MatDialogRef<ArchivarDocumentoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { documentoId: string }
  ) {
    this.archivarForm = this.fb.group({
      clasificacion: ['', Validators.required],
      politica_retencion: ['', Validators.required],
      ubicacion_fisica: [''],
      motivo_archivo: [''],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.loadDocumento();
  }

  loadDocumento(): void {
    this.documentoService.obtenerDocumento(this.data.documentoId).subscribe({
      next: (documento) => {
        this.documento = documento;
      },
      error: (error) => {
        console.error('Error loading documento::', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onArchive(): void {
    if (this.archivarForm.valid) {
      this.loading = true;
      const archivoData: ArchivoCreate = {
        documento_id: this.data.documentoId,
        ...this.archivarForm.value
      };

      this.archivoService.archivarDocumento(archivoData).subscribe({
        next: (archivo) => {
          this.loading = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error archiving document::', error);
          const errorMessage = error.error?.detail || 'Error al archivar el documento. Por favor, intente nuevamente.';
          alert(errorMessage);
        }
      });
    }
  }
}
