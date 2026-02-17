import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, combineLatest, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { ResolucionService } from '../../services/resolucion.service';
import { ResolucionesTableService } from '../../services/resoluciones-table.service';
import { 
  ResolucionConEmpresa, 
  ResolucionFiltros, 
  ResolucionTableConfig,
  RESOLUCION_TABLE_CONFIG_DEFAULT 
} from '../../models/resolucion-table.model';
import { ResolucionesFiltersMinimalComponent } from '../../shared/resoluciones-filters-minimal.component';
import { ResolucionesTableComponent, AccionTabla } from '../../shared/resoluciones-table.component';
import { SmartIconComponent } from '../../shared/smart-icon.component';

/**
 * Componente de resoluciones con FILTRO MINIMALISTA pero TABLA COMPLETA
 */
@Component({
  selector: 'app-resoluciones-minimal',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    ResolucionesFiltersMinimalComponent,
    ResolucionesTableComponent,
    SmartIconComponent
  ],
  template: `
    <div class="resoluciones-container">
      
      <!-- Header de la página -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-title">
            <app-smart-icon iconName="description" [size]="32"></app-smart-icon>
            <div class="title-text">
              <h1>Gestión de Resoluciones</h1>
              <p class="header-subtitle">Administración avanzada de resoluciones autorizadas</p>
            </div>
          </div>
          
          @if (estadisticas()) {
            <div class="stats-summary">
              <div class="stat-item">
                <span class="stat-number">{{ estadisticas()?.total || 0 }}</span>
                <span class="stat-label">Total</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ getEstadisticaPorEstado('VIGENTE') }}</span>
                <span class="stat-label">Vigentes</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ getEstadisticaPorTipo('PRIMIGENIA') }}</span>
                <span class="stat-label">Primigenias</span>
              </div>
            </div>
          }
        </div>
        
        <div class="header-actions">
          <button mat-stroked-button (click)="verResolucionesEliminadas()" class="deleted-btn">
            <app-smart-icon iconName="restore_from_trash" [size]="20"></app-smart-icon>
            Eliminadas
          </button>
          
          <button mat-stroked-button (click)="exportarResoluciones()" class="export-btn">
            <app-smart-icon iconName="file_download" [size]="20"></app-smart-icon>
            Exportar
          </button>
          
          <button mat-raised-button color="accent" (click)="cargaMasivaResoluciones()" class="bulk-upload-btn">
            <app-smart-icon iconName="upload_file" [size]="20"></app-smart-icon>
            Carga Masiva
          </button>

          <button mat-raised-button color="warn" (click)="cargaMasivaResolucionesPadres()" class="bulk-upload-padres-btn">
            <app-smart-icon iconName="upload" [size]="20"></app-smart-icon>
            Carga Padres
          </button>
          
          <button mat-raised-button color="primary" (click)="nuevaResolucion()" class="new-resolution-btn">
            <app-smart-icon iconName="add_circle" [size]="20"></app-smart-icon>
            Nueva Resolución
          </button>
        </div>
      </div>

      <!-- Filtros MINIMALISTAS (solo búsqueda y estado) -->
      <app-resoluciones-filters-minimal
        [filtros]="filtrosActuales()"
        (filtrosChange)="onFiltrosChange($event)">
      </app-resoluciones-filters-minimal>

      <!-- Contador de resultados -->
      @if (tieneFiltrosActivos() && !isLoading()) {
        <div class="results-counter">
          <app-smart-icon iconName="filter_list" [size]="20"></app-smart-icon>
          <span class="counter-text">
            <strong>{{ (resolucionesFiltradas())?.length || 0 }}</strong> 
            {{ resolucionesFiltradas().length === 1 ? 'resultado encontrado' : 'resultados encontrados' }}
          </span>
          @if (resolucionesFiltradas().length !== resoluciones().length) {
            <span class="total-text">de {{ (resoluciones())?.length || 0 }} total</span>
          }
        </div>
      }

      <!-- Tabla COMPLETA de resoluciones (todas las funcionalidades) -->
      <app-resoluciones-table
        [resoluciones]="resolucionesFiltradas()"
        [configuracion]="configuracionTabla()"
        [cargando]="isLoading()"
        [seleccionMultiple]="true"
        (configuracionChange)="onConfiguracionChange($event)"
        (accionEjecutada)="onAccionEjecutada($event)">
      </app-resoluciones-table>

      <!-- Estado vacío inicial -->
      @if (!isLoading() && resoluciones().length === 0 && !tieneFiltrosActivos()) {
        <div class="empty-state">
          <app-smart-icon iconName="description" [size]="64"></app-smart-icon>
          <h3>No hay resoluciones registradas</h3>
          <p>Comienza agregando la primera resolución al sistema</p>
          <button mat-raised-button color="primary" (click)="nuevaResolucion()" class="first-resolution-btn">
            <app-smart-icon iconName="add_circle" [size]="20"></app-smart-icon>
            Agregar Primera Resolución
          </button>
        </div>
      }

      <!-- Estado sin resultados con filtros -->
      @if (!isLoading() && resolucionesFiltradas().length === 0 && tieneFiltrosActivos()) {
        <div class="no-results-state">
          <app-smart-icon iconName="search_off" [size]="64"></app-smart-icon>
          <h3>No se encontraron resultados</h3>
          <p>No hay resoluciones que coincidan con los filtros aplicados</p>
          <div class="no-results-actions">
            <button mat-stroked-button (click)="onLimpiarFiltros()">
              <app-smart-icon iconName="clear_all" [size]="20"></app-smart-icon>
              Limpiar Filtros
            </button>
            <button mat-raised-button color="primary" (click)="nuevaResolucion()">
              <app-smart-icon iconName="add_circle" [size]="20"></app-smart-icon>
              Nueva Resolución
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .resoluciones-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      color: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }

    .header-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 24px;
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
      font-weight: 400;
    }

    .stats-summary {
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
      align-items: flex-start;
    }

    .header-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .export-btn {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .export-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .deleted-btn {
      background-color: rgba(255, 152, 0, 0.1);
      color: white;
      border: 1px solid rgba(255, 152, 0, 0.3);
    }

    .deleted-btn:hover {
      background-color: rgba(255, 152, 0, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 152, 0, 0.3);
    }

    .bulk-upload-btn {
      background-color: #ff6b6b;
      color: white;
    }

    .bulk-upload-btn:hover {
      background-color: #ff5252;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
    }

    .new-resolution-btn {
      background-color: #4ecdc4;
      color: white;
    }

    .new-resolution-btn:hover {
      background-color: #26d0ce;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);
    }

    .results-counter {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .counter-text {
      font-size: 16px;
      font-weight: 500;
    }

    .counter-text strong {
      font-size: 20px;
      font-weight: 700;
    }

    .total-text {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      margin-left: 8px;
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

    .first-resolution-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 32px;
      font-weight: 600;
      font-size: 16px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .first-resolution-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(25, 118, 210, 0.3);
    }

    .no-results-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      text-align: center;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .no-results-state h3 {
      margin: 16px 0 8px 0;
      color: #2c3e50;
      font-weight: 600;
      font-size: 24px;
    }

    .no-results-state p {
      margin: 0 0 32px 0;
      color: #6c757d;
      font-size: 16px;
      max-width: 400px;
    }

    .no-results-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .no-results-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .no-results-actions button:hover {
      transform: translateY(-2px);
    }

    /* Responsive design */
    @media (max-width: 1024px) {
      .resoluciones-container {
        padding: 16px;
      }
      
      .page-header {
        padding: 24px;
      }
      
      .stats-summary {
        gap: 24px;
      }
      
      .stat-number {
        font-size: 24px;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 24px;
        text-align: center;
      }

      .header-title {
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .title-text h1 {
        font-size: 28px;
      }

      .stats-summary {
        justify-content: center;
        gap: 20px;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
      }

      .header-actions button {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .resoluciones-container {
        padding: 12px;
        gap: 16px;
      }
      
      .page-header {
        padding: 20px;
      }
      
      .title-text h1 {
        font-size: 24px;
      }
      
      .stats-summary {
        gap: 16px;
      }
      
      .stat-number {
        font-size: 20px;
      }
    }
  `]
})
export class ResolucionesMinimalComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private resolucionService = inject(ResolucionService);
  private tableService = inject(ResolucionesTableService);
  private destroy$ = new Subject<void>();

  // Señales para el estado del componente
  resoluciones = signal<ResolucionConEmpresa[]>([]);
  resolucionesFiltradas = signal<ResolucionConEmpresa[]>([]);
  isLoading = signal(false);
  filtrosActuales = signal<ResolucionFiltros>({});
  configuracionTabla = signal<ResolucionTableConfig>(RESOLUCION_TABLE_CONFIG_DEFAULT);
  estadisticas = signal<any>(null);

  ngOnInit(): void {
    this.inicializarComponente();
    this.configurarSuscripciones();
    // Cargar filtros desde URL (esto disparará la carga de datos a través de filtros$)
    this.cargarFiltrosDesdeURL();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  private inicializarComponente(): void {
    // Limpiar filtros al inicio
    this.tableService.limpiarFiltros();
    
    // Cargar configuración inicial de la tabla
    const configInicial = this.tableService.getConfiguracion();
    this.configuracionTabla.set(configInicial);
    
    // NO cargar filtros desde URL aquí, se hará en configurarSuscripciones
  }

  private cargarFiltrosDesdeURL(): void {
    // Leer los parámetros de la URL UNA SOLA VEZ (no suscribirse)
    const params = this.route.snapshot.queryParams;
    const filtrosURL: ResolucionFiltros = {};
    
    // Usar formato del frontend (numeroResolucion, estados)
    if (params['numeroResolucion']) {
      filtrosURL.numeroResolucion = params['numeroResolucion'];
    }
    if (params['estados']) {
      filtrosURL.estados = Array.isArray(params['estados']) 
        ? params['estados'] 
        : [params['estados']];
    }
    
    // Si hay filtros en la URL, aplicarlos
    if (Object.keys(filtrosURL).length > 0) {
      this.filtrosActuales.set(filtrosURL);
      this.tableService.actualizarFiltros(filtrosURL);
    } else {
      // Si no hay filtros en URL, disparar la carga inicial con filtros vacíos
      this.tableService.actualizarFiltros({});
    }
  }

  private configurarSuscripciones(): void {
    // Suscribirse SOLO a cambios en filtros (no en toda la config)
    // IMPORTANTE: Esta es la ÚNICA suscripción que carga datos
    this.tableService.filtros$.pipe(
      debounceTime(300),
      // REMOVIDO distinctUntilChanged para permitir recargas con filtros vacíos
      takeUntil(this.destroy$)
    ).subscribe(filtros => {
      console.log('🔄 Filtros cambiaron, recargando datos:', filtros);
      this.filtrosActuales.set(filtros);
      this.actualizarURLParams(filtros);
      this.cargarResoluciones();
    });
    
    // Suscribirse a cambios en config SOLO para actualizar el signal local
    // NO recargar datos cuando cambia el ordenamiento
    this.tableService.config$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(config => {
      this.configuracionTabla.set(config);
    });
  }

  private actualizarURLParams(filtros: ResolucionFiltros): void {
    const queryParams: any = {};
    
    // Usar formato del frontend
    if (filtros.numeroResolucion) {
      queryParams.numeroResolucion = filtros.numeroResolucion;
    }
    if (filtros.estados && filtros.estados.length > 0) {
      queryParams.estados = filtros.estados;
    }
    
    // Actualizar URL sin recargar la página
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  // ========================================
  // CARGA DE DATOS
  // ========================================

  private cargarResoluciones(): void {
    this.isLoading.set(true);
    this.tableService.cargando.set(true);

    // Usar siempre getResolucionesFiltradas para tener datos consistentes
    const filtros = this.filtrosActuales();
    
    this.resolucionService.getResolucionesFiltradas(filtros).subscribe({
      next: (resoluciones) => {
        console.log('📥 Resoluciones cargadas:', resoluciones.length);
        console.log('📊 Primeras 3 con años:', resoluciones.slice(0, 3).map(r => ({
          numero: r.nroResolucion,
          anios: r.aniosVigencia
        })));
        
        this.resoluciones.set(resoluciones);
        this.resolucionesFiltradas.set(resoluciones);
        this.tableService.totalResultados.set(resoluciones.length);
        // TODO: Optimizar cargarEstadisticas para que no haga otra petición al servidor
        // this.cargarEstadisticas();
        this.isLoading.set(false);
        this.tableService.cargando.set(false);
        
        // Feedback visual de carga exitosa
        if (resoluciones.length > 0) {
          this.mostrarNotificacion(`✓ ${resoluciones.length} resoluciones cargadas`, 'success');
        }
      },
      error: (error) => {
        console.error('❌ Error loading resoluciones::', error);
        this.isLoading.set(false);
        this.tableService.cargando.set(false);
        this.mostrarNotificacion('Error al cargar las resoluciones. Por favor, intenta nuevamente.', 'error');
      }
    });
  }

  private cargarEstadisticas(): void {
    const filtros = this.filtrosActuales();
    
    this.resolucionService.getEstadisticasFiltros(filtros).subscribe({
      next: (stats) => {
        // console.log removed for production
        this.estadisticas.set(stats);
      },
      error: (error) => {
        console.error('❌ Error al cargar estadísticas::', error);
      }
    });
  }

  // ========================================
  // EVENT HANDLERS - FILTROS
  // ========================================

  onFiltrosChange(filtros: ResolucionFiltros): void {
    console.log('🔄 onFiltrosChange recibido:', filtros);
    // Actualizar filtros en el servicio
    this.tableService.actualizarFiltros(filtros);
  }

  onLimpiarFiltros(): void {
    console.log('🧹 Limpiando filtros...');
    // Actualizar el signal local primero para que el componente de filtros lo detecte
    this.filtrosActuales.set({});
    // Limpiar filtros en el servicio - esto disparará la suscripción
    this.tableService.limpiarFiltros();
  }

  // ========================================
  // EVENT HANDLERS - TABLA
  // ========================================

  onConfiguracionChange(cambios: Partial<ResolucionTableConfig>): void {
    // console.log removed for production
    this.tableService.actualizarConfiguracion(cambios);
  }

  onAccionEjecutada(accion: AccionTabla): void {
    // console.log removed for production
    
    switch (accion.accion) {
      case 'ver':
        if (accion.resolucion) {
          this.verResolucion(accion.resolucion.id);
        }
        break;
        
      case 'editar':
        if (accion.resolucion) {
          this.editarResolucion(accion.resolucion.id);
        }
        break;
        
      case 'eliminar':
        if (accion.resoluciones && accion.resoluciones.length > 1) {
          // Eliminación en lote
          this.eliminarResolucionesEnLote(accion.resoluciones);
        } else if (accion.resolucion) {
          // Eliminación individual
          this.eliminarResolucion(accion.resolucion.id);
        } else if (accion.resoluciones && accion.resoluciones.length === 1) {
          // Eliminación individual desde selección
          this.eliminarResolucion(accion.resoluciones[0].id);
        }
        break;
        
      case 'exportar':
        if (accion.resoluciones) {
          this.exportarResoluciones(accion.resoluciones);
        } else {
          this.exportarResoluciones();
        }
        break;
    }
  }

  // ========================================
  // ACCIONES DE NAVEGACIÓN
  // ========================================

  nuevaResolucion(): void {
    this.router.navigate(['/resoluciones/nuevo']);
  }

  cargaMasivaResoluciones(): void {
    this.router.navigate(['/resoluciones/carga-masiva']);
  }

  cargaMasivaResolucionesPadres(): void {
    this.router.navigate(['/resoluciones/carga-masiva-padres']);
  }

  verResolucionesEliminadas(): void {
    // Crear un diálogo simple para mostrar resoluciones eliminadas
    this.mostrarDialogoResolucionesEliminadas();
  }

  verResolucion(id: string): void {
    this.router.navigate(['/resoluciones', id]);
  }

  editarResolucion(id: string): void {
    this.router.navigate(['/resoluciones', id, 'editar']);
  }

  eliminarResolucion(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta resolución? Esta acción no se puede deshacer.')) {
      this.resolucionService.deleteResolucion(id).subscribe({
        next: () => {
          this.mostrarNotificacion('✓ Resolución eliminada exitosamente', 'success');
          this.cargarResoluciones();
        },
        error: (error) => {
          console.error('Error deleting resolucion::', error);
          this.mostrarNotificacion('Error al eliminar la resolución. Por favor, intenta nuevamente.', 'error');
        }
      });
    }
  }

  eliminarResolucionesEnLote(resoluciones: ResolucionConEmpresa[]): void {
    if (resoluciones.length === 0) {
      this.mostrarNotificacion('No hay resoluciones seleccionadas para eliminar', 'error');
      return;
    }

    const mensaje = `Se eliminarán ${resoluciones.length} resoluciones:\n\n${resoluciones.map(r => `• ${r.nroResolucion} - ${r.empresa?.razonSocial?.principal || 'Sin empresa'}`).join('\n')}\n\n⚠️ Esta acción se puede deshacer en los próximos 30 días.`;
    
    if (confirm(mensaje)) {
      // Mostrar progreso
      this.mostrarNotificacion(`Eliminando ${resoluciones.length} resoluciones...`, 'info');
      
      // Crear array de observables para eliminar todas las resoluciones
      const eliminaciones = resoluciones.map(resolucion => 
        this.resolucionService.deleteResolucion(resolucion.id)
      );

      // Usar forkJoin para ejecutar todas las eliminaciones en paralelo
      forkJoin(eliminaciones).subscribe({
        next: (resultados) => {
          const exitosas = resultados.length;
          
          // Mostrar notificación con opción de deshacer
          this.mostrarNotificacionConDeshacer(
            `✓ ${exitosas} resoluciones eliminadas exitosamente`,
            'success',
            resoluciones.map(r => r.id)
          );
          
          this.cargarResoluciones();
        },
        error: (error) => {
          console.error('Error eliminando resoluciones en lote::', error);
          this.mostrarNotificacion('Error al eliminar algunas resoluciones. Por favor, verifica e intenta nuevamente.', 'error');
          // Recargar para mostrar el estado actual
          this.cargarResoluciones();
        }
      });
    }
  }

  /**
   * Mostrar notificación con opción de deshacer eliminación
   */
  private mostrarNotificacionConDeshacer(mensaje: string, tipo: 'success' | 'error' | 'info', resolucionesIds: string[]): void {
    const config: any = {
      duration: 10000, // 10 segundos para dar tiempo a deshacer
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-success']
    };

    const snackBarRef = this.snackBar.open(mensaje, 'DESHACER', config);
    
    // Manejar clic en "DESHACER"
    snackBarRef.onAction().subscribe(() => {
      this.deshacerEliminacion(resolucionesIds);
    });
  }

  /**
   * Deshacer eliminación de resoluciones
   */
  private deshacerEliminacion(resolucionesIds: string[]): void {
    this.mostrarNotificacion('Restaurando resoluciones...', 'info');
    
    this.resolucionService.restoreResolucionesMultiples(resolucionesIds).subscribe({
      next: (resultado) => {
        const restauradas = resultado.total_exitosas || 0;
        this.mostrarNotificacion(`✓ ${restauradas} resoluciones restauradas exitosamente`, 'success');
        this.cargarResoluciones();
      },
      error: (error) => {
        console.error('Error restaurando resoluciones::', error);
        this.mostrarNotificacion('Error al restaurar las resoluciones. Puedes intentar desde el menú de resoluciones eliminadas.', 'error');
      }
    });
  }

  /**
   * Mostrar diálogo con resoluciones eliminadas
   */
  private mostrarDialogoResolucionesEliminadas(): void {
    this.resolucionService.getResolucionesEliminadas().subscribe({
      next: (resolucionesEliminadas) => {
        if (resolucionesEliminadas.length === 0) {
          this.mostrarNotificacion('No hay resoluciones eliminadas recientemente', 'info');
          return;
        }

        // Crear mensaje con lista de resoluciones eliminadas
        const mensaje = `Resoluciones eliminadas (últimos 30 días):\n\n${resolucionesEliminadas.map((r, index) => {
          const fechaEliminacion = r.fechaEliminacion ? new Date(r.fechaEliminacion).toLocaleDateString('es-PE') : 'Fecha desconocida';
          return `${index + 1}. ${r.nroResolucion} - Eliminada: ${fechaEliminacion}`;
        }).join('\n')}\n\n¿Deseas restaurar alguna de estas resoluciones?`;

        if (confirm(mensaje)) {
          // Mostrar opciones de restauración
          this.mostrarOpcionesRestauracion(resolucionesEliminadas);
        }
      },
      error: (error) => {
        console.error('Error obteniendo resoluciones eliminadas::', error);
        this.mostrarNotificacion('Error al obtener resoluciones eliminadas', 'error');
      }
    });
  }

  /**
   * Mostrar opciones de restauración
   */
  private mostrarOpcionesRestauracion(resolucionesEliminadas: any[]): void {
    // Crear lista de opciones
    const opciones = resolucionesEliminadas.map((r, index) => 
      `${index + 1}. ${r.nroResolucion}`
    ).join('\n');

    const seleccion = prompt(`Selecciona las resoluciones a restaurar (números separados por comas):\n\n${opciones}\n\nEjemplo: 1,3,5 para restaurar las resoluciones 1, 3 y 5:`);

    if (seleccion) {
      try {
        const indices = seleccion.split(',').map(s => parseInt(s.trim()) - 1);
        const resolucionesARestaurar = indices
          .filter(i => i >= 0 && i < resolucionesEliminadas.length)
          .map(i => resolucionesEliminadas[i].id);

        if (resolucionesARestaurar.length > 0) {
          this.restaurarResoluciones(resolucionesARestaurar);
        } else {
          this.mostrarNotificacion('Selección inválida', 'error');
        }
      } catch (error) {
        this.mostrarNotificacion('Formato de selección inválido', 'error');
      }
    }
  }

  /**
   * Restaurar resoluciones seleccionadas
   */
  private restaurarResoluciones(resolucionesIds: string[]): void {
    this.mostrarNotificacion(`Restaurando ${resolucionesIds.length} resoluciones...`, 'info');
    
    this.resolucionService.restoreResolucionesMultiples(resolucionesIds).subscribe({
      next: (resultado) => {
        const restauradas = resultado.total_exitosas || 0;
        const errores = resultado.total_errores || 0;
        
        if (errores > 0) {
          this.mostrarNotificacion(`✓ ${restauradas} restauradas, ${errores} errores`, 'info');
        } else {
          this.mostrarNotificacion(`✓ ${restauradas} resoluciones restauradas exitosamente`, 'success');
        }
        
        this.cargarResoluciones();
      },
      error: (error) => {
        console.error('Error restaurando resoluciones::', error);
        this.mostrarNotificacion('Error al restaurar las resoluciones', 'error');
      }
    });
  }

  // ========================================
  // EXPORTACIÓN
  // ========================================

  exportarResoluciones(resoluciones?: ResolucionConEmpresa[]): void {
    // Determinar qué resoluciones exportar
    const resolucionesAExportar = resoluciones || this.resolucionesFiltradas();
    const columnasVisibles = this.configuracionTabla().columnasVisibles;
    
    const mensaje = resoluciones 
      ? `Exportando ${resoluciones.length} resoluciones seleccionadas...`
      : `Exportando ${resolucionesAExportar.length} resoluciones...`;
    
    this.mostrarNotificacion(mensaje, 'info');
    
    this.resolucionService.exportarResolucionesSeleccionadas(resolucionesAExportar, columnasVisibles).subscribe({
      next: (blob) => {
        // Crear y descargar archivo Excel
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resoluciones_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.mostrarNotificacion('✓ Exportación Excel completada exitosamente', 'success');
      },
      error: (error) => {
        console.error('Error al exportar::', error);
        this.mostrarNotificacion('Error al exportar resoluciones. Por favor, intenta nuevamente.', 'error');
      }
    });
  }

  // ========================================
  // NOTIFICACIONES
  // ========================================

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    const config: any = {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    };

    // Configurar estilos según el tipo
    switch (tipo) {
      case 'success':
        config.panelClass = ['snackbar-success'];
        break;
      case 'error':
        config.panelClass = ['snackbar-error'];
        config.duration = 5000; // Más tiempo para errores
        break;
      case 'info':
        config.panelClass = ['snackbar-info'];
        break;
    }

    this.snackBar.open(mensaje, 'Cerrar', config);
  }

  // ========================================
  // UTILIDADES
  // ========================================

  tieneFiltrosActivos(): boolean {
    return this.tableService.tieneFiltrosActivos();
  }

  getEstadisticaPorEstado(estado: string): number {
    const stats = this.estadisticas();
    return stats?.porEstado?.[estado] || 0;
  }

  getEstadisticaPorTipo(tipo: string): number {
    const stats = this.estadisticas();
    return stats?.porTipo?.[tipo] || 0;
  }
}