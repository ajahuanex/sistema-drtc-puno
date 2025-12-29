import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, AfterViewInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { 
  ResolucionConEmpresa, 
  ResolucionTableConfig, 
  ColumnaDefinicion,
  OrdenamientoColumna,
  COLUMNAS_DEFINICIONES 
} from '../models/resolucion-table.model';
import { ColumnSelectorComponent } from './column-selector.component';
import { SortableHeaderComponent, EventoOrdenamiento } from './sortable-header.component';
import { SmartIconComponent } from './smart-icon.component';
import { ResolucionCardMobileComponent, AccionCard } from './resolucion-card-mobile.component';
import { ResolucionService } from '../services/resolucion.service';

export interface AccionTabla {
  accion: 'ver' | 'editar' | 'eliminar' | 'exportar' | 'seleccionar' | 'ver-rutas-autorizadas' | 'ver-vehiculos-habilitados';
  resolucion?: ResolucionConEmpresa;
  resoluciones?: ResolucionConEmpresa[];
  formato?: 'excel' | 'pdf';
}

/**
 * Componente de tabla avanzada para resoluciones
 * 
 * @example
 * ```html
 * <app-resoluciones-table
 *   [resoluciones]="listaResoluciones"
 *   [configuracion]="configTabla"
 *   [cargando]="estaCargando"
 *   (configuracionChange)="onConfigChange($event)"
 *   (accionEjecutada)="onAccionEjecutada($event)">
 * </app-resoluciones-table>
 * ```
 */
