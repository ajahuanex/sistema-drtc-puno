import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Vehiculo } from '../../models/vehiculo.model';

export interface SolicitudBajaData {
  vehiculo: Vehiculo;
}

export interface SolicitudBajaResult {
  motivo: string;
  descripcion: string;
  fechaSolicitud: Date;
  documentosSoporte?: string[];
}

@Component({
  selector: 'app-solicitar-baja-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule
  ],
  template: `
    <div class="solicitar-baja-modal">
      <div mat-dialog-title class="modal-header">
        <mat-icon class="header-icon">remove_circle</mat-icon>
        <h2>Solicitar Baja de Vehículo</h2>
      </div>

      <mat-dialog-content class="modal-content">
        <!-- Información del vehículo -->
        <mat-card class="vehiculo-info-card">
          <mat-card-header>
            <mat-card-title>Información del Vehículo</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="vehiculo-info-grid">
              <div class="info-item">
                <strong>Placa:</strong>
                <span class="info-value">{{ data.vehiculo.placa }}</span>
              </div>
              <div class="info-item">
                <strong>Marca:</strong>
                <span class="info-value">{{ data.vehiculo.marca || 'No especificada' }}</span>
              </div>
              <div class="info-item">
                <strong>Modelo:</strong>
                <span class="info-value">{{ data.vehiculo.modelo || 'No especificado' }}</span>
              </div>
              <div class="info-item">
                <strong>Estado Actual:</strong>
                <span class="info-value estado" [class]="'estado-' + data.vehiculo.estado?.toLowerCase()">
                  {{ data.vehiculo.estado }}
                </span>
              </div>
              @if (data.vehiculo.empresaActualId) {
                <div class="info-item">
                  <strong>Empresa:</strong>
                  <span class="info-value">{{ 'Empresa asignada' || 'No asignada' }}</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <mat-divider></mat-divider>

        <!-- Formulario de solicitud -->
        <form [formGroup]="solicitudForm" class="solicitud-form">
          <h3>Datos de la Solicitud</h3>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Motivo de la Baja</mat-label>
            <mat-select formControlName="motivo" required>
              <mat-option value="ACCIDENTE">Accidente Total</mat-option>
              <mat-option value="DETERIORO">Deterioro por Uso</mat-option>
              <mat-option value="OBSOLESCENCIA">Obsolescencia Tecnológica</mat-option>
              <mat-option value="CAMBIO_FLOTA">Cambio de Flota</mat-option>
              <mat-option value="VENTA">Venta del Vehículo</mat-option>
              <mat-option value="ROBO_HURTO">Robo o Hurto</mat-option>
              <mat-option value="INCUMPLIMIENTO">Incumplimiento Normativo</mat-option>
              <mat-option value="OTROS">Otros</mat-option>
            </mat-select>
            @if (solicitudForm.get('motivo')?.hasError('required') && solicitudForm.get('motivo')?.touched) {
              <mat-error>El motivo es requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descripción Detallada</mat-label>
            <textarea 
              matInput 
              formControlName="descripcion" 
              rows="4" 
              placeholder="Describa detalladamente las razones para solicitar la baja del vehículo..."
              required>
            </textarea>
            @if (solicitudForm.get('descripcion')?.hasError('required') && solicitudForm.get('descripcion')?.touched) {
              <mat-error>La descripción es requerida</mat-error>
            }
            @if (solicitudForm.get('descripcion')?.hasError('minlength')) {
              <mat-error>La descripción debe tener al menos 20 caracteres</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Fecha de Solicitud</mat-label>
            <input 
              matInput 
              [matDatepicker]="picker" 
              formControlName="fechaSolicitud"
              readonly
              required>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <!-- Información adicional -->
          <div class="info-section">
            <mat-icon class="info-icon">info</mat-icon>
            <div class="info-text">
              <p><strong>Importante:</strong></p>
              <ul>
                <li>Esta solicitud será enviada para revisión y aprobación</li>
                <li>El vehículo permanecerá activo hasta que se apruebe la baja</li>
                <li>Se notificará por email el estado de la solicitud</li>
                <li>Puede adjuntar documentos de soporte después de enviar la solicitud</li>
              </ul>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="modal-actions">
        <button mat-button (click)="onCancel()" [disabled]="isSubmitting()">
          Cancelar
        </button>
        <button 
          mat-raised-button 
          color="warn"
          (click)="onSubmit()" 
          [disabled]="!solicitudForm.valid || isSubmitting()">
          @if (isSubmitting()) {
            <mat-icon>hourglass_empty</mat-icon>
            Enviando...
          } @else {
            <mat-icon>send</mat-icon>
            Enviar Solicitud
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .solicitar-baja-modal {
      width: 100%;
      max-width: 700px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      color: white;
      margin: -24px -24px 0 -24px;
    }

    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .modal-content {
      padding: 24px 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    .vehiculo-info-card {
      margin-bottom: 24px;
    }

    .vehiculo-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item strong {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 14px;
      font-weight: 500;
    }

    .info-value.estado {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      text-align: center;
      text-transform: uppercase;
      font-weight: 600;
    }

    .estado-activo { background-color: #e8f5e8; color: #2e7d32; }
    .estado-inactivo { background-color: #fff3e0; color: #f57c00; }
    .estado-mantenimiento { background-color: #e3f2fd; color: #1976d2; }
    .estado-baja_temporal { background-color: #fce4ec; color: #c2185b; }
    .estado-baja_definitiva { background-color: #ffebee; color: #d32f2f; }

    .solicitud-form {
      margin-top: 24px;
    }

    .solicitud-form h3 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 18px;
      font-weight: 500;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .info-section {
      display: flex;
      gap: 12px;
      padding: 16px;
      background-color: #e3f2fd;
      border-radius: 8px;
      margin-top: 20px;
    }

    .info-icon {
      color: #1976d2;
      margin-top: 2px;
    }

    .info-text {
      flex: 1;
    }

    .info-text p {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-weight: 500;
    }

    .info-text ul {
      margin: 0;
      padding-left: 20px;
      color: #555;
    }

    .info-text li {
      margin-bottom: 4px;
      font-size: 14px;
    }

    .modal-actions {
      padding: 16px 24px;
      margin: 0 -24px -24px -24px;
      background-color: #fafafa;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .modal-actions button {
      min-width: 120px;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .solicitar-baja-modal {
        max-width: 95vw;
      }

      .vehiculo-info-grid {
        grid-template-columns: 1fr;
      }

      .modal-header {
        padding: 12px 16px;
      }

      .modal-actions {
        flex-direction: column;
      }

      .modal-actions button {
        width: 100%;
      }
    }
  `]
})
export class SolicitarBajaModalComponent {
  solicitudForm: FormGroup;
  isSubmitting = signal(false);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SolicitarBajaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SolicitudBajaData
  ) {
    this.solicitudForm = this.fb.group({
      motivo: ['', [Validators.required]],
      descripcion: ['', [Validators.required, Validators.minLength(20)]],
      fechaSolicitud: [new Date(), [Validators.required]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.solicitudForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const result: SolicitudBajaResult = {
        motivo: this.solicitudForm.value.motivo,
        descripcion: this.solicitudForm.value.descripcion,
        fechaSolicitud: this.solicitudForm.value.fechaSolicitud
      };

      // Simular delay de envío
      setTimeout(() => {
        this.dialogRef.close(result);
      }, 1500);
    }
  }
}