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
      background: #f5f7fa;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    .topbar-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 64px;
      z-index: 1001;
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .main-container {
      flex: 1;
      display: flex;
      height: 100vh;
      padding-top: 64px;
      overflow: hidden;
    }

    .sidebar {
      width: 280px;
      background: transparent;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }

    .sidebar.collapsed {
      width: 80px;
    }

    .content-area {
      flex: 1;
      background: transparent;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: auto;
      position: relative;
    }

    .content-wrapper {
      padding: 16px;
      height: 100%;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Scrollbar personalizado */
    .content-area::-webkit-scrollbar {
      width: 8px;
    }

    .content-area::-webkit-scrollbar-track {
      background: transparent;
    }

    .content-area::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }

    .content-area::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .content-wrapper {
        padding: 20px;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 250px;
        position: fixed;
        height: 100%;
        z-index: 1000;
        transform: translateX(0);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .sidebar.collapsed {
        width: 250px;
        transform: translateX(-100%);
      }

      .content-area {
        margin-left: 0;
      }

      .content-wrapper {
        padding: 16px;
      }
    }

    @media (max-width: 480px) {
      .sidebar {
        width: 100%;
        max-width: 280px;
      }

      .content-wrapper {
        padding: 12px;
      }
    }

    /* Animaciones */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .content-wrapper {
      animation: fadeIn 0.3s ease-out;
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  // Signals
  sidebarExpanded = signal(true);
  isMobile = signal(false);

  // Computed properties
  sidebarWidth = computed(() => {
    return this.sidebarExpanded() ? '280px' : '80px';
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