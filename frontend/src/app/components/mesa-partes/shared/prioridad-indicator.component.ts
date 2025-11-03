import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PrioridadDocumento } from '../../../models/mesa-partes/documento.model';

export type IndicatorSize = 'small' | 'medium' | 'large';
export type IndicatorStyle = 'badge' | 'icon' | 'bar' | 'dot';

@Component({
  selector: 'app-prioridad-indicator',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <!-- Badge Style -->
    <span 
      *ngIf="style === 'badge'"
      class="prioridad-badge"
      [ngClass]="getBadgeClasses()"
      [matTooltip]="showTooltip ? getTooltipText() : ''"
      [attr.aria-label]="getAriaLabel()">
      
      <mat-icon 
        *ngIf="showIcon" 
        class="prioridad-icon"
        [ngClass]="getIconClasses()">
        {{ getPrioridadIcon() }}
      </mat-icon>
      
      <span class="prioridad-text" *ngIf="showText">
        {{ getPrioridadLabel() }}
      </span>
      
      <!-- Indicador de pulso para urgente -->
      <span 
        *ngIf="showPulse && prioridad === 'URGENTE'" 
        class="pulse-indicator">
      </span>
    </span>

    <!-- Icon Style -->
    <mat-icon 
      *ngIf="style === 'icon'"
      class="prioridad-icon-only"
      [ngClass]="getIconOnlyClasses()"
      [matTooltip]="showTooltip ? getTooltipText() : ''"
      [attr.aria-label]="getAriaLabel()">
      {{ getPrioridadIcon() }}
    </mat-icon>

    <!-- Bar Style -->
    <div 
      *ngIf="style === 'bar'"
      class="prioridad-bar"
      [ngClass]="getBarClasses()"
      [matTooltip]="showTooltip ? getTooltipText() : ''"
      [attr.aria-label]="getAriaLabel()">
      <div class="bar-fill" [ngClass]="getBarFillClasses()"></div>
    </div>

    <!-- Dot Style -->
    <span 
      *ngIf="style === 'dot'"
      class="prioridad-dot"
      [ngClass]="getDotClasses()"
      [matTooltip]="showTooltip ? getTooltipText() : ''"
      [attr.aria-label]="getAriaLabel()">
      <span 
        *ngIf="showPulse && prioridad === 'URGENTE'" 
        class="dot-pulse">
      </span>
    </span>
  `,
  styles: [`
    /* Badge Style */
    .prioridad-badge {
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

    /* Badge Sizes */
    .prioridad-badge.size-small {
      padding: 2px 6px;
      font-size: 10px;
      min-height: 20px;
    }

    .prioridad-badge.size-medium {
      padding: 4px 8px;
      font-size: 12px;
      min-height: 24px;
    }

    .prioridad-badge.size-large {
      padding: 6px 12px;
      font-size: 14px;
      min-height: 32px;
    }

    /* Badge Colors - NORMAL */
    .prioridad-badge.prioridad-normal {
      background: #f5f5f5;
      color: #616161;
      border: 1px solid #e0e0e0;
    }

    /* Badge Colors - ALTA */
    .prioridad-badge.prioridad-alta {
      background: #fff3e0;
      color: #f57c00;
      border: 1px solid #ffcc02;
    }

    /* Badge Colors - URGENTE */
    .prioridad-badge.prioridad-urgente {
      background: #ffebee;
      color: #d32f2f;
      border: 1px solid #ffcdd2;
      animation: urgentGlow 2s infinite;
    }

    @keyframes urgentGlow {
      0%, 100% {
        box-shadow: 0 0 5px rgba(211, 47, 47, 0.3);
      }
      50% {
        box-shadow: 0 0 15px rgba(211, 47, 47, 0.6);
      }
    }

    /* Badge Icons */
    .prioridad-icon {
      transition: all 0.2s ease;
    }

    .prioridad-icon.size-small {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    .prioridad-icon.size-medium {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .prioridad-icon.size-large {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Badge Text */
    .prioridad-text {
      line-height: 1;
      font-weight: inherit;
    }

    /* Pulse Indicator */
    .pulse-indicator {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      background: #d32f2f;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
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
        transform: scale(1.3);
        opacity: 0.7;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Icon Only Style */
    .prioridad-icon-only {
      transition: all 0.2s ease;
      cursor: default;
    }

    .prioridad-icon-only.size-small {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .prioridad-icon-only.size-medium {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .prioridad-icon-only.size-large {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .prioridad-icon-only.prioridad-normal {
      color: #616161;
    }

    .prioridad-icon-only.prioridad-alta {
      color: #f57c00;
    }

    .prioridad-icon-only.prioridad-urgente {
      color: #d32f2f;
      animation: iconPulse 2s infinite;
    }

    @keyframes iconPulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    /* Bar Style */
    .prioridad-bar {
      position: relative;
      border-radius: 2px;
      overflow: hidden;
      background: #e0e0e0;
    }

    .prioridad-bar.size-small {
      width: 30px;
      height: 4px;
    }

    .prioridad-bar.size-medium {
      width: 40px;
      height: 6px;
    }

    .prioridad-bar.size-large {
      width: 50px;
      height: 8px;
    }

    .bar-fill {
      height: 100%;
      transition: all 0.3s ease;
      border-radius: inherit;
    }

    .bar-fill.prioridad-normal {
      width: 33%;
      background: #616161;
    }

    .bar-fill.prioridad-alta {
      width: 66%;
      background: #f57c00;
    }

    .bar-fill.prioridad-urgente {
      width: 100%;
      background: #d32f2f;
      animation: barPulse 2s infinite;
    }

    @keyframes barPulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    /* Dot Style */
    .prioridad-dot {
      position: relative;
      display: inline-block;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .prioridad-dot.size-small {
      width: 8px;
      height: 8px;
    }

    .prioridad-dot.size-medium {
      width: 12px;
      height: 12px;
    }

    .prioridad-dot.size-large {
      width: 16px;
      height: 16px;
    }

    .prioridad-dot.prioridad-normal {
      background: #616161;
    }

    .prioridad-dot.prioridad-alta {
      background: #f57c00;
    }

    .prioridad-dot.prioridad-urgente {
      background: #d32f2f;
    }

    .dot-pulse {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: inherit;
      animation: dotPulse 2s infinite;
    }

    @keyframes dotPulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }

    /* Hover Effects */
    .prioridad-badge:hover,
    .prioridad-icon-only:hover {
      transform: translateY(-1px);
    }

    .prioridad-bar:hover .bar-fill {
      filter: brightness(1.1);
    }

    .prioridad-dot:hover {
      transform: scale(1.1);
    }

    /* Accessibility */
    .prioridad-badge:focus,
    .prioridad-icon-only:focus,
    .prioridad-bar:focus,
    .prioridad-dot:focus {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .prioridad-badge {
        border-width: 2px;
      }
      
      .prioridad-bar {
        border: 1px solid currentColor;
      }
      
      .prioridad-dot {
        border: 2px solid #000;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .prioridad-badge,
      .prioridad-icon-only,
      .prioridad-bar,
      .prioridad-dot,
      .pulse-indicator,
      .bar-fill,
      .dot-pulse {
        animation: none;
        transition: none;
      }
      
      .prioridad-badge:hover,
      .prioridad-icon-only:hover,
      .prioridad-dot:hover {
        transform: none;
      }
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .prioridad-badge.prioridad-normal {
        background: #424242;
        color: #e0e0e0;
        border-color: #616161;
      }
      
      .prioridad-bar {
        background: #424242;
      }
    }
  `]
})
export class PrioridadIndicatorComponent {
  @Input() prioridad!: PrioridadDocumento;
  @Input() size: IndicatorSize = 'medium';
  @Input() style: IndicatorStyle = 'badge';
  @Input() showIcon = true;
  @Input() showText = true;
  @Input() showTooltip = true;
  @Input() showPulse = true;
  @Input() customLabel?: string;
  @Input() customIcon?: string;
  @Input() customTooltip?: string;

  /**
   * Obtener clases CSS del badge
   */
  getBadgeClasses(): string {
    return [
      `size-${this.size}`,
      `prioridad-${this.prioridad.toLowerCase()}`
    ].join(' ');
  }

  /**
   * Obtener clases CSS del icono
   */
  getIconClasses(): string {
    return `size-${this.size}`;
  }

  /**
   * Obtener clases CSS del icono solo
   */
  getIconOnlyClasses(): string {
    return [
      `size-${this.size}`,
      `prioridad-${this.prioridad.toLowerCase()}`
    ].join(' ');
  }

  /**
   * Obtener clases CSS de la barra
   */
  getBarClasses(): string {
    return `size-${this.size}`;
  }

  /**
   * Obtener clases CSS del relleno de la barra
   */
  getBarFillClasses(): string {
    return `prioridad-${this.prioridad.toLowerCase()}`;
  }

  /**
   * Obtener clases CSS del punto
   */
  getDotClasses(): string {
    return [
      `size-${this.size}`,
      `prioridad-${this.prioridad.toLowerCase()}`
    ].join(' ');
  }

  /**
   * Obtener icono según la prioridad
   */
  getPrioridadIcon(): string {
    if (this.customIcon) {
      return this.customIcon;
    }

    switch (this.prioridad) {
      case PrioridadDocumento.NORMAL:
        return 'remove';
      case PrioridadDocumento.ALTA:
        return 'keyboard_arrow_up';
      case PrioridadDocumento.URGENTE:
        return 'priority_high';
      default:
        return 'help';
    }
  }

  /**
   * Obtener etiqueta según la prioridad
   */
  getPrioridadLabel(): string {
    if (this.customLabel) {
      return this.customLabel;
    }

    switch (this.prioridad) {
      case PrioridadDocumento.NORMAL:
        return 'Normal';
      case PrioridadDocumento.ALTA:
        return 'Alta';
      case PrioridadDocumento.URGENTE:
        return 'Urgente';
      default:
        return this.prioridad;
    }
  }

  /**
   * Obtener texto del tooltip
   */
  getTooltipText(): string {
    if (this.customTooltip) {
      return this.customTooltip;
    }

    switch (this.prioridad) {
      case PrioridadDocumento.NORMAL:
        return 'Prioridad normal - Atención en orden regular';
      case PrioridadDocumento.ALTA:
        return 'Prioridad alta - Requiere atención preferente';
      case PrioridadDocumento.URGENTE:
        return 'Prioridad urgente - Requiere atención inmediata';
      default:
        return `Prioridad: ${this.prioridad}`;
    }
  }

  /**
   * Obtener etiqueta ARIA para accesibilidad
   */
  getAriaLabel(): string {
    return `Prioridad del documento: ${this.getPrioridadLabel()}`;
  }

  /**
   * Obtener nivel numérico de prioridad (para ordenamiento)
   */
  getPrioridadLevel(): number {
    switch (this.prioridad) {
      case PrioridadDocumento.NORMAL:
        return 1;
      case PrioridadDocumento.ALTA:
        return 2;
      case PrioridadDocumento.URGENTE:
        return 3;
      default:
        return 0;
    }
  }

  /**
   * Verificar si es prioridad crítica
   */
  isCritical(): boolean {
    return this.prioridad === PrioridadDocumento.URGENTE;
  }

  /**
   * Verificar si es prioridad elevada
   */
  isElevated(): boolean {
    return this.prioridad === PrioridadDocumento.ALTA || 
           this.prioridad === PrioridadDocumento.URGENTE;
  }
}