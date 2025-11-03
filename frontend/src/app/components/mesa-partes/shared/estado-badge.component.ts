import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EstadoDocumento } from '../../../models/mesa-partes/documento.model';

export type BadgeSize = 'small' | 'medium' | 'large';
export type BadgeVariant = 'filled' | 'outlined' | 'text';

@Component({
  selector: 'app-estado-badge',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <span 
      class="estado-badge"
      [ngClass]="getBadgeClasses()"
      [matTooltip]="showTooltip ? getTooltipText() : ''"
      [attr.aria-label]="getAriaLabel()">
      
      <mat-icon 
        *ngIf="showIcon" 
        class="estado-icon"
        [ngClass]="getIconClasses()">
        {{ getEstadoIcon() }}
      </mat-icon>
      
      <span class="estado-text" *ngIf="showText">
        {{ getEstadoLabel() }}
      </span>
      
      <!-- Indicador de pulso para estados activos -->
      <span 
        *ngIf="showPulse && isActiveState()" 
        class="pulse-indicator">
      </span>
    </span>
  `,
  styles: [`
    .estado-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border-radius: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
      position: relative;
      white-space: nowrap;
      vertical-align: middle;
    }

    /* Sizes */
    .estado-badge.size-small {
      padding: 2px 6px;
      font-size: 10px;
      min-height: 20px;
    }

    .estado-badge.size-medium {
      padding: 4px 8px;
      font-size: 12px;
      min-height: 24px;
    }

    .estado-badge.size-large {
      padding: 6px 12px;
      font-size: 14px;
      min-height: 32px;
    }

    /* Variants - REGISTRADO */
    .estado-badge.estado-registrado.variant-filled {
      background: #e3f2fd;
      color: #1976d2;
      border: 1px solid #bbdefb;
    }

    .estado-badge.estado-registrado.variant-outlined {
      background: transparent;
      color: #1976d2;
      border: 1px solid #1976d2;
    }

    .estado-badge.estado-registrado.variant-text {
      background: transparent;
      color: #1976d2;
      border: none;
    }

    /* Variants - EN_PROCESO */
    .estado-badge.estado-en_proceso.variant-filled {
      background: #fff3e0;
      color: #f57c00;
      border: 1px solid #ffcc02;
    }

    .estado-badge.estado-en_proceso.variant-outlined {
      background: transparent;
      color: #f57c00;
      border: 1px solid #f57c00;
    }

    .estado-badge.estado-en_proceso.variant-text {
      background: transparent;
      color: #f57c00;
      border: none;
    }

    /* Variants - ATENDIDO */
    .estado-badge.estado-atendido.variant-filled {
      background: #e8f5e8;
      color: #388e3c;
      border: 1px solid #c8e6c9;
    }

    .estado-badge.estado-atendido.variant-outlined {
      background: transparent;
      color: #388e3c;
      border: 1px solid #388e3c;
    }

    .estado-badge.estado-atendido.variant-text {
      background: transparent;
      color: #388e3c;
      border: none;
    }

    /* Variants - ARCHIVADO */
    .estado-badge.estado-archivado.variant-filled {
      background: #f3e5f5;
      color: #7b1fa2;
      border: 1px solid #e1bee7;
    }

    .estado-badge.estado-archivado.variant-outlined {
      background: transparent;
      color: #7b1fa2;
      border: 1px solid #7b1fa2;
    }

    .estado-badge.estado-archivado.variant-text {
      background: transparent;
      color: #7b1fa2;
      border: none;
    }

    /* Icons */
    .estado-icon {
      transition: all 0.2s ease;
    }

    .estado-icon.size-small {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    .estado-icon.size-medium {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .estado-icon.size-large {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Text */
    .estado-text {
      line-height: 1;
      font-weight: inherit;
    }

    /* Pulse indicator */
    .pulse-indicator {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      background: currentColor;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .size-small .pulse-indicator {
      width: 6px;
      height: 6px;
      top: -1px;
      right: -1px;
    }

    .size-large .pulse-indicator {
      width: 10px;
      height: 10px;
      top: -3px;
      right: -3px;
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.7;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Hover effects */
    .estado-badge:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .estado-badge.variant-outlined:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .estado-badge.variant-text:hover {
      background: rgba(0, 0, 0, 0.04);
      border-radius: 4px;
    }

    /* Interactive states */
    .estado-badge.clickable {
      cursor: pointer;
      user-select: none;
    }

    .estado-badge.clickable:active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    /* Accessibility */
    .estado-badge:focus {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .estado-badge.variant-filled {
        border-width: 2px;
      }
      
      .estado-badge.variant-text {
        text-decoration: underline;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .estado-badge,
      .estado-icon,
      .pulse-indicator {
        animation: none;
        transition: none;
      }
      
      .estado-badge:hover {
        transform: none;
      }
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .estado-badge.variant-filled {
        filter: brightness(0.9);
      }
      
      .estado-badge.variant-outlined,
      .estado-badge.variant-text {
        filter: brightness(1.2);
      }
    }
  `]
})
export class EstadoBadgeComponent {
  @Input() estado!: EstadoDocumento;
  @Input() size: BadgeSize = 'medium';
  @Input() variant: BadgeVariant = 'filled';
  @Input() showIcon = true;
  @Input() showText = true;
  @Input() showTooltip = false;
  @Input() showPulse = false;
  @Input() clickable = false;
  @Input() customLabel?: string;
  @Input() customIcon?: string;
  @Input() customTooltip?: string;

  /**
   * Obtener clases CSS del badge
   */
  getBadgeClasses(): string {
    const classes = [
      `size-${this.size}`,
      `variant-${this.variant}`,
      `estado-${this.estado.toLowerCase()}`
    ];

    if (this.clickable) {
      classes.push('clickable');
    }

    return classes.join(' ');
  }

  /**
   * Obtener clases CSS del icono
   */
  getIconClasses(): string {
    return `size-${this.size}`;
  }

  /**
   * Obtener icono según el estado
   */
  getEstadoIcon(): string {
    if (this.customIcon) {
      return this.customIcon;
    }

    switch (this.estado) {
      case EstadoDocumento.REGISTRADO:
        return 'fiber_new';
      case EstadoDocumento.EN_PROCESO:
        return 'hourglass_empty';
      case EstadoDocumento.ATENDIDO:
        return 'check_circle';
      case EstadoDocumento.ARCHIVADO:
        return 'archive';
      default:
        return 'help';
    }
  }

  /**
   * Obtener etiqueta según el estado
   */
  getEstadoLabel(): string {
    if (this.customLabel) {
      return this.customLabel;
    }

    switch (this.estado) {
      case EstadoDocumento.REGISTRADO:
        return 'Registrado';
      case EstadoDocumento.EN_PROCESO:
        return 'En Proceso';
      case EstadoDocumento.ATENDIDO:
        return 'Atendido';
      case EstadoDocumento.ARCHIVADO:
        return 'Archivado';
      default:
        return this.estado;
    }
  }

  /**
   * Obtener texto del tooltip
   */
  getTooltipText(): string {
    if (this.customTooltip) {
      return this.customTooltip;
    }

    switch (this.estado) {
      case EstadoDocumento.REGISTRADO:
        return 'Documento registrado en el sistema';
      case EstadoDocumento.EN_PROCESO:
        return 'Documento en proceso de atención';
      case EstadoDocumento.ATENDIDO:
        return 'Documento atendido completamente';
      case EstadoDocumento.ARCHIVADO:
        return 'Documento archivado';
      default:
        return `Estado: ${this.estado}`;
    }
  }

  /**
   * Obtener etiqueta ARIA para accesibilidad
   */
  getAriaLabel(): string {
    return `Estado del documento: ${this.getEstadoLabel()}`;
  }

  /**
   * Verificar si el estado es activo (para mostrar pulso)
   */
  isActiveState(): boolean {
    return this.estado === EstadoDocumento.EN_PROCESO;
  }
}