import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { TabUsuariosComponent } from './tabs/tab-usuarios.component';
import { TabRolesPermisosComponent } from './tabs/tab-roles-permisos.component';
import { TabParametrosComponent } from './tabs/tab-parametros.component';
import { TabInteroperabilidadComponent } from './tabs/tab-interoperabilidad.component';
import { TabSeguridadComponent } from './tabs/tab-seguridad.component';

@Component({
  selector: 'app-configuracion-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    TabUsuariosComponent,
    TabRolesPermisosComponent,
    TabParametrosComponent,
    TabInteroperabilidadComponent,
    TabSeguridadComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Configuración y Seguridad</h1>
          <p class="subtitle">Administración integral del sistema SIRRETT</p>
        </div>
      </div>

      <div class="content-card">
        <mat-tab-group animationDuration="200ms" dynamicHeight>
          <!-- TAB: Usuarios y Roles -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">manage_accounts</mat-icon>
              Usuarios
            </ng-template>
            <div class="tab-content">
              <app-tab-usuarios></app-tab-usuarios>
            </div>
          </mat-tab>

          <!-- TAB: Roles y Accesos a Módulos -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">admin_panel_settings</mat-icon>
              Roles y Accesos
            </ng-template>
            <div class="tab-content">
              <app-tab-roles-permisos></app-tab-roles-permisos>
            </div>
          </mat-tab>

          <!-- TAB: Parámetros del Sistema -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">tune</mat-icon>
              Parámetros Globales
            </ng-template>
            <div class="tab-content">
              <app-tab-parametros></app-tab-parametros>
            </div>
          </mat-tab>

          <!-- TAB: Interoperabilidad -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">hub</mat-icon>
              Interoperabilidad
            </ng-template>
            <div class="tab-content">
              <app-tab-interoperabilidad></app-tab-interoperabilidad>
            </div>
          </mat-tab>

          <!-- TAB: Políticas de Seguridad -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">security</mat-icon>
              Políticas de Seguridad
            </ng-template>
            <div class="tab-content">
              <app-tab-seguridad></app-tab-seguridad>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem 2rem;
      width: 100%;
      max-width: 1600px;
      margin: 0 auto;
      box-sizing: border-box;
      min-height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
    }

    .page-header {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.5px;
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .content-card {
      background: var(--surface-card, #ffffff);
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
    }

    .tab-icon {
      margin-right: 8px;
    }

    .tab-content {
      padding: 1.5rem;
      min-height: 400px;
      width: 100%;
      box-sizing: border-box;
    }
    
    ::ng-deep .mat-mdc-tab-body-wrapper {
      width: 100%;
    }

    :host-context([data-theme="dark"]),
    :host-context(.dark-theme) {
      .content-card {
        background: #0f172a !important;
        border-color: #1e293b !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
      }
      .header-content h1 {
        color: #f8fafc !important;
      }
      .subtitle {
        color: #94a3b8 !important;
      }
      ::ng-deep .mat-mdc-tab-header {
        border-bottom-color: #1e293b !important;
      }
      ::ng-deep .mat-mdc-tab .mdc-tab__text-label {
        color: #94a3b8 !important;
      }
      ::ng-deep .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
        color: #60a5fa !important;
      }
    }
  `]
})
export class ConfiguracionLayoutComponent {}
