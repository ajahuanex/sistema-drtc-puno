import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ParametrosService } from '../../../services/parametros.service';
import { ParametroSistema } from '../../../models/parametro.model';

@Component({
  selector: 'app-tab-seguridad',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <div class="tab-header">
      <div class="header-text">
        <h2>Políticas de Seguridad</h2>
        <p>Configuración de expiración de sesión y opciones de auditoría</p>
      </div>
      <div class="header-actions">
        <button mat-raised-button color="primary" (click)="guardarCambios()" [disabled]="!hayCambios()">
          <mat-icon>save</mat-icon>
          Guardar Cambios
        </button>
      </div>
    </div>

    <div class="security-grid">
      <!-- Sección de Parámetros de Seguridad -->
      <div class="security-params">
        <h3>Parámetros de Sesión</h3>
        <ng-container *ngFor="let param of parametrosFiltrados()">
          <mat-card class="security-card mb-3">
            <mat-card-content class="d-flex align-items-center justify-content-between">
              <div class="security-info">
                <mat-icon class="security-icon">timer</mat-icon>
                <div>
                  <h4>{{ param.nombre }}</h4>
                  <p>{{ param.descripcion }}</p>
                </div>
              </div>
              <div class="security-input">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <input matInput type="number"
                         [(ngModel)]="param.valor"
                         (ngModelChange)="marcarComoModificado(param)">
                  <span matTextSuffix>min.</span>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>
        </ng-container>
      </div>

      <!-- Sección de Accesos a Auditoría -->
      <div class="audit-access">
        <h3>Módulo de Auditoría</h3>
        <mat-card class="audit-card">
          <mat-card-content>
            <div class="audit-illustration">
              <mat-icon>policy</mat-icon>
            </div>
            <h4>Auditoría Centralizada</h4>
            <p>El registro de acciones críticas (creación, edición, eliminación de resoluciones y empresas) se almacena automáticamente. Para ver la bitácora completa, dirígete al módulo de Auditoría (Solo OTI/Admin).</p>
            <button mat-stroked-button color="primary" class="mt-3">
              <mat-icon>launch</mat-icon>
              Ir a Auditoría
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .header-text h2 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 600;
    }
    .header-text p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .security-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 2rem;
    }
    @media (max-width: 900px) {
      .security-grid {
        grid-template-columns: 1fr;
      }
    }

    h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }

    .mb-3 { margin-bottom: 1rem; }
    .mt-3 { margin-top: 1rem; }
    .d-flex { display: flex; }
    .align-items-center { align-items: center; }
    .justify-content-between { justify-content: space-between; }

    .security-card {
      box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .security-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .security-icon {
      background: rgba(var(--primary-color-rgb), 0.1);
      color: var(--primary-color);
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .security-info h4 {
      margin: 0 0 4px 0;
      font-size: 1rem;
      font-weight: 500;
    }
    .security-info p {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .security-input {
      width: 120px;
    }

    .audit-card {
      text-align: center;
      padding: 2rem 1rem;
      background: linear-gradient(145deg, var(--surface-card) 0%, rgba(var(--primary-color-rgb), 0.03) 100%);
      border: 1px solid rgba(var(--primary-color-rgb), 0.1);
      box-shadow: none !important;
    }

    .audit-illustration {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: rgba(var(--primary-color-rgb), 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .audit-illustration mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--primary-color);
    }

    .audit-card h4 {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }
    .audit-card p {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    :host-context([data-theme="dark"]),
    :host-context(.dark-theme) {
      .header-text h2,
      .security-params h3,
      .audit-access h3,
      .security-info h4,
      .audit-card h4 {
        color: #f8fafc !important;
      }
      .header-text p,
      .security-info p,
      .audit-card p {
        color: #94a3b8 !important;
      }
      .security-card {
        background: #0f172a !important;
        border-color: #1e293b !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
      }
      .security-icon {
        background: #1e293b !important;
        color: #60a5fa !important;
      }
      .audit-card {
        background: #0f172a !important;
        border-color: #1e293b !important;
      }
      .audit-illustration {
        background: #1e293b !important;
      }
      .audit-illustration mat-icon {
        color: #60a5fa !important;
      }
    }
  `]
})
export class TabSeguridadComponent implements OnInit {
  private parametrosService = inject(ParametrosService);
  private snackBar = inject(MatSnackBar);

  parametros = signal<ParametroSistema[]>([]);
  parametrosEditables = signal<ParametroSistema[]>([]);
  modificados = new Set<string>();

  parametrosFiltrados = computed(() => {
    return this.parametrosEditables().filter(p => p.categoria === 'sistema' && p.clave.includes('SESSION'));
  });

  ngOnInit() {
    this.cargarParametros();
  }

  cargarParametros() {
    this.parametrosService.obtenerParametros().subscribe(data => {
      this.parametros.set(data);
      this.parametrosEditables.set(JSON.parse(JSON.stringify(data)));
      this.modificados.clear();
    });
  }

  marcarComoModificado(param: ParametroSistema) {
    const original = this.parametros().find(p => p.id === param.id);
    if (original && original.valor !== param.valor) {
      this.modificados.add(param.id);
    } else {
      this.modificados.delete(param.id);
    }
  }

  hayCambios(): boolean {
    return this.modificados.size > 0;
  }

  guardarCambios() {
    const editados = this.parametrosEditables().filter(p => this.modificados.has(p.id));
    let completados = 0;
    
    editados.forEach(param => {
      this.parametrosService.actualizarParametro(param.id, { valor: param.valor }).subscribe({
        next: () => {
          completados++;
          if (completados === editados.length) {
            this.snackBar.open('Políticas de seguridad actualizadas', 'Cerrar', { duration: 3000 });
            this.cargarParametros();
          }
        },
        error: () => this.snackBar.open('Error actualizando políticas', 'Cerrar', { duration: 3000 })
      });
    });
  }
}
