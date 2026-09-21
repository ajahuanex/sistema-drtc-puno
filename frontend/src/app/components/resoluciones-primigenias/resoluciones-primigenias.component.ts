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
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router } from '@angular/router';

import { ResolucionPrimigeniaService } from '../../services/resolucion-primigenia.service';
import { EmpresaService } from '../../services/empresa.service';
import { GoogleSheetsService } from '../../services/google-sheets.service';
import {
  ResolucionPrimigenia,
  EstadoResolucionPrimigenia,
  ResolucionPrimigeniaCreate,
  ResolucionPrimigeniaUpdate,
  FeErrata
} from '../../models/resolucion-primigenia.model';

@Component({
  selector: 'app-resoluciones-primigenias',
  standalone: true,
  imports: [
    CommonModule,
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
    MatMenuModule,
    MatDividerModule,
    MatTabsModule,
    MatCheckboxModule
  ],
  template: `
    <div class="page-container">
      <!-- Header Banner -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-with-icon">
            <mat-icon class="header-icon">auto_awesome</mat-icon>
            <div>
              <h1>Resoluciones Primigenias</h1>
              <p class="subtitle">Gestión de títulos habilitantes originarios y sus actos posteriores</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button mat-button class="header-action-btn" [matMenuTriggerFor]="exportExcelMenu" [disabled]="isLoading()" matTooltip="Exportar Excel a varios formatos">
            <mat-icon class="btn-icon">file_download</mat-icon>
            <span class="btn-text">Exportar Excel</span>
            <mat-icon class="dropdown-arrow">arrow_drop_down</mat-icon>
          </button>
          <mat-menu #exportExcelMenu="matMenu">
            <button mat-menu-item (click)="exportarAExcel('seleccionadas')" [disabled]="selectedCount() === 0">
              <mat-icon color="primary">check_box</mat-icon>
              <span>Exportar Seleccionadas ({{ selectedCount() }})</span>
            </button>
            <button mat-menu-item (click)="exportarAExcel('filtradas')">
              <mat-icon color="accent">filter_alt</mat-icon>
              <span>Exportar Vista Filtrada ({{ resolucionesFiltradas().length }})</span>
            </button>
            <button mat-menu-item (click)="exportarAExcel('todas')">
              <mat-icon style="color: #10b981;">table_chart</mat-icon>
              <span>Exportar Todas ({{ resoluciones().length }})</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="descargarPlantilla()">
              <mat-icon>description</mat-icon>
              <span>Descargar Plantilla Vaciado</span>
            </button>
          </mat-menu>

          <button mat-button class="header-action-btn" (click)="irACargaMasiva()" [disabled]="isLoading()" matTooltip="Cargar múltiples resoluciones desde Excel">
            <mat-icon class="btn-icon">file_upload</mat-icon>
            <span class="btn-text">Carga Masiva</span>
          </button>

          <button mat-button class="header-action-btn btn-primary-custom" (click)="toggleFormModal()" [disabled]="isLoading()" matTooltip="Registrar nueva resolución primigenia">
            <mat-icon class="btn-icon">add_circle</mat-icon>
            <span class="btn-text">Nueva Primigenia</span>
          </button>
        </div>
      </div>

      <!-- KPI Bento Cards (Stitch GovTech Sentinel) -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-icon-box card-total">
            <mat-icon>gavel</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-number">{{ totalResoluciones() | number }}</span>
            <span class="kpi-label">Total Resoluciones</span>
            <span class="kpi-detail">Padrón histórico oficial</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box card-vigentes">
            <mat-icon>verified</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-number">{{ totalVigentes() | number }}</span>
            <span class="kpi-label">Títulos Vigentes</span>
            <span class="kpi-detail">Concesiones activas (10 años)</span>
          </div>
        </div>

        <div class="kpi-card kpi-clickable" (click)="toggleFiltroPorVencer()" [class.kpi-active-filter]="filtroPorVencer30()" matTooltip="Filtrar resoluciones por vencer en 30 días">
          <div class="kpi-icon-box card-por-vencer">
            <mat-icon>timer</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-number">{{ totalPorVencer() | number }}</span>
            <span class="kpi-label">Por Vencer (&lt; 30d)</span>
            <span class="kpi-detail">Requerimiento de prórroga</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box card-criticas">
            <mat-icon>report_problem</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-number">{{ totalCriticas() | number }}</span>
            <span class="kpi-label">Vencidas / Revocadas</span>
            <span class="kpi-detail">Bajas y suspensiones</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box card-empresas">
            <mat-icon>business</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-number">{{ totalEmpresasTitulares() | number }}</span>
            <span class="kpi-label">Empresas Titulares</span>
            <span class="kpi-detail">Operadores acreditados</span>
          </div>
        </div>
      </div>

      <div class="content-section">
        <!-- Tarjeta de Filtros Modernizada -->
        <div class="glass-filters">
          <div class="filters-bar">
            <!-- Búsqueda rápida y botón de filtros móvil -->
            <div class="search-and-toggle">
              <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
                <mat-icon matPrefix class="search-icon">search</mat-icon>
                <input matInput [formControl]="searchControl" placeholder="Buscar por RUC, Razón Social o N° Resolución...">
                @if (searchControl.value) {
                  <button mat-icon-button matSuffix (click)="searchControl.setValue('')" class="clear-input-btn" matTooltip="Limpiar búsqueda">
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </mat-form-field>
              
              <button mat-icon-button class="mobile-filter-toggle" (click)="showMobileFilters.set(!showMobileFilters())" [class.active]="showMobileFilters()">
                <mat-icon>filter_list</mat-icon>
              </button>
            </div>

            <div class="collapsible-filters" [class.show]="showMobileFilters()">
              <!-- Select Estado Legal -->
            <mat-form-field appearance="outline" class="filter-select" subscriptSizing="dynamic">
              <mat-label>Estado Legal</mat-label>
              <mat-select [formControl]="estadoControl">
                <mat-option value="">Todos los Estados</mat-option>
                <mat-option value="VIGENTE">Vigente</mat-option>
                <mat-option value="SUSPENDIDA">Suspendida</mat-option>
                <mat-option value="CANCELADA">Cancelada</mat-option>
                <mat-option value="VENCIDA">Vencida</mat-option>
                <mat-option value="ANULADA">Anulada</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Select Modalidad -->
            <mat-form-field appearance="outline" class="filter-select" subscriptSizing="dynamic">
              <mat-label>Modalidad</mat-label>
              <mat-select [formControl]="tipoAutorizacionControl">
                <mat-option value="">Todas las Modalidades</mat-option>
                <mat-option value="PASAJEROS">Transporte Regular de Pasajeros</mat-option>
                <mat-option value="TURISMO">Transporte Especial de Turismo</mat-option>
                <mat-option value="CARGA">Carga y Mercancías</mat-option>
                <mat-option value="TRABAJADORES">Transporte de Trabajadores</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Chip Toggle Por Vencer 30d -->
            <button mat-button 
                    type="button"
                    [class.active-vencer]="filtroPorVencer30()"
                    (click)="toggleFiltroPorVencer()" 
                    class="filter-chip-btn" 
                    matTooltip="Mostrar resoluciones que vencen en los próximos 30 días">
              <mat-icon class="chip-icon">timer</mat-icon>
              <span>Por Vencer (30d)</span>
              @if (conteoPorVencer30() > 0) {
                <span class="badge-vencer" [class.badge-active]="filtroPorVencer30()">{{ conteoPorVencer30() }}</span>
              }
            </button>

            <!-- Botón Limpiar filtros -->
            @if (searchControl.value || estadoControl.value || tipoAutorizacionControl.value || filtroPorVencer30()) {
              <button mat-button type="button" (click)="limpiarFiltros()" class="filter-action-btn btn-reset" matTooltip="Limpiar todos los filtros">
                <mat-icon>filter_alt_off</mat-icon>
                <span>Limpiar</span>
              </button>
            }

            <!-- Botón Configurar Columnas -->
            <button mat-button type="button" [matMenuTriggerFor]="columnsMenu" class="filter-action-btn" matTooltip="Configurar columnas visibles">
              <mat-icon>tune</mat-icon>
              <span>Columnas</span>
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
            </div> <!-- End of collapsible-filters -->
          </div>
        </div>

        <!-- Formulario Modal: Crear Nueva Primigenia -->
        @if (showFormModal()) {
          <mat-card class="form-card animate-fade-in">
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="primary">post_add</mat-icon>
                Registrar Nueva Resolución Primigenia
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="primigeniaForm" (ngSubmit)="guardarResolucion()" class="primigenia-form">
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>RUC Empresa (11 dígitos)</mat-label>
                    <input matInput formControlName="ruc_empresa" maxlength="11" placeholder="Ej: 20123456789">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Número de Resolución</mat-label>
                    <input matInput formControlName="nro_resolucion" placeholder="Ej: 0100-2021">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Siglas (ej: GRP/GRI/DRTC)</mat-label>
                    <input matInput formControlName="siglas" placeholder="Ej: GRP/GRI/DRTC">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Fecha de Emisión</mat-label>
                    <input matInput type="date" formControlName="fecha_resolucion">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Fecha Inicio Vigencia</mat-label>
                    <input matInput type="date" formControlName="fecha_inicio_vigencia">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Años de Vigencia</mat-label>
                    <mat-select formControlName="anios_vigencia">
                      <mat-option [value]="10">10 Años (Turismo / Especializado)</mat-option>
                      <mat-option [value]="4">4 Años (Regular Interprovincial)</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Tipo Autorización / Modalidad</mat-label>
                    <mat-select formControlName="tipo_autorizacion">
                      <mat-option value="PASAJEROS">Transporte de Pasajeros / Regular</mat-option>
                      <mat-option value="TURISMO">Transporte Especial de Turismo</mat-option>
                      <mat-option value="CARGA">Carga y Mercancías</mat-option>
                      <mat-option value="TRABAJADORES">Transporte de Trabajadores</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Link a Google Drive (URL Expediente PDF)</mat-label>
                    <input matInput formControlName="link_documento" placeholder="https://drive.google.com/...">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Expedientes Originarios (separados por coma)</mat-label>
                    <input matInput formControlName="expedientes_codigos" placeholder="Ej: EXP-2021-00451, EXP-2021-00890">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Observaciones Operativas</mat-label>
                    <textarea matInput formControlName="observaciones" rows="2" placeholder="Notas e incidencias"></textarea>
                  </mat-form-field>
                </div>

                <div class="form-actions">
                  <button mat-button type="button" (click)="toggleFormModal()">Cancelar</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="primigeniaForm.invalid || isLoading()">
                    Guardar Primigenia
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <!-- Formulario Modal: Editar Primigenia -->
        @if (selectedForEdit()) {
          <mat-card class="form-card animate-fade-in border-accent">
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="accent">edit</mat-icon>
                Editar Resolución Primigenia N° {{ selectedForEdit()?.nro_resolucion }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="editForm" (ngSubmit)="actualizarResolucion()" class="primigenia-form">
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Número de Resolución</mat-label>
                    <input matInput formControlName="nro_resolucion">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Siglas Institucionales</mat-label>
                    <input matInput formControlName="siglas" placeholder="Ej: GRP/GRI/DRTC">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Estado Legal</mat-label>
                    <mat-select formControlName="estado">
                      <mat-option value="VIGENTE">Vigente</mat-option>
                      <mat-option value="SUSPENDIDA">Suspendida</mat-option>
                      <mat-option value="CANCELADA">Cancelada</mat-option>
                      <mat-option value="VENCIDA">Vencida</mat-option>
                      <mat-option value="ANULADA">Anulada</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Fecha de Emisión</mat-label>
                    <input matInput type="date" formControlName="fecha_resolucion">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Fecha Inicio Vigencia</mat-label>
                    <input matInput type="date" formControlName="fecha_inicio_vigencia">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Años de Vigencia</mat-label>
                    <mat-select formControlName="anios_vigencia">
                      <mat-option [value]="10">10 Años</mat-option>
                      <mat-option [value]="4">4 Años</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Tipo Autorización / Modalidad</mat-label>
                    <mat-select formControlName="tipo_autorizacion">
                      <mat-option value="PASAJEROS">Transporte de Pasajeros / Regular</mat-option>
                      <mat-option value="TURISMO">Transporte Especial de Turismo</mat-option>
                      <mat-option value="CARGA">Carga y Mercancías</mat-option>
                      <mat-option value="TRABAJADORES">Transporte de Trabajadores</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Link a Google Drive</mat-label>
                    <input matInput formControlName="link_documento">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Observaciones Operativas</mat-label>
                    <textarea matInput formControlName="observaciones" rows="2"></textarea>
                  </mat-form-field>
                </div>

                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelarEdicion()">Cancelar</button>
                  <button mat-raised-button color="accent" type="submit" [disabled]="editForm.invalid || isLoading()">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <!-- Formulario Modal: Agregar Fe de Errata -->
        @if (selectedForFeErrata()) {
          <mat-card class="form-card animate-fade-in border-warning">
            <mat-card-header>
              <mat-card-title>
                <mat-icon style="color: #b45309;">note_add</mat-icon>
                Agregar Fe de Errata a N° {{ selectedForFeErrata()?.nro_resolucion }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="feErrataForm" (ngSubmit)="guardarFeErrata()" class="primigenia-form">
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>N° Resolución de la Fe de Errata</mat-label>
                    <input matInput formControlName="numero_resolucion" placeholder="Ej: 0869-2024">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Fecha de Emisión</mat-label>
                    <input matInput type="date" formControlName="fecha_emision">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Detalle de la Corrección (¿Qué se corrige?)</mat-label>
                    <textarea matInput formControlName="detalle_correccion" rows="2" placeholder="Ej: Rectificación de RUC titular de 20123456780 a 20123456789"></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Link PDF de Fe de Errata (opcional)</mat-label>
                    <input matInput formControlName="documento_link" placeholder="https://drive.google.com/...">
                  </mat-form-field>
                </div>

                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelarFeErrata()">Cancelar</button>
                  <button mat-raised-button style="background-color: #b45309; color: white;" type="submit" [disabled]="feErrataForm.invalid || isLoading()">
                    Guardar Fe de Errata
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <!-- Modal Ver Detalle e Historial Completo -->
        @if (selectedForDetail()) {
          <mat-card class="detail-card animate-fade-in">
            <mat-card-header>
              <mat-card-title class="detail-title">
                <mat-icon color="primary">description</mat-icon>
                Detalle Completo: Resolución N° {{ selectedForDetail()?.nro_resolucion }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="detail-grid">
                <div class="detail-item"><strong>N° Resolución:</strong> {{ selectedForDetail()?.nro_resolucion }}</div>
                <div class="detail-item"><strong>Siglas:</strong> <span class="siglas-badge">{{ selectedForDetail()?.siglas || '-' }}</span></div>
                <div class="detail-item"><strong>RUC Empresa:</strong> {{ selectedForDetail()?.ruc_empresa }}</div>
                <div class="detail-item"><strong>Estado Legal:</strong> <span [class]="'status-pill status-' + selectedForDetail()?.estado?.toLowerCase()">{{ selectedForDetail()?.estado }}</span></div>
                <div class="detail-item"><strong>Modalidad:</strong> {{ selectedForDetail()?.tipo_autorizacion }}</div>
                <div class="detail-item"><strong>Fecha Emisión:</strong> {{ selectedForDetail()?.fecha_resolucion | date:'dd/MM/yyyy' }}</div>
                <div class="detail-item"><strong>Vigencia Inicio:</strong> {{ selectedForDetail()?.fecha_inicio_vigencia | date:'dd/MM/yyyy' }}</div>
                <div class="detail-item"><strong>Vigencia Fin:</strong> {{ selectedForDetail()?.fecha_fin_vigencia | date:'dd/MM/yyyy' }} ({{ selectedForDetail()?.anios_vigencia }} Años)</div>
                <div class="detail-item"><strong>Eficacia Anticipada:</strong> {{ selectedForDetail()?.tiene_eficacia_anticipada ? 'SÍ (Vigencia inició antes que emisión)' : 'NO' }}</div>
                <div class="detail-item"><strong>Expedientes de Origen:</strong> {{ selectedForDetail()?.expedientes_codigos?.join(', ') || '-' }}</div>
                @if (selectedForDetail()?.link_documento) {
                  <div class="detail-item full-width">
                    <strong>Drive PDF:</strong> <a [href]="selectedForDetail()?.link_documento" target="_blank" class="drive-link">{{ selectedForDetail()?.link_documento }}</a>
                  </div>
                }
              </div>

              <!-- Sección Fe de Erratas -->
              <div class="sub-section">
                <h3><mat-icon style="color: #b45309;">label</mat-icon> Fe de Erratas Emitidas ({{ selectedForDetail()?.fe_erratas?.length || 0 }})</h3>
                @if (!selectedForDetail()?.fe_erratas?.length) {
                  <p class="sin-datos">No hay fe de erratas registradas para esta resolución.</p>
                } @else {
                  <ul class="sub-list">
                    @for (fe of selectedForDetail()?.fe_erratas; track fe.numero_resolucion) {
                      <li>
                        <strong>N° {{ fe.numero_resolucion }}</strong> ({{ fe.fecha_emision | date:'dd/MM/yyyy' }}): {{ fe.detalle_correccion }}
                      </li>
                    }
                  </ul>
                }
              </div>

              <!-- Sección Historial de Modificaciones (Hijas) -->
              <div class="sub-section">
                <h3><mat-icon style="color: #0d9488;">alt_route</mat-icon> Historial de Resoluciones Hijas ({{ selectedForDetail()?.historial_modificaciones?.length || 0 }})</h3>
                @if (!selectedForDetail()?.historial_modificaciones?.length) {
                  <p class="sin-datos">No hay modificaciones posteriores registradas.</p>
                } @else {
                  <ul class="sub-list">
                    @for (mod of selectedForDetail()?.historial_modificaciones; track mod.nro_resolucion_hija) {
                      <li>
                        <strong>N° {{ mod.nro_resolucion_hija }}</strong> [{{ mod.tipo_modificacion }}] - {{ mod.fecha_acto | date:'dd/MM/yyyy' }}: {{ mod.observacion || '-' }}
                      </li>
                    }
                  </ul>
                }
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="cerrarDetalle()">Cerrar</button>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Tabla de Resultados -->
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando resoluciones primigenias...</p>
          </div>
        } @else if (resolucionesFiltradas().length === 0) {
          <mat-card class="empty-state">
            <mat-card-content>
              <mat-icon class="empty-icon">gavel</mat-icon>
              <h3>No se encontraron Resoluciones Primigenias</h3>
              <p>Intenta ajustar los filtros de búsqueda o registra una nueva resolución.</p>
              <button mat-raised-button color="primary" (click)="toggleFormModal()">
                <mat-icon>add</mat-icon> Registrar Primera Primigenia
              </button>
            </mat-card-content>
          </mat-card>
        } @else {
          <!-- Banner de Selección Múltiple -->
          @if (selectedCount() > 0) {
            <div class="selection-banner animate-fade-in">
              <div class="banner-info">
                <mat-icon class="banner-icon">check_circle</mat-icon>
                <span><strong>{{ selectedCount() }}</strong> resolucion(es) primigenia(s) seleccionada(s)</span>
              </div>
              <div class="banner-actions">
                <button mat-raised-button color="accent" (click)="exportarAExcel('seleccionadas')">
                  <mat-icon>file_download</mat-icon> Exportar Seleccionadas a Excel ({{ selectedCount() }})
                </button>
                <button mat-button (click)="clearSelection()" class="btn-clear-selection">
                  <mat-icon>close</mat-icon> Desmarcar todo
                </button>
              </div>
            </div>
          }

          <mat-card class="table-card">
            <mat-card-content>
              <div class="table-container">
                <table class="custom-table">
                  <thead>
                    <tr>
                      @if (columnaVisible('select')) {
                        <th class="checkbox-th text-center">
                          <mat-checkbox
                            [checked]="isAllSelected()"
                            [indeterminate]="isSomeSelected()"
                            (change)="toggleSelectAll()"
                            matTooltip="Seleccionar / deseleccionar todas las resoluciones filtradas">
                          </mat-checkbox>
                        </th>
                      }
                      @if (columnaVisible('nro_resolucion')) {
                        <th (click)="toggleSort('nro_resolucion')" class="sortable-th">
                          <span>N° Resolución</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('nro_resolucion') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('siglas')) {
                        <th (click)="toggleSort('siglas')" class="sortable-th">
                          <span>Siglas</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('siglas') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('ruc_empresa')) {
                        <th (click)="toggleSort('ruc_empresa')" class="sortable-th">
                          <span>RUC Empresa</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('ruc_empresa') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('tipo_autorizacion')) {
                        <th (click)="toggleSort('tipo_autorizacion')" class="sortable-th">
                          <span>Modalidad</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('tipo_autorizacion') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('fecha_resolucion')) {
                        <th (click)="toggleSort('fecha_resolucion')" class="sortable-th">
                          <span>F. Emisión</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('fecha_resolucion') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('fecha_inicio_vigencia')) {
                        <th (click)="toggleSort('fecha_inicio_vigencia')" class="sortable-th">
                          <span>F. Vigencia Inicio</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('fecha_inicio_vigencia') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('anios_vigencia')) {
                        <th (click)="toggleSort('anios_vigencia')" class="sortable-th text-center">
                          <span>Vigencia</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('anios_vigencia') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('fecha_fin_vigencia')) {
                        <th (click)="toggleSort('fecha_fin_vigencia')" class="sortable-th">
                          <span>F. Fin Vigencia</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('fecha_fin_vigencia') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('estado')) {
                        <th (click)="toggleSort('estado')" class="sortable-th">
                          <span>Estado</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('estado') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('tiene_eficacia_anticipada')) {
                        <th (click)="toggleSort('tiene_eficacia_anticipada')" class="sortable-th text-center">
                          <span>Eficacia Ant.</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('tiene_eficacia_anticipada') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('fe_erratas')) {
                        <th (click)="toggleSort('fe_erratas')" class="sortable-th">
                          <span>Fe de Erratas</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('fe_erratas') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('historial_modificaciones')) {
                        <th (click)="toggleSort('historial_modificaciones')" class="sortable-th">
                          <span>Modificaciones</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('historial_modificaciones') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('observaciones')) {
                        <th (click)="toggleSort('observaciones')" class="sortable-th">
                          <span>Observaciones</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('observaciones') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('link_documento')) {
                        <th>Drive</th>
                      }
                      @if (columnaVisible('acciones')) {
                        <th class="text-center th-actions-icon-col" matTooltip="Opciones y Acciones">
                          <mat-icon class="th-actions-icon">more_vert</mat-icon>
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of paginatedResoluciones(); track item.id) {
                      <tr [class.selected-row]="isSelected(item.id)">
                        @if (columnaVisible('select')) {
                          <td class="checkbox-td text-center" (click)="$event.stopPropagation()">
                            <mat-checkbox
                              [checked]="isSelected(item.id)"
                              (change)="toggleSelectRow(item.id)">
                            </mat-checkbox>
                          </td>
                        }
                        @if (columnaVisible('nro_resolucion')) {
                          <td class="bold-text color-primary">{{ item.nro_resolucion }}</td>
                        }
                        @if (columnaVisible('siglas')) {
                          <td>
                            @if (item.siglas) {
                              <span class="siglas-badge" matTooltip="Siglas institucionales">{{ item.siglas }}</span>
                            } @else {
                              <span class="sin-datos">-</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('ruc_empresa')) {
                          <td>
                            <div class="ruc-container">
                              @if (getNombreEmpresa(item.ruc_empresa)) {
                                <span class="empresa-hint-text" [matTooltip]="getNombreEmpresaCompleto(item.ruc_empresa)">
                                  {{ getNombreEmpresa(item.ruc_empresa) }}
                                </span>
                              }
                              <span class="ruc-badge">{{ item.ruc_empresa }}</span>
                            </div>
                          </td>
                        }
                        @if (columnaVisible('tipo_autorizacion')) {
                          <td>
                            @if (esTipoTurismo(item.tipo_autorizacion)) {
                              <span class="tipo-badge badge-turismo">TURISMO</span>
                            } @else if (esTipoCarga(item.tipo_autorizacion)) {
                              <span class="tipo-badge badge-carga">CARGA</span>
                            } @else if (esTipoTrabajadores(item.tipo_autorizacion)) {
                              <span class="tipo-badge badge-trabajadores">TRABAJADORES</span>
                            } @else {
                              <span class="tipo-badge badge-pasajeros">PASAJEROS</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('fecha_resolucion')) {
                          <td>{{ item.fecha_resolucion ? (item.fecha_resolucion | date:'dd/MM/yyyy') : 'N/A' }}</td>
                        }
                        @if (columnaVisible('fecha_inicio_vigencia')) {
                          <td>{{ item.fecha_inicio_vigencia ? (item.fecha_inicio_vigencia | date:'dd/MM/yyyy') : 'N/A' }}</td>
                        }
                        @if (columnaVisible('anios_vigencia')) {
                          <td class="text-center">{{ item.anios_vigencia }} Años</td>
                        }
                        @if (columnaVisible('fecha_fin_vigencia')) {
                          <td>
                            @if (item.fecha_fin_vigencia) {
                              <div class="fecha-fin-container">
                                @if (esPorVencer30Dias(item.fecha_fin_vigencia, item.estado)) {
                                  <span class="por-vencer-hint" [matTooltip]="'⚠️ Advertencia: Vence en ' + diasParaVencer(item.fecha_fin_vigencia) + ' días'">
                                    POR VENCER ({{ diasParaVencer(item.fecha_fin_vigencia) }}d)
                                  </span>
                                }
                                @if (esFechaVencida(item.fecha_fin_vigencia, item.estado)) {
                                  <span class="fecha-vencida-cell" matTooltip="⚠️ RESOLUCIÓN VENCIDA: La fecha de fin de vigencia ha expirado">
                                    <mat-icon class="vencida-icon">event_busy</mat-icon>
                                    {{ item.fecha_fin_vigencia | date:'dd/MM/yyyy' }}
                                  </span>
                                } @else {
                                  <span class="fecha-vigente-cell" [class.text-por-vencer]="esPorVencer30Dias(item.fecha_fin_vigencia, item.estado)">
                                    {{ item.fecha_fin_vigencia | date:'dd/MM/yyyy' }}
                                  </span>
                                }
                              </div>
                            } @else {
                              <span class="sin-datos">N/A</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('estado')) {
                          <td>
                            @if (esFechaVencida(item.fecha_fin_vigencia, item.estado)) {
                              <span class="status-pill status-vencida" matTooltip="Vencida por fecha de expiración de vigencia">
                                VENCIDA
                              </span>
                            } @else {
                              <span [class]="'status-pill status-' + (item.estado ? item.estado.toLowerCase() : '')">
                                {{ item.estado }}
                              </span>
                            }
                          </td>
                        }
                        @if (columnaVisible('tiene_eficacia_anticipada')) {
                          <td class="text-center">
                            @if (item.tiene_eficacia_anticipada) {
                              <span class="badge-eficacia" matTooltip="Vigencia surte efecto antes de la emisión">SÍ</span>
                            } @else {
                              <span class="badge-no">NO</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('fe_erratas')) {
                          <td>
                            @if (item.fe_erratas && item.fe_erratas.length > 0) {
                              <span class="badge-count badge-errata" [matTooltip]="item.fe_erratas[0].detalle_correccion">
                                {{ item.fe_erratas.length }} Errata(s)
                              </span>
                            } @else {
                              <span class="sin-datos">-</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('historial_modificaciones')) {
                          <td>
                            @if (item.historial_modificaciones && item.historial_modificaciones.length > 0) {
                              <span class="badge-count badge-mod" [matTooltip]="item.historial_modificaciones[0].tipo_modificacion">
                                {{ item.historial_modificaciones.length }} Mod.
                              </span>
                            } @else {
                              <span class="sin-datos">-</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('observaciones')) {
                          <td>
                            @if (item.observaciones) {
                              <span class="obs-text" [matTooltip]="item.observaciones">{{ item.observaciones }}</span>
                            } @else {
                              <span class="sin-datos">-</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('link_documento')) {
                          <td class="text-center">
                            @if (item.link_documento) {
                              <a [href]="item.link_documento" target="_blank" class="drive-link" matTooltip="Abrir en Google Drive">
                                <mat-icon>open_in_new</mat-icon>
                              </a>
                            } @else {
                              <span class="sin-datos">-</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('acciones')) {
                          <td class="text-center">
                            <button mat-icon-button [matMenuTriggerFor]="actionMenu" [matMenuTriggerData]="{ item: item }" matTooltip="Opciones de la Resolución">
                              <mat-icon>more_vert</mat-icon>
                            </button>
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Menú desplegable global para las acciones -->
              <mat-menu #actionMenu="matMenu">
                <ng-template matMenuContent let-item="item">
                  <button mat-menu-item (click)="verDetalleModal(item)">
                    <mat-icon color="primary">visibility</mat-icon>
                    <span>Ver Detalle e Historial</span>
                  </button>
                  <button mat-menu-item (click)="editarResolucionModal(item)">
                    <mat-icon color="accent">edit</mat-icon>
                    <span>Editar Resolución</span>
                  </button>
                  <button mat-menu-item (click)="abrirModalFeErrata(item)">
                    <mat-icon style="color: #b45309;">note_add</mat-icon>
                    <span>Agregar Fe de Errata</span>
                  </button>
                  <button mat-menu-item (click)="crearHijaVinculada(item)">
                    <mat-icon style="color: #0d9488;">alt_route</mat-icon>
                    <span>Registrar Resolución Hija</span>
                  </button>
                  @if (item?.link_documento) {
                    <a mat-menu-item [href]="item.link_documento" target="_blank">
                      <mat-icon style="color: #2563eb;">open_in_new</mat-icon>
                      <span>Abrir en Google Drive</span>
                    </a>
                  }
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="eliminarResolucion(item.id)">
                    <mat-icon color="warn">delete</mat-icon>
                    <span>Desactivar / Eliminar</span>
                  </button>
                </ng-template>
              </mat-menu>

              <mat-paginator
                [pageSizeOptions]="[10, 25, 50, 100, 250, 500, 1000]"
                [pageSize]="pageSize()"
                [length]="resolucionesFiltradas().length"
                (page)="onPageChange($event)"
                showFirstLastButtons>
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
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      color: white;
      padding: 1.75rem 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(49, 46, 129, 0.4);

      .title-with-icon {
        display: flex;
        align-items: center;
        gap: 1rem;

        .header-icon {
          font-size: 2.5rem;
          width: 2.5rem;
          height: 2.5rem;
          color: #818cf8;
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
        align-items: center;
        gap: 0.75rem;

        .header-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          height: 42px;
          padding: 0 1.1rem;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 600;
          background-color: rgba(255, 255, 255, 0.15);
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

          .btn-icon {
            font-size: 1.25rem;
            width: 1.25rem;
            height: 1.25rem;
            color: #ffffff;
          }

          .dropdown-arrow {
            font-size: 1.1rem;
            width: 1.1rem;
            height: 1.1rem;
            margin-left: -0.2rem;
            color: #ffffff;
          }

          &:hover {
            background-color: rgba(255, 255, 255, 0.28);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-1px);
          }

          &.btn-primary-custom {
            background-color: #6366f1 !important;
            border-color: #818cf8 !important;

            &:hover {
              background-color: #4f46e5 !important;
            }
          }
        }
      }
    }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.15rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      min-width: 0;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
      }

      &.kpi-clickable {
        cursor: pointer;
      }

      &.kpi-active-filter {
        border-color: #ea580c;
        background: #fff7ed;
      }
    }

    .kpi-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
      }

      &.card-total { background-color: #eff6ff; color: #2563eb; }
      &.card-vigentes { background-color: #ecfdf5; color: #059669; }
      &.card-por-vencer { background-color: #fff7ed; color: #ea580c; }
      &.card-criticas { background-color: #fef2f2; color: #dc2626; }
      &.card-empresas { background-color: #eef2ff; color: #4f46e5; }
    }

    .kpi-data {
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    .kpi-number {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kpi-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
      margin-top: 0.2rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kpi-detail {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.1rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .glass-filters {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.5rem 0.75rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

      .filters-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;

        .search-field {
          flex: 1 1 260px;
          min-width: 200px;

          .search-icon {
            color: #94a3b8;
            font-size: 1.2rem;
            width: 1.2rem;
            height: 1.2rem;
            margin-right: 0.35rem;
          }

          .clear-input-btn {
            width: 24px;
            height: 24px;
            line-height: 24px;
            .mat-icon {
              font-size: 1rem;
              width: 1rem;
              height: 1rem;
              color: #94a3b8;
            }
          }
        }

        .filter-select {
          width: 170px;
          flex-shrink: 0;
        }

        ::ng-deep {
          .search-field, .filter-select {
            .mat-mdc-text-field-wrapper {
              height: 40px !important;
              padding: 0 0.65rem !important;
              background-color: #f8fafc !important;
              border-radius: 8px !important;
            }

            .mat-mdc-form-field-flex {
              height: 40px !important;
              align-items: center !important;
            }

            .mat-mdc-form-field-infix {
              padding-top: 6px !important;
              padding-bottom: 6px !important;
              min-height: 40px !important;
            }

            .mat-mdc-floating-label {
              top: 20px !important;
              font-size: 0.82rem !important;
            }

            .mat-mdc-select-value-text, input.mat-mdc-input-element {
              font-size: 0.82rem !important;
              color: #1e293b !important;
            }

            .mat-mdc-select-arrow-wrapper {
              transform: translateY(0) !important;
            }

            .mdc-notched-outline__leading,
            .mdc-notched-outline__notch,
            .mdc-notched-outline__trailing {
              border-color: #e2e8f0 !important;
            }

            &:hover .mdc-notched-outline__leading,
            &:hover .mdc-notched-outline__notch,
            &:hover .mdc-notched-outline__trailing {
              border-color: #cbd5e1 !important;
            }

            &.mat-focused .mdc-notched-outline__leading,
            &.mat-focused .mdc-notched-outline__notch,
            &.mat-focused .mdc-notched-outline__trailing {
              border-color: #6366f1 !important;
              border-width: 1.5px !important;
            }
          }
        }

        .filter-chip-btn {
          height: 40px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 500;
          padding: 0 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          transition: all 0.2s ease;

          .chip-icon {
            font-size: 1.1rem;
            width: 1.1rem;
            height: 1.1rem;
            color: #d97706;
          }

          .badge-vencer {
            background-color: #e2e8f0;
            color: #475569;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.1rem 0.4rem;
            border-radius: 10px;
            line-height: 1;
            margin-left: 0.15rem;
          }

          &:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
          }

          &.active-vencer {
            background: #fff1f2;
            border-color: #fecdd3;
            color: #e11d48;
            font-weight: 600;

            .chip-icon {
              color: #e11d48;
            }

            .badge-vencer {
              background-color: #e11d48;
              color: white;
            }
          }
        }

        .filter-action-btn {
          height: 40px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 500;
          padding: 0 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          transition: all 0.2s ease;

          .mat-icon {
            font-size: 1.1rem;
            width: 1.1rem;
            height: 1.1rem;
            color: #64748b;
          }

          &:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            color: #1e293b;
          }

          &.btn-reset {
            color: #ef4444;
            border-color: #fecaca;
            background: #fef2f2;

            .mat-icon {
              color: #ef4444;
            }

            &:hover {
              background: #fee2e2;
            }
          }
        }
      }
    }

    .form-card {
      margin-bottom: 1.5rem;
      border-left: 4px solid #6366f1;

      &.border-accent { border-left-color: #ec4899; }
      &.border-warning { border-left-color: #b45309; }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
        margin-top: 1rem;

        .full-width { grid-column: 1 / -1; }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
      }
    }

    .detail-card {
      margin-bottom: 1.5rem;
      border-left: 4px solid #4338ca;
      padding: 1rem;

      .detail-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 0.85rem;
        margin-bottom: 1.5rem;
      }

      .detail-item {
        font-size: 0.95rem;
      }

      .sub-section {
        margin-top: 1.5rem;
        background-color: #f8fafc;
        padding: 1rem;
        border-radius: 8px;

        h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0;
          font-size: 1.1rem;
        }

        .sub-list {
          padding-left: 1.25rem;
          margin: 0.5rem 0 0 0;
          li { margin-bottom: 0.35rem; }
        }
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

      .table-container { overflow-x: auto; }
    }

    .custom-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      text-align: left;
      font-size: 0.9rem;

      th, td {
        &:first-child {
          position: sticky;
          left: 0;
          z-index: 5;
          background-color: #ffffff;
          box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.08);
        }

        &:last-child {
          position: sticky;
          right: 0;
          z-index: 5;
          background-color: #ffffff;
          box-shadow: -2px 0 5px -2px rgba(0, 0, 0, 0.08);
        }
      }

      th {
        background-color: #f8fafc;
        color: #475569;
        font-weight: 600;
        padding: 0.85rem 1rem;
        border-bottom: 2px solid #e2e8f0;
        white-space: nowrap;

        &:first-child, &:last-child {
          background-color: #f8fafc;
          z-index: 6;
        }

        &.sortable-th {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease, color 0.2s ease;

          &:hover {
            background-color: #e0e7ff;
            color: #3730a3;
          }

          .sort-icon {
            font-size: 1.1rem;
            width: 1.1rem;
            height: 1.1rem;
            vertical-align: middle;
            margin-left: 0.25rem;
            color: #6366f1;
          }
        }
      }

      td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      tr:hover td {
        background-color: #f8fafc;
      }
    }

    .th-actions-icon-col {
      width: 48px;
      min-width: 48px;
      padding: 0.5rem !important;

      .th-actions-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
        vertical-align: middle;
        color: #475569;
      }
    }

    .bold-text { font-weight: 600; }
    .color-primary { color: #4338ca; }

    .ruc-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;

      .empresa-hint-text {
        font-size: 0.72rem;
        font-weight: 700;
        color: #475569;
        max-width: 190px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-transform: uppercase;
        line-height: 1.1;
      }
    }

    .ruc-badge {
      background-color: #e0e7ff;
      color: #3730a3;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-family: monospace;
      font-weight: 600;
    }

    .siglas-badge {
      background-color: #f1f5f9;
      color: #475569;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.8rem;
      border: 1px solid #cbd5e1;
      font-weight: 600;
    }

    .status-pill {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;

      &.status-vigente { background-color: #dcfce7; color: #15803d; }
      &.status-suspendida { background-color: #fef3c7; color: #b45309; }
      &.status-cancelada, &.status-anulada { background-color: #fee2e2; color: #b91c1c; }
      &.status-vencida { background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; font-weight: 800; }
      &.status-por-vencer { background-color: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; font-weight: 700; }
    }

    .fecha-fin-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;

      .por-vencer-hint {
        font-size: 0.64rem;
        font-weight: 800;
        color: #c2410c;
        background-color: #fff7ed;
        border: 1px solid #fed7aa;
        padding: 0.05rem 0.35rem;
        border-radius: 4px;
        line-height: 1.1;
        letter-spacing: -0.2px;
      }

      .text-por-vencer {
        color: #c2410c;
        font-weight: 700;
      }
    }

    .fecha-vencida-cell {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background-color: #fee2e2;
      color: #991b1b;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-weight: 700;
      border: 1px solid #fca5a5;

      .vencida-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
        color: #dc2626;
      }
    }

    .fecha-por-vencer-cell {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background-color: #fff7ed;
      color: #c2410c;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-weight: 700;
      border: 1px solid #fed7aa;

      .por-vencer-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
        color: #ea580c;
      }
    }

    .active-warning-filter {
      background-color: #fff7ed !important;
      color: #c2410c !important;
      border-color: #ea580c !important;
    }

    .badge-count-warning {
      background-color: #ea580c;
      color: white;
      padding: 0.1rem 0.45rem;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 700;
      margin-left: 0.35rem;
    }

    .fecha-vigente-cell {
      color: #1e293b;
    }

    .obs-text {
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
      color: #475569;
      font-size: 0.85rem;
    }

    .badge-eficacia {
      background-color: #0284c7;
      color: white;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .badge-no { color: #9ca3af; font-size: 0.8rem; }

    .badge-count {
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;

      &.badge-errata { background-color: #fef08a; color: #854d0e; }
      &.badge-mod { background-color: #e0f2fe; color: #0369a1; }
    }

    .tipo-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.02em;

      &.badge-pasajeros {
        background-color: #e0e7ff;
        color: #3730a3;
        border: 1px solid #c7d2fe;
      }
      &.badge-turismo {
        background-color: #f3e8ff;
        color: #6b21a8;
        border: 1px solid #e9d5ff;
      }
      &.badge-carga {
        background-color: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
      }
      &.badge-trabajadores {
        background-color: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
      }
    }

    .drive-link {
      color: #2563eb;
      &:hover { color: #1d4ed8; }
    }

    .sin-datos { color: #cbd5e1; }
    .text-center { text-align: center; }

    .selection-banner {
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      border: 1px solid #a5b4fc;
      color: #312e81;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);

      .banner-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;

        .banner-icon {
          color: #4338ca;
        }
      }

      .banner-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .btn-clear-selection {
        color: #4338ca;
        font-weight: 600;

        &:hover {
          background-color: rgba(67, 56, 202, 0.08);
        }
      }
    }

    .checkbox-th, .checkbox-td {
      width: 48px;
      min-width: 48px;
      padding: 0 0.5rem !important;
      text-align: center;
    }

    .selected-row {
      background-color: #eef2ff !important;

      td {
        background-color: #eef2ff !important;
      }
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    /* Mobile Filter Toggle */
    .mobile-filter-toggle {
      display: none;
    }
    
    .collapsible-filters {
      display: contents; /* Behaves like normal in desktop */
    }

    /* Responsive Mobile */
    @media (max-width: 768px) {
      .mobile-filter-toggle {
        display: inline-flex;
        background-color: #f1f5f9;
        color: #475569;
        margin-left: auto;
      }
      
      .mobile-filter-toggle.active {
        background-color: #e0e7ff;
        color: #4338ca;
      }
      
      .search-and-toggle {
        display: flex;
        width: 100%;
        gap: 0.5rem;
        align-items: center;
      }
      
      .collapsible-filters {
        display: none;
        flex-direction: column;
        width: 100%;
        gap: 0.5rem;
        animation: slideDown 0.3s ease-out;
      }
      
      .collapsible-filters.show {
        display: flex;
      }
      
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
      }
      
      .header-actions {
        width: 100%;
        justify-content: space-between; /* Space out the 3 icon buttons uniformly */
      }
      
      .mobile-icon-btn {
        width: 48px !important;
        height: 48px !important;
        border-radius: 12px !important;
      }
      
      .mobile-icon-btn .mat-icon {
        margin: 0 !important;
      }
      
      .mobile-icon-btn .desktop-text {
        display: none; /* Hide text on mobile, keep icons */
      }
      
      .glass-filters .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }
      
      .filter-select, .search-field {
        width: 100% !important;
        flex: none !important;
      }
      
      .form-grid {
        grid-template-columns: 1fr !important;
      }
      
      .detail-grid {
        grid-template-columns: 1fr !important;
      }
      
      .selection-banner {
        flex-direction: column;
        text-align: center;
      }
    }
    
    /* ========================================================================= */
    /* MODO OSCURO INSTITUCIONAL (GOVTECH SENTINEL DRTC PUNO)                    */
    /* ========================================================================= */
    :host-context([data-theme="dark"]), :host-context(.dark-theme), :host-context(.dark-mode) {
      .page-container {
        background-color: #0b0f19 !important;
        color: #f8fafc !important;
      }

      .page-header {
        background: linear-gradient(135deg, #07152f 0%, #0b1f44 50%, #1e3a8a 100%) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;

        .header-icon {
          color: #60a5fa !important;
        }

        h1 {
          color: #ffffff !important;
        }

        .subtitle {
          color: #cbd5e1 !important;
        }
      }

      .header-actions .header-action-btn {
        background-color: rgba(23, 27, 38, 0.75) !important;
        color: #f8fafc !important;
        border-color: #283046 !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;

        .btn-icon, .dropdown-arrow {
          color: #f8fafc !important;
        }

        &:hover {
          background-color: #1e2433 !important;
          border-color: #3b82f6 !important;
        }

        &.btn-primary-custom {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
          border-color: #3b82f6 !important;
          color: #ffffff !important;

          &:hover {
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
            box-shadow: 0 0 12px rgba(37, 99, 235, 0.5) !important;
          }
        }
      }

      /* KPI CARDS EN DARK */
      .kpi-card {
        background-color: #111622 !important;
        border-color: #1e2433 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;

        &:hover {
          border-color: #283046 !important;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5) !important;
        }

        &.kpi-active-filter {
          border-color: #f59e0b !important;
          background-color: rgba(245, 158, 11, 0.12) !important;
        }

        .kpi-number {
          color: #f8fafc !important;
        }

        .kpi-label {
          color: #cbd5e1 !important;
        }

        .kpi-detail {
          color: #94a3b8 !important;
        }
      }

      .kpi-icon-box {
        &.card-total { background-color: rgba(37, 99, 235, 0.15) !important; color: #60a5fa !important; }
        &.card-vigentes { background-color: rgba(16, 185, 129, 0.15) !important; color: #34d399 !important; }
        &.card-por-vencer { background-color: rgba(245, 158, 11, 0.15) !important; color: #fbbf24 !important; }
        &.card-criticas { background-color: rgba(220, 38, 38, 0.15) !important; color: #f87171 !important; }
        &.card-empresas { background-color: rgba(99, 102, 241, 0.15) !important; color: #a5b4fc !important; }
      }

      /* FILTROS EN DARK */
      .glass-filters {
        background-color: #111622 !important;
        border-color: #1e2433 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      }

      .mobile-filter-toggle {
        background-color: #171b26 !important;
        color: #cbd5e1 !important;
        border: 1px solid #283046 !important;

        &.active {
          background-color: rgba(37, 99, 235, 0.2) !important;
          color: #60a5fa !important;
          border-color: #3b82f6 !important;
        }
      }

      .filter-chip-btn {
        background-color: #171b26 !important;
        border-color: #283046 !important;
        color: #cbd5e1 !important;

        .chip-icon {
          color: #fbbf24 !important;
        }

        .badge-vencer {
          background-color: #1e2433 !important;
          color: #94a3b8 !important;
        }

        &:hover {
          background-color: #1e2433 !important;
          border-color: #3b82f6 !important;
          color: #ffffff !important;
        }

        &.active-vencer {
          background-color: rgba(225, 29, 72, 0.2) !important;
          border-color: #e11d48 !important;
          color: #fda4af !important;

          .chip-icon {
            color: #fb7185 !important;
          }

          .badge-vencer {
            background-color: #e11d48 !important;
            color: #ffffff !important;
          }
        }
      }

      .filter-action-btn {
        background-color: #171b26 !important;
        border-color: #283046 !important;
        color: #cbd5e1 !important;

        .mat-icon {
          color: #94a3b8 !important;
        }

        &:hover {
          background-color: #1e2433 !important;
          border-color: #3b82f6 !important;
          color: #ffffff !important;
        }

        &.btn-reset {
          background-color: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.35) !important;
          color: #f87171 !important;

          .mat-icon {
            color: #f87171 !important;
          }

          &:hover {
            background-color: rgba(239, 68, 68, 0.25) !important;
          }
        }
      }

      /* INPUTS & SELECTS MATERIAL EN DARK */
      ::ng-deep {
        .search-field, .filter-select {
          .mat-mdc-text-field-wrapper {
            background-color: #171b26 !important;
            border-radius: 8px !important;
          }

          .mat-mdc-select-value-text, input.mat-mdc-input-element {
            color: #f8fafc !important;
          }

          .mat-mdc-floating-label {
            color: #94a3b8 !important;
          }

          .search-icon, .mat-mdc-select-arrow {
            color: #94a3b8 !important;
          }

          .clear-input-btn .mat-icon {
            color: #64748b !important;
            &:hover { color: #cbd5e1 !important; }
          }

          .mdc-notched-outline__leading,
          .mdc-notched-outline__notch,
          .mdc-notched-outline__trailing {
            border-color: #283046 !important;
          }

          &:hover {
            .mdc-notched-outline__leading,
            .mdc-notched-outline__notch,
            .mdc-notched-outline__trailing {
              border-color: #3b82f6 !important;
            }
          }

          &.mat-focused {
            .mdc-notched-outline__leading,
            .mdc-notched-outline__notch,
            .mdc-notched-outline__trailing {
              border-color: #3b82f6 !important;
            }
            .mat-mdc-floating-label {
              color: #60a5fa !important;
            }
          }
        }

        .mat-mdc-paginator {
          background-color: #131722 !important;
          color: #94a3b8 !important;
          border-top: 1px solid #1e2433 !important;

          .mat-mdc-paginator-range-label,
          .mat-mdc-paginator-page-size-label,
          .mat-mdc-select-value-text,
          .mat-mdc-paginator-navigation-previous,
          .mat-mdc-paginator-navigation-next,
          .mat-mdc-paginator-icon {
            color: #94a3b8 !important;
            fill: #94a3b8 !important;
          }
        }

        .mat-mdc-menu-panel {
          background-color: #111622 !important;
          border: 1px solid #1e2433 !important;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6) !important;

          .mat-mdc-menu-item {
            color: #cbd5e1 !important;

            .mat-icon {
              color: #94a3b8 !important;
            }

            &:hover {
              background-color: #171b26 !important;
              color: #ffffff !important;
            }
          }

          .columns-menu-header {
            color: #f8fafc !important;
            span { font-weight: 700; }
          }

          .mat-divider {
            border-top-color: #1e2433 !important;
          }

          .mat-mdc-checkbox label {
            color: #cbd5e1 !important;
          }
        }
      }

      /* BANNER DE SELECCIÓN MÚLTIPLE EN DARK */
      .selection-banner {
        background: linear-gradient(135deg, #07152f 0%, #0b1f44 100%) !important;
        border: 1px solid #2563eb !important;
        color: #93c5fd !important;
        box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25) !important;

        .banner-info {
          .banner-icon {
            color: #60a5fa !important;
          }
          strong {
            color: #ffffff !important;
          }
        }

        .btn-clear-selection {
          color: #93c5fd !important;
          &:hover {
            background-color: rgba(37, 99, 235, 0.2) !important;
          }
        }
      }

      /* TABLA PRINCIPAL EN DARK */
      .table-card {
        background-color: #111622 !important;
        border: 1px solid #1e2433 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      }

      .custom-table {
        background-color: #111622 !important;
        color: #cbd5e1 !important;

        th {
          background-color: #131722 !important;
          color: #94a3b8 !important;
          border-bottom: 2px solid #1e2433 !important;

          &.sortable-th {
            &:hover {
              background-color: #171b26 !important;
              color: #60a5fa !important;
            }

            .sort-icon {
              color: #60a5fa !important;
            }
          }

          &:first-child, &:last-child {
            background-color: #131722 !important;
            box-shadow: 2px 0 6px -2px rgba(0, 0, 0, 0.5) !important;
          }
        }

        td {
          background-color: #111622 !important;
          border-bottom: 1px solid #171b26 !important;
          color: #cbd5e1 !important;

          &:first-child, &:last-child {
            background-color: #111622 !important;
            box-shadow: 2px 0 6px -2px rgba(0, 0, 0, 0.5) !important;
          }
        }

        tr:hover td,
        tr:hover td:first-child,
        tr:hover td:last-child {
          background-color: #171b26 !important;
          color: #ffffff !important;
        }

        tr.selected-row td,
        tr.selected-row td:first-child,
        tr.selected-row td:last-child {
          background-color: rgba(37, 99, 235, 0.2) !important;
          color: #93c5fd !important;
        }
      }

      .th-actions-icon-col .th-actions-icon {
        color: #94a3b8 !important;
      }

      /* CELDAS Y DETALLES EN DARK */
      .bold-text {
        color: #f8fafc !important;
      }

      .bold-text.color-primary {
        color: #60a5fa !important;
      }

      .ruc-container .empresa-hint-text {
        color: #cbd5e1 !important;
      }

      .ruc-badge {
        background-color: rgba(37, 99, 235, 0.18) !important;
        color: #93c5fd !important;
        border: 1px solid rgba(37, 99, 235, 0.35) !important;
      }

      .siglas-badge {
        background-color: #171b26 !important;
        color: #cbd5e1 !important;
        border-color: #283046 !important;
      }

      /* BADGES DE ESTADO LEGAL EN DARK */
      .status-pill {
        &.status-vigente {
          background-color: rgba(16, 185, 129, 0.18) !important;
          color: #34d399 !important;
          border: 1px solid rgba(16, 185, 129, 0.35) !important;
        }
        &.status-suspendida {
          background-color: rgba(245, 158, 11, 0.18) !important;
          color: #fbbf24 !important;
          border: 1px solid rgba(245, 158, 11, 0.35) !important;
        }
        &.status-cancelada, &.status-anulada {
          background-color: rgba(239, 68, 68, 0.18) !important;
          color: #f87171 !important;
          border: 1px solid rgba(239, 68, 68, 0.35) !important;
        }
        &.status-vencida {
          background-color: rgba(220, 38, 38, 0.22) !important;
          color: #fca5a5 !important;
          border: 1px solid rgba(220, 38, 38, 0.45) !important;
        }
        &.status-por-vencer {
          background-color: rgba(234, 88, 12, 0.2) !important;
          color: #fb923c !important;
          border: 1px solid rgba(234, 88, 12, 0.4) !important;
        }
      }

      .fecha-fin-container {
        .por-vencer-hint {
          background-color: rgba(234, 88, 12, 0.2) !important;
          color: #fb923c !important;
          border-color: rgba(234, 88, 12, 0.4) !important;
        }
        .text-por-vencer {
          color: #fb923c !important;
        }
      }

      .fecha-vencida-cell {
        background-color: rgba(220, 38, 38, 0.22) !important;
        color: #fca5a5 !important;
        border-color: rgba(220, 38, 38, 0.45) !important;

        .vencida-icon {
          color: #f87171 !important;
        }
      }

      .fecha-por-vencer-cell {
        background-color: rgba(234, 88, 12, 0.2) !important;
        color: #fb923c !important;
        border-color: rgba(234, 88, 12, 0.4) !important;

        .por-vencer-icon {
          color: #fb923c !important;
        }
      }

      .fecha-vigente-cell {
        color: #f8fafc !important;
      }

      .obs-text {
        color: #94a3b8 !important;
      }

      .badge-eficacia {
        background-color: #2563eb !important;
        color: #ffffff !important;
      }

      .badge-no {
        color: #64748b !important;
      }

      .badge-count {
        &.badge-errata {
          background-color: rgba(217, 119, 6, 0.2) !important;
          color: #fcd34d !important;
          border: 1px solid rgba(217, 119, 6, 0.35) !important;
        }
        &.badge-mod {
          background-color: rgba(3, 105, 161, 0.25) !important;
          color: #7dd3fc !important;
          border: 1px solid rgba(3, 105, 161, 0.35) !important;
        }
      }

      /* BADGES DE MODALIDAD EN DARK */
      .tipo-badge {
        &.badge-pasajeros {
          background-color: rgba(99, 102, 241, 0.2) !important;
          color: #a5b4fc !important;
          border-color: rgba(99, 102, 241, 0.35) !important;
        }
        &.badge-turismo {
          background-color: rgba(168, 85, 247, 0.2) !important;
          color: #d8b4fe !important;
          border-color: rgba(168, 85, 247, 0.35) !important;
        }
        &.badge-carga {
          background-color: rgba(245, 158, 11, 0.2) !important;
          color: #fcd34d !important;
          border-color: rgba(245, 158, 11, 0.35) !important;
        }
        &.badge-trabajadores {
          background-color: rgba(16, 185, 129, 0.2) !important;
          color: #6ee7b7 !important;
          border-color: rgba(16, 185, 129, 0.35) !important;
        }
      }

      .drive-link {
        color: #60a5fa !important;
        &:hover { color: #93c5fd !important; }
      }

      /* EMPTY STATE & LOADING EN DARK */
      .empty-state {
        background-color: #111622 !important;
        border: 1px solid #1e2433 !important;
        color: #f8fafc !important;

        .empty-icon {
          color: #475569 !important;
        }

        h3 {
          color: #f8fafc !important;
        }

        p {
          color: #94a3b8 !important;
        }
      }

      .loading-container {
        color: #94a3b8 !important;
      }

      /* FORM & DETAIL CARDS EN DARK */
      .form-card, .detail-card {
        background-color: #111622 !important;
        border-color: #1e2433 !important;
        color: #f8fafc !important;

        mat-card-title {
          color: #f8fafc !important;
        }

        .detail-item {
          color: #cbd5e1 !important;
          strong {
            color: #f8fafc !important;
          }
        }

        .sub-section {
          background-color: #171b26 !important;
          border: 1px solid #1e2433 !important;

          h3 {
            color: #f8fafc !important;
          }

          .sin-datos {
            color: #64748b !important;
          }

          .sub-list li {
            color: #cbd5e1 !important;
            strong { color: #f8fafc !important; }
          }
        }

        .primigenia-form ::ng-deep {
          .mat-mdc-text-field-wrapper {
            background-color: #171b26 !important;
          }

          .mat-mdc-select-value-text, input.mat-mdc-input-element, textarea.mat-mdc-input-element {
            color: #f8fafc !important;
          }

          input[type="date"] {
            color-scheme: dark;
          }

          .mat-mdc-floating-label {
            color: #94a3b8 !important;
          }

          .mdc-notched-outline__leading,
          .mdc-notched-outline__notch,
          .mdc-notched-outline__trailing {
            border-color: #283046 !important;
          }

          &:hover {
            .mdc-notched-outline__leading,
            .mdc-notched-outline__notch,
            .mdc-notched-outline__trailing {
              border-color: #3b82f6 !important;
            }
          }
        }
      }
    }
  `]
})
export class ResolucionesPrimigeniasComponent implements OnInit {
  private service = inject(ResolucionPrimigeniaService);
  private empresaService = inject(EmpresaService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Signals
  isLoading = signal(false);
  resoluciones = signal<ResolucionPrimigenia[]>([]);
  empresasMap = signal<Map<string, string>>(new Map());
  pageSize = signal(10);
  currentPage = signal(0);
  filtroPorVencer30 = signal<boolean>(false);
  showMobileFilters = signal<boolean>(false);

  // Signals para Selección Múltiple
  selectedIds = signal<Set<string>>(new Set());

  selectedCount = computed(() => this.selectedIds().size);

  isAllSelected = computed(() => {
    const filtradas = this.resolucionesFiltradas();
    if (filtradas.length === 0) return false;
    const set = this.selectedIds();
    return filtradas.every(r => set.has(r.id));
  });

  isSomeSelected = computed(() => {
    const filtradas = this.resolucionesFiltradas();
    if (filtradas.length === 0) return false;
    const set = this.selectedIds();
    const count = filtradas.filter(r => set.has(r.id)).length;
    return count > 0 && count < filtradas.length;
  });

  selectedResoluciones = computed(() => {
    const set = this.selectedIds();
    return this.resoluciones().filter(r => set.has(r.id));
  });

  toggleSelectAll(): void {
    const filtradas = this.resolucionesFiltradas();
    const currentSet = new Set(this.selectedIds());
    if (this.isAllSelected()) {
      filtradas.forEach(r => currentSet.delete(r.id));
    } else {
      filtradas.forEach(r => currentSet.add(r.id));
    }
    this.selectedIds.set(currentSet);
  }

  toggleSelectRow(id: string): void {
    const currentSet = new Set(this.selectedIds());
    if (currentSet.has(id)) {
      currentSet.delete(id);
    } else {
      currentSet.add(id);
    }
    this.selectedIds.set(currentSet);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  async exportarAExcel(modo: 'seleccionadas' | 'filtradas' | 'todas' = 'seleccionadas'): Promise<void> {
    let dataToExport: ResolucionPrimigenia[] = [];
    let filename = 'resoluciones_primigenias.xlsx';

    if (modo === 'seleccionadas') {
      dataToExport = this.selectedResoluciones();
      if (dataToExport.length === 0) {
        this.snackBar.open('No hay resoluciones seleccionadas para exportar', 'Cerrar', { duration: 3000 });
        return;
      }
      filename = `resoluciones_primigenias_seleccionadas_${Date.now()}.xlsx`;
    } else if (modo === 'filtradas') {
      dataToExport = this.resolucionesFiltradas();
      if (dataToExport.length === 0) {
        this.snackBar.open('No hay resoluciones filtradas para exportar', 'Cerrar', { duration: 3000 });
        return;
      }
      filename = `resoluciones_primigenias_filtradas_${Date.now()}.xlsx`;
    } else {
      dataToExport = this.resoluciones();
      if (dataToExport.length === 0) {
        this.snackBar.open('No hay resoluciones para exportar', 'Cerrar', { duration: 3000 });
        return;
      }
      filename = `resoluciones_primigenias_todas_${Date.now()}.xlsx`;
    }

    try {
      const XLSX = await import('xlsx');

      // Mapeo completo de columnas disponibles para Excel
      const columnasExcelMap: { [key: string]: { header: string, width: number, getValue: (r: ResolucionPrimigenia) => any } } = {
        'nro_resolucion': {
          header: 'N° Resolución',
          width: 18,
          getValue: (r) => r.nro_resolucion || ''
        },
        'siglas': {
          header: 'Siglas Organismo',
          width: 16,
          getValue: (r) => r.siglas || ''
        },
        'ruc_empresa': {
          header: 'RUC Empresa',
          width: 15,
          getValue: (r) => r.ruc_empresa || ''
        },
        'empresa_nombre': {
          header: 'Razón Social Empresa',
          width: 45,
          getValue: (r) => this.getNombreEmpresaCompleto(r.ruc_empresa) || this.getNombreEmpresa(r.ruc_empresa) || ''
        },
        'tipo_autorizacion': {
          header: 'Modalidad / Servicio',
          width: 22,
          getValue: (r) => r.tipo_autorizacion || ''
        },
        'fecha_resolucion': {
          header: 'Fecha Emisión',
          width: 14,
          getValue: (r) => r.fecha_resolucion ? new Date(r.fecha_resolucion).toLocaleDateString('es-PE') : ''
        },
        'fecha_inicio_vigencia': {
          header: 'Fecha Inicio Vigencia',
          width: 14,
          getValue: (r) => r.fecha_inicio_vigencia ? new Date(r.fecha_inicio_vigencia).toLocaleDateString('es-PE') : ''
        },
        'anios_vigencia': {
          header: 'Años Vigencia',
          width: 12,
          getValue: (r) => r.anios_vigencia || 10
        },
        'fecha_fin_vigencia': {
          header: 'Fecha Fin Vigencia',
          width: 14,
          getValue: (r) => r.fecha_fin_vigencia ? new Date(r.fecha_fin_vigencia).toLocaleDateString('es-PE') : ''
        },
        'estado': {
          header: 'Estado Legal',
          width: 14,
          getValue: (r) => this.getEstadoEfectivo(r)
        },
        'tiene_eficacia_anticipada': {
          header: 'Eficacia Anticipada',
          width: 14,
          getValue: (r) => r.tiene_eficacia_anticipada ? 'SÍ' : 'NO'
        },
        'fe_erratas': {
          header: 'Fe de Erratas',
          width: 30,
          getValue: (r) => (r.fe_erratas || []).map(fe => `${fe.numero_resolucion} (${fe.detalle_correccion})`).join('; ') || '-'
        },
        'historial_modificaciones': {
          header: 'Modificaciones Hijas',
          width: 30,
          getValue: (r) => (r.historial_modificaciones || []).map(m => `${m.nro_resolucion_hija} [${m.tipo_modificacion}]`).join('; ') || '-'
        },
        'observaciones': {
          header: 'Observaciones',
          width: 30,
          getValue: (r) => r.observaciones || ''
        },
        'link_documento': {
          header: 'Link Drive PDF',
          width: 35,
          getValue: (r) => r.link_documento || ''
        }
      };

      // Determinar qué columnas están actualmente visibles configuradas por el usuario
      const keysVisibles: string[] = [];

      this.columnasDisponibles.forEach(col => {
        if (col.key !== 'select' && col.key !== 'acciones' && this.columnaVisible(col.key)) {
          if (col.key === 'ruc_empresa') {
            keysVisibles.push('ruc_empresa');
            keysVisibles.push('empresa_nombre');
          } else if (columnasExcelMap[col.key]) {
            keysVisibles.push(col.key);
          }
        }
      });

      // Si por alguna razón ninguna columna está marcada, usar todas como respaldo
      const keysFinales = keysVisibles.length > 0 ? keysVisibles : Object.keys(columnasExcelMap);

      const rows = dataToExport.map(r => {
        const rowObj: { [header: string]: any } = {};
        keysFinales.forEach(k => {
          const colDef = columnasExcelMap[k];
          if (colDef) {
            rowObj[colDef.header] = colDef.getValue(r);
          }
        });
        return rowObj;
      });

      const ws = XLSX.utils.json_to_sheet(rows);

      const colWidths = keysFinales.map(k => ({ wch: columnasExcelMap[k]?.width || 15 }));
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Resoluciones_Primigenias');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      this.snackBar.open(`✅ Excel exportado con ${keysFinales.length} columnas visibles (${rows.length} registros)`, 'Cerrar', { duration: 4000 });
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      this.snackBar.open('Error al generar el archivo Excel', 'Cerrar', { duration: 4000 });
    }
  }

  // Modales
  showFormModal = signal(false);
  showCargaMasivaModal = signal(false);
  selectedForEdit = signal<ResolucionPrimigenia | null>(null);
  selectedForFeErrata = signal<ResolucionPrimigenia | null>(null);
  selectedForDetail = signal<ResolucionPrimigenia | null>(null);

  private googleSheetsService = inject(GoogleSheetsService);
  googleSheetsUrl = this.fb.control('');

  // Form Controls para Filtros
  searchControl = this.fb.control('');
  estadoControl = this.fb.control('');
  tipoAutorizacionControl = this.fb.control('');

  // Signals derivados para reactividad en computed()
  searchFilter = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  estadoFilter = toSignal(this.estadoControl.valueChanges, { initialValue: '' });
  tipoAutorizacionFilter = toSignal(this.tipoAutorizacionControl.valueChanges, { initialValue: '' });

  // Form Group para Creación
  primigeniaForm: FormGroup = this.fb.group({
    ruc_empresa: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    nro_resolucion: ['', Validators.required],
    siglas: [''],
    fecha_resolucion: ['', Validators.required],
    fecha_inicio_vigencia: ['', Validators.required],
    anios_vigencia: [10, Validators.required],
    tipo_autorizacion: ['PASAJEROS', Validators.required],
    link_documento: [''],
    expedientes_codigos: [''],
    observaciones: ['']
  });

  // Form Group para Edición
  editForm: FormGroup = this.fb.group({
    nro_resolucion: ['', Validators.required],
    siglas: [''],
    estado: ['VIGENTE', Validators.required],
    fecha_resolucion: ['', Validators.required],
    fecha_inicio_vigencia: ['', Validators.required],
    anios_vigencia: [10, Validators.required],
    tipo_autorizacion: ['PASAJEROS', Validators.required],
    link_documento: [''],
    observaciones: ['']
  });

  // Form Group para Fe de Errata
  feErrataForm: FormGroup = this.fb.group({
    numero_resolucion: ['', Validators.required],
    fecha_emision: ['', Validators.required],
    detalle_correccion: ['', Validators.required],
    documento_link: ['']
  });

  // Computed Signal de Datos Filtrados
  resolucionesFiltradas = computed(() => {
    const search = (this.searchFilter() || '').toLowerCase().trim();
    const estado = (this.estadoFilter() || '').toUpperCase().trim();
    const tipo = (this.tipoAutorizacionFilter() || '').toUpperCase().trim();
    const soloPorVencer = this.filtroPorVencer30();

    return this.resoluciones().filter(r => {
      const ruc = (r.ruc_empresa || '').toLowerCase();
      const nro = (r.nro_resolucion || '').toLowerCase();
      const sig = (r.siglas || '').toLowerCase();
      const obs = (r.observaciones || '').toLowerCase();
      const nomEmp = (this.getNombreEmpresa(r.ruc_empresa) || '').toLowerCase();
      const exps = (r.expedientes_codigos || []).map(e => e.toLowerCase());

      const matchSearch = !search || 
        ruc.includes(search) || 
        nro.includes(search) ||
        sig.includes(search) ||
        obs.includes(search) ||
        nomEmp.includes(search) ||
        exps.some(e => e.includes(search));

      const estEfectivo = this.getEstadoEfectivo(r);
      const matchEstado = !estado || estEfectivo === estado;

      let matchTipo = true;
      if (tipo) {
        const rTipo = (r.tipo_autorizacion || '').toUpperCase().trim();
        if (tipo === 'PASAJEROS' || tipo === 'PERSONAS') {
          matchTipo = ['PASAJEROS', 'PERSONAS', 'REGULAR', 'RENOVACION', 'AUTORIZACION'].includes(rTipo) || 
                      rTipo.includes('PASAJ') || rTipo.includes('PERSON');
        } else if (tipo === 'TURISMO') {
          matchTipo = rTipo === 'TURISMO' || rTipo.includes('TURIS');
        } else if (tipo === 'CARGA') {
          matchTipo = rTipo === 'CARGA' || rTipo.includes('CARGA') || rTipo.includes('MERCANC');
        } else if (tipo === 'TRABAJADORES') {
          matchTipo = rTipo === 'TRABAJADORES' || rTipo.includes('TRABAJ') || rTipo.includes('PERSONAL');
        } else {
          matchTipo = rTipo === tipo || rTipo.includes(tipo);
        }
      }

      const matchPorVencer = !soloPorVencer || this.esPorVencer30Dias(r.fecha_fin_vigencia, r.estado);

      return matchSearch && matchEstado && matchTipo && matchPorVencer;
    });
  });

  conteoPorVencer30 = computed(() => {
    return this.resoluciones().filter(r => this.esPorVencer30Dias(r.fecha_fin_vigencia, r.estado)).length;
  });

  // KPI Metrics (Stitch GovTech Sentinel)
  totalResoluciones = computed(() => this.resoluciones().length);
  totalVigentes = computed(() => this.resoluciones().filter(r => this.getEstadoEfectivo(r) === 'VIGENTE').length);
  totalPorVencer = computed(() => this.conteoPorVencer30());
  totalCriticas = computed(() => this.resoluciones().filter(r => ['VENCIDA', 'CANCELADA', 'SUSPENDIDA', 'ANULADA'].includes(this.getEstadoEfectivo(r))).length);
  totalEmpresasTitulares = computed(() => new Set(this.resoluciones().map(r => r.ruc_empresa).filter(Boolean)).size);

  // Signals para Ordenamiento por Columna
  sortColumn = signal<string>('nro_resolucion');
  sortDirection = signal<'asc' | 'desc'>('asc');

  toggleSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // Computed Signal de Datos Ordenados
  resolucionesOrdenadas = computed(() => {
    const list = [...this.resolucionesFiltradas()];
    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    return list.sort((a, b) => {
      let valA: any = (a as any)[col];
      let valB: any = (b as any)[col];

      if (col === 'fe_erratas') {
        valA = a.fe_erratas?.length || 0;
        valB = b.fe_erratas?.length || 0;
      } else if (col === 'historial_modificaciones') {
        valA = a.historial_modificaciones?.length || 0;
        valB = b.historial_modificaciones?.length || 0;
      } else if (col === 'fecha_resolucion' || col === 'fecha_inicio_vigencia' || col === 'fecha_fin_vigencia') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      } else if (typeof valA === 'string') {
        return valA.localeCompare(valB || '', 'es', { numeric: true }) * dir;
      }

      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  });

  // Computed Signal de Datos Paginados
  paginatedResoluciones = computed(() => {
    const list = this.resolucionesOrdenadas();
    const startIndex = this.currentPage() * this.pageSize();
    return list.slice(startIndex, startIndex + this.pageSize());
  });

  getEstadoEfectivo(r: ResolucionPrimigenia): string {
    if (this.esFechaVencida(r.fecha_fin_vigencia, r.estado)) {
      return 'VENCIDA';
    }
    return (r.estado || 'VIGENTE').toUpperCase();
  }

  esFechaVencida(fecha: Date | string | undefined | null, estado?: string): boolean {
    if (!fecha) return false;
    if (estado) {
      const est = estado.toUpperCase();
      if (est === 'CANCELADA' || est === 'SUSPENDIDA' || est === 'ANULADA') {
        return false;
      }
    }
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return d < hoy;
  }

  esPorVencer30Dias(fecha: Date | string | undefined | null, estado?: string): boolean {
    if (!fecha) return false;
    if (estado) {
      const est = estado.toUpperCase();
      if (est === 'CANCELADA' || est === 'SUSPENDIDA' || est === 'ANULADA') {
        return false;
      }
    }
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return false;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const en30Dias = new Date(hoy);
    en30Dias.setDate(hoy.getDate() + 30);

    return d >= hoy && d <= en30Dias;
  }

  diasParaVencer(fecha: Date | string | undefined | null): number {
    if (!fecha) return 0;
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return 0;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diffMs = d.getTime() - hoy.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  toggleFiltroPorVencer(): void {
    this.filtroPorVencer30.update(v => !v);
    this.currentPage.set(0);
  }

  getNombreEmpresa(ruc: string): string {
    if (!ruc) return '';
    const raw = this.empresasMap().get(ruc.trim()) || '';
    return this.simplificarNombreEmpresa(raw);
  }

  getNombreEmpresaCompleto(ruc: string): string {
    if (!ruc) return '';
    return this.empresasMap().get(ruc.trim()) || '';
  }

  simplificarNombreEmpresa(nombre: string): string {
    if (!nombre) return '';
    let res = nombre.trim();

    // Reemplazos de frases compuestas comunes
    res = res.replace(/\bEMPRESA\s+DE\s+TRANSPORTES\s+Y\s+SERVICIOS\s+MULTIPLES\b/gi, 'E.T.S.M.');
    res = res.replace(/\bEMPRESA\s+DE\s+TRANSPORTES\s+MULTIPLES\b/gi, 'E.T.M.');
    res = res.replace(/\bEMPRESA\s+DE\s+TRANSPORTES\b/gi, 'E.T.');
    res = res.replace(/\bEMPRESA\s+DE\s+TRANSPORTE\b/gi, 'E.T.');
    res = res.replace(/\bCOOPERATIVA\s+DE\s+TRANSPORTES\b/gi, 'COOP. T.');
    res = res.replace(/\bCOOPERATIVA\s+DE\s+TRANSPORTE\b/gi, 'COOP. T.');
    res = res.replace(/\bSERVICIOS\s+MULTIPLES\b/gi, 'SERV. MULT.');
    res = res.replace(/\bSERVICIOS\s+TURISTICOS\b/gi, 'SERV. TUR.');
    res = res.replace(/\bSOCIEDAD\s+ANONIMA\s+CERRADA\b/gi, 'S.A.C.');
    res = res.replace(/\bSOCIEDAD\s+DE\s+RESPONSABILIDAD\s+LIMITADA\b/gi, 'S.R.L.');
    res = res.replace(/\bSOCIEDAD\s+ANONIMA\b/gi, 'S.A.');
    res = res.replace(/\bEMPRESA\s+INDIVIDUAL\s+DE\s+RESPONSABILIDAD\s+LIMITADA\b/gi, 'E.I.R.L.');

    // Reemplazos de palabras individuales frecuentes
    res = res.replace(/\bEMPRESA\b/gi, 'E.');
    res = res.replace(/\bTRANSPORTES\b/gi, 'T.');
    res = res.replace(/\bTRANSPORTE\b/gi, 'T.');
    res = res.replace(/\bCOOPERATIVA\b/gi, 'COOP.');
    res = res.replace(/\bINTERREGIONAL\b/gi, 'INTERREG.');
    res = res.replace(/\bINTERNACIONAL\b/gi, 'INT.');
    res = res.replace(/\bMULTISERVICIOS\b/gi, 'MULTISERV.');
    res = res.replace(/\bSERVICIOS\b/gi, 'SERV.');
    res = res.replace(/\bTURISTICO\b/gi, 'TUR.');
    res = res.replace(/\bTURISTICA\b/gi, 'TUR.');
    res = res.replace(/\bTURISMO\b/gi, 'TUR.');
    res = res.replace(/\bASOCIACION\b/gi, 'ASOC.');

    return res.replace(/\s+/g, ' ').trim();
  }

  // Configuración de Columnas Disponibles
  columnasDisponibles = [
    { key: 'select', label: 'Seleccionar (☑)', required: true },
    { key: 'nro_resolucion', label: 'N° Resolución', required: true },
    { key: 'siglas', label: 'Siglas Organismo', required: false },
    { key: 'ruc_empresa', label: 'RUC Empresa', required: false },
    { key: 'tipo_autorizacion', label: 'Modalidad de Servicio', required: false },
    { key: 'fecha_resolucion', label: 'F. Emisión', required: false },
    { key: 'fecha_inicio_vigencia', label: 'F. Vigencia Inicio', required: false },
    { key: 'anios_vigencia', label: 'Vigencia (Años)', required: false },
    { key: 'fecha_fin_vigencia', label: 'F. Fin Vigencia', required: false },
    { key: 'estado', label: 'Estado Legal', required: false },
    { key: 'tiene_eficacia_anticipada', label: 'Eficacia Ant.', required: false },
    { key: 'fe_erratas', label: 'Fe de Erratas', required: false },
    { key: 'historial_modificaciones', label: 'Modificaciones', required: false },
    { key: 'observaciones', label: 'Observaciones', required: false },
    { key: 'link_documento', label: 'Drive PDF', required: false },
    { key: 'acciones', label: 'Acciones (⋮)', required: true }
  ];

  // 'siglas' NO está incluida por defecto aquí para que quede desactivada inicialmente
  columnasVisiblesState = signal<string[]>([
    'select',
    'nro_resolucion',
    'ruc_empresa',
    'tipo_autorizacion',
    'fecha_resolucion',
    'fecha_inicio_vigencia',
    'anios_vigencia',
    'fecha_fin_vigencia',
    'estado',
    'tiene_eficacia_anticipada',
    'fe_erratas',
    'historial_modificaciones',
    'observaciones',
    'link_documento',
    'acciones'
  ]);

  columnaVisible(key: string): boolean {
    if (key === 'select' || key === 'nro_resolucion' || key === 'acciones') return true;
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
      localStorage.setItem('resoluciones-primigenias-cols', JSON.stringify(this.columnasVisiblesState()));
    } catch (e) {}
  }

  private cargarPreferenciasColumnas(): void {
    try {
      const saved = localStorage.getItem('resoluciones-primigenias-cols');
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

    // Reiniciar a la primera página al cambiar cualquier filtro
    this.searchControl.valueChanges.subscribe(() => this.currentPage.set(0));
    this.estadoControl.valueChanges.subscribe(() => this.currentPage.set(0));
    this.tipoAutorizacionControl.valueChanges.subscribe(() => this.currentPage.set(0));
  }

  irACargaMasiva(): void {
    this.router.navigate(['/resoluciones-primigenias/carga-masiva']);
  }

  cargarResoluciones(): void {
    this.isLoading.set(true);
    this.service.getResolucionesPrimigenias().subscribe({
      next: (data) => {
        this.resoluciones.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando resoluciones primigenias:', err);
        this.snackBar.open('Error al cargar resoluciones primigenias', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });

    this.empresaService.getEmpresas(0, 1000).subscribe({
      next: (empresas) => {
        const map = new Map<string, string>();
        empresas.forEach(e => {
          if (e.ruc) {
            const nombre = typeof e.razonSocial === 'string' ? e.razonSocial : (e.razonSocial?.principal || '');
            map.set(e.ruc.trim(), nombre);
          }
        });
        this.empresasMap.set(map);
      },
      error: () => {}
    });
  }

  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.estadoControl.setValue('');
    this.tipoAutorizacionControl.setValue('');
    this.filtroPorVencer30.set(false);
    this.clearSelection();
    this.currentPage.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  toggleFormModal(): void {
    this.selectedForEdit.set(null);
    this.selectedForFeErrata.set(null);
    this.selectedForDetail.set(null);
    this.showFormModal.update(v => !v);
  }

  // ACCIONES DEL MENÚ DE 3 PUNTOS
  verDetalleModal(item: ResolucionPrimigenia): void {
    this.selectedForDetail.set(item);
  }

  cerrarDetalle(): void {
    this.selectedForDetail.set(null);
  }

  editarResolucionModal(item: ResolucionPrimigenia): void {
    this.selectedForDetail.set(null);
    this.selectedForFeErrata.set(null);
    this.showFormModal.set(false);

    const fRes = item.fecha_resolucion ? new Date(item.fecha_resolucion).toISOString().substring(0, 10) : '';
    const fIni = item.fecha_inicio_vigencia ? new Date(item.fecha_inicio_vigencia).toISOString().substring(0, 10) : '';

    let normTipo = (item.tipo_autorizacion || 'PASAJEROS').toUpperCase().trim();
    if (['PERSONAS', 'REGULAR', 'RENOVACION', 'AUTORIZACION'].includes(normTipo) || normTipo.includes('PASAJ') || normTipo.includes('PERSON')) {
      normTipo = 'PASAJEROS';
    } else if (normTipo.includes('TURIS')) {
      normTipo = 'TURISMO';
    } else if (normTipo.includes('CARGA')) {
      normTipo = 'CARGA';
    } else if (normTipo.includes('TRABAJ') || normTipo.includes('PERSONAL')) {
      normTipo = 'TRABAJADORES';
    }

    this.editForm.patchValue({
      nro_resolucion: item.nro_resolucion,
      siglas: item.siglas || '',
      estado: item.estado,
      fecha_resolucion: fRes,
      fecha_inicio_vigencia: fIni,
      anios_vigencia: item.anios_vigencia || 10,
      tipo_autorizacion: normTipo,
      link_documento: item.link_documento || '',
      observaciones: item.observaciones || ''
    });

    this.selectedForEdit.set(item);
  }

  cancelarEdicion(): void {
    this.selectedForEdit.set(null);
  }

  actualizarResolucion(): void {
    const item = this.selectedForEdit();
    if (!item || this.editForm.invalid) return;

    this.isLoading.set(true);
    const val = this.editForm.value;

    const dto: ResolucionPrimigeniaUpdate = {
      nro_resolucion: this.normalizarNroResolucion(val.nro_resolucion),
      siglas: val.siglas || undefined,
      estado: val.estado,
      fecha_resolucion: val.fecha_resolucion,
      fecha_inicio_vigencia: val.fecha_inicio_vigencia,
      anios_vigencia: val.anios_vigencia,
      tipo_autorizacion: val.tipo_autorizacion,
      link_documento: val.link_documento || undefined,
      observaciones: val.observaciones || undefined
    };

    this.service.updateResolucionPrimigenia(item.id, dto).subscribe({
      next: () => {
        this.snackBar.open('Resolución Primigenia actualizada', 'Cerrar', { duration: 3000 });
        this.selectedForEdit.set(null);
        this.cargarResoluciones();
      },
      error: (err) => {
        console.error('Error al actualizar:', err);
        this.snackBar.open('Error al actualizar la resolución primigenia', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  abrirModalFeErrata(item: ResolucionPrimigenia): void {
    this.selectedForDetail.set(null);
    this.selectedForEdit.set(null);
    this.showFormModal.set(false);

    this.feErrataForm.reset({
      numero_resolucion: '',
      fecha_emision: new Date().toISOString().substring(0, 10),
      detalle_correccion: '',
      documento_link: ''
    });

    this.selectedForFeErrata.set(item);
  }

  cancelarFeErrata(): void {
    this.selectedForFeErrata.set(null);
  }

  guardarFeErrata(): void {
    const item = this.selectedForFeErrata();
    if (!item || this.feErrataForm.invalid) return;

    this.isLoading.set(true);
    const val = this.feErrataForm.value;

    const feData: FeErrata = {
      numero_resolucion: val.numero_resolucion,
      fecha_emision: val.fecha_emision,
      detalle_correccion: val.detalle_correccion,
      documento_link: val.documento_link || undefined
    };

    this.service.agregarFeErrata(item.id, feData).subscribe({
      next: () => {
        this.snackBar.open('Fe de Errata registrada con éxito', 'Cerrar', { duration: 3000 });
        this.selectedForFeErrata.set(null);
        this.cargarResoluciones();
      },
      error: (err) => {
        console.error('Error al registrar fe de errata:', err);
        this.snackBar.open('Error al registrar la fe de errata', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  crearHijaVinculada(item: ResolucionPrimigenia): void {
    this.router.navigate(['/resoluciones-hijas'], {
      queryParams: {
        primigenia: item.nro_resolucion,
        ruc: item.ruc_empresa
      }
    });
  }

  normalizarNroResolucion(val?: string | null): string {
    if (!val) return '';
    let s = val.toString().trim().toUpperCase();
    if (!s || s === 'NAN') return '';

    s = s.replace(/^(RESOLUCIÓN|RESOLUCION|RES\.|RES-|R\.|R\s+)/i, 'R-');
    s = s.replace(/^(N°|Nº|N-)\s*/i, '');
    s = s.trim();

    const match = s.match(/^(?:R[-.\s]*)?0*(\d{1,6})[-/. ](\d{4})(?:[-/.]?.*)?$/);
    if (match) {
      const correlativo = parseInt(match[1], 10);
      const anio = match[2];
      const corrFmt = correlativo.toString().padStart(4, '0');
      return `R-${corrFmt}-${anio}`;
    }

    if (/^\d/.test(s)) {
      return `R-${s}`;
    }

    return s;
  }

  guardarResolucion(): void {
    if (this.primigeniaForm.invalid) return;

    this.isLoading.set(true);
    const formVal = this.primigeniaForm.value;
    const expRaw = formVal.expedientes_codigos || '';
    const expArray = expRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);

    const dto: ResolucionPrimigeniaCreate = {
      ruc_empresa: formVal.ruc_empresa,
      nro_resolucion: this.normalizarNroResolucion(formVal.nro_resolucion),
      siglas: formVal.siglas || undefined,
      fecha_resolucion: formVal.fecha_resolucion,
      fecha_inicio_vigencia: formVal.fecha_inicio_vigencia,
      anios_vigencia: formVal.anios_vigencia,
      tipo_autorizacion: formVal.tipo_autorizacion,
      link_documento: formVal.link_documento || undefined,
      expedientes_codigos: expArray,
      observaciones: formVal.observaciones || undefined
    };

    this.service.createResolucionPrimigenia(dto).subscribe({
      next: () => {
        this.snackBar.open('Resolución Primigenia registrada con éxito', 'Cerrar', { duration: 3000 });
        this.primigeniaForm.reset({ anios_vigencia: 10, tipo_autorizacion: 'PASAJEROS' });
        this.showFormModal.set(false);
        this.cargarResoluciones();
      },
      error: (err) => {
        console.error('Error al guardar resolución:', err);
        const msg = err.error?.detail || 'Error al guardar la resolución primigenia';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        this.isLoading.set(false);
      }
    });
  }

  eliminarResolucion(id: string): void {
    if (confirm('¿Desea desactivar esta resolución primigenia?')) {
      this.service.deleteResolucionPrimigenia(id).subscribe({
        next: () => {
          this.snackBar.open('Resolución primigenia eliminada', 'Cerrar', { duration: 3000 });
          this.cargarResoluciones();
        },
        error: (err) => {
          console.error('Error al eliminar resolución:', err);
          this.snackBar.open('Error al eliminar resolución', 'Cerrar', { duration: 3000 });
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
        a.download = 'plantilla_resoluciones_primigenias.xlsx';
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
    this.router.navigate(['/resoluciones-primigenias/carga-masiva']);
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
          let msg = `Carga masiva completada: ${creadas} resoluciones creadas.`;
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
        const file = new File([blob], `google_sheet_primigenias_${Date.now()}.csv`, { type: 'text/csv' });

        this.service.procesarCargaMasiva(file).subscribe({
          next: (res) => {
            const creadas = res.resultado?.creadas || 0;
            const errores = res.resultado?.errores || [];
            let msg = `✅ Importación desde Google Sheets exitosa: ${creadas} resoluciones creadas.`;
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

  esTipoTurismo(tipo?: string): boolean {
    return !!tipo && tipo.toUpperCase().includes('TURIS');
  }

  esTipoCarga(tipo?: string): boolean {
    if (!tipo) return false;
    const t = tipo.toUpperCase();
    return t.includes('CARGA') || t.includes('MERCANC');
  }

  esTipoTrabajadores(tipo?: string): boolean {
    if (!tipo) return false;
    const t = tipo.toUpperCase();
    return t.includes('TRABAJ') || t.includes('PERSONAL');
  }
}
