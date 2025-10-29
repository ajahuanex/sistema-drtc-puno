import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { DataManagerClientService, DataManagerStats } from '../../services/data-manager-client.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-data-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div class="header-content">
          <h1>
            <mat-icon>storage</mat-icon>
            Dashboard de Datos Persistentes
          </h1>
          <p class="subtitle">Sistema DataManager - Datos en memoria durante la sesión</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button 
                  color="primary" 
                  (click)="refreshStats()"
                  [disabled]="loading()"
                  matTooltip="Actualizar estadísticas">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
          @if (!environment.production) {
            <button mat-stroked-button 
                    color="warn" 
                    (click)="resetSystem()"
                    [disabled]="loading()"
                    matTooltip="⚠️ Resetear todos los datos (solo desarrollo)">
              <mat-icon>restore</mat-icon>
              Reset Sistema
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="60"></mat-spinner>
          <p>Cargando estadísticas del DataManager...</p>
        </div>
      } @else if (stats()) {
        <div class="stats-grid">
          <!-- Estadísticas Generales -->
          <mat-card class="stats-card general">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>assessment</mat-icon>
                Estadísticas Generales
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stats-list">
                <div class="stat-item">
                  <span class="stat-label">Empresas:</span>
                  <span class="stat-value">{{ stats()?.estadisticas_generales?.total_empresas || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Vehículos:</span>
                  <span class="stat-value">{{ stats()?.estadisticas_generales?.total_vehiculos || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Conductores:</span>
                  <span class="stat-value">{{ stats()?.estadisticas_generales?.total_conductores || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Rutas:</span>
                  <span class="stat-value">{{ stats()?.estadisticas_generales?.total_rutas || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Expedientes:</span>
                  <span class="stat-value">{{ stats()?.estadisticas_generales?.total_expedientes || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Resoluciones:</span>
                  <span class="stat-value">{{ stats()?.estadisticas_generales?.total_resoluciones || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Validaciones:</span>
                  <span class="stat-value">{{ stats()?.estadisticas_generales?.total_validaciones || 0 }}</span>
                </div>
              </div>
              <div class="total-entities">
                <strong>Total Entidades: {{ totalEntities() }}</strong>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Estados de Vehículos -->
          <mat-card class="stats-card vehicles">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>directions_car</mat-icon>
                Estados de Vehículos
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="states-list">
                @for (state of vehicleStates(); track state.estado) {
                  <div class="state-item">
                    <mat-chip [class]="'state-' + state.estado.toLowerCase()">
                      {{ state.estado }}
                    </mat-chip>
                    <span class="state-count">{{ state.cantidad }}</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Estados de Conductores -->
          <mat-card class="stats-card drivers">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>person</mat-icon>
                Estados de Conductores
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="states-list">
                @for (state of driverStates(); track state.estado) {
                  <div class="state-item">
                    <mat-chip [class]="'state-' + state.estado.toLowerCase()">
                      {{ state.estado }}
                    </mat-chip>
                    <span class="state-count">{{ state.cantidad }}</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Relaciones Activas -->
          <mat-card class="stats-card relations">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>link</mat-icon>
                Relaciones Activas
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="relations-grid">
                <div class="relation-item">
                  <div class="relation-label">Vehículos con conductor</div>
                  <div class="relation-value success">
                    {{ stats()?.relaciones_activas?.vehiculos_con_conductor || 0 }}
                  </div>
                </div>
                <div class="relation-item">
                  <div class="relation-label">Vehículos sin conductor</div>
                  <div class="relation-value warning">
                    {{ stats()?.relaciones_activas?.vehiculos_sin_conductor || 0 }}
                  </div>
                </div>
                <div class="relation-item">
                  <div class="relation-label">Conductores con vehículo</div>
                  <div class="relation-value success">
                    {{ stats()?.relaciones_activas?.conductores_con_vehiculo || 0 }}
                  </div>
                </div>
                <div class="relation-item">
                  <div class="relation-label">Conductores sin vehículo</div>
                  <div class="relation-value info">
                    {{ stats()?.relaciones_activas?.conductores_sin_vehiculo || 0 }}
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Información de Sesión -->
          <mat-card class="stats-card session">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>schedule</mat-icon>
                Información de Sesión
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="session-info">
                <div class="session-item">
                  <span class="session-label">Inicio de sesión:</span>
                  <span class="session-value">{{ formatDateTime(stats()?.informacion_sesion?.inicio_sesion) }}</span>
                </div>
                <div class="session-item">
                  <span class="session-label">Última actualización:</span>
                  <span class="session-value">{{ formatDateTime(stats()?.informacion_sesion?.ultima_actualizacion) }}</span>
                </div>
                <div class="session-item">
                  <span class="session-label">Tiempo activo:</span>
                  <span class="session-value uptime">{{ stats()?.informacion_sesion?.tiempo_activo || 'N/A' }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Operaciones Recientes -->
          <mat-card class="stats-card operations">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>history</mat-icon>
                Operaciones Recientes
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="operations-list">
                @for (operation of recentOperations(); track operation.timestamp) {
                  <div class="operation-item">
                    <div class="operation-time">{{ formatTime(operation.timestamp) }}</div>
                    <div class="operation-type">{{ operation.tipo }}</div>
                    <div class="operation-description">{{ operation.descripcion }}</div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      } @else {
        <div class="error-container">
          <mat-icon class="error-icon">error</mat-icon>
          <h3>Error al cargar estadísticas</h3>
          <p>No se pudieron cargar las estadísticas del DataManager</p>
          <button mat-raised-button color="primary" (click)="refreshStats()">
            Reintentar
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 16px;
    }

    .header-content h1 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 28px;
      font-weight: 600;
    }

    .subtitle {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .header-actions button {
      color: white;
      border-color: rgba(255, 255, 255, 0.5);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
    }

    .loading-container p {
      margin-top: 24px;
      color: #666;
      font-size: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .stats-card {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stats-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .stats-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
    }

    .stats-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .stat-item:last-child {
      border-bottom: none;
    }

    .stat-label {
      color: #666;
      font-weight: 500;
    }

    .stat-value {
      font-weight: 600;
      color: #1976d2;
      font-size: 18px;
    }

    .total-entities {
      margin-top: 16px;
      padding: 12px;
      background: #e3f2fd;
      border-radius: 8px;
      text-align: center;
      color: #1976d2;
    }

    .states-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .state-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
    }

    .state-count {
      font-weight: 600;
      font-size: 16px;
    }

    .state-activo {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .state-inactivo {
      background-color: #f44336 !important;
      color: white !important;
    }

    .state-mantenimiento {
      background-color: #ff9800 !important;
      color: white !important;
    }

    .relations-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .relation-item {
      text-align: center;
      padding: 12px;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .relation-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .relation-value {
      font-size: 24px;
      font-weight: 600;
    }

    .relation-value.success {
      color: #4caf50;
    }

    .relation-value.warning {
      color: #ff9800;
    }

    .relation-value.info {
      color: #2196f3;
    }

    .session-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .session-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .session-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .session-value {
      font-weight: 500;
      color: #333;
    }

    .session-value.uptime {
      color: #4caf50;
      font-weight: 600;
    }

    .operations-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .operation-item {
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .operation-item:last-child {
      border-bottom: none;
    }

    .operation-time {
      font-size: 11px;
      color: #999;
    }

    .operation-type {
      font-weight: 600;
      color: #1976d2;
      font-size: 12px;
      margin: 2px 0;
    }

    .operation-description {
      font-size: 13px;
      color: #666;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
    }

    .error-icon {
      font-size: 64px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .error-container h3 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .error-container p {
      margin: 0 0 24px 0;
      color: #666;
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .header-actions {
        width: 100%;
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .relations-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DataManagerDashboardComponent implements OnInit {
  private dataManager = inject(DataManagerClientService);
  private snackBar = inject(MatSnackBar);

  // Signals
  stats = signal<DataManagerStats | null>(null);
  loading = signal(true);
  
  // Computed values
  totalEntities = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    return Object.values(s.estadisticas_generales).reduce((sum, val) => sum + val, 0);
  });

  vehicleStates = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return Object.entries(s.estadisticas_por_estado.vehiculos).map(([estado, cantidad]) => ({
      estado,
      cantidad
    }));
  });

  driverStates = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return Object.entries(s.estadisticas_por_estado.conductores).map(([estado, cantidad]) => ({
      estado,
      cantidad
    }));
  });

  recentOperations = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return s.log_operaciones_recientes.slice(-5).reverse();
  });

  // Environment access
  environment = environment;

  ngOnInit(): void {
    this.loadStats();
    
    // Suscribirse a actualizaciones automáticas
    this.dataManager.stats$.subscribe(stats => {
      if (stats) {
        this.stats.set(stats);
        this.loading.set(false);
      }
    });
  }

  refreshStats(): void {
    this.loading.set(true);
    this.dataManager.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.set(response.data);
          this.snackBar.open('Estadísticas actualizadas', 'Cerrar', { duration: 3000 });
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error refreshing stats:', error);
        this.snackBar.open('Error al actualizar estadísticas', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  resetSystem(): void {
    if (confirm('⚠️ ¿Estás seguro de que quieres resetear todos los datos? Esta acción no se puede deshacer.')) {
      this.loading.set(true);
      this.dataManager.resetSystem().subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Sistema reseteado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadStats();
          }
        },
        error: (error) => {
          console.error('Error resetting system:', error);
          this.snackBar.open('Error al resetear sistema', 'Cerrar', { duration: 3000 });
          this.loading.set(false);
        }
      });
    }
  }

  private loadStats(): void {
    this.dataManager.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.loading.set(false);
      }
    });
  }

  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}