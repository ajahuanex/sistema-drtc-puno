import { Component, OnInit, AfterViewInit, OnDestroy, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Ruta } from '../../models/ruta.model';

@Component({
  selector: 'app-mapa-rutas-fullscreen',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule, 
    MatDialogModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <div class="fullscreen-mapa-container">
      <div class="mapa-header">
        <h2>Mapa de Rutas - Pantalla Completa</h2>
        <button 
          mat-icon-button 
          (click)="cerrar()"
          matTooltip="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="mapa-content">
        <div class="mapa-sidebar">
          <div class="sidebar-section">
            <h3>Capas</h3>
            <div class="layer-option">
              <mat-checkbox 
                [(ngModel)]="mostrarProvincias"
                (change)="actualizarCapas()">
                Provincias
              </mat-checkbox>
            </div>
            <div class="layer-option">
              <mat-checkbox 
                [(ngModel)]="mostrarDistritos"
                (change)="actualizarCapas()">
                Distritos
              </mat-checkbox>
            </div>
            <div class="layer-option">
              <mat-checkbox 
                [(ngModel)]="mostrarRutas"
                (change)="actualizarCapas()">
                Rutas
              </mat-checkbox>
            </div>
          </div>

          <div class="sidebar-section">
            <h3>Filtros de Rutas</h3>
            <div class="filter-option">
              <label>Estado:</label>
              <select [(ngModel)]="filtroEstado" (change)="aplicarFiltros()">
                <option value="">Todos</option>
                <option value="ACTIVA">Activa</option>
                <option value="INACTIVA">Inactiva</option>
                <option value="SUSPENDIDA">Suspendida</option>
              </select>
            </div>
            <div class="filter-option">
              <label>Tipo de Ruta:</label>
              <select [(ngModel)]="filtroTipo" (change)="aplicarFiltros()">
                <option value="">Todos</option>
                <option value="URBANA">Urbana</option>
                <option value="INTERURBANA">Interurbana</option>
                <option value="INTERPROVINCIAL">Interprovincial</option>
                <option value="INTERREGIONAL">Interregional</option>
                <option value="RURAL">Rural</option>
              </select>
            </div>
            <div class="filter-option">
              <label>Tipo de Servicio:</label>
              <select [(ngModel)]="filtroServicio" (change)="aplicarFiltros()">
                <option value="">Todos</option>
                <option value="PASAJEROS">Pasajeros</option>
                <option value="CARGA">Carga</option>
                <option value="MIXTO">Mixto</option>
              </select>
            </div>
          </div>

          <div class="sidebar-section">
            <h3>Información</h3>
            <div class="info-item">
              <span>Rutas mostradas:</span>
              <strong>{{ rutasFiltradas.length }}</strong>
            </div>
            <div class="info-item">
              <span>Total de rutas:</span>
              <strong>{{ rutas.length }}</strong>
            </div>
          </div>

          <div class="sidebar-section">
            <button mat-raised-button color="primary" (click)="limpiarFiltros()">
              Limpiar Filtros
            </button>
          </div>
        </div>
        <div id="leaflet-map-fullscreen" class="mapa-contenedor"></div>
      </div>
    </div>
  `,
  styles: [`
    .fullscreen-mapa-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: white;
    }

    .mapa-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom: 1px solid #e0e0e0;
    }

    .mapa-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .mapa-header button {
      color: white !important;
    }

    .mapa-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .mapa-sidebar {
      width: 300px;
      background: white;
      border-right: 1px solid #e0e0e0;
      overflow-y: auto;
      padding: 16px;
    }

    .sidebar-section {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .sidebar-section:last-child {
      border-bottom: none;
    }

    .sidebar-section h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;
    }

    .layer-option {
      margin-bottom: 8px;
    }

    .layer-option mat-checkbox {
      display: block;
    }

    .filter-option {
      margin-bottom: 12px;
    }

    .filter-option label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #4a5568;
      margin-bottom: 4px;
    }

    .filter-option select {
      width: 100%;
      padding: 8px;
      border: 1px solid #cbd5e0;
      border-radius: 4px;
      font-size: 12px;
      background: white;
      cursor: pointer;
    }

    .filter-option select:hover {
      border-color: #a0aec0;
    }

    .filter-option select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 8px;
      color: #4a5568;
    }

    .info-item strong {
      color: #2d3748;
      font-weight: 600;
    }

    .mapa-contenedor {
      flex: 1;
      width: 100%;
      background: #f0f0f0;
    }

    :host ::ng-deep .leaflet-container {
      background: white;
      font-family: inherit;
    }

    :host ::ng-deep mat-checkbox {
      font-size: 12px;
    }
  `]
})
export class MapaRutasFullscreenComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: L.Map | null = null;
  private geoJsonLayers: L.GeoJSON[] = [];
  private rutasMarkers: L.Layer[] = [];

  // Capas
  mostrarProvincias = signal(true);
  mostrarDistritos = signal(true);
  mostrarRutas = signal(true);

  // Filtros
  filtroEstado = '';
  filtroTipo = '';
  filtroServicio = '';
  rutasFiltradas: Ruta[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public rutas: Ruta[],
    private dialogRef: MatDialogRef<MapaRutasFullscreenComponent>
  ) {
    this.rutasFiltradas = [...this.rutas];
  }

  ngOnInit() {
    console.log('MapaRutasFullscreenComponent - ngOnInit');
  }

  ngAfterViewInit() {
    console.log('MapaRutasFullscreenComponent - ngAfterViewInit');
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
    this.rutasMarkers = [];
  }

  cerrar() {
    this.dialogRef.close();
  }

  actualizarCapas() {
    if (!this.map) return;

    // Limpiar capas anteriores
    this.geoJsonLayers.forEach(layer => this.map!.removeLayer(layer));
    this.geoJsonLayers = [];

    if (this.mostrarProvincias()) {
      this.cargarProvincias();
    }

    if (this.mostrarDistritos()) {
      this.cargarDistritos();
    }

    if (this.mostrarRutas()) {
      this.cargarPuntosRutas();
    }
  }

  aplicarFiltros() {
    this.rutasFiltradas = this.rutas.filter(ruta => {
      const cumpleEstado = !this.filtroEstado || ruta.estado === this.filtroEstado;
      const cumpleTipo = !this.filtroTipo || ruta.tipoRuta === this.filtroTipo;
      const cumpleServicio = !this.filtroServicio || ruta.tipoServicio === this.filtroServicio;
      return cumpleEstado && cumpleTipo && cumpleServicio;
    });

    // Actualizar mapa con rutas filtradas
    this.limpiarRutasMarkers();
    if (this.mostrarRutas()) {
      this.cargarPuntosRutas();
    }
  }

  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroTipo = '';
    this.filtroServicio = '';
    this.aplicarFiltros();
  }

  private limpiarRutasMarkers() {
    this.rutasMarkers.forEach(marker => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.rutasMarkers = [];
  }

  inicializarMapa() {
    try {
      const container = document.getElementById('leaflet-map-fullscreen') as HTMLElement;

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

    if (this.mostrarProvincias()) {
      this.cargarProvincias();
    }

    if (this.mostrarDistritos()) {
      this.cargarDistritos();
    }

    if (this.mostrarRutas()) {
      this.cargarPuntosRutas();
    }
  }

  private cargarProvincias() {
    if (!this.map) return;

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
  }

  private cargarDistritos() {
    if (!this.map) return;

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
  }

  private cargarPuntosRutas() {
    if (!this.map || !this.rutasFiltradas || this.rutasFiltradas.length === 0) {
      console.log('No hay rutas para mostrar');
      return;
    }

    console.log('Cargando puntos de rutas:', this.rutasFiltradas.length);

    this.rutasFiltradas.forEach((ruta, index) => {
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
        this.rutasMarkers.push(originMarker);
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
        this.rutasMarkers.push(destMarker);
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
            this.rutasMarkers.push(itinerarioMarker);
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
        this.rutasMarkers.push(polyline);
      }
    });

    console.log('Puntos de rutas cargados');
  }
}
