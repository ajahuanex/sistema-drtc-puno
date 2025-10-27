import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ColumnaDefinicion } from '../models/resolucion-table.model';
import { SmartIconComponent } from './smart-icon.component';

export interface ColumnaSeleccionable extends ColumnaDefinicion {
  visible: boolean;
  orden: number;
}

/**
 * Componente para seleccionar y reordenar columnas de tabla
 * 
 * @example
 * ```html
 * <app-column-selector
 *   [columnas]="definicionesColumnas"
 *   [columnasVisibles]="columnasActuales"
 *   (columnasChange)="onColumnasChange($event)"
 *   (ordenChange)="onOrdenChange($event)">
 * </app-column-selector>
 * ```
 */
@Component({
  selector: 'app-column-selector',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatListModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
    SmartIconComponent
  ],
  template: `
    <button mat-icon-button 
            [matMenuTriggerFor]="columnMenu"
            matTooltip="Configurar columnas"
            class="column-selector-trigger">
      <app-smart-icon iconName="view_column" [size]="20"></app-smart-icon>
    </button>

    <mat-menu #columnMenu="matMenu" class="column-menu" [hasBackdrop]="true">
      <div class="column-selector-content" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="column-header">
          <h3 class="column-title">
            <app-smart-icon iconName="view_column" [size]="18"></app-smart-icon>
            Configurar Columnas
          </h3>
          <p class="column-subtitle">
            Seleccione las columnas a mostrar y arrástrelas para reordenar
          </p>
        </div>

        <mat-divider></mat-divider>

        <!-- Lista de columnas con drag & drop -->
        <div class="columns-list-container">
          <div class="columns-list-header">
            <span class="list-title">Columnas Disponibles</span>
            <span class="visible-count">{{ contadorVisibles() }} de {{ columnasOrdenadas().length }}</span>
          </div>

          <div class="columns-list" 
               cdkDropList 
               (cdkDropListDropped)="onColumnDrop($event)">
            
            @for (columna of columnasOrdenadas(); track columna.key) {
              <div class="column-item" 
                   cdkDrag
                   [class.column-required]="columna.required"
                   [class.column-visible]="columna.visible">
                
                <!-- Drag handle -->
                <div class="drag-handle" cdkDragHandle>
                  <app-smart-icon iconName="drag_indicator" [size]="16"></app-smart-icon>
                </div>

                <!-- Checkbox -->
                <mat-checkbox 
                  [checked]="columna.visible"
                  [disabled]="columna.required"
                  (change)="onColumnToggle(columna.key, $event.checked)"
                  class="column-checkbox">
                </mat-checkbox>

                <!-- Información de la columna -->
                <div class="column-info">
                  <div class="column-label">
                    {{ columna.label }}
                    @if (columna.required) {
                      <span class="required-badge">Requerida</span>
                    }
                  </div>
                  <div class="column-details">
                    <span class="column-type">{{ getTipoTexto(columna.tipo) }}</span>
                    @if (columna.width) {
                      <span class="column-width">{{ columna.width }}</span>
                    }
                  </div>
                </div>

                <!-- Indicador de visibilidad -->
                <div class="visibility-indicator">
                  @if (columna.visible) {
                    <app-smart-icon iconName="visibility" [size]="16" class="visible-icon"></app-smart-icon>
                  } @else {
                    <app-smart-icon iconName="visibility_off" [size]="16" class="hidden-icon"></app-smart-icon>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Acciones rápidas -->
        <div class="quick-actions">
          <div class="quick-actions-title">Acciones Rápidas</div>
          <div class="quick-buttons">
            <button mat-stroked-button 
                    (click)="mostrarTodas()"
                    [disabled]="todasVisibles()"
                    class="quick-button">
              <app-smart-icon iconName="visibility" [size]="16"></app-smart-icon>
              Mostrar Todas
            </button>
            
            <button mat-stroked-button 
                    (click)="mostrarMinimas()"
                    [disabled]="soloMinimas()"
                    class="quick-button">
              <app-smart-icon iconName="view_agenda" [size]="16"></app-smart-icon>
              Solo Esenciales
            </button>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Botones de acción -->
        <div class="column-actions">
          <button mat-button 
                  (click)="restaurarDefecto()"
                  class="action-button secondary">
            <app-smart-icon iconName="restore" [size]="16"></app-smart-icon>
            Restaurar
          </button>
          
          <button mat-raised-button 
                  color="primary"
                  (click)="aplicarCambios()"
                  [disabled]="!hayCambios()"
                  class="action-button primary">
            <app-smart-icon iconName="check" [size]="16"></app-smart-icon>
            Aplicar
          </button>
        </div>
      </div>
    </mat-menu>
  `,
  styles: [`
    .column-selector-trigger {
      color: rgba(0, 0, 0, 0.6);
    }

    .column-selector-trigger:hover {
      color: #1976d2;
      background-color: rgba(25, 118, 210, 0.04);
    }

    .column-menu {
      max-width: none !important;
    }

    .column-selector-content {
      width: 400px;
      max-height: 600px;
      padding: 0;
      overflow: hidden;
    }

    .column-header {
      padding: 16px;
      background-color: #f5f5f5;
    }

    .column-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 500;
      color: #1976d2;
    }

    .column-subtitle {
      margin: 0;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.4;
    }

    .columns-list-container {
      padding: 16px;
      max-height: 300px;
      overflow-y: auto;
    }

    .columns-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .list-title {
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.8);
    }

    .visible-count {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      background-color: #e3f2fd;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .columns-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .column-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      background-color: white;
      transition: all 0.2s ease;
      cursor: move;
    }

    .column-item:hover {
      border-color: #1976d2;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .column-item.column-visible {
      background-color: #f3f9ff;
      border-color: #1976d2;
    }

    .column-item.column-required {
      background-color: #fff3e0;
      border-color: #ff9800;
    }

    .column-item.cdk-drag-preview {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      transform: rotate(2deg);
    }

    .column-item.cdk-drag-placeholder {
      opacity: 0.4;
      border-style: dashed;
    }

    .drag-handle {
      color: rgba(0, 0, 0, 0.4);
      cursor: grab;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .column-checkbox {
      margin: 0;
    }

    .column-info {
      flex: 1;
      min-width: 0;
    }

    .column-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.8);
      margin-bottom: 2px;
    }

    .required-badge {
      font-size: 10px;
      padding: 1px 6px;
      background-color: #ff9800;
      color: white;
      border-radius: 8px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .column-details {
      display: flex;
      gap: 8px;
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
    }

    .column-type {
      text-transform: capitalize;
    }

    .column-width {
      font-family: monospace;
    }

    .visibility-indicator {
      display: flex;
      align-items: center;
    }

    .visible-icon {
      color: #4caf50;
    }

    .hidden-icon {
      color: rgba(0, 0, 0, 0.3);
    }

    .quick-actions {
      padding: 12px 16px;
      background-color: #fafafa;
    }

    .quick-actions-title {
      font-size: 12px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
    }

    .quick-buttons {
      display: flex;
      gap: 8px;
    }

    .quick-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 11px;
      padding: 6px 12px;
      min-height: 32px;
    }

    .column-actions {
      display: flex;
      gap: 8px;
      padding: 16px;
      background-color: white;
    }

    .action-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .action-button.secondary {
      color: rgba(0, 0, 0, 0.6);
    }

    /* Scrollbar personalizado */
    .columns-list-container::-webkit-scrollbar {
      width: 6px;
    }

    .columns-list-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .columns-list-container::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .columns-list-container::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .column-selector-content {
        width: 320px;
      }
      
      .quick-buttons {
        flex-direction: column;
      }
      
      .column-actions {
        flex-direction: column;
      }
    }
  `]
})
export class ColumnSelectorComponent implements OnInit {
  /** Definiciones de todas las columnas disponibles */
  @Input() columnas: ColumnaDefinicion[] = [];
  
