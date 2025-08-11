import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { Empresa, EmpresaCreate, EmpresaUpdate, EstadoEmpresa } from '../../models/empresa.model';

@Component({
  selector: 'app-empresa-form',
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
    MatChipsModule,
    MatTooltipModule,
    MatStepperModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>{{ isEditing ? 'Editar Empresa' : 'Nueva Empresa' }}</h1>
        </div>
        <p class="header-subtitle">
          {{ isEditing ? 'Modificar información de la empresa' : 'Registrar nueva empresa de transporte' }}
        </p>
      </div>
      <div class="header-actions">
        <button mat-button color="accent" (click)="volver()" class="action-button">
          <mat-icon>arrow_back</mat-icon>
          Volver
        </button>
      </div>
    </div>

    <div class="content-section">
      <!-- Loading State -->
      @if (isLoading) {
        <div class="loading-container">
          <div class="loading-content">
            <mat-spinner diameter="60" class="loading-spinner"></mat-spinner>
            <h3>{{ isEditing ? 'Cargando empresa...' : 'Procesando...' }}</h3>
            <p>{{ isEditing ? 'Obteniendo información de la empresa' : 'Guardando información' }}</p>
          </div>
        </div>
      }

      <!-- Form -->
      @if (!isLoading) {
        <div class="form-container">
          <form [formGroup]="empresaForm" (ngSubmit)="onSubmit()" class="empresa-form">
            <mat-stepper #stepper linear class="stepper">
              <!-- Paso 1: Información Básica -->
              <mat-step [stepControl]="empresaForm" label="Información Básica">
                <div class="step-content">
                  <mat-card class="form-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>business</mat-icon>
                        Información Básica
                      </mat-card-title>
                      <mat-card-subtitle>Datos principales de la empresa</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="form-grid">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>RUC</mat-label>
                          <input matInput formControlName="ruc" 
                                 placeholder="20123456789" 
                                 maxlength="11"
                                 [readonly]="isEditing"
                                 (blur)="validarRuc(empresaForm.get('ruc')?.value)">
                          <mat-icon matSuffix>business</mat-icon>
                          <mat-error *ngIf="empresaForm.get('ruc')?.hasError('required')">
                            El RUC es obligatorio
                          </mat-error>
                          <mat-error *ngIf="empresaForm.get('ruc')?.hasError('pattern')">
                            El RUC debe tener 11 dígitos
                          </mat-error>
                          <mat-error *ngIf="empresaForm.get('ruc')?.hasError('rucExists')">
                            Este RUC ya está registrado
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Razón Social Principal</mat-label>
                          <input matInput formControlName="razonSocialPrincipal" 
                                 placeholder="Transportes Puno S.A.C."
                                 maxlength="200">
                          <mat-icon matSuffix>description</mat-icon>
                          <mat-error *ngIf="empresaForm.get('razonSocialPrincipal')?.hasError('required')">
                            La razón social es obligatoria
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Dirección Fiscal</mat-label>
                          <textarea matInput formControlName="direccionFiscal" 
                                    placeholder="Av. Principal 123, Puno"
                                    rows="3"
                                    maxlength="500"></textarea>
                          <mat-icon matSuffix>location_on</mat-icon>
                          <mat-error *ngIf="empresaForm.get('direccionFiscal')?.hasError('required')">
                            La dirección fiscal es obligatoria
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Estado</mat-label>
                          <mat-select formControlName="estado">
                            <mat-option value="HABILITADA">Habilitada</mat-option>
                            <mat-option value="EN_TRAMITE">En Trámite</mat-option>
                            <mat-option value="SUSPENDIDA">Suspendida</mat-option>
                            <mat-option value="CANCELADA">Cancelada</mat-option>
                          </mat-select>
                          <mat-icon matSuffix>status</mat-icon>
                        </mat-form-field>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
                <div class="step-actions">
                  <button mat-button matStepperNext [disabled]="!isBasicInfoValid()">
                    Siguiente
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </mat-step>

              <!-- Paso 2: Representante Legal -->
              <mat-step [stepControl]="empresaForm" label="Representante Legal">
                <div class="step-content">
                  <mat-card class="form-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>person</mat-icon>
                        Representante Legal
                      </mat-card-title>
                      <mat-card-subtitle>Información del representante legal</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="form-grid">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>DNI</mat-label>
                          <input matInput formControlName="representanteDni" 
                                 placeholder="12345678"
                                 maxlength="8">
                          <mat-icon matSuffix>badge</mat-icon>
                          <mat-error *ngIf="empresaForm.get('representanteDni')?.hasError('required')">
                            El DNI es obligatorio
                          </mat-error>
                          <mat-error *ngIf="empresaForm.get('representanteDni')?.hasError('pattern')">
                            El DNI debe tener 8 dígitos
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Nombres</mat-label>
                          <input matInput formControlName="representanteNombres" 
                                 placeholder="Juan Carlos"
                                 maxlength="100">
                          <mat-icon matSuffix>person</mat-icon>
                          <mat-error *ngIf="empresaForm.get('representanteNombres')?.hasError('required')">
                            Los nombres son obligatorios
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Apellidos</mat-label>
                          <input matInput formControlName="representanteApellidos" 
                                 placeholder="Pérez Quispe"
                                 maxlength="100">
                          <mat-icon matSuffix>person</mat-icon>
                          <mat-error *ngIf="empresaForm.get('representanteApellidos')?.hasError('required')">
                            Los apellidos son obligatorios
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Email</mat-label>
                          <input matInput formControlName="representanteEmail" 
                                 placeholder="juan.perez@empresa.com"
                                 type="email"
                                 maxlength="200">
                          <mat-icon matSuffix>email</mat-icon>
                          <mat-error *ngIf="empresaForm.get('representanteEmail')?.hasError('email')">
                            Ingrese un email válido
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Teléfono</mat-label>
                          <input matInput formControlName="representanteTelefono" 
                                 placeholder="951234567"
                                 maxlength="15">
                          <mat-icon matSuffix>phone</mat-icon>
                        </mat-form-field>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon>
                    Anterior
                  </button>
                  <button mat-button matStepperNext [disabled]="!isRepresentanteValid()">
                    Siguiente
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </mat-step>

              <!-- Paso 3: Información de Contacto -->
              <mat-step [stepControl]="empresaForm" label="Información de Contacto">
                <div class="step-content">
                  <mat-card class="form-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>contact_phone</mat-icon>
                        Información de Contacto
                      </mat-card-title>
                      <mat-card-subtitle>Datos de contacto de la empresa</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="form-grid">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Email de Contacto</mat-label>
                          <input matInput formControlName="emailContacto" 
                                 placeholder="info@empresa.com"
                                 type="email"
                                 maxlength="200">
                          <mat-icon matSuffix>email</mat-icon>
                          <mat-error *ngIf="empresaForm.get('emailContacto')?.hasError('email')">
                            Ingrese un email válido
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Teléfono de Contacto</mat-label>
                          <input matInput formControlName="telefonoContacto" 
                                 placeholder="951234567"
                                 maxlength="15">
                          <mat-icon matSuffix>phone</mat-icon>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Sitio Web</mat-label>
                          <input matInput formControlName="sitioWeb" 
                                 placeholder="www.empresa.com"
                                 maxlength="200">
                          <mat-icon matSuffix>language</mat-icon>
                        </mat-form-field>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon>
                    Anterior
                  </button>
                  <button mat-button matStepperNext [disabled]="!isContactInfoValid()">
                    Siguiente
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </mat-step>

              <!-- Paso 4: Revisión y Confirmación -->
              <mat-step label="Revisión y Confirmación">
                <div class="step-content">
                  <mat-card class="form-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>preview</mat-icon>
                        Revisión de Información
                      </mat-card-title>
                      <mat-card-subtitle>Confirma los datos antes de guardar</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="review-section">
                        <h3>Información Básica</h3>
                        <div class="review-grid">
                          <div class="review-item">
                            <span class="review-label">RUC:</span>
                            <span class="review-value">{{ empresaForm.get('ruc')?.value }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">Razón Social:</span>
                            <span class="review-value">{{ empresaForm.get('razonSocialPrincipal')?.value }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">Dirección:</span>
                            <span class="review-value">{{ empresaForm.get('direccionFiscal')?.value }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">Estado:</span>
                            <span class="review-value">{{ getEstadoDisplayName(empresaForm.get('estado')?.value) }}</span>
                          </div>
                        </div>

                        <h3>Representante Legal</h3>
                        <div class="review-grid">
                          <div class="review-item">
                            <span class="review-label">DNI:</span>
                            <span class="review-value">{{ empresaForm.get('representanteDni')?.value }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">Nombres:</span>
                            <span class="review-value">{{ empresaForm.get('representanteNombres')?.value }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">Apellidos:</span>
                            <span class="review-value">{{ empresaForm.get('representanteApellidos')?.value }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">Email:</span>
                            <span class="review-value">{{ empresaForm.get('representanteEmail')?.value || 'No especificado' }}</span>
                          </div>
                        </div>

                        <h3>Información de Contacto</h3>
                        <div class="review-grid">
                          <div class="review-item">
                            <span class="review-label">Email:</span>
                            <span class="review-value">{{ empresaForm.get('emailContacto')?.value || 'No especificado' }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">Teléfono:</span>
                            <span class="review-value">{{ empresaForm.get('telefonoContacto')?.value || 'No especificado' }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">Sitio Web:</span>
                            <span class="review-value">{{ empresaForm.get('sitioWeb')?.value || 'No especificado' }}</span>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon>
                    Anterior
                  </button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="empresaForm.invalid || isSubmitting">
                    <mat-icon>{{ isSubmitting ? 'hourglass_empty' : 'save' }}</mat-icon>
                    {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Empresa' : 'Crear Empresa') }}
                  </button>
                </div>
              </mat-step>
            </mat-stepper>
          </form>
        </div>
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
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
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

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 4px;
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
      justify-content: center;
      align-items: center;
      padding: 80px 24px;
      text-align: center;
    }

    .loading-content h3 {
      margin: 24px 0 8px 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .loading-content p {
      margin: 0;
      color: #6c757d;
    }

    .form-container {
      padding: 24px;
    }

    .stepper {
      background: transparent;
    }

    .step-content {
      margin: 24px 0;
    }

    .form-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: none;
    }

    .form-card-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px 12px 0 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-top: 16px;
    }

    .form-field {
      width: 100%;
    }

    .step-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      padding: 16px 0;
      border-top: 1px solid #e9ecef;
    }

    .review-section {
      margin: 16px 0;
    }

    .review-section h3 {
      color: #2c3e50;
      font-weight: 600;
      margin: 24px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e9ecef;
    }

    .review-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .review-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .review-label {
      font-weight: 600;
      color: #2c3e50;
    }

    .review-value {
      color: #6c757d;
      font-weight: 500;
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

      .review-grid {
        grid-template-columns: 1fr;
      }

      .step-actions {
        flex-direction: column;
        gap: 16px;
      }
    }
  `]
})
export class EmpresaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private empresaService = inject(EmpresaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  empresaForm: FormGroup;
  isEditing = false;
  isLoading = false;
  isSubmitting = false;
  empresaId?: string;

  constructor() {
    this.empresaForm = this.fb.group({
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      razonSocialPrincipal: ['', [Validators.required, Validators.maxLength(200)]],
      direccionFiscal: ['', [Validators.required, Validators.maxLength(500)]],
      estado: ['HABILITADA', [Validators.required]],
      representanteDni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      representanteNombres: ['', [Validators.required, Validators.maxLength(100)]],
      representanteApellidos: ['', [Validators.required, Validators.maxLength(100)]],
      representanteEmail: ['', [Validators.email]],
      representanteTelefono: [''],
      emailContacto: ['', [Validators.email]],
      telefonoContacto: [''],
      sitioWeb: ['']
    });
  }

  ngOnInit(): void {
    this.empresaId = this.route.snapshot.params['id'];
    if (this.empresaId) {
      this.isEditing = true;
      this.loadEmpresa();
    }
  }

  loadEmpresa(): void {
    if (!this.empresaId) return;

    this.isLoading = true;
    this.empresaService.getEmpresaById(this.empresaId).subscribe({
      next: (empresa) => {
        this.empresaForm.patchValue({
          ruc: empresa.ruc,
          razonSocialPrincipal: empresa.razonSocial.principal,
          direccionFiscal: empresa.direccionFiscal,
          estado: empresa.estado,
          representanteDni: empresa.representanteLegal.dni,
          representanteNombres: empresa.representanteLegal.nombres,
          representanteApellidos: empresa.representanteLegal.apellidos,
          representanteEmail: empresa.representanteLegal.email || '',
          representanteTelefono: empresa.representanteLegal.telefono || '',
          emailContacto: empresa.emailContacto || '',
          telefonoContacto: empresa.telefonoContacto || '',
          sitioWeb: empresa.sitioWeb || ''
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando empresa:', error);
        this.snackBar.open('Error al cargar la empresa', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  validarRuc(ruc: string): void {
    if (ruc && ruc.length === 11) {
      this.empresaService.validarRuc(ruc).subscribe({
        next: (result) => {
          if (!result.valido) {
            this.empresaForm.get('ruc')?.setErrors({ invalidRuc: true });
            this.snackBar.open('RUC no válido', 'Cerrar', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error validando RUC:', error);
        }
      });
    }
  }

  isBasicInfoValid(): boolean {
    const basicControls = ['ruc', 'razonSocialPrincipal', 'direccionFiscal', 'estado'];
    return basicControls.every(control => this.empresaForm.get(control)?.valid);
  }

  isRepresentanteValid(): boolean {
    const representanteControls = ['representanteDni', 'representanteNombres', 'representanteApellidos'];
    return representanteControls.every(control => this.empresaForm.get(control)?.valid);
  }

  isContactInfoValid(): boolean {
    return true; // Los campos de contacto son opcionales
  }

  getEstadoDisplayName(estado: string): string {
    const estados: { [key: string]: string } = {
      'HABILITADA': 'Habilitada',
      'EN_TRAMITE': 'En Trámite',
      'SUSPENDIDA': 'Suspendida',
      'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
  }

  onSubmit(): void {
    if (this.empresaForm.valid) {
      this.isSubmitting = true;
      
      const formData = this.empresaForm.value;
      const empresaData = {
        ruc: formData.ruc,
        razonSocial: {
          principal: formData.razonSocialPrincipal,
          sunat: formData.razonSocialPrincipal,
          minimo: formData.razonSocialPrincipal
        },
        direccionFiscal: formData.direccionFiscal,
        estado: formData.estado,
        representanteLegal: {
          dni: formData.representanteDni,
          nombres: formData.representanteNombres,
          apellidos: formData.representanteApellidos,
          email: formData.representanteEmail || undefined,
          telefono: formData.representanteTelefono || undefined,
          direccion: formData.direccionFiscal
        },
        emailContacto: formData.emailContacto || undefined,
        telefonoContacto: formData.telefonoContacto || undefined,
        sitioWeb: formData.sitioWeb || undefined
      };

      const request = this.isEditing 
        ? this.empresaService.updateEmpresa(this.empresaId!, empresaData)
        : this.empresaService.createEmpresa(empresaData);

      request.subscribe({
        next: (empresa) => {
          this.isSubmitting = false;
          const message = this.isEditing ? 'Empresa actualizada exitosamente' : 'Empresa creada exitosamente';
          this.snackBar.open(message, 'Cerrar', { duration: 3000 });
          this.router.navigate(['/empresas', empresa.id]);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error guardando empresa:', error);
          const message = this.isEditing ? 'Error al actualizar empresa' : 'Error al crear empresa';
          this.snackBar.open(message, 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  volver(): void {
    this.router.navigate(['/empresas']);
  }
} 