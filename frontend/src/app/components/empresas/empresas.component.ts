import { Component, OnInit, signal, computed, effect, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

import { EmpresaService } from '../../services/empresa.service';
import { Empresa, EmpresaCreate, TipoSocio, TipoServicio, SunatData } from '../../models/empresa.model';

const ESTADOS_RUC: Record<string, string> = {
  '00': 'ACTIVO',
  '01': 'SUSPENSIÓN TEMPORAL',
  '02': 'BAJA PROVISIONAL',
  '03': 'BAJA DEFINITIVA',
  '11': 'BAJA PROVISIONAL DE OFICIO',
  '12': 'BAJA DEFINITIVA DE OFICIO'
};


@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatChipsModule,
    MatSelectModule,
    MatDialogModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTabsModule,
    MatTooltipModule,
    MatDividerModule,
    MatBadgeModule
  ],
  template: `
    <div class="page-container">
      <!-- Header Banner -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-with-icon">
            <mat-icon class="header-icon">business</mat-icon>
            <div>
              <h1>Gestión de Empresas</h1>
              <p class="subtitle">Administración de empresas transportistas, autorizaciones y sus representantes legales</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <!-- Botón Exportar Excel con Menú -->
          <button mat-button class="header-action-btn" [matMenuTriggerFor]="exportExcelMenu" [disabled]="isLoading()" matTooltip="Exportar empresas a Excel">
            <mat-icon class="btn-icon">file_download</mat-icon>
            <span class="btn-text">Exportar Excel</span>
            <mat-icon class="dropdown-arrow">arrow_drop_down</mat-icon>
          </button>
          <mat-menu #exportExcelMenu="matMenu">
            <button mat-menu-item (click)="exportarExcelSeleccionadas()" [disabled]="empresasSeleccionadas().size === 0">
              <mat-icon color="primary">check_box</mat-icon>
              <span>Exportar Seleccionadas ({{ empresasSeleccionadas().size }})</span>
            </button>
            <button mat-menu-item (click)="exportarExcel()">
              <mat-icon color="accent">filter_alt</mat-icon>
              <span>Exportar Vista Filtrada ({{ empresasFiltradas().length }})</span>
            </button>
            <button mat-menu-item (click)="exportarExcelTodas()">
              <mat-icon style="color: #10b981;">table_chart</mat-icon>
              <span>Exportar Todas ({{ empresas().length }})</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="descargarPlantilla()">
              <mat-icon>description</mat-icon>
              <span>Descargar Plantilla Excel</span>
            </button>
          </mat-menu>

          <!-- Botón Carga Masiva con Menú -->
          <button mat-button class="header-action-btn" [matMenuTriggerFor]="cargaMasivaMenu" [disabled]="isLoading()" matTooltip="Carga masiva de empresas">
            <mat-icon class="btn-icon">file_upload</mat-icon>
            <span class="btn-text">Carga Masiva</span>
            <mat-icon class="dropdown-arrow">arrow_drop_down</mat-icon>
          </button>
          <mat-menu #cargaMasivaMenu="matMenu">
            <button mat-menu-item (click)="abrirCargaMasivaGoogleSheets()">
              <mat-icon color="primary">cloud_upload</mat-icon>
              <span>Cargar desde Google Sheets</span>
            </button>
            <button mat-menu-item (click)="abrirCargaMasiva()">
              <mat-icon color="accent">upload_file</mat-icon>
              <span>Cargar desde Archivo Excel (.xlsx)</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="abrirActualizarDatos()">
              <mat-icon style="color: #f59e0b;">update</mat-icon>
              <span>Actualizar Datos en Bloque desde Excel</span>
            </button>
          </mat-menu>

          <!-- Botón Nueva Empresa -->
          <button mat-button class="header-action-btn btn-primary-custom" (click)="crearEmpresa()" [disabled]="isLoading()" matTooltip="Registrar nueva empresa">
            <mat-icon class="btn-icon">domain_add</mat-icon>
            <span class="btn-text">Nueva Empresa</span>
          </button>
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
                <input matInput [formControl]="searchControl" placeholder="Buscar por RUC, Razón Social o Nombre...">
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
                  <mat-option value="AUTORIZADA">Autorizada</mat-option>
                  <mat-option value="EN_TRAMITE">En Trámite</mat-option>
                  <mat-option value="SUSPENDIDA">Suspendida</mat-option>
                  <mat-option value="CANCELADA">Cancelada</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Select Servicio -->
              <mat-form-field appearance="outline" class="filter-select" subscriptSizing="dynamic">
                <mat-label>Servicio / Modalidad</mat-label>
                <mat-select [ngModel]="servicioFilter()" (ngModelChange)="servicioFilter.set($event); currentPage.set(0)">
                  <mat-option value="">Todos los Servicios</mat-option>
                  @for (srv of serviciosDisponibles; track srv) {
                    <mat-option [value]="srv">{{ srv }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <!-- Botón Limpiar filtros -->
              @if (searchControl.value || estadoControl.value || servicioFilter()) {
                <button mat-button type="button" (click)="limpiarFiltros()" class="filter-action-btn btn-reset" matTooltip="Limpiar todos los filtros">
                  <mat-icon>filter_alt_off</mat-icon>
                  <span>Limpiar</span>
                </button>
              }

              <!-- Botón Configurar Columnas -->
              <button mat-button type="button" (click)="abrirConfiguracionColumnas()" class="filter-action-btn" matTooltip="Configurar columnas visibles">
                <mat-icon>tune</mat-icon>
                <span>Columnas</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Banner de Selección Múltiple -->
        @if (empresasSeleccionadas().size > 0) {
          <div class="selection-banner animate-fade-in">
            <div class="banner-info">
              <mat-icon class="banner-icon">check_circle</mat-icon>
              <span><strong>{{ empresasSeleccionadas().size }}</strong> empresa(s) seleccionada(s)</span>
            </div>
            <div class="banner-actions">
              <button mat-raised-button color="accent" (click)="exportarExcelSeleccionadas()">
                <mat-icon>file_download</mat-icon> Exportar Seleccionadas
              </button>
              <button mat-raised-button color="primary" (click)="abrirEdicionBloqueEstado()">
                <mat-icon>edit</mat-icon> Cambiar Estado en Bloque
              </button>
              <button mat-raised-button color="primary" (click)="abrirEdicionBloqueServicios()">
                <mat-icon>category</mat-icon> Cambiar Servicios en Bloque
              </button>
              <button mat-button (click)="limpiarSeleccion()" class="btn-clear-selection">
                <mat-icon>close</mat-icon> Desmarcar todo
              </button>
            </div>
          </div>
        }

        <!-- Tabla de Resultados -->
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando empresas de transporte...</p>
          </div>
        } @else if (empresasFiltradas().length === 0) {
          <mat-card class="empty-state">
            <mat-card-content>
              <mat-icon class="empty-icon">business</mat-icon>
              <h3>No se encontraron empresas</h3>
              <p>Intenta ajustar los filtros de búsqueda o registra una nueva empresa.</p>
              <button mat-raised-button color="primary" (click)="crearEmpresa()">
                <mat-icon>add</mat-icon> Registrar Primera Empresa
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
                      @if (columnaVisible('seleccionar')) {
                        <th class="checkbox-th text-center">
                          <mat-checkbox
                            [checked]="isAllSelected()"
                            [indeterminate]="isSomeSelected()"
                            (change)="toggleSelectAll($event)"
                            matTooltip="Seleccionar / deseleccionar todas las empresas">
                          </mat-checkbox>
                        </th>
                      }
                      @if (columnaVisible('ruc')) {
                        <th (click)="toggleSort('ruc')" class="sortable-th ruc-th">
                          <span>RUC</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('ruc') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('razonSocial')) {
                        <th (click)="toggleSort('razonSocial')" class="sortable-th razon-th">
                          <span>Razón Social</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('razonSocial') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('partidaRegistral')) {
                        <th (click)="toggleSort('partidaRegistral')" class="sortable-th">
                          <span>Partida Registral</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('partidaRegistral') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('estado')) {
                        <th (click)="toggleSort('estado')" class="sortable-th">
                          <span>Estado Legal</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('estado') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('servicios')) {
                        <th (click)="toggleSort('servicios')" class="sortable-th">
                          <span>Tipos de Servicio</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('servicios') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('representante')) {
                        <th (click)="toggleSort('representante')" class="sortable-th">
                          <span>Representante Legal</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('representante') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('contacto')) {
                        <th (click)="toggleSort('contacto')" class="sortable-th">
                          <span>Contacto</span>
                          <mat-icon class="sort-icon">{{ getSortIcon('contacto') }}</mat-icon>
                        </th>
                      }
                      @if (columnaVisible('estadoSunat')) {
                        <th class="text-center">
                          <span>Estado SUNAT</span>
                        </th>
                      }
                      @if (columnaVisible('acciones')) {
                        <th class="text-center th-actions-icon-col" matTooltip="Opciones y Acciones">
                          <mat-icon class="th-actions-icon">more_vert</mat-icon>
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (empresa of empresasPaginadas(); track empresa.id) {
                      <tr [class.selected-row]="empresasSeleccionadas().has(empresa.id)">
                        @if (columnaVisible('seleccionar')) {
                          <td class="checkbox-td text-center" (click)="$event.stopPropagation()">
                            <mat-checkbox
                              [checked]="empresasSeleccionadas().has(empresa.id)"
                              (change)="toggleSeleccionar(empresa.id, $event)">
                            </mat-checkbox>
                          </td>
                        }
                        @if (columnaVisible('ruc')) {
                          <td class="ruc-cell">
                            <div class="ruc-cell-stacked">
                              <span class="ruc-badge">{{ empresa.ruc }}</span>
                              <div class="ruc-meta-row">
                                <span [class]="'status-pill status-' + (empresa.estado ? empresa.estado.toLowerCase() : 'autorizada')"
                                      [matTooltip]="'Estado legal: ' + (empresa.estado || 'AUTORIZADA')">
                                  {{ (empresa.estado || 'AUTORIZADA').toUpperCase() }}
                                </span>
                                @for (srv of (empresa.tiposServicio || []).slice(0, 1); track srv) {
                                  <span class="service-tag-mini" [matTooltip]="'Tipo de Servicio: ' + srv">
                                    {{ getServicioAbreviado(srv) }}
                                  </span>
                                }
                                @if ((empresa.tiposServicio || []).length > 1) {
                                  <span class="service-tag-mini badge-more" [matTooltip]="empresa.tiposServicio.join(', ')">
                                    +{{ (empresa.tiposServicio || []).length - 1 }}
                                  </span>
                                }
                              </div>
                            </div>
                          </td>
                        }
                        @if (columnaVisible('razonSocial')) {
                          <td class="razon-social-td">
                            <div class="empresa-name-container">
                              <span class="bold-text color-primary">{{ empresa.razonSocial.principal }}</span>
                            </div>
                          </td>
                        }
                        @if (columnaVisible('partidaRegistral')) {
                          <td>
                            @if (empresa.partidaRegistral) {
                              <span class="partida-pill-mini" [matTooltip]="'Partida Registral (SUNARP): ' + empresa.partidaRegistral">
                                <mat-icon class="partida-mini-icon">verified</mat-icon> {{ empresa.partidaRegistral }}
                              </span>
                            } @else {
                              <span style="font-size: 0.8rem; color: #9ca3af;">—</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('estado')) {
                          <td>
                            <span [class]="'status-pill status-' + (empresa.estado ? empresa.estado.toLowerCase() : 'autorizada')">
                              {{ getEstadoDisplayName(empresa.estado) }}
                            </span>
                          </td>
                        }
                        @if (columnaVisible('servicios')) {
                          <td>
                            <div class="services-chips-flex">
                              @for (srv of (empresa.tiposServicio || []).slice(0, 2); track srv) {
                                <span class="service-tag">{{ srv }}</span>
                              }
                              @if ((empresa.tiposServicio || []).length > 2) {
                                <span class="service-tag badge-more" [matTooltip]="empresa.tiposServicio.join(', ')">
                                  +{{ (empresa.tiposServicio || []).length - 2 }}
                                </span>
                              }
                            </div>
                          </td>
                        }
                        @if (columnaVisible('representante')) {
                          <td>
                            @if (getRepresentanteLegal(empresa)) {
                              <div class="representante-info">
                                <strong class="rep-name">{{ getRepresentanteLegal(empresa)?.nombres }} {{ getRepresentanteLegal(empresa)?.apellidos }}</strong>
                                <span class="rep-dni">DNI: {{ getRepresentanteLegal(empresa)?.dni }}</span>
                                @if (getSociosAdicionales(empresa).length > 0) {
                                  <div class="socios-extra-chips">
                                    @for (socio of getSociosAdicionales(empresa).slice(0,2); track socio.dni) {
                                      <span class="socio-chip" [matTooltip]="socio.tipoSocio + ': ' + socio.nombres + ' ' + socio.apellidos + ' (DNI: ' + socio.dni + ')'">
                                        {{ getLabelCargo(socio.tipoSocio) }}: {{ socio.apellidos }}
                                      </span>
                                    }
                                    @if (getSociosAdicionales(empresa).length > 2) {
                                      <span class="socio-chip socio-chip-more" [matTooltip]="getSociosTooltip(empresa)">
                                        +{{ getSociosAdicionales(empresa).length - 2 }} más
                                      </span>
                                    }
                                  </div>
                                }
                              </div>
                            } @else if ((empresa.socios || []).length > 0) {
                              <div class="representante-info">
                                <strong class="rep-name">{{ empresa.socios[0].nombres }} {{ empresa.socios[0].apellidos }}</strong>
                                <span class="rep-cargo">{{ getLabelCargo(empresa.socios[0].tipoSocio) }}</span>
                                <span class="rep-dni">DNI: {{ empresa.socios[0].dni }}</span>
                              </div>
                            } @else {
                              <span class="sin-datos">-</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('contacto')) {
                          <td>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                              @if (empresa.emailContacto) {
                                <span class="contact-text" [matTooltip]="empresa.emailContacto">
                                  <mat-icon class="inline-icon">email</mat-icon> {{ empresa.emailContacto }}
                                </span>
                              }
                              @if (empresa.telefonoContacto) {
                                <span class="contact-text">
                                  <mat-icon class="inline-icon">phone</mat-icon> {{ empresa.telefonoContacto }}
                                </span>
                              }
                              @if (!empresa.emailContacto && !empresa.telefonoContacto) {
                                <span class="sin-datos">-</span>
                              }
                            </div>
                          </td>
                        }
                        @if (columnaVisible('estadoSunat')) {
                          <td class="text-center">
                            @if (sunatCargando().has(empresa.ruc)) {
                              <mat-progress-bar mode="indeterminate" style="width:80px; margin:auto;"></mat-progress-bar>
                            } @else if (sunatCache().has(empresa.ruc)) {
                              <div class="sunat-status-cell">
                                @let sData = sunatCache().get(empresa.ruc);
                                @if (sData) {
                                  <div class="sunat-cell">
                                    <div class="sunat-badges">
                                      <span [class]="'sunat-state-pill sunat-' + (sData.esActivo ? 'activo' : 'baja')">
                                        <mat-icon>{{ sData.esActivo ? 'check_circle' : 'cancel' }}</mat-icon>
                                        {{ sData.esActivo ? 'ACTIVO' : 'BAJA' }}
                                      </span>
                                      <span [class]="'sunat-habido-pill ' + (sData.esHabido ? 'habido' : 'no-habido')">
                                        {{ sData.esHabido ? 'HABIDO' : 'NO HABIDO' }}
                                      </span>
                                    </div>
                                    <span class="sunat-desc-text" [matTooltip]="sData.desc_estado || ''">
                                      {{ getSunatEstadoDesc(sData.ddp_estado) || sData.desc_estado }}
                                    </span>
                                    @if (sData.ddp_nombre && sData.ddp_nombre !== empresa.razonSocial.sunat) {
                                      <span class="sunat-nombre-hint" [matTooltip]="'SUNAT: ' + sData.ddp_nombre">
                                        <mat-icon style="font-size:12px;width:12px;height:12px;">info</mat-icon>
                                        {{ sData.ddp_nombre | slice:0:25 }}{{ (sData.ddp_nombre.length || 0) > 25 ? '...' : '' }}
                                      </span>
                                    }
                                  </div>
                                }
                              </div>
                            } @else {
                              <button mat-icon-button class="btn-consultar-sunat" (click)="consultarSunat(empresa)" matTooltip="Consultar estado en SUNAT">
                                <mat-icon>fact_check</mat-icon>
                              </button>
                            }
                          </td>
                        }
                        @if (columnaVisible('acciones')) {
                          <td class="text-center">
                            <button mat-icon-button [matMenuTriggerFor]="actionMenu" [matMenuTriggerData]="{ empresa: empresa }" matTooltip="Opciones de la Empresa">
                              <mat-icon>more_vert</mat-icon>
                            </button>
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <mat-menu #actionMenu="matMenu">
                <ng-template matMenuContent let-empresa="empresa">
                  <button mat-menu-item (click)="verDetalle(empresa.id)">
                    <mat-icon color="primary">visibility</mat-icon>
                    <span>Ver Detalle de Empresa</span>
                  </button>
                  <button mat-menu-item (click)="editarEmpresa(empresa.id)">
                    <mat-icon color="accent">edit</mat-icon>
                    <span>Editar Empresa</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="consultarSunat(empresa)" [disabled]="sunatCargando().has(empresa.ruc)">
                    <mat-icon style="color: #059669;">fact_check</mat-icon>
                    <span>Consultar Estado SUNAT</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="eliminarEmpresa(empresa.id)">
                    <mat-icon color="warn">delete</mat-icon>
                    <span>Eliminar Empresa</span>
                  </button>
                </ng-template>
              </mat-menu>

              <mat-paginator
                [pageSizeOptions]="[10, 25, 50, 100, 250]"
                [pageSize]="pageSize()"
                [length]="empresasFiltradas().length"
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
          width: 180px;
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
            background-color: #eef2ff !important;
            color: #4338ca !important;

            .sort-icon {
              color: #4338ca !important;
            }
          }

          span {
            display: inline-block;
            vertical-align: middle;
          }

          .sort-icon {
            font-size: 1.1rem;
            width: 1.1rem;
            height: 1.1rem;
            vertical-align: middle;
            margin-left: 4px;
            color: #94a3b8;
            transition: color 0.2s ease;
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

    .ruc-th, .ruc-cell {
      width: 135px;
      min-width: 125px;
      max-width: 145px;
      white-space: nowrap;
    }

    .razon-th, .razon-social-td {
      min-width: 280px;
    }

    .ruc-cell-stacked {
      display: flex;
      flex-direction: column;
      gap: 3px;
      width: fit-content;
      max-width: 130px;

      .ruc-badge {
        background-color: #e0e7ff;
        color: #3730a3;
        padding: 0.20rem 0.45rem;
        border-radius: 5px;
        font-family: monospace;
        font-weight: 800;
        font-size: 0.92rem;
        letter-spacing: 0.5px;
        width: fit-content;
        line-height: 1.25;
        display: inline-block;
      }

      .ruc-meta-row {
        display: flex;
        align-items: center;
        gap: 3px;
        flex-wrap: nowrap;
        width: 100%;

        .status-pill {
          padding: 1.5px 3.5px;
          font-size: 0.58rem;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: 0.2px;
          border-radius: 3px;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .service-tag-mini {
          font-size: 0.56rem;
          line-height: 1.1;
          font-weight: 700;
          background-color: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 1.5px 3.5px;
          border-radius: 3px;
          white-space: nowrap;
          text-transform: uppercase;

          &.badge-more {
            background-color: #e2e8f0;
            color: #334155;
            padding: 1.5px 3px;
          }
        }
      }
    }

    .bold-text { font-weight: 600; }
    .color-primary { color: #4338ca; }

    .empresa-name-container {
      min-width: 280px;
      .bold-text {
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.35;
        display: block;
      }
    }

    .status-pill {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;

      &.status-autorizada { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
      &.status-en_tramite { background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
      &.status-suspendida { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
      &.status-cancelada { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; font-weight: 800; }
    }

    .partida-pill-mini {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background-color: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      font-family: monospace;

      .partida-mini-icon {
        font-size: 11px;
        width: 11px;
        height: 11px;
        color: #d97706;
      }
    }

    .services-chips-flex {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;

      .service-tag {
        font-size: 0.72rem;
        font-weight: 700;
        background-color: #e0f2fe;
        color: #0369a1;
        padding: 0.15rem 0.45rem;
        border-radius: 4px;

        &.badge-more {
          background-color: #f1f5f9;
          color: #475569;
        }
      }
    }

    .representante-info {
      display: flex;
      flex-direction: column;
      font-size: 0.82rem;
      gap: 0.1rem;

      .rep-name {
        color: #1e293b;
        font-weight: 600;
      }

      .rep-cargo {
        font-size: 0.72rem;
        font-weight: 700;
        color: #4338ca;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .rep-dni {
        font-size: 0.75rem;
        color: #64748b;
        font-family: monospace;
      }

      .socios-extra-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-top: 0.2rem;
      }

      .socio-chip {
        font-size: 0.68rem;
        font-weight: 600;
        background-color: #f0f9ff;
        color: #0369a1;
        border: 1px solid #bae6fd;
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        cursor: help;
        white-space: nowrap;
        transition: background-color 0.15s;

        &:hover { background-color: #e0f2fe; }

        &.socio-chip-more {
          background-color: #f8fafc;
          color: #64748b;
          border-color: #e2e8f0;
        }
      }
    }

    .empresa-name-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.2rem;

      .empresa-hint-text {
        font-size: 0.72rem;
        font-weight: 700;
        color: #64748b;
      }

      .rs-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        cursor: help;
        max-width: 220px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.rs-sunat {
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        &.rs-minimo {
          background-color: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
      }
    }

    /* ── SUNAT Status Column ───────────────────────────────────── */
    .sunat-status-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;

      .sunat-badges {
        display: flex;
        gap: 0.3rem;
        flex-wrap: wrap;
        justify-content: center;
      }

      .sunat-state-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        padding: 0.15rem 0.5rem;
        border-radius: 10px;
        font-size: 0.7rem;
        font-weight: 700;

        mat-icon {
          font-size: 0.85rem;
          width: 0.85rem;
          height: 0.85rem;
        }

        &.sunat-activo {
          background-color: #dcfce7;
          color: #15803d;
        }

        &.sunat-baja {
          background-color: #fee2e2;
          color: #b91c1c;
        }
      }

      .sunat-habido-pill {
        display: inline-block;
        padding: 0.1rem 0.4rem;
        border-radius: 8px;
        font-size: 0.65rem;
        font-weight: 700;

        &.habido {
          background-color: #e0f2fe;
          color: #0369a1;
        }

        &.no-habido {
          background-color: #fff7ed;
          color: #c2410c;
        }
      }

      .sunat-desc-text {
        font-size: 0.68rem;
        color: #64748b;
        text-align: center;
        max-width: 140px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: help;
      }

      .sunat-nombre-hint {
        display: inline-flex;
        align-items: center;
        gap: 0.15rem;
        font-size: 0.65rem;
        color: #94a3b8;
        cursor: help;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 140px;
      }
    }

    .btn-consultar-sunat {
      color: #059669;
      transition: color 0.15s, transform 0.15s;

      &:hover {
        color: #047857;
        transform: scale(1.1);
      }
    }


    .contact-text {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.82rem;
      color: #475569;

      .inline-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
        color: #64748b;
      }
    }

    .sin-datos { color: #cbd5e1; }
    .text-center { text-align: center; }

    .checkbox-th, .checkbox-td {
      width: 48px;
      min-width: 48px;
      padding: 0 0.5rem !important;
      text-align: center;
    }

    .selected-row {
      background-color: #eef2ff !important;
      td { background-color: #eef2ff !important; }
    }

    /* Mobile Filter Toggle */
    .mobile-filter-toggle { display: none; }
    .collapsible-filters { display: contents; }

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
      }

      .collapsible-filters.show { display: flex; }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;

        .header-action-btn {
          flex: 1;
          min-width: 0 !important;
          height: 42px !important;
          padding: 0 !important;
          justify-content: center;

          .btn-text, .dropdown-arrow { display: none !important; }
          .btn-icon { margin: 0 !important; }
        }
      }

      .glass-filters .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-select, .search-field {
        width: 100% !important;
        flex: none !important;
      }
    }

    /* Dark Mode Support */
    :host-context([data-theme="dark"]), :host-context(.dark-theme), :host-context(.dark-mode) {
      .header-actions .header-action-btn {
        background-color: rgba(30, 41, 59, 0.7) !important;
        color: #f8fafc !important;
        border-color: #475569 !important;

        .btn-icon, .dropdown-arrow { color: #f8fafc !important; }
        &:hover { background-color: #334155 !important; }

        &.btn-primary-custom {
          background-color: #6366f1 !important;
          border-color: #818cf8 !important;
          &:hover { background-color: #4f46e5 !important; }
        }
      }

      .mobile-filter-toggle {
        background-color: #334155 !important;
        color: #cbd5e1 !important;
      }

      .mobile-filter-toggle.active {
        background-color: #1e1b4b !important;
        color: #818cf8 !important;
      }

      .page-header {
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%) !important;
        border: 1px solid #334155 !important;
      }

      .glass-filters {
        background: #1e293b !important;
        border-color: #334155 !important;
      }

      .filter-action-btn {
        background: #0f172a !important;
        border-color: #334155 !important;
        color: #f8fafc !important;

        .mat-icon { color: #94a3b8 !important; }
        &:hover { background: #334155 !important; }

        &.btn-reset {
          background: rgba(239, 68, 68, 0.2) !important;
          border-color: #ef4444 !important;
          color: #fca5a5 !important;
          .mat-icon { color: #ef4444 !important; }
        }
      }

      .table-card {
        background: #1e293b !important;
        border-color: #334155 !important;
      }

      .custom-table {
        background-color: #1e293b !important;
        color: #f8fafc !important;

        th {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
          border-bottom-color: #334155 !important;
        }

        td {
          background-color: #1e293b !important;
          border-bottom-color: #334155 !important;
          color: #cbd5e1 !important;
        }

        tr:hover td {
          background-color: #334155 !important;
          color: #ffffff !important;
        }

        th:first-child, th:last-child {
          background-color: #0f172a !important;
          box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.4) !important;
        }

        td:first-child, td:last-child {
          background-color: #1e293b !important;
          box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.4) !important;
        }

        tr:hover td:first-child, tr:hover td:last-child {
          background-color: #334155 !important;
        }

        tr.selected-row td {
          background-color: #312e81 !important;
          color: #e0e7ff !important;
        }
      }

      .bold-text.color-primary { color: #a5b4fc !important; }

      .ruc-badge {
        background-color: #312e81 !important;
        color: #c7d2fe !important;
        border: 1px solid #4338ca !important;
      }

      .empresa-hint-text { color: #cbd5e1 !important; }

      .status-pill {
        &.status-autorizada { background-color: rgba(22, 101, 52, 0.35) !important; color: #4ade80 !important; border: 1px solid #166534 !important; }
        &.status-en_tramite { background-color: rgba(180, 83, 9, 0.35) !important; color: #fcd34d !important; border: 1px solid #b45309 !important; }
        &.status-suspendida { background-color: rgba(185, 28, 28, 0.35) !important; color: #fca5a5 !important; border: 1px solid #991b1b !important; }
        &.status-cancelada { background-color: rgba(100, 116, 139, 0.35) !important; color: #cbd5e1 !important; border: 1px solid #475569 !important; }
      }

      .services-chips-flex .service-tag {
        background-color: #0369a1 !important;
        color: #ffffff !important;
      }

      .representante-info {
        .rep-name { color: #f8fafc !important; }
        .rep-dni { color: #94a3b8 !important; }
      }

      .contact-text {
        color: #cbd5e1 !important;
        .inline-icon { color: #94a3b8 !important; }
      }

      ::ng-deep {
        .search-field .mat-mdc-text-field-wrapper, .filter-select .mat-mdc-text-field-wrapper {
          background-color: #0f172a !important;
        }

        .mat-mdc-select-value-text, input.mat-mdc-input-element {
          color: #f1f5f9 !important;
        }

        .mat-mdc-floating-label { color: #94a3b8 !important; }
        .mat-mdc-select-arrow { color: #94a3b8 !important; }

        .mdc-notched-outline__leading,
        .mdc-notched-outline__notch,
        .mdc-notched-outline__trailing {
          border-color: #334155 !important;
        }

        .mat-mdc-paginator {
          background-color: #1e293b !important;
          color: #cbd5e1 !important;

          .mat-mdc-paginator-range-label,
          .mat-mdc-paginator-page-size-label,
          .mat-mdc-select-value-text,
          .mat-mdc-paginator-navigation-previous,
          .mat-mdc-paginator-navigation-next {
            color: #cbd5e1 !important;
          }
        }
      }

      .selection-banner {
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%) !important;
        border-color: #4338ca !important;
        color: #e0e7ff !important;
      }

      .btn-clear-selection { color: #a5b4fc !important; }
    }
  `]
})
export class EmpresasComponent implements OnInit {
  // Signals
  isLoading = signal(false);
  empresas = signal<Empresa[]>([]);
  pageSize = signal(10);
  currentPage = signal(0);
  searchTerm = signal('');
  estadoFilter = signal('');
  servicioFilter = signal<string>('');
  showMobileFilters = signal<boolean>(false);

