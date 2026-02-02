import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, interval } from 'rxjs';

import { EmpresaService } from '../../services/empresa.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { ConductorService } from '../../services/conductor.service';
import { RutaService } from '../../services/ruta.service';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { ResolucionService } from '../../services/resolucion.service';
import { ExpedienteService } from '../../services/expediente.service';
import { OficinaService } from '../../services/oficina.service';
import { NotificationService } from '../../services/notification.service';
import { Empresa } from '../../models/empresa.model';
import { Vehiculo } from '../../models/vehiculo.model';
import { Conductor } from '../../models/conductor.model';
import { Ruta } from '../../models/ruta.model';
import { Resolucion } from '../../models/resolucion.model';
import { Expediente } from '../../models/expediente.model';
import { Oficina } from '../../models/oficina.model';

interface DashboardMetric {
  titulo: string;
  valor: number;
  cambio: number;
  cambioPorcentual: number;
  icono: string;
  color: string;
  url: string;
}

interface ExpedienteEstado {
  estado: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

interface ActividadReciente {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: Date;
  usuario: string;
  estado: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule,
    MatListModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    SmartIconComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header del Dashboard -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1>Dashboard SIRRET</h1>
          <p>Panel de control y monitoreo del sistema de transporte</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="actualizarDashboard()" [disabled]="actualizando()">
            <app-smart-icon [iconName]="'refresh'" [size]="20" [tooltipText]="'Actualizar datos del dashboard'"></app-smart-icon>
            {{ actualizando() ? 'Actualizando...' : 'Actualizar' }}
          </button>
          <button mat-raised-button color="accent" (click)="generarReporte()">
            <app-smart-icon [iconName]="'assessment'" [size]="20" [tooltipText]="'Generar reporte del dashboard'"></app-smart-icon>
            Generar Reporte
          </button>
        </div>
      </div>

