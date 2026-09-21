import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { PermisosService } from '../../../services/permisos.service';
import { ModuloSistema, UsuarioPermisosResponse } from '../../../models/permisos.model';
import { UsuarioAdmin } from '../../../models/usuario-admin.model';

@Component({
  selector: 'app-dialog-permisos-usuario',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatCheckboxModule,
    FormsModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-icon-box">
          <mat-icon>manage_accounts</mat-icon>
        </div>
        <div class="header-title-box">
          <h2 mat-dialog-title>Permisos de Acceso a Módulos</h2>
          <span class="user-subtitle">{{ data.usuario.nombres }} {{ data.usuario.apellidos }} • DNI: {{ data.usuario.dni }}</span>
        </div>
        <button mat-icon-button class="close-btn" [mat-dialog-close]="false">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <!-- Modo de asignación -->
        <div class="mode-selection-card">
          <label class="section-label">Modo de Permisos</label>
          <mat-radio-group [(ngModel)]="modoAsignacion" class="radio-vertical-group">
            <mat-radio-button value="heredar" color="primary">
              <div class="radio-info">
                <strong>Heredar permisos del Rol ({{ data.usuario.rolId | uppercase }})</strong>
                <p>El usuario tendrá acceso automáticamente a los módulos permitidos para su rol.</p>
              </div>
            </mat-radio-button>

            <mat-radio-button value="personalizado" color="primary">
              <div class="radio-info">
                <strong>Personalizar módulos para este usuario</strong>
                <p>Define manualmente a qué módulos puede entrar, independientemente de su rol.</p>
              </div>
            </mat-radio-button>
          </mat-radio-group>
        </div>

        <!-- Módulos seleccionables -->
        <div class="modules-selection-card" [class.disabled-section]="modoAsignacion === 'heredar'">
          <div class="modules-header">
            <label class="section-label">Módulos Autorizados</label>
            <span class="modules-hint" *ngIf="modoAsignacion === 'heredar'">
              (Calculados automáticamente según su rol institucional)
            </span>
          </div>

          <div class="modules-grid">
            <div 
              *ngFor="let mod of modulos()" 
              class="module-item-box"
              [class.checked]="isModuloSeleccionado(mod.id)"
              (click)="toggleModulo(mod.id)">
              <mat-checkbox
                [checked]="isModuloSeleccionado(mod.id)"
                [disabled]="modoAsignacion === 'heredar'"
                color="primary"
                (click)="$event.stopPropagation()"
                (change)="setModulo(mod.id, $event.checked)">
              </mat-checkbox>
              <div class="module-icon-wrap">
                <mat-icon>{{ mod.icono }}</mat-icon>
              </div>
              <div class="module-info">
                <span class="mod-name">{{ mod.nombre }}</span>
                <span class="mod-desc">{{ mod.descripcion }}</span>
              </div>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button [mat-dialog-close]="false" [disabled]="guardando()">
          Cancelar
        </button>
        <button mat-raised-button color="primary" class="btn-save" (click)="guardar()" [disabled]="guardando()">
          <mat-icon>{{ guardando() ? 'hourglass_top' : 'check' }}</mat-icon>
          {{ guardando() ? 'Guardando...' : 'Guardar Permisos' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 0;
      max-width: 680px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      gap: 16px;
    }

    .header-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #eff6ff;
      color: #1e40af;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-title-box {
      flex: 1;
    }

    .header-title-box h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
    }

    .user-subtitle {
      font-size: 0.85rem;
      color: #64748b;
    }

    .close-btn {
      color: #94a3b8;
    }

    .dialog-content {
      padding: 20px 24px !important;
      max-height: 70vh;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-label {
      font-weight: 700;
      font-size: 0.88rem;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 8px;
    }

    .mode-selection-card {
      background: #f8fafc;
      padding: 16px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }

    .radio-vertical-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }

    .radio-info strong {
      display: block;
      font-size: 0.92rem;
      color: #0f172a;
    }

    .radio-info p {
      margin: 2px 0 0 0;
      font-size: 0.8rem;
      color: #64748b;
    }

    .modules-selection-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      transition: opacity 0.2s;
    }

    .disabled-section {
      opacity: 0.75;
      background: #fcfcfc;
    }

    .modules-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 12px;
    }

    .modules-hint {
      font-size: 0.78rem;
      color: #2563eb;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 10px;
    }

    .module-item-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.15s;
    }

    .module-item-box:hover {
      border-color: #cbd5e1;
    }

    .module-item-box.checked {
      background: #eff6ff;
      border-color: #93c5fd;
    }

    .module-icon-wrap {
      color: #1e40af;
      display: flex;
      align-items: center;
    }

    .module-icon-wrap mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .module-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .mod-name {
      font-size: 0.86rem;
      font-weight: 600;
      color: #0f172a;
    }

    .mod-desc {
      font-size: 0.74rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
    }

    .btn-save {
      background: #1e3a8a !important;
      color: #ffffff !important;
      border-radius: 8px;
      font-weight: 600;
    }

    :host-context([data-theme="dark"]),
    :host-context(.dark-theme) {
      .dialog-header {
        border-bottom-color: #1e293b;
      }
      .header-icon-box {
        background: #1e293b;
        color: #60a5fa;
      }
      .header-title-box h2,
      .radio-info strong,
      .mod-name {
        color: #f8fafc;
      }
      .user-subtitle,
      .radio-info p,
      .mod-desc,
      .modules-hint {
        color: #94a3b8;
      }
      .section-label {
        color: #cbd5e1;
      }
      .mode-selection-card {
        background: #141d33;
        border-color: #1e293b;
      }
      .modules-selection-card {
        border-color: #1e293b;
      }
      .disabled-section {
        background: #090d16;
      }
      .module-item-box {
        background: #1e293b;
        border-color: #334155;
      }
      .module-item-box:hover {
        border-color: #3b82f6;
        background: #17233d;
      }
      .module-item-box.checked {
        background: #1e3a8a;
        border-color: #3b82f6;
      }
      .module-item-box.checked .mod-name {
        color: #ffffff;
      }
      .module-item-box.checked .mod-desc {
        color: #bfdbfe;
      }
      .module-icon-wrap {
        color: #60a5fa;
      }
      .dialog-actions {
        border-top-color: #1e293b;
      }
      .btn-save {
        background: #2563eb !important;
      }
    }
  `]
})
export class DialogPermisosUsuarioComponent implements OnInit {
  dialogRef = inject(MatDialogRef<DialogPermisosUsuarioComponent>);
  data = inject<{ usuario: UsuarioAdmin }>(MAT_DIALOG_DATA);
  private permisosService = inject(PermisosService);
  private snackBar = inject(MatSnackBar);

  modulos = signal<ModuloSistema[]>([]);
  modulosSeleccionados = signal<string[]>([]);
  modoAsignacion: 'heredar' | 'personalizado' = 'heredar';
  guardando = signal<boolean>(false);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.permisosService.getModulos().subscribe(mods => {
      this.modulos.set(mods);
    });

    this.permisosService.getPermisosUsuario(this.data.usuario.id).subscribe({
      next: (resp: UsuarioPermisosResponse) => {
        if (resp.heredaRol) {
          this.modoAsignacion = 'heredar';
          this.modulosSeleccionados.set([...resp.modulosCalculados]);
        } else {
          this.modoAsignacion = 'personalizado';
          this.modulosSeleccionados.set([...(resp.modulosPersonalizados || [])]);
        }
      },
      error: () => {
        this.snackBar.open('Error al obtener permisos del usuario', 'Cerrar', { duration: 3000 });
      }
    });
  }

  isModuloSeleccionado(moduloId: string): boolean {
    return this.modulosSeleccionados().includes(moduloId);
  }

  setModulo(moduloId: string, checked: boolean) {
    if (this.modoAsignacion === 'heredar') return;
    if (checked) {
      if (!this.modulosSeleccionados().includes(moduloId)) {
        this.modulosSeleccionados.update(list => [...list, moduloId]);
      }
    } else {
      this.modulosSeleccionados.update(list => list.filter(id => id !== moduloId));
    }
  }

  toggleModulo(moduloId: string) {
    if (this.modoAsignacion === 'heredar') return;
    const isChecked = this.isModuloSeleccionado(moduloId);
    this.setModulo(moduloId, !isChecked);
  }

  guardar() {
    this.guardando.set(true);
    const heredar = this.modoAsignacion === 'heredar';
    const modulosPayload = heredar ? null : this.modulosSeleccionados();

    this.permisosService.actualizarPermisosUsuario(this.data.usuario.id, modulosPayload, heredar).subscribe({
      next: () => {
        this.guardando.set(false);
        this.snackBar.open('✓ Permisos de usuario actualizados correctamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.guardando.set(false);
        this.snackBar.open('Error al guardar permisos del usuario', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
