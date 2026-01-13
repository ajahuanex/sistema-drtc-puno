import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

export interface ConfirmarEliminacionBloqueData {
  tipo: string;
  cantidad: number;
  elementos: string[];
}

@Component({
  selector: 'app-confirmar-eliminacion-bloque-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon color="warn">warning</mat-icon>
        Confirmar Eliminación en Bloque
      </h2>
    </div>

    <mat-dialog-content class="modal-content">
      <div class="warning-message">
        <p>¿Está seguro de que desea eliminar <strong>{{ data.cantidad }}</strong> {{ data.tipo }}?</p>
        <p class="warning-text">Esta acción no se puede deshacer.</p>
      </div>

      <div class="elementos-lista" *ngIf="data.elementos.length <= 10">
        <h4>{{ data.tipo | titlecase }} a eliminar:</h4>
        <mat-list>
          <mat-list-item *ngFor="let elemento of data.elementos">
            <mat-icon matListItemIcon color="warn">delete</mat-icon>
            <span matListItemTitle>{{ elemento }}</span>
          </mat-list-item>
        </mat-list>
      </div>

      <div class="elementos-resumen" *ngIf="data.elementos.length > 10">
        <h4>{{ data.tipo | titlecase }} a eliminar:</h4>
        <p>Se eliminarán {{ data.cantidad }} elementos. Los primeros 5 son:</p>
        <mat-list>
          <mat-list-item *ngFor="let elemento of data.elementos.slice(0, 5)">
            <mat-icon matListItemIcon color="warn">delete</mat-icon>
            <span matListItemTitle>{{ elemento }}</span>
          </mat-list-item>
          <mat-list-item>
            <span matListItemTitle>... y {{ data.cantidad - 5 }} más</span>
          </mat-list-item>
        </mat-list>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button mat-button (click)="cancelar()">
        <mat-icon>cancel</mat-icon>
        Cancelar
      </button>
      <button mat-raised-button color="warn" (click)="confirmar()">
        <mat-icon>delete</mat-icon>
        Eliminar {{ data.cantidad }} {{ data.tipo }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .modal-header {
      padding: 20px 24px 0;
      
      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        color: #d32f2f;
        font-weight: 500;
      }
    }

    .modal-content {
      padding: 20px 24px;
      max-height: 400px;
      overflow-y: auto;
    }

    .warning-message {
      margin-bottom: 20px;
      
      p {
        margin: 8px 0;
        font-size: 16px;
      }
      
      .warning-text {
        color: #d32f2f;
        font-weight: 500;
        font-size: 14px;
      }
    }

    .elementos-lista,
    .elementos-resumen {
      h4 {
        margin: 0 0 12px 0;
        color: #333;
        font-size: 14px;
        font-weight: 500;
      }
      
      mat-list {
        padding: 0;
        
        mat-list-item {
          height: 40px;
          font-size: 13px;
          
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }
    }

    .modal-actions {
      padding: 12px 24px 20px;
      justify-content: flex-end;
      gap: 12px;
      
      button {
        display: flex;
        align-items: center;
        gap: 8px;
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }
  `]
})
export class ConfirmarEliminacionBloqueModalComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmarEliminacionBloqueModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmarEliminacionBloqueData
  ) {}

  cancelar(): void {
    this.dialogRef.close(false);
  }

  confirmar(): void {
    this.dialogRef.close(true);
  }
}