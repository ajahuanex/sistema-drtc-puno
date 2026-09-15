import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { FlotaEmpresaService, ItemTramiteVehiculo, TramiteMasivoRequest } from '../../services/flota-empresa.service';
import { environment } from '../../../environments/environment';

export interface FormTramitePrimigeniaDialogData {
  ruc: string;
  razon_social?: string;
  nro_resolucion_primigenia: string;
  fecha_inicio_vigencia?: string;
  fecha_fin_vigencia?: string;
  rutas?: string[];
}

export interface VehiculoProcesadoUI {
  placa: string;
  placa_saliente?: string;
  rutas: string[];
  tipo_operacion: string;
  origen_datos: 'DB_LOCAL' | 'PCM_API' | 'MANUAL';
  numero_tuc?: string;
  datos_tecnicos: {
    placa: string;
    marca?: string;
    modelo?: string;
    anio_fabricacion?: number;
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
    MatExpansionModule
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
                
                <mat-form-field appearance="outline" floatLabel="always">
                  <mat-label>Tipo de Trámite / Resolución Hija *</mat-label>
                  <mat-select formControlName="tipo_tramite" required (selectionChange)="onTipoTramiteChange()">
                    <mat-option value="INCREMENTO">➕ Incremento de Flota (Alta)</mat-option>
                    <mat-option value="SUSTITUCION">🔄 Sustitución de Vehículo (Alta / Baja)</mat-option>
                    <mat-option value="RENOVACION">📜 Renovación de Resolución (Nueva Primigenia)</mat-option>
                    <mat-option value="DUPLICADO">📄 Duplicado de TUC / Expediente</mat-option>
                    <mat-option value="CANJE">🏷️ Canje de TUC</mat-option>
                    <mat-option value="MODIFICACION">✏️ Modificación de Características</mat-option>
                    <mat-option value="CANCELACION">❌ Cancelación / Baja de Flota</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" floatLabel="always">
                  <mat-label>Número de Expediente</mat-label>
                  <input matInput formControlName="num_expediente" placeholder="Ej: E-0123-2026">
                  <mat-icon matSuffix color="primary">folder</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" floatLabel="always">
                  <mat-label>Fecha de Expediente</mat-label>
                  <input matInput type="date" formControlName="fecha_expediente">
                </mat-form-field>

                <mat-form-field appearance="outline" floatLabel="always">
                  <mat-label>Número de Res. Hija / Documento</mat-label>
                  <input matInput formControlName="nro_resolucion_hija" placeholder="Ej: R-0375-2026-DRTC">
                </mat-form-field>

                <mat-form-field appearance="outline" floatLabel="always">
                  <mat-label>Fecha Emisión Resolución</mat-label>
                  <input matInput type="date" formControlName="fecha_emision_resolucion">
                </mat-form-field>

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
                        <input matInput formControlName="nueva_resolucion_primigenia" placeholder="Ej: R-0123-2026" required>
                      </mat-form-field>

                      <mat-form-field appearance="outline" floatLabel="always">
                        <mat-label>Fecha Emisión Nueva Res.</mat-label>
                        <input matInput type="date" formControlName="nueva_fecha_emision">
                      </mat-form-field>

                      <mat-form-field appearance="outline" floatLabel="always">
                        <mat-label>Inicio Vigencia (Vigencia Desde)</mat-label>
                        <input matInput type="date" formControlName="nueva_fecha_inicio_vigencia">
                      </mat-form-field>

                      <mat-form-field appearance="outline" floatLabel="always">
                        <mat-label>Fin Vigencia (Vigencia Hasta)</mat-label>
                        <input matInput type="date" formControlName="nueva_fecha_fin_vigencia">
                      </mat-form-field>

                      <mat-form-field appearance="outline" floatLabel="always" class="style-full">
                        <mat-label>Nuevas Rutas Autorizadas (separadas por coma)</mat-label>
                        <input matInput formControlName="nuevas_rutas_str" placeholder="Ej: 01, 02, 03-A">
                      </mat-form-field>
                    </div>

                    <div class="alert-renovacion">
                      <mat-icon>info</mat-icon>
                      <span>Al guardar la Renovación, toda la flota de la resolución anterior <strong>{{ data.nro_resolucion_primigenia }}</strong> pasará a estado <strong>INHABILITADO</strong> y sus observaciones se actualizarán con <strong>"| RENOVADO(N° NUEVA RES)"</strong>.</span>
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
                <button mat-flat-button color="accent" class="btn-process" (click)="procesarLineas()" [disabled]="processing() || !lineasInputControl.value?.trim()">
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
                  <mat-icon class="text-emerald">task_alt</mat-icon>
                  <span>Vehículos Procesados ({{ vehiculosProcesados().length }}) - Haga clic en cada uno para verificar sus 23 datos técnicos</span>
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
                            {{ v.origen_datos }}
                          </span>
                        </mat-panel-title>
                        <mat-panel-description>
                          <span>{{ v.datos_tecnicos.marca || 'MARCA' }} {{ v.datos_tecnicos.modelo || '' }} ({{ v.datos_tecnicos.categoria || 'Cat' }})</span>
                          <span class="rutas-tag">Rutas: {{ v.rutas.join(', ') || 'Todas' }}</span>
                        </mat-panel-description>
                      </mat-expansion-panel-header>

                      <!-- EDICIÓN INDIVIDUAL DE LOS 23 CAMPOS TÉCNICOS -->
                      <div class="tech-specs-edit-grid">
                        <div class="grid-4-cols">
                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>1. PLACA *</mat-label>
                            <input matInput [(ngModel)]="v.datos_tecnicos.placa" readonly style="font-weight:800; font-family:monospace;">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>2. MARCA</mat-label>
                            <input matInput [(ngModel)]="v.datos_tecnicos.marca">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>3. MODELO</mat-label>
                            <input matInput [(ngModel)]="v.datos_tecnicos.modelo">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>4. AÑO FAB.</mat-label>
                            <input matInput type="number" [(ngModel)]="v.datos_tecnicos.anio_fabricacion">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>5. COLOR</mat-label>
                            <input matInput [(ngModel)]="v.datos_tecnicos.color">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>6. CATEGORÍA</mat-label>
                            <mat-select [(ngModel)]="v.datos_tecnicos.categoria">
                              <mat-option value="M3">M3 - Bus (>5 Tn)</mat-option>
                              <mat-option value="M2">M2 - Minibús / Combi</mat-option>
                              <mat-option value="M1">M1 - Auto Colectivo</mat-option>
                              <mat-option value="N1">N1 - Camioneta Carga</mat-option>
                              <mat-option value="N2">N2 - Camión Mediano</mat-option>
                              <mat-option value="N3">N3 - Camión Pesado</mat-option>
                            </mat-select>
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>7. CARROCERÍA</mat-label>
                            <input matInput [(ngModel)]="v.datos_tecnicos.carroceria">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>8. CLASE</mat-label>
                            <input matInput [(ngModel)]="v.datos_tecnicos.clase">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>9. COMBUSTIBLE</mat-label>
                            <mat-select [(ngModel)]="v.datos_tecnicos.combustible">
                              <mat-option value="DIESEL">DIESEL</mat-option>
                              <mat-option value="GASOLINA">GASOLINA</mat-option>
                              <mat-option value="GNV">GNV</mat-option>
                              <mat-option value="GLP">GLP</mat-option>
                            </mat-select>
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>10. N° MOTOR</mat-label>
                            <input matInput [(ngModel)]="v.datos_tecnicos.numero_motor">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>11. N° SERIE / VIN</mat-label>
                            <input matInput [(ngModel)]="v.datos_tecnicos.numero_serie">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>12. N° PASAJEROS</mat-label>
                            <input matInput type="number" [(ngModel)]="v.datos_tecnicos.pasajeros">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>13. N° ASIENTOS</mat-label>
                            <input matInput type="number" [(ngModel)]="v.datos_tecnicos.asientos">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>14. CILINDROS</mat-label>
                            <input matInput type="number" [(ngModel)]="v.datos_tecnicos.cilindros">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>15. EJES</mat-label>
                            <input matInput type="number" [(ngModel)]="v.datos_tecnicos.ejes">
                          </mat-form-field>

                          <mat-form-field appearance="outline" floatLabel="always">
                            <mat-label>16. RUEDAS</mat-label>
                            <input matInput type="number" [(ngModel)]="v.datos_tecnicos.ruedas">
                          </mat-form-field>
                        </div>
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
  `,
  styles: [`
    .tramite-dialog-container {
      background-color: #0f172a;
      color: #f8fafc;
      border-radius: 16px;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .dialog-header {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      padding: 16px 24px;
      border-bottom: 1px solid #334155;
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
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(56, 189, 248, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #38bdf8;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
    }

    .dialog-subtitle {
      margin: 2px 0 0 0;
      font-size: 12px;
      color: #94a3b8;
    }

    .dialog-body {
      padding: 16px 24px;
      max-height: 78vh;
      overflow-y: auto;
    }

    .tab-padding {
      padding-top: 16px;
    }

    /* PRIMIGENIA INFO CARD */
    .primigenia-info-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-left: 4px solid #38bdf8;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 20px;
    }

    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #334155;
    }

    .badge-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 14px;
      color: #38bdf8;
    }

