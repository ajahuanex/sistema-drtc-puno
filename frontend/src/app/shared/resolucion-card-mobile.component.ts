import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { ResolucionConEmpresa } from '../models/resolucion-table.model';
import { SmartIconComponent } from './smart-icon.component';

export interface AccionCard {
  accion: 'ver' | 'editar' | 'eliminar' | 'seleccionar';
  resolucion: ResolucionConEmpresa;
}

/**
 * Componente de tarjeta para mostrar resoluciones en móvil
 * Proporciona una vista optimizada para pantallas pequeñas
 */
@Component({
  selector: 'app-resolucion-card-mobile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDividerModule,
    SmartIconComponent
  ],
  template: `
    <mat-card class="resolucion-card" 
              [class.selected]="seleccionada"
              (click)="onCardClick()"
              (keydown.enter)="onCardClick()"
              (keydown.space)="onCardClick()"
              role="article"
              tabindex="0"
              [attr.aria-label]="'Resolución ' + resolucion.nroResolucion + (resolucion.empresa ? ', empresa ' + resolucion.empresa.razonSocial.principal : '')"
              [attr.aria-selected]="seleccionada">
      
      <!-- Header de la card -->
      <mat-card-header class="card-header">
        <div class="header-left">
          @if (mostrarCheckbox) {
            <mat-checkbox 
              [checked]="seleccionada"
              (click)="$event.stopPropagation()"
              (change)="onSeleccionChange($event.checked)"
              class="card-checkbox"
              [attr.aria-label]="'Seleccionar resolución ' + resolucion.nroResolucion">
            </mat-checkbox>
          }
          
          <div class="numero-info">
            <div class="numero-principal" role="heading" aria-level="3">{{ resolucion.nroResolucion }}</div>
            @if (resolucion.tipoResolucion) {
              <span class="tipo-badge" 
                    [class]="'tipo-' + resolucion.tipoResolucion.toLowerCase()"
                    role="status"
                    [attr.aria-label]="'Tipo: ' + resolucion.tipoResolucion">
                {{ resolucion.tipoResolucion }}
              </span>
            }
          </div>
        </div>
        
        <button mat-icon-button 
                [matMenuTriggerFor]="accionesMenu"
                (click)="$event.stopPropagation()"
                class="menu-button"
                aria-label="Más acciones para esta resolución"
                [attr.aria-expanded]="false">
          <app-smart-icon iconName="more_vert" [size]="20" [attr.aria-hidden]="true"></app-smart-icon>
        </button>
        
        <mat-menu #accionesMenu="matMenu" role="menu" aria-label="Menú de acciones">
          <button mat-menu-item 
                  (click)="ejecutarAccion('ver')"
                  role="menuitem"
                  aria-label="Ver detalles de la resolución">
            <app-smart-icon iconName="visibility" [size]="18" [attr.aria-hidden]="true"></app-smart-icon>
            <span>Ver detalles</span>
          </button>
          <button mat-menu-item 
                  (click)="ejecutarAccion('editar')"
                  role="menuitem"
                  aria-label="Editar resolución">
            <app-smart-icon iconName="edit" [size]="18" [attr.aria-hidden]="true"></app-smart-icon>
            <span>Editar</span>
          </button>
          <mat-divider role="separator"></mat-divider>
          <button mat-menu-item 
                  (click)="ejecutarAccion('eliminar')" 
                  class="delete-action"
                  role="menuitem"
                  aria-label="Eliminar resolución">
            <app-smart-icon iconName="delete" [size]="18" [attr.aria-hidden]="true"></app-smart-icon>
            <span>Eliminar</span>
          </button>
        </mat-menu>
      </mat-card-header>

      <!-- Contenido de la card -->
      <mat-card-content class="card-content">
        
        <!-- Empresa -->
        <div class="info-row">
          <div class="info-label">
            <app-smart-icon iconName="business" [size]="16"></app-smart-icon>
            Empresa
          </div>
          <div class="info-value">
            @if (resolucion.empresa) {
              <div class="empresa-nombre">{{ resolucion.empresa.razonSocial.principal }}</div>
              <div class="empresa-ruc">RUC: {{ resolucion.empresa.ruc }}</div>
            } @else {
              <span class="sin-dato">Sin empresa asignada</span>
            }
          </div>
        </div>

        <!-- Tipo de trámite -->
        <div class="info-row">
          <div class="info-label">
            <app-smart-icon iconName="category" [size]="16"></app-smart-icon>
            Tipo
          </div>
          <div class="info-value">
            <mat-chip class="tipo-chip" [class]="'tipo-' + resolucion.tipoTramite.toLowerCase()">
              {{ resolucion.tipoTramite }}
            </mat-chip>
          </div>
        </div>

        <!-- Fecha de emisión -->
        <div class="info-row">
          <div class="info-label">
            <app-smart-icon iconName="event" [size]="16"></app-smart-icon>
            Emisión
          </div>
          <div class="info-value">
            <div class="fecha-principal">{{ resolucion.fechaEmision | date:'dd/MM/yyyy' }}</div>
            <div class="fecha-relativa">{{ getFechaRelativa(resolucion.fechaEmision) }}</div>
          </div>
        </div>

        <!-- Vigencia (si existe) -->
        @if (resolucion.fechaVigenciaInicio || resolucion.fechaVigenciaFin) {
          <div class="info-row">
            <div class="info-label">
              <app-smart-icon iconName="schedule" [size]="16"></app-smart-icon>
              Vigencia
            </div>
            <div class="info-value">
              @if (resolucion.fechaVigenciaInicio && resolucion.fechaVigenciaFin) {
                <div class="vigencia-rango">
                  {{ resolucion.fechaVigenciaInicio | date:'dd/MM/yyyy' }} - 
                  {{ resolucion.fechaVigenciaFin | date:'dd/MM/yyyy' }}
                </div>
              } @else if (resolucion.fechaVigenciaInicio) {
                <div>Desde {{ resolucion.fechaVigenciaInicio | date:'dd/MM/yyyy' }}</div>
              } @else if (resolucion.fechaVigenciaFin) {
                <div>Hasta {{ resolucion.fechaVigenciaFin | date:'dd/MM/yyyy' }}</div>
              }
            </div>
          </div>
        }

        <!-- Estado y activo -->
        <div class="info-row chips-row">
          <mat-chip class="estado-chip" [class]="'estado-' + (resolucion.estado || 'pendiente').toLowerCase().replace('_', '-')">
            {{ getEstadoTexto(resolucion.estado || 'PENDIENTE') }}
          </mat-chip>
          
          <mat-chip class="activo-chip" [class.activo]="resolucion.estaActivo">
            <app-smart-icon 
              [iconName]="resolucion.estaActivo ? 'check_circle' : 'cancel'" 
              [size]="14">
            </app-smart-icon>
            {{ resolucion.estaActivo ? 'Activo' : 'Inactivo' }}
          </mat-chip>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .resolucion-card {
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 8px;
    }

    .resolucion-card:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .resolucion-card.selected {
      border: 2px solid #1976d2;
      background-color: rgba(25, 118, 210, 0.04);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px 16px;
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .card-checkbox {
      margin: 0;
    }

    .numero-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .numero-principal {
      font-size: 16px;
      font-weight: 600;
      color: #1976d2;
    }

    .tipo-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 600;
      display: inline-block;
    }

    .tipo-badge.tipo-padre {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .tipo-badge.tipo-hijo {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .menu-button {
      color: rgba(0, 0, 0, 0.6);
    }

    .delete-action {
      color: #d32f2f;
    }

    .card-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .info-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      min-width: 80px;
      flex-shrink: 0;
    }

    .info-value {
      flex: 1;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.8);
    }

    .empresa-nombre {
      font-weight: 500;
      line-height: 1.3;
      margin-bottom: 2px;
    }

    .empresa-ruc {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
      font-family: monospace;
    }

    .sin-dato {
      color: rgba(0, 0, 0, 0.4);
      font-style: italic;
      font-size: 13px;
    }

    .tipo-chip {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      height: 24px;
    }

    .tipo-chip.tipo-primigenia {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .tipo-chip.tipo-renovacion {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .tipo-chip.tipo-incremento {
      background-color: #e8f5e8;
      color: #388e3c;
    }

    .tipo-chip.tipo-sustitucion {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .tipo-chip.tipo-otros {
      background-color: #f5f5f5;
      color: #616161;
    }

    .fecha-principal {
      font-weight: 500;
    }

    .fecha-relativa {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 2px;
    }

    .vigencia-rango {
      font-size: 13px;
      line-height: 1.4;
    }

    .chips-row {
      flex-wrap: wrap;
      gap: 8px;
    }

    .estado-chip {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      height: 24px;
    }

    .estado-chip.estado-borrador {
      background-color: #f5f5f5;
      color: #616161;
    }

    .estado-chip.estado-en-revision {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .estado-chip.estado-aprobado {
      background-color: #e8f5e8;
      color: #388e3c;
    }

    .estado-chip.estado-vigente {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .estado-chip.estado-vencido {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .estado-chip.estado-anulado {
      background-color: #fce4ec;
      color: #c2185b;
    }

    .activo-chip {
      font-size: 11px;
      font-weight: 500;
      height: 24px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .activo-chip.activo {
      background-color: #e8f5e8;
      color: #388e3c;
    }

    .activo-chip:not(.activo) {
      background-color: #ffebee;
      color: #d32f2f;
    }
  `]
})
export class ResolucionCardMobileComponent {
  @Input() resolucion!: ResolucionConEmpresa;
  @Input() seleccionada: boolean = false;
  @Input() mostrarCheckbox: boolean = false;
  
  @Output() accionEjecutada = new EventEmitter<AccionCard>();
  @Output() seleccionChange = new EventEmitter<boolean>();
  @Output() cardClick = new EventEmitter<ResolucionConEmpresa>();

  onCardClick(): void {
    this.cardClick.emit(this.resolucion);
  }

  onSeleccionChange(seleccionada: boolean): void {
    this.seleccionChange.emit(seleccionada);
  }

  ejecutarAccion(accion: 'ver' | 'editar' | 'eliminar'): void {
    this.accionEjecutada.emit({
      accion,
      resolucion: this.resolucion
    });
  }

  getFechaRelativa(fecha: Date): string {
    const hoy = new Date();
    const fechaObj = new Date(fecha);
    const diffTime = hoy.getTime() - fechaObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  }

  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'BORRADOR': 'Borrador',
      'EN_REVISION': 'En Revisión',
      'APROBADO': 'Aprobado',
      'VIGENTE': 'Vigente',
      'VENCIDO': 'Vencido',
      'ANULADO': 'Anulado'
    };
    return estados[estado] || estado;
  }
}
