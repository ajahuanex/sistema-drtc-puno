import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { Empresa, EmpresaCreate, EmpresaUpdate } from '../../models/empresa.model';

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
    MatTooltipModule
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
      <div *ngIf="isLoading" class="loading-container">
        <div class="loading-content">
          <mat-spinner diameter="60" class="loading-spinner"></mat-spinner>
          <h3>{{ isEditing ? 'Cargando empresa...' : 'Procesando...' }}</h3>
          <p>{{ isEditing ? 'Obteniendo información de la empresa' : 'Guardando información' }}</p>
        </div>
      </div>

      <!-- Form -->
      <div *ngIf="!isLoading" class="form-container">
        <form [formGroup]="empresaForm" (ngSubmit)="onSubmit()" class="empresa-form">
          <div class="form-grid">
            <!-- Información Básica -->
            <mat-card class="form-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>business</mat-icon>
                  Información Básica
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>RUC</mat-label>
                    <input matInput formControlName="ruc" 
                           placeholder="20123456789" 
                           maxlength="11"
                           [readonly]="isEditing">
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
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Razón Social Principal</mat-label>
                    <input matInput formControlName="razonSocialPrincipal" 
                           placeholder="Transportes Puno S.A.C.">
                    <mat-error *ngIf="empresaForm.get('razonSocialPrincipal')?.hasError('required')">
                      La razón social es obligatoria
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Razón Social SUNAT</mat-label>
                    <input matInput formControlName="razonSocialSunat" 
                           placeholder="Razón social según SUNAT">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Razón Social Mínima</mat-label>
                    <input matInput formControlName="razonSocialMinima" 
                           placeholder="Razón social mínima">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field full-width">
                    <mat-label>Dirección Fiscal</mat-label>
                    <textarea matInput formControlName="direccionFiscal" 
                              placeholder="Av. Principal 123, Puno, Puno"
                              rows="3"></textarea>
                    <mat-error *ngIf="empresaForm.get('direccionFiscal')?.hasError('required')">
                      La dirección fiscal es obligatoria
                    </mat-error>
                    <mat-error *ngIf="empresaForm.get('direccionFiscal')?.hasError('minlength')">
                      La dirección debe tener al menos 10 caracteres
                    </mat-error>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Representante Legal -->
            <mat-card class="form-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>person</mat-icon>
                  Representante Legal
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>DNI</mat-label>
                    <input matInput formControlName="representanteDni" 
                           placeholder="12345678"
                           maxlength="8">
                    <mat-error *ngIf="empresaForm.get('representanteDni')?.hasError('required')">
                      El DNI es obligatorio
                    </mat-error>
                    <mat-error *ngIf="empresaForm.get('representanteDni')?.hasError('pattern')">
                      El DNI debe tener 8 dígitos
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field full-width">
                    <mat-label>Nombres Completos</mat-label>
                    <input matInput formControlName="representanteNombres" 
                           placeholder="Juan Carlos Pérez Quispe">
                    <mat-error *ngIf="empresaForm.get('representanteNombres')?.hasError('required')">
                      Los nombres son obligatorios
                    </mat-error>
                    <mat-error *ngIf="empresaForm.get('representanteNombres')?.hasError('minlength')">
                      Los nombres deben tener al menos 2 caracteres
                    </mat-error>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Estado (solo para edición) -->
            <mat-card class="form-card" *ngIf="isEditing">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>settings</mat-icon>
                  Estado de la Empresa
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Estado</mat-label>
                    <mat-select formControlName="estado">
                      <mat-option value="HABILITADA">Habilitada</mat-option>
                      <mat-option value="EN_TRAMITE">En Trámite</mat-option>
                      <mat-option value="SUSPENDIDA">Suspendida</mat-option>
                      <mat-option value="CANCELADA">Cancelada</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button mat-button type="button" (click)="volver()" class="secondary-button">
              <mat-icon>cancel</mat-icon>
              Cancelar
            </button>
            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="empresaForm.invalid || isSubmitting"
                    class="primary-button">
              <mat-icon>{{ isSubmitting ? 'hourglass_empty' : (isEditing ? 'save' : 'add') }}</mat-icon>
              <span *ngIf="!isSubmitting">{{ isEditing ? 'Guardar Cambios' : 'Crear Empresa' }}</span>
              <span *ngIf="isSubmitting">Guardando...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-content {
      flex-grow: 1;
      margin-right: 20px;
    }

    .header-title {
      display: flex;
      align-items: center;
    }

    .header-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #333;
    }

    .header-subtitle {
      margin: 0;
      font-size: 16px;
      color: #666;
    }

    .header-actions {
      display: flex;
      align-items: center;
    }

    .action-button {
      margin-left: 10px;
    }

    .content-section {
      padding: 20px;
    }

    .loading-container {
      text-align: center;
      padding: 40px 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .loading-spinner {
      margin-bottom: 15px;
    }

    .loading-content h3 {
      color: #555;
      margin-bottom: 8px;
    }

    .loading-content p {
      color: #888;
      font-size: 14px;
    }

    .form-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .empresa-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }

    .form-card {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .form-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .form-card mat-card-header {
      padding: 16px 16px 0 16px;
    }

    .form-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .form-card mat-card-content {
      padding: 16px;
    }

    .form-row {
      margin-bottom: 16px;
    }

    .form-field {
      width: 100%;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      padding: 20px 0;
      border-top: 1px solid #e0e0e0;
      margin-top: 20px;
    }

    .primary-button, .secondary-button {
      padding: 8px 24px;
      border-radius: 8px;
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
    }

    .primary-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .secondary-button:hover {
      background-color: #f5f5f5;
    }

    mat-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .primary-button, .secondary-button {
        width: 100%;
      }
    }

    /* Animations */
    .loading-spinner {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }

    /* Form Field Improvements */
    .mat-form-field {
      margin-bottom: 8px;
    }

    .mat-form-field-wrapper {
      margin-bottom: 0;
    }

    /* Card Improvements */
    .form-card mat-card-header {
      background-color: #f8f9fa;
      border-radius: 8px 8px 0 0;
    }

    .form-card mat-card-title mat-icon {
      color: #1976d2;
    }
  `]
})
export class EmpresaFormComponent implements OnInit {
  empresaForm: FormGroup;
  isEditing = false;
  isLoading = false;
  isSubmitting = false;
  empresaId?: string;

  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.empresaForm = this.fb.group({
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      razonSocialPrincipal: ['', [Validators.required, Validators.minLength(2)]],
      razonSocialSunat: [''],
      razonSocialMinima: [''],
      direccionFiscal: ['', [Validators.required, Validators.minLength(10)]],
      representanteDni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      representanteNombres: ['', [Validators.required, Validators.minLength(2)]],
      estado: ['EN_TRAMITE']
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.empresaId = params['id'];
        this.loadEmpresa();
      }
    });

    // Validación de RUC en tiempo real
    this.empresaForm.get('ruc')?.valueChanges.subscribe(ruc => {
      if (ruc && ruc.length === 11 && !this.isEditing) {
        this.validarRuc(ruc);
      }
    });
  }

  loadEmpresa(): void {
    if (!this.empresaId) return;

    this.isLoading = true;
    this.empresaService.getEmpresaById(this.empresaId).subscribe({
      next: (empresa) => {
        this.empresaForm.patchValue({
          ruc: empresa.ruc,
          razonSocialPrincipal: empresa.razonSocial.principal,
          razonSocialSunat: empresa.razonSocial.sunat || '',
          razonSocialMinima: empresa.razonSocial.minimo || '',
          direccionFiscal: empresa.direccionFiscal,
          representanteDni: empresa.representanteLegal.dni,
          representanteNombres: empresa.representanteLegal.nombres,
          estado: empresa.estado
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando empresa:', error);
        this.isLoading = false;
        this.snackBar.open('Error al cargar la empresa', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.router.navigate(['/empresas']);
      }
    });
  }

  validarRuc(ruc: string): void {
    this.empresaService.validarRuc(ruc).subscribe({
      next: (result) => {
        if (!result.valido) {
          this.empresaForm.get('ruc')?.setErrors({ rucExists: true });
        }
      },
      error: (error) => {
        console.error('Error validando RUC:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.empresaForm.invalid) {
      this.snackBar.open('Por favor, complete todos los campos requeridos', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    this.isSubmitting = true;
    const formValue = this.empresaForm.value;

    const empresaData = {
      ruc: formValue.ruc,
      razonSocial: {
        principal: formValue.razonSocialPrincipal,
        sunat: formValue.razonSocialSunat || undefined,
        minimo: formValue.razonSocialMinima || undefined
      },
      direccionFiscal: formValue.direccionFiscal,
      representanteLegal: {
        dni: formValue.representanteDni,
        nombres: formValue.representanteNombres,
        apellidos: formValue.representanteNombres // Usar nombres como apellidos temporalmente
      }
    };

    if (this.isEditing && this.empresaId) {
      // Actualizar empresa
      const updateData: EmpresaUpdate = {
        ...empresaData,
        estado: formValue.estado
      };

      this.empresaService.updateEmpresa(this.empresaId, updateData).subscribe({
        next: () => {
          this.snackBar.open('Empresa actualizada exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.router.navigate(['/empresas']);
        },
        error: (error) => {
          console.error('Error actualizando empresa:', error);
          this.isSubmitting = false;
          this.snackBar.open('Error al actualizar la empresa', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.cdr.detectChanges();
        }
      });
    } else {
      // Crear nueva empresa
      this.empresaService.createEmpresa(empresaData as EmpresaCreate).subscribe({
        next: () => {
          this.snackBar.open('Empresa creada exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.router.navigate(['/empresas']);
        },
        error: (error) => {
          console.error('Error creando empresa:', error);
          this.isSubmitting = false;
          this.snackBar.open('Error al crear la empresa', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.cdr.detectChanges();
        }
      });
    }
  }

  volver(): void {
    this.router.navigate(['/empresas']);
  }
} 