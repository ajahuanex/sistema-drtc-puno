import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map, startWith, finalize } from 'rxjs/operators';

import { ExpedienteService } from '../services/expediente.service';
import { Expediente } from '../models/expediente.model';
import { SmartIconComponent } from './smart-icon.component';

@Component({
  selector: 'app-expediente-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    SmartIconComponent
  ],
  template: `
    <mat-form-field appearance="outline" class="form-field" [class.required]="required">
      <mat-label>
        {{ label }}
        <span *ngIf="required" class="required-indicator">*</span>
      </mat-label>
      <input matInput 
             [formControl]="expedienteControl"
             [placeholder]="placeholder"
             [matAutocomplete]="auto"
             [required]="required"
             [disabled]="disabled || isLoading()">
      <mat-autocomplete #auto="matAutocomplete" 
                       (optionSelected)="onExpedienteSeleccionado($event)"
                       [displayWith]="displayFn">
        <!-- Loading option -->
        <mat-option *ngIf="isLoading()" value="" disabled>
          <div class="loading-option">
            <mat-spinner diameter="20"></mat-spinner>
            <span>Cargando expedientes...</span>
          </div>
        </mat-option>
        
        <!-- Expediente options -->
        <mat-option *ngFor="let expediente of filteredExpedientes | async" [value]="expediente.id">
          <div class="expediente-option">
            <div class="expediente-header">
              <strong>{{ expediente.nroExpediente }}</strong>
              <span class="tipo-badge" [class]="'tipo-' + expediente.tipoTramite?.toLowerCase()">
                {{ expediente.tipoTramite }}
              </span>
              <mat-chip *ngIf="expediente.resolucionFinalId" class="resolucion-badge" color="accent">
                <mat-icon>check_circle</mat-icon>
                CON RESOLUCIÓN
              </mat-chip>
            </div>
            <div class="expediente-meta">
              <small class="fecha">{{ expediente.fechaEmision | date:'dd/MM/yyyy' }}</small>
              <small class="estado" [class]="'estado-' + expediente.estado?.toLowerCase()">
                {{ expediente.estado }}
              </small>
            </div>
          </div>
        </mat-option>
        
        <!-- No results option -->
        <mat-option *ngIf="!isLoading() && (filteredExpedientes | async)?.length === 0 && expedienteControl.value" value="" disabled>
          <div class="no-results-option">
            <app-smart-icon [iconName]="'search_off'" [size]="18"></app-smart-icon>
            <span>No se encontraron expedientes</span>
          </div>
        </mat-option>
      </mat-autocomplete>
      
      <!-- Suffix icon with loading state -->
      <mat-spinner *ngIf="isLoading()" matSuffix diameter="20"></mat-spinner>
      <app-smart-icon *ngIf="!isLoading()" [iconName]="'folder'" matSuffix></app-smart-icon>
      
      <mat-hint>{{ hint }}</mat-hint>
      <mat-error *ngIf="expedienteControl.hasError('required') && required">
        El expediente es obligatorio
      </mat-error>
    </mat-form-field>
  `,
  styles: [`
    .form-field {
      width: 100%;
    }

    .required-indicator {
      color: #f44336;
      font-weight: bold;
      margin-left: 2px;
    }

    .expediente-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px 0;
    }

    .expediente-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .expediente-option strong {
      color: #1976d2;
      font-weight: 600;
      font-size: 0.95em;
    }

    .tipo-badge {
      font-size: 0.7em;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tipo-autorizacion_nueva {
      color: #1565c0;
      background: #e3f2fd;
    }

    .tipo-renovacion {
      color: #2e7d32;
      background: #e8f5e9;
    }

    .tipo-incremento {
      color: #f57c00;
      background: #fff3e0;
    }

    .tipo-sustitucion {
      color: #7b1fa2;
      background: #f3e5f5;
    }

    .resolucion-badge {
      font-size: 0.65em;
      height: 20px;
      padding: 0 6px;
    }

    .resolucion-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      margin-right: 2px;
    }

    .expediente-meta {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 2px;
    }

    .expediente-meta .fecha {
      color: #999;
      font-size: 0.75em;
    }

    .expediente-meta .estado {
      font-size: 0.75em;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .estado-en_proceso {
      color: #f57c00;
      background: #fff3e0;
    }

    .estado-aprobado {
      color: #2e7d32;
      background: #e8f5e9;
    }

    .estado-rechazado {
      color: #d32f2f;
      background: #ffebee;
    }

    .loading-option,
    .no-results-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      color: #999;
    }
  `]
})
export class ExpedienteSelectorComponent implements OnInit {
  @Input() label: string = 'Expediente';
  @Input() placeholder: string = 'Buscar por número de expediente';
  @Input() hint: string = 'Busca por número de expediente';
  @Input() required: boolean = false;
  @Input() expedienteId: string = '';
  @Input() empresaId: string = '';
  @Input() disabled: boolean = false;
  @Input() soloSinResolucion: boolean = false; // Filtrar solo expedientes sin resolución
  
  @Output() expedienteSeleccionado = new EventEmitter<Expediente | null>();
  @Output() expedienteIdChange = new EventEmitter<string>();

  private expedienteService = inject(ExpedienteService);

  expedientes = signal<Expediente[]>([]);
  filteredExpedientes: Observable<Expediente[]> = new Observable<Expediente[]>();
  expedienteControl = new FormControl<string>('');
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.cargarExpedientes();
    this.configurarAutocompletado();
    
    if (this.expedienteId) {
      this.expedienteControl.setValue(this.expedienteId);
    }
    
    if (this.disabled) {
      this.expedienteControl.disable();
    }
  }

  private cargarExpedientes(): void {
    this.isLoading.set(true);
    
    const observable = this.empresaId 
      ? this.expedienteService.getExpedientesByEmpresa(this.empresaId)
      : this.expedienteService.getExpedientes();
    
    observable
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (expedientes: Expediente[]) => {
          let expedientesFiltrados = expedientes.filter((e: Expediente) => e.estaActivo);
          
          // Filtrar solo sin resolución si se especifica
          if (this.soloSinResolucion) {
            expedientesFiltrados = expedientesFiltrados.filter((e: Expediente) => !e.resolucionFinalId);
          }
          
          this.expedientes.set(expedientesFiltrados);
        },
        error: (error: any) => {
          console.error('Error al cargar expedientes:', error);
          this.expedientes.set([]);
        }
      });
  }

  private configurarAutocompletado(): void {
    this.filteredExpedientes = this.expedienteControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  private _filter(value: string): Expediente[] {
    if (typeof value !== 'string') return this.expedientes();
    
    const filterValue = value.toLowerCase().trim();
    if (!filterValue) return this.expedientes();
    
    return this.expedientes().filter(expediente => 
      expediente.nroExpediente.toLowerCase().includes(filterValue) ||
      expediente.tipoTramite.toLowerCase().includes(filterValue)
    );
  }

  displayFn = (expedienteId: string): string => {
    if (!expedienteId) return '';
    const expediente = this.expedientes().find(e => e.id === expedienteId);
    return expediente ? expediente.nroExpediente : '';
  };

  onExpedienteSeleccionado(event: any): void {
    const expedienteId = event.option.value;
    const expediente = this.expedientes().find(e => e.id === expedienteId);
    
    this.expedienteSeleccionado.emit(expediente || null);
    this.expedienteIdChange.emit(expedienteId);
  }
}
