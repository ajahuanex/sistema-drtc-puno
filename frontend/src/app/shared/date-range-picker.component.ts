import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SmartIconComponent } from './smart-icon.component';

export interface RangoFechas {
  inicio: Date | null;
  fin: Date | null;
}

/**
 * Componente para selección de rango de fechas
 * 
 * @example
 * ```html
 * <!-- Uso básico -->
 * <app-date-range-picker
 *   label="Rango de Fechas"
 *   (rangoChange)="onRangoChange($event)">
 * </app-date-range-picker>
 * 
 * <!-- Con FormControl -->
 * <app-date-range-picker
 *   [formControl]="rangoFechasControl"
 *   label="Período de Consulta"
 *   hint="Seleccione el período a consultar">
 * </app-date-range-picker>
 * ```
 */
@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    SmartIconComponent
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangePickerComponent),
      multi: true
    }
  ],
  template: `
    <div class="date-range-container">
      <mat-form-field appearance="outline" class="date-field">
        <mat-label>{{ label || 'Rango de Fechas' }}</mat-label>
        <mat-date-range-input [rangePicker]="picker" [formGroup]="rangeForm">
          <input matStartDate 
                 formControlName="inicio" 
                 placeholder="Fecha inicio"
                 [max]="fechaMaxima"
                 [min]="fechaMinima">
          <input matEndDate 
                 formControlName="fin" 
                 placeholder="Fecha fin"
                 [max]="fechaMaxima"
                 [min]="fechaMinima">
        </mat-date-range-input>
        
        <mat-datepicker-toggle matIconSuffix [for]="picker">
          <app-smart-icon iconName="date_range" [size]="20" matDatepickerToggleIcon></app-smart-icon>
        </mat-datepicker-toggle>
        
        <mat-date-range-picker #picker>
          <mat-date-range-picker-actions>
            <button mat-button matDateRangePickerCancel>Cancelar</button>
            <button mat-raised-button color="primary" matDateRangePickerApply>Aplicar</button>
          </mat-date-range-picker-actions>
        </mat-date-range-picker>
        
        @if (hint) {
          <mat-hint>{{ hint }}</mat-hint>
        }
        
        @if (rangeForm.get('inicio')?.hasError('matStartDateInvalid')) {
          <mat-error>Fecha de inicio inválida</mat-error>
        }
        @if (rangeForm.get('fin')?.hasError('matEndDateInvalid')) {
          <mat-error>Fecha de fin inválida</mat-error>
        }
        @if (rangeForm.hasError('rangoInvalido')) {
          <mat-error>La fecha de fin debe ser posterior a la fecha de inicio</mat-error>
        }
        @if (rangeForm.hasError('rangoExcesivo')) {
          <mat-error>El rango no puede exceder {{ maxDiasRango }} días</mat-error>
        }
      </mat-form-field>
      
      @if (mostrarBotones) {
        <div class="range-actions">
          <button mat-icon-button 
                  (click)="limpiarRango()" 
                  [disabled]="!tieneRango()"
                  matTooltip="Limpiar rango">
            <app-smart-icon iconName="clear" [size]="20"></app-smart-icon>
          </button>
          
          <button mat-icon-button 
                  (click)="establecerRangoRapido('hoy')"
                  matTooltip="Hoy">
            <app-smart-icon iconName="today" [size]="20"></app-smart-icon>
          </button>
          
          <button mat-icon-button 
                  (click)="establecerRangoRapido('semana')"
                  matTooltip="Esta semana">
            <app-smart-icon iconName="date_range" [size]="20"></app-smart-icon>
          </button>
          
          <button mat-icon-button 
                  (click)="establecerRangoRapido('mes')"
                  matTooltip="Este mes">
            <app-smart-icon iconName="calendar_month" [size]="20"></app-smart-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .date-range-container {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      width: 100%;
    }

    .date-field {
      flex: 1;
      min-width: 280px;
    }

    .range-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 8px;
    }

    .range-actions button {
      width: 32px;
      height: 32px;
    }

    @media (max-width: 768px) {
      .date-range-container {
        flex-direction: column;
        align-items: stretch;
      }
      
      .range-actions {
        flex-direction: row;
        justify-content: center;
        margin-top: 8px;
      }
    }
  `]
})
export class DateRangePickerComponent implements ControlValueAccessor {
  /** Etiqueta del campo */
  @Input() label: string = '';
  
