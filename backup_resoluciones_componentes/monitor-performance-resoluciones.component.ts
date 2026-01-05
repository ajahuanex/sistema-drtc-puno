import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { Subject, takeUntil, interval, switchMap } from 'rxjs';
import { ResolucionService } from '../../services/resolucion.service';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { ChartComponent } from '../../shared/chart.component';

interface MetricaPerformance {
  id: string;
  nombre: string;
  valor: number;
  unidad: string;
  tendencia: 'up' | 'down' | 'stable';
  porcentajeCambio: number;
  estado: 'excelente' | 'bueno' | 'regular' | 'critico';
  descripcion: string;
  icono: string;
}

interface AlertaPerformance {
  id: string;
  tipo: 'performance' | 'error' | 'warning' | 'info';
  titulo: string;
  mensaje: string;
  timestamp: Date;
  severidad: 'alta' | 'media' | 'baja';
  resuelto: boolean;
}

interface EstadisticaOperacion {
  operacion: string;
  totalEjecuciones: number;
  tiempoPromedio: number;
  tiempoMinimo: number;
  tiempoMaximo: number;
  errores: number;
  tasaExito: number;
  ultimaEjecucion: Date;
}

@Component({
  selector: 'app-monitor-performance-resoluciones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    SmartIconComponent,
    ChartComponent
  ],
  template: `
    <div class="monitor-container">
      <!-- Header del Monitor -->
      <div class="monitor-header">
        <div class="header-content">
          <div class="header-title">
            <app-smart-icon iconName="speed" [size]="32"></app-smart-icon>
            <div class="title-text">
              <h1>Monitor de Performance</h1>
              <p class="header-subtitle">Monitoreo en tiempo real del módulo de resoluciones</p>
            </div>
          </div>
          
          <div class="header-status">
            <div class="status-indicator" [class]="'status-' + estadoGeneral()">
              <app-smart-icon [iconName]="getEstadoIcon(estadoGeneral())" [size]="24"></app-smart-icon>
              <span>{{ estadoGeneral() | titlecase }}</span>
            </div>
            
            <div class="ultima-actualizacion">
              <app-smart-icon iconName="schedule" [size]="16"></app-smart-icon>
              <span>{{ ultimaActualizacion() | date:'HH:mm:ss' }}</span>
            </div>
          </div>
        </div>
        
        <div class="header-actions">
          <button mat-stroked-button (click)="pausarMonitoreo()" [disabled]="!monitoreando()">
            <app-smart-icon iconName="pause" [size]="20"></app-smart-icon>
            {{ monitoreando() ? 'Pausar' : 'Pausado' }}
          </button>
          
          <button mat-raised-button color="primary" (click)="actualizarDatos()">
            <app-smart-icon iconName="refresh" [size]="20"></app-smart-icon>
            Actualizar
          </button>
        </div>
      </div>

      <!-- Métricas Principales -->
      <div class="metricas-principales">
        <div class="metricas-grid">
          @for (metrica of metricas(); track metrica.id) {
            <mat-card class="metrica-card" [class]="'card-' + metrica.estado">
              <mat-card-content>
                <div class="metrica-header">
                  <div class="metrica-icono">
                    <app-smart-icon [iconName]="metrica.icono" [size]="24"></app-smart-icon>
                  </div>
                  <div class="metrica-tendencia" [class]="'tendencia-' + metrica.tendencia">
                    <app-smart-icon [iconName]="getTendenciaIcon(metrica.tendencia)" [size]="16"></app-smart-icon>
                    <span>{{ metrica.porcentajeCambio > 0 ? '+' : '' }}{{ metrica.porcentajeCambio }}%</span>
                  </div>
                </div>
                
                <div class="metrica-contenido">
                  <h3 class="metrica-valor">{{ metrica.valor }}{{ metrica.unidad }}</h3>
                  <h4 class="metrica-nombre">{{ metrica.nombre }}</h4>
                  <p class="metrica-descripcion">{{ metrica.descripcion }}</p>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </div>

      <!-- Tabs de Detalles -->
      <mat-tab-group class="detalles-tabs">
        
        <!-- Tab: Gráficos de Performance -->
        <mat-tab label="Gráficos">
          <ng-template matTabContent>
            <div class="tab-content">
              <div class="graficos-performance">
                
                <!-- Gráfico de Tiempo de Respuesta -->
                <mat-card class="grafico-card">
                  <mat-card-header>
                    <mat-card-title>
                      <app-smart-icon iconName="timeline" [size]="20"></app-smart-icon>
                      Tiempo de Respuesta (últimos 30 min)
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <app-chart
                      type="line"
                      [data]="datosGraficoTiempoRespuesta()"
                      [options]="opcionesGraficoLinea"
                      [height]="300">
                    </app-chart>
                  </mat-card-content>
                </mat-card>

                <!-- Gráfico de Operaciones por Minuto -->
                <mat-card class="grafico-card">
                  <mat-card-header>
                    <mat-card-title>
                      <app-smart-icon iconName="bar_chart" [size]="20"></app-smart-icon>
                      Operaciones por Minuto
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <app-chart
                      type="bar"
                      [data]="datosGraficoOperaciones()"
                      [options]="opcionesGraficoBar"
                      [height]="300">
                    </app-chart>
                  </mat-card-content>
                </mat-card>

                <!-- Gráfico de Distribución de Errores -->
                <mat-card class="grafico-card">
                  <mat-card-header>
                    <mat-card-title>
                      <app-smart-icon iconName="pie_chart" [size]="20"></app-smart-icon>
                      Distribución de Errores
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <app-chart
                      type="doughnut"
                      [data]="datosGraficoErrores()"
                      [options]="opcionesGraficoPie"
                      [height]="300">
                    </app-chart>
                  </mat-card-content>
                </mat-card>

                <!-- Gráfico de Uso de Memoria -->
                <mat-card class="grafico-card">
                  <mat-card-header>
                    <mat-card-title>
                      <app-smart-icon iconName="memory" [size]="20"></app-smart-icon>
                      Uso de Memoria
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <app-chart
                      type="line"
                      [data]="datosGraficoMemoria()"
                      [options]="opcionesGraficoLinea"
                      [height]="300">
                    </app-chart>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Tab: Estadísticas de Operaciones -->
        <mat-tab label="Operaciones">
          <ng-template matTabContent>
            <div class="tab-content">
              <mat-card class="operaciones-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon iconName="functions" [size]="20"></app-smart-icon>
                    Estadísticas de Operaciones
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="tabla-container">
                    <table mat-table [dataSource]="estadisticasOperaciones()" class="operaciones-table">
                      
                      <ng-container matColumnDef="operacion">
                        <th mat-header-cell *matHeaderCellDef>Operación</th>
                        <td mat-cell *matCellDef="let elemento">{{ elemento.operacion }}</td>
                      </ng-container>

                      <ng-container matColumnDef="ejecuciones">
                        <th mat-header-cell *matHeaderCellDef>Ejecuciones</th>
                        <td mat-cell *matCellDef="let elemento">{{ elemento.totalEjecuciones | number }}</td>
                      </ng-container>

                      <ng-container matColumnDef="tiempoPromedio">
                        <th mat-header-cell *matHeaderCellDef>Tiempo Promedio</th>
                        <td mat-cell *matCellDef="let elemento">{{ elemento.tiempoPromedio }}ms</td>
                      </ng-container>

                      <ng-container matColumnDef="tasaExito">
                        <th mat-header-cell *matHeaderCellDef>Tasa de Éxito</th>
                        <td mat-cell *matCellDef="let elemento">
                          <mat-chip [class]="getTasaExitoClass(elemento.tasaExito)">
                            {{ elemento.tasaExito }}%
                          </mat-chip>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="ultimaEjecucion">
                        <th mat-header-cell *matHeaderCellDef>Última Ejecución</th>
                        <td mat-cell *matCellDef="let elemento">{{ elemento.ultimaEjecucion | date:'HH:mm:ss' }}</td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="columnasOperaciones"></tr>
                      <tr mat-row *matRowDef="let row; columns: columnasOperaciones;"></tr>
                    </table>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Tab: Alertas -->
        <mat-tab label="Alertas">
          <ng-template matTabContent>
            <div class="tab-content">
              <mat-card class="alertas-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon iconName="notifications" [size]="20"></app-smart-icon>
                    Alertas de Performance
                    @if (alertasActivas().length > 0) {
                      <mat-chip class="alertas-badge">{{ alertasActivas().length }}</mat-chip>
                    }
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  @if (alertas().length > 0) {
                    <div class="alertas-lista">
                      @for (alerta of alertas(); track alerta.id) {
                        <div class="alerta-item" [class]="'alerta-' + alerta.severidad" [class.resuelto]="alerta.resuelto">
                          <div class="alerta-icono">
                            <app-smart-icon [iconName]="getAlertaIcon(alerta.tipo)" [size]="20"></app-smart-icon>
                          </div>
                          <div class="alerta-contenido">
                            <h4 class="alerta-titulo">{{ alerta.titulo }}</h4>
                            <p class="alerta-mensaje">{{ alerta.mensaje }}</p>
                            <span class="alerta-timestamp">{{ alerta.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                          </div>
                          <div class="alerta-acciones">
                            @if (!alerta.resuelto) {
                              <button mat-icon-button (click)="resolverAlerta(alerta)" matTooltip="Marcar como resuelto">
                                <app-smart-icon iconName="check" [size]="18"></app-smart-icon>
                              </button>
                            }
                            <button mat-icon-button (click)="eliminarAlerta(alerta)" matTooltip="Eliminar alerta">
                              <app-smart-icon iconName="close" [size]="18"></app-smart-icon>
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="sin-alertas">
                      <app-smart-icon iconName="check_circle" [size]="48"></app-smart-icon>
                      <h3>No hay alertas activas</h3>
                      <p>El sistema está funcionando correctamente</p>
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Tab: Configuración -->
        <mat-tab label="Configuración">
          <ng-template matTabContent>
            <div class="tab-content">
              <mat-card class="configuracion-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon iconName="settings" [size]="20"></app-smart-icon>
                    Configuración del Monitor
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="configuracion-opciones">
                    <div class="opcion-grupo">
                      <h4>Intervalo de Actualización</h4>
                      <div class="intervalos-opciones">
                        @for (intervalo of intervalosDisponibles; track intervalo.valor) {
                          <mat-chip 
                            (click)="cambiarIntervalo(intervalo.valor)"
                            [class.selected]="intervaloActual() === intervalo.valor"
                            class="intervalo-chip">
                            {{ intervalo.label }}
                          </mat-chip>
                        }
                      </div>
                    </div>

                    <div class="opcion-grupo">
                      <h4>Métricas a Mostrar</h4>
                      <div class="metricas-opciones">
                        @for (metrica of metricasDisponibles; track metrica.id) {
                          <mat-chip 
                            (click)="toggleMetrica(metrica.id)"
                            [class.selected]="metricasHabilitadas().includes(metrica.id)"
                            class="metrica-chip">
                            <app-smart-icon [iconName]="metrica.icono" [size]="16"></app-smart-icon>
                            {{ metrica.nombre }}
                          </mat-chip>
                        }
                      </div>
                    </div>

                    <div class="opcion-grupo">
                      <h4>Umbrales de Alerta</h4>
                      <div class="umbrales-configuracion">
                        <div class="umbral-item">
                          <span>Tiempo de respuesta crítico:</span>
                          <span>{{ umbralTiempoRespuesta() }}ms</span>
                        </div>
                        <div class="umbral-item">
                          <span>Tasa de error máxima:</span>
                          <span>{{ umbralTasaError() }}%</span>
                        </div>
                        <div class="umbral-item">
                          <span>Uso de memoria crítico:</span>
                          <span>{{ umbralMemoria() }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .monitor-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .monitor-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 32px;
      color: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .header-title {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .title-text h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 700;
      color: white;
    }

    .header-subtitle {
      margin: 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
    }

    .header-status {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
    }

    .status-excelente {
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }

    .status-bueno {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
    }

    .status-regular {
      background: rgba(255, 152, 0, 0.2);
      color: #ff9800;
    }

    .status-critico {
      background: rgba(244, 67, 54, 0.2);
      color: #f44336;
    }

    .ultima-actualizacion {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .header-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      font-weight: 600;
      border-radius: 8px;
    }

    .metricas-principales {
      margin-bottom: 24px;
    }

    .metricas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .metrica-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .metrica-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .card-excelente {
      border-left: 4px solid #4caf50;
    }

    .card-bueno {
      border-left: 4px solid #2196f3;
    }

    .card-regular {
      border-left: 4px solid #ff9800;
    }

    .card-critico {
      border-left: 4px solid #f44336;
    }

    .metrica-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .metrica-icono {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
      color: #666;
    }

    .card-excelente .metrica-icono {
      background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
      color: #4caf50;
    }

    .card-bueno .metrica-icono {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      color: #2196f3;
    }

    .card-regular .metrica-icono {
      background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%);
      color: #ff9800;
    }

    .card-critico .metrica-icono {
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      color: #f44336;
    }

    .metrica-tendencia {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .tendencia-up {
      background: #e8f5e8;
      color: #4caf50;
    }

    .tendencia-down {
      background: #ffebee;
      color: #f44336;
    }

    .tendencia-stable {
      background: #f5f5f5;
      color: #666;
    }

    .metrica-valor {
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .metrica-nombre {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #2c3e50;
    }

    .metrica-descripcion {
      font-size: 14px;
      color: #6c757d;
      margin: 0;
    }

    .detalles-tabs {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .tab-content {
      padding: 24px;
    }

    .graficos-performance {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .grafico-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .operaciones-card,
    .alertas-card,
    .configuracion-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .tabla-container {
      overflow-x: auto;
    }

    .operaciones-table {
      width: 100%;
    }

    .alertas-badge {
      background: #f44336;
      color: white;
      margin-left: 8px;
    }

    .alertas-lista {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .alerta-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #ddd;
      background: #f9f9f9;
      transition: all 0.3s ease;
    }

    .alerta-item.resuelto {
      opacity: 0.6;
    }

    .alerta-alta {
      border-left-color: #f44336;
      background: #ffebee;
    }

    .alerta-media {
      border-left-color: #ff9800;
      background: #fff3e0;
    }

    .alerta-baja {
      border-left-color: #2196f3;
      background: #e3f2fd;
    }

    .alerta-icono {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      color: #666;
    }

    .alerta-contenido {
      flex: 1;
    }

    .alerta-titulo {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }

    .alerta-mensaje {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #6c757d;
    }

    .alerta-timestamp {
      font-size: 12px;
      color: #999;
    }

    .alerta-acciones {
      display: flex;
      gap: 4px;
    }

    .sin-alertas {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      text-align: center;
      color: #4caf50;
    }

    .sin-alertas h3 {
      margin: 16px 0 8px 0;
      color: #4caf50;
    }

    .sin-alertas p {
      margin: 0;
      color: #6c757d;
    }

    .configuracion-opciones {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .opcion-grupo h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }

    .intervalos-opciones,
    .metricas-opciones {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .intervalo-chip,
    .metrica-chip {
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .intervalo-chip.selected,
    .metrica-chip.selected {
      background-color: #1976d2;
      color: white;
    }

    .metrica-chip {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .umbrales-configuracion {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .umbral-item {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    /* Responsive design */
    @media (max-width: 1024px) {
      .monitor-container {
        padding: 16px;
      }
      
      .monitor-header {
        padding: 24px;
      }
      
      .metricas-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
      }
      
      .graficos-performance {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-status {
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;
        justify-content: center;
      }

      .metricas-grid {
        grid-template-columns: 1fr;
      }

      .intervalos-opciones,
      .metricas-opciones {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    @media (max-width: 480px) {
      .monitor-container {
        padding: 12px;
        gap: 16px;
      }
      
      .monitor-header {
        padding: 20px;
      }
      
      .title-text h1 {
        font-size: 24px;
      }
      
      .tab-content {
        padding: 16px;
      }
    }
  `]
})
export class MonitorPerformanceResolucionesComponent implements OnInit, OnDestroy {
  private resolucionService = inject(ResolucionService);
  private destroy$ = new Subject<void>();

