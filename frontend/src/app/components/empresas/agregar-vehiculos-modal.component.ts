import { Component, inject, signal } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { VehiculoFormComponent } from '../vehiculos/vehiculo-form.component';
import { VehiculoCreate } from '../../models/vehiculo.model';

interface Resolucion {
  id: string;
  numero: string;
  tipoResolucion: 'PADRE' | 'HIJO';
  resuelve: string;
  rutasAutorizadas: string[];
}

interface VehiculoForm {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  categoria: string;
  anioFabricacion: number;
  numeroTuc: string;
  rutasAsignadasIds: string[];
  datosTecnicos: any;
}

@Component({
  selector: 'app-agregar-vehiculos-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    VehiculoFormComponent
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>add_circle</mat-icon>
          Agregar Vehículos a {{ resolucion.numero }}
        </h2>
        <button mat-icon-button (click)="cerrar()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <div class="resolucion-info">
          <mat-card class="info-card">
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Resolución:</span>
                  <span class="value">{{ resolucion.numero }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Tipo:</span>
                  <span class="value tipo-chip" [class]="resolucion.tipoResolucion.toLowerCase()">
                    {{ resolucion.tipoResolucion }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">Resuelve:</span>
                  <span class="value">{{ resolucion.resuelve }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Rutas Autorizadas:</span>
                  <span class="value">{{ resolucion.rutasAutorizadas.length }} rutas</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Formulario de Vehículo Reutilizado -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>add</mat-icon>
              Agregar Nuevo Vehículo
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <app-vehiculo-form 
              [modalMode]="true"
              [empresaId]="empresaId"
              [resolucionId]="resolucion.id"
              (vehiculoCreated)="onVehiculoCreated($event)">
            </app-vehiculo-form>
          </mat-card-content>
        </mat-card>

        <!-- Tabla de Vehículos -->
        <mat-card class="table-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>list</mat-icon>
              Vehículos a Agregar
            </mat-card-title>
            <mat-card-subtitle>
              {{ vehiculosParaAgregar().length }} vehículos configurados
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (vehiculosParaAgregar().length === 0) {
              <div class="empty-state">
                <mat-icon class="empty-icon">directions_car</mat-icon>
                <h3>No hay vehículos agregados</h3>
                <p>Agrega vehículos usando el formulario de arriba</p>
              </div>
            } @else {
              <div class="table-container">
                <table mat-table [dataSource]="vehiculosParaAgregar()" class="vehiculos-table">
                  <!-- Placa -->
                  <ng-container matColumnDef="placa">
                    <th mat-header-cell *matHeaderCellDef>Placa</th>
                    <td mat-cell *matCellDef="let vehiculo">
                      <span class="placa-text">{{ vehiculo.placa }}</span>
                    </td>
                  </ng-container>

                  <!-- Marca/Modelo -->
                  <ng-container matColumnDef="marcaModelo">
                    <th mat-header-cell *matHeaderCellDef>Marca/Modelo</th>
                    <td mat-cell *matCellDef="let vehiculo">
                      <div class="marca-modelo">
                        <div class="marca">{{ vehiculo.marca }}</div>
                        <div class="modelo">{{ vehiculo.modelo }}</div>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Categoría -->
                  <ng-container matColumnDef="categoria">
                    <th mat-header-cell *matHeaderCellDef>Categoría</th>
                    <td mat-cell *matCellDef="let vehiculo">
                      <span class="categoria-chip">{{ vehiculo.categoria }}</span>
                    </td>
                  </ng-container>

                  <!-- Año -->
                  <ng-container matColumnDef="anio">
                    <th mat-header-cell *matHeaderCellDef>Año</th>
                    <td mat-cell *matCellDef="let vehiculo">
                      {{ vehiculo.anioFabricacion }}
                    </td>
                  </ng-container>

                  <!-- TUC -->
                  <ng-container matColumnDef="tuc">
                    <th mat-header-cell *matHeaderCellDef>TUC</th>
                    <td mat-cell *matCellDef="let vehiculo">
                      @if (vehiculo.numeroTuc) {
                        <span class="tuc-text">{{ vehiculo.numeroTuc }}</span>
                      } @else {
                        <span class="sin-tuc">Sin TUC</span>
                      }
                    </td>
                  </ng-container>

                  <!-- Rutas -->
                  <ng-container matColumnDef="rutas">
                    <th mat-header-cell *matHeaderCellDef>Rutas</th>
                    <td mat-cell *matCellDef="let vehiculo">
                      @if (vehiculo.rutasAsignadasIds.length > 0) {
                        <span class="rutas-count">{{ vehiculo.rutasAsignadasIds.length }} rutas</span>
                      } @else {
                        <span class="sin-rutas">Sin rutas</span>
                      }
                    </td>
                  </ng-container>

                  <!-- Acciones -->
                  <ng-container matColumnDef="acciones">
                    <th mat-header-cell *matHeaderCellDef>Acciones</th>
                    <td mat-cell *matCellDef="let vehiculo">
                      <button mat-icon-button [matTooltip]="'Configurar rutas'" (click)="configurarRutas(vehiculo)" class="action-icon">
                        <mat-icon>route</mat-icon>
                      </button>
                      <button mat-icon-button [matTooltip]="'Editar'" (click)="editarVehiculo(vehiculo)" class="action-icon">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button [matTooltip]="'Eliminar'" (click)="eliminarVehiculo(vehiculo)" class="action-icon danger">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="columnasVehiculos"></tr>
                  <tr mat-row *matRowDef="let row; columns: columnasVehiculos;"></tr>
                </table>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="modal-actions">
        <button mat-stroked-button (click)="cerrar()" class="secondary-button">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="guardarVehiculos()" 
                [disabled]="vehiculosParaAgregar().length === 0 || isSubmitting()"
                class="primary-button">
          @if (isSubmitting()) {
            <mat-spinner diameter="20"></mat-spinner>
          }
          @if (!isSubmitting()) {
            <mat-icon>save</mat-icon>
          }
          {{ isSubmitting() ? 'Guardando...' : 'Guardar Vehículos' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .modal-container {
      max-width: 1200px;
      width: 100%;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .modal-header h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #1976d2;
    }

    .close-button {
      color: #666;
    }

    .modal-content {
      max-height: 80vh;
      overflow-y: auto;
    }

    .resolucion-info {
      margin-bottom: 24px;
    }

    .info-card {
      background-color: #f8f9fa;
      border-left: 4px solid #1976d2;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .value {
      font-weight: 600;
      color: #333;
    }

    .tipo-chip {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      display: inline-block;
    }

    .tipo-chip.padre {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .tipo-chip.hija {
      background-color: #fff3e0;
      color: #ff9800;
    }

    .form-card, .table-card {
      margin-bottom: 24px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #666;
      font-weight: 500;
    }

    .empty-state p {
      margin: 0;
      color: #999;
    }

    .table-container {
      overflow-x: auto;
    }

    .vehiculos-table {
      width: 100%;
      background: white;
    }

    .vehiculos-table th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
      padding: 12px 8px;
    }

    .vehiculos-table td {
      padding: 12px 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .placa-text {
      font-weight: 600;
      font-family: monospace;
    }

    .marca-modelo {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .marca {
      font-weight: 600;
      color: #333;
    }

    .modelo {
      font-size: 12px;
      color: #666;
    }

    .categoria-chip {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .tuc-text {
      font-family: monospace;
      font-weight: 500;
      color: #333;
    }

    .sin-tuc, .sin-rutas {
      color: #999;
      font-style: italic;
    }

    .rutas-count {
      font-weight: 500;
      color: #1976d2;
    }

    .action-icon {
      margin-right: 4px;
    }

    .action-icon.danger {
      color: #f44336;
    }

    .modal-actions {
      padding: 16px 0;
      gap: 12px;
    }

    .primary-button, .secondary-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 4px;
      text-transform: uppercase;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.3s ease;
    }

    .primary-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .secondary-button:hover {
      background-color: #f5f5f5;
      transform: translateY(-1px);
    }
  `]
})
export class AgregarVehiculosModalComponent {
  private dialogRef = inject(MatDialogRef<AgregarVehiculosModalComponent>);
  private snackBar = inject(MatSnackBar);
  private data = inject(MAT_DIALOG_DATA);

  isSubmitting = signal(false);
  resolucion: Resolucion = this.data.resolucion;
  empresaId: string = this.data.empresaId;
  vehiculosParaAgregar = signal<VehiculoForm[]>([]);

  // Columnas para la tabla
  columnasVehiculos = ['placa', 'marcaModelo', 'categoria', 'anio', 'tuc', 'rutas', 'acciones'];

  onVehiculoCreated(vehiculoCreate: VehiculoCreate): void {
    const nuevoVehiculo: VehiculoForm = {
      id: Date.now().toString(),
      placa: vehiculoCreate.placa,
      marca: vehiculoCreate.marca,
      modelo: vehiculoCreate.modelo,
      categoria: vehiculoCreate.categoria,
      anioFabricacion: vehiculoCreate.anioFabricacion,
      numeroTuc: vehiculoCreate.tuc?.nroTuc || '',
      rutasAsignadasIds: vehiculoCreate.rutasAsignadasIds || [],
      datosTecnicos: vehiculoCreate.datosTecnicos
    };

    this.vehiculosParaAgregar.update(current => [...current, nuevoVehiculo]);
    this.snackBar.open('Vehículo agregado a la lista', 'Cerrar', { duration: 2000 });
  }

  configurarRutas(vehiculo: VehiculoForm): void {
    this.snackBar.open(`Configurar rutas para ${vehiculo.placa}`, 'Cerrar', { duration: 3000 });
  }

  editarVehiculo(vehiculo: VehiculoForm): void {
    this.snackBar.open(`Editar ${vehiculo.placa}`, 'Cerrar', { duration: 3000 });
  }

  eliminarVehiculo(vehiculo: VehiculoForm): void {
    this.vehiculosParaAgregar.update(current => 
      current.filter(v => v.id !== vehiculo.id)
    );
    this.snackBar.open(`${vehiculo.placa} eliminado de la lista`, 'Cerrar', { duration: 2000 });
  }

  guardarVehiculos(): void {
    if (this.vehiculosParaAgregar().length > 0) {
      this.isSubmitting.set(true);
      
      const vehiculosACrear: VehiculoCreate[] = this.vehiculosParaAgregar().map(vehiculo => ({
        placa: vehiculo.placa,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        categoria: vehiculo.categoria,
        anioFabricacion: vehiculo.anioFabricacion,
        empresaActualId: this.empresaId,
        resolucionId: this.resolucion.id,
        tipoServicio: 'PERSONAS', // Valor por defecto - debería venir del formulario
        rutasAsignadasIds: vehiculo.rutasAsignadasIds || [],
        tuc: vehiculo.numeroTuc ? { 
          nroTuc: vehiculo.numeroTuc, 
          fechaEmision: new Date().toISOString() 
        } : undefined,
        datosTecnicos: vehiculo.datosTecnicos
      }));

      // Simular guardado
      setTimeout(() => {
        this.isSubmitting.set(false);
        this.snackBar.open(`${vehiculosACrear.length} vehículos agregados exitosamente a ${this.resolucion.numero}`, 'Cerrar', { duration: 3000 });
        this.dialogRef.close({
          success: true,
          vehiculos: vehiculosACrear,
          resolucionId: this.resolucion.id
        });
      }, 2000);
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
} 