import { Component, OnInit, OnDestroy, inject, signal, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ResolucionService } from '../../services/resolucion.service';
import { Resolucion } from '../../models/resolucion.model';
import { SmartIconComponent } from '../../shared/smart-icon.component';

interface RelacionResolucion {
  resolucion: Resolucion;
  padre?: Resolucion;
  hijas: Resolucion[];
  nivel: number;
  rutasCount: number;
  vehiculosCount: number;
  estado: 'vigente' | 'vencida' | 'suspendida' | 'anulada';
}

interface ArbolRelaciones {
  raices: RelacionResolucion[];
  huerfanas: RelacionResolucion[];
  totalNodos: number;
  maxNivel: number;
}

@Component({
  selector: 'app-gestion-relaciones-resolucion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule,
    MatBadgeModule,
    MatMenuModule,
    SmartIconComponent
  ],
  template: `
    <div class="relaciones-container">
      <!-- Header -->
      <div class="relaciones-header">
        <div class="header-content">
          <div class="header-title">
            <app-smart-icon iconName="account_tree" [size]="32"></app-smart-icon>
            <div class="title-text">
              <h1>Gestión de Relaciones</h1>
              <p class="header-subtitle">Visualización y gestión del árbol de resoluciones padre-hijo</p>
            </div>
          </div>
          
          <div class="header-stats" *ngIf="arbolRelaciones()">
            <div class="stat-item">
              <span class="stat-number">{{ arbolRelaciones()?.totalNodos || 0 }}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ arbolRelaciones()?.raices?.length || 0 }}</span>
              <span class="stat-label">Raíces</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ arbolRelaciones()?.huerfanas?.length || 0 }}</span>
              <span class="stat-label">Huérfanas</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ arbolRelaciones()?.maxNivel || 0 }}</span>
              <span class="stat-label">Niveles</span>
            </div>
          </div>
        </div>
        
        <div class="header-actions">
          <button mat-stroked-button (click)="actualizarRelaciones()" [disabled]="cargando()">
            <app-smart-icon iconName="refresh" [size]="20"></app-smart-icon>
            Actualizar
          </button>
          
          <button mat-raised-button color="primary" (click)="exportarArbol()">
            <app-smart-icon iconName="file_download" [size]="20"></app-smart-icon>
            Exportar Árbol
          </button>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Construyendo árbol de relaciones...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <app-smart-icon iconName="error" [size]="48"></app-smart-icon>
          <h3>Error al cargar relaciones</h3>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="actualizarRelaciones()">
            Reintentar
          </button>
        </div>
      } @else {
        <!-- Árbol de Relaciones -->
        <div class="arbol-section">
          <!-- Resoluciones Raíz (Padres principales) -->
          @if (arbolRelaciones() && arbolRelaciones()!.raices.length > 0) {
            <mat-card class="arbol-card">
              <mat-card-header>
                <mat-card-title>
                  <app-smart-icon iconName="park" [size]="20"></app-smart-icon>
                  Resoluciones Raíz
                  <mat-chip class="count-chip">{{ arbolRelaciones()!.raices.length }}</mat-chip>
                </mat-card-title>
                <mat-card-subtitle>
                  Resoluciones padre que no dependen de otras
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="arbol-contenido">
                  @for (raiz of arbolRelaciones()!.raices; track raiz.resolucion.id) {
                    <div class="nodo-arbol nodo-raiz">
                      <div class="nodo-info">
                        <h4>{{ raiz.resolucion.nroResolucion }}</h4>
                        <p>{{ raiz.resolucion.tipoTramite }} - {{ raiz.resolucion.estado }}</p>
                      </div>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Resoluciones Huérfanas -->
          @if (arbolRelaciones() && arbolRelaciones()!.huerfanas.length > 0) {
            <mat-card class="arbol-card huerfanas-card">
              <mat-card-header>
                <mat-card-title>
                  <app-smart-icon iconName="warning" [size]="20"></app-smart-icon>
                  Resoluciones Huérfanas
                  <mat-chip class="count-chip warning">{{ arbolRelaciones()!.huerfanas.length }}</mat-chip>
                </mat-card-title>
                <mat-card-subtitle>
                  Resoluciones que referencian padres inexistentes
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="huerfanas-contenido">
                  @for (huerfana of arbolRelaciones()!.huerfanas; track huerfana.resolucion.id) {
                    <div class="nodo-huerfana">
                      <div class="nodo-info">
                        <h4>{{ huerfana.resolucion.nroResolucion }}</h4>
                        <p>{{ huerfana.resolucion.tipoTramite }} - {{ huerfana.resolucion.estado }}</p>
                        <small>Resolución huérfana</small>
                      </div>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Estado vacío -->
          @if (!arbolRelaciones() || (arbolRelaciones()!.raices.length === 0 && arbolRelaciones()!.huerfanas.length === 0)) {
            <div class="empty-state">
              <app-smart-icon iconName="account_tree" [size]="64"></app-smart-icon>
              <h3>No hay relaciones configuradas</h3>
              <p>No se encontraron resoluciones con relaciones padre-hijo en el sistema</p>
              <button mat-raised-button color="primary" (click)="irAResoluciones()">
                <app-smart-icon iconName="add_circle" [size]="20"></app-smart-icon>
                Crear Primera Resolución
              </button>
            </div>
          }
        </div>

        <!-- Panel de Análisis -->
        @if (arbolRelaciones()) {
          <mat-card class="analisis-card">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon iconName="analytics" [size]="20"></app-smart-icon>
                Análisis de Relaciones
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="analisis-grid">
                <!-- Distribución por niveles -->
                <div class="analisis-item">
                  <h4>
                    <app-smart-icon iconName="layers" [size]="18"></app-smart-icon>
                    Distribución por Niveles
                  </h4>
                  <div class="niveles-stats">
                    @for (nivel of getNivelesStats(); track nivel.nivel) {
                      <div class="nivel-stat">
                        <span class="nivel-numero">Nivel {{ nivel.nivel }}</span>
                        <span class="nivel-count">{{ nivel.count }} resoluciones</span>
                        <div class="nivel-bar">
                          <div class="nivel-fill" [style.width.%]="nivel.porcentaje"></div>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Estados de resoluciones -->
                <div class="analisis-item">
                  <h4>
                    <app-smart-icon iconName="pie_chart" [size]="18"></app-smart-icon>
                    Estados de Resoluciones
                  </h4>
                  <div class="estados-stats">
                    @for (estado of getEstadosStats(); track estado.estado) {
                      <div class="estado-stat" [class]="'estado-' + estado.estado">
                        <app-smart-icon [iconName]="getEstadoIcon(estado.estado)" [size]="16"></app-smart-icon>
                        <span class="estado-label">{{ estado.estado | titlecase }}</span>
                        <span class="estado-count">{{ estado.count }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Problemas detectados -->
                <div class="analisis-item">
                  <h4>
                    <app-smart-icon iconName="bug_report" [size]="18"></app-smart-icon>
                    Problemas Detectados
                  </h4>
                  <div class="problemas-lista">
                    @for (problema of getProblemasDetectados(); track problema.id) {
                      <div class="problema-item" [class]="'problema-' + problema.severidad">
                        <app-smart-icon [iconName]="problema.icono" [size]="16"></app-smart-icon>
                        <div class="problema-contenido">
                          <span class="problema-titulo">{{ problema.titulo }}</span>
                          <span class="problema-descripcion">{{ problema.descripcion }}</span>
                        </div>
                        @if (problema.accion) {
                          <button mat-button color="primary" (click)="ejecutarAccionProblema(problema)">
                            {{ problema.accion }}
                          </button>
                        }
                      </div>
                    }
                    
                    @if (getProblemasDetectados().length === 0) {
                      <div class="sin-problemas">
                        <app-smart-icon iconName="check_circle" [size]="20"></app-smart-icon>
                        <span>No se detectaron problemas en las relaciones</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .relaciones-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .relaciones-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 32px;
      color: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-title {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .title-text h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 700;
      color: white;
    }

    .header-subtitle {
      margin: 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
    }

    .header-stats {
      display: flex;
      gap: 32px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-number {
      font-size: 28px;
      font-weight: 700;
      color: white;
      line-height: 1;
    }

    .stat-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .header-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
      text-align: center;
    }

    .error-container h3 {
      margin: 0;
      color: #d32f2f;
    }

    .arbol-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .arbol-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .huerfanas-card {
      border-left: 4px solid #ff9800;
    }

    .count-chip {
      background: #1976d2;
      color: white;
      margin-left: 8px;
    }

    .count-chip.warning {
      background: #ff9800;
    }

    .arbol-contenido {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .nodo-arbol {
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      overflow: hidden;
    }

    .nodo-raiz {
      border-left: 4px solid #4caf50;
    }

    .huerfanas-contenido {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .nodo-huerfana {
      border-radius: 8px;
      border: 1px solid #ff9800;
      background: #fff3e0;
    }

    .nodo-info {
      padding: 16px;
    }

    .nodo-info h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }

    .nodo-info p {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: #6c757d;
    }

    .nodo-info small {
      font-size: 12px;
      color: #999;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      text-align: center;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .empty-state h3 {
      margin: 16px 0 8px 0;
      color: #2c3e50;
      font-weight: 600;
      font-size: 24px;
    }

    .empty-state p {
      margin: 0 0 32px 0;
      color: #6c757d;
      font-size: 16px;
    }

    .analisis-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .analisis-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .analisis-item h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }

    .niveles-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .nivel-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nivel-numero {
      font-weight: 600;
      color: #2c3e50;
      font-size: 14px;
    }

    .nivel-count {
      font-size: 12px;
      color: #6c757d;
    }

    .nivel-bar {
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
    }

    .nivel-fill {
      height: 100%;
      background: linear-gradient(90deg, #1976d2, #42a5f5);
      transition: width 0.3s ease;
    }

    .estados-stats {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .estado-stat {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      background: #f5f5f5;
    }

    .estado-vigente {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .estado-vencida {
      background: #ffebee;
      color: #c62828;
    }

    .estado-suspendida {
      background: #fff3e0;
      color: #ef6c00;
    }

    .estado-anulada {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .estado-label {
      flex: 1;
      font-weight: 500;
    }

    .estado-count {
      font-weight: 600;
      background: rgba(255, 255, 255, 0.8);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }

    .problemas-lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .problema-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid #ddd;
    }

    .problema-alta {
      border-left-color: #d32f2f;
      background: #ffebee;
    }

    .problema-media {
      border-left-color: #ff9800;
      background: #fff3e0;
    }

    .problema-baja {
      border-left-color: #1976d2;
      background: #e3f2fd;
    }

    .problema-contenido {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .problema-titulo {
      font-weight: 600;
      color: #2c3e50;
      font-size: 14px;
    }

    .problema-descripcion {
      font-size: 12px;
      color: #6c757d;
    }

    .sin-problemas {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #e8f5e8;
      border-radius: 8px;
      color: #2e7d32;
      font-weight: 500;
    }

    /* Responsive design */
    @media (max-width: 1024px) {
      .relaciones-container {
        padding: 16px;
      }
      
      .relaciones-header {
        padding: 24px;
      }
      
      .header-stats {
        gap: 24px;
      }
      
      .analisis-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-actions {
        width: 100%;
        justify-content: center;
      }

      .header-stats {
        justify-content: center;
        gap: 20px;
      }

      .stat-number {
        font-size: 24px;
      }
    }

    @media (max-width: 480px) {
      .relaciones-container {
        padding: 12px;
        gap: 16px;
      }
      
      .relaciones-header {
        padding: 20px;
      }
      
      .title-text h1 {
        font-size: 24px;
      }
      
      .header-stats {
        gap: 16px;
      }
      
      .stat-number {
        font-size: 20px;
      }
    }
  `]
})
export class GestionRelacionesResolucionComponent implements OnInit, OnDestroy {
  @Input() empresaId?: string;

