import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { SmartIconComponent } from '../../shared/smart-icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    SmartIconComponent
  ],
  template: `
    <nav class="sidebar-nav" role="navigation">
      <mat-nav-list class="nav-list">
        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Gestión Principal</h3>
          </div>
        }
        
        <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Dashboard' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'dashboard'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Dashboard</span> }
        </a>

        <a mat-list-item routerLink="/empresas" routerLinkActive="active-link" class="nav-item nav-parent" [matTooltip]="!isExpanded() ? 'Empresas' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'business'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Empresas</span> }
          @if (isExpanded()) { <mat-icon class="expand-icon" [class.expanded]="expandedGroups().has('empresas')" (click)="toggleGroup('empresas', $event)">chevron_right</mat-icon> }
        </a>

        @if (isExpanded() && expandedGroups().has('empresas')) {
          <a mat-list-item routerLink="/empresas/dashboard" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Dashboard Empresas' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">arrow_right</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Dashboard Empresas</span> }
          </a>
        }

        <a mat-list-item routerLink="/infraestructura" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Infraestructura' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'location_city'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Infraestructura</span> }
        </a>

        <a mat-list-item routerLink="/vehiculos" routerLinkActive="active-link" class="nav-item nav-parent" [matTooltip]="!isExpanded() ? 'Vehículos' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'directions_car'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Vehículos</span> }
          @if (isExpanded()) { <mat-icon class="expand-icon" [class.expanded]="expandedGroups().has('vehiculos')" (click)="toggleGroup('vehiculos', $event)">chevron_right</mat-icon> }
        </a>

        @if (isExpanded() && expandedGroups().has('vehiculos')) {
          <a mat-list-item routerLink="/vehiculos/carga-masiva" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Carga Masiva Vehículos' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">arrow_right</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Carga Masiva Vehículos</span> }
          </a>
        }

        <a mat-list-item routerLink="/vehiculos-solo" routerLinkActive="active-link" class="nav-item nav-parent" [matTooltip]="!isExpanded() ? 'Datos Técnicos Vehiculares' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'build'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Datos Técnicos Vehiculares</span> }
          @if (isExpanded()) { <mat-icon class="expand-icon" [class.expanded]="expandedGroups().has('vehiculosSolo')" (click)="toggleGroup('vehiculosSolo', $event)">chevron_right</mat-icon> }
        </a>

        @if (isExpanded() && expandedGroups().has('vehiculosSolo')) {
          <a mat-list-item routerLink="/vehiculos-solo/carga-masiva" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Carga Masiva Datos Técnicos' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">arrow_right</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Carga Masiva Datos Técnicos</span> }
          </a>
        }

        <a mat-list-item routerLink="/historial-vehiculos" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Historial Vehicular' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'history'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Historial Vehicular</span> }
        </a>

        <a mat-list-item routerLink="/vehiculos/solicitudes-baja" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Solicitudes de Baja' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'assignment'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Solicitudes de Baja</span> }
        </a>

        <a mat-list-item routerLink="/conductores" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Conductores' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'person'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Conductores</span> }
        </a>

        <a mat-list-item routerLink="/tucs" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'TUCs' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'receipt'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">TUCs</span> }
        </a>

        @if (isExpanded()) { <mat-divider class="section-divider"></mat-divider> }

        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Operaciones</h3>
          </div>
        }

        <a mat-list-item routerLink="/fiscalizaciones" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Fiscalizaciones' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'security'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Fiscalizaciones</span> }
        </a>

        <a mat-list-item routerLink="/rutas" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Rutas' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'route'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Rutas</span> }
        </a>

        <a mat-list-item routerLink="/localidades" routerLinkActive="active-link" class="nav-item nav-parent" [matTooltip]="!isExpanded() ? 'Localidades' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'place'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Localidades</span> }
          @if (isExpanded()) { <mat-icon class="expand-icon" [class.expanded]="expandedGroups().has('localidades')" (click)="toggleGroup('localidades', $event)">chevron_right</mat-icon> }
        </a>

        @if (isExpanded() && expandedGroups().has('localidades')) {
          <a mat-list-item routerLink="/localidades/alias" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Gestionar Alias' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">arrow_right</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Gestionar Alias</span> }
          </a>
        }

        @if (isExpanded() && expandedGroups().has('localidades')) {
          <a mat-list-item routerLink="/localidades/geometrias" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Gestionar Geometrías' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">arrow_right</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Gestionar Geometrías</span> }
          </a>
        }

        <a mat-list-item routerLink="/resoluciones" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Resoluciones' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'description'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Resoluciones</span> }
        </a>

        <a mat-list-item routerLink="/expedientes" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Expedientes' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'folder'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Expedientes</span> }
        </a>

        @if (isExpanded()) { <mat-divider class="section-divider"></mat-divider> }

        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Gestión de Oficinas</h3>
          </div>
        }

        <a mat-list-item routerLink="/oficinas" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Oficinas' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'business'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Oficinas</span> }
        </a>

        <a mat-list-item routerLink="/oficinas/flujo" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Flujo de Expedientes' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'timeline'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Flujo de Expedientes</span> }
        </a>

        @if (isExpanded()) { <mat-divider class="section-divider"></mat-divider> }

        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Reportes</h3>
          </div>
        }

        <a mat-list-item routerLink="/reportes" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Reportes' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'assessment'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Reportes</span> }
        </a>

        @if (isExpanded()) { <mat-divider class="section-divider"></mat-divider> }

        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Sistema</h3>
          </div>
        }

        <a mat-list-item routerLink="/configuracion" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Configuración' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'settings'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Configuración</span> }
        </a>

        <a mat-list-item routerLink="/perfil" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Perfil' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'account_circle'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Perfil</span> }
        </a>

        <a mat-list-item routerLink="/ayuda" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Ayuda' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'help'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Ayuda</span> }
        </a>
      </mat-nav-list>
    </nav>
  `,
  styles: [`
    .sidebar-nav { height: 100%; background: white; border-radius: 0 16px 16px 0; box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .nav-list { padding: 8px 0 0 0; height: 100%; overflow-y: auto; }
    .nav-section { padding: 8px 16px 8px 16px; }
    .section-title { margin: 0; font-size: 12px; font-weight: 600; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; }
    .nav-item { margin: 4px 8px; border-radius: 8px; transition: all 0.2s ease-in-out; position: relative; display: flex !important; align-items: center !important; height: 48px !important; }
    .nav-item:hover { background-color: #f8f9fa; transform: translateX(4px); }
    .nav-item.active-link { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); }
    .nav-item.active-link:hover { background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%); transform: translateX(4px); }
    .nav-icon { color: #6c757d; transition: color 0.2s ease-in-out; display: inline-flex !important; align-items: center !important; justify-content: center !important; margin-right: 16px; flex-shrink: 0; vertical-align: middle !important; }
    .nav-item.active-link .nav-icon { color: white; }
    .nav-item.sub-item .sub-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; color: #adb5bd !important; margin-right: 12px !important; }
    .nav-item.sub-item.active-link .sub-icon { color: rgba(255, 255, 255, 0.8) !important; }
    .nav-item ::ng-deep app-smart-icon { display: inline-flex !important; align-items: center !important; justify-content: center !important; vertical-align: middle !important; }
    .nav-item ::ng-deep .mdc-list-item__content { display: flex !important; align-items: center !important; flex-direction: row !important; }
    .nav-item ::ng-deep .mat-mdc-list-item-unscoped-content { display: flex !important; align-items: center !important; flex-direction: row !important; }
    .nav-text { font-weight: 500; color: #2c3e50; transition: color 0.2s ease-in-out; }
    .nav-item.active-link .nav-text { color: white; }
    .nav-item.sub-item { margin-left: 24px; padding-left: 16px; border-left: 2px solid #e9ecef; font-size: 0.9em; }
    .nav-item.sub-item:hover { border-left-color: #667eea; }
    .nav-item.sub-item.active-link { border-left-color: #667eea; }
    .expand-icon { font-size: 16px; color: #adb5bd; cursor: pointer; transition: transform 0.2s ease-in-out; margin-left: auto; margin-right: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .expand-icon.expanded { transform: rotate(90deg); }
    .nav-parent { display: flex !important; align-items: center !important; }
    .nav-parent .nav-text { flex: 1; }
    .section-divider { margin: 16px 8px; border-color: #e9ecef; }
    .nav-list::-webkit-scrollbar { width: 4px; }
    .nav-list::-webkit-scrollbar-track { background: transparent; }
    .nav-list::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.2); border-radius: 2px; }
    .nav-list::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.3); }
    @media (max-width: 768px) { .sidebar-nav { border-radius: 0; } .nav-item { margin: 2px 4px; } .nav-section { padding: 12px 12px 6px 12px; } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    .nav-item { animation: slideIn 0.3s ease-out; }
  `]
})
export class SidebarComponent {
  isExpanded = input<boolean>(true);
  expandedGroups = signal<Set<string>>(new Set());
  
  toggleGroup(groupName: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const current = this.expandedGroups();
    const newSet = new Set(current);
    if (newSet.has(groupName)) {
      newSet.delete(groupName);
    } else {
      newSet.add(groupName);
    }
    this.expandedGroups.set(newSet);
  }
}
