import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTooltipModule
  ],
  template: `
    <!-- Menú Lateral Institucional (w-64 = 260px, color institucional #0b1f44) -->
    <aside
      class="sidebar-nav"
      [class.sidebar-collapsed]="!isExpanded()"
      data-purpose="sidebar-nav"
      id="sidebar"
    >
      <div class="sidebar-top-container">
        <!-- 1. Encabezado del Menú Lateral Oficial -->
        @if (isExpanded()) {
          <div class="sidebar-header" data-purpose="sidebar-header">
            <div class="header-brand-group">
              <span class="brand-title font-display">SIRRETT</span>
              <div class="live-status-pill">
                <span class="pulse-wrapper">
                  <span class="ping-ring"></span>
                  <span class="ping-dot"></span>
                </span>
                <span class="status-label">EN LÍNEA</span>
              </div>
            </div>
            <span class="version-tag font-mono">v2.4</span>
          </div>

          <!-- Logotipo Oficial DRTC Puno centrado -->
          <div class="sidebar-logo-wrapper">
            <img
              alt="DRTC Puno"
              class="drtc-logo-img"
              src="assets/images/drtc-logo-sidebar-stitch.png"
            />
          </div>
        } @else {
          <!-- Header Colapsado -->
          <div class="sidebar-header-collapsed" [matTooltip]="'SIRRETT v2.4 (En Línea)'" matTooltipPosition="right">
            <span class="collapsed-badge">S</span>
          </div>
        }

        <!-- 2. Lista de Navegación Oficial -->
        <nav class="sidebar-nav-scroll sidebar-scroll" data-purpose="nav-sections">
          <!-- SECCIÓN: GESTIÓN DE TRANSPORTE -->
          <div class="nav-section-group">
            @if (isExpanded()) {
              <div class="section-heading">Gestión de Transporte</div>
            }

            <div class="section-links">
              <!-- 1. Dashboard General -->
              @if (canAccess('dashboard')) {
                <a
                  routerLink="/dashboard"
                  routerLinkActive="active"
                  class="nav-link-item group"
                  [matTooltip]="!isExpanded() ? 'Dashboard General' : ''"
                  matTooltipPosition="right"
                >
                  <svg class="item-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  @if (isExpanded()) {
                    <span class="item-title">Dashboard General</span>
                  }
                </a>
              }

              <!-- 2. Empresas de Transporte -->
              @if (canAccess('empresas')) {
                <a
                  routerLink="/empresas"
                  routerLinkActive="active"
                  class="nav-link-item group"
                  [matTooltip]="!isExpanded() ? 'Empresas de Transporte' : ''"
                  matTooltipPosition="right"
                >
                  <svg class="item-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  @if (isExpanded()) {
                    <span class="item-title">Empresas de Transporte</span>
                  }
                </a>
              }

              <!-- 3. Parque Automotor (Vehículos) -->
              @if (canAccess('vehiculos')) {
                <div class="nav-accordion-group">
                  <a
                    routerLink="/vehiculos"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: true }"
                    class="nav-link-item group"
                    [matTooltip]="!isExpanded() ? 'Parque Automotor' : ''"
                    matTooltipPosition="right"
                  >
                    <svg class="item-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                    </svg>
                    @if (isExpanded()) {
                      <span class="item-title">Parque Automotor</span>
                      <button
                        type="button"
                        class="accordion-toggle-btn"
                        (click)="toggleGroup('vehiculos', $event)"
                        title="Alternar opciones"
                      >
                        <svg class="chevron-svg" [class.rotated]="expandedGroups().has('vehiculos')" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                        </svg>
                      </button>
                    }
                  </a>

                  @if (isExpanded() && expandedGroups().has('vehiculos')) {
                    <div class="sub-items-container">
                      <a routerLink="/vehiculos-empresa" routerLinkActive="sub-active" class="sub-link">
                        <span class="sub-bullet"></span>
                        <span>Flota por Empresa</span>
                      </a>
                      <a routerLink="/vehiculos/carga-masiva" routerLinkActive="sub-active" class="sub-link">
                        <span class="sub-bullet"></span>
                        <span>Carga Masiva Flota</span>
                      </a>
                      <a routerLink="/vehiculos-data" routerLinkActive="sub-active" class="sub-link">
                        <span class="sub-bullet"></span>
                        <span>Datos Técnicos</span>
                      </a>
                    </div>
                  }
                </div>
              }

              <!-- 4. Resoluciones Directorales -->
              @if (canAccess('resoluciones')) {
                <div class="nav-accordion-group">
                  <a
                    routerLink="/resoluciones-primigenias"
                    routerLinkActive="active"
                    class="nav-link-item group"
                    [matTooltip]="!isExpanded() ? 'Resoluciones Directorales' : ''"
                    matTooltipPosition="right"
                  >
                    <svg class="item-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                    </svg>
                    @if (isExpanded()) {
                      <span class="item-title">Resoluciones Directorales</span>
                      <button
                        type="button"
                        class="accordion-toggle-btn"
                        (click)="toggleGroup('resoluciones', $event)"
                        title="Alternar opciones"
                      >
                        <svg class="chevron-svg" [class.rotated]="expandedGroups().has('resoluciones')" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                        </svg>
                      </button>
                    }
                  </a>

                  @if (isExpanded() && expandedGroups().has('resoluciones')) {
                    <div class="sub-items-container">
                      <a routerLink="/resoluciones" routerLinkActive="sub-active" class="sub-link">
                        <span class="sub-bullet"></span>
                        <span>Todas las Resoluciones</span>
                      </a>
                      <a routerLink="/resoluciones-primigenias/carga-masiva" routerLinkActive="sub-active" class="sub-link">
                        <span class="sub-bullet"></span>
                        <span>Carga Masiva Resoluciones</span>
                      </a>
                      <a routerLink="/resoluciones-hijas" routerLinkActive="sub-active" class="sub-link">
                        <span class="sub-bullet"></span>
                        <span>Resoluciones Hijas</span>
                      </a>
                      <a routerLink="/expedientes" routerLinkActive="sub-active" class="sub-link">
                        <span class="sub-bullet"></span>
                        <span>Expedientes</span>
                      </a>
                    </div>
                  }
                </div>
              }

              <!-- 5. Red Vial y Rutas -->
              @if (canAccess('rutas')) {
                <div class="nav-accordion-group">
                  <a
                    routerLink="/rutas"
                    routerLinkActive="active"
                    class="nav-link-item group"
                    [matTooltip]="!isExpanded() ? 'Red Vial y Rutas' : ''"
                    matTooltipPosition="right"
                  >
                    <svg class="item-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                    </svg>
                    @if (isExpanded()) {
                      <span class="item-title">Red Vial y Rutas</span>
                      <button
                        type="button"
                        class="accordion-toggle-btn"
                        (click)="toggleGroup('rutas', $event)"
                        title="Alternar opciones"
                      >
                        <svg class="chevron-svg" [class.rotated]="expandedGroups().has('rutas')" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                        </svg>
                      </button>
                    }
                  </a>

                  @if (isExpanded() && expandedGroups().has('rutas')) {
                    <div class="sub-items-container">
                      <a routerLink="/rutas/mapa" routerLinkActive="sub-active" class="sub-link">
                        <span class="sub-bullet"></span>
                        <span>Mapa de Rutas</span>
                      </a>
                      <a routerLink="/localidades" routerLinkActive="sub-active" class="sub-link">
                        <span class="sub-bullet"></span>
                        <span>Localidades</span>
                      </a>
                      <a routerLink="/rutas/carga-masiva" routerLinkActive="sub-active" class="sub-link">
                        <span class="sub-bullet"></span>
                        <span>Carga Masiva Rutas</span>
                      </a>
                      <a routerLink="/rutas/estadisticas" routerLinkActive="sub-active" class="sub-link">
                        <span class="sub-bullet"></span>
                        <span>Estadísticas</span>
                      </a>
                    </div>
                  }
                </div>
              }

              <!-- 6. Tarjetas TUC & QR -->
              @if (canAccess('tucs')) {
                <a
                  routerLink="/tucs"
                  routerLinkActive="active"
                  class="nav-link-item group"
                  [matTooltip]="!isExpanded() ? 'Tarjetas TUC & QR' : ''"
                  matTooltipPosition="right"
                >
                  <svg class="item-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  @if (isExpanded()) {
                    <span class="item-title">Tarjetas TUC &amp; QR</span>
                  }
                </a>
              }

              <!-- 7. Terminales Terrestres -->
              @if (canAccess('infraestructura')) {
                <a
                  routerLink="/infraestructura"
                  routerLinkActive="active"
                  class="nav-link-item group"
                  [matTooltip]="!isExpanded() ? 'Terminales Terrestres' : ''"
                  matTooltipPosition="right"
                >
                  <svg class="item-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  @if (isExpanded()) {
                    <span class="item-title">Terminales Terrestres</span>
                  }
                </a>
              }
            </div>
          </div>

          <!-- SECCIÓN: FISCALIZACIÓN & CONTROL -->
          <div class="nav-section-group">
            @if (isExpanded()) {
              <div class="section-heading">Fiscalización &amp; Control</div>
            }

            <div class="section-links">
              <!-- Catálogo Geoespacial -->
              @if (canAccess('localidades')) {
                <a
                  routerLink="/rutas/mapa"
                  routerLinkActive="active"
                  class="nav-link-item group"
                  [matTooltip]="!isExpanded() ? 'Catálogo Geoespacial' : ''"
                  matTooltipPosition="right"
                >
                  <svg class="item-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  @if (isExpanded()) {
                    <span class="item-title">Catálogo Geoespacial</span>
                  }
                </a>
              }

              <!-- Auditoría y Trazabilidad -->
              @if (canAccess('auditoria')) {
                <a
                  routerLink="/auditoria"
                  routerLinkActive="active"
                  class="nav-link-item group"
                  [matTooltip]="!isExpanded() ? 'Auditoría y Trazabilidad' : ''"
                  matTooltipPosition="right"
                >
                  <svg class="item-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  @if (isExpanded()) {
                    <span class="item-title">Auditoría y Trazabilidad</span>
                  }
                </a>
              }

              <!-- Configuración -->
              @if (canAccess('configuracion')) {
                <a
                  routerLink="/configuracion"
                  routerLinkActive="active"
                  class="nav-link-item group"
                  [matTooltip]="!isExpanded() ? 'Configuración' : ''"
                  matTooltipPosition="right"
                >
                  <svg class="item-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                  @if (isExpanded()) {
                    <span class="item-title">Configuración</span>
                  }
                </a>
              }

            </div>
          </div>
        </nav>
      </div>

      <!-- 3. Pie del Menú Lateral (Footer Oficial Stitch) -->
      @if (isExpanded()) {
        <div class="sidebar-footer-container" data-purpose="sidebar-footer">
          <!-- Bloque de Conexión de Red / IP -->
          <div class="ip-indicator-box font-mono">
            <div class="ip-left">
              <span class="ip-live-dot"></span>
              <span>IP: 190.237.45.18</span>
            </div>
            <span class="ip-region-badge">PUNO-REG</span>
          </div>

          <!-- Botones de Acción Rápida -->
          <div class="footer-action-buttons">
            <button
              class="footer-btn"
              type="button"
              routerLink="/ayuda"
            >
              <svg class="footer-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
              </svg>
              <span>Soporte Técnico</span>
            </button>

            <button
              class="footer-btn logout-btn"
              type="button"
              (click)="logout()"
            >
              <svg class="footer-svg logout-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>

          <!-- Nota Legal Normativa -->
          <div class="legal-disclaimer">
            Región Puno • RNAT Ley N° 27181
          </div>
        </div>
      } @else {
        <!-- Footer Modo Colapsado (Rail) -->
        <div class="sidebar-footer-collapsed">
          <button class="rail-footer-btn" routerLink="/ayuda" [matTooltip]="'Soporte Técnico'" matTooltipPosition="right">
            <svg class="footer-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
            </svg>
          </button>
          <button class="rail-footer-btn logout" (click)="logout()" [matTooltip]="'Cerrar Sesión'" matTooltipPosition="right">
            <svg class="footer-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
            </svg>
          </button>
          <span class="rail-dot" [matTooltip]="'IP: 190.237.45.18 (PUNO-REG)'" matTooltipPosition="right"></span>
        </div>
      }
    </aside>
  `,
  styles: [`
    @keyframes ping {
      75%, 100% {
        transform: scale(2);
        opacity: 0;
      }
    }

    .sidebar-nav {
      width: 100%;
      height: 100%;
      background-color: #0b1f44;
      border-right: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      user-select: none;
      overflow: hidden;

      &.sidebar-collapsed {
        width: 100%;
      }
    }

    .sidebar-top-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    // 1. Header
    .sidebar-header {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      border-bottom: 1px solid #152e60;
      background-color: #07152f;
      flex-shrink: 0;

      .header-brand-group {
        display: flex;
        align-items: center;
        gap: 8px;

        .brand-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: #ffffff;
          font-family: 'Space Grotesk', 'Inter', sans-serif;
        }

        .live-status-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 2px 8px;
          border-radius: 9999px;
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          font-size: 10px;
          font-weight: 500;
          color: #34d399;

          .pulse-wrapper {
            position: relative;
            display: flex;
            height: 8px;
            width: 8px;

            .ping-ring {
              position: absolute;
              display: inline-flex;
              height: 100%;
              width: 100%;
              border-radius: 9999px;
              background-color: #34d399;
              opacity: 0.75;
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            }

            .ping-dot {
              position: relative;
              display: inline-flex;
              border-radius: 9999px;
              height: 8px;
              width: 8px;
              background-color: #10b981;
            }
          }

          .status-label {
            letter-spacing: 0.05em;
            font-weight: 600;
          }
        }
      }

      .version-tag {
        font-size: 11px;
        color: #bfdbfe;
        background-color: rgba(30, 58, 138, 0.6);
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid rgba(29, 78, 216, 0.5);
      }
    }

    .sidebar-header-collapsed {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #07152f;
      border-bottom: 1px solid #152e60;

      .collapsed-badge {
        width: 34px;
        height: 34px;
        border-radius: 6px;
        background: #2563eb;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 16px;
      }
    }

    // Logo DRTC Puno
    .sidebar-logo-wrapper {
      padding: 12px 16px;
      border-bottom: 1px solid #152e60;
      background-color: #07152f;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .drtc-logo-img {
        height: 32px;
        width: auto;
        object-fit: contain;

        @media (min-width: 1024px) {
          height: 36px;
        }
      }
    }

    // Navegación
    .sidebar-nav-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      font-size: 14px;
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

    .nav-section-group {
      .section-heading {
        padding: 0 12px 8px 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #93c5fd;
      }

      .section-links {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
    }

    .nav-link-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      color: #e2e8f0;
      font-weight: 500;
      font-size: 12px;
      text-decoration: none;
      transition: background-color 0.15s ease, color 0.15s ease;
      cursor: pointer;

      &:hover {
        color: #ffffff;
        background-color: #153266;

        .item-svg {
          color: #ffffff;
        }
      }

      &.active {
        background-color: #2563eb;
        color: #ffffff;
        box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);

        .item-svg {
          color: #ffffff;
        }
      }

      .item-svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        color: #cbd5e1;
        transition: color 0.15s ease;
      }

      .item-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }

      .accordion-toggle-btn {
        background: transparent;
        border: none;
        padding: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        color: #94a3b8;
        margin-left: auto;

        &:hover {
          color: #ffffff;
        }

        .chevron-svg {
          width: 14px;
          height: 14px;
          transition: transform 0.2s ease;

          &.rotated {
            transform: rotate(90deg);
          }
        }
      }
    }

    .sub-items-container {
      margin-left: 28px;
      padding-left: 8px;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 2px;
      margin-bottom: 4px;

      .sub-link {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 500;
        color: #cbd5e1;
        text-decoration: none;
        transition: all 0.15s ease;

        &:hover {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.05);
        }

        &.sub-active {
          color: #93c5fd;
          font-weight: 600;
          background-color: rgba(37, 99, 235, 0.2);
        }

        .sub-bullet {
          width: 4px;
          height: 4px;
          border-radius: 9999px;
          background-color: #60a5fa;
        }
      }
    }

    // 3. Footer
    .sidebar-footer-container {
      border-top: 1px solid #152e60;
      background-color: #07152f;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 12px;
      flex-shrink: 0;

      .ip-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 10px;
        border-radius: 4px;
        background-color: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 10px;
        color: #cbd5e1;

        .ip-left {
          display: flex;
          align-items: center;
          gap: 6px;

          .ip-live-dot {
            height: 6px;
            width: 6px;
            border-radius: 9999px;
            background-color: #10b981;
          }
        }

        .ip-region-badge {
          background-color: #0b1f44;
          color: #93c5fd;
          border: 1px solid rgba(30, 64, 175, 0.4);
          padding: 1px 6px;
          border-radius: 2px;
          font-size: 9px;
          font-weight: 600;
        }
      }

      .footer-action-buttons {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .footer-btn {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 8px;
          color: #e2e8f0;
          font-weight: 500;
          font-size: 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;

          &:hover {
            color: #ffffff;
            background-color: #132d60;
          }

          .footer-svg {
            width: 16px;
            height: 16px;
            margin-right: 10px;
            color: #94a3b8;
          }

          &.logout-btn {
            color: #fda4af;

            &:hover {
              color: #ffe4e6;
              background-color: #132d60;
            }

            .logout-svg {
              color: #fb7185;
            }
          }
        }
      }

      .legal-disclaimer {
        padding-top: 4px;
        font-size: 10px;
        text-align: center;
        color: #94a3b8;
        font-weight: 500;
      }
    }

    .sidebar-footer-collapsed {
      padding: 12px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      border-top: 1px solid #152e60;
      background-color: #07152f;

      .rail-footer-btn {
        width: 36px;
        height: 36px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.05);
        border: none;
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        &:hover {
          color: #ffffff;
          background: #132d60;
        }

        &.logout {
          color: #fb7185;
        }

        .footer-svg {
          width: 18px;
          height: 18px;
        }
      }

      .rail-dot {
        width: 8px;
        height: 8px;
        border-radius: 9999px;
        background-color: #10b981;
      }
    }
  `]
})
export class SidebarComponent {
  isExpanded = input<boolean>(true);
  expandedGroups = signal<Set<string>>(new Set<string>());

  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  canAccess(modulo: string): boolean {
    return this.authService.canAccessModule(modulo);
  }

  toggleGroup(group: string, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.expandedGroups.update(groups => {
      const newGroups = new Set(groups);
      if (newGroups.has(group)) {
        newGroups.delete(group);
      } else {
        newGroups.add(group);
      }
      return newGroups;
    });
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
