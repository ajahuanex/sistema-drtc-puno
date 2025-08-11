import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-ruta-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>{{ ruta()?.codigoRuta || 'Cargando...' }}</h1>
          <div class="header-subtitle">
            <span class="route-info">{{ ruta()?.origen || '...' }} → {{ ruta()?.destino || '...' }}</span>
            <span class="separator">•</span>
            <span class="estado" [class]="'estado-' + ruta()?.estado?.toLowerCase()">
              {{ getEstadoDisplayName(ruta()?.estado) }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-button color="accent" (click)="volver()" class="action-button">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
          <button mat-raised-button color="primary" (click)="editarRuta()" class="action-button">
            <mat-icon>edit</mat-icon>
            Editar
          </button>
        </div>
      </div>
    </div>

    <div class="content-section">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="60"></mat-spinner>
          <h3>Cargando ruta...</h3>
        </div>
      } @else if (!ruta()) {
        <div class="error-container">
          <mat-icon class="error-icon">error</mat-icon>
          <h3>Ruta no encontrada</h3>
          <p>La ruta que buscas no existe o ha sido eliminada.</p>
          <button mat-raised-button color="primary" (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
            Volver a Rutas
          </button>
        </div>
      } @else {
        <div class="content-container">
          <div class="info-grid">
            <!-- Información Básica -->
            <mat-card class="info-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>route</mat-icon>
                  Información Básica
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">Código de Ruta:</span>
                    <span class="info-value">{{ ruta()?.codigoRuta }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Origen:</span>
                    <span class="info-value">{{ ruta()?.origen }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Destino:</span>
                    <span class="info-value">{{ ruta()?.destino }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Distancia:</span>
                    <span class="info-value">{{ ruta()?.distancia }} km</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Tiempo Estimado:</span>
                    <span class="info-value">{{ ruta()?.tiempoEstimado }} horas</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Estado:</span>
                    <span class="info-value">
                      <mat-chip [class]="'estado-chip-' + ruta()?.estado?.toLowerCase()">
                        {{ getEstadoDisplayName(ruta()?.estado) }}
                      </mat-chip>
                    </span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Descripción -->
            @if (ruta()?.descripcion) {
              <mat-card class="info-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>description</mat-icon>
                    Descripción
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>{{ ruta()?.descripcion }}</p>
                </mat-card-content>
              </mat-card>
            }

            <!-- Observaciones -->
            @if (ruta()?.observaciones) {
              <mat-card class="info-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>note</mat-icon>
                    Observaciones
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>{{ ruta()?.observaciones }}</p>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .header-content {
      flex: 1;
    }

    .header-title {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .header-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
    }

    .header-subtitle {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #6c757d;
      font-size: 16px;
    }

    .separator {
      color: #dee2e6;
    }

    .estado {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .estado-activa {
      background-color: #d4edda;
      color: #155724;
    }

    .estado-inactiva {
      background-color: #f8d7da;
      color: #721c24;
    }

    .estado-suspendida {
      background-color: #fff3cd;
      color: #856404;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 4px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.2s ease-in-out;
    }

    .content-section {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 24px;
      text-align: center;
    }

    .loading-container h3 {
      margin: 24px 0 0 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 24px;
      text-align: center;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #dc3545;
      margin-bottom: 16px;
    }

    .error-container h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .error-container p {
      margin: 0 0 24px 0;
      color: #6c757d;
    }

    .content-container {
      padding: 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .info-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: none;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e9ecef;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #2c3e50;
    }

    .info-value {
      color: #6c757d;
      font-weight: 500;
    }

    .estado-chip-activa {
      background-color: #d4edda;
      color: #155724;
    }

    .estado-chip-inactiva {
      background-color: #f8d7da;
      color: #721c24;
    }

    .estado-chip-suspendida {
      background-color: #fff3cd;
      color: #856404;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .header-title h1 {
        font-size: 24px;
      }

      .header-subtitle {
        flex-direction: column;
        gap: 8px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RutaDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  // Signals
  ruta = signal<any>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    const rutaId = this.route.snapshot.params['id'];
    if (rutaId) {
      this.loadRuta(rutaId);
    }
  }

  loadRuta(id: string): void {
    this.isLoading.set(true);
    // TODO: Implementar carga de ruta desde el servicio
    setTimeout(() => {
      this.ruta.set({
        id: id,
        codigoRuta: 'RUT-001',
        origen: 'Puno',
        destino: 'Lima',
        distancia: 1500,
        tiempoEstimado: 24,
        estado: 'ACTIVA',
        descripcion: 'Ruta principal entre Puno y Lima',
        observaciones: 'Ruta con alta demanda'
      });
      this.isLoading.set(false);
    }, 1000);
  }

  getEstadoDisplayName(estado?: string): string {
    if (!estado) return 'Desconocido';
    
    const estados: { [key: string]: string } = {
      'ACTIVA': 'Activa',
      'INACTIVA': 'Inactiva',
      'SUSPENDIDA': 'Suspendida'
    };
    return estados[estado] || estado;
  }

  volver(): void {
    this.router.navigate(['/rutas']);
  }

  editarRuta(): void {
    if (this.ruta()) {
      this.router.navigate(['/rutas', this.ruta()?.id, 'editar']);
    }
  }
} 