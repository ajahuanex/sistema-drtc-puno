import { Component, inject, signal, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { RutaService } from '../services/ruta.service';
import { LocalidadService } from '../services/localidad.service';
import { Ruta, RutaCreate, RutaUpdate, TipoRuta, EstadoRuta } from '../models/ruta.model';
import { Localidad } from '../models/localidad.model';
import { Empresa } from '../models/empresa.model';
import { Resolucion } from '../models/resolucion.model';
import { Observable, of, Subject, from } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { BuscarLocalidadDialogComponent } from './buscar-localidad-dialog.component';

export interface RutaFormConfig {
  empresa?: Empresa;
  resolucion?: Resolucion;
  ruta?: Ruta; // Para edición
  rutasExistentes?: Ruta[]; // Rutas existentes de la resolución
  modoSimple?: boolean; // true = solo campos básicos, false = todos los campos
  mostrarBotones?: boolean; // true = mostrar botones guardar/cancelar
}

@Component({
  selector: 'app-ruta-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  template: `
    <form [formGroup]="rutaForm" (ngSubmit)="onSubmit()" class="ruta-form">
      
      <!-- Información de contexto (empresa/resolución) -->
      @if (config.empresa || config.resolucion) {
        <div class="context-info">
          @if (config.empresa) {
            <div class="info-item">
              <mat-icon>business</mat-icon>
              <span>{{ config.empresa.ruc }} - {{ config.empresa.razonSocial?.principal }}</span>
            </div>
          }
          @if (config.resolucion) {
            <div class="info-item">
              <mat-icon>description</mat-icon>
              <span>{{ config.resolucion.nroResolucion }}</span>
            </div>
          }
        </div>
      }

      <!-- Rutas existentes de la resolución -->
      @if (config.rutasExistentes && config.rutasExistentes.length > 0 && !isEditing()) {
        <div class="rutas-existentes">
          <div class="rutas-header">
            <mat-icon>list</mat-icon>
            <h4>Rutas existentes en esta resolución ({{ config.rutasExistentes.length }})</h4>
          </div>
          <div class="rutas-lista">
            @for (ruta of config.rutasExistentes; track ruta.id) {
              <div class="ruta-item">
                <span class="ruta-codigo">{{ ruta.codigoRuta }}</span>
                <span class="ruta-nombre">{{ getRutaNombre(ruta) }}</span>
                @if (getItinerario(ruta)) {
                  <span class="ruta-itinerario">{{ getItinerario(ruta) }}</span>
                }
              </div>
            }
          </div>
          <div class="rutas-hint">
            <mat-icon>info</mat-icon>
            <span>El próximo código correlativo sugerido es: <strong>{{ getSiguienteCorrelativo() }}</strong></span>
          </div>
        </div>
      }

      <!-- Campos básicos -->
      <div class="form-row">
        <mat-form-field appearance="outline" class="form-field" 
                        [class.field-error]="rutaForm.get('codigoRuta')?.invalid && rutaForm.get('codigoRuta')?.touched">
          <mat-label>Código de Ruta *</mat-label>
          <input matInput 
                 formControlName="codigoRuta" 
                 placeholder="01"
                 maxlength="2"
                 [readonly]="isEditing()">
          <mat-hint>Código único de dos dígitos</mat-hint>
          <mat-error>{{ getCodigoError() }}</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Tipo Ruta</mat-label>
          <mat-select formControlName="tipoRuta">
            <mat-option [value]="null">Sin especificar</mat-option>
            @for (tipo of tiposRuta; track tipo.value) {
              <mat-option [value]="tipo.value">{{ tipo.label }}</mat-option>
            }
          </mat-select>
          <mat-hint>Opcional</mat-hint>
        </mat-form-field>
      </div>

      <!-- Origen y Destino -->
      <div class="form-row">
        <mat-form-field appearance="outline" class="form-field"
                        [class.field-error]="rutaForm.get('origenId')?.invalid && rutaForm.get('origenId')?.touched">
          <mat-label>Origen *</mat-label>
          <input matInput 
                 [value]="getOrigenNombre()"
                 readonly
                 placeholder="Click para buscar origen"
                 [class.has-value]="origenSeleccionado">
          <button matSuffix 
                  mat-icon-button 
                  type="button"
                  (click)="abrirBuscadorOrigen()">
            <mat-icon>search</mat-icon>
          </button>
          <mat-error>{{ getOrigenError() }}</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field"
                        [class.field-error]="rutaForm.get('destinoId')?.invalid && rutaForm.get('destinoId')?.touched">
          <mat-label>Destino *</mat-label>
          <input matInput 
                 [value]="getDestinoNombre()"
                 readonly
                 placeholder="Click para buscar destino"
                 [class.has-value]="destinoSeleccionado">
          <button matSuffix 
                  mat-icon-button 
                  type="button"
                  (click)="abrirBuscadorDestino()">
            <mat-icon>search</mat-icon>
          </button>
          <mat-error>{{ getDestinoError() }}</mat-error>
        </mat-form-field>
      </div>

      <!-- Campos adicionales (solo si no es modo simple) -->
      @if (!config.modoSimple) {
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Frecuencias *</mat-label>
            <input matInput 
                   formControlName="frecuencias" 
                   placeholder="Ej: Diaria, cada 30 minutos">
            <mat-error *ngIf="rutaForm.get('frecuencias')?.hasError('required')">
              Las frecuencias son obligatorias
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Estado</mat-label>
            <mat-select formControlName="estado">
              @for (estado of estadosRuta; track estado.value) {
                <mat-option [value]="estado.value">{{ estado.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field full-width">
            <mat-label>Observaciones</mat-label>
            <textarea matInput 
                      formControlName="observaciones" 
                      rows="2"
                      placeholder="Observaciones adicionales"></textarea>
          </mat-form-field>
        </div>

        <!-- Itinerario (Recorrido) -->
        <div class="itinerario-section">
          <div class="itinerario-header">
            <h4>
              <mat-icon>route</mat-icon>
              Itinerario (Recorrido)
            </h4>
            <button type="button" 
                    mat-stroked-button 
                    color="primary"
                    (click)="agregarLocalidadItinerario()">
              <mat-icon>add</mat-icon>
              Agregar Localidad
            </button>
          </div>

          @if (itinerario.length === 0) {
            <div class="itinerario-empty">
              <mat-icon>info</mat-icon>
              <p>No hay localidades en el itinerario. El recorrido será directo de origen a destino.</p>
            </div>
          } @else {
            <div class="itinerario-list">
              @for (item of itinerario; track item.orden) {
                <div class="itinerario-item">
                  <span class="orden-badge">{{ item.orden }}</span>
                  <span class="localidad-nombre">{{ item.nombre }}</span>
                  <div class="item-actions">
                    <button type="button" 
                            mat-icon-button 
                            (click)="moverLocalidadArriba(item.orden)"
                            [disabled]="item.orden === 1">
                      <mat-icon>arrow_upward</mat-icon>
                    </button>
                    <button type="button" 
                            mat-icon-button 
                            (click)="moverLocalidadAbajo(item.orden)"
                            [disabled]="item.orden === itinerario.length">
                      <mat-icon>arrow_downward</mat-icon>
                    </button>
                    <button type="button" 
                            mat-icon-button 
                            color="warn"
                            (click)="eliminarLocalidadItinerario(item.orden)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Botones (solo si está habilitado) -->
      @if (config.mostrarBotones) {
        <div class="form-actions">
          <button type="button" 
                  mat-button 
                  (click)="onCancel()">
            <mat-icon>cancel</mat-icon>
            Cancelar
          </button>
          
          <button type="submit" 
                  mat-raised-button 
                  color="primary"
                  [disabled]="rutaForm.invalid || isSubmitting()">
            @if (isSubmitting()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>{{ isEditing() ? 'save' : 'add' }}</mat-icon>
            }
            {{ isEditing() ? 'Actualizar' : 'Crear' }} Ruta
          </button>
        </div>
      }
    </form>
  `,
  styles: [`
    .ruta-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 800px;
    }

    .context-info {
      display: flex;
      gap: 24px;
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
    }

    .info-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    .search-wrapper {
      position: relative;
      flex: 1;
    }

    .buscador-inline {
      background: #f8f9fa;
      border: 2px solid #1976d2;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .buscador-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .buscador-header h4 {
      margin: 0;
      color: #1976d2;
      font-size: 16px;
    }

    .search-field {
      width: 100%;
      margin-bottom: 12px;
    }

    .resultados-lista {
      max-height: 300px;
      overflow-y: auto;
      background: white;
      border-radius: 4px;
    }

    .resultado-item {
      padding: 12px;
      cursor: pointer;
      border-bottom: 1px solid #eee;
      transition: background 0.2s;
    }

    .resultado-item:hover {
      background: #e3f2fd;
    }

    .resultado-item .nombre {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .resultado-item .ubicacion {
      font-size: 12px;
      color: #666;
    }

    .no-results, .hint {
      padding: 24px;
      text-align: center;
      color: #999;
      font-style: italic;
    }

    .hint {
      color: #666;
    }

    .select-search-box {
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      gap: 8px;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .select-search-box .search-input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 14px;
      outline: none;
    }

    .select-search-box .search-input:focus {
      border-color: #1976d2;
    }

    .select-search-box mat-icon {
      color: #666;
      font-size: 20px;
    }

    .no-results {
      color: #999;
      font-style: italic;
      padding: 16px;
      text-align: center;
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .form-field {
      flex: 1;
    }

    .form-field.full-width {
      width: 100%;
    }

    .field-error {
      animation: shake 0.3s;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    .has-value {
      font-weight: 500;
      color: #1976d2 !important;
    }

    mat-form-field.field-error ::ng-deep .mat-mdc-form-field-focus-overlay {
      background-color: rgba(244, 67, 54, 0.05);
    }

    mat-form-field.field-error ::ng-deep .mat-mdc-text-field-wrapper {
      border-color: #f44336;
    }

    .localidad-option {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .localidad-option .nombre {
      font-weight: 500;
      color: #333;
    }

    .localidad-option .ubicacion {
      color: #666;
      font-size: 12px;
    }

    .form-actions {
      position: sticky;
      bottom: 0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
      padding: 16px 0;
      background: white;
      border-top: 1px solid #e0e0e0;
      z-index: 1;
    }

    .rutas-existentes {
      background: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .rutas-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #1976d2;
    }

    .rutas-header h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    .rutas-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .rutas-lista {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
      background: white;
      border-radius: 4px;
      padding: 8px;
    }

    .ruta-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-radius: 4px;
      border-left: 3px solid #1976d2;
    }

    .ruta-codigo {
      font-weight: 700;
      color: #1976d2;
      font-size: 16px;
      min-width: 40px;
      flex-shrink: 0;
    }

    .ruta-nombre {
      color: #333;
      font-size: 14px;
      font-weight: 500;
      flex: 1;
      min-width: 0;
    }

    .ruta-itinerario {
      color: #757575;
      font-size: 11px;
      font-style: italic;
      flex: 1;
      text-align: right;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }

    .rutas-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px 12px;
      background: #fff3e0;
      border-radius: 4px;
      color: #f57c00;
      font-size: 13px;
    }

    .rutas-hint mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .rutas-hint strong {
      color: #e65100;
      font-size: 16px;
    }

    .itinerario-section {
      margin-top: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .itinerario-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .itinerario-header h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #212121;
    }

    .itinerario-header mat-icon {
      color: #1976d2;
    }

    .itinerario-empty {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: white;
      border-radius: 6px;
      border: 2px dashed #ccc;
      color: #666;
    }

    .itinerario-empty mat-icon {
      color: #999;
    }

    .itinerario-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .itinerario-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border-radius: 6px;
      border-left: 3px solid #1976d2;
    }

    .orden-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      background-color: #1976d2;
      color: white;
      border-radius: 50%;
      font-size: 14px;
      font-weight: 600;
    }

    .localidad-nombre {
      flex: 1;
      font-size: 14px;
      color: #212121;
      font-weight: 500;
    }

    .item-actions {
      display: flex;
      gap: 4px;
    }

    .agregar-localidad-form {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-top: 12px;
      padding: 12px;
      background: white;
      border-radius: 6px;
    }

    .agregar-localidad-form .form-field {
      flex: 1;
    }

    .crear-localidad-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      color: #1976d2;
      font-weight: 500;

      mat-icon {
        color: #4caf50;
      }
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }
      
      .context-info {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class RutaFormComponent implements OnInit {
  @Input() config: RutaFormConfig = {};
  @Output() rutaCreada = new EventEmitter<Ruta>();
  @Output() rutaActualizada = new EventEmitter<Ruta>();
  @Output() cancelado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private rutaService = inject(RutaService);
  private localidadService = inject(LocalidadService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Signals
  isSubmitting = signal(false);

  // Formulario
  rutaForm!: FormGroup;

  // Autocomplete
  localidadesOrigenFiltradas!: Observable<Localidad[]>;
  localidadesDestinoFiltradas!: Observable<Localidad[]>;
  localidadesItinerarioFiltradas!: Observable<Localidad[]>;

  // Búsqueda de localidades
  origenSeleccionado: Localidad | null = null;
  destinoSeleccionado: Localidad | null = null;

  // Itinerario
  itinerario: Array<{id: string, nombre: string, orden: number}> = [];

  // Opciones
  tiposRuta = [
    { value: 'URBANA', label: 'Urbana' },
    { value: 'INTERURBANA', label: 'Interurbana' },
    { value: 'INTERPROVINCIAL', label: 'Interprovincial' },
    { value: 'INTERREGIONAL', label: 'Interregional' },
    { value: 'RURAL', label: 'Rural' }
  ];

  estadosRuta = [
    { value: 'ACTIVA', label: 'Activa' },
    { value: 'INACTIVA', label: 'Inactiva' },
    { value: 'SUSPENDIDA', label: 'Suspendida' }
  ];

  ngOnInit() {
    console.log('🔍 Tipos de ruta disponibles:', this.tiposRuta);
    this.inicializarFormulario();
    this.cargarDatosIniciales();
  }

  private inicializarFormulario() {
    // Obtener el código sugerido si hay rutas existentes y no es edición
    const codigoSugerido = (!this.config.ruta && this.config.rutasExistentes) 
      ? this.getSiguienteCorrelativo() 
      : '';

    console.log('🔢 Código sugerido:', codigoSugerido);
    console.log('📋 Rutas existentes:', this.config.rutasExistentes?.length || 0);

    this.rutaForm = this.fb.group({
      codigoRuta: [codigoSugerido, [Validators.required, Validators.pattern(/^\d{2}$/)]],
      tipoRuta: ['INTERREGIONAL'],
      origenId: ['', Validators.required],
      destinoId: ['', Validators.required],
      frecuencias: [''],
      estado: ['ACTIVA'],
      descripcion: [''],
      observaciones: ['']
    });

    // Agregar validación de frecuencias si no es modo simple
    if (!this.config.modoSimple) {
      this.rutaForm.get('frecuencias')?.setValidators([Validators.required]);
    }

    // Validación en tiempo real del código duplicado
    this.rutaForm.get('codigoRuta')?.valueChanges.subscribe(codigo => {
      this.validarCodigoDuplicado(codigo);
    });

    // Validación de origen ≠ destino
    this.rutaForm.get('origenId')?.valueChanges.subscribe(() => {
      this.validarOrigenDestinoDiferentes();
    });
    this.rutaForm.get('destinoId')?.valueChanges.subscribe(() => {
      this.validarOrigenDestinoDiferentes();
    });
  }

  abrirBuscadorOrigen() {
    console.log('🔍 Abriendo buscador de origen...');
    const dialogRef = this.dialog.open(BuscarLocalidadDialogComponent, {
      width: '600px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((localidad: Localidad) => {
      console.log('✅ Localidad seleccionada:', localidad);
      if (localidad) {
        this.origenSeleccionado = localidad;
        this.rutaForm.patchValue({ origenId: localidad.id });
        this.rutaForm.get('origenId')?.markAsTouched();
        this.validarOrigenDestinoDiferentes();
      }
    });
  }

  cerrarBuscadorOrigen() {
    // Ya no se usa
  }

  seleccionarOrigenYCerrar(localidad: Localidad) {
    // Ya no se usa
  }

  abrirBuscadorDestino() {
    const dialogRef = this.dialog.open(BuscarLocalidadDialogComponent, {
      width: '600px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((localidad: Localidad) => {
      if (localidad) {
        this.destinoSeleccionado = localidad;
        this.rutaForm.patchValue({ destinoId: localidad.id });
        this.rutaForm.get('destinoId')?.markAsTouched();
        this.validarOrigenDestinoDiferentes();
      }
    });
  }

  cerrarBuscadorDestino() {
    // Ya no se usa
  }

  seleccionarDestinoYCerrar(localidad: Localidad) {
    // Ya no se usa
  }

  getOrigenNombre(): string {
    return this.origenSeleccionado?.nombre || '';
  }

  getDestinoNombre(): string {
    return this.destinoSeleccionado?.nombre || '';
  }

  private cargarDatosIniciales() {
    // Si es edición, cargar datos de la ruta
    if (this.config.ruta) {
      const origenId = typeof this.config.ruta.origen === 'object' ? this.config.ruta.origen.id : null;
      const destinoId = typeof this.config.ruta.destino === 'object' ? this.config.ruta.destino.id : null;

      this.rutaForm.patchValue({
        codigoRuta: this.config.ruta.codigoRuta,
        tipoRuta: this.config.ruta.tipoRuta,
        origenId: origenId,
        destinoId: destinoId,
        frecuencias: this.config.ruta.frecuencias,
        estado: this.config.ruta.estado,
        descripcion: this.config.ruta.descripcion,
        observaciones: this.config.ruta.observaciones
      });

      // Guardar localidades seleccionadas
      if (typeof this.config.ruta.origen === 'object') {
        this.origenSeleccionado = this.config.ruta.origen as any;
      }
      if (typeof this.config.ruta.destino === 'object') {
        this.destinoSeleccionado = this.config.ruta.destino as any;
      }

      // Cargar itinerario si existe
      if (this.config.ruta.itinerario && this.config.ruta.itinerario.length > 0) {
        this.itinerario = [...this.config.ruta.itinerario].sort((a, b) => a.orden - b.orden);
      }
    } else if (this.config.resolucion) {
      // El código ya se estableció en inicializarFormulario()
      console.log('✅ Código de ruta ya establecido:', this.rutaForm.value.codigoRuta);
    }
  }

  // ========== MÉTODOS DEL ITINERARIO ==========

  agregarLocalidadItinerario() {
    const dialogRef = this.dialog.open(BuscarLocalidadDialogComponent, {
      width: '600px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((localidad: Localidad) => {
      if (localidad) {
        // Verificar que no esté ya en el itinerario
        if (this.itinerario.some(item => item.id === localidad.id)) {
          this.snackBar.open('Esta localidad ya está en el itinerario', 'Cerrar', { duration: 3000 });
          return;
        }

        // Agregar al final del itinerario
        const nuevoOrden = this.itinerario.length + 1;
        this.itinerario.push({
          id: localidad.id,
          nombre: localidad.nombre,
          orden: nuevoOrden
        });

        console.log('📋 Itinerario actualizado:', this.itinerario);
      }
    });
  }

  onLocalidadSeleccionada(localidad: Localidad) {
    console.log('✅ Localidad seleccionada:', localidad);
    
    // Verificar que no esté ya en el itinerario
    if (this.itinerario.some(item => item.id === localidad.id)) {
      this.snackBar.open('Esta localidad ya está en el itinerario', 'Cerrar', { duration: 3000 });
      return;
    }

    // Agregar al final del itinerario
    const nuevoOrden = this.itinerario.length + 1;
    this.itinerario.push({
      id: localidad.id,
      nombre: localidad.nombre,
      orden: nuevoOrden
    });

    console.log('📋 Itinerario actualizado:', this.itinerario);
  }

  moverLocalidadArriba(orden: number) {
    if (orden === 1) return;

    const index = this.itinerario.findIndex(item => item.orden === orden);
    if (index > 0) {
      // Intercambiar con el anterior
      [this.itinerario[index - 1], this.itinerario[index]] = 
      [this.itinerario[index], this.itinerario[index - 1]];
      
      // Reordenar
      this.reordenarItinerario();
    }
  }

  moverLocalidadAbajo(orden: number) {
    if (orden === this.itinerario.length) return;

    const index = this.itinerario.findIndex(item => item.orden === orden);
    if (index < this.itinerario.length - 1) {
      // Intercambiar con el siguiente
      [this.itinerario[index], this.itinerario[index + 1]] = 
      [this.itinerario[index + 1], this.itinerario[index]];
      
      // Reordenar
      this.reordenarItinerario();
    }
  }

  eliminarLocalidadItinerario(orden: number) {
    this.itinerario = this.itinerario.filter(item => item.orden !== orden);
    this.reordenarItinerario();
  }

  private reordenarItinerario() {
    this.itinerario.forEach((item, index) => {
      item.orden = index + 1;
    });
  }

  displayLocalidad(localidad: Localidad): string {
    return localidad ? localidad.nombre : '';
  }

  isEditing(): boolean {
    return !!this.config.ruta;
  }

  onSubmit() {
    // Marcar todos los campos como tocados para mostrar errores
    this.marcarCamposComoTocados();

    if (this.rutaForm.invalid) {
      this.snackBar.open('Por favor, completa todos los campos requeridos correctamente', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.config.empresa || !this.config.resolucion) {
      this.snackBar.open('Faltan datos de empresa o resolución', 'Cerrar', { duration: 3000 });
      return;
    }

    // Validar origen ≠ destino
    if (this.origenSeleccionado?.id === this.destinoSeleccionado?.id) {
      this.snackBar.open('El origen y destino deben ser diferentes', 'Cerrar', { duration: 3000 });
      return;
    }

    // Validar que el código no esté duplicado (solo al crear, no al editar)
    if (!this.isEditing()) {
      const codigoIngresado = this.rutaForm.value.codigoRuta;
      const codigoDuplicado = this.config.rutasExistentes?.some(
        ruta => ruta.codigoRuta === codigoIngresado
      );

      if (codigoDuplicado) {
        this.snackBar.open(
          `El código ${codigoIngresado} ya existe en esta resolución. Por favor, usa otro código.`,
          'Cerrar',
          { duration: 5000 }
        );
        return;
      }
    }

    this.isSubmitting.set(true);

    if (this.isEditing()) {
      this.actualizarRuta();
    } else {
      this.crearRuta();
    }
  }

  private async crearRuta() {
    const formValue = this.rutaForm.value;
    
    if (!formValue.origenId || !formValue.destinoId) {
      this.snackBar.open('Debes seleccionar origen y destino', 'Cerrar', { duration: 3000 });
      this.isSubmitting.set(false);
      return;
    }

    // Usar las localidades ya seleccionadas en lugar de buscarlas de nuevo
    if (!this.origenSeleccionado || !this.destinoSeleccionado) {
      this.snackBar.open('Error: localidades no seleccionadas correctamente', 'Cerrar', { duration: 3000 });
      this.isSubmitting.set(false);
      return;
    }

    const origenLocalidad = this.origenSeleccionado;
    const destinoLocalidad = this.destinoSeleccionado;

    // Si el itinerario está vacío, agregar origen y destino
    let itinerarioFinal = this.itinerario;
    if (itinerarioFinal.length === 0) {
      itinerarioFinal = [
        { id: origenLocalidad.id, nombre: origenLocalidad.nombre, orden: 1 },
        { id: destinoLocalidad.id, nombre: destinoLocalidad.nombre, orden: 2 }
      ];
      console.log('📍 Itinerario generado automáticamente:', itinerarioFinal);
    }
    
    const rutaData: RutaCreate = {
      codigoRuta: formValue.codigoRuta,
      nombre: `${origenLocalidad.nombre} - ${destinoLocalidad.nombre}`,
      origen: {
        id: origenLocalidad.id,
        nombre: origenLocalidad.nombre
      },
      destino: {
        id: destinoLocalidad.id,
        nombre: destinoLocalidad.nombre
      },
      tipoRuta: formValue.tipoRuta,
      tipoServicio: 'PASAJEROS',
      frecuencias: formValue.frecuencias || 'Por definir',
      descripcion: formValue.descripcion,
      observaciones: formValue.observaciones,
      empresa: {
        id: this.config.empresa!.id,
        ruc: this.config.empresa!.ruc,
        razonSocial: this.config.empresa!.razonSocial?.principal || ''
      },
      resolucion: {
        id: this.config.resolucion!.id,
        nroResolucion: this.config.resolucion!.nroResolucion,
        tipoResolucion: this.config.resolucion!.tipoResolucion,
        estado: this.config.resolucion!.estado || 'VIGENTE'
      },
      itinerario: itinerarioFinal
    };

    try {
      console.log('📤 Enviando ruta al backend:', rutaData);
      const ruta = await this.rutaService.createRuta(rutaData).toPromise();
      console.log('✅ Ruta creada exitosamente:', ruta);
      this.snackBar.open('Ruta creada exitosamente', 'Cerrar', { duration: 3000 });
      this.rutaCreada.emit(ruta!);
    } catch (error: any) {
      console.error('❌ Error creando ruta:', error);
      
      // Extraer mensaje de error específico del backend
      let mensajeError = 'Error al crear la ruta';
      
      if (error?.error) {
        if (typeof error.error === 'string') {
          mensajeError = error.error;
        } else if (error.error.detail) {
          // FastAPI devuelve errores en el campo 'detail'
          if (Array.isArray(error.error.detail)) {
            // Errores de validación de Pydantic
            const errores = error.error.detail.map((e: any) => {
              const campo = e.loc?.join('.') || 'campo';
              return `${campo}: ${e.msg}`;
            }).join(', ');
            mensajeError = `Errores de validación: ${errores}`;
          } else {
            mensajeError = error.error.detail;
          }
        } else if (error.error.message) {
          mensajeError = error.error.message;
        }
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      console.error('📋 Mensaje de error procesado:', mensajeError);
      this.snackBar.open(mensajeError, 'Cerrar', { duration: 8000 });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async actualizarRuta() {
    const formValue = this.rutaForm.value;
    
    const rutaUpdate: RutaUpdate = {
      tipoRuta: formValue.tipoRuta,
      frecuencias: formValue.frecuencias,
      descripcion: formValue.descripcion,
      observaciones: formValue.observaciones
    };

    // Si se cambió el origen o destino, actualizar
    if (formValue.origenId || formValue.destinoId) {
      const todasLocalidades = await this.localidadService.getLocalidades().toPromise();
      
      if (formValue.origenId) {
        const origenLocalidad = todasLocalidades?.find(l => l.id === formValue.origenId);
        if (origenLocalidad) {
          rutaUpdate.origen = {
            id: origenLocalidad.id,
            nombre: origenLocalidad.nombre
          };
        }
      }

      if (formValue.destinoId) {
        const destinoLocalidad = todasLocalidades?.find(l => l.id === formValue.destinoId);
        if (destinoLocalidad) {
          rutaUpdate.destino = {
            id: destinoLocalidad.id,
            nombre: destinoLocalidad.nombre
          };
        }
      }

      // Actualizar nombre si cambiaron origen o destino
      if (rutaUpdate.origen && rutaUpdate.destino) {
        rutaUpdate.nombre = `${rutaUpdate.origen.nombre} - ${rutaUpdate.destino.nombre}`;
      }
    }

    try {
      const ruta = await this.rutaService.updateRuta(this.config.ruta!.id, rutaUpdate).toPromise();
      this.snackBar.open('Ruta actualizada exitosamente', 'Cerrar', { duration: 3000 });
      this.rutaActualizada.emit(ruta!);
    } catch (error: any) {
      console.error('Error actualizando ruta:', error);
      this.snackBar.open('Error al actualizar la ruta', 'Cerrar', { duration: 3000 });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private prepararLocalidadData(localidad: any) {
    if (typeof localidad === 'string') {
      return { id: '', nombre: localidad };
    }
    return { id: localidad.id || '', nombre: localidad.nombre || localidad };
  }

  private getLocalidadNombre(localidad: any): string {
    if (typeof localidad === 'string') {
      return localidad;
    }
    return localidad?.nombre || localidad || 'Sin nombre';
  }

  onCancel() {
    this.cancelado.emit();
  }

  private marcarCamposComoTocados() {
    Object.keys(this.rutaForm.controls).forEach(key => {
      const control = this.rutaForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // ========== MÉTODOS DE VALIDACIÓN ==========

  private validarCodigoDuplicado(codigo: string) {
    // Solo validar si no es edición y hay rutas existentes
    if (this.isEditing() || !this.config.rutasExistentes || !codigo) {
      return;
    }

    const codigoDuplicado = this.config.rutasExistentes.some(
      ruta => ruta.codigoRuta === codigo
    );

    const codigoControl = this.rutaForm.get('codigoRuta');
    if (codigoDuplicado) {
      codigoControl?.setErrors({ ...codigoControl.errors, duplicado: true });
    } else {
      // Limpiar error de duplicado si existe
      if (codigoControl?.hasError('duplicado')) {
        const errors = { ...codigoControl.errors };
        delete errors['duplicado'];
        codigoControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }
  }

  private validarOrigenDestinoDiferentes() {
    const origenId = this.rutaForm.get('origenId')?.value;
    const destinoId = this.rutaForm.get('destinoId')?.value;

    if (!origenId || !destinoId) {
      return;
    }

    if (origenId === destinoId) {
      this.rutaForm.get('destinoId')?.setErrors({ 
        ...this.rutaForm.get('destinoId')?.errors,
        mismaLocalidad: true 
      });
    } else {
      // Limpiar error de mismaLocalidad si existe
      const destinoControl = this.rutaForm.get('destinoId');
      if (destinoControl?.hasError('mismaLocalidad')) {
        const errors = { ...destinoControl.errors };
        delete errors['mismaLocalidad'];
        destinoControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }
  }

  getCodigoError(): string {
    const control = this.rutaForm.get('codigoRuta');
    if (control?.hasError('required')) {
      return 'El código es obligatorio';
    }
    if (control?.hasError('pattern')) {
      return 'El código debe ser de 2 dígitos numéricos';
    }
    if (control?.hasError('duplicado')) {
      return `El código ${control.value} ya existe en esta resolución`;
    }
    return '';
  }

  getOrigenError(): string {
    const control = this.rutaForm.get('origenId');
    if (control?.hasError('required') && control?.touched) {
      return 'El origen es obligatorio';
    }
    return '';
  }

  getDestinoError(): string {
    const control = this.rutaForm.get('destinoId');
    if (control?.hasError('required') && control?.touched) {
      return 'El destino es obligatorio';
    }
    if (control?.hasError('mismaLocalidad')) {
      return 'El destino debe ser diferente al origen';
    }
    return '';
  }

  getRutaNombre(ruta: Ruta): string {
    const origen = typeof ruta.origen === 'string' ? ruta.origen : ruta.origen?.nombre || 'Sin origen';
    const destino = typeof ruta.destino === 'string' ? ruta.destino : ruta.destino?.nombre || 'Sin destino';
    return `${origen} - ${destino}`;
  }

  getItinerario(ruta: Ruta): string {
    if (!ruta.itinerario || ruta.itinerario.length === 0) {
      return '';
    }

    // Ordenar por orden y extraer nombres
    const localidades = [...ruta.itinerario]
      .sort((a, b) => a.orden - b.orden)
      .map(loc => loc.nombre)
      .join(' → ');

    return localidades;
  }

  getSiguienteCorrelativo(): string {
    if (!this.config.rutasExistentes || this.config.rutasExistentes.length === 0) {
      return '01';
    }

    // Extraer los códigos numéricos y encontrar el máximo
    const codigos = this.config.rutasExistentes
      .map(r => parseInt(r.codigoRuta, 10))
      .filter(n => !isNaN(n));

    if (codigos.length === 0) {
      return '01';
    }

    const maxCodigo = Math.max(...codigos);
    const siguiente = maxCodigo + 1;
    
    // Formatear con ceros a la izquierda (2 dígitos)
    return siguiente.toString().padStart(2, '0');
  }
}
