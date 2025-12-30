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
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { Vehiculo, EstadoVehiculo, ESTADOS_VEHICULO_LABELS } from '../../models/vehiculo.model';
import { VehiculoService } from '../../services/vehiculo.service';
import { ConfiguracionService } from '../../services/configuracion.service';

export interface CambiarEstadoModalData {
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
    MatProgressSpinnerModule,
    SmartIconComponent
  ],
  template: `
    <div class="cambiar-estado-modal">
      <div class="modal-header">
        <div class="header-content">
          <app-smart-icon [iconName]="'swap_horiz'" [size]="28" class="header-icon"></app-smart-icon>
          <div>
            <h2>Cambiar Estado del Vehículo</h2>
            <p class="header-subtitle">{{ data.vehiculo.placa }} - {{ data.vehiculo.marca }} {{ data.vehiculo.modelo }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="cancelar()" class="close-button">
          <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
        </button>
      </div>
      
      <div class="modal-content">
        <!-- Estado actual -->
        <div class="estado-actual-card">
          <div class="estado-actual-header">
            <app-smart-icon [iconName]="'info'" [size]="20"></app-smart-icon>
            <span>Estado Actual</span>
          </div>
          <div class="estado-actual-badge" 
               [style.background-color]="getColorEstado(data.vehiculo.estado)"
               [style.color]="getColorTexto(getColorEstado(data.vehiculo.estado))">
            <app-smart-icon [iconName]="getIconoEstado(data.vehiculo.estado)" [size]="18"></app-smart-icon>
            {{ getLabelEstado(data.vehiculo.estado) }}
          </div>
        </div>

        <!-- Formulario -->
        <form [formGroup]="estadoForm" class="estado-form">
          <div class="nuevo-estado-section">
            <h3>Seleccionar Nuevo Estado</h3>
            <div class="estados-grid">
              @for (estado of estadosDisponibles; track estado.value) {
                <div class="estado-option" 
                     [class.selected]="estadoForm.get('nuevoEstado')?.value === estado.value"
                     [class.disabled]="estado.value === data.vehiculo.estado"
                     (click)="seleccionarEstado(estado.value)">
                  <div class="estado-option-content">
                    <app-smart-icon [iconName]="estado.icon" [size]="24" class="estado-icon"></app-smart-icon>
                    <span class="estado-label">{{ estado.label }}</span>
                    @if (estado.value === data.vehiculo.estado) {
                      <span class="estado-current">Actual</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          @if (estadoForm.get('nuevoEstado')?.value && estadoForm.get('nuevoEstado')?.value !== data.vehiculo.estado) {
            <div class="motivo-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Motivo del cambio (opcional)</mat-label>
                <textarea matInput 
                          formControlName="observaciones" 
                          placeholder="Describe el motivo del cambio de estado..."
                          rows="3"></textarea>
                <app-smart-icon [iconName]="'edit_note'" [size]="20" matSuffix></app-smart-icon>
                <mat-hint>Información adicional para el historial</mat-hint>
              </mat-form-field>
            </div>
          }
        </form>
      </div>

      <div class="modal-footer">
        <button mat-button (click)="cancelar()" class="cancel-button">
          <app-smart-icon [iconName]="'cancel'" [size]="20"></app-smart-icon>
          Cancelar
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="confirmarCambio()" 
                [disabled]="!puedeConfirmar() || procesando()"
                class="confirm-button">
          @if (procesando()) {
            <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
            <span>Procesando...</span>
          } @else {
            <app-smart-icon [iconName]="'check'" [size]="20"></app-smart-icon>
            <span>Cambiar Estado</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cambiar-estado-modal {
      width: 600px;
      max-width: 95vw;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 24px 0 24px;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .header-icon {
      color: #1976d2;
    }

    .modal-header h2 {
      margin: 0;
      color: #1976d2;
      font-size: 20px;
      font-weight: 500;
    }

    .header-subtitle {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .close-button {
      color: #666;
    }

    .modal-content {
      padding: 0 24px;
    }

    .estado-actual-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .estado-actual-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }

    .estado-actual-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
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
      border: 1px solid #d32f2f;
    }

    .nuevo-estado-section h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 16px;
      font-weight: 500;
    }

    .estados-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    .estado-option {
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: white;
    }

    .estado-option:hover:not(.disabled) {
      border-color: #1976d2;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1);
    }

    .estado-option.selected {
      border-color: #1976d2;
      background: #e3f2fd;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
    }

    .estado-option.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f5f5f5;
    }

    .estado-option-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
    }

    .estado-icon {
      color: #666;
    }

    .estado-option.selected .estado-icon {
      color: #1976d2;
    }

    .estado-label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .estado-current {
      font-size: 12px;
      color: #666;
      font-style: italic;
    }

    .motivo-section {
      margin-bottom: 24px;
    }

    .full-width {
      width: 100%;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      padding: 24px;
      border-top: 1px solid #e0e0e0;
      background: #fafafa;
    }

    .cancel-button {
      color: #666;
    }

    .confirm-button {
      min-width: 160px;
    }

    .button-spinner {
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .cambiar-estado-modal {
        width: 100%;
        max-width: 100vw;
      }

      .estados-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .modal-header {
        padding: 16px 16px 0 16px;
      }

      .modal-content {
        padding: 0 16px;
      }

      .modal-footer {
        padding: 16px;
      }
    }
  `]
})
export class CambiarEstadoVehiculoModalComponent {
  private dialogRef = inject(MatDialogRef<CambiarEstadoVehiculoModalComponent>);
  data = inject(MAT_DIALOG_DATA) as CambiarEstadoModalData;
  private fb = inject(FormBuilder);
  private vehiculoService = inject(VehiculoService);
  private configuracionService = inject(ConfiguracionService);
  private snackBar = inject(MatSnackBar);

