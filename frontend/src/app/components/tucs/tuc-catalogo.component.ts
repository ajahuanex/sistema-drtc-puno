import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TucService } from '../../services/tuc.service';
import { Tuc, TipoEmisionTuc, EstadoTuc, TucEstadisticas } from '../../models/tuc.model';
import { TucEmitirDialogComponent } from './tuc-emitir-dialog.component';
import { TucKardexModalComponent } from './tuc-kardex-modal.component';
import { TucImportarExcelDialogComponent } from './tuc-importar-excel-dialog.component';

@Component({
  selector: 'app-tuc-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatMenuModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule
  ],
  template: `
    <div class="page-container">
      
      <!-- Encabezado Principal -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-with-icon">
            <mat-icon class="header-icon">card_membership</mat-icon>
            <div>
              <h1 class="page-title">Tarjetas Únicas de Circulación (TUC)</h1>
              <p class="subtitle">Control de Títulos Habilitantes (Físicas & Electrónicas E-TUC) - DRTC Puno</p>
            </div>
          </div>
        </div>

        <!-- Botones de Acción Global -->
        <div class="header-actions">
          <button mat-flat-button class="btn-action btn-sync" [disabled]="sincronizando()" (click)="sincronizarFlota()">
            <mat-icon [class.spinner-icon]="sincronizando()">sync_alt</mat-icon>
            <span>Importar de Flota</span>
          </button>

          <button mat-flat-button class="btn-action btn-kardex" (click)="abrirKardex()">
            <mat-icon>inventory_2</mat-icon>
            <span>Kárdex Stock</span>
          </button>

          <button mat-flat-button class="btn-action btn-excel" (click)="abrirCargaMasiva()">
            <mat-icon>file_upload</mat-icon>
            <span>Carga Masiva Excel</span>
          </button>

          <button mat-raised-button color="primary" class="btn-action btn-emitir" (click)="abrirEmitirDialog()">
            <mat-icon>add_card</mat-icon>
            <span>Emitir Nueva TUC</span>
          </button>
        </div>
      </div>

      <!-- Tarjetas KPI / Métricas Superior -->
      <div class="kpi-grid">
        <div class="kpi-card border-kpi-total">
          <div class="kpi-header">
            <span>Total TUCs</span>
            <mat-icon class="kpi-icon text-slate">badge</mat-icon>
          </div>
          <div class="kpi-value text-slate">{{ estadisticas()?.totalTucs || 0 }}</div>
        </div>

        <div class="kpi-card border-kpi-emerald">
          <div class="kpi-header">
            <span>TUCs Vigentes</span>
            <mat-icon class="kpi-icon text-emerald">check_circle</mat-icon>
          </div>
          <div class="kpi-value text-emerald">{{ estadisticas()?.vigentes || 0 }}</div>
        </div>

        <div class="kpi-card border-kpi-blue">
          <div class="kpi-header">
            <span>E-TUC Digitales</span>
            <mat-icon class="kpi-icon text-blue">bolt</mat-icon>
          </div>
          <div class="kpi-value text-blue">{{ estadisticas()?.electronicas || 0 }}</div>
        </div>

        <div class="kpi-card border-kpi-amber">
          <div class="kpi-header">
            <span>TUCs Físicas</span>
            <mat-icon class="kpi-icon text-amber">content_copy</mat-icon>
          </div>
          <div class="kpi-value text-amber">{{ estadisticas()?.fisicas || 0 }}</div>
        </div>

        <div class="kpi-card border-kpi-rose">
          <div class="kpi-header">
            <span>Anuladas / Bajas</span>
            <mat-icon class="kpi-icon text-rose">block</mat-icon>
          </div>
          <div class="kpi-value text-rose">{{ (estadisticas()?.anuladas || 0) + (estadisticas()?.reemplazadas || 0) }}</div>
        </div>

        <div class="kpi-card border-kpi-purple">
          <div class="kpi-header">
            <span>Stock Kárdex</span>
            <mat-icon class="kpi-icon text-purple">inventory</mat-icon>
          </div>
          <div class="kpi-value text-purple">{{ estadisticas()?.stockFisicoDisponible || 0 }}</div>
        </div>
      </div>

      <!-- Barra de Búsqueda y Filtros Avanzados -->
      <div class="glass-filters">
        <div class="filters-grid">
          
          <!-- Búsqueda General -->
          <div class="search-box">
            <mat-icon class="search-icon">search</mat-icon>
            <input type="text" [(ngModel)]="filtroTexto" (keyup.enter)="buscar()" (input)="onSearchInput()"
                   placeholder="Buscar por N° TUC, Placa, RUC, Razón Social o Resolución..." 
                   class="search-input">
            @if (filtroTexto) {
              <button mat-icon-button type="button" class="btn-clear-search" (click)="limpiarTexto()" title="Borrar búsqueda">
                <mat-icon style="font-size:18px; width:18px; height:18px;">close</mat-icon>
              </button>
            }
          </div>

          <!-- Filtro Tipo Emisión -->
          <div class="filter-box">
            <select [(ngModel)]="filtroTipo" (change)="buscar()" class="filter-select">
              <option value="">-- Todos los Tipos --</option>
              <option value="ELECTRONICA">⚡ ELECTRÓNICA (E-TUC)</option>
              <option value="FISICA">📜 FÍSICA (Cartulina Kárdex)</option>
            </select>
          </div>

          <!-- Filtro Estado -->
          <div class="filter-box">
            <select [(ngModel)]="filtroEstado" (change)="buscar()" class="filter-select">
              <option value="">-- Todos los Estados --</option>
              <option value="VIGENTE">VIGENTE</option>
              <option value="ANULADA">ANULADA</option>
              <option value="REEMPLAZADA">REEMPLAZADA</option>
              <option value="ANULADA_POR_DUPLICADO">ANULADA POR DUPLICADO</option>
            </select>
          </div>

          <!-- Botones Búsqueda -->
          <div class="filter-buttons">
            <button mat-flat-button color="primary" (click)="buscar()" class="btn-filter">
              <mat-icon style="font-size:18px; width:18px; height:18px; margin-right:4px;">search</mat-icon> Buscar
            </button>
            <button mat-stroked-button (click)="limpiarFiltros()" class="btn-clear">
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla Moderna -->
      <mat-card class="table-card">
        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>N° TUC</th>
                <th>Tipo</th>
                <th>Placa / Vehículo</th>
                <th>Empresa / RUC</th>
                <th>Resolución</th>
                <th>Vigencia</th>
                <th class="text-center">Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              @if (cargando()) {
                <tr>
                  <td colspan="8" class="loading-cell">
                    <mat-icon class="spinner-icon">sync</mat-icon>
                    <span>Cargando registros de TUCs...</span>
                  </td>
                </tr>
              } @else if (tucs().length === 0) {
                <tr>
                  <td colspan="8" class="empty-cell">
                    <mat-icon class="empty-icon">badge</mat-icon>
                    <p class="empty-title">No se encontraron Tarjetas Únicas de Circulación.</p>
                    <p class="empty-desc">Pruebe ajustando los filtros o registre una nueva emisión.</p>
                  </td>
                </tr>
              } @else {
                @for (tuc of tucs(); track tuc.id || tuc.nroTuc) {
                  <tr>
                    
                    <!-- N° TUC -->
                    <td>
                      <span class="tuc-badge font-mono">
                        {{ tuc.nroTuc }}
                      </span>
                    </td>

                    <!-- Tipo Emisión -->
                    <td>
                      @if (tuc.tipoEmision === 'ELECTRONICA') {
                        <span class="tipo-badge tipo-electronica">
                          ⚡ E-TUC
                        </span>
                      } @else {
                        <span class="tipo-badge tipo-fisica">
                          📜 FÍSICA
                        </span>
                      }
                    </td>

                    <!-- Placa / Vehículo -->
                    <td>
                      <div class="placa-wrapper">
                        <div class="placa-badge font-mono">
                          <span class="placa-pais">PERÚ</span>
                          <span class="placa-codigo">{{ tuc.placa }}</span>
                        </div>
                        <div class="vehiculo-sub">
                          {{ tuc.datosVehiculo?.['marca'] || '' }} {{ tuc.datosVehiculo?.['categoria'] || '' }}
                        </div>
                      </div>
                    </td>

                    <!-- Empresa / RUC -->
                    <td class="max-w-xs truncate">
                      <div class="empresa-title" [title]="tuc.razonSocial">{{ tuc.razonSocial }}</div>
                      <div class="ruc-sub font-mono">RUC: {{ tuc.ruc }}</div>
                    </td>

                    <!-- Resolución -->
                    <td>
                      <div class="res-title font-mono">{{ cleanResolucion(tuc.nroResolucion) }}</div>
                      @if (getTucBadge(tuc)) {
                        <div class="motivo-sub" style="margin-top: 3px;">
                          <span class="tipo-hija-pill tipo-{{ getTucBadgeCode(tuc) }}">
                            {{ getTucBadge(tuc) }}
                          </span>
                        </div>
                      }
                    </td>

                    <!-- Vigencia Desde - Hasta -->
                    <td class="whitespace-nowrap">
                      <div class="fecha-main">{{ tuc.fechaEmision }}</div>
                      <div class="fecha-sub">Al {{ tuc.fechaVencimiento || 'INDEFINIDO' }}</div>
                    </td>

                    <!-- Estado -->
                    <td class="text-center">
                      <span class="status-pill"
                            [ngClass]="{
                              'status-vigente': tuc.estado === 'VIGENTE',
                              'status-anulada': tuc.estado === 'ANULADA' || tuc.estado === 'ANULADA_POR_DUPLICADO',
                              'status-reemplazada': tuc.estado === 'REEMPLAZADA'
                            }">
                        {{ tuc.estado.replace('_', ' ') }}
                      </span>
                    </td>

                    <!-- Acciones -->
                    <td class="text-right">
                      <div class="actions-flex">
                        
                        <!-- Abrir Verificación QR Pública -->
                        <a [href]="'/verificar-tuc/' + (tuc.hashSeguridad || tuc.nroTuc)" target="_blank"
                           class="btn-icon-qr" matTooltip="Verificar QR de Inspección">
                          <mat-icon>qr_code_2</mat-icon>
                        </a>

                        <!-- Menú Más Opciones -->
                        <button mat-icon-button [matMenuTriggerFor]="menu" class="btn-more">
                          <mat-icon>more_vert</mat-icon>
                        </button>

                        <mat-menu #menu="matMenu">
                          <button mat-menu-item (click)="anularTuc(tuc)" class="text-warn">
                            <mat-icon color="warn">block</mat-icon>
                            <span>Anular TUC</span>
                          </button>
                        </mat-menu>

                      </div>
                    </td>

                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Paginador Angular Material -->
        <mat-paginator [length]="totalRecords()"
                       [pageSize]="pageSize()"
                       [pageSizeOptions]="[10, 25, 50, 100]"
                       (page)="onPageChange($event)">
        </mat-paginator>

      </mat-card>

    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      min-height: 100vh;
      background-color: #f8fafc;
      color: #0f172a;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-content {
      display: flex;
      align-items: center;
    }

    .title-with-icon {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #1e3a8a;
      background: #eff6ff;
      padding: 12px;
      border-radius: 16px;
      border: 1px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .page-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 4px 0 0 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 13px;
      border-radius: 10px;
      padding: 8px 16px;
      transition: all 0.2s;
    }

    .btn-sync {
      background: #ffffff;
      color: #0369a1;
      border: 1px solid #bae6fd;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .btn-sync:hover { background: #f0f9ff; }

    .btn-kardex {
      background: #ffffff;
      color: #b45309;
      border: 1px solid #fde68a;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .btn-kardex:hover { background: #fffbeb; }

    .btn-excel {
      background: #ffffff;
      color: #047857;
      border: 1px solid #a7f3d0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .btn-excel:hover { background: #ecfdf5; }

    .btn-emitir {
      background: #1e3a8a !important;
      color: #ffffff !important;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
    }
    .btn-emitir:hover {
      background: #1e40af !important;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .border-kpi-total { border-top: 4px solid #64748b; }
    .border-kpi-emerald { border-top: 4px solid #10b981; }
    .border-kpi-blue { border-top: 4px solid #2563eb; }
    .border-kpi-amber { border-top: 4px solid #f59e0b; }
    .border-kpi-rose { border-top: 4px solid #ef4444; }
    .border-kpi-purple { border-top: 4px solid #8b5cf6; }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 6px;
      font-weight: 600;
    }

    .kpi-value {
      font-size: 26px;
      font-weight: 900;
    }

    .text-slate { color: #0f172a; }
    .text-emerald { color: #059669; }
    .text-blue { color: #2563eb; }
    .text-amber { color: #d97706; }
    .text-rose { color: #e11d48; }
    .text-purple { color: #7c3aed; }

    /* Glass Filters */
    .glass-filters {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto;
      gap: 12px;
      align-items: center;
    }

    @media (max-width: 900px) {
      .filters-grid {
        grid-template-columns: 1fr;
      }
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      font-size: 20px;
    }

    .search-input {
      width: 100%;
      padding: 10px 12px 10px 40px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      color: #0f172a;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: #2563eb;
      background: #ffffff;
    }

    .btn-clear-search {
      position: absolute;
      right: 6px;
      color: #94a3b8;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .filter-select {
      width: 100%;
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      color: #0f172a;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }

    .filter-select:focus {
      border-color: #2563eb;
      background: #ffffff;
    }

    .filter-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-filter {
      padding: 8px 16px;
      border-radius: 10px;
      background: #1e3a8a !important;
      color: #ffffff !important;
    }

    .btn-clear {
      color: #64748b;
      border-color: #cbd5e1;
    }

    /* Table Styles */
    .table-card {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 16px !important;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
    }

    .table-container {
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f8fafc;
    }

    .table-container::-webkit-scrollbar {
      height: 8px;
    }
    .table-container::-webkit-scrollbar-track {
      background: #f8fafc;
    }
    .table-container::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .custom-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
      min-width: 950px;
    }

    .custom-table th {
      background: #f8fafc;
      color: #475569;
      padding: 14px 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      border-bottom: 2px solid #e2e8f0;
      letter-spacing: 0.05em;
    }

    .custom-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
    }

    .custom-table tr:hover td {
      background: #f8fafc;
    }

    .tuc-badge {
      font-weight: 800;
      font-size: 13px;
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      color: #0f172a;
    }

    .tipo-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }

    .tipo-electronica {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }

    .tipo-fisica {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    /* Placa Oficial Perú */
    .placa-wrapper {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .placa-badge {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      background: #ffffff;
      border: 1.5px solid #0f172a;
      border-radius: 4px;
      padding: 1px 8px 2px 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      width: fit-content;
    }

    .placa-pais {
      font-size: 8px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: 1.2px;
      line-height: 1;
    }

    .placa-codigo {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.05em;
      line-height: 1.1;
    }

    .vehiculo-sub { font-size: 11px; color: #64748b; margin-top: 2px; }

    .empresa-title { font-weight: 700; color: #0f172a; font-size: 0.9rem; }
    .ruc-sub { font-size: 11px; color: #1e40af; font-weight: 600; }

    .res-title { font-weight: 700; color: #047857; }
    .motivo-sub { font-size: 10px; color: #64748b; text-transform: uppercase; }

    .tipo-hija-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 7px;
      border-radius: 6px;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      
      &.tipo-i { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
      &.tipo-s { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
      &.tipo-m { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
      &.tipo-fe { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
      &.tipo-r { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
      &.tipo-d { background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; }
      &.tipo-c { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
      &.tipo-o { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    }

    .fecha-main { font-weight: 600; color: #0f172a; }
    .fecha-sub { font-size: 11px; color: #64748b; }

    .status-pill {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-vigente {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }

    .status-anulada {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .status-reemplazada {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .actions-flex {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .btn-icon-qr {
      color: #1e40af;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 6px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-icon-qr:hover {
      background: #dbeafe;
      color: #1e3a8a;
    }

    .btn-more {
      color: #64748b;
    }

    .loading-cell, .empty-cell {
      text-align: center;
      padding: 40px 16px;
      color: #64748b;
    }

    .spinner-icon {
      animation: spin 1s linear infinite;
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-bottom: 8px;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .empty-title {
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .empty-desc {
      font-size: 12px;
      color: #64748b;
      margin: 4px 0 0 0;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-warn { color: #f43f5e; }

    /* ==========================================================================
       MODO OSCURO (DARK MODE / FISCALIZACIÓN NOCTURNA) - STITCH GOVTECH
       ========================================================================== */
    :host-context([data-theme="dark"]),
    :host-context(.dark-theme) {
      .page-container {
        background-color: #0b1329 !important;
        color: #f8fafc !important;
      }

      .page-header {
        border-bottom-color: #1e293b !important;
      }

      .header-icon {
        background: rgba(59, 130, 246, 0.15) !important;
        border-color: rgba(59, 130, 246, 0.3) !important;
        color: #60a5fa !important;
      }

      .page-title {
        color: #f8fafc !important;
      }

      .subtitle {
        color: #94a3b8 !important;
      }

      .btn-sync {
        background: #1e293b !important;
        color: #38bdf8 !important;
        border-color: rgba(56, 189, 248, 0.3) !important;
      }
      .btn-sync:hover { background: #334155 !important; }

      .btn-kardex {
        background: #1e293b !important;
        color: #fbbf24 !important;
        border-color: rgba(245, 158, 11, 0.3) !important;
      }
      .btn-kardex:hover { background: #334155 !important; }

      .btn-excel {
        background: #1e293b !important;
        color: #34d399 !important;
        border-color: rgba(16, 185, 129, 0.3) !important;
      }
      .btn-excel:hover { background: #334155 !important; }

      .btn-emitir {
        background: #2563eb !important;
        color: #ffffff !important;
      }
      .btn-emitir:hover { background: #1d4ed8 !important; }

      .kpi-card {
        background: #111827 !important;
        border-color: #1e293b !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
      }

      .kpi-header {
        color: #94a3b8 !important;
      }

      .text-slate { color: #f8fafc !important; }
      .text-emerald { color: #34d399 !important; }
      .text-blue { color: #60a5fa !important; }
      .text-amber { color: #fbbf24 !important; }
      .text-rose { color: #f87171 !important; }
      .text-purple { color: #c084fc !important; }

      .glass-filters {
        background: #111827 !important;
        border-color: #1e293b !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
      }

      .search-input {
        background: #0b0f19 !important;
        border-color: #334155 !important;
        color: #f8fafc !important;
      }
      .search-input:focus {
        border-color: #3b82f6 !important;
      }

      .filter-select {
        background: #0b0f19 !important;
        border-color: #334155 !important;
        color: #f8fafc !important;
      }
      .filter-select:focus {
        border-color: #3b82f6 !important;
      }

      .btn-filter {
        background: #2563eb !important;
      }
      .btn-clear {
        color: #94a3b8 !important;
        border-color: #334155 !important;
      }

      .table-card {
        background: #111827 !important;
        border-color: #1e293b !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
      }

      .table-container {
        scrollbar-color: #334155 #0f172a !important;
      }
      .table-container::-webkit-scrollbar-track {
        background: #0f172a !important;
      }
      .table-container::-webkit-scrollbar-thumb {
        background: #334155 !important;
      }

      .custom-table th {
        background: #0f172a !important;
        color: #94a3b8 !important;
        border-bottom-color: #1e293b !important;
      }

      .custom-table td {
        border-bottom-color: #1e293b !important;
        color: #f1f5f9 !important;
      }

      .custom-table tr:hover td {
        background: #1e293b !important;
      }

      .tuc-badge {
        background: #0f172a !important;
        border-color: #334155 !important;
        color: #f8fafc !important;
      }

      .tipo-electronica {
        background: rgba(59, 130, 246, 0.15) !important;
        color: #93c5fd !important;
        border-color: rgba(59, 130, 246, 0.3) !important;
      }

      .tipo-fisica {
        background: rgba(245, 158, 11, 0.15) !important;
        color: #fde047 !important;
        border-color: rgba(245, 158, 11, 0.3) !important;
      }

      .empresa-title {
        color: #f8fafc !important;
      }
      .ruc-sub {
        color: #60a5fa !important;
      }

      .res-title {
        color: #34d399 !important;
      }

      .fecha-main {
        color: #f8fafc !important;
      }
      .fecha-sub {
        color: #94a3b8 !important;
      }

      .status-vigente {
        background: rgba(16, 185, 129, 0.15) !important;
        color: #34d399 !important;
        border-color: rgba(16, 185, 129, 0.3) !important;
      }

      .status-anulada {
        background: rgba(239, 68, 68, 0.15) !important;
        color: #f87171 !important;
        border-color: rgba(239, 68, 68, 0.3) !important;
      }

      .status-reemplazada {
        background: rgba(245, 158, 11, 0.15) !important;
        color: #fbbf24 !important;
        border-color: rgba(245, 158, 11, 0.3) !important;
      }

      .btn-icon-qr {
        color: #60a5fa !important;
        background: rgba(59, 130, 246, 0.15) !important;
        border-color: rgba(59, 130, 246, 0.3) !important;
      }
      .btn-icon-qr:hover {
        background: rgba(59, 130, 246, 0.3) !important;
      }

      .btn-more {
        color: #94a3b8 !important;
      }

      .empty-title {
        color: #f8fafc !important;
      }
      .empty-desc {
        color: #94a3b8 !important;
      }
    }
  `]
})
export class TucCatalogoComponent implements OnInit {
  private tucService = inject(TucService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  tucs = signal<Tuc[]>([]);
  totalRecords = signal<number>(0);
  estadisticas = signal<TucEstadisticas | null>(null);
  cargando = signal<boolean>(true);
  sincronizando = signal<boolean>(false);

  filtroTexto = '';
  filtroTipo: TipoEmisionTuc | '' = '';
  filtroEstado: EstadoTuc | '' = '';

  pageIndex = signal<number>(0);
  pageSize = signal<number>(25);

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.tucService.getEstadisticas().subscribe({
      next: (res) => this.estadisticas.set(res)
    });
  }

