import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Observable, of, debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs';

interface FiltrosBusqueda {
  texto?: string;
  placa?: string;
  empresaId?: string;
  marca?: string;
  modelo?: string;
  categoria?: string;
  estado?: string;
  anioDesde?: number;
  anioHasta?: number;
  sedeRegistro?: string;
  conTuc?: boolean;
  conResolucion?: boolean;
  conRutas?: boolean;
}

interface SugerenciaBusqueda {
  tipo: 'placa' | 'marca' | 'modelo' | 'empresa';
  valor: string;
  descripcion?: string;
  icono: string;
}

@Component({
  selector: 'app-vehiculo-busqueda-avanzada',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatSliderModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatTooltipModule,
    SmartIconComponent
  ],
  template: `
    <div class="busqueda-container">
      <!-- Búsqueda principal -->
      <div class="busqueda-principal">
        <mat-form-field appearance="outline" class="campo-busqueda">
          <mat-label>Buscar vehículos...</mat-label>
          <input matInput 
                 formControlName="busquedaGeneral"
                 placeholder="Placa, marca, modelo, empresa..."
                 [matAutocomplete]="autoSugerencias"
                 (input)="onBusquedaChange($event)">
          <app-smart-icon [iconName]="'search'" [size]="24" matSuffix></app-smart-icon>
          
          <mat-autocomplete #autoSugerencias="matAutocomplete" 
                           [autoActiveFirstOption]="true"
                           (optionSelected)="onSugerenciaSeleccionada($event)">
            @for (sugerencia of sugerencias(); track sugerencia.valor) {
              <mat-option [value]="sugerencia.valor">
                <div class="sugerencia-item">
                  <app-smart-icon [iconName]="sugerencia.icono" [size]="20"></app-smart-icon>
                  <div class="sugerencia-info">
                    <span class="sugerencia-valor">{{ sugerencia.valor }}</span>
                    @if (sugerencia.descripcion) {
                      <small class="sugerencia-descripcion">{{ sugerencia.descripcion }}</small>
                    }
                  </div>
                  <mat-chip class="sugerencia-tipo">{{ sugerencia.tipo }}</mat-chip>
                </div>
              </mat-option>
            }
            @empty {
              <mat-option disabled>
                <div class="no-sugerencias">
                  <app-smart-icon [iconName]="'search_off'" [size]="20"></app-smart-icon>
                  <span>No se encontraron sugerencias</span>
                </div>
              </mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>

        <div class="acciones-busqueda">
          <button mat-raised-button 
                  color="primary" 
                  (click)="buscar()"
                  [disabled]="!hayFiltros()">
            <app-smart-icon [iconName]="'search'" [size]="20"></app-smart-icon>
            Buscar
          </button>
          
          <button mat-button 
                  (click)="limpiarFiltros()"
                  [disabled]="!hayFiltros()">
            <app-smart-icon [iconName]="'clear'" [size]="20"></app-smart-icon>
            Limpiar
          </button>
          
          <button mat-icon-button 
                  (click)="toggleFiltrosAvanzados()"
                  [matTooltip]="mostrarFiltrosAvanzados() ? 'Ocultar filtros' : 'Mostrar filtros avanzados'">
            <app-smart-icon [iconName]="mostrarFiltrosAvanzados() ? 'expand_less' : 'tune'" [size]="24"></app-smart-icon>
          </button>
        </div>
      </div>

      <!-- Filtros activos -->
      @if (filtrosActivos().length > 0) {
        <div class="filtros-activos">
          <span class="filtros-label">Filtros activos:</span>
          <div class="chips-container">
            @for (filtro of filtrosActivos(); track filtro.clave) {
              <mat-chip [removable]="true" (removed)="removerFiltro(filtro.clave)">
                <app-smart-icon [iconName]="filtro.icono" [size]="16"></app-smart-icon>
                {{ filtro.etiqueta }}: {{ filtro.valor }}
                <app-smart-icon matChipRemove [iconName]="'cancel'" [size]="16"></app-smart-icon>
              </mat-chip>
            }
          </div>
        </div>
      }

      <!-- Filtros avanzados -->
      <mat-expansion-panel [expanded]="mostrarFiltrosAvanzados()" class="filtros-avanzados">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <app-smart-icon [iconName]="'filter_list'" [size]="20"></app-smart-icon>
            Filtros Avanzados
          </mat-panel-title>
          <mat-panel-description>
            {{ contarFiltrosAvanzados() }} filtro(s) configurado(s)
          </mat-panel-description>
        </mat-expansion-panel-header>

        <form [formGroup]="filtrosForm" class="filtros-form">
          <!-- Fila 1: Identificación -->
          <div class="filtros-seccion">
            <h4>Identificación del Vehículo</h4>
            <div class="filtros-fila">
              <mat-form-field appearance="outline">
                <mat-label>Placa específica</mat-label>
                <input matInput formControlName="placa" placeholder="ABC-123">
                <app-smart-icon [iconName]="'directions_car'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Empresa</mat-label>
                <mat-select formControlName="empresaId">
                  <mat-option value="">Todas las empresas</mat-option>
                  @for (empresa of empresas(); track empresa.id) {
                    <mat-option [value]="empresa.id">
                      {{ empresa.ruc }} - {{ empresa.razonSocial?.principal }}
                    </mat-option>
                  }
                </mat-select>
                <app-smart-icon [iconName]="'business'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Sede de Registro</mat-label>
                <mat-select formControlName="sedeRegistro">
                  <mat-option value="">Todas las sedes</mat-option>
                  <mat-option value="PUNO">Puno</mat-option>
                  <mat-option value="JULIACA">Juliaca</mat-option>
                  <mat-option value="LIMA">Lima</mat-option>
                  <mat-option value="AREQUIPA">Arequipa</mat-option>
                  <mat-option value="CUSCO">Cusco</mat-option>
                </mat-select>
                <app-smart-icon [iconName]="'location_city'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>
            </div>
          </div>

          <!-- Fila 2: Características técnicas -->
          <div class="filtros-seccion">
            <h4>Características Técnicas</h4>
            <div class="filtros-fila">
              <mat-form-field appearance="outline">
                <mat-label>Marca</mat-label>
                <input matInput 
                       formControlName="marca" 
                       placeholder="Toyota, Mercedes..."
                       [matAutocomplete]="autoMarcas">
                <mat-autocomplete #autoMarcas="matAutocomplete">
                  @for (marca of marcasDisponibles(); track marca) {
                    <mat-option [value]="marca">{{ marca }}</mat-option>
                  }
                </mat-autocomplete>
                <app-smart-icon [iconName]="'branding_watermark'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Modelo</mat-label>
                <input matInput 
                       formControlName="modelo" 
                       placeholder="Corolla, Sprinter..."
                       [matAutocomplete]="autoModelos">
                <mat-autocomplete #autoModelos="matAutocomplete">
                  @for (modelo of modelosDisponibles(); track modelo) {
                    <mat-option [value]="modelo">{{ modelo }}</mat-option>
                  }
                </mat-autocomplete>
                <app-smart-icon [iconName]="'model_training'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Categoría</mat-label>
                <mat-select formControlName="categoria">
                  <mat-option value="">Todas las categorías</mat-option>
                  <mat-option value="M1">M1 - Hasta 8 asientos</mat-option>
                  <mat-option value="M2">M2 - 9 a 16 asientos</mat-option>
                  <mat-option value="M3">M3 - Más de 16 asientos</mat-option>
                  <mat-option value="N1">N1 - Carga hasta 3.5t</mat-option>
                  <mat-option value="N2">N2 - Carga 3.5 a 12t</mat-option>
                  <mat-option value="N3">N3 - Carga más de 12t</mat-option>
                </mat-select>
                <app-smart-icon [iconName]="'category'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>
            </div>
          </div>

          <!-- Fila 3: Estado y año -->
          <div class="filtros-seccion">
            <h4>Estado y Antigüedad</h4>
            <div class="filtros-fila">
              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado">
                  <mat-option value="">Todos los estados</mat-option>
                  <mat-option value="ACTIVO">Activo</mat-option>
                  <mat-option value="INACTIVO">Inactivo</mat-option>
                  <mat-option value="EN_MANTENIMIENTO">En Mantenimiento</mat-option>
                  <mat-option value="FUERA_DE_SERVICIO">Fuera de Servicio</mat-option>
                </mat-select>
                <app-smart-icon [iconName]="'check_circle'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Año desde</mat-label>
                <input matInput 
                       formControlName="anioDesde" 
                       type="number" 
                       placeholder="2000"
                       [min]="1990"
                       [max]="getCurrentYear()">
                <app-smart-icon [iconName]="'calendar_today'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Año hasta</mat-label>
                <input matInput 
                       formControlName="anioHasta" 
                       type="number" 
                       placeholder="2025"
                       [min]="1990"
                       [max]="getCurrentYear() + 1">
                <app-smart-icon [iconName]="'calendar_today'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>
            </div>
          </div>

          <!-- Fila 4: Documentación -->
          <div class="filtros-seccion">
            <h4>Documentación y Habilitaciones</h4>
            <div class="filtros-checkboxes">
              <mat-checkbox formControlName="conTuc">
                <app-smart-icon [iconName]="'verified'" [size]="20"></app-smart-icon>
                Solo vehículos con TUC vigente
              </mat-checkbox>

              <mat-checkbox formControlName="conResolucion">
                <app-smart-icon [iconName]="'description'" [size]="20"></app-smart-icon>
                Solo vehículos con resolución asignada
              </mat-checkbox>

              <mat-checkbox formControlName="conRutas">
                <app-smart-icon [iconName]="'route'" [size]="20"></app-smart-icon>
                Solo vehículos con rutas asignadas
              </mat-checkbox>
            </div>
          </div>

          <!-- Acciones de filtros avanzados -->
          <div class="filtros-acciones">
            <button mat-button (click)="guardarFiltroPersonalizado()">
              <app-smart-icon [iconName]="'bookmark'" [size]="20"></app-smart-icon>
              Guardar Filtro
            </button>
            
            <button mat-button (click)="cargarFiltroPersonalizado()">
              <app-smart-icon [iconName]="'folder_open'" [size]="20"></app-smart-icon>
              Cargar Filtro
            </button>
            
            <button mat-raised-button color="primary" (click)="aplicarFiltrosAvanzados()">
              <app-smart-icon [iconName]="'filter_alt'" [size]="20"></app-smart-icon>
              Aplicar Filtros
            </button>
          </div>
        </form>
      </mat-expansion-panel>

      <!-- Resultados de búsqueda rápida -->
      @if (resultadosBusqueda().length > 0) {
        <div class="resultados-rapidos">
          <h4>Resultados de búsqueda ({{ resultadosBusqueda().length }})</h4>
          <div class="resultados-lista">
            @for (vehiculo of resultadosBusqueda().slice(0, 5); track vehiculo.id) {
              <div class="resultado-item" (click)="seleccionarVehiculo(vehiculo)">
                <div class="resultado-info">
                  <div class="resultado-principal">
                    <strong>{{ vehiculo.placa }}</strong>
                    <span class="resultado-marca">{{ vehiculo.marca }} {{ vehiculo.modelo }}</span>
                  </div>
                  <div class="resultado-detalles">
                    <small>{{ vehiculo.anioFabricacion }} • {{ vehiculo.categoria }}</small>
                    <mat-chip [class]="'estado-' + vehiculo.estado.toLowerCase()">
                      {{ vehiculo.estado }}
                    </mat-chip>
                  </div>
                </div>
                <app-smart-icon [iconName]="'arrow_forward'" [size]="20"></app-smart-icon>
              </div>
            }
            
            @if (resultadosBusqueda().length > 5) {
              <div class="ver-mas-resultados">
                <button mat-button color="primary" (click)="verTodosLosResultados()">
                  Ver todos los {{ resultadosBusqueda().length }} resultados
                </button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .busqueda-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .busqueda-principal {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .campo-busqueda {
      flex: 1;
      min-width: 300px;
    }

    .acciones-busqueda {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .filtros-activos {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .filtros-label {
      font-weight: 500;
      color: #666;
      white-space: nowrap;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .filtros-avanzados {
      margin-bottom: 24px;
    }

    .filtros-form {
      padding: 16px 0;
    }

    .filtros-seccion {
      margin-bottom: 32px;
    }

    .filtros-seccion h4 {
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 16px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filtros-fila {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .filtros-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .filtros-checkboxes mat-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filtros-acciones {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .sugerencia-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .sugerencia-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sugerencia-valor {
      font-weight: 500;
    }

    .sugerencia-descripcion {
      color: #666;
      font-size: 12px;
    }

    .sugerencia-tipo {
      font-size: 10px;
      height: 20px;
      line-height: 20px;
    }

    .no-sugerencias {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      padding: 16px;
      color: #666;
    }

    .resultados-rapidos {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 24px;
    }

    .resultados-rapidos h4 {
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 18px;
    }

    .resultados-lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .resultado-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .resultado-item:hover {
      background: #f5f5f5;
      border-color: #1976d2;
      transform: translateX(4px);
    }

    .resultado-info {
      flex: 1;
    }

    .resultado-principal {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
    }

    .resultado-principal strong {
      color: #1976d2;
      font-size: 16px;
    }

    .resultado-marca {
      color: #666;
      font-size: 14px;
    }

    .resultado-detalles {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .resultado-detalles small {
      color: #999;
      font-size: 12px;
    }

    .estado-activo {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .estado-inactivo {
      background: #ffebee;
      color: #c62828;
    }

    .estado-en_mantenimiento {
      background: #fff3e0;
      color: #f57c00;
    }

    .ver-mas-resultados {
      text-align: center;
      padding: 16px;
      border-top: 1px solid #e0e0e0;
    }

    @media (max-width: 768px) {
      .busqueda-container {
        padding: 16px;
      }

      .busqueda-principal {
        flex-direction: column;
      }

      .filtros-fila {
        grid-template-columns: 1fr;
      }

      .filtros-activos {
        flex-direction: column;
        align-items: flex-start;
      }

      .filtros-acciones {
        flex-direction: column;
      }
    }
  `]
})
export class VehiculoBusquedaAvanzadaComponent {
  private fb = inject(FormBuilder);
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);

  // Outputs
  vehiculoSeleccionado = output<Vehiculo>();
  filtrosAplicados = output<FiltrosBusqueda>();

  // Estado del componente
  mostrarFiltrosAvanzados = signal(false);
  sugerencias = signal<SugerenciaBusqueda[]>([]);
  resultadosBusqueda = signal<Vehiculo[]>([]);
  empresas = signal<Empresa[]>([]);
  vehiculos = signal<Vehiculo[]>([]);

  // Datos para autocompletado
  marcasDisponibles = computed(() => {
    const marcas = new Set(this.vehiculos().map(v => v.marca).filter(Boolean));
    return Array.from(marcas).sort();
  });

  modelosDisponibles = computed(() => {
    const modelos = new Set(this.vehiculos().map(v => v.modelo).filter(Boolean));
    return Array.from(modelos).sort();
  });

  // Formularios
  filtrosForm = this.fb.group({
    busquedaGeneral: [''],
    placa: [''],
    empresaId: [''],
    marca: [''],
    modelo: [''],
    categoria: [''],
    estado: [''],
    anioDesde: [null],
    anioHasta: [null],
    sedeRegistro: [''],
    conTuc: [false],
    conResolucion: [false],
    conRutas: [false]
  });

  // Computed properties
  hayFiltros = computed(() => {
    const valores = this.filtrosForm.value;
    return Object.values(valores).some(valor => 
      valor !== null && valor !== undefined && valor !== '' && valor !== false
    );
  });

  filtrosActivos = computed(() => {
    const valores = this.filtrosForm.value;
    const activos: Array<{clave: string, etiqueta: string, valor: string, icono: string}> = [];

    if (valores.busquedaGeneral) {
      activos.push({
        clave: 'busquedaGeneral',
        etiqueta: 'Búsqueda',
        valor: valores.busquedaGeneral,
        icono: 'search'
      });
    }

    if (valores.placa) {
      activos.push({
        clave: 'placa',
        etiqueta: 'Placa',
        valor: valores.placa,
        icono: 'directions_car'
      });
    }

    if (valores.empresaId) {
      const empresa = this.empresas().find(e => e.id === valores.empresaId);
      activos.push({
        clave: 'empresaId',
        etiqueta: 'Empresa',
        valor: empresa?.razonSocial?.principal || 'Empresa seleccionada',
        icono: 'business'
      });
    }

    if (valores.marca) {
      activos.push({
        clave: 'marca',
        etiqueta: 'Marca',
        valor: valores.marca,
        icono: 'branding_watermark'
      });
    }

    if (valores.modelo) {
      activos.push({
        clave: 'modelo',
        etiqueta: 'Modelo',
        valor: valores.modelo,
        icono: 'model_training'
      });
    }

    if (valores.categoria) {
      activos.push({
        clave: 'categoria',
        etiqueta: 'Categoría',
        valor: valores.categoria,
        icono: 'category'
      });
    }

    if (valores.estado) {
      activos.push({
        clave: 'estado',
        etiqueta: 'Estado',
        valor: valores.estado,
        icono: 'check_circle'
      });
    }

    if (valores.anioDesde || valores.anioHasta) {
      const rango = `${valores.anioDesde || '∞'} - ${valores.anioHasta || '∞'}`;
      activos.push({
        clave: 'anioRango',
        etiqueta: 'Año',
        valor: rango,
        icono: 'calendar_today'
      });
    }

    if (valores.sedeRegistro) {
      activos.push({
        clave: 'sedeRegistro',
        etiqueta: 'Sede',
        valor: valores.sedeRegistro,
        icono: 'location_city'
      });
    }

    if (valores.conTuc) {
      activos.push({
        clave: 'conTuc',
        etiqueta: 'Con TUC',
        valor: 'Sí',
        icono: 'verified'
      });
    }

    if (valores.conResolucion) {
      activos.push({
        clave: 'conResolucion',
        etiqueta: 'Con Resolución',
        valor: 'Sí',
        icono: 'description'
      });
    }

    if (valores.conRutas) {
      activos.push({
        clave: 'conRutas',
        etiqueta: 'Con Rutas',
        valor: 'Sí',
        icono: 'route'
      });
    }

    return activos;
  });

  ngOnInit(): void {
    this.cargarDatos();
    this.configurarBusquedaInteligente();
  }

  private async cargarDatos(): Promise<void> {
    try {
      const [vehiculos, empresas] = await Promise.all([
        this.vehiculoService.getVehiculos().toPromise(),
        this.empresaService.getEmpresas().toPromise()
      ]);

      this.vehiculos.set(vehiculos || []);
      this.empresas.set(empresas || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  private configurarBusquedaInteligente(): void {
    const busquedaControl = this.filtrosForm.get('busquedaGeneral');
    if (busquedaControl) {
      busquedaControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(termino => this.generarSugerencias(termino || ''))
      ).subscribe(sugerencias => {
        this.sugerencias.set(sugerencias);
      });
    }
  }

  private generarSugerencias(termino: string): Observable<SugerenciaBusqueda[]> {
    if (!termino || termino.length < 2) {
      return of([]);
    }

    const sugerencias: SugerenciaBusqueda[] = [];
    const terminoLower = termino.toLowerCase();

    // Sugerencias de placas
    this.vehiculos()
      .filter(v => v.placa.toLowerCase().includes(terminoLower))
      .slice(0, 3)
      .forEach(vehiculo => {
        sugerencias.push({
          tipo: 'placa',
          valor: vehiculo.placa,
          descripcion: `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.anioFabricacion})`,
          icono: 'directions_car'
        });
      });

    // Sugerencias de marcas
    const marcas = this.marcasDisponibles()
      .filter(marca => marca.toLowerCase().includes(terminoLower))
      .slice(0, 3);
    
    marcas.forEach(marca => {
      const cantidad = this.vehiculos().filter(v => v.marca === marca).length;
      sugerencias.push({
        tipo: 'marca',
        valor: marca,
        descripcion: `${cantidad} vehículo(s)`,
        icono: 'branding_watermark'
      });
    });

    // Sugerencias de modelos
    const modelos = this.modelosDisponibles()
      .filter(modelo => modelo.toLowerCase().includes(terminoLower))
      .slice(0, 3);
    
    modelos.forEach(modelo => {
      const cantidad = this.vehiculos().filter(v => v.modelo === modelo).length;
      sugerencias.push({
        tipo: 'modelo',
        valor: modelo,
        descripcion: `${cantidad} vehículo(s)`,
        icono: 'model_training'
      });
    });

    // Sugerencias de empresas
    this.empresas()
      .filter(empresa => 
        empresa.ruc.includes(termino) || 
        empresa.razonSocial?.principal?.toLowerCase().includes(terminoLower)
      )
      .slice(0, 2)
      .forEach(empresa => {
        sugerencias.push({
          tipo: 'empresa',
          valor: empresa.razonSocial?.principal || empresa.ruc,
          descripcion: `RUC: ${empresa.ruc}`,
          icono: 'business'
        });
      });

    return of(sugerencias.slice(0, 8)); // Máximo 8 sugerencias
  }

  contarFiltrosAvanzados(): number {
    const valores = this.filtrosForm.value;
    let count = 0;
    
    // Contar solo filtros avanzados (no la búsqueda general)
    if (valores.placa) count++;
    if (valores.empresaId) count++;
    if (valores.marca) count++;
    if (valores.modelo) count++;
    if (valores.categoria) count++;
    if (valores.estado) count++;
    if (valores.anioDesde) count++;
    if (valores.anioHasta) count++;
    if (valores.sedeRegistro) count++;
    if (valores.conTuc) count++;
    if (valores.conResolucion) count++;
    if (valores.conRutas) count++;
    
    return count;
  }

  // Métodos de eventos
  onBusquedaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const termino = input.value;
    
    if (termino.length >= 2) {
      this.buscarVehiculosRapido(termino);
    } else {
      this.resultadosBusqueda.set([]);
    }
  }

  onSugerenciaSeleccionada(event: any): void {
    const sugerencia = this.sugerencias().find(s => s.valor === event.option.value);
    if (!sugerencia) return;

    // Aplicar la sugerencia al filtro correspondiente
    switch (sugerencia.tipo) {
      case 'placa':
        this.filtrosForm.patchValue({ placa: sugerencia.valor });
        break;
      case 'marca':
        this.filtrosForm.patchValue({ marca: sugerencia.valor });
        break;
      case 'modelo':
        this.filtrosForm.patchValue({ modelo: sugerencia.valor });
        break;
      case 'empresa':
        const empresa = this.empresas().find(e => 
          e.razonSocial?.principal === sugerencia.valor
        );
        if (empresa) {
          this.filtrosForm.patchValue({ empresaId: empresa.id });
        }
        break;
    }

    // Limpiar búsqueda general y aplicar filtros
    this.filtrosForm.patchValue({ busquedaGeneral: '' });
    this.aplicarFiltrosAvanzados();
  }

  private buscarVehiculosRapido(termino: string): void {
    const terminoLower = termino.toLowerCase();
    
    const resultados = this.vehiculos().filter(vehiculo => {
      return vehiculo.placa.toLowerCase().includes(terminoLower) ||
             vehiculo.marca?.toLowerCase().includes(terminoLower) ||
             vehiculo.modelo?.toLowerCase().includes(terminoLower);
    });

    this.resultadosBusqueda.set(resultados);
  }

  toggleFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados.update(valor => !valor);
  }

  buscar(): void {
    const termino = this.filtrosForm.get('busquedaGeneral')?.value;
    if (termino) {
      this.buscarVehiculosRapido(termino);
    } else {
      this.aplicarFiltrosAvanzados();
    }
  }

  aplicarFiltrosAvanzados(): void {
    const filtros = this.construirFiltros();
    this.filtrosAplicados.emit(filtros);
  }

  private construirFiltros(): FiltrosBusqueda {
    const valores = this.filtrosForm.value;
    const filtros: FiltrosBusqueda = {};

    if (valores.busquedaGeneral) filtros.texto = valores.busquedaGeneral;
    if (valores.placa) filtros.placa = valores.placa;
    if (valores.empresaId) filtros.empresaId = valores.empresaId;
    if (valores.marca) filtros.marca = valores.marca;
    if (valores.modelo) filtros.modelo = valores.modelo;
    if (valores.categoria) filtros.categoria = valores.categoria;
    if (valores.estado) filtros.estado = valores.estado;
    if (valores.anioDesde) filtros.anioDesde = valores.anioDesde;
    if (valores.anioHasta) filtros.anioHasta = valores.anioHasta;
    if (valores.sedeRegistro) filtros.sedeRegistro = valores.sedeRegistro;
    if (valores.conTuc) filtros.conTuc = valores.conTuc;
    if (valores.conResolucion) filtros.conResolucion = valores.conResolucion;
    if (valores.conRutas) filtros.conRutas = valores.conRutas;

    return filtros;
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.resultadosBusqueda.set([]);
    this.sugerencias.set([]);
    this.filtrosAplicados.emit({});
  }

  removerFiltro(clave: string): void {
    if (clave === 'anioRango') {
      this.filtrosForm.patchValue({ anioDesde: null, anioHasta: null });
    } else {
      this.filtrosForm.patchValue({ [clave]: clave.startsWith('con') ? false : '' });
    }
    this.aplicarFiltrosAvanzados();
  }

  seleccionarVehiculo(vehiculo: Vehiculo): void {
    this.vehiculoSeleccionado.emit(vehiculo);
  }

  verTodosLosResultados(): void {
    // Emitir filtros para mostrar todos los resultados en la tabla principal
    const filtros = { texto: this.filtrosForm.get('busquedaGeneral')?.value || undefined };
    this.filtrosAplicados.emit(filtros);
  }

  guardarFiltroPersonalizado(): void {
    const filtros = this.construirFiltros();
    const nombre = prompt('Nombre para este filtro personalizado:');
    
    if (nombre) {
      const filtrosGuardados = JSON.parse(localStorage.getItem('filtrosVehiculos') || '{}');
      filtrosGuardados[nombre] = filtros;
      localStorage.setItem('filtrosVehiculos', JSON.stringify(filtrosGuardados));
      
      console.log(`Filtro "${nombre}" guardado exitosamente`);
    }
  }

  cargarFiltroPersonalizado(): void {
    const filtrosGuardados = JSON.parse(localStorage.getItem('filtrosVehiculos') || '{}');
    const nombres = Object.keys(filtrosGuardados);
    
    if (nombres.length === 0) {
      alert('No hay filtros guardados');
      return;
    }

    const nombre = prompt(`Filtros disponibles:\n${nombres.join('\n')}\n\nIngresa el nombre del filtro a cargar:`);
    
    if (nombre && filtrosGuardados[nombre]) {
      const filtros = filtrosGuardados[nombre];
      this.filtrosForm.patchValue(filtros);
      this.aplicarFiltrosAvanzados();
    }
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }
}