import { Component, OnInit, signal, computed, inject } from '@angular/core';
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
import { Router } from '@angular/router';

import { ResolucionPrimigeniaService } from '../../services/resolucion-primigenia.service';
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
    MatTabsModule
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
        <!-- Tarjeta de Filtros -->
        <mat-card class="filters-card">
          <mat-card-content>
            <div class="filters-row">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Buscar por RUC o N° Resolución</mat-label>
                <input matInput [formControl]="searchControl" placeholder="Ej: 20123456789 ó 0100-2021">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field">
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

              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Modalidad de Servicio</mat-label>
                <mat-select [formControl]="tipoAutorizacionControl">
                  <mat-option value="">Todas las Modalidades</mat-option>
                  <mat-option value="TURISMO">Turismo</mat-option>
                  <mat-option value="PERSONAS">Pasajeros / Personas</mat-option>
                  <mat-option value="CARGA">Carga y Mercancías</mat-option>
                  <mat-option value="REGIONAL">Regional</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-stroked-button (click)="limpiarFiltros()" class="btn-clear">
                <mat-icon>clear_all</mat-icon> Limpiar
              </button>
            </div>
          </mat-card-content>
        </mat-card>

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
                      <th>N° Resolución</th>
                      <th>RUC Empresa</th>
                      <th>Modalidad</th>
                      <th>F. Emisión</th>
                      <th>F. Vigencia Inicio</th>
                      <th>Vigencia</th>
                      <th>F. Fin Vigencia</th>
                      <th>Estado</th>
                      <th>Eficacia Ant.</th>
                      <th>Fe de Erratas</th>
                      <th>Modificaciones</th>
                      <th>Drive</th>
                      <th class="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of paginatedResoluciones(); track item.id) {
                      <tr>
                        <td class="bold-text color-primary">{{ item.nro_resolucion }}</td>
                        <td>
                          <span class="ruc-badge">{{ item.ruc_empresa }}</span>
                        </td>
                        <td>{{ item.tipo_autorizacion }}</td>
                        <td>{{ item.fecha_resolucion | date:'dd/MM/yyyy' }}</td>
                        <td>{{ item.fecha_inicio_vigencia | date:'dd/MM/yyyy' }}</td>
                        <td class="text-center">{{ item.anios_vigencia }} Años</td>
                        <td>{{ item.fecha_fin_vigencia | date:'dd/MM/yyyy' }}</td>
                        <td>
                          <span [class]="'status-pill status-' + item.estado?.toLowerCase()">
                            {{ item.estado }}
                          </span>
                        </td>
                        <td class="text-center">
                          @if (item.tiene_eficacia_anticipada) {
                            <span class="badge-eficacia" matTooltip="Vigencia surte efecto antes de la emisión">SÍ</span>
                          } @else {
                            <span class="badge-no">NO</span>
                          }
                        </td>
                        <td>
                          @if (item.fe_erratas && item.fe_erratas.length > 0) {
                            <span class="badge-count badge-errata" [matTooltip]="item.fe_erratas[0].detalle_correccion">
                              {{ item.fe_erratas.length }} Errata(s)
                            </span>
                          } @else {
                            <span class="sin-datos">-</span>
                          }
                        </td>
                        <td>
                          @if (item.historial_modificaciones && item.historial_modificaciones.length > 0) {
                            <span class="badge-count badge-mod" [matTooltip]="item.historial_modificaciones[0].tipo_modificacion">
                              {{ item.historial_modificaciones.length }} Mod.
                            </span>
                          } @else {
                            <span class="sin-datos">-</span>
                          }
                        </td>
                        <td class="text-center">
                          @if (item.link_documento) {
                            <a [href]="item.link_documento" target="_blank" class="drive-link" matTooltip="Abrir en Google Drive">
                              <mat-icon>open_in_new</mat-icon>
                            </a>
                          } @else {
                            <span class="sin-datos">-</span>
                          }
                        </td>
                        <!-- COLUMNA DE ACCIONES CON LOS 3 PUNTITOS (MAT-MENU) -->
                        <td class="text-center">
                          <button mat-icon-button [matMenuTriggerFor]="actionMenu" [matMenuTriggerData]="{ item: item }" matTooltip="Opciones de la Resolución">
                            <mat-icon>more_vert</mat-icon>
                          </button>
                        </td>
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

    .filters-card {
      margin-bottom: 1.5rem;
      border-radius: 12px;

      .filters-row {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;

        .search-field { flex: 1; min-width: 280px; }
        .filter-field { min-width: 200px; }
        .btn-clear { height: 54px; }
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
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;

      th {
        background-color: #f8fafc;
        color: #475569;
        font-weight: 600;
        padding: 0.85rem 1rem;
        border-bottom: 2px solid #e2e8f0;
        white-space: nowrap;
      }

      td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      tr:hover { background-color: #f8fafc; }
    }

    .bold-text { font-weight: 600; }
    .color-primary { color: #4338ca; }

    .ruc-badge {
      background-color: #e0e7ff;
      color: #3730a3;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-family: monospace;
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
      &.status-vencida { background-color: #f3f4f6; color: #4b5563; }
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
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Signals
  isLoading = signal(false);
  resoluciones = signal<ResolucionPrimigenia[]>([]);
  pageSize = signal(10);
  currentPage = signal(0);

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

  // Form Group para Creación
  primigeniaForm: FormGroup = this.fb.group({
    ruc_empresa: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    nro_resolucion: ['', Validators.required],
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
    const search = this.searchControl.value?.toLowerCase() || '';
    const estado = this.estadoControl.value || '';
    const tipo = this.tipoAutorizacionControl.value || '';

    return this.resoluciones().filter(r => {
      const matchSearch = !search || 
        r.ruc_empresa.toLowerCase().includes(search) || 
        r.nro_resolucion.toLowerCase().includes(search);

      const matchEstado = !estado || r.estado === estado;
      const matchTipo = !tipo || r.tipo_autorizacion === tipo;

      return matchSearch && matchEstado && matchTipo;
    });
  });

  // Computed Signal para Paginación
  paginatedResoluciones = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.resolucionesFiltradas().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.cargarResoluciones();
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
  }

  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.estadoControl.setValue('');
    this.tipoAutorizacionControl.setValue('');
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
