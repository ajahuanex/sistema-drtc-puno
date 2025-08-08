import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatTooltipModule
  ],
  template: `
    <!-- Navegación Principal -->
    <nav class="sidebar-nav" role="navigation">
      <mat-nav-list class="nav-list">
        
        <!-- Sección: Gestión Principal -->
        <div class="nav-section" *ngIf="isExpanded">
          <h3 class="section-title">Gestión Principal</h3>
        </div>
        
        <!-- Dashboard -->
        <a mat-list-item 
           routerLink="/dashboard" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded ? 'Dashboard' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">dashboard</mat-icon>
          <span matListItemTitle class="nav-text" *ngIf="isExpanded">Dashboard</span>
          <span matListItemMeta class="nav-badge" *ngIf="isExpanded">Nuevo</span>
        </a>

        <!-- Empresas -->
        <a mat-list-item 
           routerLink="/empresas" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded ? 'Empresas' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">business</mat-icon>
          <span matListItemTitle class="nav-text" *ngIf="isExpanded">Empresas</span>
        </a>

        <!-- Vehículos -->
        <a mat-list-item 
           routerLink="/vehiculos" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded ? 'Vehículos' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">directions_car</mat-icon>
          <span matListItemTitle class="nav-text" *ngIf="isExpanded">Vehículos</span>
        </a>

        <!-- Conductores -->
        <a mat-list-item 
           routerLink="/conductores" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded ? 'Conductores' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">person</mat-icon>
          <span matListItemTitle class="nav-text" *ngIf="isExpanded">Conductores</span>
        </a>

        <!-- TUCs -->
        <a mat-list-item 
           routerLink="/tucs" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded ? 'TUCs' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">receipt</mat-icon>
          <span matListItemTitle class="nav-text" *ngIf="isExpanded">TUCs</span>
        </a>

        <!-- Separador -->
        <mat-divider class="section-divider" *ngIf="isExpanded"></mat-divider>

        <!-- Sección: Operaciones -->
        <div class="nav-section" *ngIf="isExpanded">
          <h3 class="section-title">Operaciones</h3>
        </div>

        <!-- Fiscalizaciones -->
        <a mat-list-item 
           routerLink="/fiscalizaciones" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded ? 'Fiscalizaciones' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">security</mat-icon>
          <span matListItemTitle class="nav-text" *ngIf="isExpanded">Fiscalizaciones</span>
        </a>

        <!-- Reportes -->
        <a mat-list-item 
           routerLink="/reportes" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded ? 'Reportes' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">assessment</mat-icon>
          <span matListItemTitle class="nav-text" *ngIf="isExpanded">Reportes</span>
        </a>

        <!-- Separador -->
        <mat-divider class="section-divider" *ngIf="isExpanded"></mat-divider>

        <!-- Sección: Sistema -->
        <div class="nav-section" *ngIf="isExpanded">
          <h3 class="section-title">Sistema</h3>
        </div>

        <!-- Configuración -->
        <a mat-list-item 
           routerLink="/configuracion" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded ? 'Configuración' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">settings</mat-icon>
          <span matListItemTitle class="nav-text" *ngIf="isExpanded">Configuración</span>
        </a>

        <!-- Ayuda -->
        <a mat-list-item 
           routerLink="/ayuda" 
           routerLinkActive="active-link" 
           class="nav-item"
           [matTooltip]="!isExpanded ? 'Ayuda' : ''" 
           matTooltipPosition="right">
          <mat-icon matListItemIcon class="nav-icon">help</mat-icon>
          <span matListItemTitle class="nav-text" *ngIf="isExpanded">Ayuda</span>
        </a>
      </mat-nav-list>
    </nav>

    <!-- Footer del Sidebar -->
    <div class="sidebar-footer" *ngIf="isExpanded">
      <div class="footer-content">
        <div class="version-info">
          <p class="version-text">v1.0.0</p>
          <p class="status-text">Sistema Activo</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: linear-gradient(135deg, #0078d4 0%, #106ebe 50%, #005a9e 100%);
      border-right: 1px solid #106ebe;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 20px 0 0 0; /* Agregar padding-top para bajar el primer icono */
      height: 100%;
    }

    .nav-list {
      padding: 0;
      margin: 0;
    }

    .nav-section {
      padding: 16px 20px 8px 20px;
      margin-bottom: 8px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: #e8f4fd;
      margin: 0 0 12px 0;
      padding-left: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.8;
    }

    .nav-item {
      margin: 2px 16px;
      border-radius: 12px;
      height: 48px;
      position: relative;
      display: flex;
      align-items: center;
      text-decoration: none;
      color: #e8f4fd;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      cursor: pointer;
    }

    .nav-item::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
      pointer-events: none;
    }

    .nav-item:active::before {
      width: 300px;
      height: 300px;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      transform: translateX(4px);
    }

    .nav-item.active-link {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
      color: #ffffff !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      border-left: 4px solid #60a5fa;
    }

    .nav-item.active-link .nav-icon {
      color: #60a5fa;
    }

    .nav-icon {
      font-size: 22px;
      margin-right: 16px;
      color: #e8f4fd;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      width: 22px;
      height: 22px;
    }

    .nav-text {
      font-size: 15px;
      font-weight: 400;
      color: #e8f4fd;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      flex: 1;
      letter-spacing: 0.2px;
      line-height: 1.4;
    }

    .nav-item:hover .nav-text {
      color: #ffffff;
      font-weight: 500;
    }

    .nav-item.active-link .nav-text {
      color: #ffffff;
      font-weight: 600;
    }

    .nav-badge {
      background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
      color: white;
      border-radius: 12px;
      padding: 4px 8px;
      font-size: 10px;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0, 184, 148, 0.3);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .section-divider {
      margin: 16px 20px;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(232, 244, 253, 0.3) 50%, transparent 100%);
    }

    .sidebar-footer {
      padding: 20px;
      background: linear-gradient(135deg, rgba(0, 90, 158, 0.8) 0%, rgba(16, 110, 190, 0.6) 100%);
      border-top: 1px solid rgba(232, 244, 253, 0.2);
      position: relative;
      flex-shrink: 0;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .version-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .version-text {
      font-size: 11px;
      color: #e8f4fd;
      margin: 0;
      font-weight: 500;
    }

    .status-text {
      font-size: 11px;
      color: #00b894;
      font-weight: 600;
      margin: 2px 0 0 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .status-text::before {
      content: '';
      width: 6px;
      height: 6px;
      background-color: #00b894;
      border-radius: 50%;
      display: inline-block;
      animation: blink 2s infinite;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.3; }
    }

    /* Scrollbar personalizado solo cuando sea necesario */
    .sidebar-nav::-webkit-scrollbar {
      width: 4px;
    }

    .sidebar-nav::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-nav::-webkit-scrollbar-thumb {
      background: rgba(232, 244, 253, 0.3);
      border-radius: 2px;
    }

    .sidebar-nav::-webkit-scrollbar-thumb:hover {
      background: rgba(232, 244, 253, 0.5);
    }

    /* Estados responsive */
    @media (max-width: 768px) {
      .nav-item {
        margin: 2px 8px;
      }
      
      .section-title {
        padding-left: 8px;
      }
    }

    /* Animaciones de entrada */
    .nav-item {
      animation: slideIn 0.3s ease-out;
    }

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

    /* Efectos de hover mejorados */
    .nav-item:hover .nav-icon {
      transform: scale(1.1);
      color: #60a5fa;
    }

    .nav-item.active-link .nav-icon {
      transform: scale(1.1);
    }
  `]
})
export class SidebarComponent {
  @Input() isExpanded: boolean = true;
} 