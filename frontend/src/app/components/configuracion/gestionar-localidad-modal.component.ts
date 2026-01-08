import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Localidad, LocalidadCreate, LocalidadUpdate, TipoLocalidad } from '../../models/localidad.model';
import { LocalidadService } from '../../services/localidad.service';

export interface GestionarLocalidadModalData {
  localidad?: Localidad;
  esEdicion: boolean;
}

@Component({
  selector: 'app-gestionar-localidad-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>{{ data.esEdicion ? 'edit_location' : 'add_location' }}</mat-icon>
        {{ data.esEdicion ? 'Editar Localidad' : 'Agregar Localidad' }}
      </h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      <form [formGroup]="localidadForm" class="localidad-form">
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Nombre de la Localidad</mat-label>
            <input matInput 
                   formControlName="nombre" 
                   placeholder="Ej: Puno, Juliaca, Lima"
                   maxlength="100">
            <mat-hint>Nombre completo de la localidad</mat-hint>
            @if (localidadForm.get('nombre')?.hasError('required') && localidadForm.get('nombre')?.touched) {
              <mat-error>El nombre es requerido</mat-error>
            }
            @if (localidadForm.get('nombre')?.hasError('minlength')) {
              <mat-error>El nombre debe tener al menos 2 caracteres</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Código</mat-label>
            <input matInput 
                   formControlName="codigo" 
                   placeholder="Ej: PUN001, JUL001"
                   maxlength="10"
                   style="text-transform: uppercase">
            <mat-hint>Código único de identificación (Ej: PUN001, ASD123)</mat-hint>
            @if (localidadForm.get('codigo')?.hasError('required') && localidadForm.get('codigo')?.touched) {
              <mat-error>El código es requerido</mat-error>
            }
            @if (localidadForm.get('codigo')?.hasError('pattern')) {
              <mat-error>Formato: 3 letras + 3-7 números (Ej: PUN001, ASD123)</mat-error>
            }
            @if (codigoExiste()) {
              <mat-error>Este código ya existe</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Tipo de Localidad</mat-label>
            <mat-select formControlName="tipo">
              <mat-option value="CIUDAD">Ciudad</mat-option>
              <mat-option value="PUEBLO">Pueblo</mat-option>
              <mat-option value="DISTRITO">Distrito</mat-option>
              <mat-option value="PROVINCIA">Provincia</mat-option>
              <mat-option value="DEPARTAMENTO">Departamento</mat-option>
              <mat-option value="CENTRO_POBLADO">Centro Poblado</mat-option>
            </mat-select>
            @if (localidadForm.get('tipo')?.hasError('required') && localidadForm.get('tipo')?.touched) {
              <mat-error>El tipo es requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Departamento</mat-label>
            <input matInput 
                   formControlName="departamento" 
                   placeholder="Ej: Puno, Lima, Arequipa"
                   maxlength="50">
            @if (localidadForm.get('departamento')?.hasError('required') && localidadForm.get('departamento')?.touched) {
              <mat-error>El departamento es requerido</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Provincia</mat-label>
            <input matInput 
                   formControlName="provincia" 
                   placeholder="Ej: Puno, San Román, Lima"
                   maxlength="50">
            @if (localidadForm.get('provincia')?.hasError('required') && localidadForm.get('provincia')?.touched) {
              <mat-error>La provincia es requerida</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Distrito (Opcional)</mat-label>
            <input matInput 
                   formControlName="distrito" 
                   placeholder="Ej: Puno, Juliaca"
                   maxlength="50">
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field full-width">
            <mat-label>Descripción (Opcional)</mat-label>
            <textarea matInput 
                      formControlName="descripcion" 
                      placeholder="Descripción adicional de la localidad"
                      rows="3"
                      maxlength="500"></textarea>
            <mat-hint>Información adicional sobre la localidad</mat-hint>
          </mat-form-field>
        </div>

        <!-- Coordenadas (Opcional) -->
        <div class="coordenadas-section">
          <h4>Coordenadas Geográficas (Opcional)</h4>
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Latitud</mat-label>
              <input matInput 
                     type="number" 
                     formControlName="latitud" 
                     placeholder="-15.8402"
                     step="0.000001"
                     min="-90"
                     max="90">
              <mat-hint>Coordenada de latitud (decimal)</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Longitud</mat-label>
              <input matInput 
                     type="number" 
                     formControlName="longitud" 
                     placeholder="-70.0219"
                     step="0.000001"
                     min="-180"
                     max="180">
              <mat-hint>Coordenada de longitud (decimal)</mat-hint>
            </mat-form-field>
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button mat-button mat-dialog-close>
        <mat-icon>cancel</mat-icon>
        Cancelar
      </button>
      <button mat-raised-button 
              color="primary" 
              [disabled]="!localidadForm.valid || guardando() || codigoExiste()"
              (click)="guardar()">
        @if (guardando()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <mat-icon>{{ data.esEdicion ? 'save' : 'add' }}</mat-icon>
        }
        {{ data.esEdicion ? 'Guardar Cambios' : 'Crear Localidad' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 0;
    }

    .modal-header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      color: #1976d2;
    }

    .modal-content {
      padding: 20px 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .localidad-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-field {
      width: 100%;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .coordenadas-section {
      margin-top: 16px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .coordenadas-section h4 {
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 16px;
      font-weight: 600;
    }

    .modal-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .modal-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class GestionarLocalidadModalComponent implements OnInit {
  localidadForm: FormGroup;
  guardando = signal(false);
  codigoExiste = signal(false);

  constructor(
    private fb: FormBuilder,
    private localidadService: LocalidadService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<GestionarLocalidadModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GestionarLocalidadModalData
  ) {
    this.localidadForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.data.esEdicion && this.data.localidad) {
      this.cargarDatosLocalidad();
    }

    // Validar código único en tiempo real con debounce
    this.localidadForm.get('codigo')?.valueChanges.subscribe(codigo => {
      if (codigo) {
        // Convertir a mayúsculas automáticamente
        const codigoUpper = codigo.toUpperCase();
        if (codigoUpper !== codigo) {
          this.localidadForm.get('codigo')?.setValue(codigoUpper, { emitEvent: false });
        }
        
        // Validar unicidad solo si tiene al menos 6 caracteres
        if (codigoUpper.length >= 6) {
          this.validarCodigoUnico(codigoUpper);
        } else {
          this.codigoExiste.set(false);
        }
      } else {
        this.codigoExiste.set(false);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(10), Validators.pattern(/^[A-Z]{3}[0-9]{3,7}$/)]],
      tipo: ['', Validators.required],
      departamento: ['PUNO', [Validators.required, Validators.maxLength(50)]], // Valor por defecto PUNO
      provincia: ['', [Validators.required, Validators.maxLength(50)]],
      distrito: ['', Validators.maxLength(50)],
      descripcion: ['', Validators.maxLength(500)],
      latitud: ['', [Validators.min(-90), Validators.max(90)]],
      longitud: ['', [Validators.min(-180), Validators.max(180)]]
    });
  }

  private cargarDatosLocalidad(): void {
    const localidad = this.data.localidad!;
    
    this.localidadForm.patchValue({
      nombre: localidad.nombre,
      codigo: localidad.codigo,
      tipo: localidad.tipo,
      departamento: localidad.departamento,
      provincia: localidad.provincia,
      distrito: localidad.distrito || '',
      descripcion: localidad.descripcion || '',
      latitud: localidad.coordenadas?.latitud || '',
      longitud: localidad.coordenadas?.longitud || ''
    });
  }

  private validarCodigoUnico(codigo: string): void {
    // Temporalmente deshabilitado para debugging
    console.log('🔍 Validación de código deshabilitada temporalmente:', codigo);
    this.codigoExiste.set(false);
    return;
    
    // Validar formato básico primero (al menos 3 caracteres)
    if (!codigo || codigo.length < 3) {
      this.codigoExiste.set(false);
      return;
    }

    // Convertir a mayúsculas para validación
    const codigoUpper = codigo.toUpperCase();
    
    // Validar formato completo solo si tiene 6 caracteres
    if (codigoUpper.length === 6) {
      const formatoValido = /^[A-Z]{3}[0-9]{3}$/.test(codigoUpper);
      if (!formatoValido) {
        this.codigoExiste.set(false);
        return;
      }
    } else if (codigoUpper.length > 6) {
      // Si tiene más de 6 caracteres, es inválido
      this.codigoExiste.set(false);
      return;
    } else {
      // Si tiene menos de 6 caracteres, no validar unicidad aún
      this.codigoExiste.set(false);
      return;
    }

    const idExcluir = this.data.esEdicion ? this.data.localidad?.id : undefined;
    
    console.log('🔍 Validando código único:', codigoUpper);
    
    // For now, we'll use a simple validation since the service method doesn't exist yet
    this.codigoExiste.set(false);
    
    // TODO: Implement proper validation when backend is ready
    // this.localidadService.validarCodigoUnico(codigoUpper, idExcluir).subscribe({
    //   next: (esUnico: boolean) => {
    //     console.log('✅ Resultado validación:', esUnico);
    //     this.codigoExiste.set(!esUnico);
    //   },
    //   error: (error: any) => {
    //     console.error('❌ Error validando código:', error);
    //     this.codigoExiste.set(false);
    //   }
    // });
  }

  async guardar(): Promise<void> {
    console.log('🔍 INICIANDO GUARDADO DE LOCALIDAD');
    console.log('📋 Formulario válido:', this.localidadForm.valid);
    console.log('📋 Código existe:', this.codigoExiste());
    console.log('📋 Errores del formulario:', this.localidadForm.errors);
    
    // Mostrar errores de cada campo
    Object.keys(this.localidadForm.controls).forEach(key => {
      const control = this.localidadForm.get(key);
      if (control?.errors) {
        console.log(`❌ Campo ${key} tiene errores:`, control.errors);
      }
    });

    if (!this.localidadForm.valid || this.codigoExiste()) {
      console.log('❌ GUARDADO CANCELADO - Formulario inválido o código existe');
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.localidadForm.controls).forEach(key => {
        this.localidadForm.get(key)?.markAsTouched();
      });
      return;
    }

    console.log('✅ INICIANDO GUARDADO...');
    this.guardando.set(true);
    const formValue = this.localidadForm.value;
    console.log('📤 Datos del formulario:', formValue);

    // Preparar coordenadas si están completas
    let coordenadas = undefined;
    if (formValue.latitud && formValue.longitud) {
      coordenadas = {
        latitud: parseFloat(formValue.latitud),
        longitud: parseFloat(formValue.longitud)
      };
    }

    const localidadData = {
      nombre: formValue.nombre.trim(),
      codigo: formValue.codigo.toUpperCase(),
      tipo: formValue.tipo as TipoLocalidad,
      departamento: formValue.departamento.trim(),
      provincia: formValue.provincia.trim(),
      distrito: formValue.distrito?.trim() || undefined,
      descripcion: formValue.descripcion?.trim() || undefined,
      coordenadas
    };

    console.log('📤 Datos preparados para enviar:', localidadData);
    console.log('📤 Es edición:', this.data.esEdicion);

    try {
      let localidad: any;
      if (!this.data.esEdicion) {
        localidad = await this.localidadService.crearLocalidad(localidadData as LocalidadCreate);
      } else {
        localidad = await this.localidadService.actualizarLocalidad(this.data.localidad!.id, localidadData as LocalidadUpdate);
      }

      console.log('✅ LOCALIDAD GUARDADA EXITOSAMENTE:', localidad);
      this.guardando.set(false);
      const mensaje = !this.data.esEdicion 
        ? 'Localidad creada exitosamente' 
        : 'Localidad actualizada exitosamente';
      
      this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
      this.dialogRef.close(localidad);
    } catch (error: any) {
      console.error('❌ ERROR GUARDANDO LOCALIDAD:', error);
      this.guardando.set(false);
      const mensajeError = error?.message || 'Error desconocido al guardar la localidad';
      this.snackBar.open(`Error: ${mensajeError}`, 'Cerrar', { duration: 5000 });
    }
  }
}