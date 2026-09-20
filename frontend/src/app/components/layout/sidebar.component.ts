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
          <app-smart-icon matListItemIcon [iconName]="'dashboard'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Dashboard</span> }
        </a>

        <a mat-list-item routerLink="/empresas" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Empresas' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'business'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Empresas</span> }
        </a>

        <a mat-list-item routerLink="/infraestructura" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Infraestructura' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'location_city'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Infraestructura</span> }
        </a>

        <a mat-list-item routerLink="/vehiculos" routerLinkActive="active-link" class="nav-item nav-parent" [matTooltip]="!isExpanded() ? 'Vehículos' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'directions_car'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Vehículos</span> }
          @if (isExpanded()) { 
            <mat-icon class="expand-icon" [class.expanded]="expandedGroups().has('vehiculos')" (click)="toggleGroup('vehiculos', $event)">
              chevron_right
            </mat-icon> 
          }
        </a>

        @if (isExpanded() && expandedGroups().has('vehiculos')) {
          <a mat-list-item routerLink="/vehiculos/carga-masiva" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Carga Masiva Vehículos' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">arrow_right</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Carga Masiva Vehículos</span> }
          </a>
        }

        <a mat-list-item routerLink="/vehiculos-empresa" routerLinkActive="active-link" class="nav-item nav-parent" [matTooltip]="!isExpanded() ? 'Flota por Empresa' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'directions_bus'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Flota por Empresa</span> }
          @if (isExpanded()) { 
            <mat-icon class="expand-icon" [class.expanded]="expandedGroups().has('vehiculosEmpresa')" (click)="toggleGroup('vehiculosEmpresa', $event)">
              chevron_right
            </mat-icon> 
          }
        </a>

        @if (isExpanded() && expandedGroups().has('vehiculosEmpresa')) {
          <a mat-list-item routerLink="/vehiculos-empresa/carga-masiva" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Carga Masiva Flota' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">upload</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Carga Masiva Flota</span> }
          </a>
        }

        <a mat-list-item routerLink="/vehiculos-data" routerLinkActive="active-link" class="nav-item nav-parent" [matTooltip]="!isExpanded() ? 'Datos Técnicos Vehiculares' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'build'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Datos Técnicos Vehiculares</span> }
          @if (isExpanded()) { 
            <mat-icon class="expand-icon" [class.expanded]="expandedGroups().has('vehiculosSolo')" (click)="toggleGroup('vehiculosSolo', $event)">
              chevron_right
            </mat-icon> 
          }
        </a>

        @if (isExpanded() && expandedGroups().has('vehiculosSolo')) {
          <a mat-list-item routerLink="/vehiculos-data/carga-masiva" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Carga Masiva Datos Técnicos' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">arrow_right</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Carga Masiva Datos Técnicos</span> }
          </a>
        }

        <a mat-list-item routerLink="/tucs" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Tarjetas TUC' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'card_membership'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Tarjetas TUC</span> }
        </a>

        @if (isExpanded()) { <mat-divider class="section-divider"></mat-divider> }

        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Operaciones</h3>
          </div>
        }

        <a mat-list-item routerLink="/rutas" routerLinkActive="active-link" class="nav-item nav-parent" [matTooltip]="!isExpanded() ? 'Rutas' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'route'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Rutas</span> }
          @if (isExpanded()) { 
            <mat-icon class="expand-icon" [class.expanded]="expandedGroups().has('rutas')" (click)="toggleGroup('rutas', $event)">
              chevron_right
            </mat-icon> 
          }
        </a>

        @if (isExpanded() && expandedGroups().has('rutas')) {
          <a mat-list-item routerLink="/rutas/mapa" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Mapa de Rutas' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">map</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Mapa de Rutas</span> }
          </a>
          <a mat-list-item routerLink="/rutas/estadisticas" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Estadísticas' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">analytics</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Estadísticas</span> }
          </a>
          <a mat-list-item routerLink="/rutas/carga-masiva" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Carga Masiva' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">upload</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Carga Masiva</span> }
          </a>
        }

        <a mat-list-item routerLink="/localidades" routerLinkActive="active-link" class="nav-item nav-parent" [matTooltip]="!isExpanded() ? 'Localidades' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'place'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Localidades</span> }
          @if (isExpanded()) { 
            <mat-icon class="expand-icon" [class.expanded]="expandedGroups().has('localidades')" (click)="toggleGroup('localidades', $event)">
              chevron_right
            </mat-icon> 
          }
        </a>

        @if (isExpanded() && expandedGroups().has('localidades')) {
          <a mat-list-item routerLink="/localidades/alias" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Gestionar Alias' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">arrow_right</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Gestionar Alias</span> }
          </a>
          <a mat-list-item routerLink="/localidades/geometrias" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Gestionar Geometrías' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">arrow_right</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Gestionar Geometrías</span> }
          </a>
        }

        <a mat-list-item routerLink="/resoluciones-primigenias" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}" class="nav-item nav-parent" [matTooltip]="!isExpanded() ? 'Resoluciones Primigenias' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'auto_awesome'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Resoluciones Primigenias</span> }
          @if (isExpanded()) { 
            <mat-icon class="expand-icon" [class.expanded]="expandedGroups().has('resolucionesPrimigenias')" (click)="toggleGroup('resolucionesPrimigenias', $event)">
              chevron_right
            </mat-icon> 
          }
        </a>

        @if (isExpanded() && expandedGroups().has('resolucionesPrimigenias')) {
          <a mat-list-item routerLink="/resoluciones-primigenias/carga-masiva" routerLinkActive="active-link" class="nav-item sub-item" [matTooltip]="!isExpanded() ? 'Carga Masiva' : ''" matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon sub-icon">upload</mat-icon>
            @if (isExpanded()) { <span matListItemTitle class="nav-text">Carga Masiva</span> }
          </a>
        }

        <a mat-list-item routerLink="/resoluciones-hijas" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Resoluciones Hijas / Modificatorias' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'alt_route'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Resoluciones Hijas</span> }
        </a>

        <a mat-list-item routerLink="/resoluciones" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Resoluciones' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'description'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Resoluciones</span> }
        </a>

        <a mat-list-item routerLink="/expedientes" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Expedientes' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'folder'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Expedientes</span> }
        </a>

        @if (isExpanded()) { <mat-divider class="section-divider"></mat-divider> }

        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Control & Auditoría</h3>
          </div>
        }

        <a mat-list-item routerLink="/auditoria" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Auditoría del Sistema' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'verified_user'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Auditoría del Sistema</span> }
        </a>

        @if (isExpanded()) { <mat-divider class="section-divider"></mat-divider> }

        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Sistema</h3>
          </div>
        }

        <a mat-list-item routerLink="/configuracion" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Configuración' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'settings'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Configuración</span> }
        </a>

        <a mat-list-item routerLink="/perfil" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Perfil' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'account_circle'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Perfil</span> }
        </a>

        <a mat-list-item routerLink="/ayuda" routerLinkActive="active-link" class="nav-item" [matTooltip]="!isExpanded() ? 'Ayuda' : ''" matTooltipPosition="right">
          <app-smart-icon matListItemIcon [iconName]="'help'" [size]="18" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) { <span matListItemTitle class="nav-text">Ayuda</span> }
        </a>
      </mat-nav-list>

      <!-- Pie Institucional del Sidebar -->
      <div class="sidebar-footer" [class.collapsed]="!isExpanded()">
        @if (isExpanded()) {
          <div class="footer-badge">
            <span class="pulse-dot"></span>
            <span class="version-text font-tabular">SIRRETT v2.4 • DRTC Puno</span>
          </div>
        } @else {
          <div class="footer-badge-dot" [matTooltip]="'SIRRETT v2.4 - Región Puno'" matTooltipPosition="right">
            <span class="pulse-dot"></span>
          </div>
        }
      </div>
    </nav>
  `,
  styles: [`
    .sidebar-nav { 
      height: 100%; 
      display: flex;
      flex-direction: column;
      background: #0f244a; /* Azul institucional profundo Stitch */
      border-right: 1px solid rgba(255, 255, 255, 0.08); 
      box-shadow: 2px 0 12px rgba(0, 0, 0, 0.18); 
      overflow: hidden; 
      user-select: none;
    }

    .nav-list { 
      flex: 1;
      padding: 8px 0; 
      overflow-y: auto; 
      overflow-x: hidden; 
    }

    .nav-section { 
      padding: 12px 14px 4px 14px; 
    }

    .section-title { 
      margin: 0; 
      font-size: 10.5px; 
      font-weight: 700; 
      color: rgba(255, 255, 255, 0.45); 
      text-transform: uppercase; 
      letter-spacing: 0.08em; 
      font-family: 'Inter', sans-serif;
    }

    .nav-item { 
      margin: 2px 6px; 
      padding: 0 10px !important;
      border-radius: 6px; 
      transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1); 
      position: relative; 
      display: flex !important; 
      align-items: center !important; 
      height: 38px !important; 
      color: rgba(255, 255, 255, 0.82) !important;
      text-decoration: none;
    }

    .nav-item:hover { 
      background-color: rgba(255, 255, 255, 0.08); 
      color: #ffffff !important;
      transform: translateX(2px); 
    }

    .nav-item.active-link { 
      background: linear-gradient(90deg, rgba(30, 58, 138, 0.95) 0%, rgba(37, 99, 235, 0.9) 100%) !important; 
      color: #ffffff !important; 
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35); 
      border-left: 3px solid #60a5fa;
    }

    .nav-item.active-link:hover { 
      background: linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%) !important; 
      transform: translateX(2px); 
    }

    .nav-icon { 
      color: rgba(255, 255, 255, 0.65); 
      transition: color 0.18s ease-in-out; 
      display: inline-flex !important; 
      align-items: center !important; 
      justify-content: center !important; 
      margin-right: 10px; 
      flex-shrink: 0; 
      vertical-align: middle !important; 
    }

    .nav-item:hover .nav-icon,
    .nav-item.active-link .nav-icon { 
      color: #ffffff; 
    }

    .nav-item.sub-item .sub-icon { 
      font-size: 16px !important; 
      width: 16px !important; 
      height: 16px !important; 
      color: rgba(255, 255, 255, 0.45) !important; 
      margin-right: 8px !important; 
    }

    .nav-item.sub-item:hover .sub-icon,
    .nav-item.sub-item.active-link .sub-icon { 
      color: #93c5fd !important; 
    }

    .nav-item ::ng-deep app-smart-icon { 
      display: inline-flex !important; 
      align-items: center !important; 
      justify-content: center !important; 
      vertical-align: middle !important; 
    }

    .nav-item ::ng-deep .mdc-list-item__content { 
      display: flex !important; 
      align-items: center !important; 
      flex-direction: row !important; 
      width: 100%;
      padding: 0 !important;
      overflow: visible !important;
    }

    .nav-item ::ng-deep .mat-mdc-list-item-unscoped-content { 
      display: flex !important; 
      align-items: center !important; 
      flex-direction: row !important; 
      width: 100%;
      overflow: visible !important;
    }

    .nav-item ::ng-deep .mdc-list-item__primary-text {
      display: flex !important;
      align-items: center !important;
      flex: 1 1 auto;
      overflow: visible !important;
      white-space: nowrap !important;
    }

    .nav-text { 
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500; 
      color: inherit; 
      transition: color 0.18s ease-in-out; 
      white-space: nowrap;
      flex: 1;
    }

    .nav-item.sub-item { 
      margin-left: 18px; 
      padding-left: 8px !important; 
      border-left: 1.5px solid rgba(255, 255, 255, 0.12); 
      height: 34px !important;
      font-size: 12px;
    }

    .nav-item.sub-item:hover { 
      border-left-color: #60a5fa; 
    }

    .nav-item.sub-item.active-link { 
      background: rgba(37, 99, 235, 0.25) !important; 
      color: #93c5fd !important; 
      border-left: 2.5px solid #60a5fa !important; 
    }

    .expand-icon { 
      font-size: 16px; 
      width: 16px;
      height: 16px;
      color: rgba(255, 255, 255, 0.45); 
      cursor: pointer; 
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
      margin-left: auto; 
      margin-right: 0; 
      flex-shrink: 0; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
    }

    .expand-icon:hover {
      color: #ffffff;
    }

    .expand-icon.expanded { 
      transform: rotate(90deg); 
      color: #60a5fa;
    }

    .nav-parent { 
      display: flex !important; 
      align-items: center !important; 
    }

    .nav-parent .nav-text { 
      flex: 1; 
    }

    .section-divider { 
      margin: 8px 12px; 
      border-color: rgba(255, 255, 255, 0.08); 
    }

    .nav-list::-webkit-scrollbar { 
      width: 4px; 
    }

    .nav-list::-webkit-scrollbar-track { 
      background: transparent; 
    }

    .nav-list::-webkit-scrollbar-thumb { 
      background: rgba(255, 255, 255, 0.15); 
      border-radius: 2px; 
    }

    .nav-list::-webkit-scrollbar-thumb:hover { 
      background: rgba(255, 255, 255, 0.3); 
    }

    .sidebar-footer {
      padding: 10px 14px;
      background: rgba(0, 0, 0, 0.22);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      justify-content: center;

      .footer-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 9999px;
        padding: 4px 10px;

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }

        .version-text {
          font-size: 10.5px;
          color: rgba(255, 255, 255, 0.65);
          letter-spacing: 0.03em;
        }
      }

      &.collapsed {
        padding: 10px 0;

        .footer-badge-dot {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);

          .pulse-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 6px #10b981;
          }
        }
      }
    }

    @media (max-width: 768px) { 
      .nav-item { margin: 2px 4px; } 
      .nav-section { padding: 10px 12px 4px 12px; } 
    }
  `]
})
export class SidebarComponent {
  isExpanded = input<boolean>(true);
  expandedGroups = signal<Set<string>>(new Set(['rutas', 'resolucionesPrimigenias', 'vehiculosEmpresa']));
  
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
