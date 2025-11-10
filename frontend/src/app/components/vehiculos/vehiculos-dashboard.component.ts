import { Component, input, computed, output, ChangeDetectionStrategy, effect, signal, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { Vehiculo } from '../../models/vehiculo.model';

/**
 * Interfaz para estadísticas de vehículos
 */
export interface VehiculoEstadistica {
  label: string;
  value: number;
  icon: string;
  color: 'total' | 'activos' | 'suspendidos' | 'empresas' | 'inactivos' | 'revision';
  percentage?: number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    icon: string;
  };
}

/**
 * Interfaz para distribución por marca
 */
export interface DistribucionMarca {
  marca: string;
  cantidad: number;
  porcentaje: number;
}

/**
 * Interfaz para distribución por categoría
 */
export interface DistribucionCategoria {
  categoria: string;
  cantidad: number;
  porcentaje: number;
}

/**
 * Interfaz para métricas avanzadas
 */
export interface MetricasAvanzadas {
  promedioAntiguedad: number;
  vehiculosMasNuevos: Vehiculo[];
  vehiculosMasAntiguos: Vehiculo[];
  marcaMasComun: string;
  categoriaMasComun: string;
}

/**
 * Interfaz para filtro por estadística
 */
export interface FiltroEstadistica {
  tipo: 'estado' | 'marca' | 'categoria' | 'limpiar';
  valor?: string;
  estadistica: VehiculoEstadistica;
}

/**
 * Componente de dashboard de estadísticas de vehículos
 * 
 * Muestra estadísticas visuales de la flota de vehículos con:
 * - Total de vehículos
 * - Vehículos activos
 * - Vehículos suspendidos
 * - Número de empresas
 * - Distribución por estado
 * 
 * @example
 * ```html
 * <app-vehiculos-dashboard
 *   [vehiculos]="vehiculos()"
 *   [totalEmpresas]="empresas().length"
 *   (estadisticaClick)="filtrarPorEstadistica($event)">
 * </app-vehiculos-dashboard>
 * ```
 */
