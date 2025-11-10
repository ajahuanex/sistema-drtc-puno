import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { 
  ResolucionFiltros,
  TIPOS_TRAMITE_OPCIONES,
  ESTADOS_RESOLUCION_OPCIONES 
} from '../models/resolucion-table.model';
import { EmpresaSelectorComponent } from './empresa-selector.component';
import { DateRangePickerComponent, RangoFechas } from './date-range-picker.component';
import { SmartIconComponent } from './smart-icon.component';

export interface FiltrosMobileData {
  filtros: ResolucionFiltros;
  empresas: any[];
}

/**
 * Modal de filtros para dispositivos móviles
 * Proporciona una interfaz optimizada para pantallas pequeñas
 */
@Component({
  selector: 'app-filtros-mobile-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatDividerModule,
    EmpresaSelectorComponent,
    DateRangePickerComponent,
    SmartIconComponent
  ],
  template: `
    <div class="mobile-modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <!-- Header con toolbar -->
      <mat-toolbar color="primary" class="modal-toolbar">
        <button mat-icon-button 
                (click)="cerrar()"
                aria-label="Cerrar filtros">
          <app-smart-icon iconName="close" [size]="24" [attr.aria-hidden]="true"></app-smart-icon>
        </button>
        <span class="toolbar-title" id="modal-title">Filtros de Búsqueda</span>
        <button mat-icon-button 
                (click)="limpiarTodo()"
                aria-label="Limpiar todos los filtros">
          <app-smart-icon iconName="clear_all" [size]="24" [attr.aria-hidden]="true"></app-smart-icon>
        </button>
      </mat-toolbar>

      <!-- Contenido del modal -->
      <div class="modal-content">
        <form [formGroup]="filtrosForm" class="filtros-form-mobile">
          
          <!-- Filtro por número -->
          <div class="filtro-section">
            <div class="section-label">Número de Resolución</div>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Buscar por número</mat-label>
              <input matInput 
                     formControlName="numeroResolucion"
                     placeholder="Ej: R-001-2025"
                     autocomplete="off">
              <app-smart-icon iconName="search" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>
          </div>

          <mat-divider></mat-divider>

          <!-- Filtro por empresa -->
          <div class="filtro-section">
            <div class="section-label">Empresa</div>
            <app-empresa-selector
              label="Seleccionar empresa"
              placeholder="Buscar por RUC o razón social"
              [empresaId]="filtrosForm.get('empresaId')?.value"
              (empresaIdChange)="onEmpresaChange($event)">
            </app-empresa-selector>
          </div>

          <mat-divider></mat-divider>

          <!-- Filtro por tipo de trámite -->
          <div class="filtro-section">
            <div class="section-label">Tipo de Trámite</div>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Seleccionar tipos</mat-label>
              <mat-select formControlName="tiposTramite" multiple>
                @for (tipo of tiposTramiteOpciones; track tipo) {
                  <mat-option [value]="tipo">{{ tipo }}</mat-option>
                }
              </mat-select>
              <app-smart-icon iconName="category" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>
          </div>

          <mat-divider></mat-divider>

          <!-- Filtro por estado -->
          <div class="filtro-section">
            <div class="section-label">Estado</div>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Seleccionar estados</mat-label>
              <mat-select formControlName="estados" multiple>
                @for (estado of estadosOpciones; track estado) {
                  <mat-option [value]="estado">{{ estado }}</mat-option>
                }
              </mat-select>
              <app-smart-icon iconName="flag" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>
          </div>

          <mat-divider></mat-divider>

          <!-- Filtro por rango de fechas -->
          <div class="filtro-section">
            <div class="section-label">Rango de Fechas</div>
            <app-date-range-picker
              label="Fecha de emisión"
              hint="Seleccione el período"
              [formControl]="rangoFechasControl">
            </app-date-range-picker>
          </div>

          <mat-divider></mat-divider>

          <!-- Filtro por estado activo -->
          <div class="filtro-section">
            <div class="section-label">Estado Activo</div>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Filtrar por activación</mat-label>
              <mat-select formControlName="activo">
                <mat-option [value]="null">Todos</mat-option>
                <mat-option [value]="true">Solo Activos</mat-option>
                <mat-option [value]="false">Solo Inactivos</mat-option>
              </mat-select>
              <app-smart-icon iconName="toggle_on" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>
          </div>
        </form>
      </div>

      <!-- Footer con botones de acción -->
      <div class="modal-footer" role="group" aria-label="Acciones de filtros">
        <button mat-stroked-button 
                (click)="limpiarTodo()"
                class="footer-button"
                aria-label="Limpiar todos los filtros">
          <app-smart-icon iconName="clear_all" [size]="18" [attr.aria-hidden]="true"></app-smart-icon>
          Limpiar
        </button>
        
        <button mat-raised-button 
                color="primary"
                (click)="aplicar()"
                class="footer-button"
                aria-label="Aplicar filtros y cerrar">
          <app-smart-icon iconName="check" [size]="18" [attr.aria-hidden]="true"></app-smart-icon>
          Aplicar Filtros
        </button>
      </div>
    </div>
  `,
  styles: [`
    .mobile-modal-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 90vh;
    }

    .modal-toolbar {
      flex-shrink: 0;
    }

    .toolbar-title {
      flex: 1;
      text-align: center;
      font-size: 18px;
      font-weight: 500;
    }

    .modal-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .filtros-form-mobile {
      display: flex;
      flex-direction: column;
    }

    .filtro-section {
      padding: 16px;
    }

    .section-label {
      font-size: 12px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .full-width {
      width: 100%;
    }

    .modal-footer {
      flex-shrink: 0;
      display: flex;
      gap: 12px;
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      background-color: #fafafa;
    }

    .footer-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 48px;
      font-size: 14px;
    }

    /* Scrollbar personalizado */
    .modal-content::-webkit-scrollbar {
      width: 4px;
    }

    .modal-content::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .modal-content::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 2px;
    }
  `]
})
export class FiltrosMobileModalComponent implements OnInit {
  filtrosForm: FormGroup;
  rangoFechasControl: any;
  
