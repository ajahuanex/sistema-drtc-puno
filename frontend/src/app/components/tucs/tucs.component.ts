import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tucs',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Gestión de TUCs</mat-card-title>
        <mat-card-subtitle>Tarjetas Únicas de Circulación</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="placeholder-content">
          <mat-icon class="placeholder-icon">receipt</mat-icon>
          <h3>Módulo en Desarrollo</h3>
          <p>El sistema de gestión de TUCs estará disponible próximamente.</p>
          <p>Incluirá:</p>
          <ul>
            <li>Generación de TUCs</li>
            <li>Control de vigencia</li>
            <li>Verificación por QR</li>
            <li>Historial de cambios</li>
          </ul>
        </div>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-raised-button color="primary" routerLink="/dashboard">
          <mat-icon>arrow_back</mat-icon>
          Volver al Dashboard
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .placeholder-content {
      text-align: center;
      padding: 40px 20px;
    }

    .placeholder-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #1976d2;
      margin-bottom: 20px;
    }

    .placeholder-content h3 {
      color: #333;
      margin-bottom: 10px;
    }

    .placeholder-content p {
      color: #666;
      margin-bottom: 15px;
    }

    .placeholder-content ul {
      text-align: left;
      max-width: 400px;
      margin: 0 auto;
      color: #666;
    }

    .placeholder-content li {
      margin-bottom: 8px;
    }

    mat-card-actions {
      padding: 16px;
      text-align: center;
    }
  `]
})
export class TucsComponent {
  // Componente placeholder para TUCs
} 