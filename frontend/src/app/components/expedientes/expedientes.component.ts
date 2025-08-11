import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExpedienteService } from '../../services/expediente.service';
import { Expediente } from '../../models/expediente.model';

@Component({
  selector: 'app-expedientes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  template: `
    <div class="expedientes-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>folder</mat-icon>
            Gestión de Expedientes
          </mat-card-title>
          <mat-card-subtitle>
            Administra todos los expedientes del sistema
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Filtros -->
          <div class="filtros-container">
            <mat-form-field appearance="outline" class="filtro-field">
              <mat-label>Buscar por número</mat-label>
              <input matInput [(ngModel)]="filtroNumero" placeholder="E-0001-2025">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="filtro-field">
              <mat-label>Tipo de Trámite</mat-label>
              <mat-select [(ngModel)]="filtroTipoTramite">
                <mat-option value="">Todos</mat-option>
                <mat-option value="AUTORIZACION NUEVA">AUTORIZACION NUEVA</mat-option>
                <mat-option value="RENOVACION">RENOVACION</mat-option>
                <mat-option value="INCREMENTO">INCREMENTO</mat-option>
                <mat-option value="SUSTITUCION">SUSTITUCION</mat-option>
                <mat-option value="OTROS">OTROS</mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="filtro-field">
              <mat-label>Estado</mat-label>
              <mat-select [(ngModel)]="filtroEstado">
                <mat-option value="">Todos</mat-option>
                <mat-option value="EN PROCESO">EN PROCESO</mat-option>
                <mat-option value="APROBADO">APROBADO</mat-option>
                <mat-option value="RECHAZADO">RECHAZADO</mat-option>
                <mat-option value="ARCHIVADO">ARCHIVADO</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Tabla de Expedientes -->
          <div class="table-container">
            <table mat-table [dataSource]="expedientesFiltrados()" class="expedientes-table">
              <!-- Número de Expediente -->
              <ng-container matColumnDef="nroExpediente">
                <th mat-header-cell *matHeaderCellDef>Número</th>
                <td mat-cell *matCellDef="let expediente">
                  <strong>{{ expediente.nroExpediente }}</strong>
                </td>
              </ng-container>

              <!-- Fecha de Emisión -->
              <ng-container matColumnDef="fechaEmision">
                <th mat-header-cell *matHeaderCellDef>Fecha Emisión</th>
                <td mat-cell *matCellDef="let expediente">
                  {{ expediente.fechaEmision | date:'dd/MM/yyyy' }}
                </td>
              </ng-container>

              <!-- Tipo de Trámite -->
              <ng-container matColumnDef="tipoTramite">
                <th mat-header-cell *matHeaderCellDef>Tipo de Trámite</th>
                <td mat-cell *matCellDef="let expediente">
                  <mat-chip [class]="'tipo-chip-' + expediente.tipoTramite.toLowerCase().replace(' ', '-')">
                    {{ expediente.tipoTramite }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Empresa ID -->
              <ng-container matColumnDef="empresaId">
                <th mat-header-cell *matHeaderCellDef>Empresa ID</th>
                <td mat-cell *matCellDef="let expediente">
                  {{ expediente.empresaId }}
                </td>
              </ng-container>

              <!-- Estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let expediente">
                  <mat-chip [class]="'estado-chip-' + expediente.estado.toLowerCase().replace(' ', '-')">
                    {{ expediente.estado }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Acciones -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let expediente">
                  <button mat-icon-button color="primary" (click)="verDetalle(expediente.id)" matTooltip="Ver detalle">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button color="accent" (click)="editar(expediente.id)" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="eliminar(expediente.id)" matTooltip="Eliminar">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columnas"></tr>
              <tr mat-row *matRowDef="let row; columns: columnas;"></tr>
            </table>
          </div>

          <!-- Mensaje cuando no hay expedientes -->
          @if (expedientesFiltrados().length === 0) {
            <div class="no-data">
              <mat-icon>inbox</mat-icon>
              <p>No se encontraron expedientes</p>
            </div>
          }
        </mat-card-content>
        
        <mat-card-actions align="end">
          <button mat-raised-button color="primary" (click)="nuevoExpediente()">
            <mat-icon>add</mat-icon>
            Nuevo Expediente
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .expedientes-container {
      padding: 20px;
    }
    
    .filtros-container {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .filtro-field {
      min-width: 200px;
    }
    
    .table-container {
      margin: 20px 0;
      overflow-x: auto;
    }
    
    .expedientes-table {
      width: 100%;
    }
    
    .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    .tipo-chip-AUTORIZACION-NUEVA {
      background-color: #4caf50;
      color: white;
    }
    
    .tipo-chip-RENOVACION {
      background-color: #2196f3;
      color: white;
    }
    
    .tipo-chip-INCREMENTO {
      background-color: #ff9800;
      color: white;
    }
    
    .tipo-chip-SUSTITUCION {
      background-color: #9c27b0;
      color: white;
    }
    
    .tipo-chip-OTROS {
      background-color: #607d8b;
      color: white;
    }
    
    .estado-chip-EN-PROCESO {
      background-color: #ffc107;
      color: black;
    }
    
    .estado-chip-APROBADO {
      background-color: #4caf50;
      color: white;
    }
    
    .estado-chip-RECHAZADO {
      background-color: #f44336;
      color: white;
    }
    
    .estado-chip-ARCHIVADO {
      background-color: #9e9e9e;
      color: white;
    }
  `]
})
export class ExpedientesComponent {
  private expedienteService = inject(ExpedienteService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Signals
  expedientes = signal<Expediente[]>([]);
  
  // Filtros
  filtroNumero = '';
  filtroTipoTramite = '';
  filtroEstado = '';

  // Columnas de la tabla
  columnas = ['nroExpediente', 'fechaEmision', 'tipoTramite', 'empresaId', 'estado', 'acciones'];

  // Expedientes filtrados
  expedientesFiltrados = computed(() => {
    let expedientes = this.expedientes();
    
    if (this.filtroNumero) {
      expedientes = expedientes.filter(e => 
        e.nroExpediente.toLowerCase().includes(this.filtroNumero.toLowerCase())
      );
    }
    
    if (this.filtroTipoTramite) {
      expedientes = expedientes.filter(e => e.tipoTramite === this.filtroTipoTramite);
    }
    
    if (this.filtroEstado) {
      expedientes = expedientes.filter(e => e.estado === this.filtroEstado);
    }
    
    return expedientes;
  });

  constructor() {
    this.cargarExpedientes();
  }

  private cargarExpedientes(): void {
    this.expedienteService.getExpedientes().subscribe({
      next: (expedientes) => {
        this.expedientes.set(expedientes);
      },
      error: (error) => {
        console.error('Error al cargar expedientes:', error);
        this.snackBar.open('Error al cargar expedientes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  nuevoExpediente(): void {
    this.router.navigate(['/expedientes/nuevo']);
  }

  verDetalle(id: string): void {
    this.router.navigate(['/expedientes', id]);
  }

  editar(id: string): void {
    this.router.navigate(['/expedientes', id, 'editar']);
  }

  eliminar(id: string): void {
    if (confirm('¿Está seguro de que desea eliminar este expediente?')) {
      this.expedienteService.deleteExpediente(id).subscribe({
        next: () => {
          this.snackBar.open('Expediente eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.cargarExpedientes();
        },
        error: (error) => {
          console.error('Error al eliminar expediente:', error);
          this.snackBar.open('Error al eliminar expediente', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
} 