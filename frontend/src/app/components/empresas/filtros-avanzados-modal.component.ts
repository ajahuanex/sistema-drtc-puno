import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { EstadoEmpresa } from '../../models/empresa.model';

export interface FiltrosAvanzados {
  estado?: EstadoEmpresa[];
  tipoTramite?: string[];
  tipoServicio?: string[];
  rutasMinimas?: number;
  rutasMaximas?: number;
  rutaOrigen?: string;
  rutaDestino?: string;
  vehiculosMinimos?: number;
  vehiculosMaximos?: number;
  conductoresMinimos?: number;
  conductoresMaximos?: number;
}

@Component({
  selector: 'app-filtros-avanzados-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSliderModule
  ],
  template: `
    <div class="filtros-modal">
      <div mat-dialog-title class="modal-header">
        <mat-icon>filter_list</mat-icon>
        <h2>Filtros Avanzados</h2>
      </div>

      <div mat-dialog-content class="modal-content">
        <form [formGroup]="filtrosForm" class="filtros-form">
          
          <!-- Estados -->
          <div class="form-section">
            <h3>Estado de la Empresa</h3>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Estados</mat-label>
              <mat-select formControlName="estados" multiple>
                <mat-option value="AUTORIZADA">Autorizada</mat-option>
                <mat-option value="EN_TRAMITE">En Trámite</mat-option>
                <mat-option value="SUSPENDIDA">Suspendida</mat-option>
                <mat-option value="CANCELADA">Cancelada</mat-option>
                <mat-option value="DADA_DE_BAJA">Dada de Baja</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Tipo de Trámite -->
          <div class="form-section">
            <h3>Tipo de Trámite</h3>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tipos de Trámite</mat-label>
              <mat-select formControlName="tiposTramite" multiple>
                <mat-option value="AUTORIZACION_INICIAL">Autorización Inicial</mat-option>
                <mat-option value="RENOVACION">Renovación</mat-option>
                <mat-option value="AMPLIACION">Ampliación</mat-option>
                <mat-option value="MODIFICACION">Modificación</mat-option>
                <mat-option value="SUSPENSION">Suspensión</mat-option>
                <mat-option value="CANCELACION">Cancelación</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Tipo de Servicio -->
          <div class="form-section">
            <h3>Tipo de Servicio</h3>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tipos de Servicio</mat-label>
              <mat-select formControlName="tiposServicio" multiple>
                <mat-option value="REGULAR">Regular</mat-option>
                <mat-option value="TURISTICO">Turístico</mat-option>
                <mat-option value="ESPECIAL">Especial</mat-option>
                <mat-option value="ESCOLAR">Escolar</mat-option>
                <mat-option value="TRABAJADORES">Trabajadores</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Rutas por Origen y Destino -->
          <div class="form-section">
            <h3>Filtros por Rutas (Origen/Destino)</h3>
            <div class="ruta-filters">
              <mat-form-field appearance="outline">
                <mat-label>Origen</mat-label>
                <input matInput formControlName="rutaOrigen" placeholder="Ej: Lima, Cusco">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Destino</mat-label>
                <input matInput formControlName="rutaDestino" placeholder="Ej: Arequipa, Puno">
              </mat-form-field>
            </div>
            <p class="filter-note">
              <mat-icon>info</mat-icon>
              Para filtros más específicos de rutas, considera usar el módulo de Rutas
            </p>
          </div>

          <!-- Rutas -->
          <div class="form-section">
            <h3>Cantidad de Rutas</h3>
            <div class="range-inputs">
              <mat-form-field appearance="outline">
                <mat-label>Mínimo</mat-label>
                <input matInput type="number" formControlName="rutasMinimas" min="0">
              </mat-form-field>
              <span class="range-separator">-</span>
              <mat-form-field appearance="outline">
                <mat-label>Máximo</mat-label>
                <input matInput type="number" formControlName="rutasMaximas" min="0">
              </mat-form-field>
            </div>
          </div>

          <!-- Vehículos -->
          <div class="form-section">
            <h3>Cantidad de Vehículos Habilitados</h3>
            <div class="range-inputs">
              <mat-form-field appearance="outline">
                <mat-label>Mínimo</mat-label>
                <input matInput type="number" formControlName="vehiculosMinimos" min="0">
              </mat-form-field>
              <span class="range-separator">-</span>
              <mat-form-field appearance="outline">
                <mat-label>Máximo</mat-label>
                <input matInput type="number" formControlName="vehiculosMaximos" min="0">
              </mat-form-field>
            </div>
          </div>

          <!-- Conductores -->
          <div class="form-section">
            <h3>Cantidad de Conductores</h3>
            <div class="range-inputs">
              <mat-form-field appearance="outline">
                <mat-label>Mínimo</mat-label>
                <input matInput type="number" formControlName="conductoresMinimos" min="0">
              </mat-form-field>
              <span class="range-separator">-</span>
              <mat-form-field appearance="outline">
                <mat-label>Máximo</mat-label>
                <input matInput type="number" formControlName="conductoresMaximos" min="0">
              </mat-form-field>
            </div>
          </div>

        </form>
      </div>

      <div mat-dialog-actions class="modal-actions">
        <button mat-button (click)="limpiarFiltros()" class="btn-secondary">
          <mat-icon>clear</mat-icon>
          Limpiar
        </button>
        <button mat-button (click)="cerrar()" class="btn-secondary">
          Cancelar
        </button>
        <button mat-raised-button color="primary" (click)="aplicarFiltros()" class="btn-primary">
          <mat-icon>check</mat-icon>
          Aplicar Filtros
        </button>
      </div>
    </div>
  `,
  styles: [`
    .filtros-modal {
      width: 600px;
      max-width: 90vw;
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      
      mat-icon {
        color: #007bff;
        font-size: 24px;
      }
      
      h2 {
        margin: 0;
        color: #333;
        font-weight: 500;
      }
    }

    .modal-content {
      max-height: 70vh;
      overflow-y: auto;
    }

    .filtros-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-section {
      h3 {
        margin: 0 0 12px 0;
        color: #555;
        font-size: 14px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .full-width {
      width: 100%;
    }

    .range-inputs {
      display: flex;
      align-items: center;
      gap: 12px;
      
      mat-form-field {
        flex: 1;
      }
      
      .range-separator {
        color: #666;
        font-weight: 500;
      }
    }

    .ruta-filters {
      display: flex;
      gap: 12px;
      
      mat-form-field {
        flex: 1;
      }
    }

    .filter-note {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding: 8px 12px;
      background-color: #e3f2fd;
      border-radius: 4px;
      font-size: 12px;
      color: #1976d2;
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .btn-secondary {
      color: #666;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .filtros-modal {
        width: 100%;
        max-width: 100vw;
      }
      
      .range-inputs {
        flex-direction: column;
        align-items: stretch;
        
        .range-separator {
          text-align: center;
        }
      }
    }
  `]
})
export class FiltrosAvanzadosModalComponent {
  private dialogRef = inject(MatDialogRef<FiltrosAvanzadosModalComponent>);
  private fb = inject(FormBuilder);

