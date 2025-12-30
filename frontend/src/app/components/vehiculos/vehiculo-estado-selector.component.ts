import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Vehiculo, EstadoVehiculo, ESTADOS_VEHICULO_LABELS } from '../../models/vehiculo.model';
import { CambiarEstadoVehiculoModalComponent } from './cambiar-estado-vehiculo-modal.component';

@Component({
  selector: 'app-vehiculo-estado-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule
  ],
  template: `
    <div class="estado-selector-container">
      <button mat-button 
              class="estado-button"
              [class]="'estado-' + vehiculo.estado.toLowerCase()"
              (click)="abrirModalCambioEstado()"
              [matTooltip]="'Cambiar estado del vehículo ' + vehiculo.placa">
        <span class="estado-text">{{ getLabelEstado(vehiculo.estado) }}</span>
      </button>
    </div>
  `,
  styles: [`
    .estado-selector-container {
      display: flex;
      align-items: center;
      min-width: 120px;
    }

    .estado-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-width: 100px;
      height: 32px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .estado-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .estado-text {
      text-align: center;
    }

    .estado-activo {
      background: #e8f5e8;
      color: #2e7d32;
      border: 1px solid #4caf50;
    }

    .estado-activo:hover {
      background: #c8e6c9;
    }

    .estado-inactivo {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #f44336;
    }

    .estado-inactivo:hover {
      background: #ffcdd2;
    }

    .estado-mantenimiento {
      background: #fff3e0;
      color: #f57c00;
      border: 1px solid #ff9800;
    }

    .estado-mantenimiento:hover {
      background: #ffe0b2;
    }

    .estado-suspendido {
      background: #f3e5f5;
      color: #7b1fa2;
      border: 1px solid #9c27b0;
    }

    .estado-suspendido:hover {
      background: #e1bee7;
    }

    .estado-fuera_de_servicio {
      background: #fce4ec;
      color: #c2185b;
      border: 1px solid #e91e63;
    }

    .estado-fuera_de_servicio:hover {
      background: #f8bbd9;
    }

    .estado-dado_de_baja {
      background: #ffebee;
      color: #d32f2f;
      border: 1px solid #d32f2f;
    }

    .estado-dado_de_baja:hover {
      background: #ffcdd2;
    }
  `]
})
export class VehiculoEstadoSelectorComponent {
  @Input() vehiculo!: Vehiculo;
  @Output() estadoChanged = new EventEmitter<{ vehiculo: Vehiculo; nuevoEstado: string }>();

  private dialog = inject(MatDialog);

  getLabelEstado(estado: string): string {
    return ESTADOS_VEHICULO_LABELS[estado as EstadoVehiculo] || estado;
  }

  abrirModalCambioEstado(): void {
    const dialogRef = this.dialog.open(CambiarEstadoVehiculoModalComponent, {
      data: { vehiculo: this.vehiculo },
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'cambiar-estado-modal-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Emitir el evento de cambio de estado
        this.estadoChanged.emit({
          vehiculo: result.vehiculo,
          nuevoEstado: result.nuevoEstado
        });
      }
    });
  }
}