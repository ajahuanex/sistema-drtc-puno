import { Component, Inject, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { CrearResolucionComponent } from './crear-resolucion.component';

export interface CrearResolucionModalData {
  empresa?: any; // Empresa seleccionada (opcional)
  esResolucionHija?: boolean; // Si es resolución hija
  resolucionPadreId?: string; // ID de la resolución padre
}

@Component({
  selector: 'app-crear-resolucion-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    CrearResolucionComponent
  ],
  template: `
    <div class="modal-container">
      <!-- Header del Modal -->
      <div class="modal-header">
        <h2 mat-dialog-title>
          @if (data.empresa) {
            Crear Resolución para {{ data.empresa.razonSocial.principal | uppercase }}
          } @else {
            Crear Nueva Resolución
          }
        </h2>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Contenido del Modal -->
      <div class="modal-content">
        <app-crear-resolucion 
          [empresaId]="data.empresa?.id"
          [esResolucionHija]="data.esResolucionHija"
          [resolucionPadreId]="data.resolucionPadreId"
          (resolucionCreada)="onResolucionCreada($event)">
        </app-crear-resolucion>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      min-width: 800px;
      max-width: 1200px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      margin: 0;
      color: #1976d2;
      font-size: 1.5rem;
      text-transform: uppercase;
      font-weight: 600;
    }

    .close-button {
      color: #666;
    }

    .modal-content {
      padding: 24px;
    }

    @media (max-width: 768px) {
      .modal-container {
        min-width: 100vw;
        max-width: 100vw;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrearResolucionModalComponent {
  private dialogRef = inject(MatDialogRef<CrearResolucionModalComponent>);
  protected data = inject(MAT_DIALOG_DATA);

  onResolucionCreada(resolucion: any): void {
    this.dialogRef.close(resolucion);
  }
} 