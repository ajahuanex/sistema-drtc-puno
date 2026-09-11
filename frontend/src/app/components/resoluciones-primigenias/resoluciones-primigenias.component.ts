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
          <button mat-raised-button color="accent" (click)="descargarPlantilla()" [disabled]="isLoading()">
            <mat-icon>file_download</mat-icon> Plantilla Excel
          </button>
          <button mat-raised-button color="accent" (click)="irACargaMasiva()" [disabled]="isLoading()">
            <mat-icon>file_upload</mat-icon> Carga Masiva
          </button>
          <button mat-raised-button class="btn-primary-custom" (click)="toggleFormModal()" [disabled]="isLoading()">
            <mat-icon>add_circle</mat-icon> Nueva Primigenia
          </button>
        </div>
      </div>

      <div class="content-section">
        <!-- Tarjeta de Filtros Modernizada -->
        <div class="glass-filters">
          <div class="filters-bar">
            <!-- Búsqueda rápida -->
            <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
              <mat-icon matPrefix class="search-icon">search</mat-icon>
              <input matInput [formControl]="searchControl" placeholder="Buscar por RUC, Razón Social o N° Resolución...">
              @if (searchControl.value) {
                <button mat-icon-button matSuffix (click)="searchControl.setValue('')" class="clear-input-btn" matTooltip="Limpiar búsqueda">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>

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
                <mat-option value="TURISMO">Turismo</mat-option>
                <mat-option value="PERSONAS">Pasajeros / Personas</mat-option>
                <mat-option value="CARGA">Carga y Mercancías</mat-option>
                <mat-option value="REGIONAL">Regional</mat-option>
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
                    <mat-label>Tipo Autorización</mat-label>
                    <mat-select formControlName="tipo_autorizacion">
                      <mat-option value="TURISMO">Turismo</mat-option>
                      <mat-option value="PERSONAS">Pasajeros / Personas</mat-option>
                      <mat-option value="CARGA">Carga y Mercancías</mat-option>
                      <mat-option value="REGIONAL">Regional</mat-option>
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
                    <mat-label>Tipo Autorización</mat-label>
                    <mat-select formControlName="tipo_autorizacion">
                      <mat-option value="TURISMO">Turismo</mat-option>
                      <mat-option value="PERSONAS">Pasajeros / Personas</mat-option>
                      <mat-option value="CARGA">Carga y Mercancías</mat-option>
                      <mat-option value="REGIONAL">Regional</mat-option>
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
          <mat-card class="table-card">
            <mat-card-content>
              <div class="table-container">
                <table class="custom-table">
                  <thead>
                    <tr>
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
                      <tr>
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
                          <td>{{ item.tipo_autorizacion }}</td>
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
                              <span [class]="'status-pill status-' + item.estado?.toLowerCase()">
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
        gap: 0.75rem;
      }
    }

    .btn-primary-custom {
      background-color: #6366f1 !important;
      color: white !important;
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

    .drive-link {
      color: #2563eb;
      &:hover { color: #1d4ed8; }
    }

    .sin-datos { color: #cbd5e1; }
    .text-center { text-align: center; }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
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
    tipo_autorizacion: ['TURISMO', Validators.required],
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
    tipo_autorizacion: ['TURISMO', Validators.required],
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
      const matchTipo = !tipo || (r.tipo_autorizacion || '').toUpperCase() === tipo;
      const matchPorVencer = !soloPorVencer || this.esPorVencer30Dias(r.fecha_fin_vigencia, r.estado);

      return matchSearch && matchEstado && matchTipo && matchPorVencer;
    });
  });

  conteoPorVencer30 = computed(() => {
    return this.resoluciones().filter(r => this.esPorVencer30Dias(r.fecha_fin_vigencia, r.estado)).length;
  });

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
    if (key === 'nro_resolucion' || key === 'acciones') return true;
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

    this.editForm.patchValue({
      nro_resolucion: item.nro_resolucion,
      siglas: item.siglas || '',
      estado: item.estado,
      fecha_resolucion: fRes,
      fecha_inicio_vigencia: fIni,
      anios_vigencia: item.anios_vigencia || 10,
      tipo_autorizacion: item.tipo_autorizacion,
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
      nro_resolucion: val.nro_resolucion,
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

  guardarResolucion(): void {
    if (this.primigeniaForm.invalid) return;

    this.isLoading.set(true);
    const formVal = this.primigeniaForm.value;
    const expRaw = formVal.expedientes_codigos || '';
    const expArray = expRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);

    const dto: ResolucionPrimigeniaCreate = {
      ruc_empresa: formVal.ruc_empresa,
      nro_resolucion: formVal.nro_resolucion,
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
        this.primigeniaForm.reset({ anios_vigencia: 10, tipo_autorizacion: 'TURISMO' });
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
}