  /** Columnas actualmente visibles */
  @Input() columnasVisibles: string[] = [];
  
  /** Orden actual de las columnas */
  @Input() ordenColumnas: string[] = [];
  
  /** Evento emitido cuando cambian las columnas visibles */
  @Output() columnasChange = new EventEmitter<string[]>();
  
  /** Evento emitido cuando cambia el orden de las columnas */
  @Output() ordenChange = new EventEmitter<string[]>();

  // Estado interno
  columnasOrdenadas = signal<ColumnaSeleccionable[]>([]);
  contadorVisibles = signal(0);
  
  // Estado inicial para detectar cambios
  private estadoInicial: { visibles: string[], orden: string[] } = { visibles: [], orden: [] };

  ngOnInit(): void {
    this.inicializarColumnas();
    this.guardarEstadoInicial();
  }

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  /**
   * Inicializa las columnas con su estado de visibilidad y orden
   */
  private inicializarColumnas(): void {
    const orden = this.ordenColumnas.length > 0 ? this.ordenColumnas : this.columnas.map(c => c.key);
    
    const columnasConEstado: ColumnaSeleccionable[] = orden.map((key, index) => {
      const definicion = this.columnas.find(c => c.key === key);
      if (!definicion) {
        console.warn(`Columna no encontrada: ${key}`);
        return null;
      }
      
      return {
        ...definicion,
        visible: this.columnasVisibles.includes(key),
        orden: index
      };
    }).filter(Boolean) as ColumnaSeleccionable[];

    // Agregar columnas que no están en el orden pero sí en las definiciones
    const columnasEnOrden = new Set(orden);
    this.columnas.forEach(columna => {
      if (!columnasEnOrden.has(columna.key)) {
        columnasConEstado.push({
          ...columna,
          visible: this.columnasVisibles.includes(columna.key),
          orden: columnasConEstado.length
        });
      }
    });

    this.columnasOrdenadas.set(columnasConEstado);
    this.actualizarContador();
  }

