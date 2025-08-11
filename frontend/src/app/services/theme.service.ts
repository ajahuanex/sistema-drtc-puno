import { Injectable, signal, computed, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface ThemeConfig {
  name: string;
  primary: string;
  accent: string;
  warn: string;
  isDark: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private snackBar = inject(MatSnackBar);
  
  // Temas predefinidos
  private readonly themes: ThemeConfig[] = [
    {
      name: 'Indigo Pink',
      primary: '#3f51b5',
      accent: '#ff4081',
      warn: '#f44336',
      isDark: false
    },
    {
      name: 'Deep Purple Amber',
      primary: '#673ab7',
      accent: '#ffc107',
      warn: '#f44336',
      isDark: false
    },
    {
      name: 'Pink Blue Grey',
      primary: '#e91e63',
      accent: '#607d8b',
      warn: '#f44336',
      isDark: true
    },
    {
      name: 'Purple Green',
      primary: '#9c27b0',
      accent: '#4caf50',
      warn: '#f44336',
      isDark: true
    },
    {
      name: 'Custom Transport',
      primary: '#1976d2',
      accent: '#ff9800',
      warn: '#f44336',
      isDark: false
    }
  ];

  // Estado actual del tema
  currentTheme = signal<ThemeConfig>(this.themes[0]);
  isDarkMode = signal(false);
  
  // Computed para obtener el nombre del tema actual
  currentThemeName = computed(() => this.currentTheme().name);
  
  // Computed para obtener todos los temas disponibles
  availableThemes = computed(() => this.themes);

  constructor() {
    this.loadSavedTheme();
  }

  /**
   * Cambia al tema especificado
   */
  setTheme(themeName: string): void {
    const theme = this.themes.find(t => t.name === themeName);
    if (theme) {
      this.currentTheme.set(theme);
      this.isDarkMode.set(theme.isDark);
      this.applyTheme(theme);
      this.saveTheme(themeName);
      
      this.snackBar.open(`Tema cambiado a: ${theme.name}`, 'Cerrar', {
        duration: 2000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      });
    }
  }

  /**
   * Alterna entre modo claro y oscuro
   */
  toggleDarkMode(): void {
    const currentTheme = this.currentTheme();
    const newTheme = { ...currentTheme, isDark: !currentTheme.isDark };
    this.currentTheme.set(newTheme);
    this.isDarkMode.set(newTheme.isDark);
    this.applyTheme(newTheme);
    
    const mode = newTheme.isDark ? 'oscuro' : 'claro';
    this.snackBar.open(`Modo ${mode} activado`, 'Cerrar', {
      duration: 2000
    });
  }

  /**
   * Aplica el tema al documento
   */
  private applyTheme(theme: ThemeConfig): void {
    const root = document.documentElement;
    
    // Aplicar colores del tema
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--warn-color', theme.warn);
    
    // Aplicar modo oscuro
    if (theme.isDark) {
      root.classList.add('dark-theme');
      document.body.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      document.body.classList.remove('dark-theme');
    }
  }

  /**
   * Guarda el tema seleccionado en localStorage
   */
  private saveTheme(themeName: string): void {
    localStorage.setItem('selected-theme', themeName);
  }

  /**
   * Carga el tema guardado desde localStorage
   */
  private loadSavedTheme(): void {
    const savedTheme = localStorage.getItem('selected-theme');
    if (savedTheme) {
      this.setTheme(savedTheme);
    }
  }

  /**
   * Obtiene el tema por defecto
   */
  getDefaultTheme(): ThemeConfig {
    return this.themes[0];
  }

  /**
   * Restablece al tema por defecto
   */
  resetToDefault(): void {
    this.setTheme(this.themes[0].name);
  }
} 