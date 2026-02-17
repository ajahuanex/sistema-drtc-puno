import { Component, OnInit, OnDestroy, inject, signal, computed, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { Observable, of, Subject } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { LocalidadService } from '../../services/localidad.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { Localidad } from '../../models/localidad.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { TipoRuta, TipoServicio, EstadoRuta } from '../../models/ruta.model';

export interface FiltrosAvanzadosData {
  // Filtros de ubicación
  origen?: Localidad;
  destino?: Localidad;
  departamento?: string;
  provincia?: string;
  
  // Filtros de empresa y resolución
  empresas?: Empresa[];
  resoluciones?: Resolucion[];
  
  // Filtros de tipo y estado
  tiposRuta?: TipoRuta[];
  tiposServicio?: TipoServicio[];
  estados?: EstadoRuta[];
  
  // Filtros de fecha
  fechaDesde?: Date;
  fechaHasta?: Date;
  
  // Filtros de texto
  codigoRuta?: string;
  descripcion?: string;
  frecuencias?: string;
  
  // Filtros numéricos
  distanciaMin?: number;
  distanciaMax?: number;
  tarifaMin?: number;
  tarifaMax?: number;
  
  // Filtros booleanos
  soloActivas?: boolean;
  conItinerario?: boolean;
  sinDuplicados?: boolean;
}

@Component({
  selector: 'app-filtros-avanzados-rutas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule
  ],
  template: `
    <mat-card class="filtros-avanzados-card">
      <mat-card-header>
        <mat-card-title>
          <button mat-button 
                  class="toggle-filtros-btn"
                  (click)="toggleExpanded()">
            <mat-icon>{{ expanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            Filtros Avanzados
            @if (tienesFiltrosActivos()) {
              <span class="filtros-activos-badge">{{ contadorFiltrosActivos() }}</span>
            }
          </button>
        </mat-card-title>
        <div class="filtros-actions">
          <button mat-icon-button 
                  (click)="limpiarTodosFiltros()"
                  matTooltip="Limpiar todos los filtros"
                  [disabled]="!tienesFiltrosActivos()">
            <mat-icon>clear_all</mat-icon>
          </button>
          <button mat-icon-button 
                  (click)="aplicarFiltros()"
                  matTooltip="Aplicar filtros"
                  color="primary">
            <mat-icon>search</mat-icon>
          </button>
        </div>
      </mat-card-header>

      @if (expanded()) {
        <mat-card-content>
          <form [formGroup]="filtrosForm" class="filtros-form">
            
            <!-- Sección: Ubicación -->
            <mat-expansion-panel class="filtro-seccion">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>place</mat-icon>
                  Filtros de Ubicación
                </mat-panel-title>
              </mat-expansion-panel-header>
              
              <div class="filtros-grid">
                <!-- Origen -->
                <mat-form-field appearance="outline">
                  <mat-label>Origen</mat-label>
                  <input matInput 
                         formControlName="origen"
                         [matAutocomplete]="origenAuto"
                         placeholder="Buscar localidad de origen">
                  <mat-autocomplete #origenAuto="matAutocomplete" 
                                   [displayWith]="displayLocalidad">
                    @for (localidad of localidadesOrigenFiltradas | async; track localidad.id) {
                      <mat-option [value]="localidad">
                        <div class="localidad-option">
                          <span class="localidad-nombre">{{ localidad.nombre }}</span>
                          <span class="localidad-detalle">{{ localidad.provincia }}, {{ localidad.departamento }}</span>
                        </div>
                      </mat-option>
                    }
                  </mat-autocomplete>
                </mat-form-field>

                <!-- Destino -->
                <mat-form-field appearance="outline">
                  <mat-label>Destino</mat-label>
                  <input matInput 
                         formControlName="destino"
                         [matAutocomplete]="destinoAuto"
                         placeholder="Buscar localidad de destino">
                  <mat-autocomplete #destinoAuto="matAutocomplete" 
                                   [displayWith]="displayLocalidad">
                    @for (localidad of localidadesDestinoFiltradas | async; track localidad.id) {
                      <mat-option [value]="localidad">
                        <div class="localidad-option">
                          <span class="localidad-nombre">{{ localidad.nombre }}</span>
                          <span class="localidad-detalle">{{ localidad.provincia }}, {{ localidad.departamento }}</span>
                        </div>
                      </mat-option>
                    }
                  </mat-autocomplete>
                </mat-form-field>

                <!-- Departamento -->
                <mat-form-field appearance="outline">
                  <mat-label>Departamento</mat-label>
                  <mat-select formControlName="departamento" multiple>
                    @for (depto of departamentos(); track depto) {
                      <mat-option [value]="depto">{{ depto }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <!-- Provincia -->
                <mat-form-field appearance="outline">
                  <mat-label>Provincia</mat-label>
                  <mat-select formControlName="provincia" multiple>
                    @for (prov of provincias(); track prov) {
                      <mat-option [value]="prov">{{ prov }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-expansion-panel>

            <!-- Sección: Empresa y Resolución -->
            <mat-expansion-panel class="filtro-seccion">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>business</mat-icon>
                  Empresa y Resolución
                </mat-panel-title>
              </mat-expansion-panel-header>
              
              <div class="filtros-grid">
                <!-- Empresas -->
                <mat-form-field appearance="outline">
                  <mat-label>Empresas</mat-label>
                  <mat-select formControlName="empresas" multiple>
                    @for (empresa of empresas(); track empresa.id) {
                      <mat-option [value]="empresa">
                        <div class="empresa-option">
                          <span class="empresa-ruc">{{ empresa.ruc }}</span>
                          <span class="empresa-razon">{{ empresa.razonSocial?.principal || 'Sin razón social' }}</span>
                        </div>
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <!-- Resoluciones -->
                <mat-form-field appearance="outline">
                  <mat-label>Resoluciones</mat-label>
                  <mat-select formControlName="resoluciones" multiple>
                    @for (resolucion of resoluciones(); track resolucion.id) {
                      <mat-option [value]="resolucion">
                        <div class="resolucion-option">
                          <span class="resolucion-numero">{{ resolucion.nroResolucion }}</span>
                          <span class="resolucion-tipo">{{ resolucion.tipoResolucion }}</span>
                        </div>
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-expansion-panel>

            <!-- Sección: Tipo y Estado -->
            <mat-expansion-panel class="filtro-seccion">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>category</mat-icon>
                  Tipo y Estado
                </mat-panel-title>
              </mat-expansion-panel-header>
              
              <div class="filtros-grid">
                <!-- Tipos de Ruta -->
                <mat-form-field appearance="outline">
                  <mat-label>Tipos de Ruta</mat-label>
                  <mat-select formControlName="tiposRuta" multiple>
                    <mat-option value="URBANA">Urbana</mat-option>
                    <mat-option value="INTERURBANA">Interurbana</mat-option>
                    <mat-option value="INTERPROVINCIAL">Interprovincial</mat-option>
                    <mat-option value="INTERREGIONAL">Interregional</mat-option>
                    <mat-option value="RURAL">Rural</mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Tipos de Servicio -->
                <mat-form-field appearance="outline">
                  <mat-label>Tipos de Servicio</mat-label>
                  <mat-select formControlName="tiposServicio" multiple>
                    <mat-option value="PASAJEROS">Pasajeros</mat-option>
                    <mat-option value="CARGA">Carga</mat-option>
                    <mat-option value="MIXTO">Mixto</mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Estados -->
                <mat-form-field appearance="outline">
                  <mat-label>Estados</mat-label>
                  <mat-select formControlName="estados" multiple>
                    <mat-option value="ACTIVA">Activa</mat-option>
                    <mat-option value="INACTIVA">Inactiva</mat-option>
                    <mat-option value="SUSPENDIDA">Suspendida</mat-option>
                    <mat-option value="EN_MANTENIMIENTO">En Mantenimiento</mat-option>
                    <mat-option value="ARCHIVADA">Archivada</mat-option>
                    <mat-option value="DADA_DE_BAJA">Dada de Baja</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-expansion-panel>

            <!-- Sección: Fechas -->
            <mat-expansion-panel class="filtro-seccion">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>date_range</mat-icon>
                  Rango de Fechas
                </mat-panel-title>
              </mat-expansion-panel-header>
              
              <div class="filtros-grid">
                <!-- Fecha Desde -->
                <mat-form-field appearance="outline">
                  <mat-label>Fecha Desde</mat-label>
                  <input matInput 
                         [matDatepicker]="fechaDesdePicker"
                         formControlName="fechaDesde"
                         placeholder="Seleccionar fecha">
                  <mat-datepicker-toggle matSuffix [for]="fechaDesdePicker"></mat-datepicker-toggle>
                  <mat-datepicker #fechaDesdePicker></mat-datepicker>
                </mat-form-field>

                <!-- Fecha Hasta -->
                <mat-form-field appearance="outline">
                  <mat-label>Fecha Hasta</mat-label>
                  <input matInput 
                         [matDatepicker]="fechaHastaPicker"
                         formControlName="fechaHasta"
                         placeholder="Seleccionar fecha">
                  <mat-datepicker-toggle matSuffix [for]="fechaHastaPicker"></mat-datepicker-toggle>
                  <mat-datepicker #fechaHastaPicker></mat-datepicker>
                </mat-form-field>
              </div>
            </mat-expansion-panel>

            <!-- Sección: Búsqueda de Texto -->
            <mat-expansion-panel class="filtro-seccion">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>search</mat-icon>
                  Búsqueda de Texto
                </mat-panel-title>
              </mat-expansion-panel-header>
              
              <div class="filtros-grid">
                <!-- Código de Ruta -->
                <mat-form-field appearance="outline">
                  <mat-label>Código de Ruta</mat-label>
                  <input matInput 
                         formControlName="codigoRuta"
                         placeholder="Ej: 01, 02A, etc.">
                </mat-form-field>

                <!-- Descripción -->
                <mat-form-field appearance="outline">
                  <mat-label>Descripción</mat-label>
                  <input matInput 
                         formControlName="descripcion"
                         placeholder="Buscar en descripción">
                </mat-form-field>

                <!-- Frecuencias -->
                <mat-form-field appearance="outline">
                  <mat-label>Frecuencias</mat-label>
                  <input matInput 
                         formControlName="frecuencias"
                         placeholder="Buscar en frecuencias">
                </mat-form-field>
              </div>
            </mat-expansion-panel>

            <!-- Sección: Filtros Numéricos -->
            <mat-expansion-panel class="filtro-seccion">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>straighten</mat-icon>
                  Filtros Numéricos
                </mat-panel-title>
              </mat-expansion-panel-header>
              
              <div class="filtros-grid">
                <!-- Distancia Mínima -->
                <mat-form-field appearance="outline">
                  <mat-label>Distancia Mínima (km)</mat-label>
                  <input matInput 
                         type="number"
                         formControlName="distanciaMin"
                         placeholder="0">
                </mat-form-field>

                <!-- Distancia Máxima -->
                <mat-form-field appearance="outline">
                  <mat-label>Distancia Máxima (km)</mat-label>
                  <input matInput 
                         type="number"
                         formControlName="distanciaMax"
                         placeholder="1000">
                </mat-form-field>

                <!-- Tarifa Mínima -->
                <mat-form-field appearance="outline">
                  <mat-label>Tarifa Mínima (S/)</mat-label>
                  <input matInput 
                         type="number"
                         step="0.01"
                         formControlName="tarifaMin"
                         placeholder="0.00">
                </mat-form-field>

                <!-- Tarifa Máxima -->
                <mat-form-field appearance="outline">
                  <mat-label>Tarifa Máxima (S/)</mat-label>
                  <input matInput 
                         type="number"
                         step="0.01"
                         formControlName="tarifaMax"
                         placeholder="100.00">
                </mat-form-field>
              </div>
            </mat-expansion-panel>

            <!-- Sección: Opciones Especiales -->
            <mat-expansion-panel class="filtro-seccion">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>tune</mat-icon>
                  Opciones Especiales
                </mat-panel-title>
              </mat-expansion-panel-header>
              
              <div class="filtros-checkboxes">
                <mat-checkbox formControlName="soloActivas">
                  Solo rutas activas
                </mat-checkbox>
                
                <mat-checkbox formControlName="conItinerario">
                  Solo rutas con itinerario definido
                </mat-checkbox>
                
                <mat-checkbox formControlName="sinDuplicados">
                  Excluir rutas duplicadas
                </mat-checkbox>
              </div>
            </mat-expansion-panel>

          </form>

          <!-- Acciones -->
          <div class="filtros-footer">
            <button mat-button (click)="limpiarTodosFiltros()">
              <mat-icon>clear</mat-icon>
              Limpiar Todo
            </button>
            
            <button mat-button (click)="guardarFiltros()">
              <mat-icon>bookmark</mat-icon>
              Guardar Filtros
            </button>
            
            <button mat-raised-button 
                    color="primary" 
                    (click)="aplicarFiltros()">
              <mat-icon>search</mat-icon>
              Aplicar Filtros
            </button>
          </div>
        </mat-card-content>
      }
    </mat-card>
  `,
  styles: [`
    .filtros-avanzados-card {
      margin-bottom: 20px;
      border: 2px solid #e3f2fd;
    }

    .toggle-filtros-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      color: #1976d2;
      padding: 0;
      min-width: auto;
    }

    .filtros-activos-badge {
      background-color: #ff9800;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      margin-left: 8px;
    }

    .filtros-actions {
      display: flex;
      gap: 8px;
    }

    .filtros-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .filtro-seccion {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .filtros-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .filtros-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
    }

    .filtros-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .localidad-option {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .localidad-nombre {
      font-weight: 500;
      color: #333;
    }

    .localidad-detalle {
      font-size: 12px;
      color: #666;
    }

    .empresa-option {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .empresa-ruc {
      font-weight: 500;
      color: #1976d2;
      font-family: monospace;
    }

    .empresa-razon {
      font-size: 12px;
      color: #666;
    }

    .resolucion-option {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .resolucion-numero {
      font-weight: 500;
      color: #1976d2;
    }

    .resolucion-tipo {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }

    @media (max-width: 768px) {
      .filtros-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .filtros-footer {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class FiltrosAvanzadosRutasComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private localidadService = inject(LocalidadService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);

  @Input() filtrosIniciales?: FiltrosAvanzadosData;
  @Output() filtrosChanged = new EventEmitter<FiltrosAvanzadosData>();
  @Output() filtrosCleared = new EventEmitter<void>();

  // Signals
  expanded = signal(false);
  localidades = signal<Localidad[]>([]);
  empresas = signal<Empresa[]>([]);
  resoluciones = signal<Resolucion[]>([]);

  // Computed
  departamentos = computed(() => {
    const localidades = this.localidades();
    return [...new Set(localidades.map(l => l.departamento).filter(d => d))].sort();
  });

  provincias = computed(() => {
    const localidades = this.localidades();
    return [...new Set(localidades.map(l => l.provincia).filter(p => p))].sort();
  });

  tienesFiltrosActivos = computed(() => {
    const values = this.filtrosForm.value;
    return Object.values(values).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (value instanceof Date) return true;
      return value !== null && value !== undefined && value !== '';
    });
  });

  contadorFiltrosActivos = computed(() => {
    const values = this.filtrosForm.value;
    let count = 0;
    Object.values(values).forEach(value => {
      if (Array.isArray(value) && value.length > 0) count++;
      else if (value instanceof Date) count++;
      else if (value !== null && value !== undefined && value !== '') count++;
    });
    return count;
  });

  // Form
  filtrosForm: FormGroup;

  // Observables para autocomplete
  localidadesOrigenFiltradas!: Observable<Localidad[]>;
  localidadesDestinoFiltradas!: Observable<Localidad[]>;

  constructor() {
    this.filtrosForm = this.fb.group({
      // Ubicación
      origen: [null],
      destino: [null],
      departamento: [[]],
      provincia: [[]],
      
      // Empresa y resolución
      empresas: [[]],
      resoluciones: [[]],
      
      // Tipo y estado
      tiposRuta: [[]],
      tiposServicio: [[]],
      estados: [[]],
      
      // Fechas
      fechaDesde: [null],
      fechaHasta: [null],
      
      // Texto
      codigoRuta: [''],
      descripcion: [''],
      frecuencias: [''],
      
      // Numéricos
      distanciaMin: [null],
      distanciaMax: [null],
      tarifaMin: [null],
      tarifaMax: [null],
      
      // Booleanos
      soloActivas: [false],
      conItinerario: [false],
      sinDuplicados: [false]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
    this.configurarAutocompletado();
    this.configurarCambiosFiltros();
    
    if (this.filtrosIniciales) {
      this.aplicarFiltrosIniciales();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async cargarDatos(): Promise<void> {
    try {
      const [localidades, empresas, resoluciones] = await Promise.all([
        this.localidadService.obtenerLocalidades(),
        this.empresaService.getEmpresas().pipe(takeUntil(this.destroy$)).toPromise(),
        this.resolucionService.getResoluciones().pipe(takeUntil(this.destroy$)).toPromise()
      ]);

      this.localidades.set(localidades || []);
      this.empresas.set(empresas || []);
      this.resoluciones.set(resoluciones || []);
    } catch (error) {
      console.error('Error cargando datos para filtros:', error);
    }
  }

  private configurarAutocompletado(): void {
    // Autocomplete para origen
    this.localidadesOrigenFiltradas = this.filtrosForm.get('origen')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => {
        if (typeof value === 'string') {
          return this.filtrarLocalidades(value);
        }
        return this.localidades();
      })
    );

    // Autocomplete para destino
    this.localidadesDestinoFiltradas = this.filtrosForm.get('destino')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => {
        if (typeof value === 'string') {
          return this.filtrarLocalidades(value);
        }
        return this.localidades();
      })
    );
  }

  private configurarCambiosFiltros(): void {
    this.filtrosForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.tienesFiltrosActivos()) {
        this.emitirCambiosFiltros();
      }
    });
  }

  private filtrarLocalidades(valor: string): Localidad[] {
    if (!valor || valor.length < 2) return [];
    
    const filtro = valor.toLowerCase();
    return this.localidades().filter(localidad =>
      localidad.nombre.toLowerCase().includes(filtro) ||
      (localidad.provincia && localidad.provincia.toLowerCase().includes(filtro)) ||
      (localidad.departamento && localidad.departamento.toLowerCase().includes(filtro))
    ).slice(0, 10);
  }

  displayLocalidad(localidad: Localidad): string {
    return localidad ? localidad.nombre : '';
  }

  toggleExpanded(): void {
    this.expanded.set(!this.expanded());
  }

  aplicarFiltros(): void {
    this.emitirCambiosFiltros();
  }

  limpiarTodosFiltros(): void {
    this.filtrosForm.reset({
      departamento: [],
      provincia: [],
      empresas: [],
      resoluciones: [],
      tiposRuta: [],
      tiposServicio: [],
      estados: [],
      codigoRuta: '',
      descripcion: '',
      frecuencias: '',
      soloActivas: false,
      conItinerario: false,
      sinDuplicados: false
    });
    
    this.filtrosCleared.emit();
  }

  guardarFiltros(): void {
    const filtros = this.obtenerFiltrosActuales();
    localStorage.setItem('filtros_rutas_avanzados', JSON.stringify(filtros));
    // Aquí podrías mostrar un mensaje de confirmación
  }

  private aplicarFiltrosIniciales(): void {
    if (this.filtrosIniciales) {
      this.filtrosForm.patchValue(this.filtrosIniciales);
    }
  }

  private emitirCambiosFiltros(): void {
    const filtros = this.obtenerFiltrosActuales();
    this.filtrosChanged.emit(filtros);
  }

  private obtenerFiltrosActuales(): FiltrosAvanzadosData {
    const values = this.filtrosForm.value;
    const filtros: FiltrosAvanzadosData = {};

    // Solo incluir valores que no estén vacíos
    Object.keys(values).forEach(key => {
      const value = values[key];
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          (filtros as any)[key] = value;
        } else if (!Array.isArray(value)) {
          (filtros as any)[key] = value;
        }
      }
    });

    return filtros;
  }
}