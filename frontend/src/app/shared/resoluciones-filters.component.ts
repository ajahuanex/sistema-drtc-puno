import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { 
  ResolucionFiltros, 
  FiltroActivo,
  TIPOS_TRAMITE_OPCIONES,
  ESTADOS_RESOLUCION_OPCIONES 
} from '../models/resolucion-table.model';
import { EmpresaSelectorComponent } from './empresa-selector.component';
import { DateRangePickerComponent, RangoFechas } from './date-range-picker.component';
import { SmartIconComponent } from './smart-icon.component';
import { FiltrosMobileModalComponent } from './filtros-mobile-modal.component';

/**
 * Componente de filtros avanzados para resoluciones
 * 
 * @example
 * ```html
 * <app-resoluciones-filters
 *   [filtros]="filtrosActuales"
 *   [empresas]="listaEmpresas"
 *   (filtrosChange)="onFiltrosChange($event)"
 *   (limpiarFiltros)="onLimpiarFiltros()">
 * </app-resoluciones-filters>
 * ```
 */
@Component({
  selector: 'app-resoluciones-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatToolbarModule,
    MatMenuModule,
    EmpresaSelectorComponent,
    DateRangePickerComponent,
    SmartIconComponent
  ],
  template: `
    <!-- Versión desktop: Expansion Panel -->
    <mat-expansion-panel 
      class="filtros-panel desktop-filters"
      [expanded]="panelExpandido()"
      (expandedChange)="onPanelToggle($event)"
      [class.mobile-hidden]="esMobile()"
      role="region"
      [attr.aria-label]="'Filtros de búsqueda avanzados'"
      [attr.aria-expanded]="panelExpandido()">
      
      <mat-expansion-panel-header>
        <mat-panel-title>
          <div class="panel-title">
            <app-smart-icon iconName="filter_list" [size]="20" [attr.aria-hidden]="true"></app-smart-icon>
            <span>Filtros Avanzados</span>
            @if (contadorFiltros() > 0) {
              <span class="filtros-badge" role="status" [attr.aria-label]="contadorFiltros() + ' filtros aplicados'">
                {{ contadorFiltros() }}
              </span>
            }
          </div>
        </mat-panel-title>
        <mat-panel-description>
          @if (contadorFiltros() > 0) {
            <span role="status">{{ contadorFiltros() }} filtro(s) aplicado(s)</span>
          } @else {
            <span>Haga clic para expandir filtros</span>
          }
        </mat-panel-description>
      </mat-expansion-panel-header>

      <div class="filtros-content">
        <form [formGroup]="filtrosForm" class="filtros-form">
          
          <!-- Primera fila de filtros -->
          <div class="filtros-row">
            <!-- Filtro por número de resolución -->
            <mat-form-field appearance="outline" class="filtro-field">
              <mat-label>Número de Resolución</mat-label>
              <input matInput 
                     formControlName="numeroResolucion"
                     placeholder="Ej: R-001-2025"
                     autocomplete="off"
                     [attr.aria-label]="'Buscar por número de resolución'"
                     [attr.aria-describedby]="'hint-numero-resolucion'">
              <app-smart-icon iconName="search" [size]="20" matSuffix [attr.aria-hidden]="true"></app-smart-icon>
              <mat-hint id="hint-numero-resolucion">Buscar por número completo o parcial</mat-hint>
            </mat-form-field>

            <!-- Filtro por empresa -->
            <div class="filtro-field">
              <app-empresa-selector
                label="Empresa"
                placeholder="Buscar empresa por RUC o razón social"
                hint="Filtrar resoluciones por empresa"
                [empresaId]="filtrosForm.get('empresaId')?.value"
                (empresaIdChange)="onEmpresaChange($event)"
                (empresaSeleccionada)="onEmpresaSeleccionada($event)">
              </app-empresa-selector>
            </div>
          </div>

          <!-- Segunda fila de filtros -->
          <div class="filtros-row">
            <!-- Filtro por tipos de trámite -->
            <mat-form-field appearance="outline" class="filtro-field">
              <mat-label>Tipos de Trámite</mat-label>
              <mat-select formControlName="tiposTramite" multiple>
                <mat-select-trigger>
                  @if (filtrosForm.get('tiposTramite')?.value?.length) {
                    {{ filtrosForm.get('tiposTramite')?.value?.length || 0 }} seleccionado(s)
                  } @else {
                    Seleccionar tipos
                  }
                </mat-select-trigger>
                @for (tipo of tiposTramiteOpciones; track tipo) {
                  <mat-option [value]="tipo">{{ tipo }}</mat-option>
                }
              </mat-select>
              <app-smart-icon iconName="category" [size]="20" matSuffix></app-smart-icon>
              <mat-hint>Seleccione uno o más tipos</mat-hint>
            </mat-form-field>

            <!-- Filtro por estados -->
            <mat-form-field appearance="outline" class="filtro-field">
              <mat-label>Estados</mat-label>
              <mat-select formControlName="estados" multiple>
                <mat-select-trigger>
                  @if (filtrosForm.get('estados')?.value?.length) {
                    {{ filtrosForm.get('estados')?.value?.length || 0 }} seleccionado(s)
                  } @else {
                    Seleccionar estados
                  }
                </mat-select-trigger>
                @for (estado of estadosOpciones; track estado) {
                  <mat-option [value]="estado">{{ estado }}</mat-option>
                }
              </mat-select>
              <app-smart-icon iconName="flag" [size]="20" matSuffix></app-smart-icon>
              <mat-hint>Seleccione uno o más estados</mat-hint>
            </mat-form-field>
          </div>

          <!-- Tercera fila de filtros -->
          <div class="filtros-row">
            <!-- Filtro por rango de fechas -->
            <div class="filtro-field filtro-fecha">
              <app-date-range-picker
                label="Rango de Fechas de Emisión"
                hint="Seleccione el período de emisión"
                [formControl]="rangoFechasControl"
                (rangoChange)="onRangoFechasChange($event)">
              </app-date-range-picker>
            </div>

            <!-- Filtro por estado activo -->
            <mat-form-field appearance="outline" class="filtro-field filtro-activo">
              <mat-label>Estado Activo</mat-label>
              <mat-select formControlName="activo">
                <mat-option [value]="null">Todos</mat-option>
                <mat-option [value]="true">Solo Activos</mat-option>
                <mat-option [value]="false">Solo Inactivos</mat-option>
              </mat-select>
              <app-smart-icon iconName="toggle_on" [size]="20" matSuffix></app-smart-icon>
              <mat-hint>Filtrar por estado de activación</mat-hint>
            </mat-form-field>
          </div>

          <!-- Botones de acción -->
          <div class="filtros-actions" role="group" aria-label="Acciones de filtros">
            <button mat-stroked-button 
                    type="button"
                    (click)="limpiarTodosFiltros()"
                    [disabled]="!tieneFiltrosActivos()"
                    [attr.aria-label]="'Limpiar todos los filtros'"
                    [attr.aria-disabled]="!tieneFiltrosActivos()">
              <app-smart-icon iconName="clear_all" [size]="18" [attr.aria-hidden]="true"></app-smart-icon>
              Limpiar Todo
            </button>
            
            <button mat-raised-button 
                    color="primary"
                    type="button"
                    (click)="aplicarFiltros()"
                    [disabled]="!filtrosForm.dirty"
                    [attr.aria-label]="'Aplicar filtros de búsqueda'"
                    [attr.aria-disabled]="!filtrosForm.dirty">
              <app-smart-icon iconName="search" [size]="18" [attr.aria-hidden]="true"></app-smart-icon>
              Aplicar Filtros
            </button>
          </div>
        </form>

        <!-- Chips de filtros activos -->
        @if (filtrosActivos().length > 0) {
          <div class="filtros-activos-section" role="region" aria-label="Filtros aplicados actualmente">
            <h4 class="filtros-activos-title">
              <app-smart-icon iconName="local_offer" [size]="16" [attr.aria-hidden]="true"></app-smart-icon>
              Filtros Aplicados
            </h4>
            <mat-chip-set class="filtros-chips" role="list" [attr.aria-label]="'Lista de ' + filtrosActivos().length + ' filtros aplicados'">
              @for (filtro of filtrosActivos(); track filtro.key) {
                <mat-chip 
                  [removable]="true"
                  (removed)="removerFiltro(filtro.key)"
                  class="filtro-chip"
                  role="listitem"
                  [attr.aria-label]="'Filtro: ' + filtro.label + '. Presione Enter o Espacio para remover'">
                  {{ filtro.label }}
                  <app-smart-icon iconName="cancel" [size]="16" matChipRemove [attr.aria-hidden]="true"></app-smart-icon>
                </mat-chip>
              }
            </mat-chip-set>
          </div>
        }
      </div>
    </mat-expansion-panel>

    <!-- Versión móvil: Toolbar con filtros rápidos -->
    <div class="mobile-filters" [class.mobile-visible]="esMobile()">
      <!-- Toolbar de filtros rápidos -->
      <mat-toolbar class="mobile-toolbar">
        <div class="quick-filters-container">
          <!-- Botón principal de filtros -->
          <button mat-raised-button 
                  color="primary"
                  (click)="abrirFiltrosMobile()"
                  class="mobile-filter-button">
            <app-smart-icon iconName="filter_list" [size]="20"></app-smart-icon>
            Filtros
            @if (contadorFiltros() > 0) {
              <span class="filter-count-badge">{{ contadorFiltros() }}</span>
            }
          </button>

          <!-- Filtros rápidos -->
          <button mat-button 
                  [matMenuTriggerFor]="quickFiltersMenu"
                  class="quick-filter-button">
            <app-smart-icon iconName="flash_on" [size]="18"></app-smart-icon>
            Rápidos
          </button>

          <mat-menu #quickFiltersMenu="matMenu">
            <button mat-menu-item (click)="aplicarFiltroRapido('vigentes')">
              <app-smart-icon iconName="check_circle" [size]="18"></app-smart-icon>
              <span>Solo Vigentes</span>
            </button>
            <button mat-menu-item (click)="aplicarFiltroRapido('activos')">
              <app-smart-icon iconName="toggle_on" [size]="18"></app-smart-icon>
              <span>Solo Activos</span>
            </button>
            <button mat-menu-item (click)="aplicarFiltroRapido('recientes')">
              <app-smart-icon iconName="schedule" [size]="18"></app-smart-icon>
              <span>Últimos 30 días</span>
            </button>
            <button mat-menu-item (click)="aplicarFiltroRapido('proximos-vencer')">
              <app-smart-icon iconName="warning" [size]="18"></app-smart-icon>
              <span>Próximos a vencer</span>
            </button>
          </mat-menu>

          <!-- Botón limpiar -->
          @if (contadorFiltros() > 0) {
            <button mat-icon-button 
                    (click)="limpiarTodosFiltros()"
                    matTooltip="Limpiar filtros"
                    class="clear-button">
              <app-smart-icon iconName="clear_all" [size]="20"></app-smart-icon>
            </button>
          }
        </div>
      </mat-toolbar>
      
      <!-- Chips de filtros activos en móvil -->
      @if (filtrosActivos().length > 0) {
        <div class="mobile-chips-container">
          <mat-chip-set class="mobile-chips">
            @for (filtro of filtrosActivos(); track filtro.key) {
              <mat-chip 
                [removable]="true"
                (removed)="removerFiltro(filtro.key)"
                class="mobile-chip">
                {{ filtro.label }}
                <app-smart-icon iconName="cancel" [size]="14" matChipRemove></app-smart-icon>
              </mat-chip>
            }
          </mat-chip-set>
        </div>
      }
    </div>
  `,
  styles: [`
    .filtros-panel {
      margin-bottom: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filtros-badge {
      background-color: #1976d2;
      color: white;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 500;
      min-width: 20px;
      text-align: center;
    }

    .filtros-content {
      padding: 16px 0;
    }

    .filtros-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .filtros-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      align-items: start;
    }

    .filtro-field {
      width: 100%;
    }

    .filtro-fecha {
      grid-column: span 2;
    }

    .filtro-activo {
      min-width: 200px;
    }

    .filtros-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .filtros-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filtros-activos-section {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .filtros-activos-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.7);
    }

    .filtros-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .filtro-chip {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .filtro-chip:hover {
      background-color: #bbdefb;
    }

    /* Mobile filters */
    .mobile-filters {
      display: none;
      flex-direction: column;
      gap: 0;
    }

    .mobile-filters.mobile-visible {
      display: flex;
    }

    .desktop-filters.mobile-hidden {
      display: none;
    }

    .mobile-toolbar {
      background-color: white;
      border-bottom: 1px solid #e0e0e0;
      padding: 8px 16px;
      min-height: 56px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .quick-filters-container {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .mobile-filter-button {
      display: flex;
      align-items: center;
      gap: 6px;
      position: relative;
      padding: 0 16px;
    }

    .filter-count-badge {
      background-color: white;
      color: #1976d2;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 4px;
    }

    .quick-filter-button {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
    }

    .clear-button {
      margin-left: auto;
    }

    .mobile-chips-container {
      background: white;
      padding: 8px 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .mobile-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .mobile-chip {
      font-size: 11px;
      height: 28px;
      background-color: #e3f2fd;
      color: #1976d2;
    }

    /* Responsive design */
    @media (min-width: 769px) {
      .mobile-filters {
        display: none !important;
      }
      
      .desktop-filters {
        display: block !important;
      }
    }

    @media (max-width: 768px) {
      .filtros-panel {
        margin-bottom: 8px;
      }
      
      .filtros-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .filtro-fecha {
        grid-column: span 1;
      }
      
      .filtros-actions {
        flex-direction: column;
        gap: 8px;
      }
      
      .filtros-actions button {
        width: 100%;
        justify-content: center;
      }
      
      .filtros-activos-section {
        margin-top: 16px;
        padding-top: 12px;
      }
      
      .filtros-chips {
        gap: 6px;
      }
      
      .filtro-chip {
        font-size: 11px;
        height: 28px;
      }
    }

    @media (max-width: 480px) {
      .filtros-content {
        padding: 12px 0;
      }
      
      .filtros-form {
        gap: 12px;
      }
      
      .filtros-row {
        gap: 10px;
      }
      
      .panel-title span {
        font-size: 14px;
      }
      
      .filtros-badge {
        font-size: 10px;
        padding: 1px 6px;
      }
      
      .mobile-toolbar {
        padding: 6px 12px;
        min-height: 48px;
      }
      
      .mobile-filter-button {
        font-size: 13px;
        padding: 0 12px;
      }
      
      .quick-filter-button {
        font-size: 12px;
      }
      
      .mobile-chips-container {
        padding: 6px 12px;
      }
    }

    /* Estilos globales para el modal móvil */
    :host ::ng-deep .mobile-fullscreen-dialog {
      .mat-mdc-dialog-container {
        padding: 0;
        border-radius: 0;
      }
      
      .mat-mdc-dialog-surface {
        border-radius: 0;
      }
    }
  `]
})
export class ResolucionesFiltersComponent implements OnInit, OnDestroy {
  /** Filtros actuales aplicados */
  @Input() filtros: ResolucionFiltros = {};
  
