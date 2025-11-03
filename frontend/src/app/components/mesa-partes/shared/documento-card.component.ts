import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { Documento, EstadoDocumento, PrioridadDocumento } from '../../../models/mesa-partes/documento.model';
import { EstadoBadgeComponent } from './estado-badge.component';
import { PrioridadIndicatorComponent } from './prioridad-indicator.component';
import { style } from '@angular/animations';

@Component({
  selector: 'app-documento-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    EstadoBadgeComponent,
    PrioridadIndicatorComponent
  ],
  template: `
    <mat-card class="documento-card" [ngClass]="getCardClass()">
      <!-- Header del card -->
      <mat-card-header class="card-header">
        <div class="header-content">
          <div class="expediente-info">
            <h3 class="numero-expediente">{{ documento.numeroExpediente }}</h3>
            <span class="tipo-documento" [matTooltip]="documento.tipoDocumento.nombre">
              <mat-icon class="tipo-icon">{{ getTipoIcon() }}</mat-icon>
              {{ documento.tipoDocumento.codigo }}
            </span>
          </div>
          
          <div class="header-badges">
            <app-prioridad-indicator 
              [prioridad]="documento.prioridad"
              size="small">
            </app-prioridad-indicator>
            
            <app-estado-badge 
              [estado]="documento.estado"
              size="small">
            </app-estado-badge>
          </div>
        </div>

        <!-- Menú de acciones -->
        <button 
          mat-icon-button 
          class="card-menu-button"
          [matMenuTriggerFor]="cardMenu"
          [disabled]="!showActions">
          <mat-icon>more_vert</mat-icon>
        </button>
        
        <mat-menu #cardMenu="matMenu">
          <button mat-menu-item (click)="onVerDetalle()">
            <mat-icon>visibility</mat-icon>
            <span>Ver Detalle</span>
          </button>
          
          <button 
            mat-menu-item 
            (click)="onDerivar()"
            *ngIf="puedeDerivarse()">
            <mat-icon>send</mat-icon>
            <span>Derivar</span>
          </button>
          
          <button 
            mat-menu-item 
            (click)="onDescargarComprobante()">
            <mat-icon>download</mat-icon>
            <span>Descargar Comprobante</span>
          </button>
          
          <button 
            mat-menu-item 
            (click)="onVerQR()">
            <mat-icon>qr_code</mat-icon>
            <span>Ver Código QR</span>
          </button>
          
          <mat-divider *ngIf="puedeArchivarse()"></mat-divider>
          
          <button 
            mat-menu-item 
            (click)="onArchivar()"
            *ngIf="puedeArchivarse()">
            <mat-icon>archive</mat-icon>
            <span>Archivar</span>
          </button>
        </mat-menu>
      </mat-card-header>

      <!-- Contenido principal -->
      <mat-card-content class="card-content">
        <!-- Información del remitente -->
        <div class="remitente-section">
          <div class="section-header">
            <mat-icon class="section-icon">person</mat-icon>
            <span class="section-label">Remitente</span>
          </div>
          <p class="remitente-nombre" [matTooltip]="documento.remitente">
            {{ documento.remitente }}
          </p>
        </div>

        <!-- Asunto del documento -->
        <div class="asunto-section">
          <div class="section-header">
            <mat-icon class="section-icon">subject</mat-icon>
            <span class="section-label">Asunto</span>
          </div>
          <p class="asunto-texto" [matTooltip]="documento.asunto">
            {{ documento.asunto | slice:0:maxAsuntoLength }}{{ documento.asunto.length > maxAsuntoLength ? '...' : '' }}
          </p>
        </div>

        <!-- Información adicional -->
        <div class="info-adicional">
          <div class="info-item">
            <mat-icon class="info-icon">event</mat-icon>
            <span class="info-label">Recepción:</span>
            <span class="info-value">{{ documento.fechaRecepcion | date:'dd/MM/yyyy' }}</span>
          </div>
          
          <div class="info-item" *ngIf="documento.fechaLimite">
            <mat-icon class="info-icon" [ngClass]="getFechaLimiteClass()">schedule</mat-icon>
            <span class="info-label">Límite:</span>
            <span class="info-value" [ngClass]="getFechaLimiteClass()">
              {{ documento.fechaLimite | date:'dd/MM/yyyy' }}
            </span>
          </div>
          
          <div class="info-item">
            <mat-icon class="info-icon">description</mat-icon>
            <span class="info-label">Folios:</span>
            <span class="info-value">{{ documento.numeroFolios }}</span>
          </div>
          
          <div class="info-item" *ngIf="documento.tieneAnexos">
            <mat-icon class="info-icon">attach_file</mat-icon>
            <span class="info-label">Con anexos</span>
          </div>
        </div>

        <!-- Etiquetas -->
        <div class="etiquetas-section" *ngIf="documento.etiquetas && documento.etiquetas.length > 0">
          <mat-chip-set>
            <mat-chip 
              *ngFor="let etiqueta of documento.etiquetas | slice:0:maxEtiquetas"
              class="etiqueta-chip">
              {{ etiqueta }}
            </mat-chip>
            <mat-chip 
              *ngIf="documento.etiquetas.length > maxEtiquetas"
              class="etiqueta-chip more-chip"
              [matTooltip]="getEtiquetasRestantes()">
              +{{ documento.etiquetas.length - maxEtiquetas }}
            </mat-chip>
          </mat-chip-set>
        </div>
      </mat-card-content>

      <!-- Acciones rápidas -->
      <mat-card-actions class="card-actions" *ngIf="showQuickActions">
        <button 
          mat-button 
          color="primary"
          (click)="onVerDetalle()">
          <mat-icon>visibility</mat-icon>
          Ver
        </button>
        
        <button 
          mat-button 
          color="accent"
          (click)="onDerivar()"
          *ngIf="puedeDerivarse()">
          <mat-icon>send</mat-icon>
          Derivar
        </button>
        
        <button 
          mat-button
          (click)="onDescargarComprobante()">
          <mat-icon>download</mat-icon>
          Comprobante
        </button>
      </mat-card-actions>

      <!-- Indicador de urgencia -->
      <div 
        class="urgencia-indicator" 
        *ngIf="esUrgente()"
        matTooltip="Documento urgente">
        <mat-icon>priority_high</mat-icon>
      </div>

      <!-- Indicador de vencimiento -->
      <div 
        class="vencimiento-indicator" 
        *ngIf="estaVencido()"
        matTooltip="Documento vencido">
        <mat-icon>schedule</mat-icon>
      </div>
    </mat-card>
  `,
  styles: [`
    .documento-card {
      position: relative;
      margin-bottom: 16px;
      transition: all 0.3s ease;
      border-radius: 12px;
      overflow: hidden;
    }

    .documento-card:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

    .documento-card.prioridad-urgente {
      border-left: 4px solid #d32f2f;
    }

    .documento-card.prioridad-alta {
      border-left: 4px solid #f57c00;
    }

    .documento-card.estado-vencido {
      background: linear-gradient(135deg, #fff 0%, #ffebee 100%);
    }

    .card-header {
      padding: 16px 16px 8px 16px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }

    .expediente-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .numero-expediente {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      line-height: 1.2;
    }

    .tipo-documento {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #6c757d;
      font-weight: 500;
    }

    .tipo-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #667eea;
    }

    .header-badges {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .card-menu-button {
      width: 32px;
      height: 32px;
      margin-left: 8px;
    }

    .card-content {
      padding: 8px 16px 16px 16px;
    }

    .remitente-section,
    .asunto-section {
      margin-bottom: 12px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .section-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #6c757d;
    }

    .section-label {
      font-size: 12px;
      font-weight: 500;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .remitente-nombre,
    .asunto-texto {
      margin: 0;
      font-size: 14px;
      color: #2c3e50;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .asunto-texto {
      white-space: normal;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .info-adicional {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
    }

    .info-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #6c757d;
    }

    .info-icon.fecha-limite-vencida {
      color: #d32f2f;
    }

    .info-icon.fecha-limite-proxima {
      color: #f57c00;
    }

    .info-label {
      font-weight: 500;
      color: #6c757d;
    }

    .info-value {
      color: #2c3e50;
      font-weight: 500;
    }

    .info-value.fecha-limite-vencida {
      color: #d32f2f;
    }

    .info-value.fecha-limite-proxima {
      color: #f57c00;
    }

    .etiquetas-section {
      margin-bottom: 8px;
    }

    .etiqueta-chip {
      font-size: 11px;
      height: 24px;
      background: #e3f2fd;
      color: #1976d2;
    }

    .more-chip {
      background: #f5f5f5;
      color: #6c757d;
    }

    .card-actions {
      padding: 8px 16px 16px 16px;
      display: flex;
      gap: 8px;
    }

    .card-actions button {
      font-size: 12px;
      min-width: auto;
      padding: 0 12px;
    }

    .card-actions mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .urgencia-indicator,
    .vencimiento-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .urgencia-indicator {
      background: #d32f2f;
      color: white;
      animation: pulse 2s infinite;
    }

    .vencimiento-indicator {
      background: #f57c00;
      color: white;
      top: 44px;
    }

    .urgencia-indicator mat-icon,
    .vencimiento-indicator mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.8;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }

      .header-badges {
        align-self: flex-end;
      }

      .info-adicional {
        grid-template-columns: 1fr;
      }

      .card-actions {
        flex-direction: column;
      }

      .card-actions button {
        width: 100%;
      }
    }

    /* Compact mode */
    .documento-card.compact {
      margin-bottom: 8px;
    }

    .documento-card.compact .card-header {
      padding: 12px 16px 4px 16px;
    }

    .documento-card.compact .card-content {
      padding: 4px 16px 12px 16px;
    }

    .documento-card.compact .numero-expediente {
      font-size: 16px;
    }

    .documento-card.compact .asunto-texto {
      -webkit-line-clamp: 1;
    }

    .documento-card.compact .info-adicional {
      grid-template-columns: repeat(2, 1fr);
    }

    /* Selection state */
    .documento-card.selected {
      border: 2px solid #667eea;
      background: rgba(102, 126, 234, 0.04);
    }

    .documento-card.selected:hover {
      background: rgba(102, 126, 234, 0.08);
    }
  `]
})
export class DocumentoCardComponent {
  @Input() documento!: Documento;
  @Input() showActions = true;
  @Input() showQuickActions = true;
  @Input() compact = false;
  @Input() selectable = false;
  @Input() selected = false;
  @Input() maxAsuntoLength = 120;
  @Input() maxEtiquetas = 3;

