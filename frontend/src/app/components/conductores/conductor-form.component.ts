import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Conductor, ConductorCreate, ConductorUpdate } from '../../models/conductor.model';

@Component({
  selector: 'app-conductor-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="conductor-form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>person_add</mat-icon>
            {{ isEditing() ? 'Editar Conductor' : 'Nuevo Conductor' }}
          </mat-card-title>
          <mat-card-subtitle>
            {{ isEditing() ? 'Modificar información del conductor' : 'Registrar nuevo conductor' }}
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="conductorForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>DNI</mat-label>
                <input matInput formControlName="dni" placeholder="12345678" maxlength="8">
                <mat-error *ngIf="conductorForm.get('dni')?.hasError('required')">
                  El DNI es requerido
                </mat-error>
                <mat-error *ngIf="conductorForm.get('dni')?.hasError('pattern')">
                  El DNI debe tener 8 dígitos
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Nombres</mat-label>
                <input matInput formControlName="nombres" placeholder="Juan Carlos">
                <mat-error *ngIf="conductorForm.get('nombres')?.hasError('required')">
                  Los nombres son requeridos
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Apellido Paterno</mat-label>
                <input matInput formControlName="apellidoPaterno" placeholder="Pérez">
                <mat-error *ngIf="conductorForm.get('apellidoPaterno')?.hasError('required')">
                  El apellido paterno es requerido
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Apellido Materno</mat-label>
                <input matInput formControlName="apellidoMaterno" placeholder="García">
                <mat-error *ngIf="conductorForm.get('apellidoMaterno')?.hasError('required')">
                  El apellido materno es requerido
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Número de Licencia</mat-label>
                <input matInput formControlName="numeroLicencia" placeholder="LIC-001-2024">
                <mat-error *ngIf="conductorForm.get('numeroLicencia')?.hasError('required')">
                  El número de licencia es requerido
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" placeholder="conductor@email.com">
                <mat-error *ngIf="conductorForm.get('email')?.hasError('email')">
                  Ingrese un email válido
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Teléfono</mat-label>
                <input matInput formControlName="telefono" placeholder="051-123456">
                <mat-error *ngIf="conductorForm.get('telefono')?.hasError('pattern')">
                  Ingrese un teléfono válido
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Celular</mat-label>
                <input matInput formControlName="celular" placeholder="951234567">
                <mat-error *ngIf="conductorForm.get('celular')?.hasError('pattern')">
                  Ingrese un celular válido
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Dirección</mat-label>
                <input matInput formControlName="direccion" placeholder="Av. Arequipa 123, Puno">
                <mat-error *ngIf="conductorForm.get('direccion')?.hasError('required')">
                  La dirección es requerida
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Distrito</mat-label>
                <input matInput formControlName="distrito" placeholder="Puno">
                <mat-error *ngIf="conductorForm.get('distrito')?.hasError('required')">
                  El distrito es requerido
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-button type="button" (click)="cancelar()">
                <mat-icon>cancel</mat-icon>
                Cancelar
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="isSubmitting()">
                <mat-icon *ngIf="isSubmitting()">hourglass_empty</mat-icon>
                <mat-icon *ngIf="!isSubmitting()">{{ isEditing() ? 'save' : 'add' }}</mat-icon>
                {{ isEditing() ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .conductor-form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 32px;
    }

    mat-card-header {
      margin-bottom: 24px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ConductorFormComponent implements OnInit {
  @Input() modo: 'crear' | 'editar' = 'crear';
  @Input() conductor?: Conductor;
  @Output() conductorCreado = new EventEmitter<ConductorCreate>();
  @Output() conductorActualizado = new EventEmitter<ConductorUpdate>();
  @Output() cancelado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  conductorForm!: FormGroup;
  isEditing = signal(false);
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.initializeForm();
    this.loadConductor();
  }

  private initializeForm(): void {
    this.conductorForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      numeroLicencia: ['', Validators.required],
      email: ['', [Validators.email]],
      telefono: ['', [Validators.pattern(/^\d{3}-\d{6}$/)]],
      celular: ['', [Validators.pattern(/^\d{9}$/)]],
      direccion: ['', Validators.required],
      distrito: ['', Validators.required]
    });
  }

  private loadConductor(): void {
    if (this.modo === 'editar' && this.conductor) {
      this.isEditing.set(true);
      this.conductorForm.patchValue({
        dni: this.conductor.dni,
        nombres: this.conductor.nombres,
        apellidoPaterno: this.conductor.apellidoPaterno,
        apellidoMaterno: this.conductor.apellidoMaterno,
        numeroLicencia: this.conductor.numeroLicencia,
        email: this.conductor.email,
        telefono: this.conductor.telefono,
        celular: this.conductor.celular,
        direccion: this.conductor.direccion,
        distrito: this.conductor.distrito
      });
    }
  }

  onSubmit(): void {
    if (this.conductorForm.valid) {
      this.isSubmitting.set(true);
      
      const formData = this.conductorForm.value;
      
      if (this.isEditing()) {
        // Emitir evento de actualización
        const conductorUpdate: ConductorUpdate = {
          ...formData,
          fechaActualizacion: new Date()
        };
        this.conductorActualizado.emit(conductorUpdate);
      } else {
        // Emitir evento de creación
        const conductorCreate: ConductorCreate = {
          ...formData,
          fechaNacimiento: new Date(), // TODO: Agregar campo de fecha de nacimiento
          genero: 'MASCULINO', // TODO: Agregar selector de género
          estadoCivil: 'SOLTERO', // TODO: Agregar selector de estado civil
          categoriaLicencia: ['C1'], // TODO: Agregar selector de categorías
          fechaEmisionLicencia: new Date(), // TODO: Agregar campo de fecha de emisión
          fechaVencimientoLicencia: new Date(), // TODO: Agregar campo de fecha de vencimiento
          entidadEmisora: 'DIRCETUR PUNO', // TODO: Agregar campo de entidad emisora
          empresaId: null, // TODO: Agregar selector de empresa
          cargo: null, // TODO: Agregar campo de cargo
          experienciaAnos: 0, // TODO: Agregar campo de experiencia
          tipoSangre: null, // TODO: Agregar selector de tipo de sangre
          restricciones: [], // TODO: Agregar selector de restricciones
          observaciones: null // TODO: Agregar campo de observaciones
        };
        this.conductorCreado.emit(conductorCreate);
      }
      
      this.isSubmitting.set(false);
    }
  }

  cancelar(): void {
    this.cancelado.emit();
  }
} 