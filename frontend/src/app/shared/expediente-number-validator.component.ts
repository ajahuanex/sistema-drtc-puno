import { Component, Input, Output, EventEmitter, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { ExpedienteValidationService, ValidacionExpediente, ResultadoValidacionExpediente } from '../services/expediente-validation.service';

@Component({
  selector: 'app-expediente-number-validator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule
  ],
  template: `
    <div class="validator-container">
      <mat-form-field appearance="outline" class="form-field" [class.required]="required">
        <mat-label>{{ label }}</mat-label>
        <input matInput 
               [formControl]="numeroControl"
               [placeholder]="placeholder"
               (input)="onInputChange($event)"
               [required]="required">
        <mat-icon matSuffix [class.valid]="isValid()" [class.invalid]="!isValid() && numeroControl.value">
          {{ getValidationIcon() }}
        </mat-icon>
        <mat-hint>{{ hintDinamico() || hint }}</mat-hint>
        <mat-error *ngIf="numeroControl.hasError('required') && required">
          El número de expediente es obligatorio
        </mat-error>
        <mat-error *ngIf="numeroControl.hasError('duplicado')">
          {{ getErrorMessage() }}
        </mat-error>
      </mat-form-field>

      <!-- Información de validación - Solo mostrar errores -->
      <div class="validation-info" *ngIf="numeroControl.value && !isLoading() && !isValid()">
        <div class="validation-status invalid">
          <mat-icon>{{ getStatusIcon() }}</mat-icon>
          <span>{{ getStatusMessage() }}</span>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="isLoading()">
        <mat-icon class="loading-icon">hourglass_empty</mat-icon>
        <span>Validando...</span>
      </div>
    </div>
  `,
  styles: [`
    .validator-container {
      width: 100%;
    }

    .form-field {
      width: 100%;
    }

    .form-field.required .mat-form-field-label::after {
      content: ' *';
      color: #f44336;
    }

    .validation-info {
      margin-top: 8px;
      padding: 12px;
      border-radius: 4px;
      background-color: #f5f5f5;
      border-left: 4px solid #ddd;
    }

    .validation-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .validation-status.valid {
      color: #4caf50;
      border-left-color: #4caf50;
    }

    .validation-status.invalid {
      color: #f44336;
      border-left-color: #f44336;
    }

    .sugerencias {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
    }

    .sugerencias-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: #666;
    }

    .sugerencias-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .sugerencia-chip {
      cursor: pointer;
      background-color: #e3f2fd;
      color: #1976d2;
      transition: all 0.2s ease;
    }

    .sugerencia-chip:hover {
      background-color: #bbdefb;
      transform: translateY(-1px);
    }

    .conflictos {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
    }

    .conflictos-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: #f44336;
    }

    .conflictos-list {
      margin: 0;
      padding-left: 20px;
      color: #f44336;
    }

    .conflictos-list li {
      margin-bottom: 4px;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      color: #666;
    }

    .loading-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .mat-icon.valid {
      color: #4caf50;
    }

    .mat-icon.invalid {
      color: #f44336;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpedienteNumberValidatorComponent implements OnInit, OnDestroy {
  @Input() label: string = 'Número de Expediente';
  @Input() placeholder: string = 'Ej: 0001';
  @Input() hint: string = 'El sistema generará E-0001-2025';
  @Input() required: boolean = true;
  @Input() empresaId: string = '';
  @Input() expedienteIdExcluir: string = '';
  @Input() disabled: boolean = false;
  
  // Signal para el hint dinámico
  hintDinamico = signal<string>('');
  
  @Output() numeroValido = new EventEmitter<{ numero: string; año: number; nroCompleto: string }>();
  @Output() numeroInvalido = new EventEmitter<string>();
  @Output() validacionCompleta = new EventEmitter<ResultadoValidacionExpediente>();

  private validationService = inject(ExpedienteValidationService);
  private destroy$ = new Subject<void>();

  numeroControl = new FormControl<string>('');
  isLoading = signal(false);
  isValid = signal(false);
  resultadoValidacion = signal<ResultadoValidacionExpediente | null>(null);
  sugerencias = signal<string[]>([]);

  ngOnInit(): void {
    if (this.disabled) {
      this.numeroControl.disable();
    }

    // Configurar validación en tiempo real
    this.numeroControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      if (value) {
        this.validarNumero(value);
      } else {
        this.resetValidation();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Maneja cambios en el input
   */
  onInputChange(event: any): void {
    const value = event.target.value;
    if (!value) {
      this.resetValidation();
      this.numeroInvalido.emit('');
    }
  }

  /**
   * Valida el número de expediente
   */
  private validarNumero(numero: string): void {
    this.isLoading.set(true);
    this.isValid.set(false);

    const año = new Date().getFullYear();
    
    const validacion: ValidacionExpediente = {
      numero,
      año,
      empresaId: this.empresaId,
      expedienteIdExcluir: this.expedienteIdExcluir
    };

    this.validationService.validarUnicidadExpediente(validacion).subscribe(resultado => {
      this.isLoading.set(false);
      this.resultadoValidacion.set(resultado);
      
      if (resultado.valido) {
        this.isValid.set(true);
        const nroCompleto = this.validationService.generarNumeroExpediente(numero, año);
        
        // Actualizar hint dinámico con el número completo
        this.hintDinamico.set(`El sistema generará ${nroCompleto}`);
        
        this.numeroValido.emit({ numero, año, nroCompleto });
        this.validacionCompleta.emit(resultado);
        
        // Obtener sugerencias para el siguiente número
        this.obtenerSugerencias(año);
      } else {
        this.isValid.set(false);
        
        // Limpiar hint dinámico cuando es inválido
        this.hintDinamico.set('');
        
        this.numeroInvalido.emit(resultado.mensaje);
        this.validacionCompleta.emit(resultado);
        
        // Obtener sugerencias alternativas
        this.obtenerSugerencias(año);
      }
    });
  }

  /**
   * Obtiene sugerencias de números disponibles
   */
  private obtenerSugerencias(año: number): void {
    this.validationService.obtenerSugerenciasNumeros(año, 5).subscribe(sugerencias => {
      this.sugerencias.set(sugerencias);
    });
  }

  /**
   * Selecciona una sugerencia
   */
  seleccionarSugerencia(numero: string): void {
    this.numeroControl.setValue(numero);
  }

  /**
   * Resetea la validación
   */
  private resetValidation(): void {
    this.isValid.set(false);
    this.resultadoValidacion.set(null);
    this.sugerencias.set([]);
    this.hintDinamico.set('');
  }

  /**
   * Obtiene el icono de validación
   */
  getValidationIcon(): string {
    if (!this.numeroControl.value) return 'help_outline';
    return this.isValid() ? 'check_circle' : 'error';
  }

  /**
   * Obtiene el icono de estado
   */
  getStatusIcon(): string {
    return this.isValid() ? 'check_circle' : 'error';
  }

  /**
   * Obtiene el mensaje de estado
   */
  getStatusMessage(): string {
    if (!this.resultadoValidacion()) return '';
    return this.resultadoValidacion()?.mensaje || '';
  }

  /**
   * Obtiene el mensaje de error
   */
  getErrorMessage(): string {
    if (!this.resultadoValidacion()) return '';
    return this.resultadoValidacion()?.mensaje || '';
  }

  /**
   * Establece el valor del control
   */
  setValue(numero: string): void {
    this.numeroControl.setValue(numero);
  }

  /**
   * Obtiene el valor actual del control
   */
  getValue(): string {
    return this.numeroControl.value || '';
  }

  /**
   * Limpia la validación
   */
  clear(): void {
    this.numeroControl.setValue('');
    this.resetValidation();
  }

  /**
   * Verifica si el campo es válido
   */
  isFieldValid(): boolean {
    return this.numeroControl.valid && this.isValid();
  }
}
