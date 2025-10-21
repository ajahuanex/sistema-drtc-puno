import { Component, inject, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
    <!-- Navegación Principal -->
    <nav class="sidebar-nav" role="navigation">
      <mat-nav-list class="nav-list">
        
        <!-- Sección: Gestión Principal -->
        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Gestión Principal</h3>
          </div>
        }
        
        <!-- Dashboard -->
        <a mat-list-item 
           routerLink="/dashboard" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Dashboard' : ''" 
           matTooltipPosition="right">
          <app-smart-icon [iconName]="'dashboard'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) {
            <ng-container>
              <span matListItemTitle class="nav-text">Dashboard</span>
              <span matListItemMeta class="nav-badge">Principal</span>
            </ng-container>
          }
        </a>

        <!-- Empresas -->
        <a mat-list-item 
           routerLink="/empresas" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Empresas' : ''" 
           matTooltipPosition="right">
          <app-smart-icon [iconName]="'business'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Empresas</span>
          }
        </a>

        <!-- Dashboard Empresas -->
        @if (isExpanded()) {
          <a mat-list-item 
             routerLink="/empresas/dashboard" 
             routerLinkActive="active-link" 
             class="nav-item sub-item"
             [matTooltip]="!isExpanded() ? 'Dashboard Empresas' : ''" 
             matTooltipPosition="right">
            <mat-icon matListItemIcon class="nav-icon">dashboard</mat-icon>
            @if (isExpanded()) {
              <span matListItemTitle class="nav-text">Dashboard Empresas</span>
            }
          </a>
        }

        <!-- Vehículos -->
        <a mat-list-item 
           routerLink="/vehiculos" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Vehículos' : ''" 
           matTooltipPosition="right">
          <app-smart-icon [iconName]="'directions_car'" [size]="24" class="nav-icon"></app-smart-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Vehículos</span>
          }
        </a>

        <!-- Conductores -->
        <a mat-list-item 
           routerLink="/conductores" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Conductores' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">person</mat-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Conductores</span>
          }
        </a>

        <!-- TUCs -->
        <a mat-list-item 
           routerLink="/tucs" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'TUCs' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">receipt</mat-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">TUCs</span>
          }
        </a>

        <!-- Separador -->
        @if (isExpanded()) {
          <mat-divider class="section-divider"></mat-divider>
        }

        <!-- Sección: Operaciones -->
        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Operaciones</h3>
          </div>
        }

        <!-- Fiscalizaciones -->
        <a mat-list-item 
           routerLink="/fiscalizaciones" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Fiscalizaciones' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">security</mat-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Fiscalizaciones</span>
          }
        </a>

        <!-- Rutas -->
        <a mat-list-item 
           routerLink="/rutas" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Rutas' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">route</mat-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Rutas</span>
          }
        </a>

        <!-- Resoluciones -->
        <a mat-list-item 
           routerLink="/resoluciones" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Resoluciones' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">description</mat-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Resoluciones</span>
          }
        </a>

        <!-- Expedientes -->
        <a mat-list-item 
           routerLink="/expedientes" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Expedientes' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">folder</mat-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Expedientes</span>
          }
        </a>

        <!-- Separador -->
        @if (isExpanded()) {
          <mat-divider class="section-divider"></mat-divider>
        }

        <!-- Sección: Gestión de Oficinas -->
        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Gestión de Oficinas</h3>
          </div>
        }

        <!-- Oficinas -->
        <a mat-list-item 
           routerLink="/oficinas" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Oficinas' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">business</mat-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Oficinas</span>
          }
        </a>

        <!-- Flujo de Expedientes -->
        <a mat-list-item 
           routerLink="/oficinas/flujo" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Flujo de Expedientes' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">timeline</mat-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Flujo de Expedientes</span>
          }
        </a>

        <!-- Separador -->
        @if (isExpanded()) {
          <mat-divider class="section-divider"></mat-divider>
        }

        <!-- Sección: Reportes -->
        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Reportes</h3>
          </div>
        }

        <!-- Reportes -->
        <a mat-list-item 
           routerLink="/reportes" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Reportes' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">assessment</mat-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Reportes</span>
          }
        </a>

        <!-- Separador -->
        @if (isExpanded()) {
          <mat-divider class="section-divider"></mat-divider>
        }

        <!-- Sección: Sistema -->
        @if (isExpanded()) {
          <div class="nav-section">
            <h3 class="section-title">Sistema</h3>
          </div>
        }

        <!-- Configuración -->
        <a mat-list-item 
           routerLink="/configuracion" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Configuración' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">settings</mat-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Configuración</span>
          }
        </a>

        <!-- Perfil -->
        <a mat-list-item 
           routerLink="/perfil" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Perfil' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">account_circle</mat-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Perfil</span>
          }
        </a>

        <!-- Ayuda -->
        <a mat-list-item 
           routerLink="/ayuda" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded() ? 'Ayuda' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">help</mat-icon>
          @if (isExpanded()) {
            <span matListItemTitle class="nav-text">Ayuda</span>
          }
        </a>
      </mat-nav-list>
    </nav>
  `,
  styles: [`
    .sidebar-nav {
      height: 100%;
      background: white;
      border-radius: 0 16px 16px 0;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .nav-list {
      padding: 8px 0 0 0;
      height: 100%;
      overflow-y: auto;
    }

    .nav-section {
      padding: 8px 16px 8px 16px;
    }

    .section-title {
      margin: 0;
      font-size: 12px;
      font-weight: 600;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .nav-item {
      margin: 4px 8px;
      border-radius: 8px;
      transition: all 0.2s ease-in-out;
      position: relative;
    }

    .nav-item:hover {
      background-color: #f8f9fa;
      transform: translateX(4px);
    }

    .nav-item.active-link {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .nav-item.active-link:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      transform: translateX(4px);
    }

    .nav-icon {
      color: #6c757d;
      transition: color 0.2s ease-in-out;
    }

    .nav-item.active-link .nav-icon {
      color: white;
    }

    .nav-text {
      font-weight: 500;
      color: #2c3e50;
      transition: color 0.2s ease-in-out;
    }

    .nav-item.active-link .nav-text {
      color: white;
    }

    .nav-badge {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      padding: 3px 10px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
      }
      50% {
        box-shadow: 0 2px 12px rgba(40, 167, 69, 0.5);
      }
      100% {
        box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
      }
    }

    .section-divider {
      margin: 16px 8px;
      border-color: #e9ecef;
    }

    /* Scrollbar personalizado */
    .nav-list::-webkit-scrollbar {
      width: 4px;
    }

    .nav-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .nav-list::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    }

    .nav-list::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar-nav {
        border-radius: 0;
      }

      .nav-item {
        margin: 2px 4px;
      }

      .nav-section {
        padding: 12px 12px 6px 12px;
      }
    }

    /* Animaciones */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .nav-item {
      animation: slideIn 0.3s ease-out;
    }

    .nav-item:nth-child(1) { animation-delay: 0.1s; }
    .nav-item:nth-child(2) { animation-delay: 0.2s; }
    .nav-item:nth-child(3) { animation-delay: 0.3s; }
    .nav-item:nth-child(4) { animation-delay: 0.4s; }
    .nav-item:nth-child(5) { animation-delay: 0.5s; }
    .nav-item:nth-child(6) { animation-delay: 0.6s; }
    .nav-item:nth-child(7) { animation-delay: 0.7s; }
    .nav-item:nth-child(8) { animation-delay: 0.8s; }
    .nav-item:nth-child(9) { animation-delay: 0.9s; }
    .nav-item:nth-child(10) { animation-delay: 1.0s; }
    .nav-item:nth-child(11) { animation-delay: 1.1s; }
    .nav-item:nth-child(12) { animation-delay: 1.2s; }
    .nav-item:nth-child(13) { animation-delay: 1.3s; }
    .nav-item:nth-child(14) { animation-delay: 1.4s; }
    .nav-item:nth-child(15) { animation-delay: 1.5s; }
    .nav-item:nth-child(16) { animation-delay: 1.6s; }
    .nav-item:nth-child(17) { animation-delay: 1.7s; }
    .nav-item:nth-child(18) { animation-delay: 1.8s; }
    .nav-item:nth-child(19) { animation-delay: 1.9s; }
    .nav-item:nth-child(20) { animation-delay: 2.0s; }
  `]
})
export class SidebarComponent {
  private router = inject(Router);

  // Input signal using modern syntax
  isExpanded = input<boolean>(true);

  // Computed properties
  currentRoute = computed(() => {
    return this.router.url;
  });
} 