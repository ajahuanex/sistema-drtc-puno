import { Component, OnInit, inject, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardEstadisticas } from '../../services/dashboard.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  
  estadisticas = signal<DashboardEstadisticas | null>(null);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  
  generandoReporte = signal<boolean>(false);
  reporteUrl = signal<string | null>(null);
  reporteError = signal<string | null>(null);
  
  @ViewChild('modalidadChart') modalidadChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rutasChart') rutasChartRef!: ElementRef<HTMLCanvasElement>;
  chartInstance: Chart | null = null;
  rutasChartInstance: Chart | null = null;

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  ngAfterViewInit(): void {
    // El gráfico se inicializará cuando los datos estén disponibles
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    if (this.rutasChartInstance) {
      this.rutasChartInstance.destroy();
    }
  }

  cargarEstadisticas(): void {
    this.cargando.set(true);
    this.error.set(null);
    
    this.dashboardService.getEstadisticas().subscribe({
      next: (data) => {
        this.estadisticas.set(data);
        this.cargando.set(false);
        // Pequeño timeout para permitir que el view se renderice y el canvas exista
        setTimeout(() => {
          this.inicializarGraficoModalidad(data);
          this.inicializarGraficoRutas(data);
        }, 100);
      },
      error: (err) => {
        console.error('Error cargando estadísticas', err);
        this.error.set('No se pudieron cargar las estadísticas. Por favor, intente de nuevo.');
        this.cargando.set(false);
      }
    });
  }

  generarReporte(): void {
    this.generandoReporte.set(true);
    this.reporteUrl.set(null);
    this.reporteError.set(null);

    this.dashboardService.generarReporte().subscribe({
      next: (res) => {
        if (res.success) {
          this.reporteUrl.set(res.url);
        } else {
          this.reporteError.set('Error en la respuesta al generar el reporte.');
        }
        this.generandoReporte.set(false);
      },
      error: (err) => {
        console.error('Error generando reporte', err);
        this.reporteError.set('No se pudo generar el reporte. ' + (err.error?.detail || err.message));
        this.generandoReporte.set(false);
      }
    });
  }

  private inicializarGraficoModalidad(data: DashboardEstadisticas): void {
    if (!this.modalidadChartRef || !this.modalidadChartRef.nativeElement) return;
    
    const ctx = this.modalidadChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    
    const labels = data.empresasPorModalidad.map(e => e.modalidad);
    const valores = data.empresasPorModalidad.map(e => e.total);
    
    // Paleta de colores vibrantes y modernos
    const backgroundColors = [
      'rgba(59, 130, 246, 0.8)', // blue-500
      'rgba(16, 185, 129, 0.8)', // emerald-500
      'rgba(139, 92, 246, 0.8)', // violet-500
      'rgba(245, 158, 11, 0.8)', // amber-500
      'rgba(239, 68, 68, 0.8)',  // red-500
      'rgba(14, 165, 233, 0.8)', // sky-500
      'rgba(244, 63, 94, 0.8)'   // rose-500
    ];
    
    const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));
    
    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: valores,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { family: "'Inter', sans-serif" },
              color: '#4b5563' // text-gray-600
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)', // gray-900
            padding: 12,
            titleFont: { size: 14, family: "'Inter', sans-serif" },
            bodyFont: { size: 13, family: "'Inter', sans-serif" },
            cornerRadius: 8,
          }
        },
        cutout: '70%' // Hace el anillo más delgado para un look más moderno
      }
    });
  }

  private inicializarGraficoRutas(data: DashboardEstadisticas): void {
    if (!this.rutasChartRef || !this.rutasChartRef.nativeElement) return;
    
    const ctx = this.rutasChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    if (this.rutasChartInstance) {
      this.rutasChartInstance.destroy();
    }
    
    const labels = data.rutasConMasEmpresas.map(r => r.nombre);
    const valores = data.rutasConMasEmpresas.map(r => r.totalEmpresas);
    
    // Paleta de colores cálidos y diferentes para rutas
    const backgroundColors = [
      'rgba(249, 115, 22, 0.8)', // orange-500
      'rgba(20, 184, 166, 0.8)', // teal-500
      'rgba(168, 85, 247, 0.8)', // purple-500
      'rgba(236, 72, 153, 0.8)', // pink-500
      'rgba(99, 102, 241, 0.8)', // indigo-500
      'rgba(132, 204, 22, 0.8)', // lime-500
      'rgba(234, 179, 8, 0.8)'   // yellow-500
    ];
    
    const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));
    
    this.rutasChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Empresas Autorizadas',
          data: valores,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // Hace las barras horizontales para que los nombres de ruta quepan mejor
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            padding: 12,
            titleFont: { size: 12, family: "'Inter', sans-serif" },
            bodyFont: { size: 13, family: "'Inter', sans-serif" },
            cornerRadius: 8,
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 } // Solo enteros para número de empresas
          },
          y: {
            ticks: {
              callback: function(value, index) {
                // Truncar textos muy largos
                const label = this.getLabelForValue(index as number);
                return label.length > 25 ? label.substring(0, 25) + '...' : label;
              }
            }
          }
        }
      }
    });
  }
}
