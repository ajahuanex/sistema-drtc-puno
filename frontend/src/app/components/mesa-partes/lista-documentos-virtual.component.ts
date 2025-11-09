import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { DocumentoService } from '../../services/mesa-partes/documento.service';
import { DetalleDocumentoComponent } from './detalle-documento.component';
import { 
  Documento, 
  FiltrosDocumento, 
  EstadoDocumento, 
  PrioridadDocumento 
} from '../../models/mesa-partes/documento.model';
import { DocumentosFiltrosComponent } from './documentos-filters.component';
import { DocumentoCardComponent } from './shared/documento-card.component';

/**
 * Componente optimizado con virtual scrolling para listas grandes de documentos
 * Requirements: 5.1, 5.2, 5.4, 5.6
 * Performance: Virtual scrolling para manejar miles de documentos eficientemente
 */
@Component({
  selector: 'app-lista-documentos-virtual',
  standalone: true,
  imports: [
    CommonModule,
    ScrollingModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatCardModule,
    DocumentosFiltrosComponent,
    DocumentoCardComponent
  ],
  template: `
    <div class="lista-documentos-virtual-container">
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

          <!-- Toggle vista -->
          <button mat-icon-button 
                  matTooltip="Cambiar vista"
                  (click)="toggleVista()">
            <mat-icon>{{ vistaCompacta() ? 'view_list' : 'view_module' }}</mat-icon>
          </button>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Virtual Scroll Container -->
      <div class="virtual-scroll-container">
        @if (cargando()) {
          <div class="loading-container">
            <mat-spinner diameter="48"></mat-spinner>
            <p>Cargando documentos...</p>
          </div>
        } @else if (documentos().length === 0) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <h3>No hay documentos</h3>
            <p>No se encontraron documentos con los filtros aplicados</p>
          </div>
        } @else {
          <cdk-virtual-scroll-viewport 
            [itemSize]="vistaCompacta() ? 80 : 200" 
            class="viewport"
            (scrolledIndexChange)="onScroll($event)">
            
            <div *cdkVirtualFor="let documento of documentos(); trackBy: trackByDocumento"
                 class="documento-item"
                 [class.compacta]="vistaCompacta()">
              
              @if (vistaCompacta()) {
                <!-- Vista compacta -->
                <div class="documento-compacto" (click)="verDetalle(documento)">
                  <div class="documento-header">
                    <span class="expediente">{{ documento.numeroExpediente }}</span>
                    <app-estado-badge [estado]="documento.estado"></app-estado-badge>
                    <app-prioridad-indicator [prioridad]="documento.prioridad"></app-prioridad-indicator>
                  </div>
                  <div class="documento-info">
                    <span class="remitente">{{ documento.remitente }}</span>
                    <span class="asunto">{{ documento.asunto }}</span>
                    <span class="fecha">{{ documento.fechaRecepcion | date:'short' }}</span>
                  </div>
                  <div class="documento-actions">
                    <button mat-icon-button 
                            matTooltip="Ver detalle"
                            (click)="verDetalle(documento); $event.stopPropagation()">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    <button mat-icon-button 
                            matTooltip="Derivar"
                            (click)="derivar(documento); $event.stopPropagation()">
                      <mat-icon>send</mat-icon>
                    </button>
                    <button mat-icon-button 
                            [matMenuTriggerFor]="menu"
                            (click)="$event.stopPropagation()">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="archivar(documento)">
                        <mat-icon>archive</mat-icon>
                        <span>Archivar</span>
                      </button>
                      <button mat-menu-item (click)="descargarComprobante(documento)">
                        <mat-icon>download</mat-icon>
                        <span>Descargar comprobante</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>
              } @else {
                <!-- Vista card -->
                <app-documento-card 
                  [documento]="documento"
                  (verDetalle)="verDetalle($event)"
                  (derivar)="derivar($event)"
                  (archivar)="archivar($event)">
                </app-documento-card>
              }
            </div>

            <!-- Indicador de carga al hacer scroll -->
            @if (cargandoMas()) {
              <div class="loading-more">
                <mat-spinner diameter="32"></mat-spinner>
                <span>Cargando más documentos...</span>
              </div>
            }
          </cdk-virtual-scroll-viewport>
        }
      </div>
    </div>
  `,
  styles: [`
    .lista-documentos-virtual-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #fafafa;
    }

    .toolbar-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .results-count {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .toolbar-actions {
      display: flex;
      gap: 8px;
    }

    .virtual-scroll-container {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .viewport {
      height: 100%;
      width: 100%;
    }

    .documento-item {
      padding: 8px 16px;
      border-bottom: 1px solid #e0e0e0;
      transition: background-color 0.2s;
    }

    .documento-item:hover {
      background-color: #f5f5f5;
    }

    .documento-compacto {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      cursor: pointer;
      padding: 8px;
    }

    .documento-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .expediente {
      font-weight: 600;
      color: #1976d2;
      font-size: 14px;
    }

    .documento-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;
    }

    .remitente {
      font-weight: 500;
      color: #333;
    }

    .asunto {
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .fecha {
      color: #999;
      font-size: 12px;
    }

    .documento-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .loading-container,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      gap: 16px;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }

    .empty-state h3 {
      margin: 0;
      color: #666;
    }

    .empty-state p {
      margin: 0;
      color: #999;
    }

    .loading-more {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px;
      color: #666;
    }

    .documento-item.compacta {
      padding: 4px 16px;
    }
  `]
})
export class ListaDocumentosVirtualComponent implements OnInit, OnDestroy {
  @Input() filtros?: FiltrosDocumento;
  @Input() soloMiArea: boolean = false;
  @Output() documentoSeleccionado = new EventEmitter<Documento>();

