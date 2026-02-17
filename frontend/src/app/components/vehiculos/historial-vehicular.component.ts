import { Component, inject, signal, computed, input, OnInit, effect, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { HistorialVehicularService } from '../../services/historial-vehicular.service';
import {
  HistorialVehicular,
  FiltrosHistorialVehicular,
  TipoEventoHistorial,
  ResumenHistorialVehicular
} from '../../models/historial-vehicular.model';
import { HistorialDetalleModalComponent } from './historial-detalle-modal.component';
import { DocumentosHistorialModalComponent } from './documentos-historial-modal.component';

@Component({
  selector: 'app-historial-vehicular',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatTooltipModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDividerModule,
    SmartIconComponent
  ],
  template: `
    <div class="historial-vehicular-container">
      <!-- Header -->
      <div class="header-section">
        <div class="header-content">
          <div class="header-title">
            <app-smart-icon [iconName]="'history'" [size]="32" class="header-icon"></app-smart-icon>
            <div>
              <h2>Historial Vehicular</h2>
              <p class="header-subtitle">
                @if (vehiculoIdFromUrl()) {
                  Historial del vehículo {{ placaFromUrl() || 'seleccionado' }}
                } @else if (vehiculoId()) {
                  Historial del vehículo seleccionado
                } @else {
                  Historial completo de todos los vehículos
                }
              </p>
            </div>
          </div>
          
          <!-- Acciones rápidas -->
          <div class="header-actions">
            @if (vehiculoIdFromUrl()) {
              <button mat-button (click)="volverAVehiculos()">
                <app-smart-icon [iconName]="'arrow_back'" [size]="20"></app-smart-icon>
                Volver a Vehículos
              </button>
            }
            <button mat-button (click)="toggleFiltros()">
              <app-smart-icon [iconName]="mostrarFiltros() ? 'filter_list_off' : 'filter_list'" [size]="20"></app-smart-icon>
              {{ mostrarFiltros() ? 'Ocultar' : 'Mostrar' }} Filtros
            </button>
            <button mat-raised-button 
                    color="primary" 
                    (click)="exportarHistorial()"
                    [disabled]="!puedeExportar()">
              <app-smart-icon [iconName]="'download'" [size]="20"></app-smart-icon>
              Exportar
            </button>
          </div>
        </div>

        <!-- Resumen rápido si es un vehículo específico -->
        @if ((vehiculoId() || vehiculoIdFromUrl()) && resumenVehiculo()) {
          <mat-card class="resumen-card">
            <mat-card-content>
              <div class="resumen-stats">
                <div class="stat-item">
                  <span class="stat-number">{{ resumenVehiculo()?.totalEventos || 0 }}</span>
                  <span class="stat-label">Total Eventos</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ resumenVehiculo()?.empresasHistoricas?.length || 0 }}</span>
                  <span class="stat-label">Empresas</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ resumenVehiculo()?.resolucionesHistoricas?.length || 0 }}</span>
                  <span class="stat-label">Resoluciones</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ getDiasDesdeUltimoEvento() }}</span>
                  <span class="stat-label">Días desde último evento</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <!-- Filtros -->
      <mat-expansion-panel class="filtros-panel" [expanded]="mostrarFiltros()">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <app-smart-icon [iconName]="'filter_list'" [size]="20"></app-smart-icon>
            <span>Filtros de búsqueda</span>
          </mat-panel-title>
          <mat-panel-description>
            {{ filtrosActivos() }} filtro(s) activo(s)
          </mat-panel-description>
        </mat-expansion-panel-header>

        <form [formGroup]="filtrosForm" class="filtros-form">
          <div class="filtros-row">
            <mat-form-field appearance="outline">
              <mat-label>Placa</mat-label>
              <input matInput formControlName="placa" placeholder="Ej: ABC-123">
              <app-smart-icon [iconName]="'directions_car'" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Empresa</mat-label>
              <input matInput formControlName="empresa" placeholder="Nombre o RUC de la empresa">
              <app-smart-icon [iconName]="'business'" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tipo de Evento</mat-label>
              <mat-select formControlName="tipoEvento" multiple>
                @for (tipo of tiposEvento; track tipo.value) {
                  <mat-option [value]="tipo.value">{{ tipo.label }}</mat-option>
                }
              </mat-select>
              <app-smart-icon [iconName]="'event'" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>
          </div>

          <div class="filtros-row">
            <mat-form-field appearance="outline">
              <mat-label>Fecha Desde</mat-label>
              <input matInput [matDatepicker]="fechaDesde" formControlName="fechaDesde">
              <mat-datepicker-toggle matSuffix [for]="fechaDesde"></mat-datepicker-toggle>
              <mat-datepicker #fechaDesde></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Fecha Hasta</mat-label>
              <input matInput [matDatepicker]="fechaHasta" formControlName="fechaHasta">
              <mat-datepicker-toggle matSuffix [for]="fechaHasta"></mat-datepicker-toggle>
              <mat-datepicker #fechaHasta></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Ordenar por</mat-label>
              <mat-select formControlName="ordenarPor">
                <mat-option value="fechaEvento">Fecha</mat-option>
                <mat-option value="empresa">Empresa</mat-option>
                <mat-option value="placa">Placa</mat-option>
                <mat-option value="tipoEvento">Tipo de Evento</mat-option>
              </mat-select>
              <app-smart-icon [iconName]="'sort'" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Orden</mat-label>
              <mat-select formControlName="ordenDireccion">
                <mat-option value="desc">Descendente</mat-option>
                <mat-option value="asc">Ascendente</mat-option>
              </mat-select>
              <app-smart-icon [iconName]="'swap_vert'" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>
          </div>

          <div class="filtros-actions">
            <button mat-raised-button color="primary" (click)="aplicarFiltros()">
              <app-smart-icon [iconName]="'search'" [size]="20"></app-smart-icon>
              Buscar
            </button>
            <button mat-button (click)="limpiarFiltros()">
              <app-smart-icon [iconName]="'clear'" [size]="20"></app-smart-icon>
              Limpiar
            </button>
          </div>
        </form>
      </mat-expansion-panel>

      <!-- Tabla de historial -->
      <mat-card class="historial-table-card">
        <mat-card-header>
          <mat-card-title>
            <app-smart-icon [iconName]="'list'" [size]="24"></app-smart-icon>
            Registros del Historial
          </mat-card-title>
          <mat-card-subtitle>
            {{ totalRegistros() }} registro(s) encontrado(s)
          </mat-card-subtitle>
          
          <!-- Selector de columnas -->
          <div class="table-controls">
            <button mat-icon-button [matMenuTriggerFor]="historialColumnasMenu" matTooltip="Configurar columnas">
              <app-smart-icon [iconName]="'view_column'" [size]="20"></app-smart-icon>
            </button>
            <mat-menu #historialColumnasMenu="matMenu" class="columnas-menu historial-columnas-menu" xPosition="before">
              <div class="columnas-menu-header" (click)="$event.stopPropagation()">
                <h4>Mostrar columnas</h4>
              </div>
              @for (columna of columnasDisponibles; track columna.key) {
                <div class="columna-checkbox" (click)="$event.stopPropagation()">
                  <mat-checkbox 
                    [checked]="columnaVisible(columna.key)"
                    (change)="toggleColumna(columna.key, $event.checked)"
                    [disabled]="columna.required">
                    {{ columna.label }}
                  </mat-checkbox>
                </div>
              }
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="resetearColumnas()">
                <app-smart-icon [iconName]="'refresh'" [size]="16"></app-smart-icon>
                <span>Restablecer por defecto</span>
              </button>
            </mat-menu>
          </div>
        </mat-card-header>

        <mat-card-content>
          @if (cargando()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Cargando historial...</p>
            </div>
          } @else if (error()) {
            <div class="error-container">
              <app-smart-icon [iconName]="'error'" [size]="48" class="error-icon"></app-smart-icon>
              <h3>{{ error() }}</h3>
              <p>Intenta actualizar la página o contacta al administrador si el problema persiste.</p>
              <button mat-raised-button color="primary" (click)="actualizarHistorial()">
                <app-smart-icon [iconName]="'refresh'" [size]="20"></app-smart-icon>
                Reintentar
              </button>
            </div>
          } @else if (!tieneHistorial()) {
            <div class="empty-container">
              <app-smart-icon [iconName]="'history'" [size]="48" class="empty-icon"></app-smart-icon>
              <h3>No hay registros de historial</h3>
              <p>No se encontraron eventos para los filtros aplicados.</p>
              @if (filtrosActivos() > 0) {
                <button mat-button (click)="limpiarFiltros()">
                  <app-smart-icon [iconName]="'clear'" [size]="20"></app-smart-icon>
                  Limpiar filtros
                </button>
              }
            </div>
          } @else {
            <div class="table-container">
              <table mat-table 
                     [dataSource]="historialData()" 
                     class="historial-table" 
                     matSort
                     [attr.data-render-key]="tablaRenderKey()"
                     id="historial-vehicular-table">
                <!-- Columna Fecha -->
                <ng-container matColumnDef="fecha">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header class="col-fecha">Fecha</th>
                  <td mat-cell *matCellDef="let registro" class="col-fecha">
                    <div class="fecha-cell">
                      <span class="fecha-principal">{{ formatearFecha(registro.fechaEvento) }}</span>
                      <span class="fecha-hora">{{ formatearHora(registro.fechaEvento) }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Columna Placa -->
                <ng-container matColumnDef="placa">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header class="col-placa">Placa</th>
                  <td mat-cell *matCellDef="let registro" class="col-placa">
                    <div class="placa-cell">
                      <app-smart-icon [iconName]="'directions_car'" [size]="16"></app-smart-icon>
                      <span class="placa-text">{{ registro.placa }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Columna Empresa -->
                <ng-container matColumnDef="empresa">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header class="col-empresa">Empresa</th>
                  <td mat-cell *matCellDef="let registro" class="col-empresa">
                    <div class="empresa-cell">
                      <app-smart-icon [iconName]="'business'" [size]="16"></app-smart-icon>
                      <span class="empresa-text" [matTooltip]="registro.empresaNombre || 'No especificada'">
                        {{ registro.empresaNombre || 'No especificada' }}
                      </span>
                    </div>
                  </td>
                </ng-container>

                <!-- Columna Tipo de Evento -->
                <ng-container matColumnDef="tipoEvento">
                  <th mat-header-cell *matHeaderCellDef class="col-tipo-evento">Tipo de Evento</th>
                  <td mat-cell *matCellDef="let registro" class="col-tipo-evento">
                    <mat-chip [class]="'evento-chip evento-' + registro.tipoEvento.toLowerCase()">
                      <app-smart-icon [iconName]="getIconoTipoEvento(registro.tipoEvento)" [size]="16"></app-smart-icon>
                      {{ getLabelTipoEvento(registro.tipoEvento) }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Columna Descripción -->
                <ng-container matColumnDef="descripcion">
                  <th mat-header-cell *matHeaderCellDef class="col-descripcion">Descripción</th>
                  <td mat-cell *matCellDef="let registro" class="col-descripcion">
                    <div class="descripcion-cell">
                      <span class="descripcion-principal" [matTooltip]="registro.descripcion">
                        {{ registro.descripcion }}
                      </span>
                      @if (registro.observaciones) {
                        <span class="descripcion-observaciones" [matTooltip]="registro.observaciones">
                          {{ registro.observaciones }}
                        </span>
                      }
                    </div>
                  </td>
                </ng-container>

                <!-- Columna Usuario -->
                <ng-container matColumnDef="usuario">
                  <th mat-header-cell *matHeaderCellDef class="col-usuario">Usuario</th>
                  <td mat-cell *matCellDef="let registro" class="col-usuario">
                    <div class="usuario-cell">
                      @if (registro.usuarioNombre) {
                        <app-smart-icon [iconName]="'person'" [size]="16"></app-smart-icon>
                        <span [matTooltip]="registro.usuarioNombre">{{ registro.usuarioNombre }}</span>
                      } @else {
                        <span class="usuario-sistema">Sistema</span>
                      }
                    </div>
                  </td>
                </ng-container>

                <!-- Columna Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef class="col-acciones">Acciones</th>
                  <td mat-cell *matCellDef="let registro" class="col-acciones">
                    <div class="acciones-cell">
                      <button mat-icon-button 
                              (click)="verDetalleRegistro(registro); $event.stopPropagation()"
                              matTooltip="Ver detalles">
                        <app-smart-icon [iconName]="'visibility'" [size]="20"></app-smart-icon>
                      </button>
                      @if (registro.documentosSoporte?.length) {
                        <button mat-icon-button 
                                (click)="verDocumentos(registro); $event.stopPropagation()"
                                matTooltip="Ver documentos">
                          <app-smart-icon [iconName]="'attach_file'" [size]="20"></app-smart-icon>
                        </button>
                      }
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="columnasVisibles()"></tr>
                <tr mat-row *matRowDef="let row; columns: columnasVisibles();" 
                    class="historial-row"
                    (click)="verDetalleRegistro(row)"></tr>
              </table>
            </div>

            <!-- Paginación -->
            <mat-paginator 
              [length]="totalRegistros()"
              [pageSize]="paginacion().limit"
              [pageSizeOptions]="[10, 25, 50, 100]"
              [pageIndex]="paginacion().page - 1"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .historial-vehicular-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-section {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      color: #1976d2;
    }

    .header-title h2 {
      margin: 0;
      color: #1976d2;
      font-size: 28px;
      font-weight: 500;
    }

    .header-subtitle {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .resumen-card {
      margin-top: 16px;
    }

    .resumen-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 24px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 24px;
      font-weight: 600;
      color: #1976d2;
    }

    .stat-label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    .filtros-panel {
      margin-bottom: 24px;
    }

    .filtros-form {
      padding: 16px 0;
    }

    .filtros-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .filtros-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .historial-table-card {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .table-controls {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .columnas-menu {
      min-width: 250px;
      max-width: 300px;
    }

    .columnas-menu-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
      background-color: #f8f9fa;
    }

    .columnas-menu-header h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .columna-checkbox {
      display: block;
      padding: 12px 16px;
      margin: 0;
      width: 100%;
    }

    .columna-checkbox:hover {
      background-color: #f5f5f5;
    }

    .columna-checkbox .mdc-checkbox {
      margin-right: 8px;
    }

    .columna-checkbox .mdc-form-field {
      width: 100%;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: #666;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      text-align: center;
    }

    .error-icon {
      color: #f44336;
      margin-bottom: 16px;
    }

    .error-container h3 {
      color: #f44336;
      margin: 0 0 8px 0;
    }

    .error-container p {
      color: #666;
      margin: 0 0 24px 0;
      max-width: 400px;
    }

    .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      text-align: center;
    }

    .empty-icon {
      color: #999;
      margin-bottom: 16px;
    }

    .empty-container h3 {
      color: #666;
      margin: 0 0 8px 0;
    }

    .empty-container p {
      color: #999;
      margin: 0 0 24px 0;
    }

    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .historial-table {
      width: 100%;
      min-width: 1000px;
      background: white;
    }

    /* Anchos específicos para columnas */
    .col-fecha {
      width: 120px;
      min-width: 120px;
    }

    .col-placa {
      width: 100px;
      min-width: 100px;
    }

    .col-empresa {
      width: 200px;
      min-width: 150px;
      max-width: 250px;
    }

    .col-tipo-evento {
      width: 160px;
      min-width: 160px;
    }

    .col-descripcion {
      width: auto;
      min-width: 200px;
      max-width: 400px;
    }

    .col-usuario {
      width: 140px;
      min-width: 120px;
    }

    .col-acciones {
      width: 100px;
      min-width: 100px;
    }

    /* Headers con mejor estilo */
    .mat-mdc-header-cell {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #e0e0e0;
    }

    /* Texto truncado con ellipsis */
    .empresa-text,
    .descripcion-principal,
    .descripcion-observaciones {
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Mejoras en las celdas */
    .mat-mdc-cell {
      padding: 12px 8px;
      border-bottom: 1px solid #f0f0f0;
    }

    .mat-mdc-row:hover {
      background-color: #f8f9fa;
    }

    /* Responsive adjustments */
    @media (max-width: 1200px) {
      .col-descripcion {
        max-width: 250px;
      }
      
      .col-empresa {
        max-width: 180px;
      }
    }

    @media (max-width: 900px) {
      .historial-table {
        min-width: 800px;
      }
      
      .col-descripcion {
        max-width: 200px;
      }
      
      .col-empresa {
        max-width: 150px;
      }
    }

    .historial-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .historial-row:hover {
      background-color: #f5f5f5;
    }

    .fecha-cell {
      display: flex;
      flex-direction: column;
    }

    .fecha-principal {
      font-weight: 500;
      color: #333;
    }

    .fecha-hora {
      font-size: 12px;
      color: #666;
    }

    .placa-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .placa-text {
      font-weight: 600;
      color: #1976d2;
    }

    .empresa-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .empresa-text {
      font-weight: 500;
      color: #4caf50;
      font-size: 13px;
    }

    .evento-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .evento-creacion { background-color: #e8f5e8; color: #2e7d32; }
    .evento-modificacion { background-color: #fff3e0; color: #f57c00; }
    .evento-transferencia_empresa { background-color: #e3f2fd; color: #1976d2; }
    .evento-cambio_estado { background-color: #f3e5f5; color: #7b1fa2; }
    .evento-asignacion_ruta { background-color: #e0f2f1; color: #00695c; }
    .evento-desasignacion_ruta { background-color: #ffebee; color: #c62828; }

    .descripcion-cell {
      display: flex;
      flex-direction: column;
    }

    .descripcion-principal {
      font-weight: 500;
      color: #333;
    }

    .descripcion-observaciones {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }

    .usuario-cell {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .usuario-sistema {
      font-style: italic;
      color: #666;
    }

    .acciones-cell {
      display: flex;
      gap: 4px;
    }

    @media (max-width: 768px) {
      .historial-vehicular-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
      }

      .header-actions {
        align-self: stretch;
      }

      .filtros-row {
        grid-template-columns: 1fr;
      }

      .resumen-stats {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class HistorialVehicularComponent implements OnInit {
  // Inputs
  vehiculoId = input<string>();
  placa = input<string>();

  // Servicios
  private historialService = inject(HistorialVehicularService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);

  // Estado del componente
  cargando = signal(false);
  historialData = signal<HistorialVehicular[]>([]);
  totalRegistros = signal(0);
  paginacion = signal({ page: 1, limit: 25 });
  mostrarFiltros = signal(false);
  resumenVehiculo = signal<ResumenHistorialVehicular | null>(null);
  error = signal<string | null>(null);

  // Parámetros de URL (públicos para el template)
  vehiculoIdFromUrl = signal<string | null>(null);
  placaFromUrl = signal<string | null>(null);

  // Computed signals
  tieneHistorial = computed(() => this.historialData().length > 0);
  puedeExportar = computed(() => this.tieneHistorial() && !this.cargando());

  // Configuración de la tabla
  columnasTabla = ['fecha', 'placa', 'empresa', 'tipoEvento', 'descripcion', 'usuario', 'acciones'];
  
  // Configuración de columnas disponibles
  columnasDisponibles = [
    { key: 'fecha', label: 'Fecha', required: true },
    { key: 'placa', label: 'Placa', required: false },
    { key: 'empresa', label: 'Empresa', required: false },
    { key: 'tipoEvento', label: 'Tipo de Evento', required: true },
    { key: 'descripcion', label: 'Descripción', required: true },
    { key: 'usuario', label: 'Usuario', required: false },
    { key: 'acciones', label: 'Acciones', required: true }
  ];

  // Estado de columnas visibles
  columnasVisiblesState = signal<string[]>(['fecha', 'placa', 'empresa', 'tipoEvento', 'descripcion', 'usuario', 'acciones']);
  
  // Signal para forzar re-renderización de la tabla
  tablaRenderKey = signal(0);
  
  // Computed para columnas visibles
  columnasVisibles = computed(() => {
    const visibles = this.columnasVisiblesState();
    const vehiculoId = this.vehiculoId() || this.vehiculoIdFromUrl();
    
    // Forzar nueva referencia y notificar cambios
    const resultado = [...visibles];
    
    // Incrementar el key de renderización para forzar actualización
    this.tablaRenderKey.update(key => key + 1);
    
    return resultado;
  });

  // Tipos de evento para el filtro
  tiposEvento = [
    { value: TipoEventoHistorial.CREACION, label: 'Creación' },
    { value: TipoEventoHistorial.MODIFICACION, label: 'Modificación' },
    { value: TipoEventoHistorial.TRANSFERENCIA_EMPRESA, label: 'Transferencia de Empresa' },
    { value: TipoEventoHistorial.CAMBIO_RESOLUCION, label: 'Cambio de Resolución' },
    { value: TipoEventoHistorial.CAMBIO_ESTADO, label: 'Cambio de Estado' },
    { value: TipoEventoHistorial.ASIGNACION_RUTA, label: 'Asignación de Ruta' },
    { value: TipoEventoHistorial.DESASIGNACION_RUTA, label: 'Desasignación de Ruta' },
    { value: TipoEventoHistorial.ACTUALIZACION_TUC, label: 'Actualización TUC' },
    { value: TipoEventoHistorial.SUSPENSION, label: 'Suspensión' },
    { value: TipoEventoHistorial.REACTIVACION, label: 'Reactivación' },
    { value: TipoEventoHistorial.MANTENIMIENTO, label: 'Mantenimiento' },
    { value: TipoEventoHistorial.OTROS, label: 'Otros' }
  ];

  // Formulario de filtros
  filtrosForm = this.fb.group({
    placa: [''],
    empresa: [''],
    tipoEvento: [[] as TipoEventoHistorial[]],
    fechaDesde: [null as Date | null],
    fechaHasta: [null as Date | null],
    usuarioId: [''],
    ordenarPor: ['fechaEvento'],
    ordenDireccion: ['desc']
  });

  // Computed para filtros activos
  filtrosActivos = computed(() => {
    const valores = this.filtrosForm.value;
    let count = 0;

    if (valores.placa) count++;
    if (valores.empresa) count++;
    if (valores.tipoEvento && valores.tipoEvento.length > 0) count++;
    if (valores.fechaDesde) count++;
    if (valores.fechaHasta) count++;
    if (valores.usuarioId) count++;

    return count;
  });

  constructor() {
    // Effect para reaccionar a cambios en vehiculoId
    effect(() => {
      const vehiculoId = this.vehiculoId();
      const vehiculoIdFromUrl = this.vehiculoIdFromUrl();

      if (vehiculoId || vehiculoIdFromUrl) {
        this.cargarResumenVehiculo();
      }
    });

    // Effect para reaccionar a cambios en placa
    effect(() => {
      const placa = this.placa();
      if (placa) {
        this.filtrosForm.patchValue({ placa });
      }
    });

    // Effect para reaccionar a cambios en columnas visibles
    effect(() => {
      const columnas = this.columnasVisiblesState();
      const renderKey = this.tablaRenderKey();
      
      // Forzar detección de cambios cuando cambian las columnas
      this.cdr.markForCheck();
      
      // Programar actualización de la tabla en el próximo ciclo
      setTimeout(() => {
        this.forzarActualizacionTabla();
      }, 0);
    });

    // Cargar configuración de columnas desde localStorage
    this.cargarConfiguracionColumnas();
  }

  ngOnInit(): void {
    // Leer parámetros de la URL
    this.route.queryParams.subscribe((params: any) => {
      this.vehiculoIdFromUrl.set(params['vehiculoId'] || null);
      this.placaFromUrl.set(params['placa'] || null);

      if (params['vehiculoId']) {
        // Si viene un vehiculoId específico, aplicar filtros automáticamente
        this.filtrosForm.patchValue({
          placa: params['placa'] || '',
        });

        // Actualizar el título para mostrar que es específico de un vehículo
        this.mostrarFiltros.set(false); // Ocultar filtros por defecto

        // Aplicar filtros automáticamente
        this.aplicarFiltros();
      } else {
        // Cargar historial general
        this.cargarHistorial();
      }
    });
  }

  private cargarResumenVehiculo(): void {
    const vehiculoId = this.vehiculoIdFromUrl() || this.vehiculoId();
    if (!vehiculoId) return;

    this.historialService.getResumenHistorialVehiculo(vehiculoId).subscribe({
      next: (resumen: any) => {
        this.resumenVehiculo.set(resumen);
      },
      error: (error: any) => {
        console.error('Error cargando resumen del vehículo::', error);
      }
    });
  }

  private cargarHistorial(): void {
    this.cargando.set(true);
    this.error.set(null);

    const filtros = this.construirFiltros();

    this.historialService.getHistorialVehicular(filtros).subscribe({
      next: (response: any) => {
        this.historialData.set(response.historial);
        this.totalRegistros.set(response.total);
        this.paginacion.set({
          page: response.page,
          limit: response.limit
        });
        this.cargando.set(false);
      },
      error: (error: any) => {
        console.error('Error cargando historial::', error);
        this.error.set('Error al cargar el historial vehicular');
        this.snackBar.open('Error al cargar el historial', 'Cerrar', { duration: 3000 });
        this.cargando.set(false);
        this.historialData.set([]);
        this.totalRegistros.set(0);
      }
    });
  }

  private construirFiltros(): FiltrosHistorialVehicular {
    const formValues = this.filtrosForm.value;
    const filtros: FiltrosHistorialVehicular = {
      page: this.paginacion().page,
      limit: this.paginacion().limit,
      sortBy: formValues.ordenarPor || 'fechaEvento',
      sortOrder: (formValues.ordenDireccion as 'asc' | 'desc') || 'desc'
    };

    // Priorizar vehiculoId de los parámetros de URL
    const vehiculoIdFromUrl = this.vehiculoIdFromUrl();
    if (vehiculoIdFromUrl) {
      filtros.vehiculoId = vehiculoIdFromUrl;
    } else if (this.vehiculoId()) {
      filtros.vehiculoId = this.vehiculoId();
    }

    // Agregar filtros del formulario
    if (formValues.placa) {
      filtros.placa = formValues.placa;
    }

    if (formValues.empresa) {
      filtros.empresaId = formValues.empresa;
    }

    if (formValues.tipoEvento && formValues.tipoEvento.length > 0) {
      filtros.tipoEvento = formValues.tipoEvento;
    }

    if (formValues.fechaDesde) {
      filtros.fechaDesde = formValues.fechaDesde.toISOString();
    }

    if (formValues.fechaHasta) {
      filtros.fechaHasta = formValues.fechaHasta.toISOString();
    }

    if (formValues.usuarioId) {
      filtros.usuarioId = formValues.usuarioId;
    }

    return filtros;
  }

  aplicarFiltros(): void {
    this.paginacion.set({ page: 1, limit: this.paginacion().limit });
    this.cargarHistorial();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    // Mantener la placa si se proporcionó como input
    if (this.placa()) {
      this.filtrosForm.patchValue({ placa: this.placa() });
    }
    this.aplicarFiltros();
  }

  toggleFiltros(): void {
    this.mostrarFiltros.set(!this.mostrarFiltros());
  }

  onPageChange(event: PageEvent): void {
    this.paginacion.set({
      page: event.pageIndex + 1,
      limit: event.pageSize
    });
    this.cargarHistorial();
  }

  actualizarHistorial(): void {
    this.historialService.limpiarCache();
    this.cargarHistorial();
    if (this.vehiculoId()) {
      this.cargarResumenVehiculo();
    }
  }

  exportarHistorial(): void {
    const filtros = this.construirFiltros();

    this.historialService.exportarHistorial(filtros, 'excel').subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `historial-vehicular-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Historial exportado exitosamente', 'Cerrar', { duration: 3000 });
      },
      error: (error: any) => {
        console.error('Error exportando historial::', error);
        this.snackBar.open('Error al exportar el historial', 'Cerrar', { duration: 3000 });
      }
    });
  }

  verDetalleRegistro(registro: HistorialVehicular): void {
    this.dialog.open(HistorialDetalleModalComponent, {
      data: registro,
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'historial-detalle-modal-panel'
    });
  }

  verDocumentos(registro: HistorialVehicular): void {
    if (!registro.documentosSoporte || registro.documentosSoporte.length === 0) {
      this.snackBar.open('No hay documentos disponibles para este registro', 'Cerrar', { duration: 3000 });
      return;
    }

    this.dialog.open(DocumentosHistorialModalComponent, {
      data: {
        documentos: registro.documentosSoporte,
        tipoEvento: this.getLabelTipoEvento(registro.tipoEvento),
        fechaEvento: registro.fechaEvento,
        placa: registro.placa
      },
      width: '1200px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'documentos-historial-modal-panel'
    });
  }

  // Métodos de utilidad para la UI

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatearHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getLabelTipoEvento(tipo: TipoEventoHistorial): string {
    const tipoEncontrado = this.tiposEvento.find((t: any) => t.value === tipo);
    return tipoEncontrado?.label || tipo;
  }

  getIconoTipoEvento(tipo: TipoEventoHistorial): string {
    const iconos: Partial<{ [key in TipoEventoHistorial]: string }> = {
      [TipoEventoHistorial.CREACION]: 'add_circle',
      [TipoEventoHistorial.MODIFICACION]: 'edit',
      [TipoEventoHistorial.TRANSFERENCIA_EMPRESA]: 'swap_horiz',
      [TipoEventoHistorial.CAMBIO_RESOLUCION]: 'description',
      [TipoEventoHistorial.CAMBIO_ESTADO]: 'toggle_on',
      [TipoEventoHistorial.ASIGNACION_RUTA]: 'add_road',
      [TipoEventoHistorial.DESASIGNACION_RUTA]: 'remove_road',
      [TipoEventoHistorial.REMOCION_RUTA]: 'remove_road',
      [TipoEventoHistorial.ACTUALIZACION_TUC]: 'receipt',
      [TipoEventoHistorial.RENOVACION_TUC]: 'refresh',
      [TipoEventoHistorial.SUSPENSION]: 'pause_circle',
      [TipoEventoHistorial.REACTIVACION]: 'play_circle',
      [TipoEventoHistorial.ACTIVACION]: 'play_circle',
      [TipoEventoHistorial.DESACTIVACION]: 'pause_circle',
      [TipoEventoHistorial.BAJA_DEFINITIVA]: 'cancel',
      [TipoEventoHistorial.MANTENIMIENTO]: 'build',
      [TipoEventoHistorial.INSPECCION]: 'search',
      [TipoEventoHistorial.INSPECCION_TECNICA]: 'search',
      [TipoEventoHistorial.ACCIDENTE]: 'warning',
      [TipoEventoHistorial.MULTA]: 'gavel',
      [TipoEventoHistorial.SANCION]: 'gavel',
      [TipoEventoHistorial.REVISION_TECNICA]: 'verified',
      [TipoEventoHistorial.CAMBIO_PROPIETARIO]: 'person_add',
      [TipoEventoHistorial.ACTUALIZACION_DATOS_TECNICOS]: 'settings',
      [TipoEventoHistorial.MODIFICACION_DATOS]: 'settings',
      [TipoEventoHistorial.REHABILITACION]: 'restore',
      [TipoEventoHistorial.OTROS]: 'more_horiz'
    };

    return iconos[tipo] || 'event';
  }

  getDiasDesdeUltimoEvento(): number {
    const ultimoEvento = this.resumenVehiculo()?.ultimoEvento;
    if (!ultimoEvento) return 0;

    const fechaUltimo = new Date(ultimoEvento.fechaEvento);
    const fechaActual = new Date();
    const diferencia = fechaActual.getTime() - fechaUltimo.getTime();

    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  }

  volverAVehiculos(): void {
    this.router.navigate(['/vehiculos']);
  }

  // Métodos para el selector de columnas
  
  /**
   * TrackBy function optimizada para la tabla de historial
   */
  trackByTabla = (index: number, item: unknown): string => {
    const historialItem = item as HistorialVehicular;
    return historialItem.id || `${(historialItem as any).fecha || Date.now()}-${index}`;
  };
  
  columnaVisible(columna: string): boolean {
    const visible = this.columnasVisiblesState().includes(columna);
    return visible;
  }

  toggleColumna(columna: string, visible: boolean): void {
    const columnasActuales = this.columnasVisiblesState();
    let nuevasColumnas: string[];
    
    if (visible && !columnasActuales.includes(columna)) {
      // Agregar columna manteniendo el orden original
      nuevasColumnas = this.columnasDisponibles
        .map((col: any) => col.key)
        .filter((key: any) => columnasActuales.includes(key) || key === columna);
      
      } else if (!visible && columnasActuales.includes(columna)) {
      // Remover columna
      nuevasColumnas = columnasActuales.filter((col: any) => col !== columna);
      } else {
      return;
    }
    
    // Actualizar el estado (esto disparará el computed)
    this.columnasVisiblesState.set(nuevasColumnas);
    
    // Guardar configuración
    this.guardarConfiguracionColumnas();
    
    // Forzar actualización inmediata
    this.forzarActualizacionTabla();
    
    }

  resetearColumnas(): void {
    const columnasDefault = this.columnasDisponibles.map((col: any) => col.key);
    this.columnasVisiblesState.set(columnasDefault);
    this.guardarConfiguracionColumnas();
    
    // Forzar actualización de la tabla
    this.forzarActualizacionTabla();
    
    }

  private cargarConfiguracionColumnas(): void {
    try {
      const configuracion = localStorage.getItem('historial-vehicular-columnas-config');
      if (configuracion) {
        const columnas = JSON.parse(configuracion);
        if (Array.isArray(columnas) && columnas.length > 0) {
          // Validar que las columnas existen
          const columnasValidas = columnas.filter((col: any) => 
            this.columnasDisponibles.some((disponible: any) => disponible.key === col)
          );
          
          // Asegurar que las columnas requeridas estén presentes
          const columnasRequeridas = this.columnasDisponibles
            .filter((col: any) => col.required)
            .map((col: any) => col.key);
          
          const columnasFinales = [...new Set([...columnasValidas, ...columnasRequeridas])];
          this.columnasVisiblesState.set(columnasFinales);
          return;
        }
      }
      
      // Si no hay configuración válida, usar valores por defecto
      const columnasDefault = this.columnasDisponibles.map((col: any) => col.key);
      this.columnasVisiblesState.set(columnasDefault);
      } catch (error) {
      // En caso de error, usar valores por defecto
      const columnasDefault = this.columnasDisponibles.map((col: any) => col.key);
      this.columnasVisiblesState.set(columnasDefault);
      }
    
    }

  private guardarConfiguracionColumnas(): void {
    try {
      const columnas = this.columnasVisiblesState();
      localStorage.setItem('historial-vehicular-columnas-config', JSON.stringify(columnas));
      } catch (error) {
      }
  }

  /**
   * Método para forzar la actualización visual de la tabla
   * Útil cuando los cambios en las columnas no se reflejan inmediatamente
   */
  private forzarActualizacionTabla(): void {
    // Estrategia optimizada: solo actualizar si es necesario
    this.tablaRenderKey.update(key => key + 1);
    
    // Usar requestAnimationFrame para mejor performance
    requestAnimationFrame(() => {
      this.cdr.detectChanges();
    });
  }
}