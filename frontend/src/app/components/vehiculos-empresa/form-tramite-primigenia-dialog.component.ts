import { Component, Inject, OnInit, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, FormsModule, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FlotaEmpresaService, TramiteMasivoRequest } from '../../services/flota-empresa.service';
import { environment } from '../../../environments/environment';

export interface FormTramitePrimigeniaDialogData {
  ruc: string;
  razon_social?: string;
  nro_resolucion_primigenia: string;
  fecha_inicio_vigencia?: string;
  fecha_fin_vigencia?: string;
  rutas?: string[];
}

export interface ExpedienteItem {
  numero: string;
  fecha: string;
}

export interface VehiculoProcesadoUI {
  placa: string;
  placa_saliente?: string;
  rutas: string[];
  tipo_operacion: string;
  origen_datos: 'DB_LOCAL' | 'PCM_API' | 'MANUAL';
  numero_tuc?: string;
  isEditing?: boolean;
  datos_tecnicos: {
    placa: string;
    marca?: string;
    modelo?: string;
    anio_fabricacion?: number | null;
    anio_modelo?: number | null;
    color?: string;
    categoria?: string;
    carroceria?: string;
    clase?: string;
    combustible?: string;
    numero_motor?: string;
    numero_serie?: string;
    vin?: string;
    pasajeros?: number;
    asientos?: number;
    cilindros?: number;
    ejes?: number;
    ruedas?: number;
    peso_bruto?: number;
    peso_neto?: number;
    carga_util?: number;
    largo?: number;
    ancho?: number;
    alto?: number;
    observaciones?: string;
  };
}

