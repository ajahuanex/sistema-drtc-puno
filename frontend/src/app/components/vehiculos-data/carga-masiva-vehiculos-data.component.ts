import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';

import { VehiculoDataService, VehiculoDataPreviewResponse, VehiculoDataEjecutarResponse } from '../../services/vehiculo-data.service';

@Component({
  selector: 'app-carga-masiva-vehiculos-data',
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
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  styleUrl: './carga-masiva-vehiculos-data.component.scss',
  template: `
    <div class="carga-masiva-wrapper">
      <!-- HEADER BANNER (REPLICA EXACTA RESOLUCIONES PRIMIGENIAS) -->
      <header class="header-banner">
        <div class="header-title-group">
          <button mat-icon-button routerLink="/vehiculos-data" class="back-btn" matTooltip="Volver a Datos Técnicos Vehiculares">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-text">
            <div class="badge-tag">Base de Datos General de Vehículos</div>
            <h1>Carga Masiva de Datos Técnicos Vehiculares</h1>
            <p>Importa masivamente fichas técnicas oficiales (41 columnas) desde Excel o Google Sheets para la Colección <code>vehiculos_data</code>.</p>
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
        <!-- ORIGEN DE DATOS -->
        <mat-card class="upload-panel-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title-flex">
              <mat-icon class="panel-icon">cloud_upload</mat-icon>
              <span>Origen de Datos Técnicos</span>
            </mat-card-title>
            <mat-card-subtitle>
              Selecciona si subirás un archivo local (.xlsx, .csv) o pegarás el enlace de una hoja de Google Sheets pública.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content class="card-body">
            <!-- TAB SWITCHER -->
            <div class="source-selector">
              <button type="button"
                      class="source-tab"
                      [class.active]="origenCarga() === 'archivo'"
                      (click)="origenCarga.set('archivo')">
                <mat-icon>insert_drive_file</mat-icon>
                Archivo Local (.xlsx, .csv)
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
              <!-- DROPZONE -->
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
                      <mat-icon>description</mat-icon>
                    </div>
                    <div class="file-details">
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    </div>
                    <button mat-icon-button color="warn" (click)="$event.stopPropagation(); limpiarTodo()" matTooltip="Remover archivo">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </div>
                } @else {
                  <div class="dropzone-prompt">
                    <div class="cloud-icon-circle">
                      <mat-icon>upload_file</mat-icon>
                    </div>
                    <h3>Arrastra tu archivo aquí</h3>
                    <p>Soporta hojas Excel (.xlsx, .xls) o archivos CSV (.csv) con 41 columnas técnicas</p>
                  </div>
                }
              </div>
            } @else {
              <!-- GOOGLE SHEETS INPUT -->
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
                    <input matInput
                           [ngModel]="googleSheetsUrl()"
                           (ngModelChange)="googleSheetsUrl.set($event)"
                           placeholder="https://docs.google.com/spreadsheets/d/...">
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
                          [disabled]="!googleSheetsUrl() || cargando()"
                          (click)="cargarDesdeGoogleSheets()">
                    <mat-icon [class.spin-icon]="cargando()">
                      {{ cargando() ? 'sync' : 'cloud_download' }}
                    </mat-icon>
                    <span>{{ cargando() ? 'Procesando...' : 'Obtener Datos' }}</span>
                  </button>
                </div>
              </div>
            }

            <!-- VISTA PREVIA DE DATOS Y MAPEO DE COLUMNAS -->
            @if (previewData()) {
              <div class="data-preview-container animate-fade-in" style="margin-top:24px;">
                <!-- TARGET DESTINATION BANNER -->
                <div class="destination-target-banner">
                  <div class="dest-info">
                    <mat-icon class="dest-icon">storage</mat-icon>
                    <div>
                      <h4 class="dest-title">Destino de Carga Confirmado</h4>
                      <p class="dest-desc">Base de Datos: <strong>DRTC Puno (MongoDB)</strong> &rarr; Colección: <code>vehiculos_data</code></p>
                    </div>
                  </div>
                  <div class="dest-stats">
                    <span class="stat-pill total-pill"><mat-icon>format_list_numbered</mat-icon> {{ previewData()?.total }} Registros</span>
                    <span class="stat-pill valid-pill"><mat-icon>check_circle</mat-icon> {{ previewData()?.correctos }} Válidos</span>
                    @if (previewData()?.errores! > 0) {
                      <span class="stat-pill invalid-pill"><mat-icon>warning</mat-icon> {{ previewData()?.errores }} Con Observaciones</span>
                    }
                  </div>
                </div>

                <!-- OPCIONES DE PROCESAMIENTO Y ACCIÓN SUPERIOR -->
                <div class="action-top-card" style="margin-top:20px; background:linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); padding:20px 24px; border-radius:16px; border:1px solid #c7d2fe; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; box-shadow:0 4px 16px rgba(99,102,241,0.08);">
                  <div class="option-group">
                    <label style="font-size:12px; font-weight:800; text-transform:uppercase; color:#4338ca; margin-bottom:6px; display:block; letter-spacing:0.04em;">Modo de Operación</label>
                    <div style="display:flex; gap:8px;">
                      <button type="button" mat-flat-button [color]="!soloValidar() ? 'primary' : ''" (click)="soloValidar.set(false)">
                        <mat-icon>play_circle</mat-icon> Validar y Cargar a MongoDB
                      </button>
                      <button type="button" mat-stroked-button [color]="soloValidar() ? 'accent' : ''" (click)="soloValidar.set(true)">
                        <mat-icon>fact_check</mat-icon> Solo Validar
                      </button>
                    </div>
                  </div>

                  <div class="hero-action-box">
                    <button mat-raised-button
                            color="accent"
                            class="btn-process-hero"
                            style="padding: 12px 28px; font-size: 15px; font-weight: 700; border-radius: 12px;"
                            [disabled]="cargando() || !previewData()?.correctos || soloValidar()"
                            (click)="ejecutarImportacion()">
                      <mat-icon [class.spin-icon]="cargando()">
                        {{ cargando() ? 'sync' : 'rocket_launch' }}
                      </mat-icon>
                      <span>{{ cargando() ? 'Guardando en MongoDB...' : 'Ejecutar Importación Masiva en vehiculos_data' }}</span>
                    </button>
                  </div>
                </div>

                <!-- MAPEO DE COLUMNAS -->
                <div class="mapping-section" style="margin-top:20px;">
                  <h4 class="section-subtitle" style="display:flex; align-items:center; gap:8px; font-size:15px; font-weight:700; color:#4f46e5; margin-bottom:12px;">
                    <mat-icon>alt_route</mat-icon>
                    Correspondencia y Mapeo de Columnas Detectadas (Excel / Google Sheets &rarr; Colección <code>vehiculos_data</code>)
                  </h4>
                  <div class="mapping-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:10px;">
                    @for (col of columnasMapeadas(); track col.destCampo) {
                      <div class="mapping-chip" style="padding:8px 12px; background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15); border-radius:10px; display:flex; align-items:center; justify-content:space-between; font-size:12px;">
                        <span class="source-col" style="font-weight:600; color:#334155;">{{ col.archivoCol }}</span>
                        <mat-icon style="font-size:16px; width:16px; height:16px; color:#6366f1;">arrow_forward</mat-icon>
                        <span class="dest-col"><code style="background:#e0e7ff; color:#3730a3; padding:2px 6px; border-radius:4px;">{{ col.destCampo }}</code></span>
                      </div>
                    }
                  </div>
                </div>

                <!-- MUESTRA DE DATOS HEADER BANNER -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; margin-bottom:10px; background:#ffffff; padding:12px 18px; border-radius:12px; border:1px solid #e2e8f0;">
                  <h4 style="margin:0; font-size:14px; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:8px;">
                    <mat-icon style="color:#6366f1;">preview</mat-icon>
                    Muestra de Vista Previa (mostrando las primeras {{ sampleFilas().length }} de {{ previewData()?.total }} filas)
                  </h4>
                  <span style="font-size:12px; color:#64748b; font-weight:500;">
                    * Al hacer clic en <strong>Ejecutar Importación Masiva</strong> se procesarán todos los <strong>{{ previewData()?.total }}</strong> registros.
                  </span>
                </div>

                <!-- TABLA PREVIEW (SOLO MUESTRA DE PRIMERAS 15 FILAS) -->
                <div class="tab-table-wrapper" style="margin-top:8px;">
                  <table class="modern-table preview-table">
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>Estado</th>
                        <th>Placa</th>
                        <th>Marca / Modelo</th>
                        <th>Cat / Carrocería</th>
                        <th>Pesos (Ton) [Bruto / Neto / Carga]</th>
                        <th>Medidas (m) [Largo x Ancho x Alto]</th>
                        <th>Capacidad</th>
                        <th>Motor / VIN</th>
                        <th>Propietario / PCM Audit</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of sampleFilas(); track item.fila) {
                        <tr [class.invalid-row]="item.estado !== 'OK'">
                          <td><strong>#{{ item.fila }}</strong></td>
                          <td>
                            @if (item.estado === 'OK') {
                              <span class="status-chip success"><mat-icon>check</mat-icon> OK</span>
                            } @else {
                              <span class="status-chip danger"><mat-icon>error</mat-icon> ERROR</span>
                            }
                          </td>
                          <td><span class="code-badge">{{ item.placa }}</span></td>
                          <td>
                            <strong>{{ item.datos?.marca }}</strong> {{ item.datos?.modelo }} ({{ item.datos?.anio_fabricacion }})
                          </td>
                          <td>
                            <span class="code-badge info-code">{{ item.datos?.categoria }}</span> {{ item.datos?.carroceria }}
                          </td>
                          <td>
                            <div class="metric-group">
                              <span class="metric-pill">B: <strong>{{ item.datos?.peso_bruto | number:'1.3-3' }} ton</strong></span> |
                              <span class="metric-pill">N: {{ item.datos?.peso_seco | number:'1.3-3' }} ton</span> |
                              <span class="metric-pill">C: {{ item.datos?.carga_util | number:'1.3-3' }} ton</span>
                            </div>
                          </td>
                          <td>
                            <div class="metric-group">
                              <span>{{ item.datos?.longitud | number:'1.3-3' }} x {{ item.datos?.ancho | number:'1.3-3' }} x {{ item.datos?.altura | number:'1.3-3' }} m</span>
                            </div>
                          </td>
                          <td>{{ item.datos?.numero_asientos }} as. / {{ item.datos?.numero_pasajeros }} pas.</td>
                          <td>
                            <div class="subtext-cell">
                              <span>M: {{ item.datos?.numero_motor || '-' }}</span><br>
                              <span style="color:#64748b;">V: {{ item.datos?.vin || '-' }}</span>
                            </div>
                          </td>
                          <td>
                            <span class="pcm-chip" [matTooltip]="'Propietario PCM: ' + (item.datos?.pcmMetadata?.pcm_propietario || 'N/A')">
                              {{ item.datos?.pcmMetadata?.pcm_propietario | slice:0:18 }}{{ (item.datos?.pcmMetadata?.pcm_propietario?.length || 0) > 18 ? '...' : '' }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- ACCION DE EJECUCION INFERIOR -->
                <div class="main-action-area" style="margin-top:24px; display:flex; justify-content:center;">
                  <button mat-raised-button
                          color="accent"
                          class="btn-process-hero"
                          [disabled]="cargando() || !previewData()?.correctos || soloValidar()"
                          (click)="ejecutarImportacion()">
                    <mat-icon [class.spin-icon]="cargando()">
                      {{ cargando() ? 'sync' : 'rocket_launch' }}
                    </mat-icon>
                    <span>{{ cargando() ? 'Guardando en MongoDB...' : 'Ejecutar Importación Masiva en vehiculos_data (' + previewData()?.correctos + ' registros)' }}</span>
                  </button>
                </div>
              </div>
            }


            @if (cargando()) {
              <div class="loading-progress-box" style="margin-top:16px;">
                <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                <p class="progress-subtext">Procesando y guardando datos técnicos vehiculares en la colección <code>vehiculos_data</code> de MongoDB...</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- DASHBOARD RESULTADOS FINAL -->
        @if (resultadoEjecucion()) {
          <mat-card class="results-card glass-panel animate-fade-in" style="margin-top:20px;">
            <mat-card-header>
              <mat-card-title class="card-title-flex">
                <mat-icon style="color:#10b981;">check_circle</mat-icon>
                <span>Resultado de Carga Masiva Vehicular</span>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content class="card-body">
              <div class="kpi-grid">
                <div class="kpi-card total">
                  <mat-icon>directions_car</mat-icon>
                  <div class="kpi-data">
                    <span class="kpi-num">{{ resultadoEjecucion()?.total_procesados }}</span>
                    <span class="kpi-label">Total Procesados</span>
                  </div>
                </div>
                <div class="kpi-card success">
                  <mat-icon>add_circle_outline</mat-icon>
                  <div class="kpi-data">
                    <span class="kpi-num">{{ resultadoEjecucion()?.insertados }}</span>
                    <span class="kpi-label">Nuevos Insertados</span>
                  </div>
                </div>
                <div class="kpi-card info">
                  <mat-icon>sync</mat-icon>
                  <div class="kpi-data">
                    <span class="kpi-num">{{ resultadoEjecucion()?.actualizados }}</span>
                    <span class="kpi-label">Actualizados por Placa</span>
                  </div>
                </div>
              </div>

              <div class="main-action-area" style="margin-top:20px; display:flex; gap:12px; justify-content:center;">
                <button mat-raised-button color="primary" routerLink="/vehiculos-data">
                  <mat-icon>directions_car</mat-icon> Ver Datos Técnicos en el Sistema
                </button>
                <button mat-stroked-button (click)="limpiarTodo()">
                  <mat-icon>refresh</mat-icon> Realizar Nueva Importación
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `
})
export class CargaMasivaVehiculosDataComponent {
  origenCarga = signal<'archivo' | 'google-sheets'>('archivo');
  archivoSeleccionado = signal<File | null>(null);
  isDragOver = signal<boolean>(false);
  googleSheetsUrl = signal<string>('');
  cargando = signal<boolean>(false);
  soloValidar = signal<boolean>(false);

