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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ExpedienteService } from '../../services/expediente.service';
import { OficinaService } from '../../services/oficina.service';
import { EmpresaService } from '../../services/empresa.service';
import { Expediente } from '../../models/expediente.model';
import { Oficina } from '../../models/oficina.model';
import { Empresa } from '../../models/empresa.model';

interface EstadoExpediente {
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
        </div>
      </div>

      <!-- Estadísticas del Flujo -->
      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-icon total">
            <mat-icon>folder</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ totalExpedientes() }}</div>
            <div class="stat-label">Total Expedientes</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon pendientes">
            <mat-icon>pending</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ expedientesPendientes() }}</div>
            <div class="stat-label">Pendientes</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon en-proceso">
            <mat-icon>sync</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ expedientesEnProceso() }}</div>
            <div class="stat-label">En Proceso</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon completados">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ expedientesCompletados() }}</div>
            <div class="stat-label">Completados</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon atrasados">
            <mat-icon>warning</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ expedientesAtrasados() }}</div>
            <div class="stat-label">Atrasados</div>
          </div>
        </div>
      </div>

      <!-- Diagrama del Flujo -->
      <mat-card class="flujo-diagrama-card">
        <mat-card-header>
          <mat-card-title>Diagrama del Flujo de Expedientes</mat-card-title>
          <mat-card-subtitle>Visualización del proceso completo</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="flujo-diagrama">
            @for (estado of estadosFlujo(); track estado.id) {
              <div class="estado-nodo" [class.activo]="esEstadoActivo(estado.id)">
                <div class="estado-icono" [style.background]="estado.color">
                  <mat-icon>{{ estado.icono }}</mat-icon>
                </div>
                <div class="estado-info">
                  <h4>{{ estado.nombre | uppercase }}</h4>
                  <p>{{ estado.descripcion }}</p>
                  <div class="estado-metricas">
                    <span class="tiempo-estimado">{{ estado.tiempoEstimado }} días</span>
                    <span class="expedientes-estado">{{ getExpedientesEnEstado(estado.id) }} expedientes</span>
                  </div>
                </div>
                @if (estado.orden < estadosFlujo().length) {
                  <div class="conector">
                    <mat-icon>arrow_forward</mat-icon>
                  </div>
                }
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Filtros y Búsqueda -->
      <mat-card class="filtros-card">
        <mat-card-content>
          <form [formGroup]="filtrosForm" class="filtros-form">
            <div class="filtros-row">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado">
                  <mat-option value="">Todos los estados</mat-option>
                  @for (estado of estadosFlujo(); track estado.id) {
                    <mat-option [value]="estado.id">{{ estado.nombre | uppercase }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Empresa</mat-label>
                <mat-select formControlName="empresaId">
                  <mat-option value="">Todas las empresas</mat-option>
                  @for (empresa of empresas(); track empresa.id) {
                    <mat-option [value]="empresa.id">{{ empresa.razonSocial.principal | uppercase }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Oficina</mat-label>
                <mat-select formControlName="oficinaId">
                  <mat-option value="">Todas las oficinas</mat-option>
                  @for (oficina of oficinas(); track oficina.id) {
                    <mat-option [value]="oficina.id">{{ oficina.nombre | uppercase }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Fecha desde</mat-label>
                <input matInput [matDatepicker]="pickerDesde" formControlName="fechaDesde">
                <mat-datepicker-toggle matSuffix [for]="pickerDesde"></mat-datepicker-toggle>
                <mat-datepicker #pickerDesde></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Fecha hasta</mat-label>
                <input matInput [matDatepicker]="pickerHasta" formControlName="fechaHasta">
                <mat-datepicker-toggle matSuffix [for]="pickerHasta"></mat-datepicker-toggle>
                <mat-datepicker #pickerHasta></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="filtros-actions">
              <button mat-raised-button color="primary" (click)="aplicarFiltros()">
                <mat-icon>filter_list</mat-icon>
                Aplicar Filtros
              </button>
              <button mat-button (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Lista de Expedientes -->
      <mat-card class="expedientes-card">
        <mat-card-header>
          <mat-card-title>Expedientes en Flujo</mat-card-title>
          <mat-card-subtitle>Gestión y seguimiento de expedientes</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loading()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Cargando expedientes...</p>
            </div>
          } @else if (expedientesFiltrados().length === 0) {
            <div class="no-data">
              <mat-icon>folder_open</mat-icon>
              <h3>No hay expedientes</h3>
              <p>No se encontraron expedientes con los filtros aplicados</p>
            </div>
          } @else {
            <table mat-table [dataSource]="expedientesFiltrados()" class="expedientes-table">
              <ng-container matColumnDef="numero">
                <th mat-header-cell *matHeaderCellDef>Número</th>
                <td mat-cell *matCellDef="let expediente">{{ expediente.numero | uppercase }}</td>
              </ng-container>

              <ng-container matColumnDef="tipo">
                <th mat-header-cell *matHeaderCellDef>Tipo</th>
                <td mat-cell *matCellDef="let expediente">{{ expediente.tipo | uppercase }}</td>
              </ng-container>

              <ng-container matColumnDef="empresa">
                <th mat-header-cell *matHeaderCellDef>Empresa</th>
                <td mat-cell *matCellDef="let expediente">{{ getEmpresaNombre(expediente.empresaId) | uppercase }}</td>
              </ng-container>

              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let expediente">
                  <mat-chip [color]="getEstadoColor(expediente.estado)" selected>
                    {{ getEstadoNombre(expediente.estado) | uppercase }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="progreso">
                <th mat-header-cell *matHeaderCellDef>Progreso</th>
                <td mat-cell *matCellDef="let expediente">
                  <div class="progreso-container">
                    <mat-progress-bar 
                      [value]="getProgresoExpediente(expediente.id)" 
                      [color]="getProgresoColor(expediente.id)">
                    </mat-progress-bar>
                    <span class="progreso-texto">{{ getProgresoExpediente(expediente.id) }}%</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="tiempo">
                <th mat-header-cell *matHeaderCellDef>Tiempo</th>
                <td mat-cell *matCellDef="let expediente">
                  <div class="tiempo-container">
                    <span class="tiempo-transcurrido">{{ getTiempoTranscurrido(expediente.id) }} días</span>
                    <span class="tiempo-estimado">/ {{ getTiempoEstimado(expediente.id) }} días</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let expediente">
                  <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Más opciones">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="verDetalle(expediente.id)">
                      <mat-icon>visibility</mat-icon>
                      Ver detalle
                    </button>
                    <button mat-menu-item (click)="cambiarEstado(expediente.id)">
                      <mat-icon>swap_horiz</mat-icon>
                      Cambiar estado
                    </button>
                    <button mat-menu-item (click)="agregarComentario(expediente.id)">
                      <mat-icon>comment</mat-icon>
                      Agregar comentario
                    </button>
                    <button mat-menu-item (click)="verHistorial(expediente.id)">
                      <mat-icon>history</mat-icon>
                      Ver historial
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columnasExpedientes"></tr>
              <tr mat-row *matRowDef="let row; columns: columnasExpedientes;"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .flujo-expedientes-container {
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

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .stat-icon.total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .stat-icon.pendientes {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .stat-icon.en-proceso {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .stat-icon.completados {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    }

    .stat-icon.atrasados {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }

    .stat-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      font-size: 24px;
      font-weight: 700;
      color: #2c3e50;
    }

    .stat-label {
      font-size: 14px;
      color: #6c757d;
      margin-top: 4px;
    }

    .flujo-diagrama-card {
      margin-bottom: 32px;
      border-radius: 16px;
    }

    .flujo-diagrama {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 24px;
      padding: 32px;
    }

    .estado-nodo {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      position: relative;
    }

    .estado-icono {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.3s ease;
    }

    .estado-nodo.activo .estado-icono {
      transform: scale(1.1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .estado-icono mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .estado-info {
      text-align: center;
      max-width: 150px;
    }

    .estado-info h4 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 14px;
      font-weight: 600;
    }

    .estado-info p {
      margin: 0 0 8px 0;
      color: #6c757d;
      font-size: 12px;
      line-height: 1.4;
    }

    .estado-metricas {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 11px;
      color: #6c757d;
    }

    .conector {
      position: absolute;
      right: -36px;
      top: 40px;
      color: #6c757d;
    }

    .conector mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .filtros-card {
      margin-bottom: 32px;
      border-radius: 16px;
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
      align-items: end;
    }

    .filtro-field {
      width: 100%;
    }

    .filtros-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .expedientes-card {
      border-radius: 16px;
    }

    .expedientes-table {
      width: 100%;
    }

    .expedientes-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #2c3e50;
    }

    .progreso-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .progreso-container mat-progress-bar {
      flex: 1;
    }

    .progreso-texto {
      font-size: 12px;
      color: #6c757d;
      min-width: 40px;
    }

    .tiempo-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tiempo-transcurrido {
      font-weight: 600;
      color: #2c3e50;
    }

    .tiempo-estimado {
      font-size: 12px;
      color: #6c757d;
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
      .flujo-expedientes-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        text-align: center;
        gap: 16px;
      }

      .stats-section {
        grid-template-columns: 1fr;
      }

      .flujo-diagrama {
        flex-direction: column;
        gap: 16px;
      }

      .conector {
        display: none;
      }

      .filtros-row {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlujoExpedientesComponent implements OnInit, OnDestroy {
  private expedienteService = inject(ExpedienteService);
  private oficinaService = inject(OficinaService);
  private empresaService = inject(EmpresaService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Signals
  loading = signal(false);
  expedientes = signal<Expediente[]>([]);
  oficinas = signal<Oficina[]>([]);
  empresas = signal<Empresa[]>([]);

  // Estados del flujo
  estadosFlujo = signal<EstadoExpediente[]>([
    {
      id: 'REGISTRADO',
      nombre: 'Registrado',
      descripcion: 'Expediente ingresado al sistema',
      color: '#667eea',
      icono: 'add_circle',
      orden: 1,
      accionRequerida: 'Revisar documentación',
      tiempoEstimado: 1
    },
    {
      id: 'EN_REVISION',
      nombre: 'En Revisión',
      descripcion: 'Documentación en análisis',
      color: '#f093fb',
      icono: 'search',
      orden: 2,
      accionRequerida: 'Validar requisitos',
      tiempoEstimado: 3
    },
    {
      id: 'PENDIENTE_DOCUMENTACION',
      nombre: 'Pendiente Documentación',
      descripcion: 'Esperando documentos adicionales',
      color: '#fa709a',
      icono: 'description',
      orden: 3,
      accionRequerida: 'Solicitar documentos',
      tiempoEstimado: 5
    },
    {
      id: 'EN_EVALUACION',
      nombre: 'En Evaluación',
      descripcion: 'Evaluación técnica en curso',
      color: '#4facfe',
      icono: 'assessment',
      orden: 4,
      accionRequerida: 'Realizar evaluación',
      tiempoEstimado: 7
    },
    {
      id: 'PENDIENTE_APROBACION',
      nombre: 'Pendiente Aprobación',
      descripcion: 'Esperando aprobación final',
      color: '#43e97b',
      icono: 'pending_actions',
      orden: 5,
      accionRequerida: 'Revisar y aprobar',
      tiempoEstimado: 2
    },
    {
      id: 'APROBADO',
      nombre: 'Aprobado',
      descripcion: 'Expediente aprobado',
      color: '#28a745',
      icono: 'check_circle',
      orden: 6,
      accionRequerida: 'Finalizar proceso',
      tiempoEstimado: 1
    },
    {
      id: 'RECHAZADO',
      nombre: 'Rechazado',
      descripcion: 'Expediente rechazado',
      color: '#dc3545',
      icono: 'cancel',
      orden: 7,
      accionRequerida: 'Notificar rechazo',
      tiempoEstimado: 1
    }
  ]);

  // Computed properties
  totalExpedientes = computed(() => this.expedientes().length);
  expedientesPendientes = computed(() => this.expedientes().filter(e => e.estado === 'EN PROCESO').length);
  expedientesEnProceso = computed(() => this.expedientes().filter(e => ['EN_REVISION', 'EN_EVALUACION'].includes(e.estado)).length);
  expedientesCompletados = computed(() => this.expedientes().filter(e => e.estado === 'APROBADO').length);
  expedientesAtrasados = computed(() => this.expedientes().filter(e => this.esExpedienteAtrasado(e.id)).length);

  expedientesFiltrados = computed(() => {
    const expedientes = this.expedientes();
    const filtros = this.filtrosForm.value;
    
    return expedientes.filter(exp => {
      if (filtros.estado && exp.estado !== filtros.estado) return false;
      if (filtros.empresaId && exp.empresaId !== filtros.empresaId) return false;
      if (filtros.oficinaId && exp.oficinaActual?.id !== filtros.oficinaId) return false;
      if (filtros.fechaDesde && new Date(exp.fechaEmision) < filtros.fechaDesde) return false;
      if (filtros.fechaHasta && new Date(exp.fechaEmision) > filtros.fechaHasta) return false;
      return true;
    });
  });

  // Formulario de filtros
  filtrosForm: FormGroup;

  // Columnas para la tabla
  columnasExpedientes = ['numero', 'tipo', 'empresa', 'estado', 'progreso', 'tiempo', 'acciones'];

  constructor() {
    this.filtrosForm = this.fb.group({
      estado: [''],
      empresaId: [''],
      oficinaId: [''],
      fechaDesde: [null],
      fechaHasta: [null]
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
    this.loading.set(true);
    
    // Cargar expedientes
    this.expedienteService.getExpedientes().subscribe({
      next: (expedientes) => {
        this.expedientes.set(expedientes);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando expedientes:', error);
        this.loading.set(false);
      }
    });

    // Cargar oficinas
    this.oficinaService.getOficinas().subscribe({
      next: (oficinas) => this.oficinas.set(oficinas),
      error: (error) => console.error('Error cargando oficinas:', error)
    });

    // Cargar empresas
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => this.empresas.set(empresas),
      error: (error) => console.error('Error cargando empresas:', error)
    });
  }

  aplicarFiltros(): void {
    // Los filtros se aplican automáticamente por el computed property
    this.snackBar.open('Filtros aplicados', 'Cerrar', { duration: 2000 });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.snackBar.open('Filtros limpiados', 'Cerrar', { duration: 2000 });
  }

  crearNuevoExpediente(): void {
    this.router.navigate(['/expedientes/nuevo']);
  }

  exportarFlujo(): void {
    this.snackBar.open('Exportando flujo de expedientes...', 'Cerrar', { duration: 2000 });
    // Implementar exportación
  }

  verDetalle(id: string): void {
    this.router.navigate(['/expedientes', id]);
  }

  cambiarEstado(id: string): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  agregarComentario(id: string): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  verHistorial(id: string): void {
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  // Métodos de utilidad
  esEstadoActivo(estadoId: string): boolean {
    return this.expedientes().some(e => e.estado === estadoId);
  }

  getExpedientesEnEstado(estadoId: string): number {
    return this.expedientes().filter(e => e.estado === estadoId).length;
  }

  getEmpresaNombre(empresaId: string): string {
    const empresa = this.empresas().find(e => e.id === empresaId);
    return empresa ? empresa.razonSocial.principal : 'N/A';
  }

  getEstadoNombre(estadoId: string): string {
    const estado = this.estadosFlujo().find(e => e.id === estadoId);
    return estado ? estado.nombre : estadoId;
  }

  getEstadoColor(estadoId: string): string {
    const estado = this.estadosFlujo().find(e => e.id === estadoId);
    return estado ? estado.color : '#6c757d';
  }

  getProgresoExpediente(expedienteId: string): number {
    const expediente = this.expedientes().find(e => e.id === expedienteId);
    if (!expediente) return 0;
    
    const estado = this.estadosFlujo().find(e => e.id === expediente.estado);
    if (!estado) return 0;
    
    return Math.round((estado.orden / this.estadosFlujo().length) * 100);
  }

  getProgresoColor(expedienteId: string): string {
    const progreso = this.getProgresoExpediente(expedienteId);
    if (progreso >= 80) return 'primary';
    if (progreso >= 50) return 'accent';
    return 'warn';
  }

  getTiempoTranscurrido(expedienteId: string): number {
    const expediente = this.expedientes().find(e => e.id === expedienteId);
    if (!expediente) return 0;
    
    const fechaCreacion = new Date(expediente.fechaEmision);
    const hoy = new Date();
    const diffTime = Math.abs(hoy.getTime() - fechaCreacion.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getTiempoEstimado(expedienteId: string): number {
    const expediente = this.expedientes().find(e => e.id === expedienteId);
    if (!expediente) return 0;
    
    const estado = this.estadosFlujo().find(e => e.id === expediente.estado);
    return estado ? estado.tiempoEstimado : 0;
  }

  esExpedienteAtrasado(expedienteId: string): boolean {
    const tiempoTranscurrido = this.getTiempoTranscurrido(expedienteId);
    const tiempoEstimado = this.getTiempoEstimado(expedienteId);
    return tiempoTranscurrido > tiempoEstimado;
  }
} 