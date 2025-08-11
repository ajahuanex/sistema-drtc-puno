import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExpedienteService } from '../../services/expediente.service';
import { Expediente } from '../../models/expediente.model';

@Component({
  selector: 'app-expediente-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="expediente-detail-container">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando expediente...</p>
        </div>
      } @else if (expediente()) {
        <mat-card class="expediente-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>folder</mat-icon>
              Expediente {{ expediente()!.nroExpediente }}
            </mat-card-title>
            <mat-card-subtitle>
              {{ expediente()!.tipoTramite }} - {{ expediente()!.estado }}
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <!-- Información básica -->
            <div class="info-section">
              <h3>Información Básica</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Número:</span>
                  <span class="value">{{ expediente()!.nroExpediente }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Fecha de Emisión:</span>
                  <span class="value">{{ expediente()!.fechaEmision | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Tipo de Trámite:</span>
                  <span class="value">
                                                <mat-chip [class]="'tipo-chip-' + expediente()!.tipoTramite!.toLowerCase().replace(' ', '-')">
                              {{ expediente()!.tipoTramite }}
                            </mat-chip>
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">Estado:</span>
                  <span class="value">
                                                <mat-chip [class]="'estado-chip-' + expediente()!.estado!.toLowerCase().replace(' ', '-')">
                              {{ expediente()!.estado }}
                            </mat-chip>
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">Descripción:</span>
                  <span class="value">{{ expediente()!.descripcion || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Observaciones:</span>
                  <span class="value">{{ expediente()!.observaciones || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Información de Sincronización -->
            @if (expediente()!.sistemaOrigen && expediente()!.sistemaOrigen !== 'INTERNO') {
              <div class="info-section">
                <h3>
                  <mat-icon>sync</mat-icon>
                  Información de Sincronización
                </h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Sistema Origen:</span>
                    <span class="value">
                      <mat-chip color="accent">
                        {{ expediente()!.sistemaOrigen }}
                      </mat-chip>
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="label">ID Externo:</span>
                    <span class="value">{{ expediente()!.idExterno || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Código Externo:</span>
                    <span class="value">{{ expediente()!.codigoExterno || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Estado Sincronización:</span>
                    <span class="value">
                                                  <mat-chip [class]="'sync-chip-' + expediente()!.estadoSincronizacion!.toLowerCase()">
                              {{ expediente()!.estadoSincronizacion }}
                            </mat-chip>
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="label">Última Sincronización:</span>
                    <span class="value">{{ expediente()!.fechaSincronizacion ? (expediente()!.fechaSincronizacion | date:'dd/MM/yyyy HH:mm') : 'N/A' }}</span>
                  </div>
                  @if (expediente()!.urlExterna) {
                    <div class="info-item">
                      <span class="label">URL Externa:</span>
                      <span class="value">
                        <a [href]="expediente()!.urlExterna" target="_blank" class="external-link">
                          <mat-icon>open_in_new</mat-icon>
                          Ver en sistema externo
                        </a>
                      </span>
                    </div>
                  }
                </div>

                <!-- Metadatos Externos -->
                @if (expediente()!.metadatosExternos) {
                  <div class="metadatos-section">
                    <h4>Metadatos del Sistema Externo</h4>
                    <div class="metadatos-grid">
                      @for (key of getMetadatosKeys(); track key) {
                        <div class="metadato-item">
                          <span class="label">{{ key | titlecase }}:</span>
                          <span class="value">{{ expediente()!.metadatosExternos![key] || 'N/A' }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Información Adicional -->
                @if (expediente()!.prioridad || expediente()!.categoria || expediente()!.tags) {
                  <div class="additional-info">
                    <h4>Información Adicional</h4>
                    <div class="info-grid">
                      @if (expediente()!.prioridad) {
                        <div class="info-item">
                          <span class="label">Prioridad:</span>
                          <span class="value">
                            <mat-chip [class]="'prioridad-chip-' + expediente()!.prioridad!.toLowerCase()">
                              {{ expediente()!.prioridad }}
                            </mat-chip>
                          </span>
                        </div>
                      }
                      @if (expediente()!.categoria) {
                        <div class="info-item">
                          <span class="label">Categoría:</span>
                          <span class="value">{{ expediente()!.categoria }}</span>
                        </div>
                      }
                      @if (expediente()!.tags && expediente()!.tags!.length > 0) {
                        <div class="info-item">
                          <span class="label">Etiquetas:</span>
                          <span class="value">
                            @for (tag of expediente()!.tags; track tag) {
                              <mat-chip class="tag-chip">{{ tag }}</mat-chip>
                            }
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Acciones de Sincronización -->
                <div class="sync-actions">
                  <button mat-raised-button 
                          color="primary" 
                          (click)="verificarIntegridad()"
                          [disabled]="verificandoIntegridad()">
                    <mat-icon>verified</mat-icon>
                    Verificar Integridad
                  </button>
                  <button mat-raised-button 
                          color="accent" 
                          (click)="sincronizarAhora()"
                          [disabled]="sincronizando()">
                    <mat-icon>sync</mat-icon>
                    Sincronizar Ahora
                  </button>
                  @if (expediente()!.hashVerificacion) {
                    <button mat-raised-button 
                            color="warn" 
                            (click)="mostrarHash()">
                      <mat-icon>code</mat-icon>
                      Ver Hash
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Información de Auditoría -->
            <div class="info-section">
              <h3>
                <mat-icon>history</mat-icon>
                Información de Auditoría
              </h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Fecha de Registro:</span>
                  <span class="value">{{ expediente()!.fechaRegistro ? (expediente()!.fechaRegistro | date:'dd/MM/yyyy HH:mm') : 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Última Actualización:</span>
                  <span class="value">{{ expediente()!.fechaActualizacion ? (expediente()!.fechaActualizacion | date:'dd/MM/yyyy HH:mm') : 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Estado Activo:</span>
                  <span class="value">
                                      <mat-chip [class]="expediente()!.estaActivo ? 'activo-chip' : 'inactivo-chip'">
                    {{ expediente()!.estaActivo ? 'ACTIVO' : 'INACTIVO' }}
                  </mat-chip>
                  </span>
                </div>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions align="end">
            <button mat-button (click)="editar()">
              <mat-icon>edit</mat-icon>
              Editar
            </button>
            <button mat-button (click)="volver()">
              <mat-icon>arrow_back</mat-icon>
              Volver
            </button>
          </mat-card-actions>
        </mat-card>
      } @else {
        <div class="error-container">
          <mat-icon>error</mat-icon>
          <p>No se pudo cargar el expediente</p>
          <button mat-raised-button color="primary" (click)="volver()">
            Volver
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .expediente-detail-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .expediente-card {
      margin-bottom: 24px;
    }

    .info-section {
      margin-bottom: 32px;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #fafafa;
    }

    .info-section h3 {
      margin: 0 0 20px 0;
      color: #1976d2;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-section h4 {
      margin: 20px 0 15px 0;
      color: #424242;
      font-size: 1.1em;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .metadatos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
      margin-top: 15px;
    }

    .info-item, .metadato-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .label {
      font-weight: 500;
      color: #666;
      font-size: 0.9em;
    }

    .value {
      color: #333;
      font-size: 1em;
    }

    .external-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #1976d2;
      text-decoration: none;
    }

    .external-link:hover {
      text-decoration: underline;
    }

    .sync-actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
      flex-wrap: wrap;
    }

    .chip {
      margin: 4px;
    }

    .tipo-chip-autorizacion-nueva { background-color: #e3f2fd; color: #1976d2; }
    .tipo-chip-renovacion { background-color: #f3e5f5; color: #7b1fa2; }
    .tipo-chip-incremento { background-color: #e8f5e8; color: #388e3c; }
    .tipo-chip-sustitucion { background-color: #fff3e0; color: #f57c00; }
    .tipo-chip-otros { background-color: #fce4ec; color: #c2185b; }

    .estado-chip-en-proceso { background-color: #fff3e0; color: #f57c00; }
    .estado-chip-aprobado { background-color: #e8f5e8; color: #388e3c; }
    .estado-chip-rechazado { background-color: #ffebee; color: #d32f2f; }
    .estado-chip-suspendido { background-color: #f3e5f5; color: #7b1fa2; }
    .estado-chip-archivado { background-color: #fafafa; color: #757575; }

    .sync-chip-completado { background-color: #e8f5e8; color: #388e3c; }
    .sync-chip-pendiente { background-color: #fff3e0; color: #f57c00; }
    .sync-chip-en-proceso { background-color: #e3f2fd; color: #1976d2; }
    .sync-chip-error { background-color: #ffebee; color: #d32f2f; }
    .sync-chip-conflicto { background-color: #fff8e1; color: #f57c00; }
    .sync-chip-desactualizado { background-color: #fce4ec; color: #c2185b; }

    .prioridad-chip-baja { background-color: #e8f5e8; color: #388e3c; }
    .prioridad-chip-normal { background-color: #e3f2fd; color: #1976d2; }
    .prioridad-chip-alta { background-color: #fff3e0; color: #f57c00; }
    .prioridad-chip-urgente { background-color: #fff8e1; color: #f57c00; }
    .prioridad-chip-critica { background-color: #ffebee; color: #d32f2f; }

    .tag-chip {
      background-color: #f5f5f5;
      color: #666;
      margin: 2px;
    }

    .activo-chip { background-color: #e8f5e8; color: #388e3c; }
    .inactivo-chip { background-color: #ffebee; color: #d32f2f; }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }

    .loading-container mat-spinner {
      margin-bottom: 16px;
    }

    .error-container mat-icon {
      font-size: 48px;
      color: #d32f2f;
    }

    @media (max-width: 768px) {
      .info-grid, .metadatos-grid {
        grid-template-columns: 1fr;
      }
      
      .sync-actions {
        flex-direction: column;
      }
      
      .sync-actions button {
        width: 100%;
      }
    }
  `]
})
export class ExpedienteDetailComponent {
  private expedienteService = inject(ExpedienteService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Signals
  expediente = signal<Expediente | null>(null);
  loading = signal(true);

  // Nuevos signals para sincronización
  verificandoIntegridad = signal(false);
  sincronizando = signal(false);

  constructor() {
    this.cargarExpediente();
  }

  private cargarExpediente(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.expedienteService.getExpediente(id).subscribe({
        next: (expediente) => {
          this.expediente.set(expediente);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar expediente:', error);
          this.snackBar.open('Error al cargar expediente', 'Cerrar', { duration: 3000 });
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  volver(): void {
    this.router.navigate(['/expedientes']);
  }

  editar(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/expedientes', id, 'editar']);
    }
  }

  eliminar(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && confirm('¿Está seguro de que desea eliminar este expediente?')) {
      this.expedienteService.deleteExpediente(id).subscribe({
        next: () => {
          this.snackBar.open('Expediente eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/expedientes']);
        },
        error: (error) => {
          console.error('Error al eliminar expediente:', error);
          this.snackBar.open('Error al eliminar expediente', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  // Nuevos métodos para sincronización
  verificarIntegridad(): void {
    if (!this.expediente()?.id) return;

    this.verificandoIntegridad.set(true);
    
    this.expedienteService.verificarIntegridadExpediente(this.expediente()!.id).subscribe({
      next: (resultado) => {
        this.verificandoIntegridad.set(false);
        
        if (resultado.valido) {
          this.snackBar.open('✅ Integridad verificada correctamente', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open('⚠️ Se detectaron inconsistencias en los datos', 'Cerrar', { duration: 5000 });
        }
      },
      error: (error) => {
        this.verificandoIntegridad.set(false);
        this.snackBar.open('❌ Error al verificar integridad', 'Cerrar', { duration: 3000 });
        console.error('Error verificando integridad:', error);
      }
    });
  }

  sincronizarAhora(): void {
    if (!this.expediente()?.idExterno) return;

    this.sincronizando.set(true);
    
    // Simular sincronización
    setTimeout(() => {
      this.sincronizando.set(false);
      this.snackBar.open('🔄 Sincronización completada', 'Cerrar', { duration: 3000 });
    }, 2000);
  }

  mostrarHash(): void {
    if (this.expediente()?.hashVerificacion) {
      this.snackBar.open(`Hash: ${this.expediente()?.hashVerificacion}`, 'Cerrar', { duration: 5000 });
    }
  }

  getMetadatosKeys(): string[] {
    if (!this.expediente()?.metadatosExternos) return [];
    
    return Object.keys(this.expediente()!.metadatosExternos!).filter(key => 
      this.expediente()!.metadatosExternos![key] !== undefined && 
      this.expediente()!.metadatosExternos![key] !== null
    );
  }
} 