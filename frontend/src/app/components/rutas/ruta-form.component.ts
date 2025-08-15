import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { RutaService } from '../../services/ruta.service';
import { LocalidadService } from '../../services/localidad.service';
import { EmpresaService } from '../../services/empresa.service';
import { Ruta, RutaCreate, RutaUpdate, EstadoRuta, TipoRuta, Localidad, ValidacionRuta } from '../../models/ruta.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-ruta-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatTooltipModule,
    MatStepperModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>{{ isEditing() ? 'Editar Ruta' : 'Nueva Ruta' }}</h1>
          <p class="header-subtitle">Gestión de rutas de transporte</p>
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
        <!-- Toggle para modo múltiples rutas -->
        <mat-card class="mode-toggle-card">
          <mat-card-content>
            <div class="mode-toggle">
              <label class="mode-label">
                <input type="checkbox" 
                       [checked]="modoMultiplesRutas()" 
                       (change)="toggleModoMultiplesRutas($event)">
                <span class="mode-text">Crear Múltiples Rutas</span>
              </label>
              <p class="mode-description">
                Activa esta opción para crear varias rutas para la misma empresa y resolución
              </p>
            </div>

            <!-- Selección de Empresa y Resolución (solo en modo múltiples rutas) -->
            @if (modoMultiplesRutas()) {
              <div class="selection-section">
                <h3>Empresa y Resolución</h3>
                <div class="form-grid">
                  <!-- Empresa -->
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Empresa</mat-label>
                    <input matInput 
                           [matAutocomplete]="empresaAuto" 
                           [value]="empresaSearchValue()" 
                           (input)="onEmpresaSearchInput($event)"
                           placeholder="Buscar empresa por RUC o razón social"
                           required>
                    <mat-autocomplete #empresaAuto="matAutocomplete" 
                                     [displayWith]="displayEmpresa"
                                     (optionSelected)="onEmpresaSelected($event)">
                      @for (empresa of empresasFiltradas() | async; track empresa.id) {
                        <mat-option [value]="empresa">
                          <div class="empresa-option">
                            <div class="empresa-ruc">{{ empresa.ruc }}</div>
                            <div class="empresa-razon">{{ empresa.razonSocial.principal || 'Sin razón social' }}</div>
                          </div>
                        </mat-option>
                      }
                    </mat-autocomplete>
                    <mat-hint>Empresa propietaria de las rutas</mat-hint>
                    @if (!empresaSeleccionada()) {
                      <mat-error>La empresa es obligatoria</mat-error>
                    }
                  </mat-form-field>

                  <!-- Resolución Primigenia -->
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Resolución Primigenia</mat-label>
                    <input matInput 
                           [matAutocomplete]="resolucionAuto" 
                           [value]="resolucionSearchValue()" 
                           (input)="onResolucionSearchInput($event)"
                           placeholder="Buscar resolución por número"
                           required>
                    <mat-autocomplete #resolucionAuto="matAutocomplete" 
                                     [displayWith]="displayResolucion"
                                     (optionSelected)="onResolucionSelected($event)">
                      @for (resolucion of resolucionesFiltradas(); track resolucion.id) {
                        <mat-option [value]="resolucion">
                          <div class="resolucion-option">
                            <div class="resolucion-numero">{{ resolucion.nroResolucion }}</div>
                            <div class="resolucion-tipo">{{ resolucion.tipoTramite }}</div>
                          </div>
                        </mat-option>
                      }
                    </mat-autocomplete>
                    <mat-hint>Resolución que autoriza las rutas</mat-hint>
                    @if (!resolucionSeleccionada()) {
                      <mat-error>La resolución es obligatoria</mat-error>
                    }
                  </mat-form-field>
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <form [formGroup]="rutaForm" (ngSubmit)="onSubmit()" class="ruta-form">


            <div class="form-grid">
              <!-- Código de Ruta -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Código de Ruta</mat-label>
                <input matInput formControlName="codigoRuta" placeholder="PUN-JUL-001" required>
                @if (rutaForm.get('codigoRuta')?.hasError('required') && rutaForm.get('codigoRuta')?.touched) {
                  <mat-error>El código de ruta es requerido</mat-error>
                }
                @if (rutaForm.get('codigoRuta')?.hasError('codigoDuplicado')) {
                  <mat-error>Ya existe una ruta con este código</mat-error>
                }
                <mat-hint>Formato: ORIGEN-DESTINO-XXX</mat-hint>
              </mat-form-field>
              
              <!-- Origen -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Origen</mat-label>
                <input matInput 
                       [matAutocomplete]="origenAuto" 
                       formControlName="origenSearch" 
                       placeholder="Buscar localidad de origen"
                       (input)="onOrigenSearch()"
                       required>
                <mat-autocomplete #origenAuto="matAutocomplete" 
                                 [displayWith]="displayLocalidad"
                                 (optionSelected)="onOrigenSelected($event)">
                  @for (localidad of localidadesFiltradas() | async; track localidad.id) {
                    <mat-option [value]="localidad">
                      <div class="localidad-option">
                        <div class="localidad-nombre">{{ localidad.nombre }}</div>
                        <div class="localidad-detalle">{{ localidad.departamento }} - {{ localidad.provincia }}</div>
                      </div>
                    </mat-option>
                  }
                </mat-autocomplete>
                @if (rutaForm.get('origenSearch')?.hasError('required') && rutaForm.get('origenSearch')?.touched) {
                  <mat-error>El origen es requerido</mat-error>
                }
              </mat-form-field>
              
              <!-- Destino -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Destino</mat-label>
                <input matInput 
                       [matAutocomplete]="destinoAuto" 
                       formControlName="destinoSearch" 
                       placeholder="Buscar localidad de destino"
                       (input)="onDestinoSearch()"
                       required>
                <mat-autocomplete #destinoAuto="matAutocomplete" 
                                 [displayWith]="displayLocalidad"
                                 (optionSelected)="onDestinoSelected($event)">
                  @for (localidad of localidadesFiltradas() | async; track localidad.id) {
                    <mat-option [value]="localidad">
                      <div class="localidad-option">
                        <div class="localidad-nombre">{{ localidad.nombre }}</div>
                        <div class="localidad-detalle">{{ localidad.departamento }} - {{ localidad.provincia }}</div>
                      </div>
                    </mat-option>
                  }
                </mat-autocomplete>
                @if (rutaForm.get('destinoSearch')?.hasError('required') && rutaForm.get('destinoSearch')?.touched) {
                  <mat-error>El destino es requerido</mat-error>
                }
              </mat-form-field>
              
              <!-- Distancia -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Distancia (km)</mat-label>
                <input matInput type="number" formControlName="distancia" placeholder="1500" required>
                @if (rutaForm.get('distancia')?.hasError('required') && rutaForm.get('distancia')?.touched) {
                  <mat-error>La distancia es requerida</mat-error>
                }
                <mat-hint>{{ distanciaCalculada() }} km</mat-hint>
              </mat-form-field>
              
              <!-- Tiempo Estimado -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Tiempo Estimado (horas)</mat-label>
                <input matInput type="number" formControlName="tiempoEstimado" placeholder="24" required>
                @if (rutaForm.get('tiempoEstimado')?.hasError('required') && rutaForm.get('tiempoEstimado')?.touched) {
                  <mat-error>El tiempo estimado es requerido</mat-error>
                }
                <mat-hint>{{ tiempoEstimadoCalculado() }} horas</mat-hint>
              </mat-form-field>
              
              <!-- Tipo de Ruta -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Tipo de Ruta</mat-label>
                <mat-select formControlName="tipoRuta" required>
                  <mat-option value="">Seleccione tipo</mat-option>
                  @for (tipo of tiposRuta(); track tipo.value) {
                    <mat-option [value]="tipo.value">{{ tipo.label }}</mat-option>
                  }
                </mat-select>
                @if (rutaForm.get('tipoRuta')?.hasError('required') && rutaForm.get('tipoRuta')?.touched) {
                  <mat-error>El tipo de ruta es requerido</mat-error>
                }
              </mat-form-field>
              
              <!-- Estado -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado" required>
                  <mat-option value="">Seleccione estado</mat-option>
                  @for (estado of estadosRuta(); track estado.value) {
                    <mat-option [value]="estado.value">{{ estado.label }}</mat-option>
                  }
                </mat-select>
                @if (rutaForm.get('estado')?.hasError('required') && rutaForm.get('estado')?.touched) {
                  <mat-error>El estado es requerido</mat-error>
                }
              </mat-form-field>



              <!-- Capacidad Máxima -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Capacidad Máxima</mat-label>
                <input matInput type="number" formControlName="capacidadMaxima" placeholder="50" min="1" max="100">
                <mat-hint>Número máximo de pasajeros</mat-hint>
              </mat-form-field>

              <!-- Tarifa Base -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Tarifa Base (S/)</mat-label>
                <input matInput type="number" formControlName="tarifaBase" placeholder="25.00" min="0" step="0.01">
                <mat-hint>Precio base del pasaje</mat-hint>
              </mat-form-field>
            </div>

            <!-- Frecuencias e Itinerarios -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Frecuencias</mat-label>
                <input matInput formControlName="frecuencias" placeholder="Ej: Diaria, cada 30 minutos">
                <mat-hint>Frecuencia de salidas de la ruta</mat-hint>
                <mat-error *ngIf="rutaForm.get('frecuencias')?.hasError('required')">
                  Las frecuencias son obligatorias
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Itinerarios</mat-label>
                <input matInput formControlName="itinerarioIds" placeholder="Ej: IT-001, IT-002, IT-003">
                <mat-hint>IDs de los itinerarios asociados (separados por comas)</mat-hint>
                <mat-error *ngIf="rutaForm.get('itinerarioIds')?.hasError('required')">
                  Los itinerarios son obligatorios
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Botón para agregar más rutas (solo en modo múltiples rutas) -->
            @if (modoMultiplesRutas()) {
              <div class="add-ruta-section">
                <button mat-button type="button" (click)="agregarRuta()" class="add-ruta-button">
                  <mat-icon>add</mat-icon>
                  Agregar Otra Ruta
                </button>
              </div>
            }

            <!-- Descripción -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Descripción</mat-label>
              <textarea matInput formControlName="descripcion" placeholder="Descripción de la ruta..." rows="3"></textarea>
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
              <button mat-raised-button color="primary" type="submit" [disabled]="rutaForm.invalid || isSubmitting()" class="submit-button">
                @if (isSubmitting()) {
                  <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
                  <span>{{ isEditing() ? 'Actualizando...' : 'Creando...' }}</span>
                } @else {
                  <ng-container>
                    <mat-icon>{{ isEditing() ? 'save' : 'add' }}</mat-icon>
                    <span>{{ isEditing() ? 'Actualizar Ruta' : 'Crear Ruta' }}</span>
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

    .ruta-form {
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

    .localidad-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .localidad-nombre {
      font-weight: 500;
      color: #1976d2;
    }

    .localidad-detalle {
      font-size: 0.9em;
      color: #666;
    }

    .empresa-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .mode-toggle-card {
      margin-bottom: 24px;
      border: 2px dashed #e0e0e0;
      background: #fafafa;
    }

    .mode-toggle {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mode-label {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      font-weight: 500;
      color: #2c3e50;
    }

    .mode-label input[type="checkbox"] {
      width: 20px;
      height: 20px;
      accent-color: #1976d2;
    }

    .mode-text {
      font-size: 16px;
      font-weight: 600;
    }

    .mode-description {
      margin: 0;
      color: #6c757d;
      font-size: 14px;
      line-height: 1.4;
    }

    .selection-section {
      margin-bottom: 32px;
      padding: 24px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .selection-section h3 {
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 18px;
      font-weight: 600;
    }

    .add-ruta-section {
      text-align: center;
      margin: 24px 0;
      padding: 16px;
      border: 2px dashed #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
    }

    .add-ruta-button {
      color: #1976d2;
      border: 2px dashed #1976d2;
      border-radius: 8px;
      padding: 12px 24px;
      font-weight: 500;
      transition: all 0.2s ease-in-out;
    }

    .add-ruta-button:hover {
      background: #1976d2;
      color: white;
      border-color: #1976d2;
    }

    .empresa-ruc {
      font-weight: 500;
      color: #1976d2;
    }

    .empresa-razon {
      font-size: 0.9em;
      color: #666;
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

    .empresa-razon {
      font-size: 0.9em;
      color: #666;
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

      .ruta-form {
        padding: 24px;
      }
    }
  `]
})
export class RutaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private rutaService = inject(RutaService);
  private localidadService = inject(LocalidadService);
  private empresaService = inject(EmpresaService);

  // Signals
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  rutaId = signal<string | null>(null);

  // Form
  rutaForm: FormGroup;

  // Signals para datos
  localidadesFiltradas = signal<Observable<Localidad[]>>(of([]));
  empresasFiltradas = signal<Observable<Empresa[]>>(of([]));
  resolucionesFiltradas = signal<Resolucion[]>([]);
  origenSeleccionado = signal<Localidad | null>(null);
  destinoSeleccionado = signal<Localidad | null>(null);
  empresaSeleccionada = signal<Empresa | null>(null);
  resolucionSeleccionada = signal<Resolucion | null>(null);

  // Signals para modo múltiples rutas
  modoMultiplesRutas = signal(false);
  rutasArray = signal<RutaCreate[]>([]);
  rutaActualIndex = signal(0);
  
  // Signals para búsqueda de empresa y resolución
  empresaSearchValue = signal('');
  resolucionSearchValue = signal('');

  // Computed properties
  distanciaCalculada = computed(() => {
    const origen = this.origenSeleccionado();
    const destino = this.destinoSeleccionado();
    if (origen && destino) {
      // Calcular distancia automáticamente
      return 'Calculando...';
    }
    return 'Seleccione origen y destino';
  });

  tiempoEstimadoCalculado = computed(() => {
    const distancia = this.rutaForm.get('distancia')?.value;
    if (distancia && distancia > 0) {
      // Calcular tiempo basado en distancia (promedio 60 km/h)
      return Math.ceil(distancia / 60);
    }
    return 'Seleccione distancia';
  });

  tiposRuta = signal([
    { value: 'INTERURBANA', label: 'Interurbana' },
    { value: 'URBANA', label: 'Urbana' },
    { value: 'INTERPROVINCIAL', label: 'Interprovincial' },
    { value: 'NACIONAL', label: 'Nacional' },
    { value: 'INTERNACIONAL', label: 'Internacional' }
  ]);

  estadosRuta = signal([
    { value: 'ACTIVA', label: 'Activa' },
    { value: 'INACTIVA', label: 'Inactiva' },
    { value: 'SUSPENDIDA', label: 'Suspendida' },
    { value: 'EN_MANTENIMIENTO', label: 'En Mantenimiento' },
    { value: 'ARCHIVADA', label: 'Archivada' }
  ]);

  constructor() {
    this.rutaForm = this.fb.group({
      codigoRuta: ['', [Validators.required, Validators.pattern(/^[0-9]{2}$/)]],
      nombre: ['', [Validators.required]],
      origenSearch: ['', [Validators.required]],
      origenId: ['', [Validators.required]],
      destinoSearch: ['', [Validators.required]],
      destinoId: ['', [Validators.required]],
      distancia: ['', [Validators.required, Validators.min(0)]],
      tiempoEstimado: ['', [Validators.required, Validators.min(0)]],
      tipoRuta: ['', [Validators.required]],
      estado: ['ACTIVA', [Validators.required]],
      capacidadMaxima: [50, [Validators.min(1), Validators.max(100)]],
      tarifaBase: [0, [Validators.min(0)]],
      frecuencias: ['', [Validators.required]],
      itinerarioIds: [[], [Validators.required]],
      descripcion: [''],
      observaciones: ['']
    });

    // Agregar validación de unicidad del código de ruta
    this.configurarValidacionCodigoUnico();
  }

  private configurarValidacionCodigoUnico(): void {
    // Escuchar cambios en el código de ruta para validar unicidad
    this.rutaForm.get('codigoRuta')?.valueChanges.subscribe(codigo => {
      if (codigo && this.resolucionSeleccionada()) {
        this.validarCodigoUnicoEnTiempoReal(codigo);
      }
    });
  }

  private validarCodigoUnicoEnTiempoReal(codigo: string): void {
    if (!this.resolucionSeleccionada()) return;

    this.rutaService.validarCodigoRutaUnico(
      this.resolucionSeleccionada()!.id,
      codigo,
      this.isEditing() ? this.rutaId() || undefined : undefined
    ).subscribe(esUnico => {
      const codigoControl = this.rutaForm.get('codigoRuta');
      if (!esUnico) {
        codigoControl?.setErrors({ codigoDuplicado: true });
      } else {
        // Remover error de duplicado si existe
        if (codigoControl?.hasError('codigoDuplicado')) {
          const errors = { ...codigoControl.errors };
          delete errors['codigoDuplicado'];
          codigoControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      }
    });
  }

  ngOnInit(): void {
    const rutaId = this.route.snapshot.params['id'];
    if (rutaId) {
      this.isEditing.set(true);
      this.rutaId.set(rutaId);
      this.loadRuta(rutaId);
    }
    
    this.cargarLocalidades();
    this.cargarEmpresas();
    this.configurarAutocompletados();
  }

  private cargarLocalidades(): void {
    this.localidadService.getLocalidadesActivas().subscribe(localidades => {
      this.localidadesFiltradas.set(of(localidades));
    });
  }

  private cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe(empresas => {
      this.empresasFiltradas.set(of(empresas));
    });
  }

  private configurarAutocompletados(): void {
    // Configurar autocompletado para origen
    this.rutaForm.get('origenSearch')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filtrarLocalidades(value))
    ).subscribe(localidades => {
      this.localidadesFiltradas.set(of(localidades));
    });

    // Configurar autocompletado para destino
    this.rutaForm.get('destinoSearch')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filtrarLocalidades(value))
    ).subscribe(localidades => {
      this.localidadesFiltradas.set(of(localidades));
    });


  }

  private filtrarLocalidades(value: string): Localidad[] {
    if (typeof value !== 'string') return [];
    const filterValue = value.toLowerCase();
    
    // Obtener localidades del servicio y filtrar
    this.localidadService.getLocalidadesActivas().subscribe(localidades => {
      const localidadesFiltradas = localidades.filter(localidad => 
        localidad.nombre.toLowerCase().includes(filterValue) ||
        localidad.codigo.toLowerCase().includes(filterValue) ||
        localidad.departamento.toLowerCase().includes(filterValue) ||
        localidad.provincia.toLowerCase().includes(filterValue)
      );
      this.localidadesFiltradas.set(of(localidadesFiltradas));
    });
    
    return [];
  }

  private filtrarEmpresas(value: string): Empresa[] {
    if (typeof value !== 'string') return [];
    const filterValue = value.toLowerCase();
    
    // Obtener empresas del servicio y filtrar
    this.empresaService.getEmpresas().subscribe(empresas => {
      const empresasFiltradas = empresas.filter(empresa => 
        empresa.ruc.toLowerCase().includes(filterValue) ||
        (empresa.razonSocial?.principal || '').toLowerCase().includes(filterValue)
      );
      this.empresasFiltradas.set(of(empresasFiltradas));
    });
    
    return [];
  }

  // Métodos para autocompletado
  onOrigenSearch(): void {
    // El filtrado se maneja automáticamente
  }

  onDestinoSearch(): void {
    // El filtrado se maneja automáticamente
  }

  onEmpresaSearch(): void {
    // El filtrado se maneja automáticamente
  }

  onEmpresaSearchInput(event: any): void {
    const value = event.target.value;
    this.empresaSearchValue.set(value);
    this.filtrarEmpresas(value);
  }

  onResolucionSearchInput(event: any): void {
    const value = event.target.value;
    this.resolucionSearchValue.set(value);
    this.filtrarResoluciones(value);
  }

  // Métodos para modo múltiples rutas
  toggleModoMultiplesRutas(event: any): void {
    this.modoMultiplesRutas.set(event.target.checked);
    if (event.target.checked) {
      this.inicializarModoMultiplesRutas();
    } else {
      this.limpiarModoMultiplesRutas();
    }
  }

  private inicializarModoMultiplesRutas(): void {
    // Agregar primera ruta al array
    this.agregarRuta();
  }

  private limpiarModoMultiplesRutas(): void {
    // Limpiar array de rutas
    this.rutasArray.set([]);
    this.rutaActualIndex.set(0);
  }

  agregarRuta(): void {
    const nuevaRuta: RutaCreate = {
      codigoRuta: this.generarCodigoUnico(),
      nombre: '',
      origenId: '',
      destinoId: '',
      origen: '',
      destino: '',
      distancia: 0,
      tiempoEstimado: 0,
      tipoRuta: 'INTERURBANA',
      estado: 'ACTIVA',
      empresaId: this.empresaSeleccionada()?.id || '',
      frecuencias: '',
      itinerarioIds: [],
      descripcion: '',
      observaciones: ''
    };
    
    const rutasActuales = this.rutasArray();
    rutasActuales.push(nuevaRuta);
    this.rutasArray.set(rutasActuales);
    this.rutaActualIndex.set(rutasActuales.length - 1);
    
    // Actualizar formulario con la nueva ruta
    this.actualizarFormularioConRuta(nuevaRuta);
  }

  private generarCodigoUnico(): string {
    const rutasActuales = this.rutasArray();
    let codigo = 1;
    while (rutasActuales.some(r => r.codigoRuta === codigo.toString().padStart(2, '0'))) {
      codigo++;
    }
    return codigo.toString().padStart(2, '0');
  }

  private actualizarFormularioConRuta(ruta: RutaCreate): void {
    this.rutaForm.patchValue({
      codigoRuta: ruta.codigoRuta,
      nombre: ruta.nombre,
      origenId: ruta.origenId,
      destinoId: ruta.destinoId,
      origen: ruta.origen,
      destino: ruta.destino,
      distancia: ruta.distancia,
      tiempoEstimado: ruta.tiempoEstimado,
      tipoRuta: ruta.tipoRuta,
      estado: ruta.estado,
      frecuencias: ruta.frecuencias || '',
      itinerarioIds: ruta.itinerarioIds || [],
      descripcion: ruta.descripcion,
      observaciones: ruta.observaciones
    });
  }

  onOrigenSelected(event: any): void {
    const localidad = event.option.value;
    this.origenSeleccionado.set(localidad);
    this.rutaForm.patchValue({
      origenId: localidad.id
    });
    this.calcularDistanciaYTiempo();
  }

  onDestinoSelected(event: any): void {
    const localidad = event.option.value;
    this.destinoSeleccionado.set(localidad);
    this.rutaForm.patchValue({
      destinoId: localidad.id
    });
    this.calcularDistanciaYTiempo();
  }

  onEmpresaSelected(event: any): void {
    const empresa = event.option.value;
    this.empresaSeleccionada.set(empresa);
    this.empresaSearchValue.set(this.displayEmpresa(empresa));
    // Cargar resoluciones de la empresa seleccionada
    this.cargarResolucionesPorEmpresa(empresa.id);
  }

  onResolucionSelected(event: any): void {
    const resolucion = event.option.value;
    this.resolucionSeleccionada.set(resolucion);
    this.resolucionSearchValue.set(this.displayResolucion(resolucion));
  }

  displayEmpresa = (empresa: Empresa): string => {
    return empresa ? `${empresa.ruc} - ${empresa.razonSocial?.principal || 'Sin razón social'}` : '';
  }

  displayResolucion = (resolucion: Resolucion): string => {
    return resolucion ? `${resolucion.nroResolucion} - ${resolucion.tipoTramite}` : '';
  }



  private filtrarResoluciones(value: string): void {
    if (typeof value !== 'string') return;
    const filterValue = value.toLowerCase();
    
    // Filtrar resoluciones de la empresa seleccionada
    const empresaId = this.empresaSeleccionada()?.id;
    if (empresaId) {
      // Aquí deberías obtener las resoluciones de la empresa
      // Por ahora usamos datos mock
      const resoluciones = this.resolucionesFiltradas();
      const resolucionesFiltradas = resoluciones.filter(resolucion => 
        resolucion.nroResolucion.toLowerCase().includes(filterValue) ||
        resolucion.tipoTramite.toLowerCase().includes(filterValue)
      );
      this.resolucionesFiltradas.set(resolucionesFiltradas);
    }
  }

  private cargarResolucionesPorEmpresa(empresaId: string): void {
    // Aquí deberías obtener las resoluciones de la empresa específica
    // Por ahora usamos datos mock con el tipo completo
    const resolucionesMock: Resolucion[] = [
      {
        id: '1',
        nroResolucion: 'R-0001-2025',
        empresaId: empresaId,
        expedienteId: '1',
        fechaEmision: new Date('2025-01-15'),
        tipoTramite: 'PRIMIGENIA',
        tipoResolucion: 'PADRE',
        fechaVigenciaInicio: new Date('2025-01-15'),
        fechaVigenciaFin: new Date('2030-01-15'),
        descripcion: 'Resolución primigenia para operación de transporte',
        estado: 'VIGENTE',
        estaActivo: true,
        fechaRegistro: new Date('2025-01-15'),
        resolucionPadreId: undefined,
        resolucionesHijasIds: [],
        vehiculosHabilitadosIds: [],
        rutasAutorizadasIds: []
      },
      {
        id: '2',
        nroResolucion: 'R-0002-2025',
        empresaId: empresaId,
        expedienteId: '2',
        fechaEmision: new Date('2025-02-15'),
        tipoTramite: 'PRIMIGENIA',
        tipoResolucion: 'PADRE',
        fechaVigenciaInicio: new Date('2025-02-15'),
        fechaVigenciaFin: new Date('2030-02-15'),
        descripcion: 'Resolución primigenia para operación de transporte',
        estado: 'VIGENTE',
        estaActivo: true,
        fechaRegistro: new Date('2025-02-15'),
        resolucionPadreId: undefined,
        resolucionesHijasIds: [],
        vehiculosHabilitadosIds: [],
        rutasAutorizadasIds: []
      }
    ];
    this.resolucionesFiltradas.set(resolucionesMock);
  }

  displayLocalidad = (localidad: Localidad): string => {
    return localidad ? `${localidad.nombre} (${localidad.departamento})` : '';
  }

  private calcularDistanciaYTiempo(): void {
    const origenId = this.rutaForm.get('origenId')?.value;
    const destinoId = this.rutaForm.get('destinoId')?.value;
    
    if (origenId && destinoId) {
      this.rutaService.calcularDistanciaYTiempo(origenId, destinoId).subscribe({
        next: (resultado) => {
          this.rutaForm.patchValue({
            distancia: resultado.distancia,
            tiempoEstimado: resultado.tiempoEstimado
          });
        },
        error: (error) => {
          console.error('Error al calcular distancia y tiempo:', error);
        }
      });
    }
  }

  loadRuta(id: string): void {
    this.isLoading.set(true);
    this.rutaService.getRutaById(id).subscribe({
      next: (ruta) => {
        this.poblarFormulario(ruta);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar ruta:', error);
        this.snackBar.open('Error al cargar la ruta', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  private poblarFormulario(ruta: Ruta): void {
    // Cargar origen y destino
    if (ruta.origenId) {
      this.localidadService.getLocalidadById(ruta.origenId).subscribe({
        next: (localidad) => {
          this.origenSeleccionado.set(localidad);
          this.rutaForm.patchValue({
            origenSearch: localidad,
            origenId: localidad.id
          });
        }
      });
    }

    if (ruta.destinoId) {
      this.localidadService.getLocalidadById(ruta.destinoId).subscribe({
        next: (localidad) => {
          this.destinoSeleccionado.set(localidad);
          this.rutaForm.patchValue({
            destinoSearch: localidad,
            destinoId: localidad.id
          });
        }
      });
    }

    // Cargar empresa si existe
    if (ruta.empresaId) {
      this.empresaService.getEmpresa(ruta.empresaId).subscribe({
        next: (empresa) => {
          this.empresaSeleccionada.set(empresa);
        }
      });
    }

    // Poblar el resto del formulario
    this.rutaForm.patchValue({
      codigoRuta: ruta.codigoRuta,
      distancia: ruta.distancia,
      tiempoEstimado: ruta.tiempoEstimado,
      tipoRuta: ruta.tipoRuta,
      estado: ruta.estado,
      capacidadMaxima: ruta.capacidadMaxima || 50,
      tarifaBase: ruta.tarifaBase || 0,
      descripcion: ruta.descripcion || '',
      observaciones: ruta.observaciones || ''
    });
  }

  onSubmit(): void {
    if (this.rutaForm.valid) {
      this.isSubmitting.set(true);
      
      if (this.modoMultiplesRutas()) {
        // Modo múltiples rutas
        this.crearRutasEnLote();
      } else {
        // Modo ruta única
        this.crearRutaUnica();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private crearRutasEnLote(): void {
    // Validar que se haya seleccionado empresa y resolución
    if (!this.empresaSeleccionada() || !this.resolucionSeleccionada()) {
      this.isSubmitting.set(false);
      this.snackBar.open('Debe seleccionar empresa y resolución primigenia', 'Cerrar', { duration: 3000 });
      return;
    }

    const rutas = this.rutasArray();
    if (rutas.length === 0) {
      this.isSubmitting.set(false);
      this.snackBar.open('No hay rutas para crear', 'Cerrar', { duration: 3000 });
      return;
    }

    // Crear todas las rutas en paralelo
    const promesas = rutas.map(ruta => this.rutaService.createRuta(ruta).toPromise());
    
    Promise.all(promesas)
      .then(() => {
        this.isSubmitting.set(false);
        this.snackBar.open(`${rutas.length} ruta(s) creada(s) exitosamente`, 'Cerrar', { duration: 3000 });
        this.router.navigate(['/rutas']);
      })
      .catch((error) => {
        this.isSubmitting.set(false);
        console.error('Error al crear rutas:', error);
        this.snackBar.open('Error al crear algunas rutas', 'Cerrar', { duration: 3000 });
      });
  }

  private crearRutaUnica(): void {
    const formValue = this.rutaForm.value;
    
    // Validar que el código de ruta sea único antes de proceder
    if (this.resolucionSeleccionada()) {
      this.rutaService.validarCodigoRutaUnico(
        this.resolucionSeleccionada()!.id,
        formValue.codigoRuta,
        this.isEditing() ? this.rutaId() || undefined : undefined
      ).subscribe(esUnico => {
        if (!esUnico) {
          this.isSubmitting.set(false);
          this.snackBar.open('El código de ruta ya existe en esta resolución. Debe ser único.', 'Cerrar', { duration: 5000 });
          return;
        }
        
        // Si es único, continuar con la creación/actualización
        this.procesarRutaUnica(formValue);
      });
    } else {
      // Si no hay resolución seleccionada, proceder directamente
      this.procesarRutaUnica(formValue);
    }
  }

  private procesarRutaUnica(formValue: any): void {
    if (this.isEditing()) {
      // Modo edición
      const rutaUpdate: RutaUpdate = {
        codigoRuta: formValue.codigoRuta,
        origenId: formValue.origenId,
        destinoId: formValue.destinoId,
        origen: this.origenSeleccionado()?.nombre || '',
        destino: this.destinoSeleccionado()?.nombre || '',
        distancia: formValue.distancia,
        tiempoEstimado: formValue.tiempoEstimado,
        tipoRuta: formValue.tipoRuta,
        estado: formValue.estado,
        empresaId: this.empresaSeleccionada()?.id || '',
        capacidadMaxima: formValue.capacidadMaxima,
        tarifaBase: formValue.tarifaBase,
        frecuencias: formValue.frecuencias || '',
        itinerarioIds: formValue.itinerarioIds || [],
        descripcion: formValue.descripcion,
        observaciones: formValue.observaciones
      };

      const rutaId = this.rutaId();
      if (rutaId) {
        this.rutaService.updateRuta(rutaId, rutaUpdate).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.snackBar.open('Ruta actualizada exitosamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/rutas']);
          },
          error: (error) => {
            this.isSubmitting.set(false);
            console.error('Error al actualizar ruta:', error);
            this.snackBar.open('Error al actualizar la ruta', 'Cerrar', { duration: 3000 });
          }
        });
      }
    } else {
      // Modo creación
      const nuevaRuta: RutaCreate = {
        codigoRuta: formValue.codigoRuta,
        nombre: `${this.origenSeleccionado()?.nombre || ''} - ${this.destinoSeleccionado()?.nombre || ''}`,
        origenId: formValue.origenId,
        destinoId: formValue.destinoId,
        origen: this.origenSeleccionado()?.nombre || '',
        destino: this.destinoSeleccionado()?.nombre || '',
        distancia: formValue.distancia,
        tiempoEstimado: formValue.tiempoEstimado,
        tipoRuta: formValue.tipoRuta,
        estado: formValue.estado,
        empresaId: this.empresaSeleccionada()?.id || '',
        resolucionId: this.resolucionSeleccionada()?.id,
        capacidadMaxima: formValue.capacidadMaxima,
        tarifaBase: formValue.tarifaBase,
        frecuencias: formValue.frecuencias || '',
        itinerarioIds: formValue.itinerarioIds || [],
        descripcion: formValue.descripcion,
        observaciones: formValue.observaciones
      };

      this.rutaService.createRuta(nuevaRuta).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.snackBar.open('Ruta creada exitosamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/rutas']);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          console.error('Error al crear ruta:', error);
          this.snackBar.open('Error al crear la ruta', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.rutaForm.controls).forEach(key => {
      const control = this.rutaForm.get(key);
      control?.markAsTouched();
    });
  }

  volver(): void {
    this.router.navigate(['/rutas']);
  }
} 