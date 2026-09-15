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
import { FlotaEmpresaService } from '../../services/flota-empresa.service';
import { GoogleSheetsService } from '../../services/google-sheets.service';

export interface RegistroFlotaPreview {
  fila: number;
  ruc: string;
  nro_resolucion_primigenia: string;
  nro_resolucion_hija: string;
  placa: string;
  es_cronologico: boolean;
  rutas: string;
  numero_tuc: string;
  estado: string;
  observaciones: string;
  fecha_cronologica: string;
  razon_social: string;
  fecha_resolucion_hija: string;
  num_expediente?: string;
  fecha_expediente?: string;
  link_tuc?: string;
  link_notificacion?: string;
  detalles?: string;
  esValido: boolean;
  errores: string[];
}

@Component({
  selector: 'app-carga-masiva-vehiculos-empresa',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatTableModule, MatTabsModule,
    MatChipsModule, MatTooltipModule, MatRadioModule,
    MatSlideToggleModule, MatSelectModule, MatFormFieldModule,
    MatInputModule, MatSnackBarModule
  ],
  styleUrls: ['./carga-masiva-vehiculos-empresa.component.scss'],
  template: `
    <div class="carga-masiva-wrapper">
      <!-- HEADER -->
      <header class="header-banner">
        <div class="header-title-group">
          <button mat-icon-button routerLink="/vehiculos-empresa" class="back-btn" matTooltip="Volver a Vehículos por Empresa">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-text">
            <div class="badge-tag">Flota Empresa</div>
            <h1>Carga Masiva de Vehículos por Empresa</h1>
            <p>Importa la flota habilitada desde el archivo DB_VEHICULOS (Excel, CSV o Google Sheets)</p>
          </div>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" class="action-btn download-btn"
                  (click)="descargarPlantilla()" [disabled]="cargando()">
            <mat-icon>download</mat-icon>
            Descargar Plantilla Excel
          </button>
        </div>
      </header>

      <div class="main-content-grid">
        <!-- PANEL ORIGEN DE DATOS -->
        <mat-card class="upload-panel-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title-flex">
              <mat-icon class="panel-icon">cloud_upload</mat-icon>
              <span>Origen de Datos</span>
            </mat-card-title>
            <mat-card-subtitle>
              Selecciona si subirás un archivo local (.xlsx, .xls, .csv) o la URL de Google Sheets
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content class="card-body">
            <!-- Selector de origen -->
            <div class="source-selector">
              <button type="button" class="source-tab"
                      [class.active]="origenCarga() === 'archivo'"
                      (click)="origenCarga.set('archivo')">
                <mat-icon>insert_drive_file</mat-icon> Archivo Local (.xlsx, .xls, .csv)
              </button>
              <button type="button" class="source-tab"
                      [class.active]="origenCarga() === 'google-sheets'"
                      (click)="origenCarga.set('google-sheets')">
                <mat-icon class="text-green">grid_on</mat-icon> Google Sheets (URL Pública)
              </button>
            </div>

            @if (origenCarga() === 'archivo') {
              <!-- Zona Drag & Drop -->
              <div class="dropzone"
                   [class.drag-active]="isDragOver()"
                   [class.has-file]="archivoSeleccionado()"
                   (dragover)="onDragOver($event)"
                   (dragleave)="onDragLeave($event)"
                   (drop)="onDrop($event)"
                   (click)="fileInput.click()">
                <input #fileInput type="file" accept=".xlsx,.xls,.csv,text/csv"
                       (change)="onFileSelected($event)" style="display:none;">
                @if (archivoSeleccionado(); as file) {
                  <div class="dropzone-file-selected">
                    <div class="file-icon-wrapper">
                      <mat-icon>{{ file.name.endsWith('.csv') ? 'description' : 'insert_drive_file' }}</mat-icon>
                    </div>
                    <div class="file-details">
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    </div>
                    <button mat-icon-button color="warn" (click)="$event.stopPropagation(); limpiarArchivo()">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </div>
                } @else {
                  <div class="dropzone-prompt">
                    <div class="cloud-icon-circle">
                      <mat-icon>upload_file</mat-icon>
                    </div>
                    <h3>Arrastra tu archivo aquí</h3>
                    <p>DB_VEHICULOS en Excel (.xlsx, .xls) o CSV (.csv)</p>
                    <span class="file-limit-hint">Tamaño máximo recomendado: 10MB</span>
                  </div>
                }
              </div>
            } @else {
              <!-- Google Sheets -->
              <div class="google-sheets-box">
                <div class="sheets-header-info">
                  <mat-icon class="sheets-icon">table_chart</mat-icon>
                  <div>
                    <h4>Importar desde Google Sheets sin API Key</h4>
                    <p>Asegúrate de que la hoja esté configurada como <strong>"Cualquier persona con el enlace puede ver"</strong>.</p>
                  </div>
                </div>
                <div class="sheets-input-row">
                  <mat-form-field appearance="outline" class="url-input-field">
                    <mat-label>Enlace público de Google Sheets</mat-label>
                    <input matInput [ngModel]="googleSheetsUrl()"
                           (ngModelChange)="googleSheetsUrl.set($event)"
                           placeholder="https://docs.google.com/spreadsheets/d/...">
                    <mat-icon matPrefix>link</mat-icon>
                    @if (googleSheetsUrl()) {
                      <button matSuffix mat-icon-button (click)="googleSheetsUrl.set('')">
                        <mat-icon>clear</mat-icon>
                      </button>
                    }
                  </mat-form-field>
                  <button mat-raised-button color="primary" class="btn-fetch-sheets"
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
                    <div class="file-icon-wrapper"><mat-icon>check_circle</mat-icon></div>
                    <div class="file-details">
                      <span class="file-name">Google Sheet Convertido (CSV)</span>
                      <span class="file-size">{{ formatFileSize(file.size) }} | Listo para procesar</span>
                    </div>
                    <button mat-icon-button color="warn" (click)="limpiarArchivo()">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </div>
                }
              </div>
            }

            <!-- VISTA PREVIA -->
            @if (archivoSeleccionado() && previewRows().length > 0 && !mostrarResultados()) {
              <div class="data-preview-container animate-fade-in">
                <!-- Banner de destino -->
                <div class="destination-target-banner">
                  <div class="dest-info">
                    <mat-icon class="dest-icon">storage</mat-icon>
                    <div>
                      <h4 class="dest-title">Destino de Carga Confirmado</h4>
                      <p class="dest-desc">
                        Base de Datos: <strong>DRTC Puno (MongoDB)</strong>
                        &rarr; Colección: <code>flota_empresa</code>
                      </p>
                    </div>
                  </div>
                  <div class="dest-stats">
                    <span class="stat-pill total-pill">
                      <mat-icon>format_list_numbered</mat-icon> {{ previewRows().length }} Registros
                    </span>
                    <span class="stat-pill valid-pill">
                      <mat-icon>check_circle</mat-icon> {{ totalValidosPreview() }} Válidos
                    </span>
                    @if (totalInvalidosPreview() > 0) {
                      <span class="stat-pill invalid-pill">
                        <mat-icon>warning</mat-icon> {{ totalInvalidosPreview() }} Con Observación
                      </span>
                    }
                  </div>
                </div>

                <!-- Mapeo de columnas -->
                <div class="mapping-section">
                  <h4 class="section-subtitle">
                    <mat-icon>alt_route</mat-icon>
                    Correspondencia y Mapeo de Columnas (Excel DB_VEHICULOS &rarr; DRTC Puno)
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

                <!-- Preview de primeras filas -->
                <div class="extracted-data-preview">
                  <h4 class="section-subtitle">
                    <mat-icon>visibility</mat-icon>
                    Vista Previa (Primeras {{ Math.min(15, previewRows().length) }} filas)
                  </h4>
                  <div class="tab-table-wrapper">
                    <table class="modern-table preview-table">
                      <thead>
                        <tr>
                          <th (click)="toggleSort('fila')" class="sortable-th">
                            <span>Fila</span><mat-icon class="sort-icon">{{ getSortIcon('fila') }}</mat-icon>
                          </th>
                          <th (click)="toggleSort('esValido')" class="sortable-th">
                            <span>Estado</span><mat-icon class="sort-icon">{{ getSortIcon('esValido') }}</mat-icon>
                          </th>
                          <th>RUC</th>
                          <th>Res. Primigenia</th>
                          <th>Res. Hija</th>
                          <th>Placa</th>
                          <th>Rutas</th>
                          <th>TUC</th>
                          <th>Estado Veh.</th>
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
                            <td><span class="code-badge info-code">{{ r.nro_resolucion_primigenia }}</span></td>
                            <td>
                              @if (r.nro_resolucion_hija) {
                                <span class="code-badge" style="background:#fff7ed;color:#c2410c;">{{ r.nro_resolucion_hija }}</span>
                              } @else { <span>-</span> }
                            </td>
                            <td>
                              @if (!r.es_cronologico) {
                                <span class="code-badge" style="background:#1e1b4b;color:#fff;">{{ r.placa }}</span>
                              } @else {
                                <span style="color:#94a3b8;font-style:italic;">—</span>
                              }
                            </td>
                            <td><span style="font-size:11px;">{{ r.rutas || '-' }}</span></td>
                            <td>
                              @if (r.numero_tuc) {
                                <span class="type-tag" style="background:#7c3aed;color:#fff;">{{ r.numero_tuc }}</span>
                              } @else { <span>-</span> }
                            </td>
                            <td>
                              @if (r.estado) {
                                <span class="type-tag">{{ r.estado }}</span>
                              } @else { <span>-</span> }
                            </td>
                            <td>
                              @if (!r.esValido && r.errores.length) {
                                <span class="err-text"><mat-icon>error_outline</mat-icon> {{ r.errores.join(', ') }}</span>
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

            <!-- Opciones de procesamiento -->
            <div class="options-container">
              <div class="option-group">
                <label class="option-label"><mat-icon>tune</mat-icon> Modo de Operación</label>
                <div class="pill-toggle-group">
                  <button type="button" class="pill-btn" [class.active]="soloValidar()"
                          (click)="soloValidar.set(true)">
                    <mat-icon>fact_check</mat-icon> Solo Validar
                  </button>
                  <button type="button" class="pill-btn" [class.active]="!soloValidar()"
                          (click)="soloValidar.set(false)">
                    <mat-icon>play_circle</mat-icon> Validar y Cargar
                  </button>
                </div>
              </div>
              @if (!soloValidar()) {
                <div class="option-group">
                  <label class="option-label">
                    <mat-icon>published_with_changes</mat-icon> Estrategia de Carga
                  </label>
                  <div class="pill-toggle-group">
                    <button type="button" class="pill-btn"
                            [class.active]="modoProcesamiento() === 'upsert'"
                            (click)="modoProcesamiento.set('upsert')"
                            matTooltip="Crea o actualiza si ya existe (mismo RUC + primigenia + hija + placa)">
                      <mat-icon>sync_alt</mat-icon> Crear o Actualizar
                    </button>
                    <button type="button" class="pill-btn"
                            [class.active]="modoProcesamiento() === 'crear'"
                            (click)="modoProcesamiento.set('crear')"
                            matTooltip="Solo inserta registros nuevos">
                      <mat-icon>add_circle_outline</mat-icon> Solo Crear
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Info banner -->
            <div class="info-pill-bar">
              <mat-icon>info</mat-icon>
              <span>
                <strong>Normalización automática:</strong>
                TUC (T-012345), Rutas (separadas por coma), Observaciones (split por |),
                Registros cronológicos (placa vacía/guion) solo aparecen en Vista Cronológica.
              </span>
            </div>

            <!-- Botón principal -->
            <div class="main-action-area">
              <button mat-raised-button color="accent" class="btn-process-hero"
                      [disabled]="!archivoSeleccionado() || cargando()"
                      (click)="procesarArchivo()">
                <mat-icon [class.spin-icon]="cargando()">
                  {{ cargando() ? 'sync' : (soloValidar() ? 'task_alt' : 'rocket_launch') }}
                </mat-icon>
                <span>
                  {{ cargando() ? 'Procesando...' : (soloValidar() ? 'Validar Estructura' : 'Iniciar Carga Masiva') }}
                </span>
              </button>
            </div>

            @if (cargando()) {
              <div class="loading-progress-box">
                <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                <p class="progress-subtext">
                  {{ soloValidar() ? 'Validando registros y estructura...' : 'Insertando flota empresa en MongoDB...' }}
                </p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- RESULTADOS -->
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
                  {{ soloValidar()
                     ? 'Se completó la verificación sin modificar la base de datos'
                     : 'Se procesó la flota empresa correctamente' }}
                </mat-card-subtitle>
              </mat-card-header>

              <mat-card-content class="card-body">
                <!-- KPIs -->
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
                      <span class="kpi-num">{{ totalCreados() }}</span>
                      <span class="kpi-label">{{ soloValidar() ? 'Válidos' : 'Creados' }}</span>
                    </div>
                  </div>
                  @if (!soloValidar() && totalActualizados() > 0) {
                    <div class="kpi-card warning">
                      <mat-icon>update</mat-icon>
                      <div class="kpi-data">
                        <span class="kpi-num">{{ totalActualizados() }}</span>
                        <span class="kpi-label">Actualizados</span>
                      </div>
                    </div>
                  }
                  @if (totalErrores() > 0) {
                    <div class="kpi-card danger">
                      <mat-icon>error_outline</mat-icon>
                      <div class="kpi-data">
                        <span class="kpi-num">{{ totalErrores() }}</span>
                        <span class="kpi-label">Con Errores</span>
                      </div>
                    </div>
                  }
                </div>

                <!-- Tabs de detalle -->
                <mat-tab-group class="modern-tabs" animationDuration="200ms">
                  <mat-tab>
                    <ng-template mat-tab-label>
                      <mat-icon class="tab-icon success-icon">add_circle</mat-icon>
                      <span>{{ soloValidar() ? 'Registros Válidos' : 'Registros Creados' }} ({{ totalCreados() }})</span>
                    </ng-template>
                    <div class="tab-table-wrapper">
                      @if (registrosCreados().length > 0) {
                        <table mat-table [dataSource]="registrosCreados().slice(0, 25)" class="modern-table">
                          <ng-container matColumnDef="fila">
                            <th mat-header-cell *matHeaderCellDef>Fila</th>
                            <td mat-cell *matCellDef="let reg; let i = index">
                              <strong>#{{ reg.fila || (i + 1) }}</strong>
                            </td>
                          </ng-container>
                          <ng-container matColumnDef="ruc">
                            <th mat-header-cell *matHeaderCellDef>RUC</th>
                            <td mat-cell *matCellDef="let reg">
                              <span class="code-badge">{{ reg.ruc || '-' }}</span>
                            </td>
                          </ng-container>
                          <ng-container matColumnDef="placa">
                            <th mat-header-cell *matHeaderCellDef>Placa</th>
                            <td mat-cell *matCellDef="let reg">
                              <span class="code-badge" style="background:#1e1b4b;color:#fff;">
                                {{ reg.placa || '-' }}
                              </span>
                            </td>
                          </ng-container>
                          <ng-container matColumnDef="estado">
                            <th mat-header-cell *matHeaderCellDef>Estado</th>
                            <td mat-cell *matCellDef="let reg">
                              <span class="status-chip success">{{ soloValidar() ? 'VÁLIDA' : 'CREADA' }}</span>
                            </td>
                          </ng-container>
                          <tr mat-header-row *matHeaderRowDef="['fila', 'ruc', 'placa', 'estado']"></tr>
                          <tr mat-row *matRowDef="let row; columns: ['fila', 'ruc', 'placa', 'estado'];"></tr>
                        </table>
                        @if (registrosCreados().length > 25) {
                          <div class="table-footer-hint">
                            ... y {{ registrosCreados().length - 25 }} registros adicionales procesados.
                          </div>
                        }
                      } @else {
                        <p class="no-change">No hay registros detallados disponibles.</p>
                      }
                    </div>
                  </mat-tab>

                  @if (erroresList().length > 0) {
                    <mat-tab>
                      <ng-template mat-tab-label>
                        <mat-icon class="tab-icon warn-icon">error_outline</mat-icon>
                        <span>Errores ({{ erroresList().length }})</span>
                      </ng-template>
                      <div class="tab-table-wrapper">
                        <table mat-table [dataSource]="erroresList().slice(0, 50)" class="modern-table error-table">
                          <ng-container matColumnDef="fila">
                            <th mat-header-cell *matHeaderCellDef>Fila</th>
                            <td mat-cell *matCellDef="let err; let i = index">
                              <span class="type-tag" style="background:#fee2e2;color:#991b1b;font-weight:800;">
                                #{{ getFilaError(err, i) }}
                              </span>
                            </td>
                          </ng-container>
                          <ng-container matColumnDef="detalle">
                            <th mat-header-cell *matHeaderCellDef>Detalle del Error</th>
                            <td mat-cell *matCellDef="let err">
                              <span class="err-text">
                                {{ typeof err === 'string' ? err : (err.error || 'Error de validación') }}
                              </span>
                            </td>
                          </ng-container>
                          <tr mat-header-row *matHeaderRowDef="['fila', 'detalle']"></tr>
                          <tr mat-row *matRowDef="let row; columns: ['fila', 'detalle'];"></tr>
                        </table>
                      </div>
                    </mat-tab>
                  }
                </mat-tab-group>

                <!-- Footer de acciones -->
                <div class="results-actions-bar">
                  @if (soloValidar() && totalCreados() > 0) {
                    <button mat-raised-button color="accent" (click)="procesarDespuesDeValidar()">
                      <mat-icon>play_circle</mat-icon>
                      Procesar Registros Válidos Ahora
                    </button>
                  }
                  @if (!soloValidar() && totalCreados() > 0) {
                    <button mat-raised-button color="primary" routerLink="/vehiculos-empresa">
                      <mat-icon>business</mat-icon>
                      Ver Vehículos por Empresa
                    </button>
                  }
                  <button mat-stroked-button (click)="reiniciarProceso()">
                    <mat-icon>refresh</mat-icon> Cargar Otro Archivo
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        }
      </div>
    </div>
  `
})
export class CargaMasivaVehiculosEmpresaComponent implements OnInit {
  private service = inject(FlotaEmpresaService);
  private googleSheetsService = inject(GoogleSheetsService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  Math = Math;

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
  previewRows = signal<RegistroFlotaPreview[]>([]);

  sortField = signal<string>('fila');
  sortDirection = signal<'asc' | 'desc'>('asc');

  columnasMapeadas = computed(() => [
    { archivoCol: 'A / RUC', destCampo: 'ruc', tipo: 'RUC (11 dígitos)', requerido: true },
    { archivoCol: 'B / RDR_PRIMIGENIA', destCampo: 'nro_resolucion_primigenia', tipo: 'R-0123-2026 (normalizado)', requerido: true },
    { archivoCol: 'C / RDR (HIJA)', destCampo: 'nro_resolucion_hija', tipo: 'Texto (I/S/M/O/C)', requerido: false },
    { archivoCol: 'E / PLACA', destCampo: 'placa', tipo: 'Placa A2B-123', requerido: false },
    { archivoCol: 'F / RUTA', destCampo: 'rutas[]', tipo: 'Array normalizado', requerido: false },
    { archivoCol: 'G / TUC', destCampo: 'numero_tuc', tipo: 'T-012345 / T-PLACA', requerido: false },
    { archivoCol: 'H / ESTADO', destCampo: 'estado', tipo: 'Enum estado vehicular', requerido: false },
    { archivoCol: 'I / OBSERVACIONES', destCampo: 'observaciones_historial[]', tipo: 'Array (split |)', requerido: false },
    { archivoCol: 'J / FECHA', destCampo: 'fecha_cronologica', tipo: 'Fecha (DD/MM/YYYY)', requerido: false },
    { archivoCol: 'K / RAZON SOCIAL', destCampo: 'razon_social', tipo: 'Texto', requerido: false },
    { archivoCol: 'L / FECHA HIJA', destCampo: 'fecha_resolucion_hija', tipo: 'Fecha (DD/MM/YYYY)', requerido: false },
    { archivoCol: 'O / ESTADO PRIMIGENIA', destCampo: 'estado_primigenia', tipo: 'ACTIVA / INACTIVA', requerido: false },
    { archivoCol: 'P / NUM_EXPEDIENTE', destCampo: 'num_expediente', tipo: 'Texto expediente', requerido: false },
    { archivoCol: 'Q / FECHA_EXPEDIENTE', destCampo: 'fecha_expediente', tipo: 'Fecha (DD/MM/YYYY)', requerido: false },
    { archivoCol: 'R / LINK_TUC', destCampo: 'link_tuc', tipo: 'URL Drive TUC', requerido: false },
    { archivoCol: 'S / LINK_NOTIFICACION', destCampo: 'link_notificacion', tipo: 'URL Notificación', requerido: false },
    { archivoCol: 'T / DETALLES', destCampo: 'detalles', tipo: 'Texto libre', requerido: false },
  ]);

  // Computed: sorting en preview
  totalValidosPreview = computed(() => this.previewRows().filter(r => r.esValido !== false).length);
  totalInvalidosPreview = computed(() => this.previewRows().filter(r => r.esValido === false).length);

  previewRowsOrdenadas = computed(() => {
    const rows = this.previewRows();
    const field = this.sortField();
    const isAsc = this.sortDirection() === 'asc';
    return [...rows].sort((a, b) => {
      if (field === 'fila') return isAsc ? a.fila - b.fila : b.fila - a.fila;
      if (field === 'esValido') return isAsc
        ? (a.esValido ? 1 : 0) - (b.esValido ? 1 : 0)
        : (b.esValido ? 1 : 0) - (a.esValido ? 1 : 0);
      const va = (a as any)[field] ?? '';
      const vb = (b as any)[field] ?? '';
      const c = String(va).localeCompare(String(vb), 'es', { numeric: true });
      return isAsc ? c : -c;
    });
  });

  // Computed: resultados
  totalFilas = computed(() => {
    const res = this.resultado();
    if (!res) return this.previewRows().length;
    return res.resultado?.total_filas ?? res.total_filas ?? this.previewRows().length;
  });

  totalCreados = computed(() => {
    const res = this.resultado();
    if (!res) return 0;
    if (this.soloValidar()) return this.previewRows().filter(r => r.esValido !== false).length;
    return res.resultado?.creados ?? res.creados ?? 0;
  });

  totalActualizados = computed(() => {
    const res = this.resultado();
    if (!res || this.soloValidar()) return 0;
    return res.resultado?.actualizados ?? res.actualizados ?? 0;
  });

  totalErrores = computed(() => {
    const res = this.resultado();
    if (!res) return 0;
    if (this.soloValidar()) return this.previewRows().filter(r => r.esValido === false).length;
    return (res.resultado?.errores || res.errores || []).length;
  });

  registrosCreados = computed(() => {
    const res = this.resultado();
    if (!res) return this.previewRows().filter(r => r.esValido !== false);
    if (this.soloValidar()) return this.previewRows().filter(r => r.esValido !== false);
    return this.previewRows().filter(r => r.esValido !== false);
  });

  erroresList = computed(() => {
    const res = this.resultado();
    if (!res) return [];
    if (this.soloValidar()) {
      return this.previewRows()
        .filter(r => r.errores && r.errores.length)
        .map(r => `Fila ${r.fila}: ${r.errores.join(', ')}`);
    }
    return res.resultado?.errores || res.errores || [];
  });

  ngOnInit(): void {}

  toggleSort(col: string): void {
    if (this.sortField() === col) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(col);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(col: string): string {
    if (this.sortField() !== col) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // ---- ARCHIVO ----
  onFileSelected(e: any): void {
    const file = e.target.files[0];
    if (file) this.procesarArchivoSeleccionado(file);
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragOver.set(true); }
  onDragLeave(e: DragEvent): void { e.preventDefault(); this.isDragOver.set(false); }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver.set(false);
    if (e.dataTransfer?.files?.length) this.procesarArchivoSeleccionado(e.dataTransfer.files[0]);
  }

  private procesarArchivoSeleccionado(file: File): void {
    const isCsv = file.name.match(/\.csv$/i) || file.type === 'text/csv';
    const isExcel = file.name.match(/\.(xlsx|xls)$/i) || file.type.includes('spreadsheet');
    if (!isCsv && !isExcel) {
      this.snackBar.open('Selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)', 'Cerrar', { duration: 4000 });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      this.snackBar.open('El archivo supera los 15MB permitidos', 'Cerrar', { duration: 4000 });
      return;
    }
    this.archivoSeleccionado.set(file);
    this.resultado.set(null);
    this.mostrarResultados.set(false);
    this.generarVistaPrevia(file);
  }

  limpiarArchivo(): void {
    this.archivoSeleccionado.set(null);
    this.previewRows.set([]);
    this.resultado.set(null);
    this.mostrarResultados.set(false);
  }

  // ---- GOOGLE SHEETS ----
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
        csvRows.push(sheetInfo.encabezados.map((h: string) => `"${h.replace(/"/g, '""')}"`).join(','));
        for (const fila of sheetInfo.datos) {
          csvRows.push(fila.map((c: string) => `"${(c || '').replace(/"/g, '""')}"`).join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const file = new File([blob], `google_sheet_flota_${Date.now()}.csv`, { type: 'text/csv' });
        this.procesarArchivoSeleccionado(file);
        this.snackBar.open(`✅ ${sheetInfo.totalFilas} registros cargados desde Google Sheets`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.cargandoGoogleSheets.set(false);
        this.snackBar.open(err.message || 'Error conectando a Google Sheets', 'Cerrar', { duration: 4000 });
      }
    });
  }

  // ---- PREVIEW LOCAL ----
  private async generarVistaPrevia(file: File): Promise<void> {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheetName = wb.SheetNames.find(s =>
        s.toUpperCase().includes('VEHICULO') || s.toUpperCase().includes('FLOTA')
      ) || wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 'A' });

