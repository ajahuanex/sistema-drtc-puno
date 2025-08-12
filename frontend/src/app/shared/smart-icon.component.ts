import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconService } from '../services/icon.service';

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

  @Input() iconName: string = '';
  @Input() size: number = 24;
  @Input() tooltipText: string = '';
  @Input() clickable: boolean = false;
  @Input() disabled: boolean = false;

  // Computed properties
  readonly iconContent = computed(() => {
    return this.iconService.getIconText(this.iconName);
  });

  readonly iconClass = computed(() => {
    const classes = ['smart-icon'];
    
    if (this.size <= 18) classes.push('icon-small');
    else if (this.size >= 32) classes.push('icon-large');
    if (this.size >= 48) classes.push('icon-xl');
    if (this.clickable) classes.push('clickable');
    if (this.disabled) classes.push('disabled');
    
    return classes.join(' ');
  });

  readonly tooltip = computed(() => {
    if (this.tooltipText) return this.tooltipText;
    
    const iconInfo = this.iconService.getIconInfo(this.iconName);
    return iconInfo ? iconInfo.description : this.iconName;
  });

  // Método para obtener el estado del servicio de iconos
  getIconStatus() {
    return this.iconService.getIconStatus();
  }

  // Método para forzar recarga de iconos
  forceReload() {
    this.iconService.forceReload();
  }
} 