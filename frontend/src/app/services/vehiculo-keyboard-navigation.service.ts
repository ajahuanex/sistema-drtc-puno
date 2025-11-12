import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Servicio para manejar la navegación por teclado en el módulo de vehículos
 * 
 * Proporciona atajos de teclado y mejora la accesibilidad mediante navegación con teclado
 */
@Injectable({
  providedIn: 'root'
})
export class VehiculoKeyboardNavigationService {
  private router = inject(Router);

  /**
   * Atajos de teclado disponibles
   */
  private shortcuts = new Map<string, () => void>();

  /**
   * Registrar un atajo de teclado
   * @param key Combinación de teclas (ej: 'ctrl+n', 'alt+f')
   * @param callback Función a ejecutar
   */
  registerShortcut(key: string, callback: () => void): void {
    this.shortcuts.set(key.toLowerCase(), callback);
  }

  /**
   * Desregistrar un atajo de teclado
   * @param key Combinación de teclas
   */
  unregisterShortcut(key: string): void {
    this.shortcuts.delete(key.toLowerCase());
  }

  /**
   * Manejar evento de teclado
   * @param event Evento de teclado
   * @returns true si se manejó el evento, false en caso contrario
   */
  handleKeyboardEvent(event: KeyboardEvent): boolean {
    const key = this.getKeyString(event);
    const callback = this.shortcuts.get(key);

    if (callback) {
      event.preventDefault();
      callback();
      return true;
    }

    return false;
  }

  /**
   * Obtener string de la combinación de teclas
   * @param event Evento de teclado
   * @returns String representando la combinación
   */
  private getKeyString(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('meta');

    parts.push(event.key.toLowerCase());

    return parts.join('+');
  }

  /**
   * Configurar atajos de teclado por defecto para el módulo de vehículos
   */
  setupDefaultShortcuts(callbacks: {
    nuevoVehiculo?: () => void;
    buscar?: () => void;
    filtrar?: () => void;
    limpiarFiltros?: () => void;
    exportar?: () => void;
    actualizar?: () => void;
  }): void {
    // Ctrl+N: Nuevo vehículo
    if (callbacks.nuevoVehiculo) {
      this.registerShortcut('ctrl+n', callbacks.nuevoVehiculo);
    }

    // Ctrl+F: Enfocar búsqueda
    if (callbacks.buscar) {
      this.registerShortcut('ctrl+f', callbacks.buscar);
    }

    // Ctrl+Shift+F: Abrir filtros
    if (callbacks.filtrar) {
      this.registerShortcut('ctrl+shift+f', callbacks.filtrar);
    }

    // Ctrl+Shift+C: Limpiar filtros
    if (callbacks.limpiarFiltros) {
      this.registerShortcut('ctrl+shift+c', callbacks.limpiarFiltros);
    }

    // Ctrl+E: Exportar
    if (callbacks.exportar) {
      this.registerShortcut('ctrl+e', callbacks.exportar);
    }

    // Ctrl+R: Actualizar
    if (callbacks.actualizar) {
      this.registerShortcut('ctrl+r', callbacks.actualizar);
    }
  }

  /**
   * Limpiar todos los atajos registrados
   */
  clearAllShortcuts(): void {
    this.shortcuts.clear();
  }

  /**
   * Navegar a la siguiente fila en una tabla
   * @param currentIndex Índice actual
   * @param totalRows Total de filas
   * @returns Nuevo índice
   */
  navigateToNextRow(currentIndex: number, totalRows: number): number {
    return Math.min(currentIndex + 1, totalRows - 1);
  }

  /**
   * Navegar a la fila anterior en una tabla
   * @param currentIndex Índice actual
   * @returns Nuevo índice
   */
  navigateToPreviousRow(currentIndex: number): number {
    return Math.max(currentIndex - 1, 0);
  }

  /**
   * Navegar a la primera fila
   * @returns Índice de la primera fila
   */
  navigateToFirstRow(): number {
    return 0;
  }

  /**
   * Navegar a la última fila
   * @param totalRows Total de filas
   * @returns Índice de la última fila
   */
  navigateToLastRow(totalRows: number): number {
    return Math.max(totalRows - 1, 0);
  }

  /**
   * Manejar navegación por teclado en tabla
   * @param event Evento de teclado
   * @param currentIndex Índice actual
   * @param totalRows Total de filas
   * @param onNavigate Callback cuando se navega
   * @returns true si se manejó el evento
   */
  handleTableNavigation(
    event: KeyboardEvent,
    currentIndex: number,
    totalRows: number,
    onNavigate: (newIndex: number) => void
  ): boolean {
    let newIndex: number | null = null;

    switch (event.key) {
      case 'ArrowDown':
        newIndex = this.navigateToNextRow(currentIndex, totalRows);
        break;
      case 'ArrowUp':
        newIndex = this.navigateToPreviousRow(currentIndex);
        break;
      case 'Home':
        newIndex = this.navigateToFirstRow();
        break;
      case 'End':
        newIndex = this.navigateToLastRow(totalRows);
        break;
      case 'PageDown':
        newIndex = Math.min(currentIndex + 10, totalRows - 1);
        break;
      case 'PageUp':
        newIndex = Math.max(currentIndex - 10, 0);
        break;
    }

    if (newIndex !== null && newIndex !== currentIndex) {
      event.preventDefault();
      onNavigate(newIndex);
      return true;
    }

    return false;
  }

  /**
   * Enfocar elemento por selector
   * @param selector Selector CSS
   * @param delay Delay en ms antes de enfocar
   */
  focusElement(selector: string, delay: number = 0): void {
    setTimeout(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        element.focus();
      }
    }, delay);
  }

  /**
   * Obtener descripción de atajos de teclado
   * @returns Array de descripciones de atajos
   */
  getShortcutDescriptions(): Array<{ key: string; description: string }> {
    return [
      { key: 'Ctrl+N', description: 'Crear nuevo vehículo' },
      { key: 'Ctrl+F', description: 'Enfocar búsqueda' },
      { key: 'Ctrl+Shift+F', description: 'Abrir filtros avanzados' },
      { key: 'Ctrl+Shift+C', description: 'Limpiar filtros' },
      { key: 'Ctrl+E', description: 'Exportar vehículos' },
      { key: 'Ctrl+R', description: 'Actualizar lista' },
      { key: 'Tab', description: 'Navegar entre elementos' },
      { key: 'Shift+Tab', description: 'Navegar hacia atrás' },
      { key: 'Enter', description: 'Activar elemento enfocado' },
      { key: 'Space', description: 'Seleccionar/deseleccionar' },
      { key: 'Escape', description: 'Cerrar modal o cancelar' },
      { key: 'Arrow Up/Down', description: 'Navegar en tabla' },
      { key: 'Home/End', description: 'Ir al inicio/fin de tabla' },
      { key: 'Page Up/Down', description: 'Navegar 10 filas' }
    ];
  }
}