      // Detectar fila de datos (omitir fila de encabezados o descripciones)
      let dataRows = rawRows;
      if (rawRows.length > 0) {
        const firstRowStr = JSON.stringify(rawRows[0]).toUpperCase();
        if (firstRowStr.includes('RUC') || firstRowStr.includes('RDR')) {
          dataRows = rawRows.slice(1);
        }
        // Si hay una segunda fila descriptiva como la plantilla (ej. RUC de la empresa...)
        if (dataRows.length > 0) {
          const secondRowStr = String(dataRows[0]['A'] || '').toUpperCase();
          if (secondRowStr.includes('RUC') || secondRowStr.includes('EMPRESA') || secondRowStr.includes('OBLIGATORIO')) {
            dataRows = dataRows.slice(1);
          }
        }
      }

      const getVal = (r: any, letter: string, names: string[]) => {
        if (!r) return '';
        // 1. Intentar por letra directamente
        if (r[letter] !== undefined && r[letter] !== null && String(r[letter]).trim() !== '') {
          return String(r[letter]).trim();
        }
        // 2. Intentar por clave de nombre de columna
        for (const k of Object.keys(r)) {
          const keyUpper = k.trim().toUpperCase();
          for (const n of names) {
            if (keyUpper === n.toUpperCase() || keyUpper.replace(/\s+/g, '_') === n.toUpperCase().replace(/\s+/g, '_')) {
              return String(r[k]).trim();
            }
          }
        }
        return '';
      };

