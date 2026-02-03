import { Component, inject, signal, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RutaService } from '../services/ruta.service';
import { LocalidadService } from '../services/localidad.service';
import { Ruta, RutaCreate, RutaUpdate, TipoRuta, EstadoRuta } from '../models/ruta.model';
import { Localidad } from '../models/localidad.model';
import { Empresa } from '../models/empresa.model';
import { Resolucion } from '../models/resolucion.model';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

export interface RutaFormConfig {
  empresa?: Empresa;
  resolucion?: Resolucion;
  ruta?: Ruta; // Para edición
  modoSimple?: boolean; // true = solo campos básicos, false = todos los campos
  mostrarBotones?: boolean; // true = mostrar botones guardar/cancelar
}

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

      <!-- Campos básicos -->
      <div class="form-row">
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Código de Ruta *</mat-label>
          <input matInput 
                 formControlName="codigoRuta" 
                 placeholder="01"
                 maxlength="2"
                 [readonly]="isEditing()">
          <mat-hint>Código único de dos dígitos</mat-hint>
          <mat-error *ngIf="rutaForm.get('codigoRuta')?.hasError('required')">
            El código es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Tipo de Ruta *</mat-label>
          <mat-select formControlName="tipoRuta">
            @for (tipo of tiposRuta; track tipo.value) {
              <mat-option [value]="tipo.value">{{ tipo.label }}</mat-option>
            }
          </mat-select>
          <mat-error *ngIf="rutaForm.get('tipoRuta')?.hasError('required')">
            El tipo es obligatorio
          </mat-error>
        </mat-form-field>
      </div>

      <!-- Origen y Destino -->
      <div class="form-row">
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Origen *</mat-label>
          <input matInput 
                 formControlName="origen" 
                 [matAutocomplete]="origenAuto"
                 placeholder="Buscar localidad de origen">
          <mat-autocomplete #origenAuto="matAutocomplete" [displayWith]="displayLocalidad">
            @for (localidad of localidadesOrigenFiltradas | async; track localidad.id) {
              <mat-option [value]="localidad">
                <div class="localidad-option">
                  <span class="nombre">{{ localidad.nombre }}</span>
                  <small class="ubicacion">{{ localidad.departamento }}, {{ localidad.provincia }}</small>
                </div>
              </mat-option>
            }
          </mat-autocomplete>
          <mat-icon matSuffix>place</mat-icon>
          <mat-error *ngIf="rutaForm.get('origen')?.hasError('required')">
            El origen es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Destino *</mat-label>
          <input matInput 
                 formControlName="destino" 
                 [matAutocomplete]="destinoAuto"
                 placeholder="Buscar localidad de destino">
          <mat-autocomplete #destinoAuto="matAutocomplete" [displayWith]="displayLocalidad">
            @for (localidad of localidadesDestinoFiltradas | async; track localidad.id) {
              <mat-option [value]="localidad">
                <div class="localidad-option">
                  <span class="nombre">{{ localidad.nombre }}</span>
                  <small class="ubicacion">{{ localidad.departamento }}, {{ localidad.provincia }}</small>
                </div>
              </mat-option>
            }
          </mat-autocomplete>
          <mat-icon matSuffix>flag</mat-icon>
          <mat-error *ngIf="rutaForm.get('destino')?.hasError('required')">
            El destino es obligatorio
          </mat-error>
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
            <mat-label>Descripción/Itinerario</mat-label>
            <textarea matInput 
                      formControlName="descripcion" 
                      rows="2"
                      placeholder="Descripción del recorrido de la ruta"></textarea>
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
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
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

  // Signals
  isSubmitting = signal(false);

  // Formulario
  rutaForm!: FormGroup;

  // Autocomplete
  localidadesOrigenFiltradas!: Observable<Localidad[]>;
  localidadesDestinoFiltradas!: Observable<Localidad[]>;

  // Opciones
  tiposRuta = [
    { value: 'INTERPROVINCIAL', label: 'Interprovincial' },
    { value: 'INTERURBANA', label: 'Interurbana' },
    { value: 'URBANA', label: 'Urbana' },
    { value: 'RURAL', label: 'Rural' }
  ];

  estadosRuta = [
    { value: 'ACTIVA', label: 'Activa' },
    { value: 'INACTIVA', label: 'Inactiva' },
    { value: 'SUSPENDIDA', label: 'Suspendida' }
  ];

  ngOnInit() {
    this.inicializarFormulario();
    this.configurarAutocompletado();
    this.cargarDatosIniciales();
  }

  private inicializarFormulario() {
    this.rutaForm = this.fb.group({
      codigoRuta: ['', [Validators.required, Validators.pattern(/^\d{2}$/)]],
      tipoRuta: ['INTERPROVINCIAL', Validators.required],
      origen: ['', Validators.required],
      destino: ['', Validators.required],
      frecuencias: [''],
      estado: ['ACTIVA'],
      descripcion: [''],
      observaciones: ['']
    });

    // Agregar validación de frecuencias si no es modo simple
    if (!this.config.modoSimple) {
      this.rutaForm.get('frecuencias')?.setValidators([Validators.required]);
    }
  }

  private configurarAutocompletado() {
    // Configurar autocomplete para origen
    this.localidadesOrigenFiltradas = this.rutaForm.get('origen')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.localidadService.buscarLocalidades(value, 10);
        }
        return of([]);
      })
    );

    // Configurar autocomplete para destino
    this.localidadesDestinoFiltradas = this.rutaForm.get('destino')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.localidadService.buscarLocalidades(value, 10);
        }
        return of([]);
      })
    );
  }

  private cargarDatosIniciales() {
    // Si es edición, cargar datos de la ruta
    if (this.config.ruta) {
      this.rutaForm.patchValue({
        codigoRuta: this.config.ruta.codigoRuta,
        tipoRuta: this.config.ruta.tipoRuta,
        origen: this.config.ruta.origen,
        destino: this.config.ruta.destino,
        frecuencias: this.config.ruta.frecuencias,
        estado: this.config.ruta.estado,
        descripcion: this.config.ruta.descripcion,
        observaciones: this.config.ruta.observaciones
      });
    } else if (this.config.resolucion) {
      // Si hay resolución, generar código automático
      this.generarCodigoAutomatico();
    }
  }

  private async generarCodigoAutomatico() {
    if (!this.config.resolucion) return;

    try {
      const codigo = await this.rutaService.getSiguienteCodigoDisponible(this.config.resolucion.id).toPromise();
      this.rutaForm.patchValue({ codigoRuta: codigo });
    } catch (error) {
      console.error('Error generando código automático:', error);
    }
  }

  displayLocalidad(localidad: Localidad): string {
    return localidad ? localidad.nombre : '';
  }

  isEditing(): boolean {
    return !!this.config.ruta;
  }

  onSubmit() {
    if (this.rutaForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    if (!this.config.empresa || !this.config.resolucion) {
      this.snackBar.open('Faltan datos de empresa o resolución', 'Cerrar', { duration: 3000 });
      return;
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
    
    const rutaData: RutaCreate = {
      codigoRuta: formValue.codigoRuta,
      nombre: `${this.getLocalidadNombre(formValue.origen)} - ${this.getLocalidadNombre(formValue.destino)}`,
      origen: this.prepararLocalidadData(formValue.origen),
      destino: this.prepararLocalidadData(formValue.destino),
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
      itinerario: []
    };

    try {
      const ruta = await this.rutaService.createRuta(rutaData).toPromise();
      this.snackBar.open('Ruta creada exitosamente', 'Cerrar', { duration: 3000 });
      this.rutaCreada.emit(ruta!);
    } catch (error: any) {
      console.error('Error creando ruta:', error);
      this.snackBar.open('Error al crear la ruta', 'Cerrar', { duration: 3000 });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async actualizarRuta() {
    const formValue = this.rutaForm.value;
    
    const rutaUpdate: RutaUpdate = {
      nombre: `${this.getLocalidadNombre(formValue.origen)} - ${this.getLocalidadNombre(formValue.destino)}`,
      tipoRuta: formValue.tipoRuta,
      frecuencias: formValue.frecuencias,
      descripcion: formValue.descripcion,
      observaciones: formValue.observaciones
    };

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
}