  // Señales para el estado del componente
  monitoreando = signal(true);
  ultimaActualizacion = signal(new Date());
  estadoGeneral = signal<'excelente' | 'bueno' | 'regular' | 'critico'>('bueno');
  metricas = signal<MetricaPerformance[]>([]);
  alertas = signal<AlertaPerformance[]>([]);
  estadisticasOperaciones = signal<EstadisticaOperacion[]>([]);
  intervaloActual = signal(5000); // 5 segundos
  metricasHabilitadas = signal<string[]>(['tiempo-respuesta', 'operaciones-min', 'tasa-error', 'memoria']);

  // Configuración
  intervalosDisponibles = [
    { valor: 1000, label: '1s' },
    { valor: 5000, label: '5s' },
    { valor: 10000, label: '10s' },
    { valor: 30000, label: '30s' },
    { valor: 60000, label: '1min' }
  ];

  metricasDisponibles = [
    { id: 'tiempo-respuesta', nombre: 'Tiempo de Respuesta', icono: 'speed' },
    { id: 'operaciones-min', nombre: 'Operaciones/min', icono: 'functions' },
    { id: 'tasa-error', nombre: 'Tasa de Error', icono: 'error' },
    { id: 'memoria', nombre: 'Uso de Memoria', icono: 'memory' },
    { id: 'cpu', nombre: 'Uso de CPU', icono: 'developer_board' },
    { id: 'cache', nombre: 'Hit Rate Cache', icono: 'storage' }
  ];

