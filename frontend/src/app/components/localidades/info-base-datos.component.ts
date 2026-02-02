import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LocalidadesFactoryService } from '../../services/localidades-factory.service';
import { LocalidadesLocalService } from '../../services/localidades-local.service';

@Component({
  selector: 'app-info-base-datos',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="info-card">
      <mat-card-content>
        <div class="info-content">
          <div class="info-icon">
            <mat-icon [class]="modoLocal ? 'local-icon' : 'remote-icon'">
              {{ modoLocal ? 'storage' : 'cloud' }}
            </mat-icon>
          </div>
          <div class="info-details">
            <div class="info-title">{{ infoServicio.modo }}</div>
            <div class="info-description">{{ infoServicio.descripcion }}</div>
            <div class="info-stats" *ngIf="metadata">
              <span class="stat-item">
                <mat-icon>dataset</mat-icon>
                {{ metadata.totalRegistros }} registros
              </span>
              <span class="stat-item">
                <mat-icon>update</mat-icon>
                v{{ metadata.version }}
              </span>
            </div>
          </div>
          <div class="info-actions">
            <button mat-icon-button 
                    matTooltip="Recargar datos"
                    (click)="recargarDatos()">
              <mat-icon>refresh</mat-icon>
            </button>
            <button mat-icon-button 
                    matTooltip="Cambiar modo (Solo desarrollo)"
                    (click)="cambiarModo()"
                    *ngIf="mostrarCambioModo">
              <mat-icon>swap_horiz</mat-icon>
            </button>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .info-card {
      margin-bottom: 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 1px solid #dee2e6;
    }

    .info-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 0;
    }

    .info-icon {
      flex-shrink: 0;
    }

    .info-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .local-icon {
      color: #28a745;
    }

    .remote-icon {
      color: #007bff;
    }

    .info-details {
      flex: 1;
    }

    .info-title {
      font-size: 16px;
      font-weight: 600;
      color: #495057;
      margin-bottom: 4px;
    }

    .info-description {
      font-size: 14px;
      color: #6c757d;
      margin-bottom: 8px;
    }

    .info-stats {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #6c757d;
    }

    .stat-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .info-actions {
      flex-shrink: 0;
      display: flex;
      gap: 4px;
    }

    .info-actions button {
      width: 36px;
      height: 36px;
    }

    .info-actions mat-icon {
      font-size: 18px;
    }
  `]
})
export class InfoBaseDatosComponent implements OnInit {
  private factoryService = inject(LocalidadesFactoryService);
  private localService = inject(LocalidadesLocalService);

  infoServicio = { modo: '', descripcion: '' };
  metadata: any = null;
  modoLocal = false;
  mostrarCambioModo = false;

  ngOnInit() {
    this.actualizarInfo();
    
    // Mostrar opción de cambio de modo solo en desarrollo
    this.mostrarCambioModo = !this.esProduccion();
  }

  actualizarInfo() {
    this.infoServicio = this.factoryService.getInfoServicio();
    this.modoLocal = this.factoryService.getModoOperacion() === 'local';
    
    if (this.modoLocal) {
      this.metadata = this.localService.obtenerMetadata();
    }
  }

  async recargarDatos() {
    try {
      if (this.modoLocal) {
        await this.localService.recargarDatos();
      }
      this.actualizarInfo();
      console.log('✅ Datos recargados exitosamente');
    } catch (error) {
      console.error('❌ Error recargando datos:', error);
    }
  }

  cambiarModo() {
    if (!this.mostrarCambioModo) return;
    
    const nuevoModo = this.modoLocal ? 'remote' : 'local';
    this.factoryService.cambiarModo(nuevoModo);
    this.actualizarInfo();
  }

  private esProduccion(): boolean {
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1';
  }
}