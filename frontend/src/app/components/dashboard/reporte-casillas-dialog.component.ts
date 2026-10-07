import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  DashboardService, 
  ReporteCasillasModalidadResponse, 
  ModalidadCasillaResumen,
  ModalidadConsolidadoResumen,
  ComparativoEstadoItem
} from '../../services/dashboard.service';

@Component({
  selector: 'app-reporte-casillas-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="reporte-modal-container">
      
      <!-- BARRA DE HERRAMIENTAS SUPERIOR (NO SE IMPRIME) -->
      <header class="reporte-topbar no-print">
        <div class="topbar-left">
          <div class="topbar-icon-box">
            <i class="material-icons-outlined">picture_as_pdf</i>
          </div>
          <div>
            <h2 class="topbar-title">Reporte Oficial de Casillas MTC (Formato A4)</h2>
            <p class="topbar-sub">D.S. N° 017-2009-MTC (RNAT) • R.D. N° 005-2025-MTC • Generación Directa en PDF</p>
          </div>
        </div>

        <div class="topbar-actions">
          <!-- BOTÓN PRINCIPAL: DESCARGAR PDF DIRECTO -->
          <button type="button" class="btn-topbar btn-pdf" (click)="descargarPdf()" [disabled]="cargando()" title="Descargar documento oficial directamente en archivo PDF (A4)">
            <i class="material-icons-outlined">picture_as_pdf</i>
            <span>Descargar PDF</span>
          </button>

          <!-- BOTÓN DE IMPRESIÓN AISLADA A4 -->
          <button type="button" class="btn-topbar btn-print" (click)="imprimirReporte()" [disabled]="cargando()" title="Imprimir reporte en hoja A4 (Vista aislada sin elementos web)">
            <i class="material-icons-outlined">print</i>
            <span>Imprimir en A4</span>
          </button>

          <!-- BOTÓN EXCEL -->
          <button type="button" class="btn-topbar btn-excel" (click)="exportarExcel()" [disabled]="cargando()" title="Exportar resumen y padrón en Microsoft Excel">
            <i class="material-icons-outlined">table_view</i>
            <span>Exportar Excel</span>
          </button>

          <!-- CERRAR -->
          <button type="button" class="btn-topbar-close" (click)="cerrar()" title="Cerrar vista">
            <i class="material-icons-outlined">close</i>
          </button>
        </div>
      </header>

      <!-- ÁREA DE CARGA -->
      @if (cargando()) {
        <div class="reporte-loading no-print">
          <div class="spinner-modern"></div>
          <p>Generando reporte oficial de Casillas MTC en formato A4...</p>
        </div>
      }

      <!-- ÁREA DE ERROR -->
      @if (error() && !cargando()) {
        <div class="reporte-error-box no-print">
          <i class="material-icons-outlined">error_outline</i>
          <p>{{ error() }}</p>
          <button type="button" class="btn-reintentar" (click)="cargarDatos()">Reintentar</button>
        </div>
      }

      <!-- HOJA OFICIAL A4 IMPRIMIBLE -->
      @if (datos() && !cargando()) {
        <div class="reporte-sheet-wrapper">
          <article class="reporte-sheet" id="hoja-reporte-casillas">
            
            <!-- MEMBRETE OFICIAL DRTC PUNO (LOGO A LA IZQUIERDA SUPERIOR COMPACTO) -->
            <header class="sheet-header">
              <div class="header-logo-side">
                <img 
                  src="assets/images/drtc-logo-dark.png" 
                  alt="DRTC Puno" 
                  class="drtc-logo-img"
                  (error)="usarLogoFallback($event)"
                />
              </div>

              <div class="header-text-side">
                <span class="inst-line-1">GOBIERNO REGIONAL PUNO</span>
                <span class="inst-line-2">DIRECCIÓN REGIONAL DE TRANSPORTES Y COMUNICACIONES</span>
                <span class="inst-line-3">SUBDIRECCIÓN DE TRANSPORTE TERRESTRE</span>
                <span class="inst-line-4">PADRÓN REGIONAL DE EMPRESAS DE TRANSPORTE TERRESTRE</span>
              </div>

              <div class="header-meta-side">
                <div class="meta-badge-doc">
                  <span class="meta-label">REPORTE TÉCNICO OFICIAL</span>
                  <span class="meta-code">CASILLA-MTC-{{ anioActual }}</span>
                </div>
                <div class="meta-date">
                  <span>{{ fechaFormateada() }}</span>
                </div>
              </div>
            </header>

            <div class="sheet-divider"></div>

            <!-- TÍTULO PRINCIPAL DEL DOCUMENTO -->
            <section class="sheet-title-section">
              <h1 class="sheet-main-title">REPORTE ESTADÍSTICO DE CASILLAS ELECTRÓNICAS MTC</h1>
              <h2 class="sheet-subtitle">
                TOTALES POR MODALIDAD DE SERVICIO Y CONDICIÓN DE AUTORIZACIÓN (ACTIVAS / CANCELADAS)
              </h2>
              <div class="sheet-legal-badge">
                <span>D.S. N° 017-2009-MTC (RNAT) • R.D. N° 005-2025-MTC • TUO DE LA LEY N° 27444</span>
              </div>
            </section>

            <!-- TARJETAS DE INDICADORES GLOBALES (KPI) -->
            <section class="sheet-kpi-grid">
              
              <div class="kpi-card kpi-total">
                <div class="kpi-top">
                  <span class="kpi-tag">UNIVERSO CONSIDERADO</span>
                  <i class="material-icons-outlined kpi-icon">directions_bus</i>
                </div>
                <div class="kpi-val">{{ datos()?.resumenGeneral?.totalEmpresas }}</div>
                <div class="kpi-desc">Total Empresas Registradas</div>
                <div class="kpi-foot">100% Padrón DRTC Puno</div>
              </div>

              <div class="kpi-card kpi-activas">
                <div class="kpi-top">
                  <span class="kpi-tag">EMPRESAS ACTIVAS</span>
                  <i class="material-icons-outlined kpi-icon">verified</i>
                </div>
                <div class="kpi-val text-primary">{{ datos()?.resumenGeneral?.totalAutorizadas }}</div>
                <div class="kpi-desc">Autorizadas Vigentes</div>
                <div class="kpi-foot">
                  <span class="badge-sub-green">{{ datos()?.resumenGeneral?.conCasillaAutorizadas }} Con Casilla ({{ datos()?.resumenGeneral?.porcentajeAutorizadas }}%)</span>
                </div>
              </div>

              <div class="kpi-card kpi-canceladas">
                <div class="kpi-top">
                  <span class="kpi-tag">EMPRESAS CANCELADAS</span>
                  <i class="material-icons-outlined kpi-icon">cancel</i>
                </div>
                <div class="kpi-val text-danger">{{ datos()?.resumenGeneral?.totalCanceladas }}</div>
                <div class="kpi-desc">Bajas Administrativas</div>
                <div class="kpi-foot">
                  <span class="badge-sub-amber">{{ datos()?.resumenGeneral?.conCasillaCanceladas }} Con Casilla ({{ datos()?.resumenGeneral?.porcentajeCanceladas }}%)</span>
                </div>
              </div>

              <div class="kpi-card kpi-cobertura">
                <div class="kpi-top">
                  <span class="kpi-tag">COBERTURA GLOBAL</span>
                  <i class="material-icons-outlined kpi-icon">mark_email_read</i>
                </div>
                <div class="kpi-val text-emerald">{{ datos()?.resumenGeneral?.porcentajeConCasilla }}%</div>
                <div class="kpi-desc">{{ datos()?.resumenGeneral?.conCasilla }} de {{ datos()?.resumenGeneral?.totalEmpresas }} con Casilla MTC</div>
                <div class="kpi-foot text-muted">
                  {{ datos()?.resumenGeneral?.sinCasilla }} Empresas Sin Casilla
                </div>
              </div>

            </section>

            <!-- CUADRO 1: COMPARATIVO POR ESTADO DE AUTORIZACIÓN (ACTIVAS VS CANCELADAS) -->
            <section class="sheet-table-section">
              <div class="table-section-title">
                <span class="sec-num">CUADRO N° 01:</span>
                <span class="sec-text">BALANCE GENERAL POR CONDICIÓN DE AUTORIZACIÓN (ACTIVAS VS. CANCELADAS)</span>
              </div>

              <table class="report-table">
                <thead>
                  <tr>
                    <th class="th-num">#</th>
                    <th class="th-text">Condición de la Empresa en el Padrón</th>
                    <th class="th-num">Total Empresas</th>
                    <th class="th-num text-emerald">Con Casilla MTC</th>
                    <th class="th-num text-rose">Sin Casilla MTC</th>
                    <th class="th-num">% Cobertura</th>
                    <th class="th-obs">Situación Administrativa / Fiscalización</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- FILA 1: AUTORIZADAS / ACTIVAS -->
                  <tr>
                    <td class="td-num">1</td>
                    <td class="td-text font-bold">
                      <span class="status-indicator-dot dot-active"></span>
                      EMPRESAS AUTORIZADAS (ACTIVAS)
                    </td>
                    <td class="td-num font-bold">{{ datos()?.resumenGeneral?.totalAutorizadas }}</td>
                    <td class="td-num text-emerald font-bold">{{ datos()?.resumenGeneral?.conCasillaAutorizadas }}</td>
                    <td class="td-num text-rose font-bold">{{ datos()?.resumenGeneral?.sinCasillaAutorizadas }}</td>
                    <td class="td-num font-bold">
                      <span class="pct-pill pill-green">{{ datos()?.resumenGeneral?.porcentajeAutorizadas }}%</span>
                    </td>
                    <td class="td-obs">Empresas habilitadas con autorización vigente para transporte regional</td>
                  </tr>

                  <!-- FILA 2: CANCELADAS -->
                  <tr>
                    <td class="td-num">2</td>
                    <td class="td-text font-bold text-gray-700">
                      <span class="status-indicator-dot dot-canceled"></span>
                      EMPRESAS CON AUTORIZACIÓN CANCELADA (BAJAS)
                    </td>
                    <td class="td-num font-bold">{{ datos()?.resumenGeneral?.totalCanceladas }}</td>
                    <td class="td-num text-emerald font-bold">{{ datos()?.resumenGeneral?.conCasillaCanceladas }}</td>
                    <td class="td-num text-rose font-bold">{{ datos()?.resumenGeneral?.sinCasillaCanceladas }}</td>
                    <td class="td-num font-bold">
                      <span class="pct-pill pill-amber">{{ datos()?.resumenGeneral?.porcentajeCanceladas }}%</span>
                    </td>
                    <td class="td-obs">Bajas administrativas registradas por resolución firme de cancelación</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="tr-total-general">
                    <td colspan="2" class="td-total-label">TOTAL GENERAL DEL PADRÓN</td>
                    <td class="td-num font-black">{{ datos()?.resumenGeneral?.totalEmpresas }}</td>
                    <td class="td-num text-emerald font-black">{{ datos()?.resumenGeneral?.conCasilla }}</td>
                    <td class="td-num text-rose font-black">{{ datos()?.resumenGeneral?.sinCasilla }}</td>
                    <td class="td-num font-black">
                      <span class="pct-pill pill-blue">{{ datos()?.resumenGeneral?.porcentajeConCasilla }}%</span>
                    </td>
                    <td class="td-obs font-medium">Padrón oficial consolidado de transporte regional - DRTC Puno</td>
                  </tr>
                </tfoot>
              </table>
            </section>

            <!-- CUADRO 2: EMPRESAS AUTORIZADAS (ACTIVAS) POR MODALIDAD (SIN CONTAR CANCELADAS) -->
            <section class="sheet-table-section">
              <div class="table-section-title">
                <span class="sec-num">CUADRO N° 02:</span>
                <span class="sec-text">EMPRESAS AUTORIZADAS (ACTIVAS) POR MODALIDAD DE SERVICIO</span>
              </div>

              <table class="report-table">
                <thead>
                  <tr>
                    <th class="th-num">#</th>
                    <th class="th-text">Modalidad de Servicio Autorizada</th>
                    <th class="th-num text-primary">Empresas Activas</th>
                    <th class="th-num text-emerald">Con Casilla MTC</th>
                    <th class="th-num text-rose">Sin Casilla MTC</th>
                    <th class="th-num">% Cobertura</th>
                    <th class="th-obs">Disposición Operativa</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of datos()?.modalidadesAutorizadas; track m.modalidad; let idx = $index) {
                    <tr>
                      <td class="td-num">{{ idx + 1 }}</td>
                      <td class="td-text font-bold">
                        <i class="material-icons-outlined table-row-icon no-print">{{ m.icono || 'directions_bus' }}</i>
                        {{ m.modalidadLabel }}
                      </td>
                      <td class="td-num font-bold text-primary">{{ m.total }}</td>
                      <td class="td-num text-emerald font-bold">{{ m.conCasilla }}</td>
                      <td class="td-num text-rose font-bold">{{ m.sinCasilla }}</td>
                      <td class="td-num">
                        <span class="pct-pill" [class.pill-green]="m.porcentajeConCasilla >= 50" [class.pill-amber]="m.porcentajeConCasilla < 50 && m.porcentajeConCasilla > 0" [class.pill-gray]="m.porcentajeConCasilla === 0">
                          {{ m.porcentajeConCasilla }}%
                        </span>
                      </td>
                      <td class="td-obs">
                        @if (m.conCasilla === m.total) {
                          100% habilitadas para notificación digital
                        } @else {
                          {{ m.sinCasilla }} empresas pendientes de afiliación MTC
                        }
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="tr-total-general">
                    <td colspan="2" class="td-total-label">SUBTOTAL EMPRESAS AUTORIZADAS (ACTIVAS)</td>
                    <td class="td-num font-black text-primary">{{ datos()?.resumenGeneral?.totalAutorizadas }}</td>
                    <td class="td-num text-emerald font-black">{{ datos()?.resumenGeneral?.conCasillaAutorizadas }}</td>
                    <td class="td-num text-rose font-black">{{ datos()?.resumenGeneral?.sinCasillaAutorizadas }}</td>
                    <td class="td-num font-black">
                      <span class="pct-pill pill-green">{{ datos()?.resumenGeneral?.porcentajeAutorizadas }}%</span>
                    </td>
                    <td class="td-obs font-medium">Padrón de empresas en operación activa</td>
                  </tr>
                </tfoot>
              </table>
            </section>

            <!-- CONSIDERACIONES TÉCNICAS Y MARCO NORMATIVO -->
            <section class="sheet-notes-section">
              <h3 class="notes-title">
                <i class="material-icons-outlined no-print">gavel</i>
                CONSIDERACIONES TÉCNICAS Y MARCO NORMATIVO
              </h3>
              <ol class="notes-list">
                <li>
                  <strong>Marco Normativo Aplicable:</strong> De conformidad con el <strong>D.S. N° 017-2009-MTC</strong> (Reglamento Nacional de Administración de Transporte - RNAT), la <strong>Resolución N° 005-2025-MTC</strong> y normas complementarias, la afiliación a la Casilla Electrónica del Ministerio de Transportes y Comunicaciones es de exigencia obligatoria para la notificación y seguimiento de los actos administrativos en el servicio de transporte terrestre.
                </li>
                <li>
                  <strong>Validez de Actos Notificados:</strong> Las <strong>{{ datos()?.resumenGeneral?.conCasillaAutorizadas }} empresas autorizadas con casilla habilitada</strong> están plenamente aptas para ser notificadas digitalmente de resoluciones, informes técnicos de flota, autorizaciones de rutas y requerimientos, con plena eficacia legal al día hábil siguiente del depósito (TUO Ley N° 27444).
                </li>
                <li>
                  <strong>Empresas Pendientes de Afiliación:</strong> Las <strong>{{ datos()?.resumenGeneral?.sinCasillaAutorizadas }} empresas autorizadas sin casilla electrónica</strong> deben culminar su trámite de afiliación en el portal oficial del MTC a fin de garantizar la debida notificación de actos administrativos.
                </li>
                <li>
                  <strong>Tratamiento de Canceladas y Exclusión de Infraestructura:</strong> Las <strong>{{ datos()?.resumenGeneral?.totalCanceladas }} empresas canceladas</strong> se segregan para reflejar con exactitud la capacidad operativa real del servicio en el departamento de Puno. No se incluye en este corte la infraestructura complementaria (terminales terrestres) por encontrarse en fase de actualización y validación de datos catastrales.
                </li>
              </ol>
            </section>

            <!-- PIE DE HOJA INSTITUCIONAL -->
            <div class="sheet-footer-bar">
              <span>DIRECCIÓN REGIONAL DE TRANSPORTES Y COMUNICACIONES DE PUNO • GOBIERNO REGIONAL PUNO</span>
              <span>PÁGINA 1 DE 1 • DOCUMENTO OFICIAL A4</span>
            </div>

          </article>
        </div>
      }

    </div>
  `,
  styles: [`
    /* =========================================================
       ESTILOS DEL MODAL (PANTALLA)
       ========================================================= */
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
    }

    .reporte-modal-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #0f172a;
      overflow: hidden;
    }

    /* TOPBAR */
    .reporte-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      padding: 0.75rem 1.4rem;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      z-index: 20;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .topbar-icon-box {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: #ffffff;
      border-radius: 0.6rem;
      box-shadow: 0 3px 8px rgba(220, 38, 38, 0.35);

      i { font-size: 1.4rem; }
    }

    .topbar-title {
      font-size: 1rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
    }

    .topbar-sub {
      font-size: 0.75rem;
      color: #94a3b8;
      margin: 0;
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }

    .btn-topbar {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 1.15rem;
      border-radius: 0.55rem;
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;

      i { font-size: 1.15rem; }
    }

    .btn-pdf {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.45);
      }
    }

    .btn-print {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.45);
      }
    }

    .btn-excel {
      background: #15803d;
      color: #ffffff;

      &:hover:not(:disabled) {
        background: #16a34a;
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(22, 163, 74, 0.35);
      }
    }

    .btn-topbar-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.3rem;
      height: 2.3rem;
      background: #334155;
      color: #cbd5e1;
      border: none;
      border-radius: 0.55rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #ef4444;
        color: #ffffff;
      }
    }

    /* LOADING & ERROR */
    .reporte-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      height: 100%;
      color: #94a3b8;
      font-size: 0.95rem;
    }

    .spinner-modern {
      width: 44px;
      height: 44px;
      border: 3.5px solid rgba(16, 185, 129, 0.2);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .reporte-error-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      height: 100%;
      color: #f87171;

      i { font-size: 2.5rem; }
    }

    .btn-reintentar {
      padding: 0.5rem 1rem;
      background: #334155;
      color: #f8fafc;
      border: 1px solid #475569;
      border-radius: 0.5rem;
      cursor: pointer;
    }

    /* CONTENEDOR DE LA HOJA */
    .reporte-sheet-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem 1rem;
      display: flex;
      justify-content: center;
      background: #0b1120;
    }

    /* HOJA A4 PRINCIPAL */
    .reporte-sheet {
      width: 100%;
      max-width: 900px;
      background: #ffffff;
      color: #1e293b;
      padding: 1.5rem 1.8rem;
      border-radius: 4px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
      margin-bottom: 2rem;
      box-sizing: border-box;
    }

    /* MEMBRETE (LOGO OFICIAL DRTC PUNO A LA IZQUIERDA EQUILIBRADO) */
    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.85rem;
      padding-bottom: 0.35rem;
    }

    .header-logo-side {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 175px;
      flex-shrink: 0;
    }

    .drtc-logo-img {
      max-height: 38px;
      max-width: 170px;
      width: auto;
      height: auto;
      object-fit: contain;
    }

    .header-text-side {
      flex: 1;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 1px;
      padding: 0 4px;
      min-width: 0;
    }

    .inst-line-1 {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.08em;
    }

    .inst-line-2 {
      font-size: 0.78rem;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: 0.03em;
    }

    .inst-line-3 {
      font-size: 0.72rem;
      font-weight: 600;
      color: #047857;
      letter-spacing: 0.03em;
    }

    .inst-line-4 {
      font-size: 0.65rem;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.02em;
    }

    .header-meta-side {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      width: 140px;
      flex-shrink: 0;
      gap: 2px;
    }

    .meta-badge-doc {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      background: #f1f5f9;
      padding: 2.5px 5px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }

    .meta-label {
      font-size: 0.58rem;
      font-weight: 800;
      color: #475569;
      letter-spacing: 0.04em;
    }

    .meta-code {
      font-size: 0.7rem;
      font-weight: 800;
      color: #0f172a;
    }

    .meta-date {
      font-size: 0.65rem;
      color: #64748b;
      font-weight: 600;
    }

    .sheet-divider {
      height: 2.5px;
      background: linear-gradient(90deg, #b91c1c 0%, #047857 50%, #0284c7 100%);
      margin: 0.3rem 0 0.7rem 0;
      border-radius: 2px;
    }

    /* TITULO */
    .sheet-title-section {
      text-align: center;
      margin-bottom: 0.8rem;
    }

    .sheet-main-title {
      font-size: 1.15rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.02em;
      margin: 0 0 3px 0;
    }

    .sheet-subtitle {
      font-size: 0.8rem;
      font-weight: 700;
      color: #047857;
      letter-spacing: 0.01em;
      margin: 0 0 4px 0;
    }

    .sheet-legal-badge {
      display: inline-block;
      font-size: 0.67rem;
      font-weight: 700;
      color: #334155;
      background: #f1f5f9;
      padding: 2.5px 9px;
      border-radius: 9999px;
      border: 1px solid #cbd5e1;
      letter-spacing: 0.02em;
    }

    /* KPI GRID */
    .sheet-kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.65rem;
      margin-bottom: 0.85rem;
    }

    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 0.5rem 0.65rem;
      display: flex;
      flex-direction: column;
    }

    .kpi-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .kpi-tag {
      font-size: 0.6rem;
      font-weight: 800;
      letter-spacing: 0.03em;
      color: #64748b;
    }

    .kpi-icon {
      font-size: 1rem;
      color: #94a3b8;
    }

    .kpi-val {
      font-size: 1.4rem;
      font-weight: 900;
      line-height: 1.1;
      margin-bottom: 2px;
      color: #0f172a;
    }

    .kpi-desc {
      font-size: 0.67rem;
      font-weight: 600;
      color: #475569;
    }

    .kpi-foot {
      font-size: 0.63rem;
      font-weight: 600;
      margin-top: 3px;
      padding-top: 3px;
      border-top: 1px dashed #e2e8f0;
    }

    .badge-sub-green {
      color: #047857;
      font-weight: 700;
    }

    .badge-sub-amber {
      color: #b45309;
      font-weight: 700;
    }

    .text-primary { color: #0284c7; }
    .text-danger { color: #dc2626; }
    .text-emerald { color: #059669; }
    .text-rose { color: #e11d48; }

    /* SECCIONES DE TABLAS */
    .sheet-table-section {
      margin-bottom: 0.85rem;
      page-break-inside: avoid;
    }

    .table-section-title {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin-bottom: 0.35rem;
      font-size: 0.79rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.02em;
    }

    .sec-num {
      color: #047857;
    }

    /* ESTILO DE TABLAS OFICIALES */
    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.77rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
    }

    .report-table th,
    .report-table td {
      border: 1px solid #cbd5e1;
      padding: 0.35rem 0.5rem;
      vertical-align: middle;
    }

    .report-table thead th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      font-size: 0.73rem;
      letter-spacing: 0.02em;
      text-align: center;
    }

    .th-num { text-align: center; width: 38px; }
    .th-text { text-align: left; }
    .th-obs { text-align: left; }

    .td-num { text-align: center; }
    .td-text { text-align: left; }
    .td-obs {
      text-align: left;
      font-size: 0.7rem;
      color: #475569;
    }

    .table-row-icon {
      font-size: 0.95rem;
      vertical-align: middle;
      margin-right: 4px;
      color: #047857;
    }

    .status-indicator-dot {
      display: inline-block;
      width: 7.5px;
      height: 7.5px;
      border-radius: 50%;
      margin-right: 5px;
    }

    .dot-active { background: #10b981; }
    .dot-canceled { background: #ef4444; }

    .pct-pill {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 0.69rem;
    }

    .pill-green {
      background: #d1fae5;
      color: #065f46;
    }

    .pill-amber {
      background: #fef3c7;
      color: #92400e;
    }

    .pill-gray {
      background: #f1f5f9;
      color: #64748b;
    }

    .pill-blue {
      background: #e0f2fe;
      color: #0369a1;
    }

    /* FILAS DE TOTALES */
    .tr-total-general {
      background: #e2e8f0;
      font-weight: 900;
    }

    .td-total-label {
      text-align: right;
      font-weight: 800;
      letter-spacing: 0.03em;
      padding-right: 0.75rem;
    }

    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .font-medium { font-weight: 500; }
    .text-gray-500 { color: #64748b; }
    .text-gray-700 { color: #334155; }

    /* NOTAS Y BASE LEGAL */
    .sheet-notes-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid #047857;
      border-radius: 4px;
      padding: 0.55rem 0.8rem;
      margin-bottom: 0.75rem;
      page-break-inside: avoid;
    }

    .notes-title {
      font-size: 0.74rem;
      font-weight: 800;
      color: #065f46;
      margin: 0 0 0.3rem 0;
      display: flex;
      align-items: center;
      gap: 4px;

      i { font-size: 0.95rem; }
    }

    .notes-list {
      margin: 0;
      padding-left: 1.1rem;
      font-size: 0.69rem;
      color: #334155;
      line-height: 1.38;

      li {
        margin-bottom: 2.5px;
      }
    }

    /* PIE DE HOJA */
    .sheet-footer-bar {
      border-top: 1px solid #cbd5e1;
      padding-top: 0.35rem;
      display: flex;
      justify-content: space-between;
      font-size: 0.63rem;
      color: #64748b;
      font-weight: 700;
      letter-spacing: 0.03em;
    }

    /* =========================================================
       REGLAS ESTRICTAS DE IMPRESIÓN Y PDF A4 (@media print)
       ========================================================= */
    @media print {
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }

      body, html {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        height: 100% !important;
        overflow: hidden !important;
      }

      .no-print {
        display: none !important;
      }

      .reporte-modal-container {
        display: block !important;
        background: #ffffff !important;
        height: auto !important;
        overflow: visible !important;
        padding: 0 !important;
      }

      .reporte-sheet-wrapper {
        display: block !important;
        padding: 0 !important;
        background: #ffffff !important;
        overflow: visible !important;
      }

      .reporte-sheet {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        margin: 0 !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
      }

      .report-table th,
      .report-table td {
        border-color: #475569 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .report-table thead th {
        background-color: #f1f5f9 !important;
        color: #000000 !important;
      }

      .tr-total-general {
        background-color: #e2e8f0 !important;
      }

      .pct-pill {
        border: 1px solid #64748b !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .sheet-notes-section {
        border-left: 3.5px solid #047857 !important;
        background-color: #f8fafc !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `]
})
export class ReporteCasillasDialogComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private dialogRef = inject(MatDialogRef<ReporteCasillasDialogComponent>);

  datos = signal<ReporteCasillasModalidadResponse | null>(null);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  anioActual = new Date().getFullYear();

  fechaFormateada = computed(() => {
    const raw = this.datos()?.fechaGeneracion;
    const d = raw ? new Date(raw) : new Date();
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  ngOnInit(): void {
    document.body.classList.add('modal-reporte-activo');
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-reporte-activo');
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.dashboardService.getReporteCasillasPorModalidad().subscribe({
      next: (resp) => {
        this.datos.set(resp);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar reporte de casillas:', err);
        this.error.set('No se pudo conectar con el servidor para obtener los datos de casillas.');
        this.cargando.set(false);
      }
    });
  }

  /**
   * Obtiene la imagen del logo oficial como Base64 de forma asíncrona y segura
   */
  private async getLogoBase64(): Promise<string | null> {
    const logoImg = document.querySelector('.drtc-logo-img') as HTMLImageElement;
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = logoImg.naturalWidth;
        canvas.height = logoImg.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(logoImg, 0, 0);
          return canvas.toDataURL('image/png');
        }
      } catch (err) {
        console.warn('Advertencia convirtiendo logo a canvas:', err);
      }
    }
    // Fallback: cargar mediante objeto Image
    try {
      return await new Promise<string | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 512;
            canvas.height = img.naturalHeight || 107;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
              return;
            }
          } catch { }
          resolve(null);
        };
        img.onerror = () => resolve(null);
        img.src = 'assets/images/drtc-logo-dark.png';
      });
    } catch {
      return null;
    }
  }

  /**
   * Generación DIRECTA de PDF oficial vectorizado en formato A4 con jsPDF
   * Sin intermediación del navegador ni contaminación visual del sitio web
   */
  async descargarPdf(): Promise<void> {
    const data = this.datos();
    if (!data) return;

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const marginX = 14;
      const contentWidth = pageWidth - (marginX * 2); // 182mm

      // Invocador compatible con autoTable en cualquier empaquetador (ESM / Vite / Webpack / CJS)
      const runAutoTable = (docInstance: any, options: any) => {
        if (typeof autoTable === 'function') {
          autoTable(docInstance, options);
        } else if ((autoTable as any)?.default && typeof (autoTable as any).default === 'function') {
          (autoTable as any).default(docInstance, options);
        } else if (typeof docInstance.autoTable === 'function') {
          docInstance.autoTable(options);
        } else {
          throw new Error('No se pudo inicializar la librería autoTable.');
        }
      };

      // 1. Logotipo oficial DRTC Puno (proporción óptima 38mm x 7.95mm, sin invadir el título institucional)
      try {
        const logoData = await this.getLogoBase64();
        if (logoData) {
          doc.addImage(logoData, 'PNG', marginX, 10.5, 38, 7.95);
        }
      } catch (e) {
        console.warn('No se pudo renderizar imagen en el PDF:', e);
      }

      // 2. Encabezado Institucional Central (Centrado exacto a 105mm)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('GOBIERNO REGIONAL PUNO', 105, 12, { align: 'center' });

      doc.setFontSize(8.5);
      doc.text('DIRECCIÓN REGIONAL DE TRANSPORTES Y COMUNICACIONES', 105, 16.5, { align: 'center' });

      doc.setFontSize(7.8);
      doc.setTextColor(4, 120, 87);
      doc.text('SUBDIRECCIÓN DE TRANSPORTE TERRESTRE', 105, 20.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text('PADRÓN REGIONAL DE EMPRESAS DE TRANSPORTE TERRESTRE', 105, 24, { align: 'center' });

      // 3. Cuadro de Metadatos (Derecha)
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(168, 10, 28, 14, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(71, 85, 105);
      doc.text('REPORTE OFICIAL', 182, 13.5, { align: 'center' });

      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      doc.text(`CASILLA-${this.anioActual}`, 182, 17.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(100, 116, 139);
      doc.text(this.fechaFormateada(), 182, 21.5, { align: 'center' });

      // 4. Línea divisoria tricolor
      doc.setDrawColor(185, 28, 28);
      doc.setLineWidth(0.6);
      doc.line(marginX, 26.5, marginX + 60, 26.5);

      doc.setDrawColor(4, 120, 87);
      doc.line(marginX + 60, 26.5, marginX + 120, 26.5);

      doc.setDrawColor(2, 132, 199);
      doc.line(marginX + 120, 26.5, marginX + contentWidth, 26.5);

      // 5. Título Principal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('REPORTE ESTADÍSTICO DE CASILLAS ELECTRÓNICAS MTC', 105, 33, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(4, 120, 87);
      doc.text('TOTALES POR MODALIDAD DE SERVICIO Y CONDICIÓN DE AUTORIZACIÓN (ACTIVAS / CANCELADAS)', 105, 38, { align: 'center' });

      // Badge normativo (D.S. 017-2009-MTC y R.D. 005-2025-MTC)
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(28, 41, 154, 5.5, 2.5, 2.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      doc.text('D.S. N° 017-2009-MTC (RNAT)  •  R.D. N° 005-2025-MTC  •  TUO DE LA LEY N° 27444', 105, 45, { align: 'center' });

      // 6. Tarjetas KPI
      const cardY = 49;
      const cardWidth = (contentWidth - 9) / 4; // ~43.25mm
      const cardHeight = 17;

      const kpis = [
        {
          tag: 'UNIVERSO TOTAL',
          val: `${data.resumenGeneral.totalEmpresas}`,
          desc: 'Total Empresas Padrón',
          foot: '100% DRTC Puno',
          color: [15, 23, 42]
        },
        {
          tag: 'EMPRESAS ACTIVAS',
          val: `${data.resumenGeneral.totalAutorizadas}`,
          desc: 'Autorizadas Vigentes',
          foot: `${data.resumenGeneral.conCasillaAutorizadas} Con Casilla (${data.resumenGeneral.porcentajeAutorizadas}%)`,
          color: [2, 132, 199]
        },
        {
          tag: 'EMPRESAS CANCELADAS',
          val: `${data.resumenGeneral.totalCanceladas}`,
          desc: 'Bajas Administrativas',
          foot: `${data.resumenGeneral.conCasillaCanceladas} Con Casilla (${data.resumenGeneral.porcentajeCanceladas}%)`,
          color: [220, 38, 38]
        },
        {
          tag: 'COBERTURA GLOBAL',
          val: `${data.resumenGeneral.porcentajeConCasilla}%`,
          desc: `${data.resumenGeneral.conCasilla} de ${data.resumenGeneral.totalEmpresas} Con Casilla`,
          foot: `${data.resumenGeneral.sinCasilla} Empresas Sin Casilla`,
          color: [5, 150, 105]
        }
      ];

      kpis.forEach((k, i) => {
        const x = marginX + (i * (cardWidth + 3));
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.8);
        doc.setTextColor(100, 116, 139);
        doc.text(k.tag, x + 3, cardY + 3.8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12.5);
        doc.setTextColor(k.color[0], k.color[1], k.color[2]);
        doc.text(k.val, x + 3, cardY + 9);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(71, 85, 105);
        doc.text(k.desc, x + 3, cardY + 12.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        doc.text(k.foot, x + 3, cardY + 15.5);
      });

      let currentY = cardY + cardHeight + 5; // ~71mm

      // 7. Cuadro 1: Balance General por Condición de Autorización
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(4, 120, 87);
      doc.text('CUADRO N° 01:', marginX, currentY);
      doc.setTextColor(15, 23, 42);
      doc.text('BALANCE GENERAL POR CONDICIÓN DE AUTORIZACIÓN (ACTIVAS VS. CANCELADAS)', marginX + 22, currentY);

      currentY += 2;

      runAutoTable(doc, {
        startY: currentY,
        theme: 'grid',
        margin: { left: marginX, right: marginX },
        head: [[
          '#',
          'Condición de la Empresa en el Padrón',
          'Total Empresas',
          'Con Casilla MTC',
          'Sin Casilla MTC',
          '% Cobertura',
          'Situación Administrativa / Fiscalización'
        ]],
        body: [
          [
            '1',
            'EMPRESAS AUTORIZADAS (ACTIVAS)',
            `${data.resumenGeneral.totalAutorizadas}`,
            `${data.resumenGeneral.conCasillaAutorizadas}`,
            `${data.resumenGeneral.sinCasillaAutorizadas}`,
            `${data.resumenGeneral.porcentajeAutorizadas}%`,
            'Empresas habilitadas con autorización vigente para transporte regional'
          ],
          [
            '2',
            'EMPRESAS CON AUTORIZACIÓN CANCELADA (BAJAS)',
            `${data.resumenGeneral.totalCanceladas}`,
            `${data.resumenGeneral.conCasillaCanceladas}`,
            `${data.resumenGeneral.sinCasillaCanceladas}`,
            `${data.resumenGeneral.porcentajeCanceladas}%`,
            'Bajas administrativas registradas por resolución firme de cancelación'
          ]
        ],
        foot: [[
          '',
          'TOTAL GENERAL DEL PADRÓN',
          `${data.resumenGeneral.totalEmpresas}`,
          `${data.resumenGeneral.conCasilla}`,
          `${data.resumenGeneral.sinCasilla}`,
          `${data.resumenGeneral.porcentajeConCasilla}%`,
          'Padrón oficial consolidado de transporte regional - DRTC Puno'
        ]],
        styles: {
          fontSize: 7.2,
          cellPadding: 2,
          textColor: [30, 41, 59],
          lineColor: [100, 116, 139],
          lineWidth: 0.2
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          halign: 'center'
        },
        footStyles: {
          fillColor: [226, 232, 240],
          textColor: [15, 23, 42],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { fontStyle: 'bold', cellWidth: 55 },
          2: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
          3: { halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 18 },
          4: { halign: 'center', fontStyle: 'bold', textColor: [225, 29, 72], cellWidth: 18 },
          5: { halign: 'center', fontStyle: 'bold', cellWidth: 17 },
          6: { cellWidth: 48, fontSize: 6.5, textColor: [71, 85, 105] }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 5;

      // 8. Cuadro 2: EMPRESAS AUTORIZADAS (ACTIVAS) POR MODALIDAD (SIN CONTAR CANCELADAS)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(4, 120, 87);
      doc.text('CUADRO N° 02:', marginX, currentY);
      doc.setTextColor(15, 23, 42);
      doc.text('EMPRESAS AUTORIZADAS (ACTIVAS) POR MODALIDAD DE SERVICIO', marginX + 22, currentY);

      currentY += 2;

      const bodyMod = data.modalidadesAutorizadas.map((m, idx) => [
        `${idx + 1}`,
        m.modalidadLabel,
        `${m.total}`,
        `${m.conCasilla}`,
        `${m.sinCasilla}`,
        `${m.porcentajeConCasilla}%`,
        m.conCasilla === m.total ? '100% habilitadas para notificación digital' : `${m.sinCasilla} empresas pendientes de afiliación MTC`
      ]);

      runAutoTable(doc, {
        startY: currentY,
        theme: 'grid',
        margin: { left: marginX, right: marginX },
        head: [[
          '#',
          'Modalidad de Servicio Autorizada',
          'Empresas Activas',
          'Con Casilla MTC',
          'Sin Casilla MTC',
          '% Cobertura',
          'Disposición Operativa'
        ]],
        body: bodyMod,
        foot: [[
          '',
          'SUBTOTAL EMPRESAS AUTORIZADAS (ACTIVAS)',
          `${data.resumenGeneral.totalAutorizadas}`,
          `${data.resumenGeneral.conCasillaAutorizadas}`,
          `${data.resumenGeneral.sinCasillaAutorizadas}`,
          `${data.resumenGeneral.porcentajeAutorizadas}%`,
          'Padrón en operación activa'
        ]],
        styles: {
          fontSize: 7.2,
          cellPadding: 2,
          textColor: [30, 41, 59],
          lineColor: [100, 116, 139],
          lineWidth: 0.2
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          halign: 'center'
        },
        footStyles: {
          fillColor: [226, 232, 240],
          textColor: [15, 23, 42],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { fontStyle: 'bold', cellWidth: 55 },
          2: { halign: 'center', fontStyle: 'bold', textColor: [2, 132, 199], cellWidth: 20 },
          3: { halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 20 },
          4: { halign: 'center', fontStyle: 'bold', textColor: [225, 29, 72], cellWidth: 20 },
          5: { halign: 'center', fontStyle: 'bold', cellWidth: 19 },
          6: { cellWidth: 40, fontSize: 6.5, textColor: [71, 85, 105] }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 5;

      // 9. Consideraciones Técnicas y Marco Legal
      const notesBoxHeight = 35;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, currentY, contentWidth, notesBoxHeight, 1.5, 1.5, 'FD');

      // Barra lateral verde
      doc.setFillColor(4, 120, 87);
      doc.rect(marginX, currentY, 1.8, notesBoxHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(6, 95, 70);
      doc.text('CONSIDERACIONES TÉCNICAS Y MARCO NORMATIVO', marginX + 4, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);

      const notas = [
        '1. Marco Normativo: Conforme al D.S. N° 017-2009-MTC (RNAT), R.D. N° 005-2025-MTC y TUO Ley N° 27444, la afiliación a la Casilla Electrónica del MTC es obligatoria para las empresas de transporte.',
        `2. Validez de Actos: Las ${data.resumenGeneral.conCasillaAutorizadas} empresas autorizadas con casilla habilitada están 100% aptas para la notificación digital de actos administrativos y resoluciones.`,
        `3. Regularización: Las ${data.resumenGeneral.sinCasillaAutorizadas} empresas autorizadas sin casilla deben culminar su afiliación en el portal oficial del MTC para no afectar sus trámites.`,
        `4. Canceladas y Exclusión: Las ${data.resumenGeneral.totalCanceladas} empresas canceladas se segregan para fines de fiscalización posterior y archivo. No se incluye infraestructura complementaria por actualización de datos catastrales.`
      ];

      let noteY = currentY + 9;
      notas.forEach((nt) => {
        const splitText = doc.splitTextToSize(nt, contentWidth - 8);
        doc.text(splitText, marginX + 4, noteY);
        noteY += (splitText.length * 3.4) + 1;
      });

      // 10. Pie de Página Institucional
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(marginX, 287, marginX + contentWidth, 287);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('DIRECCIÓN REGIONAL DE TRANSPORTES Y COMUNICACIONES DE PUNO  •  GOBIERNO REGIONAL PUNO', marginX, 291);
      doc.text('PÁGINA 1 DE 1  •  DOCUMENTO OFICIAL A4', marginX + contentWidth, 291, { align: 'right' });

      // Descarga directa del archivo PDF
      doc.save(`DRTC_PUNO_Reporte_Casillas_MTC_A4_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generando documento PDF:', error);
      alert('Ocurrió un error al generar el archivo PDF. Revise la consola del navegador.');
    }
  }

  /**
   * Impresión Aislada en Hoja A4 mediante iframe temporal
   * Garantiza que NINGÚN elemento del sitio web aparezca en la impresión ni en el PDF del navegador
   */
  imprimirReporte(): void {
    const sheetEl = document.getElementById('hoja-reporte-casillas');
    if (!sheetEl) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>DRTC Puno - Reporte Estadístico de Casillas Electrónicas MTC (A4)</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #1e293b !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .reporte-sheet {
              width: 100%;
              max-width: 100%;
              background: #ffffff;
              padding: 0;
              margin: 0;
            }
            .sheet-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.75rem;
              padding-bottom: 0.35rem;
            }
            .header-logo-side {
              width: 175px;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: flex-start;
            }
            .drtc-logo-img {
              max-height: 38px;
              max-width: 170px;
              width: auto;
              height: auto;
              object-fit: contain;
            }
            .header-text-side {
              flex: 1;
              text-align: center;
              display: flex;
              flex-direction: column;
              gap: 1px;
              padding: 0 4px;
              min-width: 0;
            }
            .inst-line-1 { font-size: 0.95rem; font-weight: 800; color: #0f172a; letter-spacing: 0.08em; }
            .inst-line-2 { font-size: 0.78rem; font-weight: 700; color: #1e293b; letter-spacing: 0.03em; }
            .inst-line-3 { font-size: 0.72rem; font-weight: 600; color: #047857; letter-spacing: 0.03em; }
            .inst-line-4 { font-size: 0.65rem; font-weight: 600; color: #64748b; letter-spacing: 0.02em; }
            .header-meta-side {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              width: 140px;
              flex-shrink: 0;
              gap: 2px;
            }
            .meta-badge-doc {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              background: #f1f5f9;
              padding: 2.5px 5px;
              border-radius: 4px;
              border: 1px solid #cbd5e1;
            }
            .meta-label { font-size: 0.58rem; font-weight: 800; color: #475569; }
            .meta-code { font-size: 0.7rem; font-weight: 800; color: #0f172a; }
            .meta-date { font-size: 0.65rem; color: #64748b; font-weight: 600; }
            .sheet-divider {
              height: 2.5px;
              background: linear-gradient(90deg, #b91c1c 0%, #047857 50%, #0284c7 100%);
              margin: 0.3rem 0 0.7rem 0;
            }
            .sheet-title-section { text-align: center; margin-bottom: 0.8rem; }
            .sheet-main-title { font-size: 1.15rem; font-weight: 900; color: #0f172a; margin: 0 0 3px 0; }
            .sheet-subtitle { font-size: 0.8rem; font-weight: 700; color: #047857; margin: 0 0 4px 0; }
            .sheet-legal-badge {
              display: inline-block;
              font-size: 0.67rem;
              font-weight: 700;
              color: #334155;
              background: #f1f5f9;
              padding: 2.5px 9px;
              border-radius: 9999px;
              border: 1px solid #cbd5e1;
            }
            .sheet-kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 0.65rem;
              margin-bottom: 0.85rem;
            }
            .kpi-card {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              padding: 0.5rem 0.65rem;
            }
            .kpi-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
            .kpi-tag { font-size: 0.6rem; font-weight: 800; color: #64748b; }
            .kpi-icon { display: none; }
            .kpi-val { font-size: 1.4rem; font-weight: 900; color: #0f172a; margin-bottom: 2px; }
            .kpi-desc { font-size: 0.67rem; font-weight: 600; color: #475569; }
            .kpi-foot { font-size: 0.63rem; font-weight: 600; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #cbd5e1; }
            .badge-sub-green { color: #047857; font-weight: 700; }
            .badge-sub-amber { color: #b45309; font-weight: 700; }
            .text-primary { color: #0284c7; }
            .text-danger { color: #dc2626; }
            .text-emerald { color: #059669; }
            .text-rose { color: #e11d48; }
            .sheet-table-section { margin-bottom: 0.85rem; page-break-inside: avoid; }
            .table-section-title {
              display: flex;
              align-items: center;
              gap: 0.45rem;
              margin-bottom: 0.35rem;
              font-size: 0.79rem;
              font-weight: 800;
              color: #0f172a;
            }
            .sec-num { color: #047857; }
            .report-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.76rem;
              border: 1px solid #475569;
            }
            .report-table th, .report-table td {
              border: 1px solid #475569;
              padding: 0.35rem 0.5rem;
              vertical-align: middle;
            }
            .report-table thead th {
              background: #f1f5f9 !important;
              color: #0f172a !important;
              font-weight: 800;
              font-size: 0.73rem;
              text-align: center;
            }
            .th-num { text-align: center; width: 35px; }
            .th-text { text-align: left; }
            .th-obs { text-align: left; }
            .td-num { text-align: center; }
            .td-text { text-align: left; }
            .td-obs { text-align: left; font-size: 0.7rem; color: #475569; }
            .status-indicator-dot {
              display: inline-block;
              width: 7px;
              height: 7px;
              border-radius: 50%;
              margin-right: 5px;
            }
            .dot-active { background: #10b981; }
            .dot-canceled { background: #ef4444; }
            .pct-pill {
              display: inline-block;
              padding: 1px 5px;
              border-radius: 9999px;
              font-weight: 800;
              font-size: 0.68rem;
              border: 1px solid #64748b;
            }
            .pill-green { background: #d1fae5; color: #065f46; }
            .pill-amber { background: #fef3c7; color: #92400e; }
            .pill-gray { background: #f1f5f9; color: #64748b; }
            .pill-blue { background: #e0f2fe; color: #0369a1; }
            .tr-total-general { background: #e2e8f0 !important; font-weight: 900; }
            .td-total-label { text-align: right; font-weight: 800; padding-right: 0.75rem; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .font-medium { font-weight: 500; }
            .sheet-notes-section {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-left: 3.5px solid #047857;
              border-radius: 4px;
              padding: 0.55rem 0.8rem;
              margin-bottom: 0.75rem;
              page-break-inside: avoid;
            }
            .notes-title { font-size: 0.74rem; font-weight: 800; color: #065f46; margin: 0 0 0.3rem 0; }
            .notes-list { margin: 0; padding-left: 1.1rem; font-size: 0.69rem; color: #334155; line-height: 1.38; }
            .notes-list li { margin-bottom: 2px; }
            .sheet-footer-bar {
              border-top: 1px solid #cbd5e1;
              padding-top: 0.35rem;
              display: flex;
              justify-content: space-between;
              font-size: 0.63rem;
              color: #64748b;
              font-weight: 700;
            }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          ${sheetEl.outerHTML}
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2500);
    }, 300);
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  usarLogoFallback(event: any): void {
    event.target.src = 'assets/logo.png';
  }

  exportarExcel(): void {
    const data = this.datos();
    if (!data) return;

    const wb = XLSX.utils.book_new();

    const resumenRows = [
      ['GOBIERNO REGIONAL PUNO - DIRECCIÓN REGIONAL DE TRANSPORTES Y COMUNICACIONES'],
      ['SUBDIRECCIÓN DE TRANSPORTE TERRESTRE'],
      ['REPORTE ESTADÍSTICO DE CASILLAS ELECTRÓNICAS MTC - TOTALES CONSOLIDADOS'],
      ['Marco Normativo:', 'D.S. N° 017-2009-MTC (RNAT) - R.D. N° 005-2025-MTC - TUO Ley N° 27444'],
      ['Fecha de Emisión:', this.fechaFormateada()],
      [],
      ['INDICADOR GLOBAL', 'CANTIDAD', 'PORCENTAJE / COBERTURA'],
      ['Total Universo Considerado', data.resumenGeneral.totalEmpresas, '100%'],
      ['Empresas Autorizadas (Activas)', data.resumenGeneral.totalAutorizadas, `${data.resumenGeneral.porcentajeAutorizadas}% Con Casilla`],
      ['Empresas con Autorización Cancelada (Bajas)', data.resumenGeneral.totalCanceladas, `${data.resumenGeneral.porcentajeCanceladas}% Con Casilla`],
      ['Total Casillas Habilitadas MTC', data.resumenGeneral.conCasilla, `${data.resumenGeneral.porcentajeConCasilla}% de Cobertura`],
      ['Total Empresas Sin Casilla MTC', data.resumenGeneral.sinCasilla, `${round((data.resumenGeneral.sinCasilla / data.resumenGeneral.totalEmpresas) * 100, 1)}%`],
      [],
      ['CUADRO 1: BALANCE POR CONDICIÓN DE AUTORIZACIÓN'],
      ['Condición / Estado', 'Total Empresas', 'Con Casilla MTC', 'Sin Casilla MTC', '% Cobertura', 'Observación'],
      ...data.comparativoEstados.map(e => [
        e.estadoLabel,
        e.total,
        e.conCasilla,
        e.sinCasilla,
        `${e.porcentajeConCasilla}%`,
        e.observacion
      ]),
      [],
      ['CUADRO 2: EMPRESAS AUTORIZADAS (ACTIVAS) POR MODALIDAD'],
      ['Modalidad de Servicio', 'Total Activas', 'Con Casilla MTC', 'Sin Casilla MTC', '% Cobertura'],
      ...data.modalidadesAutorizadas.map(m => [
        m.modalidadLabel,
        m.total,
        m.conCasilla,
        m.sinCasilla,
        `${m.porcentajeConCasilla}%`
      ]),
      ['SUBTOTAL ACTIVAS', data.resumenGeneral.totalAutorizadas, data.resumenGeneral.conCasillaAutorizadas, data.resumenGeneral.sinCasillaAutorizadas, `${data.resumenGeneral.porcentajeAutorizadas}%`]
    ];

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Estadístico');

    if (data.empresas && data.empresas.length > 0) {
      const empresasRows = data.empresas.map((e: any, idx: number) => ({
        '#': idx + 1,
        'RUC': e.ruc,
        'Razón Social': e.razonSocial,
        'Estado': e.estado,
        'Modalidad': e.modalidadPrincipal,
        'Tiene Casilla MTC': e.tieneCasilla ? 'SÍ' : 'NO',
        'Estado Casilla': e.estadoCasilla,
        'Fecha Validación': e.fechaValidacion || 'Pendiente',
        'Teléfono': e.telefonoContacto || '',
        'Email': e.emailContacto || ''
      }));
      const wsEmpresas = XLSX.utils.json_to_sheet(empresasRows);
      XLSX.utils.book_append_sheet(wb, wsEmpresas, 'Padron Empresas');
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `DRTC_PUNO_Reporte_Totales_Casillas_MTC_${timestamp}.xlsx`);
  }
}

function round(val: number, dec = 1): number {
  const p = Math.pow(10, dec);
  return Math.round(val * p) / p;
}
