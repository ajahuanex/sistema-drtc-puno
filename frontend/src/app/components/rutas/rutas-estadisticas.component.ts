import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../models/ruta.model';
import { MapaRutasComponent } from './mapa-rutas.component';
import { SincronizarRutasModalComponent } from './sincronizar-rutas-modal.component';
import { DiagnosticoRutasComponent } from './diagnostico-rutas.component';

@Component({
  selector: 'app-rutas-estadisticas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatProgressBarModule,
    MatTooltipModule,
    MapaRutasComponent,
    DiagnosticoRutasComponent
  ],
  template: `
    <div class="estadisticas-container">
      <div class="page-header">
        <div class="header-info">
          <h1>
            <mat-icon>analytics</mat-icon>
            Estadísticas de Rutas
          </h1>
          <p>Análisis y visualización de rutas del sistema</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="accent" (click)="abrirSincronizacion()" matTooltip="Sincronizar rutas con localidades">
            <mat-icon>sync</mat-icon>
            Sincronizar Rutas
          </button>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando estadísticas...</p>
        </div>
      } @else {
        <mat-tab-group (selectedTabChange)="onTabChange($event)">
              <!-- Tab 1: Resumen General -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>dashboard</mat-icon>
                  <span>Resumen General</span>
                </ng-template>
                
                <div class="tab-content">
                  <div class="stats-grid">
                    <mat-card class="stat-card">
                      <mat-card-content>
                        <mat-icon class="stat-icon">route</mat-icon>
                        <div class="stat-value">{{ totalRutas() }}</div>
                        <div class="stat-label">Total de Rutas</div>
                      </mat-card-content>
                    </mat-card>

                    <mat-card class="stat-card success">
                      <mat-card-content>
                        <mat-icon class="stat-icon">check_circle</mat-icon>
                        <div class="stat-value">{{ rutasConCoordenadas() }}</div>
                        <div class="stat-label">Con Coordenadas</div>
                      </mat-card-content>
                    </mat-card>

                    <mat-card class="stat-card error">
                      <mat-card-content>
                        <mat-icon class="stat-icon">error</mat-icon>
                        <div class="stat-value">{{ rutasSinCoordenadas() }}</div>
                        <div class="stat-label">Sin Coordenadas</div>
                      </mat-card-content>
                    </mat-card>

                    <mat-card class="stat-card">
                      <mat-card-content>
                        <mat-icon class="stat-icon">percent</mat-icon>
                        <div class="stat-value">{{ porcentajeCoordenadas().toFixed(1) }}%</div>
                        <div class="stat-label">Completitud</div>
                      </mat-card-content>
                    </mat-card>
                  </div>

                  <div class="progress-section">
                    <h3>Progreso de Coordenadas</h3>
                    <div class="progress-label">
                      <span>{{ rutasConCoordenadas() }} de {{ totalRutas() }} rutas con coordenadas</span>
                      <span class="progress-value">{{ porcentajeCoordenadas().toFixed(1) }}%</span>
                    </div>
                    <mat-progress-bar 
                      mode="determinate" 
                      [value]="porcentajeCoordenadas()"
                      [color]="porcentajeCoordenadas() === 100 ? 'primary' : 'warn'">
                    </mat-progress-bar>
                  </div>
                </div>
              </mat-tab>

              <!-- Tab 4: Rutas sin Coordenadas -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>warning</mat-icon>
                  <span>Sin Coordenadas ({{ rutasSinCoordenadas() }})</span>
                </ng-template>
                
                <div class="tab-content">
                  @if (rutasSinCoordenadas() > 0) {
                    <div class="detalle-section">
                      <table mat-table [dataSource]="rutasProblematicas()" class="detalle-table">
                        <ng-container matColumnDef="codigo">
                          <th mat-header-cell *matHeaderCellDef>Código</th>
                          <td mat-cell *matCellDef="let ruta">{{ ruta.codigoRuta }}</td>
                        </ng-container>

                        <ng-container matColumnDef="nombre">
                          <th mat-header-cell *matHeaderCellDef>Ruta</th>
                          <td mat-cell *matCellDef="let ruta">
                            {{ ruta.origen?.nombre }} - {{ ruta.destino?.nombre }}
                          </td>
                        </ng-container>

                        <ng-container matColumnDef="problema">
                          <th mat-header-cell *matHeaderCellDef>Problema</th>
                          <td mat-cell *matCellDef="let ruta">
                            <div class="problemas">
                              @if (!ruta.origen?.coordenadas) {
                                <span class="problema-badge origen">Origen</span>
                              }
                              @if (!ruta.destino?.coordenadas) {
                                <span class="problema-badge destino">Destino</span>
                              }
                              @if (tieneItinerarioSinCoordenadas(ruta)) {
                                <span class="problema-badge itinerario">Itinerario</span>
                              }
                            </div>
                          </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="['codigo', 'nombre', 'problema']"></tr>
                        <tr mat-row *matRowDef="let row; columns: ['codigo', 'nombre', 'problema'];"></tr>
                      </table>
                    </div>
                  } @else {
                    <div class="success-message">
                      <mat-icon>celebration</mat-icon>
                      <p>¡Todas las rutas tienen coordenadas completas!</p>
                    </div>
                  }
                </div>
              </mat-tab>

              <!-- Tab 5: Diagnóstico -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>bug_report</mat-icon>
                  <span>Diagnóstico</span>
                </ng-template>
                
                <div class="tab-content">
                  <app-diagnostico-rutas></app-diagnostico-rutas>
                </div>
              </mat-tab>

              <!-- Tab 6: Mapa -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>map</mat-icon>
                  <span>Mapa</span>
                </ng-template>
                
                <div class="tab-content mapa-tab-content">
                  <app-mapa-rutas #mapaRutas [rutas]="rutas()"></app-mapa-rutas>
                </div>
              </mat-tab>
            </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .estadisticas-container {
      padding: 24px;
      background-color: #f8f9fa;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px;
      margin: -24px -24px 32px -24px;
      border-radius: 0 0 16px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-info h1 {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: white;
    }

    .header-info p {
      margin: 8px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .header-actions button {
      background: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
      border: 2px solid rgba(255, 255, 255, 0.3) !important;
    }

    .header-actions button:hover {
      background: rgba(255, 255, 255, 0.3) !important;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      gap: 16px;
    }

    .loading-container p {
      color: #666;
      font-size: 16px;
    }

    .tab-content {
      padding: 24px;
    }

    .mapa-tab-content {
      padding: 0;
      height: 600px;
      display: flex;
    }

    .mapa-tab-content app-mapa-rutas {
      width: 100%;
      height: 100%;
      display: block;
    }

    :host ::ng-deep .mat-mdc-tab-body-content {
      height: 100%;
    }

    :host ::ng-deep mat-tab-group {
      height: 100%;
    }

    :host ::ng-deep .mat-mdc-tab-body-wrapper {
      height: 100%;
    }

    .content-wrapper {
      display: none;
    }

    .tabs-section {
      display: none;
    }

    .tabs-section mat-tab-group {
      height: 100%;
    }

    .tabs-section :host ::ng-deep .mat-mdc-tab-body-content {
      height: 100%;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      text-align: center;
      padding: 24px;
      border-radius: 12px;
      background: white;
      border: 1px solid #e8eaed;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

    .stat-card.success {
      background: #e8f5e9;
      border-color: #4caf50;
    }

    .stat-card.error {
      background: #ffebee;
      border-color: #f44336;
    }

    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #667eea;
      margin-bottom: 8px;
    }

    .stat-card.success .stat-icon {
      color: #4caf50;
    }

    .stat-card.error .stat-icon {
      color: #f44336;
    }

    .stat-value {
      font-size: 48px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 8px;
      line-height: 1;
    }

    .stat-card.success .stat-value {
      color: #4caf50;
    }

    .stat-card.error .stat-value {
      color: #f44336;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .progress-section {
      background: white;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #e8eaed;
    }

    .progress-section h3 {
      margin: 0 0 16px 0;
      color: #2d3748;
      font-size: 16px;
      font-weight: 600;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #666;
    }

    .progress-value {
      font-weight: 600;
      color: #667eea;
    }

    .detalle-section {
      background: white;
      border-radius: 12px;
      border: 1px solid #e8eaed;
      overflow: hidden;
    }

    .detalle-table {
      width: 100%;
    }

    .detalle-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #4a5568;
      padding: 16px;
      text-align: left;
      border-bottom: 2px solid #e8eaed;
    }

    .detalle-table td {
      padding: 16px;
      border-bottom: 1px solid #f1f3f4;
      color: #2d3748;
    }

    .detalle-table tr:hover {
      background-color: #f8f9fa;
    }

    .problemas {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .problema-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .problema-badge.origen {
      background: #ffebee;
      color: #c62828;
    }

    .problema-badge.destino {
      background: #fff3e0;
      color: #e65100;
    }

    .problema-badge.itinerario {
      background: #f3e5f5;
      color: #6a1b9a;
    }

    .success-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 24px;
      background: #e8f5e9;
      border-radius: 12px;
      text-align: center;
    }

    .success-message mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
      margin-bottom: 16px;
    }

    .success-message p {
      margin: 0;
      font-size: 18px;
      color: #2e7d32;
      font-weight: 500;
    }
  `]
})
export class RutasEstadisticasComponent implements OnInit {
  private rutaService = inject(RutaService);
  private dialog = inject(MatDialog);

