import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { TucService, GoogleDocsStatus, TucPlantillaConfig } from '../../services/tuc.service';
import { VehiculoEmpresa } from '../../services/flota-empresa.service';

export interface GenerarTucDialogData {
  vehiculo: VehiculoEmpresa;
}

@Component({
  selector: 'app-generar-tuc-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule
  ],
  template: `
    <div class="generar-tuc-modal">
      <!-- HEADER -->
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon-circle">
            <mat-icon>description</mat-icon>
          </div>
          <div>
            <h2 class="modal-title">Generación de TUC desde Plantilla Oficial</h2>
            <p class="modal-subtitle">
              Placa: <strong>{{ data.vehiculo.placa }}</strong> | TUC: <strong>{{ data.vehiculo.numero_tuc || 'S/N' }}</strong> | {{ data.vehiculo.razon_social }}
            </p>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" class="btn-close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- BODY -->
      <div class="modal-body">
        @if (isLoading()) {
          <div class="loading-state">
            <mat-spinner diameter="42"></mat-spinner>
            <span>Cargando datos y cruzando información técnica...</span>
          </div>
        } @else {
          <div class="main-layout">
            
            <!-- PANEL IZQUIERDO: VISTA PREVIA DE LA TARJETA TUC -->
            <div class="card-preview-container">
              <div class="preview-header">
                <span class="preview-tag">
                  <mat-icon style="font-size:15px;width:15px;height:15px;">badge</mat-icon>
                  Vista Preliminar de la Tarjeta TUC
                </span>
                <span class="badge-resolucion">
                  {{ tucData()?.datos?.nro_resolucion_primigenia || data.vehiculo.nro_resolucion_primigenia || '-' }}
                </span>
              </div>

              <!-- CONTENIDO DE LA TARJETA FÍSICA -->
              <div id="printable-tuc-card" class="tuc-card-sheet">
                
                <!-- SECCIÓN 1: VIGENCIA Y EMPRESA -->
                <div class="tuc-row header-row">
                  <div class="tuc-auth-dates">
                    <span class="lbl-bold">AUTORIZACIÓN</span>
                    <span>DEL: <strong>{{ tucData()?.datos?.fecha_del || '-' }}</strong></span>
                    <span>AL: <strong>{{ tucData()?.datos?.fecha_al || '-' }}</strong></span>
                  </div>
                </div>

                <div class="tuc-row rdr-row">
                  <span class="lbl-bold">R.D.R. N°</span>
                  <span class="val-mono"><strong>{{ tucData()?.datos?.nro_resolucion_primigenia || '-' }}</strong>-GRP/GRI/DRTC</span>
                  <span>({{ tucData()?.datos?.fecha_resolucion_primigenia || '-' }})</span>
                </div>

                <div class="tuc-row empresa-row">
                  <span class="empresa-name">{{ tucData()?.datos?.empresa || '-' }}</span>
                </div>

                <div class="tuc-row ruc-row">
                  <span><strong>RUC :</strong> {{ tucData()?.datos?.ruc || '-' }}</span>
                  <span><strong>Partida Registral:</strong> {{ tucData()?.datos?.partida || '-' }}</span>
                </div>

                <!-- SECCIÓN 2: TABLA DE DATOS TÉCNICOS -->
                <table class="tuc-tech-table">
                  <tr>
                    <td class="cell-label">Placa :</td>
                    <td class="cell-val placa-highlight"><strong>{{ tucData()?.datos?.placa || '-' }}</strong></td>
                    <td class="cell-label">Color :</td>
                    <td class="cell-val" colspan="3">{{ tucData()?.datos?.color || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="cell-label">Marca:</td>
                    <td class="cell-val">{{ tucData()?.datos?.marca || '-' }}</td>
                    <td class="cell-label">VIN/Serie :</td>
                    <td class="cell-val" colspan="3">{{ tucData()?.datos?.vin || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="cell-label">Fab./Mod. :</td>
                    <td class="cell-val">{{ tucData()?.datos?.anio || '-' }}</td>
                    <td class="cell-label">Asientos :</td>
                    <td class="cell-val">{{ tucData()?.datos?.asientos || '-' }}</td>
                    <td class="cell-label">Alto:</td>
                    <td class="cell-val">{{ tucData()?.datos?.alto || '-' }}</td>
                    <td class="cell-label">Peso Neto :</td>
                    <td class="cell-val">{{ tucData()?.datos?.peso_neto || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="cell-label">Categoría. :</td>
                    <td class="cell-val">{{ tucData()?.datos?.categoria || '-' }}</td>
                    <td class="cell-label">Ejes :</td>
                    <td class="cell-val">{{ tucData()?.datos?.ejes || '-' }}</td>
                    <td class="cell-label">Ancho:</td>
                    <td class="cell-val">{{ tucData()?.datos?.ancho || '-' }}</td>
                    <td class="cell-label">Carga Útil :</td>
                    <td class="cell-val">{{ tucData()?.datos?.carga_util || '-' }}</td>
                  </tr>
                  <tr>
                    <td colspan="4"></td>
                    <td class="cell-label">Largo :</td>
                    <td class="cell-val">{{ tucData()?.datos?.largo || '-' }}</td>
                    <td class="cell-label">Peso Bruto :</td>
                    <td class="cell-val">{{ tucData()?.datos?.peso_bruto || '-' }}</td>
                  </tr>
                </table>

                <div class="divider-line"></div>

                <!-- SECCIÓN 3: RUTAS AUTORIZADAS -->
                <div class="tuc-rutas-box">
                  <div class="rutas-title">RUTAS AUTORIZADAS:</div>
                  @if (tucData()?.datos?.rutas_detalle && tucData()?.datos?.rutas_detalle.length > 0) {
                    <div class="rutas-list">
                      @for (r of tucData()?.datos?.rutas_detalle; track r.codigo) {
                        <div class="ruta-item">
                          <span class="ruta-cod">RUTA {{ r.codigo }}:</span>
                          <span>{{ r.origen }} - {{ r.itinerario ? r.itinerario + ' - ' : '' }}{{ r.destino }}</span>
                          @if (r.frecuencia) {
                            <span class="ruta-frec">({{ r.frecuencia }})</span>
                          }
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="rutas-empty">{{ tucData()?.datos?.tabla_rutas_text || 'SIN RUTAS ASIGNADAS' }}</div>
                  }
                </div>

                <div class="divider-line"></div>

                <!-- SECCIÓN 4: ACTO RESOLUTIVO -->
                <div class="tuc-footer-resolucion">
                  <span>R.D.R N° <strong>{{ tucData()?.datos?.num_resolucion_acto || '-' }}</strong>-GRP/GRI/DRTC ({{ tucData()?.datos?.fecha_resolucion_acto || '-' }}) ({{ tucData()?.datos?.tipo_resolucion_acto || 'AUTORIZACION' }})</span>
                </div>

              </div>
            </div>

            <!-- PANEL DERECHO: OPCIONES DE GENERACIÓN -->
            <div class="actions-panel">
              <h3 class="actions-title">Opciones de Emisión</h3>
              <p class="actions-desc">Seleccione la modalidad deseada para emitir o imprimir el formato oficial de la TUC:</p>

              <!-- OPCIÓN 1: DESCARGA WORD -->
              <div class="action-card card-word">
                <div class="action-icon word-icon">
                  <mat-icon>article</mat-icon>
                </div>
                <div class="action-info">
                  <h4 class="action-h">Descargar en Word (.docx)</h4>
                  <p class="action-p">Genera el archivo Word oficial con las 25 etiquetas reemplazadas, listo para editar o archivar.</p>
                  <button mat-raised-button class="btn-download-word" (click)="descargarDocx()" [disabled]="isGeneratingDocx()">
                    @if (isGeneratingDocx()) {
                      <mat-spinner diameter="16" class="inline-spinner"></mat-spinner>
                      <span>Generando Word...</span>
                    } @else {
                      <mat-icon>download</mat-icon>
                      <span>Descargar Plantilla (.docx)</span>
                    }
                  </button>
                </div>
              </div>

              <!-- OPCIÓN 2: IMPRESIÓN DIRECTA / TARJETA FÍSICA -->
              <div class="action-card card-print">
                <div class="action-icon print-icon">
                  <mat-icon>print</mat-icon>
                </div>
                <div class="action-info">
                  <h4 class="action-h">Impresión Directa / Tarjeta Física</h4>
                  <p class="action-p">Abre el cuadro de diálogo de impresión con las dimensiones calibradas para imprimir sobre el cartón.</p>
                  <button mat-raised-button class="btn-print-direct" (click)="imprimirTarjeta()">
                    <mat-icon>print</mat-icon>
                    <span>Imprimir Tarjeta Ahora</span>
                  </button>
                </div>
              </div>

              <!-- OPCIÓN 3: GOOGLE DOCS EN LA NUBE -->
              <div class="action-card card-google" [class.card-google-disabled]="!googleStatus()?.disponible">
                <div class="action-icon google-icon">
                  <mat-icon>cloud</mat-icon>
                </div>
                <div class="action-info">
                  <div class="google-header">
                    <h4 class="action-h">Copia en Google Docs (Nube)</h4>
                    <span class="status-chip" [class.chip-active]="googleStatus()?.disponible">
                      {{ googleStatus()?.disponible ? 'API Conectada' : 'Opcional / Standby' }}
                    </span>
                  </div>
                  <p class="action-p">
                    @if (googleStatus()?.disponible) {
                      Clona la plantilla en Google Drive y rellena los datos en tiempo real mediante la Google Docs API.
                    } @else {
                      Para clonar automáticamente en su Google Drive, coloque el archivo <code>credentials.json</code> en <code>backend/config/</code>.
                    }
                  </p>
                  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <button mat-stroked-button class="btn-google-cloud" 
                            (click)="generarGoogleDocs()" 
                            [disabled]="!googleStatus()?.disponible || isGeneratingGoogle()">
                      @if (isGeneratingGoogle()) {
                        <mat-spinner diameter="16" class="inline-spinner"></mat-spinner>
                        <span>Creando en Google Drive...</span>
                      } @else {
                        <mat-icon>open_in_new</mat-icon>
                        <span>{{ data.vehiculo.link_tuc ? 'Regenerar en Google Docs' : 'Generar en Google Docs' }}</span>
                      }
                    </button>

                    @if (data.vehiculo.link_tuc) {
                      <a [href]="data.vehiculo.link_tuc" target="_blank" mat-stroked-button
                         style="border-color:#1a73e8;color:#1a73e8;font-size:12px;height:36px;display:inline-flex;align-items:center;gap:4px;">
                        <mat-icon style="font-size:16px;width:16px;height:16px;">description</mat-icon>
                        <span>Ver TUC Vinculado</span>
                      </a>
                    }

                    @if (googleStatus()?.plantilla_id) {
                      <a [href]="'https://docs.google.com/document/d/' + (configPlantilla().plantilla_id || googleStatus()?.plantilla_id) + '/edit'" target="_blank"
                         mat-button
                         style="color:#5f6368;font-size:12px;height:36px;display:inline-flex;align-items:center;gap:4px;"
                         matTooltip="Abrir plantilla oficial base en Google Docs">
                        <mat-icon style="font-size:16px;width:16px;height:16px;">launch</mat-icon>
                        <span>Ver Plantilla Base</span>
                      </a>
                    }

                    <button mat-button type="button" (click)="toggleConfigPlantilla()"
                            style="color:#1e3a8a;font-size:12px;height:36px;display:inline-flex;align-items:center;gap:4px;"
                            matTooltip="Configurar ID de la plantilla y anchos de columnas">
                      <mat-icon style="font-size:16px;width:16px;height:16px;">tune</mat-icon>
                      <span>{{ mostrarConfigPlantilla() ? 'Ocultar Configuración' : 'Configurar Plantilla y Columnas' }}</span>
                    </button>
                  </div>

                  <!-- PANEL CONFIGURACIÓN DINÁMICA DE PLANTILLA Y MÁRGENES -->
                  @if (mostrarConfigPlantilla()) {
                    <div class="config-plantilla-box">
                      <div class="cfg-header">
                        <h5>Ajustes de Plantilla y Dimensiones de Tabla</h5>
                        <span class="cfg-hint">Guarda la ID de la plantilla y los anchos de columnas en la base de datos sin necesidad de tocar código.</span>
                      </div>

                      <div class="cfg-field-group">
                        <label>ID de la Plantilla de Google Docs:</label>
                        <div class="cfg-id-row">
                          <input type="text" [ngModel]="configPlantilla().plantilla_id" (ngModelChange)="actualizarCampoConfig('plantilla_id', $event)" class="cfg-input input-id" placeholder="ID del documento..." />
                          <a [href]="'https://docs.google.com/document/d/' + configPlantilla().plantilla_id + '/edit'" target="_blank" mat-stroked-button style="height:32px;font-size:11px;display:inline-flex;align-items:center;gap:3px;">
                            <mat-icon style="font-size:14px;width:14px;height:14px;">open_in_new</mat-icon> Abrir
                          </a>
                        </div>
                      </div>

                      <div class="cfg-presets-row">
                        <span class="cfg-preset-lbl">Presets Rápidos:</span>
                        <button type="button" class="btn-chip" (click)="aplicarPresetCentrado()">
                          🎯 Centrado Reverso (99.2 pt)
                        </button>
                        <button type="button" class="btn-chip" (click)="aplicarPresetIzquierda()">
                          📐 Clásica Izquierda (5 pt)
                        </button>
                      </div>

                      <div class="cfg-columns-grid">
                        <div class="cfg-col-item">
                          <label>Margen Izq (pt):</label>
                          <input type="number" [ngModel]="configPlantilla().col_margen_izq" (ngModelChange)="actualizarCampoConfig('col_margen_izq', $event)" step="0.5" class="cfg-input num" />
                        </div>
                        <div class="cfg-col-item">
                          <label>Col 1 Código (pt):</label>
                          <input type="number" [ngModel]="configPlantilla().col_codigo" (ngModelChange)="actualizarCampoConfig('col_codigo', $event)" step="1" class="cfg-input num" />
                        </div>
                        <div class="cfg-col-item">
                          <label>Col 2 Tramo (pt):</label>
                          <input type="number" [ngModel]="configPlantilla().col_tramo" (ngModelChange)="actualizarCampoConfig('col_tramo', $event)" step="1" class="cfg-input num" />
                        </div>
                        <div class="cfg-col-item">
                          <label>Col 3 Frecuencia (pt):</label>
                          <input type="number" [ngModel]="configPlantilla().col_frecuencia" (ngModelChange)="actualizarCampoConfig('col_frecuencia', $event)" step="1" class="cfg-input num" />
                        </div>
                        <div class="cfg-col-item">
                          <label>Margen Der (pt):</label>
                          <input type="number" [ngModel]="configPlantilla().col_margen_der" (ngModelChange)="actualizarCampoConfig('col_margen_der', $event)" step="0.5" class="cfg-input num" />
                        </div>
                      </div>

                      <div class="cfg-check-row">
                        <label class="cfg-checkbox-lbl">
                          <input type="checkbox" [ngModel]="configPlantilla().auto_detectar_margen" (ngModelChange)="actualizarCampoConfig('auto_detectar_margen', $event)" />
                          <span>Auto-detectar sangría de la regla horizontal centrada en la plantilla</span>
                        </label>
                      </div>

                      <div class="cfg-actions-row">
                        <button mat-flat-button color="primary" (click)="guardarConfiguracion()" [disabled]="isSavingConfig()" style="height:34px;font-size:12px;">
                          @if (isSavingConfig()) {
                            <mat-spinner diameter="14" class="inline-spinner"></mat-spinner>
                            <span>Guardando en BD...</span>
                          } @else {
                            <mat-icon style="font-size:15px;width:15px;height:15px;">save</mat-icon>
                            <span>Guardar Configuración en BD</span>
                          }
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>

            </div>

          </div>
        }
      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <button mat-button (click)="cerrar()">Cerrar</button>
      </div>

    </div>
  `,
  styles: [`
    .generar-tuc-modal {
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      font-family: 'Inter', system-ui, sans-serif;
      max-height: 90vh;
    }

    .modal-header {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: #ffffff;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .header-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          mat-icon { color: #38bdf8; font-size: 22px; width: 22px; height: 22px; }
        }

        .modal-title { margin: 0; font-size: 16px; font-weight: 800; }
        .modal-subtitle { margin: 2px 0 0; font-size: 12px; color: #cbd5e1; }
      }

      .btn-close { color: #ffffff; opacity: 0.8; &:hover { opacity: 1; } }
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
      max-height: calc(90vh - 120px);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px;
      color: #64748b;
      font-size: 13px;
    }

    .main-layout {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    /* PREVIEW CONTAINER */
    .card-preview-container {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .preview-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
        }

        .badge-resolucion {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          font-family: monospace;
        }
      }
    }

    /* TUC SHEET (MIMICS PHYSICAL CARD) */
    .tuc-card-sheet {
      background: #fafaf9;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      padding: 16px 18px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      font-family: 'Roboto', Arial, sans-serif;
      font-size: 10.5px;
      line-height: 1.35;
      color: #0f172a;

      .tuc-row {
        margin-bottom: 4px;
      }

      .header-row {
        .tuc-auth-dates {
          display: flex;
          gap: 12px;
          font-size: 10px;
          color: #1e293b;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
      }

      .lbl-bold { font-weight: 700; color: #334155; }
      .val-mono { font-family: monospace; }

      .empresa-name {
        font-weight: 700;
        color: #1e1b4b;
        font-size: 11px;
      }

      .ruc-row {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        margin-bottom: 6px;
      }

      .tuc-tech-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9.5px;
        margin-top: 4px;

        td {
          padding: 2px 4px;
          vertical-align: middle;
        }

        .cell-label {
          font-weight: 700;
          color: #475569;
          white-space: nowrap;
          text-align: right;
        }

        .cell-val {
          color: #0f172a;
          font-weight: 500;
        }

        .placa-highlight {
          color: #1d4ed8;
          font-family: monospace;
          font-size: 11px;
        }
      }

      .divider-line {
        height: 1px;
        background: #cbd5e1;
        margin: 8px 0;
      }

      .tuc-rutas-box {
        font-size: 9.5px;
        background: #ffffff;
        padding: 6px 10px;
        border-radius: 6px;
        border: 1px solid #e2e8f0;

        .rutas-title {
          font-weight: 800;
          color: #0284c7;
          margin-bottom: 4px;
          font-size: 9.5px;
        }

        .rutas-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .ruta-item {
          color: #334155;
          .ruta-cod { font-weight: 700; color: #0369a1; margin-right: 4px; }
          .ruta-frec { color: #64748b; font-style: italic; margin-left: 4px; }
        }

        .rutas-empty {
          color: #94a3b8;
          font-style: italic;
        }
      }

      .tuc-footer-resolucion {
        font-size: 9px;
        color: #475569;
        text-align: center;
        margin-top: 4px;
      }
    }

    /* ACTIONS PANEL */
    .actions-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .actions-title { margin: 0; font-size: 14px; font-weight: 800; color: #1e293b; }
      .actions-desc { margin: 0 0 6px; font-size: 12px; color: #64748b; }

      .action-card {
        display: flex;
        gap: 14px;
        padding: 14px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        transition: all 0.2s ease;

        &:hover {
          border-color: #cbd5e1;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.04);
        }

        .action-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          mat-icon { font-size: 22px; width: 22px; height: 22px; }
        }

        .action-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;

          .action-h { margin: 0; font-size: 13px; font-weight: 700; color: #1e293b; }
          .action-p { margin: 0; font-size: 11.5px; color: #64748b; line-height: 1.4; code { background: #e2e8f0; padding: 1px 4px; border-radius: 4px; } }
        }

        &.card-word {
          border-left: 4px solid #2563eb;
          .word-icon { background: #dbeafe; color: #1d4ed8; }
          .btn-download-word {
            align-self: flex-start;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: #ffffff;
            font-weight: 700;
            font-size: 11.5px;
            height: 34px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
        }

        &.card-print {
          border-left: 4px solid #059669;
          .print-icon { background: #d1fae5; color: #047857; }
          .btn-print-direct {
            align-self: flex-start;
            background: linear-gradient(135deg, #059669, #047857);
            color: #ffffff;
            font-weight: 700;
            font-size: 11.5px;
            height: 34px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
        }

        &.card-google {
          border-left: 4px solid #7c3aed;
          .google-icon { background: #ede9fe; color: #6d28d9; }

          .google-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 4px;
          }

          .status-chip {
            font-size: 10px;
            font-weight: 700;
            background: #f1f5f9;
            color: #64748b;
            padding: 1px 6px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;

            &.chip-active {
              background: #dcfce7;
              color: #15803d;
              border-color: #bbf7d0;
            }
          }

          .btn-google-cloud {
            align-self: flex-start;
            font-weight: 700;
            font-size: 11.5px;
            height: 34px;
            border-radius: 6px;
            color: #6d28d9;
            border-color: #c4b5fd;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          &.card-google-disabled {
            opacity: 0.9;
            background: #fafafa;
          }

          .config-plantilla-box {
            margin-top: 12px;
            padding: 12px 14px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            gap: 10px;

            .cfg-header {
              display: flex;
              flex-direction: column;
              gap: 2px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;

              h5 {
                margin: 0;
                font-size: 12.5px;
                font-weight: 700;
                color: #1e3a8a;
              }
              .cfg-hint {
                font-size: 10.5px;
                color: #64748b;
              }
            }

            .cfg-field-group {
              display: flex;
              flex-direction: column;
              gap: 4px;

              label {
                font-size: 11px;
                font-weight: 600;
                color: #334155;
              }

              .cfg-id-row {
                display: flex;
                gap: 8px;
                align-items: center;

                .cfg-input {
                  flex: 1;
                  padding: 5px 8px;
                  font-size: 12px;
                  font-family: monospace;
                  border: 1px solid #cbd5e1;
                  border-radius: 4px;
                  background: #ffffff;
                  color: #0f172a;

                  &:focus {
                    border-color: #2563eb;
                    outline: none;
                  }
                }
              }
            }

            .cfg-presets-row {
              display: flex;
              gap: 8px;
              align-items: center;
              flex-wrap: wrap;

              .cfg-preset-lbl {
                font-size: 11px;
                font-weight: 600;
                color: #475569;
              }

              .btn-chip {
                background: #e2e8f0;
                border: 1px solid #cbd5e1;
                border-radius: 12px;
                padding: 3px 9px;
                font-size: 10.5px;
                cursor: pointer;
                color: #1e293b;
                transition: all 0.2s;

                &:hover {
                  background: #cbd5e1;
                  color: #0f172a;
                }
              }
            }

            .cfg-columns-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(95px, 1fr));
              gap: 8px;

              .cfg-col-item {
                display: flex;
                flex-direction: column;
                gap: 2px;

                label {
                  font-size: 10px;
                  font-weight: 600;
                  color: #475569;
                }

                .cfg-input.num {
                  padding: 4px 6px;
                  font-size: 11.5px;
                  border: 1px solid #cbd5e1;
                  border-radius: 4px;
                  background: #ffffff;
                  color: #0f172a;
                }
              }
            }

            .cfg-check-row {
              display: flex;
              align-items: center;
              gap: 6px;

              .cfg-checkbox-lbl {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                color: #334155;
                cursor: pointer;
              }
            }

            .cfg-actions-row {
              display: flex;
              justify-content: flex-end;
              gap: 8px;
              margin-top: 4px;
            }
          }
        }
      }
    }

    .modal-footer {
      padding: 12px 20px;
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .inline-spinner {
      margin-right: 6px;
    }

    /* MEDIA PRINT RULES */
    @media print {
      body * {
        visibility: hidden !important;
      }
      #printable-tuc-card, #printable-tuc-card * {
        visibility: visible !important;
      }
      #printable-tuc-card {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }
    }
  `]
})
export class GenerarTucDialogComponent implements OnInit {
  isLoading = signal<boolean>(true);
  isGeneratingDocx = signal<boolean>(false);
  isGeneratingGoogle = signal<boolean>(false);

