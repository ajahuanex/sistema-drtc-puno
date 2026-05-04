import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { EmpresaService } from '../../services/empresa.service';
import { EmpresaCreate, EmpresaUpdate, TipoSocio } from '../../models/empresa.model';

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
    MatExpansionModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>{{ isEditing() ? 'Editar Empresa' : 'Nueva Empresa' }}</h1>
      </div>

      <div class="content-section">
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando...</p>
          </div>
        } @else {
          <mat-card class="form-card">
            <mat-card-content>
              <form [formGroup]="form" (ngSubmit)="guardar()">
                <!-- Datos Básicos -->
                <mat-expansion-panel expanded="true">
                  <mat-expansion-panel-header>
                    <mat-panel-title>Datos Básicos</mat-panel-title>
                  </mat-expansion-panel-header>

                  <div class="form-grid">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>RUC</mat-label>
                      <input matInput formControlName="ruc" placeholder="11 dígitos">
                      @if (form.get('ruc')?.hasError('required')) {
                        <mat-error>RUC es requerido</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Razón Social</mat-label>
                      <input matInput formControlName="razonSocial" placeholder="Nombre de la empresa">
                      @if (form.get('razonSocial')?.hasError('required')) {
                        <mat-error>Razón social es requerida</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Dirección Fiscal</mat-label>
                      <input matInput formControlName="direccionFiscal" placeholder="Dirección completa">
                      @if (form.get('direccionFiscal')?.hasError('required')) {
                        <mat-error>Dirección es requerida</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Tipos de Servicio</mat-label>
                      <mat-select formControlName="tiposServicio" multiple>
                        <mat-option value="PERSONAS">Personas</mat-option>
                        <mat-option value="TURISMO">Turismo</mat-option>
                        <mat-option value="TRABAJADORES">Trabajadores</mat-option>
                        <mat-option value="MERCANCIAS">Mercancías</mat-option>
                        <mat-option value="ESTUDIANTES">Estudiantes</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Estado</mat-label>
                      <mat-select formControlName="estado">
                        <mat-option value="AUTORIZADA">Autorizada</mat-option>
                        <mat-option value="EN_TRAMITE">En Trámite</mat-option>
                        <mat-option value="SUSPENDIDA">Suspendida</mat-option>
                        <mat-option value="CANCELADA">Cancelada</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Observaciones</mat-label>
                      <textarea matInput formControlName="observaciones" rows="3"></textarea>
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

                <!-- Datos de Contacto -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Datos de Contacto</mat-panel-title>
                  </mat-expansion-panel-header>

                  <div class="form-grid">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Email de Contacto</mat-label>
                      <input matInput type="email" formControlName="emailContacto">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Teléfono de Contacto</mat-label>
                      <input matInput formControlName="telefonoContacto">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Sitio Web</mat-label>
                      <input matInput formControlName="sitioWeb">
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

                <!-- Representante Legal / Socio -->
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>Representante Legal / Socio</mat-panel-title>
                  </mat-expansion-panel-header>

                  <div class="form-grid">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Rol del Socio</mat-label>
                      <mat-select formControlName="representanteTipo">
                        <mat-option [value]="'REPRESENTANTE_LEGAL'">Representante Legal</mat-option>
                        <mat-option [value]="'GERENTE'">Gerente</mat-option>
                        <mat-option [value]="'ADMINISTRADOR'">Administrador</mat-option>
                        <mat-option [value]="'SOCIO'">Socio</mat-option>
                        <mat-option [value]="'APODERADO'">Apoderado</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>DNI</mat-label>
                      <input matInput formControlName="representanteDni" placeholder="8 dígitos">
                      @if (form.get('representanteDni')?.hasError('required')) {
                        <mat-error>DNI es requerido</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Nombres</mat-label>
                      <input matInput formControlName="representanteNombres">
                      @if (form.get('representanteNombres')?.hasError('required')) {
                        <mat-error>Nombres son requeridos</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Apellidos</mat-label>
                      <input matInput formControlName="representanteApellidos">
                      @if (form.get('representanteApellidos')?.hasError('required')) {
                        <mat-error>Apellidos son requeridos</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Email (Opcional)</mat-label>
                      <input matInput type="email" formControlName="representanteEmail">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Dirección (Opcional)</mat-label>
                      <input matInput formControlName="representanteDireccion">
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>

                <div class="form-actions">
                  <button mat-button (click)="volver()" type="button">
                    <mat-icon>close</mat-icon>
                    Cancelar
                  </button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="!form.valid || isSubmitting()">
                    @if (isSubmitting()) {
                      <ng-container>
                        <mat-spinner diameter="20"></mat-spinner>
                      </ng-container>
                    } @else {
                      <ng-container>
                        <mat-icon>save</mat-icon>
                        <span>Guardar</span>
                      </ng-container>
                    }
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        margin: 0;
        font-size: 2rem;
      }
    }

    .content-section {
      display: flex;
      justify-content: center;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
    }

    .form-card {
      width: 100%;
      max-width: 700px;

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1.5rem;

        .full-width {
          grid-column: 1 / -1;
        }
      }

      .personas-list {
        margin-bottom: 1rem;

        .persona-item {
          padding: 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          margin-bottom: 1rem;

          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr auto;
            gap: 0.5rem;
            align-items: flex-start;

            button {
              margin-top: 0.5rem;
            }
          }
        }
      }

      .add-button {
        margin-top: 1rem;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
      }
    }
  `]
})
export class EmpresaFormComponent implements OnInit {
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  empresaId: string | null = null;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      // Datos Básicos
      ruc: ['', Validators.required],
      razonSocial: ['', Validators.required],
      direccionFiscal: ['', Validators.required],
      tiposServicio: [[]],
      estado: ['AUTORIZADA'],
      observaciones: [''],
      // Datos de Contacto
      emailContacto: [''],
      telefonoContacto: [''],
      sitioWeb: [''],
      // Representante Legal / Socio
      representanteTipo: ['REPRESENTANTE_LEGAL'],
      representanteDni: ['', Validators.required],
      representanteNombres: ['', Validators.required],
      representanteApellidos: ['', Validators.required],
      representanteEmail: [''],
      representanteDireccion: ['']
    });
  }

  ngOnInit(): void {
    this.empresaId = this.route.snapshot.params['id'];
    if (this.empresaId) {
      this.isEditing.set(true);
      this.cargarEmpresa();
    }
  }

  cargarEmpresa(): void {
    if (!this.empresaId) return;

    this.isLoading.set(true);
    this.empresaService.getEmpresa(this.empresaId).subscribe({
      next: (empresa) => {
        this.form.patchValue({
          ruc: empresa.ruc,
          razonSocial: empresa.razonSocial.principal,
          direccionFiscal: empresa.direccionFiscal,
          estado: empresa.estado,
          observaciones: empresa.observaciones,
          emailContacto: empresa.emailContacto,
          telefonoContacto: empresa.telefonoContacto,
          sitioWeb: empresa.sitioWeb,
          tiposServicio: empresa.tiposServicio,
          // Socios - obtener el primer socio con rol REPRESENTANTE_LEGAL
          representanteDni: empresa.socios?.[0]?.dni || '',
          representanteNombres: empresa.socios?.[0]?.nombres || '',
          representanteApellidos: empresa.socios?.[0]?.apellidos || '',
          representanteEmail: empresa.socios?.[0]?.email || '',
          representanteDireccion: empresa.socios?.[0]?.direccion || ''
        });

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
    if (!this.form.valid) return;

    this.isSubmitting.set(true);
    const formValue = this.form.value;

    const data: EmpresaCreate = {
      ruc: formValue.ruc,
      razonSocial: { principal: formValue.razonSocial },
      direccionFiscal: formValue.direccionFiscal,
      tiposServicio: formValue.tiposServicio || [],
      socios: [
        {
          dni: formValue.representanteDni,
          nombres: formValue.representanteNombres,
          apellidos: formValue.representanteApellidos,
          tipoSocio: formValue.representanteTipo || TipoSocio.REPRESENTANTE_LEGAL,
          email: formValue.representanteEmail || undefined,
          direccion: formValue.representanteDireccion || undefined
        }
      ],
      emailContacto: formValue.emailContacto || undefined,
      telefonoContacto: formValue.telefonoContacto || undefined,
      sitioWeb: formValue.sitioWeb || undefined
    };

    const request = this.isEditing() && this.empresaId
      ? this.empresaService.updateEmpresa(this.empresaId, data as EmpresaUpdate)
      : this.empresaService.createEmpresa(data);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditing() ? 'Empresa actualizada' : 'Empresa creada',
          'Cerrar',
          { duration: 3000 }
        );
        this.router.navigate(['/empresas']);
      },
      error: (error) => {
        console.error('Error guardando empresa:', error);
        this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/empresas']);
  }
}
