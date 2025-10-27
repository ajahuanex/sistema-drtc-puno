import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrdenamientoColumna } from '../models/resolucion-table.model';
import { SmartIconComponent } from './smart-icon.component';

export type DireccionOrdenamiento = 'asc' | 'desc' | null;

export interface EventoOrdenamiento {
  columna: string;
  direccion: DireccionOrdenamiento;
  esMultiple: boolean;
}

/**
 * Componente de header ordenable para tablas
 * 
 * @example
 * ```html
 * <app-sortable-header
 *   columna="fechaEmision"
 *   label="Fecha de Emisión"
 *   [ordenamiento]="ordenamientoActual"
 *   [sortable]="true"
 *   (ordenamientoChange)="onOrdenamientoChange($event)">
 * </app-sortable-header>
 * ```
 */
@Component({
  selector: 'app-sortable-header',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTooltipModule,
    SmartIconComponent
  ],
  template: `
    <button 
      mat-button
      class="sortable-header"
      [class.sortable]="sortable"
      [class.sorted]="estOrdenado()"
      [class.sorted-asc]="direccionActual() === 'asc'"
      [class.sorted-desc]="direccionActual() === 'desc'"
      [class.multiple-sort]="esOrdenamientoMultiple()"
      [disabled]="!sortable"
      [matTooltip]="getTooltip()"
      [attr.aria-label]="getAriaLabel()"
      [attr.aria-sort]="getAriaSort()"
      [attr.aria-describedby]="columna + '-sort-description'"
      role="columnheader"
      tabindex="0"
      (click)="onHeaderClick($event)"
      (keydown.enter)="onHeaderClick($event)"
      (keydown.space)="onHeaderClick($event)">
      
      <div class="header-content">
        <!-- Etiqueta de la columna -->
        <span class="header-label">{{ label }}</span>
        
        <!-- Indicadores de ordenamiento -->
        @if (sortable) {
          <div class="sort-indicators">
            <!-- Prioridad en ordenamiento múltiple -->
            @if (esOrdenamientoMultiple() && prioridadOrdenamiento() > 0) {
              <span class="sort-priority">{{ prioridadOrdenamiento() }}</span>
            }
            
            <!-- Iconos de ordenamiento -->
            <div class="sort-icons">
              @if (direccionActual() === 'asc') {
                <app-smart-icon 
                  iconName="keyboard_arrow_up" 
                  [size]="18"
                  class="sort-icon active">
                </app-smart-icon>
              } @else if (direccionActual() === 'desc') {
                <app-smart-icon 
                  iconName="keyboard_arrow_down" 
                  [size]="18"
                  class="sort-icon active">
                </app-smart-icon>
              } @else {
                <div class="sort-icon-stack">
                  <app-smart-icon 
                    iconName="keyboard_arrow_up" 
                    [size]="14"
                    class="sort-icon inactive up">
                  </app-smart-icon>
                  <app-smart-icon 
                    iconName="keyboard_arrow_down" 
                    [size]="14"
                    class="sort-icon inactive down">
                  </app-smart-icon>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </button>
  `,
  styles: [`
    .sortable-header {
      width: 100%;
      height: 48px;
      padding: 0 12px;
      border: none;
      background: transparent;
      text-align: left;
      font-weight: 500;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.7);
      border-radius: 0;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .sortable-header:not([disabled]) {
      cursor: pointer;
    }

    .sortable-header:not([disabled]):hover {
      background-color: rgba(0, 0, 0, 0.04);
      color: #1976d2;
    }

    .sortable-header:not([disabled]):focus {
      background-color: rgba(25, 118, 210, 0.08);
      outline: 2px solid #1976d2;
      outline-offset: -2px;
    }

    .sortable-header.sorted {
      color: #1976d2;
      background-color: rgba(25, 118, 210, 0.04);
    }

    .sortable-header.sorted:hover {
      background-color: rgba(25, 118, 210, 0.08);
    }

    .sortable-header.multiple-sort {
      background-color: rgba(25, 118, 210, 0.06);
    }

    .sortable-header.multiple-sort.sorted {
      background-color: rgba(25, 118, 210, 0.1);
    }

    .sortable-header[disabled] {
      cursor: default;
      color: rgba(0, 0, 0, 0.5);
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 8px;
    }

    .header-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: inherit;
    }

    .sort-indicators {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .sort-priority {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      background-color: #1976d2;
      color: white;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 600;
      line-height: 1;
    }

    .sort-icons {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
    }

    .sort-icon {
      transition: all 0.2s ease;
    }

    .sort-icon.active {
      color: #1976d2;
    }

    .sort-icon.inactive {
      color: rgba(0, 0, 0, 0.3);
    }

    .sort-icon-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: -2px;
    }

    .sort-icon-stack .up {
      margin-bottom: -4px;
    }

    .sort-icon-stack .down {
      margin-top: -4px;
    }

    /* Hover effects para iconos inactivos */
    .sortable-header:not([disabled]):hover .sort-icon.inactive {
      color: rgba(25, 118, 210, 0.6);
    }

    /* Animaciones */
    .sort-icon.active {
      animation: sortIconPulse 0.3s ease;
    }

    @keyframes sortIconPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    /* Estados de focus para accesibilidad */
    .sortable-header:focus-visible {
      outline: 2px solid #1976d2;
      outline-offset: 2px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sortable-header {
        height: 44px;
        padding: 0 8px;
        font-size: 13px;
      }
      
      .header-content {
        gap: 6px;
      }
      
      .sort-priority {
        width: 16px;
        height: 16px;
        font-size: 9px;
      }
      
      .sort-icons {
        width: 18px;
        height: 18px;
      }
    }

    @media (max-width: 480px) {
      .sortable-header {
        height: 40px;
        padding: 0 6px;
        font-size: 12px;
      }
      
      .header-label {
        font-weight: 500;
      }
    }
  `]
})
export class SortableHeaderComponent {
  /** Clave única de la columna */
  @Input() columna: string = '';
  
