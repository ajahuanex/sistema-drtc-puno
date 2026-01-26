import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Vehiculo } from '../../models/vehiculo.model';
import { VehiculoService } from '../../services/vehiculo.service';

interface VehiculosEliminadosData {
  vehiculosEliminados: Vehiculo[];
}

@Component({
  selector: 'app-vehiculos-eliminados-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>delete_sweep</mat-icon>
        Vehículos Eliminados
      </h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      <div class="info-banner">
        <mat-icon>info</mat-icon>
        <span>Estos vehículos han sido eliminados lógicamente. Puedes restaurarlos si es necesario.</span>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="data.vehiculosEliminados" class="vehiculos-table">
          <!-- Placa Column -->
          <ng-container matColumnDef="placa">
            <th mat-header-cell *matHeaderCellDef>Placa</th>
            <td mat-cell *matCellDef="let vehiculo">
              <strong>{{ vehiculo.placa }}</strong>
            </td>
          </ng-container>

          <!-- Marca/Modelo Column -->
          <ng-container matColumnDef="marca">
            <th mat-header-cell *matHeaderCellDef>Marca/Modelo</th>
            <td mat-cell *matCellDef="let vehiculo">
              {{ vehiculo.marca }} {{ vehiculo.modelo }}
            </td>
          </ng-container>

          <!-- Estado Column -->
          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let vehiculo">
              <span class="estado-badge eliminado">{{ vehiculo.estado }}</span>
            </td>
          </ng-container>

          <!-- Acciones Column -->
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let vehiculo">
              <button mat-icon-button 
                      color="primary"
                      (click)="restaurarVehiculo(vehiculo)"
                      [disabled]="procesando()"
                      matTooltip="Restaurar vehículo">
                <mat-icon>restore</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>

      @if (data.vehiculosEliminados.length === 0) {
        <div class="empty-state">
          <mat-icon>check_circle</mat-icon>
          <p>No hay vehículos eliminados</p>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #d32f2f;
    }

    .modal-content {
      padding: 24px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .info-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #e3f2fd;
      border-radius: 4px;
      margin-bottom: 24px;
      color: #1976d2;
    }

    .table-container {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .vehiculos-table {
      width: 100%;
    }

    .estado-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .estado-badge.eliminado {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4caf50;
      margin-bottom: 16px;
    }

    .empty-state p {
      margin: 0;
      font-size: 16px;
    }
  `]
})
export class VehiculosEliminadosModalComponent {
  private dialogRef = inject(MatDialogRef<VehiculosEliminadosModalComponent>);
  public data = inject<VehiculosEliminadosData>(MAT_DIALOG_DATA);
  private vehiculoService = inject(VehiculoService);
  private snackBar = inject(MatSnackBar);

  procesando = signal(false);
  displayedColumns = ['placa', 'marca', 'estado', 'acciones'];

  restaurarVehiculo(vehiculo: Vehiculo): void {
    if (confirm(`¿Estás seguro de que deseas restaurar el vehículo ${vehiculo.placa}?`)) {
      this.procesando.set(true);
      
      this.vehiculoService.restaurarVehiculo(vehiculo.id).subscribe({
        next: () => {
          this.snackBar.open(
            `Vehículo ${vehiculo.placa} restaurado exitosamente`,
            'Cerrar',
            { duration: 3000 }
          );
          
          // Remover el vehículo de la lista
          const index = this.data.vehiculosEliminados.findIndex(v => v.id === vehiculo.id);
          if (index > -1) {
            this.data.vehiculosEliminados.splice(index, 1);
          }
          
          // Si no quedan más vehículos eliminados, cerrar el modal
          if (this.data.vehiculosEliminados.length === 0) {
            this.dialogRef.close({ restaurado: true });
          }
        },
        error: (error: any) => {
          console.error('Error restaurando vehículo:', error);
          this.snackBar.open(
            'Error al restaurar el vehículo',
            'Cerrar',
            { duration: 3000 }
          );
        },
        complete: () => {
          this.procesando.set(false);
        }
      });
    }
  }
}