    .status-badge-active {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 800;
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      padding: 3px 10px;
      border-radius: 9999px;
      border: 1px solid rgba(34, 197, 94, 0.3);

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #22c55e;
      }
    }

    .card-body-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .info-item {
      font-size: 13px;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .label {
        color: #94a3b8;
        font-size: 11px;
        font-weight: 600;
      }

      .val {
        color: #f8fafc;
      }

      &.style-full {
        grid-column: 1 / -1;
      }
    }

    .rutas-chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .chip-ruta {
      background: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.4);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }

    .form-grid-etapa1 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .style-full {
      grid-column: 1 / -1;
    }

    .renovacion-box {
      background: rgba(245, 158, 11, 0.08);
      border: 1px dashed #f59e0b;
      border-radius: 12px;
      padding: 14px;
      margin-top: 8px;
    }

    .renovacion-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fbbf24;
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 12px;
    }

    .renovacion-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .alert-renovacion {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(239, 68, 68, 0.15);
      border-left: 3px solid #ef4444;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 11px;
      color: #fca5a5;
      margin-top: 8px;
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn-next {
      background: #2563eb;
      color: white;
      font-weight: 700;
    }

    /* ETAPA 2 STYLES */
    .instruction-box {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 14px;
    }

    .inst-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #38bdf8;
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 6px;
    }

    .inst-format {
      font-size: 12px;
      code {
        background: #0f172a;
        padding: 2px 6px;
        border-radius: 4px;
        color: #38bdf8;
        font-family: monospace;
      }
    }

    .process-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }

    .btn-process {
      background: #0284c7;
      color: white;
      font-weight: 700;
    }

    .processed-summary-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 14px;
      color: #f8fafc;
      margin-bottom: 10px;
    }

    .vehiculos-accordion-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 350px;
      overflow-y: auto;
    }

    .vehiculo-panel {
      background: #1e293b !important;
      border: 1px solid #334155 !important;
      color: #f8fafc !important;
    }

    .placa-badge {
      background: #0f172a;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 800;
      margin-right: 8px;
    }

    .sustituye-tag {
      color: #f59e0b;
      font-size: 11px;
      margin-right: 8px;
    }

    .origin-tag {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 4px;
      background: #475569;
      color: #fff;
      &.db { background: #059669; }
      &.pcm { background: #2563eb; }
    }

    .rutas-tag {
      font-size: 11px;
      color: #94a3b8;
    }

    .tech-specs-edit-grid {
      padding-top: 12px;
    }

    .grid-4-cols {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .dialog-actions-final {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #1e293b;
      margin-top: 20px;
    }

    .btn-save-final {
      background: #16a34a;
      color: white;
      font-weight: 700;
    }
  `]
})
export class FormTramitePrimigeniaDialogComponent implements OnInit {
  currentStep = 0;
  formEtapa1!: FormGroup;
  lineasInputControl = new FormControl('', { nonNullable: true });
  
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
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.formEtapa1 = this.fb.group({
      tipo_tramite: ['INCREMENTO', Validators.required],
      num_expediente: [''],
      fecha_expediente: [''],
      nro_resolucion_hija: [''],
      fecha_emision_resolucion: [''],
      
      // Renovación
      nueva_resolucion_primigenia: [''],
      nueva_fecha_emision: [''],
      nueva_fecha_inicio_vigencia: [''],
      nueva_fecha_fin_vigencia: [''],
      nuevas_rutas_str: [(this.data.rutas || []).join(', ')]
    });
  }

  onTipoTramiteChange(): void {
    const tipo = this.formEtapa1.get('tipo_tramite')?.value;
    this.esRenovacion.set(tipo === 'RENOVACION');
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

      listaProcesada.push({
        placa: placaIn,
        placa_saliente: placaOut,
        rutas: rutasArray.length ? rutasArray : (this.data.rutas || []),
        tipo_operacion: tipoTramite,
        origen_datos: datosTech.origen,
        datos_tecnicos: datosTech.data
      });
    }

    this.vehiculosProcesados.set(listaProcesada);
    this.processing.set(false);

    if (listaProcesada.length > 0) {
      this.snackBar.open(`${listaProcesada.length} vehículo(s) procesado(s) y autocompletados con éxito.`, 'Excelente', { duration: 3500 });
    }
  }

  private async buscarDatosTecnicosPlaca(placa: string): Promise<{ origen: 'DB_LOCAL' | 'PCM_API' | 'MANUAL'; data: any }> {
    try {
      // 1. Consulta en la DB local vehiculos_data
      const localResp: any = await this.http.get(`${environment.apiUrl}/vehiculos-data/buscar/placa/${placa}`).toPromise();
      if (localResp?.success && localResp?.data) {
        const d = localResp.data;
        return {
          origen: 'DB_LOCAL',
          data: {
            placa: placa,
            marca: d.marca || d.marca_vehiculo,
            modelo: d.modelo || d.modelo_vehiculo,
            anio_fabricacion: d.anio_fabricacion || d.anio_modelo,
            color: d.color,
            categoria: d.categoria || d.clase,
            carroceria: d.carroceria || d.tipo_carroceria,
            clase: d.clase,
            combustible: d.combustible,
            numero_motor: d.numero_motor,
            numero_serie: d.vin || d.numero_serie,
            vin: d.vin || d.numero_serie,
            pasajeros: d.pasajeros,
            asientos: d.asientos,
            cilindros: d.cilindros,
            ejes: d.ejes,
            ruedas: d.ruedas,
            peso_bruto: d.peso_bruto,
            peso_neto: d.peso_neto,
            carga_util: d.carga_util,
            largo: d.largo,
            ancho: d.ancho,
            alto: d.alto,
            observaciones: d.observaciones
          }
        };
      }
    } catch (e) {
      console.warn('Busqueda local vehiculos_data falló, buscando en API PCM fallback...');
    }

    // 2. Fallback base predeterminada
    return {
      origen: 'MANUAL',
      data: {
        placa: placa,
        categoria: 'M3',
        combustible: 'DIESEL'
      }
    };
  }

  guardarTramite(): void {
    const items = this.vehiculosProcesados();
    if (!items.length) return;

    this.saving.set(true);
    const valEtapa1 = this.formEtapa1.getRawValue();

    const nuevasRutasArr = valEtapa1.nuevas_rutas_str
      ? valEtapa1.nuevas_rutas_str.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean)
      : [];

    const payload: TramiteMasivoRequest = {
      ruc: this.data.ruc,
      razon_social: this.data.razon_social,
      nro_resolucion_primigenia: this.data.nro_resolucion_primigenia,
      tipo_tramite: valEtapa1.tipo_tramite,
      num_expediente: valEtapa1.num_expediente?.trim().toUpperCase() || undefined,
      fecha_expediente: valEtapa1.fecha_expediente ? new Date(valEtapa1.fecha_expediente).toISOString() : undefined,
      nro_resolucion_hija: valEtapa1.nro_resolucion_hija?.trim().toUpperCase() || undefined,
      fecha_emision_resolucion: valEtapa1.fecha_emision_resolucion ? new Date(valEtapa1.fecha_emision_resolucion).toISOString() : undefined,
      
      es_renovacion: this.esRenovacion(),
      nueva_resolucion_primigenia: valEtapa1.nueva_resolucion_primigenia?.trim().toUpperCase() || undefined,
      nueva_fecha_emision: valEtapa1.nueva_fecha_emision ? new Date(valEtapa1.nueva_fecha_emision).toISOString() : undefined,
      nueva_fecha_inicio_vigencia: valEtapa1.nueva_fecha_inicio_vigencia ? new Date(valEtapa1.nueva_fecha_inicio_vigencia).toISOString() : undefined,
      nueva_fecha_fin_vigencia: valEtapa1.nueva_fecha_fin_vigencia ? new Date(valEtapa1.nueva_fecha_fin_vigencia).toISOString() : undefined,
      nuevas_rutas: nuevasRutasArr,

      vehiculos: items.map(v => ({
        placa: v.placa,
        placa_saliente: v.placa_saliente,
        rutas: v.rutas,
        tipo_operacion: v.tipo_operacion,
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
