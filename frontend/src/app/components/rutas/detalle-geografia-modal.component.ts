import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-detalle-geografia-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    MatCardModule
  ],
  template: `
    <div class="detalle-geografia-modal">
      <h2 mat-dialog-title>
        <mat-icon>map</mat-icon>
        Distribución Geográfica Detallada
      </h2>
      
      <mat-dialog-content>
        <div class="geografia-detalle">
          <div class="resumen-header">
            <div class="stat-item">
              <span class="label">Total de Provincias:</span>
              <span class="value">{{ data.provincias.length }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Total de Rutas:</span>
              <span class="value">{{ data.totalRutas }}</span>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <div class="provincias-detalle">
            @for (provincia of data.provincias; track provincia.nombre; let i = $index) {
              <mat-card class="provincia-card">
                <mat-card-header>
                  <div class="provincia-header-detalle">
                    <div class="provincia-info">
                      <h3>{{ provincia.nombre }}</h3>
                      @if (provincia.coordenadas) {
                        <div class="coordenadas-info">
                          <mat-icon>place</mat-icon>
                          <span>{{ provincia.coordenadas.lat.toFixed(4) }}, {{ provincia.coordenadas.lng.toFixed(4) }}</span>
                        </div>
                      }
                    </div>
                    <div class="provincia-stats">
                      <div class="stat-big">{{ provincia.total }}</div>
                      <div class="stat-label">rutas</div>
                      <div class="porcentaje">{{ provincia.porcentaje.toFixed(1) }}%</div>
                    </div>
                  </div>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="localidades-en-provincia">
                    <h4>Localidades en esta provincia ({{ provincia.localidades.length }}):</h4>
                    <div class="localidades-grid">
                      @for (localidad of provincia.localidades; track localidad.nombre) {
                        <div class="localidad-chip">
                          <span class="localidad-nombre">{{ localidad.nombre }}</span>
                          <span class="localidad-count">{{ localidad.cantidad }}</span>
                        </div>
                      }
                    </div>
                  </div>
                  
                  <div class="provincia-progress-detalle">
                    <mat-progress-bar 
                      mode="determinate" 
                      [value]="provincia.porcentaje"
                      color="primary">
                    </mat-progress-bar>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="cerrar()">
          <mat-icon>close</mat-icon>
          Cerrar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .detalle-geografia-modal {
      min-width: 700px;
      max-width: 900px;
    }
    
    .geografia-detalle {
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .resumen-header {
      display: flex;
      justify-content: space-around;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    
    .stat-item .label {
      color: #666;
      font-size: 14px;
    }
    
    .stat-item .value {
      font-size: 24px;
      font-weight: 700;
      color: #2196F3;
    }
    
    .provincias-detalle {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }
    
    .provincia-card {
      border-left: 4px solid #2196F3;
    }
    
    .provincia-header-detalle {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }
    
    .provincia-info h3 {
      margin: 0;
      color: #333;
      font-size: 18px;
    }
    
    .coordenadas-info {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
      color: #4CAF50;
      font-size: 12px;
      font-weight: 500;
    }
    
    .coordenadas-info mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    
    .provincia-stats {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .stat-big {
      font-size: 32px;
      font-weight: 700;
      color: #2196F3;
      line-height: 1;
    }
    
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .porcentaje {
      font-size: 14px;
      font-weight: 600;
      color: #FF9800;
    }
    
    .localidades-en-provincia h4 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 14px;
    }
    
    .localidades-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .localidad-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 16px;
      font-size: 12px;
    }
    
    .localidad-nombre {
      color: #333;
    }
    
    .localidad-count {
      background: #2196F3;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
    }
    
    .provincia-progress-detalle {
      margin-top: 8px;
    }
    
    mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class DetalleGeografiaModalComponent {
  constructor(
    private dialogRef: MatDialogRef<DetalleGeografiaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      provincias: Array<{
        nombre: string, 
        total: number, 
        porcentaje: number, 
        localidades: Array<{nombre: string, cantidad: number}>,
        coordenadas?: {lat: number, lng: number}
      }>,
      totalRutas: number
    }
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }
}