  columnasVisibles = signal<string[]>([
    'seleccionar',
    'ruc',
    'razonSocial',
    'representante',
    'contacto',
    'acciones'
  ]);
  empresasSeleccionadas = signal<Set<string>>(new Set());

  // Signals SUNAT
  sunatCache = signal<Map<string, SunatData>>(new Map());
  sunatCargando = signal<Set<string>>(new Set());

  // Expose ESTADOS_RUC for template use
  readonly ESTADOS_RUC = ESTADOS_RUC;

  // Servicios disponibles
  serviciosDisponibles: TipoServicio[] = [
    TipoServicio.PASAJEROS,
    TipoServicio.TURISMO,
    TipoServicio.TRABAJADORES,
    TipoServicio.MERCANCIAS,
    TipoServicio.CARGA,
    TipoServicio.INFRAESTRUCTURA,
    TipoServicio.OTROS,
    TipoServicio.MIXTO
  ];

  // Configuración de columnas
  columnasDisponibles = [
    { id: 'seleccionar', label: 'Seleccionar', visible: true },
    { id: 'ruc', label: 'RUC', visible: true },
    { id: 'razonSocial', label: 'Razón Social', visible: true },
    { id: 'partidaRegistral', label: 'Partida Registral (Columna)', visible: false },
    { id: 'estado', label: 'Estado Legal (Columna separada)', visible: false },
    { id: 'servicios', label: 'Tipos de Servicio (Columna separada)', visible: false },
    { id: 'representante', label: 'Representante / Socios', visible: true },
    { id: 'contacto', label: 'Contacto', visible: true },
    { id: 'estadoSunat', label: 'Estado SUNAT', visible: false },
    { id: 'acciones', label: 'Acciones', visible: true }
  ];

