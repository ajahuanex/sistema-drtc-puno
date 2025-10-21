import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconService } from '../services/icon.service';

/**
 * Componente de icono inteligente que usa Material Icons con fallbacks automáticos.
 * 
 * Cuando Material Icons no están disponibles, automáticamente usa emojis como fallback.
 * Incluye funcionalidades adicionales como tooltips, estados clickable/disabled y tamaños predefinidos.
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
 * <!-- Icono clickeable -->
 * <app-smart-icon 
 *   [iconName]="'edit'" 
 *   [clickable]="true" 
 *   [size]="20">
 * </app-smart-icon>
 * 
 * <!-- Icono deshabilitado -->
 * <app-smart-icon 
 *   [iconName]="'save'" 
 *   [disabled]="true">
 * </app-smart-icon>
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

  /** Nombre del icono de Material Icons (ej: 'home', 'business', 'edit') */
  @Input() iconName: string = '';
  
  /** Tamaño del icono en píxeles. Tamaños comunes: 18 (small), 24 (normal), 32 (large), 48 (xl) */
  @Input() size: number = 24;
  
  /** Texto del tooltip. Si no se proporciona, usa la descripción automática del IconService */
  @Input() tooltipText: string = '';
  
  /** Si true, aplica estilos de cursor pointer y efecto hover */
  @Input() clickable: boolean = false;
  
  /** Si true, aplica opacidad reducida y cursor not-allowed */
  @Input() disabled: boolean = false;

  /**
   * Contenido del icono (Material Icons o emoji fallback)
   * Se actualiza automáticamente según la disponibilidad de Material Icons
   */
  readonly iconContent = computed(() => {
    return this.iconService.getIconText(this.iconName);
  });

  /**
   * Clases CSS aplicadas al icono según su estado y tamaño
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
   * Texto del tooltip (personalizado o automático)
   */
  readonly tooltip = computed(() => {
    if (this.tooltipText) return this.tooltipText;
    
    const iconInfo = this.iconService.getIconInfo(this.iconName);
    return iconInfo ? iconInfo.description : this.iconName;
  });

  /**
   * Obtiene el estado actual del servicio de iconos
   * @returns Objeto con información sobre la carga de Material Icons y fallbacks disponibles
   */
  getIconStatus() {
    return this.iconService.getIconStatus();
  }

  /**
   * Fuerza la recarga del sistema de iconos
   * Útil para debugging o cuando se detectan problemas de carga
   */
  forceReload() {
    this.iconService.forceReload();
  }
} 