import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

import { LocalidadService } from '../../services/localidad.service';
import { Localidad, LocalidadCreate, LocalidadUpdate, NivelTerritorial, TipoLocalidad } from '../../models/localidad.model';

interface DialogData {
  modo: 'crear' | 'editar';
  localidad?: Localidad;
}

@Component({
  selector: 'app-localidad-modal',
  templateUrl: './localidad-modal.component.html',
  styleUrls: ['./localidad-modal.component.scss'],
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
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class LocalidadModalComponent implements OnInit {
  form: FormGroup;
  loading = false;
  
  nivelesTerritoriales = Object.values(NivelTerritorial);
  tiposLocalidad = Object.values(TipoLocalidad);

  constructor(
    private fb: FormBuilder,
    private localidadService: LocalidadService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<LocalidadModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    if (this.data.modo === 'editar' && this.data.localidad) {
      this.loadLocalidadData();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Campos obligatorios
      departamento: ['', [Validators.required, Validators.minLength(2)]],
      provincia: ['', [Validators.required, Validators.minLength(2)]],
      distrito: ['', [Validators.required, Validators.minLength(2)]],
      municipalidad_centro_poblado: ['', [Validators.required, Validators.minLength(2)]],
      nivel_territorial: ['', Validators.required],
      
      // Campos opcionales
      ubigeo: ['', [Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]],
      ubigeo_identificador_mcp: [''],
      dispositivo_legal_creacion: [''],
      nombre: [''],
      codigo: [''],
      tipo: [''],
      descripcion: [''],
      observaciones: [''],
      
      // Coordenadas
      latitud: ['', [Validators.min(-90), Validators.max(90)]],
      longitud: ['', [Validators.min(-180), Validators.max(180)]]
    });
  }

  private loadLocalidadData(): void {
    const localidad = this.data.localidad!;
    
    this.form.patchValue({
      departamento: localidad.departamento,
      provincia: localidad.provincia,
      distrito: localidad.distrito,
      municipalidad_centro_poblado: localidad.municipalidad_centro_poblado,
      nivel_territorial: localidad.nivel_territorial,
      ubigeo: localidad.ubigeo || '',
      ubigeo_identificador_mcp: localidad.ubigeo_identificador_mcp || '',
      dispositivo_legal_creacion: localidad.dispositivo_legal_creacion || '',
      nombre: localidad.nombre || '',
      codigo: localidad.codigo || '',
      tipo: localidad.tipo || '',
      descripcion: localidad.descripcion || '',
      observaciones: localidad.observaciones || '',
      latitud: localidad.coordenadas?.latitud || '',
      longitud: localidad.coordenadas?.longitud || ''
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    
    try {
      const formValue = this.form.value;
      
      // Preparar datos de localidad
      const localidadData: any = {
        departamento: formValue.departamento.toUpperCase(),
        provincia: formValue.provincia.toUpperCase(),
        distrito: formValue.distrito.toUpperCase(),
        municipalidad_centro_poblado: formValue.municipalidad_centro_poblado,
        nivel_territorial: formValue.nivel_territorial
      };

      // Campos opcionales
      if (formValue.ubigeo) {
        localidadData.ubigeo = formValue.ubigeo;
      }
      
      if (formValue.ubigeo_identificador_mcp) {
        localidadData.ubigeo_identificador_mcp = formValue.ubigeo_identificador_mcp;
      }
      
      if (formValue.dispositivo_legal_creacion) {
        localidadData.dispositivo_legal_creacion = formValue.dispositivo_legal_creacion;
      }
      
      if (formValue.nombre) {
        localidadData.nombre = formValue.nombre;
      }
      
      if (formValue.codigo) {
        localidadData.codigo = formValue.codigo;
      }
      
      if (formValue.tipo) {
        localidadData.tipo = formValue.tipo;
      }
      
      if (formValue.descripcion) {
        localidadData.descripcion = formValue.descripcion;
      }
      
      if (formValue.observaciones) {
        localidadData.observaciones = formValue.observaciones;
      }

      // Coordenadas
      if (formValue.latitud && formValue.longitud) {
        localidadData.coordenadas = {
          latitud: parseFloat(formValue.latitud),
          longitud: parseFloat(formValue.longitud)
        };
      }

      // Crear o actualizar
      if (this.data.modo === 'crear') {
        await this.localidadService.crearLocalidad(localidadData as LocalidadCreate);
      } else {
        await this.localidadService.actualizarLocalidad(
          this.data.localidad!.id, 
          localidadData as LocalidadUpdate
        );
      }

      this.dialogRef.close(true);
      
    } catch (error: any) {
      console.error('Error guardando localidad:', error);
      this.snackBar.open(
        error.error?.detail || 'Error guardando localidad', 
        'Cerrar', 
        { duration: 5000, panelClass: ['snackbar-error'] }
      );
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Validaciones y utilidades
  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Este campo es obligatorio';
      }
      if (control.errors['minlength']) {
        return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      }
      if (control.errors['maxlength']) {
        return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
      }
      if (control.errors['pattern']) {
        return 'Formato inválido';
      }
      if (control.errors['min']) {
        return `Valor mínimo: ${control.errors['min'].min}`;
      }
      if (control.errors['max']) {
        return `Valor máximo: ${control.errors['max'].max}`;
      }
    }
    return '';
  }

  // Generadores automáticos
  generarUbigeoIdentificadorMcp(): void {
    const ubigeo = this.form.get('ubigeo')?.value;
    if (ubigeo && ubigeo.length === 6) {
      const identificador = `${ubigeo}-MCP-001`;
      this.form.patchValue({ ubigeo_identificador_mcp: identificador });
    }
  }

  sugerirNombreMunicipalidad(): void {
    const nivel = this.form.get('nivel_territorial')?.value;
    const distrito = this.form.get('distrito')?.value;
    const provincia = this.form.get('provincia')?.value;
    
    if (nivel && (distrito || provincia)) {
      let sugerencia = '';
      
      switch (nivel) {
        case 'DISTRITO':
          sugerencia = `Municipalidad Distrital de ${distrito}`;
          break;
        case 'PROVINCIA':
          sugerencia = `Municipalidad Provincial de ${provincia}`;
          break;
        case 'DEPARTAMENTO':
          sugerencia = `Gobierno Regional de ${this.form.get('departamento')?.value}`;
          break;
        case 'CENTRO_POBLADO':
          sugerencia = `Municipalidad de Centro Poblado ${distrito}`;
          break;
      }
      
      if (sugerencia) {
        this.form.patchValue({ municipalidad_centro_poblado: sugerencia });
      }
    }
  }

  get titulo(): string {
    return this.data.modo === 'crear' ? 'Nueva Localidad' : 'Editar Localidad';
  }

  get textoBoton(): string {
    return this.data.modo === 'crear' ? 'Crear' : 'Actualizar';
  }
}