import { Component, EventEmitter, Input, Output, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import * as L from 'leaflet';
import { Localidad } from '../../models/localidad.model';
import { GeometriaService } from '../../services/geometria.service';

@Component({
  selector: 'app-mapa-localidad-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="mapa-modal-overlay" [class.fullscreen]="pantallaCompleta" (click)="onOverlayClick()">
      <div class="mapa-modal-container" [class.fullscreen]="pantallaCompleta" (click)="$event.stopPropagation()">
        <div class="mapa-modal-header">
          <div class="header-info">
            <mat-icon>map</mat-icon>
            <h2>{{ localidad?.nombre }}</h2>
          </div>
          <div class="header-actions">
            <button mat-icon-button (click)="togglePantallaCompleta()" 
                    [matTooltip]="pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'">
              <mat-icon>{{ pantallaCompleta ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
            </button>
            <button mat-icon-button (click)="cerrar()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
        
        <div class="mapa-modal-body">
          @if (cargando) {
            <div class="loading-overlay">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Cargando mapa...</p>
            </div>
          }
          
          <!-- Controles de capas -->
          @if (pantallaCompleta) {
            <div class="mapa-controles">
              <h4>Capas</h4>
              <div class="control-item">
                <label>
                  <input type="checkbox" [(ngModel)]="mostrarProvincia" (change)="toggleCapaProvincia()">
                  <span>Provincia</span>
                </label>
              </div>
              <div class="control-item">
                <label>
                  <input type="checkbox" [(ngModel)]="mostrarDistritoActual" (change)="toggleCapaDistritoActual()">
                  <span>Distrito Actual</span>
                </label>
              </div>
              <div class="control-item">
                <label>
                  <input type="checkbox" [(ngModel)]="mostrarDistritos" (change)="toggleCapaDistritos()">
                  <span>Todos los Distritos</span>
                </label>
              </div>
              <div class="control-item">
                <label>
                  <input type="checkbox" [(ngModel)]="mostrarCentrosPoblados" (change)="toggleCapaCentrosPoblados()">
                  <span>Centros Poblados</span>
                </label>
              </div>
              <div class="control-item">
                <label>
                  <input type="checkbox" [(ngModel)]="mostrarPuntosReferencia" (change)="togglePuntosReferencia()">
                  <span>Puntos de Referencia</span>
                </label>
              </div>
              <div class="control-item">
                <label>
                  <input type="checkbox" [(ngModel)]="mostrarEtiquetas" (change)="toggleEtiquetas()">
                  <span>Mostrar Nombres</span>
                </label>
              </div>

              <mat-divider style="margin: 12px 0;"></mat-divider>
              
              <h4>Edición</h4>
              @if (!modoEdicion) {
                <button mat-stroked-button class="control-button" (click)="iniciarEdicion()" [disabled]="!localidad?.coordenadas">
                  <mat-icon>edit_location</mat-icon>
                  Editar Ubicación
                </button>
                @if (tieneCoordenadasPersonalizadas()) {
                  <button mat-stroked-button color="warn" class="control-button" (click)="restaurarOriginal()">
                    <mat-icon>restore</mat-icon>
                    Restaurar Original
                  </button>
                }
              } @else {
                <button mat-flat-button color="accent" class="control-button" (click)="guardarEdicion()">
                  <mat-icon>save</mat-icon>
                  Guardar
                </button>
                <button mat-stroked-button class="control-button" (click)="cancelarEdicion()">
                  <mat-icon>cancel</mat-icon>
                  Cancelar
                </button>
              }
            </div>
          }
          
          <div id="mapa-localidad" class="mapa-container"></div>
        </div>
        
        <div class="mapa-modal-footer">
          <div class="coordenadas-info">
            @if (localidad?.coordenadas?.latitud && localidad?.coordenadas?.longitud) {
              <mat-icon>place</mat-icon>
              <span>
                Lat: {{ localidad?.coordenadas?.latitud | number:'1.6-6' }}, 
                Lng: {{ localidad?.coordenadas?.longitud | number:'1.6-6' }}
                @if (tieneCoordenadasPersonalizadas()) {
                  <mat-icon class="personalizada-icon" matTooltip="Coordenadas personalizadas">edit_location</mat-icon>
                }
              </span>
            } @else {
              <mat-icon>location_off</mat-icon>
              <span>Sin coordenadas definidas</span>
            }
          </div>
          <button mat-raised-button color="primary" (click)="cerrar()">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mapa-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;

      &.fullscreen {
        padding: 0;
      }
    }

    .mapa-modal-container {
      background: white;
      border-radius: 8px;
      width: 90vw;
      max-width: 1200px;
      height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

      &.fullscreen {
        width: 100vw;
        height: 100vh;
        max-width: none;
        border-radius: 0;
      }
    }

    .mapa-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;

      .header-info {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }

        h2 {
          margin: 0;
          font-size: 20px;
        }
      }

      .header-actions {
        display: flex;
        gap: 8px;

        button {
          color: white;
        }
      }
    }

    .mapa-modal-body {
      flex: 1;
      position: relative;
      overflow: hidden;

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        z-index: 1000;

        p {
          margin: 0;
          color: #666;
        }
      }

      .mapa-controles {
        position: absolute;
        top: 16px;
        right: 16px;
        background: white;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 220px;
        max-height: calc(100vh - 200px);
        overflow-y: auto;

        h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .control-item {
          margin-bottom: 8px;

          label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-size: 13px;
            color: #666;

            input[type="checkbox"] {
              cursor: pointer;
            }
          }
        }

        .control-button {
          width: 100%;
          margin-bottom: 8px;
          font-size: 12px;
          
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            margin-right: 4px;
          }
        }
      }

      .mapa-container {
        width: 100%;
        height: 100%;
      }

      :host ::ng-deep .label-tooltip {
        background: rgba(255, 255, 255, 0.92) !important;
        border: none !important;
        border-radius: 3px !important;
        padding: 2px 6px !important;
        font-size: 10px !important;
        font-weight: 600 !important;
        color: #333 !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
        white-space: nowrap !important;
        text-transform: uppercase !important;
        letter-spacing: 0.3px !important;
      }

      :host ::ng-deep .label-tooltip::before,
      :host ::ng-deep .label-tooltip::after {
        display: none !important;
      }

      :host ::ng-deep .leaflet-tooltip-left.label-tooltip::before,
      :host ::ng-deep .leaflet-tooltip-right.label-tooltip::before,
      :host ::ng-deep .leaflet-tooltip-top.label-tooltip::before,
      :host ::ng-deep .leaflet-tooltip-bottom.label-tooltip::before {
        display: none !important;
      }
    }

    .mapa-modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      background: #f5f5f5;

      .coordenadas-info {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
        font-size: 14px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        .personalizada-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: #ff9800;
        }
      }

      .footer-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    }

    :host ::ng-deep .marcador-editable {
      cursor: move !important;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }
  `]
})
export class MapaLocalidadModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() localidad: Localidad | null = null;
  @Output() cancelar = new EventEmitter<void>();
  @Output() coordenadasActualizadas = new EventEmitter<{latitud: number, longitud: number}>();

  // Modo edición
  modoEdicion = false;
  private marcadorEditable: L.Marker | null = null;
  private coordenadasTemporales: {latitud: number, longitud: number} | null = null;

  private mapa: L.Map | null = null;
  cargando = true;
  pantallaCompleta = false;
  
  // Control de capas
  mostrarProvincia = true;

  // Método helper para verificar coordenadas personalizadas
  tieneCoordenadasPersonalizadas(): boolean {
    return !!(this.localidad?.coordenadas as any)?.esPersonalizada;
  }
  mostrarDistritoActual = true;
  mostrarDistritos = false;  // Desactivado por defecto
  mostrarCentrosPoblados = false;  // Desactivado por defecto
  mostrarPuntosReferencia = false;  // Desactivado por defecto
  mostrarEtiquetas = false;  // Desactivado por defecto
  
  // Capas del mapa
  private provinciaLayer: L.GeoJSON | null = null;
  private distritoActualLayer: L.GeoJSON | null = null;
  private distritosLayer: L.GeoJSON | null = null;
  private centrosPobladosLayer: L.GeoJSON | null = null;
  private puntosReferenciaLayer: L.LayerGroup | null = null;

  constructor(private geometriaService: GeometriaService) {}

  ngOnInit() {
    // Configurar iconos de Leaflet
    const iconDefault = L.icon({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.inicializarMapa();
    }, 100);
  }

  ngOnDestroy() {
    if (this.mapa) {
      this.mapa.remove();
    }
  }

  private async inicializarMapa() {
    try {
      // Coordenadas por defecto (centro de Puno)
      const lat = this.localidad?.coordenadas?.latitud || -15.8402;
      const lng = this.localidad?.coordenadas?.longitud || -70.0219;

      // Crear mapa
      this.mapa = L.map('mapa-localidad').setView([lat, lng], 11);

      // Agregar capa base
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(this.mapa);

      // Cargar capas de geometrías
      await this.cargarCapas();

      // Agregar marcador si tiene coordenadas
      if (this.localidad?.coordenadas?.latitud && this.localidad?.coordenadas?.longitud) {
        const customIcon = L.icon({
          iconUrl: 'assets/marker-icon.png',
          iconRetinaUrl: 'assets/marker-icon-2x.png',
          shadowUrl: 'assets/marker-shadow.png',
          iconSize: [25, 41],        // Tamaño estándar de Leaflet
          iconAnchor: [12, 41],      // Punto de anclaje en la base del ícono
          popupAnchor: [1, -34],     // Punto donde aparece el popup
          shadowSize: [41, 41],      // Tamaño de la sombra
          shadowAnchor: [12, 41]     // Anclaje de la sombra
        });

        const marker = L.marker([
          this.localidad.coordenadas.latitud,
          this.localidad.coordenadas.longitud
        ], { icon: customIcon }).addTo(this.mapa);

        const popupContent = `
          <div style="padding: 12px;">
            <strong style="font-size: 18px; color: #667eea;">${this.localidad.nombre}</strong><br>
            <small style="color: #666;">
              ${this.localidad.distrito ? `Distrito: ${this.localidad.distrito}<br>` : ''}
              ${this.localidad.provincia ? `Provincia: ${this.localidad.provincia}<br>` : ''}
              ${this.localidad.ubigeo ? `UBIGEO: ${this.localidad.ubigeo}` : ''}
            </small>
          </div>
        `;

        marker.bindPopup(popupContent).openPopup();
      }

      this.cargando = false;
    } catch (error) {
      console.error('Error al inicializar mapa:', error);
      this.cargando = false;
    }
  }

  private async cargarCapas() {
    if (!this.localidad || !this.mapa) return;

    try {
      const provinciaNombre = this.localidad.provincia || 'PUNO';
      const distritoNombre = this.localidad.distrito;

      console.log('📦 Cargando geometrías desde API...');

      // Cargar solo el distrito actual por defecto
      await this.cargarDistritoActual(provinciaNombre, distritoNombre);

      // Cargar provincia desde el API
      this.geometriaService.obtenerProvincias('PUNO').subscribe({
        next: (provinciasData) => {
          console.log('✅ Provincias cargadas desde API:', provinciasData.features?.length);

          const provinciaFeature = provinciasData.features.filter((f: any) => {
            const nombre = f.properties.nombre || f.properties.NOMBPROV;
            return nombre?.toLowerCase() === provinciaNombre?.toLowerCase();
          });

          if (provinciaFeature.length > 0) {
            this.provinciaLayer = L.geoJSON({ type: 'FeatureCollection', features: provinciaFeature } as any, {
              style: {
                fillColor: '#667eea',
                weight: 3,
                opacity: 1,
                color: '#764ba2',
                fillOpacity: 0.1
              },
              onEachFeature: (feature, layer) => {
                const nombre = feature.properties.nombre || feature.properties.NOMBPROV;
                layer.bindPopup(`<strong style="color: #667eea;">${nombre}</strong><br><small>Provincia</small>`);
                
                // Agregar tooltip si mostrar etiquetas está activado
                if (this.mostrarEtiquetas) {
                  layer.bindTooltip(nombre, {
                    permanent: true,
                    direction: 'center',
                    className: 'label-tooltip'
                  });
                }
              }
            });

            if (this.mostrarProvincia && this.mapa) {
              this.provinciaLayer.addTo(this.mapa);
            }
          }
        },
        error: (error) => {
          console.error('❌ Error cargando provincia desde API:', error);
        }
      });

    } catch (error) {
      console.error('❌ Error al cargar capas:', error);
    }
  }

  // Métodos de control
  private async cargarDistritoActual(provinciaNombre: string, distritoNombre: string | undefined) {
    if (!distritoNombre) return;

    console.log('🔍 Cargando distrito actual:', { provinciaNombre, distritoNombre });

    // Usar el nuevo método que solo trae el distrito específico
    this.geometriaService.obtenerDistrito(distritoNombre, provinciaNombre, 'PUNO').subscribe({
      next: (distritosData) => {
        console.log('📦 Datos recibidos del API (distrito específico):', {
          totalDistritos: distritosData.features?.length,
          type: distritosData.type,
          distrito: distritosData.features?.[0]?.properties
        });

        if (distritosData.features && distritosData.features.length > 0) {
          console.log('✅ Distrito actual encontrado:', {
            cantidad: distritosData.features.length,
            distrito: distritosData.features[0]?.properties
          });

          this.distritoActualLayer = L.geoJSON(distritosData as any, {
            style: {
              fillColor: '#4caf50',
              weight: 3,
              opacity: 1,
              color: '#2e7d32',
              fillOpacity: 0.3
            },
            onEachFeature: (feature, layer) => {
              const nombre = feature.properties.nombre || feature.properties.NOMBDIST;
              layer.bindPopup(`<strong style="color: #4caf50;">${nombre}</strong><br><small>Distrito Actual</small>`);
              
              // Agregar tooltip si mostrar etiquetas está activado
              if (this.mostrarEtiquetas) {
                layer.bindTooltip(nombre, {
                  permanent: true,
                  direction: 'center',
                  className: 'label-tooltip'
                });
              }
            }
          });

          if (this.mostrarDistritoActual && this.mapa) {
            this.distritoActualLayer.addTo(this.mapa);
            console.log('🗺️ Capa de distrito actual agregada al mapa');
          }

          // Ajustar vista al distrito actual
          if (this.mapa && this.distritoActualLayer && this.distritoActualLayer.getBounds().isValid()) {
            this.mapa.fitBounds(this.distritoActualLayer.getBounds(), { padding: [50, 50] });
            console.log('🎯 Vista ajustada al distrito actual');
          }
        } else {
          console.warn('⚠️ No se encontró el distrito actual:', distritoNombre);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando distrito actual:', error);
      }
    });
  }

  private async cargarTodosLosDistritos(provinciaNombre: string, distritoNombre: string | undefined) {
    if (this.distritosLayer) {
      console.log('ℹ️ Distritos ya cargados, usando caché');
      return; // Ya están cargados
    }

    console.log('🔍 Cargando todos los distritos de:', provinciaNombre);

    this.geometriaService.obtenerDistritos(provinciaNombre, 'PUNO').subscribe({
      next: (distritosData) => {
        console.log('📦 Todos los distritos recibidos:', {
          total: distritosData.features?.length,
          nombres: distritosData.features?.map((f: any) => f.properties.nombre || f.properties.NOMBDIST)
        });

        const otrosDistritos = distritosData.features.filter((f: any) => {
          const nombre = f.properties.nombre || f.properties.NOMBDIST;
          return nombre?.toLowerCase() !== distritoNombre?.toLowerCase();
        });

        console.log('✅ Otros distritos filtrados:', {
          cantidad: otrosDistritos.length,
          distritoExcluido: distritoNombre
        });

        if (otrosDistritos.length > 0) {
          this.distritosLayer = L.geoJSON({ type: 'FeatureCollection', features: otrosDistritos } as any, {
            style: {
              fillColor: '#64b5f6',
              weight: 2,
              opacity: 1,
              color: '#1976d2',
              fillOpacity: 0.2
            },
            onEachFeature: (feature, layer) => {
              const nombre = feature.properties.nombre || feature.properties.NOMBDIST;
              layer.bindPopup(`<strong>${nombre}</strong>`);
              
              // Agregar tooltip si mostrar etiquetas está activado
              if (this.mostrarEtiquetas) {
                layer.bindTooltip(nombre, {
                  permanent: true,
                  direction: 'center',
                  className: 'label-tooltip'
                });
              }
            }
          });

          if (this.mostrarDistritos && this.mapa) {
            this.distritosLayer.addTo(this.mapa);
            console.log('🗺️ Capa de todos los distritos agregada al mapa');
          }
        } else {
          console.warn('⚠️ No hay otros distritos para mostrar');
        }
      },
      error: (error) => {
        console.error('❌ Error cargando todos los distritos:', error);
      }
    });
  }

  // Métodos de control
  togglePantallaCompleta() {
    this.pantallaCompleta = !this.pantallaCompleta;
    if (this.mapa) {
      setTimeout(() => this.mapa?.invalidateSize(), 100);
    }
  }

  toggleCapaProvincia() {
    if (this.provinciaLayer && this.mapa) {
      if (this.mostrarProvincia) {
        this.mapa.addLayer(this.provinciaLayer);
      } else {
        this.mapa.removeLayer(this.provinciaLayer);
      }
    }
  }

  toggleCapaDistritoActual() {
    if (this.distritoActualLayer && this.mapa) {
      if (this.mostrarDistritoActual) {
        this.mapa.addLayer(this.distritoActualLayer);
      } else {
        this.mapa.removeLayer(this.distritoActualLayer);
      }
    }
  }

  toggleCapaDistritos() {
    console.log('🔄 Toggle capa distritos:', { 
      mostrar: this.mostrarDistritos, 
      capaExiste: !!this.distritosLayer 
    });

    if (this.mostrarDistritos) {
      // Cargar distritos si no están cargados
      if (!this.distritosLayer && this.localidad) {
        const provinciaNombre = this.localidad.provincia || 'PUNO';
        const distritoNombre = this.localidad.distrito;
        console.log('⏳ Iniciando carga de distritos...');
        this.cargarTodosLosDistritos(provinciaNombre, distritoNombre);
      } else if (this.distritosLayer && this.mapa) {
        this.mapa.addLayer(this.distritosLayer);
        console.log('✅ Capa de distritos mostrada');
      }
    } else {
      if (this.distritosLayer && this.mapa) {
        this.mapa.removeLayer(this.distritosLayer);
        console.log('❌ Capa de distritos ocultada');
      }
    }
  }

  toggleCapaCentrosPoblados() {
    console.log('🔄 Toggle capa centros poblados:', { 
      mostrar: this.mostrarCentrosPoblados, 
      capaExiste: !!this.centrosPobladosLayer 
    });

    if (this.mostrarCentrosPoblados) {
      // Cargar centros poblados si no están cargados
      if (!this.centrosPobladosLayer && this.localidad) {
        const provinciaNombre = this.localidad.provincia || 'PUNO';
        const distritoNombre = this.localidad.distrito;
        console.log('⏳ Iniciando carga de centros poblados...');
        this.cargarCentrosPoblados(provinciaNombre, distritoNombre);
      } else if (this.centrosPobladosLayer && this.mapa) {
        this.mapa.addLayer(this.centrosPobladosLayer);
        console.log('✅ Capa de centros poblados mostrada');
      }
    } else {
      if (this.centrosPobladosLayer && this.mapa) {
        this.mapa.removeLayer(this.centrosPobladosLayer);
        console.log('❌ Capa de centros poblados ocultada');
      }
    }
  }

  private actualizarPuntosReferencia() {
    // Los puntos de referencia ahora se controlan solo con su checkbox
    // Este método ya no hace nada automático
  }

  private async cargarCentrosPoblados(provinciaNombre: string, distritoNombre: string | undefined) {
    if (this.centrosPobladosLayer || !distritoNombre) {
      console.log('ℹ️ Centros poblados ya cargados o sin distrito');
      return;
    }

    console.log('🔍 Cargando centros poblados de:', distritoNombre);

    this.geometriaService.obtenerCentrosPoblados(distritoNombre, provinciaNombre, 'PUNO').subscribe({
      next: (centrosData) => {
        console.log('📦 Centros poblados recibidos:', {
          total: centrosData.features?.length,
          primeros: centrosData.features?.slice(0, 3).map((f: any) => f.properties.nombre)
        });

        if (centrosData.features && centrosData.features.length > 0) {
          // Filtrar el centro poblado que coincide con la localidad actual
          // para evitar mostrar dos marcadores en el mismo lugar
          const centrosFiltrados = centrosData.features.filter((f: any) => {
            const nombreCP = f.properties.nombre?.toLowerCase();
            const nombreLocalidad = this.localidad?.nombre?.toLowerCase();
            
            // Si el nombre del centro poblado coincide con la localidad, no mostrarlo
            // porque ya hay un marcador azul grande en esa ubicación
            return nombreCP !== nombreLocalidad;
          });

          console.log('📊 Centros poblados filtrados:', {
            original: centrosData.features.length,
            filtrados: centrosFiltrados.length,
            excluido: this.localidad?.nombre
          });

          this.centrosPobladosLayer = L.geoJSON({ 
            type: 'FeatureCollection', 
            features: centrosFiltrados 
          } as any, {
            pointToLayer: (feature, latlng) => {
              return L.circleMarker(latlng, {
                radius: 3,
                fillColor: '#ff9800',
                color: '#f57c00',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.6
              });
            },
            onEachFeature: (feature, layer) => {
              const nombre = feature.properties.nombre;
              const popup = `
                <div style="padding: 8px;">
                  <strong style="color: #ff9800;">${nombre}</strong><br>
                  <small>Centro Poblado</small>
                </div>
              `;
              layer.bindPopup(popup);
              
              // Agregar tooltip discreto si mostrar etiquetas está activado
              if (this.mostrarEtiquetas) {
                layer.bindTooltip(nombre, {
                  permanent: true,
                  direction: 'top',
                  className: 'label-tooltip',
                  offset: [0, -5],
                  opacity: 0.9
                });
              }
            }
          });

          if (this.mostrarCentrosPoblados && this.mapa) {
            this.centrosPobladosLayer.addTo(this.mapa);
            console.log('🗺️ Capa de centros poblados agregada al mapa');
          }
        }
      },
      error: (error) => {
        console.error('❌ Error cargando centros poblados:', error);
      }
    });
  }

  private async cargarPuntosReferencia(provinciaNombre: string) {
    if (this.puntosReferenciaLayer) {
      console.log('ℹ️ Puntos de referencia ya cargados');
      return;
    }

    console.log('🔍 Cargando puntos de referencia de:', provinciaNombre);

    this.puntosReferenciaLayer = L.layerGroup();

    // Crear ícono personalizado para provincias (estrella grande)
    const iconoProvincia = L.divIcon({
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: #388e3c;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: white;
        ">★</div>
      `,
      className: 'punto-referencia-provincia',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Crear ícono personalizado para distritos (estrella pequeña)
    const iconoDistrito = L.divIcon({
      html: `
        <div style="
          width: 18px;
          height: 18px;
          background: #1976d2;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: white;
        ">★</div>
      `,
      className: 'punto-referencia-distrito',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    // Cargar puntos de provincias desde el API
    this.geometriaService.obtenerProvinciasPoint('PUNO').subscribe({
      next: (provinciasPointData) => {
        console.log('📦 Puntos de provincias recibidos:', provinciasPointData.features?.length);

        const provinciaPoint = provinciasPointData.features.find((f: any) => {
          const nombre = f.properties.nombre || f.properties['NOMBPROV'];
          return nombre?.toLowerCase() === provinciaNombre.toLowerCase();
        });

        if (provinciaPoint && this.puntosReferenciaLayer) {
          const coords = provinciaPoint.geometry.coordinates;
          const marker = L.marker([coords[1], coords[0]], {
            icon: iconoProvincia
          });
          
          const nombre = provinciaPoint.properties.nombre || provinciaPoint.properties['NOMBPROV'];
          marker.bindPopup(`
            <div style="text-align: center; padding: 8px;">
              <strong style="color: #388e3c; font-size: 16px;">★ ${nombre}</strong><br>
              <small style="color: #666;">Punto de Referencia - Provincia</small>
            </div>
          `);
          
          if (this.mostrarEtiquetas) {
            marker.bindTooltip(nombre, {
              permanent: true,
              direction: 'right',
              className: 'label-tooltip',
              offset: [15, 0]
            });
          }
          
          this.puntosReferenciaLayer.addLayer(marker);
          console.log('✅ Punto de provincia agregado:', nombre);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando puntos de provincias:', error);
      }
    });

    // Cargar puntos de distritos desde el API
    this.geometriaService.obtenerDistritosPoint(provinciaNombre, 'PUNO').subscribe({
      next: (distritosPointData) => {
        console.log('📦 Puntos de distritos recibidos:', {
          total: distritosPointData.features?.length,
          provincia: provinciaNombre
        });

        if (distritosPointData.features && distritosPointData.features.length > 0) {
          distritosPointData.features.forEach((distritoPoint: any) => {
            if (this.puntosReferenciaLayer) {
              const coords = distritoPoint.geometry.coordinates;
              const marker = L.marker([coords[1], coords[0]], {
                icon: iconoDistrito
              });
              
              const nombre = distritoPoint.properties.nombre || distritoPoint.properties['NOMBDIST'];
              marker.bindPopup(`
                <div style="text-align: center; padding: 8px;">
                  <strong style="color: #1976d2; font-size: 14px;">★ ${nombre}</strong><br>
                  <small style="color: #666;">Punto de Referencia - Distrito</small>
                </div>
              `);
              
              if (this.mostrarEtiquetas) {
                marker.bindTooltip(nombre, {
                  permanent: true,
                  direction: 'top',
                  className: 'label-tooltip',
                  offset: [0, -12]
                });
              }
              
              this.puntosReferenciaLayer.addLayer(marker);
            }
          });

          console.log('✅ Puntos de distritos agregados:', distritosPointData.features.length);

          // Agregar al mapa si el checkbox está activado
          if (this.mostrarPuntosReferencia && this.mapa && this.puntosReferenciaLayer) {
            this.mapa.addLayer(this.puntosReferenciaLayer);
            console.log('🗺️ Puntos de referencia agregados al mapa');
          }
        }
      },
      error: (error) => {
        console.error('❌ Error cargando puntos de distritos:', error);
      }
    });
  }

  togglePuntosReferencia() {
    console.log('🔄 Toggle puntos de referencia:', { 
      mostrar: this.mostrarPuntosReferencia, 
      capaExiste: !!this.puntosReferenciaLayer 
    });

    if (this.mostrarPuntosReferencia) {
      // Cargar puntos si no están cargados
      if (!this.puntosReferenciaLayer && this.localidad) {
        const provinciaNombre = this.localidad.provincia || 'PUNO';
        console.log('⏳ Iniciando carga de puntos de referencia...');
        this.cargarPuntosReferencia(provinciaNombre);
      } else if (this.puntosReferenciaLayer && this.mapa) {
        this.mapa.addLayer(this.puntosReferenciaLayer);
        console.log('✅ Capa de puntos de referencia mostrada');
      }
    } else {
      if (this.puntosReferenciaLayer && this.mapa) {
        this.mapa.removeLayer(this.puntosReferenciaLayer);
        console.log('❌ Capa de puntos de referencia ocultada');
      }
    }
  }

  toggleEtiquetas() {
    console.log('🔄 Toggle etiquetas:', this.mostrarEtiquetas);
    
    // Actualizar tooltips en todas las capas
    if (this.provinciaLayer) {
      this.actualizarTooltips(this.provinciaLayer);
    }
    if (this.distritoActualLayer) {
      this.actualizarTooltips(this.distritoActualLayer);
    }
    if (this.distritosLayer) {
      this.actualizarTooltips(this.distritosLayer);
    }
    if (this.centrosPobladosLayer) {
      this.actualizarTooltips(this.centrosPobladosLayer);
    }
    if (this.puntosReferenciaLayer) {
      this.actualizarTooltipsPuntos(this.puntosReferenciaLayer);
    }
  }

  private actualizarTooltipsPuntos(layerGroup: L.LayerGroup) {
    layerGroup.eachLayer((l: any) => {
      if (this.mostrarEtiquetas) {
        if (!l.getTooltip()) {
          const popup = l.getPopup();
          if (popup) {
            const content = popup.getContent() as string;
            const match = content.match(/<strong>(.*?)<\/strong>/);
            if (match) {
              const nombre = match[1];
              const direction = l instanceof L.Marker ? 'right' : 'top';
              const offset = l instanceof L.Marker ? [10, -15] : [0, -8];
              l.bindTooltip(nombre, {
                permanent: true,
                direction: direction as any,
                className: 'label-tooltip',
                offset: offset as any
              });
            }
          }
        }
      } else {
        if (l.getTooltip()) {
          l.unbindTooltip();
        }
      }
    });
  }

  private actualizarTooltips(layer: L.GeoJSON) {
    layer.eachLayer((l: any) => {
      if (this.mostrarEtiquetas) {
        const feature = l.feature;
        const nombre = feature.properties.nombre || feature.properties.NOMBDIST || feature.properties.NOMBPROV;
        if (nombre && !l.getTooltip()) {
          l.bindTooltip(nombre, {
            permanent: true,
            direction: 'center',
            className: 'label-tooltip'
          });
        }
      } else {
        if (l.getTooltip()) {
          l.unbindTooltip();
        }
      }
    });
  }

  onOverlayClick() {
    if (!this.pantallaCompleta) {
      this.cerrar();
    }
  }

  cerrar() {
    this.cancelar.emit();
  }

  // Métodos de edición de coordenadas
  iniciarEdicion() {
    if (!this.mapa) {
      console.error('❌ No se puede iniciar edición: falta mapa');
      return;
    }

    this.modoEdicion = true;
    console.log('🎯 Modo edición activado');

    // Guardar coordenadas actuales como temporales (si existen)
    if (this.localidad?.coordenadas) {
      this.coordenadasTemporales = {
        latitud: this.localidad.coordenadas.latitud,
        longitud: this.localidad.coordenadas.longitud
      };
    }

    // Crear ícono para el marcador editable (rojo para distinguirlo)
    const editIcon = L.divIcon({
      html: `
        <div style="
          width: 30px;
          height: 30px;
          background: #f44336;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 16px;
            font-weight: bold;
          ">📍</div>
        </div>
      `,
      className: 'marcador-edicion',
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });

    // Crear marcador editable en la posición actual o centro del mapa
    const lat = this.localidad?.coordenadas?.latitud || this.mapa.getCenter().lat;
    const lng = this.localidad?.coordenadas?.longitud || this.mapa.getCenter().lng;

    this.marcadorEditable = L.marker([lat, lng], {
      icon: editIcon,
      draggable: false  // No draggable, solo se mueve con clics
    }).addTo(this.mapa);

    // Popup con instrucciones (pero no lo abrimos automáticamente)
    this.marcadorEditable.bindPopup(`
      <div style="text-align: center; padding: 8px;">
        <strong style="color: #f44336;">Modo Edición</strong><br>
        <small>Haz clic en el mapa para mover el marcador</small>
      </div>
    `);

    // Actualizar coordenadas temporales
    this.coordenadasTemporales = { latitud: lat, longitud: lng };

    // Remover cualquier listener previo
    this.mapa.off('click');
    
    // Cerrar todos los popups al entrar en modo edición
    this.mapa.closePopup();
    
    // Deshabilitar popups de todas las capas durante la edición
    this.mapa.eachLayer((layer: any) => {
      if (layer.closePopup) {
        layer.closePopup();
      }
      if (layer.unbindPopup) {
        // Guardar el popup original para restaurarlo después
        if (!layer._originalPopup && layer.getPopup()) {
          layer._originalPopup = layer.getPopup();
          layer.unbindPopup();
        }
      }
    });
    
    // Usar getContainer() para capturar clics directamente en el contenedor del mapa
    // Esto evita que las capas GeoJSON bloqueen el evento
    const mapaContainer = this.mapa.getContainer();
    
    const clickHandler = (e: MouseEvent) => {
      console.log('🖱️ Clic detectado en contenedor del mapa');
      
      if (!this.modoEdicion || !this.marcadorEditable || !this.mapa) {
        console.warn('⚠️ Modo edición no activo o marcador no existe');
        return;
      }

      // Prevenir que el evento se propague a las capas
      e.stopPropagation();
      e.preventDefault();

      // Obtener las coordenadas del clic relativas al contenedor del mapa
      const rect = mapaContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Convertir a coordenadas geográficas
      const latlng = this.mapa.containerPointToLatLng([x, y]);
      
      console.log('📍 Coordenadas calculadas:', { lat: latlng.lat, lng: latlng.lng });
      
      // Mover el marcador a la nueva posición
      this.marcadorEditable.setLatLng(latlng);
      
      // Actualizar coordenadas temporales
      this.coordenadasTemporales = {
        latitud: latlng.lat,
        longitud: latlng.lng
      };
      
      console.log('✅ Marcador movido a:', this.coordenadasTemporales);
    };

    // Guardar referencia al handler para poder removerlo después
    (this as any)._clickHandler = clickHandler;
    
    // Agregar listener al contenedor con capture=true para interceptar antes que las capas
    mapaContainer.addEventListener('click', clickHandler, true);

    console.log('✅ Modo edición activado - Haz clic en el mapa para posicionar el marcador');
  }

  cancelarEdicion() {
    if (!this.mapa) return;

    this.modoEdicion = false;
    this.coordenadasTemporales = null;
    console.log('❌ Edición cancelada');

    // Remover marcador editable
    if (this.marcadorEditable) {
      this.mapa.removeLayer(this.marcadorEditable);
      this.marcadorEditable = null;
    }

    // Restaurar popups de las capas
    this.mapa.eachLayer((layer: any) => {
      if (layer._originalPopup) {
        layer.bindPopup(layer._originalPopup);
        delete layer._originalPopup;
      }
    });

    // Remover evento de clic del contenedor
    const mapaContainer = this.mapa.getContainer();
    const clickHandler = (this as any)._clickHandler;
    if (clickHandler) {
      mapaContainer.removeEventListener('click', clickHandler, true);
      (this as any)._clickHandler = null;
    }

    // Remover evento de clic del mapa también
    this.mapa.off('click');
  }

  async guardarEdicion() {
    if (!this.coordenadasTemporales || !this.localidad) {
      alert('No hay cambios para guardar');
      return;
    }

    console.log('💾 Guardando nuevas coordenadas:', this.coordenadasTemporales);

    // Emitir evento para que el componente padre guarde en BD
    this.coordenadasActualizadas.emit(this.coordenadasTemporales);

    // Actualizar coordenadas de la localidad
    if (this.localidad.coordenadas) {
      // Guardar coordenadas originales si no existen
      if (!this.localidad.coordenadas.esPersonalizada) {
        this.localidad.coordenadas.latitudOriginal = this.localidad.coordenadas.latitud;
        this.localidad.coordenadas.longitudOriginal = this.localidad.coordenadas.longitud;
        this.localidad.coordenadas.fuenteOriginal = 'INEI';
      }

      // Actualizar con nuevas coordenadas
      this.localidad.coordenadas.latitud = this.coordenadasTemporales.latitud;
      this.localidad.coordenadas.longitud = this.coordenadasTemporales.longitud;
      this.localidad.coordenadas.esPersonalizada = true;
      this.localidad.coordenadas.fechaModificacion = new Date().toISOString();
    } else {
      // Crear coordenadas si no existían
      this.localidad.coordenadas = {
        latitud: this.coordenadasTemporales.latitud,
        longitud: this.coordenadasTemporales.longitud,
        esPersonalizada: true,
        fechaModificacion: new Date().toISOString()
      };
    }

    // Remover marcador editable
    if (this.marcadorEditable) {
      this.mapa?.removeLayer(this.marcadorEditable);
      this.marcadorEditable = null;
    }

    // Restaurar popups de las capas
    if (this.mapa) {
      this.mapa.eachLayer((layer: any) => {
        if (layer._originalPopup) {
          layer.bindPopup(layer._originalPopup);
          delete layer._originalPopup;
        }
      });
    }

    // Remover evento de clic del contenedor
    if (this.mapa) {
      const mapaContainer = this.mapa.getContainer();
      const clickHandler = (this as any)._clickHandler;
      if (clickHandler) {
        mapaContainer.removeEventListener('click', clickHandler, true);
        (this as any)._clickHandler = null;
      }
    }

    // Remover evento de clic del mapa
    this.mapa?.off('click');

    // Crear nuevo marcador en la posición actualizada
    if (this.mapa) {
      const customIcon = L.icon({
        iconUrl: 'assets/marker-icon.png',
        iconRetinaUrl: 'assets/marker-icon-2x.png',
        shadowUrl: 'assets/marker-shadow.png',
        iconSize: [25, 41],        // Tamaño estándar de Leaflet
        iconAnchor: [12, 41],      // Punto de anclaje en la base del ícono
        popupAnchor: [1, -34],     // Punto donde aparece el popup
        shadowSize: [41, 41],      // Tamaño de la sombra
        shadowAnchor: [12, 41]     // Anclaje de la sombra
      });

      const marker = L.marker([
        this.coordenadasTemporales.latitud,
        this.coordenadasTemporales.longitud
      ], { icon: customIcon }).addTo(this.mapa);

      const popupContent = `
        <div style="padding: 12px;">
          <strong style="font-size: 18px; color: #667eea;">${this.localidad.nombre}</strong><br>
          <small style="color: #666;">
            ${this.localidad.distrito ? `Distrito: ${this.localidad.distrito}<br>` : ''}
            ${this.localidad.provincia ? `Provincia: ${this.localidad.provincia}<br>` : ''}
            ${this.localidad.ubigeo ? `UBIGEO: ${this.localidad.ubigeo}` : ''}
          </small>
          <div style="margin-top: 8px; padding: 4px; background: #fff3cd; border-radius: 4px;">
            <small style="color: #856404;">
              <strong>✏️ Coordenadas personalizadas</strong>
            </small>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent).openPopup();

      // Centrar mapa en la nueva posición
      this.mapa.setView([this.coordenadasTemporales.latitud, this.coordenadasTemporales.longitud], this.mapa.getZoom());
    }

    // Salir del modo edición
    this.modoEdicion = false;
    this.coordenadasTemporales = null;

    console.log('✅ Coordenadas guardadas');
  }

  async restaurarOriginal() {
    if (!this.localidad?.coordenadas?.latitudOriginal || !this.localidad?.coordenadas?.longitudOriginal) {
      alert('No hay coordenadas originales para restaurar');
      return;
    }

    const confirmar = confirm('¿Desea restaurar las coordenadas originales del INEI? Se perderán las coordenadas personalizadas.');
    if (!confirmar) return;

    console.log('🔄 Restaurando coordenadas originales');

    // Restaurar coordenadas originales
    const coordenadasOriginales = {
      latitud: this.localidad.coordenadas.latitudOriginal,
      longitud: this.localidad.coordenadas.longitudOriginal
    };

    this.localidad.coordenadas = {
      latitud: coordenadasOriginales.latitud,
      longitud: coordenadasOriginales.longitud,
      latitudOriginal: coordenadasOriginales.latitud,
      longitudOriginal: coordenadasOriginales.longitud,
      esPersonalizada: false,
      fuenteOriginal: 'INEI'
    };

    // Emitir evento
    this.coordenadasActualizadas.emit(coordenadasOriginales);

    // Actualizar marcador en el mapa
    if (this.mapa) {
      this.mapa.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          layer.setLatLng([coordenadasOriginales.latitud, coordenadasOriginales.longitud]);
          this.mapa?.setView([coordenadasOriginales.latitud, coordenadasOriginales.longitud], this.mapa.getZoom());
        }
      });
    }

    console.log('✅ Coordenadas originales restauradas');
    alert('Coordenadas originales del INEI restauradas correctamente');
  }
}
