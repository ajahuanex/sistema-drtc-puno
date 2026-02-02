import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatConfirmDialogComponent } from '../../shared/mat-confirm-dialog.component';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { finalize } from 'rxjs';

import { OficinaService } from '../../services/oficina.service';
import { Oficina, OficinaUpdate } from '../../models/oficina.model';

@Component({
  selector: 'app-oficinas',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="oficinas-container">
      <!-- Header -->
      <div class="header">
        <div class="title-section">
          <h1>Gestión de Oficinas</h1>
          <p>Administra las oficinas del sistema y visualiza el flujo de expedientes</p>
          <div class="status-indicator">
            <span class="status-dot"></span>
            <span class="status-text">Actualizado en tiempo real</span>
          </div>
        </div>
        <div class="actions">
          <button mat-icon-button matTooltip="Refrescar datos" (click)="refrescarDatos()">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-button color="accent" (click)="exportarDatos()">
            <mat-icon>download</mat-icon>
            Exportar
          </button>
          <button mat-raised-button color="primary" (click)="nuevaOficina()">
            <mat-icon>add</mat-icon>
            Nueva Oficina
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <mat-card class="filtros-card">
        <mat-card-content>
          <form [formGroup]="filtrosForm" class="filtros-form">
            <div class="filtros-row">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="nombre" placeholder="Buscar por nombre">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Tipo</mat-label>
                <mat-select formControlName="tipoOficina">
                  <mat-option value="">Todos los tipos</mat-option>
                  @for (tipo of tiposOficina(); track tipo.value) {
                    <mat-option [value]="tipo.value">{{ tipo.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estaActiva">
                  <mat-option value="">Todos los estados</mat-option>
                  <mat-option value="true">Activa</mat-option>
                  <mat-option value="false">Inactiva</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Prioridad</mat-label>
                <mat-select formControlName="prioridad">
                  <mat-option value="">Todas las prioridades</mat-option>
                  @for (prioridad of prioridadesOficina(); track prioridad.value) {
                    <mat-option [value]="prioridad.value">{{ prioridad.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="filtros-actions">
              <button mat-button type="button" (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
              <button mat-raised-button color="primary" (click)="aplicarFiltros()">
                <mat-icon>filter_list</mat-icon>
                Aplicar Filtros
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Estadísticas Rápidas -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">business</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ totalOficinas() }}</span>
                <span class="stat-label">Total Oficinas</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">check_circle</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ oficinasActivas() }}</span>
                <span class="stat-label">Oficinas Activas</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">pending</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ totalExpedientesPendientes() }}</span>
                <span class="stat-label">Expedientes Pendientes</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">schedule</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ tiempoPromedio() }} días</span>
                <span class="stat-label">Tiempo Promedio</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">trending_up</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ eficienciaPromedio() }}%</span>
                <span class="stat-label">Eficiencia Promedio</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">warning</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ oficinasConRetrasos() }}</span>
                <span class="stat-label">Con Retrasos</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tabla de Oficinas -->
      <mat-card class="table-card">
        <mat-card-content>
          @if (loading()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Cargando oficinas...</p>
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="oficinas()" matSort class="oficinas-table">
                <!-- Nombre -->
                <ng-container matColumnDef="nombre">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombre</th>
                  <td mat-cell *matCellDef="let oficina" 
                      [matTooltip]="getOficinaTooltip(oficina)"
                      matTooltipClass="oficina-tooltip">
                    {{ oficina.nombre | uppercase }}
                  </td>
                </ng-container>

                <!-- Tipo -->
                <ng-container matColumnDef="tipo">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Tipo</th>
                  <td mat-cell *matCellDef="let oficina">
                    <mat-chip [color]="getTipoColor(oficina.tipoOficina)" selected>
                      {{ oficina.tipoOficina | uppercase }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Responsable -->
                <ng-container matColumnDef="responsable">
                  <th mat-header-cell *matHeaderCellDef>Responsable</th>
                  <td mat-cell *matCellDef="let oficina">
                    <div class="responsable-info">
                      <span class="responsable-nombre">{{ oficina.responsable ? (oficina.responsable.nombres + ' ' + oficina.responsable.apellidos) : 'No asignado' | uppercase }}</span>
                      <span class="responsable-cargo">{{ oficina.responsable?.cargo || 'Sin cargo' | uppercase }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Ubicación -->
                <ng-container matColumnDef="ubicacion">
                  <th mat-header-cell *matHeaderCellDef>Ubicación</th>
                  <td mat-cell *matCellDef="let oficina">{{ oficina.ubicacion | uppercase }}</td>
                </ng-container>

                <!-- Estado -->
                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Estado</th>
                  <td mat-cell *matCellDef="let oficina">
                    <div class="estado-container">
                      <mat-chip [color]="getEstadoColor(oficina.estaActiva ? 'ACTIVA' : 'INACTIVA')" selected>
                        {{ oficina.estaActiva ? 'ACTIVA' : 'INACTIVA' | uppercase }}
                      </mat-chip>
                      <div class="estado-indicator" [class]="getEstadoIndicatorClass(oficina.estaActiva ? 'ACTIVA' : 'INACTIVA')"></div>
                    </div>
                  </td>
                </ng-container>

                <!-- Prioridad -->
                <ng-container matColumnDef="prioridad">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Prioridad</th>
                  <td mat-cell *matCellDef="let oficina">
                    <mat-chip [color]="getPrioridadColor(oficina.prioridad)" selected>
                      {{ oficina.prioridad | uppercase }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Expedientes -->
                <ng-container matColumnDef="expedientes">
                  <th mat-header-cell *matHeaderCellDef>Expedientes</th>
                  <td mat-cell *matCellDef="let oficina">
                    <button mat-button color="primary" (click)="verExpedientes(oficina)">
                      <mat-icon>folder</mat-icon>
                      Ver Expedientes
                    </button>
                  </td>
                </ng-container>

                <!-- Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let oficina">
                    <div class="acciones-container">
                      <button mat-icon-button matTooltip="Ver Detalles" (click)="verDetalles(oficina)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Editar" (click)="editarOficina(oficina)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Ver Flujo" (click)="verFlujo(oficina)">
                        <mat-icon>timeline</mat-icon>
                      </button>
                      @if (oficina.estaActiva) {
                        <button mat-icon-button matTooltip="Desactivar" (click)="desactivarOficina(oficina)" color="warn">
                          <mat-icon>block</mat-icon>
                        </button>
                      } @else {
                        <button mat-icon-button matTooltip="Activar" (click)="activarOficina(oficina)" color="primary">
                          <mat-icon>check_circle</mat-icon>
                        </button>
                      }
                      <button mat-icon-button matTooltip="Eliminar" (click)="eliminarOficina(oficina)" color="warn">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>

              <mat-paginator 
                [length]="totalOficinas()"
                [pageSize]="pageSize()"
                [pageSizeOptions]="[10, 25, 50, 100]"
                (page)="onPageChange($event)"
                showFirstLastButtons>
              </mat-paginator>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .oficinas-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .title-section h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 28px;
      font-weight: 600;
    }

    .title-section p {
      margin: 8px 0 0 0;
      color: #6c757d;
      font-size: 16px;
    }

    .filtros-card {
      margin-bottom: 24px;
    }

    .filtros-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .filtros-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .filtro-field {
      width: 100%;
    }

    .filtros-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.9;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 24px;
      font-weight: 700;
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 4px;
    }

    .table-card {
      margin-bottom: 24px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
    }

    .table-container {
      overflow-x: auto;
    }

    .oficinas-table {
      width: 100%;
    }

    .responsable-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .responsable-nombre {
      font-weight: 500;
      color: #2c3e50;
    }

    .responsable-cargo {
      font-size: 12px;
      color: #6c757d;
    }

    .acciones-container {
      display: flex;
      gap: 8px;
    }

    .mat-column-acciones {
      width: 120px;
    }

    .mat-column-expedientes {
      width: 140px;
    }

    .mat-column-tipo,
    .mat-column-estado,
    .mat-column-prioridad {
      width: 120px;
    }

    .estado-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .estado-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: transparent;
    }

    .estado-indicator.retrasado {
      background-color: #f44336; /* Rojo para retraso */
    }

    .estado-indicator.normal {
      background-color: #4caf50; /* Verde para normal */
    }

    .estado-indicator.adelantado {
      background-color: #2196f3; /* Azul para adelanto */
    }

    .oficina-tooltip {
      background-color: #2c3e50;
      color: white;
      font-size: 12px;
      max-width: 300px;
      white-space: pre-line;
    }

    .actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .actions button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      color: #6c757d;
      font-size: 14px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #4caf50; /* Verde para actualización en tiempo real */
    }

    @media (max-width: 768px) {
      .oficinas-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .filtros-row {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .stat-card {
        padding: 16px;
      }

      .stat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .stat-number {
        font-size: 20px;
      }

      .stat-label {
        font-size: 12px;
      }

      .table-container {
        overflow-x: auto;
      }

      .acciones-container {
        flex-direction: column;
        gap: 4px;
      }

      .mat-column-acciones {
        width: 80px;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .filtros-actions {
        flex-direction: column;
        gap: 8px;
      }

      .title-section h1 {
        font-size: 24px;
      }

      .title-section p {
        font-size: 14px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OficinasComponent implements OnInit {
  private oficinaService = inject(OficinaService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // Signals
  loading = signal(false);
  oficinas = signal<Oficina[]>([]);
  totalOficinas = signal(0);
  pageSize = signal(25);
  currentPage = signal(0);
  sortField = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Filtros y ordenamiento
  filtros = signal<Partial<OficinaUpdate>>({});
  ordenamiento = signal<string>('nombre');
  direccionOrden = signal<'asc' | 'desc'>('asc');
  paginaActual = signal(1);
  itemsPorPagina = signal(10);
  totalItems = signal(0);

  // Métodos de filtrado y ordenamiento
  aplicarFiltros(): void {
    this.paginaActual.set(1);
    this.cargarOficinas();
  }

  limpiarFiltros(): void {
    this.filtros.set({});
    this.paginaActual.set(1);
    this.cargarOficinas();
  }

  cambiarOrdenamiento(campo: string): void {
    if (this.ordenamiento() === campo) {
      this.direccionOrden.set(this.direccionOrden() === 'asc' ? 'desc' : 'asc');
    } else {
      this.ordenamiento.set(campo);
      this.direccionOrden.set('asc');
    }
    this.cargarOficinas();
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual.set(pagina);
    this.cargarOficinas();
  }

  // Método mejorado para cargar oficinas con filtros y paginación
  cargarOficinas(): void {
    this.loading.set(true);
    const skip = (this.paginaActual() - 1) * this.itemsPorPagina();
    
    this.oficinaService.getOficinas({}, skip, this.itemsPorPagina())
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (oficinas) => {
          // Aplicar ordenamiento
          const oficinasOrdenadas = this.ordenarOficinas(oficinas);
          this.oficinas.set(oficinasOrdenadas);
          this.totalItems.set(oficinas.length); // En un caso real, esto vendría del backend
        },
        error: (error) => {
          console.error('Error al cargar oficinas::', error);
          this.snackBar.open('Error al cargar las oficinas', 'Cerrar', { duration: 3000 });
        }
      });
  }

  // Método para ordenar oficinas
  ordenarOficinas(oficinas: Oficina[]): Oficina[] {
    const campo = this.ordenamiento();
    const direccion = this.direccionOrden();
    
    return oficinas.sort((a, b) => {
      let valorA: any;
      let valorB: any;
      
      switch (campo) {
        case 'nombre':
          valorA = a.nombre.toLowerCase();
          valorB = b.nombre.toLowerCase();
          break;
        case 'tipo':
          valorA = a.tipoOficina.toLowerCase();
          valorB = b.tipoOficina.toLowerCase();
          break;
        case 'responsable':
          valorA = a.responsable ? `${a.responsable.nombres} ${a.responsable.apellidos}`.toLowerCase() : '';
          valorB = b.responsable ? `${b.responsable.nombres} ${b.responsable.apellidos}`.toLowerCase() : '';
          break;
        case 'estado':
          valorA = a.estaActiva ? 'activa' : 'inactiva';
          valorB = b.estaActiva ? 'activa' : 'inactiva';
          break;
        case 'prioridad':
          valorA = a.prioridad.toLowerCase();
          valorB = b.prioridad.toLowerCase();
          break;
        case 'fechaCreacion':
          valorA = new Date(a.fechaCreacion).getTime();
          valorB = new Date(b.fechaCreacion).getTime();
          break;
        default:
          valorA = a.nombre.toLowerCase();
          valorB = b.nombre.toLowerCase();
      }
      
      if (valorA < valorB) return direccion === 'asc' ? -1 : 1;
      if (valorA > valorB) return direccion === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Método para obtener el total de páginas
  get totalPaginas(): number {
    return Math.ceil(this.totalItems() / this.itemsPorPagina());
  }

  // Método para obtener el rango de items mostrados
  get rangoItems(): string {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina() + 1;
    const fin = Math.min(this.paginaActual() * this.itemsPorPagina(), this.totalItems());
    return `${inicio}-${fin} de ${this.totalItems()}`;
  }

  // Filtros
  filtrosForm: FormGroup;
  filtrosAplicados = signal<Partial<OficinaUpdate>>({});

  // Opciones para filtros
  tiposOficina = signal<Array<{value: string, label: string}>>([]);
  estadosOficina = signal<Array<{value: string, label: string}>>([]);
  prioridadesOficina = signal<Array<{value: string, label: string}>>([]);

  // Columnas de la tabla
  displayedColumns = [
    'nombre', 'tipo', 'responsable', 'ubicacion', 'estado', 'prioridad', 'expedientes', 'acciones'
  ];

  // Computed properties
  oficinasActivas = computed(() => 
    this.oficinas().filter(o => o.estaActiva).length
  );

  totalExpedientesPendientes = computed(() => 
    this.oficinas().reduce((total, oficina) => total + (oficina as any).expedientesPendientes || 0, 0)
  );

  tiempoPromedio = computed(() => {
    const oficinas = this.oficinas();
    if (oficinas.length === 0) return 0;
    const total = oficinas.reduce((sum, oficina) => sum + oficina.tiempoPromedioTramite, 0);
    return Math.round(total / oficinas.length);
  });

  eficienciaPromedio = computed(() => {
    const oficinas = this.oficinas();
    if (oficinas.length === 0) return 0;
    // Simulamos la eficiencia basada en el estado y prioridad
    const total = oficinas.reduce((sum, oficina) => {
      let eficiencia = 85; // Base del 85%
      if (oficina.estaActiva) eficiencia += 10;
      if (oficina.prioridad === 'ALTA') eficiencia += 5;
      if (oficina.estaActiva) eficiencia += 5;
      return sum + eficiencia;
    }, 0);
    return Math.round(total / oficinas.length);
  });

  oficinasConRetrasos = computed(() => {
    const oficinas = this.oficinas();
    return oficinas.filter(o => {
      // Simulamos retrasos basados en tiempo de procesamiento
      return o.tiempoPromedioTramite > 15; // Más de 15 días se considera retraso
    }).length;
  });

  constructor() {
    this.filtrosForm = this.fb.group({
      nombre: [''],
      tipoOficina: [''],
      estaActiva: [''],
      prioridad: ['']
    });

    // Suscribirse a cambios en los filtros
    this.filtrosForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.aplicarFiltros();
    });
  }

  ngOnInit(): void {
    this.cargarOpciones();
    this.cargarOficinas();
  }

  cargarOpciones(): void {
    this.oficinaService.getTiposOficina().subscribe(tipos => {
      this.tiposOficina.set(tipos);
    });

    this.oficinaService.getEstadosOficina().subscribe(estados => {
      this.estadosOficina.set(estados);
    });

    this.oficinaService.getPrioridadesOficina().subscribe(prioridades => {
      this.prioridadesOficina.set(prioridades);
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarOficinas();
  }

  onSortChange(sort: Sort): void {
    this.sortField.set(sort.active);
    this.sortDirection.set(sort.direction as 'asc' | 'desc');
    this.cargarOficinas();
  }

  // Acciones CRUD
  nuevaOficina(): void {
    this.router.navigate(['/oficinas/nueva']);
  }

  editarOficina(oficina: Oficina): void {
    this.router.navigate(['/oficinas', oficina.id, 'editar']);
  }

  verDetalles(oficina: Oficina): void {
    this.router.navigate(['/oficinas', oficina.id]);
  }

  verExpedientes(oficina: Oficina): void {
    this.router.navigate(['/oficinas', oficina.id, 'expedientes']);
  }

  verFlujo(oficina: Oficina): void {
    this.router.navigate(['/oficinas', oficina.id, 'flujo']);
  }

  refrescarDatos(): void {
    this.cargarOficinas();
    this.snackBar.open('Datos actualizados', 'Cerrar', { duration: 1500 });
  }

  exportarDatos(): void {
    const oficinas = this.oficinas();
    if (oficinas.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 2000 });
      return;
    }

    // Crear CSV con los datos
    const headers = ['Nombre', 'Tipo', 'Responsable', 'Ubicación', 'Estado', 'Prioridad', 'Activa'];
    const csvContent = [
      headers.join(','),
      ...oficinas.map(o => [
        o.nombre,
        o.tipoOficina,
        o.responsable ? `${o.responsable.nombres} ${o.responsable.apellidos}` : 'No asignado',
        o.ubicacion,
        o.estaActiva ? 'ACTIVA' : 'INACTIVA',
        o.prioridad,
        o.estaActiva ? 'Sí' : 'No'
      ].join(','))
    ].join('\n');

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `oficinas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.snackBar.open('Datos exportados correctamente', 'Cerrar', { duration: 2000 });
  }

  activarOficina(oficina: Oficina): void {
    const dialogRef = this.dialog.open(MatConfirmDialogComponent, {
      data: {
        title: 'Confirmar Activación',
        message: `¿Estás seguro de que quieres activar la oficina "${oficina.nombre}"?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.oficinaService.activarOficina(oficina.id).subscribe({
          next: () => {
            this.snackBar.open('Oficina activada con éxito', 'Cerrar', { duration: 2000 });
            this.cargarOficinas();
          },
          error: (error) => {
            console.error('Error al activar oficina::', error);
            this.snackBar.open('Error al activar la oficina', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  desactivarOficina(oficina: Oficina): void {
    const dialogRef = this.dialog.open(MatConfirmDialogComponent, {
      data: {
        title: 'Confirmar Desactivación',
        message: `¿Estás seguro de que quieres desactivar la oficina "${oficina.nombre}"?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.oficinaService.desactivarOficina(oficina.id).subscribe({
          next: () => {
            this.snackBar.open('Oficina desactivada con éxito', 'Cerrar', { duration: 2000 });
            this.cargarOficinas();
          },
          error: (error) => {
            console.error('Error al desactivar oficina::', error);
            this.snackBar.open('Error al desactivar la oficina', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  eliminarOficina(oficina: Oficina): void {
    const dialogRef = this.dialog.open(MatConfirmDialogComponent, {
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Estás seguro de que quieres eliminar la oficina "${oficina.nombre}"? Esta acción no se puede deshacer.`,
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.oficinaService.deleteOficina(oficina.id).subscribe({
          next: () => {
            this.snackBar.open('Oficina eliminada con éxito', 'Cerrar', { duration: 2000 });
            this.cargarOficinas();
          },
          error: (error) => {
            console.error('Error al eliminar oficina::', error);
            this.snackBar.open('Error al eliminar la oficina', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  // Métodos de utilidad para colores
  getTipoColor(tipo: string): string {
    const colores: { [key: string]: string } = {
      'RECEPCION': 'primary',
      'REVISION_TECNICA': 'accent',
      'LEGAL': 'warn',
      'FINANCIERA': 'primary'
    };
    return colores[tipo] || 'primary';
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'ACTIVA': 'primary',
      'INACTIVA': 'warn',
      'MANTENIMIENTO': 'accent'
    };
    return colores[estado] || 'primary';
  }

  getPrioridadColor(prioridad: string): string {
    const colores: { [key: string]: string } = {
      'ALTA': 'warn',
      'MEDIA': 'accent',
      'BAJA': 'primary'
    };
    return colores[prioridad] || 'primary';
  }

  getEstadoIndicatorClass(estado: string): string {
    // Simulamos el indicador basado en el estado y tiempo de procesamiento
    switch (estado) {
      case 'ACTIVA':
        return 'normal';
      case 'INACTIVA':
        return 'retrasado';
      case 'MANTENIMIENTO':
        return 'adelantado';
      default:
        return 'normal';
    }
  }

  getOficinaTooltip(oficina: Oficina): string {
    let tooltip = `Oficina: ${oficina.nombre}\n`;
    tooltip += `Tipo: ${oficina.tipoOficina}\n`;
    tooltip += `Responsable: ${oficina.responsable ? `${oficina.responsable.nombres} ${oficina.responsable.apellidos}` : 'No asignado'}\n`;
    tooltip += `Ubicación: ${oficina.ubicacion}\n`;
    tooltip += `Estado: ${oficina.estaActiva ? 'ACTIVA' : 'INACTIVA'}\n`;
    tooltip += `Prioridad: ${oficina.prioridad}\n`;
    tooltip += `Activa: ${oficina.estaActiva ? 'Sí' : 'No'}`;
    return tooltip;
  }
}