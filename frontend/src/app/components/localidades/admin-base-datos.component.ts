import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LocalidadesSeederService } from '../../services/localidades-seeder.service';

@Component({
  selector: 'app-admin-base-datos',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule
  ],
  template: `
    <mat-card class="admin-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>settings</mat-icon>
          Administración de Base de Datos
        </mat-card-title>
        <mat-card-subtitle>
          Inicialización y gestión de datos de localidades en MongoDB
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- Estado de la Base de Datos -->
        <div class="status-section">
          <h3>Estado Actual</h3>
          <div class="status-grid">
            <div class="status-item">
              <mat-icon class="status-icon">storage</mat-icon>
              <div class="status-info">
                <div class="status-label">Total Registros</div>
                <div class="status-value">{{ estadisticas().total }}</div>
              </div>
            </div>
            <div class="status-item">
              <mat-icon class="status-icon provincias">location_city</mat-icon>
              <div class="status-info">
                <div class="status-label">Provincias</div>
                <div class="status-value">{{ estadisticas().provincias }}</div>
              </div>
            </div>
            <div class="status-item">
              <mat-icon class="status-icon distritos">map</mat-icon>
              <div class="status-info">
                <div class="status-label">Distritos</div>
                <div class="status-value">{{ estadisticas().distritos }}</div>
              </div>
            </div>
            <div class="status-item">
              <mat-icon class="status-icon centros">home</mat-icon>
              <div class="status-info">
                <div class="status-label">Centros Poblados</div>
                <div class="status-value">{{ estadisticas().centrosPoblados }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progreso -->
        <div class="progress-section" *ngIf="procesando()">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p class="progress-text">{{ mensajeProceso() }}</p>
        </div>

        <!-- Resultado del último proceso -->
        <div class="result-section" *ngIf="ultimoResultado()">
          <div class="result-card" [class]="ultimoResultado()?.success ? 'success' : 'error'">
            <mat-icon>{{ ultimoResultado()?.success ? 'check_circle' : 'error' }}</mat-icon>
            <div class="result-content">
              <div class="result-message">{{ ultimoResultado()?.message }}</div>
              <div class="result-stats" *ngIf="ultimoResultado()?.stats">
                <span>Total: {{ ultimoResultado()?.stats.total }}</span>
                <span>Creadas: {{ ultimoResultado()?.stats.creadas }}</span>
                <span>Actualizadas: {{ ultimoResultado()?.stats.actualizadas }}</span>
                <span>Errores: {{ ultimoResultado()?.stats.errores }}</span>
              </div>
              <div class="result-errors" *ngIf="ultimoResultado()?.errores?.length">
                <details>
                  <summary>Ver errores ({{ ultimoResultado()?.errores?.length }})</summary>
                  <ul>
                    <li *ngFor="let error of ultimoResultado()?.errores">{{ error }}</li>
                  </ul>
                </details>
              </div>
            </div>
          </div>
        </div>
      </mat-card-content>

      <mat-card-actions>
        <div class="actions-grid">
          <button mat-raised-button 
                  color="primary"
                  [disabled]="procesando()"
                  (click)="inicializarBaseDatos()">
            <mat-icon>play_arrow</mat-icon>
            Inicializar Base de Datos
          </button>

          <button mat-raised-button 
                  color="accent"
                  [disabled]="procesando() || estadisticas().total === 0"
                  (click)="actualizarEstadisticas()">
            <mat-icon>refresh</mat-icon>
            Actualizar Estadísticas
          </button>

          <button mat-stroked-button 
                  [disabled]="procesando()"
                  (click)="exportarDatos()">
            <mat-icon>download</mat-icon>
            Exportar Datos
          </button>

          <button mat-stroked-button 
                  color="warn"
                  [disabled]="procesando()"
                  (click)="confirmarReinicializacion()">
            <mat-icon>refresh</mat-icon>
            Reinicializar
          </button>

          <button mat-stroked-button 
                  color="warn"
                  [disabled]="procesando() || estadisticas().total === 0"
                  (click)="confirmarLimpieza()">
            <mat-icon>delete_sweep</mat-icon>
            Limpiar Base de Datos
          </button>
        </div>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .admin-card {
      margin-bottom: 24px;
      max-width: 800px;
    }

    .admin-card .mat-mdc-card-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: -24px -24px 24px -24px;
      padding: 24px;
    }

    .admin-card .mat-mdc-card-title {
      color: white !important;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .admin-card .mat-mdc-card-subtitle {
      color: rgba(255, 255, 255, 0.9) !important;
      margin-top: 8px;
    }

    .status-section {
      margin-bottom: 24px;
    }

    .status-section h3 {
      margin: 0 0 16px 0;
      color: #495057;
      font-size: 18px;
      font-weight: 600;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .status-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #6c757d;
    }

    .status-icon.provincias { color: #667eea; }
    .status-icon.distritos { color: #f093fb; }
    .status-icon.centros { color: #4facfe; }

    .status-info {
      flex: 1;
    }

    .status-label {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .status-value {
      font-size: 24px;
      font-weight: 700;
      color: #495057;
    }

    .progress-section {
      margin: 24px 0;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 8px;
      border: 1px solid #90caf9;
    }

    .progress-text {
      margin: 12px 0 0 0;
      color: #1565c0;
      font-weight: 500;
      text-align: center;
    }

    .result-section {
      margin: 24px 0;
    }

    .result-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid;
    }

    .result-card.success {
      background: #e8f5e8;
      border-color: #4caf50;
      color: #2e7d32;
    }

    .result-card.error {
      background: #ffebee;
      border-color: #f44336;
      color: #c62828;
    }

    .result-card mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .result-content {
      flex: 1;
    }

    .result-message {
      font-weight: 600;
      margin-bottom: 8px;
    }

    .result-stats {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .result-stats span {
      background: rgba(255, 255, 255, 0.7);
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
    }

    .result-errors {
      margin-top: 12px;
    }

    .result-errors details {
      cursor: pointer;
    }

    .result-errors summary {
      font-weight: 500;
      padding: 4px 0;
    }

    .result-errors ul {
      margin: 8px 0 0 20px;
      padding: 0;
    }

    .result-errors li {
      margin: 4px 0;
      font-size: 14px;
      font-family: monospace;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      width: 100%;
    }

    .actions-grid button {
      justify-self: stretch;
    }

    @media (max-width: 768px) {
      .status-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }

      .result-stats {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class AdminBaseDatosComponent implements OnInit {
  private seederService = inject(LocalidadesSeederService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Signals para el estado
  procesando = signal(false);
  mensajeProceso = signal('');
  estadisticas = signal({
    total: 0,
    provincias: 0,
    distritos: 0,
    centrosPoblados: 0,
    activas: 0,
    inactivas: 0
  });
  ultimoResultado = signal<any>(null);

  async ngOnInit() {
    await this.actualizarEstadisticas();
  }

  async inicializarBaseDatos() {
    this.procesando.set(true);
    this.mensajeProceso.set('Inicializando base de datos...');
    this.ultimoResultado.set(null);

    try {
      const resultado = await this.seederService.inicializarBaseDatos();
      this.ultimoResultado.set(resultado);
      
      if (resultado.success) {
        this.snackBar.open('Base de datos inicializada exitosamente', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-success']
        });
      } else {
        this.snackBar.open('Inicialización completada con errores', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }

      await this.actualizarEstadisticas();
    } catch (error) {
      console.error('Error en inicialización:', error);
      this.snackBar.open('Error en la inicialización', 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.procesando.set(false);
      this.mensajeProceso.set('');
    }
  }

  async actualizarEstadisticas() {
    try {
      const stats = await this.seederService.obtenerEstadisticasBaseDatos();
      this.estadisticas.set(stats);
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
    }
  }

  async exportarDatos() {
    this.procesando.set(true);
    this.mensajeProceso.set('Exportando datos...');

    try {
      const datosJson = await this.seederService.exportarDatosMongoDB();
      
      // Crear y descargar archivo
      const blob = new Blob([datosJson], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `localidades-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.snackBar.open('Datos exportados exitosamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-success']
      });
    } catch (error) {
      console.error('Error exportando datos:', error);
      this.snackBar.open('Error exportando datos', 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.procesando.set(false);
      this.mensajeProceso.set('');
    }
  }

  confirmarReinicializacion() {
    if (confirm('¿Está seguro de que desea reinicializar la base de datos? Esto eliminará todos los datos existentes y los reemplazará con los datos iniciales.')) {
      this.reinicializarBaseDatos();
    }
  }

  async reinicializarBaseDatos() {
    this.procesando.set(true);
    this.mensajeProceso.set('Reinicializando base de datos...');
    this.ultimoResultado.set(null);

    try {
      const resultado = await this.seederService.reinicializarBaseDatos();
      this.ultimoResultado.set(resultado);
      
      if (resultado.success) {
        this.snackBar.open('Base de datos reinicializada exitosamente', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-success']
        });
      } else {
        this.snackBar.open('Error en la reinicialización', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }

      await this.actualizarEstadisticas();
    } catch (error) {
      console.error('Error en reinicialización:', error);
      this.snackBar.open('Error en la reinicialización', 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.procesando.set(false);
      this.mensajeProceso.set('');
    }
  }

  confirmarLimpieza() {
    if (confirm('¿Está seguro de que desea limpiar toda la base de datos? Esta acción no se puede deshacer.')) {
      this.limpiarBaseDatos();
    }
  }

  async limpiarBaseDatos() {
    this.procesando.set(true);
    this.mensajeProceso.set('Limpiando base de datos...');

    try {
      const exito = await this.seederService.limpiarBaseDatos();
      
      if (exito) {
        this.snackBar.open('Base de datos limpiada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      } else {
        this.snackBar.open('Error limpiando la base de datos', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }

      await this.actualizarEstadisticas();
      this.ultimoResultado.set(null);
    } catch (error) {
      console.error('Error limpiando base de datos:', error);
      this.snackBar.open('Error limpiando la base de datos', 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.procesando.set(false);
      this.mensajeProceso.set('');
    }
  }
}