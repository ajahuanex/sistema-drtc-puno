import { Component, OnInit, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-ruta-form',
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
    MatSelectModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>{{ isEditing() ? 'Editar Ruta' : 'Nueva Ruta' }}</h1>
          <p class="header-subtitle">Gestión de rutas de transporte</p>
        </div>
        <div class="header-actions">
          <button mat-button color="accent" (click)="volver()" class="action-button">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
        </div>
      </div>
    </div>

    <div class="content-section">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="60"></mat-spinner>
          <h3>Cargando...</h3>
        </div>
      } @else {
        <mat-card class="form-card">
          <form [formGroup]="rutaForm" (ngSubmit)="onSubmit()" class="ruta-form">
            <div class="form-grid">
              <!-- Código de Ruta -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Código de Ruta</mat-label>
                <input matInput formControlName="codigoRuta" placeholder="RUT-001" required>
                @if (rutaForm.get('codigoRuta')?.hasError('required') && rutaForm.get('codigoRuta')?.touched) {
                  <mat-error>El código de ruta es requerido</mat-error>
                }
              </mat-form-field>

              <!-- Origen -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Origen</mat-label>
                <input matInput formControlName="origen" placeholder="Puno" required>
                @if (rutaForm.get('origen')?.hasError('required') && rutaForm.get('origen')?.touched) {
                  <mat-error>El origen es requerido</mat-error>
                }
              </mat-form-field>

              <!-- Destino -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Destino</mat-label>
                <input matInput formControlName="destino" placeholder="Lima" required>
                @if (rutaForm.get('destino')?.hasError('required') && rutaForm.get('destino')?.touched) {
                  <mat-error>El destino es requerido</mat-error>
                }
              </mat-form-field>

              <!-- Distancia -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Distancia (km)</mat-label>
                <input matInput type="number" formControlName="distancia" placeholder="1500" required>
                @if (rutaForm.get('distancia')?.hasError('required') && rutaForm.get('distancia')?.touched) {
                  <mat-error>La distancia es requerida</mat-error>
                }
              </mat-form-field>

              <!-- Tiempo Estimado -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Tiempo Estimado (horas)</mat-label>
                <input matInput type="number" formControlName="tiempoEstimado" placeholder="24" required>
                @if (rutaForm.get('tiempoEstimado')?.hasError('required') && rutaForm.get('tiempoEstimado')?.touched) {
                  <mat-error>El tiempo estimado es requerido</mat-error>
                }
              </mat-form-field>

              <!-- Estado -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado" required>
                  <mat-option value="ACTIVA">Activa</mat-option>
                  <mat-option value="INACTIVA">Inactiva</mat-option>
                  <mat-option value="SUSPENDIDA">Suspendida</mat-option>
                </mat-select>
                @if (rutaForm.get('estado')?.hasError('required') && rutaForm.get('estado')?.touched) {
                  <mat-error>El estado es requerido</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Descripción -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Descripción</mat-label>
              <textarea matInput formControlName="descripcion" placeholder="Descripción de la ruta..." rows="3"></textarea>
            </mat-form-field>

            <!-- Observaciones -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Observaciones</mat-label>
              <textarea matInput formControlName="observaciones" placeholder="Observaciones adicionales..." rows="3"></textarea>
            </mat-form-field>

            <!-- Botones de acción -->
            <div class="form-actions">
              <button mat-button type="button" (click)="volver()" class="cancel-button">
                <mat-icon>cancel</mat-icon>
                Cancelar
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="rutaForm.invalid || isSubmitting()" class="submit-button">
                @if (isSubmitting()) {
                  <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
                  <span>{{ isEditing() ? 'Actualizando...' : 'Creando...' }}</span>
                } @else {
                  <ng-container>
                    <mat-icon>{{ isEditing() ? 'save' : 'add' }}</mat-icon>
                    <span>{{ isEditing() ? 'Actualizar Ruta' : 'Crear Ruta' }}</span>
                  </ng-container>
                }
              </button>
            </div>
          </form>
        </mat-card>
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
      flex-direction: column;
      gap: 8px;
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

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
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
      flex-direction: column;
      align-items: center;
      padding: 80px 24px;
      text-align: center;
    }

    .loading-container h3 {
      margin: 24px 0 0 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .form-card {
      border-radius: 0;
      box-shadow: none;
      border: none;
    }

    .ruta-form {
      padding: 32px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
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
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e9ecef;
    }

    .cancel-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-height: 40px;
      padding: 0 24px;
    }

    .submit-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.2s ease-in-out;
    }

    .button-spinner {
      margin-right: 8px;
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

      .form-actions {
        flex-direction: column;
      }

      .ruta-form {
        padding: 24px;
      }
    }
  `]
})
export class RutaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  // Signals
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);

  // Form
  rutaForm: FormGroup;

  constructor() {
    this.rutaForm = this.fb.group({
      codigoRuta: ['', [Validators.required]],
      origen: ['', [Validators.required]],
      destino: ['', [Validators.required]],
      distancia: ['', [Validators.required, Validators.min(0)]],
      tiempoEstimado: ['', [Validators.required, Validators.min(0)]],
      estado: ['ACTIVA', [Validators.required]],
      descripcion: [''],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    const rutaId = this.route.snapshot.params['id'];
    if (rutaId) {
      this.isEditing.set(true);
      this.loadRuta(rutaId);
    }
  }

  loadRuta(id: string): void {
    this.isLoading.set(true);
    // TODO: Implementar carga de ruta desde el servicio
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1000);
  }

  onSubmit(): void {
    if (this.rutaForm.valid) {
      this.isSubmitting.set(true);
      
      // TODO: Implementar guardado de ruta
      setTimeout(() => {
        this.isSubmitting.set(false);
        this.snackBar.open(
          this.isEditing() ? 'Ruta actualizada exitosamente' : 'Ruta creada exitosamente',
          'Cerrar',
          { duration: 3000 }
        );
        this.router.navigate(['/rutas']);
      }, 1000);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.rutaForm.controls).forEach(key => {
      const control = this.rutaForm.get(key);
      control?.markAsTouched();
    });
  }

  volver(): void {
    this.router.navigate(['/rutas']);
  }
} 