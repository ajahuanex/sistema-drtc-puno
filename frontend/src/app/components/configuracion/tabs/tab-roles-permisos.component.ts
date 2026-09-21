import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PermisosService } from '../../../services/permisos.service';
import { ModuloSistema, RolPermisosConfig } from '../../../models/permisos.model';

@Component({
  selector: 'app-tab-roles-permisos',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatChipsModule
  ],
  template: `
    <div class="tab-header">
      <div class="header-text">
        <h2>Matriz de Permisos por Rol</h2>
        <p>Configura a qué módulos operativos tiene acceso cada rol institucional de forma predeterminada.</p>
      </div>
      <div class="header-actions">
        <button mat-button class="reset-btn" (click)="cargarDatos()" [disabled]="guardando()">
          <mat-icon>refresh</mat-icon>
          Descartar
        </button>
        <button mat-raised-button color="primary" class="save-btn" (click)="guardarCambios()" [disabled]="guardando()">
          <mat-icon>{{ guardando() ? 'hourglass_top' : 'save' }}</mat-icon>
          {{ guardando() ? 'Guardando...' : 'Guardar Matriz' }}
        </button>
      </div>
    </div>

    <!-- Banner informativo -->
    <div class="info-banner">
      <mat-icon class="banner-icon">security</mat-icon>
      <div class="banner-text">
        <strong>Control Centralizado de Accesos:</strong> Los roles marcados como superusuarios (OTI y Administrador) tienen acceso irrestricto por seguridad institucional. Para los demás roles, desmarcar un módulo ocultará su navegación y bloqueará sus rutas.
      </div>
    </div>

    <div class="matrix-card mat-elevation-z1">
      <div class="table-responsive">
        <table class="roles-matrix-table">
          <thead>
            <tr>
              <th class="th-rol">Rol Institucional</th>
              <th *ngFor="let mod of modulos()" class="th-mod" [matTooltip]="mod.descripcion" matTooltipPosition="above">
                <div class="mod-header-cell">
                  <mat-icon class="mod-icon">{{ mod.icono }}</mat-icon>
                  <span class="mod-label">{{ mod.nombre }}</span>
                </div>
              </th>
              <th class="th-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let rol of roles()" [class.system-row]="rol.esSistema">
              <!-- Rol Col -->
              <td class="td-rol">
                <div class="rol-cell">
                  <div class="rol-title">
                    <span class="rol-name">{{ rol.nombre }}</span>
                    <span class="rol-badge" *ngIf="rol.esSistema">SISTEMA</span>
                  </div>
                  <span class="rol-desc">{{ rol.descripcion }}</span>
                </div>
              </td>

              <!-- Modulos Checkboxes -->
              <td *ngFor="let mod of modulos()" class="td-check">
                <div class="checkbox-wrapper">
                  <mat-checkbox
                    [checked]="tieneModulo(rol, mod.id)"
                    [disabled]="rol.esSistema"
                    (change)="toggleModulo(rol, mod.id, $event.checked)"
                    color="primary">
                  </mat-checkbox>
                </div>
              </td>

              <!-- Acciones por fila -->
              <td class="td-actions">
                <div class="row-actions" *ngIf="!rol.esSistema">
                  <button mat-icon-button (click)="marcarTodos(rol)" matTooltip="Conceder todos los módulos" color="primary">
                    <mat-icon>done_all</mat-icon>
                  </button>
                  <button mat-icon-button (click)="desmarcarTodos(rol)" matTooltip="Revocar todos los módulos" color="warn">
                    <mat-icon>remove_done</mat-icon>
                  </button>
                </div>
                <div *ngIf="rol.esSistema" class="full-access-badge">
                  <mat-icon>lock</mat-icon>
                  <span>Acceso Total</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-text h2 {
      margin: 0 0 4px 0;
      font-size: 1.4rem;
      font-weight: 700;
      color: #0f172a;
    }

    .header-text p {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .save-btn {
      background: #1e3a8a !important;
      color: #ffffff !important;
      font-weight: 600;
      border-radius: 8px;
      padding: 0 20px;
    }

    .info-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      color: #1e40af;
      font-size: 0.88rem;
    }

    .banner-icon {
      color: #2563eb;
      font-size: 24px;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .matrix-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      width: 100%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .table-responsive {
      overflow-x: auto;
      width: 100%;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f8fafc;
    }

    .table-responsive::-webkit-scrollbar {
      height: 9px;
    }

    .table-responsive::-webkit-scrollbar-track {
      background: #f8fafc;
    }

    .table-responsive::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .table-responsive::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .roles-matrix-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      min-width: 1300px;
    }

    .roles-matrix-table th {
      background: #f8fafc;
      padding: 14px 10px;
      border-bottom: 2px solid #e2e8f0;
      text-align: center;
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
    }

    .th-rol {
      text-align: left !important;
      padding-left: 20px !important;
      width: 280px;
      min-width: 260px;
      position: sticky;
      left: 0;
      background: #f8fafc !important;
      z-index: 10;
      box-shadow: 3px 0 6px rgba(0, 0, 0, 0.04);
    }

    .th-mod {
      min-width: 95px;
    }

    .th-actions {
      position: sticky;
      right: 0;
      background: #f8fafc !important;
      z-index: 8;
      box-shadow: -3px 0 6px rgba(0, 0, 0, 0.04);
      min-width: 110px;
    }

    .mod-header-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      padding: 4px;
    }

    .mod-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #1e3a8a;
    }

    .mod-label {
      font-size: 0.78rem;
      line-height: 1.2;
      max-width: 90px;
      white-space: normal;
      word-break: break-word;
      text-align: center;
      font-weight: 600;
      color: #334155;
    }

    .roles-matrix-table td {
      padding: 14px 10px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
      background: #ffffff;
    }

    .td-rol {
      padding-left: 20px !important;
      position: sticky;
      left: 0;
      background: #ffffff !important;
      z-index: 9;
      box-shadow: 3px 0 6px rgba(0, 0, 0, 0.04);
      width: 280px;
      min-width: 260px;
    }

    .td-actions {
      position: sticky;
      right: 0;
      background: #ffffff !important;
      z-index: 8;
      box-shadow: -3px 0 6px rgba(0, 0, 0, 0.04);
      min-width: 110px;
      text-align: center;
    }

    .system-row td {
      background: #fcfdfe !important;
    }

    .system-row .td-rol {
      background: #fcfdfe !important;
    }

    .system-row .td-actions {
      background: #fcfdfe !important;
    }

    .rol-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .rol-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rol-name {
      font-weight: 600;
      font-size: 0.92rem;
      color: #0f172a;
    }

    .rol-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      background: #e0e7ff;
      color: #3730a3;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .rol-desc {
      font-size: 0.78rem;
      color: #64748b;
      line-height: 1.3;
    }

    .td-check {
      text-align: center;
    }

    .checkbox-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .td-actions {
      text-align: center;
      width: 110px;
    }

    .row-actions {
      display: flex;
      justify-content: center;
      gap: 4px;
    }

    .full-access-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #059669;
      background: #ecfdf5;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 600;
    }

    .full-access-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .system-row {
      background: #fafafa;
    }

    :host-context([data-theme="dark"]),
    :host-context(.dark-theme) {
      .header-text h2 {
        color: #f8fafc;
      }
      .header-text p {
        color: #94a3b8;
      }
      .info-banner {
        background: #1e293b;
        border-color: #334155;
        color: #93c5fd;
      }
      .banner-icon {
        color: #60a5fa;
      }
      .matrix-card {
        background: #0f172a;
        border-color: #1e293b;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      }
      .table-responsive {
        scrollbar-color: #334155 #0f172a;
      }
      .table-responsive::-webkit-scrollbar-track {
        background: #0f172a;
      }
      .table-responsive::-webkit-scrollbar-thumb {
        background: #334155;
      }
      .roles-matrix-table th {
        background: #1e293b;
        color: #cbd5e1;
        border-bottom-color: #334155;
      }
      .th-rol {
        background: #1e293b !important;
        box-shadow: 3px 0 6px rgba(0, 0, 0, 0.3);
      }
      .th-actions {
        background: #1e293b !important;
        box-shadow: -3px 0 6px rgba(0, 0, 0, 0.3);
      }
      .mod-icon {
        color: #60a5fa;
      }
      .mod-label {
        color: #cbd5e1;
      }
      .roles-matrix-table td {
        background: #0f172a;
        border-bottom-color: #1e293b;
        color: #f8fafc;
      }
      .td-rol {
        background: #0f172a !important;
        box-shadow: 3px 0 6px rgba(0, 0, 0, 0.3);
      }
      .td-actions {
        background: #0f172a !important;
        box-shadow: -3px 0 6px rgba(0, 0, 0, 0.3);
      }
      .system-row td,
      .system-row .td-rol,
      .system-row .td-actions {
        background: #131d33 !important;
      }
      .rol-name {
        color: #f8fafc;
      }
      .rol-badge {
        background: #312e81;
        color: #c7d2fe;
      }
      .rol-desc {
        color: #94a3b8;
      }
      .roles-matrix-table tr:hover td,
      .roles-matrix-table tr:hover .td-rol,
      .roles-matrix-table tr:hover .td-actions {
        background: #17233d !important;
      }
      .full-access-badge {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
      }
      .save-btn {
        background: #2563eb !important;
      }
    }
  `]
})
export class TabRolesPermisosComponent implements OnInit {
  private permisosService = inject(PermisosService);
  private snackBar = inject(MatSnackBar);

