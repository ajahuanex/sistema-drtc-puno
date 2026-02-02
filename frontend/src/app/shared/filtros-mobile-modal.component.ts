import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { ResolucionFiltros, TIPOS_TRAMITE_OPCIONES, ESTADOS_RESOLUCION_OPCIONES } from '../models/resolucion-table.model';
import { EmpresaSelectorComponent } from './empresa-selector.component';
import { DateRangePickerComponent, RangoFechas } from './date-range-picker.component';
import { SmartIconComponent } from './smart-icon.component';

interface FiltrosMobileData {
  filtros: ResolucionFiltros;
  empresas: any[];
}

@Component({
  selector: 'app-filtros-mobile-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    EmpresaSelectorComponent,
    DateRangePickerComponent,
    SmartIconComponent
  ],
  template: `
    <div class="mobile-filtros-modal">
      <!-- Header -->
      <mat-toolbar class="modal-toolbar">
        <button mat-icon-button (click)="cerrar()" aria-label="Cerrar filtros">
          <app-smart-icon iconName="close" [size]="24"></app-smart-icon>
        </button>
        
        <span class="toolbar-title">
          <app-smart-icon iconName="filter_list" [size]="20"></app-smart-icon>
          Filtros Avanzados
        </span>
        
        <button mat-button (click)="limpiarTodo()" class="limpiar-btn">
          <app-smart-icon iconName="clear_all" [size]="18"></app-smart-icon>
          Limpiar
        </button>
      </mat-toolbar>

      <!-- Contenido de filtros -->
      <div class="modal-content">
        <form [formGroup]="filtrosForm" class="filtros-form-mobile">
          
          <!-- Sección: Búsqueda básica -->
          <div class="filtro-seccion">
            <h3 class="seccion-titulo">
              <app-smart-icon iconName="search" [size]="18"></app-smart-icon>
              Búsqueda Básica
            </h3>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Número de Resolución</mat-label>
              <input matInput 
                     formControlName="numeroResolucion"
                     placeholder="Ej: R-001-2025"
                     autocomplete="off">
              <app-smart-icon iconName="search" [size]="20" matSuffix></app-smart-icon>
              <mat-hint>Buscar por número completo o parcial</mat-hint>
            </mat-form-field>

            <div class="empresa-selector-mobile">
              <app-empresa-selector
                label="Empresa"
                placeholder="Buscar empresa por RUC o razón social"
                hint="Filtrar resoluciones por empresa"
                [empresaId]="filtrosForm.get('empresaId')?.value"
                (empresaIdChange)="onEmpresaChange($event)"
                (empresaSeleccionada)="onEmpresaSeleccionada($event)">
              </app-empresa-selector>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Sección: Clasificación -->
          <div class="filtro-seccion">
            <h3 class="seccion-titulo">
              <app-smart-icon iconName="category" [size]="18"></app-smart-icon>
              Clasificación
            </h3>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tipos de Trámite</mat-label>
              <mat-select formControlName="tiposTramite" multiple>
                <mat-select-trigger>
                  @if (filtrosForm.get('tiposTramite')?.value?.length) {
                    {{ filtrosForm.get('tiposTramite')?.value?.length || 0 }} seleccionado(s)
                  } @else {
                    Seleccionar tipos
                  }
                </mat-select-trigger>
                @for (tipo of tiposTramiteOpciones; track tipo) {
                  <mat-option [value]="tipo">{{ tipo }}</mat-option>
                }
              </mat-select>
              <app-smart-icon iconName="category" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Estados</mat-label>
              <mat-select formControlName="estados" multiple>
                <mat-select-trigger>
                  @if (filtrosForm.get('estados')?.value?.length) {
                    {{ filtrosForm.get('estados')?.value?.length || 0 }} seleccionado(s)
                  } @else {
                    Seleccionar estados
                  }
                </mat-select-trigger>
                @for (estado of estadosOpciones; track estado) {
                  <mat-option [value]="estado">{{ estado }}</mat-option>
                }
              </mat-select>
              <app-smart-icon iconName="flag" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>
          </div>

          <mat-divider></mat-divider>

          <!-- Sección: Fechas -->
          <div class="filtro-seccion">
            <h3 class="seccion-titulo">
              <app-smart-icon iconName="date_range" [size]="18"></app-smart-icon>
              Rango de Fechas
            </h3>
            
            <div class="fecha-selector-mobile">
              <app-date-range-picker
                label="Fechas de Emisión"
                hint="Seleccione el período de emisión"
                [formControl]="rangoFechasControl"
                (rangoChange)="onRangoFechasChange($event)">
              </app-date-range-picker>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Sección: Estado -->
          <div class="filtro-seccion">
            <h3 class="seccion-titulo">
              <app-smart-icon iconName="toggle_on" [size]="18"></app-smart-icon>
              Estado de Activación
            </h3>
            
            <div class="toggle-group">
              <mat-slide-toggle 
                formControlName="soloActivos"
                color="primary"
                class="toggle-option">
                Solo mostrar resoluciones activas
              </mat-slide-toggle>
              
              <mat-slide-toggle 
                formControlName="soloVigentes"
                color="primary"
                class="toggle-option">
                Solo mostrar resoluciones vigentes
              </mat-slide-toggle>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Sección: Filtros rápidos -->
          <div class="filtro-seccion">
            <h3 class="seccion-titulo">
              <app-smart-icon iconName="flash_on" [size]="18"></app-smart-icon>
              Filtros Rápidos
            </h3>
            
            <div class="filtros-rapidos">
              <button mat-stroked-button 
                      type="button"
                      (click)="aplicarFiltroRapido('recientes')"
                      class="filtro-rapido-btn">
                <app-smart-icon iconName="schedule" [size]="18"></app-smart-icon>
                Últimos 30 días
              </button>
              
              <button mat-stroked-button 
                      type="button"
                      (click)="aplicarFiltroRapido('proximos-vencer')"
                      class="filtro-rapido-btn">
                <app-smart-icon iconName="warning" [size]="18"></app-smart-icon>
                Próximos a vencer
              </button>
              
              <button mat-stroked-button 
                      type="button"
                      (click)="aplicarFiltroRapido('vigentes')"
                      class="filtro-rapido-btn">
                <app-smart-icon iconName="check_circle" [size]="18"></app-smart-icon>
                Solo vigentes
              </button>
              
              <button mat-stroked-button 
                      type="button"
                      (click)="aplicarFiltroRapido('activos')"
                      class="filtro-rapido-btn">
                <app-smart-icon iconName="toggle_on" [size]="18"></app-smart-icon>
                Solo activos
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer con acciones -->
      <div class="modal-footer">
        <div class="footer-actions">
          <button mat-button 
                  (click)="cerrar()"
                  class="cancelar-btn">
            Cancelar
          </button>
          
          <button mat-raised-button 
                  color="primary"
                  (click)="aplicarFiltros()"
                  class="aplicar-btn">
            <app-smart-icon iconName="search" [size]="18"></app-smart-icon>
            Aplicar Filtros
          </button>
        </div>
        
        <!-- Contador de filtros -->
        @if (contadorFiltros() > 0) {
          <div class="contador-filtros">
            <app-smart-icon iconName="local_offer" [size]="16"></app-smart-icon>
            <span>{{ contadorFiltros() }} filtro(s) aplicado(s)</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .mobile-filtros-modal {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: white;
    }

    .modal-toolbar {
      background: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px;
      min-height: 56px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .toolbar-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 500;
      flex: 1;
      text-align: center;
    }

    .limpiar-btn {
      color: white;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
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

    .filtro-seccion {
      padding: 20px;
    }

    .seccion-titulo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .empresa-selector-mobile,
    .fecha-selector-mobile {
      width: 100%;
      margin-bottom: 16px;
    }

    .toggle-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .toggle-option {
      width: 100%;
    }

    .filtros-rapidos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .filtro-rapido-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 8px;
      text-align: center;
      height: auto;
      font-size: 12px;
      border-radius: 8px;
    }

    .filtro-rapido-btn:hover {
      background: #f5f5f5;
    }

    .modal-footer {
      background: white;
      border-top: 1px solid #e0e0e0;
      padding: 16px 20px;
      box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
    }

    .footer-actions {
      display: flex;
      gap: 12px;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .cancelar-btn {
      flex: 1;
      padding: 12px;
      font-size: 16px;
    }

    .aplicar-btn {
      flex: 2;
      padding: 12px;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .contador-filtros {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: #666;
      font-size: 14px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    /* Estilos para mat-divider */
    mat-divider {
      margin: 0;
      border-color: #e0e0e0;
    }

    /* Responsive adjustments */
    @media (max-width: 480px) {
      .filtro-seccion {
        padding: 16px;
      }
      
      .seccion-titulo {
        font-size: 15px;
      }
      
      .filtros-rapidos {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      
      .filtro-rapido-btn {
        padding: 12px 6px;
        font-size: 11px;
      }
      
      .modal-footer {
        padding: 12px 16px;
      }
    }

    /* Estilos para elementos de Angular Material en móvil */
    :host ::ng-deep {
      .mat-mdc-form-field {
        width: 100%;
      }
      
      .mat-mdc-select-panel {
        max-height: 300px;
      }
      
      .mat-mdc-slide-toggle {
        width: 100%;
      }
      
      .mat-mdc-slide-toggle .mdc-form-field {
        width: 100%;
      }
      
      .mat-mdc-slide-toggle .mdc-form-field > label {
        width: 100%;
        font-size: 14px;
      }
    }
  `]
})
export class FiltrosMobileModalComponent implements OnInit {
  filtrosForm: FormGroup;
  rangoFechasControl: any;
  
