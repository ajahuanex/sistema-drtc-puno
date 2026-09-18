import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { Vehiculo360Response } from '../../services/vehiculo.service';

@Component({
  selector: 'app-record-vehicular-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="record-dialog-container">
      <!-- Barra superior de acciones del modal -->
      <div class="dialog-toolbar no-print">
        <div class="toolbar-title">
          <mat-icon class="toolbar-icon">description</mat-icon>
          <div>
            <h3>Certificado Oficial de Récord Vehicular</h3>
            <span class="toolbar-sub">DRTC Puno • Placa: {{ data.placa }} ({{ data.modalidad_placa.nombre || 'Transporte Regular' }})</span>
          </div>
        </div>

        <div class="toolbar-buttons">
          <button mat-flat-button color="primary" class="btn-action" (click)="descargarPdf()">
            <mat-icon>picture_as_pdf</mat-icon> Descargar PDF Oficial
          </button>
          <button mat-stroked-button class="btn-action" (click)="imprimir()">
            <mat-icon>print</mat-icon> Imprimir A4
          </button>
          <button mat-icon-button (click)="cerrar()" matTooltip="Cerrar">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- VISTA PREVIA DEL DOCUMENTO A4 OFICIAL -->
      <div class="document-scroll-viewport">
        <div class="hoja-a4" id="record-imprimible">

          <!-- ENCABEZADO OFICIAL DRTC PUNO -->
          <div class="doc-header">
            <div class="header-escudo">
              <div class="escudo-placeholder">
                <mat-icon>account_balance</mat-icon>
              </div>
            </div>
            <div class="header-textos">
              <h2>GOBIERNO REGIONAL PUNO</h2>
              <h3>DIRECCIÓN REGIONAL DE TRANSPORTES Y COMUNICACIONES</h3>
              <h4>SUBDIRECCIÓN DE TRANSPORTE TERRESTRE</h4>
              <span class="header-dep">Área de Habilitaciones e Inspección Vehicular</span>
            </div>
            <div class="header-codigo-doc">
              <div class="placa-box-oficial">
                <div class="placa-franja" [style.background]="data.modalidad_placa.color_franja || '#ea580c'">
                  PERÚ • {{ data.modalidad_placa.codigo || 'REGULAR' }}
                </div>
                <div class="placa-nro">{{ data.placa }}</div>
              </div>
              <div class="doc-registro-nro">
                N° {{ data.placa }}-{{ fechaActual | date:'yyyy' }}-DRTC-PUNO
              </div>
            </div>
          </div>

          <div class="doc-separador-doble"></div>

          <!-- TÍTULO PRINCIPAL -->
          <div class="doc-titulo-seccion">
            <h1>HOJA DE VIDA Y RÉCORD VEHICULAR</h1>
            <p>CONSOLIDADO TÉCNICO REGISTRAL Y EVALUACIÓN NORMATIVA MTC / RNAT</p>
          </div>

          <!-- SECCIÓN 1: IDENTIFICACIÓN Y DATOS TÉCNICOS -->
          <div class="doc-bloque">
            <div class="bloque-titulo">I. ESPECIFICACIONES TÉCNICAS (SUNARP / MTC D.S. Nº 058-2003-MTC)</div>
            <table class="tabla-oficial">
              <tbody>
                <tr>
                  <td class="td-label">Placa de Rodaje:</td>
                  <td class="td-val font-bold">{{ data.placa }}</td>
                  <td class="td-label">Modalidad:</td>
                  <td class="td-val font-bold" [style.color]="data.modalidad_placa.color_franja">
                    {{ data.modalidad_placa.nombre }}
                  </td>
                </tr>
                <tr>
                  <td class="td-label">Marca:</td>
                  <td class="td-val">{{ data.datos_tecnicos?.marca || '-' }}</td>
                  <td class="td-label">Modelo:</td>
                  <td class="td-val">{{ data.datos_tecnicos?.modelo || '-' }}</td>
                </tr>
                <tr>
                  <td class="td-label">Año de Fabricación:</td>
                  <td class="td-val font-bold">{{ data.datos_tecnicos?.anio_fabricacion || '-' }}</td>
                  <td class="td-label">Año Modelo:</td>
                  <td class="td-val">{{ data.datos_tecnicos?.anio_modelo || '-' }}</td>
                </tr>
                <tr>
                  <td class="td-label">Categoría MTC:</td>
                  <td class="td-val font-bold">{{ data.datos_tecnicos?.categoria || '-' }}</td>
                  <td class="td-label">Carrocería:</td>
                  <td class="td-val">{{ data.datos_tecnicos?.carroceria || '-' }}</td>
                </tr>
                <tr>
                  <td class="td-label">Número de Motor:</td>
                  <td class="td-val code-text">{{ data.datos_tecnicos?.numero_motor || '-' }}</td>
                  <td class="td-label">VIN / Chasis / Serie:</td>
                  <td class="td-val code-text">{{ data.datos_tecnicos?.vin || '-' }}</td>
                </tr>
                <tr>
                  <td class="td-label">Combustible:</td>
                  <td class="td-val">{{ data.datos_tecnicos?.combustible || '-' }}</td>
                  <td class="td-label">Color Oficial:</td>
                  <td class="td-val">{{ data.datos_tecnicos?.color || '-' }}</td>
                </tr>
                <tr>
                  <td class="td-label">Capacidad de Asientos:</td>
                  <td class="td-val">{{ data.datos_tecnicos?.numero_asientos ? data.datos_tecnicos?.numero_asientos + ' asientos' : '-' }}</td>
                  <td class="td-label">Pasajeros Reglamentarios:</td>
                  <td class="td-val">{{ data.datos_tecnicos?.numero_pasajeros ? data.datos_tecnicos?.numero_pasajeros + ' pasajeros' : '-' }}</td>
                </tr>
                <tr>
                  <td class="td-label">Pesos (Neto / Bruto):</td>
                  <td class="td-val">{{ data.datos_tecnicos?.peso_neto || '-' }} Tn / {{ data.datos_tecnicos?.peso_bruto || '-' }} Tn</td>
                  <td class="td-label">Carga Útil:</td>
                  <td class="td-val">{{ data.datos_tecnicos?.carga_util ? data.datos_tecnicos?.carga_util + ' Tn' : '-' }}</td>
                </tr>
                <tr>
                  <td class="td-label">Dimensiones (L x A x H):</td>
                  <td class="td-val" colspan="3">
                    {{ data.datos_tecnicos?.longitud || '-' }} m x {{ data.datos_tecnicos?.ancho || '-' }} m x {{ data.datos_tecnicos?.altura || '-' }} m • Ejes: {{ data.datos_tecnicos?.numero_ejes || '-' }} • Ruedas: {{ data.datos_tecnicos?.numero_ruedas || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- SECCIÓN 2: EVALUACIÓN DE ANTIGÜEDAD Y RÉGIMEN EXTRAORDINARIO PUNO -->
          <div class="doc-bloque">
            <div class="bloque-titulo">II. EVALUACIÓN DE PERMANENCIA (R.M. N.° 585-2021-MTC/01 & RENAT D.S. 017-2009-MTC)</div>
            <div class="evaluacion-normativa-box">
              <div class="normativa-fila">
                <div class="norm-col">
                  <span class="norm-label">Antigüedad Actual:</span>
                  <span class="norm-val">{{ data.normativa_mtc.antiguedad_anios ?? '-' }} años</span>
                </div>
                <div class="norm-col">
                  <span class="norm-label">Marco Legal Aplicable:</span>
                  <span class="norm-val font-bold">{{ data.normativa_mtc.norma_aplicable || 'RENAT (D.S. 017-2009-MTC)' }}</span>
                </div>
                <div class="norm-col">
                  <span class="norm-label">Dictamen Técnico:</span>
                  <span class="norm-val badge-norm-dictamen" [style.background]="data.normativa_mtc.badge_color === 'green' ? '#16a34a' : (data.normativa_mtc.badge_color === 'amber' ? '#d97706' : '#dc2626')">
                    {{ data.normativa_mtc.dictamen_final }}
                  </span>
                </div>
              </div>

              <!-- Detalle según marco legal -->
              @if (data.normativa_mtc.regimen_puno.aplica_cronograma_puno) {
                <div class="cronograma-puno-alerta">
                  <div class="puno-alerta-title">
                    <mat-icon class="puno-icon">verified_user</mat-icon>
                    <strong>APLICACIÓN DE LA RESOLUCIÓN MINISTERIAL N.° 585-2021-MTC/01 (ÁMBITO REGIÓN PUNO, ART. 1.1 Y 2.1):</strong>
                  </div>
                  <div class="puno-alerta-desc">
                    • <strong>Año de Fabricación:</strong> {{ data.normativa_mtc.anio_fabricacion }} (comprendido en el cronograma especial de permanencia para Puno)<br/>
                    • <strong>Fecha Límite Improrrogable de Retiro:</strong> 31 de Diciembre de {{ data.normativa_mtc.regimen_puno.fecha_retiro_puno }}<br/>
                    • <strong>Condición Legal Obligatoria:</strong> {{ data.normativa_mtc.regimen_puno.condicion_citv_obligatoria }}<br/>
                    • <strong>Diagnóstico DRTC Puno:</strong> {{ data.normativa_mtc.regimen_puno.mensaje_puno }}
                  </div>
                </div>
              } @else {
                <div class="cronograma-general-info">
                  • <strong>Régimen Aplicable:</strong> Marco Nacional del RENAT (D.S. N.° 017-2009-MTC, Art. 25). Al no estar comprendido en el cronograma de la R.M. N.° 585-2021-MTC/01 (1990-2009), aplica el límite ordinario de 15 años de permanencia (Año límite ordinario: {{ data.normativa_mtc.anio_limite_salida_rnat || 'S/D' }}).
                </div>
              }
            </div>
          </div>

          <!-- SECCIÓN 3: SITUACIÓN ADMINISTRATIVA ACTUAL -->
          <div class="doc-bloque">
            <div class="bloque-titulo">III. SITUACIÓN ADMINISTRATIVA Y HABILITACIÓN ACTUAL</div>
            <table class="tabla-oficial">
              <tbody>
                <tr>
                  <td class="td-label">Empresa Concesionaria:</td>
                  <td class="td-val font-bold" colspan="3">{{ data.situacion_actual.empresa_actual }}</td>
                </tr>
                <tr>
                  <td class="td-label">RUC de la Empresa:</td>
                  <td class="td-val">{{ data.situacion_actual.ruc_empresa_actual || 'No registrado' }}</td>
                  <td class="td-label">Condición Registral:</td>
                  <td class="td-val font-bold">
                    <span class="badge-print-estado">{{ data.situacion_actual.estado_habilitacion }}</span>
                  </td>
                </tr>
                <tr>
                  <td class="td-label">Resolución Primigenia:</td>
                  <td class="td-val font-bold">
                    {{ data.situacion_actual.resolucion_primigenia_info?.nro_resolucion || data.situacion_actual.resolucion_primigenia || 'En trámite' }}
                    @if (data.situacion_actual.resolucion_primigenia_info?.fecha_fin_vigencia) {
                      <span style="font-size: 8.5px; color: #475569; display: block; font-weight: normal;">
                        Vigencia: {{ data.situacion_actual.resolucion_primigenia_info?.fecha_inicio_vigencia | date:'dd/MM/yyyy' }} al {{ data.situacion_actual.resolucion_primigenia_info?.fecha_fin_vigencia | date:'dd/MM/yyyy' }}
                        ({{ data.situacion_actual.resolucion_primigenia_info?.estado_vigencia }})
                      </span>
                    }
                  </td>
                  <td class="td-label">Última Res. Hija:</td>
                  <td class="td-val">{{ data.situacion_actual.resolucion_hija || '-' }} ({{ data.situacion_actual.tipo_resolucion_hija || 'N/A' }})</td>
                </tr>
                <tr>
                  <td class="td-label">Tarjeta TUC Activa:</td>
                  <td class="td-val font-bold code-text">{{ data.situacion_actual.tuc_actual?.numero_tuc || 'SIN TUC ACTIVA' }}</td>
                  <td class="td-label">Vigencia TUC:</td>
                  <td class="td-val">
                    {{ data.situacion_actual.tuc_actual?.estado || 'NO_VIGENTE' }}
                    @if (data.situacion_actual.tuc_actual?.fecha_vencimiento) {
                      (Vence: {{ data.situacion_actual.tuc_actual?.fecha_vencimiento | date:'dd/MM/yyyy' }})
                    }
                  </td>
                </tr>
                <tr>
                  <td class="td-label">Rutas Autorizadas:</td>
                  <td class="td-val" colspan="3">
                    @if (data.situacion_actual.rutas_detalladas && data.situacion_actual.rutas_detalladas.length > 0) {
                      @for (r of data.situacion_actual.rutas_detalladas; track $index) {
                        <div style="margin-bottom: 3px; font-size: 8.5px;">
                          • <strong>Ruta {{ r.codigo_ruta }}:</strong> {{ r.nombre_ruta }} 
                          <span style="color: #475569;">({{ r.tipo_ruta }} - Frec: {{ r.frecuencia }})</span>
                          @if (r.itinerario && r.itinerario.length > 0) {
                            <span style="color: #2563eb; font-style: italic;">[Escalas: {{ r.itinerario.join(' - ') }}]</span>
                          }
                        </div>
                      }
                    } @else {
                      {{ data.situacion_actual.rutas_autorizadas.length > 0 ? ('Rutas Códigos: ' + data.situacion_actual.rutas_autorizadas.join(', ')) : 'Ruta amparada bajo concesión de empresa' }}
                    }
                  </td>
                </tr>
                @if (data.situacion_actual.evaluacion_permanencia_vs_resolucion) {
                  <tr>
                    <td class="td-label">Compatibilidad Concesión vs. Permanencia:</td>
                    <td class="td-val" colspan="3" style="font-size: 8.5px;">
                      <strong>{{ data.situacion_actual.evaluacion_permanencia_vs_resolucion.tipo_evaluacion.replace('_', ' ') }}:</strong>
                      {{ data.situacion_actual.evaluacion_permanencia_vs_resolucion.mensaje }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- SECCIÓN 4: HISTORIAL DE EMPRESAS CONCESIONARIAS Y TRANSFERENCIAS -->
          @if (data.empresas_historicas && data.empresas_historicas.length > 0) {
            <div class="doc-bloque">
              <div class="bloque-titulo">IV. HISTORIAL DE EMPRESAS CONCESIONARIAS Y TRANSFERENCIAS</div>
              <table class="tabla-oficial tabla-historial">
                <thead>
                  <tr>
                    <th style="width: 32%;">Empresa Concesionaria</th>
                    <th style="width: 15%;">RUC</th>
                    <th style="width: 15%;">Concesión Matriz</th>
                    <th style="width: 15%;">Condición</th>
                    <th style="width: 23%;">Trámite / Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (emp of data.empresas_historicas; track emp.ruc) {
                    <tr>
                      <td class="font-bold">{{ emp.razon_social }}</td>
                      <td class="code-text">{{ emp.ruc }}</td>
                      <td>{{ emp.resolucion_primigenia || '-' }}</td>
                      <td>
                        <span style="font-size: 8px; font-weight: bold; padding: 2px 6px; border-radius: 4px; display: inline-block;"
                          [style.background]="emp.es_operador_actual ? '#dcfce7' : '#f1f5f9'"
                          [style.color]="emp.es_operador_actual ? '#166534' : '#475569'">
                          {{ emp.es_operador_actual ? 'ACTUAL (' + emp.ultimo_estado + ')' : 'HISTÓRICO (' + emp.ultimo_estado + ')' }}
                        </span>
                      </td>
                      <td style="font-size: 8px;">
                        @if (emp.resolucion_tramite) {
                          <div><strong>{{ emp.tipo_tramite }}</strong> ({{ emp.resolucion_tramite }})</div>
                        }
                        @if (emp.observaciones && emp.observaciones.length > 0) {
                          <div style="color: #64748b; font-style: italic;">{{ emp.observaciones.join(', ') }}</div>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- SECCIÓN 5: HISTORIAL CRONOLÓGICO DE ACTOS ADMINISTRATIVOS -->
          <div class="doc-bloque">
            <div class="bloque-titulo">V. HISTORIAL CRONOLÓGICO DE ACTOS RESOLUTIVOS (DRTC PUNO)</div>
            @if (data.timeline_historial.length > 0) {
              <table class="tabla-oficial tabla-historial">
                <thead>
                  <tr>
                    <th style="width: 15%;">Fecha</th>
                    <th style="width: 25%;">Acto / Trámite</th>
                    <th style="width: 25%;">Resolución</th>
                    <th style="width: 25%;">Empresa</th>
                    <th style="width: 10%;">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ev of data.timeline_historial; track $index) {
                    <tr>
                      <td>{{ ev.fecha ? (ev.fecha | date:'dd/MM/yyyy') : 'Registrado' }}</td>
                      <td class="font-bold">{{ ev.titulo }}</td>
                      <td class="code-text">{{ ev.resolucion || '-' }}</td>
                      <td>{{ ev.empresa }}</td>
                      <td>{{ ev.estado_resultado }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <p class="sin-registros-p">No se registran trámites históricos adicionales para esta placa.</p>
            }
          </div>

          <!-- PIE DE FIRMAS Y VALIDEZ INSTITUCIONAL -->
          <div class="doc-pie-firmas">
            <div class="firma-box">
              <div class="linea-firma"></div>
              <span class="cargo-firma">SUBDIRECTOR DE TRANSPORTE TERRESTRE</span>
              <span class="inst-firma">DRTC - GOBIERNO REGIONAL PUNO</span>
            </div>

            <div class="sello-qr-box">
              <div class="qr-placeholder">
                <mat-icon class="qr-mock-icon">qr_code_2</mat-icon>
              </div>
              <div class="qr-text">
                <strong>VERIFICACIÓN DIGITAL</strong><br/>
                Consulta expedida en línea por el Sistema SIRRET - DRTC Puno.<br/>
                Fecha de Emisión: {{ fechaActual | date:'dd/MM/yyyy HH:mm:ss' }}
              </div>
            </div>

            <div class="firma-box">
              <div class="linea-firma"></div>
              <span class="cargo-firma">ÁREA DE FISCALIZACIÓN Y HABILITACIONES</span>
              <span class="inst-firma">DRTC - GOBIERNO REGIONAL PUNO</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .record-dialog-container {
      display: flex;
      flex-direction: column;
      height: 90vh;
      max-width: 950px;
      background: #f1f5f9;
      border-radius: 16px;
      overflow: hidden;
    }

    .dialog-toolbar {
      background: #0f172a;
      color: #ffffff;
      padding: 14px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10;

      .toolbar-title {
        display: flex;
        align-items: center;
        gap: 14px;

        .toolbar-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
          color: #38bdf8;
        }

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
        }

        .toolbar-sub {
          font-size: 12px;
          color: #94a3b8;
        }
      }

      .toolbar-buttons {
        display: flex;
        align-items: center;
        gap: 10px;

        .btn-action {
          font-weight: 700;
          border-radius: 8px;
        }
      }
    }

    .document-scroll-viewport {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      justify-content: center;
      background: #64748b;
    }

    // HOJA A4 OFICIAL
    .hoja-a4 {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      padding: 20mm 18mm;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      color: #0f172a;
      font-family: 'Segoe UI', Arial, sans-serif;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    // ENCABEZADO
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;

      .header-escudo {
        width: 60px;
        display: flex;
        align-items: center;
        justify-content: center;

        .escudo-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #0f172a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .header-textos {
        flex: 1;
        text-align: center;

        h2 { margin: 0; font-size: 14px; font-weight: 900; letter-spacing: 0.05em; color: #0f172a; }
        h3 { margin: 2px 0 0 0; font-size: 12px; font-weight: 800; color: #1e293b; }
        h4 { margin: 2px 0 0 0; font-size: 11px; font-weight: 700; color: #475569; }
        .header-dep { font-size: 10px; color: #64748b; font-style: italic; }
      }

      .header-codigo-doc {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;

        .placa-box-oficial {
          border: 2px solid #0f172a;
          border-radius: 6px;
          overflow: hidden;
          width: 120px;
          text-align: center;

          .placa-franja {
            color: #ffffff;
            font-size: 9px;
            font-weight: 900;
            padding: 1px 0;
            letter-spacing: 0.1em;
          }

          .placa-nro {
            font-family: 'Arial Black', Impact, sans-serif;
            font-size: 18px;
            font-weight: 900;
            padding: 3px 0;
            background: #ffffff;
            color: #0f172a;
          }
        }

        .doc-registro-nro {
          font-size: 9px;
          font-weight: 700;
          color: #64748b;
        }
      }
    }

    .doc-separador-doble {
      border-top: 3px double #0f172a;
      margin: 2px 0 8px 0;
    }

    .doc-titulo-seccion {
      text-align: center;
      margin-bottom: 6px;

      h1 {
        margin: 0;
        font-size: 17px;
        font-weight: 900;
        letter-spacing: 0.04em;
        color: #0f172a;
      }

      p {
        margin: 2px 0 0 0;
        font-size: 10px;
        font-weight: 700;
        color: #475569;
        letter-spacing: 0.08em;
      }
    }

    .doc-bloque {
      margin-bottom: 10px;

      .bloque-titulo {
        font-size: 11px;
        font-weight: 800;
        background: #0f172a;
        color: #ffffff;
        padding: 4px 10px;
        border-radius: 4px;
        margin-bottom: 6px;
        letter-spacing: 0.03em;
      }
    }

    // TABLA OFICIAL
    .tabla-oficial {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;

      td, th {
        border: 1px solid #cbd5e1;
        padding: 5px 8px;
      }

      .td-label {
        background: #f8fafc;
        color: #475569;
        font-weight: 700;
        width: 22%;
      }

      .td-val {
        color: #0f172a;
      }

      .font-bold {
        font-weight: 800;
      }

      .code-text {
        font-family: 'Courier New', Courier, monospace;
        font-size: 11px;
      }
    }

    .tabla-historial {
      th {
        background: #f1f5f9;
        font-weight: 800;
        text-align: left;
      }
    }

    // EVALUACIÓN BOX
    .evaluacion-normativa-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      background: #fafafa;

      .normativa-fila {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 11px;
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px dashed #cbd5e1;

        .norm-col {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .norm-label { font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          .norm-val { font-size: 12px; font-weight: 800; color: #0f172a; }
        }
      }

      .cronograma-puno-alerta {
        background: #fffbeb;
        border-left: 4px solid #f59e0b;
        padding: 8px 10px;
        font-size: 10px;
        color: #78350f;
        line-height: 1.4;

        .puno-alerta-title {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
          color: #b45309;

          .puno-icon { font-size: 16px; width: 16px; height: 16px; }
        }
      }

      .cronograma-general-info {
        font-size: 10px;
        color: #334155;
      }
    }

    .badge-norm-dictamen {
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-print-estado {
      background: #dcfce7;
      color: #15803d;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .sin-registros-p {
      font-size: 10px;
      color: #64748b;
      font-style: italic;
      margin: 4px 0;
    }

    // PIE DE FIRMAS
    .doc-pie-firmas {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: auto;
      padding-top: 14px;

      .firma-box {
        width: 30%;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;

        .linea-firma {
          width: 80%;
          border-top: 1px solid #0f172a;
          margin-bottom: 4px;
        }

        .cargo-firma {
          font-size: 8.5px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        .inst-firma {
          font-size: 7.5px;
          color: #64748b;
        }
      }

      .sello-qr-box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f8fafc;
        border: 1px dashed #94a3b8;
        padding: 6px 10px;
        border-radius: 6px;
        max-width: 35%;

        .qr-placeholder {
          .qr-mock-icon {
            font-size: 38px;
            width: 38px;
            height: 38px;
            color: #0f172a;
          }
        }

        .qr-text {
          font-size: 7.5px;
          color: #475569;
          line-height: 1.2;
        }
      }
    }

    // PRINT STYLES
    @media print {
      body * {
        visibility: hidden;
      }
      .hoja-a4, .hoja-a4 * {
        visibility: visible;
      }
      .hoja-a4 {
        position: absolute;
        left: 0;
        top: 0;
        width: 100% !important;
        margin: 0 !important;
        padding: 10mm 15mm !important;
        box-shadow: none !important;
      }
      .no-print {
        display: none !important;
      }
    }
  `]
})
export class RecordVehicularDialogComponent {
  data: Vehiculo360Response = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<RecordVehicularDialogComponent>);

  fechaActual = new Date();

  cerrar(): void {
    this.dialogRef.close();
  }

  imprimir(): void {
    window.print();
  }

  descargarPdf(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const v = this.data;
    const dt = v.datos_tecnicos;
    const norm = v.normativa_mtc;
    const sit = v.situacion_actual;
    const mod = v.modalidad_placa;

    // Encabezado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('GOBIERNO REGIONAL PUNO', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('DIRECCIÓN REGIONAL DE TRANSPORTES Y COMUNICACIONES', 105, 20, { align: 'center' });
    doc.setFontSize(9);
    doc.text('SUBDIRECCIÓN DE TRANSPORTE TERRESTRE', 105, 25, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Área de Habilitaciones e Inspección Vehicular', 105, 29, { align: 'center' });

    // Línea divisoria
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(15, 32, 195, 32);

    // Título Documento
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`HOJA DE VIDA Y RÉCORD VEHICULAR - ${v.placa}`, 105, 40, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Expediente N° ${v.placa}-${new Date().getFullYear()}-DRTC-PUNO  |  Modalidad: ${mod?.nombre || 'Transporte Regular'}`, 105, 45, { align: 'center' });

    let currentY = 50;

    // I. DATOS TÉCNICOS
    (doc as any).autoTable({
      startY: currentY,
      theme: 'grid',
      head: [['I. ESPECIFICACIONES TÉCNICAS (SUNARP / MTC D.S. Nº 058-2003-MTC)', '', '', '']],
      body: [
        ['Placa de Rodaje:', v.placa, 'Modalidad de Servicio:', `${mod?.nombre} (Franja ${mod?.color_nombre})`],
        ['Marca:', dt?.marca || '-', 'Modelo:', dt?.modelo || '-'],
        ['Año Fabricación:', `${dt?.anio_fabricacion || '-'}`, 'Año Modelo:', `${dt?.anio_modelo || '-'}`],
        ['Categoría MTC:', dt?.categoria || '-', 'Carrocería:', dt?.carroceria || '-'],
        ['Número de Motor:', dt?.numero_motor || '-', 'VIN / Chasis / Serie:', dt?.vin || '-'],
        ['Combustible:', dt?.combustible || '-', 'Color:', dt?.color || '-'],
        ['Asientos / Pasajeros:', `${dt?.numero_asientos ?? '-'} asientos / ${dt?.numero_pasajeros ?? '-'} pasajeros`, 'Pesos (Neto / Bruto):', `${dt?.peso_neto || '-'} Tn / ${dt?.peso_bruto || '-'} Tn`],
        ['Dimensiones (L x A x H):', `${dt?.longitud || '-'}m x ${dt?.ancho || '-'}m x ${dt?.altura || '-'}m`, 'Ejes / Ruedas:', `${dt?.numero_ejes || '-'} ejes / ${dt?.numero_ruedas || '-'} ruedas`]
      ],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'left' },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 38 },
        1: { cellWidth: 54 },
        2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 42 },
        3: { cellWidth: 46 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;

    // II. EVALUACIÓN NORMATIVA Y RÉGIMEN PUNO
    const punoRows = [];
    punoRows.push(['Antigüedad Actual:', `${norm?.antiguedad_anios ?? '-'} años`, 'Marco Legal Aplicable:', norm?.norma_aplicable || 'RENAT (D.S. 017-2009-MTC)']);
    
    if (norm?.regimen_puno?.aplica_cronograma_puno) {
      punoRows.push([
        'Régimen Extraordinario Puno:',
        `R.M. N.° 585-2021-MTC/01 (Fecha de Retiro: 31/12/${norm.regimen_puno.fecha_retiro_puno})`,
        'Dictamen Técnico:',
        norm.regimen_puno.estado_puno
      ]);
      punoRows.push([
        'Condición Legal Obligatoria:',
        norm.regimen_puno.condicion_citv_obligatoria,
        'Diagnóstico DRTC Puno:',
        norm.regimen_puno.mensaje_puno
      ]);
    } else {
      punoRows.push([
        'Régimen de Permanencia:',
        `Régimen Nacional RENAT (D.S. 017-2009-MTC, límite 15 años - Año límite: ${norm?.anio_limite_salida_rnat || 'S/D'})`,
        'Dictamen MTC:',
        norm?.dictamen_final || '-'
      ]);
    }

    (doc as any).autoTable({
      startY: currentY,
      theme: 'grid',
      head: [['II. EVALUACIÓN DE PERMANENCIA (R.M. N.° 585-2021-MTC/01 & RENAT D.S. 017-2009-MTC)', '', '', '']],
      body: punoRows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'left' },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 38 },
        1: { cellWidth: 54 },
        2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 42 },
        3: { cellWidth: 46 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;

    // III. SITUACIÓN ADMINISTRATIVA
    const resPrim = sit?.resolucion_primigenia_info;
    const vigenciaResStr = resPrim?.fecha_fin_vigencia ?
      `${resPrim.estado_vigencia || 'VIGENTE'} (Vence: ${resPrim.fecha_fin_vigencia.slice(0, 10)}${resPrim.dias_restantes != null ? ` - ${resPrim.dias_restantes} días rest.` : ''})` :
      (sit?.resolucion_primigenia ? 'Vigencia según acto administrativo' : 'No registrada');

    const compat = sit?.evaluacion_permanencia_vs_resolucion || v.evaluacion_permanencia_vs_resolucion;
    const compatStr = compat ?
      `[${compat.tipo_evaluacion.replace(/_/g, ' ')}] ${compat.mensaje}` :
      'Evaluación de permanencia y concesión sin observaciones.';
    const esCritico = compat ? !compat.es_compatible : false;

    let rutaDescripcion = 'Ruta amparada bajo concesión matriz';
    if (sit?.rutas_detalladas && sit.rutas_detalladas.length > 0) {
      rutaDescripcion = sit.rutas_detalladas.map(r => {
        let line = `• RUTA ${r.codigo_ruta}: ${r.origen} ➔ ${r.destino}`;
        if (r.frecuencia) line += ` | Frec: ${r.frecuencia}`;
        if (r.itinerario && r.itinerario.length > 0) line += ` | Itinerario: ${r.itinerario.join(', ')}`;
        return line;
      }).join('\n');
    } else if (sit?.rutas_autorizadas?.length) {
      rutaDescripcion = sit.rutas_autorizadas.join(', ');
    }

    (doc as any).autoTable({
      startY: currentY,
      theme: 'grid',
      head: [['III. SITUACIÓN ADMINISTRATIVA Y HABILITACIÓN VIGENTE', '', '', '']],
      body: [
        ['Empresa Concesionaria:', sit?.empresa_actual || '-', 'RUC Empresa:', sit?.ruc_empresa_actual || '-'],
        ['Resolución Primigenia:', sit?.resolucion_primigenia || '-', 'Vigencia Res. Primigenia:', vigenciaResStr],
        ['Tarjeta TUC Activa:', sit?.tuc_actual?.numero_tuc || 'SIN TUC', 'Vigencia de TUC:', `${sit?.tuc_actual?.estado || 'NO_VIGENTE'} ${sit?.tuc_actual?.fecha_vencimiento ? '(Vence: ' + sit.tuc_actual.fecha_vencimiento.slice(0, 10) + ')' : ''}`],
        ['Estado de Habilitación:', sit?.estado_habilitacion || '-', 'Última Res. Hija:', `${sit?.resolucion_hija || '-'} (${sit?.tipo_resolucion_hija || 'N/A'})`],
        ['Alerta Régimen vs Concesión:', { content: compatStr, colSpan: 3, styles: { fontStyle: 'italic', textColor: esCritico ? [185, 28, 28] : [15, 23, 42] } }],
        ['Rutas Autorizadas (Detalle):', { content: rutaDescripcion, colSpan: 3, styles: { cellPadding: 2 } }]
      ],
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'left' },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 40 },
        1: { cellWidth: 52 },
        2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 42 },
        3: { cellWidth: 46 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;

    // IV. HISTORIAL DE EMPRESAS OPERADORAS
    if (v.empresas_historicas && v.empresas_historicas.length > 0) {
      const empRows = v.empresas_historicas.map(emp => [
        emp.razon_social,
        emp.ruc,
        emp.resolucion_primigenia || '-',
        `${emp.es_operador_actual ? 'ACTUAL' : 'HISTÓRICO'} (${emp.ultimo_estado || '-'})`,
        `${emp.tipo_tramite ? emp.tipo_tramite + (emp.resolucion_tramite ? ' (' + emp.resolucion_tramite + ')' : '') : '-'}${emp.observaciones?.length ? ' - ' + emp.observaciones.join(', ') : ''}`
      ]);

      (doc as any).autoTable({
        startY: currentY,
        theme: 'grid',
        head: [['IV. HISTORIAL DE EMPRESAS CONCESIONARIAS Y TRANSFERENCIAS', '', '', '', '']],
        body: [
          ['Empresa Concesionaria', 'RUC', 'Concesión Matriz', 'Condición', 'Trámite / Observaciones'],
          ...empRows
        ],
        styles: { fontSize: 7, cellPadding: 1.8 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'left' },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 24 },
          2: { cellWidth: 26 },
          3: { cellWidth: 28 },
          4: { cellWidth: 47 }
        }
      });
      currentY = (doc as any).lastAutoTable.finalY + 5;
    }

    // V. HISTORIAL DE TRÁMITES
    const timelineBody = v.timeline_historial.slice(0, 8).map(ev => [
      ev.fecha ? ev.fecha.slice(0, 10) : 'Registrado',
      ev.titulo,
      ev.resolucion || '-',
      ev.empresa,
      ev.estado_resultado || '-'
    ]);

    if (timelineBody.length > 0) {
      (doc as any).autoTable({
        startY: currentY,
        theme: 'grid',
        head: [['V. HISTORIAL CRONOLÓGICO DE ACTOS RESOLUTIVOS', '', '', '', '']],
        body: [
          ['Fecha', 'Trámite / Acto Administrativo', 'Resolución', 'Empresa', 'Estado'],
          ...timelineBody
        ],
        styles: { fontSize: 7.5, cellPadding: 1.8 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'left' }
      });
      currentY = (doc as any).lastAutoTable.finalY + 12;
    } else {
      currentY += 10;
    }

    // Pie de firmas
    if (currentY > 250) {
      doc.addPage();
      currentY = 25;
    }

    doc.setFontSize(8);
    doc.line(25, currentY + 15, 80, currentY + 15);
    doc.text('SUBDIRECCIÓN DE TRANSPORTE TERRESTRE', 52.5, currentY + 19, { align: 'center' });
    doc.setFontSize(7);
    doc.text('DRTC - Gobierno Regional Puno', 52.5, currentY + 23, { align: 'center' });

    doc.setFontSize(8);
    doc.line(130, currentY + 15, 185, currentY + 15);
    doc.text('ÁREA DE HABILITACIONES VEHICULARES', 157.5, currentY + 19, { align: 'center' });
    doc.setFontSize(7);
    doc.text('DRTC - Gobierno Regional Puno', 157.5, currentY + 23, { align: 'center' });

    doc.setFontSize(7);
    doc.text(`Documento expedido por el Sistema SIRRET el ${new Date().toLocaleString('es-PE')}`, 105, 290, { align: 'center' });

    doc.save(`Record_Vehicular_${v.placa}_DRTC_PUNO.pdf`);
  }
}
