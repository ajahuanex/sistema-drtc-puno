import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';

@Component({
  selector: 'app-navegacion-rutas',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="navegacion-rutas-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon color="primary">route</mat-icon>
          Gestión de Rutas
        </mat-card-title>
        <mat-card-subtitle>
          Acceso directo al módulo de rutas optimizado
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="rutas-actions-grid">
          <!-- Ver todas las rutas de la empresa -->
          <button mat-raised-button 
                  color="primary" 
                  (click)="verRutasEmpresa()"
                  class="action-button">
            <mat-icon>visibility</mat-icon>
            Ver Rutas de la Empresa
          </button>
          
          <!-- Crear nueva ruta -->
          <button mat-raised-button 
                  color="accent" 
                  (click)="crearNuevaRuta()"
                  class="action-button">
            <mat-icon>add</mat-icon>
            Crear Nueva Ruta
          </button>
          
          <!-- Gestionar rutas por resolución (si hay resolución seleccionada) -->
          @if (resolucion) {
            <button mat-raised-button 
                    color="warn" 
                    (click)="gestionarRutasResolucion()"
                    class="action-button">
              <mat-icon>settings</mat-icon>
              Gestionar Rutas de Resolución
            </button>
          }
          
          <!-- Ir al módulo completo -->
          <button mat-stroked-button 
                  color="primary" 
                  (click)="irAModuloCompleto()"
                  class="action-button">
            <mat-icon>open_in_new</mat-icon>
            Módulo Completo de Rutas
          </button>
        </div>
        
        <!-- Información contextual -->
        <div class="info-section">
          <div class="info-item">
            <mat-icon>business</mat-icon>
            <span>{{ empresa.razonSocial.principal }}</span>
          </div>
          <div class="info-item">
            <mat-icon>badge</mat-icon>
            <span>RUC: {{ empresa.ruc }}</span>
          </div>
          @if (resolucion) {
            <div class="info-item">
              <mat-icon>description</mat-icon>
              <span>Resolución: {{ resolucion.nroResolucion }}</span>
            </div>
          }
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .navegacion-rutas-card {
      max-width: 600px;
      margin: 20px auto;
    }

    .navegacion-rutas-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rutas-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .action-button {
      width: 100%;
      height: 60px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .action-button mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .info-section {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .info-item:last-child {
      margin-bottom: 0;
    }

    .info-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #666;
    }

    @media (max-width: 768px) {
      .rutas-actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class NavegacionRutasComponent {
  @Input({ required: true }) empresa!: Empresa;
  @Input() resolucion?: Resolucion;

  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  verRutasEmpresa(): void {
    this.router.navigate(['/rutas'], {
      queryParams: {
        empresaId: this.empresa.id,
        empresaRuc: this.empresa.ruc,
        empresaNombre: this.empresa.razonSocial.principal
      }
    });
    
    this.mostrarMensajeNavegacion('Navegando a las rutas de la empresa...');
  }

  crearNuevaRuta(): void {
    const queryParams: any = {
      empresaId: this.empresa.id,
      empresaRuc: this.empresa.ruc,
      empresaNombre: this.empresa.razonSocial.principal,
      accion: 'crear'
    };

    if (this.resolucion) {
      queryParams.resolucionId = this.resolucion.id;
      queryParams.resolucionNumero = this.resolucion.nroResolucion;
    }

    this.router.navigate(['/rutas'], { queryParams });
    
    this.mostrarMensajeNavegacion('Navegando al formulario de creación de rutas...');
  }

  gestionarRutasResolucion(): void {
    if (!this.resolucion) return;

    this.router.navigate(['/rutas'], {
      queryParams: {
        empresaId: this.empresa.id,
        empresaRuc: this.empresa.ruc,
        empresaNombre: this.empresa.razonSocial.principal,
        resolucionId: this.resolucion.id,
        resolucionNumero: this.resolucion.nroResolucion,
        vista: 'resolucion-crud'
      }
    });
    
    this.mostrarMensajeNavegacion(`Navegando a las rutas de la resolución ${this.resolucion.nroResolucion}...`);
  }

  irAModuloCompleto(): void {
    this.router.navigate(['/rutas']);
    
    this.mostrarMensajeNavegacion('Navegando al módulo completo de rutas...');
  }

  private mostrarMensajeNavegacion(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}