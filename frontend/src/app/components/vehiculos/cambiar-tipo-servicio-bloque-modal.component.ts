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
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { Vehiculo } from '../../models/vehiculo.model';
import { VehiculoService } from '../../services/vehiculo.service';
import { ConfiguracionService } from '../../services/configuracion.service';
import { forkJoin } from 'rxjs';

export interface CambiarTipoServicioBloqueModalData {
  vehiculos?: Vehiculo[];
  vehiculo?: Vehiculo;
}

export interface TipoServicioConfig {
  codigo: string;
  nombre: string;
  descripcion: string;
  estaActivo: boolean;
}

@Component({
  selector: 'app-cambiar-tipo-servicio-bloque-modal',
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
    <div class="cambiar-tipo-servicio-bloque-modal">
      <div class="modal-header">
        <div class="header-content">
          <app-smart-icon [iconName]="'business_center'" [size]="28" class="header-icon"></app-smart-icon>
          <div>
            <h2>Cambiar Tipo de Servicio en Bloque</h2>
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
                <div class="vehiculo-tipo-actual">
                  {{ getTipoServicioActual(vehiculo) }}
                </div>
              </div>
            }
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Formulario -->
        <form [formGroup]="tipoServicioForm" class="tipo-servicio-form">
          <div class="nuevo-tipo-section">
            <h3>Seleccionar Nuevo Tipo de Servicio</h3>
            <div class="tipos-grid">
              @for (tipo of tiposServicioDisponibles; track tipo.codigo) {
                <div class="tipo-option" 
                     [class.selected]="tipoServicioForm.get('nuevoTipoServicio')?.value === tipo.codigo"
                     (click)="seleccionarTipoServicio(tipo.codigo)">
                  <div class="tipo-option-content">
                    <app-smart-icon [iconName]="getIconoParaTipoServicio(tipo.codigo)" [size]="24" class="tipo-icon"></app-smart-icon>
                    <span class="tipo-label">{{ tipo.nombre }}</span>
                    <span class="tipo-descripcion">{{ tipo.descripcion }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          @if (tipoServicioForm.get('nuevoTipoServicio')?.value) {
            <div class="motivo-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Motivo del cambio (opcional)</mat-label>
                <textarea matInput 
                          formControlName="observaciones" 
                          placeholder="Describe el motivo del cambio de tipo de servicio para todos los vehículos..."
                          rows="3"></textarea>
                <app-smart-icon [iconName]="'edit_note'" [size]="20" matSuffix></app-smart-icon>
                <mat-hint>Este motivo se aplicará a todos los vehículos seleccionados</mat-hint>
              </mat-form-field>
            </div>
          }
        </form>

        <!-- Resumen del cambio -->
        @if (tipoServicioForm.get('nuevoTipoServicio')?.value) {
          <div class="resumen-cambio">
            <h4>Resumen del cambio:</h4>
            <div class="resumen-info">
              <div class="resumen-item">
                <span class="resumen-label">Vehículos afectados:</span>
                <span class="resumen-value">{{ vehiculos.length }}</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Nuevo tipo de servicio:</span>
                <span class="resumen-value tipo-badge">
                  {{ getLabelTipoServicio(tipoServicioForm.get('nuevoTipoServicio')?.value || '') }}
                </span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Tipos actuales:</span>
                <div class="tipos-actuales">
                  @for (tipoInfo of getTiposActuales(); track tipoInfo.tipo) {
                    <span class="tipo-actual-chip">
                      {{ tipoInfo.label }} ({{ tipoInfo.cantidad }})
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
            <span>Cambiar Tipo de Servicio ({{ vehiculos.length }} vehículos)</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cambiar-tipo-servicio-bloque-modal {
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

    .vehiculo-tipo-actual {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      background: #e3f2fd;
      color: #1976d2;
    }

    .nuevo-tipo-section h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 16px;
      font-weight: 500;
    }

    .tipos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    .tipo-option {
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: white;
    }

    .tipo-option:hover {
      border-color: #1976d2;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1);
    }

    .tipo-option.selected {
      border-color: #1976d2;
      background: #e3f2fd;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
    }

    .tipo-option-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
    }

    .tipo-icon {
      color: #666;
    }

    .tipo-option.selected .tipo-icon {
      color: #1976d2;
    }

    .tipo-label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .tipo-descripcion {
      font-size: 12px;
      color: #666;
      line-height: 1.3;
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

    .tipo-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      background: #e3f2fd;
      color: #1976d2;
    }

    .tipos-actuales {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tipo-actual-chip {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      background: #f5f5f5;
      color: #666;
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
      min-width: 250px;
    }

    .button-spinner {
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .cambiar-tipo-servicio-bloque-modal {
        width: 100%;
        max-width: 100vw;
      }

      .tipos-grid {
        grid-template-columns: 1fr;
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
export class CambiarTipoServicioBloqueModalComponent {
  private dialogRef = inject(MatDialogRef<CambiarTipoServicioBloqueModalComponent>);
  data = inject(MAT_DIALOG_DATA) as CambiarTipoServicioBloqueModalData;
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

  // Obtener tipos de servicio desde la configuración
  tiposServicioDisponibles: TipoServicioConfig[] = this.getTiposServicioDefault();

  tipoServicioForm = this.fb.group({
    nuevoTipoServicio: ['', Validators.required],
    observaciones: ['']
  });

  constructor() {
    // Cargar tipos de servicio desde configuración
    this.cargarTiposServicio();
  }

  private cargarTiposServicio(): void {
    try {
      const config = this.configuracionService.getConfiguracion('TIPOS_SERVICIO_CONFIG');
      if (config && config.valor) {
        this.tiposServicioDisponibles = JSON.parse(config.valor).filter((tipo: TipoServicioConfig) => tipo.estaActivo);
      }
    } catch (error) {
      this.tiposServicioDisponibles = this.getTiposServicioDefault();
    }
  }

  private getTiposServicioDefault(): TipoServicioConfig[] {
    return [
      { 
        codigo: 'PASAJEROS', 
        nombre: 'Transporte de Pasajeros', 
        descripcion: 'Servicio de transporte público de personas', 
        estaActivo: true 
      },
      { 
        codigo: 'CARGA', 
        nombre: 'Transporte de Carga', 
        descripcion: 'Servicio de transporte de mercancías y productos', 
        estaActivo: true 
      },
      { 
        codigo: 'MIXTO', 
        nombre: 'Transporte Mixto', 
        descripcion: 'Servicio combinado de pasajeros y carga', 
        estaActivo: true 
      }
    ];
  }

  seleccionarTipoServicio(tipoServicio: string): void {
    this.tipoServicioForm.patchValue({ nuevoTipoServicio: tipoServicio });
  }

  puedeConfirmar(): boolean {
    const nuevoTipoServicio = this.tipoServicioForm.get('nuevoTipoServicio')?.value;
    return !!nuevoTipoServicio;
  }

  getLabelTipoServicio(codigo: string): string {
    const tipoConfig = this.tiposServicioDisponibles.find((t: any) => t.codigo === codigo);
    return tipoConfig?.nombre || codigo;
  }

  getTipoServicioActual(vehiculo: Vehiculo): string {
    // Asumiendo que el vehículo tiene una propiedad tipoServicio
    // Si no existe, usar un valor por defecto
    const tipoServicio = (vehiculo as any).tipoServicio || 'PASAJEROS';
    return this.getLabelTipoServicio(tipoServicio);
  }

  /**
   * Obtiene el icono apropiado para cada tipo de servicio
   */
  getIconoParaTipoServicio(codigo: string): string {
    const iconos: { [key: string]: string } = {
      'PASAJEROS': 'people',
      'CARGA': 'local_shipping',
      'MIXTO': 'business_center'
    };
    return iconos[codigo] || 'help';
  }

  getTiposActuales() {
    const tiposMap = new Map<string, number>();

    this.vehiculos.forEach((vehiculo: any) => {
      const tipoServicio = (vehiculo as any).tipoServicio || 'PASAJEROS';
      tiposMap.set(tipoServicio, (tiposMap.get(tipoServicio) || 0) + 1);
    });

    return Array.from(tiposMap.entries()).map(([tipo, cantidad]: any[]) => ({
      tipo,
      label: this.getLabelTipoServicio(tipo),
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

    const nuevoTipoServicio = this.tipoServicioForm.get('nuevoTipoServicio')?.value;
    if (!nuevoTipoServicio) return;

    const observaciones = this.tipoServicioForm.get('observaciones')?.value || '';

    // Verificar que tenemos vehículos
    if (this.vehiculos.length === 0) {
      console.error('No hay vehículos para cambiar tipo de servicio');
      return;
    }

    // Mostrar confirmación
    const confirmacion = confirm(
      `¿Está seguro de cambiar el tipo de servicio de ${this.vehiculos.length} vehículo(s) a "${this.getLabelTipoServicio(nuevoTipoServicio)}"?\n\n` +
      `Esta acción se registrará en el historial de cada vehículo.`
    );

    if (!confirmacion) {
      return;
    }

    this.procesando.set(true);
    this.progreso.set(0);

    // Crear array de observables para cambiar el tipo de servicio de cada vehículo
    const cambios = this.vehiculos.map((vehiculo: any) => {
      const observacionesCompletas = observaciones ?
        `Cambio de tipo de servicio en bloque: ${observaciones}` :
        'Cambio de tipo de servicio realizado en bloque';

      // Actualizar el vehículo con el nuevo tipo de servicio
      const vehiculoActualizado = {
        ...vehiculo,
        tipoServicio: nuevoTipoServicio
      };

      return this.vehiculoService.updateVehiculo(vehiculo.id, vehiculoActualizado);
    });

    // Ejecutar todos los cambios en paralelo
    forkJoin(cambios).subscribe({
      next: (vehiculosActualizados: any) => {
        this.procesando.set(false);

        // Mostrar notificación de éxito
        const tipoLabel = this.getLabelTipoServicio(nuevoTipoServicio);
        this.snackBar.open(
          `Tipo de servicio de ${vehiculosActualizados.length} vehículo(s) cambiado a ${tipoLabel}`,
          'Cerrar',
          {
            duration: 4000,
            panelClass: ['snackbar-success']
          }
        );

        // Cerrar modal y devolver los vehículos actualizados
        this.dialogRef.close({
          vehiculos: vehiculosActualizados,
          nuevoTipoServicio: nuevoTipoServicio
        });
      },
      error: (error: any) => {
        this.procesando.set(false);
        console.error('Error cambiando tipo de servicio de vehículos en bloque:', error);

        let mensaje = 'Error al cambiar el tipo de servicio de los vehículos';

        if (error.status === 422) {
          mensaje = 'Error de validación en algunos vehículos';
        } else if (error.status === 404) {
          mensaje = 'Algunos vehículos no fueron encontrados';
        } else if (error.status === 403) {
          mensaje = 'No tienes permisos para cambiar el tipo de servicio de algunos vehículos';
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