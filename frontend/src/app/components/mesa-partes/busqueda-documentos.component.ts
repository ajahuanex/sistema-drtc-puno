import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { DocumentoService } from '../../services/mesa-partes/documento.service';
import { 
  Documento, 
  FiltrosDocumento, 
  EstadoDocumento, 
  PrioridadDocumento,
  TipoDocumento 
} from '../../models/mesa-partes/documento.model';

@Component({
  selector: 'app-busqueda-documentos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="busqueda-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h2>
            <mat-icon>search</mat-icon>
            Búsqueda Avanzada de Documentos
          </h2>
          <p class="subtitle">Encuentra documentos utilizando múltiples criterios de búsqueda</p>
        </div>
      </div>

      <!-- Formulario de Búsqueda -->
      <mat-card class="search-form-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>filter_list</mat-icon>
            Criterios de Búsqueda
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="searchForm" class="search-form">
            <!-- Primera fila -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Número de Expediente</mat-label>
                <input 
                  matInput 
                  formControlName="numeroExpediente"
                  placeholder="EXP-2025-0001"
                  maxlength="50">
                <mat-icon matSuffix>confirmation_number</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Código QR</mat-label>
                <input 
                  matInput 
                  formControlName="codigoQR"
                  placeholder="Ingrese código QR"
                  maxlength="100">
                <mat-icon matSuffix>qr_code</mat-icon>
                <button 
                  mat-icon-button 
                  matSuffix 
                  type="button"
                  matTooltip="Escanear código QR"
                  (click)="escanearQR()">
                  <mat-icon>qr_code_scanner</mat-icon>
                </button>
              </mat-form-field>
            </div>

            <!-- Segunda fila -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Remitente</mat-label>
                <input 
                  matInput 
                  formControlName="remitente"
                  placeholder="Nombre del remitente"
                  maxlength="255">
                <mat-icon matSuffix>person</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Asunto</mat-label>
                <input 
                  matInput 
                  formControlName="asunto"
                  placeholder="Asunto del documento"
                  maxlength="500">
                <mat-icon matSuffix>subject</mat-icon>
              </mat-form-field>
            </div>

            <!-- Tercera fila -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Tipo de Documento</mat-label>
                <mat-select formControlName="tipoDocumentoId">
                  <mat-option value="">Todos los tipos</mat-option>
                  <mat-option 
                    *ngFor="let tipo of tiposDocumento" 
                    [value]="tipo.id">
                    {{ tipo.nombre }}
                  </mat-option>
                </mat-select>
                <mat-icon matSuffix>description</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado">
                  <mat-option value="">Todos los estados</mat-option>
                  <mat-option 
                    *ngFor="let estado of estadosDocumento" 
                    [value]="estado.value">
                    {{ estado.label }}
                  </mat-option>
                </mat-select>
                <mat-icon matSuffix>flag</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Prioridad</mat-label>
                <mat-select formControlName="prioridad">
                  <mat-option value="">Todas las prioridades</mat-option>
                  <mat-option 
                    *ngFor="let prioridad of prioridadesDocumento" 
                    [value]="prioridad.value">
                    {{ prioridad.label }}
                  </mat-option>
                </mat-select>
                <mat-icon matSuffix>priority_high</mat-icon>
              </mat-form-field>
            </div>

            <!-- Cuarta fila - Rango de fechas -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Fecha desde</mat-label>
                <input 
                  matInput 
                  [matDatepicker]="fechaDesde"
                  formControlName="fechaDesde"
                  readonly>
                <mat-datepicker-toggle matSuffix [for]="fechaDesde"></mat-datepicker-toggle>
                <mat-datepicker #fechaDesde></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Fecha hasta</mat-label>
                <input 
                  matInput 
                  [matDatepicker]="fechaHasta"
                  formControlName="fechaHasta"
                  readonly>
                <mat-datepicker-toggle matSuffix [for]="fechaHasta"></mat-datepicker-toggle>
                <mat-datepicker #fechaHasta></mat-datepicker>
              </mat-form-field>
            </div>

            <!-- Botones de acción -->
            <div class="form-actions">
              <button 
                mat-raised-button 
                color="primary" 
                type="button"
                [disabled]="loading"
                (click)="buscarDocumentos()">
                <mat-icon>search</mat-icon>
                Buscar
              </button>

              <button 
                mat-button 
                type="button"
                (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>

              <button 
                mat-button 
                type="button"
                [disabled]="!hayResultados"
                (click)="exportarResultados()">
                <mat-icon>download</mat-icon>
                Exportar
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Filtros activos -->
      <div class="active-filters" *ngIf="filtrosActivos.length > 0">
        <h4>Filtros activos:</h4>
        <mat-chip-set>
          <mat-chip 
            *ngFor="let filtro of filtrosActivos"
            [removable]="true"
            (removed)="removerFiltro(filtro.key)">
            {{ filtro.label }}: {{ filtro.value }}
            <mat-icon matChipRemove>cancel</mat-icon>
          </mat-chip>
        </mat-chip-set>
      </div>

      <!-- Resultados -->
      <mat-card class="results-card" *ngIf="busquedaRealizada">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>list</mat-icon>
            Resultados de Búsqueda
            <span class="results-count" *ngIf="!loading">
              ({{ totalResultados }} documento{{ totalResultados !== 1 ? 's' : '' }} encontrado{{ totalResultados !== 1 ? 's' : '' }})
            </span>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Loading spinner -->
          <div class="loading-container" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Buscando documentos...</p>
          </div>

          <!-- Sin resultados -->
          <div class="no-results" *ngIf="!loading && documentos.length === 0 && busquedaRealizada">
            <mat-icon class="no-results-icon">search_off</mat-icon>
            <h3>No se encontraron documentos</h3>
            <p>Intenta modificar los criterios de búsqueda</p>
          </div>

          <!-- Tabla de resultados -->
          <div class="table-container" *ngIf="!loading && documentos.length > 0">
            <table mat-table [dataSource]="documentos" matSort (matSortChange)="onSortChange($event)">
              <!-- Columna: Expediente -->
              <ng-container matColumnDef="numeroExpediente">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Expediente</th>
                <td mat-cell *matCellDef="let documento">
                  <div class="expediente-cell">
                    <strong>{{ documento.numeroExpediente }}</strong>
                    <small *ngIf="documento.numeroDocumentoExterno">
                      Ext: {{ documento.numeroDocumentoExterno }}
                    </small>
                  </div>
                </td>
              </ng-container>

              <!-- Columna: Tipo -->
              <ng-container matColumnDef="tipo">
                <th mat-header-cell *matHeaderCellDef>Tipo</th>
                <td mat-cell *matCellDef="let documento">
                  <div class="tipo-cell">
                    <mat-icon class="tipo-icon">description</mat-icon>
                    {{ documento.tipoDocumento.nombre }}
                  </div>
                </td>
              </ng-container>

              <!-- Columna: Remitente -->
              <ng-container matColumnDef="remitente">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Remitente</th>
                <td mat-cell *matCellDef="let documento">
                  <div class="remitente-cell">
                    <mat-icon class="remitente-icon">person</mat-icon>
                    {{ documento.remitente }}
                  </div>
                </td>
              </ng-container>

              <!-- Columna: Asunto -->
              <ng-container matColumnDef="asunto">
                <th mat-header-cell *matHeaderCellDef>Asunto</th>
                <td mat-cell *matCellDef="let documento">
                  <div class="asunto-cell" [matTooltip]="documento.asunto">
                    {{ documento.asunto | slice:0:50 }}{{ documento.asunto.length > 50 ? '...' : '' }}
                  </div>
                </td>
              </ng-container>

              <!-- Columna: Estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let documento">
                  <span class="estado-badge" [ngClass]="'estado-' + documento.estado.toLowerCase()">
                    <mat-icon class="estado-icon">{{ getEstadoIcon(documento.estado) }}</mat-icon>
                    {{ getEstadoLabel(documento.estado) }}
                  </span>
                </td>
              </ng-container>

              <!-- Columna: Prioridad -->
              <ng-container matColumnDef="prioridad">
                <th mat-header-cell *matHeaderCellDef>Prioridad</th>
                <td mat-cell *matCellDef="let documento">
                  <span class="prioridad-badge" [ngClass]="'prioridad-' + documento.prioridad.toLowerCase()">
                    <mat-icon class="prioridad-icon">{{ getPrioridadIcon(documento.prioridad) }}</mat-icon>
                    {{ getPrioridadLabel(documento.prioridad) }}
                  </span>
                </td>
              </ng-container>

              <!-- Columna: Fecha -->
              <ng-container matColumnDef="fechaRecepcion">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha Recepción</th>
                <td mat-cell *matCellDef="let documento">
                  <div class="fecha-cell">
                    <mat-icon class="fecha-icon">event</mat-icon>
                    {{ documento.fechaRecepcion | date:'dd/MM/yyyy HH:mm' }}
                  </div>
                </td>
              </ng-container>

              <!-- Columna: Acciones -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let documento">
                  <div class="acciones-cell">
                    <button 
                      mat-icon-button 
                      matTooltip="Ver detalle"
                      (click)="verDetalle(documento)">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    
                    <button 
                      mat-icon-button 
                      matTooltip="Descargar comprobante"
                      (click)="descargarComprobante(documento)">
                      <mat-icon>download</mat-icon>
                    </button>

                    <button 
                      mat-icon-button 
                      matTooltip="Ver código QR"
                      (click)="verQR(documento)">
                      <mat-icon>qr_code</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Paginación -->
            <mat-paginator
              [length]="totalResultados"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50, 100]"
              [pageIndex]="currentPage"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .busqueda-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 24px;
    }

    .header-content h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
    }

    .header-content h2 mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #667eea;
    }

    .subtitle {
      margin: 0;
      color: #6c757d;
      font-size: 14px;
    }

    .search-form-card {
      margin-bottom: 24px;
    }

    .search-form-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
    }

    .search-form {
      margin-top: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .form-field {
      flex: 1;
      min-width: 250px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }

    .active-filters {
      margin-bottom: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .active-filters h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: #495057;
    }

    .results-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
    }

    .results-count {
      font-size: 14px;
      font-weight: normal;
      color: #6c757d;
      margin-left: 8px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .loading-container p {
      margin-top: 16px;
      color: #6c757d;
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .no-results-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #cbd5e0;
      margin-bottom: 16px;
    }

    .no-results h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .no-results p {
      margin: 0;
      color: #6c757d;
    }

    .table-container {
      overflow-x: auto;
    }

    .mat-mdc-table {
      width: 100%;
    }

    .expediente-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .expediente-cell small {
      color: #6c757d;
      font-size: 11px;
    }

    .tipo-cell,
    .remitente-cell,
    .fecha-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tipo-icon,
    .remitente-icon,
    .fecha-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #6c757d;
    }

    .asunto-cell {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .estado-badge,
    .prioridad-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .estado-registrado {
      background: #e3f2fd;
      color: #1976d2;
    }

    .estado-en_proceso {
      background: #fff3e0;
      color: #f57c00;
    }

    .estado-atendido {
      background: #e8f5e8;
      color: #388e3c;
    }

    .estado-archivado {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .prioridad-normal {
      background: #f5f5f5;
      color: #616161;
    }

    .prioridad-alta {
      background: #fff3e0;
      color: #f57c00;
    }

    .prioridad-urgente {
      background: #ffebee;
      color: #d32f2f;
    }

    .estado-icon,
    .prioridad-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .acciones-cell {
      display: flex;
      gap: 4px;
    }

    .acciones-cell button {
      width: 32px;
      height: 32px;
    }

    .acciones-cell mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .busqueda-container {
        padding: 16px;
      }

      .form-row {
        flex-direction: column;
      }

      .form-field {
        min-width: unset;
      }
    }

    @media (max-width: 768px) {
      .busqueda-container {
        padding: 12px;
      }

      .header-content h2 {
        font-size: 20px;
      }

      .form-actions {
        flex-direction: column;
      }

      .form-actions button {
        width: 100%;
      }

      .table-container {
        font-size: 14px;
      }

      .asunto-cell {
        max-width: 200px;
      }
    }
  `]
})
export class BusquedaDocumentosComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private documentoService = inject(DocumentoService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Formulario de búsqueda
  searchForm: FormGroup;

  // Estado del componente
  loading = false;
  busquedaRealizada = false;
  hayResultados = false;

  // Datos
  documentos: Documento[] = [];
  tiposDocumento: TipoDocumento[] = [];
  totalResultados = 0;
  currentPage = 0;
  pageSize = 25;

  // Configuración de tabla
  displayedColumns: string[] = [
    'numeroExpediente',
    'tipo',
    'remitente',
    'asunto',
    'estado',
    'prioridad',
    'fechaRecepcion',
    'acciones'
  ];

  // Opciones para selects
  estadosDocumento = [
    { value: EstadoDocumento.REGISTRADO, label: 'Registrado' },
    { value: EstadoDocumento.EN_PROCESO, label: 'En Proceso' },
    { value: EstadoDocumento.ATENDIDO, label: 'Atendido' },
    { value: EstadoDocumento.ARCHIVADO, label: 'Archivado' }
  ];

  prioridadesDocumento = [
    { value: PrioridadDocumento.NORMAL, label: 'Normal' },
    { value: PrioridadDocumento.ALTA, label: 'Alta' },
    { value: PrioridadDocumento.URGENTE, label: 'Urgente' }
  ];

  // Filtros activos
  filtrosActivos: Array<{key: string, label: string, value: string}> = [];

  // Ordenamiento
  currentSort: Sort = { active: 'fechaRecepcion', direction: 'desc' };

  constructor() {
    this.searchForm = this.fb.group({
      numeroExpediente: [''],
      codigoQR: [''],
      remitente: [''],
      asunto: [''],
      tipoDocumentoId: [''],
      estado: [''],
      prioridad: [''],
      fechaDesde: [null],
      fechaHasta: [null]
    });
  }

  ngOnInit(): void {
    this.cargarTiposDocumento();
    this.configurarBusquedaEnTiempoReal();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar tipos de documento disponibles
   * Requirements: 2.1
   */
  private cargarTiposDocumento(): void {
    this.documentoService.obtenerTiposDocumento()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tipos) => {
          this.tiposDocumento = tipos;
        },
        error: (error) => {
          console.error('Error al cargar tipos de documento:', error);
          this.snackBar.open('Error al cargar tipos de documento', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Configurar búsqueda en tiempo real para campos específicos
   * Requirements: 5.1, 5.2
   */
  private configurarBusquedaEnTiempoReal(): void {
    // Búsqueda automática por número de expediente
    this.searchForm.get('numeroExpediente')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        if (value && value.length >= 3) {
          this.buscarDocumentos();
        }
      });

    // Búsqueda automática por código QR
    this.searchForm.get('codigoQR')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        if (value && value.length >= 5) {
          this.buscarPorQR(value);
        }
      });
  }

  /**
   * Realizar búsqueda de documentos
   * Requirements: 5.1, 5.2, 5.3
   */
  buscarDocumentos(): void {
    this.loading = true;
    this.busquedaRealizada = true;

    const filtros = this.construirFiltros();
    this.actualizarFiltrosActivos(filtros);

    this.documentoService.listarDocumentos(filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.documentos = response.documentos;
          this.totalResultados = response.total;
          this.currentPage = response.page;
          this.hayResultados = this.documentos.length > 0;
          this.loading = false;

          if (this.documentos.length === 0) {
            this.snackBar.open('No se encontraron documentos con los criterios especificados', 'Cerrar', {
              duration: 3000
            });
          }
        },
        error: (error) => {
          console.error('Error en búsqueda:', error);
          this.loading = false;
          this.snackBar.open('Error al realizar la búsqueda', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Búsqueda específica por código QR
   * Requirements: 5.7
   */
  private buscarPorQR(codigoQR: string): void {
    this.loading = true;
    this.busquedaRealizada = true;

    this.documentoService.buscarPorQR(codigoQR)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documento) => {
          this.documentos = [documento];
          this.totalResultados = 1;
          this.currentPage = 0;
          this.hayResultados = true;
          this.loading = false;
          
          this.snackBar.open('Documento encontrado por código QR', 'Cerrar', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error en búsqueda por QR:', error);
          this.loading = false;
          this.documentos = [];
          this.totalResultados = 0;
          this.hayResultados = false;
          
          this.snackBar.open('No se encontró documento con ese código QR', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Construir objeto de filtros desde el formulario
   * Requirements: 5.1, 5.2, 5.3
   */
  private construirFiltros(): FiltrosDocumento {
    const formValue = this.searchForm.value;
    const filtros: FiltrosDocumento = {
      page: this.currentPage,
      pageSize: this.pageSize
    };

    if (formValue.numeroExpediente?.trim()) {
      filtros.numeroExpediente = formValue.numeroExpediente.trim();
    }

    if (formValue.remitente?.trim()) {
      filtros.remitente = formValue.remitente.trim();
    }

    if (formValue.asunto?.trim()) {
      filtros.asunto = formValue.asunto.trim();
    }

    if (formValue.tipoDocumentoId) {
      filtros.tipoDocumentoId = formValue.tipoDocumentoId;
    }

    if (formValue.estado) {
      filtros.estado = formValue.estado;
    }

    if (formValue.prioridad) {
      filtros.prioridad = formValue.prioridad;
    }

    if (formValue.fechaDesde) {
      filtros.fechaDesde = formValue.fechaDesde;
    }

    if (formValue.fechaHasta) {
      filtros.fechaHasta = formValue.fechaHasta;
    }

    return filtros;
  }

  /**
   * Actualizar lista de filtros activos
   * Requirements: 5.2
   */
  private actualizarFiltrosActivos(filtros: FiltrosDocumento): void {
    this.filtrosActivos = [];

    if (filtros.numeroExpediente) {
      this.filtrosActivos.push({
        key: 'numeroExpediente',
        label: 'Expediente',
        value: filtros.numeroExpediente
      });
    }

    if (filtros.remitente) {
      this.filtrosActivos.push({
        key: 'remitente',
        label: 'Remitente',
        value: filtros.remitente
      });
    }

    if (filtros.asunto) {
      this.filtrosActivos.push({
        key: 'asunto',
        label: 'Asunto',
        value: filtros.asunto.length > 30 ? filtros.asunto.substring(0, 30) + '...' : filtros.asunto
      });
    }

    if (filtros.tipoDocumentoId) {
      const tipo = this.tiposDocumento.find(t => t.id === filtros.tipoDocumentoId);
      this.filtrosActivos.push({
        key: 'tipoDocumentoId',
        label: 'Tipo',
        value: tipo?.nombre || filtros.tipoDocumentoId
      });
    }

    if (filtros.estado) {
      const estado = this.estadosDocumento.find(e => e.value === filtros.estado);
      this.filtrosActivos.push({
        key: 'estado',
        label: 'Estado',
        value: estado?.label || filtros.estado
      });
    }

    if (filtros.prioridad) {
      const prioridad = this.prioridadesDocumento.find(p => p.value === filtros.prioridad);
      this.filtrosActivos.push({
        key: 'prioridad',
        label: 'Prioridad',
        value: prioridad?.label || filtros.prioridad
      });
    }

    if (filtros.fechaDesde) {
      this.filtrosActivos.push({
        key: 'fechaDesde',
        label: 'Desde',
        value: filtros.fechaDesde.toLocaleDateString()
      });
    }

    if (filtros.fechaHasta) {
      this.filtrosActivos.push({
        key: 'fechaHasta',
        label: 'Hasta',
        value: filtros.fechaHasta.toLocaleDateString()
      });
    }
  }

  /**
   * Remover filtro específico
   * Requirements: 5.2
   */
  removerFiltro(key: string): void {
    this.searchForm.patchValue({ [key]: key.includes('fecha') ? null : '' });
    this.buscarDocumentos();
  }

  /**
   * Limpiar todos los filtros
   * Requirements: 5.2
   */
  limpiarFiltros(): void {
    this.searchForm.reset();
    this.filtrosActivos = [];
    this.documentos = [];
    this.totalResultados = 0;
    this.busquedaRealizada = false;
    this.hayResultados = false;
  }

  /**
   * Manejar cambio de página
   * Requirements: 5.1
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.buscarDocumentos();
  }

  /**
   * Manejar cambio de ordenamiento
   * Requirements: 5.1
   */
  onSortChange(sort: Sort): void {
    this.currentSort = sort;
    this.buscarDocumentos();
  }

  /**
   * Escanear código QR (placeholder)
   * Requirements: 5.7
   */
  escanearQR(): void {
    // TODO: Implementar escáner de QR usando cámara
    this.snackBar.open('Funcionalidad de escáner QR próximamente disponible', 'Cerrar', {
      duration: 3000
    });
  }

  /**
   * Ver detalle del documento
   * Requirements: 5.4
   */
  verDetalle(documento: Documento): void {
    console.log('Ver detalle del documento:', documento);
    // TODO: Abrir modal o navegar a vista de detalle
    this.snackBar.open(`Ver detalle de ${documento.numeroExpediente}`, 'Cerrar', {
      duration: 2000
    });
  }

  /**
   * Descargar comprobante del documento
   * Requirements: 1.6, 1.7
   */
  descargarComprobante(documento: Documento): void {
    this.documentoService.descargarComprobante(documento.id, documento.numeroExpediente);
    this.snackBar.open('Descargando comprobante...', 'Cerrar', {
      duration: 2000
    });
  }

  /**
   * Ver código QR del documento
   * Requirements: 1.6, 5.7
   */
  verQR(documento: Documento): void {
    console.log('Ver QR del documento:', documento);
    // TODO: Mostrar modal con código QR
    this.snackBar.open(`QR de ${documento.numeroExpediente}`, 'Cerrar', {
      duration: 2000
    });
  }

  /**
   * Exportar resultados de búsqueda
   * Requirements: 5.6
   */
  exportarResultados(): void {
    const filtros = this.construirFiltros();
    
    // Remover paginación para exportar todos los resultados
    delete filtros.page;
    delete filtros.pageSize;

    this.documentoService.exportarExcel(filtros).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `busqueda_documentos_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('Resultados exportados exitosamente', 'Cerrar', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error al exportar:', error);
        this.snackBar.open('Error al exportar resultados', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  /**
   * Obtener icono para estado
   * Requirements: 5.4
   */
  getEstadoIcon(estado: EstadoDocumento): string {
    switch (estado) {
      case EstadoDocumento.REGISTRADO:
        return 'fiber_new';
      case EstadoDocumento.EN_PROCESO:
        return 'hourglass_empty';
      case EstadoDocumento.ATENDIDO:
        return 'check_circle';
      case EstadoDocumento.ARCHIVADO:
        return 'archive';
      default:
        return 'help';
    }
  }

  /**
   * Obtener etiqueta para estado
   * Requirements: 5.4
   */
  getEstadoLabel(estado: EstadoDocumento): string {
    const estadoObj = this.estadosDocumento.find(e => e.value === estado);
    return estadoObj?.label || estado;
  }

  /**
   * Obtener icono para prioridad
   * Requirements: 5.4
   */
  getPrioridadIcon(prioridad: PrioridadDocumento): string {
    switch (prioridad) {
      case PrioridadDocumento.NORMAL:
        return 'remove';
      case PrioridadDocumento.ALTA:
        return 'keyboard_arrow_up';
      case PrioridadDocumento.URGENTE:
        return 'priority_high';
      default:
        return 'help';
    }
  }

  /**
   * Obtener etiqueta para prioridad
   * Requirements: 5.4
   */
  getPrioridadLabel(prioridad: PrioridadDocumento): string {
    const prioridadObj = this.prioridadesDocumento.find(p => p.value === prioridad);
    return prioridadObj?.label || prioridad;
  }
}