/**
 * Performance Monitor Utility
 * 
 * Herramienta para medir y analizar el rendimiento de la aplicación
 * Incluye métricas de carga, respuesta, memoria y CPU
 */

export interface PerformanceMetrics {
  componentName: string;
  loadTime: number;
  renderTime: number;
  dataFetchTime?: number;
  memoryUsage?: number;
  timestamp: Date;
}

export interface FilterPerformanceMetrics {
  filterType: string;
  executionTime: number;
  resultCount: number;
  datasetSize: number;
  timestamp: Date;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static filterMetrics: FilterPerformanceMetrics[] = [];
  private static marks: Map<string, number> = new Map();

  /**
   * Inicia la medición de rendimiento
   */
  static startMeasure(label: string): void {
    try {
      this.marks.set(label, performance.now());
      if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
        performance.mark(`${label}-start`);
      }
    } catch (e) {}
  }

  /**
   * Finaliza la medición y retorna el tiempo transcurrido
   */
  static endMeasure(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    try {
      if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
        performance.mark(`${label}-end`);
        if (typeof performance.measure === 'function') {
          performance.measure(label, `${label}-start`, `${label}-end`);
        }
      }
    } catch (e) {}
    
    this.marks.delete(label);
    return duration;
  }

  /**
   * Registra métricas de componente
   */
  static recordComponentMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Mantener solo las últimas 100 métricas
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    console.log(`📊 Métricas de ${metrics.componentName}:`, {
      loadTime: `${metrics.loadTime.toFixed(2)}ms`,
      renderTime: `${metrics.renderTime.toFixed(2)}ms`,
      dataFetchTime: metrics.dataFetchTime ? `${metrics.dataFetchTime.toFixed(2)}ms` : 'N/A',
      memoryUsage: metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A'
    });
  }

  /**
   * Registra métricas de filtrado
   */
  static recordFilterMetrics(metrics: FilterPerformanceMetrics): void {
    this.filterMetrics.push(metrics);
    
    // Mantener solo las últimas 50 métricas de filtros
    if (this.filterMetrics.length > 50) {
      this.filterMetrics.shift();
    }

    console.log(`🔍 Métricas de filtro ${metrics.filterType}:`, {
      executionTime: `${metrics.executionTime.toFixed(2)}ms`,
      resultCount: metrics.resultCount,
      datasetSize: metrics.datasetSize,
      efficiency: `${((metrics.resultCount / metrics.datasetSize) * 100).toFixed(1)}%`
    });
  }

  /**
   * Obtiene estadísticas de rendimiento
   */
  static getStats(): {
    component: any;
    filter: any;
    memory: any;
  } {
    const componentStats = this.calculateComponentStats();
    const filterStats = this.calculateFilterStats();
    const memoryStats = this.getMemoryStats();

    return {
      component: componentStats,
      filter: filterStats,
      memory: memoryStats
    };
  }

  /**
   * Calcula estadísticas de componentes
   */
  private static calculateComponentStats() {
    if (this.metrics.length === 0) {
      return null;
    }

    const loadTimes = this.metrics.map(m => m.loadTime);
    const renderTimes = this.metrics.map(m => m.renderTime);

    return {
      avgLoadTime: this.average(loadTimes),
      maxLoadTime: Math.max(...loadTimes),
      minLoadTime: Math.min(...loadTimes),
      avgRenderTime: this.average(renderTimes),
      maxRenderTime: Math.max(...renderTimes),
      minRenderTime: Math.min(...renderTimes),
      totalMeasurements: this.metrics.length
    };
  }

  /**
   * Calcula estadísticas de filtros
   */
  private static calculateFilterStats() {
    if (this.filterMetrics.length === 0) {
      return null;
    }

    const executionTimes = this.filterMetrics.map(m => m.executionTime);
    const resultCounts = this.filterMetrics.map(m => m.resultCount);

    return {
      avgExecutionTime: this.average(executionTimes),
      maxExecutionTime: Math.max(...executionTimes),
      minExecutionTime: Math.min(...executionTimes),
      avgResultCount: this.average(resultCounts),
      totalFilters: this.filterMetrics.length
    };
  }

  /**
   * Obtiene estadísticas de memoria
   */
  private static getMemoryStats() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
        totalJSHeapSize: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
        jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB',
        usage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
      };
    }
    return null;
  }

  /**
   * Calcula el promedio de un array de números
   */
  private static average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Genera reporte de rendimiento
   */
  static generateReport(): string {
    const stats = this.getStats();
    
    let report = '\n=== REPORTE DE RENDIMIENTO ===\n\n';
    
    if (stats.component) {
      report += '📊 COMPONENTES:\n';
      report += `  - Tiempo de carga promedio: ${stats.component.avgLoadTime.toFixed(2)}ms\n`;
      report += `  - Tiempo de carga máximo: ${stats.component.maxLoadTime.toFixed(2)}ms\n`;
      report += `  - Tiempo de renderizado promedio: ${stats.component.avgRenderTime.toFixed(2)}ms\n`;
      report += `  - Total de mediciones: ${stats.component.totalMeasurements}\n\n`;
    }
    
    if (stats.filter) {
      report += '🔍 FILTROS:\n';
      report += `  - Tiempo de ejecución promedio: ${stats.filter.avgExecutionTime.toFixed(2)}ms\n`;
      report += `  - Tiempo de ejecución máximo: ${stats.filter.maxExecutionTime.toFixed(2)}ms\n`;
      report += `  - Resultados promedio: ${stats.filter.avgResultCount.toFixed(0)}\n`;
      report += `  - Total de filtros ejecutados: ${stats.filter.totalFilters}\n\n`;
    }
    
    if (stats.memory) {
      report += '💾 MEMORIA:\n';
      report += `  - Heap usado: ${stats.memory.usedJSHeapSize}\n`;
      report += `  - Heap total: ${stats.memory.totalJSHeapSize}\n`;
      report += `  - Límite de heap: ${stats.memory.jsHeapSizeLimit}\n`;
      report += `  - Uso: ${stats.memory.usage}\n\n`;
    }
    
    report += '=== FIN DEL REPORTE ===\n';
    
    return report;
  }

  /**
   * Imprime el reporte en consola
   */
  static printReport(): void {
    console.log(this.generateReport());
  }

  /**
   * Limpia todas las métricas
   */
  static clear(): void {
    this.metrics = [];
    this.filterMetrics = [];
    this.marks.clear();
    performance.clearMarks();
    performance.clearMeasures();
    // console.log removed for production
  }

  /**
   * Exporta métricas a JSON
   */
  static exportMetrics(): string {
    return JSON.stringify({
      componentMetrics: this.metrics,
      filterMetrics: this.filterMetrics,
      stats: this.getStats(),
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

/**
 * Decorador para medir el rendimiento de métodos
 */
export function MeasurePerformance(label?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const measureLabel = label || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      PerformanceMonitor.startMeasure(measureLabel);
      const result = originalMethod.apply(this, args);
      
      // Si el resultado es una Promise, medir cuando se resuelva
      if (result instanceof Promise) {
        return result.finally(() => {
          PerformanceMonitor.endMeasure(measureLabel);
        });
      }
      
      PerformanceMonitor.endMeasure(measureLabel);
      return result;
    };

    return descriptor;
  };
}
