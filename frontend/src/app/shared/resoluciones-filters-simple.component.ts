import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ResolucionFiltros } from '../models/resolucion-table.model';

/**
 * Componente de filtros SIMPLIFICADO para resoluciones
 * Elimina complejidades innecesarias y se enfoca en los filtros más usados
 */
@Component({
  selector: 'app-resoluciones-filters-simple',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="filtros-card">
      <mat-card-content>
        <form [formGroup]="filtrosForm" class="filtros-form">
          
          <!-- Filtros básicos en una sola fila -->
          <div class="filtros-row">
            
            <!-- Búsqueda por número -->
            <mat-form-field appearance="outline">
              <mat-label>Buscar Resolución</mat-label>
              <input matInput 
                     formControlName="numeroResolucion"
                     placeholder="Ej: R-001-2025"
                     autocomplete="off">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <!-- Estado simple -->
            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="estado">
                <mat-option value="">Todos</mat-option>
                <mat-option value="VIGENTE">Vigente</mat-option>
                <mat-option value="VENCIDA">Vencida</mat-option>
                <mat-option value="ANULADA">Anulada</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Tipo simple -->
            <mat-form-field appearance="outline">
              <mat-label>Tipo</mat-label>
              <mat-select formControlName="tipoTramite">
                <mat-option value="">Todos</mat-option>
                <mat-option value="PRIMIGENIA">Primigenia</mat-option>
                <mat-option value="RENOVACION">Renovación</mat-option>
                <mat-option value="MODIFICACION">Modificación</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Acciones -->
            <div class="filtros-actions">
              <button mat-button 
                      type="button"
                      (click)="limpiarFiltros()"
                      [disabled]="!tieneFiltros()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          </div>

          <!-- Chips de filtros activos (solo si hay filtros) -->
          @if (filtrosActivos().length > 0) {
            <div class="chips-container">
              <mat-chip-set>
                @for (filtro of filtrosActivos(); track filtro.key) {
                  <mat-chip [removable]="true" (removed)="removerFiltro(filtro.key)">
                    {{ filtro.label }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                }
              </mat-chip-set>
            </div>
          }
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .filtros-card {
      margin-bottom: 16px;
    }

    .filtros-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .filtros-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto;
      gap: 16px;
      align-items: end;
    }

    .filtros-actions {
      display: flex;
      align-items: center;
    }

    .filtros-actions button {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .chips-container {
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
    }

    mat-chip {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .filtros-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .filtros-actions {
        justify-content: center;
      }
    }
  `]
})
export class ResolucionesFiltersSimpleComponent implements OnInit {
  @Input() filtros: ResolucionFiltros = {};
  @Output() filtrosChange = new EventEmitter<ResolucionFiltros>();
  @Output() limpiarTodosFiltros = new EventEmitter<void>();

  filtrosForm: FormGroup;
  filtrosActivos = signal<Array<{key: string, label: string}>>([]);

  constructor(private fb: FormBuilder) {
    this.filtrosForm = this.fb.group({
      numeroResolucion: [''],
      estado: [''],
      tipoTramite: ['']
    });
  }

  ngOnInit(): void {
    // Cargar filtros iniciales
    this.cargarFiltros();
    
    // Escuchar cambios con debounce
    this.filtrosForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.emitirFiltros();
    });
  }

  private cargarFiltros(): void {
    this.filtrosForm.patchValue({
      numeroResolucion: this.filtros.numeroResolucion || '',
      estado: this.filtros.estados?.[0] || '',
      tipoTramite: this.filtros.tiposTramite?.[0] || ''
    }, { emitEvent: false });
    
    this.actualizarChips();
  }

  private emitirFiltros(): void {
    const formValue = this.filtrosForm.value;
    const filtros: ResolucionFiltros = {};

    if (formValue.numeroResolucion?.trim()) {
      filtros.numeroResolucion = formValue.numeroResolucion.trim();
    }

    if (formValue.estado) {
      filtros.estados = [formValue.estado];
    }

    if (formValue.tipoTramite) {
      filtros.tiposTramite = [formValue.tipoTramite];
    }

    this.actualizarChips();
    this.filtrosChange.emit(filtros);
  }

  private actualizarChips(): void {
    const chips: Array<{key: string, label: string}> = [];
    const formValue = this.filtrosForm.value;

    if (formValue.numeroResolucion?.trim()) {
      chips.push({
        key: 'numeroResolucion',
        label: `Número: ${formValue.numeroResolucion}`
      });
    }

    if (formValue.estado) {
      chips.push({
        key: 'estado',
        label: `Estado: ${formValue.estado}`
      });
    }

    if (formValue.tipoTramite) {
      chips.push({
        key: 'tipoTramite',
        label: `Tipo: ${formValue.tipoTramite}`
      });
    }

    this.filtrosActivos.set(chips);
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      numeroResolucion: '',
      estado: '',
      tipoTramite: ''
    });
    
    this.filtrosActivos.set([]);
    this.limpiarTodosFiltros.emit();
  }

  removerFiltro(key: string): void {
    this.filtrosForm.patchValue({ [key]: '' });
  }

  tieneFiltros(): boolean {
    return this.filtrosActivos().length > 0;
  }
}