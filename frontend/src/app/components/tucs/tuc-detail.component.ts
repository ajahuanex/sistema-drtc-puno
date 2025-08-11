import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Tuc, EstadoTuc } from '../../models/tuc.model';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { TucService } from '../../services/tuc.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-tuc-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="tuc-detail-container">
      @if (cargando()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando información del TUC...</p>
        </div>
      } @else if (tucCompleto()) {
        <div class="detail-content">
          <!-- Header del TUC -->
          <mat-card class="header-card">
            <mat-card-content>
              <div class="header-content">
                <div class="tuc-main-info">
                  <h1 class="tuc-number">{{ tucCompleto()?.tuc?.nroTuc ?? 'N/A' }}</h1>
                  <div class="tuc-status">
                    <mat-chip-listbox>
                      <mat-chip-option 
                        [color]="getEstadoColor(tucCompleto()?.tuc?.estado ?? 'VIGENTE')" 
                        [selected]="true"
                        [disabled]="true">
                        {{ getEstadoDisplayName(tucCompleto()?.tuc?.estado ?? 'VIGENTE') }}
                      </mat-chip-option>
                    </mat-chip-listbox>
                    
                    @if (tucCompleto()?.tuc?.estado === 'VIGENTE') {
                      @if (isTucProximoAVencer(tucCompleto()?.tuc?.fechaEmision ?? '')) {
                        <mat-chip-option color="warn" selected disabled>
                          <mat-icon>warning</mat-icon>
                          Próximo a Vencer
                        </mat-chip-option>
                      } @else if (isTucVencido(tucCompleto()?.tuc?.fechaEmision ?? '')) {
                        <mat-chip-option color="accent" selected disabled>
                          <mat-icon>error</mat-icon>
                          Vencido
                        </mat-chip-option>
                      }
                    }
                  </div>
                </div>
                
                <div class="header-actions">
                  <button mat-raised-button 
                          color="primary" 
                          (click)="editarTuc()"
                          [disabled]="tucCompleto()?.tuc?.estado !== 'VIGENTE'">
                    <mat-icon>edit</mat-icon>
                    Editar
                  </button>
                  
                  @if (tucCompleto()?.tuc?.estado === 'VIGENTE') {
                    <button mat-raised-button 
                            color="warn" 
                            (click)="darDeBajaTuc()">
                      <mat-icon>block</mat-icon>
                      Dar de Baja
                    </button>
                  } @else if (tucCompleto()?.tuc?.estado === 'DADA_DE_BAJA') {
                    <button mat-raised-button 
                            color="accent" 
                            (click)="reactivarTuc()">
                      <mat-icon>refresh</mat-icon>
                      Reactivar
                    </button>
                  }
                  
                  <button mat-raised-button 
                          color="primary" 
                          (click)="generarQR()">
                    <mat-icon>qr_code</mat-icon>
                    Generar QR
                  </button>
                  
                  <button mat-raised-button 
                          (click)="descargarDocumento()">
                    <mat-icon>download</mat-icon>
                    Descargar
                  </button>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Información del TUC -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>Información del TUC</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Número TUC:</span>
                  <span class="info-value">{{ tucCompleto()?.tuc?.nroTuc ?? 'N/A' }}</span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">Fecha de Emisión:</span>
                  <span class="info-value">{{ tucCompleto()?.tuc?.fechaEmision | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">Estado:</span>
                  <span class="info-value">{{ getEstadoDisplayName(tucCompleto()?.tuc?.estado ?? 'VIGENTE') }}</span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">Documento ID:</span>
                  <span class="info-value">{{ tucCompleto()?.tuc?.documentoId ?? 'No asignado' }}</span>
                </div>
                
                @if (tucCompleto()?.tuc?.razonDescarte) {
                  <div class="info-item full-width">
                    <span class="info-label">Razón de Descarte:</span>
                    <span class="info-value">{{ tucCompleto()?.tuc?.razonDescarte }}</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Información del Vehículo -->
          @if (tucCompleto()?.vehiculo && (tucCompleto()?.vehiculo?.id || tucCompleto()?.vehiculo?.placa)) {
            <mat-card class="vehiculo-card">
              <mat-card-header>
                <mat-card-title>Vehículo Asociado</mat-card-title>
                <mat-card-subtitle>Información del vehículo del TUC</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="vehiculo-info">
                  <div class="vehiculo-main">
                    <div class="placa-container">
                      <span class="placa-label">Placa:</span>
                      <span class="placa-value">{{ tucCompleto()?.vehiculo?.placa ?? 'N/A' }}</span>
                    </div>
                    
                    <div class="marca-modelo">
                                        <span class="marca">{{ tucCompleto()?.vehiculo?.marca ?? 'N/A' }}</span>
                  <span class="modelo">{{ tucCompleto()?.vehiculo?.modelo ?? 'N/A' }}</span>
                    </div>
                  </div>
                  
                  <div class="vehiculo-details">
                    <div class="detail-item">
                      <span class="detail-label">Categoría:</span>
                                          <span class="detail-value">{{ tucCompleto()?.vehiculo?.categoria ?? 'N/A' }}</span>
                  </div>
                  
                  <div class="detail-item">
                    <span class="detail-label">Año de Fabricación:</span>
                    <span class="detail-value">{{ tucCompleto()?.vehiculo?.anioFabricacion ?? 'N/A' }}</span>
                  </div>
                  
                  <div class="detail-item">
                    <span class="detail-label">Estado:</span>
                    <span class="detail-value">{{ tucCompleto()?.vehiculo?.estado ?? 'N/A' }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="card-actions">
                  <button mat-button color="primary" (click)="verVehiculo()">
                    <mat-icon>visibility</mat-icon>
                    Ver Vehículo
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          } @else {
            <mat-card class="vehiculo-card">
              <mat-card-content>
                <p class="no-data">No hay información del vehículo disponible</p>
              </mat-card-content>
            </mat-card>
          }

          <!-- Información de la Empresa -->
          @if (tucCompleto()?.empresa && (tucCompleto()?.empresa?.id || tucCompleto()?.empresa?.razonSocial)) {
            <mat-card class="empresa-card">
              <mat-card-header>
                <mat-card-title>Empresa Titular</mat-card-title>
                <mat-card-subtitle>Empresa propietaria del TUC</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="empresa-info">
                  <div class="empresa-main">
                                    <h3 class="empresa-nombre">{{ tucCompleto()?.empresa?.razonSocial ?? 'N/A' }}</h3>
                <span class="empresa-ruc">RUC: {{ tucCompleto()?.empresa?.ruc ?? 'N/A' }}</span>
                  </div>
                  
                  <div class="empresa-details">
                    <div class="detail-item">
                      <span class="detail-label">Dirección:</span>
                                          <span class="detail-value">{{ tucCompleto()?.empresa?.direccion ?? 'N/A' }}</span>
                  </div>
                  
                  <div class="detail-item">
                    <span class="detail-label">Teléfono:</span>
                    <span class="detail-value">{{ tucCompleto()?.empresa?.telefono ?? 'No registrado' }}</span>
                  </div>
                  
                  <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">{{ tucCompleto()?.empresa?.email ?? 'No registrado' }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="card-actions">
                  <button mat-button color="primary" (click)="verEmpresa()">
                    <mat-icon>business</mat-icon>
                    Ver Empresa
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          } @else {
            <mat-card class="empresa-card">
              <mat-card-content>
                <p class="no-data">No hay información de la empresa disponible</p>
              </mat-card-content>
            </mat-card>
          }

          <!-- Información de la Resolución -->
          @if (tucCompleto()?.resolucion && (tucCompleto()?.resolucion?.id || tucCompleto()?.resolucion?.nroResolucion)) {
            <mat-card class="resolucion-card">
              <mat-card-header>
                <mat-card-title>Resolución Autorizante</mat-card-title>
                <mat-card-subtitle>Resolución que autoriza el TUC</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="resolucion-info">
                  <div class="resolucion-main">
                                    <h3 class="resolucion-numero">{{ tucCompleto()?.resolucion?.nroResolucion ?? 'N/A' }}</h3>
                <span class="resolucion-fecha">Fecha: {{ tucCompleto()?.resolucion?.fechaEmision | date:'dd/MM/yyyy' }}</span>
                  </div>
                  
                  <div class="resolucion-details">
                    <div class="detail-item">
                      <span class="detail-label">Tipo:</span>
                      <span class="detail-value">{{ tucCompleto()?.resolucion?.tipoTramite ?? 'N/A' }}</span>
                    </div>
                  
                  <div class="detail-item">
                    <span class="detail-label">Estado:</span>
                    <span class="detail-value">{{ tucCompleto()?.resolucion?.estado ?? 'N/A' }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="card-actions">
                  <button mat-button color="primary" (click)="verResolucion()">
                    <mat-icon>description</mat-icon>
                    Ver Resolución
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          } @else {
            <mat-card class="resolucion-card">
              <mat-card-content>
                <p class="no-data">No hay información de la resolución disponible</p>
              </mat-card-content>
            </mat-card>
          }

          <!-- Verificación QR -->
          @if (tucCompleto()?.tuc?.qrVerificationUrl) {
            <mat-card class="qr-card">
              <mat-card-header>
                <mat-card-title>Verificación QR</mat-card-title>
                <mat-card-subtitle>URL de verificación del TUC</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="qr-info">
                  <p class="qr-url">{{ tucCompleto()?.tuc?.qrVerificationUrl }}</p>
                  <p class="qr-description">
                    Este enlace permite verificar la autenticidad del TUC mediante escaneo de código QR.
                  </p>
                </div>
                
                <div class="card-actions">
                  <button mat-raised-button color="primary" (click)="abrirVerificacionQR()">
                    <mat-icon>open_in_new</mat-icon>
                    Abrir Verificación
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      } @else {
        <div class="error-container">
          <mat-icon>error</mat-icon>
          <h2>TUC no encontrado</h2>
          <p>No se pudo cargar la información del TUC solicitado.</p>
          <button mat-raised-button color="primary" (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .tuc-detail-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      gap: 16px;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .header-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
    }

    .tuc-main-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tuc-number {
      font-size: 36px;
      font-weight: 700;
      margin: 0;
      font-family: 'Courier New', monospace;
    }

    .tuc-status {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .info-card,
    .vehiculo-card,
    .empresa-card,
    .resolucion-card,
    .qr-card {
      margin-bottom: 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-label {
      font-weight: 500;
      color: #666;
      font-size: 14px;
    }

    .info-value {
      font-size: 16px;
      color: #333;
    }

    .vehiculo-info,
    .empresa-info,
    .resolucion-info,
    .qr-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .vehiculo-main,
    .empresa-main,
    .resolucion-main {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .placa-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .placa-label {
      font-weight: 500;
      color: #666;
    }

    .placa-value {
      font-size: 24px;
      font-weight: 700;
      color: #1976d2;
      font-family: 'Courier New', monospace;
    }

    .marca-modelo {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .marca {
      font-weight: 600;
      color: #333;
    }

    .modelo {
      color: #666;
    }

    .empresa-nombre {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .empresa-ruc {
      font-size: 16px;
      color: #666;
      font-family: 'Courier New', monospace;
    }

    .resolucion-numero {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 0;
      font-family: 'Courier New', monospace;
    }

    .resolucion-fecha {
      font-size: 16px;
      color: #666;
    }

    .vehiculo-details,
    .empresa-details,
    .resolucion-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-label {
      font-weight: 500;
      color: #666;
      font-size: 14px;
    }

    .detail-value {
      font-size: 16px;
      color: #333;
      text-transform: uppercase;
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .qr-url {
      font-family: 'Courier New', monospace;
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      margin: 0 0 16px 0;
      word-break: break-all;
    }

    .qr-description {
      color: #666;
      margin: 0 0 16px 0;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      text-align: center;
      gap: 16px;
    }

    .error-container mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
    }

    .error-container h2 {
      margin: 0;
      color: #333;
    }

    .error-container p {
      margin: 0;
      color: #666;
    }

    @media (max-width: 768px) {
      .tuc-detail-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: center;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .vehiculo-details,
      .empresa-details,
      .resolucion-details {
        grid-template-columns: 1fr;
      }
    }

    .no-data {
      text-align: center;
      color: #666;
      font-style: italic;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
  `]
})
export class TucDetailComponent implements OnInit {
  private tucService = inject(TucService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private snackBar = inject(MatSnackBar);

  // Signals
  tucCompleto = signal<{
    tuc: Tuc;
    vehiculo: Vehiculo;
    empresa: Empresa;
    resolucion: Resolucion;
  } | null>(null);
  cargando = signal(true);

  ngOnInit() {
    this.cargarTuc();
  }

  private cargarTuc() {
    // Usar paramMap de manera más robusta
    this.route.paramMap.subscribe(params => {
      const tucId = params.get('id');
      if (!tucId) {
        console.error('No se proporcionó ID de TUC');
        this.notificationService.showError('ID de TUC no válido');
        this.cargando.set(false);
        return;
      }

      console.log('Cargando TUC con ID:', tucId);
      this.tucService.getTucCompleto(tucId).subscribe({
        next: (tucCompleto) => {
          console.log('TUC cargado exitosamente:', tucCompleto);
          this.tucCompleto.set(tucCompleto);
          this.cargando.set(false);
        },
        error: (error) => {
          console.error('Error cargando TUC:', error);
          this.notificationService.showError('Error al cargar el TUC');
          this.cargando.set(false);
        }
      });
    });
  }

  getEstadoColor(estado: EstadoTuc): string {
    switch (estado) {
      case 'VIGENTE': return 'primary';
      case 'DADA_DE_BAJA': return 'warn';
      case 'DESECHADA': return 'accent';
      default: return 'primary';
    }
  }

  getEstadoDisplayName(estado: EstadoTuc): string {
    switch (estado) {
      case 'VIGENTE': return 'VIGENTE';
      case 'DADA_DE_BAJA': return 'DADO DE BAJA';
      case 'DESECHADA': return 'DESECHADO';
      default: return estado;
    }
  }

  isTucProximoAVencer(fechaEmision: string): boolean {
    return this.tucService.isTucProximoAVencer(fechaEmision);
  }

  isTucVencido(fechaEmision: string): boolean {
    return this.tucService.isTucVencido(fechaEmision);
  }

  editarTuc() {
    // TODO: Implementar edición
    this.notificationService.showInfo('Edición en desarrollo');
  }

  darDeBajaTuc() {
    // TODO: Implementar dar de baja
    this.notificationService.showInfo('Dar de baja en desarrollo');
  }

  reactivarTuc() {
    // TODO: Implementar reactivación
    this.notificationService.showInfo('Reactivación en desarrollo');
  }

  generarQR() {
    // TODO: Implementar generación de QR
    this.notificationService.showInfo('Generación de QR en desarrollo');
  }

  descargarDocumento() {
    // TODO: Implementar descarga
    this.notificationService.showInfo('Descarga en desarrollo');
  }

  verVehiculo() {
    const vehiculoId = this.tucCompleto()?.vehiculo.id;
    if (vehiculoId) {
      this.router.navigate(['/vehiculos', vehiculoId]);
    }
  }

  verEmpresa() {
    const empresaId = this.tucCompleto()?.empresa.id;
    if (empresaId) {
      this.router.navigate(['/empresas', empresaId]);
    }
  }

  verResolucion() {
    const resolucionId = this.tucCompleto()?.resolucion.id;
    if (resolucionId) {
      this.router.navigate(['/resoluciones', resolucionId]);
    }
  }

  abrirVerificacionQR() {
    const url = this.tucCompleto()?.tuc.qrVerificationUrl;
    if (url) {
      window.open(url, '_blank');
    }
  }

  volver() {
    this.router.navigate(['/tucs']);
  }
} 