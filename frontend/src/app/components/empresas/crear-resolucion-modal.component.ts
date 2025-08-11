import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ResolucionService } from '../../services/resolucion.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionCreate } from '../../models/resolucion.model';
import { Empresa } from '../../models/empresa.model';

@Component({
  selector: 'app-crear-resolucion-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>Crear Nueva Resolución</h2>
      <button mat-icon-button mat-dialog-close class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Creando resolución...</p>
        </div>
      } @else {
        <form [formGroup]="resolucionForm" class="resolucion-form">
          <div class="form-grid">
            <!-- Empresa -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Empresa</mat-label>
              <mat-select formControlName="empresaId" required>
                @for (empresa of empresas(); track empresa.id) {
                  <mat-option [value]="empresa.id">{{ empresa.razonSocial.principal | uppercase }}</mat-option>
                }
              </mat-select>
              @if (resolucionForm.get('empresaId')?.hasError('required') && resolucionForm.get('empresaId')?.touched) {
                <mat-error>La empresa es requerida</mat-error>
              }
            </mat-form-field>

            <!-- Número de Resolución -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Número de Resolución</mat-label>
              <input matInput formControlName="numero" placeholder="R-0001-2025" required>
              @if (resolucionForm.get('numero')?.hasError('required') && resolucionForm.get('numero')?.touched) {
                <mat-error>El número de resolución es requerido</mat-error>
              }
            </mat-form-field>

            <!-- Tipo de Resolución -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Tipo de Resolución</mat-label>
              <mat-select formControlName="tipo" required>
                <mat-option value="PRIMIGENIA">Primigenia</mat-option>
                <mat-option value="AMPLIACION">Ampliación</mat-option>
                <mat-option value="MODIFICACION">Modificación</mat-option>
              </mat-select>
              @if (resolucionForm.get('tipo')?.hasError('required') && resolucionForm.get('tipo')?.touched) {
                <mat-error>El tipo de resolución es requerido</mat-error>
              }
            </mat-form-field>

            <!-- Fecha de Emisión -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Fecha de Emisión</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="fechaEmision" required>
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              @if (resolucionForm.get('fechaEmision')?.hasError('required') && resolucionForm.get('fechaEmision')?.touched) {
                <mat-error>La fecha de emisión es requerida</mat-error>
              }
            </mat-form-field>

            <!-- Fecha de Vencimiento -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Fecha de Vencimiento</mat-label>
              <input matInput [matDatepicker]="pickerVencimiento" formControlName="fechaVencimiento">
              <mat-datepicker-toggle matIconSuffix [for]="pickerVencimiento"></mat-datepicker-toggle>
              <mat-datepicker #pickerVencimiento></mat-datepicker>
            </mat-form-field>

            <!-- Descripción -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Descripción</mat-label>
              <textarea matInput formControlName="descripcion" rows="3" placeholder="Descripción de la resolución" required></textarea>
              @if (resolucionForm.get('descripcion')?.hasError('required') && resolucionForm.get('descripcion')?.touched) {
                <mat-error>La descripción es requerida</mat-error>
              }
            </mat-form-field>

            <!-- Observaciones -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Observaciones</mat-label>
              <textarea matInput formControlName="observaciones" rows="2" placeholder="Observaciones adicionales"></textarea>
            </mat-form-field>
          </div>
        </form>
      }
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button mat-button mat-dialog-close [disabled]="isLoading()">Cancelar</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="crearResolucion()" 
        [disabled]="resolucionForm.invalid || isLoading()"
        class="create-button">
        @if (isLoading()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <mat-icon>add</mat-icon>
        }
        Crear Resolución
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      margin: 0;
      color: #1976d2;
      font-size: 1.5rem;
    }

    .close-button {
      color: #666;
    }

    .modal-content {
      padding: 24px;
      min-width: 600px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .resolucion-form {
      width: 100%;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-field {
      width: 100%;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }

    .create-button {
      min-width: 140px;
    }

    .create-button mat-spinner {
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .modal-content {
        min-width: 400px;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CrearResolucionModalComponent {
  private fb = inject(FormBuilder);
  private resolucionService = inject(ResolucionService);
  private empresaService = inject(EmpresaService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CrearResolucionModalComponent>);
  private data = inject(MAT_DIALOG_DATA);

  isLoading = signal(false);
  empresas = signal<Empresa[]>([]);
  resolucionForm: FormGroup;

  constructor() {
    this.resolucionForm = this.fb.group({
      empresaId: ['', [Validators.required]],
      numero: ['', [Validators.required]],
      tipo: ['PRIMIGENIA', [Validators.required]],
      fechaEmision: [new Date(), [Validators.required]],
      fechaVencimiento: [null],
      descripcion: ['', [Validators.required]],
      observaciones: ['']
    });

    // Cargar empresas disponibles
    this.cargarEmpresas();
  }

  private cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
        this.snackBar.open('Error al cargar empresas', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  crearResolucion(): void {
    if (this.resolucionForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);

    const resolucionData: ResolucionCreate = {
      ...this.resolucionForm.value,
      empresaId: this.data.empresaId
    };

    this.resolucionService.createResolucion(resolucionData).subscribe({
      next: (resolucion) => {
        this.isLoading.set(false);
        this.snackBar.open('Resolución creada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(resolucion);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error creando resolución:', error);
        this.snackBar.open('Error al crear la resolución', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resolucionForm.controls).forEach(key => {
      const control = this.resolucionForm.get(key);
      control?.markAsTouched();
    });
  }
} 