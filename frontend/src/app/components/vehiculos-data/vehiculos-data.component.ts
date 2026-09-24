import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router, RouterModule } from '@angular/router';
import * as XLSX from 'xlsx';

import { VehiculoDataService } from '../../services/vehiculo-data.service';


interface ColumnaConfig {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

@Component({
  selector: 'app-vehiculos-data',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
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
    MatCheckboxModule
  ],
  styleUrl: './vehiculos-data.component.scss',
  template: `
    <div class="page-container">
      <!-- HEADER BANNER (RÉPLICA EXACTA RESOLUCIONES PRIMIGENIAS) -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-with-icon">
            <mat-icon class="header-icon">directions_car</mat-icon>
            <div>
              <h1>Datos Técnicos Vehiculares</h1>
              <p class="subtitle">Base de Datos General de Fichas Técnicas Vehiculares de la Región Puno</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button mat-button class="header-action-btn" [matMenuTriggerFor]="exportExcelMenu" [disabled]="isLoading()" matTooltip="Exportar Excel">
            <mat-icon class="btn-icon">file_download</mat-icon>
            <span class="btn-text">Exportar Excel</span>
            <mat-icon class="dropdown-arrow">arrow_drop_down</mat-icon>
          </button>
          <mat-menu #exportExcelMenu="matMenu">
            <button mat-menu-item (click)="exportarExcel('seleccionados')" [disabled]="selectedCount() === 0">
              <mat-icon color="primary">check_box</mat-icon>
              <span>Exportar Seleccionados ({{ selectedCount() }})</span>
            </button>
            <button mat-menu-item (click)="exportarExcel('filtrados')">
              <mat-icon color="accent">filter_alt</mat-icon>
              <span>Exportar Vista Filtrada ({{ vehiculosFiltrados().length }})</span>
            </button>
            <button mat-menu-item (click)="exportarExcel('todos')">
              <mat-icon style="color: #10b981;">table_chart</mat-icon>
              <span>Exportar Todos ({{ vehiculos().length }})</span>
            </button>
          </mat-menu>

          <button mat-button class="header-action-btn" (click)="irACargaMasiva()" [disabled]="isLoading()" matTooltip="Carga Masiva desde Excel o Google Sheets">
            <mat-icon class="btn-icon">file_upload</mat-icon>
            <span class="btn-text">Carga Masiva</span>
          </button>

          <button mat-button class="header-action-btn btn-primary-custom" (click)="abrirModalNuevo()" [disabled]="isLoading()" matTooltip="Registrar nueva ficha técnica vehicular">
            <mat-icon class="btn-icon">add_circle</mat-icon>
            <span class="btn-text">Nuevo Vehículo</span>
          </button>
        </div>
      </div>

      <div class="content-section">
        <!-- BARRA DE FILTROS GLASSMORPHISM -->
        <div class="glass-filters">
          <div class="filters-bar">
            <div class="search-and-toggle">
              <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
                <mat-icon matPrefix class="search-icon">search</mat-icon>
                <input matInput [formControl]="searchControl" placeholder="Buscar por Placa, Marca, Modelo, VIN, Motor o Propietario...">
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
              <!-- Select Categoría -->
              <mat-form-field appearance="outline" class="filter-select" subscriptSizing="dynamic">
                <mat-label>Categoría</mat-label>
                <mat-select [formControl]="categoriaControl">
                  <mat-option value="">Todas</mat-option>
                  <mat-option value="M2">M2</mat-option>
                  <mat-option value="M2-C3">M2-C3</mat-option>
                  <mat-option value="M3">M3</mat-option>
                  <mat-option value="M3-C3">M3-C3</mat-option>
                  <mat-option value="M1">M1</mat-option>
                  <mat-option value="M1-C3">M1-C3</mat-option>
                  <mat-option value="N1">N1</mat-option>
                  <mat-option value="N2">N2</mat-option>
                  <mat-option value="N3">N3</mat-option>
                  <mat-option value="L">L</mat-option>
                  <mat-option value="O">O</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Select Carrocería -->
              <mat-form-field appearance="outline" class="filter-select" subscriptSizing="dynamic">
                <mat-label>Carrocería</mat-label>
                <mat-select [formControl]="carroceriaControl">
                  <mat-option value="">Todas las Carrocerías</mat-option>
                  <mat-option value="MINIBUS">MINIBUS</mat-option>
                  <mat-option value="BUS">BUS</mat-option>
                  <mat-option value="CAMIONETA">CAMIONETA</mat-option>
                  <mat-option value="SEDAN">SEDAN</mat-option>
                  <mat-option value="PICK_UP">PICK UP</mat-option>
                  <mat-option value="SUV">SUV</mat-option>
                  <mat-option value="CAMION">CAMION</mat-option>
                  <mat-option value="FURGON">FURGON</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Select Combustible -->
              <mat-form-field appearance="outline" class="filter-select" subscriptSizing="dynamic">
                <mat-label>Combustible</mat-label>
                <mat-select [formControl]="combustibleControl">
                  <mat-option value="">Todos los Combustibles</mat-option>
                  <mat-option value="DIESEL">DIESEL</mat-option>
                  <mat-option value="GASOLINA">GASOLINA</mat-option>
                  <mat-option value="GNV">GNV</mat-option>
                  <mat-option value="GLP">GLP</mat-option>
                  <mat-option value="ELECTRICO">ELECTRICO</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Limpiar Filtros -->
              @if (searchControl.value || categoriaControl.value || carroceriaControl.value || combustibleControl.value) {
                <button mat-button type="button" (click)="limpiarFiltros()" class="filter-action-btn btn-reset" matTooltip="Limpiar filtros">
                  <mat-icon>filter_alt_off</mat-icon>
                  <span>Limpiar</span>
                </button>
              }

              <!-- Configurar Columnas Menu -->
              <button mat-button type="button" [matMenuTriggerFor]="columnsMenu" class="filter-action-btn" matTooltip="Configurar columnas">
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
        </div>

        <!-- FORMULARIO MODAL: NUEVO/EDITAR VEHICULO -->
        @if (showFormModal()) {
          <mat-card class="form-card animate-fade-in">
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="primary">{{ editandoId() ? 'edit' : 'directions_car' }}</mat-icon>
                {{ editandoId() ? 'Editar Datos Técnicos Vehiculares' : 'Registrar Nuevo Vehículo en Base General' }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="vehiculoForm" (ngSubmit)="guardarVehiculo()" class="primigenia-form">
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Placa (ej: V1B-789)</mat-label>
                    <input matInput formControlName="placa_actual" style="text-transform:uppercase;">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Marca</mat-label>
                    <input matInput formControlName="marca" placeholder="Ej: TOYOTA">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Modelo</mat-label>
                    <input matInput formControlName="modelo" placeholder="Ej: HIACE">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Año Fabricación (MTC)</mat-label>
                    <input matInput type="number" formControlName="anio_fabricacion" placeholder="Ej: 2020">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Año Modelo (Comercial)</mat-label>
                    <input matInput type="number" formControlName="anio_modelo" placeholder="Ej: 2021">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Color</mat-label>
                    <input matInput formControlName="color" placeholder="Ej: BLANCO">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Categoría</mat-label>
                    <mat-select formControlName="categoria">
                      <mat-option value="M2">M2</mat-option>
                      <mat-option value="M2-C3">M2-C3</mat-option>
                      <mat-option value="M3">M3</mat-option>
                      <mat-option value="M3-C3">M3-C3</mat-option>
                      <mat-option value="M1">M1</mat-option>
                      <mat-option value="M1-C3">M1-C3</mat-option>
                      <mat-option value="N1">N1</mat-option>
                      <mat-option value="N2">N2</mat-option>
                      <mat-option value="N3">N3</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Carrocería</mat-label>
                    <input matInput formControlName="carroceria" placeholder="Ej: MINIBUS">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Clase Vehicular</mat-label>
                    <input matInput formControlName="clase" placeholder="Ej: CAMIONETA">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Combustible</mat-label>
                    <mat-select formControlName="combustible">
                      <mat-option value="DIESEL">DIESEL</mat-option>
                      <mat-option value="GASOLINA">GASOLINA</mat-option>
                      <mat-option value="GNV">GNV</mat-option>
                      <mat-option value="GLP">GLP</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Número Motor</mat-label>
                    <input matInput formControlName="numero_motor">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>VIN / Número Serie</mat-label>
                    <input matInput formControlName="vin">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Peso Bruto (Ton, 3 dec)</mat-label>
                    <input matInput type="number" step="0.001" formControlName="peso_bruto">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Peso Neto / Seco (Ton, 3 dec)</mat-label>
                    <input matInput type="number" step="0.001" formControlName="peso_seco">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Carga Útil (Ton, 3 dec)</mat-label>
                    <input matInput type="number" step="0.001" formControlName="carga_util">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Largo (m, 3 dec)</mat-label>
                    <input matInput type="number" step="0.001" formControlName="longitud">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Ancho (m, 3 dec)</mat-label>
                    <input matInput type="number" step="0.001" formControlName="ancho">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Alto (m, 3 dec)</mat-label>
                    <input matInput type="number" step="0.001" formControlName="altura">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>N° Asientos</mat-label>
                    <input matInput type="number" formControlName="numero_asientos">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>N° Pasajeros</mat-label>
                    <input matInput type="number" formControlName="numero_pasajeros">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>N° Ejes</mat-label>
                    <input matInput type="number" formControlName="numero_ejes">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>N° Ruedas</mat-label>
                    <input matInput type="number" formControlName="numero_ruedas">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Observaciones</mat-label>
                    <textarea matInput formControlName="observaciones" rows="2"></textarea>
                  </mat-form-field>
                </div>

                <div class="form-actions">
                  <button mat-button type="button" (click)="cerrarModalForm()">Cancelar</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="vehiculoForm.invalid || isLoading()">
                    {{ editandoId() ? 'Guardar Cambios' : 'Registrar Vehículo' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <!-- MODAL DETALLE COMPLETO -->
        @if (selectedForDetail()) {
          <mat-card class="detail-card animate-fade-in">
            <mat-card-header>
              <mat-card-title class="detail-title">
                <mat-icon color="primary">description</mat-icon>
                Ficha Técnica Vehicular: Placa {{ selectedForDetail()?.placa_actual }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="detail-grid">
                <div class="detail-item"><strong>Placa:</strong> <span class="ruc-badge">{{ selectedForDetail()?.placa_actual }}</span></div>
                <div class="detail-item"><strong>Marca / Modelo:</strong> {{ selectedForDetail()?.marca }} {{ selectedForDetail()?.modelo }} ({{ selectedForDetail()?.anio_fabricacion }})</div>
                <div class="detail-item"><strong>Categoría / Carrocería:</strong> {{ selectedForDetail()?.categoria }} - {{ selectedForDetail()?.carroceria }} ({{ selectedForDetail()?.clase }})</div>
                <div class="detail-item"><strong>Color:</strong> {{ selectedForDetail()?.color || '-' }}</div>
                <div class="detail-item"><strong>Combustible:</strong> {{ selectedForDetail()?.combustible || '-' }}</div>
                <div class="detail-item"><strong>N° Motor:</strong> {{ selectedForDetail()?.numero_motor || '-' }}</div>
                <div class="detail-item"><strong>VIN / N° Serie:</strong> {{ selectedForDetail()?.vin || '-' }}</div>
                <div class="detail-item"><strong>Pesos (Ton):</strong> Bruto: {{ selectedForDetail()?.peso_bruto | number:'1.3-3' }} ton | Seco: {{ selectedForDetail()?.peso_seco | number:'1.3-3' }} ton | Carga: {{ selectedForDetail()?.carga_util | number:'1.3-3' }} ton</div>
                <div class="detail-item"><strong>Medidas (m):</strong> {{ selectedForDetail()?.longitud | number:'1.3-3' }}m (L) x {{ selectedForDetail()?.ancho | number:'1.3-3' }}m (A) x {{ selectedForDetail()?.altura | number:'1.3-3' }}m (Alt)</div>
                <div class="detail-item"><strong>Capacidad:</strong> {{ selectedForDetail()?.numero_asientos }} asientos / {{ selectedForDetail()?.numero_pasajeros }} pasajeros | {{ selectedForDetail()?.numero_ejes }} ejes / {{ selectedForDetail()?.numero_ruedas }} ruedas</div>
                
                @if (selectedForDetail()?.pcmMetadata) {
                  <div class="detail-item full-width" style="margin-top:12px; padding:12px; background:rgba(245,158,11,0.08); border-radius:8px;">
                    <strong>Auditoría & Propietario PCM:</strong><br>
                    <span>Propietario: {{ selectedForDetail()?.pcmMetadata?.pcm_propietario || 'N/A' }}</span><br>
                    <span>Estado PCM: {{ selectedForDetail()?.pcmMetadata?.pcm_estado || 'N/A' }} | Sede: {{ selectedForDetail()?.pcmMetadata?.pcm_sede || 'N/A' }}</span>
                  </div>
                }
              </div>

              <div class="form-actions" style="margin-top:20px;">
                <button mat-raised-button color="primary" (click)="cerrarDetalle()">Cerrar</button>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- TABLA DE RESULTADOS -->
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando fichas técnicas vehiculares...</p>
            @if (totalBackend() > 0) {
              <p class="load-progress-text">
                {{ vehiculos().length.toLocaleString() }} / {{ totalBackend().toLocaleString() }} registros
                ({{ loadProgress() }}%)
              </p>
              <div class="load-progress-bar-wrap">
                <div class="load-progress-bar-fill" [style.width.%]="loadProgress()"></div>
              </div>
            }
          </div>
        } @else if (vehiculosFiltrados().length === 0) {
          <mat-card class="empty-state">
            <mat-card-content>
              <mat-icon class="empty-icon">directions_car</mat-icon>
              <h3>No se encontraron Vehículos</h3>
              <p>Intenta ajustar los filtros de búsqueda o registra una nueva ficha técnica.</p>
              <button mat-raised-button color="primary" (click)="abrirModalNuevo()">
                <mat-icon>add</mat-icon> Registrar Primer Vehículo
              </button>
            </mat-card-content>
          </mat-card>
        } @else {
          <!-- BANNER DE SELECCION MULTIPLE -->
          @if (selectedCount() > 0) {
            <div class="selection-banner animate-fade-in">
              <div class="banner-info">
                <mat-icon class="banner-icon">check_circle</mat-icon>
                <span><strong>{{ selectedCount() }}</strong> vehículo(s) seleccionado(s)</span>
              </div>
              <div class="banner-actions">
                <button mat-raised-button color="accent" (click)="exportarExcel('seleccionados')">
                  <mat-icon>file_download</mat-icon> Exportar Seleccionados a Excel
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
                        <th class="checkbox-th text-center sticky-col-select">
                          <mat-checkbox
                            [checked]="isAllSelected()"
                            [indeterminate]="isSomeSelected()"
                            (change)="toggleSelectAll()">
                          </mat-checkbox>
                        </th>
                      }
                      @if (columnaVisible('placa')) {
                        <th (click)="toggleSort('placa')" class="sortable-th sticky-col-placa">
                          <span>Placa</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('placa') }}</mat-icon>
                        </th>
                      }

                      @if (columnaVisible('marca')) {
                        <th (click)="toggleSort('marca')" class="sortable-th">
                          <span>Marca / Modelo</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('marca') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('categoria')) {
                        <th (click)="toggleSort('categoria')" class="sortable-th">
                          <span>Cat / Carrocería</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('categoria') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('pesos')) {
                        <th>Pesos (Ton)</th>
                      }
                      @if (columnaVisible('medidas')) {
                        <th>Medidas (m)</th>
                      }
                      @if (columnaVisible('asientos')) {
                        <th>Capacidad</th>
                      }
                      @if (columnaVisible('rodaje')) {
                        <th>Cil. / Ejes / Ruedas</th>
                      }
                      @if (columnaVisible('motor')) {
                        <th>Motor / VIN</th>
                      }
                      @if (columnaVisible('propietario')) {
                        <th>Propietario / PCM Audit</th>
                      }
                      @if (columnaVisible('observaciones')) {
                        <th>Observaciones</th>
                      }
                      @if (columnaVisible('acciones')) {
                        <th class="text-center th-actions-icon-col sticky-col-actions">
                          <mat-icon class="th-actions-icon">more_vert</mat-icon>
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of paginatedVehiculos(); track item.id || item.placa_actual) {
                      <tr [class.selected-row]="isSelected(item.id || item.placa_actual)">
                        @if (columnaVisible('select')) {
                          <td class="checkbox-td text-center sticky-col-select" (click)="$event.stopPropagation()">
                            <mat-checkbox
                              [checked]="isSelected(item.id || item.placa_actual)"
                              (change)="toggleSelectRow(item.id || item.placa_actual)">
                            </mat-checkbox>
                          </td>
                        }
                        @if (columnaVisible('placa')) {
                          <td class="sticky-col-placa">
                            <div class="placa-cell-box">
                              <span class="ruc-badge placa-badge-nowrap">{{ item.placa_actual }}</span>
                              @let pct = calcularCompletitud(item);
                              <div class="completitud-badge"
                                   [class.pct-high]="pct >= 80"
                                   [class.pct-medium]="pct >= 50 && pct < 80"
                                   [class.pct-low]="pct < 50"
                                   [matTooltip]="pct + '% de campos válidos llenados (sin ceros ni nulos)'">
                                <span class="pct-text">{{ pct }}% completo</span>
                              </div>
                            </div>
                          </td>
                        }
                        @if (columnaVisible('marca')) {
                          <td>
                            <div style="display:flex; flex-direction:column; gap:2px;">
                              <strong>{{ item.marca }}</strong>
                              <span style="font-size:12px; color:var(--text-secondary,#64748b);">{{ item.modelo }} ({{ item.anio_fabricacion }})</span>
                            </div>
                          </td>
                        }
                        @if (columnaVisible('categoria')) {
                          <td>
                            <div class="cat-carroceria-cell" style="display:flex; flex-direction:column; gap:3px;">
                              <div><span class="siglas-badge">{{ item.categoria || '-' }}</span></div>
                              <span style="font-size:12px; color:#475569;">{{ item.carroceria || '-' }}</span>
                            </div>
                          </td>
                        }
                        @if (columnaVisible('pesos')) {
                          <td>
                            <div style="font-size:12px; line-height:1.4;">
                              <span>Bruto: <strong>{{ item.peso_bruto | number:'1.3-3' }}</strong></span><br>
                              <span style="color:#64748b;">Seco: {{ item.peso_seco | number:'1.3-3' }} | Carga: {{ item.carga_util | number:'1.3-3' }}</span>
                            </div>
                          </td>
                        }
                        @if (columnaVisible('medidas')) {
                          <td>
                            <div style="font-size:12px; white-space:nowrap;">
                              <span>{{ item.longitud | number:'1.3-3' }} &times; {{ item.ancho | number:'1.3-3' }} &times; {{ item.altura | number:'1.3-3' }} m</span>
                            </div>
                          </td>
                        }
                        @if (columnaVisible('asientos')) {
                          <td>
                            <div style="font-size:12px; display:flex; flex-direction:column; gap:1px;">
                              <span>Pasajeros: <strong>{{ item.numero_pasajeros || 0 }}</strong></span>
                              <span style="color:#64748b;">Asientos: {{ item.numero_asientos || 0 }}</span>
                            </div>
                          </td>
                        }
                        @if (columnaVisible('rodaje')) {
                          <td>
                            <div style="font-size:12px; display:flex; flex-direction:column; gap:1px;">
                              <span>Cilindros: <strong>{{ item.cilindrada || item.cilindros || 0 }}</strong></span>
                              <span style="color:#64748b;">Ejes: {{ item.numero_ejes || 0 }} | Ruedas: {{ item.numero_ruedas || 0 }}</span>
                            </div>
                          </td>
                        }
                        @if (columnaVisible('motor')) {
                          <td>
                            <div style="font-size:12px; display:flex; flex-direction:column;">
                              <span>M: {{ item.numero_motor || '-' }}</span>
                              <span style="color:var(--text-secondary,#64748b);">V: {{ item.vin || '-' }}</span>
                            </div>
                          </td>
                        }
                        @if (columnaVisible('propietario')) {
                          <td>
                            <span class="por-vencer-hint" [matTooltip]="item.pcmMetadata?.pcm_propietario || 'Sin Datos'">
                              {{ item.pcmMetadata?.pcm_propietario | slice:0:22 }}{{ (item.pcmMetadata?.pcm_propietario?.length || 0) > 22 ? '...' : '' }}
                            </span>
                          </td>
                        }
                        @if (columnaVisible('observaciones')) {
                          <td>
                            <span class="por-vencer-hint" [matTooltip]="item.observaciones || 'Sin observaciones'">
                              {{ (item.observaciones || 'Sin observaciones') | slice:0:22 }}{{ (item.observaciones?.length || 0) > 22 ? '...' : '' }}
                            </span>
                          </td>
                        }
                        @if (columnaVisible('acciones')) {
                          <td class="text-center sticky-col-actions">
                            <button mat-icon-button [matMenuTriggerFor]="actionMenu" [matMenuTriggerData]="{ item: item }">
                              <mat-icon>more_vert</mat-icon>
                            </button>
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- MENU DESPLEGABLE ACCIONES POR FILA -->
              <mat-menu #actionMenu="matMenu">
                <ng-template matMenuContent let-item="item">
                  <button mat-menu-item (click)="verDetalleModal(item)">
                    <mat-icon color="primary">visibility</mat-icon>
                    <span>Ver Ficha Técnica Completa</span>
                  </button>
                  <button mat-menu-item (click)="editarVehiculoModal(item)">
                    <mat-icon color="accent">edit</mat-icon>
                    <span>Editar Ficha Técnica</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="eliminarVehiculo(item.id || item.placa_actual)">
                    <mat-icon color="warn">delete</mat-icon>
                    <span>Eliminar Vehículo</span>
                  </button>
                </ng-template>
              </mat-menu>

              <!-- PAGINADOR -->
              <mat-paginator
                [length]="vehiculosFiltrados().length"
                [pageSize]="pageSize()"
                [pageIndex]="pageIndex()"
                [pageSizeOptions]="[10, 25, 50, 100]"
                (page)="onPageChange($event)"
                showFirstLastButtons>
              </mat-paginator>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `
})
export class VehiculosDataComponent implements OnInit {
  private vehiculoDataService = inject(VehiculoDataService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  isLoading = signal<boolean>(false);
  loadProgress = signal<number>(0);  // Porcentaje de carga (0-100)
  totalBackend = signal<number>(0);  // Total real en la BD
  vehiculos = signal<any[]>([]);
  showMobileFilters = signal<boolean>(false);

  // Form Controls de Filtro (convertidos a signals para que computed() reaccione)
  searchControl = new FormControl('');
  categoriaControl = new FormControl('');
  carroceriaControl = new FormControl('');
  combustibleControl = new FormControl('');

  // Signals derivadas de los FormControls (para reactividad en computed)
  private searchValue = toSignal(this.searchControl.valueChanges.pipe(startWith('')), { initialValue: '' });
  private categoriaValue = toSignal(this.categoriaControl.valueChanges.pipe(startWith('')), { initialValue: '' });
  private carroceriaValue = toSignal(this.carroceriaControl.valueChanges.pipe(startWith('')), { initialValue: '' });
  private combustibleValue = toSignal(this.combustibleControl.valueChanges.pipe(startWith('')), { initialValue: '' });

  // Paginación y Orden
  pageIndex = signal<number>(0);
  pageSize = signal<number>(25);
  sortField = signal<string>('placa');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Selecciones
  selectedIds = signal<Set<string>>(new Set());
  selectedCount = computed(() => this.selectedIds().size);

  // Modales
  showFormModal = signal<boolean>(false);
  editandoId = signal<string | null>(null);
  selectedForDetail = signal<any | null>(null);

  // Formulario Reactive
  vehiculoForm!: FormGroup;

  // Columnas disponibles
  columnasDisponibles: ColumnaConfig[] = [
    { key: 'select', label: 'Seleccionar', visible: true, required: true },
    { key: 'placa', label: 'Placa', visible: true, required: true },

    { key: 'marca', label: 'Marca / Modelo', visible: true },
    { key: 'categoria', label: 'Cat / Carrocería', visible: true },
    { key: 'pesos', label: 'Pesos (Ton)', visible: true },
    { key: 'medidas', label: 'Medidas (m)', visible: true },
    { key: 'asientos', label: 'Capacidad', visible: true },
    { key: 'rodaje', label: 'Cil. / Ejes / Ruedas', visible: true },
    { key: 'motor', label: 'Motor / VIN', visible: true },
    { key: 'propietario', label: 'Propietario PCM', visible: true },
    { key: 'observaciones', label: 'Observaciones', visible: true },
    { key: 'acciones', label: 'Acciones', visible: true, required: true }
  ];

  columnasVisiblesMap = signal<Record<string, boolean>>({
    select: true, placa: true, marca: true, categoria: true,
    pesos: true, medidas: true, asientos: true, rodaje: true, motor: true,
    propietario: true, observaciones: true, acciones: true
  });

  calcularCompletitud(item: any): number {
    if (!item) return 0;
    const campos = [
      'placa_actual', 'vin', 'numero_motor', 'marca', 'modelo',
      'anio_fabricacion', 'anio_modelo', 'color', 'categoria', 'carroceria', 'clase',
      'combustible', 'numero_asientos', 'numero_pasajeros', 'cilindrada',
      'numero_ejes', 'numero_ruedas', 'peso_bruto', 'peso_seco',
      'carga_util', 'longitud', 'ancho', 'altura'
    ];

    let validos = 0;
    for (const f of campos) {
      const val = item[f];
      if (val !== null && val !== undefined && val !== '' && val !== 0 && val !== 0.0) {
        const valStr = String(val).trim().toUpperCase();
        if (!['DESCONOCIDO', 'DESCONOCIDA', 'SIN_INFORMACION', 'N/A', 'NONE', 'NULL', '0', '0.0', '0.00', '0.000'].includes(valStr)) {
          validos++;
        }
      }
    }
    return Math.round((validos / campos.length) * 100);
  }



  ngOnInit(): void {
    this.initForm();
    this.cargarVehiculos();

    // Resetear página al cambiar cualquier filtro
    this.searchControl.valueChanges.subscribe(() => this.pageIndex.set(0));
    this.categoriaControl.valueChanges.subscribe(() => this.pageIndex.set(0));
    this.carroceriaControl.valueChanges.subscribe(() => this.pageIndex.set(0));
    this.combustibleControl.valueChanges.subscribe(() => this.pageIndex.set(0));
  }

  initForm(): void {
    this.vehiculoForm = this.fb.group({
      placa_actual: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]{6,10}$/i)]],
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      anio_fabricacion: [null, [Validators.min(1900), Validators.max(2035)]],
      anio_modelo: [null, [Validators.min(1900), Validators.max(2035)]],
      color: ['BLANCO'],
      categoria: ['M1', Validators.required],
      carroceria: ['MINIBUS'],
      clase: ['CAMIONETA'],
      combustible: ['DIESEL'],
      numero_motor: [''],
      vin: [''],
      peso_bruto: [0.0, Validators.min(0)],
      peso_seco: [0.0, Validators.min(0)],
      carga_util: [0.0, Validators.min(0)],
      longitud: [0.0, Validators.min(0)],
      ancho: [0.0, Validators.min(0)],
      altura: [0.0, Validators.min(0)],
      numero_asientos: [5, Validators.min(1)],
      numero_pasajeros: [4, Validators.min(1)],
      numero_ejes: [2, Validators.min(1)],
      numero_ruedas: [4, Validators.min(2)],
      observaciones: ['']
    });
  }

  cargarVehiculos(): void {
    this.isLoading.set(true);
    this.loadProgress.set(0);
    this.vehiculos.set([]);

    const BATCH_SIZE = 5000;
    let acumulados: any[] = [];

    const cargarBatch = (skip: number) => {
      this.vehiculoDataService.getVehiculosData(skip, BATCH_SIZE).subscribe({
        next: (resp) => {
          if (resp.success && resp.data) {
            const total = resp.total || 0;
            this.totalBackend.set(total);
            acumulados = [...acumulados, ...resp.data];

            const progreso = total > 0 ? Math.round((acumulados.length / total) * 100) : 100;
            this.loadProgress.set(Math.min(progreso, 99));

            if (acumulados.length < total && resp.data.length === BATCH_SIZE) {
              // Hay más registros: cargar siguiente lote
              cargarBatch(skip + BATCH_SIZE);
            } else {
              // Carga completa
              this.vehiculos.set(acumulados);
              this.loadProgress.set(100);
              this.isLoading.set(false);
              this.snackBar.open(
                `✅ ${acumulados.length.toLocaleString()} fichas técnicas cargadas`,
                'OK',
                { duration: 3000 }
              );
            }
          } else {
            this.isLoading.set(false);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Error cargando datos técnicos vehiculares:', err);
          this.snackBar.open('Error al conectar con la base de datos de vehículos.', 'Cerrar', { duration: 4000 });
        }
      });
    };

    cargarBatch(0);
  }

  // Computed Signal para filtrado + sorting (usa signals derivadas de FormControls)
  vehiculosFiltrados = computed(() => {
    let list = [...this.vehiculos()];
    const query = (this.searchValue() || '').trim().toLowerCase();
    const cat = (this.categoriaValue() || '').toUpperCase();
    const carr = (this.carroceriaValue() || '').toUpperCase();
    const comb = (this.combustibleValue() || '').toUpperCase();

    // Filtrar por búsqueda de texto
    if (query) {
      list = list.filter(item =>
        (item.placa_actual || '').toLowerCase().includes(query) ||
        (item.marca || '').toLowerCase().includes(query) ||
        (item.modelo || '').toLowerCase().includes(query) ||
        (item.vin || '').toLowerCase().includes(query) ||
        (item.numero_motor || '').toLowerCase().includes(query) ||
        (item.pcmMetadata?.pcm_propietario || '').toLowerCase().includes(query)
      );
    }

    // Filtros de select
    if (cat) list = list.filter(item => (item.categoria || '').toUpperCase() === cat);
    if (carr) list = list.filter(item => (item.carroceria || '').toUpperCase() === carr);
    if (comb) list = list.filter(item => (item.combustible || '').toUpperCase() === comb);

    // Sorting
    const field = this.sortField();
    const dir = this.sortDirection();
    const fieldMap: Record<string, string> = {
      placa: 'placa_actual',
      marca: 'marca',
      categoria: 'categoria',
      anio: 'anio_fabricacion'
    };
    const sortKey = fieldMap[field] || field;
    list.sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      const cmp = String(va).localeCompare(String(vb), 'es', { numeric: true });
      return dir === 'asc' ? cmp : -cmp;
    });

    return list;
  });

  paginatedVehiculos = computed(() => {
    const list = this.vehiculosFiltrados();
    const start = this.pageIndex() * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  // Column Visibility
  columnaVisible(key: string): boolean {
    return this.columnasVisiblesMap()[key] !== false;
  }

  toggleColumna(key: string): void {
    const current = { ...this.columnasVisiblesMap() };
    current[key] = !current[key];
    this.columnasVisiblesMap.set(current);
  }

  restablecerColumnas(): void {
    this.columnasVisiblesMap.set({
      select: true, placa: true, marca: true, categoria: true,
      pesos: true, medidas: true, asientos: true, rodaje: true, motor: true,
      propietario: true, observaciones: true, acciones: true
    });
  }



  // Sorting
  toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.pageIndex.set(0); // volver a primera página al ordenar
  }

  getSortIcon(field: string): string {
    if (this.sortField() !== field) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // Checkbox Selection
  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelectRow(id: string): void {
    const set = new Set(this.selectedIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.selectedIds.set(set);
  }

  isAllSelected(): boolean {
    const pageItems = this.paginatedVehiculos();
    if (pageItems.length === 0) return false;
    return pageItems.every(i => this.selectedIds().has(i.id || i.placa_actual));
  }

  isSomeSelected(): boolean {
    const pageItems = this.paginatedVehiculos();
    return pageItems.some(i => this.selectedIds().has(i.id || i.placa_actual)) && !this.isAllSelected();
  }

  toggleSelectAll(): void {
    const set = new Set(this.selectedIds());
    if (this.isAllSelected()) {
      this.paginatedVehiculos().forEach(i => set.delete(i.id || i.placa_actual));
    } else {
      this.paginatedVehiculos().forEach(i => set.add(i.id || i.placa_actual));
    }
    this.selectedIds.set(set);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.categoriaControl.setValue('');
    this.carroceriaControl.setValue('');
    this.combustibleControl.setValue('');
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  irACargaMasiva(): void {
    this.router.navigate(['/vehiculos-data/carga-masiva']);
  }

  abrirModalNuevo(): void {
    this.editandoId.set(null);
    this.vehiculoForm.reset({
      anio_fabricacion: 2020, categoria: 'M1', carroceria: 'MINIBUS',
      clase: 'CAMIONETA', combustible: 'DIESEL', color: 'BLANCO',
      peso_bruto: 0, peso_seco: 0, carga_util: 0, longitud: 0, ancho: 0, altura: 0,
      numero_asientos: 5, numero_pasajeros: 4, numero_ejes: 2, numero_ruedas: 4
    });
    this.showFormModal.set(true);
  }

  editarVehiculoModal(item: any): void {
    this.editandoId.set(item.id || item._id);
    this.vehiculoForm.patchValue({
      placa_actual: item.placa_actual,
      marca: item.marca,
      modelo: item.modelo,
      anio_fabricacion: item.anio_fabricacion || null,
      anio_modelo: item.anio_modelo || null,
      color: item.color,
      categoria: item.categoria,
      carroceria: item.carroceria,
      clase: item.clase,
      combustible: item.combustible,
      numero_motor: item.numero_motor,
      vin: item.vin,
      peso_bruto: item.peso_bruto,
      peso_seco: item.peso_seco,
      carga_util: item.carga_util,
      longitud: item.longitud,
      ancho: item.ancho,
      altura: item.altura,
      numero_asientos: item.numero_asientos,
      numero_pasajeros: item.numero_pasajeros,
      numero_ejes: item.numero_ejes,
      numero_ruedas: item.numero_ruedas,
      observaciones: item.observaciones
    });
    this.showFormModal.set(true);
  }

  cerrarModalForm(): void {
    this.showFormModal.set(false);
    this.editandoId.set(null);
  }

  guardarVehiculo(): void {
    if (this.vehiculoForm.invalid) return;

    const val = this.vehiculoForm.value;
    val.placa_actual = (val.placa_actual || '').toUpperCase().trim();

    this.isLoading.set(true);
    if (this.editandoId()) {
      this.vehiculoDataService.updateVehiculoData(this.editandoId()!, val).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Vehículo actualizado exitosamente', 'OK', { duration: 3000 });
          this.cerrarModalForm();
          this.cargarVehiculos();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.snackBar.open(`Error actualizando: ${err.error?.detail || err.message}`, 'Cerrar', { duration: 4000 });
        }
      });
    } else {
      this.vehiculoDataService.createVehiculoData(val).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Vehículo registrado en base de datos general', 'OK', { duration: 3000 });
          this.cerrarModalForm();
          this.cargarVehiculos();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.snackBar.open(`Error registrando: ${err.error?.detail || err.message}`, 'Cerrar', { duration: 4000 });
        }
      });
    }
  }

  verDetalleModal(item: any): void {
    this.selectedForDetail.set(item);
  }

  cerrarDetalle(): void {
    this.selectedForDetail.set(null);
  }

  eliminarVehiculo(id: string): void {
    if (!confirm('¿Está seguro de eliminar esta ficha técnica vehicular de la base de datos general?')) return;
    this.isLoading.set(true);
    this.vehiculoDataService.deleteVehiculoData(id).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('Vehículo eliminado', 'OK', { duration: 3000 });
        this.cargarVehiculos();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open('Error eliminando vehículo', 'Cerrar', { duration: 4000 });
      }
    });
  }

  exportarExcel(tipo: 'seleccionados' | 'filtrados' | 'todos'): void {
    let dataset: any[] = [];
    if (tipo === 'seleccionados') {
      dataset = this.vehiculos().filter(i => this.selectedIds().has(i.id || i.placa_actual));
    } else if (tipo === 'filtrados') {
      dataset = this.vehiculosFiltrados();
    } else {
      dataset = this.vehiculos();
    }

    if (dataset.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportRows = dataset.map((v, index) => ({
      'ITEM': index + 1,
      'PLACA': v.placa_actual || '',
      'MARCA': v.marca || '',
      'MODELO': v.modelo || '',
      'ANIO_FABRICACION': v.anio_fabricacion || '',
      'COLOR': v.color || '',
      'CATEGORIA': v.categoria || '',
      'CARROCERIA': v.carroceria || '',
      'CLASE': v.clase || '',
      'COMBUSTIBLE': v.combustible || '',
      'NUMERO_MOTOR': v.numero_motor || '',
      'NUMERO_SERIE_VIN': v.vin || '',
      'NUM_PASAJEROS': v.numero_pasajeros || 0,
      'NUM_ASIENTOS': v.numero_asientos || 0,
      'CILINDROS': v.cilindrada || 0,
      'EJES': v.numero_ejes || 0,
      'RUEDAS': v.numero_ruedas || 0,
      'PESO_BRUTO_TON': v.peso_bruto || 0.0,
      'PESO_NETO_TON': v.peso_seco || 0.0,
      'CARGA_UTIL_TON': v.carga_util || 0.0,
      'LARGO_M': v.longitud || 0.0,
      'ANCHO_M': v.ancho || 0.0,
      'ALTO_M': v.altura || 0.0,
      'OBSERVACIONES': v.observaciones || '',
      'PROPIETARIO_PCM': v.pcmMetadata?.pcm_propietario || '',
      'ESTADO_PCM': v.pcmMetadata?.pcm_estado || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos_Tecnicos_Vehiculos');
    XLSX.writeFile(wb, `Datos_Tecnicos_Vehiculos_${tipo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}
