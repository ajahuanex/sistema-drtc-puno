import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';

import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { FlotaEmpresaService, VehiculoEmpresa, EstadisticasFlota, ResumenEmpresa } from '../../services/flota-empresa.service';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa } from '../../models/empresa.model';
import { ResolucionPrimigeniaService } from '../../services/resolucion-primigenia.service';
import { ResolucionPrimigenia } from '../../models/resolucion-primigenia.model';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../models/ruta.model';
import { DetalleVehiculoDialogComponent } from './detalle-vehiculo-dialog.component';
import { EditarVehiculoDialogComponent } from './editar-vehiculo-dialog.component';

export interface ColumnasState {
  primigenia: boolean;
  placaHija: boolean;
  rutas: boolean;
  tuc: boolean;
  estado: boolean;
  expediente: boolean;
  fecha: boolean;
  links: boolean;
  observaciones: boolean;
}

@Component({
  selector: 'app-vehiculos-empresa',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
    MatMenuModule, MatDividerModule, MatChipsModule,
    MatPaginatorModule, MatTabsModule, MatBadgeModule, MatDialogModule,
    MatExpansionModule, MatCheckboxModule
  ],
  styleUrls: ['./vehiculos-empresa.component.scss'],
  template: `
    <div class="page-container">
      <!-- HEADER BANNER -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-with-icon">
            <mat-icon class="header-icon">business</mat-icon>
            <div>
              <h1>Vehículos por Empresa</h1>
              <p class="subtitle">Flota habilitada y cronología de cambios por resolución primigenia</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button mat-button class="header-action-btn" (click)="irACargaMasiva()" matTooltip="Importar desde Excel / Google Sheets">
            <mat-icon class="btn-icon">upload_file</mat-icon>
            <span class="btn-text">Carga Masiva</span>
          </button>
        </div>
      </div>

      <div class="content-section">
        <!-- ====================================================
             TOGGLE DE VISTA: POR EMPRESA / CRONOLÓGICA
        ===================================================== -->
        <div class="view-switcher glass-filters">
          <div class="vista-tabs">
            <button class="vista-tab" [class.active]="vistaActual() === 'empresa'" (click)="cambiarVista('empresa')">
              <mat-icon>business</mat-icon> Vista por Empresa
            </button>
            <button class="vista-tab" [class.active]="vistaActual() === 'cronologica'" (click)="cambiarVista('cronologica')">
              <mat-icon>timeline</mat-icon> Vista Cronológica
            </button>
          </div>
        </div>

        <!-- ====================================================
             VISTA POR EMPRESA
        ===================================================== -->
        @if (vistaActual() === 'empresa') {
          @if (!empresaSeleccionada()) {
            <!-- LISTA DE TODAS LAS EMPRESAS REGISTRADAS (TARJETAS/RESUMEN) -->
            <div class="empresas-catalog-container">
              <div class="catalog-header-bar" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
                <div>
                  <h3 style="margin:0;font-size:18px;font-weight:700;color:#1e293b;">Catálogo de Empresas de Transporte</h3>
                  <p style="margin:2px 0 0;font-size:13px;color:#64748b;">Selecciona una empresa para gestionar y consultar su flota habilitada</p>
                </div>
                <mat-form-field appearance="outline" style="min-width:280px;" subscriptSizing="dynamic">
                  <mat-icon matPrefix>search</mat-icon>
                  <input matInput [formControl]="empresaSearchControl" placeholder="Filtrar por RUC o Razón Social...">
                  @if (empresaSearchControl.value) {
                    <button mat-icon-button matSuffix (click)="empresaSearchControl.setValue('')">
                      <mat-icon>close</mat-icon>
                    </button>
                  }
                </mat-form-field>
              </div>

              @if (isLoadingEmpresasCatalog()) {
                <div class="loading-container">
                  <mat-spinner diameter="40"></mat-spinner>
                  <p>Cargando lista de empresas de transporte...</p>
                </div>
              } @else if (empresasCatalogFiltrado().length === 0) {
                <mat-card class="empty-state">
                  <mat-card-content>
                    <mat-icon class="empty-icon">business_center</mat-icon>
                    <h3>No se encontraron empresas</h3>
                    <p>Importa registros usando Carga Masiva o ajusta el filtro de búsqueda.</p>
                  </mat-card-content>
                </mat-card>
              } @else {
                <div class="empresas-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px;">
                  @for (emp of empresasCatalogFiltrado(); track emp.ruc) {
                    <mat-card class="empresa-card-item glass-panel" style="cursor:pointer;transition:transform 0.2s, box-shadow 0.2s;"
                              (click)="seleccionarEmpresaDelCatalogo(emp.ruc)">
                      <mat-card-header>
                        <mat-icon mat-card-avatar style="font-size:28px;width:28px;height:28px;color:#3b82f6;">store</mat-icon>
                        <mat-card-title style="font-size:14px;font-weight:800;color:#1e1b4b;margin-bottom:2px;">
                          {{ emp.razon_social }}
                        </mat-card-title>
                        <mat-card-subtitle>
                          <span class="code-badge" style="background:#eff6ff;color:#1d4ed8;font-weight:700;">RUC: {{ emp.ruc }}</span>
                        </mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content style="padding-top:12px;">
                        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
                          <span class="stat-pill total-pill" style="background:#eff6ff;color:#2563eb;font-size:11px;padding:3px 8px;border-radius:12px;">
                            <mat-icon style="font-size:13px;width:13px;height:13px;">directions_car</mat-icon> {{ emp.total_vehiculos }} Vehículos
                          </span>
                          <span class="stat-pill hab-pill" style="background:#f0fdf4;color:#16a34a;font-size:11px;padding:3px 8px;border-radius:12px;">
                            <mat-icon style="font-size:13px;width:13px;height:13px;">check_circle</mat-icon> {{ emp.habilitados }} Hab.
                          </span>
                        </div>
                        @if (emp.primigenias && emp.primigenias.length) {
                          <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
                            <span style="font-size:10px;color:#64748b;font-weight:600;">Autorizaciones:</span>
                            @for (p of emp.primigenias.slice(0, 2); track p) {
                              <span class="code-badge prim-badge" style="font-size:10px;padding:2px 6px;">{{ p }}</span>
                            }
                            @if (emp.primigenias.length > 2) {
                              <span style="font-size:10px;color:#94a3b8;">+{{ emp.primigenias.length - 2 }}</span>
                            }
                          </div>
                        }
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              }
            </div>
          } @else {
            <!-- BARRA DE NAVEGACIÓN Y DETALLE DE LA EMPRESA SELECCIONADA -->
            <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px;">
              <button mat-stroked-button (click)="limpiarEmpresaSeleccionada()" style="background:#fff;">
                <mat-icon>arrow_back</mat-icon> Volver a la Lista de Empresas
              </button>
              <span style="font-size:14px;font-weight:700;color:#334155;">
                Mostrando flota de: <strong>{{ razonSocialEmpresa() }}</strong> (RUC: {{ empresaSearchControl.value }})
              </span>
            </div>

            <!-- Estadísticas de la empresa -->
            @if (estadisticas()) {
              <div class="empresa-stats-bar animate-fade-in" style="margin-bottom:16px;">
                <div class="empresa-name-badge">
                  <mat-icon>store</mat-icon>
                  <div>
                    <strong>{{ estadisticas()!.ruc }}</strong>
                    <span class="razon-social-hint">{{ razonSocialEmpresa() }}</span>
                  </div>
                </div>
                <div class="stats-pills">
                  <span class="stat-pill total-pill">
                    <mat-icon>format_list_numbered</mat-icon> {{ estadisticas()!.total_vehiculos_activos }} Vehículos
                  </span>
                  <span class="stat-pill hab-pill" matTooltip="Habilitados">
                    <mat-icon>check_circle</mat-icon> {{ estadisticas()!.habilitados }}
                  </span>
                  <span class="stat-pill inhab-pill" matTooltip="Inhabilitados">
                    <mat-icon>block</mat-icon> {{ estadisticas()!.inhabilitados }}
                  </span>
                </div>
              </div>
            }

            <!-- ACCORDEÓN DETALLES DE LA EMPRESA Y RUTAS POR AUTORIZACIÓN PRIMIGENIA -->
            <mat-accordion class="empresa-accordion-container" style="margin-bottom:16px;display:block;">
              <mat-expansion-panel class="glass-panel empresa-accordion" style="border-radius:12px;overflow:hidden;" [expanded]="true">
                <mat-expansion-panel-header style="height: auto; padding: 14px 20px;">
                  <mat-panel-title style="display:flex;align-items:center;gap:10px;font-weight:800;color:#1e293b;font-size:15px;">
                    <mat-icon style="color:#3b82f6;">domain</mat-icon>
                    <span>Detalles de la Empresa y Rutas por Autorización Primigenia</span>
                  </mat-panel-title>
                  <mat-panel-description style="font-size:12px;color:#64748b;display:flex;align-items:center;gap:8px;">
                    <span>{{ rutasPorPrimigenia().length }} autorización(es) primigenia(s)</span>
                  </mat-panel-description>
                </mat-expansion-panel-header>

                <div class="accordion-content-body" style="padding:16px 8px;">
                  <!-- DATOS OFICIALES DE LA EMPRESA (RUC, REPRESENTANTE LEGAL, TELÉFONO, EMAIL, DIRECCIÓN) -->
                  <div class="empresa-info-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;margin-bottom:20px;background:rgba(241,245,249,0.75);padding:14px;border-radius:10px;border:1px solid #e2e8f0;">
                    <div class="info-block">
                      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Razón Social</div>
                      <div style="font-size:14px;font-weight:800;color:#1e293b;">{{ getRazonSocialEmpresa(empresaDetalle()) }}</div>
                    </div>
                    <div class="info-block">
                      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">RUC</div>
                      <div style="font-size:13px;font-weight:700;color:#2563eb;font-family:monospace;">{{ empresaSearchControl.value }}</div>
                    </div>
                    <div class="info-block">
                      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Representante Legal</div>
                      <div style="font-size:13px;font-weight:700;color:#0f172a;">
                        {{ getRepresentanteLegalNombre(empresaDetalle()) }}
                        @if (getRepresentanteLegalDni(empresaDetalle())) {
                          <span style="font-size:11px;color:#64748b;font-weight:500;"> (DNI: {{ getRepresentanteLegalDni(empresaDetalle()) }})</span>
                        }
                      </div>
                    </div>
                    <div class="info-block">
                      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Teléfono / Contacto</div>
                      <div style="font-size:13px;font-weight:600;color:#334155;">{{ getTelefonoEmpresa(empresaDetalle()) }}</div>
                    </div>
                    <div class="info-block">
                      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Correo Electrónico</div>
                      <div style="font-size:13px;font-weight:600;color:#334155;">{{ getEmailEmpresa(empresaDetalle()) }}</div>
                    </div>
                    <div class="info-block" style="grid-column: 1 / -1;">
                      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Dirección Fiscal</div>
                      <div style="font-size:13px;font-weight:500;color:#334155;">{{ getDireccionEmpresa(empresaDetalle()) }}</div>
                    </div>
                  </div>

                  <mat-divider style="margin-bottom:16px;"></mat-divider>

                  <h4 style="margin:0 0 12px;font-size:13px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:0.05em;display:flex;align-items:center;gap:6px;">
                    <mat-icon style="font-size:16px;width:16px;height:16px;color:#10b981;">verified</mat-icon>
                    Resoluciones Autoritativas Primigenias y Rutas Habilitadas
                  </h4>

                  <div class="prim-rutas-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:12px;">
                    @for (item of rutasPorPrimigenia(); track item.primigenia) {
                      <div class="prim-ruta-card" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                          <span class="code-badge prim-badge" [class.prim-inactiva]="item.estado === 'CANCELADA' || item.estado === 'INACTIVA' || item.estado === 'VENCIDA'">
                            {{ item.primigenia }}
                          </span>
                          <span class="status-pill"
                                [class.status-habilitado]="item.estado === 'VIGENTE' || item.estado === 'ACTIVA'"
                                [class.status-cancelado]="item.estado === 'CANCELADA' || item.estado === 'INACTIVA' || item.estado === 'VENCIDA'">
                            {{ item.estado || 'VIGENTE' }}
                          </span>
                        </div>

                        <!-- FECHAS Y VIGENCIA OFICIAL DE LA RESOLUCIÓN PRIMIGENIA -->
                        <div style="font-size:11px;color:#475569;margin-bottom:8px;display:flex;flex-direction:column;gap:3px;background:rgba(241,245,249,0.8);padding:8px 10px;border-radius:6px;">
                          @if (item.fechaEmision) {
                            <div>F. Emisión: <strong>{{ item.fechaEmision | date:'dd/MM/yyyy' }}</strong></div>
                          }
                          @if (item.fechaInicioVigencia) {
                            <div>Inicio Vigencia: <strong>{{ item.fechaInicioVigencia | date:'dd/MM/yyyy' }}</strong></div>
                          }
                          @if (item.vigenciaHasta) {
                            <div>
                              Fin Vigencia: <strong>{{ item.vigenciaHasta | date:'dd/MM/yyyy' }}</strong>
                              @if (item.aniosVigencia) {
                                <span> ({{ item.aniosVigencia }} Años)</span>
                              }
                            </div>
                          }
                          @if (item.count > 0) {
                            <div style="color:#2563eb;font-weight:600;">Flota Habilitada: {{ item.count }} vehículo(s)</div>
                          }
                        </div>

                        <!-- RUTAS DESGLOSADAS -->
                        <div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;">
                          Rutas autorizadas en el módulo de rutas ({{ item.rutasArray.length }}):
                        </div>
                        <div style="display:flex;flex-direction:column;gap:4px;">
                          @for (r of item.rutasArray; track r) {
                            <span class="ruta-chip" style="font-size:11px;padding:4px 8px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" [matTooltip]="getRutaInfoTooltip(r)">
                              <mat-icon style="font-size:14px;width:14px;height:14px;">alt_route</mat-icon>
                              {{ getRutaNombreCompleto(r) }}
                            </span>
                          }
                          @if (!item.rutasArray.length) {
                            <span style="font-size:11px;color:#cbd5e1;font-style:italic;">Sin rutas registradas</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </mat-expansion-panel>
            </mat-accordion>

            <!-- FILTROS Y SELECTOR DE PRIMIGENIAS POR TABS -->
            @if (primigeniasDisponibles().length > 1) {
              <div class="primigenias-tabs-bar" style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:12px;font-weight:700;color:#475569;">Filtrar por Primigenia:</span>
                <button mat-stroked-button [class.active-prim-btn]="primigeniaFiltro() === ''" (click)="primigeniaFiltro.set('')">
                  <mat-icon>view_module</mat-icon> Todas ({{ totalVehiculosEmpresaSinFiltro() }})
                </button>
                @for (prim of primigeniasDisponibles(); track prim) {
                  <button mat-stroked-button [class.active-prim-btn]="primigeniaFiltro() === prim" (click)="primigeniaFiltro.set(prim)">
                    <mat-icon>verified</mat-icon> {{ prim }}
                    <span class="prim-count-pill">({{ getCantidadPorPrimigenia(prim) }})</span>
                  </button>
                }
              </div>
            }

            <div class="glass-filters">
              <div class="filters-bar">
                <div class="search-and-toggle">
                  <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
                    <mat-icon matPrefix class="search-icon">search</mat-icon>
                    <input matInput [formControl]="searchControl" placeholder="Buscar placa, TUC, resolución...">
                    @if (searchControl.value) {
                      <button mat-icon-button matSuffix (click)="searchControl.setValue('')">
                        <mat-icon>close</mat-icon>
                      </button>
                    }
                  </mat-form-field>
                </div>

                <!-- Filtros de estado rápidos -->
                <div class="collapsible-filters show">
                  <mat-form-field appearance="outline" class="filter-select" subscriptSizing="dynamic">
                    <mat-label>Estado</mat-label>
                    <mat-select [formControl]="estadoControl">
                      <mat-option value="">Todos los estados</mat-option>
                      <mat-option value="HABILITADO">Habilitado</mat-option>
                      <mat-option value="INHABILITADO">Inhabilitado</mat-option>
                      <mat-option value="OBSERVADO">Observado</mat-option>
                      <mat-option value="CANCELADO">Cancelado</mat-option>
                      <mat-option value="SUSPENDIDO">Suspendido</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="filter-select" subscriptSizing="dynamic">
                    <mat-label>Tipo Res. Hija</mat-label>
                    <mat-select [formControl]="tipoHijaControl">
                      <mat-option value="">Todos</mat-option>
                      <mat-option value="I">I - Incremento</mat-option>
                      <mat-option value="S">S - Sustitución</mat-option>
                      <mat-option value="M">M - Modificación</mat-option>
                      <mat-option value="O">O - Otros</mat-option>
                      <mat-option value="C">C - Cancelación</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <!-- BOTÓN CONFIGURACIÓN DE COLUMNAS -->
                  <button mat-stroked-button [matMenuTriggerFor]="colsMenu" class="filter-action-btn" style="background:#fff;border-color:#cbd5e1;">
                    <mat-icon style="color:#475569;">view_column</mat-icon> Columnas
                  </button>

                  <mat-menu #colsMenu="matMenu" class="cols-menu-panel">
                    <div style="padding:8px 16px;font-weight:800;font-size:11px;color:#64748b;letter-spacing:0.05em;">CONFIGURACIÓN DE COLUMNAS</div>
                    <mat-divider></mat-divider>
                    <button mat-menu-item (click)="$event.stopPropagation()">
                      <mat-checkbox [checked]="columnasVisibles().primigenia" (change)="toggleColumna('primigenia')">
                        Resolución Primigenia
                      </mat-checkbox>
                    </button>
                    <button mat-menu-item (click)="$event.stopPropagation()">
                      <mat-checkbox [checked]="columnasVisibles().placaHija" (change)="toggleColumna('placaHija')">
                        Placa / Res. Hija
                      </mat-checkbox>
                    </button>
                    <button mat-menu-item (click)="$event.stopPropagation()">
                      <mat-checkbox [checked]="columnasVisibles().rutas" (change)="toggleColumna('rutas')">
                        Rutas
                      </mat-checkbox>
                    </button>
                    <button mat-menu-item (click)="$event.stopPropagation()">
                      <mat-checkbox [checked]="columnasVisibles().tuc" (change)="toggleColumna('tuc')">
                        TUC
                      </mat-checkbox>
                    </button>
                    <button mat-menu-item (click)="$event.stopPropagation()">
                      <mat-checkbox [checked]="columnasVisibles().estado" (change)="toggleColumna('estado')">
                        Estado
                      </mat-checkbox>
                    </button>
                    <button mat-menu-item (click)="$event.stopPropagation()">
                      <mat-checkbox [checked]="columnasVisibles().expediente" (change)="toggleColumna('expediente')">
                        Expediente
                      </mat-checkbox>
                    </button>
                    <button mat-menu-item (click)="$event.stopPropagation()">
                      <mat-checkbox [checked]="columnasVisibles().fecha" (change)="toggleColumna('fecha')">
                        Fecha
                      </mat-checkbox>
                    </button>
                    <button mat-menu-item (click)="$event.stopPropagation()">
                      <mat-checkbox [checked]="columnasVisibles().links" (change)="toggleColumna('links')">
                        Links / Archivos
                      </mat-checkbox>
                    </button>
                    <button mat-menu-item (click)="$event.stopPropagation()">
                      <mat-checkbox [checked]="columnasVisibles().observaciones" (change)="toggleColumna('observaciones')">
                        Observaciones / Detalles
                      </mat-checkbox>
                    </button>
                  </mat-menu>

                  @if (searchControl.value || estadoControl.value || tipoHijaControl.value || primigeniaFiltro()) {
                    <button mat-button (click)="limpiarFiltros(); primigeniaFiltro.set('')" class="filter-action-btn btn-reset">
                      <mat-icon>filter_alt_off</mat-icon> Limpiar
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- BARRA DE ACCIÓN MULTI-SELECCIÓN -->
            @if (selectedIds().size > 0) {
              <div class="bulk-action-bar animate-fade-in" style="background:linear-gradient(135deg, #1e1b4b, #312e81);color:#fff;padding:12px 20px;border-radius:12px;margin-bottom:12px;display:flex;align-items:center;justify-space:space-between;flex-wrap:wrap;gap:12px;box-shadow:0 4px 14px rgba(30,27,75,0.25);">
                <div style="display:flex;align-items:center;gap:10px;">
                  <mat-icon style="color:#818cf8;">check_box</mat-icon>
                  <span style="font-size:14px;font-weight:600;">
                    <strong>{{ selectedIds().size }}</strong> vehículo(s) seleccionado(s)
                  </span>
                </div>
                <div style="display:flex;gap:10px;align-items:center;">
                  <button mat-raised-button color="accent" (click)="exportarSeleccionados()">
                    <mat-icon>file_download</mat-icon> Exportar Seleccionados (CSV / Excel)
                  </button>
                  <button mat-stroked-button style="color:#fff;border-color:rgba(255,255,255,0.3);" (click)="clearSelection()">
                    Deseleccionar todo
                  </button>
                </div>
              </div>
            }

            <!-- TABLA VISTA POR EMPRESA -->
            @if (flotaEmpresaFiltrada().length === 0) {
              <mat-card class="empty-state">
                <mat-card-content>
                  <mat-icon class="empty-icon">directions_car</mat-icon>
                  <h3>No se encontraron vehículos</h3>
                  <p>Ajusta los filtros o importa datos desde Carga Masiva.</p>
                </mat-card-content>
              </mat-card>
            } @else {
              <mat-card class="table-card">
                <mat-card-content>
                  <div class="table-meta-bar">
                    <span class="total-label">
                      {{ flotaEmpresaFiltrada().length.toLocaleString() }} vehículo(s) encontrado(s)
                    </span>
                  </div>
                  <div class="table-container">
                    <table class="custom-table">
                      <thead>
                        <tr>
                          <!-- COLUMNA CHECKBOX MULTI-SELECCIÓN -->
                          <th style="width:40px;" class="text-center">
                            <mat-checkbox (change)="toggleSelectAll($event)" [checked]="isAllSelected()" [indeterminate]="isPartiallySelected()"></mat-checkbox>
                          </th>
                          @if (columnasVisibles().primigenia) {
                            <th (click)="toggleSort('nro_resolucion_primigenia')" class="sortable-th sticky-col-left">
                              <span>Resolución Primigenia</span>
                              <mat-icon class="sort-icon">{{ getSortIcon('nro_resolucion_primigenia') }}</mat-icon>
                            </th>
                          }
                          @if (columnasVisibles().placaHija) {
                            <th (click)="toggleSort('placa')" class="sortable-th">
                              <span>Placa / Res. Hija</span>
                              <mat-icon class="sort-icon">{{ getSortIcon('placa') }}</mat-icon>
                            </th>
                          }
                          @if (columnasVisibles().rutas) { <th>Rutas</th> }
                          @if (columnasVisibles().tuc) {
                            <th (click)="toggleSort('numero_tuc')" class="sortable-th">
                              <span>TUC</span>
                              <mat-icon class="sort-icon">{{ getSortIcon('numero_tuc') }}</mat-icon>
                            </th>
                          }
                          @if (columnasVisibles().estado) {
                            <th (click)="toggleSort('estado')" class="sortable-th">
                              <span>Estado</span>
                              <mat-icon class="sort-icon">{{ getSortIcon('estado') }}</mat-icon>
                            </th>
                          }
                          @if (columnasVisibles().expediente) { <th>Expediente</th> }
                          @if (columnasVisibles().fecha) { <th>Fecha</th> }
                          @if (columnasVisibles().links) { <th>Links / Archivos</th> }
                          @if (columnasVisibles().observaciones) { <th>Observaciones / Detalles</th> }
                          <th class="sticky-col-right text-center th-actions-icon-col">
                            <mat-icon class="th-actions-icon">settings</mat-icon>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of paginatedFlota(); track item.id) {
                          <tr [class.row-cancelada]="item.estado === 'CANCELADO' || item.estado_primigenia === 'CANCELADA' || item.estado_primigenia === 'INACTIVA'">
                            <!-- CHECKBOX FILA -->
                            <td class="text-center">
                              <mat-checkbox (change)="toggleSelectRow(item.id)" [checked]="isSelectedRow(item.id)"></mat-checkbox>
                            </td>
                            <!-- Resolución Primigenia -->
                            @if (columnasVisibles().primigenia) {
                              <td class="sticky-col-left">
                                <span class="code-badge prim-badge" [class.prim-inactiva]="item.estado_primigenia === 'CANCELADA' || item.estado_primigenia === 'INACTIVA'">
                                  {{ item.nro_resolucion_primigenia }}
                                </span>
                                <div class="prim-estado" [class.activa]="item.estado_primigenia === 'ACTIVA'" [class.cancelada]="item.estado_primigenia === 'CANCELADA' || item.estado_primigenia === 'INACTIVA'">
                                  {{ item.estado_primigenia || 'VIGENTE' }}
                                </div>
                                @if (item.fecha_vigencia_hasta) {
                                  <div style="font-size:10px;color:#64748b;margin-top:2px;">
                                    Vence: {{ item.fecha_vigencia_hasta | date:'dd/MM/yyyy' }}
                                  </div>
                                }
                              </td>
                            }
                            <!-- Placa + Res. Hija -->
                            @if (columnasVisibles().placaHija) {
                              <td style="white-space:nowrap;">
                                <div style="display:flex;flex-direction:column;gap:3px;align-items:flex-start;">
                                  <span class="ruc-badge placa-badge" style="white-space:nowrap;">{{ item.placa }}</span>
                                  @if (item.nro_resolucion_hija) {
                                    <div style="display:flex;align-items:center;gap:4px;white-space:nowrap;">
                                      <span class="code-badge hija-badge" style="white-space:nowrap;" [matTooltip]="getTipoHijaLabel(item.tipo_resolucion_hija)">
                                        {{ item.nro_resolucion_hija }}
                                      </span>
                                    </div>
                                  }
                                </div>
                              </td>
                            }
                            <!-- Rutas -->
                            @if (columnasVisibles().rutas) {
                              <td>
                                @if (item.rutas && item.rutas.length) {
                                  <div class="rutas-cell">
                                    @for (r of item.rutas.slice(0, 3); track r) {
                                      <span class="ruta-chip">{{ r }}</span>
                                    }
                                    @if (item.rutas.length > 3) {
                                      <span class="ruta-chip more-chip" [matTooltip]="item.rutas.join(', ')">
                                        +{{ item.rutas.length - 3 }}
                                      </span>
                                    }
                                  </div>
                                } @else {
                                  <span class="sin-datos">-</span>
                                }
                              </td>
                            }
                            <!-- TUC -->
                            @if (columnasVisibles().tuc) {
                              <td style="white-space:nowrap;">
                                @if (item.numero_tuc) {
                                  <span class="tuc-badge" style="white-space:nowrap;" matTooltip="Número TUC oficial">{{ item.numero_tuc }}</span>
                                } @else {
                                  <span class="sin-datos">-</span>
                                }
                              </td>
                            }
                            <!-- Estado -->
                            @if (columnasVisibles().estado) {
                              <td>
                                @if (item.estado) {
                                  <span [class]="'status-pill status-' + item.estado.toLowerCase()">
                                    {{ item.estado }}
                                  </span>
                                } @else {
                                  <span class="sin-datos">-</span>
                                }
                              </td>
                            }
                            <!-- Expediente opcional -->
                            @if (columnasVisibles().expediente) {
                              <td style="font-family:monospace;font-size:12px;">
                                {{ item.expediente || item.num_expediente || '-' }}
                              </td>
                            }
                            <!-- Fecha opcional -->
                            @if (columnasVisibles().fecha) {
                              <td style="font-family:monospace;font-size:12px;">
                                {{ (item.fecha_resolucion_hija || item.fecha_expediente) ? ((item.fecha_resolucion_hija || item.fecha_expediente) | date:'dd/MM/yyyy') : '-' }}
                              </td>
                            }
                            <!-- Links / Archivos -->
                            @if (columnasVisibles().links) {
                              <td>
                                <div style="display:flex;gap:4px;align-items:center;">
                                  @if (item.link_tuc) {
                                    <a [href]="item.link_tuc" target="_blank" mat-icon-button color="primary" matTooltip="Ver TUC en Drive">
                                      <mat-icon style="font-size:18px;">description</mat-icon>
                                    </a>
                                  }
                                  @if (item.link_notificacion) {
                                    <a [href]="item.link_notificacion" target="_blank" mat-icon-button color="accent" matTooltip="Ver Notificación en Drive">
                                      <mat-icon style="font-size:18px;">mark_email_read</mat-icon>
                                    </a>
                                  }
                                  @if (!item.link_tuc && !item.link_notificacion) {
                                    <span class="sin-datos">-</span>
                                  }
                                </div>
                              </td>
                            }
                            <!-- Observaciones / Detalles -->
                            @if (columnasVisibles().observaciones) {
                              <td>
                                <div style="display:flex;flex-direction:column;gap:2px;">
                                  @if (item.observaciones_historial && item.observaciones_historial.length) {
                                    <span class="obs-text"
                                          [matTooltip]="item.observaciones_historial[item.observaciones_historial.length-1].texto">
                                      {{ item.observaciones_historial[item.observaciones_historial.length-1].texto | slice:0:28 }}
                                      {{ item.observaciones_historial.length > 1 ? '(+' + (item.observaciones_historial.length - 1) + ')' : '' }}
                                    </span>
                                  }
                                  @if (item.detalles) {
                                    <span style="font-size:11px;color:#475569;font-style:italic;" [matTooltip]="item.detalles">
                                      {{ item.detalles | slice:0:25 }}
                                    </span>
                                  }
                                  @if ((!item.observaciones_historial || !item.observaciones_historial.length) && !item.detalles) {
                                    <span class="sin-datos">-</span>
                                  }
                                </div>
                              </td>
                            }
                            <!-- Acciones -->
                            <td class="sticky-col-right text-center">
                              <button mat-icon-button [matMenuTriggerFor]="actionMenu"
                                      [matMenuTriggerData]="{ item: item }">
                                <mat-icon>more_vert</mat-icon>
                              </button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <!-- Menú de acciones CRUD -->
                  <mat-menu #actionMenu="matMenu">
                    <ng-template matMenuContent let-item="item">
                      <button mat-menu-item (click)="abrirDetalle(item)">
                        <mat-icon color="primary">visibility</mat-icon>
                        <span>Ver Detalle Completo</span>
                      </button>
                      <button mat-menu-item (click)="abrirEditar(item)">
                        <mat-icon style="color:#d97706;">edit</mat-icon>
                        <span>Editar Registro</span>
                      </button>
                      <button mat-menu-item (click)="verCronologiaPrimigenia(item.nro_resolucion_primigenia)">
                        <mat-icon style="color:#0d9488;">timeline</mat-icon>
                        <span>Ver Cronología Primigenia</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item (click)="eliminarRegistro(item.id)">
                        <mat-icon color="warn">delete</mat-icon>
                        <span>Eliminar Registro</span>
                      </button>
                    </ng-template>
                  </mat-menu>

                  <!-- Paginador -->
                  <mat-paginator
                    [length]="flotaEmpresaFiltrada().length"
                    [pageSize]="pageSize()"
                    [pageIndex]="pageIndex()"
                    [pageSizeOptions]="[10, 25, 50, 100]"
                    (page)="onPageChange($event)"
                    showFirstLastButtons>
                  </mat-paginator>
                </mat-card-content>
              </mat-card>
            }
          }
        }

        <!-- ====================================================
             VISTA CRONOLÓGICA (TODAS las filas incluyendo guiones)
        ===================================================== -->
        @if (vistaActual() === 'cronologica') {
          <!-- Filtros cronológica -->
          <div class="glass-filters">
            <div class="filters-bar">
              <div class="search-and-toggle">
                <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
                  <mat-icon matPrefix class="search-icon">search</mat-icon>
                  <input matInput [formControl]="searchCronoControl"
                         placeholder="Buscar RUC, placa, resolución, TUC...">
                  @if (searchCronoControl.value) {
                    <button mat-icon-button matSuffix (click)="searchCronoControl.setValue('')">
                      <mat-icon>close</mat-icon>
                    </button>
                  }
                </mat-form-field>
              </div>
              <div class="collapsible-filters show">
                <mat-form-field appearance="outline" class="filter-select" subscriptSizing="dynamic">
                  <mat-label>Estado</mat-label>
                  <mat-select [formControl]="estadoCronoControl">
                    <mat-option value="">Todos</mat-option>
                    <mat-option value="HABILITADO">Habilitado</mat-option>
                    <mat-option value="INHABILITADO">Inhabilitado</mat-option>
                    <mat-option value="OBSERVADO">Observado</mat-option>
                    <mat-option value="CANCELADO">Cancelado</mat-option>
                    <mat-option value="SUSPENDIDO">Suspendido</mat-option>
                  </mat-select>
                </mat-form-field>

                <button mat-raised-button color="accent" [disabled]="isLoadingCrono()"
                        (click)="cargarVistaCronologica()">
                  <mat-icon [class.spin-icon]="isLoadingCrono()">
                    {{ isLoadingCrono() ? 'sync' : 'refresh' }}
                  </mat-icon>
                  Cargar
                </button>
              </div>
            </div>
          </div>

          @if (isLoadingCrono()) {
            <div class="loading-container">
              <mat-spinner diameter="48"></mat-spinner>
              <p>Cargando vista cronológica...</p>
            </div>
          } @else {
            <!-- Tabla cronológica -->
            @if (flotaCronologicaFiltrada().length === 0) {
              <mat-card class="empty-state">
                <mat-card-content>
                  <mat-icon class="empty-icon">timeline</mat-icon>
                  <h3>Sin registros cronológicos</h3>
                  <p>Importa datos usando la Carga Masiva para ver el historial completo.</p>
                </mat-card-content>
              </mat-card>
            } @else {
              <mat-card class="table-card">
                <mat-card-content>
                  <div class="table-meta-bar">
                    <span class="total-label">
                      {{ flotaCronologicaFiltrada().length.toLocaleString() }} registros cronológicos
                      (incluye entradas sin vehículo)
                    </span>
                  </div>
                  <div class="table-container">
                    <table class="custom-table">
                      <thead>
                        <tr>
                          <th class="sticky-col-left">RUC / Empresa</th>
                          <th>Resolución Primigenia</th>
                          <th>Res. Hija</th>
                          <th>Placa</th>
                          <th>Rutas</th>
                          <th>TUC</th>
                          <th>Estado</th>
                          <th>Fecha Cronológica</th>
                          <th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of paginatedCronologica(); track item.id) {
                          <tr [class.crono-row]="item.es_cronologico">
                            <td class="sticky-col-left">
                              <div style="display:flex;flex-direction:column;gap:2px;">
                                <span class="ruc-badge">{{ item.ruc }}</span>
                                @if (item.razon_social) {
                                  <span class="empresa-hint-text">{{ item.razon_social | slice:0:25 }}</span>
                                }
                              </div>
                            </td>
                            <td><span class="code-badge prim-badge">{{ item.nro_resolucion_primigenia }}</span></td>
                            <td>
                              @if (item.nro_resolucion_hija) {
                                <div class="hija-cell">
                                  <span class="tipo-hija-badge tipo-{{ item.tipo_resolucion_hija?.toLowerCase() }}">
                                    {{ item.tipo_resolucion_hija }}
                                  </span>
                                  <span style="font-size:11px;">{{ item.nro_resolucion_hija }}</span>
                                </div>
                              } @else { <span class="sin-datos">-</span> }
                            </td>
                            <td>
                              @if (item.placa === '-' || item.es_cronologico) {
                                <span class="crono-placa" matTooltip="Registro solo cronológico">—</span>
                              } @else {
                                <span class="ruc-badge placa-badge">{{ item.placa }}</span>
                              }
                            </td>
                            <td>
                              @if (item.rutas && item.rutas.length) {
                                <div class="rutas-cell">
                                  @for (r of item.rutas.slice(0, 2); track r) {
                                    <span class="ruta-chip">{{ r }}</span>
                                  }
                                  @if (item.rutas.length > 2) {
                                    <span class="ruta-chip more-chip">+{{ item.rutas.length - 2 }}</span>
                                  }
                                </div>
                              } @else { <span class="sin-datos">-</span> }
                            </td>
                            <td>
                              @if (item.numero_tuc) {
                                <span class="tuc-badge">{{ item.numero_tuc }}</span>
                              } @else { <span class="sin-datos">-</span> }
                            </td>
                            <td>
                              @if (item.estado) {
                                <span [class]="'status-pill status-' + item.estado.toLowerCase()">{{ item.estado }}</span>
                              } @else {
                                <span class="sin-datos">—</span>
                              }
                            </td>
                            <td>
                              <span class="fecha-cell">
                                {{ (item.fecha_cronologica || item.fecha_resolucion_hija) | date:'dd/MM/yyyy' }}
                              </span>
                            </td>
                            <td>
                              @if (item.observaciones_historial && item.observaciones_historial.length) {
                                <span class="obs-text"
                                      [matTooltip]="item.observaciones_historial[item.observaciones_historial.length-1].texto">
                                  {{ item.observaciones_historial[item.observaciones_historial.length-1].texto | slice:0:28 }}
                                </span>
                              } @else { <span class="sin-datos">-</span> }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  <mat-paginator
                    [length]="flotaCronologicaFiltrada().length"
                    [pageSize]="pageSizeCrono()"
                    [pageIndex]="pageIndexCrono()"
                    [pageSizeOptions]="[25, 50, 100, 200]"
                    (page)="onPageChangeCrono($event)"
                    showFirstLastButtons>
                  </mat-paginator>
                </mat-card-content>
              </mat-card>
            }
          }
        }
      </div>
    </div>
  `
})
export class VehiculosEmpresaComponent implements OnInit {
  private service = inject(FlotaEmpresaService);
  private empresaService = inject(EmpresaService);
  private resolucionPrimigeniaService = inject(ResolucionPrimigeniaService);
  private rutaService = inject(RutaService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Vista activa
  vistaActual = signal<'empresa' | 'cronologica'>('empresa');

  // ---- Vista por empresa ----
  empresaSearchControl = new FormControl('');

  // Catálogo de empresas (Vista por tarjetas)
  empresasCatalog = signal<ResumenEmpresa[]>([]);
  isLoadingEmpresasCatalog = signal<boolean>(false);

  private empresaSearchValue = toSignal(this.empresaSearchControl.valueChanges.pipe(startWith('')), { initialValue: '' });

  empresasCatalogFiltrado = computed(() => {
    const list = this.empresasCatalog();
    const q = (this.empresaSearchValue() || '').toLowerCase().trim();
    if (!q) return list;
    return list.filter(e =>
      (e.ruc || '').includes(q) ||
      (e.razon_social || '').toLowerCase().includes(q)
    );
  });
  searchControl = new FormControl('');
  estadoControl = new FormControl('');
  tipoHijaControl = new FormControl('');

  private searchValue = toSignal(this.searchControl.valueChanges.pipe(startWith('')), { initialValue: '' });
  private estadoValue = toSignal(this.estadoControl.valueChanges.pipe(startWith('')), { initialValue: '' });
  private tipoHijaValue = toSignal(this.tipoHijaControl.valueChanges.pipe(startWith('')), { initialValue: '' });

  isLoadingEmpresa = signal(false);
  empresaSeleccionada = signal(false);
  flotaEmpresa = signal<VehiculoEmpresa[]>([]);
  estadisticas = signal<EstadisticasFlota | null>(null);
  razonSocialEmpresa = signal<string>('');

  // Datos oficiales integrados de la empresa, resoluciones primigenias y rutas
  empresaDetalle = signal<Empresa | null>(null);
  resolucionesPrimigeniasMatriz = signal<ResolucionPrimigenia[]>([]);
  rutasOficialesMap = signal<Map<string, Ruta>>(new Map());

  pageIndex = signal(0);
  pageSize = signal(25);
  sortField = signal('nro_resolucion_primigenia');
  sortDirection = signal<'asc' | 'desc'>('asc');

  primigeniaFiltro = signal<string>('');

  // Multi-selección de filas
  selectedIds = signal<Set<string>>(new Set());

  // Configuración de visualización de columnas
  columnasVisibles = signal<ColumnasState>({
    primigenia: true,
    placaHija: true,
    rutas: true,
    tuc: true,
    estado: true,
    expediente: false,
    fecha: false,
    links: true,
    observaciones: true
  });

  // Agrupación computada de rutas por resolución primigenia para el acordeón
  rutasPorPrimigenia = computed(() => {
    const map = new Map<string, {
      primigenia: string;
      fechaEmision?: string | Date;
      fechaInicioVigencia?: string | Date;
      vigenciaHasta?: string | Date;
      aniosVigencia?: number;
      estado: string;
      rutas: Set<string>;
      count: number;
    }>();

    const primFiltro = this.primigeniaFiltro();
    const matriz = this.resolucionesPrimigeniasMatriz();

    // 1. Cargar datos oficiales del módulo de Resoluciones Primigenias
    for (const res of matriz) {
      const key = (res.nro_resolucion || '').trim().toUpperCase();
      if (!key) continue;
      if (primFiltro && key !== primFiltro.toUpperCase()) continue;

      map.set(key, {
        primigenia: res.nro_resolucion,
        fechaEmision: res.fecha_resolucion,
        fechaInicioVigencia: res.fecha_inicio_vigencia,
        vigenciaHasta: res.fecha_fin_vigencia,
        aniosVigencia: res.anios_vigencia,
        estado: res.estado || 'VIGENTE',
        rutas: new Set<string>(),
        count: 0
      });
    }

    // 2. Acumular flota por empresa y rutas
    for (const v of this.flotaEmpresa()) {
      if (v.es_cronologico) continue;
      const key = (v.nro_resolucion_primigenia || 'SIN_PRIMIGENIA').trim().toUpperCase();
      if (primFiltro && key !== primFiltro.toUpperCase()) continue;

      if (!map.has(key)) {
        map.set(key, {
          primigenia: v.nro_resolucion_primigenia || 'S/N',
          vigenciaHasta: v.fecha_vigencia_hasta,
          estado: v.estado_primigenia || 'VIGENTE',
          rutas: new Set<string>(),
          count: 0
        });
      }
      const item = map.get(key)!;
      item.count++;
      if (v.rutas) {
        for (const r of v.rutas) {
          if (r && r.trim()) item.rutas.add(r.trim());
        }
      }
    }

    return Array.from(map.values()).map(v => ({
      ...v,
      rutasArray: Array.from(v.rutas).sort()
    }));
  });

  extractRazonSocial(emp: any): string {
    if (!emp) return '';
    if (typeof emp.razonSocial === 'string') return emp.razonSocial;
    if (emp.razonSocial?.principal) return emp.razonSocial.principal;
    if (emp.razonSocial?.sunat) return emp.razonSocial.sunat;
    if (emp.razon_social) return emp.razon_social;
    if (emp.datosSunat?.ddp_nombre) return emp.datosSunat.ddp_nombre;
    if (emp.datosSunat?.razonSocial) return emp.datosSunat.razonSocial;
    return '';
  }

  getRazonSocialEmpresa(emp: Empresa | null): string {
    const extracted = this.extractRazonSocial(emp);
    if (extracted) return extracted;
    if (this.razonSocialEmpresa()) return this.razonSocialEmpresa();
    if (this.flotaEmpresa().length > 0 && this.flotaEmpresa()[0].razon_social) {
      return this.flotaEmpresa()[0].razon_social || 'Sin Razón Social';
    }
    return 'Sin Razón Social';
  }

  getRepresentanteLegalNombre(emp: Empresa | null): string {
    if (!emp) return 'No registrado';
    if (emp.socios && emp.socios.length > 0) {
      const rep = emp.socios.find(s => String(s.tipoSocio).toUpperCase() === 'REPRESENTANTE_LEGAL');
      if (rep && (rep.nombres || rep.apellidos)) {
        return `${rep.nombres || ''} ${rep.apellidos || ''}`.trim();
      }
      const primerSocio = emp.socios[0];
      if (primerSocio && (primerSocio.nombres || primerSocio.apellidos)) {
        return `${primerSocio.nombres || ''} ${primerSocio.apellidos || ''}`.trim();
      }
    }
    const rl = (emp as any).representanteLegal;
    if (rl) {
      if (typeof rl === 'string') return rl;
      if (rl.nombreCompleto) return rl.nombreCompleto;
      if (rl.nombres || rl.apellidos) return `${rl.nombres || ''} ${rl.apellidos || ''}`.trim();
    }
    if (emp.datosSunat?.ddp_nombre) {
      return emp.datosSunat.ddp_nombre;
    }
    return 'No registrado';
  }

  getRepresentanteLegalDni(emp: Empresa | null): string {
    if (!emp) return '';
    if (emp.socios && emp.socios.length > 0) {
      const rep = emp.socios.find(s => String(s.tipoSocio).toUpperCase() === 'REPRESENTANTE_LEGAL');
      if (rep?.dni) return rep.dni;
      if (emp.socios[0]?.dni) return emp.socios[0].dni;
    }
    const rl = (emp as any).representanteLegal;
    if (rl && typeof rl === 'object' && rl.dni) {
      return rl.dni;
    }
    return '';
  }

  getTelefonoEmpresa(emp: Empresa | null): string {
    if (!emp) return 'No registrado';
    return emp.telefonoContacto || (emp as any).telefono_contacto || (emp as any).telefono || 'No registrado';
  }

  getEmailEmpresa(emp: Empresa | null): string {
    if (!emp) return 'No registrado';
    return emp.emailContacto || (emp as any).email_contacto || (emp as any).email || 'No registrado';
  }

  getDireccionEmpresa(emp: Empresa | null): string {
    if (!emp) return 'No registrada';
    return emp.direccionFiscal || (emp as any).direccion_fiscal || emp.datosSunat?.['direccion'] || 'No registrada';
  }

  getRutaNombreCompleto(codigoRuta: string): string {
    const key = (codigoRuta || '').trim().toUpperCase();
    const map = this.rutasOficialesMap();
    if (map.has(key)) {
      const r = map.get(key)!;
      const origenNom = r.origen?.nombre || 'Origen';
      const destinoNom = r.destino?.nombre || 'Destino';
      return `Ruta ${r.codigoRuta}: ${r.nombre || `${origenNom} - ${destinoNom}`}`;
    }
    return `Ruta ${codigoRuta}`;
  }

  getRutaInfoTooltip(codigoRuta: string): string {
    const key = (codigoRuta || '').trim().toUpperCase();
    const map = this.rutasOficialesMap();
    if (map.has(key)) {
      const r = map.get(key)!;
      const origenNom = r.origen?.nombre || 'Origen';
      const destinoNom = r.destino?.nombre || 'Destino';
      return `Ruta ${r.codigoRuta}: ${r.nombre || `${origenNom} - ${destinoNom}`} (${r.tipoServicio || 'PASAJEROS'})`;
    }
    return `Código de Ruta: ${codigoRuta}`;
  }

  cargarRutasOficiales(): void {
    this.rutaService.getRutas().subscribe({
      next: (rutas) => {
        const map = new Map<string, Ruta>();
        for (const r of rutas) {
          if (r.codigoRuta) {
            map.set(r.codigoRuta.trim().toUpperCase(), r);
          }
        }
        this.rutasOficialesMap.set(map);
      },
      error: (err) => console.warn('Error cargando rutas oficiales:', err)
    });
  }

  toggleColumna(col: keyof ColumnasState): void {
    const current = { ...this.columnasVisibles() };
    current[col] = !current[col];
    this.columnasVisibles.set(current);
  }

  toggleSelectRow(id: string): void {
    const set = new Set(this.selectedIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.selectedIds.set(set);
  }

  toggleSelectAll(e: any): void {
    if (e.checked) {
      const ids = this.flotaEmpresaFiltrada().map(i => i.id);
      this.selectedIds.set(new Set(ids));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  isAllSelected(): boolean {
    const filtered = this.flotaEmpresaFiltrada();
    if (!filtered.length) return false;
    return filtered.every(i => this.selectedIds().has(i.id));
  }

  isPartiallySelected(): boolean {
    const filtered = this.flotaEmpresaFiltrada();
    const sel = this.selectedIds();
    const count = filtered.filter(i => sel.has(i.id)).length;
    return count > 0 && count < filtered.length;
  }

  isSelectedRow(id: string): boolean {
    return this.selectedIds().has(id);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  exportarSeleccionados(): void {
    const ids = this.selectedIds();
    if (ids.size === 0) return;
    const list = this.flotaEmpresa().filter(i => ids.has(i.id));

    const headers = ['Placa', 'RUC', 'Razón Social', 'Res. Primigenia', 'Vigencia Hasta', 'Res. Hija', 'Tipo Res. Hija', 'Expediente', 'TUC', 'Estado', 'Rutas', 'Link TUC', 'Link Notificación', 'Detalles'];
    const rows = list.map(item => [
      `"${item.placa || ''}"`,
      `"${item.ruc || ''}"`,
      `"${(item.razon_social || '').replace(/"/g, '""')}"`,
      `"${item.nro_resolucion_primigenia || ''}"`,
      `"${item.fecha_vigencia_hasta || ''}"`,
      `"${item.nro_resolucion_hija || ''}"`,
      `"${item.tipo_resolucion_hija || ''}"`,
      `"${item.expediente || item.num_expediente || ''}"`,
      `"${item.numero_tuc || ''}"`,
      `"${item.estado || ''}"`,
      `"${(item.rutas || []).join('; ')}"`,
      `"${item.link_tuc || ''}"`,
      `"${item.link_notificacion || ''}"`,
      `"${(item.detalles || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `flota_seleccionada_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.snackBar.open(`Exportados ${list.length} registro(s) a CSV/Excel.`, 'OK', { duration: 3000 });
  }

  totalVehiculosEmpresaSinFiltro = computed(() => {
    return this.flotaEmpresa().filter(i => !i.es_cronologico).length;
  });

  primigeniasDisponibles = computed(() => {
    const list = this.flotaEmpresa().filter(i => !i.es_cronologico);
    const prims = Array.from(new Set(list.map(i => i.nro_resolucion_primigenia).filter(Boolean)));
    return prims.sort();
  });

  getCantidadPorPrimigenia(prim: string): number {
    return this.flotaEmpresa().filter(i => !i.es_cronologico && (i.nro_resolucion_primigenia || '').toUpperCase() === prim.toUpperCase()).length;
  }

  flotaEmpresaFiltrada = computed(() => {
    let list = [...this.flotaEmpresa()].filter(i => !i.es_cronologico);
    const q = (this.searchValue() || '').toLowerCase();
    const est = (this.estadoValue() || '').toUpperCase();
    const tipo = (this.tipoHijaValue() || '').toUpperCase();
    const primSelected = this.primigeniaFiltro();

    if (primSelected) {
      list = list.filter(i => (i.nro_resolucion_primigenia || '').toUpperCase() === primSelected.toUpperCase());
    }

    if (q) list = list.filter(i =>
      (i.placa || '').toLowerCase().includes(q) ||
      (i.nro_resolucion_primigenia || '').toLowerCase().includes(q) ||
      (i.nro_resolucion_hija || '').toLowerCase().includes(q) ||
      (i.numero_tuc || '').toLowerCase().includes(q) ||
      (i.rutas || []).some(r => r.toLowerCase().includes(q))
    );
    if (est) list = list.filter(i => (i.estado || '').toUpperCase() === est);
    if (tipo) list = list.filter(i => (i.tipo_resolucion_hija || '').toUpperCase() === tipo);

    const field = this.sortField();
    const dir = this.sortDirection();
    list.sort((a, b) => {
      const va = (a as any)[field] ?? '';
      const vb = (b as any)[field] ?? '';
      const cmp = String(va).localeCompare(String(vb), 'es', { numeric: true });
      return dir === 'asc' ? cmp : -cmp;
    });

    return list;
  });

  paginatedFlota = computed(() => {
    const list = this.flotaEmpresaFiltrada();
    const s = this.pageIndex() * this.pageSize();
    return list.slice(s, s + this.pageSize());
  });

  // ---- Vista cronológica ----
  searchCronoControl = new FormControl('');
  estadoCronoControl = new FormControl('');
  private searchCronoValue = toSignal(this.searchCronoControl.valueChanges.pipe(startWith('')), { initialValue: '' });
  private estadoCronoValue = toSignal(this.estadoCronoControl.valueChanges.pipe(startWith('')), { initialValue: '' });

  isLoadingCrono = signal(false);
  flotaCronologica = signal<VehiculoEmpresa[]>([]);
  pageIndexCrono = signal(0);
  pageSizeCrono = signal(50);

  flotaCronologicaFiltrada = computed(() => {
    let list = [...this.flotaCronologica()];
    const q = (this.searchCronoValue() || '').toLowerCase();
    const est = (this.estadoCronoValue() || '').toUpperCase();

    if (q) list = list.filter(i =>
      (i.ruc || '').includes(q) ||
      (i.placa || '').toLowerCase().includes(q) ||
      (i.nro_resolucion_primigenia || '').toLowerCase().includes(q) ||
      (i.numero_tuc || '').toLowerCase().includes(q) ||
      (i.razon_social || '').toLowerCase().includes(q)
    );
    if (est) list = list.filter(i => (i.estado || '').toUpperCase() === est);
    return list;
  });

  paginatedCronologica = computed(() => {
    const list = this.flotaCronologicaFiltrada();
    const s = this.pageIndexCrono() * this.pageSizeCrono();
    return list.slice(s, s + this.pageSizeCrono());
  });

  ngOnInit(): void {
    // Cargar catálogo de empresas y rutas oficiales al entrar
    this.cargarCatalogoEmpresas();
    this.cargarRutasOficiales();

    // Reset page on filter change
    this.searchControl.valueChanges.subscribe(() => this.pageIndex.set(0));
    this.estadoControl.valueChanges.subscribe(() => this.pageIndex.set(0));
    this.tipoHijaControl.valueChanges.subscribe(() => this.pageIndex.set(0));
    this.searchCronoControl.valueChanges.subscribe(() => this.pageIndexCrono.set(0));
    this.estadoCronoControl.valueChanges.subscribe(() => this.pageIndexCrono.set(0));
  }

  cargarCatalogoEmpresas(): void {
    this.isLoadingEmpresasCatalog.set(true);
    this.service.getResumenEmpresas().subscribe({
      next: (resp) => {
        this.empresasCatalog.set(resp.data);
        this.isLoadingEmpresasCatalog.set(false);
      },
      error: () => {
        this.isLoadingEmpresasCatalog.set(false);
      }
    });
  }

  seleccionarEmpresaDelCatalogo(ruc: string): void {
    this.empresaSearchControl.setValue(ruc);
    this.buscarFlotaEmpresa();
  }

  cambiarVista(vista: 'empresa' | 'cronologica'): void {
    this.vistaActual.set(vista);
    if (vista === 'cronologica' && this.flotaCronologica().length === 0) {
      this.cargarVistaCronologica();
    }
  }

  buscarFlotaEmpresa(): void {
    const ruc = this.empresaSearchControl.value?.trim();
    if (!ruc) return;
    this.isLoadingEmpresa.set(true);
    this.empresaSeleccionada.set(false);
    this.flotaEmpresa.set([]);
    this.empresaDetalle.set(null);
    this.resolucionesPrimigeniasMatriz.set([]);
    this.pageIndex.set(0);

    // 1. Obtener datos oficiales de la Empresa
    this.empresaService.getEmpresaByRuc(ruc).subscribe({
      next: (emp) => {
        if (emp) {
          this.empresaDetalle.set(emp);
          const rs = this.extractRazonSocial(emp);
          if (rs) this.razonSocialEmpresa.set(rs);
        }
      },
      error: () => {
        this.empresaService.filtrarEmpresas({ ruc }).subscribe({
          next: (empList) => {
            if (empList && empList.length > 0) {
              this.empresaDetalle.set(empList[0]);
              const rs = this.extractRazonSocial(empList[0]);
              if (rs) this.razonSocialEmpresa.set(rs);
            }
          },
          error: (err) => console.warn('No se pudo cargar detalle oficial de la empresa:', err)
        });
      }
    });

    // 2. Obtener Resoluciones Primigenias del módulo de resoluciones
    this.resolucionPrimigeniaService.getResolucionesByRuc(ruc).subscribe({
      next: (resList) => {
        if (resList) {
          this.resolucionesPrimigeniasMatriz.set(resList);
        }
      },
      error: (err) => console.warn('No se pudieron cargar resoluciones primigenias oficiales:', err)
    });

    // 3. Obtener Flota por Empresa
    this.service.getFlotaByEmpresa(ruc, false).subscribe({
      next: (resp) => {
        this.flotaEmpresa.set(resp.data);
        this.empresaSeleccionada.set(true);
        if (resp.data.length > 0) {
          this.razonSocialEmpresa.set(resp.data[0].razon_social || '');
        }
        this.isLoadingEmpresa.set(false);
        // Cargar estadísticas
        this.service.getEstadisticas(ruc).subscribe({
          next: (stats) => this.estadisticas.set(stats),
          error: () => {}
        });
      },
      error: () => {
        this.isLoadingEmpresa.set(false);
        this.snackBar.open('Error al buscar la flota de la empresa.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  limpiarEmpresaSeleccionada(): void {
    this.empresaSeleccionada.set(false);
    this.flotaEmpresa.set([]);
    this.empresaDetalle.set(null);
    this.resolucionesPrimigeniasMatriz.set([]);
    this.estadisticas.set(null);
    this.razonSocialEmpresa.set('');
    this.pageIndex.set(0);
  }

  cargarVistaCronologica(): void {
    this.isLoadingCrono.set(true);
    this.flotaCronologica.set([]);
    this.pageIndexCrono.set(0);
    this.service.getFlota({ skip: 0, limit: 50000 }).subscribe({
      next: (resp) => {
        this.flotaCronologica.set(resp.data);
        this.isLoadingCrono.set(false);
      },
      error: () => {
        this.isLoadingCrono.set(false);
        this.snackBar.open('Error cargando vista cronológica.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  verCronologiaPrimigenia(nro: string): void {
    this.vistaActual.set('cronologica');
    this.searchCronoControl.setValue(nro);
    if (this.flotaCronologica().length === 0) {
      this.cargarVistaCronologica();
    }
  }

  private dialog = inject(MatDialog);

  abrirDetalle(item: VehiculoEmpresa): void {
    this.dialog.open(DetalleVehiculoDialogComponent, {
      data: item,
      width: '750px',
      maxHeight: '90vh'
    });
  }

  abrirEditar(item: VehiculoEmpresa): void {
    const dialogRef = this.dialog.open(EditarVehiculoDialogComponent, {
      data: item,
      width: '650px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((updated: boolean) => {
      if (updated) {
        const ruc = this.empresaSearchControl.value?.trim();
        if (ruc) this.buscarFlotaEmpresa();
      }
    });
  }

  eliminarRegistro(id: string): void {
    if (!confirm('¿Eliminar este registro de flota?')) return;
    this.service.delete(id).subscribe({
      next: () => {
        this.flotaEmpresa.update(list => list.filter(i => i.id !== id));
        this.snackBar.open('Registro eliminado.', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Error al eliminar.', 'Cerrar', { duration: 3000 })
    });
  }

  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.estadoControl.setValue('');
    this.tipoHijaControl.setValue('');
  }

  toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.pageIndex.set(0);
  }

  getSortIcon(field: string): string {
    if (this.sortField() !== field) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  onPageChange(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  onPageChangeCrono(e: PageEvent): void {
    this.pageIndexCrono.set(e.pageIndex);
    this.pageSizeCrono.set(e.pageSize);
  }

  getTipoHijaLabel(tipo?: string): string {
    const map: Record<string, string> = {
      I: 'Incremento', S: 'Sustitución', M: 'Modificación', O: 'Otros', C: 'Cancelación'
    };
    return tipo ? (map[tipo] || tipo) : '';
  }

  irACargaMasiva(): void {
    this.router.navigate(['/vehiculos-empresa/carga-masiva']);
  }
}
