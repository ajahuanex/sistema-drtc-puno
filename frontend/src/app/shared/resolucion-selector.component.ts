import { Component, Input, Output, EventEmitter, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { map, startWith, finalize } from 'rxjs/operators';

import { ResolucionService } from '../services/resolucion.service';
import { Resolucion } from '../models/resolucion.model';
import { SmartIconComponent } from './smart-icon.component';

/**
 * Componente selector de resoluciones con búsqueda y autocompletado
 * 
 * Este componente proporciona una interfaz de búsqueda inteligente para seleccionar resoluciones
 * con capacidades de filtrado por número de resolución y descripción. Incluye estados
 * de carga, manejo de errores, validación de campos requeridos y filtrado por empresa.
 * 
 * @example
 * ```html
 * <!-- Uso básico -->
 * <app-resolucion-selector
 *   [label]="'Resolución'"
 *   [placeholder]="'Buscar resolución...'"
 *   (resolucionSeleccionada)="onResolucionSelected($event)">
 * </app-resolucion-selector>
 * 
 * <!-- Uso en modal de vehículo con filtrado por empresa -->
 * <app-resolucion-selector
 *   [label]="'RESOLUCIÓN'"
 *   [placeholder]="'Buscar por número o descripción'"
 *   [hint]="'Seleccione la resolución que autoriza el vehículo'"
 *   [required]="true"
 *   [empresaId]="vehiculoForm.get('empresaId')?.value"
 *   [resolucionId]="vehiculoForm.get('resolucionId')?.value"
 *   (resolucionSeleccionada)="onResolucionSeleccionada($event)"
 *   (resolucionIdChange)="vehiculoForm.patchValue({ resolucionId: $event })">
 * </app-resolucion-selector>
 * 
 * <!-- Uso con formulario reactivo -->
 * <app-resolucion-selector
 *   [label]="'Resolución Autorizante'"
 *   [required]="true"
 *   [disabled]="form.disabled"
 *   [empresaId]="selectedEmpresaId"
 *   [resolucionId]="form.get('resolucionId')?.value"
 *   (resolucionSeleccionada)="updateSelectedResolucion($event)"
 *   (resolucionIdChange)="form.patchValue({ resolucionId: $event })">
 * </app-resolucion-selector>
 * ```
 * 
 * @example
 * ```typescript
 * // Manejo de eventos en el componente padre
 * export class VehiculoModalComponent {
 *   onResolucionSeleccionada(resolucion: Resolucion | null): void {
 *     if (resolucion) {
 *       this.resolucionSeleccionada.set(resolucion);
 *       this.vehiculoForm.patchValue({ resolucionId: resolucion.id });
 *       // Validar que la resolución esté vigente
 *       this.validarResolucionVigente(resolucion);
 *     } else {
 *       this.resolucionSeleccionada.set(null);
 *       this.vehiculoForm.patchValue({ resolucionId: '' });
 *     }
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 * @author Sistema DRTC Puno
 */
@Component({
  selector: 'app-resolucion-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SmartIconComponent
  ],
  template: `
    <mat-form-field appearance="outline" class="form-field" [class.required]="required">
      <mat-label>
        {{ label }}
        <span *ngIf="required" class="required-indicator">*</span>
      </mat-label>
      <input matInput 
             [formControl]="resolucionControl"
             [placeholder]="placeholder"
             [matAutocomplete]="auto"
             (input)="onInputChange($event)"
             [required]="required"
             [disabled]="disabled || isLoading()">
      <mat-autocomplete #auto="matAutocomplete" 
                       (optionSelected)="onResolucionSeleccionada($event)"
                       [displayWith]="displayFn">
        <!-- Loading option -->
        <mat-option *ngIf="isLoading()" value="" disabled>
          <div class="loading-option">
            <mat-spinner diameter="20"></mat-spinner>
            <span>Cargando resoluciones...</span>
          </div>
        </mat-option>
        
        <!-- Resolucion options -->
        <mat-option *ngFor="let resolucion of filteredResoluciones | async" [value]="resolucion.id">
          <div class="resolucion-option">
            <div class="resolucion-header">
              <strong>{{ resolucion.nroResolucion }}</strong>
              <span class="tipo-badge" [class]="'tipo-' + resolucion.tipoResolucion.toLowerCase()">
                {{ resolucion.tipoResolucion }}
              </span>
            </div>
            <div class="resolucion-meta">
              <small class="fecha">{{ resolucion.fechaEmision | date:'dd/MM/yyyy' }}</small>
              <small class="estado" [class]="'estado-' + (resolucion.estado || 'sin-estado').toLowerCase()">
                {{ resolucion.estado }}
              </small>
            </div>
          </div>
        </mat-option>        
        <!-- No results option -->
        <mat-option *ngIf="!isLoading() && (filteredResoluciones | async)?.length === 0 && resolucionControl.value && resolucionControl.value.length > 0" value="" disabled>
          <div class="no-results-option">
            <app-smart-icon [iconName]="'search_off'" [size]="18"></app-smart-icon>
            <span>No se encontraron resoluciones que coincidan con "{{ resolucionControl.value }}"</span>
          </div>
        </mat-option>
        
        <!-- Empty state when no search term -->
        <mat-option *ngIf="!isLoading() && resoluciones().length === 0 && (!resolucionControl.value || resolucionControl.value.length === 0)" value="" disabled>
          <div class="empty-state-option">
            <app-smart-icon [iconName]="'info'" [size]="18"></app-smart-icon>
            <span>{{ empresaId ? 'No hay resoluciones disponibles para esta empresa' : 'No hay resoluciones disponibles' }}</span>
          </div>
        </mat-option>
      </mat-autocomplete>
      
      <!-- Suffix icon with loading state -->
      <mat-spinner *ngIf="isLoading()" matSuffix diameter="20"></mat-spinner>
      <app-smart-icon *ngIf="!isLoading()" [iconName]="'description'" matSuffix></app-smart-icon>
      
      <mat-hint>{{ hint }}</mat-hint>
      <mat-error *ngIf="resolucionControl.hasError('required') && required">
        {{ label }} es un campo obligatorio
      </mat-error>
    </mat-form-field>
  `,
  styles: [`
    .form-field {
      width: 100%;
    }

    .required-indicator {
      color: #f44336;
      font-weight: bold;
      margin-left: 2px;
    }

    .resolucion-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px 0;
    }

    .resolucion-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .resolucion-option strong {
      color: #1976d2;
      font-weight: 600;
      font-size: 0.95em;
    }

    .tipo-badge {
      font-size: 0.7em;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tipo-padre {
      color: #1565c0;
      background: #e3f2fd;
    }

    .tipo-hijo {
      color: #f57c00;
      background: #fff3e0;
    }

    .resolucion-option .resolucion-meta {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 2px;
    }

    .resolucion-option .fecha {
      color: #999;
      font-size: 0.75em;
    }

    .resolucion-option .estado {
      font-size: 0.75em;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .resolucion-option .estado-vigente {
      color: #2e7d32;
      background: #e8f5e9;
    }

    .resolucion-option .estado-vencida {
      color: #d32f2f;
      background: #ffebee;
    }

    .resolucion-option .estado-suspendida {
      color: #f57c00;
      background: #fff3e0;
    }

    .loading-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      color: #666;
    }

    .no-results-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      color: #999;
      font-style: italic;
    }

    .empty-state-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      color: #999;
    }

    /* Loading spinner in suffix */
    .mat-form-field-suffix mat-spinner {
      margin-right: 4px;
    }

    /* Disabled state styling */
    .form-field .mat-form-field-disabled {
      opacity: 0.6;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResolucionSelectorComponent implements OnInit {
  /**
   * Etiqueta del campo de entrada
   * @default 'Resolución'
   * @example 'RESOLUCIÓN', 'Resolución Autorizante', 'Seleccionar Resolución'
   */
  @Input() label: string = 'Resolución';

  /**
   * Texto de placeholder para el campo de entrada
   * @default 'Buscar por número o descripción'
   * @example 'Buscar resolución...', 'Ingrese número de resolución'
   */
  @Input() placeholder: string = 'Buscar por número o descripción';

  /**
   * Texto de ayuda que se muestra debajo del campo
   * @default 'Busca por número de resolución o descripción'
   * @example 'Seleccione la resolución que autoriza el vehículo'
   */
  @Input() hint: string = 'Busca por número de resolución o descripción';

  /**
   * Indica si el campo es obligatorio
   * @default false
   * @example true para formularios de vehículo, false para filtros opcionales
   */
  @Input() required: boolean = false;

  /**
   * ID de la resolución preseleccionada
   * @default ''
   * @example 'resolucion-123', usado para establecer valor inicial del componente
   */
  @Input() resolucionId: string = '';

  /**
   * ID de la empresa para filtrar resoluciones
   * @default ''
   * @example 'empresa-123', filtra solo resoluciones de esa empresa
   */
  @Input() empresaId: string = '';

  /**
   * Tipo de trámite para filtrar resoluciones
   * @default undefined
   * @example 'PRIMIGENIA', filtra solo resoluciones de ese tipo de trámite
   */
  @Input() filtroTipoTramite?: string;

  /**
   * Indica si el componente está deshabilitado
   * @default false
   * @example true cuando el formulario padre está en modo solo lectura
   */
  @Input() disabled: boolean = false;
  
  /**
   * Evento emitido cuando se selecciona una resolución
   * @param resolucion - La resolución seleccionada o null si se limpia la selección
   * @example
   * ```typescript
   * onResolucionSeleccionada(resolucion: Resolucion | null): void {
   *   if (resolucion) {
   *     console.log('Resolución seleccionada:', resolucion.nroResolucion);
   *     this.form.patchValue({ resolucionId: resolucion.id });
   *   }
   * }
   * ```
   */
  @Output() resolucionSeleccionada = new EventEmitter<Resolucion | null>();

  /**
   * Evento emitido cuando cambia el ID de la resolución seleccionada
   * @param resolucionId - El ID de la resolución seleccionada o cadena vacía
   * @example
   * ```typescript
   * onResolucionIdChange(resolucionId: string): void {
   *   this.form.patchValue({ resolucionId });
   *   if (resolucionId) {
   *     this.loadVehiculosByResolucion(resolucionId);
   *   }
   * }
   * ```
   */
  @Output() resolucionIdChange = new EventEmitter<string>();

  /** Servicio para operaciones con resoluciones */
  private resolucionService = inject(ResolucionService);

  /** Signal que contiene la lista de todas las resoluciones cargadas */
  resoluciones = signal<Resolucion[]>([]);
  
  /** Observable que contiene las resoluciones filtradas para el autocompletado */
  filteredResoluciones: Observable<Resolucion[]> = new Observable<Resolucion[]>();
  
  /** Control del formulario para el campo de entrada */
  resolucionControl = new FormControl<string>('');
  
  /** Signal que indica si se están cargando las resoluciones */
  isLoading = signal<boolean>(false);

  /**
   * Inicializa el componente
   * Carga las resoluciones, configura el autocompletado y establece valores iniciales
   */
  ngOnInit(): void {
    this.cargarResoluciones();
    this.configurarAutocompletado();
    
    if (this.resolucionId) {
      this.resolucionControl.setValue(this.resolucionId);
    }
    
    if (this.disabled) {
      this.resolucionControl.disable();
    }
  }

  /**
   * Carga las resoluciones desde el servicio
   * @private
   * @description Realiza una petición HTTP para obtener todas las resoluciones disponibles
   * y actualiza el signal de resoluciones. Si se proporciona empresaId, filtra por empresa.
   * Maneja estados de carga y errores.
   */
  private cargarResoluciones(): void {
    this.isLoading.set(true);
    
    const observable = this.empresaId 
      ? this.resolucionService.getResolucionesPorEmpresa(this.empresaId)
      : this.resolucionService.getResoluciones();
    
    observable
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (resoluciones) => {
          // Mostrar todas las resoluciones activas (sin filtrar por estado VIGENTE)
          // Un vehículo puede estar en cualquier resolución, solo cambian las rutas
          const resolucionesActivas = resoluciones.filter(r => r.estaActivo);
          
          console.log('📋 Resoluciones cargadas en selector:', resolucionesActivas.length);
          console.log('   Detalle:', resolucionesActivas.map(r => ({ 
            numero: r.nroResolucion, 
            tipo: r.tipoResolucion,
            estado: r.estado 
          })));
          
          this.resoluciones.set(resolucionesActivas);
        },
        error: (error) => {
          console.error('Error al cargar resoluciones:', error);
          this.resoluciones.set([]);
        }
      });
  }

  /**
   * Configura el autocompletado
   * @private
   * @description Establece el observable de resoluciones filtradas que reacciona
   * a los cambios en el campo de entrada para proporcionar sugerencias en tiempo real
   */
  private configurarAutocompletado(): void {
    this.filteredResoluciones = this.resolucionControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  /**
   * Filtra las resoluciones para el autocompletado
   * @private
   * @param value - Texto de búsqueda ingresado por el usuario
   * @returns Array de resoluciones que coinciden con los criterios de búsqueda
   * @description Busca por número de resolución y descripción.
   * La búsqueda es insensible a mayúsculas y minúsculas y busca coincidencias parciales.
   * También aplica filtro por tipo de trámite si está especificado.
   * 
   * Criterios de búsqueda:
   * - Número de Resolución: Coincidencia parcial en el número (ej: R-0001-2025)
   * - Descripción: Coincidencia parcial en la descripción de la resolución
   * - Tipo de Trámite: Filtro exacto por tipo de trámite (si está especificado)
   */
  private _filter(value: string): Resolucion[] {
    if (typeof value !== 'string') return this.resoluciones();
    
    const filterValue = value.toLowerCase().trim();
    
    // Aplicar filtro por tipo de trámite primero si está especificado
    let resolucionesFiltradas = this.resoluciones();
    if (this.filtroTipoTramite) {
      resolucionesFiltradas = resolucionesFiltradas.filter(r => 
        r.tipoTramite === this.filtroTipoTramite
      );
    }
    
    // Si no hay valor de búsqueda, retornar resoluciones filtradas por tipo
    if (!filterValue) return resolucionesFiltradas;
    
    return resolucionesFiltradas.filter(resolucion => {
      // Buscar por número de resolución
      const matchNumero = resolucion.nroResolucion.toLowerCase().includes(filterValue);
      
      // Buscar por descripción
      const matchDescripcion = resolucion.descripcion && 
        resolucion.descripcion.toLowerCase().includes(filterValue);
      
      return matchNumero || matchDescripcion;
    });
  }

  /**
   * Función para mostrar la resolución seleccionada en el input
   * @param resolucionId - ID de la resolución seleccionada
   * @returns Texto formateado para mostrar en el campo de entrada
   * @description Convierte el ID de resolución en texto legible mostrando número y descripción
   * @example "R-0001-2025 - Resolución PRIMIGENIA para autorización..."
   */
  displayFn = (resolucionId: string): string => {
    if (!resolucionId) return '';
    const resolucion = this.resoluciones().find(r => r.id === resolucionId);
    if (!resolucion) return '';
    
    // Truncar descripción si es muy larga
    const descripcionCorta = resolucion.descripcion.length > 50 
      ? resolucion.descripcion.substring(0, 50) + '...'
      : resolucion.descripcion;
    
    return `${resolucion.nroResolucion} - ${descripcionCorta}`;
  }

  /**
   * Maneja la selección de una resolución desde el autocompletado
   * @param event - Evento de selección de Material Autocomplete
   * @description Procesa la selección del usuario y emite los eventos correspondientes.
   * Si se selecciona una resolución válida, emite tanto el objeto resolución como su ID.
   * Si se limpia la selección, emite valores null/vacíos.
   * @example
   * ```typescript
   * // En el template
   * <mat-autocomplete (optionSelected)="onResolucionSeleccionada($event)">
   * 
   * // El método procesará la selección y emitirá:
   * // - resolucionSeleccionada: Resolucion | null
   * // - resolucionIdChange: string
   * ```
   */
  onResolucionSeleccionada(event: any): void {
    const resolucionId = event.option.value;
    
    if (resolucionId) {
      const resolucion = this.resoluciones().find(r => r.id === resolucionId);
      if (resolucion) {
        this.resolucionIdChange.emit(resolucionId);
        this.resolucionSeleccionada.emit(resolucion);
      }
    } else {
      this.resolucionIdChange.emit('');
      this.resolucionSeleccionada.emit(null);
    }
  }

  /**
   * Maneja cambios en el campo de entrada
   * @param event - Evento de entrada del usuario
   * @description Detecta cuando el usuario borra el contenido del campo
   * y limpia la selección actual emitiendo valores null/vacíos
   */
  onInputChange(event: any): void {
    const value = event.target.value;
    if (!value) {
      this.resolucionIdChange.emit('');
      this.resolucionSeleccionada.emit(null);
    }
  }

  /**
   * Establece el valor del control programáticamente
   * @param resolucionId - ID de la resolución a seleccionar
   * @description Permite establecer la resolución seleccionada desde código.
   * Útil para inicializar el componente con un valor predeterminado.
   * @example
   * ```typescript
   * // Seleccionar resolución programáticamente
   * this.resolucionSelector.setValue('resolucion-123');
   * ```
   */
  setValue(resolucionId: string): void {
    this.resolucionControl.setValue(resolucionId);
  }

  /**
   * Obtiene el valor actual del control
   * @returns ID de la resolución seleccionada o cadena vacía si no hay selección
   * @description Permite obtener el valor actual del componente desde código
   * @example
   * ```typescript
   * const resolucionId = this.resolucionSelector.getValue();
   * if (resolucionId) {
   *   console.log('Resolución seleccionada:', resolucionId);
   * }
   * ```
   */
  getValue(): string {
    return this.resolucionControl.value || '';
  }

  /**
   * Limpia la selección actual
   * @description Resetea el componente a su estado inicial sin selección.
   * Emite eventos de limpieza para notificar al componente padre.
   * @example
   * ```typescript
   * // Limpiar selección programáticamente
   * this.resolucionSelector.clear();
   * 
   * // En un botón de limpiar
   * <button (click)="resolucionSelector.clear()">Limpiar</button>
   * ```
   */
  clear(): void {
    this.resolucionControl.setValue('');
    this.resolucionIdChange.emit('');
    this.resolucionSeleccionada.emit(null);
  }

  /**
   * Recarga las resoluciones desde el servicio
   * @description Vuelve a cargar la lista de resoluciones desde el backend.
   * Útil cuando se sabe que los datos han cambiado o en caso de error.
   * @example
   * ```typescript
   * // Recargar después de crear una nueva resolución
   * this.resolucionService.crearResolucion(nuevaResolucion).subscribe(() => {
   *   this.resolucionSelector.recargarResoluciones();
   * });
   * 
   * // En un botón de actualizar
   * <button (click)="resolucionSelector.recargarResoluciones()">
   *   <mat-icon>refresh</mat-icon> Actualizar
   * </button>
   * ```
   */
  recargarResoluciones(): void {
    this.cargarResoluciones();
  }

  /**
   * Verifica si hay resoluciones cargadas
   * @returns true si hay al menos una resolución cargada, false en caso contrario
   * @description Útil para mostrar mensajes de estado o habilitar/deshabilitar funcionalidad
   * @example
   * ```typescript
   * if (!this.resolucionSelector.hasResoluciones()) {
   *   this.showMessage('No hay resoluciones disponibles');
   * }
   * ```
   */
  hasResoluciones(): boolean {
    return this.resoluciones().length > 0;
  }

  /**
   * Obtiene el estado actual del componente
   * @returns Objeto con información del estado actual del componente
   * @description Proporciona información completa sobre el estado del componente
   * para debugging, logging o lógica condicional en el componente padre
   * @example
   * ```typescript
   * const estado = this.resolucionSelector.getEstado();
   * console.log('Estado del selector:', estado);
   * // { loading: false, hasResoluciones: true, hasValue: true }
   * 
   * // Usar en lógica condicional
   * if (estado.loading) {
   *   this.showLoadingSpinner();
   * } else if (!estado.hasResoluciones) {
   *   this.showEmptyState();
   * }
   * ```
   */
  getEstado(): { loading: boolean; hasResoluciones: boolean; hasValue: boolean } {
    return {
      loading: this.isLoading(),
      hasResoluciones: this.hasResoluciones(),
      hasValue: !!this.resolucionControl.value
    };
  }
}
