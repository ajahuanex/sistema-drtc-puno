import { Component, Inject, OnInit, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { TucService, GoogleDocsStatus, TucPlantillaConfig, PlantillaTucCalibradorConfig, VariablePlantillaTuc } from '../../services/tuc.service';
import { VehiculoEmpresa } from '../../services/flota-empresa.service';
import { environment } from '../../../environments/environment';

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
            <mat-icon>print</mat-icon>
          </div>
          <div>
            <div class="header-tag-row">
              <span class="header-badge">PLANTILLA OFICIAL DRTC</span>
              <span class="header-sub-badge" matTooltip="Plantilla designada en el Calibrador">
                <mat-icon style="font-size: 11px; width: 11px; height: 11px;">tune</mat-icon>
                {{ plantillaActivaNombre() }}
              </span>
              @if (hayModificaciones()) {
                <span class="header-edit-badge" matTooltip="Hay campos modificados para esta impresión">
                  <mat-icon style="font-size: 11px; width: 11px; height: 11px;">edit</mat-icon>
                  {{ camposModificadosCount() }} editados
                </span>
              }
            </div>
            <h2 class="modal-title">Emisión e Impresión de TUC</h2>
            <p class="modal-subtitle">
              Placa: <strong>{{ datosEditados()['placa'] || data.vehiculo.placa }}</strong> &bull; 
              TUC: <strong>{{ datosEditados()['numero_tuc'] || data.vehiculo.numero_tuc || 'S/N' }}</strong> &bull; 
              {{ datosEditados()['empresa'] || data.vehiculo.razon_social }}
            </p>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" class="btn-close" matTooltip="Cerrar ventana">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- BODY -->
      <div class="modal-body">
        @if (isLoading()) {
          <div class="loading-state">
            <mat-spinner diameter="42"></mat-spinner>
            <span>Cargando datos técnicos y configuración del calibrador...</span>
          </div>
        } @else {
          <div class="main-layout">
            
            <!-- PANEL IZQUIERDO: VISTA PREVIA DE LA TARJETA TUC (FORMA FÍSICA Y POSICIONES OFICIALES) -->
            <!-- PANEL IZQUIERDO: VISTA PREVIA EXACTA DE TUC STUDIO -->
            <div class="card-preview-container">
              <div class="preview-header">
                <div class="preview-header-left">
                  <mat-icon style="color: #0284c7; font-size: 17px; width: 17px; height: 17px;">verified</mat-icon>
                  <span class="preview-tag-title">MUESTRA EXACTA DE IMPRESIÓN</span>
                  <span class="badge-plantilla" matTooltip="Plantilla milimétrica activa en el sistema">
                    {{ plantillaActivaNombre() }}
                  </span>
                  @if (hayModificaciones()) {
                    <span class="badge-custom-active" matTooltip="La muestra refleja tus datos editados en vivo">
                      ✓ {{ camposModificadosCount() }} editados
                    </span>
                  }
                </div>

                <!-- SELECTOR DE CARA Y CONTROLES DE ZOOM -->
                <div class="preview-header-controls">
                  <div class="cara-selector-group">
                    <button type="button" class="cara-btn" [class.active]="vistaTarjetaModo() === 'anverso'" (click)="vistaTarjetaModo.set('anverso')">Anverso</button>
                    <button type="button" class="cara-btn" [class.active]="vistaTarjetaModo() === 'reverso'" (click)="vistaTarjetaModo.set('reverso')">Reverso</button>
                    <button type="button" class="cara-btn" [class.active]="vistaTarjetaModo() === 'dual'" (click)="vistaTarjetaModo.set('dual')">Ambas</button>
                  </div>

                  <button type="button" class="ctrl-btn" (click)="cambiarZoomPreview(-10)" matTooltip="Alejar zoom">
                    <mat-icon>zoom_out</mat-icon>
                  </button>
                  <span class="zoom-value">{{ zoomPreview() }}%</span>
                  <button type="button" class="ctrl-btn" (click)="cambiarZoomPreview(10)" matTooltip="Acercar zoom">
                    <mat-icon>zoom_in</mat-icon>
                  </button>
                  <button type="button" class="ctrl-btn" (click)="resetZoomPreview()" matTooltip="Restablecer tamaño">
                    <mat-icon>fit_screen</mat-icon>
                  </button>
                  <button type="button" class="ctrl-btn btn-open-external" (click)="abrirCalibradorStudio()" matTooltip="Abrir en TUC Studio">
                    <mat-icon>tune</mat-icon>
                  </button>
                </div>
              </div>

              <!-- VIEWPORT DEL LIENZO EXACTO DE TUC STUDIO -->
              <div class="tuc-canvas-viewport">
                <div class="canvas-scale-wrapper" [style.transform]="'scale(' + (zoomPreview() / 100) + ')'">

                  @if (vistaTarjetaModo() === 'dual') {
                    <div class="sheets-dual-layout">
                      <!-- HOJA 1: ANVERSO -->
                      <div class="sheet-page-wrapper">
                        <div class="sheet-page-header-tag">
                          <mat-icon>file_copy</mat-icon>
                          <span>PÁGINA 1: ANVERSO</span>
                        </div>
                        <div class="tuc-card-sheet"
                             [class.format-dual-pvc]="formatoPapel() === 'DUAL_PVC'"
                             [class.format-a4-portrait]="formatoPapel() === 'A4' && orientacion() === 'portrait'"
                             [class.format-a4-landscape]="formatoPapel() === 'A4' && orientacion() === 'landscape'">
                          
                          @for (v of varsAnverso(); track v.id) {
                            @if (v.visible) {
                              <div class="positioned-var"
                                   [class.is-graphic]="v.tipo === 'imagen' || v.tipo === 'qr' || v.tipo === 'linea'"
                                   [class.has-two-lines]="v.max_lineas === 2"
                                   [class.has-multiline]="v.max_lineas === 0"
                                   [class.is-vertical]="v.orientacion_texto === 'vertical' || v.rotacion === 90"
                                   [class.is-vertical-270]="v.orientacion_texto === 'vertical_270' || v.rotacion === 270"
                                   [style.left.mm]="v.x_mm"
                                   [style.top.mm]="v.y_mm"
                                   [style.width.mm]="v.width_mm"
                                   [style.height.mm]="v.height_mm"
                                   [style.fontSize.pt]="v.font_size_pt"
                                   [style.color]="v.color"
                                   [style.textAlign]="v.align">
                                @if (v.tipo === 'imagen') {
                                  <img [src]="v.imagen_url" [alt]="v.label" [style.width.mm]="v.width_mm || 18" [style.height.mm]="v.height_mm || 15" [style.opacity]="v.opacidad ?? 1.0" class="canvas-img" />
                                } @else if (v.tipo === 'qr') {
                                  <img [src]="obtenerQrPreviewUrl(v)" [alt]="v.label" [style.width.mm]="v.width_mm || 14" [style.height.mm]="v.height_mm || 14" class="canvas-qr" />
                                } @else if (v.tipo === 'linea') {
                                  <div class="canvas-line-element"
                                       [style.width.mm]="v.width_mm || 50"
                                       [style.borderTopWidth.mm]="v.grosor_mm || v.height_mm || 1"
                                       [style.borderTopStyle]="v.estilo_linea || 'solid'"
                                       [style.borderTopColor]="v.color || '#000000'">
                                  </div>
                                } @else if (v.tag === '{{TABLA_RUTAS}}') {
                                  <div class="rutas-table-render">
                                    @if (rutasList().length > 0) {
                                      @for (r of rutasList(); track $index) {
                                        <div class="ruta-row">{{ r }}</div>
                                      }
                                    } @else {
                                      <div class="r-empty">Ruta 01: JULIACA - PUTINA - ANANEA - LA RINCONADA</div>
                                    }
                                  </div>
                                } @else {
                                  <div class="var-rendered-content"
                                       [class.clamp-2-lines]="v.max_lineas === 2"
                                       [class.multiline-free]="v.max_lineas === 0"
                                       [innerHTML]="obtenerHtmlRender(v)"></div>
                                }
                              </div>
                            }
                          }
                        </div>
                      </div>

                      <!-- HOJA 2: REVERSO -->
                      <div class="sheet-page-wrapper">
                        <div class="sheet-page-header-tag reverso-tag">
                          <mat-icon>find_in_page</mat-icon>
                          <span>PÁGINA 2: REVERSO</span>
                        </div>
                        <div class="tuc-card-sheet"
                             [class.format-dual-pvc]="formatoPapel() === 'DUAL_PVC'"
                             [class.format-a4-portrait]="formatoPapel() === 'A4' && orientacion() === 'portrait'"
                             [class.format-a4-landscape]="formatoPapel() === 'A4' && orientacion() === 'landscape'">
                          
                          @for (v of varsReverso(); track v.id) {
                            @if (v.visible) {
                              <div class="positioned-var"
                                   [class.is-graphic]="v.tipo === 'imagen' || v.tipo === 'qr' || v.tipo === 'linea'"
                                   [class.has-two-lines]="v.max_lineas === 2"
                                   [class.has-multiline]="v.max_lineas === 0"
                                   [class.is-vertical]="v.orientacion_texto === 'vertical' || v.rotacion === 90"
                                   [class.is-vertical-270]="v.orientacion_texto === 'vertical_270' || v.rotacion === 270"
                                   [style.left.mm]="v.x_mm"
                                   [style.top.mm]="v.y_mm"
                                   [style.width.mm]="v.width_mm"
                                   [style.height.mm]="v.height_mm"
                                   [style.fontSize.pt]="v.font_size_pt"
                                   [style.color]="v.color"
                                   [style.textAlign]="v.align">
                                @if (v.tipo === 'imagen') {
                                  <img [src]="v.imagen_url" [alt]="v.label" [style.width.mm]="v.width_mm || 18" [style.height.mm]="v.height_mm || 15" [style.opacity]="v.opacidad ?? 1.0" class="canvas-img" />
                                } @else if (v.tipo === 'qr') {
                                  <img [src]="obtenerQrPreviewUrl(v)" [alt]="v.label" [style.width.mm]="v.width_mm || 14" [style.height.mm]="v.height_mm || 14" class="canvas-qr" />
                                } @else if (v.tipo === 'linea') {
                                  <div class="canvas-line-element"
                                       [style.width.mm]="v.width_mm || 50"
                                       [style.borderTopWidth.mm]="v.grosor_mm || v.height_mm || 1"
                                       [style.borderTopStyle]="v.estilo_linea || 'solid'"
                                       [style.borderTopColor]="v.color || '#000000'">
                                  </div>
                                } @else if (v.tag === '{{TABLA_RUTAS}}') {
                                  <div class="rutas-table-render">
                                    @if (rutasList().length > 0) {
                                      @for (r of rutasList(); track $index) {
                                        <div class="ruta-row">{{ r }}</div>
                                      }
                                    } @else {
                                      <div class="r-empty">Ruta 01: JULIACA - PUTINA - ANANEA - LA RINCONADA</div>
                                    }
                                  </div>
                                } @else {
                                  <div class="var-rendered-content"
                                       [class.clamp-2-lines]="v.max_lineas === 2"
                                       [class.multiline-free]="v.max_lineas === 0"
                                       [innerHTML]="obtenerHtmlRender(v)"></div>
                                }
                              </div>
                            }
                          }
                        </div>
                      </div>
                    </div>
                  } @else {
                    <!-- MODO PÁGINA INDIVIDUAL (ANVERSO O REVERSO) -->
                    <div class="sheet-page-wrapper">
                      <div class="sheet-page-header-tag" [class.reverso-tag]="vistaTarjetaModo() === 'reverso'">
                        <mat-icon>{{ vistaTarjetaModo() === 'reverso' ? 'find_in_page' : 'file_copy' }}</mat-icon>
                        <span>{{ vistaTarjetaModo() === 'reverso' ? 'PÁGINA 2: REVERSO' : 'PÁGINA 1: ANVERSO' }}</span>
                      </div>
                      <div class="tuc-card-sheet"
                           [class.format-dual-pvc]="formatoPapel() === 'DUAL_PVC'"
                           [class.format-a4-portrait]="formatoPapel() === 'A4' && orientacion() === 'portrait'"
                           [class.format-a4-landscape]="formatoPapel() === 'A4' && orientacion() === 'landscape'">
                        
                        @for (v of (vistaTarjetaModo() === 'reverso' ? varsReverso() : varsAnverso()); track v.id) {
                          @if (v.visible) {
                            <div class="positioned-var"
                                 [class.is-graphic]="v.tipo === 'imagen' || v.tipo === 'qr' || v.tipo === 'linea'"
                                 [class.has-two-lines]="v.max_lineas === 2"
                                 [class.has-multiline]="v.max_lineas === 0"
                                 [class.is-vertical]="v.orientacion_texto === 'vertical' || v.rotacion === 90"
                                 [class.is-vertical-270]="v.orientacion_texto === 'vertical_270' || v.rotacion === 270"
                                 [style.left.mm]="v.x_mm"
                                 [style.top.mm]="v.y_mm"
                                 [style.width.mm]="v.width_mm"
                                 [style.height.mm]="v.height_mm"
                                 [style.fontSize.pt]="v.font_size_pt"
                                 [style.color]="v.color"
                                 [style.textAlign]="v.align">
                              @if (v.tipo === 'imagen') {
                                <img [src]="v.imagen_url" [alt]="v.label" [style.width.mm]="v.width_mm || 18" [style.height.mm]="v.height_mm || 15" [style.opacity]="v.opacidad ?? 1.0" class="canvas-img" />
                              } @else if (v.tipo === 'qr') {
                                <img [src]="obtenerQrPreviewUrl(v)" [alt]="v.label" [style.width.mm]="v.width_mm || 14" [style.height.mm]="v.height_mm || 14" class="canvas-qr" />
                              } @else if (v.tipo === 'linea') {
                                <div class="canvas-line-element"
                                     [style.width.mm]="v.width_mm || 50"
                                     [style.borderTopWidth.mm]="v.grosor_mm || v.height_mm || 1"
                                     [style.borderTopStyle]="v.estilo_linea || 'solid'"
                                     [style.borderTopColor]="v.color || '#000000'">
                                </div>
                              } @else if (v.tag === '{{TABLA_RUTAS}}') {
                                <div class="rutas-table-render">
                                  @if (rutasList().length > 0) {
                                    @for (r of rutasList(); track $index) {
                                      <div class="ruta-row">{{ r }}</div>
                                    }
                                  } @else {
                                    <div class="r-empty">Ruta 01: JULIACA - PUTINA - ANANEA - LA RINCONADA</div>
                                  }
                                </div>
                              } @else {
                                <div class="var-rendered-content"
                                     [class.clamp-2-lines]="v.max_lineas === 2"
                                     [class.multiline-free]="v.max_lineas === 0"
                                     [innerHTML]="obtenerHtmlRender(v)"></div>
                              }
                            </div>
                          }
                        }
                      </div>
                    </div>
                  }

                </div>
              </div>
            </div>

            <!-- PANEL DERECHO: TABS DE EMISIÓN VS EDICIÓN DE CAMPOS -->
            <div class="actions-panel">
              
              <!-- TABS PRINCIPALES (50% / 50% GARANTIZADOS) -->
              <div class="panel-tabs-bar">
                <button type="button" 
                        class="panel-tab-btn" 
                        [class.active]="tabActiva() === 'emision'" 
                        (click)="tabActiva.set('emision')">
                  <mat-icon>print</mat-icon>
                  <span>Emisión e Impresión</span>
                </button>
                <button type="button" 
                        class="panel-tab-btn btn-tab-edit" 
                        [class.active]="tabActiva() === 'edicion'" 
                        (click)="tabActiva.set('edicion')">
                  <mat-icon>edit_note</mat-icon>
                  <span>Editar Campos TUC</span>
                  @if (hayModificaciones()) {
                    <span class="tab-badge-count">{{ camposModificadosCount() }}</span>
                  }
                </button>
              </div>

              <!-- VISTA 1: OPCIONES DE EMISIÓN RÁPIDA -->
              @if (tabActiva() === 'emision') {
                
                <!-- BANNER INFORMATIVO SI HAY CAMPOS EDITADOS -->
                @if (hayModificaciones()) {
                  <div class="modificaciones-banner">
                    <div class="mb-info">
                      <mat-icon>mode_edit</mat-icon>
                      <span><strong>{{ camposModificadosCount() }}</strong> campos editados listos para imprimir</span>
                    </div>
                    <div class="mb-buttons">
                      <button type="button" class="btn-mb-edit" (click)="tabActiva.set('edicion')">
                        <mat-icon>tune</mat-icon> Modificar
                      </button>
                      <button type="button" class="btn-mb-reset" (click)="restablecerValoresOriginales()" matTooltip="Restablecer datos originales de la BD">
                        <mat-icon>restart_alt</mat-icon>
                      </button>
                    </div>
                  </div>
                }

                <!-- SECCIÓN 1: IMPRESIÓN DIRECTA / TARJETA FÍSICA -->
                <div class="compact-card card-tuc">
                  <div class="card-top">
                    <div class="card-title-group">
                      <div class="card-icon-badge tuc-badge">
                        <mat-icon>print</mat-icon>
                      </div>
                      <div>
                        <h4 class="card-h">Tarjeta TUC Oficial</h4>
                        <span class="card-sub">Formato {{ configCalibrador()?.formato_papel || 'Calibrado' }} {{ hayModificaciones() ? '(Datos Editados)' : '' }}</span>
                      </div>
                    </div>
                    <span class="pill-status pill-ready">{{ hayModificaciones() ? 'Edición Activa' : 'Diseño Calibrador' }}</span>
                  </div>

                  <div class="card-action-row">
                    <button mat-flat-button class="btn-primary-action" (click)="imprimirTarjeta()" matTooltip="Imprime directamente la tarjeta TUC con el diseño y datos actuales">
                      <mat-icon>print</mat-icon>
                      <span>Imprimir Tarjeta Ahora</span>
                    </button>
                  </div>
                  <div class="card-secondary-row">
                    <button mat-stroked-button class="btn-secondary-action" (click)="imprimirHtmlInstantaneo()" matTooltip="Impresión HTML ultra rápida instantánea (<0.05s) en nueva ventana">
                      <mat-icon>bolt</mat-icon>
                      <span>Impresión Rápida (0.05s)</span>
                    </button>
                    <button mat-stroked-button class="btn-secondary-action btn-studio" (click)="abrirCalibradorStudio()" matTooltip="Abrir TUC Studio para calibrar milimétricamente las variables">
                      <mat-icon>tune</mat-icon>
                      <span>Calibrador Studio</span>
                    </button>
                  </div>
                </div>

                <!-- SECCIÓN 2: CÉDULA DE NOTIFICACIÓN DE RESOLUCIÓN -->
                <div class="compact-card card-notif">
                  <div class="card-top">
                    <div class="card-title-group">
                      <div class="card-icon-badge notif-badge">
                        <mat-icon>assignment</mat-icon>
                      </div>
                      <div>
                        <h4 class="card-h">Cédula de Notificación</h4>
                        <span class="card-sub">Documento oficial de resolución</span>
                      </div>
                    </div>
                    <span class="pill-status pill-doc">Hoja A4</span>
                  </div>

                  <div class="card-secondary-row">
                    <button mat-flat-button class="btn-notif-print" (click)="abrirNotificacionImpresion()" matTooltip="Abre la Cédula de Notificación oficial en A4 lista para imprimir (Ctrl+P)">
                      <mat-icon>open_in_new</mat-icon>
                      <span>Imprimir Notificación (Ctrl+P)</span>
                    </button>
                    <button mat-stroked-button class="btn-secondary-action" (click)="generarNotificacionGoogleDocs()" [disabled]="isGeneratingNotifDocs()" matTooltip="Generar copia de la Cédula de Notificación en Google Docs">
                      @if (isGeneratingNotifDocs()) {
                        <mat-spinner diameter="14" class="inline-spinner"></mat-spinner>
                        <span>Generando...</span>
                      } @else {
                        <mat-icon>cloud</mat-icon>
                        <span>Google Docs</span>
                      }
                    </button>
                  </div>
                </div>

                <!-- SECCIÓN 3: ARCHIVOS Y NUBE -->
                <div class="compact-card card-files">
                  <div class="card-top">
                    <div class="card-title-group">
                      <div class="card-icon-badge files-badge">
                        <mat-icon>folder_zip</mat-icon>
                      </div>
                      <div>
                        <h4 class="card-h">Formatos y Nube</h4>
                        <span class="card-sub">Descarga Word y sincronización</span>
                      </div>
                    </div>
                    <span class="pill-status" [class.pill-connected]="googleStatus()?.disponible" [class.pill-offline]="!googleStatus()?.disponible">
                      {{ googleStatus()?.disponible ? 'Drive Conectado' : 'Drive Standby' }}
                    </span>
                  </div>

                  <div class="card-secondary-row">
                    <button mat-stroked-button class="btn-secondary-action" (click)="descargarDocx()" [disabled]="isGeneratingDocx()" matTooltip="Descargar plantilla oficial en Word (.docx) con los datos actuales">
                      @if (isGeneratingDocx()) {
                        <mat-spinner diameter="14" class="inline-spinner"></mat-spinner>
                        <span>Word...</span>
                      } @else {
                        <mat-icon>description</mat-icon>
                        <span>Word (.docx)</span>
                      }
                    </button>

                    <button mat-stroked-button class="btn-secondary-action" (click)="generarGoogleDocs()" [disabled]="!googleStatus()?.disponible || isGeneratingGoogle()" matTooltip="Crear copia editable en Google Docs / Google Drive">
                      @if (isGeneratingGoogle()) {
                        <mat-spinner diameter="14" class="inline-spinner"></mat-spinner>
                        <span>Creando...</span>
                      } @else {
                        <mat-icon>cloud_upload</mat-icon>
                        <span>Google Docs</span>
                      }
                    </button>

                    <button mat-stroked-button class="btn-secondary-action btn-compact-cfg" (click)="toggleConfigPlantilla()" matTooltip="Ajustar ID de plantilla y ancho de columnas">
                      <mat-icon>settings</mat-icon>
                      <span>Ajustes</span>
                    </button>
                  </div>

                  @if (data.vehiculo.link_tuc) {
                    <div class="link-tuc-pill">
                      <mat-icon>link</mat-icon>
                      <a [href]="data.vehiculo.link_tuc" target="_blank">Ver TUC en Google Drive</a>
                    </div>
                  }

                  <!-- PANEL CONFIGURACIÓN DINÁMICA DE PLANTILLA (COLAPSABLE) -->
                  @if (mostrarConfigPlantilla()) {
                    <div class="config-plantilla-box">
                      <div class="cfg-header">
                        <h5>Ajustes de Plantilla Google Docs</h5>
                      </div>
                      <div class="cfg-field-group">
                        <div class="cfg-id-row">
                          <input type="text" [ngModel]="configPlantilla().plantilla_id" (ngModelChange)="actualizarCampoConfig('plantilla_id', $event)" class="cfg-input input-id" placeholder="ID del documento..." />
                          <button mat-stroked-button class="btn-save-cfg" (click)="guardarConfiguracion()" [disabled]="isSavingConfig()">
                            <mat-icon style="font-size:14px;width:14px;height:14px;">save</mat-icon> Guardar
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <!-- BOTÓN RÁPIDO PARA IR A EDITAR CAMPOS -->
                <button type="button" class="btn-go-to-edit" (click)="tabActiva.set('edicion')">
                  <mat-icon>edit_note</mat-icon>
                  <span>¿Deseas corregir datos antes de imprimir? <strong>Editar Campos de la TUC →</strong></span>
                </button>

              } @else {
                
                <!-- VISTA 2: FORMULARIO DE EDICIÓN DINÁMICA DE TODOS LOS CAMPOS DE LA TUC -->
                <div class="editor-container">
                  <div class="editor-header">
                    <div>
                      <h4 class="editor-title">Editor de Campos de la TUC</h4>
                      <p class="editor-subtitle">Modifica cualquier variable antes de imprimir. La muestra se actualizará automáticamente.</p>
                    </div>
                    <div class="editor-top-actions">
                      <button type="button" class="btn-reset-edits" (click)="restablecerValoresOriginales()" [disabled]="!hayModificaciones()" matTooltip="Deshacer cambios y restaurar datos de la BD">
                        <mat-icon>restart_alt</mat-icon> Restablecer
                      </button>
                      <button type="button" class="btn-apply-edits" (click)="aplicarEdicionAPreview()" [disabled]="isUpdatingPreview()" matTooltip="Refrescar la tarjeta en vivo con estos cambios">
                        <mat-icon>refresh</mat-icon> Actualizar Muestra
                      </button>
                    </div>
                  </div>

                  <div class="editor-scroll-area">
                    
                    <!-- GRUPO 1: AUTORIZACIÓN Y RESOLUCIÓN -->
                    <div class="edit-group">
                      <div class="group-title">
                        <mat-icon>event_available</mat-icon>
                        <span>1. Autorización y Vigencia</span>
                      </div>
                      <div class="fields-grid grid-2">
                        <div class="field-item">
                          <label>Vigencia DEL:</label>
                          <input id="input-edit-fecha_del" type="text" [ngModel]="datosEditados()['fecha_del']" (ngModelChange)="actualizarCampo('fecha_del', $event)" placeholder="Ej. 29/09/2026" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Vigencia AL:</label>
                          <input id="input-edit-fecha_al" type="text" [ngModel]="datosEditados()['fecha_al']" (ngModelChange)="actualizarCampo('fecha_al', $event)" placeholder="Ej. 29/09/2030" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>R.D.R. Primigenia (N°):</label>
                          <input id="input-edit-nro_resolucion_primigenia" type="text" [ngModel]="datosEditados()['nro_resolucion_primigenia']" (ngModelChange)="actualizarCampo('nro_resolucion_primigenia', $event)" placeholder="Ej. 0701-2026" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Fecha R.D.R.:</label>
                          <input id="input-edit-fecha_resolucion_primigenia" type="text" [ngModel]="datosEditados()['fecha_resolucion_primigenia']" (ngModelChange)="actualizarCampo('fecha_resolucion_primigenia', $event)" placeholder="Ej. 29/09/2026" class="edit-input" />
                        </div>
                      </div>
                    </div>

                    <!-- GRUPO 2: EMPRESA Y REGISTRO -->
                    <div class="edit-group">
                      <div class="group-title">
                        <mat-icon>business</mat-icon>
                        <span>2. Empresa y Datos Registrales</span>
                      </div>
                      <div class="fields-grid grid-1">
                        <div class="field-item">
                          <label>Empresa (Razón Social):</label>
                          <input id="input-edit-empresa" type="text" [ngModel]="datosEditados()['empresa']" (ngModelChange)="actualizarCampo('empresa', $event)" placeholder="Nombre o Razón Social oficial" class="edit-input font-bold" />
                        </div>
                      </div>
                      <div class="fields-grid grid-2" style="margin-top: 6px;">
                        <div class="field-item">
                          <label>RUC :</label>
                          <input id="input-edit-ruc" type="text" [ngModel]="datosEditados()['ruc']" (ngModelChange)="actualizarCampo('ruc', $event)" placeholder="11 dígitos" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Partida Registral:</label>
                          <input id="input-edit-partida" type="text" [ngModel]="datosEditados()['partida']" (ngModelChange)="actualizarCampo('partida', $event)" placeholder="Partida registral" class="edit-input" />
                        </div>
                      </div>
                    </div>

                    <!-- GRUPO 3: DATOS TÉCNICOS DEL VEHÍCULO -->
                    <div class="edit-group">
                      <div class="group-title">
                        <mat-icon>directions_bus</mat-icon>
                        <span>3. Datos Técnicos del Vehículo</span>
                      </div>
                      <div class="fields-grid grid-2">
                        <div class="field-item">
                          <label>Placa :</label>
                          <input id="input-edit-placa" type="text" [ngModel]="datosEditados()['placa']" (ngModelChange)="actualizarCampo('placa', $event)" placeholder="Ej. C4X-964" class="edit-input font-mono font-bold text-primary" />
                        </div>
                        <div class="field-item">
                          <label>Número TUC :</label>
                          <input id="input-edit-numero_tuc" type="text" [ngModel]="datosEditados()['numero_tuc']" (ngModelChange)="actualizarCampo('numero_tuc', $event)" placeholder="Ej. T-012299" class="edit-input font-mono font-bold" />
                        </div>
                        <div class="field-item">
                          <label>Marca:</label>
                          <input id="input-edit-marca" type="text" [ngModel]="datosEditados()['marca']" (ngModelChange)="actualizarCampo('marca', $event)" placeholder="Ej. VOLVO / MERCEDES" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Modelo:</label>
                          <input id="input-edit-modelo" type="text" [ngModel]="datosEditados()['modelo']" (ngModelChange)="actualizarCampo('modelo', $event)" placeholder="Modelo del vehículo" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Color :</label>
                          <input id="input-edit-color" type="text" [ngModel]="datosEditados()['color']" (ngModelChange)="actualizarCampo('color', $event)" placeholder="Ej. BLANCO AZUL" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Categoría :</label>
                          <input id="input-edit-categoria" type="text" [ngModel]="datosEditados()['categoria']" (ngModelChange)="actualizarCampo('categoria', $event)" placeholder="M2 / M3 / M3-C3" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Año (Fab./Mod.):</label>
                          <input id="input-edit-anio" type="text" [ngModel]="datosEditados()['anio']" (ngModelChange)="actualizarCampo('anio', $event)" placeholder="Ej. 2018" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>VIN / Serie / Chasis:</label>
                          <input id="input-edit-vin" type="text" [ngModel]="datosEditados()['vin']" (ngModelChange)="actualizarCampo('vin', $event)" placeholder="Número de serie o VIN" class="edit-input font-mono" />
                        </div>
                        <div class="field-item">
                          <label>Asientos :</label>
                          <input id="input-edit-asientos" type="text" [ngModel]="datosEditados()['asientos']" (ngModelChange)="actualizarCampo('asientos', $event)" placeholder="Ej. 30" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Ejes :</label>
                          <input id="input-edit-ejes" type="text" [ngModel]="datosEditados()['ejes']" (ngModelChange)="actualizarCampo('ejes', $event)" placeholder="Ej. 2" class="edit-input" />
                        </div>
                      </div>

                      <div class="sub-divider">Dimensiones y Pesos (Metros / Toneladas)</div>
                      <div class="fields-grid grid-3">
                        <div class="field-item">
                          <label>Alto (m):</label>
                          <input id="input-edit-alto" type="text" [ngModel]="datosEditados()['alto']" (ngModelChange)="actualizarCampo('alto', $event)" placeholder="Ej. 3.45" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Ancho (m):</label>
                          <input id="input-edit-ancho" type="text" [ngModel]="datosEditados()['ancho']" (ngModelChange)="actualizarCampo('ancho', $event)" placeholder="Ej. 2.50" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Largo (m):</label>
                          <input id="input-edit-largo" type="text" [ngModel]="datosEditados()['largo']" (ngModelChange)="actualizarCampo('largo', $event)" placeholder="Ej. 10.85" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Peso Neto (t):</label>
                          <input id="input-edit-peso_neto" type="text" [ngModel]="datosEditados()['peso_neto']" (ngModelChange)="actualizarCampo('peso_neto', $event)" placeholder="Ej. 8.5" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Carga Útil (t):</label>
                          <input id="input-edit-carga_util" type="text" [ngModel]="datosEditados()['carga_util']" (ngModelChange)="actualizarCampo('carga_util', $event)" placeholder="Ej. 3.0" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Peso Bruto (t):</label>
                          <input id="input-edit-peso_bruto" type="text" [ngModel]="datosEditados()['peso_bruto']" (ngModelChange)="actualizarCampo('peso_bruto', $event)" placeholder="Ej. 11.5" class="edit-input" />
                        </div>
                      </div>
                    </div>

                    <!-- GRUPO 4: RUTAS AUTORIZADAS -->
                    <div class="edit-group">
                      <div class="group-title">
                        <mat-icon>alt_route</mat-icon>
                        <span>4. Rutas Autorizadas (Texto / Tramos)</span>
                      </div>
                      <div class="field-item">
                        <label>Líneas de rutas autorizadas (un renglón por cada ruta):</label>
                        <textarea id="input-edit-tabla_rutas_text" 
                                  [ngModel]="datosEditados()['tabla_rutas_text']" 
                                  (ngModelChange)="actualizarCampo('tabla_rutas_text', $event)" 
                                  rows="3" 
                                  class="edit-textarea" 
                                  placeholder="Ej: Ruta 01: JULIACA - MACUSANI - SAN GABAN (05 DIARIAS)&#10;Ruta 02: JULIACA - MACUSANI (02 DIARIAS)"></textarea>
                      </div>
                    </div>

                    <!-- GRUPO 5: ACTO RESOLUTIVO REVERSO -->
                    <div class="edit-group">
                      <div class="group-title">
                        <mat-icon>verified_user</mat-icon>
                        <span>5. Acto Resolutivo en Reverso (Opcional)</span>
                      </div>
                      <div class="fields-grid grid-3">
                        <div class="field-item">
                          <label>N° Resolución Acto:</label>
                          <input id="input-edit-num_resolucion_acto" type="text" [ngModel]="datosEditados()['num_resolucion_acto']" (ngModelChange)="actualizarCampo('num_resolucion_acto', $event)" placeholder="Ej. 0850-2026" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Fecha Acto:</label>
                          <input id="input-edit-fecha_resolucion_acto" type="text" [ngModel]="datosEditados()['fecha_resolucion_acto']" (ngModelChange)="actualizarCampo('fecha_resolucion_acto', $event)" placeholder="Ej. 29/09/2026" class="edit-input" />
                        </div>
                        <div class="field-item">
                          <label>Tipo (I / S / R):</label>
                          <input id="input-edit-tipo_resolucion_acto" type="text" [ngModel]="datosEditados()['tipo_resolucion_acto']" (ngModelChange)="actualizarCampo('tipo_resolucion_acto', $event)" placeholder="Ej. I / S" class="edit-input" />
                        </div>
                      </div>
                    </div>

                  </div>

                  <!-- BOTONES DE ACCIÓN DEL EDITOR -->
                  <div class="editor-footer-actions">
                    <button mat-stroked-button class="btn-cancel-edit" (click)="tabActiva.set('emision')">
                      <mat-icon>arrow_back</mat-icon> Volver a Emisión
                    </button>
                    <button mat-stroked-button class="btn-update-sample" (click)="aplicarEdicionAPreview()" [disabled]="isUpdatingPreview()">
                      <mat-icon>check_circle</mat-icon> Aplicar a Muestra
                    </button>
                    <button mat-flat-button class="btn-print-from-edit" (click)="imprimirDesdeEditor()">
                      <mat-icon>print</mat-icon> Imprimir Tarjeta con estos Datos
                    </button>
                  </div>
                </div>

              }

            </div>

          </div>
        }
      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <button mat-button class="btn-close-footer" (click)="cerrar()">
          <mat-icon>close</mat-icon>
          <span>Cerrar</span>
        </button>
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
      max-height: 94vh;
    }

    .modal-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .header-icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          mat-icon { color: #ffffff; font-size: 22px; width: 22px; height: 22px; }
          box-shadow: 0 4px 10px rgba(2, 132, 199, 0.35);
        }

        .header-tag-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }

        .header-badge {
          font-size: 10px;
          font-weight: 700;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.15);
          padding: 1px 6px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }

        .header-sub-badge {
          font-size: 10.5px;
          font-weight: 500;
          color: #cbd5e1;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .header-edit-badge {
          font-size: 10px;
          font-weight: 700;
          color: #fbbf24;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 1px 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .modal-title { margin: 0; font-size: 15px; font-weight: 800; color: #ffffff; }
        .modal-subtitle { margin: 2px 0 0; font-size: 12px; color: #94a3b8; }
      }

      .btn-close { color: #94a3b8; &:hover { color: #ffffff; background: rgba(255, 255, 255, 0.08); } }
    }

    .modal-body {
      padding: 14px 18px;
      overflow-y: auto;
      max-height: calc(94vh - 105px);
      background: #f8fafc;
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
      grid-template-columns: minmax(460px, 1.05fr) minmax(440px, 0.95fr);
      gap: 18px;
      align-items: start;

      @media (max-width: 980px) {
        grid-template-columns: 1fr;
      }
    }

    /* PREVIEW CONTAINER CALIBRADO (LO QUE SALE EN IMPRESORA) */
    .card-preview-container {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #ffffff;
        padding: 7px 12px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;

        .preview-header-left {
          display: flex;
          align-items: center;
          gap: 8px;

          .preview-tag-title {
            font-size: 11px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.3px;
          }

          .badge-plantilla {
            font-size: 10px;
            font-weight: 600;
            color: #0284c7;
            background: #e0f2fe;
            border: 1px solid #bae6fd;
            padding: 1px 6px;
            border-radius: 4px;
            max-width: 170px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .badge-custom-active {
            background: #fef3c7;
            color: #b45309;
            border: 1px solid #fde68a;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
          }
        }

        .preview-header-controls {
          display: flex;
          align-items: center;
          gap: 6px;

          .cara-selector-group {
            display: inline-flex;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 2px;
            gap: 2px;

            .cara-btn {
              padding: 3px 8px;
              font-size: 11px;
              font-weight: 600;
              border: none;
              background: transparent;
              color: #475569;
              border-radius: 4px;
              cursor: pointer;
              transition: all 0.15s ease;

              &:hover {
                color: #0f172a;
              }

              &.active {
                background: #0284c7;
                color: #ffffff;
                box-shadow: 0 1px 3px rgba(2, 132, 199, 0.3);
              }
            }
          }

          .ctrl-btn {
            width: 27px;
            height: 27px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            border-radius: 4px;
            cursor: pointer;
            color: #475569;
            transition: all 0.15s;
            mat-icon { font-size: 15px; width: 15px; height: 15px; }
            &:hover { background: #f1f5f9; color: #0284c7; border-color: #cbd5e1; }

            &.btn-open-external {
              color: #0284c7;
              &:hover { background: #e0f2fe; border-color: #0284c7; }
            }
          }

          .zoom-value {
            font-size: 10.5px;
            font-weight: 700;
            color: #334155;
            padding: 0 4px;
            min-width: 34px;
            text-align: center;
            font-family: monospace;
          }
        }
      }

      /* VIEWPORT NATIVO DE TUC STUDIO */
      .tuc-canvas-viewport {
        position: relative;
        height: 600px;
        background: #94a3b8;
        background-image: 
          linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px);
        background-size: 20px 20px;
        border: 1px solid #64748b;
        border-radius: 8px;
        overflow-x: auto;
        overflow-y: auto;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 24px 16px;
        box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.12);

        .canvas-scale-wrapper {
          transform-origin: top center;
          transition: transform 0.12s ease-out;
          display: flex;
          justify-content: center;
          flex-shrink: 0;
        }

        .sheets-dual-layout {
          display: flex;
          gap: 28px;
          justify-content: center;
          align-items: flex-start;
        }

        .sheet-page-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;

          .sheet-page-header-tag {
            background: #1e3a8a;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

            mat-icon {
              font-size: 14px;
              width: 14px;
              height: 14px;
            }

            &.reverso-tag {
              background: #0284c7;
            }
          }
        }

        .tuc-card-sheet {
          background: #ffffff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.22);
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          user-select: text;
          border: 1px solid #cbd5e1;

          &.format-a4-portrait {
            width: 210.0mm;
            height: 297.0mm;
            min-height: 297.0mm;
          }

          &.format-a4-landscape {
            width: 297.0mm;
            height: 210.0mm;
            min-height: 210.0mm;
          }

          &.format-dual-pvc {
            width: 85.6mm;
            height: 108.0mm;
            border-radius: 3.18mm;
          }

          .positioned-var {
            position: absolute;
            line-height: 1.2;
            white-space: nowrap;
            box-sizing: border-box;

            &.is-graphic {
              display: inline-block;
              line-height: 0;

              .canvas-img, .canvas-qr {
                display: block;
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                pointer-events: none;
              }
            }

            .tuc-prefix {
              display: inline;
            }

            .tuc-valor {
              display: inline;
            }

            .tuc-suffix {
              display: inline;
            }

            .tuc-quoted {
              font-weight: 800 !important;
              font-size: 1.15em !important;
              display: inline !important;
              color: inherit;
              letter-spacing: -0.2px;
            }

            &.has-two-lines,
            .var-rendered-content.clamp-2-lines {
              white-space: normal !important;
              display: -webkit-box !important;
              -webkit-line-clamp: 2 !important;
              -webkit-box-orient: vertical !important;
              overflow: hidden !important;
              word-break: break-word !important;
              line-height: 1.15 !important;
            }

            &.has-multiline,
            .var-rendered-content.multiline-free {
              white-space: normal !important;
              word-break: break-word !important;
              line-height: 1.18 !important;
            }

            &.is-vertical {
              writing-mode: vertical-rl !important;
              text-orientation: mixed !important;
              white-space: nowrap !important;
            }

            &.is-vertical-270 {
              writing-mode: vertical-rl !important;
              transform: rotate(180deg) !important;
              white-space: nowrap !important;
            }

            .canvas-line-element {
              position: relative;
              height: 0;
              pointer-events: none;
            }

            .rutas-table-render {
              font-size: 5.5pt;
              line-height: 1.25;

              .ruta-row {
                margin-bottom: 0.8mm;
                color: #000000;
              }

              .r-empty {
                color: #64748b;
              }
            }
          }
        }
      }
    }

    /* ACTIONS PANEL */
    .actions-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;

      /* TABS BAR (50% / 50% GARANTIZADOS) */
      .panel-tabs-bar {
        display: grid;
        grid-template-columns: 1fr 1fr;
        background: #e2e8f0;
        border-radius: 8px;
        padding: 4px;
        gap: 6px;

        .panel-tab-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: none;
          background: transparent;
          font-size: 12.5px;
          font-weight: 700;
          color: #475569;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          mat-icon { font-size: 17px; width: 17px; height: 17px; flex-shrink: 0; }

          &:hover { color: #0f172a; background: rgba(255, 255, 255, 0.5); }

          &.active {
            background: #ffffff;
            color: #0284c7;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          &.btn-tab-edit.active {
            color: #d97706;
          }

          .tab-badge-count {
            background: #f59e0b;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 1px 6px;
            border-radius: 10px;
            margin-left: 4px;
            flex-shrink: 0;
          }
        }
      }

      /* BANNER DE MODIFICACIONES ACTIVAS */
      .modificaciones-banner {
        background: #fef3c7;
        border: 1px solid #fde68a;
        border-radius: 8px;
        padding: 8px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;

        .mb-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: #92400e;
          mat-icon { font-size: 16px; width: 16px; height: 16px; color: #d97706; }
        }

        .mb-buttons {
          display: flex;
          align-items: center;
          gap: 4px;

          .btn-mb-edit {
            background: #f59e0b;
            color: #ffffff;
            border: none;
            border-radius: 4px;
            padding: 2px 8px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 3px;
            mat-icon { font-size: 13px; width: 13px; height: 13px; }
            &:hover { background: #d97706; }
          }

          .btn-mb-reset {
            background: transparent;
            color: #92400e;
            border: 1px solid #fcd34d;
            border-radius: 4px;
            padding: 2px 6px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            mat-icon { font-size: 14px; width: 14px; height: 14px; }
            &:hover { background: #fde68a; }
          }
        }
      }

      .compact-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 9px 12px;
        display: flex;
        flex-direction: column;
        gap: 7px;
        transition: all 0.15s ease;

        &:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        &.card-tuc { border-left: 3.5px solid #0284c7; }
        &.card-notif { border-left: 3.5px solid #0891b2; }
        &.card-files { border-left: 3.5px solid #6366f1; }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .card-title-group {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .card-icon-badge {
            width: 30px;
            height: 30px;
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            mat-icon { font-size: 17px; width: 17px; height: 17px; }

            &.tuc-badge { background: #e0f2fe; color: #0284c7; }
            &.notif-badge { background: #cffafe; color: #0891b2; }
            &.files-badge { background: #e0e7ff; color: #4f46e5; }
          }

          .card-h { margin: 0; font-size: 12.5px; font-weight: 700; color: #1e293b; }
          .card-sub { font-size: 10px; color: #64748b; display: block; margin-top: 1px; }

          .pill-status {
            font-size: 9.5px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 8px;
            white-space: nowrap;

            &.pill-ready { background: #dcfce7; color: #16a34a; }
            &.pill-doc { background: #f1f5f9; color: #475569; }
            &.pill-connected { background: #dcfce7; color: #16a34a; }
            &.pill-offline { background: #fef3c7; color: #b45309; }
          }
        }

        .card-action-row {
          display: flex;
          width: 100%;
        }

        .card-secondary-row {
          display: flex;
          gap: 6px;
          width: 100%;

          .btn-secondary-action {
            flex: 1;
            min-width: 0;
            height: 32px;
            font-size: 11px;
            font-weight: 600;
            border-color: #cbd5e1;
            color: #334155;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 0 8px;
            mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 2px; flex-shrink: 0; }
            &:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; }

            &.btn-studio {
              border-color: #93c5fd;
              color: #1d4ed8;
              &:hover { background: #eff6ff; }
            }

            &.btn-compact-cfg {
              flex: 0.75;
            }
          }
        }

        .btn-primary-action {
          width: 100%;
          height: 36px;
          font-size: 13px;
          font-weight: 700;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
          &:hover { background: linear-gradient(135deg, #0369a1 0%, #075985 100%); }
          mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 2px; }
        }

        .btn-notif-print {
          flex: 1.2;
          min-width: 0;
          height: 32px;
          font-size: 11.5px;
          font-weight: 600;
          background: #0891b2;
          color: #ffffff;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0 8px;
          mat-icon { font-size: 15px; width: 15px; height: 15px; margin-right: 2px; flex-shrink: 0; }
          &:hover { background: #0e7490; }
        }

        .link-tuc-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          background: #eff6ff;
          padding: 3px 8px;
          border-radius: 6px;
          margin-top: 2px;
          mat-icon { font-size: 14px; width: 14px; height: 14px; color: #2563eb; flex-shrink: 0; }
          a { color: #1d4ed8; text-decoration: none; font-weight: 600; &:hover { text-decoration: underline; } }
        }

        .config-plantilla-box {
          margin-top: 4px;
          padding: 6px 8px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;

          .cfg-header h5 { margin: 0; font-size: 11px; font-weight: 700; color: #1e3a8a; }

          .cfg-id-row {
            display: flex;
            gap: 6px;
            align-items: center;

            .cfg-input {
              flex: 1;
              padding: 4px 6px;
              font-size: 10.5px;
              font-family: monospace;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              &:focus { border-color: #2563eb; outline: none; }
            }

            .btn-save-cfg {
              height: 26px;
              font-size: 10.5px;
              padding: 0 8px;
              display: inline-flex;
              align-items: center;
              gap: 3px;
            }
          }
        }
      }

      .btn-go-to-edit {
        background: rgba(2, 132, 199, 0.06);
        border: 1px dashed #0284c7;
        color: #0369a1;
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.15s ease;
        mat-icon { font-size: 16px; width: 16px; height: 16px; color: #0284c7; }
        &:hover { background: rgba(2, 132, 199, 0.12); }
      }

      /* EDITOR DE CAMPOS */
      .editor-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        overflow: hidden;

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;

          .editor-title { margin: 0; font-size: 12.5px; font-weight: 800; color: #0f172a; }
          .editor-subtitle { margin: 2px 0 0; font-size: 10.5px; color: #64748b; }

          .editor-top-actions {
            display: flex;
            gap: 4px;

            .btn-reset-edits {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              color: #64748b;
              border-radius: 4px;
              padding: 3px 6px;
              font-size: 10.5px;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              gap: 3px;
              mat-icon { font-size: 13px; width: 13px; height: 13px; }
              &:hover:not(:disabled) { color: #b91c1c; border-color: #fca5a5; }
              &:disabled { opacity: 0.5; cursor: not-allowed; }
            }

            .btn-apply-edits {
              background: #0284c7;
              color: #ffffff;
              border: none;
              border-radius: 4px;
              padding: 3px 8px;
              font-size: 10.5px;
              font-weight: 600;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              gap: 3px;
              mat-icon { font-size: 13px; width: 13px; height: 13px; }
              &:hover:not(:disabled) { background: #0369a1; }
              &:disabled { opacity: 0.6; }
            }
          }
        }

        .editor-scroll-area {
          padding: 10px 12px;
          max-height: 440px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;

          .edit-group {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 10px;

            .group-title {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 11.5px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 8px;
              padding-bottom: 4px;
              border-bottom: 1px dashed #cbd5e1;
              mat-icon { font-size: 15px; width: 15px; height: 15px; color: #0284c7; }
            }

            .sub-divider {
              font-size: 10px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              margin: 8px 0 6px;
            }

            .fields-grid {
              display: grid;
              gap: 6px;

              &.grid-1 { grid-template-columns: 1fr; }
              &.grid-2 { grid-template-columns: 1fr 1fr; }
              &.grid-3 { grid-template-columns: 1fr 1fr 1fr; }

              @media (max-width: 600px) {
                grid-template-columns: 1fr !important;
              }
            }

            .field-item {
              display: flex;
              flex-direction: column;
              gap: 2px;

              label {
                font-size: 10px;
                font-weight: 600;
                color: #475569;
              }

              .edit-input {
                padding: 4px 6px;
                font-size: 11px;
                border: 1px solid #cbd5e1;
                border-radius: 4px;
                background: #ffffff;
                color: #0f172a;
                transition: border-color 0.15s;

                &:focus {
                  outline: none;
                  border-color: #0284c7;
                  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
                }

                &.font-mono { font-family: monospace; }
                &.font-bold { font-weight: 700; }
                &.text-primary { color: #0284c7; }
              }

              .edit-textarea {
                padding: 4px 6px;
                font-size: 10.5px;
                font-family: monospace;
                border: 1px solid #cbd5e1;
                border-radius: 4px;
                background: #ffffff;
                color: #0f172a;
                resize: vertical;
                line-height: 1.35;
                &:focus {
                  outline: none;
                  border-color: #0284c7;
                }
              }
            }
          }
        }

        .editor-footer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;

          .btn-cancel-edit {
            font-size: 11px;
            height: 30px;
            color: #475569;
            mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 2px; }
          }

          .btn-update-sample {
            font-size: 11px;
            height: 30px;
            color: #0284c7;
            border-color: #7dd3fc;
            mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 2px; }
            &:hover { background: #f0f9ff; }
          }

          .btn-print-from-edit {
            font-size: 11px;
            height: 30px;
            font-weight: 600;
            background: #0284c7;
            color: #ffffff;
            mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 2px; }
            &:hover { background: #0369a1; }
          }
        }
      }
    }

    .modal-footer {
      padding: 8px 18px;
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;

      .btn-close-footer {
        color: #64748b;
        font-weight: 600;
        font-size: 12px;
        mat-icon { font-size: 15px; width: 15px; height: 15px; margin-right: 4px; }
        &:hover { color: #0f172a; background: #f1f5f9; }
      }
    }

    .inline-spinner {
      margin-right: 4px;
    }
  `]
})
export class GenerarTucDialogComponent implements OnInit {
  isLoading = signal<boolean>(true);
  iframeCargando = signal<boolean>(true);
  isGeneratingDocx = signal<boolean>(false);
  isGeneratingGoogle = signal<boolean>(false);
  isGeneratingNotifDocs = signal<boolean>(false);
  isUpdatingPreview = signal<boolean>(false);

  // Pestaña en panel derecho: 'emision' | 'edicion'
  tabActiva = signal<'emision' | 'edicion'>('emision');

  // Modo de visualización de la tarjeta física: 'dual' (ambas caras) | 'anverso' | 'reverso'
  vistaTarjetaModo = signal<'dual' | 'anverso' | 'reverso'>('anverso');

  refreshKey = signal<number>(Date.now());
  zoomPreview = signal<number>(55);

  tucData = signal<any>(null);
  configCalibrador = signal<PlantillaTucCalibradorConfig | null>(null);
  plantillaActivaNombre = computed(() => this.configCalibrador()?.nombre || 'Plantilla Oficial DRTC Puno');

  // Variables por Sección exactamente igual a TUC Studio
  varsAnverso = computed(() => this.configCalibrador()?.variables?.filter(v => v.visible && (v.seccion === 'anverso' || !v.seccion)) || []);
  varsReverso = computed(() => this.configCalibrador()?.variables?.filter(v => v.visible && v.seccion === 'reverso') || []);
  formatoPapel = computed(() => this.configCalibrador()?.formato_papel || 'A4');
  orientacion = computed(() => this.configCalibrador()?.orientacion || 'portrait');

  // Datos editables de la TUC
  datosEditados = signal<Record<string, any>>({
    fecha_del: '',
    fecha_al: '',
    nro_resolucion_primigenia: '',
    fecha_resolucion_primigenia: '',
    empresa: '',
    ruc: '',
    partida: '',
    placa: '',
    numero_tuc: '',
    color: '',
    marca: '',
    modelo: '',
    anio: '',
    categoria: '',
    vin: '',
    asientos: '',
    ejes: '',
    alto: '',
    ancho: '',
    largo: '',
    peso_neto: '',
    carga_util: '',
    peso_bruto: '',
    tabla_rutas_text: '',
    num_resolucion_acto: '',
    fecha_resolucion_acto: '',
    tipo_resolucion_acto: ''
  });

  datosOriginales = signal<Record<string, any>>({});
  iframeCustomHtml = signal<string | null>(null);

  // Computado: cantidad de campos modificados
  camposModificadosCount = computed(() => {
    const edit = this.datosEditados();
    const orig = this.datosOriginales();
    let count = 0;
    for (const key of Object.keys(edit)) {
      if (String(edit[key] ?? '').trim() !== String(orig[key] ?? '').trim()) {
        count++;
      }
    }
    return count;
  });

  hayModificaciones = computed(() => this.camposModificadosCount() > 0);

  // Computado: lista reactiva de rutas para renderizar en el reverso
  rutasList = computed<string[]>(() => {
    const text = this.datosEditados()['tabla_rutas_text'] || '';
    if (text && text.trim().length > 0) {
      return text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    }
    const dt = this.tucData()?.datos?.rutas_detalle;
    if (Array.isArray(dt) && dt.length > 0) {
      return dt.map((r: any) => typeof r === 'string' ? r : `${r.codigo || ''} ${r.origen || ''} - ${r.destino || ''} (${r.frecuencia || ''})`.trim()).filter(Boolean);
    }
    const rPrim = this.datosEditados()['nro_resolucion_primigenia'] || this.data.vehiculo.nro_resolucion_primigenia;
    return [
      `Ruta: AMBITO REGIONAL PUNO (R.D.R. N° ${rPrim || '0701-2026'}-DRTC)`,
      `Origen - Destino según autorización de flota matriz`
    ];
  });

  // Placeholders reactivos combinando los datos de BD y los datos editados en vivo
  placeholdersVehiculo = computed<Record<string, string>>(() => {
    const d = this.datosEditados();
    const base: Record<string, string> = { ...(this.tucData()?.placeholders || {}) };

    if (d['numero_tuc'] !== undefined) base['{{NUMERO_TUC}}'] = String(d['numero_tuc'] || '');
    if (d['placa'] !== undefined) base['{{PLACA}}'] = String(d['placa'] || '');
    if (d['empresa'] !== undefined) base['{{EMPRESA}}'] = String(d['empresa'] || '');
    if (d['ruc'] !== undefined) base['{{RUC}}'] = String(d['ruc'] || '');
    if (d['partida'] !== undefined) base['{{PARTIDA_REGISTRAL}}'] = String(d['partida'] || '');
    if (d['fecha_del'] !== undefined) {
      base['{{FECHA_DEL}}'] = String(d['fecha_del'] || '');
      base['{{FECHA_DEL_P2}}'] = String(d['fecha_del'] || '');
    }
    if (d['fecha_al'] !== undefined) {
      base['{{FECHA_AL}}'] = String(d['fecha_al'] || '');
      base['{{FECHA_AL_P2}}'] = String(d['fecha_al'] || '');
    }
    if (d['nro_resolucion_primigenia'] !== undefined) {
      base['{{NUM_RESOLUCION_ORIG}}'] = String(d['nro_resolucion_primigenia'] || '');
      base['{{NUM_RESOLUCION_ORIG_P2}}'] = String(d['nro_resolucion_primigenia'] || '');
    }
    if (d['fecha_resolucion_primigenia'] !== undefined) {
      base['{{FECHA_RESOLUCION_ORIG}}'] = String(d['fecha_resolucion_primigenia'] || '');
      base['{{FECHA_RESOLUCION_ORIG_P2}}'] = String(d['fecha_resolucion_primigenia'] || '');
    }
    if (d['marca'] !== undefined) base['{{MARCA}}'] = String(d['marca'] || '');
    if (d['modelo'] !== undefined) base['{{MODELO}}'] = String(d['modelo'] || '');
    if (d['anio'] !== undefined) base['{{ANIO_FABRICACION}}'] = String(d['anio'] || '');
    if (d['categoria'] !== undefined) base['{{CATEGORIA}}'] = String(d['categoria'] || '');
    if (d['color'] !== undefined) base['{{COLOR}}'] = String(d['color'] || '');
    if (d['vin'] !== undefined) {
      base['{{NUMERO_SERIE_CHASIS}}'] = String(d['vin'] || '');
      base['{{NUMERO_VIN}}'] = String(d['vin'] || '');
    }
    if (d['asientos'] !== undefined) base['{{NUM_ASIENTOS}}'] = String(d['asientos'] || '');
    if (d['ejes'] !== undefined) base['{{NUM_EJES}}'] = String(d['ejes'] || '');
    if (d['alto'] !== undefined) base['{{ALTO}}'] = String(d['alto'] || '');
    if (d['ancho'] !== undefined) base['{{ANCHO}}'] = String(d['ancho'] || '');
    if (d['largo'] !== undefined) base['{{LONGITUD}}'] = String(d['largo'] || '');
    if (d['peso_neto'] !== undefined) base['{{PESO_NETO}}'] = String(d['peso_neto'] || '');
    if (d['carga_util'] !== undefined) base['{{CARGA_UTIL}}'] = String(d['carga_util'] || '');
    if (d['peso_bruto'] !== undefined) base['{{PESO_BRUTO}}'] = String(d['peso_bruto'] || '');

    if (d['num_resolucion_acto'] !== undefined) base['{{NUM_RESOLUCION_ACTO}}'] = String(d['num_resolucion_acto'] || '');
    if (d['fecha_resolucion_acto'] !== undefined) base['{{FECHA_RESOLUCION_ACTO}}'] = String(d['fecha_resolucion_acto'] || '');
    if (d['tipo_resolucion_acto'] !== undefined) base['{{TIPO_RESOLUCION_ACTO}}'] = String(d['tipo_resolucion_acto'] || '');

    return base;
  });

  escapeHtml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  formatearTextoConComillas(texto: string, resaltar: boolean = true): string {
    if (!texto) return '';
    if (!resaltar) return this.escapeHtml(texto);
    const regex = /(".*?"|“.*?”|«.*?»)/g;
    const partes = texto.split(regex);
    return partes.map(parte => {
      if (!parte) return '';
      if ((parte.startsWith('"') && parte.endsWith('"')) ||
          (parte.startsWith('“') && parte.endsWith('”')) ||
          (parte.startsWith('«') && parte.endsWith('»'))) {
        return `<span class="tuc-quoted">${this.escapeHtml(parte)}</span>`;
      }
      return this.escapeHtml(parte);
    }).join('');
  }

  obtenerHtmlRender(v: VariablePlantillaTuc): SafeHtml {
    const ph = this.placeholdersVehiculo();
    let val = ph[v.tag] !== undefined ? ph[v.tag] : (v.valor_ejemplo || '');

    const prefix = v.prefix !== undefined && v.prefix !== '' ? v.prefix : (v.etiqueta || '');
    const suffix = v.suffix || '';
    const baseSize = v.font_size_pt || 7.0;

    const prefixWeight = v.prefix_font_weight || v.etiqueta_font_weight || 'bold';
    const prefixSize = v.prefix_font_size_pt || baseSize;

    const valorWeight = v.font_weight || 'normal';
    const valorSize = baseSize;
    const resaltar = v.resaltar_comillas !== false;

    const suffixWeight = v.suffix_font_weight || 'normal';
    const suffixSize = v.suffix_font_size_pt || baseSize;

    const valHtml = this.formatearTextoConComillas(String(val), resaltar);

    let htmlOut = '';
    if (prefix) {
      htmlOut += `<span class="tuc-prefix" style="font-weight: ${prefixWeight}; font-size: ${prefixSize}pt;">${this.escapeHtml(prefix)}</span>`;
    }
    if (valHtml) {
      htmlOut += `<span class="tuc-valor" style="font-weight: ${valorWeight}; font-size: ${valorSize}pt;">${valHtml}</span>`;
    }
    if (suffix) {
      htmlOut += `<span class="tuc-suffix" style="font-weight: ${suffixWeight}; font-size: ${suffixSize}pt;">${this.escapeHtml(suffix)}</span>`;
    }

    return this.sanitizer.bypassSecurityTrustHtml(htmlOut);
  }

  obtenerQrPreviewUrl(v: VariablePlantillaTuc): string {
    const placa = this.datosEditados()['placa'] || this.data.vehiculo.placa || 'PE';
    let raw = v.qr_contenido || `https://drtc-puno.gob.pe/verificar-tuc/${placa}`;
    const ph = this.placeholdersVehiculo();
    for (const [key, val] of Object.entries(ph)) {
      raw = raw.replace(key, val);
    }
    raw = raw.replace('{{PLACA}}', placa);
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(raw)}`;
  }

  // Computado: URL de código QR dinámico de alta fidelidad
  qrPreviewUrl = computed<string>(() => {
    const placa = this.datosEditados()['placa'] || this.data.vehiculo.placa || 'PE';
    const nroTuc = this.datosEditados()['numero_tuc'] || this.data.vehiculo.numero_tuc || '000000';
    const qrData = `DRTC-PUNO|TUC:${nroTuc}|PLACA:${placa}|VERIF:https://drtc-puno.gob.pe/tuc/${placa}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=2&data=${encodeURIComponent(qrData)}`;
  });

  // Saber si un campo en particular fue editado por el usuario
  esCampoModificado(campo: string): boolean {
    const edit = String(this.datosEditados()[campo] ?? '').trim();
    const orig = String(this.datosOriginales()[campo] ?? '').trim();
    return edit !== orig;
  }

  // Redirigir al campo correspondiente en la pestaña de edición y enfocarlo
  enfocarCampo(campo: string): void {
    this.tabActiva.set('edicion');
    setTimeout(() => {
      const el = document.getElementById(`input-edit-${campo}`);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  }

  // Manejo de error al cargar el escudo o imagen
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }

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

  @ViewChild('previewIframe') previewIframe?: ElementRef<HTMLIFrameElement>;

  private sanitizer = inject(DomSanitizer);
  private tucService = inject(TucService);
  private snackBar = inject(MatSnackBar);

  previewUrl = computed<SafeResourceUrl>(() => {
    const term = this.data.vehiculo.placa || this.data.vehiculo.id;
    const key = this.refreshKey();
    const url = `${environment.apiUrl}/tucs/render-html/${encodeURIComponent(term)}?auto_print=false&_t=${key}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: GenerarTucDialogData,
    private dialogRef: MatDialogRef<GenerarTucDialogComponent>
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
        const d = resp?.datos || {};
        const initDatos: Record<string, any> = {
          fecha_del: d.fecha_del || '',
          fecha_al: d.fecha_al || '',
          nro_resolucion_primigenia: d.nro_resolucion_primigenia || this.data.vehiculo.nro_resolucion_primigenia || '',
          fecha_resolucion_primigenia: d.fecha_resolucion_primigenia || '',
          empresa: d.empresa || this.data.vehiculo.razon_social || '',
          ruc: d.ruc || this.data.vehiculo.ruc || '',
          partida: d.partida || '',
          placa: d.placa || this.data.vehiculo.placa || '',
          numero_tuc: d.numero_tuc || this.data.vehiculo.numero_tuc || '',
          color: d.color || this.data.vehiculo.color || '',
          marca: d.marca || this.data.vehiculo.marca || '',
          modelo: d.modelo || this.data.vehiculo.modelo || '',
          anio: d.anio || this.data.vehiculo.anio_fabricacion || '',
          categoria: d.categoria || this.data.vehiculo.categoria || 'M2',
          vin: d.vin || '',
          asientos: d.asientos || '',
          ejes: d.ejes || '',
          alto: d.alto || '',
          ancho: d.ancho || '',
          largo: d.largo || '',
          peso_neto: d.peso_neto || '',
          carga_util: d.carga_util || '',
          peso_bruto: d.peso_bruto || '',
          tabla_rutas_text: d.tabla_rutas_text || '',
          num_resolucion_acto: d.num_resolucion_acto || '',
          fecha_resolucion_acto: d.fecha_resolucion_acto || '',
          tipo_resolucion_acto: d.tipo_resolucion_acto || ''
        };
        this.datosEditados.set({ ...initDatos });
        this.datosOriginales.set({ ...initDatos });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open('Error al cargar datos técnicos del vehículo.', 'Cerrar', { duration: 4000 });
      }
    });

    // Cargar configuración activa del calibrador
    this.tucService.getCalibradorConfig().subscribe({
      next: (cfg) => {
        if (cfg) {
          this.configCalibrador.set(cfg);
          if (cfg.formato_papel === 'A4') {
            this.zoomPreview.set(55);
          } else {
            this.zoomPreview.set(100);
          }
        }
      },
      error: (e) => console.warn('No se pudo cargar config calibrador:', e)
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

  generarPreviewHtml(datosParaRender?: Record<string, any>): void {
    const term = this.data.vehiculo.placa || this.data.vehiculo.id;
    const datos = datosParaRender || this.datosEditados();
    this.iframeCargando.set(true);

    this.tucService.renderHtmlCustom(term, datos, this.configCalibrador() || undefined).subscribe({
      next: (html) => {
        this.iframeCargando.set(false);
        this.isUpdatingPreview.set(false);
        this.iframeCustomHtml.set(html);
      },
      error: (err) => {
        console.error('Error al generar HTML de muestra:', err);
        this.iframeCargando.set(false);
        this.isUpdatingPreview.set(false);
      }
    });
  }

  onIframeLoad(): void {
    this.iframeCargando.set(false);
  }

  recargarPreview(): void {
    this.generarPreviewHtml(this.hayModificaciones() ? this.datosEditados() : this.datosOriginales());
  }

  abrirVistaEnNuevaPestana(): void {
    const term = this.data.vehiculo.placa || this.data.vehiculo.id;
    if (this.hayModificaciones()) {
      this.tucService.renderHtmlCustom(term, this.datosEditados(), this.configCalibrador() || undefined).subscribe({
        next: (html) => {
          const win = window.open('', '_blank');
          if (win) {
            win.document.open();
            win.document.write(html);
            win.document.close();
          }
        },
        error: () => window.open(`${environment.apiUrl}/tucs/render-html/${encodeURIComponent(term)}?auto_print=false`, '_blank')
      });
    } else {
      window.open(`${environment.apiUrl}/tucs/render-html/${encodeURIComponent(term)}?auto_print=false`, '_blank');
    }
  }

  cambiarZoomPreview(delta: number): void {
    this.zoomPreview.update(z => Math.min(160, Math.max(30, z + delta)));
  }

  resetZoomPreview(): void {
    const isA4 = this.formatoPapel() === 'A4';
    this.zoomPreview.set(isA4 ? 55 : 100);
  }

  actualizarCampo(campo: string, valor: any): void {
    this.datosEditados.update(d => ({ ...d, [campo]: valor }));
  }

  aplicarEdicionAPreview(): void {
    this.snackBar.open('✓ Muestra de TUC actualizada en vivo con los campos editados.', 'OK', { duration: 2500 });
  }

  aplicarEdicionAPreviewSilenciosa(): void {
    // La reactividad de Signals actualiza placeholdersVehiculo automáticamente
  }

  restablecerValoresOriginales(): void {
    const orig = { ...this.datosOriginales() };
    this.datosEditados.set(orig);
    this.snackBar.open('Valores originales restablecidos.', 'OK', { duration: 2500 });
  }

  imprimirDesdeEditor(): void {
    this.imprimirTarjeta();
  }

  imprimirTarjeta(): void {
    this.imprimirHtmlInstantaneo();
  }

  imprimirHtmlInstantaneo(): void {
    const term = this.data.vehiculo.placa || this.data.vehiculo.id;
    const cfg = this.configCalibrador();
    if (this.hayModificaciones()) {
      this.tucService.renderHtmlCustom(term, this.datosEditados(), cfg || undefined).subscribe({
        next: (html) => {
          this.tucService.imprimirHtmlSilencioso(html);
        },
        error: () => {
          if (cfg) this.tucService.imprimirHtmlConConfig(term, cfg);
          else this.tucService.imprimirHtmlDirecto(term);
        }
      });
    } else {
      if (cfg) {
        this.tucService.imprimirHtmlConConfig(term, cfg);
      } else {
        this.tucService.imprimirHtmlDirecto(term);
      }
    }
  }

  abrirCalibradorStudio(): void {
    window.open('/tucs/calibrador', '_blank');
  }

  abrirNotificacionImpresion(): void {
    const term = this.data.vehiculo.placa || this.data.vehiculo.id;
    const url = `${environment.apiUrl}/tucs/vista-impresion-notificacion/${encodeURIComponent(term)}`;
    window.open(url, '_blank');
    this.snackBar.open('Cédula de Notificación abierta en nueva pestaña. Usa Ctrl+P para imprimir.', 'OK', { duration: 3500 });
  }

  generarNotificacionGoogleDocs(): void {
    const term = this.data.vehiculo.placa || this.data.vehiculo.id;
    this.isGeneratingNotifDocs.set(true);

    this.tucService.generarGoogleDocNotificacion(term).subscribe({
      next: (resp) => {
        this.isGeneratingNotifDocs.set(false);
        if (resp && resp.exito && resp.url) {
          window.open(resp.url, '_blank');
          this.snackBar.open('Notificación en Google Docs generada exitosamente.', 'OK', { duration: 4500 });
        } else {
          this.snackBar.open(resp?.mensaje || 'No se pudo generar la Notificación en Google Docs.', 'Cerrar', { duration: 4000 });
        }
      },
      error: (err) => {
        this.isGeneratingNotifDocs.set(false);
        const msg = err?.error?.detail || 'Error al generar Notificación en Google Docs.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  descargarDocx(): void {
    const term = this.data.vehiculo.placa || this.data.vehiculo.id;
    this.isGeneratingDocx.set(true);

    const obs = this.hayModificaciones()
      ? this.tucService.descargarDocxCustom(term, this.datosEditados())
      : this.tucService.descargarDocxTuc(term);

    obs.subscribe({
      next: (blob) => {
        this.isGeneratingDocx.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const placaName = this.datosEditados()['placa'] || this.data.vehiculo.placa || 'VEHICULO';
        a.download = `TUC_${placaName}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Documento Word (.docx) descargado' + (this.hayModificaciones() ? ' con datos editados.' : '.'), 'OK', { duration: 3500 });
      },
      error: (err) => {
        this.isGeneratingDocx.set(false);
        const msg = err?.error?.detail || 'Error al descargar documento Word.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
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

  toggleConfigPlantilla(): void {
    this.mostrarConfigPlantilla.update(v => !v);
  }

  actualizarCampoConfig(campo: keyof TucPlantillaConfig, valor: any): void {
    this.configPlantilla.update(cfg => ({
      ...cfg,
      [campo]: valor
    }));
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

  cerrar(): void {
    this.dialogRef.close({ link_tuc: this.data.vehiculo.link_tuc });
  }
}
