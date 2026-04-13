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
        <div class="contenedor-principal">
          <!-- Columnas disponibles -->
          <div class="columnas-disponibles">
            <h3>Columnas Disponibles en el Archivo:</h3>
            <div class="lista-columnas">
              <div *ngFor="let col of columnasDisponibles" class="columna-item">
                <span class="columna-nombre">{{ col }}</span>
                <span class="columna-ejemplo">{{ datosPreview[0]?.[col] }}</span>
              </div>
            </div>
          </div>

          <!-- Mapeo de columnas -->
          <div class="mapeo-form">
            <h3>Mapear Campos:</h3>
            
            <div class="campo-mapeo">
              <label>Nombre *</label>
              <mat-select [(ngModel)]="mapeo.nombre" class="select-mapeo">
                <mat-option *ngFor="let col of columnasDisponibles" [value]="col">
                  {{ col }}
                </mat-option>
              </mat-select>
              <small class="valor-actual">Valor: {{ datosPreview[0]?.[mapeo.nombre] }}</small>
            </div>

            <div class="campo-mapeo">
              <label>UBIGEO *</label>
              <mat-select [(ngModel)]="mapeo.ubigeo" class="select-mapeo">
                <mat-option *ngFor="let col of columnasDisponibles" [value]="col">
                  {{ col }}
                </mat-option>
              </mat-select>
              <small class="valor-actual">Valor: {{ datosPreview[0]?.[mapeo.ubigeo] }}</small>
            </div>

            <div class="campo-mapeo">
              <label>Departamento *</label>
              <mat-select [(ngModel)]="mapeo.departamento" class="select-mapeo">
                <mat-option *ngFor="let col of columnasDisponibles" [value]="col">
                  {{ col }}
                </mat-option>
              </mat-select>
              <small class="valor-actual">Valor: {{ datosPreview[0]?.[mapeo.departamento] }}</small>
            </div>

            <div class="campo-mapeo">
              <label>Provincia *</label>
              <mat-select [(ngModel)]="mapeo.provincia" class="select-mapeo">
                <mat-option *ngFor="let col of columnasDisponibles" [value]="col">
                  {{ col }}
                </mat-option>
              </mat-select>
              <small class="valor-actual">Valor: {{ datosPreview[0]?.[mapeo.provincia] }}</small>
            </div>

            <div class="campo-mapeo">
              <label>Distrito *</label>
              <mat-select [(ngModel)]="mapeo.distrito" class="select-mapeo">
                <mat-option *ngFor="let col of columnasDisponibles" [value]="col">
                  {{ col }}
                </mat-option>
              </mat-select>
              <small class="valor-actual">Valor: {{ datosPreview[0]?.[mapeo.distrito] }}</small>
            </div>

            <div class="campo-mapeo">
              <label>Tipo (Opcional)</label>
              <mat-select [(ngModel)]="mapeo.tipo" class="select-mapeo">
                <mat-option value="">Ninguno</mat-option>
                <mat-option *ngFor="let col of columnasDisponibles" [value]="col">
                  {{ col }}
                </mat-option>
              </mat-select>
              <small class="valor-actual" *ngIf="mapeo.tipo">Valor: {{ datosPreview[0]?.[mapeo.tipo] }}</small>
            </div>
          </div>
        </div>

        <!-- Vista previa de datos -->
        <div class="preview">
          <h3>Vista Previa (primeros 3 registros):</h3>
          <div class="preview-scroll">
            <table mat-table [dataSource]="datosPreview" class="preview-table">
              <ng-container *ngFor="let col of columnasDisponibles" [matColumnDef]="col">
                <th mat-header-cell *matHeaderCellDef>{{ col }}</th>
                <td mat-cell *matCellDef="let element">{{ element[col] }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columnasDisponibles"></tr>
              <tr mat-row *matRowDef="let row; columns: columnasDisponibles;"></tr>
            </table>
          </div>
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
      width: 900px;
      max-width: 95vw;
      max-height: 90vh;
    }

    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-height: calc(90vh - 150px);
      overflow-y: auto;
    }

    .contenedor-principal {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .columnas-disponibles {
      h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
      }

      .lista-columnas {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 8px;
        max-height: 400px;
        overflow-y: auto;

        .columna-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #2196f3;
          font-size: 12px;

          .columna-nombre {
            font-weight: 600;
            color: #333;
          }

          .columna-ejemplo {
            color: #999;
            font-size: 11px;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }

    .mapeo-form {
      h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
      }

      display: flex;
      flex-direction: column;
      gap: 12px;

      .campo-mapeo {
        display: flex;
        flex-direction: column;
        gap: 4px;

        label {
          font-size: 12px;
          font-weight: 600;
          color: #333;
        }

        .select-mapeo {
          width: 100%;
        }

        .valor-actual {
          font-size: 11px;
          color: #999;
          padding: 4px 0;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .preview {
      h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
      }

      .preview-scroll {
        overflow-x: auto;
        border: 1px solid #e0e0e0;
        border-radius: 8px;

        .preview-table {
          width: 100%;
          font-size: 11px;
          background: white;

          th {
            background: #f5f5f5;
            font-weight: 600;
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
          }

          td {
            padding: 8px;
            border-bottom: 1px solid #f0f0f0;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          tr:hover {
            background: #fafafa;
          }
        }
      }
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid #e0e0e0;
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
