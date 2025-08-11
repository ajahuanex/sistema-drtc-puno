import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-rutas',
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
    <div class="rutas-container">
      <div class="page-header">
        <div class="header-content">
          <div class="header-title">
            <h1>Gestión de Rutas</h1>
          </div>
          <p class="header-subtitle">Administración de rutas autorizadas</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="nuevaRuta()">
            <mat-icon>add</mat-icon>
            Nueva Ruta
          </button>
        </div>
      </div>

      <div class="content-section">
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="60"></mat-spinner>
            <h3>Cargando rutas...</h3>
          </div>
        }

        @if (!isLoading() && rutas().length === 0) {
          <div class="empty-state">
            <mat-icon>route</mat-icon>
            <h3>No hay rutas registradas</h3>
            <p>Comienza agregando la primera ruta al sistema</p>
            <button mat-raised-button color="primary" (click)="nuevaRuta()">
              <mat-icon>add</mat-icon>
              Agregar Primera Ruta
            </button>
          </div>
        }

        @if (!isLoading() && rutas().length > 0) {
          <mat-card>
            <mat-card-content>
              <table mat-table [dataSource]="rutas()" class="rutas-table">
                <ng-container matColumnDef="codigoRuta">
                  <th mat-header-cell *matHeaderCellDef>Código</th>
                  <td mat-cell *matCellDef="let ruta">{{ ruta.codigoRuta }}</td>
                </ng-container>

                <ng-container matColumnDef="origen">
                  <th mat-header-cell *matHeaderCellDef>Origen</th>
                  <td mat-cell *matCellDef="let ruta">{{ ruta.origen }}</td>
                </ng-container>

                <ng-container matColumnDef="destino">
                  <th mat-header-cell *matHeaderCellDef>Destino</th>
                  <td mat-cell *matCellDef="let ruta">{{ ruta.destino }}</td>
                </ng-container>

                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="status-chip" [class]="'status-' + ruta.estado?.toLowerCase()">
                      {{ ruta.estado }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let ruta">
                    <button mat-icon-button color="primary" (click)="verRuta(ruta.id)" matTooltip="Ver detalles">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    <button mat-icon-button color="accent" (click)="editarRuta(ruta.id)" matTooltip="Editar">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="eliminarRuta(ruta.id)" matTooltip="Eliminar">
                      <mat-icon>delete</mat-icon>
                    </button>
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
    .rutas-container {
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

    .rutas-table {
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

    .status-activa {
      background: #d4edda;
      color: #155724;
    }

    .status-inactiva {
      background: #f8d7da;
      color: #721c24;
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
    }
  `]
})
export class RutasComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  rutas = signal<any[]>([]);
  isLoading = signal(false);
  displayedColumns = ['codigoRuta', 'origen', 'destino', 'estado', 'acciones'];

  ngOnInit(): void {
    this.cargarRutas();
  }

  private cargarRutas(): void {
    this.isLoading.set(true);
    // TODO: Implementar carga de rutas desde servicio
    setTimeout(() => {
      this.rutas.set([
        {
          id: '1',
          codigoRuta: 'RUTA-001',
          origen: 'Puno',
          destino: 'Juliaca',
          estado: 'ACTIVA'
        },
        {
          id: '2',
          codigoRuta: 'RUTA-002',
          origen: 'Juliaca',
          destino: 'Arequipa',
          estado: 'ACTIVA'
        }
      ]);
      this.isLoading.set(false);
    }, 1000);
  }

  nuevaRuta(): void {
    this.router.navigate(['/rutas/nuevo']);
  }

  verRuta(id: string): void {
    this.router.navigate(['/rutas', id]);
  }

  editarRuta(id: string): void {
    this.router.navigate(['/rutas', id, 'editar']);
  }

  eliminarRuta(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta ruta? Esta acción no se puede deshacer.')) {
      // TODO: Implementar eliminación
      this.snackBar.open('Ruta eliminada exitosamente', 'Cerrar', { duration: 3000 });
      this.cargarRutas();
    }
  }
} 