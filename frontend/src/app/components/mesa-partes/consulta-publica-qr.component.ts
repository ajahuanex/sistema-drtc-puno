/**
 * Componente para consulta pública de documentos por QR
 * Página sin autenticación para que ciudadanos consulten el estado de sus trámites
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { QRConsultaService } from '../../services/mesa-partes/qr-consulta.service';
import { DocumentoPublico, DerivacionPublica } from '../../models/mesa-partes/qr-consulta.model';
import { EstadoBadgeComponent } from './shared/estado-badge.component';
import { PrioridadIndicatorComponent } from './shared/prioridad-indicator.component';

@Component({
  selector: 'app-consulta-publica-qr',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EstadoBadgeComponent,
    PrioridadIndicatorComponent
  ],
  template: `
    <div class="consulta-publica-container">
      <!-- Header -->
      <div class="header">
        <div class="logo-section">
          <h1>Consulta de Trámites</h1>
          <p class="subtitle">Sistema de Mesa de Partes</p>
        </div>
      </div>

      <!-- Formulario de búsqueda -->
      <div class="search-section" *ngIf="!documento">
        <div class="search-card">
          <h2>Consultar Estado de Documento</h2>
          <p class="instructions">
            Ingrese el número de expediente o escanee el código QR de su comprobante
          </p>

          <div class="search-tabs">
            <button 
              class="tab-button"
              [class.active]="searchMode === 'expediente'"
              (click)="searchMode = 'expediente'">
              <i class="fas fa-file-alt"></i>
              Número de Expediente
            </button>
            <button 
              class="tab-button"
              [class.active]="searchMode === 'qr'"
              (click)="searchMode = 'qr'">
              <i class="fas fa-qrcode"></i>
              Código QR
            </button>
          </div>

          <div class="search-form">
            <div class="form-group" *ngIf="searchMode === 'expediente'">
              <label>Número de Expediente</label>
              <input 
                type="text" 
                class="form-control"
                [(ngModel)]="numeroExpediente"
                placeholder="Ej: EXP-2025-0001"
                (keyup.enter)="buscarPorExpediente()">
              <small class="form-text">
                Ingrese el número de expediente que aparece en su comprobante
              </small>
            </div>

            <div class="form-group" *ngIf="searchMode === 'qr'">
              <label>Código QR</label>
              <input 
                type="text" 
                class="form-control"
                [(ngModel)]="codigoQR"
                placeholder="Ingrese el código del QR"
                (keyup.enter)="buscarPorQR()">
              <small class="form-text">
                Escanee el código QR o ingrese el código manualmente
              </small>
            </div>

            <button 
              class="btn btn-primary btn-search"
              [disabled]="cargando"
              (click)="searchMode === 'expediente' ? buscarPorExpediente() : buscarPorQR()">
              <i class="fas fa-search" *ngIf="!cargando"></i>
              <i class="fas fa-spinner fa-spin" *ngIf="cargando"></i>
              {{ cargando ? 'Buscando...' : 'Consultar' }}
            </button>
          </div>

          <!-- Mensaje de error -->
          <div class="alert alert-danger" *ngIf="mensajeError">
            <i class="fas fa-exclamation-circle"></i>
            {{ mensajeError }}
          </div>
        </div>
      </div>

      <!-- Resultado de la consulta -->
      <div class="result-section" *ngIf="documento">
        <div class="result-card">
          <!-- Header del resultado -->
          <div class="result-header">
            <div class="result-title">
              <i class="fas fa-file-alt"></i>
              <h2>{{ documento.numero_expediente }}</h2>
            </div>
            <button class="btn btn-secondary" (click)="nuevaBusqueda()">
              <i class="fas fa-search"></i>
              Nueva Búsqueda
            </button>
          </div>

          <!-- Información del documento -->
          <div class="document-info">
            <div class="info-grid">
              <div class="info-item">
                <label>Tipo de Documento</label>
                <span>{{ documento.tipo_documento }}</span>
              </div>

              <div class="info-item">
                <label>Estado Actual</label>
                <span class="badge" [class]="'badge-' + documento.estado.toLowerCase()">
                  {{ getEstadoLabel(documento.estado) }}
                </span>
              </div>

              <div class="info-item">
                <label>Prioridad</label>
                <span class="badge" [class]="'badge-prioridad-' + documento.prioridad.toLowerCase()">
                  {{ documento.prioridad }}
                </span>
              </div>

              <div class="info-item">
                <label>Fecha de Recepción</label>
                <span>{{ documento.fecha_recepcion | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>

              <div class="info-item full-width">
                <label>Asunto</label>
                <span>{{ documento.asunto }}</span>
              </div>

              <div class="info-item">
                <label>Ubicación Actual</label>
                <span class="location">
                  <i class="fas fa-map-marker-alt"></i>
                  {{ documento.area_actual || 'Mesa de Partes' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Historial de movimientos -->
          <div class="historial-section">
            <h3>
              <i class="fas fa-history"></i>
              Historial de Movimientos
            </h3>

            <div class="timeline" *ngIf="documento.historial.length > 0">
              <div class="timeline-item" *ngFor="let movimiento of documento.historial; let i = index">
                <div class="timeline-marker" [class.active]="i === 0">
                  <i class="fas fa-circle"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-date">
                      {{ movimiento.fecha_derivacion | date:'dd/MM/yyyy HH:mm' }}
                    </span>
                    <span class="timeline-badge" [class]="'badge-' + movimiento.estado.toLowerCase()">
                      {{ getEstadoLabel(movimiento.estado) }}
                    </span>
                  </div>
                  <div class="timeline-body">
                    <div class="movement-info">
                      <span class="from">
                        <i class="fas fa-arrow-right"></i>
                        {{ movimiento.area_origen }}
                      </span>
                      <i class="fas fa-long-arrow-alt-right arrow"></i>
                      <span class="to">
                        {{ movimiento.area_destino }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="no-historial" *ngIf="documento.historial.length === 0">
              <i class="fas fa-info-circle"></i>
              <p>El documento aún no ha sido derivado a ninguna área</p>
            </div>
          </div>

          <!-- Información adicional -->
          <div class="info-footer">
            <div class="info-box">
              <i class="fas fa-info-circle"></i>
              <div>
                <strong>Información importante:</strong>
                <p>
                  Este es el estado actual de su trámite. Para mayor información, 
                  puede acercarse a la oficina de Mesa de Partes con su comprobante.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>Sistema de Mesa de Partes - Consulta Pública</p>
        <p class="footer-note">
          <i class="fas fa-lock"></i>
          Consulta segura y confidencial
        </p>
      </div>
    </div>
  `,
  styles: [`
    .consulta-publica-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .header {
      text-align: center;
      color: white;
      margin-bottom: 3rem;
    }

    .logo-section h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
    }

    .search-section {
      max-width: 600px;
      margin: 0 auto;
    }

    .search-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .search-card h2 {
      color: #333;
      margin-bottom: 0.5rem;
      font-size: 1.8rem;
    }

    .instructions {
      color: #666;
      margin-bottom: 2rem;
    }

    .search-tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .tab-button {
      flex: 1;
      padding: 1rem;
      border: 2px solid #e0e0e0;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 1rem;
    }

    .tab-button:hover {
      border-color: #667eea;
      background: #f8f9ff;
    }

    .tab-button.active {
      border-color: #667eea;
      background: #667eea;
      color: white;
    }

    .search-form {
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-text {
      display: block;
      margin-top: 0.5rem;
      color: #666;
      font-size: 0.875rem;
    }

    .btn-search {
      width: 100%;
      padding: 1rem;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .alert-danger {
      background: #fee;
      color: #c33;
      border: 1px solid #fcc;
    }

    .result-section {
      max-width: 900px;
      margin: 0 auto;
    }

    .result-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .result-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .result-title i {
      font-size: 2rem;
      color: #667eea;
    }

    .result-title h2 {
      margin: 0;
      color: #333;
      font-size: 1.8rem;
    }

    .document-info {
      margin-bottom: 2rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-item label {
      font-weight: 600;
      color: #666;
      font-size: 0.875rem;
      text-transform: uppercase;
    }

    .info-item span {
      color: #333;
      font-size: 1rem;
    }

    .location {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #667eea;
      font-weight: 600;
    }

    .historial-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 2px solid #e0e0e0;
    }

    .historial-section h3 {
      color: #333;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .timeline {
      position: relative;
      padding-left: 2rem;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 0.5rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e0e0e0;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 2rem;
    }

    .timeline-marker {
      position: absolute;
      left: -1.5rem;
      top: 0.25rem;
      width: 1rem;
      height: 1rem;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timeline-marker.active {
      border-color: #667eea;
      background: #667eea;
    }

    .timeline-marker i {
      font-size: 0.5rem;
      color: white;
    }

    .timeline-content {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .timeline-date {
      font-size: 0.875rem;
      color: #666;
      font-weight: 600;
    }

    .timeline-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .timeline-badge.badge-pendiente {
      background: #fff3cd;
      color: #856404;
    }

    .timeline-badge.badge-recibido {
      background: #d1ecf1;
      color: #0c5460;
    }

    .timeline-badge.badge-atendido {
      background: #d4edda;
      color: #155724;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
      display: inline-block;
    }

    .badge-registrado {
      background: #e3f2fd;
      color: #1976d2;
    }

    .badge-en_proceso {
      background: #fff3cd;
      color: #856404;
    }

    .badge-finalizado {
      background: #d4edda;
      color: #155724;
    }

    .badge-archivado {
      background: #f5f5f5;
      color: #666;
    }

    .badge-prioridad-alta {
      background: #ffebee;
      color: #c62828;
    }

    .badge-prioridad-media {
      background: #fff3e0;
      color: #ef6c00;
    }

    .badge-prioridad-baja {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .movement-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      color: #333;
    }

    .movement-info .from,
    .movement-info .to {
      font-weight: 600;
    }

    .movement-info .arrow {
      color: #667eea;
    }

    .no-historial {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .no-historial i {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .info-footer {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 2px solid #e0e0e0;
    }

    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9ff;
      border-left: 4px solid #667eea;
      border-radius: 4px;
    }

    .info-box i {
      color: #667eea;
      font-size: 1.5rem;
    }

    .info-box strong {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .info-box p {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }

    .footer {
      text-align: center;
      color: white;
      margin-top: 3rem;
      padding-top: 2rem;
    }

    .footer p {
      margin: 0.5rem 0;
      opacity: 0.9;
    }

    .footer-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    @media (max-width: 768px) {
      .consulta-publica-container {
        padding: 1rem;
      }

      .header h1 {
        font-size: 2rem;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .result-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .search-tabs {
        flex-direction: column;
      }
    }
  `]
})
export class ConsultaPublicaQRComponent implements OnInit {
  searchMode: 'expediente' | 'qr' = 'expediente';
  numeroExpediente: string = '';
  codigoQR: string = '';
  documento: DocumentoPublico | null = null;
  cargando: boolean = false;
  mensajeError: string = '';

  constructor(
    private qrConsultaService: QRConsultaService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Verificar si viene un código QR en la URL
    this.route.queryParams.subscribe(params => {
      if (params['qr']) {
        this.codigoQR = params['qr'];
        this.searchMode = 'qr';
        this.buscarPorQR();
      } else if (params['expediente']) {
        this.numeroExpediente = params['expediente'];
        this.searchMode = 'expediente';
        this.buscarPorExpediente();
      }
    });
  }

  buscarPorExpediente(): void {
    if (!this.numeroExpediente.trim()) {
      this.mensajeError = 'Por favor ingrese un número de expediente';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    this.qrConsultaService.consultarPorExpediente(this.numeroExpediente).subscribe({
      next: (response) => {
        this.cargando = false;
        if (response.success && response.documento) {
          this.documento = response.documento;
        } else {
          this.mensajeError = response.mensaje || 'Documento no encontrado';
        }
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = 'Error al consultar el documento. Por favor intente nuevamente.';
        console.error('Error::', error);
      }
    });
  }

  buscarPorQR(): void {
    if (!this.codigoQR.trim()) {
      this.mensajeError = 'Por favor ingrese un código QR';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    this.qrConsultaService.consultarPorQR(this.codigoQR).subscribe({
      next: (response) => {
        this.cargando = false;
        if (response.success && response.documento) {
          this.documento = response.documento;
        } else {
          this.mensajeError = response.mensaje || 'Documento no encontrado';
        }
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = 'Error al consultar el documento. Por favor intente nuevamente.';
        console.error('Error::', error);
      }
    });
  }

  nuevaBusqueda(): void {
    this.documento = null;
    this.numeroExpediente = '';
    this.codigoQR = '';
    this.mensajeError = '';
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'PENDIENTE': 'Pendiente',
      'RECIBIDO': 'Recibido',
      'ATENDIDO': 'Atendido',
      'EN_PROCESO': 'En Proceso'
    };
    return labels[estado] || estado;
  }
}
