import { Component, OnInit, AfterViewInit, OnDestroy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Ruta } from '../../models/ruta.model';
import { RutaService } from '../../services/ruta.service';

// Configurar iconos de Leaflet para que funcionen en Angular
// Esto soluciona el problema común de iconos faltantes
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

// Declarar tipos para MarkerClusterGroup
declare module 'leaflet' {
  function markerClusterGroup(options?: any): any;
}

@Component({
  selector: 'app-mapa-rutas',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  template: `
    <div class="pagina-mapa-wrapper">
      <!-- Header solo cuando es página independiente (sin @Input rutas) -->
      @if (modoStandalone) {
        <div class="pagina-header">
          <div class="header-info">
            <mat-icon>map</mat-icon>
            <div>
              <h2>Mapa de Rutas</h2>
              <p>Visualización geográfica del sistema de transporte</p>
            </div>
          </div>
          @if (cargandoRutas) {
            <div class="cargando-badge">
              <mat-spinner diameter="18"></mat-spinner>
              <span>Cargando rutas...</span>
            </div>
          }
        </div>
      }

      <div class="mapa-wrapper">
        <div id="leaflet-map" class="mapa-contenedor"></div>
      
      <!-- Panel de información flotante -->
      <div class="info-panel" *ngIf="estadisticas">
        <div class="info-header">
          <mat-icon>insights</mat-icon>
          <span>Estadísticas del Mapa</span>
        </div>
        <div class="info-content">
          <div class="stat-item">
            <span class="stat-label">Rutas visibles:</span>
            <span class="stat-value">{{ estadisticas.rutasVisibles }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Conexiones:</span>
            <span class="stat-value">{{ estadisticas.conexiones }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Paradas totales:</span>
            <span class="stat-value">{{ estadisticas.paradasTotales }}</span>
          </div>
        </div>
      </div>

      <!-- Controles de visualización -->
      <div class="controls-panel">
        <button 
          mat-icon-button 
          [class.active]="mostrarLineas"
          (click)="toggleLineas()"
          matTooltip="Mostrar/ocultar líneas de rutas"
          color="primary">
          <mat-icon>{{ mostrarLineas ? 'timeline' : 'show_chart' }}</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          [class.active]="usarClusters"
          (click)="toggleClusters()"
          matTooltip="Agrupar marcadores"
          color="primary">
          <mat-icon>{{ usarClusters ? 'blur_on' : 'blur_off' }}</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          [class.active]="mostrarItinerario"
          (click)="toggleItinerario()"
          matTooltip="Mostrar itinerario completo"
          color="primary">
          <mat-icon>{{ mostrarItinerario ? 'route' : 'alt_route' }}</mat-icon>
        </button>

        <button 
          mat-icon-button 
          (click)="animarRutas()"
          matTooltip="Animar rutas"
          color="accent">
          <mat-icon>animation</mat-icon>
        </button>
      </div>

      <!-- Botón fullscreen -->
      <button 
        mat-icon-button 
        class="fullscreen-btn"
        (click)="toggleFullscreen()"
        matTooltip="Pantalla completa"
        color="primary">
        <mat-icon>fullscreen</mat-icon>
      </button>
    </div>
    </div>
  `,
  styles: [`
    /* Modo página standalone */
    .pagina-mapa-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    .pagina-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      flex-shrink: 0;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-info mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .header-info h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .header-info p {
      margin: 2px 0 0 0;
      font-size: 12px;
      opacity: 0.85;
    }

    .cargando-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      opacity: 0.9;
    }

    .cargando-badge mat-spinner {
      filter: brightness(10);
    }

    /* Modo embebido: el mapa ocupa todo el host */
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .mapa-wrapper {
      position: relative;
      flex: 1;
      min-height: 0;
    }

    .mapa-contenedor {
      width: 100%;
      height: 100%;
      background: #f0f0f0;
    }

    /* Panel de información flotante */
    .info-panel {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 1000;
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 200px;
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.95);
      animation: slideIn 0.3s ease-out;
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

    .info-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-weight: 600;
      color: #1976d2;
    }

    .info-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .stat-item:last-child {
      border-bottom: none;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
    }

    .stat-value {
      font-size: 16px;
      font-weight: 600;
      color: #1976d2;
    }

    /* Controles de visualización */
    .controls-panel {
      position: absolute;
      top: 16px;
      right: 70px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: white;
      border-radius: 12px;
      padding: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
    }

    .controls-panel button {
      background: white !important;
      transition: all 0.3s ease;
    }

    .controls-panel button:hover {
      background: #f5f5f5 !important;
      transform: scale(1.1);
    }

    .controls-panel button.active {
      background: #e3f2fd !important;
      color: #1976d2 !important;
    }

    .controls-panel button.active mat-icon {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    .fullscreen-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 1000;
      background: white !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .fullscreen-btn:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transform: scale(1.05);
    }

    :host ::ng-deep .leaflet-container {
      background: white;
      font-family: inherit;
    }

    /* Estilos para popups personalizados */
    :host ::ng-deep .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    :host ::ng-deep .leaflet-popup-content {
      margin: 12px;
    }

    /* Estilos para clusters */
    :host ::ng-deep .marker-cluster {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    :host ::ng-deep .marker-cluster div {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      color: #333;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    :host ::ng-deep .marker-cluster-small {
      width: 40px !important;
      height: 40px !important;
    }

    :host ::ng-deep .marker-cluster-medium {
      width: 50px !important;
      height: 50px !important;
    }

    :host ::ng-deep .marker-cluster-large {
      width: 60px !important;
      height: 60px !important;
    }

    /* Animación para líneas de ruta — reservado para uso futuro */

    /* Marcadores pulsantes — aplicado via divIcon en JS */

    :host.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
    }

    :host.fullscreen .fullscreen-btn mat-icon {
      transform: rotate(180deg);
    }
  `]
})
export class MapaRutasComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() rutas: Ruta[] = [];

  public map: L.Map | null = null;
  private geoJsonLayers: L.GeoJSON[] = [];
  private lineasRutas: L.Polyline[] = [];
  private marcadores: L.Marker[] = [];
  private markerClusterGroup: any = null;
  private dialog = inject(MatDialog);
  private rutaService = inject(RutaService);

  // Control de inicialización
  public mapaInicializado = false;

  // true cuando se usa como página independiente (sin @Input rutas)
  modoStandalone = false;
  cargandoRutas = false;

  // Estados de visualización
  mostrarLineas = true;
  usarClusters = true;
  mostrarItinerario = true;

  // Estadísticas
  estadisticas = {
    rutasVisibles: 0,
    conexiones: 0,
    paradasTotales: 0
  };

  // Íconos personalizados
  private iconoOrigen = L.divIcon({
    html: `
      <div style="
        width: 24px; 
        height: 24px; 
        background: linear-gradient(135deg, #00d084 0%, #00aa66 100%);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">O</div>
    `,
    className: 'custom-marker marker-pulse',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  private iconoDestino = L.divIcon({
    html: `
      <div style="
        width: 24px; 
        height: 24px; 
        background: linear-gradient(135deg, #ff5252 0%, #d32f2f 100%);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">D</div>
    `,
    className: 'custom-marker marker-pulse',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  private iconoParada = (orden: number) => L.divIcon({
    html: `
      <div style="
        width: 20px; 
        height: 20px; 
        background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
      ">${orden}</div>
    `,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  ngOnInit() {
    // Si no se pasaron rutas por @Input, cargarlas del servicio (modo página)
    if (!this.rutas || this.rutas.length === 0) {
      this.modoStandalone = true;
      this.cargandoRutas = true;
      this.rutaService.getRutas().subscribe({
        next: (rutas) => {
          this.rutas = rutas;
          this.cargandoRutas = false;
          this.actualizarEstadisticas();
          // Si el mapa ya estaba inicializado, recargar los puntos
          if (this.map) {
            this.cargarPuntosRutas();
          }
        },
        error: (err) => {
          console.error('Error cargando rutas para el mapa:', err);
          this.cargandoRutas = false;
        }
      });
    } else {
      // Si ya tenemos rutas (modo embebido), actualizar estadísticas
      this.actualizarEstadisticas();
    }
  }

  ngAfterViewInit() {
    console.log('MapaRutasComponent - ngAfterViewInit');
    if (!this.mapaInicializado) {
      setTimeout(() => {
        this.inicializarMapa();
      }, 300);
    } else {
      console.log('⚠️ Mapa ya inicializado, saltando ngAfterViewInit');
    }
  }

  ngOnDestroy() {
    console.log('🧹 MapaRutasComponent - Limpiando en ngOnDestroy');
    this.limpiarCapas();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    
    // Limpiar el contenedor DOM también
    const container = document.getElementById('leaflet-map');
    if (container) {
      container.innerHTML = '';
      container.className = container.className.replace(/leaflet-[^\s]*/g, '');
      container.removeAttribute('style');
    }
    
    this.mapaInicializado = false;
  }

  private limpiarCapas() {
    // Limpiar líneas
    this.lineasRutas.forEach(linea => {
      if (this.map) {
        this.map.removeLayer(linea);
      }
    });
    this.lineasRutas = [];

    // Limpiar marcadores
    this.marcadores.forEach(marker => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.marcadores = [];

    // Limpiar cluster
    if (this.markerClusterGroup && this.map) {
      this.map.removeLayer(this.markerClusterGroup);
      this.markerClusterGroup = null;
    }

    // Limpiar GeoJSON
    this.geoJsonLayers.forEach(layer => {
      if (this.map) {
        this.map.removeLayer(layer);
      }
    });
    this.geoJsonLayers = [];
  }

  toggleFullscreen() {
    // Usar dynamic import para evitar dependencia circular
    import('./mapa-rutas-fullscreen.component').then(module => {
      this.dialog.open(module.MapaRutasFullscreenComponent, {
        data: this.rutas,
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        panelClass: 'fullscreen-dialog'
      });
    }).catch(error => {
      console.error('Error cargando componente fullscreen:', error);
    });
  }

  toggleLineas() {
    this.mostrarLineas = !this.mostrarLineas;
    if (this.mostrarLineas) {
      this.dibujarLineasRutas();
    } else {
      this.lineasRutas.forEach(linea => {
        if (this.map) {
          this.map.removeLayer(linea);
        }
      });
      this.lineasRutas = [];
    }
  }

  toggleClusters() {
    this.usarClusters = !this.usarClusters;
    this.cargarPuntosRutas();
  }

  toggleItinerario() {
    this.mostrarItinerario = !this.mostrarItinerario;
    this.cargarPuntosRutas();
  }

  animarRutas() {
    console.log('🎬 Iniciando animación de rutas...');
    
    // Animar las líneas con un efecto de dibujo
    this.lineasRutas.forEach((linea, index) => {
      setTimeout(() => {
        if (this.map && this.map.hasLayer(linea)) {
          // Efecto de "bounce"
          const originalWeight = linea.options.weight || 3;
          linea.setStyle({ weight: originalWeight * 2, opacity: 1 });
          
          setTimeout(() => {
            linea.setStyle({ weight: originalWeight, opacity: 0.7 });
          }, 200);
        }
      }, index * 50);
    });

    // Animar los marcadores
    this.marcadores.forEach((marker, index) => {
      setTimeout(() => {
        if (this.map && this.map.hasLayer(marker)) {
          marker.openPopup();
          setTimeout(() => marker.closePopup(), 500);
        }
      }, index * 30);
    });
  }

  public inicializarMapa() {
    try {
      console.log('🗺️ Iniciando inicializarMapa - mapaInicializado:', this.mapaInicializado);
      
      const container = document.getElementById('leaflet-map') as HTMLElement;

      if (!container) {
        console.error('Contenedor del mapa no encontrado');
        return;
      }

      if (container.offsetHeight === 0 || container.offsetWidth === 0) {
        console.warn('Contenedor sin dimensiones, reintentando...');
        setTimeout(() => this.inicializarMapa(), 200);
        return;
      }

      // Si ya está inicializado y funcionando, no reinicializar
      if (this.mapaInicializado && this.map) {
        console.log('✅ Mapa ya inicializado, saltando reinicialización');
        return;
      }

      // Si el mapa ya existe, removerlo primero
      if (this.map) {
        console.log('🧹 Limpiando mapa existente');
        try {
          this.map.remove();
        } catch (e) {
          console.warn('Error al remover mapa anterior:', e);
        }
        this.map = null;
        this.geoJsonLayers = [];
      }

      // Limpiar completamente el contenedor DOM para evitar conflictos de Leaflet
      container.innerHTML = '';
      
      // Remover cualquier clase o atributo que Leaflet haya agregado
      container.className = container.className.replace(/leaflet-[^\s]*/g, '');
      if (container.className.trim() === '') {
        container.className = 'mapa-contenedor'; // Restaurar clase original
      }
      
      // Remover todos los atributos que Leaflet pueda haber agregado
      const attributesToRemove = ['style', 'tabindex', 'data-leaflet-id'];
      attributesToRemove.forEach(attr => {
        if (container.hasAttribute(attr)) {
          container.removeAttribute(attr);
        }
      });

      // Limpiar la referencia interna de Leaflet del contenedor
      (container as any)._leaflet_id = null;
      delete (container as any)._leaflet_id;
      
      console.log('🗺️ Creando nueva instancia del mapa Leaflet');

      this.map = L.map(container).setView([-15.5, -70.1], 8);
      this.mapaInicializado = true;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap',
        maxZoom: 19
      }).addTo(this.map);

      this.cargarPoligonos();

      // En modo standalone, esperar a que las rutas estén cargadas
      if (this.modoStandalone && this.cargandoRutas) {
        console.log('⏳ Mapa inicializado, esperando rutas...');
        // Las rutas se cargarán automáticamente cuando lleguen del servicio
      } else if (this.rutas && this.rutas.length > 0) {
        // En modo embebido o cuando ya tenemos rutas, cargar inmediatamente
        this.cargarPuntosRutas();
      }

      // Actualizar estadísticas
      this.actualizarEstadisticas();

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

    } catch (error) {
      console.error('Error inicializando mapa:', error);
      this.mapaInicializado = false;
    }
  }

  private cargarPoligonos() {
    if (!this.map) return;

    // Cargar provincias
    fetch('assets/geojson/puno-provincias-point.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!this.map) return;
        
        const geoJsonLayer = L.geoJSON(data, {
          style: {
            color: '#3388ff',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.1
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties || {};
            const popupContent = `
              <div style="font-size: 12px;">
                <strong>${props.NOMBPROV || 'Provincia'}</strong><br>
                Código: ${props.CODPROV || 'N/A'}
              </div>
            `;
            layer.bindPopup(popupContent);
          }
        });
        geoJsonLayer.addTo(this.map);
        this.geoJsonLayers.push(geoJsonLayer);
        console.log('📍 Provincias cargadas');
      })
      .catch(error => {
        console.warn('Error cargando provincias (opcional):', error.message);
      });

    // Cargar distritos
    fetch('assets/geojson/puno-distritos-point.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!this.map) return;
        
        const geoJsonLayer = L.geoJSON(data, {
          style: {
            color: '#ff7800',
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.05
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties || {};
            const popupContent = `
              <div style="font-size: 12px;">
                <strong>${props.NOMBDIST || 'Distrito'}</strong><br>
                Provincia: ${props.NOMBPROV || 'N/A'}<br>
                Código: ${props.CODDIST || 'N/A'}
              </div>
            `;
            layer.bindPopup(popupContent);
          }
        });
        geoJsonLayer.addTo(this.map);
        this.geoJsonLayers.push(geoJsonLayer);
        console.log('🗺️ Distritos cargados');
      })
      .catch(error => {
        console.warn('Error cargando distritos (opcional):', error.message);
      });

    // Solo cargar puntos de rutas si ya tenemos rutas disponibles
    if (this.rutas && this.rutas.length > 0 && !this.cargandoRutas) {
      console.log('📍 Cargando puntos de rutas desde cargarPoligonos');
      this.cargarPuntosRutas();
    } else if (this.modoStandalone) {
      console.log('⏳ Esperando rutas para cargar puntos...');
    }
  }

  public cargarPuntosRutas() {
    if (!this.map || !this.rutas || this.rutas.length === 0) {
      console.log('No hay rutas para mostrar');
      return;
    }

    console.log('🗺️ Cargando puntos de rutas con magia:', this.rutas.length);

    // Limpiar capas anteriores
    this.marcadores.forEach(m => {
      if (this.map) this.map.removeLayer(m);
    });
    this.marcadores = [];

    if (this.markerClusterGroup && this.map) {
      this.map.removeLayer(this.markerClusterGroup);
    }

    // Crear grupo de clusters si está habilitado
    if (this.usarClusters) {
      this.markerClusterGroup = (L as any).markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          const size = count > 50 ? 60 : count > 10 ? 50 : 40;
          return L.divIcon({
            html: `<div style="
              width:${size}px;height:${size}px;
              background:linear-gradient(135deg,#667eea,#764ba2);
              border:3px solid white;border-radius:50%;
              box-shadow:0 4px 12px rgba(0,0,0,0.3);
              display:flex;align-items:center;justify-content:center;
              color:white;font-weight:bold;font-size:${count>99?12:14}px;
            ">${count}</div>`,
            className: '',
            iconSize: L.point(size, size),
            iconAnchor: L.point(size / 2, size / 2)
          });
        }
      });
    }

    let rutasConCoordenadas = 0;
    let conexionesCreadas = 0;
    let paradasTotales = 0;

    // Un Set global para no duplicar marcadores en la misma coordenada
    const coordsUsadas = new Set<string>();
    const coordKey = (lat: number, lng: number) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

    this.rutas.forEach((ruta, index) => {
      let rutaTieneCoordenadas = false;
      const coordenadasRuta: L.LatLngExpression[] = [];

      // Marcador de origen (solo si la coordenada no fue usada antes)
      const latO = ruta.origen?.coordenadas?.latitud;
      const lngO = ruta.origen?.coordenadas?.longitud;
      if (latO != null && lngO != null && typeof latO === 'number' && typeof lngO === 'number' && !isNaN(latO) && !isNaN(lngO)) {
        const key = coordKey(latO, lngO);
        coordenadasRuta.push([latO, lngO]);
        rutaTieneCoordenadas = true;
        if (!coordsUsadas.has(key)) {
          coordsUsadas.add(key);
          try {
            const originMarker = L.marker([latO, lngO], { icon: this.iconoOrigen });
            originMarker.bindPopup(`
              <div style="font-family:'Roboto',sans-serif;">
                <div style="background:linear-gradient(135deg,#00d084,#00aa66);color:white;padding:8px;margin:-12px -12px 8px -12px;border-radius:12px 12px 0 0;font-weight:600;">🚀 ORIGEN</div>
                <div style="padding:4px 0;"><strong style="color:#00aa66;">${ruta.origen!.nombre}</strong></div>
                <div style="font-size:11px;color:#666;margin-top:4px;">
                  📍 Ruta: <strong>${ruta.codigoRuta}</strong><br>
                  🏢 Empresa: ${ruta.empresa?.razonSocial || 'N/A'}<br>
                  📊 Estado: ${ruta.estado || 'N/A'}
                </div>
              </div>
            `);
            this.agregarMarcador(originMarker);
          } catch (e) { console.error('Error al agregar origen:', e); }
        }
      }

      // Marcadores de itinerario (paradas intermedias)
      if (this.mostrarItinerario && ruta.itinerario && ruta.itinerario.length > 0) {
        ruta.itinerario.forEach((parada, orden) => {
          if (parada.coordenadas?.latitud && parada.coordenadas?.longitud &&
              typeof parada.coordenadas.latitud === 'number' && typeof parada.coordenadas.longitud === 'number' &&
              !isNaN(parada.coordenadas.latitud) && !isNaN(parada.coordenadas.longitud)) {
            const key = coordKey(parada.coordenadas.latitud, parada.coordenadas.longitud);
            coordenadasRuta.push([parada.coordenadas.latitud, parada.coordenadas.longitud]);
            paradasTotales++;
            if (!coordsUsadas.has(key)) {
              coordsUsadas.add(key);
              try {
                const itinerarioMarker = L.marker([parada.coordenadas.latitud, parada.coordenadas.longitud], { icon: this.iconoParada(orden + 1) });
                itinerarioMarker.bindPopup(`
                  <div style="font-family:'Roboto',sans-serif;">
                    <div style="background:linear-gradient(135deg,#ffa726,#fb8c00);color:white;padding:8px;margin:-12px -12px 8px -12px;border-radius:12px 12px 0 0;font-weight:600;">🛑 PARADA ${orden + 1}</div>
                    <div style="padding:4px 0;"><strong style="color:#fb8c00;">${parada.nombre}</strong></div>
                    <div style="font-size:11px;color:#666;margin-top:4px;">📍 Ruta: <strong>${ruta.codigoRuta}</strong></div>
                  </div>
                `);
                this.agregarMarcador(itinerarioMarker);
              } catch (e) { console.error('Error al agregar parada:', e); }
            }
          }
        });
      }

      // Marcador de destino (solo si la coordenada no fue usada antes)
      const latD = ruta.destino?.coordenadas?.latitud;
      const lngD = ruta.destino?.coordenadas?.longitud;
      if (latD != null && lngD != null && typeof latD === 'number' && typeof lngD === 'number' && !isNaN(latD) && !isNaN(lngD)) {
        const key = coordKey(latD, lngD);
        coordenadasRuta.push([latD, lngD]);
        rutaTieneCoordenadas = true;
        if (!coordsUsadas.has(key)) {
          coordsUsadas.add(key);
          try {
            const destMarker = L.marker([latD, lngD], { icon: this.iconoDestino });
            destMarker.bindPopup(`
              <div style="font-family:'Roboto',sans-serif;">
                <div style="background:linear-gradient(135deg,#ff5252,#d32f2f);color:white;padding:8px;margin:-12px -12px 8px -12px;border-radius:12px 12px 0 0;font-weight:600;">🏁 DESTINO</div>
                <div style="padding:4px 0;"><strong style="color:#d32f2f;">${ruta.destino!.nombre}</strong></div>
                <div style="font-size:11px;color:#666;margin-top:4px;">
                  📍 Ruta: <strong>${ruta.codigoRuta}</strong><br>
                  🏢 Empresa: ${ruta.empresa?.razonSocial || 'N/A'}<br>
                  📊 Estado: ${ruta.estado || 'N/A'}
                </div>
              </div>
            `);
            this.agregarMarcador(destMarker);
          } catch (e) { console.error('Error al agregar destino:', e); }
        }
      }

      if (rutaTieneCoordenadas) {
        rutasConCoordenadas++;
        if (this.mostrarLineas && coordenadasRuta.length >= 2) {
          this.dibujarLineaRuta(coordenadasRuta, ruta, index);
          conexionesCreadas++;
        }
      }
    });

    // Agregar el cluster al mapa si está habilitado
    if (this.usarClusters && this.markerClusterGroup && this.map) {
      this.map.addLayer(this.markerClusterGroup);
    }

    // Actualizar estadísticas
    this.estadisticas = {
      rutasVisibles: rutasConCoordenadas,
      conexiones: conexionesCreadas,
      paradasTotales: paradasTotales
    };

    console.log('📊 Resumen de visualización:');
    console.log(`  ✅ Rutas con coordenadas: ${rutasConCoordenadas}`);
    console.log(`  🔗 Conexiones dibujadas: ${conexionesCreadas}`);
    console.log(`  🛑 Paradas totales: ${paradasTotales}`);
    console.log(`  📍 Marcadores creados: ${this.marcadores.length}`);
  }

  private agregarMarcador(marker: L.Marker) {
    if (this.usarClusters && this.markerClusterGroup) {
      this.markerClusterGroup.addLayer(marker);
    } else if (this.map) {
      marker.addTo(this.map);
    }
    this.marcadores.push(marker);
  }

  private dibujarLineaRuta(coordenadas: L.LatLngExpression[], ruta: Ruta, index: number) {
    if (!this.map) return;

    // Generar color basado en el índice de la ruta
    const hue = (index * 137.5) % 360; // Golden angle para distribución uniforme de colores
    const color = `hsl(${hue}, 70%, 50%)`;

    const polyline = L.polyline(coordenadas, {
      color: color,
      weight: 3,
      opacity: 0.7,
      smoothFactor: 1,
      className: 'ruta-line'
    });

    // Agregar decoradores (flechas direccionales) solo si la función existe
    try {
      if ((L as any).polylineDecorator) {
        const decorator = (L as any).polylineDecorator(polyline, {
          patterns: [
            {
              offset: '5%',
              repeat: '10%',
              symbol: (L as any).Symbol.arrowHead({
                pixelSize: 8,
                pathOptions: {
                  fillOpacity: 1,
                  weight: 0,
                  color: color
                }
              })
            }
          ]
        });
        decorator.addTo(this.map);
        this.lineasRutas.push(decorator);
      }
    } catch (e) {
      console.warn('Decoradores no disponibles:', e);
    }

    polyline.bindPopup(`
      <div style="font-family: 'Roboto', sans-serif;">
        <div style="
          background: linear-gradient(135deg, ${color}, ${color});
          color: white;
          padding: 8px;
          margin: -12px -12px 8px -12px;
          border-radius: 12px 12px 0 0;
          font-weight: 600;
        ">
          🛣️ RUTA ${ruta.codigoRuta}
        </div>
        <div style="padding: 4px 0;">
          <div style="margin-bottom: 4px;">
            🚀 ${ruta.origen?.nombre || 'N/A'}
          </div>
          <div style="text-align: center; color: #999;">↓</div>
          <div>
            🏁 ${ruta.destino?.nombre || 'N/A'}
          </div>
        </div>
        <div style="font-size: 11px; color: #666; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
          🏢 ${ruta.empresa?.razonSocial || 'N/A'}<br>
          🛑 Paradas: ${coordenadas.length - 2}
        </div>
      </div>
    `);

    polyline.addTo(this.map);
    this.lineasRutas.push(polyline);
  }

  private dibujarLineasRutas() {
    // Limpiar líneas existentes
    this.lineasRutas.forEach(linea => {
      if (this.map) {
        this.map.removeLayer(linea);
      }
    });
    this.lineasRutas = [];

    // Redibujar las rutas
    this.cargarPuntosRutas();
  }

  private actualizarEstadisticas() {
    if (!this.rutas) {
      this.estadisticas = { rutasVisibles: 0, conexiones: 0, paradasTotales: 0 };
      return;
    }

    let rutasConCoordenadas = 0;
    let paradasTotales = 0;

    this.rutas.forEach(ruta => {
      // Verificar si la ruta tiene coordenadas válidas
      const tieneOrigen = ruta.origen?.coordenadas?.latitud && 
                         ruta.origen?.coordenadas?.longitud &&
                         !isNaN(ruta.origen.coordenadas.latitud) &&
                         !isNaN(ruta.origen.coordenadas.longitud);
                         
      const tieneDestino = ruta.destino?.coordenadas?.latitud && 
                          ruta.destino?.coordenadas?.longitud &&
                          !isNaN(ruta.destino.coordenadas.latitud) &&
                          !isNaN(ruta.destino.coordenadas.longitud);

      if (tieneOrigen || tieneDestino) {
        rutasConCoordenadas++;
      }

      // Contar paradas del itinerario
      if (ruta.itinerario) {
        paradasTotales += ruta.itinerario.filter((parada: any) => 
          parada.coordenadas?.latitud && 
          parada.coordenadas?.longitud &&
          !isNaN(parada.coordenadas.latitud) &&
          !isNaN(parada.coordenadas.longitud)
        ).length;
      }
    });

    this.estadisticas = {
      rutasVisibles: rutasConCoordenadas,
      conexiones: this.lineasRutas.length,
      paradasTotales: paradasTotales
    };
  }
}
