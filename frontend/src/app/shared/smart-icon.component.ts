import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconService } from '../services/icon.service';

/**
 * Componente de icono inteligente que usa Material Icons con fallbacks automáticos.
 * 
 * Este componente detecta automáticamente si Material Icons están disponibles en el navegador.
 * Si están disponibles, muestra el icono de Material Icons. Si no están disponibles (por ejemplo,
 * si la CDN falla o está bloqueada), automáticamente usa emojis como fallback.
 * 
 * **Comportamiento de Fallback:**
 * - Detecta automáticamente la disponibilidad de Material Icons
 * - Si Material Icons están cargados: muestra el icono normal
 * - Si Material Icons NO están cargados: muestra emoji equivalente
 * - El cambio es transparente para el usuario
 * - Mantiene toda la funcionalidad (tooltips, clicks, etc.)
 * 
 * **Características:**
 * - Tooltips automáticos con descripción del icono
 * - Estados clickable y disabled
 * - Tamaños predefinidos: small (18px), normal (24px), large (32px), xl (48px)
 * - Efectos hover suaves
 * - Integración completa con IconService
 * 
 * @example
 * ```html
 * <!-- Uso básico -->
 * <app-smart-icon [iconName]="'home'" [size]="24"></app-smart-icon>
 * 
 * <!-- Con tooltip personalizado -->
 * <app-smart-icon 
 *   [iconName]="'business'" 
 *   [size]="32" 
 *   [tooltipText]="'Información de empresa'">
 * </app-smart-icon>
 * 
 * <!-- Icono clickeable con efecto hover -->
 * <app-smart-icon 
 *   [iconName]="'edit'" 
 *   [clickable]="true" 
 *   [size]="20"
 *   (click)="editItem()">
 * </app-smart-icon>
 * 
 * <!-- Icono deshabilitado -->
 * <app-smart-icon 
 *   [iconName]="'save'" 
 *   [disabled]="true">
 * </app-smart-icon>
 * 
 * <!-- Diferentes tamaños -->
 * <app-smart-icon [iconName]="'star'" [size]="18"></app-smart-icon> <!-- small -->
 * <app-smart-icon [iconName]="'star'" [size]="24"></app-smart-icon> <!-- normal -->
 * <app-smart-icon [iconName]="'star'" [size]="32"></app-smart-icon> <!-- large -->
 * <app-smart-icon [iconName]="'star'" [size]="48"></app-smart-icon> <!-- xl -->
 * 
 * <!-- En botones -->
 * <button mat-button>
 *   <app-smart-icon [iconName]="'add'" [size]="20"></app-smart-icon>
 *   Agregar
 * </button>
 * 
 * <!-- En headers de cards -->
 * <mat-card-header>
 *   <app-smart-icon 
 *     [iconName]="'business'" 
 *     [size]="24" 
 *     mat-card-avatar>
 *   </app-smart-icon>
 *   <mat-card-title>Empresa</mat-card-title>
 * </mat-card-header>
 * ```
 * 
 * @example
 * ```typescript
 * // En el componente TypeScript
 * export class MyComponent {
 *   // Iconos dinámicos
 *   getStatusIcon(status: string): string {
 *     switch(status) {
 *       case 'active': return 'check_circle';
 *       case 'inactive': return 'cancel';
 *       default: return 'help';
 *     }
 *   }
 * 
 *   // Verificar estado de iconos
 *   checkIconStatus() {
 *     const smartIcon = this.smartIconRef.nativeElement;
 *     console.log(smartIcon.getIconStatus());
 *   }
 * }
 * ```
 */
