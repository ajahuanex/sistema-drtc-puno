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
    <div class="app-container">
      <!-- Topbar fijo -->
      <div class="topbar-container">
        <app-topbar 
          (toggleSidebar)="toggleSidebar()" 
          [sidebarExpanded]="sidebarExpanded()">
        </app-topbar>
      </div>

      <!-- Contenedor principal -->
      <div class="main-container">
        <!-- Sidebar -->
        <div class="sidebar" [class.collapsed]="!sidebarExpanded()">
          <app-sidebar [isExpanded]="sidebarExpanded()"></app-sidebar>
        </div>

        <!-- Contenido principal -->
        <div class="content-area">
          <div class="content-wrapper">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-app, #f8fafc);
      color: var(--text-primary, #0f172a);
      margin: 0;
      padding: 0;
      overflow: hidden;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .topbar-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      z-index: 1001;
      background: var(--bg-surface, #ffffff);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
    }

    .main-container {
      flex: 1;
      display: flex;
      height: 100vh;
      padding-top: 60px;
      overflow: hidden;
    }

    .sidebar {
      width: 280px;
      background: #0f244a;
      transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.12);
      z-index: 1000;
    }

    .sidebar.collapsed {
      width: 68px;
    }

    .content-area {
      flex: 1;
      background: transparent;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
    }

    .content-wrapper {
      padding: 18px 24px;
      min-height: 100%;
      max-width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    }

    /* Scrollbar personalizado */
    .content-area::-webkit-scrollbar {
      width: 6px;
    }

    .content-area::-webkit-scrollbar-track {
      background: transparent;
    }

    .content-area::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.35);
      border-radius: 4px;
    }

    .content-area::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.55);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .content-wrapper {
        padding: 16px;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 280px;
        position: fixed;
        height: calc(100vh - 60px);
        z-index: 1000;
        transform: translateX(0);
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .sidebar.collapsed {
        width: 280px;
        transform: translateX(-100%);
      }

      .content-area {
        margin-left: 0;
      }

      .content-wrapper {
        padding: 12px;
      }
    }

    @media (max-width: 480px) {
      .sidebar {
        width: 100%;
        max-width: 280px;
      }

      .content-wrapper {
        padding: 10px;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  // Signals
  sidebarExpanded = signal(true);
  isMobile = signal(false);

  // Computed properties
  sidebarWidth = computed(() => {
    return this.sidebarExpanded() ? '280px' : '68px';
  });

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
    
    // En móvil, colapsar sidebar por defecto
    if (isMobileView && this.sidebarExpanded()) {
      this.sidebarExpanded.set(false);
    }
  }

  toggleSidebar(): void {
    this.sidebarExpanded.update(expanded => !expanded);
  }
}