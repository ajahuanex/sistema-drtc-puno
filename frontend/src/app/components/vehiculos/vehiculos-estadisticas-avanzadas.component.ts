import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { Vehiculo } from '../../models/vehiculo.model';

/**
 * Componente de estadísticas avanzadas de vehículos
 * 
 * Muestra métricas detalladas como:
 * - Distribución por marca (top 5)
 * - Distribución por categoría
 * - Promedio de antigüedad
 * - Tendencias de la flota
 * 
 * @example
 * ```html
 * <app-vehiculos-estadisticas-avanzadas
 *   [vehiculos]="vehiculos()">
 * </app-vehiculos-estadisticas-avanzadas>
 * ```
 */
@Component({
  selector: 'app-vehiculos-estadisticas-avanzadas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressBarModule,
    SmartIconComponent
  ],
  styles: [`
    .advanced-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .stat-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f0f0f0;
    }

    .stat-card-title {
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
      flex: 1;
    }

    .distribution-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding: 8px;
      border-radius: 8px;
      transition: background 0.2s ease;
    }

    .distribution-item:hover {
      background: #f8f9fa;
    }

    .distribution-label {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: #495057;
    }

    .distribution-value {
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
      min-width: 40px;
      text-align: right;
    }

    .distribution-percentage {
      font-size: 12px;
      color: #6c757d;
      min-width: 50px;
      text-align: right;
    }

    .progress-bar-container {
      width: 100%;
      height: 6px;
      background: #e9ecef;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 4px;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .metric-value {
      font-size: 32px;
      font-weight: 700;
      color: #2c3e50;
      margin: 16px 0 8px 0;
    }

    .metric-label {
      font-size: 13px;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .trend-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }

    .trend-indicator.positive {
      background: #d4edda;
      color: #155724;
    }

    .trend-indicator.negative {
      background: #f8d7da;
      color: #721c24;
    }

    .trend-indicator.neutral {
      background: #fff3cd;
      color: #856404;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #6c757d;
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    @media (max-width: 768px) {
      .advanced-stats {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
    <div class="advanced-stats">
      <!-- Distribución por Marca -->
      <mat-card class="stat-card">
        <div class="stat-card-header">
          <app-smart-icon [iconName]="'local_shipping'" [size]="24"></app-smart-icon>
          <div class="stat-card-title">Top 5 Marcas</div>
        </div>
        
        @if (distribucionPorMarca().length > 0) {
          @for (item of distribucionPorMarca(); track item.marca) {
            <div class="distribution-item">
              <div class="distribution-label">{{ item.marca }}</div>
              <div class="distribution-value">{{ item.cantidad }}</div>
              <div class="distribution-percentage">{{ item.porcentaje.toFixed(1) }}%</div>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" [style.width.%]="item.porcentaje"></div>
            </div>
          }
        } @else {
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <p>No hay datos de marcas</p>
          </div>
        }
      </mat-card>

      <!-- Distribución por Categoría -->
      <mat-card class="stat-card">
        <div class="stat-card-header">
          <app-smart-icon [iconName]="'category'" [size]="24"></app-smart-icon>
          <div class="stat-card-title">Distribución por Categoría</div>
        </div>
        
        @if (distribucionPorCategoria().length > 0) {
          @for (item of distribucionPorCategoria(); track item.categoria) {
            <div class="distribution-item">
              <div class="distribution-label">{{ item.categoria }}</div>
              <div class="distribution-value">{{ item.cantidad }}</div>
              <div class="distribution-percentage">{{ item.porcentaje.toFixed(1) }}%</div>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" [style.width.%]="item.porcentaje"></div>
            </div>
          }
        } @else {
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <p>No hay datos de categorías</p>
          </div>
        }
      </mat-card>

      <!-- Métricas de Antigüedad -->
      <mat-card class="stat-card">
        <div class="stat-card-header">
          <app-smart-icon [iconName]="'schedule'" [size]="24"></app-smart-icon>
          <div class="stat-card-title">Antigüedad de Flota</div>
        </div>
        
        <div class="metric-value">
          {{ metricasAvanzadas().promedioAntiguedad.toFixed(1) }} años
        </div>
        <div class="metric-label">Promedio de antigüedad</div>
        
        <div style="margin-top: 16px;">
          <div style="font-size: 13px; color: #6c757d; margin-bottom: 8px;">
            <strong>Marca más común:</strong> {{ metricasAvanzadas().marcaMasComun }}
          </div>
          <div style="font-size: 13px; color: #6c757d;">
            <strong>Categoría más común:</strong> {{ metricasAvanzadas().categoriaMasComun }}
          </div>
        </div>
      </mat-card>

      <!-- Salud de la Flota -->
      <mat-card class="stat-card">
        <div class="stat-card-header">
          <app-smart-icon [iconName]="'health_and_safety'" [size]="24"></app-smart-icon>
          <div class="stat-card-title">Salud de la Flota</div>
        </div>
        
        <div class="metric-value">
          {{ tendencias().porcentajeSaludable.toFixed(1) }}%
        </div>
        <div class="metric-label">Vehículos saludables</div>
        
        <div class="trend-indicator" [class]="tendencias().saludFlota === 'buena' ? 'positive' : 'neutral'">
          <app-smart-icon 
            [iconName]="tendencias().saludFlota === 'buena' ? 'check_circle' : 'warning'" 
            [size]="16">
          </app-smart-icon>
          <span>Estado: {{ tendencias().saludFlota === 'buena' ? 'Bueno' : 'Regular' }}</span>
        </div>
        
        @if (tendencias().necesitaAtencion > 0) {
          <div style="margin-top: 12px; padding: 12px; background: #fff3cd; border-radius: 8px;">
            <div style="font-size: 13px; color: #856404;">
              <strong>⚠️ {{ tendencias().necesitaAtencion }}</strong> vehículos necesitan atención
            </div>
          </div>
        }
      </mat-card>
    </div>
  `
})
export class VehiculosEstadisticasAvanzadasComponent {
  // Inputs
  vehiculos = input.required<Vehiculo[]>();