  // Opciones para selects
  tiposTramiteOpciones = TIPOS_TRAMITE_OPCIONES;
  estadosOpciones = ESTADOS_RESOLUCION_OPCIONES;
  
  // Señal para contador de filtros
  contadorFiltros = signal(0);

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
      soloActivos: [false],
      soloVigentes: [false]
    });
  }

  ngOnInit(): void {
    // Cargar filtros iniciales
    this.cargarFiltros(this.data.filtros);
    
    // Suscribirse a cambios para actualizar contador
    this.filtrosForm.valueChanges.subscribe(() => {
      this.actualizarContador();
    });
    
    this.rangoFechasControl.valueChanges.subscribe(() => {
      this.actualizarContador();
    });
    
    // Actualizar contador inicial
    this.actualizarContador();
  }

  private cargarFiltros(filtros: ResolucionFiltros): void {
    this.filtrosForm.patchValue({
      numeroResolucion: filtros.numeroResolucion || '',
      empresaId: filtros.empresaId || '',
      tiposTramite: filtros.tiposTramite || [],
      estados: filtros.estados || [],
      soloActivos: filtros.activo || false,
      soloVigentes: filtros.estados?.includes('VIGENTE') || false
    });

    // Cargar rango de fechas
    if (filtros.fechaInicio || filtros.fechaFin) {
      this.rangoFechasControl.setValue({
        inicio: filtros.fechaInicio || null,
        fin: filtros.fechaFin || null
      });
    }
  }

  private actualizarContador(): void {
    let contador = 0;
    const formValue = this.filtrosForm.value;
    const rangoFechas = this.rangoFechasControl.value;

    if (formValue.numeroResolucion?.trim()) contador++;
    if (formValue.empresaId) contador++;
    if (formValue.tiposTramite?.length > 0) contador++;
    if (formValue.estados?.length > 0) contador++;
    if (formValue.soloActivos) contador++;
    if (formValue.soloVigentes) contador++;
    if (rangoFechas?.inicio || rangoFechas?.fin) contador++;

    this.contadorFiltros.set(contador);
  }

  private obtenerFiltrosActuales(): ResolucionFiltros {
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
    
    // Combinar estados seleccionados con toggles
    const estados = [...(formValue.estados || [])];
    if (formValue.soloVigentes && !estados.includes('VIGENTE')) {
      estados.push('VIGENTE');
    }
    if (estados.length > 0) {
      filtros.estados = estados;
    }
    
    if (formValue.soloActivos) {
      filtros.activo = true;
    }
    
    if (rangoFechas?.inicio) {
      filtros.fechaInicio = rangoFechas.inicio;
    }
    
    if (rangoFechas?.fin) {
      filtros.fechaFin = rangoFechas.fin;
    }
    
    return filtros;
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  onEmpresaChange(empresaId: string): void {
    this.filtrosForm.patchValue({ empresaId });
  }

  onEmpresaSeleccionada(empresa: any): void {
    // El cambio se maneja automáticamente por el formulario
  }

  onRangoFechasChange(rango: RangoFechas): void {
    // El cambio se maneja automáticamente por el control
  }

  aplicarFiltroRapido(tipo: string): void {
    const hoy = new Date();
    
    switch (tipo) {
      case 'recientes':
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);
        this.rangoFechasControl.setValue({
          inicio: hace30Dias,
          fin: hoy
        });
        break;
      
      case 'proximos-vencer':
        const en30Dias = new Date();
        en30Dias.setDate(hoy.getDate() + 30);
        this.filtrosForm.patchValue({ soloVigentes: true });
        this.rangoFechasControl.setValue({
          inicio: hoy,
          fin: en30Dias
        });
        break;
      
      case 'vigentes':
        this.filtrosForm.patchValue({ soloVigentes: true });
        break;
      
      case 'activos':
        this.filtrosForm.patchValue({ soloActivos: true });
        break;
    }
  }

  limpiarTodo(): void {
    this.filtrosForm.reset({
      numeroResolucion: '',
      empresaId: '',
      tiposTramite: [],
      estados: [],
      soloActivos: false,
      soloVigentes: false
    });
    
    this.rangoFechasControl.reset();
  }

  aplicarFiltros(): void {
    const filtros = this.obtenerFiltrosActuales();
    this.dialogRef.close(filtros);
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}