  tiposTramiteOpciones = TIPOS_TRAMITE_OPCIONES;
  estadosOpciones = ESTADOS_RESOLUCION_OPCIONES;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FiltrosMobileModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FiltrosMobileData
  ) {
    this.rangoFechasControl = this.fb.control<RangoFechas | null>(null);
    this.filtrosForm = this.fb.group({
      numeroResolucion: [''],
      empresaId: [''],
      tiposTramite: [[]],
      estados: [[]],
      activo: [null]
    });
  }

  ngOnInit(): void {
    this.cargarFiltros();
  }

  private cargarFiltros(): void {
    const filtros = this.data.filtros;
    
    this.filtrosForm.patchValue({
      numeroResolucion: filtros.numeroResolucion || '',
      empresaId: filtros.empresaId || '',
      tiposTramite: filtros.tiposTramite || [],
      estados: filtros.estados || [],
      activo: filtros.activo ?? null
    });

    if (filtros.fechaInicio || filtros.fechaFin) {
      this.rangoFechasControl.setValue({
        inicio: filtros.fechaInicio || null,
        fin: filtros.fechaFin || null
      });
    }
  }

  onEmpresaChange(empresaId: string): void {
    this.filtrosForm.patchValue({ empresaId });
  }

  limpiarTodo(): void {
    this.filtrosForm.reset({
      numeroResolucion: '',
      empresaId: '',
      tiposTramite: [],
      estados: [],
      activo: null
    });
    this.rangoFechasControl.reset();
  }

  aplicar(): void {
    const formValue = this.filtrosForm.value;
    const rangoFechas = this.rangoFechasControl.value;
    
    const filtros: ResolucionFiltros = {};
    
    if (formValue.numeroResolucion?.trim()) {
      filtros.numeroResolucion = formValue.numeroResolucion.trim();
    }
    
    if (formValue.empresaId) {
      filtros.empresaId = formValue.empresaId;
    }
    
    if (formValue.tiposTramite?.length > 0) {
      filtros.tiposTramite = formValue.tiposTramite;
    }
    
    if (formValue.estados?.length > 0) {
      filtros.estados = formValue.estados;
    }
    
    if (formValue.activo !== null) {
      filtros.activo = formValue.activo;
    }
    
    if (rangoFechas?.inicio) {
      filtros.fechaInicio = rangoFechas.inicio;
    }
    
    if (rangoFechas?.fin) {
      filtros.fechaFin = rangoFechas.fin;
    }
    
    this.dialogRef.close(filtros);
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
