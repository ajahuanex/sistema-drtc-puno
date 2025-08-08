import { Component, ViewChild } from '@angular/core';
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
      <app-topbar 
        (toggleSidebar)="toggleSidebar()" 
        [sidebarExpanded]="sidebarExpanded">
      </app-topbar>

      <!-- Contenedor principal -->
      <div class="main-container">
        <!-- Sidebar -->
        <div class="sidebar" [class.collapsed]="!sidebarExpanded">
          <app-sidebar [isExpanded]="sidebarExpanded"></app-sidebar>
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
    }

    .main-container {
      flex: 1;
      display: flex;
      height: calc(100vh - 64px);
      margin-top: 64px;
    }

    .sidebar {
      width: 280px;
      background: transparent;
      transition: all 0.3s ease;
      flex-shrink: 0;
    }

    .sidebar.collapsed {
      width: 80px;
    }

    .content-area {
      flex: 1;
      background: transparent;
      transition: all 0.3s ease;
      overflow: auto;
    }

    .content-wrapper {
      padding: 20px;
      height: 100%;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        width: 250px;
      }

      .sidebar.collapsed {
        width: 60px;
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

      .sidebar.collapsed {
        width: 100%;
        max-width: 80px;
      }

      .content-wrapper {
        padding: 12px;
      }
    }
  `]
})
export class MainLayoutComponent {
  sidebarOpened = true;
  sidebarExpanded = true; // Sidebar expandido por defecto
  isMobile = false;

  constructor() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.sidebarOpened = false;
      this.sidebarExpanded = false;
    }
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      // En móvil, alternar entre abierto y cerrado
      this.sidebarOpened = !this.sidebarOpened;
    } else {
      // En desktop, alternar entre expandido y contraído
      this.sidebarExpanded = !this.sidebarExpanded;
      this.sidebarOpened = true; // Mantener siempre abierto en desktop
    }
  }
} 