  /**
   * Guarda el estado inicial para detectar cambios
   */
  private guardarEstadoInicial(): void {
    this.estadoInicial = {
      visibles: [...this.columnasVisibles],
      orden: [...this.ordenColumnas]
    };
  }

  // ========================================
  // GESTIÓN DE COLUMNAS
  // ========================================

  /**
   * Maneja el toggle de visibilidad de una columna
   */
  onColumnToggle(key: string, visible: boolean): void {
    const columnas = this.columnasOrdenadas();
    const columnaIndex = columnas.findIndex(c => c.key === key);
    
    if (columnaIndex >= 0) {
      const nuevasColumnas = [...columnas];
      nuevasColumnas[columnaIndex] = { ...nuevasColumnas[columnaIndex], visible };
      
      this.columnasOrdenadas.set(nuevasColumnas);
      this.actualizarContador();
    }
  }

  /**
   * Maneja el reordenamiento por drag & drop
   */
  onColumnDrop(event: CdkDragDrop<ColumnaSeleccionable[]>): void {
    const columnas = [...this.columnasOrdenadas()];
    moveItemInArray(columnas, event.previousIndex, event.currentIndex);
    
    // Actualizar el orden
    columnas.forEach((columna, index) => {
      columna.orden = index;
    });
    
    this.columnasOrdenadas.set(columnas);
  }

  // ========================================
  // ACCIONES RÁPIDAS
  // ========================================

  /**
   * Muestra todas las columnas
   */
  mostrarTodas(): void {
    const columnas = this.columnasOrdenadas().map(c => ({ ...c, visible: true }));
    this.columnasOrdenadas.set(columnas);
    this.actualizarContador();
  }

  /**
   * Muestra solo las columnas esenciales (requeridas)
   */
  mostrarMinimas(): void {
    const columnas = this.columnasOrdenadas().map(c => ({ 
      ...c, 
      visible: c.required 
    }));
    this.columnasOrdenadas.set(columnas);
    this.actualizarContador();
  }

  /**
   * Restaura la configuración por defecto
   */
  restaurarDefecto(): void {
    this.inicializarColumnas();
  }

  /**
   * Aplica los cambios realizados
   */
  aplicarCambios(): void {
    const columnas = this.columnasOrdenadas();
    
    const nuevasVisibles = columnas
      .filter(c => c.visible)
      .map(c => c.key);
    
    const nuevoOrden = columnas
      .sort((a, b) => a.orden - b.orden)
      .map(c => c.key);
    
    this.columnasChange.emit(nuevasVisibles);
    this.ordenChange.emit(nuevoOrden);
    
    // Actualizar estado inicial
    this.estadoInicial = {
      visibles: [...nuevasVisibles],
      orden: [...nuevoOrden]
    };
  }

  // ========================================
  // UTILIDADES Y ESTADO
  // ========================================

  /**
   * Actualiza el contador de columnas visibles
   */
  private actualizarContador(): void {
    const visibles = this.columnasOrdenadas().filter(c => c.visible).length;
    this.contadorVisibles.set(visibles);
  }

  /**
   * Verifica si todas las columnas están visibles
   */
  todasVisibles(): boolean {
    return this.columnasOrdenadas().every(c => c.visible);
  }

  /**
   * Verifica si solo están visibles las columnas mínimas
   */
  soloMinimas(): boolean {
    const columnas = this.columnasOrdenadas();
    return columnas.every(c => c.visible === c.required);
  }

  /**
   * Verifica si hay cambios pendientes
   */
  hayCambios(): boolean {
    const columnas = this.columnasOrdenadas();
    
    const visiblesActuales = columnas
      .filter(c => c.visible)
      .map(c => c.key)
      .sort();
    
    const ordenActual = columnas
      .sort((a, b) => a.orden - b.orden)
      .map(c => c.key);
    
    const visiblesIniciales = [...this.estadoInicial.visibles].sort();
    const ordenInicial = this.estadoInicial.orden;
    
    return JSON.stringify(visiblesActuales) !== JSON.stringify(visiblesIniciales) ||
           JSON.stringify(ordenActual) !== JSON.stringify(ordenInicial);
  }

  /**
   * Obtiene el texto descriptivo del tipo de columna
   */
  getTipoTexto(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'text': 'Texto',
      'date': 'Fecha',
      'badge': 'Estado',
      'actions': 'Acciones',
      'empresa': 'Empresa'
    };
    
    return tipos[tipo] || tipo;
  }
}