  // Form Controls
  searchControl = new FormBuilder().control('');
  estadoControl = new FormBuilder().control('');

  // Señales para ordenamiento por columna
  sortField = signal<string>('razonSocial');
  sortDirection = signal<'asc' | 'desc'>('asc');

  toggleSort(column: string): void {
    if (this.sortField() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: string): string {
    if (this.sortField() !== column) {
      return 'unfold_more';
    }
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  columnaVisible(colId: string): boolean {
    return this.columnasVisibles().includes(colId);
  }

  // Computed - empresas filtradas y ordenadas
  empresasFiltradas = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const estado = this.estadoFilter();
    const servicio = this.servicioFilter();

    const filtered = this.empresas().filter(e => {
      const rep = this.getRepresentanteLegal(e);
      const repNombre = rep ? `${rep.nombres} ${rep.apellidos}`.toLowerCase() : '';
      const repDni = rep ? rep.dni : '';

      const matchSearch = !search ||
        e.ruc.toLowerCase().includes(search) ||
        e.razonSocial.principal.toLowerCase().includes(search) ||
        (e.razonSocial.sunat && e.razonSocial.sunat.toLowerCase().includes(search)) ||
        (e.partidaRegistral && e.partidaRegistral.toLowerCase().includes(search)) ||
        repNombre.includes(search) ||
        repDni.includes(search);

      const matchEstado = !estado || e.estado === estado;
      const matchServicio = !servicio || (e.tiposServicio && e.tiposServicio.includes(servicio as TipoServicio));

      return matchSearch && matchEstado && matchServicio;
    });

    const field = this.sortField();
    const isAsc = this.sortDirection() === 'asc';

    return [...filtered].sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (field) {
        case 'ruc':
          valA = a.ruc || '';
          valB = b.ruc || '';
          break;
        case 'razonSocial':
          valA = a.razonSocial?.principal || '';
          valB = b.razonSocial?.principal || '';
          break;
        case 'partidaRegistral':
          valA = a.partidaRegistral || '';
          valB = b.partidaRegistral || '';
          break;
        case 'estado':
          valA = a.estado || '';
          valB = b.estado || '';
          break;
        case 'servicios':
          valA = (a.tiposServicio || []).join(', ');
          valB = (b.tiposServicio || []).join(', ');
          break;
        case 'representante':
          const repA = this.getRepresentanteLegal(a);
          const repB = this.getRepresentanteLegal(b);
          valA = repA ? `${repA.nombres} ${repA.apellidos}` : '';
          valB = repB ? `${repB.nombres} ${repB.apellidos}` : '';
          break;
        case 'emailContacto':
          valA = a.emailContacto || '';
          valB = b.emailContacto || '';
          break;
        case 'telefonoContacto':
          valA = a.telefonoContacto || '';
          valB = b.telefonoContacto || '';
          break;
      }

      const res = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
      return isAsc ? res : -res;
    });
  });

  // Computed - empresas paginadas
  empresasPaginadas = computed(() => {
    const filtradas = this.empresasFiltradas();
    return filtradas.slice(
      this.currentPage() * this.pageSize(),
      (this.currentPage() + 1) * this.pageSize()
    );
  });

  isAllSelected = computed(() => {
    const filtradas = this.empresasFiltradas();
    if (filtradas.length === 0) return false;
    const set = this.empresasSeleccionadas();
    return filtradas.every(e => set.has(e.id));
  });

  isSomeSelected = computed(() => {
    const filtradas = this.empresasFiltradas();
    if (filtradas.length === 0) return false;
    const set = this.empresasSeleccionadas();
    const count = filtradas.filter(e => set.has(e.id)).length;
    return count > 0 && count < filtradas.length;
  });

  constructor(
    private empresaService: EmpresaService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient
  ) {
    this.searchControl.valueChanges.subscribe(value => {
      this.searchTerm.set(value || '');
      this.currentPage.set(0);
    });

    this.estadoControl.valueChanges.subscribe(value => {
      this.estadoFilter.set(value || '');
      this.currentPage.set(0);
    });
  }

  ngOnInit(): void {
    // Restaurar columnas visibles desde localStorage (v2 con RUC/Estado/Servicio compactado)
    const savedColumns = localStorage.getItem('drtc_empresas_columnas_v2');
    if (savedColumns) {
      try {
        const cols: string[] = JSON.parse(savedColumns);
        if (Array.isArray(cols) && cols.length > 0) {
          this.columnasVisibles.set(cols);
          // Sincronizar columnasDisponibles con el estado guardado
          this.columnasDisponibles = this.columnasDisponibles.map(c => ({
            ...c,
            visible: cols.includes(c.id)
          }));
        }
      } catch (e) {
        console.warn('No se pudo restaurar configuración de columnas:', e);
      }
    }
    this.cargarEmpresas();
  }

  cargarEmpresas(): void {
    this.isLoading.set(true);
    this.empresaService.getEmpresas(0, 10000).subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);

        // Pre-cargar caché SUNAT desde la base de datos si existen datos guardados
        const initialCache = new Map(this.sunatCache());
        empresas.forEach(e => {
          if (e.datosSunat) {
            const d = e.datosSunat as any;
            const sunatData: SunatData = {
              ddp_nombre: d.ddp_nombre || d.razonSocial || e.razonSocial?.sunat || '',
              ddp_estado: d.ddp_estado || (d.valido ? '00' : '10'),
              desc_estado: d.desc_estado || (d.valido ? 'ACTIVO' : 'INACTIVO'),
              esActivo: d.esActivo === true || d.valido === true,
              esHabido: d.esHabido === true || d.condicion === 'HABIDO'
            };
            initialCache.set(e.ruc, sunatData);
          }
        });
        this.sunatCache.set(initialCache);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
        this.snackBar.open('Error al cargar empresas', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.estadoControl.setValue('');
    this.servicioFilter.set('');
    this.currentPage.set(0);
  }

  getRepresentanteLegal(empresa: Empresa): any {
    if (!empresa.socios || empresa.socios.length === 0) return null;
    return empresa.socios.find(s => s.tipoSocio === 'REPRESENTANTE_LEGAL') || null;
  }

  getSociosAdicionales(empresa: Empresa): any[] {
    if (!empresa.socios || empresa.socios.length === 0) return [];
    return empresa.socios.filter(s => s.tipoSocio !== 'REPRESENTANTE_LEGAL');
  }

  getLabelCargo(tipoSocio: string): string {
    const labels: Record<string, string> = {
      'REPRESENTANTE_LEGAL': 'Rep. Legal',
      'GERENTE_GENERAL': 'Gerente Gral.',
      'SOCIO': 'Socio',
      'PRESIDENTE': 'Presidente',
      'DIRECTOR': 'Director',
      'APODERADO': 'Apoderado',
      'GERENTE': 'Gerente',
      'SECRETARIO': 'Secretario',
      'TESORERO': 'Tesorero'
    };
    return labels[tipoSocio] || tipoSocio;
  }

  getSociosTooltip(empresa: Empresa): string {
    return this.getSociosAdicionales(empresa)
      .map(s => `${this.getLabelCargo(s.tipoSocio)}: ${s.nombres} ${s.apellidos} (DNI: ${s.dni})`)
      .join('\n');
  }

  getSunatEstadoDesc(codigo: string | undefined): string {
    if (!codigo) return '';
    return ESTADOS_RUC[codigo] || '';
  }

  consultarSunat(empresa: Empresa): void {
    const ruc = empresa.ruc;
    if (!ruc || this.sunatCargando().has(ruc)) return;

    // Marcar como cargando
    const cargando = new Set(this.sunatCargando());
    cargando.add(ruc);
    this.sunatCargando.set(cargando);

    const removerCargando = () => {
      const cargandoAct = new Set(this.sunatCargando());
      cargandoAct.delete(ruc);
      this.sunatCargando.set(cargandoAct);
    };

    // Usar actualizarSunat para consultar la API de SUNAT y persistir en la base de datos MongoDB
    this.empresaService.actualizarSunat(empresa.id).pipe(
      finalize(() => removerCargando())
    ).subscribe({
      next: (empresaActualizada) => {
        if (empresaActualizada && empresaActualizada.datosSunat) {
          const d = empresaActualizada.datosSunat as any;
          const sunatData: SunatData = {
            ddp_nombre: d.ddp_nombre || d.razonSocial || empresaActualizada.razonSocial?.sunat || '',
            ddp_estado: d.ddp_estado || (d.valido ? '00' : '10'),
            desc_estado: d.desc_estado || (d.valido ? 'ACTIVO' : 'INACTIVO'),
            esActivo: d.esActivo === true || d.valido === true,
            esHabido: d.esHabido === true || d.condicion === 'HABIDO'
          };

          // Actualizar caché local
          const newCache = new Map(this.sunatCache());
          newCache.set(ruc, sunatData);
          this.sunatCache.set(newCache);

          // Actualizar la empresa en la lista local
          const updatedEmpresas = this.empresas().map(e => {
            if (e.id === empresa.id) {
              return empresaActualizada;
            }
            return e;
          });
          this.empresas.set(updatedEmpresas);

          const estado = ESTADOS_RUC[sunatData.ddp_estado || ''] || sunatData.desc_estado || '';
          const habido = sunatData.esHabido ? 'HABIDO' : 'NO HABIDO';
          const activo = sunatData.esActivo ? '✅ ACTIVO' : '❌ BAJA';
          this.snackBar.open(`Guardado en BD: ${sunatData.ddp_nombre || ''} — ${activo} | ${estado} | ${habido}`, 'OK', { duration: 6000 });
        } else {
          this.snackBar.open(`No se obtuvieron datos SUNAT para RUC ${ruc}`, 'Cerrar', { duration: 4000 });
        }
      },
      error: (err) => {
        console.warn('Endpoint actualizarSunat falló, intentando fallback proxy:', err);
        // Fallback: intentar consulta proxy directa si falla el endpoint de BD
        this.empresaService.consultarSunat(ruc).pipe(
          finalize(() => removerCargando())
        ).subscribe({
          next: (resp) => {
            const data = resp?.data;
            if (data) {
              const sunatData: SunatData = {
                ddp_nombre: data.ddp_nombre || '',
                ddp_estado: data.ddp_estado || '',
                desc_estado: data.desc_estado || '',
                esActivo: data.esActivo === true,
                esHabido: data.esHabido === true
              };
              const newCache = new Map(this.sunatCache());
              newCache.set(ruc, sunatData);
              this.sunatCache.set(newCache);
              const estado = ESTADOS_RUC[sunatData.ddp_estado || ''] || sunatData.desc_estado || '';
              const habido = sunatData.esHabido ? 'HABIDO' : 'NO HABIDO';
              const activo = sunatData.esActivo ? '✅ ACTIVO' : '❌ BAJA';
              this.snackBar.open(`${sunatData.ddp_nombre} — ${activo} | ${estado} | ${habido}`, 'OK', { duration: 6000 });
            }
          },
          error: (proxyErr) => {
            console.error('Error en consulta proxy SUNAT:', proxyErr);
            this.snackBar.open(`Error al consultar SUNAT para RUC ${ruc}`, 'Cerrar', { duration: 4000 });
          }
        });
      }
    });
  }

  toggleSeleccionar(empresaId: string, event: any): void {
    const seleccionadas = new Set(this.empresasSeleccionadas());
    if (event.checked) {
      seleccionadas.add(empresaId);
    } else {
      seleccionadas.delete(empresaId);
    }
    this.empresasSeleccionadas.set(seleccionadas);
  }

  toggleSelectAll(event: any): void {
    if (event.checked) {
      const ids = new Set(this.empresasFiltradas().map(e => e.id));
      this.empresasSeleccionadas.set(ids);
    } else {
      this.empresasSeleccionadas.set(new Set());
    }
  }

  toggleSeleccionarTodas(event: any): void {
    this.toggleSelectAll(event);
  }

  limpiarSeleccion(): void {
    this.empresasSeleccionadas.set(new Set());
  }

  abrirEdicionBloqueEstado(): void {
    const dialogRef = this.dialog.open(EdicionBloqueEstadoDialog, {
      width: '400px',
      data: { cantidadSeleccionadas: this.empresasSeleccionadas().size }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.actualizarEstadoEnBloque(result.nuevoEstado, result.motivo);
      }
    });
  }

  abrirEdicionBloqueServicios(): void {
    const dialogRef = this.dialog.open(EdicionBloqueServiciosDialog, {
      width: '400px',
      data: { cantidadSeleccionadas: this.empresasSeleccionadas().size }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.actualizarServiciosEnBloque(result.servicios);
      }
    });
  }

  private actualizarEstadoEnBloque(nuevoEstado: string, motivo: string): void {
    const empresasIds = Array.from(this.empresasSeleccionadas());
    if (empresasIds.length === 0) return;

    this.isLoading.set(true);
    let actualizadas = 0;
    let errores = 0;

    const actualizarSiguiente = (index: number) => {
      if (index >= empresasIds.length) {
        this.isLoading.set(false);
        const mensaje = `${actualizadas} empresa(s) actualizada(s)${errores > 0 ? `, ${errores} error(es)` : ''}`;
        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.cargarEmpresas();
        this.limpiarSeleccion();
        return;
      }

      const empresaId = empresasIds[index];
      this.empresaService.updateEmpresa(empresaId, { estado: nuevoEstado as any }).subscribe({
        next: () => {
          actualizadas++;
          actualizarSiguiente(index + 1);
        },
        error: (error) => {
          console.error('Error actualizando empresa:', error);
          errores++;
          actualizarSiguiente(index + 1);
        }
      });
    };

    actualizarSiguiente(0);
  }

  private actualizarServiciosEnBloque(servicios: string[]): void {
    const empresasIds = Array.from(this.empresasSeleccionadas());
    if (empresasIds.length === 0) return;

    this.isLoading.set(true);
    let actualizadas = 0;
    let errores = 0;

    const actualizarSiguiente = (index: number) => {
      if (index >= empresasIds.length) {
        this.isLoading.set(false);
        const mensaje = `${actualizadas} empresa(s) actualizada(s)${errores > 0 ? `, ${errores} error(es)` : ''}`;
        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.cargarEmpresas();
        this.limpiarSeleccion();
        return;
      }

      const empresaId = empresasIds[index];
      this.empresaService.updateEmpresa(empresaId, { tiposServicio: servicios as any }).subscribe({
        next: () => {
          actualizadas++;
          actualizarSiguiente(index + 1);
        },
        error: (error) => {
          console.error('Error actualizando empresa:', error);
          errores++;
          actualizarSiguiente(index + 1);
        }
      });
    };

    actualizarSiguiente(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  crearEmpresa(): void {
    this.router.navigate(['/empresas/nueva']);
  }

  verDetalle(empresaId: string): void {
    this.router.navigate(['/empresas', empresaId]);
  }

  editarEmpresa(empresaId: string): void {
    this.router.navigate(['/empresas', empresaId, 'editar']);
  }

  eliminarEmpresa(empresaId: string): void {
    if (confirm('¿Está seguro que desea eliminar esta empresa?')) {
      this.empresaService.deleteEmpresa(empresaId).subscribe({
        next: () => {
          this.snackBar.open('Empresa eliminada exitosamente', 'Cerrar', { duration: 3000 });
          this.cargarEmpresas();
        },
        error: (error) => {
          console.error('Error eliminando empresa:', error);
          this.snackBar.open('Error al eliminar empresa', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  getEstadoDisplayName(estado: string): string {
    const estados: { [key: string]: string } = {
      'AUTORIZADA': 'Autorizada',
      'EN_TRAMITE': 'En Trámite',
      'SUSPENDIDA': 'Suspendida',
      'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado || 'Autorizada';
  }

  getServicioAbreviado(servicio: string): string {
    if (!servicio) return '';
    const s = servicio.toUpperCase().trim();
    const mapa: { [key: string]: string } = {
      'PASAJEROS': 'PASAJ.',
      'PERSONAS': 'PASAJ.',
      'TURISMO': 'TUR.',
      'TRABAJADORES': 'TRAB.',
      'MERCANCIAS': 'MERC.',
      'MERCANCÍAS': 'MERC.',
      'CARGA': 'CARGA',
      'INFRAESTRUCTURA': 'INFRA.',
      'MIXTO': 'MIXTO',
      'OTROS': 'OTROS'
    };
    if (mapa[s]) return mapa[s];
    return s.length > 6 ? s.substring(0, 5) + '.' : s;
  }

  exportarExcelSeleccionadas(): void {
    const set = this.empresasSeleccionadas();
    const seleccionadas = this.empresas().filter(e => set.has(e.id));
    this.ejecutarExportacionExcel(seleccionadas, 'empresas-seleccionadas');
  }

  exportarExcelTodas(): void {
    this.ejecutarExportacionExcel(this.empresas(), 'empresas-todas');
  }

  async exportarExcel(): Promise<void> {
    this.ejecutarExportacionExcel(this.empresasFiltradas(), 'empresas-filtradas');
  }

  private async ejecutarExportacionExcel(lista: Empresa[], filenamePrefix: string): Promise<void> {
    try {
      const XLSX = await import('xlsx');
      const datosExportacion = lista.map(empresa => ({
        'RUC': empresa.ruc,
        'Razón Social Principal': empresa.razonSocial.principal,
        'Razón Social SUNAT': empresa.razonSocial.sunat || '',
        'Razón Social Mínimo': empresa.razonSocial.minimo || '',
        'Dirección Fiscal': empresa.direccionFiscal || '',
        'Estado': this.getEstadoDisplayName(empresa.estado),
        'Tipo de Servicio': (empresa.tiposServicio || []).join('; '),
        'Email Contacto': empresa.emailContacto || '',
        'Teléfono Contacto': empresa.telefonoContacto || '',
        'Sitio Web': empresa.sitioWeb || '',
        'Representante Legal': empresa.socios
          ?.filter(s => s.tipoSocio === 'REPRESENTANTE_LEGAL')
          .map(s => `${s.nombres} ${s.apellidos}`)
          .join('; ') || '',
        'DNI Representante': empresa.socios
          ?.filter(s => s.tipoSocio === 'REPRESENTANTE_LEGAL')
          .map(s => s.dni)
          .join('; ') || '',
        'Observaciones': empresa.observaciones || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(datosExportacion);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Empresas');
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `${filenamePrefix}-${fecha}.xlsx`);
      this.snackBar.open(`${datosExportacion.length} empresas exportadas a Excel`, 'OK', { duration: 3000 });
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      this.snackBar.open('Error al exportar a Excel', 'Cerrar', { duration: 3000 });
    }
  }

  abrirConfiguracionColumnas(): void {
    const dialogRef = this.dialog.open(ConfiguracionColumnasDialog, {
      width: '400px',
      data: { columnas: this.columnasDisponibles }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const columnasActualizadas = result
          .filter((col: any) => col.visible)
          .map((col: any) => col.id);
        this.columnasVisibles.set(columnasActualizadas);
        this.columnasDisponibles = result;
        // Persistir en localStorage
        localStorage.setItem('drtc_empresas_columnas_v2', JSON.stringify(columnasActualizadas));
      }
    });
  }

  abrirCargaMasiva(): void {
    this.router.navigate(['/empresas/carga-masiva']);
  }

  abrirActualizarDatos(): void {
    this.router.navigate(['/empresas/carga-masiva']);
  }

  abrirCargaMasivaGoogleSheets(): void {
    this.router.navigate(['/empresas/carga-masiva']);
  }

  async descargarPlantilla(): Promise<void> {
    try {
      this.isLoading.set(true);
      const response = await this.empresaService.descargarPlantilla().toPromise();
      if (response) {
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'plantilla-empresas.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Plantilla descargada correctamente', 'Cerrar', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error descargando plantilla:', error);
      this.snackBar.open('Error al descargar la plantilla', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  private async procesarArchivoExcel(file: File): Promise<void> {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          this.snackBar.open('El archivo no contiene datos', 'Cerrar', { duration: 3000 });
          return;
        }

        const empresas: EmpresaCreate[] = [];
        let filasOmitidas = 0;

        for (const row of jsonData as any[]) {
          const ruc = ((row as any)['RUC'] || (row as any)['ruc'])?.toString().trim();
          const razonSocialPrincipal = (
            (row as any)['RAZON_SOCIAL'] ||
            (row as any)['Razón Social Principal'] ||
            (row as any)['RAZON SOCIAL'] ||
            (row as any)['razon_social'] ||
            (row as any)['razonSocial']
          )?.toString().trim();

          if (!ruc || !razonSocialPrincipal) {
            filasOmitidas++;
            continue;
          }

          let dni = (
            (row as any)['DNI_REPRESENTANTE_LEGAL'] ||
            (row as any)['DNI Representante'] ||
            (row as any)['dni_representante'] ||
            (row as any)['DNI'] ||
            ''
          )?.toString().trim();

          let nombres = (row as any)['Nombres Representante']?.toString().trim() || '';
          let apellidos = (row as any)['Apellidos Representante']?.toString().trim() || '';
          const repLegal = ((row as any)['REPRESENTANTE_LEGAL'] || (row as any)['Representante Legal'])?.toString().trim() || '';
          if (!nombres && !apellidos && repLegal) {
            const parts = repLegal.split(' ');
            apellidos = parts.length > 0 ? parts[parts.length - 1] : '';
            nombres = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
          }

          let estado = (
            (row as any)['ESTADO'] ||
            (row as any)['Estado'] ||
            'AUTORIZADA'
          )?.toString().trim().toUpperCase();
          if (!['AUTORIZADA', 'EN_TRAMITE', 'SUSPENDIDA', 'CANCELADA'].includes(estado)) {
            estado = 'AUTORIZADA';
          }

          let partidaRaw = (row as any)['PARTIDA_REGISTRAL'] ||
                           (row as any)['Partida Registral'] ||
                           (row as any)['PARTIDA REGISTRAL'] ||
                           (row as any)['Partida'] ||
                           (row as any)['PARTIDA'] ||
                           (row as any)['partida_registral'] ||
                           (row as any)['partida'] ||
                           '';
          let partida = partidaRaw.toString().trim();
          if (partida && partida !== '-' && partida.toLowerCase() !== 'nan') {
            const partidaNumerica = partida.replace(/\D/g, '');
            if (partidaNumerica) {
              partida = partidaNumerica.padStart(8, '0');
            }
          } else {
            partida = '';
          }

          const direccionFiscal = (
            (row as any)['DOMICILIO_LEGAL'] ||
            (row as any)['Dirección Fiscal'] ||
            (row as any)['DOMICILIO_FISCAL_SUNAT'] ||
            (row as any)['domicilio_legal'] ||
            ''
          )?.toString().trim();

          const emailContacto = (
            (row as any)['CORREO_ELECTRONICO'] ||
            (row as any)['Email Contacto'] ||
            (row as any)['email'] ||
            ''
          )?.toString().trim();

          const telefonoContacto = (
            (row as any)['TELEFONO'] ||
            (row as any)['Teléfono Contacto'] ||
            (row as any)['telefono'] ||
            ''
          )?.toString().trim();

          const observaciones = (
            (row as any)['OBSERVACIONES'] ||
            (row as any)['Observaciones'] ||
            ''
          )?.toString().trim();

          const tipoServRaw = (row as any)['TIPO_SERVICIO'] || (row as any)['Tipo de Servicio'];
          const tiposServicio = tipoServRaw
            ? tipoServRaw.toString().split(';').map((s: string) => s.trim().toUpperCase()).filter((s: string) => s)
            : ['PERSONAS'];

          const empresa: EmpresaCreate = {
            ruc,
            razonSocial: {
              principal: razonSocialPrincipal,
              sunat: ((row as any)['RAZON_SOCIAL_SUNAT'] || (row as any)['Razón Social SUNAT'])?.toString().trim() || undefined,
              minimo: (row as any)['Razón Social Mínimo']?.toString().trim() || undefined
            },
            direccionFiscal: direccionFiscal || '',
            partidaRegistral: partida || undefined,
            estado: estado as any,
            socios: dni || nombres || apellidos ? [
              {
                dni: dni,
                nombres: nombres,
                apellidos: apellidos,
                tipoSocio: TipoSocio.REPRESENTANTE_LEGAL,
                email: emailContacto || undefined,
                direccion: direccionFiscal || undefined
              }
            ] : [],
            tiposServicio: tiposServicio,
            emailContacto: emailContacto || '',
            telefonoContacto: telefonoContacto || '',
            sitioWeb: (row as any)['Sitio Web']?.toString().trim() || '',
            observaciones: observaciones || ''
          };

          empresas.push(empresa);
        }

        if (empresas.length === 0) {
          this.snackBar.open(`No se encontraron empresas válidas en el archivo.`, 'Cerrar', { duration: 5000 });
          return;
        }

        this.isLoading.set(true);
        let exitosas = 0;
        let errores = 0;

        const crearEmpresas = (index: number) => {
          if (index >= empresas.length) {
            const mensaje = `${exitosas} empresas importadas exitosamente${errores > 0 ? `, ${errores} errores` : ''}`;
            this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
            this.cargarEmpresas();
            this.isLoading.set(false);
            return;
          }

          this.empresaService.createEmpresa(empresas[index]).subscribe({
            next: () => {
              exitosas++;
              crearEmpresas(index + 1);
            },
            error: (error: any) => {
              console.error('Error creando empresa:', error);
              errores++;
              crearEmpresas(index + 1);
            }
          });
        };

        crearEmpresas(0);
      } catch (error) {
        console.error('Error procesando archivo:', error);
        this.snackBar.open('Error al procesar el archivo Excel', 'Cerrar', { duration: 3000 });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  private async procesarActualizacionExcel(file: File): Promise<void> {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          this.snackBar.open('El archivo no contiene datos', 'Cerrar', { duration: 3000 });
          return;
        }

        const actualizaciones: any[] = [];
        let filasOmitidas = 0;

        for (const row of jsonData as any[]) {
          const ruc = (row as any)['RUC']?.toString().trim();
          const razonSocialPrincipal = (row as any)['Razón Social Principal']?.toString().trim();

          if (!ruc || !razonSocialPrincipal) {
            filasOmitidas++;
            continue;
          }

          const empresa = this.empresas().find(e => e.ruc === ruc);
          if (!empresa) {
            filasOmitidas++;
            continue;
          }

          const datosActualizar: any = {};
          datosActualizar.razonSocial = {
            principal: razonSocialPrincipal,
            sunat: (row as any)['Razón Social SUNAT']?.toString().trim() || undefined,
            minimo: (row as any)['Razón Social Mínimo']?.toString().trim() || undefined
          };

          if (row['Dirección Fiscal']) datosActualizar.direccionFiscal = (row as any)['Dirección Fiscal'].toString().trim();
          if (row['Estado']) {
            const estado = (row as any)['Estado'].toString().trim().toUpperCase();
            if (['AUTORIZADA', 'EN_TRAMITE', 'SUSPENDIDA', 'CANCELADA'].includes(estado)) {
              datosActualizar.estado = estado;
            }
          }
          if (row['Tipo de Servicio']) {
            datosActualizar.tiposServicio = (row as any)['Tipo de Servicio'].toString().split(';').map((s: string) => s.trim()).filter((s: string) => s);
          }
          if (row['Email Contacto']) datosActualizar.emailContacto = (row as any)['Email Contacto'].toString().trim();
          if (row['Teléfono Contacto']) datosActualizar.telefonoContacto = (row as any)['Teléfono Contacto'].toString().trim();
          if (row['Sitio Web']) datosActualizar.sitioWeb = (row as any)['Sitio Web'].toString().trim();
          if (row['Observaciones']) datosActualizar.observaciones = (row as any)['Observaciones'].toString().trim();

          actualizaciones.push({
            empresaId: empresa.id,
            ruc,
            datos: datosActualizar
          });
        }

        if (actualizaciones.length === 0) {
          this.snackBar.open(`No se encontraron datos para actualizar.`, 'Cerrar', { duration: 5000 });
          return;
        }

        this.isLoading.set(true);
        let actualizadas = 0;
        let errores = 0;

        const actualizarSiguiente = (index: number) => {
          if (index >= actualizaciones.length) {
            const mensaje = `${actualizadas} empresa(s) actualizada(s)${errores > 0 ? `, ${errores} error(es)` : ''}`;
            this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
            this.cargarEmpresas();
            this.isLoading.set(false);
            return;
          }

          const actualizacion = actualizaciones[index];
          this.empresaService.updateEmpresa(actualizacion.empresaId, actualizacion.datos).subscribe({
            next: () => {
              actualizadas++;
              actualizarSiguiente(index + 1);
            },
            error: (error: any) => {
              console.error('Error actualizando empresa:', error);
              errores++;
              actualizarSiguiente(index + 1);
            }
          });
        };

        actualizarSiguiente(0);
      } catch (error) {
        console.error('Error procesando archivo:', error);
        this.snackBar.open('Error al procesar el archivo Excel', 'Cerrar', { duration: 3000 });
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

// Dialog Component for Column Configuration
@Component({
  selector: 'app-configuracion-columnas-dialog',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, MatButtonModule, MatIconModule, FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Configurar Columnas Visibles</h2>
    <mat-dialog-content>
      <div class="columnas-list">
        <div *ngFor="let columna of data.columnas" class="columna-item">
          <mat-checkbox 
            [(ngModel)]="columna.visible"
            [disabled]="columna.id === 'acciones'">
            {{ columna.label }}
          </mat-checkbox>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onConfirm()">Aplicar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .columnas-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 0;
    }
    .columna-item { display: flex; align-items: center; }
    mat-dialog-actions { padding: 16px 0 0 0; }
  `]
})
export class ConfiguracionColumnasDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfiguracionColumnasDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancel(): void { this.dialogRef.close(); }
  onConfirm(): void { this.dialogRef.close(this.data.columnas); }
}

// Dialog Component for Bulk Status Edit
@Component({
  selector: 'app-edicion-bloque-estado-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatInputModule, FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Cambiar Estado Legal en Bloque</h2>
    <mat-dialog-content>
      <p>Cambiar estado legal de <strong>{{ data.cantidadSeleccionadas }}</strong> empresa(s) seleccionadas</p>
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nuevo Estado Legal</mat-label>
        <mat-select [(ngModel)]="nuevoEstado">
          <mat-option value="AUTORIZADA">Autorizada</mat-option>
          <mat-option value="EN_TRAMITE">En Trámite</mat-option>
          <mat-option value="SUSPENDIDA">Suspendida</mat-option>
          <mat-option value="CANCELADA">Cancelada</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Motivo o Nota Operativa (opcional)</mat-label>
        <textarea matInput [(ngModel)]="motivo" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="!nuevoEstado">
        Aplicar Estado
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 1rem; }
  `]
})
export class EdicionBloqueEstadoDialog {
  nuevoEstado = '';
  motivo = '';

  constructor(
    public dialogRef: MatDialogRef<EdicionBloqueEstadoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancel(): void { this.dialogRef.close(); }
  onConfirm(): void {
    this.dialogRef.close({
      nuevoEstado: this.nuevoEstado,
      motivo: this.motivo
    });
  }
}

// Dialog Component for Bulk Services Edit
@Component({
  selector: 'app-edicion-bloque-servicios-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Cambiar Tipos de Servicio en Bloque</h2>
    <mat-dialog-content>
      <p>Actualizar modalidades de <strong>{{ data.cantidadSeleccionadas }}</strong> empresa(s)</p>
      
      <div class="servicios-list">
        <div *ngFor="let servicio of serviciosDisponibles" class="servicio-item">
          <mat-checkbox 
            [checked]="serviciosSeleccionados[servicio]"
            (change)="toggleServicio(servicio, $event)">
            {{ servicio }}
          </mat-checkbox>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="serviciosSeleccionadosArray().length === 0">
        Aplicar Servicios
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .servicios-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 0;
    }
    .servicio-item { display: flex; align-items: center; }
  `]
})
export class EdicionBloqueServiciosDialog {
  serviciosDisponibles = ['PASAJEROS', 'TURISMO', 'TRABAJADORES', 'MERCANCIAS', 'CARGA', 'INFRAESTRUCTURA', 'OTROS', 'MIXTO'];
  serviciosSeleccionados: { [key: string]: boolean } = {};

  constructor(
    public dialogRef: MatDialogRef<EdicionBloqueServiciosDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.serviciosDisponibles.forEach(s => {
      this.serviciosSeleccionados[s] = false;
    });
  }

  toggleServicio(servicio: string, event: any): void {
    this.serviciosSeleccionados[servicio] = event.checked;
  }

  serviciosSeleccionadosArray(): string[] {
    return Object.keys(this.serviciosSeleccionados).filter(s => this.serviciosSeleccionados[s]);
  }

  onCancel(): void { this.dialogRef.close(); }
  onConfirm(): void {
    this.dialogRef.close({
      servicios: this.serviciosSeleccionadosArray()
    });
  }
}
