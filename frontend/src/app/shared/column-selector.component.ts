import { Component, Input, Output, EventEmitter, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
 */
@Component({
  selector: 'app-column-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    SmartIconComponent
  ],
  template: `
    <button mat-icon-button 
            (click)="abrirModal()"
            matTooltip="Configurar columnas"
            class="column-selector-trigger">
      <app-smart-icon iconName="view_column" [size]="20"></app-smart-icon>
    </button>
  `,
  styles: [`
    .column-selector-trigger {
      color: rgba(0, 0, 0, 0.6);
    }

    .column-selector-trigger:hover {
      color: #1976d2;
      background-color: rgba(25, 118, 210, 0.04);
    }
  `]
})
export class ColumnSelectorComponent {
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

  // Inyección de dependencias
  private dialog = inject(MatDialog);

  /**
   * Abre el modal de configuración de columnas
   */
  abrirModal(): void {
    const dialogRef = this.dialog.open(ColumnSelectorModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        columnas: this.columnas,
        columnasVisibles: this.columnasVisibles,
        ordenColumnas: this.ordenColumnas
      },
      panelClass: 'column-selector-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.columnasChange.emit(result.columnasVisibles);
        this.ordenChange.emit(result.ordenColumnas);
      }
    });
  }
}

// Componente Modal
@Component({
  selector: 'app-column-selector-modal',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatListModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
    SmartIconComponent
  ],
  template: `
    <div class="column-selector-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 mat-dialog-title class="modal-title">
          <app-smart-icon iconName="view_column" [size]="24"></app-smart-icon>
          Configurar Columnas
        </h2>
        <button mat-icon-button 
                mat-dialog-close
                class="close-button"
                matTooltip="Cerrar">
          <app-smart-icon iconName="close" [size]="20"></app-smart-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      <!-- Contenido -->
      <div mat-dialog-content class="modal-content">
        <p class="modal-subtitle">
          Seleccione las columnas a mostrar y arrástrelas para reordenar
        </p>

        <!-- Lista de columnas con drag & drop -->
        <div class="columns-list-container">
          <div class="columns-list-header">
            <span class="list-title">Columnas Disponibles</span>
            <span class="visible-count">{{ contadorVisibles() }} de {{ (columnasOrdenadas())?.length || 0 }}</span>
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
                  <app-smart-icon iconName="drag_indicator" [size]="20"></app-smart-icon>
                </div>

                <!-- Checkbox -->
                <mat-checkbox 
                  [checked]="columna.visible"
                  [disabled]="columna.required"
                  (change)="onColumnToggle(columna.key, $event.checked || false)"
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
                    <app-smart-icon iconName="visibility" [size]="18" class="visible-icon"></app-smart-icon>
                  } @else {
                    <app-smart-icon iconName="visibility_off" [size]="18" class="hidden-icon"></app-smart-icon>
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
              <app-smart-icon iconName="visibility" [size]="18"></app-smart-icon>
              Mostrar Todas
            </button>
            
            <button mat-stroked-button 
                    (click)="mostrarMinimas()"
                    [disabled]="soloMinimas()"
                    class="quick-button">
              <app-smart-icon iconName="view_agenda" [size]="18"></app-smart-icon>
              Solo Esenciales
            </button>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Botones de acción -->
      <div mat-dialog-actions class="modal-actions">
        <button mat-button 
                (click)="restaurarDefecto()"
                class="action-button secondary">
          <app-smart-icon iconName="restore" [size]="18"></app-smart-icon>
          Restaurar
        </button>
        
        <button mat-button 
                mat-dialog-close
                class="action-button cancel">
          Cancelar
        </button>
        
        <button mat-raised-button 
                color="primary"
                (click)="aplicarCambios()"
                [disabled]="!hayCambios()"
                class="action-button primary">
          <app-smart-icon iconName="check" [size]="18"></app-smart-icon>
          Aplicar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .column-selector-modal {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 16px;
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: #1976d2;
    }

    .close-button {
      color: rgba(0, 0, 0, 0.6);
    }

    .modal-content {
      flex: 1;
      padding: 16px 24px !important;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-subtitle {
      margin: 0 0 20px 0;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.4;
    }

    .columns-list-container {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .columns-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .list-title {
      font-size: 16px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.8);
    }

    .visible-count {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      background-color: #e3f2fd;
      padding: 4px 12px;
      border-radius: 16px;
      font-weight: 500;
    }

    .columns-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 400px;
    }

    .column-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background-color: white;
      transition: all 0.2s ease;
      cursor: move;
      min-height: 64px;
    }

    .column-item:hover {
      border-color: #1976d2;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      transform: rotate(3deg);
      z-index: 10000;
    }

    .column-item.cdk-drag-placeholder {
      opacity: 0.4;
      border-style: dashed;
    }

    .drag-handle {
      color: rgba(0, 0, 0, 0.4);
      cursor: grab;
      padding: 8px;
      margin: -8px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .drag-handle:hover {
      background-color: rgba(0, 0, 0, 0.04);
      color: #1976d2;
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
      font-size: 15px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.8);
      margin-bottom: 4px;
    }

    .required-badge {
      font-size: 10px;
      padding: 2px 8px;
      background-color: #ff9800;
      color: white;
      border-radius: 12px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .column-details {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
    }

    .column-type {
      text-transform: capitalize;
      font-weight: 500;
    }

    .column-width {
      font-family: monospace;
      background-color: rgba(0, 0, 0, 0.04);
      padding: 2px 6px;
      border-radius: 4px;
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
      padding: 16px 0;
      margin-top: 16px;
    }

    .quick-actions-title {
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 12px;
    }

    .quick-buttons {
      display: flex;
      gap: 12px;
    }

    .quick-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      padding: 10px 16px;
      min-height: 40px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      padding: 16px 24px;
      background-color: #fafafa;
      justify-content: flex-end;
    }

    .action-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 44px;
      font-size: 14px;
      padding: 0 20px;
    }

    .action-button.secondary {
      color: rgba(0, 0, 0, 0.6);
    }

    .action-button.cancel {
      color: rgba(0, 0, 0, 0.6);
    }

    /* Scrollbar personalizado */
    .columns-list::-webkit-scrollbar {
      width: 8px;
    }

    .columns-list::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .columns-list::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }

    .columns-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .modal-header {
        padding: 16px 20px 12px;
      }
      
      .modal-title {
        font-size: 18px;
      }
      
      .modal-content {
        padding: 12px 20px !important;
      }
      
      .column-item {
        padding: 20px 16px;
        min-height: 72px;
      }
      
      .drag-handle {
        padding: 12px;
        margin: -12px;
      }
      
      .column-checkbox {
        transform: scale(1.2);
      }
      
      .quick-buttons {
        flex-direction: column;
      }
      
      .modal-actions {
        flex-direction: column;
        padding: 16px 20px;
      }
      
      .action-button {
        height: 48px;
      }
    }
  `]
})
export class ColumnSelectorModalComponent implements OnInit {
  // Datos del modal
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ColumnSelectorModalComponent>);

  // Estado interno
  columnasOrdenadas = signal<ColumnaSeleccionable[]>([]);
  contadorVisibles = signal(0);
  
  // Estado inicial para detectar cambios
  private estadoInicial: { visibles: string[], orden: string[] } = { visibles: [], orden: [] };

  ngOnInit(): void {
    this.inicializarColumnas();
    this.guardarEstadoInicial();
  }

  /**
   * Inicializa las columnas con su estado de visibilidad y orden
   */
  private inicializarColumnas(): void {
    const orden = this.data.ordenColumnas.length > 0 ? this.data.ordenColumnas : this.data.columnas.map((c: ColumnaDefinicion) => c.key);
    
    const columnasConEstado: ColumnaSeleccionable[] = orden.map((key: string, index: number) => {
      const definicion = this.data.columnas.find((c: ColumnaDefinicion) => c.key === key);
      if (!definicion) {
        console.warn(`Columna no encontrada: ${key}`);
        return null;
      }
      
      return {
        ...definicion,
        visible: this.data.columnasVisibles.includes(key),
        orden: index
      };
    }).filter(Boolean) as ColumnaSeleccionable[];

    // Agregar columnas que no están en el orden pero sí en las definiciones
    const columnasEnOrden = new Set(orden);
    this.data.columnas.forEach((columna: ColumnaDefinicion) => {
      if (!columnasEnOrden.has(columna.key)) {
        columnasConEstado.push({
          ...columna,
          visible: this.data.columnasVisibles.includes(columna.key),
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
      visibles: [...this.data.columnasVisibles],
      orden: [...this.data.ordenColumnas]
    };
  }

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
    
    // Cerrar el modal con los resultados
    this.dialogRef.close({
      columnasVisibles: nuevasVisibles,
      ordenColumnas: nuevoOrden
    });
  }

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