import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa, EmpresaCreate, TipoSocio, TipoServicio } from '../../models/empresa.model';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatSelectModule,
    MatDialogModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTabsModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Empresas</h1>
          <p class="subtitle">Gestión de empresas de transporte</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="accent" (click)="descargarPlantilla()">
            <mat-icon>download</mat-icon>
            Descargar Plantilla
          </button>
          <button mat-raised-button color="accent" (click)="abrirCargaMasiva()">
            <mat-icon>upload_file</mat-icon>
            Carga Masiva Excel
          </button>
          <button mat-raised-button color="accent" (click)="abrirActualizarDatos()">
            <mat-icon>update</mat-icon>
            Actualizar Datos
          </button>
          <button mat-raised-button color="accent" (click)="abrirCargaMasivaGoogleSheets()">
            <mat-icon>cloud_upload</mat-icon>
            Carga desde Google Sheets
          </button>
          <button mat-raised-button color="primary" (click)="crearEmpresa()">
            <mat-icon>add</mat-icon>
            Nueva Empresa
          </button>
        </div>
      </div>

      <div class="content-section">
        <!-- Filtros -->
        <mat-card class="filters-card">
          <mat-card-content>
            <div class="filters-row">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Buscar</mat-label>
                <input matInput [formControl]="searchControl" placeholder="RUC, razón social...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Estado</mat-label>
                <mat-select [formControl]="estadoControl">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="AUTORIZADA">Autorizada</mat-option>
                  <mat-option value="EN_TRAMITE">En Trámite</mat-option>
                  <mat-option value="SUSPENDIDA">Suspendida</mat-option>
                  <mat-option value="CANCELADA">Cancelada</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-button (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>

              <button mat-button color="accent" (click)="exportarExcel()" [disabled]="empresasFiltradas().length === 0">
                <mat-icon>download</mat-icon>
                Exportar Excel
              </button>

              <button mat-button (click)="abrirConfiguracionColumnas()">
                <mat-icon>view_week</mat-icon>
                Columnas
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- TABS de Servicios -->
        <mat-tab-group (selectedIndexChange)="onTabChange($event)">
          <mat-tab label="Todos">
            <ng-template mat-tab-label>
              <span>Todos</span>
            </ng-template>
            <div class="tab-content">
              <!-- Tabla para tab Todos -->
              @if (isLoading()) {
                <div class="loading-container">
                  <mat-spinner diameter="50"></mat-spinner>
                  <p>Cargando empresas...</p>
                </div>
              } @else if (empresasFiltradas().length === 0) {
                <mat-card class="empty-state">
                  <mat-card-content>
                    <mat-icon class="empty-icon">business</mat-icon>
                    <h3>No hay empresas</h3>
                    <p>No se encontraron empresas con los filtros aplicados.</p>
                    <button mat-raised-button color="primary" (click)="crearEmpresa()">
                      <mat-icon>add</mat-icon>
                      Crear Primera Empresa
                    </button>
                  </mat-card-content>
                </mat-card>
              } @else {
                <mat-card class="table-card">
                  <mat-card-content>
                    <div class="table-container">
                      <table mat-table [dataSource]="dataSource" class="empresas-table">
                        <!-- Seleccionar Column -->
                        <ng-container matColumnDef="seleccionar">
                          <th mat-header-cell *matHeaderCellDef>
                            <mat-checkbox 
                              [checked]="seleccionarTodas()"
                              (change)="toggleSeleccionarTodas($event)">
                            </mat-checkbox>
                          </th>
                          <td mat-cell *matCellDef="let empresa">
                            <mat-checkbox 
                              [checked]="empresasSeleccionadas().has(empresa.id)"
                              (change)="toggleSeleccionar(empresa.id, $event)">
                            </mat-checkbox>
                          </td>
                        </ng-container>

                        <!-- RUC Column -->
                        <ng-container matColumnDef="ruc">
                          <th mat-header-cell *matHeaderCellDef>RUC</th>
                          <td mat-cell *matCellDef="let empresa">{{ empresa.ruc }}</td>
                        </ng-container>

                        <!-- Razón Social Column -->
                        <ng-container matColumnDef="razonSocial">
                          <th mat-header-cell *matHeaderCellDef>Razón Social</th>
                          <td mat-cell *matCellDef="let empresa">{{ empresa.razonSocial.principal }}</td>
                        </ng-container>

                        <!-- Estado Column -->
                        <ng-container matColumnDef="estado">
                          <th mat-header-cell *matHeaderCellDef>Estado</th>
                          <td mat-cell *matCellDef="let empresa">
                            <mat-chip [class]="'estado-' + empresa.estado.toLowerCase()">
                              {{ getEstadoDisplayName(empresa.estado) }}
                            </mat-chip>
                          </td>
                        </ng-container>

                        <!-- Servicios Column -->
                        <ng-container matColumnDef="servicios">
                          <th mat-header-cell *matHeaderCellDef>Servicios</th>
                          <td mat-cell *matCellDef="let empresa">
                            {{ empresa.tiposServicio.slice(0, 2).join(', ') }}
                            @if (empresa.tiposServicio.length > 2) {
                              <span class="mas">+{{ empresa.tiposServicio.length - 2 }}</span>
                            }
                          </td>
                        </ng-container>

                        <!-- Representante Legal Column -->
                        <ng-container matColumnDef="representante">
                          <th mat-header-cell *matHeaderCellDef>Representante Legal</th>
                          <td mat-cell *matCellDef="let empresa">
                            @if (empresa.socios && empresa.socios.length > 0) {
                              @for (socio of empresa.socios; track socio.dni) {
                                @if (socio.tipoSocio === 'REPRESENTANTE_LEGAL') {
                                  <div class="representante-info">
                                    <strong>{{ socio.nombres }} {{ socio.apellidos }}</strong>
                                    <br>
                                    <small>DNI: {{ socio.dni }}</small>
                                  </div>
                                }
                              }
                            } @else {
                              <span class="sin-datos">Sin datos</span>
                            }
                          </td>
                        </ng-container>

                        <!-- Email Column -->
                        <ng-container matColumnDef="emailContacto">
                          <th mat-header-cell *matHeaderCellDef>Email</th>
                          <td mat-cell *matCellDef="let empresa">{{ empresa.emailContacto || '-' }}</td>
                        </ng-container>

                        <!-- Teléfono Column -->
                        <ng-container matColumnDef="telefonoContacto">
                          <th mat-header-cell *matHeaderCellDef>Teléfono</th>
                          <td mat-cell *matCellDef="let empresa">{{ empresa.telefonoContacto || '-' }}</td>
                        </ng-container>

                        <!-- Acciones Column -->
                        <ng-container matColumnDef="acciones">
                          <th mat-header-cell *matHeaderCellDef>Acciones</th>
                          <td mat-cell *matCellDef="let empresa">
                            <button mat-icon-button [matMenuTriggerFor]="menu">
                              <mat-icon>more_vert</mat-icon>
                            </button>
                            <mat-menu #menu="matMenu">
                              <button mat-menu-item (click)="verDetalle(empresa.id)">
                                <mat-icon>visibility</mat-icon>
                                <span>Ver</span>
                              </button>
                              <button mat-menu-item (click)="editarEmpresa(empresa.id)">
                                <mat-icon>edit</mat-icon>
                                <span>Editar</span>
                              </button>
                              <button mat-menu-item (click)="eliminarEmpresa(empresa.id)">
                                <mat-icon>delete</mat-icon>
                                <span>Eliminar</span>
                              </button>
                            </mat-menu>
                          </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
                        <tr mat-row *matRowDef="let row; columns: displayedColumns();"></tr>
                      </table>
                    </div>

                    <mat-paginator
                      [pageSizeOptions]="[10, 25, 50]"
                      [pageSize]="pageSize()"
                      [length]="empresasFiltradas().length"
                      (page)="onPageChange($event)">
                    </mat-paginator>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </mat-tab>
          @for (servicio of serviciosDisponibles; track servicio) {
            <mat-tab [label]="servicio">
              <ng-template mat-tab-label>
                <span>{{ servicio }}</span>
              </ng-template>
              <div class="tab-content">
                <!-- Tabla para cada servicio -->
                @if (isLoading()) {
                  <div class="loading-container">
                    <mat-spinner diameter="50"></mat-spinner>
                    <p>Cargando empresas...</p>
                  </div>
                } @else if (empresasFiltradas().length === 0) {
                  <mat-card class="empty-state">
                    <mat-card-content>
                      <mat-icon class="empty-icon">business</mat-icon>
                      <h3>No hay empresas</h3>
                      <p>No se encontraron empresas con los filtros aplicados.</p>
                    </mat-card-content>
                  </mat-card>
                } @else {
                  <mat-card class="table-card">
                    <mat-card-content>
                      <div class="table-container">
                        <table mat-table [dataSource]="dataSource" class="empresas-table">
                          <!-- Seleccionar Column -->
                          <ng-container matColumnDef="seleccionar">
                            <th mat-header-cell *matHeaderCellDef>
                              <mat-checkbox 
                                [checked]="seleccionarTodas()"
                                (change)="toggleSeleccionarTodas($event)">
                              </mat-checkbox>
                            </th>
                            <td mat-cell *matCellDef="let empresa">
                              <mat-checkbox 
                                [checked]="empresasSeleccionadas().has(empresa.id)"
                                (change)="toggleSeleccionar(empresa.id, $event)">
                              </mat-checkbox>
                            </td>
                          </ng-container>

                          <!-- RUC Column -->
                          <ng-container matColumnDef="ruc">
                            <th mat-header-cell *matHeaderCellDef>RUC</th>
                            <td mat-cell *matCellDef="let empresa">{{ empresa.ruc }}</td>
                          </ng-container>

                          <!-- Razón Social Column -->
                          <ng-container matColumnDef="razonSocial">
                            <th mat-header-cell *matHeaderCellDef>Razón Social</th>
                            <td mat-cell *matCellDef="let empresa">{{ empresa.razonSocial.principal }}</td>
                          </ng-container>

                          <!-- Estado Column -->
                          <ng-container matColumnDef="estado">
                            <th mat-header-cell *matHeaderCellDef>Estado</th>
                            <td mat-cell *matCellDef="let empresa">
                              <mat-chip [class]="'estado-' + empresa.estado.toLowerCase()">
                                {{ getEstadoDisplayName(empresa.estado) }}
                              </mat-chip>
                            </td>
                          </ng-container>

                          <!-- Servicios Column -->
                          <ng-container matColumnDef="servicios">
                            <th mat-header-cell *matHeaderCellDef>Servicios</th>
                            <td mat-cell *matCellDef="let empresa">
                              {{ empresa.tiposServicio.slice(0, 2).join(', ') }}
                              @if (empresa.tiposServicio.length > 2) {
                                <span class="mas">+{{ empresa.tiposServicio.length - 2 }}</span>
                              }
                            </td>
                          </ng-container>

                          <!-- Representante Legal Column -->
                          <ng-container matColumnDef="representante">
                            <th mat-header-cell *matHeaderCellDef>Representante Legal</th>
                            <td mat-cell *matCellDef="let empresa">
                              @if (empresa.socios && empresa.socios.length > 0) {
                                @for (socio of empresa.socios; track socio.dni) {
                                  @if (socio.tipoSocio === 'REPRESENTANTE_LEGAL') {
                                    <div class="representante-info">
                                      <strong>{{ socio.nombres }} {{ socio.apellidos }}</strong>
                                      <br>
                                      <small>DNI: {{ socio.dni }}</small>
                                    </div>
                                  }
                                }
                              } @else {
                                <span class="sin-datos">Sin datos</span>
                              }
                            </td>
                          </ng-container>

                          <!-- Email Column -->
                          <ng-container matColumnDef="emailContacto">
                            <th mat-header-cell *matHeaderCellDef>Email</th>
                            <td mat-cell *matCellDef="let empresa">{{ empresa.emailContacto || '-' }}</td>
                          </ng-container>

                          <!-- Teléfono Column -->
                          <ng-container matColumnDef="telefonoContacto">
                            <th mat-header-cell *matHeaderCellDef>Teléfono</th>
                            <td mat-cell *matCellDef="let empresa">{{ empresa.telefonoContacto || '-' }}</td>
                          </ng-container>

                          <!-- Acciones Column -->
                          <ng-container matColumnDef="acciones">
                            <th mat-header-cell *matHeaderCellDef>Acciones</th>
                            <td mat-cell *matCellDef="let empresa">
                              <button mat-icon-button [matMenuTriggerFor]="menu">
                                <mat-icon>more_vert</mat-icon>
                              </button>
                              <mat-menu #menu="matMenu">
                                <button mat-menu-item (click)="verDetalle(empresa.id)">
                                  <mat-icon>visibility</mat-icon>
                                  <span>Ver</span>
                                </button>
                                <button mat-menu-item (click)="editarEmpresa(empresa.id)">
                                  <mat-icon>edit</mat-icon>
                                  <span>Editar</span>
                                </button>
                                <button mat-menu-item (click)="eliminarEmpresa(empresa.id)">
                                  <mat-icon>delete</mat-icon>
                                  <span>Eliminar</span>
                                </button>
                              </mat-menu>
                            </td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
                          <tr mat-row *matRowDef="let row; columns: displayedColumns();"></tr>
                        </table>
                      </div>

                      <mat-paginator
                        [pageSizeOptions]="[10, 25, 50]"
                        [pageSize]="pageSize()"
                        [length]="empresasFiltradas().length"
                        (page)="onPageChange($event)">
                      </mat-paginator>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 8px;

      .header-content h1 {
        margin: 0;
        font-size: 2rem;
      }

      .subtitle {
        margin: 0.5rem 0 0 0;
        opacity: 0.9;
      }

      .header-actions {
        display: flex;
        gap: 1rem;
      }
    }

    .content-section {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }

    .filters-card {
      .filters-row {
        display: flex;
        gap: 0.8rem;
        align-items: flex-end;
        flex-wrap: wrap;

        .search-field {
          flex: 1;
          min-width: 250px;
        }

        .filter-field {
          min-width: 200px;
        }
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;

      .empty-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
        color: #999;
        margin-bottom: 0.8rem;
      }
    }

    .table-card {
      .table-container {
        overflow-x: auto;
      }

      .empresas-table {
        width: 100%;
        border-collapse: collapse;

        th {
          font-weight: 600;
          background-color: #f5f5f5;
          height: 28px;
          padding: 2px 6px;
          font-size: 0.85rem;
          border-bottom: 1px solid #ddd;
        }

        td {
          height: 28px;
          padding: 2px 6px;
          vertical-align: middle;
          font-size: 0.85rem;
          border-bottom: 1px solid #f0f0f0;
        }

        tr {
          height: 28px;
          
          &:hover {
            background-color: #fafafa;
          }
        }
      }
    }

    .estado-autorizada {
      background-color: #4caf50;
      color: white;
    }

    .estado-en_tramite {
      background-color: #ff9800;
      color: white;
    }

    .estado-suspendida {
      background-color: #f44336;
      color: white;
    }

    .estado-cancelada {
      background-color: #9e9e9e;
      color: white;
    }

    .mas {
      color: #666;
      font-size: 0.8rem;
      margin-left: 0.3rem;
    }

    .representante-info {
      font-size: 0.85rem;
      line-height: 1.2;

      strong {
        display: block;
        color: #333;
      }

      small {
        color: #666;
      }
    }

    .sin-datos {
      color: #999;
      font-style: italic;
    }

    .acciones-bloque {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 1rem;
      border-left: 4px solid #667eea;

      .cantidad-seleccionadas {
        font-weight: 600;
        color: #333;
        margin-right: auto;
      }

      button {
        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }
      }
    }
  `]
})
export class EmpresasComponent implements OnInit {
  // Signals
  isLoading = signal(false);
  empresas = signal<Empresa[]>([]);
  pageSize = signal(10);
  currentPage = signal(0);
  searchTerm = signal('');
  estadoFilter = signal('');
  servicioFilter = signal<string>('');
  columnasVisibles = signal<string[]>(['ruc', 'razonSocial', 'estado', 'servicios', 'representante', 'acciones']);
  empresasSeleccionadas = signal<Set<string>>(new Set());
  seleccionarTodas = signal(false);

  // Servicios disponibles para tabs
  serviciosDisponibles: TipoServicio[] = [
    TipoServicio.PASAJEROS,
    TipoServicio.TURISMO,
    TipoServicio.TRABAJADORES,
    TipoServicio.MERCANCIAS,
    TipoServicio.CARGA,
    TipoServicio.INFRAESTRUCTURA,
    TipoServicio.OTROS,
    TipoServicio.MIXTO
  ];

  // Definición de todas las columnas disponibles
  columnasDisponibles = [
    { id: 'ruc', label: 'RUC', visible: true },
    { id: 'razonSocial', label: 'Razón Social', visible: true },
    { id: 'estado', label: 'Estado', visible: true },
    { id: 'servicios', label: 'Servicios', visible: true },
    { id: 'representante', label: 'Representante Legal', visible: true },
    { id: 'emailContacto', label: 'Email', visible: false },
    { id: 'telefonoContacto', label: 'Teléfono', visible: false },
    { id: 'acciones', label: 'Acciones', visible: true }
  ];

  // Form Controls
  searchControl = new FormBuilder().control('');
  estadoControl = new FormBuilder().control('');

  // Computed - todas las empresas filtradas (sin paginación)
  empresasFiltradas = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const estado = this.estadoFilter();
    const servicio = this.servicioFilter();

    return this.empresas()
      .filter(e => {
        const matchSearch = !search ||
          e.ruc.toLowerCase().includes(search) ||
          e.razonSocial.principal.toLowerCase().includes(search);

        const matchEstado = !estado || e.estado === estado;

        const matchServicio = !servicio || e.tiposServicio.includes(servicio as TipoServicio);

        return matchSearch && matchEstado && matchServicio;
      });
  });

  // Computed - empresas para mostrar en la página actual
  empresasPaginadas = computed(() => {
    const filtradas = this.empresasFiltradas();
    return filtradas.slice(
      this.currentPage() * this.pageSize(),
      (this.currentPage() + 1) * this.pageSize()
    );
  });

  // Computed - cantidad de empresas seleccionadas
  cantidadSeleccionadas = computed(() => this.empresasSeleccionadas().size);

  dataSource = new MatTableDataSource<Empresa>();
  displayedColumns = computed(() => {
    const columnas = ['seleccionar', ...this.columnasVisibles()];
    return columnas;
  });

  constructor(
    private empresaService: EmpresaService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Actualizar dataSource cuando cambien las empresas paginadas
    effect(() => {
      this.dataSource.data = this.empresasPaginadas();
    });

    // Escuchar cambios en los controles de formulario
    this.searchControl.valueChanges.subscribe(value => {
      this.searchTerm.set(value || '');
      this.currentPage.set(0);
    });

    this.estadoControl.valueChanges.subscribe(value => {
      this.estadoFilter.set(value || '');
      this.currentPage.set(0);
    });
  }

  ngOnInit(): void {
    this.cargarEmpresas();
  }

  cargarEmpresas(): void {
    this.isLoading.set(true);
    // Solicitar todas las empresas sin límite (limit muy alto)
    this.empresaService.getEmpresas(0, 10000).subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
        this.snackBar.open('Error al cargar empresas', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.estadoControl.setValue('');
    this.servicioFilter.set('');
  }

  onTabChange(index: number): void {
    if (index === 0) {
      this.servicioFilter.set('');
    } else {
      this.servicioFilter.set(this.serviciosDisponibles[index - 1]);
    }
    this.currentPage.set(0);
  }

  // Métodos para selección en bloque
  toggleSeleccionar(empresaId: string, event: any): void {
    const seleccionadas = new Set(this.empresasSeleccionadas());
    if (event.checked) {
      seleccionadas.add(empresaId);
    } else {
      seleccionadas.delete(empresaId);
    }
    this.empresasSeleccionadas.set(seleccionadas);
  }

  toggleSeleccionarTodas(event: any): void {
    if (event.checked) {
      // Seleccionar todas las empresas filtradas
      const ids = new Set(this.empresasFiltradas().map(e => e.id));
      this.empresasSeleccionadas.set(ids);
      this.seleccionarTodas.set(true);
    } else {
      this.empresasSeleccionadas.set(new Set());
      this.seleccionarTodas.set(false);
    }
  }

  limpiarSeleccion(): void {
    this.empresasSeleccionadas.set(new Set());
    this.seleccionarTodas.set(false);
  }

  abrirEdicionBloqueEstado(): void {
    const dialogRef = this.dialog.open(EdicionBloqueEstadoDialog, {
      width: '400px',
      data: { cantidadSeleccionadas: this.cantidadSeleccionadas() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.actualizarEstadoEnBloque(result.nuevoEstado, result.motivo);
      }
    });
  }

  abrirEdicionBloqueServicios(): void {
    const dialogRef = this.dialog.open(EdicionBloqueServiciosDialog, {
      width: '400px',
      data: { cantidadSeleccionadas: this.cantidadSeleccionadas() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.actualizarServiciosEnBloque(result.servicios);
      }
    });
  }

  private actualizarEstadoEnBloque(nuevoEstado: string, motivo: string): void {
    const empresasIds = Array.from(this.empresasSeleccionadas());
    if (empresasIds.length === 0) return;

    this.isLoading.set(true);
    let actualizadas = 0;
    let errores = 0;

    const actualizarSiguiente = (index: number) => {
      if (index >= empresasIds.length) {
        this.isLoading.set(false);
        const mensaje = `${actualizadas} empresa(s) actualizada(s)${errores > 0 ? `, ${errores} error(es)` : ''}`;
        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.cargarEmpresas();
        this.limpiarSeleccion();
        return;
      }

      const empresaId = empresasIds[index];
      this.empresaService.updateEmpresa(empresaId, { estado: nuevoEstado as any }).subscribe({
        next: () => {
          actualizadas++;
          actualizarSiguiente(index + 1);
        },
        error: (error) => {
          console.error('Error actualizando empresa:', error);
          errores++;
          actualizarSiguiente(index + 1);
        }
      });
    };

    actualizarSiguiente(0);
  }

  private actualizarServiciosEnBloque(servicios: string[]): void {
    const empresasIds = Array.from(this.empresasSeleccionadas());
    if (empresasIds.length === 0) return;

    this.isLoading.set(true);
    let actualizadas = 0;
    let errores = 0;

    const actualizarSiguiente = (index: number) => {
      if (index >= empresasIds.length) {
        this.isLoading.set(false);
        const mensaje = `${actualizadas} empresa(s) actualizada(s)${errores > 0 ? `, ${errores} error(es)` : ''}`;
        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.cargarEmpresas();
        this.limpiarSeleccion();
        return;
      }

      const empresaId = empresasIds[index];
      this.empresaService.updateEmpresa(empresaId, { tiposServicio: servicios as any }).subscribe({
        next: () => {
          actualizadas++;
          actualizarSiguiente(index + 1);
        },
        error: (error) => {
          console.error('Error actualizando empresa:', error);
          errores++;
          actualizarSiguiente(index + 1);
        }
      });
    };

    actualizarSiguiente(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  crearEmpresa(): void {
    this.router.navigate(['/empresas/nueva']);
  }

  verDetalle(empresaId: string): void {
    this.router.navigate(['/empresas', empresaId]);
  }

  editarEmpresa(empresaId: string): void {
    this.router.navigate(['/empresas', empresaId, 'editar']);
  }

  eliminarEmpresa(empresaId: string): void {
    if (confirm('¿Está seguro que desea eliminar esta empresa?')) {
      this.empresaService.deleteEmpresa(empresaId).subscribe({
        next: () => {
          this.snackBar.open('Empresa eliminada', 'Cerrar', { duration: 3000 });
          this.cargarEmpresas();
        },
        error: (error) => {
          console.error('Error eliminando empresa:', error);
          this.snackBar.open('Error al eliminar empresa', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  getEstadoDisplayName(estado: string): string {
    const estados: { [key: string]: string } = {
      'AUTORIZADA': 'Autorizada',
      'EN_TRAMITE': 'En Trámite',
      'SUSPENDIDA': 'Suspendida',
      'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
  }

  async exportarExcel(): Promise<void> {
    try {
      const XLSX = await import('xlsx');

      // Preparar datos para exportar
      const datosExportacion = this.empresasFiltradas().map(empresa => ({
        'RUC': empresa.ruc,
        'Razón Social Principal': empresa.razonSocial.principal,
        'Razón Social SUNAT': empresa.razonSocial.sunat || '',
        'Razón Social Mínimo': empresa.razonSocial.minimo || '',
        'Dirección Fiscal': empresa.direccionFiscal || '',
        'Estado': this.getEstadoDisplayName(empresa.estado),
        'Tipo de Servicio': empresa.tiposServicio.join('; '),
        'Email Contacto': empresa.emailContacto || '',
        'Teléfono Contacto': empresa.telefonoContacto || '',
        'Sitio Web': empresa.sitioWeb || '',
        'Representante Legal': empresa.socios
          ?.filter(s => s.tipoSocio === 'REPRESENTANTE_LEGAL')
          .map(s => `${s.nombres} ${s.apellidos}`)
          .join('; ') || '',
        'DNI Representante': empresa.socios
          ?.filter(s => s.tipoSocio === 'REPRESENTANTE_LEGAL')
          .map(s => s.dni)
          .join('; ') || '',
        'Observaciones': empresa.observaciones || ''
      }));

      // Crear workbook
      const worksheet = XLSX.utils.json_to_sheet(datosExportacion);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Empresas');

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 12 }, // RUC
        { wch: 25 }, // Razón Social Principal
        { wch: 25 }, // Razón Social SUNAT
        { wch: 25 }, // Razón Social Mínimo
        { wch: 30 }, // Dirección Fiscal
        { wch: 12 }, // Estado
        { wch: 20 }, // Tipo de Servicio
        { wch: 20 }, // Email
        { wch: 15 }, // Teléfono
        { wch: 20 }, // Sitio Web
        { wch: 25 }, // Representante Legal
        { wch: 12 }, // DNI Representante
        { wch: 30 }  // Observaciones
      ];
      worksheet['!cols'] = colWidths;

      // Descargar archivo
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `empresas-exportadas-${fecha}.xlsx`);

      this.snackBar.open(`${datosExportacion.length} empresas exportadas correctamente`, 'Cerrar', { duration: 3000 });
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      this.snackBar.open('Error al exportar a Excel', 'Cerrar', { duration: 3000 });
    }
  }

  abrirConfiguracionColumnas(): void {
    const dialogRef = this.dialog.open(ConfiguracionColumnasDialog, {
      width: '400px',
      data: { columnas: this.columnasDisponibles }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Actualizar columnas visibles
        const columnasActualizadas = result
          .filter((col: any) => col.visible)
          .map((col: any) => col.id);
        this.columnasVisibles.set(columnasActualizadas);

        // Actualizar la definición de columnas disponibles
        this.columnasDisponibles = result;
      }
    });
  }

  abrirCargaMasiva(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.procesarArchivoExcel(file);
      }
    };
    input.click();
  }

  abrirActualizarDatos(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.procesarActualizacionExcel(file);
      }
    };
    input.click();
  }

  abrirCargaMasivaGoogleSheets(): void {
    this.router.navigate(['/empresas/carga-masiva-google-sheets']);
  }

  async descargarPlantilla(): Promise<void> {
    try {
      this.isLoading.set(true);
      const response = await this.empresaService.descargarPlantilla().toPromise();

      if (response) {
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'plantilla-empresas.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Plantilla descargada correctamente', 'Cerrar', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error descargando plantilla:', error);
      this.snackBar.open('Error al descargar la plantilla', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  private async procesarArchivoExcel(file: File): Promise<void> {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          this.snackBar.open('El archivo no contiene datos', 'Cerrar', { duration: 3000 });
          return;
        }

        const empresas: EmpresaCreate[] = [];
        let filasOmitidas = 0;

        for (const row of jsonData as any[]) {
          // Solo RUC y Razón Social Principal son obligatorios
          const ruc = (row as any)['RUC']?.toString().trim();
          const razonSocialPrincipal = (row as any)['Razón Social Principal']?.toString().trim();

          if (!ruc || !razonSocialPrincipal) {
            console.warn('Fila incompleta (falta RUC o Razón Social Principal), omitiendo:', row);
            filasOmitidas++;
            continue;
          }

          // Campos opcionales
          const dni = (row as any)['DNI Representante']?.toString().trim() || '';
          const nombres = (row as any)['Nombres Representante']?.toString().trim() || '';
          const apellidos = (row as any)['Apellidos Representante']?.toString().trim() || '';

          // Normalizar Estado: por defecto AUTORIZADA
          let estado = (row as any)['Estado']?.toString().trim().toUpperCase() || 'AUTORIZADA';
          if (!['AUTORIZADA', 'EN_TRAMITE', 'SUSPENDIDA', 'CANCELADA'].includes(estado)) {
            estado = 'AUTORIZADA';
          }

          // Normalizar Partida Registral: 8 caracteres numéricos por defecto
          let partida = (row as any)['Partida Registral']?.toString().trim() || '00000000';
          partida = partida.replace(/\D/g, '').padStart(8, '0').substring(0, 8);

          const empresa: EmpresaCreate = {
            ruc,
            razonSocial: {
              principal: razonSocialPrincipal,
              sunat: (row as any)['Razón Social SUNAT']?.toString().trim() || undefined,
              minimo: (row as any)['Razón Social Mínimo']?.toString().trim() || undefined
            },
            direccionFiscal: (row as any)['Dirección Fiscal']?.toString().trim() || '',
            estado: estado as any,
            socios: dni || nombres || apellidos ? [
              {
                dni: dni,
                nombres: nombres,
                apellidos: apellidos,
                tipoSocio: TipoSocio.REPRESENTANTE_LEGAL,
                email: (row as any)['Email Contacto']?.toString().trim() || undefined,
                direccion: (row as any)['Dirección Fiscal']?.toString().trim() || undefined
              }
            ] : [],
            tiposServicio: (row as any)['Tipo de Servicio']?.toString().split(';').map((s: string) => s.trim()).filter((s: string) => s) || ['PASAJEROS'],
            emailContacto: (row as any)['Email Contacto']?.toString().trim() || '',
            telefonoContacto: (row as any)['Teléfono Contacto']?.toString().trim() || '',
            sitioWeb: (row as any)['Sitio Web']?.toString().trim() || '',
            observaciones: (row as any)['Observaciones']?.toString().trim() || ''
          };

          empresas.push(empresa);
        }

        if (empresas.length === 0) {
          this.snackBar.open(`No se encontraron empresas válidas en el archivo. ${filasOmitidas} filas omitidas por falta de RUC o Razón Social Principal.`, 'Cerrar', { duration: 5000 });
          return;
        }

        this.isLoading.set(true);

        // Crear empresas una por una
        let exitosas = 0;
        let errores = 0;

        const crearEmpresas = (index: number) => {
          if (index >= empresas.length) {
            const mensaje = `${exitosas} empresas importadas exitosamente${errores > 0 ? `, ${errores} errores` : ''}${filasOmitidas > 0 ? `, ${filasOmitidas} filas omitidas` : ''}`;
            this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
            this.cargarEmpresas();
            this.isLoading.set(false);
            return;
          }

          this.empresaService.createEmpresa(empresas[index]).subscribe({
            next: () => {
              exitosas++;
              crearEmpresas(index + 1);
            },
            error: (error: any) => {
              console.error('Error creando empresa:', error);
              errores++;
              crearEmpresas(index + 1);
            }
          });
        };

        crearEmpresas(0);
      } catch (error) {
        console.error('Error procesando archivo:', error);
        this.snackBar.open('Error al procesar el archivo Excel', 'Cerrar', { duration: 3000 });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  private async procesarActualizacionExcel(file: File): Promise<void> {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          this.snackBar.open('El archivo no contiene datos', 'Cerrar', { duration: 3000 });
          return;
        }

        const actualizaciones: any[] = [];
        let filasOmitidas = 0;

        for (const row of jsonData as any[]) {
          const ruc = (row as any)['RUC']?.toString().trim();
          const razonSocialPrincipal = (row as any)['Razón Social Principal']?.toString().trim();

          // Validar que RUC y Razón Social Principal sean obligatorios
          if (!ruc || !razonSocialPrincipal) {
            console.warn('Fila incompleta (falta RUC o Razón Social Principal), omitiendo:', row);
            filasOmitidas++;
            continue;
          }

          // Buscar la empresa por RUC
          const empresa = this.empresas().find(e => e.ruc === ruc);
          if (!empresa) {
            console.warn('Empresa con RUC no encontrada:', ruc);
            filasOmitidas++;
            continue;
          }

          // Preparar datos a actualizar
          const datosActualizar: any = {};

          // Razón Social (obligatorio si se proporciona)
          datosActualizar.razonSocial = {
            principal: razonSocialPrincipal,
            sunat: (row as any)['Razón Social SUNAT']?.toString().trim() || undefined,
            minimo: (row as any)['Razón Social Mínimo']?.toString().trim() || undefined
          };

          // Dirección Fiscal (opcional)
          if (row['Dirección Fiscal']) {
            datosActualizar.direccionFiscal = (row as any)['Dirección Fiscal'].toString().trim();
          }

          // Estado (opcional)
          if (row['Estado']) {
            const estado = (row as any)['Estado'].toString().trim().toUpperCase();
            if (['AUTORIZADA', 'EN_TRAMITE', 'SUSPENDIDA', 'CANCELADA'].includes(estado)) {
              datosActualizar.estado = estado;
            }
          }

          // Tipo de Servicio (opcional)
          if (row['Tipo de Servicio']) {
            datosActualizar.tiposServicio = (row as any)['Tipo de Servicio']
              .toString()
              .split(';')
              .map((s: string) => s.trim())
              .filter((s: string) => s);
          }

          // Email Contacto (opcional)
          if (row['Email Contacto']) {
            datosActualizar.emailContacto = (row as any)['Email Contacto'].toString().trim();
          }

          // Teléfono Contacto (opcional)
          if (row['Teléfono Contacto']) {
            datosActualizar.telefonoContacto = (row as any)['Teléfono Contacto'].toString().trim();
          }

          // Sitio Web (opcional)
          if (row['Sitio Web']) {
            datosActualizar.sitioWeb = (row as any)['Sitio Web'].toString().trim();
          }

          // Observaciones (opcional)
          if (row['Observaciones']) {
            datosActualizar.observaciones = (row as any)['Observaciones'].toString().trim();
          }

          actualizaciones.push({
            empresaId: empresa.id,
            ruc: ruc,
            datos: datosActualizar
          });
        }

        if (actualizaciones.length === 0) {
          this.snackBar.open(`No se encontraron datos para actualizar. ${filasOmitidas} filas omitidas.`, 'Cerrar', { duration: 5000 });
          return;
        }

        this.isLoading.set(true);

        // Actualizar empresas una por una
        let actualizadas = 0;
        let errores = 0;

        const actualizarSiguiente = (index: number) => {
          if (index >= actualizaciones.length) {
            const mensaje = `${actualizadas} empresa(s) actualizada(s)${errores > 0 ? `, ${errores} error(es)` : ''}${filasOmitidas > 0 ? `, ${filasOmitidas} filas omitidas` : ''}`;
            this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
            this.cargarEmpresas();
            this.isLoading.set(false);
            return;
          }

          const actualizacion = actualizaciones[index];
          this.empresaService.updateEmpresa(actualizacion.empresaId, actualizacion.datos).subscribe({
            next: () => {
              actualizadas++;
              actualizarSiguiente(index + 1);
            },
            error: (error: any) => {
              console.error('Error actualizando empresa:', error);
              errores++;
              actualizarSiguiente(index + 1);
            }
          });
        };

        actualizarSiguiente(0);
      } catch (error) {
        console.error('Error procesando archivo:', error);
        this.snackBar.open('Error al procesar el archivo Excel', 'Cerrar', { duration: 3000 });
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

// Componente de diálogo para configuración de columnas
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-configuracion-columnas-dialog',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, MatButtonModule, MatIconModule, FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Configurar Columnas</h2>
    <mat-dialog-content>
      <div class="columnas-list">
        <div *ngFor="let columna of data.columnas" class="columna-item">
          <mat-checkbox 
            [(ngModel)]="columna.visible"
            [disabled]="columna.id === 'acciones'">
            {{ columna.label }}
          </mat-checkbox>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onConfirm()">Aplicar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .columnas-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 0;
    }

    .columna-item {
      display: flex;
      align-items: center;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
    }
  `]
})
export class ConfiguracionColumnasDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfiguracionColumnasDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.data.columnas);
  }
}


