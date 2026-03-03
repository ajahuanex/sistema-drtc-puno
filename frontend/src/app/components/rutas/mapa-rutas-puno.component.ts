import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet.heat';
import { Ruta } from '../../models/ruta.model';

// Declarar el tipo para leaflet.heat
declare module 'leaflet' {
  function heatLayer(latlngs: [number, number, number][], options?: any): any;
}

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
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <mat-card class="mapa-card" [class.fullscreen]="pantallaCompleta()">
      @if (!pantallaCompleta()) {
        <mat-card-header>
          <mat-card-title>
            <mat-icon>map</mat-icon>
            Mapa de Rutas - Departamento de Puno
          </mat-card-title>
          <mat-card-subtitle>
            Visualización geográfica de rutas y localidades
          </mat-card-subtitle>
        </mat-card-header>
      }
      
      <mat-card-content>
        <!-- Panel lateral de controles (visible en pantalla completa) -->
        @if (pantallaCompleta()) {
          <div class="panel-lateral">
            <div class="panel-header">
              <h3>
                <mat-icon>map</mat-icon>
                Mapa de Rutas - Puno
              </h3>
            </div>
            
            <!-- Filtros en panel lateral -->
            <div class="filtros-lateral">
              <h4>Buscar Localidad</h4>
              <mat-form-field appearance="outline" class="filtro-field-lateral">
                <mat-label>Escribe para buscar</mat-label>
                <input matInput
                       [ngModel]="busquedaLocalidad()"
                       (ngModelChange)="busquedaLocalidad.set($event)"
                       [matAutocomplete]="autoLocalidad"
                       placeholder="Ej: PUNO, JULIACA...">
                <mat-icon matPrefix>search</mat-icon>
                <mat-autocomplete #autoLocalidad="matAutocomplete" 
                                  (optionSelected)="seleccionarLocalidadDesdeAutocomplete($event.option.value)">
                  @if (localidadesFiltradas().length === 0) {
                    <mat-option disabled>No se encontraron localidades</mat-option>
                  }
                  @for (localidad of localidadesFiltradas(); track localidad) {
                    <mat-option [value]="localidad">
                      {{ localidad }}
                    </mat-option>
                  }
                </mat-autocomplete>
                <mat-hint>Busca en origen, destino e itinerario</mat-hint>
              </mat-form-field>

              @if (localidadSeleccionada) {
                <div class="localidad-seleccionada">
                  <mat-icon>place</mat-icon>
                  <span>{{ localidadSeleccionada }}</span>
                  <button mat-icon-button (click)="limpiarFiltros()" matTooltip="Limpiar">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
            </div>

            <!-- Localidades conectadas -->
            @if (localidadesConectadas().length > 0) {
              <div class="conexiones-lateral">
                <h4>Conectada con ({{ localidadesConectadas().length }})</h4>
                <div class="conexiones-lista">
                  @for (conexion of localidadesConectadas(); track conexion.nombre) {
                    <div class="conexion-item" (click)="seleccionarLocalidad(conexion.nombre)">
                      <span class="conexion-nombre">{{ conexion.nombre }}</span>
                      <span class="conexion-rutas">{{ conexion.rutas }} ruta{{ conexion.rutas > 1 ? 's' : '' }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Controles en panel lateral -->
            <div class="controles-lateral">
              <h4>Capas</h4>
              <div class="control-item" (click)="toggleProvincias()">
                <mat-icon [class.active]="mostrarProvincias()">
                  {{ mostrarProvincias() ? 'visibility' : 'visibility_off' }}
                </mat-icon>
                <span>Provincias</span>
              </div>
              <div class="control-item" (click)="toggleMapaCalor()">
                <mat-icon [class.active]="mostrarMapaCalor()">
                  {{ mostrarMapaCalor() ? 'whatshot' : 'map' }}
                </mat-icon>
                <span>{{ mostrarMapaCalor() ? 'Mapa de Calor' : 'Mapa Normal' }}</span>
              </div>
              <div class="control-item" (click)="togglePoblacion()">
                <mat-icon [class.active]="mostrarPoblacion()">
                  {{ mostrarPoblacion() ? 'visibility' : 'visibility_off' }}
                </mat-icon>
                <span>Población</span>
              </div>
              <div class="control-item" (click)="toggleMostrarRutas()">
                <mat-icon [class.active]="mostrarRutas()">
                  {{ mostrarRutas() ? 'visibility' : 'visibility_off' }}
                </mat-icon>
                <span>Rutas</span>
              </div>
              <div class="control-item" (click)="toggleMostrarLocalidades()">
                <mat-icon [class.active]="mostrarLocalidades()">
                  {{ mostrarLocalidades() ? 'visibility' : 'visibility_off' }}
                </mat-icon>
                <span>Localidades</span>
              </div>
              <div class="control-item" (click)="toggleMostrarItinerarios()">
                <mat-icon [class.active]="mostrarItinerarios()">
                  {{ mostrarItinerarios() ? 'visibility' : 'visibility_off' }}
                </mat-icon>
                <span>Itinerarios</span>
              </div>
              <div class="control-item warning" (click)="toggleMostrarRutasCanceladas()">
                <mat-icon [class.active]="mostrarRutasCanceladas()">
                  {{ mostrarRutasCanceladas() ? 'visibility' : 'visibility_off' }}
                </mat-icon>
                <span>Canceladas</span>
              </div>
              <div class="control-item" (click)="centrarMapa()">
                <mat-icon>my_location</mat-icon>
                <span>Centrar</span>
              </div>
            </div>

            <!-- Estadísticas en panel lateral -->
            <div class="stats-lateral">
              <h4>Estadísticas</h4>
              <div class="stat-lateral">
                <mat-icon>place</mat-icon>
                <span>{{ localidadesEnMapa().length }} localidades</span>
              </div>
              <div class="stat-lateral">
                <mat-icon>route</mat-icon>
                <span>{{ rutasEnMapa().length }} rutas</span>
              </div>
            </div>
          </div>
        }

        <!-- Filtros normales (solo cuando NO está en pantalla completa) -->
        @if (!pantallaCompleta()) {
          <div class="filtros-section">
            <mat-form-field appearance="outline" class="filtro-field">
              <mat-label>Buscar Localidad</mat-label>
              <input matInput
                     [ngModel]="busquedaLocalidad()"
                     (ngModelChange)="busquedaLocalidad.set($event)"
                     [matAutocomplete]="autoLocalidadNormal"
                     placeholder="Escribe para buscar...">
              <mat-icon matPrefix>search</mat-icon>
              <mat-autocomplete #autoLocalidadNormal="matAutocomplete" 
                                (optionSelected)="seleccionarLocalidadDesdeAutocomplete($event.option.value)">
                @if (localidadesFiltradas().length === 0) {
                  <mat-option disabled>No se encontraron localidades</mat-option>
                }
                @for (localidad of localidadesFiltradas(); track localidad) {
                  <mat-option [value]="localidad">
                    {{ localidad }}
                  </mat-option>
                }
              </mat-autocomplete>
              <mat-hint>Busca en origen, destino e itinerario</mat-hint>
            </mat-form-field>

            @if (localidadSeleccionada) {
              <button mat-raised-button color="warn" (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Limpiar Filtro
              </button>
            }
          </div>

          <!-- Controles del mapa normales -->
          <div class="mapa-controles">
            <mat-chip-set>
              <mat-chip (click)="toggleProvincias()" [class.active]="mostrarProvincias()">
                <mat-icon>{{ mostrarProvincias() ? 'visibility' : 'visibility_off' }}</mat-icon>
                Provincias
              </mat-chip>
              <mat-chip (click)="toggleMapaCalor()" [class.active]="mostrarMapaCalor()">
                <mat-icon>{{ mostrarMapaCalor() ? 'whatshot' : 'map' }}</mat-icon>
                {{ mostrarMapaCalor() ? 'Mapa de Calor' : 'Mapa Normal' }}
              </mat-chip>
              <mat-chip (click)="togglePoblacion()" [class.active]="mostrarPoblacion()">
                <mat-icon>{{ mostrarPoblacion() ? 'visibility' : 'visibility_off' }}</mat-icon>
                Población
              </mat-chip>
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
        }
        
        <!-- Contenedor del mapa -->
        <div id="mapa-puno" class="mapa-container">
          <!-- Botón flotante de pantalla completa -->
          <button mat-mini-fab 
                  class="fullscreen-button" 
                  (click)="togglePantallaCompleta()"
                  [matTooltip]="pantallaCompleta() ? 'Salir de pantalla completa' : 'Pantalla completa'"
                  matTooltipPosition="left">
            <mat-icon>{{ pantallaCompleta() ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
          </button>
        </div>
        
        <!-- Leyenda (solo cuando NO está en pantalla completa) -->
        @if (!pantallaCompleta()) {
          <div class="mapa-leyenda">
            <h4>Leyenda</h4>
            <div class="leyenda-items">
              <div class="leyenda-item">
                <div class="marker-preview grande"></div>
                <span>Localidad muy transitada (80+ rutas)</span>
              </div>
              <div class="leyenda-item">
                <div class="marker-preview mediano"></div>
                <span>Localidad transitada (40-79 rutas)</span>
              </div>
              <div class="leyenda-item">
                <div class="marker-preview amarillo"></div>
                <span>Localidad media (20-39 rutas)</span>
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
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .mapa-card {
      margin: 20px 0;
      transition: all 0.3s ease;
    }

    .mapa-card.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      margin: 0;
      z-index: 9999;
      border-radius: 0;
    }

    .mapa-card.fullscreen .mapa-container {
      height: 100vh;
      border-radius: 0;
    }

    /* Panel lateral en pantalla completa */
    .panel-lateral {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 300px;
      background: white;
      box-shadow: 2px 0 8px rgba(0,0,0,0.2);
      z-index: 10000;
      overflow-y: auto;
      padding: 16px;
    }

    .panel-header {
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e0e0e0;
    }

    .panel-header h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      color: #1976d2;
    }

    .filtros-lateral,
    .controles-lateral,
    .stats-lateral,
    .conexiones-lateral {
      margin-bottom: 24px;
    }

    .filtros-lateral h4,
    .controles-lateral h4,
    .stats-lateral h4,
    .conexiones-lateral h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
    }

    .filtro-field-lateral {
      width: 100%;
      margin-bottom: 8px;
    }

    .localidad-seleccionada {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #e3f2fd;
      border-radius: 4px;
      margin-top: 8px;
    }

    .localidad-seleccionada mat-icon {
      color: #1976d2;
    }

    .localidad-seleccionada span {
      flex: 1;
      font-weight: 600;
      color: #1976d2;
    }

    .localidad-seleccionada button {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }

    .btn-limpiar-lateral {
      width: 100%;
      margin-top: 8px;
    }

    .control-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      margin-bottom: 4px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .control-item:hover {
      background: #f5f5f5;
    }

    .control-item mat-icon {
      color: #666;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .control-item mat-icon.active {
      color: #1976d2;
    }

    .control-item.warning mat-icon.active {
      color: #f44336;
    }

    .control-item span {
      font-size: 14px;
      color: #333;
    }

    .stat-lateral {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .stat-lateral mat-icon {
      color: #1976d2;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .stat-lateral span {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }

    /* Estilos para conexiones */
    .conexiones-lista {
      max-height: 300px;
      overflow-y: auto;
    }

    .conexion-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      margin-bottom: 4px;
      background: #f5f5f5;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .conexion-item:hover {
      background: #e3f2fd;
      transform: translateX(4px);
    }

    .conexion-nombre {
      font-size: 13px;
      color: #333;
      font-weight: 500;
      flex: 1;
    }

    .conexion-rutas {
      font-size: 12px;
      color: #1976d2;
      font-weight: 600;
      background: white;
      padding: 2px 8px;
      border-radius: 12px;
      white-space: nowrap;
    }

    .filtros-section {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      flex-wrap: wrap;
    }

    .filtro-field {
      flex: 1;
      min-width: 250px;
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
      position: relative;
    }

    .fullscreen-button {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      background: white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }

    .fullscreen-button:hover {
      background: #f5f5f5;
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
    
    .marker-preview.amarillo {
      width: 12px;
      height: 12px;
      background: #fbc02d;
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

    /* Estilos para provincias */
    :host ::ng-deep .popup-provincia h3 {
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1976d2;
    }

    :host ::ng-deep .popup-provincia .provincia-stats {
      margin-top: 8px;
    }

    :host ::ng-deep .popup-provincia .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #eee;
    }

    :host ::ng-deep .popup-provincia .stat-label {
      font-weight: 500;
      color: #666;
    }

    :host ::ng-deep .popup-provincia .stat-value {
      font-weight: 600;
      color: #1976d2;
    }

    :host ::ng-deep .popup-provincia .stat-value.clickable {
      cursor: pointer;
      text-decoration: underline;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    :host ::ng-deep .popup-provincia .stat-value.clickable:hover {
      color: #0d47a1;
    }

    :host ::ng-deep .popup-provincia .empresas-list {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid #e3f2fd;
    }

    :host ::ng-deep .popup-provincia .empresas-list strong {
      color: #1976d2;
      font-size: 13px;
    }

    :host ::ng-deep .popup-provincia .empresas-list ul {
      margin: 8px 0 4px 0;
      padding-left: 20px;
      list-style: none;
    }

    :host ::ng-deep .popup-provincia .empresas-list li {
      padding: 4px 0;
      font-size: 12px;
      color: #555;
      position: relative;
    }

    :host ::ng-deep .popup-provincia .empresas-list li:before {
      content: "•";
      color: #1976d2;
      font-weight: bold;
      position: absolute;
      left: -15px;
    }

    :host ::ng-deep .popup-provincia .empresas-list small {
      color: #999;
      font-style: italic;
    }

    /* Popup de empresas detallado */
    :host ::ng-deep .popup-empresas h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1976d2;
    }

    :host ::ng-deep .popup-empresas p {
      margin: 4px 0 12px 0;
      font-size: 13px;
      color: #666;
    }

    :host ::ng-deep .popup-empresas .empresas-detalle {
      max-height: 300px;
      overflow-y: auto;
    }

    :host ::ng-deep .popup-empresas .empresa-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      margin-bottom: 4px;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 12px;
    }

    :host ::ng-deep .popup-empresas .empresa-rank {
      width: 24px;
      height: 24px;
      background: #1976d2;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 11px;
      flex-shrink: 0;
    }

    :host ::ng-deep .popup-empresas .empresa-nombre {
      flex: 1;
      font-weight: 500;
      color: #333;
    }

    :host ::ng-deep .popup-empresas .empresa-rutas {
      color: #1976d2;
      font-weight: 600;
      white-space: nowrap;
    }

    :host ::ng-deep .provincia-tooltip {
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-weight: 600;
      font-size: 14px;
    }

    :host ::ng-deep .leaflet-interactive {
      cursor: pointer;
      transition: all 0.3s ease;
    }
  `]
})
export class MapaRutasPunoComponent implements OnInit, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  
  // Inputs
  rutas = input<Ruta[]>([]);
  
  // Signals
  mostrarRutas = signal(true);
  mostrarLocalidades = signal(true);
  mostrarRutasCanceladas = signal(false);
  mostrarItinerarios = signal(true);
  mostrarMapaCalor = signal(false);
  mostrarProvincias = signal(true);
  mostrarPoblacion = signal(false);
  pantallaCompleta = signal(false);
  localidadesEnMapa = signal<LocalidadMapa[]>([]);
  rutasEnMapa = signal<Ruta[]>([]);
  
  // Filtros
  localidadSeleccionada = '';
  busquedaLocalidad = signal('');
  localidadesDisponibles = signal<string[]>([]);
  localidadesFiltradas = computed(() => {
    const busqueda = this.busquedaLocalidad().toLowerCase().trim();
    if (!busqueda) return this.localidadesDisponibles();
    return this.localidadesDisponibles().filter(loc => 
      loc.toLowerCase().includes(busqueda)
    );
  });
  localidadesConectadas = signal<Array<{nombre: string, rutas: number}>>([]);
  
  // Mapa de Leaflet
  private mapa?: L.Map;
  private markersLayer?: L.LayerGroup;
  private rutasLayer?: L.LayerGroup;
  private heatLayer?: any;
  private provinciasLayer?: L.GeoJSON;
  
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
    'JULI': [-16.2167, -69.4667],  // Capital de Chucuito (sur del lago)
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
    
    // Extraer TODAS las localidades únicas (origen, destino e itinerario)
    const localidades = new Set<string>();
    
    todasLasRutas.forEach(ruta => {
      if (ruta.origen?.nombre) localidades.add(ruta.origen.nombre);
      if (ruta.destino?.nombre) localidades.add(ruta.destino.nombre);
      if (ruta.itinerario && Array.isArray(ruta.itinerario)) {
        ruta.itinerario.forEach(loc => {
          if (loc.nombre) localidades.add(loc.nombre);
        });
      }
    });
    
    this.localidadesDisponibles.set(Array.from(localidades).sort());
    
    // Aplicar filtro de localidad (busca en origen, destino E itinerario)
    let rutasFiltradas = todasLasRutas;
    
    if (this.localidadSeleccionada) {
      rutasFiltradas = rutasFiltradas.filter(ruta => {
        // Verificar si la localidad está en origen
        if (ruta.origen?.nombre === this.localidadSeleccionada) return true;
        
        // Verificar si la localidad está en destino
        if (ruta.destino?.nombre === this.localidadSeleccionada) return true;
        
        // Verificar si la localidad está en el itinerario
        if (ruta.itinerario && Array.isArray(ruta.itinerario)) {
          return ruta.itinerario.some(loc => loc.nombre === this.localidadSeleccionada);
        }
        
        return false;
      });
      
      // Calcular localidades conectadas
      this.calcularLocalidadesConectadas(rutasFiltradas);
    } else {
      // Si no hay filtro, limpiar conexiones
      this.localidadesConectadas.set([]);
    }
    
    // Filtrar rutas canceladas si el toggle está desactivado
    const rutasData = this.mostrarRutasCanceladas() 
      ? rutasFiltradas 
      : rutasFiltradas.filter(ruta => ruta.estado !== 'CANCELADA' && ruta.estado !== 'DADA_DE_BAJA');
    
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
    
    // Cargar provincias de Puno PRIMERO (para que estén debajo)
    this.cargarProvincias();
    
    // Crear capas para rutas y markers (en este orden para que estén encima)
    this.rutasLayer = L.layerGroup().addTo(this.mapa);
    this.markersLayer = L.layerGroup().addTo(this.mapa);
    
    // Dibujar localidades y rutas
    this.dibujarLocalidades();
    this.dibujarRutas();
  }

  private cargarProvincias(): void {
    this.http.get<any>('/assets/geojson/peru-provincias.geojson').subscribe({
      next: (geojson) => {
        if (this.mapa) {
          console.log('=== MAPEO DE PROVINCIAS DESDE GEOJSON ===');
          geojson.features?.forEach((feature: any) => {
            const id = feature.id;
            const nombProv = feature.properties?.NOMBPROV;
            console.log(`ID ${id} -> ${nombProv}`);
          });

          // Colores para las provincias
          const colores: { [key: string]: string } = {
            'PUNO': '#2196F3',
            'SAN ROMAN': '#F44336',
            'AZANGARO': '#4CAF50',
            'CHUCUITO': '#FF9800',
            'EL COLLAO': '#9C27B0',
            'YUNGUYO': '#E91E63',
            'HUANCANE': '#00BCD4',
            'LAMPA': '#FFC107',
            'MELGAR': '#795548',
            'CARABAYA': '#607D8B',
            'MOHO': '#673AB7',
            'SAN ANTONIO DE PUTINA': '#CDDC39',
            'SANDIA': '#FF5722'
          };

          // Mapeo de nombres del GeoJSON a nombres normalizados
          const normalizarNombre = (nombre: string): string => {
            const mapeo: { [key: string]: string } = {
              'PUNO': 'Puno',
              'SAN ROMAN': 'San Román',
              'AZANGARO': 'Azángaro',
              'CHUCUITO': 'Chucuito',
              'EL COLLAO': 'El Collao',
              'YUNGUYO': 'Yunguyo',
              'HUANCANE': 'Huancané',
              'LAMPA': 'Lampa',
              'MELGAR': 'Melgar',
              'CARABAYA': 'Carabaya',
              'MOHO': 'Moho',
              'SAN ANTONIO DE PUTINA': 'San Antonio de Putina',
              'SANDIA': 'Sandia'
            };
            return mapeo[nombre] || nombre;
          };

          this.provinciasLayer = L.geoJSON(geojson, {
            style: (feature) => {
              if (!feature || !feature.properties) return {};
              
              const nombProv = feature.properties.NOMBPROV || 'DESCONOCIDA';
              const color = colores[nombProv] || '#9E9E9E';
              
              return {
                fillColor: color,
                weight: 2,
                opacity: 1,
                color: '#1976d2',
                fillOpacity: 0.2
              };
            },
            onEachFeature: (feature, layer) => {
              const id = Number(feature?.id) || 0;
              const nombProvGeo = feature.properties?.NOMBPROV || 'Desconocida';
              const nombreProvincia = normalizarNombre(nombProvGeo);
              
              // Calcular estadísticas de la provincia
              const stats = this.calcularEstadisticasProvincia(nombreProvincia);
              
              // Popup con información detallada
              const popupContent = `
                <div class="popup-provincia">
                  <h3>${nombreProvincia}</h3>
                  <div class="provincia-stats">
                    <div class="stat-row">
                      <span class="stat-label">ID:</span>
                      <span class="stat-value">${id}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Rutas:</span>
                      <span class="stat-value">${stats.totalRutas}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Empresas:</span>
                      <span class="stat-value clickable" onclick="window.dispatchEvent(new CustomEvent('mostrarEmpresas', { detail: { provincia: '${nombreProvincia}' } }))">${stats.totalEmpresas} <span style="font-size: 14px;">ℹ️</span></span>
                    </div>
                    ${stats.empresas.length > 0 ? `
                      <div class="empresas-list">
                        <strong>Top empresas:</strong>
                        <ul>
                          ${stats.empresas.slice(0, 3).map(e => `<li>${e.nombre.substring(0, 30)}${e.nombre.length > 30 ? '...' : ''} (${e.rutas})</li>`).join('')}
                        </ul>
                        ${stats.empresas.length > 3 ? `<small>y ${stats.empresas.length - 3} más...</small>` : ''}
                      </div>
                    ` : '<p style="color: #999; font-size: 12px; margin-top: 8px;">No hay rutas registradas</p>'}
                  </div>
                </div>
              `;
              
              layer.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'provincia-popup'
              });
              
              // Tooltip con nombre
              layer.bindTooltip(`${nombreProvincia}`, {
                permanent: false,
                direction: 'center',
                className: 'provincia-tooltip'
              });
              
              // Eventos de interacción
              layer.on({
                mouseover: (e) => {
                  const layer = e.target;
                  layer.setStyle({
                    weight: 3,
                    fillOpacity: 0.4
                  });
                },
                mouseout: (e) => {
                  this.provinciasLayer?.resetStyle(e.target);
                },
                click: (e) => {
                  this.mapa?.fitBounds(e.target.getBounds());
                }
              });
            }
          }).addTo(this.mapa);
          
          // Enviar la capa de provincias al fondo (debajo de rutas y localidades)
          this.provinciasLayer.bringToBack();
          
          if (!this.mostrarProvincias()) {
            this.mapa.removeLayer(this.provinciasLayer);
          }
        }
      },
      error: (error) => {
        console.error('Error cargando GeoJSON de provincias:', error);
      }
    });

    // Escuchar evento personalizado para mostrar empresas
    window.addEventListener('mostrarEmpresas', ((event: CustomEvent) => {
      this.mostrarDetalleEmpresas(event.detail.provincia);
    }) as EventListener);
  }

  private identificarProvinciaPorCoordenadas(lat: number, lng: number): string {
    // Rangos geográficos aproximados de cada provincia
    // Basado en las coordenadas reales de Puno
    
    // Yunguyo (extremo sur-este, cerca del lago)
    if (lat < -16.1 && lng > -69.3) return 'Yunguyo';
    
    // Chucuito (sur, cerca del lago)
    if (lat < -16.0 && lat > -16.8 && lng > -69.8 && lng < -69.0) return 'Chucuito';
    
    // El Collao (sur-centro)
    if (lat < -15.9 && lat > -16.8 && lng > -70.0 && lng < -69.4) return 'El Collao';
    
    // Puno (centro, alrededor de la ciudad de Puno)
    if (lat > -16.2 && lat < -15.5 && lng > -70.4 && lng < -69.7) return 'Puno';
    
    // San Román (centro-norte, Juliaca) - AJUSTADO
    // Incluye la zona alrededor de Juliaca
    if (lat > -15.8 && lat < -15.2 && lng > -70.6 && lng < -69.8) return 'San Román';
    
    // Lampa (oeste de San Román)
    if (lat > -15.7 && lat < -15.0 && lng > -70.8 && lng < -70.1) return 'Lampa';
    
    // Melgar (extremo oeste)
    if (lng < -70.4 && lat > -15.0 && lat < -14.4) return 'Melgar';
    
    // Azángaro (norte-centro)
    if (lat > -15.2 && lat < -14.6 && lng > -70.5 && lng < -69.9) return 'Azángaro';
    
    // Huancané (este, cerca del lago)
    if (lat > -15.5 && lat < -14.9 && lng > -70.0 && lng < -69.3) return 'Huancané';
    
    // Moho (noreste, en el lago)
    if (lat > -15.6 && lat < -15.2 && lng > -69.7 && lng < -69.3) return 'Moho';
    
    // San Antonio de Putina (norte)
    if (lat > -15.0 && lat < -14.6 && lng > -70.0 && lng < -69.5) return 'San Antonio de Putina';
    
    // Carabaya (noroeste)
    if (lat > -14.4 && lat < -13.4 && lng > -70.7 && lng < -69.8) return 'Carabaya';
    
    // Sandia (noreste)
    if (lat > -14.6 && lat < -13.6 && lng > -69.8 && lng < -69.2) return 'Sandia';
    
    return 'Desconocida';
  }

  private calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
  }

  private calcularEstadisticasProvincia(nombreProvincia: string): {
    totalRutas: number;
    totalEmpresas: number;
    empresas: Array<{ nombre: string; rutas: number }>;
  } {
    // Mapeo de localidades por provincia
    const localidadesPorProvincia: { [key: string]: string[] } = {
      'Puno': ['PUNO', 'ACORA', 'AMANTANI', 'ATUNCOLLA', 'CAPACHICA', 'CHUCUITO', 'COATA', 'HUATA', 'MAÑAZO', 'PAUCARCOLLA', 'PICHACANI', 'PLATERIA', 'SAN ANTONIO', 'TIQUILLACA', 'VILQUE'],
      'San Román': ['JULIACA', 'CABANA', 'CABANILLAS', 'CARACOTO'],
      'Azángaro': ['AZANGARO', 'ACHAYA', 'ARAPA', 'ASILLO', 'CAMINACA', 'CHUPA', 'JOSE DOMINGO CHOQUEHUANCA', 'MUÑANI', 'POTONI', 'SAMAN', 'SAN ANTON', 'SAN JOSE', 'SAN JUAN DE SALINAS', 'SANTIAGO DE PUPUJA', 'TIRAPATA'],
      'Chucuito': ['JULI', 'DESAGUADERO', 'HUACULLANI', 'KELLUYO', 'PISACOMA', 'POMATA', 'ZEPITA'],
      'El Collao': ['ILAVE', 'CAPASO', 'PILCUYO', 'SANTA ROSA COLLAO', 'CONDURIRI'],
      'Yunguyo': ['YUNGUYO', 'ANAPIA', 'COPANI', 'CUTURAPI', 'OLLARAYA', 'TINICACHI', 'UNICACHI'],
      'Huancané': ['HUANCANE', 'COJATA', 'HUATASANI', 'INCHUPALLA', 'PUSI', 'ROSASPATA', 'TARACO', 'VILQUE CHICO'],
      'Lampa': ['LAMPA', 'CABANILLA', 'CALAPUJA', 'NICASIO', 'OCUVIRI', 'PALCA', 'PARATIA', 'PUCARA', 'SANTA LUCIA', 'VILAVILA'],
      'Melgar': ['AYAVIRI', 'ANTAUTA', 'CUPI', 'LLALLI', 'MACARI', 'NUÑOA', 'ORURILLO', 'SANTA ROSA MELGAR', 'UMACHIRI'],
      'Carabaya': ['MACUSANI', 'AJOYANI', 'AYAPATA', 'COASA', 'CORANI', 'CRUCERO', 'ITUATA', 'OLLACHEA', 'SAN GABAN', 'USICAYOS'],
      'Moho': ['MOHO', 'CONIMA', 'HUAYRAPATA', 'TILALI'],
      'San Antonio de Putina': ['PUTINA', 'ANANEA', 'PEDRO VILCA APAZA', 'QUILCAPUNCU', 'SINA'],
      'Sandia': ['SANDIA', 'ALTO INAMBARI', 'CUYOCUYO', 'LIMBANI', 'PATAMBUCO', 'PHARA', 'QUIACA', 'SAN JUAN DEL ORO', 'YANAHUAYA', 'MASSIAPO']
    };

    const localidades = localidadesPorProvincia[nombreProvincia] || [];
    
    // Filtrar rutas de esta provincia
    const rutasProvincia = this.rutasEnMapa().filter(ruta => {
      const origenEnProvincia = localidades.some(loc => 
        ruta.origen?.nombre?.toUpperCase().includes(loc)
      );
      const destinoEnProvincia = localidades.some(loc => 
        ruta.destino?.nombre?.toUpperCase().includes(loc)
      );
      return origenEnProvincia || destinoEnProvincia;
    });

    // Contar empresas y sus rutas
    const empresasMap = new Map<string, { nombre: string; rutas: number }>();
    rutasProvincia.forEach(ruta => {
      const empresaNombre = typeof ruta.empresa?.razonSocial === 'string' 
        ? ruta.empresa.razonSocial 
        : (ruta.empresa?.razonSocial as any)?.principal || 'Sin empresa';
      
      if (!empresasMap.has(empresaNombre)) {
        empresasMap.set(empresaNombre, { nombre: empresaNombre, rutas: 0 });
      }
      empresasMap.get(empresaNombre)!.rutas++;
    });

    const empresas = Array.from(empresasMap.values())
      .sort((a, b) => b.rutas - a.rutas);

    return {
      totalRutas: rutasProvincia.length,
      totalEmpresas: empresas.length,
      empresas: empresas
    };
  }

  private mostrarDetalleEmpresas(nombreProvincia: string): void {
    const stats = this.calcularEstadisticasProvincia(nombreProvincia);
    
    const empresasHTML = stats.empresas.map((e, i) => 
      `<div class="empresa-item">
        <span class="empresa-rank">${i + 1}</span>
        <span class="empresa-nombre">${e.nombre}</span>
        <span class="empresa-rutas">${e.rutas} rutas</span>
      </div>`
    ).join('');

    const popupContent = `
      <div class="popup-empresas">
        <h3>Empresas en ${nombreProvincia}</h3>
        <p><strong>${stats.totalEmpresas}</strong> empresas operando</p>
        <div class="empresas-detalle">
          ${empresasHTML}
        </div>
      </div>
    `;

    if (this.mapa) {
      L.popup()
        .setLatLng(this.PUNO_CENTER)
        .setContent(popupContent)
        .openOn(this.mapa);
    }
  }
  
  private dibujarLocalidades(): void {
    if (!this.markersLayer) return;
    
    this.markersLayer.clearLayers();
    
    if (!this.mostrarLocalidades()) return;
    
    // Separar localidades superpuestas
    const localidadesAjustadas = this.separarLocalidadesSuperpuestas(this.localidadesEnMapa());
    
    localidadesAjustadas.forEach(localidad => {
      const marker = this.crearMarker(localidad);
      marker.addTo(this.markersLayer!);
    });
  }

  private separarLocalidadesSuperpuestas(localidades: LocalidadMapa[]): LocalidadMapa[] {
    const resultado: LocalidadMapa[] = [];
    const umbralDistancia = 0.02; // ~2km en grados
    const offsetAngulo = 45; // Grados para separar
    const offsetDistancia = 0.015; // Distancia de separación
    
    localidades.forEach(localidad => {
      // Verificar si hay localidades muy cercanas
      const cercanas = resultado.filter(l => {
        const distancia = Math.sqrt(
          Math.pow(l.lat - localidad.lat, 2) + 
          Math.pow(l.lng - localidad.lng, 2)
        );
        return distancia < umbralDistancia;
      });
      
      if (cercanas.length > 0) {
        // Hay localidades cercanas, aplicar offset
        const angulo = (cercanas.length * offsetAngulo) * (Math.PI / 180);
        const nuevoLat = localidad.lat + (offsetDistancia * Math.cos(angulo));
        const nuevoLng = localidad.lng + (offsetDistancia * Math.sin(angulo));
        
        resultado.push({
          ...localidad,
          lat: nuevoLat,
          lng: nuevoLng
        });
      } else {
        // No hay localidades cercanas, usar coordenadas originales
        resultado.push(localidad);
      }
    });
    
    return resultado;
  }
  
  private crearMarker(localidad: LocalidadMapa): L.CircleMarker {
    // Determinar tamaño y color según cantidad de rutas
    let radius = 6;
    let color = '#388e3c'; // Verde para poco tránsito
    
    if (localidad.total >= 80) {
      radius = 12;
      color = '#d32f2f'; // Rojo para mucho tránsito (80+)
    } else if (localidad.total >= 40) {
      radius = 10;
      color = '#f57c00'; // Naranja para tránsito alto (40-79)
    } else if (localidad.total >= 20) {
      radius = 8;
      color = '#fbc02d'; // Amarillo para tránsito medio (20-39)
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

  togglePantallaCompleta(): void {
    this.pantallaCompleta.update(v => !v);
    
    // Esperar a que el DOM se actualice antes de invalidar el tamaño del mapa
    setTimeout(() => {
      if (this.mapa) {
        this.mapa.invalidateSize();
      }
    }, 100);
  }

  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros - Localidad seleccionada:', this.localidadSeleccionada);
    this.procesarDatos();
    console.log('📊 Rutas filtradas:', this.rutasEnMapa().length);
    console.log('📍 Localidades en mapa:', this.localidadesEnMapa().length);
    if (this.mapa) {
      this.dibujarLocalidades();
      this.dibujarRutas();
      if (this.mostrarMapaCalor()) {
        this.dibujarMapaCalor();
      }
    }
  }

  limpiarFiltros(): void {
    this.localidadSeleccionada = '';
    this.busquedaLocalidad.set('');
    this.aplicarFiltros();
  }

  seleccionarLocalidad(nombre: string): void {
    this.localidadSeleccionada = nombre;
    this.busquedaLocalidad.set(nombre);
    this.aplicarFiltros();
  }

  seleccionarLocalidadDesdeAutocomplete(nombre: string): void {
    this.localidadSeleccionada = nombre;
    this.busquedaLocalidad.set(nombre);
    this.aplicarFiltros();
  }

  private calcularLocalidadesConectadas(rutas: Ruta[]): void {
    const conexiones = new Map<string, number>();
    
    rutas.forEach(ruta => {
      // Agregar todas las localidades de la ruta excepto la seleccionada
      const localidadesRuta = new Set<string>();
      
      if (ruta.origen?.nombre && ruta.origen.nombre !== this.localidadSeleccionada) {
        localidadesRuta.add(ruta.origen.nombre);
      }
      
      if (ruta.destino?.nombre && ruta.destino.nombre !== this.localidadSeleccionada) {
        localidadesRuta.add(ruta.destino.nombre);
      }
      
      if (ruta.itinerario && Array.isArray(ruta.itinerario)) {
        ruta.itinerario.forEach(loc => {
          if (loc.nombre && loc.nombre !== this.localidadSeleccionada) {
            localidadesRuta.add(loc.nombre);
          }
        });
      }
      
      // Contar conexiones
      localidadesRuta.forEach(localidad => {
        conexiones.set(localidad, (conexiones.get(localidad) || 0) + 1);
      });
    });
    
    // Convertir a array y ordenar por número de rutas
    const conectadas = Array.from(conexiones.entries())
      .map(([nombre, rutas]) => ({ nombre, rutas }))
      .sort((a, b) => b.rutas - a.rutas);
    
    this.localidadesConectadas.set(conectadas);
  }

  toggleMapaCalor(): void {
    this.mostrarMapaCalor.update(v => !v);
    if (this.mostrarMapaCalor()) {
      this.dibujarMapaCalor();
    } else {
      this.removerMapaCalor();
    }
  }

  toggleProvincias(): void {
    this.mostrarProvincias.update(v => !v);
    if (this.mapa && this.provinciasLayer) {
      if (this.mostrarProvincias()) {
        this.mapa.addLayer(this.provinciasLayer);
        // Asegurar que las provincias estén al fondo
        this.provinciasLayer.bringToBack();
      } else {
        this.mapa.removeLayer(this.provinciasLayer);
      }
    }
  }

  togglePoblacion(): void {
    this.mostrarPoblacion.update(v => !v);
    // La población se muestra en los popups de las localidades
    // No necesita redibujar, solo actualizar el estado
  }

  private dibujarMapaCalor(): void {
    if (!this.mapa) return;
    
    // Remover capa anterior si existe
    this.removerMapaCalor();
    
    // Preparar datos para el mapa de calor
    const heatData: [number, number, number][] = [];
    
    // Encontrar el máximo de rutas para normalizar
    const maxRutas = Math.max(...this.localidadesEnMapa().map(l => l.total), 1);
    
    this.localidadesEnMapa().forEach(localidad => {
      // Intensidad normalizada: 0 a 1 basada en el máximo
      // Las localidades con más rutas tendrán intensidad cercana a 1 (rojo)
      const intensidad = localidad.total / maxRutas;
      heatData.push([localidad.lat, localidad.lng, intensidad]);
    });
    
    // Crear capa de calor con gradiente de frío a caliente
    this.heatLayer = (L as any).heatLayer(heatData, {
      radius: 25,      // Radio base más pequeño
      blur: 15,        // Menos blur para más precisión
      minOpacity: 0.6, // Opacidad mínima más alta
      max: 1.0,        // Máximo normalizado a 1
      gradient: {
        0.0: '#0000ff',  // Azul - pocas rutas
        0.2: '#00ffff',  // Cyan
        0.4: '#00ff00',  // Verde
        0.6: '#ffff00',  // Amarillo
        0.8: '#ff8800',  // Naranja
        1.0: '#ff0000'   // Rojo - más rutas
      }
    }).addTo(this.mapa);
  }

  private removerMapaCalor(): void {
    if (this.heatLayer && this.mapa) {
      this.mapa.removeLayer(this.heatLayer);
      this.heatLayer = null;
    }
  }
}
