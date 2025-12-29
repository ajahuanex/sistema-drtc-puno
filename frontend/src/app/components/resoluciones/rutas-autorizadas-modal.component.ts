import { Component, Inject, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RutaService } from '../../services/ruta.service';
import { ResolucionService } from '../../services/resolucion.service';
import { Resolucion } from '../../models/resolucion.model';
import { Ruta } from '../../models/ruta.model';

interface RutasAutorizadasModalData {
  resolucion: Resolucion;
}

@Component({
  selector: 'app-rutas-autorizadas-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="modal-header">
      <div class="header-content">
        <h2>Rutas Autorizadas</h2>
        <h3>{{ data.resolucion.nroResolucion }}</h3>
        <div class="tipo-badge" [class]="'tipo-' + data.resolucion.tipoResolucion.toLowerCase()">
          <mat-icon>{{ data.resolucion.tipoResolucion === 'PADRE' ? 'account_tree' : 'subdirectory_arrow_right' }}</mat-icon>
          <span>{{ data.resolucion.tipoResolucion }}</span>
        </div>
      </div>
      <button mat-icon-button (click)="cerrar()" class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div class="modal-content">
      @if (cargando()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando rutas autorizadas...</p>
        </div>
      } @else {
        
        <!-- Información de la resolución -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>info</mat-icon>
              Información de la Resolución
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Número:</span>
                <span class="value">{{ data.resolucion.nroResolucion }}</span>
              </div>
              <div class="info-item">
                <span class="label">Tipo:</span>
                <span class="value">{{ data.resolucion.tipoResolucion }}</span>
              </div>
              <div class="info-item">
                <span class="label">Tipo de Trámite:</span>
                <span class="value">{{ data.resolucion.tipoTramite }}</span>
              </div>
              <div class="info-item">
                <span class="label">Estado:</span>
                <span class="value">{{ data.resolucion.estado }}</span>
              </div>
            </div>
            
            <!-- Información específica del tipo -->
            @if (data.resolucion.tipoResolucion === 'PADRE') {
              <div class="tipo-info padre">
                <mat-icon>account_tree</mat-icon>
                <div class="tipo-descripcion">
                  <h4>Resolución PADRE</h4>
                  <p>Las rutas generales listadas se aplican a todos los vehículos habilitados en esta resolución.</p>
                </div>
              </div>
            } @else if (data.resolucion.tipoResolucion === 'HIJO') {
              <div class="tipo-info hijo">
                <mat-icon>subdirectory_arrow_right</mat-icon>
                <div class="tipo-descripcion">
                  <h4>Resolución HIJO</h4>
                  @if (data.resolucion.resolucionPadreId) {
                    <p>Esta resolución hereda las rutas de su resolución padre. Los vehículos pueden tener rutas específicas adicionales.</p>
                  } @else {
                    <p>Esta resolución permite rutas específicas personalizadas para cada vehículo.</p>
                  }
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Lista de rutas autorizadas -->
        <mat-card class="rutas-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>route</mat-icon>
              Rutas Autorizadas
              <span class="count-badge">{{ rutasAutorizadas().length }}</span>
            </mat-card-title>
            <mat-card-subtitle>
              @if (data.resolucion.tipoResolucion === 'PADRE') {
                Rutas generales que se aplican a todos los vehículos
              } @else {
                Rutas disponibles para crear rutas específicas
              }
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (rutasAutorizadas().length === 0) {
              <div class="empty-state">
                <mat-icon>route</mat-icon>
                <h4>No hay rutas autorizadas</h4>
                @if (data.resolucion.tipoResolucion === 'PADRE') {
                  <p>Esta resolución PADRE debe tener rutas generales asignadas.</p>
                  <small>Edita la resolución para agregar rutas autorizadas.</small>
                } @else if (data.resolucion.resolucionPadreId) {
                  <p>Esta resolución HIJO hereda las rutas de su resolución padre.</p>
                  <small>Verifica que la resolución padre tenga rutas asignadas.</small>
                } @else {
                  <p>Esta resolución HIJO puede usar cualquier ruta general disponible.</p>
                  <small>Las rutas específicas se crean según necesidad.</small>
                }
              </div>
            } @else {
              <div class="rutas-list">
                @for (ruta of rutasAutorizadas(); track ruta.id) {
                  <div class="ruta-item">
                    <div class="ruta-header">
                      <h4 class="ruta-codigo">{{ ruta.codigoRuta }}</h4>
                      <mat-chip class="tipo-ruta-chip" [class]="'tipo-' + ruta.tipoRuta.toLowerCase()">
                        {{ ruta.tipoRuta }}
                      </mat-chip>
                    </div>
                    
                    <div class="ruta-trayecto">
                      <mat-icon class="trayecto-icon">place</mat-icon>
                      <span class="origen">{{ ruta.origen }}</span>
                      <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                      <span class="destino">{{ ruta.destino }}</span>
                    </div>
                    
                    <div class="ruta-details">
                      <div class="detail-item">
                        <mat-icon>straighten</mat-icon>
                        <span>{{ ruta.distancia }} km</span>
                      </div>
                      @if (ruta.tiempoEstimado) {
                        <div class="detail-item">
                          <mat-icon>schedule</mat-icon>
                          <span>{{ ruta.tiempoEstimado }} min</span>
                        </div>
                      }
                      <div class="detail-item estado" [class]="'estado-' + ruta.estado.toLowerCase()">
                        <mat-icon>{{ getEstadoIcon(ruta.estado) }}</mat-icon>
                        <span>{{ ruta.estado }}</span>
                      </div>
                    </div>
                    
                    @if (ruta.descripcion) {
                      <div class="ruta-descripcion">
                        <mat-icon>description</mat-icon>
                        <span>{{ ruta.descripcion }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Información adicional para resoluciones HIJO -->
        @if (data.resolucion.tipoResolucion === 'HIJO' && data.resolucion.resolucionPadreId) {
          <mat-card class="herencia-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>link</mat-icon>
                Herencia de Resolución Padre
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (cargandoPadre()) {
                <div class="loading-padre">
                  <mat-spinner diameter="24"></mat-spinner>
                  <span>Cargando información del padre...</span>
                </div>
              } @else if (resolucionPadre()) {
                <div class="padre-info">
                  <div class="padre-header">
                    <h4>{{ resolucionPadre()?.nroResolucion }}</h4>
                    <mat-chip class="padre-chip">PADRE</mat-chip>
                  </div>
                  <p class="padre-descripcion">
                    Esta resolución HIJO hereda {{ resolucionPadre()?.rutasAutorizadasIds?.length || 0 }} 
                    rutas autorizadas de su resolución padre.
                  </p>
                </div>
              } @else {
                <div class="padre-error">
                  <mat-icon>warning</mat-icon>
                  <span>No se pudo cargar la información de la resolución padre</span>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      }
    </div>

    <div class="modal-actions">
      <button mat-button (click)="cerrar()">
        <mat-icon>close</mat-icon>
        Cerrar
      </button>
      <button mat-raised-button color="primary" (click)="gestionarRutas()">
        <mat-icon>edit</mat-icon>
        Gestionar Rutas
      </button>
    </div>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      position: relative;
    }

    .header-content h2 {
      margin: 0 0 4px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .header-content h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 400;
      opacity: 0.9;
    }

    .tipo-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.2);
      width: fit-content;
    }

    .tipo-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .close-button {
      color: white;
      position: absolute;
      top: 16px;
      right: 16px;
    }

    .modal-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      gap: 16px;
    }

    .info-card,
    .rutas-card,
    .herencia-card {
      margin-bottom: 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item .label {
      font-weight: 600;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
    }

    .info-item .value {
      font-weight: 500;
      color: #333;
    }

    .tipo-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
    }

    .tipo-info.padre {
      background: #e3f2fd;
      border-left: 4px solid #1976d2;
    }

    .tipo-info.hijo {
      background: #f3e5f5;
      border-left: 4px solid #7b1fa2;
    }

    .tipo-info mat-icon {
      color: inherit;
      margin-top: 2px;
    }

    .tipo-descripcion h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .tipo-descripcion p {
      margin: 0;
      font-size: 14px;
      line-height: 1.4;
      color: rgba(0, 0, 0, 0.7);
    }

    .count-badge {
      background: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }

    .rutas-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .ruta-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      background: #fafafa;
      transition: all 0.2s ease;
    }

    .ruta-item:hover {
      background: #f0f0f0;
      border-color: #1976d2;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .ruta-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .ruta-codigo {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1976d2;
    }

    .tipo-ruta-chip {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .tipo-ruta-chip.tipo-interurbana {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .tipo-ruta-chip.tipo-interprovincial {
      background: #e3f2fd;
      color: #1976d2;
    }

    .tipo-ruta-chip.tipo-interregional {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .tipo-ruta-chip.tipo-urbana {
      background: #fff3e0;
      color: #f57c00;
    }

    .ruta-trayecto {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 500;
    }

    .trayecto-icon {
      color: #4caf50;
      font-size: 18px;
    }

    .arrow-icon {
      color: #666;
      font-size: 16px;
    }

    .origen,
    .destino {
      font-weight: 600;
      color: #333;
    }

    .ruta-details {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #666;
      background: white;
      padding: 4px 8px;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
    }

    .detail-item mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .detail-item.estado.estado-activa {
      background: #e8f5e8;
      color: #2e7d32;
      border-color: #c8e6c9;
    }

    .detail-item.estado.estado-inactiva {
      background: #ffebee;
      color: #d32f2f;
      border-color: #ffcdd2;
    }

    .ruta-descripcion {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      color: #666;
      font-style: italic;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
    }

    .ruta-descripcion mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-top: 1px;
      color: #999;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      text-align: center;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #ccc;
    }

    .empty-state h4 {
      margin: 0 0 8px 0;
      font-weight: 500;
      color: #333;
    }

    .empty-state p {
      margin: 0 0 4px 0;
      font-size: 14px;
    }

    .empty-state small {
      color: #999;
      font-size: 12px;
    }

    .herencia-card {
      border-left: 4px solid #7b1fa2;
    }

    .loading-padre {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      color: #666;
    }

    .padre-info {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .padre-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .padre-header h4 {
      margin: 0;
      color: #1976d2;
      font-weight: 600;
    }

    .padre-chip {
      background: #e3f2fd;
      color: #1976d2;
      font-size: 10px;
      font-weight: 600;
    }

    .padre-descripcion {
      margin: 0;
      font-size: 14px;
      color: #666;
    }

    .padre-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      color: #d32f2f;
      background: #ffebee;
      border-radius: 8px;
    }

    .modal-actions {
      display: flex;
      justify-content: space-between;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      background: #fafafa;
    }

    @media (max-width: 768px) {
      .modal-content {
        padding: 16px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .ruta-details {
        flex-direction: column;
        gap: 8px;
      }

      .ruta-trayecto {
        flex-wrap: wrap;
      }
    }
  `]
})
export class RutasAutorizadasModalComponent implements OnInit {
  private rutaService = inject(RutaService);
  private resolucionService = inject(ResolucionService);

  // Signals
  cargando = signal(false);
  cargandoPadre = signal(false);
  rutasAutorizadas = signal<Ruta[]>([]);
  resolucionPadre = signal<Resolucion | null>(null);

  constructor(
    public dialogRef: MatDialogRef<RutasAutorizadasModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RutasAutorizadasModalData
  ) {}

  ngOnInit(): void {
    this.cargarRutasAutorizadas();
    
    // Si es resolución HIJO con padre, cargar información del padre
    if (this.data.resolucion.tipoResolucion === 'HIJO' && this.data.resolucion.resolucionPadreId) {
      this.cargarResolucionPadre();
    }
  }

  cargarRutasAutorizadas(): void {
    this.cargando.set(true);
    
    if (!this.data.resolucion.rutasAutorizadasIds || this.data.resolucion.rutasAutorizadasIds.length === 0) {
      this.rutasAutorizadas.set([]);
      this.cargando.set(false);
      return;
    }

    this.rutaService.getRutas().subscribe({
      next: (todasRutas) => {
        const rutasAutorizadas = todasRutas.filter(ruta => 
          this.data.resolucion.rutasAutorizadasIds!.includes(ruta.id)
        );
        
        console.log('✅ Rutas autorizadas cargadas:', rutasAutorizadas.length);
        this.rutasAutorizadas.set(rutasAutorizadas);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando rutas autorizadas:', error);
        this.rutasAutorizadas.set([]);
        this.cargando.set(false);
      }
    });
  }

  cargarResolucionPadre(): void {
    if (!this.data.resolucion.resolucionPadreId) return;

    this.cargandoPadre.set(true);
    
    this.resolucionService.getResolucionPorId(this.data.resolucion.resolucionPadreId).subscribe({
      next: (resolucionPadre) => {
        console.log('✅ Resolución padre cargada:', resolucionPadre);
        this.resolucionPadre.set(resolucionPadre);
        this.cargandoPadre.set(false);
      },
      error: (error) => {
        console.error('Error cargando resolución padre:', error);
        this.resolucionPadre.set(null);
        this.cargandoPadre.set(false);
      }
    });
  }

  getEstadoIcon(estado: string): string {
    switch (estado.toUpperCase()) {
      case 'ACTIVA':
        return 'check_circle';
      case 'INACTIVA':
        return 'cancel';
      case 'SUSPENDIDA':
        return 'pause_circle';
      default:
        return 'help';
    }
  }

  gestionarRutas(): void {
    // TODO: Navegar a la gestión de rutas de la resolución
    console.log('🛣️ Gestionar rutas de la resolución:', this.data.resolucion.id);
    this.dialogRef.close({ accion: 'gestionar', resolucion: this.data.resolucion });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}