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
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { ResolucionService } from '../../services/resolucion.service';
import { EmpresaService } from '../../services/empresa.service';
import { ExpedienteService } from '../../services/expediente.service';
import { Resolucion, ResolucionCreate, TipoTramite, TipoResolucion } from '../../models/resolucion.model';
import { Empresa } from '../../models/empresa.model';
import { Expediente } from '../../models/expediente.model';
import { CrearExpedienteModalComponent } from '../expedientes/crear-expediente-modal.component';
import { ResolucionNumberValidatorComponent } from '../../shared/resolucion-number-validator.component';
import { EmpresaSelectorComponent } from '../../shared/empresa-selector.component';
import { ResolucionValidationService } from '../../services/resolucion-validation.service';

@Component({
  selector: 'app-crear-resolucion-modal',
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
    MatTabsModule,
    MatExpansionModule,
    MatAutocompleteModule,
    ResolucionNumberValidatorComponent,
    EmpresaSelectorComponent
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>description</mat-icon>
          Crear Nueva Resolución
        </h2>
        <button mat-icon-button (click)="cerrar()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <form [formGroup]="resolucionForm" (ngSubmit)="onSubmit()" class="resolucion-form">
          
          <!-- Paso 1: Selección de Empresa -->
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>business</mat-icon>
                Paso 1: Selección de Empresa
              </mat-card-title>
              <mat-card-subtitle>
                Selecciona la empresa para la nueva resolución
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <app-empresa-selector
                  [label]="'EMPRESA'"
                  [placeholder]="'Buscar por RUC, razón social o código'"
                  [hint]="'Seleccione la empresa para la cual se creará la resolución'"
                  [required]="true"
                  [empresaId]="resolucionForm.get('empresaId')?.value"
                  (empresaSeleccionada)="onEmpresaSeleccionadaBuscador($event)"
                  (empresaIdChange)="resolucionForm.patchValue({ empresaId: $event })">
                </app-empresa-selector>
              </div>

              @if (empresaSeleccionada()) {
                <div class="empresa-info">
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="label">RUC:</span>
                      <span class="value">{{ empresaSeleccionada()?.ruc }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">Razón Social:</span>
                      <span class="value">{{ empresaSeleccionada()?.razonSocial?.principal }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">Estado:</span>
                      <span class="value status-chip" [class]="empresaSeleccionada()?.estado?.toLowerCase()">
                        {{ empresaSeleccionada()?.estado }}
                      </span>
                    </div>
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Paso 2: Expedientes de la Empresa -->
          @if (empresaSeleccionada()) {
            <mat-card class="form-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>folder</mat-icon>
                  Paso 2: Expedientes Disponibles
                </mat-card-title>
                <mat-card-subtitle>
                  Selecciona un expediente existente o crea uno nuevo
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (isLoadingExpedientes()) {
                  <div class="loading-state">
                    <mat-spinner diameter="30"></mat-spinner>
                    <p>Cargando expedientes...</p>
                  </div>
                } @else {
                  @if (expedientes().length > 0) {
                    <div class="expedientes-list">
                      <h4>Expedientes Existentes:</h4>
                      <div class="expedientes-grid">
                        @for (expediente of expedientes(); track expediente.id) {
                          <div class="expediente-card" 
                               [class.selected]="expedienteSeleccionado()?.id === expediente.id"
                               (click)="seleccionarExpediente(expediente)">
                            <div class="expediente-header">
                              <span class="numero">{{ expediente.nroExpediente }}</span>
                              <span class="tipo-chip" [class]="expediente.tipoTramite.toLowerCase()">
                                {{ expediente.tipoTramite }}
                              </span>
                            </div>
                            <div class="expediente-asunto">{{ expediente.descripcion || 'Sin descripción' }}</div>
                            <div class="expediente-fecha">
                              {{ expediente.fechaEmision | date:'dd/MM/yyyy' }}
                            </div>
                            <div class="expediente-prioridad">
                              <span class="prioridad-chip" [class]="expediente.prioridad?.toLowerCase()">
                                {{ expediente.prioridad || 'NORMAL' }}
                              </span>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="no-expedientes">
                      <mat-icon class="warning-icon">warning</mat-icon>
                      <h4>No hay expedientes disponibles</h4>
                      <p>Esta empresa no tiene expedientes registrados</p>
                    </div>
                  }

                  <div class="expediente-actions">
                    <button mat-stroked-button 
                            type="button"
                            (click)="crearNuevoExpediente()"
                            class="crear-expediente-button">
                      <mat-icon>add</mat-icon>
                      {{ expedientes().length > 0 ? 'Crear Nuevo Expediente' : 'Crear Primer Expediente' }}
                    </button>
                  </div>

                  @if (expedienteSeleccionado()) {
                    <div class="expediente-seleccionado">
                      <mat-icon class="check-icon">check_circle</mat-icon>
                      <div class="expediente-info">
                        <h4>Expediente Seleccionado:</h4>
                        <p><strong>{{ expedienteSeleccionado()?.nroExpediente }}</strong> - {{ expedienteSeleccionado()?.descripcion || 'Sin descripción' }}</p>
                      </div>
                    </div>
                  }
                }
              </mat-card-content>
            </mat-card>
          }

          <!-- Paso 3: Información de la Resolución -->
          @if (empresaSeleccionada() && expedienteSeleccionado()) {
            <mat-card class="form-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>description</mat-icon>
                  Paso 3: Información de la Resolución
                </mat-card-title>
                <mat-card-subtitle>
                  Completa los datos de la nueva resolución
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="form-row">
                                  <app-resolucion-number-validator
                  label="Número de Resolución *"
                  placeholder="Ej: 0001"
                  hint="El sistema generará R-0001-2025"
                  [required]="true"
                  [empresaId]="resolucionForm.get('empresaId')?.value"
                  (numeroValido)="onNumeroResolucionValido($event)"
                  (numeroInvalido)="onNumeroResolucionInvalido($event)"
                  (validacionCompleta)="onValidacionCompleta($event)">
                </app-resolucion-number-validator>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Tipo de Resolución *</mat-label>
                    <mat-select formControlName="tipoResolucion" required>
                      <mat-option value="PRIMIGENIA">Primigenia</mat-option>
                      <mat-option value="HIJA">Hija</mat-option>
                    </mat-select>
                    <mat-icon matSuffix>category</mat-icon>
                    <mat-hint>Tipo de resolución</mat-hint>
                    <mat-error *ngIf="resolucionForm.get('tipoResolucion')?.hasError('required')">
                      El tipo de resolución es obligatorio
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Tipo de Trámite *</mat-label>
                    <mat-select formControlName="tipoTramite" required>
                      <mat-option value="AUTORIZACION_NUEVA">Autorización Nueva</mat-option>
                      <mat-option value="RENOVACION">Renovación</mat-option>
                      <mat-option value="INCREMENTO">Incremento</mat-option>
                      <mat-option value="MODIFICACION">Modificación</mat-option>
                    </mat-select>
                    <mat-icon matSuffix>assignment</mat-icon>
                    <mat-hint>Tipo de trámite</mat-hint>
                    <mat-error *ngIf="resolucionForm.get('tipoTramite')?.hasError('required')">
                      El tipo de trámite es obligatorio
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Fecha de Emisión *</mat-label>
                    <input matInput 
                           [matDatepicker]="fechaEmisionPicker" 
                           formControlName="fechaEmision"
                           required>
                    <mat-datepicker-toggle matSuffix [for]="fechaEmisionPicker"></mat-datepicker-toggle>
                    <mat-datepicker #fechaEmisionPicker></mat-datepicker>
                    <mat-icon matSuffix>event</mat-icon>
                    <mat-hint>Fecha de emisión de la resolución</mat-hint>
                    <mat-error *ngIf="resolucionForm.get('fechaEmision')?.hasError('required')">
                      La fecha de emisión es obligatoria
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Descripción *</mat-label>
                    <textarea matInput 
                              formControlName="descripcion" 
                              placeholder="Descripción de lo que resuelve la resolución"
                              rows="4"
                              (input)="convertirAMayusculas($event, 'descripcion')"
                              required></textarea>
                    <mat-icon matSuffix>description</mat-icon>
                    <mat-hint>Descripción de la resolución</mat-hint>
                    <mat-error *ngIf="resolucionForm.get('descripcion')?.hasError('required')">
                      La descripción es obligatoria
                    </mat-error>
                  </mat-form-field>
                </div>

                @if (resolucionForm.get('tipoResolucion')?.value === 'PRIMIGENIA') {
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Fecha Inicio Vigencia</mat-label>
                      <input matInput 
                             [matDatepicker]="fechaInicioVigenciaPicker" 
                             formControlName="fechaVigenciaInicio">
                      <mat-datepicker-toggle matSuffix [for]="fechaInicioVigenciaPicker"></mat-datepicker-toggle>
                      <mat-datepicker #fechaInicioVigenciaPicker></mat-datepicker>
                      <mat-icon matSuffix>event</mat-icon>
                      <mat-hint>Fecha de inicio de vigencia (opcional)</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Fecha Fin Vigencia</mat-label>
                      <input matInput 
                             [matDatepicker]="fechaFinVigenciaPicker" 
                             formControlName="fechaVigenciaFin">
                      <mat-datepicker-toggle matSuffix [for]="fechaFinVigenciaPicker"></mat-datepicker-toggle>
                      <mat-datepicker #fechaFinVigenciaPicker></mat-datepicker>
                      <mat-icon matSuffix>event</mat-icon>
                      <mat-hint>Fecha de fin de vigencia (opcional)</mat-hint>
                    </mat-form-field>
                  </div>
                }

                @if (resolucionForm.get('tipoResolucion')?.value === 'HIJO') {
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Resolución Padre *</mat-label>
                      <mat-select formControlName="resolucionPadreId" required>
                        <mat-option value="">Selecciona una resolución padre</mat-option>
                        @for (resolucion of resolucionesPadre(); track resolucion.id) {
                          <mat-option [value]="resolucion.id">
                            {{ resolucion.nroResolucion }} - {{ resolucion.tipoTramite }} - {{ resolucion.descripcion }}
                          </mat-option>
                        }
                      </mat-select>
                      <mat-icon matSuffix>account_tree</mat-icon>
                      @if (resolucionesPadre().length === 1 && resolucionForm.get('resolucionPadreId')?.value) {
                        <mat-hint>Resolución primigenia asignada automáticamente</mat-hint>
                      } @else {
                        <mat-hint>Resolución padre de la que deriva</mat-hint>
                      }
                      <mat-error *ngIf="resolucionForm.get('resolucionPadreId')?.hasError('required')">
                        La resolución padre es obligatoria
                      </mat-error>
                    </mat-form-field>
                  </div>
                  
                  @if (resolucionesPadre().length === 0) {
                    <div class="warning-message">
                      <mat-icon class="warning-icon">warning</mat-icon>
                      <div class="warning-content">
                        <h4>No hay resoluciones padre disponibles</h4>
                        <p>Para crear una resolución de tipo {{ resolucionForm.get('tipoTramite')?.value }}, 
                           primero debes crear una resolución PRIMIGENIA para esta empresa.</p>
                      </div>
                    </div>
                  }
                }
              </mat-card-content>
            </mat-card>
          }
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
                [disabled]="!puedeCrearResolucion() || isSubmitting()"
                class="primary-button">
          @if (isSubmitting()) {
            <mat-spinner diameter="20"></mat-spinner>
          }
          @if (!isSubmitting()) {
            <mat-icon>save</mat-icon>
          }
          {{ isSubmitting() ? 'Creando...' : 'Crear Resolución' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .modal-container {
      max-width: 1000px;
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
      max-height: 80vh;
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

    .empresa-info {
      margin-top: 16px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
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

    .status-chip {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-chip.habilitada, .status-chip.activa {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px;
      text-align: center;
    }

    .expedientes-list h4 {
      margin: 0 0 16px 0;
      color: #333;
      font-weight: 600;
    }

    .expedientes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .expediente-card {
      padding: 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .expediente-card:hover {
      border-color: #1976d2;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .expediente-card.selected {
      border-color: #4caf50;
      background-color: #e8f5e8;
    }

    .expediente-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .numero {
      font-weight: 600;
      color: #1976d2;
    }

    .tipo-chip {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .tipo-chip.autorizacion {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .tipo-chip.renovacion {
      background-color: #fff3e0;
      color: #ff9800;
    }

    .tipo-chip.incremento {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .expediente-asunto {
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .expediente-fecha {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }

    .prioridad-chip {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .prioridad-chip.baja {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .prioridad-chip.media {
      background-color: #fff3e0;
      color: #ff9800;
    }

    .prioridad-chip.alta {
      background-color: #ffebee;
      color: #c62828;
    }

    .prioridad-chip.urgente {
      background-color: #fce4ec;
      color: #ad1457;
    }

    .no-expedientes {
      text-align: center;
      padding: 32px;
      color: #666;
    }

    .warning-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ff9800;
      margin-bottom: 16px;
    }

    .expediente-actions {
      text-align: center;
      margin: 24px 0;
    }

    .crear-expediente-button {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 auto;
    }

    .expediente-seleccionado {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background-color: #e8f5e8;
      border-radius: 8px;
      border: 1px solid #4caf50;
      margin-top: 16px;
    }

    .check-icon {
      color: #4caf50;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .expediente-info h4 {
      margin: 0 0 8px 0;
      color: #2e7d32;
      font-weight: 600;
    }

    .expediente-info p {
      margin: 0;
      color: #333;
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

    .warning-message {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background-color: #fff3e0;
      border-radius: 8px;
      border-left: 4px solid #ff9800;
      margin-top: 16px;
    }

    .warning-message .warning-icon {
      color: #ff9800;
      font-size: 24px;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .warning-content h4 {
      margin: 0 0 8px 0;
      color: #e65100;
      font-weight: 600;
      font-size: 14px;
    }

    .warning-content p {
      margin: 0;
      color: #666;
      font-size: 13px;
      line-height: 1.5;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrearResolucionModalComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CrearResolucionModalComponent>);
  private data = inject(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);

  private resolucionService = inject(ResolucionService);
  private empresaService = inject(EmpresaService);
  private expedienteService = inject(ExpedienteService);
  private validationService = inject(ResolucionValidationService);

  isSubmitting = signal(false);
  isLoadingExpedientes = signal(false);

  resolucionForm: FormGroup;

  empresaSeleccionada = signal<Empresa | null>(null);
  expedienteSeleccionado = signal<Expediente | null>(null);
  expedientes = signal<Expediente[]>([]);
  resolucionesPadre = signal<Resolucion[]>([]);

  constructor() {
    this.resolucionForm = this.fb.group({
      empresaId: ['', Validators.required],
      numero: ['', [Validators.required, Validators.minLength(1)]],
      tipoResolucion: ['PRIMIGENIA', Validators.required],
      tipoTramite: ['AUTORIZACION_NUEVA', Validators.required],
      fechaEmision: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      fechaVigenciaInicio: [''],
      fechaVigenciaFin: [''],
      resolucionPadreId: [''],
      observaciones: ['']
    });

    // Observar cambios en el tipo de resolución
    this.resolucionForm.get('tipoResolucion')?.valueChanges.subscribe(tipo => {
      if (tipo === 'HIJA') {
        this.resolucionForm.get('resolucionPadreId')?.setValidators(Validators.required);
        this.cargarResolucionesPadre();
      } else {
        this.resolucionForm.get('resolucionPadreId')?.clearValidators();
        this.resolucionForm.get('resolucionPadreId')?.setValue('');
      }
      this.resolucionForm.get('resolucionPadreId')?.updateValueAndValidity();
    });

  }

  /**
   * Cuando se selecciona una empresa desde el EmpresaSelectorComponent
   */
  onEmpresaSeleccionadaBuscador(empresa: Empresa | null): void {
    this.empresaSeleccionada.set(empresa);
    this.expedienteSeleccionado.set(null);

    if (empresa) {
      this.resolucionForm.patchValue({ empresaId: empresa.id });
      this.cargarExpedientes(empresa.id);
    } else {
      this.resolucionForm.patchValue({ empresaId: '' });
      this.expedientes.set([]);
    }
  }

  /**
   * Carga los expedientes de la empresa
   */
  private cargarExpedientes(empresaId: string): void {
    this.isLoadingExpedientes.set(true);

    // TODO: Implementar carga real de expedientes
    setTimeout(() => {
      this.expedientes.set([]);
      this.isLoadingExpedientes.set(false);
    }, 1000);
  }

  /**
   * Carga las resoluciones padre disponibles
   */
  private cargarResolucionesPadre(): void {
    if (!this.empresaSeleccionada()) return;

    // TODO: Implementar carga real de resoluciones padre
    this.resolucionesPadre.set([]);
  }

  /**
   * Maneja cuando el número de resolución es válido
   */
  onNumeroResolucionValido(data: { numero: string; año: number; nroCompleto: string }): void {
    this.resolucionForm.get('numero')?.setValue(data.numero);

    // Mostrar confirmación
    this.snackBar.open(`Número de resolución válido: ${data.nroCompleto}`, 'Cerrar', {
      duration: 2000
    });
  }

  /**
   * Maneja cuando el número de resolución es inválido
   */
  onNumeroResolucionInvalido(mensaje: string): void {
    this.resolucionForm.get('numero')?.setErrors({ duplicado: true });

    // Mostrar error
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Maneja cuando la validación está completa
   */
  onValidacionCompleta(resultado: any): void {
    // La validación se completó, el formulario se actualiza automáticamente
    console.log('Validación completada:', resultado);
  }

  /**
   * Selecciona un expediente y configura automáticamente la resolución padre si aplica
   */
  seleccionarExpediente(expediente: Expediente): void {
    this.expedienteSeleccionado.set(expediente);

    // Actualizar el tipo de trámite basado en el expediente
    const tipoTramite = expediente.tipoTramite;
    this.resolucionForm.patchValue({
      tipoTramite: tipoTramite
    });

    // Determinar si es PADRE o HIJO basado en el tipo de trámite
    const esPadre = tipoTramite === 'AUTORIZACION_NUEVA' || tipoTramite === 'RENOVACION';
    const tipoResolucion = esPadre ? 'PADRE' : 'HIJO';

    this.resolucionForm.patchValue({
      tipoResolucion: tipoResolucion
    });

    // Si es HIJO, buscar la resolución PRIMIGENIA del expediente
    if (!esPadre) {
      this.buscarYAsignarResolucionPrimigenia(expediente);
    }
  }

  /**
   * Busca la resolución PRIMIGENIA asociada al expediente y la asigna como padre
   */
  private buscarYAsignarResolucionPrimigenia(expediente: Expediente): void {
    // Verificar si el expediente ya tiene una resolución primigenia asociada
    if (expediente.resolucionPrimigeniaId) {
      // El expediente ya tiene una resolución primigenia definida, obtenerla
      this.resolucionService.getResolucionById(expediente.resolucionPrimigeniaId).subscribe({
        next: (resolucionPrimigenia) => {
          // Asignar automáticamente como resolución padre
          this.resolucionForm.patchValue({
            resolucionPadreId: resolucionPrimigenia.id
          });

          // Actualizar lista de resoluciones padre con solo esta
          this.resolucionesPadre.set([resolucionPrimigenia]);

          this.snackBar.open(
            `Resolución primigenia ${resolucionPrimigenia.nroResolucion} asignada automáticamente como padre`,
            'Cerrar',
            { duration: 4000 }
          );
        },
        error: (error) => {
          console.error('Error al obtener resolución primigenia:', error);
          // Si falla, cargar todas las resoluciones PADRE disponibles
          this.cargarResolucionesPadreDisponibles();
        }
      });
    } else {
      // No hay resolución primigenia en el expediente, cargar todas las disponibles
      this.cargarResolucionesPadreDisponibles();
    }
  }

  /**
   * Carga todas las resoluciones PADRE disponibles de la empresa
   */
  private cargarResolucionesPadreDisponibles(): void {
    if (!this.empresaSeleccionada()) return;

    this.resolucionService.getResolucionesPorEmpresa(this.empresaSeleccionada()!.id).subscribe({
      next: (resoluciones) => {
        // Filtrar solo resoluciones PADRE activas
        const resolucionesPadreDisponibles = resoluciones.filter(r =>
          r.tipoResolucion === 'PADRE' && r.estaActivo
        );

        this.resolucionesPadre.set(resolucionesPadreDisponibles);

        if (resolucionesPadreDisponibles.length === 0) {
          this.snackBar.open(
            'No hay resoluciones padre disponibles. Debes crear primero una resolución PRIMIGENIA.',
            'Cerrar',
            { duration: 5000, panelClass: ['warning-snackbar'] }
          );
        } else {
          this.snackBar.open(
            'Selecciona una resolución padre de la lista',
            'Cerrar',
            { duration: 3000 }
          );
        }
      },
      error: (error) => {
        console.error('Error al buscar resoluciones:', error);
        this.snackBar.open(
          'Error al buscar resoluciones padre',
          'Cerrar',
          { duration: 3000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  /**
   * Abre el modal para crear un nuevo expediente
   */
  crearNuevoExpediente(): void {
    const dialogRef = this.dialog.open(CrearExpedienteModalComponent, {
      width: '800px',
      data: {
        empresaId: this.empresaSeleccionada()?.id
      }
    });

    dialogRef.afterClosed().subscribe((expedienteCreado: Expediente) => {
      if (expedienteCreado) {
        this.expedientes.update(current => [...current, expedienteCreado]);
        this.expedienteSeleccionado.set(expedienteCreado);
        this.snackBar.open('Expediente creado y seleccionado', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  /**
   * Convierte el texto a mayúsculas
   */
  convertirAMayusculas(event: any, controlName: string): void {
    const control = this.resolucionForm.get(controlName);
    if (control) {
      const value = event.target.value.toUpperCase();
      control.setValue(value, { emitEvent: false });
    }
  }

  /**
   * Obtiene el número completo de la resolución reactivamente
   */
  getNumeroResolucionCompleto(): string {
    const numero = this.resolucionForm.get('numero')?.value || '';
    const fechaEmision = this.resolucionForm.get('fechaEmision')?.value;

    if (!numero || !fechaEmision) {
      return 'R-XXXX-YYYY';
    }

    const año = fechaEmision instanceof Date ? fechaEmision.getFullYear() : new Date(fechaEmision).getFullYear();
    const numeroFormateado = numero.padStart(4, '0');

    return `R-${numeroFormateado}-${año}`;
  }

  /**
   * Verifica si se puede crear la resolución
   */
  puedeCrearResolucion(): boolean {
    // Debe haber empresa seleccionada
    if (!this.empresaSeleccionada()) return false;

    // Debe haber expediente seleccionado
    if (!this.expedienteSeleccionado()) return false;

    // El formulario debe ser válido
    if (!this.resolucionForm.valid) return false;

    // Si es resolución HIJO, debe tener resolución padre
    const tipoResolucion = this.resolucionForm.get('tipoResolucion')?.value;
    if (tipoResolucion === 'HIJO') {
      const resolucionPadreId = this.resolucionForm.get('resolucionPadreId')?.value;
      if (!resolucionPadreId) return false;
    }

    return true;
  }

  /**
   * Envía el formulario
   */
  onSubmit(): void {
    if (!this.puedeCrearResolucion()) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.resolucionForm.value;
    const resolucionData: ResolucionCreate = {
      numero: formValue.numero,
      expedienteId: this.expedienteSeleccionado()!.id,
      empresaId: formValue.empresaId,
      fechaEmision: formValue.fechaEmision,
      fechaVigenciaInicio: formValue.fechaVigenciaInicio || undefined,
      fechaVigenciaFin: formValue.fechaVigenciaFin || undefined,
      tipoResolucion: formValue.tipoResolucion,
      tipoTramite: formValue.tipoTramite,
      descripcion: formValue.descripcion,
      observaciones: formValue.observaciones || undefined,
      resolucionPadreId: formValue.resolucionPadreId || undefined,
      vehiculosHabilitadosIds: [],
      rutasAutorizadasIds: []
    };

    this.resolucionService.createResolucion(resolucionData).subscribe({
      next: (resolucionCreada) => {
        this.isSubmitting.set(false);
        this.snackBar.open(
          `Resolución ${resolucionCreada.nroResolucion} creada exitosamente`,
          'Cerrar',
          { duration: 4000 }
        );
        this.dialogRef.close(resolucionCreada);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        console.error('Error al crear resolución:', error);
        this.snackBar.open(
          error.message || 'Error al crear la resolución',
          'Cerrar',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  /**
   * Cierra el modal
   */
  cerrar(): void {
    this.dialogRef.close();
  }
} 