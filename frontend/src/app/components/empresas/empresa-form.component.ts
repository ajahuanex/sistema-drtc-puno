import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa, EmpresaCreate, EmpresaUpdate, TipoSocio, Socio } from '../../models/empresa.model';

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
    MatSnackBarModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    MatStepperModule
  ],
  template: `
    <div class="page-container">
      <!-- HEADER -->
      <div class="page-header">
        <button mat-stroked-button (click)="volver()">
          <mat-icon>arrow_back</mat-icon> Volver
        </button>
        <div class="header-title">
          <mat-icon class="h-icon">{{ isEditing() ? 'edit_note' : 'add_business' }}</mat-icon>
          <div>
            <h1>{{ isEditing() ? 'Editar Empresa' : 'Registrar Nueva Empresa' }}</h1>
            @if (isEditing() && empresaActual()) {
              <span class="subtitle">{{ empresaActual()!.ruc }} — {{ empresaActual()!.razonSocial.principal }}</span>
            }
          </div>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-wrapper">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Cargando datos de la empresa...</span>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="guardar()">
          <div class="form-layout">
            
            <!-- COLUMNA IZQUIERDA -->
            <div class="col-left">
              
              <!-- SECCIÓN: DATOS BÁSICOS -->
              <mat-card class="form-section">
                <mat-card-header>
                  <mat-icon mat-card-avatar class="s-icon">business</mat-icon>
                  <mat-card-title>Datos de la Empresa</mat-card-title>
                  <mat-card-subtitle>Información legal y de registro</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="fields-grid">
                    <!-- RUC -->
                    <mat-form-field appearance="outline" class="col-span-1">
                      <mat-label>RUC</mat-label>
                      <mat-icon matPrefix>tag</mat-icon>
                      <input matInput formControlName="ruc" placeholder="20XXXXXXXXX" maxlength="11">
                      @if (form.get('ruc')?.hasError('required') && form.get('ruc')?.touched) {
                        <mat-error>El RUC es requerido</mat-error>
                      }
                      @if (form.get('ruc')?.hasError('pattern') && form.get('ruc')?.touched) {
                        <mat-error>El RUC debe tener 11 dígitos</mat-error>
                      }
                    </mat-form-field>

                    <!-- ESTADO -->
                    <mat-form-field appearance="outline" class="col-span-1">
                      <mat-label>Estado Legal</mat-label>
                      <mat-icon matPrefix>flag</mat-icon>
                      <mat-select formControlName="estado">
                        <mat-option value="AUTORIZADA">✅ Autorizada</mat-option>
                        <mat-option value="EN_TRAMITE">⏳ En Trámite</mat-option>
                        <mat-option value="SUSPENDIDA">⚠️ Suspendida</mat-option>
                        <mat-option value="CANCELADA">❌ Cancelada</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <!-- RAZÓN SOCIAL PRINCIPAL -->
                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Razón Social Principal</mat-label>
                      <mat-icon matPrefix>badge</mat-icon>
                      <input matInput formControlName="razonSocial" placeholder="Nombre oficial de la empresa">
                      @if (form.get('razonSocial')?.hasError('required') && form.get('razonSocial')?.touched) {
                        <mat-error>La razón social es requerida</mat-error>
                      }
                    </mat-form-field>

                    <!-- NOMBRE COMERCIAL / MÍNIMO -->
                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Nombre Comercial / Corto</mat-label>
                      <mat-icon matPrefix>short_text</mat-icon>
                      <input matInput formControlName="razonSocialMinimo" placeholder="Nombre abreviado o comercial (opcional)">
                      <mat-hint>Nombre con el que se conoce popularmente a la empresa</mat-hint>
                    </mat-form-field>

                    <!-- DIRECCIÓN FISCAL -->
                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Dirección Fiscal</mat-label>
                      <mat-icon matPrefix>location_on</mat-icon>
                      <input matInput formControlName="direccionFiscal" placeholder="Dirección completa registrada en SUNAT">
                      @if (form.get('direccionFiscal')?.hasError('required') && form.get('direccionFiscal')?.touched) {
                        <mat-error>La dirección fiscal es requerida</mat-error>
                      }
                    </mat-form-field>

                    <!-- TIPOS DE SERVICIO -->
                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Tipos de Servicio Autorizados</mat-label>
                      <mat-icon matPrefix>local_shipping</mat-icon>
                      <mat-select formControlName="tiposServicio" multiple>
                        <mat-option value="PASAJEROS">🚌 Pasajeros</mat-option>
                        <mat-option value="TURISMO">🏨 Turismo</mat-option>
                        <mat-option value="TRABAJADORES">👷 Trabajadores</mat-option>
                        <mat-option value="MERCANCIAS">📦 Mercancías</mat-option>
                        <mat-option value="CARGA">🚚 Carga</mat-option>
                        <mat-option value="INFRAESTRUCTURA">🏗️ Infraestructura</mat-option>
                        <mat-option value="MIXTO">🔀 Mixto</mat-option>
                        <mat-option value="OTROS">➕ Otros</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <!-- OBSERVACIONES -->
                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Observaciones</mat-label>
                      <mat-icon matPrefix>notes</mat-icon>
                      <textarea matInput formControlName="observaciones" rows="3" placeholder="Notas o información adicional"></textarea>
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- SECCIÓN: CONTACTO -->
              <mat-card class="form-section">
                <mat-card-header>
                  <mat-icon mat-card-avatar class="s-icon">contact_mail</mat-icon>
                  <mat-card-title>Datos de Contacto</mat-card-title>
                  <mat-card-subtitle>Correo, teléfono y web institucional</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="fields-grid">
                    <mat-form-field appearance="outline" class="col-span-1">
                      <mat-label>Correo Electrónico</mat-label>
                      <mat-icon matPrefix>email</mat-icon>
                      <input matInput type="email" formControlName="emailContacto" placeholder="contacto@empresa.com">
                      @if (form.get('emailContacto')?.hasError('email')) {
                        <mat-error>Correo electrónico inválido</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="col-span-1">
                      <mat-label>Teléfono</mat-label>
                      <mat-icon matPrefix>phone</mat-icon>
                      <input matInput formControlName="telefonoContacto" placeholder="9XXXXXXXX">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Sitio Web</mat-label>
                      <mat-icon matPrefix>language</mat-icon>
                      <input matInput formControlName="sitioWeb" placeholder="https://www.empresa.com">
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- COLUMNA DERECHA: SOCIOS -->
            <div class="col-right">
              <mat-card class="form-section socios-section">
                <mat-card-header>
                  <mat-icon mat-card-avatar class="s-icon">groups</mat-icon>
                  <mat-card-title>Representantes y Socios</mat-card-title>
                  <mat-card-subtitle>Directorio de personas apoderadas</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div formArrayName="socios" class="socios-list">
                    @for (socioCtrl of sociosArray.controls; track $index) {
                      <div [formGroupName]="$index" class="socio-block mat-elevation-z1">
                        <div class="socio-block-header">
                          <div class="s-num">
                            <span>Persona {{ $index + 1 }}</span>
                            @if (socioCtrl.get('tipoSocio')?.value === 'REPRESENTANTE_LEGAL') {
                              <span class="badge-rep">Rep. Legal</span>
                            }
                          </div>
                          <button mat-icon-button color="warn" type="button" (click)="eliminarSocio($index)"
                            [disabled]="sociosArray.length === 1"
                            matTooltip="Eliminar esta persona">
                            <mat-icon>delete_outline</mat-icon>
                          </button>
                        </div>

                        <div class="fields-grid compact">
                          <!-- ROL -->
                          <mat-form-field appearance="outline" class="col-span-2">
                            <mat-label>Cargo / Rol</mat-label>
                            <mat-icon matPrefix>work</mat-icon>
                            <mat-select formControlName="tipoSocio">
                              <mat-option value="REPRESENTANTE_LEGAL">⭐ Representante Legal</mat-option>
                              <mat-option value="GERENTE">🏢 Gerente</mat-option>
                              <mat-option value="ADMINISTRADOR">👔 Administrador</mat-option>
                              <mat-option value="SOCIO">👤 Socio</mat-option>
                              <mat-option value="APODERADO">📜 Apoderado</mat-option>
                            </mat-select>
                          </mat-form-field>

                          <!-- DNI -->
                          <mat-form-field appearance="outline" class="col-span-1">
                            <mat-label>DNI</mat-label>
                            <mat-icon matPrefix>badge</mat-icon>
                            <input matInput formControlName="dni" placeholder="XXXXXXXX" maxlength="8">
                            @if (socioCtrl.get('dni')?.hasError('required') && socioCtrl.get('dni')?.touched) {
                              <mat-error>DNI requerido</mat-error>
                            }
                          </mat-form-field>

                          <!-- NOMBRES -->
                          <mat-form-field appearance="outline" class="col-span-1">
                            <mat-label>Nombres</mat-label>
                            <input matInput formControlName="nombres" placeholder="Nombres completos">
                            @if (socioCtrl.get('nombres')?.hasError('required') && socioCtrl.get('nombres')?.touched) {
                              <mat-error>Nombres requeridos</mat-error>
                            }
                          </mat-form-field>

                          <!-- APELLIDOS -->
                          <mat-form-field appearance="outline" class="col-span-2">
                            <mat-label>Apellidos</mat-label>
                            <input matInput formControlName="apellidos" placeholder="Apellidos completos">
                            @if (socioCtrl.get('apellidos')?.hasError('required') && socioCtrl.get('apellidos')?.touched) {
                              <mat-error>Apellidos requeridos</mat-error>
                            }
                          </mat-form-field>

                          <!-- EMAIL SOCIO -->
                          <mat-form-field appearance="outline" class="col-span-1">
                            <mat-label>Correo (Opcional)</mat-label>
                            <mat-icon matPrefix>email</mat-icon>
                            <input matInput type="email" formControlName="email" placeholder="persona@empresa.com">
                          </mat-form-field>

                          <!-- TEL SOCIO -->
                          <mat-form-field appearance="outline" class="col-span-1">
                            <mat-label>Teléfono (Opcional)</mat-label>
                            <mat-icon matPrefix>phone</mat-icon>
                            <input matInput formControlName="telefono" placeholder="9XXXXXXXX">
                          </mat-form-field>

                          <!-- DIRECCIÓN SOCIO -->
                          <mat-form-field appearance="outline" class="col-span-2">
                            <mat-label>Dirección (Opcional)</mat-label>
                            <mat-icon matPrefix>home</mat-icon>
                            <input matInput formControlName="direccion" placeholder="Dirección del representante">
                          </mat-form-field>
                        </div>
                      </div>
                    }
                  </div>

                  <button mat-stroked-button type="button" color="primary" (click)="agregarSocio()" class="add-socio-btn">
                    <mat-icon>person_add</mat-icon>
                    Agregar Persona / Socio
                  </button>
                </mat-card-content>
              </mat-card>
            </div>
          </div>

          <!-- ACCIONES -->
          <div class="form-footer">
            <button mat-stroked-button type="button" (click)="volver()">
              <mat-icon>close</mat-icon> Cancelar
            </button>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || isSubmitting()">
              <mat-icon [class.spin-icon]="isSubmitting()">{{ isSubmitting() ? 'sync' : 'save' }}</mat-icon>
              <span>{{ isSubmitting() ? 'Guardando...' : (isEditing() ? 'Actualizar Empresa' : 'Registrar Empresa') }}</span>
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* HEADER */
    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      .h-icon { font-size: 36px; width: 36px; height: 36px; color: #3f51b5; }
      h1 { margin: 0; font-size: 1.5rem; font-weight: 600; color: #1e293b; }
      .subtitle { font-size: 0.85rem; color: #64748b; }
    }

    .loading-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 40px;
      color: #64748b;
    }

    /* FORM LAYOUT */
    .form-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .form-layout { grid-template-columns: 1fr; }
    }

    .col-left, .col-right {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .col-right { position: sticky; top: 20px; }

    /* FORM SECTIONS */
    .form-section {
      border-radius: 8px;
      mat-card-header {
        margin-bottom: 16px;
        .s-icon { color: #3f51b5; }
        mat-card-title { font-size: 1.05rem; font-weight: 600; color: #1e293b; }
        mat-card-subtitle { font-size: 0.82rem; color: #64748b; }
      }
      mat-card-content { padding-top: 4px; }
    }

    /* FIELDS GRID */
    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 12px;
      &.compact { gap: 6px 10px; }
      .col-span-1 { grid-column: span 1; }
      .col-span-2 { grid-column: 1 / -1; }
      mat-form-field { width: 100%; }
    }
    @media (max-width: 600px) {
      .fields-grid { grid-template-columns: 1fr; .col-span-1 { grid-column: 1; } }
    }

    /* SOCIOS */
    .socios-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 12px;
    }

    .socio-block {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      background: #f8fafc;
      transition: border-color 0.2s;
      &:hover { border-color: #3f51b5; }
    }

    .socio-block-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      .s-num {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        color: #475569;
      }
      .badge-rep {
        background: #eef2ff;
        color: #3f51b5;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }
    }

    .add-socio-btn {
      width: 100%;
      margin-top: 4px;
    }

    /* FOOTER */
    .form-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
  `]
})
export class EmpresaFormComponent implements OnInit {
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  empresaActual = signal<Empresa | null>(null);
  empresaId: string | null = null;

