import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, interval, firstValueFrom } from 'rxjs';

import { ExpedienteService } from '../../services/expediente.service';
import { OficinaService } from '../../services/oficina.service';
import { EmpresaService } from '../../services/empresa.service';
import { Expediente } from '../../models/expediente.model';
import { Oficina } from '../../models/oficina.model';
import { Empresa } from '../../models/empresa.model';
import { MoverExpedienteModalComponent } from './mover-expediente-modal.component';
import { ConfigurarFlujosModalComponent } from './configurar-flujos-modal.component';

interface EstadoExpedienteUI {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  icono: string;
  orden: number;
  accionRequerida: string;
  tiempoEstimado: number;
}

interface FlujoEtapa {
  expedienteId: string;
  estadoActual: string;
  estadoAnterior?: string;
  fechaCambio: Date;
  usuario: string;
  comentarios?: string;
  documentos?: string[];
  tiempoTranscurrido: number;
  tiempoEstimado: number;
  porcentajeCompletado: number;
}

interface MovimientoExpediente {
  id: string;
  expedienteId: string;
  oficinaOrigenId: string;
  oficinaDestinoId: string;
  fechaMovimiento: Date;
  usuarioId: string;
  usuarioNombre: string;
  motivo: string;
  observaciones?: string;
  documentosRequeridos?: string[];
  documentosEntregados?: string[];
  tiempoEstimado: number;
  prioridad: string;
}