  /** Lista de empresas disponibles */
  @Input() empresas: any[] = [];
  
  /** Si el panel debe estar expandido por defecto */
  @Input() expandidoPorDefecto: boolean = false;
  
  /** Evento emitido cuando cambian los filtros */
  @Output() filtrosChange = new EventEmitter<ResolucionFiltros>();
  
  /** Evento emitido cuando se limpian todos los filtros */
  @Output() limpiarFiltros = new EventEmitter<void>();

  // Formulario de filtros
  filtrosForm: FormGroup;
  rangoFechasControl: any;
  
  // Opciones para selects
  tiposTramiteOpciones = TIPOS_TRAMITE_OPCIONES;
  estadosOpciones = ESTADOS_RESOLUCION_OPCIONES;
  
  // Señales para estado reactivo
  panelExpandido = signal(false);
  contadorFiltros = signal(0);
  filtrosActivos = signal<FiltroActivo[]>([]);
  
  // Subject para cleanup
  private destroy$ = new Subject<void>();
  
  // Señal para detectar móvil
  esMobile = signal(false);

  constructor(
    private fb: FormBuilder,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog
  ) {
    this.rangoFechasControl = this.fb.control<RangoFechas | null>(null);
    this.filtrosForm = this.fb.group({
      numeroResolucion: [''],
      empresaId: [''],
      tiposTramite: [[]],
      estados: [[]],
      activo: [null]
    });
  }

