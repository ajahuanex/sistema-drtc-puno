import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
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
import { MatDialogModule } from '@angular/material/dialog';
import { ResolucionService } from '../../services/resolucion.service';
import { Resolucion } from '../../models/resolucion.model';

@Component({
  selector: 'app-resoluciones',
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
    MatDialogModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Resoluciones</h1>
          <p class="subtitle">Gestión de resoluciones autorizadas</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="accent" (click)="descargarPlantilla()">
            <mat-icon>download</mat-icon>
            Descargar Plantilla
          </button>
          <button mat-raised-button color="accent" (click)="abrirCargaMasiva()">
            <mat-icon>upload_file</mat-icon>
            Carga Masiva
          </button>
          <button mat-raised-button color="primary" (click)="crearResolucion()">
            <mat-icon>add</mat-icon>
            Nueva Resolución
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
                <input matInput [formControl]="searchControl" placeholder="RUC, Número de resolución...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Estado</mat-label>
                <mat-select [formControl]="estadoControl">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="VIGENTE">Vigente</mat-option>
                  <mat-option value="VENCIDA">Vencida</mat-option>
                  <mat-option value="SUSPENDIDA">Suspendida</mat-option>
                  <mat-option value="REVOCADA">Revocada</mat-option>
                  <mat-option value="DADA_DE_BAJA">Dada de Baja</mat-option>
                  <mat-option value="RENOVADA">Renovada</mat-option>
                  <mat-option value="ANULADA">Anulada</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-button (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Tabla -->
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando resoluciones...</p>
          </div>
        } @else if (resolucionesFiltradas().length === 0) {
          <mat-card class="empty-state">
            <mat-card-content>
              <mat-icon class="empty-icon">description</mat-icon>
              <h3>No hay resoluciones</h3>
              <p>No se encontraron resoluciones con los filtros aplicados.</p>
              <button mat-raised-button color="primary" (click)="crearResolucion()">
                <mat-icon>add</mat-icon>
                Crear Primera Resolución
              </button>
            </mat-card-content>
          </mat-card>
        } @else {
          <mat-card class="table-card">
            <mat-card-content>
              <div class="table-container">
                <table mat-table [dataSource]="dataSource" class="resoluciones-table">
                  <!-- RUC Column -->
                  <ng-container matColumnDef="ruc">
                    <th mat-header-cell *matHeaderCellDef>RUC</th>
                    <td mat-cell *matCellDef="let resolucion">{{ resolucion.ruc }}</td>
                  </ng-container>

                  <!-- Resolución Padre Column -->
                  <ng-container matColumnDef="resolucionPadre">
                    <th mat-header-cell *matHeaderCellDef>Resolución Padre</th>
                    <td mat-cell *matCellDef="let resolucion">
                      {{ resolucion.nroResolucionPadre || '-' }}
                    </td>
                  </ng-container>

                  <!-- Resolución Hija Column -->
                  <ng-container matColumnDef="resolucionHija">
                    <th mat-header-cell *matHeaderCellDef>Resolución Hija</th>
                    <td mat-cell *matCellDef="let resolucion">
                      @if (resolucion.nroResolucionesHijas && resolucion.nroResolucionesHijas.length > 0) {
                        <div class="hijas-list">
                          @for (hija of resolucion.nroResolucionesHijas; track hija) {
                            <span class="hija-badge">{{ hija }}</span>
                          }
                        </div>
                      } @else {
                        <span class="sin-datos">-</span>
                      }
                    </td>
                  </ng-container>

                  <!-- Fecha Emisión Column -->
                  <ng-container matColumnDef="fechaEmision">
                    <th mat-header-cell *matHeaderCellDef>Fecha Emisión</th>
                    <td mat-cell *matCellDef="let resolucion">
                      {{ resolucion.fechaEmision | date: 'dd/MM/yyyy' }}
                    </td>
                  </ng-container>

                  <!-- Fecha Vigencia Inicio Column -->
                  <ng-container matColumnDef="fechaVigenciaInicio">
                    <th mat-header-cell *matHeaderCellDef>Fecha Vigencia Inicio</th>
                    <td mat-cell *matCellDef="let resolucion">
                      {{ resolucion.fechaVigenciaInicio | date: 'dd/MM/yyyy' }}
                    </td>
                  </ng-container>

                  <!-- Años Vigencia Column -->
                  <ng-container matColumnDef="aniosVigencia">
                    <th mat-header-cell *matHeaderCellDef>Años Vigencia</th>
                    <td mat-cell *matCellDef="let resolucion">
                      {{ resolucion.aniosVigencia || '-' }}
                    </td>
                  </ng-container>

                  <!-- Fecha Vigencia Fin Column -->
                  <ng-container matColumnDef="fechaVigenciaFin">
                    <th mat-header-cell *matHeaderCellDef>Fecha Vigencia Fin</th>
                    <td mat-cell *matCellDef="let resolucion">
                      {{ resolucion.fechaVigenciaFin | date: 'dd/MM/yyyy' }}
                    </td>
                  </ng-container>

                  <!-- Expedientes Column -->
                  <ng-container matColumnDef="expedientes">
                    <th mat-header-cell *matHeaderCellDef>Expedientes</th>
                    <td mat-cell *matCellDef="let resolucion">
                      @if (resolucion.expedientesIds && resolucion.expedientesIds.length > 0) {
                        <div class="expedientes-list">
                          @for (exp of resolucion.expedientesIds; track exp) {
                            <span class="expediente-badge">{{ exp }}</span>
                          }
                        </div>
                      } @else {
                        <span class="sin-datos">-</span>
                      }
                    </td>
                  </ng-container>

                  <!-- Tipo Trámite Column -->
                  <ng-container matColumnDef="tipoTramite">
                    <th mat-header-cell *matHeaderCellDef>Tipo Trámite</th>
                    <td mat-cell *matCellDef="let resolucion">
                      {{ getTipoTramiteDisplay(resolucion.tipoTramite) }}
                    </td>
                  </ng-container>

                  <!-- Descripción Column -->
                  <ng-container matColumnDef="descripcion">
                    <th mat-header-cell *matHeaderCellDef>Descripción</th>
                    <td mat-cell *matCellDef="let resolucion">
                      {{ resolucion.descripcion }}
                    </td>
                  </ng-container>

                  <!-- Estado Column -->
                  <ng-container matColumnDef="estado">
                    <th mat-header-cell *matHeaderCellDef>Estado</th>
                    <td mat-cell *matCellDef="let resolucion">
                      <mat-chip [class]="'estado-' + resolucion.estado?.toLowerCase()">
                        {{ getEstadoDisplay(resolucion.estado) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Observaciones Column -->
                  <ng-container matColumnDef="observaciones">
                    <th mat-header-cell *matHeaderCellDef>Observaciones</th>
                    <td mat-cell *matCellDef="let resolucion">
                      @if (resolucion.observacionesList && resolucion.observacionesList.length > 0) {
                        <div class="observaciones-list">
                          @for (obs of resolucion.observacionesList; track obs) {
                            <span class="obs-badge">{{ obs }}</span>
                          }
                        </div>
                      } @else {
                        <span class="sin-datos">-</span>
                      }
                    </td>
                  </ng-container>

                  <!-- Eficacia Anticipada Column -->
                  <ng-container matColumnDef="eficaciaAnticipada">
                    <th mat-header-cell *matHeaderCellDef>Eficacia Anticipada</th>
                    <td mat-cell *matCellDef="let resolucion">
                      @if (resolucion.tieneEficaciaAnticipada) {
                        <span class="eficacia-si">Sí ({{ resolucion.diasEficaciaAnticipada }} días)</span>
                      } @else {
                        <span class="eficacia-no">No</span>
                      }
                    </td>
                  </ng-container>

                  <!-- Tipo Autorización Column -->
                  <ng-container matColumnDef="tipoAutorizacion">
                    <th mat-header-cell *matHeaderCellDef>Tipo Autorización</th>
                    <td mat-cell *matCellDef="let resolucion">
                      {{ resolucion.tipoAutorizacion || '-' }}
                    </td>
                  </ng-container>

                  <!-- Resoluciones Renovadas Column -->
                  <ng-container matColumnDef="resolucionesRenovadas">
                    <th mat-header-cell *matHeaderCellDef>Resoluciones Renovadas</th>
                    <td mat-cell *matCellDef="let resolucion">
                      @if (resolucion.resolucionesRenovadas && resolucion.resolucionesRenovadas.length > 0) {
                        <div class="renovadas-list">
                          @for (ren of resolucion.resolucionesRenovadas; track ren) {
                            <span class="renovada-badge">{{ ren }}</span>
                          }
                        </div>
                      } @else {
                        <span class="sin-datos">-</span>
                      }
                    </td>
                  </ng-container>

                  <!-- Acciones Column -->
                  <ng-container matColumnDef="acciones">
                    <th mat-header-cell *matHeaderCellDef>Acciones</th>
                    <td mat-cell *matCellDef="let resolucion">
                      <button mat-icon-button color="primary" (click)="verDetalle(resolucion.id)" title="Ver">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button color="accent" (click)="editarResolucion(resolucion.id)" title="Editar">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="eliminarResolucion(resolucion.id)" title="Eliminar">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>

              <mat-paginator
                [pageSizeOptions]="[10, 25, 50]"
                [pageSize]="pageSize()"
                [length]="resolucionesFiltradas().length"
                (page)="onPageChange($event)">
              </mat-paginator>
            </mat-card-content>
          </mat-card>
        }
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
      gap: 1.5rem;
    }

    .filters-card {
      .filters-row {
        display: flex;
        gap: 1rem;
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
      padding: 3rem;
      gap: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;

      .empty-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: #999;
        margin-bottom: 1rem;
      }
    }

    .table-card {
      .table-container {
        overflow-x: auto;
      }

      .resoluciones-table {
        width: 100%;

        th {
          font-weight: 600;
          background-color: #f5f5f5;
        }
      }
    }

    .hijas-list, .expedientes-list, .observaciones-list, .renovadas-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .hija-badge, .expediente-badge, .obs-badge, .renovada-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background-color: #e3f2fd;
      color: #1976d2;
      border-radius: 12px;
      font-size: 0.85rem;
    }

    .estado-vigente {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .estado-vencida {
      background-color: #ff9800 !important;
      color: white !important;
    }

    .estado-suspendida {
      background-color: #f44336 !important;
      color: white !important;
    }

    .estado-revocada {
      background-color: #9c27b0 !important;
      color: white !important;
    }

    .estado-dada_de_baja {
      background-color: #757575 !important;
      color: white !important;
    }

    .estado-renovada {
      background-color: #2196f3 !important;
      color: white !important;
    }

    .estado-anulada {
      background-color: #9e9e9e !important;
      color: white !important;
    }

    .eficacia-si {
      color: #4caf50;
      font-weight: 600;
    }

    .eficacia-no {
      color: #999;
    }

    .sin-datos {
      color: #999;
      font-style: italic;
    }
  `]
})
export class ResolucionesComponent implements OnInit {
  // Signals
  isLoading = signal(false);
  resoluciones = signal<Resolucion[]>([]);
  pageSize = signal(10);
  currentPage = signal(0);

  // Form Controls
  searchControl = new FormBuilder().control('');
  estadoControl = new FormBuilder().control('');

  // Computed
  resolucionesFiltradas = computed(() => {
    const search = this.searchControl.value?.toLowerCase() || '';
    const estado = this.estadoControl.value || '';

    return this.resoluciones()
      .filter(r => {
        const matchSearch = !search ||
          r.ruc.toLowerCase().includes(search) ||
          r.nroResolucion.toLowerCase().includes(search);

        const matchEstado = !estado || r.estado === estado;

        return matchSearch && matchEstado;
      })
      .slice(
        this.currentPage() * this.pageSize(),
        (this.currentPage() + 1) * this.pageSize()
      );
  });

  dataSource = new MatTableDataSource<Resolucion>();
  displayedColumns = [
    'ruc',
    'resolucionPadre',
    'resolucionHija',
    'fechaEmision',
    'fechaVigenciaInicio',
    'aniosVigencia',
    'fechaVigenciaFin',
    'expedientes',
    'tipoTramite',
    'descripcion',
    'estado',
    'observaciones',
    'eficaciaAnticipada',
    'tipoAutorizacion',
    'resolucionesRenovadas',
    'acciones'
  ];

  constructor(
    private resolucionService: ResolucionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    effect(() => {
      this.dataSource.data = this.resolucionesFiltradas();
    });
  }

  ngOnInit(): void {
    this.cargarResoluciones();
  }

  cargarResoluciones(): void {
    this.isLoading.set(true);
    this.resolucionService.getResoluciones().subscribe({
      next: (resoluciones) => {
        this.resoluciones.set(resoluciones);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando resoluciones:', error);
        this.snackBar.open('Error al cargar resoluciones', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.estadoControl.setValue('');
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  crearResolucion(): void {
    this.router.navigate(['/resoluciones/nueva']);
  }

  verDetalle(resolucionId: string): void {
    this.router.navigate(['/resoluciones', resolucionId]);
  }

  editarResolucion(resolucionId: string): void {
    this.router.navigate(['/resoluciones', resolucionId, 'editar']);
  }

  eliminarResolucion(resolucionId: string): void {
    if (confirm('¿Está seguro que desea eliminar esta resolución?')) {
      this.resolucionService.deleteResolucion(resolucionId).subscribe({
        next: () => {
          this.snackBar.open('Resolución eliminada', 'Cerrar', { duration: 3000 });
          this.cargarResoluciones();
        },
        error: (error) => {
          console.error('Error eliminando resolución:', error);
          this.snackBar.open('Error al eliminar resolución', 'Cerrar', { duration: 3000 });
        }
      });
    }
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

  async descargarPlantilla(): Promise<void> {
    try {
      this.isLoading.set(true);
      const response = await this.resolucionService.descargarPlantillaExcel().toPromise();
      
      if (response) {
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'plantilla-resoluciones.xlsx';
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
    // Implementar procesamiento de archivo Excel
    this.snackBar.open('Procesando archivo...', 'Cerrar', { duration: 3000 });
  }

  getTipoTramiteDisplay(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'AUTORIZACION_NUEVA': 'Autorización Nueva',
      'PRIMIGENIA': 'Primigenia',
      'RENOVACION': 'Renovación',
      'INCREMENTO': 'Incremento',
      'SUSTITUCION': 'Sustitución',
      'OTROS': 'Otros'
    };
    return tipos[tipo] || tipo;
  }

  getEstadoDisplay(estado: string): string {
    const estados: { [key: string]: string } = {
      'VIGENTE': 'Vigente',
      'VENCIDA': 'Vencida',
      'SUSPENDIDA': 'Suspendida',
      'REVOCADA': 'Revocada',
      'DADA_DE_BAJA': 'Dada de Baja',
      'RENOVADA': 'Renovada',
      'ANULADA': 'Anulada'
    };
    return estados[estado] || estado;
  }
}
