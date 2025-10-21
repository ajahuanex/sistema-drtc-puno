import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TipoEmpresa } from '../../models/empresa.model';

/**
 * Componente para mostrar información visual y detallada del código de empresa.
 * 
 * El código de empresa tiene el formato XXXXYYY donde:
 * - XXXX: Número secuencial de 4 dígitos (0001-9999)
 * - YYY: Letras que representan tipos de empresa (P=Personas, R=Regional, T=Turismo)
 * 
 * @example
 * ```html
 * <app-codigo-empresa-info [codigoEmpresa]="'0123PRT'"></app-codigo-empresa-info>
 * ```
 * 
 * @example
 * ```typescript
 * // En el componente padre
 * empresa = { codigoEmpresa: '0123PRT' };
 * 
 * // En el template
 * <app-codigo-empresa-info [codigoEmpresa]="empresa.codigoEmpresa || ''"></app-codigo-empresa-info>
 * ```
 */
@Component({
  selector: 'app-codigo-empresa-info',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="codigo-empresa-info">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>qr_code</mat-icon>
          Información del Código de Empresa
        </mat-card-title>
        <mat-card-subtitle>
          Formato: 4 dígitos + 3 letras (ej: 0123PRT)
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        @if (codigoEmpresa) {
          <div class="codigo-display">
            <div class="codigo-numero">{{ obtenerNumero() }}</div>
            <div class="codigo-letras">{{ obtenerLetras() }}</div>
          </div>
          
          <div class="tipos-empresa">
            <h4>Tipos de Empresa:</h4>
            <div class="tipos-chips">
              @for (tipo of obtenerTiposEmpresa(); track tipo) {
                <mat-chip 
                  [color]="tipo.color" 
                  selected
                  [matTooltip]="tipo.descripcion">
                  <mat-icon>{{ tipo.icono }}</mat-icon>
                  {{ tipo.letra }}: {{ tipo.descripcion }}
                </mat-chip>
              }
            </div>
          </div>
          
          <div class="codigo-details">
            <p><strong>Número Secuencial:</strong> {{ obtenerNumero() }}</p>
            <p><strong>Código Completo:</strong> {{ codigoEmpresa }}</p>
          </div>
        } @else {
          <div class="no-codigo">
            <mat-icon>info</mat-icon>
            <p>No se ha asignado un código de empresa</p>
          </div>
        }
        
        <div class="formato-info">
          <h4>Formato del Código:</h4>
          <ul>
            <li><strong>Primeros 4 dígitos:</strong> Número secuencial único (0001-9999)</li>
            <li><strong>Últimas 3 letras:</strong> Tipos de empresa (P: Personas, R: Regional, T: Turismo)</li>
            <li><strong>Ejemplo:</strong> 0123PRT = Empresa #123 que maneja Personas, Regional y Turismo</li>
          </ul>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .codigo-empresa-info {
      max-width: 500px;
      margin: 16px 0;
    }
    
    .codigo-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 20px 0;
      padding: 16px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 8px;
    }
    
    .codigo-numero {
      font-size: 2rem;
      font-weight: bold;
      color: #1976d2;
      background: white;
      padding: 8px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .codigo-letras {
      font-size: 2rem;
      font-weight: bold;
      color: #388e3c;
      background: white;
      padding: 8px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .tipos-empresa {
      margin: 20px 0;
    }
    
    .tipos-empresa h4 {
      color: #1976d2;
      margin-bottom: 12px;
    }
    
    .tipos-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .codigo-details {
      margin: 20px 0;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    
    .codigo-details p {
      margin: 8px 0;
    }
    
    .no-codigo {
      text-align: center;
      padding: 32px;
      color: #666;
    }
    
    .no-codigo mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 16px;
    }
    
    .formato-info {
      margin-top: 24px;
      padding: 16px;
      background-color: #e3f2fd;
      border-radius: 4px;
      border-left: 4px solid #1976d2;
    }
    
    .formato-info h4 {
      color: #1976d2;
      margin-bottom: 12px;
    }
    
    .formato-info ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .formato-info li {
      margin: 8px 0;
      line-height: 1.4;
    }
    
    .mat-mdc-card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }
    
    .mat-mdc-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
    }
    
    .mat-mdc-card-subtitle {
      color: #666;
      font-style: italic;
    }
  `]
})
export class CodigoEmpresaInfoComponent {
  /**
   * Código de empresa en formato XXXXYYY (4 dígitos + 3 letras)
   * @example "0123PRT"
   */
  @Input() codigoEmpresa: string = '';
  
  /**
   * Extrae los primeros 4 dígitos del código de empresa (número secuencial)
   * @returns Número secuencial como string (ej: "0123")
   */
  obtenerNumero(): string {
    if (!this.codigoEmpresa) return '';
    return this.codigoEmpresa.substring(0, 4);
  }
  
  /**
   * Extrae las últimas 3 letras del código de empresa (tipos de empresa)
   * @returns Letras de tipos como string (ej: "PRT")
   */
  obtenerLetras(): string {
    if (!this.codigoEmpresa) return '';
    return this.codigoEmpresa.substring(4, 7);
  }
  
  /**
   * Convierte las letras del código en información detallada de tipos de empresa
   * @returns Array de objetos con información de cada tipo de empresa
   */
  obtenerTiposEmpresa(): Array<{letra: string, descripcion: string, color: string, icono: string}> {
    if (!this.codigoEmpresa) return [];
    
    const letras = this.obtenerLetras();
    const tipos = [];
    
    for (const letra of letras) {
      switch (letra) {
        case TipoEmpresa.PERSONAS:
          tipos.push({
            letra,
            descripcion: 'Personas',
            color: 'primary',
            icono: 'people'
          });
          break;
        case TipoEmpresa.REGIONAL:
          tipos.push({
            letra,
            descripcion: 'Regional',
            color: 'accent',
            icono: 'location_on'
          });
          break;
        case TipoEmpresa.TURISMO:
          tipos.push({
            letra,
            descripcion: 'Turismo',
            color: 'warn',
            icono: 'flight'
          });
          break;
      }
    }
    
    return tipos;
  }
}