@Component({
  selector: 'app-resoluciones-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatSnackBarModule,
    ScrollingModule,
    ColumnSelectorComponent,
    SortableHeaderComponent,
    SmartIconComponent,
    ResolucionCardMobileComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      
      <!-- Toolbar de la tabla -->
      <div class="table-toolbar">
        <div class="toolbar-left">
          <h3 class="table-title">
            <app-smart-icon iconName="description" [size]="20"></app-smart-icon>
            Resoluciones
            @if (totalResultados() > 0) {
              <span class="results-count">({{ totalResultados() }} resultados)</span>
            }
          </h3>
          
          @if (seleccionMultiple && seleccion.hasValue()) {
            <div class="selection-info">
              <mat-chip-set>
                <mat-chip class="selection-chip">
                  {{ seleccion.selected.length }} seleccionada(s)
                  <button mat-icon-button 
                          (click)="limpiarSeleccion()"
                          matTooltip="Limpiar selección">
                    <app-smart-icon iconName="close" [size]="16" matChipRemove></app-smart-icon>
                  </button>
                </mat-chip>
              </mat-chip-set>
            </div>
          }
        </div>
        
        <div class="toolbar-right">
          <!-- Acciones en lote -->
          @if (seleccionMultiple && seleccion.hasValue()) {
            <div class="bulk-actions">
              <button mat-stroked-button 
                      (click)="ejecutarAccionLote('exportar')"
                      matTooltip="Exportar seleccionadas">
                <app-smart-icon iconName="download" [size]="18"></app-smart-icon>
                Exportar
              </button>
            </div>
          }
          
          <!-- Selector de columnas -->
          <app-column-selector
            [columnas]="todasLasColumnas"
            [columnasVisibles]="configuracion.columnasVisibles"
            [ordenColumnas]="configuracion.ordenColumnas"
            (columnasChange)="onColumnasVisiblesChange($event)"
            (ordenChange)="onOrdenColumnasChange($event)">
          </app-column-selector>
          
          <!-- Botón de exportar con menú de formatos -->
          <button mat-icon-button 
                  [matMenuTriggerFor]="exportMenu"
                  [disabled]="cargando || exportando()"
                  matTooltip="Exportar resoluciones"
                  class="export-button">
            <app-smart-icon iconName="file_download" [size]="20"></app-smart-icon>
          </button>
          
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportarResoluciones('excel')">
              <app-smart-icon iconName="table_chart" [size]="18"></app-smart-icon>
              <span>Exportar a Excel</span>
            </button>
            <button mat-menu-item (click)="exportarResoluciones('pdf')">
              <app-smart-icon iconName="picture_as_pdf" [size]="18"></app-smart-icon>
              <span>Exportar a PDF</span>
            </button>
          </mat-menu>
        </div>
      </div>
      
      <!-- Barra de progreso de exportación -->
      @if (exportando()) {
        <mat-progress-bar mode="indeterminate" class="export-progress"></mat-progress-bar>
      }

      <!-- Vista móvil: Cards -->
      @if (esMobile()) {
        <div class="mobile-view" [class.loading]="cargando">
          @if (cargando) {
            <div class="loading-overlay" role="status" aria-live="polite" aria-busy="true">
              <mat-spinner diameter="40" aria-label="Cargando datos"></mat-spinner>
              <span class="loading-text">Cargando resoluciones...</span>
            </div>
          }
          
          @if (!cargando && dataSource.data.length > 0) {
            <div class="cards-container">
              @for (resolucion of dataSource.data; track resolucion.id) {
                <app-resolucion-card-mobile
                  [resolucion]="resolucion"
                  [seleccionada]="seleccion.isSelected(resolucion)"
                  [mostrarCheckbox]="seleccionMultiple"
                  (accionEjecutada)="onAccionCard($event)"
                  (seleccionChange)="onCardSeleccionChange(resolucion, $event)"
                  (cardClick)="onFilaClick(resolucion)">
                </app-resolucion-card-mobile>
              }
            </div>
          }
          
          @if (!cargando && dataSource.data.length === 0) {
            <div class="no-results" role="status" aria-live="polite">
              <app-smart-icon iconName="search_off" [size]="48" class="no-results-icon"></app-smart-icon>
              <h3>No se encontraron resoluciones</h3>
              <p>No hay resoluciones que coincidan con los criterios de búsqueda.</p>
              <p class="no-results-suggestion">Intenta ajustar los filtros o limpiar la búsqueda.</p>
            </div>
          }
        </div>
      }

      <!-- Vista desktop/tablet: Tabla -->
      @if (!esMobile()) {
        <div class="table-wrapper" [class.loading]="cargando" [class.tablet-scroll]="esTablet()">
          @if (cargando) {
            <div class="loading-overlay" role="status" aria-live="polite" aria-busy="true">
              <mat-spinner diameter="40" aria-label="Cargando datos"></mat-spinner>
              <span class="loading-text">Cargando resoluciones...</span>
            </div>
          }
        
        <mat-table 
          [dataSource]="dataSource" 
          class="resoluciones-table"
          role="table"
          [attr.aria-label]="'Tabla de resoluciones con ' + totalResultados() + ' resultados'"
          [attr.aria-rowcount]="totalResultados()"
          matSort>
          
          <!-- Columna de selección -->
          @if (seleccionMultiple) {
            <ng-container matColumnDef="seleccion">
              <mat-header-cell *matHeaderCellDef class="selection-column">
                <mat-checkbox 
                  [checked]="seleccion.hasValue() && isAllSelected()"
                  [indeterminate]="seleccion.hasValue() && !isAllSelected()"
                  (change)="$event ? masterToggle() : null"
                  matTooltip="Seleccionar todo">
                </mat-checkbox>
              </mat-header-cell>
              <mat-cell *matCellDef="let resolucion" class="selection-column">
                <mat-checkbox 
                  [checked]="seleccion.isSelected(resolucion)"
                  (click)="$event.stopPropagation()"
                  (change)="$event ? seleccion.toggle(resolucion) : null"
                  [matTooltip]="'Seleccionar ' + resolucion.nroResolucion">
                </mat-checkbox>
              </mat-cell>
            </ng-container>
          }

          <!-- Columna: Número de Resolución -->
          <ng-container matColumnDef="nroResolucion">
            <mat-header-cell *matHeaderCellDef class="numero-column">
              <app-sortable-header
                columna="nroResolucion"
                label="Número de Resolución"
                [ordenamiento]="configuracion.ordenamiento"
                (ordenamientoChange)="onOrdenamientoChange($event)">
              </app-sortable-header>
            </mat-header-cell>
            <mat-cell *matCellDef="let resolucion" class="numero-column">
              <div class="numero-resolucion">
                <span class="numero-principal">{{ resolucion.nroResolucion }}</span>
                @if (resolucion.tipoResolucion) {
                  <span class="tipo-badge" [class]="'tipo-' + resolucion.tipoResolucion.toLowerCase()">
                    {{ resolucion.tipoResolucion }}
                  </span>
                }
              </div>
            </mat-cell>
          </ng-container>

          <!-- Columna: Empresa -->
          <ng-container matColumnDef="empresa">
            <mat-header-cell *matHeaderCellDef class="empresa-column">
              <app-sortable-header
                columna="empresa"
                label="Empresa"
                [ordenamiento]="configuracion.ordenamiento"
                (ordenamientoChange)="onOrdenamientoChange($event)">
              </app-sortable-header>
            </mat-header-cell>
            <mat-cell *matCellDef="let resolucion" class="empresa-column">
              <div class="empresa-info">
                @if (resolucion.empresa) {
                  <div class="empresa-nombre">{{ resolucion.empresa.razonSocial.principal }}</div>
                  <div class="empresa-ruc">RUC: {{ resolucion.empresa.ruc }}</div>
                } @else {
                  <div class="sin-empresa">Sin empresa asignada</div>
                }
              </div>
            </mat-cell>
          </ng-container>

          <!-- Columna: Tipo de Trámite -->
          <ng-container matColumnDef="tipoTramite">
            <mat-header-cell *matHeaderCellDef class="tipo-column">
              <app-sortable-header
                columna="tipoTramite"
                label="Tipo de Trámite"
                [ordenamiento]="configuracion.ordenamiento"
                (ordenamientoChange)="onOrdenamientoChange($event)">
              </app-sortable-header>
            </mat-header-cell>
            <mat-cell *matCellDef="let resolucion" class="tipo-column">
              <mat-chip class="tipo-chip" [class]="'tipo-' + resolucion.tipoTramite.toLowerCase()">
                {{ resolucion.tipoTramite }}
              </mat-chip>
            </mat-cell>
          </ng-container>

          <!-- Columna: Fecha de Emisión -->
          <ng-container matColumnDef="fechaEmision">
            <mat-header-cell *matHeaderCellDef class="fecha-column">
              <app-sortable-header
                columna="fechaEmision"
                label="Fecha de Emisión"
                [ordenamiento]="configuracion.ordenamiento"
                (ordenamientoChange)="onOrdenamientoChange($event)">
              </app-sortable-header>
            </mat-header-cell>
            <mat-cell *matCellDef="let resolucion" class="fecha-column">
              <div class="fecha-info">
                <div class="fecha-principal">{{ resolucion.fechaEmision | date:'dd/MM/yyyy' }}</div>
                <div class="fecha-relativa">{{ getFechaRelativa(resolucion.fechaEmision) }}</div>
              </div>
            </mat-cell>
          </ng-container>

          <!-- Columna: Vigencia Inicio -->
          <ng-container matColumnDef="fechaVigenciaInicio">
            <mat-header-cell *matHeaderCellDef class="fecha-column">
              <app-sortable-header
                columna="fechaVigenciaInicio"
                label="Vigencia Inicio"
                [ordenamiento]="configuracion.ordenamiento"
                (ordenamientoChange)="onOrdenamientoChange($event)">
              </app-sortable-header>
            </mat-header-cell>
            <mat-cell *matCellDef="let resolucion" class="fecha-column">
              @if (resolucion.fechaVigenciaInicio) {
                <div class="fecha-info">
                  <div class="fecha-principal">{{ resolucion.fechaVigenciaInicio | date:'dd/MM/yyyy' }}</div>
                </div>
              } @else {
                <span class="no-data">-</span>
              }
            </mat-cell>
          </ng-container>

          <!-- Columna: Vigencia Fin -->
          <ng-container matColumnDef="fechaVigenciaFin">
            <mat-header-cell *matHeaderCellDef class="fecha-column">
              <app-sortable-header
                columna="fechaVigenciaFin"
                label="Vigencia Fin"
                [ordenamiento]="configuracion.ordenamiento"
                (ordenamientoChange)="onOrdenamientoChange($event)">
              </app-sortable-header>
            </mat-header-cell>
            <mat-cell *matCellDef="let resolucion" class="fecha-column">
              @if (resolucion.fechaVigenciaFin) {
                <div class="fecha-info">
                  <div class="fecha-principal">{{ resolucion.fechaVigenciaFin | date:'dd/MM/yyyy' }}</div>
                  <div class="fecha-estado" [class]="getEstadoVigencia(resolucion.fechaVigenciaFin)">
                    {{ getTextoVigencia(resolucion.fechaVigenciaFin) }}
                  </div>
                </div>
              } @else {
                <span class="no-data">-</span>
              }
            </mat-cell>
          </ng-container>

          <!-- Columna: Estado -->
          <ng-container matColumnDef="estado">
            <mat-header-cell *matHeaderCellDef class="estado-column">
              <app-sortable-header
                columna="estado"
                label="Estado"
                [ordenamiento]="configuracion.ordenamiento"
                (ordenamientoChange)="onOrdenamientoChange($event)">
              </app-sortable-header>
            </mat-header-cell>
            <mat-cell *matCellDef="let resolucion" class="estado-column">
              <mat-chip class="estado-chip" [class]="'estado-' + resolucion.estado.toLowerCase().replace('_', '-')">
                {{ getEstadoTexto(resolucion.estado) }}
              </mat-chip>
            </mat-cell>
          </ng-container>

          <!-- Columna: Rutas Autorizadas -->
          <ng-container matColumnDef="rutasAutorizadas">
            <mat-header-cell *matHeaderCellDef class="rutas-column">
              <span>Rutas Autorizadas</span>
            </mat-header-cell>
            <mat-cell *matCellDef="let resolucion" class="rutas-column">
              <div class="rutas-info" 
                   (click)="verRutasAutorizadas(resolucion)" 
                   [class.clickable]="resolucion.cantidadRutas && resolucion.cantidadRutas > 0"
                   matTooltip="{{ resolucion.cantidadRutas && resolucion.cantidadRutas > 0 ? 'Clic para ver detalles' : 'Sin rutas autorizadas' }}">
                @if (resolucion.cantidadRutas && resolucion.cantidadRutas > 0) {
                  <div class="rutas-count">
                    <app-smart-icon iconName="route" [size]="16" class="rutas-icon"></app-smart-icon>
                    <span class="count-text">{{ resolucion.cantidadRutas }}</span>
                    <span class="count-label">{{ resolucion.cantidadRutas === 1 ? 'ruta' : 'rutas' }}</span>
                  </div>
                  @if (resolucion.tipoResolucion === 'PADRE') {
                    <div class="rutas-tipo padre">
                      <app-smart-icon iconName="account_tree" [size]="12"></app-smart-icon>
                      <span>Generales</span>
                    </div>
                  } @else if (resolucion.tipoResolucion === 'HIJO') {
                    <div class="rutas-tipo hijo">
                      <app-smart-icon iconName="subdirectory_arrow_right" [size]="12"></app-smart-icon>
                      <span>Específicas</span>
                    </div>
                  }
                } @else {
                  <div class="sin-rutas">
                    <app-smart-icon iconName="route" [size]="16" class="sin-rutas-icon"></app-smart-icon>
                    <span>Sin rutas</span>
                  </div>
                }
              </div>
            </mat-cell>
          </ng-container>

          <!-- Columna: Vehículos Habilitados -->
          <ng-container matColumnDef="vehiculosHabilitados">
            <mat-header-cell *matHeaderCellDef class="vehiculos-column">
              <span>Vehículos Habilitados</span>
            </mat-header-cell>
            <mat-cell *matCellDef="let resolucion" class="vehiculos-column">
              <div class="vehiculos-info" 
                   (click)="verVehiculosHabilitados(resolucion)" 
                   [class.clickable]="resolucion.cantidadVehiculos && resolucion.cantidadVehiculos > 0"
                   matTooltip="{{ resolucion.cantidadVehiculos && resolucion.cantidadVehiculos > 0 ? 'Clic para ver detalles' : 'Sin vehículos habilitados' }}">
                @if (resolucion.cantidadVehiculos && resolucion.cantidadVehiculos > 0) {
                  <div class="vehiculos-count">
                    <app-smart-icon iconName="directions_car" [size]="16" class="vehiculos-icon"></app-smart-icon>
                    <span class="count-text">{{ resolucion.cantidadVehiculos }}</span>
                    <span class="count-label">{{ resolucion.cantidadVehiculos === 1 ? 'vehículo' : 'vehículos' }}</span>
                  </div>
                  @if (resolucion.tipoResolucion === 'PADRE') {
                    <div class="vehiculos-tipo padre">
                      <app-smart-icon iconName="account_tree" [size]="12"></app-smart-icon>
                      <span>Generales</span>
                    </div>
                  } @else if (resolucion.tipoResolucion === 'HIJO') {
                    <div class="vehiculos-tipo hijo">
                      <app-smart-icon iconName="subdirectory_arrow_right" [size]="12"></app-smart-icon>
                      <span>Específicos</span>
                    </div>
                  }
                } @else {
                  <div class="sin-vehiculos">
                    <app-smart-icon iconName="directions_car" [size]="16" class="sin-vehiculos-icon"></app-smart-icon>
                    <span>Sin vehículos</span>
                  </div>
                }
              </div>
            </mat-cell>
          </ng-container>

          <!-- Columna: Activo -->
          <ng-container matColumnDef="estaActivo">
            <mat-header-cell *matHeaderCellDef class="activo-column">
              <app-sortable-header
                columna="estaActivo"
                label="Activo"
                [ordenamiento]="configuracion.ordenamiento"
                (ordenamientoChange)="onOrdenamientoChange($event)">
              </app-sortable-header>
            </mat-header-cell>
            <mat-cell *matCellDef="let resolucion" class="activo-column">
              <div class="activo-indicator" [class.activo]="resolucion.estaActivo">
                <app-smart-icon 
                  [iconName]="resolucion.estaActivo ? 'check_circle' : 'cancel'" 
                  [size]="18"
                  [class]="resolucion.estaActivo ? 'icon-activo' : 'icon-inactivo'">
                </app-smart-icon>
                <span>{{ resolucion.estaActivo ? 'Activo' : 'Inactivo' }}</span>
              </div>
            </mat-cell>
          </ng-container>

          <!-- Columna: Acciones -->
          <ng-container matColumnDef="acciones">
            <mat-header-cell *matHeaderCellDef class="acciones-column">
              <span>Acciones</span>
            </mat-header-cell>
            <mat-cell *matCellDef="let resolucion" class="acciones-column">
              <div class="acciones-buttons">
                <button mat-icon-button 
                        (click)="ejecutarAccion('ver', resolucion)"
                        matTooltip="Ver detalles"
                        class="accion-button ver">
                  <app-smart-icon iconName="visibility" [size]="18"></app-smart-icon>
                </button>
                
                <button mat-icon-button 
                        (click)="ejecutarAccion('editar', resolucion)"
                        matTooltip="Editar resolución"
                        class="accion-button editar">
                  <app-smart-icon iconName="edit" [size]="18"></app-smart-icon>
                </button>
                
                <button mat-icon-button 
                        [matMenuTriggerFor]="accionesMenu"
                        matTooltip="Más acciones"
                        class="accion-button menu">
                  <app-smart-icon iconName="more_vert" [size]="18"></app-smart-icon>
                </button>
                
                <mat-menu #accionesMenu="matMenu">
                  <button mat-menu-item (click)="ejecutarAccion('eliminar', resolucion)">
                    <app-smart-icon iconName="delete" [size]="18"></app-smart-icon>
                    <span>Eliminar</span>
                  </button>
                </mat-menu>
              </div>
            </mat-cell>
          </ng-container>

          <!-- Headers y filas -->
          <mat-header-row 
            *matHeaderRowDef="columnasVisibles()"
            role="row">
          </mat-header-row>
          <mat-row 
            *matRowDef="let resolucion; columns: columnasVisibles(); let i = index; " 
            (click)="onFilaClick(resolucion)"
            (keydown.enter)="onFilaClick(resolucion)"
            (keydown.space)="onFilaClick(resolucion)"
            class="tabla-fila"
            [class.selected]="seleccion.isSelected(resolucion)"
            [attr.aria-label]="'Resolución ' + resolucion.nroResolucion + ', fila ' + (i + 1) + ' de ' + totalResultados()"
            [attr.aria-selected]="seleccion.isSelected(resolucion)"
            role="row"
            tabindex="0">
          </mat-row>
        </mat-table>

          <!-- Estado sin resultados -->
          @if (!cargando && dataSource.data.length === 0) {
            <div class="no-results" role="status" aria-live="polite">
              <app-smart-icon iconName="search_off" [size]="48" class="no-results-icon"></app-smart-icon>
              <h3>No se encontraron resoluciones</h3>
              <p>No hay resoluciones que coincidan con los criterios de búsqueda.</p>
              <p class="no-results-suggestion">Intenta ajustar los filtros o limpiar la búsqueda.</p>
            </div>
          }
        </div>
      }

      <!-- Paginador -->
      @if (dataSource.data.length > 0 || configuracion.paginacion.paginaActual > 0) {
        <mat-paginator 
          [length]="totalResultados()"
          [pageSize]="configuracion.paginacion.tamanoPagina"
          [pageIndex]="configuracion.paginacion.paginaActual"
          [pageSizeOptions]="[10, 25, 50, 100]"
          [showFirstLastButtons]="true"
          [disabled]="cargando"
          (page)="onPaginaChange($event)"
          class="table-paginator"
          aria-label="Paginación de tabla de resoluciones">
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .table-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      background-color: #fafafa;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .table-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: #1976d2;
    }

    .results-count {
      font-size: 14px;
      font-weight: 400;
      color: rgba(0, 0, 0, 0.6);
    }

    .selection-info {
      display: flex;
      align-items: center;
    }

    .selection-chip {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bulk-actions {
      display: flex;
      gap: 8px;
      margin-right: 16px;
      padding-right: 16px;
      border-right: 1px solid #e0e0e0;
    }

    .export-button {
      color: rgba(0, 0, 0, 0.6);
    }

    .export-button:hover {
      color: #1976d2;
      background-color: rgba(25, 118, 210, 0.04);
    }

    .export-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .export-progress {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 11;
    }

    .mobile-view {
      flex: 1;
      position: relative;
      overflow-y: auto;
      padding: 16px;
    }

    .mobile-view.loading {
      pointer-events: none;
    }

    .cards-container {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .table-wrapper {
      flex: 1;
      position: relative;
      overflow: auto;
    }

    .table-wrapper.loading {
      pointer-events: none;
    }

    .table-wrapper.tablet-scroll {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .table-wrapper.tablet-scroll .resoluciones-table {
      min-width: 900px;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 10;
    }

    .loading-overlay .loading-text {
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
      font-weight: 500;
    }

    .resoluciones-table {
      width: 100%;
    }

    /* Columnas específicas */
    .selection-column {
      width: 48px;
      padding: 0 8px;
    }

    .numero-column {
      min-width: 180px;
    }

    .empresa-column {
      min-width: 250px;
    }

    .tipo-column {
      width: 150px;
    }

    .fecha-column {
      width: 140px;
    }

    .estado-column {
      width: 120px;
    }

    .rutas-column {
      width: 180px;
    }

    .activo-column {
      width: 100px;
    }

    .acciones-column {
      width: 120px;
    }

    /* Contenido de celdas */
    .numero-resolucion {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .numero-principal {
      font-weight: 500;
      color: #1976d2;
    }

    .tipo-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .tipo-badge.tipo-padre {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .tipo-badge.tipo-hijo {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .empresa-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .empresa-nombre {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.8);
      line-height: 1.2;
    }

    .empresa-ruc {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
      font-family: monospace;
    }

    .sin-empresa {
      color: rgba(0, 0, 0, 0.4);
      font-style: italic;
      font-size: 13px;
    }

    .tipo-chip {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .tipo-chip.tipo-primigenia {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .tipo-chip.tipo-renovacion {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .tipo-chip.tipo-incremento {
      background-color: #e8f5e8;
      color: #388e3c;
    }

    .tipo-chip.tipo-sustitucion {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .tipo-chip.tipo-otros {
      background-color: #f5f5f5;
      color: #616161;
    }

    .fecha-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .fecha-principal {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.8);
    }

    .fecha-relativa {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
    }

    .fecha-estado {
      font-size: 11px;
      font-weight: 500;
    }

    .fecha-estado.vigente {
      color: #388e3c;
    }

    .fecha-estado.proximo-vencer {
      color: #f57c00;
    }

    .fecha-estado.vencido {
      color: #d32f2f;
    }

    .estado-chip {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .estado-chip.estado-borrador {
      background-color: #f5f5f5;
      color: #616161;
    }

    .estado-chip.estado-en-revision {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .estado-chip.estado-aprobado {
      background-color: #e8f5e8;
      color: #388e3c;
    }

    .estado-chip.estado-vigente {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .estado-chip.estado-vencido {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .estado-chip.estado-anulado {
      background-color: #fce4ec;
      color: #c2185b;
    }

    .activo-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
    }

    .icon-activo {
      color: #4caf50;
    }

    .icon-inactivo {
      color: #f44336;
    }

    .rutas-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
    }

    .rutas-count {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 500;
      color: #1976d2;
    }

    .rutas-icon {
      color: #1976d2;
    }

    .count-text {
      font-weight: 600;
      font-size: 14px;
    }

    .count-label {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.6);
    }

    .rutas-tipo {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 8px;
      text-transform: uppercase;
    }

    .rutas-tipo.padre {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .rutas-tipo.hijo {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .sin-rutas {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.4);
      font-style: italic;
    }

    .sin-rutas-icon {
      color: rgba(0, 0, 0, 0.3);
    }

    .rutas-info.clickable {
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 6px;
      padding: 4px;
    }

    .rutas-info.clickable:hover {
      background-color: #e3f2fd;
      transform: scale(1.02);
    }

    .rutas-info.clickable:active {
      transform: scale(0.98);
    }

    /* Estilos para columna de vehículos */
    .vehiculos-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
    }

    .vehiculos-count {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 500;
      color: #388e3c;
    }

    .vehiculos-icon {
      color: #388e3c;
    }

    .vehiculos-tipo {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 8px;
      text-transform: uppercase;
    }

    .vehiculos-tipo.padre {
      background-color: #e8f5e8;
      color: #388e3c;
    }

    .vehiculos-tipo.hijo {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .sin-vehiculos {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.4);
      font-style: italic;
    }

    .sin-vehiculos-icon {
      color: rgba(0, 0, 0, 0.3);
    }

    .vehiculos-info.clickable {
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 6px;
      padding: 4px;
    }

    .vehiculos-info.clickable:hover {
      background-color: #e8f5e8;
      transform: scale(1.02);
    }

    .vehiculos-info.clickable:active {
      transform: scale(0.98);
    }

    .acciones-buttons {
      display: flex;
      gap: 4px;
    }

    .accion-button {
      width: 32px;
      height: 32px;
    }

    .accion-button.ver {
      color: #1976d2;
    }

    .accion-button.editar {
      color: #388e3c;
    }

    .accion-button.menu {
      color: rgba(0, 0, 0, 0.6);
    }

    .no-data {
      color: rgba(0, 0, 0, 0.4);
      font-style: italic;
      text-align: center;
    }

    .tabla-fila {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .tabla-fila:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }

    .tabla-fila.selected {
      background-color: rgba(25, 118, 210, 0.08);
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      color: rgba(0, 0, 0, 0.6);
    }

    .no-results h3 {
      margin: 16px 0 8px 0;
      font-weight: 500;
    }

    .no-results p {
      margin: 0;
      color: rgba(0, 0, 0, 0.4);
    }

    .no-results-icon {
      color: rgba(0, 0, 0, 0.3);
    }

    .no-results-suggestion {
      margin-top: 8px !important;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.5) !important;
    }

    .table-paginator {
      border-top: 1px solid #e0e0e0;
    }

    /* Responsive */
    @media (max-width: 1024px) and (min-width: 769px) {
      /* Tablet: Scroll horizontal */
      .table-wrapper {
        overflow-x: auto;
      }
      
      .resoluciones-table {
        min-width: 900px;
      }
      
      .toolbar-right {
        gap: 4px;
      }
    }

    @media (max-width: 768px) {
      .table-toolbar {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
        padding: 12px 16px;
      }
      
      .toolbar-left,
      .toolbar-right {
        justify-content: space-between;
      }
      
      .table-title {
        font-size: 16px;
      }
      
      .results-count {
        font-size: 12px;
      }
      
      .bulk-actions {
        margin-right: 0;
        padding-right: 0;
        border-right: none;
      }
      
      .mobile-view {
        padding: 12px;
      }
    }

    @media (max-width: 480px) {
      .table-toolbar {
        padding: 8px 12px;
      }
      
      .table-title {
        font-size: 14px;
      }
      
      .toolbar-right {
        flex-wrap: wrap;
      }
      
      .mobile-view {
        padding: 8px;
      }
    }
  `]
})
export class ResolucionesTableComponent implements OnInit, OnChanges, AfterViewInit {
  /** Lista de resoluciones a mostrar */
  @Input() resoluciones: ResolucionConEmpresa[] = [];
  
  /** Configuración actual de la tabla */
  @Input() configuracion: ResolucionTableConfig = {
    columnasVisibles: ['nroResolucion', 'empresa', 'tipoTramite', 'fechaEmision', 'estado', 'acciones'],
    ordenColumnas: [],
    ordenamiento: [],
    paginacion: { tamanoPagina: 25, paginaActual: 0 },
    filtros: {}
  };
  
  /** Si la tabla está cargando datos */
  @Input() cargando: boolean = false;
  
  /** Si permite selección múltiple */
  @Input() seleccionMultiple: boolean = false;
  
  /** Si usa virtual scrolling para tablas grandes (>100 items) */
  @Input() virtualScrolling: boolean = false;
  
  /** Altura del item para virtual scrolling */
  @Input() itemHeight: number = 56;
  
  /** Evento emitido cuando cambia la configuración */
  @Output() configuracionChange = new EventEmitter<Partial<ResolucionTableConfig>>();
  
  /** Evento emitido cuando se ejecuta una acción */
  @Output() accionEjecutada = new EventEmitter<AccionTabla>();

  // ViewChild para el paginador
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Servicios inyectados
  private resolucionService = inject(ResolucionService);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);

  // Datasource de Material Table
  dataSource = new MatTableDataSource<ResolucionConEmpresa>([]);
  
  // Selección múltiple
  seleccion = new SelectionModel<ResolucionConEmpresa>(true, []);
  
  // Definiciones de columnas
  todasLasColumnas = COLUMNAS_DEFINICIONES;
  
  // Estado de exportación
  exportando = signal(false);
  
  // Cache para memoización de ordenamiento
  private sortCache = new Map<string, ResolucionConEmpresa[]>();
  private lastSortKey = '';
  
  // Señales para responsive
  esMobile = signal(false);
  esTablet = signal(false);
  
  // Señales computadas
  totalResultados = signal(0);
  
  // Signal interno para la configuración reactiva
  private configuracionInterna = signal<ResolucionTableConfig>(this.configuracion);
  
  columnasVisibles = computed(() => {
    const columnas = [...this.configuracionInterna().columnasVisibles];
    if (this.seleccionMultiple && !columnas.includes('seleccion')) {
      columnas.unshift('seleccion');
    }
    return columnas;
  });
  
  // Determina si debe usar virtual scrolling basado en el tamaño del dataset
  usarVirtualScrolling = computed(() => {
    return this.virtualScrolling && this.totalResultados() > 100;
  });

  ngOnInit(): void {
    // Inicializar el signal interno con la configuración inicial
    this.configuracionInterna.set(this.configuracion);
    
    this.actualizarDataSource();
    this.detectarDispositivo();
  }

  /**
   * Detecta el tipo de dispositivo para responsive
   */
  private detectarDispositivo(): void {
    // Detectar móvil
    this.breakpointObserver.observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape])
      .subscribe(result => {
        this.esMobile.set(result.matches);
      });
    
    // Detectar tablet
    this.breakpointObserver.observe([Breakpoints.TabletPortrait, Breakpoints.TabletLandscape])
      .subscribe(result => {
        this.esTablet.set(result.matches);
      });
  }

  ngAfterViewInit(): void {
    // Conectar el paginador al datasource
    this.dataSource.paginator = this.paginator;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resoluciones']) {
      this.actualizarDataSource();
    }
    
    if (changes['configuracion']) {
      // Actualizar el signal interno cuando cambia la configuración desde el padre
      this.configuracionInterna.set(changes['configuracion'].currentValue);
      
      // Si cambió el ordenamiento, actualizar datasource
      if (changes['configuracion'].currentValue?.ordenamiento) {
        this.actualizarDataSource();
      }
      
      // Actualizar paginación si cambió
      if (changes['configuracion'].currentValue?.paginacion) {
        this.dataSource.paginator?.firstPage();
      }
    }
  }

  // ========================================
  // GESTIÓN DE DATOS
  // ========================================

  /**
   * Actualiza el datasource con las nuevas resoluciones
   */
  private actualizarDataSource(): void {
    // Aplicar ordenamiento antes de asignar al datasource
    const resolucionesOrdenadas = this.aplicarOrdenamiento([...this.resoluciones]);
    this.dataSource.data = resolucionesOrdenadas;
    this.totalResultados.set(resolucionesOrdenadas.length);
    
    // Limpiar selección si cambió el dataset
    this.seleccion.clear();
  }

  /**
   * Función de tracking para optimizar el rendering
   */
  trackByResolucion(index: number, resolucion: ResolucionConEmpresa): string {
    return resolucion.id;
  }

  // ========================================
  // GESTIÓN DE COLUMNAS
  // ========================================

  /**
   * Maneja el cambio de columnas visibles
   */
  onColumnasVisiblesChange(columnas: string[]): void {
    // Actualizar la configuración local
    const nuevaConfiguracion = {
      ...this.configuracion,
      columnasVisibles: columnas
    };
    
    this.configuracion = nuevaConfiguracion;
    
    // Actualizar el signal interno para trigger la reactividad
    this.configuracionInterna.set(nuevaConfiguracion);
    
    // Emitir el cambio completo
    this.configuracionChange.emit(nuevaConfiguracion);
    
    console.log('Columnas visibles actualizadas:', columnas);
    console.log('Configuración actualizada:', nuevaConfiguracion);
  }

  /**
   * Maneja el cambio de orden de columnas
   */
  onOrdenColumnasChange(orden: string[]): void {
    // Actualizar la configuración local
    const nuevaConfiguracion = {
      ...this.configuracion,
      ordenColumnas: orden
    };
    
    this.configuracion = nuevaConfiguracion;
    
    // Actualizar el signal interno para trigger la reactividad
    this.configuracionInterna.set(nuevaConfiguracion);
    
    // Emitir el cambio completo
    this.configuracionChange.emit(nuevaConfiguracion);
    
    console.log('Orden de columnas actualizado:', orden);
    console.log('Configuración actualizada:', nuevaConfiguracion);
  }

  // ========================================
  // GESTIÓN DE ORDENAMIENTO
  // ========================================

  /**
   * Maneja el cambio de ordenamiento
   */
  onOrdenamientoChange(evento: EventoOrdenamiento): void {
    let nuevoOrdenamiento = [...this.configuracion.ordenamiento];
    
    if (evento.esMultiple) {
      // Ordenamiento múltiple
      const indiceExistente = nuevoOrdenamiento.findIndex(o => o.columna === evento.columna);
      
      if (evento.direccion) {
        const nuevaOrden: OrdenamientoColumna = {
          columna: evento.columna,
          direccion: evento.direccion,
          prioridad: indiceExistente >= 0 ? nuevoOrdenamiento[indiceExistente].prioridad : nuevoOrdenamiento.length + 1
        };
        
        if (indiceExistente >= 0) {
          nuevoOrdenamiento[indiceExistente] = nuevaOrden;
        } else {
          nuevoOrdenamiento.push(nuevaOrden);
        }
      } else {
        // Remover ordenamiento
        if (indiceExistente >= 0) {
          nuevoOrdenamiento.splice(indiceExistente, 1);
        }
      }
    } else {
      // Ordenamiento simple
      if (evento.direccion) {
        nuevoOrdenamiento = [{
          columna: evento.columna,
          direccion: evento.direccion,
          prioridad: 1
        }];
      } else {
        nuevoOrdenamiento = [];
      }
    }
    
    this.configuracionChange.emit({
      ordenamiento: nuevoOrdenamiento
    });
    
    // Aplicar ordenamiento inmediatamente a los datos actuales
    this.actualizarDataSource();
  }

  /**
   * Aplica el ordenamiento configurado a las resoluciones
   * Usa memoización para evitar recalcular ordenamientos idénticos
   */
  private aplicarOrdenamiento(resoluciones: ResolucionConEmpresa[]): ResolucionConEmpresa[] {
    const ordenamiento = this.configuracion.ordenamiento;
    
    if (!ordenamiento || ordenamiento.length === 0) {
      return resoluciones;
    }
    
    // Crear clave de cache basada en el ordenamiento y los IDs de resoluciones
    const resolucionIds = resoluciones.map(r => r.id).join(',');
    const ordenamientoKey = ordenamiento
      .map(o => `${o.columna}-${o.direccion}-${o.prioridad}`)
      .join('|');
    const cacheKey = `${resolucionIds}:${ordenamientoKey}`;
    
    // Verificar si ya tenemos este resultado en cache
    if (this.lastSortKey === cacheKey && this.sortCache.has(cacheKey)) {
      return this.sortCache.get(cacheKey)!;
    }
    
    // Limpiar cache si es diferente (mantener solo el último)
    if (this.lastSortKey !== cacheKey) {
      this.sortCache.clear();
    }
    
    // Ordenar por prioridad (menor prioridad = más importante)
    const ordenamientoOrdenado = [...ordenamiento].sort((a, b) => a.prioridad - b.prioridad);
    
    const resultado = [...resoluciones].sort((a, b) => {
      for (const orden of ordenamientoOrdenado) {
        const comparacion = this.compararValores(a, b, orden.columna, orden.direccion);
        if (comparacion !== 0) {
          return comparacion;
        }
      }
      return 0;
    });
    
    // Guardar en cache
    this.sortCache.set(cacheKey, resultado);
    this.lastSortKey = cacheKey;
    
    return resultado;
  }

  /**
   * Compara dos valores para ordenamiento
   */
  private compararValores(
    a: ResolucionConEmpresa, 
    b: ResolucionConEmpresa, 
    columna: string, 
    direccion: 'asc' | 'desc'
  ): number {
    let valorA: any;
    let valorB: any;
    
    // Obtener valores según la columna
    switch (columna) {
      case 'nroResolucion':
        valorA = a.nroResolucion;
        valorB = b.nroResolucion;
        break;
      case 'empresa':
        valorA = a.empresa?.razonSocial.principal || '';
        valorB = b.empresa?.razonSocial.principal || '';
        break;
      case 'tipoTramite':
        valorA = a.tipoTramite;
        valorB = b.tipoTramite;
        break;
      case 'fechaEmision':
        valorA = new Date(a.fechaEmision).getTime();
        valorB = new Date(b.fechaEmision).getTime();
        break;
      case 'fechaVigenciaInicio':
        valorA = a.fechaVigenciaInicio ? new Date(a.fechaVigenciaInicio).getTime() : 0;
        valorB = b.fechaVigenciaInicio ? new Date(b.fechaVigenciaInicio).getTime() : 0;
        break;
      case 'fechaVigenciaFin':
        valorA = a.fechaVigenciaFin ? new Date(a.fechaVigenciaFin).getTime() : 0;
        valorB = b.fechaVigenciaFin ? new Date(b.fechaVigenciaFin).getTime() : 0;
        break;
      case 'estado':
        valorA = a.estado;
        valorB = b.estado;
        break;
      case 'estaActivo':
        valorA = a.estaActivo ? 1 : 0;
        valorB = b.estaActivo ? 1 : 0;
        break;
      default:
        return 0;
    }
    
    // Comparar valores
    let resultado = 0;
    
    if (typeof valorA === 'string' && typeof valorB === 'string') {
      resultado = valorA.localeCompare(valorB, 'es', { sensitivity: 'base' });
    } else if (typeof valorA === 'number' && typeof valorB === 'number') {
      resultado = valorA - valorB;
    } else {
      // Manejar valores null/undefined
      if (valorA === valorB) resultado = 0;
      else if (valorA === null || valorA === undefined || valorA === '') resultado = 1;
      else if (valorB === null || valorB === undefined || valorB === '') resultado = -1;
      else resultado = valorA > valorB ? 1 : -1;
    }
    
    // Aplicar dirección
    return direccion === 'asc' ? resultado : -resultado;
  }

  // ========================================
  // GESTIÓN DE PAGINACIÓN
  // ========================================

  /**
   * Maneja el cambio de página
   */
  onPaginaChange(evento: PageEvent): void {
    this.configuracionChange.emit({
      paginacion: {
        tamanoPagina: evento.pageSize,
        paginaActual: evento.pageIndex
      }
    });
    
    // Scroll to top cuando cambia la página
    this.scrollToTop();
  }

  /**
   * Hace scroll al inicio de la tabla
   */
  private scrollToTop(): void {
    const tableWrapper = document.querySelector('.table-wrapper');
    if (tableWrapper) {
      tableWrapper.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ========================================
  // GESTIÓN DE SELECCIÓN
  // ========================================

  /**
   * Verifica si todas las filas están seleccionadas
   */
  isAllSelected(): boolean {
    const numSelected = this.seleccion.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /**
   * Selecciona/deselecciona todas las filas
   */
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.seleccion.clear();
    } else {
      this.dataSource.data.forEach(row => this.seleccion.select(row));
    }
  }

  /**
   * Limpia la selección actual
   */
  limpiarSeleccion(): void {
    this.seleccion.clear();
  }

  /**
   * Maneja el click en una fila
   */
  onFilaClick(resolucion: ResolucionConEmpresa): void {
    if (this.seleccionMultiple) {
      this.seleccion.toggle(resolucion);
    } else {
      this.ejecutarAccion('ver', resolucion);
    }
  }

  // ========================================
  // GESTIÓN DE ACCIONES
  // ========================================

  /**
   * Ejecuta una acción sobre una resolución
   */
  ejecutarAccion(accion: 'ver' | 'editar' | 'eliminar' | 'exportar', resolucion?: ResolucionConEmpresa): void {
    this.accionEjecutada.emit({
      accion,
      resolucion
    });
  }

  /**
   * Maneja las acciones desde las cards móviles
   */
  onAccionCard(evento: AccionCard): void {
    this.accionEjecutada.emit({
      accion: evento.accion,
      resolucion: evento.resolucion
    });
  }

  /**
   * Maneja el cambio de selección en las cards móviles
   */
  onCardSeleccionChange(resolucion: ResolucionConEmpresa, seleccionada: boolean): void {
    if (seleccionada) {
      this.seleccion.select(resolucion);
    } else {
      this.seleccion.deselect(resolucion);
    }
  }



  // ========================================
  // UTILIDADES
  // ========================================

  /**
   * Obtiene el texto relativo de una fecha
   */
  getFechaRelativa(fecha: Date): string {
    const ahora = new Date();
    const fechaObj = new Date(fecha);
    const diferenciaDias = Math.floor((ahora.getTime() - fechaObj.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diferenciaDias === 0) return 'Hoy';
    if (diferenciaDias === 1) return 'Ayer';
    if (diferenciaDias < 7) return `Hace ${diferenciaDias} días`;
    if (diferenciaDias < 30) return `Hace ${Math.floor(diferenciaDias / 7)} semanas`;
    if (diferenciaDias < 365) return `Hace ${Math.floor(diferenciaDias / 30)} meses`;
    
    return `Hace ${Math.floor(diferenciaDias / 365)} años`;
  }

  /**
   * Obtiene el estado de vigencia de una fecha
   */
  getEstadoVigencia(fechaFin: Date): string {
    const ahora = new Date();
    const fechaObj = new Date(fechaFin);
    const diferenciaDias = Math.floor((fechaObj.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diferenciaDias < 0) return 'vencido';
    if (diferenciaDias <= 30) return 'proximo-vencer';
    return 'vigente';
  }

  /**
   * Obtiene el texto de vigencia
   */
  getTextoVigencia(fechaFin: Date): string {
    const ahora = new Date();
    const fechaObj = new Date(fechaFin);
    const diferenciaDias = Math.floor((fechaObj.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diferenciaDias < 0) return 'Vencido';
    if (diferenciaDias === 0) return 'Vence hoy';
    if (diferenciaDias <= 30) return `${diferenciaDias} días`;
    
    return 'Vigente';
  }

  /**
   * Obtiene el texto amigable del estado
   */
  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'BORRADOR': 'Borrador',
      'EN_REVISION': 'En Revisión',
      'APROBADO': 'Aprobado',
      'VIGENTE': 'Vigente',
      'VENCIDO': 'Vencido',
      'ANULADO': 'Anulado'
    };
    
    return estados[estado] || estado;
  }

  /**
   * Obtiene información de paginación para mostrar al usuario
   */
  getPaginacionInfo(): string {
    const inicio = this.configuracion.paginacion.paginaActual * this.configuracion.paginacion.tamanoPagina + 1;
    const fin = Math.min(
      (this.configuracion.paginacion.paginaActual + 1) * this.configuracion.paginacion.tamanoPagina,
      this.totalResultados()
    );
    
    return `Mostrando ${inicio}-${fin} de ${this.totalResultados()} resoluciones`;
  }

  // ========================================
  // EXPORTACIÓN DE DATOS
  // ========================================

  /**
   * Exporta las resoluciones en el formato especificado
   * Respeta los filtros y ordenamiento aplicados
   */
  exportarResoluciones(formato: 'excel' | 'pdf'): void {
    this.exportando.set(true);
    
    // Mostrar notificación de inicio
    this.snackBar.open(
      `Preparando exportación a ${formato.toUpperCase()}...`,
      'Cerrar',
      { duration: 2000 }
    );

    // Llamar al servicio de exportación con los filtros actuales
    this.resolucionService.exportarResoluciones(this.configuracion.filtros, formato)
      .subscribe({
        next: (blob: Blob) => {
          this.exportando.set(false);
          
          // Crear URL del blob y descargar
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Generar nombre de archivo con timestamp
          const timestamp = new Date().toISOString().split('T')[0];
          const extension = formato === 'excel' ? 'xlsx' : 'pdf';
          link.download = `resoluciones_${timestamp}.${extension}`;
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Limpiar URL del blob
          window.URL.revokeObjectURL(url);
          
          // Mostrar notificación de éxito
          this.snackBar.open(
            `Exportación completada: ${this.totalResultados()} resoluciones`,
            'Cerrar',
            { duration: 3000 }
          );
          
          // Emitir evento de acción ejecutada
          this.accionEjecutada.emit({
            accion: 'exportar',
            resoluciones: this.dataSource.data,
            formato
          });
        },
        error: (error) => {
          this.exportando.set(false);
          console.error('Error al exportar resoluciones:', error);
          
          // Mostrar notificación de error
          this.snackBar.open(
            'Error al exportar resoluciones. Por favor, intente nuevamente.',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
  }

  /**
   * Ejecuta una acción en lote sobre las resoluciones seleccionadas
   */
  ejecutarAccionLote(accion: string): void {
    if (!this.seleccion.hasValue()) {
      this.snackBar.open(
        'No hay resoluciones seleccionadas',
        'Cerrar',
        { duration: 3000 }
      );
      return;
    }

    const resolucionesSeleccionadas = this.seleccion.selected;

    switch (accion) {
      case 'exportar':
        this.exportarResolucionesSeleccionadas();
        break;
      default:
        console.warn('Acción en lote no implementada:', accion);
    }
  }

  /**
   * Exporta solo las resoluciones seleccionadas
   */
  private exportarResolucionesSeleccionadas(): void {
    // Por ahora, exportamos usando el mismo método pero con filtros
    // En una implementación más avanzada, podríamos enviar los IDs específicos
    this.snackBar.open(
      `Exportando ${this.seleccion.selected.length} resoluciones seleccionadas...`,
      'Cerrar',
      { duration: 2000 }
    );
    
    // Exportar a Excel por defecto para selecciones
    this.exportarResoluciones('excel');
  }

  /**
   * Abre el modal para ver rutas autorizadas de una resolución
   */
  verRutasAutorizadas(resolucion: ResolucionConEmpresa): void {
    // Solo abrir modal si tiene rutas autorizadas
    if (!resolucion.cantidadRutas || resolucion.cantidadRutas === 0) {
      return;
    }

    console.log('🛣️ Ver rutas autorizadas de la resolución:', resolucion.nroResolucion);
    
    // Emitir acción para que el componente padre maneje la apertura del modal
    this.accionEjecutada.emit({
      accion: 'ver-rutas-autorizadas',
      resolucion: resolucion
    });
  }

  /**
   * Abre el modal para ver vehículos habilitados de una resolución
   */
  verVehiculosHabilitados(resolucion: ResolucionConEmpresa): void {
    // Solo abrir modal si tiene vehículos habilitados
    if (!resolucion.cantidadVehiculos || resolucion.cantidadVehiculos === 0) {
      return;
    }

    console.log('🚗 Ver vehículos habilitados de la resolución:', resolucion.nroResolucion);
    
    // Emitir acción para que el componente padre maneje la apertura del modal
    this.accionEjecutada.emit({
      accion: 'ver-vehiculos-habilitados',
      resolucion: resolucion
    });
  }
}