import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import * as L from 'leaflet';
import { Localidad, TipoLocalidad, NivelTerritorial } from '../../models/localidad.model';

// Fix para iconos de Leaflet en Angular
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png',
});

@Component({
  selector: 'app-mapa-localidades',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card class="mapa-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>map</mat-icon>
          Mapa de Localidades - Puno
        </mat-card-title>
        <div class="mapa-controles">
          <button mat-icon-button 
                  (click)="centrarEnPuno()" 
                  matTooltip="Centrar en Puno">
            <mat-icon>my_location</mat-icon>
          </button>
          
          <button mat-icon-button 
                  (click)="toggleCapas()" 
                  matTooltip="Alternar capas">
            <mat-icon>layers</mat-icon>
          </button>
          
          <button mat-icon-button 
                  (click)="ajustarVista()" 
                  matTooltip="Ajustar vista a localidades">
            <mat-icon>zoom_out_map</mat-icon>
          </button>
        </div>
      </mat-card-header>
      
      <mat-card-content>
        <!-- Loading -->
        <div class="loading-overlay" *ngIf="cargandoMapa()">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando mapa...</p>
        </div>
        
        <!-- Mapa -->
        <div #mapaContainer 
             class="mapa-container" 
             [class.loading]="cargandoMapa()">
        </div>
        
        <!-- Leyenda -->
        <div class="leyenda-container" *ngIf="mostrarLeyenda">
          <div class="leyenda-titulo">
            <mat-icon>info</mat-icon>
            Leyenda
          </div>
          <div class="leyenda-items">
            <div class="leyenda-item" *ngFor="let item of leyendaItems()">
              <div class="marcador-ejemplo" [style.background-color]="item.color"></div>
              <span>{{ item.label }} ({{ item.count }})</span>
            </div>
          </div>
        </div>
        
        <!-- Estadísticas -->
        <div class="estadisticas-mapa" *ngIf="localidadesEnMapa().length > 0">
          <div class="stat-item">
            <mat-icon>location_on</mat-icon>
            <span>{{ (localidadesEnMapa())?.length || 0 }} localidades</span>
          </div>
          <div class="stat-item">
            <mat-icon>visibility</mat-icon>
            <span>{{ localidadesVisibles() }} visibles</span>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['./mapa-localidades.component.scss']
})
export class MapaLocalidadesComponent implements OnInit, OnDestroy {
  @ViewChild('mapaContainer', { static: true }) mapaContainer!: ElementRef;
  
  @Input() localidades = signal<Localidad[]>([]);
  @Input() localidadSeleccionada = signal<Localidad | null>(null);
  @Input() filtrosActivos = signal<any>({});
  
  @Output() localidadClick = new EventEmitter<Localidad>();
  @Output() mapaListo = new EventEmitter<void>();

  // Estado del mapa
  private mapa!: L.Map;
  private marcadores: L.LayerGroup = new L.LayerGroup();
  
  // Signals
  cargandoMapa = signal(true);
  mostrarLeyenda = signal(true);
  localidadesEnMapa = computed(() => this.localidades());
  localidadesVisibles = signal(0);
  
  // Configuración del mapa
  private readonly PUNO_CENTER: [number, number] = [-15.8422, -70.0199]; // Coordenadas de Puno
  private readonly PUNO_BOUNDS: L.LatLngBoundsExpression = [
    [-17.5, -71.5], // Suroeste
    [-13.5, -68.5]  // Noreste
  ];

  // Colores por tipo de localidad
  private readonly COLORES_TIPO: { [key in TipoLocalidad]: string } = {
    [TipoLocalidad.DEPARTAMENTO]: '#1976d2',     // Azul
    [TipoLocalidad.PROVINCIA]: '#388e3c',        // Verde
    [TipoLocalidad.DISTRITO]: '#f57c00',         // Naranja
    [TipoLocalidad.CIUDAD]: '#7b1fa2',           // Púrpura
    [TipoLocalidad.CENTRO_POBLADO]: '#d32f2f',   // Rojo
    [TipoLocalidad.PUEBLO]: '#795548',           // Marrón
    [TipoLocalidad.LOCALIDAD]: '#455a64'         // Gris azulado
  };

  // Tamaños de marcadores por tipo
  private readonly TAMAÑOS_MARCADOR: { [key in TipoLocalidad]: number } = {
    [TipoLocalidad.DEPARTAMENTO]: 15,
    [TipoLocalidad.PROVINCIA]: 12,
    [TipoLocalidad.DISTRITO]: 10,
    [TipoLocalidad.CIUDAD]: 9,
    [TipoLocalidad.CENTRO_POBLADO]: 8,
    [TipoLocalidad.PUEBLO]: 7,
    [TipoLocalidad.LOCALIDAD]: 6
  };

