import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { signal, computed } from '@angular/core';

export interface TipoRuta {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  estaActivo: boolean;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="configuracion-container">
      <div class="page-header">
        <div>
          <h1>Configuración del Sistema</h1>
          <p>Gestionar parámetros y configuraciones del sistema</p>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab label="Tipos de Ruta">
          <div class="tab-content">
            <div class="tab-header">
              <h2>Tipos de Ruta</h2>
              <button mat-raised-button 
                      color="primary" 
                      (click)="agregarTipoRuta()">
                <mat-icon>add</mat-icon>
                Agregar Tipo
              </button>
            </div>

            <mat-table [dataSource]="tiposRuta()" class="config-table">
              <ng-container matColumnDef="codigo">
                <mat-header-cell *matHeaderCellDef>Código</mat-header-cell>
                <mat-cell *matCellDef="let tipo">{{ tipo.codigo }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="nombre">
                <mat-header-cell *matHeaderCellDef>Nombre</mat-header-cell>
                <mat-cell *matCellDef="let tipo">{{ tipo.nombre }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="descripcion">
                <mat-header-cell *matHeaderCellDef>Descripción</mat-header-cell>
                <mat-cell *matCellDef="let tipo">{{ tipo.descripcion }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="estado">
                <mat-header-cell *matHeaderCellDef>Estado</mat-header-cell>
                <mat-cell *matCellDef="let tipo">
                  <span class="estado-badge" [class.activo]="tipo.estaActivo">
                    {{ tipo.estaActivo ? 'Activo' : 'Inactivo' }}
                  </span>
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <mat-header-cell *matHeaderCellDef>Acciones</mat-header-cell>
                <mat-cell *matCellDef="let tipo">
                  <button mat-icon-button 
                          color="primary" 
                          (click)="editarTipoRuta(tipo)"
                          matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button 
                          [color]="tipo.estaActivo ? 'warn' : 'primary'"
                          (click)="toggleEstadoTipoRuta(tipo)"
                          [matTooltip]="tipo.estaActivo ? 'Desactivar' : 'Activar'">
                    <mat-icon>{{ tipo.estaActivo ? 'block' : 'check_circle' }}</mat-icon>
                  </button>
                </mat-cell>
              </ng-container>

              <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
              <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
            </mat-table>
          </div>
        </mat-tab>

        <mat-tab label="Otros Parámetros">
          <div class="tab-content">
            <h2>Otros Parámetros del Sistema</h2>
            <p>Configuración adicional del sistema (en desarrollo)</p>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  tiposRuta = signal<TipoRuta[]>([
    { id: '1', codigo: 'INTERPROVINCIAL', nombre: 'Interprovincial', descripcion: 'Rutas entre provincias', estaActivo: true },
    { id: '2', codigo: 'INTERURBANA', nombre: 'Interurbana', descripcion: 'Rutas entre ciudades', estaActivo: true },
    { id: '3', codigo: 'URBANA', nombre: 'Urbana', descripcion: 'Rutas dentro de la ciudad', estaActivo: true },
    { id: '4', codigo: 'RURAL', nombre: 'Rural', descripcion: 'Rutas rurales', estaActivo: true }
  ]);

  displayedColumns = ['codigo', 'nombre', 'descripcion', 'estado', 'acciones'];

  agregarTipoRuta(): void {
    // TODO: Implementar modal para agregar tipo de ruta
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }

  editarTipoRuta(tipo: TipoRuta): void {
    // TODO: Implementar modal para editar tipo de ruta
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }

  toggleEstadoTipoRuta(tipo: TipoRuta): void {
    tipo.estaActivo = !tipo.estaActivo;
    this.tiposRuta.update(tipos => [...tipos]);
    
    const mensaje = tipo.estaActivo ? 'activado' : 'desactivado';
    this.snackBar.open(`Tipo de ruta ${mensaje} exitosamente`, 'Cerrar', { duration: 3000 });
  }
}