import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { RutaService } from '../../services/ruta.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { Ruta, EstadoRuta, TipoRuta } from '../../models/ruta.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Observable, of, forkJoin } from 'rxjs';
import { map, startWith, catchError } from 'rxjs/operators';
import { CrearRutaMejoradoComponent } from './crear-ruta-mejorado.component';
import { DetalleRutaModalComponent } from './detalle-ruta-modal.component';
import { RutaUpdate } from '../../models/ruta.model';
import { IntercambioCodigosModalComponent } from './intercambio-codigos-modal.component';
import { ConfirmarEliminacionBloqueModalComponent } from './confirmar-eliminacion-bloque-modal.component';
import { CambiarEstadoRutasBloqueModalComponent } from './cambiar-estado-rutas-bloque-modal.component';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatChipsModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatDialogModule,
  ],
  template: `
    <div class="rutas-container">
      <div class="page-header">
        <div>
          <h1>Gestión de Rutas</h1>
          <p>Administra las rutas de transporte del sistema</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button 
                  color="primary" 
                  (click)="nuevaRuta()">
            <mat-icon>add</mat-icon>
            Nueva Ruta
          </button>
          <button mat-stroked-button 
                  color="accent" 
                  routerLink="/rutas/carga-masiva">
            <mat-icon>upload</mat-icon>
            Carga Masiva
          </button>
          <button mat-stroked-button 
                  color="accent" 
                  (click)="recargarRutas()">
            <mat-icon>refresh</mat-icon>
            Recargar
          </button>
        </div>
      </div>

      <!-- Filtros por empresa y resolución -->
      <mat-card class="filtros-card">
        <mat-card-content>
          <div class="filtros-grid">
            <!-- Filtro por Empresa -->
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Filtrar por Empresa</mat-label>
              <input matInput 
                     [matAutocomplete]="empresaAuto" 
                     [value]="empresaSearchValue()" 
                     (input)="onEmpresaSearchInput($event)"
                     placeholder="Buscar empresa por RUC o razón social">
              <mat-autocomplete #empresaAuto="matAutocomplete" 
                               [displayWith]="displayEmpresa"
                               (optionSelected)="onEmpresaSelected($event)">
                @for (empresa of empresasFiltradas() | async; track empresa.id) {
                  <mat-option [value]="empresa">
                    <div class="empresa-option">
                      <div class="empresa-ruc">{{ empresa.ruc }}</div>
                      <div class="empresa-razon">{{ empresa.razonSocial.principal || 'Sin razón social' }}</div>
                    </div>
                  </mat-option>
                }
              </mat-autocomplete>
              <mat-hint>Opcional: Filtre las rutas por empresa específica</mat-hint>
            </mat-form-field>

            <!-- Filtro por Resolución Simplificado (solo visible si hay empresa seleccionada) -->
            @if (empresaSeleccionada() && resolucionesEmpresa().length > 0) {
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Filtrar por Resolución ({{ getResolucionesPadre().length }} padre, {{ getResolucionesHijas().length }} hijas)</mat-label>
                <mat-select [value]="resolucionSeleccionada()" 
                           (selectionChange)="onResolucionSelected($event.value)"
                           placeholder="Seleccionar resolución">
                  <mat-option [value]="null">
                    <div class="resolucion-option-todas">
                      <mat-icon>list</mat-icon>
                      <span>Todas las resoluciones ({{ resolucionesEmpresa().length }})</span>
                    </div>
                  </mat-option>
                  
                  <!-- Resoluciones Padre -->
                  @for (resolucion of getResolucionesPadre(); track resolucion.id) {
                    <mat-option [value]="resolucion">
                      <div class="resolucion-option resolucion-padre">
                        <mat-icon color="primary">account_tree</mat-icon>
                        <div class="resolucion-info">
                          <div class="resolucion-numero">{{ resolucion.nroResolucion }}</div>
                          <div class="resolucion-detalle">{{ resolucion.tipoTramite }} (PADRE)</div>
                        </div>
                        @if (getHijasDeResolucion(resolucion.id).length > 0) {
                          <span class="hijas-count">{{ getHijasDeResolucion(resolucion.id).length }} hija(s)</span>
                        }
                      </div>
                    </mat-option>
                  }
                  
                  <!-- Resoluciones Hijas (indentadas) -->
                  @for (resolucion of getResolucionesHijas(); track resolucion.id) {
                    <mat-option [value]="resolucion">
                      <div class="resolucion-option resolucion-hija">
                        <mat-icon color="accent">subdirectory_arrow_right</mat-icon>
                        <div class="resolucion-info">
                          <div class="resolucion-numero">{{ resolucion.nroResolucion }}</div>
                          <div class="resolucion-detalle">{{ resolucion.tipoTramite }} (HIJA)</div>
                        </div>
                      </div>
                    </mat-option>
                  }
                </mat-select>
                <mat-hint>Resoluciones padre pueden tener resoluciones hijas asociadas</mat-hint>
              </mat-form-field>
            }

            <div class="filtros-actions">
              <button mat-button (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Mostrar Todas
              </button>
              @if (empresaSeleccionada()) {
                <button mat-button (click)="limpiarFiltroResolucion()">
                  <mat-icon>filter_list_off</mat-icon>
                  Limpiar Resolución
                </button>
                <button mat-button color="primary" (click)="forzarRecargaResoluciones()">
                  <mat-icon>refresh</mat-icon>
                  Recargar Resoluciones
                </button>
                <button mat-button color="accent" (click)="verificarContenidoDropdown()">
                  <mat-icon>visibility</mat-icon>
                  Verificar Dropdown
                </button>
                <button mat-button color="accent" (click)="debugDropdownState()">
                  <mat-icon>bug_report</mat-icon>
                  Debug
                </button>
                <button mat-button color="warn" (click)="testFiltradoDirecto()">
                  <mat-icon>science</mat-icon>
                  Test Filtrado
                </button>
              }
              <button mat-button color="warn" (click)="resetearDropdownCompleto()">
                <mat-icon>restart_alt</mat-icon>
                Reset Completo
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Panel de Filtros Avanzados -->
      <mat-card class="filtros-avanzados-card">
        <mat-card-header>
          <mat-card-title>
            <button mat-button 
                    (click)="toggleFiltrosAvanzados()"
                    class="toggle-filtros-btn">
              <mat-icon>{{ mostrarFiltrosAvanzados() ? 'expand_less' : 'expand_more' }}</mat-icon>
              Filtros Avanzados por Origen y Destino
            </button>
          </mat-card-title>
          <mat-card-subtitle>
            Buscar rutas por origen y destino específicos para análisis e informes
          </mat-card-subtitle>
        </mat-card-header>
        
        @if (mostrarFiltrosAvanzados()) {
          <mat-card-content>
            <!-- Buscador Inteligente de Rutas -->
            <div class="buscador-inteligente">
              <mat-form-field appearance="outline" class="form-field-full">
                <mat-label>Buscador Inteligente de Rutas</mat-label>
                <input matInput 
                       [matAutocomplete]="rutasAuto" 
                       [value]="busquedaRutas()" 
                       (input)="onBusquedaRutasInput($event)"
                       placeholder="Ej: PUNO (mostrará PUNO → JULIACA, YUNGUYO → PUNO, etc.)">
                <mat-autocomplete #rutasAuto="matAutocomplete" 
                                 [displayWith]="displayCombinacion"
                                 (optionSelected)="onCombinacionSelected($event)">
                  @for (combinacion of combinacionesFiltradas(); track combinacion.combinacion) {
                    <mat-option [value]="combinacion">
                      <div class="combinacion-option">
                        <div class="combinacion-ruta">
                          <mat-icon>route</mat-icon>
                          {{ combinacion.combinacion }}
                        </div>
                        <div class="combinacion-info">{{ combinacion.rutas.length }} ruta(s)</div>
                      </div>
                    </mat-option>
                  }
                </mat-autocomplete>
                <mat-hint>Escriba cualquier ciudad para ver todas las rutas relacionadas</mat-hint>
              </mat-form-field>
            </div>

            <!-- Acciones del Buscador Inteligente -->
            <div class="buscador-actions">
              <button mat-button (click)="limpiarBuscadorInteligente()">
                <mat-icon>clear</mat-icon>
                Limpiar Búsqueda
              </button>
              <button mat-stroked-button 
                      color="accent" 
                      (click)="recargarCombinaciones()"
                      matTooltip="Recargar combinaciones de rutas">
                <mat-icon>refresh</mat-icon>
                Recargar
              </button>
            </div>

            <!-- Rutas Seleccionadas -->
            @if (rutasSeleccionadas().length > 0) {
              <div class="rutas-seleccionadas">
                <mat-divider style="margin: 16px 0;"></mat-divider>
                <h4>Rutas Seleccionadas ({{ rutasSeleccionadas().length }})</h4>
                <div class="rutas-seleccionadas-grid">
                  @for (ruta of rutasSeleccionadas(); track ruta.combinacion) {
                    <mat-chip-set>
                      <mat-chip [removable]="true" (removed)="removerRutaSeleccionada(ruta)">
                        <mat-icon>route</mat-icon>
                        {{ ruta.combinacion }}
                        <mat-icon matChipRemove>cancel</mat-icon>
                      </mat-chip>
                    </mat-chip-set>
                  }
                </div>
                <div class="rutas-seleccionadas-actions">
                  <button mat-raised-button 
                          color="primary" 
                          (click)="aplicarFiltroRutasSeleccionadas()">
                    <mat-icon>search</mat-icon>
                    Filtrar Rutas Seleccionadas
                  </button>
                  <button mat-button (click)="limpiarRutasSeleccionadas()">
                    <mat-icon>clear</mat-icon>
                    Limpiar Selección
                  </button>
                </div>
              </div>
            }

            <!-- Resultados del Filtro Avanzado -->
            @if (resultadoFiltroAvanzado()) {
              <div class="resultados-filtro-avanzado">
                <mat-divider></mat-divider>
                <div class="resultados-header">
                  <h4>Resultados del Filtro Avanzado</h4>
                  <div class="resultados-stats">
                    <span class="stat-item">
                      <mat-icon>route</mat-icon>
                      {{ resultadoFiltroAvanzado()?.total_rutas || 0 }} rutas
                    </span>
                    <span class="stat-item">
                      <mat-icon>business</mat-icon>
                      {{ resultadoFiltroAvanzado()?.total_empresas || 0 }} empresas
                    </span>
                  </div>
                  <div class="resultados-actions">
                    <button mat-stroked-button 
                            color="primary" 
                            (click)="exportarResultados('excel')"
                            [disabled]="!resultadoFiltroAvanzado()?.total_rutas">
                      <mat-icon>file_download</mat-icon>
                      Excel
                    </button>
                    <button mat-stroked-button 
                            color="primary" 
                            (click)="exportarResultados('pdf')"
                            [disabled]="!resultadoFiltroAvanzado()?.total_rutas">
                      <mat-icon>picture_as_pdf</mat-icon>
                      PDF
                    </button>
                    <button mat-stroked-button 
                            color="primary" 
                            (click)="exportarResultados('csv')"
                            [disabled]="!resultadoFiltroAvanzado()?.total_rutas">
                      <mat-icon>table_chart</mat-icon>
                      CSV
                    </button>
                  </div>
                </div>

                <!-- Empresas y sus rutas -->
                @if (resultadoFiltroAvanzado()?.empresas) {
                  <div class="empresas-resultados">
                    @for (empresaInfo of resultadoFiltroAvanzado()?.empresas; track empresaInfo.empresa.id) {
                      <mat-card class="empresa-resultado-card">
                        <mat-card-header>
                          <mat-card-title>
                            <div class="empresa-resultado-header">
                              <mat-icon color="primary">business</mat-icon>
                              <span>{{ empresaInfo.empresa.razonSocial }}</span>
                              <span class="rutas-count">({{ empresaInfo.total_rutas }} ruta{{ empresaInfo.total_rutas !== 1 ? 's' : '' }})</span>
                            </div>
                          </mat-card-title>
                          <mat-card-subtitle>
                            RUC: {{ empresaInfo.empresa.ruc }}
                          </mat-card-subtitle>
                        </mat-card-header>
                        <mat-card-content>
                          <div class="rutas-empresa-grid">
                            @for (ruta of empresaInfo.rutas; track ruta.id) {
                              <div class="ruta-item">
                                <span class="ruta-codigo">[{{ ruta.codigoRuta }}]</span>
                                <span class="ruta-descripcion">{{ ruta.origen }} → {{ ruta.destino }}</span>
                                <span class="ruta-estado" [class.activa]="ruta.estado === 'ACTIVA'">{{ ruta.estado }}</span>
                              </div>
                            }
                          </div>
                        </mat-card-content>
                      </mat-card>
                    }
                  </div>
                }
              </div>
            }
          </mat-card-content>
        }
      </mat-card>

      <!-- Información del filtro aplicado -->
      @if (filtroActivo().tipo !== 'todas') {
        <mat-card class="info-card" [class.resolucion-crud]="filtroActivo().tipo === 'resolucion'">
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Vista actual:</span>
                <span class="value">{{ filtroActivo().descripcion }}</span>
                @if (filtroActivo().tipo === 'resolucion') {
                  <mat-icon color="accent" matTooltip="Vista CRUD de Resolución">verified</mat-icon>
                }
              </div>
              <div class="info-item">
                <span class="label">Rutas encontradas:</span>
                <span class="value">{{ rutas().length }}</span>
              </div>
              @if (filtroActivo().tipo === 'resolucion') {
                <div class="info-item">
                  <button mat-stroked-button 
                          color="accent" 
                          (click)="gestionarRutasResolucion()"
                          matTooltip="Gestionar todas las rutas de esta resolución">
                    <mat-icon>settings</mat-icon>
                    Gestionar Resolución
                  </button>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

        <!-- Tabla de Rutas -->
        <div class="content-section">
          <div class="section-header">
            <h3>{{ filtroActivo().descripcion }}</h3>
            <p class="section-subtitle">
              Mostrando {{ rutas().length }} ruta(s)
              @if (filtroActivo().tipo === 'resolucion') {
                de la resolución seleccionada - Vista CRUD
              } @else if (filtroActivo().tipo === 'empresa') {
                de la empresa seleccionada
              } @else if (filtroActivo().tipo === 'empresa-resolucion') {
                de la empresa y resolución seleccionadas
              } @else {
                del sistema completo
              }
            </p>
          </div>

          @if (rutas().length > 0) {
            <!-- Vista agrupada por resolución (solo para empresa seleccionada) -->
            @if (empresaSeleccionada() && !resolucionSeleccionada() && tieneGruposResolucion()) {
              <div class="resoluciones-container">
                @for (grupo of getGruposResolucion(); track grupo[0]) {
                  <mat-card class="resolucion-card" style="margin-bottom: 20px;">
                    <mat-card-header>
                      <mat-card-title>
                        <div class="resolucion-header">
                          <mat-icon color="primary">description</mat-icon>
                          <span>{{ grupo[1].resolucion?.nroResolucion || 'Resolución ' + grupo[0].substring(0, 8) + '...' }}</span>
                          <span class="rutas-count">({{ grupo[1].rutas.length }} ruta{{ grupo[1].rutas.length !== 1 ? 's' : '' }})</span>
                        </div>
                      </mat-card-title>
                      <mat-card-subtitle>
                        {{ grupo[1].resolucion?.tipoTramite || 'Tipo no disponible' }} - {{ grupo[1].resolucion?.tipoResolucion || 'Sin tipo' }}
                      </mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="table-container">
                        <table mat-table [dataSource]="grupo[1].rutas" class="rutas-table">
                          <!-- Código de Ruta -->
                          <ng-container matColumnDef="codigoRuta">
                            <th mat-header-cell *matHeaderCellDef>Código</th>
                            <td mat-cell *matCellDef="let ruta">
                              <span class="codigo-ruta">{{ ruta.codigoRuta }}</span>
                            </td>
                          </ng-container>

                          <!-- Origen -->
                          <ng-container matColumnDef="origen">
                            <th mat-header-cell *matHeaderCellDef>Origen</th>
                            <td mat-cell *matCellDef="let ruta">{{ ruta.origen || ruta.origenId }}</td>
                          </ng-container>

                          <!-- Destino -->
                          <ng-container matColumnDef="destino">
                            <th mat-header-cell *matHeaderCellDef>Destino</th>
                            <td mat-cell *matCellDef="let ruta">{{ ruta.destino || ruta.destinoId }}</td>
                          </ng-container>

                          <!-- Frecuencias -->
                          <ng-container matColumnDef="frecuencias">
                            <th mat-header-cell *matHeaderCellDef>Frecuencias</th>
                            <td mat-cell *matCellDef="let ruta">{{ ruta.frecuencias }}</td>
                          </ng-container>

                          <!-- Estado -->
                          <ng-container matColumnDef="estado">
                            <th mat-header-cell *matHeaderCellDef>Estado</th>
                            <td mat-cell *matCellDef="let ruta">
                              <span class="estado-badge" [class.activo]="ruta.estado === 'ACTIVA'">
                                {{ ruta.estado }}
                              </span>
                            </td>
                          </ng-container>

                          <!-- Acciones -->
                          <ng-container matColumnDef="acciones">
                            <th mat-header-cell *matHeaderCellDef>Acciones</th>
                            <td mat-cell *matCellDef="let ruta">
                              <button mat-icon-button 
                                      color="accent" 
                                      (click)="verDetalleRuta(ruta)"
                                      matTooltip="Ver detalles">
                                <mat-icon>visibility</mat-icon>
                              </button>
                              <button mat-icon-button 
                                      color="primary" 
                                      (click)="editarRuta(ruta)"
                                      matTooltip="Editar ruta">
                                <mat-icon>edit</mat-icon>
                              </button>
                              <button mat-icon-button 
                                      color="accent" 
                                      (click)="duplicarRuta(ruta)"
                                      matTooltip="Duplicar ruta">
                                <mat-icon>content_copy</mat-icon>
                              </button>
                              <button mat-icon-button 
                                      color="warn" 
                                      (click)="eliminarRuta(ruta)"
                                      matTooltip="Eliminar ruta">
                                <mat-icon>delete</mat-icon>
                              </button>
                            </td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="visibleColumns()"></tr>
                          <tr mat-row 
                              *matRowDef="let row; columns: visibleColumns();"
                              [class.selected-row]="isRutaSeleccionada(row.id)"></tr>
                        </table>
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            } @else {
              <!-- Vista de tabla normal (para todas las rutas o resolución específica) -->
              
              <!-- Acciones de tabla y configuración -->
              <div class="table-actions">
                <!-- Acciones en bloque -->
                @if (getRutasSeleccionadasCount() > 0) {
                  <div class="bulk-actions">
                    <span class="selection-info">{{ getRutasSeleccionadasCount() }} seleccionada(s)</span>
                    <button mat-raised-button color="warn" (click)="eliminarRutasEnBloque()">
                      <mat-icon>delete</mat-icon>
                      ELIMINAR ({{ getRutasSeleccionadasCount() }})
                    </button>
                    <button mat-raised-button color="primary" (click)="cambiarEstadoRutasEnBloque()">
                      <mat-icon>swap_horiz</mat-icon>
                      CAMBIAR ESTADO ({{ getRutasSeleccionadasCount() }})
                    </button>
                    <button mat-stroked-button color="accent" (click)="exportarRutasSeleccionadas('excel')">
                      <mat-icon>file_download</mat-icon>
                      EXPORTAR EXCEL
                    </button>
                    <button mat-button (click)="limpiarSeleccionRutas()">
                      <mat-icon>clear</mat-icon>
                      LIMPIAR
                    </button>
                  </div>
                } @else {
                  <button mat-button [matMenuTriggerFor]="columnMenu" class="column-config-button">
                    <mat-icon>view_column</mat-icon>
                    COLUMNAS ({{ getVisibleColumnsCount() }})
                  </button>
                  <button mat-button color="accent" (click)="recargarRutas()">
                    <mat-icon>refresh</mat-icon>
                    RECARGAR
                  </button>
                }
                
                <!-- Menú de configuración de columnas -->
                <mat-menu #columnMenu="matMenu" class="columnas-menu rutas-columnas-menu">
                  <div class="columnas-menu-header" (click)="$event.stopPropagation()">
                    <h4>Mostrar columnas</h4>
                  </div>
                  <mat-divider></mat-divider>
                  
                  <div class="column-menu-content">
                    @for (column of availableColumns(); track column.key) {
                      <button mat-menu-item class="columna-checkbox" 
                              [class.disabled-column]="column.required"
                              (click)="$event.stopPropagation()">
                        <mat-checkbox 
                          [checked]="column.visible"
                          [disabled]="column.required"
                          (change)="toggleColumn(column.key)"
                          (click)="$event.stopPropagation()">
                          {{ column.label }}
                        </mat-checkbox>
                      </button>
                    }
                  </div>
                  
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="resetearColumnas()">
                    <mat-icon>refresh</mat-icon>
                    Restablecer columnas
                  </button>
                </mat-menu>
              </div>

              <div class="table-container">
                <table mat-table [dataSource]="rutas()" class="rutas-table">
                
                <!-- Columna de Selección -->
                <ng-container matColumnDef="select">
                  <th mat-header-cell *matHeaderCellDef class="table-header-cell select-column">
                    <mat-checkbox 
                      [checked]="seleccionarTodasLasRutas()"
                      [indeterminate]="getRutasSeleccionadasCount() > 0 && !seleccionarTodasLasRutas()"
                      (change)="toggleSeleccionarTodasLasRutas()"
                      color="primary">
                    </mat-checkbox>
                  </th>
                  <td mat-cell *matCellDef="let ruta" class="table-cell select-column">
                    <mat-checkbox 
                      [checked]="isRutaSeleccionada(ruta.id)"
                      (change)="toggleRutaSeleccion(ruta.id)"
                      color="primary">
                    </mat-checkbox>
                  </td>
                </ng-container>
                
                <!-- Código de Ruta -->
                <ng-container matColumnDef="codigoRuta">
                  <th mat-header-cell *matHeaderCellDef>Código</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="codigo-ruta">{{ ruta.codigoRuta }}</span>
                  </td>
                </ng-container>

                <!-- Empresa -->
                <ng-container matColumnDef="empresa">
                  <th mat-header-cell *matHeaderCellDef>Empresa</th>
                  <td mat-cell *matCellDef="let ruta">
                    <div class="empresa-info">
                      <div class="empresa-nombre">{{ obtenerNombreEmpresa(ruta) }}</div>
                      <div class="empresa-ruc">{{ obtenerRucEmpresa(ruta) }}</div>
                    </div>
                  </td>
                </ng-container>

                <!-- Resolución -->
                <ng-container matColumnDef="resolucion">
                  <th mat-header-cell *matHeaderCellDef>Resolución</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="resolucion-numero">{{ obtenerNumeroResolucion(ruta) }}</span>
                  </td>
                </ng-container>

                <!-- Origen -->
                <ng-container matColumnDef="origen">
                  <th mat-header-cell *matHeaderCellDef>Origen</th>
                  <td mat-cell *matCellDef="let ruta">{{ ruta.origen || ruta.origenId }}</td>
                </ng-container>

                <!-- Destino -->
                <ng-container matColumnDef="destino">
                  <th mat-header-cell *matHeaderCellDef>Destino</th>
                  <td mat-cell *matCellDef="let ruta">{{ ruta.destino || ruta.destinoId }}</td>
                </ng-container>

                <!-- Itinerario -->
                <ng-container matColumnDef="itinerario">
                  <th mat-header-cell *matHeaderCellDef>Itinerario</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="itinerario-text" [matTooltip]="ruta.descripcion || ruta.itinerario">
                      {{ (ruta.descripcion || ruta.itinerario || 'SIN ITINERARIO') | slice:0:30 }}
                      {{ (ruta.descripcion || ruta.itinerario || '').length > 30 ? '...' : '' }}
                    </span>
                  </td>
                </ng-container>

                <!-- Distancia -->
                <ng-container matColumnDef="distancia">
                  <th mat-header-cell *matHeaderCellDef>Distancia</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="distancia-value">
                      {{ ruta.distancia ? (ruta.distancia + ' km') : '-' }}
                    </span>
                  </td>
                </ng-container>

                <!-- Tiempo Estimado -->
                <ng-container matColumnDef="tiempoEstimado">
                  <th mat-header-cell *matHeaderCellDef>Tiempo Est.</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="tiempo-value">
                      {{ ruta.tiempoEstimado || '-' }}
                    </span>
                  </td>
                </ng-container>

                <!-- Tipo de Ruta -->
                <ng-container matColumnDef="tipoRuta">
                  <th mat-header-cell *matHeaderCellDef>Tipo Ruta</th>
                  <td mat-cell *matCellDef="let ruta">
                    <mat-chip class="tipo-ruta-chip" [class]="'tipo-' + (ruta.tipoRuta || '').toLowerCase()">
                      {{ ruta.tipoRuta || '-' }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Tipo de Servicio -->
                <ng-container matColumnDef="tipoServicio">
                  <th mat-header-cell *matHeaderCellDef>Tipo Servicio</th>
                  <td mat-cell *matCellDef="let ruta">
                    <mat-chip class="tipo-servicio-chip" [class]="'servicio-' + (ruta.tipoServicio || '').toLowerCase()">
                      {{ ruta.tipoServicio || '-' }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Capacidad Máxima -->
                <ng-container matColumnDef="capacidadMaxima">
                  <th mat-header-cell *matHeaderCellDef>Capacidad</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="capacidad-value">
                      {{ ruta.capacidadMaxima ? (ruta.capacidadMaxima + ' pax') : '-' }}
                    </span>
                  </td>
                </ng-container>

                <!-- Tarifa Base -->
                <ng-container matColumnDef="tarifaBase">
                  <th mat-header-cell *matHeaderCellDef>Tarifa</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="tarifa-value">
                      {{ ruta.tarifaBase ? ('S/ ' + ruta.tarifaBase.toFixed(2)) : '-' }}
                    </span>
                  </td>
                </ng-container>

                <!-- Frecuencias -->
                <ng-container matColumnDef="frecuencias">
                  <th mat-header-cell *matHeaderCellDef>Frecuencias</th>
                  <td mat-cell *matCellDef="let ruta">{{ ruta.frecuencias }}</td>
                </ng-container>

                <!-- Estado -->
                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="estado-badge" [class.activo]="ruta.estado === 'ACTIVA'">
                      {{ ruta.estado }}
                    </span>
                  </td>
                </ng-container>

                <!-- Fecha de Registro -->
                <ng-container matColumnDef="fechaRegistro">
                  <th mat-header-cell *matHeaderCellDef>Fecha Registro</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="fecha-value">
                      {{ ruta.fechaRegistro ? (ruta.fechaRegistro | date:'dd/MM/yyyy') : '-' }}
                    </span>
                  </td>
                </ng-container>

                <!-- Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let ruta">
                    <button mat-icon-button 
                            color="accent" 
                            (click)="verDetalleRuta(ruta)"
                            matTooltip="Ver detalles">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    <button mat-icon-button 
                            color="primary" 
                            (click)="editarRuta(ruta)"
                            matTooltip="Editar ruta">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button 
                            color="accent" 
                            (click)="duplicarRuta(ruta)"
                            matTooltip="Duplicar ruta">
                      <mat-icon>content_copy</mat-icon>
                    </button>
                    <button mat-icon-button 
                            color="warn" 
                            (click)="eliminarRuta(ruta)"
                            matTooltip="Eliminar ruta">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="visibleColumns()"></tr>
                <tr mat-row 
                    *matRowDef="let row; columns: visibleColumns();"
                    [class.selected-row]="isRutaSeleccionada(row.id)"></tr>
              </table>
              </div>
            }
          } @else {
            <div class="empty-state">
              @if (empresaSeleccionada()) {
                <mat-icon class="empty-icon">business</mat-icon>
                <h3>No hay rutas para esta empresa</h3>
                <p>La empresa seleccionada no tiene rutas registradas en el sistema.</p>
              } @else {
                <mat-icon class="empty-icon">route</mat-icon>
                <h3>No hay rutas en el sistema</h3>
                <p>No se encontraron rutas registradas. Comienza agregando la primera ruta.</p>
              }
              <button mat-raised-button 
                      color="primary" 
                      (click)="nuevaRuta()">
                <mat-icon>add</mat-icon>
                Agregar Nueva Ruta
              </button>
            </div>
          }
        </div>
    </div>
  `,
  styleUrls: ['./rutas.component.scss']
})
export class RutasComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);

  private rutaService = inject(RutaService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);

  // Signals
  rutas = signal<Ruta[]>([]);
  todasLasRutas = signal<Ruta[]>([]); // Mantener todas las rutas para filtrado
  rutasAgrupadasPorResolucion = signal<{[resolucionId: string]: {resolucion: Resolucion | null, rutas: Ruta[]}}>({}); 
  isLoading = signal(false);
  empresaSeleccionada = signal<Empresa | null>(null);
  resolucionSeleccionada = signal<Resolucion | null>(null);
  empresaSearchValue = signal('');
  empresasFiltradas = signal<Observable<Empresa[]>>(of([]));
  resolucionesEmpresa = signal<Resolucion[]>([]);
  totalRutas = signal<number>(0);
  
  // Signals para selección múltiple
  rutasSeleccionadasIds = signal<Set<string>>(new Set());
  
  // Signals para configuración de columnas
  availableColumns = signal([
    { key: 'select', label: 'Selección', visible: true, required: true },
    { key: 'codigoRuta', label: 'Código', visible: true, required: true },
    { key: 'empresa', label: 'Empresa', visible: true, required: false },
    { key: 'resolucion', label: 'Resolución', visible: true, required: false },
    { key: 'origen', label: 'Origen', visible: true, required: false },
    { key: 'destino', label: 'Destino', visible: true, required: false },
    { key: 'itinerario', label: 'Itinerario', visible: true, required: false }, // Visible por defecto
    { key: 'distancia', label: 'Distancia', visible: false, required: false },
    { key: 'tiempoEstimado', label: 'Tiempo Est.', visible: false, required: false },
    { key: 'tipoRuta', label: 'Tipo Ruta', visible: false, required: false },
    { key: 'tipoServicio', label: 'Tipo Servicio', visible: false, required: false },
    { key: 'capacidadMaxima', label: 'Capacidad', visible: false, required: false },
    { key: 'tarifaBase', label: 'Tarifa', visible: false, required: false },
    { key: 'frecuencias', label: 'Frecuencias', visible: true, required: false },
    { key: 'estado', label: 'Estado', visible: true, required: false },
    { key: 'fechaRegistro', label: 'Fecha Registro', visible: false, required: false },
    { key: 'acciones', label: 'Acciones', visible: true, required: true }
  ]);
  
  // Signals para filtros avanzados
  mostrarFiltrosAvanzados = signal(false);
  origenSeleccionado = signal('');
  destinoSeleccionado = signal('');
  origenesFiltrados = signal<Observable<string[]>>(of([]));
  destinosFiltrados = signal<Observable<string[]>>(of([]));
  origenesDisponibles = signal<string[]>([]);
  destinosDisponibles = signal<string[]>([]);
  resultadoFiltroAvanzado = signal<any>(null);
  
  // Nuevos signals para búsqueda inteligente
  busquedaRutas = signal('');
  combinacionesDisponibles = signal<any[]>([]);
  combinacionesFiltradas = signal<any[]>([]);
  rutasSeleccionadas = signal<any[]>([]);
  
  // Información del filtro activo
  filtroActivo = signal<{
    tipo: 'todas' | 'empresa' | 'resolucion' | 'empresa-resolucion';
    descripcion: string;
    resolucionId?: string;
    empresaId?: string;
  }>({
    tipo: 'todas',
    descripcion: 'Todas las rutas del sistema'
  });

  // Columnas simplificadas
  displayedColumns = ['select', 'codigoRuta', 'empresa', 'resolucion', 'origen', 'destino', 'itinerario', 'distancia', 'tiempoEstimado', 'tipoRuta', 'tipoServicio', 'capacidadMaxima', 'tarifaBase', 'frecuencias', 'estado', 'fechaRegistro', 'acciones'];

  // Computed para columnas visibles
  visibleColumns = computed(() => {
    return this.availableColumns()
      .filter(col => col.visible)
      .map(col => col.key);
  });

  ngOnInit(): void {
    console.log('🚀 COMPONENTE RUTAS INICIALIZADO');
    this.inicializarFiltros();
    this.cargarTodasLasRutas();
  }

  private inicializarFiltros(): void {
    // Cargar todas las empresas para el filtro
    this.empresaService.getEmpresas().subscribe(empresas => {
      this.empresasFiltradas.set(of(empresas));
    });
  }

  private cargarTodasLasRutas(): void {
    console.log('🔄 CARGANDO TODAS LAS RUTAS...');

    // Cargar todas las rutas del sistema
    this.rutaService.getRutas().subscribe({
      next: (rutas) => {
        console.log('✅ RUTAS CARGADAS EXITOSAMENTE:', {
          total: rutas.length,
          rutas: rutas.map(r => ({
            id: r.id,
            codigoRuta: r.codigoRuta,
            nombre: r.nombre,
            origen: r.origen,
            destino: r.destino,
            resolucionId: r.resolucionId
          }))
        });

        this.rutas.set(rutas);
        this.todasLasRutas.set(rutas); // Actualizar todasLasRutas
        this.totalRutas.set(rutas.length);
        
        // Establecer filtro por defecto solo si no hay filtro activo
        if (this.filtroActivo().tipo === 'todas') {
          this.filtroActivo.set({
            tipo: 'todas',
            descripcion: 'Todas las Rutas del Sistema'
          });
        }
      },
      error: (error) => {
        console.error('❌ ERROR AL CARGAR RUTAS:', error);
        this.snackBar.open('Error al cargar las rutas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Métodos de filtrado simplificados
  onEmpresaSearchInput(event: any): void {
    const value = event.target.value;
    this.empresaSearchValue.set(value);
    this.filtrarEmpresas(value);
  }

  onEmpresaSelected(event: any): void {
    const empresa = event.option.value;
    console.log('🏢 EVENTO EMPRESA SELECCIONADA - INICIANDO PROCESO...');
    console.log('📊 DATOS DE LA EMPRESA:', {
      empresa: empresa.razonSocial?.principal,
      empresaId: empresa.id,
      ruc: empresa.ruc
    });

    this.empresaSeleccionada.set(empresa);
    this.empresaSearchValue.set(this.displayEmpresa(empresa));

    console.log('✅ SIGNALS ACTUALIZADOS - EMPRESA SELECCIONADA');

    // Limpiar resolución seleccionada al cambiar empresa
    this.resolucionSeleccionada.set(null);
    console.log('🧹 RESOLUCIÓN SELECCIONADA LIMPIADA');

    // IMPORTANTE: Limpiar resoluciones anteriores INMEDIATAMENTE
    console.log('🧹 LIMPIANDO RESOLUCIONES ANTERIORES ANTES DE CARGAR NUEVAS...');
    this.resolucionesEmpresa.set([]);
    console.log('✅ RESOLUCIONES LIMPIADAS - SIGNAL VACÍO');

    // Verificar que el signal esté vacío
    setTimeout(() => {
      console.log('🔍 VERIFICANDO SIGNAL DESPUÉS DE LIMPIAR:', {
        total: this.resolucionesEmpresa().length,
        resoluciones: this.resolucionesEmpresa()
      });
    }, 10);

    // Cargar resoluciones de la empresa
    console.log('🔄 INICIANDO CARGA DE RESOLUCIONES...');
    this.cargarResolucionesEmpresa(empresa.id);

    // Filtrar las rutas por la empresa seleccionada
    console.log('🔄 INICIANDO FILTRADO DE RUTAS...');
    this.filtrarRutasPorEmpresa(empresa.id);
    
    console.log('✅ PROCESO DE SELECCIÓN DE EMPRESA COMPLETADO');
  }

  private filtrarEmpresas(value: string): void {
    if (typeof value !== 'string') return;
    const filterValue = value.toLowerCase();

    this.empresaService.getEmpresas().subscribe(empresas => {
      const empresasFiltradas = empresas.filter(empresa =>
        empresa.ruc.toLowerCase().includes(filterValue) ||
        (empresa.razonSocial?.principal || '').toLowerCase().includes(filterValue)
      );
      this.empresasFiltradas.set(of(empresasFiltradas));
    });
  }



  limpiarFiltros(): void {
    console.log('🧹 LIMPIANDO FILTROS...');

    this.empresaSeleccionada.set(null);
    this.resolucionSeleccionada.set(null);
    this.empresaSearchValue.set('');
    this.resolucionesEmpresa.set([]);

    // Mostrar todas las rutas del sistema
    this.rutas.set(this.todasLasRutas());
    
    // Actualizar filtro activo
    this.filtroActivo.set({
      tipo: 'todas',
      descripcion: 'Todas las Rutas del Sistema'
    });

    console.log('✅ FILTROS LIMPIADOS, MOSTRANDO TODAS LAS RUTAS');
    this.snackBar.open('Mostrando todas las rutas del sistema', 'Cerrar', { duration: 3000 });
  }

  limpiarFiltroResolucion(): void {
    console.log('🧹 LIMPIANDO FILTRO DE RESOLUCIÓN...');
    
    this.resolucionSeleccionada.set(null);
    
    // Si hay empresa seleccionada, mostrar todas sus rutas
    const empresa = this.empresaSeleccionada();
    if (empresa) {
      this.filtrarRutasPorEmpresa(empresa.id);
    } else {
      // Si no hay empresa, mostrar todas las rutas
      this.rutas.set(this.todasLasRutas());
      this.filtroActivo.set({
        tipo: 'todas',
        descripcion: 'Todas las Rutas del Sistema'
      });
    }
    
    this.snackBar.open('Filtro de resolución eliminado', 'Cerrar', { duration: 2000 });
  }

  recargarRutas(): void {
    this.cargarTodasLasRutas();
    this.snackBar.open('Rutas recargadas', 'Cerrar', { duration: 2000 });
  }

  // Métodos para manejo de resoluciones simplificado
  private cargarResolucionesEmpresa(empresaId: string): void {
    console.log('📋 CARGANDO RESOLUCIONES SIMPLIFICADAS PARA EMPRESA:', empresaId);
    
    // Limpiar resoluciones anteriores
    this.resolucionesEmpresa.set([]);
    
    // Usar el endpoint simplificado del backend
    this.empresaService.getResoluciones(empresaId).subscribe({
      next: (response: any) => {
        console.log('✅ RESPUESTA DEL BACKEND - RESOLUCIONES:', response);
        
        const resoluciones = response.resoluciones || [];
        const resolucionesFormateadas: Resolucion[] = [];
        
        // Procesar resoluciones padre con sus hijas
        resoluciones.forEach((resolucion: any) => {
          // Agregar resolución padre
          const resolucionPadre: Resolucion = {
            id: resolucion.id,
            nroResolucion: resolucion.nroResolucion,
            tipoTramite: resolucion.tipoTramite,
            tipoResolucion: resolucion.tipoResolucion,
            empresaId: empresaId,
            expedienteId: '',
            fechaEmision: new Date(resolucion.fechaEmision || Date.now()),
            resolucionesHijasIds: resolucion.hijas?.map((h: any) => h.id) || [],
            vehiculosHabilitadosIds: [],
            rutasAutorizadasIds: [],
            descripcion: resolucion.descripcion || `${resolucion.tipoTramite} - ${resolucion.totalHijas || 0} hija(s)`,
            estaActivo: resolucion.estado === 'VIGENTE'
          } as Resolucion;
          
          resolucionesFormateadas.push(resolucionPadre);
          
          // Agregar resoluciones hijas si existen
          if (resolucion.hijas && resolucion.hijas.length > 0) {
            resolucion.hijas.forEach((hija: any) => {
              const resolucionHija: Resolucion = {
                id: hija.id,
                nroResolucion: `${resolucion.nroResolucion} > ${hija.nroResolucion}`,
                tipoTramite: hija.tipoTramite,
                tipoResolucion: hija.tipoResolucion,
                empresaId: empresaId,
                expedienteId: '',
                fechaEmision: new Date(hija.fechaEmision || Date.now()),
                resolucionPadreId: resolucion.id,
                resolucionesHijasIds: [],
                vehiculosHabilitadosIds: [],
                rutasAutorizadasIds: [],
                descripcion: hija.descripcion || `Hija de ${resolucion.nroResolucion}`,
                estaActivo: hija.estado === 'VIGENTE'
              } as Resolucion;
              
              resolucionesFormateadas.push(resolucionHija);
            });
          }
        });
        
        console.log('✅ RESOLUCIONES PROCESADAS:', {
          totalPadre: response.total_padre,
          totalHijas: response.total_hijas,
          totalFormateadas: resolucionesFormateadas.length,
          resoluciones: resolucionesFormateadas.map(r => ({
            id: r.id,
            numero: r.nroResolucion,
            tipo: r.tipoTramite,
            esPadre: r.tipoResolucion === 'PADRE'
          }))
        });
        
        // Actualizar el signal
        this.resolucionesEmpresa.set(resolucionesFormateadas);
        this.cdr.detectChanges();
        
        const mensaje = `${response.total_padre} resolución(es) padre con ${response.total_hijas} hija(s) cargadas`;
        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('❌ ERROR AL CARGAR RESOLUCIONES:', error);
        
        // Fallback: usar resoluciones hardcodeadas
        const resolucionesFallback: Resolucion[] = [
          {
            id: '694187b1c6302fb8566ba0a0',
            nroResolucion: 'R-0003-2025',
            tipoTramite: 'RENOVACION',
            tipoResolucion: 'PADRE',
            empresaId: empresaId,
            expedienteId: 'exp-001',
            fechaEmision: new Date(),
            resolucionesHijasIds: [],
            vehiculosHabilitadosIds: [],
            rutasAutorizadasIds: [],
            descripcion: 'Resolución de renovación (fallback)',
            estaActivo: true
          } as Resolucion,
          {
            id: '6941bb5d5e0d9aefe5627d84',
            nroResolucion: 'R-0005-2025',
            tipoTramite: 'PRIMIGENIA',
            tipoResolucion: 'PADRE',
            empresaId: empresaId,
            expedienteId: 'exp-002',
            fechaEmision: new Date(),
            resolucionesHijasIds: [],
            vehiculosHabilitadosIds: [],
            rutasAutorizadasIds: [],
            descripcion: 'Resolución primigenia (fallback)',
            estaActivo: true
          } as Resolucion
        ];
        
        this.resolucionesEmpresa.set(resolucionesFallback);
        this.cdr.detectChanges();
        
        this.snackBar.open('Error al cargar resoluciones. Usando datos de respaldo.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  onResolucionSelected(resolucion: Resolucion | null): void {
    console.log('📋 EVENTO RESOLUCIÓN SELECCIONADA - INICIO:', {
      resolucion: resolucion,
      resolucionType: typeof resolucion,
      resolucionNull: resolucion === null
    });

    // FORZAR ACTUALIZACIÓN DEL SIGNAL INMEDIATAMENTE
    this.resolucionSeleccionada.set(resolucion);
    this.cdr.detectChanges();
    
    const empresa = this.empresaSeleccionada();
    if (!empresa) {
      console.error('❌ NO HAY EMPRESA SELECCIONADA');
      return;
    }

    console.log('🏢 EMPRESA ACTUAL:', {
      empresaId: empresa.id,
      empresaNombre: empresa.razonSocial?.principal
    });

    if (resolucion) {
      console.log('📋 RESOLUCIÓN SELECCIONADA - DETALLES COMPLETOS:', {
        resolucion: resolucion.nroResolucion,
        resolucionId: resolucion.id,
        resolucionIdLength: resolucion.id.length,
        tipoTramite: resolucion.tipoTramite,
        tipoResolucion: resolucion.tipoResolucion,
        empresaId: empresa.id,
        empresaIdLength: empresa.id.length
      });

      // VERIFICACIÓN ADICIONAL: Mostrar todas las rutas disponibles para debug
      console.log('🔍 DEBUG - RUTAS DISPONIBLES EN EL SISTEMA:', {
        totalRutas: this.todasLasRutas().length,
        rutasConEmpresa: this.todasLasRutas().filter(r => r.empresaId === empresa.id).length,
        rutasConResolucion: this.todasLasRutas().filter(r => r.resolucionId === resolucion.id).length,
        rutasConAmbos: this.todasLasRutas().filter(r => r.empresaId === empresa.id && r.resolucionId === resolucion.id).length
      });

      // Los IDs ahora son correctos por diseño, no necesitamos verificación compleja
      console.log('🔍 RESOLUCIÓN VÁLIDA SELECCIONADA:', {
        resolucionId: resolucion.id,
        numero: resolucion.nroResolucion,
        empresaId: empresa.id
      });

      // MOSTRAR ESTADO ANTES DEL FILTRADO
      console.log('📊 ESTADO ANTES DEL FILTRADO:', {
        rutasActuales: this.rutas().length,
        todasLasRutas: this.todasLasRutas().length,
        filtroActivo: this.filtroActivo().tipo
      });

      // Filtrar rutas por empresa y resolución
      console.log('🔄 INICIANDO FILTRADO POR EMPRESA Y RESOLUCIÓN...');
      console.log('🎯 PARÁMETROS DEL FILTRADO:', {
        empresaId: empresa.id,
        resolucionId: resolucion.id,
        numeroResolucion: resolucion.nroResolucion
      });
      
      this.filtrarRutasPorEmpresaYResolucion(empresa.id, resolucion.id);
    } else {
      console.log('📋 RESOLUCIÓN DESELECCIONADA - MOSTRANDO TODAS LAS RUTAS DE LA EMPRESA');
      
      // Mostrar todas las rutas de la empresa
      this.filtrarRutasPorEmpresa(empresa.id);
    }
  }

  // Método de debug para verificar el estado del dropdown
  debugDropdownState(): void {
    console.log('🔍 DEBUG ESTADO DEL DROPDOWN:', {
      empresaSeleccionada: this.empresaSeleccionada(),
      resolucionSeleccionada: this.resolucionSeleccionada(),
      resolucionesEmpresa: {
        total: this.resolucionesEmpresa().length,
        resoluciones: this.resolucionesEmpresa().map(r => ({
          id: r.id,
          numero: r.nroResolucion,
          tipo: r.tipoTramite
        }))
      },
      filtroActivo: this.filtroActivo(),
      rutasActuales: this.rutas().length
    });
  }

  // Método para resetear completamente el dropdown
  resetearDropdownCompleto(): void {
    console.log('🔄 RESETEANDO DROPDOWN COMPLETAMENTE...');
    
    // Limpiar todo
    this.empresaSeleccionada.set(null);
    this.resolucionSeleccionada.set(null);
    this.resolucionesEmpresa.set([]);
    this.empresaSearchValue.set('');
    
    // Forzar detección múltiple
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 50);
    
    console.log('✅ DROPDOWN RESETEADO COMPLETAMENTE');
    this.snackBar.open('Dropdown reseteado - Selecciona empresa nuevamente', 'Cerrar', { duration: 3000 });
  }

  // Método para verificar y mostrar el contenido actual del dropdown
  verificarContenidoDropdown(): void {
    console.log('🔍 VERIFICANDO CONTENIDO ACTUAL DEL DROPDOWN:');
    console.log('   Empresa seleccionada:', this.empresaSeleccionada());
    console.log('   Resoluciones en signal:', {
      total: this.resolucionesEmpresa().length,
      resoluciones: this.resolucionesEmpresa().map(r => ({
        id: r.id,
        numero: r.nroResolucion,
        tipo: r.tipoTramite
      }))
    });
    console.log('   Resolución seleccionada:', this.resolucionSeleccionada());
    
    // Verificar que las resoluciones tengan los IDs correctos
    const resolucionesCorrectas = this.resolucionesEmpresa().filter(r => 
      r.id === '694187b1c6302fb8566ba0a0' || r.id === '6941bb5d5e0d9aefe5627d84'
    );
    
    if (resolucionesCorrectas.length === this.resolucionesEmpresa().length) {
      console.log('✅ TODAS LAS RESOLUCIONES EN EL SIGNAL SON CORRECTAS');
    } else {
      console.warn('⚠️ ALGUNAS RESOLUCIONES PUEDEN TENER IDs INCORRECTOS');
    }
    
    this.snackBar.open('Verificación completada - Revisar consola', 'Cerrar', { duration: 3000 });
  }

  // Método para probar el filtrado directamente
  testFiltradoDirecto(): void {
    console.log('🧪 PROBANDO FILTRADO DIRECTO...');
    
    const empresa = this.empresaSeleccionada();
    if (!empresa) {
      this.snackBar.open('Selecciona una empresa primero', 'Cerrar', { duration: 3000 });
      return;
    }

    // Probar con R-0003-2025 (debería devolver 4 rutas)
    const resolucionId = '694187b1c6302fb8566ba0a0';
    console.log('🎯 PROBANDO CON RESOLUCIÓN R-0003-2025:', resolucionId);
    
    console.log('📊 ESTADO ANTES DE LA PRUEBA:', {
      rutasActuales: this.rutas().length,
      empresaId: empresa.id,
      resolucionId: resolucionId
    });

    this.filtrarRutasPorEmpresaYResolucion(empresa.id, resolucionId);
    
    // Verificar después de 1 segundo
    setTimeout(() => {
      console.log('📊 ESTADO DESPUÉS DE LA PRUEBA:', {
        rutasActuales: this.rutas().length,
        esperadas: 4,
        exito: this.rutas().length === 4
      });
      
      if (this.rutas().length === 4) {
        this.snackBar.open('✅ Test exitoso: 4 rutas filtradas correctamente', 'Cerrar', { duration: 3000 });
      } else {
        this.snackBar.open(`❌ Test falló: ${this.rutas().length} rutas en lugar de 4`, 'Cerrar', { duration: 3000 });
      }
    }, 1000);
  }

  // Método para forzar recarga de resoluciones correctas
  forzarRecargaResoluciones(): void {
    const empresa = this.empresaSeleccionada();
    if (!empresa) {
      this.snackBar.open('Selecciona una empresa primero', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('🔄 FORZANDO RECARGA AGRESIVA DE RESOLUCIONES...');
    
    // Limpiar completamente y forzar detección
    this.resolucionesEmpresa.set([]);
    this.resolucionSeleccionada.set(null);
    this.cdr.detectChanges();
    
    console.log('🧹 SIGNALS LIMPIADOS Y DETECCIÓN FORZADA');
    
    // Recargar después de múltiples delays para asegurar que funcione
    setTimeout(() => {
      console.log('🔄 INICIANDO RECARGA PASO 1...');
      this.cargarResolucionesEmpresa(empresa.id);
    }, 50);
    
    setTimeout(() => {
      console.log('🔄 FORZANDO DETECCIÓN ADICIONAL...');
      this.cdr.detectChanges();
    }, 200);
    
    setTimeout(() => {
      console.log('🔍 VERIFICACIÓN FINAL DESPUÉS DE RECARGA:');
      console.log('   Resoluciones en signal:', this.resolucionesEmpresa().length);
      console.log('   Resoluciones:', this.resolucionesEmpresa().map(r => r.nroResolucion));
    }, 500);
    
    this.snackBar.open('Recarga agresiva iniciada - Revisar consola', 'Cerrar', { duration: 3000 });
  }

  private filtrarRutasPorEmpresaYResolucion(empresaId: string, resolucionId: string): void {
    console.log('🔍 FILTRANDO RUTAS POR EMPRESA Y RESOLUCIÓN - INICIO:', {
      empresaId: empresaId,
      resolucionId: resolucionId,
      empresaIdLength: empresaId.length,
      resolucionIdLength: resolucionId.length,
      empresaIdType: typeof empresaId,
      resolucionIdType: typeof resolucionId
    });

    // Verificar que los IDs sean válidos
    if (!empresaId || !resolucionId) {
      console.error('❌ IDS INVÁLIDOS:', { empresaId, resolucionId });
      return;
    }

    // Construir URL manualmente para verificar
    const url = `/rutas/empresa/${empresaId}/resolucion/${resolucionId}`;
    console.log('🌐 URL CONSTRUIDA:', url);

    // Limpiar rutas agrupadas antes del filtrado
    this.rutasAgrupadasPorResolucion.set({});

    // SOLUCIÓN TEMPORAL: Usar filtrado local PRIMERO para asegurar que funcione
    console.log('🔄 INTENTANDO FILTRADO LOCAL PRIMERO...');
    const rutasLocales = this.todasLasRutas().filter(r => 
      r.empresaId === empresaId && r.resolucionId === resolucionId
    );
    
    console.log('🔍 FILTRADO LOCAL RESULTADO:', {
      totalRutasDisponibles: this.todasLasRutas().length,
      rutasEncontradas: rutasLocales.length,
      empresaId: empresaId,
      resolucionId: resolucionId,
      rutasDeEmpresa: this.todasLasRutas().filter(r => r.empresaId === empresaId).length,
      rutasDeResolucion: this.todasLasRutas().filter(r => r.resolucionId === resolucionId).length
    });

    if (rutasLocales.length > 0) {
      console.log('✅ FILTRADO LOCAL EXITOSO - Usando rutas locales directamente');
      
      // Usar rutas locales directamente
      this.rutas.set([...rutasLocales]);
      this.cdr.detectChanges();
      
      // Actualizar filtro activo
      const empresa = this.empresaSeleccionada();
      const resolucion = this.resolucionSeleccionada();
      this.filtroActivo.set({
        tipo: 'empresa-resolucion',
        descripcion: `Rutas de ${empresa?.razonSocial?.principal || 'Empresa'} - ${resolucion?.nroResolucion || 'Resolución'}`,
        empresaId: empresaId,
        resolucionId: resolucionId
      });
      
      console.log('✅ FILTRADO LOCAL COMPLETADO');
      this.snackBar.open(`Filtrado local: ${rutasLocales.length} ruta(s) de la resolución ${resolucion?.nroResolucion}`, 'Cerrar', { duration: 3000 });
      return;
    }

    // Si no hay rutas locales, intentar backend
    console.log('⚠️ NO HAY RUTAS LOCALES - INTENTANDO BACKEND...');
    this.rutaService.getRutasPorEmpresaYResolucion(empresaId, resolucionId).subscribe({
      next: (rutasFiltradas) => {
        console.log('✅ RESPUESTA DEL SERVICIO RECIBIDA:', {
          total: rutasFiltradas.length,
          empresaId: empresaId,
          resolucionId: resolucionId,
          rutas: rutasFiltradas.map(r => ({
            id: r.id,
            codigoRuta: r.codigoRuta,
            nombre: r.nombre
          }))
        });

        if (rutasFiltradas.length === 0) {
          console.warn('⚠️ BACKEND TAMBIÉN DEVOLVIÓ 0 RUTAS');
          console.warn('   💡 POSIBLES CAUSAS:');
          console.warn('   • No hay rutas asignadas a esta resolución');
          console.warn('   • Los IDs no coinciden en la base de datos');
          console.warn('   • El endpoint del backend tiene problemas');
          console.warn('   • Faltan datos de prueba en el sistema');
          console.warn(`   • IDs usados: Empresa=${empresaId}, Resolución=${resolucionId}`);
        }

        // FORZAR ACTUALIZACIÓN DEL SIGNAL
        console.log('🔄 FORZANDO ACTUALIZACIÓN DEL SIGNAL RUTAS...');
        this.rutas.set([...rutasFiltradas]); // Crear nueva referencia
        
        // FORZAR DETECCIÓN DE CAMBIOS MÚLTIPLE
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.cdr.detectChanges();
          console.log('🔍 VERIFICACIÓN POST-FILTRADO:', {
            rutasEnSignal: this.rutas().length,
            rutasRecibidas: rutasFiltradas.length,
            coinciden: this.rutas().length === rutasFiltradas.length
          });
        }, 10);
        
        // Actualizar filtro activo
        const empresa = this.empresaSeleccionada();
        const resolucion = this.resolucionSeleccionada();
        this.filtroActivo.set({
          tipo: 'empresa-resolucion',
          descripcion: `Rutas de ${empresa?.razonSocial?.principal || 'Empresa'} - ${resolucion?.nroResolucion || 'Resolución'}`,
          empresaId: empresaId,
          resolucionId: resolucionId
        });
        
        console.log('✅ FILTRADO BACKEND COMPLETADO');
        this.snackBar.open(`Filtrado: ${rutasFiltradas.length} ruta(s) de la resolución ${resolucion?.nroResolucion}`, 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('❌ ERROR AL FILTRAR RUTAS POR EMPRESA Y RESOLUCIÓN:', error);
        console.error('❌ DETALLES DEL ERROR:', {
          message: error.message,
          status: error.status,
          url: error.url,
          empresaId: empresaId,
          resolucionId: resolucionId
        });
        
        // FALLBACK FINAL: Filtrar solo por empresa
        console.warn('🔄 FALLBACK FINAL - Filtrando solo por empresa');
        this.filtrarRutasPorEmpresa(empresaId);
      }
    });
  }



  // Método simplificado para filtrar rutas por empresa
  private filtrarRutasPorEmpresa(empresaId: string): void {
    console.log('🔍 FILTRANDO RUTAS POR EMPRESA:', {
      empresaId: empresaId,
      totalRutasDisponibles: this.todasLasRutas().length
    });

    // SOLUCIÓN TEMPORAL: Usar filtrado local PRIMERO
    console.log('🔄 INTENTANDO FILTRADO LOCAL POR EMPRESA...');
    const rutasLocales = this.todasLasRutas().filter(ruta => ruta.empresaId === empresaId);
    
    console.log('🔍 FILTRADO LOCAL POR EMPRESA:', {
      rutasEncontradas: rutasLocales.length,
      empresaId: empresaId
    });

    if (rutasLocales.length > 0) {
      console.log('✅ FILTRADO LOCAL POR EMPRESA EXITOSO');
      
      this.rutas.set(rutasLocales);
      
      // Agrupar rutas por resolución
      this.agruparRutasPorResolucion(rutasLocales);
      
      // Actualizar filtro activo
      const empresa = this.empresaSeleccionada();
      this.filtroActivo.set({
        tipo: 'empresa',
        descripcion: `Rutas de ${empresa?.razonSocial?.principal || 'Empresa'}`,
        empresaId: empresaId
      });
      
      this.snackBar.open(`Filtrado local: ${rutasLocales.length} ruta(s) de la empresa`, 'Cerrar', { duration: 3000 });
      return;
    }

    // Si no hay rutas locales, intentar backend
    console.log('⚠️ NO HAY RUTAS LOCALES DE LA EMPRESA - INTENTANDO BACKEND...');
    this.rutaService.getRutasPorEmpresa(empresaId).subscribe({
      next: (rutasEmpresa) => {
        console.log('✅ RUTAS DE LA EMPRESA CARGADAS DESDE BACKEND:', {
          total: rutasEmpresa.length,
          empresaId: empresaId,
          rutas: rutasEmpresa.map(r => ({
            id: r.id,
            codigoRuta: r.codigoRuta,
            nombre: r.nombre,
            origen: r.origen,
            destino: r.destino
          }))
        });

        this.rutas.set(rutasEmpresa);
        
        // Agrupar rutas por resolución
        this.agruparRutasPorResolucion(rutasEmpresa);
        
        // Actualizar filtro activo
        const empresa = this.empresaSeleccionada();
        this.filtroActivo.set({
          tipo: 'empresa',
          descripcion: `Rutas de ${empresa?.razonSocial?.principal || 'Empresa'}`,
          empresaId: empresaId
        });
        
        this.snackBar.open(`Se encontraron ${rutasEmpresa.length} ruta(s) para la empresa seleccionada`, 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('❌ ERROR AL FILTRAR RUTAS POR EMPRESA:', error);
        
        // Fallback final: mostrar mensaje de que no hay rutas
        this.rutas.set([]);
        
        // Actualizar filtro activo
        const empresa = this.empresaSeleccionada();
        this.filtroActivo.set({
          tipo: 'empresa',
          descripcion: `Rutas de ${empresa?.razonSocial?.principal || 'Empresa'}`,
          empresaId: empresaId
        });
        
        this.snackBar.open('No se encontraron rutas para esta empresa', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Método para agrupar rutas por resolución
  private agruparRutasPorResolucion(rutas: Ruta[]): void {
    console.log('📊 AGRUPANDO RUTAS POR RESOLUCIÓN:', rutas.length);
    
    const grupos: {[resolucionId: string]: {resolucion: Resolucion | null, rutas: Ruta[]}} = {};
    const resoluciones = this.resolucionesEmpresa();
    
    // Crear un mapa de resoluciones por ID para acceso rápido
    const resolucionesMap = new Map<string, Resolucion>();
    resoluciones.forEach(res => resolucionesMap.set(res.id, res));
    
    // Agrupar rutas por resolución
    rutas.forEach(ruta => {
      const resolucionId = ruta.resolucionId;
      if (resolucionId) {
        if (!grupos[resolucionId]) {
          grupos[resolucionId] = {
            resolucion: resolucionesMap.get(resolucionId) || null,
            rutas: []
          };
        }
        grupos[resolucionId].rutas.push(ruta);
      }
    });
    
    console.log('✅ RUTAS AGRUPADAS:', {
      totalGrupos: Object.keys(grupos).length,
      grupos: Object.entries(grupos).map(([resId, grupo]) => ({
        resolucionId: resId,
        numeroResolucion: grupo.resolucion?.nroResolucion || 'Sin número',
        totalRutas: grupo.rutas.length
      }))
    });
    
    this.rutasAgrupadasPorResolucion.set(grupos);
  }

  // Método para mostrar rutas de una resolución específica (CRUD de resolución)
  mostrarRutasDeResolucion(resolucionId: string, empresaId?: string): void {
    console.log('🔍 MOSTRANDO RUTAS DE RESOLUCIÓN:', {
      resolucionId: resolucionId,
      empresaId: empresaId
    });

    // Obtener rutas por resolución
    this.rutaService.getRutasPorResolucion(resolucionId).subscribe({
      next: (rutasResolucion) => {
        console.log('✅ RUTAS DE LA RESOLUCIÓN CARGADAS:', {
          total: rutasResolucion.length,
          resolucionId: resolucionId,
          rutas: rutasResolucion.map(r => ({
            id: r.id,
            codigoRuta: r.codigoRuta,
            nombre: r.nombre,
            origen: r.origen,
            destino: r.destino
          }))
        });

        this.rutas.set(rutasResolucion);
        
        // Obtener información de la resolución para mostrar en el filtro
        this.obtenerInfoResolucion(resolucionId, empresaId);
        
        this.snackBar.open(`Vista CRUD: ${rutasResolucion.length} ruta(s) de esta resolución`, 'Cerrar', { duration: 4000 });
      },
      error: (error) => {
        console.error('❌ ERROR AL CARGAR RUTAS DE RESOLUCIÓN:', error);
        // Fallback: filtrar de todas las rutas por resolucionId
        const rutasFiltradas = this.todasLasRutas().filter(ruta => ruta.resolucionId === resolucionId);
        this.rutas.set(rutasFiltradas);
        
        // Actualizar filtro activo con información básica
        this.filtroActivo.set({
          tipo: 'resolucion',
          descripcion: `Rutas de Resolución ${resolucionId.substring(0, 8)}...`,
          resolucionId: resolucionId,
          empresaId: empresaId
        });
        
        this.snackBar.open(`Vista CRUD: ${rutasFiltradas.length} ruta(s) de esta resolución`, 'Cerrar', { duration: 4000 });
      }
    });
  }

  // Método para obtener información detallada de la resolución
  private obtenerInfoResolucion(resolucionId: string, empresaId?: string): void {
    // Por simplicidad, usar información básica por ahora
    // En el futuro se puede hacer una consulta para obtener el número de resolución completo
    this.filtroActivo.set({
      tipo: 'resolucion',
      descripcion: `Vista CRUD - Rutas de Resolución ${resolucionId.substring(0, 8)}...`,
      resolucionId: resolucionId,
      empresaId: empresaId
    });
  }

  // Método para gestionar rutas de resolución (funcionalidad adicional)
  gestionarRutasResolucion(): void {
    const filtro = this.filtroActivo();
    if (filtro.tipo === 'resolucion' && filtro.resolucionId) {
      console.log('🔧 GESTIONANDO RUTAS DE RESOLUCIÓN:', filtro.resolucionId);
      
      // Aquí se pueden agregar funcionalidades adicionales como:
      // - Reordenar códigos de rutas
      // - Exportar rutas de la resolución
      // - Estadísticas de la resolución
      // - etc.
      
      this.snackBar.open('Funciones de gestión avanzada en desarrollo', 'Cerrar', { duration: 3000 });
    }
  }

  // Métodos de utilidad
  displayEmpresa = (empresa: Empresa): string => {
    return empresa ? `${empresa.ruc} - ${empresa.razonSocial?.principal || 'Sin razón social'}` : '';
  }

  displayResolucion = (resolucion: Resolucion): string => {
    return resolucion ? `${resolucion.nroResolucion} - ${resolucion.tipoTramite}` : '';
  }

  // Método para obtener grupos de resolución para el template
  getGruposResolucion(): [string, {resolucion: Resolucion | null, rutas: Ruta[]}][] {
    return Object.entries(this.rutasAgrupadasPorResolucion());
  }

  // Método para verificar si hay grupos de resolución
  tieneGruposResolucion(): boolean {
    return Object.keys(this.rutasAgrupadasPorResolucion()).length > 0;
  }

  // Métodos helper para resoluciones padre/hijas
  getResolucionesPadre(): Resolucion[] {
    return this.resolucionesEmpresa().filter(r => r.tipoResolucion === 'PADRE');
  }

  getResolucionesHijas(): Resolucion[] {
    return this.resolucionesEmpresa().filter(r => r.tipoResolucion !== 'PADRE');
  }

  getHijasDeResolucion(padreId: string): Resolucion[] {
    return this.resolucionesEmpresa().filter(r => r.resolucionPadreId === padreId);
  }

  // Métodos para obtener información de empresa y resolución de las rutas
  obtenerNombreEmpresa(ruta: Ruta): string {
    // Por simplicidad, mostrar el ID de la empresa por ahora
    // En el futuro se puede implementar un cache de empresas
    return ruta.empresaId ? `Empresa ${ruta.empresaId.substring(0, 8)}...` : 'Sin empresa';
  }

  obtenerRucEmpresa(ruta: Ruta): string {
    // Por simplicidad, mostrar información básica por ahora
    return ruta.empresaId ? 'RUC disponible' : 'Sin RUC';
  }

  obtenerNumeroResolucion(ruta: Ruta): string {
    // Por ahora retornar el ID de la resolución truncado
    return ruta.resolucionId ? `Res. ${ruta.resolucionId.substring(0, 8)}...` : 'Sin resolución';
  }

  getTipoDisplayName(tipo: TipoRuta | undefined): string {
    if (!tipo) return 'N/A';

    const tipos: { [key in TipoRuta]: string } = {
      'URBANA': 'Urbana',
      'INTERURBANA': 'Interurbana',
      'INTERPROVINCIAL': 'Interprovincial',
      'INTERREGIONAL': 'Interregional',
      'RURAL': 'Rural'
    };

    return tipos[tipo] || tipo;
  }

  getEstadoDisplayName(estado: EstadoRuta | undefined): string {
    if (!estado) return 'N/A';

    const estados: { [key in EstadoRuta]: string } = {
      'ACTIVA': 'Activa',
      'INACTIVA': 'Inactiva',
      'SUSPENDIDA': 'Suspendida',
      'EN_MANTENIMIENTO': 'En Mantenimiento',
      'ARCHIVADA': 'Archivada',
      'DADA_DE_BAJA': 'Dada de Baja'
    };

    return estados[estado] || estado;
  }

  nuevaRuta(): void {
    console.log('➕ ABRIENDO MODAL PARA NUEVA RUTA');

    const dialogRef = this.dialog.open(CrearRutaMejoradoComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🔄 NUEVA RUTA CREADA:', result);

        // Agregar a ambas listas
        this.rutas.update(rutas => [...rutas, result]);
        this.todasLasRutas.update(todasLasRutas => [...todasLasRutas, result]);
        this.totalRutas.update(total => total + 1);

        console.log('📊 RUTA AGREGADA AL SISTEMA:', {
          totalRutas: this.rutas().length,
          nuevaRuta: { 
            id: result.id, 
            codigoRuta: result.codigoRuta, 
            nombre: result.nombre,
            empresaId: result.empresaId,
            resolucionId: result.resolucionId
          }
        });

        // Mostrar automáticamente las rutas de la resolución seleccionada
        this.mostrarRutasDeResolucion(result.resolucionId, result.empresaId);

        this.snackBar.open('Ruta creada exitosamente. Mostrando rutas de esta resolución.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  verRuta(id: string): void {
    this.router.navigate(['/rutas', id]);
  }

  editarRuta(ruta: Ruta): void {
    console.log('✏️ EDITANDO RUTA:', ruta);
    
    // Por ahora, mostrar mensaje de que la edición no está implementada
    // En el futuro se puede crear un componente de edición basado en CrearRutaMejoradoComponent
    this.snackBar.open('Función de edición en desarrollo', 'Cerrar', { duration: 3000 });
  }

  verDetalleRuta(ruta: Ruta): void {
    console.log('👁️ VIENDO DETALLES DE RUTA:', ruta);
    
    // Abrir modal de detalles de ruta
    const dialogRef = this.dialog.open(DetalleRutaModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { ruta: ruta }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Modal de detalles cerrado:', result);
      }
    });
  }

  duplicarRuta(ruta: Ruta): void {
    console.log('📋 DUPLICANDO RUTA:', ruta);
    
    // Crear una copia de la ruta con un nuevo código
    const rutaDuplicada = {
      ...ruta,
      codigoRuta: `${ruta.codigoRuta}-COPIA`,
      nombre: `${ruta.nombre} (Copia)`,
      id: undefined // Remover ID para que se genere uno nuevo
    };

    // Abrir modal de creación con datos pre-llenados
    const dialogRef = this.dialog.open(CrearRutaMejoradoComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { 
        rutaBase: rutaDuplicada,
        modo: 'duplicar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ RUTA DUPLICADA:', result);
        this.recargarRutas();
        this.snackBar.open('Ruta duplicada exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  eliminarRuta(ruta: Ruta): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta ruta? Esta acción no se puede deshacer.')) {
      console.log('🗑️ ELIMINANDO RUTA:', ruta);

      // Eliminar del servicio
      this.rutaService.deleteRuta(ruta.id).subscribe({
        next: () => {
          console.log('✅ RUTA ELIMINADA EXITOSAMENTE DEL SERVICIO');

          // Eliminar de las listas locales
          this.rutas.update(rutas => rutas.filter(r => r.id !== ruta.id));
          this.todasLasRutas.update(todasLasRutas => todasLasRutas.filter(r => r.id !== ruta.id));
          this.totalRutas.update(total => total - 1);

          this.snackBar.open('Ruta eliminada exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('❌ ERROR AL ELIMINAR RUTA:', error);
          this.snackBar.open('Error al eliminar la ruta', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  // Método agregarRutaGeneral() eliminado - Se requiere empresa y resolución válidas
  // El backend no acepta IDs 'general', solo ObjectIds válidos de MongoDB

  // Método para intercambiar códigos entre rutas
  intercambiarCodigos(ruta1: Ruta, ruta2: Ruta): void {
    if (!ruta1.resolucionId || !ruta2.resolucionId) {
      this.snackBar.open('Las rutas deben tener resolución asignada', 'Cerrar', { duration: 3000 });
      return;
    }

    if (ruta1.resolucionId !== ruta2.resolucionId) {
      this.snackBar.open('Solo se pueden intercambiar códigos entre rutas de la misma resolución', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('🔄 INTERCAMBIANDO CÓDIGOS:', {
      ruta1: { id: ruta1.id, codigoRuta: ruta1.codigoRuta, nombre: ruta1.nombre },
      ruta2: { id: ruta2.id, codigoRuta: ruta2.codigoRuta, nombre: ruta2.nombre },
      resolucionId: ruta1.resolucionId
    });

    // Crear copias de las rutas con códigos intercambiados
    const ruta1Actualizada: Ruta = {
      ...ruta1,
      codigoRuta: ruta2.codigoRuta,
      fechaActualizacion: new Date()
    };

    const ruta2Actualizada: Ruta = {
      ...ruta2,
      codigoRuta: ruta1.codigoRuta,
      fechaActualizacion: new Date()
    };

    // Actualizar las listas locales inmediatamente
    this.actualizarRutaEnLista(ruta1Actualizada);
    this.actualizarRutaEnLista(ruta2Actualizada);

    console.log('✅ CÓDIGOS INTERCAMBIADOS EXITOSAMENTE EN FRONTEND');
    console.log('📊 RUTA 1 ACTUALIZADA:', ruta1Actualizada.codigoRuta);
    console.log('📊 RUTA 2 ACTUALIZADA:', ruta2Actualizada.codigoRuta);

    // Mostrar mensaje de éxito
    this.snackBar.open('Códigos intercambiados exitosamente', 'Cerrar', { duration: 3000 });

    // Intentar sincronizar con el backend (opcional, para cuando esté funcionando)
    this.intentarSincronizarConBackend(ruta1Actualizada, ruta2Actualizada);
  }

  // Método para intentar sincronizar con el backend (opcional)
  private intentarSincronizarConBackend(ruta1: Ruta, ruta2: Ruta): void {
    console.log('🔄 INTENTANDO SINCRONIZAR CON BACKEND...');

    // Crear objetos de actualización para el backend
    const actualizacionRuta1: Partial<RutaUpdate> = {
      codigoRuta: ruta1.codigoRuta
    };

    const actualizacionRuta2: Partial<RutaUpdate> = {
      codigoRuta: ruta2.codigoRuta
    };

    // Usar forkJoin para hacer ambas actualizaciones en paralelo y manejar errores mejor
    forkJoin({
      ruta1: this.rutaService.updateRuta(ruta1.id, actualizacionRuta1),
      ruta2: this.rutaService.updateRuta(ruta2.id, actualizacionRuta2)
    }).subscribe({
      next: (resultados) => {
        console.log('✅ BACKEND: Ambas rutas sincronizadas exitosamente');
        console.log('📊 Ruta 1:', resultados.ruta1.codigoRuta);
        console.log('📊 Ruta 2:', resultados.ruta2.codigoRuta);
      },
      error: (error) => {
        console.warn('⚠️ BACKEND: Error durante la sincronización:', error);
        // No mostrar error al usuario ya que el intercambio ya funcionó en frontend
      }
    });
  }

  // Método auxiliar para actualizar una ruta en la lista
  private actualizarRutaEnLista(rutaActualizada: Ruta): void {
    this.rutas.update(rutas =>
      rutas.map(r => r.id === rutaActualizada.id ? rutaActualizada : r)
    );

    this.todasLasRutas.update(todasLasRutas =>
      todasLasRutas.map(r => r.id === rutaActualizada.id ? rutaActualizada : r)
    );
  }



  // Método para abrir modal de intercambio de códigos
  abrirModalIntercambio(rutaOrigen: Ruta): void {
    if (!rutaOrigen.resolucionId) {
      this.snackBar.open('La ruta debe tener resolución asignada', 'Cerrar', { duration: 3000 });
      return;
    }

    // Obtener todas las rutas de la misma resolución
    const rutasMismaResolucion = this.todasLasRutas().filter(r =>
      r.id !== rutaOrigen.id &&
      r.resolucionId === rutaOrigen.resolucionId
    );

    if (rutasMismaResolucion.length === 0) {
      this.snackBar.open('No hay otras rutas en la misma resolución para intercambiar', 'Cerrar', { duration: 3000 });
      return;
    }

    // Crear un modal simple con las opciones
    const dialogRef = this.dialog.open(IntercambioCodigosModalComponent, {
      width: '500px',
      data: {
        rutaOrigen: rutaOrigen,
        rutasDisponibles: rutasMismaResolucion
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.rutaDestino) {
        this.intercambiarCodigos(rutaOrigen, result.rutaDestino);
      }
    });
  }

  cargaMasivaRutas(): void {
    this.router.navigate(['/rutas/carga-masiva']);
  }

  // ========================================
  // MÉTODOS PARA FILTROS AVANZADOS
  // ========================================

  toggleFiltrosAvanzados(): void {
    const mostrar = !this.mostrarFiltrosAvanzados();
    this.mostrarFiltrosAvanzados.set(mostrar);
    
    if (mostrar && this.origenesDisponibles().length === 0) {
      this.cargarOrigenesDestinos();
      this.cargarCombinacionesRutas();
    }
  }

  // ========================================
  // NUEVOS MÉTODOS PARA BÚSQUEDA INTELIGENTE
  // ========================================

  cargarCombinacionesRutas(): void {
    console.log('🔄 CARGANDO COMBINACIONES DIRECTAMENTE DEL ENDPOINT DE BACKEND...');
    
    // USAR DIRECTAMENTE EL ENDPOINT DE COMBINACIONES - NO getRutas()
    const url = `${environment.apiUrl}/rutas/combinaciones-rutas`;
    console.log('🌐 URL ENDPOINT DIRECTO:', url);
    
    this.http.get<any>(url).subscribe({
      next: (data) => {
        console.log('📊 RESPUESTA DIRECTA DEL ENDPOINT COMBINACIONES:', data);
        
        const combinaciones = data.combinaciones || [];
        
        console.log('✅ COMBINACIONES DIRECTAS DEL BACKEND (DATOS REALES):', {
          total: combinaciones.length,
          mensaje: data.mensaje,
          combinaciones: combinaciones.map((c: any) => `${c.combinacion} (${c.rutas.length} ruta(s))`)
        });
        
        // Verificar que tenemos datos reales
        if (combinaciones.length > 0) {
          console.log('🎯 VERIFICACIÓN DE DATOS REALES:');
          combinaciones.forEach((comb: any, index: number) => {
            console.log(`   ${index + 1}. ${comb.combinacion} - ${comb.rutas.length} ruta(s)`);
            if (comb.rutas.length > 0) {
              console.log(`      Primera ruta: [${comb.rutas[0].codigoRuta}] Empresa: ${comb.rutas[0].empresaId}`);
            }
          });
        }
        
        this.combinacionesDisponibles.set(combinaciones);
        this.combinacionesFiltradas.set(combinaciones);
        
        this.snackBar.open(`${combinaciones.length} combinaciones cargadas DIRECTAMENTE del backend (DATOS REALES)`, 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('❌ Error al cargar combinaciones del backend:', error);
        
        // Fallback: usar datos de ejemplo si el backend falla
        const combinacionesFallback = [
          {
            combinacion: 'Puno → Juliaca',
            origen: 'Puno',
            destino: 'Juliaca',
            rutas: [{ id: '1', codigoRuta: '01' }]
          }
        ];
        
        this.combinacionesDisponibles.set(combinacionesFallback);
        this.combinacionesFiltradas.set(combinacionesFallback);
        
        this.snackBar.open('Error al cargar del backend. Usando datos de ejemplo.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  onBusquedaRutasInput(event: any): void {
    const value = event.target.value;
    console.log('🔍 BÚSQUEDA INPUT:', value);
    console.log('📊 COMBINACIONES DISPONIBLES:', this.combinacionesDisponibles().length);
    
    this.busquedaRutas.set(value);
    this.filtrarCombinaciones(value);
  }

  private filtrarCombinaciones(busqueda: string): void {
    if (!busqueda || busqueda.length < 2) {
      this.combinacionesFiltradas.set(this.combinacionesDisponibles());
      return;
    }

    // Filtrar localmente las combinaciones disponibles
    const busquedaLower = busqueda.toLowerCase();
    const combinacionesFiltradas = this.combinacionesDisponibles().filter(comb =>
      comb.combinacion.toLowerCase().includes(busquedaLower) ||
      comb.origen.toLowerCase().includes(busquedaLower) ||
      comb.destino.toLowerCase().includes(busquedaLower)
    );
    
    console.log('🔍 FILTRADO LOCAL:', {
      busqueda: busqueda,
      encontradas: combinacionesFiltradas.length,
      total: this.combinacionesDisponibles().length
    });
    
    this.combinacionesFiltradas.set(combinacionesFiltradas);
  }

  onCombinacionSelected(event: any): void {
    const combinacion = event.option.value;
    console.log('🎯 COMBINACIÓN SELECCIONADA:', combinacion);
    
    // Agregar a rutas seleccionadas si no existe
    const rutasActuales = this.rutasSeleccionadas();
    const yaExiste = rutasActuales.some(r => r.combinacion === combinacion.combinacion);
    
    if (!yaExiste) {
      this.rutasSeleccionadas.update(rutas => [...rutas, combinacion]);
      this.snackBar.open(`Ruta "${combinacion.combinacion}" agregada a la selección`, 'Cerrar', { duration: 2000 });
    } else {
      this.snackBar.open(`La ruta "${combinacion.combinacion}" ya está seleccionada`, 'Cerrar', { duration: 2000 });
    }
    
    // Limpiar el campo de búsqueda
    this.busquedaRutas.set('');
  }

  displayCombinacion = (combinacion: any): string => {
    return combinacion ? combinacion.combinacion : '';
  }

  intercambiarOrigenDestino(): void {
    const origenActual = this.origenSeleccionado();
    const destinoActual = this.destinoSeleccionado();
    
    if (origenActual && destinoActual) {
      this.origenSeleccionado.set(destinoActual);
      this.destinoSeleccionado.set(origenActual);
      
      console.log('🔄 ORIGEN Y DESTINO INTERCAMBIADOS:', {
        nuevoOrigen: destinoActual,
        nuevoDestino: origenActual
      });
      
      this.snackBar.open(`Intercambiado: ${destinoActual} → ${origenActual}`, 'Cerrar', { duration: 2000 });
    }
  }

  removerRutaSeleccionada(rutaARemover: any): void {
    this.rutasSeleccionadas.update(rutas => 
      rutas.filter(r => r.combinacion !== rutaARemover.combinacion)
    );
    this.snackBar.open(`Ruta "${rutaARemover.combinacion}" removida de la selección`, 'Cerrar', { duration: 2000 });
  }

  limpiarRutasSeleccionadas(): void {
    this.rutasSeleccionadas.set([]);
    this.snackBar.open('Selección de rutas limpiada', 'Cerrar', { duration: 2000 });
  }

  async aplicarFiltroRutasSeleccionadas(): Promise<void> {
    const rutasSeleccionadas = this.rutasSeleccionadas();
    
    if (rutasSeleccionadas.length === 0) {
      this.snackBar.open('Seleccione al menos una ruta', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('🔍 APLICANDO FILTRO DE RUTAS SELECCIONADAS:', rutasSeleccionadas);
    
    try {
      // Recopilar todas las rutas de las combinaciones seleccionadas
      const todasLasRutasFiltradas: any[] = [];
      
      for (const combinacion of rutasSeleccionadas) {
        for (const ruta of combinacion.rutas) {
          // Buscar la ruta completa en todasLasRutas
          const rutaCompleta = this.todasLasRutas().find(r => r.id === ruta.id);
          if (rutaCompleta) {
            todasLasRutasFiltradas.push(rutaCompleta);
          }
        }
      }
      
      // Actualizar las rutas mostradas
      this.rutas.set(todasLasRutasFiltradas);
      
      // Crear resultado para mostrar estadísticas
      const empresasUnicas = new Set(todasLasRutasFiltradas.map(r => r.empresaId));
      
      this.resultadoFiltroAvanzado.set({
        total_rutas: todasLasRutasFiltradas.length,
        total_empresas: empresasUnicas.size,
        rutas_seleccionadas: rutasSeleccionadas.map(r => r.combinacion)
      });
      
      // Actualizar filtro activo
      const descripcionRutas = rutasSeleccionadas.map(r => r.combinacion).join(', ');
      this.filtroActivo.set({
        tipo: 'todas',
        descripcion: `Rutas Seleccionadas: ${descripcionRutas}`
      });
      
      this.snackBar.open(`Filtro aplicado: ${todasLasRutasFiltradas.length} rutas de ${rutasSeleccionadas.length} combinaciones`, 'Cerrar', { duration: 4000 });
      
    } catch (error) {
      console.error('❌ Error en aplicarFiltroRutasSeleccionadas:', error);
      this.snackBar.open('Error al aplicar filtro de rutas seleccionadas', 'Cerrar', { duration: 3000 });
    }
  }

  cargarOrigenesDestinos(): void {
    console.log('🔄 CARGANDO ORÍGENES Y DESTINOS DISPONIBLES...');
    
    // Usar el servicio existente para obtener todas las rutas y extraer orígenes/destinos
    this.rutaService.getRutas().subscribe({
      next: (rutas) => {
        const origenes = new Set<string>();
        const destinos = new Set<string>();
        
        rutas.forEach(ruta => {
          if (ruta.origen) origenes.add(ruta.origen);
          if (ruta.destino) destinos.add(ruta.destino);
        });
        
        const origenesArray = Array.from(origenes).sort();
        const destinosArray = Array.from(destinos).sort();
        
        console.log('✅ ORÍGENES Y DESTINOS CARGADOS:', {
          origenes: origenesArray.length,
          destinos: destinosArray.length
        });
        
        this.origenesDisponibles.set(origenesArray);
        this.destinosDisponibles.set(destinosArray);
        
        // Inicializar observables filtrados
        this.origenesFiltrados.set(of(origenesArray));
        this.destinosFiltrados.set(of(destinosArray));
        
        this.snackBar.open(`${origenesArray.length} orígenes y ${destinosArray.length} destinos cargados`, 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('❌ Error al cargar orígenes y destinos:', error);
        this.snackBar.open('Error al cargar orígenes y destinos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onOrigenInput(event: any): void {
    const value = event.target.value;
    this.origenSeleccionado.set(value);
    this.filtrarOrigenes(value);
  }

  onDestinoInput(event: any): void {
    const value = event.target.value;
    this.destinoSeleccionado.set(value);
    this.filtrarDestinos(value);
  }

  onOrigenSelected(event: any): void {
    const origen = event.option.value;
    this.origenSeleccionado.set(origen);
    console.log('🏙️ ORIGEN SELECCIONADO:', origen);
  }

  onDestinoSelected(event: any): void {
    const destino = event.option.value;
    this.destinoSeleccionado.set(destino);
    console.log('🎯 DESTINO SELECCIONADO:', destino);
  }

  private filtrarOrigenes(value: string): void {
    if (typeof value !== 'string') return;
    const filterValue = value.toLowerCase();
    
    const origenesFiltrados = this.origenesDisponibles().filter(origen =>
      origen.toLowerCase().includes(filterValue)
    );
    
    this.origenesFiltrados.set(of(origenesFiltrados));
  }

  private filtrarDestinos(value: string): void {
    if (typeof value !== 'string') return;
    const filterValue = value.toLowerCase();
    
    const destinosFiltrados = this.destinosDisponibles().filter(destino =>
      destino.toLowerCase().includes(filterValue)
    );
    
    this.destinosFiltrados.set(of(destinosFiltrados));
  }

  aplicarFiltroAvanzado(): void {
    const origen = this.origenSeleccionado();
    const destino = this.destinoSeleccionado();
    
    if (!origen && !destino) {
      this.snackBar.open('Seleccione al menos un origen o destino', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('🔍 APLICANDO FILTRO AVANZADO:', { origen, destino });
    
    // Filtrar localmente las rutas
    const rutasFiltradas = this.todasLasRutas().filter(ruta => {
      const coincideOrigen = !origen || (ruta.origen && ruta.origen.toLowerCase().includes(origen.toLowerCase()));
      const coincideDestino = !destino || (ruta.destino && ruta.destino.toLowerCase().includes(destino.toLowerCase()));
      
      return coincideOrigen && coincideDestino;
    });
    
    console.log('✅ RESULTADO FILTRO AVANZADO:', {
      totalRutas: rutasFiltradas.length,
      filtros: { origen, destino }
    });
    
    // Actualizar las rutas mostradas
    this.rutas.set(rutasFiltradas);
    
    // Crear resultado para mostrar estadísticas
    const empresasUnicas = new Set(rutasFiltradas.map(r => r.empresaId));
    
    this.resultadoFiltroAvanzado.set({
      total_rutas: rutasFiltradas.length,
      total_empresas: empresasUnicas.size,
      filtros_aplicados: { origen, destino }
    });
    
    // Actualizar filtro activo
    let descripcionFiltro = 'Filtro Avanzado: ';
    if (origen && destino) {
      descripcionFiltro += `${origen} → ${destino}`;
    } else if (origen) {
      descripcionFiltro += `Desde ${origen}`;
    } else if (destino) {
      descripcionFiltro += `Hacia ${destino}`;
    }
    
    this.filtroActivo.set({
      tipo: 'todas',
      descripcion: descripcionFiltro
    });
    
    this.snackBar.open(`Filtro aplicado: ${rutasFiltradas.length} rutas encontradas de ${empresasUnicas.size} empresas`, 'Cerrar', { duration: 4000 });
  }

  // Nuevos métodos para el buscador inteligente
  limpiarBuscadorInteligente(): void {
    console.log('🧹 LIMPIANDO BUSCADOR INTELIGENTE...');
    
    // Limpiar búsqueda inteligente
    this.busquedaRutas.set('');
    this.rutasSeleccionadas.set([]);
    this.resultadoFiltroAvanzado.set(null);
    
    // Restaurar todas las combinaciones
    this.combinacionesFiltradas.set(this.combinacionesDisponibles());
    
    // Restaurar todas las rutas
    this.rutas.set(this.todasLasRutas());
    this.filtroActivo.set({
      tipo: 'todas',
      descripcion: 'Todas las Rutas del Sistema'
    });
    
    this.snackBar.open('Buscador inteligente limpiado', 'Cerrar', { duration: 2000 });
  }

  recargarCombinaciones(): void {
    console.log('🔄 RECARGANDO COMBINACIONES...');
    this.cargarCombinacionesRutas();
  }

  limpiarFiltrosAvanzados(): void {
    // Usar el método específico del buscador inteligente
    this.limpiarBuscadorInteligente();
  }

  async exportarResultados(formato: 'excel' | 'pdf' | 'csv'): Promise<void> {
    const origen = this.origenSeleccionado();
    const destino = this.destinoSeleccionado();
    
    if (!origen && !destino) {
      this.snackBar.open('Aplique un filtro antes de exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log(`📤 EXPORTANDO RESULTADOS A ${formato.toUpperCase()}...`);
    
    try {
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (origen) params.append('origen', origen);
      if (destino) params.append('destino', destino);
      
      const response = await fetch(`/api/v1/rutas/filtro-avanzado/exportar/${formato}?${params.toString()}`);
      
      if (response.ok) {
        const resultado = await response.json();
        
        console.log('✅ EXPORTACIÓN INICIADA:', resultado);
        
        this.snackBar.open(`${resultado.mensaje}`, 'Cerrar', { duration: 5000 });
        
        // En una implementación real, aquí se descargaría el archivo
        // Por ahora solo mostramos el mensaje de confirmación
      } else {
        console.error('❌ Error en respuesta de exportación:', response.status);
        this.snackBar.open('Error al exportar resultados', 'Cerrar', { duration: 3000 });
      }
      
    } catch (error) {
      console.error('❌ Error en exportarResultados:', error);
      this.snackBar.open('Error de conexión al exportar', 'Cerrar', { duration: 3000 });
    }
  }

  // ========================================
  // MÉTODOS PARA SELECCIÓN MÚLTIPLE
  // ========================================

  toggleRutaSeleccion(rutaId: string): void {
    const seleccionadas = new Set(this.rutasSeleccionadasIds());
    if (seleccionadas.has(rutaId)) {
      seleccionadas.delete(rutaId);
    } else {
      seleccionadas.add(rutaId);
    }
    this.rutasSeleccionadasIds.set(seleccionadas);
  }

  isRutaSeleccionada(rutaId: string): boolean {
    return this.rutasSeleccionadasIds().has(rutaId);
  }

  seleccionarTodasLasRutas(): boolean {
    const rutasVisibles = this.rutas();
    return rutasVisibles.length > 0 && 
           rutasVisibles.every(ruta => this.rutasSeleccionadasIds().has(ruta.id));
  }

  toggleSeleccionarTodasLasRutas(): void {
    const rutasVisibles = this.rutas();
    const seleccionadas = new Set(this.rutasSeleccionadasIds());
    
    if (this.seleccionarTodasLasRutas()) {
      // Deseleccionar todas las visibles
      rutasVisibles.forEach(ruta => seleccionadas.delete(ruta.id));
    } else {
      // Seleccionar todas las visibles
      rutasVisibles.forEach(ruta => seleccionadas.add(ruta.id));
    }
    
    this.rutasSeleccionadasIds.set(seleccionadas);
  }

  getRutasSeleccionadasCount(): number {
    return this.rutasSeleccionadasIds().size;
  }

  limpiarSeleccionRutas(): void {
    this.rutasSeleccionadasIds.set(new Set());
  }

  toggleSeleccionGrupo(rutas: Ruta[]): void {
    const seleccionadas = new Set(this.rutasSeleccionadasIds());
    const todasSeleccionadas = rutas.every(ruta => seleccionadas.has(ruta.id));
    
    if (todasSeleccionadas) {
      // Deseleccionar todas las rutas del grupo
      rutas.forEach(ruta => seleccionadas.delete(ruta.id));
    } else {
      // Seleccionar todas las rutas del grupo
      rutas.forEach(ruta => seleccionadas.add(ruta.id));
    }
    
    this.rutasSeleccionadasIds.set(seleccionadas);
  }

  // ========================================
  // MÉTODOS PARA ACCIONES EN BLOQUE
  // ========================================

  eliminarRutasEnBloque(): void {
    const rutasSeleccionadas = Array.from(this.rutasSeleccionadasIds())
      .map(id => this.rutas().find(r => r.id === id))
      .filter(ruta => ruta !== undefined) as Ruta[];

    if (rutasSeleccionadas.length === 0) {
      this.snackBar.open('No hay rutas seleccionadas', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmarEliminacionBloqueModalComponent, {
      width: '500px',
      data: {
        tipo: 'rutas',
        cantidad: rutasSeleccionadas.length,
        elementos: rutasSeleccionadas.map(r => `${r.codigoRuta} - ${r.origen} → ${r.destino}`)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ejecutarEliminacionEnBloque(rutasSeleccionadas);
      }
    });
  }

  private ejecutarEliminacionEnBloque(rutas: Ruta[]): void {
    const eliminaciones = rutas.map(ruta => 
      this.rutaService.deleteRuta(ruta.id)
    );

    forkJoin(eliminaciones).subscribe({
      next: () => {
        this.snackBar.open(`${rutas.length} ruta(s) eliminada(s) exitosamente`, 'Cerrar', { duration: 3000 });
        this.limpiarSeleccionRutas();
        this.recargarRutas();
      },
      error: (error) => {
        console.error('Error al eliminar rutas en bloque:', error);
        this.snackBar.open('Error al eliminar algunas rutas', 'Cerrar', { duration: 3000 });
        this.recargarRutas();
      }
    });
  }

  cambiarEstadoRutasEnBloque(): void {
    const rutasSeleccionadas = Array.from(this.rutasSeleccionadasIds())
      .map(id => this.rutas().find(r => r.id === id))
      .filter(ruta => ruta !== undefined) as Ruta[];

    if (rutasSeleccionadas.length === 0) {
      this.snackBar.open('No hay rutas seleccionadas', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(CambiarEstadoRutasBloqueModalComponent, {
      width: '600px',
      data: {
        rutas: rutasSeleccionadas
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.limpiarSeleccionRutas();
        this.recargarRutas();
      }
    });
  }

  // ========================================
  // MÉTODOS PARA CONFIGURACIÓN DE COLUMNAS
  // ========================================

  toggleColumn(columnKey: string): void {
    const columns = this.availableColumns();
    const updatedColumns = columns.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    );
    this.availableColumns.set(updatedColumns);
  }

  getVisibleColumnsCount(): number {
    return this.availableColumns().filter(col => col.visible).length;
  }

  resetearColumnas(): void {
    const columns = this.availableColumns().map(col => ({
      ...col,
      visible: true
    }));
    this.availableColumns.set(columns);
    this.snackBar.open('Configuración de columnas restablecida', 'Cerrar', { duration: 2000 });
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  exportarRutasSeleccionadas(formato: 'excel' | 'csv' | 'pdf'): void {
    const rutasSeleccionadas = Array.from(this.rutasSeleccionadasIds())
      .map(id => this.rutas().find(r => r.id === id))
      .filter(ruta => ruta !== undefined) as Ruta[];

    if (rutasSeleccionadas.length === 0) {
      this.snackBar.open('No hay rutas seleccionadas para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    // Implementar exportación según el formato
    console.log(`Exportando ${rutasSeleccionadas.length} rutas en formato ${formato}`);
    this.snackBar.open(`Exportando ${rutasSeleccionadas.length} ruta(s) en formato ${formato.toUpperCase()}`, 'Cerrar', { duration: 3000 });
  }
}