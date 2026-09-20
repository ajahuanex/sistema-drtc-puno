import { Component, EventEmitter, Output, OnInit, Input, inject, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
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
    <header class="topbar" data-purpose="topbar">
      <!-- SECCIÓN IZQUIERDA: Toggle Menú + Identidad Institucional MTC/DRTC -->
      <div class="topbar-left">
        <button mat-icon-button (click)="toggleSidebar.emit()" class="sidebar-toggle"
                [matTooltip]="sidebarExpanded ? 'Contraer menú lateral' : 'Expandir menú lateral'"
                aria-label="Alternar menú lateral">
          <mat-icon>{{ sidebarExpanded ? 'menu_open' : 'menu' }}</mat-icon>
        </button>

        <div class="v-divider hidden sm:block"></div>

        <!-- MTC y Título Institucional -->
        <div class="institutional-branding" routerLink="/dashboard" style="cursor: pointer;">
          <img src="assets/images/mtc-logo.png" alt="Ministerio de Transportes y Comunicaciones" class="mtc-logo">
          <div class="brand-text">
            <div class="brand-title-row">
              <span class="topbar-title font-display">SIRRETT</span>
              <span class="brand-pill">REGIÓN PUNO</span>
            </div>
            <span class="topbar-subtitle font-sans">Dirección Regional de Transportes y Comunicaciones</span>
          </div>
        </div>
      </div>

      <!-- SECCIÓN CENTRAL: Omnibox Búsqueda Global (Ctrl+K) + Switch Conexión BD -->
      <div class="topbar-center">
        <!-- Omnibox Global Search (Stitch Spec) -->
        <div class="global-search-container" data-purpose="global-search">
          <div class="search-input-wrapper">
            <mat-icon class="search-icon">search</mat-icon>
            <input
              #searchInput
              type="text"
              class="search-input"
              placeholder="Buscar RUC, Empresa, Flota, R.D. (Ctrl + K)"
              [(ngModel)]="searchQuery"
              (keydown.enter)="executeGlobalSearch()"
            />
            <kbd class="kbd-badge" (click)="focusSearch()" matTooltip="Presiona Ctrl + K">⌘K</kbd>
          </div>
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
            <span class="db-name font-sans">{{ dbService.isRemote() ? 'BD Remota' : 'BD Local' }}</span>
            @if (dbService.pingMs() !== null) {
              <span class="db-ping font-tabular">{{ dbService.pingMs() }}ms</span>
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
                <span class="val font-tabular">{{ dbService.host() }}</span>
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
                  <span class="val font-tabular">{{ dbService.pingMs() }} ms</span>
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

      <!-- SECCIÓN DERECHA: Ayuda RNAT + Toggle Modo Oscuro + Notificaciones + Perfil -->
      <div class="topbar-right">
        <!-- Botón Ayuda y Normativa RNAT (Stitch Spec) -->
        <button mat-icon-button class="action-icon-btn" (click)="abrirAyudaNormativa()"
                matTooltip="Ayuda y Marco Normativo RNAT (D.S. 017-2009-MTC)">
          <mat-icon>help_outline</mat-icon>
        </button>

        <!-- Toggle Modo Oscuro Rápido (Stitch Spec) -->
        <button mat-icon-button class="action-icon-btn theme-toggle-btn" (click)="toggleDarkMode()"
                [matTooltip]="isDarkMode() ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'">
          <mat-icon>{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>

        <!-- Selector de Tema de Color -->
        <div class="theme-palette-btn">
          <button mat-icon-button class="action-icon-btn" [matMenuTriggerFor]="paletteMenu" matTooltip="Paleta de Estilos">
            <mat-icon>palette</mat-icon>
          </button>
          <mat-menu #paletteMenu="matMenu" class="theme-palette-menu">
            <div class="palette-header">Paletas del Sistema</div>
            <mat-divider></mat-divider>
            @for (theme of availableThemes(); track theme.name) {
              <button mat-menu-item (click)="onThemeChange(theme.name)" [class.active-theme]="selectedTheme === theme.name">
                <div class="palette-item">
                  <span class="palette-color-preview" [style.background]="theme.primary">
                    <span class="palette-accent-dot" [style.background]="theme.accent"></span>
                  </span>
                  <span>{{ getThemeDisplayName(theme.name) }}</span>
                </div>
              </button>
            }
          </mat-menu>
        </div>

        <!-- Campana de Notificaciones con Live Ping Badge (Stitch Spec) -->
        <button mat-icon-button class="action-icon-btn notification-btn" [matMenuTriggerFor]="notificationMenu" matTooltip="Notificaciones del Sistema">
          <mat-icon>notifications</mat-icon>
          <span class="pulse-container">
            <span class="ping-ring"></span>
            <span class="ping-dot"></span>
          </span>
          <span class="notification-count font-tabular">{{ notificationCount }}</span>
        </button>

        <mat-menu #notificationMenu="matMenu" class="notification-menu">
          <div class="notification-header">
            <h3>Notificaciones de Fiscalización</h3>
            <span class="badge font-tabular">{{ notificationCount }} nuevas</span>
          </div>
          <mat-divider></mat-divider>
          <div class="notification-list">
            @for (notification of notifications; track notification.id) {
              <div class="notification-item">
                <mat-icon [class]="notification.type">{{ notification.icon }}</mat-icon>
                <div class="notif-content">
                  <span class="notif-msg">{{ notification.message }}</span>
                  <span class="notif-time font-tabular">Hace 15 min</span>
                </div>
              </div>
            }
          </div>
          <mat-divider></mat-divider>
          <button mat-button class="view-all-btn" (click)="verTodasNotificaciones()">Ver todas las notificaciones</button>
        </mat-menu>

        <div class="v-divider hidden sm:block"></div>

        <!-- Tarjeta Oficial de Usuario / Funcionario (Stitch Spec) -->
        <div class="officer-profile-card" [matMenuTriggerFor]="userMenu" matTooltip="Cuenta de Usuario">
          <div class="officer-avatar font-sans">
            {{ getUserInitials() }}
          </div>
          <div class="officer-info hidden lg:flex">
            <span class="officer-name font-sans">{{ getOfficerFullName() }}</span>
            <span class="officer-role font-sans">{{ getRoleDisplayName(currentUser()?.rolId) }}</span>
          </div>
          <mat-icon class="officer-chevron">keyboard_arrow_down</mat-icon>
        </div>

        <mat-menu #userMenu="matMenu" class="user-dropdown-menu">
          <div class="user-header-info">
            <div class="user-header-avatar font-sans">{{ getUserInitials() }}</div>
            <div class="user-header-text">
              <h4>{{ getOfficerFullName() }}</h4>
              <p class="user-email font-mono">{{ currentUser()?.email || 'funcionario@drtc.gob.pe' }}</p>
              <span class="user-badge font-sans">{{ getRoleDisplayName(currentUser()?.rolId) }}</span>
            </div>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="verPerfil()">
            <mat-icon>person</mat-icon>
            <span>Mi Perfil de Funcionario</span>
          </button>
          <button mat-menu-item (click)="irConfiguracion()">
            <mat-icon>settings</mat-icon>
            <span>Configuración del Sistema</span>
          </button>
          <button mat-menu-item (click)="cambiarContrasena()">
            <mat-icon>lock</mat-icon>
            <span>Seguridad y Contraseña</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item class="logout-item" (click)="logout()">
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
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

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
  searchQuery = '';
  notificationCount = 3;
  notifications = [
    { id: 1, type: 'info', icon: 'business', message: 'Nueva empresa interprovincial registrada en Puno' },
    { id: 2, type: 'warning', icon: 'warning', message: 'TUC próximo a caducar: Flota Z4V-960' },
    { id: 3, type: 'success', icon: 'verified', message: 'Fiscalización conforme: Terminal Terrestre Juliaca' }
  ];

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.focusSearch();
    }
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.selectedTheme = this.themeService.currentTheme().name;
  }

  loadCurrentUser(): void {
    this.currentUser.set(this.authService.getCurrentUser());
  }

  focusSearch(): void {
    if (this.searchInputRef) {
      this.searchInputRef.nativeElement.focus();
      this.searchInputRef.nativeElement.select();
    }
  }

  executeGlobalSearch(): void {
    const q = this.searchQuery.trim();
    if (!q) return;

    // Si es un RUC de 11 dígitos
    if (/^\d{11}$/.test(q)) {
      this.router.navigate(['/empresas'], { queryParams: { ruc: q } });
      this.snackBar.open(`Buscando Empresa por RUC: ${q}`, 'OK', { duration: 2500 });
      return;
    }

    // Si es una placa (e.g. Z4V-960 o similar)
    if (/^[A-Za-z0-9]{3}-?[A-Za-z0-9]{3}$/.test(q)) {
      this.router.navigate(['/vehiculos'], { queryParams: { placa: q.toUpperCase() } });
      this.snackBar.open(`Buscando Vehículo por Placa: ${q.toUpperCase()}`, 'OK', { duration: 2500 });
      return;
    }

    // Búsqueda general
    this.router.navigate(['/empresas'], { queryParams: { q } });
    this.snackBar.open(`Búsqueda en Registros DRTC: "${q}"`, 'OK', { duration: 2500 });
  }

  getUserInitials(): string {
    const u = this.currentUser();
    if (!u) return 'MM';
    const n = (u.nombres || '').trim();
    const a = (u.apellidos || '').trim();
    if (n && a) return `${n.charAt(0)}${a.charAt(0)}`.toUpperCase();
    if (n) return n.slice(0, 2).toUpperCase();
    return 'MM';
  }

  getOfficerFullName(): string {
    const u = this.currentUser();
    if (!u) return 'Ing. Marcos Mamani C.';
    const fullName = `${u.nombres || ''} ${u.apellidos || ''}`.trim();
    return fullName || 'Ing. Marcos Mamani C.';
  }

  getRoleDisplayName(roleId?: string): string {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrador General DRTC',
      'fiscalizador': 'Inspector de Fiscalización',
      'supervisor': 'Supervisor Regional',
      'usuario': 'Especialista DRTC-P'
    };
    return roleMap[roleId || ''] || 'Especialista DRTC-P';
  }

  getThemeDisplayName(themeName: string): string {
    const themeMap: { [key: string]: string } = {
      'SIRRETT Institucional': 'Azul Institucional DRTC',
      'Indigo Pink': 'Índigo Ejecutivo',
      'Deep Purple Amber': 'Púrpura Andino',
      'Pink Blue Grey': 'Gris Platino',
      'Purple Green': 'Púrpura Esmeralda',
      'Custom Transport': 'Transporte Regional'
    };
    return themeMap[themeName] || themeName;
  }

  onThemeChange(themeName: string): void {
    this.selectedTheme = themeName;
    this.themeService.setTheme(themeName);
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  abrirAyudaNormativa(): void {
    this.snackBar.open('Reglamento Nacional de Administración de Transporte (D.S. N° 017-2009-MTC) - DRTC Región Puno', 'Normativa', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  verTodasNotificaciones(): void {
    this.router.navigate(['/notificaciones']);
  }

  verPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  irConfiguracion(): void {
    this.router.navigate(['/configuracion']);
  }

  cambiarContrasena(): void {
    this.router.navigate(['/cambiar-contrasena']);
  }

  switchDatabase(target: 'local' | 'remote'): void {
    this.dbService.switchTarget(target).subscribe();
  }

  refreshDbStatus(): void {
    this.dbService.refreshStatus().subscribe();
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