  @Output() verDetalle = new EventEmitter<Documento>();
  @Output() derivar = new EventEmitter<Documento>();
  @Output() archivar = new EventEmitter<Documento>();
  @Output() descargarComprobante = new EventEmitter<Documento>();
  @Output() verQR = new EventEmitter<Documento>();
  @Output() selectionChange = new EventEmitter<{ documento: Documento, selected: boolean }>();

  /**
   * Obtener clase CSS del card según estado y prioridad
   */
  getCardClass(): string {
    const classes = [];
    
    if (this.compact) {
      classes.push('compact');
    }
    
    if (this.selected) {
      classes.push('selected');
    }
    
    if (this.documento.prioridad === PrioridadDocumento.URGENTE) {
      classes.push('prioridad-urgente');
    } else if (this.documento.prioridad === PrioridadDocumento.ALTA) {
      classes.push('prioridad-alta');
    }
    
    if (this.estaVencido()) {
      classes.push('estado-vencido');
    }
    
    return classes.join(' ');
  }

  /**
   * Obtener icono según tipo de documento
   */
  getTipoIcon(): string {
    const tipoLower = this.documento.tipoDocumento.nombre.toLowerCase();
    
    if (tipoLower.includes('solicitud')) return 'request_page';
    if (tipoLower.includes('oficio')) return 'description';
    if (tipoLower.includes('memorando')) return 'note';
    if (tipoLower.includes('informe')) return 'assessment';
    if (tipoLower.includes('carta')) return 'mail';
    if (tipoLower.includes('resolución')) return 'gavel';
    if (tipoLower.includes('decreto')) return 'policy';
    
    return 'description';
  }