      const previews: RegistroFlotaPreview[] = dataRows.map((row, idx) => {
        const ruc = getVal(row, 'A', ['RUC']).replace(/\D/g, '');
        const primigeniaRaw = getVal(row, 'B', ['RDR_PRIMIGENIA', 'RDR PRIMIGENIA', 'NRO_RESOLUCION_PRIMIGENIA']);
        const primigenia = this.normalizarResolucionCode(primigeniaRaw);
        const hijaRaw = getVal(row, 'C', ['RDR', 'NRO_RESOLUCION_HIJA']);
        const hija = this.normalizarResolucionCode(hijaRaw);
        const placa = getVal(row, 'E', ['PLACA']);
        const ruta = getVal(row, 'F', ['RUTA']);
        const tuc = getVal(row, 'G', ['TUC']);
        const estado = getVal(row, 'H', ['ESTADO']);
        const obs = getVal(row, 'I', ['OBSERVACIONES']);
        const fecha = getVal(row, 'J', ['FECHA', 'FECHA_CRONOLOGICA']);
        const razon = getVal(row, 'K', ['RAZON SOCIAL', 'RAZON_SOCIAL']);
        const fechaHija = getVal(row, 'L', ['FECHA HIJA', 'FECHA_HIJA']);

        const numExpediente = getVal(row, 'P', ['NUM_EXPEDIENTE', 'EXPEDIENTE']);
        const fechaExpediente = getVal(row, 'Q', ['FECHA_EXPEDIENTE', 'FECHA EXPEDIENTE']);
        const linkTuc = getVal(row, 'R', ['LINK_TUC', 'LINK TUC']);
        const linkNotificacion = getVal(row, 'S', ['LINK_NOTIFICACION', 'LINK NOTIFICACION']);
        const detalles = getVal(row, 'T', ['DETALLES']);

        const esCrono = !placa || placa === '-' || placa === '–' || placa.toUpperCase() === 'NAN';
        const errores: string[] = [];
        if (!ruc || ruc.length < 8) errores.push(`RUC inválido: '${ruc}'`);
        if (!primigenia || primigenia === '' || primigenia.toUpperCase() === 'NAN') errores.push('Sin resolución primigenia');

        // Normalizar TUC (T-012345 o T-PLACA)
        let tucNorm = tuc;
        if (!tucNorm || tucNorm === '-' || tucNorm === '–') {
          if (!esCrono) tucNorm = `T-${placa.toUpperCase()}`;
        } else if (tucNorm.startsWith('T-')) {
          const sinP = tucNorm.substring(2);
          if (/^\d+$/.test(sinP)) tucNorm = `T-${sinP.padStart(6, '0')}`;
        } else if (/^\d+$/.test(tucNorm)) {
          tucNorm = `T-${tucNorm.padStart(6, '0')}`;
        } else if (!esCrono) {
          tucNorm = `T-${placa.toUpperCase()}`;
        }
        const rutasNorm = this.normalizarRutasPreview(ruta);

        return {
          fila: idx + 2,
          ruc: ruc || String(row['A'] || ''),
          nro_resolucion_primigenia: primigenia || 'SIN NRO',
          nro_resolucion_hija: hija,
          placa: esCrono ? '-' : placa.toUpperCase(),
          es_cronologico: esCrono,
          rutas: rutasNorm,
          numero_tuc: tucNorm,
          estado: estado.toUpperCase(),
          observaciones: obs,
          fecha_cronologica: fecha,
          razon_social: razon,
          fecha_resolucion_hija: fechaHija,
          num_expediente: numExpediente,
          fecha_expediente: fechaExpediente,
          link_tuc: linkTuc,
          link_notificacion: linkNotificacion,
          detalles: detalles,
          esValido: errores.length === 0,
          errores
        };
      });