  tucData = signal<any>(null);
  googleStatus = signal<GoogleDocsStatus | null>(null);

  mostrarConfigPlantilla = signal<boolean>(false);
  isSavingConfig = signal<boolean>(false);
  configPlantilla = signal<TucPlantillaConfig>({
    plantilla_id: '1crxKiKG74B4zeTbNNByvoEWr_1IRsQ5qkj1a_tNs8lo',
    carpeta_destino_id: '1Yy6q47onyA7flX5MmI8EKuK61YtzGGiA',
    auto_detectar_margen: true,
    col_margen_izq: 99.2,
    col_codigo: 28.0,
    col_tramo: 172.0,
    col_frecuencia: 45.0,
    col_margen_der: 105.0,
    fuente_tamanio_codigo: 6.5,
    fuente_tamanio_tramo: 6.0,
    fuente_tamanio_frecuencia: 5.2,
    fuente_tamanio_dias: 4.5
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: GenerarTucDialogData,
    private dialogRef: MatDialogRef<GenerarTucDialogComponent>,
    private tucService: TucService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const term = this.data.vehiculo.placa || this.data.vehiculo.id;
    this.isLoading.set(true);

    this.tucService.getDatosImpresion(term).subscribe({
      next: (resp) => {
        this.tucData.set(resp);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open('Error al cargar datos técnicos del vehículo.', 'Cerrar', { duration: 4000 });
      }
    });

    this.tucService.getGoogleDocsStatus().subscribe({
      next: (st) => {
        this.googleStatus.set(st);
        if (st?.configuracion) {
          this.configPlantilla.set(st.configuracion);
        }
      },
      error: () => this.googleStatus.set({ disponible: false, mensaje: 'No disponible' })
    });

    this.tucService.getConfiguracionPlantilla().subscribe({
      next: (cfg) => {
        if (cfg) this.configPlantilla.set(cfg);
      }
    });
  }

  toggleConfigPlantilla(): void {
    this.mostrarConfigPlantilla.update(v => !v);
  }

  actualizarCampoConfig(campo: keyof TucPlantillaConfig, valor: any): void {
    this.configPlantilla.update(cfg => ({
      ...cfg,
      [campo]: valor
    }));
  }

  aplicarPresetCentrado(): void {
    this.configPlantilla.update(cfg => ({
      ...cfg,
      col_margen_izq: 99.2,
      col_codigo: 28.0,
      col_tramo: 172.0,
      col_frecuencia: 45.0,
      col_margen_der: 105.0,
      auto_detectar_margen: true
    }));
    this.snackBar.open('Preset Centrado aplicado (99.2 pt). Haga clic en Guardar para persistirlo.', 'OK', { duration: 3000 });
  }

  aplicarPresetIzquierda(): void {
    this.configPlantilla.update(cfg => ({
      ...cfg,
      col_margen_izq: 5.0,
      col_codigo: 28.0,
      col_tramo: 172.0,
      col_frecuencia: 45.0,
      col_margen_der: 200.0,
      auto_detectar_margen: false
    }));
    this.snackBar.open('Preset Izquierda aplicado (5 pt). Haga clic en Guardar para persistirlo.', 'OK', { duration: 3000 });
  }

  guardarConfiguracion(): void {
    this.isSavingConfig.set(true);
    this.tucService.guardarConfiguracionPlantilla(this.configPlantilla()).subscribe({
      next: (saved) => {
        this.isSavingConfig.set(false);
        this.configPlantilla.set(saved);
        if (this.googleStatus()) {
          this.googleStatus.update(st => st ? { ...st, plantilla_id: saved.plantilla_id } : null);
        }
        this.snackBar.open('Configuración de plantilla guardada correctamente en la BD.', 'OK', { duration: 3500 });
      },
      error: (err) => {
        this.isSavingConfig.set(false);
        this.snackBar.open('Error al guardar configuración: ' + (err?.error?.detail || err?.message), 'Cerrar', { duration: 4500 });
      }
    });
  }

  descargarDocx(): void {
    const term = this.data.vehiculo.placa || this.data.vehiculo.id;
    this.isGeneratingDocx.set(true);

    this.tucService.descargarDocxTuc(term).subscribe({
      next: (blob) => {
        this.isGeneratingDocx.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TUC_${this.data.vehiculo.placa || 'VEHICULO'}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Documento Word (.docx) descargado exitosamente.', 'OK', { duration: 3500 });
      },
      error: (err) => {
        this.isGeneratingDocx.set(false);
        const msg = err?.error?.detail || 'Error al descargar documento Word.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  imprimirTarjeta(): void {
    const cardElement = document.getElementById('printable-tuc-card');
    if (!cardElement) {
      window.print();
      return;
    }

    const placa = this.data.vehiculo.placa || 'TUC';
    const numTuc = this.data.vehiculo.numero_tuc || this.tucData()?.numero_tuc || 'S/N';
    const cardHtml = cardElement.innerHTML;

    // Crear iframe invisible para aislar completamente la impresión
    let iframe = document.getElementById('tuc-print-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = 'tuc-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>TUC ${placa} - ${numTuc} - DRTC Puno</title>
        <meta charset="utf-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: auto;
            margin: 8mm 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Roboto', Arial, sans-serif;
            margin: 0;
            padding: 10px;
            background: #ffffff;
            color: #000000;
          }
          .print-card-wrapper {
            max-width: 580px;
            margin: 0 auto;
            border: 2px solid #1e3a8a;
            border-radius: 8px;
            padding: 14px 18px;
            background: #ffffff;
          }
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 6px;
            margin-bottom: 10px;
          }
          .print-title {
            font-size: 13px;
            font-weight: 700;
            color: #1e3a8a;
            text-transform: uppercase;
          }
          .print-sub {
            font-size: 9.5px;
            color: #475569;
          }
          .tuc-row {
            margin-bottom: 5px;
            font-size: 10.5px;
            line-height: 1.35;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
          }
          .tuc-auth-dates {
            display: flex;
            gap: 12px;
          }
          .lbl-bold {
            font-weight: 700;
          }
          .rdr-row {
            font-size: 10px;
            color: #1e293b;
          }
          .val-mono {
            font-family: monospace;
          }
          .empresa-row {
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            margin-top: 3px;
          }
          .ruc-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            border-bottom: 1px dashed #94a3b8;
            padding-bottom: 5px;
            margin-bottom: 6px;
          }
          .tuc-tech-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-bottom: 6px;
          }
          .tuc-tech-table td {
            padding: 2px 3px;
            vertical-align: middle;
          }
          .cell-label {
            font-weight: 600;
            color: #334155;
            white-space: nowrap;
          }
          .cell-val {
            color: #0f172a;
          }
          .placa-highlight {
            font-weight: 700;
            font-size: 11px;
            color: #1e3a8a;
          }
          .divider-line {
            height: 1px;
            background: #cbd5e1;
            margin: 6px 0;
          }
          .tuc-rutas-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 6px 8px;
            margin-bottom: 6px;
          }
          .rutas-title {
            font-size: 9.5px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 3px;
          }
          .rutas-list {
            display: flex;
            flex-direction: column;
            gap: 2.5px;
          }
          .ruta-item {
            font-size: 9px;
            color: #1e293b;
            display: flex;
            gap: 5px;
          }
          .ruta-cod {
            font-weight: 700;
            white-space: nowrap;
          }
          .ruta-frec {
            color: #475569;
            font-style: italic;
          }
          .rutas-empty {
            font-size: 9px;
            color: #64748b;
            font-style: italic;
          }
          .tuc-footer-resolucion {
            font-size: 9px;
            color: #334155;
            text-align: center;
            font-weight: 500;
            padding-top: 3px;
          }
        </style>
      </head>
      <body>
        <div class="print-card-wrapper">
          <div class="print-header">
            <div>
              <div class="print-title">Gobierno Regional Puno - DRTC</div>
              <div class="print-sub">Tarjeta Única de Circulación (TUC)</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:11.5px;font-weight:700;color:#1e3a8a;">TUC N° ${numTuc}</div>
              <div style="font-size:9.5px;color:#64748b;">PLACA: ${placa}</div>
            </div>
          </div>
          ${cardHtml}
        </div>
      </body>
      </html>
    `);
    doc.close();

    // Disparar la impresión en el iframe
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }, 350);
  }

  generarGoogleDocs(): void {
    if (!this.googleStatus()?.disponible) return;

    const term = this.data.vehiculo.placa || this.data.vehiculo.id;
    this.isGeneratingGoogle.set(true);

    this.tucService.generarGoogleDoc(term).subscribe({
      next: (resp) => {
        this.isGeneratingGoogle.set(false);
        if (resp && resp.exito && resp.url) {
          this.data.vehiculo.link_tuc = resp.url;
          window.open(resp.url, '_blank');
          this.snackBar.open('Copia en Google Docs generada y guardada en la columna de Links.', 'OK', { duration: 4500 });
        } else {
          this.snackBar.open(resp?.mensaje || 'No se pudo generar el documento en Google Docs.', 'Cerrar', { duration: 4000 });
        }
      },
      error: (err) => {
        this.isGeneratingGoogle.set(false);
        const msg = err?.error?.detail || 'Error al generar en Google Docs.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close({ link_tuc: this.data.vehiculo.link_tuc });
  }
}