  ngOnInit(): void {
    // Establecer estado inicial del panel
    this.panelExpandido.set(this.expandidoPorDefecto);
    
    // Detectar cambios de breakpoint para móvil
    this.breakpointObserver.observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.esMobile.set(result.matches);
      });
    
    // Cargar filtros iniciales
    this.cargarFiltros(this.filtros);
    
    // Suscribirse a cambios en el formulario con debounce
    this.filtrosForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.actualizarEstadoFiltros();
    });
    
    // Suscribirse a cambios en el rango de fechas
    this.rangoFechasControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.actualizarEstadoFiltros();
    });
    
    // Actualizar estado inicial
    this.actualizarEstadoFiltros();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // GESTIÓN DE FILTROS
  // ========================================

  /**
   * Carga los filtros en el formulario
   */
  private cargarFiltros(filtros: ResolucionFiltros): void {
    this.filtrosForm.patchValue({
      numeroResolucion: filtros.numeroResolucion || '',
      empresaId: filtros.empresaId || '',
      tiposTramite: filtros.tiposTramite || [],
      estados: filtros.estados || [],
      activo: filtros.activo ?? null
    }, { emitEvent: false });

    // Cargar rango de fechas
    if (filtros.fechaInicio || filtros.fechaFin) {
      this.rangoFechasControl.setValue({
        inicio: filtros.fechaInicio || null,
        fin: filtros.fechaFin || null
      }, { emitEvent: false });
    }
  }

  /**
   * Actualiza el estado de los filtros y contador
   */
  private actualizarEstadoFiltros(): void {
    const filtrosActuales = this.obtenerFiltrosActuales();
    const activos = this.generarFiltrosActivos(filtrosActuales);
    
    this.filtrosActivos.set(activos);
    this.contadorFiltros.set(activos.length);
  }

  /**
   * Obtiene los filtros actuales del formulario
   */
  private obtenerFiltrosActuales(): ResolucionFiltros {
    const formValue = this.filtrosForm.value;
    const rangoFechas = this.rangoFechasControl.value;
    
    const filtros: ResolucionFiltros = {};
    
    if (formValue.numeroResolucion?.trim()) {
      filtros.numeroResolucion = formValue.numeroResolucion.trim();
    }
    
    if (formValue.empresaId) {
      filtros.empresaId = formValue.empresaId;
    }
    
    if (formValue.tiposTramite?.length > 0) {
      filtros.tiposTramite = formValue.tiposTramite;
    }
    
    if (formValue.estados?.length > 0) {
      filtros.estados = formValue.estados;
    }
    
    if (formValue.activo !== null) {
      filtros.activo = formValue.activo;
    }
    
    if (rangoFechas?.inicio) {
      filtros.fechaInicio = rangoFechas.inicio;
    }
    
    if (rangoFechas?.fin) {
      filtros.fechaFin = rangoFechas.fin;
    }
    
    return filtros;
  }

  /**
   * Genera la lista de filtros activos para mostrar como chips
   */
  private generarFiltrosActivos(filtros: ResolucionFiltros): FiltroActivo[] {
    const activos: FiltroActivo[] = [];

    if (filtros.numeroResolucion) {
      activos.push({
        key: 'numeroResolucion',
        label: `Número: ${filtros.numeroResolucion}`,
        value: filtros.numeroResolucion,
        tipo: 'text'
      });
    }

    if (filtros.empresaId) {
      // TODO: Obtener nombre real de la empresa
      activos.push({
        key: 'empresaId',
        label: `Empresa: ${filtros.empresaId}`,
        value: filtros.empresaId,
        tipo: 'empresa'
      });
    }

    if (filtros.tiposTramite?.length) {
      activos.push({
        key: 'tiposTramite',
        label: `Tipos: ${filtros.tiposTramite.join(', ')}`,
        value: filtros.tiposTramite,
        tipo: 'select'
      });
    }

    if (filtros.estados?.length) {
      activos.push({
        key: 'estados',
        label: `Estados: ${filtros.estados.join(', ')}`,
        value: filtros.estados,
        tipo: 'select'
      });
    }

    if (filtros.fechaInicio || filtros.fechaFin) {
      const fechaTexto = this.formatearRangoFechas(filtros.fechaInicio, filtros.fechaFin);
      activos.push({
        key: 'fechas',
        label: `Fechas: ${fechaTexto}`,
        value: { inicio: filtros.fechaInicio, fin: filtros.fechaFin },
        tipo: 'date'
      });
    }

    if (typeof filtros.activo !== "undefined") {
      const estadoTexto = filtros.activo ? 'Activos' : 'Inactivos';
      activos.push({
        key: 'activo',
        label: `Estado: ${estadoTexto}`,
        value: filtros.activo,
        tipo: 'select'
      });
    }

    return activos;
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Maneja el toggle del panel de expansión
   */
  onPanelToggle(expandido: boolean): void {
    this.panelExpandido.set(expandido);
  }

  /**
   * Maneja el cambio de empresa
   */
  onEmpresaChange(empresaId: string): void {
    this.filtrosForm.patchValue({ empresaId });
  }

  /**
   * Maneja la selección de empresa
   */
  onEmpresaSeleccionada(empresa: any): void {
    // Actualizar el label del chip con el nombre real de la empresa
    if (empresa) {
      // El cambio se maneja automáticamente por el formulario
    }
  }

  /**
   * Maneja el cambio de rango de fechas
   */
  onRangoFechasChange(rango: RangoFechas): void {
    // El cambio se maneja automáticamente por el control
  }

  /**
   * Aplica los filtros actuales
   */
  aplicarFiltros(): void {
    const filtros = this.obtenerFiltrosActuales();
    this.filtrosChange.emit(filtros);
    this.filtrosForm.markAsPristine();
  }

  /**
   * Limpia todos los filtros
   */
  limpiarTodosFiltros(): void {
    this.filtrosForm.reset({
      numeroResolucion: '',
      empresaId: '',
      tiposTramite: [],
      estados: [],
      activo: null
    });
    
    this.rangoFechasControl.reset();
    
    this.limpiarFiltros.emit();
    this.filtrosChange.emit({});
  }

  /**
   * Remueve un filtro específico
   */
  removerFiltro(key: string): void {
    switch (key) {
      case 'numeroResolucion':
        this.filtrosForm.patchValue({ numeroResolucion: '' });
        break;
      case 'empresaId':
        this.filtrosForm.patchValue({ empresaId: '' });
        break;
      case 'tiposTramite':
        this.filtrosForm.patchValue({ tiposTramite: [] });
        break;
      case 'estados':
        this.filtrosForm.patchValue({ estados: [] });
        break;
      case 'fechas':
        this.rangoFechasControl.reset();
        break;
      case 'activo':
        this.filtrosForm.patchValue({ activo: null });
        break;
    }
    
    // Aplicar cambios automáticamente
    setTimeout(() => this.aplicarFiltros(), 100);
  }

  // ========================================
  // UTILIDADES
  // ========================================

  /**
   * Verifica si hay filtros activos
   */
  tieneFiltrosActivos(): boolean {
    return this.contadorFiltros() > 0;
  }

  /**
   * Abre el modal de filtros en móvil
   */
  abrirFiltrosMobile(): void {
    const dialogRef = this.dialog.open(FiltrosMobileModalComponent, {
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      panelClass: 'mobile-fullscreen-dialog',
      data: {
        filtros: this.obtenerFiltrosActuales(),
        empresas: this.empresas
      }
    });

    dialogRef.afterClosed().subscribe(filtros => {
      if (filtros) {
        this.cargarFiltros(filtros);
        this.filtrosChange.emit(filtros);
      }
    });
  }

  /**
   * Aplica un filtro rápido predefinido
   */
  aplicarFiltroRapido(tipo: string): void {
    const hoy = new Date();
    let filtros: ResolucionFiltros = {};

    switch (tipo) {
      case 'vigentes':
        filtros = {
          estados: ['VIGENTE']
        };
        break;
      
      case 'activos':
        filtros = {
          activo: true
        };
        break;
      
      case 'recientes':
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);
        filtros = {
          fechaInicio: hace30Dias,
          fechaFin: hoy
        };
        break;
      
      case 'proximos-vencer':
        const en30Dias = new Date();
        en30Dias.setDate(hoy.getDate() + 30);
        filtros = {
          estados: ['VIGENTE'],
          fechaInicio: hoy,
          fechaFin: en30Dias
        };
        break;
    }

    this.cargarFiltros(filtros);
    this.filtrosChange.emit(filtros);
  }

  /**
   * Formatea un rango de fechas para mostrar
   */
  private formatearRangoFechas(inicio?: Date, fin?: Date): string {
    const formatoFecha = (fecha: Date) => fecha.toLocaleDateString('es-PE');
    
    if (inicio && fin) {
      return `${formatoFecha(inicio)} - ${formatoFecha(fin)}`;
    } else if (inicio) {
      return `Desde ${formatoFecha(inicio)}`;
    } else if (fin) {
      return `Hasta ${formatoFecha(fin)}`;
    }
    
    return '';
  }
}