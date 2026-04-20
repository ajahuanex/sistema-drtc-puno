import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';

interface MapeoColumnasData {
  columnas: string[];
  datos: any[];
}

@Component({
  selector: 'app-mapeo-columnas-preview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTabsModule,
    MatCardModule
  ],
  template: `
    <div class="mapeo-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>settings</mat-icon>
          Mapeo de Columnas y Preview
        </h2>
        <button mat-icon-button (click)="cerrar()" [disabled]="false">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <mat-tab-group>
          <!-- Tab 1: Mapeo de Columnas -->
          <mat-tab label="Mapeo de Columnas">
            <div class="tab-content">
              <div class="mapeo-container">
                <h3>Selecciona qué columna corresponde a cada campo:</h3>
                
                <div class="mapeo-grid">
                  <div class="mapeo-item">
                    <label>Nombre *</label>
                    <mat-form-field appearance="outline">
                      <mat-label>Columna para Nombre</mat-label>
                      <mat-select [(ngModel)]="mapeo.nombre">
                        <mat-option value="">-- Seleccionar --</mat-option>
                        @for (col of data.columnas; track col) {
                          <mat-option [value]="col">{{ col }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="mapeo-item">
                    <label>Tipo *</label>
                    <mat-form-field appearance="outline">
                      <mat-label>Columna para Tipo</mat-label>
                      <mat-select [(ngModel)]="mapeo.tipo">
                        <mat-option value="">-- Seleccionar --</mat-option>
                        @for (col of data.columnas; track col) {
                          <mat-option [value]="col">{{ col }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="mapeo-item">
                    <label>UBIGEO</label>
                    <mat-form-field appearance="outline">
                      <mat-label>Columna para UBIGEO</mat-label>
                      <mat-select [(ngModel)]="mapeo.ubigeo">
                        <mat-option value="">-- Seleccionar --</mat-option>
                        @for (col of data.columnas; track col) {
                          <mat-option [value]="col">{{ col }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="mapeo-item">
                    <label>Provincia</label>
                    <mat-form-field appearance="outline">
                      <mat-label>Columna para Provincia</mat-label>
                      <mat-select [(ngModel)]="mapeo.provincia">
                        <mat-option value="">-- Seleccionar --</mat-option>
                        @for (col of data.columnas; track col) {
                          <mat-option [value]="col">{{ col }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="mapeo-item">
                    <label>Distrito</label>
                    <mat-form-field appearance="outline">
                      <mat-label>Columna para Distrito</mat-label>
                      <mat-select [(ngModel)]="mapeo.distrito">
                        <mat-option value="">-- Seleccionar --</mat-option>
                        @for (col of data.columnas; track col) {
                          <mat-option [value]="col">{{ col }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="mapeo-item">
                    <label>Coordenadas (Lat)</label>
                    <mat-form-field appearance="outline">
                      <mat-label>Columna para Latitud</mat-label>
                      <mat-select [(ngModel)]="mapeo.latitud">
                        <mat-option value="">-- Seleccionar --</mat-option>
                        @for (col of data.columnas; track col) {
                          <mat-option [value]="col">{{ col }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="mapeo-item">
                    <label>Coordenadas (Lon)</label>
                    <mat-form-field appearance="outline">
                      <mat-label>Columna para Longitud</mat-label>
                      <mat-select [(ngModel)]="mapeo.longitud">
                        <mat-option value="">-- Seleccionar --</mat-option>
                        @for (col of data.columnas; track col) {
                          <mat-option [value]="col">{{ col }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>

                <div class="validacion-mapeo">
                  @if (mapeo.nombre && mapeo.tipo) {
                    <div class="validacion-ok">
                      <mat-icon>check_circle</mat-icon>
                      <span>Campos obligatorios mapeados correctamente</span>
                    </div>
                  } @else {
                    <div class="validacion-error">
                      <mat-icon>error</mat-icon>
                      <span>Debes mapear al menos Nombre y Tipo</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 2: Preview por Tipo -->
          <mat-tab label="Preview de Datos">
            <div class="tab-content">
              <mat-tab-group>
                <mat-tab label="Provincias">
                  <div class="preview-tabla">
                    <table class="datos-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Tipo</th>
                          <th>UBIGEO</th>
                          <th>Provincia</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (row of getPreviewPorTipo('PROVINCIA'); track row.nombre) {
                          <tr>
                            <td>{{ row.nombre }}</td>
                            <td>{{ row.tipo }}</td>
                            <td>{{ row.ubigeo || 'N/A' }}</td>
                            <td>{{ row.provincia || 'N/A' }}</td>
                          </tr>
                        }
                        @if (getPreviewPorTipo('PROVINCIA').length === 0) {
                          <tr>
                            <td colspan="4" class="sin-datos">No hay provincias en el preview</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </mat-tab>

                <mat-tab label="Distritos">
                  <div class="preview-tabla">
                    <table class="datos-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Tipo</th>
                          <th>Provincia</th>
                          <th>UBIGEO</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (row of getPreviewPorTipo('DISTRITO'); track row.nombre) {
                          <tr>
                            <td>{{ row.nombre }}</td>
                            <td>{{ row.tipo }}</td>
                            <td>{{ row.provincia || 'N/A' }}</td>
                            <td>{{ row.ubigeo || 'N/A' }}</td>
                          </tr>
                        }
                        @if (getPreviewPorTipo('DISTRITO').length === 0) {
                          <tr>
                            <td colspan="4" class="sin-datos">No hay distritos en el preview</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </mat-tab>

                <mat-tab label="Centros Poblados">
                  <div class="preview-tabla">
                    <table class="datos-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Tipo</th>
                          <th>Distrito</th>
                          <th>Provincia</th>
                          <th>UBIGEO</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (row of getPreviewPorTipo('CENTRO_POBLADO'); track row.nombre) {
                          <tr>
                            <td>{{ row.nombre }}</td>
                            <td>{{ row.tipo }}</td>
                            <td>{{ row.distrito || 'N/A' }}</td>
                            <td>{{ row.provincia || 'N/A' }}</td>
                            <td>{{ row.ubigeo || 'N/A' }}</td>
                          </tr>
                        }
                        @if (getPreviewPorTipo('CENTRO_POBLADO').length === 0) {
                          <tr>
                            <td colspan="5" class="sin-datos">No hay centros poblados en el preview</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </mat-tab>
              </mat-tab-group>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button mat-button (click)="cerrar()">Cancelar</button>
        <button mat-raised-button color="primary" (click)="confirmar()" [disabled]="!mapeo.nombre || !mapeo.tipo">
          <mat-icon>check</mat-icon>
          Confirmar Mapeo
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .mapeo-dialog {
      width: 900px;
      max-width: 95vw;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;

      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }
    }

    mat-dialog-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .tab-content {
      padding: 16px 0;
    }

    .mapeo-container {
      h3 {
        margin: 0 0 20px 0;
        font-size: 16px;
        font-weight: 500;
      }

      .mapeo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin-bottom: 20px;

        .mapeo-item {
          display: flex;
          flex-direction: column;
          gap: 8px;

          label {
            font-weight: 600;
            font-size: 13px;
            color: #333;
          }

          mat-form-field {
            width: 100%;
          }
        }
      }

      .validacion-mapeo {
        padding: 12px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 8px;

        .validacion-ok {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #e8f5e9;
          color: #2e7d32;
          padding: 12px;
          border-radius: 8px;
          width: 100%;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }

        .validacion-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffebee;
          color: #c62828;
          padding: 12px;
          border-radius: 8px;
          width: 100%;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }
      }
    }

    .preview-tabla {
      margin: 16px 0;
      overflow-x: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;

      .datos-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;

        thead {
          background: #f5f5f5;
          border-bottom: 2px solid #e0e0e0;

          th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
          }
        }

        tbody {
          tr {
            border-bottom: 1px solid #e0e0e0;

            &:hover {
              background: #f9f9f9;
            }

            td {
              padding: 10px 12px;
              color: #666;

              &.sin-datos {
                text-align: center;
                color: #999;
                font-style: italic;
              }
            }
          }
        }
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      justify-content: flex-end;
      gap: 12px;
    }
  `]
})
export class MapeoColumnasPreviewComponent {
  private dialogRef = inject(MatDialogRef<MapeoColumnasPreviewComponent>);
  data = inject(MAT_DIALOG_DATA) as MapeoColumnasData;

  mapeo = {
    nombre: '',
    tipo: '',
    ubigeo: '',
    provincia: '',
    distrito: '',
    latitud: '',
    longitud: ''
  };

  getPreviewPorTipo(tipo: string) {
    return this.data.datos
      .filter(row => {
        const rowTipo = this.mapeo.tipo ? row[this.mapeo.tipo] : '';
        return rowTipo.toUpperCase().includes(tipo);
      })
      .map(row => ({
        nombre: this.mapeo.nombre ? row[this.mapeo.nombre] : 'N/A',
        tipo: this.mapeo.tipo ? row[this.mapeo.tipo] : 'N/A',
        ubigeo: this.mapeo.ubigeo ? row[this.mapeo.ubigeo] : '',
        provincia: this.mapeo.provincia ? row[this.mapeo.provincia] : '',
        distrito: this.mapeo.distrito ? row[this.mapeo.distrito] : ''
      }))
      .slice(0, 5);
  }

  confirmar() {
    this.dialogRef.close(this.mapeo);
  }

  cerrar() {
    this.dialogRef.close();
  }
}