  procesando = signal(false);

  // Obtener estados desde la configuración
  estadosDisponibles = this.configuracionService.estadosVehiculosConfig().map((estado: any) => ({
    value: estado.codigo,
    label: estado.nombre,
    icon: this.getIconoParaEstado(estado.codigo),
    color: estado.color,
    descripcion: estado.descripcion
  }));

  estadoForm = this.fb.group({
    nuevoEstado: ['', Validators.required],
    observaciones: ['']
  });

  seleccionarEstado(estado: string): void {
    if (estado !== this.data.vehiculo.estado) {
      this.estadoForm.patchValue({ nuevoEstado: estado });
    }
  }

  puedeConfirmar(): boolean {
    const nuevoEstado = this.estadoForm.get('nuevoEstado')?.value;
    return !!(nuevoEstado && nuevoEstado !== this.data.vehiculo.estado);
  }

  /**
   * Obtiene el icono apropiado para cada estado
   */
  private getIconoParaEstado(codigo: string): string {
    const iconos: { [key: string]: string } = {
      'ACTIVO': 'check_circle',
      'INACTIVO': 'cancel',
      'MANTENIMIENTO': 'build',
      'SUSPENDIDO': 'pause_circle',
      'FUERA_DE_SERVICIO': 'block',
      'DADO_DE_BAJA': 'delete_forever'
    };
    return iconos[codigo] || 'help';
  }

  getIconoEstado(estado: string): string {
    const estadoConfig = this.estadosDisponibles.find((e: any) => e.value === estado);
    return estadoConfig?.icon || 'help';
  }

  getLabelEstado(estado: string): string {
    const estadoConfig = this.estadosDisponibles.find((e: any) => e.value === estado);
    return estadoConfig?.label || estado;
  }

  getColorEstado(estado: string): string {
    const estadoConfig = this.estadosDisponibles.find((e: any) => e.value === estado);
    return estadoConfig?.color || '#757575';
  }