@Component({
  selector: 'app-smart-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="material-icons smart-icon" 
      [class]="iconClass()"
      [style.font-size.px]="size"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.line-height.px]="size"
      [attr.data-icon]="iconName"
      [title]="tooltip()">
      {{ iconContent() }}
    </span>
  `,
  styles: [`
    .smart-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      vertical-align: middle !important;
      transition: all 0.2s ease !important;
    }
    
    .smart-icon:hover {
      transform: scale(1.1);
    }
    
    .smart-icon.icon-small {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      line-height: 18px !important;
    }
    
    .smart-icon.icon-large {
      font-size: 32px !important;
      width: 32px !important;
      height: 32px !important;
      line-height: 32px !important;
    }
    
    .smart-icon.icon-xl {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      line-height: 48px !important;
    }
    
    .smart-icon.clickable {
      cursor: pointer;
    }
    
    .smart-icon.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class SmartIconComponent {
  private iconService = inject(IconService);

  /** 
   * Nombre del icono de Material Icons a mostrar.
   * 
   * Debe corresponder a un nombre válido de Material Icons (ej: 'home', 'business', 'edit', 'delete').
   * Si el icono no existe en Material Icons, se mostrará el nombre tal cual.
   * Si Material Icons no están disponibles, se usará el emoji fallback correspondiente.
   * 
   * @example 'home', 'business', 'edit', 'delete', 'add', 'search'
   */
  @Input() iconName: string = '';
  
  /** 
   * Tamaño del icono en píxeles.
   * 
   * Tamaños predefinidos con clases CSS especiales:
   * - 18px o menor: aplica clase 'icon-small'
   * - 24px (default): tamaño normal
   * - 32px o mayor: aplica clase 'icon-large'  
   * - 48px o mayor: aplica clase 'icon-xl'
   * 
   * @default 24
   * @example 18, 20, 24, 32, 48
   */
  @Input() size: number = 24;
  
  /** 
   * Texto personalizado para el tooltip del icono.
   * 
   * Si no se proporciona, el componente usará automáticamente la descripción
   * del icono desde IconService. Si el icono no tiene descripción, usará el nombre del icono.
   * 
   * @default '' (usa descripción automática)
   * @example 'Editar elemento', 'Eliminar registro', 'Información de empresa'
   */
  @Input() tooltipText: string = '';
  
  /** 
   * Indica si el icono es clickeable.
   * 
   * Cuando es true:
   * - Aplica cursor pointer
   * - Agrega efecto hover con scale(1.1)
   * - Agrega clase CSS 'clickable'
   * 
   * @default false
   */
  @Input() clickable: boolean = false;
  
  /** 
   * Indica si el icono está deshabilitado.
   * 
   * Cuando es true:
   * - Aplica opacidad 0.5
   * - Aplica cursor not-allowed
   * - Agrega clase CSS 'disabled'
   * - Anula efectos hover
   * 
   * @default false
   */
  @Input() disabled: boolean = false;

  /**
   * Contenido del icono que se muestra en el template.
   * 
   * Este computed signal se actualiza automáticamente cuando:
   * - Cambia el iconName
   * - Cambia el estado de Material Icons (cargado/no cargado)
   * 
   * Comportamiento:
   * - Si Material Icons están disponibles: retorna el nombre del icono
   * - Si Material Icons NO están disponibles: retorna el emoji fallback
   * - Si no hay fallback disponible: retorna el nombre del icono
   * 
   * @returns El contenido a mostrar (nombre de icono o emoji)
   */
  readonly iconContent = computed(() => {
    return this.iconService.getIconText(this.iconName);
  });

  /**
   * Clases CSS aplicadas dinámicamente al elemento del icono.
   * 
   * Genera las clases según:
   * - Tamaño: 'icon-small', 'icon-large', 'icon-xl'
   * - Estado: 'clickable', 'disabled'
   * - Base: 'smart-icon' (siempre presente)
   * 
   * @returns String con las clases CSS separadas por espacios
   */
  readonly iconClass = computed(() => {
    const classes = ['smart-icon'];
    
    if (this.size <= 18) classes.push('icon-small');
    else if (this.size >= 32) classes.push('icon-large');
    if (this.size >= 48) classes.push('icon-xl');
    if (this.clickable) classes.push('clickable');
    if (this.disabled) classes.push('disabled');
    
    return classes.join(' ');
  });

  /**
   * Texto del tooltip que se muestra al hacer hover.
   * 
   * Prioridad:
   * 1. tooltipText personalizado (si se proporciona)
   * 2. Descripción del icono desde IconService
   * 3. Nombre del icono como fallback
   * 
   * @returns El texto del tooltip a mostrar
   */
  readonly tooltip = computed(() => {
    if (this.tooltipText) return this.tooltipText;
    
    const iconInfo = this.iconService.getIconInfo(this.iconName);
    return iconInfo ? iconInfo.description : this.iconName;
  });

  /**
   * Obtiene el estado actual del servicio de iconos.
   * 
   * Útil para debugging o para verificar si Material Icons están funcionando correctamente.
   * 
   * @returns Objeto con información detallada:
   *   - loaded: boolean - Si Material Icons están cargados
   *   - fallbackMode: boolean - Si está usando fallbacks
   *   - totalFallbacks: number - Cantidad de fallbacks disponibles
   * 
   * @example
   * ```typescript
   * const status = this.smartIcon.getIconStatus();
   * console.log('Material Icons loaded:', status.loaded);
   * console.log('Using fallbacks:', status.fallbackMode);
   * console.log('Available fallbacks:', status.totalFallbacks);
   * ```
   */
  getIconStatus() {
    return this.iconService.getIconStatus();
  }

  /**
   * Fuerza la recarga del sistema de iconos.
   * 
   * Útil para:
   * - Debugging cuando los iconos no se muestran correctamente
   * - Recuperación después de problemas de red
   * - Testing del comportamiento de fallback
   * 
   * Reinicia la detección de Material Icons y actualiza todos los componentes.
   * 
   * @example
   * ```typescript
   * // En caso de problemas con iconos
   * this.smartIcon.forceReload();
   * 
   * // Para testing
   * this.smartIcon.forceReload();
   * setTimeout(() => {
   *   console.log('New status:', this.smartIcon.getIconStatus());
   * }, 100);
   * ```
   */
  forceReload() {
    this.iconService.forceReload();
  }
} 