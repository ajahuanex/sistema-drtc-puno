import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { AuthService } from '../../services/auth.service';

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
      <!-- 1. HEADER INSTITUCIONAL (Stitch Shell Maestro Spec) -->
      @if (isExpanded()) {
        <div class="sidebar-header">
          <div class="header-brand">
            <span class="brand-title font-display">SIRRETT</span>
            <div class="status-pill">
              <span class="pulse-container">
                <span class="ping-ring"></span>
                <span class="ping-dot"></span>
              </span>
              <span class="status-text">EN LÍNEA</span>
            </div>
          </div>
          <span class="version-tag font-tabular">v2.4</span>
        </div>

        <div class="sidebar-logo-container">
          <img src="assets/images/drtc-logo-light.png" alt="DRTC Puno" class="sidebar-drtc-logo">
        </div>
      } @else {
        <div class="sidebar-header-collapsed">
          <span class="collapsed-logo font-plate" [matTooltip]="'SIRRETT v2.4 (En Línea)'" matTooltipPosition="right">S</span>
        </div>
      }

      <!-- 2. LISTADO COMPLETO DE MENÚS (Preservado al 100%) -->
      <mat-nav-list class="nav-list sidebar-scroll">
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

      <!-- 3. FOOTER INSTITUCIONAL (Stitch Shell Maestro Spec) -->
      <div class="sidebar-footer" [class.collapsed]="!isExpanded()">
        @if (isExpanded()) {
          <div class="ip-row font-tabular">
            <div class="ip-info">
              <span class="ip-dot"></span>
              <span>IP: 190.119.245.12</span>
            </div>
            <span class="ip-badge">PUNO-REG</span>
          </div>

          <div class="footer-buttons">
            <a routerLink="/ayuda" class="footer-btn">
              <mat-icon>support_agent</mat-icon>
              <span>Soporte Técnico</span>
            </a>
            <button type="button" class="footer-btn logout" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Cerrar Sesión</span>
            </button>
          </div>

          <div class="legal-text">
            Región Puno • RNAT Ley N° 27181
          </div>
        } @else {
          <div class="collapsed-footer-actions">
            <a routerLink="/ayuda" class="rail-footer-btn" matTooltip="Soporte Técnico" matTooltipPosition="right">
              <mat-icon>support_agent</mat-icon>
            </a>
            <button type="button" class="rail-footer-btn logout" (click)="logout()" matTooltip="Cerrar Sesión" matTooltipPosition="right">
              <mat-icon>logout</mat-icon>
            </button>
            <div class="rail-status-dot" matTooltip="IP: 190.119.245.12 (PUNO-REG)" matTooltipPosition="right"></div>
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
      background: #0b1f44; /* Azul institucional maestro Stitch */
      border-right: 1px solid #152e60; 
      box-shadow: 2px 0 16px rgba(0, 0, 0, 0.25); 
      overflow: hidden; 
      user-select: none;
    }

    /* 1. Header Institucional */
    .sidebar-header {
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      background-color: #07152f;
      border-bottom: 1px solid #152e60;
      flex-shrink: 0;

      .header-brand {
        display: flex;
        align-items: center;
        gap: 8px;

        .brand-title {
          font-size: 17px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.04em;
        }

        .status-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 2px 7px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);

          .pulse-container {
            position: relative;
            display: flex;
            height: 7px;
            width: 7px;

            .ping-ring {
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              position: absolute;
              display: inline-flex;
              height: 100%;
              width: 100%;
              border-radius: 9999px;
              background-color: #34d399;
              opacity: 0.75;
            }

            .ping-dot {
              position: relative;
              display: inline-flex;
              border-radius: 9999px;
              height: 7px;
              width: 7px;
              background-color: #10b981;
            }
          }

          .status-text {
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.05em;
            color: #34d399;
          }
        }
      }

      .version-tag {
        font-size: 10.5px;
        font-weight: 600;
        color: #93c5fd;
        background: rgba(30, 58, 138, 0.6);
        border: 1px solid rgba(29, 78, 216, 0.5);
        padding: 1px 6px;
        border-radius: 4px;
      }
    }

    .sidebar-logo-container {
      padding: 10px 16px;
      background-color: #07152f;
      border-bottom: 1px solid #152e60;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .sidebar-drtc-logo {
        height: 28px;
        width: auto;
        object-fit: contain;
        filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3));
      }
    }

    .sidebar-header-collapsed {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #07152f;
      border-bottom: 1px solid #152e60;

      .collapsed-logo {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 16px;
        box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
      }
    }

    /* 2. Menú de navegación */
    .nav-list { 
      flex: 1;
      padding: 10px 0; 
      overflow-y: auto; 
      overflow-x: hidden; 
    }

    .nav-section { 
      padding: 12px 16px 4px 16px; 
    }

    .section-title { 
      margin: 0; 
      font-size: 10.5px; 
      font-weight: 700; 
      color: #93c5fd; 
      text-transform: uppercase; 
      letter-spacing: 0.08em; 
      font-family: 'Inter', sans-serif;
    }

    .nav-item { 
      margin: 2px 8px; 
      padding: 0 10px !important;
      border-radius: 6px; 
      transition: all 0.15s ease-in-out; 
      position: relative; 
      display: flex !important; 
      align-items: center !important; 
      height: 38px !important; 
      color: #cbd5e1 !important;
      text-decoration: none;
    }

    .nav-item:hover { 
      background-color: #153266; 
      color: #ffffff !important;
    }

    .nav-item.active-link { 
      background: #2563eb !important; 
      color: #ffffff !important; 
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4); 
    }

    .nav-icon { 
      color: #94a3b8; 
      transition: color 0.15s ease-in-out; 
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
      font-size: 15px !important; 
      width: 15px !important; 
      height: 15px !important; 
      color: #64748b !important; 
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
      font-size: 12.5px;
      font-weight: 500; 
      color: inherit; 
      transition: color 0.15s ease-in-out; 
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
      color: #94a3b8; 
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
      border-color: #152e60; 
    }

    .sidebar-scroll::-webkit-scrollbar { 
      width: 4px; 
    }

    .sidebar-scroll::-webkit-scrollbar-track { 
      background: transparent; 
    }

    .sidebar-scroll::-webkit-scrollbar-thumb { 
      background: #1e3a6e; 
      border-radius: 4px; 
    }

    .sidebar-scroll::-webkit-scrollbar-thumb:hover { 
      background: #2563eb; 
    }

    /* 3. Footer Institucional (Stitch Spec) */
    .sidebar-footer {
      background-color: #07152f;
      border-top: 1px solid #152e60;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;

      .ip-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 5px 8px;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.06);
        font-size: 10.5px;
        color: #cbd5e1;

        .ip-info {
          display: flex;
          align-items: center;
          gap: 6px;

          .ip-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #10b981;
          }
        }

        .ip-badge {
          background-color: #0b1f44;
          color: #93c5fd;
          border: 1px solid rgba(30, 64, 175, 0.4);
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 700;
        }
      }

      .footer-buttons {
        display: flex;
        gap: 6px;

        .footer-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s ease;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
            color: #94a3b8;
          }

          &:hover {
            background-color: #132d60;
            color: #ffffff;

            mat-icon {
              color: #ffffff;
            }
          }

          &.logout {
            color: #fda4af;

            mat-icon {
              color: #fb7185;
            }

            &:hover {
              background-color: rgba(239, 68, 68, 0.2);
              color: #ffffff;

              mat-icon {
                color: #ffffff;
              }
            }
          }
        }
      }

      .legal-text {
        text-align: center;
        font-size: 9.5px;
        color: #64748b;
        font-weight: 500;
      }

      &.collapsed {
        padding: 10px 0;
        align-items: center;

        .collapsed-footer-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;

          .rail-footer-btn {
            width: 34px;
            height: 34px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.05);
            border: none;
            color: #94a3b8;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.15s ease;

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }

            &:hover {
              background-color: #132d60;
              color: #ffffff;
            }

            &.logout:hover {
              background-color: rgba(239, 68, 68, 0.2);
              color: #fda4af;
            }
          }

          .rail-status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background-color: #10b981;
            box-shadow: 0 0 6px #10b981;
          }
        }
      }
    }

    @keyframes ping {
      75%, 100% {
        transform: scale(2);
        opacity: 0;
      }
    }
  `]
})
export class SidebarComponent {
  isExpanded = input<boolean>(true);
  expandedGroups = signal<Set<string>>(new Set(['rutas', 'resolucionesPrimigenias', 'vehiculosEmpresa']));
  
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.snackBar.open('Sesión cerrada exitosamente', 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }
}
