import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { Vehiculo, EstadoVehiculo } from '../../models/vehiculo.model';
import { VehiculoService } from '../../services/vehiculo.service';
import { ConfiguracionService } from '../../services/configuracion.service';
import { forkJoin } from 'rxjs';

export interface CambiarEstadoBloqueModalData {
  vehiculos?: Vehiculo[];
  vehiculo?: Vehiculo;
}

@Component({
  selector: 'app-cambiar-estado-bloque-modal',
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
    MatListModule,
    MatDividerModule,
    SmartIconComponent
  ],
  template: `
    <div class="cambiar-estado-bloque-modal">
      <div class="modal-header">
        <div class="header-content">
          <app-smart-icon [iconName]="'checklist'" [size]="28" class="header-icon"></app-smart-icon>
          <div>
            <h2>Cambiar Estado en Bloque</h2>
            <p class="header-subtitle">{{ vehiculos.length }} vehículo(s) seleccionado(s)</p>
          </div>
        </div>
        <button mat-icon-button (click)="cancelar()" class="close-button">
          <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
        </button>
      </div>
      
      <div class="modal-content">
        <!-- Lista de vehículos seleccionados -->
        <div class="vehiculos-seleccionados">
          <h3>Vehículos a modificar:</h3>
          <div class="vehiculos-list">
            @for (vehiculo of vehiculos; track vehiculo.id) {
              <div class="vehiculo-item">
                <div class="vehiculo-info">
                  <span class="vehiculo-placa">{{ vehiculo.placa }}</span>
                  <span class="vehiculo-marca">{{ vehiculo.marca }} {{ vehiculo.modelo }}</span>
                </div>
                <div class="vehiculo-estado-actual" 
                     [style.background-color]="getColorEstado(vehiculo.estado)"
                     [style.color]="getColorTexto(getColorEstado(vehiculo.estado))">
                  {{ getLabelEstado(vehiculo.estado) }}
                </div>
              </div>
            }
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Formulario -->
        <form [formGroup]="estadoForm" class="estado-form">
          <div class="nuevo-estado-section">
            <h3>Seleccionar Nuevo Estado</h3>
            <div class="estados-grid">
              @for (estado of estadosDisponibles; track estado.value) {
                <div class="estado-option" 
                     [class.selected]="estadoForm.get('nuevoEstado')?.value === estado.value"
                     (click)="seleccionarEstado(estado.value)">
                  <div class="estado-option-content">
                    <app-smart-icon [iconName]="estado.icon" [size]="24" class="estado-icon"></app-smart-icon>
                    <span class="estado-label">{{ estado.label }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          @if (estadoForm.get('nuevoEstado')?.value) {
            <div class="motivo-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Motivo del cambio (opcional)</mat-label>
                <textarea matInput 
                          formControlName="observaciones" 
                          placeholder="Describe el motivo del cambio de estado para todos los vehículos..."
                          rows="3"></textarea>
                <app-smart-icon [iconName]="'edit_note'" [size]="20" matSuffix></app-smart-icon>
                <mat-hint>Este motivo se aplicará a todos los vehículos seleccionados</mat-hint>
              </mat-form-field>
            </div>
          }
        </form>

        <!-- Resumen del cambio -->
        @if (estadoForm.get('nuevoEstado')?.value) {
          <div class="resumen-cambio">
            <h4>Resumen del cambio:</h4>
            <div class="resumen-info">
              <div class="resumen-item">
                <span class="resumen-label">Vehículos afectados:</span>
                <span class="resumen-value">{{ vehiculos.length }}</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Nuevo estado:</span>
                <span class="resumen-value estado-badge" 
                      [style.background-color]="getColorEstado(estadoForm.get('nuevoEstado')?.value || '')"
                      [style.color]="getColorTexto(getColorEstado(estadoForm.get('nuevoEstado')?.value || ''))">
                  {{ getLabelEstado(estadoForm.get('nuevoEstado')?.value || '') }}
                </span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Estados actuales:</span>
                <div class="estados-actuales">
                  @for (estadoInfo of getEstadosActuales(); track estadoInfo.estado) {
                    <span class="estado-actual-chip" [class]="'estado-' + estadoInfo.estado.toLowerCase()">
                      {{ estadoInfo.label }} ({{ estadoInfo.cantidad }})
                    </span>
                  }
                </div>
              </div>
            </div>
          </div>
        }
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
            <span>Procesando {{ progreso() }}/{{ vehiculos.length }}...</span>
          } @else {
            <app-smart-icon [iconName]="'check'" [size]="20"></app-smart-icon>
            <span>Cambiar Estado ({{ vehiculos.length }} vehículos)</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cambiar-estado-bloque-modal {
      width: 700px;
      max-width: 95vw;
      max-height: 90vh;
      overflow-y: auto;
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

    .vehiculos-seleccionados h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 16px;
      font-weight: 500;
    }

    .vehiculos-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .vehiculo-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .vehiculo-item:last-child {
      border-bottom: none;
    }

    .vehiculo-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .vehiculo-placa {
      font-weight: 600;
      color: #1976d2;
      font-size: 14px;
    }

    .vehiculo-marca {
      font-size: 12px;
      color: #666;
    }

    .vehiculo-estado-actual {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .nuevo-estado-section h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 16px;
      font-weight: 500;
    }

    .estados-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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

    .estado-option:hover {
      border-color: #1976d2;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1);
    }

    .estado-option.selected {
      border-color: #1976d2;
      background: #e3f2fd;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
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

    .motivo-section {
      margin-bottom: 24px;
    }

    .full-width {
      width: 100%;
    }

    .resumen-cambio {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .resumen-cambio h4 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 14px;
      font-weight: 500;
    }

    .resumen-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .resumen-item:last-child {
      margin-bottom: 0;
    }

    .resumen-label {
      font-size: 14px;
      color: #666;
    }

    .resumen-value {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .estado-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .estados-actuales {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .estado-actual-chip {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    /* Estados */
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
      min-width: 200px;
    }

    .button-spinner {
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .cambiar-estado-bloque-modal {
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

      .resumen-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class CambiarEstadoBloqueModalComponent {
  private dialogRef = inject(MatDialogRef<CambiarEstadoBloqueModalComponent>);
  data = inject(MAT_DIALOG_DATA) as CambiarEstadoBloqueModalData;
  private fb = inject(FormBuilder);
  private vehiculoService = inject(VehiculoService);
  private configuracionService = inject(ConfiguracionService);
  private snackBar = inject(MatSnackBar);

  procesando = signal(false);
  progreso = signal(0);

  // Getter para obtener los vehículos (maneja tanto vehiculos múltiples como vehiculo individual)
  get vehiculos(): Vehiculo[] {
    return this.data?.vehiculos || (this.data?.vehiculo ? [this.data.vehiculo] : []);
  }

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
    this.estadoForm.patchValue({ nuevoEstado: estado });
  }

  puedeConfirmar(): boolean {
    const nuevoEstado = this.estadoForm.get('nuevoEstado')?.value;
    return !!nuevoEstado;
  }

  getLabelEstado(estado: string): string {
    const estadoConfig = this.estadosDisponibles.find((e: any) => e.value === estado);
    return estadoConfig?.label || estado;
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

  getColorEstado(estado: string): string {
    const estadoConfig = this.estadosDisponibles.find((e: any) => e.value === estado);
    return estadoConfig?.color || '#757575';
  }

  getColorTexto(colorFondo: string): string {
    // Convertir hex a RGB y calcular luminancia
    const hex = colorFondo.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calcular luminancia
    const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminancia > 0.5 ? '#000000' : '#FFFFFF';
  }

  getEstadosActuales() {
    const estadosMap = new Map<string, number>();

    this.vehiculos.forEach(vehiculo => {
      const estado = vehiculo.estado;
      estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1);
    });

    return Array.from(estadosMap.entries()).map(([estado, cantidad]) => ({
      estado,
      label: this.getLabelEstado(estado),
      cantidad
    }));
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

    // Verificar que tenemos vehículos
    if (this.vehiculos.length === 0) {
      console.error('No hay vehículos para cambiar estado');
      return;
    }

    // Mostrar confirmación
    const confirmacion = confirm(
      `¿Está seguro de cambiar el estado de ${this.vehiculos.length} vehículo(s) a "${this.getLabelEstado(nuevoEstado)}"?\n\n` +
      `Esta acción se registrará en el historial de cada vehículo.`
    );

    if (!confirmacion) {
      return;
    }

    this.procesando.set(true);
    this.progreso.set(0);

    // Crear array de observables para cambiar el estado de cada vehículo
    const cambios = this.vehiculos.map(vehiculo => {
      const motivo = this.generarMotivoAutomatico(nuevoEstado);
      const observacionesCompletas = observaciones ?
        `Cambio en bloque: ${observaciones}` :
        'Cambio de estado realizado en bloque';

      return this.vehiculoService.cambiarEstadoVehiculo(
        vehiculo.id,
        nuevoEstado,
        motivo,
        observacionesCompletas
      );
    });

    // Ejecutar todos los cambios en paralelo
    forkJoin(cambios).subscribe({
      next: (vehiculosActualizados) => {
        this.procesando.set(false);

        // Mostrar notificación de éxito
        const estadoLabel = this.getLabelEstado(nuevoEstado);
        this.snackBar.open(
          `Estado de ${vehiculosActualizados.length} vehículo(s) cambiado a ${estadoLabel}`,
          'Cerrar',
          {
            duration: 4000,
            panelClass: ['snackbar-success']
          }
        );

        // Cerrar modal y devolver los vehículos actualizados
        this.dialogRef.close({
          vehiculos: vehiculosActualizados,
          nuevoEstado: nuevoEstado
        });
      },
      error: (error) => {
        this.procesando.set(false);
        console.error('Error cambiando estado de vehículos en bloque:', error);

        let mensaje = 'Error al cambiar el estado de los vehículos';

        if (error.status === 422) {
          mensaje = 'Error de validación en algunos vehículos';
        } else if (error.status === 404) {
          mensaje = 'Algunos vehículos no fueron encontrados';
        } else if (error.status === 403) {
          mensaje = 'No tienes permisos para cambiar el estado de algunos vehículos';
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

  private generarMotivoAutomatico(estadoNuevo: string): string {
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