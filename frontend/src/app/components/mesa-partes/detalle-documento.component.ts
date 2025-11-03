import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Documento, EstadoDocumento, PrioridadDocumento, ArchivoAdjunto } from '../../models/mesa-partes/documento.model';
import { Derivacion, HistorialDerivacion } from '../../models/mesa-partes/derivacion.model';
import { DocumentoService } from '../../services/mesa-partes/documento.service';
import { DerivacionService } from '../../services/mesa-partes/derivacion.service';

/**
 * Componente para mostrar el detalle completo de un documento
 * Requirements: 5.4, 5.5, 3.5, 3.6
 * 
 * Features:
 * - Muestra información completa del documento
 * - Sección de archivos adjuntos con descarga
 * - Historial de derivaciones en timeline
 * - Botones de acción según permisos
 * - Sección de notas y observaciones
 * - Estado actual y ubicación
 */
@Component({
  selector: 'app-detalle-documento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="detalle-documento-container" *ngIf="documento">
      <!-- Header con información principal -->
      <div class="documento-header">
        <div class="header-content">
          <div class="expediente-info">
            <h2>{{ documento.numeroExpediente }}</h2>
            <div class="badges">
              <span class="badge" [ngClass]="getEstadoClass(documento.estado)">
                {{ getEstadoLabel(documento.estado) }}
              </span>
              <span class="badge" [ngClass]="getPrioridadClass(documento.prioridad)">
                {{ getPrioridadLabel(documento.prioridad) }}
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button 
              *ngIf="true" 
              class="btn btn-primary"
              (click)="onDerivar()"
              title="Derivar documento">
              <i class="fas fa-share"></i> Derivar
            </button>
            <button 
              *ngIf="puedeArchivar" 
              class="btn btn-secondary"
              (click)="onArchivar()"
              title="Archivar documento">
              <i class="fas fa-archive"></i> Archivar
            </button>
            <button 
              class="btn btn-outline"
              (click)="onDescargarComprobante()"
              title="Descargar comprobante">
              <i class="fas fa-download"></i> Comprobante
            </button>
            <button 
              class="btn btn-outline"
              (click)="onCerrar()"
              title="Cerrar">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="documento-content">
        <!-- Información del documento -->
        <div class="section info-section">
          <h3><i class="fas fa-file-alt"></i> Información del Documento</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Tipo de Documento:</label>
              <span>{{ documento.tipoDocumento.nombre }}</span>
            </div>
            <div class="info-item" *ngIf="documento.numeroDocumentoExterno">
              <label>Número Externo:</label>
              <span>{{ documento.numeroDocumentoExterno }}</span>
            </div>
            <div class="info-item">
              <label>Remitente:</label>
              <span>{{ documento.remitente }}</span>
            </div>
            <div class="info-item">
              <label>Fecha de Recepción:</label>
              <span>{{ documento.fechaRecepcion | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="info-item" *ngIf="documento.fechaLimite">
              <label>Fecha Límite:</label>
              <span [class.text-danger]="estaVencido()">
                {{ documento.fechaLimite | date: 'dd/MM/yyyy' }}
                <i *ngIf="estaVencido()" class="fas fa-exclamation-triangle text-danger"></i>
              </span>
            </div>
            <div class="info-item">
              <label>Número de Folios:</label>
              <span>{{ documento.numeroFolios }}</span>
            </div>
            <div class="info-item">
              <label>Tiene Anexos:</label>
              <span>{{ documento.tieneAnexos ? 'Sí' : 'No' }}</span>
            </div>
            <div class="info-item">
              <label>Usuario Registro:</label>
              <span>{{ documento.usuarioRegistro.nombres }} {{ documento.usuarioRegistro.apellidos }}</span>
            </div>
            <div class="info-item" *ngIf="documento.areaActual">
              <label>Ubicación Actual:</label>
              <span class="area-badge">
                <i class="fas fa-map-marker-alt"></i> {{ documento.areaActual.nombre }}
              </span>
            </div>
            <div class="info-item full-width">
              <label>Asunto:</label>
              <p class="asunto-text">{{ documento.asunto }}</p>
            </div>
            <div class="info-item full-width" *ngIf="documento.etiquetas && documento.etiquetas.length > 0">
              <label>Etiquetas:</label>
              <div class="etiquetas">
                <span class="etiqueta" *ngFor="let etiqueta of documento.etiquetas">
                  {{ etiqueta }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Archivos adjuntos -->
        <div class="section archivos-section">
          <h3><i class="fas fa-paperclip"></i> Archivos Adjuntos ({{ documento.archivosAdjuntos.length }})</h3>
          <div *ngIf="documento.archivosAdjuntos.length === 0" class="empty-state">
            <i class="fas fa-folder-open"></i>
            <p>No hay archivos adjuntos</p>
          </div>
          <div *ngIf="documento.archivosAdjuntos.length > 0" class="archivos-list">
            <div class="archivo-item" *ngFor="let archivo of documento.archivosAdjuntos">
              <div class="archivo-icon">
                <i [class]="getArchivoIcon(archivo.tipoMime)"></i>
              </div>
              <div class="archivo-info">
                <div class="archivo-nombre">{{ archivo.nombreArchivo }}</div>
                <div class="archivo-meta">
                  {{ formatFileSize(archivo.tamano) }} • 
                  {{ archivo.fechaSubida | date: 'dd/MM/yyyy HH:mm' }}
                </div>
              </div>
              <div class="archivo-actions">
                <button 
                  class="btn-icon" 
                  (click)="onDescargarArchivo(archivo)"
                  title="Descargar">
                  <i class="fas fa-download"></i>
                </button>
                <button 
                  *ngIf="esImagen(archivo.tipoMime)"
                  class="btn-icon" 
                  (click)="onVerArchivo(archivo)"
                  title="Ver">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Historial de derivaciones -->
        <div class="section historial-section">
          <h3><i class="fas fa-history"></i> Historial de Derivaciones</h3>
          <div *ngIf="cargandoHistorial" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i> Cargando historial...
          </div>
          <div *ngIf="!cargandoHistorial && historial && historial.derivaciones.length === 0" class="empty-state">
            <i class="fas fa-route"></i>
            <p>No hay derivaciones registradas</p>
          </div>
          <div *ngIf="!cargandoHistorial && historial && historial.derivaciones.length > 0" class="timeline">
            <div class="timeline-item" *ngFor="let derivacion of historial.derivaciones; let last = last">
              <div class="timeline-marker" [ngClass]="getDerivacionEstadoClass(derivacion.estado)">
                <i [class]="getDerivacionIcon(derivacion.estado)"></i>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <div class="timeline-title">
                    <strong>{{ derivacion.areaOrigen.nombre }}</strong>
                    <i class="fas fa-arrow-right mx-2"></i>
                    <strong>{{ derivacion.areaDestino.nombre }}</strong>
                    <span *ngIf="derivacion.esUrgente" class="badge badge-urgente ml-2">
                      <i class="fas fa-exclamation-circle"></i> URGENTE
                    </span>
                  </div>
                  <div class="timeline-date">
                    {{ derivacion.fechaDerivacion | date: 'dd/MM/yyyy HH:mm' }}
                  </div>
                </div>
                <div class="timeline-body">
                  <div class="derivacion-info">
                    <p><strong>Derivado por:</strong> {{ derivacion.usuarioDeriva.nombres }} {{ derivacion.usuarioDeriva.apellidos }}</p>
                    <p *ngIf="derivacion.instrucciones"><strong>Instrucciones:</strong> {{ derivacion.instrucciones }}</p>
                  </div>
                  <div *ngIf="derivacion.fechaRecepcion" class="derivacion-recepcion">
                    <i class="fas fa-check-circle text-success"></i>
                    <span>Recibido el {{ derivacion.fechaRecepcion | date: 'dd/MM/yyyy HH:mm' }}</span>
                    <span *ngIf="derivacion.usuarioRecibe">
                      por {{ derivacion.usuarioRecibe.nombres }} {{ derivacion.usuarioRecibe.apellidos }}
                    </span>
                  </div>
                  <div *ngIf="derivacion.fechaAtencion" class="derivacion-atencion">
                    <i class="fas fa-check-double text-primary"></i>
                    <span>Atendido el {{ derivacion.fechaAtencion | date: 'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <div *ngIf="derivacion.observaciones" class="derivacion-observaciones">
                    <strong>Observaciones:</strong>
                    <p>{{ derivacion.observaciones }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notas y observaciones -->
        <div class="section notas-section">
          <h3><i class="fas fa-sticky-note"></i> Notas y Observaciones</h3>
          <div class="notas-container">
            <div *ngIf="notas.length === 0" class="empty-state">
              <i class="fas fa-comment-slash"></i>
              <p>No hay notas registradas</p>
            </div>
            <div *ngIf="notas.length > 0" class="notas-list">
              <div class="nota-item" *ngFor="let nota of notas">
                <div class="nota-header">
                  <span class="nota-autor">{{ nota.autor }}</span>
                  <span class="nota-fecha">{{ nota.fecha | date: 'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="nota-contenido">{{ nota.contenido }}</div>
              </div>
            </div>
            <div *ngIf="puedeAgregarNota" class="agregar-nota">
              <textarea 
                [(ngModel)]="nuevaNota"
                placeholder="Agregar una nota..."
                rows="3"
                class="form-control"></textarea>
              <button 
                class="btn btn-primary mt-2"
                (click)="onAgregarNota()"
                [disabled]="!nuevaNota.trim()">
                <i class="fas fa-plus"></i> Agregar Nota
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div *ngIf="!documento && cargando" class="loading-container">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <p>Cargando documento...</p>
    </div>

    <!-- Error state -->
    <div *ngIf="!documento && !cargando && error" class="error-container">
      <i class="fas fa-exclamation-triangle fa-3x"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" (click)="onCerrar()">Volver</button>
    </div>
  `,
  styles: [`
    .detalle-documento-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #f8f9fa;
    }

    .documento-header {
      background: white;
      border-bottom: 1px solid #dee2e6;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .expediente-info h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      color: #2c3e50;
    }

    .badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge.estado-registrado {
      background: #e3f2fd;
      color: #1976d2;
    }

    .badge.estado-en-proceso {
      background: #fff3e0;
      color: #f57c00;
    }

    .badge.estado-atendido {
      background: #e8f5e9;
      color: #388e3c;
    }

    .badge.estado-archivado {
      background: #f5f5f5;
      color: #757575;
    }

    .badge.prioridad-normal {
      background: #e0e0e0;
      color: #616161;
    }

    .badge.prioridad-alta {
      background: #fff3e0;
      color: #f57c00;
    }

    .badge.prioridad-urgente {
      background: #ffebee;
      color: #c62828;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    .btn-outline {
      background: white;
      color: #6c757d;
      border: 1px solid #dee2e6;
    }

    .btn-outline:hover {
      background: #f8f9fa;
    }

    .documento-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .section {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .section h3 {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .section h3 i {
      color: #007bff;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-item label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-item span, .info-item p {
      font-size: 0.875rem;
      color: #2c3e50;
    }

    .asunto-text {
      margin: 0;
      line-height: 1.6;
    }

    .area-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 12px;
      font-weight: 500;
    }

    .etiquetas {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .etiqueta {
      padding: 0.25rem 0.75rem;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 12px;
      font-size: 0.75rem;
      color: #495057;
    }

    .text-danger {
      color: #dc3545 !important;
    }

    .archivos-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .archivo-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .archivo-item:hover {
      background: #e9ecef;
    }

    .archivo-icon {
      font-size: 2rem;
      color: #6c757d;
      width: 40px;
      text-align: center;
    }

    .archivo-info {
      flex: 1;
    }

    .archivo-nombre {
      font-weight: 500;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }

    .archivo-meta {
      font-size: 0.75rem;
      color: #6c757d;
    }

    .archivo-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6c757d;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #007bff;
      color: white;
    }

    .timeline {
      position: relative;
      padding-left: 2rem;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 15px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #dee2e6;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 2rem;
    }

    .timeline-marker {
      position: absolute;
      left: -2rem;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: 2px solid #dee2e6;
      z-index: 1;
    }

    .timeline-marker.pendiente {
      border-color: #ffc107;
      color: #ffc107;
    }

    .timeline-marker.recibido {
      border-color: #17a2b8;
      color: #17a2b8;
    }

    .timeline-marker.atendido {
      border-color: #28a745;
      color: #28a745;
    }

    .timeline-content {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 1rem;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.75rem;
      gap: 1rem;
    }

    .timeline-title {
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .timeline-date {
      font-size: 0.75rem;
      color: #6c757d;
      white-space: nowrap;
    }

    .timeline-body {
      font-size: 0.875rem;
    }

    .derivacion-info p {
      margin: 0.25rem 0;
      color: #495057;
    }

    .derivacion-recepcion,
    .derivacion-atencion {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: white;
      border-radius: 4px;
      font-size: 0.8125rem;
    }

    .derivacion-observaciones {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: white;
      border-radius: 4px;
      border-left: 3px solid #007bff;
    }

    .derivacion-observaciones p {
      margin: 0.5rem 0 0 0;
      color: #495057;
    }

    .badge-urgente {
      background: #dc3545;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
    }

    .mx-2 {
      margin-left: 0.5rem;
      margin-right: 0.5rem;
    }

    .ml-2 {
      margin-left: 0.5rem;
    }

    .text-success {
      color: #28a745;
    }

    .text-primary {
      color: #007bff;
    }

    .notas-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .nota-item {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 3px solid #007bff;
    }

    .nota-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .nota-autor {
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.875rem;
    }

    .nota-fecha {
      font-size: 0.75rem;
      color: #6c757d;
    }

    .nota-contenido {
      color: #495057;
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .agregar-nota {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #dee2e6;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 0.875rem;
      font-family: inherit;
      resize: vertical;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
    }

    .mt-2 {
      margin-top: 0.5rem;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
    }

    .empty-state i {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }

    .loading-state {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
    }

    .loading-state i {
      font-size: 2rem;
      margin-right: 0.5rem;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 2rem;
      text-align: center;
    }

    .loading-container i,
    .error-container i {
      color: #6c757d;
      margin-bottom: 1rem;
    }

    .error-container i {
      color: #dc3545;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: stretch;
      }

      .header-actions .btn {
        flex: 1;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .timeline {
        padding-left: 1.5rem;
      }

      .timeline::before {
        left: 11px;
      }

      .timeline-marker {
        left: -1.5rem;
        width: 24px;
        height: 24px;
      }
    }
  `]
})
export class DetalleDocumentoComponent implements OnInit {
  private documentoService = inject(DocumentoService);
  private derivacionService = inject(DerivacionService);

  @Input() documentoId!: string;
  @Input() puedeDerivار: boolean = true;
  @Input() puedeArchivar: boolean = true;
  @Input() puedeAgregarNota: boolean = true;

  @Output() accionRealizada = new EventEmitter<string>();
  @Output() cerrar = new EventEmitter<void>();

  documento: Documento | null = null;
  historial: HistorialDerivacion | null = null;
  notas: Array<{ autor: string; fecha: Date; contenido: string }> = [];
  nuevaNota: string = '';

  cargando: boolean = false;
  cargandoHistorial: boolean = false;
  error: string = '';

  ngOnInit(): void {
    if (this.documentoId) {
      this.cargarDocumento();
      this.cargarHistorial();
    }
  }

  /**
   * Cargar documento por ID
   */
  cargarDocumento(): void {
    this.cargando = true;
    this.error = '';

    this.documentoService.obtenerDocumento(this.documentoId).subscribe({
      next: (documento) => {
        this.documento = documento;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar documento:', error);
        this.error = 'No se pudo cargar el documento';
        this.cargando = false;
      }
    });
  }

  /**
   * Cargar historial de derivaciones
   */
  cargarHistorial(): void {
    this.cargandoHistorial = true;

    this.derivacionService.obtenerHistorial(this.documentoId).subscribe({
      next: (historial) => {
        this.historial = historial;
        this.cargandoHistorial = false;
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.cargandoHistorial = false;
      }
    });
  }

  /**
   * Obtener clase CSS según estado del documento
   */
  getEstadoClass(estado: EstadoDocumento): string {
    return `estado-${estado.toLowerCase().replace('_', '-')}`;
  }

  /**
   * Obtener etiqueta legible del estado
   */
  getEstadoLabel(estado: EstadoDocumento): string {
    const labels: Record<EstadoDocumento, string> = {
      [EstadoDocumento.REGISTRADO]: 'Registrado',
      [EstadoDocumento.EN_PROCESO]: 'En Proceso',
      [EstadoDocumento.ATENDIDO]: 'Atendido',
      [EstadoDocumento.ARCHIVADO]: 'Archivado'
    };
    return labels[estado] || estado;
  }

  /**
   * Obtener clase CSS según prioridad
   */
  getPrioridadClass(prioridad: PrioridadDocumento): string {
    return `prioridad-${prioridad.toLowerCase()}`;
  }

  /**
   * Obtener etiqueta legible de la prioridad
   */
  getPrioridadLabel(prioridad: PrioridadDocumento): string {
    const labels: Record<PrioridadDocumento, string> = {
      [PrioridadDocumento.NORMAL]: 'Normal',
      [PrioridadDocumento.ALTA]: 'Alta',
      [PrioridadDocumento.URGENTE]: 'Urgente'
    };
    return labels[prioridad] || prioridad;
  }

  /**
   * Verificar si el documento está vencido
   */
  estaVencido(): boolean {
    if (!this.documento?.fechaLimite) return false;
    return new Date(this.documento.fechaLimite) < new Date();
  }

  /**
   * Obtener icono según tipo MIME del archivo
   */
  getArchivoIcon(tipoMime: string): string {
    if (tipoMime.startsWith('image/')) return 'fas fa-file-image';
    if (tipoMime.includes('pdf')) return 'fas fa-file-pdf';
    if (tipoMime.includes('word')) return 'fas fa-file-word';
    if (tipoMime.includes('excel') || tipoMime.includes('spreadsheet')) return 'fas fa-file-excel';
    if (tipoMime.includes('zip') || tipoMime.includes('rar')) return 'fas fa-file-archive';
    return 'fas fa-file';
  }

  /**
   * Verificar si el archivo es una imagen
   */
  esImagen(tipoMime: string): boolean {
    return tipoMime.startsWith('image/');
  }

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtener clase CSS según estado de derivación
   */
  getDerivacionEstadoClass(estado: string): string {
    return estado.toLowerCase();
  }

  /**
   * Obtener icono según estado de derivación
   */
  getDerivacionIcon(estado: string): string {
    const icons: Record<string, string> = {
      'PENDIENTE': 'fas fa-clock',
      'RECIBIDO': 'fas fa-inbox',
      'ATENDIDO': 'fas fa-check-circle'
    };
    return icons[estado] || 'fas fa-circle';
  }

  /**
   * Descargar archivo adjunto
   */
  onDescargarArchivo(archivo: ArchivoAdjunto): void {
    window.open(archivo.url, '_blank');
  }

  /**
   * Ver archivo (para imágenes)
   */
  onVerArchivo(archivo: ArchivoAdjunto): void {
    window.open(archivo.url, '_blank');
  }

  /**
   * Descargar comprobante de recepción
   */
  onDescargarComprobante(): void {
    if (this.documento) {
      this.documentoService.descargarComprobante(
        this.documento.id,
        this.documento.numeroExpediente
      );
    }
  }

  /**
   * Acción de derivar documento
   */
  onDerivar(): void {
    this.accionRealizada.emit('derivar');
  }

  /**
   * Acción de archivar documento
   */
  onArchivar(): void {
    if (confirm('¿Está seguro de archivar este documento?')) {
      this.accionRealizada.emit('archivar');
    }
  }

  /**
   * Agregar nueva nota
   */
  onAgregarNota(): void {
    if (!this.nuevaNota.trim()) return;

    // TODO: Implementar llamada al servicio para guardar la nota
    const nota = {
      autor: 'Usuario Actual', // TODO: Obtener del servicio de autenticación
      fecha: new Date(),
      contenido: this.nuevaNota.trim()
    };

    this.notas.unshift(nota);
    this.nuevaNota = '';
    this.accionRealizada.emit('nota-agregada');
  }

  /**
   * Cerrar detalle
   */
  onCerrar(): void {
    this.cerrar.emit();
  }
}
