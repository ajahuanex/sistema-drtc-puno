import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import * as XLSX from 'xlsx';
import { ResolucionPrimigeniaService } from '../../services/resolucion-primigenia.service';
import { GoogleSheetsService } from '../../services/google-sheets.service';

export interface RegistroResolucionPreview {
  fila: number;
  idResolucion?: string;
  ruc: string;
  nroResolucion: string;
  siglas?: string;
  resolucionAsociada?: string;
  tipoResolucion?: string;
  fechaResolucion: string;
  fechaInicioVigencia: string;
  fechaFinVigencia: string;
  aniosVigencia: number | string;
  estado: string;
  observaciones?: string;
  eficaciaAnticipada?: string;
  tipoAutorizacion: string;
  linkDocumento?: string;
  feDeErratas?: string;
  historialCambios?: string;
  expedientes?: string;
  esValido?: boolean;
  errores?: string[];
}

@Component({
  selector: 'app-carga-masiva-resoluciones-primigenias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <div class="carga-masiva-wrapper">
      <!-- HEADER CON CORDÓN DE NAVEGACIÓN Y ACCIÓN RÁPIDA -->
      <header class="header-banner">
        <div class="header-title-group">
          <button mat-icon-button routerLink="/resoluciones-primigenias" class="back-btn" matTooltip="Volver a Resoluciones Primigenias">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-text">
            <div class="badge-tag">Títulos Habilitantes</div>
            <h1>Carga Masiva de Resoluciones Primigenias</h1>
            <p>Importa autorizaciones matrices desde archivos Excel, CSV o directamente mediante enlace de Google Sheets</p>
          </div>
        </div>

        <div class="header-actions">
          <button mat-raised-button color="primary" class="action-btn download-btn" (click)="descargarPlantilla()" [disabled]="cargando()">
            <mat-icon>download</mat-icon>
            Descargar Plantilla Excel
          </button>
        </div>
      </header>

      <div class="main-content-grid">
        <!-- SECCIÓN 1: SUBIR ARCHIVO Y CONFIGURACIÓN (HERO PANEL) -->
        <mat-card class="upload-panel-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title-flex">
              <mat-icon class="panel-icon">cloud_upload</mat-icon>
              <span>Origen de Datos</span>
            </mat-card-title>
            <mat-card-subtitle>
              Selecciona si subirás un archivo local (.xlsx, .xls, .csv) o la URL de una hoja de Google Sheets
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content class="card-body">

            <!-- Selector de Origen de Datos (Tab Switcher) -->
            <div class="source-selector">
              <button type="button"
                      class="source-tab"
                      [class.active]="origenCarga() === 'archivo'"
                      (click)="origenCarga.set('archivo')">
                <mat-icon>insert_drive_file</mat-icon>
                Archivo Local (.xlsx, .xls, .csv)
              </button>
              <button type="button"
                      class="source-tab"
                      [class.active]="origenCarga() === 'google-sheets'"
                      (click)="origenCarga.set('google-sheets')">
                <mat-icon class="text-green">grid_on</mat-icon>
                Google Sheets (URL Pública)
              </button>
            </div>

            @if (origenCarga() === 'archivo') {
              <!-- Zona Drag and Drop -->
              <div class="dropzone"
                   [class.drag-active]="isDragOver()"
                   [class.has-file]="archivoSeleccionado()"
                   (dragover)="onDragOver($event)"
                   (dragleave)="onDragLeave($event)"
                   (drop)="onDrop($event)"
                   (click)="fileInput.click()">

                <input #fileInput
                       type="file"
                       accept=".xlsx,.xls,.csv,text/csv"
                       (change)="onFileSelected($event)"
                       style="display: none;">

                @if (archivoSeleccionado(); as file) {
                  <div class="dropzone-file-selected">
                    <div class="file-icon-wrapper">
                      <mat-icon>{{ file.name.endsWith('.csv') ? 'description' : 'insert_drive_file' }}</mat-icon>
                    </div>
                    <div class="file-details">
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    </div>
                    <button mat-icon-button color="warn" (click)="$event.stopPropagation(); limpiarArchivo()" matTooltip="Remover archivo">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </div>
                } @else {
                  <div class="dropzone-prompt">
                    <div class="cloud-icon-circle">
                      <mat-icon>upload_file</mat-icon>
                    </div>
                    <h3>Arrastra tu archivo aquí</h3>
                    <p>Soporta hojas de cálculo Excel (.xlsx, .xls) o archivos CSV (.csv)</p>
                    <span class="file-limit-hint">Tamaño máximo recomendado: 10MB</span>
                  </div>
                }
              </div>
            } @else {
              <!-- Input de Google Sheets -->
              <div class="google-sheets-box">
                <div class="sheets-header-info">
                  <mat-icon class="sheets-icon">table_chart</mat-icon>
                  <div>
                    <h4>Importar desde Google Sheets sin API Key</h4>
                    <p>Asegúrate de que tu hoja de Google Sheets esté configurada como <strong>"Cualquier persona con el enlace puede ver"</strong>.</p>
                  </div>
                </div>

                <div class="sheets-input-row">
                  <mat-form-field appearance="outline" class="url-input-field">
                    <mat-label>Enlace público de Google Sheets</mat-label>
                    <input matInput
                           [ngModel]="googleSheetsUrl()"
                           (ngModelChange)="googleSheetsUrl.set($event)"
                           placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit">
                    <mat-icon matPrefix>link</mat-icon>
                    @if (googleSheetsUrl()) {
                      <button matSuffix mat-icon-button (click)="googleSheetsUrl.set('')">
                        <mat-icon>clear</mat-icon>
                      </button>
                    }
                  </mat-form-field>

                  <button mat-raised-button
                          color="primary"
                          class="btn-fetch-sheets"
                          [disabled]="!googleSheetsUrl() || cargandoGoogleSheets()"
                          (click)="cargarDesdeGoogleSheets()">
                    <mat-icon [class.spin-icon]="cargandoGoogleSheets()">
                      {{ cargandoGoogleSheets() ? 'sync' : 'cloud_download' }}
                    </mat-icon>
                    <span>{{ cargandoGoogleSheets() ? 'Cargando...' : 'Obtener Datos' }}</span>
                  </button>
                </div>

                @if (archivoSeleccionado(); as file) {
                  <div class="dropzone-file-selected sheets-success-file">
                    <div class="file-icon-wrapper">
                      <mat-icon>check_circle</mat-icon>
                    </div>
                    <div class="file-details">
                      <span class="file-name">Google Sheet Convertido (CSV)</span>
                      <span class="file-size">{{ formatFileSize(file.size) }} | Listo para procesar</span>
                    </div>
                    <button mat-icon-button color="warn" (click)="limpiarArchivo()" matTooltip="Remover datos">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </div>
                }
              </div>
            }

            <!-- VISTA PREVIA DE DATOS Y MAPEO DE COLUMNAS AL OBTENER DATOS (ANTES DE PROCESAR) -->
            @if (archivoSeleccionado() && previewRows().length > 0 && !mostrarResultados()) {
              <div class="data-preview-container animate-fade-in">
                <!-- Target Destination Banner -->
                <div class="destination-target-banner">
                  <div class="dest-info">
                    <mat-icon class="dest-icon">storage</mat-icon>
                    <div>
                      <h4 class="dest-title">Destino de Carga Confirmado</h4>
                      <p class="dest-desc">Base de Datos: <strong>DRTC Puno (MongoDB)</strong> &rarr; Colección: <code>resoluciones_primigenias</code></p>
                    </div>
                  </div>
                  <div class="dest-stats">
                    <span class="stat-pill total-pill"><mat-icon>format_list_numbered</mat-icon> {{ previewRows().length }} Registros</span>
                    <span class="stat-pill valid-pill"><mat-icon>check_circle</mat-icon> {{ totalValidosPreview() }} Válidos</span>
                    @if (totalInvalidosPreview() > 0) {
                      <span class="stat-pill invalid-pill"><mat-icon>warning</mat-icon> {{ totalInvalidosPreview() }} Con Observación</span>
                    }
                  </div>
                </div>

                <!-- Mapeo de Columnas (Archivo vs DB Target) -->
                <div class="mapping-section">
                  <h4 class="section-subtitle">
                    <mat-icon>alt_route</mat-icon>
                    Correspondencia y Mapeo de Columnas Detectadas (Excel / Google Sheets &rarr; DRTC Puno)
                  </h4>
                  <div class="mapping-grid">
                    @for (col of columnasMapeadas(); track col.destCampo) {
                      <div class="mapping-chip">
                        <span class="source-col">{{ col.archivoCol }}</span>
                        <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                        <span class="dest-col"><code>{{ col.destCampo }}</code></span>
                        <span class="type-tag">{{ col.tipo }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Pre-visualización de Registros Extraídos -->
                <div class="extracted-data-preview">
                  <h4 class="section-subtitle">
                    <mat-icon>visibility</mat-icon>
                    Vista Previa de Registros a Importar (Primeras {{ Math.min(10, previewRows().length) }} filas)
                  </h4>
                  <div class="tab-table-wrapper">
                    <table class="modern-table preview-table">
                      <thead>
                        <tr>
                          <th (click)="toggleSort('fila')" class="sortable-th">
                            <span>Fila</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('fila') }}</mat-icon>
                          </th>
                          <th (click)="toggleSort('esValido')" class="sortable-th">
                            <span>Estado Data</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('esValido') }}</mat-icon>
                          </th>
                          <th (click)="toggleSort('ruc')" class="sortable-th">
                            <span>RUC Empresa (<code>ruc_empresa</code>)</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('ruc') }}</mat-icon>
                          </th>
                          <th (click)="toggleSort('nroResolucion')" class="sortable-th">
                            <span>N° Resolución (<code>nro_resolucion</code>)</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('nroResolucion') }}</mat-icon>
                          </th>
                          <th (click)="toggleSort('tipoAutorizacion')" class="sortable-th">
                            <span>Modalidad (<code>tipo_autorizacion</code>)</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('tipoAutorizacion') }}</mat-icon>
                          </th>
                          <th (click)="toggleSort('fechaResolucion')" class="sortable-th">
                            <span>Fechas (Emisión / Vigencia)</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('fechaResolucion') }}</mat-icon>
                          </th>
                          <th (click)="toggleSort('aniosVigencia')" class="sortable-th">
                            <span>Vigencia</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('aniosVigencia') }}</mat-icon>
                          </th>
                          <th>Expedientes</th>
                          <th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (r of previewRowsOrdenadas().slice(0, 15); track r.fila) {
                          <tr [class.invalid-row]="!r.esValido">
                            <td><strong>#{{ r.fila }}</strong></td>
                            <td>
                              @if (r.esValido) {
                                <span class="status-chip success"><mat-icon>check</mat-icon> VÁLIDO</span>
                              } @else {
                                <span class="status-chip danger"><mat-icon>error</mat-icon> ERROR</span>
                              }
                            </td>
                            <td><span class="code-badge">{{ r.ruc }}</span></td>
                            <td><span class="code-badge info-code">{{ r.nroResolucion }}</span></td>
                            <td><span class="type-tag">{{ r.tipoAutorizacion }}</span></td>
                            <td>
                              <div class="date-range-flex">
                                <span>{{ r.fechaResolucion }}</span>
                                <span class="text-muted">|</span>
                                <span>{{ r.fechaInicioVigencia }} &rarr; {{ r.fechaFinVigencia }}</span>
                              </div>
                            </td>
                            <td>{{ r.aniosVigencia }} Años</td>
                            <td><span>{{ r.expedientes || '-' }}</span></td>
                            <td>
                              @if (!r.esValido && r.errores?.length) {
                                <span class="err-text"><mat-icon>error_outline</mat-icon> {{ r.errores?.join(', ') }}</span>
                              } @else {
                                <span class="obs-cell">{{ r.observaciones || 'OK' }}</span>
                              }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            }

            <!-- Panel de Opciones de Procesamiento Compacto -->
            <div class="options-container">
              <div class="option-group">
                <label class="option-label">
                  <mat-icon>tune</mat-icon>
                  Modo de Operación
                </label>
                <div class="pill-toggle-group">
                  <button type="button"
                          class="pill-btn"
                          [class.active]="soloValidar()"
                          (click)="soloValidar.set(true)">
                    <mat-icon>fact_check</mat-icon>
                    Solo Validar
                  </button>
                  <button type="button"
                          class="pill-btn"
                          [class.active]="!soloValidar()"
                          (click)="soloValidar.set(false)">
                    <mat-icon>play_circle</mat-icon>
                    Validar y Cargar
                  </button>
                </div>
              </div>

              @if (!soloValidar()) {
                <div class="option-group">
                  <label class="option-label">
                    <mat-icon>published_with_changes</mat-icon>
                    Estrategia de Carga
                  </label>
                  <div class="pill-toggle-group">
                    <button type="button"
                            class="pill-btn"
                            [class.active]="modoProcesamiento() === 'upsert'"
                            (click)="modoProcesamiento.set('upsert')"
                            matTooltip="Crea o actualiza si la resolución primigenia ya existe por N° de Resolución">
                      <mat-icon>sync_alt</mat-icon>
                      Crear o Actualizar
                    </button>
                    <button type="button"
                            class="pill-btn"
                            [class.active]="modoProcesamiento() === 'crear'"
                            (click)="modoProcesamiento.set('crear')"
                            matTooltip="Solo inserta registros nuevos">
                      <mat-icon>add_circle_outline</mat-icon>
                      Solo Crear
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Banner Informativo Ligero sobre Resoluciones Primigenias -->
            <div class="info-pill-bar">
              <mat-icon>info</mat-icon>
              <span><strong>Resoluciones matrices:</strong> Registra las autorizaciones originarias asignadas a las empresas. Se vincularán automáticamente a los expedientes indicados.</span>
            </div>

            <!-- Botón Principal de Acción -->
            <div class="main-action-area">
              <button mat-raised-button
                      color="accent"
                      class="btn-process-hero"
                      [disabled]="!archivoSeleccionado() || cargando()"
                      (click)="procesarArchivo()">
                <mat-icon [class.spin-icon]="cargando()">
                  {{ cargando() ? 'sync' : (soloValidar() ? 'task_alt' : 'rocket_launch') }}
                </mat-icon>
                <span>
                  {{ cargando() ? 'Procesando Datos...' : (soloValidar() ? 'Validar Estructura' : 'Iniciar Carga Masiva') }}
                </span>
              </button>
            </div>

            <!-- Barra de Progreso cuando se ejecuta el proceso -->
            @if (cargando()) {
              <div class="loading-progress-box">
                <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                <p class="progress-subtext">{{ soloValidar() ? 'Validando registros y estructura...' : 'Insertando y registrando resoluciones primigenias...' }}</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- SECCIÓN 2: DASHBOARD DE RESULTADOS (CUANDO HAYA RESULTADOS) -->
        @if (mostrarResultados() && resultado()) {
          <div class="results-section">
            <mat-card class="results-card glass-panel">
              <mat-card-header>
                <mat-card-title class="card-title-flex">
                  <mat-icon [class.text-success]="totalErrores() === 0" [class.text-warn]="totalErrores() > 0">
                    {{ totalErrores() === 0 ? 'check_circle' : 'assessment' }}
                  </mat-icon>
                  <span>Resumen de {{ soloValidar() ? 'Validación' : 'Procesamiento' }}</span>
                </mat-card-title>

                <mat-card-subtitle>
                  {{ soloValidar() ? 'Se completó la verificación del archivo sin modificar la base de datos' : 'Se procesaron las resoluciones primigenias correctamente' }}
                </mat-card-subtitle>
              </mat-card-header>

              <mat-card-content class="card-body">
                <!-- KPI Tiles Grid -->
                <div class="kpi-grid">
                  <div class="kpi-card total">
                    <mat-icon>receipt_long</mat-icon>
                    <div class="kpi-data">
                      <span class="kpi-num">{{ totalFilas() }}</span>
                      <span class="kpi-label">Total Filas</span>
                    </div>
                  </div>

                  <div class="kpi-card success">
                    <mat-icon>add_box</mat-icon>
                    <div class="kpi-data">
                      <span class="kpi-num">{{ totalExitosas() }}</span>
                      <span class="kpi-label">{{ soloValidar() ? 'Válidas' : 'Creadas' }}</span>
                    </div>
                  </div>

                  @if (totalErrores() > 0) {
                    <div class="kpi-card danger">
                      <mat-icon>error_outline</mat-icon>
                      <div class="kpi-data">
                        <span class="kpi-num">{{ totalErrores() }}</span>
                        <span class="kpi-label">Con Errores</span>
                      </div>
                    </div>
                  }

                  @if (totalAdvertencias() > 0) {
                    <div class="kpi-card warning">
                      <mat-icon>warning_amber</mat-icon>
                      <div class="kpi-data">
                        <span class="kpi-num">{{ totalAdvertencias() }}</span>
                        <span class="kpi-label">Advertencias</span>
                      </div>
                    </div>
                  }
                </div>

                <!-- SECCIÓN: VISTA PREVIA DE CORRESPONDENCIA DE COLUMNAS (PRIMEROS 5 REGISTROS) -->
                @if (registrosValidosMuestra().length > 0) {
                  <div class="preview-section-card">
                    <div class="preview-header">
                      <mat-icon class="preview-icon">preview</mat-icon>
                      <div>
                        <h4>Vista Previa de Mapeo de Columnas (Primeros 5 registros)</h4>
                        <p>Mapeo verificado para <strong>RUC_EMPRESA_ASOCIADA, RESOLUCION_NUMERO, TIPO AUTORIZACION, FECHAS, EXPEDIENTES</strong> y demás atributos.</p>
                      </div>
                    </div>

                    <div class="tab-table-wrapper">
                      <table mat-table [dataSource]="registrosValidosMuestra()" class="modern-table preview-table">
                        <ng-container matColumnDef="fila">
                          <th mat-header-cell *matHeaderCellDef>Fila</th>
                          <td mat-cell *matCellDef="let r"><strong>#{{ r.fila }}</strong></td>
                        </ng-container>

                        <ng-container matColumnDef="ruc">
                          <th mat-header-cell *matHeaderCellDef>RUC Empresa (RUC_EMPRESA_ASOCIADA)</th>
                          <td mat-cell *matCellDef="let r"><span class="code-badge">{{ r.ruc }}</span></td>
                        </ng-container>

                        <ng-container matColumnDef="nroResolucion">
                          <th mat-header-cell *matHeaderCellDef>N° Resolución (RESOLUCION_NUMERO)</th>
                          <td mat-cell *matCellDef="let r"><span class="code-badge info-code">{{ r.nroResolucion }}</span></td>
                        </ng-container>

                        <ng-container matColumnDef="fechas">
                          <th mat-header-cell *matHeaderCellDef>Fechas (Emisión / Inicio - Fin)</th>
                          <td mat-cell *matCellDef="let r">
                            <div class="date-range-flex">
                              <span>{{ r.fechaResolucion || 'N/A' }}</span>
                              <span class="text-muted">|</span>
                              <span>{{ r.fechaInicioVigencia || 'N/A' }} → {{ r.fechaFinVigencia || 'N/A' }}</span>
                            </div>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="tipoAutorizacion">
                          <th mat-header-cell *matHeaderCellDef>Tipo Autorización</th>
                          <td mat-cell *matCellDef="let r">
                            <span class="type-tag">{{ r.tipoAutorizacion || 'TURISMO' }}</span>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="expedientes">
                          <th mat-header-cell *matHeaderCellDef>Expediente</th>
                          <td mat-cell *matCellDef="let r">
                            <span>{{ r.expedientes || '-' }}</span>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="estado">
                          <th mat-header-cell *matHeaderCellDef>Estado</th>
                          <td mat-cell *matCellDef="let r">
                            <span class="status-chip success">{{ r.estado || 'VIGENTE' }}</span>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="observaciones">
                          <th mat-header-cell *matHeaderCellDef>Observaciones</th>
                          <td mat-cell *matCellDef="let r">
                            <span class="obs-cell" [matTooltip]="r.observaciones || ''">{{ r.observaciones || '-' }}</span>
                          </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="['fila', 'ruc', 'nroResolucion', 'fechas', 'tipoAutorizacion', 'expedientes', 'estado', 'observaciones']"></tr>
                        <tr mat-row *matRowDef="let row; columns: ['fila', 'ruc', 'nroResolucion', 'fechas', 'tipoAutorizacion', 'expedientes', 'estado', 'observaciones'];"></tr>
                      </table>
                    </div>
                  </div>
                }

                <!-- Tabs Limpios con Detalle de Listas -->
                <mat-tab-group class="modern-tabs" animationDuration="200ms">
                  <!-- Tab: Resoluciones Creadas / Válidas -->
                  <mat-tab>
                    <ng-template mat-tab-label>
                      <mat-icon class="tab-icon success-icon">add_circle</mat-icon>
                      <span>{{ soloValidar() ? 'Resoluciones Válidas' : 'Resoluciones Creadas' }} ({{ totalExitosas() }})</span>
                    </ng-template>

                    <div class="tab-table-wrapper">
                      @if (registrosCreados().length > 0) {
                        <table mat-table [dataSource]="registrosCreados().slice(0, 25)" class="modern-table">
                          <ng-container matColumnDef="codigo">
                            <th mat-header-cell *matHeaderCellDef>N° Resolución</th>
                            <td mat-cell *matCellDef="let reg">
                              <span class="code-badge info-code">{{ typeof reg === 'string' ? reg : (reg.nroResolucion || reg.nro_resolucion) }}</span>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="ruc">
                            <th mat-header-cell *matHeaderCellDef>RUC Empresa</th>
                            <td mat-cell *matCellDef="let reg">
                              <span class="code-badge">{{ typeof reg === 'string' ? 'OK' : (reg.ruc || reg.ruc_empresa || 'OK') }}</span>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="estado">
                            <th mat-header-cell *matHeaderCellDef>Estado</th>
                            <td mat-cell *matCellDef="let reg">
                              <span class="status-chip success">{{ soloValidar() ? 'VÁLIDA' : 'CREADA' }}</span>
                            </td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="['codigo', 'ruc', 'estado']"></tr>
                          <tr mat-row *matRowDef="let row; columns: ['codigo', 'ruc', 'estado'];"></tr>
                        </table>

                        @if (registrosCreados().length > 25) {
                          <div class="table-footer-hint">
                            ... y {{ registrosCreados().length - 25 }} resoluciones adicionales procesadas exitosamente.
                          </div>
                        }
                      } @else {
                        <p class="no-change">No hay registros detallados disponibles.</p>
                      }
                    </div>
                  </mat-tab>

                  <!-- Tab: Errores -->
                  @if (erroresList().length > 0) {
                    <mat-tab>
                      <ng-template mat-tab-label>
                        <mat-icon class="tab-icon warn-icon">error_outline</mat-icon>
                        <span>Errores ({{ erroresList().length }})</span>
                      </ng-template>

                      <div class="tab-table-wrapper">
                        <table mat-table [dataSource]="erroresList().slice(0, 50)" class="modern-table error-table">
                          <ng-container matColumnDef="fila">
                            <th mat-header-cell *matHeaderCellDef>Item / Fila</th>
                            <td mat-cell *matCellDef="let err; let i = index">
                              <span class="type-tag" style="background: #fee2e2; color: #991b1b; font-weight: 800;">
                                #{{ getFilaError(err, i) }}
                              </span>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="detalle">
                            <th mat-header-cell *matHeaderCellDef>Detalle del Error</th>
                            <td mat-cell *matCellDef="let err">
                              <span class="err-text">{{ typeof err === 'string' ? err : (err.error || err.errores?.join(', ') || 'Error de validación') }}</span>
                            </td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="['fila', 'detalle']"></tr>
                          <tr mat-row *matRowDef="let row; columns: ['fila', 'detalle'];"></tr>
                        </table>
                      </div>
                    </mat-tab>
                  }
                </mat-tab-group>

                <!-- Footer de Acciones del Dashboard -->
                <div class="results-actions-bar">
                  @if (soloValidar() && totalExitosas() > 0) {
                    <button mat-raised-button color="accent" (click)="procesarDespuesDeValidar()">
                      <mat-icon>play_circle</mat-icon>
                      Procesar Resoluciones Válidas Ahora
                    </button>
                  }

                  @if (!soloValidar() && totalExitosas() > 0) {
                    <button mat-raised-button color="primary" routerLink="/resoluciones-primigenias">
                      <mat-icon>format_list_bulleted</mat-icon>
                      Ver Resoluciones Primigenias en el Sistema
                    </button>
                  }

                  <button mat-stroked-button (click)="reiniciarProceso()">
                    <mat-icon>refresh</mat-icon>
                    Cargar Otro Archivo
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./carga-masiva-resoluciones-primigenias.component.scss']
})
export class CargaMasivaResolucionesPrimigeniasComponent implements OnInit {
  private service = inject(ResolucionPrimigeniaService);
  private googleSheetsService = inject(GoogleSheetsService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Signals de estado
  origenCarga = signal<'archivo' | 'google-sheets'>('archivo');
  googleSheetsUrl = signal<string>(localStorage.getItem('drtc_ultimo_google_sheets_url') || '');
  cargandoGoogleSheets = signal<boolean>(false);

  archivoSeleccionado = signal<File | null>(null);
  cargando = signal<boolean>(false);
  mostrarResultados = signal<boolean>(false);
  soloValidar = signal<boolean>(false);
  modoProcesamiento = signal<'crear' | 'upsert'>('upsert');

  isDragOver = signal<boolean>(false);
  resultado = signal<any>(null);
  previewRows = signal<RegistroResolucionPreview[]>([]);

  Math = Math;

  columnasMapeadas = computed(() => [
    { archivoCol: 'RUC_EMPRESA_ASOCIADA / RUC', destCampo: 'ruc_empresa', tipo: 'RUC (11 dígitos)', requerido: true },
    { archivoCol: 'RESOLUCION_NUMERO / NRO_RESOLUCION', destCampo: 'nro_resolucion', tipo: 'Texto', requerido: true },
    { archivoCol: 'FECHA_EMISION / FECHA_RESOLUCION', destCampo: 'fecha_resolucion', tipo: 'Fecha (ISO)', requerido: false },
    { archivoCol: 'FECHA_INICIO_VIGENCIA', destCampo: 'fecha_inicio_vigencia', tipo: 'Fecha (ISO)', requerido: false },
    { archivoCol: 'ANIOS_VIGENCIA / VIGENCIA', destCampo: 'anios_vigencia', tipo: 'Número (4 o 10)', requerido: false },
    { archivoCol: 'TIPO AUTORIZACION / MODALIDAD', destCampo: 'tipo_autorizacion', tipo: 'Tipo Autorización', requerido: false },
    { archivoCol: 'ESTADO', destCampo: 'estado', tipo: 'Estado Legal', requerido: false },
    { archivoCol: 'EXPEDIENTES / EXPEDIENTE', destCampo: 'expedientes_codigos', tipo: 'Lista Expedientes', requerido: false },
    { archivoCol: 'DRIVE / LINK', destCampo: 'link_documento', tipo: 'URL PDF Drive', requerido: false },
    { archivoCol: 'SIGLAS', destCampo: 'siglas', tipo: 'Siglas GRP/GRI/DRTC', requerido: false }
  ]);

  // Ordenamiento por columna en previsualización
  sortField = signal<string>('fila');
  sortDirection = signal<'asc' | 'desc'>('asc');

  toggleSort(column: string): void {
    if (this.sortField() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: string): string {
    if (this.sortField() !== column) {
      return 'unfold_more';
    }
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  totalValidosPreview = computed(() => {
    return this.previewRows().filter(r => r.esValido !== false).length;
  });

  totalInvalidosPreview = computed(() => {
    return this.previewRows().filter(r => r.esValido === false).length;
  });

  previewRowsOrdenadas = computed(() => {
    const rows = this.previewRows();
    const field = this.sortField();
    const isAsc = this.sortDirection() === 'asc';

    return [...rows].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (field) {
        case 'fila':
          valA = a.fila || 0;
          valB = b.fila || 0;
          return isAsc ? valA - valB : valB - valA;
        case 'esValido':
          valA = a.esValido !== false ? 1 : 0;
          valB = b.esValido !== false ? 1 : 0;
          return isAsc ? valA - valB : valB - valA;
        case 'ruc':
          valA = a.ruc || '';
          valB = b.ruc || '';
          break;
        case 'nroResolucion':
          valA = a.nroResolucion || '';
          valB = b.nroResolucion || '';
          break;
        case 'tipoAutorizacion':
          valA = a.tipoAutorizacion || '';
          valB = b.tipoAutorizacion || '';
          break;
        case 'fechaResolucion':
          valA = a.fechaResolucion || '';
          valB = b.fechaResolucion || '';
          break;
        case 'aniosVigencia':
          valA = a.aniosVigencia || 0;
          valB = b.aniosVigencia || 0;
          return isAsc ? valA - valB : valB - valA;
      }

      const res = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      return isAsc ? res : -res;
    });
  });

  // Computed signals
  totalFilas = computed(() => {
    const res = this.resultado();
    if (!res) return this.previewRows().length;
    if (this.soloValidar()) {
      return res.validacion?.total_filas || res.total_filas || this.previewRows().length;
    }
    return res.resultado?.total_filas || res.total_filas || this.previewRows().length;
  });

  totalExitosas = computed(() => {
    const res = this.resultado();
    if (!res) return 0;
    if (this.soloValidar()) {
      return res.validacion?.validos ?? (this.previewRows().filter(r => r.esValido !== false).length);
    }
    return res.resultado?.creadas ?? res.creadas ?? 0;
  });

  totalErrores = computed(() => {
    const res = this.resultado();
    if (!res) return 0;
    if (this.soloValidar()) {
      return res.validacion?.invalidos ?? (this.previewRows().filter(r => r.esValido === false).length);
    }
    return (res.resultado?.errores || res.errores || []).length;
  });

  totalAdvertencias = computed(() => {
    const res = this.resultado();
    if (!res) return 0;
    return res.validacion?.con_advertencias || 0;
  });

  registrosValidosMuestra = computed(() => {
    return this.previewRows().slice(0, 5);
  });

  registrosCreados = computed(() => {
    const res = this.resultado();
    if (!res) return this.previewRows().filter(r => r.esValido !== false);
    if (this.soloValidar()) {
      return this.previewRows().filter(r => r.esValido !== false);
    }
    return res.resultado?.registros || res.registros || this.previewRows();
  });

  erroresList = computed(() => {
    const res = this.resultado();
    if (!res) return [];
    if (this.soloValidar()) {
      const errs: string[] = [];
      this.previewRows().forEach(r => {
        if (r.errores && r.errores.length > 0) {
          errs.push(`Fila ${r.fila}: ${r.errores.join(', ')}`);
        }
      });
      return errs;
    }
    return res.resultado?.errores || res.errores || [];
  });

  ngOnInit(): void {}

  typeof(val: any): string {
    return typeof val;
  }

  descargarPlantilla(): void {
    this.cargando.set(true);
    this.service.descargarPlantillaExcel().subscribe({
      next: (blob) => {
        this.cargando.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_resoluciones_primigenias.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Plantilla Excel descargada exitosamente', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.cargando.set(false);
        this.snackBar.open('Error al descargar plantilla Excel', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.procesarArchivoSeleccionado(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.procesarArchivoSeleccionado(event.dataTransfer.files[0]);
    }
  }

  private procesarArchivoSeleccionado(file: File): void {
    const isCsv = file.name.match(/\.csv$/i) || file.type === 'text/csv';
    const isExcel = file.name.match(/\.(xlsx|xls)$/i) || file.type.includes('spreadsheet') || file.type.includes('excel');

    if (!isCsv && !isExcel) {
      this.snackBar.open('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)', 'Cerrar', { duration: 4000 });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo supera los 10MB permitidos', 'Cerrar', { duration: 4000 });
      return;
    }

    this.archivoSeleccionado.set(file);
    this.limpiarResultados();
    this.generarVistaPrevia(file);
  }

  limpiarArchivo(): void {
    this.archivoSeleccionado.set(null);
    this.previewRows.set([]);
    this.limpiarResultados();
  }

  private limpiarResultados(): void {
    this.resultado.set(null);
    this.mostrarResultados.set(false);
  }

  cargarDesdeGoogleSheets(): void {
    const url = this.googleSheetsUrl().trim();
    if (!url || !this.googleSheetsService.validarUrl(url)) {
      this.snackBar.open('Ingresa una URL de Google Sheets pública válida', 'Cerrar', { duration: 3000 });
      return;
    }

    const id = this.googleSheetsService.extraerIdDeUrl(url) || url;
    localStorage.setItem('drtc_ultimo_google_sheets_url', url);
    this.cargandoGoogleSheets.set(true);

    this.googleSheetsService.obtenerDatosReales(id).subscribe({
      next: (sheetInfo) => {
        this.cargandoGoogleSheets.set(false);
        if (!sheetInfo || sheetInfo.datos.length === 0) {
          this.snackBar.open('La hoja de Google Sheets está vacía', 'Cerrar', { duration: 3000 });
          return;
        }

        const csvRows: string[] = [];
        csvRows.push(sheetInfo.encabezados.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
        for (const fila of sheetInfo.datos) {
          csvRows.push(fila.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const file = new File([blob], `google_sheet_primigenias_${Date.now()}.csv`, { type: 'text/csv' });

        this.procesarArchivoSeleccionado(file);
        this.snackBar.open(`✅ ${sheetInfo.totalFilas} registros cargados desde Google Sheets`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.cargandoGoogleSheets.set(false);
        this.snackBar.open(err.message || 'Error conectando a Google Sheets', 'Cerrar', { duration: 4000 });
      }
    });
  }

  private async generarVistaPrevia(file: File): Promise<void> {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheetName = wb.SheetNames.find(s => s.toUpperCase() === 'RESOLUCIONES_PRIMIGENIAS' || s.toUpperCase() === 'DATOS') || wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const previews: RegistroResolucionPreview[] = [];

      rawRows.forEach((row, index) => {
        const filaNum = index + 2;
        const getVal = (...keys: string[]) => {
          for (const k of keys) {
            const cleanK = k.trim().toUpperCase();
            const cleanK_underscore = cleanK.replace(/ /g, '_');
            for (const rowKey of Object.keys(row)) {
              const cleanRowKey = rowKey.trim().toUpperCase();
              const cleanRowKey_underscore = cleanRowKey.replace(/ /g, '_');
              if (cleanRowKey === cleanK || cleanRowKey_underscore === cleanK_underscore) {
                const val = String(row[rowKey]).trim();
                if (val !== '' && val.toLowerCase() !== 'nan') return val;
              }
            }
          }
          return '';
        };

        const idRes = getVal('ID_RESOLUCION', 'ID');
        const ruc = getVal('RUC_EMPRESA_ASOCIADA', 'RUC_EMPRESA', 'RUC', 'RUC_TITULAR', 'RUC EMPRESA', 'RUC_ASOCIADA', 'RUC_ASOCIADO');
        const nroRes = getVal('RESOLUCION_NUMERO', 'NRO_RESOLUCION', 'NUMERO_RESOLUCION', 'RESOLUCION', 'RESOLUCION_NUM');
        const siglas = getVal('SIGLAS', 'SIGLA', 'SIGLAS_RESOLUCION', 'SIGLA_RESOLUCION');
        const resAsoc = getVal('RESOLUCION_ASOCIADA');
        const tipoRes = getVal('TIPO_RESOLUCION');
        const fechaRes = getVal('FECHA_RESOLUCION', 'FECHA_EMISION', 'FECHA RESOLUCION');
        const fechaIni = getVal('FECHA_INICIO_VIGENCIA', 'FECHA_INICIO', 'FECHA INICIO');
        const fechaFin = getVal('FECHA_FIN_VIGENCIA', 'FECHA_FIN', 'FECHA FIN');
        const anios = getVal('ANIOS_VIGENCIA', 'AÑOS_VIGENCIA', 'VIGENCIA_ANIOS', 'VIGENCIA');
        const estado = getVal('ESTADO', 'ESTADO_LEGAL');
        const obs = getVal('OBSERVACIONES', 'OBSERVACION', 'NOTAS');
        const eficaciaAnt = getVal('EFICACIA ANTICIPADA', 'EFICACIA_ANTICIPADA', 'EFICACIA');
        const tipoAut = getVal('TIPO AUTORIZACION', 'TIPO_AUTORIZACION', 'TIPO_RESOLUCION', 'MODALIDAD', 'TIPO_SERVICIO');
        const link = getVal('LINK', 'LINK_DOCUMENTO', 'DRIVE', 'URL');
        const feErr = getVal('FE_DE_ERRTAS', 'FE_DE_ERRATAS', 'FE DE ERRATAS');
        const histCambios = getVal('HISTORIAL_CAMBIOS', 'HISTORIAL_MODIFICACIONES', 'HISTORIAL');
        const exps = getVal('EXPEDIENTE', 'EXPEDIENTES', 'NRO_EXPEDIENTE', 'CODIGOS_EXPEDIENTE');

        const errores: string[] = [];
        const cleanRucDigits = ruc ? ruc.replace(/\D/g, '') : '';
        if (!cleanRucDigits || cleanRucDigits.length !== 11) {
          errores.push(`RUC inválido ('${ruc}'). Debe contener exactamente 11 dígitos.`);
        }
        if (!nroRes) {
          errores.push('Número de resolución es obligatorio');
        }

        previews.push({
          fila: filaNum,
          idResolucion: idRes,
          ruc: cleanRucDigits || ruc || 'N/A',
          nroResolucion: nroRes || 'SIN NÚMERO',
          siglas,
          resolucionAsociada: resAsoc,
          tipoResolucion: tipoRes,
          fechaResolucion: fechaRes || 'N/A',
          fechaInicioVigencia: fechaIni || 'N/A',
          fechaFinVigencia: fechaFin || 'Auto-calculada',
          aniosVigencia: anios || 10,
          estado: estado ? estado.toUpperCase() : 'VIGENTE',
          observaciones: obs,
          eficaciaAnticipada: eficaciaAnt,
          tipoAutorizacion: tipoAut ? tipoAut.toUpperCase() : 'TURISMO',
          linkDocumento: link,
          feDeErratas: feErr,
          historialCambios: histCambios,
          expedientes: exps,
          esValido: errores.length === 0,
          errores
        });
      });

      this.previewRows.set(previews);
    } catch (e) {
      console.warn('No se pudo generar vista previa automática de Excel:', e);
      this.previewRows.set([]);
    }
  }

  procesarArchivo(): void {
    const file = this.archivoSeleccionado();
    if (!file) {
      this.snackBar.open('Selecciona un archivo o descarga datos de Google Sheets', 'Cerrar', { duration: 3000 });
      return;
    }

    this.cargando.set(true);

    if (this.soloValidar()) {
      setTimeout(() => {
        this.cargando.set(false);
        const validosCount = this.previewRows().filter(r => r.esValido !== false).length;
        const invalidosCount = this.previewRows().filter(r => r.esValido === false).length;

        this.resultado.set({
          validacion: {
            total_filas: this.previewRows().length,
            validos: validosCount,
            invalidos: invalidosCount,
            con_advertencias: 0
          }
        });
        this.mostrarResultados.set(true);
        this.snackBar.open(`Validación completada: ${validosCount} registros válidos`, 'OK', { duration: 3000 });
      }, 600);
    } else {
      const modo = this.modoProcesamiento();
      this.service.procesarCargaMasiva(file, modo).subscribe({
        next: (res) => {
          this.cargando.set(false);
          this.resultado.set(res);
          this.mostrarResultados.set(true);
          const creadasCount = res.resultado?.creadas ?? res.creadas ?? 0;
          this.snackBar.open(`Carga masiva completada: ${creadasCount} resoluciones primigenias procesadas/actualizadas`, 'OK', { duration: 4000 });
        },
        error: (err) => {
          this.cargando.set(false);
          const msg = err.error?.detail || err.message || 'Error al procesar la carga masiva';
          this.snackBar.open(`Error al procesar la carga masiva: ${msg}`, 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  procesarDespuesDeValidar(): void {
    this.soloValidar.set(false);
    this.procesarArchivo();
  }

  reiniciarProceso(): void {
    this.archivoSeleccionado.set(null);
    this.googleSheetsUrl.set('');
    this.previewRows.set([]);
    this.limpiarResultados();
    this.soloValidar.set(true);
  }

  getFilaError(err: any, index: number): string {
    if (typeof err === 'string') {
      const match = err.match(/Fila\s+(\d+)/i);
      if (match) return match[1];
    }
    return String(index + 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
