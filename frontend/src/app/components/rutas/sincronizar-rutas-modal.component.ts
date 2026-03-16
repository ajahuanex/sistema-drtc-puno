import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SincronizarRutasService } from '../../services/sincronizar-rutas.service';

@Component({
  selector: 'app-sincronizar-rutas-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>sync</mat-icon>
      Sincronizar Rutas con Localidades
    </h2>

    <mat-dialog-content>
      @if (!procesando && !completado) {
        <div class="info-section">
          <mat-icon class="info-icon">info</mat-icon>
          <p>
            Este proceso sincronizará las rutas con las localidades actuales.
            Buscará localidades por nombre y actualizará los IDs si es necesario.
          </p>
        </div>

        <div class="warning-section">
          <mat-icon class="warning-icon">warning</mat-icon>
          <p>
            <strong>Advertencia:</strong> Este proceso puede tomar varios minutos.
            No cierres esta ventana hasta que se complete.
          </p>
        </div>
      }

      @if (procesando) {
        <div class="procesando-section">
          <mat-spinner diameter="50"></mat-spinner>
          <p>{{ mensaje }}</p>
          @if (progreso > 0) {
            <div class="progreso">
              <mat-progress-bar mode="determinate" [value]="progreso"></mat-progress-bar>
              <span class="progreso-texto">{{ progreso.toFixed(0) }}%</span>
            </div>
          }
        </div>
      }

      @if (completado) {
        <div class="completado-section">
          <mat-icon class="completado-icon">check_circle</mat-icon>
          <h3>Sincronización Completada</h3>
          <p>{{ resultado }}</p>
          @if (estadisticas) {
            <div class="estadisticas">
              <div class="stat">
                <span class="label">Total Rutas:</span>
                <span class="valor">{{ estadisticas.total }}</span>
              </div>
              <div class="stat">
                <span class="label">Con Coordenadas:</span>
                <span class="valor success">{{ estadisticas.conCoordenadas }}</span>
              </div>
              <div class="stat">
                <span class="label">Sin Coordenadas:</span>
                <span class="valor error">{{ estadisticas.sinCoordenadas }}</span>
              </div>
              <div class="stat">
                <span class="label">Completitud:</span>
                <span class="valor">{{ estadisticas.porcentaje }}%</span>
              </div>
            </div>
          }
        </div>
      }

      @if (error) {
        <div class="error-section">
          <mat-icon class="error-icon">error</mat-icon>
          <p>{{ error }}</p>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (!procesando) {
        <button mat-button (click)="cerrar()">
          {{ completado ? 'Cerrar' : 'Cancelar' }}
        </button>
        @if (!completado) {
          <button mat-raised-button color="primary" (click)="sincronizar()">
            <mat-icon>sync</mat-icon>
            Sincronizar
          </button>
        }
      }
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
      padding: 24px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1976d2;
      margin: 0;
    }

    .info-section,
    .warning-section,
    .error-section,
    .procesando-section,
    .completado-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .info-section {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
    }

    .warning-section {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
    }

    .error-section {
      background: #ffebee;
      border-left: 4px solid #f44336;
    }

    .procesando-section {
      background: #f5f5f5;
      border-left: 4px solid #667eea;
      align-items: center;
      text-align: center;
    }

    .completado-section {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      align-items: center;
      text-align: center;
    }

    .info-icon,
    .warning-icon,
    .error-icon,
    .completado-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .info-icon {
      color: #2196f3;
    }

    .warning-icon {
      color: #ff9800;
    }

    .error-icon {
      color: #f44336;
    }

    .completado-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
    }

    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }

    h3 {
      margin: 8px 0;
      color: #2e7d32;
    }

    .progreso {
      width: 100%;
      margin-top: 16px;
    }

    .progreso-texto {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
      display: block;
    }

    .estadisticas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 16px;
      width: 100%;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }

    .stat .label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .stat .valor {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
    }

    .stat .valor.success {
      color: #4caf50;
    }

    .stat .valor.error {
      color: #f44336;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      border-top: 1px solid #e0e0e0;
    }
  `]
})
export class SincronizarRutasModalComponent {
  private sincronizarService = inject(SincronizarRutasService);
  private dialogRef = inject(MatDialogRef<SincronizarRutasModalComponent>);

  procesando = false;
  completado = false;
  error: string | null = null;
  mensaje = 'Sincronizando rutas...';
  progreso = 0;
  resultado = '';
  estadisticas: any = null;

  async sincronizar() {
    this.procesando = true;
    this.error = null;

    try {
      // Ejecutar sincronización
      this.mensaje = 'Sincronizando rutas con localidades...';
      const resultado = await this.sincronizarService.sincronizarRutasConLocalidades();
      
      this.resultado = resultado.mensaje;
      this.progreso = 50;

      // Obtener estadísticas
      this.mensaje = 'Obteniendo estadísticas...';
      this.estadisticas = await this.sincronizarService.obtenerEstadisticas();
      this.progreso = 100;

      this.completado = true;
      this.procesando = false;
    } catch (error) {
      console.error('Error en sincronización:', error);
      this.error = `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      this.procesando = false;
    }
  }

  cerrar() {
    this.dialogRef.close(this.completado);
  }
}
