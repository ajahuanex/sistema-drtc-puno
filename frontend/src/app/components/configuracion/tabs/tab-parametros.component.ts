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
  selector: 'app-tab-parametros',
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
        <h2>Parámetros Globales</h2>
        <p>Ajusta las variables maestras que controlan el funcionamiento del sistema</p>
      </div>
      <div class="header-actions">
        <button mat-raised-button color="primary" (click)="guardarCambios()" [disabled]="!hayCambios()">
          <mat-icon>save</mat-icon>
          Guardar Cambios
        </button>
      </div>
    </div>

    <div class="parametros-grid">
      <!-- Agrupar por categoría en el futuro, por ahora iteramos los numéricos/texto -->
      <ng-container *ngFor="let param of parametrosFiltrados()">
        <mat-card class="param-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="param-icon">settings</mat-icon>
            <mat-card-title>{{ param.nombre }}</mat-card-title>
            <mat-card-subtitle>{{ param.clave }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p class="param-desc">{{ param.descripcion }}</p>
            
            <div class="param-input-container">
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Valor</mat-label>
                <input matInput [type]="param.tipo === 'entero' || param.tipo === 'decimal' ? 'number' : 'text'"
                       [(ngModel)]="param.valor"
                       (ngModelChange)="marcarComoModificado(param)">
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>
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

    .parametros-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .param-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(0,0,0,0.05);
      box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
      transition: all 0.2s ease;
    }
    
    .param-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
      border-color: rgba(var(--primary-color-rgb), 0.2);
    }

    .param-icon {
      background: rgba(var(--primary-color-rgb), 0.1);
      color: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }

    .param-desc {
      color: var(--text-secondary);
      font-size: 0.85rem;
      min-height: 40px;
      margin-bottom: 1rem;
    }

    .w-100 {
      width: 100%;
    }

    :host-context([data-theme="dark"]),
    :host-context(.dark-theme) {
      .header-text h2 {
        color: #f8fafc;
      }
      .header-text p,
      .param-desc {
        color: #94a3b8;
      }
      .param-card {
        background: #0f172a !important;
        border-color: #1e293b !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
      }
      .param-card:hover {
        border-color: #3b82f6 !important;
      }
      .param-icon {
        background: #1e293b !important;
        color: #60a5fa !important;
      }
    }
  `]
})
export class TabParametrosComponent implements OnInit {
  private parametrosService = inject(ParametrosService);
  private snackBar = inject(MatSnackBar);

  parametros = signal<ParametroSistema[]>([]);
  
  // Clon para no afectar el original hasta guardar
  parametrosEditables = signal<ParametroSistema[]>([]);
  modificados = new Set<string>();

  // Filtrar solo los que no son booleanos (esos van en interoperabilidad)
  parametrosFiltrados = computed(() => {
    return this.parametrosEditables().filter(p => p.tipo !== 'booleano' && p.categoria !== 'interoperabilidad');
  });

  ngOnInit() {
    this.cargarParametros();
  }

  cargarParametros() {
    this.parametrosService.obtenerParametros().subscribe({
      next: (data) => {
        this.parametros.set(data);
        // Clonar profundamente para edición
        this.parametrosEditables.set(JSON.parse(JSON.stringify(data)));
        this.modificados.clear();
      }
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
            this.snackBar.open('Parámetros actualizados exitosamente', 'Cerrar', { duration: 3000 });
            this.cargarParametros(); // Recargar para sincronizar
          }
        },
        error: () => {
          this.snackBar.open(`Error actualizando ${param.nombre}`, 'Cerrar', { duration: 3000 });
        }
      });
    });
  }
}
