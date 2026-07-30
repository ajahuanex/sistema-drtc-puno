import { Component, OnInit, Inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Ruta } from '../../models/ruta.model';
import * as L from 'leaflet';
import 'leaflet.markercluster';

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
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <div class="fullscreen-container">
      <div class="fs-header">
        <div class="fs-header-left">
          <mat-icon>map</mat-icon>
          <span>Mapa de Rutas</span>
          <span class="rutas-badge">{{ rutasFiltradas.length }} rutas</span>
        </div>
        <button mat-icon-button (click)="cerrar()" matTooltip="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="fs-body">
        <div class="fs-sidebar">
          <div class="fs-section">
            <h4>Capas</h4>
            <mat-checkbox [(ngModel)]="mostrarProvincias" (change)="toggleCapa('provincias')" class="fs-check">Provincias</mat-checkbox>
            <mat-checkbox [(ngModel)]="mostrarDistritos" (change)="toggleCapa('distritos')" class="fs-check">Distritos</mat-checkbox>
            <mat-checkbox [(ngModel)]="mostrarRutas" (change)="aplicarFiltros()" class="fs-check">Rutas</mat-checkbox>
          </div>

          <div class="fs-section">
            <h4>Filtros de Rutas</h4>
            <div class="fs-field">
              <label>Rutas Seleccionadas</label>
              <!-- Chips de rutas seleccionadas -->
              <div class="rutas-seleccionadas" *ngIf="rutasSeleccionadas.length > 0">
                <div class="ruta-chip" *ngFor="let ruta of rutasSeleccionadas">
                  <span>{{ ruta.origen }} → {{ ruta.destino }}</span>
                  <button type="button" (click)="removerRutaSeleccionada(ruta)" class="chip-remove">×</button>
                </div>
              </div>
              <!-- Campo de búsqueda -->
              <div class="ruta-autocomplete-container">
                <input type="text" 
                       [(ngModel)]="busquedaOrigenDestino" 
                       (input)="onBusquedaRutaChange($event)"
                       (focus)="mostrarSugerenciasRutas = true"
                       (blur)="ocultarSugerenciasConDelay()"
                       placeholder="Escriba para buscar por origen o destino (ej: jul, puno...)" 
                       class="fs-input"
                       autocomplete="off">
                
                <!-- Lista de sugerencias -->
                <div class="sugerencias-rutas" *ngIf="mostrarSugerenciasRutas && sugerenciasRutas.length > 0">
                  <div class="sugerencia-item" 
                       *ngFor="let sugerencia of sugerenciasRutas" 
                       (mousedown)="agregarRutaSeleccionada(sugerencia)">
                    <div class="ruta-origen-destino">
                      <strong>{{ sugerencia.origen }}</strong> → <strong>{{ sugerencia.destino }}</strong>
                    </div>
                    <div class="ruta-detalles">
                      <span class="ruta-empresa">{{ sugerencia.empresa }}</span>
                      <span class="ruta-count">{{ sugerencia.count }} rutas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="fs-field">
              <label>Empresa</label>
              <!-- Chips de empresas seleccionadas -->
              <div class="rutas-seleccionadas" *ngIf="empresasSeleccionadas.length > 0">
                <div class="ruta-chip empresa-chip-sel" *ngFor="let emp of empresasSeleccionadas">
                  <span>{{ emp.nombre }}</span>
                  <button type="button" (click)="removerEmpresaSeleccionada(emp)" class="chip-remove">×</button>
                </div>
              </div>
              <div class="ruta-autocomplete-container">
                <input type="text"
                       [(ngModel)]="busquedaEmpresa"
                       (input)="onBusquedaEmpresaChange($event)"
                       (focus)="mostrarSugerenciasEmpresas = true"
                       (blur)="ocultarSugerenciasConDelay()"
                       placeholder="Buscar por empresa o RUC..."
                       class="fs-input"
                       autocomplete="off">
                <div class="sugerencias-rutas" *ngIf="mostrarSugerenciasEmpresas && sugerenciasEmpresas.length > 0">
                  <div class="sugerencia-item"
                       *ngFor="let emp of sugerenciasEmpresas"
                       (mousedown)="agregarEmpresaSeleccionada(emp)">
                    <div class="ruta-origen-destino">
                      <strong>{{ emp.nombre }}</strong>
                    </div>
                    <div class="ruta-detalles">
                      <span class="ruta-count">RUC: {{ emp.ruc }}</span>
                      <span class="ruta-empresa">{{ emp.count }} rutas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="fs-field">
              <label>Estado</label>
              <select [(ngModel)]="filtroEstado" (change)="aplicarFiltros()" class="fs-select">
                <option value="">Todos</option>
                <option value="ACTIVA">Activa</option>
                <option value="INACTIVA">Inactiva</option>
                <option value="SUSPENDIDA">Suspendida</option>
                <option value="EN_TRAMITE">En Trámite</option>
              </select>
            </div>
          </div>

          <div class="fs-section fs-info">
            <div class="fs-info-row">
              <span>Rutas mostradas:</span>
              <strong>{{ rutasFiltradas.length }}</strong>
            </div>
            <div class="fs-info-row">
              <span>Total de rutas:</span>
              <strong>{{ rutas.length }}</strong>
            </div>
          </div>

          <div class="fs-section">
            <button mat-raised-button color="warn" (click)="limpiarFiltros()" style="width:100%; margin-bottom: 8px;">
              <mat-icon>clear</mat-icon> Limpiar filtros
            </button>
            <button mat-raised-button color="accent" (click)="mostrarReporteAvanzado()" style="width:100%;">
              <mat-icon>analytics</mat-icon> Reporte Avanzado
            </button>
          </div>
        </div>

        <div class="fs-map">
          <div id="leaflet-map-fullscreen" class="mapa-contenedor" style="width:100%; height:100%;"></div>
        </div>
      </div>

      <!-- Modal de Reporte Avanzado -->
      <div class="reporte-modal" *ngIf="mostrarModalReporte" (click)="cerrarReporteAvanzado()">
        <div class="reporte-content" (click)="$event.stopPropagation()">
          <div class="reporte-header">
            <h3><mat-icon>analytics</mat-icon> Reporte Avanzado de Rutas</h3>
            <button mat-icon-button (click)="cerrarReporteAvanzado()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="reporte-body">
            <div class="reporte-section">
              <h4>Resumen General</h4>
              <div class="reporte-stats">
                <div class="stat-card">
                  <div class="stat-number">{{ rutasFiltradas.length }}</div>
                  <div class="stat-label">Rutas Filtradas</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{ reporteData.empresasUnicas.length }}</div>
                  <div class="stat-label">Empresas</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{ reporteData.rutasUnicas.length }}</div>
                  <div class="stat-label">Rutas Únicas</div>
                </div>
              </div>
            </div>

            <div class="reporte-section">
              <h4>Empresas por Ruta</h4>
              <div class="empresas-por-ruta">
                <div class="ruta-empresa-item" *ngFor="let item of reporteData.empresasPorRuta">
                  <div class="ruta-info">
                    <strong>{{ item.origen }} → {{ item.destino }}</strong>
                    <span class="ruta-count">({{ item.empresas.length }} empresas)</span>
                  </div>
                  <div class="empresas-list">
                    <div class="empresa-chip" *ngFor="let empresa of item.empresas">
                      {{ empresa }}
                    </div>
                  </div>
                  <div class="resoluciones-list" *ngIf="item.resoluciones && item.resoluciones.length > 0">
                    <div class="resolucion-chip" *ngFor="let r of item.resoluciones">
                      📜 {{ r.nro }} <span class="res-tipo">{{ r.tipo }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="reporte-section">
              <h4>Ranking de Empresas</h4>
              <div class="ranking-empresas">
                <div class="empresa-ranking-item" *ngFor="let empresa of reporteData.rankingEmpresas">
                  <div class="empresa-name">{{ empresa.nombre }}</div>
                  <div class="empresa-count">{{ empresa.count }} rutas</div>
                  <div class="empresa-bar">
                    <div class="bar-fill" [style.width.%]="(empresa.count / reporteData.maxRutasPorEmpresa) * 100"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .fullscreen-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: white;
    }
    .fs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      flex-shrink: 0;
    }
    .fs-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 600;
    }
    .rutas-badge {
      background: rgba(255,255,255,0.25);
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
    }
    .fs-header button { color: white !important; }
    .fs-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .fs-sidebar {
      width: 260px;
      flex-shrink: 0;
      background: #fafafa;
      border-right: 1px solid #e0e0e0;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .fs-section {
      background: white;
      border-radius: 8px;
      padding: 12px;
      border: 1px solid #e8eaed;
      margin-bottom: 8px;
    }
    .fs-section h4 {
      margin: 0 0 10px 0;
      font-size: 12px;
      font-weight: 600;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .fs-check {
      display: block;
      margin-bottom: 4px;
      font-size: 13px;
    }
    .fs-field {
      margin-bottom: 10px;
    }
    .fs-field label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #555;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .fs-input, .fs-select {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #d0d0d0;
      border-radius: 6px;
      font-size: 12px;
      background: white;
      box-sizing: border-box;
    }
    .fs-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .fs-info-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #555;
    }
    .fs-info-row strong {
      color: #667eea;
      font-size: 16px;
    }
    .fs-map {
      flex: 1;
      min-width: 0;
      height: 100%;
      position: relative;
    }
    
    /* Estilos para rutas seleccionadas (chips) */
    .rutas-seleccionadas {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 8px;
    }
    
    .ruta-chip {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 16px;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .chip-remove {
      background: none;
      border: none;
      color: #1976d2;
      font-weight: bold;
      cursor: pointer;
      padding: 0;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .chip-remove:hover {
      background: #1976d2;
      color: white;
    }
    
    /* Estilos para autocompletado de rutas */
    .ruta-autocomplete-container {
      position: relative;
    }
    
    .sugerencias-rutas {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #d0d0d0;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      max-height: 200px;
      overflow-y: auto;
      margin-top: 2px;
    }
    
    .sugerencia-item {
      padding: 8px 10px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;
    }
    
    .sugerencia-item:hover {
      background-color: #f8f9fa;
    }
    
    .sugerencia-item:last-child {
      border-bottom: none;
    }
    
    .ruta-origen-destino {
      font-size: 13px;
      color: #333;
      margin-bottom: 2px;
    }
    
    .ruta-detalles {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #666;
    }
    
    .ruta-empresa {
      font-style: italic;
      max-width: 120px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .ruta-count {
      background: #f0f0f0;
      padding: 1px 4px;
      border-radius: 3px;
      font-weight: 500;
    }

    /* Estilos para modal de reporte avanzado */
    .reporte-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    }
    
    .reporte-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 800px;
      max-height: 80%;
      overflow-y: auto;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      animation: slideUp 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .reporte-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e0e0e0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px 12px 0 0;
    }
    
    .reporte-header h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
    }
    
    .reporte-header button {
      color: white !important;
    }
    
    .reporte-body {
      padding: 20px;
    }
    
    .reporte-section {
      margin-bottom: 24px;
    }
    
    .reporte-section h4 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 16px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 4px;
    }
    
    .reporte-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 12px;
      opacity: 0.9;
    }
    
    .empresas-por-ruta {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .ruta-empresa-item {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
    }
    
    .ruta-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .ruta-count {
      font-size: 12px;
      color: #666;
    }
    
    .empresas-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    
    .empresa-chip {
      background: white;
      border: 1px solid #ddd;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      color: #555;
    }
    
    .resoluciones-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }
    
    .resolucion-chip {
      background: #fff8e1;
      border: 1px solid #f9a825;
      padding: 3px 8px;
      border-radius: 10px;
      font-size: 11px;
      color: #e65100;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .res-tipo {
      background: #f9a825;
      color: white;
      padding: 1px 5px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
    }
    
    .ranking-empresas {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .empresa-ranking-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .empresa-name {
      flex: 1;
      font-size: 13px;
      color: #333;
    }
    
    .empresa-count {
      font-size: 12px;
      color: #666;
      min-width: 60px;
    }
    
    .empresa-bar {
      flex: 0 0 100px;
      height: 6px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
    }
    
    .empresa-chip-sel {
      background: #fce4ec;
      color: #c2185b;
    }
    
    .empresa-chip-sel .chip-remove {
      color: #c2185b;
    }
    
    .empresa-chip-sel .chip-remove:hover {
      background: #c2185b;
      color: white;
    }

    /* Animación gusanito para rutas de empresa — aplicada por JS vía SVG */
  `]
})
export class MapaRutasFullscreenComponent implements OnInit, AfterViewInit {

  private map: L.Map | null = null;
  private geoJsonLayers: L.GeoJSON[] = [];
  private lineasRutas: L.Polyline[] = [];
  private marcadores: L.Marker[] = [];
  private markerClusterGroup: any = null;
  public mapaInicializado = false;

  // Filtros
  busquedaOrigenDestino = '';
  filtroEstado = '';

  // Capas
  mostrarProvincias = true;
  mostrarDistritos = true;
  mostrarRutas = true;

  rutasFiltradas: Ruta[] = [];

  // Autocompletado y selección múltiple de rutas
  mostrarSugerenciasRutas = false;
  sugerenciasRutas: RutaSugerencia[] = [];
  rutasSeleccionadas: RutaSeleccionada[] = [];
  rutasOriginales: RutaSugerencia[] = [];
  private timeoutSugerencias: any;

  // Autocompletado y selección múltiple de empresas
  busquedaEmpresa = '';
  mostrarSugerenciasEmpresas = false;
  sugerenciasEmpresas: EmpresaSugerencia[] = [];
  empresasSeleccionadas: EmpresaSeleccionada[] = [];
  empresasOriginales: EmpresaSugerencia[] = [];

  // Reporte avanzado
  mostrarModalReporte = false;
  reporteData: ReporteAvanzado = {
    empresasUnicas: [],
    rutasUnicas: [],
    empresasPorRuta: [],
    rankingEmpresas: [],
    maxRutasPorEmpresa: 0
  };

  // Intervalos de animación gusanito
  private animacionIntervalos: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public rutas: Ruta[],
    private dialogRef: MatDialogRef<MapaRutasFullscreenComponent>
  ) {
    console.log('🔧 MapaRutasFullscreenComponent - rutas:', this.rutas?.length);
    this.rutasFiltradas = [...(this.rutas || [])];
    this.inicializarRutasAutocompletado();
    this.inicializarEmpresasAutocompletado();
  }

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.inicializarMapaFullscreen();
      this.aplicarFiltros();
    }, 500);
  }

  private inicializarMapaFullscreen() {
    try {
      const container = document.getElementById('leaflet-map-fullscreen') as HTMLElement;
      if (!container) {
        console.error('❌ Contenedor del mapa fullscreen no encontrado');
        return;
      }

      console.log('🗺️ Inicializando mapa fullscreen');

      this.map = L.map(container).setView([-15.5, -70.1], 8);
      this.mapaInicializado = true;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap',
        maxZoom: 19
      }).addTo(this.map);

      this.cargarPoligonosFullscreen();
      this.cargarPuntosRutasFullscreen();

    } catch (error) {
      console.error('❌ Error inicializando mapa fullscreen:', error);
    }
  }

  private cargarPoligonosFullscreen() {
    if (!this.map) return;

    console.log('🗺️ Intentando cargar polígonos fullscreen con geometrías completas');

    if (this.mostrarProvincias) {
      fetch('assets/geojson/puno-provincias-geometria.geojson')
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then(data => {
          if (!this.map) return;
          const layer = L.geoJSON(data, {
            style: { 
              color: '#3388ff', 
              weight: 2, 
              opacity: 0.8, 
              fillOpacity: 0.2,
              fillColor: '#3388ff'
            },
            onEachFeature: (feature, layer) => {
              const props = feature.properties || {};
              layer.bindPopup(`<strong>🏛️ ${props.NOMBPROV || props.nombre || 'Provincia'}</strong>`);
            }
          });
          layer.addTo(this.map!);
          (layer as any)._capaId = 'provincias';
          this.geoJsonLayers.push(layer);
          console.log('✅ Provincias (polígonos) cargadas');
        })
        .catch(error => {
          console.warn('⚠️ Error polígonos provincias, usando puntos:', error.message);
          this.cargarProvinciasPuntos();
        });
    }

    if (this.mostrarDistritos) {
      fetch('assets/geojson/puno-distritos-geometria.geojson')
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then(data => {
          if (!this.map) return;
          const layer = L.geoJSON(data, {
            style: { 
              color: '#ff7800', 
              weight: 1, 
              opacity: 0.6, 
              fillOpacity: 0.1,
              fillColor: '#ff7800'
            },
            onEachFeature: (feature, layer) => {
              const props = feature.properties || {};
              layer.bindPopup(`<strong>🏘️ ${props.NOMBDIST || props.nombre || 'Distrito'}</strong>`);
            }
          });
          layer.addTo(this.map!);
          (layer as any)._capaId = 'distritos';
          this.geoJsonLayers.push(layer);
          console.log('✅ Distritos (polígonos) cargados');
        })
        .catch(error => {
          console.warn('⚠️ Error polígonos distritos, usando puntos:', error.message);
          this.cargarDistritosPuntos();
        });
    }
  }

  private cargarProvinciasPuntos() {
    if (!this.map) return;
    fetch('assets/geojson/puno-provincias-point.geojson')
      .then(response => response.json())
      .then(data => {
        if (!this.map) return;
        const layer = L.geoJSON(data, {
          onEachFeature: (feature, layer) => {
            const props = feature.properties || {};
            layer.bindPopup(`<strong>📍 ${props.NOMBPROV || 'Provincia'}</strong>`);
          }
        });
        layer.addTo(this.map);
        (layer as any)._capaId = 'provincias';
        this.geoJsonLayers.push(layer);
        console.log('✅ Provincias (puntos) cargadas como fallback');
      })
      .catch(console.warn);
  }

  private cargarDistritosPuntos() {
    if (!this.map) return;
    fetch('assets/geojson/puno-distritos-point.geojson')
      .then(response => response.json())
      .then(data => {
        if (!this.map) return;
        const layer = L.geoJSON(data, {
          onEachFeature: (feature, layer) => {
            const props = feature.properties || {};
            layer.bindPopup(`<strong>🏘️ ${props.NOMBDIST || 'Distrito'}</strong>`);
          }
        });
        layer.addTo(this.map);
        (layer as any)._capaId = 'distritos';
        this.geoJsonLayers.push(layer);
        console.log('✅ Distritos (puntos) cargados como fallback');
      })
      .catch(console.warn);
  }

  private cargarPuntosRutasFullscreen() {
    if (!this.map || !this.mapaInicializado || !this.mostrarRutas) {
      this.limpiarMarcadoresYLineas();
      return;
    }
    
    if (!this.rutasFiltradas?.length) {
      this.limpiarMarcadoresYLineas();
      return;
    }

    console.log(`🗺️ Cargando ${this.rutasFiltradas.length} rutas filtradas`);

    this.limpiarMarcadoresYLineas();
    this.limpiarAnimaciones();

    const modoGusanito = this.empresasSeleccionadas.length > 0;
    const rutasParaDibujar: { latOrig: number; lngOrig: number; latDest: number; lngDest: number; color: string; popupContent: string; index: number }[] = [];

    this.markerClusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
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

    // Un marcador por ruta — sin deduplicar, para que el cluster cuente correctamente
    this.rutasFiltradas.forEach((ruta, index) => {
      const latOrig = ruta.origen?.coordenadas?.latitud;
      const lngOrig = ruta.origen?.coordenadas?.longitud;
      const latDest = ruta.destino?.coordenadas?.latitud;
      const lngDest = ruta.destino?.coordenadas?.longitud;

      const tieneOrigen = latOrig != null && lngOrig != null && !isNaN(Number(latOrig)) && !isNaN(Number(lngOrig));
      const tieneDestino = latDest != null && lngDest != null && !isNaN(Number(latDest)) && !isNaN(Number(lngDest));

      if (tieneOrigen) {
        const marker = L.marker([Number(latOrig), Number(lngOrig)])
          .bindPopup(`<strong>🚀 ORIGEN</strong><br>${ruta.origen!.nombre}<br><small>${ruta.codigoRuta}</small>`);
        this.markerClusterGroup.addLayer(marker);
        this.marcadores.push(marker);
      }

      if (tieneDestino) {
        const marker = L.marker([Number(latDest), Number(lngDest)])
          .bindPopup(`<strong>🏁 DESTINO</strong><br>${ruta.destino!.nombre}<br><small>${ruta.codigoRuta}</small>`);
        this.markerClusterGroup.addLayer(marker);
        this.marcadores.push(marker);
      }

      if (tieneOrigen && tieneDestino && this.map) {
        const color = modoGusanito
          ? `hsl(${(index * 60) % 360}, 90%, 50%)`
          : `hsl(${(index * 137.5) % 360}, 70%, 45%)`;

        const popupContent = `<strong>🛣️ ${ruta.codigoRuta}</strong><br>${ruta.origen!.nombre} → ${ruta.destino!.nombre}<br><small>${this.obtenerNombreEmpresa(ruta)}</small>`;

        if (modoGusanito) {
          // Acumular para dibujar en dos fases: pistas primero, gusanitos después
          rutasParaDibujar.push({
            latOrig: Number(latOrig), lngOrig: Number(lngOrig),
            latDest: Number(latDest), lngDest: Number(lngDest),
            color, popupContent, index
          });
        } else {
          // Línea recta para vista general
          const line = L.polyline([
            [Number(latOrig), Number(lngOrig)],
            [Number(latDest), Number(lngDest)]
          ], { color, weight: 3, opacity: 0.75 }).bindPopup(popupContent);
          line.addTo(this.map!);
          this.lineasRutas.push(line);
        }
      }
    });

    if (modoGusanito && rutasParaDibujar.length > 0) {
      // Dibuja todas las pistas primero y luego todos los gusanitos encima
      this.trazarRutasConPrioridad(rutasParaDibujar);
    }

    if (this.markerClusterGroup && this.map) {
      this.map.addLayer(this.markerClusterGroup);
    }

    console.log(`✅ ${this.marcadores.length} marcadores y ${this.lineasRutas.length} líneas agregadas`);
  }

  aplicarFiltros() {
    console.log('🔍 Aplicando filtros fullscreen...');
    
    this.rutasFiltradas = this.rutas.filter(ruta => {
      // Filtrar por rutas seleccionadas si hay alguna
      if (this.rutasSeleccionadas.length > 0) {
        const coincideRutaSeleccionada = this.rutasSeleccionadas.some(seleccionada =>
          (ruta.origen?.nombre === seleccionada.origen && ruta.destino?.nombre === seleccionada.destino)
        );
        if (!coincideRutaSeleccionada) return false;
      }

      // Filtrar por búsqueda directa (si no hay rutas seleccionadas)
      if (this.busquedaOrigenDestino && this.rutasSeleccionadas.length === 0) {
        const b = this.busquedaOrigenDestino.toLowerCase();
        const o = (ruta.origen?.nombre || '').toLowerCase();
        const d = (ruta.destino?.nombre || '').toLowerCase();
        if (!o.includes(b) && !d.includes(b) && !(o + '-' + d).includes(b) && !(d + '-' + o).includes(b)) {
          return false;
        }
      }

      // Filtro por empresa (chips o texto libre)
      if (this.empresasSeleccionadas.length > 0) {
        const razon = typeof ruta.empresa?.razonSocial === 'string'
          ? ruta.empresa.razonSocial
          : (ruta.empresa?.razonSocial as any)?.principal || '';
        const ruc = (ruta.empresa as any)?.ruc || '';
        const coincideEmpresa = this.empresasSeleccionadas.some(e =>
          razon.toLowerCase().includes(e.nombre.toLowerCase()) ||
          ruc === e.ruc
        );
        if (!coincideEmpresa) return false;
      }

      // Filtro por estado
      if (this.filtroEstado && ruta.estado !== this.filtroEstado) return false;

      return true;
    });

    console.log(`🔍 Filtros aplicados: ${this.rutasFiltradas.length}/${this.rutas.length} rutas`);
    console.log(`📍 Rutas seleccionadas: ${this.rutasSeleccionadas.length}`);

    if (this.map && this.mapaInicializado) {
      this.cargarPuntosRutasFullscreen();
    }
  }

  toggleCapa(tipoCapa: string) {
    console.log(`🔄 Alternando capa: ${tipoCapa}`);
    
    if (!this.map) return;

    this.geoJsonLayers = this.geoJsonLayers.filter(layer => {
      if ((layer as any)._capaId === tipoCapa) {
        this.map?.removeLayer(layer);
        return false;
      }
      return true;
    });

    if (tipoCapa === 'provincias' && this.mostrarProvincias) {
      this.cargarCapaProvincias();
    } else if (tipoCapa === 'distritos' && this.mostrarDistritos) {
      this.cargarCapaDistritos();
    }
  }

  private cargarCapaProvincias() {
    if (!this.map) return;
    
    fetch('assets/geojson/puno-provincias-geometria.geojson')
      .then(response => response.ok ? response.json() : Promise.reject('Error geometría'))
      .then(data => {
        if (!this.map) return;
        const layer = L.geoJSON(data, {
          style: { color: '#3388ff', weight: 2, opacity: 0.8, fillOpacity: 0.2, fillColor: '#3388ff' },
          onEachFeature: (feature, layer) => {
            const props = feature.properties || {};
            layer.bindPopup(`<strong>🏛️ ${props.NOMBPROV || 'Provincia'}</strong>`);
          }
        });
        layer.addTo(this.map);
        (layer as any)._capaId = 'provincias';
        this.geoJsonLayers.push(layer);
      })
      .catch(() => this.cargarProvinciasPuntos());
  }

  private cargarCapaDistritos() {
    if (!this.map) return;
    
    fetch('assets/geojson/puno-distritos-geometria.geojson')
      .then(response => response.ok ? response.json() : Promise.reject('Error geometría'))
      .then(data => {
        if (!this.map) return;
        const layer = L.geoJSON(data, {
          style: { color: '#ff7800', weight: 1, opacity: 0.6, fillOpacity: 0.1, fillColor: '#ff7800' },
          onEachFeature: (feature, layer) => {
            const props = feature.properties || {};
            layer.bindPopup(`<strong>🏘️ ${props.NOMBDIST || 'Distrito'}</strong>`);
          }
        });
        layer.addTo(this.map);
        (layer as any)._capaId = 'distritos';
        this.geoJsonLayers.push(layer);
      })
      .catch(() => this.cargarDistritosPuntos());
  }

  private limpiarMarcadoresYLineas() {
    if (this.markerClusterGroup && this.map) {
      this.map.removeLayer(this.markerClusterGroup);
    }
    
    this.marcadores.forEach(m => {
      if (this.map) {
        this.map.removeLayer(m);
      }
    });
    this.marcadores = [];
    
    this.lineasRutas.forEach(l => {
      if (this.map) {
        this.map.removeLayer(l);
      }
    });
    this.lineasRutas = [];
  }

  limpiarFiltros() {
    console.log('🧹 Limpiando filtros fullscreen');
    this.busquedaOrigenDestino = '';
    this.filtroEstado = '';
    this.rutasSeleccionadas = [];
    this.sugerenciasRutas = [];
    this.mostrarSugerenciasRutas = false;
    this.empresasSeleccionadas = [];
    this.busquedaEmpresa = '';
    this.sugerenciasEmpresas = [];
    this.mostrarSugerenciasEmpresas = false;
    this.aplicarFiltros();
  }

  // Métodos para autocompletado y selección múltiple de rutas
  private inicializarRutasAutocompletado() {
    if (!this.rutas || this.rutas.length === 0) return;

    // Crear un mapa de combinaciones origen-destino únicas con todas las empresas
    const rutasMap = new Map<string, RutaSugerencia>();
    
    this.rutas.forEach(ruta => {
      const origen = ruta.origen?.nombre || 'Sin origen';
      const destino = ruta.destino?.nombre || 'Sin destino';
      const clave = `${origen}→${destino}`;
      const empresa = this.obtenerNombreEmpresa(ruta);
      
      if (rutasMap.has(clave)) {
        const existing = rutasMap.get(clave)!;
        existing.count++;
        if (!existing.empresas.includes(empresa)) {
          existing.empresas.push(empresa);
          existing.empresa = existing.empresas.length > 1 ? `${existing.empresas.length} empresas` : existing.empresas[0];
        }
      } else {
        rutasMap.set(clave, {
          origen,
          destino,
          empresa,
          empresas: [empresa],
          count: 1,
          rutaCompleta: ruta
        });
      }
    });

    this.rutasOriginales = Array.from(rutasMap.values());
    console.log('📋 Rutas únicas para autocompletado:', this.rutasOriginales.length);
  }

  private obtenerNombreEmpresa(ruta: Ruta): string {
    if (!ruta.empresa?.razonSocial) return 'Sin empresa';
    
    if (typeof ruta.empresa.razonSocial === 'string') {
      return ruta.empresa.razonSocial;
    }
    
    return (ruta.empresa.razonSocial as any)?.principal || 'Sin empresa';
  }

  onBusquedaRutaChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const valor = input.value.toLowerCase().trim();

    if (valor.length < 2) {
      this.sugerenciasRutas = [];
      this.mostrarSugerenciasRutas = false;
      return;
    }

    // Buscar por origen o destino, excluyendo las ya seleccionadas
    this.sugerenciasRutas = this.rutasOriginales.filter(ruta => {
      const coincide = ruta.origen.toLowerCase().includes(valor) ||
                       ruta.destino.toLowerCase().includes(valor);
      const yaSeleccionada = this.rutasSeleccionadas.some(
        s => s.origen === ruta.origen && s.destino === ruta.destino
      );
      return coincide && !yaSeleccionada;
    }).slice(0, 8);

    this.mostrarSugerenciasRutas = this.sugerenciasRutas.length > 0;
  }

  agregarRutaSeleccionada(sugerencia: RutaSugerencia) {
    // Verificar que no esté ya seleccionada
    const yaSeleccionada = this.rutasSeleccionadas.some(r =>
      r.origen === sugerencia.origen && r.destino === sugerencia.destino
    );

    if (!yaSeleccionada) {
      this.rutasSeleccionadas.push({ origen: sugerencia.origen, destino: sugerencia.destino });
    }

    // Limpiar campo y cerrar lista para poder seguir buscando
    this.busquedaOrigenDestino = '';
    this.sugerenciasRutas = [];
    this.mostrarSugerenciasRutas = false;

    this.aplicarFiltros();
  }

  removerRutaSeleccionada(ruta: RutaSeleccionada) {
    this.rutasSeleccionadas = this.rutasSeleccionadas.filter(r => 
      !(r.origen === ruta.origen && r.destino === ruta.destino)
    );
    this.aplicarFiltros();
  }

  mostrarReporteAvanzado() {
    this.generarReporteAvanzado();
    this.mostrarModalReporte = true;
  }

  cerrarReporteAvanzado() {
    this.mostrarModalReporte = false;
  }

  private generarReporteAvanzado() {
    const empresasSet = new Set<string>();
    const rutasUnicasSet = new Set<string>();
    const empresasPorRutaMap = new Map<string, Set<string>>();
    const resolucionesPorRutaMap = new Map<string, Map<string, string>>();  // rutaKey -> Map<nro, tipo>
    const conteoEmpresas = new Map<string, number>();

    // Analizar rutas filtradas
    this.rutasFiltradas.forEach(ruta => {
      const empresa = this.obtenerNombreEmpresa(ruta);
      const rutaKey = `${ruta.origen?.nombre || 'Sin origen'} → ${ruta.destino?.nombre || 'Sin destino'}`;
      
      empresasSet.add(empresa);
      rutasUnicasSet.add(rutaKey);
      
      // Empresas por ruta
      if (!empresasPorRutaMap.has(rutaKey)) {
        empresasPorRutaMap.set(rutaKey, new Set());
      }
      empresasPorRutaMap.get(rutaKey)!.add(empresa);
      
      // Resoluciones por ruta
      if (ruta.resolucion?.nroResolucion) {
        if (!resolucionesPorRutaMap.has(rutaKey)) {
          resolucionesPorRutaMap.set(rutaKey, new Map());
        }
        const nro = ruta.resolucion.nroResolucion;
        const tipo = ruta.resolucion.tipoResolucion || 'N/A';
        resolucionesPorRutaMap.get(rutaKey)!.set(nro, tipo);
      }
      
      // Conteo de empresas
      conteoEmpresas.set(empresa, (conteoEmpresas.get(empresa) || 0) + 1);
    });

    // Empresas por ruta (con resoluciones)
    const empresasPorRuta = Array.from(empresasPorRutaMap.entries()).map(([ruta, empresas]) => {
      const [origen, destino] = ruta.split(' → ');
      const resolucionesMap = resolucionesPorRutaMap.get(ruta) || new Map();
      const resoluciones = Array.from(resolucionesMap.entries()).map(([nro, tipo]) => ({ nro, tipo }));
      return {
        origen,
        destino,
        empresas: Array.from(empresas).sort(),
        resoluciones
      };
    }).sort((a, b) => b.empresas.length - a.empresas.length);

    // Ranking de empresas
    const rankingEmpresas = Array.from(conteoEmpresas.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);

    this.reporteData = {
      empresasUnicas: Array.from(empresasSet).sort(),
      rutasUnicas: Array.from(rutasUnicasSet).sort(),
      empresasPorRuta,
      rankingEmpresas,
      maxRutasPorEmpresa: Math.max(...rankingEmpresas.map(e => e.count), 1)
    };
  }

  ocultarSugerenciasConDelay() {
    this.timeoutSugerencias = setTimeout(() => {
      this.mostrarSugerenciasRutas = false;
      this.mostrarSugerenciasEmpresas = false;
    }, 200);
  }

  // ── Autocompletado de empresas ──────────────────────────────────────

  private inicializarEmpresasAutocompletado() {
    if (!this.rutas || this.rutas.length === 0) return;

    const empresasMap = new Map<string, EmpresaSugerencia>();

    this.rutas.forEach(ruta => {
      const nombre = this.obtenerNombreEmpresa(ruta);
      const ruc = (ruta.empresa as any)?.ruc || '';
      const clave = ruc || nombre;

      if (empresasMap.has(clave)) {
        empresasMap.get(clave)!.count++;
      } else {
        empresasMap.set(clave, { nombre, ruc, count: 1 });
      }
    });

    this.empresasOriginales = Array.from(empresasMap.values())
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    console.log('📋 Empresas para autocompletado:', this.empresasOriginales.length);
  }

  onBusquedaEmpresaChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const valor = input.value.toLowerCase().trim();

    if (valor.length < 2) {
      this.sugerenciasEmpresas = [];
      this.mostrarSugerenciasEmpresas = false;
      return;
    }

    this.sugerenciasEmpresas = this.empresasOriginales.filter(emp => {
      const coincide = emp.nombre.toLowerCase().includes(valor) ||
                       emp.ruc.includes(valor);
      const yaSeleccionada = this.empresasSeleccionadas.some(
        s => s.nombre === emp.nombre && s.ruc === emp.ruc
      );
      return coincide && !yaSeleccionada;
    }).slice(0, 8);

    this.mostrarSugerenciasEmpresas = this.sugerenciasEmpresas.length > 0;
  }

  agregarEmpresaSeleccionada(emp: EmpresaSugerencia) {
    const yaSeleccionada = this.empresasSeleccionadas.some(
      e => e.nombre === emp.nombre && e.ruc === emp.ruc
    );
    if (!yaSeleccionada) {
      this.empresasSeleccionadas.push({ nombre: emp.nombre, ruc: emp.ruc });
    }
    this.busquedaEmpresa = '';
    this.sugerenciasEmpresas = [];
    this.mostrarSugerenciasEmpresas = false;
    this.aplicarFiltros();
  }

  removerEmpresaSeleccionada(emp: EmpresaSeleccionada) {
    this.empresasSeleccionadas = this.empresasSeleccionadas.filter(
      e => !(e.nombre === emp.nombre && e.ruc === emp.ruc)
    );
    this.aplicarFiltros();
  }

  // ── Gusanito animado ─────────────────────────────────────────────────

  private animarGusanito(line: L.Polyline, index: number) {
    const el = (line as any)._path as SVGPathElement | undefined;
    if (!el) return;

    // Segmento visible: 8-16px, gap aleatorio amplio: 25-70px
    const dash = 8 + Math.floor(Math.random() * 9);
    const gap  = 25 + Math.floor(Math.random() * 46);
    el.style.strokeDasharray = `${dash} ${gap}`;
    el.style.transition = 'none';

    // Desfase de posición inicial variado
    let offset = Math.floor(Math.random() * 600);

    // Velocidad un poco más rápida: 0.7 - 1.4 px por tick
    const speed = 0.7 + Math.random() * 0.7;

    // ← Cada gusanito arranca en un momento aleatorio (0 - 2500ms)
    const startDelay = Math.floor(Math.random() * 2500);

    const to = setTimeout(() => {
      const step = () => {
        offset = (offset - speed + 6000) % 6000;
        el.style.strokeDashoffset = String(offset);
      };
      const id = setInterval(step, 40); // 40ms ≈ 25fps
      this.animacionIntervalos.push(id);
    }, startDelay);

    // Guardar también el timeout para limpiarlo si se cierra antes de arrancar
    this.animacionIntervalos.push(to as any);
  }

  // ── Routing por caminos reales (OSRM) ────────────────────────────────

  // Devuelve la geometría (latlngs) de la ruta por carretera o línea recta como fallback
  private obtenerGeometriaRuta(
    latOrig: number, lngOrig: number,
    latDest: number, lngDest: number
  ): Promise<[number, number][]> {
    const url = `https://router.project-osrm.org/route/v1/driving/${lngOrig},${latOrig};${lngDest},${latDest}?overview=full&geometries=geojson`;

    return fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(`OSRM HTTP ${r.status}`))
      .then(data => {
        const coords: [number, number][] = data?.routes?.[0]?.geometry?.coordinates;
        if (!coords || coords.length === 0) throw new Error('Sin coordenadas OSRM');
        return coords.map(([lng, lat]): [number, number] => [lat, lng]);
      })
      .catch(err => {
        console.warn(`⚠️ OSRM falló (${err}), usando línea recta`);
        return [[latOrig, lngOrig], [latDest, lngDest]] as [number, number][];
      });
  }

  private trazarRutasConPrioridad(
    rutas: { latOrig: number; lngOrig: number; latDest: number; lngDest: number; color: string; popupContent: string; index: number }[]
  ) {
    if (!this.map || rutas.length === 0) return;

    // 1. Obtener todas las geometrías en paralelo
    const promesas = rutas.map(r =>
      this.obtenerGeometriaRuta(r.latOrig, r.lngOrig, r.latDest, r.lngDest)
    );

    Promise.all(promesas).then(geometrias => {
      if (!this.map) return;

      // 2. Primero dibujar TODAS las pistas (capa inferior)
      geometrias.forEach(latlngs => {
        const pista = L.polyline(latlngs, {
          color: '#000000',
          weight: 7,
          opacity: 0.35
        });
        pista.addTo(this.map!);
        this.lineasRutas.push(pista);
      });

      // 3. Luego dibujar TODOS los gusanitos encima
      geometrias.forEach((latlngs, i) => {
        if (!this.map) return;
        const { color, popupContent, index } = rutas[i];
        const line = L.polyline(latlngs, {
          color,
          weight: 5,
          opacity: 0.9,
          dashArray: '12 6',
          dashOffset: '0'
        }).bindPopup(popupContent);
        line.addTo(this.map);
        this.lineasRutas.push(line);
        setTimeout(() => this.animarGusanito(line, index), 50);
      });

      console.log(`✅ ${geometrias.length} rutas dibujadas (pistas → gusanitos)`);
    });
  }

  private limpiarAnimaciones() {
    this.animacionIntervalos.forEach(id => {
      clearInterval(id);
      clearTimeout(id); // cubre los timeouts pendientes
    });
    this.animacionIntervalos = [];
  }

  cerrar() {
    console.log('🚪 Cerrando mapa fullscreen');
    if (this.timeoutSugerencias) {
      clearTimeout(this.timeoutSugerencias);
    }
    this.limpiarAnimaciones();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.mapaInicializado = false;
    this.dialogRef.close();
  }
}

// Interfaz para las sugerencias de rutas
interface RutaSugerencia {
  origen: string;
  destino: string;
  empresa: string;
  empresas: string[];
  count: number;
  rutaCompleta: Ruta;
}

interface RutaSeleccionada {
  origen: string;
  destino: string;
}

interface EmpresaSugerencia {
  nombre: string;
  ruc: string;
  count: number;
}

interface EmpresaSeleccionada {
  nombre: string;
  ruc: string;
}

interface ReporteAvanzado {
  empresasUnicas: string[];
  rutasUnicas: string[];
  empresasPorRuta: { origen: string; destino: string; empresas: string[]; resoluciones: { nro: string; tipo: string }[] }[];
  rankingEmpresas: { nombre: string; count: number }[];
  maxRutasPorEmpresa: number;
}