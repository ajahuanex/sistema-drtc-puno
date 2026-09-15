import { Component, EventEmitter, Output, OnInit, Input, inject, signal, computed } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { DatabaseStatusService } from '../../services/database-status.service';
import { Usuario } from '../../models/usuario.model';
import { ChangeDetectionStrategy } from '@angular/core';

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
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    FormsModule
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

        <!-- Logo y título de la aplicación -->
        <div class="topbar-brand">
          <img src="assets/logo-test.svg" alt="SIRRET Logo" class="topbar-logo">
          <h1 class="topbar-title">SIRRET</h1>
        </div>
      </div>

      <div class="topbar-center">
        <!-- Selector de temas -->
        <div class="theme-selector">
          <mat-form-field appearance="outline" class="theme-form-field">
            <mat-label>Tema</mat-label>
            <mat-select [(ngModel)]="selectedTheme" (selectionChange)="onThemeChange($event.value)">
              @for (theme of availableThemes(); track theme.name) {
                <mat-option [value]="theme.name">
                  <div class="theme-option">
                    <div class="theme-preview" [style.background]="theme.primary">
                      <div class="theme-accent" [style.background]="theme.accent"></div>
                    </div>
                    <span>{{ getThemeDisplayName(theme.name) }}</span>
                  </div>
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Toggle modo oscuro -->
        <div class="dark-mode-toggle">
          <mat-slide-toggle
            [checked]="isDarkMode()"
            (change)="toggleDarkMode()"
            color="primary"
            [matTooltip]="isDarkMode() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          >
            <mat-icon>{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </mat-slide-toggle>
        </div>

        <!-- Switch Base de Datos MongoDB (Local vs Remoto) -->
        <div class="db-switch-container">
          <button
            type="button"
            class="db-chip"
            [class.db-chip-remote]="dbService.isRemote()"
            [class.db-chip-local]="!dbService.isRemote()"
            [matMenuTriggerFor]="dbMenu"
            matTooltip="Base de datos MongoDB activa. Clic para alternar"
          >
            <span class="db-status-dot" [class.online]="dbService.isConnected()"></span>
            <mat-icon class="db-icon">{{ dbService.isRemote() ? 'cloud' : 'dns' }}</mat-icon>
            <span class="db-name">{{ dbService.isRemote() ? 'BD Remota' : 'BD Local' }}</span>
            @if (dbService.pingMs() !== null) {
              <span class="db-ping">{{ dbService.pingMs() }}ms</span>
            }
            <mat-icon class="db-chevron">arrow_drop_down</mat-icon>
          </button>

          <mat-menu #dbMenu="matMenu" class="db-menu-dropdown">
            <div class="db-menu-header" (click)="$event.stopPropagation()">
              <div class="db-menu-title">
                <mat-icon>storage</mat-icon>
                <span>Conexión MongoDB</span>
              </div>
              <span class="db-badge" [class.badge-remote]="dbService.isRemote()" [class.badge-local]="!dbService.isRemote()">
                {{ dbService.isRemote() ? 'REMOTA' : 'LOCAL' }}
              </span>
            </div>

            <div class="db-menu-details" (click)="$event.stopPropagation()">
              <div class="db-detail-row">
                <span class="label">Host:</span>
                <span class="val">{{ dbService.host() }}</span>
              </div>
              <div class="db-detail-row">
                <span class="label">Estado:</span>
                <span class="val" [class.text-green]="dbService.isConnected()" [class.text-red]="!dbService.isConnected()">
                  {{ dbService.isConnected() ? 'Conectado ✅' : 'Desconectado ❌' }}
                </span>
              </div>
              @if (dbService.pingMs() !== null) {
                <div class="db-detail-row">
                  <span class="label">Latencia:</span>
                  <span class="val">{{ dbService.pingMs() }} ms</span>
                </div>
              }
            </div>

            <mat-divider></mat-divider>

            <button mat-menu-item (click)="switchDatabase('remote')" [disabled]="dbService.isRemote() || dbService.isSwitching()">
              <mat-icon color="primary">cloud</mat-icon>
              <span>Conectar a Servidor Remoto (161.132.52.69)</span>
            </button>

            <button mat-menu-item (click)="switchDatabase('local')" [disabled]="!dbService.isRemote() || dbService.isSwitching()">
              <mat-icon>computer</mat-icon>
              <span>Conectar a MongoDB Local (localhost)</span>
            </button>

            <mat-divider></mat-divider>

            <button mat-menu-item (click)="refreshDbStatus()">
              <mat-icon>refresh</mat-icon>
              <span>Actualizar estado / Medir ping</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <div class="topbar-right">
        <!-- Notificaciones -->
        <div class="notifications" [matMenuTriggerFor]="notificationMenu">
          <mat-icon>notifications</mat-icon>
          <span class="notification-badge">{{ notificationCount }}</span>
        </div>

        <mat-menu #notificationMenu="matMenu" class="notification-menu">
          <div class="notification-header">
            <h3>Notificaciones</h3>
          </div>
          <mat-divider></mat-divider>
          <div class="notification-list">
            @for (notification of notifications; track notification.id) {
              <div class="notification-item">
                <mat-icon [class]="notification.type">{{ notification.icon }}</mat-icon>
                <span>{{ notification.message }}</span>
              </div>
            }
          </div>
          <mat-divider></mat-divider>
          <button mat-button class="view-all-btn" (click)="verTodasNotificaciones()">Ver todas</button>
        </mat-menu>

        <div class="divider"></div>

        <!-- Menú de usuario -->
        <div class="user-menu-trigger" [matMenuTriggerFor]="userMenu">
          <div class="user-avatar">
            {{ currentUser()?.nombres?.charAt(0) || 'U' }}
          </div>
          <div class="user-info">
            <p class="user-name">{{ currentUser()?.nombres }} {{ currentUser()?.apellidos }}</p>
            <p class="user-role">{{ getRoleDisplayName(currentUser()?.rolId) }}</p>
          </div>
          <mat-icon>keyboard_arrow_down</mat-icon>
        </div>

        <mat-menu #userMenu="matMenu" class="user-dropdown-menu">
          <div class="user-info">
            <h3>{{ currentUser()?.nombres }} {{ currentUser()?.apellidos }}</h3>
            <p>{{ currentUser()?.email }}</p>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item class="menu-item" (click)="verPerfil()">
            <mat-icon>person</mat-icon>
            <span>Mi Perfil</span>
          </button>
          <button mat-menu-item class="menu-item" (click)="irConfiguracion()">
            <mat-icon>settings</mat-icon>
            <span>Configuración</span>
          </button>
          <button mat-menu-item class="menu-item" (click)="cambiarContrasena()">
            <mat-icon>lock</mat-icon>
            <span>Cambiar Contraseña</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item class="menu-item logout-item" (click)="logout()">
            <mat-icon>exit_to_app</mat-icon>
            <span>Cerrar Sesión</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Input() sidebarExpanded = true;

  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  public dbService = inject(DatabaseStatusService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Signals
  currentUser = signal<Usuario | null>(null);
  isDarkMode = this.themeService.isDarkMode;
  availableThemes = this.themeService.availableThemes;
  
  // Estado local
  selectedTheme = '';
  notificationCount = 3;
  notifications = [
    { id: 1, type: 'info', icon: 'info', message: 'Nueva empresa registrada' },
    { id: 2, type: 'warning', icon: 'warning', message: 'TUC próximo a vencer' },
    { id: 3, type: 'success', icon: 'check_circle', message: 'Fiscalización completada' }
  ];

  ngOnInit(): void {
    this.loadCurrentUser();
    this.selectedTheme = this.themeService.currentTheme().name;
  }

  /**
   * Carga el usuario actual
   */
  loadCurrentUser(): void {
    this.currentUser.set(this.authService.getCurrentUser());
  }

  /**
   * Obtiene el nombre de visualización del rol
   */
  getRoleDisplayName(roleId?: string): string {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrador',
      'fiscalizador': 'Fiscalizador',
      'supervisor': 'Supervisor',
      'usuario': 'Usuario'
    };
    return roleMap[roleId || ''] || 'Usuario';
  }

  /**
   * Obtiene el nombre de visualización del tema
   */
  getThemeDisplayName(themeName: string): string {
    const themeMap: { [key: string]: string } = {
      'Indigo Pink': 'Indigo Rosa',
      'Deep Purple Amber': 'Púrpura Ámbar',
      'Pink Blue Grey': 'Rosa Gris Azulado',
      'Purple Green': 'Púrpura Verde',
      'Custom Transport': 'Transporte Personalizado'
    };
    return themeMap[themeName] || themeName;
  }

  /**
   * Maneja el cambio de tema
   */
  onThemeChange(themeName: string): void {
    this.themeService.setTheme(themeName);
  }

  /**
   * Alterna el modo oscuro
   */
  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  /**
   * Navega a ver todas las notificaciones
   */
  verTodasNotificaciones(): void {
    this.router.navigate(['/notificaciones']);
  }

  /**
   * Navega al perfil del usuario
   */
  verPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  /**
   * Navega a la configuración
   */
  irConfiguracion(): void {
    this.router.navigate(['/configuracion']);
  }

  /**
   * Navega a cambiar contraseña
   */
  cambiarContrasena(): void {
    this.router.navigate(['/cambiar-contrasena']);
  }

  /**
   * Cambia el destino de la base de datos MongoDB
   */
  switchDatabase(target: 'local' | 'remote'): void {
    this.dbService.switchTarget(target).subscribe();
  }

  /**
   * Refresca el estado y mide la latencia de MongoDB
   */
  refreshDbStatus(): void {
    this.dbService.refreshStatus().subscribe();
  }

  /**
   * Cierra la sesión del usuario
   */
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