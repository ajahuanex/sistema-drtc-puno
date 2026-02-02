import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { DerivacionService } from '../../services/mesa-partes/derivacion.service';
import { Documento } from '../../models/mesa-partes/documento.model';
import { Area, DerivacionCreate } from '../../models/mesa-partes/derivacion.model';

export interface DerivarDocumentoDialogData {
  documento: Documento;
  areasDisponibles: Area[];
}

@Component({
  selector: 'app-derivar-documento',
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
    MatSnackBarModule,
    MatCardModule,
    MatDividerModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>send</mat-icon>
          Derivar Documento
        </h2>
        <button mat-icon-button (click)="cerrar()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <!-- Información del Documento -->
        <mat-card class="documento-info-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>description</mat-icon>
              Información del Documento
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Expediente:</span>
                <span class="value">{{ documento.numeroExpediente }}</span>
              </div>
              <div class="info-item">
                <span class="label">Tipo:</span>
                <span class="value">{{ documento.tipoDocumento.nombre }}</span>
              </div>
              <div class="info-item">
                <span class="label">Remitente:</span>
                <span class="value">{{ documento.remitente }}</span>
              </div>
              <div class="info-item">
                <span class="label">Asunto:</span>
                <span class="value">{{ documento.asunto }}</span>
              </div>
              <div class="info-item">
                <span class="label">Estado:</span>
                <span class="value status-chip" [class]="documento.estado.toLowerCase()">
                  {{ documento.estado }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">Prioridad:</span>
                <span class="value prioridad-chip" [class]="documento.prioridad.toLowerCase()">
                  {{ documento.prioridad }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-divider></mat-divider>

        <!-- Formulario de Derivación -->
        <form [formGroup]="derivacionForm" class="derivacion-form">
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>business</mat-icon>
                Datos de Derivación
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <!-- Selector de Áreas (Múltiple) -->
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Área(s) Destino *</mat-label>
                  <mat-select formControlName="areasDestinoIds" multiple required>
                    @for (area of areasDisponibles; track area.id) {
                      <mat-option [value]="area.id">
                        {{ area.nombre }}
                        @if (area.codigo) {
                          <span class="area-codigo">({{ area.codigo }})</span>
                        }
                      </mat-option>
                    }
                  </mat-select>
                  <mat-icon matSuffix>business</mat-icon>
                  <mat-hint>Selecciona una o más áreas destino</mat-hint>
                  <mat-error *ngIf="derivacionForm.get('areasDestinoIds')?.hasError('required')">
                    Debe seleccionar al menos un área destino
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Áreas Seleccionadas -->
              @if (areasSeleccionadas().length > 0) {
                <div class="areas-seleccionadas">
                  <h4>Áreas Seleccionadas:</h4>
                  <div class="areas-chips">
                    @for (area of areasSeleccionadas(); track area.id) {
                      <div class="area-chip">
                        <mat-icon>business</mat-icon>
                        <span>{{ area.nombre }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Campo de Instrucciones -->
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Instrucciones / Notas *</mat-label>
                  <textarea 
                    matInput 
                    formControlName="instrucciones" 
                    placeholder="Ingrese las instrucciones para el área destino"
                    rows="4"
                    required></textarea>
                  <mat-icon matSuffix>notes</mat-icon>
                  <mat-hint>Instrucciones para el área que recibirá el documento</mat-hint>
                  <mat-error *ngIf="derivacionForm.get('instrucciones')?.hasError('required')">
                    Las instrucciones son obligatorias
                  </mat-error>
                  <mat-error *ngIf="derivacionForm.get('instrucciones')?.hasError('minlength')">
                    Las instrucciones deben tener al menos 10 caracteres
                  </mat-error>
                </mat-form-field>
              </div>

              <mat-divider></mat-divider>

              <!-- Opciones Adicionales -->
              <div class="opciones-adicionales">
                <h4>Opciones Adicionales</h4>

                <!-- Checkbox Urgente -->
                <div class="form-row">
                  <mat-checkbox formControlName="esUrgente" class="urgente-checkbox">
                    <div class="checkbox-content">
                      <mat-icon class="urgente-icon">priority_high</mat-icon>
                      <span>Marcar como Urgente</span>
                    </div>
                  </mat-checkbox>
                </div>

                @if (derivacionForm.get('esUrgente')?.value) {
                  <div class="urgente-warning">
                    <mat-icon>warning</mat-icon>
                    <span>Este documento será marcado como urgente y tendrá prioridad en la atención</span>
                  </div>
                }

                <!-- Fecha Límite -->
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Fecha Límite de Atención</mat-label>
                    <input 
                      matInput 
                      [matDatepicker]="fechaLimitePicker" 
                      formControlName="fechaLimite"
                      [min]="fechaMinima">
                    <mat-datepicker-toggle matSuffix [for]="fechaLimitePicker"></mat-datepicker-toggle>
                    <mat-datepicker #fechaLimitePicker></mat-datepicker>
                    <mat-icon matSuffix>event</mat-icon>
                    <mat-hint>Fecha límite para atender el documento (opcional)</mat-hint>
                    <mat-error *ngIf="derivacionForm.get('fechaLimite')?.hasError('min')">
                      La fecha límite debe ser posterior a hoy
                    </mat-error>
                  </mat-form-field>
                </div>

                <!-- Notificar por Email -->
                <div class="form-row">
                  <mat-checkbox formControlName="notificarEmail" class="email-checkbox">
                    <div class="checkbox-content">
                      <mat-icon>email</mat-icon>
                      <span>Notificar por correo electrónico</span>
                    </div>
                  </mat-checkbox>
                </div>

                @if (derivacionForm.get('notificarEmail')?.value) {
                  <div class="email-info">
                    <mat-icon>info</mat-icon>
                    <span>Se enviará una notificación por email a los responsables de las áreas seleccionadas</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </form>

        <!-- Confirmación -->
        @if (mostrarConfirmacion()) {
          <mat-card class="confirmacion-card">
            <mat-card-content>
              <div class="confirmacion-content">
                <mat-icon class="warning-icon">help_outline</mat-icon>
                <div class="confirmacion-text">
                  <h3>¿Está seguro de derivar este documento?</h3>
                  <p>
                    El documento <strong>{{ documento.numeroExpediente }}</strong> será derivado a 
                    <strong>{{ (areasSeleccionadas())?.length || 0 }}</strong> 
                    {{ areasSeleccionadas().length === 1 ? 'área' : 'áreas' }}.
                  </p>
                  @if (derivacionForm.get('esUrgente')?.value) {
                    <p class="urgente-text">
                      <mat-icon>priority_high</mat-icon>
                      Este documento será marcado como <strong>URGENTE</strong>
                    </p>
                  }
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="modal-actions">
        <button 
          mat-stroked-button 
          (click)="cerrar()" 
          [disabled]="isSubmitting()"
          class="secondary-button">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>

        @if (!mostrarConfirmacion()) {
          <button 
            mat-raised-button 
            color="primary"
            (click)="solicitarConfirmacion()" 
            [disabled]="!derivacionForm.valid || isSubmitting()"
            class="primary-button">
            <mat-icon>send</mat-icon>
            Derivar Documento
          </button>
        }

        @if (mostrarConfirmacion()) {
          <button 
            mat-stroked-button 
            (click)="cancelarConfirmacion()" 
            [disabled]="isSubmitting()"
            class="secondary-button">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
          <button 
            mat-raised-button 
            color="primary"
            (click)="confirmarDerivacion()" 
            [disabled]="isSubmitting()"
            class="primary-button confirm-button">
            @if (isSubmitting()) {
              <mat-spinner diameter="20"></mat-spinner>
            }
            @if (!isSubmitting()) {
              <mat-icon>check_circle</mat-icon>
            }
            {{ isSubmitting() ? 'Derivando...' : 'Confirmar Derivación' }}
          </button>
        }
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .modal-container {
      max-width: 800px;
      width: 100%;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .modal-header h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #1976d2;
    }

    .close-button {
      color: #666;
    }

    .modal-content {
      max-height: 70vh;
      overflow-y: auto;
      padding: 0 4px;
    }

    .documento-info-card {
      margin-bottom: 16px;
      border-radius: 8px;
      background-color: #f8f9fa;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .value {
      font-weight: 600;
      color: #333;
    }

    .status-chip, .prioridad-chip {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      display: inline-block;
      width: fit-content;
    }

    .status-chip.registrado {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .status-chip.en_proceso {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .status-chip.atendido {
      background-color: #e8f5e9;
      color: #388e3c;
    }

    .status-chip.archivado {
      background-color: #f5f5f5;
      color: #757575;
    }

    .prioridad-chip.normal {
      background-color: #e8f5e9;
      color: #388e3c;
    }

    .prioridad-chip.alta {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .prioridad-chip.urgente {
      background-color: #ffebee;
      color: #d32f2f;
    }

    mat-divider {
      margin: 16px 0;
    }

    .form-card {
      margin-bottom: 16px;
      border-radius: 8px;
    }

    .form-row {
      margin-bottom: 16px;
    }

    .form-field {
      width: 100%;
    }

    .full-width {
      width: 100%;
    }

    .area-codigo {
      font-size: 11px;
      color: #666;
      margin-left: 4px;
    }

    .areas-seleccionadas {
      margin: 16px 0;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .areas-seleccionadas h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #1976d2;
      font-weight: 600;
    }

    .areas-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .area-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background-color: white;
      border: 1px solid #1976d2;
      border-radius: 16px;
      font-size: 13px;
      color: #1976d2;
    }

    .area-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .opciones-adicionales {
      margin-top: 16px;
    }

    .opciones-adicionales h4 {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #333;
      font-weight: 600;
    }

    .urgente-checkbox, .email-checkbox {
      margin-bottom: 8px;
    }

    .checkbox-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .urgente-icon {
      color: #d32f2f;
    }

    .urgente-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #fff3e0;
      border-radius: 8px;
      border-left: 4px solid #f57c00;
      margin-bottom: 16px;
      font-size: 13px;
      color: #e65100;
    }

    .urgente-warning mat-icon {
      color: #f57c00;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .email-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #e8f5e9;
      border-radius: 8px;
      border-left: 4px solid #388e3c;
      margin-top: 8px;
      font-size: 13px;
      color: #2e7d32;
    }

    .email-info mat-icon {
      color: #388e3c;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .confirmacion-card {
      margin-top: 16px;
      border-radius: 8px;
      border: 2px solid #ff9800;
      background-color: #fff3e0;
    }

    .confirmacion-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .warning-icon {
      color: #ff9800;
      font-size: 32px;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }

    .confirmacion-text h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      color: #e65100;
      font-weight: 600;
    }

    .confirmacion-text p {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }

    .urgente-text {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #d32f2f !important;
      font-weight: 600;
    }

    .urgente-text mat-icon {
      color: #d32f2f;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .modal-actions {
      padding: 16px 0;
      gap: 12px;
    }

    .primary-button, .secondary-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 4px;
      text-transform: uppercase;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.3s ease;
    }

    .primary-button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .secondary-button:hover:not(:disabled) {
      background-color: #f5f5f5;
      transform: translateY(-1px);
    }

    .confirm-button {
      background-color: #4caf50 !important;
    }

    .confirm-button:hover:not(:disabled) {
      background-color: #388e3c !important;
    }

    mat-spinner {
      display: inline-block;
    }
  `]
})
export class DerivarDocumentoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<DerivarDocumentoComponent>);
  private data = inject<DerivarDocumentoDialogData>(MAT_DIALOG_DATA);
  private derivacionService = inject(DerivacionService);

  isSubmitting = signal(false);
  mostrarConfirmacion = signal(false);
  areasSeleccionadas = signal<Area[]>([]);

  documento!: Documento;
  areasDisponibles: Area[] = [];
  derivacionForm!: FormGroup;
  fechaMinima = new Date();

  ngOnInit(): void {
    this.documento = this.data.documento;
    this.areasDisponibles = this.data.areasDisponibles;

    this.inicializarFormulario();
    this.configurarObservadores();
  }

  /**
   * Inicializa el formulario de derivación
   */
  private inicializarFormulario(): void {
    this.derivacionForm = this.fb.group({
      areasDestinoIds: [[], Validators.required],
      instrucciones: ['', [Validators.required, Validators.minLength(10)]],
      esUrgente: [false],
      fechaLimite: [''],
      notificarEmail: [true]
    });
  }

  /**
   * Configura los observadores del formulario
   */
  private configurarObservadores(): void {
    // Observar cambios en las áreas seleccionadas
    this.derivacionForm.get('areasDestinoIds')?.valueChanges.subscribe(areasIds => {
      const areas = this.areasDisponibles.filter(area => areasIds.includes(area.id));
      this.areasSeleccionadas.set(areas);
    });
  }

  /**
   * Solicita confirmación antes de derivar
   */
  solicitarConfirmacion(): void {
    if (this.derivacionForm.valid) {
      this.mostrarConfirmacion.set(true);
    }
  }

  /**
   * Cancela la confirmación
   */
  cancelarConfirmacion(): void {
    this.mostrarConfirmacion.set(false);
  }

  /**
   * Confirma y ejecuta la derivación
   */
  confirmarDerivacion(): void {
    if (!this.derivacionForm.valid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.derivacionForm.value;
    const areasIds: string[] = formValue.areasDestinoIds;

    // Si hay múltiples áreas, crear derivaciones para cada una
    if (areasIds.length > 1) {
      this.derivarAMultiplesAreas(areasIds, formValue);
    } else {
      this.derivarAUnaArea(areasIds[0], formValue);
    }
  }

  /**
   * Deriva el documento a una sola área
   */
  private derivarAUnaArea(areaId: string, formValue: any): void {
    const derivacion: DerivacionCreate = {
      documentoId: this.documento.id,
      areaDestinoId: areaId,
      instrucciones: formValue.instrucciones,
      esUrgente: formValue.esUrgente,
      fechaLimite: formValue.fechaLimite || undefined
    };

    this.derivacionService.derivarDocumento(derivacion).subscribe({
      next: (resultado) => {
        this.isSubmitting.set(false);
        this.mostrarMensajeExito(resultado.id);
        this.dialogRef.close(resultado);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.mostrarMensajeError(error);
      }
    });
  }

  /**
   * Deriva el documento a múltiples áreas
   */
  private derivarAMultiplesAreas(areasIds: string[], formValue: any): void {
    const derivaciones: DerivacionCreate[] = areasIds.map(areaId => ({
      documentoId: this.documento.id,
      areaDestinoId: areaId,
      instrucciones: formValue.instrucciones,
      esUrgente: formValue.esUrgente,
      fechaLimite: formValue.fechaLimite || undefined
    }));

    // Crear todas las derivaciones
    let completadas = 0;
    let errores = 0;
    const resultados: any[] = [];

    derivaciones.forEach(derivacion => {
      this.derivacionService.derivarDocumento(derivacion).subscribe({
        next: (resultado) => {
          completadas++;
          resultados.push(resultado);
          
          if (completadas + errores === derivaciones.length) {
            this.isSubmitting.set(false);
            if (errores === 0) {
              this.mostrarMensajeExitoMultiple(completadas);
              this.dialogRef.close(resultados);
            } else {
              this.mostrarMensajeExitoConErrores(completadas, errores);
              this.dialogRef.close(resultados);
            }
          }
        },
        error: (error) => {
          errores++;
          
          if (completadas + errores === derivaciones.length) {
            this.isSubmitting.set(false);
            if (completadas > 0) {
              this.mostrarMensajeExitoConErrores(completadas, errores);
              this.dialogRef.close(resultados);
            } else {
              this.mostrarMensajeError(error);
            }
          }
        }
      });
    });
  }

  /**
   * Muestra mensaje de éxito
   */
  private mostrarMensajeExito(derivacionId: string): void {
    const area = this.areasSeleccionadas()[0];
    this.snackBar.open(
      `✓ Documento derivado exitosamente a ${area.nombre}. ID: ${derivacionId.substring(0, 8)}...`,
      'Cerrar',
      {
        duration: 5000,
        panelClass: ['success-snackbar']
      }
    );
  }

  /**
   * Muestra mensaje de éxito para múltiples derivaciones
   */
  private mostrarMensajeExitoMultiple(cantidad: number): void {
    this.snackBar.open(
      `✓ Documento derivado exitosamente a ${cantidad} áreas`,
      'Cerrar',
      {
        duration: 5000,
        panelClass: ['success-snackbar']
      }
    );
  }

  /**
   * Muestra mensaje de éxito con errores
   */
  private mostrarMensajeExitoConErrores(exitosas: number, errores: number): void {
    this.snackBar.open(
      `⚠ ${exitosas} derivaciones exitosas, ${errores} con errores`,
      'Cerrar',
      {
        duration: 6000,
        panelClass: ['warning-snackbar']
      }
    );
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarMensajeError(error: any): void {
    const mensaje = error?.error?.message || 'Error al derivar el documento';
    this.snackBar.open(
      `✗ ${mensaje}`,
      'Cerrar',
      {
        duration: 5000,
        panelClass: ['error-snackbar']
      }
    );
  }

  /**
   * Cierra el modal
   */
  cerrar(): void {
    if (!this.isSubmitting()) {
      this.dialogRef.close();
    }
  }
}
