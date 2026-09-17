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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import * as XLSX from 'xlsx';
import { EmpresaService } from '../../services/empresa.service';
import { GoogleSheetsService } from '../../services/google-sheets.service';

export interface RegistroEmpresaPreview {
  fila: number;
  ruc: string;
  razonSocial: string;
  domicilioLegal: string;
  telefono: string;
  correoElectronico: string;
  representanteLegal: string;
  dniRepresentanteLegal: string;
  partidaRegistral: string;
  estado: string;
  estadoOriginal?: string;
  tipoServicio: string;
  esValido: boolean;
  errores: string[];
}

export interface ColumnaMapeoEmpresa {
  archivoCol: string;
  destCampo: string;
  tipo: string;
}

@Component({
  selector: 'app-carga-masiva-empresas',
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
  styleUrl: './carga-masiva-empresas.component.scss',
  template: `
    <div class="carga-masiva-wrapper">
      <!-- HEADER CON CORDÓN DE NAVEGACIÓN Y ACCIÓN RÁPIDA -->
      <header class="header-banner">
        <div class="header-title-group">
          <button mat-icon-button routerLink="/empresas" class="back-btn" matTooltip="Volver a Empresas">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-text">
            <div class="badge-tag">Empresas Transportistas</div>
            <h1>Carga Masiva de Empresas</h1>
            <p>Importa empresas transportistas mapeando automáticamente las columnas <strong>B a K (RUC, Razón Social, Domicilio Legal, Teléfono, Correo, Representante, DNI, Partida, Estado y Tipo Servicio)</strong></p>
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
                    <span class="file-limit-hint">Recomendado: Estructura DB_EMPRESAS (Columnas B a K)</span>
                  </div>
                }
              </div>
            } @else {
              <!-- Input de Google Sheets -->
              <div class="google-sheets-box">
                <div class="sheets-header-info">
                  <mat-icon class="sheets-icon">table_chart</mat-icon>
                  <div>
                    <h4>Importar desde Google Sheets</h4>
                    <p>Asegúrate de que tu hoja de Google Sheets esté configurada como <strong>"Cualquier persona con el enlace puede ver"</strong>.</p>
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
                      <span class="file-name">Google Sheet Convertido</span>
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
                      <p class="dest-desc">Base de Datos: <strong>DRTC Puno (MongoDB)</strong> &rarr; Colección: <code>empresas</code></p>
                    </div>
                  </div>
                  <div class="dest-stats">
                    <span class="stat-pill total-pill"><mat-icon>format_list_numbered</mat-icon> {{ previewRows().length }} Registros</span>
                    <span class="stat-pill valid-pill"><mat-icon>check_circle</mat-icon> {{ totalValidosPreview() }} Válidos</span>
                    <span class="stat-pill pill-autorizada"><mat-icon>verified</mat-icon> {{ totalAutorizadasPreview() }} Autorizadas</span>
                    @if (totalCanceladasPreview() > 0) {
                      <span class="stat-pill pill-cancelada"><mat-icon>block</mat-icon> {{ totalCanceladasPreview() }} Canceladas</span>
                    }
                    @if (totalOtrosEstadosPreview() > 0) {
                      <span class="stat-pill pill-otros"><mat-icon>alt_route</mat-icon> {{ totalOtrosEstadosPreview() }} Otros Estados</span>
                    }
                    @if (totalInvalidosPreview() > 0) {
                      <span class="stat-pill invalid-pill"><mat-icon>warning</mat-icon> {{ totalInvalidosPreview() }} Con Observación</span>
                    }
                  </div>
                </div>

                <!-- Mapeo de Columnas (Archivo vs DB Target) -->
                <div class="mapping-section">
                  <h4 class="section-subtitle">
                    <mat-icon>alt_route</mat-icon>
                    Mapeo de Columnas de Empresas (Columnas B a K &rarr; DRTC Puno)
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

                <!-- Pre-visualización de Registros Extraídos con Filtros Rápidos -->
                <div class="extracted-data-preview">
                  <div class="preview-header-flex">
                    <h4 class="section-subtitle">
                      <mat-icon>visibility</mat-icon>
                      Vista Previa de Registros (Mostrando {{ Math.min(15, previewRowsFiltradasYOrdenadas().length) }} de {{ previewRowsFiltradasYOrdenadas().length }})
                    </h4>

                    <!-- Barra Interactiva de Filtros Rápidos por Estado -->
                    <div class="preview-filter-bar">
                      <span class="filter-bar-label"><mat-icon>filter_alt</mat-icon> Filtrar:</span>
                      <div class="filter-pills-group">
                        <button type="button" class="preview-pill" [class.active]="filtroEstadoPreview() === 'TODOS'" (click)="filtroEstadoPreview.set('TODOS')">
                          <span>Todos</span>
                          <span class="pill-count">{{ previewRows().length }}</span>
                        </button>
                        <button type="button" class="preview-pill pill-autorizada" [class.active]="filtroEstadoPreview() === 'AUTORIZADA'" (click)="filtroEstadoPreview.set('AUTORIZADA')">
                          <mat-icon>verified</mat-icon>
                          <span>Autorizadas</span>
                          <span class="pill-count">{{ totalAutorizadasPreview() }}</span>
                        </button>
                        <button type="button" class="preview-pill pill-cancelada" [class.active]="filtroEstadoPreview() === 'CANCELADA'" (click)="filtroEstadoPreview.set('CANCELADA')">
                          <mat-icon>block</mat-icon>
                          <span>Canceladas</span>
                          <span class="pill-count">{{ totalCanceladasPreview() }}</span>
                        </button>
                        @if (totalOtrosEstadosPreview() > 0) {
                          <button type="button" class="preview-pill pill-otros" [class.active]="filtroEstadoPreview() === 'OTROS'" (click)="filtroEstadoPreview.set('OTROS')">
                            <mat-icon>tune</mat-icon>
                            <span>Otros</span>
                            <span class="pill-count">{{ totalOtrosEstadosPreview() }}</span>
                          </button>
                        }
                        @if (totalInvalidosPreview() > 0) {
                          <button type="button" class="preview-pill pill-error" [class.active]="filtroEstadoPreview() === 'ERROR'" (click)="filtroEstadoPreview.set('ERROR')">
                            <mat-icon>warning</mat-icon>
                            <span>Errores</span>
                            <span class="pill-count">{{ totalInvalidosPreview() }}</span>
                          </button>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="tab-table-wrapper">
                    <table class="modern-table preview-table">
                      <thead>
                        <tr>
                          <th (click)="toggleSort('fila')" class="sortable-th col-fila">
                            <span>Fila</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('fila') }}</mat-icon>
                          </th>
                          <th (click)="toggleSort('esValido')" class="sortable-th col-estado-data">
                            <span>Data</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('esValido') }}</mat-icon>
                          </th>
                          <th (click)="toggleSort('ruc')" class="sortable-th col-ruc-meta">
                            <span>RUC</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('ruc') }}</mat-icon>
                          </th>
                          <th (click)="toggleSort('razonSocial')" class="sortable-th col-razon">
                            <span>Razón Social Empresa</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('razonSocial') }}</mat-icon>
                          </th>
                          <th (click)="toggleSort('domicilioLegal')" class="sortable-th col-domicilio">
                            <span>Domicilio Legal</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('domicilioLegal') }}</mat-icon>
                          </th>
                          <th class="col-contacto">Teléfono / Correo</th>
                          <th (click)="toggleSort('representanteLegal')" class="sortable-th col-rep">
                            <span>Representante / DNI</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('representanteLegal') }}</mat-icon>
                          </th>
                          <th (click)="toggleSort('partidaRegistral')" class="sortable-th col-partida">
                            <span>Partida</span>
                            <mat-icon class="sort-icon">{{ getSortIcon('partidaRegistral') }}</mat-icon>
                          </th>
                          <th class="col-obs">Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (r of previewRowsFiltradasYOrdenadas().slice(0, 15); track r.fila) {
                          <tr [class.invalid-row]="!r.esValido">
                            <td><strong>#{{ r.fila }}</strong></td>
                            <td>
                              @if (r.esValido) {
                                <span class="status-chip success"><mat-icon>check</mat-icon> OK</span>
                              } @else {
                                <span class="status-chip danger"><mat-icon>error</mat-icon> ERROR</span>
                              }
                            </td>
                            <!-- Celda RUC + Estado Legal + Tipo Servicio compactados para liberar espacio -->
                            <td class="ruc-cell">
                              <div class="ruc-cell-stacked">
                                <span class="code-badge">{{ r.ruc }}</span>
                                <div class="ruc-meta-row">
                                  <span [class]="'status-chip-mini chip-' + r.estado.toLowerCase()"
                                        [matTooltip]="r.estadoOriginal && r.estadoOriginal !== r.estado ? 'Estado original: ' + r.estadoOriginal : 'Estado legal: ' + r.estado">
                                    {{ r.estado }}
                                  </span>
                                  <span class="service-chip-mini" [matTooltip]="'Tipo de Servicio: ' + (r.tipoServicio || 'PASAJEROS')">
                                    {{ getServicioAbreviado(r.tipoServicio || 'PASAJEROS') }}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td class="razon-social-cell">
                              <span class="razon-social-text bold-text">{{ r.razonSocial }}</span>
                            </td>
                            <td>{{ r.domicilioLegal || '-' }}</td>
                            <td>
                              <div style="display:flex; flex-direction:column; gap:2px; font-size:12px;">
                                <span>📞 {{ r.telefono || '-' }}</span>
                                <span style="color:#64748b;">✉️ {{ r.correoElectronico || '-' }}</span>
                              </div>
                            </td>
                            <td>
                              <div style="display:flex; flex-direction:column; gap:2px;">
                                <span>{{ r.representanteLegal || '-' }}</span>
                                @if (r.dniRepresentanteLegal) {
                                  <span class="code-badge info-code" style="font-size:11px; width:fit-content;">DNI: {{ r.dniRepresentanteLegal }}</span>
                                }
                              </div>
                            </td>
                            <td>{{ r.partidaRegistral || '-' }}</td>
                            <td>
                              @if (!r.esValido && r.errores.length) {
                                <span class="err-text"><mat-icon>error_outline</mat-icon> {{ r.errores.join(', ') }}</span>
                              } @else {
                                <span class="obs-cell">OK</span>
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
                            matTooltip="Crea o actualiza si la empresa ya existe por número de RUC">
                      <mat-icon>sync_alt</mat-icon>
                      Crear o Actualizar por RUC
                    </button>
                    <button type="button"
                            class="pill-btn"
                            [class.active]="modoProcesamiento() === 'crear'"
                            (click)="modoProcesamiento.set('crear')"
                            matTooltip="Solo inserta empresas nuevas">
                      <mat-icon>add_circle_outline</mat-icon>
                      Solo Crear
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Banner Informativo Ligero -->
            <div class="info-pill-bar">
              <mat-icon>info</mat-icon>
              <span><strong>Mapeo de Columnas B a K:</strong> RUC (B), Razón Social (C), Domicilio Legal (D), Teléfono (E), Correo (F), Representante (G), DNI Rep. (H), Partida (I), Estado (J), Tipo Servicio (K).</span>
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
                <p class="progress-subtext">{{ soloValidar() ? 'Validando registros y estructura...' : 'Insertando y registrando empresas en la base de datos...' }}</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- SECCIÓN 2: DASHBOARD DE RESULTADOS COMPLETO CON ERRORES -->
        @if (mostrarResultados() && resData()) {
          <div class="results-section animate-fade-in">
            <mat-card class="results-card glass-panel">
              <mat-card-header>
                <mat-card-title class="card-title-flex">
                  <mat-icon [class.text-success]="totalErrores() === 0" [class.text-warn]="totalErrores() > 0">
                    {{ totalErrores() === 0 ? 'check_circle' : 'assessment' }}
                  </mat-icon>
                  <span>Resumen de {{ soloValidar() ? 'Validación' : 'Procesamiento' }}</span>
                </mat-card-title>

                <mat-card-subtitle>
                  {{ soloValidar() ? 'Se completó la verificación del archivo sin modificar la base de datos' : 'Se procesaron los registros en la base de datos MongoDB' }}
                </mat-card-subtitle>
              </mat-card-header>

              <mat-card-content class="card-body">
                <!-- Banner Destacado de Actualizaciones / Creaciones -->
                <div class="summary-status-banner" [class.banner-success]="totalErrores() === 0" [class.banner-warning]="totalErrores() > 0">
                  <div class="banner-main-col">
                    <mat-icon class="banner-icon">{{ totalErrores() === 0 ? 'check_circle' : 'info' }}</mat-icon>
                    <div class="banner-text-content">
                      <h3 class="banner-title">
                        {{ soloValidar() ? 'Validación Finalizada' : '¡Carga Masiva Procesada Exitosamente!' }}
                      </h3>
                      <p class="banner-desc">
                        Se actualizaron <strong>{{ totalActualizadas() }}</strong> empresas existentes por RUC y se crearon <strong>{{ totalCreadas() }}</strong> empresas nuevas.
                        @if (totalPartidasActualizadas() > 0) {
                          <span class="banner-partida-highlight">
                            <mat-icon>verified</mat-icon> Se registraron/actualizaron <strong>{{ totalPartidasActualizadas() }}</strong> Partidas Registrales (SUNARP).
                          </span>
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <!-- KPI Tiles Grid Desglosado con Actualizadas y Partidas -->
                <div class="kpi-grid">
                  <div class="kpi-card total">
                    <mat-icon>business</mat-icon>
                    <div class="kpi-data">
                      <span class="kpi-num">{{ totalFilas() }}</span>
                      <span class="kpi-label">Total Registros</span>
                    </div>
                  </div>

                  <div class="kpi-card updated">
                    <mat-icon>published_with_changes</mat-icon>
                    <div class="kpi-data">
                      <span class="kpi-num">{{ totalActualizadas() }}</span>
                      <span class="kpi-label">Actualizadas</span>
                    </div>
                  </div>

                  @if (totalCreadas() > 0) {
                    <div class="kpi-card created">
                      <mat-icon>add_business</mat-icon>
                      <div class="kpi-data">
                        <span class="kpi-num">{{ totalCreadas() }}</span>
                        <span class="kpi-label">Nuevas Creadas</span>
                      </div>
                    </div>
                  }

                  <div class="kpi-card partida">
                    <mat-icon>assignment_turned_in</mat-icon>
                    <div class="kpi-data">
                      <span class="kpi-num">{{ totalPartidasActualizadas() }}</span>
                      <span class="kpi-label">Con Partida Reg.</span>
                    </div>
                  </div>

                  <div class="kpi-card success">
                    <mat-icon>verified</mat-icon>
                    <div class="kpi-data">
                      <span class="kpi-num">{{ totalAutorizadasResultado() }}</span>
                      <span class="kpi-label">Autorizadas</span>
                    </div>
                  </div>

                  @if (totalCanceladasResultado() > 0) {
                    <div class="kpi-card danger-card">
                      <mat-icon>block</mat-icon>
                      <div class="kpi-data">
                        <span class="kpi-num">{{ totalCanceladasResultado() }}</span>
                        <span class="kpi-label">Canceladas</span>
                      </div>
                    </div>
                  }

                  @if (totalErrores() > 0) {
                    <div class="kpi-card danger">
                      <mat-icon>error_outline</mat-icon>
                      <div class="kpi-data">
                        <span class="kpi-num">{{ totalErrores() }}</span>
                        <span class="kpi-label">No Subidas / Error</span>
                      </div>
                    </div>
                  }
                </div>

                <!-- SECCIÓN DETALLADA DE ERRORES Y FILAS NO SUBIDAS -->
                @if (listaErrores().length > 0) {
                  <div class="errors-section-box" style="margin-top: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom: 12px;">
                      <h4 style="margin:0; color: #dc2626; font-weight: 700; display:flex; align-items:center; gap:8px;">
                        <mat-icon style="color:#dc2626;">warning</mat-icon>
                        Detalle de Filas NO Subidas o Con Errores ({{ listaErrores().length }})
                      </h4>
                      <button mat-stroked-button color="warn" (click)="exportarReporteErrores()" style="border-radius:8px;">
                        <mat-icon>file_download</mat-icon> Exportar Reporte de Errores (Excel)
                      </button>
                    </div>

                    <div class="tab-table-wrapper">
                      <table class="modern-table">
                        <thead>
                          <tr>
                            <th>Fila</th>
                            <th>RUC</th>
                            <th>Razón Social / Objeto</th>
                            <th>Motivo por el cual NO se subió</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (err of listaErrores(); track $index) {
                            <tr class="invalid-row">
                              <td><strong>#{{ err.fila || ('-' ) }}</strong></td>
                              <td><span class="code-badge">{{ err.ruc || 'Sin RUC' }}</span></td>
                              <td><strong>{{ err.razonSocial || err.objeto || '-' }}</strong></td>
                              <td>
                                <span class="status-chip danger" style="white-space:normal; text-align:left;">
                                  <mat-icon>error</mat-icon> {{ err.error || err.motivo || 'Error indeterminado' }}
                                </span>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }

                <!-- TABLA DE EMPRESAS CREADAS -->
                @if (listaCreadas().length > 0) {
                  <div style="margin-top: 20px;">
                    <h4 style="margin-bottom:12px; color: #16a34a; font-weight: 700; display:flex; align-items:center; gap:8px;">
                      <mat-icon style="color:#16a34a;">add_circle</mat-icon>
                      Empresas Creadas Exitosamente ({{ listaCreadas().length }})
                    </h4>
                    <div class="tab-table-wrapper">
                      <table class="modern-table">
                        <thead>
                          <tr>
                            <th>RUC</th>
                            <th>Razón Social</th>
                            <th>Partida Registral</th>
                            <th>Estado Legal</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (emp of listaCreadas().slice(0, 15); track emp.ruc) {
                            <tr>
                              <td><span class="code-badge">{{ emp.ruc }}</span></td>
                              <td><strong>{{ emp.razonSocial }}</strong></td>
                              <td>
                                @if (emp.partidaRegistral) {
                                  <span class="code-badge partida-badge">
                                    <mat-icon class="badge-icon">verified</mat-icon> {{ emp.partidaRegistral }}
                                  </span>
                                } @else {
                                  <span class="text-muted">-</span>
                                }
                              </td>
                              <td>
                                <span [class]="'status-chip ' + (emp.estado === 'CANCELADA' ? 'chip-cancelada danger' : (emp.estado === 'AUTORIZADA' ? 'chip-autorizada success' : 'chip-otros info'))">
                                  <mat-icon class="chip-mini-icon">{{ emp.estado === 'CANCELADA' ? 'block' : (emp.estado === 'AUTORIZADA' ? 'verified' : 'info') }}</mat-icon>
                                  {{ emp.estado || 'AUTORIZADA' }}
                                </span>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }

                <!-- TABLA DE EMPRESAS ACTUALIZADAS -->
                @if (listaActualizadas().length > 0) {
                  <div style="margin-top: 20px;">
                    <h4 style="margin-bottom:12px; color: #0284c7; font-weight: 700; display:flex; align-items:center; gap:8px;">
                      <mat-icon style="color:#0284c7;">published_with_changes</mat-icon>
                      Empresas Actualizadas por RUC ({{ listaActualizadas().length }})
                    </h4>
                    <div class="tab-table-wrapper">
                      <table class="modern-table">
                        <thead>
                          <tr>
                            <th>RUC</th>
                            <th>Razón Social</th>
                            <th>Partida Registral</th>
                            <th>Estado Legal</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (emp of listaActualizadas().slice(0, 15); track emp.ruc) {
                            <tr>
                              <td><span class="code-badge info-code">{{ emp.ruc }}</span></td>
                              <td><strong>{{ emp.razonSocial }}</strong></td>
                              <td>
                                @if (emp.partidaRegistral) {
                                  <span class="code-badge partida-badge">
                                    <mat-icon class="badge-icon">verified</mat-icon> {{ emp.partidaRegistral }}
                                  </span>
                                } @else {
                                  <span class="text-muted">-</span>
                                }
                              </td>
                              <td>
                                <span [class]="'status-chip ' + (emp.estado === 'CANCELADA' ? 'chip-cancelada danger' : (emp.estado === 'AUTORIZADA' ? 'chip-autorizada success' : 'chip-otros info'))">
                                  <mat-icon class="chip-mini-icon">{{ emp.estado === 'CANCELADA' ? 'block' : (emp.estado === 'AUTORIZADA' ? 'verified' : 'info') }}</mat-icon>
                                  {{ emp.estado }}
                                </span>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }

                <div class="main-action-area" style="margin-top: 28px;">
                  <button mat-raised-button color="primary" (click)="reiniciar()" style="height:48px; border-radius:12px; font-weight:700;">
                    <mat-icon>refresh</mat-icon> Realizar Nueva Carga Masiva
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
export class CargaMasivaEmpresasComponent implements OnInit {
  Math = Math;

  // Signals de Estado
  origenCarga = signal<'archivo' | 'google-sheets'>('archivo');
  archivoSeleccionado = signal<File | null>(null);
  isDragOver = signal<boolean>(false);
  googleSheetsUrl = signal<string>('https://docs.google.com/spreadsheets/d/1M_GKLrrIN_lXupWzoWRCeuoQhtN2UYidTZFac0ooM7Y/edit?gid=0#gid=0');
  cargandoGoogleSheets = signal<boolean>(false);
  cargando = signal<boolean>(false);

  // Opciones de Configuración
  soloValidar = signal<boolean>(false);
  modoProcesamiento = signal<'upsert' | 'crear'>('upsert');

  // Mapeo & Previsualización
  columnasMapeadas = signal<ColumnaMapeoEmpresa[]>([]);
  previewRows = signal<RegistroEmpresaPreview[]>([]);
  parsedRawRows = signal<any[]>([]);

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

  // Filtro activo en vista previa
  filtroEstadoPreview = signal<'TODOS' | 'AUTORIZADA' | 'CANCELADA' | 'OTROS' | 'ERROR'>('TODOS');

  // Computed signals para previsualización
  totalValidosPreview = computed(() => this.previewRows().filter(r => r.esValido).length);
  totalInvalidosPreview = computed(() => this.previewRows().filter(r => !r.esValido).length);
  totalAutorizadasPreview = computed(() => this.previewRows().filter(r => r.esValido && r.estado === 'AUTORIZADA').length);
  totalCanceladasPreview = computed(() => this.previewRows().filter(r => r.esValido && r.estado === 'CANCELADA').length);
  totalSuspendidasPreview = computed(() => this.previewRows().filter(r => r.esValido && r.estado === 'SUSPENDIDA').length);
  totalEnTramitePreview = computed(() => this.previewRows().filter(r => r.esValido && r.estado === 'EN_TRAMITE').length);
  totalOtrosEstadosPreview = computed(() => this.previewRows().filter(r => r.esValido && !['AUTORIZADA', 'CANCELADA'].includes(r.estado)).length);

  previewRowsFiltradasYOrdenadas = computed(() => {
    let rows = this.previewRows();
    const filtro = this.filtroEstadoPreview();

    if (filtro === 'AUTORIZADA') {
      rows = rows.filter(r => r.esValido && r.estado === 'AUTORIZADA');
    } else if (filtro === 'CANCELADA') {
      rows = rows.filter(r => r.esValido && r.estado === 'CANCELADA');
    } else if (filtro === 'OTROS') {
      rows = rows.filter(r => r.esValido && !['AUTORIZADA', 'CANCELADA'].includes(r.estado));
    } else if (filtro === 'ERROR') {
      rows = rows.filter(r => !r.esValido);
    }

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
          valA = a.esValido ? 1 : 0;
          valB = b.esValido ? 1 : 0;
          return isAsc ? valA - valB : valB - valA;
        case 'ruc':
          valA = a.ruc || '';
          valB = b.ruc || '';
          break;
        case 'razonSocial':
          valA = a.razonSocial || '';
          valB = b.razonSocial || '';
          break;
        case 'domicilioLegal':
          valA = a.domicilioLegal || '';
          valB = b.domicilioLegal || '';
          break;
        case 'representanteLegal':
          valA = a.representanteLegal || '';
          valB = b.representanteLegal || '';
          break;
        case 'partidaRegistral':
          valA = a.partidaRegistral || '';
          valB = b.partidaRegistral || '';
          break;
        case 'estado':
          valA = a.estado || '';
          valB = b.estado || '';
          break;
        case 'tipoServicio':
          valA = a.tipoServicio || '';
          valB = b.tipoServicio || '';
          break;
      }

      const res = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      return isAsc ? res : -res;
    });
  });

  // Resultados del Backend
  mostrarResultados = signal<boolean>(false);
  resultado = signal<any>(null);

  // Extraer el objeto interno res.resultado si existe
  resData = computed(() => {
    const r = this.resultado();
    if (!r) return null;
    return r.resultado ? r.resultado : r;
  });

  totalFilas = computed(() => this.resData()?.total_filas || this.previewRows().length || 0);
  totalExitosas = computed(() => this.resData()?.exitosas || this.resData()?.validos || 0);
  
  // Unificar errores del Backend con errores de validación cliente (filas no válidas)
  listaErrores = computed(() => {
    const backendErr = this.resData()?.errores || [];
    if (backendErr.length > 0) return backendErr;

    // Si backend no retornó lista explícita, compilar errores de validación local
    return this.previewRows()
      .filter(r => !r.esValido)
      .map(r => ({
        fila: r.fila,
        ruc: r.ruc || 'N/A',
        razonSocial: r.razonSocial || 'Desconocida',
        error: r.errores.join(', ') || 'Inconsistencia en RUC o Razón Social'
      }));
  });

  totalErrores = computed(() => {
    const backendFallidas = this.resData()?.fallidas || 0;
    const errLen = this.listaErrores().length;
    return Math.max(backendFallidas, errLen);
  });

  listaCreadas = computed(() => this.resData()?.empresas_creadas || []);
  listaActualizadas = computed(() => this.resData()?.empresas_actualizadas || []);

  totalActualizadas = computed(() => this.listaActualizadas().length);
  totalCreadas = computed(() => this.listaCreadas().length);
  totalPartidasActualizadas = computed(() => {
    const res = this.resData();
    if (res && res.partidas_actualizadas !== undefined) {
      return res.partidas_actualizadas;
    }
    const fromAct = this.listaActualizadas().filter((e: any) => e.partidaRegistral).length;
    const fromCre = this.listaCreadas().filter((e: any) => e.partidaRegistral).length;
    return fromAct + fromCre;
  });

  conteoEstadosResultado = computed(() => {
    const r = this.resData();
    if (r?.conteo_estados) {
      return r.conteo_estados;
    }
    return {
      AUTORIZADA: this.totalAutorizadasPreview(),
      CANCELADA: this.totalCanceladasPreview(),
      SUSPENDIDA: this.totalSuspendidasPreview(),
      EN_TRAMITE: this.totalEnTramitePreview(),
      OTROS: this.totalOtrosEstadosPreview()
    };
  });

  totalAutorizadasResultado = computed(() => this.conteoEstadosResultado()?.AUTORIZADA || 0);
  totalCanceladasResultado = computed(() => this.conteoEstadosResultado()?.CANCELADA || 0);
  totalOtrosEstadosResultado = computed(() => {
    const c = this.conteoEstadosResultado();
    return (c?.SUSPENDIDA || 0) + (c?.EN_TRAMITE || 0) + (c?.OTROS || 0);
  });

  normalizarEstadoEmpresa(val: string): string {
    if (!val) return 'AUTORIZADA';
    const norm = String(val).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (norm.includes('CANCEL') || norm.includes('BAJA') || norm.includes('REVOC') || norm.includes('DENEG') || norm.includes('ANULAD') || norm.includes('NO AUTORIZ')) {
      return 'CANCELADA';
    }
    if (norm.includes('SUSPEND')) {
      return 'SUSPENDIDA';
    }
    if (norm.includes('TRAMIT') || norm.includes('PROCESO') || norm.includes('PENDIENT') || norm.includes('EVALUA')) {
      return 'EN_TRAMITE';
    }
    if (norm.includes('AUTORIZ') || norm.includes('VIGENT') || norm.includes('HABILIT') || norm.includes('ACTIV')) {
      return 'AUTORIZADA';
    }
    return 'AUTORIZADA';
  }

  getServicioAbreviado(servicio: string): string {
    if (!servicio) return '';
    const s = String(servicio).toUpperCase().trim();
    const mapa: { [key: string]: string } = {
      'PASAJEROS': 'PASAJ.',
      'PERSONAS': 'PASAJ.',
      'TURISMO': 'TUR.',
      'TRABAJADORES': 'TRAB.',
      'MERCANCIAS': 'MERC.',
      'MERCANCÍAS': 'MERC.',
      'CARGA': 'CARGA',
      'INFRAESTRUCTURA': 'INFRA.',
      'MIXTO': 'MIXTO',
      'OTROS': 'OTROS'
    };
    if (mapa[s]) return mapa[s];
    return s.length > 6 ? s.substring(0, 5) + '.' : s;
  }

  constructor(
    private empresaService: EmpresaService,
    private googleSheets: GoogleSheetsService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.validarYProcesarArchivoLocal(file);
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.validarYProcesarArchivoLocal(files[0]);
    }
  }

  validarYProcesarArchivoLocal(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      this.snackBar.open('❌ Formato no soportado. Selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)', 'OK', { duration: 4000 });
      return;
    }

    this.archivoSeleccionado.set(file);
    this.cargando.set(true);

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawData || rawData.length < 2) {
          this.snackBar.open('❌ El archivo no contiene filas de datos suficientes', 'OK', { duration: 4000 });
          this.cargando.set(false);
          return;
        }

        const headers = (rawData[0] || []).map(h => String(h || '').trim());
        const dataRows = rawData.slice(1);

        this.procesarFilasYGenerarPreview(headers, dataRows);
        this.cargando.set(false);
      } catch (err: any) {
        console.error('Error procesando archivo Excel:', err);
        this.snackBar.open('❌ Error al leer el archivo Excel: ' + err.message, 'OK', { duration: 5000 });
        this.cargando.set(false);
      }
    };
    reader.readAsBinaryString(file);
  }

  cargarDesdeGoogleSheets(): void {
    const url = this.googleSheetsUrl().trim();
    if (!url) {
      this.snackBar.open('Ingresa una URL válida de Google Sheets', 'OK', { duration: 3000 });
      return;
    }

    this.cargandoGoogleSheets.set(true);
    const id = this.googleSheets.extraerIdDeUrl(url) || url;

    this.googleSheets.obtenerDatosReales(id).subscribe({
      next: (info) => {
        const dummyFile = new File([''], 'GoogleSheets_DB_EMPRESAS.csv', { type: 'text/csv' });
        this.archivoSeleccionado.set(dummyFile);
        this.procesarFilasYGenerarPreview(info.encabezados, info.datos);
        this.cargandoGoogleSheets.set(false);
        this.snackBar.open(`✅ Obtenidos ${info.totalFilas} registros desde Google Sheets`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.cargandoGoogleSheets.set(false);
        this.snackBar.open('❌ Error al obtener Google Sheets: ' + err.message, 'OK', { duration: 5000 });
      }
    });
  }

  procesarFilasYGenerarPreview(headers: string[], dataRows: any[][]): void {
    // Normalizar encabezados (quitar acentos, guiones bajos y convertir a minúsculas)
    const headersClean = headers.map(h => 
      String(h || '').toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/_/g, " ")
        .trim()
    );

    const findIndex = (keywords: string[], fallbackIdx: number = -1): number => {
      const idx = headersClean.findIndex(h => {
        if ((h.startsWith('id ') || h === 'id' || h.startsWith('id_') || h.includes('id_empresa')) && !keywords.includes('id')) {
          return false;
        }
        return keywords.some(k => h.includes(k));
      });
      return idx >= 0 ? idx : (fallbackIdx >= 0 && fallbackIdx < headers.length ? fallbackIdx : -1);
    };

    // Mapeo preciso de Columnas B a K (Ignorando ID_EMPRESA en Col A)
    const idxRuc = findIndex(['ruc'], 1); // Col B (índice 1)
    const idxRazon = findIndex(['razon_social', 'razon social', 'razonsocial', 'razon', 'razón', 'denominacion'], 2); // Col C (índice 2)
    const idxDomicilio = findIndex(['domicilio legal', 'domicilio', 'direccion', 'fiscal'], 3); // Col D (índice 3)
    const idxTelefono = findIndex(['telefono', 'celular'], 4); // Col E (índice 4)
    const idxCorreo = findIndex(['correo electronico', 'correo', 'email'], 5); // Col F (índice 5)
    const idxRep = findIndex(['representante legal', 'representante'], 6); // Col G (índice 6)
    const idxDniRep = findIndex(['dni representante legal', 'dni representante', 'dni'], 7); // Col H (índice 7)
    const idxPartida = findIndex(['partida registral', 'partida', 'partida_registral', 'partidaregistral', 'nro partida', 'n° partida', 'partida electronica', 'sunarp'], 8); // Col I (índice 8)
    
    // Detección inteligente de columna de Estado Legal (excluyendo SUNAT)
    let idxEstado = headersClean.findIndex(h => 
      !h.includes('sunat') && !h.includes('tribut') && !h.includes('contribuyente') &&
      (h.includes('estado legal') || h.includes('estado_legal') || h.includes('situacion legal') || h.includes('estado empresa'))
    );
    if (idxEstado < 0) {
      idxEstado = headersClean.findIndex(h => 
        !h.includes('sunat') && !h.includes('tribut') && !h.includes('contribuyente') &&
        (h.includes('situacion') || h === 'estado' || h.startsWith('estado ') || h.endsWith(' estado'))
      );
    }
    if (idxEstado < 0 && headers.length > 9) {
      idxEstado = 9; // Col J
    }

    // Mapeo estricto: Solo columnas B a J (Ignorando ID_EMPRESA en Col A y columnas posteriores a J)
    const mapeo: ColumnaMapeoEmpresa[] = [
      { archivoCol: idxRuc >= 0 ? headers[idxRuc] : 'Col B (RUC)', destCampo: 'ruc', tipo: 'RUC (Requerido)' },
      { archivoCol: idxRazon >= 0 ? headers[idxRazon] : 'Col C (RAZON_SOCIAL)', destCampo: 'razonSocial', tipo: 'Texto (Requerido)' },
      { archivoCol: idxDomicilio >= 0 ? headers[idxDomicilio] : 'Col D (DOMICILIO_LEGAL)', destCampo: 'direccionFiscal', tipo: 'Dirección' },
      { archivoCol: idxTelefono >= 0 ? headers[idxTelefono] : 'Col E (TELEFONO)', destCampo: 'telefonoContacto', tipo: 'Teléfono' },
      { archivoCol: idxCorreo >= 0 ? headers[idxCorreo] : 'Col F (CORREO_ELECTRONICO)', destCampo: 'emailContacto', tipo: 'Email' },
      { archivoCol: idxRep >= 0 ? headers[idxRep] : 'Col G (REPRESENTANTE_LEGAL)', destCampo: 'representanteLegal', tipo: 'Nombre' },
      { archivoCol: idxDniRep >= 0 ? headers[idxDniRep] : 'Col H (DNI_REPRESENTANTE_LEGAL)', destCampo: 'dniRepresentante', tipo: 'DNI (8 dgt)' },
      { archivoCol: idxPartida >= 0 ? headers[idxPartida] : 'Col I (PARTIDA_REGISTRAL)', destCampo: 'partidaRegistral', tipo: 'Partida' },
      { archivoCol: idxEstado >= 0 ? headers[idxEstado] : 'Col J (ESTADO)', destCampo: 'estado', tipo: 'Estado Legal' }
    ];
    this.columnasMapeadas.set(mapeo);

    const previews: RegistroEmpresaPreview[] = [];
    const rawParsed: any[] = [];

    dataRows.forEach((row, index) => {
      const rucVal = String(idxRuc >= 0 ? row[idxRuc] || '' : '').trim();
      const razonVal = String(idxRazon >= 0 ? row[idxRazon] || '' : '').trim();
      const domVal = String(idxDomicilio >= 0 ? row[idxDomicilio] || '' : '').trim();
      const telVal = String(idxTelefono >= 0 ? row[idxTelefono] || '' : '').trim();
      const correoVal = String(idxCorreo >= 0 ? row[idxCorreo] || '' : '').trim();
      const repVal = String(idxRep >= 0 ? row[idxRep] || '' : '').trim();
      const dniRepVal = String(idxDniRep >= 0 ? row[idxDniRep] || '' : '').trim();
      const partidaVal = String(idxPartida >= 0 ? row[idxPartida] || '' : '').trim();
      
      const estadoRaw = String(idxEstado >= 0 ? row[idxEstado] || '' : '').trim();
      const estadoNorm = this.normalizarEstadoEmpresa(estadoRaw || 'AUTORIZADA');

      if (!rucVal && !razonVal) return;

      const errores: string[] = [];
      if (!rucVal) errores.push('RUC es requerido');
      if (rucVal && rucVal.length !== 11) errores.push(`RUC inválido (${rucVal.length} dígitos, requiere 11)`);
      if (!razonVal) errores.push('Razón Social es requerida');

      previews.push({
        fila: index + 2,
        ruc: rucVal,
        razonSocial: razonVal,
        domicilioLegal: domVal,
        telefono: telVal,
        correoElectronico: correoVal,
        representanteLegal: repVal,
        dniRepresentanteLegal: dniRepVal,
        partidaRegistral: partidaVal,
        estado: estadoNorm,
        estadoOriginal: estadoRaw,
        tipoServicio: '-',
        esValido: errores.length === 0,
        errores
      });

      // Parsear objeto con columnas consideradas (Col B a Col J)
      rawParsed.push({
        ruc: rucVal,
        razonSocial: razonVal,
        direccionFiscal: domVal,
        telefonoContacto: telVal,
        emailContacto: correoVal,
        representanteLegal: repVal,
        dniRepresentante: dniRepVal,
        partida: partidaVal,
        partidaRegistral: partidaVal,
        PARTIDA_REGISTRAL: partidaVal,
        estado: estadoNorm
      });
    });

    this.previewRows.set(previews);
    this.parsedRawRows.set(rawParsed);
  }

  procesarArchivo(): void {
    const rawData = this.parsedRawRows();
    if (!rawData || rawData.length === 0) {
      this.snackBar.open('No hay datos para procesar. Selecciona un archivo o enlace.', 'OK', { duration: 3000 });
      return;
    }

    this.cargando.set(true);

    this.empresaService.procesarCargaMasivaGoogleSheets(rawData, this.soloValidar()).subscribe({
      next: (res) => {
        // Extraer objeto resultado
        const data = res.resultado ? res.resultado : res;
        this.resultado.set(data);
        this.mostrarResultados.set(true);
        this.cargando.set(false);
        this.snackBar.open('✅ Carga masiva procesada exitosamente', 'OK', { duration: 4000 });
      },
      error: (err) => {
        this.cargando.set(false);
        this.snackBar.open('❌ Error al procesar empresas: ' + err.message, 'OK', { duration: 5000 });
      }
    });
  }

  exportarReporteErrores(): void {
    const errores = this.listaErrores();
    if (!errores || errores.length === 0) {
      this.snackBar.open('No hay errores registrados para exportar', 'OK', { duration: 3000 });
      return;
    }

    const dataExport = errores.map((e: any) => ({
      'N° Fila Original': e.fila || 'N/A',
      'RUC Empresa': e.ruc || 'N/A',
      'Razón Social': e.razonSocial || 'N/A',
      'Motivo por el que NO se subió': e.error || e.motivo || 'Error en validación'
    }));

    const ws = XLSX.utils.json_to_sheet(dataExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errores_Carga_Empresas');
    XLSX.writeFile(wb, `Reporte_Errores_Empresas_${new Date().toISOString().split('T')[0]}.xlsx`);
    this.snackBar.open('✅ Reporte de errores exportado a Excel', 'OK', { duration: 3000 });
  }

  descargarPlantilla(): void {
    this.cargando.set(true);
    this.empresaService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_empresas.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.cargando.set(false);
        this.snackBar.open('✅ Plantilla descargada', 'OK', { duration: 3000 });
      },
      error: () => {
        this.cargando.set(false);
        this.snackBar.open('❌ Error al descargar plantilla', 'OK', { duration: 4000 });
      }
    });
  }

  limpiarArchivo(): void {
    this.archivoSeleccionado.set(null);
    this.previewRows.set([]);
    this.parsedRawRows.set([]);
    this.columnasMapeadas.set([]);
    this.googleSheetsUrl.set('');
    this.mostrarResultados.set(false);
    this.resultado.set(null);
  }

  reiniciar(): void {
    this.limpiarArchivo();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
