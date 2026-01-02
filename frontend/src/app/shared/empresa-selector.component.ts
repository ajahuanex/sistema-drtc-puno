import { Component, Input, Output, EventEmitter, inject, signal, ChangeDetectionStrategy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { map, startWith, finalize } from 'rxjs/operators';

import { EmpresaService } from '../services/empresa.service';
import { Empresa } from '../models/empresa.model';

/**
 * Componente selector de empresas con búsqueda y autocompletado
 * 
 * Este componente proporciona una interfaz de búsqueda inteligente para seleccionar empresas
 * con capacidades de filtrado por RUC, razón social y código de empresa. Incluye estados
 * de carga, manejo de errores y validación de campos requeridos.
 * 
 * @example
 * ```html
 * <!-- Uso básico -->
 * <app-empresa-selector
 *   [label]="'Empresa'"
 *   [placeholder]="'Buscar empresa...'"
 *   (empresaSeleccionada)="onEmpresaSelected($event)">
 * </app-empresa-selector>
 * 
 * <!-- Uso en modal de resolución -->
 * <app-empresa-selector
 *   [label]="'EMPRESA'"
 *   [placeholder]="'Buscar por RUC, razón social o código'"
 *   [hint]="'Seleccione la empresa para la cual se creará la resolución'"
 *   [required]="true"
 *   [empresaId]="resolucionForm.get('empresaId')?.value"
 *   (empresaSeleccionada)="onEmpresaSeleccionadaBuscador($event)"
 *   (empresaIdChange)="resolucionForm.patchValue({ empresaId: $event })">
 * </app-empresa-selector>
 * 
 * <!-- Uso con formulario reactivo -->
 * <app-empresa-selector
 *   [label]="'Empresa Transportista'"
 *   [required]="true"
 *   [disabled]="form.disabled"
 *   [empresaId]="form.get('empresaId')?.value"
 *   (empresaSeleccionada)="updateSelectedEmpresa($event)"
 *   (empresaIdChange)="form.patchValue({ empresaId: $event })">
 * </app-empresa-selector>
 * ```
 * 
 * @example
 * ```typescript
 * // Manejo de eventos en el componente padre
 * export class CrearResolucionComponent {
 *   onEmpresaSeleccionadaBuscador(empresa: Empresa | null): void {
 *     if (empresa) {
 *       this.empresaSeleccionada.set(empresa);
 *       this.resolucionForm.patchValue({ empresaId: empresa.id });
 *       // Filtrar expedientes por empresa seleccionada
 *       this.filtrarExpedientesPorEmpresa(empresa.id);
 *     } else {
 *       this.empresaSeleccionada.set(null);
 *       this.resolucionForm.patchValue({ empresaId: '' });
 *     }
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 * @author Sistema SIRRET
 */
@Component({
  selector: 'app-empresa-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-form-field appearance="outline" class="form-field" [class.required]="required">
      <mat-label>
        {{ label }}
        <span *ngIf="required" class="required-indicator">*</span>
      </mat-label>
      <input matInput 
             [formControl]="empresaControl"
             [placeholder]="placeholder"
             [matAutocomplete]="auto"
             (input)="onInputChange($event)"
             [required]="required">
      <mat-autocomplete #auto="matAutocomplete" 
                       (optionSelected)="onEmpresaSeleccionada($event)"
                       [displayWith]="displayFn">
        <!-- Loading option -->
        <mat-option *ngIf="isLoading()" value="" disabled>
          <div class="loading-option">
            <mat-spinner diameter="20"></mat-spinner>
            <span>Cargando empresas...</span>
          </div>
        </mat-option>
        
        <!-- Empresa options -->
        <mat-option *ngFor="let empresa of filteredEmpresas | async" [value]="empresa.id">
          <div class="empresa-option">
            <strong>{{ empresa.ruc }}</strong>
            <span>{{ empresa.razonSocial.principal }}</span>
            <span *ngIf="empresa.codigoEmpresa" class="codigo-empresa">{{ empresa.codigoEmpresa }}</span>
          </div>
        </mat-option>
        
        <!-- No results option -->
        <mat-option *ngIf="!isLoading() && (filteredEmpresas | async)?.length === 0 && empresaControl.value && empresaControl.value.length > 0" value="" disabled>
          <div class="no-results-option">
            <mat-icon>search_off</mat-icon>
            <span>No se encontraron empresas que coincidan con "{{ empresaControl.value }}"</span>
          </div>
        </mat-option>
        
        <!-- Empty state when no search term -->
        <mat-option *ngIf="!isLoading() && empresas().length === 0 && (!empresaControl.value || empresaControl.value.length === 0)" value="" disabled>
          <div class="empty-state-option">
            <mat-icon>info</mat-icon>
            <span>No hay empresas disponibles</span>
          </div>
        </mat-option>
      </mat-autocomplete>
      
      <!-- Suffix icon with loading state -->
      <mat-spinner *ngIf="isLoading()" matSuffix diameter="20"></mat-spinner>
      <mat-icon *ngIf="!isLoading()" matSuffix>business</mat-icon>
      
      <mat-hint>{{ hint }}</mat-hint>
      <mat-error *ngIf="empresaControl.hasError('required') && required">
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

    .empresa-option {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 4px 0;
    }

    .empresa-option strong {
      color: #1976d2;
      font-weight: 600;
      font-size: 0.95em;
    }

    .empresa-option span {
      color: #666;
      font-size: 0.85em;
    }

    .empresa-option .codigo-empresa {
      color: #4caf50;
      font-weight: 500;
      font-size: 0.8em;
      background: #e8f5e8;
      padding: 2px 6px;
      border-radius: 4px;
      align-self: flex-start;
      margin-top: 2px;
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

    .no-results-option mat-icon,
    .empty-state-option mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
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
export class EmpresaSelectorComponent implements OnInit, OnChanges {
  /**
   * Etiqueta del campo de entrada
   * @default 'Empresa'
   * @example 'EMPRESA', 'Empresa Transportista', 'Seleccionar Empresa'
   */
  @Input() label: string = 'Empresa';

  /**
   * Texto de placeholder para el campo de entrada
   * @default 'Buscar por RUC, razón social o código de empresa'
   * @example 'Buscar empresa...', 'Ingrese RUC o razón social'
   */
  @Input() placeholder: string = 'Buscar por RUC, razón social o código de empresa';

  /**
   * Texto de ayuda que se muestra debajo del campo
   * @default 'Busca por RUC, razón social o código de empresa'
   * @example 'Seleccione la empresa para la cual se creará la resolución'
   */
  @Input() hint: string = 'Busca por RUC, razón social o código de empresa';

  /**
   * Indica si el campo es obligatorio
   * @default false
   * @example true para formularios de resolución, false para filtros opcionales
   */
  @Input() required: boolean = false;

  /**
   * ID de la empresa preseleccionada
   * @default ''
   * @example 'empresa-123', usado para establecer valor inicial del componente
   */
  @Input() empresaId: string = '';

  /**
   * Indica si el componente está deshabilitado
   * @default false
   * @example true cuando el formulario padre está en modo solo lectura
   */
  @Input() disabled: boolean = false;

  /**
   * Evento emitido cuando se selecciona una empresa
   * @param empresa - La empresa seleccionada o null si se limpia la selección
   * @example
   * ```typescript
   * onEmpresaSeleccionada(empresa: Empresa | null): void {
   *   if (empresa) {
   *     console.log('Empresa seleccionada:', empresa.razonSocial.principal);
   *     this.form.patchValue({ empresaId: empresa.id });
   *   }
   * }
   * ```
   */
  @Output() empresaSeleccionada = new EventEmitter<Empresa | null>();

  /**
   * Evento emitido cuando cambia el ID de la empresa seleccionada
   * @param empresaId - El ID de la empresa seleccionada o cadena vacía
   * @example
   * ```typescript
   * onEmpresaIdChange(empresaId: string): void {
   *   this.form.patchValue({ empresaId });
   *   if (empresaId) {
   *     this.loadExpedientesByEmpresa(empresaId);
   *   }
   * }
   * ```
   */
  @Output() empresaIdChange = new EventEmitter<string>();

  /** Servicio para operaciones con empresas */
  private empresaService = inject(EmpresaService);

  /** Signal que contiene la lista de todas las empresas cargadas */
  empresas = signal<Empresa[]>([]);

  /** Observable que contiene las empresas filtradas para el autocompletado */
  filteredEmpresas: Observable<Empresa[]> = new Observable<Empresa[]>();

  /** Control del formulario para el campo de entrada */
  empresaControl = new FormControl<string>('');

  /** Signal que indica si se están cargando las empresas */
  isLoading = signal<boolean>(false);

  /**
   * Inicializa el componente
   * Carga las empresas, configura el autocompletado y establece valores iniciales
   */
  ngOnInit(): void {
    this.cargarEmpresas();
    this.configurarAutocompletado();

    if (this.empresaId) {
      this.setEmpresaById(this.empresaId);
    }

    if (this.disabled) {
      this.empresaControl.disable();
    }
  }

  /**
   * Detecta cambios en los inputs del componente
   * @param changes - Objeto con los cambios detectados
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['empresaId'] && !changes['empresaId'].firstChange) {
      const newEmpresaId = changes['empresaId'].currentValue;
      console.log('🔄 EmpresaSelector: empresaId cambió a:', newEmpresaId);
      
      if (newEmpresaId) {
        this.setEmpresaById(newEmpresaId);
      } else {
        this.empresaControl.setValue('');
      }
    }
  }

  /**
   * Establece la empresa seleccionada por su ID
   * @private
   * @param empresaId - ID de la empresa a seleccionar
   */
  private setEmpresaById(empresaId: string): void {
    console.log('🎯 Buscando empresa con ID:', empresaId);
    
    // Si ya tenemos las empresas cargadas, buscar inmediatamente
    const empresas = this.empresas();
    if (empresas.length > 0) {
      const empresa = empresas.find(e => e.id === empresaId);
      if (empresa) {
        console.log('✅ Empresa encontrada:', empresa.razonSocial.principal);
        // En lugar de usar displayFn, establecer el ID directamente
        // El autocompletado mostrará el texto correcto automáticamente
        this.empresaControl.setValue(empresaId);
      } else {
        console.log('❌ Empresa no encontrada con ID:', empresaId);
      }
    } else {
      // Si no tenemos empresas aún, esperar a que se carguen
      console.log('⏳ Esperando a que se carguen las empresas...');
      setTimeout(() => this.setEmpresaById(empresaId), 100);
    }
  }

  /**
   * Carga las empresas desde el servicio
   * @private
   * @description Realiza una petición HTTP para obtener todas las empresas disponibles
   * y actualiza el signal de empresas. Maneja estados de carga y errores.
   */
  private cargarEmpresas(): void {
    this.isLoading.set(true);

    this.empresaService.getEmpresas()
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (empresas) => {
          console.log('📋 Empresas cargadas en selector:', empresas.length);
          console.log('📋 Primera empresa:', empresas[0]);
          this.empresas.set(empresas);
        },
        error: (error) => {
          console.error('Error al cargar empresas:', error);
          this.empresas.set([]);
        }
      });
  }

  /**
   * Configura el autocompletado
   * @private
   * @description Establece el observable de empresas filtradas que reacciona
   * a los cambios en el campo de entrada para proporcionar sugerencias en tiempo real
   */
  private configurarAutocompletado(): void {
    this.filteredEmpresas = this.empresaControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  /**
   * Filtra las empresas para el autocompletado
   * @private
   * @param value - Texto de búsqueda ingresado por el usuario
   * @returns Array de empresas que coinciden con los criterios de búsqueda
   * @description Busca por RUC, razón social (principal y mínimo) y código de empresa.
   * La búsqueda es insensible a mayúsculas y minúsculas y busca coincidencias parciales.
   * 
   * Criterios de búsqueda:
   * - RUC: Coincidencia parcial en el número de RUC
   * - Razón Social Principal: Coincidencia parcial en el nombre principal
   * - Razón Social Mínimo: Coincidencia parcial en el nombre mínimo (si existe)
   * - Código de Empresa: Coincidencia parcial en el código (si existe)
   */
  private _filter(value: string): Empresa[] {
    console.log('🔍 Filtrando con valor:', value, 'Tipo:', typeof value);
    console.log('🔍 Total empresas disponibles:', this.empresas().length);

    if (typeof value !== 'string') {
      console.log('⚠️ Valor no es string, retornando todas');
      return this.empresas();
    }

    const filterValue = value.toLowerCase().trim();

    // Si no hay valor de búsqueda, retornar todas las empresas
    if (!filterValue) {
      console.log('🔍 Sin filtro, retornando todas las empresas');
      return this.empresas();
    }

    const filtered = this.empresas().filter(empresa => {
      // Buscar por RUC
      const matchRuc = empresa.ruc.toLowerCase().includes(filterValue);

      // Buscar por razón social principal
      const matchRazonPrincipal = empresa.razonSocial.principal.toLowerCase().includes(filterValue);

      // Buscar por razón social mínimo (si existe)
      const matchRazonMinimo = empresa.razonSocial.minimo &&
        empresa.razonSocial.minimo.toLowerCase().includes(filterValue);

      // Buscar por código de empresa (si existe)
      const matchCodigoEmpresa = empresa.codigoEmpresa &&
        empresa.codigoEmpresa.toLowerCase().includes(filterValue);

      return matchRuc || matchRazonPrincipal || matchRazonMinimo || matchCodigoEmpresa;
    });

    console.log('🔍 Empresas filtradas:', filtered.length);
    return filtered;
  }

  /**
   * Función para mostrar la empresa seleccionada en el input
   * @param empresaId - ID de la empresa seleccionada
   * @returns Texto formateado para mostrar en el campo de entrada
   * @description Convierte el ID de empresa en texto legible mostrando RUC y razón social
   * @example "20123456789 - TRANSPORTES ABC S.A.C."
   */
  displayFn = (empresaId: string): string => {
    if (!empresaId) return '';
    const empresa = this.empresas().find(e => e.id === empresaId);
    return empresa ? `${empresa.ruc} - ${empresa.razonSocial.principal}` : '';
  }

  /**
   * Maneja la selección de una empresa desde el autocompletado
   * @param event - Evento de selección de Material Autocomplete
   * @description Procesa la selección del usuario y emite los eventos correspondientes.
   * Si se selecciona una empresa válida, emite tanto el objeto empresa como su ID.
   * Si se limpia la selección, emite valores null/vacíos.
   * @example
   * ```typescript
   * // En el template
   * <mat-autocomplete (optionSelected)="onEmpresaSeleccionada($event)">
   * 
   * // El método procesará la selección y emitirá:
   * // - empresaSeleccionada: Empresa | null
   * // - empresaIdChange: string
   * ```
   */
  onEmpresaSeleccionada(event: any): void {
    const empresaId = event.option.value;

    if (empresaId) {
      const empresa = this.empresas().find(e => e.id === empresaId);
      if (empresa) {
        this.empresaIdChange.emit(empresaId);
        this.empresaSeleccionada.emit(empresa);
      }
    } else {
      this.empresaIdChange.emit('');
      this.empresaSeleccionada.emit(null);
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
      this.empresaIdChange.emit('');
      this.empresaSeleccionada.emit(null);
    }
  }

  /**
   * Establece el valor del control programáticamente
   * @param empresaId - ID de la empresa a seleccionar
   * @description Permite establecer la empresa seleccionada desde código.
   * Útil para inicializar el componente con un valor predeterminado.
   * @example
   * ```typescript
   * // Seleccionar empresa programáticamente
   * this.empresaSelector.setValue('empresa-123');
   * ```
   */
  setValue(empresaId: string): void {
    this.empresaControl.setValue(empresaId);
  }

  /**
   * Obtiene el valor actual del control
   * @returns ID de la empresa seleccionada o cadena vacía si no hay selección
   * @description Permite obtener el valor actual del componente desde código
   * @example
   * ```typescript
   * const empresaId = this.empresaSelector.getValue();
   * if (empresaId) {
   *   console.log('Empresa seleccionada:', empresaId);
   * }
   * ```
   */
  getValue(): string {
    return this.empresaControl.value || '';
  }

  /**
   * Limpia la selección actual
   * @description Resetea el componente a su estado inicial sin selección.
   * Emite eventos de limpieza para notificar al componente padre.
   * @example
   * ```typescript
   * // Limpiar selección programáticamente
   * this.empresaSelector.clear();
   * 
   * // En un botón de limpiar
   * <button (click)="empresaSelector.clear()">Limpiar</button>
   * ```
   */
  clear(): void {
    this.empresaControl.setValue('');
    this.empresaIdChange.emit('');
    this.empresaSeleccionada.emit(null);
  }

  /**
   * Recarga las empresas desde el servicio
   * @description Vuelve a cargar la lista de empresas desde el backend.
   * Útil cuando se sabe que los datos han cambiado o en caso de error.
   * @example
   * ```typescript
   * // Recargar después de crear una nueva empresa
   * this.empresaService.crearEmpresa(nuevaEmpresa).subscribe(() => {
   *   this.empresaSelector.recargarEmpresas();
   * });
   * 
   * // En un botón de actualizar
   * <button (click)="empresaSelector.recargarEmpresas()">
   *   <mat-icon>refresh</mat-icon> Actualizar
   * </button>
   * ```
   */
  recargarEmpresas(): void {
    this.cargarEmpresas();
  }

  /**
   * Verifica si hay empresas cargadas
   * @returns true si hay al menos una empresa cargada, false en caso contrario
   * @description Útil para mostrar mensajes de estado o habilitar/deshabilitar funcionalidad
   * @example
   * ```typescript
   * if (!this.empresaSelector.hasEmpresas()) {
   *   this.showMessage('No hay empresas disponibles');
   * }
   * ```
   */
  hasEmpresas(): boolean {
    return this.empresas().length > 0;
  }

  /**
   * Obtiene el estado actual del componente
   * @returns Objeto con información del estado actual del componente
   * @description Proporciona información completa sobre el estado del componente
   * para debugging, logging o lógica condicional en el componente padre
   * @example
   * ```typescript
   * const estado = this.empresaSelector.getEstado();
   * console.log('Estado del selector:', estado);
   * // { loading: false, hasEmpresas: true, hasValue: true }
   * 
   * // Usar en lógica condicional
   * if (estado.loading) {
   *   this.showLoadingSpinner();
   * } else if (!estado.hasEmpresas) {
   *   this.showEmptyState();
   * }
   * ```
   */
  getEstado(): { loading: boolean; hasEmpresas: boolean; hasValue: boolean } {
    return {
      loading: this.isLoading(),
      hasEmpresas: this.hasEmpresas(),
      hasValue: !!this.empresaControl.value
    };
  }
}
