import { Injectable } from '@angular/core';

/**
 * Servicio para gestionar la navegación por teclado
 * Proporciona utilidades para mejorar la accesibilidad
 */
@Injectable({
  providedIn: 'root'
})
export class KeyboardNavigationService {

  /**
   * Maneja la navegación por teclado en una lista de elementos
   * @param event Evento de teclado
   * @param currentIndex Índice actual
   * @param totalItems Total de elementos
   * @param onNavigate Callback cuando se navega
   * @param onSelect Callback cuando se selecciona
   */
  handleListNavigation(
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    onNavigate: (newIndex: number) => void,
    onSelect?: (index: number) => void
  ): void {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = Math.min(currentIndex + 1, totalItems - 1);
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      
      case 'End':
        event.preventDefault();
        newIndex = totalItems - 1;
        break;
      
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onSelect) {
          onSelect(currentIndex);
        }
        return;
      
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      onNavigate(newIndex);
    }
  }

  /**
   * Maneja la navegación por teclado en una tabla
   * @param event Evento de teclado
   * @param currentRow Fila actual
   * @param currentCol Columna actual
   * @param totalRows Total de filas
   * @param totalCols Total de columnas
   * @param onNavigate Callback cuando se navega
   */
  handleTableNavigation(
    event: KeyboardEvent,
    currentRow: number,
    currentCol: number,
    totalRows: number,
    totalCols: number,
    onNavigate: (row: number, col: number) => void
  ): void {
    let newRow = currentRow;
    let newCol = currentCol;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newRow = Math.min(currentRow + 1, totalRows - 1);
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        newRow = Math.max(currentRow - 1, 0);
        break;
      
      case 'ArrowRight':
        event.preventDefault();
        newCol = Math.min(currentCol + 1, totalCols - 1);
        break;
      
      case 'ArrowLeft':
        event.preventDefault();
        newCol = Math.max(currentCol - 1, 0);
        break;
      
      case 'Home':
        event.preventDefault();
        if (event.ctrlKey) {
          newRow = 0;
          newCol = 0;
        } else {
          newCol = 0;
        }
        break;
      
      case 'End':
        event.preventDefault();
        if (event.ctrlKey) {
          newRow = totalRows - 1;
          newCol = totalCols - 1;
        } else {
          newCol = totalCols - 1;
        }
        break;
      
      default:
        return;
    }

    if (newRow !== currentRow || newCol !== currentCol) {
      onNavigate(newRow, newCol);
    }
  }

  /**
   * Enfoca un elemento de forma segura
   * @param element Elemento a enfocar
   * @param options Opciones de enfoque
   */
  focusElement(element: HTMLElement | null, options?: FocusOptions): void {
    if (element) {
      setTimeout(() => {
        element.focus(options);
      }, 0);
    }
  }

  /**
   * Crea un anuncio para lectores de pantalla
   * @param message Mensaje a anunciar
   * @param priority Prioridad del anuncio
   */
  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Verifica si un elemento es focusable
   * @param element Elemento a verificar
   */
  isFocusable(element: HTMLElement): boolean {
    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      return false;
    }

    const tabindex = element.getAttribute('tabindex');
    if (tabindex !== null) {
      return parseInt(tabindex, 10) >= 0;
    }

    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    return focusableTags.includes(element.tagName);
  }

  /**
   * Obtiene todos los elementos focusables dentro de un contenedor
   * @param container Contenedor
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }

  /**
   * Atrapa el foco dentro de un contenedor (útil para modales)
   * @param container Contenedor
   * @param event Evento de teclado
   */
  trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}
