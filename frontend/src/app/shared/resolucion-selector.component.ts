import { Component, Input, Output, EventEmitter, inject, signal, effect, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SmartIconComponent } from './smart-icon.component';
import { ResolucionService } from '../services/resolucion.service';
import { Resolucion } from '../models/resolucion.model';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

/**
 * Componente selector de resoluciones con búsqueda avanzada.
 * 
 * Permite buscar resoluciones por número o descripción con autocompletado en tiempo real.
 * Puede filtrar resoluciones por empresa cuando se proporciona empresaId.
 * 
 * @example
 * ```html
 * <!-- Uso básico -->
 * <app-resolucion-selector
 *   [label]="'Resolución'"
 *   [placeholder]="'Buscar resolución'"
 *   (resolucionSeleccionada)="onResolucionSelected($event)">
 * </app-resolucion-selector>
 * 
 * <!-- Con empresa filtrada -->
 * <app-resolucion-selector
 *   [label]="'Resolución'"
 *   [empresaId]="empresaSeleccionada?.id"
 *   [required]="true"
 *   (resolucionSeleccionada)="onResolucionSelected($event)"
 *   (resolucionIdChange)="form.patchValue({ resolucionId: $event })">
 * </app-resolucion-selector>
 * ```
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
    MatProgressSpinnerModule,
    SmartIconComponent,
  ],
  template: `
    <mat-form-field appearance="outline" [class.required]="required" class="resolucion-selector">
      <mat-label>{{ label }}</mat-label>
      <input matInput 
             [formControl]="resolucionControl"
             [placeholder]="placeholder"
             [matAutocomplete]="auto"
             [required]="required"
             [disabled]="disabled || cargando()">
      <mat-autocomplete #auto="matAutocomplete" 
                       [displayWith]="displayResolucion"
                       (optionSelected)="onResolucionSeleccionada($event)">
        @if (cargando()) {
          <mat-option disabled>
            <div class="loading-option">
              <mat-spinner diameter="20"></mat-spinner>
              <span>Cargando resoluciones...</span>
            </div>
          </mat-option>
        } @else {
          @for (resolucion of filteredResoluciones | async; track resolucion.id) {
            <mat-option [value]="resolucion">
              <div class="resolucion-option">
                <div class="resolucion-header">
                  <strong>{{ resolucion.nroResolucion }}</strong>
                  <span class="resolucion-tipo">{{ resolucion.tipoTramite }}</span>
                </div>
                <div class="resolucion-details">
                  <span class="resolucion-descripcion">{{ resolucion.descripcion || 'Sin descripción' }}</span>
                  <span class="resolucion-fecha">{{ resolucion.fechaEmision | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
            </mat-option>
          } @empty {
            <mat-option disabled>
              <div class="no-results">
                <app-smart-icon [iconName]="'search_off'" [size]="20"></app-smart-icon>
                <span>No se encontraron resoluciones</span>
              </div>
            </mat-option>
          }
        }
      </mat-autocomplete>
      <app-smart-icon [iconName]="'description'" [size]="20" matSuffix></app-smart-icon>
      @if (hint) {
        <mat-hint>{{ hint }}</mat-hint>
      }
      @if (resolucionControl.hasError('required') && resolucionControl.touched) {
        <mat-error>La resolución es requerida</mat-error>
      }
    </mat-form-field>
  `,
  styles: [`
    .resolucion-selector {
      width: 100%;
    }

    .resolucion-selector.required ::ng-deep .mat-mdc-form-field-required-marker {
      color: var(--warn-color, #f44336);
    }

    .resolucion-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px 0;
    }

    .resolucion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .resolucion-header strong {
      font-size: 14px;
      color: var(--primary-color, #1976d2);
    }

    .resolucion-tipo {
      font-size: 11px;
      padding: 2px 6px;
      background-color: var(--accent-color, #ff4081);
      color: white;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .resolucion-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }

    .resolucion-descripcion {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .resolucion-fecha {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
    }

    .loading-option,
    .no-results {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      color: rgba(0, 0, 0, 0.6);
    }

    .no-results {
      justify-content: center;
    }
  `]
})
export class ResolucionSelectorComponent implements OnChanges {
  private resolucionService = inject(ResolucionService);

  /** Etiqueta del campo */
  @Input() label: string = 'Resolución';
  
  /** Placeholder del input */
  @Input() placeholder: string = 'Buscar por número o descripción';
  
  /** Texto de ayuda debajo del campo */
  @Input() hint: string = '';
  
  /** Si el campo es requerido */
  @Input() required: boolean = false;
  
  /** Si el campo está deshabilitado */
  @Input() disabled: boolean = false;
  
  /** ID de la empresa para filtrar resoluciones */
  @Input() empresaId: string = '';
  
  /** ID de la resolución seleccionada (para binding bidireccional) */
  @Input() resolucionId: string = '';
  
  /** Filtro por tipo de trámite específico */
  @Input() filtroTipoTramite: string = '';
  
  /** Evento emitido cuando se selecciona una resolución */
  @Output() resolucionSeleccionada = new EventEmitter<Resolucion | null>();
  
  /** Evento emitido cuando cambia el ID de la resolución */
  @Output() resolucionIdChange = new EventEmitter<string>();

  // Control del formulario
  resolucionControl = new FormControl('');
  
  // Señales
  resoluciones = signal<Resolucion[]>([]);
  cargando = signal(false);
  
  // Observable para el autocompletado
  filteredResoluciones!: Observable<Resolucion[]>;

  constructor() {
    // Cargar resoluciones al inicializar
    this.cargarResoluciones();
    
    // Configurar autocompletado
    this.filteredResoluciones = this.resolucionControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  /**
   * Detecta cambios en los inputs y recarga resoluciones si es necesario
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Si cambió empresaId o filtroTipoTramite, recargar resoluciones
    if (changes['empresaId'] || changes['filtroTipoTramite']) {
      console.log('🔄 Cambio detectado en ResolucionSelector:', {
        empresaId: this.empresaId,
        filtroTipoTramite: this.filtroTipoTramite,
        changes: changes
      });
      this.cargarResoluciones();
    }
  }

  /**
   * Carga las resoluciones desde el servicio
   */
  private cargarResoluciones(): void {
    this.cargando.set(true);
    
    console.log('📋 Cargando resoluciones con filtros:', {
      empresaId: this.empresaId,
      filtroTipoTramite: this.filtroTipoTramite,
      usarFiltroEmpresa: !!this.empresaId
    });
    
    const observable = this.empresaId 
      ? this.resolucionService.getResolucionesPorEmpresa(this.empresaId)
      : this.resolucionService.getResoluciones();
    
    observable.subscribe({
      next: (resoluciones) => {
        console.log('✅ Resoluciones cargadas:', {
          total: resoluciones.length,
          empresaId: this.empresaId,
          resoluciones: resoluciones.map(r => ({ id: r.id, numero: r.nroResolucion, tipo: r.tipoTramite }))
        });
        this.resoluciones.set(resoluciones);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('❌ Error al cargar resoluciones:', error);
        this.resoluciones.set([]);
        this.cargando.set(false);
      }
    });
  }

  /**
   * Filtra las resoluciones según el término de búsqueda
   */
  private _filter(value: string | Resolucion | null): Resolucion[] {
    let resoluciones = this.resoluciones();
    
    // Aplicar filtro por tipo de trámite si está especificado
    if (this.filtroTipoTramite) {
      resoluciones = resoluciones.filter(resolucion => 
        resolucion.tipoTramite === this.filtroTipoTramite
      );
    }
    
    if (!value) {
      return resoluciones;
    }

    const filterValue = typeof value === 'string' 
      ? value.toLowerCase() 
      : value.nroResolucion.toLowerCase();
    
    return resoluciones.filter(resolucion => 
      resolucion.nroResolucion.toLowerCase().includes(filterValue) ||
      (resolucion.descripcion && resolucion.descripcion.toLowerCase().includes(filterValue)) ||
      resolucion.tipoTramite.toLowerCase().includes(filterValue)
    );
  }

  /**
   * Maneja la selección de una resolución
   */
  onResolucionSeleccionada(event: any): void {
    const resolucion = event.option.value as Resolucion;
    this.resolucionSeleccionada.emit(resolucion);
    this.resolucionIdChange.emit(resolucion.id);
  }

  /**
   * Función para mostrar el valor en el input
   */
  displayResolucion = (resolucion: Resolucion | null): string => {
    return resolucion ? `${resolucion.nroResolucion} - ${resolucion.tipoTramite}` : '';
  };

  /**
   * Limpia la selección actual
   */
  limpiar(): void {
    this.resolucionControl.setValue('');
    this.resolucionSeleccionada.emit(null);
    this.resolucionIdChange.emit('');
  }

  /**
   * Establece una resolución programáticamente
   */
  setResolucion(resolucion: Resolucion | null): void {
    this.resolucionControl.setValue(resolucion as any);
    if (resolucion) {
      this.resolucionSeleccionada.emit(resolucion);
      this.resolucionIdChange.emit(resolucion.id);
    }
  }
}