  private searchTimeout: any;

  cargarDatos(): void {
    this.cargando.set(true);

    const filtros: any = {
      skip: this.pageIndex() * this.pageSize(),
      limit: this.pageSize()
    };

    if (this.filtroTexto && this.filtroTexto.trim()) {
      filtros.q = this.filtroTexto.trim();
    }

    if (this.filtroTipo) filtros.tipoEmision = this.filtroTipo;
    if (this.filtroEstado) filtros.estado = this.filtroEstado;

    this.tucService.getTucs(filtros).subscribe({
      next: (res) => {
        this.tucs.set(res.items);
        this.totalRecords.set(res.total);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.snackBar.open(`Error al cargar TUCs: ${err?.error?.detail || err.message}`, 'Cerrar', { duration: 4000 });
      }
    });
  }

  onSearchInput(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.buscar();
    }, 350);
  }

  limpiarTexto(): void {
    this.filtroTexto = '';
    this.buscar();
  }

  buscar(): void {
    this.pageIndex.set(0);
    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroTipo = '';
    this.filtroEstado = '';
    this.pageIndex.set(0);
    this.cargarDatos();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarDatos();
  }

  abrirEmitirDialog(): void {
    const dialogRef = this.dialog.open(TucEmitirDialogComponent, {
      width: '640px',
      panelClass: 'dark-modal'
    });

    dialogRef.afterClosed().subscribe((emitido) => {
      if (emitido) {
        this.cargarDatos();
        this.cargarEstadisticas();
      }
    });
  }

  abrirKardex(): void {
    this.dialog.open(TucKardexModalComponent, {
      width: '600px',
      panelClass: 'dark-modal'
    });
  }

  abrirCargaMasiva(): void {
    const dialogRef = this.dialog.open(TucImportarExcelDialogComponent, {
      width: '600px',
      panelClass: 'dark-modal'
    });

    dialogRef.afterClosed().subscribe((importado) => {
      if (importado) {
        this.cargarDatos();
        this.cargarEstadisticas();
      }
    });
  }

  anularTuc(tuc: Tuc): void {
    const motivo = prompt(`Ingrese el motivo administrativo para anular la TUC ${tuc.nroTuc}:`);
    if (!motivo || !motivo.trim()) return;

    if (tuc.id || tuc._id) {
      const targetId = tuc.id || tuc._id!;
      this.tucService.anularTuc(targetId, motivo).subscribe({
        next: () => {
          this.snackBar.open(`TUC ${tuc.nroTuc} fue anulada correctamente.`, 'OK', { duration: 3000 });
          this.cargarDatos();
          this.cargarEstadisticas();
        }
      });
    }
  }

  cleanResolucion(raw?: string): string {
    if (!raw) return '-';
    let str = raw.trim().toUpperCase();
    const suffixMatch = str.match(/\s*[-_ ]\s*(FE|[ISRMDCO])$/i);
    if (suffixMatch) {
      str = str.substring(0, suffixMatch.index).trim();
    }
    return str;
  }

  getTipoHijaCode(tipoOrStr?: string): string {
    if (!tipoOrStr) return 'o';
    const clean = tipoOrStr.trim().toUpperCase();
    if (['I', 'INCREMENTO', 'INCREMENTO_FLOTA'].includes(clean)) return 'i';
    if (['S', 'SUSTITUCION', 'SUSTITUCIÓN', 'SUSTITUCION_VEHICULO'].includes(clean)) return 's';
    if (['M', 'MODIFICACION', 'MODIFICACIÓN'].includes(clean)) return 'm';
    if (['FE', 'FE_DE_ERRATAS', 'FE DE ERRATAS', 'FE DE ERRATA', 'FE-ERRATAS'].includes(clean)) return 'fe';
    if (['R', 'RENOVACION', 'RENOVACIÓN', 'RENOVACION_AUTORIZACION'].includes(clean)) return 'r';
    if (['D', 'DUPLICADO', 'DUPLICADO_TUC'].includes(clean)) return 'd';
    if (['C', 'CANCELACION', 'CANCELACIÓN', 'CANJE', 'CANJE_TUC'].includes(clean)) return 'c';
    if (['O', 'OTROS', 'OTRO', 'PRIMIGENIA'].includes(clean)) return 'o';
    const match = clean.match(/[-_ ]\s*(FE|[ISRMDCO])$/);
    if (match) return match[1].toLowerCase();
    return 'o';
  }

  getTucBadgeCode(tuc: Tuc): string {
    const tipoHija = (tuc as any)?.tipo_resolucion_hija;
    if (tipoHija) return this.getTipoHijaCode(tipoHija);

    const motivo = (tuc?.motivoEmision || '').trim().toUpperCase();
    if (motivo && motivo !== 'HISTORICO_MIGRADO') {
      return this.getTipoHijaCode(motivo);
    }

    if (tuc?.nroResolucion) {
      return this.getTipoHijaCode(tuc.nroResolucion);
    }
    return 'i';
  }

  getTucBadge(tuc: Tuc): string {
    const tipoHija = (tuc as any)?.tipo_resolucion_hija;
    if (tipoHija) return this.getMotivoBadge(tipoHija);

    const motivo = (tuc?.motivoEmision || '').trim().toUpperCase();
    if (motivo && motivo !== 'HISTORICO_MIGRADO') {
      return this.getMotivoBadge(motivo);
    }

    if (tuc?.nroResolucion) {
      return this.getMotivoBadge(tuc.nroResolucion);
    }
    return 'INCREMENTO';
  }

  getMotivoBadge(motivoOrTipo?: string): string {
    if (!motivoOrTipo) return '';
    const clean = motivoOrTipo.trim().toUpperCase();
    const map: Record<string, string> = {
      INCREMENTO_FLOTA: 'INCREMENTO',
      SUSTITUCION_VEHICULO: 'SUSTITUCIÓN',
      RENOVACION_AUTORIZACION: 'RENOVACIÓN',
      DUPLICADO_TUC: 'DUPLICADO',
      CANJE_TUC: 'CANJE',
      PRIMIGENIA: 'PRIMIGENIA',
      FE_DE_ERRATAS: 'FE DE ERRATAS',
      FE: 'FE DE ERRATAS',
      I: 'INCREMENTO',
      S: 'SUSTITUCIÓN',
      M: 'MODIFICACIÓN',
      R: 'RENOVACIÓN',
      D: 'DUPLICADO',
      C: 'CANCELACIÓN',
      O: 'OTROS'
    };
    if (map[clean]) return map[clean];
    const code = this.getTipoHijaCode(clean).toUpperCase();
    return map[code] || clean.replace(/_/g, ' ');
  }

  sincronizarFlota(): void {
    if (!confirm('¿Desea importar y sincronizar las TUCs existentes desde el módulo de Flota por Empresa?')) {
      return;
    }

    this.sincronizando.set(true);
    this.tucService.sincronizarDesdeFlotaEmpresa().subscribe({
      next: (res) => {
        this.sincronizando.set(false);
        this.snackBar.open(
          `Sincronización completada: ${res.importados} TUCs nuevas importadas, ${res.actualizados} actualizadas. Total Flota: ${res.totalFlota}`,
          'Excelente',
          { duration: 5000 }
        );
        this.cargarDatos();
        this.cargarEstadisticas();
      },
      error: (err) => {
        this.sincronizando.set(false);
        this.snackBar.open(`Error al sincronizar con flota: ${err?.error?.detail || err.message}`, 'Cerrar', { duration: 4000 });
      }
    });
  }
}