  /**
   * Verificar si el documento es urgente
   */
  esUrgente(): boolean {
    return this.documento.prioridad === PrioridadDocumento.URGENTE;
  }

  /**
   * Verificar si el documento está vencido
   */
  estaVencido(): boolean {
    if (!this.documento.fechaLimite) return false;
    
    const ahora = new Date();
    const fechaLimite = new Date(this.documento.fechaLimite);
    
    return fechaLimite < ahora && this.documento.estado !== EstadoDocumento.ATENDIDO;
  }

  /**
   * Verificar si la fecha límite está próxima (dentro de 3 días)
   */
  fechaLimiteProxima(): boolean {
    if (!this.documento.fechaLimite || this.estaVencido()) return false;
    
    const ahora = new Date();
    const fechaLimite = new Date(this.documento.fechaLimite);
    const diferenciaDias = Math.ceil((fechaLimite.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
    
    return diferenciaDias <= 3;
  }

  /**
   * Obtener clase CSS para fecha límite
   */
  getFechaLimiteClass(): string {
    if (this.estaVencido()) return 'fecha-limite-vencida';
    if (this.fechaLimiteProxima()) return 'fecha-limite-proxima';
    return '';
  }

  /**
   * Verificar si el documento puede derivarse
   */
  puedeDerivarse(): boolean {
    return this.documento.estado === EstadoDocumento.REGISTRADO || 
           this.documento.estado === EstadoDocumento.EN_PROCESO;
  }

  /**
   * Verificar si el documento puede archivarse
   */
  puedeArchivarse(): boolean {
    return this.documento.estado === EstadoDocumento.ATENDIDO;
  }

  /**
   * Obtener texto de etiquetas restantes
   */
  getEtiquetasRestantes(): string {
    const restantes = this.documento.etiquetas.slice(this.maxEtiquetas);
    return restantes.join(', ');
  }

  /**
   * Manejar clic en ver detalle
   */
  onVerDetalle(): void {
    this.verDetalle.emit(this.documento);
  }

  /**
   * Manejar clic en derivar
   */
  onDerivar(): void {
    this.derivar.emit(this.documento);
  }

  /**
   * Manejar clic en archivar
   */
  onArchivar(): void {
    this.archivar.emit(this.documento);
  }

  /**
   * Manejar clic en descargar comprobante
   */
  onDescargarComprobante(): void {
    this.descargarComprobante.emit(this.documento);
  }

  /**
   * Manejar clic en ver QR
   */
  onVerQR(): void {
    this.verQR.emit(this.documento);
  }

  /**
   * Manejar cambio de selección
   */
  onSelectionChange(): void {
    if (this.selectable) {
      this.selected = !this.selected;
      this.selectionChange.emit({
        documento: this.documento,
        selected: this.selected
      });
    }
  }
}