import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ResolucionService } from '../../services/resolucion.service';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { ChartComponent } from '../../shared/chart.component';

interface EstadisticaCard {
  titulo: string;
  valor: number;
  icono: string;
  color: string;
  descripcion: string;
  tendencia?: {
    valor: number;
    tipo: 'up' | 'down' | 'stable';
  };
}

interface AlertaResolucion {
  id: string;
  tipo: 'vencimiento' | 'suspension' | 'error';
  titulo: string;
  descripcion: string;
  fecha: Date;
  prioridad: 'alta' | 'media' | 'baja';
  accion?: string;
}

@Component({
  selector: 'app-dashboard-resoluciones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    SmartIconComponent,
    ChartComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header del Dashboard -->
      <div class="dashboard-header">
        <div class="header-content">
          <div class="header-title">
            <app-smart-icon iconName="dashboard" [size]="32"></app-smart-icon>
            <div class="title-text">
              <h1>Dashboard de Resoluciones</h1>
              <p class="header-subtitle">Vista general del sistema de resoluciones</p>
            </div>
          </div>
          
          <div class="header-actions">
            <button mat-stroked-button (click)="actualizarDatos()" [disabled]="cargando()">
              <app-smart-icon iconName="refresh" [size]="20"></app-smart-icon>
              Actualizar
            </button>
            
            <button mat-raised-button color="primary" (click)="irAResoluciones()">
              <app-smart-icon iconName="list" [size]="20"></app-smart-icon>
              Ver Todas
            </button>
          </div>
        </div>
        
        <!-- Última actualización -->
        <div class="ultima-actualizacion">
          <app-smart-icon iconName="schedule" [size]="16"></app-smart-icon>
          <span>Última actualización: {{ ultimaActualizacion() | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando estadísticas...</p>
        </div>
      } @else {
        <!-- Tarjetas de Estadísticas -->
        <div class="estadisticas-grid">
          @for (estadistica of estadisticas(); track estadistica.titulo) {
            <mat-card class="estadistica-card" [class]="'card-' + estadistica.color">
              <mat-card-content>
                <div class="estadistica-header">
                  <div class="estadistica-icono">
                    <app-smart-icon [iconName]="estadistica.icono" [size]="24"></app-smart-icon>
                  </div>
                  @if (estadistica.tendencia) {
                    <div class="tendencia" [class]="'tendencia-' + estadistica.tendencia.tipo">
                      <app-smart-icon 
                        [iconName]="getTendenciaIcon(estadistica.tendencia.tipo)" 
                        [size]="16">
                      </app-smart-icon>
                      <span>{{ estadistica.tendencia.valor }}%</span>
                    </div>
                  }
                </div>
                
                <div class="estadistica-contenido">
                  <h3 class="estadistica-valor">{{ estadistica.valor | number }}</h3>
                  <h4 class="estadistica-titulo">{{ estadistica.titulo }}</h4>
                  <p class="estadistica-descripcion">{{ estadistica.descripcion }}</p>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Gráficos y Análisis -->
        <div class="graficos-section">
          <div class="graficos-grid">
            <!-- Gráfico de Estados -->
            <mat-card class="grafico-card">
              <mat-card-header>
                <mat-card-title>
                  <app-smart-icon iconName="pie_chart" [size]="20"></app-smart-icon>
                  Distribución por Estados
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <app-chart
                  type="doughnut"
                  [data]="datosGraficoEstados()"
                  [options]="opcionesGraficoPie"
                  [height]="300">
                </app-chart>
              </mat-card-content>
            </mat-card>

            <!-- Gráfico de Tipos de Trámite -->
            <mat-card class="grafico-card">
              <mat-card-header>
                <mat-card-title>
                  <app-smart-icon iconName="bar_chart" [size]="20"></app-smart-icon>
                  Tipos de Trámite
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <app-chart
                  type="bar"
                  [data]="datosGraficoTipos()"
                  [options]="opcionesGraficoBar"
                  [height]="300">
                </app-chart>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Gráfico de Tendencia Temporal -->
          <mat-card class="grafico-card grafico-full">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon iconName="timeline" [size]="20"></app-smart-icon>
                Tendencia de Resoluciones (Últimos 12 meses)
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <app-chart
                type="line"
                [data]="datosGraficoTendencia()"
                [options]="opcionesGraficoLinea"
                [height]="400">
              </app-chart>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Alertas y Notificaciones -->
        @if (alertas().length > 0) {
          <mat-card class="alertas-card">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon iconName="notifications" [size]="20"></app-smart-icon>
                Alertas y Notificaciones
                <mat-chip class="alertas-badge">{{ alertas().length }}</mat-chip>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="alertas-lista">
                @for (alerta of alertas(); track alerta.id) {
                  <div class="alerta-item" [class]="'alerta-' + alerta.prioridad">
                    <div class="alerta-icono">
                      <app-smart-icon [iconName]="getAlertaIcon(alerta.tipo)" [size]="20"></app-smart-icon>
                    </div>
                    <div class="alerta-contenido">
                      <h4 class="alerta-titulo">{{ alerta.titulo }}</h4>
                      <p class="alerta-descripcion">{{ alerta.descripcion }}</p>
                      <span class="alerta-fecha">{{ alerta.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    @if (alerta.accion) {
                      <div class="alerta-accion">
                        <button mat-button color="primary" (click)="ejecutarAccionAlerta(alerta)">
                          {{ alerta.accion }}
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Acciones Rápidas -->
        <mat-card class="acciones-card">
          <mat-card-header>
            <mat-card-title>
              <app-smart-icon iconName="flash_on" [size]="20"></app-smart-icon>
              Acciones Rápidas
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="acciones-grid">
              <button mat-raised-button color="primary" (click)="nuevaResolucion()" class="accion-btn">
                <app-smart-icon iconName="add_circle" [size]="24"></app-smart-icon>
                <div class="accion-texto">
                  <span class="accion-titulo">Nueva Resolución</span>
                  <span class="accion-descripcion">Crear una nueva resolución</span>
                </div>
              </button>

              <button mat-raised-button color="accent" (click)="cargaMasiva()" class="accion-btn">
                <app-smart-icon iconName="upload_file" [size]="24"></app-smart-icon>
                <div class="accion-texto">
                  <span class="accion-titulo">Carga Masiva</span>
                  <span class="accion-descripcion">Importar desde Excel</span>
                </div>
              </button>

              <button mat-stroked-button (click)="exportarReporte()" class="accion-btn">
                <app-smart-icon iconName="file_download" [size]="24"></app-smart-icon>
                <div class="accion-texto">
                  <span class="accion-titulo">Exportar Reporte</span>
                  <span class="accion-descripcion">Descargar estadísticas</span>
                </div>
              </button>

              <button mat-stroked-button (click)="configurarAlertas()" class="accion-btn">
                <app-smart-icon iconName="settings" [size]="24"></app-smart-icon>
                <div class="accion-texto">
                  <span class="accion-titulo">Configurar Alertas</span>
                  <span class="accion-descripcion">Gestionar notificaciones</span>
                </div>
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .dashboard-header {
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
      transition: all 0.3s ease;
    }

    .ultima-actualizacion {
      display: flex;
      align-items: center;
      gap: 8px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
    }

    .estadisticas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .estadistica-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .estadistica-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .card-primary {
      border-left: 4px solid #1976d2;
    }

    .card-success {
      border-left: 4px solid #388e3c;
    }

    .card-warning {
      border-left: 4px solid #f57c00;
    }

    .card-danger {
      border-left: 4px solid #d32f2f;
    }

    .estadistica-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .estadistica-icono {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
      color: #666;
    }

    .card-primary .estadistica-icono {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      color: #1976d2;
    }

    .card-success .estadistica-icono {
      background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
      color: #388e3c;
    }

    .card-warning .estadistica-icono {
      background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%);
      color: #f57c00;
    }

    .card-danger .estadistica-icono {
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      color: #d32f2f;
    }

    .tendencia {
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
      color: #388e3c;
    }

    .tendencia-down {
      background: #ffebee;
      color: #d32f2f;
    }

    .tendencia-stable {
      background: #f5f5f5;
      color: #666;
    }

    .estadistica-valor {
      font-size: 36px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .estadistica-titulo {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #2c3e50;
    }

    .estadistica-descripcion {
      font-size: 14px;
      color: #6c757d;
      margin: 0;
    }

    .graficos-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .graficos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .grafico-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .grafico-full {
      grid-column: 1 / -1;
    }

    .alertas-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .alertas-badge {
      background: #ff5722;
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
    }

    .alerta-alta {
      border-left-color: #d32f2f;
      background: #ffebee;
    }

    .alerta-media {
      border-left-color: #f57c00;
      background: #fff3e0;
    }

    .alerta-baja {
      border-left-color: #1976d2;
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

    .alerta-descripcion {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #6c757d;
    }

    .alerta-fecha {
      font-size: 12px;
      color: #999;
    }

    .alerta-accion {
      flex-shrink: 0;
    }

    .acciones-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .acciones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .accion-btn {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      text-align: left;
      height: auto;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .accion-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    .accion-texto {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .accion-titulo {
      font-size: 16px;
      font-weight: 600;
      color: inherit;
    }

    .accion-descripcion {
      font-size: 14px;
      opacity: 0.7;
    }

    /* Responsive design */
    @media (max-width: 1024px) {
      .dashboard-container {
        padding: 16px;
      }
      
      .dashboard-header {
        padding: 24px;
      }
      
      .estadisticas-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
      }
      
      .graficos-grid {
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

      .header-actions {
        width: 100%;
        justify-content: center;
      }

      .estadisticas-grid {
        grid-template-columns: 1fr;
      }

      .acciones-grid {
        grid-template-columns: 1fr;
      }

      .accion-btn {
        justify-content: center;
        text-align: center;
      }
    }

    @media (max-width: 480px) {
      .dashboard-container {
        padding: 12px;
        gap: 16px;
      }
      
      .dashboard-header {
        padding: 20px;
      }
      
      .title-text h1 {
        font-size: 24px;
      }
      
      .estadistica-valor {
        font-size: 28px;
      }
    }
  `]
})
export class DashboardResolucionesComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private resolucionService = inject(ResolucionService);
  private destroy$ = new Subject<void>();

  // Señales para el estado del componente
  cargando = signal(false);
  ultimaActualizacion = signal(new Date());
  estadisticas = signal<EstadisticaCard[]>([]);
  alertas = signal<AlertaResolucion[]>([]);

  // Datos para gráficos
  datosEstadisticas = signal<any>(null);

  // Opciones para gráficos
  opcionesGraficoPie = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
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

  // Computed para datos de gráficos
  datosGraficoEstados = computed(() => {
    const datos = this.datosEstadisticas();
    if (!datos) return null;

    return {
      labels: Object.keys(datos.porEstado || {}),
      datasets: [{
        data: Object.values(datos.porEstado || {}),
        backgroundColor: [
          '#4caf50',
          '#ff9800',
          '#f44336',
          '#9c27b0',
          '#2196f3'
        ],
      }]
    };
  });

  datosGraficoTipos = computed(() => {
    const datos = this.datosEstadisticas();
    if (!datos) return null;

    return {
      labels: Object.keys(datos.porTipo || {}),
      datasets: [{
        label: 'Cantidad',
        data: Object.values(datos.porTipo || {}),
        backgroundColor: '#2196f3',
      }]
    };
  });

  datosGraficoTendencia = computed(() => {
    // Datos simulados para la tendencia
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const datos = [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45];

    return {
      labels: meses,
      datasets: [{
        label: 'Resoluciones Creadas',
        data: datos,
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    };
  });

  ngOnInit(): void {
    this.cargarDatosDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // CARGA DE DATOS
  // ========================================

  private cargarDatosDashboard(): void {
    this.cargando.set(true);

    forkJoin({
      estadisticas: this.resolucionService.getEstadisticasFiltros({}),
      relaciones: this.resolucionService.getEstadisticasRelaciones()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ estadisticas, relaciones }) => {
        this.procesarEstadisticas(estadisticas, relaciones);
        this.generarAlertas(estadisticas);
        this.ultimaActualizacion.set(new Date());
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando dashboard:', error);
        this.cargando.set(false);
      }
    });
  }

  private procesarEstadisticas(estadisticas: any, relaciones: any): void {
    this.datosEstadisticas.set(estadisticas);

    const cards: EstadisticaCard[] = [
      {
        titulo: 'Total Resoluciones',
        valor: estadisticas.total || 0,
        icono: 'description',
        color: 'primary',
        descripcion: 'Resoluciones en el sistema',
        tendencia: {
          valor: 12,
          tipo: 'up'
        }
      },
      {
        titulo: 'Resoluciones Vigentes',
        valor: estadisticas.porEstado?.VIGENTE || 0,
        icono: 'check_circle',
        color: 'success',
        descripcion: 'Actualmente vigentes',
        tendencia: {
          valor: 5,
          tipo: 'up'
        }
      },
      {
        titulo: 'Próximas a Vencer',
        valor: this.calcularProximasVencer(estadisticas),
        icono: 'warning',
        color: 'warning',
        descripcion: 'Vencen en 30 días',
        tendencia: {
          valor: 8,
          tipo: 'down'
        }
      },
      {
        titulo: 'Total Rutas',
        valor: relaciones?.totalRutas || 0,
        icono: 'route',
        color: 'primary',
        descripcion: 'Rutas autorizadas',
        tendencia: {
          valor: 15,
          tipo: 'up'
        }
      },
      {
        titulo: 'Total Vehículos',
        valor: relaciones?.totalVehiculos || 0,
        icono: 'directions_car',
        color: 'primary',
        descripcion: 'Vehículos habilitados',
        tendencia: {
          valor: 3,
          tipo: 'stable'
        }
      },
      {
        titulo: 'Resoluciones Suspendidas',
        valor: estadisticas.porEstado?.SUSPENDIDA || 0,
        icono: 'pause_circle',
        color: 'danger',
        descripcion: 'Requieren atención',
        tendencia: {
          valor: 2,
          tipo: 'down'
        }
      }
    ];

    this.estadisticas.set(cards);
  }

  private calcularProximasVencer(estadisticas: any): number {
    // Lógica simulada para calcular resoluciones próximas a vencer
    return Math.floor((estadisticas.porEstado?.VIGENTE || 0) * 0.15);
  }

  private generarAlertas(estadisticas: any): void {
    const alertas: AlertaResolucion[] = [];

    // Alerta por resoluciones próximas a vencer
    const proximasVencer = this.calcularProximasVencer(estadisticas);
    if (proximasVencer > 0) {
      alertas.push({
        id: 'proximas-vencer',
        tipo: 'vencimiento',
        titulo: 'Resoluciones próximas a vencer',
        descripcion: `${proximasVencer} resoluciones vencerán en los próximos 30 días`,
        fecha: new Date(),
        prioridad: 'alta',
        accion: 'Revisar'
      });
    }

    // Alerta por resoluciones suspendidas
    const suspendidas = estadisticas.porEstado?.SUSPENDIDA || 0;
    if (suspendidas > 0) {
      alertas.push({
        id: 'suspendidas',
        tipo: 'suspension',
        titulo: 'Resoluciones suspendidas',
        descripcion: `${suspendidas} resoluciones están suspendidas y requieren atención`,
        fecha: new Date(),
        prioridad: 'media',
        accion: 'Gestionar'
      });
    }

    // Alerta de ejemplo para errores de sistema
    if (Math.random() > 0.7) {
      alertas.push({
        id: 'error-sistema',
        tipo: 'error',
        titulo: 'Error en sincronización',
        descripcion: 'Se detectaron inconsistencias en los datos de algunas resoluciones',
        fecha: new Date(),
        prioridad: 'baja',
        accion: 'Verificar'
      });
    }

    this.alertas.set(alertas);
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  actualizarDatos(): void {
    this.cargarDatosDashboard();
  }

  irAResoluciones(): void {
    this.router.navigate(['/resoluciones']);
  }

  nuevaResolucion(): void {
    this.router.navigate(['/resoluciones/nuevo']);
  }

  cargaMasiva(): void {
    this.router.navigate(['/resoluciones/carga-masiva']);
  }

  exportarReporte(): void {
    this.resolucionService.exportarResoluciones({}, 'excel').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_resoluciones_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exportando reporte:', error);
      }
    });
  }

  configurarAlertas(): void {
    // TODO: Implementar configuración de alertas
    console.log('Configurar alertas');
  }

  ejecutarAccionAlerta(alerta: AlertaResolucion): void {
    switch (alerta.tipo) {
      case 'vencimiento':
        this.router.navigate(['/resoluciones'], {
          queryParams: { 
            estados: ['VIGENTE'],
            proximasVencer: true
          }
        });
        break;
      case 'suspension':
        this.router.navigate(['/resoluciones'], {
          queryParams: { estados: ['SUSPENDIDA'] }
        });
        break;
      case 'error':
        // TODO: Implementar verificación de errores
        console.log('Verificar errores de sistema');
        break;
    }
  }

  // ========================================
  // UTILIDADES
  // ========================================

  getTendenciaIcon(tipo: 'up' | 'down' | 'stable'): string {
    switch (tipo) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      case 'stable': return 'trending_flat';
    }
  }

  getAlertaIcon(tipo: 'vencimiento' | 'suspension' | 'error'): string {
    switch (tipo) {
      case 'vencimiento': return 'schedule';
      case 'suspension': return 'pause_circle';
      case 'error': return 'error';
    }
  }
}