import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface VerificacionCoordenadasData {
  total_rutas: number;
  rutas_con_coordenadas: number;
  rutas_sin_coordenadas: number;
  porcentaje_con_coordenadas: number;
  detalles_problemas?: Array<{
    ruta_id: string;
    codigo_ruta: string;
    origen: { nombre: string; tiene_coordenadas: boolean };
    destino: { nombre: string; tiene_coordenadas: boolean };
    itinerario_sin_coordenadas: Array<{ nombre: string; orden: number }>;
  }>;
  historial?: Array<{
    timestamp: Date;
    tipo: 'reemplazo' | 'desactivacion';
    rutaId: string;
    codigoRuta: string;
    descripcion: string;
    datosAnteriores: any;
  }>;
}

@Component({
  selector: 'app-verificar-coordenadas-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>map</mat-icon>
      Verificación de Coordenadas
    </h2>

    <mat-dialog-content>
      <div class="resumen">
        <div class="stat-card">
          <mat-icon class="stat-icon total">route</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{ data.total_rutas }}</div>
            <div class="stat-label">Total Rutas</div>
          </div>
        </div>

        <div class="stat-card success">
          <mat-icon class="stat-icon">check_circle</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{ data.rutas_con_coordenadas }}</div>
            <div class="stat-label">Con Coordenadas</div>
          </div>
        </div>

        <div class="stat-card error">
          <mat-icon class="stat-icon">error</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{ data.rutas_sin_coordenadas }}</div>
            <div class="stat-label">Sin Coordenadas</div>
          </div>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-label">
          <span>Completitud</span>
          <span class="progress-value">{{ data.porcentaje_con_coordenadas.toFixed(1) }}%</span>
        </div>
        <mat-progress-bar 
          mode="determinate" 
          [value]="data.porcentaje_con_coordenadas"
          [color]="data.porcentaje_con_coordenadas === 100 ? 'primary' : 'warn'">
        </mat-progress-bar>
      </div>

      @if (data.rutas_sin_coordenadas > 0 && data.detalles_problemas) {
        <div class="detalle-section">
          <h3>
            <mat-icon>warning</mat-icon>
            Rutas sin Coordenadas
          </h3>
          
          <table mat-table [dataSource]="data.detalles_problemas" class="detalle-table">
            <ng-container matColumnDef="codigo">
              <th mat-header-cell *matHeaderCellDef>Código</th>
              <td mat-cell *matCellDef="let ruta">{{ ruta.codigo_ruta }}</td>
            </ng-container>

            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Ruta</th>
              <td mat-cell *matCellDef="let ruta">
                {{ ruta.origen.nombre }} - {{ ruta.destino.nombre }}
              </td>
            </ng-container>

            <ng-container matColumnDef="problema">
              <th mat-header-cell *matHeaderCellDef>Problema</th>
              <td mat-cell *matCellDef="let ruta">
                <div class="problemas">
                  @if (!ruta.origen.tiene_coordenadas) {
                    <span class="problema-badge">Origen</span>
                  }
                  @if (!ruta.destino.tiene_coordenadas) {
                    <span class="problema-badge">Destino</span>
                  }
                  @if (ruta.itinerario_sin_coordenadas && ruta.itinerario_sin_coordenadas.length > 0) {
                    <span class="problema-badge">Itinerario ({{ ruta.itinerario_sin_coordenadas.length }})</span>
                  }
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let ruta">
                <button mat-icon-button 
                        color="primary"
                        (click)="corregirRuta(ruta)"
                        matTooltip="Corregir localidades">
                  <mat-icon>edit_location</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['codigo', 'nombre', 'problema', 'acciones']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['codigo', 'nombre', 'problema', 'acciones'];"></tr>
          </table>
        </div>
      }

      @if (data.porcentaje_con_coordenadas === 100) {
        <div class="success-message">
          <mat-icon>celebration</mat-icon>
          <p>¡Todas las rutas tienen coordenadas completas!</p>
        </div>
      }

      @if (data.historial && data.historial.length > 0) {
        <div class="historial-section">
          <h3>
            <mat-icon>history</mat-icon>
            Últimas Modificaciones
          </h3>
          
          <div class="historial-list">
            @for (modificacion of data.historial; track modificacion.timestamp) {
              <div class="historial-item">
                <div class="historial-icon">
                  @if (modificacion.tipo === 'reemplazo') {
                    <mat-icon class="icon-reemplazo">swap_horiz</mat-icon>
                  } @else {
                    <mat-icon class="icon-desactivacion">block</mat-icon>
                  }
                </div>
                <div class="historial-content">
                  <div class="historial-descripcion">{{ modificacion.descripcion }}</div>
                  <div class="historial-timestamp">{{ modificacion.timestamp | date:'short' }}</div>
                </div>
                <button mat-icon-button 
                        color="warn"
                        (click)="revertir(modificacion)"
                        matTooltip="Revertir cambio">
                  <mat-icon>undo</mat-icon>
                </button>
              </div>
            }
          </div>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
      @if (data.rutas_sin_coordenadas > 0) {
        <button mat-raised-button color="primary" (click)="sincronizar()">
          <mat-icon>sync</mat-icon>
          Sincronizar Localidades
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 600px;
      max-width: 800px;
      padding: 24px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1976d2;
      margin: 0;
    }

    .resumen {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      background: #f5f5f5;
      border-left: 4px solid #1976d2;
    }

    .stat-card.success {
      background: #e8f5e9;
      border-left-color: #4caf50;
    }

    .stat-card.error {
      background: #ffebee;
      border-left-color: #f44336;
    }

    .stat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
    }

    .stat-card.success .stat-icon {
      color: #4caf50;
    }

    .stat-card.error .stat-icon {
      color: #f44336;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 600;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
    }

    .progress-section {
      margin-bottom: 24px;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #666;
    }

    .progress-value {
      font-weight: 600;
      color: #1976d2;
    }

    .detalle-section {
      margin-top: 24px;
    }

    .detalle-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f57c00;
      margin-bottom: 16px;
    }

    .detalle-table {
      width: 100%;
      max-height: 300px;
      overflow-y: auto;
    }

    .problemas {
      display: flex;
      gap: 8px;
    }

    .problema-badge {
      padding: 4px 8px;
      border-radius: 4px;
      background: #ffebee;
      color: #c62828;
      font-size: 12px;
      font-weight: 500;
    }

    .success-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      background: #e8f5e9;
      border-radius: 8px;
      margin-top: 16px;
    }

    .success-message mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
      margin-bottom: 8px;
    }

    .success-message p {
      margin: 0;
      font-size: 16px;
      color: #2e7d32;
      font-weight: 500;
    }

    .historial-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 2px solid #e0e0e0;
    }

    .historial-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
      margin-bottom: 16px;
      font-size: 16px;
    }

    .historial-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .historial-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }

    .historial-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-reemplazo {
      color: #2196f3;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .icon-desactivacion {
      color: #f57c00;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .historial-content {
      flex: 1;
    }

    .historial-descripcion {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }

    .historial-timestamp {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
  `]
})
export class VerificarCoordenadasModalComponent {
  constructor(
    public dialogRef: MatDialogRef<VerificarCoordenadasModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VerificacionCoordenadasData
  ) {}

  sincronizar() {
    this.dialogRef.close('sincronizar');
  }

  corregirRuta(ruta: any) {
    // No cerrar el modal, solo emitir evento para abrir el modal de corrección
    this.dialogRef.close({ action: 'corregir', ruta, mantenerAbierto: true });
  }

  revertir(modificacion: any) {
    this.dialogRef.close({ action: 'revertir', modificacion });
  }
}
