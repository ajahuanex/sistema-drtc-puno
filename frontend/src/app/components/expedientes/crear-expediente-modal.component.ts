import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ExpedienteService } from '../../services/expediente.service';
import { Expediente, ExpedienteCreate, TipoSolicitante, TipoExpediente } from '../../models/expediente.model';
import { EmpresaSelectorComponent } from '../../shared/empresa-selector.component';
import { ExpedienteNumberValidatorComponent } from '../../shared/expediente-number-validator.component';
import { ExpedienteValidationService } from '../../services/expediente-validation.service';

@Component({
  selector: 'app-crear-expediente-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    EmpresaSelectorComponent,
    ExpedienteNumberValidatorComponent
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>folder_open</mat-icon>
          Crear Nuevo Expediente
        </h2>
        <button mat-icon-button (click)="cerrar()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <form [formGroup]="expedienteForm" (ngSubmit)="onSubmit()" class="expediente-form">
          
          <!-- Información del Expediente -->
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>description</mat-icon>
                Información del Expediente
              </mat-card-title>
              <mat-card-subtitle>
                Datos básicos del nuevo expediente
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <app-expediente-number-validator
                  label="Número de Expediente *"
                  placeholder="Ej: 0001"
                  hint="El sistema generará E-0001-2025"
                  [required]="true"
                  [empresaId]="expedienteForm.get('empresaId')?.value"
                  (numeroValido)="onNumeroExpedienteValido($event)"
                  (numeroInvalido)="onNumeroExpedienteInvalido($event)"
                  (validacionCompleta)="onValidacionExpedienteCompleta($event)">
                </app-expediente-number-validator>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Folio *</mat-label>
                  <input matInput 
                         type="number"
                         formControlName="folio" 
                         placeholder="1"
                         min="1"
                         required>
                  <mat-icon matSuffix>description</mat-icon>
                  <mat-hint>Cantidad de hojas/páginas del expediente</mat-hint>
                  <mat-error *ngIf="expedienteForm.get('folio')?.hasError('required')">
                    El folio es obligatorio
                  </mat-error>
                  <mat-error *ngIf="expedienteForm.get('folio')?.hasError('min')">
                    El folio debe ser mayor a 0
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Tipo de Expediente *</mat-label>
                  <mat-select formControlName="tipoTramite" required>
                    <mat-option value="PRIMIGENIA">Primigenia</mat-option>
                    <mat-option value="RENOVACION">Renovación</mat-option>
                    <mat-option value="INCREMENTO">Incremento</mat-option>
                    <mat-option value="SUSTITUCION">Sustitución</mat-option>
                    <mat-option value="OTROS">Otros</mat-option>
                  </mat-select>
                  <mat-icon matSuffix>category</mat-icon>
                  <mat-hint>Tipo de trámite del expediente</mat-hint>
                  <mat-error *ngIf="expedienteForm.get('tipoTramite')?.hasError('required')">
                    El tipo de expediente es obligatorio
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Descripción (Generada Automáticamente)</mat-label>
                  <textarea matInput 
                            formControlName="descripcion" 
                            placeholder="Se genera automáticamente según el tipo de trámite"
                            rows="3"
                            readonly></textarea>
                  <mat-icon matSuffix>auto_awesome</mat-icon>
                  <mat-hint>Descripción generada automáticamente según el tipo de trámite seleccionado</mat-hint>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Fecha de Emisión *</mat-label>
                  <input matInput 
                         [matDatepicker]="fechaEmisionPicker" 
                         formControlName="fechaEmision"
                         required>
                  <mat-datepicker-toggle matSuffix [for]="fechaEmisionPicker"></mat-datepicker-toggle>
                  <mat-datepicker #fechaEmisionPicker></mat-datepicker>
                  <mat-icon matSuffix>event</mat-icon>
                  <mat-hint>Fecha de emisión del expediente</mat-hint>
                  <mat-error *ngIf="expedienteForm.get('fechaEmision')?.hasError('required')">
                    La fecha de emisión es obligatoria
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Prioridad *</mat-label>
                  <mat-select formControlName="prioridad" required>
                    <mat-option value="BAJA">Baja</mat-option>
                    <mat-option value="NORMAL">Normal</mat-option>
                    <mat-option value="ALTA">Alta</mat-option>
                    <mat-option value="URGENTE">Urgente</mat-option>
                    <mat-option value="CRITICA">Crítica</mat-option>
                  </mat-select>
                  <mat-icon matSuffix>priority_high</mat-icon>
                  <mat-hint>Nivel de prioridad del expediente</mat-hint>
                  <mat-error *ngIf="expedienteForm.get('prioridad')?.hasError('required')">
                    La prioridad es obligatoria
                  </mat-error>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Información Adicional -->
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>info</mat-icon>
                Información Adicional
              </mat-card-title>
              <mat-card-subtitle>
                Detalles adicionales del expediente
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>


              <div class="form-row">
                <app-empresa-selector
                  label="Empresa (Opcional)"
                  placeholder="Buscar empresa por RUC o razón social"
                  hint="Selecciona una empresa para crear dependencia (opcional)"
                  [empresaId]="expedienteForm.get('empresaId')?.value"
                  (empresaIdChange)="onEmpresaIdChange($event)"
                  (empresaSeleccionada)="onEmpresaSeleccionada($event)">
                </app-empresa-selector>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Observaciones</mat-label>
                  <textarea matInput 
                            formControlName="observaciones" 
                            placeholder="Observaciones adicionales"
                            rows="3"
                            (input)="convertirAMayusculas($event, 'observaciones')"></textarea>
                  <mat-icon matSuffix>note</mat-icon>
                  <mat-hint>Observaciones del expediente (opcional)</mat-hint>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="modal-actions">
        <button mat-stroked-button (click)="cerrar()" class="secondary-button">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="onSubmit()" 
                [disabled]="expedienteForm.invalid || isSubmitting()"
                class="primary-button">
          @if (isSubmitting()) {
            <mat-spinner diameter="20"></mat-spinner>
          }
          @if (!isSubmitting()) {
            <mat-icon>save</mat-icon>
          }
          {{ isSubmitting() ? 'Creando...' : 'Crear Expediente' }}
        </button>
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
    }

    .form-card {
      margin-bottom: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-field {
      width: 100%;
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

    .primary-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .secondary-button:hover {
      background-color: #f5f5f5;
      transform: translateY(-1px);
    }


  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrearExpedienteModalComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CrearExpedienteModalComponent>);
  private data = inject(MAT_DIALOG_DATA);
  private expedienteService = inject(ExpedienteService);
  private validationService = inject(ExpedienteValidationService);
  isSubmitting = signal(false);
  expedienteForm: FormGroup;

  constructor() {
    this.expedienteForm = this.fb.group({
      numero: ['', [Validators.required, Validators.minLength(1)]],
      folio: [1, [Validators.required, Validators.min(1)]],
      tipoTramite: ['', Validators.required],
      descripcion: [''],
      fechaEmision: ['', Validators.required],
      prioridad: ['NORMAL', Validators.required],
      empresaId: [''], // Campo opcional para empresa
      observaciones: ['']
    });

    // Suscribirse a cambios en el tipo de trámite para generar descripción automática
    this.expedienteForm.get('tipoTramite')?.valueChanges.subscribe(tipoTramite => {
      if (tipoTramite) {
        const descripcionAutomatica = this.generarDescripcionAutomatica(tipoTramite);
        this.expedienteForm.get('descripcion')?.setValue(descripcionAutomatica, { emitEvent: false });
      }
    });
  }

  /**
   * Convierte el texto a mayúsculas
   */
  convertirAMayusculas(event: any, controlName: string): void {
    const control = this.expedienteForm.get(controlName);
    if (control) {
      const value = event.target.value.toUpperCase();
      control.setValue(value, { emitEvent: false });
    }
  }

  /**
   * Obtiene el número completo del expediente reactivamente
   */
  getNumeroExpedienteCompleto(): string {
    const numero = this.expedienteForm.get('numero')?.value || '';
    const fechaEmision = this.expedienteForm.get('fechaEmision')?.value;
    
    if (!numero || !fechaEmision) {
      return 'E-XXXX-YYYY';
    }
    
    const año = fechaEmision instanceof Date ? fechaEmision.getFullYear() : new Date(fechaEmision).getFullYear();
    const numeroFormateado = numero.padStart(4, '0');
    
    return `E-${numeroFormateado}-${año}`;
  }

  /**
   * Genera la descripción automática basada en el tipo de trámite
   */
  generarDescripcionAutomatica(tipoTramite: string): string {
    const descripciones = {
      'PRIMIGENIA': 'SOLICITUD DE AUTORIZACIÓN PRIMIGENIA PARA OPERAR TRANSPORTE PÚBLICO DE PASAJEROS EN RUTAS INTERPROVINCIALES',
      'RENOVACION': 'SOLICITUD DE RENOVACIÓN DE AUTORIZACIÓN DE TRANSPORTE PÚBLICO DE PASAJEROS - VENCIMIENTO PRÓXIMO',
      'INCREMENTO': 'SOLICITUD DE INCREMENTO DE FLOTA VEHICULAR PARA AMPLIAR COBERTURA DE RUTAS AUTORIZADAS',
      'SUSTITUCION': 'SOLICITUD DE SUSTITUCIÓN DE VEHÍCULOS EN FLOTA EXISTENTE POR UNIDADES MÁS MODERNAS Y EFICIENTES',
      'OTROS': 'SOLICITUD ADMINISTRATIVA GENERAL - TRÁMITE DIVERSO'
    };

    return descripciones[tipoTramite as keyof typeof descripciones] || 'SOLICITUD DE AUTORIZACIÓN DE TRANSPORTE PÚBLICO';
  }

  /**
   * Envía el formulario
   */
  onSubmit(): void {
    if (this.expedienteForm.valid) {
      this.isSubmitting.set(true);
      
              const expedienteData: ExpedienteCreate = {
          numero: this.expedienteForm.value.numero,
          folio: this.expedienteForm.value.folio,
          fechaEmision: this.expedienteForm.value.fechaEmision,
          tipoTramite: this.expedienteForm.value.tipoTramite,
          tipoExpediente: TipoExpediente.OTROS,
          tipoSolicitante: TipoSolicitante.EMPRESA,
          empresaId: this.expedienteForm.value.empresaId || '',
          descripcion: this.expedienteForm.value.descripcion,
          observaciones: this.expedienteForm.value.observaciones,
          prioridad: this.expedienteForm.value.prioridad
        };

      // TODO: Implementar creación real del expediente
      setTimeout(() => {
        this.isSubmitting.set(false);
        this.snackBar.open('Expediente creado exitosamente', 'Cerrar', {
          duration: 3000
        });
        
        // Generar el número completo del expediente usando la lógica correcta
        const año = expedienteData.fechaEmision.getFullYear();
        const numeroFormateado = expedienteData.numero.padStart(4, '0');
        const nroExpediente = `E-${numeroFormateado}-${año}`;

        // Retornar el expediente creado
        const expedienteCreado: Expediente = {
          id: Date.now().toString(),
          nroExpediente: nroExpediente,
          folio: expedienteData.folio,
          fechaEmision: expedienteData.fechaEmision,
          tipoTramite: expedienteData.tipoTramite,
          tipoSolicitante: expedienteData.tipoSolicitante,
          estado: 'EN PROCESO',
          estaActivo: true,
          fechaRegistro: new Date(),
          empresaId: expedienteData.empresaId,
          descripcion: expedienteData.descripcion,
          observaciones: expedienteData.observaciones
        };
        
        this.dialogRef.close(expedienteCreado);
      }, 1000);
    }
  }

  /**
   * Cierra el modal
   */
  cerrar(): void {
    this.dialogRef.close();
  }

  /**
   * Maneja el cambio del ID de empresa
   */
  onEmpresaIdChange(empresaId: string): void {
    this.expedienteForm.get('empresaId')?.setValue(empresaId, { emitEvent: false });
  }

  /**
   * Maneja la selección de una empresa
   */
  onEmpresaSeleccionada(empresa: any): void {
    if (empresa) {
      // Opcional: Mostrar un mensaje de confirmación
      this.snackBar.open(`Empresa seleccionada: ${empresa.razonSocial.principal}`, 'Cerrar', {
        duration: 2000
      });
    }
  }

  /**
   * Maneja cuando el número de expediente es válido
   */
  onNumeroExpedienteValido(data: { numero: string; año: number; nroCompleto: string }): void {
    this.expedienteForm.get('numero')?.setValue(data.numero);
    
    // Mostrar confirmación
    this.snackBar.open(`Número de expediente válido: ${data.nroCompleto}`, 'Cerrar', {
      duration: 2000
    });
  }

  /**
   * Maneja cuando el número de expediente es inválido
   */
  onNumeroExpedienteInvalido(mensaje: string): void {
    this.expedienteForm.get('numero')?.setErrors({ duplicado: true });
    
    // Mostrar error
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Maneja cuando la validación está completa
   */
  onValidacionExpedienteCompleta(resultado: any): void {
    // La validación se completó, el formulario se actualiza automáticamente
    console.log('Validación de expediente completada:', resultado);
  }
} 