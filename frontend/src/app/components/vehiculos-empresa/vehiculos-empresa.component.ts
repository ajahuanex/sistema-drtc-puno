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
import { FormVehiculoDialogComponent } from './form-vehiculo-dialog.component';
import { FormTramitePrimigeniaDialogComponent } from './form-tramite-primigenia-dialog.component';
import { CambiarTucDialogComponent } from './cambiar-tuc-dialog.component';
import { GenerarTucDialogComponent } from './generar-tuc-dialog.component';

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
          <button mat-raised-button class="header-action-btn" (click)="irACargaMasiva()" matTooltip="Importar desde Excel / Google Sheets">
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
                  <h3 style="margin:0;font-size:18px;font-weight:700;color:#1e293b;">Directorio de Empresas</h3>
                  <p style="margin:2px 0 0;font-size:13px;color:#64748b;">Selecciona una empresa para ver su flota</p>
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
                              <span class="code-badge prim-badge" style="font-size:10px;padding:2px 6px;">{{ formatResolucionCode(p) }}</span>
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
            <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
              <button mat-stroked-button (click)="limpiarEmpresaSeleccionada()" style="background:#fff;border-color:#cbd5e1;font-weight:600;color:#334155;border-radius:10px;">
                <mat-icon style="color:#2563eb;">arrow_back</mat-icon> <span class="hide-on-mobile">Volver</span>
              </button>
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:13.5px;font-weight:700;color:#334155;background:#f8fafc;padding:6px 14px;border-radius:10px;border:1px solid #e2e8f0;">
                  Empresa activa: <strong style="color:#1e1b4b;">{{ razonSocialEmpresa() }}</strong> <span style="color:#2563eb;font-family:monospace;margin-left:4px;">(RUC: {{ empresaSearchControl.value }})</span>
                </span>
              </div>
            </div>

            <!-- CUADRITO 1: INFORMACIÓN DE LA EMPRESA (CORTINA DESPLEGABLE) -->
            <mat-accordion class="rutas-primigenias-accordion" multi>
              <mat-expansion-panel style="margin-bottom:16px;border-radius:14px;box-shadow:0 4px 16px rgba(15,23,42,0.05);border:1px solid rgba(226,232,240,0.8);" [expanded]="false">
                <mat-expansion-panel-header style="height:auto;padding:14px 20px;">
                  <mat-panel-title style="display:flex;align-items:center;justify-content:space-between;width:100%;margin:0;padding-right:16px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <div style="width:36px;height:36px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center;">
                        <mat-icon style="color:#2563eb;font-size:20px;width:20px;height:20px;">business</mat-icon>
                      </div>
                      <h3 style="margin:0;font-size:15px;font-weight:800;color:#1e293b;">Datos de la Empresa</h3>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;" (click)="$event.stopPropagation()">
                      @if (estadisticas()) {
                        <span class="stat-pill hab-pill hide-on-mobile" style="font-size:11px;padding:3px 10px;border-radius:12px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;font-weight:700;">
                          <mat-icon style="font-size:13px;width:13px;height:13px;vertical-align:middle;">check_circle</mat-icon> {{ estadisticas()!.habilitados }} Hab.
                        </span>
                      }
                      <span class="ruc-badge" style="font-size:12px;padding:4px 10px;background:#1e1b4b;color:#fff;">
                        RUC: {{ empresaSearchControl.value }}
                      </span>
                    </div>
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <!-- DATOS OFICIALES DE LA EMPRESA -->
                <div class="empresa-info-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:12px;background:rgba(248,250,252,0.9);padding:14px 16px;border-radius:10px;border:1px solid #e2e8f0;margin-top:10px;">
                  <div class="info-block">
                    <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Representante Legal</div>
                    <div style="font-size:13px;font-weight:700;color:#1e293b;margin-top:2px;">
                      {{ getRepresentanteLegalNombre(empresaDetalle()) }}
                      @if (getRepresentanteLegalDni(empresaDetalle())) {
                        <span style="font-size:11px;color:#475569;font-weight:600;"> (DNI: {{ getRepresentanteLegalDni(empresaDetalle()) }})</span>
                      }
                    </div>
                  </div>
                  <div class="info-block">
                    <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Teléfono / Contacto</div>
                    <div style="font-size:13px;font-weight:600;color:#334155;margin-top:2px;">{{ getTelefonoEmpresa(empresaDetalle()) }}</div>
                  </div>
                  <div class="info-block">
                    <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Correo Electrónico</div>
                    <div style="font-size:13px;font-weight:600;color:#334155;margin-top:2px;">{{ getEmailEmpresa(empresaDetalle()) }}</div>
                  </div>
                  <div class="info-block" style="grid-column: 1 / -1;">
                    <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Dirección Fiscal</div>
                    <div style="font-size:13px;font-weight:500;color:#334155;margin-top:2px;display:flex;align-items:center;gap:4px;">
                      <mat-icon style="font-size:14px;width:14px;height:14px;color:#e11d48;">place</mat-icon>
                      {{ getDireccionEmpresa(empresaDetalle()) }}
                    </div>
                  </div>
                </div>
              </mat-expansion-panel>
            </mat-accordion>

            <!-- CUADRITO 2: RESOLUCIONES PRIMIGENIAS Y RUTAS (CORTINA DESPLEGABLE) -->
            <mat-accordion class="rutas-primigenias-accordion" multi>
              <mat-expansion-panel style="margin-bottom:16px;border-radius:14px;box-shadow:0 4px 16px rgba(15,23,42,0.05);border:1px solid rgba(226,232,240,0.8);" [expanded]="rutasPrimigeniasAbiertas()" (opened)="rutasPrimigeniasAbiertas.set(true)" (closed)="rutasPrimigeniasAbiertas.set(false)">
                <mat-expansion-panel-header style="height:auto;padding:14px 20px;">
                  <mat-panel-title style="display:flex;align-items:center;justify-content:space-between;width:100%;margin:0;padding-right:16px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <div style="width:36px;height:36px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;">
                        <mat-icon style="color:#10b981;font-size:20px;width:20px;height:20px;">route</mat-icon>
                      </div>
                      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        <h3 style="margin:0;font-size:15px;font-weight:800;color:#1e293b;">Autorizaciones y Rutas</h3>
                        <span class="stat-pill total-pill hide-on-mobile" style="font-size:11px;padding:2px 10px;background:#f8fafc;color:#475569;border:1px solid #cbd5e1;">
                          {{ rutasPorPrimigenia().length }} Autorización(es)
                        </span>
                      </div>
                    </div>
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <div class="prim-rutas-grid" style="display:flex;flex-direction:column;gap:14px;padding-top:10px;">
                  @for (item of rutasPorPrimigenia(); track item.primigenia) {
                    <div class="prim-ruta-card" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
                        <span class="code-badge prim-badge" [class.prim-inactiva]="item.estado === 'CANCELADA' || item.estado === 'INACTIVA' || item.estado === 'VENCIDA'" [matTooltip]="'Estado: ' + (item.estado || 'VIGENTE')">
                          {{ formatResolucionCode(item.primigenia) }}
                        </span>
                        <div style="display:flex;align-items:center;gap:8px;">
                          <button mat-flat-button style="font-size:11px;height:26px;line-height:26px;padding:0 10px;border-radius:6px;font-weight:700;background:#0ea5e9;color:#fff;box-shadow:0 2px 4px rgba(14,165,233,0.2);" (click)="abrirTramitePrimigenia(item)" matTooltip="Procesar Trámite para esta Resolución">
                            <mat-icon style="font-size:14px;width:14px;height:14px;margin-right:4px;">assignment</mat-icon>
                            <span>Trámite</span>
                          </button>
                          <span class="status-pill"
                                [class.status-habilitado]="item.estado === 'VIGENTE' || item.estado === 'ACTIVA'"
                                [class.status-vencido]="item.estado === 'VENCIDA'"
                                [class.status-cancelado]="item.estado === 'CANCELADA' || item.estado === 'INACTIVA'">
                            {{ item.estado || 'VIGENTE' }}
                          </span>
                        </div>
                      </div>

                      <!-- CONTENIDO SECUNDARIO: FECHAS Y RUTAS AL LADO -->
                      <div style="display:flex;flex-wrap:wrap;gap:16px;">
                        <!-- FECHAS Y VIGENCIA -->
                        <div style="flex:1;min-width:240px;font-size:11px;color:#475569;display:flex;flex-direction:column;gap:4px;background:rgba(241,245,249,0.85);padding:9px 12px;border-radius:8px;">
                          <div>
                            F. Emisión: 
                            @if (item.fechaEmision) {
                              <strong>{{ item.fechaEmision | date:'dd/MM/yyyy' }}</strong>
                            } @else {
                              <span style="color:#94a3b8;font-style:italic;">No registrada</span>
                            }
                          </div>
                          <div>
                            Inicio Vigencia: 
                            @if (item.fechaInicioVigencia) {
                              <strong>{{ item.fechaInicioVigencia | date:'dd/MM/yyyy' }}</strong>
                            } @else {
                              <span style="color:#94a3b8;font-style:italic;">No registrada</span>
                            }
                          </div>
                          <div>
                            Fin Vigencia: 
                            @if (item.vigenciaHasta) {
                              <strong>{{ item.vigenciaHasta | date:'dd/MM/yyyy' }}</strong>
                              @if (item.aniosVigencia) {
                                <span> ({{ item.aniosVigencia }} Años)</span>
                              }
                            } @else {
                              <span style="color:#94a3b8;font-style:italic;">No registrada</span>
                            }
                          </div>
                          
                          <!-- DESGLOSE DE FLOTA -->
                          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px;padding-top:4px;border-top:1px solid #e2e8f0;">
                            <span style="font-weight:700;color:#16a34a;background:#f0fdf4;padding:2px 8px;border-radius:12px;font-size:11px;border:1px solid #bbf7d0;display:inline-flex;align-items:center;gap:3px;">
                              <mat-icon style="font-size:13px;width:13px;height:13px;">check_circle</mat-icon>
                              Habilitados: {{ item.countHabilitados }}
                            </span>
                            @if (item.countInhabilitados > 0) {
                              <span style="font-weight:700;color:#dc2626;background:#fef2f2;padding:2px 8px;border-radius:12px;font-size:11px;border:1px solid #fecaca;display:inline-flex;align-items:center;gap:3px;">
                                <mat-icon style="font-size:13px;width:13px;height:13px;">block</mat-icon>
                                Inhabilitados: {{ item.countInhabilitados }}
                              </span>
                            }
                          </div>
                        </div>

                        <!-- RUTAS DESGLOSADAS -->
                        <div style="flex:2;min-width:300px;">
                          <div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;">
                            Rutas ({{ item.rutasArray.length }}):
                          </div>
                          @if (item.rutasArray.length > 0) {
                            <div style="margin-top:8px;overflow-x:auto;">
                              <table style="width:100%;border-collapse:collapse;font-size:11px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
                                <thead style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                                  <tr>
                                    <th style="padding:6px 10px;color:#64748b;font-weight:700;text-align:left;text-transform:uppercase;font-size:9.5px;letter-spacing:0.04em;">Cód.</th>
                                    <th style="padding:6px 10px;color:#64748b;font-weight:700;text-align:left;text-transform:uppercase;font-size:9.5px;letter-spacing:0.04em;">Origen</th>
                                    <th style="padding:6px 10px;color:#64748b;font-weight:700;text-align:left;text-transform:uppercase;font-size:9.5px;letter-spacing:0.04em;">Itinerario</th>
                                    <th style="padding:6px 10px;color:#64748b;font-weight:700;text-align:left;text-transform:uppercase;font-size:9.5px;letter-spacing:0.04em;">Destino</th>
                                    <th style="padding:6px 10px;color:#64748b;font-weight:700;text-align:left;text-transform:uppercase;font-size:9.5px;letter-spacing:0.04em;">Frecuencia</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (r of item.rutasArray; track r) {
                                    @if (getRutaObject(r, item.primigenia); as rutaObj) {
                                      <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:6px 10px;color:#0ea5e9;font-weight:800;">{{ rutaObj.codigoRuta || r }}</td>
                                        <td style="padding:6px 10px;font-weight:700;color:#1e293b;">{{ rutaObj.origen?.nombre || '-' }}</td>
                                        <td style="padding:6px 10px;color:#64748b;font-size:10px;max-width:200px;white-space:normal;line-height:1.3;" [title]="formatItinerario(rutaObj.itinerario)">{{ formatItinerario(rutaObj.itinerario) }}</td>
                                        <td style="padding:6px 10px;font-weight:700;color:#1e293b;">{{ rutaObj.destino?.nombre || '-' }}</td>
                                        <td style="padding:6px 10px;color:#475569;">{{ rutaObj.frecuencia?.descripcion || rutaObj.frecuencia?.tipo || '-' }}</td>
                                      </tr>
                                    } @else {
                                      <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:6px 10px;color:#0ea5e9;font-weight:800;">{{ r }}</td>
                                        <td colspan="4" style="padding:6px 10px;color:#94a3b8;font-style:italic;">Información detallada no encontrada en la BD de Rutas</td>
                                      </tr>
                                    }
                                  }
                                </tbody>
                              </table>
                            </div>
                          } @else {
                            <div style="margin-top:8px;">
                              <span style="font-size:11px;color:#94a3b8;font-style:italic;">Sin rutas asignadas</span>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </mat-expansion-panel>
            </mat-accordion>

            <!-- FILTROS Y SELECTOR DE PRIMIGENIAS POR TABS -->
            @if (primigeniasDisponibles().length > 1) {
              <div class="primigenias-tabs-bar" style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:12px;font-weight:700;color:#475569;">Filtrar por Primigenia:</span>
                <button mat-stroked-button [class.active-prim-btn]="primigeniaFiltro() === ''" (click)="primigeniaFiltro.set('')">
                  <mat-icon>view_module</mat-icon> Todas ({{ totalVehiculosHabilitadosSinFiltro() }})
                </button>
                @for (prim of primigeniasDisponibles(); track prim) {
                  <button mat-stroked-button
                          [class.active-prim-btn]="primigeniaFiltro() === prim"
                          [class.prim-tab-vencida]="isPrimigeniaTabVencida(prim)"
                          (click)="primigeniaFiltro.set(prim)">
                    <mat-icon [style.color]="isPrimigeniaTabVencida(prim) ? '#dc2626' : ''">{{ isPrimigeniaTabVencida(prim) ? 'lock_clock' : 'verified' }}</mat-icon>
                    <span>{{ formatResolucionCode(prim) }}</span>
                    <span class="prim-count-pill" [class.prim-count-vencida]="isPrimigeniaTabVencida(prim)">({{ getCantidadPorPrimigenia(prim) }})</span>
                    @if (isPrimigeniaTabVencida(prim)) {
                      <span class="vencida-mini-tag">VENCIDA</span>
                    }
                  </button>
                }
              </div>
            }

            <!-- BANNER INFORMATIVO CUANDO SE CONSULTA UNA RESOLUCIÓN VENCIDA -->
            @if (primigeniaFiltro() && isPrimigeniaTabVencida(primigeniaFiltro())) {
              <div class="banner-resolucion-vencida animate-fade-in" style="margin-bottom:14px;background:#fff1f2;border:1px solid #fecdd3;border-left:5px solid #e11d48;border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(225,29,72,0.08);">
                <div style="width:34px;height:34px;border-radius:8px;background:#ffe4e6;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <mat-icon style="color:#e11d48;font-size:20px;width:20px;height:20px;">lock</mat-icon>
                </div>
                <div style="font-size:13px;color:#9f1239;line-height:1.4;">
                  <strong>Resolución Primigenia Vencida (Modo Consulta):</strong> La lista de vehículos habilitados bajo esta resolución se encuentra disponible para su revisión histórica y trazabilidad, pero <strong>bloqueada para cualquier modificación, inhabilitación o eliminación directa</strong>.
                </div>
              </div>
            }

            <div class="modern-filters-bar glass-panel animate-fade-in" style="margin-bottom:16px;">
              <div class="modern-search-input-wrapper">
                <mat-icon class="search-icon">search</mat-icon>
                <input [formControl]="searchControl" placeholder="Buscar por placa, TUC, resolución o expediente..." class="modern-search-input">
                @if (searchControl.value) {
                  <button mat-icon-button (click)="searchControl.setValue('')" class="clear-btn">
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </div>
              
              <div class="modern-filters-options">
                <div class="modern-select-wrapper">
                  <select [formControl]="estadoControl" class="modern-select">
                    <option value="">Estado: Todos</option>
                    <option value="HABILITADO">Habilitado</option>
                    <option value="INHABILITADO">Inhabilitado</option>
                    <option value="OBSERVADO">Observado</option>
                    <option value="CANCELADO">Cancelado</option>
                    <option value="SUSPENDIDO">Suspendido</option>
                  </select>
                  <mat-icon class="select-icon">expand_more</mat-icon>
                </div>
                
                <div class="modern-select-wrapper">
                  <select [formControl]="tipoHijaControl" class="modern-select">
                    <option value="">Trámite: Todos</option>
                    <option value="I">Incremento</option>
                    <option value="S">Sustitución</option>
                    <option value="M">Modificación</option>
                    <option value="O">Otros</option>
                    <option value="C">Cancelación</option>
                  </select>
                  <mat-icon class="select-icon">expand_more</mat-icon>
                </div>

                <button mat-stroked-button [matMenuTriggerFor]="colsMenu" class="modern-action-btn">
                  <mat-icon>view_column</mat-icon> <span class="hide-on-mobile">Columnas</span>
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
                        Links
                      </mat-checkbox>
                    </button>
                    <button mat-menu-item (click)="$event.stopPropagation()">
                      <mat-checkbox [checked]="columnasVisibles().observaciones" (change)="toggleColumna('observaciones')">
                        Obs.
                      </mat-checkbox>
                    </button>
                  </mat-menu>

                  @if (searchControl.value || estadoControl.value || tipoHijaControl.value || primigeniaFiltro()) {
                    <button mat-button (click)="limpiarFiltros(); primigeniaFiltro.set('')" class="modern-action-btn" style="color:#dc2626;border-color:#fca5a5;">
                      <mat-icon>filter_alt_off</mat-icon> Limpiar
                    </button>
                  }
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
                          @if (columnasVisibles().links) { <th style="width:75px;" class="text-center">Links</th> }
                          @if (columnasVisibles().observaciones) { <th>Obs.</th> }
                          <th class="sticky-col-right text-center th-actions-icon-col">
                            <mat-icon class="th-actions-icon">settings</mat-icon>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of paginatedFlota(); track item.id) {
                          <tr [class.row-cancelada]="item.estado === 'CANCELADO' || item.estado_primigenia === 'CANCELADA' || item.estado_primigenia === 'INACTIVA'"
                              [class.row-vencida-bloqueada]="esResolucionVencida(item)">
                            <!-- CHECKBOX FILA -->
                            <td class="text-center">
                              <mat-checkbox (change)="toggleSelectRow(item.id)" [checked]="isSelectedRow(item.id)"></mat-checkbox>
                            </td>
                            <!-- Resolución Primigenia -->
                            @if (columnasVisibles().primigenia) {
                              <td class="sticky-col-left">
                                <div style="display:flex;flex-direction:column;gap:3px;align-items:flex-start;">
                                  <span class="code-badge prim-badge"
                                        [class.prim-inactiva]="item.estado_primigenia === 'CANCELADA' || item.estado_primigenia === 'INACTIVA' || item.estado_primigenia === 'VENCIDA' || esResolucionVencida(item)"
                                        [matTooltip]="'Estado: ' + (esResolucionVencida(item) ? 'VENCIDA (BLOQUEADO)' : (item.estado_primigenia || 'VIGENTE'))">
                                    {{ formatResolucionCode(item.nro_resolucion_primigenia) }}
                                  </span>
                                  @if (item.fecha_vigencia_hasta) {
                                    <div style="font-size:10px;color:#64748b;margin-top:1px;">
                                      Vence: {{ item.fecha_vigencia_hasta | date:'dd/MM/yyyy' }}
                                    </div>
                                  }
                                </div>
                              </td>
                            }
                            <!-- Placa + Res. Hija -->
                            @if (columnasVisibles().placaHija) {
                              <td style="white-space:nowrap;">
                                <div style="display:flex;flex-direction:column;gap:3px;align-items:flex-start;">
                                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;">
                                    <span class="ruc-badge placa-badge" style="white-space:nowrap;">{{ item.placa }}</span>
                                    @if (esResolucionVencida(item)) {
                                      <span class="badge-bloqueado" matTooltip="Resolución primigenia vencida: Registro bloqueado para cambios">
                                        <mat-icon style="font-size:11px;width:11px;height:11px;">lock</mat-icon> Bloqueado
                                      </span>
                                    }
                                  </div>
                                  @if (item.nro_resolucion_hija) {
                                    <div style="display:flex;align-items:center;gap:4px;white-space:nowrap;margin-top:2px;">
                                      <span class="code-badge hija-badge" style="white-space:nowrap;">
                                        {{ formatResolucionCode(item.nro_resolucion_hija) }}
                                      </span>
                                      @if (getTipoHijaLabel(item.tipo_resolucion_hija || item.nro_resolucion_hija)) {
                                        <span class="tipo-hija-badge tipo-{{ getTipoHijaCode(item.tipo_resolucion_hija || item.nro_resolucion_hija) }}" style="white-space:nowrap;">
                                          {{ getTipoHijaLabel(item.tipo_resolucion_hija || item.nro_resolucion_hija) }}
                                        </span>
                                      }
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
                                <div style="display:inline-flex;align-items:center;gap:6px;">
                                  @if (item.numero_tuc) {
                                    <span class="tuc-badge" style="white-space:nowrap;" matTooltip="Número TUC oficial">{{ item.numero_tuc }}</span>
                                  } @else {
                                    <span class="sin-datos">-</span>
                                  }
                                  <button type="button" class="btn-tuc-doc"
                                          (click)="abrirGenerarTuc(item); $event.stopPropagation();"
                                          matTooltip="Generar / Imprimir TUC (Plantilla Oficial)">
                                    <mat-icon style="font-size:15px;width:15px;height:15px;">print</mat-icon>
                                  </button>
                                  @if (!esResolucionVencida(item)) {
                                    <button type="button" class="btn-tuc-edit"
                                            (click)="abrirCambiarTuc(item); $event.stopPropagation();"
                                            matTooltip="Rectificar / Cambiar TUC (Anular actual)">
                                      <mat-icon style="font-size:15px;width:15px;height:15px;">edit</mat-icon>
                                    </button>
                                  }
                                </div>
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
                            <!-- Links -->
                            @if (columnasVisibles().links) {
                              <td style="width:75px;" class="text-center">
                                <div style="display:inline-flex;gap:2px;align-items:center;justify-content:center;">
                                  @if (item.link_tuc) {
                                    <a [href]="item.link_tuc" target="_blank" mat-icon-button color="primary" matTooltip="Ver TUC en Drive" style="width:28px;height:28px;line-height:28px;display:inline-flex;align-items:center;justify-content:center;">
                                      <mat-icon style="font-size:16px;width:16px;height:16px;">description</mat-icon>
                                    </a>
                                  }
                                  @if (item.link_notificacion) {
                                    <a [href]="item.link_notificacion" target="_blank" mat-icon-button color="accent" matTooltip="Ver Notificación en Drive" style="width:28px;height:28px;line-height:28px;display:inline-flex;align-items:center;justify-content:center;">
                                      <mat-icon style="font-size:16px;width:16px;height:16px;">mark_email_read</mat-icon>
                                    </a>
                                  }
                                  @if (!item.link_tuc && !item.link_notificacion) {
                                    <span class="sin-datos">-</span>
                                  }
                                </div>
                              </td>
                            }
                            <!-- Obs. -->
                            @if (columnasVisibles().observaciones) {
                              <td>
                                @if (getObserTextoCompleto(item)) {
                                  <div class="obs-icon-badge" [matTooltip]="getObserTextoCompleto(item)" matTooltipPosition="above">
                                    <mat-icon style="font-size:15px;width:15px;height:15px;color:#0284c7;">comment</mat-icon>
                                    <span style="font-size:11px;font-weight:700;color:#0369a1;">Obs.</span>
                                  </div>
                                } @else {
                                  <span class="sin-datos">-</span>
                                }
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
                      <button mat-menu-item
                              [disabled]="esResolucionVencida(item)"
                              (click)="abrirEditar(item)"
                              [matTooltip]="esResolucionVencida(item) ? 'Bloqueado: La resolución primigenia está vencida' : ''">
                        <mat-icon [style.color]="esResolucionVencida(item) ? '#94a3b8' : '#d97706'">{{ esResolucionVencida(item) ? 'lock' : 'edit' }}</mat-icon>
                        <span>Editar Registro {{ esResolucionVencida(item) ? '(Bloqueado)' : '' }}</span>
                      </button>
                      <button mat-menu-item
                              [disabled]="esResolucionVencida(item)"
                              (click)="abrirCambiarTuc(item)"
                              [matTooltip]="esResolucionVencida(item) ? 'Bloqueado: La resolución primigenia está vencida' : ''">
                        <mat-icon [style.color]="esResolucionVencida(item) ? '#94a3b8' : '#6366f1'">{{ esResolucionVencida(item) ? 'lock' : 'published_with_changes' }}</mat-icon>
                        <span>Rectificar / Cambiar TUC {{ esResolucionVencida(item) ? '(Bloqueado)' : '' }}</span>
                      </button>
                      <button mat-menu-item (click)="abrirGenerarTuc(item)">
                        <mat-icon style="color:#2563eb;">description</mat-icon>
                        <span>Generar / Imprimir TUC (Plantilla)</span>
                      </button>
                      <button mat-menu-item
                              [disabled]="esResolucionVencida(item)"
                              (click)="inhabilitarVehiculo(item)"
                              [matTooltip]="esResolucionVencida(item) ? 'Bloqueado: La resolución primigenia está vencida' : ''">
                        <mat-icon [style.color]="esResolucionVencida(item) ? '#94a3b8' : '#dc2626'">{{ esResolucionVencida(item) ? 'lock' : 'block' }}</mat-icon>
                        <span>Inhabilitar / Dar de Baja {{ esResolucionVencida(item) ? '(Bloqueado)' : '' }}</span>
                      </button>
                      <button mat-menu-item (click)="verCronologiaPrimigenia(item.nro_resolucion_primigenia)">
                        <mat-icon style="color:#0d9488;">timeline</mat-icon>
                        <span>Ver Cronología Primigenia</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item
                              [disabled]="esResolucionVencida(item)"
                              (click)="eliminarRegistro(item.id)"
                              [matTooltip]="esResolucionVencida(item) ? 'Bloqueado: La resolución primigenia está vencida' : ''">
                        <mat-icon [color]="esResolucionVencida(item) ? '' : 'warn'">{{ esResolucionVencida(item) ? 'lock' : 'delete' }}</mat-icon>
                        <span>Eliminar Registro {{ esResolucionVencida(item) ? '(Bloqueado)' : '' }}</span>
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
                            <td><span class="code-badge prim-badge">{{ formatResolucionCode(item.nro_resolucion_primigenia) }}</span></td>
                            <td style="white-space:nowrap;">
                              <span class="ruc-badge placa-badge">{{ item.placa }}</span>
                              @if (item.nro_resolucion_hija) {
                                <div style="display:flex;align-items:center;gap:4px;margin-top:2px;white-space:nowrap;">
                                  <span class="code-badge hija-badge">{{ formatResolucionCode(item.nro_resolucion_hija) }}</span>
                                  @if (getTipoHijaLabel(item.tipo_resolucion_hija || item.nro_resolucion_hija)) {
                                    <span class="tipo-hija-badge tipo-{{ getTipoHijaCode(item.tipo_resolucion_hija || item.nro_resolucion_hija) }}">
                                      {{ getTipoHijaLabel(item.tipo_resolucion_hija || item.nro_resolucion_hija) }}
                                    </span>
                                  }
                                </div>
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
  rutasOficialesEmpresa = signal<Ruta[]>([]);

  // Control de cortina desplegable (Accordion) para resoluciones primigenias y rutas
  rutasPrimigeniasAbiertas = signal<boolean>(false);

  toggleRutasPrimigenias() {
    this.rutasPrimigeniasAbiertas.update(v => !v);
  }

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

  // Agrupación computada de rutas por resolución primigenia para la ficha informativa
  rutasPorPrimigenia = computed(() => {
    const map = new Map<string, {
      primigenia: string;
      fechaEmision?: string | Date;
      fechaInicioVigencia?: string | Date;
      vigenciaHasta?: string | Date;
      aniosVigencia?: number;
      estado: string;
      rutas: Set<string>;
      rutasCompletas: Ruta[];
      countHabilitados: number;
      countInhabilitados: number;
      countTotal: number;
    }>();

    const primFiltro = this.primigeniaFiltro();
    const matriz = this.resolucionesPrimigeniasMatriz();
    const rutasOficiales = this.rutasOficialesEmpresa();

    // Helper para normalizar resolución quitando prefijo R- y espacios
    const normRes = (val: string): string => {
      const s = (val || '').trim().toUpperCase();
      return s.startsWith('R-') ? s.substring(2) : s;
    };

    // Helper para determinar estado efectivo de la primigenia validando fin de vigencia y observaciones
    const calcEstado = (estado?: string, fFin?: string | Date, obs?: string): string => {
      const est = (estado || 'VIGENTE').toUpperCase();
      if (est === 'CANCELADA' || est === 'SUSPENDIDA' || est === 'ANULADA') return est;
      const obsUpper = (obs || '').toUpperCase();
      if (obsUpper.includes('CANCELAD')) return 'CANCELADA';
      if (obsUpper.includes('RENOVAD')) return 'VENCIDA';
      if (fFin) {
        const d = new Date(fFin);
        if (!isNaN(d.getTime())) {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          if (d < hoy) return 'VENCIDA';
        }
      }
      return est;
    };

    // 1. Cargar datos oficiales del módulo de Resoluciones Primigenias
    for (const res of matriz) {
      const key = (res.nro_resolucion || '').trim().toUpperCase();
      if (!key) continue;
      if (primFiltro && key !== primFiltro.toUpperCase()) continue;

      map.set(key, {
        primigenia: res.nro_resolucion,
        fechaEmision: res.fecha_resolucion || (res as any).fecha_emision,
        fechaInicioVigencia: res.fecha_inicio_vigencia || res.fecha_resolucion || (res as any).fecha_emision,
        vigenciaHasta: res.fecha_fin_vigencia || (res as any).fecha_vencimiento,
        aniosVigencia: res.anios_vigencia,
        estado: calcEstado(res.estado, res.fecha_fin_vigencia, res.observaciones),
        rutas: new Set<string>(),
        rutasCompletas: [],
        countHabilitados: 0,
        countInhabilitados: 0,
        countTotal: 0
      });
    }

    // 2. Asociar RUTAS OFICIALES de la base de datos de rutas que corresponden a cada primigenia
    for (const r of rutasOficiales) {
      const rResRaw = (r.resolucion?.nroResolucion || (r as any).nro_resolucion || '').trim().toUpperCase();
      const rResNorm = normRes(rResRaw);

      let targetKey = '';
      for (const key of map.keys()) {
        if (key === rResRaw || normRes(key) === rResNorm || key.includes(rResNorm) || rResNorm.includes(key)) {
          targetKey = key;
          break;
        }
      }

      if (!targetKey && rResRaw) {
        if (!primFiltro || rResRaw === primFiltro.toUpperCase()) {
          targetKey = rResRaw;
          map.set(targetKey, {
            primigenia: r.resolucion?.nroResolucion || rResRaw,
            fechaEmision: (r.resolucion as any)?.fechaResolucion || (r.resolucion as any)?.fechaEmision,
            fechaInicioVigencia: (r.resolucion as any)?.fechaInicioVigencia,
            vigenciaHasta: (r.resolucion as any)?.fechaFinVigencia || (r.resolucion as any)?.fechaVencimiento,
            estado: calcEstado(r.resolucion?.estado),
            rutas: new Set<string>(),
            rutasCompletas: [],
            countHabilitados: 0,
            countInhabilitados: 0,
            countTotal: 0
          });
        }
      }

      if (targetKey && map.has(targetKey)) {
        const item = map.get(targetKey)!;
        const cod = (r.codigoRuta || '').trim();
        if (cod) {
          item.rutas.add(cod);
        }
        item.rutasCompletas.push(r);
      }
    }

    // 3. Acumular flota por empresa y rutas de los vehículos
    for (const v of this.flotaEmpresa()) {
      if (v.es_cronologico) continue;
      const vResRaw = (v.nro_resolucion_primigenia || 'SIN_PRIMIGENIA').trim().toUpperCase();
      const vResNorm = normRes(vResRaw);
      if (primFiltro && vResRaw !== primFiltro.toUpperCase()) continue;

      let targetKey = '';
      for (const key of map.keys()) {
        if (key === vResRaw || normRes(key) === vResNorm) {
          targetKey = key;
          break;
        }
      }

      if (!targetKey) {
        targetKey = vResRaw;
        map.set(targetKey, {
          primigenia: v.nro_resolucion_primigenia || 'S/N',
          fechaEmision: (v as any).fecha_resolucion || (v as any).fecha_emision,
          fechaInicioVigencia: (v as any).fecha_inicio_vigencia || (v as any).fecha_resolucion || (v as any).fecha_emision,
          vigenciaHasta: v.fecha_vigencia_hasta || (v as any).fecha_fin_vigencia,
          estado: calcEstado(v.estado_primigenia, v.fecha_vigencia_hasta, v.detalles),
          rutas: new Set<string>(),
          rutasCompletas: [],
          countHabilitados: 0,
          countInhabilitados: 0,
          countTotal: 0
        });
      }
      const item = map.get(targetKey)!;
      // Retroalimentar fechas si faltaban
      if (!item.vigenciaHasta && (v.fecha_vigencia_hasta || (v as any).fecha_fin_vigencia)) {
        item.vigenciaHasta = v.fecha_vigencia_hasta || (v as any).fecha_fin_vigencia;
      }
      if (!item.fechaEmision && ((v as any).fecha_resolucion || (v as any).fecha_emision)) {
        item.fechaEmision = (v as any).fecha_resolucion || (v as any).fecha_emision;
      }
      if (!item.fechaInicioVigencia && ((v as any).fecha_inicio_vigencia || (v as any).fecha_resolucion || (v as any).fecha_emision)) {
        item.fechaInicioVigencia = (v as any).fecha_inicio_vigencia || (v as any).fecha_resolucion || (v as any).fecha_emision;
      }

      item.countTotal++;
      const est = (v.estado || 'HABILITADO').toUpperCase();
      if (est === 'HABILITADO') {
        item.countHabilitados++;
      } else {
        item.countInhabilitados++;
      }

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

  getObserTextoCompleto(item: VehiculoEmpresa): string {
    if (!item) return '';
    const partes: string[] = [];
    if (item.observaciones_historial && item.observaciones_historial.length > 0) {
      for (const obs of item.observaciones_historial) {
        if (obs.texto && obs.texto.trim()) partes.push(obs.texto.trim());
      }
    }
    if (item.detalles && item.detalles.trim()) {
      partes.push(`Detalles: ${item.detalles.trim()}`);
    }
    return partes.join(' | ');
  }

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

  getRutaNombreCompleto(codigoRuta: string, primigenia?: string): string {
    const cod = (codigoRuta || '').trim().toUpperCase();
    const map = this.rutasOficialesMap();
    if (primigenia) {
      const primKey = `${primigenia.trim().toUpperCase()}_${cod}`;
      if (map.has(primKey)) {
        const r = map.get(primKey)!;
        const origenNom = r.origen?.nombre || '';
        const destinoNom = r.destino?.nombre || '';
        const nom = r.nombre || (origenNom && destinoNom ? `${origenNom} - ${destinoNom}` : '');
        return nom ? `Ruta ${r.codigoRuta}: ${nom}` : `Ruta ${r.codigoRuta}`;
      }
    }
    if (map.has(cod)) {
      const r = map.get(cod)!;
      const origenNom = r.origen?.nombre || '';
      const destinoNom = r.destino?.nombre || '';
      const nom = r.nombre || (origenNom && destinoNom ? `${origenNom} - ${destinoNom}` : '');
      return nom ? `Ruta ${r.codigoRuta}: ${nom}` : `Ruta ${r.codigoRuta}`;
    }
    return `Ruta ${codigoRuta}`;
  }

  getRutaObject(codigoRuta: string, primigenia?: string): any {
    const cod = (codigoRuta || '').trim().toUpperCase();
    const map = this.rutasOficialesMap();
    if (primigenia) {
      const primKey = `${primigenia.trim().toUpperCase()}_${cod}`;
      if (map.has(primKey)) return map.get(primKey);
    }
    if (map.has(cod)) {
      return map.get(cod);
    }
    return null;
  }

  formatItinerario(itinerario: any): string {
    if (!itinerario || !Array.isArray(itinerario)) return '-';
    return itinerario.map(i => i.nombre || '').filter(Boolean).join(' - ');
  }

  getRutaInfoTooltip(codigoRuta: string, primigenia?: string): string {
    const cod = (codigoRuta || '').trim().toUpperCase();
    const map = this.rutasOficialesMap();
    let r: Ruta | undefined;
    if (primigenia) {
      const primKey = `${primigenia.trim().toUpperCase()}_${cod}`;
      if (map.has(primKey)) r = map.get(primKey);
    }
    if (!r && map.has(cod)) {
      r = map.get(cod);
    }
    if (r) {
      const origenNom = r.origen?.nombre || 'Origen';
      const destinoNom = r.destino?.nombre || 'Destino';
      const nom = r.nombre || `${origenNom} - ${destinoNom}`;
      const f = (r as any).frecuencia?.descripcion || (r as any).frecuencia?.tipo || 'DIARIO';
      const serv = r.tipoServicio || 'PASAJEROS';
      return `Ruta ${r.codigoRuta}: ${nom} | Servicio: ${serv} | Frecuencia: ${f}`;
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

  esResolucionVencida(item: VehiculoEmpresa): boolean {
    if (!item) return false;
    // 1. Si el estado_primigenia ya viene como VENCIDA, CANCELADA o INACTIVA
    const estPrim = (item.estado_primigenia || '').toUpperCase();
    if (estPrim === 'VENCIDA' || estPrim === 'CANCELADA' || estPrim === 'INACTIVA') return true;

    // 2. Si el detalle u observaciones indican renovación o cancelación
    const det = (item.detalles || '').toUpperCase();
    const obs = (item.observaciones || '').toUpperCase();
    if (det.includes('RENOVAD') || obs.includes('RENOVAD') || det.includes('CANCELAD') || obs.includes('CANCELAD')) return true;

    // 3. Revisar en la matriz de resoluciones primigenias oficiales
    const nro = (item.nro_resolucion_primigenia || '').trim().toUpperCase();
    if (nro) {
      const targetNorm = this.formatResolucionCode(nro).toUpperCase();
      const matriz = this.resolucionesPrimigeniasMatriz();
      const resFound = matriz.find(r => {
        const rn = (r.nro_resolucion || '').trim().toUpperCase();
        return rn === nro || this.formatResolucionCode(rn).toUpperCase() === targetNorm;
      });
      if (resFound) {
        const estRes = (resFound.estado || '').toUpperCase();
        if (estRes === 'VENCIDA' || estRes === 'CANCELADA' || estRes === 'INACTIVA') return true;
        if (resFound.observaciones && (resFound.observaciones.toUpperCase().includes('RENOVAD') || resFound.observaciones.toUpperCase().includes('CANCELAD'))) return true;
        if (resFound.fecha_fin_vigencia) {
          const d = new Date(resFound.fecha_fin_vigencia);
          if (!isNaN(d.getTime())) {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            if (d < hoy) return true;
          }
        }
      }
    }

    // 4. Si el propio vehículo tiene fecha_vigencia_hasta y ya venció
    if (item.fecha_vigencia_hasta) {
      const d = new Date(item.fecha_vigencia_hasta);
      if (!isNaN(d.getTime())) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (d < hoy) return true;
      }
    }

    return false;
  }

  isPrimigeniaTabVencida(prim: string): boolean {
    if (!prim) return false;
    const target = this.formatResolucionCode(prim).toUpperCase();
    const matriz = this.resolucionesPrimigeniasMatriz();
    const resFound = matriz.find(r => this.formatResolucionCode(r.nro_resolucion).toUpperCase() === target);
    if (resFound) {
      const est = (resFound.estado || '').toUpperCase();
      if (est === 'VENCIDA' || est === 'CANCELADA' || est === 'INACTIVA') return true;
      if (resFound.observaciones && (resFound.observaciones.toUpperCase().includes('RENOVAD') || resFound.observaciones.toUpperCase().includes('CANCELAD'))) return true;
      if (resFound.fecha_fin_vigencia) {
        const d = new Date(resFound.fecha_fin_vigencia);
        if (!isNaN(d.getTime())) {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          if (d < hoy) return true;
        }
      }
    }
    const vehs = this.flotaEmpresa().filter(i => !i.es_cronologico && this.formatResolucionCode(i.nro_resolucion_primigenia).toUpperCase() === target);
    if (vehs.length > 0 && vehs.every(v => this.esResolucionVencida(v))) {
      return true;
    }
    return false;
  }

  totalVehiculosEmpresaSinFiltro = computed(() => {
    return this.flotaEmpresa().filter(i => !i.es_cronologico).length;
  });

  totalVehiculosHabilitadosSinFiltro = computed(() => {
    return this.flotaEmpresa().filter(i => !i.es_cronologico && (i.estado || '').toUpperCase() === 'HABILITADO').length;
  });

  primigeniasDisponibles = computed(() => {
    const list = this.flotaEmpresa().filter(i => !i.es_cronologico);
    const primsFromFlota = list.map(i => this.formatResolucionCode(i.nro_resolucion_primigenia)).filter(Boolean);
    const primsFromMatriz = this.resolucionesPrimigeniasMatriz().map(r => this.formatResolucionCode(r.nro_resolucion)).filter(Boolean);
    const prims = Array.from(new Set([...primsFromFlota, ...primsFromMatriz]));
    return prims.sort();
  });

  getCantidadPorPrimigenia(prim: string): number {
    const target = this.formatResolucionCode(prim).toUpperCase();
    return this.flotaEmpresa().filter(i => !i.es_cronologico && this.formatResolucionCode(i.nro_resolucion_primigenia).toUpperCase() === target).length;
  }

  flotaEmpresaFiltrada = computed(() => {
    let list = [...this.flotaEmpresa()].filter(i => !i.es_cronologico);
    const q = (this.searchValue() || '').toLowerCase();
    const est = (this.estadoValue() || '').toUpperCase();
    const tipo = (this.tipoHijaValue() || '').toUpperCase();
    const primSelected = this.primigeniaFiltro();

    if (primSelected) {
      const primTarget = this.formatResolucionCode(primSelected).toUpperCase();
      list = list.filter(i => this.formatResolucionCode(i.nro_resolucion_primigenia).toUpperCase() === primTarget);
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

    // 4. Obtener Rutas oficiales de la Empresa y sus Resoluciones Primigenias
    this.service.getRutasEmpresa(ruc).subscribe({
      next: (resp) => {
        if (resp && resp.data) {
          this.rutasOficialesEmpresa.set(resp.data);
          // Actualizar mapa para tooltips y etiquetas completas
          const map = new Map<string, Ruta>(this.rutasOficialesMap());
          for (const r of resp.data) {
            const resNro = (r.resolucion?.nroResolucion || (r as any).nro_resolucion || '').trim().toUpperCase();
            const cod = (r.codigoRuta || '').trim().toUpperCase();
            if (cod) {
              map.set(cod, r);
              if (resNro) {
                map.set(`${resNro}_${cod}`, r);
                const sinPref = resNro.startsWith('R-') ? resNro.substring(2) : resNro;
                map.set(`${sinPref}_${cod}`, r);
              }
            }
          }
          this.rutasOficialesMap.set(map);
        }
      },
      error: (err) => console.warn('No se pudieron cargar rutas oficiales de la empresa:', err)
    });
  }

  limpiarEmpresaSeleccionada(): void {
    this.empresaSeleccionada.set(false);
    this.flotaEmpresa.set([]);
    this.empresaDetalle.set(null);
    this.resolucionesPrimigeniasMatriz.set([]);
    this.rutasOficialesEmpresa.set([]);
    this.estadisticas.set(null);
    this.razonSocialEmpresa.set('');
    this.pageIndex.set(0);
  }

  cargarVistaCronologica(): void {
    this.isLoadingCrono.set(true);
    this.flotaCronologica.set([]);
    this.pageIndexCrono.set(0);
    this.service.getFlotaPaginada({ skip: 0, limit: 50000 }).subscribe({
      next: (resp: any) => {
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

  abrirCrearVehiculo(nroPrimigenia?: string): void {
    const ruc = this.empresaSearchControl.value?.trim() || '';
    const razonSocial = this.razonSocialEmpresa();
    
    const dialogRef = this.dialog.open(FormVehiculoDialogComponent, {
      data: {
        modo: 'crear',
        ruc: ruc,
        razon_social: razonSocial,
        nro_resolucion_primigenia: nroPrimigenia || ''
      },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'dark-dialog-panel'
    });

    dialogRef.afterClosed().subscribe((created: boolean) => {
      if (created && ruc) {
        this.buscarFlotaEmpresa();
      }
    });
  }

  abrirTramitePrimigenia(item?: any): void {
    const ruc = this.empresaSearchControl.value?.trim() || '';
    const razonSocial = this.razonSocialEmpresa();

    if (!item) {
      const activas = this.rutasPorPrimigenia().filter(r => r.estado === 'VIGENTE' || r.estado === 'ACTIVA');
      if (activas.length > 0) {
        item = activas[0];
      } else if (this.rutasPorPrimigenia().length > 0) {
        item = this.rutasPorPrimigenia()[0];
      } else {
        this.snackBar.open('No hay resoluciones registradas para tramitar', 'Ok', { duration: 3000 });
        return;
      }
    }

    const dialogRef = this.dialog.open(FormTramitePrimigeniaDialogComponent, {
      data: {
        ruc: ruc,
        razon_social: razonSocial,
        nro_resolucion_primigenia: item?.primigenia || '',
        fecha_emision: item?.fechaEmision || '',
        fecha_inicio_vigencia: item?.fechaInicioVigencia || '',
        vigencia_hasta: item?.vigenciaHasta || '',
        rutas: item?.rutasArray || []
      },
      width: '980px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      panelClass: 'glass-dialog-panel'
    });

    dialogRef.afterClosed().subscribe((processed: boolean) => {
      if (processed && ruc) {
        this.buscarFlotaEmpresa();
      }
    });
  }

  abrirEditar(item: VehiculoEmpresa): void {
    if (this.esResolucionVencida(item)) {
      this.snackBar.open('Este vehículo pertenece a una resolución vencida y se encuentra bloqueado para modificaciones.', 'Cerrar', { duration: 4000 });
      return;
    }

    const dialogRef = this.dialog.open(FormVehiculoDialogComponent, {
      data: {
        modo: 'editar',
        ruc: item.ruc,
        razon_social: item.razon_social,
        nro_resolucion_primigenia: item.nro_resolucion_primigenia,
        vehiculo: item
      },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'dark-dialog-panel'
    });

    dialogRef.afterClosed().subscribe((updated: boolean) => {
      if (updated) {
        const ruc = this.empresaSearchControl.value?.trim();
        if (ruc) this.buscarFlotaEmpresa();
      }
    });
  }

  abrirCambiarTuc(item: VehiculoEmpresa): void {
    if (this.esResolucionVencida(item)) {
      this.snackBar.open('Este vehículo pertenece a una resolución vencida y se encuentra bloqueado para cambios de TUC.', 'Cerrar', { duration: 4000 });
      return;
    }

    const dialogRef = this.dialog.open(CambiarTucDialogComponent, {
      data: {
        vehiculo: item
      },
      width: '580px',
      maxWidth: '95vw',
      panelClass: 'cambiar-tuc-dialog-panel'
    });

    dialogRef.afterClosed().subscribe((updated: boolean) => {
      if (updated) {
        const ruc = this.empresaSearchControl.value?.trim();
        if (ruc) this.buscarFlotaEmpresa();
      }
    });
  }

  abrirGenerarTuc(item: VehiculoEmpresa): void {
    this.dialog.open(GenerarTucDialogComponent, {
      data: {
        vehiculo: item
      },
      width: '1000px',
      maxWidth: '96vw',
      panelClass: 'glass-dialog-panel'
    });
  }

  inhabilitarVehiculo(item: VehiculoEmpresa): void {
    if (this.esResolucionVencida(item)) {
      this.snackBar.open('Este vehículo pertenece a una resolución vencida y se encuentra bloqueado para cambios.', 'Cerrar', { duration: 4000 });
      return;
    }

    const motivo = prompt(`Ingrese el motivo para inhabilitar / dar de baja al vehículo ${item.placa}:`);
    if (!motivo || !motivo.trim()) return;

    this.service.update(item.id, {
      estado: 'INHABILITADO',
      observaciones_historial: [
        ...(item.observaciones_historial || []),
        {
          fecha: new Date().toISOString(),
          texto: `Inhabilitado: ${motivo.trim()}`,
          usuario: 'Operador DRTC'
        }
      ]
    }).subscribe({
      next: () => {
        this.snackBar.open(`Vehículo ${item.placa} fue inhabilitado correctamente.`, 'OK', { duration: 3000 });
        const ruc = this.empresaSearchControl.value?.trim();
        if (ruc) this.buscarFlotaEmpresa();
      },
      error: () => this.snackBar.open('Error al inhabilitar el vehículo.', 'Cerrar', { duration: 3000 })
    });
  }

  eliminarRegistro(id: string): void {
    const item = this.flotaEmpresa().find(i => i.id === id);
    if (item && this.esResolucionVencida(item)) {
      this.snackBar.open('Este vehículo pertenece a una resolución vencida y se encuentra bloqueado para eliminación.', 'Cerrar', { duration: 4000 });
      return;
    }

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

  formatResolucionCode(raw?: string): string {
    if (!raw) return '';
    let str = raw.trim().toUpperCase();
    if (!str || str === 'S/N' || str === 'SIN_PRIMIGENIA' || str === '-') return str;

    // 1. Quitar sufijo tipo "-S", "-I", "-FE", " - M", etc.
    const suffixMatch = str.match(/\s*[-_ ]\s*(FE|[ISRMDCO])$/i);
    if (suffixMatch) {
      str = str.substring(0, suffixMatch.index).trim();
    }

    // 2. Si ya empieza con 'R-', removerlo temporalmente para estandarizar 4 dígitos en el número y 4 en el año
    str = str.replace(/^R\s*[-_ ]?\s*/i, '');

    // 3. Evaluar patrón número y año (ej: "123-2026", "0123-2026", "123/2026")
    const match = str.match(/^(\d{1,6})[-_/](\d{4})$/);
    if (match) {
      const num = match[1].padStart(4, '0');
      const year = match[2];
      return `R-${num}-${year}`;
    }

    // 4. Si es solo un número de 1 a 6 dígitos
    const numOnlyMatch = str.match(/^(\d{1,6})$/);
    if (numOnlyMatch) {
      const num = numOnlyMatch[1].padStart(4, '0');
      const currentYear = new Date().getFullYear();
      return `R-${num}-${currentYear}`;
    }

    // 5. Si ya viene con formato 'R-XXXX-YYYY' u otro que contenga R-
    if (raw.trim().toUpperCase().startsWith('R-')) {
      return raw.trim().toUpperCase();
    }

    // Si tiene guión y 4 dígitos de año al final (ej: "0141-2024")
    const genericMatch = str.match(/^([A-Z0-9]+)[-_/](\d{4})$/);
    if (genericMatch) {
      return `R-${genericMatch[1]}-${genericMatch[2]}`;
    }

    return `R-${str}`;
  }

  cleanResolucionCode(raw?: string): string {
    return this.formatResolucionCode(raw);
  }

  getTipoHijaCode(tipoOrStr?: string): string {
    if (!tipoOrStr) return 'o';
    const clean = tipoOrStr.trim().toUpperCase();
    if (['I', 'INCREMENTO'].includes(clean)) return 'i';
    if (['S', 'SUSTITUCION', 'SUSTITUCIÓN'].includes(clean)) return 's';
    if (['M', 'MODIFICACION', 'MODIFICACIÓN'].includes(clean)) return 'm';
    if (['FE', 'FE_DE_ERRATAS', 'FE DE ERRATAS', 'FE DE ERRATA', 'FE-ERRATAS'].includes(clean)) return 'fe';
    if (['R', 'RENOVACION', 'RENOVACIÓN'].includes(clean)) return 'r';
    if (['D', 'DUPLICADO'].includes(clean)) return 'd';
    if (['C', 'CANCELACION', 'CANCELACIÓN', 'CANJE'].includes(clean)) return 'c';
    if (['O', 'OTROS', 'OTRO'].includes(clean)) return 'o';
    const match = clean.match(/[-_ ]\s*(FE|[ISRMDCO])$/);
    if (match) return match[1].toLowerCase();
    return 'o';
  }

  getTipoHijaLabel(tipoOrStr?: string): string {
    if (!tipoOrStr) return '';
    const clean = tipoOrStr.trim().toUpperCase();
    const map: Record<string, string> = {
      I: 'INCREMENTO',
      S: 'SUSTITUCIÓN',
      M: 'MODIFICACIÓN',
      FE: 'FE DE ERRATAS',
      R: 'RENOVACIÓN',
      D: 'DUPLICADO',
      C: 'CANCELACIÓN',
      O: 'OTROS'
    };
    if (map[clean]) return map[clean];
    const code = this.getTipoHijaCode(clean).toUpperCase();
    return map[code] || clean;
  }

  irACargaMasiva(): void {
    this.router.navigate(['/vehiculos-empresa/carga-masiva']);
  }
}