// Diálogo para cambiar estado en bloque
@Component({
  selector: 'app-edicion-bloque-estado-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatInputModule, FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Cambiar Estado</h2>
    <mat-dialog-content>
      <p>Cambiar estado de {{ data.cantidadSeleccionadas }} empresa(s)</p>
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nuevo Estado</mat-label>
        <mat-select [(ngModel)]="nuevoEstado">
          <mat-option value="AUTORIZADA">Autorizada</mat-option>
          <mat-option value="EN_TRAMITE">En Trámite</mat-option>
          <mat-option value="SUSPENDIDA">Suspendida</mat-option>
          <mat-option value="CANCELADA">Cancelada</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Motivo (opcional)</mat-label>
        <textarea matInput [(ngModel)]="motivo" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="!nuevoEstado">
        Aplicar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }
  `]
})
export class EdicionBloqueEstadoDialog {
  nuevoEstado = '';
  motivo = '';

  constructor(
    public dialogRef: MatDialogRef<EdicionBloqueEstadoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close({
      nuevoEstado: this.nuevoEstado,
      motivo: this.motivo
    });
  }
}

// Diálogo para cambiar servicios en bloque
@Component({
  selector: 'app-edicion-bloque-servicios-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Cambiar Servicios</h2>
    <mat-dialog-content>
      <p>Cambiar servicios de {{ data.cantidadSeleccionadas }} empresa(s)</p>
      
      <div class="servicios-list">
        <div *ngFor="let servicio of serviciosDisponibles" class="servicio-item">
          <mat-checkbox 
            [checked]="serviciosSeleccionados[servicio]"
            (change)="toggleServicio(servicio, $event)">
            {{ servicio }}
          </mat-checkbox>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="serviciosSeleccionadosArray().length === 0">
        Aplicar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .servicios-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 0;
    }

    .servicio-item {
      display: flex;
      align-items: center;
    }
  `]
})
export class EdicionBloqueServiciosDialog {
  serviciosDisponibles = ['PASAJEROS', 'TURISMO', 'TRABAJADORES', 'MERCANCIAS', 'CARGA', 'INFRAESTRUCTURA', 'OTROS', 'MIXTO'];
  serviciosSeleccionados: { [key: string]: boolean } = {};

  constructor(
    public dialogRef: MatDialogRef<EdicionBloqueServiciosDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.serviciosDisponibles.forEach(s => {
      this.serviciosSeleccionados[s] = false;
    });
  }

  toggleServicio(servicio: string, event: any): void {
    this.serviciosSeleccionados[servicio] = event.checked;
  }

  serviciosSeleccionadosArray(): string[] {
    return Object.keys(this.serviciosSeleccionados).filter(s => this.serviciosSeleccionados[s]);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close({
      servicios: this.serviciosSeleccionadosArray()
    });
  }
}
