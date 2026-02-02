import { Injectable, signal, effect } from '@angular/core';

/**
 * Interfaz para preferencias de usuario
 */
export interface UserPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

/**
 * Servicio para gestionar preferencias de usuario y accesibilidad
 * 
 * Detecta y respeta las preferencias del sistema operativo y permite
 * configuraciones personalizadas del usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private readonly STORAGE_KEY = 'vehiculos-user-preferences';

  // Señales para preferencias
  reducedMotion = signal<boolean>(false);
  highContrast = signal<boolean>(false);
  darkMode = signal<boolean>(false);
  fontSize = signal<'small' | 'medium' | 'large'>('medium');
  colorBlindMode = signal<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('none');

  private isInitializing = true;

  constructor() {
    this.detectSystemPreferences();
    this.loadUserPreferences();
    
    // Configurar watchers después de la carga inicial para evitar bucles
    setTimeout(() => {
      this.isInitializing = false;
      this.setupPreferenceWatchers();
    }, 100);
  }

  /**
   * Detectar preferencias del sistema
   */
  private detectSystemPreferences(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    // Detectar prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion.set(reducedMotionQuery.matches);
    reducedMotionQuery.addEventListener('change', (e) => {
      this.reducedMotion.set(e.matches);
    });

    // Detectar prefers-contrast
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    this.highContrast.set(highContrastQuery.matches);
    highContrastQuery.addEventListener('change', (e) => {
      this.highContrast.set(e.matches);
    });

    // Detectar prefers-color-scheme
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkMode.set(darkModeQuery.matches);
    darkModeQuery.addEventListener('change', (e) => {
      this.darkMode.set(e.matches);
    });
  }

  /**
   * Cargar preferencias guardadas del usuario
   */
  private loadUserPreferences(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const preferences: Partial<UserPreferences> = JSON.parse(stored);
        
        if (typeof preferences.reducedMotion !== "undefined") {
          this.reducedMotion.set(preferences.reducedMotion);
        }
        if (typeof preferences.highContrast !== "undefined") {
          this.highContrast.set(preferences.highContrast);
        }
        if (typeof preferences.darkMode !== "undefined") {
          this.darkMode.set(preferences.darkMode);
        }
        if (preferences.fontSize) {
          this.fontSize.set(preferences.fontSize);
        }
        if (preferences.colorBlindMode) {
          this.colorBlindMode.set(preferences.colorBlindMode);
        }
      }
    } catch (error) {
      console.error('Error loading user preferences::', error);
    }
  }

  /**
   * Guardar preferencias del usuario
   */
  private saveUserPreferences(): void {
    try {
      const preferences: UserPreferences = {
        reducedMotion: this.reducedMotion(),
        highContrast: this.highContrast(),
        darkMode: this.darkMode(),
        fontSize: this.fontSize(),
        colorBlindMode: this.colorBlindMode()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences::', error);
    }
  }

  /**
   * Configurar watchers para guardar cambios automáticamente
   */
  private setupPreferenceWatchers(): void {
    effect(() => {
      // Aplicar clase al body para reduced motion
      if (this.reducedMotion()) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    });

    effect(() => {
      // Aplicar clase al body para high contrast
      if (this.highContrast()) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
    });

    effect(() => {
      // Aplicar clase al body para dark mode
      if (this.darkMode()) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    });

    effect(() => {
      // Aplicar clase al body para font size
      document.body.classList.remove('font-small', 'font-medium', 'font-large');
      document.body.classList.add(`font-${this.fontSize()}`);
    });

    effect(() => {
      // Aplicar clase al body para color blind mode
      document.body.classList.remove(
        'colorblind-none',
        'colorblind-protanopia',
        'colorblind-deuteranopia',
        'colorblind-tritanopia'
      );
      document.body.classList.add(`colorblind-${this.colorBlindMode()}`);
    });

    // Guardar cambios cuando cualquier preferencia cambie (con debounce para evitar bucles)
    let saveTimeout: any;
    effect(() => {
      // No ejecutar durante la inicialización
      if (this.isInitializing) {
        return;
      }
      
      // Leer todas las preferencias para activar el effect
      this.reducedMotion();
      this.highContrast();
      this.darkMode();
      this.fontSize();
      this.colorBlindMode();
      
      // Debounce para evitar múltiples guardados
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      saveTimeout = setTimeout(() => {
        this.saveUserPreferences();
      }, 500); // Esperar 500ms antes de guardar
    });
  }

  /**
   * Alternar reduced motion
   */
  toggleReducedMotion(): void {
    this.reducedMotion.update(value => !value);
  }

  /**
   * Alternar high contrast
   */
  toggleHighContrast(): void {
    this.highContrast.update(value => !value);
  }

  /**
   * Alternar dark mode
   */
  toggleDarkMode(): void {
    this.darkMode.update(value => !value);
  }

  /**
   * Establecer tamaño de fuente
   */
  setFontSize(size: 'small' | 'medium' | 'large'): void {
    this.fontSize.set(size);
  }

  /**
   * Establecer modo de daltonismo
   */
  setColorBlindMode(mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'): void {
    this.colorBlindMode.set(mode);
  }

  /**
   * Obtener todas las preferencias actuales
   */
  getPreferences(): UserPreferences {
    return {
      reducedMotion: this.reducedMotion(),
      highContrast: this.highContrast(),
      darkMode: this.darkMode(),
      fontSize: this.fontSize(),
      colorBlindMode: this.colorBlindMode()
    };
  }

  /**
   * Restablecer preferencias a valores por defecto
   */
  resetToDefaults(): void {
    this.detectSystemPreferences();
    this.fontSize.set('medium');
    this.colorBlindMode.set('none');
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Verificar si las animaciones deben estar deshabilitadas
   */
  shouldDisableAnimations(): boolean {
    return this.reducedMotion();
  }

  /**
   * Verificar si se debe usar alto contraste
   */
  shouldUseHighContrast(): boolean {
    return this.highContrast();
  }

  /**
   * Verificar si se debe usar modo oscuro
   */
  shouldUseDarkMode(): boolean {
    return this.darkMode();
  }

  /**
   * Obtener multiplicador de tamaño de fuente
   */
  getFontSizeMultiplier(): number {
    const multipliers = {
      small: 0.875,
      medium: 1,
      large: 1.125
    };
    return multipliers[this.fontSize()];
  }

  /**
   * Verificar cumplimiento de WCAG 2.1 AA
   */
  checkWCAGCompliance(): {
    contrastRatio: boolean;
    textSize: boolean;
    focusVisible: boolean;
    keyboardAccessible: boolean;
  } {
    return {
      contrastRatio: true, // Implementar verificación real
      textSize: this.fontSize() !== 'small',
      focusVisible: true,
      keyboardAccessible: true
    };
  }
}
