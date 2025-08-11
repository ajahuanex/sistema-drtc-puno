import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ThemeService, ThemeConfig } from '../../services/theme.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    FormsModule
  ],
  template: `
    <div class="configuracion-container">
      <div class="configuracion-header">
        <h1>Configuración del Sistema</h1>
        <p>Personaliza la apariencia y comportamiento de la aplicación</p>
      </div>

      <mat-tab-group class="configuracion-tabs">
        <!-- Pestaña de Temas -->
        <mat-tab label="Temas">
          <div class="tab-content">
            <mat-card class="config-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>palette</mat-icon>
                  Personalización de Temas
                </mat-card-title>
                <mat-card-subtitle>Elige el tema que mejor se adapte a tus preferencias</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div class="theme-section">
                  <h3>Temas Disponibles</h3>
                  <div class="themes-grid">
                    @for (theme of availableThemes(); track theme.name) {
                      <div 
                        class="theme-option" 
                        [class.active]="currentTheme().name === theme.name"
                        (click)="selectTheme(theme.name)"
                      >
                        <div class="theme-preview" [style.background]="theme.primary">
                          <div class="theme-accent" [style.background]="theme.accent"></div>
                        </div>
                        <div class="theme-info">
                          <h4>{{ getThemeDisplayName(theme.name) }}</h4>
                          <p>{{ theme.isDark ? 'Modo Oscuro' : 'Modo Claro' }}</p>
                        </div>
                        @if (currentTheme().name === theme.name) {
                          <mat-icon class="selected-icon">check_circle</mat-icon>
                        }
                      </div>
                    }
                  </div>
                </div>

                <mat-divider class="section-divider"></mat-divider>

                <div class="theme-options">
                  <h3>Opciones Adicionales</h3>
                  <div class="option-item">
                    <mat-slide-toggle
                      [checked]="isDarkMode()"
                      (change)="toggleDarkMode()"
                      color="primary"
                    >
                      Modo Oscuro
                    </mat-slide-toggle>
                    <p class="option-description">
                      Cambia entre tema claro y oscuro para mejor legibilidad
                    </p>
                  </div>
                  
                  <div class="option-item">
                    <button 
                      mat-stroked-button 
                      color="warn" 
                      (click)="resetToDefault()"
                      class="reset-button"
                    >
                      <mat-icon>restore</mat-icon>
                      Restablecer Tema por Defecto
                    </button>
                    <p class="option-description">
                      Vuelve al tema original del sistema
                    </p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Pestaña de Accesibilidad -->
        <mat-tab label="Accesibilidad">
          <div class="tab-content">
            <mat-card class="config-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>accessibility</mat-icon>
                  Configuración de Accesibilidad
                </mat-card-title>
                <mat-card-subtitle>Mejora la experiencia de uso para todos los usuarios</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div class="accessibility-section">
                  <h3>Opciones de Accesibilidad</h3>
                  
                  <div class="option-item">
                    <mat-slide-toggle
                      [checked]="highContrast"
                      (change)="toggleHighContrast()"
                      color="primary"
                    >
                      Alto Contraste
                    </mat-slide-toggle>
                    <p class="option-description">
                      Mejora la legibilidad con colores de mayor contraste
                    </p>
                  </div>
                  
                  <div class="option-item">
                    <mat-slide-toggle
                      [checked]="largeText"
                      (change)="toggleLargeText()"
                      color="primary"
                    >
                      Texto Grande
                    </mat-slide-toggle>
                    <p class="option-description">
                      Aumenta el tamaño del texto para mejor legibilidad
                    </p>
                  </div>
                  
                  <div class="option-item">
                    <mat-slide-toggle
                      [checked]="reducedMotion"
                      (change)="toggleReducedMotion()"
                      color="primary"
                    >
                      Reducir Animaciones
                    </mat-slide-toggle>
                    <p class="option-description">
                      Minimiza las animaciones para usuarios sensibles al movimiento
                    </p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Pestaña de Notificaciones -->
        <mat-tab label="Notificaciones">
          <div class="tab-content">
            <mat-card class="config-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>notifications</mat-icon>
                  Configuración de Notificaciones
                </mat-card-title>
                <mat-card-subtitle>Gestiona cómo recibes las notificaciones del sistema</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div class="notifications-section">
                  <h3>Tipos de Notificaciones</h3>
                  
                  <div class="option-item">
                    <mat-slide-toggle
                      [checked]="emailNotifications"
                      (change)="toggleEmailNotifications()"
                      color="primary"
                    >
                      Notificaciones por Email
                    </mat-slide-toggle>
                    <p class="option-description">
                      Recibe notificaciones importantes por correo electrónico
                    </p>
                  </div>
                  
                  <div class="option-item">
                    <mat-slide-toggle
                      [checked]="pushNotifications"
                      (change)="togglePushNotifications()"
                      color="primary"
                    >
                      Notificaciones Push
                    </mat-slide-toggle>
                    <p class="option-description">
                      Recibe notificaciones en tiempo real en el navegador
                    </p>
                  </div>
                  
                  <div class="option-item">
                    <mat-slide-toggle
                      [checked]="soundNotifications"
                      (change)="toggleSoundNotifications()"
                      color="primary"
                    >
                      Notificaciones de Sonido
                    </mat-slide-toggle>
                    <p class="option-description">
                      Reproduce sonidos para notificaciones importantes
                    </p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Botones de Acción -->
      <div class="configuracion-actions">
        <button 
          mat-button 
          color="secondary" 
          (click)="volverAlDashboard()"
          class="action-button"
        >
          <mat-icon>arrow_back</mat-icon>
          Volver al Dashboard
        </button>
        
        <button 
          mat-raised-button 
          color="primary" 
          (click)="guardarConfiguracion()"
          class="action-button"
        >
          <mat-icon>save</mat-icon>
          Guardar Configuración
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent {
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Signals del servicio de temas
  currentTheme = this.themeService.currentTheme;
  isDarkMode = this.themeService.isDarkMode;
  availableThemes = this.themeService.availableThemes;

  // Configuraciones locales
  highContrast = signal(false);
  largeText = signal(false);
  reducedMotion = signal(false);
  emailNotifications = signal(true);
  pushNotifications = signal(true);
  soundNotifications = signal(false);

  /**
   * Selecciona un tema
   */
  selectTheme(themeName: string): void {
    this.themeService.setTheme(themeName);
  }

  /**
   * Alterna el modo oscuro
   */
  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  /**
   * Restablece al tema por defecto
   */
  resetToDefault(): void {
    this.themeService.resetToDefault();
  }

  /**
   * Alterna el modo de alto contraste
   */
  toggleHighContrast(): void {
    this.highContrast.update(value => !value);
    this.applyAccessibilitySettings();
  }

  /**
   * Alterna el texto grande
   */
  toggleLargeText(): void {
    this.largeText.update(value => !value);
    this.applyAccessibilitySettings();
  }

  /**
   * Alterna la reducción de movimiento
   */
  toggleReducedMotion(): void {
    this.reducedMotion.update(value => !value);
    this.applyAccessibilitySettings();
  }

  /**
   * Alterna las notificaciones por email
   */
  toggleEmailNotifications(): void {
    this.emailNotifications.update(value => !value);
  }

  /**
   * Alterna las notificaciones push
   */
  togglePushNotifications(): void {
    this.pushNotifications.update(value => !value);
  }

  /**
   * Alterna las notificaciones de sonido
   */
  toggleSoundNotifications(): void {
    this.soundNotifications.update(value => !value);
  }

  /**
   * Aplica la configuración de accesibilidad
   */
  private applyAccessibilitySettings(): void {
    const root = document.documentElement;
    
    if (this.highContrast()) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (this.largeText()) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    if (this.reducedMotion()) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }

  /**
   * Guarda toda la configuración
   */
  guardarConfiguracion(): void {
    // Guardar configuraciones locales en localStorage
    localStorage.setItem('high-contrast', this.highContrast().toString());
    localStorage.setItem('large-text', this.largeText().toString());
    localStorage.setItem('reduced-motion', this.reducedMotion().toString());
    localStorage.setItem('email-notifications', this.emailNotifications().toString());
    localStorage.setItem('push-notifications', this.pushNotifications().toString());
    localStorage.setItem('sound-notifications', this.soundNotifications().toString());
    
    this.snackBar.open('Configuración guardada exitosamente', 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
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
   * Navega de vuelta al dashboard
   */
  volverAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
} 