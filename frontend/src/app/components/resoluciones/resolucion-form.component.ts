import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ResolucionService } from '../../services/resolucion.service';
import { ExpedienteService } from '../../services/expediente.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionCreate } from '../../models/resolucion.model';
import { Expediente } from '../../models/expediente.model';
import { Empresa, EstadoEmpresa } from '../../models/empresa.model';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-resolucion-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatDialogModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>{{ isEditing() ? 'Editar Resolución' : 'Nueva Resolución' }}</h1>
          <p class="header-subtitle">Gestión de resoluciones administrativas</p>
        </div>
        <div class="header-actions">
          <button mat-button color="accent" (click)="volver()" class="action-button">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
        </div>
      </div>
    </div>

    <div class="content-section">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="60"></mat-spinner>
          <h3>Cargando...</h3>
        </div>
      } @else {
        <mat-card class="form-card">
          <form [formGroup]="resolucionForm" (ngSubmit)="onSubmit()" class="resolucion-form">
            <div class="form-grid">
              <!-- PASO 1: Búsqueda de Número de Resolución (Único) -->
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Número de Resolución</mat-label>
                  <input 
                    matInput 
                    formControlName="numero" 
                    [placeholder]="numeroCompleto()" 
                    maxlength="4"
                    required
                    (input)="onNumeroInput($event)"
                    (blur)="onNumeroResolucionBlur()">
                  <mat-hint>
                    {{ numeroCompleto() }}
                  </mat-hint>
                  @if (resolucionForm.get('numero')?.hasError('required') && resolucionForm.get('numero')?.touched) {
                    <mat-error>El número de resolución es requerido</mat-error>
                  }
                  @if (resolucionForm.get('numero')?.hasError('pattern') && resolucionForm.get('numero')?.touched) {
                    <mat-error>Debe ingresar exactamente 4 dígitos numéricos</mat-error>
                  }
                  @if (resolucionForm.get('numero')?.hasError('duplicado') && resolucionForm.get('numero')?.touched) {
                    <mat-error>
                      El número de resolución ya existe en este año
                      <br>
                      <button mat-button 
                              type="button" 
                              color="primary" 
                              class="suggestion-btn"
                              (click)="usarSiguienteNumero()">
                        Usar siguiente número disponible
                      </button>
                    </mat-error>
                  }
                  @if (resolucionForm.get('numero')?.hasError('numeroDuplicado') && resolucionForm.get('numero')?.touched) {
                    <mat-error>{{ resolucionForm.get('numero')?.getError('mensaje') || 'El número de resolución ya existe' }}</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Información de la resolución existente (si se encuentra) -->
              @if (resolucionExistente()) {
                <div class="resolucion-existente-warning">
                  <mat-icon>warning</mat-icon>
                  <span>Ya existe una resolución con el número {{ numeroCompleto() }}. No se puede crear una nueva.</span>
                </div>
              }

              <!-- PASO 2: Fecha de Emisión de la Resolución (solo si el número no existe) -->
              @if (!resolucionExistente() && numeroValido()) {
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Fecha de Emisión de la Resolución</mat-label>
                    <input matInput [matDatepicker]="pickerResolucion" formControlName="fechaEmision" required (dateChange)="onFechaEmisionChange($event)">
                    <mat-datepicker-toggle matIconSuffix [for]="pickerResolucion"></mat-datepicker-toggle>
                    <mat-datepicker #pickerResolucion></mat-datepicker>
                    @if (resolucionForm.get('fechaEmision')?.hasError('required') && resolucionForm.get('fechaEmision')?.touched) {
                      <mat-error>La fecha de emisión es requerida</mat-error>
                    }
                  </mat-form-field>
                </div>

                <!-- PASO 3: Crear Expediente -->
                <div class="form-row expediente-row">
                  <div class="expediente-section">
                    <h4 class="section-title">
                      <mat-icon>description</mat-icon>
                      Expediente
                    </h4>
                    <p class="section-description">
                      Haga clic en el botón para crear un nuevo expediente
                    </p>
                    
                    <!-- Botón para crear nuevo expediente -->
                    <div class="expediente-actions">
                      <button mat-icon-button 
                              type="button"
                              color="accent" 
                              class="create-expediente-btn"
                              (click)="openCrearExpedienteModal()"
                              matTooltip="Crear nuevo expediente">
                        <mat-icon>add_circle</mat-icon>
                      </button>
                      <span class="action-label">Crear Expediente</span>
                    </div>
                  </div>
                </div>

                <!-- Información del expediente encontrado -->
                @if (expediente()) {
                  <div class="expediente-info">
                    <mat-chip-set>
                      <mat-chip color="primary" selected>
                        <mat-icon>description</mat-icon>
                        Expediente: {{ expediente()?.nroExpediente }}
                      </mat-chip>
                      <mat-chip color="accent" selected>
                        <mat-icon>category</mat-icon>
                        Tipo: {{ expediente()?.tipoTramite }}
                      </mat-chip>
                      <mat-chip color="warn" selected>
                        <mat-icon>date_range</mat-icon>
                        Fecha: {{ expediente()?.fechaEmision | date:'dd/MM/yyyy' }}
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                }


              }

            </div>

            <!-- Fechas de Vigencia (condicionales) -->
            @if (mostrarFechasVigencia()) {
              <div class="form-grid">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Fecha de Vigencia Inicio</mat-label>
                  <input matInput [matDatepicker]="pickerVigenciaInicio" formControlName="fechaVigenciaInicio" required>
                  <mat-datepicker-toggle matIconSuffix [for]="pickerVigenciaInicio"></mat-datepicker-toggle>
                  <mat-datepicker #pickerVigenciaInicio></mat-datepicker>
                  @if (resolucionForm.get('fechaVigenciaInicio')?.hasError('required') && resolucionForm.get('fechaVigenciaInicio')?.touched) {
                    <mat-error>La fecha de vigencia inicio es requerida</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Años de Vigencia</mat-label>
                  <input matInput 
                         type="number" 
                         formControlName="añosVigencia" 
                         min="1" 
                         max="50" 
                         required>
                  <mat-hint>Por defecto 10 años</mat-hint>
                  @if (resolucionForm.get('añosVigencia')?.hasError('required') && resolucionForm.get('añosVigencia')?.touched) {
                    <mat-error>Los años de vigencia son requeridos</mat-error>
                  }
                  @if (resolucionForm.get('añosVigencia')?.hasError('min') && resolucionForm.get('añosVigencia')?.touched) {
                    <mat-error>Mínimo 1 año</mat-error>
                  }
                  @if (resolucionForm.get('añosVigencia')?.hasError('max') && resolucionForm.get('añosVigencia')?.touched) {
                    <mat-error>Máximo 50 años</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Fecha de Vigencia Fin (Calculada)</mat-label>
                  <input matInput [matDatepicker]="pickerVigenciaFin" formControlName="fechaVigenciaFin" readonly>
                  <mat-datepicker-toggle matIconSuffix [for]="pickerVigenciaFin"></mat-datepicker-toggle>
                  <mat-datepicker #pickerVigenciaFin></mat-datepicker>
                  <mat-hint>Se calcula automáticamente: Inicio + Años de Vigencia</mat-hint>
                </mat-form-field>
              </div>
            }

            <!-- Descripción -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Descripción</mat-label>
              <textarea matInput formControlName="descripcion" placeholder="Descripción de la resolución..." rows="3" required></textarea>
              @if (resolucionForm.get('descripcion')?.hasError('required') && resolucionForm.get('descripcion')?.touched) {
                <mat-error>La descripción es requerida</mat-error>
              }
            </mat-form-field>

            <!-- Observaciones -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Observaciones</mat-label>
              <textarea matInput formControlName="observaciones" placeholder="Observaciones adicionales..." rows="3"></textarea>
            </mat-form-field>

            <!-- Botones de acción -->
            <div class="form-actions">
              <button mat-button type="button" (click)="volver()" class="cancel-button">
                <mat-icon>cancel</mat-icon>
                Cancelar
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="resolucionForm.invalid || isSubmitting()" class="submit-button">
                @if (isSubmitting()) {
                  <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
                  <span>{{ isEditing() ? 'Actualizando...' : 'Creando...' }}</span>
                } @else {
                  <ng-container>
                    <mat-icon>{{ isEditing() ? 'save' : 'add' }}</mat-icon>
                    <span>{{ isEditing() ? 'Actualizar Resolución' : 'Crear Resolución' }}</span>
                  </ng-container>
                }
              </button>
            </div>
          </form>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .form-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .full-width {
      flex: 1;
    }

    .create-expediente-btn {
      flex-shrink: 0;
      margin-top: 8px;
      background: #ff4081;
      color: white;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(255, 64, 129, 0.3);
      border: 2px solid #ff4081;
    }

    .create-expediente-btn:hover {
      background: #e91e63;
      border-color: #e91e63;
      transform: scale(1.1);
      box-shadow: 0 4px 16px rgba(255, 64, 129, 0.4);
    }

    .create-expediente-btn mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .expediente-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .expediente-section {
      width: 100%;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 2px dashed #dee2e6;
      text-align: center;
      transition: all 0.3s ease;
    }

    .expediente-section:hover {
      border-color: #ff4081;
      background: #fff5f7;
    }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 0 0 12px 0;
      color: #495057;
      font-size: 18px;
      font-weight: 500;
    }

    .section-description {
      margin: 0 0 20px 0;
      color: #6c757d;
      font-size: 14px;
      line-height: 1.4;
    }

    .expediente-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .action-label {
      font-size: 12px;
      color: #666;
      text-align: center;
      font-weight: 500;
    }

    .expediente-info {
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #007bff;
    }

    .expediente-info mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .expediente-info mat-chip {
      margin: 4px;
    }

    .empresa-info {
      margin-bottom: 20px;
      padding: 16px;
      background: #e8f5e8;
      border-radius: 8px;
      border-left: 4px solid #28a745;
    }

    .empresa-info mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .empresa-info mat-chip {
      margin: 4px;
    }

    .resoluciones-empresa {
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #17a2b8;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      color: #495057;
      font-size: 16px;
      font-weight: 500;
    }

    .resoluciones-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .resolucion-item {
      padding: 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #dee2e6;
      transition: all 0.2s ease;
    }

    .resolucion-item:hover {
      border-color: #007bff;
      box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
    }

    .resolucion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .resolucion-numero {
      font-weight: 600;
      color: #2c3e50;
      font-size: 14px;
    }

    .resolucion-estado {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .estado-vigente {
      background: #d4edda;
      color: #155724;
    }

    .estado-vencida {
      background: #f8d7da;
      color: #721c24;
    }

    .estado-suspendida {
      background: #fff3cd;
      color: #856404;
    }

    .resolucion-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #6c757d;
    }

    .no-resoluciones {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      color: #6c757d;
      font-style: italic;
      text-align: center;
      justify-content: center;
    }

    .empresa-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .empresa-nombre {
      font-weight: 500;
      color: #2c3e50;
    }

    .empresa-ruc {
      font-size: 12px;
      color: #6c757d;
    }

    .resolucion-existente-warning {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding: 16px;
      background: #fff3cd;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
      color: #856404;
    }

    .resolucion-existente-warning mat-icon {
      color: #ffc107;
    }

    .header-content {
      flex: 1;
    }

    .header-title {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .header-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
    }

    .header-subtitle {
      margin: 0;
      color: #6c757d;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.2s ease-in-out;
    }

    .content-section {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 24px;
      text-align: center;
    }

    .loading-container h3 {
      margin: 24px 0 0 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .form-card {
      border-radius: 0;
      box-shadow: none;
      border: none;
    }

    .resolucion-form {
      padding: 32px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .form-field {
      width: 100%;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .numero-preview-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .preview-label {
      font-size: 14px;
      font-weight: 500;
      color: #495057;
      margin: 0;
    }

    .numero-preview {
      display: flex;
      align-items: center;
    }

    .numero-chip {
      background: #e3f2fd;
      color: #1976d2;
      font-weight: 600;
      font-size: 16px;
      padding: 8px 16px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .numero-chip mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e9ecef;
    }

    .cancel-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-height: 40px;
      padding: 0 24px;
    }

    .submit-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.2s ease-in-out;
    }

    .button-spinner {
      margin-right: 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .header-title h1 {
        font-size: 24px;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .resolucion-form {
        padding: 24px;
      }

      .numero-preview-container {
        grid-column: 1 / -1;
      }
    }

    .suggestion-btn {
      margin-top: 8px;
      font-size: 12px;
      padding: 4px 8px;
      min-height: auto;
      line-height: 1.2;
    }

    .resolucion-existente-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      color: #856404;
      margin-bottom: 16px;
    }

    .resolucion-existente-warning mat-icon {
      color: #f39c12;
    }
  `]
})
export class ResolucionFormComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private resolucionService = inject(ResolucionService);
  private expedienteService = inject(ExpedienteService);
  private empresaService = inject(EmpresaService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  // Signals
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);

  // Signals para los valores del formulario
  numero = signal('');
  fechaEmision = signal<Date>(new Date());
  añosVigencia = signal<number>(10);

  // Signals para el expediente
  expediente = signal<Expediente | null>(null);
  expedienteNoEncontrado = signal(false);

  // Propiedades para empresa y resoluciones padre
  empresaSeleccionada = signal<Empresa | null>(null);
  empresasFiltradas = signal<Observable<Empresa[]>>(of([]));
  resolucionesPadre = signal<any[]>([]);
  resolucionesEmpresa = signal<any[]>([]);

  // Propiedades para la nueva lógica de validación
  resolucionExistente = signal<boolean>(false);
  numeroValido = signal<boolean>(false);

  // Computed para el tipo de resolución automático
  tipoResolucionAutomatico = computed(() => {
    const expedienteData = this.expediente();
    if (!expedienteData) return 'Seleccione un expediente';

    // PADRE para PRIMIGENIA y RENOVACION, HIJO para otros
    if (expedienteData.tipoTramite === 'AUTORIZACION_NUEVA' || expedienteData.tipoTramite === 'RENOVACION') {
      return 'PADRE';
    } else {
      return 'HIJO';
    }
  });

  resolucionForm: FormGroup;

  numeroCompleto = computed(() => {
    const numeroValue = this.numero();
    const fechaValue = this.fechaEmision();

    if (!numeroValue) return 'R-XXXX-YYYY';

    const año = fechaValue ? fechaValue.getFullYear() : new Date().getFullYear();
    const numeroFormateado = numeroValue.toString().padStart(4, '0');
    return `R-${numeroFormateado}-${año}`;
  });

  constructor() {
    this.resolucionForm = this.fb.group({
      numero: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],

      resolucionPadreId: [''],
      fechaEmision: [new Date(), [Validators.required]],
      fechaVigenciaInicio: [''],
      añosVigencia: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
      fechaVigenciaFin: [''],
      descripcion: ['', [Validators.required]],
      observaciones: ['']
    });

    // Sincronizar signals con cambios del formulario
    this.resolucionForm.get('numero')?.valueChanges.subscribe(value => {
      if (value) {
        this.numero.set(value);
      }
    });

    this.resolucionForm.get('fechaEmision')?.valueChanges.subscribe(value => {
      if (value) {
        this.fechaEmision.set(value);
      }
    });

    this.resolucionForm.get('añosVigencia')?.valueChanges.subscribe(value => {
      if (value) {
        this.añosVigencia.set(value);
        this.calcularFechaVigenciaFin();
      }
    });

    this.resolucionForm.get('fechaVigenciaInicio')?.valueChanges.subscribe(value => {
      if (value) {
        this.calcularFechaVigenciaFin();
      }
    });


  }

  ngOnInit(): void {
    const resolucionId = this.route.snapshot.params['id'];
    if (resolucionId) {
      this.isEditing.set(true);
      this.loadResolucion(resolucionId);
    }
    this.cargarEmpresas();

    // Inicializar fecha de vigencia inicio con la fecha de emisión
    const fechaEmision = this.resolucionForm.get('fechaEmision')?.value;
    if (fechaEmision) {
      this.resolucionForm.patchValue({
        fechaVigenciaInicio: fechaEmision
      });
      // Calcular fecha de vigencia fin inicial
      this.calcularFechaVigenciaFin();
    }
  }

  loadResolucion(id: string): void {
    this.isLoading.set(true);
    // TODO: Implementar carga de resolución desde el servicio
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1000);
  }

  onNumeroInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Solo números

    // Limitar a 4 dígitos
    if (value.length > 4) {
      value = value.substring(0, 4);
      input.value = value; // Actualizar el input directamente
    }

    // Actualizar el signal para reactividad
    this.numero.set(value);

    // Limpiar error de validación anterior
    const numeroControl = this.resolucionForm.get('numero');
    if (numeroControl) {
      numeroControl.setErrors(null);
    }
  }

  onFechaEmisionChange(event: any): void {
    this.fechaEmision.set(event.value);

    // Actualizar fecha de vigencia inicio cuando cambie la fecha de emisión
    if (event.value) {
      this.resolucionForm.patchValue({
        fechaVigenciaInicio: event.value
      });
      // Recalcular fecha de vigencia fin
      this.calcularFechaVigenciaFin();
    }
  }

  onAñosVigenciaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value);
    if (value && value >= 1 && value <= 50) {
      this.añosVigencia.set(value);
      this.calcularFechaVigenciaFin();
    }
  }

  private calcularFechaVigenciaFin(): void {
    const fechaInicio = this.resolucionForm.get('fechaVigenciaInicio')?.value;
    const años = this.resolucionForm.get('añosVigencia')?.value;

    if (fechaInicio && años) {
      // Crear la fecha exacta sumando años
      // Si la fecha de inicio es 15/01/2025 y son 10 años, la fecha fin será 15/01/2035
      const fechaFinExacta = new Date(fechaInicio);
      fechaFinExacta.setFullYear(fechaInicio.getFullYear() + años);

      // Log para debugging
      console.log('=== CÁLCULO FECHA VIGENCIA ===');
      console.log('Fecha inicio:', fechaInicio.toLocaleDateString('es-ES'));
      console.log('Años de vigencia:', años);
      console.log('Fecha fin calculada:', fechaFinExacta.toLocaleDateString('es-ES'));

      // Calcular diferencia exacta
      const diferenciaMs = fechaFinExacta.getTime() - fechaInicio.getTime();
      const diferenciaDias = Math.round(diferenciaMs / (1000 * 60 * 60 * 24));
      const diferenciaAños = diferenciaDias / 365.25;

      console.log('Diferencia en días:', diferenciaDias);
      console.log('Diferencia en años (aproximada):', diferenciaAños.toFixed(2));
      console.log('=== FIN CÁLCULO ===');

      this.resolucionForm.patchValue({
        fechaVigenciaFin: fechaFinExacta
      });
    }
  }



  onNumeroBlur(): void {
    const numeroValue = this.numero();
    const empresaSeleccionadaValue = this.empresaSeleccionada();

    if (numeroValue && empresaSeleccionadaValue) {
      this.validarNumeroResolucionUnico(numeroValue, empresaSeleccionadaValue.id);
    }
  }

  onNumeroResolucionBlur(): void {
    const numeroValue = this.numero();

    if (numeroValue) {
      this.validarNumeroResolucionExistente(numeroValue);
      this.validarUnicidadConServicio(numeroValue);
    }
  }

  private validarUnicidadConServicio(numero: string): void {
    // Validar que el número sea único por año
    const fechaActual = new Date();
    const resolucionId = this.route.snapshot.params['id'];

    // Check if number already exists
    this.resolucionService.getResoluciones().subscribe(resoluciones => {
      const year = fechaActual.getFullYear();
      const existe = resoluciones.some(r =>
        r.nroResolucion === numero &&
        new Date(r.fechaEmision).getFullYear() === year &&
        r.id !== resolucionId
      );

      if (existe) {
        // El número ya existe en este año
        const numeroControl = this.resolucionForm.get('numero');
        if (numeroControl) {
          numeroControl.setErrors({
            'duplicado': true
          });
        }

        // Calcular el siguiente número disponible
        const numerosExistentes = resoluciones
          .filter(r => new Date(r.fechaEmision).getFullYear() === year)
          .map(r => parseInt(r.nroResolucion) || 0);
        const maxNumero = Math.max(0, ...numerosExistentes);
        const siguienteNumero = (maxNumero + 1).toString().padStart(4, '0');

        // Mostrar error y sugerencia
        this.snackBar.open(
          `El número ${numero} ya existe en el año ${year}. Siguiente número disponible: ${siguienteNumero}`,
          'Cerrar',
          { duration: 4000 }
        );
      } else {
        // El número es único, limpiar errores
        const numeroControl = this.resolucionForm.get('numero');
        if (numeroControl) {
          numeroControl.setErrors(null);
        }
      }
    });
  }

  usarSiguienteNumero(): void {
    const numeroControl = this.resolucionForm.get('numero');
    if (numeroControl) {
      // Obtener el siguiente número disponible
      const fechaActual = new Date();
      const year = fechaActual.getFullYear();

      this.resolucionService.getResoluciones().subscribe(resoluciones => {
        const numerosExistentes = resoluciones
          .filter(r => new Date(r.fechaEmision).getFullYear() === year)
          .map(r => parseInt(r.nroResolucion) || 0);
        const maxNumero = Math.max(0, ...numerosExistentes);
        const siguienteNumero = (maxNumero + 1).toString().padStart(4, '0');

        // Actualizar el formulario
        numeroControl.setValue(siguienteNumero);
        numeroControl.setErrors(null);
        this.numero.set(siguienteNumero);
        this.resolucionExistente.set(false);
        this.numeroValido.set(true);

        this.snackBar.open(`Número actualizado a ${siguienteNumero}`, 'Cerrar', { duration: 3000 });
      });
    }
  }



  onEmpresaSelected(event: any): void {
    const empresa = event.option.value;
    this.empresaSeleccionada.set(empresa);

    // Cargar resoluciones padre de la empresa
    this.cargarResolucionesPadre(empresa.id);

    // Limpiar expediente anterior
    this.expediente.set(null);
    this.expedienteNoEncontrado.set(false);

    // Limpiar número de resolución y validaciones anteriores
    this.resolucionForm.patchValue({ numero: '' });
    this.numero.set('');
    const numeroControl = this.resolucionForm.get('numero');
    if (numeroControl) {
      numeroControl.setErrors(null);
    }
  }

  necesitaResolucionPadre(): boolean {
    const expedienteData = this.expediente();
    if (!expedienteData) return false;

    return expedienteData.tipoTramite === 'INCREMENTO' || expedienteData.tipoTramite === 'SUSTITUCION';
  }

  private cargarResolucionesPadre(empresaId: string): void {
    this.resolucionService.getResolucionesPorEmpresa(empresaId).subscribe({
      next: (resoluciones) => {
        // Guardar todas las resoluciones de la empresa
        this.resolucionesEmpresa.set(resoluciones);

        // Filtrar solo resoluciones padre (tipo PADRE)
        const resolucionesPadre = resoluciones.filter(r => r.tipoResolucion === 'PADRE' && r.estado === 'VIGENTE');
        this.resolucionesPadre.set(resolucionesPadre);
      },
      error: (error) => {
        console.error('Error al cargar resoluciones padre:', error);
        this.resolucionesEmpresa.set([]);
        this.resolucionesPadre.set([]);
      }
    });
  }

  private cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe(empresas => {
      // Filtrar solo empresas habilitadas
      const empresasHabilitadas = empresas.filter(emp => emp.estado === EstadoEmpresa.AUTORIZADA);

      const empresaSearchControl = this.resolucionForm.get('empresaSearch');
      if (empresaSearchControl) {
        this.empresasFiltradas.set(
          empresaSearchControl.valueChanges.pipe(
            startWith(''),
            map(value => this.filtrarEmpresas(value, empresasHabilitadas))
          )
        );
      }
    });
  }

  private filtrarEmpresas(value: string, empresas: Empresa[]): Empresa[] {
    if (typeof value !== 'string') return empresas;

    const filterValue = value.toLowerCase();
    return empresas.filter(empresa =>
      empresa.ruc.toLowerCase().includes(filterValue) ||
      (empresa.razonSocial.principal && empresa.razonSocial.principal.toLowerCase().includes(filterValue))
    );
  }

  private validarNumeroResolucionUnico(numero: string, empresaId: string): void {
    const numeroControl = this.resolucionForm.get('numero');
    if (!numeroControl) return;

    const numeroCompleto = `R-${numero.padStart(4, '0')}-${new Date().getFullYear()}`;

    // Verificar si ya existe una resolución con ese número para esa empresa
    const resolucionesEmpresa = this.resolucionesEmpresa();
    const existeResolucion = resolucionesEmpresa.find(r =>
      r.nroResolucion === numeroCompleto && r.empresaId === empresaId
    );

    if (existeResolucion) {
      numeroControl.setErrors({
        numeroDuplicado: true,
        mensaje: `Ya existe una resolución con el número ${numeroCompleto} para esta empresa`
      });
      return;
    }

    // Verificar unicidad global por año (número debe ser único por año, no por empresa)
    this.validarUnicidadGlobalPorAnio(numeroCompleto, empresaId, numeroControl);
  }

  private validarUnicidadGlobalPorAnio(numeroCompleto: string, empresaId: string, numeroControl: AbstractControl): void {
    // Obtener todas las resoluciones del año para validar unicidad global
    this.resolucionService.getResoluciones().subscribe({
      next: (todasResoluciones) => {
        const anioActual = new Date().getFullYear();

        // Filtrar resoluciones del año actual
        const resolucionesDelAnio = todasResoluciones.filter(r => {
          const fechaResolucion = new Date(r.fechaEmision);
          return fechaResolucion.getFullYear() === anioActual;
        });

        // Verificar si el número ya existe en el año (cualquier empresa)
        const existeEnElAnio = resolucionesDelAnio.some(r =>
          r.nroResolucion === numeroCompleto
        );

        if (existeEnElAnio) {
          numeroControl.setErrors({
            numeroDuplicado: true,
            mensaje: `Ya existe una resolución con el número ${numeroCompleto} en el año ${anioActual}. El número debe ser único por año.`
          });
        }
      },
      error: (error) => {
        console.error('Error al validar unicidad global:', error);
        // En caso de error, no bloquear la validación pero mostrar advertencia
        this.snackBar.open('Advertencia: No se pudo verificar la unicidad global del número', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private validarNumeroResolucionExistente(numero: string): void {
    const numeroCompleto = `R-${numero.padStart(4, '0')}-${new Date().getFullYear()}`;

    // Verificar si ya existe una resolución con ese número
    this.resolucionService.getResoluciones().subscribe({
      next: (todasResoluciones) => {
        const existe = todasResoluciones.some(r => r.nroResolucion === numeroCompleto);

        if (existe) {
          this.resolucionExistente.set(true);
          this.numeroValido.set(false);
          this.snackBar.open(`Ya existe una resolución con el número ${numeroCompleto}`, 'Cerrar', { duration: 3000 });
        } else {
          this.resolucionExistente.set(false);
          this.numeroValido.set(true);
        }
      },
      error: (error) => {
        console.error('Error al validar número de resolución:', error);
        this.resolucionExistente.set(false);
        this.numeroValido.set(false);
      }
    });
  }

  displayEmpresa = (empresa: Empresa | null): string => {
    if (!empresa) return '';
    return `${empresa.razonSocial?.principal || 'N/A'} - ${empresa.ruc}`;
  }





  openCrearExpedienteModal(): void {
    // TODO: Implementar modal de creación de expediente
    // Por ahora, mostrar mensaje informativo
    this.snackBar.open('Funcionalidad de crear expediente en desarrollo', 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }



  mostrarFechasVigencia(): boolean {
    const expedienteData = this.expediente();
    if (!expedienteData) return false;

    // Solo mostrar fechas de vigencia para resoluciones PADRE
    return this.tipoResolucionAutomatico() === 'PADRE';
  }

  // Método para mostrar campos condicionales (ya no se usa)
  mostrarTipoResolucion(): boolean {
    // Ya no se usa, se eliminó la selección manual
    return false;
  }

  // Método para validar campos condicionales (ya no se usa)
  validarCamposCondicionales(): void {
    // Ya no se usa, la validación es automática
  }

  onSubmit(): void {
    if (this.resolucionForm.valid && this.expediente() && !this.resolucionExistente()) {
      this.isSubmitting.set(true);

      const expedienteData = this.expediente()!;
      const formValue = this.resolucionForm.value;

      // Obtener el ID de la empresa del expediente
      const empresaId = expedienteData.empresaId || '';
      
      // Generar el número completo de resolución
      const fechaEmision = new Date(formValue.fechaEmision);
      const anio = fechaEmision.getFullYear();
      const numeroCompleto = `R-${formValue.numero.padStart(4, '0')}-${anio}`;

      const resolucionData: ResolucionCreate = {
        nroResolucion: numeroCompleto,
        empresaId: empresaId,
        expedienteId: expedienteData.id,
        fechaEmision: formValue.fechaEmision,
        descripcion: formValue.descripcion,
        observaciones: formValue.observaciones,
        usuarioEmisionId: 'sistema', // TODO: Obtener del usuario actual
        // El tipo de resolución se determina automáticamente del expediente
        tipoResolucion: this.tipoResolucionAutomatico() as 'PADRE' | 'HIJO',
        // El tipo de trámite se obtiene del expediente
        tipoTramite: expedienteData.tipoTramite,
        // Las fechas de vigencia solo se incluyen para resoluciones PADRE
        ...(this.tipoResolucionAutomatico() === 'PADRE' && {
          fechaVigenciaInicio: formValue.fechaVigenciaInicio || undefined,
          fechaVigenciaFin: formValue.fechaVigenciaFin || undefined
        })
      };

      if (this.isEditing()) {
        // TODO: Implementar actualización
        console.log('Actualizando resolución:', resolucionData);
        setTimeout(() => {
          this.isSubmitting.set(false);
          this.snackBar.open('Resolución actualizada exitosamente', 'Cerrar', { duration: 3000 });
          this.volver();
        }, 1000);
      } else {
        this.resolucionService.createResolucion(resolucionData).subscribe({
          next: (resolucion) => {
            this.isSubmitting.set(false);
            this.snackBar.open('Resolución creada exitosamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/resoluciones', resolucion.id]);
          },
          error: (error) => {
            console.error('Error creating resolucion:', error);
            this.isSubmitting.set(false);

            // Manejar errores específicos de validación
            if (error.message && error.message.includes('Ya existe una resolución')) {
              this.snackBar.open(error.message, 'Cerrar', { duration: 5000 });
              // Marcar el campo número como inválido
              const numeroControl = this.resolucionForm.get('numero');
              if (numeroControl) {
                numeroControl.setErrors({ 'duplicado': true });
                this.resolucionExistente.set(true);
                this.numeroValido.set(false);
              }
            } else {
              this.snackBar.open('Error al crear la resolución: ' + (error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
            }
          }
        });
      }
    } else {
      this.markFormGroupTouched();
      if (this.resolucionExistente()) {
        this.snackBar.open('No se puede crear una resolución con un número que ya existe', 'Cerrar', { duration: 3000 });
      } else if (!this.expediente()) {
        this.snackBar.open('Debe seleccionar un expediente válido', 'Cerrar', { duration: 3000 });
      }
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resolucionForm.controls).forEach(key => {
      const control = this.resolucionForm.get(key);
      control?.markAsTouched();
    });
  }

  volver(): void {
    this.router.navigate(['/resoluciones']);
  }
} 