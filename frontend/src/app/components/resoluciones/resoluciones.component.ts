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
import { Resolucion } from '../../models/resolucion.model';

@Component({
  selector: 'app-resoluciones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="resoluciones-container">
      <div class="page-header">
        <div class="header-content">
          <div class="header-title">
            <h1>Gestión de Resoluciones</h1>
          </div>
          <p class="header-subtitle">Administración de resoluciones autorizadas</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="nuevaResolucion()" class="new-resolution-btn">
            <mat-icon>add_circle</mat-icon>
            Nueva Resolución
          </button>
          <button mat-raised-button color="warn" (click)="cargaMasivaResoluciones()" class="bulk-upload-btn">
            <mat-icon>upload_file</mat-icon>
            Carga Masiva
          </button>
        </div>
      </div>

      <div class="content-section">
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="60"></mat-spinner>
            <h3>Cargando resoluciones...</h3>
          </div>
        }

        @if (!isLoading() && resoluciones().length === 0) {
          <div class="empty-state">
            <mat-icon>description</mat-icon>
            <h3>No hay resoluciones registradas</h3>
            <p>Comienza agregando la primera resolución al sistema</p>
            <button mat-raised-button color="primary" (click)="nuevaResolucion()" class="first-resolution-btn">
              <mat-icon>add_circle</mat-icon>
              Agregar Primera Resolución
            </button>
          </div>
        }

        @if (!isLoading() && resoluciones().length > 0) {
          <mat-card>
            <mat-card-content>
              <table mat-table [dataSource]="resoluciones()" class="resoluciones-table">
                <ng-container matColumnDef="numero">
                  <th mat-header-cell *matHeaderCellDef>Número</th>
                  <td mat-cell *matCellDef="let resolucion">{{ resolucion.nroResolucion }}</td>
                </ng-container>

                <ng-container matColumnDef="tipo">
                  <th mat-header-cell *matHeaderCellDef>Tipo</th>
                  <td mat-cell *matCellDef="let resolucion">{{ resolucion.tipoTramite }}</td>
                </ng-container>

                <ng-container matColumnDef="descripcion">
                  <th mat-header-cell *matHeaderCellDef>Descripción</th>
                  <td mat-cell *matCellDef="let resolucion">{{ resolucion.descripcion }}</td>
                </ng-container>

                <ng-container matColumnDef="fechaEmision">
                  <th mat-header-cell *matHeaderCellDef>Fecha Emisión</th>
                  <td mat-cell *matCellDef="let resolucion">{{ resolucion.fechaEmision | date:'dd/MM/yyyy' }}</td>
                </ng-container>

                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let resolucion">
                    <span class="status-chip" [class]="'status-' + resolucion.estado?.toLowerCase()">
                      {{ resolucion.estado }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let resolucion">
                    <div class="action-buttons">
                      <button 
                        mat-icon-button 
                        color="primary" 
                        (click)="verResolucion(resolucion.id)" 
                        matTooltip="Ver detalles de la resolución"
                        class="action-btn view-btn">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button 
                        mat-icon-button 
                        color="accent" 
                        (click)="editarResolucion(resolucion.id)" 
                        matTooltip="Editar resolución"
                        class="action-btn edit-btn">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button 
                        mat-icon-button 
                        color="warn" 
                        (click)="eliminarResolucion(resolucion.id)" 
                        matTooltip="Eliminar resolución"
                        class="action-btn delete-btn">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .resoluciones-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .header-content {
      flex: 1;
    }

    .header-title h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
    }

    .header-subtitle {
      margin: 0;
      color: #6c757d;
      font-size: 16px;
    }

    .header-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-weight: 600;
    }

    .content-section {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      text-align: center;
    }

    .loading-container h3 {
      margin: 24px 0 0 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #6c757d;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      color: #6c757d;
    }

    .resoluciones-table {
      width: 100%;
    }

    .status-chip {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-vigente {
      background: #d4edda;
      color: #155724;
    }

    .status-suspendida {
      background: #f8d7da;
      color: #721c24;
    }

    .status-vencida {
      background: #fff3cd;
      color: #856404;
    }

    .status-revocada {
      background: #f8d7da;
      color: #721c24;
    }

    .status-dada_de_baja {
      background: #6c757d;
      color: #ffffff;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;
    }

    .action-btn {
      transition: all 0.2s ease;
      border-radius: 8px;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }

    .view-btn {
      background-color: #e3f2fd;
      color: #1976d2;
      
      &:hover {
        background-color: #bbdefb;
      }
    }

    .edit-btn {
      background-color: #f3e5f5;
      color: #7b1fa2;
      
      &:hover {
        background-color: #e1bee7;
      }
    }

    .delete-btn {
      background-color: #ffebee;
      color: #d32f2f;
      
      &:hover {
        background-color: #ffcdd2;
      }
    }

    .new-resolution-btn, .first-resolution-btn {
      transition: all 0.3s ease;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(25, 118, 210, 0.3);
      }
      
      mat-icon {
        margin-right: 8px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .header-title h1 {
        font-size: 24px;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions button {
        width: 100%;
      }

      .action-buttons {
        flex-direction: column;
        gap: 4px;
      }

      .action-btn {
        width: 100%;
        height: 40px;
      }
    }
  `]
})
export class ResolucionesComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private resolucionService = inject(ResolucionService);

  resoluciones = signal<Resolucion[]>([]);
  isLoading = signal(false);
  displayedColumns = ['numero', 'tipo', 'descripcion', 'fechaEmision', 'estado', 'acciones'];

  ngOnInit(): void {
    this.cargarResoluciones();
  }

  private cargarResoluciones(): void {
    this.isLoading.set(true);
    this.resolucionService.getResoluciones().subscribe({
      next: (resoluciones) => {
        console.log('Resoluciones recibidas:', resoluciones);
        console.log('Primera resolución:', resoluciones[0]);
        if (resoluciones.length > 0) {
          console.log('Campo nroResolucion:', resoluciones[0].nroResolucion);
          console.log('Campo numero:', (resoluciones[0] as any).numero);
        }
        this.resoluciones.set(resoluciones);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading resoluciones:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error al cargar las resoluciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  nuevaResolucion(): void {
    this.router.navigate(['/resoluciones/nuevo']);
  }

  cargaMasivaResoluciones(): void {
    this.router.navigate(['/resoluciones/carga-masiva']);
  }

  verResolucion(id: string): void {
    this.router.navigate(['/resoluciones', id]);
  }

  editarResolucion(id: string): void {
    this.router.navigate(['/resoluciones', id, 'editar']);
  }

  eliminarResolucion(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta resolución? Esta acción no se puede deshacer.')) {
      this.resolucionService.deleteResolucion(id).subscribe({
        next: () => {
          this.snackBar.open('Resolución eliminada exitosamente', 'Cerrar', { duration: 3000 });
          this.cargarResoluciones();
        },
        error: (error) => {
          console.error('Error deleting resolucion:', error);
          this.snackBar.open('Error al eliminar la resolución', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
} 