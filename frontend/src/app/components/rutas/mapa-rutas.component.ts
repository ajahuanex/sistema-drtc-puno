import { Component, OnInit, AfterViewInit, OnDestroy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Ruta } from '../../models/ruta.model';
import { MapaRutasFullscreenComponent } from './mapa-rutas-fullscreen.component';

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

// Declarar tipos para MarkerClusterGroup y PolylineDecorator
declare module 'leaflet' {
  function markerClusterGroup(options?: any): any;
  function polylineDecorator(line: any, options?: any): any;
  namespace Symbol {
    function arrowHead(options?: any): any;
  }
}

@Component({
  selector: 'app-mapa-rutas',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
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
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .mapa-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
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

    /* Animación para líneas de ruta */
    :host ::ng-deep .ruta-line {
      animation: dashAnimation 3s linear infinite;
    }

    @keyframes dashAnimation {
      to {
        stroke-dashoffset: -40;
      }
    }

    /* Marcadores pulsantes */
    :host ::ng-deep .marker-pulse {
      animation: markerPulse 2s ease-in-out infinite;
    }

    @keyframes markerPulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7);
      }
      50% {
        box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
      }
    }

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

  private map: L.Map | null = null;
  private geoJsonLayers: L.GeoJSON[] = [];
  private lineasRutas: L.Polyline[] = [];
  private marcadores: L.Marker[] = [];
  private markerClusterGroup: any = null;
  private dialog = inject(MatDialog);

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
    console.log('MapaRutasComponent - ngOnInit');
  }

  ngAfterViewInit() {
    console.log('MapaRutasComponent - ngAfterViewInit');
    setTimeout(() => {
      this.inicializarMapa();
    }, 300);
  }

  ngOnDestroy() {
    this.limpiarCapas();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
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
    this.dialog.open(MapaRutasFullscreenComponent, {
      data: this.rutas,
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'fullscreen-dialog'
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

  inicializarMapa() {
    try {
      const container = document.getElementById('leaflet-map') as HTMLElement;

      if (!container) {
        console.error('Contenedor no encontrado');
        return;
      }

      if (container.offsetHeight === 0 || container.offsetWidth === 0) {
        console.warn('Contenedor sin dimensiones, reintentando...');
        setTimeout(() => this.inicializarMapa(), 200);
        return;
      }

      // Si el mapa ya existe, removerlo primero
      if (this.map) {
        this.map.remove();
        this.map = null;
        this.geoJsonLayers = [];
      }

      this.map = L.map(container).setView([-15.5, -70.1], 8);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap',
        maxZoom: 19
      }).addTo(this.map);

      this.cargarPoligonos();

      // Actualizar estadísticas
      this.actualizarEstadisticas();

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

    } catch (error) {
      console.error('Error:', error);
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
        console.log('Provincias cargadas');
      })
      .catch(error => {
        console.warn('Error cargando provincias (esto es opcional):', error.message);
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
        console.log('Distritos cargados');
      })
      .catch(error => {
        console.warn('Error cargando distritos (esto es opcional):', error.message);
      });

    // Cargar puntos de las rutas
    this.cargarPuntosRutas();
  }

  private cargarPuntosRutas() {
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
          let size = 'small';
          if (count > 10) size = 'medium';
          if (count > 50) size = 'large';
          
          return L.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: `marker-cluster marker-cluster-${size}`,
            iconSize: L.point(40, 40)
          });
        }
      });
    }

    let rutasConCoordenadas = 0;
    let conexionesCreadas = 0;
    let paradasTotales = 0;

    this.rutas.forEach((ruta, index) => {
      let rutaTieneCoordenadas = false;
      const coordenadasRuta: L.LatLngExpression[] = [];
      // Set para evitar marcadores duplicados en la misma coordenada
      const coordsUsadas = new Set<string>();

      const coordKey = (lat: number, lng: number) =>
        `${lat.toFixed(5)},${lng.toFixed(5)}`;

      // Marcador de origen con icono personalizado
      if (ruta.origen?.coordenadas?.latitud && 
          ruta.origen?.coordenadas?.longitud &&
          typeof ruta.origen.coordenadas.latitud === 'number' &&
          typeof ruta.origen.coordenadas.longitud === 'number' &&
          !isNaN(ruta.origen.coordenadas.latitud) &&
          !isNaN(ruta.origen.coordenadas.longitud)) {
        const key = coordKey(ruta.origen.coordenadas.latitud, ruta.origen.coordenadas.longitud);
        coordsUsadas.add(key);
        try {
          const originMarker = L.marker(
            [ruta.origen.coordenadas.latitud, ruta.origen.coordenadas.longitud],
            { icon: this.iconoOrigen }
          );

          originMarker.bindPopup(`
            <div style="font-family: 'Roboto', sans-serif;">
              <div style="
                background: linear-gradient(135deg, #00d084 0%, #00aa66 100%);
                color: white;
                padding: 8px;
                margin: -12px -12px 8px -12px;
                border-radius: 12px 12px 0 0;
                font-weight: 600;
              ">
                🚀 ORIGEN
              </div>
              <div style="padding: 4px 0;">
                <strong style="color: #00aa66;">${ruta.origen.nombre}</strong>
              </div>
              <div style="font-size: 11px; color: #666; margin-top: 4px;">
                📍 Ruta: <strong>${ruta.codigoRuta}</strong><br>
                🏢 Empresa: ${ruta.empresa?.razonSocial || 'N/A'}<br>
                📊 Estado: ${ruta.estado || 'N/A'}
              </div>
            </div>
          `);

          this.agregarMarcador(originMarker);
          coordenadasRuta.push([ruta.origen.coordenadas.latitud, ruta.origen.coordenadas.longitud]);
          rutaTieneCoordenadas = true;
        } catch (e) {
          console.error('Error al agregar origen:', e);
        }
      }

      // Marcadores de itinerario (paradas intermedias)
      if (this.mostrarItinerario && ruta.itinerario && ruta.itinerario.length > 0) {
        ruta.itinerario.forEach((parada, orden) => {
          if (parada.coordenadas?.latitud && 
              parada.coordenadas?.longitud &&
              typeof parada.coordenadas.latitud === 'number' &&
              typeof parada.coordenadas.longitud === 'number' &&
              !isNaN(parada.coordenadas.latitud) &&
              !isNaN(parada.coordenadas.longitud)) {
            
            // Saltar si ya existe un marcador en esas coordenadas
            const key = coordKey(parada.coordenadas.latitud, parada.coordenadas.longitud);
            if (coordsUsadas.has(key)) {
              return; // Es la misma posición que el origen o parada anterior
            }
            coordsUsadas.add(key);
            try {
              const itinerarioMarker = L.marker(
                [parada.coordenadas.latitud, parada.coordenadas.longitud],
                { icon: this.iconoParada(orden + 1) }
              );

              itinerarioMarker.bindPopup(`
                <div style="font-family: 'Roboto', sans-serif;">
                  <div style="
                    background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);
                    color: white;
                    padding: 8px;
                    margin: -12px -12px 8px -12px;
                    border-radius: 12px 12px 0 0;
                    font-weight: 600;
                  ">
                    🛑 PARADA ${orden + 1}
                  </div>
                  <div style="padding: 4px 0;">
                    <strong style="color: #fb8c00;">${parada.nombre}</strong>
                  </div>
                  <div style="font-size: 11px; color: #666; margin-top: 4px;">
                    📍 Ruta: <strong>${ruta.codigoRuta}</strong>
                  </div>
                </div>
              `);

              this.agregarMarcador(itinerarioMarker);
              coordenadasRuta.push([parada.coordenadas.latitud, parada.coordenadas.longitud]);
              paradasTotales++;
            } catch (e) {
              console.error('Error al agregar parada:', e);
            }
          }
        });
      }

      // Marcador de destino con icono personalizado
      if (ruta.destino?.coordenadas?.latitud && 
          ruta.destino?.coordenadas?.longitud &&
          typeof ruta.destino.coordenadas.latitud === 'number' &&
          typeof ruta.destino.coordenadas.longitud === 'number' &&
          !isNaN(ruta.destino.coordenadas.latitud) &&
          !isNaN(ruta.destino.coordenadas.longitud)) {
        
        const keyDest = coordKey(ruta.destino.coordenadas.latitud, ruta.destino.coordenadas.longitud);
        if (!coordsUsadas.has(keyDest)) {
          coordsUsadas.add(keyDest);
          try {
            const destMarker = L.marker(
              [ruta.destino.coordenadas.latitud, ruta.destino.coordenadas.longitud],
              { icon: this.iconoDestino }
            );

            destMarker.bindPopup(`
              <div style="font-family: 'Roboto', sans-serif;">
                <div style="
                  background: linear-gradient(135deg, #ff5252 0%, #d32f2f 100%);
                  color: white;
                  padding: 8px;
                  margin: -12px -12px 8px -12px;
                  border-radius: 12px 12px 0 0;
                  font-weight: 600;
                ">
                  🏁 DESTINO
                </div>
                <div style="padding: 4px 0;">
                  <strong style="color: #d32f2f;">${ruta.destino.nombre}</strong>
                </div>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">
                  📍 Ruta: <strong>${ruta.codigoRuta}</strong><br>
                  🏢 Empresa: ${ruta.empresa?.razonSocial || 'N/A'}<br>
                  📊 Estado: ${ruta.estado || 'N/A'}
                </div>
              </div>
            `);

            this.agregarMarcador(destMarker);
            coordenadasRuta.push([ruta.destino.coordenadas.latitud, ruta.destino.coordenadas.longitud]);
            rutaTieneCoordenadas = true;
          } catch (e) {
            console.error('Error al agregar destino:', e);
          }
        }
      }

      if (rutaTieneCoordenadas) {
        rutasConCoordenadas++;
        
        // Dibujar línea de la ruta si está habilitado y hay al menos 2 puntos
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
      if ((ruta.origen?.coordenadas?.latitud && ruta.origen?.coordenadas?.longitud) ||
          (ruta.destino?.coordenadas?.latitud && ruta.destino?.coordenadas?.longitud)) {
        rutasConCoordenadas++;
      }
      if (ruta.itinerario) {
        paradasTotales += ruta.itinerario.filter(p => 
          p.coordenadas?.latitud && p.coordenadas?.longitud
        ).length;
      }
    });

    this.estadisticas = {
      rutasVisibles: rutasConCoordenadas,
      conexiones: rutasConCoordenadas,
      paradasTotales: paradasTotales
    };
  }
}