  previewData = signal<VehiculoDataPreviewResponse | null>(null);
  resultadoEjecucion = signal<VehiculoDataEjecutarResponse | null>(null);

  columnasMapeadas = computed(() => [
    { archivoCol: 'PLACA', destCampo: 'placa_actual' },
    { archivoCol: 'MARCA / MODELO', destCampo: 'marca / modelo' },
    { archivoCol: 'ANIO_FABRICACION', destCampo: 'anio_fabricacion' },
    { archivoCol: 'COLOR / CATEGORIA', destCampo: 'color / categoria' },
    { archivoCol: 'CARROCERIA / CLASE', destCampo: 'carroceria / clase' },
    { archivoCol: 'COMBUSTIBLE', destCampo: 'combustible' },
    { archivoCol: 'NUMERO_MOTOR / VIN', destCampo: 'numero_motor / vin' },
    { archivoCol: 'PESOS (BRUTO/NETO/CARGA)', destCampo: 'peso_bruto/seco/carga' },
    { archivoCol: 'MEDIDAS (LARGO/ANCHO/ALTO)', destCampo: 'longitud/ancho/altura' },
    { archivoCol: 'PCM_* (PROPIETARIO/SEDE)', destCampo: 'pcmMetadata' }
  ]);

  sampleFilas = computed(() => {
    const data = this.previewData();
    if (!data || !data.filas) return [];
    return data.filas.slice(0, 15);
  });


