import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BajaExternaService, BajaExterna } from '../../../services/baja-externa.service';
import { BajaExternaFormComponent } from '../baja-externa-form/baja-externa-form.component';
import { NotificarBajaDialogComponent } from '../notificar-baja-dialog.component';

@Component({
  selector: 'app-bajas-externas-list',
  standalone: true,
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }
  ],
  imports: [
    CommonModule, 
    FormsModule,
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatChipsModule, 
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  template: `
    <div class="bajas-container">
      
      <!-- Encabezado Principal -->
      <div class="header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <mat-icon>sync_problem</mat-icon>
          </div>
          <div>
            <h1 class="header-title">Módulo de Bajas Vehiculares</h1>
            <p class="header-subtitle">Control y Notificación de Bajas Externas (MTC) y Locales (Región Puno)</p>
          </div>
        </div>

        <button mat-flat-button color="primary" class="btn-nueva-baja" (click)="openForm()">
          <mat-icon>add_circle</mat-icon>
          <span>Registrar Nueva Baja</span>
        </button>
      </div>

      <!-- Tarjetas de Resumen Estadístico -->
      <div class="stats-grid">
        <!-- Total Registros -->
        <div class="stat-card">
          <div class="stat-content">
            <span class="stat-label">Total Registros</span>
            <span class="stat-number text-dark">{{ totalRegistros() }}</span>
          </div>
          <div class="stat-icon-wrapper bg-gray">
            <mat-icon>directions_bus</mat-icon>
          </div>
        </div>

        <!-- Pendientes -->
        <div class="stat-card">
          <div class="stat-content">
            <span class="stat-label text-amber">Pendientes Notificar</span>
            <span class="stat-number text-amber">{{ pendientesCount() }}</span>
          </div>
          <div class="stat-icon-wrapper bg-amber">
            <mat-icon>schedule</mat-icon>
          </div>
        </div>

        <!-- Bajas Externas -->
        <div class="stat-card">
          <div class="stat-content">
            <span class="stat-label text-indigo">Bajas Externas (MTC)</span>
            <span class="stat-number text-indigo">{{ externasCount() }}</span>
          </div>
          <div class="stat-icon-wrapper bg-indigo">
            <mat-icon>public</mat-icon>
          </div>
        </div>

        <!-- Bajas Locales -->
        <div class="stat-card">
          <div class="stat-content">
            <span class="stat-label text-emerald">Bajas Locales (Puno)</span>
            <span class="stat-number text-emerald">{{ localesCount() }}</span>
          </div>
          <div class="stat-icon-wrapper bg-emerald">
            <mat-icon>location_city</mat-icon>
          </div>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="filters-card">
        
        <!-- Pestañas de Ámbito -->
        <div class="scope-tabs">
          <button 
            type="button"
            class="tab-btn"
            [class.active]="filtroTipo() === ''"
            (click)="setFiltroTipo('')">
            Todas
          </button>
          <button 
            type="button"
            class="tab-btn"
            [class.active-indigo]="filtroTipo() === 'EXTERNA'"
            (click)="setFiltroTipo('EXTERNA')">
            <mat-icon class="tab-icon">public</mat-icon>
            <span>Bajas Externas (MTC)</span>
          </button>
          <button 
            type="button"
            class="tab-btn"
            [class.active-emerald]="filtroTipo() === 'LOCAL'"
            (click)="setFiltroTipo('LOCAL')">
            <mat-icon class="tab-icon">location_city</mat-icon>
            <span>Bajas Locales (Región)</span>
          </button>
        </div>

        <!-- Controles a la derecha -->
        <div class="controls-right">
          <!-- Filtro de Estado -->
          <mat-form-field appearance="outline" class="select-estado">
            <mat-label>Estado Notificación</mat-label>
            <mat-select [value]="filtroEstado()" (selectionChange)="setFiltroEstado($event.value)">
              <mat-option value="">Todos</mat-option>
              <mat-option value="PENDIENTE">Pendientes</mat-option>
              <mat-option value="NOTIFICADO">Notificados</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Input de Búsqueda -->
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar placa o empresa</mat-label>
            <input matInput [(ngModel)]="busquedaTexto" (keyup.enter)="aplicarFiltros()" placeholder="Ej: V1A-950, RUC...">
            <button mat-icon-button matSuffix (click)="aplicarFiltros()" matTooltip="Buscar">
              <mat-icon>search</mat-icon>
            </button>
          </mat-form-field>
        </div>
      </div>

      <!-- Tabla de Datos -->
      @if (bajaService.loading()) {
        <div class="loading-state">
          <mat-icon class="spin-icon">sync</mat-icon>
          <p>Cargando registros de bajas...</p>
        </div>
      } @else if (bajaService.error()) {
        <div class="error-banner">
          <mat-icon>error_outline</mat-icon>
          <span>{{ bajaService.error() }}</span>
        </div>
      } @else {
        <div class="table-card">
          <table mat-table [dataSource]="bajasFiltradas()" class="bajas-table">
            
            <!-- Columna Ámbito / Tipo -->
            <ng-container matColumnDef="tipo">
              <th mat-header-cell *matHeaderCellDef> Ámbito </th>
              <td mat-cell *matCellDef="let element">
                @if (element.tipo_baja === 'LOCAL') {
                  <span class="scope-pill scope-local">
                    <mat-icon class="pill-icon">location_city</mat-icon>
                    Local (Puno)
                  </span>
                } @else {
                  <span class="scope-pill scope-externa">
                    <mat-icon class="pill-icon">public</mat-icon>
                    Externa (MTC)
                  </span>
                }
              </td>
            </ng-container>

            <!-- Columna Placa -->
            <ng-container matColumnDef="placa">
              <th mat-header-cell *matHeaderCellDef> Placa </th>
              <td mat-cell *matCellDef="let element">
                <span class="plate-badge">{{ element.placa }}</span>
              </td>
            </ng-container>

            <!-- Columna Empresa -->
            <ng-container matColumnDef="empresa">
              <th mat-header-cell *matHeaderCellDef> Empresa Origen </th>
              <td mat-cell *matCellDef="let element">
                <div class="empresa-cell">
                  <span class="empresa-name">{{ element.razon_social || 'No especificada' }}</span>
                  @if (element.ruc_empresa) {
                    <span class="empresa-ruc">RUC: {{ element.ruc_empresa }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Columna Motivo -->
            <ng-container matColumnDef="motivo">
              <th mat-header-cell *matHeaderCellDef> Motivo </th>
              <td mat-cell *matCellDef="let element">
                <div class="motivo-cell">
                  <span class="motivo-text">{{ element.motivo || 'Baja vehicular' }}</span>
                  @if (element.observaciones) {
                    <span class="motivo-obs" [title]="element.observaciones">{{ element.observaciones }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Columna Notificación / Destinatario -->
            <ng-container matColumnDef="notificacion">
              <th mat-header-cell *matHeaderCellDef> Destinatario / Doc </th>
              <td mat-cell *matCellDef="let element">
                <div class="notif-cell">
                  <span class="notif-dest">{{ element.entidad_destino || (element.tipo_baja === 'LOCAL' ? 'Región Puno' : 'MTC') }}</span>
                  @if (element.numero_oficio) {
                    <span class="notif-doc">Doc: {{ element.numero_oficio }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Columna Estado Notificación -->
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef> Estado </th>
              <td mat-cell *matCellDef="let element">
                @if (element.estado_notificacion === 'PENDIENTE') {
                  <span class="status-pill status-pending">
                    <span class="dot-pulse"></span>
                    Pendiente
                  </span>
                } @else {
                  <span class="status-pill status-notified">
                    <mat-icon class="check-icon">check</mat-icon>
                    Notificado
                  </span>
                }
              </td>
            </ng-container>

            <!-- Columna Evidencia -->
            <ng-container matColumnDef="evidencia">
              <th mat-header-cell *matHeaderCellDef class="text-center"> Evidencia </th>
              <td mat-cell *matCellDef="let element" class="text-center">
                @if (element.archivo_evidencia) {
                  <button mat-icon-button color="primary" matTooltip="Ver Evidencia / Captura" (click)="verEvidencia(element)">
                    <mat-icon>attach_file</mat-icon>
                  </button>
                } @else {
                  <span class="sin-archivo">-</span>
                }
              </td>
            </ng-container>

            <!-- Columna Fecha -->
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef> Fecha Registro </th>
              <td mat-cell *matCellDef="let element" class="fecha-cell">
                {{ element.fecha_registro | date:'dd/MM/yyyy HH:mm' }}
              </td>
            </ng-container>

            <!-- Columna Acciones -->
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef class="text-right pr-4"> Acciones </th>
              <td mat-cell *matCellDef="let element" class="text-right pr-3">
                <div class="actions-wrapper">
                  @if (element.estado_notificacion === 'PENDIENTE') {
                    <button 
                      mat-stroked-button 
                      color="accent" 
                      class="btn-notificar"
                      matTooltip="Registrar Notificación oficial"
                      (click)="abrirModalNotificar(element)">
                      <mat-icon class="btn-icon">send</mat-icon>
                      <span>Notificar</span>
                    </button>
                  }

                  <button mat-icon-button color="warn" matTooltip="Eliminar registro" (click)="eliminar(element)">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="baja-row"></tr>
            
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell empty-table" colspan="9">
                <div class="empty-state-box">
                  <mat-icon>inbox</mat-icon>
                  <p>No se encontraron registros de bajas con los filtros aplicados</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .bajas-container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      font-family: inherit;
    }

    /* HEADER */
    .header-card {
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .header-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }
    .header-icon-box mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
    }
    .header-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
    .header-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0.15rem 0 0 0;
    }
    .btn-nueva-baja {
      height: 42px;
      border-radius: 10px !important;
      font-weight: 600 !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
    }

    /* STATS GRID */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .stat-card {
      background: #ffffff;
      padding: 1.15rem 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .stat-content {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }
    .stat-number {
      font-size: 1.75rem;
      font-weight: 900;
      line-height: 1.2;
      margin-top: 0.25rem;
    }
    .text-dark { color: #0f172a; }
    .text-amber { color: #d97706; }
    .text-indigo { color: #4f46e5; }
    .text-emerald { color: #059669; }

    .stat-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bg-gray { background: #f1f5f9; color: #475569; }
    .bg-amber { background: #fef3c7; color: #d97706; }
    .bg-indigo { background: #e0e7ff; color: #4f46e5; }
    .bg-emerald { background: #d1fae5; color: #059669; }

    /* FILTERS CARD */
    .filters-card {
      background: #ffffff;
      padding: 0.85rem 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .scope-tabs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .tab-btn {
      border: none;
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      font-size: 0.8rem;
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      background: #e2e8f0;
    }
    .tab-btn.active {
      background: #0f172a;
      color: #ffffff;
    }
    .tab-btn.active-indigo {
      background: #4f46e5;
      color: #ffffff;
    }
    .tab-btn.active-emerald {
      background: #059669;
      color: #ffffff;
    }
    .tab-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .controls-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .select-estado {
      width: 175px;
      font-size: 0.85rem;
    }
    .search-field {
      width: 270px;
      font-size: 0.85rem;
    }

    /* TABLE */
    .table-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      overflow-x: auto;
    }
    .bajas-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .bajas-table th {
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .bajas-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .baja-row:hover {
      background: #f8fafc;
    }

    /* BADGES */
    .scope-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .pill-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .scope-local {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .scope-externa {
      background: #eef2ff;
      color: #3730a3;
      border: 1px solid #c7d2fe;
    }

    .plate-badge {
      font-family: monospace;
      font-weight: 700;
      font-size: 0.85rem;
      background: #f1f5f9;
      color: #0f172a;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
    }

    .empresa-cell {
      display: flex;
      flex-direction: column;
    }
    .empresa-name {
      font-weight: 600;
      color: #1e293b;
    }
    .empresa-ruc {
      font-size: 0.72rem;
      color: #64748b;
      font-family: monospace;
    }

    .motivo-cell {
      display: flex;
      flex-direction: column;
      max-width: 220px;
    }
    .motivo-text {
      font-weight: 500;
      color: #334155;
    }
    .motivo-obs {
      font-size: 0.7rem;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notif-cell {
      display: flex;
      flex-direction: column;
    }
    .notif-dest {
      font-weight: 600;
      font-size: 0.78rem;
      color: #334155;
    }
    .notif-doc {
      font-size: 0.7rem;
      color: #4f46e5;
      font-family: monospace;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .dot-pulse {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #d97706;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.3); }
      100% { opacity: 1; transform: scale(1); }
    }

    .status-notified {
      background: #d1fae5;
      color: #065f46;
    }
    .check-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
    }

    .sin-archivo {
      color: #94a3b8;
      font-style: italic;
    }
    .fecha-cell {
      white-space: nowrap;
      font-size: 0.78rem;
      color: #64748b;
    }

    .actions-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn-notificar {
      height: 30px !important;
      font-size: 0.75rem !important;
      padding: 0 8px !important;
      line-height: 30px !important;
    }
    .btn-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      margin-right: 3px;
    }

    /* EMPTY & LOADING */
    .loading-state {
      background: #ffffff;
      padding: 3rem;
      border-radius: 12px;
      text-align: center;
      color: #64748b;
    }
    .spin-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #4f46e5;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 1rem 1.25rem;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .empty-state-box {
      padding: 3rem 1rem;
      text-align: center;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .empty-state-box mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }
  `]
})
export class BajasExternasListComponent implements OnInit {
  bajaService = inject(BajaExternaService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  filtroTipo = signal<'EXTERNA' | 'LOCAL' | ''>('');
  filtroEstado = signal<'PENDIENTE' | 'NOTIFICADO' | ''>('');
  busquedaTexto = '';

  displayedColumns: string[] = ['tipo', 'placa', 'empresa', 'motivo', 'notificacion', 'estado', 'evidencia', 'fecha', 'acciones'];

  totalRegistros = computed(() => this.bajaService.bajas().length);
  pendientesCount = computed(() => this.bajaService.bajas().filter(b => b.estado_notificacion === 'PENDIENTE').length);
  externasCount = computed(() => this.bajaService.bajas().filter(b => (b.tipo_baja || 'EXTERNA') === 'EXTERNA').length);
  localesCount = computed(() => this.bajaService.bajas().filter(b => b.tipo_baja === 'LOCAL').length);

  bajasFiltradas = computed(() => {
    let list = this.bajaService.bajas();
    const tipo = this.filtroTipo();
    const estado = this.filtroEstado();

    if (tipo) {
      list = list.filter(b => (b.tipo_baja || 'EXTERNA') === tipo);
    }
    if (estado) {
      list = list.filter(b => b.estado_notificacion === estado);
    }
    return list;
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.bajaService.loadBajas(
      this.filtroEstado() as any, 
      this.filtroTipo() as any, 
      this.busquedaTexto
    );
  }

  setFiltroTipo(tipo: 'EXTERNA' | 'LOCAL' | '') {
    this.filtroTipo.set(tipo);
    this.cargarDatos();
  }

  setFiltroEstado(estado: 'PENDIENTE' | 'NOTIFICADO' | '') {
    this.filtroEstado.set(estado);
    this.cargarDatos();
  }

  aplicarFiltros() {
    this.cargarDatos();
  }

  openForm() {
    const dialogRef = this.dialog.open(BajaExternaFormComponent, {
      width: '680px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'clean-modal-panel',
      data: {
        tipo_baja: this.filtroTipo() || 'EXTERNA'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.cargarDatos();
      }
    });
  }

  verEvidencia(baja: BajaExterna) {
    if (baja.archivo_evidencia) {
      window.open(baja.archivo_evidencia, '_blank');
    }
  }

  abrirModalNotificar(baja: BajaExterna) {
    const dialogRef = this.dialog.open(NotificarBajaDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      panelClass: 'clean-modal-panel',
      data: { baja }
    });

    dialogRef.afterClosed().subscribe((payload) => {
      if (payload) {
        this.bajaService.notificarBaja(baja.id!, payload).subscribe({
          next: () => {
            this.snackBar.open(`Placa ${baja.placa} marcada como NOTIFICADA`, 'OK', { duration: 3000 });
            this.cargarDatos();
          },
          error: (err) => {
            console.error('Error al notificar', err);
            this.snackBar.open('Error al actualizar el estado de notificación', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  eliminar(baja: BajaExterna) {
    if (confirm(`¿Está seguro de eliminar el registro de baja de la placa ${baja.placa}?`)) {
      this.bajaService.eliminarBaja(baja.id!).subscribe({
        next: () => {
          this.snackBar.open(`Registro de baja ${baja.placa} eliminado`, 'OK', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error al eliminar', err);
          this.snackBar.open('Error al eliminar el registro', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