  modulos = signal<ModuloSistema[]>([]);
  roles = signal<RolPermisosConfig[]>([]);
  guardando = signal<boolean>(false);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.permisosService.getModulos().subscribe({
      next: (mods) => {
        this.modulos.set(mods);
      }
    });

    this.permisosService.getRoles().subscribe({
      next: (r) => {
        // Clonar para permitir edición local
        this.roles.set(JSON.parse(JSON.stringify(r)));
      },
      error: () => {
        this.snackBar.open('Error al cargar la matriz de roles', 'Cerrar', { duration: 3000 });
      }
    });
  }

  tieneModulo(rol: RolPermisosConfig, moduloId: string): boolean {
    if (rol.esSistema) return true;
    return rol.modulos.includes(moduloId);
  }

  toggleModulo(rol: RolPermisosConfig, moduloId: string, habilitado: boolean) {
    if (rol.esSistema) return;

    if (habilitado) {
      if (!rol.modulos.includes(moduloId)) {
        rol.modulos.push(moduloId);
      }
    } else {
      rol.modulos = rol.modulos.filter(id => id !== moduloId);
    }
  }

  marcarTodos(rol: RolPermisosConfig) {
    if (rol.esSistema) return;
    rol.modulos = this.modulos().map(m => m.id);
  }

  desmarcarTodos(rol: RolPermisosConfig) {
    if (rol.esSistema) return;
    // Mantener al menos dashboard
    rol.modulos = ['dashboard'];
  }

  guardarCambios() {
    this.guardando.set(true);
    const rolesToUpdate = this.roles().filter(r => !r.esSistema);
    
    let completados = 0;
    let huboError = false;

    if (rolesToUpdate.length === 0) {
      this.guardando.set(false);
      return;
    }

    rolesToUpdate.forEach(r => {
      this.permisosService.actualizarRolPermisos(r.rolId, r.modulos).subscribe({
        next: () => {
          completados++;
          if (completados === rolesToUpdate.length) {
            this.guardando.set(false);
            if (!huboError) {
              this.snackBar.open('✓ Matriz de permisos actualizada correctamente', 'Cerrar', { duration: 3000 });
            }
          }
        },
        error: () => {
          huboError = true;
          completados++;
          if (completados === rolesToUpdate.length) {
            this.guardando.set(false);
            this.snackBar.open('Error al actualizar algunos roles', 'Cerrar', { duration: 4000 });
          }
        }
      });
    });
  }
}
