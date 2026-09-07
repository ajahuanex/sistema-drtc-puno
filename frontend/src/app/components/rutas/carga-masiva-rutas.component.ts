import { Component, OnInit, signal, computed } from '@angular/core';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { RutaService } from '../../services/ruta.service';
import { GoogleSheetsService } from '../../services/google-sheets.service';

export interface ResultadoCargaMasiva {
  total_filas?: number;
  validos?: number;
  invalidos?: number;
  con_advertencias?: number;

  total_procesadas?: number;
  exitosas?: number;
  fallidas?: number;
  total_creadas?: number;

  rutas_validas?: Array<any>;

  rutas_creadas?: Array<{
    codigo?: string;
    codigo_ruta?: string;
    nombre: string;
    id: string;
    tipo_ruta?: string;
    estado?: string;
    origen?: any;
    destino?: any;
  }>;

  rutas_actualizadas?: Array<{
    codigo?: string;
    codigo_ruta?: string;
    nombre: string;
    id: string;
    cambios?: string[];
  }>;

  errores?: Array<{
    fila?: number;
    codigo_ruta?: string;
    codigo?: string;
    error?: string;
    errores?: string[];
  }>;

  advertencias?: Array<{
    fila?: number;
    codigo_ruta?: string;
    advertencias?: string[];
  }>;

  errores_procesamiento?: Array<{
    codigo_ruta?: string;
    error?: string;
  }>;

  errores_creacion?: Array<{
    codigo_ruta?: string;
    error?: string;
  }>;

  resultado?: {
    total_procesadas?: number;
    exitosas?: number;
    fallidas?: number;
    rutas_validas?: Array<any>;
    rutas_creadas?: Array<any>;
    rutas_actualizadas?: Array<any>;
    errores_procesamiento?: Array<any>;
    errores_creacion?: Array<any>;
  };

  validacion?: {
    total_filas?: number;
    validos?: number;
    invalidos?: number;
    con_advertencias?: number;
    errores?: Array<any>;
    advertencias?: Array<any>;
    rutas_validas?: Array<any>;
  };

  archivo?: string;
  mensaje?: string;
}

