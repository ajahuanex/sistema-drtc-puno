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
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ExpedienteService } from '../../services/expediente.service';
import { ExpedienteCreate, TipoSolicitante, TipoExpediente } from '../../models/expediente.model';
import { EmpresaSelectorComponent } from '../../shared/empresa-selector.component';
import { ExpedienteNumberValidatorComponent } from '../../shared/expediente-number-validator.component';
import { ResolucionSelectorComponent } from '../../shared/resolucion-selector.component';

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
    ExpedienteNumberValidatorComponent,
    ResolucionSelectorComponent
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
              
              <!-- 1. Empresa (Ahora al inicio) -->
              <div class="form-row">
                <app-empresa-selector
                  label="Empresa *"
                  placeholder="Buscar empresa por RUC o razón social"
                  hint="Selecciona la empresa solicitante"
                  [empresaId]="empresaId()"
                  [required]="true"
                  (empresaIdChange)="onEmpresaIdChange($event)"
                  (empresaSeleccionada)="onEmpresaSeleccionada($event)">
                </app-empresa-selector>
              </div>

              <!-- 2. Tipo de Expediente (Segundo orden) -->
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Tipo de Expediente *</mat-label>
                  <mat-select formControlName="tipoTramite" (selectionChange)="onTipoTramiteChange($event)" required>
                    <mat-option value="AUTORIZACION_NUEVA">Autorización Nueva (Primigenia)</mat-option>
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
                <app-expediente-number-validator
                  label="Número de Expediente *"
                  placeholder="Ej: 0001"
                  hint="El sistema generará E-0001-2025"
                  [required]="true"
                  [empresaId]="empresaId()"
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

              <!-- Expediente Relacionado - Opcional para vincular expedientes que se tramitan juntos -->
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Expediente Relacionado (Opcional)</mat-label>
                  <mat-select formControlName="expedienteRelacionadoId">
                    <mat-option value="">Ninguno</mat-option>
                    <mat-option *ngFor="let exp of expedientesDisponibles()" [value]="exp.id">
                      {{ exp.nroExpediente }} - {{ exp.tipoTramite }} - {{ exp.descripcion?.substring(0, 40) }}...
                    </mat-option>
                  </mat-select>
                  <mat-hint *ngIf="expedientesDisponibles().length === 0 && empresaId()">
                    No hay expedientes en trámite de esta empresa para relacionar
                  </mat-hint>
                  <mat-hint *ngIf="expedientesDisponibles().length > 0">
                    Vincule con otro expediente en trámite de la misma empresa
                  </mat-hint>
                  <mat-hint *ngIf="!empresaId()">
                    Seleccione primero una empresa
                  </mat-hint>
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
                    <mat-option value="MEDIA">Normal</mat-option>
                    <mat-option value="ALTA">Alta</mat-option>
                    <mat-option value="URGENTE">Urgente</mat-option>                  </mat-select>
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

    .resolucion-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .resolucion-numero {
      font-weight: 500;
      color: #1976d2;
    }

    .resolucion-tipo {
      font-size: 0.9em;
      color: #666;
    }

    .resolucion-fecha {
      font-size: 0.8em;
      color: #999;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrearExpedienteModalComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CrearExpedienteModalComponent>);
  private expedienteService = inject(ExpedienteService);
  
  isSubmitting = signal(false);
  empresaSeleccionada = signal<any>(null);
  empresaId = signal<string>(''); // Señal reactiva para el ID de empresa
  expedienteRelacionadoSeleccionado = signal<any>(null);
  resolucionPadreSeleccionada = signal<any>(null);
  expedientesDisponibles = signal<any[]>([]); // Lista de expedientes disponibles para relacionar
  
  expedienteForm: FormGroup;

  constructor() {
    this.expedienteForm = this.fb.group({
      numero: ['', [Validators.required, Validators.minLength(1)]],
      folio: [1, [Validators.required, Validators.min(1)]],
      tipoTramite: ['', Validators.required],
      expedienteRelacionadoId: [''], // Campo para expediente relacionado (opcional)
      resolucionPadreId: [''], // Campo para resolución padre (opcional cuando hay empresa)
      descripcion: [''],
      fechaEmision: ['', Validators.required],
      prioridad: ['MEDIA', Validators.required],
      empresaId: ['', Validators.required], // Ahora es obligatorio
      observaciones: ['']
    });

    // Suscribirse a cambios en el tipo de trámite para generar descripción automática
    this.expedienteForm.get('tipoTramite')?.valueChanges.subscribe(tipoTramite => {
      if (tipoTramite) {
        const descripcionAutomatica = this.generarDescripcionAutomatica(tipoTramite);
        this.expedienteForm.get('descripcion')?.setValue(descripcionAutomatica, { emitEvent: false });
        
        // Limpiar resoluciones cuando cambia el tipo
        this.expedienteForm.patchValue({ 
          expedienteRelacionadoId: '',
          resolucionPadreId: ''
        });
        this.expedienteRelacionadoSeleccionado.set(null);
        this.resolucionPadreSeleccionada.set(null);
        
        // Cargar expedientes disponibles según el tipo de trámite
        this.cargarExpedientesDisponibles();
      }
    });
    
    // Suscribirse a cambios en la empresa para recargar expedientes
    this.expedienteForm.get('empresaId')?.valueChanges.subscribe(() => {
      this.cargarExpedientesDisponibles();
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
      'AUTORIZACION_NUEVA': 'SOLICITUD DE AUTORIZACIÓN PRIMIGENIA PARA OPERAR TRANSPORTE PÚBLICO DE PASAJEROS EN RUTAS INTERPROVINCIALES',
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
      
      // Generar el número completo de expediente
      const numero = this.expedienteForm.value.numero;
      const fechaEmision = this.expedienteForm.value.fechaEmision;
      const año = fechaEmision instanceof Date ? fechaEmision.getFullYear() : new Date(fechaEmision).getFullYear();
      const numeroFormateado = numero.padStart(4, '0');
      const nroExpedienteCompleto = `E-${numeroFormateado}-${año}`;
      
      const expedienteData: ExpedienteCreate = {
          nroExpediente: nroExpedienteCompleto,
          folio: this.expedienteForm.value.folio,
          fechaEmision: this.expedienteForm.value.fechaEmision,
          tipoTramite: this.expedienteForm.value.tipoTramite,
         
          empresaId: this.expedienteForm.value.empresaId || '',
          expedienteRelacionadoId: this.expedienteForm.value.expedienteRelacionadoId || undefined,
          resolucionPadreId: this.expedienteForm.value.resolucionPadreId || undefined,
          descripcion: this.expedienteForm.value.descripcion,
          observaciones: this.expedienteForm.value.observaciones,
          prioridad: this.expedienteForm.value.prioridad
        };

      // Crear expediente usando el servicio
      this.expedienteService.createExpediente(expedienteData).subscribe({
        next: (expedienteCreado) => {
          this.isSubmitting.set(false);
          this.snackBar.open('Expediente creado exitosamente', 'Cerrar', {
            duration: 3000
          });
          this.dialogRef.close(expedienteCreado);
        },
        error: (error) => {
          console.error('Error al crear expediente:', error);
          this.isSubmitting.set(false);
          this.snackBar.open('Error al crear expediente', 'Cerrar', {
            duration: 3000
          });
        }
      });
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
    console.log('🏢 Cambio de empresa ID:', empresaId);
    this.expedienteForm.get('empresaId')?.setValue(empresaId, { emitEvent: false });
    this.empresaId.set(empresaId); // Actualizar señal reactiva
  }

  /**
   * Maneja la selección de una empresa
   */
  onEmpresaSeleccionada(empresa: any): void {
    if (empresa) {
      console.log('🏢 Empresa seleccionada:', empresa);
      this.empresaSeleccionada.set(empresa);
      this.empresaId.set(empresa.id); // Actualizar señal reactiva
      this.snackBar.open(`Empresa seleccionada: ${empresa.razonSocial.principal}`, 'Cerrar', {
        duration: 2000
      });
    } else {
      // Si se deselecciona la empresa, limpiar resolución padre
      console.log('🏢 Empresa deseleccionada');
      this.empresaSeleccionada.set(null);
      this.empresaId.set(''); // Limpiar señal reactiva
      this.expedienteForm.patchValue({ resolucionPadreId: '' });
      this.resolucionPadreSeleccionada.set(null);
    }
  }

  /**
   * Maneja el cambio de tipo de trámite
   */
  onTipoTramiteChange(event: any): void {
    // La lógica ya está en el valueChanges del constructor
  }

  /**
   * Maneja el cambio del ID de expediente relacionado
   */
  onExpedienteRelacionadoIdChange(expedienteId: string): void {
    this.expedienteForm.get('expedienteRelacionadoId')?.setValue(expedienteId, { emitEvent: false });
  }

  /**
   * Maneja la selección de un expediente relacionado
   */
  onExpedienteRelacionadoSeleccionado(expediente: any): void {
    if (expediente) {
      this.expedienteRelacionadoSeleccionado.set(expediente);
      this.snackBar.open(`Expediente relacionado vinculado: ${expediente.nroExpediente}`, 'Cerrar', {
        duration: 2000
      });
    } else {
      this.expedienteRelacionadoSeleccionado.set(null);
    }
  }

  /**
   * Obtiene el filtro de tipo de trámite apropiado
   */
  getFiltroTipoTramite(): string {
    return 'AUTORIZACION_NUEVA'; // Solo mostrar resoluciones primigenias
  }

  /**
   * Carga los expedientes disponibles para relacionar
   * Regla: Se puede relacionar con cualquier expediente de la misma empresa
   * que esté en estado EN_PROCESO
   */
  cargarExpedientesDisponibles(): void {
    const empresaId = this.expedienteForm.get('empresaId')?.value;
    
    // Si no hay empresa, no cargar expedientes
    if (!empresaId) {
      this.expedientesDisponibles.set([]);
      return;
    }
    
    // Cargar expedientes de la empresa que estén en proceso
    this.expedienteService.getExpedientesByEmpresa(empresaId).subscribe({
      next: (expedientes) => {
        // Filtrar solo expedientes en estado EN_PROCESO
        const expedientesFiltrados = expedientes.filter(exp => 
          exp.estado === 'EN_PROCESO'
        );
        
        console.log('📋 Expedientes de la empresa:', expedientes.length);
        console.log('📋 Expedientes filtrados (EN_PROCESO):', expedientesFiltrados.length);
        
        this.expedientesDisponibles.set(expedientesFiltrados);
      },
      error: (error) => {
        console.error('Error al cargar expedientes:', error);
        this.expedientesDisponibles.set([]);
      }
    });
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

  /**
   * Maneja el cambio del ID de resolución padre
   */
  onResolucionPadreIdChange(resolucionId: string): void {
    this.expedienteForm.get('resolucionPadreId')?.setValue(resolucionId, { emitEvent: false });
  }

  /**
   * Maneja la selección de una resolución padre
   */
  onResolucionPadreSeleccionada(resolucion: any): void {
    if (resolucion) {
      this.resolucionPadreSeleccionada.set(resolucion);
      this.snackBar.open(`Resolución padre seleccionada: ${resolucion.nroResolucion}`, 'Cerrar', {
        duration: 2000
      });
    } else {
      this.resolucionPadreSeleccionada.set(null);
    }
  }
}