@Component({
  selector: 'app-form-tramite-primigenia-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule
  ],
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }
  ],
  template: `
    <div class="tramite-dialog-container">
      
      <!-- HEADER CON INFORMACIÓN Y BOTÓN CERRAR -->
      <div class="dialog-header">
        <div class="title-flex">
          <div class="icon-badge">
            <mat-icon class="header-icon">assignment_turned_in</mat-icon>
          </div>
          <div>
            <h2>Gestión de Trámite por Resolución Primigenia</h2>
            <p class="dialog-subtitle">
              Resolución: <strong class="text-cyan">{{ data.nro_resolucion_primigenia }}</strong>
              | Empresa RUC: <strong>{{ data.ruc }}</strong>
            </p>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" [disabled]="saving()">
          <mat-icon style="color:#fff;">close</mat-icon>
        </button>
      </div>

      <div class="dialog-body">
        
        <!-- PESTAÑAS MULTI-ETAPA -->
        <mat-tab-group [(selectedIndex)]="currentStep" animationDuration="200ms" class="custom-tabs">
          
          <!-- ETAPA 1: DATOS DEL TRÁMITE, EXPEDIENTE Y CARD INFORMATIVO DE LA PRIMIGENIA -->
          <mat-tab label="1. Primigenia & Datos del Trámite">
            <div class="tab-padding">
              
              <!-- CARD INFORMATIVO DE LA RESOLUCIÓN PRIMIGENIA SELECCIONADA -->
              <div class="primigenia-info-card">
                <div class="card-header-flex">
                  <div class="badge-title">
                    <mat-icon class="icon-blue">verified</mat-icon>
                    <span>Resolución Primigenia Base</span>
                  </div>
                  <span class="status-badge-active">
                    <span class="dot"></span> ACTIVA / VIGENTE
                  </span>
                </div>

                <div class="card-body-grid">
                  <div class="info-item">
                    <span class="label">Empresa Titular:</span>
                    <span class="val bold">{{ data.razon_social || 'EMPRESA REGISTRADA' }} (RUC: {{ data.ruc }})</span>
                  </div>

                  <div class="info-item">
                    <span class="label">N° Resolución:</span>
                    <span class="val text-cyan font-mono bold">{{ data.nro_resolucion_primigenia }}</span>
                  </div>

                  <div class="info-item">
                    <span class="label">Vigencia Oficial:</span>
                    <span class="val">
                      @if (data.fecha_inicio_vigencia && data.fecha_fin_vigencia) {
                        Desde: <strong>{{ data.fecha_inicio_vigencia | date:'dd/MM/yyyy' }}</strong> hasta <strong class="text-emerald">{{ data.fecha_fin_vigencia | date:'dd/MM/yyyy' }}</strong>
                      } @else if (data.fecha_fin_vigencia) {
                        Hasta: <strong class="text-emerald">{{ data.fecha_fin_vigencia | date:'dd/MM/yyyy' }}</strong>
                      } @else {
                        <strong class="text-emerald">VIGENTE EN CATALOGO</strong>
                      }
                    </span>
                  </div>

                  <div class="info-item style-full">
                    <span class="label">Rutas Autorizadas en esta Primigenia:</span>
                    <div class="rutas-chips-wrap">
                      @for (r of (data.rutas || []); track r) {
                        <span class="chip-ruta">Ruta {{ r }}</span>
                      } @empty {
                        <span class="text-muted">Sin rutas específicas asignadas</span>
                      }
                    </div>
                  </div>
                </div>
              </div>

              <!-- FORMULARIO ETAPA 1 -->
              <form [formGroup]="formEtapa1" class="form-grid-etapa1">
                
                <mat-form-field appearance="outline" floatLabel="always" class="style-full">
                  <mat-label>Tipo de Trámite *</mat-label>
                  <mat-select formControlName="tipo_tramite" required (selectionChange)="onTipoTramiteChange()" panelClass="light-select-panel">
                    <mat-option value="INCREMENTO">Incremento de Flota</mat-option>
                    <mat-option value="SUSTITUCION">Sustitución de Vehículo</mat-option>
                    <mat-option value="RENOVACION">Renovación de Resolución</mat-option>
                    <mat-option value="FE_DE_ERRATAS">Fe de Erratas</mat-option>
                    <mat-option value="DUPLICADO">Duplicado de TUC / Expediente</mat-option>
                    <mat-option value="CANJE">Canje de TUC</mat-option>
                    <mat-option value="MODIFICACION">Modificación de Características</mat-option>
                    <mat-option value="CANCELACION">Cancelación / Baja de Flota</mat-option>
                  </mat-select>
                </mat-form-field>


                <!-- BLOQUE MULTI-EXPEDIENTE -->
                <div class="expedientes-container style-full">
                  <div class="expedientes-header">
                    <div class="exp-title">
                      <mat-icon class="icon-accent">folder_open</mat-icon>
                      <span>Expedientes del Trámite (Formato: E-XXXX-YYYY)</span>
                    </div>
                    <button mat-flat-button color="accent" type="button" class="btn-add-exp" style="border-radius: 8px; font-weight: 600;" (click)="agregarExpediente()">
                      <mat-icon>add</mat-icon> Agregar Expediente
                    </button>
                  </div>

                  <div class="expedientes-list">
                    @for (exp of expedientes; track $index) {
                      <div class="expediente-row">
                        <mat-form-field appearance="outline" floatLabel="always" class="exp-input">
                          <mat-label>N° Expediente {{ expedientes.length > 1 ? '#' + ($index + 1) : '' }}</mat-label>
                          <input matInput [(ngModel)]="exp.numero" [ngModelOptions]="{standalone: true}" 
                                 (blur)="onExpedienteBlur($index)" placeholder="Ej: 0123 -> E-0123-2026">
                          <mat-icon matSuffix color="primary">folder</mat-icon>
                        </mat-form-field>

                        <mat-form-field appearance="outline" floatLabel="always" class="exp-date compact-field">
                          <mat-label>Fecha de Expediente {{ expedientes.length > 1 ? '#' + ($index + 1) : '' }}</mat-label>
                          <input matInput [matDatepicker]="pickerExp" [(ngModel)]="exp.fecha" [ngModelOptions]="{standalone: true}">
                          <mat-datepicker-toggle matIconSuffix [for]="pickerExp"></mat-datepicker-toggle>
                          <mat-datepicker #pickerExp></mat-datepicker>
                        </mat-form-field>

                        @if (expedientes.length > 1) {
                          <button mat-icon-button type="button" color="warn" class="btn-del-exp" (click)="eliminarExpediente($index)" title="Eliminar expediente">
                            <mat-icon>delete_outline</mat-icon>
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>

                @if (!esRenovacion()) {
                  <mat-form-field appearance="outline" floatLabel="always">
                    <mat-label>Número de Res. Hija / Documento</mat-label>
                    <input matInput formControlName="nro_resolucion_hija" (blur)="onResolucionHijaBlur()" placeholder="Ej: 0123 -> R-0123-2026">
                    <mat-hint style="font-size:10px; color:#0284c7;">Formato: R-0123-2026</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" floatLabel="always" class="compact-field">
                    <mat-label>Fecha Emisión Resolución</mat-label>
                    <input matInput [matDatepicker]="pickerEmision" formControlName="fecha_emision_resolucion">
                    <mat-datepicker-toggle matIconSuffix [for]="pickerEmision"></mat-datepicker-toggle>
                    <mat-datepicker #pickerEmision></mat-datepicker>
                  </mat-form-field>
                }

                <!-- SECCIÓN ESPECIAL: RENOVACIÓN DE RESOLUCIÓN -->
                @if (esRenovacion()) {
                  <div class="renovacion-box style-full">
                    <div class="renovacion-header">
                      <mat-icon color="accent">history_edu</mat-icon>
                      <span>Datos de la NUEVA Resolución Primigenia de Renovación</span>
                    </div>

                    <div class="renovacion-grid">
                      <mat-form-field appearance="outline" floatLabel="always">
                        <mat-label>N° Nueva Res. Primigenia *</mat-label>
                        <input matInput formControlName="nueva_resolucion_primigenia" (blur)="onNuevaResolucionBlur()" placeholder="Ej: 0123 -> R-0123-2026" required>
                      </mat-form-field>

                      <mat-form-field appearance="outline" floatLabel="always" class="compact-field">
                        <mat-label>Fecha Emisión Nueva Res.</mat-label>
                        <input matInput [matDatepicker]="pickerNuevaEmision" formControlName="nueva_fecha_emision">
                        <mat-datepicker-toggle matIconSuffix [for]="pickerNuevaEmision"></mat-datepicker-toggle>
                        <mat-datepicker #pickerNuevaEmision></mat-datepicker>
                      </mat-form-field>

                      <mat-form-field appearance="outline" floatLabel="always" class="compact-field">
                        <mat-label>Inicio Vigencia</mat-label>
                        <input matInput [matDatepicker]="pickerInicio" formControlName="nueva_fecha_inicio_vigencia">
                        <mat-datepicker-toggle matIconSuffix [for]="pickerInicio"></mat-datepicker-toggle>
                        <mat-datepicker #pickerInicio></mat-datepicker>
                      </mat-form-field>

                      <mat-form-field appearance="outline" floatLabel="always" class="compact-field">
                        <mat-label>Fin Vigencia</mat-label>
                        <input matInput [matDatepicker]="pickerFin" formControlName="nueva_fecha_fin_vigencia">
                        <mat-datepicker-toggle matIconSuffix [for]="pickerFin"></mat-datepicker-toggle>
                        <mat-datepicker #pickerFin></mat-datepicker>
                      </mat-form-field>

                      <!-- ARRAY DE NUEVAS RUTAS -->
                      <div class="rutas-array-container style-full">
                        <div class="rutas-array-header">
                          <mat-icon>route</mat-icon>
                          <span>Detalle de Nuevas Rutas Autorizadas</span>
                          <button mat-flat-button color="accent" type="button" class="btn-add-ruta" style="border-radius: 8px; font-weight: 600;" (click)="abrirModalRuta()">
                            <mat-icon>add</mat-icon> Agregar Ruta
                          </button>
                        </div>

                        @if (nuevas_rutas_array.length === 0) {
                          <div class="no-rutas-msg" style="padding: 40px 24px; text-align: center; color: var(--text-muted); background: var(--background-card); border: 1px solid var(--border-primary); border-radius: 12px; box-shadow: var(--shadow-sm); margin-top: 16px;">
                            <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: var(--background-secondary); border-radius: 50%; margin-bottom: 16px;">
                              <mat-icon style="font-size: 32px; width: 32px; height: 32px; color: var(--text-muted);">alt_route</mat-icon>
                            </div>
                            <h3 style="margin: 0 0 8px 0; color: var(--text-primary); font-size: 16px; font-weight: 600;">Sin rutas registradas</h3>
                            <p style="margin: 0; font-size: 14px;">Haz clic en "Agregar Ruta" para comenzar a añadir los itinerarios de esta resolución.</p>
                          </div>
                        } @else {
                          <div class="table-responsive" style="border: 1px solid var(--border-primary); border-radius: 10px; overflow: hidden;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                              <thead>
                                <tr style="background-color: var(--background-secondary); border-bottom: 1px solid var(--border-primary);">
                                  <th style="padding: 12px; color: var(--text-primary); font-weight: 600; font-size: 13px;">Código</th>
                                  <th style="padding: 12px; color: var(--text-primary); font-weight: 600; font-size: 13px;">Origen</th>
                                  <th style="padding: 12px; color: var(--text-primary); font-weight: 600; font-size: 13px;">Destino</th>
                                  <th style="padding: 12px; color: var(--text-primary); font-weight: 600; font-size: 13px;">Itinerario</th>
                                  <th style="padding: 12px; color: var(--text-primary); font-weight: 600; font-size: 13px;">Frecuencia</th>
                                  <th style="padding: 12px; color: var(--text-primary); font-weight: 600; font-size: 13px; text-align: center;">Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                @for (ruta of nuevas_rutas_array.controls; track $index) {
                                  <tr style="border-bottom: 1px solid var(--border-primary);">
                                    <td style="padding: 12px; font-weight: bold; color: var(--primary-500);">{{ ruta.get('codigo')?.value }}</td>
                                    <td style="padding: 12px; color: var(--text-primary);">{{ ruta.get('origen')?.value }}</td>
                                    <td style="padding: 12px; color: var(--text-primary);">{{ ruta.get('destino')?.value }}</td>
                                    <td style="padding: 12px; color: var(--text-muted); font-size: 13px;">{{ ruta.get('itinerario')?.value || '-' }}</td>
                                    <td style="padding: 12px; color: var(--text-primary);">{{ ruta.get('frecuencia')?.value || '-' }}</td>
                                    <td style="padding: 12px; text-align: center;">
                                      <button mat-icon-button type="button" color="warn" (click)="eliminarNuevaRuta($index)" style="transform: scale(0.8);">
                                        <mat-icon>delete</mat-icon>
                                      </button>
                                    </td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        }
                      </div>
                    </div>

                    <div class="alert-renovacion">
                      <mat-icon>info</mat-icon>
                      <span>Al guardar la Renovación, la resolución anterior (<strong>{{ data.nro_resolucion_primigenia }}</strong>), sus rutas y toda su flota pasarán a estado <strong>INHABILITADO / INACTIVO</strong>. Asegúrate de registrar las Nuevas Rutas Autorizadas para esta nueva resolución.</span>
                    </div>
                  </div>
                }

              </form>

              <div class="step-actions">
                <button mat-flat-button color="primary" class="btn-next" (click)="irAEtapa2()" [disabled]="formEtapa1.invalid">
                  <span>Siguiente: Ingreso Masivo de Vehículos </span>
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>

            </div>
          </mat-tab>

          <!-- ETAPA 2: INGRESO MASIVO Y AUTOCOMPLETADO DESDE VEHICULOS_DATA / PCM -->
          <mat-tab label="2. Ingreso Masivo & Datos Técnicos" [disabled]="formEtapa1.invalid">
            <div class="tab-padding">
              
              <div class="instruction-box">
                <div class="inst-title">
                  <mat-icon>format_list_bulleted</mat-icon>
                  <span>Formato por Líneas de Ingreso (Un vehículo por fila)</span>
                </div>
                
                @if (formEtapa1.get('tipo_tramite')?.value === 'SUSTITUCION') {
                  <div class="inst-format text-amber">
                    <strong>Formato Sustitución:</strong> <code>PLACA_ENTRA PLACA_SALE RUTAS</code> (Ejemplo: <code>B1B-123 A1A-111 01,02</code>)
                    <br><small>El primer vehículo reemplaza al segundo. El vehículo que sale pasará a INHABILITADO con nota de baja.</small>
                  </div>
                } @else {
                  <div class="inst-format text-cyan">
                    <strong>Formato Estándar:</strong> <code>PLACA RUTAS</code> (Ejemplo: <code>A3B-123 01</code> o <code>A2B-123 01,02</code>)
                  </div>
                }
              </div>

              <mat-form-field appearance="outline" floatLabel="always" class="style-full">
                <mat-label>Lista de Vehículos a Procesar (Pegue o escriba por líneas)</mat-label>
                <textarea matInput [formControl]="lineasInputControl" rows="5" 
                  placeholder="Escriba aquí los vehículos por fila...&#10;Ejemplo:&#10;Z5H-958 01,02&#10;Z6B-123 03"></textarea>
              </mat-form-field>

              <div class="process-actions">
                <button mat-flat-button color="accent" class="btn-process" (click)="procesarLineas()" [disabled]="processing() || !lineasInputControl.value.trim()">
                  @if (processing()) {
                    <mat-spinner diameter="18" style="display:inline-block; margin-right:8px;"></mat-spinner>
                  }
                  <mat-icon>manage_search</mat-icon>
                  <span>Procesar y Autocompletar con DB / PCM</span>
                </button>
              </div>

              <!-- VISTA PREVIA DE VEHÍCULOS PROCESADOS CON AUTOCOMPLETADO Y EDICIÓN -->
              @if (vehiculosProcesados().length > 0) {
                <div class="processed-summary-header">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <mat-icon class="text-emerald">task_alt</mat-icon>
                    <span>Vehículos Procesados ({{ vehiculosProcesados().length }})</span>
                  </div>
                  <button mat-stroked-button type="button" class="btn-gen-all-tuc" (click)="generarTucsMasivos()" title="Generar correlativos de TUC para todos los vehículos">
                    <mat-icon>auto_awesome</mat-icon>
                    <span>Asignar E-TUC a Todos</span>
                  </button>
                </div>

                <div class="vehiculos-accordion-list">
                  @for (v of vehiculosProcesados(); track v.placa; let idx = $index) {
                    <mat-expansion-panel class="vehiculo-panel">
                      <mat-expansion-panel-header>
                        <mat-panel-title>
                          <span class="placa-badge font-mono">{{ v.placa }}</span>
                          @if (v.placa_saliente) {
                            <span class="sustituye-tag font-mono">➡ Reemplaza a {{ v.placa_saliente }}</span>
                          }
                          <span class="origin-tag" [class.db]="v.origen_datos==='DB_LOCAL'" [class.pcm]="v.origen_datos==='PCM_API'">
                            {{ v.origen_datos === 'PCM_API' ? 'SUNARP / PCM' : (v.origen_datos === 'DB_LOCAL' ? 'DB LOCAL' : 'MANUAL') }}
                          </span>
                          @if (v.numero_tuc) {
                            <span class="tuc-badge font-mono">TUC: {{ v.numero_tuc }}</span>
                          }
                        </mat-panel-title>
                        <mat-panel-description>
                          <span>{{ v.datos_tecnicos.marca || 'MARCA' }} {{ v.datos_tecnicos.modelo || '' }} ({{ v.datos_tecnicos.categoria || 'Cat' }})</span>
                          <span class="rutas-tag">Rutas: {{ v.rutas.join(', ') || 'Todas' }}</span>
                        </mat-panel-description>
                      </mat-expansion-panel-header>

                      <!-- CONTENIDO DEL VEHÍCULO (RESUMEN O EDICIÓN) -->
                      <div class="tech-specs-container" style="position: relative;">
                        @if (!v.isEditing) {
                          <div class="summary-view" style="padding: 16px;">
                            <button mat-icon-button (click)="v.isEditing = true" style="position: absolute; right: 16px; top: 16px; background-color: var(--background-secondary); border-radius: 50%;" title="Editar Vehículo">
                              <mat-icon class="text-emerald">edit</mat-icon>
                            </button>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                              <div>
                                <h4 style="margin: 0 0 8px 0; color: var(--text-muted); font-size: 12px; text-transform: uppercase;">1. Identificación</h4>
                                <div style="color: var(--text-primary); font-size: 14px; line-height: 1.6;">
                                  <strong>Placa:</strong> {{ v.placa }} <br>
                                  <strong>Marca:</strong> {{ v.datos_tecnicos.marca || '-' }} <br>
                                  <strong>Modelo:</strong> {{ v.datos_tecnicos.modelo || '-' }} <br>
                                  <strong>Año Fab.:</strong> {{ v.datos_tecnicos.anio_fabricacion || '-' }} <br>
                                  <strong>Color:</strong> {{ v.datos_tecnicos.color || '-' }}
                                </div>
                              </div>
                              <div>
                                <h4 style="margin: 0 0 8px 0; color: var(--text-muted); font-size: 12px; text-transform: uppercase;">2. Motor y Serie</h4>
                                <div style="color: var(--text-primary); font-size: 14px; line-height: 1.6;">
                                  <strong>Motor:</strong> {{ v.datos_tecnicos.numero_motor || '-' }} <br>
                                  <strong>Serie:</strong> {{ v.datos_tecnicos.numero_serie || '-' }} <br>
                                  <strong>VIN:</strong> {{ v.datos_tecnicos.vin || '-' }} <br>
                                  <strong>Combustible:</strong> {{ v.datos_tecnicos.combustible || '-' }}
                                </div>
                              </div>
                              <div>
                                <h4 style="margin: 0 0 8px 0; color: var(--text-muted); font-size: 12px; text-transform: uppercase;">3. Capacidades</h4>
                                <div style="color: var(--text-primary); font-size: 14px; line-height: 1.6;">
                                  <strong>Cat/Clase:</strong> {{ v.datos_tecnicos.categoria || '-' }} / {{ v.datos_tecnicos.clase || '-' }} <br>
                                  <strong>Asientos:</strong> {{ v.datos_tecnicos.asientos || '-' }} <br>
                                  <strong>Pasajeros:</strong> {{ v.datos_tecnicos.pasajeros || '-' }} <br>
                                  <strong>Peso Bruto/Neto:</strong> {{ v.datos_tecnicos.peso_bruto || '-' }} / {{ v.datos_tecnicos.peso_neto || '-' }}
                                </div>
                              </div>
                            </div>
                          </div>
                        } @else {
                          <div style="text-align: right; padding: 12px 16px 0 0;">
                            <button mat-flat-button color="primary" (click)="v.isEditing = false">
                              <mat-icon>check</mat-icon> Confirmar Edición
                            </button>
                          </div>
                          
                          <!-- SECCIÓN 1: IDENTIFICACIÓN Y CARACTERIZACIÓN -->
                          <div class="tech-section">
                          <div class="tech-section-title text-cyan">
                            <mat-icon>directions_car</mat-icon>
                            <span>1. Identificación, TUC y Caracterización Vehicular</span>
                          </div>
                          <div class="tech-grid-4">
                            <mat-form-field appearance="outline" floatLabel="always" class="field-placa">
                              <mat-label>1. PLACA *</mat-label>
                              <input matInput [(ngModel)]="v.datos_tecnicos.placa" readonly class="font-mono font-bold">
                            </mat-form-field>

                            <div class="tuc-item-inline">
                              <mat-form-field appearance="outline" floatLabel="always" style="flex:1;">
                                <mat-label>N° TUC (Título)</mat-label>
                                <input matInput [(ngModel)]="v.numero_tuc" placeholder="Ej: TE-000123" class="font-mono">
                              </mat-form-field>
                              <button mat-icon-button type="button" class="btn-mini-gen" (click)="generarTucVehiculo(v)" title="Generar N° TUC">
                                <mat-icon>auto_awesome</mat-icon>
                              </button>
                            </div>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>2. MARCA</mat-label>
                              <input matInput [(ngModel)]="v.datos_tecnicos.marca" placeholder="Ej: TOYOTA">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>3. MODELO</mat-label>
                              <input matInput [(ngModel)]="v.datos_tecnicos.modelo" placeholder="Ej: HIACE">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>4. AÑO FAB. (MTC)</mat-label>
                              <input matInput type="number" [(ngModel)]="v.datos_tecnicos.anio_fabricacion" placeholder="Ej: 2020">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>4.1 AÑO MODELO</mat-label>
                              <input matInput type="number" [(ngModel)]="v.datos_tecnicos.anio_modelo" placeholder="Ej: 2021">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>5. COLOR</mat-label>
                              <input matInput [(ngModel)]="v.datos_tecnicos.color" placeholder="Ej: BLANCO">
                            </mat-form-field>

                            <!-- CATEGORÍA (Solo códigos limpios) -->
                            <mat-form-field appearance="outline" floatLabel="always" class="field-highlight">
                              <mat-label>6. CATEGORÍA *</mat-label>
                              <mat-select [ngModel]="v.datos_tecnicos.categoria" (ngModelChange)="onCategoriaChange(v, $event)">
                                <mat-option value="M2">M2</mat-option>
                                <mat-option value="M2-C3">M2-C3</mat-option>
                                <mat-option value="M3">M3</mat-option>
                                <mat-option value="M3-C3">M3-C3</mat-option>
                                <mat-option value="M1">M1</mat-option>
                                <mat-option value="N1">N1</mat-option>
                                <mat-option value="N2">N2</mat-option>
                                <mat-option value="N3">N3</mat-option>
                              </mat-select>
                            </mat-form-field>

                            <!-- CLASE (Al lado de categoría, se autocompleta con C3 si categoría es M2-C3 o M3-C3) -->
                            <mat-form-field appearance="outline" floatLabel="always" class="field-highlight">
                              <mat-label>7. CLASE</mat-label>
                              <input matInput [(ngModel)]="v.datos_tecnicos.clase" placeholder="Ej: C3 o vacío">
                              <mat-hint class="hint-small">Auto 'C3' si cat. es M2-C3 / M3-C3</mat-hint>
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>8. CARROCERÍA</mat-label>
                              <input matInput [(ngModel)]="v.datos_tecnicos.carroceria" placeholder="Ej: MICROBUS / OMNIBUS">
                            </mat-form-field>
                          </div>
                        </div>

                        <!-- SECCIÓN 2: MOTOR, SERIE Y COMBUSTIBLE -->
                        <div class="tech-section">
                          <div class="tech-section-title text-emerald">
                            <mat-icon>engineering</mat-icon>
                            <span>2. Motor, Serie e Identificadores</span>
                          </div>
                          <div class="tech-grid-4">
                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>9. COMBUSTIBLE</mat-label>
                              <mat-select [(ngModel)]="v.datos_tecnicos.combustible">
                                <mat-option value="DIESEL">DIESEL</mat-option>
                                <mat-option value="GASOLINA">GASOLINA</mat-option>
                                <mat-option value="GNV">GNV</mat-option>
                                <mat-option value="GLP">GLP</mat-option>
                                <mat-option value="HIBRIDO">HÍBRIDO</mat-option>
                                <mat-option value="ELECTRICO">ELÉCTRICO</mat-option>
                              </mat-select>
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>10. N° MOTOR</mat-label>
                              <input matInput [(ngModel)]="v.datos_tecnicos.numero_motor" class="font-mono">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>11. N° SERIE</mat-label>
                              <input matInput [(ngModel)]="v.datos_tecnicos.numero_serie" class="font-mono">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>12. N° VIN</mat-label>
                              <input matInput [(ngModel)]="v.datos_tecnicos.vin" class="font-mono">
                            </mat-form-field>
                          </div>
                        </div>

                        <!-- SECCIÓN 3: CAPACIDADES Y PESOS -->
                        <div class="tech-section">
                          <div class="tech-section-title text-amber">
                            <mat-icon>airline_seat_recline_normal</mat-icon>
                            <span>3. Capacidades y Pesos</span>
                          </div>
                          <div class="tech-grid-5">
                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>13. PASAJEROS</mat-label>
                              <input matInput type="number" [(ngModel)]="v.datos_tecnicos.pasajeros">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>14. ASIENTOS</mat-label>
                              <input matInput type="number" [(ngModel)]="v.datos_tecnicos.asientos">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>15. PESO BRUTO (Kg)</mat-label>
                              <input matInput type="number" [(ngModel)]="v.datos_tecnicos.peso_bruto">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>16. PESO NETO (Kg)</mat-label>
                              <input matInput type="number" [(ngModel)]="v.datos_tecnicos.peso_neto">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>17. CARGA ÚTIL (Kg)</mat-label>
                              <input matInput type="number" [(ngModel)]="v.datos_tecnicos.carga_util">
                            </mat-form-field>
                          </div>
                        </div>

                        <!-- SECCIÓN 4: DIMENSIONES Y EJES -->
                        <div class="tech-section">
                          <div class="tech-section-title text-purple">
                            <mat-icon>straighten</mat-icon>
                            <span>4. Dimensiones y Ejes</span>
                          </div>
                          <div class="tech-grid-6">
                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>18. LARGO (m)</mat-label>
                              <input matInput type="number" step="0.01" [(ngModel)]="v.datos_tecnicos.largo">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>19. ANCHO (m)</mat-label>
                              <input matInput type="number" step="0.01" [(ngModel)]="v.datos_tecnicos.ancho">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>20. ALTO (m)</mat-label>
                              <input matInput type="number" step="0.01" [(ngModel)]="v.datos_tecnicos.alto">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>21. CILINDROS</mat-label>
                              <input matInput type="number" [(ngModel)]="v.datos_tecnicos.cilindros">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>22. EJES</mat-label>
                              <input matInput type="number" [(ngModel)]="v.datos_tecnicos.ejes">
                            </mat-form-field>

                            <mat-form-field appearance="outline" floatLabel="always">
                              <mat-label>23. RUEDAS</mat-label>
                              <input matInput type="number" [(ngModel)]="v.datos_tecnicos.ruedas">
                            </mat-form-field>
                          </div>
                        </div>

                        <!-- OBSERVACIONES TÉCNICAS / PROPIETARIO SUNARP -->
                        <div class="tech-section">
                          <mat-form-field appearance="outline" floatLabel="always" class="style-full">
                            <mat-label>Observaciones Técnicas / Propietario Registral</mat-label>
                            <input matInput [(ngModel)]="v.datos_tecnicos.observaciones" placeholder="Datos de titularidad, SUNARP u observaciones de trámite...">
                          </mat-form-field>
                        </div>
                        }
                      </div>
                    </mat-expansion-panel>
                  }
                </div>
              }

              <!-- ACCIONES INFERIORES DE FINALIZACIÓN -->
              <div class="dialog-actions-final">
                <button mat-button type="button" (click)="cerrar()" [disabled]="saving()">Cancelar</button>
                <button mat-flat-button color="primary" class="btn-save-final" 
                  [disabled]="saving() || vehiculosProcesados().length === 0" (click)="guardarTramite()">
                  @if (saving()) {
                    <mat-spinner diameter="18" style="display:inline-block; margin-right:8px;"></mat-spinner>
                  }
                  <mat-icon>check_circle</mat-icon>
                  <span>Guardar y Procesar Trámite Completo</span>
                </button>
              </div>

            </div>
          </mat-tab>

        </mat-tab-group>

      </div>
    </div>

    <!-- Modal para Agregar Ruta -->
    <ng-template #addRutaModal>
      <div class="ruta-modal-container" style="background: var(--background-card); color: var(--text-primary);">
        <h2 mat-dialog-title style="margin: 0; padding: 16px 24px; background: var(--background-secondary); border-bottom: 1px solid var(--border-primary); font-size: 18px; font-weight: 700; color: var(--text-primary);">
          Agregar Nueva Ruta
        </h2>
        <mat-dialog-content [formGroup]="rutaForm" style="padding: 24px;">
          <div style="display: grid; grid-template-columns: 80px 1fr 1fr; gap: 16px;">
            <mat-form-field appearance="outline" floatLabel="always" class="code-field">
              <mat-label>Código</mat-label>
              <input matInput formControlName="codigo" readonly>
            </mat-form-field>
            <mat-form-field appearance="outline" floatLabel="always">
              <mat-label>Origen *</mat-label>
              <input matInput formControlName="origen" placeholder="Ej: PUNO">
            </mat-form-field>
            <mat-form-field appearance="outline" floatLabel="always">
              <mat-label>Destino *</mat-label>
              <input matInput formControlName="destino" placeholder="Ej: JULIACA">
            </mat-form-field>
            <mat-form-field appearance="outline" floatLabel="always" style="grid-column: 1 / -1;">
              <mat-label>Frecuencia</mat-label>
              <input matInput formControlName="frecuencia" placeholder="Ej: 04 DIARIAS">
            </mat-form-field>
            <mat-form-field appearance="outline" floatLabel="always" style="grid-column: 1 / -1;">
              <mat-label>Itinerario (Separar por guiones)</mat-label>
              <textarea matInput formControlName="itinerario" rows="2" placeholder="Ej: PUNO - CARACOTO - JULIACA"></textarea>
            </mat-form-field>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end" style="padding: 12px 24px; border-top: 1px solid var(--border-primary); margin-bottom: 0; background: var(--background-card);">
          <button mat-button mat-dialog-close>Cancelar</button>
          <button mat-flat-button color="primary" (click)="guardarRutaModal()" [disabled]="rutaForm.invalid" style="border-radius: 8px;">
            <mat-icon>save</mat-icon> Guardar Ruta
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>
  `,
  styles: [`
    .tramite-dialog-container {
      background-color: var(--background-card);
      color: var(--text-primary);
      border-radius: 16px;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: var(--shadow-xl);
    }

    .dialog-header {
      background: var(--background-secondary);
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-primary);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-flex {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-badge {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: var(--primary-50);
      border: 1px solid var(--primary-100);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: var(--primary-600);
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .dialog-subtitle {
      margin: 3px 0 0 0;
      font-size: 12.5px;
      color: var(--text-secondary);
    }

    .dialog-body {
      padding: 16px 24px 24px 24px;
      max-height: 80vh;
      overflow-y: auto;
      background: var(--background-primary);
    }

    .tab-padding {
      padding-top: 16px;
    }

    /* CARD PRIMIGENIA */
    .primigenia-info-card {
      background: var(--background-card);
      border: 1px solid var(--border-primary);
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 20px;
      box-shadow: var(--shadow-sm);
    }

    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-primary);
    }

    .badge-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 14px;
      color: #334155;
    }

    .icon-blue {
      color: #0ea5e9;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .status-badge-active {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      color: #059669;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid #a7f3d0;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #34d399;
    }

    .card-body-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .info-item .label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-item .val {
      font-size: 13.5px;
      color: #1e293b;
      font-weight: 600;
    }

    .style-full {
      grid-column: 1 / -1;
    }

    .rutas-chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .chip-ruta {
      background: #e0f2fe;
      border: 1px solid #bae6fd;
      color: #0284c7;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 700;
    }

    /* FORM GRID ETAPA 1 */
    .form-grid-etapa1 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .expedientes-container {
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }

    .expedientes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .exp-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 700;
      color: #0284c7;
    }

    .icon-accent {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #0284c7;
    }

    .btn-add-exp {
      height: 32px;
      font-size: 11.5px;
      color: #0284c7;
      border-color: #bae6fd;
      font-weight: 600;
      line-height: 30px;
      padding: 0 10px;
    }

    .btn-add-exp mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 2px;
    }

    .expedientes-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .expediente-row {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .exp-input {
      flex: 1.4;
    }

    .exp-date {
      flex: 1;
    }

    .btn-del-exp {
      width: 36px;
      height: 36px;
      margin-top: -16px;
    }

    /* RENOVACIÓN BOX */
    .renovacion-box {
      background: rgba(254, 243, 199, 0.4);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 12px;
      padding: 16px;
      margin-top: 8px;
    }

    .renovacion-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      color: #d97706;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .renovacion-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .alert-renovacion {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      margin-top: 12px;
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .btn-next {
      font-weight: 700;
      padding: 0 24px;
      height: 44px;
      border-radius: 10px;
    }

    /* INSTRUCTION BOX */
    .instruction-box {
      background: rgba(255, 255, 255, 0.9);
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 16px;
    }

    .inst-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }

    .inst-format {
      font-size: 12.5px;
      line-height: 1.5;
    }

    .inst-format code {
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 6px;
      color: #0284c7;
      border: 1px solid #e2e8f0;
    }

    .process-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }

    .btn-process {
      height: 44px;
      border-radius: 10px;
      font-weight: 700;
      padding: 0 20px;
    }

    /* SUMMARY HEADER */
    .processed-summary-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 14px;
    }

    .btn-gen-all-tuc {
      border-color: #bae6fd;
      color: #0284c7;
      font-weight: 700;
    }

    /* ACCORDION & CARDS */
    .vehiculos-accordion-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .vehiculo-panel {
      background: #ffffff !important;
      border: 1px solid #e2e8f0;
      border-radius: 12px !important;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.03) !important;
    }

    .placa-badge {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 800;
      letter-spacing: 0.05em;
      margin-right: 8px;
    }

    .sustituye-tag {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #d97706;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      margin-right: 8px;
    }

    .origin-tag {
      font-size: 10.5px;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .origin-tag.db {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border-color: rgba(59, 130, 246, 0.3);
    }

    .origin-tag.pcm {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border-color: rgba(52, 211, 153, 0.3);
    }

    .tuc-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      margin-left: 8px;
    }

    .rutas-tag {
      font-size: 12px;
      color: #38bdf8;
      font-weight: 600;
      margin-left: auto;
    }

    /* TECH SPECS SECTIONS */
    .tech-specs-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 8px 8px 8px;
    }

    .tech-section {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(51, 65, 85, 0.7);
      border-radius: 12px;
      padding: 14px;
    }

    .tech-section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .tech-section-title mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .tech-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    .tech-grid-5 {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }

    .tech-grid-6 {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
    }

    .tuc-item-inline {
      display: flex;
      align-items: flex-start;
      gap: 4px;
    }

    .btn-mini-gen {
      color: #38bdf8;
      margin-top: 4px;
    }

    .field-placa {
      grid-column: span 1;
    }

    .field-highlight {
      border-radius: 8px;
    }

    .hint-small {
      font-size: 10px;
      color: #38bdf8 !important;
    }

    .dialog-actions-final {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      margin-top: 20px;
    }

    .btn-save-final {
      background: linear-gradient(135deg, #16a34a, #059669);
      color: white;
      font-weight: 700;
      padding: 0 24px;
      height: 44px;
      border-radius: 10px;
    }

    /* UTILITY COLORS */
    .text-cyan { color: #0284c7; }
    .text-emerald { color: #059669; }
    .text-amber { color: #d97706; }
    .text-purple { color: #9333ea; }
    .text-muted { color: #64748b; }
    .font-mono { font-family: monospace, monospace; }
    .font-bold { font-weight: 800; }

    /* OVERRIDE AUTOFILL BACKGROUNDS */
    ::ng-deep .tramite-dialog-container input:-webkit-autofill,
    ::ng-deep .tramite-dialog-container input:-webkit-autofill:hover, 
    ::ng-deep .tramite-dialog-container input:-webkit-autofill:focus, 
    ::ng-deep .tramite-dialog-container input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px transparent inset !important;
        -webkit-text-fill-color: #1e293b !important;
        transition: background-color 5000s ease-in-out 0s;
    }
    ::ng-deep .tramite-dialog-container .mat-mdc-tab .mdc-tab__text-label {
      color: #475569 !important;
      font-weight: 600;
    }
    ::ng-deep .tramite-dialog-container .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
      color: #0ea5e9 !important;
      font-weight: 800;
    }

    /* FIX DROP-DOWN MENU (SELECT PANEL) DARK THEME */
    ::ng-deep .light-select-panel {
      background-color: #ffffff !important;
      border: 1px solid #e2e8f0;
      border-radius: 12px !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
      padding: 4px;
    }
    ::ng-deep .light-select-panel .mat-mdc-option,
    ::ng-deep .light-select-panel .mat-mdc-option .mdc-list-item__primary-text {
      color: #1e293b !important;
      font-size: 13.5px !important;
    }
    ::ng-deep .light-select-panel .mat-mdc-option {
      border-radius: 8px !important;
      margin: 2px 4px !important;
      min-height: 40px !important;
    }
    ::ng-deep .light-select-panel .mat-mdc-option:hover,
    ::ng-deep .light-select-panel .mat-mdc-option:focus,
    ::ng-deep .light-select-panel .mat-mdc-option.mdc-list-item--active,
    ::ng-deep .light-select-panel .mat-mdc-option:hover .mdc-list-item__primary-text,
    ::ng-deep .light-select-panel .mat-mdc-option:focus .mdc-list-item__primary-text,
    ::ng-deep .light-select-panel .mat-mdc-option.mdc-list-item--active .mdc-list-item__primary-text {
      background-color: #f1f5f9 !important;
      color: #0f172a !important;
    }
    ::ng-deep .light-select-panel .mat-mdc-option.mdc-list-item--selected,
    ::ng-deep .light-select-panel .mat-mdc-option.mdc-list-item--selected .mdc-list-item__primary-text {
      background-color: #e0f2fe !important;
      color: #0284c7 !important;
      font-weight: 700 !important;
    }
    ::ng-deep .light-select-panel .mat-mdc-option .mat-pseudo-checkbox {
      display: none !important;
    }

    .ruta-item-row {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px 4px 16px;
    }
    .ruta-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .ruta-number {
      font-size: 13px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .btn-del-ruta {
      transform: scale(0.8);
      margin: -8px -8px -8px 0;
    }
    .ruta-fields-grid {
      display: grid;
      grid-template-columns: 80px 1fr 1fr 1fr;
      gap: 0px 12px;
    }
    .ruta-fields-grid .itinerario-field {
      grid-column: 1 / -1;
    }
    
    .code-field input {
      text-align: center;
      font-weight: bold;
      color: #0ea5e9;
    }
  `]
})
export class FormTramitePrimigeniaDialogComponent implements OnInit {
  currentStep = 0;
  formEtapa1!: FormGroup;
  lineasInputControl = new FormControl('', { nonNullable: true });
  expedientes: ExpedienteItem[] = [{ numero: '', fecha: '' }];
  
