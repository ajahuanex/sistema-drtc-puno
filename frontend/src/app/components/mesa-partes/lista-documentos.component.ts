import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DocumentoService } from '../../services/mesa-partes/documento.service';
import { DetalleDocumentoComponent } from './detalle-documento.component';
import { 
  Documento, 
  FiltrosDocumento, 
  EstadoDocumento, 
  PrioridadDocumento 
} from '../../models/mesa-partes/documento.model';
import { SortableHeaderComponent, DireccionOrdenamiento, EventoOrdenamiento } from '../../shared/sortable-header.component';
import { OrdenamientoColumna } from '../../models/resolucion-table.model';
import { DocumentosFiltrosComponent } from './documentos-filters.component';

/**
 * Componente para listar documentos con tabla, paginación y ordenamiento
 * Requirements: 5.1, 5.2, 5.4, 5.6
 */
@Component({
  selector: 'app-lista-documentos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    SortableHeaderComponent,
    DocumentosFiltrosComponent
  ],
  template: `
    <div class="lista-documentos-container">
      <!-- Filtros -->
      <app-documentos-filters
        (filtrosChange)="onFiltrosChange($event)">
      </app-documentos-filters>

      <!-- Barra de herramientas -->
      <div class="toolbar">
        <div class="toolbar-info">
          <span class="results-count">
            {{ totalDocumentos() }} documento(s) encontrado(s)
          </span>
        </div>

        <div class="toolbar-actions">
          <!-- Botón de exportar -->
          <button mat-button 
                  [matMenuTriggerFor]="exportMenu"
                  [disabled]="documentos().length === 0">
            <mat-icon>download</mat-icon>
            Exportar
          </button>

          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportarExcel()">
              <mat-icon>table_chart</mat-icon>
              <span>Exportar a Excel</span>
            </button>
            <button mat-menu-item (click)="exportarPDF()">
              <mat-icon>picture_as_pdf</mat-icon>
              <span>Exportar a PDF</span>
            </button>
          </mat-menu>

          <!-- Botón de refrescar -->
          <button mat-icon-button 
                  matTooltip="Refrescar lista"
                  (click)="cargarDocumentos()">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Tabla de documentos -->
      <div class="table-container">
        @if (cargando()) {
          <div class="loading-container">
            <mat-spinner diameter="48"></mat-spinner>
            <p>Cargando documentos...</p>
          </div>
        } @else if (error()) {
          <div class="error-container">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <h3>Error al cargar documentos</h3>
            <p>{{ error() }}</p>
            <button mat-raised-button color="primary" (click)="cargarDocumentos()">
              <mat-icon>refresh</mat-icon>
              Reintentar
            </button>
          </div>
        } @else if (documentos().length === 0) {
          <div class="empty-container">
            <mat-icon class="empty-icon">inbox</mat-icon>
            <h3>No hay documentos</h3>
            <p>No se encontraron documentos con los filtros aplicados</p>
          </div>
        } @else {
          <table mat-table [dataSource]="documentos()" class="documentos-table">
            
            <!-- Columna: Número de Expediente -->
            <ng-container matColumnDef="numeroExpediente">
              <th mat-header-cell *matHeaderCellDef>
                <app-sortable-header
                  columna="numeroExpediente"
                  label="Expediente"
                  [ordenamiento]="ordenamiento()"
                  [sortable]="true"
                  (ordenamientoChange)="onOrdenamientoChange($event)">
                </app-sortable-header>
              </th>
              <td mat-cell *matCellDef="let documento" class="expediente-cell">
                <div class="expediente-content">
                  <span class="expediente-numero">{{ documento.numeroExpediente }}</span>
                  @if (documento.expedienteRelacionado) {
                    <mat-icon class="relacionado-icon" matTooltip="Relacionado con otro expediente">link</mat-icon>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Columna: Tipo de Documento -->
            <ng-container matColumnDef="tipoDocumento">
              <th mat-header-cell *matHeaderCellDef>
                <app-sortable-header
                  columna="tipoDocumento"
                  label="Tipo"
                  [ordenamiento]="ordenamiento()"
                  [sortable]="true"
                  (ordenamientoChange)="onOrdenamientoChange($event)">
                </app-sortable-header>
              </th>
              <td mat-cell *matCellDef="let documento">
                <span class="tipo-documento">{{ documento.tipoDocumento.nombre }}</span>
              </td>
            </ng-container>

            <!-- Columna: Remitente -->
            <ng-container matColumnDef="remitente">
              <th mat-header-cell *matHeaderCellDef>
                <app-sortable-header
                  columna="remitente"
                  label="Remitente"
                  [ordenamiento]="ordenamiento()"
                  [sortable]="true"
                  (ordenamientoChange)="onOrdenamientoChange($event)">
                </app-sortable-header>
              </th>
              <td mat-cell *matCellDef="let documento" class="remitente-cell">
                <span class="remitente-nombre">{{ documento.remitente }}</span>
              </td>
            </ng-container>

            <!-- Columna: Asunto -->
            <ng-container matColumnDef="asunto">
              <th mat-header-cell *matHeaderCellDef>
                <app-sortable-header
                  columna="asunto"
                  label="Asunto"
                  [ordenamiento]="ordenamiento()"
                  [sortable]="true"
                  (ordenamientoChange)="onOrdenamientoChange($event)">
                </app-sortable-header>
              </th>
              <td mat-cell *matCellDef="let documento" class="asunto-cell">
                <span class="asunto-texto" [matTooltip]="documento.asunto">
                  {{ documento.asunto }}
                </span>
              </td>
            </ng-container>

            <!-- Columna: Estado -->
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>
                <app-sortable-header
                  columna="estado"
                  label="Estado"
                  [ordenamiento]="ordenamiento()"
                  [sortable]="true"
                  (ordenamientoChange)="onOrdenamientoChange($event)">
                </app-sortable-header>
              </th>
              <td mat-cell *matCellDef="let documento">
                <mat-chip [class]="'estado-chip estado-' + documento.estado.toLowerCase()">
                  {{ getEstadoTexto(documento.estado) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Columna: Prioridad -->
            <ng-container matColumnDef="prioridad">
              <th mat-header-cell *matHeaderCellDef>
                <app-sortable-header
                  columna="prioridad"
                  label="Prioridad"
                  [ordenamiento]="ordenamiento()"
                  [sortable]="true"
                  (ordenamientoChange)="onOrdenamientoChange($event)">
                </app-sortable-header>
              </th>
              <td mat-cell *matCellDef="let documento">
                <div class="prioridad-indicator" [class]="'prioridad-' + documento.prioridad.toLowerCase()">
                  <mat-icon class="prioridad-icon">{{ getPrioridadIcono(documento.prioridad) }}</mat-icon>
                  <span class="prioridad-texto">{{ getPrioridadTexto(documento.prioridad) }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Columna: Fecha de Recepción -->
            <ng-container matColumnDef="fechaRecepcion">
              <th mat-header-cell *matHeaderCellDef>
                <app-sortable-header
                  columna="fechaRecepcion"
                  label="Fecha"
                  [ordenamiento]="ordenamiento()"
                  [sortable]="true"
                  (ordenamientoChange)="onOrdenamientoChange($event)">
                </app-sortable-header>
              </th>
              <td mat-cell *matCellDef="let documento">
                <div class="fecha-content">
                  <span class="fecha-texto">{{ formatearFecha(documento.fechaRecepcion) }}</span>
                  @if (documento.fechaLimite) {
                    <span class="fecha-limite" [class.vencido]="estaVencido(documento.fechaLimite)">
                      <mat-icon class="limite-icon">schedule</mat-icon>
                      {{ formatearFecha(documento.fechaLimite) }}
                    </span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Columna: Acciones -->
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef class="acciones-header">
                Acciones
              </th>
              <td mat-cell *matCellDef="let documento" class="acciones-cell">
                <div class="acciones-buttons">
                  <button mat-icon-button 
                          matTooltip="Ver detalle"
                          (click)="onVerDetalle(documento)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  
                  <button mat-icon-button 
                          matTooltip="Derivar documento"
                          [disabled]="documento.estado === 'ARCHIVADO'"
                          (click)="onDerivar(documento)">
                    <mat-icon>send</mat-icon>
                  </button>
                  
                  <button mat-icon-button 
                          matTooltip="Archivar documento"
                          [disabled]="documento.estado === 'ARCHIVADO'"
                          (click)="onArchivar(documento)">
                    <mat-icon>archive</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <!-- Definición de filas -->
            <tr mat-header-row *matHeaderRowDef="columnasVisibles"></tr>
            <tr mat-row *matRowDef="let row; columns: columnasVisibles;" 
                class="documento-row"
                [class.row-urgente]="row.prioridad === 'URGENTE'"
                (click)="onVerDetalle(row)">
            </tr>
          </table>
        }
      </div>

      <!-- Paginador -->
      @if (!cargando() && !error() && documentos().length > 0) {
        <mat-paginator
          [length]="totalDocumentos()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[10, 25, 50, 100]"
          [pageIndex]="pageIndex()"
          (page)="onPageChange($event)"
          showFirstLastButtons
          class="documentos-paginator">
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .lista-documentos-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 0;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: white;
      border-radius: 8px;
      margin-bottom: 1px;
    }

    .toolbar-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .results-count {
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.7);
    }

    .toolbar-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .table-container {
      flex: 1;
      overflow: auto;
      position: relative;
      background: white;
      border-radius: 8px;
    }

    .documentos-table {
      width: 100%;
      background: white;
    }

    .documentos-table th {
      background-color: #fafbfc;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.7);
      padding: 12px 16px;
      border-bottom: 2px solid #e1e4e8;
    }

    .documentos-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e1e4e8;
    }

    .documento-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .documento-row:hover {
      background-color: #f5f7fa;
    }

    .documento-row.row-urgente {
      border-left: 4px solid #f44336;
    }

    /* Columna Expediente */
    .expediente-cell {
      font-weight: 500;
    }

    .expediente-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .expediente-numero {
      color: #1976d2;
      font-family: monospace;
    }

    .relacionado-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #ff9800;
    }

    /* Columna Tipo */
    .tipo-documento {
      display: inline-block;
      padding: 4px 12px;
      background-color: #e3f2fd;
      color: #1976d2;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    /* Columna Remitente */
    .remitente-cell {
      max-width: 200px;
    }

    .remitente-nombre {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Columna Asunto */
    .asunto-cell {
      max-width: 300px;
    }

    .asunto-texto {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Columna Estado */
    .estado-chip {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      min-height: 24px;
      padding: 0 12px;
    }

    .estado-chip.estado-registrado {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .estado-chip.estado-en_proceso {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .estado-chip.estado-atendido {
      background-color: #e8f5e9;
      color: #388e3c;
    }

    .estado-chip.estado-archivado {
      background-color: #f5f5f5;
      color: #757575;
    }

    /* Columna Prioridad */
    .prioridad-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .prioridad-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .prioridad-texto {
      font-size: 12px;
      font-weight: 500;
    }

    .prioridad-indicator.prioridad-normal {
      color: #757575;
    }

    .prioridad-indicator.prioridad-alta {
      color: #ff9800;
    }

    .prioridad-indicator.prioridad-urgente {
      color: #f44336;
    }

    /* Columna Fecha */
    .fecha-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .fecha-texto {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.8);
    }

    .fecha-limite {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #ff9800;
    }

    .fecha-limite.vencido {
      color: #f44336;
      font-weight: 600;
    }

    .limite-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* Columna Acciones */
    .acciones-header {
      text-align: center;
      width: 140px;
    }

    .acciones-cell {
      text-align: center;
    }

    .acciones-buttons {
      display: flex;
      gap: 4px;
      justify-content: center;
    }

    .acciones-buttons button {
      width: 36px;
      height: 36px;
    }

    .acciones-buttons button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .acciones-buttons button:hover:not([disabled]) {
      background-color: rgba(25, 118, 210, 0.08);
      color: #1976d2;
    }

    .acciones-buttons button[disabled] {
      opacity: 0.4;
    }

    /* Estados de carga y error */
    .loading-container,
    .error-container,
    .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
      min-height: 400px;
    }

    .loading-container p {
      margin-top: 16px;
      color: rgba(0, 0, 0, 0.6);
    }

    .error-icon,
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .error-icon {
      color: #f44336;
    }

    .empty-icon {
      color: #cbd5e0;
    }

    .error-container h3,
    .empty-container h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
    }

    .error-container p,
    .empty-container p {
      margin: 0 0 24px 0;
      color: rgba(0, 0, 0, 0.6);
    }

    /* Paginador */
    .documentos-paginator {
      border-top: 1px solid #e1e4e8;
      background-color: #fafbfc;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .asunto-cell {
        max-width: 200px;
      }
      
      .remitente-cell {
        max-width: 150px;
      }
    }

    @media (max-width: 768px) {
      .documentos-table th,
      .documentos-table td {
        padding: 8px 12px;
        font-size: 13px;
      }
      
      .asunto-cell {
        max-width: 150px;
      }
      
      .acciones-buttons button {
        width: 32px;
        height: 32px;
      }
      
      .acciones-buttons button mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
  `]
})
export class ListaDocumentosComponent implements OnInit, OnDestroy {
  private documentoService = inject(DocumentoService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Inputs
  @Input() filtros?: FiltrosDocumento;
  @Input() soloMiArea?: boolean = false;

  // Outputs
  @Output() documentoSeleccionado = new EventEmitter<Documento>();
  @Output() derivarDocumento = new EventEmitter<Documento>();
  @Output() archivarDocumento = new EventEmitter<Documento>();

  // Estado del componente
  documentos = signal<Documento[]>([]);
  totalDocumentos = signal(0);
  pageIndex = signal(0);
  pageSize = signal(25);
  cargando = signal(false);
  error = signal<string | null>(null);
  ordenamiento = signal<OrdenamientoColumna[]>([]);
  filtrosActuales: FiltrosDocumento = {};
  exportando = signal(false);

  // Columnas visibles
  columnasVisibles = ['numeroExpediente', 'tipoDocumento', 'remitente', 'asunto', 'estado', 'prioridad', 'fechaRecepcion', 'acciones'];

  ngOnInit(): void {
    this.cargarDocumentos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar documentos desde el servicio
   * Requirements: 5.1, 5.2
   */
  cargarDocumentos(): void {
    this.cargando.set(true);
    this.error.set(null);

    const filtrosCompletos: FiltrosDocumento = {
      ...this.filtros,
      ...this.filtrosActuales,
      page: this.pageIndex(),
      pageSize: this.pageSize()
    };

    this.documentoService.listarDocumentos(filtrosCompletos)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.documentos.set(response.documentos);
          this.totalDocumentos.set(response.total);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error al cargar documentos:', err);
          this.error.set('No se pudieron cargar los documentos. Por favor, intente nuevamente.');
          this.cargando.set(false);
        }
      });
  }

  /**
   * Manejar cambio de filtros
   * Requirements: 5.1, 5.2, 5.3
   */
  onFiltrosChange(filtros: FiltrosDocumento): void {
    this.filtrosActuales = filtros;
    this.pageIndex.set(0); // Reset a primera página
    this.cargarDocumentos();
  }

  /**
   * Manejar cambio de página
   * Requirements: 5.1
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarDocumentos();
  }

  /**
   * Manejar cambio de ordenamiento
   * Requirements: 5.2
   */
  onOrdenamientoChange(evento: EventoOrdenamiento): void {
    const ordenamientoActual = this.ordenamiento();
    let nuevoOrdenamiento: OrdenamientoColumna[];

    if (evento.esMultiple) {
      // Ordenamiento múltiple
      const index = ordenamientoActual.findIndex(o => o.columna === evento.columna);
      
      if (evento.direccion === null) {
        // Remover columna del ordenamiento
        nuevoOrdenamiento = ordenamientoActual.filter(o => o.columna !== evento.columna);
      } else if (index >= 0) {
        // Actualizar dirección existente
        nuevoOrdenamiento = [...ordenamientoActual];
        nuevoOrdenamiento[index] = { ...nuevoOrdenamiento[index], direccion: evento.direccion };
      } else {
        // Agregar nueva columna
        nuevoOrdenamiento = [
          ...ordenamientoActual,
          { columna: evento.columna, direccion: evento.direccion, prioridad: ordenamientoActual.length + 1 }
        ];
      }
    } else {
      // Ordenamiento simple
      if (evento.direccion === null) {
        nuevoOrdenamiento = [];
      } else {
        nuevoOrdenamiento = [{ columna: evento.columna, direccion: evento.direccion, prioridad: 1 }];
      }
    }

    this.ordenamiento.set(nuevoOrdenamiento);
    this.aplicarOrdenamiento();
  }

  /**
   * Aplicar ordenamiento a los documentos
   * Requirements: 5.2
   */
  private aplicarOrdenamiento(): void {
    const ordenamientoActual = this.ordenamiento();
    if (ordenamientoActual.length === 0) {
      this.cargarDocumentos();
      return;
    }

    const documentosOrdenados = [...this.documentos()].sort((a, b) => {
      for (const orden of ordenamientoActual) {
        const valorA = this.getValorColumna(a, orden.columna);
        const valorB = this.getValorColumna(b, orden.columna);
        
        let comparacion = 0;
        if (valorA < valorB) comparacion = -1;
        if (valorA > valorB) comparacion = 1;
        
        if (comparacion !== 0) {
          return orden.direccion === 'asc' ? comparacion : -comparacion;
        }
      }
      return 0;
    });

    this.documentos.set(documentosOrdenados);
  }

  /**
   * Obtener valor de una columna para ordenamiento
   */
  private getValorColumna(documento: Documento, columna: string): any {
    switch (columna) {
      case 'numeroExpediente': return documento.numeroExpediente;
      case 'tipoDocumento': return documento.tipoDocumento.nombre;
      case 'remitente': return documento.remitente;
      case 'asunto': return documento.asunto;
      case 'estado': return documento.estado;
      case 'prioridad': return this.getPrioridadValor(documento.prioridad);
      case 'fechaRecepcion': return new Date(documento.fechaRecepcion).getTime();
      default: return '';
    }
  }

  /**
   * Obtener valor numérico de prioridad para ordenamiento
   */
  private getPrioridadValor(prioridad: PrioridadDocumento): number {
    switch (prioridad) {
      case PrioridadDocumento.URGENTE: return 3;
      case PrioridadDocumento.ALTA: return 2;
      case PrioridadDocumento.NORMAL: return 1;
      default: return 0;
    }
  }

  /**
   * Ver detalle de documento
   * Requirements: 5.4
   */
  onVerDetalle(documento: Documento): void {
    const dialogRef = this.dialog.open(DetalleDocumentoComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { documento },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.action === 'derivar') {
          this.derivarDocumento.emit(result.documento);
        } else if (result.action === 'archivar') {
          this.archivarDocumento.emit(result.documento);
        }
      }
    });

    this.documentoSeleccionado.emit(documento);
  }

  /**
   * Derivar documento
   * Requirements: 3.1
   */
  onDerivar(documento: Documento): void {
    this.derivarDocumento.emit(documento);
  }

  /**
   * Archivar documento
   * Requirements: 9.1
   */
  onArchivar(documento: Documento): void {
    this.archivarDocumento.emit(documento);
  }

  // ========================================
  // UTILIDADES DE FORMATO
  // ========================================

  getEstadoTexto(estado: EstadoDocumento): string {
    const textos = {
      [EstadoDocumento.REGISTRADO]: 'Registrado',
      [EstadoDocumento.EN_PROCESO]: 'En Proceso',
      [EstadoDocumento.ATENDIDO]: 'Atendido',
      [EstadoDocumento.ARCHIVADO]: 'Archivado'
    };
    return textos[estado] || estado;
  }

  getPrioridadTexto(prioridad: PrioridadDocumento): string {
    const textos = {
      [PrioridadDocumento.NORMAL]: 'Normal',
      [PrioridadDocumento.ALTA]: 'Alta',
      [PrioridadDocumento.URGENTE]: 'Urgente'
    };
    return textos[prioridad] || prioridad;
  }

  getPrioridadIcono(prioridad: PrioridadDocumento): string {
    const iconos = {
      [PrioridadDocumento.NORMAL]: 'remove',
      [PrioridadDocumento.ALTA]: 'arrow_upward',
      [PrioridadDocumento.URGENTE]: 'priority_high'
    };
    return iconos[prioridad] || 'remove';
  }

  formatearFecha(fecha: Date | string): string {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  estaVencido(fechaLimite: Date | string): boolean {
    const limite = typeof fechaLimite === 'string' ? new Date(fechaLimite) : fechaLimite;
    return limite < new Date();
  }

  // ========================================
  // EXPORTACIÓN
  // ========================================

  /**
   * Exportar documentos a Excel
   * Requirements: 5.6
   */
  exportarExcel(): void {
    if (this.exportando()) return;

    this.exportando.set(true);

    const filtrosExportacion: FiltrosDocumento = {
      ...this.filtros,
      ...this.filtrosActuales
    };

    this.documentoService.exportarExcel(filtrosExportacion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.descargarArchivo(blob, 'documentos.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          this.exportando.set(false);
        },
        error: (err) => {
          console.error('Error al exportar a Excel:', err);
          this.error.set('No se pudo exportar a Excel. Por favor, intente nuevamente.');
          this.exportando.set(false);
        }
      });
  }

  /**
   * Exportar documentos a PDF
   * Requirements: 5.6
   */
  exportarPDF(): void {
    if (this.exportando()) return;

    this.exportando.set(true);

    const filtrosExportacion: FiltrosDocumento = {
      ...this.filtros,
      ...this.filtrosActuales
    };

    this.documentoService.exportarPDF(filtrosExportacion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.descargarArchivo(blob, 'documentos.pdf', 'application/pdf');
          this.exportando.set(false);
        },
        error: (err) => {
          console.error('Error al exportar a PDF:', err);
          this.error.set('No se pudo exportar a PDF. Por favor, intente nuevamente.');
          this.exportando.set(false);
        }
      });
  }

  /**
   * Descargar archivo blob
   */
  private descargarArchivo(blob: Blob, nombreArchivo: string, tipoMime: string): void {
    const url = window.URL.createObjectURL(new Blob([blob], { type: tipoMime }));
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
