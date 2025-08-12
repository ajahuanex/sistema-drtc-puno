import { Component, inject, signal, computed, ChangeDetectionStrategy, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ResolucionService } from '../../services/resolucion.service';
import { EmpresaService } from '../../services/empresa.service';
import { ExpedienteService } from '../../services/expediente.service';
import { ResolucionCreate, TipoTramite, TipoResolucion, Resolucion } from '../../models/resolucion.model';
import { Empresa } from '../../models/empresa.model';
import { Expediente, ExpedienteCreate } from '../../models/expediente.model';

@Component({
  selector: 'app-crear-resolucion-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>CREAR NUEVA RESOLUCIÓN</h2>
      <button mat-icon-button mat-dialog-close class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>CREANDO RESOLUCIÓN...</p>
        </div>
      } @else {
        <form [formGroup]="resolucionForm" class="resolucion-form">
          <div class="form-grid">
            <!-- Información de la Empresa (cuando se abre desde detalles) -->
            @if (!mostrarSelectorEmpresa()) {
              <div class="empresa-info-card">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>business</mat-icon>
                      EMPRESA SELECCIONADA
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="empresa-details">
                      <div class="empresa-item">
                        <span class="label">RUC:</span>
                        <span class="value">{{ empresaSeleccionada()?.ruc }}</span>
                      </div>
                      <div class="empresa-item">
                        <span class="label">RAZÓN SOCIAL:</span>
                        <span class="value">{{ empresaSeleccionada()?.razonSocial.principal | uppercase }}</span>
                      </div>
                      <div class="empresa-item">
                        <span class="label">ESTADO:</span>
                        <span class="value estado-chip" [class]="'estado-' + empresaSeleccionada()?.estado?.toLowerCase()">
                          {{ empresaSeleccionada()?.estado | uppercase }}
                        </span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            } @else {
              <!-- Campo de selección de empresa (cuando se abre desde otra vista) -->
              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>EMPRESA</mat-label>
                <mat-select formControlName="empresaId" required>
                  @for (empresa of empresas(); track empresa.id) {
                    <mat-option [value]="empresa.id">{{ empresa.razonSocial.principal | uppercase }}</mat-option>
                  }
                </mat-select>
                @if (resolucionForm.get('empresaId')?.hasError('required') && resolucionForm.get('empresaId')?.touched) {
                  <mat-error>LA EMPRESA ES REQUERIDA</mat-error>
                }
              </mat-form-field>
            }

            <!-- Selector de Expediente -->
            @if (mostrarSelectorExpediente()) {
              <div class="expediente-section full-width">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>EXPEDIENTE</mat-label>
                  <mat-select formControlName="expedienteId" required>
                    <mat-option value="">SELECCIONE UN EXPEDIENTE</mat-option>
                    @for (expediente of expedientesFiltrados(); track expediente.id) {
                      <mat-option [value]="expediente.id">
                        {{ expediente.nroExpediente }} - {{ expediente.descripcion || 'Sin descripción' }}
                        @if (expediente.estado) {
                          ({{ expediente.estado }})
                        }
                      </mat-option>
                    }
                  </mat-select>
                  <mat-hint>
                    SELECCIONE UN EXPEDIENTE EXISTENTE O DEJE VACÍO PARA CREAR UNO AUTOMÁTICAMENTE
                  </mat-hint>
                  @if (resolucionForm.get('expedienteId')?.hasError('required') && resolucionForm.get('expedienteId')?.touched) {
                    <mat-error>EL EXPEDIENTE ES REQUERIDO</mat-error>
                  }
                </mat-form-field>
                
                <button 
                  mat-stroked-button 
                  type="button" 
                  color="accent" 
                  (click)="crearExpedienteManual()"
                  class="create-expediente-button">
                  <mat-icon>add</mat-icon>
                  NUEVO EXPEDIENTE
                </button>
              </div>
            }

            <!-- Número de Resolución -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>NÚMERO DE RESOLUCIÓN</mat-label>
              <input matInput 
                     formControlName="numeroBase" 
                     placeholder="0001" 
                     maxlength="4"
                     class="numero-input"
                     (input)="onNumeroBaseChange()"
                     (blur)="onNumeroBaseBlur()"
                     required>
              <mat-hint>{{ numeroResolucionCompleto() }}</mat-hint>
              @if (resolucionForm.get('numeroBase')?.hasError('required') && resolucionForm.get('numeroBase')?.touched) {
                <mat-error>EL NÚMERO DE RESOLUCIÓN ES REQUERIDO</mat-error>
              }
              @if (resolucionForm.get('numeroBase')?.hasError('pattern') && resolucionForm.get('numeroBase')?.touched) {
                <mat-error>SOLO SE PERMITEN 4 DÍGITOS</mat-error>
              }
              @if (resolucionForm.get('numeroBase')?.hasError('duplicate') && resolucionForm.get('numeroBase')?.touched) {
                <mat-error>ESTE NÚMERO YA EXISTE PARA EL AÑO {{ anioEmision() }}</mat-error>
              }
            </mat-form-field>

            <!-- Tipo de Trámite -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>TIPO DE TRÁMITE</mat-label>
              <mat-select formControlName="tipoTramite" required (selectionChange)="onTipoTramiteChange()">
                <mat-option value="AUTORIZACION NUEVA">AUTORIZACIÓN NUEVA</mat-option>
                <mat-option value="RENOVACION">RENOVACIÓN</mat-option>
                <mat-option value="INCREMENTO">INCREMENTO</mat-option>
                <mat-option value="SUSTITUCION">SUSTITUCIÓN</mat-option>
                <mat-option value="OTROS">OTROS</mat-option>
              </mat-select>
              @if (resolucionForm.get('tipoTramite')?.hasError('required') && resolucionForm.get('tipoTramite')?.touched) {
                <mat-error>EL TIPO DE TRÁMITE ES REQUERIDO</mat-error>
              }
            </mat-form-field>

            <!-- Resolución Padre (solo para RENOVACIÓN) -->
            @if (mostrarResolucionPadre()) {
              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>RESOLUCIÓN PADRE A RENOVAR</mat-label>
                <mat-select formControlName="resolucionPadreId" required (selectionChange)="onResolucionPadreChange()">
                  <mat-option value="">SELECCIONE LA RESOLUCIÓN PADRE</mat-option>
                  @for (resolucion of resolucionesPadre(); track resolucion.id) {
                    <mat-option [value]="resolucion.id">
                      {{ resolucion.nroResolucion }} - {{ resolucion.descripcion || 'Sin descripción' }}
                      @if (resolucion.fechaVigenciaFin) {
                        (Vence: {{ formatearFechaLima(resolucion.fechaVigenciaFin) }})
                      }
                    </mat-option>
                  }
                </mat-select>
                @if (resolucionForm.get('resolucionPadreId')?.hasError('required') && resolucionForm.get('resolucionPadreId')?.touched) {
                  <mat-error>DEBE SELECCIONAR LA RESOLUCIÓN PADRE</mat-error>
                }
              </mat-form-field>
            }

            <!-- Fecha de Emisión -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>FECHA DE EMISIÓN</mat-label>
              <input matInput 
                     [matDatepicker]="pickerEmision" 
                     formControlName="fechaEmision" 
                     required 
                     (dateChange)="onFechaEmisionChange()"
                     placeholder="dd/mm/aaaa">
              <mat-datepicker-toggle matIconSuffix [for]="pickerEmision"></mat-datepicker-toggle>
              <mat-datepicker #pickerEmision></mat-datepicker>


              @if (resolucionForm.get('fechaEmision')?.hasError('required') && resolucionForm.get('fechaEmision')?.touched) {
                <mat-error>LA FECHA DE EMISIÓN ES REQUERIDA</mat-error>
              }
            </mat-form-field>

            <!-- Fecha de Vigencia de Inicio -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>FECHA DE VIGENCIA DE INICIO</mat-label>
              <input matInput 
                     [matDatepicker]="pickerVigenciaInicio" 
                     formControlName="fechaVigenciaInicio" 
                     (dateChange)="onVigenciaChange()"
                     placeholder="dd/mm/aaaa">
              <mat-datepicker-toggle matIconSuffix [for]="pickerVigenciaInicio"></mat-datepicker-toggle>
              <mat-datepicker #pickerVigenciaInicio></mat-datepicker>

            </mat-form-field>

            <!-- Años de Vigencia -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>AÑOS DE VIGENCIA</mat-label>
              <input matInput 
                     type="number" 
                     formControlName="aniosVigencia" 
                     placeholder="5"
                     min="1" 
                     max="20"
                     (input)="onVigenciaChange()">


              @if (resolucionForm.get('aniosVigencia')?.hasError('min') && resolucionForm.get('aniosVigencia')?.touched) {
                <mat-error>MÍNIMO 1 AÑO</mat-error>
              }
              @if (resolucionForm.get('aniosVigencia')?.hasError('max') && resolucionForm.get('aniosVigencia')?.touched) {
                <mat-error>MÁXIMO 20 AÑOS</mat-error>
              }
            </mat-form-field>

            <!-- Fecha de Vigencia Fin (Calculada) -->
            <mat-form-field appearance="outline" class="form-field" [class.disabled-field]="!mostrarFechaVigenciaFin()">
              <mat-label>FECHA DE VIGENCIA FIN (CALCULADA)</mat-label>
              <input matInput [value]="fechaVigenciaFinCalculada()" readonly>
              <mat-icon matSuffix>schedule</mat-icon>


            </mat-form-field>

            <!-- Descripción -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>DESCRIPCIÓN</mat-label>
              <textarea matInput formControlName="descripcion" rows="3" placeholder="DESCRIPCIÓN DE LA RESOLUCIÓN"></textarea>
            </mat-form-field>

            <!-- Observaciones -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>OBSERVACIONES</mat-label>
              <textarea matInput formControlName="observaciones" rows="2" placeholder="OBSERVACIONES ADICIONALES"></textarea>
            </mat-form-field>

            <!-- Información de la Resolución -->
            <div class="info-resolucion full-width">
              <h3>INFORMACIÓN DE LA RESOLUCIÓN</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">TIPO DE RESOLUCIÓN:</span>
                  <span class="info-value">{{ tipoResolucionCalculado() }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">ESTADO:</span>
                  <span class="info-value">VIGENTE</span>
                </div>
                <div class="info-item">
                  <span class="info-label">NÚMERO COMPLETO:</span>
                  <span class="info-value">{{ numeroResolucionCompleto() }}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      }
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button mat-button mat-dialog-close [disabled]="isLoading()">CANCELAR</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="crearResolucion()" 
        [disabled]="resolucionForm.invalid || isLoading()"
        class="create-button">
        @if (isLoading()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <mat-icon>add</mat-icon>
        }
        CREAR RESOLUCIÓN
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      margin: 0;
      color: #1976d2;
      font-size: 1.5rem;
      text-transform: uppercase;
      font-weight: 600;
    }

    .close-button {
      color: #666;
    }

    .modal-content {
      padding: 24px;
      min-width: 700px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
      text-transform: uppercase;
      font-weight: 500;
    }

    .resolucion-form {
      width: 100%;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-field {
      width: 100%;
    }

    /* Reducir altura de los inputs */
    .form-field ::ng-deep .mat-mdc-form-field-infix {
      padding-top: 8px !important;
      padding-bottom: 8px !important;
      min-height: 32px !important;
    }

    .form-field ::ng-deep .mat-mdc-text-field-wrapper {
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }

    .form-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      height: 16px !important;
    }

    /* Ajustar altura de textareas */
    .form-field textarea {
      min-height: 60px !important;
      max-height: 120px !important;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .empresa-info-card {
      grid-column: 1 / -1;
      margin-bottom: 16px;
    }

    .empresa-info-card .mat-card {
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
    }

    .empresa-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .empresa-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }

    .empresa-item:last-child {
      border-bottom: none;
    }

    .expediente-section {
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }

    .expediente-section .form-field {
      flex: 1;
    }

    .create-expediente-button {
      height: 56px;
      min-width: 140px;
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .empresa-item .label {
      font-weight: 600;
      color: #495057;
      font-size: 14px;
    }

    .empresa-item .value {
      color: #6c757d;
      font-weight: 500;
      font-size: 14px;
    }

    .estado-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .estado-habilitada {
      background-color: #d4edda;
      color: #155724;
    }

    .estado-en_tramite {
      background-color: #fff3cd;
      color: #856404;
    }

    .estado-suspendida {
      background-color: #f8d7da;
      color: #721c24;
    }

    .estado-cancelada {
      background-color: #e2e3e5;
      color: #383d41;
    }

    .disabled-field {
      opacity: 0.6;
      pointer-events: none;
    }

    /* Estilos para el número de resolución */
    .numero-input {
      text-align: center;
      font-weight: 600;
      color: #2c3e50;
      min-width: 80px;
      max-width: 120px;
    }



    /* Información de la resolución */
    .info-resolucion {
      margin-top: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-radius: 12px;
      border: 2px solid #2196f3;
    }

    .info-resolucion h3 {
      margin: 0 0 16px 0;
      color: #1976d2;
      text-transform: uppercase;
      font-weight: 700;
      text-align: center;
      font-size: 16px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 8px;
      border: 1px solid #2196f3;
    }

    .info-label {
      font-weight: 600;
      color: #1976d2;
      text-transform: uppercase;
      font-size: 12px;
    }

    .info-value {
      font-weight: 700;
      color: #2c3e50;
      text-transform: uppercase;
      font-size: 14px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }

    .create-button {
      min-width: 140px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .create-button mat-spinner {
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .modal-content {
        min-width: 400px;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
      }

      .numero-resolucion-container {
        flex-direction: column;
        gap: 8px;
        align-items: center;
      }

      .numero-input {
        min-width: 80px;
        max-width: 120px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CrearResolucionModalComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private resolucionService = inject(ResolucionService);
  private empresaService = inject(EmpresaService);
  private expedienteService = inject(ExpedienteService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CrearResolucionModalComponent>);
  private data = inject(MAT_DIALOG_DATA);

  // Subject para manejo de cleanup
  private destroy$ = new Subject<void>();

  // Signals
  isLoading = signal(false);
  empresas = signal<Empresa[]>([]);
  resolucionesPadre = signal<Resolucion[]>([]);
  expedientes = signal<Expediente[]>([]);
  expedientesFiltrados = signal<Expediente[]>([]);
  
  // Detectar si se está abriendo desde detalles de empresa
  empresaSeleccionada = computed(() => {
    return this.data?.empresa || null;
  });
  
  // Determinar si mostrar selector de empresa o información
  mostrarSelectorEmpresa = computed(() => {
    return !this.empresaSeleccionada();
  });
  
  // Determinar si mostrar selector de resolución padre
  mostrarResolucionPadre = computed(() => {
    const tipoTramite = this.tipoTramiteSignal();
    return tipoTramite === 'RENOVACION';
  });

  // Determinar si mostrar selector de expediente
  mostrarSelectorExpediente = computed(() => {
    return !this.data?.esResolucionHija; // Solo mostrar para resoluciones principales
  });

  // Signals para reactividad del formulario
  numeroBaseSignal = signal('');
  fechaEmisionSignal = signal<Date>(new Date());
  tipoTramiteSignal = signal('AUTORIZACION NUEVA');
  fechaVigenciaInicioSignal = signal<Date | null>(null);
  aniosVigenciaSignal = signal(5);

  // Computed properties
  anioActual = computed(() => new Date().getFullYear());
  anioEmision = computed(() => {
    const fechaEmision = this.fechaEmisionSignal();
    return fechaEmision ? new Date(fechaEmision).getFullYear() : this.anioActual();
  });
  numeroResolucionCompleto = computed(() => {
    const numeroBase = this.numeroBaseSignal();
    const anio = this.anioEmision();
    
    console.log('🔍 Debug numeroResolucionCompleto:', { numeroBase, anio });
    
    if (numeroBase) {
      // Asegurar que siempre tenga 4 dígitos con ceros por delante
      const numeroFormateado = numeroBase.toString().padStart(4, '0');
      const resultado = `R-${numeroFormateado}-${anio}`;
      console.log('✅ Número formateado:', resultado);
      return resultado;
    }
    const resultado = `R-0000-${anio}`;
    console.log('❌ Número por defecto:', resultado);
    return resultado;
  });

  mostrarFechaVigenciaFin = computed(() => {
    const tipoTramite = this.tipoTramiteSignal();
    return tipoTramite === 'AUTORIZACION NUEVA' || tipoTramite === 'RENOVACION';
  });

  fechaVigenciaFinCalculada = computed(() => {
    const fechaInicio = this.fechaVigenciaInicioSignal();
    const aniosVigencia = this.aniosVigenciaSignal();
    
    console.log('🔍 Debug fechaVigenciaFinCalculada:', {
      fechaInicio,
      aniosVigencia,
      mostrarFechaVigenciaFin: this.mostrarFechaVigenciaFin(),
      tipoTramite: this.tipoTramiteSignal()
    });
    
    if (fechaInicio && aniosVigencia && this.mostrarFechaVigenciaFin()) {
      try {
        const fechaFin = new Date(fechaInicio);
        fechaFin.setFullYear(fechaFin.getFullYear() + parseInt(aniosVigencia.toString()));
        
        // Formatear en español con formato "13 de Agosto de 2025"
        const resultado = this.formatearFechaEspanol(fechaFin);
        console.log('✅ Fecha calculada (Español):', resultado);
        return resultado;
      } catch (error) {
        console.error('❌ Error calculando fecha de vigencia fin:', error);
        return 'ERROR EN CÁLCULO';
      }
    }
    console.log('❌ No se puede calcular:', { fechaInicio, aniosVigencia, mostrarFechaVigenciaFin: this.mostrarFechaVigenciaFin() });
    return 'NO DISPONIBLE';
  });

  tipoResolucionCalculado = computed(() => {
    const tipoTramite = this.tipoTramiteSignal();
    if (tipoTramite === 'AUTORIZACION NUEVA' || tipoTramite === 'RENOVACION') {
      return 'PADRE';
    }
    return 'HIJO';
  });

  /**
   * Formatea una fecha en zona horaria de Lima (UTC-5) con formato DD/MM/YYYY
   */
  formatearFechaLima(fecha: Date | string | null): string {
    if (!fecha) return 'NO DISPONIBLE';
    
    try {
      const fechaObj = new Date(fecha);
      
      // Ajustar a zona horaria de Lima (UTC-5)
      const fechaLima = new Date(fechaObj.getTime() - (5 * 60 * 60 * 1000));
      
      // Formatear como DD/MM/YYYY usando locale español
      const dia = fechaLima.getUTCDate().toString().padStart(2, '0');
      const mes = (fechaLima.getUTCMonth() + 1).toString().padStart(2, '0');
      const anio = fechaLima.getUTCFullYear();
      
      // Asegurar formato español DD/MM/YYYY
      return `${dia}/${mes}/${anio}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'ERROR EN FECHA';
    }
  }

  /**
   * Obtiene la fecha actual en zona horaria de Lima
   */
  private obtenerFechaLima(): Date {
    const ahora = new Date();
    // Ajustar a zona horaria de Lima (UTC-5)
    return new Date(ahora.getTime() - (5 * 60 * 60 * 1000));
  }

  /**
   * Obtiene la fecha actual formateada en zona horaria de Lima
   */
  fechaActualLima(): string {
    return this.formatearFechaLima(new Date());
  }

  /**
   * Formatea una fecha en español con formato "13 de Agosto de 2025"
   */
  formatearFechaEspanol(fecha: Date | string | null): string {
    if (!fecha) return 'NO DISPONIBLE';
    
    try {
      const fechaObj = new Date(fecha);
      
      // Ajustar a zona horaria de Lima (UTC-5)
      const fechaLima = new Date(fechaObj.getTime() - (5 * 60 * 60 * 1000));
      
      // Meses en español
      const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      
      const dia = fechaLima.getUTCDate();
      const mes = meses[fechaLima.getUTCMonth()];
      const anio = fechaLima.getUTCFullYear();
      
      return `${dia} de ${mes} de ${anio}`;
    } catch (error) {
      console.error('Error formateando fecha en español:', error);
      return 'ERROR EN FECHA';
    }
  }

  resolucionForm: FormGroup;

  constructor() {
    // Registrar locale español para fechas
    registerLocaleData(localeEs, 'es');
    
    console.log('🚀 Modal inicializado con datos:', this.data);
    console.log('🏢 Empresa seleccionada:', this.data?.empresa);
    console.log('🆔 Empresa ID:', this.data?.empresa?.id);
    
    this.resolucionForm = this.fb.group({
      empresaId: [this.data?.empresa?.id || '', [Validators.required]],
      expedienteId: ['', [Validators.required]], // Campo para expediente
      numeroBase: ['', [Validators.required, Validators.pattern(/^\d{1,4}$/)]],
      tipoTramite: [this.data?.esResolucionHija ? 'INCREMENTO' : 'AUTORIZACION NUEVA', [Validators.required]],
      resolucionPadreId: [this.data?.resolucionPadreId || null], // Campo para resolución padre
      fechaEmision: [this.obtenerFechaLima(), [Validators.required]],
      fechaVigenciaInicio: [null],
      aniosVigencia: [5, [Validators.min(1), Validators.max(20)]],
      descripcion: [''],
      observaciones: ['']
    });

    // Si es resolución hija, configurar automáticamente
    if (this.data?.esResolucionHija) {
      this.tipoTramiteSignal.set('INCREMENTO');
      // Deshabilitar campos de vigencia para resoluciones hijas
      this.resolucionForm.get('fechaVigenciaInicio')?.disable();
      this.resolucionForm.get('aniosVigencia')?.disable();
    }

    // Solo cargar empresas si no hay una empresa seleccionada
    if (!this.data?.empresa) {
      this.cargarEmpresas();
    }

    // Cargar expedientes de la empresa
    if (this.data?.empresa?.id) {
      this.cargarExpedientesEmpresa(this.data.empresa.id);
    }

    // Effects para sincronizar signals con el formulario
    this.setupFormEffects();
  }

  private setupFormEffects(): void {
    // Effect para sincronizar numeroBase
    effect(() => {
      const numeroBase = this.numeroBaseSignal();
      if (numeroBase !== this.resolucionForm.get('numeroBase')?.value) {
        this.resolucionForm.get('numeroBase')?.setValue(numeroBase, { emitEvent: false });
      }
    });

    // Effect para sincronizar fechaEmision
    effect(() => {
      const fechaEmision = this.fechaEmisionSignal();
      if (fechaEmision !== this.resolucionForm.get('fechaEmision')?.value) {
        this.resolucionForm.get('fechaEmision')?.setValue(fechaEmision, { emitEvent: false });
      }
    });

    // Effect para sincronizar tipoTramite
    effect(() => {
      const tipoTramite = this.tipoTramiteSignal();
      if (tipoTramite !== this.resolucionForm.get('tipoTramite')?.value) {
        this.resolucionForm.get('tipoTramite')?.setValue(tipoTramite, { emitEvent: false });
      }
    });

    // Effect para sincronizar fechaVigenciaInicio
    effect(() => {
      const fechaVigenciaInicio = this.fechaVigenciaInicioSignal();
      if (fechaVigenciaInicio !== this.resolucionForm.get('fechaVigenciaInicio')?.value) {
        this.resolucionForm.get('fechaVigenciaInicio')?.setValue(fechaVigenciaInicio, { emitEvent: false });
      }
    });

    // Effect para sincronizar aniosVigencia
    effect(() => {
      const aniosVigencia = this.aniosVigenciaSignal();
      if (aniosVigencia !== this.resolucionForm.get('aniosVigencia')?.value) {
        this.resolucionForm.get('aniosVigencia')?.setValue(aniosVigencia, { emitEvent: false });
      }
    });
  }



  private cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);
      },
      error: (error) => {
        console.error('ERROR CARGANDO EMPRESAS:', error);
        this.snackBar.open('ERROR AL CARGAR EMPRESAS', 'CERRAR', {
          duration: 3000
        });
      }
    });
  }

  private cargarExpedientesEmpresa(empresaId: string): void {
    console.log('📋 Cargando expedientes para empresa:', empresaId);
    
    this.expedienteService.getExpedientes().subscribe({
      next: (expedientes) => {
        console.log('📋 Expedientes cargados:', expedientes);
        // Filtrar expedientes de la empresa específica
        const expedientesEmpresa = expedientes.filter(e => e.empresaId === empresaId);
        this.expedientes.set(expedientesEmpresa);
        this.expedientesFiltrados.set(expedientesEmpresa);
      },
      error: (error) => {
        console.error('ERROR CARGANDO EXPEDIENTES:', error);
        this.snackBar.open('ERROR AL CARGAR EXPEDIENTES', 'CERRAR', {
          duration: 3000
        });
      }
    });
  }

  private async crearExpedienteAutomatico(): Promise<string | null> {
    try {
      const empresaId = this.data?.empresa?.id || this.resolucionForm.get('empresaId')?.value;
      const tipoTramite = this.resolucionForm.get('tipoTramite')?.value;
      const descripcion = this.resolucionForm.get('descripcion')?.value || 'Expediente creado automáticamente para resolución';
      
      // Generar número de expediente automático
      const expedientesExistentes = this.expedientes();
      const numeroExpediente = this.generarNumeroExpediente(expedientesExistentes);
      
      // Extraer solo el número del expediente (sin E- y -2025)
      const numeroSolo = numeroExpediente.replace('E-', '').replace(`-${new Date().getFullYear()}`, '');
      
      const expedienteData: ExpedienteCreate = {
        numero: numeroSolo, // Solo el número (1234)
        folio: 1, // Expediente básico
        fechaEmision: new Date(),
        tipoTramite: tipoTramite as TipoTramite,
        empresaId: empresaId,
        descripcion: descripcion,
        observaciones: 'Expediente creado automáticamente al generar resolución'
      };

      console.log('📋 Creando expediente automático:', expedienteData);
      
      // Crear el expediente
      const expediente = await this.expedienteService.createExpediente(expedienteData).toPromise();
      
      if (expediente) {
        console.log('✅ Expediente creado automáticamente:', expediente.id);
        // Actualizar la lista de expedientes
        this.expedientes.update(expedientes => [...expedientes, expediente]);
        this.expedientesFiltrados.update(expedientes => [...expedientes, expediente]);
        
        // Actualizar el formulario
        this.resolucionForm.get('expedienteId')?.setValue(expediente.id);
        
        return expediente.id;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error creando expediente automático:', error);
      return null;
    }
  }

  private generarNumeroExpediente(expedientesExistentes: Expediente[]): string {
    const anioActual = new Date().getFullYear();
    const expedientesAnio = expedientesExistentes.filter(e => 
      new Date(e.fechaEmision).getFullYear() === anioActual
    );
    
    const siguienteNumero = expedientesAnio.length + 1;
    return `E-${siguienteNumero.toString().padStart(4, '0')}-${anioActual}`;
  }

  crearExpedienteManual(): void {
    // TODO: Implementar modal para crear expediente manualmente
    this.snackBar.open('FUNCIONALIDAD DE CREACIÓN MANUAL DE EXPEDIENTES PRÓXIMAMENTE', 'CERRAR', {
      duration: 3000
    });
  }

  private cargarResolucionesPadre(): void {
    const empresaId = this.empresaSeleccionada()?.id || this.resolucionForm.get('empresaId')?.value;
    
    if (!empresaId) {
      console.warn('⚠️ No hay empresa seleccionada para cargar resoluciones padre');
      return;
    }

    console.log('🔍 Cargando resoluciones padre para empresa:', empresaId);

    this.resolucionService.getResoluciones().subscribe({
      next: (resoluciones) => {
        console.log('📋 Todas las resoluciones recibidas:', resoluciones);
        
        // Filtrar resoluciones de la empresa actual
        const resolucionesEmpresa = resoluciones.filter(r => r.empresaId === empresaId);
        console.log('🏢 Resoluciones de la empresa:', resolucionesEmpresa);
        
        // Filtrar solo resoluciones PADRE que estén vigentes
        const resolucionesPadre = resolucionesEmpresa.filter(r => 
          r.tipoResolucion === 'PADRE' && 
          r.estaActivo
        );
        console.log('👑 Resoluciones PADRE de la empresa:', resolucionesPadre);
        
        // Filtrar por tipo de trámite (más flexible)
        const resolucionesRenovables = resolucionesPadre.filter(r => 
          r.tipoTramite === 'AUTORIZACION NUEVA' || 
          r.tipoTramite === 'RENOVACION' ||
          r.tipoTramite === 'INCREMENTO' || // También permitir incrementos como padre
          !r.tipoTramite // Si no tiene tipo de trámite, también considerarlo
        );
        
        console.log('🔄 Resoluciones renovables encontradas:', resolucionesRenovables);
        this.resolucionesPadre.set(resolucionesRenovables);
        
        if (resolucionesRenovables.length === 0) {
          console.warn('⚠️ No se encontraron resoluciones padre renovables para esta empresa');
          this.snackBar.open('NO HAY RESOLUCIONES PADRE DISPONIBLES PARA RENOVAR', 'CERRAR', {
            duration: 3000
          });
        }
      },
      error: (error) => {
        console.error('ERROR CARGANDO RESOLUCIONES PADRE:', error);
        this.snackBar.open('ERROR AL CARGAR RESOLUCIONES PADRE', 'CERRAR', {
          duration: 3000
        });
      }
    });
  }

  onNumeroBaseChange(): void {
    const numeroBase = this.resolucionForm.get('numeroBase')?.value;
    if (numeroBase) {
      // Solo limpiar caracteres no numéricos y limitar a 4 dígitos
      const numeroLimpio = numeroBase.replace(/\D/g, '').slice(0, 4);
      
      // Actualizar el signal para reactividad
      this.numeroBaseSignal.set(numeroLimpio);
      
      // Solo actualizar si es diferente (evitar loops infinitos)
      if (numeroLimpio !== numeroBase) {
        this.resolucionForm.get('numeroBase')?.setValue(numeroLimpio);
      }
    }
  }

  private validarNumeroUnico(numeroBase: string): void {
    if (!numeroBase || numeroBase.length < 4) return;
    
    // Obtener la fecha de emisión del formulario (no del signal)
    const fechaEmision = this.resolucionForm.get('fechaEmision')?.value;
    if (!fechaEmision) {
      console.log('⚠️ No se puede validar: fecha de emisión no establecida');
      return;
    }
    
    const anio = new Date(fechaEmision).getFullYear();
    const numeroCompleto = `R-${numeroBase.padStart(4, '0')}-${anio}`;
    
    console.log('🔍 Validando número único:', {
      numeroBase,
      fechaEmision,
      anio,
      numeroCompleto
    });
    
    // Verificar si ya existe una resolución con este número para el año
    this.resolucionService.getResoluciones().subscribe({
      next: (resoluciones) => {
        const existe = resoluciones.some(r => 
          r.nroResolucion === numeroCompleto && 
          new Date(r.fechaEmision).getFullYear() === anio
        );
        
        if (existe) {
          console.log('❌ Número duplicado encontrado:', numeroCompleto);
          this.resolucionForm.get('numeroBase')?.setErrors({ duplicate: true });
        } else {
          console.log('✅ Número único válido:', numeroCompleto);
          const control = this.resolucionForm.get('numeroBase');
          if (control?.hasError('duplicate')) {
            control.setErrors(null);
            control.updateValueAndValidity();
          }
        }
      },
      error: (error) => {
        console.error('❌ Error validando número único:', error);
      }
    });
  }

  onTipoTramiteChange(): void {
    const tipoTramite = this.resolucionForm.get('tipoTramite')?.value;
    this.tipoTramiteSignal.set(tipoTramite);
    
    const esPadre = tipoTramite === 'AUTORIZACION NUEVA' || tipoTramite === 'RENOVACION';
    
    if (tipoTramite === 'RENOVACION') {
      // Cargar resoluciones padre disponibles para renovación
      this.cargarResolucionesPadre();
      
      // Habilitar campo de resolución padre
      this.resolucionForm.get('resolucionPadreId')?.enable();
      
      // Habilitar campos de vigencia
      this.resolucionForm.get('fechaVigenciaInicio')?.enable();
      this.resolucionForm.get('aniosVigencia')?.enable();
      
      // Establecer valores por defecto si están vacíos
      if (!this.resolucionForm.get('fechaVigenciaInicio')?.value) {
        const fechaDefault = this.obtenerFechaLima();
        this.resolucionForm.get('fechaVigenciaInicio')?.setValue(fechaDefault);
        this.fechaVigenciaInicioSignal.set(fechaDefault);
      }
      if (!this.resolucionForm.get('aniosVigencia')?.value) {
        this.resolucionForm.get('aniosVigencia')?.setValue(5);
        this.aniosVigenciaSignal.set(5);
      }
    } else if (esPadre) {
      // Para AUTORIZACION NUEVA, deshabilitar campo de resolución padre
      this.resolucionForm.get('resolucionPadreId')?.disable();
      this.resolucionForm.get('resolucionPadreId')?.setValue(null);
      
      // Habilitar campos de vigencia para tipos PADRE
      this.resolucionForm.get('fechaVigenciaInicio')?.enable();
      this.resolucionForm.get('aniosVigencia')?.enable();
      
      // Establecer valores por defecto si están vacíos
      if (!this.resolucionForm.get('fechaVigenciaInicio')?.value) {
        const fechaDefault = this.obtenerFechaLima();
        this.resolucionForm.get('fechaVigenciaInicio')?.setValue(fechaDefault);
        this.fechaVigenciaInicioSignal.set(fechaDefault);
      }
      if (!this.resolucionForm.get('aniosVigencia')?.value) {
        this.resolucionForm.get('aniosVigencia')?.setValue(5);
        this.aniosVigenciaSignal.set(5);
      }
    } else {
      // Para tipos HIJO (INCREMENTO, SUSTITUCION, etc.)
      if (this.data?.esResolucionHija && this.data?.resolucionPadreId) {
        // Si es resolución hija, mantener el padre seleccionado
        this.resolucionForm.get('resolucionPadreId')?.setValue(this.data.resolucionPadreId);
        this.resolucionForm.get('resolucionPadreId')?.disable();
      } else {
        // Deshabilitar campo de resolución padre
        this.resolucionForm.get('resolucionPadreId')?.disable();
        this.resolucionForm.get('resolucionPadreId')?.setValue(null);
      }
      
      // Deshabilitar campos de vigencia para tipos HIJO
      this.resolucionForm.get('fechaVigenciaInicio')?.disable();
      this.resolucionForm.get('fechaVigenciaInicio')?.setValue(null);
      this.fechaVigenciaInicioSignal.set(null);
      this.resolucionForm.get('aniosVigencia')?.disable();
      this.resolucionForm.get('aniosVigencia')?.setValue(null);
      this.aniosVigenciaSignal.set(0);
    }
  }

  onFechaEmisionChange(): void {
    // Actualizar el signal de fecha de emisión
    const fechaEmision = this.resolucionForm.get('fechaEmision')?.value;
    if (fechaEmision) {
      this.fechaEmisionSignal.set(fechaEmision);
    }
    
    // Revalidar número único cuando cambie el año de emisión
    const numeroBase = this.resolucionForm.get('numeroBase')?.value;
    if (numeroBase && numeroBase.length === 4) {
      this.validarNumeroUnico(numeroBase);
    }
  }

  onNumeroBaseBlur(): void {
    // Asegurar formato cuando el usuario sale del campo
    const numeroBase = this.resolucionForm.get('numeroBase')?.value;
    if (numeroBase) {
      const numeroFormateado = numeroBase.toString().padStart(4, '0');
      if (numeroFormateado !== numeroBase) {
        this.resolucionForm.get('numeroBase')?.setValue(numeroFormateado);
      }
      
      // Validar número único al salir del campo
      if (numeroFormateado.length === 4) {
        this.validarNumeroUnico(numeroFormateado);
      }
    }
  }

  onVigenciaChange(): void {
    // Sincronizar signals de vigencia
    const fechaVigenciaInicio = this.resolucionForm.get('fechaVigenciaInicio')?.value;
    const aniosVigencia = this.resolucionForm.get('aniosVigencia')?.value;
    
    if (fechaVigenciaInicio) {
      this.fechaVigenciaInicioSignal.set(fechaVigenciaInicio);
    }
    if (aniosVigencia) {
      this.aniosVigenciaSignal.set(aniosVigencia);
    }
    
    // Forzar recálculo de la fecha de vigencia fin
    // Esto se hace para asegurar que el computed se actualice
    const control = this.resolucionForm.get('aniosVigencia');
    if (control) {
      control.updateValueAndValidity();
    }
  }

  onResolucionPadreChange(): void {
    const resolucionPadreId = this.resolucionForm.get('resolucionPadreId')?.value;
    
    if (resolucionPadreId) {
      // Buscar la resolución padre seleccionada
      const resolucionPadre = this.resolucionesPadre().find(r => r.id === resolucionPadreId);
      
      if (resolucionPadre) {
        console.log('🔍 Resolución padre seleccionada:', resolucionPadre);
        
        // Copiar descripción si no hay una ya escrita
        if (!this.resolucionForm.get('descripcion')?.value) {
          this.resolucionForm.get('descripcion')?.setValue(
            `RENOVACIÓN DE: ${resolucionPadre.nroResolucion}`
          );
        }
        
        // Copiar observaciones si no hay unas ya escritas
        if (!this.resolucionForm.get('observaciones')?.value) {
          this.resolucionForm.get('observaciones')?.setValue(
            `Renovación de la resolución ${resolucionPadre.nroResolucion} emitida el ${this.formatearFechaLima(resolucionPadre.fechaEmision)}`
          );
        }
      }
    }
  }

  async crearResolucion(): Promise<void> {
    // Validar que la empresa esté seleccionada
    if (!this.empresaSeleccionada() && !this.resolucionForm.get('empresaId')?.value) {
      this.snackBar.open('DEBE SELECCIONAR UNA EMPRESA', 'CERRAR', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Validar que se seleccione un expediente
    let expedienteId = this.resolucionForm.get('expedienteId')?.value;
    
    // Si no hay expediente seleccionado, crear uno automáticamente
    if (!expedienteId) {
      expedienteId = await this.crearExpedienteAutomatico();
      if (!expedienteId) {
        this.snackBar.open('ERROR AL CREAR EXPEDIENTE AUTOMÁTICO', 'CERRAR', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
    }

    // Validar que se seleccione resolución padre para renovación
    const tipoTramite = this.resolucionForm.get('tipoTramite')?.value;
    if (tipoTramite === 'RENOVACION' && !this.resolucionForm.get('resolucionPadreId')?.value) {
      this.snackBar.open('DEBE SELECCIONAR LA RESOLUCIÓN PADRE A RENOVAR', 'CERRAR', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (this.resolucionForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);

    // Construir el número completo de resolución
    const numeroBase = this.resolucionForm.get('numeroBase')?.value;
    const numeroCompleto = `R-${numeroBase.padStart(4, '0')}-${this.anioEmision()}`;

    // Calcular fecha de vigencia fin si aplica
    let fechaVigenciaFin: Date | undefined;
    const fechaInicio = this.resolucionForm.get('fechaVigenciaInicio')?.value;
    const aniosVigencia = this.resolucionForm.get('aniosVigencia')?.value;
    
    if (fechaInicio && aniosVigencia) {
      fechaVigenciaFin = new Date(fechaInicio);
      fechaVigenciaFin.setFullYear(fechaVigenciaFin.getFullYear() + aniosVigencia);
    }

    const resolucionData: ResolucionCreate = {
      numero: numeroBase,
      empresaId: this.data.empresaId || this.resolucionForm.get('empresaId')?.value,
      expedienteId: expedienteId, // Usar el expediente seleccionado
      fechaEmision: this.resolucionForm.get('fechaEmision')?.value,
      fechaVigenciaInicio: fechaInicio,
      fechaVigenciaFin: fechaVigenciaFin,
      tipoResolucion: this.tipoResolucionCalculado() as TipoResolucion,
      tipoTramite: this.resolucionForm.get('tipoTramite')?.value as TipoTramite,
      resolucionPadreId: this.resolucionForm.get('resolucionPadreId')?.value || undefined,
      descripcion: this.resolucionForm.get('descripcion')?.value,
      observaciones: this.resolucionForm.get('observaciones')?.value,
      vehiculosHabilitadosIds: [],
      rutasAutorizadasIds: []
    };

    // Si es resolución hija, copiar vehículos y rutas del padre
    if (this.data?.esResolucionHija && this.data?.resolucionPadreId) {
      // TODO: Obtener vehículos y rutas de la resolución padre
      console.log('🔗 Creando resolución hija para padre:', this.data.resolucionPadreId);
    }

    this.resolucionService.createResolucion(resolucionData).subscribe({
      next: (resolucion) => {
        this.isLoading.set(false);
        this.snackBar.open('RESOLUCIÓN CREADA EXITOSAMENTE', 'CERRAR', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(resolucion);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('ERROR CREANDO RESOLUCIÓN:', error);
        this.snackBar.open('ERROR AL CREAR LA RESOLUCIÓN', 'CERRAR', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resolucionForm.controls).forEach(key => {
      const control = this.resolucionForm.get(key);
      control?.markAsTouched();
    });
  }

  ngOnDestroy(): void {
    // Limpiar subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }
} 