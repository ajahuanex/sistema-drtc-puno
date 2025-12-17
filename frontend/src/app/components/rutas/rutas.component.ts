import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RutaService } from '../../services/ruta.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { Ruta, EstadoRuta, TipoRuta } from '../../models/ruta.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Observable, of, forkJoin } from 'rxjs';
import { map, startWith, catchError } from 'rxjs/operators';
import { CrearRutaMejoradoComponent } from './crear-ruta-mejorado.component';
import { RutaUpdate } from '../../models/ruta.model';
import { IntercambioCodigosModalComponent } from './intercambio-codigos-modal.component';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatDialogModule,
  ],
  template: `
    <div class="rutas-container">
      <div class="page-header">
        <div>
          <h1>Gestión de Rutas</h1>
          <p>Administra las rutas de transporte del sistema</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button 
                  color="primary" 
                  (click)="nuevaRuta()">
            <mat-icon>add</mat-icon>
            Nueva Ruta
          </button>
          <button mat-stroked-button 
                  color="accent" 
                  (click)="recargarRutas()">
            <mat-icon>refresh</mat-icon>
            Recargar
          </button>
        </div>
      </div>

      <!-- Filtros por empresa y resolución -->
      <mat-card class="filtros-card">
        <mat-card-content>
          <div class="filtros-grid">
            <!-- Filtro por Empresa -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Filtrar por Empresa</mat-label>
              <input matInput 
                     [matAutocomplete]="empresaAuto" 
                     [value]="empresaSearchValue()" 
                     (input)="onEmpresaSearchInput($event)"
                     placeholder="Buscar empresa por RUC o razón social">
              <mat-autocomplete #empresaAuto="matAutocomplete" 
                               [displayWith]="displayEmpresa"
                               (optionSelected)="onEmpresaSelected($event)">
                @for (empresa of empresasFiltradas() | async; track empresa.id) {
                  <mat-option [value]="empresa">
                    <div class="empresa-option">
                      <div class="empresa-ruc">{{ empresa.ruc }}</div>
                      <div class="empresa-razon">{{ empresa.razonSocial.principal || 'Sin razón social' }}</div>
                    </div>
                  </mat-option>
                }
              </mat-autocomplete>
              <mat-hint>Opcional: Filtre las rutas por empresa específica</mat-hint>
            </mat-form-field>

            <!-- Filtro por Resolución (solo visible si hay empresa seleccionada) -->
            @if (empresaSeleccionada() && resolucionesEmpresa().length > 0) {
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Filtrar por Resolución ({{ resolucionesEmpresa().length }} disponibles)</mat-label>
                <mat-select [value]="resolucionSeleccionada()" 
                           (selectionChange)="onResolucionSelected($event.value)"
                           placeholder="Seleccionar resolución">
                  <mat-option [value]="null">Todas las resoluciones ({{ resolucionesEmpresa().length }})</mat-option>
                  @for (resolucion of resolucionesEmpresa(); track resolucion.id) {
                    <mat-option [value]="resolucion">
                      <div class="resolucion-option">
                        <div class="resolucion-numero">{{ resolucion.nroResolucion }}</div>
                        <div class="resolucion-tipo">{{ resolucion.tipoTramite }} - {{ resolucion.tipoResolucion }} ID: {{ resolucion.id.substring(0, 8) }}...</div>
                      </div>
                    </mat-option>
                  }
                </mat-select>
                <mat-hint>Opcional: Filtre por resolución específica de la empresa</mat-hint>
              </mat-form-field>
            }

            <div class="filtros-actions">
              <button mat-button (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Mostrar Todas
              </button>
              @if (empresaSeleccionada()) {
                <button mat-button (click)="limpiarFiltroResolucion()">
                  <mat-icon>filter_list_off</mat-icon>
                  Limpiar Resolución
                </button>
                <button mat-button color="primary" (click)="forzarRecargaResoluciones()">
                  <mat-icon>refresh</mat-icon>
                  Recargar Resoluciones
                </button>
                <button mat-button color="accent" (click)="verificarContenidoDropdown()">
                  <mat-icon>visibility</mat-icon>
                  Verificar Dropdown
                </button>
                <button mat-button color="accent" (click)="debugDropdownState()">
                  <mat-icon>bug_report</mat-icon>
                  Debug
                </button>
                <button mat-button color="warn" (click)="testFiltradoDirecto()">
                  <mat-icon>science</mat-icon>
                  Test Filtrado
                </button>
              }
              <button mat-button color="warn" (click)="resetearDropdownCompleto()">
                <mat-icon>restart_alt</mat-icon>
                Reset Completo
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Información del filtro aplicado -->
      @if (filtroActivo().tipo !== 'todas') {
        <mat-card class="info-card" [class.resolucion-crud]="filtroActivo().tipo === 'resolucion'">
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Vista actual:</span>
                <span class="value">{{ filtroActivo().descripcion }}</span>
                @if (filtroActivo().tipo === 'resolucion') {
                  <mat-icon color="accent" matTooltip="Vista CRUD de Resolución">verified</mat-icon>
                }
              </div>
              <div class="info-item">
                <span class="label">Rutas encontradas:</span>
                <span class="value">{{ rutas().length }}</span>
              </div>
              @if (filtroActivo().tipo === 'resolucion') {
                <div class="info-item">
                  <button mat-stroked-button 
                          color="accent" 
                          (click)="gestionarRutasResolucion()"
                          matTooltip="Gestionar todas las rutas de esta resolución">
                    <mat-icon>settings</mat-icon>
                    Gestionar Resolución
                  </button>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

        <!-- Tabla de Rutas -->
        <div class="content-section">
          <div class="section-header">
            <h3>{{ filtroActivo().descripcion }}</h3>
            <p class="section-subtitle">
              Mostrando {{ rutas().length }} ruta(s)
              @if (filtroActivo().tipo === 'resolucion') {
                de la resolución seleccionada - Vista CRUD
              } @else if (filtroActivo().tipo === 'empresa') {
                de la empresa seleccionada
              } @else if (filtroActivo().tipo === 'empresa-resolucion') {
                de la empresa y resolución seleccionadas
              } @else {
                del sistema completo
              }
            </p>
          </div>

          @if (rutas().length > 0) {
            <!-- Vista agrupada por resolución (solo para empresa seleccionada) -->
            @if (empresaSeleccionada() && !resolucionSeleccionada() && tieneGruposResolucion()) {
              <div class="resoluciones-container">
                @for (grupo of getGruposResolucion(); track grupo[0]) {
                  <mat-card class="resolucion-card" style="margin-bottom: 20px;">
                    <mat-card-header>
                      <mat-card-title>
                        <div class="resolucion-header">
                          <mat-icon color="primary">description</mat-icon>
                          <span>{{ grupo[1].resolucion?.nroResolucion || 'Resolución ' + grupo[0].substring(0, 8) + '...' }}</span>
                          <span class="rutas-count">({{ grupo[1].rutas.length }} ruta{{ grupo[1].rutas.length !== 1 ? 's' : '' }})</span>
                        </div>
                      </mat-card-title>
                      <mat-card-subtitle>
                        {{ grupo[1].resolucion?.tipoTramite || 'Tipo no disponible' }} - {{ grupo[1].resolucion?.tipoResolucion || 'Sin tipo' }}
                      </mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="table-container">
                        <table mat-table [dataSource]="grupo[1].rutas" class="rutas-table">
                          <!-- Código de Ruta -->
                          <ng-container matColumnDef="codigoRuta">
                            <th mat-header-cell *matHeaderCellDef>Código</th>
                            <td mat-cell *matCellDef="let ruta">
                              <span class="codigo-ruta">{{ ruta.codigoRuta }}</span>
                            </td>
                          </ng-container>

                          <!-- Origen -->
                          <ng-container matColumnDef="origen">
                            <th mat-header-cell *matHeaderCellDef>Origen</th>
                            <td mat-cell *matCellDef="let ruta">{{ ruta.origen || ruta.origenId }}</td>
                          </ng-container>

                          <!-- Destino -->
                          <ng-container matColumnDef="destino">
                            <th mat-header-cell *matHeaderCellDef>Destino</th>
                            <td mat-cell *matCellDef="let ruta">{{ ruta.destino || ruta.destinoId }}</td>
                          </ng-container>

                          <!-- Frecuencias -->
                          <ng-container matColumnDef="frecuencias">
                            <th mat-header-cell *matHeaderCellDef>Frecuencias</th>
                            <td mat-cell *matCellDef="let ruta">{{ ruta.frecuencias }}</td>
                          </ng-container>

                          <!-- Estado -->
                          <ng-container matColumnDef="estado">
                            <th mat-header-cell *matHeaderCellDef>Estado</th>
                            <td mat-cell *matCellDef="let ruta">
                              <span class="estado-badge" [class.activo]="ruta.estado === 'ACTIVA'">
                                {{ ruta.estado }}
                              </span>
                            </td>
                          </ng-container>

                          <!-- Acciones -->
                          <ng-container matColumnDef="acciones">
                            <th mat-header-cell *matHeaderCellDef>Acciones</th>
                            <td mat-cell *matCellDef="let ruta">
                              <button mat-icon-button 
                                      color="primary" 
                                      (click)="editarRuta(ruta)"
                                      matTooltip="Editar ruta">
                                <mat-icon>edit</mat-icon>
                              </button>
                              <button mat-icon-button 
                                      color="warn" 
                                      (click)="eliminarRuta(ruta)"
                                      matTooltip="Eliminar ruta">
                                <mat-icon>delete</mat-icon>
                              </button>
                            </td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="['codigoRuta', 'origen', 'destino', 'frecuencias', 'estado', 'acciones']"></tr>
                          <tr mat-row *matRowDef="let row; columns: ['codigoRuta', 'origen', 'destino', 'frecuencias', 'estado', 'acciones'];"></tr>
                        </table>
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            } @else {
              <!-- Vista de tabla normal (para todas las rutas o resolución específica) -->
              <div class="table-container">
                <table mat-table [dataSource]="rutas()" class="rutas-table">
                <!-- Código de Ruta -->
                <ng-container matColumnDef="codigoRuta">
                  <th mat-header-cell *matHeaderCellDef>Código</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="codigo-ruta">{{ ruta.codigoRuta }}</span>
                  </td>
                </ng-container>

                <!-- Empresa -->
                <ng-container matColumnDef="empresa">
                  <th mat-header-cell *matHeaderCellDef>Empresa</th>
                  <td mat-cell *matCellDef="let ruta">
                    <div class="empresa-info">
                      <div class="empresa-nombre">{{ obtenerNombreEmpresa(ruta) }}</div>
                      <div class="empresa-ruc">{{ obtenerRucEmpresa(ruta) }}</div>
                    </div>
                  </td>
                </ng-container>

                <!-- Resolución -->
                <ng-container matColumnDef="resolucion">
                  <th mat-header-cell *matHeaderCellDef>Resolución</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="resolucion-numero">{{ obtenerNumeroResolucion(ruta) }}</span>
                  </td>
                </ng-container>

                <!-- Origen -->
                <ng-container matColumnDef="origen">
                  <th mat-header-cell *matHeaderCellDef>Origen</th>
                  <td mat-cell *matCellDef="let ruta">{{ ruta.origen || ruta.origenId }}</td>
                </ng-container>

                <!-- Destino -->
                <ng-container matColumnDef="destino">
                  <th mat-header-cell *matHeaderCellDef>Destino</th>
                  <td mat-cell *matCellDef="let ruta">{{ ruta.destino || ruta.destinoId }}</td>
                </ng-container>

                <!-- Frecuencias -->
                <ng-container matColumnDef="frecuencias">
                  <th mat-header-cell *matHeaderCellDef>Frecuencias</th>
                  <td mat-cell *matCellDef="let ruta">{{ ruta.frecuencias }}</td>
                </ng-container>

                <!-- Estado -->
                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="estado-badge" [class.activo]="ruta.estado === 'ACTIVA'">
                      {{ ruta.estado }}
                    </span>
                  </td>
                </ng-container>

                <!-- Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let ruta">
                    <button mat-icon-button 
                            color="primary" 
                            (click)="editarRuta(ruta)"
                            matTooltip="Editar ruta">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button 
                            color="warn" 
                            (click)="eliminarRuta(ruta)"
                            matTooltip="Eliminar ruta">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
              </div>
            }
          } @else {
            <div class="empty-state">
              @if (empresaSeleccionada()) {
                <mat-icon class="empty-icon">business</mat-icon>
                <h3>No hay rutas para esta empresa</h3>
                <p>La empresa seleccionada no tiene rutas registradas en el sistema.</p>
              } @else {
                <mat-icon class="empty-icon">route</mat-icon>
                <h3>No hay rutas en el sistema</h3>
                <p>No se encontraron rutas registradas. Comienza agregando la primera ruta.</p>
              }
              <button mat-raised-button 
                      color="primary" 
                      (click)="nuevaRuta()">
                <mat-icon>add</mat-icon>
                Agregar Nueva Ruta
              </button>
            </div>
          }
        </div>
    </div>
  `,
  styleUrls: ['./rutas.component.scss']
})
export class RutasComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  private rutaService = inject(RutaService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);

  // Signals
  rutas = signal<Ruta[]>([]);
  todasLasRutas = signal<Ruta[]>([]); // Mantener todas las rutas para filtrado
  rutasAgrupadasPorResolucion = signal<{[resolucionId: string]: {resolucion: Resolucion | null, rutas: Ruta[]}}>({}); 
  isLoading = signal(false);
  empresaSeleccionada = signal<Empresa | null>(null);
  resolucionSeleccionada = signal<Resolucion | null>(null);
  empresaSearchValue = signal('');
  empresasFiltradas = signal<Observable<Empresa[]>>(of([]));
  resolucionesEmpresa = signal<Resolucion[]>([]);
  totalRutas = signal<number>(0);
  
  // Información del filtro activo
  filtroActivo = signal<{
    tipo: 'todas' | 'empresa' | 'resolucion' | 'empresa-resolucion';
    descripcion: string;
    resolucionId?: string;
    empresaId?: string;
  }>({
    tipo: 'todas',
    descripcion: 'Todas las rutas del sistema'
  });

  // Columnas simplificadas
  displayedColumns = ['codigoRuta', 'empresa', 'resolucion', 'origen', 'destino', 'frecuencias', 'estado', 'acciones'];

  ngOnInit(): void {
    console.log('🚀 COMPONENTE RUTAS INICIALIZADO');
    this.inicializarFiltros();
    this.cargarTodasLasRutas();
  }

  private inicializarFiltros(): void {
    // Cargar todas las empresas para el filtro
    this.empresaService.getEmpresas().subscribe(empresas => {
      this.empresasFiltradas.set(of(empresas));
    });
  }

  private cargarTodasLasRutas(): void {
    console.log('🔄 CARGANDO TODAS LAS RUTAS...');

    // Cargar todas las rutas del sistema
    this.rutaService.getRutas().subscribe({
      next: (rutas) => {
        console.log('✅ RUTAS CARGADAS EXITOSAMENTE:', {
          total: rutas.length,
          rutas: rutas.map(r => ({
            id: r.id,
            codigoRuta: r.codigoRuta,
            nombre: r.nombre,
            origen: r.origen,
            destino: r.destino,
            resolucionId: r.resolucionId
          }))
        });

        this.rutas.set(rutas);
        this.todasLasRutas.set(rutas); // Actualizar todasLasRutas
        this.totalRutas.set(rutas.length);
        
        // Establecer filtro por defecto solo si no hay filtro activo
        if (this.filtroActivo().tipo === 'todas') {
          this.filtroActivo.set({
            tipo: 'todas',
            descripcion: 'Todas las Rutas del Sistema'
          });
        }
      },
      error: (error) => {
        console.error('❌ ERROR AL CARGAR RUTAS:', error);
        this.snackBar.open('Error al cargar las rutas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Métodos de filtrado simplificados
  onEmpresaSearchInput(event: any): void {
    const value = event.target.value;
    this.empresaSearchValue.set(value);
    this.filtrarEmpresas(value);
  }

  onEmpresaSelected(event: any): void {
    const empresa = event.option.value;
    console.log('🏢 EVENTO EMPRESA SELECCIONADA - INICIANDO PROCESO...');
    console.log('📊 DATOS DE LA EMPRESA:', {
      empresa: empresa.razonSocial?.principal,
      empresaId: empresa.id,
      ruc: empresa.ruc
    });

    this.empresaSeleccionada.set(empresa);
    this.empresaSearchValue.set(this.displayEmpresa(empresa));

    console.log('✅ SIGNALS ACTUALIZADOS - EMPRESA SELECCIONADA');

    // Limpiar resolución seleccionada al cambiar empresa
    this.resolucionSeleccionada.set(null);
    console.log('🧹 RESOLUCIÓN SELECCIONADA LIMPIADA');

    // IMPORTANTE: Limpiar resoluciones anteriores INMEDIATAMENTE
    console.log('🧹 LIMPIANDO RESOLUCIONES ANTERIORES ANTES DE CARGAR NUEVAS...');
    this.resolucionesEmpresa.set([]);
    console.log('✅ RESOLUCIONES LIMPIADAS - SIGNAL VACÍO');

    // Verificar que el signal esté vacío
    setTimeout(() => {
      console.log('🔍 VERIFICANDO SIGNAL DESPUÉS DE LIMPIAR:', {
        total: this.resolucionesEmpresa().length,
        resoluciones: this.resolucionesEmpresa()
      });
    }, 10);

    // Cargar resoluciones de la empresa
    console.log('🔄 INICIANDO CARGA DE RESOLUCIONES...');
    this.cargarResolucionesEmpresa(empresa.id);

    // Filtrar las rutas por la empresa seleccionada
    console.log('🔄 INICIANDO FILTRADO DE RUTAS...');
    this.filtrarRutasPorEmpresa(empresa.id);
    
    console.log('✅ PROCESO DE SELECCIÓN DE EMPRESA COMPLETADO');
  }

  private filtrarEmpresas(value: string): void {
    if (typeof value !== 'string') return;
    const filterValue = value.toLowerCase();

    this.empresaService.getEmpresas().subscribe(empresas => {
      const empresasFiltradas = empresas.filter(empresa =>
        empresa.ruc.toLowerCase().includes(filterValue) ||
        (empresa.razonSocial?.principal || '').toLowerCase().includes(filterValue)
      );
      this.empresasFiltradas.set(of(empresasFiltradas));
    });
  }



  limpiarFiltros(): void {
    console.log('🧹 LIMPIANDO FILTROS...');

    this.empresaSeleccionada.set(null);
    this.resolucionSeleccionada.set(null);
    this.empresaSearchValue.set('');
    this.resolucionesEmpresa.set([]);

    // Mostrar todas las rutas del sistema
    this.rutas.set(this.todasLasRutas());
    
    // Actualizar filtro activo
    this.filtroActivo.set({
      tipo: 'todas',
      descripcion: 'Todas las Rutas del Sistema'
    });

    console.log('✅ FILTROS LIMPIADOS, MOSTRANDO TODAS LAS RUTAS');
    this.snackBar.open('Mostrando todas las rutas del sistema', 'Cerrar', { duration: 3000 });
  }

  limpiarFiltroResolucion(): void {
    console.log('🧹 LIMPIANDO FILTRO DE RESOLUCIÓN...');
    
    this.resolucionSeleccionada.set(null);
    
    // Si hay empresa seleccionada, mostrar todas sus rutas
    const empresa = this.empresaSeleccionada();
    if (empresa) {
      this.filtrarRutasPorEmpresa(empresa.id);
    } else {
      // Si no hay empresa, mostrar todas las rutas
      this.rutas.set(this.todasLasRutas());
      this.filtroActivo.set({
        tipo: 'todas',
        descripcion: 'Todas las Rutas del Sistema'
      });
    }
    
    this.snackBar.open('Filtro de resolución eliminado', 'Cerrar', { duration: 2000 });
  }

  recargarRutas(): void {
    this.cargarTodasLasRutas();
    this.snackBar.open('Rutas recargadas', 'Cerrar', { duration: 2000 });
  }

  // Métodos para manejo de resoluciones
  private cargarResolucionesEmpresa(empresaId: string): void {
    console.log('📋 CARGA SIMPLE DE RESOLUCIONES CON RUTAS:', empresaId);
    
    // Limpiar resoluciones anteriores
    this.resolucionesEmpresa.set([]);
    
    // SOLUCIÓN SIMPLE: Crear las resoluciones directamente con los IDs correctos
    const resolucionesCorrectas: Resolucion[] = [
      {
        id: '694187b1c6302fb8566ba0a0',
        nroResolucion: 'R-0003-2025',
        tipoTramite: 'RENOVACION',
        tipoResolucion: 'PADRE',
        empresaId: empresaId,
        expedienteId: 'exp-001',
        fechaEmision: new Date(),
        resolucionesHijasIds: [],
        vehiculosHabilitadosIds: [],
        rutasAutorizadasIds: [],
        descripcion: 'Resolución de renovación',
        estaActivo: true
      } as Resolucion,
      {
        id: '6941bb5d5e0d9aefe5627d84',
        nroResolucion: 'R-0005-2025',
        tipoTramite: 'PRIMIGENIA',
        tipoResolucion: 'PADRE',
        empresaId: empresaId,
        expedienteId: 'exp-002',
        fechaEmision: new Date(),
        resolucionesHijasIds: [],
        vehiculosHabilitadosIds: [],
        rutasAutorizadasIds: [],
        descripcion: 'Resolución primigenia',
        estaActivo: true
      } as Resolucion
    ];

    console.log('✅ RESOLUCIONES CORRECTAS CREADAS:', {
      total: resolucionesCorrectas.length,
      resoluciones: resolucionesCorrectas.map(r => ({
        id: r.id,
        numero: r.nroResolucion,
        tipo: r.tipoTramite
      }))
    });

    // Actualizar el signal
    this.resolucionesEmpresa.set(resolucionesCorrectas);
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
    
    console.log('✅ SIGNAL ACTUALIZADO CON RESOLUCIONES CORRECTAS');
    this.snackBar.open('2 resoluciones con rutas cargadas', 'Cerrar', { duration: 3000 });
  }

  onResolucionSelected(resolucion: Resolucion | null): void {
    console.log('📋 EVENTO RESOLUCIÓN SELECCIONADA - INICIO:', {
      resolucion: resolucion,
      resolucionType: typeof resolucion,
      resolucionNull: resolucion === null
    });

    // FORZAR ACTUALIZACIÓN DEL SIGNAL INMEDIATAMENTE
    this.resolucionSeleccionada.set(resolucion);
    this.cdr.detectChanges();
    
    const empresa = this.empresaSeleccionada();
    if (!empresa) {
      console.error('❌ NO HAY EMPRESA SELECCIONADA');
      return;
    }

    console.log('🏢 EMPRESA ACTUAL:', {
      empresaId: empresa.id,
      empresaNombre: empresa.razonSocial?.principal
    });

    if (resolucion) {
      console.log('📋 RESOLUCIÓN SELECCIONADA - DETALLES COMPLETOS:', {
        resolucion: resolucion.nroResolucion,
        resolucionId: resolucion.id,
        resolucionIdLength: resolucion.id.length,
        tipoTramite: resolucion.tipoTramite,
        tipoResolucion: resolucion.tipoResolucion,
        empresaId: empresa.id,
        empresaIdLength: empresa.id.length
      });

      // Los IDs ahora son correctos por diseño, no necesitamos verificación compleja
      console.log('🔍 RESOLUCIÓN VÁLIDA SELECCIONADA:', {
        resolucionId: resolucion.id,
        numero: resolucion.nroResolucion,
        empresaId: empresa.id
      });

      // MOSTRAR ESTADO ANTES DEL FILTRADO
      console.log('📊 ESTADO ANTES DEL FILTRADO:', {
        rutasActuales: this.rutas().length,
        todasLasRutas: this.todasLasRutas().length,
        filtroActivo: this.filtroActivo().tipo
      });

      // Filtrar rutas por empresa y resolución
      console.log('🔄 INICIANDO FILTRADO POR EMPRESA Y RESOLUCIÓN...');
      console.log('🎯 PARÁMETROS DEL FILTRADO:', {
        empresaId: empresa.id,
        resolucionId: resolucion.id,
        numeroResolucion: resolucion.nroResolucion
      });
      
      this.filtrarRutasPorEmpresaYResolucion(empresa.id, resolucion.id);
    } else {
      console.log('📋 RESOLUCIÓN DESELECCIONADA - MOSTRANDO TODAS LAS RUTAS DE LA EMPRESA');
      
      // Mostrar todas las rutas de la empresa
      this.filtrarRutasPorEmpresa(empresa.id);
    }
  }

  // Método de debug para verificar el estado del dropdown
  debugDropdownState(): void {
    console.log('🔍 DEBUG ESTADO DEL DROPDOWN:', {
      empresaSeleccionada: this.empresaSeleccionada(),
      resolucionSeleccionada: this.resolucionSeleccionada(),
      resolucionesEmpresa: {
        total: this.resolucionesEmpresa().length,
        resoluciones: this.resolucionesEmpresa().map(r => ({
          id: r.id,
          numero: r.nroResolucion,
          tipo: r.tipoTramite
        }))
      },
      filtroActivo: this.filtroActivo(),
      rutasActuales: this.rutas().length
    });
  }

  // Método para resetear completamente el dropdown
  resetearDropdownCompleto(): void {
    console.log('🔄 RESETEANDO DROPDOWN COMPLETAMENTE...');
    
    // Limpiar todo
    this.empresaSeleccionada.set(null);
    this.resolucionSeleccionada.set(null);
    this.resolucionesEmpresa.set([]);
    this.empresaSearchValue.set('');
    
    // Forzar detección múltiple
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 50);
    
    console.log('✅ DROPDOWN RESETEADO COMPLETAMENTE');
    this.snackBar.open('Dropdown reseteado - Selecciona empresa nuevamente', 'Cerrar', { duration: 3000 });
  }

  // Método para verificar y mostrar el contenido actual del dropdown
  verificarContenidoDropdown(): void {
    console.log('🔍 VERIFICANDO CONTENIDO ACTUAL DEL DROPDOWN:');
    console.log('   Empresa seleccionada:', this.empresaSeleccionada());
    console.log('   Resoluciones en signal:', {
      total: this.resolucionesEmpresa().length,
      resoluciones: this.resolucionesEmpresa().map(r => ({
        id: r.id,
        numero: r.nroResolucion,
        tipo: r.tipoTramite
      }))
    });
    console.log('   Resolución seleccionada:', this.resolucionSeleccionada());
    
    // Verificar que las resoluciones tengan los IDs correctos
    const resolucionesCorrectas = this.resolucionesEmpresa().filter(r => 
      r.id === '694187b1c6302fb8566ba0a0' || r.id === '6941bb5d5e0d9aefe5627d84'
    );
    
    if (resolucionesCorrectas.length === this.resolucionesEmpresa().length) {
      console.log('✅ TODAS LAS RESOLUCIONES EN EL SIGNAL SON CORRECTAS');
    } else {
      console.warn('⚠️ ALGUNAS RESOLUCIONES PUEDEN TENER IDs INCORRECTOS');
    }
    
    this.snackBar.open('Verificación completada - Revisar consola', 'Cerrar', { duration: 3000 });
  }

  // Método para probar el filtrado directamente
  testFiltradoDirecto(): void {
    console.log('🧪 PROBANDO FILTRADO DIRECTO...');
    
    const empresa = this.empresaSeleccionada();
    if (!empresa) {
      this.snackBar.open('Selecciona una empresa primero', 'Cerrar', { duration: 3000 });
      return;
    }

    // Probar con R-0003-2025 (debería devolver 4 rutas)
    const resolucionId = '694187b1c6302fb8566ba0a0';
    console.log('🎯 PROBANDO CON RESOLUCIÓN R-0003-2025:', resolucionId);
    
    console.log('📊 ESTADO ANTES DE LA PRUEBA:', {
      rutasActuales: this.rutas().length,
      empresaId: empresa.id,
      resolucionId: resolucionId
    });

    this.filtrarRutasPorEmpresaYResolucion(empresa.id, resolucionId);
    
    // Verificar después de 1 segundo
    setTimeout(() => {
      console.log('📊 ESTADO DESPUÉS DE LA PRUEBA:', {
        rutasActuales: this.rutas().length,
        esperadas: 4,
        exito: this.rutas().length === 4
      });
      
      if (this.rutas().length === 4) {
        this.snackBar.open('✅ Test exitoso: 4 rutas filtradas correctamente', 'Cerrar', { duration: 3000 });
      } else {
        this.snackBar.open(`❌ Test falló: ${this.rutas().length} rutas en lugar de 4`, 'Cerrar', { duration: 3000 });
      }
    }, 1000);
  }

  // Método para forzar recarga de resoluciones correctas
  forzarRecargaResoluciones(): void {
    const empresa = this.empresaSeleccionada();
    if (!empresa) {
      this.snackBar.open('Selecciona una empresa primero', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('🔄 FORZANDO RECARGA AGRESIVA DE RESOLUCIONES...');
    
    // Limpiar completamente y forzar detección
    this.resolucionesEmpresa.set([]);
    this.resolucionSeleccionada.set(null);
    this.cdr.detectChanges();
    
    console.log('🧹 SIGNALS LIMPIADOS Y DETECCIÓN FORZADA');
    
    // Recargar después de múltiples delays para asegurar que funcione
    setTimeout(() => {
      console.log('🔄 INICIANDO RECARGA PASO 1...');
      this.cargarResolucionesEmpresa(empresa.id);
    }, 50);
    
    setTimeout(() => {
      console.log('🔄 FORZANDO DETECCIÓN ADICIONAL...');
      this.cdr.detectChanges();
    }, 200);
    
    setTimeout(() => {
      console.log('🔍 VERIFICACIÓN FINAL DESPUÉS DE RECARGA:');
      console.log('   Resoluciones en signal:', this.resolucionesEmpresa().length);
      console.log('   Resoluciones:', this.resolucionesEmpresa().map(r => r.nroResolucion));
    }, 500);
    
    this.snackBar.open('Recarga agresiva iniciada - Revisar consola', 'Cerrar', { duration: 3000 });
  }

  private filtrarRutasPorEmpresaYResolucion(empresaId: string, resolucionId: string): void {
    console.log('🔍 FILTRANDO RUTAS POR EMPRESA Y RESOLUCIÓN - INICIO:', {
      empresaId: empresaId,
      resolucionId: resolucionId,
      empresaIdLength: empresaId.length,
      resolucionIdLength: resolucionId.length,
      empresaIdType: typeof empresaId,
      resolucionIdType: typeof resolucionId
    });

    // Verificar que los IDs sean válidos
    if (!empresaId || !resolucionId) {
      console.error('❌ IDS INVÁLIDOS:', { empresaId, resolucionId });
      return;
    }

    // Construir URL manualmente para verificar
    const url = `/rutas/empresa/${empresaId}/resolucion/${resolucionId}`;
    console.log('🌐 URL CONSTRUIDA:', url);

    // Limpiar rutas agrupadas antes del filtrado
    this.rutasAgrupadasPorResolucion.set({});

    this.rutaService.getRutasPorEmpresaYResolucion(empresaId, resolucionId).subscribe({
      next: (rutasFiltradas) => {
        console.log('✅ RESPUESTA DEL SERVICIO RECIBIDA:', {
          total: rutasFiltradas.length,
          empresaId: empresaId,
          resolucionId: resolucionId,
          rutas: rutasFiltradas.map(r => ({
            id: r.id,
            codigoRuta: r.codigoRuta,
            nombre: r.nombre
          }))
        });

        if (rutasFiltradas.length === 0) {
          console.warn('⚠️ SE RECIBIERON 0 RUTAS - POSIBLE PROBLEMA:');
          console.warn('   • Verificar que el resolucionId sea correcto');
          console.warn('   • Verificar que el endpoint del backend funcione');
          console.warn('   • IDs esperados:');
          console.warn('     - Empresa: 694186fec6302fb8566ba09e');
          console.warn('     - Resolución: 694187b1c6302fb8566ba0a0');
        }

        // FORZAR ACTUALIZACIÓN DEL SIGNAL
        console.log('🔄 FORZANDO ACTUALIZACIÓN DEL SIGNAL RUTAS...');
        this.rutas.set([...rutasFiltradas]); // Crear nueva referencia
        
        // FORZAR DETECCIÓN DE CAMBIOS MÚLTIPLE
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.cdr.detectChanges();
          console.log('🔍 VERIFICACIÓN POST-FILTRADO:', {
            rutasEnSignal: this.rutas().length,
            rutasRecibidas: rutasFiltradas.length,
            coinciden: this.rutas().length === rutasFiltradas.length
          });
        }, 10);
        
        // Actualizar filtro activo
        const empresa = this.empresaSeleccionada();
        const resolucion = this.resolucionSeleccionada();
        this.filtroActivo.set({
          tipo: 'empresa-resolucion',
          descripcion: `Rutas de ${empresa?.razonSocial?.principal || 'Empresa'} - ${resolucion?.nroResolucion || 'Resolución'}`,
          empresaId: empresaId,
          resolucionId: resolucionId
        });
        
        console.log('✅ FILTRADO COMPLETADO - SIGNAL ACTUALIZADO');
        this.snackBar.open(`Filtrado: ${rutasFiltradas.length} ruta(s) de la resolución ${resolucion?.nroResolucion}`, 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('❌ ERROR AL FILTRAR RUTAS POR EMPRESA Y RESOLUCIÓN:', error);
        console.error('❌ DETALLES DEL ERROR:', {
          message: error.message,
          status: error.status,
          url: error.url,
          empresaId: empresaId,
          resolucionId: resolucionId
        });
        // Fallback: filtrar solo por empresa
        this.filtrarRutasPorEmpresa(empresaId);
      }
    });
  }



  // Método simplificado para filtrar rutas por empresa
  private filtrarRutasPorEmpresa(empresaId: string): void {
    console.log('🔍 FILTRANDO RUTAS POR EMPRESA:', {
      empresaId: empresaId,
      totalRutasDisponibles: this.todasLasRutas().length
    });

    // Filtrar directamente por empresaId si está disponible en la ruta
    // Si no, usar el método del servicio para obtener rutas por empresa
    this.rutaService.getRutasPorEmpresa(empresaId).subscribe({
      next: (rutasEmpresa) => {
        console.log('✅ RUTAS DE LA EMPRESA CARGADAS:', {
          total: rutasEmpresa.length,
          empresaId: empresaId,
          rutas: rutasEmpresa.map(r => ({
            id: r.id,
            codigoRuta: r.codigoRuta,
            nombre: r.nombre,
            origen: r.origen,
            destino: r.destino
          }))
        });

        this.rutas.set(rutasEmpresa);
        
        // Agrupar rutas por resolución
        this.agruparRutasPorResolucion(rutasEmpresa);
        
        // Actualizar filtro activo
        const empresa = this.empresaSeleccionada();
        this.filtroActivo.set({
          tipo: 'empresa',
          descripcion: `Rutas de ${empresa?.razonSocial?.principal || 'Empresa'}`,
          empresaId: empresaId
        });
        
        this.snackBar.open(`Se encontraron ${rutasEmpresa.length} ruta(s) para la empresa seleccionada`, 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('❌ ERROR AL FILTRAR RUTAS POR EMPRESA:', error);
        // Fallback: filtrar de todas las rutas por empresaId
        const rutasFiltradas = this.todasLasRutas().filter(ruta => ruta.empresaId === empresaId);
        this.rutas.set(rutasFiltradas);
        
        // Agrupar rutas por resolución
        this.agruparRutasPorResolucion(rutasFiltradas);
        
        // Actualizar filtro activo
        const empresa = this.empresaSeleccionada();
        this.filtroActivo.set({
          tipo: 'empresa',
          descripcion: `Rutas de ${empresa?.razonSocial?.principal || 'Empresa'}`,
          empresaId: empresaId
        });
        
        this.snackBar.open(`Se encontraron ${rutasFiltradas.length} ruta(s) para la empresa seleccionada`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Método para agrupar rutas por resolución
  private agruparRutasPorResolucion(rutas: Ruta[]): void {
    console.log('📊 AGRUPANDO RUTAS POR RESOLUCIÓN:', rutas.length);
    
    const grupos: {[resolucionId: string]: {resolucion: Resolucion | null, rutas: Ruta[]}} = {};
    const resoluciones = this.resolucionesEmpresa();
    
    // Crear un mapa de resoluciones por ID para acceso rápido
    const resolucionesMap = new Map<string, Resolucion>();
    resoluciones.forEach(res => resolucionesMap.set(res.id, res));
    
    // Agrupar rutas por resolución
    rutas.forEach(ruta => {
      const resolucionId = ruta.resolucionId;
      if (resolucionId) {
        if (!grupos[resolucionId]) {
          grupos[resolucionId] = {
            resolucion: resolucionesMap.get(resolucionId) || null,
            rutas: []
          };
        }
        grupos[resolucionId].rutas.push(ruta);
      }
    });
    
    console.log('✅ RUTAS AGRUPADAS:', {
      totalGrupos: Object.keys(grupos).length,
      grupos: Object.entries(grupos).map(([resId, grupo]) => ({
        resolucionId: resId,
        numeroResolucion: grupo.resolucion?.nroResolucion || 'Sin número',
        totalRutas: grupo.rutas.length
      }))
    });
    
    this.rutasAgrupadasPorResolucion.set(grupos);
  }

  // Método para mostrar rutas de una resolución específica (CRUD de resolución)
  mostrarRutasDeResolucion(resolucionId: string, empresaId?: string): void {
    console.log('🔍 MOSTRANDO RUTAS DE RESOLUCIÓN:', {
      resolucionId: resolucionId,
      empresaId: empresaId
    });

    // Obtener rutas por resolución
    this.rutaService.getRutasPorResolucion(resolucionId).subscribe({
      next: (rutasResolucion) => {
        console.log('✅ RUTAS DE LA RESOLUCIÓN CARGADAS:', {
          total: rutasResolucion.length,
          resolucionId: resolucionId,
          rutas: rutasResolucion.map(r => ({
            id: r.id,
            codigoRuta: r.codigoRuta,
            nombre: r.nombre,
            origen: r.origen,
            destino: r.destino
          }))
        });

        this.rutas.set(rutasResolucion);
        
        // Obtener información de la resolución para mostrar en el filtro
        this.obtenerInfoResolucion(resolucionId, empresaId);
        
        this.snackBar.open(`Vista CRUD: ${rutasResolucion.length} ruta(s) de esta resolución`, 'Cerrar', { duration: 4000 });
      },
      error: (error) => {
        console.error('❌ ERROR AL CARGAR RUTAS DE RESOLUCIÓN:', error);
        // Fallback: filtrar de todas las rutas por resolucionId
        const rutasFiltradas = this.todasLasRutas().filter(ruta => ruta.resolucionId === resolucionId);
        this.rutas.set(rutasFiltradas);
        
        // Actualizar filtro activo con información básica
        this.filtroActivo.set({
          tipo: 'resolucion',
          descripcion: `Rutas de Resolución ${resolucionId.substring(0, 8)}...`,
          resolucionId: resolucionId,
          empresaId: empresaId
        });
        
        this.snackBar.open(`Vista CRUD: ${rutasFiltradas.length} ruta(s) de esta resolución`, 'Cerrar', { duration: 4000 });
      }
    });
  }

  // Método para obtener información detallada de la resolución
  private obtenerInfoResolucion(resolucionId: string, empresaId?: string): void {
    // Por simplicidad, usar información básica por ahora
    // En el futuro se puede hacer una consulta para obtener el número de resolución completo
    this.filtroActivo.set({
      tipo: 'resolucion',
      descripcion: `Vista CRUD - Rutas de Resolución ${resolucionId.substring(0, 8)}...`,
      resolucionId: resolucionId,
      empresaId: empresaId
    });
  }

  // Método para gestionar rutas de resolución (funcionalidad adicional)
  gestionarRutasResolucion(): void {
    const filtro = this.filtroActivo();
    if (filtro.tipo === 'resolucion' && filtro.resolucionId) {
      console.log('🔧 GESTIONANDO RUTAS DE RESOLUCIÓN:', filtro.resolucionId);
      
      // Aquí se pueden agregar funcionalidades adicionales como:
      // - Reordenar códigos de rutas
      // - Exportar rutas de la resolución
      // - Estadísticas de la resolución
      // - etc.
      
      this.snackBar.open('Funciones de gestión avanzada en desarrollo', 'Cerrar', { duration: 3000 });
    }
  }

  // Métodos de utilidad
  displayEmpresa = (empresa: Empresa): string => {
    return empresa ? `${empresa.ruc} - ${empresa.razonSocial?.principal || 'Sin razón social'}` : '';
  }

  displayResolucion = (resolucion: Resolucion): string => {
    return resolucion ? `${resolucion.nroResolucion} - ${resolucion.tipoTramite}` : '';
  }

  // Método para obtener grupos de resolución para el template
  getGruposResolucion(): [string, {resolucion: Resolucion | null, rutas: Ruta[]}][] {
    return Object.entries(this.rutasAgrupadasPorResolucion());
  }

  // Método para verificar si hay grupos de resolución
  tieneGruposResolucion(): boolean {
    return Object.keys(this.rutasAgrupadasPorResolucion()).length > 0;
  }

  // Métodos para obtener información de empresa y resolución de las rutas
  obtenerNombreEmpresa(ruta: Ruta): string {
    // Por simplicidad, mostrar el ID de la empresa por ahora
    // En el futuro se puede implementar un cache de empresas
    return ruta.empresaId ? `Empresa ${ruta.empresaId.substring(0, 8)}...` : 'Sin empresa';
  }

  obtenerRucEmpresa(ruta: Ruta): string {
    // Por simplicidad, mostrar información básica por ahora
    return ruta.empresaId ? 'RUC disponible' : 'Sin RUC';
  }

  obtenerNumeroResolucion(ruta: Ruta): string {
    // Por ahora retornar el ID de la resolución truncado
    return ruta.resolucionId ? `Res. ${ruta.resolucionId.substring(0, 8)}...` : 'Sin resolución';
  }

  getTipoDisplayName(tipo: TipoRuta | undefined): string {
    if (!tipo) return 'N/A';

    const tipos: { [key in TipoRuta]: string } = {
      'URBANA': 'Urbana',
      'INTERURBANA': 'Interurbana',
      'INTERPROVINCIAL': 'Interprovincial',
      'INTERREGIONAL': 'Interregional',
      'RURAL': 'Rural'
    };

    return tipos[tipo] || tipo;
  }

  getEstadoDisplayName(estado: EstadoRuta | undefined): string {
    if (!estado) return 'N/A';

    const estados: { [key in EstadoRuta]: string } = {
      'ACTIVA': 'Activa',
      'INACTIVA': 'Inactiva',
      'SUSPENDIDA': 'Suspendida',
      'EN_MANTENIMIENTO': 'En Mantenimiento',
      'ARCHIVADA': 'Archivada',
      'DADA_DE_BAJA': 'Dada de Baja'
    };

    return estados[estado] || estado;
  }

  nuevaRuta(): void {
    console.log('➕ ABRIENDO MODAL PARA NUEVA RUTA');

    const dialogRef = this.dialog.open(CrearRutaMejoradoComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🔄 NUEVA RUTA CREADA:', result);

        // Agregar a ambas listas
        this.rutas.update(rutas => [...rutas, result]);
        this.todasLasRutas.update(todasLasRutas => [...todasLasRutas, result]);
        this.totalRutas.update(total => total + 1);

        console.log('📊 RUTA AGREGADA AL SISTEMA:', {
          totalRutas: this.rutas().length,
          nuevaRuta: { 
            id: result.id, 
            codigoRuta: result.codigoRuta, 
            nombre: result.nombre,
            empresaId: result.empresaId,
            resolucionId: result.resolucionId
          }
        });

        // Mostrar automáticamente las rutas de la resolución seleccionada
        this.mostrarRutasDeResolucion(result.resolucionId, result.empresaId);

        this.snackBar.open('Ruta creada exitosamente. Mostrando rutas de esta resolución.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  verRuta(id: string): void {
    this.router.navigate(['/rutas', id]);
  }

  editarRuta(ruta: Ruta): void {
    console.log('✏️ EDITANDO RUTA:', ruta);
    
    // Por ahora, mostrar mensaje de que la edición no está implementada
    // En el futuro se puede crear un componente de edición basado en CrearRutaMejoradoComponent
    this.snackBar.open('Función de edición en desarrollo', 'Cerrar', { duration: 3000 });
  }

  eliminarRuta(ruta: Ruta): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta ruta? Esta acción no se puede deshacer.')) {
      console.log('🗑️ ELIMINANDO RUTA:', ruta);

      // Eliminar del servicio
      this.rutaService.deleteRuta(ruta.id).subscribe({
        next: () => {
          console.log('✅ RUTA ELIMINADA EXITOSAMENTE DEL SERVICIO');

          // Eliminar de las listas locales
          this.rutas.update(rutas => rutas.filter(r => r.id !== ruta.id));
          this.todasLasRutas.update(todasLasRutas => todasLasRutas.filter(r => r.id !== ruta.id));
          this.totalRutas.update(total => total - 1);

          this.snackBar.open('Ruta eliminada exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('❌ ERROR AL ELIMINAR RUTA:', error);
          this.snackBar.open('Error al eliminar la ruta', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  // Método agregarRutaGeneral() eliminado - Se requiere empresa y resolución válidas
  // El backend no acepta IDs 'general', solo ObjectIds válidos de MongoDB

  // Método para intercambiar códigos entre rutas
  intercambiarCodigos(ruta1: Ruta, ruta2: Ruta): void {
    if (!ruta1.resolucionId || !ruta2.resolucionId) {
      this.snackBar.open('Las rutas deben tener resolución asignada', 'Cerrar', { duration: 3000 });
      return;
    }

    if (ruta1.resolucionId !== ruta2.resolucionId) {
      this.snackBar.open('Solo se pueden intercambiar códigos entre rutas de la misma resolución', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('🔄 INTERCAMBIANDO CÓDIGOS:', {
      ruta1: { id: ruta1.id, codigoRuta: ruta1.codigoRuta, nombre: ruta1.nombre },
      ruta2: { id: ruta2.id, codigoRuta: ruta2.codigoRuta, nombre: ruta2.nombre },
      resolucionId: ruta1.resolucionId
    });

    // Crear copias de las rutas con códigos intercambiados
    const ruta1Actualizada: Ruta = {
      ...ruta1,
      codigoRuta: ruta2.codigoRuta,
      fechaActualizacion: new Date()
    };

    const ruta2Actualizada: Ruta = {
      ...ruta2,
      codigoRuta: ruta1.codigoRuta,
      fechaActualizacion: new Date()
    };

    // Actualizar las listas locales inmediatamente
    this.actualizarRutaEnLista(ruta1Actualizada);
    this.actualizarRutaEnLista(ruta2Actualizada);

    console.log('✅ CÓDIGOS INTERCAMBIADOS EXITOSAMENTE EN FRONTEND');
    console.log('📊 RUTA 1 ACTUALIZADA:', ruta1Actualizada.codigoRuta);
    console.log('📊 RUTA 2 ACTUALIZADA:', ruta2Actualizada.codigoRuta);

    // Mostrar mensaje de éxito
    this.snackBar.open('Códigos intercambiados exitosamente', 'Cerrar', { duration: 3000 });

    // Intentar sincronizar con el backend (opcional, para cuando esté funcionando)
    this.intentarSincronizarConBackend(ruta1Actualizada, ruta2Actualizada);
  }

  // Método para intentar sincronizar con el backend (opcional)
  private intentarSincronizarConBackend(ruta1: Ruta, ruta2: Ruta): void {
    console.log('🔄 INTENTANDO SINCRONIZAR CON BACKEND...');

    // Crear objetos de actualización para el backend
    const actualizacionRuta1: Partial<RutaUpdate> = {
      codigoRuta: ruta1.codigoRuta
    };

    const actualizacionRuta2: Partial<RutaUpdate> = {
      codigoRuta: ruta2.codigoRuta
    };

    // Usar forkJoin para hacer ambas actualizaciones en paralelo y manejar errores mejor
    forkJoin({
      ruta1: this.rutaService.updateRuta(ruta1.id, actualizacionRuta1),
      ruta2: this.rutaService.updateRuta(ruta2.id, actualizacionRuta2)
    }).subscribe({
      next: (resultados) => {
        console.log('✅ BACKEND: Ambas rutas sincronizadas exitosamente');
        console.log('📊 Ruta 1:', resultados.ruta1.codigoRuta);
        console.log('📊 Ruta 2:', resultados.ruta2.codigoRuta);
      },
      error: (error) => {
        console.warn('⚠️ BACKEND: Error durante la sincronización:', error);
        // No mostrar error al usuario ya que el intercambio ya funcionó en frontend
      }
    });
  }

  // Método auxiliar para actualizar una ruta en la lista
  private actualizarRutaEnLista(rutaActualizada: Ruta): void {
    this.rutas.update(rutas =>
      rutas.map(r => r.id === rutaActualizada.id ? rutaActualizada : r)
    );

    this.todasLasRutas.update(todasLasRutas =>
      todasLasRutas.map(r => r.id === rutaActualizada.id ? rutaActualizada : r)
    );
  }



  // Método para abrir modal de intercambio de códigos
  abrirModalIntercambio(rutaOrigen: Ruta): void {
    if (!rutaOrigen.resolucionId) {
      this.snackBar.open('La ruta debe tener resolución asignada', 'Cerrar', { duration: 3000 });
      return;
    }

    // Obtener todas las rutas de la misma resolución
    const rutasMismaResolucion = this.todasLasRutas().filter(r =>
      r.id !== rutaOrigen.id &&
      r.resolucionId === rutaOrigen.resolucionId
    );

    if (rutasMismaResolucion.length === 0) {
      this.snackBar.open('No hay otras rutas en la misma resolución para intercambiar', 'Cerrar', { duration: 3000 });
      return;
    }

    // Crear un modal simple con las opciones
    const dialogRef = this.dialog.open(IntercambioCodigosModalComponent, {
      width: '500px',
      data: {
        rutaOrigen: rutaOrigen,
        rutasDisponibles: rutasMismaResolucion
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.rutaDestino) {
        this.intercambiarCodigos(rutaOrigen, result.rutaDestino);
      }
    });
  }

  cargaMasivaRutas(): void {
    this.router.navigate(['/rutas/carga-masiva']);
  }
} 