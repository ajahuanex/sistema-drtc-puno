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
          <button mat-icon-button (click)="cerrar()" matTooltip="Volver al mapa" class="btn-back">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <mat-icon>map</mat-icon>
          <span>Mapa de Rutas</span>
          <span class="rutas-badge">{{ rutasFiltradas.length }} rutas</span>
        </div>
        <div class="fs-header-right">
          <button mat-icon-button (click)="ajustarVistaRutas()" matTooltip="Ajustar vista a rutas filtradas" class="btn-fit">
            <mat-icon>fit_screen</mat-icon>
          </button>
          <button mat-icon-button (click)="cerrar()" matTooltip="Cerrar">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <div class="fs-body">
        <div class="fs-sidebar">
          <div class="fs-section">
            <h4>Capas</h4>
            <mat-checkbox [(ngModel)]="mostrarProvincias" (change)="toggleCapa('provincias')" class="fs-check">Provincias</mat-checkbox>
            <mat-checkbox [(ngModel)]="mostrarDistritos" (change)="toggleCapa('distritos')" class="fs-check">Distritos</mat-checkbox>
            <mat-checkbox [(ngModel)]="mostrarRutas" (change)="aplicarFiltros()" class="fs-check">Rutas</mat-checkbox>
            <mat-checkbox [(ngModel)]="mostrarEtiquetasRutas" (change)="toggleEtiquetasRutas()" class="fs-check">Nombres de rutas</mat-checkbox>
            <mat-checkbox [(ngModel)]="mostrarEtiquetasPoligonos" (change)="toggleEtiquetasPoligonos()" class="fs-check">Nombres distritos/provincias</mat-checkbox>
            <mat-checkbox [(ngModel)]="mostrarHeatmap" (change)="toggleHeatmap()" class="fs-check">🌡️ Temperatura de rutas</mat-checkbox>
            <mat-checkbox [(ngModel)]="mostrarItinerarios" (change)="toggleItinerariosEnMapa()" class="fs-check">🛑 Itinerarios de rutas</mat-checkbox>
          </div>

          <!-- Fondo de mapa -->
          <div class="fs-section">
            <h4>Fondo de Mapa</h4>
            <div class="fondo-opciones">
              <div class="fondo-opcion" [class.activo]="fondoActual === 'normal'" (click)="cambiarFondo('normal')" title="Mapa normal">
                <div class="fondo-preview normal"></div>
                <span>Normal</span>
              </div>
              <div class="fondo-opcion" [class.activo]="fondoActual === 'ciber'" (click)="cambiarFondo('ciber')" title="Cibernético">
                <div class="fondo-preview ciber"></div>
                <span>🌐 Cyber</span>
              </div>
              <div class="fondo-opcion" [class.activo]="fondoActual === 'oscuro'" (click)="cambiarFondo('oscuro')" title="Oscuro">
                <div class="fondo-preview oscuro"></div>
                <span>Oscuro</span>
              </div>
              <div class="fondo-opcion" [class.activo]="fondoActual === 'noche'" (click)="cambiarFondo('noche')" title="Noche">
                <div class="fondo-preview noche"></div>
                <span>Noche</span>
              </div>
              <div class="fondo-opcion" [class.activo]="fondoActual === 'satelite'" (click)="cambiarFondo('satelite')" title="Satélite">
                <div class="fondo-preview satelite"></div>
                <span>Satélite</span>
              </div>
              <div class="fondo-opcion" [class.activo]="fondoActual === 'terreno'" (click)="cambiarFondo('terreno')" title="Terreno">
                <div class="fondo-preview terreno"></div>
                <span>Terreno</span>
              </div>
            </div>
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

            <!-- Filtro por parada de itinerario eliminado — se usa checkbox en Capas -->

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
                    <strong>{{ item.origen || '—' }} → {{ item.destino || '—' }}</strong>
                    <span class="ruta-count">({{ item.empresas.length }} empresa(s))</span>
                  </div>
                  <div class="ruta-meta" *ngIf="item.distanciaKm || item.paradasItinerario > 0">
                    <span *ngIf="item.distanciaKm" class="meta-tag dist">📏 {{ item.distanciaKm }} km</span>
                    <span *ngIf="item.paradasItinerario > 0" class="meta-tag stop">🛑 {{ item.paradasItinerario }} parada(s)</span>
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
    
    .fs-header-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .btn-back {
      margin-right: 4px;
    }
    
    .btn-fit {
      background: rgba(255,255,255,0.15) !important;
      border-radius: 50%;
    }
    
    .btn-fit:hover {
      background: rgba(255,255,255,0.3) !important;
    }
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
    
    .parada-num {
      background: #ff7800;
      color: white;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      flex-shrink: 0;
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
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 4px;
      color: #fff;
      text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    
    .stat-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.9);
    }
    
    .ruta-meta {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    
    .meta-tag {
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 10px;
      font-weight: 600;
    }
    
    .meta-tag.dist {
      background: #e3f2fd;
      color: #1565c0;
    }
    
    .meta-tag.stop {
      background: #fff3e0;
      color: #e65100;
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

    /* Selector de fondos */
    .fondo-opciones {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .fondo-opcion {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      border: 2px solid transparent;
      transition: border-color 0.2s;
      font-size: 11px;
      color: #555;
    }

    .fondo-opcion:hover { border-color: #aaa; }
    .fondo-opcion.activo { border-color: #667eea; color: #667eea; font-weight: 600; }

    .fondo-preview {
      width: 100%;
      height: 36px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }

    .fondo-preview.normal   { background: linear-gradient(135deg, #e8f4f8 0%, #b8d4e8 100%); }
    .fondo-preview.ciber    { background: linear-gradient(135deg, #000511 0%, #001a33 50%, #00ff88 100%); border-color: #00ff88; }
    .fondo-preview.oscuro   { background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%); }
    .fondo-preview.noche    { background: linear-gradient(135deg, #000 0%, #333 50%, #fff 100%); }
    .fondo-preview.satelite { background: linear-gradient(135deg, #2d5016 0%, #4a7c2f 50%, #8b6914 100%); }
    .fondo-preview.terreno  { background: linear-gradient(135deg, #c8b560 0%, #8a7040 50%, #6b4423 100%); }
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
  mostrarEtiquetasRutas = false;
  mostrarEtiquetasPoligonos = false;
  mostrarHeatmap = false;
  mostrarItinerarios = false;
  private etiquetasRutasLayer: L.LayerGroup | null = null;
  private etiquetasPoligonosLayer: L.LayerGroup | null = null;
  private heatmapLayer: L.LayerGroup | null = null;
  private itinerariosLayer: L.LayerGroup | null = null;
  fondoActual = 'normal';
  private tileLayer: L.TileLayer | null = null;

  // URLs de tiles por fondo
  private readonly FONDOS: Record<string, { url: string; attr: string; filter?: string }> = {
    normal:    {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attr: 'OpenStreetMap'
    },
    ciber:     {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attr: 'CartoDB',
      filter: 'saturate(1.8) hue-rotate(140deg) brightness(1.1)'
    },
    oscuro:    {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attr: 'CartoDB'
    },
    noche:     {
      // CartoDB Positron invertido — alto contraste
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attr: 'CartoDB',
      filter: 'invert(1) hue-rotate(180deg) brightness(0.85)'
    },
    satelite:  {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr: 'Esri World Imagery'
    },
    terreno:   {
      // OpenTopoMap — funciona sin key
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attr: 'OpenTopoMap'
    }
  };

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

  // Filtro de paradas de itinerario
  busquedaParada = '';
  mostrarSugerenciasParadas = false;
  sugerenciasParadas: string[] = [];
  paradasSeleccionadas: string[] = [];
  paradasUnicas: string[] = [];

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
    this.inicializarParadasUnicas();
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

      this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap',
        maxZoom: 19
      });
      this.tileLayer.addTo(this.map);

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
          // Paleta de colores para provincias — golden angle para máxima distinción
          const paletaProvincias = [
            '#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c',
            '#3498db','#9b59b6','#e91e63','#00bcd4','#8bc34a',
            '#ff5722','#607d8b','#795548'
          ];
          let idxProvincia = 0;
          const layer = L.geoJSON(data, {
            style: (feature) => {
              const color = paletaProvincias[idxProvincia % paletaProvincias.length];
              idxProvincia++;
              return {
                color,
                weight: 2,
                opacity: 0.9,
                fillColor: color,
                fillOpacity: 0.18
              };
            },
            onEachFeature: (feature, layer) => {
              const props = feature.properties || {};
              const nombre = props.NOMBPROV || props.nombre || 'Provincia';
              layer.bindPopup(`<strong>🏛️ ${nombre}</strong>`);
              layer.on('mouseover', (e: any) => {
                (e.target as any).setStyle({ fillOpacity: 0.45, weight: 3 });
              });
              layer.on('mouseout', (e: any) => {
                (layer as any).resetStyle ? (layer as any).resetStyle(e.target) :
                  (e.target as any).setStyle({ fillOpacity: 0.18, weight: 2 });
              });
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
      if (this.mostrarItinerarios) this.toggleItinerariosEnMapa();
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

  // ── Heatmap de densidad de rutas ─────────────────────────────────────

  toggleHeatmap() {
    if (!this.map) return;

    if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer);
      this.heatmapLayer = null;
      // Limpiar leyenda
      const legend = document.getElementById('heatmap-legend');
      if (legend) legend.remove();
    }

    if (!this.mostrarHeatmap) return;

    // Acumular densidad por cuadrícula (~1.5km)
    const densidad = new Map<string, { lat: number; lng: number; count: number }>();
    const coordKey = (lat: number, lng: number) => `${lat.toFixed(2)},${lng.toFixed(2)}`;

    this.rutasFiltradas.forEach(ruta => {
      [
        { lat: ruta.origen?.coordenadas?.latitud,  lng: ruta.origen?.coordenadas?.longitud },
        { lat: ruta.destino?.coordenadas?.latitud, lng: ruta.destino?.coordenadas?.longitud }
      ].forEach(p => {
        if (p.lat != null && p.lng != null && !isNaN(Number(p.lat))) {
          const k = coordKey(Number(p.lat), Number(p.lng));
          const e = densidad.get(k) || { lat: Number(p.lat), lng: Number(p.lng), count: 0 };
          e.count++;
          densidad.set(k, e);
        }
      });
    });

    if (densidad.size === 0) return;

    const values = Array.from(densidad.values()).map(e => e.count).sort((a, b) => a - b);
    const maxCount = values[values.length - 1];
    // Escala logarítmica — evita que todos queden en rojo cuando el max es bajo
    const logMax = Math.log1p(maxCount);

    this.heatmapLayer = L.layerGroup();

    densidad.forEach(punto => {
      // Ratio logarítmico 0-1: diferencia real entre 1 ruta y 10 rutas
      const logRatio = logMax > 0 ? Math.log1p(punto.count) / logMax : 0;
      const ratio = logRatio; // alias para el resto del código

      const color = this.thermalColor(ratio);

      // Radio en metros — escala con el zoom del mapa (3km a 0.3km según densidad)
      const radioMetros = 2500 + Math.round(1500 * ratio);

      // Gradiente radial via divIcon SVG — tamaño proporcional a la cantidad
      const svgSize = Math.round(60 + 140 * ratio); // 60px (mín) → 200px (máx)
      const [r, g, b] = this.thermalRGB(ratio);
      const icon = L.divIcon({
        html: `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}"
                    xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
          <defs>
            <radialGradient id="hg_${punto.lat.toFixed(3)}_${punto.lng.toFixed(3)}"
                            cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%"   stop-color="rgb(${r},${g},${b})" stop-opacity="${0.75 + 0.2 * ratio}"/>
              <stop offset="30%"  stop-color="rgb(${r},${g},${b})" stop-opacity="${0.45 + 0.15 * ratio}"/>
              <stop offset="65%"  stop-color="rgb(${r},${g},${b})" stop-opacity="${0.18 + 0.1 * ratio}"/>
              <stop offset="100%" stop-color="rgb(${r},${g},${b})" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <ellipse cx="${svgSize/2}" cy="${svgSize/2}"
                   rx="${svgSize/2}" ry="${svgSize/2}"
                   fill="url(#hg_${punto.lat.toFixed(3)}_${punto.lng.toFixed(3)})"/>
        </svg>`,
        className: '',
        iconSize: [svgSize, svgSize],
        iconAnchor: [svgSize / 2, svgSize / 2]
      });

      L.marker([punto.lat, punto.lng], { icon, interactive: false, zIndexOffset: -100 })
        .addTo(this.heatmapLayer!);

      // Núcleo pequeño e interactivo con tooltip
      const nivel = ratio >= 0.75 ? '🔴 Alta' :
                    ratio >= 0.5  ? '🟠 Media' :
                    ratio >= 0.25 ? '🟡 Baja' : '🔵 Mínima';

      L.circleMarker([punto.lat, punto.lng], {
        radius: 5 + Math.round(7 * ratio),
        fillColor: color,
        fillOpacity: 0.95,
        color: '#fff',
        weight: 1.5
      })
        .bindTooltip(`
          <div style="font-size:12px;padding:3px 7px;">
            <strong>${punto.count} ruta(s)</strong> — ${nivel}<br>
            <span style="font-size:10px;color:#888">${Math.round(ratio * 100)}% del máximo</span>
          </div>`, { sticky: true }
        )
        .addTo(this.heatmapLayer!);
    });

    this.heatmapLayer.addTo(this.map);

    // Leyenda de temperatura al activar
    this.mostrarLeyendaHeatmap(values[0], maxCount, Math.round(maxCount * 0.75));
  }

  private mostrarLeyendaHeatmap(min: number, max: number, p90: number) {
    if (!this.map) return;
    const oldLegend = document.getElementById('heatmap-legend');
    if (oldLegend) oldLegend.remove();

    // Agregar la leyenda directamente al contenedor del mapa
    const mapContainer = this.map.getContainer();
    const div = document.createElement('div');
    div.id = 'heatmap-legend';
    div.style.cssText = `
      position:absolute;bottom:28px;right:10px;z-index:1000;
      background:rgba(255,255,255,0.93);padding:10px 14px;border-radius:8px;
      box-shadow:0 2px 8px rgba(0,0,0,0.22);font-size:11px;min-width:140px;
      font-family:'Roboto',sans-serif;
    `;
    div.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px;color:#333;">🌡️ Rutas por zona</div>
      <div style="width:100%;height:12px;border-radius:6px;margin-bottom:4px;
        background:linear-gradient(to right,#0000ff,#00c8ff,#00ff00,#ffff00,#ff8c00,#ff0000,#1e0000);
        border:1px solid #ccc;"></div>
      <div style="display:flex;justify-content:space-between;color:#555;font-size:10px;">
        <span>${min} ruta</span><span>${max} rutas</span>
      </div>
      <div style="margin-top:5px;font-size:10px;color:#888;">Alta densidad ≥ ${p90}</div>
    `;
    mapContainer.appendChild(div);
  }

  // Paleta térmica con negro en el máximo: azul→cian→verde→amarillo→naranja→rojo→negro
  private thermalColor(t: number): string {
    const [r, g, b] = this.thermalRGB(t);
    return `rgb(${r},${g},${b})`;
  }

  // Devuelve [r, g, b] para poder usarlos en SVG
  private thermalRGB(t: number): [number, number, number] {
    const stops: [number, number[]][] = [
      [0,     [0,   0,   255]],   // azul — pocas rutas
      [0.18,  [0,   180, 255]],   // cian
      [0.35,  [0,   255, 80 ]],   // verde
      [0.52,  [200, 255, 0  ]],   // verde-amarillo
      [0.65,  [255, 220, 0  ]],   // amarillo
      [0.78,  [255, 120, 0  ]],   // naranja
      [0.9,   [255, 0,   0  ]],   // rojo — muchas rutas
      [1.0,   [30,  0,   0  ]]    // casi negro — zona máxima
    ];

    for (let i = 0; i < stops.length - 1; i++) {
      const [t0, c0] = stops[i];
      const [t1, c1] = stops[i + 1];
      if (t >= t0 && t <= t1) {
        const f = (t - t0) / (t1 - t0);
        return [
          Math.round(c0[0] + f * (c1[0] - c0[0])),
          Math.round(c0[1] + f * (c1[1] - c0[1])),
          Math.round(c0[2] + f * (c1[2] - c0[2]))
        ];
      }
    }
    return [255, 0, 0];
  }

  // ── Itinerarios de rutas en el mapa ─────────────────────────────────

  toggleItinerariosEnMapa() {
    if (!this.map) return;

    if (this.itinerariosLayer) {
      this.map.removeLayer(this.itinerariosLayer);
      this.itinerariosLayer = null;
    }

    if (!this.mostrarItinerarios) return;

    this.itinerariosLayer = L.layerGroup();

    this.rutasFiltradas.forEach(ruta => {
      if (!ruta.itinerario?.length) return;

      ruta.itinerario.forEach((parada, orden) => {
        const lat = parada.coordenadas?.latitud;
        const lng = parada.coordenadas?.longitud;
        if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) return;

        const num = orden + 1;
        const icon = L.divIcon({
          html: `<div style="
            width:22px;height:22px;
            background:linear-gradient(135deg,#ff8c00,#e65100);
            border:2px solid white;border-radius:50%;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            color:white;font-weight:700;font-size:11px;
          ">${num}</div>`,
          className: '',
          iconSize: L.point(22, 22),
          iconAnchor: L.point(11, 11)
        });

        const marker = L.marker([Number(lat), Number(lng)], { icon })
          .bindPopup(`
            <div style="font-size:12px;">
              <strong>🛑 Parada ${num}</strong><br>
              ${parada.nombre}<br>
              <small style="color:#888;">Ruta: ${ruta.codigoRuta}</small>
            </div>
          `);

        this.itinerariosLayer!.addLayer(marker);
      });
    });

    this.itinerariosLayer.addTo(this.map);
  }

  // ── Cambio de fondo de mapa ──────────────────────────────────────────

  cambiarFondo(fondo: string) {
    if (!this.map) return;
    this.fondoActual = fondo;

    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }

    const config = this.FONDOS[fondo] || this.FONDOS['normal'];
    this.tileLayer = L.tileLayer(config.url, { attribution: config.attr, maxZoom: 19 });
    this.tileLayer.addTo(this.map);

    // Aplicar filtro SOLO al tile pane — no afecta el heatmap ni otros overlays
    const mapEl = this.map.getContainer();
    // Limpiar filtro del contenedor completo (por si quedó de antes)
    mapEl.style.filter = 'none';

    // Aplicar al pane de tiles solamente
    const tilePaneEl = this.map.getPanes().tilePane as HTMLElement;
    if (tilePaneEl) {
      tilePaneEl.style.filter = config.filter || 'none';
    }
  }

  // ── Etiquetas de rutas ───────────────────────────────────────────────

  toggleEtiquetasRutas() {
    if (!this.map) return;

    if (this.etiquetasRutasLayer) {
      this.map.removeLayer(this.etiquetasRutasLayer);
      this.etiquetasRutasLayer = null;
    }

    if (this.mostrarEtiquetasRutas && this.rutasFiltradas.length > 0) {
      this.etiquetasRutasLayer = L.layerGroup();
      this.rutasFiltradas.forEach(ruta => {
        const latO = ruta.origen?.coordenadas?.latitud;
        const lngO = ruta.origen?.coordenadas?.longitud;
        const latD = ruta.destino?.coordenadas?.latitud;
        const lngD = ruta.destino?.coordenadas?.longitud;

        if (latO != null && lngO != null && !isNaN(Number(latO)) && !isNaN(Number(lngO))) {
          const etiqueta = L.marker([Number(latO), Number(lngO)], {
            icon: L.divIcon({
              html: `<div style="
                background-color:rgba(255,255,255,0.92)!important;
                border:1.5px solid #667eea;
                border-radius:4px;
                padding:2px 7px;
                font-size:11px;
                font-weight:700;
                color:#1a237e;
                white-space:nowrap;
                pointer-events:none;
                box-shadow:0 2px 6px rgba(0,0,0,0.25);
                display:inline-block;
              ">${ruta.origen!.nombre}</div>`,
              className: '',
              iconAnchor: [0, 0]
            })
          });
          this.etiquetasRutasLayer!.addLayer(etiqueta);
        }

        if (latD != null && lngD != null && !isNaN(Number(latD)) && !isNaN(Number(lngD))) {
          const etiqueta = L.marker([Number(latD), Number(lngD)], {
            icon: L.divIcon({
              html: `<div style="
                background-color:rgba(255,255,255,0.92)!important;
                border:1.5px solid #d32f2f;
                border-radius:4px;
                padding:2px 7px;
                font-size:11px;
                font-weight:700;
                color:#b71c1c;
                white-space:nowrap;
                pointer-events:none;
                box-shadow:0 2px 6px rgba(0,0,0,0.25);
                display:inline-block;
              ">${ruta.destino!.nombre}</div>`,
              className: '',
              iconAnchor: [0, 0]
            })
          });
          this.etiquetasRutasLayer!.addLayer(etiqueta);
        }
      });
      this.etiquetasRutasLayer.addTo(this.map);
    }
  }

  // ── Etiquetas de polígonos (distritos/provincias) ─────────────────────

  toggleEtiquetasPoligonos() {
    if (!this.map) return;

    if (this.etiquetasPoligonosLayer) {
      this.map.removeLayer(this.etiquetasPoligonosLayer);
      this.etiquetasPoligonosLayer = null;
    }

    if (!this.mostrarEtiquetasPoligonos) return;

    this.etiquetasPoligonosLayer = L.layerGroup();
    const self = this;

    // Etiquetas de provincias
    fetch('assets/geojson/puno-provincias-geometria.geojson')
      .then(r => r.ok ? r.json() : Promise.reject('Error'))
      .then(data => {
        if (!self.map || !self.etiquetasPoligonosLayer) return;
        (data.features as any[]).forEach((f: any) => {
          const nombre = f.properties?.NOMBPROV || f.properties?.nombre;
          if (!nombre) return;
          const coords = f.geometry?.coordinates;
          if (!coords) return;
          // Calcular centroide aproximado del primer polígono
          try {
            const ring = f.geometry.type === 'MultiPolygon' ? coords[0][0] : coords[0];
            const lat = ring.reduce((s: number, c: number[]) => s + c[1], 0) / ring.length;
            const lng = ring.reduce((s: number, c: number[]) => s + c[0], 0) / ring.length;
            const icon = L.divIcon({
              html: `<div style="
                background-color:#fff!important;
                border:2px solid #1565c0;
                border-radius:4px;padding:3px 8px;
                font-size:13px;font-weight:800;color:#0d47a1;
                white-space:nowrap;pointer-events:none;
                box-shadow:0 2px 8px rgba(0,0,0,0.35);
                text-shadow:0 1px 0 rgba(255,255,255,0.8);
                display:inline-block;letter-spacing:0.3px;
              ">${nombre}</div>`,
              className: '', iconAnchor: [0, 0]
            });
            self.etiquetasPoligonosLayer!.addLayer(L.marker([lat, lng], { icon }));
          } catch {}
        });
        self.etiquetasPoligonosLayer!.addTo(self.map);
      })
      .catch(() => {});

    // Etiquetas de distritos
    fetch('assets/geojson/puno-distritos-geometria.geojson')
      .then(r => r.ok ? r.json() : Promise.reject('Error'))
      .then(data => {
        if (!self.map || !self.etiquetasPoligonosLayer) return;
        (data.features as any[]).forEach((f: any) => {
          const nombre = f.properties?.NOMBDIST || f.properties?.nombre;
          if (!nombre) return;
          try {
            const coords = f.geometry?.coordinates;
            const ring = f.geometry.type === 'MultiPolygon' ? coords[0][0] : coords[0];
            const lat = ring.reduce((s: number, c: number[]) => s + c[1], 0) / ring.length;
            const lng = ring.reduce((s: number, c: number[]) => s + c[0], 0) / ring.length;
            const icon = L.divIcon({
              html: `<div style="
                background:rgba(255,120,0,0.12);
                border:1px solid #ff7800;
                border-radius:3px;padding:1px 4px;
                font-size:10px;font-weight:600;color:#bf360c;
                white-space:nowrap;pointer-events:none;
              ">${nombre}</div>`,
              className: '', iconAnchor: [0, 0]
            });
            self.etiquetasPoligonosLayer!.addLayer(L.marker([lat, lng], { icon }));
          } catch {}
        });
        self.etiquetasPoligonosLayer!.addTo(self.map);
      })
      .catch(() => {});
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

    // Empresas por ruta (con resoluciones, distancia e itinerario)
    const empresasPorRuta = Array.from(empresasPorRutaMap.entries()).map(([rutaKey, empresas]) => {
      // Split robusto — funciona con o sin espacios alrededor de →
      const sepIdx = rutaKey.indexOf(' → ');
      const origen = sepIdx >= 0 ? rutaKey.substring(0, sepIdx) : rutaKey;
      const destino = sepIdx >= 0 ? rutaKey.substring(sepIdx + 3) : '';

      const resolucionesMap = resolucionesPorRutaMap.get(rutaKey) || new Map();
      const resoluciones = Array.from(resolucionesMap.entries()).map(([nro, tipo]) => ({ nro, tipo }));

      // Distancia e itinerario para esta ruta
      let distanciaKm = 0;
      let paradasItinerario = 0;
      this.rutasFiltradas.forEach(r => {
        const k = `${r.origen?.nombre || 'Sin origen'} → ${r.destino?.nombre || 'Sin destino'}`;
        if (k === rutaKey) {
          if (r.distancia && r.distancia > distanciaKm) distanciaKm = r.distancia;
          if (r.itinerario?.length > paradasItinerario) paradasItinerario = r.itinerario.length;
        }
      });

      return {
        origen,
        destino,
        empresas: Array.from(empresas).sort(),
        resoluciones,
        distanciaKm: distanciaKm > 0 ? distanciaKm : null,
        paradasItinerario
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

  // ── Filtro de paradas de itinerario ──────────────────────────────────

  private inicializarParadasUnicas() {
    const set = new Set<string>();
    this.rutas.forEach(r => {
      r.itinerario?.forEach(p => { if (p.nombre) set.add(p.nombre); });
    });
    this.paradasUnicas = Array.from(set).sort();
  }

  onBusquedaParadaChange(event: Event) {
    const valor = (event.target as HTMLInputElement).value.toLowerCase().trim();
    if (valor.length < 2) { this.sugerenciasParadas = []; this.mostrarSugerenciasParadas = false; return; }
    this.sugerenciasParadas = this.paradasUnicas.filter(p =>
      p.toLowerCase().includes(valor) && !this.paradasSeleccionadas.includes(p)
    ).slice(0, 8);
    this.mostrarSugerenciasParadas = this.sugerenciasParadas.length > 0;
  }

  agregarParadaSeleccionada(parada: string) {
    if (!this.paradasSeleccionadas.includes(parada)) {
      this.paradasSeleccionadas.push(parada);
    }
    this.busquedaParada = '';
    this.sugerenciasParadas = [];
    this.mostrarSugerenciasParadas = false;
    this.aplicarFiltros();
  }

  removerParadaSeleccionada(parada: string) {
    this.paradasSeleccionadas = this.paradasSeleccionadas.filter(p => p !== parada);
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

  ajustarVistaRutas() {
    if (!this.map || !this.rutasFiltradas.length) return;

    const puntos: L.LatLng[] = [];

    this.rutasFiltradas.forEach(ruta => {
      const latO = ruta.origen?.coordenadas?.latitud;
      const lngO = ruta.origen?.coordenadas?.longitud;
      const latD = ruta.destino?.coordenadas?.latitud;
      const lngD = ruta.destino?.coordenadas?.longitud;

      if (latO != null && lngO != null && !isNaN(Number(latO)) && !isNaN(Number(lngO))) {
        puntos.push(L.latLng(Number(latO), Number(lngO)));
      }
      if (latD != null && lngD != null && !isNaN(Number(latD)) && !isNaN(Number(lngD))) {
        puntos.push(L.latLng(Number(latD), Number(lngD)));
      }
    });

    if (puntos.length === 0) return;

    const bounds = L.latLngBounds(puntos);
    this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
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
  empresasPorRuta: { origen: string; destino: string; empresas: string[]; resoluciones: { nro: string; tipo: string }[]; distanciaKm: number | null; paradasItinerario: number }[];
  rankingEmpresas: { nombre: string; count: number }[];
  maxRutasPorEmpresa: number;
}