import { Component, inject, signal, computed, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RutaService } from '../../services/ruta.service';
import { LocalidadService } from '../../services/localidad.service';

interface ProvinciaDelimitacion {
  nombre: string;
  coordenadas: [number, number][];
  centro: [number, number];
  color: string;
}

interface RutaHeatmap {
  origen: string;
  destino: string;
  cantidad: number;
  coordenadas: [number, number];
}

@Component({
  selector: 'app-mapa-rutas-avanzado',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="mapa-container">
      <mat-card class="mapa-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>map</mat-icon>
            Mapa de Rutas - Departamento de Puno
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Filtros -->
          <div class="filtros-section">
            <mat-form-field appearance="outline">
              <mat-label>Filtrar por Origen</mat-label>
              <mat-select [(value)]="origenSeleccionado" (selectionChange)="aplicarFiltros()">
                <mat-option value="">Todas las localidades</mat-option>
                @for (localidad of localidadesOrigen(); track localidad) {
                  <mat-option [value]="localidad">{{ localidad }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Filtrar por Destino</mat-label>
              <mat-select [(value)]="destinoSeleccionado" (selectionChange)="aplicarFiltros()">
                <mat-option value="">Todas las localidades</mat-option>
                @for (localidad of localidadesDestino(); track localidad) {
                  <mat-option [value]="localidad">{{ localidad }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tipo de Vista</mat-label>
              <mat-select [(value)]="tipoVista" (selectionChange)="cambiarVista()">
                <mat-option value="provincias">Delimitación de Provincias</mat-option>
                <mat-option value="heatmap">Mapa de Calor</mat-option>
                <mat-option value="rutas">Rutas Individuales</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Estadísticas -->
          <div class="estadisticas-section">
            <mat-chip-set>
              <mat-chip>
                <mat-icon>route</mat-icon>
                Total Rutas: {{ totalRutas() }}
              </mat-chip>
              <mat-chip>
                <mat-icon>location_on</mat-icon>
                Provincias: {{ provinciasActivas() }}
              </mat-chip>
              <mat-chip>
                <mat-icon>trending_up</mat-icon>
                Ruta más transitada: {{ rutaMasTransitada() }}
              </mat-chip>
            </mat-chip-set>
          </div>

          <!-- Canvas del Mapa -->
          @if (isLoading()) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Cargando mapa...</p>
            </div>
          } @else {
            <div class="mapa-canvas-container">
              <canvas #mapaCanvas 
                      width="1200" 
                      height="800"
                      (click)="onMapClick($event)"
                      (mousemove)="onMapHover($event)">
              </canvas>
              
              <!-- Leyenda -->
              <div class="leyenda">
                @if (tipoVista === 'heatmap') {
                  <h4>Intensidad de Rutas</h4>
                  <div class="leyenda-item">
                    <div class="color-box" style="background: rgba(255, 0, 0, 0.8)"></div>
                    <span>Alta (>10 rutas)</span>
                  </div>
                  <div class="leyenda-item">
                    <div class="color-box" style="background: rgba(255, 165, 0, 0.6)"></div>
                    <span>Media (5-10 rutas)</span>
                  </div>
                  <div class="leyenda-item">
                    <div class="color-box" style="background: rgba(255, 255, 0, 0.4)"></div>
                    <span>Baja (1-5 rutas)</span>
                  </div>
                } @else if (tipoVista === 'provincias') {
                  <h4>Provincias de Puno</h4>
                  @for (provincia of provincias; track provincia.nombre) {
                    <div class="leyenda-item">
                      <div class="color-box" [style.background]="provincia.color"></div>
                      <span>{{ provincia.nombre }}</span>
                    </div>
                  }
                }
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .mapa-container {
      padding: 24px;
    }

    .mapa-card {
      max-width: 1400px;
      margin: 0 auto;
    }

    mat-card-header {
      margin-bottom: 24px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
    }

    .filtros-section {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .filtros-section mat-form-field {
      flex: 1;
      min-width: 200px;
    }

    .estadisticas-section {
      margin-bottom: 24px;
    }

    mat-chip-set {
      display: flex;
      gap: 12px;
    }

    mat-chip {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .mapa-canvas-container {
      position: relative;
      background: #f5f5f5;
      border-radius: 8px;
      overflow: hidden;
    }

    canvas {
      display: block;
      width: 100%;
      height: auto;
      cursor: crosshair;
    }

    .leyenda {
      position: absolute;
      top: 16px;
      right: 16px;
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      min-width: 200px;
    }

    .leyenda h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
    }

    .leyenda-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .color-box {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
  `]
})
export class MapaRutasAvanzadoComponent implements OnInit {
  @ViewChild('mapaCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private rutaService = inject(RutaService);
  private localidadService = inject(LocalidadService);
  
  // Signals
  isLoading = signal(false);
  rutas = signal<any[]>([]);
  rutasFiltradas = signal<any[]>([]);
  localidadesOrigen = signal<string[]>([]);
  localidadesDestino = signal<string[]>([]);
  
  // Filtros
  origenSeleccionado = '';
  destinoSeleccionado = '';
  tipoVista: 'provincias' | 'heatmap' | 'rutas' = 'provincias';
  
  // Computed
  totalRutas = computed(() => this.rutasFiltradas().length);
  provinciasActivas = computed(() => {
    const provincias = new Set(this.rutasFiltradas().map(r => r.origen?.split(',')[0]?.trim()));
    return provincias.size;
  });
  rutaMasTransitada = computed(() => {
    const rutas = this.rutasFiltradas();
    if (rutas.length === 0) return 'N/A';
    // Agrupar por origen-destino
    const conteo: { [key: string]: number } = {};
    rutas.forEach(r => {
      const key = `${r.origen} - ${r.destino}`;
      conteo[key] = (conteo[key] || 0) + 1;
    });
    const max = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
    return max ? `${max[0]} (${max[1]})` : 'N/A';
  });

  // Delimitaciones de provincias de Puno (coordenadas aproximadas)
  provincias: ProvinciaDelimitacion[] = [
    {
      nombre: 'Puno',
      centro: [-15.8402, -70.0219],
      coordenadas: [
        [-15.7, -70.2], [-15.7, -69.8], [-15.9, -69.8], [-15.9, -70.2]
      ],
      color: 'rgba(33, 150, 243, 0.3)'
    },
    {
      nombre: 'Azángaro',
      centro: [-14.9057, -70.1927],
      coordenadas: [
        [-14.7, -70.4], [-14.7, -70.0], [-15.1, -70.0], [-15.1, -70.4]
      ],
      color: 'rgba(76, 175, 80, 0.3)'
    },
    {
      nombre: 'Chucuito',
      centro: [-16.2667, -69.1333],
      coordenadas: [
        [-16.1, -69.3], [-16.1, -68.9], [-16.4, -68.9], [-16.4, -69.3]
      ],
      color: 'rgba(255, 152, 0, 0.3)'
    },
    {
      nombre: 'Yunguyo',
      centro: [-16.2500, -69.0833],
      coordenadas: [
        [-16.1, -69.2], [-16.1, -68.9], [-16.4, -68.9], [-16.4, -69.2]
      ],
      color: 'rgba(156, 39, 176, 0.3)'
    },
    {
      nombre: 'San Román (Juliaca)',
      centro: [-15.5000, -70.1333],
      coordenadas: [
        [-15.4, -70.3], [-15.4, -69.9], [-15.6, -69.9], [-15.6, -70.3]
      ],
      color: 'rgba(244, 67, 54, 0.3)'
    }
  ];

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Cargar rutas
      this.rutaService.getRutas().subscribe({
        next: (rutas) => {
          this.rutas.set(rutas);
          this.rutasFiltradas.set(rutas);
          
          // Extraer localidades únicas
          const origenes = new Set(rutas.map(r => r.origen).filter(Boolean));
          const destinos = new Set(rutas.map(r => r.destino).filter(Boolean));
          
          this.localidadesOrigen.set(Array.from(origenes).sort());
          this.localidadesDestino.set(Array.from(destinos).sort());
          
          // Dibujar mapa inicial
          setTimeout(() => this.dibujarMapa(), 100);
        },
        error: (error) => {
          console.error('Error cargando rutas:', error);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoading.set(false);
    }
  }

  aplicarFiltros(): void {
    let rutasFiltradas = this.rutas();
    
    if (this.origenSeleccionado) {
      rutasFiltradas = rutasFiltradas.filter(r => r.origen === this.origenSeleccionado);
    }
    
    if (this.destinoSeleccionado) {
      rutasFiltradas = rutasFiltradas.filter(r => r.destino === this.destinoSeleccionado);
    }
    
    this.rutasFiltradas.set(rutasFiltradas);
    this.dibujarMapa();
  }

  cambiarVista(): void {
    this.dibujarMapa();
  }

  dibujarMapa(): void {
    if (!this.canvasRef) return;
    
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar según el tipo de vista
    switch (this.tipoVista) {
      case 'provincias':
        this.dibujarProvincias(ctx, canvas);
        break;
      case 'heatmap':
        this.dibujarHeatmap(ctx, canvas);
        break;
      case 'rutas':
        this.dibujarRutasIndividuales(ctx, canvas);
        break;
    }
  }

  private dibujarProvincias(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Dibujar delimitaciones de provincias
    this.provincias.forEach(provincia => {
      ctx.beginPath();
      ctx.fillStyle = provincia.color;
      ctx.strokeStyle = '#1976d2';
      ctx.lineWidth = 2;
      
      // Convertir coordenadas geográficas a píxeles del canvas
      const coords = provincia.coordenadas.map(c => this.geoToPixel(c, canvas));
      
      ctx.moveTo(coords[0][0], coords[0][1]);
      coords.forEach(coord => {
        ctx.lineTo(coord[0], coord[1]);
      });
      ctx.closePath();
      
      ctx.fill();
      ctx.stroke();
      
      // Dibujar nombre de la provincia
      const centro = this.geoToPixel(provincia.centro, canvas);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(provincia.nombre, centro[0], centro[1]);
    });
    
    // Dibujar rutas sobre las provincias
    this.dibujarRutasSimples(ctx, canvas);
  }

  private dibujarHeatmap(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Calcular intensidad de rutas por localidad
    const intensidad: { [key: string]: number } = {};
    
    this.rutasFiltradas().forEach(ruta => {
      const origen = ruta.origen || '';
      const destino = ruta.destino || '';
      
      intensidad[origen] = (intensidad[origen] || 0) + 1;
      intensidad[destino] = (intensidad[destino] || 0) + 1;
    });
    
    // Encontrar máximo para normalizar
    const maxIntensidad = Math.max(...Object.values(intensidad), 1);
    
    // Dibujar círculos de calor
    Object.entries(intensidad).forEach(([localidad, cantidad]) => {
      const coords = this.obtenerCoordenadas(localidad);
      if (!coords) return;
      
      const pixel = this.geoToPixel(coords, canvas);
      const radio = 30 + (cantidad / maxIntensidad) * 50;
      const alpha = 0.3 + (cantidad / maxIntensidad) * 0.5;
      
      // Gradiente radial para efecto de calor
      const gradient = ctx.createRadialGradient(pixel[0], pixel[1], 0, pixel[0], pixel[1], radio);
      
      if (cantidad > 10) {
        gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      } else if (cantidad > 5) {
        gradient.addColorStop(0, `rgba(255, 165, 0, ${alpha})`);
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
      } else {
        gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha})`);
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      }
      
      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(pixel[0], pixel[1], radio, 0, Math.PI * 2);
      ctx.fill();
      
      // Etiqueta con cantidad
      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${cantidad}`, pixel[0], pixel[1] + 4);
    });
  }

  private dibujarRutasIndividuales(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    this.rutasFiltradas().forEach((ruta, index) => {
      const origenCoords = this.obtenerCoordenadas(ruta.origen);
      const destinoCoords = this.obtenerCoordenadas(ruta.destino);
      
      if (!origenCoords || !destinoCoords) return;
      
      const origen = this.geoToPixel(origenCoords, canvas);
      const destino = this.geoToPixel(destinoCoords, canvas);
      
      // Línea de ruta
      ctx.beginPath();
      ctx.strokeStyle = `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
      ctx.lineWidth = 2;
      ctx.moveTo(origen[0], origen[1]);
      ctx.lineTo(destino[0], destino[1]);
      ctx.stroke();
      
      // Puntos de origen y destino
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.arc(origen[0], origen[1], 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#f44336';
      ctx.beginPath();
      ctx.arc(destino[0], destino[1], 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private dibujarRutasSimples(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    this.rutasFiltradas().forEach(ruta => {
      const origenCoords = this.obtenerCoordenadas(ruta.origen);
      const destinoCoords = this.obtenerCoordenadas(ruta.destino);
      
      if (!origenCoords || !destinoCoords) return;
      
      const origen = this.geoToPixel(origenCoords, canvas);
      const destino = this.geoToPixel(destinoCoords, canvas);
      
      // Línea de ruta
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(244, 67, 54, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(origen[0], origen[1]);
      ctx.lineTo(destino[0], destino[1]);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  private geoToPixel(coords: [number, number], canvas: HTMLCanvasElement): [number, number] {
    // Convertir coordenadas geográficas (lat, lon) a píxeles del canvas
    // Rango aproximado de Puno: lat [-17, -13], lon [-71, -68]
    const latMin = -17, latMax = -13;
    const lonMin = -71, lonMax = -68;
    
    const x = ((coords[1] - lonMin) / (lonMax - lonMin)) * canvas.width;
    const y = ((latMax - coords[0]) / (latMax - latMin)) * canvas.height;
    
    return [x, y];
  }

  private obtenerCoordenadas(localidad: string): [number, number] | null {
    // Coordenadas aproximadas de localidades principales de Puno
    const coordenadas: { [key: string]: [number, number] } = {
      'PUNO': [-15.8402, -70.0219],
      'JULIACA': [-15.5000, -70.1333],
      'YUNGUYO': [-16.2500, -69.0833],
      'DESAGUADERO': [-16.5667, -69.0333],
      'ILAVE': [-16.0833, -69.6333],
      'JULI': [-16.2167, -69.4667],
      'AZÁNGARO': [-14.9057, -70.1927],
      'AYAVIRI': [-14.8833, -70.5833],
      'LAMPA': [-15.3667, -70.3667],
      'HUANCANÉ': [-15.2000, -69.7667]
    };
    
    const key = localidad?.toUpperCase().trim();
    return coordenadas[key] || null;
  }

  onMapClick(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log('Click en mapa:', { x, y });
    // Aquí puedes agregar lógica para mostrar detalles al hacer click
  }

  onMapHover(event: MouseEvent): void {
    // Aquí puedes agregar lógica para mostrar tooltips al pasar el mouse
  }
}
