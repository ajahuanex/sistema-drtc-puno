import { Component, EventEmitter, Output, OnInit, Input, inject, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    FormsModule
  ],
  template: `
    <!-- TopBar Oficial Maestro (h-16 = 64px, fondo blanco limpio, border-b) -->
    <header class="topbar-header" data-purpose="topbar">
      <!-- Izquierda: Toggle + Separador + MTC Logo Oficial -->
      <div class="topbar-left">
        <button
          type="button"
          class="sidebar-toggle-btn"
          id="sidebarToggle"
          (click)="toggleSidebar.emit()"
          title="Alternar Menú Lateral"
          aria-label="Alternar Menú Lateral"
        >
          <svg class="toggle-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
          </svg>
        </button>

        <div class="topbar-v-divider hidden sm:block"></div>

        <div class="mtc-logo-container">
          <img
            alt="Ministerio de Transportes y Comunicaciones"
            class="mtc-logo-img"
            src="assets/images/mtc-logo-stitch.png"
          />
        </div>
      </div>

      <!-- Centro: Omnibox Búsqueda Global (Ctrl + K) -->
      <div class="topbar-center hidden md:block" data-purpose="global-search">
        <div class="search-box-wrapper">
          <div class="search-icon-wrapper">
            <svg class="search-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
            </svg>
          </div>
          <input
            #searchInput
            type="text"
            class="search-input"
            placeholder="Buscar RUC, Empresa, Flota, R.D. (Ctrl + K)"
            [(ngModel)]="searchQuery"
            (keydown.enter)="executeGlobalSearch()"
          />
          <div class="search-kbd-wrapper" (click)="focusSearch()">
            <kbd class="search-kbd">⌘K</kbd>
          </div>
        </div>
      </div>

      <!-- Derecha: Modo Oscuro + Ayuda + Notificaciones + Perfil Funcionario -->
      <div class="topbar-right">
        <!-- Alternar Modo Oscuro / Claro Directo -->
        <button
          type="button"
          class="topbar-icon-action"
          id="themeToggleBtn"
          [title]="isDarkMode() ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'"
          (click)="toggleDarkMode()"
          aria-label="Alternar Modo Oscuro / Claro"
        >
          @if (isDarkMode()) {
            <!-- Icono Sol (Modo Claro) -->
            <svg class="action-svg text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          } @else {
            <!-- Icono Luna (Modo Oscuro) -->
            <svg class="action-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
          }
        </button>

        <!-- Ayuda y Normativa RNAT -->
        <button
          type="button"
          class="topbar-icon-action"
          title="Ayuda y Normativa RNAT"
          (click)="abrirAyudaNormativa()"
        >
          <svg class="action-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
          </svg>
        </button>

        <!-- Notificaciones con Pulso Vivo Azul -->
        <button
          type="button"
          class="topbar-icon-action relative"
          title="Notificaciones"
          [matMenuTriggerFor]="notificationMenu"
        >
          <svg class="action-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
          </svg>
          <span class="notification-ping-container">
            <span class="ping-ring"></span>
            <span class="ping-dot"></span>
          </span>
        </button>

        <!-- Menú de Notificaciones -->
        <mat-menu #notificationMenu="matMenu" class="stitch-notification-menu">
          <div class="menu-head">
            <h3>Notificaciones del Sistema</h3>
            <span class="badge">3 Nuevas</span>
          </div>
          <mat-divider></mat-divider>
          <div class="notif-items">
            @for (item of notifications; track item.id) {
              <div class="notif-row">
                <mat-icon [class]="item.type">{{ item.icon }}</mat-icon>
                <div class="notif-body">
                  <p class="notif-text">{{ item.message }}</p>
                  <span class="notif-sub">Hace 10 min</span>
                </div>
              </div>
            }
          </div>
          <mat-divider></mat-divider>
          <button mat-button class="view-all-notif-btn" (click)="verTodasNotificaciones()">Ver todas las notificaciones</button>
        </mat-menu>

        <div class="topbar-v-divider hidden sm:block"></div>

        <!-- Tarjeta Oficial de Usuario / Funcionario DRTC -->
        <div class="officer-profile-pill group" [matMenuTriggerFor]="userMenu" title="Cuenta de Funcionario">
          <div class="officer-avatar">
            <span>{{ getUserInitials() }}</span>
          </div>
          <div class="officer-meta hidden lg:flex">
            <span class="officer-name">{{ getOfficerFullName() }}</span>
            <span class="officer-role">{{ getRoleDisplayName(currentUser()?.rolId) }}</span>
          </div>
          <svg class="chevron-down-svg hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
          </svg>
        </div>

        <!-- Menú de Usuario con Conexión MongoDB y Modo Oscuro integrados -->
        <mat-menu #userMenu="matMenu" class="stitch-user-menu">
          <div class="user-card-header">
            <div class="user-card-avatar">{{ getUserInitials() }}</div>
            <div class="user-card-details">
              <h4>{{ getOfficerFullName() }}</h4>
              <p class="user-card-role">{{ getRoleDisplayName(currentUser()?.rolId) }}</p>
              <span class="user-card-email font-mono">{{ currentUser()?.email || 'especialista@drtc.gob.pe' }}</span>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Diagnóstico y Cambio de Base de Datos MongoDB -->
          <div class="db-section" (click)="$event.stopPropagation()">
            <div class="db-section-header">
              <span class="db-section-title">Base de Datos Activa</span>
              <span class="db-status-badge" [class.badge-remote]="dbService.isRemote()" [class.badge-local]="!dbService.isRemote()">
                {{ dbService.isRemote() ? 'REMOTA (161.132.52.69)' : 'LOCAL (localhost)' }}
              </span>
            </div>
            <div class="db-section-row">
              <span>Estado: <strong [class.text-emerald]="dbService.isConnected()" [class.text-rose]="!dbService.isConnected()">{{ dbService.isConnected() ? 'Conectado' : 'Desconectado' }}</strong></span>
              @if (dbService.pingMs() !== null) {
                <span class="db-ping-val font-tabular">{{ dbService.pingMs() }} ms</span>
              }
            </div>
            <div class="db-switch-actions">
              <button
                type="button"
                class="db-btn"
                [class.active-db]="!dbService.isRemote()"
                (click)="switchDatabase('local')"
                [disabled]="!dbService.isRemote() || dbService.isSwitching()"
              >
                Local
              </button>
              <button
                type="button"
                class="db-btn"
                [class.active-db]="dbService.isRemote()"
                (click)="switchDatabase('remote')"
                [disabled]="dbService.isRemote() || dbService.isSwitching()"
              >
                Remoto
              </button>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Modo Oscuro Toggle Rápido -->
          <button mat-menu-item (click)="toggleDarkMode()">
            <mat-icon>{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            <span>{{ isDarkMode() ? 'Activar Modo Claro' : 'Activar Modo Oscuro' }}</span>
          </button>

          <button mat-menu-item (click)="verPerfil()">
            <mat-icon>person</mat-icon>
            <span>Mi Perfil de Funcionario</span>
          </button>



          <button mat-menu-item (click)="cambiarContrasena()">
            <mat-icon>lock</mat-icon>
            <span>Cambiar Contraseña</span>
          </button>

          <mat-divider></mat-divider>

          <button mat-menu-item class="logout-menu-item" (click)="logout()">
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

  currentUser = signal<Usuario | null>(null);
  isDarkMode = this.themeService.isDarkMode;

  searchQuery = '';
  notifications = [
    { id: 1, type: 'info', icon: 'business', message: 'Nueva empresa interprovincial registrada' },
    { id: 2, type: 'warning', icon: 'warning', message: 'TUC próximo a vencer: Flota Z4V-960' },
    { id: 3, type: 'success', icon: 'verified', message: 'Fiscalización completada en Terminal Terrestre' }
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

    if (/^\d{11}$/.test(q)) {
      this.router.navigate(['/empresas'], { queryParams: { ruc: q } });
      this.snackBar.open(`Consultando RUC: ${q}`, 'OK', { duration: 2500 });
      return;
    }

    if (/^[A-Za-z0-9]{3}-?[A-Za-z0-9]{3}$/.test(q)) {
      this.router.navigate(['/vehiculos'], { queryParams: { placa: q.toUpperCase() } });
      this.snackBar.open(`Consultando Placa: ${q.toUpperCase()}`, 'OK', { duration: 2500 });
      return;
    }

    this.router.navigate(['/empresas'], { queryParams: { q } });
    this.snackBar.open(`Búsqueda: "${q}"`, 'OK', { duration: 2500 });
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

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  abrirAyudaNormativa(): void {
    this.snackBar.open('Reglamento Nacional de Administración de Transporte (D.S. N° 017-2009-MTC) - DRTC Puno', 'Normativa', {
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



  cambiarContrasena(): void {
    this.router.navigate(['/cambiar-contrasena']);
  }

  switchDatabase(target: 'local' | 'remote'): void {
    this.dbService.switchTarget(target).subscribe();
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