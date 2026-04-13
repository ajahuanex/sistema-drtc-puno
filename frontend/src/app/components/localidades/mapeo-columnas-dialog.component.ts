import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';

interface MapeoColumnas {
  nombre: string;
  ubigeo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  tipo?: string;
}

@Component({
  selector: 'app-mapeo-columnas-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatTableModule,
    FormsModule
  ],
  template: `
    <div class="mapeo-dialog">
      <h2 mat-dialog-title>Mapear Columnas del GeoJSON</h2>
      
      <mat-dialog-content>
        <p class="instrucciones">Selecciona qué columna del archivo corresponde a cada campo:</p>
        
        <div class="mapeo-form">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <mat-select [(ngModel)]="mapeo.nombre">
              <mat-option *ngFor="let col of columnasDisponibles" [value]="col">
                {{ col }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>UBIGEO</mat-label>
            <mat-select [(ngModel)]="mapeo.ubigeo">
              <mat-option *ngFor="let col of columnasDisponibles" [value]="col">
                {{ col }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Departamento</mat-label>
            <mat-select [(ngModel)]="mapeo.departamento">
              <mat-option *ngFor="let col of columnasDisponibles" [value]="col">
                {{ col }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Provincia</mat-label>
            <mat-select [(ngModel)]="mapeo.provincia">
              <mat-option *ngFor="let col of columnasDisponibles" [value]="col">
                {{ col }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Distrito</mat-label>
            <mat-select [(ngModel)]="mapeo.distrito">
              <mat-option *ngFor="let col of columnasDisponibles" [value]="col">
                {{ col }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tipo (Opcional)</mat-label>
            <mat-select [(ngModel)]="mapeo.tipo">
              <mat-option value="">Ninguno</mat-option>
              <mat-option *ngFor="let col of columnasDisponibles" [value]="col">
                {{ col }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="preview">
          <h3>Vista Previa (primeros 3 registros):</h3>
          <table mat-table [dataSource]="datosPreview" class="preview-table">
            <ng-container *ngFor="let col of columnasDisponibles" [matColumnDef]="col">
              <th mat-header-cell *matHeaderCellDef>{{ col }}</th>
              <td mat-cell *matCellDef="let element">{{ element[col] }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columnasDisponibles"></tr>
            <tr mat-row *matRowDef="let row; columns: columnasDisponibles;"></tr>
          </table>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button mat-button (click)="cancelar()">Cancelar</button>
        <button mat-raised-button color="primary" (click)="confirmar()">Confirmar Mapeo</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .mapeo-dialog {
      width: 600px;
      max-width: 90vw;
    }

    .instrucciones {
      margin-bottom: 20px;
      color: #666;
    }

    .mapeo-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;

      mat-form-field {
        width: 100%;
      }
    }

    .preview {
      margin-top: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;

      h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 500;
      }

      .preview-table {
        width: 100%;
        font-size: 12px;
        max-height: 300px;
        overflow-y: auto;
      }
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      justify-content: flex-end;
      gap: 12px;
    }
  `]
})
export class MapeoColumnasDialogComponent {
  mapeo: MapeoColumnas;
  columnasDisponibles: string[] = [];
  datosPreview: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<MapeoColumnasDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { columnas: string[]; datos: any[] }
  ) {
    this.columnasDisponibles = data.columnas;
    this.datosPreview = data.datos.slice(0, 3);
    
    // Mapeo por defecto (intenta adivinar)
    this.mapeo = {
      nombre: this.encontrarColumna(['nombre', 'name', 'NOMBRE', 'NAME', 'NOMB_CCPP', 'NOMBPROV', 'DISTRITO']),
      ubigeo: this.encontrarColumna(['ubigeo', 'UBIGEO', 'IDCCPP', 'IDPROV']),
      departamento: this.encontrarColumna(['departamento', 'DEPARTAMENTO', 'DEPARTAMEN']),
      provincia: this.encontrarColumna(['provincia', 'PROVINCIA', 'NOMB_PROVI', 'NOMBPROV']),
      distrito: this.encontrarColumna(['distrito', 'DISTRITO', 'NOMB_DISTR']),
      tipo: this.encontrarColumna(['tipo', 'TIPO', 'type', 'TYPE'])
    };
  }

  private encontrarColumna(posibles: string[]): string {
    for (const posible of posibles) {
      if (this.columnasDisponibles.find(c => c.toUpperCase() === posible.toUpperCase())) {
        return this.columnasDisponibles.find(c => c.toUpperCase() === posible.toUpperCase())!;
      }
    }
    return this.columnasDisponibles[0] || '';
  }

  cancelar() {
    this.dialogRef.close();
  }

  confirmar() {
    this.dialogRef.close(this.mapeo);
  }
}