  @ViewChild('mapaRutas') mapaRutas!: MapaRutasComponent;

  cargando = signal(true);
  rutas = signal<Ruta[]>([]);

  totalRutas = computed(() => this.rutas().length);
  
  rutasConCoordenadas = computed(() => 
    this.rutas().filter(r => 
      r.origen?.coordenadas && r.destino?.coordenadas
    ).length
  );
  
  rutasSinCoordenadas = computed(() => 
    this.totalRutas() - this.rutasConCoordenadas()
  );
  
  porcentajeCoordenadas = computed(() => 
    this.totalRutas() > 0 
      ? (this.rutasConCoordenadas() / this.totalRutas()) * 100 
      : 0
  );

  rutasProblematicas = computed(() =>
    this.rutas().filter(r => 
      !r.origen?.coordenadas || !r.destino?.coordenadas || this.tieneItinerarioSinCoordenadas(r)
    )
  );

  ngOnInit() {
    this.cargarEstadisticas();
  }

  private cargarEstadisticas() {
    this.cargando.set(true);
    this.rutaService.getRutas().subscribe({
      next: (rutas: Ruta[]) => {
        this.rutas.set(rutas);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
        this.cargando.set(false);
      }
    });
  }

  tieneItinerarioSinCoordenadas(ruta: Ruta): boolean {
    return ruta.itinerario?.some(parada => !parada.coordenadas) ?? false;
  }

  abrirSincronizacion() {
    const dialogRef = this.dialog.open(SincronizarRutasModalComponent, {
      width: '600px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        // Recargar datos después de sincronizar
        this.cargarEstadisticas();
      }
    });
  }

  onTabChange(event: any) {
    console.log('Tab changed to index:', event.index);
    // Si es la pestaña del mapa (index 3)
    if (event.index === 3 && this.mapaRutas) {
      setTimeout(() => {
        console.log('Llamando a inicializarMapa desde onTabChange');
        this.mapaRutas.inicializarMapa();
      }, 200);
    }
  }
}
