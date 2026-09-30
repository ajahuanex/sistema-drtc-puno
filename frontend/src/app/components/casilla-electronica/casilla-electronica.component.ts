import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { CasillaService } from '../../services/casilla.service';
import {
  EstadoCasilla,
  InfoCasillaData,
  ConsultaCasillaHistorial,
  Toast
} from '../../models/casilla.models';

@Component({
  selector: 'app-casilla-electronica',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="casilla-page-container">
      <!-- Toasts de feedback -->
      <div class="casilla-toasts">
        @for (t of toasts(); track t.id) {
          <div class="toast-item" [class]="'toast--' + t.tipo">
            <mat-icon class="toast-icon">
              {{ t.tipo === 'exito' ? 'check_circle' : t.tipo === 'error' ? 'error' : 'info' }}
            </mat-icon>
            <span class="toast-text">{{ t.mensaje }}</span>
            <button type="button" class="toast-close" (click)="cerrarToast(t.id)">✕</button>
          </div>
        }
      </div>

      <!-- Header del Módulo -->
      <div class="casilla-header">
        <div class="header-titles">
          <div class="badge-title">
            <span class="live-pulse"></span>
            <span>MTC • DRTC Puno</span>
          </div>
          <h1>Verificación de Casilla Electrónica</h1>
          <p>Consulta en tiempo real la validez y estado de la casilla electrónica de administrados y empresas.</p>
        </div>

        <div class="header-actions">
          <button
            mat-stroked-button
            color="primary"
            class="header-btn"
            (click)="limpiarFormulario()"
            [disabled]="estadoCasilla() === 'verificando'"
          >
            <mat-icon>refresh</mat-icon>
            Nueva Consulta
          </button>
        </div>
      </div>

      <div class="casilla-grid-layout">
        <!-- Panel Izquierdo: Formulario de Verificación -->
        <mat-card class="form-card">
          <div class="card-header-stitch">
            <div class="icon-circle">
              <mat-icon>mark_email_read</mat-icon>
            </div>
            <div>
              <h3>Criterios del Administrado</h3>
              <p>Ingrese los datos de identificación para consultar el padrón oficial</p>
            </div>
          </div>

          <mat-card-content class="form-card-content">
            <!-- Selector rápido de Modo: RUC vs DNI -->
            <div class="mode-selector-pills">
              <button
                type="button"
                class="mode-pill"
                [class.active]="consultaForm.get('codTipoDocumento')?.value === '00001'"
                (click)="seleccionarModo('RUC')"
              >
                <mat-icon class="pill-icon">business</mat-icon>
                <span>RUC (Empresas / Jurídica)</span>
              </button>
              <button
                type="button"
                class="mode-pill"
                [class.active]="consultaForm.get('codTipoDocumento')?.value === '00002'"
                (click)="seleccionarModo('DNI')"
              >
                <mat-icon class="pill-icon">person</mat-icon>
                <span>DNI (Persona Natural)</span>
              </button>
            </div>

            <form [formGroup]="consultaForm" (ngSubmit)="verificarCasilla()" class="consulta-form">
              <div class="form-row-2">
                <!-- Tipo de Documento (RUC y DNI siempre visibles) -->
                <mat-form-field appearance="outline">
                  <mat-label>Tipo de Documento</mat-label>
                  <mat-select formControlName="codTipoDocumento" (selectionChange)="onTipoDocumentoChange($event.value)">
                    @for (doc of catalogoDocumentos; track doc.codigo) {
                      <mat-option [value]="doc.codigo">
                        <div class="select-option-row">
                          <mat-icon class="opt-icon">{{ doc.icono }}</mat-icon>
                          <span>{{ doc.nombre }}</span>
                        </div>
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <!-- Tipo de Persona (Sincronizado) -->
                <mat-form-field appearance="outline">
                  <mat-label>Tipo de Persona</mat-label>
                  <mat-select formControlName="codTipoPersona">
                    <mat-option value="00002">
                      <div class="select-option-row">
                        <mat-icon class="opt-icon">business</mat-icon>
                        <span>Persona Jurídica</span>
                      </div>
                    </mat-option>
                    <mat-option value="00001">
                      <div class="select-option-row">
                        <mat-icon class="opt-icon">person</mat-icon>
                        <span>Persona Natural</span>
                      </div>
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Nro de Documento -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>N° de {{ labelDocumentoActual() }}</mat-label>
                <input
                  matInput
                  formControlName="nroDocumento"
                  [placeholder]="placeholderDocumento()"
                  [maxlength]="maxlengthDocumento()"
                  (input)="onNroDocumentoInput($event)"
                  (keyup.enter)="verificarCasilla()"
                  autocomplete="off"
                />
                <mat-icon matSuffix class="input-suffix-icon">
                  {{ consultaForm.get('codTipoDocumento')?.value === '00001' ? 'domain' : 'badge' }}
                </mat-icon>
                @if (consultaForm.get('nroDocumento')?.hasError('required') && consultaForm.get('nroDocumento')?.touched) {
                  <mat-error>El número de documento es obligatorio</mat-error>
                } @else if (consultaForm.get('nroDocumento')?.hasError('minlength') && consultaForm.get('nroDocumento')?.touched) {
                  <mat-error>Mínimo {{ minlengthDocumento() }} dígitos requeridos</mat-error>
                }
              </mat-form-field>


              <!-- Atajos rápidos -->
              <div class="quick-examples">
                <span class="quick-label">Ejemplos para probar:</span>
                <button
                  type="button"
                  class="chip-quick"
                  (click)="setEjemplo('00001', '00002', '40123456')"
                >
                  DNI 40123456
                </button>
                <button
                  type="button"
                  class="chip-quick"
                  (click)="setEjemplo('00002', '00001', '20601234567')"
                >
                  RUC 20601234567
                </button>
              </div>

              <!-- Botones de Acción -->
              <div class="form-actions">
                <button
                  mat-flat-button
                  color="primary"
                  type="submit"
                  class="submit-btn"
                  [disabled]="consultaForm.invalid || estadoCasilla() === 'verificando'"
                >
                  @if (estadoCasilla() === 'verificando') {
                    <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
                    <span>Consultando MTC / DRTC...</span>
                  } @else {
                    <mat-icon>search</mat-icon>
                    <span>Verificar Casilla Electrónica</span>
                  }
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Panel Derecho: Estado & Resultado en Tiempo Real -->
        <div class="result-column">
          <!-- Tarjeta de Estado / Resultado -->
          <mat-card class="result-card" [class]="'result-card--' + estadoCasilla()">
            <div class="result-card-inner">
              @if (estadoCasilla() === 'pendiente') {
                <div class="state-empty">
                  <div class="empty-icon-wrap">
                    <mat-icon>mail_outline</mat-icon>
                  </div>
                  <h4>Esperando consulta</h4>
                  <p>Ingrese el tipo y número de documento del administrado para verificar si cuenta con casilla electrónica registrada y activa.</p>
                  <div class="law-note">
                    <mat-icon class="law-icon">gavel</mat-icon>
                    <span>Conforme al Art. 20° y 24° del TUO de la Ley N° 27444 y el D.S. N° 002-2020-MTC.</span>
                  </div>
                </div>
              }

              @if (estadoCasilla() === 'verificando') {
                <div class="state-loading">
                  <mat-spinner diameter="48"></mat-spinner>
                  <h4>Consultando servicio de Casillas</h4>
                  <p>Conectando con el servidor central de la Dirección Regional de Transportes y Comunicaciones Puno...</p>
                  <span class="loading-sub">Verificando en API Node-RED MTC</span>
                </div>
              }

              @if (estadoCasilla() === 'activo') {
                <div class="state-success">
                  <div class="status-top-badge badge-active">
                    <mat-icon>verified</mat-icon>
                    <span>CASILLA ELECTRÓNICA ACTIVA</span>
                  </div>

                  <h3 class="admin-name">{{ datosCasilla()?.nombreCompleto || 'Administrado Verificado' }}</h3>
                  
                  <div class="info-list">
                    <div class="info-item">
                      <span class="info-label">Documento:</span>
                      <span class="info-value font-mono">{{ consultaForm.value.nroDocumento }} ({{ getTipoDocNombre(consultaForm.value.codTipoDocumento) }})</span>
                    </div>

                    @if (datosCasilla()?.email) {
                      <div class="info-item">
                        <span class="info-label">Correo Asociado:</span>
                        <span class="info-value">{{ datosCasilla()?.email }}</span>
                      </div>
                    }

                    <div class="info-item">
                      <span class="info-label">Estado Legal:</span>
                      <span class="info-value text-emerald-400 font-semibold">Habilitada para Notificaciones Electrónicas</span>
                    </div>
                  </div>

                  <div class="alert-box alert-success">
                    <mat-icon>check_circle</mat-icon>
                    <div>
                      <strong>Apto para notificación oficial:</strong> Los actos administrativos y resoluciones directorales notificados surten efecto legal válido a partir de su depósito en esta casilla.
                    </div>
                  </div>
                </div>
              }

              @if (estadoCasilla() === 'inactivo') {
                <div class="state-inactive">
                  <div class="status-top-badge badge-inactive">
                    <mat-icon>cancel</mat-icon>
                    <span>SIN CASILLA ELECTRÓNICA ACTIVA</span>
                  </div>

                  <h4>El administrado no registra casilla activa</h4>
                  <p class="inactive-desc">
                    El documento <strong>{{ consultaForm.value.nroDocumento }}</strong> no posee una casilla electrónica habilitada en la DRTC Puno.
                  </p>

                  <div class="alert-box alert-warn">
                    <mat-icon>warning</mat-icon>
                    <div>
                      <strong>Notificación Convencional Requerida:</strong> Al no contar con casilla electrónica, cualquier resolución o acto administrativo deberá notificarse mediante cédula física o correo certificado según el Art. 21° de la Ley N° 27444.
                    </div>
                  </div>

                  <a
                    href="https://facilita.transportespuno.gob.pe"
                    target="_blank"
                    class="portal-link-btn"
                  >
                    <span>Portal de Registro Casillas Puno</span>
                    <mat-icon>open_in_new</mat-icon>
                  </a>
                </div>
              }

              @if (estadoCasilla() === 'error') {
                <div class="state-error">
                  <div class="status-top-badge badge-error">
                    <mat-icon>error_outline</mat-icon>
                    <span>ERROR DE CONSULTA</span>
                  </div>

                  <h4>No se pudo verificar el estado</h4>
                  <p class="error-desc">{{ mensajeError() }}</p>

                  <div class="error-actions">
                    <button mat-flat-button color="warn" (click)="verificarCasilla()">
                      <mat-icon>replay</mat-icon>
                      Reintentar Consulta
                    </button>
                  </div>
                </div>
              }
            </div>
          </mat-card>

          <!-- Historial de Consultas de la Sesión -->
          <mat-card class="history-card">
            <div class="history-header">
              <div class="history-title">
                <mat-icon>history</mat-icon>
                <span>Consultas en esta sesión</span>
                <mat-chip class="history-count">{{ historial().length }}</mat-chip>
              </div>

              @if (historial().length > 0) {
                <button
                  mat-button
                  class="clear-history-btn"
                  (click)="limpiarHistorial()"
                >
                  Limpiar historial
                </button>
              }
            </div>

            <mat-card-content class="history-content">
              @if (historial().length === 0) {
                <p class="no-history-text">No se han realizado consultas en la sesión actual.</p>
              } @else {
                <div class="history-list">
                  @for (item of historial(); track item.id) {
                    <div class="history-item" (click)="cargarDesdeHistorial(item)">
                      <div class="history-left">
                        <span
                          class="status-indicator-dot"
                          [class.dot-active]="item.estado === 'activo'"
                          [class.dot-inactive]="item.estado === 'inactivo'"
                          [class.dot-error]="item.estado === 'error'"
                        ></span>
                        <div>
                          <div class="history-doc-row">
                            <strong class="font-mono">{{ item.nroDocumento }}</strong>
                            <span class="history-doc-tag">{{ item.tipoDocumentoLabel }}</span>
                          </div>
                          @if (item.nombreCompleto) {
                            <span class="history-name">{{ item.nombreCompleto }}</span>
                          }
                        </div>
                      </div>

                      <div class="history-right">
                        <span class="history-time">{{ formatTime(item.timestamp) }}</span>
                        <mat-icon class="history-arrow">chevron_right</mat-icon>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .casilla-page-container {
      padding: 24px;
      max-width: 1300px;
      margin: 0 auto;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    // Toasts
    .casilla-toasts {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .toast-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      background: #1e293b;
      color: #fff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.25s ease-out;

      &.toast--exito {
        background: #064e3b;
        border-left: 4px solid #10b981;
      }
      &.toast--error {
        background: #7f1d1d;
        border-left: 4px solid #ef4444;
      }
      &.toast--info {
        background: #1e3a8a;
        border-left: 4px solid #3b82f6;
      }

      .toast-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .toast-text {
        font-size: 13.5px;
        flex: 1;
        line-height: 1.4;
      }
      .toast-close {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 16px;
        padding: 0 4px;
        &:hover { color: #fff; }
      }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    // Header
    .casilla-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;

      .badge-title {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(14, 165, 233, 0.1);
        border: 1px solid rgba(14, 165, 233, 0.3);
        color: #38bdf8;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 8px;

        .live-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 6px #38bdf8;
        }
      }

      h1 {
        font-size: 26px;
        font-weight: 700;
        color: var(--text-primary, #0f172a);
        margin: 0 0 6px 0;
        letter-spacing: -0.02em;
      }

      p {
        font-size: 14px;
        color: var(--text-secondary, #64748b);
        margin: 0;
      }

      .header-btn {
        border-radius: 8px;
        font-weight: 600;
      }
    }

    // Grid Layout
    .casilla-grid-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;

      @media (max-width: 960px) {
        grid-template-columns: 1fr;
      }
    }

    // Form Card
    .form-card {
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--card-bg, #ffffff);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow: hidden;

      .card-header-stitch {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color, #e2e8f0);
        background: rgba(30, 41, 59, 0.02);

        .icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0284c7, #0369a1);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        h3 {
          margin: 0 0 2px 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
        }

        p {
          margin: 0;
          font-size: 12.5px;
          color: var(--text-secondary, #64748b);
        }
      }

      .form-card-content {
        padding: 24px;
      }
    }

    .mode-selector-pills {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;

      .mode-pill {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 14px;
        border-radius: 8px;
        border: 1px solid var(--border-color, #e2e8f0);
        background: #f8fafc;
        color: var(--text-secondary, #64748b);
        font-size: 13.5px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        .pill-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover {
          background: rgba(2, 132, 199, 0.08);
          border-color: #0284c7;
          color: #0284c7;
        }

        &.active {
          background: linear-gradient(135deg, #0284c7, #0369a1);
          border-color: #0284c7;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
        }
      }
    }

    .consulta-form {

      display: flex;
      flex-direction: column;
      gap: 16px;

      .w-full {
        width: 100%;
      }

      .form-row-2 {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 14px;

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      .select-option-row {
        display: flex;
        align-items: center;
        gap: 8px;
        .opt-icon { font-size: 18px; width: 18px; height: 18px; color: #64748b; }
      }

      .input-suffix-icon {
        color: #94a3b8;
      }
    }

    .quick-examples {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 10px 14px;
      background: rgba(14, 165, 233, 0.05);
      border-radius: 8px;
      border: 1px dashed rgba(14, 165, 233, 0.25);

      .quick-label {
        font-size: 12px;
        color: var(--text-secondary, #64748b);
        font-weight: 500;
      }

      .chip-quick {
        border: 1px solid rgba(2, 132, 199, 0.3);
        background: #ffffff;
        color: #0284c7;
        padding: 2px 10px;
        border-radius: 9999px;
        font-size: 11.5px;
        font-family: monospace;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          background: #0284c7;
          color: #ffffff;
        }
      }
    }

    .form-actions {
      margin-top: 8px;

      .submit-btn {
        width: 100%;
        height: 48px;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: linear-gradient(135deg, #0284c7, #0369a1);

        .btn-spinner {
          display: inline-block;
        }
      }
    }

    // Result Column
    .result-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .result-card {
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--card-bg, #ffffff);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      min-height: 260px;
      transition: all 0.3s ease;

      &.result-card--activo {
        border-color: #10b981;
        background: linear-gradient(to bottom, rgba(16, 185, 129, 0.04), rgba(255, 255, 255, 0.9));
      }
      &.result-card--inactivo {
        border-color: #f59e0b;
        background: linear-gradient(to bottom, rgba(245, 158, 11, 0.04), rgba(255, 255, 255, 0.9));
      }
      &.result-card--error {
        border-color: #ef4444;
        background: linear-gradient(to bottom, rgba(239, 68, 68, 0.04), rgba(255, 255, 255, 0.9));
      }

      .result-card-inner {
        padding: 24px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
    }

    // States inside Result Card
    .state-empty {
      text-align: center;
      padding: 16px 0;

      .empty-icon-wrap {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: rgba(148, 163, 184, 0.12);
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px auto;

        mat-icon { font-size: 32px; width: 32px; height: 32px; }
      }

      h4 {
        margin: 0 0 6px 0;
        font-size: 17px;
        font-weight: 700;
        color: var(--text-primary, #0f172a);
      }

      p {
        margin: 0 auto 18px auto;
        font-size: 13.5px;
        color: var(--text-secondary, #64748b);
        max-width: 380px;
        line-height: 1.5;
      }

      .law-note {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11.5px;
        color: #64748b;
        background: rgba(148, 163, 184, 0.1);
        padding: 6px 12px;
        border-radius: 6px;

        .law-icon { font-size: 16px; width: 16px; height: 16px; }
      }
    }

    .state-loading {
      text-align: center;
      padding: 20px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
      }

      .loading-sub {
        font-size: 11.5px;
        font-family: monospace;
        color: #0284c7;
      }
    }

    .status-top-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 14px;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }

      &.badge-active {
        background: #dcfce7;
        color: #15803d;
        border: 1px solid #86efac;
      }

      &.badge-inactive {
        background: #fef3c7;
        color: #b45309;
        border: 1px solid #fde68a;
      }

      &.badge-error {
        background: #fee2e2;
        color: #b91c1c;
        border: 1px solid #fca5a5;
      }
    }

    .state-success {
      .admin-name {
        margin: 0 0 16px 0;
        font-size: 20px;
        font-weight: 800;
        color: #064e3b;
        letter-spacing: -0.01em;
      }

      .info-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 18px;
        background: #ffffff;
        padding: 14px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;

        .info-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;

          .info-label { color: #64748b; font-weight: 500; }
          .info-value { font-weight: 600; color: #0f172a; }
        }
      }
    }

    .state-inactive {
      h4 {
        margin: 0 0 6px 0;
        font-size: 18px;
        font-weight: 700;
        color: #92400e;
      }

      .inactive-desc {
        font-size: 13.5px;
        color: #475569;
        margin: 0 0 16px 0;
      }

      .portal-link-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 14px;
        color: #0284c7;
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }

        mat-icon { font-size: 16px; width: 16px; height: 16px; }
      }
    }

    .state-error {
      text-align: center;

      h4 {
        margin: 0 0 6px 0;
        font-size: 17px;
        font-weight: 700;
        color: #991b1b;
      }

      .error-desc {
        font-size: 13.5px;
        color: #64748b;
        margin: 0 0 16px 0;
      }

      .error-actions {
        display: flex;
        justify-content: center;
      }
    }

    .alert-box {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      line-height: 1.5;

      mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }

      &.alert-success {
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
        mat-icon { color: #10b981; }
      }

      &.alert-warn {
        background: #fffbeb;
        color: #92400e;
        border: 1px solid #fde68a;
        mat-icon { color: #f59e0b; }
      }
    }

    // History Card
    .history-card {
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--card-bg, #ffffff);

      .history-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid var(--border-color, #e2e8f0);

        .history-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 13.5px;
          color: var(--text-primary, #0f172a);

          mat-icon { font-size: 18px; width: 18px; height: 18px; color: #64748b; }

          .history-count {
            min-height: 20px;
            font-size: 11px;
            padding: 2px 8px;
          }
        }

        .clear-history-btn {
          font-size: 11.5px;
          color: #94a3b8;
          &:hover { color: #ef4444; }
        }
      }

      .history-content {
        padding: 10px 14px;
      }

      .no-history-text {
        font-size: 12.5px;
        color: #94a3b8;
        text-align: center;
        padding: 12px 0;
        margin: 0;
      }

      .history-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .history-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s ease;

        &:hover {
          background: rgba(14, 165, 233, 0.06);
        }

        .history-left {
          display: flex;
          align-items: center;
          gap: 10px;

          .status-indicator-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #94a3b8;

            &.dot-active { background: #10b981; box-shadow: 0 0 6px #10b981; }
            &.dot-inactive { background: #f59e0b; }
            &.dot-error { background: #ef4444; }
          }

          .history-doc-row {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
          }

          .history-doc-tag {
            font-size: 10.5px;
            background: #f1f5f9;
            color: #475569;
            padding: 1px 6px;
            border-radius: 4px;
          }

          .history-name {
            display: block;
            font-size: 11.5px;
            color: #64748b;
          }
        }

        .history-right {
          display: flex;
          align-items: center;
          gap: 6px;

          .history-time {
            font-size: 11px;
            color: #94a3b8;
          }

          .history-arrow {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: #cbd5e1;
          }
        }
      }
    }
  `]
})
export class CasillaElectronicaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private casillaService = inject(CasillaService);

  // Formulario
  consultaForm!: FormGroup;

  // Signals de Estado
  estadoCasilla = signal<EstadoCasilla>('pendiente');
  datosCasilla = signal<InfoCasillaData | null>(null);
  mensajeError = signal<string>('No se pudo establecer conexión con el servicio.');
  toasts = signal<Toast[]>([]);
  historial = signal<ConsultaCasillaHistorial[]>([]);
  private toastId = 0;

  // Catálogo unificado de documentos (RUC y DNI siempre disponibles)
  readonly catalogoDocumentos = [
    {
      codigo: '00001',
      nombre: 'RUC — Registro Único de Contribuyentes',
      placeholder: 'Ej: 20601234567 o 10401234567',
      length: 11,
      minLength: 11,
      icono: 'business',
      tipoPersonaDefault: '00002'
    },
    {
      codigo: '00002',
      nombre: 'DNI — Documento Nacional de Identidad',
      placeholder: 'Ej: 40123456',
      length: 8,
      minLength: 8,
      icono: 'person',
      tipoPersonaDefault: '00001'
    },
    {
      codigo: '00003',
      nombre: 'Carné de Extranjería',
      placeholder: 'Ej: 001234567',
      length: 9,
      minLength: 8,
      icono: 'badge',
      tipoPersonaDefault: '00001'
    },
    {
      codigo: '00004',
      nombre: 'Pasaporte',
      placeholder: 'Ej: P12345678',
      length: 12,
      minLength: 6,
      icono: 'travel_explore',
      tipoPersonaDefault: '00001'
    }
  ];

  // Computed
  labelDocumentoActual = computed(() => {
    const cod = this.consultaForm?.get('codTipoDocumento')?.value;
    if (cod === '00001') return 'RUC';
    if (cod === '00002') return 'DNI';
    return 'Documento';
  });

  placeholderDocumento = computed(() => {
    const tipoDoc = this.consultaForm?.get('codTipoDocumento')?.value;
    const item = this.catalogoDocumentos.find(d => d.codigo === tipoDoc);
    return item ? item.placeholder : 'Ingrese número';
  });

  maxlengthDocumento = computed(() => {
    const tipoDoc = this.consultaForm?.get('codTipoDocumento')?.value;
    const item = this.catalogoDocumentos.find(d => d.codigo === tipoDoc);
    return item ? item.length : 12;
  });

  minlengthDocumento = computed(() => {
    const tipoDoc = this.consultaForm?.get('codTipoDocumento')?.value;
    const item = this.catalogoDocumentos.find(d => d.codigo === tipoDoc);
    return item ? item.minLength : 8;
  });

  ngOnInit(): void {
    // Por defecto RUC para empresas o DNI para personas
    this.consultaForm = this.fb.group({
      codTipoPersona: ['00002', Validators.required],
      codTipoDocumento: ['00001', Validators.required],
      nroDocumento: ['', [Validators.required, Validators.minLength(11)]]
    });
  }

  seleccionarModo(modo: 'RUC' | 'DNI'): void {
    if (modo === 'RUC') {
      this.consultaForm.patchValue({
        codTipoDocumento: '00001',
        codTipoPersona: '00002',
        nroDocumento: ''
      });
      this.consultaForm.get('nroDocumento')?.setValidators([Validators.required, Validators.minLength(11)]);
    } else {
      this.consultaForm.patchValue({
        codTipoDocumento: '00002',
        codTipoPersona: '00001',
        nroDocumento: ''
      });
      this.consultaForm.get('nroDocumento')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.consultaForm.get('nroDocumento')?.updateValueAndValidity();
    this.estadoCasilla.set('pendiente');
  }

  onTipoDocumentoChange(tipoDoc: string): void {
    const item = this.catalogoDocumentos.find(d => d.codigo === tipoDoc);
    if (item) {
      this.consultaForm.patchValue({
        codTipoPersona: item.tipoPersonaDefault
      });
      this.consultaForm.get('nroDocumento')?.setValidators([Validators.required, Validators.minLength(item.minLength)]);
      this.consultaForm.get('nroDocumento')?.updateValueAndValidity();
    }
    this.estadoCasilla.set('pendiente');
  }

  onNroDocumentoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = (input.value || '').trim();

    // Auto-detección inteligente: si escribe 11 dígitos, cambiar automáticamente a RUC
    if (val.length === 11 && (val.startsWith('10') || val.startsWith('20') || val.startsWith('15') || val.startsWith('17'))) {
      if (this.consultaForm.get('codTipoDocumento')?.value !== '00001') {
        const persona = val.startsWith('20') ? '00002' : '00001';
        this.consultaForm.patchValue({
          codTipoDocumento: '00001',
          codTipoPersona: persona
        }, { emitEvent: false });
        this.consultaForm.get('nroDocumento')?.setValidators([Validators.required, Validators.minLength(11)]);
        this.consultaForm.get('nroDocumento')?.updateValueAndValidity();
      }
    }
  }


  setEjemplo(tipoPers: string, tipoDoc: string, nroDoc: string): void {
    this.consultaForm.patchValue({
      codTipoPersona: tipoPers,
      codTipoDocumento: tipoDoc,
      nroDocumento: nroDoc
    });
    this.verificarCasilla();
  }

  verificarCasilla(): void {
    if (this.consultaForm.invalid) {
      this.consultaForm.markAllAsTouched();
      return;
    }

    const { codTipoPersona, codTipoDocumento, nroDocumento } = this.consultaForm.value;
    const docLimpio = (nroDocumento || '').trim();

    this.estadoCasilla.set('verificando');
    this.datosCasilla.set(null);

    this.casillaService.verificarEstado(codTipoPersona, codTipoDocumento, docLimpio).subscribe({
      next: (res) => {
        const info = res?.info;
        const data = info?.data;

        // Criterio de casilla activa
        const esExitoso = res?.status === 'exitoso' || info?.success === true;
        const estaActivo = data?.activo === true;

        if (esExitoso && estaActivo) {
          this.estadoCasilla.set('activo');
          this.datosCasilla.set(data || { activo: true, nombreCompleto: 'Administrado Verificado' });
          this.mostrarToast('exito', `✅ Casilla activa: ${data?.nombreCompleto || docLimpio}`);
          this.registrarHistorial('activo', data?.nombreCompleto);
        } else {
          this.estadoCasilla.set('inactivo');
          const msj = info?.message || 'El administrado no cuenta con casilla electrónica activa en la DRTC Puno.';
          this.mostrarToast('info', msj);
          this.registrarHistorial('inactivo', data?.nombreCompleto, msj);
        }
      },
      error: (err) => {
        console.error('[CasillaElectronica] Error al consultar:', err);
        this.estadoCasilla.set('error');
        const msj = 'No se pudo conectar con el servicio de casillas electrónicas. Verifique su conexión de red.';
        this.mensajeError.set(msj);
        this.mostrarToast('error', msj);
        this.registrarHistorial('error', undefined, msj);
      }
    });
  }

  private registrarHistorial(estado: EstadoCasilla, nombre?: string, mensaje?: string): void {
    const val = this.consultaForm.value;
    const item: ConsultaCasillaHistorial = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      codTipoPersona: val.codTipoPersona,
      tipoPersonaLabel: val.codTipoPersona === '00002' ? 'Jurídica' : 'Natural',
      codTipoDocumento: val.codTipoDocumento,
      tipoDocumentoLabel: this.getTipoDocNombre(val.codTipoDocumento),
      nroDocumento: val.nroDocumento,
      estado,
      nombreCompleto: nombre,
      mensajeRespuesta: mensaje
    };

    this.historial.update(list => [item, ...list.slice(0, 9)]); // Guardar últimas 10
  }

  cargarDesdeHistorial(item: ConsultaCasillaHistorial): void {
    this.consultaForm.patchValue({
      codTipoPersona: item.codTipoPersona,
      codTipoDocumento: item.codTipoDocumento,
      nroDocumento: item.nroDocumento
    });
    this.verificarCasilla();
  }

  limpiarHistorial(): void {
    this.historial.set([]);
  }

  limpiarFormulario(): void {
    this.consultaForm.reset({
      codTipoPersona: '00001',
      codTipoDocumento: '00002',
      nroDocumento: ''
    });
    this.estadoCasilla.set('pendiente');
    this.datosCasilla.set(null);
  }

  getTipoDocNombre(cod: string): string {
    const map: Record<string, string> = {
      '00001': 'RUC',
      '00002': 'DNI',
      '00003': 'Carné Ext.',
      '00004': 'Pasaporte'
    };
    return map[cod] || cod;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  mostrarToast(tipo: Toast['tipo'], mensaje: string): void {
    const id = ++this.toastId;
    this.toasts.update(list => [...list, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrarToast(id), 5000);
  }

  cerrarToast(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
