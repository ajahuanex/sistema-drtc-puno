import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-conductor-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="conductor-detail-container">
      <div class="page-header">
        <div class="header-content">
          <div class="header-title">
            <h1>Detalles del Conductor</h1>
          </div>
          <p class="header-subtitle">Información completa del conductor registrado</p>
        </div>
        <div class="header-actions">
          <button mat-button (click)="volver()" class="secondary-button">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
          <button mat-raised-button color="accent" (click)="editarConductor()" class="action-button">
            <mat-icon>edit</mat-icon>
            Editar
          </button>
        </div>
      </div>

      <div class="content-section">
        @if (isLoading()) {
          <div class="loading-container">
            <div class="loading-content">
              <mat-spinner diameter="60" class="loading-spinner"></mat-spinner>
              <h3>Cargando información...</h3>
              <p>Obteniendo detalles del conductor</p>
            </div>
          </div>
        }

        @if (!isLoading() && !conductor()) {
          <div class="error-container">
            <div class="error-content">
              <mat-icon class="error-icon">error</mat-icon>
              <h2>Conductor no encontrado</h2>
              <p>El conductor que buscas no existe o ha sido eliminado.</p>
              <button mat-raised-button color="primary" (click)="volver()">
                <mat-icon>arrow_back</mat-icon>
                Volver a Conductores
              </button>
            </div>
          </div>
        }

        @if (!isLoading() && conductor()) {
          <div class="details-container">
            <!-- Información Básica -->
            <mat-card class="detail-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>person</mat-icon>
                  Información Básica
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">DNI:</span>
                    <span class="info-value">{{ conductor()?.dni }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Nombres:</span>
                    <span class="info-value">{{ conductor()?.nombres }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Apellidos:</span>
                    <span class="info-value">{{ conductor()?.apellidos }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Licencia de Conducir:</span>
                    <span class="info-value">{{ conductor()?.licenciaConducir }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Estado:</span>
                    <span class="status-chip" [class]="'status-' + conductor()?.estado?.toLowerCase()">
                      {{ conductor()?.estado }}
                    </span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Información de Contacto -->
            <mat-card class="detail-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>contact_phone</mat-icon>
                  Información de Contacto
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-grid">
                  <div class="info-item" *ngIf="conductor()?.email">
                    <span class="info-label">Email:</span>
                    <span class="info-value">{{ conductor()?.email }}</span>
                  </div>
                  <div class="info-item" *ngIf="conductor()?.telefono">
                    <span class="info-label">Teléfono:</span>
                    <span class="info-value">{{ conductor()?.telefono }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button mat-raised-button color="warn" (click)="eliminarConductor()" class="danger-button">
                <mat-icon>delete</mat-icon>
                Eliminar Conductor
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .conductor-detail-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

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
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
    }

    .header-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
    }

    .header-subtitle {
      margin: 0;
      color: #6c757d;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .secondary-button, .action-button {
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

    .secondary-button:hover, .action-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .content-section {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .loading-container, .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 80px 24px;
      text-align: center;
    }

    .loading-content h3, .error-content h2 {
      margin: 24px 0 8px 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .loading-content p, .error-content p {
      margin: 0 0 24px 0;
      color: #6c757d;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #dc3545;
    }

    .details-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .detail-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .detail-card mat-card-header {
      padding: 16px 16px 0 16px;
    }

    .detail-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
    }

    .detail-card mat-card-content {
      padding: 16px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f1f3f4;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #6c757d;
      font-size: 14px;
    }

    .info-value {
      font-weight: 500;
      color: #2c3e50;
      text-align: right;
    }

    .status-chip {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-activo {
      background: #d4edda;
      color: #155724;
    }

    .status-inactivo {
      background: #f8d7da;
      color: #721c24;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      padding-top: 24px;
      border-top: 1px solid #e9ecef;
    }

    .danger-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0.5px;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.2s ease-in-out;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .header-title h1 {
        font-size: 24px;
      }

      .header-actions {
        flex-direction: column;
        width: 100%;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .info-value {
        text-align: left;
      }
    }
  `]
})
export class ConductorDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  conductor = signal<any>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadConductor();
  }

  private loadConductor(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.volver();
      return;
    }

    this.isLoading.set(true);
    // TODO: Implementar carga de conductor desde servicio
    setTimeout(() => {
      this.conductor.set({
        id,
        dni: '12345678',
        nombres: 'Juan Carlos',
        apellidos: 'Pérez Quispe',
        licenciaConducir: 'A1B2C3D4E5',
        email: 'juan.perez@email.com',
        telefono: '951234567',
        estado: 'ACTIVO'
      });
      this.isLoading.set(false);
    }, 1000);
  }

  editarConductor(): void {
    if (this.conductor()) {
      this.router.navigate(['/conductores', this.conductor()!.id, 'editar']);
    }
  }

  eliminarConductor(): void {
    if (this.conductor()) {
      if (confirm('¿Estás seguro de que deseas eliminar este conductor? Esta acción no se puede deshacer.')) {
        // TODO: Implementar eliminación
        this.snackBar.open('Conductor eliminado exitosamente', 'Cerrar', { duration: 3000 });
        this.volver();
      }
    }
  }

  volver(): void {
    this.router.navigate(['/conductores']);
  }
} 