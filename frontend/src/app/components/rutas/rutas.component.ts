import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RutaService } from '../../services/ruta.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { Ruta, EstadoRuta, TipoRuta } from '../../models/ruta.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { map, startWith, catchError, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CrearRutaMejoradoComponent } from './crear-ruta-mejorado.component';
import { DetalleRutaModalComponent } from './detalle-ruta-modal.component';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatChipsModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    MatDialogModule,
  ],
  template: `
    <div class="rutas-container">
      <div class="page-header">
        <div>
          <h1>Gestión de Rutas</h1>
          <p>Administra las rutas de transporte del sistema</p>
        </div>
        <div class="header-actions">
          <!-- Acciones de selección múltiple -->
          @if (rutasSeleccionadas().size > 0) {
            <div class="selection-actions">
              <span class="selection-count">{{ rutasSeleccionadas().size }} seleccionadas</span>
              <button mat-stroked-button 
                      color="warn" 
                      (click)="eliminarSeleccionadas()"
                      matTooltip="Eliminar rutas seleccionadas">
                <mat-icon>delete</mat-icon>
                Eliminar ({{ rutasSeleccionadas().size }})
              </button>
              <button mat-stroked-button 
                      color="primary" 
                      (click)="exportarSeleccionadas()"
                      matTooltip="Exportar rutas seleccionadas">
                <mat-icon>download</mat-icon>
                Exportar ({{ rutasSeleccionadas().size }})
              </button>
              <button mat-button 
                      (click)="limpiarSeleccion()"
                      matTooltip="Limpiar selección">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          }
          
          <!-- Configuración de columnas -->
          <button mat-icon-button 
                  [matMenuTriggerFor]="columnasMenu"
                  matTooltip="Configurar columnas">
            <mat-icon>view_column</mat-icon>
          </button>
          
          <mat-menu #columnasMenu="matMenu" class="columnas-menu">
            <div class="menu-header" (click)="$event.stopPropagation()">
              <h4>Configurar Columnas</h4>
            </div>
            @for (columna of columnasDisponibles; track columna.key) {
              @if (!columna.fixed) {
                <mat-checkbox 
                  class="columna-checkbox"
                  [checked]="columna.visible"
                  (change)="toggleColumna(columna.key, $event.checked)"
                  (click)="$event.stopPropagation()">
                  {{ columna.label }}
                </mat-checkbox>
              }
            }
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="resetearColumnas()">
              <mat-icon>refresh</mat-icon>
              Resetear por defecto
            </button>
          </mat-menu>
          
          <!-- Exportación general -->
          <button mat-icon-button 
                  [matMenuTriggerFor]="exportMenu"
                  matTooltip="Exportar datos">
            <mat-icon>download</mat-icon>
          </button>
          
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportarTodas('excel')">
              <mat-icon>table_chart</mat-icon>
              Exportar a Excel
            </button>
            <button mat-menu-item (click)="exportarTodas('csv')">
              <mat-icon>description</mat-icon>
              Exportar a CSV
            </button>
            <button mat-menu-item (click)="exportarTodas('pdf')">
              <mat-icon>picture_as_pdf</mat-icon>
              Exportar a PDF
            </button>
          </mat-menu>
          
          <button mat-raised-button 
                  color="primary" 
                  (click)="nuevaRuta()">
            <mat-icon>add</mat-icon>
            Nueva Ruta
          </button>
          <button mat-stroked-button 
                  color="accent" 
                  routerLink="/rutas/carga-masiva"
                  matTooltip="Importar múltiples rutas desde Excel">
            <mat-icon>upload</mat-icon>
            Carga Masiva
          </button>
          <button mat-stroked-button 
                  color="accent" 
                  (click)="recargarRutas()"
                  [disabled]="isLoading()">
            <mat-icon>refresh</mat-icon>
            Recargar
          </button>
        </div>
      </div>

      <!-- Filtros Simplificados -->
      <mat-card class="filtros-card">
        <mat-card-content>
          <div class="filtros-grid">
            <!-- Filtro por Empresa -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Filtrar por Empresa</mat-label>
              <mat-select [value]="empresaSeleccionada()" 
                         (selectionChange)="onEmpresaSelected($event.value)">
                <mat-option [value]="null">Todas las empresas</mat-option>
                @for (empresa of empresas(); track empresa.id) {
                  <mat-option [value]="empresa">
                    {{ empresa.ruc }} - {{ empresa.razonSocial?.principal || 'Sin razón social' }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Filtro por Estado -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Filtrar por Estado</mat-label>
              <mat-select [value]="estadoSeleccionado()" 
                         (selectionChange)="onEstadoSelected($event.value)">
                <mat-option [value]="null">Todos los estados</mat-option>
                <mat-option value="ACTIVA">Activa</mat-option>
                <mat-option value="INACTIVA">Inactiva</mat-option>
                <mat-option value="SUSPENDIDA">Suspendida</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="filtros-actions">
              <button mat-button (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Limpiar Filtros
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Información del filtro aplicado -->
      @if (filtroActivo().tipo !== 'todas') {
        <mat-card class="info-card">
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Vista actual:</span>
                <span class="value">{{ filtroActivo().descripcion }}</span>
              </div>
              <div class="info-item">
                <span class="label">Rutas encontradas:</span>
                <span class="value">{{ (rutasFiltradas())?.length || 0 }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Loading -->
      @if (isLoading()) {
        <div class="loading-container">
          <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
          <p>Cargando rutas...</p>
        </div>
      }

      <!-- Tabla de Rutas -->
      @if (!isLoading() && rutasPaginadas().length > 0) {
        <div class="content-section">
          <div class="section-header">
            <h3>{{ filtroActivo().descripcion }}</h3>
            <p class="section-subtitle">
              Mostrando {{ (rutasPaginadas())?.length || 0 }} de {{ (rutasFiltradas())?.length || 0 }} ruta(s)
            </p>
          </div>

          <div class="table-container">
            <table mat-table [dataSource]="rutasPaginadas()" class="rutas-table">
              
              <!-- Columna de selección -->
              <ng-container matColumnDef="select">
                <th mat-header-cell *matHeaderCellDef>
                  <mat-checkbox 
                    [checked]="todasSeleccionadas()"
                    [indeterminate]="rutasSeleccionadas().size > 0 && !todasSeleccionadas()"
                    (change)="toggleTodasSeleccionadas($event.checked)">
                  </mat-checkbox>
                </th>
                <td mat-cell *matCellDef="let ruta">
                  <mat-checkbox 
                    [checked]="rutasSeleccionadas().has(ruta.id)"
                    (change)="toggleRutaSeleccionada(ruta.id, $event.checked)">
                  </mat-checkbox>
                </td>
              </ng-container>
              
              <!-- Empresa -->
              <ng-container matColumnDef="empresa">
                <th mat-header-cell *matHeaderCellDef>Empresa</th>
                <td mat-cell *matCellDef="let ruta">
                  <div class="empresa-info">
                    <span class="empresa-nombre">{{ getEmpresaNombre(ruta) }}</span>
                    <span class="empresa-ruc">{{ ruta.empresa?.ruc || 'Sin RUC' }}</span>
                  </div>
                </td>
              </ng-container>
              
              <!-- RUC -->
              <ng-container matColumnDef="ruc">
                <th mat-header-cell *matHeaderCellDef>RUC</th>
                <td mat-cell *matCellDef="let ruta">
                  <span class="ruc-text">{{ ruta.empresa?.ruc || 'Sin RUC' }}</span>
                </td>
              </ng-container>

              <!-- Resolución -->
              <ng-container matColumnDef="resolucion">
                <th mat-header-cell *matHeaderCellDef>Resolución</th>
                <td mat-cell *matCellDef="let ruta">
                  <span class="resolucion-text">{{ ruta.resolucion?.numero || 'Sin resolución' }}</span>
                </td>
              </ng-container>

              <!-- Código de Ruta -->
              <ng-container matColumnDef="codigoRuta">
                <th mat-header-cell *matHeaderCellDef>Código Ruta</th>
                <td mat-cell *matCellDef="let ruta">
                  <span class="codigo-ruta">{{ ruta.codigoRuta }}</span>
                </td>
              </ng-container>

              <!-- Origen -->
              <ng-container matColumnDef="origen">
                <th mat-header-cell *matHeaderCellDef>Origen</th>
                <td mat-cell *matCellDef="let ruta">{{ ruta.origen?.nombre || ruta.origen }}</td>
              </ng-container>

              <!-- Destino -->
              <ng-container matColumnDef="destino">
                <th mat-header-cell *matHeaderCellDef>Destino</th>
                <td mat-cell *matCellDef="let ruta">{{ ruta.destino?.nombre || ruta.destino }}</td>
              </ng-container>

              <!-- Itinerario -->
              <ng-container matColumnDef="itinerario">
                <th mat-header-cell *matHeaderCellDef>Itinerario</th>
                <td mat-cell *matCellDef="let ruta">
                  <span class="itinerario-text">
                    {{ ruta.descripcion || ruta.nombre || getNombreRuta(ruta) }}
                  </span>
                </td>
              </ng-container>

              <!-- Frecuencias -->
              <ng-container matColumnDef="frecuencias">
                <th mat-header-cell *matHeaderCellDef>Frecuencias</th>
                <td mat-cell *matCellDef="let ruta">
                  <span class="frecuencias-text">{{ ruta.frecuencias || 'Sin frecuencias' }}</span>
                </td>
              </ng-container>

              <!-- Tipo Ruta -->
              <ng-container matColumnDef="tipoRuta">
                <th mat-header-cell *matHeaderCellDef>Tipo Ruta</th>
                <td mat-cell *matCellDef="let ruta">
                  <span class="tipo-ruta-text">{{ ruta.tipoRuta || 'Sin tipo' }}</span>
                </td>
              </ng-container>

              <!-- Tipo Servicio -->
              <ng-container matColumnDef="tipoServicio">
                <th mat-header-cell *matHeaderCellDef>Tipo Servicio</th>
                <td mat-cell *matCellDef="let ruta">
                  <span class="tipo-servicio-text">{{ ruta.tipoServicio || 'Sin tipo servicio' }}</span>
                </td>
              </ng-container>

              <!-- Estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let ruta">
                  <span class="estado-badge" [class.activo]="ruta.estado === 'ACTIVA'">
                    {{ ruta.estado }}
                  </span>
                </td>
              </ng-container>

              <!-- Acciones -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let ruta">
                  <button mat-icon-button 
                          color="accent" 
                          (click)="verDetalleRuta(ruta)"
                          matTooltip="Ver detalles">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="primary" 
                          (click)="editarRuta(ruta)"
                          matTooltip="Editar ruta">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="warn" 
                          (click)="eliminarRuta(ruta)"
                          matTooltip="Eliminar ruta">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns();" 
                  [class.selected-row]="rutasSeleccionadas().has(row.id)"></tr>
            </table>
          </div>

          <!-- Paginador -->
          <mat-paginator 
            [length]="rutasFiltradas().length"
            [pageSize]="pageSize()"
            [pageSizeOptions]="[5, 10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </div>
      }

      <!-- Sin resultados -->
      @if (!isLoading() && rutasFiltradas().length === 0) {
        <div class="no-results">
          <mat-icon>route</mat-icon>
          <h3>No se encontraron rutas</h3>
          <p>No hay rutas que coincidan con los filtros aplicados.</p>
          <button mat-raised-button color="primary" (click)="limpiarFiltros()">
            Limpiar Filtros
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .rutas-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }

    .selection-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 8px 12px;
      background: #e3f2fd;
      border-radius: 8px;
      border: 1px solid #1976d2;
    }

    .selection-count {
      font-size: 12px;
      font-weight: 500;
      color: #1976d2;
      margin-right: 8px;
    }

    .columnas-menu {
      min-width: 200px;
    }

    .menu-header {
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      margin-bottom: 8px;
    }

    .menu-header h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
    }

    .columna-checkbox {
      display: block;
      padding: 8px 16px;
      width: 100%;
    }

    .selected-row {
      background-color: #e3f2fd !important;
    }

    .filtros-card {
      margin-bottom: 20px;
    }

    .filtros-grid {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 20px;
      align-items: center;
    }

    .form-field {
      width: 100%;
    }

    .filtros-actions {
      display: flex;
      gap: 10px;
    }

    .info-card {
      margin-bottom: 20px;
    }

    .info-grid {
      display: flex;
      gap: 30px;
      align-items: center;
    }

    .info-item {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      font-weight: 600;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      gap: 20px;
    }

    .content-section {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .section-subtitle {
      margin: 5px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .table-container {
      overflow-x: auto;
    }

    .rutas-table {
      width: 100%;
    }

    .codigo-ruta {
      font-family: monospace;
      font-weight: 600;
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .estado-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background: #f44336;
      color: white;
    }

    .estado-badge.activo {
      background: #4caf50;
    }

    .itinerario-text {
      font-size: 12px;
      color: #666;
      font-style: italic;
    }

    .empresa-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .empresa-nombre {
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .empresa-ruc {
      font-family: monospace;
      font-size: 12px;
      color: #666;
    }

    .ruc-text {
      font-family: monospace;
      font-weight: 500;
    }

    .resolucion-text {
      font-size: 12px;
      color: #333;
    }

    .frecuencias-text {
      font-size: 12px;
      color: #555;
    }

    .tipo-ruta-text {
      font-size: 12px;
      color: #444;
      text-transform: uppercase;
    }

    .tipo-servicio-text {
      font-size: 12px;
      color: #444;
      text-transform: uppercase;
    }

    .no-results {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-results mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 20px;
      opacity: 0.5;
    }

    .no-results h3 {
      margin: 0 0 10px 0;
    }

    .no-results p {
      margin: 0 0 20px 0;
    }
  `]
})
export class RutasComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private rutaService = inject(RutaService);
  private empresaService = inject(EmpresaService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Signals básicos
  isLoading = signal(false);
  rutas = signal<Ruta[]>([]);
  empresas = signal<Empresa[]>([]);
  
  // Filtros
  empresaSeleccionada = signal<Empresa | null>(null);
  estadoSeleccionado = signal<string | null>(null);
  
  // Paginación
  pageSize = signal(10);
  pageIndex = signal(0);
  
  // Selección múltiple
  rutasSeleccionadas = signal<Set<string>>(new Set());
  todasSeleccionadas = signal(false);
  
  // Configuración de columnas
  columnasDisponibles = [
    { key: 'select', label: 'Seleccionar', visible: true, fixed: true },
    { key: 'empresa', label: 'Empresa', visible: true },
    { key: 'ruc', label: 'RUC', visible: true },
    { key: 'resolucion', label: 'Resolución', visible: true },
    { key: 'codigoRuta', label: 'Código Ruta', visible: true },
    { key: 'origen', label: 'Origen', visible: true },
    { key: 'destino', label: 'Destino', visible: true },
    { key: 'itinerario', label: 'Itinerario', visible: true },
    { key: 'frecuencias', label: 'Frecuencias', visible: true },
    { key: 'tipoRuta', label: 'Tipo Ruta', visible: false },
    { key: 'tipoServicio', label: 'Tipo Servicio', visible: false },
    { key: 'estado', label: 'Estado', visible: true },
    { key: 'acciones', label: 'Acciones', visible: true, fixed: true }
  ];
  
  columnasVisibles = signal(this.columnasDisponibles.filter(col => col.visible));
  
  // Columnas de la tabla - dinámicas basadas en configuración
  displayedColumns = computed(() => 
    this.columnasVisibles().map(col => col.key)
  );
  
  // Cache de empresas para rendimiento (ya no necesario)
  private empresasCache = new Map<string, string>();

  // Computed para filtros
  filtroActivo = computed(() => {
    const empresa = this.empresaSeleccionada();
    const estado = this.estadoSeleccionado();
    
    if (empresa && estado) {
      return {
        tipo: 'empresa-estado',
        descripcion: `Rutas de ${empresa.razonSocial?.principal} - Estado: ${estado}`
      };
    } else if (empresa) {
      return {
        tipo: 'empresa',
        descripcion: `Rutas de ${empresa.razonSocial?.principal}`
      };
    } else if (estado) {
      return {
        tipo: 'estado',
        descripcion: `Rutas con estado: ${estado}`
      };
    } else {
      return {
        tipo: 'todas',
        descripcion: 'Todas las Rutas del Sistema'
      };
    }
  });

  // Computed para rutas filtradas
  rutasFiltradas = computed(() => {
    const rutas = this.rutas();
    const empresa = this.empresaSeleccionada();
    const estado = this.estadoSeleccionado();
    
    let filtradas = rutas;
    
    if (empresa) {
      filtradas = filtradas.filter(ruta => ruta.empresa.id === empresa.id);
    }
    
    if (estado) {
      filtradas = filtradas.filter(ruta => ruta.estado === estado);
    }
    
    return filtradas;
  });

  // Computed para rutas paginadas
  rutasPaginadas = computed(() => {
    const rutas = this.rutasFiltradas();
    const pageSize = this.pageSize();
    const pageIndex = this.pageIndex();
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    
    return rutas.slice(startIndex, endIndex);
  });

  ngOnInit(): void {
    this.cargarConfiguracionColumnas();
    this.cargarDatos();
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  /**
   * Genera el nombre de la ruta como "ORIGEN - DESTINO"
   */
  getNombreRuta(ruta: Ruta): string {
    // Si tiene origen y destino definidos
    if (ruta.origen && ruta.destino) {
      const origen = typeof ruta.origen === 'string' ? ruta.origen : ruta.origen.nombre;
      const destino = typeof ruta.destino === 'string' ? ruta.destino : ruta.destino.nombre;
      return `${origen} - ${destino}`;
    }
    
    // Si no tiene origen/destino pero tiene itinerario como array
    if (ruta.itinerario && Array.isArray(ruta.itinerario) && ruta.itinerario.length > 0) {
      const localidades = ruta.itinerario.map(loc => loc.nombre);
      
      if (localidades.length >= 2) {
        return `${localidades[0]} - ${localidades[localidades.length - 1]}`;
      }
      
      // Si solo hay una localidad
      if (localidades.length === 1) {
        return localidades[0];
      }
    }
    
    // Si itinerario es string (compatibilidad con datos legacy)
    if (ruta.itinerario && typeof ruta.itinerario === 'string' && ruta.itinerario !== 'SIN ITINERARIO') {
      const itinerarioStr = ruta.itinerario as string;
      const itinerario = itinerarioStr.replace(/\s*-\s*/g, ' - ');
      const localidades = itinerario.split(' - ').map((loc: string) => loc.trim());
      
      if (localidades.length >= 2) {
        return `${localidades[0]} - ${localidades[localidades.length - 1]}`;
      }
      
      if (localidades.length === 1) {
        return localidades[0];
      }
    }
    
    // Fallback
    return 'SIN ITINERARIO';
  }

  /**
   * Obtiene el nombre de la empresa de una ruta
   */
  getEmpresaNombre(ruta: Ruta): string {
    if (!ruta.empresa) {
      return 'Sin empresa';
    }

    // Si tiene razón social estructurada
    if (ruta.empresa.razonSocial) {
      if (typeof ruta.empresa.razonSocial === 'object' && ruta.empresa.razonSocial.principal) {
        return ruta.empresa.razonSocial.principal;
      }
      if (typeof ruta.empresa.razonSocial === 'string') {
        return ruta.empresa.razonSocial;
      }
    }

    // Fallback al RUC si no hay razón social
    return ruta.empresa.ruc || 'Sin información';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async cargarDatos(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      // Cargar empresas y rutas en paralelo
      const [empresas, rutas] = await Promise.all([
        this.empresaService.getEmpresas().pipe(takeUntil(this.destroy$)).toPromise(),
        this.rutaService.getRutas().pipe(takeUntil(this.destroy$)).toPromise()
      ]);
      
      this.empresas.set(empresas || []);
      this.rutas.set(rutas || []);
      
      
    } catch (error) {
      console.error('Error al cargar datos::', error);
      this.snackBar.open('Error al cargar los datos', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }



  onEmpresaSelected(empresa: Empresa | null): void {
    this.empresaSeleccionada.set(empresa);
    this.pageIndex.set(0); // Reset pagination
  }

  onEstadoSelected(estado: string | null): void {
    this.estadoSeleccionado.set(estado);
    this.pageIndex.set(0); // Reset pagination
  }

  limpiarFiltros(): void {
    this.empresaSeleccionada.set(null);
    this.estadoSeleccionado.set(null);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  recargarRutas(): void {
    this.cargarDatos();
  }

  nuevaRuta(): void {
    const dialogRef = this.dialog.open(CrearRutaMejoradoComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.recargarRutas();
      }
    });
  }

  verDetalleRuta(ruta: Ruta): void {
    this.dialog.open(DetalleRutaModalComponent, {
      width: '600px',
      data: { ruta }
    });
  }

  editarRuta(ruta: Ruta): void {
    const dialogRef = this.dialog.open(CrearRutaMejoradoComponent, {
      width: '800px',
      data: { ruta },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.recargarRutas();
      }
    });
  }

  eliminarRuta(ruta: Ruta): void {
    if (confirm(`¿Está seguro de eliminar la ruta ${ruta.codigoRuta}?`)) {
      this.rutaService.deleteRuta(ruta.id).subscribe({
        next: () => {
          this.snackBar.open('Ruta eliminada correctamente', 'Cerrar', { duration: 3000 });
          this.recargarRutas();
        },
        error: (error) => {
          console.error('Error al eliminar ruta::', error);
          this.snackBar.open('Error al eliminar la ruta', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  // ========================================
  // MÉTODOS DE SELECCIÓN MÚLTIPLE
  // ========================================

  toggleRutaSeleccionada(rutaId: string, seleccionada: boolean): void {
    const seleccionadas = new Set(this.rutasSeleccionadas());
    
    if (seleccionada) {
      seleccionadas.add(rutaId);
    } else {
      seleccionadas.delete(rutaId);
    }
    
    this.rutasSeleccionadas.set(seleccionadas);
    this.actualizarEstadoSeleccionTodas();
  }

  toggleTodasSeleccionadas(seleccionar: boolean): void {
    const seleccionadas = new Set<string>();
    
    if (seleccionar) {
      this.rutasPaginadas().forEach(ruta => seleccionadas.add(ruta.id));
    }
    
    this.rutasSeleccionadas.set(seleccionadas);
    this.todasSeleccionadas.set(seleccionar);
  }

  private actualizarEstadoSeleccionTodas(): void {
    const rutasPagina = this.rutasPaginadas();
    const seleccionadas = this.rutasSeleccionadas();
    
    const todasSeleccionadasEnPagina = rutasPagina.length > 0 && 
      rutasPagina.every(ruta => seleccionadas.has(ruta.id));
    
    this.todasSeleccionadas.set(todasSeleccionadasEnPagina);
  }

  limpiarSeleccion(): void {
    this.rutasSeleccionadas.set(new Set());
    this.todasSeleccionadas.set(false);
  }

  eliminarSeleccionadas(): void {
    const seleccionadas = this.rutasSeleccionadas();
    const cantidad = seleccionadas.size;
    
    if (cantidad === 0) {
      this.snackBar.open('No hay rutas seleccionadas', 'Cerrar', { duration: 3000 });
      return;
    }

    const mensaje = `¿Está seguro de eliminar ${cantidad} ruta${cantidad > 1 ? 's' : ''}?`;
    
    if (confirm(mensaje)) {
      this.isLoading.set(true);
      
      // Crear array de observables para eliminar en paralelo
      const eliminaciones = Array.from(seleccionadas).map(rutaId => 
        this.rutaService.deleteRuta(rutaId)
      );
      
      // Ejecutar todas las eliminaciones
      Promise.all(eliminaciones.map(obs => obs.toPromise()))
        .then(() => {
          this.snackBar.open(`${cantidad} ruta${cantidad > 1 ? 's' : ''} eliminada${cantidad > 1 ? 's' : ''} correctamente`, 'Cerrar', { duration: 3000 });
          this.limpiarSeleccion();
          this.recargarRutas();
        })
        .catch(error => {
          console.error('Error al eliminar rutas::', error);
          this.snackBar.open('Error al eliminar algunas rutas', 'Cerrar', { duration: 3000 });
          this.recargarRutas();
        })
        .finally(() => {
          this.isLoading.set(false);
        });
    }
  }

  // ========================================
  // MÉTODOS DE EXPORTACIÓN
  // ========================================

  exportarSeleccionadas(): void {
    const seleccionadas = this.rutasSeleccionadas();
    
    if (seleccionadas.size === 0) {
      this.snackBar.open('No hay rutas seleccionadas para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const rutasParaExportar = this.rutas().filter(ruta => seleccionadas.has(ruta.id));
    this.exportarRutas(rutasParaExportar, 'excel', 'seleccionadas');
  }

  exportarTodas(formato: 'excel' | 'csv' | 'pdf'): void {
    const rutasParaExportar = this.rutasFiltradas();
    this.exportarRutas(rutasParaExportar, formato, 'todas');
  }

  private exportarRutas(rutas: Ruta[], formato: string, tipo: string): void {
    // Preparar datos para exportación
    const datosExportacion = rutas.map(ruta => ({
      RUC: ruta.empresa?.ruc || '',
      Resolución: ruta.resolucion?.nroResolucion || '',
      'Código Ruta': ruta.codigoRuta,
      Origen: ruta.origen?.nombre || ruta.origen,
      Destino: ruta.destino?.nombre || ruta.destino,
      Itinerario: ruta.itinerario || 'SIN ITINERARIO',
      Frecuencias: ruta.frecuencia?.descripcion || ruta.frecuencias || '',
      'Tipo Ruta': ruta.tipoRuta || '',
      'Tipo Servicio': ruta.tipoServicio || '',
      Estado: ruta.estado
    }));

    // Simular exportación (aquí implementarías la lógica real)
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `rutas_${tipo}_${fecha}.${formato}`;
    
    // console.log removed for production
    
    // Por ahora, descargar como JSON para demostración
    const dataStr = JSON.stringify(datosExportacion, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nombreArchivo}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    this.snackBar.open(`${rutas.length} rutas exportadas como ${nombreArchivo}`, 'Cerrar', { duration: 3000 });
  }

  // ========================================
  // MÉTODOS DE CONFIGURACIÓN DE COLUMNAS
  // ========================================

  toggleColumna(columnaKey: string, visible: boolean): void {
    // Actualizar configuración de columna
    const columna = this.columnasDisponibles.find(col => col.key === columnaKey);
    if (columna && !columna.fixed) {
      columna.visible = visible;
    }
    
    // Actualizar columnas visibles
    this.columnasVisibles.set(this.columnasDisponibles.filter(col => col.visible));
    
    // Guardar configuración en localStorage
    this.guardarConfiguracionColumnas();
  }

  resetearColumnas(): void {
    // Resetear a configuración por defecto
    this.columnasDisponibles.forEach(col => {
      if (!col.fixed) {
        col.visible = ['ruc', 'resolucion', 'codigoRuta', 'origen', 'destino', 'itinerario', 'frecuencias', 'estado'].includes(col.key);
      }
    });
    
    this.columnasVisibles.set(this.columnasDisponibles.filter(col => col.visible));
    this.guardarConfiguracionColumnas();
  }

  private guardarConfiguracionColumnas(): void {
    const config = this.columnasDisponibles.reduce((acc, col) => {
      acc[col.key] = col.visible;
      return acc;
    }, {} as Record<string, boolean>);
    
    localStorage.setItem('rutas-columnas-config', JSON.stringify(config));
  }

  private cargarConfiguracionColumnas(): void {
    const configGuardada = localStorage.getItem('rutas-columnas-config');
    
    if (configGuardada) {
      try {
        const config = JSON.parse(configGuardada);
        this.columnasDisponibles.forEach(col => {
          if (config.hasOwnProperty(col.key) && !col.fixed) {
            col.visible = config[col.key];
          }
        });
        
        this.columnasVisibles.set(this.columnasDisponibles.filter(col => col.visible));
      } catch (error) {
        console.error('Error al cargar configuración de columnas::', error);
      }
    }
  }
}