  /** Texto de ayuda */
  @Input() hint: string = '';
  
  /** Si el campo es requerido */
  @Input() required: boolean = false;
  
  /** Si el campo está deshabilitado */
  @Input() disabled: boolean = false;
  
  /** Fecha mínima seleccionable */
  @Input() fechaMinima: Date | null = null;
  
  /** Fecha máxima seleccionable */
  @Input() fechaMaxima: Date | null = null;
  
  /** Máximo número de días en el rango */
  @Input() maxDiasRango: number = 365;
  
  /** Mostrar botones de acciones rápidas */
  @Input() mostrarBotones: boolean = true;
  
  /** Evento emitido cuando cambia el rango */
  @Output() rangoChange = new EventEmitter<RangoFechas>();

  // FormGroup para el rango de fechas
  rangeForm = new FormGroup({
    inicio: new FormControl<Date | null>(null),
    fin: new FormControl<Date | null>(null)
  }, this.validadorRango.bind(this));

  // ControlValueAccessor
  private onChange = (value: RangoFechas) => {};
  private onTouched = () => {};

  constructor() {
    // Suscribirse a cambios en el formulario
    this.rangeForm.valueChanges.subscribe(value => {
      const rango: RangoFechas = {
        inicio: value.inicio || null,
        fin: value.fin || null
      };
      
      this.rangoChange.emit(rango);
      this.onChange(rango);
    });
  }

  // ========================================
  // CONTROL VALUE ACCESSOR
  // ========================================

  writeValue(value: RangoFechas | null): void {
    if (value) {
      this.rangeForm.patchValue({
        inicio: value.inicio,
        fin: value.fin
      }, { emitEvent: false });
    } else {
      this.rangeForm.reset({}, { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: RangoFechas) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.rangeForm.disable();
    } else {
      this.rangeForm.enable();
    }
  }

  // ========================================
  // VALIDADORES
  // ========================================

  /**
   * Validador personalizado para el rango de fechas
   */
  private validadorRango(control: AbstractControl) {
    const group = control as FormGroup;
    const inicio = group.get('inicio')?.value;
    const fin = group.get('fin')?.value;

    if (!inicio || !fin) {
      return null; // No validar si no hay ambas fechas
    }

    // Validar que la fecha de fin sea posterior a la de inicio
    if (fin <= inicio) {
      return { rangoInvalido: true };
    }

    // Validar que el rango no exceda el máximo permitido
    const diferenciaDias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    if (diferenciaDias > this.maxDiasRango) {
      return { rangoExcesivo: true };
    }

    return null;
  }

  // ========================================
  // MÉTODOS PÚBLICOS
  // ========================================

  /**
   * Limpia el rango seleccionado
   */
  limpiarRango(): void {
    this.rangeForm.reset();
    this.onTouched();
  }

  /**
   * Establece un rango rápido predefinido
   */
  establecerRangoRapido(tipo: 'hoy' | 'semana' | 'mes'): void {
    const hoy = new Date();
    let inicio: Date;
    let fin: Date = new Date(hoy);

    switch (tipo) {
      case 'hoy':
        inicio = new Date(hoy);
        fin = new Date(hoy);
        break;
        
      case 'semana':
        // Inicio de la semana (lunes)
        const diaSemana = hoy.getDay();
        const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - diasHastaLunes);
        
        // Fin de la semana (domingo)
        fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6);
        break;
        
      case 'mes':
        // Primer día del mes
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        
        // Último día del mes
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        break;
        
      default:
        return;
    }

    this.rangeForm.patchValue({
      inicio: inicio,
      fin: fin
    });
    
    this.onTouched();
  }

  /**
   * Verifica si hay un rango seleccionado
   */
  tieneRango(): boolean {
    const valor = this.rangeForm.value;
    return !!(valor.inicio || valor.fin);
  }

  /**
   * Obtiene el rango actual
   */
  getRango(): RangoFechas {
    const valor = this.rangeForm.value;
    return {
      inicio: valor.inicio || null,
      fin: valor.fin || null
    };
  }

  /**
   * Establece un rango específico
   */
  setRango(rango: RangoFechas): void {
    this.writeValue(rango);
  }

  /**
   * Verifica si el formulario es válido
   */
  esValido(): boolean {
    return this.rangeForm.valid;
  }

  /**
   * Obtiene los errores del formulario
   */
  getErrores(): any {
    return this.rangeForm.errors;
  }
}