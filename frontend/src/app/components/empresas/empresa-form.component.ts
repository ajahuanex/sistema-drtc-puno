import { Component, OnInit, ChangeDetectorRef, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
import { MatDividerModule } from '@angular/material/divider';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { Empresa, EmpresaCreate, EmpresaUpdate, EstadoEmpresa } from '../../models/empresa.model';

@Component({
  selector: 'app-empresa-form',
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
    MatChipsModule,
    MatTooltipModule,
    MatStepperModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>{{ isEditing() ? 'EDITAR EMPRESA' : 'NUEVA EMPRESA' }}</h1>
        </div>
        <p class="header-subtitle">
          {{ isEditing() ? 'MODIFICAR INFORMACIÓN DE LA EMPRESA' : 'REGISTRAR NUEVA EMPRESA DE TRANSPORTE' }}
        </p>
      </div>
      <div class="header-actions">
        <button mat-button color="accent" (click)="volver()" class="action-button">
          <mat-icon>arrow_back</mat-icon>
          VOLVER
        </button>
      </div>
    </div>

    <div class="content-section">
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <div class="loading-content">
            <mat-spinner diameter="60" class="loading-spinner"></mat-spinner>
            <h3>{{ isEditing() ? 'CARGANDO EMPRESA...' : 'PROCESANDO...' }}</h3>
            <p>{{ isEditing() ? 'OBTENIENDO INFORMACIÓN DE LA EMPRESA' : 'GUARDANDO INFORMACIÓN' }}</p>
          </div>
        </div>
      }

      <!-- Form -->
      @if (!isLoading()) {
        <div class="form-container">
          <form [formGroup]="empresaForm" (ngSubmit)="onSubmit()" class="empresa-form">
            <mat-stepper #stepper class="stepper">
              <!-- Paso 1: Información Básica -->
              <mat-step [stepControl]="empresaForm" label="INFORMACIÓN BÁSICA">
                <div class="step-content">
                  <mat-card class="form-card">
                    <mat-card-header class="form-card-header">
                      <mat-card-title>
                        <mat-icon>business</mat-icon>
                        INFORMACIÓN BÁSICA
                      </mat-card-title>
                      <mat-card-subtitle>DATOS PRINCIPALES DE LA EMPRESA</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="form-grid">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>RUC</mat-label>
                          <input matInput formControlName="ruc" 
                                 placeholder="20123456789" 
                                 maxlength="11"
                                 [readonly]="isEditing()"
                                 (blur)="validarRuc(empresaForm.get('ruc')?.value)">
                          <mat-icon matSuffix>business</mat-icon>
                          <mat-error *ngIf="empresaForm.get('ruc')?.hasError('required')">
                            EL RUC ES OBLIGATORIO
                          </mat-error>
                          <mat-error *ngIf="empresaForm.get('ruc')?.hasError('pattern')">
                            EL RUC DEBE TENER 11 DÍGITOS
                          </mat-error>
                          <mat-error *ngIf="empresaForm.get('ruc')?.hasError('invalidRuc')">
                            RUC NO VÁLIDO O YA EXISTE
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>RAZÓN SOCIAL</mat-label>
                          <input matInput formControlName="razonSocialPrincipal" 
                                 placeholder="EMPRESA DE TRANSPORTES S.A.C."
                                 maxlength="200">
                          <mat-error *ngIf="empresaForm.get('razonSocialPrincipal')?.hasError('required')">
                            LA RAZÓN SOCIAL ES OBLIGATORIA
                          </mat-error>
                          <mat-error *ngIf="empresaForm.get('razonSocialPrincipal')?.hasError('maxlength')">
                            MÁXIMO 200 CARACTERES
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>DIRECCIÓN FISCAL</mat-label>
                          <input matInput formControlName="direccionFiscal" 
                                 placeholder="AV. PRINCIPAL 123, CIUDAD"
                                 maxlength="500">
                          <mat-error *ngIf="empresaForm.get('direccionFiscal')?.hasError('required')">
                            LA DIRECCIÓN FISCAL ES OBLIGATORIA
                          </mat-error>
                          <mat-error *ngIf="empresaForm.get('direccionFiscal')?.hasError('maxlength')">
                            MÁXIMO 500 CARACTERES
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>ESTADO</mat-label>
                          <mat-select formControlName="estado" required>
                            <mat-option value="EN_TRAMITE">EN TRÁMITE</mat-option>
                            <mat-option value="HABILITADA">HABILITADA</mat-option>
                            <mat-option value="SUSPENDIDA">SUSPENDIDA</mat-option>
                            <mat-option value="CANCELADA">CANCELADA</mat-option>
                          </mat-select>
                          <mat-error *ngIf="empresaForm.get('estado')?.hasError('required')">
                            EL ESTADO ES OBLIGATORIO
                          </mat-error>
                        </mat-form-field>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
                <div class="step-actions">
                  <button mat-button type="button" (click)="volver()">
                    <mat-icon>cancel</mat-icon>
                    CANCELAR
                  </button>
                  <button mat-raised-button color="primary" 
                          type="button"
                          [disabled]="!isBasicInfoValid()"
                          (click)="stepper.next()">
                    <mat-icon>arrow_forward</mat-icon>
                    SIGUIENTE
                  </button>
                </div>
              </mat-step>

              <!-- Paso 2: Representante Legal -->
              <mat-step [stepControl]="empresaForm" label="REPRESENTANTE LEGAL">
                <div class="step-content">
                  <mat-card class="form-card">
                    <mat-card-header class="form-card-header">
                      <mat-card-title>
                        <mat-icon>person</mat-icon>
                        REPRESENTANTE LEGAL
                      </mat-card-title>
                      <mat-card-subtitle>INFORMACIÓN DE LA PERSONA REPRESENTANTE</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="form-grid">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>DNI</mat-label>
                          <input matInput formControlName="representanteDni" 
                                 placeholder="12345678"
                                 maxlength="8">
                          <mat-error *ngIf="empresaForm.get('representanteDni')?.hasError('required')">
                            EL DNI ES OBLIGATORIO
                          </mat-error>
                          <mat-error *ngIf="empresaForm.get('representanteDni')?.hasError('pattern')">
                            EL DNI DEBE TENER 8 DÍGITOS
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>NOMBRES</mat-label>
                          <input matInput formControlName="representanteNombres" 
                                 placeholder="JUAN CARLOS"
                                 maxlength="100">
                          <mat-error *ngIf="empresaForm.get('representanteNombres')?.hasError('required')">
                            LOS NOMBRES SON OBLIGATORIOS
                          </mat-error>
                          <mat-error *ngIf="empresaForm.get('representanteNombres')?.hasError('maxlength')">
                            MÁXIMO 100 CARACTERES
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>APELLIDOS</mat-label>
                          <input matInput formControlName="representanteApellidos" 
                                 placeholder="PÉREZ QUISPE"
                                 maxlength="100">
                          <mat-error *ngIf="empresaForm.get('representanteApellidos')?.hasError('required')">
                            LOS APELLIDOS SON OBLIGATORIOS
                          </mat-error>
                          <mat-error *ngIf="empresaForm.get('representanteApellidos')?.hasError('maxlength')">
                            MÁXIMO 100 CARACTERES
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>EMAIL</mat-label>
                          <input matInput formControlName="representanteEmail" 
                                 placeholder="representante@empresa.com"
                                 type="email">
                          <mat-error *ngIf="empresaForm.get('representanteEmail')?.hasError('email')">
                            FORMATO DE EMAIL INVÁLIDO
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>TELÉFONO</mat-label>
                          <input matInput formControlName="representanteTelefono" 
                                 placeholder="951234567">
                        </mat-form-field>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
                <div class="step-actions">
                  <button mat-button type="button" (click)="stepper.previous()">
                    <mat-icon>arrow_back</mat-icon>
                    ANTERIOR
                  </button>
                  <button mat-raised-button color="primary" 
                          type="button"
                          [disabled]="!isRepresentanteValid()"
                          (click)="stepper.next()">
                    <mat-icon>arrow_forward</mat-icon>
                    SIGUIENTE
                  </button>
                </div>
              </mat-step>

              <!-- Paso 3: Información de Contacto -->
              <mat-step [stepControl]="empresaForm" label="INFORMACIÓN DE CONTACTO">
                <div class="step-content">
                  <mat-card class="form-card">
                    <mat-card-header class="form-card-header">
                      <mat-card-title>
                        <mat-icon>contact_mail</mat-icon>
                        INFORMACIÓN DE CONTACTO
                      </mat-card-title>
                      <mat-card-subtitle>DATOS PARA COMUNICACIÓN CON LA EMPRESA</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="form-grid">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>EMAIL DE CONTACTO</mat-label>
                          <input matInput formControlName="emailContacto" 
                                 placeholder="info@empresa.com"
                                 type="email">
                          <mat-error *ngIf="empresaForm.get('emailContacto')?.hasError('email')">
                            FORMATO DE EMAIL INVÁLIDO
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>TELÉFONO DE CONTACTO</mat-label>
                          <input matInput formControlName="telefonoContacto" 
                                 placeholder="951234567">
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>SITIO WEB</mat-label>
                          <input matInput formControlName="sitioWeb" 
                                 placeholder="www.empresa.com">
                        </mat-form-field>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
                <div class="step-actions">
                  <button mat-button type="button" (click)="stepper.previous()">
                    <mat-icon>arrow_back</mat-icon>
                    ANTERIOR
                  </button>
                  <button mat-raised-button color="primary" 
                          type="button"
                          [disabled]="!isContactInfoValid()"
                          (click)="stepper.next()">
                    <mat-icon>arrow_forward</mat-icon>
                    SIGUIENTE
                  </button>
                </div>
              </mat-step>

              <!-- Paso 4: Revisión -->
              <mat-step label="REVISIÓN">
                <div class="step-content">
                  <mat-card class="form-card">
                    <mat-card-header class="form-card-header">
                      <mat-card-title>
                        <mat-icon>preview</mat-icon>
                        REVISIÓN DE DATOS
                      </mat-card-title>
                      <mat-card-subtitle>VERIFICA QUE LA INFORMACIÓN SEA CORRECTA</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="review-section">
                        <h3>INFORMACIÓN BÁSICA</h3>
                        <div class="review-grid">
                          <div class="review-item">
                            <span class="review-label">RUC:</span>
                            <span class="review-value">{{ empresaForm.get('ruc')?.value }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">RAZÓN SOCIAL:</span>
                            <span class="review-value">{{ empresaForm.get('razonSocialPrincipal')?.value }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">DIRECCIÓN:</span>
                            <span class="review-value">{{ empresaForm.get('direccionFiscal')?.value }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">ESTADO:</span>
                            <span class="review-value">{{ getEstadoDisplayName(empresaForm.get('estado')?.value) }}</span>
                          </div>
                        </div>

                        <h3>REPRESENTANTE LEGAL</h3>
                        <div class="review-grid">
                          <div class="review-item">
                            <span class="review-label">DNI:</span>
                            <span class="review-value">{{ empresaForm.get('representanteDni')?.value }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">NOMBRES:</span>
                            <span class="review-value">{{ empresaForm.get('representanteNombres')?.value }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">APELLIDOS:</span>
                            <span class="review-value">{{ empresaForm.get('representanteApellidos')?.value }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">EMAIL:</span>
                            <span class="review-value">{{ empresaForm.get('representanteEmail')?.value || 'NO ESPECIFICADO' }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">TELÉFONO:</span>
                            <span class="review-value">{{ empresaForm.get('representanteTelefono')?.value || 'NO ESPECIFICADO' }}</span>
                          </div>
                        </div>

                        <h3>INFORMACIÓN DE CONTACTO</h3>
                        <div class="review-grid">
                          <div class="review-item">
                            <span class="review-label">EMAIL:</span>
                            <span class="review-value">{{ empresaForm.get('emailContacto')?.value || 'NO ESPECIFICADO' }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">TELÉFONO:</span>
                            <span class="review-value">{{ empresaForm.get('telefonoContacto')?.value || 'NO ESPECIFICADO' }}</span>
                          </div>
                          <div class="review-item">
                            <span class="review-label">SITIO WEB:</span>
                            <span class="review-value">{{ empresaForm.get('sitioWeb')?.value || 'NO ESPECIFICADO' }}</span>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
                <div class="step-actions">
                  <button mat-button type="button" (click)="stepper.previous()">
                    <mat-icon>arrow_back</mat-icon>
                    ANTERIOR
                  </button>
                  <button mat-raised-button color="primary" 
                          type="submit"
                          [disabled]="empresaForm.invalid || isSubmitting()">
                    @if (isSubmitting()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    }
                    {{ isEditing() ? 'ACTUALIZAR' : 'CREAR' }} EMPRESA
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
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      flex-grow: 1;
      margin-right: 24px;
    }

    .header-title h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .header-subtitle {
      margin: 8px 0 0 0;
      font-size: 18px;
      opacity: 0.9;
      text-transform: uppercase;
      font-weight: 500;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-height: 48px;
      padding: 0 24px;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
    }

    .action-button:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
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
      font-weight: 600;
      text-transform: uppercase;
    }

    .loading-content p {
      margin: 0;
      color: #6c757d;
      text-transform: uppercase;
      font-weight: 500;
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
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: none;
      overflow: hidden;
    }

    .form-card-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
    }

    .form-card-header mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0;
    }

    .form-card-header mat-card-subtitle {
      font-size: 16px;
      opacity: 0.9;
      text-transform: uppercase;
      font-weight: 500;
      margin: 8px 0 0 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-top: 24px;
      padding: 0 24px 24px 24px;
    }

    .form-field {
      width: 100%;
    }

    .step-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      padding: 24px;
      border-top: 2px solid #e9ecef;
      background: #f8f9fa;
    }

    .step-actions button {
      min-width: 140px;
      height: 48px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 8px;
    }

    .review-section {
      margin: 16px 0;
      padding: 0 24px 24px 24px;
    }

    .review-section h3 {
      color: #2c3e50;
      font-weight: 700;
      margin: 32px 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 3px solid #667eea;
      text-transform: uppercase;
      font-size: 18px;
    }

    .review-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .review-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      border: 2px solid #dee2e6;
      transition: all 0.3s ease;
    }

    .review-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border-color: #667eea;
    }

    .review-label {
      font-weight: 700;
      color: #2c3e50;
      text-transform: uppercase;
      font-size: 14px;
    }

    .review-value {
      color: #6c757d;
      font-weight: 600;
      font-size: 16px;
      text-transform: uppercase;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 20px;
        text-align: center;
        padding: 20px;
      }

      .header-title h1 {
        font-size: 24px;
      }

      .header-subtitle {
        font-size: 16px;
      }

      .form-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .review-grid {
        grid-template-columns: 1fr;
      }

      .step-actions {
        flex-direction: column;
        gap: 16px;
        align-items: center;
      }

      .step-actions button {
        width: 100%;
        max-width: 300px;
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

  // Signals
  isLoading = signal(false);
  isSubmitting = signal(false);
  empresaId = signal<string | undefined>(undefined);

  // Computed properties
  isEditing = computed(() => !!this.empresaId());

  empresaForm: FormGroup;

  constructor() {
    this.empresaForm = this.fb.group({
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      razonSocialPrincipal: ['', [Validators.required, Validators.maxLength(200)]],
      direccionFiscal: ['', [Validators.required, Validators.maxLength(500)]],
      estado: ['EN_TRAMITE', [Validators.required]],
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
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.empresaId.set(id);
      this.loadEmpresa();
    }
  }

  loadEmpresa(): void {
    const id = this.empresaId();
    if (!id) return;

    this.isLoading.set(true);
    this.empresaService.getEmpresa(id).subscribe({
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
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('ERROR CARGANDO EMPRESA:', error);
        this.snackBar.open('ERROR AL CARGAR LA EMPRESA', 'CERRAR', { duration: 3000 });
        this.isLoading.set(false);
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
            this.snackBar.open('RUC NO VÁLIDO O YA EXISTE', 'CERRAR', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('ERROR VALIDANDO RUC:', error);
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
    return true; // LOS CAMPOS DE CONTACTO SON OPCIONALES
  }

  getEstadoDisplayName(estado: string): string {
    const estados: { [key: string]: string } = {
      'HABILITADA': 'HABILITADA',
      'EN_TRAMITE': 'EN TRÁMITE',
      'SUSPENDIDA': 'SUSPENDIDA',
      'CANCELADA': 'CANCELADA'
    };
    return estados[estado] || estado;
  }

  onSubmit(): void {
    if (this.empresaForm.valid) {
      this.isSubmitting.set(true);

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

      const id = this.empresaId();
      const request = this.isEditing()
        ? this.empresaService.updateEmpresa(id!, empresaData)
        : this.empresaService.createEmpresa(empresaData);

      request.subscribe({
        next: (empresa) => {
          this.isSubmitting.set(false);
          const message = this.isEditing() ? 'EMPRESA ACTUALIZADA EXITOSAMENTE' : 'EMPRESA CREADA EXITOSAMENTE';
          this.snackBar.open(message, 'CERRAR', { duration: 3000 });
          this.router.navigate(['/empresas', empresa.id]);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          console.error('ERROR GUARDANDO EMPRESA:', error);
          const message = this.isEditing() ? 'ERROR AL ACTUALIZAR EMPRESA' : 'ERROR AL CREAR EMPRESA';
          this.snackBar.open(message, 'CERRAR', { duration: 3000 });
        }
      });
    }
  }

  volver(): void {
    this.router.navigate(['/empresas']);
  }
} 
