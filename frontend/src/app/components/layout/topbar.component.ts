import { Component, EventEmitter, Output, OnInit, OnDestroy, Input, inject, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { DatabaseStatusService } from '../../services/database-status.service';
import { BusquedaGlobalService, ResultadosBusquedaGlobal, ItemResultadoBusqueda } from '../../services/busqueda-global.service';
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
    MatProgressSpinnerModule,
    FormsModule
  ],
  template: `
    <!-- TopBar Oficial Maestro SIRRETT (h-16 = 64px, fondo blanco limpio, border-b) -->
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

      <!-- Centro: Omnibox Búsqueda Global Unificada (Ctrl + K) -->
      <div class="topbar-center hidden md:block" data-purpose="global-search" (click)="$event.stopPropagation()">
        <div class="search-box-wrapper" [class.is-focused]="isSearchFocused() || isSearchDropdownOpen()">
          <div class="search-icon-wrapper">
            @if (isSearching()) {
              <mat-icon class="search-spin-icon">sync</mat-icon>
            } @else {
              <svg class="search-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
              </svg>
            }
          </div>
          <input
            #searchInput
            type="text"
            class="search-input"
            placeholder="Buscar RUC, Empresa, Flota, R.D., Ruta, DNI... (Ctrl + K)"
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchInput($event)"
            (focus)="onSearchFocus()"
            (keydown)="handleSearchKeydown($event)"
          />
          @if (searchQuery()) {
            <button type="button" class="clear-search-btn" (click)="clearSearch()" title="Limpiar búsqueda">
              <mat-icon>close</mat-icon>
            </button>
          } @else {
            <div class="search-kbd-wrapper" (click)="focusSearch()">
              <kbd class="search-kbd">⌘K</kbd>
            </div>
          }

          <!-- Dropdown Flotante de Resultados Spotlight -->
          @if (isSearchDropdownOpen() && searchQuery().trim().length >= 2) {
            <div class="global-search-dropdown shadow-2xl animate-fade-in" (click)="$event.stopPropagation()">
              <!-- Cabecera del panel de búsqueda -->
              <div class="dropdown-header">
                <div class="header-title-flex">
                  <mat-icon class="header-icon">manage_search</mat-icon>
                  <span class="header-title">Búsqueda en Base de Datos SIRRETT</span>
                </div>
                <span class="results-badge">
                  {{ totalCoincidencias() }} resultado(s)
                </span>
              </div>

              <!-- Contenedor con scroll -->
              <div class="dropdown-body custom-scroll">
                @if (isSearching()) {
                  <div class="search-loading-state">
                    <mat-spinner diameter="32"></mat-spinner>
                    <p>Consultando empresas, vehículos, resoluciones, rutas y conductores...</p>
                  </div>
                } @else if (totalCoincidencias() === 0) {
                  <div class="search-empty-state">
                    <mat-icon class="empty-icon">sentiment_dissatisfied</mat-icon>
                    <p class="empty-title">Sin coincidencias para "{{ searchQuery() }}"</p>
                    <span class="empty-hint">Verifica el RUC, número de placa, código de resolución, ruta o DNI.</span>
                  </div>
                } @else {
                  <!-- 1. EMPRESAS -->
                  @if (searchResults()?.empresas?.length) {
                    <div class="search-category-group">
                      <div class="category-title cat-empresa">
                        <mat-icon>business</mat-icon>
                        <span>Empresas de Transporte ({{ searchResults()!.empresas.length }})</span>
                      </div>
                      <div class="category-items">
                        @for (item of searchResults()!.empresas; track item.id) {
                          <div class="search-item-row" (click)="selectResult(item)">
                            <div class="item-icon-box bg-blue-50 text-blue-600">
                              <mat-icon>store</mat-icon>
                            </div>
                            <div class="item-text-info">
                              <div class="item-main-title">{{ item.titulo }}</div>
                              <div class="item-sub-title">{{ item.subtitulo }}</div>
                            </div>
                            @if (item.badge) {
                              <span class="item-tag tag-success">{{ item.badge }}</span>
                            }
                            <mat-icon class="arrow-icon">chevron_right</mat-icon>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- 2. VEHÍCULOS / FLOTA -->
                  @if (searchResults()?.vehiculos?.length) {
                    <div class="search-category-group">
                      <div class="category-title cat-vehiculo">
                        <mat-icon>directions_car</mat-icon>
                        <span>Parque Automotor / Flota ({{ searchResults()!.vehiculos.length }})</span>
                      </div>
                      <div class="category-items">
                        @for (item of searchResults()!.vehiculos; track item.id) {
                          <div class="search-item-row" (click)="selectResult(item)">
                            <div class="item-icon-box bg-indigo-50 text-indigo-600">
                              <mat-icon>local_shipping</mat-icon>
                            </div>
                            <div class="item-text-info">
                              <div class="item-main-title">{{ item.titulo }}</div>
                              <div class="item-sub-title">{{ item.subtitulo }}</div>
                            </div>
                            @if (item.badge) {
                              <span class="item-tag tag-primary">{{ item.badge }}</span>
                            }
                            <mat-icon class="arrow-icon">chevron_right</mat-icon>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- 3. RESOLUCIONES -->
                  @if (searchResults()?.resoluciones?.length) {
                    <div class="search-category-group">
                      <div class="category-title cat-resolucion">
                        <mat-icon>description</mat-icon>
                        <span>Resoluciones Directorales ({{ searchResults()!.resoluciones.length }})</span>
                      </div>
                      <div class="category-items">
                        @for (item of searchResults()!.resoluciones; track item.id) {
                          <div class="search-item-row" (click)="selectResult(item)">
                            <div class="item-icon-box bg-emerald-50 text-emerald-600">
                              <mat-icon>verified</mat-icon>
                            </div>
                            <div class="item-text-info">
                              <div class="item-main-title">{{ item.titulo }}</div>
                              <div class="item-sub-title">{{ item.subtitulo }}</div>
                            </div>
                            @if (item.badge) {
                              <span class="item-tag tag-success">{{ item.badge }}</span>
                            }
                            <mat-icon class="arrow-icon">chevron_right</mat-icon>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- 4. RUTAS -->
                  @if (searchResults()?.rutas?.length) {
                    <div class="search-category-group">
                      <div class="category-title cat-ruta">
                        <mat-icon>route</mat-icon>
                        <span>Rutas Autorizadas ({{ searchResults()!.rutas.length }})</span>
                      </div>
                      <div class="category-items">
                        @for (item of searchResults()!.rutas; track item.id) {
                          <div class="search-item-row" (click)="selectResult(item)">
                            <div class="item-icon-box bg-amber-50 text-amber-600">
                              <mat-icon>alt_route</mat-icon>
                            </div>
                            <div class="item-text-info">
                              <div class="item-main-title">{{ item.titulo }}</div>
                              <div class="item-sub-title">{{ item.subtitulo }}</div>
                            </div>
                            @if (item.badge) {
                              <span class="item-tag tag-warning">{{ item.badge }}</span>
                            }
                            <mat-icon class="arrow-icon">chevron_right</mat-icon>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- 5. CONDUCTORES -->
                  @if (searchResults()?.conductores?.length) {
                    <div class="search-category-group">
                      <div class="category-title cat-conductor">
                        <mat-icon>badge</mat-icon>
                        <span>Conductores Habilitados ({{ searchResults()!.conductores.length }})</span>
                      </div>
                      <div class="category-items">
                        @for (item of searchResults()!.conductores; track item.id) {
                          <div class="search-item-row" (click)="selectResult(item)">
                            <div class="item-icon-box bg-purple-50 text-purple-600">
                              <mat-icon>person</mat-icon>
                            </div>
                            <div class="item-text-info">
                              <div class="item-main-title">{{ item.titulo }}</div>
                              <div class="item-sub-title">{{ item.subtitulo }}</div>
                            </div>
                            @if (item.badge) {
                              <span class="item-tag tag-primary">{{ item.badge }}</span>
                            }
                            <mat-icon class="arrow-icon">chevron_right</mat-icon>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- 6. INFRACCIONES -->
                  @if (searchResults()?.infracciones?.length) {
                    <div class="search-category-group">
                      <div class="category-title cat-infraccion">
                        <mat-icon>gavel</mat-icon>
                        <span>Infracciones / Actas ({{ searchResults()!.infracciones.length }})</span>
                      </div>
                      <div class="category-items">
                        @for (item of searchResults()!.infracciones; track item.id) {
                          <div class="search-item-row" (click)="selectResult(item)">
                            <div class="item-icon-box bg-rose-50 text-rose-600">
                              <mat-icon>report_problem</mat-icon>
                            </div>
                            <div class="item-text-info">
                              <div class="item-main-title">{{ item.titulo }}</div>
                              <div class="item-sub-title">{{ item.subtitulo }}</div>
                            </div>
                            @if (item.badge) {
                              <span class="item-tag tag-danger">{{ item.badge }}</span>
                            }
                            <mat-icon class="arrow-icon">chevron_right</mat-icon>
                          </div>
                        }
                      </div>
                    </div>
                  }
                }
              </div>

              <!-- Footer con atajos de teclado -->
              <div class="dropdown-footer">
                <span>Presiona <kbd>ESC</kbd> para cerrar</span>
                <span><kbd>ENTER</kbd> para abrir</span>
              </div>
            </div>
          }
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
          <button mat-menu-item (click)="verTodasNotificaciones()" class="text-center w-full">
            Ver todas las notificaciones
          </button>
        </mat-menu>

        <div class="topbar-v-divider hidden sm:block"></div>

        <!-- Tarjeta Oficial de Usuario / Funcionario DRTC -->
        <div
          class="officer-profile-pill group"
          [matMenuTriggerFor]="userMenu"
          role="button"
          tabindex="0"
          aria-label="Menú de usuario"
          title="Cuenta de Funcionario"
        >
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
            <div class="user-card-avatar">
              <span>{{ getUserInitials() }}</span>
            </div>
            <div class="user-card-details">
              <h4>{{ getOfficerFullName() }}</h4>
              <p class="user-card-role">{{ getRoleDisplayName(currentUser()?.rolId) }}</p>
              <span class="user-card-email font-mono">{{ currentUser()?.email || 'funcionario@drtc-puno.gob.pe' }}</span>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Diagnóstico y Cambio de Base de Datos MongoDB -->
          <div class="db-section" (click)="$event.stopPropagation()">
            <div class="db-section-header">
              <span class="db-section-title">Base de Datos Activa</span>
              <span
                class="db-status-badge"
                [class.badge-remote]="dbService.isRemote()"
                [class.badge-local]="!dbService.isRemote()"
              >
                {{ dbService.isRemote() ? 'MongoDB Remoto' : 'MongoDB Local' }}
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

          <!-- Acciones de Usuario -->
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
export class TopbarComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Input() sidebarExpanded = true;
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  public dbService = inject(DatabaseStatusService);
  private busquedaService = inject(BusquedaGlobalService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  currentUser = signal<Usuario | null>(null);
  isDarkMode = this.themeService.isDarkMode;

  // Búsqueda global interactiva
  searchQuery = signal<string>('');
  isSearching = signal<boolean>(false);
  isSearchDropdownOpen = signal<boolean>(false);
  isSearchFocused = signal<boolean>(false);
  searchResults = signal<ResultadosBusquedaGlobal | null>(null);
  totalCoincidencias = signal<number>(0);

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isSearchDropdownOpen.set(false);
    this.isSearchFocused.set(false);
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.setupSearchObservable();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  private setupSearchObservable(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          this.isSearching.set(false);
          this.searchResults.set(null);
          this.totalCoincidencias.set(0);
          return [];
        }
        this.isSearching.set(true);
        return this.busquedaService.buscar(query, 5);
      })
    ).subscribe({
      next: (resp) => {
        if (resp && resp.resultados) {
          this.searchResults.set(resp.resultados);
          this.totalCoincidencias.set(resp.total_coincidencias || 0);
          this.isSearchDropdownOpen.set(true);
        }
        this.isSearching.set(false);
      },
      error: (err) => {
        console.warn('Error en búsqueda global:', err);
        this.isSearching.set(false);
      }
    });
  }

  loadCurrentUser(): void {
    this.currentUser.set(this.authService.getCurrentUser());
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (value && value.trim().length >= 2) {
      this.isSearchDropdownOpen.set(true);
      this.searchSubject.next(value);
    } else {
      this.isSearchDropdownOpen.set(false);
      this.searchResults.set(null);
      this.totalCoincidencias.set(0);
    }
  }

  onSearchFocus(): void {
    this.isSearchFocused.set(true);
    if (this.searchQuery().trim().length >= 2) {
      this.isSearchDropdownOpen.set(true);
      if (!this.searchResults()) {
        this.searchSubject.next(this.searchQuery());
      }
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.isSearchDropdownOpen.set(false);
    this.searchResults.set(null);
    this.totalCoincidencias.set(0);
    this.focusSearch();
  }

  focusSearch(): void {
    if (this.searchInputRef) {
      this.searchInputRef.nativeElement.focus();
      this.searchInputRef.nativeElement.select();
      this.isSearchFocused.set(true);
    }
  }

  handleSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isSearchDropdownOpen.set(false);
      this.searchInputRef?.nativeElement.blur();
    } else if (event.key === 'Enter') {
      this.executeGlobalSearch();
    }
  }

  executeGlobalSearch(): void {
    const q = this.searchQuery().trim();
    if (!q) return;

    // Si hay un primer resultado visible, seleccionarlo
    const results = this.searchResults();
    if (results) {
      if (results.empresas?.length) {
        this.selectResult(results.empresas[0]);
        return;
      }
      if (results.vehiculos?.length) {
        this.selectResult(results.vehiculos[0]);
        return;
      }
      if (results.resoluciones?.length) {
        this.selectResult(results.resoluciones[0]);
        return;
      }
      if (results.rutas?.length) {
        this.selectResult(results.rutas[0]);
        return;
      }
      if (results.conductores?.length) {
        this.selectResult(results.conductores[0]);
        return;
      }
      if (results.infracciones?.length) {
        this.selectResult(results.infracciones[0]);
        return;
      }
    }

    // Fallback inteligente
    if (/^\d{11}$/.test(q)) {
      this.router.navigate(['/vehiculos-empresa'], { queryParams: { ruc: q } });
    } else if (/^[A-Za-z0-9]{3}-?[A-Za-z0-9]{3}$/.test(q)) {
      this.router.navigate(['/vehiculos'], { queryParams: { placa: q.toUpperCase() } });
    } else {
      this.router.navigate(['/empresas'], { queryParams: { q } });
    }
    this.isSearchDropdownOpen.set(false);
  }

  selectResult(item: ItemResultadoBusqueda): void {
    this.isSearchDropdownOpen.set(false);
    if (!item.ruta) return;

    if (item.tipo === 'empresa' && item.ruc) {
      this.router.navigate(['/vehiculos-empresa'], { queryParams: { ruc: item.ruc } });
      this.snackBar.open(`Abriendo empresa: ${item.titulo}`, 'OK', { duration: 2500 });
      return;
    }

    if (item.tipo === 'vehiculo' && item.ruc) {
      this.router.navigate(['/vehiculos-empresa'], { queryParams: { ruc: item.ruc } });
      this.snackBar.open(`Abriendo vehículo ${item.placa || ''}`, 'OK', { duration: 2500 });
      return;
    }

    if (item.tipo === 'conductor' && item.dni) {
      this.router.navigate(['/conductores'], { queryParams: { dni: item.dni } });
      this.snackBar.open(`Abriendo conductor: ${item.titulo}`, 'OK', { duration: 2500 });
      return;
    }

    this.router.navigateByUrl(item.ruta);
    this.snackBar.open(`Navegando a: ${item.titulo}`, 'OK', { duration: 2500 });
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