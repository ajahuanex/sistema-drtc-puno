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
      <!-- Header Banner (Stitch Official module-hero-banner) -->
      <div class="page-header" data-purpose="module-hero-banner">
        <div class="header-content">
          <div class="title-with-icon">
            <span class="material-symbols-outlined header-icon">apartment</span>
            <div>
              <h1>Gestión de Empresas de Transporte Terrestre Interprovincial</h1>
              <p class="subtitle">Padrón Oficial y Expediente Administrativo Digital 360° de Operadores Habilitados en la Región Puno (D.S. 017-2009-MTC)</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <!-- Botón Exportar Excel con Menú -->
          <button mat-button class="header-action-btn" [matMenuTriggerFor]="exportExcelMenu" [disabled]="isLoading()" matTooltip="Exportar empresas a Excel">
            <span class="material-symbols-outlined btn-icon">download</span>
            <span class="btn-text">Exportar Padrón (Excel/PDF)</span>
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
            <span class="material-symbols-outlined btn-icon">upload_file</span>
            <span class="btn-text">Carga Masiva</span>
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
            <span class="material-symbols-outlined btn-icon">add_circle</span>
            <span class="btn-text">+ Nueva Empresa</span>
          </button>
        </div>
      </div>

      <!-- KPI Metrics Grid (Stitch Official Padrón DRTC Puno) -->
      <div class="kpi-metrics-grid" data-purpose="kpi-metrics-grid">
        <!-- Card 1: Total Autorizadas -->
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Total Autorizadas</span>
            <span class="kpi-icon-badge kpi-badge-blue">
              <span class="material-symbols-outlined">verified</span>
            </span>
          </div>
          <div class="kpi-body">
            <span class="kpi-number">{{ totalAutorizadas() }}</span>
            <span class="kpi-subtext">modalidad transporte de pasajeros</span>
          </div>
          <div class="kpi-footer">
            <span class="status-dot dot-emerald"></span>
            <span class="kpi-highlight font-emerald">{{ pctAutorizadasPasajeros() }}%</span>
            <span>del total de empresas autorizadas</span>
          </div>
        </div>

        <!-- Card 2: Total Canceladas -->
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Total Canceladas</span>
            <span class="kpi-icon-badge kpi-badge-rose">
              <span class="material-symbols-outlined">cancel</span>
            </span>
          </div>
          <div class="kpi-body">
            <span class="kpi-number text-rose">{{ totalCanceladas() }}</span>
            <span class="kpi-subtext">empresas canceladas</span>
          </div>
          <div class="kpi-footer font-rose">
            <span class="material-symbols-outlined footer-icon">gavel</span>
            <span class="font-semibold">R.D. de cancelación / sanción firme</span>
          </div>
        </div>

        <!-- Card 3: Estado SUNAT (RUC) -->
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Estado SUNAT (RUC)</span>
            <span class="kpi-icon-badge kpi-badge-emerald">
              <span class="material-symbols-outlined">check_circle</span>
            </span>
          </div>
          <div class="kpi-body">
            <span class="kpi-number text-emerald">{{ sunatActivas() }}</span>
            <span class="kpi-subtext">activas y habidas</span>
          </div>
          <div class="kpi-footer">
            <span class="kpi-highlight font-emerald">{{ pctSunatConformes() }}%</span>
            <span>condición conforme @if (sunatEnVerificacion() > 0) { <span class="text-amber font-mono">({{ sunatEnVerificacion() }} en verif.)</span> }</span>
          </div>
        </div>

        <!-- Card 4: Modalidad Autorizada -->
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Modalidad Autorizada</span>
            <span class="kpi-icon-badge kpi-badge-blue">
              <span class="material-symbols-outlined">directions_bus</span>
            </span>
          </div>
          <div class="kpi-modalidad-boxes">
            <div class="kpi-mini-box">
              <span class="mini-box-label">Pasajeros</span>
              <span class="mini-box-number">{{ pasajerosCount() }}</span>
            </div>
            <div class="kpi-mini-box">
              <span class="mini-box-label label-amber">Turismo</span>
              <span class="mini-box-number">{{ turismoCount() }}</span>
            </div>
            <div class="kpi-mini-box">
              <span class="mini-box-label label-blue">Trabajad.</span>
              <span class="mini-box-number">{{ trabajadoresCount() }}</span>
            </div>
          </div>
          <div class="kpi-footer kpi-footer-between">
            <span>Total: <strong class="font-mono text-dark">{{ totalEmpresasCount() }} empresas</strong></span>
            <span class="text-primary-link">D.S. 017-2009-MTC</span>
          </div>
        </div>
      </div>

      <div class="content-section">
        <!-- Formulario de Filtros Oficial Stitch (data-purpose="table-filters") -->
        <section class="stitch-filters" data-purpose="table-filters">
          <!-- Búsqueda rápida -->
          <div class="search-box-wrapper">
            <span class="material-symbols-outlined search-icon">search</span>
            <input 
              type="text" 
              [formControl]="searchControl" 
              placeholder="Buscar por RUC, Razón Social o Representante Legal..." 
              class="stitch-search-input">
            @if (searchControl.value) {
              <button type="button" (click)="searchControl.setValue('')" class="stitch-clear-btn" matTooltip="Limpiar búsqueda">
                <span class="material-symbols-outlined">close</span>
              </button>
            }
          </div>

          <!-- Filtros desplegables y acciones -->
          <div class="filter-controls-group">
            <div class="filter-item">
              <label class="filter-label">Estado:</label>
              <select [formControl]="estadoControl" class="stitch-select">
                <option value="">Todos los Estados</option>
                <option value="AUTORIZADA">Habilitada (Activa)</option>
                <option value="EN_TRAMITE">En Renovación</option>
                <option value="SUSPENDIDA">Suspendida</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div class="filter-item">
              <label class="filter-label">Modalidad:</label>
              <select [ngModel]="servicioFilter()" (ngModelChange)="servicioFilter.set($event); currentPage.set(0)" class="stitch-select">
                <option value="">Todas las Modalidades</option>
                <option value="PASAJEROS">Regular Personas (M2/M3)</option>
                <option value="TURISMO">Turismo</option>
                <option value="TRABAJADORES">Trabajadores</option>
                <option value="MERCANCIAS">Mercancías</option>
                <option value="CARGA">Carga</option>
                <option value="INFRAESTRUCTURA">Infraestructura</option>
                <option value="MIXTO">Mixto</option>
              </select>
            </div>

            <!-- Botón Limpiar filtros -->
            @if (searchControl.value || estadoControl.value || servicioFilter()) {
              <button type="button" (click)="limpiarFiltros()" class="stitch-btn stitch-btn-reset" matTooltip="Limpiar todos los filtros">
                <span class="material-symbols-outlined">filter_alt_off</span>
                <span>Limpiar</span>
              </button>
            }

            <!-- Botón Configurar Columnas -->
            <button type="button" (click)="abrirConfiguracionColumnas()" class="stitch-btn" matTooltip="Configurar columnas visibles">
              <span class="material-symbols-outlined">view_column</span>
              <span>Columnas</span>
            </button>
          </div>
        </section>

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
                          <span class="material-symbols-outlined sort-icon">{{ getSortIcon('ruc') }}</span>
                        </th>
                      }
                      @if (columnaVisible('razonSocial')) {
                        <th (click)="toggleSort('razonSocial')" class="sortable-th razon-th">
                          <span>Razón Social</span>
                          <span class="material-symbols-outlined sort-icon">{{ getSortIcon('razonSocial') }}</span>
                        </th>
                      }
                      @if (columnaVisible('partidaRegistral')) {
                        <th (click)="toggleSort('partidaRegistral')" class="sortable-th">
                          <span>Partida Registral</span>
                          <span class="material-symbols-outlined sort-icon">{{ getSortIcon('partidaRegistral') }}</span>
                        </th>
                      }
                      @if (columnaVisible('estado')) {
                        <th (click)="toggleSort('estado')" class="sortable-th">
                          <span>Estado Legal</span>
                          <span class="material-symbols-outlined sort-icon">{{ getSortIcon('estado') }}</span>
                        </th>
                      }
                      @if (columnaVisible('servicios')) {
                        <th (click)="toggleSort('servicios')" class="sortable-th">
                          <span>Tipos de Servicio</span>
                          <span class="material-symbols-outlined sort-icon">{{ getSortIcon('servicios') }}</span>
                        </th>
                      }
                      @if (columnaVisible('representante')) {
                        <th (click)="toggleSort('representante')" class="sortable-th">
                          <span>Representante Legal</span>
                          <span class="material-symbols-outlined sort-icon">{{ getSortIcon('representante') }}</span>
                        </th>
                      }
                      @if (columnaVisible('contacto')) {
                        <th (click)="toggleSort('contacto')" class="sortable-th">
                          <span>Contacto</span>
                          <span class="material-symbols-outlined sort-icon">{{ getSortIcon('contacto') }}</span>
                        </th>
                      }
                      @if (columnaVisible('estadoSunat')) {
                        <th (click)="toggleSort('estadoSunat')" class="sortable-th text-center" matTooltip="Ordenar por Estado SUNAT">
                          <span>Estado SUNAT</span>
                          <span class="material-symbols-outlined sort-icon">{{ getSortIcon('estadoSunat') }}</span>
                        </th>
                      }
                      @if (columnaVisible('acciones')) {
                        <th class="text-center th-actions-icon-col" matTooltip="Opciones y Acciones">
                          <span class="material-symbols-outlined th-actions-icon">more_vert</span>
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
                              <span class="ruc-text">{{ empresa.ruc }}</span>
                              <div class="ruc-meta-row">
                                <span [class]="'badge-autorizada status-' + (empresa.estado ? empresa.estado.toLowerCase() : 'autorizada')"
                                      [matTooltip]="'Estado legal: ' + (empresa.estado || 'AUTORIZADA')">
                                  {{ (empresa.estado || 'AUTORIZADA').toUpperCase() }}
                                </span>
                                @for (srv of (empresa.tiposServicio || []).slice(0, 1); track srv) {
                                  <span [class]="isTurismo(srv) ? 'badge-turismo' : 'badge-modalidad'" [matTooltip]="'Tipo de Servicio: ' + srv">
                                    {{ getServicioAbreviado(srv) }}
                                  </span>
                                }
                                @if ((empresa.tiposServicio || []).length > 1) {
                                  <span class="badge-modalidad badge-more" [matTooltip]="empresa.tiposServicio.join(', ')">
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
                              <span class="company-name-text">{{ empresa.razonSocial.principal }}</span>
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
                            <span [class]="'badge-autorizada status-' + (empresa.estado ? empresa.estado.toLowerCase() : 'autorizada')">
                              {{ getEstadoDisplayName(empresa.estado) }}
                            </span>
                          </td>
                        }
                        @if (columnaVisible('servicios')) {
                          <td>
                            <div class="services-chips-flex">
                              @for (srv of (empresa.tiposServicio || []).slice(0, 2); track srv) {
                                <span [class]="isTurismo(srv) ? 'badge-turismo' : 'badge-modalidad'">{{ srv }}</span>
                              }
                              @if ((empresa.tiposServicio || []).length > 2) {
                                <span class="badge-modalidad badge-more" [matTooltip]="empresa.tiposServicio.join(', ')">
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
                              <span class="sin-datos">—</span>
                            }
                          </td>
                        }
                        @if (columnaVisible('contacto')) {
                          <td>
                            <div class="contact-info-col">
                              @if (empresa.emailContacto) {
                                <span class="contact-text email-text" [matTooltip]="empresa.emailContacto">
                                  <span class="material-symbols-outlined inline-icon">mail</span>
                                  <span>{{ empresa.emailContacto }}</span>
                                </span>
                              }
                              @if (empresa.telefonoContacto) {
                                <span class="contact-text phone-text">
                                  <span class="material-symbols-outlined inline-icon">call</span>
                                  <span>{{ empresa.telefonoContacto }}</span>
                                </span>
                              }
                              @if (!empresa.emailContacto && !empresa.telefonoContacto) {
                                <span class="sin-datos">—</span>
                              }
                            </div>
                          </td>
                        }
                        @if (columnaVisible('estadoSunat')) {
                          <td class="text-center">
                            @if (sunatCargando().has(empresa.ruc)) {
                              <mat-progress-bar mode="indeterminate" style="width:70px; margin:auto;"></mat-progress-bar>
                            } @else {
                              @let sData = sunatCache().get(empresa.ruc);
                              <div class="sunat-badges-only">
                                <span [class]="'badge-sunat-pill ' + (sData?.esActivo !== false ? 'sunat-activo' : 'sunat-baja')">
                                  {{ sData?.esActivo !== false ? 'ACTIVO' : 'BAJA' }}
                                </span>
                                <span [class]="'badge-sunat-pill ' + (sData?.esHabido !== false ? 'sunat-habido' : 'sunat-no-habido')">
                                  {{ sData?.esHabido !== false ? 'HABIDO' : 'NO HABIDO' }}
                                </span>
                              </div>
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

    /* ── Hero Banner (Stitch module-hero-banner) ───────────────── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      background: linear-gradient(to right, #112348, #1e3a8a, #2563eb);
      color: white;
      padding: 1.5rem 1.75rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(30, 58, 138, 0.25);

      .title-with-icon {
        display: flex;
        align-items: center;
        gap: 1rem;

        .header-icon {
          font-size: 2.25rem;
          width: 2.25rem;
          height: 2.25rem;
          color: #93c5fd;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .subtitle {
          margin: 0.25rem 0 0 0;
          opacity: 0.9;
          font-size: 0.85rem;
          color: #dbeafe;
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-shrink: 0;

        .header-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          height: 38px;
          padding: 0 1rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          background-color: rgba(255, 255, 255, 0.12);
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

          .btn-icon {
            font-size: 1.15rem;
            width: 1.15rem;
            height: 1.15rem;
            color: #ffffff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .dropdown-arrow {
            font-size: 1.1rem;
            width: 1.1rem;
            height: 1.1rem;
            margin-left: -0.2rem;
            color: #ffffff;
          }

          &:hover {
            background-color: rgba(255, 255, 255, 0.22);
            border-color: rgba(255, 255, 255, 0.4);
            transform: translateY(-1px);
          }

          &.btn-primary-custom {
            background-color: #2563eb !important;
            border-color: #3b82f6 !important;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);

            &:hover {
              background-color: #1d4ed8 !important;
              box-shadow: 0 6px 16px rgba(37, 99, 235, 0.5);
            }
          }
        }
      }
    }

    /* ── KPI Metrics Grid (Stitch kpi-metrics-grid) ─────────────── */
    .kpi-metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.25rem;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }
      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.15rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .kpi-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .kpi-title {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .kpi-icon-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;

          .material-symbols-outlined, mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }

          &.kpi-badge-blue {
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #dbeafe;
          }
          &.kpi-badge-amber {
            background: #fffbeb;
            color: #b45309;
            border: 1px solid #fef3c7;
          }
          &.kpi-badge-rose {
            background: #fff1f2;
            color: #e11d48;
            border: 1px solid #ffe4e6;
          }
        }
      }

      .kpi-body {
        margin-top: 0.65rem;
        display: flex;
        align-items: baseline;
        gap: 0.5rem;

        .kpi-number {
          font-size: 1.75rem;
          font-weight: 900;
          line-height: 1;
          color: #1d4ed8;

          &.text-amber { color: #b45309; }
          &.text-rose { color: #e11d48; }
        }

        .kpi-subtext {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }
      }

      .kpi-footer {
        margin-top: 0.85rem;
        padding-top: 0.55rem;
        border-top: 1px solid #f1f5f9;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 11px;
        color: #64748b;

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;

          &.dot-emerald { background-color: #10b981; }
          &.dot-amber { background-color: #f59e0b; }
        }

        .font-emerald { color: #059669; font-weight: 600; }
        .font-blue { color: #1d4ed8; font-weight: 700; font-family: monospace; }
        &.font-amber { color: #b45309; font-weight: 600; }
        &.font-rose { color: #e11d48; font-weight: 600; }

        .footer-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }
    }

    /* ── KPI Modalidad Boxes (Stitch Card 4) ─────────────────────── */
    .kpi-modalidad-boxes {
      margin-top: 0.5rem;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.35rem;

      .kpi-mini-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 0.35rem 0.25rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;

        .mini-box-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.02em;

          &.label-amber { color: #d97706; }
          &.label-blue { color: #2563eb; }
        }

        .mini-box-number {
          font-size: 1rem;
          font-weight: 900;
          font-family: monospace;
          color: #0f172a;
          line-height: 1.2;
          margin-top: 2px;
        }
      }
    }

    .kpi-footer-between {
      justify-content: space-between !important;
      .text-dark { color: #0f172a; font-weight: 700; }
      .text-primary-link { color: #2563eb; font-weight: 600; font-size: 10px; }
    }

    .kpi-badge-emerald {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .text-emerald { color: #059669; }

    /* ── Formulario de Filtros Oficial Stitch (data-purpose="table-filters") ─ */
    .stitch-filters {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.75rem;

      @media (max-width: 900px) {
        flex-direction: column;
        align-items: stretch;
      }

      .search-box-wrapper {
        position: relative;
        flex: 1 1 auto;
        min-width: 220px;
        display: flex;
        align-items: center;

        .search-icon {
          position: absolute;
          left: 0.75rem;
          color: #94a3b8;
          font-size: 1.15rem;
          pointer-events: none;
        }

        .stitch-search-input {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.45rem 2rem 0.45rem 2.25rem;
          font-size: 0.75rem;
          color: #1e293b;
          font-family: inherit;
          transition: all 0.2s ease;

          &::placeholder {
            color: #94a3b8;
          }

          &:focus {
            outline: none;
            background: #ffffff;
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
          }
        }

        .stitch-clear-btn {
          position: absolute;
          right: 0.5rem;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;

          span {
            font-size: 1rem;
          }

          &:hover {
            color: #475569;
          }
        }
      }

      .filter-controls-group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.65rem;

        .filter-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;

          .filter-label {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            white-space: nowrap;
          }

          .stitch-select {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 0.45rem 1.75rem 0.45rem 0.65rem;
            font-size: 0.75rem;
            font-weight: 500;
            color: #334155;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.2s ease;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.5rem center;
            background-size: 12px;

            &:focus {
              outline: none;
              background-color: #ffffff;
              border-color: #3b82f6;
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
            }
          }
        }

        .stitch-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.45rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;

          .material-symbols-outlined {
            font-size: 17px;
            color: #64748b;
          }

          &:hover {
            background: #f8fafc;
            border-color: #94a3b8;
            color: #0f172a;
          }

          &.stitch-btn-reset {
            color: #ef4444;
            background: #fef2f2;
            border-color: #fecaca;

            .material-symbols-outlined {
              color: #ef4444;
            }

            &:hover {
              background: #fee2e2;
            }
          }
        }
      }
    }

    /* ── Selection Banner ──────────────────────────────────────── */
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

    /* ── Data Table (Stitch enterprises-table) ─────────────────── */
    .table-card {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

      .table-container { overflow-x: auto; }
    }

    .custom-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      text-align: left;
      font-size: 0.85rem;

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
        color: #64748b;
        font-weight: 700;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.75rem 1rem;
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
            background-color: #eff6ff !important;
            color: #1d4ed8 !important;

            .sort-icon {
              color: #1d4ed8 !important;
            }
          }

          span {
            display: inline-block;
            vertical-align: middle;
          }

          .sort-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
            vertical-align: middle;
            margin-left: 4px;
            color: #94a3b8;
            transition: color 0.2s ease;
          }
        }
      }

      td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      tr:hover td {
        background-color: #eff6ff;
      }
    }

    .ruc-th, .ruc-cell {
      width: 145px;
      min-width: 135px;
      max-width: 155px;
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

      .ruc-text {
        color: #0f172a;
        font-family: monospace;
        font-weight: 800;
        font-size: 0.88rem;
        letter-spacing: 0.3px;
      }

      .ruc-meta-row {
        display: flex;
        align-items: center;
        gap: 3px;
        flex-wrap: nowrap;
        width: 100%;
      }
    }

    /* ── Badges Oficiales Stitch ───────────────────────────────── */
    .badge-autorizada {
      background-color: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      padding: 1.5px 5px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      border-radius: 4px;
      white-space: nowrap;

      &.status-en_tramite {
        background-color: #eff6ff;
        color: #1d4ed8;
        border-color: #bfdbfe;
      }
      &.status-suspendida {
        background-color: #fffbeb;
        color: #d97706;
        border-color: #fde68a;
      }
      &.status-cancelada {
        background-color: #fef2f2;
        color: #dc2626;
        border-color: #fecaca;
      }
    }

    .badge-modalidad {
      background-color: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      padding: 1.5px 5px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 4px;
      white-space: nowrap;

      &.badge-more {
        background-color: #e2e8f0;
        color: #334155;
      }
    }

    .badge-turismo {
      background-color: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
      padding: 1.5px 5px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 4px;
      white-space: nowrap;
    }

    /* ── Estado SUNAT (Sólo ACTIVO / HABIDO) ──────────────────────── */
    .sunat-badges-only {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      white-space: nowrap;
    }

    .badge-sunat-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 7px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.03em;
      border-radius: 4px;
      text-transform: uppercase;
      line-height: 1.2;

      &.sunat-activo {
        background-color: #ecfdf5;
        color: #059669;
        border: 1px solid #a7f3d0;
      }

      &.sunat-habido {
        background-color: #eff6ff;
        color: #2563eb;
        border: 1px solid #bfdbfe;
      }

      &.sunat-baja {
        background-color: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      &.sunat-no-habido {
        background-color: #fffbeb;
        color: #d97706;
        border: 1px solid #fde68a;
      }
    }

    .company-name-text {
      color: #1d4ed8;
      font-size: 0.92rem;
      font-weight: 600;
      line-height: 1.35;
      display: block;
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
    }

    .representante-info {
      display: flex;
      flex-direction: column;
      font-size: 0.8rem;
      gap: 0.1rem;

      .rep-name {
        color: #1e293b;
        font-weight: 600;
        font-size: 11px;
      }

      .rep-cargo {
        font-size: 0.72rem;
        font-weight: 700;
        color: #1d4ed8;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .rep-dni {
        font-size: 10px;
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

    .contact-info-col {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .contact-text {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 11px;
      color: #475569;
      transition: color 0.15s ease;

      .inline-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: #94a3b8;
      }

      &.email-text:hover {
        color: #1d4ed8;
      }
    }

    .sin-datos { color: #94a3b8; font-size: 0.8rem; }
    .text-center { text-align: center; }

    .checkbox-th, .checkbox-td {
      width: 48px;
      min-width: 48px;
      padding: 0 0.5rem !important;
      text-align: center;
    }

    .selected-row {
      background-color: #eff6ff !important;
      td { background-color: #eff6ff !important; }
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
        color: #1d4ed8;
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
          height: 38px !important;
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

    /* =================================================================
       STITCH MODO OSCURO (Screen 22b66c09a8ce4c859e57611ab90a5ff8)
       ================================================================= */
    :host-context([data-theme="dark"]), :host-context(.dark-theme), :host-context(.dark-mode) {
      .page-header {
        background: linear-gradient(to right, #07152f, #112348, #1e3a8a) !important;
        border: 1px solid #1e293b !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;

        .title-with-icon {
          .header-icon { color: #93c5fd !important; }
          h1 { color: #ffffff !important; }
          .subtitle { color: #bfdbfe !important; }
        }

        .header-actions .header-action-btn {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.2) !important;

          .btn-icon, .dropdown-arrow { color: #ffffff !important; }
          &:hover { background-color: rgba(255, 255, 255, 0.2) !important; }

          &.btn-primary-custom {
            background-color: #2563eb !important;
            border-color: #3b82f6 !important;
            &:hover { background-color: #1d4ed8 !important; }
          }
        }
      }

      .kpi-card {
        background: #0f172a !important;
        border-color: #1e293b !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;

        &:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) !important;
          border-color: #334155 !important;
        }

        .kpi-header {
          .kpi-title { color: #94a3b8 !important; }

          .kpi-icon-badge {
            &.kpi-badge-blue {
              background: rgba(59, 130, 246, 0.1) !important;
              color: #60a5fa !important;
              border-color: rgba(59, 130, 246, 0.25) !important;
            }
            &.kpi-badge-amber {
              background: rgba(245, 158, 11, 0.1) !important;
              color: #fbbf24 !important;
              border-color: rgba(245, 158, 11, 0.25) !important;
            }
            &.kpi-badge-rose {
              background: rgba(244, 63, 94, 0.1) !important;
              color: #fb7185 !important;
              border-color: rgba(244, 63, 94, 0.25) !important;
            }
          }
        }

        .kpi-body {
          .kpi-number {
            color: #ffffff !important;
            &.text-amber { color: #fbbf24 !important; }
            &.text-rose { color: #f87171 !important; }
          }
          .kpi-subtext { color: #94a3b8 !important; }
        }

        .kpi-footer {
          border-top-color: #1e293b !important;
          color: #94a3b8 !important;

          .status-dot {
            &.dot-emerald { background-color: #34d399 !important; }
            &.dot-amber { background-color: #fbbf24 !important; }
          }

          .font-emerald { color: #34d399 !important; }
          .font-blue { color: #60a5fa !important; }
          &.font-amber { color: #fbbf24 !important; }
          &.font-rose { color: #f87171 !important; }
        }
      }

      .kpi-badge-emerald {
        background: rgba(6, 78, 59, 0.4) !important;
        color: #34d399 !important;
        border-color: rgba(16, 185, 129, 0.3) !important;
      }

      .text-emerald { color: #34d399 !important; }

      .kpi-modalidad-boxes {
        .kpi-mini-box {
          background: #131b2e !important;
          border-color: #1e293b !important;

          .mini-box-label {
            color: #94a3b8 !important;
            &.label-amber { color: #fbbf24 !important; }
            &.label-blue { color: #93c5fd !important; }
          }

          .mini-box-number {
            color: #ffffff !important;
          }
        }
      }

      .kpi-footer-between {
        .text-dark { color: #f1f5f9 !important; }
        .text-primary-link { color: #60a5fa !important; }
      }

      .stitch-filters {
        background: #0f172a !important;
        border-color: #1e293b !important;

        .search-box-wrapper {
          .search-icon { color: #94a3b8 !important; }

          .stitch-search-input {
            background: #131b2e !important;
            border-color: #1e293b !important;
            color: #f1f5f9 !important;

            &::placeholder { color: #64748b !important; }

            &:focus {
              background: #17223b !important;
              border-color: #3b82f6 !important;
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25) !important;
            }
          }

          .stitch-clear-btn {
            color: #64748b !important;
            &:hover { color: #cbd5e1 !important; }
          }
        }

        .filter-controls-group {
          .filter-item {
            .filter-label { color: #94a3b8 !important; }

            .stitch-select {
              background-color: #131b2e !important;
              border-color: #1e293b !important;
              color: #cbd5e1 !important;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;

              option {
                background-color: #0f172a !important;
                color: #f1f5f9 !important;
              }

              &:focus {
                background-color: #17223b !important;
                border-color: #3b82f6 !important;
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25) !important;
              }
            }
          }

          .stitch-btn {
            background: #131b2e !important;
            border-color: #1e293b !important;
            color: #cbd5e1 !important;

            .material-symbols-outlined { color: #94a3b8 !important; }

            &:hover {
              background: #17223b !important;
              border-color: #334155 !important;
              color: #ffffff !important;
            }

            &.stitch-btn-reset {
              background: rgba(239, 68, 68, 0.15) !important;
              border-color: rgba(239, 68, 68, 0.3) !important;
              color: #fca5a5 !important;
              .material-symbols-outlined { color: #ef4444 !important; }
            }
          }
        }
      }

      .table-card {
        background: #0f172a !important;
        border-color: #1e293b !important;
      }

      .custom-table {
        background-color: #0f172a !important;
        color: #cbd5e1 !important;

        th {
          background-color: #131b2e !important;
          color: #94a3b8 !important;
          border-bottom-color: #1e293b !important;

          &.sortable-th:hover {
            background-color: #17223b !important;
            color: #60a5fa !important;
            .sort-icon { color: #60a5fa !important; }
          }
        }

        td {
          background-color: #0f172a !important;
          border-bottom-color: #1e293b !important;
          color: #cbd5e1 !important;
        }

        tr:hover td {
          background-color: #17223b !important;
          color: #ffffff !important;
        }

        th:first-child, th:last-child {
          background-color: #131b2e !important;
          box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.4) !important;
        }

        td:first-child, td:last-child {
          background-color: #0f172a !important;
          box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.4) !important;
        }

        tr:hover td:first-child, tr:hover td:last-child {
          background-color: #17223b !important;
        }

        tr.selected-row td {
          background-color: #172554 !important;
          color: #bfdbfe !important;
        }
      }

      .company-name-text {
        color: #ffffff !important;
      }

      .ruc-text {
        color: #60a5fa !important;
      }

      .badge-autorizada {
        background-color: rgba(16, 185, 129, 0.15) !important;
        color: #34d399 !important;
        border: 1px solid rgba(52, 211, 153, 0.3) !important;

        &.status-en_tramite {
          background-color: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
        }
        &.status-suspendida {
          background-color: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
          border-color: rgba(245, 158, 11, 0.3) !important;
        }
        &.status-cancelada {
          background-color: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
        }
      }

      .badge-modalidad {
        background-color: rgba(148, 163, 184, 0.12) !important;
        color: #cbd5e1 !important;
        border: 1px solid rgba(203, 213, 225, 0.2) !important;

        &.badge-more {
          background-color: rgba(148, 163, 184, 0.2) !important;
          color: #e2e8f0 !important;
        }
      }

      .badge-turismo {
        background-color: rgba(245, 158, 11, 0.15) !important;
        color: #fbbf24 !important;
        border: 1px solid rgba(251, 191, 36, 0.3) !important;
      }

      .badge-sunat-pill {
        &.sunat-activo {
          background-color: rgba(16, 185, 129, 0.15) !important;
          color: #34d399 !important;
          border-color: rgba(52, 211, 153, 0.3) !important;
        }

        &.sunat-habido {
          background-color: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
        }

        &.sunat-baja {
          background-color: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
        }

        &.sunat-no-habido {
          background-color: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
          border-color: rgba(245, 158, 11, 0.3) !important;
        }
      }

      .representante-info {
        .rep-name { color: #f1f5f9 !important; }
        .rep-dni { color: #94a3b8 !important; }
      }

      .contact-text {
        color: #cbd5e1 !important;
        .inline-icon { color: #94a3b8 !important; }
        &.email-text:hover { color: #60a5fa !important; }
      }

      ::ng-deep {
        .search-field .mat-mdc-text-field-wrapper, .filter-select .mat-mdc-text-field-wrapper {
          background-color: #131b2e !important;
          border-color: #1e293b !important;
        }

        .mat-mdc-select-value-text, input.mat-mdc-input-element {
          color: #f1f5f9 !important;
        }

        .mat-mdc-floating-label { color: #94a3b8 !important; }
        .mat-mdc-select-arrow { color: #94a3b8 !important; }

        .mdc-notched-outline__leading,
        .mdc-notched-outline__notch,
        .mdc-notched-outline__trailing {
          border-color: #1e293b !important;
        }

        .mat-mdc-paginator {
          background-color: #0f172a !important;
          color: #94a3b8 !important;
          border-top: 1px solid #1e293b !important;

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

  // Computed KPI Metrics (Stitch Official Padrón DRTC Puno) — DINÁMICOS
  totalAutorizadas = computed(() => {
    const list = this.empresas();
    return list.filter(e => 
      (!e.estado || e.estado === 'AUTORIZADA') && 
      (e.tiposServicio as string[])?.some(s => s?.toUpperCase().includes('PASAJER'))
    ).length;
  });

  totalEmpresasCount = computed(() => this.empresas().length);

  totalCanceladas = computed(() => {
    return this.empresas().filter(e => e.estado === 'CANCELADA').length;
  });

  // SUNAT: contar desde sunatCache las que tienen esActivo=true AND esHabido=true
  sunatActivas = computed(() => {
    const cache = this.sunatCache();
    let count = 0;
    cache.forEach((data) => {
      if (data.esActivo !== false && data.esHabido !== false) count++;
    });
    return count;
  });

  // SUNAT: empresas sin datos SUNAT en cache (pendientes de verificación)
  sunatEnVerificacion = computed(() => {
    const total = this.empresas().length;
    const enCache = this.sunatCache().size;
    return Math.max(0, total - enCache);
  });

  // Porcentaje de conformes SUNAT
  pctSunatConformes = computed(() => {
    const cache = this.sunatCache();
    if (cache.size === 0) return '0';
    let conformes = 0;
    cache.forEach((data) => {
      if (data.esActivo !== false && data.esHabido !== false) conformes++;
    });
    return ((conformes / cache.size) * 100).toFixed(1);
  });

  // Porcentaje de autorizadas pasajeros sobre el total
  pctAutorizadasPasajeros = computed(() => {
    const total = this.empresas().filter(e => !e.estado || e.estado === 'AUTORIZADA').length;
    if (total === 0) return '0';
    return ((this.totalAutorizadas() / total) * 100).toFixed(1);
  });

  pasajerosCount = computed(() => {
    return this.empresas().filter(e => (e.tiposServicio as string[])?.some(s => s?.toUpperCase().includes('PASAJER'))).length;
  });

  turismoCount = computed(() => {
    return this.empresas().filter(e => (e.tiposServicio as string[])?.some(s => s?.toUpperCase().includes('TURISMO'))).length;
  });

  trabajadoresCount = computed(() => {
    return this.empresas().filter(e => (e.tiposServicio as string[])?.some(s => s?.toUpperCase().includes('TRABAJADOR'))).length;
  });

  isTurismo(servicio: string): boolean {
    if (!servicio) return false;
    return servicio.toUpperCase().includes('TURISMO');
  }

  columnasVisibles = signal<string[]>([
    'seleccionar',
    'ruc',
    'razonSocial',
    'representante',
    'contacto',
    'estadoSunat',
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
    { id: 'estadoSunat', label: 'Estado SUNAT', visible: true },
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
        case 'estadoSunat': {
          const sA = this.sunatCache().get(a.ruc);
          const sB = this.sunatCache().get(b.ruc);
          const activoA = sA?.esActivo !== false ? '1_ACTIVO' : '0_BAJA';
          const activoB = sB?.esActivo !== false ? '1_ACTIVO' : '0_BAJA';
          const habidoA = sA?.esHabido !== false ? '1_HABIDO' : '0_NO_HABIDO';
          const habidoB = sB?.esHabido !== false ? '1_HABIDO' : '0_NO_HABIDO';
          valA = `${activoA}_${habidoA}`;
          valB = `${activoB}_${habidoB}`;
          break;
        }
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
    // Restaurar columnas visibles desde localStorage (v4 con Estado SUNAT visible por defecto)
    const savedColumns = localStorage.getItem('drtc_empresas_columnas_v4');
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
        localStorage.setItem('drtc_empresas_columnas_v4', JSON.stringify(columnasActualizadas));
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

    :host-context([data-theme="dark"]), :host-context(.dark-theme) {
      color: #f8fafc;
      .columna-item mat-checkbox { color: #f1f5f9; }
      button[mat-button] { color: #94a3b8; }
      button[mat-raised-button] { background-color: #2563eb !important; color: #ffffff !important; }
    }
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

    :host-context([data-theme="dark"]), :host-context(.dark-theme) {
      color: #f8fafc;
      p { color: #cbd5e1; }
      strong { color: #ffffff; }
      button[mat-button] { color: #94a3b8; }
      button[mat-raised-button] { background-color: #2563eb !important; color: #ffffff !important; }
    }
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

    :host-context([data-theme="dark"]), :host-context(.dark-theme) {
      color: #f8fafc;
      p { color: #cbd5e1; }
      strong { color: #ffffff; }
      .servicio-item mat-checkbox { color: #f1f5f9; }
      button[mat-button] { color: #94a3b8; }
      button[mat-raised-button] { background-color: #2563eb !important; color: #ffffff !important; }
    }
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
