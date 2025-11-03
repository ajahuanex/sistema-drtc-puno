import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { Router } from '@angular/router';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa, EmpresaEstadisticas, EstadoEmpresa } from '../../models/empresa.model';

@Component({
  selector: 'app-dashboard-empresas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTableModule,
    MatDividerModule,
    MatTabsModule,
    MatExpansionModule,
    MatListModule,
    MatTooltipModule,
    SmartIconComponent
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>DASHBOARD DE EMPRESAS</h1>
        </div>
        <p class="header-subtitle">VISIÓN GENERAL Y MÉTRICAS DEL SISTEMA DE EMPRESAS</p>
      </div>
      <div class="header-actions">
        <button mat-raised-button color="primary" (click)="nuevaEmpresa()" class="action-button">
          <app-smart-icon [iconName]="'add'" [size]="20" [tooltipText]="'Crear nueva empresa'"></app-smart-icon>
          NUEVA EMPRESA
        </button>
        <button mat-raised-button color="accent" (click)="generarReporte()" class="action-button">
          <app-smart-icon [iconName]="'assessment'" [size]="20" [tooltipText]="'Generar reporte de empresas'"></app-smart-icon>
          GENERAR REPORTE
        </button>
      </div>
    </div>

    <!-- Métricas Principales -->
    @if (!isLoading() && estadisticas()) {
      <div class="metrics-section">
        <div class="metrics-grid">
          <div class="metric-card total">
            <div class="metric-icon">
              <app-smart-icon [iconName]="'business'" [size]="48" [tooltipText]="'Total de empresas registradas'"></app-smart-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ estadisticas()?.totalEmpresas ?? 0 }}</div>
              <div class="metric-label">TOTAL EMPRESAS</div>
              <div class="metric-trend positive">
                <app-smart-icon [iconName]="'trending_up'" [size]="16" [tooltipText]="'Tendencia positiva'"></app-smart-icon>
                <span>+{{ ((estadisticas()?.totalEmpresas ?? 0) * 0.05) | number:'1.0-0' }} este mes</span>
              </div>
            </div>
          </div>

          <div class="metric-card habilitadas">
            <div class="metric-icon">
              <app-smart-icon [iconName]="'check_circle'" [size]="48" [tooltipText]="'Empresas habilitadas'"></app-smart-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ estadisticas()?.empresasHabilitadas ?? 0 }}</div>
              <div class="metric-label">HABILITADAS</div>
              <div class="metric-percentage">
                {{ ((estadisticas()?.empresasHabilitadas ?? 0) / (estadisticas()?.totalEmpresas ?? 1) * 100) | number:'1.0-1' }}%
              </div>
            </div>
          </div>

          <div class="metric-card en-tramite">
            <div class="metric-icon">
              <app-smart-icon [iconName]="'pending'" [size]="48" [tooltipText]="'Empresas en trámite'"></app-smart-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ estadisticas()?.empresasEnTramite ?? 0 }}</div>
              <div class="metric-label">EN TRÁMITE</div>
              <div class="metric-percentage">
                {{ ((estadisticas()?.empresasEnTramite ?? 0) / (estadisticas()?.totalEmpresas ?? 1) * 100) | number:'1.0-1' }}%
              </div>
            </div>
          </div>

          <div class="metric-card suspendidas">
            <div class="metric-icon">
              <app-smart-icon [iconName]="'block'" [size]="48" [tooltipText]="'Empresas suspendidas'"></app-smart-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ estadisticas()?.empresasSuspendidas ?? 0 }}</div>
              <div class="metric-label">SUSPENDIDAS</div>
              <div class="metric-percentage">
                {{ ((estadisticas()?.empresasSuspendidas ?? 0) / (estadisticas()?.totalEmpresas ?? 1) * 100) | number:'1.0-1' }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Contenido Principal -->
    <div class="content-section">
      <mat-tab-group class="dashboard-tabs">
        <!-- Tab: Resumen General -->
        <mat-tab label="RESUMEN GENERAL">
          <div class="tab-content">
            <div class="content-grid">
              <!-- Estado de Empresas -->
              <mat-card class="content-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon [iconName]="'pie_chart'" [size]="24" [tooltipText]="'Gráfico de estados de empresas'"></app-smart-icon>
                    ESTADO DE EMPRESAS
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="estado-empresas">
                    @for (estado of estadosEmpresa; track estado.valor) {
                      <div class="estado-item">
                        <div class="estado-info">
                          <span class="estado-nombre">{{ estado.nombre }}</span>
                          <span class="estado-cantidad">{{ estado.cantidad }}</span>
                        </div>
                        <mat-progress-bar 
                          [value]="estado.porcentaje" 
                          [color]="estado.color"
                          class="estado-progress">
                        </mat-progress-bar>
                        <span class="estado-porcentaje">{{ estado.porcentaje | number:'1.0-1' }}%</span>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Actividad Reciente -->
              <mat-card class="content-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon [iconName]="'timeline'" [size]="24" [tooltipText]="'Línea de tiempo de actividades'"></app-smart-icon>
                    ACTIVIDAD RECIENTE
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="actividad-reciente">
                    @for (actividad of actividadesRecientes(); track actividad.id) {
                      <div class="actividad-item">
                        <div class="actividad-icon">
                          <app-smart-icon 
                            [iconName]="getIconoActividad(actividad.tipo)" 
                            [size]="20" 
                            [tooltipText]="'Actividad: ' + actividad.tipo"
                            [class]="'icono-' + actividad.tipo.toLowerCase()">
                          </app-smart-icon>
                        </div>
                        <div class="actividad-content">
                          <div class="actividad-titulo">{{ actividad.titulo }}</div>
                          <div class="actividad-descripcion">{{ actividad.descripcion }}</div>
                          <div class="actividad-tiempo">{{ actividad.tiempo }}</div>
                        </div>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Tab: Análisis de Riesgo -->
        <mat-tab label="ANÁLISIS DE RIESGO">
          <div class="tab-content">
            <div class="content-grid">
              <!-- Distribución de Riesgo -->
              <mat-card class="content-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon [iconName]="'security'" [size]="24" [tooltipText]="'Análisis de seguridad y riesgo'"></app-smart-icon>
                    DISTRIBUCIÓN DE RIESGO
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="riesgo-distribucion">
                    @for (nivel of nivelesRiesgo(); track nivel.nivel) {
                      <div class="riesgo-item">
                        <div class="riesgo-header">
                          <span class="riesgo-nivel" [class]="'riesgo-' + nivel.nivel.toLowerCase()">
                            {{ nivel.nombre }}
                          </span>
                          <span class="riesgo-cantidad">{{ nivel.cantidad }} empresas</span>
                        </div>
                        <mat-progress-bar 
                          [value]="nivel.porcentaje" 
                          [color]="nivel.color"
                          class="riesgo-progress">
                        </mat-progress-bar>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Empresas de Alto Riesgo -->
              <mat-card class="content-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon [iconName]="'warning'" [size]="24" [tooltipText]="'Empresas que requieren atención especial'"></app-smart-icon>
                    EMPRESAS DE ALTO RIESGO
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="empresas-riesgo">
                    @for (empresa of empresasAltoRiesgo(); track empresa.id) {
                      <div class="empresa-riesgo-item">
                        <div class="empresa-info">
                          <div class="empresa-nombre">{{ empresa.razonSocial.principal }}</div>
                          <div class="empresa-ruc">RUC: {{ empresa.ruc }}</div>
                        </div>
                        <div class="empresa-riesgo">
                          <span class="score-riesgo" [class]="'score-' + getNivelRiesgo(empresa.scoreRiesgo || 0)">
                            Score: {{ empresa.scoreRiesgo || 0 }}
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Tab: Documentos -->
        <mat-tab label="DOCUMENTOS">
          <div class="tab-content">
            <div class="content-grid">
              <!-- Documentos por Vencer -->
              <mat-card class="content-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon [iconName]="'schedule'" [size]="24" [tooltipText]="'Documentos próximos a vencer'"></app-smart-icon>
                    DOCUMENTOS POR VENCER
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="documentos-vencer">
                    @for (documento of documentosPorVencer(); track documento.id) {
                      <div class="documento-item">
                        <div class="documento-info">
                          <div class="documento-tipo">{{ documento.tipo }}</div>
                          <div class="documento-empresa">{{ documento.empresa }}</div>
                        </div>
                        <div class="documento-vencimiento">
                          <span class="dias-restantes" [class]="'dias-' + getDiasRestantesClass(documento.diasRestantes)">
                            {{ documento.diasRestantes }} días
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Tipos de Documentos -->
              <mat-card class="content-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon [iconName]="'description'" [size]="24" [tooltipText]="'Tipos de documentos registrados'"></app-smart-icon>
                    TIPOS DE DOCUMENTOS
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="tipos-documentos">
                    @for (tipo of tiposDocumentos(); track tipo.tipo) {
                      <div class="tipo-documento-item">
                        <div class="tipo-info">
                          <span class="tipo-nombre">{{ tipo.nombre }}</span>
                          <span class="tipo-cantidad">{{ tipo.cantidad }}</span>
                        </div>
                        <mat-progress-bar 
                          [value]="tipo.porcentaje" 
                          class="tipo-progress">
                        </mat-progress-bar>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-content {
      flex-grow: 1;
      margin-right: 20px;
    }

    .header-title h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 28px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .header-subtitle {
      color: #666;
      margin-top: 4px;
      text-transform: uppercase;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .action-button {
      text-transform: uppercase;
      font-weight: 500;
    }

    .metrics-section {
      padding: 20px;
      background-color: #fff;
      border-bottom: 1px solid #e0e0e0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .metric-card {
      display: flex;
      align-items: center;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    }

    .metric-card:hover {
      transform: translateY(-4px);
    }

    .metric-card.total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .metric-card.habilitadas {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .metric-card.en-tramite {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }

    .metric-card.suspendidas {
      background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
      color: #333;
    }

    .metric-icon {
      margin-right: 20px;
      font-size: 3em;
      opacity: 0.8;
    }

    .metric-content {
      flex-grow: 1;
    }

    .metric-value {
      font-size: 2.5em;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .metric-label {
      font-size: 1em;
      opacity: 0.9;
      text-transform: uppercase;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .metric-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.9em;
      opacity: 0.8;
    }

    .metric-trend.positive {
      color: #4caf50;
    }

    .metric-percentage {
      font-size: 1.2em;
      font-weight: 600;
      opacity: 0.8;
    }

    .content-section {
      padding: 20px;
    }

    .dashboard-tabs {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .tab-content {
      padding: 24px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .content-card {
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .content-card mat-card-header {
      background: #f8f9fa;
      border-radius: 8px 8px 0 0;
      padding: 16px;
    }

    .content-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
      color: #2c3e50;
      margin: 0;
    }

    .content-card mat-card-content {
      padding: 20px;
    }

    /* Estados de empresas */
    .estado-empresas {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .estado-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .estado-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-width: 200px;
    }

    .estado-nombre {
      font-weight: 500;
      color: #2c3e50;
    }

    .estado-cantidad {
      font-weight: 600;
      color: #666;
    }

    .estado-progress {
      flex-grow: 1;
      max-width: 200px;
    }

    .estado-porcentaje {
      min-width: 60px;
      text-align: right;
      font-weight: 600;
      color: #666;
    }

    /* Actividad reciente */
    .actividad-reciente {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .actividad-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .actividad-item:last-child {
      border-bottom: none;
    }

    .actividad-icon {
      margin-top: 4px;
    }

    .actividad-icon app-smart-icon {
      color: #666;
    }

    .actividad-content {
      flex-grow: 1;
    }

    .actividad-titulo {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .actividad-descripcion {
      color: #666;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .actividad-tiempo {
      color: #999;
      font-size: 12px;
    }

    /* Análisis de riesgo */
    .riesgo-distribucion {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .riesgo-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .riesgo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .riesgo-nivel {
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      text-transform: uppercase;
    }

    .riesgo-bajo { background: #d4edda; color: #155724; }
    .riesgo-medio { background: #fff3cd; color: #856404; }
    .riesgo-alto { background: #f8d7da; color: #721c24; }

    .riesgo-cantidad {
      font-size: 14px;
      color: #666;
    }

    .riesgo-progress {
      height: 8px;
      border-radius: 4px;
    }

    /* Empresas de alto riesgo */
    .empresas-riesgo {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .empresa-riesgo-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .empresa-nombre {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .empresa-ruc {
      font-size: 14px;
      color: #666;
    }

    .score-riesgo {
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .score-bajo { background: #d4edda; color: #155724; }
    .score-medio { background: #fff3cd; color: #856404; }
    .score-alto { background: #f8d7da; color: #721c24; }

    /* Documentos */
    .documentos-vencer {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .documento-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .documento-tipo {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .documento-empresa {
      font-size: 14px;
      color: #666;
    }

    .dias-restantes {
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .dias-muchos { background: #d4edda; color: #155724; }
    .dias-pocos { background: #fff3cd; color: #856404; }
    .dias-criticos { background: #f8d7da; color: #721c24; }

    /* Tipos de documentos */
    .tipos-documentos {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tipo-documento-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tipo-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .tipo-nombre {
      font-weight: 500;
      color: #2c3e50;
    }

    .tipo-cantidad {
      font-weight: 600;
      color: #666;
    }

    .tipo-progress {
      height: 8px;
      border-radius: 4px;
    }

    /* Iconos de actividad */
    .icono-creacion { color: #28a745; }
    .icono-actualizacion { color: #17a2b8; }
    .icono-estado { color: #ffc107; }
    .icono-vehiculo { color: #6f42c1; }
    .icono-conductor { color: #fd7e14; }
    .icono-documento { color: #20c997; }
  `]
})
export class DashboardEmpresasComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private router = inject(Router);

  // Signals
  isLoading = signal(false);
  estadisticas = signal<EmpresaEstadisticas | null>(null);

  // Estados de empresa para el dashboard
  estadosEmpresa = [
    { valor: EstadoEmpresa.HABILITADA, nombre: 'HABILITADAS', cantidad: 0, porcentaje: 0, color: 'primary' },
    { valor: EstadoEmpresa.EN_TRAMITE, nombre: 'EN TRÁMITE', cantidad: 0, porcentaje: 0, color: 'accent' },
    { valor: EstadoEmpresa.SUSPENDIDA, nombre: 'SUSPENDIDAS', cantidad: 0, porcentaje: 0, color: 'warn' },
    { valor: EstadoEmpresa.CANCELADA, nombre: 'CANCELADAS', cantidad: 0, porcentaje: 0, color: 'warn' }
  ];

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  async cargarEstadisticas(): Promise<void> {
    this.isLoading.set(true);
    try {
      const stats = await this.empresaService.getEstadisticasEmpresas().toPromise();
      if (stats) {
        this.estadisticas.set(stats);
      }
      this.actualizarEstadosEmpresa();
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private actualizarEstadosEmpresa(): void {
    const stats = this.estadisticas();
    if (!stats) return;

    const total = stats.totalEmpresas;
    
    this.estadosEmpresa[0].cantidad = stats.empresasHabilitadas;
    this.estadosEmpresa[0].porcentaje = (stats.empresasHabilitadas / total) * 100;
    
    this.estadosEmpresa[1].cantidad = stats.empresasEnTramite;
    this.estadosEmpresa[1].porcentaje = (stats.empresasEnTramite / total) * 100;
    
    this.estadosEmpresa[2].cantidad = stats.empresasSuspendidas;
    this.estadosEmpresa[2].porcentaje = (stats.empresasSuspendidas / total) * 100;
    
    this.estadosEmpresa[3].cantidad = total - stats.empresasHabilitadas - stats.empresasEnTramite - stats.empresasSuspendidas;
    this.estadosEmpresa[3].porcentaje = (this.estadosEmpresa[3].cantidad / total) * 100;
  }

  // Datos simulados para el dashboard
  actividadesRecientes = signal([
    { id: 1, tipo: 'CREACION', titulo: 'Nueva empresa registrada', descripcion: 'TRANSPORTES PUNO S.A.C.', tiempo: 'Hace 2 horas' },
    { id: 2, tipo: 'ACTUALIZACION', titulo: 'Empresa actualizada', descripcion: 'Se modificó información de contacto', tiempo: 'Hace 4 horas' },
    { id: 3, tipo: 'VEHICULO', titulo: 'Vehículo agregado', descripcion: 'Se agregó nuevo vehículo a empresa', tiempo: 'Hace 6 horas' },
    { id: 4, tipo: 'ESTADO', titulo: 'Estado cambiado', descripcion: 'Empresa habilitada exitosamente', tiempo: 'Hace 8 horas' }
  ]);

  nivelesRiesgo = signal([
    { nivel: 'BAJO', nombre: 'RIESGO BAJO', cantidad: 45, porcentaje: 60, color: 'primary' },
    { nivel: 'MEDIO', nombre: 'RIESGO MEDIO', cantidad: 20, porcentaje: 27, color: 'accent' },
    { nivel: 'ALTO', nombre: 'RIESGO ALTO', cantidad: 10, porcentaje: 13, color: 'warn' }
  ]);

  empresasAltoRiesgo = signal([
    { id: '1', razonSocial: { principal: 'EMPRESA A' }, ruc: '20123456789', scoreRiesgo: 85 },
    { id: '2', razonSocial: { principal: 'EMPRESA B' }, ruc: '20234567890', scoreRiesgo: 78 },
    { id: '3', razonSocial: { principal: 'EMPRESA C' }, ruc: '20345678901', scoreRiesgo: 92 }
  ]);

  documentosPorVencer = signal([
    { id: 1, tipo: 'RUC', empresa: 'EMPRESA A', diasRestantes: 5 },
    { id: 2, tipo: 'LICENCIA', empresa: 'EMPRESA B', diasRestantes: 12 },
    { id: 3, tipo: 'CERTIFICADO', empresa: 'EMPRESA C', diasRestantes: 30 }
  ]);

  tiposDocumentos = signal([
    { tipo: 'RUC', nombre: 'RUC', cantidad: 75, porcentaje: 100 },
    { tipo: 'LICENCIA', nombre: 'LICENCIAS', cantidad: 68, porcentaje: 91 },
    { tipo: 'CERTIFICADO', nombre: 'CERTIFICADOS', cantidad: 45, porcentaje: 60 },
    { tipo: 'RESOLUCION', nombre: 'RESOLUCIONES', cantidad: 32, porcentaje: 43 }
  ]);

  getIconoActividad(tipo: string): string {
    const iconos = {
      'CREACION': 'add_business',
      'ACTUALIZACION': 'edit',
      'ESTADO': 'swap_horiz',
      'VEHICULO': 'directions_car',
      'CONDUCTOR': 'person',
      'DOCUMENTO': 'description'
    };
    return iconos[tipo as keyof typeof iconos] || 'info';
  }

  getNivelRiesgo(score: number): string {
    if (score < 30) return 'bajo';
    if (score < 70) return 'medio';
    return 'alto';
  }

  getDiasRestantesClass(dias: number): string {
    if (dias > 15) return 'muchos';
    if (dias > 7) return 'pocos';
    return 'criticos';
  }

  nuevaEmpresa(): void {
    this.router.navigate(['/empresas/nueva']);
  }

  generarReporte(): void {
    // Implementar generación de reporte
    console.log('Generando reporte...');
  }
} 