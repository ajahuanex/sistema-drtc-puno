import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { EstadoEmpresa, TipoDocumento, EmpresaCambioEstado } from '../../models/empresa.model';

interface CambioEstadoModalData {
  empresa: any;
  estadoActual: EstadoEmpresa;
}

@Component({
  selector: 'app-cambio-estado-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    SmartIconComponent
  ],
  template: `
    <div class="cambio-estado-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <app-smart-icon name="swap_horiz"></app-smart-icon>
          Cambiar Estado de Empresa
        </h2>
        <button mat-icon-button mat-dialog-close>
          <app-smart-icon name="close"></app-smart-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <div class="empresa-info">
          <h3>{{ data.empresa.razonSocial?.principal }}</h3>
          <p><strong>RUC:</strong> {{ data.empresa.ruc }}</p>
          <p><strong>Estado Actual:</strong> 
            <span class="estado-badge" [class]="'estado-' + data.estadoActual.toLowerCase()">
              {{ getEstadoLabel(data.estadoActual) }}
            </span>
          </p>
        </div>

        <form [formGroup]="cambioEstadoForm" class="form-content">
          <!-- Estado Nuevo -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nuevo Estado</mat-label>
            <mat-select formControlName="estadoNuevo" required>
              <mat-option value="AUTORIZADA">Autorizada</mat-option>
              <mat-option value="EN_TRAMITE">En Trámite</mat-option>
              <mat-option value="SUSPENDIDA">Suspendida</mat-option>
              <mat-option value="CANCELADA">Cancelada</mat-option>
              <mat-option value="DADA_DE_BAJA">Dada de Baja</mat-option>
            </mat-select>
            <mat-error *ngIf="cambioEstadoForm.get('estadoNuevo')?.hasError('required')">
              Seleccione el nuevo estado
            </mat-error>
          </mat-form-field>

          <!-- Motivo -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Motivo del Cambio</mat-label>
            <textarea 
              matInput 
              formControlName="motivo" 
              rows="3"
              placeholder="Explique el motivo del cambio de estado..."
              maxlength="500">
            </textarea>
            <mat-hint>{{ cambioEstadoForm.get('motivo')?.value?.length || 0 }}/500</mat-hint>
            <mat-error *ngIf="cambioEstadoForm.get('motivo')?.hasError('required')">
              El motivo es obligatorio
            </mat-error>
            <mat-error *ngIf="cambioEstadoForm.get('motivo')?.hasError('minlength')">
              Mínimo 10 caracteres
            </mat-error>
          </mat-form-field>

          <!-- Información del Documento -->
          <div class="documento-section">
            <h4>
              <app-smart-icon name="description"></app-smart-icon>
              Documento Sustentatorio
            </h4>
            
            <div class="documento-grid">
              <!-- Tipo de Documento -->
              <mat-form-field appearance="outline">
                <mat-label>Tipo de Documento</mat-label>
                <mat-select formControlName="tipoDocumentoSustentatorio">
                  <mat-option value="RESOLUCION">Resolución</mat-option>
                  <mat-option value="OTRO">Otro Documento</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Número de Documento -->
              <mat-form-field appearance="outline">
                <mat-label>Número de Documento</mat-label>
                <input 
                  matInput 
                  formControlName="numeroDocumentoSustentatorio"
                  placeholder="Ej: R-001-2025"
                  maxlength="100">
              </mat-form-field>
            </div>

            <div class="documento-grid">
              <!-- Entidad Emisora -->
              <mat-form-field appearance="outline">
                <mat-label>Entidad Emisora</mat-label>
                <input 
                  matInput 
                  formControlName="entidadEmisora"
                  placeholder="Ej: DRTC Puno"
                  maxlength="200">
              </mat-form-field>

              <!-- Fecha del Documento -->
              <mat-form-field appearance="outline">
                <mat-label>Fecha del Documento</mat-label>
                <input 
                  matInput 
                  [matDatepicker]="picker"
                  formControlName="fechaDocumento">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
            </div>

            <!-- Documento Físico -->
            <div class="documento-fisico-section">
              <mat-checkbox formControlName="esDocumentoFisico">
                El documento es físico (requiere escaneo)
              </mat-checkbox>
              
              <!-- URL del documento (solo si es físico) -->
              <mat-form-field 
                appearance="outline" 
                class="full-width"
                *ngIf="cambioEstadoForm.get('esDocumentoFisico')?.value">
                <mat-label>URL del Documento Escaneado</mat-label>
                <input 
                  matInput 
                  formControlName="urlDocumentoSustentatorio"
                  placeholder="https://..."
                  type="url">
                <mat-hint>Solo necesario si el documento es físico y se ha escaneado</mat-hint>
              </mat-form-field>
            </div>
          </div>

          <!-- Observaciones -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observaciones Adicionales</mat-label>
            <textarea 
              matInput 
              formControlName="observaciones" 
              rows="2"
              placeholder="Observaciones adicionales (opcional)..."
              maxlength="1000">
            </textarea>
            <mat-hint>{{ cambioEstadoForm.get('observaciones')?.value?.length || 0 }}/1000</mat-hint>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="modal-actions">
        <button mat-button mat-dialog-close>
          <app-smart-icon name="cancel"></app-smart-icon>
          Cancelar
        </button>
        <button 
          mat-raised-button 
          color="primary"
          (click)="confirmarCambio()"
          [disabled]="cambioEstadoForm.invalid || isSubmitting">
          <app-smart-icon name="check" *ngIf="!isSubmitting"></app-smart-icon>
          <mat-spinner diameter="20" *ngIf="isSubmitting"></mat-spinner>
          Cambiar Estado
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .cambio-estado-modal {
      width: 600px;
      max-width: 90vw;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      color: #1976d2;
    }

    .modal-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .empresa-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .empresa-info h3 {
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .empresa-info p {
      margin: 4px 0;
      font-size: 14px;
    }

    .estado-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .estado-autorizada { background: #e8f5e8; color: #2e7d32; }
    .estado-en_tramite { background: #fff3e0; color: #f57c00; }
    .estado-suspendida { background: #ffebee; color: #d32f2f; }
    .estado-cancelada { background: #fafafa; color: #616161; }
    .estado-dada_de_baja { background: #ffebee; color: #d32f2f; }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .documento-section {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      background: #fafafa;
    }

    .documento-section h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      color: #1976d2;
    }

    .documento-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .documento-fisico-section {
      margin-top: 16px;
    }

    .modal-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    @media (max-width: 600px) {
      .cambio-estado-modal {
        width: 100%;
        max-width: 100vw;
      }

      .documento-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CambioEstadoModalComponent implements OnInit {
  cambioEstadoForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CambioEstadoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CambioEstadoModalData
  ) {
    this.cambioEstadoForm = this.fb.group({
      estadoNuevo: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      tipoDocumentoSustentatorio: [''],
      numeroDocumentoSustentatorio: [''],
      esDocumentoFisico: [false],
      urlDocumentoSustentatorio: [''],
      fechaDocumento: [''],
      entidadEmisora: [''],
      observaciones: ['', Validators.maxLength(1000)]
    });
  }

  ngOnInit(): void {
    // Filtrar estados disponibles (no permitir cambiar al mismo estado)
    // Esto se podría hacer dinámicamente según las reglas de negocio
  }

  getEstadoLabel(estado: EstadoEmpresa): string {
    const labels = {
      'AUTORIZADO': 'Autorizado',
      'EN_TRAMITE': 'En Trámite',
      'SUSPENDIDO': 'Suspendido',
      'CANCELADO': 'Cancelado'
    };
    return labels[estado] || estado;
  }

  confirmarCambio(): void {
    if (this.cambioEstadoForm.valid) {
      this.isSubmitting = true;
      
      const formValue = this.cambioEstadoForm.value;
      const cambioEstado: EmpresaCambioEstado = {
        estadoNuevo: formValue.estadoNuevo,
        motivo: formValue.motivo,
        tipoDocumentoSustentatorio: formValue.tipoDocumentoSustentatorio || undefined,
        numeroDocumentoSustentatorio: formValue.numeroDocumentoSustentatorio || undefined,
        esDocumentoFisico: formValue.esDocumentoFisico || false,
        urlDocumentoSustentatorio: formValue.urlDocumentoSustentatorio || undefined,
        fechaDocumento: formValue.fechaDocumento || undefined,
        entidadEmisora: formValue.entidadEmisora || undefined,
        observaciones: formValue.observaciones || undefined
      };

      // Emitir el resultado
      this.dialogRef.close(cambioEstado);
    }
  }
}