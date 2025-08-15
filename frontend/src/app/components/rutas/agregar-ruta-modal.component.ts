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
import { Ruta, TipoRuta } from '../../models/ruta.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { RutaService } from '../../services/ruta.service';
import { RutaCreate } from '../../models/ruta.model';
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
                  type="submit" 
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
      observaciones: ['']
    });

    // Generar código de ruta automáticamente
    this.generarCodigoRutaAutomatico();

    // Agregar validación en tiempo real del código de ruta
    this.configurarValidacionCodigoUnico();
  }

  ngOnInit(): void {
    console.log('🚀 MODAL AGREGAR RUTA INICIALIZADO');
    console.log('📋 MODO DEL MODAL:', this.data.modo);
    
    // Configurar validación en tiempo real
    this.configurarValidacionCodigoUnico();
    
    // Si es modo edición de código, cargar solo el código
    if (this.data.modo === 'edicion_codigo' && this.data.ruta) {
      console.log('✏️ CARGANDO SOLO EL CÓDIGO DE RUTA EXISTENTE:', this.data.ruta.codigoRuta);
      
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
      console.log('✏️ CARGANDO DATOS DE RUTA EXISTENTE:', this.data.ruta);
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
        observaciones: this.data.ruta.observaciones,
        tipoRuta: this.data.ruta.tipoRuta
      });
      
      // En modo edición, deshabilitar la regeneración automática de código
      this.deshabilitarRegeneracionAutomatica();
      
      console.log('✅ DATOS DE RUTA EXISTENTE CARGADOS EN EL FORMULARIO');
    }
  }

  private cargarSoloCodigoRuta(): void {
    if (this.data.ruta) {
      this.rutaForm.patchValue({
        codigoRuta: this.data.ruta.codigoRuta
      });
      
      // En modo edición de código, deshabilitar la regeneración automática
      this.deshabilitarRegeneracionAutomatica();
      
      console.log('✅ SOLO EL CÓDIGO DE RUTA CARGADO EN EL FORMULARIO');
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
      console.log('🔧 GENERANDO CÓDIGO AUTOMÁTICO PARA RESOLUCIÓN:', this.data.resolucion.id);
      
      this.rutaService.getSiguienteCodigoDisponible(
        this.data.resolucion.id
      ).subscribe({
        next: (codigo) => {
          console.log('✅ CÓDIGO GENERADO AUTOMÁTICAMENTE:', {
            resolucionId: this.data.resolucion.id,
            codigoGenerado: codigo
          });
          this.rutaForm.patchValue({ codigoRuta: codigo });
          this.snackBar.open(`Código generado automáticamente: ${codigo}`, 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('❌ ERROR AL GENERAR CÓDIGO:', error);
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
      console.log('🔄 REGENERANDO CÓDIGO PARA RESOLUCIÓN:', this.data.resolucion.id);
      
      this.rutaService.getSiguienteCodigoDisponible(
        this.data.resolucion.id
      ).subscribe({
        next: (codigo) => {
          console.log('✅ CÓDIGO REGENERADO:', {
            resolucionId: this.data.resolucion.id,
            codigoGenerado: codigo
          });
          this.rutaForm.patchValue({ codigoRuta: codigo });
          this.snackBar.open(`Nuevo código generado: ${codigo}`, 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('❌ ERROR AL REGENERAR CÓDIGO:', error);
          this.snackBar.open('Error al regenerar código', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.rutaForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos obligatorios', 'Cerrar', { duration: 3000 });
      return;
    }

    const codigoRuta = this.rutaForm.get('codigoRuta')?.value;
    const resolucionId = this.data.resolucion?.id;
    
    if (!resolucionId) {
      this.snackBar.open('Debe seleccionar una resolución', 'Cerrar', { duration: 3000 });
      return;
    }
    
    console.log('🔍 VALIDANDO CÓDIGO DE RUTA:', {
      codigoRuta,
      resolucionId,
      empresaId: this.data.empresa?.id
    });
    
    // Validar que el código de ruta sea único dentro de la resolución
    this.rutaService.validarCodigoRutaUnico(
      resolucionId,
      codigoRuta
    ).subscribe(esUnico => {
      console.log('✅ RESULTADO VALIDACIÓN:', {
        codigoRuta,
        resolucionId,
        esUnico
      });
      
      if (!esUnico) {
        console.error('❌ CÓDIGO DUPLICADO DETECTADO:', {
          codigoRuta,
          resolucionId
        });
        this.snackBar.open('El código de ruta ya existe en esta resolución. Debe ser único.', 'Cerrar', { duration: 5000 });
        
        // Regenerar código automáticamente
        this.regenerarCodigoRuta();
        return;
      }

      console.log('✅ CÓDIGO VÁLIDO, PROCEDIENDO A GUARDAR');
      this.guardarRuta();
    });
  }

  private guardarRuta(): void {
    this.isSubmitting = true;

    if (this.data.modo === 'edicion_codigo' && this.data.ruta) {
      // Modo edición de código: actualizar solo el código
      const rutaActualizada: Partial<Ruta> = {
        codigoRuta: this.rutaForm.get('codigoRuta')?.value,
        fechaActualizacion: new Date()
      };

      console.log('✏️ ACTUALIZANDO SOLO EL CÓDIGO DE RUTA:', JSON.stringify(rutaActualizada, null, 2));

      this.rutaService.updateRuta(this.data.ruta.id, rutaActualizada).subscribe({
        next: (rutaActualizada) => {
          console.log('✅ CÓDIGO DE RUTA ACTUALIZADO EXITOSAMENTE:', rutaActualizada);
          this.snackBar.open('Código de ruta actualizado exitosamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(rutaActualizada);
        },
        error: (error) => {
          console.error('❌ ERROR AL ACTUALIZAR CÓDIGO DE RUTA:', error);
          this.snackBar.open('Error al actualizar el código de la ruta', 'Cerrar', { duration: 3000 });
          this.isSubmitting = false;
        }
      });
    } else if (this.data.modo === 'edicion' && this.data.ruta) {
      // Modo edición: actualizar ruta existente
      const rutaActualizada: Partial<Ruta> = {
        ...this.rutaForm.value,
        fechaActualizacion: new Date()
      };

      console.log('✏️ ACTUALIZANDO RUTA EXISTENTE:', JSON.stringify(rutaActualizada, null, 2));

      this.rutaService.updateRuta(this.data.ruta.id, rutaActualizada).subscribe({
        next: (rutaActualizada) => {
          console.log('✅ RUTA ACTUALIZADA EXITOSAMENTE:', rutaActualizada);
          this.snackBar.open('Ruta actualizada exitosamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(rutaActualizada);
        },
        error: (error) => {
          console.error('❌ ERROR AL ACTUALIZAR RUTA:', error);
          this.snackBar.open('Error al actualizar la ruta', 'Cerrar', { duration: 3000 });
          this.isSubmitting = false;
        }
      });
    } else {
      // Modo creación: crear nueva ruta
      const nuevaRuta: Partial<Ruta> = {
        ...this.rutaForm.value,
        empresaId: this.data.empresa?.id,
        resolucionId: this.data.resolucion?.id,
        estado: 'ACTIVA',
        estaActivo: true,
        fechaRegistro: new Date(),
        fechaActualizacion: new Date()
      };

      console.log('💾 GUARDANDO NUEVA RUTA:', JSON.stringify(nuevaRuta, null, 2));

      // Usar el servicio para agregar la ruta y actualizar la lista mock
      this.rutaService.agregarRutaMock(nuevaRuta as RutaCreate, this.data.resolucion!.id)
        .subscribe({
          next: (rutaGuardada) => {
            console.log('✅ RUTA GUARDADA EXITOSAMENTE:', rutaGuardada);
            this.snackBar.open('Ruta guardada exitosamente', 'Cerrar', { duration: 3000 });
            this.dialogRef.close(rutaGuardada);
          },
          error: (error) => {
            console.error('❌ ERROR AL GUARDAR RUTA:', error);
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
        console.log('⚠️ CÓDIGO DUPLICADO DETECTADO EN TIEMPO REAL:', codigo);
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