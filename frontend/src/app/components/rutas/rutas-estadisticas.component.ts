import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../models/ruta.model';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface EstadisticaRuta {
  total: number;
  activas: number;
  inactivas: number;
  porEmpresa: { [key: string]: number };
  porTipoRuta: { [key: string]: number };
  porEstado: { [key: string]: number };
}

interface LocalidadEstadistica {
  nombre: string;
  comoOrigen: number;
  comoDestino: number;
  total: number;
  porcentaje: number;
}

@Component({
  selector: 'app-rutas-estadisticas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="estadisticas-container">
      <!-- Header -->
      <div class="stats-header">
        <div class="header-content">
          <div class="header-info">
            <mat-icon class="header-icon">analytics</mat-icon>
            <div>
              <h1>Estadísticas de Rutas</h1>
              <p>Análisis detallado del sistema de transporte</p>
            </div>
          </div>
          <button mat-raised-button color="primary" (click)="recargarEstadisticas()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-container">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>Cargando estadísticas...</p>
        </div>
      } @else {
        <!-- Tarjetas de resumen -->
        <div class="stats-cards">
          <mat-card class="stat-card total">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon>route</mat-icon>
                <div class="stat-info">
                  <h3>{{ estadisticas().total }}</h3>
                  <p>Total de Rutas</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card activas">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon>check_circle</mat-icon>
                <div class="stat-info">
                  <h3>{{ estadisticas().activas }}</h3>
                  <p>Rutas Activas</p>
                  <small>{{ getPorcentaje(estadisticas().activas, estadisticas().total) }}%</small>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card empresas">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon>business</mat-icon>
                <div class="stat-info">
                  <h3>{{ getEmpresasCount() }}</h3>
                  <p>Empresas con Rutas</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card localidades">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon>place</mat-icon>
                <div class="stat-info">
                  <h3>{{ localidadesAtendidas().length }}</h3>
                  <p>Localidades Atendidas</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Gráficos y análisis -->
        <div class="charts-container">
          <!-- Fila superior: 3 columnas -->
          <div class="charts-row">
            <!-- Localidades más atendidas -->
            <mat-card class="chart-card compact clickable" (click)="abrirDetalleLocalidades()">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>trending_up</mat-icon>
                  Localidades Más Atendidas
                </mat-card-title>
                <mat-card-subtitle>Top 8 (click para ver todas)</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="localidades-ranking compact">
                  @for (localidad of topLocalidades().slice(0, 8); track localidad.nombre; let i = $index) {
                    <div class="ranking-item compact" [class]="'rank-' + (i + 1)">
                      <div class="rank-number small">{{ i + 1 }}</div>
                      <div class="localidad-info compact">
                        <div class="localidad-nombre small">{{ localidad.nombre }}</div>
                        <div class="localidad-stats small">
                          <span class="stat-badge origen small">{{ localidad.comoOrigen }}o</span>
                          <span class="stat-badge destino small">{{ localidad.comoDestino }}d</span>
                        </div>
                      </div>
                      <div class="localidad-total compact">
                        <strong>{{ localidad.total }}</strong>
                      </div>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Distribución Geográfica -->
            <mat-card class="chart-card compact clickable" (click)="abrirDetalleGeografia()">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>map</mat-icon>
                  Distribución por Provincia
                </mat-card-title>
                <mat-card-subtitle>Por provincia (click para detalles)</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="geografia-stats compact">
                  @for (provincia of getProvincias().slice(0, 4); track provincia.nombre; let i = $index) {
                    <div class="provincia-item compact">
                      <div class="provincia-header compact">
                        <span class="provincia-nombre small">{{ provincia.nombre }}</span>
                        <span class="provincia-total small">{{ provincia.total }}</span>
                      </div>
                      <div class="provincia-details tiny">
                        @if (provincia.coordenadas) {
                          <span class="coordenadas">📍 {{ provincia.coordenadas.lat.toFixed(2) }}, {{ provincia.coordenadas.lng.toFixed(2) }}</span>
                        }
                        <span class="localidades-count">{{ provincia.localidades.length }} localidades</span>
                      </div>
                      <div class="provincia-progress small">
                        <mat-progress-bar 
                          mode="determinate" 
                          [value]="provincia.porcentaje"
                          color="primary">
                        </mat-progress-bar>
                      </div>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Análisis de Frecuencias -->
            <mat-card class="chart-card compact clickable" (click)="abrirDetalleFrecuencias()">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>schedule</mat-icon>
                  Análisis de Frecuencias
                </mat-card-title>
                <mat-card-subtitle>Calidad del servicio (click para detalles)</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="frecuencias-analysis compact">
                  <div class="frecuencias-summary compact">
                    <div class="summary-item compact">
                      <span class="label small">Con frecuencias:</span>
                      <span class="value small">{{ getRutasConFrecuencias().conFrecuencias }}</span>
                    </div>
                    <div class="summary-item compact">
                      <span class="label small">Sin información:</span>
                      <span class="value small">{{ getRutasConFrecuencias().sinFrecuencias }}</span>
                    </div>
                  </div>
                  
                  <div class="frecuencias-top compact">
                    <h4 class="small">Top Frecuencias</h4>
                    @for (ruta of getTopFrecuencias().slice(0, 4); track ruta.codigoRuta; let i = $index) {
                      <div class="frecuencia-item compact">
                        <div class="frecuencia-rank small">{{ i + 1 }}</div>
                        <div class="frecuencia-info compact">
                          <div class="ruta-codigo small">{{ ruta.codigoRuta }}</div>
                          <div class="ruta-descripcion tiny">{{ ruta.origen }} - {{ ruta.destino }}</div>
                        </div>
                        <div class="frecuencia-value compact">
                          <span class="frecuencia-text tiny">{{ ruta.frecuencias.substring(0, 20) }}...</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Fila inferior: 3 columnas -->
          <div class="charts-row">
            <!-- Conectividad entre Localidades -->
            <mat-card class="chart-card compact clickable" (click)="abrirDetalleConectividad()">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>device_hub</mat-icon>
                  Conectividad
                </mat-card-title>
                <mat-card-subtitle>Pares más frecuentes (click para detalles)</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="conectividad-stats compact">
                  @for (conexion of getTopConexiones().slice(0, 6); track conexion.par; let i = $index) {
                    <div class="conexion-item compact">
                      <div class="conexion-rank small">{{ i + 1 }}</div>
                      <div class="conexion-info compact">
                        <div class="conexion-ruta compact">
                          <span class="origen small">{{ conexion.origen.substring(0, 8) }}</span>
                          <mat-icon class="conexion-arrow tiny">arrow_forward</mat-icon>
                          <span class="destino small">{{ conexion.destino.substring(0, 8) }}</span>
                        </div>
                        <div class="conexion-details compact">
                          <span class="bidireccional tiny" [class.active]="conexion.esBidireccional">
                            @if (conexion.esBidireccional) {
                              <mat-icon class="tiny">swap_horiz</mat-icon>
                              Bi
                            } @else {
                              <mat-icon class="tiny">trending_flat</mat-icon>
                              Uni
                            }
                          </span>
                        </div>
                      </div>
                      <div class="conexion-count compact">
                        <strong class="small">{{ conexion.cantidad }}</strong>
                      </div>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Empresas con Más Rutas -->
            <mat-card class="chart-card compact clickable" (click)="abrirDetalleEmpresas()">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>business_center</mat-icon>
                  Empresas Top
                </mat-card-title>
                <mat-card-subtitle>Más rutas (click para detalles)</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="empresas-ranking compact">
                  @for (empresa of topEmpresas().slice(0, 6); track empresa.nombre; let i = $index) {
                    <div class="empresa-item compact">
                      <div class="empresa-rank small">{{ i + 1 }}</div>
                      <div class="empresa-info compact">
                        <div class="empresa-nombre small">{{ empresa.nombre.substring(0, 25) }}...</div>
                        <div class="empresa-ruc tiny">{{ empresa.ruc }}</div>
                      </div>
                      <div class="empresa-stats compact">
                        <span class="rutas-count small">{{ empresa.cantidad }}</span>
                      </div>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Localidades menos atendidas -->
            <mat-card class="chart-card compact warning clickable" (click)="abrirDetalleMenosAtendidas()">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>warning</mat-icon>
                  Menos Atendidas
                </mat-card-title>
                <mat-card-subtitle>Necesitan atención (click para detalles)</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="localidades-menos-atendidas compact">
                  @for (localidad of localidadesMenosAtendidas().slice(0, 6); track localidad.nombre) {
                    <div class="localidad-item-mini compact">
                      <mat-icon class="warning-icon tiny">place</mat-icon>
                      <div class="localidad-info-mini compact">
                        <span class="nombre small">{{ localidad.nombre }}</span>
                        <span class="count tiny">{{ localidad.total }}</span>
                      </div>
                    </div>
                  }
                  @if (localidadesMenosAtendidas().length === 0) {
                    <div class="no-data compact">
                      <mat-icon class="small">check_circle</mat-icon>
                      <p class="small">Todas bien atendidas</p>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .estadisticas-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .stats-header {
      margin-bottom: 32px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .header-info h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }

    .header-info p {
      margin: 4px 0 0 0;
      opacity: 0.9;
    }

    .loading-container {
      text-align: center;
      padding: 48px;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-content mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .stat-card.total mat-icon { color: #2196F3; }
    .stat-card.activas mat-icon { color: #4CAF50; }
    .stat-card.empresas mat-icon { color: #FF9800; }
    .stat-card.localidades mat-icon { color: #9C27B0; }

    .stat-info h3 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
    }

    .stat-info p {
      margin: 4px 0 0 0;
      color: #666;
      font-weight: 500;
    }

    .stat-info small {
      color: #4CAF50;
      font-weight: 600;
    }

    .charts-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
    }

    .chart-card {
      height: fit-content;
    }

    .chart-card.compact {
      min-height: 320px;
      max-height: 400px;
    }

    .chart-card.clickable {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .chart-card.clickable:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }

    .chart-card.clickable mat-card-subtitle {
      color: #1976d2;
      font-weight: 500;
    }

    .chart-card.warning {
      border-left: 4px solid #FF5722;
    }

    // Estilos compactos
    .compact {
      padding: 8px !important;
      margin: 4px 0 !important;
      gap: 8px !important;
    }

    .small {
      font-size: 12px !important;
      line-height: 1.2 !important;
    }

    .tiny {
      font-size: 10px !important;
      line-height: 1.1 !important;
    }

    // Localidades ranking compacto
    .localidades-ranking.compact {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 280px;
      overflow-y: auto;
    }

    .ranking-item.compact {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      border-radius: 6px;
      background: #f8f9fa;
      min-height: 32px;
    }

    .rank-number.small {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #2196F3;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 10px;
    }

    .localidad-info.compact {
      flex: 1;
      min-width: 0;
    }

    .localidad-nombre.small {
      font-weight: 600;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .localidad-stats.small {
      display: flex;
      gap: 4px;
    }

    .stat-badge.small {
      padding: 1px 4px;
      border-radius: 8px;
      font-size: 9px;
      font-weight: 500;
    }

    .localidad-total.compact {
      text-align: right;
      min-width: 30px;
    }

    // Geografía compacta
    .geografia-stats.compact {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 280px;
      overflow-y: auto;
    }

    .provincia-item.compact {
      padding: 8px;
      border-radius: 6px;
      background: #f8f9fa;
      border-left: 3px solid #2196F3;
    }

    .provincia-header.compact {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .provincia-details.tiny {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 4px;
    }

    .coordenadas {
      color: #4CAF50;
      font-weight: 500;
    }

    .localidades-count {
      color: #666;
      font-style: italic;
    }

    .provincia-progress.small {
      height: 4px;
    }

    // Frecuencias compacta
    .frecuencias-analysis.compact {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .frecuencias-summary.compact {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .summary-item.compact {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .frecuencias-top.compact h4.small {
      margin: 0 0 6px 0;
      font-size: 12px;
    }

    .frecuencia-item.compact {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px;
      border-radius: 4px;
      background: #f8f9fa;
      margin-bottom: 4px;
    }

    .frecuencia-rank.small {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #FF9800;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 600;
    }

    .frecuencia-info.compact {
      flex: 1;
      min-width: 0;
    }

    .ruta-codigo.small {
      font-weight: 600;
      font-size: 11px;
    }

    .ruta-descripcion.tiny {
      color: #666;
      font-size: 9px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .frecuencia-text.tiny {
      font-size: 8px;
      color: #FF9800;
      font-weight: 500;
      background: #fff3e0;
      padding: 1px 3px;
      border-radius: 3px;
    }

    // Conectividad compacta
    .conectividad-stats.compact {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 280px;
      overflow-y: auto;
    }

    .conexion-item.compact {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px;
      border-radius: 6px;
      background: #f8f9fa;
    }

    .conexion-rank.small {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #9C27B0;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
    }

    .conexion-info.compact {
      flex: 1;
      min-width: 0;
    }

    .conexion-ruta.compact {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 2px;
    }

    .origen.small, .destino.small {
      font-weight: 500;
      font-size: 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 60px;
    }

    .conexion-arrow.tiny {
      color: #666;
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    .bidireccional.tiny {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 8px;
      color: #666;
      padding: 1px 3px;
      border-radius: 3px;
      background: #e0e0e0;
    }

    .bidireccional.tiny.active {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .bidireccional.tiny mat-icon.tiny {
      font-size: 10px;
      width: 10px;
      height: 10px;
    }

    .conexion-count.compact {
      text-align: right;
      min-width: 20px;
    }

    // Empresas compacta
    .empresas-ranking.compact {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 280px;
      overflow-y: auto;
    }

    .empresa-item.compact {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px;
      border-radius: 6px;
      background: #f8f9fa;
    }

    .empresa-rank.small {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #FF9800;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 600;
    }

    .empresa-info.compact {
      flex: 1;
      min-width: 0;
    }

    .empresa-nombre.small {
      font-weight: 500;
      font-size: 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .empresa-ruc.tiny {
      color: #666;
      font-size: 8px;
    }

    .rutas-count.small {
      font-weight: 600;
      color: #FF9800;
      font-size: 12px;
    }

    // Menos atendidas compacta
    .localidades-menos-atendidas.compact {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 280px;
      overflow-y: auto;
    }

    .localidad-item-mini.compact {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px;
      border-radius: 4px;
      background: #fff3e0;
    }

    .warning-icon.tiny {
      color: #FF5722;
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .localidad-info-mini.compact {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;
    }

    .nombre.small {
      font-weight: 500;
      font-size: 10px;
    }

    .count.tiny {
      color: #FF5722;
      font-size: 9px;
      font-weight: 600;
    }

    .no-data.compact {
      text-align: center;
      padding: 12px;
      color: #4CAF50;
    }

    .no-data.compact mat-icon.small {
      font-size: 24px;
      width: 24px;
      height: 24px;
      margin-bottom: 4px;
    }

    .no-data.compact p.small {
      margin: 0;
      font-size: 10px;
    }

    .localidades-ranking {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ranking-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      border-radius: 8px;
      background: #f8f9fa;
      transition: background-color 0.2s ease;
    }

    .ranking-item:hover {
      background: #e9ecef;
    }

    .ranking-item.rank-1 { border-left: 4px solid #FFD700; }
    .ranking-item.rank-2 { border-left: 4px solid #C0C0C0; }
    .ranking-item.rank-3 { border-left: 4px solid #CD7F32; }

    .rank-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #2196F3;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .localidad-info {
      flex: 1;
    }

    .localidad-nombre {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .localidad-stats {
      display: flex;
      gap: 8px;
    }

    .stat-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .stat-badge.origen {
      background: #e3f2fd;
      color: #1976d2;
    }

    .stat-badge.destino {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .localidad-total {
      text-align: right;
      min-width: 60px;
    }

    .progress-bar {
      width: 60px;
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      margin-top: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #2196F3;
      transition: width 0.3s ease;
    }

    .tipo-ruta-stats {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tipo-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .tipo-info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .tipo-nombre {
      font-weight: 500;
    }

    .tipo-count {
      color: #666;
      font-size: 14px;
    }

    .tipo-progress {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tipo-progress mat-progress-bar {
      flex: 1;
    }

    .porcentaje {
      font-size: 14px;
      font-weight: 500;
      min-width: 45px;
      text-align: right;
    }

    .empresas-ranking {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .empresa-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      background: #f8f9fa;
    }

    .empresa-rank {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #FF9800;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .empresa-info {
      flex: 1;
    }

    .empresa-nombre {
      font-weight: 500;
      font-size: 14px;
    }

    .empresa-ruc {
      color: #666;
      font-size: 12px;
    }

    .empresa-stats {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rutas-count {
      font-weight: 600;
      color: #FF9800;
    }

    .progress-mini {
      width: 40px;
      height: 3px;
      background: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-mini .progress-fill {
      height: 100%;
      background: #FF9800;
    }

    .localidades-menos-atendidas {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .localidad-item-mini {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: 6px;
      background: #fff3e0;
    }

    .warning-icon {
      color: #FF5722;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .localidad-info-mini {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;
    }

    .localidad-info-mini .nombre {
      font-weight: 500;
    }

    .localidad-info-mini .count {
      color: #FF5722;
      font-size: 14px;
      font-weight: 600;
    }

    .no-data {
      text-align: center;
      padding: 24px;
      color: #4CAF50;
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }

    // Estilos para distribución geográfica
    .geografia-stats {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .depto-item {
      padding: 12px;
      border-radius: 8px;
      background: #f8f9fa;
      border-left: 4px solid #2196F3;
    }

    .depto-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .depto-nombre {
      font-weight: 600;
      color: #333;
    }

    .depto-total {
      font-weight: 600;
      color: #2196F3;
    }

    .provincias-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }

    .provincia-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: white;
      border-radius: 12px;
      font-size: 12px;
    }

    .provincia-item.more {
      background: #e3f2fd;
      color: #1976d2;
      font-style: italic;
    }

    .provincia-nombre {
      font-weight: 500;
    }

    .provincia-count {
      background: #2196F3;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
    }

    .depto-progress {
      margin-top: 8px;
    }

    // Estilos para análisis de frecuencias
    .frecuencias-analysis {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .frecuencias-summary {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .summary-item .label {
      color: #666;
      font-size: 14px;
    }

    .summary-item .value {
      font-weight: 600;
      color: #333;
    }

    .frecuencias-top h4 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 16px;
    }

    .frecuencia-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: 6px;
      background: #f8f9fa;
      margin-bottom: 8px;
    }

    .frecuencia-rank {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #FF9800;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .frecuencia-info {
      flex: 1;
    }

    .ruta-codigo {
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }

    .ruta-descripcion {
      color: #666;
      font-size: 12px;
    }

    .frecuencia-value {
      text-align: right;
    }

    .frecuencia-text {
      font-size: 12px;
      color: #FF9800;
      font-weight: 500;
      background: #fff3e0;
      padding: 2px 6px;
      border-radius: 4px;
    }

    // Estilos para conectividad
    .conectividad-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .conexion-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      background: #f8f9fa;
      transition: background-color 0.2s ease;
    }

    .conexion-item:hover {
      background: #e9ecef;
    }

    .conexion-rank {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #9C27B0;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
    }

    .conexion-info {
      flex: 1;
    }

    .conexion-ruta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .origen, .destino {
      font-weight: 500;
      color: #333;
    }

    .conexion-arrow {
      color: #666;
      font-size: 18px;
    }

    .conexion-details {
      display: flex;
      align-items: center;
    }

    .bidireccional {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #666;
      padding: 2px 6px;
      border-radius: 4px;
      background: #e0e0e0;
    }

    .bidireccional.active {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .bidireccional mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .conexion-count {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .conexion-count strong {
      font-size: 18px;
      color: #9C27B0;
    }

    .count-label {
      font-size: 11px;
      color: #666;
    }
  `]
})
export class RutasEstadisticasComponent implements OnInit {
  private destroy$ = new Subject<void>();
  private rutaService = inject(RutaService);

  isLoading = signal(false);
  rutas = signal<Ruta[]>([]);

  estadisticas = computed(() => {
    const rutasData = this.rutas();
    const stats: EstadisticaRuta = {
      total: rutasData.length,
      activas: rutasData.filter(r => r.estado === 'ACTIVA').length,
      inactivas: rutasData.filter(r => r.estado !== 'ACTIVA').length,
      porEmpresa: {},
      porTipoRuta: {},
      porEstado: {}
    };

    // Agrupar por empresa
    rutasData.forEach(ruta => {
      const empresaNombre = this.getEmpresaNombreFromRuta(ruta);
      stats.porEmpresa[empresaNombre] = (stats.porEmpresa[empresaNombre] || 0) + 1;
    });

    // Agrupar por tipo de ruta
    rutasData.forEach(ruta => {
      const tipo = ruta.tipoRuta || 'Sin tipo';
      stats.porTipoRuta[tipo] = (stats.porTipoRuta[tipo] || 0) + 1;
    });

    // Agrupar por estado
    rutasData.forEach(ruta => {
      const estado = ruta.estado || 'Sin estado';
      stats.porEstado[estado] = (stats.porEstado[estado] || 0) + 1;
    });

    return stats;
  });

  localidadesAtendidas = computed(() => {
    const rutasData = this.rutas();
    const localidadesMap = new Map<string, LocalidadEstadistica>();

    rutasData.forEach(ruta => {
      // Procesar origen
      if (ruta.origen?.nombre) {
        const nombre = ruta.origen.nombre;
        if (!localidadesMap.has(nombre)) {
          localidadesMap.set(nombre, {
            nombre,
            comoOrigen: 0,
            comoDestino: 0,
            total: 0,
            porcentaje: 0
          });
        }
        const localidad = localidadesMap.get(nombre)!;
        localidad.comoOrigen++;
        localidad.total++;
      }

      // Procesar destino
      if (ruta.destino?.nombre) {
        const nombre = ruta.destino.nombre;
        if (!localidadesMap.has(nombre)) {
          localidadesMap.set(nombre, {
            nombre,
            comoOrigen: 0,
            comoDestino: 0,
            total: 0,
            porcentaje: 0
          });
        }
        const localidad = localidadesMap.get(nombre)!;
        localidad.comoDestino++;
        localidad.total++;
      }
    });

    // Calcular porcentajes
    const localidades = Array.from(localidadesMap.values());
    const maxTotal = Math.max(...localidades.map(l => l.total));
    
    localidades.forEach(localidad => {
      localidad.porcentaje = maxTotal > 0 ? (localidad.total / maxTotal) * 100 : 0;
    });

    return localidades.sort((a, b) => b.total - a.total);
  });

  topLocalidades = computed(() => {
    return this.localidadesAtendidas().slice(0, 10);
  });

  localidadesMenosAtendidas = computed(() => {
    return this.localidadesAtendidas()
      .filter(l => l.total <= 2)
      .slice(0, 5);
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async cargarDatos(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      const rutas = await this.rutaService.getRutas().pipe(takeUntil(this.destroy$)).toPromise();
      console.log('📊 ESTADÍSTICAS - Rutas cargadas:', rutas?.length || 0);
      this.rutas.set(rutas || []);
    } catch (error) {
      console.error('Error al cargar rutas para estadísticas:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  recargarEstadisticas(): void {
    this.cargarDatos();
  }

  getPorcentaje(valor: number, total: number): number {
    return total > 0 ? Math.round((valor / total) * 100) : 0;
  }

  getEmpresasCount(): number {
    return Object.keys(this.estadisticas().porEmpresa).length;
  }

  private getEmpresaNombreFromRuta(ruta: Ruta): string {
    if (ruta.empresa?.razonSocial) {
      if (typeof ruta.empresa.razonSocial === 'string') {
        return ruta.empresa.razonSocial;
      } else {
        return ruta.empresa.razonSocial.principal || 'Sin empresa';
      }
    }
    return 'Sin empresa';
  }

  getTiposRuta(): Array<{nombre: string, cantidad: number, porcentaje: number, color: string}> {
    const tipos = this.estadisticas().porTipoRuta;
    const total = this.estadisticas().total;
    const colores = ['primary', 'accent', 'warn'];
    
    return Object.entries(tipos).map(([nombre, cantidad], index) => ({
      nombre,
      cantidad,
      porcentaje: total > 0 ? (cantidad / total) * 100 : 0,
      color: colores[index % colores.length]
    })).sort((a, b) => b.cantidad - a.cantidad);
  }

  getDepartamentos(): Array<{nombre: string, total: number, porcentaje: number, provincias: Array<{nombre: string, cantidad: number}>}> {
    const rutasData = this.rutas();
    const deptoMap = new Map<string, Map<string, number>>();
    
    rutasData.forEach(ruta => {
      // Procesar origen
      if (ruta.origen?.nombre) {
        const partes = ruta.origen.nombre.split(/[-,]/);
        if (partes.length >= 2) {
          const depto = partes[0].trim();
          const provincia = partes[1].trim();
          
          if (!deptoMap.has(depto)) {
            deptoMap.set(depto, new Map());
          }
          const provinciaMap = deptoMap.get(depto)!;
          provinciaMap.set(provincia, (provinciaMap.get(provincia) || 0) + 1);
        }
      }
      
      // Procesar destino
      if (ruta.destino?.nombre) {
        const partes = ruta.destino.nombre.split(/[-,]/);
        if (partes.length >= 2) {
          const depto = partes[0].trim();
          const provincia = partes[1].trim();
          
          if (!deptoMap.has(depto)) {
            deptoMap.set(depto, new Map());
          }
          const provinciaMap = deptoMap.get(depto)!;
          provinciaMap.set(provincia, (provinciaMap.get(provincia) || 0) + 1);
        }
      }
    });
    
    const departamentos = Array.from(deptoMap.entries()).map(([nombre, provinciaMap]) => {
      const provincias = Array.from(provinciaMap.entries())
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
      
      const total = provincias.reduce((sum, p) => sum + p.cantidad, 0);
      
      return {
        nombre,
        total,
        porcentaje: 0, // Se calculará después
        provincias
      };
    });
    
    // Calcular porcentajes
    const maxTotal = Math.max(...departamentos.map(d => d.total));
    departamentos.forEach(depto => {
      depto.porcentaje = maxTotal > 0 ? (depto.total / maxTotal) * 100 : 0;
    });
    
    return departamentos.sort((a, b) => b.total - a.total).slice(0, 5);
  }

  getProvincias(): Array<{
    nombre: string, 
    total: number, 
    porcentaje: number, 
    localidades: Array<{nombre: string, cantidad: number}>,
    coordenadas?: {lat: number, lng: number}
  }> {
    const rutasData = this.rutas();
    const provinciaMap = new Map<string, {
      localidades: Map<string, number>,
      coordenadas?: {lat: number, lng: number}
    }>();
    
    rutasData.forEach(ruta => {
      // Procesar origen
      if (ruta.origen?.nombre) {
        const partes = ruta.origen.nombre.split(/[-,]/);
        if (partes.length >= 2) {
          const provincia = partes[1].trim();
          const localidad = partes.length > 2 ? partes[2].trim() : partes[0].trim();
          
          if (!provinciaMap.has(provincia)) {
            provinciaMap.set(provincia, {
              localidades: new Map(),
              coordenadas: this.getCoordenadasProvincia(provincia)
            });
          }
          
          const provinciaData = provinciaMap.get(provincia)!;
          provinciaData.localidades.set(localidad, (provinciaData.localidades.get(localidad) || 0) + 1);
        }
      }
      
      // Procesar destino
      if (ruta.destino?.nombre) {
        const partes = ruta.destino.nombre.split(/[-,]/);
        if (partes.length >= 2) {
          const provincia = partes[1].trim();
          const localidad = partes.length > 2 ? partes[2].trim() : partes[0].trim();
          
          if (!provinciaMap.has(provincia)) {
            provinciaMap.set(provincia, {
              localidades: new Map(),
              coordenadas: this.getCoordenadasProvincia(provincia)
            });
          }
          
          const provinciaData = provinciaMap.get(provincia)!;
          provinciaData.localidades.set(localidad, (provinciaData.localidades.get(localidad) || 0) + 1);
        }
      }
    });
    
    const provincias = Array.from(provinciaMap.entries()).map(([nombre, data]) => {
      const localidades = Array.from(data.localidades.entries())
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
      
      const total = localidades.reduce((sum, l) => sum + l.cantidad, 0);
      
      return {
        nombre,
        total,
        porcentaje: 0, // Se calculará después
        localidades,
        coordenadas: data.coordenadas
      };
    });
    
    // Calcular porcentajes
    const maxTotal = Math.max(...provincias.map(p => p.total));
    provincias.forEach(provincia => {
      provincia.porcentaje = maxTotal > 0 ? (provincia.total / maxTotal) * 100 : 0;
    });
    
    return provincias.sort((a, b) => b.total - a.total);
  }

  private getCoordenadasProvincia(provincia: string): {lat: number, lng: number} | undefined {
    // Coordenadas aproximadas de las principales provincias de Puno
    const coordenadasPuno: {[key: string]: {lat: number, lng: number}} = {
      'PUNO': { lat: -15.8422, lng: -70.0199 },
      'AZANGARO': { lat: -14.9058, lng: -70.1928 },
      'CARABAYA': { lat: -13.8500, lng: -70.4167 },
      'CHUCUITO': { lat: -16.2667, lng: -69.1333 },
      'EL COLLAO': { lat: -16.0667, lng: -69.5333 },
      'HUANCANE': { lat: -15.2019, lng: -69.7608 },
      'LAMPA': { lat: -15.3628, lng: -70.3678 },
      'MELGAR': { lat: -14.7833, lng: -70.9167 },
      'MOHO': { lat: -15.3667, lng: -69.4833 },
      'SAN ANTONIO DE PUTINA': { lat: -14.9167, lng: -69.8667 },
      'SAN ROMAN': { lat: -15.4939, lng: -70.1333 },
      'SANDIA': { lat: -14.2833, lng: -69.4167 },
      'YUNGUYO': { lat: -16.2500, lng: -69.0833 }
    };
    
    return coordenadasPuno[provincia.toUpperCase()];
  }

  getRutasConFrecuencias(): {conFrecuencias: number, sinFrecuencias: number} {
    const rutasData = this.rutas();
    const conFrecuencias = rutasData.filter(r => r.frecuencias && r.frecuencias.trim() !== '' && r.frecuencias !== 'Sin frecuencias').length;
    const sinFrecuencias = rutasData.length - conFrecuencias;
    
    return { conFrecuencias, sinFrecuencias };
  }

  getTopFrecuencias(): Array<{codigoRuta: string, origen: string, destino: string, frecuencias: string}> {
    const rutasData = this.rutas();
    
    return rutasData
      .filter(r => r.frecuencias && r.frecuencias.trim() !== '' && r.frecuencias !== 'Sin frecuencias')
      .map(r => ({
        codigoRuta: r.codigoRuta,
        origen: r.origen?.nombre || 'Sin origen',
        destino: r.destino?.nombre || 'Sin destino',
        frecuencias: r.frecuencias || ''
      }))
      .sort((a, b) => {
        // Intentar extraer números de las frecuencias para ordenar
        const numA = this.extractNumberFromFrequency(a.frecuencias);
        const numB = this.extractNumberFromFrequency(b.frecuencias);
        return numB - numA;
      })
      .slice(0, 5);
  }

  private extractNumberFromFrequency(frecuencia: string): number {
    const matches = frecuencia.match(/\d+/g);
    if (matches && matches.length > 0) {
      return parseInt(matches[0]);
    }
    return 0;
  }

  getTopConexiones(): Array<{par: string, origen: string, destino: string, cantidad: number, esBidireccional: boolean}> {
    const rutasData = this.rutas();
    const conexionesMap = new Map<string, {origen: string, destino: string, cantidad: number, direcciones: Set<string>}>();
    
    rutasData.forEach(ruta => {
      if (ruta.origen?.nombre && ruta.destino?.nombre) {
        const origen = ruta.origen.nombre;
        const destino = ruta.destino.nombre;
        
        // Crear clave normalizada (siempre alfabéticamente)
        const par = [origen, destino].sort().join(' - ');
        const direccion = `${origen} -> ${destino}`;
        
        if (!conexionesMap.has(par)) {
          conexionesMap.set(par, {
            origen: origen,
            destino: destino,
            cantidad: 0,
            direcciones: new Set()
          });
        }
        
        const conexion = conexionesMap.get(par)!;
        conexion.cantidad++;
        conexion.direcciones.add(direccion);
      }
    });
    
    return Array.from(conexionesMap.entries())
      .map(([par, data]) => ({
        par,
        origen: data.origen,
        destino: data.destino,
        cantidad: data.cantidad,
        esBidireccional: data.direcciones.size > 1
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }

  topEmpresas(): Array<{nombre: string, ruc: string, cantidad: number, porcentaje: number}> {
    const empresas = this.estadisticas().porEmpresa;
    const total = this.estadisticas().total;
    const rutasData = this.rutas();
    
    return Object.entries(empresas)
      .map(([nombre, cantidad]) => {
        // Buscar el RUC de la empresa
        const ruta = rutasData.find(r => 
          this.getEmpresaNombreFromRuta(r) === nombre
        );
        const ruc = ruta?.empresa?.ruc || 'Sin RUC';
        
        return {
          nombre,
          ruc,
          cantidad,
          porcentaje: total > 0 ? (cantidad / total) * 100 : 0
        };
      })
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }

  // ========================================
  // MÉTODOS PARA MODALES DE DETALLE
  // ========================================

  abrirDetalleLocalidades(): void {
    console.log('Abriendo detalle de localidades');
    // TODO: Implementar modal de detalle de localidades
  }

  abrirDetalleGeografia(): void {
    console.log('Abriendo detalle de geografía con', this.getProvincias().length, 'provincias');
    // TODO: Implementar modal de detalle geográfico
  }

  abrirDetalleFrecuencias(): void {
    console.log('Abriendo detalle de frecuencias');
    // TODO: Implementar modal de detalle de frecuencias
  }

  abrirDetalleConectividad(): void {
    console.log('Abriendo detalle de conectividad');
    // TODO: Implementar modal de detalle de conectividad
  }

  abrirDetalleEmpresas(): void {
    console.log('Abriendo detalle de empresas');
    // TODO: Implementar modal de detalle de empresas
  }

  abrirDetalleMenosAtendidas(): void {
    console.log('Abriendo detalle de zonas menos atendidas');
    // TODO: Implementar modal de detalle de zonas menos atendidas
  }
}