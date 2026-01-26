import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { HistorialVehicular, TipoEventoHistorial } from '../../models/historial-vehicular.model';

@Component({
  selector: 'app-historial-detalle-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    SmartIconComponent
  ],
  template: `
    <div class="historial-detalle-modal">
      <div mat-dialog-title class="modal-header">
        <div class="header-content">
          <app-smart-icon [iconName]="getIconoTipoEvento(data.tipoEvento)" [size]="32" class="header-icon"></app-smart-icon>
          <div>
            <h2>Detalle del Evento</h2>
            <p class="header-subtitle">{{ getLabelTipoEvento(data.tipoEvento) }}</p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close>
          <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
        </button>
      </div>

      <div mat-dialog-content class="modal-content">
        <!-- Información básica -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>
              <app-smart-icon [iconName]="'info'" [size]="20"></app-smart-icon>
              Información General
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Fecha y Hora:</span>
                <span class="info-value">{{ formatearFechaCompleta(data.fechaEvento) }}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">Placa:</span>
                <span class="info-value placa-badge">
                  <app-smart-icon [iconName]="'directions_car'" [size]="16"></app-smart-icon>
                  {{ data.placa }}
                </span>
              </div>

              <div class="info-item">
                <span class="info-label">Tipo de Evento:</span>
                <mat-chip [class]="'evento-chip evento-' + data.tipoEvento.toLowerCase()">
                  <app-smart-icon [iconName]="getIconoTipoEvento(data.tipoEvento)" [size]="16"></app-smart-icon>
                  {{ getLabelTipoEvento(data.tipoEvento) }}
                </mat-chip>
              </div>

              @if (data.usuarioNombre) {
                <div class="info-item">
                  <span class="info-label">Usuario:</span>
                  <span class="info-value">
                    <app-smart-icon [iconName]="'person'" [size]="16"></app-smart-icon>
                    {{ data.usuarioNombre }}
                  </span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Descripción -->
        <mat-card class="descripcion-card">
          <mat-card-header>
            <mat-card-title>
              <app-smart-icon [iconName]="'description'" [size]="20"></app-smart-icon>
              Descripción
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="descripcion-text">{{ data.descripcion }}</p>
            
            @if (data.observaciones) {
              <mat-divider></mat-divider>
              <div class="observaciones-section">
                <h4>
                  <app-smart-icon [iconName]="'note'" [size]="18"></app-smart-icon>
                  Observaciones
                </h4>
                <p class="observaciones-text">{{ data.observaciones }}</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Datos específicos del evento -->
        @if (data.observaciones && data.observaciones.length > 0) {
          <mat-card class="datos-especificos-card">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'settings'" [size]="20"></app-smart-icon>
                Información Adicional
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="datos-especificos-grid">
                <div class="dato-item">
                  <span class="dato-label">Observaciones Adicionales:</span>
                  <span class="dato-value">{{ data.observaciones }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Documentos de soporte -->
        @if (data.documentosSoporte && data.documentosSoporte.length > 0) {
          <mat-card class="documentos-card">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'attach_file'" [size]="20"></app-smart-icon>
                Documentos de Soporte
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-list>
                @for (documento of data.documentosSoporte; track documento.id) {
                  <mat-list-item class="documento-item">
                    <app-smart-icon [iconName]="getIconoDocumento(documento.tipo)" [size]="20" matListItemIcon></app-smart-icon>
                    <div matListItemTitle>{{ documento.nombre }}</div>
                    <div matListItemLine>{{ documento.tipo || 'Documento' }}</div>
                    <div matListItemMeta>
                      <button mat-icon-button (click)="descargarDocumento(documento)" matTooltip="Descargar">
                        <app-smart-icon [iconName]="'download'" [size]="20"></app-smart-icon>
                      </button>
                      <button mat-icon-button (click)="verDocumento(documento)" matTooltip="Ver">
                        <app-smart-icon [iconName]="'visibility'" [size]="20"></app-smart-icon>
                      </button>
                    </div>
                  </mat-list-item>
                  @if (!$last) {
                    <mat-divider></mat-divider>
                  }
                }
              </mat-list>
            </mat-card-content>
          </mat-card>
        }

        <!-- Metadatos del sistema -->
        @if (mostrarMetadatos()) {
          <mat-card class="metadatos-card">
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'code'" [size]="20"></app-smart-icon>
                Metadatos del Sistema
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="metadatos-grid">
                <div class="metadato-item">
                  <span class="metadato-label">ID del Registro:</span>
                  <span class="metadato-value">{{ data.id }}</span>
                </div>
                
                @if (data.vehiculoId) {
                  <div class="metadato-item">
                    <span class="metadato-label">ID del Vehículo:</span>
                    <span class="metadato-value">{{ data.vehiculoId }}</span>
                  </div>
                }

                @if (data.usuarioId) {
                  <div class="metadato-item">
                    <span class="metadato-label">ID del Usuario:</span>
                    <span class="metadato-value">{{ data.usuarioId }}</span>
                  </div>
                }

                @if (data.fechaCreacion) {
                  <div class="metadato-item">
                    <span class="metadato-label">Fecha de Creación:</span>
                    <span class="metadato-value">{{ formatearFechaCompleta(data.fechaCreacion) }}</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <div mat-dialog-actions class="modal-actions">
        <button mat-button (click)="toggleMetadatos()">
          <app-smart-icon [iconName]="mostrarMetadatos() ? 'expand_less' : 'expand_more'" [size]="20"></app-smart-icon>
          {{ mostrarMetadatos() ? 'Ocultar' : 'Mostrar' }} Metadatos
        </button>
        
        @if (data.documentosSoporte && data.documentosSoporte.length > 0) {
          <button mat-button color="primary" (click)="descargarTodosDocumentos()">
            <app-smart-icon [iconName]="'download'" [size]="20"></app-smart-icon>
            Descargar Todos
          </button>
        }
        
        <button mat-raised-button color="primary" mat-dialog-close>
          <app-smart-icon [iconName]="'check'" [size]="20"></app-smart-icon>
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .historial-detalle-modal {
      width: 100%;
      max-width: 800px;
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

    .info-card,
    .descripcion-card,
    .datos-especificos-card,
    .documentos-card,
    .metadatos-card {
      margin-bottom: 16px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
    }

    .info-value {
      font-size: 14px;
      color: #333;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .placa-badge {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      width: fit-content;
    }

    .evento-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
      width: fit-content;
    }

    .evento-creacion { background-color: #e8f5e8; color: #2e7d32; }
    .evento-modificacion { background-color: #fff3e0; color: #f57c00; }
    .evento-transferencia_empresa { background-color: #e3f2fd; color: #1976d2; }
    .evento-cambio_estado { background-color: #f3e5f5; color: #7b1fa2; }
    .evento-asignacion_ruta { background-color: #e0f2f1; color: #00695c; }
    .evento-desasignacion_ruta { background-color: #ffebee; color: #c62828; }
    .evento-cambio_resolucion { background-color: #fff8e1; color: #f57f17; }
    .evento-actualizacion_tuc { background-color: #f3e5f5; color: #7b1fa2; }
    .evento-renovacion_tuc { background-color: #e8f5e8; color: #388e3c; }
    .evento-suspension { background-color: #ffebee; color: #d32f2f; }
    .evento-reactivacion { background-color: #e8f5e8; color: #388e3c; }
    .evento-baja_definitiva { background-color: #ffebee; color: #d32f2f; }
    .evento-mantenimiento { background-color: #fff3e0; color: #f57c00; }
    .evento-inspeccion { background-color: #e3f2fd; color: #1976d2; }
    .evento-accidente { background-color: #fff3e0; color: #ff9800; }
    .evento-multa { background-color: #ffebee; color: #f44336; }
    .evento-revision_tecnica { background-color: #e8f5e8; color: #4caf50; }
    .evento-cambio_propietario { background-color: #f3e5f5; color: #9c27b0; }
    .evento-actualizacion_datos_tecnicos { background-color: #e0f2f1; color: #009688; }
    .evento-otros { background-color: #f5f5f5; color: #757575; }

    .descripcion-text {
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      margin: 0;
    }

    .observaciones-section {
      margin-top: 16px;
    }

    .observaciones-section h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #666;
    }

    .observaciones-text {
      font-size: 14px;
      line-height: 1.5;
      color: #666;
      margin: 0;
      font-style: italic;
    }

    .datos-especificos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .dato-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .dato-label {
      font-size: 11px;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
    }

    .dato-value {
      font-size: 13px;
      color: #333;
    }

    .documento-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 8px;
      padding: 8px;
    }

    .metadatos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
    }

    .metadato-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .metadato-label {
      font-size: 11px;
      color: #999;
      font-weight: 500;
      text-transform: uppercase;
    }

    .metadato-value {
      font-size: 12px;
      color: #666;
      font-family: monospace;
    }

    .modal-actions {
      padding: 16px 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .historial-detalle-modal {
        max-width: 100vw;
        height: 100vh;
      }

      .modal-content {
        max-height: calc(100vh - 200px);
      }

      .info-grid,
      .datos-especificos-grid,
      .metadatos-grid {
        grid-template-columns: 1fr;
      }

      .modal-actions {
        flex-direction: column;
      }
    }
  `]
})
export class HistorialDetalleModalComponent {