@Component({
  selector: 'app-flujo-expedientes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule,
    MatListModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatStepperModule,
    MatCheckboxModule,
    MatRadioModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="flujo-expedientes-container">
      <!-- Header -->
      <div class="header">
        <div class="title-section">
          <h1>Flujo de Expedientes</h1>
          <p>Gestión y seguimiento del flujo de expedientes en el sistema</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="crearNuevoExpediente()">
            <mat-icon>add</mat-icon>
            Nuevo Expediente
          </button>
          <button mat-raised-button color="accent" (click)="exportarFlujo()">
            <mat-icon>download</mat-icon>
            Exportar
          </button>
          <button mat-raised-button color="warn" (click)="configurarFlujos()">
            <mat-icon>settings</mat-icon>
            Configurar Flujos
          </button>
        </div>
      </div>

      <!-- Filtros y Búsqueda -->
      <mat-card class="filtros-card">
        <mat-card-content>
          <form [formGroup]="filtrosForm" class="filtros-form">
            <div class="filtros-row">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Número de Expediente</mat-label>
                <input matInput formControlName="numeroExpediente" placeholder="E-1234-2025">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Empresa</mat-label>
                <mat-select formControlName="empresaId">
                  <mat-option value="">Todas las empresas</mat-option>
                  @for (empresa of empresas(); track empresa.id) {
                    <mat-option [value]="empresa.id">{{ empresa.razonSocial }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Oficina Actual</mat-label>
                <mat-select formControlName="oficinaId">
                  <mat-option value="">Todas las oficinas</mat-option>
                  @for (oficina of oficinas(); track oficina.id) {
                    <mat-option [value]="oficina.id">{{ oficina.nombre }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado">
                  <mat-option value="">Todos los estados</mat-option>
                  @for (estado of estadosExpediente(); track estado.id) {
                    <mat-option [value]="estado.id">{{ estado.nombre }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Nivel de Urgencia</mat-label>
                <mat-select formControlName="urgencia">
                  <mat-option value="">Todos los niveles</mat-option>
                  <mat-option value="NORMAL">Normal</mat-option>
                  <mat-option value="URGENTE">Urgente</mat-option>
                  <mat-option value="MUY_URGENTE">Muy Urgente</mat-option>
                  <mat-option value="CRITICO">Crítico</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="filtros-row">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Fecha Desde</mat-label>
                <input matInput [matDatepicker]="fechaDesdePicker" formControlName="fechaDesde">
                <mat-datepicker-toggle matSuffix [for]="fechaDesdePicker"></mat-datepicker-toggle>
                <mat-datepicker #fechaDesdePicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Fecha Hasta</mat-label>
                <input matInput [matDatepicker]="fechaHastaPicker" formControlName="fechaHasta">
                <mat-datepicker-toggle matSuffix [for]="fechaHastaPicker"></mat-datepicker-toggle>
                <mat-datepicker #fechaHastaPicker></mat-datepicker>
              </mat-form-field>

              <button mat-raised-button color="primary" (click)="aplicarFiltros()" [disabled]="aplicandoFiltros()">
                <mat-icon>filter_list</mat-icon>
                {{ aplicandoFiltros() ? 'Aplicando...' : 'Aplicar Filtros' }}
              </button>

              <button mat-button (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Tabs de Visualización -->
      <mat-card class="tabs-card">
        <mat-tab-group (selectedTabChange)="onTabChange($event)">
          <!-- Tab: Vista General -->
          <mat-tab label="Vista General">
            <div class="tab-content">
              <!-- Métricas del Flujo -->
              <div class="metricas-container">
                <div class="metrica-card">
                  <div class="metrica-icon">
                    <mat-icon>pending_actions</mat-icon>
                  </div>
                  <div class="metrica-content">
                    <h3>{{ expedientesPendientes() }}</h3>
                    <p>Expedientes Pendientes</p>
                  </div>
                </div>

                <div class="metrica-card">
                  <div class="metrica-icon">
                    <mat-icon>schedule</mat-icon>
                  </div>
                  <div class="metrica-content">
                    <h3>{{ expedientesEnProceso() }}</h3>
                    <p>En Proceso</p>
                  </div>
                </div>

                <div class="metrica-card">
                  <div class="metrica-icon">
                    <mat-icon>warning</mat-icon>
                  </div>
                  <div class="metrica-content">
                    <h3>{{ expedientesUrgentes() }}</h3>
                    <p>Urgentes</p>
                  </div>
                </div>

                <div class="metrica-card">
                  <div class="metrica-icon">
                    <mat-icon>check_circle</mat-icon>
                  </div>
                  <div class="metrica-content">
                    <h3>{{ expedientesCompletados() }}</h3>
                    <p>Completados</p>
                  </div>
                </div>
              </div>

              <!-- Gráfico de Flujo -->
              <div class="grafico-flujo">
                <h3>Flujo de Expedientes por Oficina</h3>
                <div class="oficinas-flujo">
                  @for (oficina of oficinasFlujo(); track oficina.id) {
                    <div class="oficina-flujo" [class.activa]="oficina.expedientesActivos > 0">
                      <div class="oficina-header">
                        <h4>{{ oficina.nombre }}</h4>
                        <span class="expedientes-count">{{ oficina.expedientesActivos }}</span>
                      </div>
                      <div class="expedientes-lista">
                        @for (expediente of oficina.expedientes; track expediente.id) {
                          <div class="expediente-item" [class.urgente]="expediente.urgencia === 'URGENTE' || expediente.urgencia === 'CRITICO'">
                            <span class="numero">{{ expediente.nroExpediente }}</span>
                            <span class="empresa">{{ getEmpresaNombre(expediente.empresaId) }}</span>
                            <span class="tiempo" [class.vencido]="expediente.tiempoRestante < 0">
                              {{ expediente.tiempoRestante }} días
                            </span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Tab: Lista de Expedientes -->
          <mat-tab label="Lista de Expedientes">
            <div class="tab-content">
              <div class="table-container">
                <table mat-table [dataSource]="expedientes()" matSort class="expedientes-table">
                  <!-- Número de Expediente -->
                  <ng-container matColumnDef="nroExpediente">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Número</th>
                    <td mat-cell *matCellDef="let expediente">
                      <span class="numero-expediente">{{ expediente.nroExpediente }}</span>
                    </td>
                  </ng-container>

                  <!-- Empresa -->
                  <ng-container matColumnDef="empresa">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Empresa</th>
                    <td mat-cell *matCellDef="let expediente">
                      <span class="empresa-nombre">{{ getEmpresaNombre(expediente.empresaId) }}</span>
                    </td>
                  </ng-container>

                  <!-- Estado -->
                  <ng-container matColumnDef="estado">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Estado</th>
                    <td mat-cell *matCellDef="let expediente">
                      <mat-chip [color]="getColorEstado(expediente.estado)" selected>
                        {{ expediente.estado }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Oficina Actual -->
                  <ng-container matColumnDef="oficinaActual">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Oficina Actual</th>
                    <td mat-cell *matCellDef="let expediente">
                      <span class="oficina-actual">{{ expediente.oficinaActual?.nombre || 'Sin asignar' }}</span>
                    </td>
                  </ng-container>

                  <!-- Tiempo Estimado -->
                  <ng-container matColumnDef="tiempoEstimado">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Tiempo Estimado</th>
                    <td mat-cell *matCellDef="let expediente">
                      <span class="tiempo-estimado" [class.vencido]="expediente.tiempoEstimadoOficina && expediente.tiempoEstimadoOficina < 0">
                        {{ expediente.tiempoEstimadoOficina || 0 }} días
                      </span>
                    </td>
                  </ng-container>

                  <!-- Urgencia -->
                  <ng-container matColumnDef="urgencia">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Urgencia</th>
                    <td mat-cell *matCellDef="let expediente">
                      <mat-chip [color]="getColorUrgencia(expediente.urgencia)" selected>
                        {{ expediente.urgencia || 'NORMAL' }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Acciones -->
                  <ng-container matColumnDef="acciones">
                    <th mat-header-cell *matHeaderCellDef>Acciones</th>
                    <td mat-cell *matCellDef="let expediente">
                      <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Acciones">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #menu="matMenu">
                        <button mat-menu-item (click)="verDetalle(expediente)">
                          <mat-icon>visibility</mat-icon>
                          Ver Detalle
                        </button>
                        <button mat-menu-item (click)="moverExpediente(expediente)">
                          <mat-icon>swap_horiz</mat-icon>
                          Mover a Oficina
                        </button>
                        <button mat-menu-item (click)="editarExpediente(expediente)">
                          <mat-icon>edit</mat-icon>
                          Editar
                        </button>
                        <button mat-menu-item (click)="cambiarUrgencia(expediente)">
                          <mat-icon>priority_high</mat-icon>
                          Cambiar Urgencia
                        </button>
                      </mat-menu>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="columnasExpedientes"></tr>
                  <tr mat-row *matRowDef="let row; columns: columnasExpedientes;"></tr>
                </table>

                <mat-paginator 
                  [length]="totalExpedientes()"
                  [pageSize]="pageSize()"
                  [pageSizeOptions]="[10, 25, 50, 100]"
                  (page)="onPageChange($event)"
                  showFirstLastButtons>
                </mat-paginator>
              </div>
            </div>
          </mat-tab>

          <!-- Tab: Movimientos -->
          <mat-tab label="Movimientos">
            <div class="tab-content">
              <div class="movimientos-container">
                <div class="movimientos-header">
                  <h3>Historial de Movimientos</h3>
                  <button mat-raised-button color="primary" (click)="nuevoMovimiento()">
                    <mat-icon>add</mat-icon>
                    Nuevo Movimiento
                  </button>
                </div>

                <div class="movimientos-timeline">
                  @for (movimiento of movimientos(); track movimiento.id) {
                    <div class="movimiento-item">
                      <div class="movimiento-icon">
                        <mat-icon>swap_horiz</mat-icon>
                      </div>
                      <div class="movimiento-content">
                        <div class="movimiento-header">
                          <span class="expediente">{{ movimiento.expedienteId }}</span>
                          <span class="fecha">{{ movimiento.fechaMovimiento | date:'dd/MM/yyyy HH:mm' }}</span>
                        </div>
                        <div class="movimiento-details">
                          <span class="origen">{{ getOficinaNombre(movimiento.oficinaOrigenId) }}</span>
                          <mat-icon>arrow_forward</mat-icon>
                          <span class="destino">{{ getOficinaNombre(movimiento.oficinaDestinoId) }}</span>
                        </div>
                        <div class="movimiento-info">
                          <span class="usuario">{{ movimiento.usuarioNombre }}</span>
                          <span class="motivo">{{ movimiento.motivo }}</span>
                        </div>
                        @if (movimiento.observaciones) {
                          <div class="observaciones">
                            {{ movimiento.observaciones }}
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Tab: Reportes -->
          <mat-tab label="Reportes">
            <div class="tab-content">
              <div class="reportes-container">
                <div class="reporte-card">
                  <h3>Reporte de Flujo por Oficina</h3>
                  <div class="reporte-content">
                    <div class="reporte-filtros">
                      <mat-form-field appearance="outline">
                        <mat-label>Período</mat-label>
                        <mat-select [(value)]="periodoReporte">
                          <mat-option value="diario">Diario</mat-option>
                          <mat-option value="semanal">Semanal</mat-option>
                          <mat-option value="mensual">Mensual</mat-option>
                          <mat-option value="trimestral">Trimestral</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Oficina</mat-label>
                        <mat-select [(value)]="oficinaReporte">
                          <mat-option value="">Todas las oficinas</mat-option>
                          @for (oficina of oficinas(); track oficina.id) {
                            <mat-option [value]="oficina.id">{{ oficina.nombre }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>

                      <button mat-raised-button color="primary" (click)="generarReporte()">
                        <mat-icon>assessment</mat-icon>
                        Generar Reporte
                      </button>
                    </div>

                    <div class="reporte-resultados" *ngIf="reporteGenerado()">
                      <h4>Resultados del Reporte</h4>
                      <div class="metricas-reporte">
                        <div class="metrica">
                          <span class="label">Total Expedientes:</span>
                          <span class="valor">{{ reporteResultados().totalExpedientes }}</span>
                        </div>
                        <div class="metrica">
                          <span class="label">Tiempo Promedio:</span>
                          <span class="valor">{{ reporteResultados().tiempoPromedio }} días</span>
                        </div>
                        <div class="metrica">
                          <span class="label">Eficiencia:</span>
                          <span class="valor">{{ reporteResultados().eficiencia }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styleUrls: ['./flujo-expedientes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlujoExpedientesComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private expedienteService = inject(ExpedienteService);
  private oficinaService = inject(OficinaService);
  private empresaService = inject(EmpresaService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Signals
  expedientes = signal<Expediente[]>([]);
  oficinas = signal<Oficina[]>([]);
  empresas = signal<Empresa[]>([]);
  movimientos = signal<MovimientoExpediente[]>([]);
  totalExpedientes = signal(0);
  pageSize = signal(25);
  currentPage = signal(0);
  aplicandoFiltros = signal(false);
  cargando = signal(false);
  reporteGenerado = signal(false);

  // Estados y configuraciones
  estadosExpediente = signal<EstadoExpedienteUI[]>([]);
  oficinasFlujo = signal<any[]>([]);
  columnasExpedientes = ['nroExpediente', 'empresa', 'estado', 'oficinaActual', 'tiempoEstimado', 'urgencia', 'acciones'];

  // Filtros
  filtrosForm: FormGroup;
  periodoReporte = 'mensual';
  oficinaReporte = '';

  // Métricas calculadas
  expedientesPendientes = computed(() => 
    this.expedientes().filter(e => e.estado === 'EN_PROCESO').length
  );
  
  expedientesEnProceso = computed(() => 
    this.expedientes().filter(e => e.estado === 'EN_PROCESO').length
  );
  
  expedientesUrgentes = computed(() => 
    this.expedientes().filter(e => e.urgencia === 'URGENTE' || e.urgencia === 'CRITICO').length
  );
  
  expedientesCompletados = computed(() => 
    this.expedientes().filter(e => e.estado === 'APROBADO').length
  );

  reporteResultados = signal<any>({});

  constructor() {
    this.filtrosForm = this.fb.group({
      numeroExpediente: [''],
      empresaId: [''],
      oficinaId: [''],
      estado: [''],
      urgencia: [''],
      fechaDesde: [''],
      fechaHasta: ['']
    });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.configurarEstadosExpediente();
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarDatosIniciales(): void {
    this.cargando.set(true);
    
    Promise.all([
      firstValueFrom(this.oficinaService.getOficinas()),
      firstValueFrom(this.empresaService.getEmpresas()),
      this.cargarExpedientes()
    ]).then(([oficinas, empresas]) => {
      if (oficinas) this.oficinas.set(oficinas);
      if (empresas) this.empresas.set(empresas);
      this.cargando.set(false);
    }).catch(error => {
      console.error('Error cargando datos iniciales:', error);
      this.cargando.set(false);
      this.mostrarError('Error cargando datos iniciales');
    });
  }

  private configurarEstadosExpediente(): void {
    this.estadosExpediente.set([
      { id: 'EN_PROCESO', nombre: 'En Proceso', descripcion: 'Expediente siendo procesado', color: 'accent', icono: 'hourglass_empty', orden: 1, accionRequerida: 'Continuar procesamiento', tiempoEstimado: 3 },
      { id: 'APROBADO', nombre: 'Aprobado', descripcion: 'Expediente aprobado exitosamente', color: 'primary', icono: 'check_circle', orden: 2, accionRequerida: 'Archivar', tiempoEstimado: 0 },
      { id: 'RECHAZADO', nombre: 'Rechazado', descripcion: 'Expediente rechazado', color: 'warn', icono: 'cancel', orden: 3, accionRequerida: 'Notificar rechazo', tiempoEstimado: 0 },
      { id: 'SUSPENDIDO', nombre: 'Suspendido', descripcion: 'Expediente suspendido temporalmente', color: 'warn', icono: 'pause_circle', orden: 4, accionRequerida: 'Revisar motivo', tiempoEstimado: 0 },
      { id: 'ARCHIVADO', nombre: 'Archivado', descripcion: 'Expediente archivado', color: 'primary', icono: 'archive', orden: 5, accionRequerida: 'Ninguna', tiempoEstimado: 0 }
    ]);
  }

  private iniciarActualizacionAutomatica(): void {
    interval(30000) // Actualizar cada 30 segundos
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.actualizarDatosEnTiempoReal();
      });
  }

  private actualizarDatosEnTiempoReal(): void {
    this.cargarExpedientes();
    this.actualizarOficinasFlujo();
  }

  private cargarExpedientes(): Promise<void> {
    return new Promise((resolve) => {
      const filtros = this.construirFiltros();
      
      this.expedienteService.getExpedientes().subscribe({
        next: (response) => {
          // Filtrar expedientes localmente si hay filtros
          let expedientesFiltrados = response;
          if (Object.keys(filtros).length > 0) {
            expedientesFiltrados = this.aplicarFiltrosLocales(response, filtros);
          }
          
          this.expedientes.set(expedientesFiltrados);
          this.totalExpedientes.set(expedientesFiltrados.length);
          this.actualizarOficinasFlujo();
          resolve();
        },
        error: (error) => {
          console.error('Error cargando expedientes:', error);
          this.mostrarError('Error cargando expedientes');
          resolve();
        }
      });
    });
  }

  private actualizarOficinasFlujo(): void {
    const oficinasConExpedientes = this.oficinas().map(oficina => ({
      ...oficina,
      expedientes: this.expedientes().filter(exp => 
        exp.oficinaActual?.id === oficina.id
      ).map(exp => ({
        ...exp,
        empresaNombre: this.getEmpresaNombre(exp.empresaId),
        tiempoRestante: this.calcularTiempoRestante(exp)
      }))
    }));

    this.oficinasFlujo.set(oficinasConExpedientes);
  }

  private construirFiltros(): any {
    const formValue = this.filtrosForm.value;
    const filtros: any = {};

    if (formValue.numeroExpediente) filtros.nroExpediente = formValue.numeroExpediente;
    if (formValue.empresaId) filtros.empresaId = formValue.empresaId;
    if (formValue.oficinaId) filtros.oficinaId = formValue.oficinaId;
    if (formValue.estado) filtros.estado = formValue.estado;
    if (formValue.urgencia) filtros.urgencia = formValue.urgencia;
    if (formValue.fechaDesde) filtros.fechaDesde = formValue.fechaDesde;
    if (formValue.fechaHasta) filtros.fechaHasta = formValue.fechaHasta;

    return filtros;
  }

  getEmpresaNombre(empresaId?: string): string {
    if (!empresaId) return 'Sin empresa';
    const empresa = this.empresas().find(e => e.id === empresaId);
    return empresa ? (typeof empresa.razonSocial === 'string' ? empresa.razonSocial : empresa.razonSocial.principal) : 'Empresa no encontrada';
  }

  getOficinaNombre(oficinaId: string): string {
    const oficina = this.oficinas().find(o => o.id === oficinaId);
    return oficina ? oficina.nombre : 'Oficina no encontrada';
  }

  private aplicarFiltrosLocales(expedientes: Expediente[], filtros: any): Expediente[] {
    return expedientes.filter(expediente => {
      let cumpleFiltros = true;

      if (filtros.nroExpediente && !expediente.nroExpediente.toLowerCase().includes(filtros.nroExpediente.toLowerCase())) {
        cumpleFiltros = false;
      }

      if (filtros.empresaId && expediente.empresaId !== filtros.empresaId) {
        cumpleFiltros = false;
      }

      if (filtros.oficinaId && expediente.oficinaActual?.id !== filtros.oficinaId) {
        cumpleFiltros = false;
      }

      if (filtros.estado && expediente.estado !== filtros.estado) {
        cumpleFiltros = false;
      }

      if (filtros.urgencia && expediente.urgencia !== filtros.urgencia) {
        cumpleFiltros = false;
      }

      if (filtros.fechaDesde && expediente.fechaEmision < new Date(filtros.fechaDesde)) {
        cumpleFiltros = false;
      }

      if (filtros.fechaHasta && expediente.fechaEmision > new Date(filtros.fechaHasta)) {
        cumpleFiltros = false;
      }

      return cumpleFiltros;
    });
  }

  private calcularTiempoRestante(expediente: Expediente): number {
    if (!expediente.fechaLlegadaOficina || !expediente.tiempoEstimadoOficina) return 0;
    
    const fechaLlegada = new Date(expediente.fechaLlegadaOficina);
    const tiempoEstimado = expediente.tiempoEstimadoOficina;
    const fechaLimite = new Date(fechaLlegada.getTime() + (tiempoEstimado * 24 * 60 * 60 * 1000));
    const ahora = new Date();
    
    const diffTime = fechaLimite.getTime() - ahora.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  // Métodos públicos
  aplicarFiltros(): void {
    this.aplicandoFiltros.set(true);
    this.currentPage.set(0);
    
    this.cargarExpedientes().finally(() => {
      this.aplicandoFiltros.set(false);
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.currentPage.set(0);
    this.cargarExpedientes();
  }

  onPageChange(event: any): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarExpedientes();
  }

  onTabChange(event: any): void {
    // Lógica para cambiar entre tabs
  }

  // Acciones de expedientes
  crearNuevoExpediente(): void {
    this.router.navigate(['/expedientes/nuevo']);
  }

  verDetalle(expediente: Expediente): void {
    this.router.navigate(['/expedientes', expediente.id]);
  }

  editarExpediente(expediente: Expediente): void {
    this.router.navigate(['/expedientes', expediente.id, 'editar']);
  }

  moverExpediente(expediente: Expediente): void {
    const dialogRef = this.dialog.open(MoverExpedienteModalComponent, {
      width: '900px',
      data: {
        expediente: expediente,
        oficinas: this.oficinas()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.mostrarExito('Expediente movido exitosamente');
        this.cargarExpedientes();
        this.actualizarOficinasFlujo();
      }
    });
  }

  cambiarUrgencia(expediente: Expediente): void {
    // Implementar modal para cambiar urgencia
    this.mostrarInfo('Funcionalidad en desarrollo');
  }

  nuevoMovimiento(): void {
    // Implementar modal para nuevo movimiento
    this.mostrarInfo('Funcionalidad en desarrollo');
  }

  // Funcionalidades de reportes
  exportarFlujo(): void {
    this.mostrarInfo('Funcionalidad en desarrollo');
  }

  configurarFlujos(): void {
    const dialogRef = this.dialog.open(ConfigurarFlujosModalComponent, {
      width: '1000px',
      data: {
        oficinas: this.oficinas()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.mostrarExito('Flujo de trabajo configurado exitosamente');
        // Aquí se podría recargar la configuración de flujos
      }
    });
  }

  generarReporte(): void {
    // Simular generación de reporte
    this.reporteResultados.set({
      totalExpedientes: this.totalExpedientes(),
      tiempoPromedio: 5.2,
      eficiencia: 87.5
    });
    this.reporteGenerado.set(true);
    this.mostrarExito('Reporte generado exitosamente');
  }

  // Utilidades
  getColorEstado(estado: string): string {
    const estadoObj = this.estadosExpediente().find(e => e.id === estado);
    return estadoObj ? estadoObj.color : 'primary';
  }

  getColorUrgencia(urgencia?: string): string {
    switch (urgencia) {
      case 'CRITICO': return 'warn';
      case 'MUY_URGENTE': return 'accent';
      case 'URGENTE': return 'primary';
      default: return 'primary';
    }
  }

  // Notificaciones
  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
  }

  private mostrarInfo(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
  }
} 