import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { UsuariosAdminService } from '../../../services/usuarios-admin.service';
import { UsuarioAdmin, RolUsuario } from '../../../models/usuario-admin.model';
import { DialogPermisosUsuarioComponent } from './dialog-permisos-usuario.component';

@Component({
  selector: 'app-tab-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="tab-header">
      <div class="header-text">
        <h2>Gestión de Usuarios</h2>
        <p>Administra las cuentas del personal y asigna roles del sistema</p>
      </div>
      <div class="header-actions">
        <button mat-raised-button color="primary" class="premium-button">
          <mat-icon>person_add</mat-icon>
          Nuevo Usuario
        </button>
      </div>
    </div>

    <div class="table-container premium-table">
      <table mat-table [dataSource]="usuarios()" class="mat-elevation-z0">
        <!-- DNI Column -->
        <ng-container matColumnDef="dni">
          <th mat-header-cell *matHeaderCellDef> DNI </th>
          <td mat-cell *matCellDef="let element"> {{element.dni}} </td>
        </ng-container>

        <!-- Nombre Column -->
        <ng-container matColumnDef="nombre">
          <th mat-header-cell *matHeaderCellDef> Nombres y Apellidos </th>
          <td mat-cell *matCellDef="let element"> 
            <div class="user-name-cell">
              <span class="user-name">{{element.nombres}} {{element.apellidos}}</span>
              <span class="user-email">{{element.email}}</span>
            </div>
          </td>
        </ng-container>

        <!-- Rol Column -->
        <ng-container matColumnDef="rol">
          <th mat-header-cell *matHeaderCellDef> Rol Asignado </th>
          <td mat-cell *matCellDef="let element"> 
            <div class="role-cell-wrap">
              <mat-chip-set>
                <mat-chip [color]="getRolColor(element.rolId)" highlighted class="role-chip">
                  {{ element.rolId | uppercase }}
                </mat-chip>
              </mat-chip-set>
              <span class="custom-badge" *ngIf="element.modulosPermitidos && element.modulosPermitidos.length > 0">
                Personalizado
              </span>
            </div>
          </td>
        </ng-container>

        <!-- Estado Column -->
        <ng-container matColumnDef="estado">
          <th mat-header-cell *matHeaderCellDef> Estado </th>
          <td mat-cell *matCellDef="let element"> 
            <span class="status-badge" [class.active]="element.estaActivo" [class.inactive]="!element.estaActivo">
              {{ element.estaActivo ? 'ACTIVO' : 'INACTIVO' }}
            </span>
          </td>
        </ng-container>

        <!-- Acciones Column -->
        <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef class="actions-col"> Acciones </th>
          <td mat-cell *matCellDef="let element" class="actions-col">
            <button mat-icon-button color="primary" matTooltip="Gestionar acceso a módulos" (click)="abrirPermisos(element)">
              <mat-icon>vpn_key</mat-icon>
            </button>
            <button mat-icon-button color="primary" matTooltip="Editar datos">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="accent" matTooltip="Restablecer contraseña">
              <mat-icon>lock_reset</mat-icon>
            </button>
            <button mat-icon-button [color]="element.estaActivo ? 'warn' : 'primary'" matTooltip="Cambiar estado">
              <mat-icon>{{ element.estaActivo ? 'block' : 'check_circle' }}</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      
      <div class="empty-state" *ngIf="usuarios().length === 0">
        <mat-icon>group_off</mat-icon>
        <p>No hay usuarios registrados</p>
      </div>
    </div>
  `,
  styles: [`
    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
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
    
    .table-container {
      width: 100%;
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f8fafc;
    }

    .table-container::-webkit-scrollbar {
      height: 8px;
    }

    .table-container::-webkit-scrollbar-track {
      background: #f8fafc;
    }

    .table-container::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .table-container table {
      width: 100%;
      min-width: 950px;
    }

    th.mat-mdc-header-cell {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      font-size: 0.84rem;
      padding: 14px 16px;
      border-bottom: 2px solid #e2e8f0;
    }

    td.mat-mdc-cell {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    tr.mat-mdc-row:hover {
      background-color: #f8fafc;
    }

    .col-dni {
      font-family: monospace;
      font-weight: 600;
      color: #334155;
      font-size: 0.95rem;
    }

    .user-name-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .user-name {
      font-weight: 600;
      color: var(--text-primary, #0f172a);
      font-size: 0.92rem;
    }
    .user-email {
      font-size: 0.8rem;
      color: var(--text-secondary, #64748b);
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-align: center;
    }
    .status-badge.active {
      background: rgba(16, 185, 129, 0.15);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .status-badge.inactive {
      background: rgba(239, 68, 68, 0.15);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .role-chip {
      font-size: 0.75rem;
      font-weight: 600;
    }

    .role-cell-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .custom-badge {
      font-size: 0.7rem;
      padding: 3px 8px;
      border-radius: 6px;
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
      font-weight: 600;
      white-space: nowrap;
    }

    .actions-col {
      text-align: right;
      width: 200px;
      min-width: 190px;
    }
    
    .empty-state {
      padding: 3rem;
      text-align: center;
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    :host-context([data-theme="dark"]),
    :host-context(.dark-theme) {
      .header-text h2 {
        color: #f8fafc;
      }
      .header-text p {
        color: #94a3b8;
      }
      .table-container {
        background: #0f172a;
        border-color: #1e293b;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        scrollbar-color: #334155 #0f172a;
      }
      .table-container::-webkit-scrollbar-track {
        background: #0f172a;
      }
      .table-container::-webkit-scrollbar-thumb {
        background: #334155;
      }
      th.mat-mdc-header-cell {
        background: #1e293b;
        color: #cbd5e1;
        border-bottom-color: #334155;
      }
      td.mat-mdc-cell {
        border-bottom-color: #1e293b;
        color: #f8fafc;
      }
      tr.mat-mdc-row:hover {
        background-color: #1e293b !important;
      }
      .user-name {
        color: #f8fafc;
      }
      .user-email {
        color: #94a3b8;
      }
      .col-dni {
        color: #93c5fd;
      }
      .custom-badge {
        background: #1e293b;
        color: #93c5fd;
        border-color: #334155;
      }
    }
  `]
})
export class TabUsuariosComponent implements OnInit {
  private usuariosService = inject(UsuariosAdminService);
  private dialog = inject(MatDialog);
  
  usuarios = signal<UsuarioAdmin[]>([]);
  displayedColumns: string[] = ['dni', 'nombre', 'rol', 'estado', 'acciones'];

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (data) => this.usuarios.set(data),
      error: (err) => console.error('Error cargando usuarios', err)
    });
  }

  abrirPermisos(usuario: UsuarioAdmin) {
    const dialogRef = this.dialog.open(DialogPermisosUsuarioComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: { usuario }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.cargarUsuarios();
      }
    });
  }

  getRolColor(rol: string): string {
    switch (rol.toLowerCase()) {
      case 'oti': return 'warn'; // Rojo/Warning para superadmin
      case 'admin': return 'accent'; // Pink/Accent para admin
      case 'directivo': return 'primary';
      case 'gerente': return 'primary';
      default: return 'basic';
    }
  }
}
