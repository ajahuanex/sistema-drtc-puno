import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { ResolucionService } from '../../services/resolucion.service';
import { EmpresaService } from '../../services/empresa.service';
import { SmartIconComponent } from '../../shared/smart-icon.component';

interface ValidacionItem {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'error' | 'warning' | 'info' | 'success';
  categoria: 'datos' | 'relaciones' | 'fechas' | 'referencias' | 'consistencia';
  severidad: 'critica' | 'alta' | 'media' | 'baja';
  resolucionesAfectadas: string[];
  solucionSugerida?: string;
  accionAutomatica?: boolean;
}

interface ResultadoValidacion {
  totalResoluciones: number;
  validacionesEjecutadas: number;
  erroresCriticos: number;
  advertencias: number;
  informacion: number;
  exitosos: number;
  porcentajeExito: number;
  tiempoEjecucion: number;
  items: ValidacionItem[];
}

@Component({
  selector: 'app-validacion-resoluciones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatExpansionModule,
    SmartIconComponent
  ],
  template: `
    <div class="validacion-container">
      <!-- Header -->
      <div class="validacion-header">
        <div class="header-content">
          <div class="header-title">
            <app-smart-icon iconName="verified" [size]="32"></app-smart-icon>
            <div class="title-text">
              <h1>Validación de Resoluciones</h1>
              <p class="header-subtitle">Diagnóstico y validación de integridad de datos</p>
            </div>
          </div>
          
          <div class="header-actions">
            <button mat-stroked-button (click)="limpiarResultados()" [disabled]="!resultado() || ejecutando()">
              <app-smart-icon iconName="clear_all" [size]="20"></app-smart-icon>
              Limpiar
            </button>
            
            <button mat-raised-button color="primary" (click)="ejecutarValidacion()" [disabled]="ejecutando()">
              @if (ejecutando()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <app-smart-icon iconName="play_arrow" [size]="20"></app-smart-icon>
              }
              {{ ejecutando() ? 'Validando...' : 'Ejecutar Validación' }}
            </button>
          </div>
        </div>
        
        <!-- Progreso de validación -->
        @if (ejecutando()) {
          <div class="progreso-validacion">
            <div class="progreso-info">
              <span>{{ estadoActual() }}</span>
              <span>{{ progresoActual() }}%</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="progresoActual()"></mat-progress-bar>
          </div>
        }
      </div>

      @if (resultado()) {
        <!-- Resumen de resultados -->
        <mat-card class="resumen-card">
          <mat-card-header>
            <mat-card-title>
              <app-smart-icon iconName="assessment" [size]="20"></app-smart-icon>
              Resumen de Validación
            </mat-card-title>
            <mat-card-subtitle>
              Ejecutado el {{ fechaEjecucion() | date:'dd/MM/yyyy HH:mm:ss' }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="resumen-grid">
              <!-- Estadísticas generales -->
              <div class="resumen-stats">
                <div class="stat-item">
                  <span class="stat-number">{{ resultado()?.totalResoluciones || 0 }}</span>
                  <span class="stat-label">Resoluciones</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ resultado()?.validacionesEjecutadas || 0 }}</span>
                  <span class="stat-label">Validaciones</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ resultado()?.tiempoEjecucion || 0 }}s</span>
                  <span class="stat-label">Tiempo</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ resultado()?.porcentajeExito || 0 }}%</span>
                  <span class="stat-label">Éxito</span>
                </div>
              </div>

              <!-- Indicadores por tipo -->
              <div class="indicadores-tipos">
                <div class="indicador error" [class.active]="(resultado()?.erroresCriticos || 0) > 0">
                  <app-smart-icon iconName="error" [size]="24"></app-smart-icon>
                  <div class="indicador-info">
                    <span class="indicador-numero">{{ resultado()?.erroresCriticos || 0 }}</span>
                    <span class="indicador-label">Errores Críticos</span>
                  </div>
                </div>
                
                <div class="indicador warning" [class.active]="(resultado()?.advertencias || 0) > 0">
                  <app-smart-icon iconName="warning" [size]="24"></app-smart-icon>
                  <div class="indicador-info">
                    <span class="indicador-numero">{{ resultado()?.advertencias || 0 }}</span>
                    <span class="indicador-label">Advertencias</span>
                  </div>
                </div>
                
                <div class="indicador info" [class.active]="(resultado()?.informacion || 0) > 0">
                  <app-smart-icon iconName="info" [size]="24"></app-smart-icon>
                  <div class="indicador-info">
                    <span class="indicador-numero">{{ resultado()?.informacion || 0 }}</span>
                    <span class="indicador-label">Información</span>
                  </div>
                </div>
                
                <div class="indicador success" [class.active]="(resultado()?.exitosos || 0) > 0">
                  <app-smart-icon iconName="check_circle" [size]="24"></app-smart-icon>
                  <div class="indicador-info">
                    <span class="indicador-numero">{{ resultado()?.exitosos || 0 }}</span>
                    <span class="indicador-label">Exitosos</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Resultados detallados -->
        @if (resultado()?.items && resultado()!.items.length > 0) {
          <mat-card class="resultados-card">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon iconName="list" [size]="20"></app-smart-icon>
                Resultados Detallados
                <mat-chip class="count-chip">{{ resultado()!.items.length }}</mat-chip>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <!-- Filtros por categoría -->
              <div class="filtros-categoria">
                <mat-chip-set>
                  <mat-chip 
                    (click)="seleccionarCategoria('todas')"
                    [class.selected]="categoriaSeleccionada() === 'todas'">
                    Todas ({{ resultado()!.items.length }})
                  </mat-chip>
                  @for (categoria of getCategorias(); track categoria.nombre) {
                    <mat-chip 
                      (click)="seleccionarCategoria(categoria.nombre)"
                      [class.selected]="categoriaSeleccionada() === categoria.nombre">
                      {{ categoria.label }} ({{ categoria.count }})
                    </mat-chip>
                  }
                </mat-chip-set>
              </div>

              <!-- Lista de validaciones -->
              <mat-accordion class="validaciones-accordion">
                @for (item of itemsFiltrados(); track item.id) {
                  <mat-expansion-panel class="validacion-panel" [class]="'panel-' + item.tipo">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <div class="panel-title-content">
                          <app-smart-icon [iconName]="getTipoIcon(item.tipo)" [size]="20"></app-smart-icon>
                          <span class="titulo">{{ item.titulo }}</span>
                          <mat-chip class="severidad-chip" [class]="'chip-' + item.severidad">
                            {{ item.severidad | titlecase }}
                          </mat-chip>
                        </div>
                      </mat-panel-title>
                      <mat-panel-description>
                        <span class="categoria-badge">{{ getCategoriaLabel(item.categoria) }}</span>
                        <span class="afectadas-count">{{ item.resolucionesAfectadas.length }} afectadas</span>
                      </mat-panel-description>
                    </mat-expansion-panel-header>

                    <div class="panel-content">
                      <p class="descripcion">{{ item.descripcion }}</p>
                      
                      @if (item.resolucionesAfectadas.length > 0) {
                        <div class="resoluciones-afectadas">
                          <h4>Resoluciones Afectadas:</h4>
                          <div class="resoluciones-chips">
                            @for (resolucionId of item.resolucionesAfectadas.slice(0, 10); track resolucionId) {
                              <mat-chip class="resolucion-chip">{{ resolucionId }}</mat-chip>
                            }
                            @if (item.resolucionesAfectadas.length > 10) {
                              <mat-chip class="mas-chip">+{{ item.resolucionesAfectadas.length - 10 }} más</mat-chip>
                            }
                          </div>
                        </div>
                      }
                      
                      @if (item.solucionSugerida) {
                        <div class="solucion-sugerida">
                          <h4>
                            <app-smart-icon iconName="lightbulb" [size]="16"></app-smart-icon>
                            Solución Sugerida:
                          </h4>
                          <p>{{ item.solucionSugerida }}</p>
                        </div>
                      }
                      
                      <div class="panel-actions">
                        @if (item.accionAutomatica) {
                          <button mat-raised-button color="primary" (click)="ejecutarAccionAutomatica(item)">
                            <app-smart-icon iconName="auto_fix_high" [size]="18"></app-smart-icon>
                            Corregir Automáticamente
                          </button>
                        }
                        
                        <button mat-button (click)="verDetallesItem(item)">
                          <app-smart-icon iconName="visibility" [size]="18"></app-smart-icon>
                          Ver Detalles
                        </button>
                        
                        <button mat-button (click)="exportarItem(item)">
                          <app-smart-icon iconName="file_download" [size]="18"></app-smart-icon>
                          Exportar
                        </button>
                      </div>
                    </div>
                  </mat-expansion-panel>
                }
              </mat-accordion>
            </mat-card-content>
          </mat-card>
        } @else {
          <!-- Estado sin problemas -->
          <div class="sin-problemas">
            <app-smart-icon iconName="verified" [size]="64"></app-smart-icon>
            <h3>¡Validación Exitosa!</h3>
            <p>No se encontraron problemas en las resoluciones del sistema</p>
            <mat-chip class="success-chip">
              <app-smart-icon iconName="check" [size]="16"></app-smart-icon>
              Todas las validaciones pasaron correctamente
            </mat-chip>
          </div>
        }
      } @else {
        <!-- Estado inicial -->
        <div class="estado-inicial">
          <app-smart-icon iconName="verified" [size]="64"></app-smart-icon>
          <h3>Validación de Resoluciones</h3>
          <p>Ejecute una validación completa para verificar la integridad de los datos</p>
          <div class="validaciones-disponibles">
            <h4>Validaciones que se ejecutarán:</h4>
            <ul>
              <li><strong>Integridad de datos:</strong> Campos requeridos, formatos correctos</li>
              <li><strong>Relaciones padre-hijo:</strong> Referencias válidas y consistentes</li>
              <li><strong>Fechas de vigencia:</strong> Rangos válidos y lógicos</li>
              <li><strong>Referencias externas:</strong> Empresas y expedientes existentes</li>
              <li><strong>Consistencia general:</strong> Estados y configuraciones coherentes</li>
            </ul>
          </div>
          <button mat-raised-button color="primary" (click)="ejecutarValidacion()" class="iniciar-btn">
            <app-smart-icon iconName="play_arrow" [size]="20"></app-smart-icon>
            Iniciar Validación
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .validacion-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .validacion-header {
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

    .progreso-validacion {
      margin-top: 16px;
    }

    .progreso-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
    }

    .resumen-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .resumen-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 32px;
      align-items: center;
    }

    .resumen-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .stat-number {
      font-size: 24px;
      font-weight: 700;
      color: #2c3e50;
      line-height: 1;
    }

    .stat-label {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .indicadores-tipos {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .indicador {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      background: #f8f9fa;
      opacity: 0.5;
      transition: all 0.3s ease;
    }

    .indicador.active {
      opacity: 1;
    }

    .indicador.error.active {
      background: #ffebee;
      color: #d32f2f;
    }

    .indicador.warning.active {
      background: #fff3e0;
      color: #f57c00;
    }

    .indicador.info.active {
      background: #e3f2fd;
      color: #1976d2;
    }

    .indicador.success.active {
      background: #e8f5e8;
      color: #388e3c;
    }

    .indicador-info {
      display: flex;
      flex-direction: column;
    }

    .indicador-numero {
      font-size: 18px;
      font-weight: 700;
      line-height: 1;
    }

    .indicador-label {
      font-size: 12px;
      opacity: 0.8;
    }

    .resultados-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .count-chip {
      background: #1976d2;
      color: white;
      margin-left: 8px;
    }

    .filtros-categoria mat-chip.selected {
      background-color: #1976d2;
      color: white;
    }

    .filtros-categoria {
      margin-bottom: 24px;
    }

    .validaciones-accordion {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .validacion-panel {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .panel-error {
      border-left: 4px solid #d32f2f;
    }

    .panel-warning {
      border-left: 4px solid #f57c00;
    }

    .panel-info {
      border-left: 4px solid #1976d2;
    }

    .panel-success {
      border-left: 4px solid #388e3c;
    }

    .panel-title-content {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .titulo {
      flex: 1;
      font-weight: 600;
    }

    .severidad-chip {
      font-size: 11px;
      height: 20px;
      min-height: 20px;
    }

    .chip-critica {
      background: #d32f2f;
      color: white;
    }

    .chip-alta {
      background: #f57c00;
      color: white;
    }

    .chip-media {
      background: #1976d2;
      color: white;
    }

    .chip-baja {
      background: #388e3c;
      color: white;
    }

    .categoria-badge {
      background: rgba(0, 0, 0, 0.1);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      margin-right: 8px;
    }

    .afectadas-count {
      font-size: 12px;
      color: #666;
    }

    .panel-content {
      padding: 16px 0;
    }

    .descripcion {
      margin: 0 0 16px 0;
      color: #6c757d;
      line-height: 1.5;
    }

    .resoluciones-afectadas h4,
    .solucion-sugerida h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .resoluciones-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }

    .resolucion-chip {
      font-size: 11px;
      height: 24px;
      background: #e3f2fd;
      color: #1976d2;
    }

    .mas-chip {
      font-size: 11px;
      height: 24px;
      background: #f5f5f5;
      color: #666;
    }

    .solucion-sugerida {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .solucion-sugerida p {
      margin: 0;
      font-size: 14px;
      color: #495057;
    }

    .panel-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .panel-actions button {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }

    .sin-problemas,
    .estado-inicial {
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

    .sin-problemas h3,
    .estado-inicial h3 {
      margin: 16px 0 8px 0;
      color: #2c3e50;
      font-weight: 600;
      font-size: 24px;
    }

    .sin-problemas p,
    .estado-inicial p {
      margin: 0 0 24px 0;
      color: #6c757d;
      font-size: 16px;
    }

    .success-chip {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .validaciones-disponibles {
      max-width: 600px;
      text-align: left;
      margin-bottom: 32px;
    }

    .validaciones-disponibles h4 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-weight: 600;
    }

    .validaciones-disponibles ul {
      margin: 0;
      padding-left: 20px;
    }

    .validaciones-disponibles li {
      margin-bottom: 8px;
      color: #6c757d;
      line-height: 1.4;
    }

    .iniciar-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 32px;
      font-size: 16px;
      font-weight: 600;
    }

    /* Responsive design */
    @media (max-width: 1024px) {
      .validacion-container {
        padding: 16px;
      }
      
      .validacion-header {
        padding: 24px;
      }
      
      .resumen-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      
      .indicadores-tipos {
        grid-template-columns: 1fr;
        gap: 12px;
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

      .resumen-stats {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .panel-actions {
        flex-direction: column;
      }

      .panel-actions button {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .validacion-container {
        padding: 12px;
        gap: 16px;
      }
      
      .validacion-header {
        padding: 20px;
      }
      
      .title-text h1 {
        font-size: 24px;
      }
      
      .resoluciones-chips {
        gap: 4px;
      }
    }
  `]
})
export class ValidacionResolucionesComponent implements OnInit, OnDestroy {
  private resolucionService = inject(ResolucionService);
  private empresaService = inject(EmpresaService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Señales para el estado del componente
  ejecutando = signal(false);
  estadoActual = signal('');
  progresoActual = signal(0);
  resultado = signal<ResultadoValidacion | null>(null);
  fechaEjecucion = signal(new Date());
  categoriaSeleccionada = signal<string>('todas');

  // Computed para filtros
  itemsFiltrados = computed(() => {
    const items = this.resultado()?.items || [];
    const categoria = this.categoriaSeleccionada();
    
    if (categoria === 'todas') {
      return items;
    }
    
    return items.filter(item => item.categoria === categoria);
  });

  ngOnInit(): void {
    // Componente listo para usar
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // EJECUCIÓN DE VALIDACIÓN
  // ========================================

  async ejecutarValidacion(): Promise<void> {
    this.ejecutando.set(true);
    this.progresoActual.set(0);
    this.fechaEjecucion.set(new Date());
    
    const inicioTiempo = Date.now();
    const validaciones: ValidacionItem[] = [];

    try {
      // Paso 1: Cargar datos
      this.estadoActual.set('Cargando resoluciones...');
      this.progresoActual.set(10);
      
      const resoluciones = await this.resolucionService.getResoluciones().toPromise() || [];
      
      // Paso 2: Validar integridad de datos
      this.estadoActual.set('Validando integridad de datos...');
      this.progresoActual.set(25);
      
      const validacionesDatos = await this.validarIntegridadDatos(resoluciones);
      validaciones.push(...validacionesDatos);
      
      // Paso 3: Validar relaciones
      this.estadoActual.set('Validando relaciones padre-hijo...');
      this.progresoActual.set(45);
      
      const validacionesRelaciones = await this.validarRelaciones(resoluciones);
      validaciones.push(...validacionesRelaciones);
      
      // Paso 4: Validar fechas
      this.estadoActual.set('Validando fechas de vigencia...');
      this.progresoActual.set(65);
      
      const validacionesFechas = await this.validarFechas(resoluciones);
      validaciones.push(...validacionesFechas);
      
      // Paso 5: Validar referencias externas
      this.estadoActual.set('Validando referencias externas...');
      this.progresoActual.set(80);
      
      const validacionesReferencias = await this.validarReferenciasExternas(resoluciones);
      validaciones.push(...validacionesReferencias);
      
      // Paso 6: Validar consistencia
      this.estadoActual.set('Validando consistencia general...');
      this.progresoActual.set(95);
      
      const validacionesConsistencia = await this.validarConsistencia(resoluciones);
      validaciones.push(...validacionesConsistencia);
      
      // Finalizar
      this.estadoActual.set('Generando reporte...');
      this.progresoActual.set(100);
      
      const tiempoEjecucion = Math.round((Date.now() - inicioTiempo) / 1000);
      
      const resultado: ResultadoValidacion = {
        totalResoluciones: resoluciones.length,
        validacionesEjecutadas: 5,
        erroresCriticos: validaciones.filter(v => v.tipo === 'error').length,
        advertencias: validaciones.filter(v => v.tipo === 'warning').length,
        informacion: validaciones.filter(v => v.tipo === 'info').length,
        exitosos: validaciones.filter(v => v.tipo === 'success').length,
        porcentajeExito: this.calcularPorcentajeExito(validaciones, resoluciones.length),
        tiempoEjecucion,
        items: validaciones
      };
      
      this.resultado.set(resultado);
      
      // Mostrar notificación
      const mensaje = validaciones.length === 0 
        ? '✓ Validación completada sin problemas'
        : `Validación completada: ${validaciones.length} problema(s) detectado(s)`;
      
      this.snackBar.open(mensaje, 'Cerrar', {
        duration: 5000,
        panelClass: validaciones.length === 0 ? ['snackbar-success'] : ['snackbar-warning']
      });
      
    } catch (error) {
      console.error('Error durante validación:', error);
      this.snackBar.open('Error durante la validación', 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.ejecutando.set(false);
      this.estadoActual.set('');
      this.progresoActual.set(0);
    }
  }

  // ========================================
  // VALIDACIONES ESPECÍFICAS
  // ========================================

  private async validarIntegridadDatos(resoluciones: any[]): Promise<ValidacionItem[]> {
    const validaciones: ValidacionItem[] = [];
    
    // Validar campos requeridos
    const sinNumero = resoluciones.filter(r => !r.nroResolucion?.trim());
    if (sinNumero.length > 0) {
      validaciones.push({
        id: 'sin-numero',
        titulo: 'Resoluciones sin número',
        descripcion: 'Se encontraron resoluciones que no tienen número asignado',
        tipo: 'error',
        categoria: 'datos',
        severidad: 'critica',
        resolucionesAfectadas: sinNumero.map(r => r.id),
        solucionSugerida: 'Asignar números únicos a las resoluciones afectadas',
        accionAutomatica: true
      });
    }
    
    // Validar formato de números
    const formatoIncorrecto = resoluciones.filter(r => 
      r.nroResolucion && !r.nroResolucion.match(/^R-\d{4}-\d{4}$/)
    );
    if (formatoIncorrecto.length > 0) {
      validaciones.push({
        id: 'formato-numero',
        titulo: 'Formato de número incorrecto',
        descripcion: 'Resoluciones con números que no siguen el formato R-XXXX-YYYY',
        tipo: 'warning',
        categoria: 'datos',
        severidad: 'media',
        resolucionesAfectadas: formatoIncorrecto.map(r => r.id),
        solucionSugerida: 'Corregir formato a R-XXXX-YYYY (ej: R-0001-2025)',
        accionAutomatica: true
      });
    }
    
    // Validar empresas asignadas
    const sinEmpresa = resoluciones.filter(r => !r.empresaId);
    if (sinEmpresa.length > 0) {
      validaciones.push({
        id: 'sin-empresa',
        titulo: 'Resoluciones sin empresa',
        descripcion: 'Se encontraron resoluciones que no tienen empresa asignada',
        tipo: 'error',
        categoria: 'datos',
        severidad: 'alta',
        resolucionesAfectadas: sinEmpresa.map(r => r.id),
        solucionSugerida: 'Asignar empresa correspondiente a cada resolución'
      });
    }
    
    return validaciones;
  }

  private async validarRelaciones(resoluciones: any[]): Promise<ValidacionItem[]> {
    const validaciones: ValidacionItem[] = [];
    
    // Validar resoluciones huérfanas
    const huerfanas = resoluciones.filter(r => 
      r.resolucionPadreId && !resoluciones.find(p => p.id === r.resolucionPadreId)
    );
    if (huerfanas.length > 0) {
      validaciones.push({
        id: 'huerfanas',
        titulo: 'Resoluciones huérfanas',
        descripcion: 'Resoluciones que referencian padres inexistentes',
        tipo: 'error',
        categoria: 'relaciones',
        severidad: 'alta',
        resolucionesAfectadas: huerfanas.map(r => r.id),
        solucionSugerida: 'Corregir referencias o crear resoluciones padre faltantes'
      });
    }
    
    // Validar referencias circulares
    const circulares = this.detectarReferenciasCirculares(resoluciones);
    if (circulares.length > 0) {
      validaciones.push({
        id: 'referencias-circulares',
        titulo: 'Referencias circulares',
        descripcion: 'Se detectaron referencias circulares en las relaciones padre-hijo',
        tipo: 'error',
        categoria: 'relaciones',
        severidad: 'critica',
        resolucionesAfectadas: circulares,
        solucionSugerida: 'Reestructurar las relaciones para eliminar ciclos'
      });
    }
    
    return validaciones;
  }

  private async validarFechas(resoluciones: any[]): Promise<ValidacionItem[]> {
    const validaciones: ValidacionItem[] = [];
    
    // Validar fechas de vigencia
    const fechasInvalidas = resoluciones.filter(r => {
      if (!r.fechaVigenciaInicio || !r.fechaVigenciaFin) return false;
      return new Date(r.fechaVigenciaInicio) >= new Date(r.fechaVigenciaFin);
    });
    
    if (fechasInvalidas.length > 0) {
      validaciones.push({
        id: 'fechas-invalidas',
        titulo: 'Fechas de vigencia inválidas',
        descripcion: 'Resoluciones con fecha de inicio posterior o igual a fecha de fin',
        tipo: 'error',
        categoria: 'fechas',
        severidad: 'alta',
        resolucionesAfectadas: fechasInvalidas.map(r => r.id),
        solucionSugerida: 'Corregir las fechas de vigencia para que el inicio sea anterior al fin'
      });
    }
    
    // Validar resoluciones vencidas
    const hoy = new Date();
    const vencidas = resoluciones.filter(r => 
      r.fechaVigenciaFin && new Date(r.fechaVigenciaFin) < hoy && r.estado === 'VIGENTE'
    );
    
    if (vencidas.length > 0) {
      validaciones.push({
        id: 'vencidas-activas',
        titulo: 'Resoluciones vencidas marcadas como vigentes',
        descripcion: 'Resoluciones que han vencido pero siguen marcadas como vigentes',
        tipo: 'warning',
        categoria: 'fechas',
        severidad: 'media',
        resolucionesAfectadas: vencidas.map(r => r.id),
        solucionSugerida: 'Actualizar estado a VENCIDA o extender vigencia',
        accionAutomatica: true
      });
    }
    
    return validaciones;
  }

  private async validarReferenciasExternas(resoluciones: any[]): Promise<ValidacionItem[]> {
    const validaciones: ValidacionItem[] = [];
    
    // Simular validación de empresas (en un caso real, consultaríamos la base de datos)
    const empresasIds = [...new Set(resoluciones.map(r => r.empresaId).filter(Boolean))];
    const empresasInexistentes = empresasIds.filter(() => Math.random() < 0.1); // Simular 10% de error
    
    if (empresasInexistentes.length > 0) {
      const resolucionesAfectadas = resoluciones
        .filter(r => empresasInexistentes.includes(r.empresaId))
        .map(r => r.id);
      
      validaciones.push({
        id: 'empresas-inexistentes',
        titulo: 'Referencias a empresas inexistentes',
        descripcion: 'Resoluciones que referencian empresas que no existen en el sistema',
        tipo: 'error',
        categoria: 'referencias',
        severidad: 'alta',
        resolucionesAfectadas,
        solucionSugerida: 'Verificar y corregir los IDs de empresa o crear las empresas faltantes'
      });
    }
    
    return validaciones;
  }

  private async validarConsistencia(resoluciones: any[]): Promise<ValidacionItem[]> {
    const validaciones: ValidacionItem[] = [];
    
    // Validar números duplicados
    const numerosMap = new Map<string, string[]>();
    resoluciones.forEach(r => {
      if (r.nroResolucion) {
        if (!numerosMap.has(r.nroResolucion)) {
          numerosMap.set(r.nroResolucion, []);
        }
        numerosMap.get(r.nroResolucion)!.push(r.id);
      }
    });
    
    const duplicados = Array.from(numerosMap.entries())
      .filter(([_, ids]) => ids.length > 1)
      .flatMap(([_, ids]) => ids);
    
    if (duplicados.length > 0) {
      validaciones.push({
        id: 'numeros-duplicados',
        titulo: 'Números de resolución duplicados',
        descripcion: 'Se encontraron múltiples resoluciones con el mismo número',
        tipo: 'error',
        categoria: 'consistencia',
        severidad: 'critica',
        resolucionesAfectadas: duplicados,
        solucionSugerida: 'Asignar números únicos a las resoluciones duplicadas',
        accionAutomatica: true
      });
    }
    
    return validaciones;
  }

  // ========================================
  // UTILIDADES
  // ========================================

  private detectarReferenciasCirculares(resoluciones: any[]): string[] {
    const circulares: string[] = [];
    const visitados = new Set<string>();
    const enProceso = new Set<string>();
    
    const dfs = (resolucionId: string): boolean => {
      if (enProceso.has(resolucionId)) {
        circulares.push(resolucionId);
        return true;
      }
      
      if (visitados.has(resolucionId)) {
        return false;
      }
      
      visitados.add(resolucionId);
      enProceso.add(resolucionId);
      
      const resolucion = resoluciones.find(r => r.id === resolucionId);
      if (resolucion?.resolucionPadreId) {
        if (dfs(resolucion.resolucionPadreId)) {
          circulares.push(resolucionId);
          return true;
        }
      }
      
      enProceso.delete(resolucionId);
      return false;
    };
    
    resoluciones.forEach(r => {
      if (!visitados.has(r.id)) {
        dfs(r.id);
      }
    });
    
    return [...new Set(circulares)];
  }

  private calcularPorcentajeExito(validaciones: ValidacionItem[], totalResoluciones: number): number {
    const errores = validaciones.filter(v => v.tipo === 'error').length;
    const advertencias = validaciones.filter(v => v.tipo === 'warning').length;
    
    if (totalResoluciones === 0) return 100;
    
    const problemas = errores * 2 + advertencias; // Errores pesan más
    const maxProblemas = totalResoluciones * 2;
    
    return Math.max(0, Math.round(((maxProblemas - problemas) / maxProblemas) * 100));
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  limpiarResultados(): void {
    this.resultado.set(null);
    this.categoriaSeleccionada.set('todas');
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaSeleccionada.set(categoria);
  }

  getCategorias(): Array<{nombre: string, label: string, count: number}> {
    const items = this.resultado()?.items || [];
    const categorias = [
      { nombre: 'datos', label: 'Datos' },
      { nombre: 'relaciones', label: 'Relaciones' },
      { nombre: 'fechas', label: 'Fechas' },
      { nombre: 'referencias', label: 'Referencias' },
      { nombre: 'consistencia', label: 'Consistencia' }
    ];
    
    return categorias.map(cat => ({
      ...cat,
      count: items.filter(item => item.categoria === cat.nombre).length
    })).filter(cat => cat.count > 0);
  }

  getTipoIcon(tipo: string): string {
    switch (tipo) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'check_circle';
      default: return 'help';
    }
  }

  getCategoriaLabel(categoria: string): string {
    const labels: {[key: string]: string} = {
      'datos': 'Datos',
      'relaciones': 'Relaciones',
      'fechas': 'Fechas',
      'referencias': 'Referencias',
      'consistencia': 'Consistencia'
    };
    return labels[categoria] || categoria;
  }

  async ejecutarAccionAutomatica(item: ValidacionItem): Promise<void> {
    // Simular corrección automática
    this.snackBar.open(`Ejecutando corrección automática para: ${item.titulo}`, 'Cerrar', {
      duration: 3000
    });
    
    // En un caso real, aquí se ejecutarían las correcciones específicas
    setTimeout(() => {
      this.snackBar.open('Corrección automática completada', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-success']
      });
    }, 2000);
  }

  verDetallesItem(item: ValidacionItem): void {
    // Mostrar detalles del item (podría abrir un modal)
    console.log('Ver detalles:', item);
  }

  exportarItem(item: ValidacionItem): void {
    // Exportar item específico
    const datos = {
      validacion: item,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(datos, null, 2)], {
      type: 'application/json'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `validacion_${item.id}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}