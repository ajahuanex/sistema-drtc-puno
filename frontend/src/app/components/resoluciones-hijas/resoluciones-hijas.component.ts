import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { ResolucionHijaService } from '../../services/resolucion-hija.service';
import { GoogleSheetsService } from '../../services/google-sheets.service';
import {
  ResolucionHija,
  TipoActoModificatorio,
  ResolucionHijaCreate
} from '../../models/resolucion-hija.model';

@Component({
  selector: 'app-resoluciones-hijas',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatSelectModule,
    MatDialogModule,
    MatTooltipModule,
    MatTabsModule,
    MatMenuModule,
    MatDividerModule,
    MatCheckboxModule
  ],
  template: `
    <div class="page-container">
      <!-- Submódulo Selector Tabs (Primigenias vs Hijas) -->
      <div class="resoluciones-nav-tabs">
        <a routerLink="/resoluciones-primigenias" routerLinkActive="tab-active" class="res-tab-item">
          <mat-icon class="tab-icon">auto_awesome</mat-icon>
          <span class="tab-title">Resoluciones Primigenias</span>
          <span class="tab-tag tag-primigenia">Originarias</span>
        </a>
        <a routerLink="/resoluciones-hijas" routerLinkActive="tab-active" [routerLinkActiveOptions]="{ exact: true }" class="res-tab-item">
          <mat-icon class="tab-icon">alt_route</mat-icon>
          <span class="tab-title">Resoluciones Hijas</span>
          <span class="tab-tag tag-hija">Modificatorias</span>
        </a>
      </div>

      <!-- Header Banner -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-with-icon">
            <mat-icon class="header-icon">alt_route</mat-icon>
            <div>
              <h1>Resoluciones Hijas / Modificatorias</h1>
              <p class="subtitle">Gestión de actos administrativos que alteran o extienden la autorización originaria</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          @if (selectedIdsState().length > 0) {
            <button mat-raised-button color="warn" (click)="eliminarSeleccionados()" [disabled]="isLoading()">
              <mat-icon>delete_sweep</mat-icon> Eliminar Seleccionados ({{ selectedIdsState().length }})
            </button>
          }
          <button mat-raised-button color="accent" (click)="descargarPlantilla()" [disabled]="isLoading()">
            <mat-icon>file_download</mat-icon> Plantilla Excel
          </button>
          <button mat-raised-button color="accent" (click)="abrirCargaMasiva()" [disabled]="isLoading()">
            <mat-icon>file_upload</mat-icon> Carga Masiva
          </button>
          <button mat-raised-button class="btn-primary-custom" (click)="toggleFormModal()" [disabled]="isLoading()">
            <mat-icon>add_circle</mat-icon> Nueva Resolución Hija
          </button>
        </div>
      </div>

      <div class="content-section">
        <!-- Tarjeta de Filtros -->
        <mat-card class="filters-card">
          <mat-card-content>
            <div class="filters-row">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Buscar por N° Hija, N° Primigenia o RUC</mat-label>
                <input matInput [formControl]="searchControl" placeholder="Ej: 0450-2023 ó 0100-2021">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Tipo de Acto Modificatorio</mat-label>
                <mat-select [formControl]="tipoActoControl">
                  <mat-option value="">Todos los Actos</mat-option>
                  <mat-option value="RENOVACION">Renovación</mat-option>
                  <mat-option value="INCREMENTO_FLOTA">Incremento de Flota</mat-option>
                  <mat-option value="SUSTITUCION_VEHICULAR">Sustitución Vehicular</mat-option>
                  <mat-option value="BAJA_VEHICULAR">Baja Vehicular</mat-option>
                  <mat-option value="MODIFICACION_RUTA">Modificación de Ruta</mat-option>
                  <mat-option value="CAMBIO_REPRESENTANTE">Cambio de Representante</mat-option>
                  <mat-option value="SUSPENSION_TEMPORAL">Suspensión Temporal</mat-option>
                  <mat-option value="CANCELACION_PARCIAL">Cancelación Parcial</mat-option>
                  <mat-option value="OTROS">Otros Actos</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-stroked-button (click)="limpiarFiltros()" class="btn-clear">
                <mat-icon>clear_all</mat-icon> Limpiar
              </button>

              <button mat-stroked-button [matMenuTriggerFor]="columnsMenu" class="btn-clear" matTooltip="Configurar columnas visibles de la tabla">
                <mat-icon>tune</mat-icon> Columnas
              </button>

              <mat-menu #columnsMenu="matMenu">
                <div class="columns-menu-header" (click)="$event.stopPropagation()">
                  <span>Columnas Visibles</span>
                  <button mat-button color="primary" (click)="restablecerColumnas()">Restablecer</button>
                </div>
                <mat-divider></mat-divider>
                @for (col of columnasDisponibles; track col.key) {
                  @if (!col.required) {
                    <div mat-menu-item (click)="$event.stopPropagation(); toggleColumna(col.key)" class="col-item">
                      <mat-checkbox
                        [checked]="columnaVisible(col.key)"
                        (change)="toggleColumna(col.key)"
                        (click)="$event.stopPropagation()">
                        {{ col.label }}
                      </mat-checkbox>
                    </div>
                  }
                }
              </mat-menu>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Modal: Carga Masiva (Excel / Google Sheets) -->
        @if (showCargaMasivaModal()) {
          <mat-card class="form-card animate-fade-in border-teal">
            <mat-card-header>
              <mat-card-title>
                <mat-icon style="color: #0d9488;">cloud_upload</mat-icon>
                Carga Masiva de Resoluciones Hijas (Actos Modificatorios)
              </mat-card-title>
            </mat-card-header>
            <mat-card-content style="padding-top: 1rem;">
              <mat-tab-group>
                <!-- Pestaña 1: Archivo Local -->
                <mat-tab>
                  <ng-template mat-tab-label>
                    <mat-icon style="margin-right: 6px;">insert_drive_file</mat-icon> Archivo Excel / CSV
                  </ng-template>
                  <div style="padding: 1.5rem 0;">
                    <p style="color: #4b5563; margin-bottom: 1.25rem;">
                      Selecciona una hoja de cálculo en formato <strong>Excel (.xlsx, .xls)</strong> o <strong>CSV (.csv)</strong> descargado de tu equipo.
                    </p>
                    <input #fileInput type="file" accept=".xlsx,.xls,.csv" (change)="procesarArchivoLocal($event)" style="display: none;">
                    <button mat-raised-button color="primary" (click)="fileInput.click()" [disabled]="isLoading()">
                      <mat-icon>upload_file</mat-icon> Seleccionar Archivo Local
                    </button>
                  </div>
                </mat-tab>

                <!-- Pestaña 2: Google Sheets -->
                <mat-tab>
                  <ng-template mat-tab-label>
                    <mat-icon style="margin-right: 6px; color: #10b981;">table_chart</mat-icon> Google Sheets (URL)
                  </ng-template>
                  <div style="padding: 1.5rem 0;">
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.85rem; margin-bottom: 1.25rem; font-size: 0.88rem; color: #166534;">
                      <mat-icon style="vertical-align: middle; font-size: 1.2rem; height: 1.2rem; width: 1.2rem; margin-right: 4px;">info</mat-icon>
                      Asegúrate de que la hoja de Google Sheets tenga permisos de lectura públicos (<strong>"Cualquier persona con el enlace puede ver"</strong>).
                    </div>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Enlace Público de Google Sheets</mat-label>
                      <input matInput [formControl]="googleSheetsUrl" placeholder="https://docs.google.com/spreadsheets/d/...">
                      <mat-icon matSuffix>link</mat-icon>
                    </mat-form-field>
                    <button mat-raised-button style="background-color: #0d9488; color: white;" (click)="procesarGoogleSheets()" [disabled]="googleSheetsUrl.invalid || !googleSheetsUrl.value || isLoading()">
                      <mat-icon>cloud_download</mat-icon> Importar desde Google Sheets
                    </button>
                  </div>
                </mat-tab>
              </mat-tab-group>

              <div class="form-actions" style="margin-top: 1rem;">
                <button mat-button (click)="cerrarCargaMasivaModal()">Cerrar</button>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Modal: Ver Detalle Completo -->
        @if (showDetailModal() && selectedHija(); as det) {
          <mat-card class="form-card animate-fade-in border-teal" style="border-left: 4px solid #0284c7;">
            <mat-card-header style="display: flex; justify-content: space-between; align-items: center;">
              <mat-card-title style="display: flex; align-items: center; gap: 0.5rem; color: #0369a1;">
                <mat-icon style="color: #0284c7;">visibility</mat-icon>
                Detalle de Resolución Hija: {{ det.nro_resolucion }}
              </mat-card-title>
              <button mat-icon-button (click)="cerrarDetalleModal()">
                <mat-icon>close</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content style="padding-top: 1rem;">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">N° Resolución Hija</span>
                  <span class="detail-value bold-text color-teal">{{ det.nro_resolucion }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">N° Primigenia Matriz</span>
                  <span class="detail-value"><span class="primigenia-pill">{{ formatPrimigeniaNro(det.nro_resolucion_primigenia) }}</span></span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">RUC Empresa</span>
                  <span class="detail-value"><span class="ruc-badge">{{ det.ruc_empresa }}</span></span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Razón Social</span>
                  <span class="detail-value bold-text">{{ det.razon_social || 'Sin información' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Tipo de Acto</span>
                  <span class="detail-value">
                    <span [class]="'acto-badge acto-' + (det.tipo_acto ? det.tipo_acto.toLowerCase() : '')">
                      {{ getTipoActoDisplay(det.tipo_acto) }}
                    </span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Fecha Emisión</span>
                  <span class="detail-value">{{ det.fecha_resolucion | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">N° Expediente</span>
                  <span class="detail-value">{{ det.expediente_numero || '-' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Documento en Drive</span>
                  <span class="detail-value">
                    @if (det.link_documento) {
                      <a [href]="det.link_documento" target="_blank" class="drive-link">
                        Abrir Documento <mat-icon style="font-size: 1rem; height: 1rem; width: 1rem; vertical-align: middle;">open_in_new</mat-icon>
                      </a>
                    } @else {
                      -
                    }
                  </span>
                </div>
              </div>

              <div class="detail-lists" style="margin-top: 1.25rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                <div class="detail-card-box" style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1rem; border-radius: 8px;">
                  <h4 style="margin: 0 0 0.5rem 0; color: #166534; font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                    <mat-icon style="font-size: 1.1rem; height: 1.1rem; width: 1.1rem; color: #16a34a;">directions_car</mat-icon>
                    Vehículos Ingresantes (+{{ det.vehiculos_ingresantes.length || 0 }})
                  </h4>
                  @if (det.vehiculos_ingresantes && det.vehiculos_ingresantes.length > 0) {
                    <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                      @for (placa of det.vehiculos_ingresantes; track placa) {
                        <span class="badge-veh veh-in" style="font-size: 0.82rem; padding: 0.25rem 0.6rem;">{{ placa }}</span>
                      }
                    </div>
                  } @else {
                    <span class="sin-datos" style="font-size: 0.85rem;">Ningún vehículo ingresante</span>
                  }
                </div>

                <div class="detail-card-box" style="background: #fef2f2; border: 1px solid #fecaca; padding: 1rem; border-radius: 8px;">
                  <h4 style="margin: 0 0 0.5rem 0; color: #991b1b; font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                    <mat-icon style="font-size: 1.1rem; height: 1.1rem; width: 1.1rem; color: #dc2626;">no_crash</mat-icon>
                    Vehículos Salientes / Baja (-{{ det.vehiculos_salientes.length || 0 }})
                  </h4>
                  @if (det.vehiculos_salientes && det.vehiculos_salientes.length > 0) {
                    <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                      @for (placa of det.vehiculos_salientes; track placa) {
                        <span class="badge-veh veh-out" style="font-size: 0.82rem; padding: 0.25rem 0.6rem;">{{ placa }}</span>
                      }
                    </div>
                  } @else {
                    <span class="sin-datos" style="font-size: 0.85rem;">Ningún vehículo saliente</span>
                  }
                </div>
              </div>

              @if (det.observaciones) {
                <div style="margin-top: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.85rem; border-radius: 8px;">
                  <span style="font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase;">Observaciones:</span>
                  <p style="margin: 0.25rem 0 0 0; color: #334155; font-size: 0.9rem;">{{ det.observaciones }}</p>
                </div>
              }

              <div class="form-actions" style="margin-top: 1.25rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button mat-stroked-button color="primary" (click)="editarResolucion(det)">
                  <mat-icon>edit</mat-icon> Editar Resolución
                </button>
                <button mat-raised-button color="primary" (click)="cerrarDetalleModal()">Cerrar</button>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Formulario Modal / Drawer (Creación y Edición) -->
        @if (showFormModal()) {
          <mat-card class="form-card animate-fade-in">
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="primary">{{ isEditMode() ? 'edit_note' : 'post_add' }}</mat-icon>
                {{ isEditMode() ? 'Editar Resolución Hija (Acto Modificatorio)' : 'Registrar Nueva Resolución Hija (Acto Modificatorio)' }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="hijaForm" (ngSubmit)="guardarResolucionHija()" class="hija-form">
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Número de Resolución Hija</mat-label>
                    <input matInput formControlName="nro_resolucion" placeholder="Ej: 0450-2023">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>N° Primigenia Asociada</mat-label>
                    <input matInput formControlName="nro_resolucion_primigenia" placeholder="Ej: 0100-2021">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>RUC Empresa (11 dígitos)</mat-label>
                    <input matInput formControlName="ruc_empresa" maxlength="11" placeholder="Ej: 20123456789">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Tipo de Acto Modificatorio</mat-label>
                    <mat-select formControlName="tipo_acto">
                      <mat-option value="INCREMENTO_FLOTA">Incremento de Flota</mat-option>
                      <mat-option value="SUSTITUCION_VEHICULAR">Sustitución Vehicular</mat-option>
                      <mat-option value="RENOVACION">Renovación</mat-option>
                      <mat-option value="BAJA_VEHICULAR">Baja Vehicular</mat-option>
                      <mat-option value="MODIFICACION_RUTA">Modificación de Ruta</mat-option>
                      <mat-option value="CAMBIO_REPRESENTANTE">Cambio de Representante</mat-option>
                      <mat-option value="SUSPENSION_TEMPORAL">Suspensión Temporal</mat-option>
                      <mat-option value="CANCELACION_PARCIAL">Cancelación Parcial</mat-option>
                      <mat-option value="OTROS">Otros Actos</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Fecha de Emisión</mat-label>
                    <input matInput type="date" formControlName="fecha_resolucion">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>N° Expediente Administrativo</mat-label>
                    <input matInput formControlName="expediente_numero" placeholder="Ej: EXP-2023-01290">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Link a Google Drive (URL PDF)</mat-label>
                    <input matInput formControlName="link_documento" placeholder="https://drive.google.com/...">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Vehículos Ingresantes (Placas separadas por coma)</mat-label>
                    <input matInput formControlName="vehiculos_ingresantes" placeholder="Ej: Z1A-123, Z2B-456">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Vehículos Salientes (Placas separadas por coma)</mat-label>
                    <input matInput formControlName="vehiculos_salientes" placeholder="Ej: Z9C-999">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Observaciones y Detalle del Acto</mat-label>
                    <textarea matInput formControlName="observaciones" rows="2" placeholder="Detalles de la modificación"></textarea>
                  </mat-form-field>
                </div>

                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelarEdicion()">Cancelar</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="hijaForm.invalid || isLoading()">
                    {{ isEditMode() ? 'Actualizar Resolución Hija' : 'Guardar Resolución Hija' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <!-- Tabla de Resultados -->
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando resoluciones hijas...</p>
          </div>
        } @else if (resolucionesFiltradas().length === 0) {
          <mat-card class="empty-state">
            <mat-card-content>
              <mat-icon class="empty-icon">alt_route</mat-icon>
              <h3>No se encontraron Resoluciones Hijas</h3>
              <p>Intenta ajustar los filtros de búsqueda o registra una nueva resolución modificatoria.</p>
              <button mat-raised-button color="primary" (click)="toggleFormModal()">
                <mat-icon>add</mat-icon> Registrar Primera Hija
              </button>
            </mat-card-content>
          </mat-card>
        } @else {
          <mat-card class="table-card">
            <mat-card-content>
              <div class="table-container">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th style="width: 44px; text-align: center;">
                        <mat-checkbox
                          [checked]="isAllSelected()"
                          [indeterminate]="isPartiallySelected()"
                          (change)="toggleSelectAll()">
                        </mat-checkbox>
                      </th>
                      @if (columnaVisible('nro_resolucion')) {
                        <th (click)="toggleSort('nro_resolucion')" class="sortable-th" matTooltip="Clic para ordenar por Número de Resolución y Año">
                          <div class="th-content">
                            <span>N° Res. Hija</span>
                            <mat-icon class="sort-icon" [class.active-sort]="sortField() === 'nro_resolucion'">
                              {{ sortField() === 'nro_resolucion' ? (sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}
                            </mat-icon>
                          </div>
                        </th>
                      }
                      @if (columnaVisible('tipo_acto')) { <th>Acto Modificatorio</th> }
                      @if (columnaVisible('nro_resolucion_primigenia')) { <th>N° Primigenia Matriz</th> }
                      @if (columnaVisible('ruc_empresa')) { <th>RUC Empresa</th> }
                      @if (columnaVisible('expediente_numero')) {
                        <th (click)="toggleSort('expediente_numero')" class="sortable-th" matTooltip="Clic para ordenar por Número de Expediente">
                          <div class="th-content">
                            <span>N° Expediente</span>
                            <mat-icon class="sort-icon" [class.active-sort]="sortField() === 'expediente_numero'">
                              {{ sortField() === 'expediente_numero' ? (sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}
                            </mat-icon>
                          </div>
                        </th>
                      }
                      @if (columnaVisible('flota_ingresante')) { <th>Flota Ingresante</th> }
                      @if (columnaVisible('flota_saliente')) { <th>Flota Saliente</th> }
                      @if (columnaVisible('observaciones')) { <th>Observaciones</th> }
                      @if (columnaVisible('link_documento')) { <th>Drive</th> }
                      @if (columnaVisible('acciones')) { <th>Acciones</th> }
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of paginatedResoluciones(); track item.id) {
                      <tr [class.selected-row]="isSelected(item.id)">
                        <td style="text-align: center;">
                          <mat-checkbox
                            [checked]="isSelected(item.id)"
                            (change)="toggleSelect(item.id)">
                          </mat-checkbox>
                        </td>
                        @if (columnaVisible('nro_resolucion')) {
                          <td>
                            <div class="res-hija-cell">
                              <div class="res-nro-main">
                                @if (isPlacaDisplay(item)) {
                                  <span class="placa-badge-inline" matTooltip="Trámite sin N° resolución (identificado por Placa)">
                                    <mat-icon style="font-size: 1rem; height: 1rem; width: 1rem; vertical-align: middle; margin-right: 2px;">directions_car</mat-icon>
                                    {{ getNroHijaDisplay(item) }}
                                  </span>
                                } @else {
                                  <span class="bold-text color-teal">{{ getNroHijaDisplay(item) }}</span>
                                }
                              </div>
                              <div class="res-fecha-sub">
                                @if (item.fecha_resolucion) {
                                  <mat-icon style="font-size: 0.76rem; height: 0.76rem; width: 0.76rem; vertical-align: middle; margin-right: 2px; color: #0d9488;">event</mat-icon>
                                  {{ item.fecha_resolucion | date:'dd/MM/yyyy' }}
                                } @else {
                                  <span class="sin-datos" style="font-size: 0.75rem;">Sin fecha</span>
                                }
                              </div>
                            </div>
                          </td>
                        }
                        @if (columnaVisible('tipo_acto')) {
                          <td>
                            <span [class]="'sub-badge ' + getTipoActoClassKey(item)">
                              {{ getTipoActoSubtext(item) }}
                            </span>
                          </td>
                        }
                        @if (columnaVisible('nro_resolucion_primigenia')) {
                          <td>
                            <span class="primigenia-pill">{{ formatPrimigeniaNro(item.nro_resolucion_primigenia) }}</span>
                          </td>
                        }
                        @if (columnaVisible('ruc_empresa')) {
                          <td>
                            <span class="ruc-badge">{{ item.ruc_empresa }}</span>
                          </td>
                        }
                        @if (columnaVisible('expediente_numero')) {
                          <td>
                            <div class="exp-cell">
                              <div class="exp-nro">{{ item.expediente_numero || '-' }}</div>
                              @if (item.fecha_expediente) {
                                <div class="exp-fecha-sub">
                                  <mat-icon style="font-size: 0.78rem; height: 0.78rem; width: 0.78rem; vertical-align: middle; margin-right: 2px; color: #64748b;">event</mat-icon>
                                  {{ item.fecha_expediente | date:'dd/MM/yyyy' }}
                                </div>
                              }
                            </div>
                          </td>
                        }
                        @if (columnaVisible('flota_ingresante')) {
                          <td>
                            @if (item.vehiculos_ingresantes && item.vehiculos_ingresantes.length > 0) {
                              <span class="badge-veh veh-in" [matTooltip]="item.vehiculos_ingresantes.join(', ')">
                                +{{ item.vehiculos_ingresantes.length }} Placa(s)
                              </span>
                            } @else {
                              <span class="sin-datos">-</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('flota_saliente')) {
                          <td>
                            @if (item.vehiculos_salientes && item.vehiculos_salientes.length > 0) {
                              <span class="badge-veh veh-out" [matTooltip]="item.vehiculos_salientes.join(', ')">
                                -{{ item.vehiculos_salientes.length }} Placa(s)
                              </span>
                            } @else {
                              <span class="sin-datos">-</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('observaciones')) {
                          <td>
                            <span class="obs-text" [matTooltip]="item.observaciones || ''">
                              {{ item.observaciones || '-' }}
                            </span>
                          </td>
                        }
                        @if (columnaVisible('link_documento')) {
                          <td class="text-center">
                            <span class="sin-datos">-</span>
                          </td>
                        }
                        @if (columnaVisible('acciones')) {
                          <td class="text-center">
                            <button mat-icon-button [matMenuTriggerFor]="actionMenu" class="btn-action-fixed" matTooltip="Opciones de acción">
                              <mat-icon>more_vert</mat-icon>
                            </button>
                            <mat-menu #actionMenu="matMenu" xPosition="before">
                              <button mat-menu-item (click)="verDetalle(item)">
                                <mat-icon color="primary">visibility</mat-icon>
                                <span>Ver Detalle</span>
                              </button>
                              <button mat-menu-item (click)="editarResolucion(item)">
                                <mat-icon style="color: #0284c7;">edit</mat-icon>
                                <span>Editar Resolución</span>
                              </button>
                              <mat-divider></mat-divider>
                              <button mat-menu-item (click)="eliminarResolucion(item.id)">
                                <mat-icon color="warn">delete</mat-icon>
                                <span>Eliminar</span>
                              </button>
                            </mat-menu>
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <mat-paginator
                [pageSizeOptions]="[10, 25, 50]"
                [pageSize]="pageSize()"
                [length]="resolucionesFiltradas().length"
                (page)="onPageChange($event)">
              </mat-paginator>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      font-family: 'Inter', Roboto, sans-serif;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%);
      color: white;
      padding: 1.75rem 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(13, 148, 136, 0.4);

      .title-with-icon {
        display: flex;
        align-items: center;
        gap: 1rem;

        .header-icon {
          font-size: 2.5rem;
          width: 2.5rem;
          height: 2.5rem;
          color: #99f6e4;
        }

        h1 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .subtitle {
          margin: 0.25rem 0 0 0;
          opacity: 0.85;
          font-size: 0.9rem;
        }
      }

      .header-actions {
        display: flex;
        gap: 0.75rem;
      }
    }

    .btn-primary-custom {
      background-color: #0d9488 !important;
      color: white !important;
    }

    .filters-card {
      margin-bottom: 1.5rem;
      border-radius: 12px;

      .filters-row {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;

        .search-field {
          flex: 1;
          min-width: 280px;
        }

        .filter-field {
          min-width: 220px;
        }

        .btn-clear {
          height: 54px;
        }
      }
    }

    .columns-menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      font-weight: 600;
      color: #334155;
      font-size: 0.95rem;

      button {
        font-size: 0.8rem;
        padding: 0 0.5rem;
      }
    }

    .col-item {
      height: 40px;
      line-height: 40px;
    }

    .form-card {
      margin-bottom: 1.5rem;
      border-left: 4px solid #0d9488;

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
        margin-top: 1rem;

        .full-width {
          grid-column: 1 / -1;
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      gap: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;

      .empty-icon {
        font-size: 3.5rem;
        width: 3.5rem;
        height: 3.5rem;
        color: #9ca3af;
      }
    }

    .table-card {
      border-radius: 12px;
      overflow: hidden;

      .table-container {
        overflow-x: auto;
      }
    }

    .custom-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;

      th {
        background-color: #f0fdf4;
        color: #166534;
        font-weight: 600;
        padding: 0.85rem 1rem;
        border-bottom: 2px solid #bbf7d0;
        white-space: nowrap;

        &.sortable-th {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s;

          &:hover {
            background-color: #dcfce7;
          }
        }
      }

      .th-content {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .sort-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
        color: #94a3b8;
        transition: color 0.2s, transform 0.2s;

        &.active-sort {
          color: #0d9488;
          font-weight: bold;
        }
      }

      td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      tr:hover {
        background-color: #f8fafc;
      }
    }

    .stats-section {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);

      .stats-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;

        .stats-icon {
          color: #0d9488;
        }

        h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: #1e293b;
        }

        .stats-badge-total {
          margin-left: auto;
          background-color: #0f766e;
          color: white;
          padding: 0.2rem 0.65rem;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 600;
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 0.75rem;

        .stat-card {
          padding: 0.85rem;
          border-radius: 10px;
          text-align: center;
          border: 1px solid #e2e8f0;
          transition: transform 0.2s, box-shadow 0.2s;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          }

          .stat-value {
            font-size: 1.4rem;
            font-weight: 800;
            line-height: 1.2;
          }

          .stat-label {
            font-size: 0.75rem;
            font-weight: 600;
            margin-top: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          &.stat-inc { background: #f0fdf4; border-color: #bbf7d0; .stat-value { color: #15803d; } .stat-label { color: #166534; } }
          &.stat-sus { background: #f0f9ff; border-color: #bae6fd; .stat-value { color: #0369a1; } .stat-label { color: #075985; } }
          &.stat-mod { background: #faf5ff; border-color: #e9d5ff; .stat-value { color: #7e22ce; } .stat-label { color: #6b21a8; } }
          &.stat-baj { background: #fff1f2; border-color: #fecdd3; .stat-value { color: #be123c; } .stat-label { color: #9f1239; } }
          &.stat-dup { background: #fffbeb; border-color: #fde68a; .stat-value { color: #b45309; } .stat-label { color: #92400e; } }
          &.stat-ren { background: #f0fdfa; border-color: #99f6e4; .stat-value { color: #0f766e; } .stat-label { color: #115e59; } }
          &.stat-otr { background: #f8fafc; border-color: #e2e8f0; .stat-value { color: #475569; } .stat-label { color: #334155; } }
        }
      }
    }

    .bold-text {
      font-weight: 600;
    }

    .color-teal {
      color: #0f766e;
    }

    .primigenia-pill {
      background-color: #e0f2fe;
      color: #0369a1;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-weight: 600;
    }

    .ruc-badge {
      background-color: #f1f5f9;
      color: #334155;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-family: monospace;
    }

    .acto-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      background-color: #e2e8f0;
      color: #334155;

      &.acto-incremento_flota { background-color: #dcfce7; color: #15803d; }
      &.acto-sustitucion_vehicular { background-color: #e0f2fe; color: #0369a1; }
      &.acto-renovacion { background-color: #fef08a; color: #854d0e; }
      &.acto-baja_vehicular { background-color: #fee2e2; color: #b91c1c; }
      &.acto-modificacion_ruta { background-color: #f3e8ff; color: #7e22ce; }
    }

    .badge-veh {
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;

      &.veh-in { background-color: #dcfce7; color: #166534; }
      &.veh-out { background-color: #fee2e2; color: #991b1b; }
    }

    .drive-link {
      color: #0d9488;
      &:hover { color: #0f766e; }
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }

    .res-hija-cell {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      white-space: nowrap;
      min-width: 140px;

      .res-nro-main {
        font-size: 0.95rem;
        line-height: 1.2;
        white-space: nowrap;
        word-break: keep-all;
      }

      .res-fecha-sub {
        font-size: 0.75rem;
        color: #475569;
        display: flex;
        align-items: center;
        margin-top: 0.05rem;
      }
    }

    .exp-cell {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;

      .exp-nro {
        font-weight: 500;
      }

      .exp-fecha-sub {
        font-size: 0.74rem;
        color: #64748b;
        display: flex;
        align-items: center;
      }
    }

    .sub-badge {
      display: inline-block;
      padding: 0.12rem 0.45rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      white-space: nowrap;

      &.tipo-incremento {
        background-color: #dcfce7;
        color: #15803d;
        border: 1px solid #bbf7d0;
      }
      &.tipo-sustitucion {
        background-color: #e0f2fe;
        color: #0369a1;
        border: 1px solid #bae6fd;
      }
      &.tipo-modificacion {
        background-color: #f3e8ff;
        color: #7e22ce;
        border: 1px solid #e9d5ff;
      }
      &.tipo-baja {
        background-color: #ffe4e6;
        color: #be123c;
        border: 1px solid #fecdd3;
      }
      &.tipo-duplicado {
        background-color: #fef3c7;
        color: #b45309;
        border: 1px solid #fde68a;
      }
      &.tipo-erratas {
        background-color: #e0e7ff;
        color: #4338ca;
        border: 1px solid #c7d2fe;
      }
      &.tipo-renovacion {
        background-color: #ccfbf1;
        color: #0f766e;
        border: 1px solid #99f6e4;
      }
      &.tipo-representante {
        background-color: #fae8ff;
        color: #a21caf;
        border: 1px solid #f5d0fe;
      }
      &.tipo-otros {
        background-color: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
      }
    }

    .placa-badge-inline {
      display: inline-flex;
      align-items: center;
      background-color: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      font-weight: 700;
      font-family: monospace;
    }

    .btn-action-fixed {
      background-color: #f1f5f9;
      color: #0f766e;
      border-radius: 8px;
      &:hover {
        background-color: #ccfbf1;
        color: #0f766e;
      }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .detail-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 0.95rem;
          color: #1e293b;
        }
      }
    }

    .sin-datos { color: #cbd5e1; }
    .text-center { text-align: center; }

    .selected-row {
      background-color: #ede9fe !important;
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ========================================================================= */
    /* MODO OSCURO (SIRRETT OFICIAL DRTC PUNO)                                  */
    /* ========================================================================= */
    :host-context([data-theme="dark"]),
    :host-context(.dark-theme) {
      .page-container {
        color: #f8fafc;
      }
      .page-header {
        background: linear-gradient(135deg, #0b1329 0%, #134e4a 50%, #0f766e 100%);
        border: 1px solid #1e293b;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      }
      .filters-card, .table-card, .stats-section, .form-card {
        background: #111622 !important;
        border: 1px solid #1e2433 !important;
        color: #f8fafc;
      }
      .stats-header h3 {
        color: #f8fafc !important;
      }
      .custom-table th {
        background-color: #131722 !important;
        color: #94a3b8 !important;
        border-bottom: 2px solid #1e2433 !important;
      }
      .custom-table td {
        color: #cbd5e1 !important;
        border-bottom: 1px solid #171b26 !important;
      }
      .custom-table tr:hover {
        background-color: #171b26 !important;
      }
      .stat-card {
        background: #171b26 !important;
        border: 1px solid #283046 !important;
        .stat-value { color: #f8fafc !important; }
        .stat-label { color: #94a3b8 !important; }
      }
      .res-hija-cell .res-nro-main { color: #f8fafc; }
      .res-fecha-sub, .exp-fecha-sub, .obs-text { color: #94a3b8 !important; }
      .detail-grid {
        background: #171b26 !important;
        border-color: #283046 !important;
      }
      .detail-value { color: #f8fafc !important; }
      .detail-label { color: #94a3b8 !important; }
      .selected-row { background-color: rgba(139, 92, 246, 0.25) !important; }
      .btn-action-fixed {
        background-color: #171b26 !important;
        color: #2dd4bf !important;
        &:hover { background-color: #1e2433 !important; }
      }
      .ruc-badge {
        background-color: #1e2433 !important;
        color: #94a3b8 !important;
      }
      .columns-menu-header {
        color: #cbd5e1;
      }
    }
  `]
})
export class ResolucionesHijasComponent implements OnInit {
  private service = inject(ResolucionHijaService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  // Signals
  isLoading = signal(false);
  resoluciones = signal<ResolucionHija[]>([]);
  pageSize = signal(10);
  currentPage = signal(0);
  showFormModal = signal(false);
  showCargaMasivaModal = signal(false);

  // CRUD Signals
  isEditMode = signal(false);
  editingId = signal<string | null>(null);
  showDetailModal = signal(false);
  selectedHija = signal<ResolucionHija | null>(null);

  private googleSheetsService = inject(GoogleSheetsService);
  googleSheetsUrl = this.fb.control('');

  // Form Controls para Filtros
  searchControl = this.fb.control('');
  tipoActoControl = this.fb.control('');

  // Signals derivados para reactividad en computed()
  searchFilter = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  tipoActoFilter = toSignal(this.tipoActoControl.valueChanges, { initialValue: '' });

  // Form Group para Creación
  hijaForm: FormGroup = this.fb.group({
    nro_resolucion: ['', Validators.required],
    nro_resolucion_primigenia: ['', Validators.required],
    ruc_empresa: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    tipo_acto: ['INCREMENTO_FLOTA', Validators.required],
    fecha_resolucion: [new Date().toISOString().substring(0, 10), Validators.required],
    expediente_numero: [''],
    link_documento: [''],
    vehiculos_ingresantes: [''],
    vehiculos_salientes: [''],
    observaciones: ['']
  });

  // Signals para Ordenamiento
  sortField = signal<'nro_resolucion' | 'expediente_numero' | null>('nro_resolucion');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Auxiliar para extraer número secuencial y año para ordenamiento numérico preciso
  private parseResNumberAndYear(str: string | undefined): { num: number; year: number } {
    if (!str) return { num: 0, year: 0 };
    // Coincidir patrones como R-0123-2026, 0123-2026, EXP-2026-00123, 123-26, etc.
    const matches = str.match(/(\d+)/g);
    if (!matches || matches.length === 0) return { num: 0, year: 0 };

    if (matches.length === 1) {
      const val = parseInt(matches[0], 10);
      return val > 1900 && val < 2100 ? { num: 0, year: val } : { num: val, year: 0 };
    }

    // Si hay múltiples grupos de números, usualmente uno es el correlativo y otro el año (ej. 0123 y 2026)
    let num = 0;
    let year = 0;

    for (const m of matches) {
      const val = parseInt(m, 10);
      if (val >= 1990 && val <= 2100) {
        year = val;
      } else if (val < 100 && m.length === 2 && year === 0) {
        year = 2000 + val;
      } else if (num === 0) {
        num = val;
      }
    }

    return { num, year };
  }

  toggleSort(field: 'nro_resolucion' | 'expediente_numero'): void {
    if (this.sortField() === field) {
      // Alternar orden asc <-> desc
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('desc');
    }
  }

  // Computed Signal de Datos Filtrados y Ordenados
  resolucionesFiltradas = computed(() => {
    const search = (this.searchFilter() || '').toLowerCase().trim();
    const tipo = this.tipoActoFilter() || '';
    const field = this.sortField();
    const order = this.sortOrder();

    const filtradas = this.resoluciones().filter(r => {
      const nro = (r.nro_resolucion || '').toLowerCase();
      const nroPrim = (r.nro_resolucion_primigenia || '').toLowerCase();
      const ruc = (r.ruc_empresa || '').toLowerCase();

      const matchSearch = !search ||
        nro.includes(search) ||
        nroPrim.includes(search) ||
        ruc.includes(search);

      const matchTipo = !tipo || r.tipo_acto === tipo;
      return matchSearch && matchTipo;
    });

    if (!field) return filtradas;

    return [...filtradas].sort((a, b) => {
      let valAStr = '';
      let valBStr = '';

      if (field === 'nro_resolucion') {
        valAStr = this.getNroHijaDisplay(a);
        valBStr = this.getNroHijaDisplay(b);
      } else if (field === 'expediente_numero') {
        valAStr = a.expediente_numero || '';
        valBStr = b.expediente_numero || '';
      }

      const parsedA = this.parseResNumberAndYear(valAStr);
      const parsedB = this.parseResNumberAndYear(valBStr);

      let comparison = 0;

      // Primero comparar por año
      if (parsedA.year !== parsedB.year) {
        comparison = parsedA.year - parsedB.year;
      } else if (parsedA.num !== parsedB.num) {
        // Segundo comparar por número correlativo
        comparison = parsedA.num - parsedB.num;
      } else {
        // Fallback a comparación de cadenas
        comparison = valAStr.localeCompare(valBStr, undefined, { numeric: true });
      }

      return order === 'asc' ? comparison : -comparison;
    });
  });

  // Computed Signal para Paginación de la Tabla
  paginatedResoluciones = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.resolucionesFiltradas().slice(start, start + this.pageSize());
  });

  selectedIdsState = signal<string[]>([]);

  formatPrimigeniaNro(nro: string | undefined): string {
    if (!nro || !nro.trim()) return '-';
    const clean = nro.trim();
    if (clean.toUpperCase().startsWith('R-')) return clean;
    return `R-${clean}`;
  }

  // Configuración de Columnas Disponibles
  columnasDisponibles = [
    { key: 'nro_resolucion', label: 'N° Res. Hija', required: true },
    { key: 'tipo_acto', label: 'Acto Modificatorio', required: false },
    { key: 'nro_resolucion_primigenia', label: 'N° Primigenia Matriz', required: false },
    { key: 'ruc_empresa', label: 'RUC Empresa', required: false },
    { key: 'expediente_numero', label: 'N° Expediente', required: false },
    { key: 'flota_ingresante', label: 'Flota Ingresante', required: false },
    { key: 'flota_saliente', label: 'Flota Saliente', required: false },
    { key: 'observaciones', label: 'Observaciones', required: false },
    { key: 'link_documento', label: 'Drive', required: false },
    { key: 'acciones', label: 'Acciones', required: true }
  ];

  columnasVisiblesState = signal<string[]>([
    'nro_resolucion',
    'tipo_acto',
    'nro_resolucion_primigenia',
    'ruc_empresa',
    'expediente_numero',
    'flota_ingresante',
    'flota_saliente',
    'observaciones',
    'link_documento',
    'acciones'
  ]);

  columnaVisible(key: string): boolean {
    return this.columnasVisiblesState().includes(key);
  }

  toggleColumna(key: string): void {
    const col = this.columnasDisponibles.find(c => c.key === key);
    if (!col || col.required) return;

    const actuales = this.columnasVisiblesState();
    let nuevas: string[];
    if (actuales.includes(key)) {
      nuevas = actuales.filter(k => k !== key);
    } else {
      nuevas = this.columnasDisponibles
        .map(c => c.key)
        .filter(k => actuales.includes(k) || k === key);
    }
    this.columnasVisiblesState.set(nuevas);
    this.guardarPreferenciasColumnas();
  }

  restablecerColumnas(): void {
    const todas = this.columnasDisponibles.map(c => c.key);
    this.columnasVisiblesState.set(todas);
    this.guardarPreferenciasColumnas();
  }

  private guardarPreferenciasColumnas(): void {
    try {
      localStorage.setItem('resoluciones-hijas-cols', JSON.stringify(this.columnasVisiblesState()));
    } catch (e) {}
  }

  private cargarPreferenciasColumnas(): void {
    try {
      const saved = localStorage.getItem('resoluciones-hijas-cols');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const requeridas = this.columnasDisponibles.filter(c => c.required).map(c => c.key);
          const validas = parsed.filter((k: string) => this.columnasDisponibles.some(c => c.key === k));
          const unificadas = [...new Set([...requeridas, ...validas])];
          this.columnasVisiblesState.set(unificadas);
        }
      }
    } catch (e) {}
  }

  ngOnInit(): void {
    this.cargarPreferenciasColumnas();
    this.cargarResoluciones();

    // Reiniciar paginación al cambiar filtros
    this.searchControl.valueChanges.subscribe(() => this.currentPage.set(0));
    this.tipoActoControl.valueChanges.subscribe(() => this.currentPage.set(0));

    // Escuchar queryParams para pre-llenar si viene desde "Registrar Resolución Hija"
    this.route.queryParams.subscribe(params => {
      if (params['primigenia'] || params['ruc']) {
        this.hijaForm.patchValue({
          nro_resolucion_primigenia: params['primigenia'] || '',
          ruc_empresa: params['ruc'] || ''
        });
        this.showFormModal.set(true);
      }
    });
  }

  cargarResoluciones(): void {
    this.isLoading.set(true);
    this.service.getResolucionesHijas().subscribe({
      next: (data) => {
        this.resoluciones.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando resoluciones hijas:', err);
        this.snackBar.open('Error al cargar resoluciones hijas', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.tipoActoControl.setValue('');
    this.sortField.set('nro_resolucion');
    this.sortOrder.set('desc');
    this.currentPage.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  verDetalle(item: ResolucionHija): void {
    this.selectedHija.set(item);
    this.showDetailModal.set(true);
  }

  cerrarDetalleModal(): void {
    this.showDetailModal.set(false);
    this.selectedHija.set(null);
  }

  editarResolucion(item: ResolucionHija): void {
    this.isEditMode.set(true);
    this.editingId.set(item.id);

    let fechaStr = new Date().toISOString().substring(0, 10);
    if (item.fecha_resolucion) {
      fechaStr = typeof item.fecha_resolucion === 'string'
        ? item.fecha_resolucion.substring(0, 10)
        : new Date(item.fecha_resolucion).toISOString().substring(0, 10);
    }

    this.hijaForm.patchValue({
      nro_resolucion: item.nro_resolucion || '',
      nro_resolucion_primigenia: item.nro_resolucion_primigenia || '',
      ruc_empresa: item.ruc_empresa || '',
      tipo_acto: item.tipo_acto || 'INCREMENTO_FLOTA',
      fecha_resolucion: fechaStr,
      expediente_numero: item.expediente_numero || '',
      link_documento: item.link_documento || '',
      vehiculos_ingresantes: (item.vehiculos_ingresantes || []).join(', '),
      vehiculos_salientes: (item.vehiculos_salientes || []).join(', '),
      observaciones: item.observaciones || ''
    });

    this.showDetailModal.set(false);
    this.showCargaMasivaModal.set(false);
    this.showFormModal.set(true);
  }

  cancelarEdicion(): void {
    this.isEditMode.set(false);
    this.editingId.set(null);
    this.hijaForm.reset({
      tipo_acto: 'INCREMENTO_FLOTA',
      fecha_resolucion: new Date().toISOString().substring(0, 10)
    });
    this.showFormModal.set(false);
  }

  toggleFormModal(): void {
    if (this.showFormModal()) {
      this.cancelarEdicion();
    } else {
      this.isEditMode.set(false);
      this.editingId.set(null);
      this.hijaForm.reset({
        tipo_acto: 'INCREMENTO_FLOTA',
        fecha_resolucion: new Date().toISOString().substring(0, 10)
      });
      this.showFormModal.set(true);
    }
  }

  guardarResolucionHija(): void {
    if (this.hijaForm.invalid) return;

    this.isLoading.set(true);
    const formVal = this.hijaForm.value;

    const parseList = (str: string) => str ? str.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

    const dto = {
      nro_resolucion: formVal.nro_resolucion,
      nro_resolucion_primigenia: formVal.nro_resolucion_primigenia,
      ruc_empresa: formVal.ruc_empresa,
      tipo_acto: formVal.tipo_acto,
      fecha_resolucion: formVal.fecha_resolucion,
      fecha_inicio_efectos: formVal.fecha_resolucion,
      expediente_numero: formVal.expediente_numero || undefined,
      link_documento: formVal.link_documento || undefined,
      vehiculos_ingresantes: parseList(formVal.vehiculos_ingresantes),
      vehiculos_salientes: parseList(formVal.vehiculos_salientes),
      observaciones: formVal.observaciones || undefined
    };

    if (this.isEditMode() && this.editingId()) {
      this.service.updateResolucionHija(this.editingId()!, dto).subscribe({
        next: () => {
          this.snackBar.open('Resolución Hija actualizada con éxito', 'Cerrar', { duration: 3000 });
          this.cancelarEdicion();
          this.cargarResoluciones();
        },
        error: (err) => {
          console.error('Error al actualizar resolución hija:', err);
          const msg = err.error?.detail || 'Error al actualizar la resolución hija';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
          this.isLoading.set(false);
        }
      });
    } else {
      this.service.createResolucionHija(dto as ResolucionHijaCreate).subscribe({
        next: () => {
          this.snackBar.open('Resolución Hija registrada con éxito', 'Cerrar', { duration: 3000 });
          this.cancelarEdicion();
          this.cargarResoluciones();
        },
        error: (err) => {
          console.error('Error al guardar resolución hija:', err);
          const msg = err.error?.detail || 'Error al guardar la resolución hija';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
          this.isLoading.set(false);
        }
      });
    }
  }

  eliminarResolucion(id: string): void {
    if (confirm('¿Desea desactivar esta resolución hija?')) {
      this.service.deleteResolucionHija(id).subscribe({
        next: () => {
          this.snackBar.open('Resolución hija eliminada', 'Cerrar', { duration: 3000 });
          this.cargarResoluciones();
        },
        error: (err) => {
          console.error('Error al eliminar resolución hija:', err);
          this.snackBar.open('Error al eliminar resolución hija', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  descargarPlantilla(): void {
    this.service.descargarPlantillaExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_resoluciones_hijas.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Plantilla descargada correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error descargando plantilla:', err);
        this.snackBar.open('Error descargando plantilla Excel', 'Cerrar', { duration: 3000 });
      }
    });
  }

  abrirCargaMasiva(): void {
    this.showFormModal.set(false);
    this.showCargaMasivaModal.set(true);
  }

  cerrarCargaMasivaModal(): void {
    this.showCargaMasivaModal.set(false);
  }

  procesarArchivoLocal(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.isLoading.set(true);
      this.service.procesarCargaMasiva(file).subscribe({
        next: (res) => {
          const creadas = res.resultado?.creadas || 0;
          const errores = res.resultado?.errores || [];
          let msg = `Carga masiva completada: ${creadas} resoluciones hijas creadas.`;
          if (errores.length > 0) {
            msg += ` (${errores.length} advertencias/errores)`;
          }
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
          this.showCargaMasivaModal.set(false);
          this.cargarResoluciones();
        },
        error: (err) => {
          console.error('Error en carga masiva:', err);
          const detail = err.error?.detail || 'Error al procesar el archivo';
          this.snackBar.open(`Error en carga masiva: ${detail}`, 'Cerrar', { duration: 5000 });
          this.isLoading.set(false);
        }
      });
    }
  }

  procesarGoogleSheets(): void {
    const url = this.googleSheetsUrl.value?.trim();
    if (!url) {
      this.snackBar.open('Ingresa una URL de Google Sheets válida', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.googleSheetsService.validarUrl(url)) {
      this.snackBar.open('La URL de Google Sheets no tiene un formato válido', 'Cerrar', { duration: 4000 });
      return;
    }

    const id = this.googleSheetsService.extraerIdDeUrl(url) || url;
    this.isLoading.set(true);

    this.googleSheetsService.obtenerDatosReales(id).subscribe({
      next: (sheetInfo) => {
        if (!sheetInfo || sheetInfo.datos.length === 0) {
          this.snackBar.open('La hoja de Google Sheets no contiene registros', 'Cerrar', { duration: 4000 });
          this.isLoading.set(false);
          return;
        }

        // Reconstruir CSV
        const csvRows: string[] = [];
        csvRows.push(sheetInfo.encabezados.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
        for (const fila of sheetInfo.datos) {
          csvRows.push(fila.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','));
        }
        const csvContent = csvRows.join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const file = new File([blob], `google_sheet_hijas_${Date.now()}.csv`, { type: 'text/csv' });

        this.service.procesarCargaMasiva(file).subscribe({
          next: (res) => {
            const creadas = res.resultado?.creadas || 0;
            const errores = res.resultado?.errores || [];
            let msg = `✅ Importación desde Google Sheets exitosa: ${creadas} resoluciones hijas creadas.`;
            if (errores.length > 0) {
              msg += ` (${errores.length} advertencias/errores)`;
            }
            this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
            this.googleSheetsUrl.setValue('');
            this.showCargaMasivaModal.set(false);
            this.cargarResoluciones();
          },
          error: (err) => {
            console.error('Error procesando CSV de Google Sheets:', err);
            const detail = err.error?.detail || 'Error al guardar los registros en el servidor';
            this.snackBar.open(`Error procesando datos: ${detail}`, 'Cerrar', { duration: 5000 });
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Error conectando a Google Sheets:', err);
        this.snackBar.open(err.message || 'No se pudo acceder a Google Sheets. Verifica que el enlace sea público.', 'Cerrar', { duration: 5000 });
        this.isLoading.set(false);
      }
    });
  }

  // === SELECCIÓN MÚLTIPLE ===
  isSelected(id: string): boolean {
    return this.selectedIdsState().includes(id);
  }

  toggleSelect(id: string): void {
    const current = this.selectedIdsState();
    if (current.includes(id)) {
      this.selectedIdsState.set(current.filter(i => i !== id));
    } else {
      this.selectedIdsState.set([...current, id]);
    }
  }

  toggleSelectAll(): void {
    const paginated = this.paginatedResoluciones();
    const allIds = paginated.map(r => r.id);
    const allSelected = allIds.every(id => this.selectedIdsState().includes(id));
    if (allSelected) {
      // Deselect all on current page
      this.selectedIdsState.set(this.selectedIdsState().filter(id => !allIds.includes(id)));
    } else {
      // Select all on current page
      const merged = [...new Set([...this.selectedIdsState(), ...allIds])];
      this.selectedIdsState.set(merged);
    }
  }

  isAllSelected(): boolean {
    const paginated = this.paginatedResoluciones();
    if (paginated.length === 0) return false;
    return paginated.every(r => this.selectedIdsState().includes(r.id));
  }

  isPartiallySelected(): boolean {
    const paginated = this.paginatedResoluciones();
    if (paginated.length === 0) return false;
    const some = paginated.some(r => this.selectedIdsState().includes(r.id));
    return some && !this.isAllSelected();
  }

  eliminarSeleccionados(): void {
    const ids = this.selectedIdsState();
    if (ids.length === 0) return;
    if (!confirm(`¿Desea desactivar ${ids.length} resolución(es) hija(s) seleccionada(s)?`)) return;

    this.isLoading.set(true);
    this.service.bulkDeleteResolucionesHijas(ids).subscribe({
      next: (res) => {
        this.snackBar.open(`${res.eliminados} resolución(es) hija(s) eliminada(s)`, 'Cerrar', { duration: 4000 });
        this.selectedIdsState.set([]);
        this.cargarResoluciones();
      },
      error: (err) => {
        console.error('Error en eliminación masiva:', err);
        this.snackBar.open('Error al eliminar resoluciones seleccionadas', 'Cerrar', { duration: 4000 });
        this.isLoading.set(false);
      }
    });
  }

  getNroHijaDisplay(item: ResolucionHija): string {
    const nro = item.nro_resolucion || '';
    if (nro && nro !== '(Sin N° Hija)' && !nro.startsWith('SIN_HIJA')) {
      let clean = nro.trim();
      clean = clean.replace(/\([A-Z0-9]+\)$/, '').trim();
      clean = clean.replace(/-(S|I|FE|M|C|O)$/, '').trim();
      if (!clean.startsWith('R-') && !clean.startsWith('PLACA:')) {
        clean = `R-${clean}`;
      }
      return clean;
    }

    // Fallback: Placa del vehículo si es Duplicado, Canje o sin número
    if (item.vehiculos_ingresantes && item.vehiculos_ingresantes.length > 0) {
      return item.vehiculos_ingresantes[0];
    }
    if (item.vehiculos_salientes && item.vehiculos_salientes.length > 0) {
      return item.vehiculos_salientes[0];
    }
    return item.id_origen ? `ID: ${item.id_origen}` : 'SIN RESOLUCIÓN';
  }

  isPlacaDisplay(item: ResolucionHija): boolean {
    const nro = item.nro_resolucion || '';
    return (!nro || nro === '(Sin N° Hija)' || nro.startsWith('SIN_HIJA')) &&
      ((item.vehiculos_ingresantes && item.vehiculos_ingresantes.length > 0) ||
       (item.vehiculos_salientes && item.vehiculos_salientes.length > 0));
  }

  getTipoActoSubtext(item: ResolucionHija): string {
    if (item.tipo_tramite_origen) {
      const t = item.tipo_tramite_origen.toUpperCase();
      if (t.includes('DUPLICADO')) return 'DUPLICADO';
      if (t.includes('CANJE')) return 'CANJE';
      if (t.includes('SUSTITUCION')) return 'SUSTITUCION';
      if (t.includes('INCREMENTO')) return 'INCREMENTO';
      if (t.includes('BAJA') || t.includes('CANCELACION')) return 'BAJA';
      if (t.includes('MODIFICACION') || t.includes('MODIF')) return 'MODIFICACION';
      if (t.includes('FE DE ERRATAS') || t.includes('ERRATAS')) return 'FE DE ERRATAS';
    }
    const display = this.getTipoActoDisplay(item.tipo_acto).toUpperCase();
    if (display === 'INCREMENTO FLOTA') return 'INCREMENTO';
    if (display === 'SUSTITUCIÓN VEHICULAR' || display === 'SUSTITUCION VEHICULAR') return 'SUSTITUCION';
    if (display === 'BAJA VEHICULAR') return 'BAJA';
    return display;
  }

  getTipoActoClassKey(item: ResolucionHija): string {
    const sub = this.getTipoActoSubtext(item).toUpperCase();
    if (sub.includes('INCREMENTO')) return 'tipo-incremento';
    if (sub.includes('SUSTITUCION')) return 'tipo-sustitucion';
    if (sub.includes('MODIFICACION')) return 'tipo-modificacion';
    if (sub.includes('BAJA') || sub.includes('CANCELACION')) return 'tipo-baja';
    if (sub.includes('DUPLICADO') || sub.includes('CANJE')) return 'tipo-duplicado';
    if (sub.includes('ERRATAS')) return 'tipo-erratas';
    if (sub.includes('RENOVACION')) return 'tipo-renovacion';
    if (sub.includes('REPRESENTANTE')) return 'tipo-representante';
    return 'tipo-otros';
  }

  getTipoActoDisplay(tipo: string): string {
    const map: { [key: string]: string } = {
      'RENOVACION': 'Renovación',
      'INCREMENTO_FLOTA': 'Incremento Flota',
      'SUSTITUCION_VEHICULAR': 'Sustitución Vehicular',
      'BAJA_VEHICULAR': 'Baja Vehicular',
      'MODIFICACION_RUTA': 'Modificación',
      'CAMBIO_REPRESENTANTE': 'Cambio Representante',
      'SUSPENSION_TEMPORAL': 'Suspensión Temporal',
      'CANCELACION_PARCIAL': 'Cancelación Parcial',
      'FE_DE_ERRATAS': 'Fe de Erratas',
      'OTROS': 'Otros'
    };
    return map[tipo] || tipo;
  }
}
