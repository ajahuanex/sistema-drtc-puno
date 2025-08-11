import { Component, OnInit, inject, signal } from '@angular/core';
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
                <mat-label>Apellidos</mat-label>
                <input matInput formControlName="apellidos" placeholder="Pérez Quispe">
                <mat-error *ngIf="conductorForm.get('apellidos')?.hasError('required')">
                  Los apellidos son requeridos
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Licencia de Conducir</mat-label>
                <input matInput formControlName="licenciaConducir" placeholder="A1B2C3D4E5">
                <mat-error *ngIf="conductorForm.get('licenciaConducir')?.hasError('required')">
                  La licencia de conducir es requerida
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" placeholder="conductor@email.com">
                <mat-error *ngIf="conductorForm.get('email')?.hasError('email')">
                  Ingrese un email válido
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Teléfono</mat-label>
                <input matInput formControlName="telefono" placeholder="951234567">
                <mat-error *ngIf="conductorForm.get('telefono')?.hasError('pattern')">
                  Ingrese un teléfono válido
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-button type="button" (click)="cancelar()">
                <mat-icon>cancel</mat-icon>
                Cancelar
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="conductorForm.invalid || isSubmitting()">
                <mat-icon>save</mat-icon>
                {{ isEditing() ? 'Actualizar' : 'Guardar' }}
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
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  conductorForm!: FormGroup;
  isEditing = signal(false);
  isSubmitting = signal(false);
  conductorId = signal<string | null>(null);

  ngOnInit(): void {
    this.initializeForm();
    this.loadConductor();
  }

  private initializeForm(): void {
    this.conductorForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      licenciaConducir: ['', Validators.required],
      email: ['', [Validators.email]],
      telefono: ['', [Validators.pattern(/^\d{9}$/)]]
    });
  }

  private loadConductor(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.conductorId.set(id);
      // TODO: Cargar datos del conductor
    }
  }

  onSubmit(): void {
    if (this.conductorForm.valid) {
      this.isSubmitting.set(true);
      
      const conductorData = this.conductorForm.value;
      
      // TODO: Implementar lógica para guardar conductor
      console.log('Datos del conductor:', conductorData);
      
      this.snackBar.open(
        this.isEditing() ? 'Conductor actualizado exitosamente' : 'Conductor creado exitosamente',
        'Cerrar',
        { duration: 3000 }
      );
      
      this.router.navigate(['/conductores']);
    }
  }

  cancelar(): void {
    this.router.navigate(['/conductores']);
  }
} 