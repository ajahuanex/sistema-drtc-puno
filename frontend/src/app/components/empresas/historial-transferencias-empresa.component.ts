import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { HistorialTransferenciaEmpresa, FiltroHistorialTransferenciaEmpresa, ResumenTransferenciasEmpresa, TipoTransferenciaVehiculo, EstadoTransferencia } from '../../models/historial-transferencia-empresa.model';
import { Empresa } from '../../models/empresa.model';
import { HistorialTransferenciaEmpresaService } from '../../services/historial-transferencia-empresa.service';
import { EmpresaService } from '../../services/empresa.service';

@Component({
  selector: 'app-historial-transferencias-empresa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  template: `
    <div class="historial-transferencias-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <mat-icon>swap_horiz</mat-icon>
              HISTORIAL DE TRANSFERENCIAS
            </h1>
            <p class="subtitle">
              {{ empresa()?.razonSocial?.principal || 'Empresa' }}
            </p>
          </div>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="volverAtras()">
              <mat-icon>arrow_back</mat-icon>
              VOLVER
            </button>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <mat-card class="filtros-card">
        <mat-card-content>
          <div class="filtros-grid">
            <mat-form-field appearance="outline">
              <mat-label>PLACA</mat-label>
              <input matInput [(ngModel)]="filtros.placa" placeholder="Buscar por placa...">
              <mat-icon matSuffix>directions_car</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>TIPO DE TRANSFERENCIA</mat-label>
              <mat-select [(ngModel)]="filtros.tipoTransferencia">
                <mat-option value="">Todos los tipos</mat-option>
                @for (tipo of tiposTransferencia; track tipo) {
                  <mat-option [value]="tipo">{{ tipo | titlecase }}</mat-option>
                }
              </mat-select>
              <mat-icon matSuffix>category</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>ESTADO</mat-label>
              <mat-select [(ngModel)]="filtros.estadoTransferencia">
                <mat-option value="">Todos los estados</mat-option>
                @for (estado of estadosTransferencia; track estado) {
                  <mat-option [value]="estado">{{ estado | titlecase }}</mat-option>
                }
              </mat-select>
              <mat-icon matSuffix>info</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>FECHA DESDE</mat-label>
              <input matInput [matDatepicker]="pickerDesde" [(ngModel)]="filtros.fechaDesde">
              <mat-datepicker-toggle matSuffix [for]="pickerDesde"></mat-datepicker-toggle>
              <mat-datepicker #pickerDesde></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>FECHA HASTA</mat-label>
              <input matInput [matDatepicker]="pickerHasta" [(ngModel)]="filtros.fechaHasta">
              <mat-datepicker-toggle matSuffix [for]="pickerHasta"></mat-datepicker-toggle>
              <mat-datepicker #pickerHasta></mat-datepicker>
            </mat-form-field>

            <div class="filtros-actions">
              <button mat-raised-button color="primary" (click)="aplicarFiltros()">
                <mat-icon>search</mat-icon>
                APLICAR FILTROS
              </button>
              <button mat-button (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                LIMPIAR
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Resumen -->
      @if (resumen()) {
        <mat-card class="resumen-card">
          <mat-card-content>
            <div class="resumen-grid">
              <div class="resumen-item">
                <div class="resumen-value total">{{ resumen()?.totalTransferencias || 0 }}</div>
                <div class="resumen-label">TOTAL TRANSFERENCIAS</div>
              </div>
              <div class="resumen-item">
                <div class="resumen-value pendientes">{{ resumen()?.transferenciasPendientes || 0 }}</div>
                <div class="resumen-label">PENDIENTES</div>
              </div>
              <div class="resumen-item">
                <div class="resumen-value aprobadas">{{ resumen()?.transferenciasAprobadas || 0 }}</div>
                <div class="resumen-label">APROBADAS</div>
              </div>
              <div class="resumen-item">
                <div class="resumen-value completadas">{{ resumen()?.transferenciasCompletadas || 0 }}</div>
                <div class="resumen-label">COMPLETADAS</div>
              </div>
              <div class="resumen-item">
                <div class="resumen-value vehiculos">{{ resumen()?.vehiculosTransferidos || 0 }}</div>
                <div class="resumen-label">VEHÍCULOS TRANSFERIDOS</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Tabla de Transferencias -->
      <mat-card class="tabla-card">
        <mat-card-content>
          @if (loading()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>CARGANDO TRANSFERENCIAS...</p>
            </div>
          } @else if (historial().length === 0) {
            <div class="empty-state">
              <mat-icon>swap_horiz</mat-icon>
              <h3>NO HAY TRANSFERENCIAS</h3>
              <p>No se encontraron transferencias con los filtros aplicados</p>
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="historial()" matSort>
                <!-- Fecha -->
                <ng-container matColumnDef="fechaTransferencia">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>FECHA</th>
                  <td mat-cell *matCellDef="let transferencia">
                    {{ transferencia.fechaTransferencia | date:'dd/MM/yyyy' }}
                  </td>
                </ng-container>

                <!-- Placa -->
                <ng-container matColumnDef="placa">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>PLACA</th>
                  <td mat-cell *matCellDef="let transferencia">
                    <span class="placa">{{ transferencia.placa }}</span>
                  </td>
                </ng-container>

                <!-- Tipo -->
                <ng-container matColumnDef="tipoTransferencia">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>TIPO</th>
                  <td mat-cell *matCellDef="let transferencia">
                    <mat-chip [class]="'tipo-' + transferencia.tipoTransferencia.toLowerCase()">
                      {{ transferencia.tipoTransferencia | titlecase }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Estado -->
                <ng-container matColumnDef="estadoTransferencia">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>ESTADO</th>
                  <td mat-cell *matCellDef="let transferencia">
                    <mat-chip [class]="'estado-' + transferencia.estadoTransferencia.toLowerCase()">
                      {{ transferencia.estadoTransferencia | titlecase }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Motivo -->
                <ng-container matColumnDef="motivo">
                  <th mat-header-cell *matHeaderCellDef>MOTIVO</th>
                  <td mat-cell *matCellDef="let transferencia">
                    <span class="motivo">{{ transferencia.motivo }}</span>
                  </td>
                </ng-container>

                <!-- Empresa Destino -->
                <ng-container matColumnDef="empresaDestino">
                  <th mat-header-cell *matHeaderCellDef>EMPRESA DESTINO</th>
                  <td mat-cell *matCellDef="let transferencia">
                    <span class="empresa-destino">{{ transferencia.empresaDestinoId }}</span>
                  </td>
                </ng-container>

                <!-- Archivos -->
                <ng-container matColumnDef="archivos">
                  <th mat-header-cell *matHeaderCellDef>ARCHIVOS</th>
                  <td mat-cell *matCellDef="let transferencia">
                    @if (transferencia.archivosSustentatorios?.length) {
                      <div class="archivos-info">
                        <mat-icon class="archivo-icon">attach_file</mat-icon>
                        <span class="archivo-count">{{ transferencia.archivosSustentatorios?.length || 0 }} archivo(s)</span>
                        <button mat-icon-button 
                                (click)="verArchivos(transferencia)"
                                color="primary"
                                matTooltip="Ver archivos">
                          <mat-icon>visibility</mat-icon>
                        </button>
                      </div>
                    } @else {
                      <span class="sin-archivos">Sin archivos</span>
                    }
                  </td>
                </ng-container>

                <!-- Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>ACCIONES</th>
                  <td mat-cell *matCellDef="let transferencia">
                    <button mat-icon-button [matMenuTriggerFor]="menu" color="primary">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="verDetalles(transferencia)">
                        <mat-icon>visibility</mat-icon>
                        VER DETALLES
                      </button>
                      @if (transferencia.estadoTransferencia === 'PENDIENTE') {
                        <button mat-menu-item (click)="aprobarTransferencia(transferencia)">
                          <mat-icon>check_circle</mat-icon>
                          APROBAR
                        </button>
                        <button mat-menu-item (click)="rechazarTransferencia(transferencia)">
                          <mat-icon>cancel</mat-icon>
                          RECHAZAR
                        </button>
                      }
                      @if (transferencia.estadoTransferencia === 'APROBADA') {
                        <button mat-menu-item (click)="completarTransferencia(transferencia)">
                          <mat-icon>done_all</mat-icon>
                          COMPLETAR
                        </button>
                      }
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="columnas"></tr>
                <tr mat-row *matRowDef="let row; columns: columnas;"></tr>
              </table>

              <!-- Paginación -->
              <mat-paginator 
                [length]="totalTransferencias()"
                [pageSize]="filtros.tamanoPagina || 10"
                [pageSizeOptions]="[5, 10, 25, 50]"
                (page)="cambiarPagina($event)"
                showFirstLastButtons>
              </mat-paginator>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./historial-transferencias-empresa.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorialTransferenciasEmpresaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private historialService = inject(HistorialTransferenciaEmpresaService);
  private empresaService = inject(EmpresaService);
  private snackBar = inject(MatSnackBar);

  // Signals
  empresa = signal<Empresa | null>(null);
  historial = signal<HistorialTransferenciaEmpresa[]>([]);
  resumen = signal<ResumenTransferenciasEmpresa | null>(null);
  loading = signal(false);
  totalTransferencias = signal(0);

  // Filtros
  filtros: FiltroHistorialTransferenciaEmpresa = {
    pagina: 1,
    tamanoPagina: 10
  };

  // Columnas de la tabla
  columnas = ['fechaTransferencia', 'placa', 'tipoTransferencia', 'estadoTransferencia', 'motivo', 'empresaDestino', 'archivos', 'acciones'];

  // Enums para filtros
  tiposTransferencia = Object.values(TipoTransferenciaVehiculo);
  estadosTransferencia = Object.values(EstadoTransferencia);

  ngOnInit(): void {
    const empresaId = this.route.snapshot.paramMap.get('id');
    if (empresaId) {
      this.cargarEmpresa(empresaId);
      this.cargarHistorial();
      this.cargarResumen();
    }
  }

  private cargarEmpresa(empresaId: string): void {
    this.empresaService.getEmpresa(empresaId).subscribe({
      next: (empresa: Empresa) => {
        this.empresa.set(empresa);
        this.filtros.empresaId = empresaId;
      },
      error: (error: any) => {
        console.error('Error al cargar empresa::', error);
        this.snackBar.open('Error al cargar empresa', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private cargarHistorial(): void {
    this.loading.set(true);
    this.historialService.obtenerHistorialEmpresa(this.filtros.empresaId!, this.filtros).subscribe({
      next: (historial: HistorialTransferenciaEmpresa[]) => {
        this.historial.set(historial);
        this.totalTransferencias.set(historial.length);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error al cargar historial::', error);
        this.snackBar.open('Error al cargar historial', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  private cargarResumen(): void {
    this.historialService.obtenerResumenTransferencias(this.filtros.empresaId!).subscribe({
      next: (resumen: ResumenTransferenciasEmpresa) => {
        this.resumen.set(resumen);
      },
      error: (error: any) => {
        console.error('Error al cargar resumen::', error);
      }
    });
  }

  aplicarFiltros(): void {
    this.filtros.pagina = 1;
    this.cargarHistorial();
  }

  limpiarFiltros(): void {
    this.filtros = {
      empresaId: this.filtros.empresaId,
      pagina: 1,
      tamanoPagina: 10
    };
    this.cargarHistorial();
  }

  cambiarPagina(event: PageEvent): void {
    this.filtros.pagina = event.pageIndex + 1;
    this.filtros.tamanoPagina = event.pageSize;
    this.cargarHistorial();
  }

  verDetalles(transferencia: HistorialTransferenciaEmpresa): void {
    // Navegar al detalle de la transferencia
    this.router.navigate(['/transferencias', transferencia.id]);
  }

  verArchivos(transferencia: HistorialTransferenciaEmpresa): void {
    if (transferencia.archivosSustentatorios?.length) {
      // Mostrar modal con archivos
      this.mostrarModalArchivos(transferencia);
    }
  }

  private mostrarModalArchivos(transferencia: HistorialTransferenciaEmpresa): void {
    // TODO: Implementar modal para mostrar archivos
    // console.log removed for production
    this.snackBar.open(
      `${transferencia.archivosSustentatorios?.length} archivo(s) disponibles`, 
      'Cerrar', 
      { duration: 3000 }
    );
  }

  aprobarTransferencia(transferencia: HistorialTransferenciaEmpresa): void {
    this.historialService.aprobarTransferencia(transferencia.id).subscribe({
      next: () => {
        this.snackBar.open('Transferencia aprobada exitosamente', 'Cerrar', { duration: 3000 });
        this.cargarHistorial();
        this.cargarResumen();
      },
      error: (error: any) => {
        console.error('Error al aprobar transferencia::', error);
        this.snackBar.open('Error al aprobar transferencia', 'Cerrar', { duration: 3000 });
      }
    });
  }

  rechazarTransferencia(transferencia: HistorialTransferenciaEmpresa): void {
    const motivo = prompt('Ingrese el motivo del rechazo:');
    if (motivo) {
      this.historialService.rechazarTransferencia(transferencia.id, motivo).subscribe({
        next: () => {
          this.snackBar.open('Transferencia rechazada exitosamente', 'Cerrar', { duration: 3000 });
          this.cargarHistorial();
          this.cargarResumen();
        },
        error: (error: any) => {
          console.error('Error al rechazar transferencia::', error);
          this.snackBar.open('Error al rechazar transferencia', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  completarTransferencia(transferencia: HistorialTransferenciaEmpresa): void {
    this.historialService.completarTransferencia(transferencia.id).subscribe({
      next: () => {
        this.snackBar.open('Transferencia completada exitosamente', 'Cerrar', { duration: 3000 });
        this.cargarHistorial();
        this.cargarResumen();
      },
      error: (error: any) => {
        console.error('Error al completar transferencia::', error);
        this.snackBar.open('Error al completar transferencia', 'Cerrar', { duration: 3000 });
      }
    });
  }

  volverAtras(): void {
    this.router.navigate(['/empresas', this.filtros.empresaId]);
  }
} 