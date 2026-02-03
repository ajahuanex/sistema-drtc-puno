import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

export interface FiltrosAvanzados {
  origen?: string;
  destino?: string;
  bidireccional?: boolean;
}

@Component({
  selector: 'app-filtros-avanzados-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="filtros-modal">
      <h2 mat-dialog-title>
        <mat-icon>tune</mat-icon>
        Filtros Avanzados de Rutas
      </h2>
      
      <mat-dialog-content>
        <div class="filtros-content">
          
          <!-- Sección Origen-Destino -->
          <div class="filtro-seccion">
            <h3>Búsqueda por Origen y Destino</h3>
            <p class="descripcion">
              Busca rutas específicas por localidades de origen y destino. 
              La búsqueda es bidireccional automáticamente.
            </p>
            
            <div class="origen-destino-container">
              <mat-form-field appearance="outline" class="campo-localidad">
                <mat-label>Origen</mat-label>
                <input matInput 
                       [ngModel]="filtros().origen"
                       (ngModelChange)="updateOrigen($event)"
                       placeholder="Ej: Yunguyo, Puno, Lima..."
                       (input)="onFiltroChange()">
                <mat-icon matSuffix>place</mat-icon>
              </mat-form-field>
              
              <div class="intercambio-icon">
                <mat-icon>swap_horiz</mat-icon>
              </div>
              
              <mat-form-field appearance="outline" class="campo-localidad">
                <mat-label>Destino</mat-label>
                <input matInput 
                       [ngModel]="filtros().destino"
                       (ngModelChange)="updateDestino($event)"
                       placeholder="Ej: Puno, Yunguyo, Arequipa..."
                       (input)="onFiltroChange()">
                <mat-icon matSuffix>flag</mat-icon>
              </mat-form-field>
            </div>
            
            <!-- Información de búsqueda bidireccional -->
            @if (filtros().origen || filtros().destino) {
              <div class="info-bidireccional">
                <mat-icon>info</mat-icon>
                <span>
                  Se buscarán rutas en ambas direcciones:
                  @if (filtros().origen && filtros().destino) {
                    <strong>{{ filtros().origen }} ↔ {{ filtros().destino }}</strong>
                  } @else if (filtros().origen) {
                    <strong>{{ filtros().origen }}</strong> como origen o destino
                  } @else if (filtros().destino) {
                    <strong>{{ filtros().destino }}</strong> como origen o destino
                  }
                </span>
              </div>
            }
          </div>
          
          <mat-divider></mat-divider>
          
          <!-- Resumen de filtros activos -->
          @if (tieneFiltrosActivos()) {
            <div class="resumen-filtros">
              <h4>Filtros que se aplicarán:</h4>
              <div class="chips-container">
                @if (filtros().origen) {
                  <mat-chip-set>
                    <mat-chip (removed)="limpiarOrigen()">
                      Origen: {{ filtros().origen }}
                      <button matChipRemove>
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </mat-chip>
                  </mat-chip-set>
                }
                @if (filtros().destino) {
                  <mat-chip-set>
                    <mat-chip (removed)="limpiarDestino()">
                      Destino: {{ filtros().destino }}
                      <button matChipRemove>
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </mat-chip>
                  </mat-chip-set>
                }
              </div>
            </div>
          }
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="limpiarTodo()">
          <mat-icon>clear_all</mat-icon>
          Limpiar Todo
        </button>
        <button mat-button (click)="cancelar()">
          Cancelar
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="aplicarFiltros()"
                [disabled]="!tieneFiltrosActivos()">
          <mat-icon>check</mat-icon>
          Aplicar Filtros
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .filtros-modal {
      min-width: 500px;
      max-width: 600px;
    }
    
    .filtros-content {
      padding: 16px 0;
    }
    
    .filtro-seccion {
      margin-bottom: 24px;
    }
    
    .filtro-seccion h3 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-weight: 500;
    }
    
    .descripcion {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .origen-destino-container {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .campo-localidad {
      flex: 1;
    }
    
    .intercambio-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
    }
    
    .info-bidireccional {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .info-bidireccional mat-icon {
      color: #1976d2;
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-top: 2px;
    }
    
    .resumen-filtros {
      margin-top: 16px;
    }
    
    .resumen-filtros h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
    
    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 0;
    }
    
    mat-dialog-actions {
      padding: 16px 0 0 0;
    }
  `]
})
export class FiltrosAvanzadosModalComponent implements OnInit {
  filtros = signal<FiltrosAvanzados>({});

  constructor(
    private dialogRef: MatDialogRef<FiltrosAvanzadosModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { filtrosIniciales?: FiltrosAvanzados }
  ) {}

  ngOnInit(): void {
    if (this.data?.filtrosIniciales) {
      this.filtros.set({ ...this.data.filtrosIniciales });
    }
  }

  onFiltroChange(): void {
    // Trigger change detection
    this.filtros.set({ ...this.filtros() });
  }

  updateOrigen(value: string): void {
    const filtros = { ...this.filtros() };
    filtros.origen = value;
    this.filtros.set(filtros);
  }

  updateDestino(value: string): void {
    const filtros = { ...this.filtros() };
    filtros.destino = value;
    this.filtros.set(filtros);
  }

  tieneFiltrosActivos(): boolean {
    const filtros = this.filtros();
    return !!(filtros.origen?.trim() || filtros.destino?.trim());
  }

  limpiarOrigen(): void {
    const filtros = { ...this.filtros() };
    delete filtros.origen;
    this.filtros.set(filtros);
  }

  limpiarDestino(): void {
    const filtros = { ...this.filtros() };
    delete filtros.destino;
    this.filtros.set(filtros);
  }

  limpiarTodo(): void {
    this.filtros.set({});
  }

  aplicarFiltros(): void {
    const filtrosLimpios = { ...this.filtros() };
    
    // Limpiar campos vacíos
    if (!filtrosLimpios.origen?.trim()) {
      delete filtrosLimpios.origen;
    } else {
      filtrosLimpios.origen = filtrosLimpios.origen.trim();
    }
    
    if (!filtrosLimpios.destino?.trim()) {
      delete filtrosLimpios.destino;
    } else {
      filtrosLimpios.destino = filtrosLimpios.destino.trim();
    }
    
    // Marcar como bidireccional si hay origen o destino
    if (filtrosLimpios.origen || filtrosLimpios.destino) {
      filtrosLimpios.bidireccional = true;
    }
    
    this.dialogRef.close(filtrosLimpios);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}