import { Component, ViewChild, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSnackBarModule,
    SidebarComponent,
    TopbarComponent
  ],
  template: `
    <div class="master-layout-container" data-purpose="master-container">
      <!-- 1. Menú Lateral Institucional (w-64 = 260px, de arriba a abajo 100vh) -->
      <aside
        class="sidebar-wrapper"
        [class.collapsed]="!sidebarExpanded()"
        data-purpose="sidebar-nav"
        id="sidebar"
      >
        <app-sidebar [isExpanded]="sidebarExpanded()"></app-sidebar>
      </aside>

      <!-- 2. Contenedor Principal Derecho (Topbar + Contenido) -->
      <div class="right-viewport">
        <!-- Topbar Oficial (h-16 = 64px, fondo blanco, border-b) -->
        <header class="topbar-wrapper" data-purpose="topbar">
          <app-topbar 
            (toggleSidebar)="toggleSidebar()" 
            [sidebarExpanded]="sidebarExpanded()">
          </app-topbar>
        </header>

        <!-- Canvas de Contenido con Scroll Independiente -->
        <main class="main-canvas" data-purpose="main-workspace-canvas">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .master-layout-container {
      height: 100vh;
      width: 100vw;
      display: flex;
      flex-direction: row;
      overflow: hidden;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }

    // 1. Sidebar va de arriba a abajo completo (100vh)
    .sidebar-wrapper {
      width: 260px;
      height: 100vh;
      flex-shrink: 0;
      background-color: #0b1f44;
      border-right: 1px solid #152e60;
      z-index: 30;
      transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
      position: relative;
    }

    .sidebar-wrapper.collapsed {
      width: 64px;
    }

    // 2. Viewport derecho con Topbar arriba y Canvas de Contenido abajo
    .right-viewport {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      height: 100vh;
      overflow: hidden;
      background-color: #f8fafc;
    }

    .topbar-wrapper {
      height: 64px;
      flex-shrink: 0;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      z-index: 20;
    }

    .main-canvas {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      background-color: #f8fafc;
      position: relative;
    }

    /* Scrollbar estilizado institucional */
    .main-canvas::-webkit-scrollbar {
      width: 6px;
    }

    .main-canvas::-webkit-scrollbar-track {
      background: transparent;
    }

    .main-canvas::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.35);
      border-radius: 4px;
    }

    .main-canvas::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.55);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 1000;
        transform: translateX(0);
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .sidebar-wrapper.collapsed {
        transform: translateX(-100%);
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  sidebarExpanded = signal(true);
  isMobile = signal(false);

  private resizeObserver?: ResizeObserver;

  ngOnInit(): void {
    this.checkScreenSize();
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkScreenSize();
      });
      this.resizeObserver.observe(document.body);
    }
  }

  private checkScreenSize(): void {
    const width = window.innerWidth;
    const isMobileView = width <= 768;
    this.isMobile.set(isMobileView);
    if (isMobileView && this.sidebarExpanded()) {
      this.sidebarExpanded.set(false);
    }
  }

  toggleSidebar(): void {
    this.sidebarExpanded.update(expanded => !expanded);
  }
}