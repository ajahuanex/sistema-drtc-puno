import { Component, inject, signal, computed, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { RutaService } from '../services/ruta.service';
import { LocalidadService } from '../services/localidad.service';
import { EmpresaService } from '../services/empresa.service';
import { ResolucionService } from '../services/resolucion.service';
import { Ruta, RutaCreate, RutaUpdate, EstadoRuta, TipoRuta, ValidacionRuta } from '../models/ruta.model';
import { Localidad } from '../models/localidad.model';
import { Empresa, EstadoEmpresa } from '../models/empresa.model';
import { Resolucion } from '../models/resolucion.model';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface RutaFormData {
  empresa?: Empresa;
  resolucion?: Resolucion;
  modoModal?: boolean;
}

@Component({
  selector: 'app-ruta-form-shared',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    <div class="content-section">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="60"></mat-spinner>
          <h3>CARGANDO...</h3>
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
                <span class="mode-text">CREAR MÚLTIPLES RUTAS</span>
              </label>
              <p class="mode-description">
                Activa esta opción para crear varias rutas para la misma empresa y resolución
              </p>
            </div>

            <!-- Selección de Empresa y Resolución (solo en modo múltiples rutas) -->
            @if (modoMultiplesRutas()) {
              <div class="selection-section">
                <h3>EMPRESA Y RESOLUCIÓN</h3>
                <div class="form-grid">
                  <!-- Empresa -->
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>EMPRESA</mat-label>
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
                            <span class="empresa-ruc">{{ empresa.ruc }}</span>
                            <span class="empresa-razon">{{ empresa.razonSocial.principal }}</span>
                          </div>
                        </mat-option>
                      }
                    </mat-autocomplete>
                    <mat-icon matSuffix>business</mat-icon>
                  </mat-form-field>

                  <!-- Resolución -->
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>RESOLUCIÓN</mat-label>
                    <input matInput 
                           [matAutocomplete]="resolucionAuto" 
                           [value]="resolucionSearchValue()" 
                           (input)="onResolucionSearchInput($event)"
                           placeholder="Buscar resolución por número"
                           required>
                    <mat-autocomplete #resolucionAuto="matAutocomplete" 
                                     [displayWith]="displayResolucion"
                                     (optionSelected)="onResolucionSelected($event)">
                      @for (resolucion of resolucionesFiltradas() | async; track resolucion.id) {
                        <mat-option [value]="resolucion">
                          <div class="resolucion-option">
                            <span class="resolucion-numero">{{ resolucion.nroResolucion }}</span>
                            <span class="resolucion-fecha">{{ resolucion.fechaEmision | date:'dd/MM/yyyy' }}</span>
                          </div>
                        </mat-option>
                      }
                    </mat-autocomplete>
                    <mat-icon matSuffix>description</mat-icon>
                  </mat-form-field>
                </div>
              </div>
            }

            <!-- Empresa y Resolución predefinidas (modo normal) -->
            @if (!modoMultiplesRutas() && empresaSeleccionada() && resolucionSeleccionada()) {
              <div class="selection-section">
                <h3>EMPRESA Y RESOLUCIÓN SELECCIONADAS</h3>
                <div class="form-grid">
                  <div class="info-card">
                    <h4>EMPRESA</h4>
                    <p><strong>RUC:</strong> {{ empresaSeleccionada()?.ruc }}</p>
                    <p><strong>RAZÓN SOCIAL:</strong> {{ empresaSeleccionada()?.razonSocial?.principal }}</p>
                  </div>
                  <div class="info-card">
                    <h4>RESOLUCIÓN</h4>
                    <p><strong>NÚMERO:</strong> {{ resolucionSeleccionada()?.nroResolucion }}</p>
                    <p><strong>FECHA:</strong> {{ resolucionSeleccionada()?.fechaEmision | date:'dd/MM/yyyy' }}</p>
                  </div>
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Formulario de Ruta -->
        <mat-card class="form-card">
          <mat-card-content>
            <form [formGroup]="rutaForm" (ngSubmit)="onSubmit()">
              <mat-stepper #stepper linear>
                <!-- Paso 1: Información Básica -->
                <mat-step [stepControl]="rutaForm" label="INFORMACIÓN BÁSICA">
                  <div class="step-content">
                    <div class="form-grid">
                      <mat-form-field appearance="outline" class="form-field">
                        <mat-label>NOMBRE DE LA RUTA</mat-label>
                        <input matInput formControlName="nombre" 
                               placeholder="Ej: Puno - Juliaca - Arequipa"
                               (blur)="onNombreBlur()"
                               required>
                        <mat-error *ngIf="rutaForm.get('nombre')?.hasError('required')">
                          El nombre de la ruta es requerido
                        </mat-error>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="form-field">
                        <mat-label>TIPO DE RUTA</mat-label>
                        <mat-select formControlName="tipo" required>
                          @for (tipo of tiposRuta; track tipo) {
                            <mat-option [value]="tipo.value">{{ tipo.label }}</mat-option>
                          }
                        </mat-select>
                        <mat-error *ngIf="rutaForm.get('tipo')?.hasError('required')">
                          El tipo de ruta es requerido
                        </mat-error>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="form-field">
                        <mat-label>DESCRIPCIÓN</mat-label>
                        <textarea matInput formControlName="descripcion" 
                                  placeholder="Descripción detallada de la ruta"
                                  rows="3"></textarea>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="form-field">
                        <mat-label>ESTADO</mat-label>
                        <mat-select formControlName="estado" required>
                          @for (estado of estadosRuta; track estado) {
                            <mat-option [value]="estado.value">{{ estado.label }}</mat-option>
                          }
                        </mat-select>
                        <mat-error *ngIf="rutaForm.get('estado')?.hasError('required')">
                          El estado es requerido
                        </mat-error>
                      </mat-form-field>
                    </div>
                  </div>
                  <div class="step-actions">
                    <button mat-button matStepperNext type="button" 
                            [disabled]="!rutaForm.get('nombre')?.valid || !rutaForm.get('tipo')?.valid || !rutaForm.get('estado')?.valid">
                      SIGUIENTE
                    </button>
                  </div>
                </mat-step>

                <!-- Paso 2: Localidades -->
                <mat-step [stepControl]="rutaForm" label="LOCALIDADES">
                  <div class="step-content">
                    <div class="localidades-section">
                      <h3>LOCALIDADES DE LA RUTA</h3>
                      <p class="section-description">
                        Agrega las localidades que conforman esta ruta en el orden correcto
                      </p>

                      <div class="localidades-list">
                        @for (localidad of localidadesSeleccionadas(); track localidad.id; let i = $index) {
                          <div class="localidad-item">
                            <div class="localidad-info">
                              <span class="localidad-orden">{{ i + 1 }}</span>
                              <span class="localidad-nombre">{{ localidad.nombre }}</span>
                              <span class="localidad-provincia">{{ localidad.provincia }}</span>
                            </div>
                            <button type="button" mat-icon-button color="warn" 
                                    (click)="removerLocalidad(i)" class="remove-button">
                              <mat-icon>remove_circle</mat-icon>
                            </button>
                          </div>
                        }
                      </div>

                      <div class="add-localidad-section">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>AGREGAR LOCALIDAD</mat-label>
                          <input matInput 
                                 [matAutocomplete]="localidadAuto" 
                                 [value]="localidadSearchValue()" 
                                 (input)="onLocalidadSearchInput($event)"
                                 placeholder="Buscar localidad por nombre o provincia"
                                 (keyup.enter)="agregarLocalidad()">
                          <mat-autocomplete #localidadAuto="matAutocomplete" 
                                           [displayWith]="displayLocalidad"
                                           (optionSelected)="onLocalidadSelected($event)">
                            @for (localidad of localidadesFiltradas() | async; track localidad.id) {
                              <mat-option [value]="localidad">
                                <div class="localidad-option">
                                  <span class="localidad-nombre">{{ localidad.nombre }}</span>
                                  <span class="localidad-provincia">{{ localidad.provincia }}</span>
                                </div>
                              </mat-option>
                            }
                          </mat-autocomplete>
                          <mat-icon matSuffix>location_on</mat-icon>
                        </mat-form-field>
                        <button type="button" mat-raised-button color="primary" 
                                (click)="agregarLocalidad()" 
                                [disabled]="!localidadSeleccionada()"
                                class="add-button">
                          <mat-icon>add</mat-icon>
                          AGREGAR
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="step-actions">
                    <button mat-button matStepperPrevious type="button">ANTERIOR</button>
                    <button mat-button matStepperNext type="button" 
                            [disabled]="localidadesSeleccionadas().length === 0">
                      SIGUIENTE
                    </button>
                  </div>
                </mat-step>

                <!-- Paso 3: Configuración -->
                <mat-step [stepControl]="rutaForm" label="CONFIGURACIÓN">
                  <div class="step-content">
                    <div class="form-grid">
                      <mat-form-field appearance="outline" class="form-field">
                        <mat-label>DISTANCIA TOTAL (KM)</mat-label>
                        <input matInput formControlName="distanciaTotal" 
                               type="number" 
                               placeholder="0.00"
                               (blur)="onDistanciaBlur()">
                        <mat-error *ngIf="rutaForm.get('distanciaTotal')?.hasError('min')">
                          La distancia debe ser mayor a 0
                        </mat-error>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="form-field">
                        <mat-label>TIEMPO ESTIMADO (HORAS)</mat-label>
                        <input matInput formControlName="tiempoEstimado" 
                               type="number" 
                               placeholder="0.00"
                               (blur)="onTiempoBlur()">
                        <mat-error *ngIf="rutaForm.get('tiempoEstimado')?.hasError('min')">
                          El tiempo debe ser mayor a 0
                        </mat-error>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="form-field">
                        <mat-label>FRECUENCIA</mat-label>
                        <input matInput formControlName="frecuencia" 
                               placeholder="Ej: Diaria, Semanal, Mensual">
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="form-field">
                        <mat-label>CAPACIDAD MÁXIMA</mat-label>
                        <input matInput formControlName="capacidadMaxima" 
                               type="number" 
                               placeholder="0"
                               (blur)="onCapacidadBlur()">
                        <mat-error *ngIf="rutaForm.get('capacidadMaxima')?.hasError('min')">
                          La capacidad debe ser mayor a 0
                        </mat-error>
                      </mat-form-field>
                    </div>

                    <div class="checkbox-section">
                      <mat-form-field appearance="outline" class="form-field">
                        <mat-label>OBSERVACIONES</mat-label>
                        <textarea matInput formControlName="observaciones" 
                                  placeholder="Observaciones adicionales sobre la ruta"
                                  rows="3"></textarea>
                      </mat-form-field>
                    </div>
                  </div>
                  <div class="step-actions">
                    <button mat-button matStepperPrevious type="button">ANTERIOR</button>
                    <button mat-raised-button color="primary" type="submit" 
                            [disabled]="!rutaForm.valid || isSubmitting()">
                      @if (isSubmitting()) {
                        <mat-spinner diameter="20"></mat-spinner>
                        GUARDANDO...
                      } @else {
                        {{ isEditing() ? 'ACTUALIZAR' : 'CREAR' }} RUTA
                      }
                    </button>
                  </div>
                </mat-step>
              </mat-stepper>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styleUrls: ['./ruta-form-shared.component.scss']
})
export class RutaFormSharedComponent {
  @Input() formData: RutaFormData = {};
  @Output() rutaCreada = new EventEmitter<Ruta>();
  @Output() rutaActualizada = new EventEmitter<Ruta>();
  @Output() cancelado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private rutaService = inject(RutaService);
  private localidadService = inject(LocalidadService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  private snackBar = inject(MatSnackBar);

  // Signals
  isLoading = signal(false);
  isSubmitting = signal(false);
  modoMultiplesRutas = signal(false);
  empresaSeleccionada = signal<Empresa | null>(null);
  resolucionSeleccionada = signal<Resolucion | null>(null);
  localidadesSeleccionadas = signal<Localidad[]>([]);
  empresasFiltradas = signal<Observable<Empresa[]>>(of([]));
  resolucionesFiltradas = signal<Observable<Resolucion[]>>(of([]));
  localidadesFiltradas = signal<Observable<Localidad[]>>(of([]));

  // Valores de búsqueda
  empresaSearchValue = signal('');
  resolucionSearchValue = signal('');
  localidadSearchValue = signal('');
  localidadSeleccionada = signal<Localidad | null>(null);

  // Formulario
  rutaForm!: FormGroup;

  // Opciones
  tiposRuta = [
    { value: 'INTERPROVINCIAL', label: 'INTERPROVINCIAL' },
    { value: 'INTERURBANA', label: 'INTERURBANA' },
    { value: 'URBANA', label: 'URBANA' },
    { value: 'NACIONAL', label: 'NACIONAL' },
    { value: 'INTERNACIONAL', label: 'INTERNACIONAL' }
  ];

  estadosRuta = [
    { value: 'ACTIVA', label: 'ACTIVA' },
    { value: 'INACTIVA', label: 'INACTIVA' },
    { value: 'SUSPENDIDA', label: 'SUSPENDIDA' },
    { value: 'EN_MANTENIMIENTO', label: 'EN MANTENIMIENTO' },
    { value: 'ARCHIVADA', label: 'ARCHIVADA' }
  ];

  ngOnInit() {
    this.inicializarFormulario();
    this.cargarDatosIniciales();
    this.configurarBúsquedas();
  }

  private inicializarFormulario() {
    this.rutaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['INTERPROVINCIAL', Validators.required],
      descripcion: [''],
      estado: ['ACTIVA', Validators.required],
      distanciaTotal: [0, [Validators.min(0)]],
      tiempoEstimado: [0, [Validators.min(0)]],
      frecuencia: [''],
      capacidadMaxima: [0, [Validators.min(0)]],
      observaciones: ['']
    });
  }

  private cargarDatosIniciales() {
    if (this.formData.empresa) {
      this.empresaSeleccionada.set(this.formData.empresa);
    }
    if (this.formData.resolucion) {
      this.resolucionSeleccionada.set(this.formData.resolucion);
    }
  }

  private configurarBúsquedas() {
    // Configurar búsqueda de empresas
    this.empresasFiltradas.set(
      this.empresaService.getEmpresas().pipe(
        map(empresas => empresas.filter(e => e.estado === EstadoEmpresa.AUTORIZADA)),
        startWith([])
      )
    );

    // Configurar búsqueda de resoluciones
          this.resolucionesFiltradas.set(
        this.resolucionService.getResoluciones().pipe(
          startWith([])
        )
      );

    // Configurar búsqueda de localidades
    this.localidadesFiltradas.set(
      this.localidadService.getLocalidades().pipe(
        startWith([])
      )
    );
  }

  // Métodos de búsqueda
  onEmpresaSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.empresaSearchValue.set(value);
  }

  onResolucionSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.resolucionSearchValue.set(value);
  }

  onLocalidadSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.localidadSearchValue.set(value);
  }

  // Métodos de selección
  onEmpresaSelected(event: any) {
    this.empresaSeleccionada.set(event.option.value);
    this.empresaSearchValue.set(this.displayEmpresa(event.option.value));
  }

  onResolucionSelected(event: any) {
    this.resolucionSeleccionada.set(event.option.value);
    this.resolucionSearchValue.set(this.displayResolucion(event.option.value));
  }

  onLocalidadSelected(event: any) {
    this.localidadSeleccionada.set(event.option.value);
    this.localidadSearchValue.set(this.displayLocalidad(event.option.value));
  }

  // Métodos de display
  displayEmpresa(empresa: Empresa): string {
    return empresa ? `${empresa.ruc} - ${empresa.razonSocial.principal}` : '';
  }

  displayResolucion(resolucion: Resolucion): string {
    if (!resolucion) return '';
    const fecha = new Date(resolucion.fechaEmision);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `${resolucion.nroResolucion} (${fechaFormateada})`;
  }

  displayLocalidad(localidad: Localidad): string {
    return localidad ? `${localidad.nombre} - ${localidad.provincia}` : '';
  }

  // Métodos de localidades
  agregarLocalidad() {
    const localidad = this.localidadSeleccionada();
    if (localidad && !this.localidadesSeleccionadas().find(l => l.id === localidad.id)) {
      this.localidadesSeleccionadas.update(localidades => [...localidades, localidad]);
      this.localidadSeleccionada.set(null);
      this.localidadSearchValue.set('');
    }
  }

  removerLocalidad(index: number) {
    this.localidadesSeleccionadas.update(localidades => 
      localidades.filter((_, i) => i !== index)
    );
  }

  // Toggle modo múltiples rutas
  toggleModoMultiplesRutas(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.modoMultiplesRutas.set(checked);
  }

  // Validaciones en blur
  onNombreBlur() {
    const nombre = this.rutaForm.get('nombre')?.value;
    if (nombre) {
      this.rutaForm.patchValue({ nombre: nombre.toUpperCase() });
    }
  }

  onDistanciaBlur() {
    const distancia = this.rutaForm.get('distanciaTotal')?.value;
    if (distancia && distancia < 0) {
      this.rutaForm.patchValue({ distanciaTotal: 0 });
    }
  }

  onTiempoBlur() {
    const tiempo = this.rutaForm.get('tiempoEstimado')?.value;
    if (tiempo && tiempo < 0) {
      this.rutaForm.patchValue({ tiempoEstimado: 0 });
    }
  }

  onCapacidadBlur() {
    const capacidad = this.rutaForm.get('capacidadMaxima')?.value;
    if (capacidad && capacidad < 0) {
      this.rutaForm.patchValue({ capacidadMaxima: 0 });
    }
  }

  // Métodos de edición
  isEditing(): boolean {
    return false; // Este componente solo se usa para crear
  }

  // Submit
  onSubmit() {
    if (this.rutaForm.valid && this.validarDatosRequeridos()) {
      this.isSubmitting.set(true);
      
      const rutaData: RutaCreate = {
        ...this.rutaForm.value,
        empresaId: this.empresaSeleccionada()?.id || 0,
        resolucionId: this.resolucionSeleccionada()?.id || 0,
        localidades: this.localidadesSeleccionadas().map(l => l.id)
      };

      this.rutaService.createRuta(rutaData).subscribe({
        next: (ruta: Ruta) => {
          this.isSubmitting.set(false);
          this.rutaCreada.emit(ruta);
          this.mostrarMensaje('Ruta creada exitosamente', 'success');
        },
        error: (error: any) => {
          this.isSubmitting.set(false);
          this.mostrarMensaje('Error al crear la ruta: ' + error.message, 'error');
        }
      });
    }
  }

  private validarDatosRequeridos(): boolean {
    if (!this.empresaSeleccionada()) {
      this.mostrarMensaje('Debe seleccionar una empresa', 'error');
      return false;
    }
    if (!this.resolucionSeleccionada()) {
      this.mostrarMensaje('Debe seleccionar una resolución', 'error');
      return false;
    }
    if (this.localidadesSeleccionadas().length === 0) {
      this.mostrarMensaje('Debe agregar al menos una localidad', 'error');
      return false;
    }
    return true;
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error') {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: tipo === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }
} 