  private documentoService = inject(DocumentoService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Signals
  documentos = signal<Documento[]>([]);
  totalDocumentos = signal<number>(0);
  cargando = signal<boolean>(false);
  cargandoMas = signal<boolean>(false);
  vistaCompacta = signal<boolean>(false);

  // Paginación para carga incremental
  private currentPage = 0;
  private pageSize = 50;
  private hasMore = true;

  ngOnInit(): void {
    this.cargarDocumentos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDocumentos(reset: boolean = true): void {
    if (reset) {
      this.currentPage = 0;
      this.hasMore = true;
      this.documentos.set([]);
    }

    if (!this.hasMore) return;

    const loading = reset ? this.cargando : this.cargandoMas;
    loading.set(true);

    const filtrosConPaginacion: FiltrosDocumento = {
      ...this.filtros,
      page: this.currentPage,
      pageSize: this.pageSize
    };

    if (this.soloMiArea) {
      // Aquí se debería obtener el área del usuario actual
      // filtrosConPaginacion.areaActualId = currentUserAreaId;
    }

    this.documentoService.listarDocumentos(filtrosConPaginacion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (reset) {
            this.documentos.set(response.documentos);
          } else {
            this.documentos.update(docs => [...docs, ...response.documentos]);
          }
          
          this.totalDocumentos.set(response.total);
          this.hasMore = this.documentos().length < response.total;
          loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar documentos:', error);
          loading.set(false);
        }
      });
  }

  onScroll(index: number): void {
    // Cargar más cuando se acerca al final
    const threshold = this.documentos().length - 10;
    if (index >= threshold && !this.cargandoMas() && this.hasMore) {
      this.currentPage++;
      this.cargarDocumentos(false);
    }
  }

  onFiltrosChange(filtros: FiltrosDocumento): void {
    this.filtros = filtros;
    this.cargarDocumentos();
  }

  toggleVista(): void {
    this.vistaCompacta.update(v => !v);
  }

  verDetalle(documento: Documento): void {
    this.dialog.open(DetalleDocumentoComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { documentoId: documento.id }
    });
    this.documentoSeleccionado.emit(documento);
  }

  derivar(documento: Documento): void {
    // Implementar derivación
    console.log('Derivar documento:', documento);
  }

  archivar(documento: Documento): void {
    // Implementar archivado
    console.log('Archivar documento:', documento);
  }

  descargarComprobante(documento: Documento): void {
    this.documentoService.descargarComprobante(documento.id, documento.numeroExpediente);
  }

  exportarExcel(): void {
    this.documentoService.exportarExcel(this.filtros).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `documentos_${new Date().getTime()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al exportar a Excel:', error);
      }
    });
  }

  exportarPDF(): void {
    this.documentoService.exportarPDF(this.filtros).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `documentos_${new Date().getTime()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al exportar a PDF:', error);
      }
    });
  }

  trackByDocumento(index: number, documento: Documento): string {
    return documento.id;
  }
}
