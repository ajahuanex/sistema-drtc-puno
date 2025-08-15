import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Ruta } from '../../models/ruta.model';

export interface IntercambioCodigosData {
  rutaOrigen: Ruta;
  rutasDisponibles: Ruta[];
}

@Component({
  selector: 'app-intercambio-codigos-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ],
  template: `
    <div class="modal-container">
      <mat-card class="modal-card">
        <mat-card-header>
          <mat-card-title>Intercambiar Código de Ruta</mat-card-title>
          <mat-card-subtitle>
            Ruta origen: {{ data.rutaOrigen.codigoRuta }} - {{ data.rutaOrigen.nombre }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <p class="instrucciones">
            Selecciona la ruta con la que quieres intercambiar el código:
          </p>
          
          <mat-list>
            @for (ruta of data.rutasDisponibles; track ruta.id) {
              <mat-list-item>
                <div class="ruta-item">
                  <div class="ruta-info">
                    <span class="codigo-actual">{{ ruta.codigoRuta }}</span>
                    <span class="nombre-ruta">{{ ruta.nombre }}</span>
                  </div>
                  <button mat-raised-button 
                          color="primary" 
                          (click)="seleccionarRuta(ruta)"
                          matTooltip="Intercambiar con esta ruta">
                    <mat-icon>swap_horiz</mat-icon>
                    Intercambiar
                  </button>
                </div>
              </mat-list-item>
            }
          </mat-list>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="cancelar()">Cancelar</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .modal-container {
      padding: 20px;
    }
    
    .modal-card {
      max-width: 500px;
      margin: 0 auto;
    }
    
    .instrucciones {
      margin-bottom: 20px;
      color: #666;
    }
    
    .ruta-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .ruta-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .codigo-actual {
      font-weight: bold;
      color: #1976d2;
      font-size: 16px;
    }
    
    .nombre-ruta {
      color: #333;
    }
    
    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 16px;
    }
  `]
})
export class IntercambioCodigosModalComponent {
  private dialogRef = inject(MatDialogRef<IntercambioCodigosModalComponent>);
  data = inject(MAT_DIALOG_DATA) as IntercambioCodigosData;

  seleccionarRuta(rutaDestino: Ruta): void {
    console.log('🔄 RUTA SELECCIONADA PARA INTERCAMBIO:', {
      origen: { id: this.data.rutaOrigen.id, codigoRuta: this.data.rutaOrigen.codigoRuta, nombre: this.data.rutaOrigen.nombre },
      destino: { id: rutaDestino.id, codigoRuta: rutaDestino.codigoRuta, nombre: rutaDestino.nombre }
    });
    
    this.dialogRef.close({ rutaDestino });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
} 