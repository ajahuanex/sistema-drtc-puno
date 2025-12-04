import { Component, inject, signal, computed, ChangeDetectionStrategy, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';

import { ExpedienteService } from '../../services/expediente.service';
import { EmpresaService } from '../../services/empresa.service';
import { Expediente, TipoTramite, EstadoExpediente, PrioridadExpediente, TipoSolicitante } from '../../models/expediente.model';
import { Empresa } from '../../models/empresa.model';
import { CrearExpedienteModalComponent } from './crear-expediente-modal.component';

interface ExpedienteFiltros {
  numero: string;
  tipoTramite: string;
  estado: string;
  prioridad: string;
  empresaId: string;
  fechaDesde: Date | null;
  fechaHasta: Date | null;
}

interface ColumnaExpediente {
  id: string;
  nombre: string;
  visible: boolean;
  ordenable: boolean;
  filtrable: boolean;
}

@Component({
  selector: 'app-expedientes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatMenuModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatDividerModule
  ],
  template: `
    <div class="expedientes-container">
      <!-- Header Principal -->
      <mat-card class="header-card">
        <mat-card-header>
          <div class="header-content">
            <div class="header-title">
              <mat-icon class="header-icon">folder</mat-icon>
              <div class="title-text">
                <h1>Gestión de Expedientes</h1>
                <p>Administra todos los expedientes del sistema</p>
              </div>
            </div>
            <div class="header-actions">
              <button mat-raised-button 
                      color="primary" 
                      (click)="abrirModalCrearExpediente()"
                      class="crear-button">
                <mat-icon>add</mat-icon>
                Nuevo Expediente
              </button>
              <button mat-raised-button 
                      color="warn" 
                      (click)="cargaMasivaExpedientes()"
                      class="carga-masiva-button">
                <mat-icon>upload_file</mat-icon>
                Carga Masiva
              </button>
              <button mat-stroked-button 
                      (click)="toggleFiltrosAvanzados()"
                      class="filtros-button">
                <mat-icon>{{ filtrosAvanzados() ? 'expand_less' : 'expand_more' }}</mat-icon>
                {{ filtrosAvanzados() ? 'Ocultar Filtros' : 'Mostrar Filtros' }}
              </button>
            </div>
          </div>
        </mat-card-header>
      </mat-card>

      <!-- Filtros Avanzados -->
      <mat-card class="filtros-card" *ngIf="filtrosAvanzados()">
        <mat-card-content>
          <form [formGroup]="filtrosForm" class="filtros-form">
            <div class="filtros-row">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Número de Expediente</mat-label>
                <input matInput 
                       formControlName="numero" 
                       placeholder="E-0001-2025"
                       (input)="aplicarFiltros()">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Tipo de Trámite</mat-label>
                <mat-select formControlName="tipoTramite" (selectionChange)="aplicarFiltros()">
                  <mat-option value="">Todos los tipos</mat-option>
                  <mat-option value="PRIMIGENIA">Primigenia</mat-option>
                  <mat-option value="RENOVACION">Renovación</mat-option>
                  <mat-option value="INCREMENTO">Incremento</mat-option>
                  <mat-option value="SUSTITUCION">Sustitución</mat-option>
                  <mat-option value="OTROS">Otros</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado" (selectionChange)="aplicarFiltros()">
                  <mat-option value="">Todos los estados</mat-option>
                  <mat-option value="EN_PROCESO">En Proceso</mat-option>
                  <mat-option value="APROBADO">Aprobado</mat-option>
                  <mat-option value="RECHAZADO">Rechazado</mat-option>
                  <mat-option value="SUSPENDIDO">Suspendido</mat-option>
                  <mat-option value="ARCHIVADO">Archivado</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="filtros-row">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Prioridad</mat-label>
                <mat-select formControlName="prioridad" (selectionChange)="aplicarFiltros()">
                  <mat-option value="">Todas las prioridades</mat-option>
                  <mat-option [value]="PrioridadExpediente.BAJA">Baja</mat-option>
                  <mat-option [value]="PrioridadExpediente.NORMAL">Normal</mat-option>
                  <mat-option [value]="PrioridadExpediente.ALTA">Alta</mat-option>
                  <mat-option [value]="PrioridadExpediente.URGENTE">Urgente</mat-option>
                  <mat-option [value]="PrioridadExpediente.CRITICA">Crítica</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Fecha Desde</mat-label>
                <input matInput 
                       [matDatepicker]="fechaDesdePicker" 
                       formControlName="fechaDesde"
                       (dateChange)="aplicarFiltros()">
                <mat-datepicker-toggle matSuffix [for]="fechaDesdePicker"></mat-datepicker-toggle>
                <mat-datepicker #fechaDesdePicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Fecha Hasta</mat-label>
                <input matInput 
                       [matDatepicker]="fechaHastaPicker" 
                       formControlName="fechaHasta"
                       (dateChange)="aplicarFiltros()">
                <mat-datepicker-toggle matSuffix [for]="fechaHastaPicker"></mat-datepicker-toggle>
                <mat-datepicker #fechaHastaPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="filtros-actions">
              <button mat-stroked-button 
                      type="button"
                      (click)="limpiarFiltros()"
                      class="limpiar-button">
                <mat-icon>clear</mat-icon>
                Limpiar Filtros
              </button>
              <button mat-stroked-button 
                      type="button"
                      (click)="exportarExpedientes()"
                      class="exportar-button">
                <mat-icon>download</mat-icon>
                Exportar
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Tabla de Expedientes -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-header">
            <div class="table-info">
              <h3>Expedientes</h3>
              <span class="total-count">
                {{ totalExpedientes() }} expedientes encontrados
              </span>
            </div>
            <div class="table-actions">
              <!-- Menú de Configuración de Columnas -->
              <button mat-icon-button 
                      [matMenuTriggerFor]="columnasMenu"
                      class="columnas-button"
                      matTooltip="Configurar columnas">
                <mat-icon>view_column</mat-icon>
              </button>
              <mat-menu #columnasMenu="matMenu" class="columnas-menu">
                <div class="menu-header">
                  <h4>Columnas Visibles</h4>
                  <button mat-button 
                          (click)="toggleTodasColumnas()"
                          class="toggle-all-button">
                    {{ todasColumnasVisibles() ? 'Ocultar Todas' : 'Mostrar Todas' }}
                  </button>
                </div>
                <mat-divider></mat-divider>
                <div class="columnas-list">
                  <div class="columna-item" *ngFor="let columna of columnas()">
                    <mat-checkbox [checked]="columna.visible"
                                  (change)="toggleColumna(columna.id, $event.checked)"
                                  class="columna-checkbox">
                      {{ columna.nombre }}
                    </mat-checkbox>
                  </div>
                </div>
              </mat-menu>

              <!-- Menú Principal de Acciones -->
              <button mat-icon-button 
                      [matMenuTriggerFor]="menu"
                      class="menu-button">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="recargarExpedientes()">
                  <mat-icon>refresh</mat-icon>
                  Recargar
                </button>
                <button mat-menu-item (click)="exportarExpedientes()">
                  <mat-icon>download</mat-icon>
                  Exportar
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="toggleFiltrosAvanzados()">
                  <mat-icon>filter_list</mat-icon>
                  {{ filtrosAvanzados() ? 'Ocultar Filtros' : 'Mostrar Filtros' }}
                </button>
              </mat-menu>
            </div>
          </div>

          <div class="table-container" *ngIf="!isLoading()">
            <table mat-table 
                   [dataSource]="dataSource" 
                   matSort 
                   matSortActive="fechaEmision" 
                   matSortDirection="desc"
                   class="expedientes-table">
              
              <!-- Número de Expediente -->
              <ng-container matColumnDef="nroExpediente" *ngIf="columnaVisible('nroExpediente')">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="nroExpediente">Número</th>
                <td mat-cell *matCellDef="let expediente">
                  <div class="numero-cell">
                    <span class="numero-text">{{ expediente.nroExpediente }}</span>
                    <mat-chip class="tipo-chip" [class]="expediente.tipoTramite?.toLowerCase()">
                      {{ expediente.tipoTramite }}
                    </mat-chip>
                  </div>
                </td>
              </ng-container>

              <!-- Fecha de Emisión -->
              <ng-container matColumnDef="fechaEmision" *ngIf="columnaVisible('fechaEmision')">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="fechaEmision">Fecha Emisión</th>
                <td mat-cell *matCellDef="let expediente">
                  {{ expediente.fechaEmision | date:'dd/MM/yyyy' }}
                </td>
              </ng-container>

              <!-- Tipo de Trámite -->
              <ng-container matColumnDef="tipoTramite" *ngIf="columnaVisible('tipoTramite')">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="tipoTramite">Tipo</th>
                <td mat-cell *matCellDef="let expediente">
                  <span class="tipo-chip" [class]="expediente.tipoTramite?.toLowerCase()">
                    {{ expediente.tipoTramite }}
                  </span>
                </td>
              </ng-container>

              <!-- Estado -->
              <ng-container matColumnDef="estado" *ngIf="columnaVisible('estado')">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="estado">Estado</th>
                <td mat-cell *matCellDef="let expediente">
                  <span class="estado-chip" [class]="expediente.estado?.toLowerCase()">
                    {{ expediente.estado }}
                  </span>
                </td>
              </ng-container>

              <!-- Prioridad -->
              <ng-container matColumnDef="prioridad" *ngIf="columnaVisible('prioridad')">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="prioridad">Prioridad</th>
                <td mat-cell *matCellDef="let expediente">
                  <span class="prioridad-chip" [class]="expediente.prioridad?.toLowerCase()">
                    {{ expediente.prioridad || 'NORMAL' }}
                  </span>
                </td>
              </ng-container>

              <!-- Empresa (reemplaza descripción) -->
              <ng-container matColumnDef="descripcion" *ngIf="columnaVisible('descripcion')">
                <th mat-header-cell *matHeaderCellDef>Empresa</th>
                <td mat-cell *matCellDef="let expediente">
                  <div class="empresa-cell" [matTooltip]="getEmpresaNombre(expediente.empresaId)">
                    {{ getEmpresaNombre(expediente.empresaId) }}
                  </div>
                </td>
              </ng-container>

              <!-- Folio -->
              <ng-container matColumnDef="folio" *ngIf="columnaVisible('folio')">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="folio">Folio</th>
                <td mat-cell *matCellDef="let expediente">
                  {{ expediente.folio }}
                </td>
              </ng-container>

              <!-- Empresa -->
              <ng-container matColumnDef="empresa" *ngIf="columnaVisible('empresa')">
                <th mat-header-cell *matHeaderCellDef>Empresa</th>
                <td mat-cell *matCellDef="let expediente">
                  <span class="empresa-text">{{ expediente.empresaId || 'Sin empresa' }}</span>
                </td>
              </ng-container>

              <!-- Acciones -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let expediente">
                  <div class="acciones-cell">
                    <button mat-icon-button 
                            [matMenuTriggerFor]="accionesMenu"
                            class="acciones-button">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #accionesMenu="matMenu">
                      <button mat-menu-item (click)="verDetalleExpediente(expediente)">
                        <mat-icon>visibility</mat-icon>
                        Ver Detalle
                      </button>
                      <button mat-menu-item (click)="editarExpediente(expediente)">
                        <mat-icon>edit</mat-icon>
                        Editar
                      </button>
                      <button mat-menu-item (click)="duplicarExpediente(expediente)">
                        <mat-icon>content_copy</mat-icon>
                        Duplicar
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item (click)="cambiarEstadoExpediente(expediente, 'APROBADO')" 
                              *ngIf="expediente.estado !== 'APROBADO'">
                        <mat-icon>check_circle</mat-icon>
                        Aprobar
                      </button>
                      <button mat-menu-item (click)="cambiarEstadoExpediente(expediente, 'RECHAZADO')"
                              *ngIf="expediente.estado !== 'RECHAZADO'">
                        <mat-icon>cancel</mat-icon>
                        Rechazar
                      </button>
                      <button mat-menu-item (click)="archivarExpediente(expediente)"
                              *ngIf="expediente.estado !== 'ARCHIVADO'">
                        <mat-icon>archive</mat-icon>
                        Archivar
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item (click)="eliminarExpediente(expediente)" 
                              class="danger-action">
                        <mat-icon>delete</mat-icon>
                        Eliminar
                      </button>
                    </mat-menu>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columnasVisibles()"></tr>
              <tr mat-row *matRowDef="let row; columns: columnasVisibles();" 
                  class="expediente-row"
                  [class.selected]="expedienteSeleccionado()?.id === row.id"
                  (click)="seleccionarExpediente(row)"></tr>
            </table>

            <!-- Paginador -->
            <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]"
                           showFirstLastButtons
                           aria-label="Seleccionar página de expedientes">
            </mat-paginator>
          </div>

          <!-- Estado de Carga -->
          <div class="loading-container" *ngIf="isLoading()">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando expedientes...</p>
          </div>

          <!-- Estado Vacío -->
          <div class="empty-container" *ngIf="!isLoading() && totalExpedientes() === 0">
            <mat-icon class="empty-icon">folder_open</mat-icon>
            <h3>No hay expedientes</h3>
            <p>No se encontraron expedientes con los filtros aplicados</p>
            <button mat-raised-button 
                    color="primary"
                    (click)="abrirModalCrearExpediente()">
              <mat-icon>add</mat-icon>
              Crear Primer Expediente
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .expedientes-container {
      padding: 24px;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    .header-card {
      margin-bottom: 24px;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: white;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .title-text h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }

    .title-text p {
      margin: 4px 0 0 0;
      opacity: 0.9;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .crear-button {
      background-color: #4caf50;
      color: white;
      border: none;
    }

    .filtros-button {
      color: white;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .filtros-card, .table-card {
      margin-bottom: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

    .filtro-field {
      width: 100%;
    }

    .filtros-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .table-info h3 {
      margin: 0 0 4px 0;
      color: #333;
      font-weight: 600;
    }

    .total-count {
      color: #666;
      font-size: 14px;
    }

    .table-actions {
      display: flex;
      gap: 8px;
    }

    .columnas-button {
      color: #1976d2;
    }

    .menu-button {
      color: #666;
    }

    .table-container {
      overflow-x: auto;
    }

    .expedientes-table {
      width: 100%;
      background: white;
    }

    .expedientes-table th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
      padding: 12px 8px;
    }

    .expedientes-table td {
      padding: 12px 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .expediente-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .expediente-row:hover {
      background-color: #f8f9fa;
    }

    .expediente-row.selected {
      background-color: #e3f2fd;
    }

    .numero-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .numero-text {
      font-weight: 600;
      color: #1976d2;
      font-family: monospace;
    }

    .tipo-chip, .estado-chip, .prioridad-chip {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      display: inline-block;
    }

    .tipo-chip.primigenia {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .tipo-chip.renovacion {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .tipo-chip.incremento {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .tipo-chip.sustitucion {
      background-color: #fce4ec;
      color: #ad1457;
    }

    .estado-chip.en_proceso {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .estado-chip.aprobado {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .estado-chip.rechazado {
      background-color: #ffebee;
      color: #c62828;
    }

    .estado-chip.suspendido {
      background-color: #fff8e1;
      color: #f57f17;
    }

    .estado-chip.archivado {
      background-color: #f5f5f5;
      color: #666;
    }

    .prioridad-chip.baja {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .prioridad-chip.normal {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .prioridad-chip.alta {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .prioridad-chip.urgente {
      background-color: #ffebee;
      color: #c62828;
    }

    .prioridad-chip.critica {
      background-color: #fce4ec;
      color: #ad1457;
    }

    .descripcion-cell {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .empresa-text {
      color: #666;
      font-size: 14px;
    }

    .acciones-cell {
      display: flex;
      justify-content: center;
    }

    .acciones-button {
      color: #666;
    }

    .danger-action {
      color: #f44336;
    }

    .loading-container, .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .loading-container p {
      margin: 16px 0 0 0;
      color: #666;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-container h3 {
      margin: 0 0 8px 0;
      color: #666;
      font-weight: 500;
    }

    .empty-container p {
      margin: 0 0 24px 0;
      color: #999;
    }

    .limpiar-button, .exportar-button {
      color: #666;
      border-color: #ddd;
    }

    .crear-button:hover {
      background-color: #45a049;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .filtros-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .limpiar-button:hover, .exportar-button:hover {
      background-color: #f5f5f5;
    }

    /* Estilos para el menú de columnas */
    .columnas-menu {
      min-width: 280px;
    }

    .menu-header {
      padding: 16px 16px 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .menu-header h4 {
      margin: 0;
      color: #333;
      font-weight: 600;
      font-size: 14px;
    }

    .toggle-all-button {
      font-size: 12px;
      color: #1976d2;
      padding: 4px 8px;
      min-width: auto;
      line-height: 1.2;
    }

    .columnas-list {
      padding: 8px 0;
      max-height: 300px;
      overflow-y: auto;
    }

    .columna-item {
      padding: 8px 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .columna-item:last-child {
      border-bottom: none;
    }

    .columna-checkbox {
      width: 100%;
    }

    .columna-checkbox ::ng-deep .mat-mdc-checkbox-label {
      font-size: 14px;
      color: #333;
    }
  `]
})
export class ExpedientesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private expedienteService = inject(ExpedienteService);
  private empresaService = inject(EmpresaService);

  // Estados
  isLoading = signal(false);
  filtrosAvanzados = signal(false);
  expedienteSeleccionado = signal<Expediente | null>(null);

  // Datos
  expedientes = signal<Expediente[]>([]);
  empresas = signal<Empresa[]>([]);
  dataSource = new MatTableDataSource<Expediente>();

  // Filtros
  filtrosForm: FormGroup;

  // Columnas configurables
  columnas = signal<ColumnaExpediente[]>([
    { id: 'nroExpediente', nombre: 'Número', visible: true, ordenable: true, filtrable: true },
    { id: 'fechaEmision', nombre: 'Fecha Emisión', visible: true, ordenable: true, filtrable: true },
    { id: 'tipoTramite', nombre: 'Tipo', visible: true, ordenable: true, filtrable: true },
    { id: 'estado', nombre: 'Estado', visible: true, ordenable: true, filtrable: true },
    { id: 'prioridad', nombre: 'Prioridad', visible: true, ordenable: true, filtrable: true },
    { id: 'descripcion', nombre: 'Descripción', visible: true, ordenable: false, filtrable: true },
    { id: 'folio', nombre: 'Folio', visible: false, ordenable: true, filtrable: false },
    { id: 'empresa', nombre: 'Empresa', visible: false, ordenable: false, filtrable: true }
  ]);

  // Enums disponibles en el template
  PrioridadExpediente = PrioridadExpediente;

  constructor() {
    this.filtrosForm = this.fb.group({
      numero: [''],
      tipoTramite: [''],
      estado: [''],
      prioridad: [''],
      empresaId: [''],
      fechaDesde: [null],
      fechaHasta: [null]
    });
  }

  ngOnInit(): void {
    this.cargarExpedientes();
    this.cargarEmpresas();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Carga los expedientes del sistema
   */
  private cargarExpedientes(): void {
    this.isLoading.set(true);

    // Cargar expedientes desde el servicio
    this.expedienteService.getExpedientes().subscribe({
      next: (expedientes) => {
        this.expedientes.set(expedientes);
        this.dataSource.data = expedientes;
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar expedientes:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error al cargar expedientes', 'Cerrar', {
          duration: 3000
        });

        // Fallback a datos mock en caso de error
        const expedientesMock: Expediente[] = [
          {
            id: '1',
            nroExpediente: 'E-0001-2025', // Formato correcto: E-NNNN-YYYY
            folio: 15,
            fechaEmision: new Date('2025-01-15'),
            tipoTramite: 'AUTORIZACION_NUEVA',
            tipoSolicitante: TipoSolicitante.EMPRESA,
            estado: 'EN_PROCESO',
            estaActivo: true,
            fechaRegistro: new Date('2025-01-15'),
            empresaId: 'EMP001',
            descripcion: 'AUTORIZACIÓN PARA OPERACIÓN DE TRANSPORTE DE PASAJEROS EN RUTA PUNO - JULIACA',
            observaciones: 'Expediente en revisión técnica',
            prioridad: PrioridadExpediente.ALTA
          },
          {
            id: '2',
            nroExpediente: 'E-0002-2025',
            folio: 8,
            fechaEmision: new Date('2025-01-20'),
            tipoTramite: 'RENOVACION',
            tipoSolicitante: TipoSolicitante.EMPRESA,
            estado: 'APROBADO',
            estaActivo: true,
            fechaRegistro: new Date('2025-01-20'),
            empresaId: 'EMP002',
            descripcion: 'RENOVACIÓN DE AUTORIZACIÓN PARA TRANSPORTE DE CARGA EN RUTA PUNO - AREQUIPA',
            observaciones: 'Renovación aprobada exitosamente',
            prioridad: PrioridadExpediente.NORMAL
          },
          {
            id: '3',
            nroExpediente: 'E-0003-2025',
            folio: 12,
            fechaEmision: new Date('2025-01-25'),
            tipoTramite: 'INCREMENTO',
            tipoSolicitante: TipoSolicitante.EMPRESA,
            estado: 'EN_PROCESO',
            estaActivo: true,
            fechaRegistro: new Date('2025-01-25'),
            empresaId: 'EMP003',
            descripcion: 'INCREMENTO DE UNIDADES PARA TRANSPORTE DE PASAJEROS EN RUTA PUNO - MOLLENDO',
            observaciones: 'Solicitud de incremento en revisión',
            prioridad: PrioridadExpediente.URGENTE
          },
          {
            id: '4',
            nroExpediente: 'E-0004-2025',
            folio: 6,
            fechaEmision: new Date('2025-01-30'),
            tipoTramite: 'SUSTITUCION',
            tipoSolicitante: TipoSolicitante.EMPRESA,
            estado: 'SUSPENDIDO',
            estaActivo: true,
            fechaRegistro: new Date('2025-01-30'),
            empresaId: 'EMP004',
            descripcion: 'SUSTITUCIÓN DE VEHÍCULOS EN RUTA PUNO - TACNA',
            observaciones: 'Solicitud suspendida por documentación incompleta',
            prioridad: PrioridadExpediente.CRITICA
          },
          {
            id: '5',
            nroExpediente: 'E-0005-2025',
            folio: 20,
            fechaEmision: new Date('2025-02-05'),
            tipoTramite: 'OTROS',
            tipoSolicitante: TipoSolicitante.EMPRESA,
            estado: 'RECHAZADO',
            estaActivo: false,
            fechaRegistro: new Date('2025-02-05'),
            empresaId: 'EMP005',
            descripcion: 'SOLICITUD ESPECIAL PARA TRANSPORTE DE MERCANCÍAS PELIGROSAS',
            observaciones: 'Rechazado por no cumplir normativas de seguridad',
            prioridad: PrioridadExpediente.ALTA
          }
        ];

        this.expedientes.set(expedientesMock);
        this.dataSource.data = expedientesMock;
      }
    });
  }

  /**
   * Aplica los filtros a la tabla
   */
  aplicarFiltros(): void {
    const filtros = this.filtrosForm.value;

    this.dataSource.filterPredicate = (expediente: Expediente, filter: string) => {
      const searchStr = filter.toLowerCase();

      return (
        (!filtros.numero || expediente.nroExpediente.toLowerCase().includes(filtros.numero.toLowerCase())) &&
        (!filtros.tipoTramite || expediente.tipoTramite === filtros.tipoTramite) &&
        (!filtros.estado || expediente.estado === filtros.estado) &&
        (!filtros.prioridad || expediente.prioridad === filtros.prioridad) &&
        (!filtros.fechaDesde || new Date(expediente.fechaEmision) >= filtros.fechaDesde) &&
        (!filtros.fechaHasta || new Date(expediente.fechaEmision) <= filtros.fechaHasta)
      );
    };

    this.dataSource.filter = 'aplicar';
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.aplicarFiltros();
  }

  /**
   * Toggle para mostrar/ocultar filtros avanzados
   */
  toggleFiltrosAvanzados(): void {
    this.filtrosAvanzados.update(current => !current);
  }

  /**
   * Toggle para mostrar/ocultar todas las columnas
   */
  toggleTodasColumnas(): void {
    const todasVisibles = this.todasColumnasVisibles();
    this.columnas.update(cols =>
      cols.map(col => ({ ...col, visible: !todasVisibles }))
    );
  }

  /**
   * Verifica si todas las columnas están visibles
   */
  todasColumnasVisibles(): boolean {
    return this.columnas().every(col => col.visible);
  }

  /**
   * Toggle para mostrar/ocultar una columna específica
   */
  toggleColumna(columnaId: string, visible: boolean): void {
    this.columnas.update(cols =>
      cols.map(col =>
        col.id === columnaId ? { ...col, visible } : col
      )
    );
  }

  /**
   * Verifica si una columna está visible
   */
  columnaVisible(columnaId: string): boolean {
    return this.columnas().find(col => col.id === columnaId)?.visible || false;
  }

  /**
   * Obtiene las columnas visibles para la tabla
   */
  columnasVisibles(): string[] {
    return this.columnas()
      .filter(col => col.visible)
      .map(col => col.id)
      .concat(['acciones']);
  }

  /**
   * Obtiene el total de expedientes
   */
  totalExpedientes(): number {
    return this.dataSource.data.length;
  }

  /**
   * Selecciona un expediente
   */
  seleccionarExpediente(expediente: Expediente): void {
    this.expedienteSeleccionado.set(expediente);
  }

  /**
   * Abre el modal para crear un nuevo expediente
   */
  abrirModalCrearExpediente(): void {
    const dialogRef = this.dialog.open(CrearExpedienteModalComponent, {
      width: '800px',
      data: {}
    });

    dialogRef.afterClosed().subscribe((expedienteCreado: Expediente) => {
      if (expedienteCreado) {
        // Agregar el expediente creado a la lista
        this.expedientes.update(current => [...current, expedienteCreado]);

        // Actualizar el dataSource y notificar el cambio
        this.dataSource.data = this.expedientes();

        // Forzar la actualización de la tabla
        this.dataSource._updateChangeSubscription();

        // Recargar expedientes desde el servicio para asegurar sincronización
        this.recargarExpedientes();

        this.snackBar.open('Expediente creado exitosamente', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  /**
   * Carga las empresas del sistema
   */
  private cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);
      },
      error: (error) => {
        console.error('Error al cargar empresas:', error);
      }
    });
  }

  /**
   * Obtiene el nombre de una empresa por su ID
   */
  getEmpresaNombre(empresaId: string | undefined): string {
    if (!empresaId) return 'Sin empresa';
    const empresa = this.empresas().find(e => e.id === empresaId);
    return empresa ? empresa.razonSocial.principal : 'Empresa no encontrada';
  }

  /**
   * Navegar a la página de carga masiva de expedientes
   */
  cargaMasivaExpedientes(): void {
    this.router.navigate(['/expedientes/carga-masiva']);
  }

  /**
   * Ver detalle de un expediente
   */
  verDetalleExpediente(expediente: Expediente): void {
    this.router.navigate(['/expedientes', expediente.id]);
  }

  /**
   * Ver detalle de un expediente (método alternativo para compatibilidad)
   */
  verDetalleExpedienteOld(expediente: Expediente): void {
    // Método antiguo con snackbar
    this.snackBar.open(`Ver detalle de expediente: ${expediente.nroExpediente}`, 'Cerrar', {
      duration: 3000
    });
  }

  /**
   * Editar un expediente
   */
  editarExpediente(expediente: Expediente): void {
    // TODO: Implementar edición
    this.snackBar.open(`Editar expediente: ${expediente.nroExpediente}`, 'Cerrar', {
      duration: 3000
    });
  }

  /**
   * Duplicar un expediente
   */
  duplicarExpediente(expediente: Expediente): void {
    // TODO: Implementar duplicación
    this.snackBar.open(`Duplicar expediente: ${expediente.nroExpediente}`, 'Cerrar', {
      duration: 3000
    });
  }

  /**
   * Cambiar estado de un expediente
   */
  cambiarEstadoExpediente(expediente: Expediente, nuevoEstado: EstadoExpediente): void {
    // TODO: Implementar cambio de estado
    this.snackBar.open(`Cambiar estado a ${nuevoEstado}`, 'Cerrar', {
      duration: 3000
    });
  }

  /**
   * Archivar un expediente
   */
  archivarExpediente(expediente: Expediente): void {
    // TODO: Implementar archivado
    this.snackBar.open(`Archivar expediente: ${expediente.nroExpediente}`, 'Cerrar', {
      duration: 3000
    });
  }

  /**
   * Eliminar un expediente
   */
  eliminarExpediente(expediente: Expediente): void {
    // TODO: Implementar eliminación con confirmación
    this.snackBar.open(`Eliminar expediente: ${expediente.nroExpediente}`, 'Cerrar', {
      duration: 3000
    });
  }

  /**
   * Recargar expedientes
   */
  recargarExpedientes(): void {
    this.cargarExpedientes();
  }

  /**
   * Exportar expedientes
   */
  exportarExpedientes(): void {
    // TODO: Implementar exportación
    this.snackBar.open('Exportando expedientes...', 'Cerrar', {
      duration: 3000
    });
  }
} 