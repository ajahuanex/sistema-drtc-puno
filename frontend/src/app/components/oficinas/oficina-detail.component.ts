import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

import { OficinaService, OficinaEstadisticas } from '../../services/oficina.service';
import { Oficina } from '../../models/oficina.model';

@Component({
  selector: 'app-oficina-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDividerModule,
    MatListModule,
    MatTooltipModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  template: `
    <div class="oficina-detail-container">
      <!-- Header -->
      <div class="header">
        <div class="title-section">
          <h1>{{ oficina()?.nombre | uppercase }}</h1>
          <p>{{ oficina()?.tipoOficina | uppercase }} - {{ oficina()?.ubicacion | uppercase }}</p>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="editarOficina()">
            <mat-icon>edit</mat-icon>
            Editar
          </button>
          <button mat-raised-button color="accent" (click)="verFlujo()">
            <mat-icon>timeline</mat-icon>
            Ver Flujo
          </button>
          <button mat-button routerLink="/oficinas">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando información de la oficina...</p>
        </div>
      } @else if (oficina()) {
        <div class="detail-content">
          <!-- Información General -->
          <mat-card class="info-card">
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Estado</span>
                  <mat-chip [color]="getEstadoColor(oficina()?.estaActiva ? 'ACTIVA' : 'INACTIVA')" selected>
                    {{ oficina()?.estaActiva ? 'ACTIVA' : 'INACTIVA' | uppercase }}
                  </mat-chip>
                </div>
                <div class="info-item">
                  <span class="info-label">Prioridad</span>
                  <mat-chip [color]="getPrioridadColor(oficina()?.prioridad || '')" selected>
                    {{ oficina()?.prioridad | uppercase }}
                  </mat-chip>
                </div>
                <div class="info-item">
                  <span class="info-label">Horario de Atención</span>
                  <span class="info-value">{{ oficina()?.horarioAtencion | uppercase }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Capacidad Máxima</span>
                  <span class="info-value">{{ oficina()?.capacidadMaxima }} expedientes</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Tiempo Promedio</span>
                  <span class="info-value">{{ oficina()?.tiempoPromedioTramite }} días</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Fecha Creación</span>
                  <span class="info-value">{{ oficina()?.fechaCreacion | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Responsable -->
          <mat-card class="responsable-card">
            <mat-card-header>
              <mat-card-title>Responsable de la Oficina</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="responsable-info">
                <div class="responsable-avatar">
                  <mat-icon>person</mat-icon>
                </div>
                <div class="responsable-details">
                  <h3>{{ oficina()?.responsable?.nombres }} {{ oficina()?.responsable?.apellidos | uppercase }}</h3>
                  <p class="cargo">{{ oficina()?.responsable?.cargo | uppercase }}</p>
                  <div class="contact-info">
                    <div class="contact-item">
                      <mat-icon>phone</mat-icon>
                      <span>{{ oficina()?.responsable?.telefono || 'No disponible' }}</span>
                    </div>
                    <div class="contact-item">
                      <mat-icon>email</mat-icon>
                      <span>{{ oficina()?.responsable?.email || 'No disponible' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Contacto de la Oficina -->
          <mat-card class="contact-card">
            <mat-card-header>
              <mat-card-title>Información de Contacto</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="contact-grid">
                <div class="contact-item">
                  <mat-icon>phone</mat-icon>
                  <div class="contact-details">
                    <span class="contact-label">Teléfono</span>
                    <span class="contact-value">{{ oficina()?.telefono }}</span>
                  </div>
                </div>
                <div class="contact-item">
                  <mat-icon>email</mat-icon>
                  <div class="contact-details">
                    <span class="contact-label">Email</span>
                    <span class="contact-value">{{ oficina()?.email }}</span>
                  </div>
                </div>
                <div class="contact-item">
                  <mat-icon>location_on</mat-icon>
                  <div class="contact-details">
                    <span class="contact-label">Ubicación</span>
                    <span class="contact-value">{{ oficina()?.ubicacion | uppercase }}</span>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Estadísticas -->
          @if (estadisticas()) {
            <mat-card class="stats-card">
              <mat-card-header>
                <mat-card-title>Estadísticas de la Oficina</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-icon total">
                      <mat-icon>folder</mat-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-number">{{ estadisticas()?.totalExpedientes }}</span>
                      <span class="stat-label">Total Expedientes</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-icon pending">
                      <mat-icon>pending</mat-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-number">{{ estadisticas()?.expedientesPendientes }}</span>
                      <span class="stat-label">Pendientes</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-icon process">
                      <mat-icon>schedule</mat-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-number">{{ estadisticas()?.expedientesEnProceso }}</span>
                      <span class="stat-label">En Proceso</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-icon completed">
                      <mat-icon>check_circle</mat-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-number">{{ estadisticas()?.expedientesCompletados }}</span>
                      <span class="stat-label">Completados</span>
                    </div>
                  </div>
                </div>

                <mat-divider class="stats-divider"></mat-divider>

                <div class="additional-stats">
                  <div class="additional-stat">
                    <span class="additional-label">Tiempo Promedio de Procesamiento:</span>
                    <span class="additional-value">{{ estadisticas()?.tiempoPromedioProcesamiento }} días</span>
                  </div>
                  <div class="additional-stat">
                    <span class="additional-label">Expedientes por Día:</span>
                    <span class="additional-value">{{ estadisticas()?.expedientesPorDia }}</span>
                  </div>
                  <div class="additional-stat">
                    <span class="additional-label">Expedientes por Mes:</span>
                    <span class="additional-value">{{ estadisticas()?.expedientesPorMes }}</span>
                  </div>
                </div>

                <!-- Gráfico de expedientes por tipo -->
                @if (estadisticas()?.expedientesPorTipo && estadisticas()?.expedientesPorTipo!.length > 0) {
                  <div class="tipo-stats">
                    <h4>Expedientes por Tipo</h4>
                    <div class="tipo-bars">
                      @for (tipo of estadisticas()?.expedientesPorTipo!; track tipo.tipoOficina) {
                        <div class="tipo-bar">
                                                      <span class="tipo-label">{{ tipo.tipoOficina | uppercase }}</span>
                          <div class="bar-container">
                            <div class="bar" [style.width.%]="calcularPorcentajeTipo(tipo.cantidad)"></div>
                          </div>
                          <span class="tipo-cantidad">{{ tipo.cantidad }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }

          <!-- Tabs para más información -->
          <mat-card class="tabs-card">
            <mat-tab-group>
              <!-- Tab: Expedientes -->
              <mat-tab label="Expedientes">
                <div class="tab-content">
                  @if (expedientesLoading()) {
                    <div class="loading-container">
                      <mat-spinner diameter="40"></mat-spinner>
                      <p>Cargando expedientes...</p>
                    </div>
                  } @else {
                    <div class="expedientes-content">
                      <div class="expedientes-header">
                        <h3>Expedientes en esta Oficina</h3>
                        <button mat-raised-button color="primary" (click)="verTodosExpedientes()">
                          Ver Todos
                        </button>
                      </div>
                      
                      @if (expedientes().length > 0) {
                        <table mat-table [dataSource]="expedientes()" class="expedientes-table">
                          <ng-container matColumnDef="numero">
                            <th mat-header-cell *matHeaderCellDef>Número</th>
                            <td mat-cell *matCellDef="let expediente">{{ expediente.numero | uppercase }}</td>
                          </ng-container>

                          <ng-container matColumnDef="tipo">
                            <th mat-header-cell *matHeaderCellDef>Tipo</th>
                            <td mat-cell *matCellDef="let expediente">{{ expediente.tipo | uppercase }}</td>
                          </ng-container>

                          <ng-container matColumnDef="empresa">
                            <th mat-header-cell *matHeaderCellDef>Empresa</th>
                            <td mat-cell *matCellDef="let expediente">{{ expediente.empresa | uppercase }}</td>
                          </ng-container>

                          <ng-container matColumnDef="estado">
                            <th mat-header-cell *matHeaderCellDef>Estado</th>
                            <td mat-cell *matCellDef="let expediente">
                              <mat-chip [color]="getExpedienteEstadoColor(expediente.estado)" selected>
                                {{ expediente.estado | uppercase }}
                              </mat-chip>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="fecha">
                            <th mat-header-cell *matHeaderCellDef>Fecha</th>
                            <td mat-cell *matCellDef="let expediente">{{ expediente.fecha | date:'dd/MM/yyyy' }}</td>
                          </ng-container>

                          <ng-container matColumnDef="acciones">
                            <th mat-header-cell *matHeaderCellDef>Acciones</th>
                            <td mat-cell *matCellDef="let expediente">
                              <button mat-icon-button (click)="verExpediente(expediente)">
                                <mat-icon>visibility</mat-icon>
                              </button>
                            </td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="expedientesColumns"></tr>
                          <tr mat-row *matRowDef="let row; columns: expedientesColumns;"></tr>
                        </table>
                      } @else {
                        <div class="no-expedientes">
                          <mat-icon>folder_open</mat-icon>
                          <p>No hay expedientes en esta oficina</p>
                        </div>
                      }
                    </div>
                  }
                </div>
              </mat-tab>

              <!-- Tab: Dependencias -->
              <!-- <mat-tab label="Dependencias">
                <div class="tab-content">
                  <div class="dependencias-content">
                    <h3>Oficinas de las que Depende</h3>
                    <div class="no-dependencias">
                      <mat-icon>link_off</mat-icon>
                      <p>Esta oficina no depende de otras oficinas</p>
                    </div>
                  </div>
                </div>
              </mat-tab> -->

              <!-- Tab: Permisos -->
              <!-- <mat-tab label="Permisos">
                <div class="tab-content">
                  <div class="permisos-content">
                    <h3>Permisos de la Oficina</h3>
                    <div class="no-permisos">
                      <mat-icon>security</mat-icon>
                      <p>Esta oficina no tiene permisos especiales asignados</p>
                    </div>
                  </div>
                </div>
              </mat-tab> -->
            </mat-tab-group>
          </mat-card>
        </div>
      } @else {
        <mat-card class="no-data-card">
          <mat-card-content>
            <div class="no-data-content">
              <mat-icon class="no-data-icon">business</mat-icon>
              <h3>Oficina no encontrada</h3>
              <p>La oficina solicitada no existe o no se pudo cargar</p>
              <button mat-raised-button color="primary" routerLink="/oficinas">
                Volver a Oficinas
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .oficina-detail-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .title-section h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 28px;
      font-weight: 600;
    }

    .title-section p {
      margin: 8px 0 0 0;
      color: #6c757d;
      font-size: 16px;
    }

    .actions {
      display: flex;
      gap: 12px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .info-card, .responsable-card, .contact-card, .stats-card, .tabs-card {
      margin-bottom: 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-label {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
      font-weight: 600;
    }

    .info-value {
      font-size: 16px;
      color: #2c3e50;
      font-weight: 500;
    }

    .responsable-info {
      display: flex;
      gap: 20px;
      align-items: center;
    }

    .responsable-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .responsable-avatar mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }

    .responsable-details h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 24px;
    }

    .cargo {
      margin: 0 0 16px 0;
      color: #6c757d;
      font-size: 16px;
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6c757d;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .contact-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .contact-label {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
      font-weight: 600;
    }

    .contact-value {
      font-size: 16px;
      color: #2c3e50;
      font-weight: 500;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .stat-icon.total { background: #667eea; }
    .stat-icon.pending { background: #ffc107; }
    .stat-icon.process { background: #17a2b8; }
    .stat-icon.completed { background: #28a745; }

    .stat-icon mat-icon {
      font-size: 30px;
      width: 30px;
      height: 30px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 24px;
      font-weight: 700;
      color: #2c3e50;
    }

    .stat-label {
      font-size: 14px;
      color: #6c757d;
    }

    .stats-divider {
      margin: 24px 0;
    }

    .additional-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .additional-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }

    .additional-label {
      color: #6c757d;
      font-weight: 500;
    }

    .additional-value {
      color: #2c3e50;
      font-weight: 600;
    }

    .tipo-stats h4 {
      margin: 0 0 16px 0;
      color: #2c3e50;
    }

    .tipo-bars {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .tipo-bar {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .tipo-label {
      min-width: 150px;
      color: #2c3e50;
      font-weight: 500;
    }

    .bar-container {
      flex: 1;
      height: 20px;
      background: #e9ecef;
      border-radius: 10px;
      overflow: hidden;
    }

    .bar {
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    .tipo-cantidad {
      min-width: 60px;
      text-align: right;
      color: #2c3e50;
      font-weight: 600;
    }

    .tab-content {
      padding: 24px;
    }

    .expedientes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .expedientes-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .expedientes-table {
      width: 100%;
    }

    .no-expedientes, .no-dependencias, .no-permisos {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
      color: #6c757d;
    }

    .no-expedientes mat-icon, .no-dependencias mat-icon, .no-permisos mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .permisos-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .no-data-card {
      text-align: center;
      padding: 48px;
    }

    .no-data-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .no-data-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #6c757d;
    }

    .no-data-content h3 {
      margin: 0;
      color: #2c3e50;
    }

    .no-data-content p {
      margin: 0;
      color: #6c757d;
    }

    @media (max-width: 768px) {
      .oficina-detail-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .actions {
        width: 100%;
        justify-content: space-between;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .responsable-info {
        flex-direction: column;
        text-align: center;
      }

      .contact-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .additional-stats {
        grid-template-columns: 1fr;
      }

      .tipo-bar {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .tipo-label {
        min-width: auto;
      }

      .bar-container {
        width: 100%;
      }

      .tipo-cantidad {
        min-width: auto;
        text-align: left;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OficinaDetailComponent implements OnInit {
  private oficinaService = inject(OficinaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals
  loading = signal(false);
  oficina = signal<Oficina | null>(null);
  estadisticas = signal<OficinaEstadisticas | null>(null);
  expedientes = signal<any[]>([]);
  expedientesLoading = signal(false);

  // Columnas para la tabla de expedientes
  expedientesColumns = ['numero', 'tipo', 'empresa', 'estado', 'fecha', 'acciones'];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.cargarOficina(id);
        this.cargarEstadisticas(id);
        this.cargarExpedientes(id);
      }
    });
  }

  cargarOficina(id: string): void {
    this.loading.set(true);
    
    this.oficinaService.getOficina(id).subscribe({
      next: (oficina) => {
        this.oficina.set(oficina);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar oficina::', error);
        this.loading.set(false);
      }
    });
  }

  cargarEstadisticas(id: string): void {
    this.oficinaService.getEstadisticasOficina(id).subscribe({
      next: (estadisticas) => {
        this.estadisticas.set(estadisticas);
      },
      error: (error) => {
        console.error('Error al cargar estadísticas::', error);
      }
    });
  }

  cargarExpedientes(id: string): void {
    this.expedientesLoading.set(true);
    
    this.oficinaService.getExpedientesPorOficina(id).subscribe({
      next: (expedientes) => {
        this.expedientes.set(expedientes);
        this.expedientesLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar expedientes::', error);
        this.expedientesLoading.set(false);
      }
    });
  }

  // Métodos de utilidad
  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'ACTIVA': 'primary',
      'INACTIVA': 'warn',
      'MANTENIMIENTO': 'accent'
    };
    return colores[estado] || 'primary';
  }

  getPrioridadColor(prioridad: string): string {
    const colores: { [key: string]: string } = {
      'ALTA': 'warn',
      'MEDIA': 'accent',
      'BAJA': 'primary'
    };
    return colores[prioridad] || 'primary';
  }

  getExpedienteEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'PENDIENTE': 'warn',
      'EN_PROCESO': 'primary',
      'COMPLETADO': 'primary',
      'RECHAZADO': 'warn'
    };
    return colores[estado] || 'primary';
  }

  calcularPorcentajeTipo(cantidad: number): number {
    const total = this.estadisticas()?.totalExpedientes || 1;
    return Math.round((cantidad / total) * 100);
  }

  getNombreOficina(id: string): string {
    // En un caso real, esto vendría de un servicio o cache
    return `Oficina ${id}`;
  }

  // Acciones
  editarOficina(): void {
    const oficina = this.oficina();
    if (oficina && oficina.id) {
      this.router.navigate(['/oficinas', oficina.id, 'editar']);
    } else {
      console.error('No se puede navegar: oficina o ID no disponible');
    }
  }

  verFlujo(): void {
    const oficina = this.oficina();
    if (oficina && oficina.id) {
      this.router.navigate(['/oficinas', oficina.id, 'flujo']);
    } else {
      console.error('No se puede navegar: oficina o ID no disponible');
      // Opcional: mostrar un mensaje al usuario
    }
  }

  verTodosExpedientes(): void {
    const oficina = this.oficina();
    if (oficina && oficina.id) {
      this.router.navigate(['/oficina', oficina.id, 'expedientes']);
    } else {
      console.error('No se puede navegar: oficina o ID no disponible');
    }
  }

  verExpediente(expediente: any): void {
    this.router.navigate(['/expedientes', expediente.id]);
  }

  verOficina(id: string): void {
    this.router.navigate(['/oficinas', id]);
  }
} 