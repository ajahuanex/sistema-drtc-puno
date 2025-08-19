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
    MatAutocompleteModule
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
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Empresa *</mat-label>
                  <input matInput 
                         [matAutocomplete]="empresaAuto" 
                         [formControl]="empresaControl"
                         placeholder="Buscar empresa por RUC o razón social"
                         required>
                  <mat-autocomplete #empresaAuto="matAutocomplete" 
                                   [displayWith]="displayEmpresa"
                                   (optionSelected)="onEmpresaSelected($event)">
                    @for (empresa of empresasFiltradas; track empresa.id) {
                      <mat-option [value]="empresa">
                        {{ empresa.ruc }} - {{ empresa.razonSocial.principal || 'Sin razón social' }}
                      </mat-option>
                    }
                  </mat-autocomplete>
                  <mat-icon matSuffix>business</mat-icon>
                  <mat-hint>Empresa propietaria de la resolución</mat-hint>
                  <mat-error *ngIf="empresaControl.hasError('required')">
                    La empresa es obligatoria
                  </mat-error>
                </mat-form-field>
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
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Número de Resolución *</mat-label>
                    <input matInput 
                           formControlName="numero" 
                           placeholder="Ej: 0001"
                           (input)="convertirAMayusculas($event, 'numero')"
                           required>
                    <mat-icon matSuffix>receipt</mat-icon>
                    <mat-hint>Número único de la resolución (el sistema generará {{ getNumeroResolucionCompleto() }})</mat-hint>
                    <mat-error *ngIf="resolucionForm.get('numero')?.hasError('required')">
                      El número de resolución es obligatorio
                    </mat-error>
                  </mat-form-field>

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

                @if (resolucionForm.get('tipoResolucion')?.value === 'HIJA') {
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Resolución Padre *</mat-label>
                      <mat-select formControlName="resolucionPadreId" required>
                        <mat-option value="">Selecciona una resolución padre</mat-option>
                        @for (resolucion of resolucionesPadre(); track resolucion.id) {
                          <mat-option [value]="resolucion.id">
                            {{ resolucion.nroResolucion }} - {{ resolucion.descripcion }}
                          </mat-option>
                        }
                      </mat-select>
                      <mat-icon matSuffix>account_tree</mat-icon>
                      <mat-hint>Resolución padre de la que deriva</mat-hint>
                      <mat-error *ngIf="resolucionForm.get('resolucionPadreId')?.hasError('required')">
                        La resolución padre es obligatoria
                      </mat-error>
                    </mat-form-field>
                  </div>
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

  isSubmitting = signal(false);
  isLoadingExpedientes = signal(false);
  
  resolucionForm: FormGroup;
  empresaControl = this.fb.control('', Validators.required);
  
  empresaSeleccionada = signal<Empresa | null>(null);
  expedienteSeleccionado = signal<Expediente | null>(null);
  expedientes = signal<Expediente[]>([]);
  resolucionesPadre = signal<Resolucion[]>([]);
  empresasFiltradas: Empresa[] = [];

  constructor() {
    this.resolucionForm = this.fb.group({
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

    // Cargar empresas disponibles
    this.cargarEmpresas();
  }

  /**
   * Carga las empresas disponibles
   */
  private cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe(empresas => {
      this.empresasFiltradas = empresas;
    });
  }

  /**
   * Muestra la empresa en el autocomplete
   */
  displayEmpresa(empresa: Empresa): string {
    return empresa ? `${empresa.ruc} - ${empresa.razonSocial?.principal || 'Sin razón social'}` : '';
  }

  /**
   * Cuando se selecciona una empresa
   */
  onEmpresaSelected(event: any): void {
    const empresa = event.option.value;
    this.empresaSeleccionada.set(empresa);
    this.expedienteSeleccionado.set(null);
    this.cargarExpedientes(empresa.id);
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
   * Selecciona un expediente
   */
  seleccionarExpediente(expediente: Expediente): void {
    this.expedienteSeleccionado.set(expediente);
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
    return this.empresaSeleccionada() !== null && 
           this.expedienteSeleccionado() !== null && 
           this.resolucionForm.valid;
  }

  /**
   * Envía el formulario
   */
  onSubmit(): void {
    if (this.puedeCrearResolucion()) {
      this.isSubmitting.set(true);
      
      const resolucionData: ResolucionCreate = {
        numero: this.resolucionForm.value.numero,
        expedienteId: this.expedienteSeleccionado()!.id,
        fechaEmision: this.resolucionForm.value.fechaEmision,
        fechaVigenciaInicio: this.resolucionForm.value.fechaVigenciaInicio,
        fechaVigenciaFin: this.resolucionForm.value.fechaVigenciaFin,
        tipoResolucion: this.resolucionForm.value.tipoResolucion,
        tipoTramite: this.resolucionForm.value.tipoTramite,
        empresaId: this.empresaSeleccionada()!.id,
        descripcion: this.resolucionForm.value.descripcion,
        observaciones: this.resolucionForm.value.observaciones,
        resolucionPadreId: this.resolucionForm.value.resolucionPadreId,
        vehiculosHabilitadosIds: [],
        rutasAutorizadasIds: []
      };

      // TODO: Implementar creación real de la resolución
      setTimeout(() => {
        this.isSubmitting.set(false);
        this.snackBar.open('Resolución creada exitosamente', 'Cerrar', {
          duration: 3000
        });
        
        // Generar el número completo de la resolución usando la lógica correcta
        const año = resolucionData.fechaEmision.getFullYear();
        const numeroFormateado = resolucionData.numero.padStart(4, '0');
        const nroResolucion = `R-${numeroFormateado}-${año}`;

        // Retornar la resolución creada
        const resolucionCreada: Resolucion = {
          id: Date.now().toString(),
          nroResolucion: nroResolucion,
          empresaId: resolucionData.empresaId,
          fechaEmision: resolucionData.fechaEmision,
          fechaVigenciaInicio: resolucionData.fechaVigenciaInicio,
          fechaVigenciaFin: resolucionData.fechaVigenciaFin,
          tipoResolucion: resolucionData.tipoResolucion,
          resolucionPadreId: resolucionData.resolucionPadreId,
          resolucionesHijasIds: [],
          vehiculosHabilitadosIds: resolucionData.vehiculosHabilitadosIds || [],
          rutasAutorizadasIds: resolucionData.rutasAutorizadasIds || [],
          tipoTramite: resolucionData.tipoTramite,
          descripcion: resolucionData.descripcion,
          expedienteId: resolucionData.expedienteId,
          fechaRegistro: new Date(),
          estaActivo: true
        };
        
        this.dialogRef.close(resolucionCreada);
      }, 1000);
    }
  }

  /**
   * Cierra el modal
   */
  cerrar(): void {
    this.dialogRef.close();
  }
} 