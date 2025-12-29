import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';

interface EstadisticasVehiculos {
  totalVehiculos: number;
  vehiculosActivos: number;
  vehiculosInactivos: number;
  vehiculosEnMantenimiento: number;
  vehiculosFueraDeServicio: number;
  vehiculosConTucVigente: number;
  vehiculosSinResolucion: number;
  promedioVehiculosPorEmpresa: number;
  distribucionPorCategoria: { [key: string]: number };
  distribucionPorMarca: { [key: string]: number };
  distribucionPorAnio: { [key: string]: number };
  distribucionPorSede: { [key: string]: number };
}

interface AlertaVehiculo {
  tipo: 'tuc_vencido' | 'sin_resolucion' | 'mantenimiento_pendiente' | 'documentos_faltantes';
  vehiculoId: string;
  placa: string;
  descripcion: string;
  prioridad: 'alta' | 'media' | 'baja';
  fechaVencimiento?: string;
}

@Component({
  selector: 'app-vehiculos-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    SmartIconComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1>
            <app-smart-icon [iconName]="'dashboard'" [size]="32"></app-smart-icon>
            Dashboard de Vehículos
          </h1>
          <p>Resumen ejecutivo y métricas del parque vehicular</p>
        </div>
        
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="actualizarDatos()">
            <app-smart-icon [iconName]="'refresh'" [size]="20"></app-smart-icon>
            Actualizar
          </button>
          
          <button mat-button [matMenuTriggerFor]="exportMenu">
            <app-smart-icon [iconName]="'download'" [size]="20"></app-smart-icon>
            Exportar
          </button>
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportarReporte('pdf')">
              <app-smart-icon [iconName]="'picture_as_pdf'" [size]="20"></app-smart-icon>
              Exportar PDF
            </button>
            <button mat-menu-item (click)="exportarReporte('excel')">
              <app-smart-icon [iconName]="'table_chart'" [size]="20"></app-smart-icon>
              Exportar Excel
            </button>
          </mat-menu>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-container">
          <mat-spinner diameter="60"></mat-spinner>
          <p>Cargando estadísticas...</p>
        </div>
      } @else {
        <!-- Métricas principales -->
        <div class="metricas-principales">
          <div class="metrica-card total">
            <div class="metrica-icon">
              <app-smart-icon [iconName]="'directions_car'" [size]="48"></app-smart-icon>
            </div>
            <div class="metrica-info">
              <h2>{{ estadisticas()?.totalVehiculos || 0 }}</h2>
              <p>Total Vehículos</p>
              <small>{{ calcularCrecimiento('total') }}</small>
            </div>
          </div>

          <div class="metrica-card activos">
            <div class="metrica-icon">
              <app-smart-icon [iconName]="'check_circle'" [size]="48"></app-smart-icon>
            </div>
            <div class="metrica-info">
              <h2>{{ estadisticas()?.vehiculosActivos || 0 }}</h2>
              <p>Vehículos Activos</p>
              <small>{{ calcularPorcentaje(estadisticas()?.vehiculosActivos || 0) }}% del total</small>
            </div>
          </div>

          <div class="metrica-card tuc-vigente">
            <div class="metrica-icon">
              <app-smart-icon [iconName]="'verified'" [size]="48"></app-smart-icon>
            </div>
            <div class="metrica-info">
              <h2>{{ estadisticas()?.vehiculosConTucVigente || 0 }}</h2>
              <p>Con TUC Vigente</p>
              <small>{{ calcularPorcentaje(estadisticas()?.vehiculosConTucVigente || 0) }}% del total</small>
            </div>
          </div>

          <div class="metrica-card promedio">
            <div class="metrica-icon">
              <app-smart-icon [iconName]="'analytics'" [size]="48"></app-smart-icon>
            </div>
            <div class="metrica-info">
              <h2>{{ (estadisticas()?.promedioVehiculosPorEmpresa || 0).toFixed(1) }}</h2>
              <p>Promedio por Empresa</p>
              <small>{{ empresas().length }} empresa(s) registrada(s)</small>
            </div>
          </div>
        </div>

        <!-- Alertas y notificaciones -->
        @if (alertas().length > 0) {
          <mat-card class="alertas-card">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'warning'" [size]="24"></app-smart-icon>
                Alertas y Notificaciones
              </mat-card-title>
              <mat-card-subtitle>
                {{ alertas().length }} alerta(s) requieren atención
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="alertas-lista">
                @for (alerta of alertas().slice(0, 5); track alerta.vehiculoId) {
                  <div class="alerta-item" [class]="'prioridad-' + alerta.prioridad">
                    <div class="alerta-icon">
                      <app-smart-icon 
                        [iconName]="getIconoAlerta(alerta.tipo)" 
                        [size]="24">
                      </app-smart-icon>
                    </div>
                    <div class="alerta-info">
                      <h4>{{ alerta.placa }}</h4>
                      <p>{{ alerta.descripcion }}</p>
                      @if (alerta.fechaVencimiento) {
                        <small>Vence: {{ formatearFecha(alerta.fechaVencimiento) }}</small>
                      }
                    </div>
                    <div class="alerta-prioridad">
                      <mat-chip [color]="getColorPrioridad(alerta.prioridad)">
                        {{ alerta.prioridad.toUpperCase() }}
                      </mat-chip>
                    </div>
                  </div>
                }
                
                @if (alertas().length > 5) {
                  <div class="ver-mas-alertas">
                    <button mat-button color="primary" (click)="verTodasLasAlertas()">
                      Ver todas las alertas ({{ alertas().length - 5 }} más)
                    </button>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Gráficos y distribuciones -->
        <div class="graficos-container">
          <!-- Distribución por estado -->
          <mat-card class="grafico-card">
            <mat-card-header>
              <mat-card-title>Distribución por Estado</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="distribucion-estados">
                <div class="estado-item activo">
                  <div class="estado-barra" 
                       [style.width.%]="calcularPorcentaje(estadisticas()?.vehiculosActivos || 0)">
                  </div>
                  <div class="estado-info">
                    <span class="estado-label">Activos</span>
                    <span class="estado-valor">{{ estadisticas()?.vehiculosActivos || 0 }}</span>
                  </div>
                </div>

                <div class="estado-item inactivo">
                  <div class="estado-barra" 
                       [style.width.%]="calcularPorcentaje(estadisticas()?.vehiculosInactivos || 0)">
                  </div>
                  <div class="estado-info">
                    <span class="estado-label">Inactivos</span>
                    <span class="estado-valor">{{ estadisticas()?.vehiculosInactivos || 0 }}</span>
                  </div>
                </div>

                <div class="estado-item mantenimiento">
                  <div class="estado-barra" 
                       [style.width.%]="calcularPorcentaje(estadisticas()?.vehiculosEnMantenimiento || 0)">
                  </div>
                  <div class="estado-info">
                    <span class="estado-label">Mantenimiento</span>
                    <span class="estado-valor">{{ estadisticas()?.vehiculosEnMantenimiento || 0 }}</span>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Distribución por categoría -->
          <mat-card class="grafico-card">
            <mat-card-header>
              <mat-card-title>Distribución por Categoría</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="distribucion-categorias">
                @for (categoria of getCategorias(); track categoria.nombre) {
                  <div class="categoria-item">
                    <div class="categoria-info">
                      <span class="categoria-label">{{ categoria.nombre }}</span>
                      <span class="categoria-valor">{{ categoria.cantidad }}</span>
                    </div>
                    <div class="categoria-barra">
                      <div class="categoria-progreso" 
                           [style.width.%]="categoria.porcentaje">
                      </div>
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Distribución por marca y año -->
        <div class="distribuciones-adicionales">
          <mat-card class="distribucion-card">
            <mat-card-header>
              <mat-card-title>Top 5 Marcas</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="top-lista">
                @for (marca of getTopMarcas(); track marca.nombre) {
                  <div class="top-item">
                    <span class="top-nombre">{{ marca.nombre }}</span>
                    <span class="top-cantidad">{{ marca.cantidad }}</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="distribucion-card">
            <mat-card-header>
              <mat-card-title>Distribución por Sede</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="sedes-lista">
                @for (sede of getSedes(); track sede.nombre) {
                  <div class="sede-item">
                    <app-smart-icon [iconName]="'location_city'" [size]="20"></app-smart-icon>
                    <span class="sede-nombre">{{ sede.nombre }}</span>
                    <mat-chip>{{ sede.cantidad }}</mat-chip>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Acciones rápidas -->
        <mat-card class="acciones-card">
          <mat-card-header>
            <mat-card-title>Acciones Rápidas</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="acciones-grid">
              <button mat-raised-button color="primary" (click)="abrirCargaMasiva()">
                <app-smart-icon [iconName]="'upload_file'" [size]="24"></app-smart-icon>
                <div class="accion-info">
                  <span>Carga Masiva</span>
                  <small>Importar vehículos desde Excel</small>
                </div>
              </button>

              <button mat-raised-button color="accent" (click)="generarReporteCompleto()">
                <app-smart-icon [iconName]="'assessment'" [size]="24"></app-smart-icon>
                <div class="accion-info">
                  <span>Reporte Completo</span>
                  <small>Generar reporte detallado</small>
                </div>
              </button>

              <button mat-raised-button (click)="configurarAlertas()">
                <app-smart-icon [iconName]="'notifications'" [size]="24"></app-smart-icon>
                <div class="accion-info">
                  <span>Configurar Alertas</span>
                  <small>Gestionar notificaciones</small>
                </div>
              </button>

              <button mat-raised-button (click)="exportarDatos()">
                <app-smart-icon [iconName]="'cloud_download'" [size]="24"></app-smart-icon>
                <div class="accion-info">
                  <span>Exportar Datos</span>
                  <small>Descargar información</small>
                </div>
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,  styles
: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .header-content h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 28px;
    }

    .header-content p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 24px;
      color: #666;
    }

    .metricas-principales {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .metrica-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    }

    .metrica-card:hover {
      transform: translateY(-2px);
    }

    .metrica-card.total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .metrica-card.activos {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .metrica-card.tuc-vigente {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      color: white;
    }

    .metrica-card.promedio {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }

    .metrica-icon {
      opacity: 0.9;
    }

    .metrica-info h2 {
      margin: 0 0 4px 0;
      font-size: 36px;
      font-weight: 700;
    }

    .metrica-info p {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 500;
      opacity: 0.9;
    }

    .metrica-info small {
      font-size: 12px;
      opacity: 0.8;
    }

    .alertas-card {
      margin-bottom: 32px;
    }

    .alertas-lista {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .alerta-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .alerta-item.prioridad-alta {
      background: #ffebee;
      border-left-color: #f44336;
    }

    .alerta-item.prioridad-media {
      background: #fff3e0;
      border-left-color: #ff9800;
    }

    .alerta-item.prioridad-baja {
      background: #e8f5e8;
      border-left-color: #4caf50;
    }

    .alerta-info {
      flex: 1;
    }

    .alerta-info h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .alerta-info p {
      margin: 0 0 4px 0;
      color: #666;
    }

    .alerta-info small {
      color: #999;
      font-size: 12px;
    }

    .ver-mas-alertas {
      text-align: center;
      padding: 16px;
    }

    .graficos-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .grafico-card {
      min-height: 300px;
    }

    .distribucion-estados {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .estado-item {
      position: relative;
    }

    .estado-barra {
      height: 8px;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .estado-item.activo .estado-barra {
      background: linear-gradient(90deg, #4caf50, #66bb6a);
    }

    .estado-item.inactivo .estado-barra {
      background: linear-gradient(90deg, #f44336, #ef5350);
    }

    .estado-item.mantenimiento .estado-barra {
      background: linear-gradient(90deg, #ff9800, #ffb74d);
    }

    .estado-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .estado-label {
      font-weight: 500;
    }

    .estado-valor {
      font-weight: 600;
      color: #1976d2;
    }

    .distribucion-categorias {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .categoria-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .categoria-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .categoria-barra {
      height: 6px;
      background: #f5f5f5;
      border-radius: 3px;
      overflow: hidden;
    }

    .categoria-progreso {
      height: 100%;
      background: linear-gradient(90deg, #1976d2, #42a5f5);
      transition: width 0.3s ease;
    }

    .distribuciones-adicionales {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .top-lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .top-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .top-nombre {
      font-weight: 500;
    }

    .top-cantidad {
      font-weight: 600;
      color: #1976d2;
    }

    .sedes-lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .sede-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .sede-nombre {
      flex: 1;
      font-weight: 500;
    }

    .acciones-card {
      margin-bottom: 32px;
    }

    .acciones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .acciones-grid button {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      height: auto;
      text-align: left;
    }

    .accion-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .accion-info span {
      font-weight: 500;
      font-size: 16px;
    }

    .accion-info small {
      color: rgba(255,255,255,0.8);
      font-size: 12px;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .dashboard-header {
        flex-direction: column;
        gap: 16px;
      }

      .metricas-principales {
        grid-template-columns: 1fr;
      }

      .graficos-container {
        grid-template-columns: 1fr;
      }

      .distribuciones-adicionales {
        grid-template-columns: 1fr;
      }

      .acciones-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VehiculosDashboardComponent implements OnInit {
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);

  // Estado del componente
  cargando = signal(true);
  estadisticas = signal<EstadisticasVehiculos | null>(null);
  vehiculos = signal<Vehiculo[]>([]);
  empresas = signal<Empresa[]>([]);
  alertas = signal<AlertaVehiculo[]>([]);

  ngOnInit(): void {
    this.cargarDatos();
  }

  private async cargarDatos(): Promise<void> {
    this.cargando.set(true);
    
    try {
      // Cargar datos en paralelo
      const [vehiculos, empresas] = await Promise.all([
        this.vehiculoService.getVehiculos().toPromise(),
        this.empresaService.getEmpresas().toPromise()
      ]);

      this.vehiculos.set(vehiculos || []);
      this.empresas.set(empresas || []);
      
      // Calcular estadísticas
      this.calcularEstadisticas();
      
      // Generar alertas
      this.generarAlertas();
      
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  private calcularEstadisticas(): void {
    const vehiculos = this.vehiculos();
    const empresas = this.empresas();

    const estadisticas: EstadisticasVehiculos = {
      totalVehiculos: vehiculos.length,
      vehiculosActivos: vehiculos.filter(v => v.estado === 'ACTIVO').length,
      vehiculosInactivos: vehiculos.filter(v => v.estado === 'INACTIVO').length,
      vehiculosEnMantenimiento: vehiculos.filter(v => v.estado === 'EN_MANTENIMIENTO').length,
      vehiculosFueraDeServicio: vehiculos.filter(v => v.estado === 'FUERA_DE_SERVICIO').length,
      vehiculosConTucVigente: vehiculos.filter(v => v.tuc && this.isTucVigente(v.tuc)).length,
      vehiculosSinResolucion: vehiculos.filter(v => !v.resolucionId).length,
      promedioVehiculosPorEmpresa: empresas.length > 0 ? vehiculos.length / empresas.length : 0,
      distribucionPorCategoria: this.calcularDistribucion(vehiculos, 'categoria'),
      distribucionPorMarca: this.calcularDistribucion(vehiculos, 'marca'),
      distribucionPorAnio: this.calcularDistribucion(vehiculos, 'anioFabricacion'),
      distribucionPorSede: this.calcularDistribucion(vehiculos, 'sedeRegistro')
    };

    this.estadisticas.set(estadisticas);
  }

  private calcularDistribucion(vehiculos: Vehiculo[], campo: keyof Vehiculo): { [key: string]: number } {
    const distribucion: { [key: string]: number } = {};
    
    vehiculos.forEach(vehiculo => {
      const valor = String(vehiculo[campo] || 'Sin especificar');
      distribucion[valor] = (distribucion[valor] || 0) + 1;
    });

    return distribucion;
  }

  private isTucVigente(tuc: any): boolean {
    if (!tuc || !tuc.fechaEmision) return false;
    
    const fechaEmision = new Date(tuc.fechaEmision);
    const fechaVencimiento = new Date(fechaEmision);
    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1); // TUC válido por 1 año
    
    return fechaVencimiento > new Date();
  }

  private generarAlertas(): void {
    const vehiculos = this.vehiculos();
    const alertas: AlertaVehiculo[] = [];

    vehiculos.forEach(vehiculo => {
      // TUC vencido o próximo a vencer
      if (vehiculo.tuc) {
        const fechaVencimiento = this.calcularFechaVencimientoTuc(vehiculo.tuc);
        const diasParaVencer = this.calcularDiasParaVencer(fechaVencimiento);
        
        if (diasParaVencer < 0) {
          alertas.push({
            tipo: 'tuc_vencido',
            vehiculoId: vehiculo.id,
            placa: vehiculo.placa,
            descripcion: 'TUC vencido',
            prioridad: 'alta',
            fechaVencimiento: fechaVencimiento.toISOString()
          });
        } else if (diasParaVencer <= 30) {
          alertas.push({
            tipo: 'tuc_vencido',
            vehiculoId: vehiculo.id,
            placa: vehiculo.placa,
            descripcion: `TUC vence en ${diasParaVencer} días`,
            prioridad: diasParaVencer <= 7 ? 'alta' : 'media',
            fechaVencimiento: fechaVencimiento.toISOString()
          });
        }
      }

      // Sin resolución
      if (!vehiculo.resolucionId) {
        alertas.push({
          tipo: 'sin_resolucion',
          vehiculoId: vehiculo.id,
          placa: vehiculo.placa,
          descripcion: 'Vehículo sin resolución asignada',
          prioridad: 'media'
        });
      }

      // En mantenimiento por mucho tiempo
      if (vehiculo.estado === 'EN_MANTENIMIENTO') {
        alertas.push({
          tipo: 'mantenimiento_pendiente',
          vehiculoId: vehiculo.id,
          placa: vehiculo.placa,
          descripcion: 'Vehículo en mantenimiento',
          prioridad: 'baja'
        });
      }
    });

    // Ordenar por prioridad
    alertas.sort((a, b) => {
      const prioridades = { 'alta': 3, 'media': 2, 'baja': 1 };
      return prioridades[b.prioridad] - prioridades[a.prioridad];
    });

    this.alertas.set(alertas);
  }

  private calcularFechaVencimientoTuc(tuc: any): Date {
    const fechaEmision = new Date(tuc.fechaEmision);
    const fechaVencimiento = new Date(fechaEmision);
    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
    return fechaVencimiento;
  }

  private calcularDiasParaVencer(fechaVencimiento: Date): number {
    const hoy = new Date();
    const diferencia = fechaVencimiento.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  // Métodos de utilidad para la UI
  calcularPorcentaje(valor: number): number {
    const total = this.estadisticas()?.totalVehiculos || 1;
    return Math.round((valor / total) * 100);
  }

  calcularCrecimiento(tipo: string): string {
    // Simulado - en una implementación real, compararías con datos históricos
    const crecimiento = Math.floor(Math.random() * 20) - 10; // -10% a +10%
    const signo = crecimiento >= 0 ? '+' : '';
    return `${signo}${crecimiento}% vs mes anterior`;
  }

  getCategorias(): Array<{nombre: string, cantidad: number, porcentaje: number}> {
    const distribucion = this.estadisticas()?.distribucionPorCategoria || {};
    const total = this.estadisticas()?.totalVehiculos || 1;
    
    return Object.entries(distribucion)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: Math.round((cantidad / total) * 100)
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  getTopMarcas(): Array<{nombre: string, cantidad: number}> {
    const distribucion = this.estadisticas()?.distribucionPorMarca || {};
    
    return Object.entries(distribucion)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }

  getSedes(): Array<{nombre: string, cantidad: number}> {
    const distribucion = this.estadisticas()?.distribucionPorSede || {};
    
    return Object.entries(distribucion)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  getIconoAlerta(tipo: string): string {
    const iconos = {
      'tuc_vencido': 'schedule',
      'sin_resolucion': 'description',
      'mantenimiento_pendiente': 'build',
      'documentos_faltantes': 'folder_open'
    };
    return iconos[tipo as keyof typeof iconos] || 'warning';
  }

  getColorPrioridad(prioridad: string): string {
    const colores = {
      'alta': 'warn',
      'media': 'accent',
      'baja': 'primary'
    };
    return colores[prioridad as keyof typeof colores] || 'basic';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Métodos de acción
  actualizarDatos(): void {
    this.cargarDatos();
  }

  exportarReporte(formato: 'pdf' | 'excel'): void {
    console.log(`Exportando reporte en formato ${formato}`);
    // Implementar exportación
  }

  abrirCargaMasiva(): void {
    console.log('Abriendo carga masiva');
    // Implementar apertura de modal de carga masiva
  }

  generarReporteCompleto(): void {
    console.log('Generando reporte completo');
    // Implementar generación de reporte
  }

  configurarAlertas(): void {
    console.log('Configurando alertas');
    // Implementar configuración de alertas
  }

  exportarDatos(): void {
    console.log('Exportando datos');
    // Implementar exportación de datos
  }

  verTodasLasAlertas(): void {
    console.log('Ver todas las alertas');
    // Implementar vista de todas las alertas
  }
}