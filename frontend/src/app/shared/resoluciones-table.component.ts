import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
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

export interface AccionTabla {
  accion: 'ver' | 'editar' | 'eliminar' | 'exportar' | 'seleccionar';
  resolucion?: ResolucionConEmpresa;
  resoluciones?: ResolucionConEmpresa[];
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
    MatCheckboxModule,
    ColumnSelectorComponent,
    SortableHeaderComponent,
    SmartIconComponent
  ],
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
          
          <!-- Botón de exportar todo -->
          <button mat-icon-button 
                  (click)="ejecutarAccion('exportar')"
                  matTooltip="Exportar todas las resoluciones"
                  class="export-button">
            <app-smart-icon iconName="file_download" [size]="20"></app-smart-icon>
          </button>
        </div>
      </div>

      <!-- Tabla -->
      <div class="table-wrapper" [class.loading]="cargando">
        @if (cargando) {
          <div class="loading-overlay">
            <mat-spinner diameter="40"></mat-spinner>
            <span>Cargando resoluciones...</span>
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
            *matRowDef="let resolucion; columns: columnasVisibles(); let i = index; trackBy: trackByResolucion" 
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
          <div class="no-results">
            <app-smart-icon iconName="search_off" [size]="48"></app-smart-icon>
            <h3>No se encontraron resoluciones</h3>
            <p>No hay resoluciones que coincidan con los criterios de búsqueda.</p>
          </div>
        }
      </div>

      <!-- Paginador -->
      @if (dataSource.data.length > 0) {
        <mat-paginator 
          [length]="totalResultados()"
          [pageSize]="configuracion.paginacion.tamanoPagina"
          [pageIndex]="configuracion.paginacion.paginaActual"
          [pageSizeOptions]="[10, 25, 50, 100]"
          [showFirstLastButtons]="true"
          (page)="onPaginaChange($event)"
          class="table-paginator">
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

    .table-wrapper {
      flex: 1;
      position: relative;
      overflow: auto;
    }

    .table-wrapper.loading {
      pointer-events: none;
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

    .loading-overlay span {
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
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

    .table-paginator {
      border-top: 1px solid #e0e0e0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .table-toolbar {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }
      
      .toolbar-left,
      .toolbar-right {
        justify-content: space-between;
      }
      
      .bulk-actions {
        margin-right: 0;
        padding-right: 0;
        border-right: none;
      }
      
      .empresa-column,
      .fecha-column {
        min-width: 120px;
      }
      
      .acciones-buttons {
        flex-direction: column;
        gap: 2px;
      }
    }
  `]
})
export class ResolucionesTableComponent implements OnInit, OnChanges {
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
  
  /** Evento emitido cuando cambia la configuración */
  @Output() configuracionChange = new EventEmitter<Partial<ResolucionTableConfig>>();
  
  /** Evento emitido cuando se ejecuta una acción */
  @Output() accionEjecutada = new EventEmitter<AccionTabla>();

  // Datasource de Material Table
  dataSource = new MatTableDataSource<ResolucionConEmpresa>([]);
  
  // Selección múltiple
  seleccion = new SelectionModel<ResolucionConEmpresa>(true, []);
  
  // Definiciones de columnas
  todasLasColumnas = COLUMNAS_DEFINICIONES;
  
  // Señales computadas
  totalResultados = signal(0);
  columnasVisibles = computed(() => {
    const columnas = [...this.configuracion.columnasVisibles];
    if (this.seleccionMultiple && !columnas.includes('seleccion')) {
      columnas.unshift('seleccion');
    }
    return columnas;
  });

  ngOnInit(): void {
    this.actualizarDataSource();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resoluciones']) {
      this.actualizarDataSource();
    }
    
    if (changes['configuracion']) {
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
    this.dataSource.data = this.resoluciones;
    this.totalResultados.set(this.resoluciones.length);
    
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
    this.configuracionChange.emit({
      columnasVisibles: columnas
    });
  }

  /**
   * Maneja el cambio de orden de columnas
   */
  onOrdenColumnasChange(orden: string[]): void {
    this.configuracionChange.emit({
      ordenColumnas: orden
    });
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
   * Ejecuta una acción en lote sobre las resoluciones seleccionadas
   */
  ejecutarAccionLote(accion: 'exportar'): void {
    if (this.seleccion.hasValue()) {
      this.accionEjecutada.emit({
        accion,
        resoluciones: this.seleccion.selected
      });
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
}