  @ViewChild('addRutaModal') addRutaModal!: TemplateRef<any>;
  rutaForm!: FormGroup;

  
  processing = signal(false);
  saving = signal(false);
  esRenovacion = signal(false);

  vehiculosProcesados = signal<VehiculoProcesadoUI[]>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FormTramitePrimigeniaDialogData,
    private dialogRef: MatDialogRef<FormTramitePrimigeniaDialogComponent>,
    private fb: FormBuilder,
    private flotaService: FlotaEmpresaService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private matDialog: MatDialog
  ) {}

  // --------------------------------------------------------------------------
  // FORMATEADORES AUTOMÁTICOS
  // --------------------------------------------------------------------------

  formatExpediente(rawVal: string, defaultYear: number | string = new Date().getFullYear()): string {
    if (!rawVal) return '';
    const str = rawVal.trim().toUpperCase();
    if (!str) return '';

    const clean = str.replace(/^E[-_ ]*/i, '').trim();
    const parts = clean.split(/[-/]/);
    if (parts.length >= 2) {
      const numDigits = parts[0].replace(/\D/g, '');
      const numPart = numDigits ? numDigits.padStart(4, '0') : parts[0];
      const yearPart = parts[1].replace(/\D/g, '') || String(defaultYear);
      return `E-${numPart}-${yearPart}`;
    } else {
      const numDigits = clean.replace(/\D/g, '');
      if (numDigits) {
        const numPart = numDigits.padStart(4, '0');
        return `E-${numPart}-${defaultYear}`;
      }
    }
    return str.startsWith('E-') ? str : `E-${str}`;
  }

  formatResolucionPrimigenia(rawVal: string, defaultYear: number | string = new Date().getFullYear()): string {
    if (!rawVal) return '';
    const str = rawVal.trim().toUpperCase();
    if (!str) return '';

    const clean = str.replace(/^R[-_ ]*/i, '').trim();
    const parts = clean.split(/[-/]/);
    if (parts.length >= 2) {
      const numDigits = parts[0].replace(/\D/g, '');
      const numPart = numDigits ? numDigits.padStart(4, '0') : parts[0];
      const yearPart = parts[1].replace(/\D/g, '') || String(defaultYear);
      return `R-${numPart}-${yearPart}`;
    } else {
      const numDigits = clean.replace(/\D/g, '');
      if (numDigits) {
        const numPart = numDigits.padStart(4, '0');
        return `R-${numPart}-${defaultYear}`;
      }
    }
    return str.startsWith('R-') ? str : `R-${str}`;
  }

  formatResolucionHija(rawVal: string, tipoHija: string = '', defaultYear: number | string = new Date().getFullYear()): string {
    if (!rawVal) return '';
    let str = rawVal.trim().toUpperCase();
    if (!str) return '';

    // Extraer sufijo si se ingresó tipo '0123-2026 -FE', '0123-2026 -I', etc.
    const suffixMatch = str.match(/\s*[-_ ]\s*(FE|[ISRMDCO])$/i);
    if (suffixMatch) {
      if (this.formEtapa1 && !this.formEtapa1.get('tipo_resolucion_hija')?.value) {
        this.formEtapa1.patchValue({ tipo_resolucion_hija: suffixMatch[1].toUpperCase() });
      }
      str = str.substring(0, suffixMatch.index).trim();
    }

    const clean = str.replace(/^R[-_ ]*/i, '').trim();
    const parts = clean.split(/[-/]/);
    if (parts.length >= 2) {
      const numDigits = parts[0].replace(/\D/g, '');
      const numPart = numDigits ? numDigits.padStart(4, '0') : parts[0];
      const yearPart = parts[1].replace(/\D/g, '') || String(defaultYear);
      return `R-${numPart}-${yearPart}`;
    } else {
      const numDigits = clean.replace(/\D/g, '');
      if (numDigits) {
        const numPart = numDigits.padStart(4, '0');
        return `R-${numPart}-${defaultYear}`;
      }
    }

    return str.startsWith('R-') ? str : `R-${str}`;
  }

  ngOnInit(): void {
    this.formEtapa1 = this.fb.group({
      tipo_tramite: ['INCREMENTO', Validators.required],
      tipo_resolucion_hija: ['I'],
      nro_resolucion_hija: [''],
      fecha_emision_resolucion: [''],
      
      nueva_resolucion_primigenia: [''],
      nueva_fecha_emision: [''],
      nueva_fecha_inicio_vigencia: [''],
      nueva_fecha_fin_vigencia: [''],
      nuevas_rutas_array: this.fb.array([])
    });

    this.rutaForm = this.fb.group({
      codigo: ['', Validators.required],
      origen: ['', Validators.required],
      destino: ['', Validators.required],
      itinerario: [''],
      frecuencia: ['']
    });

    this.onTipoTramiteChange();
  }

  get nuevas_rutas_array(): FormArray {
    return this.formEtapa1.get('nuevas_rutas_array') as FormArray;
  }

  rutaDialogRef: any;

  abrirModalRuta(): void {
    const nextCode = (this.nuevas_rutas_array.length + 1).toString().padStart(2, '0');
    this.rutaForm.reset({ codigo: nextCode });
    this.rutaDialogRef = this.matDialog.open(this.addRutaModal, { width: '500px', panelClass: 'custom-dialog-container' });
  }

  guardarRutaModal(): void {
    if (this.rutaForm.invalid) return;
    this.nuevas_rutas_array.push(this.fb.group(this.rutaForm.value));
    if (this.rutaDialogRef) {
      this.rutaDialogRef.close();
    }
  }

  eliminarNuevaRuta(index: number): void {
    this.nuevas_rutas_array.removeAt(index);
    // Recalcular códigos para mantener consistencia
    this.nuevas_rutas_array.controls.forEach((ctrl, idx) => {
      ctrl.get('codigo')?.setValue((idx + 1).toString().padStart(2, '0'));
    });
  }

  agregarExpediente(): void {
    this.expedientes.push({ numero: '', fecha: '' });
  }

  eliminarExpediente(index: number): void {
    if (this.expedientes.length > 1) {
      this.expedientes.splice(index, 1);
    } else {
      this.expedientes[0] = { numero: '', fecha: '' };
    }
  }

  onExpedienteBlur(index: number): void {
    const item = this.expedientes[index];
    if (!item.numero) return;
    let year: number | string = new Date().getFullYear();
    if (item.fecha) {
      const y = new Date(item.fecha).getFullYear();
      if (y && !isNaN(y)) year = y;
    }
    item.numero = this.formatExpediente(item.numero, year);
  }

  onResolucionHijaBlur(): void {
    const curVal = this.formEtapa1.get('nro_resolucion_hija')?.value;
    if (!curVal) return;
    const tipoHija = this.formEtapa1.get('tipo_resolucion_hija')?.value;
    const fechaRes = this.formEtapa1.get('fecha_emision_resolucion')?.value;
    let year: number | string = new Date().getFullYear();
    if (fechaRes) {
      const y = new Date(fechaRes).getFullYear();
      if (y && !isNaN(y)) year = y;
    }
    this.formEtapa1.patchValue({
      nro_resolucion_hija: this.formatResolucionHija(curVal, tipoHija, year)
    });
  }

  onTipoResolucionHijaChange(tipo: string): void {
    const curVal = this.formEtapa1.get('nro_resolucion_hija')?.value;
    if (curVal) {
      const fechaRes = this.formEtapa1.get('fecha_emision_resolucion')?.value;
      let year: number | string = new Date().getFullYear();
      if (fechaRes) {
        const y = new Date(fechaRes).getFullYear();
        if (y && !isNaN(y)) year = y;
      }
      this.formEtapa1.patchValue({
        nro_resolucion_hija: this.formatResolucionHija(curVal, tipo, year)
      });
    }
  }

  onNuevaResolucionBlur(): void {
    const curVal = this.formEtapa1.get('nueva_resolucion_primigenia')?.value;
    if (!curVal) return;
    const fechaEmis = this.formEtapa1.get('nueva_fecha_emision')?.value;
    let year: number | string = new Date().getFullYear();
    if (fechaEmis) {
      const y = new Date(fechaEmis).getFullYear();
      if (y && !isNaN(y)) year = y;
    }
    this.formEtapa1.patchValue({
      nueva_resolucion_primigenia: this.formatResolucionPrimigenia(curVal, year)
    });
  }

  onTipoTramiteChange(): void {
    const tipo = this.formEtapa1.get('tipo_tramite')?.value;
    this.esRenovacion.set(tipo === 'RENOVACION');
    const mapTipo: Record<string, string> = {
      'INCREMENTO': 'I',
      'SUSTITUCION': 'S',
      'RENOVACION': 'R',
      'FE_DE_ERRATAS': 'FE',
      'MODIFICACION': 'M',
      'DUPLICADO': 'D',
      'CANJE': 'C',
      'CANCELACION': 'C'
    };
    if (mapTipo[tipo]) {
      this.formEtapa1.patchValue({ tipo_resolucion_hija: mapTipo[tipo] });
      this.onTipoResolucionHijaChange(mapTipo[tipo]);
    }
    
    // Validaciones dinámicas
    const ctrlRenovacion = this.formEtapa1.get('nueva_resolucion_primigenia');
    if (tipo === 'RENOVACION') {
      ctrlRenovacion?.setValidators([Validators.required]);
    } else {
      ctrlRenovacion?.clearValidators();
    }
    ctrlRenovacion?.updateValueAndValidity();
  }

  onCategoriaChange(v: VehiculoProcesadoUI, newCat: string): void {
    v.datos_tecnicos.categoria = newCat;
    const upperCat = (newCat || '').toUpperCase();
    if (upperCat === 'M2-C3' || upperCat === 'M3-C3' || upperCat.includes('C3')) {
      v.datos_tecnicos.clase = 'C3';
    } else if (v.datos_tecnicos.clase === 'C3' || v.datos_tecnicos.clase === 'MICROBUS') {
      v.datos_tecnicos.clase = '';
    }
  }

  async generarTucVehiculo(v: VehiculoProcesadoUI): Promise<void> {
    try {
      const resp: any = await this.http.get(`${environment.apiUrl}/tucs/siguiente-numero`).toPromise();
      if (resp?.siguienteNroTuc) {
        v.numero_tuc = resp.siguienteNroTuc;
        this.snackBar.open(`TUC asignada a ${v.placa}: ${resp.siguienteNroTuc}`, 'OK', { duration: 2500 });
      }
    } catch (e) {
      console.warn('Error generando TUC:', e);
    }
  }

  async generarTucsMasivos(): Promise<void> {
    const items = this.vehiculosProcesados();
    if (!items.length) return;

    try {
      const resp: any = await this.http.get(`${environment.apiUrl}/tucs/siguiente-numero`).toPromise();
      if (resp?.siguienteNroTuc) {
        const match = resp.siguienteNroTuc.match(/^([A-Za-z]+-?)(\d+)$/);
        if (match) {
          const prefix = match[1];
          let startNum = parseInt(match[2], 10);
          const digits = match[2].length;

          items.forEach((item) => {
            const numStr = startNum.toString().padStart(digits, '0');
            item.numero_tuc = `${prefix}${numStr}`;
            startNum++;
          });
          this.snackBar.open(`${items.length} N° de TUC correlativos asignados con éxito`, 'Excelente', { duration: 3000 });
        } else {
          items[0].numero_tuc = resp.siguienteNroTuc;
        }
      }
    } catch (e) {
      console.warn('Error generando TUCs masivos:', e);
      this.snackBar.open('No se pudieron autogenerar las TUCs correlativas', 'Cerrar', { duration: 3000 });
    }
  }

  irAEtapa2(): void {
    if (this.formEtapa1.invalid) return;
    this.currentStep = 1;
  }

  cerrar(updated = false): void {
    this.dialogRef.close(updated);
  }

  async procesarLineas(): Promise<void> {
    const rawText = this.lineasInputControl.value || '';
    const lineas = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    if (!lineas.length) {
      this.snackBar.open('Ingrese al menos una línea con información de vehículo', 'Entendido', { duration: 3000 });
      return;
    }

    this.processing.set(true);
    const tipoTramite = this.formEtapa1.get('tipo_tramite')?.value;
    const listaProcesada: VehiculoProcesadoUI[] = [];

    // Obtener siguiente TUC base si es necesario
    let baseTucPrefix = 'TE-';
    let baseTucNum = 0;
    let tucDigits = 6;
    try {
      const tucResp: any = await this.http.get(`${environment.apiUrl}/tucs/siguiente-numero`).toPromise();
      if (tucResp?.siguienteNroTuc) {
        const match = tucResp.siguienteNroTuc.match(/^([A-Za-z]+-?)(\d+)$/);
        if (match) {
          baseTucPrefix = match[1];
          baseTucNum = parseInt(match[2], 10);
          tucDigits = match[2].length;
        }
      }
    } catch (e) {
      console.warn('No se pudo precargar TUC base:', e);
    }

    for (const linea of lineas) {
      const partes = linea.split(/\s+/).map(p => p.trim()).filter(Boolean);
      if (!partes.length) continue;

      let placaIn = '';
      let placaOut: string | undefined = undefined;
      let rutasArray: string[] = [];

      if (tipoTramite === 'SUSTITUCION' && partes.length >= 2) {
        placaIn = partes[0].toUpperCase();
        placaOut = partes[1].toUpperCase();
        if (partes.length > 2) {
          rutasArray = partes[2].split(',').map(r => r.trim().toUpperCase()).filter(Boolean);
        }
      } else {
        placaIn = partes[0].toUpperCase();
        if (partes.length > 1) {
          rutasArray = partes[1].split(',').map(r => r.trim().toUpperCase()).filter(Boolean);
        }
      }

      if (!placaIn || placaIn.length < 6) continue;

      // Autocompletado desde DB vehiculos_data o API PCM
      const datosTech = await this.buscarDatosTecnicosPlaca(placaIn);

      let assignedTuc = '';
      if (baseTucNum > 0 && tipoTramite !== 'CANCELACION') {
        const numStr = baseTucNum.toString().padStart(tucDigits, '0');
        assignedTuc = `${baseTucPrefix}${numStr}`;
        baseTucNum++;
      }

      listaProcesada.push({
        placa: placaIn,
        placa_saliente: placaOut,
        rutas: rutasArray.length ? rutasArray : (this.data.rutas || []),
        tipo_operacion: tipoTramite,
        numero_tuc: assignedTuc,
        origen_datos: datosTech.origen,
        datos_tecnicos: datosTech.data
      });
    }

    this.vehiculosProcesados.set(listaProcesada);
    this.processing.set(false);

    if (listaProcesada.length > 0) {
      this.snackBar.open(`${listaProcesada.length} vehículo(s) procesado(s), autocompletados y correlativos TUC asignados.`, 'Excelente', { duration: 4000 });
    }
  }

  private async buscarDatosTecnicosPlaca(placa: string): Promise<{ origen: 'DB_LOCAL' | 'PCM_API' | 'MANUAL'; data: any }> {
    const cleanPlaca = placa.trim().toUpperCase();
    try {
      // 1. Consulta al endpoint backend que integra BD local vehiculos_data y API PCM SUNARP de guillermo.pe
      const localResp: any = await this.http.get(`${environment.apiUrl}/vehiculos-data/buscar/placa/${cleanPlaca}`).toPromise();
      if (localResp?.success && localResp?.data) {
        const d = localResp.data;
        const origen = (localResp.origen === 'PCM_API' || d.fuente_datos === 'PCM_SUNARP_API') ? 'PCM_API' : 'DB_LOCAL';
        
        let cat = (d.categoria || 'M2').toUpperCase();
        let clase = d.clase || '';
        if (clase === 'MICROBUS') {
          clase = cat.includes('C3') ? 'C3' : '';
        } else if (!clase && cat.includes('C3')) {
          clase = 'C3';
        }

        let anioFab = d.anio_fabricacion;
        if (anioFab && Number(anioFab) <= 1900) {
          anioFab = null;
        }
        let anioMod = d.anio_modelo;
        if (anioMod && Number(anioMod) <= 1900) {
          anioMod = null;
        }

        return {
          origen: origen,
          data: {
            placa: d.placa_actual || d.placa || cleanPlaca,
            marca: d.marca || d.marca_vehiculo || '',
            modelo: d.modelo || d.modelo_vehiculo || '',
            anio_fabricacion: anioFab,
            anio_modelo: anioMod,
            color: d.color || '',
            categoria: cat,
            carroceria: d.carroceria || d.tipo_carroceria || '',
            clase: clase,
            combustible: d.combustible || 'DIESEL',
            numero_motor: d.numero_motor || '',
            numero_serie: d.numero_serie || d.vin || '',
            vin: d.vin || d.numero_serie || '',
            pasajeros: d.numero_pasajeros || d.pasajeros || '',
            asientos: d.numero_asientos || d.asientos || '',
            cilindros: d.cilindrada || d.cilindros || '',
            ejes: d.numero_ejes || d.ejes || '',
            ruedas: d.numero_ruedas || d.ruedas || '',
            peso_bruto: d.peso_bruto || '',
            peso_neto: d.peso_neto || d.peso_seco || '',
            carga_util: d.carga_util || '',
            largo: d.longitud || d.largo || '',
            ancho: d.ancho || '',
            alto: d.altura || d.alto || '',
            observaciones: d.observaciones || (d.propietario ? `Propietario SUNARP: ${d.propietario}` : '')
          }
        };
      }
    } catch (e) {
      console.warn('Búsqueda vehiculos-data / PCM falló:', e);
    }

    // 2. Fallback base predeterminada
    return {
      origen: 'MANUAL',
      data: {
        placa: cleanPlaca,
        categoria: 'M2',
        clase: '',
        combustible: 'DIESEL'
      }
    };
  }

  guardarTramite(): void {
    const items = this.vehiculosProcesados();
    if (!items.length) return;

    this.saving.set(true);
    const valEtapa1 = this.formEtapa1.getRawValue();

    const nuevas_rutas_detalle = valEtapa1.nuevas_rutas_array && valEtapa1.nuevas_rutas_array.length > 0
      ? valEtapa1.nuevas_rutas_array.map((r: any) => ({
          codigo: r.codigo?.trim().toUpperCase() || '',
          origen: r.origen?.trim().toUpperCase() || '',
          destino: r.destino?.trim().toUpperCase() || '',
          itinerario: r.itinerario?.trim().toUpperCase() || '',
          frecuencia: r.frecuencia?.trim().toUpperCase() || ''
        }))
      : [];

    const nuevasRutasArr = nuevas_rutas_detalle.map((r: any) => r.codigo);

    const numExpedientesStr = this.expedientes
      .map(e => (e.numero || '').trim())
      .filter(Boolean)
      .join(', ');

    const fechasExpedientesStr = this.expedientes
      .map(e => {
        if (!e.fecha) return '';
        return ((e.fecha as any) instanceof Date) ? (e.fecha as any).toISOString().split('T')[0] : String(e.fecha).trim();
      })
      .filter(Boolean)
      .join(', ');

    const payload: TramiteMasivoRequest = {
      ruc: this.data.ruc,
      razon_social: this.data.razon_social,
      nro_resolucion_primigenia: this.data.nro_resolucion_primigenia,
      tipo_tramite: valEtapa1.tipo_tramite,
      tipo_resolucion_hija: valEtapa1.tipo_resolucion_hija || undefined,
      num_expediente: numExpedientesStr || undefined,
      fecha_expediente: fechasExpedientesStr || undefined,
      nro_resolucion_hija: valEtapa1.nro_resolucion_hija?.trim().toUpperCase() || undefined,
      fecha_emision_resolucion: valEtapa1.fecha_emision_resolucion ? new Date(valEtapa1.fecha_emision_resolucion).toISOString() : undefined,
      
      es_renovacion: this.esRenovacion(),
      nueva_resolucion_primigenia: valEtapa1.nueva_resolucion_primigenia?.trim().toUpperCase() || undefined,
      nueva_fecha_emision: valEtapa1.nueva_fecha_emision ? new Date(valEtapa1.nueva_fecha_emision).toISOString() : undefined,
      nueva_fecha_inicio_vigencia: valEtapa1.nueva_fecha_inicio_vigencia ? new Date(valEtapa1.nueva_fecha_inicio_vigencia).toISOString() : undefined,
      nueva_fecha_fin_vigencia: valEtapa1.nueva_fecha_fin_vigencia ? new Date(valEtapa1.nueva_fecha_fin_vigencia).toISOString() : undefined,
      nuevas_rutas: nuevasRutasArr,
      nuevas_rutas_detalle: nuevas_rutas_detalle,

      vehiculos: items.map(v => ({
        placa: v.placa,
        placa_saliente: v.placa_saliente,
        rutas: v.rutas,
        tipo_operacion: v.tipo_operacion,
        numero_tuc: v.numero_tuc,
        datos_tecnicos: v.datos_tecnicos
      }))
    };

    this.flotaService.procesarTramiteMasivo(payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.snackBar.open(`Trámite ${valEtapa1.tipo_tramite} procesado con éxito: ${res.creados} creados, ${res.actualizados} actualizados.`, 'Excelente', { duration: 4000 });
        this.cerrar(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(`Error al procesar trámite: ${err?.error?.detail || err.message}`, 'Cerrar', { duration: 4500 });
      }
    });
  }
}
