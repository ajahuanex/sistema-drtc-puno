import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SmartIconComponent } from '../../shared/smart-icon.component';

interface DocumentoSoporte {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  tamano?: number;
  fechaSubida: string;
  url?: string;
  urlVisualizacion?: string;
}

@Component({
  selector: 'app-documentos-historial-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    SmartIconComponent
  ],
  template: `
    <div class="documentos-modal">
      <div mat-dialog-title class="modal-header">
        <div class="header-content">
          <app-smart-icon [iconName]="'attach_file'" [size]="32" class="header-icon"></app-smart-icon>
          <div>
            <h2>Documentos de Soporte</h2>
            <p class="header-subtitle">{{ data.documentos.length }} documento(s) disponible(s)</p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close>
          <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
        </button>
      </div>

      <div mat-dialog-content class="modal-content">
        <!-- Información del evento -->
        <mat-card class="evento-info-card">
          <mat-card-content>
            <div class="evento-info">
              <div class="evento-item">
                <app-smart-icon [iconName]="'event'" [size]="16"></app-smart-icon>
                <span>{{ data.tipoEvento }}</span>
              </div>
              <div class="evento-item">
                <app-smart-icon [iconName]="'schedule'" [size]="16"></app-smart-icon>
                <span>{{ formatearFecha(data.fechaEvento) }}</span>
              </div>
              <div class="evento-item">
                <app-smart-icon [iconName]="'directions_car'" [size]="16"></app-smart-icon>
                <span>{{ data.placa }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Lista de documentos -->
        <mat-card class="documentos-card">
          <mat-card-header>
            <mat-card-title>
              <app-smart-icon [iconName]="'folder'" [size]="20"></app-smart-icon>
              Documentos
            </mat-card-title>
            <mat-card-subtitle>
              Haz clic en un documento para verlo o descargarlo
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (cargandoDocumentos()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Cargando documentos...</p>
              </div>
            } @else {
              <mat-list class="documentos-list">
                @for (documento of data.documentos; track documento.id) {
                  <mat-list-item class="documento-item" [class.documento-seleccionado]="documentoSeleccionado()?.id === documento.id">
                    <div matListItemIcon class="documento-icon">
                      <app-smart-icon [iconName]="getIconoDocumento(documento.tipo)" [size]="24" [class]="'icono-' + documento.tipo"></app-smart-icon>
                    </div>
                    
                    <div matListItemTitle class="documento-titulo">{{ documento.nombre }}</div>
                    
                    <div matListItemLine class="documento-info">
                      @if (documento.descripcion) {
                        <span class="documento-descripcion">{{ documento.descripcion }}</span>
                      }
                      <div class="documento-metadatos">
                        <span class="documento-tipo">{{ getTipoDocumentoLabel(documento.tipo) }}</span>
                        @if (documento.tamano) {
                          <span class="documento-tamano">{{ formatearTamano(documento.tamano) }}</span>
                        }
                        <span class="documento-fecha">{{ formatearFecha(documento.fechaSubida) }}</span>
                      </div>
                    </div>

                    <div matListItemMeta class="documento-acciones">
                      @if (puedeVisualizarse(documento.tipo)) {
                        <button mat-icon-button 
                                (click)="verDocumento(documento)" 
                                matTooltip="Ver documento"
                                [disabled]="cargandoVista()">
                          @if (cargandoVista() && documentoSeleccionado()?.id === documento.id) {
                            <mat-spinner diameter="20"></mat-spinner>
                          } @else {
                            <app-smart-icon [iconName]="'visibility'" [size]="20"></app-smart-icon>
                          }
                        </button>
                      }
                      
                      <button mat-icon-button 
                              (click)="descargarDocumento(documento)" 
                              matTooltip="Descargar documento"
                              [disabled]="cargandoDescarga()">
                        @if (cargandoDescarga() && documentoSeleccionado()?.id === documento.id) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else {
                          <app-smart-icon [iconName]="'download'" [size]="20"></app-smart-icon>
                        }
                      </button>

                      <button mat-icon-button 
                              (click)="compartirDocumento(documento)" 
                              matTooltip="Compartir documento">
                        <app-smart-icon [iconName]="'share'" [size]="20"></app-smart-icon>
                      </button>
                    </div>
                  </mat-list-item>
                  
                  @if (!$last) {
                    <mat-divider></mat-divider>
                  }
                }
              </mat-list>
            }
          </mat-card-content>
        </mat-card>

        <!-- Vista previa del documento -->
        @if (documentoVisualizando()) {
          <mat-card class="vista-previa-card">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'preview'" [size]="20"></app-smart-icon>
                Vista Previa: {{ documentoVisualizando()?.nombre }}
              </mat-card-title>
              <button mat-icon-button (click)="cerrarVistaPrevia()" matTooltip="Cerrar vista previa">
                <app-smart-icon [iconName]="'close'" [size]="20"></app-smart-icon>
              </button>
            </mat-card-header>
            <mat-card-content>
              <div class="vista-previa-container">
                @if (cargandoVista()) {
                  <div class="loading-vista">
                    <mat-spinner diameter="50"></mat-spinner>
                    <p>Cargando vista previa...</p>
                  </div>
                } @else {
                  @switch (documentoVisualizando()?.tipo) {
                    @case ('image') {
                      <img [src]="urlVistaPrevia()" 
                           [alt]="documentoVisualizando()?.nombre"
                           class="imagen-previa"
                           (load)="onImagenCargada()"
                           (error)="onErrorVistaPrevia()">
                    }
                    @case ('pdf') {
                      <iframe [src]="urlVistaPrevia()" 
                              class="pdf-previa"
                              frameborder="0">
                      </iframe>
                    }
                    @default {
                      <div class="no-vista-previa">
                        <app-smart-icon [iconName]="'description'" [size]="48"></app-smart-icon>
                        <p>Vista previa no disponible para este tipo de archivo</p>
                        <button mat-raised-button color="primary" (click)="descargarDocumento(documentoVisualizando()!)">
                          <app-smart-icon [iconName]="'download'" [size]="20"></app-smart-icon>
                          Descargar para ver
                        </button>
                      </div>
                    }
                  }
                }
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <div mat-dialog-actions class="modal-actions">
        <button mat-button (click)="descargarTodos()" [disabled]="cargandoDescargaTodos()">
          @if (cargandoDescargaTodos()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            <app-smart-icon [iconName]="'download'" [size]="20"></app-smart-icon>
          }
          Descargar Todos
        </button>
        
        <button mat-raised-button color="primary" mat-dialog-close>
          <app-smart-icon [iconName]="'check'" [size]="20"></app-smart-icon>
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .documentos-modal {
      width: 100%;
      max-width: 900px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0 24px;
      margin: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      color: #1976d2;
    }

    .header-content h2 {
      margin: 0;
      color: #1976d2;
      font-size: 24px;
      font-weight: 500;
    }

    .header-subtitle {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .modal-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .evento-info-card {
      margin-bottom: 16px;
    }

    .evento-info {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .evento-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
    }

    .documentos-card {
      margin-bottom: 16px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: #666;
    }

    .documentos-list {
      padding: 0;
    }

    .documento-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 8px;
      padding: 16px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .documento-item:hover {
      border-color: #1976d2;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1);
    }

    .documento-seleccionado {
      border-color: #1976d2;
      background-color: #f3f9ff;
    }

    .documento-icon {
      margin-right: 16px;
    }

    .icono-pdf { color: #f44336; }
    .icono-image { color: #4caf50; }
    .icono-word { color: #2196f3; }
    .icono-excel { color: #4caf50; }
    .icono-video { color: #ff9800; }
    .icono-audio { color: #9c27b0; }

    .documento-titulo {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .documento-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .documento-descripcion {
      color: #666;
      font-size: 13px;
      line-height: 1.4;
    }

    .documento-metadatos {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #999;
    }

    .documento-tipo {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .documento-acciones {
      display: flex;
      gap: 4px;
    }

    .vista-previa-card {
      margin-bottom: 16px;
    }

    .vista-previa-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .vista-previa-container {
      min-height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-vista {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #666;
    }

    .imagen-previa {
      max-width: 100%;
      max-height: 400px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .pdf-previa {
      width: 100%;
      height: 500px;
      border-radius: 8px;
    }

    .no-vista-previa {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #666;
      text-align: center;
    }

    .modal-actions {
      padding: 16px 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .documentos-modal {
        max-width: 100vw;
        height: 100vh;
      }

      .modal-content {
        max-height: calc(100vh - 200px);
      }

      .evento-info {
        flex-direction: column;
        gap: 12px;
      }

      .documento-item {
        padding: 12px;
      }

      .documento-acciones {
        flex-direction: column;
      }

      .modal-actions {
        flex-direction: column;
      }
    }
  `]
})
export class DocumentosHistorialModalComponent {
  data = inject<{documentos: DocumentoSoporte[], tipoEvento: string, fechaEvento: string, placa: string}>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<DocumentosHistorialModalComponent>);
  snackBar = inject(MatSnackBar);

  cargandoDocumentos = signal(false);
  cargandoVista = signal(false);
  cargandoDescarga = signal(false);
  cargandoDescargaTodos = signal(false);
  documentoSeleccionado = signal<DocumentoSoporte | null>(null);
  documentoVisualizando = signal<DocumentoSoporte | null>(null);
  urlVistaPrevia = signal<string>('');

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearTamano(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getIconoDocumento(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'pdf': 'picture_as_pdf',
      'image': 'image',
      'word': 'description',
      'excel': 'table_chart',
      'video': 'videocam',
      'audio': 'audiotrack',
      'zip': 'archive',
      'text': 'text_snippet'
    };

    return iconos[tipo] || 'attach_file';
  }

  getTipoDocumentoLabel(tipo: string): string {
    const labels: { [key: string]: string } = {
      'pdf': 'PDF',
      'image': 'Imagen',
      'word': 'Word',
      'excel': 'Excel',
      'video': 'Video',
      'audio': 'Audio',
      'zip': 'Archivo',
      'text': 'Texto'
    };

    return labels[tipo] || tipo.toUpperCase();
  }

  puedeVisualizarse(tipo: string): boolean {
    return ['pdf', 'image'].includes(tipo);
  }

  verDocumento(documento: DocumentoSoporte): void {
    this.documentoSeleccionado.set(documento);
    this.cargandoVista.set(true);

    // Simular carga de URL de vista previa
    setTimeout(() => {
      // En una implementación real, aquí harías una llamada al servicio
      // para obtener la URL de vista previa del documento
      this.urlVistaPrevia.set(documento.urlVisualizacion || documento.url || '');
      this.documentoVisualizando.set(documento);
      this.cargandoVista.set(false);
    }, 1000);
  }

  descargarDocumento(documento: DocumentoSoporte): void {
    this.documentoSeleccionado.set(documento);
    this.cargandoDescarga.set(true);

    // Simular descarga
    setTimeout(() => {
      // En una implementación real, aquí harías la descarga del documento
      const link = document.createElement('a');
      link.href = documento.url || '#';
      link.download = documento.nombre;
      link.click();

      this.snackBar.open(`Descargando ${documento.nombre}`, 'Cerrar', { duration: 3000 });
      this.cargandoDescarga.set(false);
      this.documentoSeleccionado.set(null);
    }, 1500);
  }

  compartirDocumento(documento: DocumentoSoporte): void {
    if (navigator.share) {
      navigator.share({
        title: documento.nombre,
        text: documento.descripcion || 'Documento del historial vehicular',
        url: documento.url || window.location.href
      }).catch(err => {
        this.copiarEnlace(documento);
      });
    } else {
      this.copiarEnlace(documento);
    }
  }

  private copiarEnlace(documento: DocumentoSoporte): void {
    const url = documento.url || window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Enlace copiado al portapapeles', 'Cerrar', { duration: 3000 });
    }).catch(() => {
      this.snackBar.open('No se pudo copiar el enlace', 'Cerrar', { duration: 3000 });
    });
  }

  descargarTodos(): void {
    this.cargandoDescargaTodos.set(true);

    // Simular descarga masiva
    setTimeout(() => {
      // En una implementación real, aquí crearías un ZIP con todos los documentos
      this.snackBar.open(`Descargando ${this.data.documentos.length} documentos...`, 'Cerrar', { duration: 3000 });
      this.cargandoDescargaTodos.set(false);
    }, 2000);
  }

  cerrarVistaPrevia(): void {
    this.documentoVisualizando.set(null);
    this.urlVistaPrevia.set('');
    this.documentoSeleccionado.set(null);
  }

  onImagenCargada(): void {
    this.cargandoVista.set(false);
  }

  onErrorVistaPrevia(): void {
    this.cargandoVista.set(false);
    this.snackBar.open('Error al cargar la vista previa', 'Cerrar', { duration: 3000 });
  }
}