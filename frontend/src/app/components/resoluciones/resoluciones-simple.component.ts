import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ResolucionService } from '../../services/resolucion.service';
import { ResolucionFiltros } from '../../models/resolucion-table.model';
import { ResolucionesFiltersSimpleComponent } from '../../shared/resoluciones-filters-simple.component';

/**
 * Componente SIMPLIFICADO de resoluciones
 * Elimina complejidades innecesarias y se enfoca en funcionalidad básica
 */
@Component({
  selector: 'app-resoluciones-simple',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    ResolucionesFiltersSimpleComponent
  ],
  template: `
    <div class="resoluciones-container">
      
      <!-- Header simple -->
      <div class="page-header">
        <div>
          <h1>Resoluciones</h1>
          <p>{{ resoluciones().length }} resolución(es) registrada(s)</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="nuevaResolucion()">
            <mat-icon>add</mat-icon>
            Nueva Resolución
          </button>
        </div>
      </div>

      <!-- Filtros simplificados -->
      <app-resoluciones-filters-simple
        [filtros]="filtrosActuales()"
        (filtrosChange)="onFiltrosChange($event)"
        (limpiarTodosFiltros)="onLimpiarFiltros()">
      </app-resoluciones-filters-simple>

      <!-- Tabla simple -->
      <mat-card>
        <mat-card-content>
          @if (isLoading()) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Cargando resoluciones...</p>
            </div>
          } @else if (resolucionesFiltradas().length > 0) {
            <div class="table-container">
              <table mat-table [dataSource]="resolucionesFiltradas()" class="resoluciones-table">
                
                <!-- Número de Resolución -->
                <ng-container matColumnDef="numero">
                  <th mat-header-cell *matHeaderCellDef>Número</th>
                  <td mat-cell *matCellDef="let resolucion">
                    <strong>{{ resolucion.nroResolucion }}</strong>
                  </td>
                </ng-container>

                <!-- Empresa -->
                <ng-container matColumnDef="empresa">
                  <th mat-header-cell *matHeaderCellDef>Empresa</th>
                  <td mat-cell *matCellDef="let resolucion">
                    <div class="empresa-info">
                      <div class="empresa-nombre">{{ resolucion.empresa?.razonSocial || 'Sin empresa' }}</div>
                      <div class="empresa-ruc">{{ resolucion.empresa?.ruc || '' }}</div>
                    </div>
                  </td>
                </ng-container>

                <!-- Tipo -->
                <ng-container matColumnDef="tipo">
                  <th mat-header-cell *matHeaderCellDef>Tipo</th>
                  <td mat-cell *matCellDef="let resolucion">
                    <span class="tipo-badge" [class]="'tipo-' + resolucion.tipoTramite.toLowerCase()">
                      {{ resolucion.tipoTramite }}
                    </span>
                  </td>
                </ng-container>

                <!-- Estado -->
                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let resolucion">
                    <span class="estado-badge" [class]="'estado-' + resolucion.estado.toLowerCase()">
                      {{ resolucion.estado }}
                    </span>
                  </td>
                </ng-container>

                <!-- Fecha -->
                <ng-container matColumnDef="fecha">
                  <th mat-header-cell *matHeaderCellDef>Fecha Emisión</th>
                  <td mat-cell *matCellDef="let resolucion">
                    {{ resolucion.fechaEmision | date:'dd/MM/yyyy' }}
                  </td>
                </ng-container>

                <!-- Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let resolucion">
                    <button mat-icon-button (click)="verResolucion(resolucion.id)" matTooltip="Ver">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    <button mat-icon-button (click)="editarResolucion(resolucion.id)" matTooltip="Editar">
                      <mat-icon>edit</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          } @else {
            <div class="empty-state">
              <mat-icon>description</mat-icon>
              <h3>No hay resoluciones</h3>
              <p>No se encontraron resoluciones con los filtros aplicados</p>
              <button mat-raised-button color="primary" (click)="nuevaResolucion()">
                <mat-icon>add</mat-icon>
                Agregar Primera Resolución
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .resoluciones-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
    }

    .page-header p {
      margin: 0;
      opacity: 0.8;
      font-size: 14px;
    }

    .header-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      gap: 16px;
    }

    .table-container {
      overflow-x: auto;
    }

    .resoluciones-table {
      width: 100%;
    }

    .empresa-info {
      display: flex;
      flex-direction: column;
    }

    .empresa-nombre {
      font-weight: 500;
      font-size: 14px;
    }

    .empresa-ruc {
      font-size: 12px;
      color: #666;
    }

    .tipo-badge, .estado-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .tipo-primigenia {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .tipo-renovacion {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .tipo-modificacion {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .estado-vigente {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .estado-vencida {
      background-color: #ffebee;
      color: #c62828;
    }

    .estado-anulada {
      background-color: #f5f5f5;
      color: #616161;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #666;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      color: #999;
    }

    .empty-state button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .resoluciones-container {
        padding: 12px;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ResolucionesSimpleComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private resolucionService = inject(ResolucionService);

  // Signals para estado
  resoluciones = signal<any[]>([]);
  resolucionesFiltradas = signal<any[]>([]);
  isLoading = signal(false);
  filtrosActuales = signal<ResolucionFiltros>({});

  // Columnas de la tabla
  displayedColumns = ['numero', 'empresa', 'tipo', 'estado', 'fecha', 'acciones'];

  ngOnInit(): void {
    this.cargarResoluciones();
  }

  private cargarResoluciones(): void {
    this.isLoading.set(true);
    
    this.resolucionService.getResolucionesConEmpresa().subscribe({
      next: (resoluciones) => {
        console.log('📋 Resoluciones cargadas:', resoluciones.length);
        this.resoluciones.set(resoluciones);
        this.resolucionesFiltradas.set(resoluciones);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error al cargar resoluciones:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error al cargar resoluciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onFiltrosChange(filtros: ResolucionFiltros): void {
    console.log('🔍 Aplicando filtros:', filtros);
    this.filtrosActuales.set(filtros);
    this.aplicarFiltros(filtros);
  }

  onLimpiarFiltros(): void {
    console.log('🧹 Limpiando filtros');
    this.filtrosActuales.set({});
    this.resolucionesFiltradas.set(this.resoluciones());
  }

  private aplicarFiltros(filtros: ResolucionFiltros): void {
    let resolucionesFiltradas = [...this.resoluciones()];

    // Filtro por número
    if (filtros.numeroResolucion) {
      const busqueda = filtros.numeroResolucion.toLowerCase();
      resolucionesFiltradas = resolucionesFiltradas.filter(r => 
        r.nroResolucion?.toLowerCase().includes(busqueda)
      );
    }

    // Filtro por estado
    if (filtros.estados?.length) {
      resolucionesFiltradas = resolucionesFiltradas.filter(r => 
        filtros.estados!.includes(r.estado)
      );
    }

    // Filtro por tipo
    if (filtros.tiposTramite?.length) {
      resolucionesFiltradas = resolucionesFiltradas.filter(r => 
        filtros.tiposTramite!.includes(r.tipoTramite)
      );
    }

    this.resolucionesFiltradas.set(resolucionesFiltradas);
    
    // Feedback
    if (resolucionesFiltradas.length === 0 && Object.keys(filtros).length > 0) {
      this.snackBar.open('No se encontraron resultados', 'Cerrar', { duration: 2000 });
    }
  }

  // Navegación
  nuevaResolucion(): void {
    this.router.navigate(['/resoluciones/nuevo']);
  }

  verResolucion(id: string): void {
    this.router.navigate(['/resoluciones', id]);
  }

  editarResolucion(id: string): void {
    this.router.navigate(['/resoluciones', id, 'editar']);
  }
}