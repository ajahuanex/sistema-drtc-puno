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
import { ActivatedRoute } from '@angular/router';

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

        <!-- Formulario Modal / Drawer (Creación Rápida) -->
        @if (showFormModal()) {
          <mat-card class="form-card animate-fade-in">
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="primary">post_add</mat-icon>
                Registrar Nueva Resolución Hija (Acto Modificatorio)
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
                  <button mat-button type="button" (click)="toggleFormModal()">Cancelar</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="hijaForm.invalid || isLoading()">
                    Guardar Resolución Hija
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
                      @if (columnaVisible('nro_resolucion')) { <th>N° Res. Hija</th> }
                      @if (columnaVisible('nro_resolucion_primigenia')) { <th>N° Primigenia Matriz</th> }
                      @if (columnaVisible('ruc_empresa')) { <th>RUC Empresa</th> }
                      @if (columnaVisible('tipo_acto')) { <th>Acto Modificatorio</th> }
                      @if (columnaVisible('fecha_resolucion')) { <th>F. Emisión</th> }
                      @if (columnaVisible('expediente_numero')) { <th>N° Expediente</th> }
                      @if (columnaVisible('flota_ingresante')) { <th>Flota Ingresante</th> }
                      @if (columnaVisible('flota_saliente')) { <th>Flota Saliente</th> }
                      @if (columnaVisible('link_documento')) { <th>Drive</th> }
                      @if (columnaVisible('acciones')) { <th>Acciones</th> }
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of paginatedResoluciones(); track item.id) {
                      <tr>
                        @if (columnaVisible('nro_resolucion')) {
                          <td class="bold-text color-teal">{{ item.nro_resolucion }}</td>
                        }
                        @if (columnaVisible('nro_resolucion_primigenia')) {
                          <td>
                            <span class="primigenia-pill">{{ item.nro_resolucion_primigenia }}</span>
                          </td>
                        }
                        @if (columnaVisible('ruc_empresa')) {
                          <td>
                            <span class="ruc-badge">{{ item.ruc_empresa }}</span>
                          </td>
                        }
                        @if (columnaVisible('tipo_acto')) {
                          <td>
                            <span [class]="'acto-badge acto-' + item.tipo_acto?.toLowerCase()">
                              {{ getTipoActoDisplay(item.tipo_acto) }}
                            </span>
                          </td>
                        }
                        @if (columnaVisible('fecha_resolucion')) {
                          <td>{{ item.fecha_resolucion | date:'dd/MM/yyyy' }}</td>
                        }
                        @if (columnaVisible('expediente_numero')) {
                          <td>{{ item.expediente_numero || '-' }}</td>
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
                          <td>
                            <div class="action-buttons">
                              <button mat-icon-button color="warn" (click)="eliminarResolucion(item.id)" matTooltip="Eliminar">
                                <mat-icon>delete</mat-icon>
                              </button>
                            </div>
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

  // Computed Signal de Datos Filtrados
  resolucionesFiltradas = computed(() => {
    const search = (this.searchFilter() || '').toLowerCase().trim();
    const tipo = this.tipoActoFilter() || '';

    return this.resoluciones().filter(r => {
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
  });

  // Computed Signal para Paginación de la Tabla
  paginatedResoluciones = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.resolucionesFiltradas().slice(start, start + this.pageSize());
  });

  // Configuración de Columnas Disponibles
  columnasDisponibles = [
    { key: 'nro_resolucion', label: 'N° Res. Hija', required: true },
    { key: 'nro_resolucion_primigenia', label: 'N° Primigenia Matriz', required: false },
    { key: 'ruc_empresa', label: 'RUC Empresa', required: false },
    { key: 'tipo_acto', label: 'Acto Modificatorio', required: false },
    { key: 'fecha_resolucion', label: 'F. Emisión', required: false },
    { key: 'expediente_numero', label: 'N° Expediente', required: false },
    { key: 'flota_ingresante', label: 'Flota Ingresante', required: false },
    { key: 'flota_saliente', label: 'Flota Saliente', required: false },
    { key: 'link_documento', label: 'Drive', required: false },
    { key: 'acciones', label: 'Acciones', required: true }
  ];

  columnasVisiblesState = signal<string[]>([
    'nro_resolucion',
    'nro_resolucion_primigenia',
    'ruc_empresa',
    'tipo_acto',
    'fecha_resolucion',
    'expediente_numero',
    'flota_ingresante',
    'flota_saliente',
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
    this.currentPage.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  toggleFormModal(): void {
    this.showFormModal.update(v => !v);
  }

  guardarResolucionHija(): void {
    if (this.hijaForm.invalid) return;

    this.isLoading.set(true);
    const formVal = this.hijaForm.value;

    const parseList = (str: string) => str ? str.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

    const dto: ResolucionHijaCreate = {
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

    this.service.createResolucionHija(dto).subscribe({
      next: () => {
        this.snackBar.open('Resolución Hija registrada con éxito', 'Cerrar', { duration: 3000 });
        this.hijaForm.reset({ tipo_acto: 'INCREMENTO_FLOTA' });
        this.showFormModal.set(false);
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

  getTipoActoDisplay(tipo: string): string {
    const map: { [key: string]: string } = {
      'RENOVACION': 'Renovación',
      'INCREMENTO_FLOTA': 'Incremento Flota',
      'SUSTITUCION_VEHICULAR': 'Sustitución Vehicular',
      'BAJA_VEHICULAR': 'Baja Vehicular',
      'MODIFICACION_RUTA': 'Modificación Ruta',
      'CAMBIO_REPRESENTANTE': 'Cambio Representante',
      'SUSPENSION_TEMPORAL': 'Suspensión Temporal',
      'CANCELACION_PARCIAL': 'Cancelación Parcial',
      'OTROS': 'Otros'
    };
    return map[tipo] || tipo;
  }
}