  filtrosForm: FormGroup;

  constructor() {
    this.filtrosForm = this.fb.group({
      estados: [[]],
      tiposTramite: [[]],
      tiposServicio: [[]],
      rutaOrigen: [null],
      rutaDestino: [null],
      rutasMinimas: [null],
      rutasMaximas: [null],
      vehiculosMinimos: [null],
      vehiculosMaximos: [null],
      conductoresMinimos: [null],
      conductoresMaximos: [null]
    });
  }

  aplicarFiltros(): void {
    const filtros: FiltrosAvanzados = {
      estado: this.filtrosForm.value.estados,
      tipoTramite: this.filtrosForm.value.tiposTramite,
      tipoServicio: this.filtrosForm.value.tiposServicio,
      rutaOrigen: this.filtrosForm.value.rutaOrigen,
      rutaDestino: this.filtrosForm.value.rutaDestino,
      rutasMinimas: this.filtrosForm.value.rutasMinimas,
      rutasMaximas: this.filtrosForm.value.rutasMaximas,
      vehiculosMinimos: this.filtrosForm.value.vehiculosMinimos,
      vehiculosMaximos: this.filtrosForm.value.vehiculosMaximos,
      conductoresMinimos: this.filtrosForm.value.conductoresMinimos,
      conductoresMaximos: this.filtrosForm.value.conductoresMaximos
    };

    this.dialogRef.close(filtros);
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      estados: [],
      tiposTramite: [],
      tiposServicio: [],
      rutaOrigen: null,
      rutaDestino: null,
      rutasMinimas: null,
      rutasMaximas: null,
      vehiculosMinimos: null,
      vehiculosMaximos: null,
      conductoresMinimos: null,
      conductoresMaximos: null
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}