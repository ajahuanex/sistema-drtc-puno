import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Vehiculo, EstadoVehiculo, ESTADOS_VEHICULO_LABELS } from '../../models/vehiculo.model';
import { VehiculoService } from '../../services/vehiculo.service';

export interface CambiarEstadoVehiculoModalData {
  vehiculo: Vehiculo;
}

@Component({
  selector: 'app-cambiar-estado-vehiculo-modal',
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
    MatProgressSpinnerModule
  ],
  template: `
    <div class="cambiar-estado-modal">
      <div class="modal-header">
        <h2>Cambiar Estado del Vehículo</h2>
        <button mat-icon-button (click)="cancelar()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="modal-content">
        <div class="vehiculo-info">
          <h3>{{ data.vehiculo.placa }}</h3>
          <p>{{ data.vehiculo.marca }} {{ data.vehiculo.modelo }}</p>
          <div class="estado-actual">
            <span>Estado actual: </span>
            <span class="estado-badge" [class]="'estado-' + data.vehiculo.estado.toLowerCase()">
              {{ getLabelEstado(data.vehiculo.estado) }}
            </span>
          </div>
        </div>

        <form [formGroup]="estadoForm" class="estado-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nuevo Estado</mat-label>
            <mat-select formControlName="nuevoEstado">
              @for (estado of estadosDisponibles; track estado.value) {
                <mat-option [value]="estado.value">
                  <mat-icon>{{ estado.icon }}</mat-icon>
                  {{ estado.label }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Motivo (opcional)</mat-label>
            <textarea matInput 
                      formControlName="observaciones" 
                      placeholder="Describe el motivo del cambio..."
                      rows="3"></textarea>
          </mat-form-field>
        </form>
      </div>

      <div class="modal-footer">
        <button mat-button (click)="cancelar()">
          Cancelar
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="confirmarCambio()" 
                [disabled]="!puedeConfirmar() || procesando()">
          @if (procesando()) {
            <mat-spinner diameter="20"></mat-spinner>
            Procesando...
          } @else {
            Cambiar Estado
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cambiar-estado-modal {
      width: 500px;
      max-width: 95vw;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0 24px;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 24px;
    }

    .modal-header h2 {
      margin: 0;
      color: #1976d2;
      font-size: 20px;
    }

    .modal-content {
      padding: 0 24px 24px 24px;
    }

    .vehiculo-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .vehiculo-info h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    }

    .vehiculo-info p {
      margin: 0 0 12px 0;
      color: #666;
    }

    .estado-actual {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .estado-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .estado-activo {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .estado-inactivo {
      background: #ffebee;
      color: #c62828;
    }

    .estado-mantenimiento {
      background: #fff3e0;
      color: #f57c00;
    }

    .estado-suspendido {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .estado-fuera_de_servicio {
      background: #fce4ec;
      color: #c2185b;
    }

    .estado-dado_de_baja {
      background: #ffebee;
      color: #d32f2f;
    }

    .full-width {
      width: 100%;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 0 24px 24px 24px;
      border-top: 1px solid #e0e0e0;
      margin-top: 24px;
      padding-top: 24px;
    }

    mat-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class CambiarEstadoVehiculoModalComponent {
  private fb = inject(FormBuilder);
  private vehiculoService = inject(VehiculoService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CambiarEstadoVehiculoModalComponent>);
  public data = inject<CambiarEstadoVehiculoModalData>(MAT_DIALOG_DATA);

  procesando = signal(false);

  estadoForm: FormGroup = this.fb.group({
    nuevoEstado: ['', Validators.required],
    observaciones: ['']
  });

  estadosDisponibles = [
    { value: 'ACTIVO', label: 'Activo', icon: 'check_circle' },
    { value: 'INACTIVO', label: 'Inactivo', icon: 'cancel' },
    { value: 'MANTENIMIENTO', label: 'En Mantenimiento', icon: 'build' },
    { value: 'SUSPENDIDO', label: 'Suspendido', icon: 'pause_circle' },
    { value: 'FUERA_DE_SERVICIO', label: 'Fuera de Servicio', icon: 'block' },
    { value: 'DADO_DE_BAJA', label: 'Dado de Baja', icon: 'delete_forever' }
  ];

  puedeConfirmar(): boolean {
    const nuevoEstado = this.estadoForm.get('nuevoEstado')?.value;
    return !!nuevoEstado && nuevoEstado !== this.data.vehiculo.estado;
  }

  getLabelEstado(estado: string): string {
    return ESTADOS_VEHICULO_LABELS[estado as EstadoVehiculo] || estado;
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  confirmarCambio(): void {
    if (!this.puedeConfirmar() || this.procesando()) {
      return;
    }

    const nuevoEstado = this.estadoForm.get('nuevoEstado')?.value;
    const observaciones = this.estadoForm.get('observaciones')?.value || '';

    this.procesando.set(true);

    this.vehiculoService.cambiarEstadoVehiculo(
      this.data.vehiculo.id,
      nuevoEstado,
      'Cambio manual de estado',
      observaciones
    ).subscribe({
      next: (vehiculoActualizado) => {
        this.procesando.set(false);
        
        this.snackBar.open(
          `Estado del vehículo ${this.data.vehiculo.placa} cambiado a ${this.getLabelEstado(nuevoEstado)}`,
          'Cerrar',
          { duration: 3000 }
        );

        this.dialogRef.close({
          estadoNuevo: nuevoEstado,
          vehiculo: vehiculoActualizado
        });
      },
      error: (error) => {
        this.procesando.set(false);
        console.error('Error cambiando estado:', error);
        
        this.snackBar.open(
          'Error al cambiar el estado del vehículo',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }
}