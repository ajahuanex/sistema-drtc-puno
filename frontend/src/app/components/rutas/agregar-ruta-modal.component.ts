import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ruta, TipoRuta, RutaCreate, RutaUpdate } from '../../models/ruta.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { RutaService } from '../../services/ruta.service';
import { Subscription } from 'rxjs';

export interface AgregarRutaData {
  empresa: Empresa;
  resolucion: Resolucion;
  ruta?: Ruta; // Ruta existente para edición
  modo?: 'creacion' | 'edicion' | 'edicion_codigo'; // Modo del modal
}

@Component({
  selector: 'app-agregar-ruta-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-container">
      <mat-card class="modal-card">
        <mat-card-header>
          <mat-card-title>
            @if (data.modo === 'edicion_codigo') {
              Editar Código de Ruta
            } @else if (data.modo === 'edicion') {
              Editar Ruta
            } @else {
              Agregar Nueva Ruta
            }
          </mat-card-title>
          <mat-card-subtitle>
            Empresa: {{ data.empresa.ruc }} - {{ data.empresa.razonSocial?.principal || 'Sin razón social' }}
          </mat-card-subtitle>
          <mat-card-subtitle>
            Resolución: {{ data.resolucion.nroResolucion }} - {{ data.resolucion.tipoTramite }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="rutaForm" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Código de Ruta *</mat-label>
                <div class="codigo-ruta-container">
                  <input matInput 
                         formControlName="codigoRuta" 
                         placeholder="Ej: 01, 02, 03..."
                         required>
                  <button mat-icon-button 
                          type="button" 
                          (click)="regenerarCodigoRuta()"
                          matTooltip="Regenerar código de ruta"
                          [disabled]="this.data.resolucion.id === 'general' || data.modo === 'edicion_codigo'">
                    <mat-icon>refresh</mat-icon>
                  </button>
                </div>
                <mat-hint>Código único de dos dígitos (01, 02, 03...) por resolución</mat-hint>
                <mat-error *ngIf="rutaForm.get('codigoRuta')?.hasError('required')">
                  El código de ruta es obligatorio
                </mat-error>
                <mat-error *ngIf="rutaForm.get('codigoRuta')?.hasError('codigoDuplicado')">
                  Ya existe una ruta con este código en la resolución
                </mat-error>
              </mat-form-field>

              @if (data.modo !== 'edicion_codigo') {
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Origen *</mat-label>
                  <input matInput 
                         formControlName="origen" 
                         placeholder="Ej: Puno"
                         required>
                  <mat-error *ngIf="rutaForm.get('origen')?.hasError('required')">
                    El origen es obligatorio
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Destino *</mat-label>
                  <input matInput 
                         formControlName="destino" 
                         placeholder="Ej: Juliaca"
                         required>
                  <mat-error *ngIf="rutaForm.get('destino')?.hasError('required')">
                    El destino es obligatorio
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Frecuencias *</mat-label>
                  <input matInput 
                         formControlName="frecuencias" 
                         placeholder="Ej: Diaria, Lunes a Viernes"
                         required>
                  <mat-error *ngIf="rutaForm.get('frecuencias')?.hasError('required')">
                    Las frecuencias son obligatorias
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Tipo de Ruta</mat-label>
                  <mat-select formControlName="tipoRuta">
                    <mat-option value="INTERPROVINCIAL">Interprovincial</mat-option>
                    <mat-option value="INTERURBANA">Interurbana</mat-option>
                    <mat-option value="URBANA">Urbana</mat-option>
                    <mat-option value="RURAL">Rural</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Itinerario</mat-label>
                  <textarea matInput 
                            formControlName="itinerario" 
                            placeholder="Describa el itinerario de la ruta (localidades intermedias, paradas, etc.)"
                            rows="3"
                            class="itinerario-field"></textarea>
                  <mat-hint>Detalle las paradas y localidades intermedias de la ruta</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Observaciones</mat-label>
                  <textarea matInput 
                            formControlName="observaciones" 
                            placeholder="Observaciones adicionales..."
                            rows="3"></textarea>
                </mat-form-field>
              }
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions class="modal-actions">
          <button mat-button (click)="onCancel()">
            <mat-icon>close</mat-icon>
            Cancelar
          </button>
          <button mat-raised-button 
                  (click)="onSubmit()"
                  color="primary" 
                  [disabled]="rutaForm.invalid || isSubmitting"
                  class="submit-button">
            <mat-icon *ngIf="!isSubmitting">
              @if (data.modo === 'edicion_codigo') {
                edit_note
              } @else if (data.modo === 'edicion') {
                update
              } @else {
                save
              }
            </mat-icon>
            <mat-spinner *ngIf="isSubmitting" diameter="20"></mat-spinner>
            {{ isSubmitting ? 'Guardando...' : 
               (data.modo === 'edicion_codigo' ? 'Actualizar Código' : 
                data.modo === 'edicion' ? 'Actualizar Ruta' : 'Guardar Ruta') }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styleUrls: ['./agregar-ruta-modal.component.scss']
})
export class AgregarRutaModalComponent implements OnDestroy {
  public data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AgregarRutaModalComponent>);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private rutaService = inject(RutaService);

  rutaForm: FormGroup;
  isSubmitting = false;
  private subscriptions: Subscription[] = [];

  constructor() {
    this.rutaForm = this.fb.group({
      codigoRuta: ['', [Validators.required]],
      origen: ['', [Validators.required]],
      destino: ['', [Validators.required]],
      frecuencias: ['', [Validators.required]],
      tipoRuta: ['INTERPROVINCIAL'],
      tipoServicio: ['PASAJEROS'], // Campo requerido por el backend
      itinerario: [''],
      observaciones: ['']
    });

    // Generar código de ruta automáticamente
    this.generarCodigoRutaAutomatico();

    // Agregar validación en tiempo real del código de ruta
    this.configurarValidacionCodigoUnico();
  }

  ngOnInit(): void {
    // console.log removed for production
    // console.log removed for production
    
    // Configurar validación en tiempo real
    this.configurarValidacionCodigoUnico();
    
    // Si es modo edición de código, cargar solo el código
    if (this.data.modo === 'edicion_codigo' && this.data.ruta) {
      // console.log removed for production
      
      // Validar que estemos en una resolución válida
      if (!this.data.resolucion || this.data.resolucion.id === 'general') {
        console.error('❌ NO SE PUEDE EDITAR CÓDIGO EN RESOLUCIÓN GENERAL');
        this.snackBar.open('No se puede editar códigos en resolución general', 'Cerrar', { duration: 3000 });
        this.dialogRef.close();
        return;
      }
      
      this.cargarSoloCodigoRuta();
    }
    // Si es modo edición, cargar datos existentes
    else if (this.data.modo === 'edicion' && this.data.ruta) {
      // console.log removed for production
      this.cargarDatosRutaExistente();
    }
    // Si es modo creación y tenemos empresa y resolución seleccionadas, generar código automáticamente
    else if (this.data.modo === 'creacion' && this.data.empresa && this.data.resolucion) {
      this.generarCodigoRutaAutomatico();
    }
  }

  private cargarDatosRutaExistente(): void {
    if (this.data.ruta) {
      this.rutaForm.patchValue({
        codigoRuta: this.data.ruta.codigoRuta,
        origen: this.data.ruta.origen,
        destino: this.data.ruta.destino,
        frecuencias: this.data.ruta.frecuencias,
        itinerario: this.data.ruta.descripcion || '',
        observaciones: this.data.ruta.observaciones,
        tipoRuta: this.data.ruta.tipoRuta
      });
      
      // En modo edición, deshabilitar la regeneración automática de código
      this.deshabilitarRegeneracionAutomatica();
      
      // console.log removed for production
    }
  }

  private cargarSoloCodigoRuta(): void {
    if (this.data.ruta) {
      this.rutaForm.patchValue({
        codigoRuta: this.data.ruta.codigoRuta
      });
      
      // En modo edición de código, deshabilitar la regeneración automática
      this.deshabilitarRegeneracionAutomatica();
      
      // console.log removed for production
    }
  }

  private deshabilitarRegeneracionAutomatica(): void {
    // Remover los listeners de cambios en origen y destino para evitar regeneración automática
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  private generarCodigoRutaAutomatico(): void {
    // Generar código inicial basado en la resolución
    if (this.data.resolucion && this.data.resolucion.id !== 'general') {
      // console.log removed for production
      
      this.rutaService.getSiguienteCodigoDisponible(
        this.data.resolucion.id
      ).subscribe({
        next: (codigo) => {
          // console.log removed for production
          this.rutaForm.patchValue({ codigoRuta: codigo });
          this.snackBar.open(`Código generado automáticamente: ${codigo}`, 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('❌ ERROR AL GENERAR CÓDIGO::', error);
          this.snackBar.open('Error al generar código automático', 'Cerrar', { duration: 3000 });
        }
      });
    }

    // Escuchar cambios en origen y destino para regenerar código
    const origenControl = this.rutaForm.get('origen');
    const destinoControl = this.rutaForm.get('destino');
    
    if (origenControl?.valueChanges) {
      const origenSub = origenControl.valueChanges.subscribe(origen => {
        if (origen && this.rutaForm.get('destino')?.value) {
          this.regenerarCodigoRuta();
        }
      });
      this.subscriptions.push(origenSub);
    }

    if (destinoControl?.valueChanges) {
      const destinoSub = destinoControl.valueChanges.subscribe(destino => {
        if (destino && this.rutaForm.get('origen')?.value) {
          this.regenerarCodigoRuta();
        }
      });
      this.subscriptions.push(destinoSub);
    }
  }

  public regenerarCodigoRuta(): void {
    if (this.data.resolucion && this.data.resolucion.id !== 'general') {
      // console.log removed for production
      
      this.rutaService.getSiguienteCodigoDisponible(
        this.data.resolucion.id
      ).subscribe({
        next: (codigo) => {
          // console.log removed for production
          this.rutaForm.patchValue({ codigoRuta: codigo });
          this.snackBar.open(`Nuevo código generado: ${codigo}`, 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('❌ ERROR AL REGENERAR CÓDIGO::', error);
          this.snackBar.open('Error al regenerar código', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  onSubmit(): void {
    // console.log removed for production
    // console.log removed for production

    if (this.rutaForm.invalid) {
      console.error('❌ FORMULARIO INVÁLIDO');
      Object.keys(this.rutaForm.controls).forEach(key => {
        const control = this.rutaForm.get(key);
        if (control?.invalid) {
          console.error(`  - Campo ${key}:`, control.errors);
        }
      });
      this.snackBar.open('Por favor complete todos los campos obligatorios', 'Cerrar', { duration: 3000 });
      return;
    }

    const codigoRuta = this.rutaForm.get('codigoRuta')?.value;
    const resolucionId = this.data.resolucion?.id;
    
    if (!resolucionId) {
      console.error('❌ NO HAY RESOLUCIÓN SELECCIONADA');
      this.snackBar.open('Debe seleccionar una resolución', 'Cerrar', { duration: 3000 });
      return;
    }
    
    // console.log removed for production
    
    // Deshabilitar el botón durante la validación
    this.isSubmitting = true;
    
    // Validar que el código de ruta sea único dentro de la resolución
    this.rutaService.validarCodigoRutaUnico(
      resolucionId,
      codigoRuta
    ).subscribe({
      next: (esUnico) => {
        // console.log removed for production
        
        if (!esUnico) {
          console.error('❌ CÓDIGO DUPLICADO DETECTADO::', {
            codigoRuta,
            resolucionId
          });
          this.snackBar.open('El código de ruta ya existe en esta resolución. Debe ser único.', 'Cerrar', { duration: 5000 });
          
          // Regenerar código automáticamente
          this.regenerarCodigoRuta();
          this.isSubmitting = false; // Rehabilitar el botón
          return;
        }

        // console.log removed for production
        this.guardarRuta();
      },
      error: (error) => {
        console.error('❌ ERROR EN VALIDACIÓN::', error);
        this.snackBar.open('Error al validar el código de ruta', 'Cerrar', { duration: 3000 });
        this.isSubmitting = false; // Rehabilitar el botón
      }
    });
  }

  private guardarRuta(): void {
    this.isSubmitting = true;

    if (this.data.modo === 'edicion_codigo' && this.data.ruta) {
      // Modo edición de código: actualizar solo el código
      const rutaActualizada: RutaUpdate = {
        codigoRuta: this.rutaForm.get('codigoRuta')?.value,
        fechaActualizacion: new Date()
      };

      console.log('✏️ ACTUALIZANDO SOLO EL CÓDIGO DE RUTA:', JSON.stringify(rutaActualizada, null, 2));

      this.rutaService.updateRuta(this.data.ruta.id, rutaActualizada).subscribe({
        next: (rutaActualizada) => {
          // console.log removed for production
          this.snackBar.open('Código de ruta actualizado exitosamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(rutaActualizada);
        },
        error: (error) => {
          console.error('❌ ERROR AL ACTUALIZAR CÓDIGO DE RUTA::', error);
          this.snackBar.open('Error al actualizar el código de la ruta', 'Cerrar', { duration: 3000 });
          this.isSubmitting = false;
        }
      });
    } else if (this.data.modo === 'edicion' && this.data.ruta) {
      // Modo edición: actualizar ruta existente
      const formValue = this.rutaForm.value;
      const rutaActualizada: RutaUpdate = {
        codigoRuta: formValue.codigoRuta,
        origen: formValue.origen,
        destino: formValue.destino,
        frecuencias: formValue.frecuencias,
        tipoRuta: formValue.tipoRuta,
        tipoServicio: formValue.tipoServicio,
        descripcion: formValue.itinerario,
        observaciones: formValue.observaciones,
        fechaActualizacion: new Date()
      };

      console.log('✏️ ACTUALIZANDO RUTA EXISTENTE:', JSON.stringify(rutaActualizada, null, 2));

      this.rutaService.updateRuta(this.data.ruta.id, rutaActualizada).subscribe({
        next: (rutaActualizada) => {
          // console.log removed for production
          this.snackBar.open('Ruta actualizada exitosamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(rutaActualizada);
        },
        error: (error) => {
          console.error('❌ ERROR AL ACTUALIZAR RUTA::', error);
          this.snackBar.open('Error al actualizar la ruta', 'Cerrar', { duration: 3000 });
          this.isSubmitting = false;
        }
      });
    } else {
      // Modo creación: crear nueva ruta usando el backend
      const formValue = this.rutaForm.value;
      
      // console.log removed for production
      
      // Mapear nombres de ciudades a IDs de localidades
      const mapeoLocalidades: { [key: string]: string } = {
        'Puno': 'PUNO_001',
        'Juliaca': 'JULIACA_001',
        'Cusco': 'CUSCO_001',
        'Arequipa': 'AREQUIPA_001'
      };
      
      const origenId = mapeoLocalidades[formValue.origen] || 'PUNO_001';
      const destinoId = mapeoLocalidades[formValue.destino] || 'JULIACA_001';
      
      const nuevaRuta: RutaCreate = {
        codigoRuta: formValue.codigoRuta,
        nombre: `${formValue.origen} - ${formValue.destino}`,
        origen: {
          id: origenId,
          nombre: formValue.origen
        },
        destino: {
          id: destinoId,
          nombre: formValue.destino
        },
        itinerario: [],
        empresa: { id: this.data.empresa.id, ruc: this.data.empresa.ruc, razonSocial: this.data.empresa.razonSocial.principal },
        resolucion: {
          id: this.data.resolucion?.id || '',
          nroResolucion: this.data.resolucion?.nroResolucion || '',
          tipoResolucion: this.data.resolucion?.tipoResolucion || 'PADRE',
          estado: this.data.resolucion?.estado || 'VIGENTE'
        },
        frecuencias: formValue.frecuencias,
        tipoRuta: formValue.tipoRuta,
        tipoServicio: formValue.tipoServicio || 'PASAJEROS',
        observaciones: formValue.observaciones || ''
      };

      console.log('💾 GUARDANDO NUEVA RUTA:', JSON.stringify(nuevaRuta, null, 2));

      // Usar el método createRuta del servicio que hace petición HTTP al backend
      this.rutaService.createRuta(nuevaRuta).subscribe({
        next: (rutaGuardada) => {
          // console.log removed for production
          this.snackBar.open('Ruta guardada exitosamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(rutaGuardada);
        },
        error: (error) => {
          console.error('❌ ERROR AL GUARDAR RUTA::', error);
          this.snackBar.open('Error al guardar la ruta', 'Cerrar', { duration: 3000 });
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private configurarValidacionCodigoUnico(): void {
    // Escuchar cambios en el código de ruta para validar unicidad
    const codigoControl = this.rutaForm.get('codigoRuta');
    if (codigoControl?.valueChanges) {
      const codigoSub = codigoControl.valueChanges.subscribe(codigo => {
        if (codigo && this.data.resolucion.id !== 'general') {
          this.validarCodigoUnicoEnTiempoReal(codigo);
        }
      });
      this.subscriptions.push(codigoSub);
    }
  }

  private validarCodigoUnicoEnTiempoReal(codigo: string): void {
    if (this.data.resolucion.id === 'general') return;

    this.rutaService.validarCodigoRutaUnico(
      this.data.resolucion.id,
      codigo
    ).subscribe(esUnico => {
      const codigoControl = this.rutaForm.get('codigoRuta');
      if (!esUnico) {
        codigoControl?.setErrors({ codigoDuplicado: true });
        // console.log removed for production
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

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
} 