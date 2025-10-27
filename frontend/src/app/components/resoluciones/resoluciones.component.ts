import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, combineLatest, debounceTime } from 'rxjs';
import { ResolucionService } from '../../services/resolucion.service';
import { ResolucionesTableService } from '../../services/resoluciones-table.service';
import { 
  ResolucionConEmpresa, 
  ResolucionFiltros, 
  ResolucionTableConfig,
  RESOLUCION_TABLE_CONFIG_DEFAULT 
} from '../../models/resolucion-table.model';
import { ResolucionesFiltersComponent } from '../../shared/resoluciones-filters.component';
import { ResolucionesTableComponent, AccionTabla } from '../../shared/resoluciones-table.component';
import { SmartIconComponent } from '../../shared/smart-icon.component';

@Component({
  selector: 'app-resoluciones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ResolucionesFiltersComponent,
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
          <button mat-stroked-button (click)="exportarResoluciones()" class="export-btn">
            <app-smart-icon iconName="file_download" [size]="20"></app-smart-icon>
            Exportar
          </button>
          
          <button mat-raised-button color="accent" (click)="cargaMasivaResoluciones()" class="bulk-upload-btn">
            <app-smart-icon iconName="upload_file" [size]="20"></app-smart-icon>
            Carga Masiva
          </button>
          
          <button mat-raised-button color="primary" (click)="nuevaResolucion()" class="new-resolution-btn">
            <app-smart-icon iconName="add_circle" [size]="20"></app-smart-icon>
            Nueva Resolución
          </button>
        </div>
      </div>

      <!-- Filtros avanzados -->
      <app-resoluciones-filters
        [filtros]="filtrosActuales()"
        [expandidoPorDefecto]="false"
        (filtrosChange)="onFiltrosChange($event)"
        (limpiarFiltros)="onLimpiarFiltros()">
      </app-resoluciones-filters>

      <!-- Tabla avanzada de resoluciones -->
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
export class ResolucionesComponent implements OnInit, OnDestroy {
  private router = inject(Router);
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
    this.cargarDatosIniciales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  private inicializarComponente(): void {
    // Cargar configuración inicial de la tabla
    const configInicial = this.tableService.getConfiguracion();
    this.configuracionTabla.set(configInicial);
    this.filtrosActuales.set(configInicial.filtros);
  }

  private configurarSuscripciones(): void {
    // Suscribirse a cambios en filtros con debounce
    combineLatest([
      this.tableService.filtros$,
      this.tableService.config$
    ]).pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(([filtros, config]) => {
      this.filtrosActuales.set(filtros);
      this.configuracionTabla.set(config);
      this.aplicarFiltrosYCargarDatos();
    });
  }

  private cargarDatosIniciales(): void {
    this.cargarResoluciones();
  }

  // ========================================
  // CARGA DE DATOS
  // ========================================

  private cargarResoluciones(): void {
    this.isLoading.set(true);
    this.tableService.cargando.set(true);

    this.resolucionService.getResolucionesConEmpresa().subscribe({
      next: (resoluciones) => {
        console.log('📋 Resoluciones con empresa cargadas:', resoluciones.length);
        this.resoluciones.set(resoluciones);
        this.aplicarFiltrosYCargarDatos();
        this.cargarEstadisticas();
        this.isLoading.set(false);
        this.tableService.cargando.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading resoluciones:', error);
        this.isLoading.set(false);
        this.tableService.cargando.set(false);
        this.snackBar.open('Error al cargar las resoluciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private aplicarFiltrosYCargarDatos(): void {
    const filtros = this.filtrosActuales();
    
    if (this.tieneFiltrosActivos()) {
      // Aplicar filtros
      this.resolucionService.getResolucionesFiltradas(filtros).subscribe({
        next: (resolucionesFiltradas) => {
          console.log('🔍 Resoluciones filtradas:', resolucionesFiltradas.length);
          this.resolucionesFiltradas.set(resolucionesFiltradas);
          this.tableService.totalResultados.set(resolucionesFiltradas.length);
        },
        error: (error) => {
          console.error('❌ Error al filtrar resoluciones:', error);
          this.resolucionesFiltradas.set([]);
        }
      });
    } else {
      // Sin filtros, mostrar todas
      this.resolucionesFiltradas.set(this.resoluciones());
      this.tableService.totalResultados.set(this.resoluciones().length);
    }
  }

  private cargarEstadisticas(): void {
    const filtros = this.filtrosActuales();
    
    this.resolucionService.getEstadisticasFiltros(filtros).subscribe({
      next: (stats) => {
        console.log('📊 Estadísticas cargadas:', stats);
        this.estadisticas.set(stats);
      },
      error: (error) => {
        console.error('❌ Error al cargar estadísticas:', error);
      }
    });
  }

  // ========================================
  // EVENT HANDLERS - FILTROS
  // ========================================

  onFiltrosChange(filtros: ResolucionFiltros): void {
    console.log('🔍 Filtros cambiados:', filtros);
    this.tableService.actualizarFiltros(filtros);
  }

  onLimpiarFiltros(): void {
    console.log('🧹 Limpiando filtros');
    this.tableService.limpiarFiltros();
  }

  // ========================================
  // EVENT HANDLERS - TABLA
  // ========================================

  onConfiguracionChange(cambios: Partial<ResolucionTableConfig>): void {
    console.log('⚙️ Configuración de tabla cambiada:', cambios);
    this.tableService.actualizarConfiguracion(cambios);
  }

  onAccionEjecutada(accion: AccionTabla): void {
    console.log('🎯 Acción ejecutada:', accion);
    
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
        if (accion.resolucion) {
          this.eliminarResolucion(accion.resolucion.id);
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
          this.snackBar.open('Resolución eliminada exitosamente', 'Cerrar', { duration: 3000 });
          this.cargarResoluciones();
        },
        error: (error) => {
          console.error('Error deleting resolucion:', error);
          this.snackBar.open('Error al eliminar la resolución', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  // ========================================
  // EXPORTACIÓN
  // ========================================

  exportarResoluciones(resoluciones?: ResolucionConEmpresa[]): void {
    const filtros = resoluciones ? {} : this.filtrosActuales();
    const mensaje = resoluciones 
      ? `Exportando ${resoluciones.length} resoluciones seleccionadas...`
      : 'Exportando todas las resoluciones...';
    
    this.snackBar.open(mensaje, 'Cerrar', { duration: 2000 });
    
    this.resolucionService.exportarResoluciones(filtros, 'excel').subscribe({
      next: (blob) => {
        // Crear y descargar archivo
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resoluciones_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('Exportación completada', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error al exportar:', error);
        this.snackBar.open('Error al exportar resoluciones', 'Cerrar', { duration: 3000 });
      }
    });
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