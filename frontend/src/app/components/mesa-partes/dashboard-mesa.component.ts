import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, interval, combineLatest } from 'rxjs';
import { takeUntil, switchMap, startWith, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { ReporteService } from '../../services/mesa-partes/reporte.service';
import { NotificacionService } from '../../services/mesa-partes/notificacion.service';
import { 
  Estadisticas, 
  FiltrosReporte, 
  PeriodoReporte 
} from '../../models/mesa-partes/reporte.model';
import { Documento } from '../../models/mesa-partes/documento.model';

interface IndicadorClave {
  titulo: string;
  valor: number;
  icono: string;
  color: string;
  tendencia?: {
    valor: number;
    tipo: 'up' | 'down' | 'stable';
  };
  descripcion?: string;
}

interface DocumentoAlerta {
  id: string;
  numeroExpediente: string;
  asunto: string;
  remitente: string;
  fechaLimite: Date;
  diasVencimiento: number;
  prioridad: 'NORMAL' | 'ALTA' | 'URGENTE';
  estado: string;
}

@Component({
  selector: 'app-dashboard-mesa',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatMenuModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SmartIconComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header con filtros -->
      <div class="dashboard-header">
        <div class="header-title">
          <h2>
            <app-smart-icon [iconName]="'dashboard'" [size]="28" [tooltipText]="'Panel de control Mesa de Partes'"></app-smart-icon>
            Dashboard Mesa de Partes
          </h2>
          <p class="subtitle">Indicadores clave y estadísticas en tiempo real</p>
        </div>
        
        <div class="header-filters">
          <form [formGroup]="filtrosForm" class="filters-form">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Período</mat-label>
              <mat-select formControlName="periodo" (selectionChange)="onFiltroChange()">
                <mat-option value="HOY">Hoy</mat-option>
                <mat-option value="AYER">Ayer</mat-option>
                <mat-option value="ULTIMA_SEMANA">Última semana</mat-option>
                <mat-option value="ULTIMO_MES">Último mes</mat-option>
                <mat-option value="ULTIMO_TRIMESTRE">Último trimestre</mat-option>
                <mat-option value="ULTIMO_ANIO">Último año</mat-option>
              </mat-select>
            </mat-form-field>
            
            <button 
              mat-icon-button 
              type="button"
              [disabled]="cargando"
              (click)="actualizarDatos()"
              matTooltip="Actualizar datos">
              <app-smart-icon [iconName]="'refresh'" [size]="20" [tooltipText]="'Actualizar datos del dashboard'" [class.spinning]="cargando"></app-smart-icon>
            </button>
          </form>
        </div>
      </div>

      <!-- Indicadores Clave -->
      <div class="indicadores-section">
        <h3 class="section-title">
          <app-smart-icon [iconName]="'analytics'" [size]="24" [tooltipText]="'Análisis de indicadores clave'"></app-smart-icon>
          Indicadores Clave
        </h3>
        
        <div class="indicadores-grid" *ngIf="!cargando; else loadingIndicadores">
          <mat-card 
            *ngFor="let indicador of indicadoresClave" 
            class="indicador-card"
            [class]="'indicador-' + indicador.color">
            <mat-card-content>
              <div class="indicador-header">
                <div class="indicador-icon">
                  <app-smart-icon 
                    [iconName]="indicador.icono" 
                    [size]="32" 
                    [tooltipText]="indicador.titulo"
                    [style.color]="getColorValue(indicador.color)">
                  </app-smart-icon>
                </div>
                <div class="indicador-tendencia" *ngIf="indicador.tendencia">
                  <app-smart-icon 
                    [iconName]="getTendenciaIcon(indicador.tendencia.tipo)"
                    [size]="16"
                    [tooltipText]="'Tendencia ' + indicador.tendencia.tipo"
                    class="tendencia-icon"
                    [class]="'tendencia-' + indicador.tendencia.tipo">
                  </app-smart-icon>
                  <span class="tendencia-valor">{{ indicador.tendencia.valor }}%</span>
                </div>
              </div>
              
              <div class="indicador-content">
                <div class="indicador-valor">{{ indicador.valor | number }}</div>
                <div class="indicador-titulo">{{ indicador.titulo }}</div>
                <div class="indicador-descripcion" *ngIf="indicador.descripcion">
                  {{ indicador.descripcion }}
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <ng-template #loadingIndicadores>
          <div class="loading-container">
            <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
            <p>Cargando indicadores...</p>
          </div>
        </ng-template>
      </div>

      <!-- Gráficos y Estadísticas -->
      <div class="graficos-section">
        <h3 class="section-title">
          <app-smart-icon [iconName]="'bar_chart'" [size]="24" [tooltipText]="'Gráficos estadísticos'"></app-smart-icon>
          Gráficos y Estadísticas
        </h3>
        
        <div class="graficos-grid">
          <!-- Gráfico de Tendencias -->
          <mat-card class="grafico-card">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'trending_up'" [size]="20" [tooltipText]="'Tendencias de crecimiento'"></app-smart-icon>
                Tendencias por Fecha
              </mat-card-title>
              <mat-card-subtitle>Documentos recibidos vs atendidos</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <div class="chart-placeholder" *ngIf="!tendenciasData.length">
                  <app-smart-icon [iconName]="'show_chart'" [size]="48" [tooltipText]="'Cargando gráfico'"></app-smart-icon>
                  <p>Cargando gráfico de tendencias...</p>
                </div>
                <div class="simple-chart" *ngIf="tendenciasData.length">
                  <div class="chart-legend">
                    <div class="legend-item">
                      <div class="legend-color recibidos"></div>
                      <span>Recibidos</span>
                    </div>
                    <div class="legend-item">
                      <div class="legend-color atendidos"></div>
                      <span>Atendidos</span>
                    </div>
                  </div>
                  <div class="chart-bars">
                    <div 
                      *ngFor="let item of tendenciasData.slice(-7)" 
                      class="bar-group"
                      [matTooltip]="item.fecha | date:'dd/MM'">
                      <div class="bar-container">
                        <div 
                          class="bar recibidos"
                          [style.height.%]="getBarHeight(item.recibidos, maxTendencias)">
                        </div>
                        <div 
                          class="bar atendidos"
                          [style.height.%]="getBarHeight(item.atendidos, maxTendencias)">
                        </div>
                      </div>
                      <div class="bar-label">{{ item.fecha | date:'dd/MM' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Gráfico de Distribución por Tipo -->
          <mat-card class="grafico-card">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'pie_chart'" [size]="20" [tooltipText]="'Gráfico circular de distribución'"></app-smart-icon>
                Distribución por Tipo
              </mat-card-title>
              <mat-card-subtitle>Tipos de documentos más frecuentes</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <div class="chart-placeholder" *ngIf="!distribucionTipoData.length">
                  <app-smart-icon [iconName]="'donut_small'" [size]="48" [tooltipText]="'Cargando gráfico de distribución'"></app-smart-icon>
                  <p>Cargando distribución por tipo...</p>
                </div>
                <div class="pie-chart" *ngIf="distribucionTipoData.length">
                  <div class="pie-items">
                    <div 
                      *ngFor="let item of distribucionTipoData.slice(0, 5); let i = index" 
                      class="pie-item"
                      [style.background-color]="getPieColor(i)">
                      <div class="pie-info">
                        <span class="pie-label">{{ item.tipoDocumentoNombre }}</span>
                        <span class="pie-value">{{ item.cantidad }} ({{ item.porcentaje.toFixed(1) }}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Gráfico de Distribución por Área -->
          <mat-card class="grafico-card">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'account_tree'" [size]="20" [tooltipText]="'Estructura organizacional'"></app-smart-icon>
                Distribución por Área
              </mat-card-title>
              <mat-card-subtitle>Carga de trabajo por área</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <div class="chart-placeholder" *ngIf="!distribucionAreaData.length">
                  <app-smart-icon [iconName]="'domain'" [size]="48" [tooltipText]="'Cargando distribución por área'"></app-smart-icon>
                  <p>Cargando distribución por área...</p>
                </div>
                <div class="horizontal-bars" *ngIf="distribucionAreaData.length">
                  <div 
                    *ngFor="let item of distribucionAreaData.slice(0, 6)" 
                    class="horizontal-bar-item">
                    <div class="bar-info">
                      <span class="bar-label">{{ item.areaNombre }}</span>
                      <span class="bar-value">{{ item.documentosRecibidos }}</span>
                    </div>
                    <div class="bar-track">
                      <div 
                        class="bar-fill"
                        [style.width.%]="getBarWidth(item.documentosRecibidos, maxAreaDocumentos)">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Tiempos Promedio de Atención -->
          <mat-card class="grafico-card">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'schedule'" [size]="20" [tooltipText]="'Tiempos de respuesta'"></app-smart-icon>
                Tiempos de Atención
              </mat-card-title>
              <mat-card-subtitle>Promedio por área (en horas)</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <div class="chart-placeholder" *ngIf="!tiemposAtencionData.length">
                  <app-smart-icon [iconName]="'timer'" [size]="48" [tooltipText]="'Cargando tiempos de atención'"></app-smart-icon>
                  <p>Cargando tiempos de atención...</p>
                </div>
                <div class="time-metrics" *ngIf="tiemposAtencionData.length">
                  <div 
                    *ngFor="let item of tiemposAtencionData.slice(0, 5)" 
                    class="time-item">
                    <div class="time-header">
                      <span class="area-name">{{ item.areaNombre }}</span>
                      <span class="time-value">{{ item.tiempoPromedio.toFixed(1) }}h</span>
                    </div>
                    <div class="time-details">
                      <div class="time-range">
                        <span class="min-time">Min: {{ item.tiempoMinimo.toFixed(1) }}h</span>
                        <span class="max-time">Max: {{ item.tiempoMaximo.toFixed(1) }}h</span>
                      </div>
                      <div class="time-bar">
                        <div 
                          class="time-fill"
                          [style.width.%]="getTimeBarWidth(item.tiempoPromedio, maxTiempoAtencion)"
                          [class.good-time]="item.tiempoPromedio <= 24"
                          [class.warning-time]="item.tiempoPromedio > 24 && item.tiempoPromedio <= 48"
                          [class.bad-time]="item.tiempoPromedio > 48">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Alertas y Notificaciones -->
      <div class="alertas-section">
        <h3 class="section-title">
          <app-smart-icon [iconName]="'warning'" [size]="24" [tooltipText]="'Alertas del sistema'"></app-smart-icon>
          Alertas y Notificaciones
        </h3>
        
        <div class="alertas-grid">
          <!-- Documentos Vencidos -->
          <mat-card class="alerta-card vencidos">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'schedule'" [size]="20" [tooltipText]="'Documentos fuera de plazo'"></app-smart-icon>
                Documentos Vencidos
                <mat-chip 
                  *ngIf="documentosVencidos.length > 0"
                  class="count-chip vencidos">
                  {{ (documentosVencidos)?.length || 0 }}
                </mat-chip>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="documentosVencidos.length === 0" class="empty-state">
                <app-smart-icon [iconName]="'check_circle'" [size]="48" [tooltipText]="'Todo al día'"></app-smart-icon>
                <p>No hay documentos vencidos</p>
              </div>
              
              <mat-list *ngIf="documentosVencidos.length > 0" class="documentos-list">
                <mat-list-item 
                  *ngFor="let doc of documentosVencidos.slice(0, 5)"
                  class="documento-item vencido">
                  <app-smart-icon matListItemIcon [iconName]="'description'" [size]="20" [tooltipText]="'Documento vencido'" class="doc-icon"></app-smart-icon>
                  <div matListItemTitle class="doc-title">{{ doc.numeroExpediente }}</div>
                  <div matListItemLine class="doc-subtitle">
                    {{ doc.asunto | slice:0:50 }}{{ doc.asunto.length > 50 ? '...' : '' }}
                  </div>
                  <div matListItemLine class="doc-meta">
                    <span class="remitente">{{ doc.remitente }}</span>
                    <span class="vencimiento">Vencido hace {{ Math.abs(doc.diasVencimiento) }} días</span>
                  </div>
                </mat-list-item>
              </mat-list>
              
              <div *ngIf="documentosVencidos.length > 5" class="more-items">
                <button mat-button color="warn" (click)="verTodosVencidos()">
                  Ver todos ({{ (documentosVencidos)?.length || 0 }})
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Documentos Próximos a Vencer -->
          <mat-card class="alerta-card proximos-vencer">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'access_time'" [size]="20" [tooltipText]="'Documentos próximos a vencer'"></app-smart-icon>
                Próximos a Vencer
                <mat-chip 
                  *ngIf="documentosProximosVencer.length > 0"
                  class="count-chip proximos">
                  {{ (documentosProximosVencer)?.length || 0 }}
                </mat-chip>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="documentosProximosVencer.length === 0" class="empty-state">
                <app-smart-icon [iconName]="'schedule'" [size]="48" [tooltipText]="'Sin documentos próximos a vencer'"></app-smart-icon>
                <p>No hay documentos próximos a vencer</p>
              </div>
              
              <mat-list *ngIf="documentosProximosVencer.length > 0" class="documentos-list">
                <mat-list-item 
                  *ngFor="let doc of documentosProximosVencer.slice(0, 5)"
                  class="documento-item proximo">
                  <app-smart-icon matListItemIcon [iconName]="'description'" [size]="20" [tooltipText]="'Documento próximo a vencer'" class="doc-icon"></app-smart-icon>
                  <div matListItemTitle class="doc-title">{{ doc.numeroExpediente }}</div>
                  <div matListItemLine class="doc-subtitle">
                    {{ doc.asunto | slice:0:50 }}{{ doc.asunto.length > 50 ? '...' : '' }}
                  </div>
                  <div matListItemLine class="doc-meta">
                    <span class="remitente">{{ doc.remitente }}</span>
                    <span class="vencimiento">Vence en {{ doc.diasVencimiento }} días</span>
                  </div>
                </mat-list-item>
              </mat-list>
              
              <div *ngIf="documentosProximosVencer.length > 5" class="more-items">
                <button mat-button color="accent" (click)="verTodosProximos()">
                  Ver todos ({{ (documentosProximosVencer)?.length || 0 }})
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Documentos Urgentes -->
          <mat-card class="alerta-card urgentes">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'priority_high'" [size]="20" [tooltipText]="'Documentos de alta prioridad'"></app-smart-icon>
                Documentos Urgentes
                <mat-chip 
                  *ngIf="documentosUrgentes.length > 0"
                  class="count-chip urgentes">
                  {{ (documentosUrgentes)?.length || 0 }}
                </mat-chip>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="documentosUrgentes.length === 0" class="empty-state">
                <app-smart-icon [iconName]="'done_all'" [size]="48" [tooltipText]="'Todos los documentos urgentes atendidos'"></app-smart-icon>
                <p>No hay documentos urgentes pendientes</p>
              </div>
              
              <mat-list *ngIf="documentosUrgentes.length > 0" class="documentos-list">
                <mat-list-item 
                  *ngFor="let doc of documentosUrgentes.slice(0, 5)"
                  class="documento-item urgente">
                  <app-smart-icon matListItemIcon [iconName]="'priority_high'" [size]="20" [tooltipText]="'Documento urgente'" class="doc-icon"></app-smart-icon>
                  <div matListItemTitle class="doc-title">{{ doc.numeroExpediente }}</div>
                  <div matListItemLine class="doc-subtitle">
                    {{ doc.asunto | slice:0:50 }}{{ doc.asunto.length > 50 ? '...' : '' }}
                  </div>
                  <div matListItemLine class="doc-meta">
                    <span class="remitente">{{ doc.remitente }}</span>
                    <span class="estado">{{ doc.estado }}</span>
                  </div>
                </mat-list-item>
              </mat-list>
              
              <div *ngIf="documentosUrgentes.length > 5" class="more-items">
                <button mat-button color="primary" (click)="verTodosUrgentes()">
                  Ver todos ({{ (documentosUrgentes)?.length || 0 }})
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Última actualización -->
      <div class="footer-info">
        <div class="update-info">
          <app-smart-icon [iconName]="'update'" [size]="16" [tooltipText]="'Información de actualización'"></app-smart-icon>
          <span>Última actualización: {{ ultimaActualizacion | date:'dd/MM/yyyy HH:mm:ss' }}</span>
        </div>
        <div class="auto-refresh">
          <app-smart-icon [iconName]="'autorenew'" [size]="16" [tooltipText]="'Actualización automática activa'"></app-smart-icon>
          <span>Actualización automática cada 30 segundos</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 0;
      height: 100%;
      overflow-y: auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
    }

    .header-title h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .header-title h2 app-smart-icon {
      font-size: 28px;
    }

    .subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .header-filters {
      display: flex;
      align-items: center;
    }

    .filters-form {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .filter-field {
      min-width: 180px;
    }

    .filter-field ::ng-deep .mat-mdc-form-field-outline {
      color: rgba(255, 255, 255, 0.3);
    }

    .filter-field ::ng-deep .mat-mdc-form-field-label {
      color: rgba(255, 255, 255, 0.9);
    }

    .filter-field ::ng-deep .mat-mdc-select-value {
      color: white;
    }

    .filter-field ::ng-deep .mat-mdc-select-arrow {
      color: rgba(255, 255, 255, 0.7);
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 24px 0;
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
    }

    .section-title app-smart-icon {
      color: #667eea;
    }

    /* Indicadores Clave */
    .indicadores-section {
      margin-bottom: 40px;
    }

    .indicadores-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .indicador-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border-left: 4px solid transparent;
    }

    .indicador-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .indicador-card.indicador-primary {
      border-left-color: #667eea;
    }

    .indicador-card.indicador-success {
      border-left-color: #48bb78;
    }

    .indicador-card.indicador-warning {
      border-left-color: #ed8936;
    }

    .indicador-card.indicador-danger {
      border-left-color: #f56565;
    }

    .indicador-card.indicador-info {
      border-left-color: #4299e1;
    }

    .indicador-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .indicador-icon app-smart-icon {
      font-size: 32px;
    }

    .indicador-tendencia {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .tendencia-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
    }

    .tendencia-icon.tendencia-up {
      color: #48bb78;
    }

    .tendencia-icon.tendencia-down {
      color: #f56565;
    }

    .tendencia-icon.tendencia-stable {
      color: #a0aec0;
    }

    .indicador-valor {
      font-size: 36px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 8px;
      color: #2c3e50;
    }

    .indicador-titulo {
      font-size: 14px;
      font-weight: 600;
      color: #4a5568;
      margin-bottom: 4px;
    }

    .indicador-descripcion {
      font-size: 12px;
      color: #718096;
    }

    /* Gráficos y Estadísticas */
    .graficos-section {
      margin-bottom: 40px;
    }

    .graficos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .grafico-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #667eea;
    }

    .grafico-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      font-weight: 600;
    }

    .grafico-card mat-card-title app-smart-icon {
      color: #667eea;
    }

    .grafico-card mat-card-subtitle {
      color: #718096;
      font-size: 12px;
      margin-top: 4px;
    }

    .chart-container {
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      color: #a0aec0;
      padding: 32px 16px;
    }

    .chart-placeholder app-smart-icon {
      margin-bottom: 16px;
    }

    .chart-placeholder p {
      margin: 0;
      font-size: 14px;
    }

    /* Gráfico de Tendencias */
    .simple-chart {
      width: 100%;
      padding: 16px 0;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 20px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 500;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .legend-color.recibidos {
      background-color: #667eea;
    }

    .legend-color.atendidos {
      background-color: #48bb78;
    }

    .chart-bars {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 150px;
      padding: 0 16px;
    }

    .bar-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      max-width: 60px;
    }

    .bar-container {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 120px;
      margin-bottom: 8px;
    }

    .bar {
      width: 16px;
      min-height: 4px;
      border-radius: 2px 2px 0 0;
      transition: all 0.3s ease;
    }

    .bar.recibidos {
      background-color: #667eea;
    }

    .bar.atendidos {
      background-color: #48bb78;
    }

    .bar-label {
      font-size: 10px;
      color: #718096;
      text-align: center;
    }

    /* Gráfico de Pie */
    .pie-chart {
      width: 100%;
      padding: 16px 0;
    }

    .pie-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .pie-item {
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
    }

    .pie-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pie-label {
      font-size: 14px;
    }

    .pie-value {
      font-size: 12px;
      opacity: 0.9;
    }

    /* Gráfico de Barras Horizontales */
    .horizontal-bars {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }

    .horizontal-bar-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .bar-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bar-label {
      font-size: 14px;
      font-weight: 500;
      color: #2c3e50;
    }

    .bar-value {
      font-size: 12px;
      font-weight: 600;
      color: #667eea;
    }

    .bar-track {
      height: 8px;
      background-color: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    /* Métricas de Tiempo */
    .time-metrics {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 16px 0;
    }

    .time-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .time-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .area-name {
      font-size: 14px;
      font-weight: 500;
      color: #2c3e50;
    }

    .time-value {
      font-size: 16px;
      font-weight: 600;
      color: #667eea;
    }

    .time-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .time-range {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #718096;
    }

    .time-bar {
      height: 6px;
      background-color: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .time-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .time-fill.good-time {
      background-color: #48bb78;
    }

    .time-fill.warning-time {
      background-color: #ed8936;
    }

    .time-fill.bad-time {
      background-color: #f56565;
    }

    /* Alertas y Notificaciones */
    .alertas-section {
      margin-bottom: 32px;
    }

    .alertas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .alerta-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-left: 4px solid transparent;
    }

    .alerta-card.vencidos {
      border-left-color: #f56565;
    }

    .alerta-card.proximos-vencer {
      border-left-color: #ed8936;
    }

    .alerta-card.urgentes {
      border-left-color: #667eea;
    }

    .alerta-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      font-weight: 600;
    }

    .alerta-card mat-card-title app-smart-icon {
      color: #667eea;
    }

    .count-chip {
      font-size: 12px;
      font-weight: 600;
      min-height: 24px;
      border-radius: 12px;
    }

    .count-chip.vencidos {
      background-color: #fed7d7;
      color: #c53030;
    }

    .count-chip.proximos {
      background-color: #feebc8;
      color: #c05621;
    }

    .count-chip.urgentes {
      background-color: #e6fffa;
      color: #2c7a7b;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      text-align: center;
      color: #a0aec0;
    }

    .empty-state app-smart-icon {
      margin-bottom: 16px;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    .documentos-list {
      padding: 0;
    }

    .documento-item {
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 0;
    }

    .documento-item:last-child {
      border-bottom: none;
    }

    .doc-icon {
      color: #a0aec0;
    }

    .documento-item.vencido .doc-icon {
      color: #f56565;
    }

    .documento-item.proximo .doc-icon {
      color: #ed8936;
    }

    .documento-item.urgente .doc-icon {
      color: #667eea;
    }

    .doc-title {
      font-weight: 600;
      color: #2c3e50;
      font-size: 14px;
    }

    .doc-subtitle {
      color: #4a5568;
      font-size: 13px;
      margin-top: 4px;
    }

    .doc-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #718096;
      margin-top: 8px;
    }

    .remitente {
      font-weight: 500;
    }

    .vencimiento {
      font-weight: 600;
    }

    .documento-item.vencido .vencimiento {
      color: #f56565;
    }

    .documento-item.proximo .vencimiento {
      color: #ed8936;
    }

    .more-items {
      text-align: center;
      padding: 16px 0 8px 0;
      border-top: 1px solid #e2e8f0;
      margin-top: 16px;
    }

    /* Footer */
    .footer-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #f7fafc;
      border-radius: 8px;
      font-size: 12px;
      color: #718096;
    }

    .update-info,
    .auto-refresh {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .update-info app-smart-icon,
    .auto-refresh app-smart-icon {
      margin-right: 8px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .loading-container p {
      margin-top: 16px;
      color: #718096;
      font-size: 14px;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .dashboard-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-filters {
        justify-content: flex-end;
      }

      .indicadores-grid {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }

      .alertas-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .graficos-grid {
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 16px;
      }
    }

    @media (max-width: 768px) {
      .dashboard-header {
        padding: 16px;
      }

      .header-title h2 {
        font-size: 20px;
      }

      .filters-form {
        flex-direction: column;
        gap: 12px;
        width: 100%;
      }

      .filter-field {
        width: 100%;
      }

      .indicadores-grid {
        grid-template-columns: 1fr;
      }

      .graficos-grid {
        grid-template-columns: 1fr;
      }

      .chart-bars {
        height: 120px;
      }

      .bar-container {
        height: 100px;
      }

      .footer-info {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
    }
  `]
})
export class DashboardMesaComponent implements OnInit, OnDestroy {
  private reporteService = inject(ReporteService);
  private notificacionService = inject(NotificacionService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Estado del componente
  cargando = false;
  ultimaActualizacion = new Date();

  // Formulario de filtros
  filtrosForm: FormGroup;

  // Datos del dashboard
  indicadoresClave: IndicadorClave[] = [];
  documentosVencidos: DocumentoAlerta[] = [];
  documentosProximosVencer: DocumentoAlerta[] = [];
  documentosUrgentes: DocumentoAlerta[] = [];

  // Datos de gráficos
  tendenciasData: { fecha: Date; recibidos: number; atendidos: number; pendientes: number }[] = [];
  distribucionTipoData: { tipoDocumentoNombre: string; cantidad: number; porcentaje: number }[] = [];
  distribucionAreaData: { areaNombre: string; documentosRecibidos: number; documentosAtendidos: number; documentosPendientes: number }[] = [];
  tiemposAtencionData: { areaNombre: string; tiempoPromedio: number; tiempoMinimo: number; tiempoMaximo: number }[] = [];

  // Valores máximos para cálculos de gráficos
  maxTendencias = 0;
  maxAreaDocumentos = 0;
  maxTiempoAtencion = 0;

  // TODO: Obtener del servicio de autenticación
  private readonly MOCK_USER_ID = 'user-123';

  constructor() {
    this.filtrosForm = this.fb.group({
      periodo: [PeriodoReporte.ULTIMO_MES]
    });
  }

  ngOnInit(): void {
    this.inicializarDashboard();
    this.configurarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializar dashboard con datos iniciales
   * Requirements: 6.1
   */
  private inicializarDashboard(): void {
    this.cargarDatosDashboard();
  }

  /**
   * Configurar actualización automática cada 30 segundos
   * Requirements: 6.1 - Implementar actualización en tiempo real
   */
  private configurarActualizacionAutomatica(): void {
    interval(30000) // 30 segundos
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.cargarDatosDashboard())
      )
      .subscribe();
  }

  /**
   * Cargar todos los datos del dashboard
   * Requirements: 6.1, 6.6, 8.2, 8.3
   */
  private cargarDatosDashboard() {
    this.cargando = true;
    
    const filtros: FiltrosReporte = {
      periodo: this.filtrosForm.get('periodo')?.value
    };

    return combineLatest([
      this.reporteService.obtenerEstadisticas(filtros),
      this.reporteService.obtenerDocumentosVencidos(),
      this.reporteService.obtenerDocumentosProximosVencer(3),
      this.obtenerDocumentosUrgentes(),
      this.reporteService.obtenerTendencias(filtros.periodo || PeriodoReporte.ULTIMO_MES),
      this.reporteService.obtenerEstadisticasPorTipo(filtros),
      this.reporteService.obtenerEstadisticasPorArea(filtros),
      this.reporteService.obtenerTiemposAtencionPorArea(filtros)
    ]).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error cargando datos del dashboard::', error);
        this.cargando = false;
        return of([null, { documentos: [] }, { documentos: [] }, [], [], [], [], []]);
      }),
      tap({
      next: ([estadisticas, vencidos, proximos, urgentes, tendencias, tiposData, areasData, tiemposData]: any[]) => {
        if (estadisticas) {
          this.procesarEstadisticas(estadisticas as any);
        }
        if (vencidos && (vencidos as any).documentos) {
          this.procesarDocumentosVencidos((vencidos as any).documentos);
        }
        if (proximos && (proximos as any).documentos) {
          this.procesarDocumentosProximos((proximos as any).documentos);
        }
        this.documentosUrgentes = (urgentes as any) || [];
        
        // Procesar datos de gráficos
        this.tendenciasData = (tendencias as any) || [];
        this.distribucionTipoData = (tiposData as any) || [];
        this.distribucionAreaData = (areasData as any) || [];
        this.tiemposAtencionData = (tiemposData as any) || [];
        
        // Calcular valores máximos para gráficos
        this.calcularValoresMaximos();
        
        this.ultimaActualizacion = new Date();
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error en carga de datos::', error);
        this.cargando = false;
      }
    }));
  }

  /**
   * Procesar estadísticas y crear indicadores clave
   * Requirements: 6.1
   */
  private procesarEstadisticas(estadisticas: Estadisticas): void {
    this.indicadoresClave = [
      {
        titulo: 'Total Recibidos',
        valor: estadisticas.documentosRecibidos,
        icono: 'inbox',
        color: 'primary',
        descripcion: 'Documentos recibidos en el período'
      },
      {
        titulo: 'En Proceso',
        valor: estadisticas.documentosEnProceso,
        icono: 'hourglass_empty',
        color: 'info',
        descripcion: 'Documentos en trámite'
      },
      {
        titulo: 'Atendidos',
        valor: estadisticas.documentosAtendidos,
        icono: 'check_circle',
        color: 'success',
        tendencia: {
          valor: estadisticas.porcentajeAtendidos,
          tipo: estadisticas.porcentajeAtendidos >= 80 ? 'up' : 
                estadisticas.porcentajeAtendidos >= 60 ? 'stable' : 'down'
        },
        descripcion: `${estadisticas.porcentajeAtendidos.toFixed(1)}% de eficiencia`
      },
      {
        titulo: 'Vencidos',
        valor: estadisticas.documentosVencidos,
        icono: 'schedule',
        color: 'danger',
        descripcion: 'Documentos fuera de plazo'
      },
      {
        titulo: 'Urgentes',
        valor: estadisticas.documentosUrgentes,
        icono: 'priority_high',
        color: 'warning',
        descripcion: 'Documentos de alta prioridad'
      }
    ];
  }

  /**
   * Procesar documentos vencidos
   * Requirements: 6.6, 8.2
   */
  private procesarDocumentosVencidos(documentos: any[]): void {
    this.documentosVencidos = documentos.map(doc => ({
      id: doc.id,
      numeroExpediente: doc.numeroExpediente,
      asunto: doc.asunto,
      remitente: doc.remitente,
      fechaLimite: new Date(doc.fechaLimite),
      diasVencimiento: this.calcularDiasVencimiento(doc.fechaLimite),
      prioridad: doc.prioridad,
      estado: doc.estado
    }));
  }

  /**
   * Procesar documentos próximos a vencer
   * Requirements: 6.6, 8.2
   */
  private procesarDocumentosProximos(documentos: any[]): void {
    this.documentosProximosVencer = documentos.map(doc => ({
      id: doc.id,
      numeroExpediente: doc.numeroExpediente,
      asunto: doc.asunto,
      remitente: doc.remitente,
      fechaLimite: new Date(doc.fechaLimite),
      diasVencimiento: this.calcularDiasVencimiento(doc.fechaLimite),
      prioridad: doc.prioridad,
      estado: doc.estado
    }));
  }

  /**
   * Obtener documentos urgentes pendientes
   * Requirements: 8.3
   */
  private obtenerDocumentosUrgentes() {
    // Obtener documentos urgentes reales del servicio
    return this.reporteService.obtenerDocumentosUrgentes();
  }

  /**
   * Calcular días de vencimiento
   */
  private calcularDiasVencimiento(fechaLimite: string): number {
    const hoy = new Date();
    const limite = new Date(fechaLimite);
    const diferencia = limite.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  }

  /**
   * Obtener valor de color para indicadores
   */
  getColorValue(color: string): string {
    const colores = {
      primary: '#667eea',
      success: '#48bb78',
      warning: '#ed8936',
      danger: '#f56565',
      info: '#4299e1'
    };
    return colores[color as keyof typeof colores] || '#667eea';
  }

  /**
   * Obtener icono de tendencia
   */
  getTendenciaIcon(tipo: 'up' | 'down' | 'stable'): string {
    const iconos = {
      up: 'trending_up',
      down: 'trending_down',
      stable: 'trending_flat'
    };
    return iconos[tipo];
  }

  /**
   * Manejar cambio de filtros
   * Requirements: 6.1, 6.2, 6.3, 6.5
   */
  onFiltroChange(): void {
    this.cargarDatosDashboard();
  }

  /**
   * Actualizar datos manualmente
   * Requirements: 6.1
   */
  actualizarDatos(): void {
    this.cargarDatosDashboard();
  }

  /**
   * Ver todos los documentos vencidos
   * Requirements: 6.6
   */
  verTodosVencidos(): void {
    // console.log removed for production
    // TODO: Implementar navegación o modal con lista completa
  }

  /**
   * Ver todos los documentos próximos a vencer
   * Requirements: 6.6
   */
  verTodosProximos(): void {
    // console.log removed for production
    // TODO: Implementar navegación o modal con lista completa
  }

  /**
   * Ver todos los documentos urgentes
   * Requirements: 8.3
   */
  verTodosUrgentes(): void {
    // console.log removed for production
    // TODO: Implementar navegación o modal con lista completa
  }

  /**
   * Calcular valores máximos para gráficos
   * Requirements: 6.1, 6.2, 6.3, 6.5
   */
  private calcularValoresMaximos(): void {
    // Máximo para tendencias
    this.maxTendencias = Math.max(
      ...this.tendenciasData.map(item => Math.max(item.recibidos, item.atendidos)),
      1
    );

    // Máximo para documentos por área
    this.maxAreaDocumentos = Math.max(
      ...this.distribucionAreaData.map(item => item.documentosRecibidos),
      1
    );

    // Máximo para tiempos de atención
    this.maxTiempoAtencion = Math.max(
      ...this.tiemposAtencionData.map(item => item.tiempoPromedio),
      1
    );
  }

  /**
   * Calcular altura de barra para gráfico de tendencias
   * Requirements: 6.2
   */
  getBarHeight(valor: number, maximo: number): number {
    return maximo > 0 ? (valor / maximo) * 100 : 0;
  }

  /**
   * Calcular ancho de barra para gráfico de áreas
   * Requirements: 6.3
   */
  getBarWidth(valor: number, maximo: number): number {
    return maximo > 0 ? (valor / maximo) * 100 : 0;
  }

  /**
   * Calcular ancho de barra para tiempos de atención
   * Requirements: 6.5
   */
  getTimeBarWidth(valor: number, maximo: number): number {
    return maximo > 0 ? (valor / maximo) * 100 : 0;
  }

  /**
   * Obtener color para gráfico de pie
   * Requirements: 6.2
   */
  getPieColor(index: number): string {
    const colores = [
      '#667eea',
      '#48bb78',
      '#ed8936',
      '#f56565',
      '#4299e1',
      '#9f7aea',
      '#38b2ac',
      '#ed64a6'
    ];
    return colores[index % colores.length];
  }

  // Exponer Math para el template
  Math = Math;
}