  form: FormGroup;

  get sociosArray(): FormArray {
    return this.form.get('socios') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      razonSocial: ['', Validators.required],
      razonSocialMinimo: [''],
      direccionFiscal: ['', Validators.required],
      tiposServicio: [[]],
      estado: ['AUTORIZADA'],
      observaciones: [''],
      emailContacto: ['', Validators.email],
      telefonoContacto: [''],
      sitioWeb: [''],
      socios: this.fb.array([this.crearSocioGroup()])
    });
  }

  ngOnInit(): void {
    this.empresaId = this.route.snapshot.params['id'];
    if (this.empresaId) {
      this.isEditing.set(true);
      this.cargarEmpresa();
    }
  }

  crearSocioGroup(socio?: Partial<Socio>): FormGroup {
    return this.fb.group({
      tipoSocio: [socio?.tipoSocio || 'REPRESENTANTE_LEGAL'],
      dni: [socio?.dni || '', Validators.required],
      nombres: [socio?.nombres || '', Validators.required],
      apellidos: [socio?.apellidos || '', Validators.required],
      email: [socio?.email || ''],
      telefono: [socio?.telefono || ''],
      direccion: [socio?.direccion || '']
    });
  }

  agregarSocio(): void {
    this.sociosArray.push(this.crearSocioGroup());
  }

  eliminarSocio(index: number): void {
    if (this.sociosArray.length > 1) {
      this.sociosArray.removeAt(index);
    }
  }

  cargarEmpresa(): void {
    if (!this.empresaId) return;
    this.isLoading.set(true);

    this.empresaService.getEmpresa(this.empresaId).subscribe({
      next: (empresa) => {
        this.empresaActual.set(empresa);

        // Rellenar campos básicos
        this.form.patchValue({
          ruc: empresa.ruc,
          razonSocial: empresa.razonSocial.principal,
          razonSocialMinimo: empresa.razonSocial.minimo || '',
          direccionFiscal: empresa.direccionFiscal,
          estado: empresa.estado,
          observaciones: empresa.observaciones || '',
          emailContacto: empresa.emailContacto || '',
          telefonoContacto: empresa.telefonoContacto || '',
          sitioWeb: empresa.sitioWeb || '',
          tiposServicio: empresa.tiposServicio || []
        });

        // Rellenar socios dinámicamente
        while (this.sociosArray.length > 0) {
          this.sociosArray.removeAt(0);
        }

        if (empresa.socios && empresa.socios.length > 0) {
          empresa.socios.forEach(s => this.sociosArray.push(this.crearSocioGroup(s)));
        } else {
          this.sociosArray.push(this.crearSocioGroup());
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando empresa:', error);
        this.snackBar.open('Error al cargar la empresa', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);
    const v = this.form.value;

    const data: EmpresaCreate = {
      ruc: v.ruc.trim(),
      razonSocial: {
        principal: v.razonSocial.trim(),
        minimo: v.razonSocialMinimo?.trim() || undefined
      },
      direccionFiscal: v.direccionFiscal.trim(),
      tiposServicio: v.tiposServicio || [],
      estado: v.estado,
      socios: (v.socios as any[]).map(s => ({
        tipoSocio: s.tipoSocio,
        dni: s.dni.trim(),
        nombres: s.nombres.trim(),
        apellidos: s.apellidos.trim(),
        email: s.email?.trim() || undefined,
        telefono: s.telefono?.trim() || undefined,
        direccion: s.direccion?.trim() || undefined
      })),
      emailContacto: v.emailContacto?.trim() || undefined,
      telefonoContacto: v.telefonoContacto?.trim() || undefined,
      sitioWeb: v.sitioWeb?.trim() || undefined,
      observaciones: v.observaciones?.trim() || undefined
    };

    const request = this.isEditing() && this.empresaId
      ? this.empresaService.updateEmpresa(this.empresaId, data as EmpresaUpdate)
      : this.empresaService.createEmpresa(data);

    request.subscribe({
      next: (empresa) => {
        const msg = this.isEditing() ? 'Empresa actualizada correctamente' : 'Empresa registrada correctamente';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
        this.router.navigate(['/empresas', empresa.id]);
      },
      error: (error) => {
        console.error('Error guardando empresa:', error);
        const msg = error?.error?.detail || 'Error al guardar la empresa';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
        this.isSubmitting.set(false);
      }
    });
  }

  volver(): void {
    if (this.isEditing() && this.empresaId) {
      this.router.navigate(['/empresas', this.empresaId]);
    } else {
      this.router.navigate(['/empresas']);
    }
  }
}