  leyendaItems = computed(() => {
    const localidades = this.localidadesEnMapa();
    const conteos: { [key: string]: number } = {};
    
    localidades.forEach(loc => {
      conteos[loc.tipo] = (conteos[loc.tipo] || 0) + 1;
    });

    return Object.entries(conteos).map(([tipo, count]) => ({
      label: tipo.replace('_', ' '),
      color: this.COLORES_TIPO[tipo as TipoLocalidad],
      count
    }));
  });

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.inicializarMapa();
  }

  ngOnDestroy() {
    if (this.mapa) {
      this.mapa.remove();
    }
  }

  private async inicializarMapa() {
    try {
      // Crear el mapa
      this.mapa = L.map(this.mapaContainer.nativeElement, {
        center: this.PUNO_CENTER,
        zoom: 8,
        maxBounds: this.PUNO_BOUNDS,
        maxBoundsViscosity: 1.0
      });

      // Agregar capa base
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 6
      }).addTo(this.mapa);

      // Agregar capa de marcadores
      this.marcadores.addTo(this.mapa);

      // Configurar eventos
      this.mapa.on('zoomend moveend', () => {
        this.actualizarLocalidadesVisibles();
      });

      this.cargandoMapa.set(false);
      this.mapaListo.emit();
      
      // Cargar localidades si ya están disponibles
      if (this.localidades().length > 0) {
        this.actualizarMarcadores();
      }

    } catch (error) {
      console.error('Error inicializando mapa::', error);
      this.snackBar.open('Error cargando el mapa', 'Cerrar', { duration: 3000 });
      this.cargandoMapa.set(false);
    }
  }

  private actualizarMarcadores() {
    if (!this.mapa) return;

    // Limpiar marcadores existentes
    this.marcadores.clearLayers();

    const localidades = this.localidadesEnMapa();
    let marcadoresCreados = 0;

    localidades.forEach(localidad => {
      if (localidad.coordenadas) {
        const marcador = this.crearMarcador(localidad);
        if (marcador) {
          this.marcadores.addLayer(marcador);
          marcadoresCreados++;
        }
      }
    });

    this.actualizarLocalidadesVisibles();
    
    // console.log removed for production
  }

  private crearMarcador(localidad: Localidad): L.CircleMarker | null {
    if (!localidad.coordenadas) return null;

    const { latitud, longitud } = localidad.coordenadas;
    
    // Validar coordenadas
    if (!this.validarCoordenadas(latitud, longitud)) {
      console.warn(`Coordenadas inválidas para ${localidad.nombre}:`, { latitud, longitud });
      return null;
    }

    const color = this.COLORES_TIPO[localidad.tipo];
    const radio = this.TAMAÑOS_MARCADOR[localidad.tipo];

    const marcador = L.circleMarker([latitud, longitud], {
      radius: radio,
      fillColor: color,
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    });

    // Popup con información
    const popupContent = this.crearPopupContent(localidad);
    marcador.bindPopup(popupContent);

    // Tooltip con nombre
    marcador.bindTooltip(localidad.nombre, {
      permanent: false,
      direction: 'top',
      offset: [0, -10]
    });

    // Evento click
    marcador.on('click', () => {
      this.localidadClick.emit(localidad);
    });

    return marcador;
  }

  private crearPopupContent(localidad: Localidad): string {
    const coordsText = localidad.coordenadas 
      ? `${localidad.coordenadas.latitud.toFixed(4)}, ${localidad.coordenadas.longitud.toFixed(4)}`
      : 'Sin coordenadas';

    return `
      <div class="popup-localidad">
        <h4>${localidad.nombre}</h4>
        <div class="popup-info">
          <p><strong>Tipo:</strong> ${localidad.tipo}</p>
          <p><strong>Departamento:</strong> ${localidad.departamento || 'N/A'}</p>
          <p><strong>Provincia:</strong> ${localidad.provincia || 'N/A'}</p>
          <p><strong>Distrito:</strong> ${localidad.distrito || 'N/A'}</p>
          <p><strong>Coordenadas:</strong> ${coordsText}</p>
          ${localidad.ubigeo ? `<p><strong>UBIGEO:</strong> ${localidad.ubigeo}</p>` : ''}
          <p><strong>Estado:</strong> ${localidad.estaActiva ? 'Activa' : 'Inactiva'}</p>
        </div>
      </div>
    `;
  }

  private validarCoordenadas(lat: number, lng: number): boolean {
    // Validar que las coordenadas estén dentro de los límites de Puno
    return lat >= -17.5 && lat <= -13.5 && lng >= -71.5 && lng <= -68.5;
  }

  private actualizarLocalidadesVisibles() {
    if (!this.mapa) return;

    const bounds = this.mapa.getBounds();
    let visibles = 0;

    this.marcadores.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        if (bounds.contains(layer.getLatLng())) {
          visibles++;
        }
      }
    });

    this.localidadesVisibles.set(visibles);
  }

  // Métodos públicos para controlar el mapa
  centrarEnPuno() {
    if (this.mapa) {
      this.mapa.setView(this.PUNO_CENTER, 8);
    }
  }

  ajustarVista() {
    if (!this.mapa || this.marcadores.getLayers().length === 0) return;

    const group = new L.FeatureGroup(this.marcadores.getLayers() as L.Layer[]);
    this.mapa.fitBounds(group.getBounds(), { padding: [20, 20] });
  }

  toggleCapas() {
    this.mostrarLeyenda.update(valor => !valor);
  }

  // Método para actualizar desde el componente padre
  actualizarLocalidades(nuevasLocalidades: Localidad[]) {
    this.localidades.set(nuevasLocalidades);
    this.actualizarMarcadores();
  }

  // Método para centrar en una localidad específica
  centrarEnLocalidad(localidad: Localidad) {
    if (!this.mapa || !localidad.coordenadas) return;

    const { latitud, longitud } = localidad.coordenadas;
    this.mapa.setView([latitud, longitud], 12);

    // Resaltar el marcador
    this.marcadores.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        const latLng = layer.getLatLng();
        if (Math.abs(latLng.lat - latitud) < 0.0001 && Math.abs(latLng.lng - longitud) < 0.0001) {
          layer.openPopup();
        }
      }
    });
  }

  // Método para aplicar filtros visuales
  aplicarFiltros(filtros: any) {
    this.filtrosActivos.set(filtros);
    // Aquí se puede implementar lógica para mostrar/ocultar marcadores según filtros
    this.actualizarMarcadores();
  }
}