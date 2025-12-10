import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ruta, TipoRuta, RutaCreate } from '../../models/ruta.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { RutaService } from '../../services/ruta.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { Subscription } from 'rxjs';

export interface CrearRutaModalData {
  empresa?: Empresa;
  resolucion?: Resolucion;
}

@Component({
  selector: 'app-crear-ruta-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="modal-container">
      <mat-card class="modal-card">
        <mat-card-header>
          <mat-card-title>CREAR NUEVA RUTA</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Paso 1: Selección de Empresa y Resolución -->
          @if (!empresaSeleccionada || !resolucionSeleccionada) {
            <div class="selection-step">
              <!-- Si ya hay empresa seleccionada, solo mostrar selección de resolución -->
              @if (empresaSeleccionada) {
                <h3>SELECCIONAR RESOLUCIÓN</h3>
                <div class="empresa-preseleccionada">
                  <h4>EMPRESA SELECCIONADA</h4>
                  <p><strong>RUC:</strong> {{ empresaSeleccionada.ruc }}</p>
                  <p><strong>RAZÓN SOCIAL:</strong> {{ empresaSeleccionada.razonSocial.principal || 'No disponible' }}</p>
                </div>
              } @else {
                <h3>SELECCIONAR EMPRESA Y RESOLUCIÓN</h3>
              }
              
              <!-- Selección de Empresa (solo si no hay empresa pre-seleccionada) -->
              @if (!empresaSeleccionada) {
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>EMPRESA *</mat-label>
                  <input matInput 
                         [matAutocomplete]="empresaAuto" 
                         [value]="empresaSearchValue"
                         (input)="onEmpresaSearchInput($event)"
                         placeholder="Buscar empresa por RUC o razón social"
                         required>
                  <mat-autocomplete #empresaAuto="matAutocomplete" 
                                   [displayWith]="displayEmpresa"
                                   (optionSelected)="onEmpresaSelected($event)">
                    @for (empresa of empresasFiltradas; track empresa.id) {
                      <mat-option [value]="empresa">
                        <div class="empresa-option">
                          <span class="empresa-ruc">{{ empresa.ruc }}</span>
                          <span class="empresa-razon">{{ empresa.razonSocial.principal || 'Sin razón social' }}</span>
                        </div>
                      </mat-option>
                    }
                  </mat-autocomplete>
                  <mat-icon matSuffix>business</mat-icon>
                  <mat-error *ngIf="!empresaSeleccionada && empresaSearchValue">
                    La empresa es obligatoria
                  </mat-error>
                </mat-form-field>
              }

              <!-- Selección de Resolución -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>RESOLUCIÓN *</mat-label>
                <input matInput 
                       [matAutocomplete]="resolucionAuto" 
                       [value]="resolucionSearchValue"
                       (input)="onResolucionSearchInput($event)"
                       placeholder="Buscar resolución por número"
                       required
                       [disabled]="!empresaSeleccionada">
                <mat-autocomplete #resolucionAuto="matAutocomplete" 
                                 [displayWith]="displayResolucion"
                                 (optionSelected)="onResolucionSelected($event)">
                  @for (resolucion of resolucionesFiltradas; track resolucion.id) {
                    <mat-option [value]="resolucion">
                      <div class="resolucion-option">
                        <span class="resolucion-numero">{{ resolucion.nroResolucion }}</span>
                        <span class="resolucion-tipo">{{ resolucion.tipoTramite }}</span>
                      </div>
                    </mat-option>
                  }
                </mat-autocomplete>
                <mat-icon matSuffix>description</mat-icon>
                <mat-error *ngIf="!resolucionSeleccionada && resolucionSearchValue">
                  La resolución es obligatoria
                </mat-error>
              </mat-form-field>

              <!-- Botón para continuar -->
              <div class="continue-button">
                <button mat-raised-button 
                        color="primary" 
                        [disabled]="!empresaSeleccionada || !resolucionSeleccionada"
                        (click)="continuarACrearRuta()">
                  <mat-icon>arrow_forward</mat-icon>
                  @if (empresaSeleccionada) {
                    CONTINUAR A CREAR RUTA
                  } @else {
                    CONTINUAR A CREAR RUTA
                  }
                </button>
              </div>
            </div>
          }

          <!-- Paso 2: Formulario de Ruta -->
          @if (empresaSeleccionada && resolucionSeleccionada) {
            <div class="ruta-form-step">
              <!-- Información de Empresa y Resolución Seleccionadas -->
              <div class="selected-info">
                <div class="info-card empresa">
                  <h4>EMPRESA SELECCIONADA</h4>
                  <p><strong>RUC:</strong> {{ empresaSeleccionada.ruc }}</p>
                  <p><strong>RAZÓN SOCIAL:</strong> {{ empresaSeleccionada.razonSocial.principal || 'No disponible' }}</p>
                </div>
                <div class="info-card resolucion">
                  <h4>RESOLUCIÓN SELECCIONADA</h4>
                  <p><strong>NÚMERO:</strong> {{ resolucionSeleccionada.nroResolucion }}</p>
                  <p><strong>TIPO:</strong> {{ resolucionSeleccionada.tipoTramite }}</p>
                </div>
              </div>

              <!-- Listado de Rutas Existentes -->
              @if (rutasExistentes.length > 0) {
                <div class="rutas-existentes">
                  <h4>RUTAS EXISTENTES EN ESTA RESOLUCIÓN</h4>
                  <div class="rutas-grid">
                    @for (ruta of rutasExistentes; track ruta.id) {
                      <div class="ruta-item">
                        <div class="ruta-codigo">{{ ruta.codigoRuta }}</div>
                        <div class="ruta-ruta">{{ ruta.origen }} → {{ ruta.destino }}</div>
                        <div class="ruta-frecuencias">{{ ruta.frecuencias }}</div>
                        <div class="ruta-tipo">{{ ruta.tipoRuta }}</div>
                        <div class="ruta-estado" [class]="'estado-' + ruta.estado.toLowerCase()">
                          {{ ruta.estado }}
                        </div>
                      </div>
                    }
                  </div>
                  <div class="ruta-info">
                    <mat-icon>info</mat-icon>
                    <span>Total de rutas: {{ rutasExistentes.length }}</span>
                    <span class="codigos-disponibles">
                      | Códigos disponibles: {{ obtenerCodigosDisponibles() }}
                    </span>
                  </div>
                </div>
              }

              <!-- Formulario de Ruta -->
              <form [formGroup]="rutaForm" (ngSubmit)="onSubmit()">
                <div class="form-grid">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>CÓDIGO DE RUTA *</mat-label>
                    <div class="codigo-ruta-container">
                      <input matInput 
                             formControlName="codigoRuta" 
                             placeholder="01, 02, 03... (2 dígitos)"
                             (input)="onCodigoRutaChange()"
                             (blur)="onCodigoRutaBlur()"
                             required>
                      <button mat-icon-button 
                              type="button" 
                              (click)="regenerarCodigoRuta()"
                              matTooltip="Regenerar código de ruta"
                              [disabled]="resolucionSeleccionada.id === 'general'">
                        <mat-icon>refresh</mat-icon>
                      </button>
                    </div>
                    <mat-hint>Código único de dos dígitos (01, 02, 03...) por resolución</mat-hint>
                    <mat-error *ngIf="rutaForm.get('codigoRuta')?.hasError('required')">
                      El código de ruta es obligatorio
                    </mat-error>
                    <mat-error *ngIf="rutaForm.get('codigoRuta')?.hasError('formatoInvalido')">
                      El código debe tener exactamente 2 dígitos (ej: 01, 02, 03...)
                    </mat-error>
                    <mat-error *ngIf="rutaForm.get('codigoRuta')?.hasError('rangoInvalido')">
                      El código debe estar entre 01 y 99
                    </mat-error>
                    <mat-error *ngIf="rutaForm.get('codigoRuta')?.hasError('codigoDuplicado')">
                      El código {{ rutaForm.get('codigoRuta')?.value }} ya existe en esta resolución
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>ORIGEN *</mat-label>
                    <input matInput 
                           formControlName="origen" 
                           placeholder="Ej: Puno"
                           required>
                    <mat-error *ngIf="rutaForm.get('origen')?.hasError('required')">
                      El origen es obligatorio
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>DESTINO *</mat-label>
                    <input matInput 
                           formControlName="destino" 
                           placeholder="Ej: Juliaca"
                           required>
                    <mat-error *ngIf="rutaForm.get('destino')?.hasError('required')">
                      El destino es obligatorio
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>FRECUENCIAS *</mat-label>
                    <input matInput 
                           formControlName="frecuencias" 
                           placeholder="Ej: Diaria, Semanal"
                           required>
                    <mat-error *ngIf="rutaForm.get('frecuencias')?.hasError('required')">
                      Las frecuencias son obligatorias
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>TIPO DE RUTA</mat-label>
                    <mat-select formControlName="tipoRuta">
                      <mat-option value="INTERPROVINCIAL">INTERPROVINCIAL</mat-option>
                      <mat-option value="INTERURBANA">INTERURBANA</mat-option>
                      <mat-option value="URBANA">URBANA</mat-option>
                      <mat-option value="NACIONAL">NACIONAL</mat-option>
                      <mat-option value="INTERNACIONAL">INTERNACIONAL</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field full-width">
                    <mat-label>OBSERVACIONES</mat-label>
                    <textarea matInput 
                              formControlName="observaciones"
                              placeholder="Observaciones adicionales sobre la ruta"
                              rows="3"></textarea>
                  </mat-form-field>
                </div>
              </form>
            </div>
          }
        </mat-card-content>

        <mat-dialog-actions align="end">
          <button mat-button mat-dialog-close>CANCELAR</button>
          @if (empresaSeleccionada && resolucionSeleccionada) {
            <button mat-raised-button 
                    color="primary" 
                    [disabled]="!rutaForm.valid || isSubmitting"
                    (click)="onSubmit()">
                          @if (isSubmitting) {
              <mat-spinner diameter="20"></mat-spinner>
              GUARDANDO...
            } @else {
              <ng-container>
                <mat-icon>save</mat-icon>
                CREAR RUTA
              </ng-container>
            }
            </button>
          }
        </mat-dialog-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .modal-container {
      padding: 20px;
      max-width: 800px;
    }

    .modal-card {
      width: 100%;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-field {
      width: 100%;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .codigo-ruta-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .codigo-ruta-container input {
      flex: 1;
    }

    .codigo-ruta-container button {
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
    
    /* Estilos para rutas existentes */
    .rutas-existentes {
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .rutas-existentes h4 {
      margin: 0 0 15px 0;
      color: #495057;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .rutas-existentes h4::before {
      content: "📋";
      font-size: 18px;
    }
    .rutas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    }
    .ruta-item {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 12px;
      display: grid;
      grid-template-columns: auto 1fr auto auto auto;
      gap: 10px;
      align-items: center;
      font-size: 13px;
    }
    .ruta-codigo {
      background: #007bff;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
      min-width: 30px;
      text-align: center;
    }
    .ruta-ruta {
      font-weight: 500;
      color: #495057;
    }
    .ruta-frecuencias {
      color: #6c757d;
      font-size: 12px;
    }
    .ruta-tipo {
      color: #6c757d;
      font-size: 12px;
      text-align: center;
    }
    .ruta-estado {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      text-align: center;
      min-width: 60px;
    }
    .estado-activa {
      background: #d4edda;
      color: #155724;
    }
    .estado-suspendida {
      background: #f8d7da;
      color: #721c24;
    }
    .estado-cancelada {
      background: #fff3cd;
      color: #856404;
    }
    .ruta-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6c757d;
      font-size: 13px;
      padding: 10px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }
    .codigos-disponibles {
      color: #28a745;
      font-weight: 500;
    }
    
    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .rutas-grid {
        grid-template-columns: 1fr;
      }
      .ruta-item {
        grid-template-columns: 1fr;
        gap: 5px;
        text-align: center;
      }
    }
  `]
})
export class CrearRutaModalComponent {
  private dialogRef = inject(MatDialogRef<CrearRutaModalComponent>);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private rutaService = inject(RutaService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  
  data = inject(MAT_DIALOG_DATA); // Hacer público para acceso en template

  // Estados de selección
  empresaSeleccionada: Empresa | null = null;
  resolucionSeleccionada: Resolucion | null = null;
  
  // Valores de búsqueda
  empresaSearchValue = '';
  resolucionSearchValue = '';
  
  // Listas filtradas
  empresasFiltradas: Empresa[] = [];
  resolucionesFiltradas: Resolucion[] = [];
  
  // Rutas existentes en la resolución seleccionada
  rutasExistentes: Ruta[] = [];

  rutaForm: FormGroup;
  isSubmitting = false;

  constructor() {
    this.rutaForm = this.fb.group({
      codigoRuta: ['', [Validators.required]],
      origen: ['', [Validators.required]],
      destino: ['', [Validators.required]],
      frecuencias: ['', [Validators.required]],
      tipoRuta: ['INTERPROVINCIAL'],
      observaciones: ['']
    });

    // Generar código de ruta automáticamente
    this.generarCodigoRutaAutomatico();
    
    // Cargar datos iniciales
    this.cargarEmpresas();
    
    // Configurar validación inicial del código de ruta
    this.configurarValidacionCodigoRuta();
  }

  ngOnInit(): void {
    // Verificar si ya hay empresa pre-seleccionada desde el contexto
    if (this.data.empresa) {
      this.empresaSeleccionada = this.data.empresa;
      this.empresaSearchValue = this.displayEmpresa(this.data.empresa);
      // Cargar resoluciones de esta empresa
      this.cargarResoluciones(this.data.empresa.id);
    }
    
    // Verificar si ya hay resolución pre-seleccionada
    if (this.data.resolucion) {
      this.resolucionSeleccionada = this.data.resolucion;
      this.resolucionSearchValue = this.displayResolucion(this.data.resolucion);
      // Cargar rutas existentes en esta resolución
      this.cargarRutasExistentes(this.data.resolucion.id);
    }
    
    // Generar código de ruta automáticamente
    this.generarCodigoRutaAutomatico();
  }

  private generarCodigoRutaAutomatico(): void {
    if (this.resolucionSeleccionada && this.resolucionSeleccionada.id !== 'general') {
      // Generar código automático único
      const codigoUnico = this.generarCodigoUnico();
      this.rutaForm.patchValue({ codigoRuta: codigoUnico });
    }
  }

  // Generar código único automáticamente
  private generarCodigoUnico(): string {
    if (this.rutasExistentes.length === 0) {
      return '01';
    }
    
    // Obtener todos los códigos existentes
    const codigosExistentes = this.rutasExistentes.map(ruta => 
      parseInt(ruta.codigoRuta.toString())
    ).sort((a, b) => a - b);
    
    // Buscar el primer código disponible
    let codigoDisponible = 1;
    for (const codigo of codigosExistentes) {
      if (codigo === codigoDisponible) {
        codigoDisponible++;
      } else {
        break;
      }
    }
    
    // Formatear a dos dígitos
    return codigoDisponible.toString().padStart(2, '0');
  }

  regenerarCodigoRuta(): void {
    this.generarCodigoRutaAutomatico();
  }

  onSubmit(): void {
    if (this.rutaForm.valid) {
      this.isSubmitting = true;
      
      const nuevaRuta: Partial<Ruta> = {
        ...this.rutaForm.value,
        empresaId: this.empresaSeleccionada?.id,
        resolucionId: this.resolucionSeleccionada?.id,
        estado: 'ACTIVA',
        estaActivo: true,
        fechaRegistro: new Date(),
        fechaActualizacion: new Date()
      };

      // Usar el servicio para crear la ruta
      this.rutaService.createRuta(nuevaRuta as RutaCreate)
        .subscribe({
          next: (rutaGuardada: any) => {
            this.snackBar.open('Ruta creada exitosamente', 'Cerrar', { duration: 3000 });
            this.dialogRef.close(rutaGuardada);
          },
          error: (error: any) => {
            this.snackBar.open('Error al crear la ruta', 'Cerrar', { duration: 3000 });
            this.isSubmitting = false;
          }
        });
    }
  }

  // Métodos para selección de empresa
  onEmpresaSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.empresaSearchValue = value;
    this.filtrarEmpresas(value);
  }

  onEmpresaSelected(event: any): void {
    const empresa = event.option.value;
    this.empresaSeleccionada = empresa;
    this.empresaSearchValue = this.displayEmpresa(empresa);
    this.resolucionSeleccionada = null;
    this.resolucionSearchValue = '';
    this.cargarResoluciones(empresa.id);
  }

  displayEmpresa(empresa: Empresa): string {
    return empresa ? `${empresa.ruc} - ${empresa.razonSocial?.principal || 'Sin razón social'}` : '';
  }

  // Métodos para selección de resolución
  onResolucionSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.resolucionSearchValue = value;
    this.filtrarResoluciones(value);
  }

  onResolucionSelected(event: any): void {
    const resolucion = event.option.value;
    this.resolucionSeleccionada = resolucion;
    this.resolucionSearchValue = this.displayResolucion(resolucion);
    
    // Cargar rutas existentes en esta resolución
    this.cargarRutasExistentes(resolucion.id);
  }

  displayResolucion(resolucion: Resolucion): string {
    return resolucion ? `${resolucion.nroResolucion} - ${resolucion.tipoTramite}` : '';
  }

  // Método para continuar al formulario
  continuarACrearRuta(): void {
    if (this.empresaSeleccionada && this.resolucionSeleccionada) {
      this.generarCodigoRutaAutomatico();
      // Actualizar validación del código de ruta
      this.actualizarValidacionCodigoRuta();
    }
  }

  // Validar código de ruta en tiempo real
  onCodigoRutaChange(): void {
    const codigoControl = this.rutaForm.get('codigoRuta');
    if (codigoControl) {
      // Formatear automáticamente a 2 dígitos
      this.formatearCodigoRuta(codigoControl);
      // Validar el código
      codigoControl.updateValueAndValidity();
    }
  }

  // Validar código de ruta cuando se sale del campo
  onCodigoRutaBlur(): void {
    const codigoControl = this.rutaForm.get('codigoRuta');
    if (codigoControl) {
      // Formatear final y validar
      this.formatearCodigoRuta(codigoControl);
      codigoControl.updateValueAndValidity();
    }
  }

  // Formatear código de ruta a 2 dígitos
  private formatearCodigoRuta(control: any): void {
    let valor = control.value?.toString() || '';
    
    // Remover caracteres no numéricos
    valor = valor.replace(/\D/g, '');
    
    // Limitar a máximo 2 dígitos
    if (valor.length > 2) {
      valor = valor.substring(0, 2);
    }
    
    // Formatear a 2 dígitos con cero a la izquierda si es necesario
    if (valor.length === 1 && valor !== '0') {
      valor = '0' + valor;
    }
    
    // Solo actualizar si el valor cambió
    if (control.value !== valor) {
      control.setValue(valor, { emitEvent: false });
    }
  }

  // Obtener códigos disponibles para mostrar al usuario
  obtenerCodigosDisponibles(): string {
    if (this.rutasExistentes.length === 0) {
      return '01, 02, 03...';
    }
    
    const codigosExistentes = this.rutasExistentes.map(ruta => 
      parseInt(ruta.codigoRuta.toString())
    ).sort((a, b) => a - b);
    
    const codigosDisponibles: string[] = [];
    let codigoActual = 1;
    
    // Buscar códigos disponibles hasta el 99
    while (codigoActual <= 99) {
      if (!codigosExistentes.includes(codigoActual)) {
        codigosDisponibles.push(codigoActual.toString().padStart(2, '0'));
      }
      codigoActual++;
    }
    
    // Mostrar solo los primeros 5 códigos disponibles
    return codigosDisponibles.slice(0, 5).join(', ') + 
           (codigosDisponibles.length > 5 ? '...' : '');
  }

  // Métodos privados
  private cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe((empresas: Empresa[]) => {
      this.empresasFiltradas = empresas.filter((e: Empresa) => e.estado === 'HABILITADA');
    });
  }

  private cargarResoluciones(empresaId: string): void {
    this.resolucionService.getResoluciones().subscribe((resoluciones: Resolucion[]) => {
      this.resolucionesFiltradas = resoluciones.filter((r: Resolucion) => r.empresaId === empresaId);
    });
  }

  private filtrarEmpresas(value: string): void {
    if (!value) {
      this.empresasFiltradas = [];
      return;
    }
    
    const filterValue = value.toLowerCase();
    this.empresaService.getEmpresas().subscribe((empresas: Empresa[]) => {
      this.empresasFiltradas = empresas.filter((empresa: Empresa) => 
        empresa.estado === 'HABILITADA' && (
          empresa.ruc.toLowerCase().includes(filterValue) ||
          (empresa.razonSocial?.principal || '').toLowerCase().includes(filterValue)
        )
      );
    });
  }

  private filtrarResoluciones(value: string): void {
    if (!value || !this.empresaSeleccionada) {
      this.resolucionesFiltradas = [];
      return;
    }
    
    const filterValue = value.toLowerCase();
    this.resolucionService.getResoluciones().subscribe((resoluciones: Resolucion[]) => {
      this.resolucionesFiltradas = resoluciones.filter((resolucion: Resolucion) => 
        resolucion.empresaId === this.empresaSeleccionada!.id &&
        resolucion.nroResolucion.toLowerCase().includes(filterValue)
      );
    });
  }

  private cargarRutasExistentes(resolucionId: string): void {
    this.rutaService.getRutas().subscribe((rutas: Ruta[]) => {
      this.rutasExistentes = rutas.filter((ruta: Ruta) => 
        ruta.resolucionId === resolucionId
      );
      
      // Actualizar validación del código de ruta
      this.actualizarValidacionCodigoRuta();
    });
  }

  // Validación personalizada para código único de ruta
  private validarCodigoUnico(control: any): { [key: string]: any } | null {
    if (!control.value || !this.resolucionSeleccionada) {
      return null;
    }
    
    const codigoIngresado = control.value.toString().trim();
    
    // Validar formato de 2 dígitos
    if (!/^\d{2}$/.test(codigoIngresado)) {
      return { 'formatoInvalido': { value: codigoIngresado } };
    }
    
    // Validar que sea un número entre 01 y 99
    const numero = parseInt(codigoIngresado);
    if (numero < 1 || numero > 99) {
      return { 'rangoInvalido': { value: codigoIngresado } };
    }
    
    const codigoExiste = this.rutasExistentes.some(ruta => 
      ruta.codigoRuta.toString().trim() === codigoIngresado
    );
    
    if (codigoExiste) {
      return { 'codigoDuplicado': { value: codigoIngresado } };
    }
    
    return null;
  }

  // Actualizar validación del código de ruta
  private actualizarValidacionCodigoRuta(): void {
    const codigoControl = this.rutaForm.get('codigoRuta');
    if (codigoControl) {
      codigoControl.setValidators([
        Validators.required,
        this.validarCodigoUnico.bind(this)
      ]);
      codigoControl.updateValueAndValidity();
    }
  }

  // Configurar validación inicial del código de ruta
  private configurarValidacionCodigoRuta(): void {
    const codigoControl = this.rutaForm.get('codigoRuta');
    if (codigoControl) {
      // Agregar listener para formateo automático
      codigoControl.valueChanges.subscribe(() => {
        this.formatearCodigoRuta(codigoControl);
      });
    }
  }
} 