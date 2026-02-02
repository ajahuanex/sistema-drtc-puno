import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { OficinaService } from '../../services/oficina.service';
import { Oficina } from '../../models/oficina.model';

@Component({
  selector: 'app-oficina-expedientes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="expedientes-container">
      <!-- Header -->
      <div class="header">
        <div class="title-section">
          <h1>Expedientes de {{ oficina()?.nombre | uppercase }}</h1>
          <p>Gestiona los expedientes asignados a esta oficina</p>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="moverExpediente()">
            <mat-icon>swap_horiz</mat-icon>
            Mover Expediente
          </button>
          <button mat-button routerLink="/oficinas">
            <mat-icon>arrow_back</mat-icon>
            Volver a Oficinas
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <mat-card class="filtros-card">
        <mat-card-content>
          <form [formGroup]="filtrosForm" class="filtros-form">
            <div class="filtros-row">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Número de Expediente</mat-label>
                <input matInput formControlName="numeroExpediente" placeholder="Buscar por número">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Empresa</mat-label>
                <input matInput formControlName="empresa" placeholder="Buscar por empresa">
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado">
                  <mat-option value="">Todos los estados</mat-option>
                  <mat-option value="PENDIENTE">Pendiente</mat-option>
                  <mat-option value="EN_PROCESO">En Proceso</mat-option>
                  <mat-option value="COMPLETADO">Completado</mat-option>
                  <mat-option value="RECHAZADO">Rechazado</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Tipo</mat-label>
                <mat-select formControlName="tipo">
                  <mat-option value="">Todos los tipos</mat-option>
                  <mat-option value="AUTORIZACION_RUTA">Autorización de Ruta</mat-option>
                  <mat-option value="LICENCIA_CONDUCIR">Licencia de Conducir</mat-option>
                  <mat-option value="PERMISO_OPERACION">Permiso de Operación</mat-option>
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
              <mat-icon class="stat-icon">folder</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ totalExpedientes() }}</span>
                <span class="stat-label">Total Expedientes</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">pending</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ expedientesPendientes() }}</span>
                <span class="stat-label">Pendientes</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">schedule</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ expedientesEnProceso() }}</span>
                <span class="stat-label">En Proceso</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">check_circle</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ expedientesCompletados() }}</span>
                <span class="stat-label">Completados</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tabla de Expedientes -->
      <mat-card class="table-card">
        <mat-card-content>
          @if (loading()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Cargando expedientes...</p>
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="expedientes()" matSort class="expedientes-table">
                <!-- Número -->
                <ng-container matColumnDef="numero">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Número</th>
                  <td mat-cell *matCellDef="let expediente">{{ expediente.numero | uppercase }}</td>
                </ng-container>

                <!-- Tipo -->
                <ng-container matColumnDef="tipo">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Tipo</th>
                  <td mat-cell *matCellDef="let expediente">
                    <mat-chip [color]="getTipoColor(expediente.tipo)" selected>
                      {{ expediente.tipo | uppercase }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Empresa -->
                <ng-container matColumnDef="empresa">
                  <th mat-header-cell *matHeaderCellDef>Empresa</th>
                  <td mat-cell *matCellDef="let expediente">{{ expediente.empresa | uppercase }}</td>
                </ng-container>

                <!-- Estado -->
                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Estado</th>
                  <td mat-cell *matCellDef="let expediente">
                    <mat-chip [color]="getEstadoColor(expediente.estado)" selected>
                      {{ expediente.estado | uppercase }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Fecha Ingreso -->
                <ng-container matColumnDef="fechaIngreso">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha Ingreso</th>
                  <td mat-cell *matCellDef="let expediente">{{ expediente.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                </ng-container>

                <!-- Tiempo en Oficina -->
                <ng-container matColumnDef="tiempoOficina">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Tiempo en Oficina</th>
                  <td mat-cell *matCellDef="let expediente">{{ expediente.tiempoOficina }} días</td>
                </ng-container>

                <!-- Prioridad -->
                <ng-container matColumnDef="prioridad">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Prioridad</th>
                  <td mat-cell *matCellDef="let expediente">
                    <mat-chip [color]="getPrioridadColor(expediente.prioridad)" selected>
                      {{ expediente.prioridad | uppercase }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let expediente">
                    <div class="acciones-container">
                      <button mat-icon-button matTooltip="Ver Detalles" (click)="verDetalles(expediente)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Ver Flujo" (click)="verFlujo(expediente)">
                        <mat-icon>timeline</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Mover" (click)="moverExpediente(expediente)">
                        <mat-icon>swap_horiz</mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>

              <mat-paginator 
                [length]="totalExpedientes()"
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
    .expedientes-container {
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

    .actions {
      display: flex;
      gap: 12px;
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
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 24px;
      font-weight: 700;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
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

    .expedientes-table {
      width: 100%;
    }

    .acciones-container {
      display: flex;
      gap: 8px;
    }

    .mat-column-acciones {
      width: 120px;
    }

    .mat-column-tipo,
    .mat-column-estado,
    .mat-column-prioridad {
      width: 120px;
    }

    .mat-column-tiempoOficina {
      width: 140px;
    }

    @media (max-width: 768px) {
      .expedientes-container {
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
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OficinaExpedientesComponent implements OnInit {
  private oficinaService = inject(OficinaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // Signals
  loading = signal(false);
  oficina = signal<Oficina | null>(null);
  expedientes = signal<any[]>([]);
  totalExpedientes = signal(0);
  pageSize = signal(25);
  currentPage = signal(0);

  // Filtros
  filtrosForm: FormGroup;

  // Columnas de la tabla
  displayedColumns = [
    'numero', 'tipo', 'empresa', 'estado', 'fechaIngreso', 'tiempoOficina', 'prioridad', 'acciones'
  ];

  // Computed properties
  expedientesPendientes = computed(() => 
    this.expedientes().filter(e => e.estado === 'PENDIENTE').length
  );

  expedientesEnProceso = computed(() => 
    this.expedientes().filter(e => e.estado === 'EN_PROCESO').length
  );

  expedientesCompletados = computed(() => 
    this.expedientes().filter(e => e.estado === 'COMPLETADO').length
  );

  constructor() {
    this.filtrosForm = this.fb.group({
      numeroExpediente: [''],
      empresa: [''],
      estado: [''],
      tipo: ['']
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const oficinaId = params['id'];
      if (oficinaId) {
        this.cargarOficina(oficinaId);
        this.cargarExpedientes(oficinaId);
      }
    });
  }

  cargarOficina(id: string): void {
    this.oficinaService.getOficina(id).subscribe({
      next: (oficina) => {
        this.oficina.set(oficina);
      },
      error: (error) => {
        console.error('Error al cargar oficina::', error);
      }
    });
  }

  cargarExpedientes(oficinaId: string): void {
    this.loading.set(true);
    
    const skip = this.currentPage() * this.pageSize();
    
    this.oficinaService.getExpedientesPorOficina(oficinaId, skip, this.pageSize()).subscribe({
      next: (expedientes) => {
        // Simular datos para demostración
        this.expedientes.set(this.simularExpedientes());
        this.totalExpedientes.set(this.expedientes().length);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar expedientes::', error);
        this.snackBar.open('Error al cargar los expedientes', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  simularExpedientes(): any[] {
    return [
      {
        id: 'EXP001',
        numero: 'EXP-2024-001',
        tipo: 'AUTORIZACION_RUTA',
        empresa: 'EMPRESA TRANSPORTES ABC S.A.C.',
        estado: 'EN_PROCESO',
        fechaIngreso: '2024-01-15',
        tiempoOficina: 5,
        prioridad: 'ALTA'
      },
      {
        id: 'EXP002',
        numero: 'EXP-2024-002',
        tipo: 'LICENCIA_CONDUCIR',
        empresa: 'EMPRESA TRANSPORTES XYZ S.A.C.',
        estado: 'PENDIENTE',
        fechaIngreso: '2024-01-18',
        tiempoOficina: 2,
        prioridad: 'MEDIA'
      },
      {
        id: 'EXP003',
        numero: 'EXP-2024-003',
        tipo: 'PERMISO_OPERACION',
        empresa: 'EMPRESA TRANSPORTES 123 S.A.C.',
        estado: 'COMPLETADO',
        fechaIngreso: '2024-01-10',
        tiempoOficina: 8,
        prioridad: 'BAJA'
      }
    ];
  }

  aplicarFiltros(): void {
    // Implementar lógica de filtrado
    this.currentPage.set(0);
    this.cargarExpedientes(this.oficina()?.id || '');
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.aplicarFiltros();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarExpedientes(this.oficina()?.id || '');
  }

  // Acciones
  verDetalles(expediente: any): void {
    this.router.navigate(['/expedientes', expediente.id]);
  }

  verFlujo(expediente: any): void {
    this.router.navigate(['/expedientes', expediente.id, 'flujo']);
  }

  moverExpediente(expediente?: any): void {
    // Implementar modal para mover expediente
    this.snackBar.open('Funcionalidad de mover expediente en desarrollo', 'Cerrar', { duration: 3000 });
  }

  // Métodos de utilidad para colores
  getTipoColor(tipo: string): string {
    const colores: { [key: string]: string } = {
      'AUTORIZACION_RUTA': 'primary',
      'LICENCIA_CONDUCIR': 'accent',
      'PERMISO_OPERACION': 'warn'
    };
    return colores[tipo] || 'primary';
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'PENDIENTE': 'warn',
      'EN_PROCESO': 'primary',
      'COMPLETADO': 'primary',
      'RECHAZADO': 'warn'
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
} 