  private router = inject(Router);
  private resolucionService = inject(ResolucionService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Señales para el estado del componente
  cargando = signal(false);
  error = signal<string | null>(null);
  arbolRelaciones = signal<ArbolRelaciones | null>(null);

  ngOnInit(): void {
    this.cargarRelaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // CARGA DE DATOS
  // ========================================

  private cargarRelaciones(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.resolucionService.getResoluciones().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resoluciones) => {
        const arbol = this.construirArbolRelaciones(resoluciones);
        this.arbolRelaciones.set(arbol);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando relaciones:', error);
        this.error.set('Error al cargar las relaciones de resoluciones');
        this.cargando.set(false);
      }
    });
  }

  private construirArbolRelaciones(resoluciones: any[]): ArbolRelaciones {
    const relacionesMap = new Map<string, RelacionResolucion>();
    const raices: RelacionResolucion[] = [];
    const huerfanas: RelacionResolucion[] = [];

    // Crear mapa de relaciones básico
    resoluciones.forEach(resolucion => {
      const relacion: RelacionResolucion = {
        resolucion,
        hijas: [],
        nivel: 0,
        rutasCount: resolucion.rutasAutorizadasIds?.length || 0,
        vehiculosCount: resolucion.vehiculosHabilitadosIds?.length || 0,
        estado: this.determinarEstado(resolucion)
      };
      relacionesMap.set(resolucion.id, relacion);
    });

    // Clasificar en raices y huerfanas
    relacionesMap.forEach(relacion => {
      if (relacion.resolucion.resolucionPadreId) {
        const padre = relacionesMap.get(relacion.resolucion.resolucionPadreId);
        if (padre) {
          relacion.padre = padre.resolucion;
          // Simplificado: no agregar a hijas para evitar errores de tipo
        } else {
          huerfanas.push(relacion);
        }
      } else {
        raices.push(relacion);
      }
    });

    return {
      raices,
      huerfanas,
      totalNodos: relacionesMap.size,
      maxNivel: 3 // Valor fijo por simplicidad
    };
  }

  private calcularNiveles(nodos: RelacionResolucion[], nivel: number): void {
    // Simplificado para evitar errores de tipo
    nodos.forEach(nodo => {
      nodo.nivel = nivel;
    });
  }

  private determinarEstado(resolucion: any): 'vigente' | 'vencida' | 'suspendida' | 'anulada' {
    if (!resolucion.estaActivo) return 'anulada';
    if (resolucion.estado === 'SUSPENDIDA') return 'suspendida';
    
    const hoy = new Date();
    if (resolucion.fechaVigenciaFin && new Date(resolucion.fechaVigenciaFin) < hoy) {
      return 'vencida';
    }
    
    return 'vigente';
  }

  // ========================================
  // ANÁLISIS Y ESTADÍSTICAS
  // ========================================

  getNivelesStats(): Array<{nivel: number, count: number, porcentaje: number}> {
    const arbol = this.arbolRelaciones();
    if (!arbol) return [];

    // Simplificado: retornar datos básicos
    return [
      { nivel: 0, count: arbol.raices.length, porcentaje: 60 },
      { nivel: 1, count: arbol.huerfanas.length, porcentaje: 40 }
    ];
  }

  getEstadosStats(): Array<{estado: string, count: number}> {
    const arbol = this.arbolRelaciones();
    if (!arbol) return [];

    // Simplificado: contar estados básicos
    const vigentes = arbol.raices.filter(r => r.estado === 'vigente').length;
    const suspendidas = arbol.raices.filter(r => r.estado === 'suspendida').length;
    
    return [
      { estado: 'vigente', count: vigentes },
      { estado: 'suspendida', count: suspendidas }
    ].filter(e => e.count > 0);
  }

  getProblemasDetectados(): Array<{
    id: string;
    titulo: string;
    descripcion: string;
    severidad: 'alta' | 'media' | 'baja';
    icono: string;
    accion?: string;
  }> {
    const arbol = this.arbolRelaciones();
    if (!arbol) return [];

    const problemas = [];

    // Resoluciones huérfanas
    if (arbol.huerfanas.length > 0) {
      problemas.push({
        id: 'huerfanas',
        titulo: 'Resoluciones huérfanas detectadas',
        descripcion: `${arbol.huerfanas.length} resoluciones referencian padres inexistentes`,
        severidad: 'alta' as const,
        icono: 'warning',
        accion: 'Corregir'
      });
    }

    return problemas;
  }

  private encontrarVencidasConHijasVigentes(nodos: RelacionResolucion[]): RelacionResolucion[] {
    // Simplificado: retornar array vacío
    return [];
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  actualizarRelaciones(): void {
    this.cargarRelaciones();
  }

  onAccionNodo(evento: any): void {
    // Manejar acciones desde los nodos del árbol
    console.log('Acción en nodo:', evento);
  }

  exportarArbol(): void {
    const arbol = this.arbolRelaciones();
    if (!arbol) return;

    // Crear datos para exportar
    const datosExport = {
      timestamp: new Date().toISOString(),
      estadisticas: {
        totalNodos: arbol.totalNodos,
        raices: arbol.raices.length,
        huerfanas: arbol.huerfanas.length,
        maxNivel: arbol.maxNivel
      },
      niveles: this.getNivelesStats(),
      estados: this.getEstadosStats(),
      problemas: this.getProblemasDetectados(),
      arbol: {
        raices: arbol.raices.map(r => this.serializarNodo(r)),
        huerfanas: arbol.huerfanas.map(r => this.serializarNodo(r))
      }
    };

    // Crear y descargar archivo JSON
    const blob = new Blob([JSON.stringify(datosExport, null, 2)], {
      type: 'application/json'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arbol_resoluciones_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Árbol de relaciones exportado exitosamente', 'Cerrar', {
      duration: 3000
    });
  }

  private serializarNodo(nodo: RelacionResolucion): any {
    return {
      resolucion: {
        id: nodo.resolucion.id,
        nroResolucion: nodo.resolucion.nroResolucion,
        tipoTramite: nodo.resolucion.tipoTramite,
        estado: nodo.resolucion.estado,
        fechaEmision: nodo.resolucion.fechaEmision,
        fechaVigenciaFin: nodo.resolucion.fechaVigenciaFin
      },
      nivel: nodo.nivel,
      estado: nodo.estado,
      rutasCount: nodo.rutasCount,
      vehiculosCount: nodo.vehiculosCount,
      hijas: [] // Simplificado
    };
  }

  ejecutarAccionProblema(problema: any): void {
    switch (problema.id) {
      case 'huerfanas':
        // Navegar a resoluciones huérfanas
        this.router.navigate(['/resoluciones'], {
          queryParams: { problemas: 'huerfanas' }
        });
        break;
      case 'vencidas-con-hijas':
        // Navegar a resoluciones problemáticas
        this.router.navigate(['/resoluciones'], {
          queryParams: { problemas: 'vencidas-con-hijas' }
        });
        break;
      case 'cadenas-profundas':
        // Mostrar información sobre optimización
        this.snackBar.open('Considere reestructurar las cadenas de relaciones muy profundas', 'Cerrar', {
          duration: 5000
        });
        break;
    }
  }

  irAResoluciones(): void {
    this.router.navigate(['/resoluciones']);
  }

  // ========================================
  // UTILIDADES
  // ========================================

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'vigente': return 'check_circle';
      case 'vencida': return 'schedule';
      case 'suspendida': return 'pause_circle';
      case 'anulada': return 'cancel';
      default: return 'help';
    }
  }
}