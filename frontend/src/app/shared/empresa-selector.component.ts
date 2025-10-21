import { Component, Input, Output, EventEmitter, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { EmpresaService } from '../services/empresa.service';
import { Empresa } from '../models/empresa.model';

@Component({
  selector: 'app-empresa-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule
  ],
  template: `
    <mat-form-field appearance="outline" class="form-field" [class.required]="required">
      <mat-label>{{ label }}</mat-label>
      <input matInput 
             [formControl]="empresaControl"
             [placeholder]="placeholder"
             [matAutocomplete]="auto"
             (input)="onInputChange($event)"
             [required]="required">
      <mat-autocomplete #auto="matAutocomplete" 
                       (optionSelected)="onEmpresaSeleccionada($event)"
                       [displayWith]="displayFn">
        <mat-option *ngFor="let empresa of filteredEmpresas | async" [value]="empresa.id">
          <div class="empresa-option">
            <strong>{{ empresa.ruc }}</strong>
            <span>{{ empresa.razonSocial.principal }}</span>
          </div>
        </mat-option>
        <mat-option *ngIf="(filteredEmpresas | async)?.length === 0 && empresaControl.value" value="">
          <em>No se encontraron empresas</em>
        </mat-option>
      </mat-autocomplete>
      <mat-icon matSuffix>business</mat-icon>
      <mat-hint>{{ hint }}</mat-hint>
      <mat-error *ngIf="empresaControl.hasError('required') && required">
        La selección de empresa es obligatoria
      </mat-error>
    </mat-form-field>
  `,
  styles: [`
    .form-field {
      width: 100%;
    }

    .form-field.required .mat-form-field-label::after {
      content: ' *';
      color: #f44336;
    }

    .empresa-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .empresa-option strong {
      color: #1976d2;
      font-weight: 600;
    }

    .empresa-option span {
      color: #666;
      font-size: 0.9em;
    }

    .mat-option em {
      color: #999;
      font-style: italic;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmpresaSelectorComponent implements OnInit {
  @Input() label: string = 'Empresa';
  @Input() placeholder: string = 'Buscar por RUC, razón social o código';
  @Input() hint: string = 'Selecciona una empresa';
  @Input() required: boolean = false;
  @Input() empresaId: string = '';
  @Input() disabled: boolean = false;
  
  @Output() empresaSeleccionada = new EventEmitter<Empresa | null>();
  @Output() empresaIdChange = new EventEmitter<string>();

  private empresaService = inject(EmpresaService);

  empresas = signal<Empresa[]>([]);
  filteredEmpresas: Observable<Empresa[]> = new Observable<Empresa[]>();
  empresaControl = new FormControl<string>('');

  ngOnInit(): void {
    this.cargarEmpresas();
    this.configurarAutocompletado();
    
    if (this.empresaId) {
      this.empresaControl.setValue(this.empresaId);
    }
    
    if (this.disabled) {
      this.empresaControl.disable();
    }
  }

  /**
   * Carga las empresas desde el servicio
   */
  private cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe(empresas => {
      this.empresas.set(empresas);
    });
  }

  /**
   * Configura el autocompletado
   */
  private configurarAutocompletado(): void {
    this.filteredEmpresas = this.empresaControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  /**
   * Filtra las empresas para el autocompletado
   */
  private _filter(value: string): Empresa[] {
    if (typeof value !== 'string') return this.empresas();
    
    const filterValue = value.toLowerCase();
    return this.empresas().filter(empresa => 
      empresa.ruc.toLowerCase().includes(filterValue) ||
      empresa.razonSocial.principal.toLowerCase().includes(filterValue) ||
      (empresa.razonSocial.minimo && empresa.razonSocial.minimo.toLowerCase().includes(filterValue)) ||
      (empresa.codigoEmpresa && empresa.codigoEmpresa.toLowerCase().includes(filterValue))
    );
  }

  /**
   * Función para mostrar la empresa seleccionada en el input
   */
  displayFn = (empresaId: string): string => {
    if (!empresaId) return '';
    const empresa = this.empresas().find(e => e.id === empresaId);
    return empresa ? `${empresa.ruc} - ${empresa.razonSocial.principal}` : '';
  }

  /**
   * Maneja la selección de una empresa
   */
  onEmpresaSeleccionada(event: any): void {
    const empresaId = event.option.value;
    
    if (empresaId) {
      const empresa = this.empresas().find(e => e.id === empresaId);
      if (empresa) {
        this.empresaIdChange.emit(empresaId);
        this.empresaSeleccionada.emit(empresa);
      }
    } else {
      this.empresaIdChange.emit('');
      this.empresaSeleccionada.emit(null);
    }
  }

  /**
   * Maneja cambios en el input
   */
  onInputChange(event: any): void {
    const value = event.target.value;
    if (!value) {
      this.empresaIdChange.emit('');
      this.empresaSeleccionada.emit(null);
    }
  }

  /**
   * Establece el valor del control
   */
  setValue(empresaId: string): void {
    this.empresaControl.setValue(empresaId);
  }

  /**
   * Obtiene el valor actual del control
   */
  getValue(): string {
    return this.empresaControl.value || '';
  }

  /**
   * Limpia la selección
   */
  clear(): void {
    this.empresaControl.setValue('');
    this.empresaIdChange.emit('');
    this.empresaSeleccionada.emit(null);
  }
}
