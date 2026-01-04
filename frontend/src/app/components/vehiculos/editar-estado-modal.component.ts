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
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { Vehiculo, EstadoVehiculo } from '../../models/vehiculo.model';
import { VehiculoService } from '../../services/vehiculo.service';
import { ConfiguracionService } from '../../services/configuracion.service';

export interface EditarEstadoModalData {
  vehiculo: Vehiculo;
}

@Component({
  selector: 'app-editar-estado-modal',
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
    MatDividerModule,
    MatCardModule,
    SmartIconComponent
  ],
  template: `
    <div class="editar-estado-modal">
      <div class="modal-header">
        <div class="header-content">
          <app-smart-icon [iconName]="'edit'" [size]="28" class="header-icon"></app-smart-icon>
          <div>
            <h2>Cambiar Estado del Vehículo</h2>
            <p class="header-subtitle">{{ vehiculo.placa }} - {{ vehiculo.marca }} {{ vehiculo.modelo }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="cancelar()" class="close-button">
          <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
        </button>
      </div>
      
      <div class="modal-content">
        <!-- Información actual del vehículo -->
        <mat-card class="vehiculo-info-card">
          <mat-card-header>
            <div class="card-header-content">
              <app-smart-icon [iconName]="'directions_car'" [size]="24" class="card-icon"></app-smart-icon>
              <mat-card-title>Información del Vehículo</mat-card-title>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="vehiculo-details">
              <div class="detail-item">
                <span class="detail-label">Placa:</span>
                <span class="detail-value">{{ vehiculo.placa }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Marca/Modelo:</span>
                <span class="detail-value">{{ vehiculo.marca }} {{ vehiculo.modelo }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Estado Actual:</span>
                <span class="detail-value estado-badge" 
                      [style.background-color]="getColorEstado(vehiculo.estado)"
                      [style.color]="getColorTexto(getColorEstado(vehiculo.estado))">
                  {{ getLabelEstado(vehiculo.estado) }}
                </span>
              </div>
              @if (vehiculo.sedeRegistro) {
                <div class="detail-item">
                  <span class="detail-label">Sede:</span>
                  <span class="detail-value">{{ vehiculo.sedeRegistro }}</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <mat-divider></mat-divider>

        <!-- Formulario de cambio de estado -->
        <form [formGroup]="estadoForm" class="estado-form">
          <div class="nuevo-estado-section">
            <h3>Seleccionar Nuevo Estado</h3>
            <div class="estados-grid">
              @for (estado of estadosDisponibles; track estado.value) {
                <div class="estado-option" 
                     [class.selected]="estadoForm.get('nuevoEstado')?.value === estado.value"
                     [class.disabled]="estado.value === vehiculo.estado"
                     (click)="seleccionarEstado(estado.value)">
                  <div class="estado-option-content">
                    <app-smart-icon [iconName]="estado.icon" [size]="24" class="estado-icon"></app-smart-icon>
                    <span class="estado-label">{{ estado.label }}</span>
                    <span class="estado-descripcion">{{ estado.descripcion }}</span>
                    @if (estado.value === vehiculo.estado) {
                      <span class="estado-actual-indicator">ACTUAL</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          @if (estadoForm.get('nuevoEstado')?.value && estadoForm.get('nuevoEstado')?.value !== vehiculo.estado) {
            <div class="motivo-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Motivo del cambio</mat-label>
                <mat-select formControlName="motivo" required>
                  @for (motivo of getMotivosParaEstado(estadoForm.get('nuevoEstado')?.value || ''); track motivo.value) {
                    <mat-option [value]="motivo.value">{{ motivo.label }}</mat-option>
                  }
                </mat-select>
                <app-smart-icon [iconName]="'assignment'" [size]="20" matSuffix></app-smart-icon>
                <mat-error *ngIf="estadoForm.get('motivo')?.hasError('required')">
                  El motivo es obligatorio
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Observaciones adicionales (opcional)</mat-label>
                <textarea matInput 
                          formControlName="observaciones" 
                          placeholder="Describe detalles adicionales sobre el cambio de estado..."
                          rows="3"></textarea>
                <app-smart-icon [iconName]="'edit_note'" [size]="20" matSuffix></app-smart-icon>
                <mat-hint>Información adicional que se registrará en el historial</mat-hint>
              </mat-form-field>
            </div>

            <!-- Resumen del cambio -->
            <div class="resumen-cambio">
              <h4>Resumen del cambio:</h4>
              <div class="resumen-info">
                <div class="cambio-estados">
                  <div class="estado-anterior">
                    <span class="estado-label-small">Estado Actual</span>
                    <span class="estado-badge-small" 
                          [style.background-color]="getColorEstado(vehiculo.estado)"
                          [style.color]="getColorTexto(getColorEstado(vehiculo.estado))">
                      {{ getLabelEstado(vehiculo.estado) }}
                    </span>
                  </div>
                  <app-smart-icon [iconName]="'arrow_forward'" [size]="20" class="arrow-icon"></app-smart-icon>
                  <div class="estado-nuevo">
                    <span class="estado-label-small">Nuevo Estado</span>
                    <span class="estado-badge-small" 
                          [style.background-color]="getColorEstado(estadoForm.get('nuevoEstado')?.value || '')"
                          [style.color]="getColorTexto(getColorEstado(estadoForm.get('nuevoEstado')?.value || ''))">
                      {{ getLabelEstado(estadoForm.get('nuevoEstado')?.value || '') }}
                    </span>
                  </div>
                </div>
                @if (estadoForm.get('motivo')?.value) {
                  <div class="motivo-seleccionado">
                    <span class="motivo-label">Motivo:</span>
                    <span class="motivo-value">{{ getLabelMotivo(estadoForm.get('motivo')?.value || '') }}</span>
                  </div>
                }
              </div>
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
            <span>Guardando...</span>
          } @else {
            <app-smart-icon [iconName]="'save'" [size]="20"></app-smart-icon>
            <span>Guardar Cambio</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .editar-estado-modal {
      width: 600px;
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

    .vehiculo-info-card {
      margin-bottom: 24px;
    }

    .card-header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .card-icon {
      color: #1976d2;
    }

    .vehiculo-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
    }

    .detail-value {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }

    .estado-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      display: inline-block;
      width: fit-content;
    }

    .nuevo-estado-section h3 {
      margin: 24px 0 16px 0;
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
      position: relative;
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
      opacity: 0.6;
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

    .estado-descripcion {
      font-size: 12px;
      color: #666;
      line-height: 1.3;
    }

    .estado-actual-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #4caf50;
      color: white;
      padding: 2px 6px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 600;
    }

    .motivo-section {
      margin-bottom: 24px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
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

    .cambio-estados {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .estado-anterior,
    .estado-nuevo {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .estado-label-small {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .estado-badge-small {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .arrow-icon {
      color: #1976d2;
    }

    .motivo-seleccionado {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .motivo-label {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .motivo-value {
      font-size: 14px;
      color: #333;
      font-weight: 500;
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
      min-width: 150px;
    }

    .button-spinner {
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .editar-estado-modal {
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

      .vehiculo-details {
        grid-template-columns: 1fr;
      }

      .cambio-estados {
        flex-direction: column;
        gap: 12px;
      }

      .motivo-seleccionado {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class EditarEstadoModalComponent {
  private dialogRef = inject(MatDialogRef<EditarEstadoModalComponent>);
  data = inject(MAT_DIALOG_DATA) as EditarEstadoModalData;
  private fb = inject(FormBuilder);
  private vehiculoService = inject(VehiculoService);
  private configuracionService = inject(ConfiguracionService);
  private snackBar = inject(MatSnackBar);

  procesando = signal(false);

  get vehiculo(): Vehiculo {
    return this.data.vehiculo;
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
    motivo: ['', Validators.required],
    observaciones: ['']
  });

  seleccionarEstado(estado: string): void {
    if (estado !== this.vehiculo.estado) {
      this.estadoForm.patchValue({ 
        nuevoEstado: estado,
        motivo: '' // Reset motivo cuando cambia el estado
      });
    }
  }

  puedeConfirmar(): boolean {
    const nuevoEstado = this.estadoForm.get('nuevoEstado')?.value;
    const motivo = this.estadoForm.get('motivo')?.value;
    return !!(nuevoEstado && nuevoEstado !== this.vehiculo.estado && motivo);
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
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calcular luminancia
    const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminancia > 0.5 ? '#000000' : '#FFFFFF';
  }

  getMotivosParaEstado(estado: string) {
    const motivos: { [key: string]: Array<{value: string, label: string}> } = {
      'ACTIVO': [
        { value: 'REACTIVACION', label: 'Reactivación del servicio' },
        { value: 'MANTENIMIENTO_COMPLETADO', label: 'Mantenimiento completado' },
        { value: 'DOCUMENTACION_REGULARIZADA', label: 'Documentación regularizada' },
        { value: 'INSPECCION_APROBADA', label: 'Inspección técnica aprobada' }
      ],
      'INACTIVO': [
        { value: 'INACTIVACION_ADMINISTRATIVA', label: 'Inactivación administrativa' },
        { value: 'DOCUMENTACION_VENCIDA', label: 'Documentación vencida' },
        { value: 'SOLICITUD_EMPRESA', label: 'Solicitud de la empresa' },
        { value: 'PROCESO_ADMINISTRATIVO', label: 'Proceso administrativo en curso' }
      ],
      'MANTENIMIENTO': [
        { value: 'MANTENIMIENTO_PROGRAMADO', label: 'Mantenimiento programado' },
        { value: 'REPARACION_MAYOR', label: 'Reparación mayor' },
        { value: 'REVISION_TECNICA', label: 'Revisión técnica' },
        { value: 'CAMBIO_REPUESTOS', label: 'Cambio de repuestos' }
      ],
      'SUSPENDIDO': [
        { value: 'SUSPENSION_ADMINISTRATIVA', label: 'Suspensión administrativa' },
        { value: 'INFRACCION_GRAVE', label: 'Infracción grave' },
        { value: 'DOCUMENTACION_IRREGULAR', label: 'Documentación irregular' },
        { value: 'ORDEN_JUDICIAL', label: 'Orden judicial' }
      ],
      'FUERA_DE_SERVICIO': [
        { value: 'FUERA_DE_SERVICIO', label: 'Fuera de servicio temporal' },
        { value: 'ACCIDENTE', label: 'Accidente de tránsito' },
        { value: 'AVERIA_MAYOR', label: 'Avería mayor' },
        { value: 'DECISION_EMPRESA', label: 'Decisión de la empresa' }
      ],
      'DADO_DE_BAJA': [
        { value: 'BAJA_ADMINISTRATIVA', label: 'Baja administrativa' },
        { value: 'BAJA_DEFINITIVA', label: 'Baja definitiva' },
        { value: 'VEHICULO_SINIESTRADO', label: 'Vehículo siniestrado' },
        { value: 'SOLICITUD_EMPRESA', label: 'Solicitud de baja por empresa' }
      ]
    };

    return motivos[estado] || [];
  }

  getLabelMotivo(motivo: string): string {
    // Buscar en todos los motivos disponibles
    for (const estado of Object.keys(this.getMotivosParaEstado(''))) {
      const motivosEstado = this.getMotivosParaEstado(estado);
      const motivoEncontrado = motivosEstado.find(m => m.value === motivo);
      if (motivoEncontrado) {
        return motivoEncontrado.label;
      }
    }
    return motivo;
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  confirmarCambio(): void {
    if (!this.puedeConfirmar() || this.procesando()) {
      return;
    }

    const nuevoEstado = this.estadoForm.get('nuevoEstado')?.value;
    const motivo = this.estadoForm.get('motivo')?.value;
    const observaciones = this.estadoForm.get('observaciones')?.value || '';

    if (!nuevoEstado || !motivo) return;

    this.procesando.set(true);

    this.vehiculoService.cambiarEstadoVehiculo(
      this.vehiculo.id,
      nuevoEstado,
      motivo,
      observaciones
    ).subscribe({
      next: (vehiculoActualizado) => {
        this.procesando.set(false);

        // Mostrar notificación de éxito
        const estadoLabel = this.getLabelEstado(nuevoEstado);
        this.snackBar.open(
          `Estado del vehículo ${this.vehiculo.placa} cambiado a ${estadoLabel}`,
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
          mensaje = 'Error de validación en los datos del vehículo';
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
}