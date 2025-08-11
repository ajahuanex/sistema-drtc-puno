import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ResolucionService } from '../../services/resolucion.service';
import { Resolucion } from '../../models/resolucion.model';

@Component({
  selector: 'app-resolucion-detail',
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
          <h1>{{ resolucion()?.nroResolucion || 'Cargando...' }}</h1>
          <div class="header-subtitle">
            <span class="tipo-info">{{ getTipoDisplayName(resolucion()?.tipoTramite) }}</span>
            <span class="separator">•</span>
            <span class="estado" [class]="'estado-' + resolucion()?.estado?.toLowerCase()">
              {{ getEstadoDisplayName(resolucion()?.estado) }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-button color="accent" (click)="volver()" class="action-button">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
          <button mat-raised-button color="primary" (click)="editarResolucion()" class="action-button">
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
          <h3>Cargando resolución...</h3>
        </div>
      } @else if (!resolucion()) {
        <div class="error-container">
          <mat-icon class="error-icon">error</mat-icon>
          <h3>Resolución no encontrada</h3>
          <p>La resolución que buscas no existe o ha sido eliminada.</p>
          <button mat-raised-button color="primary" (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
            Volver a Resoluciones
          </button>
        </div>
      } @else {
        <div class="content-container">
          <div class="info-grid">
            <!-- Información Básica -->
            <mat-card class="info-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>description</mat-icon>
                  Información Básica
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">Número de Resolución:</span>
                    <span class="info-value">{{ resolucion()?.nroResolucion }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Tipo de Resolución:</span>
                    <span class="info-value">
                      <mat-chip [class]="'tipo-chip-' + resolucion()?.tipoTramite?.toLowerCase()">
                        {{ getTipoDisplayName(resolucion()?.tipoTramite) }}
                      </mat-chip>
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Fecha de Emisión:</span>
                    <span class="info-value">{{ resolucion()?.fechaEmision | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Fecha de Vencimiento:</span>
                    <span class="info-value" [class.vencida]="isVencida()">
                      {{ resolucion()?.fechaVencimiento ? (resolucion()?.fechaVencimiento | date:'dd/MM/yyyy') : 'Sin vencimiento' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Estado:</span>
                    <span class="info-value">
                      <mat-chip [class]="'estado-chip-' + resolucion()?.estado?.toLowerCase()">
                        {{ getEstadoDisplayName(resolucion()?.estado) }}
                      </mat-chip>
                    </span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Descripción y Observaciones -->
            <mat-card class="info-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>info</mat-icon>
                  Descripción
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">Descripción:</span>
                    <span class="info-value">{{ resolucion()?.descripcion || 'Sin descripción' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Observaciones:</span>
                    <span class="info-value">{{ resolucion()?.observaciones || 'Sin observaciones' }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
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

    .estado-vencida {
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

    .vencida {
      color: #dc3545;
      font-weight: 600;
    }

    .tipo-chip-primigenia {
      background-color: #d4edda;
      color: #155724;
    }

    .tipo-chip-renovacion {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .tipo-chip-incremento {
      background-color: #fff3cd;
      color: #856404;
    }

    .tipo-chip-sustitucion {
      background-color: #fce4ec;
      color: #c2185b;
    }

    .tipo-chip-otros {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .estado-chip-vigente {
      background-color: #d4edda;
      color: #155724;
    }

    .estado-chip-vencida {
      background-color: #fff3cd;
      color: #856404;
    }

    .estado-chip-suspendida {
      background-color: #f8d7da;
      color: #721c24;
    }

    .estado-chip-revocada {
      background-color: #f8d7da;
      color: #721c24;
    }

    .estado-chip-dada_de_baja {
      background-color: #6c757d;
      color: #ffffff;
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
export class ResolucionDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private resolucionService = inject(ResolucionService);

  resolucion = signal<Resolucion | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadResolucion(id);
    }
  }

  loadResolucion(id: string): void {
    this.isLoading.set(true);
    this.resolucionService.getResolucionById(id).subscribe({
      next: (resolucion) => {
        this.resolucion.set(resolucion);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading resolucion:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error al cargar la resolución', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getTipoDisplayName(tipo?: string): string {
    switch (tipo) {
      case 'PRIMIGENIA': return 'Primigenia';
      case 'RENOVACION': return 'Renovación';
      case 'INCREMENTO': return 'Incremento';
      case 'SUSTITUCION': return 'Sustitución';
      case 'OTROS': return 'Otros';
      default: return tipo || 'Sin tipo';
    }
  }

  getEstadoDisplayName(estado?: string): string {
    switch (estado) {
      case 'VIGENTE': return 'Vigente';
      case 'VENCIDA': return 'Vencida';
      case 'SUSPENDIDA': return 'Suspendida';
      case 'REVOCADA': return 'Revocada';
      case 'DADA_DE_BAJA': return 'Dada de Baja';
      default: return estado || 'Sin estado';
    }
  }

  isVencida(): boolean {
    const resolucion = this.resolucion();
    if (!resolucion?.fechaVencimiento) return false;
    return new Date() > new Date(resolucion.fechaVencimiento);
  }

  volver(): void {
    this.router.navigate(['/resoluciones']);
  }

  editarResolucion(): void {
    const resolucion = this.resolucion();
    if (resolucion) {
      this.router.navigate(['/resoluciones', resolucion.id, 'editar']);
    }
  }
} 