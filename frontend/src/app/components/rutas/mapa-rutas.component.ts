import { Component, OnInit, AfterViewInit, OnDestroy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import * as L from 'leaflet';
import { Ruta } from '../../models/ruta.model';
import { MapaRutasFullscreenComponent } from './mapa-rutas-fullscreen.component';

@Component({
  selector: 'app-mapa-rutas',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="mapa-wrapper">
      <div id="leaflet-map" class="mapa-contenedor"></div>
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
    }

    :host ::ng-deep .leaflet-container {
      background: white;
      font-family: inherit;
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
  private dialog = inject(MatDialog);

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
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
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
    fetch('assets/geojson/puno-provincias.geojson')
      .then(response => response.json())
      .then(data => {
        const geoJsonLayer = L.geoJSON(data, {
          style: {
            color: '#3388ff',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.1
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const popupContent = `
              <div style="font-size: 12px;">
                <strong>${props.NOMBPROV || 'Provincia'}</strong><br>
                Código: ${props.CODPROV || 'N/A'}
              </div>
            `;
            layer.bindPopup(popupContent);
          }
        });
        geoJsonLayer.addTo(this.map!);
        this.geoJsonLayers.push(geoJsonLayer);
        console.log('Provincias cargadas');
      })
      .catch(error => console.error('Error cargando provincias:', error));

    // Cargar distritos
    fetch('assets/geojson/puno-distritos.geojson')
      .then(response => response.json())
      .then(data => {
        const geoJsonLayer = L.geoJSON(data, {
          style: {
            color: '#ff7800',
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.05
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties;
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
        geoJsonLayer.addTo(this.map!);
        this.geoJsonLayers.push(geoJsonLayer);
        console.log('Distritos cargados');
      })
      .catch(error => console.error('Error cargando distritos:', error));

    // Cargar puntos de las rutas
    this.cargarPuntosRutas();
  }

  private cargarPuntosRutas() {
    if (!this.map || !this.rutas || this.rutas.length === 0) {
      console.log('No hay rutas para mostrar');
      return;
    }

    console.log('Cargando puntos de rutas:', this.rutas.length);

    this.rutas.forEach((ruta, index) => {
      // Marcador de origen
      if (ruta.origen?.coordenadas) {
        const originMarker = L.circleMarker(
          [ruta.origen.coordenadas.latitud, ruta.origen.coordenadas.longitud],
          {
            radius: 6,
            fillColor: '#00aa00',
            color: '#006600',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }
        );
        originMarker.bindPopup(`
          <div style="font-size: 12px;">
            <strong>Origen: ${ruta.origen.nombre}</strong><br>
            Ruta: ${ruta.codigoRuta}
          </div>
        `);
        originMarker.addTo(this.map!);
      }

      // Marcador de destino
      if (ruta.destino?.coordenadas) {
        const destMarker = L.circleMarker(
          [ruta.destino.coordenadas.latitud, ruta.destino.coordenadas.longitud],
          {
            radius: 6,
            fillColor: '#ff0000',
            color: '#990000',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }
        );
        destMarker.bindPopup(`
          <div style="font-size: 12px;">
            <strong>Destino: ${ruta.destino.nombre}</strong><br>
            Ruta: ${ruta.codigoRuta}
          </div>
        `);
        destMarker.addTo(this.map!);
      }

      // Marcadores de itinerario
      if (ruta.itinerario && ruta.itinerario.length > 0) {
        ruta.itinerario.forEach((parada, orden) => {
          if (parada.coordenadas) {
            const itinerarioMarker = L.circleMarker(
              [parada.coordenadas.latitud, parada.coordenadas.longitud],
              {
                radius: 4,
                fillColor: '#ffaa00',
                color: '#ff8800',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.7
              }
            );
            itinerarioMarker.bindPopup(`
              <div style="font-size: 12px;">
                <strong>Parada ${orden + 1}: ${parada.nombre}</strong><br>
                Ruta: ${ruta.codigoRuta}
              </div>
            `);
            itinerarioMarker.addTo(this.map!);
          }
        });
      }

      // Línea conectando origen, itinerario y destino
      const puntos: L.LatLngExpression[] = [];

      if (ruta.origen?.coordenadas) {
        puntos.push([ruta.origen.coordenadas.latitud, ruta.origen.coordenadas.longitud]);
      }

      if (ruta.itinerario && ruta.itinerario.length > 0) {
        ruta.itinerario.forEach(parada => {
          if (parada.coordenadas) {
            puntos.push([parada.coordenadas.latitud, parada.coordenadas.longitud]);
          }
        });
      }

      if (ruta.destino?.coordenadas) {
        puntos.push([ruta.destino.coordenadas.latitud, ruta.destino.coordenadas.longitud]);
      }

      if (puntos.length > 1) {
        const polyline = L.polyline(puntos, {
          color: '#667eea',
          weight: 2,
          opacity: 0.6,
          dashArray: '5, 5'
        });
        polyline.bindPopup(`Ruta: ${ruta.codigoRuta}`);
        polyline.addTo(this.map!);
      }
    });

    console.log('Puntos de rutas cargados');
  }
}