  constructor(private snackBar: MatSnackBar) {}

  data = inject<HistorialVehicular>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<HistorialDetalleModalComponent>);

  mostrarMetadatos = signal(false);

  // Tipos de evento para obtener labels
  private tiposEvento = [
    { value: TipoEventoHistorial.CREACION, label: 'Creación' },
    { value: TipoEventoHistorial.MODIFICACION, label: 'Modificación' },
    { value: TipoEventoHistorial.TRANSFERENCIA_EMPRESA, label: 'Transferencia de Empresa' },
    { value: TipoEventoHistorial.CAMBIO_RESOLUCION, label: 'Cambio de Resolución' },
    { value: TipoEventoHistorial.CAMBIO_ESTADO, label: 'Cambio de Estado' },
    { value: TipoEventoHistorial.ASIGNACION_RUTA, label: 'Asignación de Ruta' },
    { value: TipoEventoHistorial.DESASIGNACION_RUTA, label: 'Desasignación de Ruta' },
    { value: TipoEventoHistorial.ACTUALIZACION_TUC, label: 'Actualización TUC' },
    { value: TipoEventoHistorial.RENOVACION_TUC, label: 'Renovación TUC' },
    { value: TipoEventoHistorial.SUSPENSION, label: 'Suspensión' },
    { value: TipoEventoHistorial.REACTIVACION, label: 'Reactivación' },
    { value: TipoEventoHistorial.BAJA_DEFINITIVA, label: 'Baja Definitiva' },
    { value: TipoEventoHistorial.MANTENIMIENTO, label: 'Mantenimiento' },
    { value: TipoEventoHistorial.INSPECCION, label: 'Inspección' },
    { value: TipoEventoHistorial.ACCIDENTE, label: 'Accidente' },
    { value: TipoEventoHistorial.MULTA, label: 'Multa' },
    { value: TipoEventoHistorial.REVISION_TECNICA, label: 'Revisión Técnica' },
    { value: TipoEventoHistorial.CAMBIO_PROPIETARIO, label: 'Cambio de Propietario' },
    { value: TipoEventoHistorial.ACTUALIZACION_DATOS_TECNICOS, label: 'Actualización Datos Técnicos' },
    { value: TipoEventoHistorial.OTROS, label: 'Otros' }
  ];

  formatearFechaCompleta(fecha: string): string {
    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getLabelTipoEvento(tipo: TipoEventoHistorial): string {
    const tipoEncontrado = this.tiposEvento.find((t: any) => t.value === tipo);
    return tipoEncontrado?.label || tipo;
  }

  getIconoTipoEvento(tipo: TipoEventoHistorial): string {
    const iconos: { [key in TipoEventoHistorial]: string } = {
      [TipoEventoHistorial.CREACION]: 'add_circle',
      [TipoEventoHistorial.MODIFICACION]: 'edit',
      [TipoEventoHistorial.TRANSFERENCIA_EMPRESA]: 'swap_horiz',
      [TipoEventoHistorial.CAMBIO_RESOLUCION]: 'description',
      [TipoEventoHistorial.CAMBIO_ESTADO]: 'toggle_on',
      [TipoEventoHistorial.ASIGNACION_RUTA]: 'add_road',
      [TipoEventoHistorial.DESASIGNACION_RUTA]: 'remove_road',
      [TipoEventoHistorial.ACTUALIZACION_TUC]: 'receipt',
      [TipoEventoHistorial.RENOVACION_TUC]: 'refresh',
      [TipoEventoHistorial.SUSPENSION]: 'pause_circle',
      [TipoEventoHistorial.REACTIVACION]: 'play_circle',
      [TipoEventoHistorial.BAJA_DEFINITIVA]: 'cancel',
      [TipoEventoHistorial.MANTENIMIENTO]: 'build',
      [TipoEventoHistorial.INSPECCION]: 'search',
      [TipoEventoHistorial.ACCIDENTE]: 'warning',
      [TipoEventoHistorial.MULTA]: 'gavel',
      [TipoEventoHistorial.REVISION_TECNICA]: 'verified',
      [TipoEventoHistorial.CAMBIO_PROPIETARIO]: 'person_add',
      [TipoEventoHistorial.ACTUALIZACION_DATOS_TECNICOS]: 'settings',
      [TipoEventoHistorial.OTROS]: 'more_horiz'
    };

    return iconos[tipo] || 'event';
  }

  // Método simplificado para mostrar información adicional
  tieneInformacionAdicional(): boolean {
    return !!(this.data.observaciones && this.data.observaciones.length > 0);
  }

  getIconoDocumento(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'pdf': 'picture_as_pdf',
      'image': 'image',
      'word': 'description',
      'excel': 'table_chart',
      'video': 'videocam',
      'audio': 'audiotrack'
    };

    return iconos[tipo] || 'attach_file';
  }

  toggleMetadatos(): void {
    this.mostrarMetadatos.set(!this.mostrarMetadatos());
  }

  verDocumento(documento: unknown): void {
    const doc = documento as any;
    if (doc?.url) {
      window.open(doc.url, '_blank');
    } else {
      this.snackBar.open('URL del documento no disponible', 'Cerrar', { duration: 3000 });
    }
  }

  descargarDocumento(documento: unknown): void {
    const doc = documento as any;
    if (doc?.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.nombre || 'documento';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      this.snackBar.open('URL del documento no disponible', 'Cerrar', { duration: 3000 });
    }
  }

  descargarTodosDocumentos(): void {
    const documentos = (this.data as any)?.documentos || [];
    if (documentos.length === 0) {
      this.snackBar.open('No hay documentos para descargar', 'Cerrar', { duration: 3000 });
      return;
    }

    documentos.forEach((documento: any, index: number) => {
      setTimeout(() => {
        this.descargarDocumento(documento);
      }, index * 500); // Delay entre descargas para evitar bloqueos
    });

    this.snackBar.open(`Iniciando descarga de ${documentos.length} documentos`, 'Cerrar', { duration: 3000 });
  }
}