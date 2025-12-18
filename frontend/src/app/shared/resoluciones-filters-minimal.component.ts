import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime } from 'rxjs';

/**
 * Filtro MINIMALISTA para resoluciones - Solo lo esencial
 */
@Component({
  selector: 'app-resoluciones-filters-minimal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="filtros-minimal">
      <form [formGroup]="form" class="filtros-form">
        
        <!-- Solo búsqueda y estado en una línea -->
        <mat-form-field appearance="outline" class="busqueda">
          <mat-label>Buscar</mat-label>
          <input matInput formControlName="busqueda" placeholder="Número de resolución">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="estado">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="estado">
            <mat-option value="">Todos</mat-option>
            <mat-option value="VIGENTE">Vigente</mat-option>
            <mat-option value="VENCIDA">Vencida</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-button type="button" (click)="limpiar()" class="limpiar-btn">
          <mat-icon>clear</mat-icon>
          Limpiar
        </button>
      </form>
    </div>
  `,
  styles: [`
    .filtros-minimal {
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 16px;
    }

    .filtros-form {
      display: flex;
      gap: 16px;
      align-items: end;
    }

    .busqueda {
      flex: 2;
    }

    .estado {
      flex: 1;
    }

    .limpiar-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 40px;
    }

    @media (max-width: 768px) {
      .filtros-form {
        flex-direction: column;
        align-items: stretch;
      }
      
      .limpiar-btn {
        align-self: center;
      }
    }
  `]
})
export class ResolucionesFiltersMinimalComponent implements OnInit {
  @Input() filtros: any = {};
  @Output() filtrosChange = new EventEmitter<any>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      busqueda: [''],
      estado: ['']
    });
  }

  ngOnInit(): void {
    // Cargar valores iniciales (formato frontend)
    this.form.patchValue({
      busqueda: this.filtros.numeroResolucion || '',
      estado: this.filtros.estados?.[0] || ''
    });

    // Emitir cambios con debounce
    this.form.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.emitirFiltros();
    });
  }

  private emitirFiltros(): void {
    const valores = this.form.value;
    const filtros: any = {};

    // Usar formato del frontend (el servicio hará la conversión)
    if (valores.busqueda?.trim()) {
      filtros.numeroResolucion = valores.busqueda.trim();
    }

    if (valores.estado) {
      filtros.estados = [valores.estado];
    }

    console.log('🔍 Filtros emitidos (formato frontend):', filtros);
    this.filtrosChange.emit(filtros);
  }

  limpiar(): void {
    this.form.reset();
    this.filtrosChange.emit({});
  }
}