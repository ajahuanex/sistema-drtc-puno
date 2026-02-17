import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Ruta } from '../../models/ruta.model';

interface LocalidadMapa {
  nombre: string;
  lat: number;
  lng: number;
  rutasComoOrigen: number;
  rutasComoDestino: number;
  rutasEnItinerario: number;
  total: number;
}

@Component({
  selector: 'app-mapa-rutas-puno',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="mapa-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>map</mat-icon>
          Mapa de Rutas - Departamento de Puno
        </mat-card-title>
        <mat-card-subtitle>
          Visualización geográfica de rutas y localidades
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <!-- Controles del mapa -->
        <div class="mapa-controles">
          <mat-chip-set>
            <mat-chip (click)="toggleMostrarRutas()" [class.active]="mostrarRutas()">
              <mat-icon>{{ mostrarRutas() ? 'visibility' : 'visibility_off' }}</mat-icon>
              Rutas
            </mat-chip>
            <mat-chip (click)="toggleMostrarLocalidades()" [class.active]="mostrarLocalidades()">
              <mat-icon>{{ mostrarLocalidades() ? 'visibility' : 'visibility_off' }}</mat-icon>
              Localidades
            </mat-chip>
            <mat-chip (click)="toggleMostrarItinerarios()" [class.active]="mostrarItinerarios()">
              <mat-icon>{{ mostrarItinerarios() ? 'visibility' : 'visibility_off' }}</mat-icon>
              Itinerarios
            </mat-chip>
            <mat-chip (click)="toggleMostrarRutasCanceladas()" [class.warning]="mostrarRutasCanceladas()">
              <mat-icon>{{ mostrarRutasCanceladas() ? 'visibility' : 'visibility_off' }}</mat-icon>
              Canceladas
            </mat-chip>
            <mat-chip (click)="centrarMapa()">
              <mat-icon>my_location</mat-icon>
              Centrar
            </mat-chip>
          </mat-chip-set>
          
          <div class="mapa-stats">
            <span class="stat-item">
              <mat-icon>place</mat-icon>
              {{ localidadesEnMapa().length }} localidades
            </span>
            <span class="stat-item">
              <mat-icon>route</mat-icon>
              {{ rutasEnMapa().length }} rutas
            </span>
          </div>
        </div>
        
        <!-- Contenedor del mapa -->
        <div id="mapa-puno" class="mapa-container"></div>
        
        <!-- Leyenda -->
        <div class="mapa-leyenda">
          <h4>Leyenda</h4>
          <div class="leyenda-items">
            <div class="leyenda-item">
              <div class="marker-preview grande"></div>
              <span>Localidad muy transitada (10+ rutas)</span>
            </div>
            <div class="leyenda-item">
              <div class="marker-preview mediano"></div>
              <span>Localidad transitada (5-9 rutas)</span>
            </div>
            <div class="leyenda-item">
              <div class="marker-preview pequeno"></div>
              <span>Localidad poco transitada (1-4 rutas)</span>
            </div>
            <div class="leyenda-item">
              <div class="linea-preview"></div>
              <span>Ruta activa (línea sólida)</span>
            </div>
            <div class="leyenda-item">
              <div class="linea-preview punteada"></div>
              <span>Itinerario (línea punteada)</span>
            </div>
            <div class="leyenda-item">
              <div class="linea-preview cancelada"></div>
              <span>Ruta cancelada (roja)</span>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .mapa-card {
      margin: 20px 0;
    }
    
    .mapa-controles {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    
    .mapa-stats {
      display: flex;
      gap: 16px;
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: #666;
    }
    
    .stat-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .mapa-container {
      width: 100%;
      height: 600px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .mapa-leyenda {
      margin-top: 16px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    
    .mapa-leyenda h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    
    .leyenda-items {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    
    .leyenda-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #666;
    }
    
    .marker-preview {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .marker-preview.grande {
      width: 16px;
      height: 16px;
      background: #d32f2f;
    }
    
    .marker-preview.mediano {
      width: 14px;
      height: 14px;
      background: #f57c00;
    }
    
    .marker-preview.pequeno {
      width: 12px;
      height: 12px;
      background: #388e3c;
    }
    
    .linea-preview {
      width: 30px;
      height: 3px;
      background: #1976d2;
      border-radius: 2px;
    }
    
    .linea-preview.punteada {
      background: repeating-linear-gradient(
        to right,
        #1976d2 0px,
        #1976d2 5px,
        transparent 5px,
        transparent 10px
      );
    }
    
    .linea-preview.cancelada {
      background: #f44336;
    }
    
    mat-chip.active {
      background-color: #e3f2fd !important;
      color: #1976d2 !important;
      font-weight: 600;
    }
    
    mat-chip.warning {
      background-color: #ffebee !important;
      color: #f44336 !important;
      font-weight: 600;
    }
    
    /* Estilos para los popups de Leaflet */
    :host ::ng-deep .leaflet-popup-content-wrapper {
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    :host ::ng-deep .leaflet-popup-content {
      margin: 12px;
      font-family: 'Roboto', sans-serif;
    }
    
    :host ::ng-deep .popup-localidad h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1976d2;
    }
    
    :host ::ng-deep .popup-localidad .stats {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;
    }
    
    :host ::ng-deep .popup-localidad .stat-line {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    
    :host ::ng-deep .popup-localidad .stat-label {
      color: #666;
    }
    
    :host ::ng-deep .popup-localidad .stat-value {
      font-weight: 600;
      color: #333;
    }
  `]
})
export class MapaRutasPunoComponent implements OnInit, AfterViewInit, OnDestroy {
  // Inputs
  rutas = input<Ruta[]>([]);
  
  // Signals
  mostrarRutas = signal(true);
  mostrarLocalidades = signal(true);
  mostrarRutasCanceladas = signal(false);
  mostrarItinerarios = signal(true);
  localidadesEnMapa = signal<LocalidadMapa[]>([]);
  rutasEnMapa = signal<Ruta[]>([]);
  
  // Mapa de Leaflet
  private mapa?: L.Map;
  private markersLayer?: L.LayerGroup;
  private rutasLayer?: L.LayerGroup;
  
  // Coordenadas del departamento de Puno
  private readonly PUNO_CENTER: L.LatLngExpression = [-15.8402, -70.0219];
  private readonly PUNO_ZOOM = 8;
  
  // Coordenadas de localidades principales de Puno
  private readonly COORDENADAS_LOCALIDADES: { [key: string]: [number, number] } = {
    // Capitales y ciudades principales
    'PUNO': [-15.8402, -70.0219],
    'JULIACA': [-15.5000, -70.1333],
    
    // Provincia de Puno
    'ACORA': [-15.9667, -69.7833],
    'AMANTANI': [-15.6667, -69.7167],
    'ATUNCOLLA': [-15.7500, -70.0333],
    'CAPACHICA': [-15.6333, -69.8333],
    'CHUCUITO': [-16.0000, -69.8833],
    'COATA': [-15.6667, -70.0333],
    'HUATA': [-15.6167, -69.9833],
    'MAÑAZO': [-15.8167, -70.3833],
    'PAUCARCOLLA': [-15.7667, -70.0833],
    'PICHACANI': [-15.8667, -70.5833],
    'PLATERIA': [-15.9333, -69.9500],
    'SAN ANTONIO': [-15.7833, -70.1667],
    'TIQUILLACA': [-15.8833, -69.9667],
    'VILQUE': [-15.7833, -70.1833],
    
    // Provincia de Azángaro
    'AZANGARO': [-14.9167, -70.1833],
    'ACHAYA': [-15.0500, -70.1167],
    'ARAPA': [-15.1333, -70.1167],
    'ASILLO': [-14.7833, -70.3500],
    'CAMINACA': [-14.8333, -70.0333],
    'CHUPA': [-15.1667, -70.0500],
    'JOSE DOMINGO CHOQUEHUANCA': [-14.8667, -70.2167],
    'MUÑANI': [-14.7667, -69.9500],
    'POTONI': [-14.9833, -70.0667],
    'SAMAN': [-15.0167, -70.0167],
    'SAN ANTON': [-14.6167, -70.2833],
    'SAN JOSE': [-14.9500, -70.2500],
    'SAN JUAN DE SALINAS': [-14.9667, -70.0167],
    'SANTIAGO DE PUPUJA': [-15.0000, -70.2833],
    'TIRAPATA': [-14.9333, -70.3667],
    
    // Provincia de Carabaya
    'MACUSANI': [-14.0667, -70.4333],
    'AJOYANI': [-14.2833, -69.9167],
    'AYAPATA': [-13.9333, -70.1667],
    'COASA': [-14.1500, -69.9833],
    'CORANI': [-14.0833, -70.6333],
    'CRUCERO': [-14.3667, -70.0167],
    'ITUATA': [-14.2667, -70.0833],
    'OLLACHEA': [-13.7833, -70.4833],
    'SAN GABAN': [-13.4333, -70.4000],
    'USICAYOS': [-14.1833, -69.8833],
    
    // Provincia de Chucuito
    'JULI': [-16.2167, -69.4667],
    'DESAGUADERO': [-16.5667, -69.0333],
    'HUACULLANI': [-16.6333, -69.1833],
    'KELLUYO': [-16.7167, -69.2167],
    'PISACOMA': [-16.9167, -69.4000],
    'POMATA': [-16.2667, -69.2833],
    'ZEPITA': [-16.4833, -69.1000],
    
    // Provincia de El Collao
    'ILAVE': [-16.0833, -69.6333],
    'CAPASO': [-16.7333, -69.7667],
    'PILCUYO': [-16.0667, -69.5167],
    'SANTA ROSA COLLAO': [-16.1000, -69.7167],
    'CONDURIRI': [-16.6167, -69.6833],
    
    // Provincia de Huancané
    'HUANCANE': [-15.2000, -69.7667],
    'COJATA': [-15.0333, -69.3667],
    'HUATASANI': [-15.0667, -69.7333],
    'INCHUPALLA': [-14.9833, -69.5833],
    'PUSI': [-15.4333, -69.9667],
    'ROSASPATA': [-15.1333, -69.5167],
    'TARACO': [-15.3167, -69.9833],
    'VILQUE CHICO': [-15.2167, -69.6833],
    
    // Provincia de Lampa
    'LAMPA': [-15.3667, -70.3667],
    'CABANILLA': [-15.6333, -70.3833],
    'CALAPUJA': [-15.3167, -70.1833],
    'NICASIO': [-15.2500, -70.2667],
    'OCUVIRI': [-15.0667, -70.7833],
    'PALCA': [-15.2833, -70.5167],
    'PARATIA': [-15.0500, -70.5667],
    'PUCARA': [-15.0333, -70.3667],
    'SANTA LUCIA': [-15.7000, -70.6000],
    'VILAVILA': [-15.5833, -70.6167],
    
    // Provincia de Melgar
    'AYAVIRI': [-14.8833, -70.5833],
    'ANTAUTA': [-14.7333, -70.4667],
    'CUPI': [-14.7667, -70.6833],
    'LLALLI': [-14.8167, -70.8000],
    'MACARI': [-14.9167, -70.7333],
    'NUÑOA': [-14.4833, -70.6333],
    'ORURILLO': [-14.7333, -70.9667],
    'SANTA ROSA MELGAR': [-14.6333, -70.7833],
    'UMACHIRI': [-14.8333, -70.7167],
    
    // Provincia de Moho
    'MOHO': [-15.3833, -69.4833],
    'CONIMA': [-15.5333, -69.3167],
    'HUAYRAPATA': [-15.4667, -69.6167],
    'TILALI': [-15.3000, -69.4333],
    
    // Provincia de San Antonio de Putina
    'PUTINA': [-14.9167, -69.8667],
    'ANANEA': [-14.6833, -69.5333],
    'PEDRO VILCA APAZA': [-14.8333, -69.7833],
    'QUILCAPUNCU': [-14.8667, -69.9167],
    'SINA': [-14.9667, -69.7333],
    
    // Provincia de San Román
    'CABANA': [-15.6167, -70.3500],
    'CABANILLAS': [-15.6333, -70.3833],
    'CARACOTO': [-15.7333, -70.0833],
    
    // Provincia de Sandia
    'SANDIA': [-14.2833, -69.4333],
    'ALTO INAMBARI': [-13.7333, -69.7167],
    'CUYOCUYO': [-14.4667, -69.5667],
    'LIMBANI': [-14.1167, -69.6833],
    'PATAMBUCO': [-14.3333, -69.3167],
    'PHARA': [-14.5167, -69.4500],
    'QUIACA': [-14.5833, -69.3833],
    'SAN JUAN DEL ORO': [-14.1833, -69.2667],
    'YANAHUAYA': [-14.2000, -69.5500],
    'MASSIAPO': [-13.6167, -69.4833],
    
    // Provincia de Yunguyo
    'YUNGUYO': [-16.2500, -69.0833],
    'ANAPIA': [-16.2667, -69.0167],
    'COPANI': [-16.2167, -69.1333],
    'CUTURAPI': [-16.3167, -69.0500],
    'OLLARAYA': [-16.3667, -69.1167],
    'TINICACHI': [-16.2833, -69.1500],
    'UNICACHI': [-16.3333, -69.0833]
  };
  
  ngOnInit(): void {
    this.procesarDatos();
  }
    
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inicializarMapa();
    }, 100);
  }
  
  ngOnDestroy(): void {
    if (this.mapa) {
      this.mapa.remove();
    }
  }
  
  private procesarDatos(): void {
    const todasLasRutas = this.rutas();
    
    // Filtrar rutas canceladas si el toggle está desactivado
    const rutasData = this.mostrarRutasCanceladas() 
      ? todasLasRutas 
      : todasLasRutas.filter(ruta => ruta.estado !== 'CANCELADA' && ruta.estado !== 'DADA_DE_BAJA');
    
    this.rutasEnMapa.set(rutasData);
    
    // Procesar localidades
    const localidadesMap = new Map<string, LocalidadMapa>();
    
    rutasData.forEach(ruta => {
      // Procesar origen
      if (ruta.origen?.nombre) {
        const coords = this.obtenerCoordenadas(ruta.origen.nombre);
        if (coords) {
          const localidad = localidadesMap.get(ruta.origen.nombre) || {
            nombre: ruta.origen.nombre,
            lat: coords[0],
            lng: coords[1],
            rutasComoOrigen: 0,
            rutasComoDestino: 0,
            rutasEnItinerario: 0,
            total: 0
          };
          localidad.rutasComoOrigen++;
          localidad.total++;
          localidadesMap.set(ruta.origen.nombre, localidad);
        }
      }
      
      // Procesar destino
      if (ruta.destino?.nombre) {
        const coords = this.obtenerCoordenadas(ruta.destino.nombre);
        if (coords) {
          const localidad = localidadesMap.get(ruta.destino.nombre) || {
            nombre: ruta.destino.nombre,
            lat: coords[0],
            lng: coords[1],
            rutasComoOrigen: 0,
            rutasComoDestino: 0,
            rutasEnItinerario: 0,
            total: 0
          };
          localidad.rutasComoDestino++;
          localidad.total++;
          localidadesMap.set(ruta.destino.nombre, localidad);
        }
      }
      
      // Procesar itinerario
      if (ruta.itinerario && Array.isArray(ruta.itinerario)) {
        ruta.itinerario.forEach(localidadItinerario => {
          if (localidadItinerario.nombre) {
            const coords = this.obtenerCoordenadas(localidadItinerario.nombre);
            if (coords) {
              const localidad = localidadesMap.get(localidadItinerario.nombre) || {
                nombre: localidadItinerario.nombre,
                lat: coords[0],
                lng: coords[1],
                rutasComoOrigen: 0,
                rutasComoDestino: 0,
                rutasEnItinerario: 0,
                total: 0
              };
              localidad.rutasEnItinerario++;
              localidad.total++;
              localidadesMap.set(localidadItinerario.nombre, localidad);
            }
          }
        });
      }
    });
    
    this.localidadesEnMapa.set(Array.from(localidadesMap.values()));
  }
  
  private inicializarMapa(): void {
    // Inicializar mapa
    this.mapa = L.map('mapa-puno').setView(this.PUNO_CENTER, this.PUNO_ZOOM);
    
    // Agregar capa de tiles (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      minZoom: 7
    }).addTo(this.mapa);
    
    // Crear capas para markers y rutas
    this.markersLayer = L.layerGroup().addTo(this.mapa);
    this.rutasLayer = L.layerGroup().addTo(this.mapa);
    
    // Dibujar localidades y rutas
    this.dibujarLocalidades();
    this.dibujarRutas();
  }
  
  private dibujarLocalidades(): void {
    if (!this.markersLayer) return;
    
    this.markersLayer.clearLayers();
    
    if (!this.mostrarLocalidades()) return;
    
    this.localidadesEnMapa().forEach(localidad => {
      const marker = this.crearMarker(localidad);
      marker.addTo(this.markersLayer!);
    });
  }
  
  private crearMarker(localidad: LocalidadMapa): L.CircleMarker {
    // Determinar tamaño y color según cantidad de rutas
    let radius = 6;
    let color = '#388e3c'; // Verde para poco tránsito
    
    if (localidad.total >= 10) {
      radius = 10;
      color = '#d32f2f'; // Rojo para mucho tránsito
    } else if (localidad.total >= 5) {
      radius = 8;
      color = '#f57c00'; // Naranja para tránsito medio
    }
    
    const marker = L.circleMarker([localidad.lat, localidad.lng], {
      radius: radius,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    });
    
    // Popup con información
    const popupContent = `
      <div class="popup-localidad">
        <h3>${localidad.nombre}</h3>
        <div class="stats">
          <div class="stat-line">
            <span class="stat-label">Como origen:</span>
            <span class="stat-value">${localidad.rutasComoOrigen} rutas</span>
          </div>
          <div class="stat-line">
            <span class="stat-label">Como destino:</span>
            <span class="stat-value">${localidad.rutasComoDestino} rutas</span>
          </div>
          <div class="stat-line">
            <span class="stat-label">En itinerario:</span>
            <span class="stat-value">${localidad.rutasEnItinerario} rutas</span>
          </div>
          <div class="stat-line">
            <span class="stat-label"><strong>Total:</strong></span>
            <span class="stat-value"><strong>${localidad.total} rutas</strong></span>
          </div>
          <div class="stat-line">
            <span class="stat-label">Coordenadas:</span>
            <span class="stat-value">${localidad.lat.toFixed(4)}, ${localidad.lng.toFixed(4)}</span>
          </div>
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    
    // Tooltip al pasar el mouse
    marker.bindTooltip(localidad.nombre, {
      permanent: false,
      direction: 'top',
      offset: [0, -10]
    });
    
    return marker;
  }
  
  private dibujarRutas(): void {
    if (!this.rutasLayer) return;
    
    this.rutasLayer.clearLayers();
    
    if (!this.mostrarRutas()) return;
    
    this.rutasEnMapa().forEach(ruta => {
      this.dibujarRutaSimple(ruta);
    });
  }
  
  private dibujarRutaSimple(ruta: Ruta): void {
    const origenCoords = this.obtenerCoordenadas(ruta.origen?.nombre || '');
    const destinoCoords = this.obtenerCoordenadas(ruta.destino?.nombre || '');
    
    if (!origenCoords || !destinoCoords) {
      console.log('❌ No se encontraron coordenadas para:', ruta.codigoRuta, ruta.origen?.nombre, ruta.destino?.nombre);
      return;
    }
    
    console.log('🗺️ Dibujando ruta:', ruta.codigoRuta, 'Itinerario:', ruta.itinerario?.length || 0, 'paradas');
    
    // Determinar color según estado
    let color = '#1976d2'; // Azul por defecto (ACTIVA)
    let opacity = 0.7;
    let weight = 3;
    
    if (ruta.estado === 'CANCELADA' || ruta.estado === 'DADA_DE_BAJA') {
      color = '#f44336'; // Rojo para canceladas
      opacity = 0.4;
      weight = 2;
    } else if (ruta.estado === 'SUSPENDIDA') {
      color = '#ff9800'; // Naranja para suspendidas
      opacity = 0.5;
    } else if (ruta.estado === 'INACTIVA') {
      color = '#9e9e9e'; // Gris para inactivas
      opacity = 0.4;
    }
    
    // Preparar waypoints (coordenadas)
    const waypoints: [number, number][] = [origenCoords];
    
    // Agregar itinerario si está habilitado y existe
    if (this.mostrarItinerarios() && ruta.itinerario && ruta.itinerario.length > 0) {
      console.log('✅ Procesando itinerario de', ruta.codigoRuta, ':', ruta.itinerario);
      const itinerarioOrdenado = [...ruta.itinerario].sort((a, b) => a.orden - b.orden);
      itinerarioOrdenado.forEach(loc => {
        const coords = this.obtenerCoordenadas(loc.nombre);
        if (coords) {
          console.log('  ✓ Parada', loc.orden, ':', loc.nombre, coords);
          waypoints.push(coords);
        } else {
          console.log('  ❌ No se encontraron coordenadas para parada:', loc.nombre);
        }
      });
    } else {
      console.log('⚠️ No hay itinerario o está desactivado. mostrarItinerarios:', this.mostrarItinerarios(), 'itinerario:', ruta.itinerario);
    }
    
    waypoints.push(destinoCoords);
    
    console.log('📍 Waypoints totales:', waypoints.length, waypoints);
    
    // Crear popup content
    const estadoBadge = this.getEstadoBadge(ruta.estado);
    const popupContent = `
      <div class="popup-ruta">
        <h3>${ruta.codigoRuta}</h3>
        <p><strong>${ruta.origen?.nombre}</strong> → <strong>${ruta.destino?.nombre}</strong></p>
        <p>Frecuencia: ${ruta.frecuencia?.descripcion || 'No especificada'}</p>
        <p>Estado: ${estadoBadge}</p>
        ${ruta.itinerario && ruta.itinerario.length > 0 ? 
          `<p><small>Itinerario: ${ruta.itinerario.length} paradas</small></p>` : 
          ''}
      </div>
    `;
    
    // Dibujar línea principal
    const polyline = L.polyline(waypoints, {
      color: color,
      weight: weight,
      opacity: opacity,
      smoothFactor: 2
    });
    
    polyline.bindPopup(popupContent);
    polyline.addTo(this.rutasLayer!);
    
    // Si tiene itinerario, dibujar marcadores en las paradas
    if (this.mostrarItinerarios() && ruta.itinerario && ruta.itinerario.length > 0) {
      console.log('🎯 Dibujando marcadores para', ruta.itinerario.length, 'paradas');
      ruta.itinerario.forEach(loc => {
        const coords = this.obtenerCoordenadas(loc.nombre);
        if (coords) {
          const marker = L.circleMarker(coords, {
            radius: 4,
            fillColor: color,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          });
          
          marker.bindPopup(`
            <div class="popup-itinerario">
              <h4>Parada ${loc.orden}</h4>
              <p><strong>${loc.nombre}</strong></p>
              <p><small>Ruta: ${ruta.codigoRuta}</small></p>
            </div>
          `);
          
          marker.addTo(this.rutasLayer!);
          console.log('  ✓ Marcador agregado para:', loc.nombre);
        }
      });
    }
  }
  
  private dibujarItinerario(ruta: Ruta, color: string, opacity: number): void {
    // Este método ya no es necesario
  }
  
  private getEstadoBadge(estado: string): string {
    const badges: { [key: string]: string } = {
      'ACTIVA': '<span style="color: #4caf50; font-weight: bold;">✓ ACTIVA</span>',
      'INACTIVA': '<span style="color: #9e9e9e;">○ INACTIVA</span>',
      'SUSPENDIDA': '<span style="color: #ff9800;">⏸ SUSPENDIDA</span>',
      'CANCELADA': '<span style="color: #f44336;">✗ CANCELADA</span>',
      'DADA_DE_BAJA': '<span style="color: #f44336;">✗ DADA DE BAJA</span>',
      'EN_MANTENIMIENTO': '<span style="color: #2196f3;">🔧 EN MANTENIMIENTO</span>'
    };
    return badges[estado] || estado;
  }
  
  private obtenerCoordenadas(nombreLocalidad: string): [number, number] | null {
    // Normalizar nombre (quitar acentos, mayúsculas, etc.)
    const nombreNormalizado = nombreLocalidad
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    // Buscar en el diccionario
    for (const [key, coords] of Object.entries(this.COORDENADAS_LOCALIDADES)) {
      if (nombreNormalizado.includes(key) || key.includes(nombreNormalizado)) {
        return coords;
      }
    }
    
    console.warn('⚠️ No se encontraron coordenadas para:', nombreLocalidad);
    return null;
  }
  
  // Métodos públicos para controles
  toggleMostrarRutas(): void {
    this.mostrarRutas.update(v => !v);
    this.dibujarRutas();
  }
  
  toggleMostrarLocalidades(): void {
    this.mostrarLocalidades.update(v => !v);
    this.dibujarLocalidades();
  }
  
  toggleMostrarItinerarios(): void {
    this.mostrarItinerarios.update(v => !v);
    this.dibujarRutas(); // Redibujar rutas para incluir/excluir itinerarios
  }
  
  toggleMostrarRutasCanceladas(): void {
    this.mostrarRutasCanceladas.update(v => !v);
    this.procesarDatos(); // Reprocesar datos para filtrar/incluir canceladas
    this.dibujarLocalidades();
    this.dibujarRutas();
  }
  
  centrarMapa(): void {
    if (this.mapa) {
      this.mapa.setView(this.PUNO_CENTER, this.PUNO_ZOOM);
    }
  }
}
