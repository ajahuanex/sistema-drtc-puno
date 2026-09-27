import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { SunatCronStatus } from '../../models/empresa.model';

@Component({
  selector: 'app-dialog-sunat-sync',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="dialog-wrapper">
      <!-- Encabezado con estética moderna DRTC -->
      <div class="dialog-header">
        <div class="header-icon-container" [class.pulse-active]="status()?.en_ejecucion">
          <span class="material-symbols-outlined header-icon" [class.rotating]="status()?.en_ejecucion">
            cloud_sync
          </span>
        </div>
        <div class="header-titles">
          <h2 class="dialog-title">Gestión de Consulta y Validación SUNAT</h2>
          <p class="dialog-subtitle">
            Monitoreo del horario programado diario y sincronización manual de empresas
          </p>
        </div>
        <button mat-icon-button class="btn-close" (click)="cerrar()" matTooltip="Cerrar ventana">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="dialog-body">
        <!-- Sección 1: Programación Diaria Automática -->
        <div class="card-section cron-schedule-card">
          <div class="section-top">
            <div class="section-title-wrap">
              <span class="material-symbols-outlined section-icon text-indigo">schedule</span>
              <div>
                <h3 class="section-title">Horario Automático Diario</h3>
                <p class="section-desc">Hora oficial fijada para la validación automática matutina</p>
              </div>
            </div>
            <div class="status-badge" [class.badge-active]="status()?.activo" [class.badge-inactive]="!status()?.activo">
              <span class="status-indicator-dot"></span>
              <span>{{ status()?.activo ? 'CRON ACTIVO' : 'CRON PAUSADO' }}</span>
            </div>
          </div>

          <div class="schedule-details-grid">
            <div class="detail-box">
              <span class="detail-label">Hora Diaria Programada</span>
              <div class="time-highlight">
                <span class="material-symbols-outlined clock-icon">alarm</span>
                <span class="time-text">{{ status()?.horario_programado || '07:00' }} AM</span>
                <span class="tz-badge">Hora Perú (UTC-5)</span>
              </div>
            </div>

            <div class="detail-box">
              <span class="detail-label">Próxima Consulta Automática</span>
              <div class="next-run-info">
                <span class="material-symbols-outlined calendar-icon">event_upcoming</span>
                <span class="next-date">{{ formatearFecha(status()?.proxima_ejecucion) }}</span>
              </div>
              <span class="time-remaining">{{ tiempoRestante() }}</span>
            </div>
          </div>

          <!-- Ajuste de horario (Solo administradores) -->
          @if (esAdmin()) {
            <div class="edit-schedule-bar">
              <span class="edit-label">Modificar hora programada:</span>
              <div class="input-action-group">
                <input
                  type="time"
                  class="time-input-field"
                  [(ngModel)]="nuevaHora"
                  [disabled]="isGuardandoHora() || isEnEjecucion()"
                />
                <button
                  mat-button
                  class="btn-save-schedule"
                  (click)="guardarNuevoHorario()"
                  [disabled]="isGuardandoHora() || isEnEjecucion() || !nuevaHora"
                >
                  @if (isGuardandoHora()) {
                    <mat-spinner diameter="16" class="btn-spinner"></mat-spinner>
                  } @else {
                    <span class="material-symbols-outlined">save</span>
                  }
                  <span>Fijar Horario</span>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Sección 2: Estado de Progreso en Vivo (Cuando está corriendo) -->
        @if (status()?.en_ejecucion) {
          <div class="card-section running-card">
            <div class="running-header">
              <div class="running-indicator">
                <mat-spinner diameter="24"></mat-spinner>
                <div>
                  <h4 class="running-title">Sincronización SUNAT en curso...</h4>
                  <p class="running-sub">
                    {{ status()?.origen_ultima_ejecucion === 'AUTOMATICO_CRON' ? 'Ejecución automática de las 07:00 AM' : 'Ejecución manual solicitada por Administrador' }}
                  </p>
                </div>
              </div>
              <span class="percentage-pill">{{ status()?.progreso?.porcentaje || 0 }}%</span>
            </div>

            <mat-progress-bar
              mode="determinate"
              [value]="status()?.progreso?.porcentaje || 0"
              class="custom-progress-bar"
            ></mat-progress-bar>

            <div class="running-stats-row">
              <span>
                Empresas validadas:
                <strong>{{ status()?.progreso?.actual || 0 }} / {{ status()?.progreso?.total || 0 }}</strong>
              </span>
              @if (status()?.progreso?.ruc_actual) {
                <span class="active-ruc-tag">
                  Consultando RUC: <code>{{ status()?.progreso?.ruc_actual }}</code>
                </span>
              }
            </div>
          </div>
        }

        <!-- Sección 3: Resumen de Última Ejecución -->
        <div class="card-section last-sync-card">
          <div class="last-sync-header">
            <span class="material-symbols-outlined text-muted">history</span>
            <span class="last-sync-title">Última Ejecución Registrada</span>
            <span class="last-sync-time">{{ formatearFecha(status()?.ultimo_fin || status()?.ultimo_inicio) }}</span>
          </div>

          <div class="stats-mini-cards">
            <div class="stat-pill-item pill-blue">
              <span class="stat-number">{{ status()?.total_procesadas || 0 }}</span>
              <span class="stat-caption">Procesadas</span>
            </div>
            <div class="stat-pill-item pill-emerald">
              <span class="stat-number">{{ status()?.total_actualizadas || 0 }}</span>
              <span class="stat-caption">Actualizadas OK</span>
            </div>
            <div class="stat-pill-item pill-rose">
              <span class="stat-number">{{ status()?.total_errores || 0 }}</span>
              <span class="stat-caption">Errores / Sin datos</span>
            </div>
          </div>

          @if (status()?.ultimo_error) {
            <div class="error-banner">
              <span class="material-symbols-outlined error-icon">warning</span>
              <span>{{ status()?.ultimo_error }}</span>
            </div>
          }
        </div>

        <!-- Sección 4: Acción Manual Inmediata (Solo Administrador) -->
        <div class="card-section manual-trigger-card">
          <div class="section-title-wrap">
            <span class="material-symbols-outlined section-icon text-amber">bolt</span>
            <div>
              <h3 class="section-title">Sincronización Manual Inmediata</h3>
              <p class="section-desc">
                Ejecuta la consulta con SUNAT en este instante sin esperar el horario de las {{ status()?.horario_programado || '07:00' }} AM
              </p>
            </div>
          </div>

          @if (esAdmin()) {
            <div class="manual-options-box">
              <label class="radio-option-item">
                <input
                  type="radio"
                  name="syncType"
                  [value]="false"
                  [(ngModel)]="forzarTodas"
                  [disabled]="isEnEjecucion() || isStartingSync()"
                />
                <div class="radio-content">
                  <strong class="option-title">Validar pendientes y desactualizadas (> 24 horas)</strong>
                  <span class="option-subtitle">Recomendado. Rápido y consulta solo aquellas empresas que requieren refresco.</span>
                </div>
              </label>

              <label class="radio-option-item">
                <input
                  type="radio"
                  name="syncType"
                  [value]="true"
                  [(ngModel)]="forzarTodas"
                  [disabled]="isEnEjecucion() || isStartingSync()"
                />
                <div class="radio-content">
                  <strong class="option-title">Forzar validación completa de TODAS las empresas</strong>
                  <span class="option-subtitle">Sobrescribe los datos registrales de todo el padrón (toma más tiempo).</span>
                </div>
              </label>
            </div>

            <div class="manual-action-footer">
              <button
                mat-flat-button
                class="btn-trigger-sync"
                (click)="iniciarSincronizacionManual()"
                [disabled]="isEnEjecucion() || isStartingSync()"
              >
                @if (isStartingSync() || isEnEjecucion()) {
                  <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
                  <span>Sincronización en Proceso...</span>
                } @else {
                  <span class="material-symbols-outlined">sync</span>
                  <span>Ejecutar Validación SUNAT Ahora</span>
                }
              </button>
            </div>
          } @else {
            <div class="no-admin-notice">
              <span class="material-symbols-outlined">lock</span>
              <span>Esta opción requiere privilegios de <strong>Administrador</strong> u OTI.</span>
            </div>
          }
        </div>
      </div>

      <!-- Pie del modal -->
      <div class="dialog-actions">
        <button mat-button class="btn-cancel" (click)="cerrar()">
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-wrapper {
      display: flex;
      flex-direction: column;
      max-width: 680px;
      width: 100%;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      font-family: inherit;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      position: relative;
    }

    .header-icon-container {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #60a5fa;

      &.pulse-active {
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
        animation: pulse 2s infinite ease-in-out;
      }
    }

    .header-icon {
      font-size: 28px;
    }

    .rotating {
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.85; }
    }

    .header-titles {
      flex: 1;
    }

    .dialog-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .dialog-subtitle {
      font-size: 0.82rem;
      color: #94a3b8;
      margin: 3px 0 0;
    }

    .btn-close {
      color: #94a3b8;
      &:hover { color: #ffffff; background: rgba(255, 255, 255, 0.1); }
    }

    .dialog-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 72vh;
      overflow-y: auto;
      background: #f8fafc;
    }

    .card-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .section-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-icon {
      font-size: 24px;
    }

    .text-indigo { color: #4f46e5; }
    .text-amber { color: #d97706; }
    .text-muted { color: #64748b; }

    .section-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .section-desc {
      font-size: 0.78rem;
      color: #64748b;
      margin: 2px 0 0;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.03em;
    }

    .badge-active {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      .status-indicator-dot { background: #10b981; }
    }

    .badge-inactive {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #cbd5e1;
      .status-indicator-dot { background: #94a3b8; }
    }

    .status-indicator-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }

    .schedule-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .detail-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }

    .detail-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.04em;
      display: block;
      margin-bottom: 6px;
    }

    .time-highlight {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .clock-icon, .calendar-icon {
      font-size: 20px;
      color: #3b82f6;
    }

    .time-text {
      font-size: 1.25rem;
      font-weight: 800;
      color: #1e293b;
      font-family: monospace;
    }

    .tz-badge {
      font-size: 0.68rem;
      font-weight: 600;
      background: #e0e7ff;
      color: #3730a3;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .next-run-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .next-date {
      font-size: 0.88rem;
      font-weight: 700;
      color: #1e293b;
    }

    .time-remaining {
      display: block;
      margin-top: 4px;
      font-size: 0.75rem;
      color: #6366f1;
      font-weight: 600;
    }

    .edit-schedule-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
      flex-wrap: wrap;
    }

    .edit-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
    }

    .input-action-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .time-input-field {
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.88rem;
      font-weight: 600;
      background: #ffffff;
      color: #1e293b;
      font-family: monospace;
      outline: none;
      &:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
    }

    .btn-save-schedule {
      background: #f1f5f9;
      color: #334155;
      font-weight: 600;
      font-size: 0.8rem;
      padding: 0 12px;
      height: 34px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
      &:hover { background: #e2e8f0; color: #0f172a; }
    }

    .running-card {
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    .running-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .running-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .running-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e40af;
      margin: 0;
    }

    .running-sub {
      font-size: 0.75rem;
      color: #3b82f6;
      margin: 2px 0 0;
    }

    .percentage-pill {
      font-size: 1rem;
      font-weight: 800;
      color: #1d4ed8;
      font-family: monospace;
    }

    .custom-progress-bar {
      border-radius: 6px;
      height: 8px !important;
      margin-bottom: 8px;
    }

    .running-stats-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.78rem;
      color: #1e3a8a;
    }

    .active-ruc-tag {
      background: #dbeafe;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .last-sync-card {
      background: #ffffff;
    }

    .last-sync-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .last-sync-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #334155;
    }

    .last-sync-time {
      margin-left: auto;
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 500;
    }

    .stats-mini-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .stat-pill-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid transparent;
    }

    .pill-blue { background: #eff6ff; border-color: #dbeafe; color: #1e40af; }
    .pill-emerald { background: #ecfdf5; border-color: #d1fae5; color: #065f46; }
    .pill-rose { background: #fff1f2; border-color: #ffe4e6; color: #9f1239; }

    .stat-number {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: monospace;
    }

    .stat-caption {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      font-size: 0.78rem;
    }

    .manual-trigger-card {
      border: 1px solid #fed7aa;
      background: #fffbeb;
    }

    .manual-options-box {
      margin: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .radio-option-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #ffffff;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 10px 12px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: #f59e0b;
        background: #fffdf5;
      }

      input[type="radio"] {
        margin-top: 3px;
        accent-color: #d97706;
      }
    }

    .radio-content {
      display: flex;
      flex-direction: column;
    }

    .option-title {
      font-size: 0.85rem;
      color: #1e293b;
    }

    .option-subtitle {
      font-size: 0.75rem;
      color: #64748b;
    }

    .manual-action-footer {
      display: flex;
      justify-content: flex-end;
      padding-top: 6px;
    }

    .btn-trigger-sync {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
      color: #ffffff !important;
      font-weight: 700 !important;
      padding: 0 20px !important;
      height: 42px !important;
      border-radius: 8px !important;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.3);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #b45309 0%, #92400e 100%) !important;
      }

      &:disabled {
        opacity: 0.6;
      }
    }

    .no-admin-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      border-radius: 6px;
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.82rem;
      margin-top: 8px;
    }

    .dialog-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 14px 24px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
    }

    .btn-cancel {
      color: #64748b;
      font-weight: 600;
    }

    .btn-spinner {
      margin-right: 6px;
    }
  `]
})
export class DialogSunatSyncComponent implements OnInit, OnDestroy {
  private empresaService = inject(EmpresaService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<DialogSunatSyncComponent>);

  status = signal<SunatCronStatus | null>(null);
  forzarTodas = false;
  nuevaHora = '07:00';
  isGuardandoHora = signal(false);
  isStartingSync = signal(false);

  esAdmin = computed(() => this.authService.isAdmin());
  isEnEjecucion = computed(() => !!this.status()?.en_ejecucion);

  private pollInterval: any = null;

  ngOnInit(): void {
    this.cargarEstado();
    // Poll cada 3 segundos para reflejar progreso en vivo
    this.pollInterval = setInterval(() => {
      this.cargarEstado(false);
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  cargarEstado(mostrarError = true): void {
    this.empresaService.obtenerEstadoCronSunat().subscribe({
      next: (st) => {
        this.status.set(st);
        if (st && st.horario_programado && !this.isGuardandoHora()) {
          this.nuevaHora = st.horario_programado;
        }
      },
      error: (err) => {
        if (mostrarError) {
          console.warn('Error obteniendo estado de cron SUNAT:', err);
        }
      }
    });
  }

  guardarNuevoHorario(): void {
    if (!this.nuevaHora) return;
    this.isGuardandoHora.set(true);
    this.empresaService.configurarHorarioCronSunat(this.nuevaHora, true).subscribe({
      next: (resp) => {
        this.isGuardandoHora.set(false);
        this.snackBar.open(
          `✅ Horario programado actualizado a las ${this.nuevaHora} AM diaria`,
          'OK',
          { duration: 4000 }
        );
        if (resp && resp.estado) {
          this.status.set(resp.estado);
        } else {
          this.cargarEstado();
        }
      },
      error: (err) => {
        this.isGuardandoHora.set(false);
        this.snackBar.open('❌ Error al actualizar el horario programado', 'Cerrar', { duration: 4000 });
      }
    });
  }

  iniciarSincronizacionManual(): void {
    this.isStartingSync.set(true);
    this.empresaService.sincronizarSunatManual(this.forzarTodas).subscribe({
      next: (res) => {
        this.isStartingSync.set(false);
        this.snackBar.open(
          res?.mensaje || '🚀 Sincronización manual iniciada en segundo plano',
          'OK',
          { duration: 5000 }
        );
        if (res && res.estado) {
          this.status.set(res.estado);
        } else {
          this.cargarEstado();
        }
      },
      error: (err) => {
        this.isStartingSync.set(false);
        const errMsg = err?.error?.detail || 'Error al iniciar la sincronización manual';
        this.snackBar.open(`⚠️ ${errMsg}`, 'Cerrar', { duration: 5000 });
      }
    });
  }

  formatearFecha(fechaStr?: string | null): string {
    if (!fechaStr) return 'No registrado';
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return fechaStr;
      return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return fechaStr;
    }
  }

  tiempoRestante(): string {
    const prox = this.status()?.proxima_ejecucion;
    if (!prox) return '';
    try {
      const target = new Date(prox).getTime();
      const now = Date.now();
      const diffMs = target - now;
      if (diffMs <= 0) return 'Programado para ejecutarse ahora';
      const horas = Math.floor(diffMs / (1000 * 60 * 60));
      const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (horas > 0) {
        return `Faltan aproximadamente ${horas}h ${minutos}m`;
      }
      return `Faltan aproximadamente ${minutos} minutos`;
    } catch {
      return '';
    }
  }

  cerrar(): void {
    this.dialogRef.close({
      syncEjecutada: this.status()?.total_actualizadas || 0
    });
  }
}