      <!-- Métricas Principales -->
      <div class="metricas-principales">
        @for (metrica of metricasPrincipales(); track metrica.titulo) {
          <mat-card class="metrica-card" (click)="navegarA(metrica.url)">
            <mat-card-content>
              <div class="metrica-header">
                <div class="metrica-icono" [style.background]="metrica.color">
                  <app-smart-icon [iconName]="metrica.icono" [size]="32"></app-smart-icon>
                </div>
                <div class="metrica-info">
                  <h3 class="metrica-titulo">{{ metrica.titulo | uppercase }}</h3>
                  <div class="metrica-valor">{{ metrica.valor.toLocaleString() }}</div>
                  <div class="metrica-cambio" [class.positivo]="metrica.cambio >= 0" [class.negativo]="metrica.cambio < 0">
                    <app-smart-icon [iconName]="metrica.cambio >= 0 ? 'trending_up' : 'trending_down'" [size]="16"></app-smart-icon>
                    {{ metrica.cambio >= 0 ? '+' : '' }}{{ metrica.cambioPorcentual }}%
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <!-- Gráficos y Estadísticas -->
      <div class="dashboard-grid">
        <!-- Estado de Expedientes -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Estado de Expedientes</mat-card-title>
            <mat-card-subtitle>Distribución por estado</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (loadingExpedientes()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else {
              <div class="expedientes-estados">
                @for (estado of estadosExpedientes(); track estado.estado) {
                  <div class="estado-item">
                    <div class="estado-header">
                      <span class="estado-nombre">{{ estado.estado | uppercase }}</span>
                      <span class="estado-cantidad">{{ estado.cantidad }}</span>
                    </div>
                    <mat-progress-bar 
                      [value]="estado.porcentaje" 
                      [color]="estado.color === 'primary' ? 'primary' : estado.color === 'accent' ? 'accent' : 'warn'">
                    </mat-progress-bar>
                    <span class="estado-porcentaje">{{ estado.porcentaje }}%</span>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Actividad Reciente -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Actividad Reciente</mat-card-title>
            <mat-card-subtitle>Últimas acciones del sistema</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (loadingActividad()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (actividadReciente().length === 0) {
              <div class="no-data">
                <app-smart-icon [iconName]="'history'" [size]="48" [tooltipText]="'Sin actividad reciente'"></app-smart-icon>
                <p>No hay actividad reciente disponible</p>
              </div>
            } @else {
              <div class="actividad-lista">
                @for (actividad of actividadReciente(); track actividad.id) {
                  <div class="actividad-item">
                    <div class="actividad-icono">
                      <app-smart-icon [iconName]="getActividadIcon(actividad.tipo)" [size]="20"></app-smart-icon>
                    </div>
                    <div class="actividad-contenido">
                      <div class="actividad-descripcion">{{ actividad.descripcion | uppercase }}</div>
                      <div class="actividad-metadata">
                        <span class="actividad-usuario">{{ actividad.usuario | uppercase }}</span>
                        <span class="actividad-fecha">{{ actividad.fecha | date:'dd/MM HH:mm' }}</span>
                      </div>
                    </div>
                    <div class="actividad-estado">
                      <mat-chip [color]="getEstadoColor(actividad.estado)" selected>
                        {{ actividad.estado | uppercase }}
                      </mat-chip>
                    </div>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Notificaciones Importantes -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Notificaciones Importantes</mat-card-title>
            <mat-card-subtitle>Alertas y recordatorios críticos</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (loadingNotificaciones()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else {
              <div class="notificaciones-lista">
                @for (notif of notificacionesImportantes(); track notif.id) {
                  <div class="notificacion-item" [class.critica]="notif.prioridad === 'CRITICA'">
                    <div class="notificacion-icono">
                      <app-smart-icon [iconName]="getNotificacionIcon(notif.tipo)" [size]="20"></app-smart-icon>
                    </div>
                    <div class="notificacion-contenido">
                      <div class="notificacion-titulo">{{ notif.titulo | uppercase }}</div>
                      <div class="notificacion-mensaje">{{ notif.mensaje | uppercase }}</div>
                      <div class="notificacion-fecha">{{ notif.fechaCreacion | date:'dd/MM HH:mm' }}</div>
                    </div>
                    <div class="notificacion-prioridad">
                      <mat-chip [color]="getPrioridadColor(notif.prioridad)" selected>
                        {{ notif.prioridad }}
                      </mat-chip>
                    </div>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Resumen de Oficinas -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Resumen de Oficinas</mat-card-title>
            <mat-card-subtitle>Estado operativo por oficina</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (loadingOficinas()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else {
              <div class="oficinas-resumen">
                @for (oficina of resumenOficinas(); track oficina.id) {
                  <div class="oficina-item">
                    <div class="oficina-info">
                      <div class="oficina-nombre">{{ oficina.nombre | uppercase }}</div>
                      <div class="oficina-ubicacion">{{ oficina.ubicacion | uppercase }}</div>
                    </div>
                    <div class="oficina-estado">
                      <mat-chip [color]="oficina.estaActiva ? 'primary' : 'warn'" selected>
                        {{ oficina.estaActiva ? 'ACTIVA' : 'INACTIVA' }}
                      </mat-chip>
                    </div>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tabla de Expedientes Pendientes -->
      <mat-card class="dashboard-card full-width">
        <mat-card-header>
          <mat-card-title>Expedientes Pendientes</mat-card-title>
          <mat-card-subtitle>Expedientes que requieren atención</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loadingExpedientesPendientes()) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else if (expedientesPendientes().length === 0) {
            <div class="no-data">
              <app-smart-icon [iconName]="'check_circle'" [size]="48" [tooltipText]="'Todos los expedientes están al día'"></app-smart-icon>
              <p>No hay expedientes pendientes</p>
            </div>
          } @else {
            <table mat-table [dataSource]="expedientesPendientes()" class="expedientes-table">
              <ng-container matColumnDef="numero">
                <th mat-header-cell *matHeaderCellDef>Número</th>
                <td mat-cell *matCellDef="let expediente">{{ expediente.nroExpediente | uppercase }}</td>
              </ng-container>

              <ng-container matColumnDef="tipo">
                <th mat-header-cell *matHeaderCellDef>Tipo</th>
                <td mat-cell *matCellDef="let expediente">{{ expediente.tipoTramite | uppercase }}</td>
              </ng-container>

              <ng-container matColumnDef="empresa">
                <th mat-header-cell *matHeaderCellDef>Empresa</th>
                <td mat-cell *matCellDef="let expediente">
                  {{ getEmpresaNombre(expediente.empresaId) | uppercase }}
                </td>
              </ng-container>

              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let expediente">
                  <mat-chip [color]="getExpedienteEstadoColor(expediente.estado)" selected>
                    {{ expediente.estado | uppercase }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="fechaCreacion">
                <th mat-header-cell *matHeaderCellDef>Fecha Creación</th>
                <td mat-cell *matCellDef="let expediente">{{ expediente.fechaEmision | date:'dd/MM/yyyy' }}</td>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let expediente">
                  <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Más opciones">
                    <app-smart-icon [iconName]="'more_vert'" [size]="20" [tooltipText]="'Opciones del expediente'"></app-smart-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="verExpediente(expediente.id)">
                      <app-smart-icon [iconName]="'visibility'" [size]="20" [tooltipText]="'Ver detalle del expediente'"></app-smart-icon>
                      Ver detalle
                    </button>
                    <button mat-menu-item (click)="editarExpediente(expediente.id)">
                      <app-smart-icon [iconName]="'edit'" [size]="20" [tooltipText]="'Editar expediente'"></app-smart-icon>
                      Editar
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columnasExpedientes"></tr>
              <tr mat-row *matRowDef="let row; columns: columnasExpedientes;"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      color: white;
    }

    .header-content h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 600;
    }

    .header-content p {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .metricas-principales {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .metrica-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 16px;
      overflow: hidden;
    }

    .metrica-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .metrica-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
    }

    .metrica-icono {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .metrica-icono app-smart-icon {
      font-size: 32px;
    }

    .metrica-info {
      flex: 1;
    }

    .metrica-titulo {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #6c757d;
      font-weight: 500;
    }

    .metrica-valor {
      font-size: 28px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .metrica-cambio {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 500;
    }

    .metrica-cambio.positivo {
      color: #28a745;
    }

    .metrica-cambio.negativo {
      color: #dc3545;
    }

    .metrica-cambio app-smart-icon {
      font-size: 16px;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .dashboard-card {
      border-radius: 16px;
      overflow: hidden;
    }

    .dashboard-card.full-width {
      grid-column: 1 / -1;
    }

    .dashboard-card mat-card-header {
      background: #f8f9fa;
      padding: 20px;
    }

    .dashboard-card mat-card-title {
      margin: 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
    }

    .dashboard-card mat-card-subtitle {
      margin: 8px 0 0 0;
      color: #6c757d;
    }

    .dashboard-card mat-card-content {
      padding: 24px;
    }

    .expedientes-estados {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .estado-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .estado-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .estado-nombre {
      font-weight: 500;
      color: #2c3e50;
    }

    .estado-cantidad {
      font-weight: 600;
      color: #6c757d;
    }

    .estado-porcentaje {
      font-size: 12px;
      color: #6c757d;
      text-align: right;
    }

    .actividad-lista {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .actividad-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      border-radius: 8px;
      background: #f8f9fa;
    }

    .actividad-icono {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e9ecef;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .actividad-icono app-smart-icon {
      font-size: 20px;
      color: #6c757d;
    }

    .actividad-contenido {
      flex: 1;
    }

    .actividad-descripcion {
      font-weight: 500;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .actividad-metadata {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #6c757d;
    }

    .notificaciones-lista {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .notificacion-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      background: #f8f9fa;
      border-left: 4px solid transparent;
    }

    .notificacion-item.critica {
      background: #fff5f5;
      border-left-color: #dc3545;
    }

    .notificacion-icono {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e9ecef;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notificacion-icono app-smart-icon {
      font-size: 20px;
      color: #6c757d;
    }

    .notificacion-contenido {
      flex: 1;
    }

    .notificacion-titulo {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .notificacion-mensaje {
      font-size: 14px;
      color: #6c757d;
      margin-bottom: 4px;
    }

    .notificacion-fecha {
      font-size: 12px;
      color: #6c757d;
    }

    .oficinas-resumen {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .oficina-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      background: #f8f9fa;
    }

    .oficina-info {
      flex: 1;
    }

    .oficina-nombre {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .oficina-ubicacion {
      font-size: 14px;
      color: #6c757d;
    }

    .expedientes-table {
      width: 100%;
    }

    .expedientes-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #2c3e50;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      color: #6c757d;
    }

    .no-data app-smart-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .dashboard-header {
        flex-direction: column;
        text-align: center;
        gap: 16px;
      }

      .metricas-principales {
        grid-template-columns: 1fr;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  private empresaService = inject(EmpresaService);
  private vehiculoService = inject(VehiculoService);
  private conductorService = inject(ConductorService);
  private rutaService = inject(RutaService);
  private resolucionService = inject(ResolucionService);
  private expedienteService = inject(ExpedienteService);
  private oficinaService = inject(OficinaService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Signals
  actualizando = signal(false);
  loadingExpedientes = signal(false);
  loadingActividad = signal(false);
  loadingNotificaciones = signal(false);
  loadingOficinas = signal(false);
  loadingExpedientesPendientes = signal(false);

  // Data signals
  empresas = signal<Empresa[]>([]);
  vehiculos = signal<Vehiculo[]>([]);
  conductores = signal<Conductor[]>([]);
  rutas = signal<Ruta[]>([]);
  resoluciones = signal<Resolucion[]>([]);
  expedientes = signal<Expediente[]>([]);
  oficinas = signal<Oficina[]>([]);
  notificaciones = signal<any[]>([]);

  // Computed properties
  metricasPrincipales = computed(() => [
    {
      titulo: 'Empresas Activas',
      valor: this.empresas().length,
      cambio: this.calcularCambio(this.empresas()),
      cambioPorcentual: this.calcularCambioPorcentual(this.empresas()),
      icono: 'business',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      url: '/empresas'
    },
    {
      titulo: 'Vehículos Registrados',
      valor: this.vehiculos().length,
      cambio: this.calcularCambio(this.vehiculos()),
      cambioPorcentual: this.calcularCambioPorcentual(this.vehiculos()),
      icono: 'directions_car',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      url: '/vehiculos'
    },
    {
      titulo: 'Conductores',
      valor: this.conductores().length,
      cambio: this.calcularCambio(this.conductores()),
      cambioPorcentual: this.calcularCambioPorcentual(this.conductores()),
      icono: 'person',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      url: '/conductores'
    },
    {
      titulo: 'Rutas Activas',
      valor: this.rutas().length,
      cambio: this.calcularCambio(this.rutas()),
      cambioPorcentual: this.calcularCambioPorcentual(this.rutas()),
      icono: 'route',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      url: '/rutas'
    },
    {
      titulo: 'Resoluciones',
      valor: this.resoluciones().length,
      cambio: this.calcularCambio(this.resoluciones()),
      cambioPorcentual: this.calcularCambioPorcentual(this.resoluciones()),
      icono: 'description',
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      url: '/resoluciones'
    },
    {
      titulo: 'Expedientes',
      valor: this.expedientes().length,
      cambio: this.calcularCambio(this.expedientes()),
      cambioPorcentual: this.calcularCambioPorcentual(this.expedientes()),
      icono: 'folder',
      color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      url: '/expedientes'
    }
  ]);

  estadosExpedientes = computed(() => {
    const expedientes = this.expedientes();
    if (expedientes.length === 0) return [];

    const estados = expedientes.reduce((acc, exp) => {
      acc[exp.estado] = (acc[exp.estado] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const total = expedientes.length;
    return Object.entries(estados).map(([estado, cantidad]) => ({
      estado,
      cantidad,
      porcentaje: Math.round((cantidad / total) * 100),
      color: this.getEstadoColor(estado)
    }));
  });

  actividadReciente = computed((): ActividadReciente[] => {
    // Retornar array vacío hasta implementar servicio de auditoria real
    return [];
  });

  notificacionesImportantes = computed(() => {
    return this.notificaciones().filter(n => n.prioridad === 'ALTA' || n.prioridad === 'CRITICA').slice(0, 5);
  });

  resumenOficinas = computed(() => {
    return this.oficinas().slice(0, 5);
  });

  expedientesPendientes = computed(() => {
    return this.expedientes().filter(e => e.estado === 'EN_PROCESO').slice(0, 10);
  });

  // Columnas para la tabla
  columnasExpedientes = ['numero', 'tipo', 'empresa', 'estado', 'fechaCreacion', 'acciones'];

  ngOnInit(): void {
    this.cargarDatos();
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarDatos(): void {
    this.cargarEmpresas();
    this.cargarVehiculos();
    this.cargarConductores();
    this.cargarRutas();
    this.cargarResoluciones();
    this.cargarExpedientes();
    this.cargarOficinas();
    this.cargarNotificaciones();
  }

  private cargarEmpresas(): void {
    // console.log removed for production
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        // console.log removed for production
        // console.log removed for production
        this.empresas.set(empresas);
      },
      error: (error) => {
        console.error('❌ Error cargando empresas::', error);
        console.error('❌ Status del error::', error.status);
        console.error('❌ URL del API::', `${this.empresaService['apiUrl']}/empresas`);
        this.snackBar.open('Error cargando empresas: ' + (error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
      }
    });
  }

  private cargarVehiculos(): void {
    // console.log removed for production
    this.vehiculoService.getVehiculos().subscribe({
      next: (vehiculos) => {
        // console.log removed for production
        // console.log removed for production
        this.vehiculos.set(vehiculos);
      },
      error: (error) => {
        console.error('❌ Error cargando vehículos::', error);
        console.error('❌ Status del error::', error.status);
        this.snackBar.open('Error cargando vehículos: ' + (error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
      }
    });
  }

  private cargarConductores(): void {
    // console.log removed for production
    // NOTA: El módulo de conductores será un sistema separado en el futuro
    // Por ahora, establecemos un array vacío para evitar errores
    console.log('ℹ️ Módulo de conductores: Sistema separado (futuro)');
    this.conductores.set([]);
    
    // TODO: Implementar integración con sistema externo de conductores
    // this.conductorService.getConductores().subscribe({
    //   next: (conductores) => {
    //     // console.log removed for production
    //     this.conductores.set(conductores);
    //   },
    //   error: (error) => {
    //     console.error('❌ Error cargando conductores::', error);
    //     this.snackBar.open('Error cargando conductores', 'Cerrar', { duration: 3000 });
    //   }
    // });
  }

  private cargarRutas(): void {
    // console.log removed for production
    this.rutaService.getRutas().subscribe({
      next: (rutas) => {
        // console.log removed for production
        this.rutas.set(rutas);
      },
      error: (error) => {
        console.error('❌ Error cargando rutas::', error);
        this.snackBar.open('Error cargando rutas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private cargarResoluciones(): void {
    // console.log removed for production
    this.resolucionService.getResoluciones().subscribe({
      next: (resoluciones) => {
        // console.log removed for production
        // console.log removed for production
        // console.log removed for production
        this.resoluciones.set(resoluciones);
      },
      error: (error) => {
        console.error('❌ Error cargando resoluciones::', error);
        console.error('❌ Status del error::', error.status);
        console.error('❌ URL del API::', `${this.resolucionService['apiUrl']}/resoluciones`);
        this.snackBar.open('Error cargando resoluciones: ' + (error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
      }
    });
  }

  private cargarExpedientes(): void {
    // console.log removed for production
    this.loadingExpedientes.set(true);
    this.expedienteService.getExpedientes().subscribe({
      next: (expedientes) => {
        // console.log removed for production
        this.expedientes.set(expedientes);
        this.loadingExpedientes.set(false);
      },
      error: (error) => {
        console.error('❌ Error cargando expedientes::', error);
        this.snackBar.open('Error cargando expedientes', 'Cerrar', { duration: 3000 });
        this.loadingExpedientes.set(false);
      }
    });
  }

  private cargarOficinas(): void {
    this.loadingOficinas.set(true);
    this.oficinaService.getOficinas().subscribe({
      next: (oficinas) => {
        this.oficinas.set(oficinas);
        this.loadingOficinas.set(false);
      },
      error: (error) => {
        console.error('Error cargando oficinas::', error);
        this.loadingOficinas.set(false);
      }
    });
  }

  private cargarNotificaciones(): void {
    this.loadingNotificaciones.set(true);
    this.notificationService.getNotificaciones().subscribe({
      next: (notificaciones) => {
        this.notificaciones.set(notificaciones);
        this.loadingNotificaciones.set(false);
      },
      error: (error) => {
        console.error('Error cargando notificaciones::', error);
        this.loadingNotificaciones.set(false);
      }
    });
  }

  private iniciarActualizacionAutomatica(): void {
    interval(300000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cargarDatos();
    });
  }

  actualizarDashboard(): void {
    this.actualizando.set(true);
    this.cargarDatos();
    setTimeout(() => this.actualizando.set(false), 2000);
    this.snackBar.open('Dashboard actualizado', 'Cerrar', { duration: 2000 });
  }

  generarReporte(): void {
    this.snackBar.open('Generando reporte...', 'Cerrar', { duration: 2000 });
    // Implementar generación de reporte
  }

  navegarA(url: string): void {
    this.router.navigate([url]);
  }

  verExpediente(id: string): void {
    this.router.navigate(['/expedientes', id]);
  }

  editarExpediente(id: string): void {
    this.router.navigate(['/expedientes', id, 'editar']);
  }

  private calcularCambio(datos: any[]): number {
    // Retornar 0 hasta implementar cálculo real con datos históricos
    return 0;
  }

  private calcularCambioPorcentual(datos: any[]): number {
    const cambio = this.calcularCambio(datos);
    if (datos.length === 0) return 0;
    return Math.round((cambio / datos.length) * 100);
  }

  getActividadIcon(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'EMPRESA': 'business',
      'VEHICULO': 'directions_car',
      'CONDUCTOR': 'person',
      'RUTA': 'route',
      'RESOLUCION': 'description',
      'EXPEDIENTE': 'folder'
    };
    return iconos[tipo] || 'notifications';
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'COMPLETADO': 'primary',
      'PENDIENTE': 'warn',
      'EN_REVISION': 'accent',
      'APROBADO': 'primary',
      'RECHAZADO': 'warn'
    };
    return colores[estado] || 'primary';
  }

  getNotificacionIcon(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'SISTEMA': 'computer',
      'EXPEDIENTE': 'folder',
      'FISCALIZACION': 'security',
      'RECORDATORIO': 'schedule',
      'ALERTA': 'warning'
    };
    return iconos[tipo] || 'notifications';
  }

  getPrioridadColor(prioridad: string): string {
    const colores: { [key: string]: string } = {
      'BAJA': 'primary',
      'MEDIA': 'accent',
      'ALTA': 'warn',
      'CRITICA': 'warn'
    };
    return colores[prioridad] || 'primary';
  }

  getExpedienteEstadoColor(estado: string): string {
    return this.getEstadoColor(estado);
  }

  getEmpresaNombre(empresaId: string): string {
    const empresa = this.empresas().find(e => e.id === empresaId);
    return empresa ? empresa.razonSocial.principal : 'Desconocida';
  }
} 