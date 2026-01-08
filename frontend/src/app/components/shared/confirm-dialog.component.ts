import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancel?: string;
  tipo?: 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog">
      <div mat-dialog-title class="dialog-header" [class]="'dialog-' + (data.tipo || 'info')">
        <mat-icon class="dialog-icon">
          {{ getIcon() }}
        </mat-icon>
        <h2>{{ data.titulo }}</h2>
      </div>

      <div mat-dialog-content class="dialog-content">
        <p>{{ data.mensaje }}</p>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">
          {{ data.textoCancel || 'Cancelar' }}
        </button>
        
        <button mat-raised-button 
                [color]="getButtonColor()"
                (click)="onConfirm()">
          {{ data.textoConfirmar || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 0 16px 0;
        border-bottom: 1px solid #e0e0e0;

        &.dialog-warning {
          color: #ff9800;
        }

        &.dialog-danger {
          color: #f44336;
        }

        &.dialog-info {
          color: #2196f3;
        }

        .dialog-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        h2 {
          margin: 0;
          font-weight: 500;
        }
      }

      .dialog-content {
        padding: 20px 0;

        p {
          margin: 0;
          line-height: 1.5;
          color: #666;
        }
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 0 0 0;
        border-top: 1px solid #e0e0e0;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getIcon(): string {
    switch (this.data.tipo) {
      case 'warning': return 'warning';
      case 'danger': return 'error';
      case 'info': 
      default: return 'help';
    }
  }

  getButtonColor(): string {
    switch (this.data.tipo) {
      case 'warning': return 'accent';
      case 'danger': return 'warn';
      case 'info':
      default: return 'primary';
    }
  }
}