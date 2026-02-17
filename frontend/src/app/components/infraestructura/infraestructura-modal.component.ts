import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { InfraestructuraService } from '../../services/infraestructura.service';
import { 
  Infraestructura, 
  TipoInfraestructura, 
  CrearInfraestructuraRequest, 
  ActualizarInfraestructuraRequest,
  InfraestructuraUtils 
} from '../../models/infraestructura.model';

export interface InfraestructuraModalData {
  infraestructura?: Infraestructura;
  modo: 'crear' | 'editar';
}

@Component({
  selector: 'app-infraestructura-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatStepperModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="infraestructura-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>{{ data.modo === 'crear' ? 'add' : 'edit' }}</mat-icon>
          {{ data.modo === 'crear' ? 'Nueva Infraestructura' : 'Editar Infraestructura' }}
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <mat-stepper #stepper [linear]="true" orientation="vertical">
          
          <!-- Paso 1: Datos Básicos -->
          <mat-step [stepControl]="datosBasicosForm" label="Datos Básicos">
            <form [formGroup]="datosBasicosForm" class="step-form">
              
              <div class="form-section">
                <h3>Información de la Empresa</h3>
                
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>RUC</mat-label>
                    <input matInput 
                           formControlName="ruc" 
                           placeholder="20123456789"
                           maxlength="11"
                           [readonly]="data.modo === 'editar'">
                    <mat-icon matSuffix>business</mat-icon>
                    @if (datosBasicosForm.get('ruc')?.hasError('required')) {
                      <mat-error>El RUC es obligatorio</mat-error>
                    }
                    @if (datosBasicosForm.get('ruc')?.hasError('pattern')) {
                      <mat-error>El RUC debe tener 11 dígitos</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Razón Social</mat-label>
                    <input matInput 
                           formControlName="razonSocial" 
                           placeholder="Nombre de la empresa">
                    <mat-icon matSuffix>business_center</mat-icon>
                    @if (datosBasicosForm.get('razonSocial')?.hasError('required')) {
                      <mat-error>La razón social es obligatoria</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Tipo de Infraestructura</mat-label>
                    <mat-select formControlName="tipoInfraestructura">
                      @for (tipo of tiposInfraestructura; track tipo.value) {
                        <mat-option [value]="tipo.value">
                          <div class="option-content">
                            <mat-icon>{{ tipo.icon }}</mat-icon>
                            <span>{{ tipo.label }}</span>
                          </div>
                        </mat-option>
                      }
                    </mat-select>
                    @if (datosBasicosForm.get('tipoInfraestructura')?.hasError('required')) {
                      <mat-error>Debe seleccionar un tipo de infraestructura</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Dirección Fiscal</mat-label>
                    <textarea matInput 
                              formControlName="direccionFiscal" 
                              placeholder="Dirección completa"
                              rows="3"></textarea>
                    <mat-icon matSuffix>location_on</mat-icon>
                    @if (datosBasicosForm.get('direccionFiscal')?.hasError('required')) {
                      <mat-error>La dirección fiscal es obligatoria</mat-error>
                    }
                  </mat-form-field>
                </div>
              </div>

              <div class="step-actions">
                <button mat-raised-button 
                        color="primary" 
                        matStepperNext
                        [disabled]="!datosBasicosForm.valid">
                  Siguiente
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Paso 2: Representante Legal -->
          <mat-step [stepControl]="representanteForm" label="Representante Legal">
            <form [formGroup]="representanteForm" class="step-form">
              
              <div class="form-section">
                <h3>Datos del Representante Legal</h3>
                
                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>DNI</mat-label>
                    <input matInput 
                           formControlName="dni" 
                           placeholder="12345678"
                           maxlength="8">
                    <mat-icon matSuffix>badge</mat-icon>
                    @if (representanteForm.get('dni')?.hasError('required')) {
                      <mat-error>El DNI es obligatorio</mat-error>
                    }
                    @if (representanteForm.get('dni')?.hasError('pattern')) {
                      <mat-error>El DNI debe tener 8 dígitos</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Nombres</mat-label>
                    <input matInput 
                           formControlName="nombres" 
                           placeholder="Nombres completos">
                    <mat-icon matSuffix>person</mat-icon>
                    @if (representanteForm.get('nombres')?.hasError('required')) {
                      <mat-error>Los nombres son obligatorios</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Apellidos</mat-label>
                    <input matInput 
                           formControlName="apellidos" 
                           placeholder="Apellidos completos">
                    <mat-icon matSuffix>person</mat-icon>
                    @if (representanteForm.get('apellidos')?.hasError('required')) {
                      <mat-error>Los apellidos son obligatorios</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Email (Opcional)</mat-label>
                    <input matInput 
                           formControlName="email" 
                           type="email"
                           placeholder="correo@ejemplo.com">
                    <mat-icon matSuffix>email</mat-icon>
                    @if (representanteForm.get('email')?.hasError('email')) {
                      <mat-error>Ingrese un email válido</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Teléfono (Opcional)</mat-label>
                    <input matInput 
                           formControlName="telefono" 
                           placeholder="999123456">
                    <mat-icon matSuffix>phone</mat-icon>
                  </mat-form-field>
                </div>
              </div>

              <div class="step-actions">
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon>
                  Anterior
                </button>
                <button mat-raised-button 
                        color="primary" 
                        matStepperNext
                        [disabled]="!representanteForm.valid">
                  Siguiente
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Paso 3: Especificaciones -->
          <mat-step [stepControl]="especificacionesForm" label="Especificaciones">
            <form [formGroup]="especificacionesForm" class="step-form">
              
              <div class="form-section">
                <h3>Especificaciones Técnicas</h3>
                
                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Capacidad Máxima</mat-label>
                    <input matInput 
                           formControlName="capacidadMaxima" 
                           type="number"
                           placeholder="1000">
                    <span matSuffix>personas</span>
                    <mat-icon matSuffix>groups</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Área Total</mat-label>
                    <input matInput 
                           formControlName="areaTotal" 
                           type="number"
                           placeholder="5000">
                    <span matSuffix>m²</span>
                    <mat-icon matSuffix>square_foot</mat-icon>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Número de Andenes</mat-label>
                    <input matInput 
                           formControlName="numeroAndenes" 
                           type="number"
                           placeholder="10">
                    <mat-icon matSuffix>view_module</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Número de Plataformas</mat-label>
                    <input matInput 
                           formControlName="numeroPlataformas" 
                           type="number"
                           placeholder="5">
                    <mat-icon matSuffix>layers</mat-icon>
                  </mat-form-field>
                </div>
              </div>

              <div class="form-section">
                <h3>Información de Contacto</h3>
                
                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Email de Contacto (Opcional)</mat-label>
                    <input matInput 
                           formControlName="emailContacto" 
                           type="email"
                           placeholder="contacto@empresa.com">
                    <mat-icon matSuffix>email</mat-icon>
                    @if (especificacionesForm.get('emailContacto')?.hasError('email')) {
                      <mat-error>Ingrese un email válido</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Teléfono de Contacto (Opcional)</mat-label>
                    <input matInput 
                           formControlName="telefonoContacto" 
                           placeholder="051-123456">
                    <mat-icon matSuffix>phone</mat-icon>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Sitio Web (Opcional)</mat-label>
                    <input matInput 
                           formControlName="sitioWeb" 
                           placeholder="https://www.empresa.com">
                    <mat-icon matSuffix>language</mat-icon>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Observaciones (Opcional)</mat-label>
                    <textarea matInput 
                              formControlName="observaciones" 
                              placeholder="Información adicional relevante"
                              rows="3"></textarea>
                    <mat-icon matSuffix>note</mat-icon>
                  </mat-form-field>
                </div>
              </div>

              <div class="step-actions">
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon>
                  Anterior
                </button>
                <button mat-raised-button 
                        color="primary" 
                        (click)="guardar()"
                        [disabled]="!isFormValid() || isLoading()">
                  @if (isLoading()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <mat-icon>save</mat-icon>
                  }
                  {{ data.modo === 'crear' ? 'Crear Infraestructura' : 'Guardar Cambios' }}
                </button>
              </div>
            </form>
          </mat-step>
        </mat-stepper>
      </mat-dialog-content>
    </div>
  `,
  styleUrl: './infraestructura-modal.component.scss'
})
export class InfraestructuraModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InfraestructuraModalComponent>);
  private infraestructuraService = inject(InfraestructuraService);
  private snackBar = inject(MatSnackBar);
  
  data = inject<InfraestructuraModalData>(MAT_DIALOG_DATA);

  // Signals
  isLoading = signal(false);

  // Forms
  datosBasicosForm!: FormGroup;
  representanteForm!: FormGroup;
  especificacionesForm!: FormGroup;

  // Opciones
  tiposInfraestructura = [
    {
      value: TipoInfraestructura.TERMINAL_TERRESTRE,
      label: InfraestructuraUtils.getTipoInfraestructuraLabel(TipoInfraestructura.TERMINAL_TERRESTRE),
      icon: InfraestructuraUtils.getTipoInfraestructuraIcon(TipoInfraestructura.TERMINAL_TERRESTRE)
    },
    {
      value: TipoInfraestructura.ESTACION_DE_RUTA,
      label: InfraestructuraUtils.getTipoInfraestructuraLabel(TipoInfraestructura.ESTACION_DE_RUTA),
      icon: InfraestructuraUtils.getTipoInfraestructuraIcon(TipoInfraestructura.ESTACION_DE_RUTA)
    },
    {
      value: TipoInfraestructura.OTROS,
      label: InfraestructuraUtils.getTipoInfraestructuraLabel(TipoInfraestructura.OTROS),
      icon: InfraestructuraUtils.getTipoInfraestructuraIcon(TipoInfraestructura.OTROS)
    }
  ];

  ngOnInit(): void {
    this.initializeForms();
    
    if (this.data.modo === 'editar' && this.data.infraestructura) {
      this.loadInfraestructuraData();
    }
  }

  initializeForms(): void {
    // Formulario de datos básicos
    this.datosBasicosForm = this.fb.group({
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      razonSocial: ['', [Validators.required, Validators.minLength(3)]],
      tipoInfraestructura: ['', Validators.required],
      direccionFiscal: ['', [Validators.required, Validators.minLength(10)]]
    });

    // Formulario de representante legal
    this.representanteForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      telefono: ['']
    });

    // Formulario de especificaciones
    this.especificacionesForm = this.fb.group({
      capacidadMaxima: ['', [Validators.min(1)]],
      areaTotal: ['', [Validators.min(1)]],
      numeroAndenes: ['', [Validators.min(0)]],
      numeroPlataformas: ['', [Validators.min(0)]],
      emailContacto: ['', [Validators.email]],
      telefonoContacto: [''],
      sitioWeb: [''],
      observaciones: ['']
    });
  }

  loadInfraestructuraData(): void {
    const infraestructura = this.data.infraestructura!;

    // Cargar datos básicos
    this.datosBasicosForm.patchValue({
      ruc: infraestructura.ruc,
      razonSocial: infraestructura.razonSocial.principal,
      tipoInfraestructura: infraestructura.tipoInfraestructura,
      direccionFiscal: infraestructura.direccionFiscal
    });

    // Cargar representante legal
    this.representanteForm.patchValue({
      dni: infraestructura.representanteLegal.dni,
      nombres: infraestructura.representanteLegal.nombres,
      apellidos: infraestructura.representanteLegal.apellidos,
      email: infraestructura.representanteLegal.email || '',
      telefono: infraestructura.representanteLegal.telefono || ''
    });

    // Cargar especificaciones
    this.especificacionesForm.patchValue({
      capacidadMaxima: infraestructura.especificaciones.capacidadMaxima || '',
      areaTotal: infraestructura.especificaciones.areaTotal || '',
      numeroAndenes: infraestructura.especificaciones.numeroAndenes || '',
      numeroPlataformas: infraestructura.especificaciones.numeroPlataformas || '',
      emailContacto: infraestructura.emailContacto || '',
      telefonoContacto: infraestructura.telefonoContacto || '',
      sitioWeb: infraestructura.sitioWeb || '',
      observaciones: infraestructura.observaciones || ''
    });
  }

  isFormValid(): boolean {
    return this.datosBasicosForm.valid && 
           this.representanteForm.valid && 
           this.especificacionesForm.valid;
  }

  guardar(): void {
    if (!this.isFormValid()) {
      this.snackBar.open('Por favor complete todos los campos obligatorios', 'CERRAR', {
        duration: 3000
      });
      return;
    }

    this.isLoading.set(true);

    if (this.data.modo === 'crear') {
      this.crearInfraestructura();
    } else {
      this.actualizarInfraestructura();
    }
  }

  private crearInfraestructura(): void {
    const request: CrearInfraestructuraRequest = {
      ruc: this.datosBasicosForm.get('ruc')?.value,
      razonSocial: {
        principal: this.datosBasicosForm.get('razonSocial')?.value
      },
      tipoInfraestructura: this.datosBasicosForm.get('tipoInfraestructura')?.value,
      direccionFiscal: this.datosBasicosForm.get('direccionFiscal')?.value,
      representanteLegal: {
        dni: this.representanteForm.get('dni')?.value,
        nombres: this.representanteForm.get('nombres')?.value,
        apellidos: this.representanteForm.get('apellidos')?.value,
        email: this.representanteForm.get('email')?.value || undefined,
        telefono: this.representanteForm.get('telefono')?.value || undefined
      },
      especificaciones: {
        capacidadMaxima: this.especificacionesForm.get('capacidadMaxima')?.value || undefined,
        areaTotal: this.especificacionesForm.get('areaTotal')?.value || undefined,
        numeroAndenes: this.especificacionesForm.get('numeroAndenes')?.value || undefined,
        numeroPlataformas: this.especificacionesForm.get('numeroPlataformas')?.value || undefined
      },
      emailContacto: this.especificacionesForm.get('emailContacto')?.value || undefined,
      telefonoContacto: this.especificacionesForm.get('telefonoContacto')?.value || undefined,
      sitioWeb: this.especificacionesForm.get('sitioWeb')?.value || undefined,
      observaciones: this.especificacionesForm.get('observaciones')?.value || undefined
    };

    this.infraestructuraService.crearInfraestructura(request).subscribe({
      next: (infraestructura) => {
        this.isLoading.set(false);
        this.snackBar.open('Infraestructura creada exitosamente', 'CERRAR', {
          duration: 3000
        });
        this.dialogRef.close(infraestructura);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Error al crear la infraestructura: ' + error.message, 'CERRAR', {
          duration: 5000
        });
      }
    });
  }

  private actualizarInfraestructura(): void {
    const request: ActualizarInfraestructuraRequest = {
      razonSocial: {
        principal: this.datosBasicosForm.get('razonSocial')?.value
      },
      direccionFiscal: this.datosBasicosForm.get('direccionFiscal')?.value,
      representanteLegal: {
        dni: this.representanteForm.get('dni')?.value,
        nombres: this.representanteForm.get('nombres')?.value,
        apellidos: this.representanteForm.get('apellidos')?.value,
        email: this.representanteForm.get('email')?.value || undefined,
        telefono: this.representanteForm.get('telefono')?.value || undefined
      },
      especificaciones: {
        capacidadMaxima: this.especificacionesForm.get('capacidadMaxima')?.value || undefined,
        areaTotal: this.especificacionesForm.get('areaTotal')?.value || undefined,
        numeroAndenes: this.especificacionesForm.get('numeroAndenes')?.value || undefined,
        numeroPlataformas: this.especificacionesForm.get('numeroPlataformas')?.value || undefined
      },
      emailContacto: this.especificacionesForm.get('emailContacto')?.value || undefined,
      telefonoContacto: this.especificacionesForm.get('telefonoContacto')?.value || undefined,
      sitioWeb: this.especificacionesForm.get('sitioWeb')?.value || undefined,
      observaciones: this.especificacionesForm.get('observaciones')?.value || undefined
    };

    this.infraestructuraService.actualizarInfraestructura(this.data.infraestructura!.id, request).subscribe({
      next: (infraestructura) => {
        this.isLoading.set(false);
        this.snackBar.open('Infraestructura actualizada exitosamente', 'CERRAR', {
          duration: 3000
        });
        this.dialogRef.close(infraestructura);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Error al actualizar la infraestructura: ' + error.message, 'CERRAR', {
          duration: 5000
        });
      }
    });
  }
}