  /**
   * Computed signal para distribución por marca
   */
  distribucionPorMarca = computed(() => {
    const vehiculos = this.vehiculos();
    const total = vehiculos.length;
    
    if (total === 0) return [];

    const marcasMap = new Map<string, number>();
    vehiculos.forEach(v => {
      const marca = v.marca || 'SIN MARCA';
      marcasMap.set(marca, (marcasMap.get(marca) || 0) + 1);
    });

    return Array.from(marcasMap.entries())
      .map(([marca, cantidad]) => ({
        marca,
        cantidad,
        porcentaje: (cantidad / total) * 100
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  });

  /**
   * Computed signal para distribución por categoría
   */
  distribucionPorCategoria = computed(() => {
    const vehiculos = this.vehiculos();
    const total = vehiculos.length;
    
    if (total === 0) return [];

    const categoriasMap = new Map<string, number>();
    vehiculos.forEach(v => {
      const categoria = v.categoria || 'SIN CATEGORÍA';
      categoriasMap.set(categoria, (categoriasMap.get(categoria) || 0) + 1);
    });

    return Array.from(categoriasMap.entries())
      .map(([categoria, cantidad]) => ({
        categoria,
        cantidad,
        porcentaje: (cantidad / total) * 100
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  });

  /**
   * Computed signal para métricas avanzadas
   */
  metricasAvanzadas = computed(() => {
    const vehiculos = this.vehiculos();
    const añoActual = new Date().getFullYear();

    const vehiculosConAño = vehiculos.filter(v => v.anioFabricacion);
    const promedioAntiguedad = vehiculosConAño.length > 0
      ? vehiculosConAño.reduce((sum, v) => sum + (añoActual - (v.anioFabricacion || añoActual)), 0) / vehiculosConAño.length
      : 0;

    const distribucionMarca = this.distribucionPorMarca();
    const marcaMasComun = distribucionMarca.length > 0 ? distribucionMarca[0].marca : 'N/A';

    const distribucionCategoria = this.distribucionPorCategoria();
    const categoriaMasComun = distribucionCategoria.length > 0 ? distribucionCategoria[0].categoria : 'N/A';

    return {
      promedioAntiguedad,
      marcaMasComun,
      categoriaMasComun
    };
  });

  /**
   * Computed signal para tendencias
   */
  tendencias = computed(() => {
    const vehiculos = this.vehiculos();
    const activos = vehiculos.filter(v => v.estado === 'ACTIVO').length;
    const inactivos = vehiculos.filter(v => v.estado === 'INACTIVO').length;
    const suspendidos = vehiculos.filter(v => v.estado === 'SUSPENDIDO').length;

    return {
      saludFlota: activos > (inactivos + suspendidos) ? 'buena' : 'regular',
      porcentajeSaludable: vehiculos.length > 0 ? (activos / vehiculos.length) * 100 : 0,
      necesitaAtencion: suspendidos + inactivos,
      tendenciaGeneral: activos > inactivos ? 'positiva' : 'negativa'
    };
  });
}