  // Umbrales de alerta
  umbralTiempoRespuesta = signal(1000);
  umbralTasaError = signal(5);
  umbralMemoria = signal(80);

  // Columnas de la tabla
  columnasOperaciones = ['operacion', 'ejecuciones', 'tiempoPromedio', 'tasaExito', 'ultimaEjecucion'];

  // Computed properties
  alertasActivas = computed(() => this.alertas().filter(a => !a.resuelto));

  // Opciones para gráficos
  opcionesGraficoLinea = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  opcionesGraficoBar = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  opcionesGraficoPie = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  ngOnInit(): void {
    this.inicializarMonitor();
    this.iniciarMonitoreoAutomatico();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  private inicializarMonitor(): void {
    this.generarMetricasIniciales();
    this.generarEstadisticasOperaciones();
    this.actualizarDatos();
  }

  private iniciarMonitoreoAutomatico(): void {
    interval(this.intervaloActual()).pipe(
      switchMap(() => this.monitoreando() ? this.actualizarDatosAutomatico() : []),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  private generarMetricasIniciales(): void {
    const metricasIniciales: MetricaPerformance[] = [
      {
        id: 'tiempo-respuesta',
        nombre: 'Tiempo de Respuesta',
        valor: this.generarValorAleatorio(200, 800),
        unidad: 'ms',
        tendencia: 'stable',
        porcentajeCambio: this.generarValorAleatorio(-5, 5),
        estado: 'bueno',
        descripcion: 'Tiempo promedio de respuesta de las operaciones',
        icono: 'speed'
      },
      {
        id: 'operaciones-min',
        nombre: 'Operaciones/min',
        valor: this.generarValorAleatorio(50, 150),
        unidad: '',
        tendencia: 'up',
        porcentajeCambio: this.generarValorAleatorio(2, 8),
        estado: 'excelente',
        descripcion: 'Número de operaciones procesadas por minuto',
        icono: 'functions'
      },
      {
        id: 'tasa-error',
        nombre: 'Tasa de Error',
        valor: this.generarValorAleatorio(0, 3),
        unidad: '%',
        tendencia: 'down',
        porcentajeCambio: this.generarValorAleatorio(-2, 0),
        estado: 'excelente',
        descripcion: 'Porcentaje de operaciones que fallan',
        icono: 'error'
      },
      {
        id: 'memoria',
        nombre: 'Uso de Memoria',
        valor: this.generarValorAleatorio(45, 75),
        unidad: '%',
        tendencia: 'stable',
        porcentajeCambio: this.generarValorAleatorio(-2, 2),
        estado: 'bueno',
        descripcion: 'Porcentaje de memoria utilizada',
        icono: 'memory'
      },
      {
        id: 'cpu',
        nombre: 'Uso de CPU',
        valor: this.generarValorAleatorio(20, 60),
        unidad: '%',
        tendencia: 'stable',
        porcentajeCambio: this.generarValorAleatorio(-3, 3),
        estado: 'bueno',
        descripcion: 'Porcentaje de CPU utilizado',
        icono: 'developer_board'
      },
      {
        id: 'cache',
        nombre: 'Hit Rate Cache',
        valor: this.generarValorAleatorio(85, 98),
        unidad: '%',
        tendencia: 'up',
        porcentajeCambio: this.generarValorAleatorio(1, 4),
        estado: 'excelente',
        descripcion: 'Porcentaje de aciertos en caché',
        icono: 'storage'
      }
    ];

    this.metricas.set(metricasIniciales);
  }

  private generarEstadisticasOperaciones(): void {
    const operaciones = [
      'Listar Resoluciones',
      'Crear Resolución',
      'Actualizar Resolución',
      'Eliminar Resolución',
      'Filtrar Resoluciones',
      'Validar Número',
      'Exportar Datos',
      'Cargar Estadísticas'
    ];

    const estadisticas: EstadisticaOperacion[] = operaciones.map(op => ({
      operacion: op,
      totalEjecuciones: this.generarValorAleatorio(100, 1000),
      tiempoPromedio: this.generarValorAleatorio(150, 800),
      tiempoMinimo: this.generarValorAleatorio(50, 150),
      tiempoMaximo: this.generarValorAleatorio(800, 2000),
      errores: this.generarValorAleatorio(0, 10),
      tasaExito: this.generarValorAleatorio(95, 100),
      ultimaEjecucion: new Date(Date.now() - this.generarValorAleatorio(0, 300000))
    }));

    this.estadisticasOperaciones.set(estadisticas);
  }

  // ========================================
  // ACTUALIZACIÓN DE DATOS
  // ========================================

  actualizarDatos(): void {
    this.ultimaActualizacion.set(new Date());
    this.actualizarMetricas();
    this.verificarAlertas();
    this.actualizarEstadoGeneral();
  }

  private actualizarDatosAutomatico(): Promise<void> {
    return new Promise(resolve => {
      this.actualizarDatos();
      resolve();
    });
  }

  private actualizarMetricas(): void {
    const metricasActuales = this.metricas();
    const metricasActualizadas = metricasActuales.map(metrica => {
      const variacion = this.generarValorAleatorio(-10, 10);
      const nuevoValor = Math.max(0, metrica.valor + variacion);
      
      return {
        ...metrica,
        valor: nuevoValor,
        porcentajeCambio: Math.round(((nuevoValor - metrica.valor) / metrica.valor) * 100),
        tendencia: this.determinarTendencia(variacion),
        estado: this.determinarEstadoMetrica(metrica.id, nuevoValor)
      };
    });

    this.metricas.set(metricasActualizadas);
  }

  private verificarAlertas(): void {
    const alertasActuales = this.alertas();
    const nuevasAlertas: AlertaPerformance[] = [];

    // Verificar métricas críticas
    this.metricas().forEach(metrica => {
      if (this.esMetricaCritica(metrica)) {
        const alertaExistente = alertasActuales.find(a => a.id === `metrica-${metrica.id}`);
        
        if (!alertaExistente) {
          nuevasAlertas.push({
            id: `metrica-${metrica.id}`,
            tipo: 'performance',
            titulo: `${metrica.nombre} Crítico`,
            mensaje: `${metrica.nombre} ha alcanzado un valor crítico: ${metrica.valor}${metrica.unidad}`,
            timestamp: new Date(),
            severidad: 'alta',
            resuelto: false
          });
        }
      }
    });

    if (nuevasAlertas.length > 0) {
      this.alertas.set([...alertasActuales, ...nuevasAlertas]);
    }
  }

  private actualizarEstadoGeneral(): void {
    const metricas = this.metricas();
    const estadosCriticos = metricas.filter(m => m.estado === 'critico').length;
    const estadosRegulares = metricas.filter(m => m.estado === 'regular').length;

    if (estadosCriticos > 0) {
      this.estadoGeneral.set('critico');
    } else if (estadosRegulares > 1) {
      this.estadoGeneral.set('regular');
    } else if (estadosRegulares === 1) {
      this.estadoGeneral.set('bueno');
    } else {
      this.estadoGeneral.set('excelente');
    }
  }

  // ========================================
  // UTILIDADES
  // ========================================

  private generarValorAleatorio(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private determinarTendencia(variacion: number): 'up' | 'down' | 'stable' {
    if (variacion > 2) return 'up';
    if (variacion < -2) return 'down';
    return 'stable';
  }

  private determinarEstadoMetrica(id: string, valor: number): 'excelente' | 'bueno' | 'regular' | 'critico' {
    switch (id) {
      case 'tiempo-respuesta':
        if (valor < 300) return 'excelente';
        if (valor < 600) return 'bueno';
        if (valor < 1000) return 'regular';
        return 'critico';
      
      case 'tasa-error':
        if (valor < 1) return 'excelente';
        if (valor < 3) return 'bueno';
        if (valor < 5) return 'regular';
        return 'critico';
      
      case 'memoria':
        if (valor < 50) return 'excelente';
        if (valor < 70) return 'bueno';
        if (valor < 85) return 'regular';
        return 'critico';
      
      default:
        return 'bueno';
    }
  }

  private esMetricaCritica(metrica: MetricaPerformance): boolean {
    return metrica.estado === 'critico';
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  pausarMonitoreo(): void {
    this.monitoreando.set(!this.monitoreando());
  }

  cambiarIntervalo(nuevoIntervalo: number): void {
    this.intervaloActual.set(nuevoIntervalo);
    // Reiniciar monitoreo con nuevo intervalo
    this.iniciarMonitoreoAutomatico();
  }

  toggleMetrica(metricaId: string): void {
    const habilitadas = this.metricasHabilitadas();
    if (habilitadas.includes(metricaId)) {
      this.metricasHabilitadas.set(habilitadas.filter(id => id !== metricaId));
    } else {
      this.metricasHabilitadas.set([...habilitadas, metricaId]);
    }
  }

  resolverAlerta(alerta: AlertaPerformance): void {
    const alertas = this.alertas();
    const alertaIndex = alertas.findIndex(a => a.id === alerta.id);
    if (alertaIndex !== -1) {
      alertas[alertaIndex].resuelto = true;
      this.alertas.set([...alertas]);
    }
  }

  eliminarAlerta(alerta: AlertaPerformance): void {
    const alertas = this.alertas();
    this.alertas.set(alertas.filter(a => a.id !== alerta.id));
  }

  // ========================================
  // DATOS PARA GRÁFICOS
  // ========================================

  datosGraficoTiempoRespuesta(): any {
    const labels = Array.from({ length: 30 }, (_, i) => `${29 - i}min`);
    const datos = Array.from({ length: 30 }, () => this.generarValorAleatorio(200, 800));

    return {
      labels,
      datasets: [{
        label: 'Tiempo de Respuesta (ms)',
        data: datos,
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    };
  }

  datosGraficoOperaciones(): any {
    const operaciones = ['Listar', 'Crear', 'Actualizar', 'Eliminar', 'Filtrar'];
    const datos = operaciones.map(() => this.generarValorAleatorio(10, 50));

    return {
      labels: operaciones,
      datasets: [{
        label: 'Operaciones',
        data: datos,
        backgroundColor: '#4caf50',
      }]
    };
  }

  datosGraficoErrores(): any {
    return {
      labels: ['Éxito', 'Error 400', 'Error 500', 'Timeout'],
      datasets: [{
        data: [95, 2, 1, 2],
        backgroundColor: ['#4caf50', '#ff9800', '#f44336', '#9c27b0'],
      }]
    };
  }

  datosGraficoMemoria(): any {
    const labels = Array.from({ length: 20 }, (_, i) => `${19 - i}min`);
    const datos = Array.from({ length: 20 }, () => this.generarValorAleatorio(40, 80));

    return {
      labels,
      datasets: [{
        label: 'Uso de Memoria (%)',
        data: datos,
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    };
  }

  // ========================================
  // UTILIDADES DE VISTA
  // ========================================

  getTendenciaIcon(tendencia: string): string {
    switch (tendencia) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      case 'stable': return 'trending_flat';
      default: return 'trending_flat';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'excelente': return 'check_circle';
      case 'bueno': return 'thumb_up';
      case 'regular': return 'warning';
      case 'critico': return 'error';
      default: return 'help';
    }
  }

  getAlertaIcon(tipo: string): string {
    switch (tipo) {
      case 'performance': return 'speed';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'notifications';
    }
  }

  getTasaExitoClass(tasaExito: number): string {
    if (tasaExito >= 98) return 'tasa-excelente';
    if (tasaExito >= 95) return 'tasa-buena';
    if (tasaExito >= 90) return 'tasa-regular';
    return 'tasa-critica';
  }
}