import { Component, inject, signal, computed } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { Vehiculo } from '../../models/vehiculo.model';
import { VehiculoService } from '../../services/vehiculo.service';
import { ConfiguracionService } from '../../services/configuracion.service';
import { forkJoin } from 'rxjs';

export interface EdicionCamposModalData {
  vehiculos: Vehiculo[];
  campo: 'estado' | 'tipoServicio' | 'ambos';
}

@Component({
  selector: 'app-edicion-campos-modal',
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
    MatTabsModule,
    SmartIconComponent
  ],
  template: `
    <div class="edicion-campos-modal">
      <div class="modal-header">
        <div class="header-content">
          <app-smart-icon [iconName]="'edit'" [size]="28" class="header-icon"></app-smart-icon>
          <div>
            <h2>Editar Campos en Bloque</h2>
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
                <div class="vehiculo-estado-actual">
                  {{ vehiculo.estado }}
                </div>
              </div>
            }
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Formulario -->
        <form [formGroup]="camposForm" class="campos-form">
          @if (mostrarEstado()) {
            <div class="campo-section">
              <h3>Cambiar Estado</h3>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nuevo Estado</mat-label>
                <mat-select formControlName="nuevoEstado">
                  <mat-option value="">-- No cambiar --</mat-option>
                  @for (estado of estadosDisponibles(); track estado.codigo) {
                    <mat-option [value]="estado.codigo">{{ estado.nombre }}</mat-option>
                  }
                </mat-select>
                <app-smart-icon [iconName]="'check_circle'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>
            </div>
          }

          @if (mostrarTipoServicio()) {
            <div class="campo-section">
              <h3>Cambiar Tipo de Servicio</h3>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nuevo Tipo de Servicio</mat-label>
                <mat-select formControlName="nuevoTipoServicio">
                  <mat-option value="">-- No cambiar --</mat-option>
                  <mat-option value="PASAJEROS">Transporte de Pasajeros</mat-option>
                  <mat-option value="CARGA">Transporte de Carga</mat-option>
                  <mat-option value="MIXTO">Transporte Mixto</mat-option>
                </mat-select>
                <app-smart-icon [iconName]="'business'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>
            </div>
          }

          <div class="observaciones-section">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Observaciones (opcional)</mat-label>
              <textarea matInput 
                        formControlName="observaciones" 
                        placeholder="Describe el motivo de los cambios..."
                        rows="3"></textarea>
              <app-smart-icon [iconName]="'edit_note'" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>
          </div>
        </form>

        <!-- Resumen del cambio -->
        @if (haySeleccionesValidas()) {
          <div class="resumen-cambio">
            <h4>Resumen de cambios:</h4>
            <div class="resumen-info">
              <div class="resumen-item">
                <span class="resumen-label">Vehículos afectados:</span>
                <span class="resumen-value">{{ vehiculos.length }}</span>
              </div>
              
              @if (camposForm.get('nuevoEstado')?.value) {
                <div class="resumen-item">
                  <span class="resumen-label">Nuevo estado:</span>
                  <span class="resumen-value">{{ camposForm.get('nuevoEstado')?.value }}</span>
                </div>
              }

              @if (camposForm.get('nuevoTipoServicio')?.value) {
                <div class="resumen-item">
                  <span class="resumen-label">Nuevo tipo de servicio:</span>
                  <span class="resumen-value">{{ camposForm.get('nuevoTipoServicio')?.value }}</span>
                </div>
              }
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
                (click)="confirmarCambios()" 
                [disabled]="!haySeleccionesValidas() || procesando()"
                class="confirm-button">
          @if (procesando()) {
            <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
            <span>Procesando...</span>
          } @else {
            <app-smart-icon [iconName]="'check'" [size]="20"></app-smart-icon>
            <span>Aplicar Cambios ({{ vehiculos.length }} vehículos)</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .edicion-campos-modal {
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
      background: #e0e0e0;
      color: #333;
    }

    .campo-section {
      margin-bottom: 24px;
    }

    .campo-section h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 16px;
      font-weight: 500;
    }

    .observaciones-section {
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
      .edicion-campos-modal {
        width: 100%;
        max-width: 100vw;
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
export class EdicionCamposModalComponent {
  private dialogRef = inject(MatDialogRef<EdicionCamposModalComponent>);
  data = inject(MAT_DIALOG_DATA) as EdicionCamposModalData;
  private fb = inject(FormBuilder);
  private vehiculoService = inject(VehiculoService);
  private configuracionService = inject(ConfiguracionService);
  private snackBar = inject(MatSnackBar);

  procesando = signal(false);
  vehiculos = this.data.vehiculos;
  campo = this.data.campo;

  // Computed para mostrar campos
  mostrarEstado = computed(() => this.campo === 'estado' || this.campo === 'ambos');
  mostrarTipoServicio = computed(() => this.campo === 'tipoServicio' || this.campo === 'ambos');

  // Estados disponibles
  estadosDisponibles = computed(() => {
    try {
      return this.configuracionService.estadosVehiculosConfig();
    } catch {
      return [
        { codigo: 'ACTIVO', nombre: 'Activo' },
        { codigo: 'INACTIVO', nombre: 'Inactivo' },
        { codigo: 'MANTENIMIENTO', nombre: 'Mantenimiento' },
        { codigo: 'SUSPENDIDO', nombre: 'Suspendido' }
      ];
    }
  });

  // Formulario
  camposForm = this.fb.group({
    nuevoEstado: [''],
    nuevoTipoServicio: [''],
    observaciones: ['']
  });

  haySeleccionesValidas(): boolean {
    const tieneEstado = this.camposForm.get('nuevoEstado')?.value;
    const tieneTipoServicio = this.camposForm.get('nuevoTipoServicio')?.value;
    return !!(tieneEstado || tieneTipoServicio);
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  confirmarCambios(): void {
    if (!this.haySeleccionesValidas() || this.procesando()) {
      return;
    }

    const nuevoEstado = this.camposForm.get('nuevoEstado')?.value;
    const nuevoTipoServicio = this.camposForm.get('nuevoTipoServicio')?.value;
    const observaciones = this.camposForm.get('observaciones')?.value || '';

    let mensaje = `¿Está seguro de aplicar los cambios a ${this.vehiculos.length} vehículo(s)?\\n\\n`;
    
    if (nuevoEstado) {
      mensaje += `• Estado: ${nuevoEstado}\\n`;
    }
    if (nuevoTipoServicio) {
      mensaje += `• Tipo de servicio: ${nuevoTipoServicio}\\n`;
    }

    const confirmacion = confirm(mensaje);
    if (!confirmacion) {
      return;
    }

    this.procesando.set(true);

    // Crear array de observables para actualizar cada vehículo
    const actualizaciones = this.vehiculos.map(vehiculo => {
      const updateData: any = {};
      
      if (nuevoEstado) {
        updateData.estado = nuevoEstado;
      }
      
      // Para tipo de servicio, por ahora lo agregamos como observación
      // En el futuro se puede agregar como campo específico al modelo
      if (nuevoTipoServicio || observaciones) {
        const observacionesCompletas = [
          observaciones && `Observaciones: ${observaciones}`,
          nuevoTipoServicio && `Tipo de servicio: ${nuevoTipoServicio}`
        ].filter(Boolean).join('. ');
        
        updateData.observaciones = observacionesCompletas;
      }

      // Usar el método existente de actualización
      return this.vehiculoService.updateVehiculo(vehiculo.id, updateData);
    });

    // Ejecutar todas las actualizaciones en paralelo
    forkJoin(actualizaciones).subscribe({
      next: (vehiculosActualizados) => {
        this.procesando.set(false);

        let mensajeExito = `${vehiculosActualizados.length} vehículo(s) actualizado(s)`;
        
        this.snackBar.open(mensajeExito, 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });

        // Cerrar modal y devolver los vehículos actualizados
        this.dialogRef.close({
          vehiculos: vehiculosActualizados,
          cambios: {
            estado: nuevoEstado,
            tipoServicio: nuevoTipoServicio
          }
        });
      },
      error: (error) => {
        this.procesando.set(false);
        console.error('Error actualizando vehículos:', error);

        let mensaje = 'Error al actualizar los vehículos';
        if (error.status === 422) {
          mensaje = 'Error de validación en algunos vehículos';
        } else if (error.status === 404) {
          mensaje = 'Algunos vehículos no fueron encontrados';
        } else if (error.status === 403) {
          mensaje = 'No tienes permisos para actualizar algunos vehículos';
        }

        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }
}