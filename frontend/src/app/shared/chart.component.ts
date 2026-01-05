import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Tipos para Chart.js
interface ChartData {
  labels: string[];
  datasets: any[];
}

interface ChartOptions {
  responsive?: boolean;
  plugins?: any;
  scales?: any;
  [key: string]: any;
}

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container" [style.height.px]="height">
      @if (error()) {
        <div class="chart-error">
          <p>Error al cargar el gráfico</p>
          <button (click)="retry()">Reintentar</button>
        </div>
      } @else if (loading()) {
        <div class="chart-loading">
          <div class="loading-spinner"></div>
          <p>Cargando gráfico...</p>
        </div>
      } @else {
        <canvas #chartCanvas></canvas>
      }
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    canvas {
      max-width: 100%;
      max-height: 100%;
    }

    .chart-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #666;
      text-align: center;
    }

    .chart-error button {
      padding: 8px 16px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .chart-error button:hover {
      background: #1565c0;
    }

    .chart-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #666;
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ChartComponent implements OnInit, OnDestroy {
  @Input() type: 'line' | 'bar' | 'pie' | 'doughnut' = 'line';
  @Input() data: ChartData | null = null;
  @Input() options: ChartOptions = {};
  @Input() height: number = 300;

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  // Señales para el estado
  loading = signal(true);
  error = signal(false);

  private chart: any = null;

  ngOnInit(): void {
    // Simular carga de Chart.js
    this.loadChart();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private async loadChart(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);

      // Simular carga de Chart.js (en un proyecto real, importarías Chart.js aquí)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simular creación del gráfico
      this.createChart();
      
      this.loading.set(false);
    } catch (err) {
      console.error('Error loading chart:', err);
      this.error.set(true);
      this.loading.set(false);
    }
  }

  private createChart(): void {
    if (!this.chartCanvas || !this.data) {
      return;
    }

    // En un proyecto real, aquí crearías el gráfico con Chart.js
    // Por ahora, simulamos con un canvas simple
    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Dibujar un gráfico simple como placeholder
      this.drawPlaceholderChart(ctx, canvas);
    }
  }

  private drawPlaceholderChart(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Configurar estilos
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    // Dibujar placeholder según el tipo
    switch (this.type) {
      case 'bar':
        this.drawBarPlaceholder(ctx, width, height);
        break;
      case 'line':
        this.drawLinePlaceholder(ctx, width, height);
        break;
      case 'pie':
      case 'doughnut':
        this.drawPiePlaceholder(ctx, width, height);
        break;
    }

    // Agregar texto
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Gráfico ${this.type.toUpperCase()}`, width / 2, height / 2 + 40);
    ctx.fillText('(Placeholder - Integrar Chart.js)', width / 2, height / 2 + 60);
  }

  private drawBarPlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const bars = 5;
    const barWidth = (width - 100) / bars;
    const maxHeight = height - 100;

    ctx.fillStyle = '#2196f3';
    
    for (let i = 0; i < bars; i++) {
      const barHeight = Math.random() * maxHeight * 0.8 + maxHeight * 0.2;
      const x = 50 + i * barWidth + barWidth * 0.1;
      const y = height - 50 - barHeight;
      
      ctx.fillRect(x, y, barWidth * 0.8, barHeight);
    }
  }

  private drawLinePlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const points = 8;
    const stepX = (width - 100) / (points - 1);
    const maxY = height - 100;

    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i < points; i++) {
      const x = 50 + i * stepX;
      const y = 50 + Math.random() * maxY * 0.8;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      // Dibujar puntos
      ctx.fillStyle = '#2196f3';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
    }

    ctx.stroke();
  }

  private drawPiePlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;
    const innerRadius = this.type === 'doughnut' ? radius * 0.5 : 0;

    const colors = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];
    const segments = [0.3, 0.25, 0.2, 0.15, 0.1];

    let currentAngle = -Math.PI / 2;

    segments.forEach((segment, index) => {
      const segmentAngle = segment * 2 * Math.PI;
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segmentAngle);
      
      if (innerRadius > 0) {
        ctx.arc(centerX, centerY, innerRadius, currentAngle + segmentAngle, currentAngle, true);
      } else {
        ctx.lineTo(centerX, centerY);
      }
      
      ctx.closePath();
      ctx.fill();
      
      currentAngle += segmentAngle;
    });
  }

  retry(): void {
    this.loadChart();
  }
}