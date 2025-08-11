import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'info' | 'error';
}

@Component({
  selector: 'app-mat-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <mat-icon [class]="getIconClass()">{{ getIcon() }}</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button 
          mat-raised-button 
          [color]="getConfirmButtonColor()"
          (click)="confirm()">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 400px;
      max-width: 500px;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .dialog-header mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .dialog-header h2 {
      margin: 0;
      color: #2c3e50;
    }
    
    mat-dialog-content p {
      margin: 0;
      color: #6c757d;
      line-height: 1.5;
    }
    
    mat-dialog-actions {
      padding: 16px 0 0 0;
      gap: 8px;
    }
    
    .warning-icon {
      color: #f39c12;
    }
    
    .info-icon {
      color: #3498db;
    }
    
    .error-icon {
      color: #e74c3c;
    }
  `]
})
export class MatConfirmDialogComponent {
  private dialogRef = inject(MatDialogRef<MatConfirmDialogComponent>);
  protected data: ConfirmDialogData = inject(MAT_DIALOG_DATA);

  confirm(): void {
    this.dialogRef.close(true);
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info': 
      default: return 'info';
    }
  }

  getIconClass(): string {
    switch (this.data.type) {
      case 'warning': return 'warning-icon';
      case 'error': return 'error-icon';
      case 'info': 
      default: return 'info-icon';
    }
  }

  getConfirmButtonColor(): string {
    switch (this.data.type) {
      case 'warning': return 'warn';
      case 'error': return 'warn';
      case 'info': 
      default: return 'primary';
    }
  }
} 