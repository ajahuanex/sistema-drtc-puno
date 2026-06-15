import { Component, OnInit, AfterViewInit, OnDestroy, Inject } from '@angular/core';
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

// Configurar iconos de Leaflet (igual que en el componente principal)
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
            
            <!-- Búsqueda por Origen-Destino -->
            <div class="filter-option">
              <label>Buscar Origen → Destino:</label>
              <input 
                type="text" 
                [(ngModel)]="busquedaOrigenDestino"
                (input)="aplicarFiltros()"
                placeholder="Ej: Juliaca-Puno o Puno-Juliaca"
                class="filter-input">
              <small style="color: #666; font-size: 10px; display: block; margin-top: 4px;">
                Busca en ambas direcciones
              </small>
            </div>

            <!-- Filtro por empresa con búsqueda -->
            <div class="filter-option">
              <label>Empresa (búsqueda):</label>
              <input 
                type="text" 
                [(ngModel)]="filtroEmpresa"
                (input)="aplicarFiltros()"
                placeholder="Buscar empresa..."
                class="filter-input"
                list="empresas-list">
              <datalist id="empresas-list">
                <option *ngFor="let empresa of empresasUnicas" [value]="empresa">
              </datalist>
              <small style="color: #666; font-size: 10px; display: block; margin-top: 4px;">
                Escribe para buscar o seleccionar
              </small>
            </div>

            <!-- Filtro por estado -->
            <div class="filter-option">
              <label>Estado:</label>
              <select [(ngModel)]="filtroEstado" (change)="aplicarFiltros()">
                <option value="">Todos</option>
                <option value="ACTIVA">Activa</option>
                <option value="INACTIVA">Inactiva</option>
                <option value="SUSPENDIDA">Suspendida</option>
                <option value="EN_TRAMITE">En Trámite</option>
              </select>
            </div>

            <!-- Filtro por tipo de ruta -->
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

            <!-- Filtro por tipo de servicio -->
            <div class="filter-option">
              <label>Tipo de Servicio:</label>
              <select [(ngModel)]="filtroServicio" (change)="aplicarFiltros()">
                <option value="">Todos</option>
                <option value="PASAJEROS">Pasajeros</option>
                <option value="CARGA">Carga</option>
                <option value="MIXTO">Mixto</option>
              </select>
            </div>

            <!-- Filtro por origen -->
            <div class="filter-option">
              <label>Origen:</label>
              <select [(ngModel)]="filtroOrigen" (change)="aplicarFiltros()">
                <option value="">Todos</option>
                <option *ngFor="let origen of origenesUnicos" [value]="origen">
                  {{ origen }}
                </option>
              </select>
            </div>

            <!-- Filtro por destino -->
            <div class="filter-option">
              <label>Destino:</label>
              <select [(ngModel)]="filtroDestino" (change)="aplicarFiltros()">
                <option value="">Todos</option>
                <option *ngFor="let destino of destinosUnicos" [value]="destino">
                  {{ destino }}
                </option>
              </select>
            </div>

            <!-- Filtro por validación -->
            <div class="filter-option">
              <label>Validación de Datos:</label>
              <select [(ngModel)]="filtroValidacion" (change)="aplicarFiltros()">
                <option value="">Todos</option>
                <option value="completo">Con coordenadas completas</option>
                <option value="incompleto">Con datos faltantes</option>
                <option value="sinCoordenadas">Sin coordenadas</option>
              </select>
            </div>

            <!-- Filtro por cantidad de paradas -->
            <div class="filter-option">
              <label>Paradas en itinerario:</label>
              <select [(ngModel)]="filtroParadas" (change)="aplicarFiltros()">
                <option value="">Todas</option>
                <option value="0">Sin paradas</option>
                <option value="1-5">1 a 5 paradas</option>
                <option value="6-10">6 a 10 paradas</option>
                <option value="11+">Más de 10 paradas</option>
              </select>
            </div>
          </div>

          <!-- Nueva sección: Opciones de visualización -->
          <div class="sidebar-section">
            <h3>Visualización</h3>
            <div class="layer-option">
              <mat-checkbox 
                [(ngModel)]="mostrarItinerarioCompleto"
                (change)="actualizarVisualizacion()">
                Mostrar paradas de itinerario
              </mat-checkbox>
            </div>
            <div class="layer-option">
              <mat-checkbox 
                [(ngModel)]="mostrarFlechas"
                (change)="actualizarVisualizacion()">
                Mostrar flechas direccionales
              </mat-checkbox>
            </div>
            <div style="margin-top: 8px; padding: 8px; background: #fff8e1; border-radius: 4px; font-size: 11px; color: #795548; line-height: 1.4;" *ngIf="mostrarItinerarioCompleto && paradasSincronizadas === 0">
              ⚠️ Las rutas importadas no tienen coordenadas en sus paradas. Usa el botón para sincronizarlas.
            </div>
            <button 
              mat-stroked-button 
              color="accent" 
              style="margin-top: 8px; width: 100%; font-size: 11px;"
              (click)="sincronizarItinerarios()"
              [disabled]="sincronizando"
              matTooltip="Vincula las paradas del itinerario con coordenadas de las localidades">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px; margin-right: 4px;">sync</mat-icon>
              {{ sincronizando ? 'Sincronizando...' : 'Sincronizar Itinerarios' }}
            </button>
            <div style="margin-top: 6px; font-size: 11px; color: #388e3c;" *ngIf="mensajeSincronizacion">
              ✅ {{ mensajeSincronizacion }}
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

    .filter-input {
      width: 100%;
      padding: 8px;
      border: 1px solid #cbd5e0;
      border-radius: 4px;
      font-size: 12px;
      background: white;
    }

    .filter-input:hover {
      border-color: #a0aec0;
    }

    .filter-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .filter-input::placeholder {
      color: #a0aec0;
      font-style: italic;
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

  // Capas - cambiar de signal() a boolean simple
  mostrarProvincias = true;
  mostrarDistritos = true;
  mostrarRutas = true;

  // Filtros
  busquedaOrigenDestino = '';
  filtroEmpresa = '';
  filtroEstado = '';
  filtroTipo = '';
  filtroServicio = '';
  filtroOrigen = '';
  filtroDestino = '';
  filtroValidacion = '';
  filtroParadas = '';
  
  rutasFiltradas: Ruta[] = [];

  // Opciones de visualización
  mostrarItinerarioCompleto = true;
  mostrarFlechas = true;
  paradasSincronizadas = 0;
  sincronizando = false;
  mensajeSincronizacion = '';

  // Listas únicas para selectores
  empresasUnicas: string[] = [];
  origenesUnicos: string[] = [];
  destinosUnicos: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public rutas: Ruta[],
    private dialogRef: MatDialogRef<MapaRutasFullscreenComponent>
  ) {
    this.rutasFiltradas = [...this.rutas];
    this.inicializarListasUnicas();
  }

  ngOnInit() {
    console.log('MapaRutasFullscreenComponent - ngOnInit');
    console.log('  Estado inicial checkboxes:');
    console.log('    mostrarItinerarioCompleto:', this.mostrarItinerarioCompleto);
    console.log('    mostrarFlechas:', this.mostrarFlechas);
  }

  private inicializarListasUnicas() {
    // Extraer empresas únicas
    const empresasSet = new Set<string>();
    const origenesSet = new Set<string>();
    const destinosSet = new Set<string>();

    this.rutas.forEach(ruta => {
      // Manejar razonSocial que puede ser string o objeto
      if (ruta.empresa?.razonSocial) {
        const razonSocial = typeof ruta.empresa.razonSocial === 'string' 
          ? ruta.empresa.razonSocial 
          : (ruta.empresa.razonSocial as any).principal || '';
        if (razonSocial) {
          empresasSet.add(razonSocial);
        }
      }
      
      if (ruta.origen?.nombre) {
        origenesSet.add(ruta.origen.nombre);
      }
      if (ruta.destino?.nombre) {
        destinosSet.add(ruta.destino.nombre);
      }
    });

    this.empresasUnicas = Array.from(empresasSet).sort();
    this.origenesUnicos = Array.from(origenesSet).sort();
    this.destinosUnicos = Array.from(destinosSet).sort();

    console.log('📊 Listas únicas inicializadas:');
    console.log('  Empresas:', this.empresasUnicas.length);
    console.log('  Orígenes:', this.origenesUnicos.length);
    console.log('  Destinos:', this.destinosUnicos.length);
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

  sincronizarItinerarios() {
    this.sincronizando = true;
    this.mensajeSincronizacion = '';

    fetch('/api/rutas/sincronizar-itinerarios', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        this.paradasSincronizadas = data.total_paradas_vinculadas || 0;
        this.mensajeSincronizacion = `${data.rutas_actualizadas} rutas y ${data.total_paradas_vinculadas} paradas vinculadas.`;
        this.sincronizando = false;
        console.log('✅ Sincronización:', data);
        // Recargar el mapa con los nuevos datos
        this.limpiarRutasMarkers();
        // Recargar rutas desde el servidor si es posible
        alert(`Sincronización completada:\n${data.mensaje}\n\nRecarga la página para ver los itinerarios actualizados.`);
      })
      .catch(err => {
        console.error('Error sincronizando:', err);
        this.mensajeSincronizacion = 'Error al sincronizar.';
        this.sincronizando = false;
      });
  }

  actualizarCapas() {
    if (!this.map) return;

    // Limpiar capas anteriores
    this.geoJsonLayers.forEach(layer => this.map!.removeLayer(layer));
    this.geoJsonLayers = [];

    // Limpiar también las rutas al actualizar capas
    this.limpiarRutasMarkers();

    if (this.mostrarProvincias) {
      this.cargarProvincias();
    }

    if (this.mostrarDistritos) {
      this.cargarDistritos();
    }

    if (this.mostrarRutas) {
      this.cargarPuntosRutas();
    }
  }

  aplicarFiltros() {
    console.log('🔍 APLICANDO FILTROS AVANZADOS');
    console.log('  Búsqueda Origen-Destino:', this.busquedaOrigenDestino || 'N/A');
    console.log('  Empresa:', this.filtroEmpresa || 'Todas');
    console.log('  Estado:', this.filtroEstado || 'Todos');
    console.log('  Tipo:', this.filtroTipo || 'Todos');
    console.log('  Servicio:', this.filtroServicio || 'Todos');
    console.log('  Origen:', this.filtroOrigen || 'Todos');
    console.log('  Destino:', this.filtroDestino || 'Todos');
    console.log('  Validación:', this.filtroValidacion || 'Todos');
    console.log('  Paradas:', this.filtroParadas || 'Todas');
    console.log('  Total rutas antes de filtrar:', this.rutas.length);
    
    this.rutasFiltradas = this.rutas.filter(ruta => {
      // Filtro por búsqueda Origen-Destino (bidireccional)
      if (this.busquedaOrigenDestino) {
        const busqueda = this.busquedaOrigenDestino.toLowerCase();
        const origen = (ruta.origen?.nombre || '').toLowerCase();
        const destino = (ruta.destino?.nombre || '').toLowerCase();
        
        // Buscar en ambas direcciones: "origen-destino" o "destino-origen"
        const coincideDirecto = (origen + '-' + destino).includes(busqueda) || 
                               (origen + ' ' + destino).includes(busqueda);
        const coincideInverso = (destino + '-' + origen).includes(busqueda) || 
                               (destino + ' ' + origen).includes(busqueda);
        const coincideOrigen = origen.includes(busqueda);
        const coincideDestino = destino.includes(busqueda);
        
        if (!coincideDirecto && !coincideInverso && !coincideOrigen && !coincideDestino) {
          return false;
        }
      }

      // Filtro por empresa (búsqueda parcial)
      if (this.filtroEmpresa) {
        const razonSocial = typeof ruta.empresa?.razonSocial === 'string' 
          ? ruta.empresa.razonSocial 
          : (ruta.empresa?.razonSocial as any)?.principal || '';
        
        const busquedaEmpresa = this.filtroEmpresa.toLowerCase();
        const razonSocialLower = razonSocial.toLowerCase();
        
        if (!razonSocialLower.includes(busquedaEmpresa)) {
          return false;
        }
      }

      // Filtro por estado
      if (this.filtroEstado && ruta.estado !== this.filtroEstado) {
        return false;
      }

      // Filtro por tipo de ruta
      if (this.filtroTipo && ruta.tipoRuta !== this.filtroTipo) {
        return false;
      }

      // Filtro por tipo de servicio
      if (this.filtroServicio && ruta.tipoServicio !== this.filtroServicio) {
        return false;
      }

      // Filtro por origen
      if (this.filtroOrigen && ruta.origen?.nombre !== this.filtroOrigen) {
        return false;
      }

      // Filtro por destino
      if (this.filtroDestino && ruta.destino?.nombre !== this.filtroDestino) {
        return false;
      }

      // Filtro por validación de datos
      if (this.filtroValidacion) {
        const tieneOrigenCoords = !!(ruta.origen?.coordenadas?.latitud && ruta.origen?.coordenadas?.longitud);
        const tieneDestinoCoords = !!(ruta.destino?.coordenadas?.latitud && ruta.destino?.coordenadas?.longitud);
        
        if (this.filtroValidacion === 'completo') {
          if (!tieneOrigenCoords || !tieneDestinoCoords) return false;
        } else if (this.filtroValidacion === 'incompleto') {
          if (tieneOrigenCoords && tieneDestinoCoords) return false;
        } else if (this.filtroValidacion === 'sinCoordenadas') {
          if (tieneOrigenCoords || tieneDestinoCoords) return false;
        }
      }

      // Filtro por cantidad de paradas
      if (this.filtroParadas) {
        const numParadas = ruta.itinerario?.length || 0;
        
        if (this.filtroParadas === '0' && numParadas !== 0) return false;
        if (this.filtroParadas === '1-5' && (numParadas < 1 || numParadas > 5)) return false;
        if (this.filtroParadas === '6-10' && (numParadas < 6 || numParadas > 10)) return false;
        if (this.filtroParadas === '11+' && numParadas <= 10) return false;
      }

      return true;
    });
    
    console.log('  Rutas después de filtrar:', this.rutasFiltradas.length);

    // Actualizar mapa con rutas filtradas
    this.actualizarVisualizacion();
  }

  actualizarVisualizacion() {
    console.log('🔄 Actualizando visualización');
    console.log('  mostrarItinerarioCompleto:', this.mostrarItinerarioCompleto);
    console.log('  mostrarFlechas:', this.mostrarFlechas);
    console.log('  Limpiando markers...');
    this.limpiarRutasMarkers();
    
    if (this.mostrarRutas) {
      console.log('  Cargando puntos de rutas filtradas...');
      this.cargarPuntosRutas();
    } else {
      console.log('  ⚠️ Checkbox "Rutas" está desmarcado, no se cargan puntos');
    }
  }

  limpiarFiltros() {
    this.busquedaOrigenDestino = '';
    this.filtroEmpresa = '';
    this.filtroEstado = '';
    this.filtroTipo = '';
    this.filtroServicio = '';
    this.filtroOrigen = '';
    this.filtroDestino = '';
    this.filtroValidacion = '';
    this.filtroParadas = '';
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

    if (this.mostrarProvincias) {
      this.cargarProvincias();
    }

    if (this.mostrarDistritos) {
      this.cargarDistritos();
    }

    if (this.mostrarRutas) {
      this.cargarPuntosRutas();
    }
  }

  private cargarProvincias() {
    if (!this.map) return;

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
  }

  private cargarDistritos() {
    if (!this.map) return;

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
  }

  private cargarPuntosRutas() {
    if (!this.map || !this.rutasFiltradas || this.rutasFiltradas.length === 0) {
      console.log('⚠️ No hay rutas filtradas para mostrar');
      console.log('  map:', !!this.map);
      console.log('  rutasFiltradas:', this.rutasFiltradas?.length || 0);
      return;
    }

    console.log('🗺️ CARGANDO PUNTOS DE RUTAS FILTRADAS');
    console.log('  Total a procesar:', this.rutasFiltradas.length);
    console.log('  Mostrar itinerario:', this.mostrarItinerarioCompleto);
    console.log('  Mostrar flechas:', this.mostrarFlechas);

    let puntosAgregados = 0;
    let rutasConOrigen = 0;
    let rutasConDestino = 0;
    let rutasConItinerario = 0;
    let paradasItinerario = 0;

    this.rutasFiltradas.forEach((ruta, index) => {
      // Marcador de origen - con validación exhaustiva
      if (ruta.origen?.coordenadas?.latitud && 
          ruta.origen?.coordenadas?.longitud &&
          typeof ruta.origen.coordenadas.latitud === 'number' &&
          typeof ruta.origen.coordenadas.longitud === 'number' &&
          !isNaN(ruta.origen.coordenadas.latitud) &&
          !isNaN(ruta.origen.coordenadas.longitud)) {
        try {
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
          puntosAgregados++;
          rutasConOrigen++;
        } catch (e) {
          console.error('Error al agregar origen:', e);
        }
      }

      // Marcador de destino - con validación exhaustiva
      if (ruta.destino?.coordenadas?.latitud && 
          ruta.destino?.coordenadas?.longitud &&
          typeof ruta.destino.coordenadas.latitud === 'number' &&
          typeof ruta.destino.coordenadas.longitud === 'number' &&
          !isNaN(ruta.destino.coordenadas.latitud) &&
          !isNaN(ruta.destino.coordenadas.longitud)) {
        try {
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
          rutasConDestino++;
        } catch (e) {
          console.error('Error al agregar destino:', e);
        }
      }

      // Marcadores de itinerario - con validación exhaustiva Y checkbox
      if (this.mostrarItinerarioCompleto && ruta.itinerario && ruta.itinerario.length > 0) {
        let paradasConCoords = 0;
        let paradasSinCoords = 0;

        ruta.itinerario.forEach((parada, orden) => {
          // Intentar obtener coords directas o por objeto anidado
          const lat = parada.coordenadas?.latitud ?? (parada as any).coordenadas?.lat;
          const lng = parada.coordenadas?.longitud ?? (parada as any).coordenadas?.lng ?? (parada as any).coordenadas?.lon;

          if (lat !== null && lat !== undefined && lng !== null && lng !== undefined &&
              typeof lat === 'number' && typeof lng === 'number' &&
              !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            try {
              const itinerarioMarker = L.circleMarker(
                [lat, lng],
                { radius: 4, fillColor: '#ffaa00', color: '#ff8800', weight: 1, opacity: 1, fillOpacity: 0.7 }
              );
              itinerarioMarker.bindPopup(`
                <div style="font-size: 12px;">
                  <strong>Parada ${orden + 1}: ${parada.nombre}</strong><br>
                  Ruta: ${ruta.codigoRuta}<br>
                  Coords: [${lat.toFixed(4)}, ${lng.toFixed(4)}]
                </div>
              `);
              itinerarioMarker.addTo(this.map!);
              this.rutasMarkers.push(itinerarioMarker);
              paradasConCoords++;
            } catch (e) {
              console.error(`Error parada ${orden + 1}:`, e);
            }
          } else {
            paradasSinCoords++;
          }
        });

        if (paradasConCoords > 0) {
          rutasConItinerario++;
          paradasItinerario += paradasConCoords;
        }
        if (paradasSinCoords > 0 && paradasConCoords === 0) {
          console.log(`  ℹ️ Ruta ${ruta.codigoRuta}: ${paradasSinCoords} paradas sin coordenadas (importadas sin georef.)`);
        }
      }

      // Línea conectando origen, itinerario (si está activado) y destino
      const puntos: L.LatLngExpression[] = [];

      if (ruta.origen?.coordenadas?.latitud && 
          ruta.origen?.coordenadas?.longitud &&
          typeof ruta.origen.coordenadas.latitud === 'number' &&
          typeof ruta.origen.coordenadas.longitud === 'number' &&
          !isNaN(ruta.origen.coordenadas.latitud) &&
          !isNaN(ruta.origen.coordenadas.longitud)) {
        puntos.push([ruta.origen.coordenadas.latitud, ruta.origen.coordenadas.longitud]);
      }

      // Solo agregar itinerario a la línea si el checkbox está activo
      if (this.mostrarItinerarioCompleto && ruta.itinerario && ruta.itinerario.length > 0) {
        ruta.itinerario.forEach(parada => {
          if (parada.coordenadas?.latitud && 
              parada.coordenadas?.longitud &&
              typeof parada.coordenadas.latitud === 'number' &&
              typeof parada.coordenadas.longitud === 'number' &&
              !isNaN(parada.coordenadas.latitud) &&
              !isNaN(parada.coordenadas.longitud)) {
            puntos.push([parada.coordenadas.latitud, parada.coordenadas.longitud]);
          }
        });
      }

      if (ruta.destino?.coordenadas?.latitud && 
          ruta.destino?.coordenadas?.longitud &&
          typeof ruta.destino.coordenadas.latitud === 'number' &&
          typeof ruta.destino.coordenadas.longitud === 'number' &&
          !isNaN(ruta.destino.coordenadas.latitud) &&
          !isNaN(ruta.destino.coordenadas.longitud)) {
        puntos.push([ruta.destino.coordenadas.latitud, ruta.destino.coordenadas.longitud]);
      }

      if (puntos.length > 1) {
        try {
          // Color único por ruta (algoritmo ángulo dorado)
          const hue = (index * 137.5) % 360;
          const color = `hsl(${hue}, 70%, 50%)`;
          
          const polyline = L.polyline(puntos, {
            color: color,
            weight: 2,
            opacity: 0.7,
            smoothFactor: 1
          });
          
          polyline.bindPopup(`
            <div style="font-size: 12px;">
              <strong>Ruta: ${ruta.codigoRuta}</strong><br>
              ${ruta.origen?.nombre || 'N/A'} → ${ruta.destino?.nombre || 'N/A'}<br>
              Paradas: ${ruta.itinerario?.length || 0}
            </div>
          `);
          
          polyline.addTo(this.map!);
          this.rutasMarkers.push(polyline);
          
          // Agregar flechas direccionales si está activado
          if (this.mostrarFlechas && (window as any).L && (L as any).polylineDecorator) {
            try {
              const decorator = (L as any).polylineDecorator(polyline, {
                patterns: [
                  {
                    offset: '10%',
                    repeat: '20%',
                    symbol: (L as any).Symbol.arrowHead({
                      pixelSize: 6,
                      pathOptions: {
                        fillOpacity: 1,
                        weight: 0,
                        color: color
                      }
                    })
                  }
                ]
              });
              decorator.addTo(this.map!);
              this.rutasMarkers.push(decorator);
            } catch (e) {
              console.warn('Flechas no disponibles:', e);
            }
          }
        } catch (e) {
          console.error('Error al agregar línea:', e);
        }
      }
    });

    console.log('\n📊 RESUMEN DE CARGA:');
    console.log('  ✅ Orígenes:', rutasConOrigen, '| Destinos:', rutasConDestino);
    console.log('  ✅ Rutas con paradas georreferenciadas:', rutasConItinerario, '| Paradas:', paradasItinerario);
    console.log('  📍 Total markers:', this.rutasMarkers.length, '| Rutas procesadas:', this.rutasFiltradas.length);
    
    if (this.mostrarItinerarioCompleto && paradasItinerario === 0) {
      console.warn('  ℹ️ Las rutas importadas masivamente no tienen coordenadas en sus paradas.');
      console.warn('  ℹ️ Solo las rutas creadas manualmente con localidades vinculadas tienen coordenadas en el itinerario.');
    }
  }
}
