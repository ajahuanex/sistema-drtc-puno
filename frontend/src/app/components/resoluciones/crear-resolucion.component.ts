import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ResolucionService } from '../../services/resolucion.service';
import { EmpresaService } from '../../services/empresa.service';
import { ExpedienteService } from '../../services/expediente.service';
import { ConfiguracionService } from '../../services/configuracion.service';
import { Resolucion, ResolucionCreate } from '../../models/resolucion.model';
import { Empresa } from '../../models/empresa.model';
import { Expediente } from '../../models/expediente.model';
import { EmpresaSelectorComponent } from '../../shared/empresa-selector.component';

@Component({
  selector: 'app-crear-resolucion',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    EmpresaSelectorComponent
  ],
  template: `
    <div class="crear-resolucion-container">
      <!-- Header -->
      <div class="header">
        <div class="title-section">
          <h1>{{ esEdicion() ? 'Editar Resolución' : 'Crear Nueva Resolución' }}</h1>
          <p>{{ esEdicion() ? 'Modifica los datos de la resolución' : 'Crea una nueva resolución en el sistema' }}</p>

        </div>
        <div class="actions">
          <button mat-button routerLink="/resoluciones">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>{{ esEdicion() ? 'Cargando resolución...' : 'Preparando formulario...' }}</p>
        </div>
      } @else {
        <form [formGroup]="resolucionForm" (ngSubmit)="onSubmit()" class="resolucion-form">
          <div class="form-grid">
            <!-- Información de la Empresa -->
            <div class="empresa-section full-width">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>business</mat-icon>
                    EMPRESA
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  @if (empresaSeleccionada()) {
                    <div class="empresa-details">
                      <div class="empresa-item">
                        <span class="label">RUC:</span>
                        <span class="value">{{ empresaSeleccionada()?.ruc }}</span>
                      </div>
                      <div class="empresa-item">
                        <span class="label">RAZÓN SOCIAL:</span>
                        <span class="value">{{ empresaSeleccionada()?.razonSocial?.principal | uppercase }}</span>
                      </div>
                      <div class="empresa-item">
                        <span class="label">ESTADO:</span>
                        <span class="value estado-chip" [class]="'estado-' + empresaSeleccionada()?.estado?.toLowerCase()">
                          {{ empresaSeleccionada()?.estado | uppercase }}
                        </span>
                      </div>
                    </div>
                  } @else {
                    <app-empresa-selector
                      [label]="'EMPRESA'"
                      [placeholder]="'Buscar por RUC, razón social o código'"
                      [hint]="'Seleccione la empresa para la cual se creará la resolución'"
                      [required]="true"
                      [empresaId]="resolucionForm.get('empresaId')?.value"
                      (empresaSeleccionada)="onEmpresaSeleccionadaBuscador($event)"
                      (empresaIdChange)="resolucionForm.patchValue({ empresaId: $event })">
                    </app-empresa-selector>
                  }
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Indicador de Tipo de Resolución -->
            @if (expedienteSeleccionado()) {
              <div class="tipo-resolucion-indicator full-width">
                <mat-card class="indicator-card">
                  <mat-card-content>
                    <div class="indicator-content">
                      <mat-icon [class]="getIconoTipoResolucion()" class="indicator-icon">
                        @if (expedienteSeleccionado()?.tipoTramite === 'AUTORIZACION_NUEVA') {
                          new_releases
                        } @else if (expedienteSeleccionado()?.tipoTramite === 'RENOVACION') {
                          refresh
                        } @else {
                          add_circle
                        }
                      </mat-icon>
                      <div class="indicator-text">
                        <h3>Creando Resolución de {{ expedienteSeleccionado()?.tipoTramite | uppercase }}</h3>
                        <p>
                          @if (expedienteSeleccionado()?.tipoTramite === 'AUTORIZACION_NUEVA') {
                            Esta será una resolución PADRE con fechas de vigencia propias
                          } @else if (expedienteSeleccionado()?.tipoTramite === 'RENOVACION') {
                            Esta será una resolución PADRE que renueva una autorización existente
                          } @else {
                            Esta será una resolución HIJA que hereda fechas de vigencia de una resolución padre
                          }
                        </p>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            }

            <!-- Selector de Expediente -->
            <div class="expediente-section full-width">
              <!-- Debug Info -->
              <div class="debug-info">
                <p>🔍 Debug: Empresa seleccionada: {{ empresaSeleccionada()?.id || 'NONE' }}</p>
                <p>🔍 Debug: Total expedientes: {{ expedientes().length }}</p>
                <p>🔍 Debug: Expedientes filtrados: {{ expedientesFiltrados().length }}</p>
                <p>🔍 Debug: Empresa ID en formulario: {{ resolucionForm.get('empresaId')?.value || 'NONE' }}</p>
                <p>🔍 Debug: Empresa ID (signal): {{ empresaIdForm() || 'NONE' }}</p>
                <p>🔍 Debug: Fecha inicio: {{ resolucionForm.get('fechaVigenciaInicio')?.value || 'NONE' }}</p>
                <p>🔍 Debug: Años vigencia: {{ resolucionForm.get('aniosVigencia')?.value || 'NONE' }}</p>
                <p>🔍 Debug: Fecha fin calculada: {{ fechaVigenciaFinCalculada() }}</p>
                <p>🔍 Debug: Expediente seleccionado: {{ expedienteSeleccionado()?.nroExpediente || 'NONE' }}</p>
                <p>🔍 Debug: Tipo trámite: {{ expedienteSeleccionado()?.tipoTramite || 'NONE' }}</p>
                <p>🔍 Debug: Mostrar fecha fin: {{ mostrarFechaVigenciaFin() }}</p>
                <button mat-button type="button" (click)="debugEstadoActual()" class="debug-button">
                  🔍 DEBUG ESTADO
                </button>
                <button mat-button type="button" (click)="debugFechaVigencia()" class="debug-button">
                  🔍 DEBUG FECHA VIGENCIA
                </button>
              </div>

              @if (!empresaSeleccionada()) {
                <div class="warning-message">
                  <mat-icon>warning</mat-icon>
                  <span>DEBE SELECCIONAR UNA EMPRESA PRIMERO PARA VER LOS EXPEDIENTES DISPONIBLES</span>
                </div>
              } @else {
                <mat-form-field 
                  appearance="outline" 
                  class="form-field required-field"
                  [class.field-error]="resolucionForm.get('expedienteId')?.hasError('required') && resolucionForm.get('expedienteId')?.touched"
                >
                  <mat-label>
                    <span class="required-indicator">*</span>
                    EXPEDIENTE
                  </mat-label>
                  <mat-select formControlName="expedienteId" required (selectionChange)="onExpedienteChange($event)">
                    <mat-option value="">SELECCIONE UN EXPEDIENTE</mat-option>
                    @for (expediente of expedientesFiltrados(); track expediente.id) {
                      <mat-option [value]="expediente.id">
                        {{ expediente.nroExpediente }} - {{ expediente.tipoTramite | uppercase }} - {{ expediente.descripcion || 'Sin descripción' }}
                        @if (expediente.estado) {
                          ({{ expediente.estado }})
                        }
                      </mat-option>
                    }
                  </mat-select>
                  <mat-hint>
                    @if (expedienteSeleccionado()) {
                      Expediente: {{ expedienteSeleccionado()?.nroExpediente }} | Tipo de Trámite: {{ expedienteSeleccionado()?.tipoTramite | uppercase }}
                    } @else if (expedientesFiltrados().length > 0) {
                      {{ expedientesFiltrados().length }} expediente(s) disponible(s) para {{ empresaSeleccionada()?.razonSocial?.principal | uppercase }}
                    } @else {
                      NO HAY EXPEDIENTES DISPONIBLES PARA ESTA EMPRESA
                    }
                  </mat-hint>
                  @if (resolucionForm.get('expedienteId')?.hasError('required') && resolucionForm.get('expedienteId')?.touched) {
                    <mat-error>EL EXPEDIENTE ES REQUERIDO</mat-error>
                  }
                </mat-form-field>
              }
            </div>

            <!-- Número de Resolución -->
            <mat-form-field appearance="outline" class="form-field required-field"
              [class.field-error]="resolucionForm.get('numeroBase')?.hasError('required') && resolucionForm.get('numeroBase')?.touched">
              <mat-label>
                <span class="required-indicator">*</span>
                NÚMERO DE RESOLUCIÓN
              </mat-label>
              <input matInput 
                     formControlName="numeroBase" 
                     placeholder="0001" 
                     maxlength="4"
                     class="numero-input"
                     (blur)="onNumeroBaseBlur()"
                     (input)="onNumeroBaseChange()">
              <mat-hint>Formato: {{ numeroResolucionCompleto() }}</mat-hint>
              @if (resolucionForm.get('numeroBase')?.hasError('required') && resolucionForm.get('numeroBase')?.touched) {
                <mat-error>EL NÚMERO ES REQUERIDO</mat-error>
              }
              @if (resolucionForm.get('numeroBase')?.hasError('duplicate')) {
                <mat-error>ESTE NÚMERO YA EXISTE PARA EL AÑO {{ anioEmision() }}</mat-error>
              }
            </mat-form-field>

            <!-- Fecha de Emisión -->
            <mat-form-field appearance="outline" class="form-field required-field"
              [class.field-error]="resolucionForm.get('fechaEmision')?.hasError('required') && resolucionForm.get('fechaEmision')?.touched">
              <mat-label>
                <span class="required-indicator">*</span>
                FECHA DE EMISIÓN
              </mat-label>
              <input matInput [matDatepicker]="pickerEmision" formControlName="fechaEmision" required (dateChange)="onFechaEmisionChange()">
              <mat-datepicker-toggle matSuffix [for]="pickerEmision"></mat-datepicker-toggle>
              <mat-datepicker #pickerEmision></mat-datepicker>
              <mat-hint>Fecha actual: {{ fechaActualLima() }}</mat-hint>
              @if (resolucionForm.get('fechaEmision')?.hasError('required') && resolucionForm.get('fechaEmision')?.touched) {
                <mat-error>LA FECHA DE EMISIÓN ES REQUERIDA</mat-error>
              }
            </mat-form-field>

            <!-- Resolución Padre (para RENOVACIÓN y resoluciones HIJA) -->
            @if (mostrarResolucionPadre()) {
              <div class="resolucion-padre-section full-width">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>
                    @if (expedienteSeleccionado()?.tipoTramite === 'RENOVACION') {
                      RESOLUCIÓN PADRE A RENOVAR (OPCIONAL)
                    } @else {
                      RESOLUCIÓN PADRE (requerida para {{ expedienteSeleccionado()?.tipoTramite | uppercase }})
                    }
                  </mat-label>
                  <mat-select formControlName="resolucionPadreId" [required]="expedienteSeleccionado()?.tipoTramite !== 'RENOVACION'" (selectionChange)="onResolucionPadreChange()">
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
                  <mat-hint>
                    @if (expedienteSeleccionado()?.tipoTramite === 'RENOVACION') {
                      Opcional: Seleccione la resolución padre que desea renovar (si aplica)
                    } @else {
                      Seleccione la resolución padre de la cual heredará las fechas de vigencia
                    }
                  </mat-hint>
                  @if (resolucionForm.get('resolucionPadreId')?.hasError('required') && resolucionForm.get('resolucionPadreId')?.touched) {
                    <mat-error>DEBE SELECCIONAR LA RESOLUCIÓN PADRE</mat-error>
                  }
                </mat-form-field>
              </div>
            }

            <!-- Fecha de Vigencia Inicio -->
            @if (mostrarFechaVigenciaInicio()) {
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>FECHA DE INICIO DE VIGENCIA</mat-label>
                <input matInput [matDatepicker]="pickerVigenciaInicio" formControlName="fechaVigenciaInicio" required>
                <mat-datepicker-toggle matSuffix [for]="pickerVigenciaInicio"></mat-datepicker-toggle>
                <mat-datepicker #pickerVigenciaInicio></mat-datepicker>
                <mat-hint>Fecha desde la cual será vigente la resolución</mat-hint>
                @if (resolucionForm.get('fechaVigenciaInicio')?.hasError('required') && resolucionForm.get('fechaVigenciaInicio')?.touched) {
                  <mat-error>LA FECHA DE INICIO DE VIGENCIA ES REQUERIDA</mat-error>
                }
              </mat-form-field>
            }

            <!-- Años de Vigencia -->
            @if (mostrarAniosVigencia()) {
              <mat-form-field appearance="outline" class="form-field required-field"
                [class.field-error]="resolucionForm.get('aniosVigencia')?.hasError('required') && resolucionForm.get('aniosVigencia')?.touched">
                <mat-label>
                  <span class="required-indicator">*</span>
                  AÑOS DE VIGENCIA
                </mat-label>
                <input matInput type="number" formControlName="aniosVigencia" min="1" max="10" required>
                <mat-hint>Duración en años de la vigencia</mat-hint>
                @if (resolucionForm.get('aniosVigencia')?.hasError('required') && resolucionForm.get('aniosVigencia')?.touched) {
                  <mat-error>LOS AÑOS DE VIGENCIA SON REQUERIDOS</mat-error>
                }
                @if (resolucionForm.get('aniosVigencia')?.hasError('min')) {
                  <mat-error>MÍNIMO 1 AÑO</mat-error>
                }
                @if (resolucionForm.get('aniosVigencia')?.hasError('max')) {
                  <mat-error>MÁXIMO 10 AÑOS</mat-error>
                }
              </mat-form-field>
            }

            <!-- Fecha de Vigencia Fin (calculada) -->
            @if (mostrarFechaVigenciaFin()) {
              <div class="fecha-vigencia-fin full-width">
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon class="info-icon">schedule</mat-icon>
                      FECHA DE FIN DE VIGENCIA
                    </mat-card-title>
                    <mat-card-subtitle>Calculada automáticamente</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-item">
                      <span class="label">VIGENCIA HASTA:</span>
                      <span class="value fecha-calculada">{{ fechaVigenciaFinCalculada() }}</span>
                    </div>
                    @if (resolucionForm.get('fechaVigenciaInicio')?.value && resolucionForm.get('aniosVigencia')?.value) {
                      <div class="info-item">
                        <span class="label">DURACIÓN:</span>
                        <span class="value">{{ resolucionForm.get('aniosVigencia')?.value || 0 }} AÑO(S)</span>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            }

            <!-- Descripción -->
            <div class="descripcion-section full-width">
              <div class="descripcion-header">
                <mat-label class="descripcion-label">
                  <span class="required-indicator">*</span>
                  DESCRIPCIÓN
                </mat-label>
                <button 
                  mat-button 
                  type="button" 
                  color="accent" 
                  (click)="generarDescripcionAutomatica()"
                  [disabled]="!expedienteSeleccionado() || !empresaSeleccionada()"
                  class="generar-descripcion-btn"
                >
                  <mat-icon>auto_fix_high</mat-icon>
                  GENERAR AUTOMÁTICAMENTE
                </button>
              </div>
              
              <mat-form-field appearance="outline" class="form-field full-width required-field"
                [class.field-error]="resolucionForm.get('descripcion')?.hasError('required') && resolucionForm.get('descripcion')?.touched">
                <textarea matInput formControlName="descripcion" rows="3" placeholder="Descripción detallada de la resolución"></textarea>
                <mat-hint>Descripción de la resolución y su propósito</mat-hint>
                @if (resolucionForm.get('descripcion')?.hasError('required') && resolucionForm.get('descripcion')?.touched) {
                  <mat-error>LA DESCRIPCIÓN ES REQUERIDA</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Observaciones -->
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>OBSERVACIONES</mat-label>
              <textarea matInput formControlName="observaciones" rows="3" placeholder="Observaciones adicionales"></textarea>
              <mat-hint>Observaciones o notas adicionales</mat-hint>
            </mat-form-field>
          </div>

          <!-- Acciones del Formulario -->
          <div class="form-actions">
            <button mat-button type="button" routerLink="/resoluciones">
              Cancelar
            </button>
            <button 
              mat-raised-button 
              color="primary" 
              type="submit" 
              [disabled]="resolucionForm.invalid || submitting()">
              @if (submitting()) {
                <mat-spinner diameter="20"></mat-spinner>
              }
              {{ esEdicion() ? 'Actualizar' : 'Crear' }} Resolución
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .crear-resolucion-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .title-section h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 28px;
      font-weight: 600;
    }

    .title-section p {
      margin: 8px 0 0 0;
      color: #6c757d;
      font-size: 16px;
    }

    .edicion-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 12px 16px;
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      color: #856404;
      font-size: 14px;
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
    }

    .resolucion-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
      
      &.readonly-form {
        .mat-form-field {
          pointer-events: none;
          opacity: 0.7;
        }
        
        .mat-select {
          pointer-events: none;
        }
        
        .mat-datepicker-toggle {
          pointer-events: none;
        }
        
        .generar-descripcion-btn {
          pointer-events: none;
          opacity: 0.5;
        }
        
        .form-actions {
          display: none;
        }
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .form-field {
      width: 100%;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .empresa-section {
      margin-bottom: 16px;
    }

    .empresa-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .empresa-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
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

    .tipo-resolucion-indicator {
      margin-bottom: 16px;
    }

    .indicator-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-left: 4px solid #007bff;
    }

    .indicator-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .indicator-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #007bff;
    }

    .icono-primigenia {
      color: #28a745 !important;
    }

    .icono-renovacion {
      color: #ffc107 !important;
    }

    .icono-hija {
      color: #17a2b8 !important;
    }

    .indicator-text h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
    }

    .indicator-text p {
      margin: 0;
      color: #6c757d;
      font-size: 14px;
      line-height: 1.4;
    }

    .warning-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
      border: 2px solid #ffc107;
      border-radius: 8px;
      color: #856404;
      font-weight: 500;
    }

    .warning-message mat-icon {
      color: #ffc107;
    }

    .debug-info {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
      font-family: monospace;
      font-size: 12px;
    }

    .debug-info p {
      margin: 4px 0;
      color: #6c757d;
    }

    .debug-button {
      margin-top: 8px;
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .debug-button:hover {
      background: #0056b3;
    }

    .fecha-vigencia-fin {
      margin-bottom: 16px;
    }

    .info-card {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-left: 4px solid #2196f3;
    }

    .info-card mat-card-header {
      padding-bottom: 8px;
    }

    .info-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: #1976d2;
      margin: 0;
    }

    .info-card mat-card-subtitle {
      color: #666;
      font-size: 12px;
      margin: 0;
    }

    .info-icon {
      color: #2196f3;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item .label {
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }

    .info-item .value {
      font-weight: 500;
      color: #1976d2;
      font-size: 14px;
    }

    .fecha-calculada {
      font-size: 16px !important;
      font-weight: 600 !important;
      color: #1565c0 !important;
    }

    .numero-input {
      text-align: center;
      font-weight: 600;
      color: #2c3e50;
      min-width: 80px;
      max-width: 120px;
    }

    .info-card {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border: 2px solid #2196f3;
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

    .info-item .label {
      font-weight: 600;
      color: #1976d2;
    }

    .info-item .value {
      color: #2c3e50;
      font-weight: 500;
    }

    .descripcion-section {
      .descripcion-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .descripcion-label {
          font-weight: 600;
          color: #495057;
          font-size: 16px;
        }
        
        .generar-descripcion-btn {
          font-size: 12px;
          padding: 4px 8px;
          min-height: 32px;
          
          mat-icon {
            font-size: 16px;
            margin-right: 4px;
          }
        }
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      padding: 24px 0;
      border-top: 1px solid #e9ecef;
    }

    .form-actions button {
      min-width: 120px;
    }

    @media (max-width: 768px) {
      .crear-resolucion-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
      }
    }

    /* Estilos para campos obligatorios */
    .required-field .mat-form-field-label::after {
      content: ' *';
      color: #dc3545;
      font-weight: bold;
    }

    .required-indicator {
      color: #dc3545;
      font-weight: bold;
      margin-right: 4px;
    }

    .field-error {
      border-color: #dc3545 !important;
    }

    .field-error .mat-form-field-outline {
      color: #dc3545 !important;
    }

    .field-error .mat-form-field-label {
      color: #dc3545 !important;
    }

    .required-field .mat-form-field-outline-thick {
      border-width: 2px;
    }

    .required-field:not(.field-error) .mat-form-field-outline-thick {
      border-color: #007bff !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrearResolucionComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private resolucionService = inject(ResolucionService);
  private empresaService = inject(EmpresaService);
  private expedienteService = inject(ExpedienteService);
  private configuracionService = inject(ConfiguracionService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Inputs para reutilización
  @Input() empresaId?: string;
  @Input() esResolucionHija?: boolean;
  @Input() resolucionPadreId?: string;

  // Output para notificar cuando se crea una resolución
  @Output() resolucionCreada = new EventEmitter<any>();

  // Subject para manejo de cleanup
  private destroy$ = new Subject<void>();

  // Signals
  loading = signal(false);
  submitting = signal(false);
  empresas = signal<Empresa[]>([]);
  resolucionesPadre = signal<Resolucion[]>([]);
  expedientes = signal<Expediente[]>([]);
  expedientesFiltrados = signal<Expediente[]>([]);
  expedienteSeleccionado = signal<Expediente | null>(null);
  empresaIdForm = signal<string | null>(null);
  formularioListo = signal(false);
  resolucionId = signal<string | null>(null);

  // Los signals fechaVigenciaInicioSignal y aniosVigenciaSignal ya existen más arriba

  // Debug: Log del estado de expedientesFiltrados
  debugExpedientesFiltrados = computed(() => {
    const expedientes = this.expedientesFiltrados();
    console.log('🔍 Debug expedientesFiltrados signal:', expedientes);
    return expedientes;
  });



  // Detectar si se está abriendo desde detalles de empresa
  empresaSeleccionada = computed(() => {
    // Obtener empresa desde input o query params
    if (this.empresaId) {
      const empresa = this.empresas().find(e => e.id === this.empresaId);
      console.log('🔍 Empresa desde input empresaId:', this.empresaId, 'encontrada:', !!empresa);
      if (empresa) return empresa;
    }

    const empresaId = this.route.snapshot.queryParams['empresaId'];
    if (empresaId) {
      const empresa = this.empresas().find(e => e.id === empresaId);
      console.log('🔍 Empresa desde query params:', empresaId, 'encontrada:', !!empresa);
      if (empresa) return empresa;
    }

    // Usar el signal reactivo del formulario
    const empresaFormId = this.empresaIdForm();
    if (empresaFormId) {
      const empresa = this.empresas().find(e => e.id === empresaFormId);
      console.log('🔍 Empresa desde signal empresaIdForm:', empresaFormId, 'encontrada:', !!empresa);
      if (empresa) return empresa;
    }

    console.log('🔍 No se encontró empresa seleccionada');
    return null;
  });

  // Determinar si mostrar selector de resolución padre
  mostrarResolucionPadre = computed(() => {
    const expediente = this.expedienteSeleccionado();
    if (!expediente) return false;

    // Mostrar para RENOVACION (siempre requiere padre)
    if (expediente.tipoTramite === 'RENOVACION') return true;

    // Mostrar para tipos HIJO (INCREMENTO, SUSTITUCION, OTROS)
    if (expediente.tipoTramite === 'INCREMENTO' || expediente.tipoTramite === 'SUSTITUCION' || expediente.tipoTramite === 'OTROS') return true;

    // No mostrar para PRIMIGENIA
    return false;
  });

  // Determinar si mostrar selector de expediente
  mostrarSelectorExpediente = computed(() => {
    return true; // Siempre mostrar para resoluciones principales
  });

  // Signals para reactividad del formulario
  numeroBaseSignal = signal('');
  fechaEmisionSignal = signal<Date>(new Date());
  tipoTramiteSignal = signal('AUTORIZACION_NUEVA');
  fechaVigenciaInicioSignal = signal<Date | null>(null);
  aniosVigenciaSignal = signal(5);

  // Computed properties
  esEdicion = computed(() => !!this.resolucionId());
  anioActual = computed(() => new Date().getFullYear());
  anioEmision = computed(() => {
    const fechaEmision = this.fechaEmisionSignal();
    return fechaEmision ? new Date(fechaEmision).getFullYear() : this.anioActual();
  });
  numeroResolucionCompleto = computed(() => {
    const numeroBase = this.numeroBaseSignal();
    const anio = this.anioEmision();

    if (numeroBase) {
      const numeroFormateado = numeroBase.toString().padStart(4, '0');
      return `R-${numeroFormateado}-${anio}`;
    }
    return `R-0000-${anio}`;
  });

  mostrarFechaVigenciaInicio = computed(() => {
    const expediente = this.expedienteSeleccionado();
    return expediente?.tipoTramite === 'AUTORIZACION_NUEVA' || expediente?.tipoTramite === 'RENOVACION';
  });

  mostrarAniosVigencia = computed(() => {
    const expediente = this.expedienteSeleccionado();
    return expediente?.tipoTramite === 'AUTORIZACION_NUEVA' || expediente?.tipoTramite === 'RENOVACION';
  });

  mostrarFechaVigenciaFin = computed(() => {
    const expediente = this.expedienteSeleccionado();
    return expediente?.tipoTramite === 'AUTORIZACION_NUEVA' || expediente?.tipoTramite === 'RENOVACION';
  });

  fechaVigenciaFinCalculada = computed(() => {
    // Usar signals para reactividad
    const fechaInicio = this.fechaVigenciaInicioSignal();
    const aniosVigencia = this.aniosVigenciaSignal();
    const mostrarFecha = this.mostrarFechaVigenciaFin();

    // Debug detallado para entender qué está pasando
    console.log('🔍 Computed fechaVigenciaFinCalculada (usando signals):', {
      fechaInicio: fechaInicio ? `PRESENTE: ${fechaInicio}` : 'AUSENTE',
      aniosVigencia: aniosVigencia ? `PRESENTE: ${aniosVigencia}` : 'AUSENTE',
      mostrarFecha: mostrarFecha ? 'SI' : 'NO',
      fechaInicioType: typeof fechaInicio,
      aniosVigenciaType: typeof aniosVigencia
    });

    // Verificación simple: si tenemos fecha y años, calcular
    if (fechaInicio && aniosVigencia && mostrarFecha) {
      try {
        const fechaFin = this.calcularFechaVigenciaFin(fechaInicio, aniosVigencia);
        if (fechaFin) {
          const resultado = this.formatearFechaEspanol(fechaFin);
          console.log('✅ Computed: Fecha calculada exitosamente:', resultado);
          return resultado;
        }
      } catch (error) {
        console.error('Error en cálculo del computed:', error);
      }
    }

    // Si no se puede calcular, mostrar mensaje apropiado
    if (!fechaInicio) return 'SELECCIONE FECHA DE INICIO';
    if (!aniosVigencia) return 'SELECCIONE AÑOS DE VIGENCIA';
    if (!mostrarFecha) return 'NO APLICA PARA ESTE TRÁMITE';

    return 'CALCULANDO...';
  });

  tipoResolucionCalculado = computed(() => {
    const expediente = this.expedienteSeleccionado();
    if (expediente?.tipoTramite === 'AUTORIZACION_NUEVA' || expediente?.tipoTramite === 'RENOVACION') {
      return 'PADRE';
    }
    return 'HIJO';
  });

  // Formulario
  resolucionForm: FormGroup;

  constructor() {
    this.resolucionForm = this.fb.group({
      empresaId: ['', Validators.required],
      expedienteId: ['', Validators.required],
      numeroBase: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]],
      fechaEmision: [new Date(), Validators.required],
      resolucionPadreId: [null],
      fechaVigenciaInicio: [null],
      aniosVigencia: [
        this.configuracionService.aniosVigenciaDefault(),
        [
          Validators.required,
          Validators.min(this.configuracionService.minAniosVigencia()),
          Validators.max(this.configuracionService.maxAniosVigencia())
        ]
      ],
      descripcion: ['', Validators.required],
      observaciones: ['']
    });

    // Inicializar signals con valores del formulario
    this.aniosVigenciaSignal.set(this.configuracionService.aniosVigenciaDefault());

    // Suscribirse a cambios en las configuraciones para actualizar el formulario
    this.suscribirseACambiosEnConfiguraciones();
  }

  /**
   * Se suscribe a cambios en las configuraciones del sistema
   */
  private suscribirseACambiosEnConfiguraciones(): void {
    // Crear un computed que observe cambios en las configuraciones
    const configuracionesWatcher = computed(() => {
      const aniosDefault = this.configuracionService.aniosVigenciaDefault();
      const minAnios = this.configuracionService.minAniosVigencia();
      const maxAnios = this.configuracionService.maxAniosVigencia();

      return { aniosDefault, minAnios, maxAnios };
    });

    // Suscribirse a cambios en las configuraciones
    effect(() => {
      const config = configuracionesWatcher();
      console.log('🔧 Configuraciones actualizadas:', config);

      // Actualizar el formulario con los nuevos valores
      const aniosVigenciaControl = this.resolucionForm.get('aniosVigencia');
      if (aniosVigenciaControl) {
        // Solo actualizar si el valor actual es el valor por defecto anterior
        const valorActual = aniosVigenciaControl.value;
        if (valorActual === this.aniosVigenciaSignal()) {
          aniosVigenciaControl.setValue(config.aniosDefault);
          this.aniosVigenciaSignal.set(config.aniosDefault);
          console.log('🔄 Campo aniosVigencia actualizado a:', config.aniosDefault);
        }

        // Actualizar validadores
        aniosVigenciaControl.setValidators([
          Validators.required,
          Validators.min(config.minAnios),
          Validators.max(config.maxAnios)
        ]);
        aniosVigenciaControl.updateValueAndValidity();
      }
    });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();

    // Verificar si estamos en modo edición
    const resolucionId = this.route.snapshot.params['id'];
    if (resolucionId) {
      this.resolucionId.set(resolucionId);
      this.cargarResolucionParaEdicion(resolucionId);
    }

    // Si hay empresa en input o query params, configurar el formulario
    if (this.empresaId) {
      this.resolucionForm.get('empresaId')?.setValue(this.empresaId);
      this.empresaIdForm.set(this.empresaId);
      this.cargarExpedientesPorEmpresa(this.empresaId);
    } else {
      const empresaId = this.route.snapshot.queryParams['empresaId'];
      if (empresaId) {
        this.resolucionForm.get('empresaId')?.setValue(empresaId);
        this.empresaIdForm.set(empresaId);
        this.cargarExpedientesPorEmpresa(empresaId);
      }
    }

    // Escuchar cambios en la empresa seleccionada
    this.resolucionForm.get('empresaId')?.valueChanges.subscribe(empresaId => {
      console.log('🔄 Cambio en empresaId del formulario:', empresaId);
      this.empresaIdForm.set(empresaId);

      if (empresaId) {
        this.cargarExpedientesPorEmpresa(empresaId);
        // Limpiar expediente seleccionado cuando cambie la empresa
        this.resolucionForm.get('expedienteId')?.setValue(null);
        this.expedienteSeleccionado.set(null);
        // Limpiar campos dependientes
        this.resolucionForm.get('resolucionPadreId')?.setValue(null);
        this.resolucionForm.get('fechaVigenciaInicio')?.setValue(null);
        this.resolucionForm.get('aniosVigencia')?.setValue(5);
      } else {
        // Si no hay empresa seleccionada, limpiar expedientes
        this.expedientesFiltrados.set([]);
        this.expedienteSeleccionado.set(null);
      }
    });

    // Escuchar cambios en fecha de vigencia inicio y años de vigencia para actualizar fecha fin
    this.resolucionForm.get('fechaVigenciaInicio')?.valueChanges.subscribe((fecha) => {
      console.log('🔄 Cambio en fecha de vigencia inicio:', fecha);
      this.fechaVigenciaInicioSignal.set(fecha);
    });

    this.resolucionForm.get('aniosVigencia')?.valueChanges.subscribe((anios) => {
      console.log('🔄 Cambio en años de vigencia:', anios);
      this.aniosVigenciaSignal.set(anios);
    });

    // Escuchar cambios en expedienteId
    this.resolucionForm.get('expedienteId')?.valueChanges.subscribe(expedienteId => {
      console.log('🔄 Cambio en expedienteId:', expedienteId);
      if (expedienteId) {
        const expediente = this.expedientesFiltrados().find(e => e.id === expedienteId);
        if (expediente) {
          console.log('📋 Expediente seleccionado desde listener:', expediente);
          this.expedienteSeleccionado.set(expediente);
        }
      } else {
        this.expedienteSeleccionado.set(null);
      }
    });

    // Marcar el formulario como listo después de la inicialización
    setTimeout(() => {
      this.formularioListo.set(true);
      console.log('✅ Formulario marcado como listo');
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatosIniciales(): void {
    this.loading.set(true);

    // Cargar empresas
    this.empresaService.getEmpresas().subscribe(empresas => {
      this.empresas.set(empresas);
    });

    // Cargar expedientes
    this.expedienteService.getExpedientes().subscribe(expedientes => {
      this.expedientes.set(expedientes);
      this.expedientesFiltrados.set(expedientes);
    });

    this.loading.set(false);
  }

  cargarExpedientesPorEmpresa(empresaId: string): void {
    console.log('🔍 Cargando expedientes para empresa:', empresaId);

    const expedientes = this.expedientes();
    console.log('📋 Total de expedientes disponibles:', expedientes.length);

    const expedientesFiltrados = expedientes.filter(e => e.empresaId === empresaId);

    console.log('📋 Expedientes encontrados para la empresa:', expedientesFiltrados.length);
    expedientesFiltrados.forEach(exp => {
      console.log(`  - ${exp.nroExpediente}: ${exp.descripcion} (${exp.tipoTramite})`);
    });

    this.expedientesFiltrados.set(expedientesFiltrados);
    console.log('✅ Signal expedientesFiltrados actualizado:', this.expedientesFiltrados());

    // Si no hay expedientes para esta empresa, mostrar mensaje
    if (expedientesFiltrados.length === 0) {
      this.snackBar.open(
        'NO HAY EXPEDIENTES DISPONIBLES PARA ESTA EMPRESA',
        'CERRAR',
        { duration: 3000 }
      );
    }
  }

  /**
   * Carga una resolución existente para edición
   */
  cargarResolucionParaEdicion(resolucionId: string): void {
    this.loading.set(true);

    this.resolucionService.getResolucionById(resolucionId).subscribe({
      next: (resolucion) => {
        console.log('📋 Resolución cargada para edición:', resolucion);

        // Calcular años de vigencia basándose en las fechas
        let aniosVigencia = this.configuracionService.aniosVigenciaDefault();
        if (resolucion.fechaVigenciaInicio && resolucion.fechaVigenciaFin) {
          const fechaInicio = new Date(resolucion.fechaVigenciaInicio);
          const fechaFin = new Date(resolucion.fechaVigenciaFin);
          const diffTime = fechaFin.getTime() - fechaInicio.getTime();
          const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
          aniosVigencia = Math.round(diffYears);
        }

        // Poblar el formulario con los datos existentes
        this.resolucionForm.patchValue({
          empresaId: resolucion.empresaId,
          expedienteId: resolucion.expedienteId,
          numeroBase: resolucion.nroResolucion?.split('-')[1] || '',
          fechaEmision: new Date(resolucion.fechaEmision),
          resolucionPadreId: resolucion.resolucionPadreId,
          fechaVigenciaInicio: resolucion.fechaVigenciaInicio ? new Date(resolucion.fechaVigenciaInicio) : null,
          aniosVigencia: aniosVigencia,
          descripcion: resolucion.descripcion,
          observaciones: resolucion.observaciones
        });

        // Actualizar signals
        this.empresaIdForm.set(resolucion.empresaId);
        this.numeroBaseSignal.set(resolucion.nroResolucion?.split('-')[1] || '');
        this.fechaEmisionSignal.set(new Date(resolucion.fechaEmision));
        this.fechaVigenciaInicioSignal.set(resolucion.fechaVigenciaInicio ? new Date(resolucion.fechaVigenciaInicio) : null);
        this.aniosVigenciaSignal.set(aniosVigencia);

        // Cargar expedientes de la empresa
        this.cargarExpedientesPorEmpresa(resolucion.empresaId);

        // Cargar expediente seleccionado
        if (resolucion.expedienteId) {
          const expediente = this.expedientes().find(e => e.id === resolucion.expedienteId);
          if (expediente) {
            this.expedienteSeleccionado.set(expediente);
            this.tipoTramiteSignal.set(expediente.tipoTramite);
          }
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando resolución para edición:', error);
        this.loading.set(false);
        this.snackBar.open('Error al cargar la resolución para edición', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onEmpresaSeleccionadaBuscador(empresa: Empresa | null): void {
    if (empresa) {
      console.log('🏢 Empresa seleccionada desde buscador:', empresa);

      // Actualizar el formulario (esto hará que empresaSeleccionada computed se actualice)
      this.resolucionForm.patchValue({ empresaId: empresa.id });

      // Limpiar expediente seleccionado ya que cambió la empresa
      this.expedienteSeleccionado.set(null);
      this.resolucionForm.patchValue({ expedienteId: '' });

      // Filtrar expedientes por la nueva empresa
      this.filtrarExpedientesPorEmpresa(empresa.id);
    } else {
      console.log('🏢 Empresa deseleccionada');
      this.expedienteSeleccionado.set(null);
      this.resolucionForm.patchValue({
        empresaId: '',
        expedienteId: ''
      });
    }
  }

  private filtrarExpedientesPorEmpresa(empresaId: string): void {
    // Esta lógica ya existe en el computed expedientesFiltrados
    // Solo necesitamos asegurar que se actualice
    console.log('🔍 Filtrando expedientes para empresa:', empresaId);
  }

  onExpedienteChange(event: any): void {
    const expedienteId = event.value;

    if (expedienteId) {
      // Buscar en los expedientes filtrados por empresa
      const expediente = this.expedientesFiltrados().find(e => e.id === expedienteId);
      if (expediente) {
        console.log('📋 Expediente seleccionado:', expediente);
        this.expedienteSeleccionado.set(expediente);
        this.tipoTramiteSignal.set(expediente.tipoTramite);
        this.actualizarFormularioPorTipoTramite(expediente.tipoTramite);
      } else {
        console.warn('⚠️ Expediente no encontrado en la lista filtrada');
        this.expedienteSeleccionado.set(null);
      }
    } else {
      this.expedienteSeleccionado.set(null);
      this.tipoTramiteSignal.set('AUTORIZACION_NUEVA');
    }
  }

  private actualizarFormularioPorTipoTramite(tipoTramite: string): void {
    const esResolucionPadre = tipoTramite === 'AUTORIZACION_NUEVA' || tipoTramite === 'RENOVACION';
    const esResolucionHija = tipoTramite === 'INCREMENTO' || tipoTramite === 'SUSTITUCION' || tipoTramite === 'OTROS';

    if (tipoTramite === 'RENOVACION') {
      this.cargarResolucionesPadre();
      this.resolucionForm.get('resolucionPadreId')?.enable();
      // CAMBIO: Hacer opcional para RENOVACION
      this.resolucionForm.get('resolucionPadreId')?.clearValidators();
      this.resolucionForm.get('fechaVigenciaInicio')?.enable();
      this.resolucionForm.get('aniosVigencia')?.enable();

    } else if (esResolucionPadre) {
      this.resolucionForm.get('resolucionPadreId')?.disable();
      this.resolucionForm.get('resolucionPadreId')?.clearValidators();
      this.resolucionForm.get('fechaVigenciaInicio')?.enable();
      this.resolucionForm.get('aniosVigencia')?.enable();

    } else if (esResolucionHija) {
      this.cargarResolucionesPadre();
      this.resolucionForm.get('resolucionPadreId')?.enable();
      this.resolucionForm.get('resolucionPadreId')?.setValidators([Validators.required]);
      this.resolucionForm.get('fechaVigenciaInicio')?.disable();
      this.resolucionForm.get('aniosVigencia')?.disable();
    }

    this.resolucionForm.updateValueAndValidity();
  }

  private cargarResolucionesPadre(): void {
    const empresaId = this.empresaSeleccionada()?.id || this.resolucionForm.get('empresaId')?.value;
    if (!empresaId) return;

    const expediente = this.expedienteSeleccionado();
    if (!expediente) return;

    this.resolucionService.getResoluciones().subscribe({
      next: (resoluciones) => {
        const resolucionesEmpresa = resoluciones.filter(r => r.empresaId === empresaId);
        let resolucionesPadre: Resolucion[] = [];

        if (expediente.tipoTramite === 'RENOVACION') {
          resolucionesPadre = resolucionesEmpresa.filter(r =>
            r.tipoResolucion === 'PADRE' &&
            r.estaActivo &&
            r.estado === 'VIGENTE' &&
            r.fechaVigenciaFin &&
            new Date(r.fechaVigenciaFin) > new Date()
          );
        } else if (expediente.tipoTramite === 'INCREMENTO' || expediente.tipoTramite === 'SUSTITUCION' || expediente.tipoTramite === 'OTROS') {
          resolucionesPadre = resolucionesEmpresa.filter(r =>
            r.tipoResolucion === 'PADRE' &&
            r.estaActivo &&
            r.estado === 'VIGENTE' &&
            r.fechaVigenciaFin &&
            new Date(r.fechaVigenciaFin) > new Date()
          );
        }

        this.resolucionesPadre.set(resolucionesPadre);
      }
    });
  }

  onResolucionPadreChange(): void {
    const resolucionPadreId = this.resolucionForm.get('resolucionPadreId')?.value;

    if (resolucionPadreId) {
      const resolucionPadre = this.resolucionesPadre().find(r => r.id === resolucionPadreId);

      if (resolucionPadre) {
        const expediente = this.expedienteSeleccionado();
        if (expediente?.tipoTramite === 'RENOVACION') {
          this.configurarFechasParaRenovacion(resolucionPadre);
        } else if (expediente?.tipoTramite === 'INCREMENTO' || expediente?.tipoTramite === 'SUSTITUCION' || expediente?.tipoTramite === 'OTROS') {
          this.configurarFechasHeredadasDelPadre(resolucionPadreId);
        }
      }
    }
  }

  private configurarFechasParaRenovacion(resolucionPadre: Resolucion): void {
    if (resolucionPadre.fechaVigenciaFin) {
      const fechaVencimiento = new Date(resolucionPadre.fechaVigenciaFin);
      const fechaSugerida = new Date(fechaVencimiento);
      fechaSugerida.setDate(fechaSugerida.getDate() + 1);

      this.resolucionForm.get('fechaVigenciaInicio')?.setValue(fechaSugerida);
      this.fechaVigenciaInicioSignal.set(fechaSugerida);

      if (resolucionPadre.fechaVigenciaInicio && resolucionPadre.fechaVigenciaFin) {
        const fechaInicio = new Date(resolucionPadre.fechaVigenciaInicio);
        const fechaFin = new Date(resolucionPadre.fechaVigenciaFin);
        const aniosVigencia = fechaFin.getFullYear() - fechaInicio.getFullYear();
        this.resolucionForm.get('aniosVigencia')?.setValue(aniosVigencia);
        this.aniosVigenciaSignal.set(aniosVigencia);
      }
    }
  }

  private configurarFechasHeredadasDelPadre(resolucionPadreId: string): void {
    this.resolucionService.getResolucionById(resolucionPadreId).subscribe(resolucionPadre => {
      if (resolucionPadre) {
        if (resolucionPadre.fechaVigenciaInicio) {
          this.resolucionForm.get('fechaVigenciaInicio')?.setValue(resolucionPadre.fechaVigenciaInicio);
          this.fechaVigenciaInicioSignal.set(resolucionPadre.fechaVigenciaInicio);
        }

        if (resolucionPadre.fechaVigenciaFin && resolucionPadre.fechaVigenciaInicio) {
          const fechaInicio = new Date(resolucionPadre.fechaVigenciaInicio);
          const fechaFin = new Date(resolucionPadre.fechaVigenciaFin);
          const aniosVigencia = fechaFin.getFullYear() - fechaInicio.getFullYear();
          this.resolucionForm.get('aniosVigencia')?.setValue(aniosVigencia);
          this.aniosVigenciaSignal.set(aniosVigencia);
        }
      }
    });
  }

  onNumeroBaseChange(): void {
    const numeroBase = this.resolucionForm.get('numeroBase')?.value;
    if (numeroBase) {
      const numeroLimpio = numeroBase.replace(/\D/g, '').slice(0, 4);
      this.numeroBaseSignal.set(numeroLimpio);

      if (numeroLimpio !== numeroBase) {
        this.resolucionForm.get('numeroBase')?.setValue(numeroLimpio);
      }
    }
  }

  onNumeroBaseBlur(): void {
    const numeroBase = this.resolucionForm.get('numeroBase')?.value;
    if (numeroBase) {
      const numeroFormateado = numeroBase.toString().padStart(4, '0');
      if (numeroFormateado !== numeroBase) {
        this.resolucionForm.get('numeroBase')?.setValue(numeroFormateado);
      }
      
      // Validar si el número ya existe
      this.validarNumeroResolucion(numeroFormateado);
    }
  }

  private validarNumeroResolucion(numeroBase: string): void {
    const anio = this.anioEmision();
    const numeroCompleto = `R-${numeroBase}-${anio}`;
    
    // Llamar al servicio para verificar si existe
    this.resolucionService.getResoluciones().subscribe({
      next: (resoluciones) => {
        const existe = resoluciones.some(r => r.nroResolucion === numeroCompleto);
        
        if (existe) {
          // Marcar el campo como inválido
          this.resolucionForm.get('numeroBase')?.setErrors({
            duplicate: true,
            message: `Ya existe una resolución con el número ${numeroCompleto}`
          });
          
          this.snackBar.open(
            `⚠️ Ya existe una resolución con el número ${numeroCompleto}`,
            'Cerrar',
            { duration: 5000 }
          );
        } else {
          // Limpiar el error de duplicado si existía
          const errors = this.resolucionForm.get('numeroBase')?.errors;
          if (errors && errors['duplicate']) {
            delete errors['duplicate'];
            delete errors['message'];
            const hasOtherErrors = Object.keys(errors).length > 0;
            this.resolucionForm.get('numeroBase')?.setErrors(hasOtherErrors ? errors : null);
          }
        }
      },
      error: (error) => {
        console.error('Error al validar número de resolución:', error);
      }
    });
  }

  onFechaEmisionChange(): void {
    const fechaEmision = this.resolucionForm.get('fechaEmision')?.value;
    if (fechaEmision) {
      this.fechaEmisionSignal.set(fechaEmision);
    }
  }

  getIconoTipoResolucion(): string {
    const tipoTramite = this.expedienteSeleccionado()?.tipoTramite;
    if (tipoTramite === 'AUTORIZACION_NUEVA') {
      return 'icono-primigenia';
    } else if (tipoTramite === 'RENOVACION') {
      return 'icono-renovacion';
    } else {
      return 'icono-hija';
    }
  }

  /**
   * Genera la descripción automática de la resolución basándose en las opciones seleccionadas
   */
  generarDescripcionAutomatica(): void {
    const expediente = this.expedienteSeleccionado();
    const empresa = this.empresaSeleccionada();
    const aniosVigencia = this.resolucionForm.get('aniosVigencia')?.value;
    const fechaInicio = this.resolucionForm.get('fechaVigenciaInicio')?.value;

    if (!expediente || !empresa) {
      return;
    }

    let descripcion = '';

    switch (expediente.tipoTramite) {
      case 'AUTORIZACION_NUEVA':
        descripcion = `AUTORIZACIÓN ${expediente.tipoTramite} para ${empresa.razonSocial.principal} `;
        descripcion += `para operar transporte público de pasajeros en rutas interprovinciales`;
        if (aniosVigencia && fechaInicio) {
          descripcion += ` por un período de ${aniosVigencia} año(s)`;
        }
        break;

      case 'RENOVACION':
        descripcion = `RENOVACIÓN de autorización para ${empresa.razonSocial.principal} `;
        descripcion += `para continuar operando transporte público de pasajeros en rutas interprovinciales`;
        if (aniosVigencia && fechaInicio) {
          descripcion += ` por un período adicional de ${aniosVigencia} año(s)`;
        }
        break;

      case 'OTROS':
        descripcion = `MODIFICACIÓN de autorización para ${empresa.razonSocial.principal} `;
        descripcion += `para ajustar operaciones de transporte público de pasajeros`;
        if (aniosVigencia && fechaInicio) {
          descripcion += ` manteniendo vigencia por ${aniosVigencia} año(s)`;
        }
        break;

      default:
        descripcion = `AUTORIZACIÓN para ${empresa.razonSocial.principal} `;
        descripcion += `en materia de transporte público de pasajeros`;
        if (aniosVigencia && fechaInicio) {
          descripcion += ` por ${aniosVigencia} año(s)`;
        }
    }

    // Actualizar el campo de descripción en el formulario
    this.resolucionForm.get('descripcion')?.setValue(descripcion);

    // Mostrar notificación
    this.snackBar.open('Descripción generada automáticamente', 'Cerrar', { duration: 2000 });
  }

  formatearFechaLima(fecha: Date | string | null): string {
    if (!fecha) return 'NO DISPONIBLE';

    try {
      const fechaObj = new Date(fecha);
      const fechaLima = new Date(fechaObj.getTime() - (5 * 60 * 60 * 1000));
      const dia = fechaLima.getUTCDate().toString().padStart(2, '0');
      const mes = (fechaLima.getUTCMonth() + 1).toString().padStart(2, '0');
      const anio = fechaLima.getUTCFullYear();
      return `${dia}/${mes}/${anio}`;
    } catch (error) {
      return 'ERROR EN FECHA';
    }
  }

  fechaActualLima(): string {
    return this.formatearFechaLima(new Date());
  }

  formatearFechaEspanol(fecha: Date | string | null): string {
    if (!fecha) return 'NO DISPONIBLE';

    try {
      const fechaObj = new Date(fecha);
      const fechaLima = new Date(fechaObj.getTime() - (5 * 60 * 60 * 1000));

      const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];

      const dia = fechaLima.getUTCDate();
      const mes = meses[fechaLima.getUTCMonth()];
      const anio = fechaLima.getUTCFullYear();

      return `${dia} de ${mes} de ${anio}`;
    } catch (error) {
      return 'ERROR EN FECHA';
    }
  }

  private calcularFechaVigenciaFin(fechaInicio: Date | null, aniosVigencia: number | null): Date | undefined {
    if (!fechaInicio || !aniosVigencia) return undefined;

    try {
      const fechaFin = new Date(fechaInicio);
      fechaFin.setFullYear(fechaFin.getFullYear() + aniosVigencia);
      return fechaFin;
    } catch (error) {
      console.error('Error calculando fecha de vigencia fin:', error);
      return undefined;
    }
  }

  // Método para debuggear el estado actual
  debugEstadoActual(): void {
    console.log('=== DEBUG ESTADO ACTUAL ===');
    console.log('Empresa ID (input):', this.empresaId);
    console.log('Empresa ID (query params):', this.route.snapshot.queryParams['empresaId']);
    console.log('Empresa ID (formulario):', this.resolucionForm.get('empresaId')?.value);
    console.log('Empresa ID (signal):', this.empresaIdForm());
    console.log('Empresa seleccionada (computed):', this.empresaSeleccionada());
    console.log('Total empresas:', this.empresas().length);
    console.log('Total expedientes:', this.expedientes().length);
    console.log('Expedientes filtrados:', this.expedientesFiltrados());
    console.log('=== FIN DEBUG ===');
  }

  // Método para debuggear específicamente la fecha de vigencia
  debugFechaVigencia(): void {
    console.log('=== DEBUG FECHA VIGENCIA ===');
    const fechaInicio = this.resolucionForm.get('fechaVigenciaInicio')?.value;
    const aniosVigencia = this.resolucionForm.get('aniosVigencia')?.value;
    const mostrarFecha = this.mostrarFechaVigenciaFin();

    console.log('Valores del formulario:');
    console.log('  - fechaVigenciaInicio:', fechaInicio);
    console.log('  - aniosVigencia:', aniosVigencia);
    console.log('  - mostrarFecha:', mostrarFecha);

    console.log('Tipos de datos:');
    console.log('  - fechaInicio type:', typeof fechaInicio);
    console.log('  - aniosVigencia type:', typeof aniosVigencia);

    console.log('Valores truthy:');
    console.log('  - !!fechaInicio:', !!fechaInicio);
    console.log('  - !!aniosVigencia:', !!aniosVigencia);
    console.log('  - !!mostrarFecha:', !!mostrarFecha);

    if (fechaInicio && aniosVigencia && mostrarFecha) {
      console.log('✅ Condición cumplida, probando cálculo...');
      try {
        const fechaFin = this.calcularFechaVigenciaFin(fechaInicio, aniosVigencia);
        console.log('  - fechaFin calculada:', fechaFin);
        if (fechaFin) {
          const fechaFormateada = this.formatearFechaEspanol(fechaFin);
          console.log('  - fechaFormateada:', fechaFormateada);
        }
      } catch (error) {
        console.error('  - Error en cálculo:', error);
      }
    } else {
      console.log('❌ Condición NO cumplida');
    }
    console.log('=== FIN DEBUG FECHA VIGENCIA ===');
  }

  onSubmit(): void {
    if (this.resolucionForm.invalid) {
      return;
    }

    // Validar que se haya seleccionado una empresa
    if (!this.resolucionForm.get('empresaId')?.value) {
      this.snackBar.open('DEBE SELECCIONAR UNA EMPRESA', 'CERRAR', { duration: 3000 });
      return;
    }

    // Validar que se haya seleccionado un expediente
    if (!this.resolucionForm.get('expedienteId')?.value) {
      this.snackBar.open('DEBE SELECCIONAR UN EXPEDIENTE', 'CERRAR', { duration: 3000 });
      return;
    }

    this.submitting.set(true);
    const formValue = this.resolucionForm.value;

    // Preparar datos para crear la resolución
    const resolucionData: ResolucionCreate = {
      empresaId: formValue.empresaId,
      expedienteId: formValue.expedienteId,
      numero: formValue.numeroBase,
      fechaEmision: formValue.fechaEmision,
      resolucionPadreId: formValue.resolucionPadreId,
      fechaVigenciaInicio: formValue.fechaVigenciaInicio,
      fechaVigenciaFin: this.calcularFechaVigenciaFin(formValue.fechaVigenciaInicio, formValue.aniosVigencia),
      tipoResolucion: this.tipoResolucionCalculado(),
      tipoTramite: this.expedienteSeleccionado()?.tipoTramite || 'AUTORIZACION_NUEVA',
      descripcion: formValue.descripcion,
      observaciones: formValue.observaciones,
      vehiculosHabilitadosIds: [],
      rutasAutorizadasIds: []
    };

    if (this.esEdicion()) {
      // Modo edición - implementación completa
      const resolucionId = this.resolucionId();
      if (!resolucionId) {
        this.snackBar.open('Error: ID de resolución no encontrado', 'Cerrar', { duration: 3000 });
        return;
      }

      // Crear objeto de actualización compatible con ResolucionUpdate
      const resolucionUpdate = {
        numero: formValue.numeroBase,
        fechaEmision: formValue.fechaEmision,
        descripcion: formValue.descripcion,
        observaciones: formValue.observaciones,
        resolucionPadreId: formValue.resolucionPadreId,
        estaActivo: true
      };

      this.resolucionService.updateResolucion(resolucionId, resolucionUpdate).subscribe({
        next: (resolucion) => {
          this.submitting.set(false);
          this.snackBar.open('Resolución actualizada exitosamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/resoluciones']);
        },
        error: (error) => {
          this.submitting.set(false);
          console.error('Error al actualizar resolución:', error);
          this.snackBar.open('Error al actualizar la resolución', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      // Modo creación
      this.resolucionService.createResolucion(resolucionData).subscribe({
        next: (resolucion) => {
          this.submitting.set(false);
          this.snackBar.open('Resolución creada exitosamente', 'Cerrar', { duration: 3000 });

          // Emitir evento para el modal
          this.resolucionCreada.emit(resolucion);

          // Si no está en modal, navegar
          if (!this.esResolucionHija) {
            this.router.navigate(['/resoluciones']);
          }
        },
        error: (error) => {
          this.submitting.set(false);
          console.error('Error al crear resolución:', error);
          this.snackBar.open('Error al crear la resolución', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
} 