      this.previewRows.set(previews);
    } catch (e) {
      console.warn('No se pudo generar vista previa:', e);
      this.previewRows.set([]);
    }
  }

  normalizarResolucionCode(rawVal?: string, defaultYear: number | string = new Date().getFullYear()): string {
    if (!rawVal) return '';
    let str = rawVal.trim().toUpperCase();
    if (!str || str === 'NAN' || str === '-' || str === 'NONE') return '';
    str = str.replace(/\s*[-_ ]\s*(FE|[ISRMDCO])$/i, '').trim();
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
        return `R-${numDigits.padStart(4, '0')}-${defaultYear}`;
      }
    }
    return str.startsWith('R-') ? str : `R-${str}`;
  }

  normalizarRutasPreview(val: string): string {
    if (!val) return '-';
    const s = val.trim();
    if (!s || s === '-') return '-';

    if (/[,\s\-/|]/.test(s)) {
      const partes = s.split(/[,\s\-/|]+/).map(p => p.trim()).filter(p => p && p.toUpperCase() !== 'NAN');
      const norm = partes.map(p => /^\d+$/.test(p) ? p.padStart(2, '0') : p);
      return Array.from(new Set(norm)).join(',');
    }

    if (/^\d+$/.test(s)) {
      if (s.length === 1) return s.padStart(2, '0');
      if (s.length === 2) return s;
      const tokens: string[] = [];
      let i = 0;
      if (s.length % 2 !== 0) {
        tokens.push(s[0].padStart(2, '0'));
        i = 1;
      }
      while (i < s.length) {
        tokens.push(s.substring(i, i + 2).padStart(2, '0'));
        i += 2;
      }
      return Array.from(new Set(tokens)).join(',');
    }

    return s;
  }

  // ---- PROCESAR ----
  procesarArchivo(): void {
    const file = this.archivoSeleccionado();
    if (!file) {
      this.snackBar.open('Selecciona un archivo primero', 'Cerrar', { duration: 3000 });
      return;
    }
    this.cargando.set(true);

    if (this.soloValidar()) {
      setTimeout(() => {
        this.cargando.set(false);
        this.resultado.set({ validacion: { total_filas: this.previewRows().length } });
        this.mostrarResultados.set(true);
        const v = this.totalValidosPreview();
        this.snackBar.open(`Validación: ${v} registros válidos`, 'OK', { duration: 3000 });
      }, 600);
    } else {
      const modo = this.modoProcesamiento();
      this.service.procesarCargaMasiva(file, modo).subscribe({
        next: (res) => {
          this.cargando.set(false);
          this.resultado.set(res);
          this.mostrarResultados.set(true);
          const creados = res.resultado?.creados ?? 0;
          const actualizados = res.resultado?.actualizados ?? 0;
          this.snackBar.open(
            `Carga masiva completada: ${creados} creados, ${actualizados} actualizados`,
            'OK', { duration: 5000 }
          );
        },
        error: (err) => {
          this.cargando.set(false);
          const msg = err.error?.detail || err.message || 'Error al procesar la carga masiva';
          this.snackBar.open(`Error: ${msg}`, 'Cerrar', { duration: 5000 });
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
    this.resultado.set(null);
    this.mostrarResultados.set(false);
    this.soloValidar.set(false);
  }

  descargarPlantilla(): void {
    this.service.descargarPlantilla();
    this.snackBar.open('Descargando plantilla Excel...', 'OK', { duration: 2500 });
  }

  getFilaError(err: any, i: number): string {
    if (typeof err === 'string') {
      const m = err.match(/Fila\s+(\d+)/i);
      if (m) return m[1];
    }
    if (err?.fila) return String(err.fila);
    return String(i + 1);
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
