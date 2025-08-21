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

import { ResolucionValidationService, ValidacionResolucion, ResultadoValidacion } from '../services/resolucion-validation.service';

@Component({
  selector: 'app-resolucion-number-validator',
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
        <mat-hint>{{ hint }}</mat-hint>
        <mat-error *ngIf="numeroControl.hasError('required') && required">
          El número de resolución es obligatorio
        </mat-error>
        <mat-error *ngIf="numeroControl.hasError('duplicado')">
          {{ getErrorMessage() }}
        </mat-error>
      </mat-form-field>

      <!-- Información de validación -->
      <div class="validation-info" *ngIf="numeroControl.value && !isLoading()">
        <div class="validation-status" [class.valid]="isValid()" [class.invalid]="!isValid()">
          <mat-icon>{{ getStatusIcon() }}</mat-icon>
          <span>{{ getStatusMessage() }}</span>
        </div>
        
        <!-- Sugerencias -->
        <div class="sugerencias" *ngIf="sugerencias().length > 0">
          <span class="sugerencias-label">Números disponibles:</span>
          <div class="sugerencias-chips">
            <mat-chip 
              *ngFor="let sugerencia of sugerencias()" 
              (click)="seleccionarSugerencia(sugerencia)"
              class="sugerencia-chip">
              {{ sugerencia }}
            </mat-chip>
          </div>
        </div>

        <!-- Conflictos -->
        <div class="conflictos" *ngIf="resultadoValidacion()?.conflictos?.length">
          <span class="conflictos-label">Conflictos detectados:</span>
          <ul class="conflictos-list">
            <li *ngFor="let conflicto of resultadoValidacion()?.conflictos">
              {{ conflicto }}
            </li>
          </ul>
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
export class ResolucionNumberValidatorComponent implements OnInit, OnDestroy {
  @Input() label: string = 'Número de Resolución';
  @Input() placeholder: string = 'Ej: 0001';
  @Input() hint: string = 'El sistema generará R-0001-2025';
  @Input() required: boolean = true;
  @Input() empresaId: string = '';
  @Input() resolucionIdExcluir: string = '';
  @Input() disabled: boolean = false;
  
  @Output() numeroValido = new EventEmitter<{ numero: string; año: number; nroCompleto: string }>();
  @Output() numeroInvalido = new EventEmitter<string>();
  @Output() validacionCompleta = new EventEmitter<ResultadoValidacion>();

  private validationService = inject(ResolucionValidationService);
  private destroy$ = new Subject<void>();

  numeroControl = new FormControl<string>('');
  isLoading = signal(false);
  isValid = signal(false);
  resultadoValidacion = signal<ResultadoValidacion | null>(null);
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
   * Valida el número de resolución
   */
  private validarNumero(numero: string): void {
    this.isLoading.set(true);
    this.isValid.set(false);

    const año = new Date().getFullYear();
    
    const validacion: ValidacionResolucion = {
      numero,
      año,
      empresaId: this.empresaId,
      resolucionIdExcluir: this.resolucionIdExcluir
    };

    this.validationService.validarUnicidadResolucion(validacion).subscribe(resultado => {
      this.isLoading.set(false);
      this.resultadoValidacion.set(resultado);
      
      if (resultado.valido) {
        this.isValid.set(true);
        const nroCompleto = this.validationService.generarNumeroResolucion(numero, año);
        this.numeroValido.emit({ numero, año, nroCompleto });
        this.validacionCompleta.emit(resultado);
        
        // Obtener sugerencias para el siguiente número
        this.obtenerSugerencias(año);
      } else {
        this.isValid.set(false);
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
