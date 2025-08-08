import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <!-- Botón para toggle sidebar -->
        <button mat-icon-button (click)="toggleSidebar.emit()" class="sidebar-toggle"
                [matTooltip]="sidebarExpanded ? 'Contraer menú' : 'Expandir menú'"
                aria-label="Alternar menú">
          <mat-icon aria-hidden="false">{{ sidebarExpanded ? 'menu_open' : 'menu' }}</mat-icon>
        </button>

        <!-- Título de la aplicación -->
        <h1 class="topbar-title">Sistema DRTC Puno</h1>
      </div>

      <div class="topbar-right">
        <!-- Notificaciones -->
        <div class="notifications" [matMenuTriggerFor]="notificationMenu">
          <mat-icon>notifications</mat-icon>
          <span class="notification-badge">3</span>
        </div>

        <mat-menu #notificationMenu="matMenu" class="notification-menu">
          <div class="notification-header">
            <h3>Notificaciones</h3>
          </div>
          <mat-divider></mat-divider>
          <div class="notification-list">
            <div class="notification-item">
              <mat-icon>info</mat-icon>
              <span>Nueva empresa registrada</span>
            </div>
            <div class="notification-item">
              <mat-icon>warning</mat-icon>
              <span>TUC próximo a vencer</span>
            </div>
            <div class="notification-item">
              <mat-icon>check_circle</mat-icon>
              <span>Fiscalización completada</span>
            </div>
          </div>
          <mat-divider></mat-divider>
          <button mat-button class="view-all-btn">Ver todas</button>
        </mat-menu>

        <div class="divider"></div>

        <!-- Menú de usuario -->
        <div class="user-menu" [matMenuTriggerFor]="userMenu">
          <div class="user-avatar">
            {{ currentUser?.nombres?.charAt(0) || 'U' }}
          </div>
          <div class="user-info">
            <p class="user-name">{{ currentUser?.nombres }} {{ currentUser?.apellidos }}</p>
            <p class="user-role">{{ getRoleDisplayName(currentUser?.rolId) }}</p>
          </div>
          <mat-icon>keyboard_arrow_down</mat-icon>
        </div>

        <mat-menu #userMenu="matMenu" class="user-menu">
          <div class="user-info">
            <h3>{{ currentUser?.nombres }} {{ currentUser?.apellidos }}</h3>
            <p>{{ currentUser?.email }}</p>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item class="menu-item">
            <mat-icon>person</mat-icon>
            <span>Mi Perfil</span>
          </button>
          <button mat-menu-item class="menu-item">
            <mat-icon>settings</mat-icon>
            <span>Configuración</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item class="menu-item logout-item" (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Cerrar Sesión</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      z-index: 1000;
      margin: 0;
      padding: 0;
      top: 0;
    }

    .topbar {
      background: linear-gradient(135deg, #0078d4 0%, #106ebe 50%, #005a9e 100%);
      border-bottom: 1px solid #106ebe;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      padding: 0 24px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: fixed;
      z-index: 1000;
      margin: 0;
      top: 0;
      left: 0;
      right: 0;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .sidebar-toggle {
      color: #e8f4fd;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      cursor: pointer;
      backdrop-filter: blur(10px);
    }

    .sidebar-toggle:hover {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .topbar-title {
      font-size: 20px;
      font-weight: 600;
      color: #ffffff;
      margin: 0;
      letter-spacing: 0.3px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 24px;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
    }

    .user-menu:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.35);
      transform: scale(1.02);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(96, 165, 250, 0.3);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: #ffffff;
      margin: 0;
      line-height: 1.2;
    }

    .user-role {
      font-size: 12px;
      color: #e8f4fd;
      margin: 0;
      line-height: 1.2;
    }

    .notifications {
      position: relative;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      color: #e8f4fd;
    }

    .notifications:hover {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
      transform: scale(1.05);
    }

    .notification-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: #e74c3c;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(231, 76, 60, 0.3);
    }

    .divider {
      width: 1px;
      height: 32px;
      background: rgba(232, 244, 253, 0.3);
      margin: 0 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .topbar {
        padding: 0 16px;
      }
      
      .topbar-title {
        font-size: 18px;
      }
      
      .user-info {
        display: none;
      }
    }
  `]
})
export class TopbarComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Input() sidebarExpanded = true; // Input para recibir el estado del sidebar
  
  currentUser: Usuario | null = null;
  notificationCount = 3;
  notifications = [
    { icon: 'business', message: 'Nueva empresa registrada: Transportes Puno S.A.C.' },
    { icon: 'security', message: 'Fiscalización pendiente en ruta Puno-Juliaca' },
    { icon: 'receipt', message: 'TUC próximo a vencer: T-000123-2024' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  getRoleDisplayName(roleId?: string): string {
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'fiscalizador': 'Fiscalizador',
      'usuario': 'Usuario'
    };
    return roles[roleId || ''] || 'Usuario';
  }

  verTodasNotificaciones(): void {
    this.router.navigate(['/notificaciones']);
  }

  verPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  cambiarContrasena(): void {
    this.router.navigate(['/cambiar-contrasena']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.snackBar.open('Sesión cerrada exitosamente', 'Cerrar', { duration: 3000 });
  }
} 