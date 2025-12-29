import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { Vehiculo } from '../../models/vehiculo.model';

@Component({
  selector: 'app-cambiar-estado-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    SmartIconComponent
  ],
  template: `
    <div class="cambiar-estado-modal">
      <h2 mat-dialog-title>
        <app-smart-icon [iconName]="'toggle_on'" [size]="24"></app-smart-icon>
        Cambiar Estado del Vehículo
      </h2>
      
      <mat-dialog-content>
        <div class="vehiculo-info">
          <p><strong>Vehículo:</strong> {{ data.vehiculo.placa }} - {{ data.vehiculo.marca }} {{ data.vehiculo.modelo }}</p>
          <p><strong>Estado actual:</strong> 
            <span [class]="'estado-actual estado-' + data.vehiculo.estado.toLowerCase()">
              {{ data.vehiculo.estado }}
            </span>
          </p>
        </div>

        <form [formGroup]="estadoForm" class="estado-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nuevo Estado</mat-label>
            <mat-select formControlName="nuevoEstado" required>
              @for (estado of estadosDisponibles; track estado.value) {
                <mat-option [value]="estado.value" [disabled]="estado.value === data.vehiculo.estado">
                  <div class="estado-option">
                    <app-smart-icon [iconName]="estado.icon" [size]="20"></app-smart-icon>
                    <span>{{ estado.label }}</span>
                  </div>
                </mat-option>
              }
            </mat-select>
            <mat-hint>Selecciona el nuevo estado para el vehículo</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Motivo del cambio</mat-label>
            <textarea matInput 
                      formControlName="motivo" 
                      placeholder="Describe el motivo del cambio de estado..."
                      rows="3"
                      required></textarea>
            <mat-hint>Explica por qué se cambia el estado del vehículo</mat-hint>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancelar()">
          <app-smart-icon [iconName]="'cancel'" [size]="20"></app-smart-icon>
          Cancelar
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="confirmarCambio()" 
                [disabled]="!estadoForm.valid || procesando()">
          <app-smart-icon [iconName]="procesando() ? 'hourglass_empty' : 'check'" [size]="20"></app-smart-icon>
          {{ procesando() ? 'Procesando...' : 'Cambiar Estado' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .cambiar-estado-modal {
      min-width: 500px;
    }

    .vehiculo-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .vehiculo-info p {
      margin: 8px 0;
    }

    .estado-actual {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .estado-activo { background-color: #e8f5e8; color: #2e7d32; }
    .estado-inactivo { background-color: #ffebee; color: #c62828; }
    .estado-mantenimiento { background-color: #fff3e0; color: #f57c00; }
    .estado-suspendido { background-color: #f3e5f5; color: #7b1fa2; }

    .estado-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .estado-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class CambiarEstadoModalComponent {
  private dialogRef = inject(MatDialogRef<CambiarEstadoModalComponent>);
  data = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  procesando = signal(false);

  estadosDisponibles = [
    { value: 'ACTIVO', label: 'Activo', icon: 'check_circle' },
    { value: 'INACTIVO', label: 'Inactivo', icon: 'cancel' },
    { value: 'MANTENIMIENTO', label: 'En Mantenimiento', icon: 'build' },
    { value: 'SUSPENDIDO', label: 'Suspendido', icon: 'pause_circle' }
  ];

  estadoForm = this.fb.group({
    nuevoEstado: ['', Validators.required],
    motivo: ['', [Validators.required, Validators.minLength(10)]]
  });

  cancelar(): void {
    this.dialogRef.close();
  }

  confirmarCambio(): void {
    if (this.estadoForm.valid) {
      this.procesando.set(true);
      
      const resultado = {
        vehiculoId: this.data.vehiculo.id,
        estadoAnterior: this.data.vehiculo.estado,
        estadoNuevo: this.estadoForm.value.nuevoEstado,
        motivo: this.estadoForm.value.motivo
      };

      // Simular procesamiento
      setTimeout(() => {
        this.procesando.set(false);
        this.dialogRef.close(resultado);
      }, 1000);
    }
  }
}