  getColorTexto(colorFondo: string): string {
    // Convertir hex a RGB y calcular luminancia
    const hex = colorFondo.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calcular luminancia
    const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminancia > 0.5 ? '#000000' : '#FFFFFF';
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  confirmarCambio(): void {
    if (!this.puedeConfirmar() || this.procesando()) {
      return;
    }

    const nuevoEstado = this.estadoForm.get('nuevoEstado')?.value;
    if (!nuevoEstado) return;

    const observaciones = this.estadoForm.get('observaciones')?.value || '';

    // Mostrar confirmación para cambios críticos
    const esCambioCritico = nuevoEstado !== EstadoVehiculo.ACTIVO;
    
    if (esCambioCritico) {
      const estadoAnteriorLabel = this.getLabelEstado(this.data.vehiculo.estado);
      const estadoNuevoLabel = this.getLabelEstado(nuevoEstado);
      
      const confirmacion = confirm(
        `¿Está seguro de cambiar el estado del vehículo ${this.data.vehiculo.placa}?\n\n` +
        `De: ${estadoAnteriorLabel}\n` +
        `A: ${estadoNuevoLabel}\n\n` +
        `Este cambio será registrado en el historial del vehículo.`
      );

      if (!confirmacion) {
        return;
      }
    }

    this.procesando.set(true);

    const motivo = this.generarMotivoAutomatico(this.data.vehiculo.estado, nuevoEstado);
    const observacionesCompletas = observaciones ? 
      `${observaciones}` : 
      'Cambio de estado realizado desde modal de vehículos';

    this.vehiculoService.cambiarEstadoVehiculo(
      this.data.vehiculo.id,
      nuevoEstado,
      motivo,
      observacionesCompletas
    ).subscribe({
      next: (vehiculoActualizado) => {
        this.procesando.set(false);
        
        // Mostrar notificación de éxito
        const estadoLabel = this.getLabelEstado(nuevoEstado);
        this.snackBar.open(
          `Estado del vehículo ${this.data.vehiculo.placa} cambiado a ${estadoLabel}`,
          'Cerrar',
          { 
            duration: 4000,
            panelClass: ['snackbar-success']
          }
        );

        // Cerrar modal y devolver el vehículo actualizado
        this.dialogRef.close({
          vehiculo: vehiculoActualizado,
          nuevoEstado: nuevoEstado
        });
      },
      error: (error) => {
        this.procesando.set(false);
        console.error('Error cambiando estado del vehículo:', error);
        
        let mensaje = 'Error al cambiar el estado del vehículo';
        
        if (error.status === 422) {
          if (error.error && error.error.detail) {
            mensaje = `Error de validación: ${error.error.detail}`;
          } else if (error.error && error.error.message) {
            mensaje = `Error de validación: ${error.error.message}`;
          } else {
            mensaje = 'Error de validación. Los datos enviados no son válidos.';
          }
        } else if (error.status === 404) {
          mensaje = 'Vehículo no encontrado';
        } else if (error.status === 403) {
          mensaje = 'No tienes permisos para cambiar el estado de este vehículo';
        } else if (error.status === 0) {
          mensaje = 'Error de conexión. Verifica tu conexión a internet';
        }

        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  private generarMotivoAutomatico(estadoAnterior: string, estadoNuevo: string): string {
    if (estadoNuevo === EstadoVehiculo.ACTIVO) {
      return 'REACTIVACION';
    } else if (estadoNuevo === EstadoVehiculo.INACTIVO) {
      return 'INACTIVACION_ADMINISTRATIVA';
    } else if (estadoNuevo === EstadoVehiculo.MANTENIMIENTO) {
      return 'MANTENIMIENTO_PROGRAMADO';
    } else if (estadoNuevo === EstadoVehiculo.SUSPENDIDO) {
      return 'SUSPENSION_ADMINISTRATIVA';
    } else if (estadoNuevo === EstadoVehiculo.FUERA_DE_SERVICIO) {
      return 'FUERA_DE_SERVICIO';
    } else if (estadoNuevo === EstadoVehiculo.DADO_DE_BAJA) {
      return 'BAJA_ADMINISTRATIVA';
    }
    
    return 'CAMBIO_ADMINISTRATIVO';
  }
}