@Component({
  selector: 'app-carga-masiva-rutas',
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
    MatInputModule
  ],
  template: `
    <div class="carga-masiva-wrapper">
      <!-- HEADER CON CORDÓN DE NAVEGACIÓN Y ACCIÓN RÁPIDA -->
      <header class="header-banner">
        <div class="header-title-group">
          <button mat-icon-button routerLink="/rutas" class="back-btn" matTooltip="Volver a lista de rutas">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-text">
            <div class="badge-tag">Módulo de Rutas</div>
            <h1>Carga Masiva de Rutas</h1>
            <p>Importa rutas desde archivos Excel, CSV o directamente mediante enlace de Google Sheets</p>
          </div>
        </div>

        <div class="header-actions">
          <button mat-raised-button color="primary" class="action-btn download-btn" (click)="descargarPlantilla()" [disabled]="cargando()">
            <mat-icon>download</mat-icon>
            Descargar Plantilla Excel
          </button>

          <button mat-stroked-button color="accent" class="action-btn sync-btn" (click)="sincronizarItinerarios()" [disabled]="sincronizandoItinerarios()" matTooltip="Vincula paradas del itinerario con coordenadas en la BD">
            <mat-icon [class.spin-icon]="sincronizandoItinerarios()">sync</mat-icon>
            {{ sincronizandoItinerarios() ? 'Sincronizando...' : 'Sincronizar Itinerarios' }}
          </button>
        </div>
      </header>

      @if (resultadoSincronizacion()) {
        <div class="toast-banner success">
          <mat-icon>check_circle</mat-icon>
          <span>{{ resultadoSincronizacion() }}</span>
          <button mat-icon-button (click)="resultadoSincronizacion.set('')"><mat-icon>close</mat-icon></button>
        </div>
      }

      <div class="main-content-grid">
        <!-- SECCIÓN 1: SUBIR ARCHIVO Y CONFIGURACIÓN (HERO PANEL) -->
        <mat-card class="upload-panel-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title-flex">
              <mat-icon class="panel-icon">cloud_upload</mat-icon>
              <span>Origen de Datos</span>
            </mat-card-title>
            <mat-card-subtitle>
              Selecciona si subirás un archivo local (.xlsx, .csv) o una hoja de Google Sheets
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
                    @if (cargandoGoogleSheets()) {
                      <mat-icon class="spin-icon">sync</mat-icon>
                      Cargando...
                    } @else {
                      <mat-icon>cloud_download</mat-icon>
                      Obtener Datos
                    }
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
                    Estrategia de Actualización
                  </label>
                  <div class="pill-toggle-group">
                    <button type="button"
                            class="pill-btn"
                            [class.active]="modoProcesamiento() === 'upsert'"
                            (click)="modoProcesamiento.set('upsert')"
                            matTooltip="Crea si no existe, actualiza si ya existe por RUC + Res. + Código">
                      <mat-icon>sync_alt</mat-icon>
                      Crear o Actualizar (Upsert)
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

                <div class="option-group inline-toggle">
                  <mat-slide-toggle [checked]="procesarEnLotes()" (change)="procesarEnLotes.set($event.checked)" color="primary">
                    Procesamiento en Lotes (Archivos Grandes)
                  </mat-slide-toggle>

                  @if (procesarEnLotes()) {
                    <mat-form-field appearance="outline" class="lote-select">
                      <mat-label>Tamaño de Lote</mat-label>
                      <mat-select [ngModel]="tamanoLote()" (ngModelChange)="tamanoLote.set($event)">
                        <mat-option [value]="25">25 por lote</mat-option>
                        <mat-option [value]="50">50 por lote (Recomendado)</mat-option>
                        <mat-option [value]="100">100 por lote</mat-option>
                      </mat-select>
                    </mat-form-field>
                  }
                </div>
              }
            </div>

            <!-- Banner Informativo Ligero sobre Localidades -->
            <div class="info-pill-bar">
              <mat-icon>info</mat-icon>
              <span><strong>Localidades automáticas:</strong> Si alguna localidad de la ruta no existe en BD, el sistema la registrará automáticamente sin interrumpir la carga.</span>
            </div>

            <!-- Botón Principal de Acción -->
            <div class="main-action-area">
              <button mat-raised-button
                      color="accent"
                      class="btn-process-hero"
                      [disabled]="!archivoSeleccionado() || cargando()"
                      (click)="procesarArchivo()">
                @if (cargando()) {
                  <mat-icon class="spin-icon">sync</mat-icon>
                  Procesando Datos...
                } @else {
                  <mat-icon>{{ soloValidar() ? 'task_alt' : 'rocket_launch' }}</mat-icon>
                  {{ soloValidar() ? 'Validar Estructura' : 'Iniciar Carga Masiva' }}
                }
              </button>
            </div>

            <!-- Barra de Progreso cuando se ejecuta el proceso -->
            @if (cargando()) {
              <div class="loading-progress-box">
                @if (procesarEnLotes() && !soloValidar() && totalLotes() > 0) {
                  <div class="batch-status">
                    <span>Procesando Lote {{ loteActual() }} de {{ totalLotes() }}</span>
                    <span>{{ progresoPorLotes().toFixed(0) }}%</span>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="progresoPorLotes()"></mat-progress-bar>
                } @else {
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                  <p class="progress-subtext">{{ soloValidar() ? 'Validando registros...' : 'Insertando y sincronizando rutas...' }}</p>
                }
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
                  {{ soloValidar() ? 'Se completó la verificación del archivo sin modificar la base de datos' : 'Se procesaron las rutas correctamente' }}
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

                  @if (!soloValidar() && modoProcesamiento() === 'upsert') {
                    <div class="kpi-card success">
                      <mat-icon>add_box</mat-icon>
                      <div class="kpi-data">
                        <span class="kpi-num">{{ rutasCreadas().length }}</span>
                        <span class="kpi-label">Creadas</span>
                      </div>
                    </div>

                    <div class="kpi-card info">
                      <mat-icon>published_with_changes</mat-icon>
                      <div class="kpi-data">
                        <span class="kpi-num">{{ rutasActualizadas().length }}</span>
                        <span class="kpi-label">Actualizadas</span>
                      </div>
                    </div>
                  } @else {
                    <div class="kpi-card success">
                      <mat-icon>check_circle</mat-icon>
                      <div class="kpi-data">
                        <span class="kpi-num">{{ totalExitosas() }}</span>
                        <span class="kpi-label">{{ soloValidar() ? 'Válidos' : 'Exitosas' }}</span>
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

                <!-- ✅ NUEVA SECCIÓN: VISTA PREVIA DE CORRESPONDENCIA DE COLUMNAS (PRIMEROS 5 REGISTROS) -->
                @if (rutasValidasMuestra().length > 0) {
                  <div class="preview-section-card">
                    <div class="preview-header">
                      <mat-icon class="preview-icon">preview</mat-icon>
                      <div>
                        <h4>Vista Previa de Correspondencia de Columnas (Primeros 5 registros)</h4>
                        <p>Verifica que los datos del Excel/CSV/Google Sheets hayan correspondido correctamente a cada campo antes de procesar</p>
                      </div>
                    </div>

                    <div class="tab-table-wrapper">
                      <table mat-table [dataSource]="rutasValidasMuestra()" class="modern-table preview-table">
                        <ng-container matColumnDef="fila">
                          <th mat-header-cell *matHeaderCellDef>Fila</th>
                          <td mat-cell *matCellDef="let r"><strong>#{{ r.fila || '1' }}</strong></td>
                        </ng-container>

                        <ng-container matColumnDef="ruc">
                          <th mat-header-cell *matHeaderCellDef>RUC Empresa</th>
                          <td mat-cell *matCellDef="let r"><span class="code-badge">{{ r.ruc }}</span></td>
                        </ng-container>

                        <ng-container matColumnDef="resolucion">
                          <th mat-header-cell *matHeaderCellDef>Resolución</th>
                          <td mat-cell *matCellDef="let r"><span class="code-badge info-code">{{ r.resolucionNormalizada || r.resolucion }}</span></td>
                        </ng-container>

                        <ng-container matColumnDef="codigo">
                          <th mat-header-cell *matHeaderCellDef>Código</th>
                          <td mat-cell *matCellDef="let r"><strong>{{ r.codigoRuta }}</strong></td>
                        </ng-container>

                        <ng-container matColumnDef="recorrido">
                          <th mat-header-cell *matHeaderCellDef>Origen → Destino</th>
                          <td mat-cell *matCellDef="let r">
                            <div class="route-path-flex">
                              <span>{{ r.origen }}</span>
                              <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                              <span>{{ r.destino }}</span>
                            </div>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="itinerario">
                          <th mat-header-cell *matHeaderCellDef>Itinerario</th>
                          <td mat-cell *matCellDef="let r">
                            <span class="itinerario-text-preview">{{ r.itinerario || 'SIN ITINERARIO' }}</span>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="frecuencia">
                          <th mat-header-cell *matHeaderCellDef>Frecuencia</th>
                          <td mat-cell *matCellDef="let r">{{ r.frecuencia }}</td>
                        </ng-container>

                        <ng-container matColumnDef="tipo">
                          <th mat-header-cell *matHeaderCellDef>Tipo / Servicio</th>
                          <td mat-cell *matCellDef="let r">
                            <div class="tags-flex">
                              <span class="type-tag">{{ r.tipoRuta || 'INTERREGIONAL' }}</span>
                              <span class="service-tag">{{ r.tipoServicio || 'PASAJEROS' }}</span>
                            </div>
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="estado">
                          <th mat-header-cell *matHeaderCellDef>Estado</th>
                          <td mat-cell *matCellDef="let r">
                            <span class="status-chip"
                                  [class.success]="r.estado === 'ACTIVA'"
                                  [class.danger]="r.estado === 'INACTIVA' || r.estado === 'CANCELADA' || r.esCancelada">
                              {{ r.estado || (r.esCancelada ? 'CANCELADA' : 'ACTIVA') }}
                            </span>
                          </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="['fila', 'ruc', 'resolucion', 'codigo', 'recorrido', 'itinerario', 'frecuencia', 'tipo', 'estado']"></tr>
                        <tr mat-row *matRowDef="let row; columns: ['fila', 'ruc', 'resolucion', 'codigo', 'recorrido', 'itinerario', 'frecuencia', 'tipo', 'estado'];"></tr>

                      </table>
                    </div>
                  </div>
                }

                <!-- Tabs Limpios con Detalle de Listas -->
                <mat-tab-group class="modern-tabs" animationDuration="200ms">
                  <!-- Tab: Rutas Creadas -->
                  @if (rutasCreadas().length > 0) {
                    <mat-tab>
                      <ng-template mat-tab-label>
                        <mat-icon class="tab-icon success-icon">add_circle</mat-icon>
                        <span>Rutas Creadas ({{ rutasCreadas().length }})</span>
                      </ng-template>

                      <div class="tab-table-wrapper">
                        <table mat-table [dataSource]="rutasCreadas().slice(0, 15)" class="modern-table">
                          <ng-container matColumnDef="codigo">
                            <th mat-header-cell *matHeaderCellDef>Código</th>
                            <td mat-cell *matCellDef="let ruta">
                              <span class="code-badge">{{ ruta.codigo || ruta.codigo_ruta }}</span>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="ruc_res">
                            <th mat-header-cell *matHeaderCellDef>RUC / Resolución</th>
                            <td mat-cell *matCellDef="let ruta">
                              <div class="tags-flex">
                                <span class="code-badge">{{ ruta.ruc || 'N/A' }}</span>
                                <span class="code-badge info-code">{{ ruta.resolucion || 'N/A' }}</span>
                              </div>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="nombre">
                            <th mat-header-cell *matHeaderCellDef>Origen - Destino</th>
                            <td mat-cell *matCellDef="let ruta"><strong>{{ ruta.nombre }}</strong></td>
                          </ng-container>

                          <ng-container matColumnDef="estado">
                            <th mat-header-cell *matHeaderCellDef>Estado</th>
                            <td mat-cell *matCellDef="let ruta">
                              <span class="status-chip success">CREADA</span>
                            </td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="['codigo', 'ruc_res', 'nombre', 'estado']"></tr>
                          <tr mat-row *matRowDef="let row; columns: ['codigo', 'ruc_res', 'nombre', 'estado'];"></tr>
                        </table>

                        @if (rutasCreadas().length > 15) {
                          <div class="table-footer-hint">
                            ... y {{ rutasCreadas().length - 15 }} rutas adicionales creadas exitosamente.
                          </div>
                        }
                      </div>
                    </mat-tab>
                  }

                  <!-- Tab: Rutas Actualizadas -->
                  @if (rutasActualizadas().length > 0) {
                    <mat-tab>
                      <ng-template mat-tab-label>
                        <mat-icon class="tab-icon info-icon">update</mat-icon>
                        <span>Rutas Actualizadas ({{ rutasActualizadas().length }})</span>
                      </ng-template>

                      <div class="tab-table-wrapper">
                        <table mat-table [dataSource]="rutasActualizadas().slice(0, 15)" class="modern-table">
                          <ng-container matColumnDef="codigo">
                            <th mat-header-cell *matHeaderCellDef>Código</th>
                            <td mat-cell *matCellDef="let ruta">
                              <span class="code-badge info-code">{{ ruta.codigo || ruta.codigo_ruta }}</span>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="ruc_res">
                            <th mat-header-cell *matHeaderCellDef>RUC / Resolución</th>
                            <td mat-cell *matCellDef="let ruta">
                              <div class="tags-flex">
                                <span class="code-badge">{{ ruta.ruc || 'N/A' }}</span>
                                <span class="code-badge info-code">{{ ruta.resolucion || 'N/A' }}</span>
                              </div>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="nombre">
                            <th mat-header-cell *matHeaderCellDef>Ruta</th>
                            <td mat-cell *matCellDef="let ruta"><strong>{{ ruta.nombre }}</strong></td>
                          </ng-container>

                          <ng-container matColumnDef="cambios">
                            <th mat-header-cell *matHeaderCellDef>Modificaciones</th>
                            <td mat-cell *matCellDef="let ruta">
                              @if (ruta.cambios && ruta.cambios.length > 0) {
                                <div class="changes-tags">
                                  @for (cambio of ruta.cambios; track $index) {
                                    <span class="change-tag">{{ cambio }}</span>
                                  }
                                </div>
                              } @else {
                                <span class="no-change">Re-sincronizada</span>
                              }
                            </td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="['codigo', 'ruc_res', 'nombre', 'cambios']"></tr>
                          <tr mat-row *matRowDef="let row; columns: ['codigo', 'ruc_res', 'nombre', 'cambios'];"></tr>
                        </table>
                      </div>
                    </mat-tab>
                  }


                  <!-- Tab: Errores -->
                  @if (errores().length > 0) {
                    <mat-tab>
                      <ng-template mat-tab-label>
                        <mat-icon class="tab-icon warn-icon">error_outline</mat-icon>
                        <span>Errores ({{ errores().length }})</span>
                      </ng-template>

                      <div class="tab-table-wrapper">
                        <table mat-table [dataSource]="errores().slice(0, 50)" class="modern-table error-table">
                          <ng-container matColumnDef="fila">
                            <th mat-header-cell *matHeaderCellDef>Fila</th>
                            <td mat-cell *matCellDef="let err">
                              <span class="type-tag" style="background: #fee2e2; color: #991b1b; font-weight: 800;">
                                #{{ err.fila || 'N/A' }}
                              </span>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="ruc_res">
                            <th mat-header-cell *matHeaderCellDef>RUC / Res.</th>
                            <td mat-cell *matCellDef="let err">
                              <div class="tags-flex">
                                <span class="code-badge">{{ err.ruc || 'N/A' }}</span>
                                <span class="code-badge info-code">{{ err.resolucion || err.resolucionNormalizada || 'N/A' }}</span>
                              </div>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="codigo">
                            <th mat-header-cell *matHeaderCellDef>Código</th>
                            <td mat-cell *matCellDef="let err"><strong>{{ err.codigo_ruta || err.codigo || 'N/A' }}</strong></td>
                          </ng-container>

                          <ng-container matColumnDef="recorrido">
                            <th mat-header-cell *matHeaderCellDef>Origen → Destino</th>
                            <td mat-cell *matCellDef="let err">
                              <div class="route-path-flex">
                                <span>{{ err.origen || 'N/A' }}</span>
                                <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                                <span>{{ err.destino || 'N/A' }}</span>
                              </div>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="estado">
                            <th mat-header-cell *matHeaderCellDef>Estado</th>
                            <td mat-cell *matCellDef="let err">
                              <span class="status-chip"
                                    [class.success]="err.estado === 'ACTIVA'"
                                    [class.danger]="err.estado === 'INACTIVA' || err.estado === 'CANCELADA'">
                                {{ err.estado || 'ACTIVA' }}
                              </span>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="detalle">
                            <th mat-header-cell *matHeaderCellDef>Detalle del Error</th>
                            <td mat-cell *matCellDef="let err">
                              <span class="err-text">{{ err.error || err.errores?.join(', ') || 'Error al procesar fila' }}</span>
                            </td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="['fila', 'ruc_res', 'codigo', 'recorrido', 'estado', 'detalle']"></tr>
                          <tr mat-row *matRowDef="let row; columns: ['fila', 'ruc_res', 'codigo', 'recorrido', 'estado', 'detalle'];"></tr>

                        </table>
                      </div>
                    </mat-tab>
                  }


                  <!-- Tab: Advertencias -->
                  @if (advertencias().length > 0) {
                    <mat-tab>
                      <ng-template mat-tab-label>
                        <mat-icon class="tab-icon amber-icon">warning_amber</mat-icon>
                        <span>Advertencias ({{ advertencias().length }})</span>
                      </ng-template>

                      <div class="tab-table-wrapper">
                        <ul class="warning-list">
                          @for (adv of advertencias(); track $index) {
                            <li>
                              <strong>Fila {{ adv.fila }} ({{ adv.codigo_ruta }}):</strong>
                              <span>{{ adv.advertencias?.join(' | ') || 'Advertencia en validación' }}</span>
                            </li>
                          }
                        </ul>
                      </div>
                    </mat-tab>
                  }
                </mat-tab-group>

                <!-- Footer de Acciones del Dashboard -->
                <div class="results-actions-bar">
                  @if (soloValidar() && totalExitosas() > 0) {
                    <button mat-raised-button color="accent" (click)="procesarDespuesDeValidar()">
                      <mat-icon>play_circle</mat-icon>
                      Procesar Rutas Válidas Ahora
                    </button>
                  }

                  @if (!soloValidar() && rutasCreadas().length > 0) {
                    <button mat-raised-button color="primary" (click)="irAListaRutas()">
                      <mat-icon>format_list_bulleted</mat-icon>
                      Ver Rutas en el Sistema
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
  styleUrls: ['./carga-masiva-rutas.component.scss']
})
export class CargaMasivaRutasComponent implements OnInit {

  // Signals de estado
  origenCarga = signal<'archivo' | 'google-sheets'>('archivo');
  googleSheetsUrl = signal<string>('');
  cargandoGoogleSheets = signal<boolean>(false);

  archivoSeleccionado = signal<File | null>(null);
  cargando = signal<boolean>(false);
  mostrarResultados = signal<boolean>(false);
  soloValidar = signal<boolean>(true);

  modoProcesamiento = signal<'crear' | 'actualizar' | 'upsert'>('upsert');
  procesarEnLotes = signal<boolean>(true);
  tamanoLote = signal<number>(50);
  loteActual = signal<number>(0);
  totalLotes = signal<number>(0);
  progresoPorLotes = signal<number>(0);

  isDragOver = signal<boolean>(false);
  sincronizandoItinerarios = signal<boolean>(false);
  resultadoSincronizacion = signal<string>('');

  resultado = signal<ResultadoCargaMasiva | null>(null);

  // Computed signals para los datos unificados
  totalFilas = computed(() => {
    const res: any = this.resultado();
    if (!res) return 0;
    if (this.soloValidar()) {
      return res.validacion?.total_filas || res.total_filas || 0;
    }
    return res.resultado?.total_procesadas || res.total_procesadas || res.validacion?.total_filas || res.total_filas || 0;
  });

  totalExitosas = computed(() => {
    const res: any = this.resultado();
    if (!res) return 0;
    if (this.soloValidar()) {
      return res.validacion?.validos || res.validos || 0;
    }
    return res.resultado?.exitosas || res.resultado?.total_creadas || res.exitosas || res.total_creadas || 0;
  });

  totalErrores = computed(() => {
    const res: any = this.resultado();
    if (!res) return 0;
    if (this.soloValidar()) {
      return res.validacion?.invalidos || res.invalidos || 0;
    }
    return res.resultado?.fallidas || res.fallidas || 0;
  });

  totalAdvertencias = computed(() => {
    const res: any = this.resultado();
    if (!res) return 0;
    return res.validacion?.con_advertencias || res.con_advertencias || 0;
  });

  rutasValidasMuestra = computed(() => {
    const res: any = this.resultado();
    if (!res) return [];
    const validas = res.validacion?.rutas_validas || res.rutas_validas || res.resultado?.rutas_validas || [];
    return validas.slice(0, 5);
  });

  rutasCreadas = computed(() => {
    const res: any = this.resultado();
    if (!res || this.soloValidar()) return [];
    const creadas = res.resultado?.rutas_creadas || res.rutas_creadas || [];

    return creadas.map((ruta: any) => {
      let nombreFormateado = ruta.nombre;
      if (ruta.origen && ruta.destino) {
        const o = typeof ruta.origen === 'string' ? ruta.origen : ruta.origen.nombre;
        const d = typeof ruta.destino === 'string' ? ruta.destino : ruta.destino.nombre;
        nombreFormateado = `${o} - ${d}`;
      }
      return {
        ...ruta,
        nombre: nombreFormateado
      };
    });
  });

  rutasActualizadas = computed(() => {
    const res: any = this.resultado();
    if (!res || this.soloValidar()) return [];
    return res.resultado?.rutas_actualizadas || res.rutas_actualizadas || [];
  });

  errores = computed(() => {
    const res: any = this.resultado();
    if (!res) return [];
    const errValidacion = res.validacion?.errores || res.errores || [];
    const errProc = res.resultado?.errores_procesamiento || res.errores_procesamiento || [];
    const errCrea = res.resultado?.errores_creacion || res.errores_creacion || [];
    return [...errValidacion, ...errProc, ...errCrea];
  });

  advertencias = computed(() => {
    const res: any = this.resultado();
    if (!res) return [];
    return res.validacion?.advertencias || res.advertencias || [];
  });

  constructor(
    private rutaService: RutaService,
    private googleSheetsService: GoogleSheetsService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit() { }

  async descargarPlantilla() {
    try {
      this.cargando.set(true);
      const blob = await this.rutaService.descargarPlantillaCargaMasiva();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_carga_masiva_rutas.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      this.snackBar.open('Plantilla Excel descargada exitosamente', 'Cerrar', { duration: 3000 });
    } catch (error: any) {
      console.error('Error al descargar la plantilla:', error);
      this.snackBar.open('Error al descargar la plantilla Excel', 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando.set(false);
    }
  }

  cargarDesdeGoogleSheets() {
    const url = this.googleSheetsUrl().trim();
    if (!url) {
      this.snackBar.open('Ingresa un enlace de Google Sheets', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.googleSheetsService.validarUrl(url)) {
      this.snackBar.open('Enlace de Google Sheets no válido', 'Cerrar', { duration: 4000 });
      return;
    }

    const id = this.googleSheetsService.extraerIdDeUrl(url) || url;
    this.cargandoGoogleSheets.set(true);

    this.googleSheetsService.obtenerDatosReales(id).subscribe({
      next: (sheetInfo) => {
        this.cargandoGoogleSheets.set(false);
        if (!sheetInfo || sheetInfo.datos.length === 0) {
          this.snackBar.open('La hoja de Google Sheets no contiene registros', 'Cerrar', { duration: 4000 });
          return;
        }

        // Reconstruir CSV
        const csvRows: string[] = [];
        csvRows.push(sheetInfo.encabezados.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
        for (const fila of sheetInfo.datos) {
          csvRows.push(fila.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','));
        }
        const csvContent = csvRows.join('\n');

        // Convertir a File
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const file = new File([blob], `google_sheet_rutas_${Date.now()}.csv`, { type: 'text/csv' });

        this.archivoSeleccionado.set(file);
        this.limpiarResultados();
        this.snackBar.open(`✅ Google Sheet descargado exitosamente: ${sheetInfo.totalFilas} filas obtenidas`, 'Cerrar', { duration: 4000 });
      },
      error: (err) => {
        this.cargandoGoogleSheets.set(false);
        console.error('Error obteniendo Google Sheets:', err);
        this.snackBar.open(`Error: ${err.message || 'No se pudo acceder a Google Sheets. Verifica que sea pública.'}`, 'Cerrar', { duration: 6000 });
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.procesarArchivoSeleccionado(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.procesarArchivoSeleccionado(file);
    }
  }

  private procesarArchivoSeleccionado(file: File) {
    const isCsv = file.name.match(/\.csv$/i) || file.type === 'text/csv';
    const isExcel = file.name.match(/\.(xlsx|xls)$/i) || file.type.includes('spreadsheet') || file.type.includes('excel');

    if (!isCsv && !isExcel) {
      this.snackBar.open('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)', 'Cerrar', { duration: 5000 });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo supera los 10MB permitidos.', 'Cerrar', { duration: 5000 });
      return;
    }

    this.archivoSeleccionado.set(file);
    this.limpiarResultados();
  }

  limpiarArchivo() {
    this.archivoSeleccionado.set(null);
    this.limpiarResultados();
  }

  private limpiarResultados() {
    this.resultado.set(null);
    this.mostrarResultados.set(false);
    this.loteActual.set(0);
    this.totalLotes.set(0);
    this.progresoPorLotes.set(0);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async procesarArchivo() {
    const file = this.archivoSeleccionado();
    if (!file) {
      this.snackBar.open('Por favor selecciona un archivo o descarga una hoja de Google Sheets', 'Cerrar', { duration: 3000 });
      return;
    }

    this.cargando.set(true);
    this.limpiarResultados();

    try {
      if (this.soloValidar()) {
        const res = await this.rutaService.validarCargaMasiva(file);
        this.resultado.set(res);
      } else {
        const opciones = {
          soloValidar: false,
          modo: this.modoProcesamiento(),
          procesarEnLotes: this.procesarEnLotes(),
          tamanoLote: this.tamanoLote()
        };
        const res = await this.rutaService.procesarCargaMasiva(file, opciones);
        this.resultado.set(res);
      }
      this.mostrarResultados.set(true);
    } catch (error: any) {
      console.error('Error al procesar archivo:', error);
      this.snackBar.open(
        `Error: ${error.error?.mensaje || error.message || 'Error en el procesamiento'}`,
        'Cerrar',
        { duration: 5000 }
      );
    } finally {
      this.cargando.set(false);
    }
  }

  procesarDespuesDeValidar() {
    this.soloValidar.set(false);
    this.procesarArchivo();
  }

  irAListaRutas() {
    this.router.navigate(['/rutas']);
  }

  reiniciarProceso() {
    this.archivoSeleccionado.set(null);
    this.googleSheetsUrl.set('');
    this.limpiarResultados();
    this.soloValidar.set(true);
    this.modoProcesamiento.set('upsert');
  }

  sincronizarItinerarios() {
    this.sincronizandoItinerarios.set(true);
    this.resultadoSincronizacion.set('');

    this.rutaService.sincronizarItinerarios().subscribe({
      next: (data: any) => {
        this.sincronizandoItinerarios.set(false);
        const rutas = data?.rutas_actualizadas || 0;
        const paradas = data?.total_paradas_vinculadas || 0;
        const msg = `${rutas} rutas actualizadas, ${paradas} paradas vinculadas.`;
        this.resultadoSincronizacion.set(msg);
        this.snackBar.open(`Sincronización completada: ${msg}`, 'Cerrar', { duration: 5000 });
      },
      error: (err: any) => {
        this.sincronizandoItinerarios.set(false);
        this.resultadoSincronizacion.set('Error al sincronizar itinerarios.');
        console.error('Error sincronizando itinerarios:', err);
        this.snackBar.open('Error al sincronizar itinerarios', 'Cerrar', { duration: 4000 });
      }
    });
  }
}