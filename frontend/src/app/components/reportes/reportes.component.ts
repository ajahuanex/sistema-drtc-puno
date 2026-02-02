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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ReportesService, TipoReporte, FormatoReporte, EstadoReporte, ReporteConfig, ReporteFiltros, ReporteResultado } from '../../services/reportes.service';
import { EmpresaService } from '../../services/empresa.service';
import { OficinaService } from '../../services/oficina.service';
import { Empresa } from '../../models/empresa.model';
import { Oficina } from '../../models/oficina.model';

interface ReporteRapido {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  tipo: TipoReporte;
  formato: FormatoReporte;
}

@Component({
  selector: 'app-reportes',
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
    MatCheckboxModule,
    MatTabsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="reportes-container">
      <!-- Header -->
      <div class="header">
        <div class="title-section">
          <h1>Generador de Reportes</h1>
          <p>Sistema integral de reportes y análisis del Sistema Regional de Registros de Transporte (SIRRET)</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="crearReportePersonalizado()">
            <mat-icon>add</mat-icon>
            Reporte Personalizado
          </button>
          <button mat-raised-button color="accent" (click)="gestionarPlantillas()">
            <mat-icon>template</mat-icon>
            Plantillas
          </button>
        </div>
      </div>

      <!-- Reportes Rápidos -->
      <div class="reportes-rapidos-section">
        <h2>Reportes Rápidos</h2>
        <p>Genera reportes comunes con un solo clic</p>
        
        <div class="reportes-rapidos-grid">
          @for (reporte of reportesRapidos(); track reporte.id) {
            <mat-card class="reporte-rapido-card" (click)="generarReporteRapido(reporte)">
              <mat-card-content>
                <div class="reporte-icono" [style.background]="reporte.color">
                  <mat-icon>{{ reporte.icono }}</mat-icon>
                </div>
                <div class="reporte-info">
                  <h3>{{ reporte.nombre | uppercase }}</h3>
                  <p>{{ reporte.descripcion }}</p>
                  <div class="reporte-formato">
                    <mat-chip [color]="getFormatoColor(reporte.formato)" selected>
                      {{ reporte.formato }}
                    </mat-chip>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </div>

      <!-- Generador de Reportes -->
      <mat-card class="generador-card">
        <mat-card-header>
          <mat-card-title>Generador de Reportes</mat-card-title>
          <mat-card-subtitle>Configura y genera reportes personalizados</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="reporteForm" class="reporte-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Tipo de Reporte</mat-label>
                <mat-select formControlName="tipo" required>
                  @for (tipo of tiposReporte(); track tipo) {
                    <mat-option [value]="tipo">{{ tipo | uppercase }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Formato</mat-label>
                <mat-select formControlName="formato" required>
                  @for (formato of formatosReporte(); track formato) {
                    <mat-option [value]="formato">{{ formato | uppercase }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Nombre del Reporte</mat-label>
                <input matInput formControlName="nombre" placeholder="Ingrese nombre del reporte" required>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Empresa</mat-label>
                <mat-select formControlName="empresaId">
                  <mat-option value="">Todas las empresas</mat-option>
                  @for (empresa of empresas(); track empresa.id) {
                    <mat-option [value]="empresa.id">{{ empresa.razonSocial.principal | uppercase }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Oficina</mat-label>
                <mat-select formControlName="oficinaId">
                  <mat-option value="">Todas las oficinas</mat-option>
                  @for (oficina of oficinas(); track oficina.id) {
                    <mat-option [value]="oficina.id">{{ oficina.nombre | uppercase }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado">
                  <mat-option value="">Todos los estados</mat-option>
                  <mat-option value="ACTIVO">ACTIVO</mat-option>
                  <mat-option value="INACTIVO">INACTIVO</mat-option>
                  <mat-option value="PENDIENTE">PENDIENTE</mat-option>
                  <mat-option value="APROBADO">APROBADO</mat-option>
                  <mat-option value="RECHAZADO">RECHAZADO</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Fecha desde</mat-label>
                <input matInput [matDatepicker]="pickerDesde" formControlName="fechaDesde">
                <mat-datepicker-toggle matSuffix [for]="pickerDesde"></mat-datepicker-toggle>
                <mat-datepicker #pickerDesde></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Fecha hasta</mat-label>
                <input matInput [matDatepicker]="pickerHasta" formControlName="fechaHasta">
                <mat-datepicker-toggle matSuffix [for]="pickerHasta"></mat-datepicker-toggle>
                <mat-datepicker #pickerHasta></mat-datepicker>
              </mat-form-field>

              <div class="form-field">
                <mat-checkbox formControlName="incluirGraficos">
                  Incluir gráficos
                </mat-checkbox>
              </div>
            </div>

            <div class="form-actions">
              <button mat-raised-button color="primary" (click)="generarReporte()" [disabled]="!reporteForm.valid || generando()">
                <mat-icon>assessment</mat-icon>
                {{ generando() ? 'Generando...' : 'Generar Reporte' }}
              </button>
              <button mat-button (click)="limpiarFormulario()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
              <button mat-button (click)="guardarPlantilla()">
                <mat-icon>save</mat-icon>
                Guardar como Plantilla
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Reportes Generados -->
      <mat-card class="reportes-generados-card">
        <mat-card-header>
          <mat-card-title>Reportes Generados</mat-card-title>
          <mat-card-subtitle>Historial y estado de reportes</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loadingReportes()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Cargando reportes...</p>
            </div>
          } @else if (reportesGenerados().length === 0) {
            <div class="no-data">
              <mat-icon>assessment</mat-icon>
              <h3>No hay reportes generados</h3>
              <p>Genera tu primer reporte para comenzar</p>
            </div>
          } @else {
            <table mat-table [dataSource]="reportesGenerados()" class="reportes-table">
              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let reporte">{{ reporte.nombre | uppercase }}</td>
              </ng-container>

              <ng-container matColumnDef="tipo">
                <th mat-header-cell *matHeaderCellDef>Tipo</th>
                <td mat-cell *matCellDef="let reporte">{{ reporte.tipo | uppercase }}</td>
              </ng-container>

              <ng-container matColumnDef="formato">
                <th mat-header-cell *matHeaderCellDef>Formato</th>
                <td mat-cell *matCellDef="let reporte">
                  <mat-chip [color]="getFormatoColor(reporte.formato)" selected>
                    {{ reporte.formato }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let reporte">
                  <mat-chip [color]="getEstadoColor(reporte.estado)" selected>
                    <mat-icon>{{ getEstadoIcon(reporte.estado) }}</mat-icon>
                    {{ reporte.estado | uppercase }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="fechaGeneracion">
                <th mat-header-cell *matHeaderCellDef>Fecha</th>
                <td mat-cell *matCellDef="let reporte">{{ reporte.fechaGeneracion | date:'dd/MM/yyyy HH:mm' }}</td>
              </ng-container>

              <ng-container matColumnDef="tamanio">
                <th mat-header-cell *matHeaderCellDef>Tamaño</th>
                <td mat-cell *matCellDef="let reporte">{{ formatearTamanio(reporte.tamanio) }}</td>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let reporte">
                  <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Más opciones">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    @if (reporte.estado === 'COMPLETADO') {
                      <button mat-menu-item (click)="descargarReporte(reporte.id)">
                        <mat-icon>download</mat-icon>
                        Descargar
                      </button>
                    }
                    <button mat-menu-item (click)="verDetalle(reporte.id)">
                      <mat-icon>visibility</mat-icon>
                      Ver detalle
                    </button>
                    @if (reporte.estado === 'PENDIENTE' || reporte.estado === 'EN_PROCESO') {
                      <button mat-menu-item (click)="cancelarReporte(reporte.id)">
                        <mat-icon>cancel</mat-icon>
                        Cancelar
                      </button>
                    }
                    <button mat-menu-item (click)="duplicarReporte(reporte)">
                      <mat-icon>content_copy</mat-icon>
                      Duplicar
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columnasReportes"></tr>
              <tr mat-row *matRowDef="let row; columns: columnasReportes;"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>

      <!-- Reportes Programados -->
      <mat-card class="reportes-programados-card">
        <mat-card-header>
          <mat-card-title>Reportes Programados</mat-card-title>
          <mat-card-subtitle>Reportes automáticos y programados</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loadingProgramados()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
            </div>
          } @else if (reportesProgramados().length === 0) {
            <div class="no-data">
              <mat-icon>schedule</mat-icon>
              <p>No hay reportes programados</p>
            </div>
          } @else {
            <div class="programados-lista">
              @for (programado of reportesProgramados(); track programado.id) {
                <div class="programado-item">
                  <div class="programado-info">
                    <div class="programado-nombre">{{ programado.nombre | uppercase }}</div>
                    <div class="programado-detalles">
                      <span class="frecuencia">{{ programado.frecuencia | uppercase }}</span>
                      <span class="proximo">{{ programado.proximoEjecucion | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                  </div>
                  <div class="programado-acciones">
                    <mat-chip [color]="programado.activo ? 'primary' : 'warn'" selected>
                      {{ programado.activo ? 'ACTIVO' : 'INACTIVO' }}
                    </mat-chip>
                    <button mat-icon-button [matMenuTriggerFor]="menuProg" matTooltip="Opciones">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menuProg="matMenu">
                      <button mat-menu-item (click)="editarProgramacion(programado.id)">
                        <mat-icon>edit</mat-icon>
                        Editar
                      </button>
                      <button mat-menu-item (click)="toggleProgramacion(programado.id, !programado.activo)">
                        <mat-icon>{{ programado.activo ? 'pause' : 'play_arrow' }}</mat-icon>
                        {{ programado.activo ? 'Pausar' : 'Activar' }}
                      </button>
                      <button mat-menu-item (click)="eliminarProgramacion(programado.id)">
                        <mat-icon>delete</mat-icon>
                        Eliminar
                      </button>
                    </mat-menu>
                  </div>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .reportes-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      color: white;
    }

    .title-section h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 600;
    }

    .title-section p {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .reportes-rapidos-section {
      margin-bottom: 32px;
    }

    .reportes-rapidos-section h2 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 24px;
      font-weight: 600;
    }

    .reportes-rapidos-section p {
      margin: 0 0 24px 0;
      color: #6c757d;
      font-size: 16px;
    }

    .reportes-rapidos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .reporte-rapido-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 16px;
      overflow: hidden;
    }

    .reporte-rapido-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .reporte-rapido-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
    }

    .reporte-icono {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .reporte-icono mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .reporte-info {
      flex: 1;
    }

    .reporte-info h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
    }

    .reporte-info p {
      margin: 0 0 12px 0;
      color: #6c757d;
      font-size: 14px;
      line-height: 1.4;
    }

    .generador-card, .reportes-generados-card, .reportes-programados-card {
      margin-bottom: 32px;
      border-radius: 16px;
    }

    .generador-card mat-card-header {
      background: #f8f9fa;
      padding: 20px;
    }

    .generador-card mat-card-title {
      margin: 0;
      color: #2c3e50;
      font-size: 20px;
      font-weight: 600;
    }

    .generador-card mat-card-subtitle {
      margin: 8px 0 0 0;
      color: #6c757d;
    }

    .generador-card mat-card-content {
      padding: 24px;
    }

    .reporte-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      align-items: end;
    }

    .form-field {
      width: 100%;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-start;
      margin-top: 20px;
    }

    .reportes-table {
      width: 100%;
    }

    .reportes-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #2c3e50;
    }

    .programados-lista {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .programado-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-radius: 12px;
      background: #f8f9fa;
      border-left: 4px solid #667eea;
    }

    .programado-info {
      flex: 1;
    }

    .programado-nombre {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .programado-detalles {
      display: flex;
      gap: 16px;
      font-size: 14px;
      color: #6c757d;
    }

    .programado-acciones {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: #6c757d;
    }

    .no-data mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .no-data h3 {
      margin: 0;
      color: #2c3e50;
    }

    .no-data p {
      margin: 0;
      color: #6c757d;
    }

    @media (max-width: 768px) {
      .reportes-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        text-align: center;
        gap: 16px;
      }

      .reportes-rapidos-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportesComponent implements OnInit, OnDestroy {
  private reportesService = inject(ReportesService);
  private empresaService = inject(EmpresaService);
  private oficinaService = inject(OficinaService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Signals
  generando = signal(false);
  loadingReportes = signal(false);
  loadingProgramados = signal(false);
  reportesGenerados = signal<ReporteResultado[]>([]);
  reportesProgramados = signal<any[]>([]);
  empresas = signal<Empresa[]>([]);
  oficinas = signal<Oficina[]>([]);

  // Computed properties
  tiposReporte = computed(() => this.reportesService.obtenerTiposReporte());
  formatosReporte = computed(() => this.reportesService.obtenerFormatosReporte());

  reportesRapidos = computed(() => [
    {
      id: 'expedientes_general',
      nombre: 'Reporte de Expedientes',
      descripcion: 'Resumen general de todos los expedientes del sistema',
      icono: 'folder',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      tipo: TipoReporte.EXPEDIENTES,
      formato: FormatoReporte.PDF
    },
    {
      id: 'empresas_activas',
      nombre: 'Empresas Activas',
      descripcion: 'Listado de empresas activas con sus vehículos',
      icono: 'business',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      tipo: TipoReporte.EMPRESAS,
      formato: FormatoReporte.EXCEL
    },
    {
      id: 'vehiculos_registrados',
      nombre: 'Vehículos Registrados',
      descripcion: 'Inventario completo de vehículos del sistema',
      icono: 'directions_car',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      tipo: TipoReporte.VEHICULOS,
      formato: FormatoReporte.EXCEL
    },
    {
      id: 'estadisticas_generales',
      nombre: 'Estadísticas Generales',
      descripcion: 'Métricas y estadísticas del Sistema Regional de Registros de Transporte (SIRRET)',
      icono: 'analytics',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      tipo: TipoReporte.ESTADISTICAS_GENERALES,
      formato: FormatoReporte.PDF
    },
    {
      id: 'flujo_expedientes',
      nombre: 'Flujo de Expedientes',
      descripcion: 'Análisis del flujo y tiempos de expedientes',
      icono: 'timeline',
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      tipo: TipoReporte.FLUJO_EXPEDIENTES,
      formato: FormatoReporte.PDF
    },
    {
      id: 'auditoria_sistema',
      nombre: 'Auditoría del Sistema',
      descripcion: 'Registro de actividades y cambios del sistema',
      icono: 'security',
      color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      tipo: TipoReporte.AUDITORIA,
      formato: FormatoReporte.PDF
    }
  ]);

  // Formulario
  reporteForm: FormGroup;

  // Columnas para la tabla
  columnasReportes = ['nombre', 'tipo', 'formato', 'estado', 'fechaGeneracion', 'tamanio', 'acciones'];

  constructor() {
    this.reporteForm = this.fb.group({
      tipo: ['', Validators.required],
      formato: ['', Validators.required],
      nombre: ['', Validators.required],
      empresaId: [''],
      oficinaId: [''],
      estado: [''],
      fechaDesde: [null],
      fechaHasta: [null],
      incluirGraficos: [false]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarDatos(): void {
    this.cargarReportesGenerados();
    this.cargarReportesProgramados();
    this.cargarEmpresas();
    this.cargarOficinas();
  }

  private cargarReportesGenerados(): void {
    this.loadingReportes.set(true);
    this.reportesService.obtenerReportesGenerados().subscribe({
      next: (reportes) => {
        this.reportesGenerados.set(reportes);
        this.loadingReportes.set(false);
      },
      error: (error) => {
        console.error('Error cargando reportes::', error);
        this.loadingReportes.set(false);
      }
    });
  }

  private cargarReportesProgramados(): void {
    this.loadingProgramados.set(true);
    this.reportesService.obtenerReportesProgramados().subscribe({
      next: (programados) => {
        this.reportesProgramados.set(programados);
        this.loadingProgramados.set(false);
      },
      error: (error) => {
        console.error('Error cargando reportes programados::', error);
        this.loadingProgramados.set(false);
      }
    });
  }

  private cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => this.empresas.set(empresas),
      error: (error) => console.error('Error cargando empresas:', error)
    });
  }

  private cargarOficinas(): void {
    this.oficinaService.getOficinas().subscribe({
      next: (oficinas) => this.oficinas.set(oficinas),
      error: (error) => console.error('Error cargando oficinas:', error)
    });
  }

  generarReporteRapido(reporte: ReporteRapido): void {
    const filtros: ReporteFiltros = {};
    
    this.reportesService.generarReporte({
      tipo: reporte.tipo,
      formato: reporte.formato,
      filtros
    }).subscribe({
      next: (resultado) => {
        this.snackBar.open(`Reporte "${reporte.nombre}" generado exitosamente`, 'Cerrar', { duration: 3000 });
        this.cargarReportesGenerados();
      },
      error: (error) => {
        console.error('Error generando reporte::', error);
        this.snackBar.open('Error al generar el reporte', 'Cerrar', { duration: 3000 });
      }
    });
  }

  generarReporte(): void {
    if (this.reporteForm.valid) {
      this.generando.set(true);
      
      const config: ReporteConfig = {
        tipo: this.reporteForm.value.tipo,
        formato: this.reporteForm.value.formato,
        filtros: {
          empresaId: this.reporteForm.value.empresaId,
          oficinaId: this.reporteForm.value.oficinaId,
          estado: this.reporteForm.value.estado,
          fechaDesde: this.reporteForm.value.fechaDesde,
          fechaHasta: this.reporteForm.value.fechaHasta
        },
        parametros: {
          incluirGraficos: this.reporteForm.value.incluirGraficos
        }
      };

      this.reportesService.generarReporte(config).subscribe({
        next: (resultado) => {
          this.snackBar.open(`Reporte "${this.reporteForm.value.nombre}" generado exitosamente`, 'Cerrar', { duration: 3000 });
          this.cargarReportesGenerados();
          this.generando.set(false);
        },
        error: (error) => {
          console.error('Error generando reporte::', error);
          this.snackBar.open('Error al generar el reporte', 'Cerrar', { duration: 3000 });
          this.generando.set(false);
        }
      });
    }
  }

  limpiarFormulario(): void {
    this.reporteForm.reset();
    this.snackBar.open('Formulario limpiado', 'Cerrar', { duration: 2000 });
  }

  guardarPlantilla(): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  crearReportePersonalizado(): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  gestionarPlantillas(): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  descargarReporte(reporteId: string): void {
    this.reportesService.descargarReporte(reporteId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${reporteId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Reporte descargado exitosamente', 'Cerrar', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error descargando reporte::', error);
        this.snackBar.open('Error al descargar el reporte', 'Cerrar', { duration: 3000 });
      }
    });
  }

  verDetalle(reporteId: string): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  cancelarReporte(reporteId: string): void {
    this.reportesService.cancelarReporte(reporteId).subscribe({
      next: () => {
        this.snackBar.open('Reporte cancelado exitosamente', 'Cerrar', { duration: 2000 });
        this.cargarReportesGenerados();
      },
      error: (error) => {
        console.error('Error cancelando reporte::', error);
        this.snackBar.open('Error al cancelar el reporte', 'Cerrar', { duration: 3000 });
      }
    });
  }

  duplicarReporte(reporte: ReporteResultado): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  editarProgramacion(reporteId: string): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  toggleProgramacion(reporteId: string, activo: boolean): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  eliminarProgramacion(reporteId: string): void {
    this.reportesService.eliminarProgramacionReporte(reporteId).subscribe({
      next: () => {
        this.snackBar.open('Programación eliminada exitosamente', 'Cerrar', { duration: 2000 });
        this.cargarReportesProgramados();
      },
      error: (error) => {
        console.error('Error eliminando programación::', error);
        this.snackBar.open('Error al eliminar la programación', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Métodos de utilidad
  getFormatoColor(formato: FormatoReporte): string {
    const colores: { [key in FormatoReporte]: string } = {
      [FormatoReporte.PDF]: 'primary',
      [FormatoReporte.EXCEL]: 'accent',
      [FormatoReporte.CSV]: 'warn',
      [FormatoReporte.HTML]: 'primary'
    };
    return colores[formato] || 'primary';
  }

  getEstadoColor(estado: EstadoReporte): string {
    return this.reportesService.obtenerColorEstado(estado);
  }

  getEstadoIcon(estado: EstadoReporte): string {
    return this.reportesService.obtenerIconoEstado(estado);
  }

  formatearTamanio(bytes: number): string {
    return this.reportesService.formatearTamanioArchivo(bytes);
  }
} 