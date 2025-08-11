import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { OficinaService } from '../../services/oficina.service';
import { FlujoExpediente } from '../../models/expediente.model';

@Component({
  selector: 'app-flujo-general-expedientes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatTabsModule
  ],
  template: `
    <div class="flujo-container">
      <!-- Header -->
      <div class="header">
        <div class="title-section">
          <h1>Flujo General de Expedientes</h1>
          <p>Visualiza el recorrido de los expedientes a través de todas las oficinas del sistema</p>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="actualizarFlujo()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
          <button mat-button routerLink="/oficinas">
            <mat-icon>arrow_back</mat-icon>
            Volver a Oficinas
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <mat-card class="filtros-card">
        <mat-card-content>
          <form [formGroup]="filtrosForm" class="filtros-form">
            <div class="filtros-row">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Número de Expediente</mat-label>
                <input matInput formControlName="numeroExpediente" placeholder="Buscar por número">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Empresa</mat-label>
                <input matInput formControlName="empresa" placeholder="Buscar por empresa">
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Oficina Origen</mat-label>
                <mat-select formControlName="oficinaOrigen">
                  <mat-option value="">Todas las oficinas</mat-option>
                  @for (oficina of oficinas() ; track oficina.id) {
                    <mat-option [value]="oficina.id">{{ oficina.nombre | uppercase }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado">
                  <mat-option value="">Todos los estados</mat-option>
                  <mat-option value="PENDIENTE">Pendiente</mat-option>
                  <mat-option value="EN_PROCESO">En Proceso</mat-option>
                  <mat-option value="COMPLETADO">Completado</mat-option>
                  <mat-option value="RECHAZADO">Rechazado</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="filtros-actions">
              <button mat-button type="button" (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
              <button mat-raised-button color="primary" (click)="aplicarFiltros()">
                <mat-icon>filter_list</mat-icon>
                Aplicar Filtros
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Estadísticas Generales -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">timeline</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ totalExpedientes() }}</span>
                <span class="stat-label">Total Expedientes</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">business</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ totalOficinas() }}</span>
                <span class="stat-label">Oficinas Activas</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">swap_horiz</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ totalMovimientos() }}</span>
                <span class="stat-label">Total Movimientos</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">schedule</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ tiempoPromedio() }} días</span>
                <span class="stat-label">Tiempo Promedio</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tabs para diferentes vistas -->
      <mat-card class="tabs-card">
        <mat-card-content>
          <mat-tab-group>
            <!-- Tab: Vista de Flujo -->
            <mat-tab label="Vista de Flujo">
              <div class="tab-content">
                @if (loading()) {
                  <div class="loading-container">
                    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                    <p>Cargando flujo de expedientes...</p>
                  </div>
                } @else {
                  <div class="flujo-timeline">
                    @for (flujo of flujosExpedientes() ; track flujo.expedienteId) {
                      <div class="flujo-item">
                        <div class="flujo-header">
                          <h3>{{ flujo.expedienteNumero | uppercase }}</h3>
                          <div class="flujo-meta">
                            <mat-chip [color]="getEstadoColor(flujo.estado)" selected>
                              {{ flujo.estado | uppercase }}
                            </mat-chip>
                            <span class="empresa">{{ flujo.expedienteEmpresa | uppercase }}</span>
                          </div>
                        </div>
                        
                        <div class="flujo-timeline-visual">
                          @for (movimiento of flujo.movimientos ; track movimiento.expedienteId) {
                            <div class="movimiento-item">
                              <div class="movimiento-icon">
                                <mat-icon>swap_horiz</mat-icon>
                              </div>
                              <div class="movimiento-content">
                                <div class="movimiento-header">
                                  <span class="oficina">{{ movimiento.oficinaDestinoId | uppercase }}</span>
                                  <span class="fecha">{{ movimiento.fechaMovimiento | date:'dd/MM/yyyy HH:mm' }}</span>
                                </div>
                                <p class="observacion">{{ movimiento.observaciones || 'Sin observaciones' }}</p>
                              </div>
                            </div>
                          }
                        </div>

                        <div class="flujo-actions">
                          <button mat-button (click)="verDetallesExpediente(flujo.expedienteId)">
                            <mat-icon>visibility</mat-icon>
                            Ver Detalles
                          </button>
                          <button mat-button (click)="verOficinaActual(flujo.oficinaActual)">
                            <mat-icon>business</mat-icon>
                            Ver Oficina
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-tab>

            <!-- Tab: Mapa de Oficinas -->
            <mat-tab label="Mapa de Oficinas">
              <div class="tab-content">
                <div class="oficinas-map">
                  @for (oficina of oficinas() ; track oficina.id) {
                    <div class="oficina-node" [class.activa]="oficina.activa">
                      <div class="oficina-header">
                        <mat-icon>{{ oficina.activa ? 'business' : 'business_off' }}</mat-icon>
                        <span class="oficina-nombre">{{ oficina.nombre | uppercase }}</span>
                      </div>
                      <div class="oficina-stats">
                        <span class="expedientes-count">{{ getExpedientesEnOficina(oficina.id) }} expedientes</span>
                        <span class="tiempo-promedio">{{ getTiempoPromedioOficina(oficina.id) }} días</span>
                      </div>
                      <div class="oficina-actions">
                        <button mat-button (click)="verOficina(oficina.id)">
                          <mat-icon>visibility</mat-icon>
                          Ver
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </mat-tab>

            <!-- Tab: Métricas -->
            <mat-tab label="Métricas">
              <div class="tab-content">
                <div class="metricas-grid">
                  <mat-card class="metrica-card">
                    <mat-card-content>
                      <h3>Distribución por Estado</h3>
                      <div class="metrica-chart">
                        @for (estado of distribucionEstados() ; track estado.estado) {
                          <div class="metrica-item">
                            <span class="metrica-label">{{ estado.estado | uppercase }}</span>
                            <div class="metrica-bar">
                              <div class="metrica-fill" [style.width.%]="estado.porcentaje"></div>
                            </div>
                            <span class="metrica-value">{{ estado.cantidad }}</span>
                          </div>
                        }
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="metrica-card">
                    <mat-card-content>
                      <h3>Tiempo por Oficina</h3>
                      <div class="metrica-chart">
                        @for (oficina of tiempoPorOficina() ; track oficina.id) {
                          <div class="metrica-item">
                            <span class="metrica-label">{{ oficina.nombre | uppercase }}</span>
                            <div class="metrica-bar">
                              <div class="metrica-fill" [style.width.%]="getTiempoPorcentaje(oficina.tiempoPromedio)"></div>
                            </div>
                            <span class="metrica-value">{{ oficina.tiempoPromedio }} días</span>
                          </div>
                        }
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .flujo-container {
      padding: 24px;
      max-width: 1400px;
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

    .filtros-card {
      margin-bottom: 24px;
    }

    .filtros-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .filtros-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .filtro-field {
      width: 100%;
    }

    .filtros-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 24px;
      font-weight: 700;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }

    .tabs-card {
      margin-bottom: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
    }

    /* Flujo Timeline */
    .flujo-timeline {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .flujo-item {
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 20px;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .flujo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e9ecef;
    }

    .flujo-header h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
    }

    .flujo-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .empresa {
      color: #6c757d;
      font-size: 14px;
    }

    .flujo-timeline-visual {
      margin: 20px 0;
    }

    .movimiento-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
      padding: 16px;
      border-radius: 8px;
      background: #f8f9fa;
      transition: all 0.2s ease;
    }

    .movimiento-item.activo {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-left: 4px solid #2196f3;
    }

    .movimiento-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e3f2fd;
      color: #1976d2;
    }

    .movimiento-item.activo .movimiento-icon {
      background: #2196f3;
      color: white;
    }

    .movimiento-content {
      flex: 1;
    }

    .movimiento-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .oficina {
      font-weight: 600;
      color: #2c3e50;
    }

    .fecha {
      color: #6c757d;
      font-size: 12px;
    }

    .observacion {
      margin: 0;
      color: #495057;
      font-size: 14px;
    }

    .progreso-actual {
      margin-top: 8px;
    }

    .flujo-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e9ecef;
    }

    /* Mapa de Oficinas */
    .oficinas-map {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .oficina-node {
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 20px;
      background: white;
      transition: all 0.2s ease;
    }

    .oficina-node.activa {
      border-color: #28a745;
      background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
    }

    .oficina-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .oficina-nombre {
      font-weight: 600;
      color: #2c3e50;
      font-size: 16px;
    }

    .oficina-stats {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .expedientes-count,
    .tiempo-promedio {
      color: #6c757d;
      font-size: 14px;
    }

    .oficina-actions {
      display: flex;
      justify-content: flex-end;
    }

    /* Métricas */
    .metricas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .metrica-card h3 {
      margin: 0 0 20px 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
    }

    .metrica-chart {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .metrica-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .metrica-label {
      min-width: 120px;
      font-weight: 500;
      color: #2c3e50;
    }

    .metrica-bar {
      flex: 1;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .metrica-fill {
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    .metrica-value {
      min-width: 60px;
      text-align: right;
      font-weight: 600;
      color: #2c3e50;
    }

    @media (max-width: 768px) {
      .flujo-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .filtros-row {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .flujo-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .movimiento-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .metricas-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlujoGeneralExpedientesComponent implements OnInit {
  private oficinaService = inject(OficinaService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // Signals
  loading = signal(false);
  oficinas = signal<any[]>([]);
  flujosExpedientes = signal<FlujoExpediente[]>([]);

  // Filtros
  filtrosForm: FormGroup;

  constructor() {
    this.filtrosForm = this.fb.group({
      numeroExpediente: [''],
      empresa: [''],
      oficinaOrigen: [''],
      estado: ['']
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    
    // Cargar oficinas
    this.oficinaService.getOficinas().subscribe({
      next: (oficinas) => {
        this.oficinas.set(oficinas);
      },
      error: (error) => {
        console.error('Error al cargar oficinas:', error);
      }
    });

    // Cargar flujos de expedientes
    this.oficinaService.getFlujoExpedientes().subscribe({
      next: (flujos) => {
        this.flujosExpedientes.set(this.simularFlujos());
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar flujos:', error);
        this.snackBar.open('Error al cargar los flujos de expedientes', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  simularFlujos(): FlujoExpediente[] {
    return [
      {
        expedienteId: 'EXP001',
        expedienteNumero: 'E-0001-2024',
        expedienteTipo: 'AUTORIZACION NUEVA',
        expedienteEmpresa: 'EMPRESA TRANSPORTES ABC S.A.C.',
        estado: 'EN_PROCESO',
        oficinaActual: 'OF001',
        fechaCreacion: '2024-01-15T08:00:00',
        ultimaActualizacion: '2024-01-16T09:00:00',
        movimientos: [
          {
            expedienteId: 'EXP001',
            oficinaOrigenId: 'OF001',
            oficinaDestinoId: 'Oficina de Recepción',
            motivo: 'INGRESO',
            observaciones: 'Expediente recibido y registrado',
            documentosRequeridos: [],
            documentosEntregados: [],
            fechaMovimiento: '2024-01-15T08:00:00',
            usuarioId: 'USR001',
            usuarioNombre: 'Usuario Sistema'
          },
          {
            expedienteId: 'EXP001',
            oficinaOrigenId: 'OF001',
            oficinaDestinoId: 'Oficina de Análisis Técnico',
            motivo: 'REVISION',
            observaciones: 'En revisión técnica de documentación',
            documentosRequeridos: [],
            documentosEntregados: [],
            fechaMovimiento: '2024-01-16T09:00:00',
            usuarioId: 'USR002',
            usuarioNombre: 'Analista Técnico'
          }
        ]
      },
      {
        expedienteId: 'EXP002',
        expedienteNumero: 'E-0002-2024',
        expedienteTipo: 'AUTORIZACION NUEVA',
        expedienteEmpresa: 'EMPRESA TRANSPORTES XYZ S.A.C.',
        estado: 'PENDIENTE',
        oficinaActual: 'OF002',
        fechaCreacion: '2024-01-18T10:00:00',
        ultimaActualizacion: '2024-01-19T11:00:00',
        movimientos: [
          {
            expedienteId: 'EXP002',
            oficinaOrigenId: 'OF002',
            oficinaDestinoId: 'Oficina de Recepción',
            motivo: 'INGRESO',
            observaciones: 'Expediente recibido',
            documentosRequeridos: [],
            documentosEntregados: [],
            fechaMovimiento: '2024-01-18T10:00:00',
            usuarioId: 'USR003',
            usuarioNombre: 'Usuario Sistema'
          },
          {
            expedienteId: 'EXP002',
            oficinaOrigenId: 'OF002',
            oficinaDestinoId: 'Oficina de Verificación',
            motivo: 'PENDIENTE',
            observaciones: 'Pendiente de verificación de antecedentes',
            documentosRequeridos: [],
            documentosEntregados: [],
            fechaMovimiento: '2024-01-19T11:00:00',
            usuarioId: 'USR004',
            usuarioNombre: 'Verificador'
          }
        ]
      }
    ];
  }

  // Computed properties
  totalExpedientes = computed(() => this.flujosExpedientes().length);
  totalOficinas = computed(() => this.oficinas().length);
  totalMovimientos = computed(() => 
    this.flujosExpedientes().reduce((total, flujo) => total + flujo.movimientos.length, 0)
  );
  tiempoPromedio = computed(() => 5); // Simulado

  distribucionEstados = computed(() => [
    { estado: 'PENDIENTE', cantidad: 1, porcentaje: 50 },
    { estado: 'EN_PROCESO', cantidad: 1, porcentaje: 50 }
  ]);

  tiempoPorOficina = computed(() => [
    { id: 'OF001', nombre: 'Oficina de Recepción', tiempoPromedio: 2 },
    { id: 'OF002', nombre: 'Oficina de Análisis', tiempoPromedio: 5 },
    { id: 'OF003', nombre: 'Oficina de Verificación', tiempoPromedio: 3 }
  ]);

  // Métodos
  actualizarFlujo(): void {
    this.cargarDatos();
    this.snackBar.open('Flujo actualizado correctamente', 'Cerrar', { duration: 2000 });
  }

  aplicarFiltros(): void {
    // Implementar lógica de filtrado
    this.snackBar.open('Filtros aplicados', 'Cerrar', { duration: 2000 });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.aplicarFiltros();
  }

  verDetallesExpediente(expedienteId: string): void {
    this.router.navigate(['/expedientes', expedienteId]);
  }

  verOficinaActual(oficinaId: string): void {
    this.router.navigate(['/oficinas', oficinaId]);
  }

  verOficina(oficinaId: string): void {
    this.router.navigate(['/oficinas', oficinaId]);
  }

  getExpedientesEnOficina(oficinaId: string): number {
    return this.flujosExpedientes().filter(f => f.oficinaActual === oficinaId).length;
  }

  getTiempoPromedioOficina(oficinaId: string): number {
    // Simulado
    return Math.floor(Math.random() * 10) + 1;
  }

  getTiempoPorcentaje(tiempo: number): number {
    const maxTiempo = 10;
    return Math.min((tiempo / maxTiempo) * 100, 100);
  }

  // Métodos de utilidad para colores e iconos
  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'PENDIENTE': 'warn',
      'EN_PROCESO': 'primary',
      'COMPLETADO': 'primary',
      'RECHAZADO': 'warn'
    };
    return colores[estado] || 'primary';
  }

  getMovimientoIcon(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'INGRESO': 'input',
      'REVISION': 'search',
      'PENDIENTE': 'schedule',
      'APROBADO': 'check_circle',
      'RECHAZADO': 'cancel'
    };
    return iconos[tipo] || 'swap_horiz';
  }
} 