  constructor(
    private vehiculoDataService: VehiculoDataService,
    private snackBar: MatSnackBar
  ) {}

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
      this.procesarArchivo(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.procesarArchivo(files[0]);
    }
  }

  procesarArchivo(file: File): void {
    this.archivoSeleccionado.set(file);
    this.cargando.set(true);
    this.vehiculoDataService.previewFile(file).subscribe({
      next: (resp) => {
        this.cargando.set(false);
        if (resp.success && resp.data) {
          this.previewData.set(resp.data);
          this.snackBar.open(`Vista previa generada: ${resp.data.correctos} vehículos procesados.`, 'OK', { duration: 4000 });
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.snackBar.open(`Error al procesar archivo: ${err?.error?.detail || err.message}`, 'Cerrar', { duration: 5000 });
      }
    });
  }

  cargarDesdeGoogleSheets(): void {
    const url = this.googleSheetsUrl().trim();
    if (!url) return;
    this.cargando.set(true);
    this.vehiculoDataService.previewUrl(url).subscribe({
      next: (resp) => {
        this.cargando.set(false);
        if (resp.success && resp.data) {
          this.previewData.set(resp.data);
          this.snackBar.open(`Google Sheet cargado: ${resp.data.correctos} vehículos procesados.`, 'OK', { duration: 4000 });
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.snackBar.open(`Error consultando Google Sheet: ${err?.error?.detail || err.message}`, 'Cerrar', { duration: 5000 });
      }
    });
  }

  ejecutarImportacion(): void {
    const data = this.previewData();
    if (!data || !data.filas || data.filas.length === 0) return;

    const filasValidas = data.filas.filter(f => f.estado === 'OK');
    if (filasValidas.length === 0) {
      this.snackBar.open('No hay filas válidas para importar.', 'Cerrar', { duration: 4000 });
      return;
    }

    this.cargando.set(true);
    this.vehiculoDataService.ejecutarCargaMasiva(filasValidas).subscribe({
      next: (resp) => {
        this.cargando.set(false);
        if (resp.success && resp.data) {
          this.resultadoEjecucion.set(resp.data);
          this.snackBar.open(`✅ Importación masiva completada: ${resp.data.insertados} insertados, ${resp.data.actualizados} actualizados en vehiculos_data.`, 'OK', { duration: 6000 });
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.snackBar.open(`Error al guardar en MongoDB: ${err?.error?.detail || err.message}`, 'Cerrar', { duration: 5000 });
      }
    });
  }

  descargarPlantilla(): void {
    const headers = [
      'ITEM', 'PLACA', 'MARCA', 'MODELO', 'ANIO_FABRICACION', 'COLOR', 'CATEGORIA',
      'CARROCERIA', 'CLASE', 'COMBUSTIBLE', 'NUMERO_MOTOR', 'NUMERO_SERIE_VIN',
      'NUM_PASAJEROS', 'NUM_ASIENTOS', 'CILINDROS', 'EJES', 'RUEDAS',
      'PESO_BRUTO', 'PESO_NETO', 'CARGA_UTIL', 'LARGO', 'ANCHO', 'ALTO',
      'OBSERVACIONES', 'PCM_ESTADO', 'PCM_PROPIETARIO', 'PCM_SEDE'
    ];

    const ejemplo = [
      '1', 'V1B-789', 'TOYOTA', 'HIACE', '2021', 'BLANCO', 'M2',
      'MINIBUS', 'CAMIONETA', 'DIESEL', '1KD-1234567', 'VIN1234567890ABC',
      '15', '16', '4', '2', '4',
      '3.500', '2.100', '1.400', '5.380', '1.880', '2.285',
      'Vehículo operativo', 'VIGENTE', 'EMPRESA DE TRANSPORTES PUNO S.A.', 'PUNO'
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ejemplo]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PLANTILLA_VEHICULOS');

    XLSX.writeFile(wb, 'Plantilla_Carga_Masiva_Vehiculos_Data.xlsx');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  limpiarTodo(): void {
    this.archivoSeleccionado.set(null);
    this.googleSheetsUrl.set('');
    this.previewData.set(null);
    this.resultadoEjecucion.set(null);
    this.cargando.set(false);
  }
}