  /** Etiqueta a mostrar en el header */
  @Input() label: string = '';
  
  /** Si la columna es ordenable */
  @Input() sortable: boolean = true;
  
  /** Configuración actual de ordenamiento */
  @Input() ordenamiento: OrdenamientoColumna[] = [];
  
  /** Si se permite ordenamiento múltiple */
  @Input() permitirMultiple: boolean = true;
  
  /** Evento emitido cuando cambia el ordenamiento */
  @Output() ordenamientoChange = new EventEmitter<EventoOrdenamiento>();

  // Computed signals para el estado del ordenamiento
  ordenamientoActual = computed(() => {
    return this.ordenamiento.find(o => o.columna === this.columna) || null;
  });

  direccionActual = computed(() => {
    const actual = this.ordenamientoActual();
    return actual ? actual.direccion : null;
  });

  prioridadOrdenamiento = computed(() => {
    const actual = this.ordenamientoActual();
    return actual ? actual.prioridad : 0;
  });

  estOrdenado = computed(() => {
    return this.direccionActual() !== null;
  });

  esOrdenamientoMultiple = computed(() => {
    return this.permitirMultiple && this.ordenamiento.length > 1;
  });

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Maneja el click en el header
   */
  onHeaderClick(event: Event): void {
    if (!this.sortable) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const esMultiple = this.permitirMultiple && (event as KeyboardEvent | MouseEvent).ctrlKey;
    const direccionActual = this.direccionActual();
    
    let nuevaDireccion: DireccionOrdenamiento;
    
    // Ciclo de ordenamiento: null -> asc -> desc -> null
    switch (direccionActual) {
      case null:
        nuevaDireccion = 'asc';
        break;
      case 'asc':
        nuevaDireccion = 'desc';
        break;
      case 'desc':
        nuevaDireccion = null;
        break;
      default:
        nuevaDireccion = 'asc';
    }
    
    this.ordenamientoChange.emit({
      columna: this.columna,
      direccion: nuevaDireccion,
      esMultiple
    });
  }

  // ========================================
  // UTILIDADES
  // ========================================

  /**
   * Obtiene el tooltip apropiado según el estado
   */
  getTooltip(): string {
    if (!this.sortable) {
      return 'Esta columna no es ordenable';
    }
    
    const direccion = this.direccionActual();
    const esMultiple = this.esOrdenamientoMultiple();
    const ctrlText = this.permitirMultiple ? ' (Ctrl+click para ordenamiento múltiple)' : '';
    
    switch (direccion) {
      case null:
        return `Ordenar por ${this.label} ascendente${ctrlText}`;
      case 'asc':
        if (esMultiple) {
          return `Cambiar a descendente (prioridad ${this.prioridadOrdenamiento()})${ctrlText}`;
        }
        return `Cambiar a descendente${ctrlText}`;
      case 'desc':
        if (esMultiple) {
          return `Quitar ordenamiento (prioridad ${this.prioridadOrdenamiento()})${ctrlText}`;
        }
        return `Quitar ordenamiento${ctrlText}`;
      default:
        return `Ordenar por ${this.label}${ctrlText}`;
    }
  }

  /**
   * Obtiene el texto de estado para lectores de pantalla
   */
  getAriaLabel(): string {
    const direccion = this.direccionActual();
    const prioridad = this.prioridadOrdenamiento();
    
    let estado = '';
    if (direccion === 'asc') {
      estado = 'ordenado ascendente';
    } else if (direccion === 'desc') {
      estado = 'ordenado descendente';
    } else {
      estado = 'sin ordenar';
    }
    
    if (prioridad > 0) {
      estado += `, prioridad ${prioridad}`;
    }
    
    return `${this.label}, ${estado}. Presione Enter o Espacio para cambiar ordenamiento`;
  }

  /**
   * Obtiene el valor aria-sort apropiado
   */
  getAriaSort(): string {
    const direccion = this.direccionActual();
    
    switch (direccion) {
      case 'asc': return 'ascending';
      case 'desc': return 'descending';
      default: return 'none';
    }
  }

  /**
   * Obtiene el estado de ordenamiento como texto
   */
  getEstadoOrdenamiento(): string {
    const direccion = this.direccionActual();
    const prioridad = this.prioridadOrdenamiento();
    
    if (!direccion) return 'Sin ordenar';
    
    const direccionTexto = direccion === 'asc' ? 'Ascendente' : 'Descendente';
    
    if (prioridad > 0) {
      return `${direccionTexto} (${prioridad})`;
    }
    
    return direccionTexto;
  }

  /**
   * Verifica si esta columna tiene la prioridad más alta
   */
  esPrioridadMaxima(): boolean {
    if (!this.estOrdenado()) return false;
    
    const prioridadActual = this.prioridadOrdenamiento();
    return this.ordenamiento.every(o => o.prioridad <= prioridadActual);
  }

  /**
   * Obtiene el siguiente estado de ordenamiento
   */
  getSiguienteEstado(): DireccionOrdenamiento {
    const direccionActual = this.direccionActual();
    
    switch (direccionActual) {
      case null: return 'asc';
      case 'asc': return 'desc';
      case 'desc': return null;
      default: return 'asc';
    }
  }
}