@Component({
  selector: 'app-vehiculos-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatTooltipModule,
    SmartIconComponent
  ],
  styles: [`
    .stats-section {
      margin-bottom: 24px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      cursor: pointer;
      border-left: 4px solid;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .stat-card.total {
      border-left-color: #2196F3;
      background: linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%);
    }

    .stat-card.activos {
      border-left-color: #4CAF50;
      background: linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%);
    }

    .stat-card.suspendidos {
      border-left-color: #FF9800;
      background: linear-gradient(135deg, #ffffff 0%, #fff3e0 100%);
    }

    .stat-card.inactivos {
      border-left-color: #F44336;
      background: linear-gradient(135deg, #ffffff 0%, #ffebee 100%);
    }

    .stat-card.revision {
      border-left-color: #9C27B0;
      background: linear-gradient(135deg, #ffffff 0%, #f3e5f5 100%);
    }

    .stat-card.empresas {
      border-left-color: #607D8B;
      background: linear-gradient(135deg, #ffffff 0%, #eceff1 100%);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.8);
      flex-shrink: 0;
    }

    .stat-card.total .stat-icon {
      color: #2196F3;
    }

    .stat-card.activos .stat-icon {
      color: #4CAF50;
    }

    .stat-card.suspendidos .stat-icon {
      color: #FF9800;
    }

    .stat-card.inactivos .stat-icon {
      color: #F44336;
    }

    .stat-card.revision .stat-icon {
      color: #9C27B0;
    }

    .stat-card.empresas .stat-icon {
      color: #607D8B;
    }

    .stat-content {
      flex: 1;
      min-width: 0;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 8px;
      color: #212121;
    }

    .stat-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #757575;
      margin-bottom: 8px;
    }

    .stat-percentage {
      font-size: 14px;
      font-weight: 500;
      color: #9E9E9E;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 500;
    }

    .stat-trend.positive {
      color: #4CAF50;
    }

    .stat-trend.negative {
      color: #F44336;
    }

    .stat-trend.neutral {
      color: #757575;
    }

    /* Animaciones */
    @keyframes countUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .stat-value {
      animation: countUp 0.5s ease-out;
      transition: all 0.3s ease;
    }

    .stat-card {
      animation: slideIn 0.4s ease-out;
      animation-fill-mode: both;
    }

    /* Stagger animation for cards */
    .stat-card:nth-child(1) { animation-delay: 0.05s; }
    .stat-card:nth-child(2) { animation-delay: 0.1s; }
    .stat-card:nth-child(3) { animation-delay: 0.15s; }
    .stat-card:nth-child(4) { animation-delay: 0.2s; }
    .stat-card:nth-child(5) { animation-delay: 0.25s; }
    .stat-card:nth-child(6) { animation-delay: 0.3s; }

    .stat-percentage,
    .stat-trend {
      animation: fadeIn 0.6s ease-out;
      animation-delay: 0.3s;
      animation-fill-mode: both;
    }

    /* Pulse animation for active state */
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    .stat-card.active {
      animation: pulse 0.6s ease-in-out;
    }

    /* Smooth color transitions */
    .stat-icon {
      transition: transform 0.3s ease, color 0.3s ease;
    }

    .stat-card:hover .stat-icon {
      transform: scale(1.1) rotate(5deg);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-card {
        padding: 16px;
      }

      .stat-icon {
        width: 48px;
        height: 48px;
      }

      .stat-value {
        font-size: 24px;
      }
    }

    /* Soporte para prefers-reduced-motion */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }

      .stat-card {
        transition: none;
        animation: none;
      }

      .stat-card:hover {
        transform: none;
      }

      .stat-card:hover .stat-icon {
        transform: none;
      }

      .stat-value,
      .stat-percentage,
      .stat-trend {
        animation: none;
      }

      .stat-icon {
        transition: none;
      }
    }
  `],
  template: `
    <div class="stats-section">
      <div class="stats-grid">
        @for (stat of estadisticas(); track stat.label) {
          <div 
            class="stat-card"
            [class]="stat.color"
            (click)="onEstadisticaClick(stat)"
            [matTooltip]="'Click para filtrar por ' + stat.label"
            role="button"
            tabindex="0"
            [attr.aria-label]="stat.label + ': ' + stat.value">
            
            <div class="stat-icon">
              <app-smart-icon 
                [iconName]="stat.icon" 
                [size]="32"
                [clickable]="true">
              </app-smart-icon>
            </div>
            
            <div class="stat-content">
              <div class="stat-value">{{ getAnimatedValue(stat.label, stat.value) }}</div>
              <div class="stat-label">{{ stat.label }}</div>
              
              @if (stat.percentage !== undefined) {
                <div class="stat-percentage">
                  {{ stat.percentage.toFixed(1) }}% del total
                </div>
              }
              
              @if (stat.trend) {
                <div class="stat-trend" [class]="stat.trend.direction">
                  <app-smart-icon 
                    [iconName]="stat.trend.icon" 
                    [size]="16">
                  </app-smart-icon>
                  <span>{{ stat.trend.value }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class VehiculosDashboardComponent {
  private elementRef = inject(ElementRef);

  // Inputs
  vehiculos = input.required<Vehiculo[]>();
  totalEmpresas = input<number>(0);

  // Outputs
  estadisticaClick = output<VehiculoEstadistica>();

  // Animation state
  private animatedValues = signal<Map<string, number>>(new Map());
  private prefersReducedMotion = signal<boolean>(false);

  constructor() {
    // Check for prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion.set(mediaQuery.matches);
      
      // Listen for changes
      mediaQuery.addEventListener('change', (e) => {
        this.prefersReducedMotion.set(e.matches);
      });
    }

    // Effect to animate values when they change
    effect(() => {
      const stats = this.estadisticas();
      if (!this.prefersReducedMotion()) {
        stats.forEach(stat => {
          this.animateValue(stat.label, stat.value);
        });
      }
    });
  }

  /**
   * Computed signal para estadísticas calculadas
   */
  estadisticas = computed<VehiculoEstadistica[]>(() => {
    const vehiculos = this.vehiculos();
    const total = vehiculos.length;
    const empresas = this.totalEmpresas();

    // Calcular vehículos por estado
    const activos = this.contarPorEstado(vehiculos, 'ACTIVO');
    const suspendidos = this.contarPorEstado(vehiculos, 'SUSPENDIDO');
    const inactivos = this.contarPorEstado(vehiculos, 'INACTIVO');
    const enRevision = this.contarPorEstado(vehiculos, 'EN_REVISION');

    return [
      {
        label: 'TOTAL VEHÍCULOS',
        value: total,
        icon: 'directions_car',
        color: 'total',
        trend: {
          direction: 'up',
          value: `+${activos} activos`,
          icon: 'trending_up'
        }
      },
      {
        label: 'VEHÍCULOS ACTIVOS',
        value: activos,
        icon: 'check_circle',
        color: 'activos',
        percentage: total > 0 ? (activos / total) * 100 : 0
      },
      {
        label: 'SUSPENDIDOS',
        value: suspendidos,
        icon: 'warning',
        color: 'suspendidos',
        percentage: total > 0 ? (suspendidos / total) * 100 : 0
      },
      {
        label: 'INACTIVOS',
        value: inactivos,
        icon: 'cancel',
        color: 'inactivos',
        percentage: total > 0 ? (inactivos / total) * 100 : 0
      },
      {
        label: 'EN REVISIÓN',
        value: enRevision,
        icon: 'pending',
        color: 'revision',
        percentage: total > 0 ? (enRevision / total) * 100 : 0
      },
      {
        label: 'EMPRESAS',
        value: empresas,
        icon: 'business',
        color: 'empresas',
        trend: {
          direction: 'neutral',
          value: 'Operando en el sistema',
          icon: 'business_center'
        }
      }
    ];
  });

  /**
   * Computed signal para distribución por marca
   */
  distribucionPorMarca = computed<DistribucionMarca[]>(() => {
    const vehiculos = this.vehiculos();
    const total = vehiculos.length;
    
    if (total === 0) return [];

    // Agrupar por marca
    const marcasMap = new Map<string, number>();
    vehiculos.forEach(v => {
      const marca = v.marca || 'SIN MARCA';
      marcasMap.set(marca, (marcasMap.get(marca) || 0) + 1);
    });

    // Convertir a array y ordenar por cantidad
    return Array.from(marcasMap.entries())
      .map(([marca, cantidad]) => ({
        marca,
        cantidad,
        porcentaje: (cantidad / total) * 100
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5); // Top 5 marcas
  });

  /**
   * Computed signal para distribución por categoría
   */
  distribucionPorCategoria = computed<DistribucionCategoria[]>(() => {
    const vehiculos = this.vehiculos();
    const total = vehiculos.length;
    
    if (total === 0) return [];

    // Agrupar por categoría
    const categoriasMap = new Map<string, number>();
    vehiculos.forEach(v => {
      const categoria = v.categoria || 'SIN CATEGORÍA';
      categoriasMap.set(categoria, (categoriasMap.get(categoria) || 0) + 1);
    });

    // Convertir a array y ordenar por cantidad
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
  metricasAvanzadas = computed<MetricasAvanzadas>(() => {
    const vehiculos = this.vehiculos();
    const añoActual = new Date().getFullYear();

    // Calcular promedio de antigüedad
    const vehiculosConAño = vehiculos.filter(v => v.anioFabricacion);
    const promedioAntiguedad = vehiculosConAño.length > 0
      ? vehiculosConAño.reduce((sum, v) => sum + (añoActual - (v.anioFabricacion || añoActual)), 0) / vehiculosConAño.length
      : 0;

    // Vehículos más nuevos (últimos 3 años)
    const vehiculosMasNuevos = vehiculos
      .filter(v => v.anioFabricacion && (añoActual - v.anioFabricacion) <= 3)
      .sort((a, b) => (b.anioFabricacion || 0) - (a.anioFabricacion || 0))
      .slice(0, 5);

    // Vehículos más antiguos
    const vehiculosMasAntiguos = vehiculos
      .filter(v => v.anioFabricacion)
      .sort((a, b) => (a.anioFabricacion || 0) - (b.anioFabricacion || 0))
      .slice(0, 5);

    // Marca más común
    const distribucionMarca = this.distribucionPorMarca();
    const marcaMasComun = distribucionMarca.length > 0 ? distribucionMarca[0].marca : 'N/A';

    // Categoría más común
    const distribucionCategoria = this.distribucionPorCategoria();
    const categoriaMasComun = distribucionCategoria.length > 0 ? distribucionCategoria[0].categoria : 'N/A';

    return {
      promedioAntiguedad,
      vehiculosMasNuevos,
      vehiculosMasAntiguos,
      marcaMasComun,
      categoriaMasComun
    };
  });

  /**
   * Computed signal para tendencias
   * Calcula si hay más vehículos activos que inactivos, etc.
   */
  tendencias = computed(() => {
    const vehiculos = this.vehiculos();
    const activos = this.contarPorEstado(vehiculos, 'ACTIVO');
    const inactivos = this.contarPorEstado(vehiculos, 'INACTIVO');
    const suspendidos = this.contarPorEstado(vehiculos, 'SUSPENDIDO');

    return {
      saludFlota: activos > (inactivos + suspendidos) ? 'buena' : 'regular',
      porcentajeSaludable: vehiculos.length > 0 ? (activos / vehiculos.length) * 100 : 0,
      necesitaAtencion: suspendidos + inactivos,
      tendenciaGeneral: activos > inactivos ? 'positiva' : 'negativa'
    };
  });

  /**
   * Contar vehículos por estado
   */
  private contarPorEstado(vehiculos: Vehiculo[], estado: string): number {
    return vehiculos.filter(v => v.estado === estado).length;
  }

  /**
   * Manejar click en estadística
   */
  onEstadisticaClick(stat: VehiculoEstadistica): void {
    this.estadisticaClick.emit(stat);
    
    // Add active animation if not reduced motion
    if (!this.prefersReducedMotion()) {
      const cards = this.elementRef.nativeElement.querySelectorAll('.stat-card');
      cards.forEach((card: HTMLElement) => {
        if (card.querySelector('.stat-label')?.textContent === stat.label) {
          card.classList.add('active');
          setTimeout(() => card.classList.remove('active'), 600);
        }
      });
    }
  }

  /**
   * Animate value with countUp effect
   */
  private animateValue(label: string, targetValue: number): void {
    if (this.prefersReducedMotion()) {
      this.animatedValues.update(map => {
        map.set(label, targetValue);
        return new Map(map);
      });
      return;
    }

    const currentValue = this.animatedValues().get(label) || 0;
    
    // Skip if value hasn't changed
    if (currentValue === targetValue) {
      return;
    }

    const duration = 1000; // 1 second
    const startTime = performance.now();
    const difference = targetValue - currentValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(currentValue + (difference * easeOut));
      
      this.animatedValues.update(map => {
        map.set(label, value);
        return new Map(map);
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Get animated value for display
   */
  getAnimatedValue(label: string, actualValue: number): number {
    if (this.prefersReducedMotion()) {
      return actualValue;
    }
    return this.animatedValues().get(label) || actualValue;
  }
}
