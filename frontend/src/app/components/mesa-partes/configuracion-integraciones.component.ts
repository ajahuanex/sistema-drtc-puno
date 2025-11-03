import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject, takeUntil } from 'rxjs';

import { IntegracionService } from '../../services/mesa-partes/integracion.service';
import { 
  Integracion, 
  TipoIntegracion, 
  TipoAutenticacion,
  EstadoConexion,
  EstadoSincronizacion,
  MapeoCampo,
  ConfiguracionWebhook,
  LogSincronizacion
} from '../../models/mesa-partes/integracion.model';
import { IntegracionFormModalComponent, IntegracionFormData } from './integracion-form-modal.component';
import { WebhookConfigModalComponent, WebhookConfigData } from './webhook-config-modal.component';

@Component({
  selector: 'app-configuracion-integraciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatExpansionModule
  ],
  template: `
    <div class="configuracion-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h2>
            <mat-icon>integration_instructions</mat-icon>
            Configuración de Integraciones
          </h2>
          <p class="subtitle">Gestiona las integraciones con sistemas externos</p>
        </div>
        
        <div class="header-actions">
          <button 
            mat-raised-button 
            color="primary"
            (click)="abrirFormularioIntegracion()">
            <mat-icon>add</mat-icon>
            Nueva Integración
          </button>
        </div>
      </div>     
 <!-- Tabs de configuración -->
      <mat-tab-group class="config-tabs" [(selectedIndex)]="selectedTabIndex">
        
        <!-- Tab: Lista de Integraciones -->
        <mat-tab label="Integraciones">
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">list</mat-icon>
            <span class="tab-label">Integraciones</span>
          </ng-template>
          
          <div class="tab-content">
            <!-- Loading -->
            <div class="loading-container" *ngIf="loading">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Cargando integraciones...</p>
            </div>

            <!-- Lista de integraciones -->
            <mat-card class="integraciones-card" *ngIf="!loading">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>settings</mat-icon>
                  Integraciones Configuradas
                  <span class="count-badge">({{ integraciones.length }})</span>
                </mat-card-title>
              </mat-card-header>

              <mat-card-content>
                <!-- Sin integraciones -->
                <div class="no-integraciones" *ngIf="integraciones.length === 0">
                  <mat-icon class="no-data-icon">integration_instructions</mat-icon>
                  <h3>No hay integraciones configuradas</h3>
                  <p>Agrega tu primera integración para conectar con sistemas externos</p>
                  <button 
                    mat-raised-button 
                    color="primary"
                    (click)="abrirFormularioIntegracion()">
                    <mat-icon>add</mat-icon>
                    Crear Primera Integración
                  </button>
                </div>

                <!-- Tabla de integraciones -->
                <div class="table-container" *ngIf="integraciones.length > 0">
                  <table mat-table [dataSource]="integraciones" class="integraciones-table">
                    
                    <!-- Columna: Nombre -->
                    <ng-container matColumnDef="nombre">
                      <th mat-header-cell *matHeaderCellDef>Nombre</th>
                      <td mat-cell *matCellDef="let integracion">
                        <div class="nombre-cell">
                          <div class="nombre-info">
                            <strong>{{ integracion.nombre }}</strong>
                            <small>{{ integracion.descripcion }}</small>
                          </div>
                          <mat-icon 
                            class="tipo-icon"
                            [matTooltip]="getTipoLabel(integracion.tipo)">
                            {{ getTipoIcon(integracion.tipo) }}
                          </mat-icon>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Columna: Estado -->
                    <ng-container matColumnDef="estado">
                      <th mat-header-cell *matHeaderCellDef>Estado</th>
                      <td mat-cell *matCellDef="let integracion">
                        <div class="estado-cell">
                          <span 
                            class="estado-badge"
                            [ngClass]="integracion.activa ? 'estado-activo' : 'estado-inactivo'">
                            <mat-icon class="estado-icon">
                              {{ integracion.activa ? 'check_circle' : 'cancel' }}
                            </mat-icon>
                            {{ integracion.activa ? 'Activa' : 'Inactiva' }}
                          </span>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Columna: Conexión -->
                    <ng-container matColumnDef="conexion">
                      <th mat-header-cell *matHeaderCellDef>Conexión</th>
                      <td mat-cell *matCellDef="let integracion">
                        <div class="conexion-cell">
                          <span 
                            class="conexion-badge"
                            [ngClass]="getEstadoConexionClass(integracion.estadoConexion)">
                            <mat-icon class="conexion-icon">
                              {{ getEstadoConexionIcon(integracion.estadoConexion) }}
                            </mat-icon>
                            {{ getEstadoConexionLabel(integracion.estadoConexion) }}
                          </span>
                          <button 
                            mat-icon-button 
                            class="test-button"
                            matTooltip="Probar conexión"
                            [disabled]="probandoConexion[integracion.id]"
                            (click)="probarConexion(integracion)">
                            <mat-icon>refresh</mat-icon>
                          </button>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Columna: Última Sincronización -->
                    <ng-container matColumnDef="ultimaSincronizacion">
                      <th mat-header-cell *matHeaderCellDef>Última Sincronización</th>
                      <td mat-cell *matCellDef="let integracion">
                        <div class="sync-cell">
                          <div class="sync-info" *ngIf="integracion.ultimaSincronizacion">
                            <mat-icon class="sync-icon">sync</mat-icon>
                            <span class="sync-date">
                              {{ integracion.ultimaSincronizacion | date:'dd/MM/yyyy HH:mm' }}
                            </span>
                          </div>
                          <span class="no-sync" *ngIf="!integracion.ultimaSincronizacion">
                            Sin sincronización
                          </span>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Columna: Acciones -->
                    <ng-container matColumnDef="acciones">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let integracion">
                        <div class="acciones-cell">
                          <button 
                            mat-icon-button 
                            matTooltip="Editar"
                            (click)="editarIntegracion(integracion)">
                            <mat-icon>edit</mat-icon>
                          </button>
                          
                          <button 
                            mat-icon-button 
                            matTooltip="Ver logs"
                            (click)="verLogs(integracion)">
                            <mat-icon>history</mat-icon>
                          </button>

                          <button 
                            mat-icon-button 
                            matTooltip="Configurar webhook"
                            (click)="configurarWebhook(integracion)">
                            <mat-icon>webhook</mat-icon>
                          </button>

                          <button 
                            mat-icon-button 
                            matTooltip="Eliminar"
                            color="warn"
                            (click)="eliminarIntegracion(integracion)">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </div>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                  </table>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab: Logs de Sincronización -->
        <mat-tab label="Logs">
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">history</mat-icon>
            <span class="tab-label">Logs</span>
          </ng-template>
          
          <div class="tab-content">
            <mat-card class="logs-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>history</mat-icon>
                  Historial de Sincronizaciones
                </mat-card-title>
              </mat-card-header>

              <mat-card-content>
                <!-- Filtros de logs -->
                <div class="logs-filters">
                  <mat-form-field appearance="outline">
                    <mat-label>Integración</mat-label>
                    <mat-select [(value)]="filtroIntegracion" (selectionChange)="cargarLogs()">
                      <mat-option value="">Todas las integraciones</mat-option>
                      <mat-option 
                        *ngFor="let integracion of integraciones" 
                        [value]="integracion.id">
                        {{ integracion.nombre }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Estado</mat-label>
                    <mat-select [(value)]="filtroEstadoLog" (selectionChange)="cargarLogs()">
                      <mat-option value="">Todos los estados</mat-option>
                      <mat-option value="exitoso">Exitoso</mat-option>
                      <mat-option value="error">Error</mat-option>
                      <mat-option value="pendiente">Pendiente</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <button 
                    mat-raised-button 
                    color="primary"
                    (click)="cargarLogs()">
                    <mat-icon>refresh</mat-icon>
                    Actualizar
                  </button>
                </div>

                <!-- Tabla de logs -->
                <div class="logs-table-container" *ngIf="logs.length > 0">
                  <table mat-table [dataSource]="logs" class="logs-table">
                    
                    <!-- Columna: Fecha -->
                    <ng-container matColumnDef="fecha">
                      <th mat-header-cell *matHeaderCellDef>Fecha</th>
                      <td mat-cell *matCellDef="let log">
                        {{ log.fecha | date:'dd/MM/yyyy HH:mm:ss' }}
                      </td>
                    </ng-container>

                    <!-- Columna: Integración -->
                    <ng-container matColumnDef="integracion">
                      <th mat-header-cell *matHeaderCellDef>Integración</th>
                      <td mat-cell *matCellDef="let log">
                        {{ log.integracionNombre }}
                      </td>
                    </ng-container>

                    <!-- Columna: Operación -->
                    <ng-container matColumnDef="operacion">
                      <th mat-header-cell *matHeaderCellDef>Operación</th>
                      <td mat-cell *matCellDef="let log">
                        <div class="operacion-cell">
                          <mat-icon class="operacion-icon">
                            {{ getOperacionIcon(log.operacion) }}
                          </mat-icon>
                          {{ log.operacion }}
                        </div>
                      </td>
                    </ng-container>

                    <!-- Columna: Estado -->
                    <ng-container matColumnDef="estadoLog">
                      <th mat-header-cell *matHeaderCellDef>Estado</th>
                      <td mat-cell *matCellDef="let log">
                        <span 
                          class="log-estado-badge"
                          [ngClass]="'estado-' + log.estado">
                          <mat-icon class="log-estado-icon">
                            {{ getLogEstadoIcon(log.estado) }}
                          </mat-icon>
                          {{ getLogEstadoLabel(log.estado) }}
                        </span>
                      </td>
                    </ng-container>

                    <!-- Columna: Detalles -->
                    <ng-container matColumnDef="detalles">
                      <th mat-header-cell *matHeaderCellDef>Detalles</th>
                      <td mat-cell *matCellDef="let log">
                        <button 
                          mat-icon-button 
                          matTooltip="Ver detalles"
                          (click)="verDetallesLog(log)">
                          <mat-icon>visibility</mat-icon>
                        </button>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="logColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: logColumns;"></tr>
                  </table>
                </div>

                <!-- Sin logs -->
                <div class="no-logs" *ngIf="logs.length === 0 && !loadingLogs">
                  <mat-icon class="no-data-icon">history</mat-icon>
                  <h3>No hay logs de sincronización</h3>
                  <p>Los logs aparecerán aquí cuando se realicen operaciones de sincronización</p>
                </div>

                <!-- Loading logs -->
                <div class="loading-logs" *ngIf="loadingLogs">
                  <mat-spinner diameter="30"></mat-spinner>
                  <p>Cargando logs...</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `, 
 styles: [`
    .configuracion-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      background: white;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .header-content h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
    }

    .header-content h2 mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #667eea;
    }

    .subtitle {
      margin: 0;
      color: #6c757d;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .config-tabs {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .config-tabs ::ng-deep .mat-mdc-tab-header {
      background: #fafbfc;
      border-bottom: 1px solid #e1e4e8;
    }

    .tab-icon {
      margin-right: 8px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .tab-label {
      font-size: 14px;
      font-weight: 500;
    }

    .tab-content {
      padding: 32px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .loading-container p {
      margin-top: 16px;
      color: #6c757d;
    }

    .integraciones-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
    }

    .count-badge {
      background: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 8px;
    }

    .no-integraciones {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .no-data-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #cbd5e0;
      margin-bottom: 16px;
    }

    .no-integraciones h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .no-integraciones p {
      margin: 0 0 24px 0;
      color: #6c757d;
    }

    .table-container {
      overflow-x: auto;
    }

    .integraciones-table {
      width: 100%;
    }

    .nombre-cell {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .nombre-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nombre-info strong {
      font-size: 14px;
      color: #2c3e50;
    }

    .nombre-info small {
      font-size: 12px;
      color: #6c757d;
    }

    .tipo-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #667eea;
    }

    .estado-cell,
    .conexion-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .estado-badge,
    .conexion-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .estado-activo {
      background: #e8f5e8;
      color: #388e3c;
    }

    .estado-inactivo {
      background: #ffebee;
      color: #d32f2f;
    }

    .conexion-exitosa {
      background: #e8f5e8;
      color: #388e3c;
    }

    .conexion-error {
      background: #ffebee;
      color: #d32f2f;
    }

    .conexion-pendiente {
      background: #fff3e0;
      color: #f57c00;
    }

    .estado-icon,
    .conexion-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .test-button {
      width: 32px;
      height: 32px;
    }

    .sync-cell {
      display: flex;
      align-items: center;
    }

    .sync-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sync-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #6c757d;
    }

    .sync-date {
      font-size: 12px;
      color: #6c757d;
    }

    .no-sync {
      font-size: 12px;
      color: #9e9e9e;
      font-style: italic;
    }

    .acciones-cell {
      display: flex;
      gap: 4px;
    }

    .acciones-cell button {
      width: 32px;
      height: 32px;
    }

    .acciones-cell mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .logs-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
    }

    .logs-filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .logs-filters mat-form-field {
      min-width: 200px;
    }

    .logs-table-container {
      overflow-x: auto;
    }

    .logs-table {
      width: 100%;
    }

    .operacion-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .operacion-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #6c757d;
    }

    .log-estado-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .estado-exitoso {
      background: #e8f5e8;
      color: #388e3c;
    }

    .estado-error {
      background: #ffebee;
      color: #d32f2f;
    }

    .estado-pendiente {
      background: #fff3e0;
      color: #f57c00;
    }

    .log-estado-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .no-logs {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .no-logs h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .no-logs p {
      margin: 0;
      color: #6c757d;
    }

    .loading-logs {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
    }

    .loading-logs p {
      margin-top: 12px;
      color: #6c757d;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .configuracion-container {
        padding: 16px;
      }

      .header {
        padding: 16px 20px;
      }

      .tab-content {
        padding: 24px;
      }
    }

    @media (max-width: 768px) {
      .configuracion-container {
        padding: 12px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }

      .header-content h2 {
        font-size: 20px;
      }

      .tab-content {
        padding: 16px;
      }

      .logs-filters {
        flex-direction: column;
      }

      .logs-filters mat-form-field {
        min-width: unset;
        width: 100%;
      }

      .tab-label {
        display: none;
      }

      .tab-icon {
        margin-right: 0;
      }
    }
  `]
})
export class ConfiguracionIntegracionesComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private integracionService = inject(IntegracionService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Estado del componente
  loading = false;
  loadingLogs = false;
  selectedTabIndex = 0;

  // Datos
  integraciones: Integracion[] = [];
  logs: LogSincronizacion[] = [];

  // Estados de prueba de conexión
  probandoConexion: { [key: string]: boolean } = {};

  // Filtros de logs
  filtroIntegracion = '';
  filtroEstadoLog = '';

  // Configuración de tablas
  displayedColumns: string[] = [
    'nombre',
    'estado', 
    'conexion',
    'ultimaSincronizacion',
    'acciones'
  ];

  logColumns: string[] = [
    'fecha',
    'integracion',
    'operacion',
    'estadoLog',
    'detalles'
  ];

  // Opciones para selects
  tiposIntegracion = [
    { value: TipoIntegracion.API_REST, label: 'API REST' },
    { value: TipoIntegracion.SOAP, label: 'SOAP' },
    { value: TipoIntegracion.WEBHOOK, label: 'Webhook' }
  ];

  tiposAutenticacion = [
    { value: TipoAutenticacion.API_KEY, label: 'API Key' },
    { value: TipoAutenticacion.BEARER, label: 'Bearer Token' },
    { value: TipoAutenticacion.BASIC, label: 'Basic Auth' },
    { value: TipoAutenticacion.OAUTH2, label: 'OAuth 2.0' }
  ];

  ngOnInit(): void {
    this.cargarIntegraciones();
    this.cargarLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }  /**
 
  * Cargar lista de integraciones
   * Requirements: 4.1, 4.2
   */
  private cargarIntegraciones(): void {
    this.loading = true;
    
    this.integracionService.listarIntegraciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (integraciones) => {
          this.integraciones = integraciones;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar integraciones:', error);
          this.loading = false;
          this.snackBar.open('Error al cargar integraciones', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Cargar logs de sincronización
   * Requirements: 4.5, 4.6
   */
  cargarLogs(): void {
    this.loadingLogs = true;
    
    if (!this.filtroIntegracion) {
      this.loadingLogs = false;
      return;
    }

    this.integracionService.obtenerLogSincronizacion(
      this.filtroIntegracion,
      this.filtroEstadoLog as EstadoSincronizacion || undefined
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.logs = response.logs;
          this.loadingLogs = false;
        },
        error: (error) => {
          console.error('Error al cargar logs:', error);
          this.loadingLogs = false;
          this.snackBar.open('Error al cargar logs', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Abrir formulario para nueva integración
   * Requirements: 4.1, 4.2
   */
  abrirFormularioIntegracion(): void {
    const dialogRef = this.dialog.open(IntegracionFormModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        modo: 'crear'
      } as IntegracionFormData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarIntegraciones();
        this.snackBar.open('Integración creada exitosamente', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  /**
   * Editar integración existente
   * Requirements: 4.1, 4.2
   */
  editarIntegracion(integracion: Integracion): void {
    const dialogRef = this.dialog.open(IntegracionFormModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        modo: 'editar',
        integracion: integracion
      } as IntegracionFormData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarIntegraciones();
        this.snackBar.open('Integración actualizada exitosamente', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  /**
   * Probar conexión de integración
   * Requirements: 4.2
   */
  probarConexion(integracion: Integracion): void {
    this.probandoConexion[integracion.id] = true;
    
    this.integracionService.probarConexion(integracion.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultado) => {
          this.probandoConexion[integracion.id] = false;
          
          if (resultado.exitoso) {
            integracion.estadoConexion = EstadoConexion.CONECTADO;
            this.snackBar.open('Conexión exitosa', 'Cerrar', {
              duration: 3000
            });
          } else {
            integracion.estadoConexion = EstadoConexion.ERROR;
            this.snackBar.open(`Error de conexión: ${resultado.mensaje}`, 'Cerrar', {
              duration: 5000
            });
          }
        },
        error: (error) => {
          console.error('Error al probar conexión:', error);
          this.probandoConexion[integracion.id] = false;
          integracion.estadoConexion = EstadoConexion.ERROR;
          this.snackBar.open('Error al probar conexión', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Ver logs de integración específica
   * Requirements: 4.5, 4.6
   */
  verLogs(integracion: Integracion): void {
    this.filtroIntegracion = integracion.id;
    this.selectedTabIndex = 1; // Cambiar a tab de logs
    this.cargarLogs();
  }

  /**
   * Configurar webhook para integración
   * Requirements: 10.3, 10.4
   */
  configurarWebhook(integracion: Integracion): void {
    const dialogRef = this.dialog.open(WebhookConfigModalComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        integracion: integracion
      } as WebhookConfigData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarIntegraciones();
        this.snackBar.open('Configuración de webhook actualizada', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  /**
   * Eliminar integración
   * Requirements: 4.1
   */
  eliminarIntegracion(integracion: Integracion): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la integración "${integracion.nombre}"?`)) {
      this.integracionService.eliminarIntegracion(integracion.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.integraciones = this.integraciones.filter(i => i.id !== integracion.id);
            this.snackBar.open('Integración eliminada exitosamente', 'Cerrar', {
              duration: 3000
            });
          },
          error: (error) => {
            console.error('Error al eliminar integración:', error);
            this.snackBar.open('Error al eliminar integración', 'Cerrar', {
              duration: 3000
            });
          }
        });
    }
  }

  /**
   * Ver detalles de log
   * Requirements: 4.5, 4.6
   */
  verDetallesLog(log: LogSincronizacion): void {
    console.log('Ver detalles del log:', log);
    // TODO: Implementar modal con detalles del log
    this.snackBar.open('Detalles del log próximamente disponibles', 'Cerrar', {
      duration: 2000
    });
  }

  /**
   * Obtener icono para tipo de integración
   */
  getTipoIcon(tipo: TipoIntegracion): string {
    switch (tipo) {
      case TipoIntegracion.API_REST:
        return 'api';
      case TipoIntegracion.SOAP:
        return 'soap';
      case TipoIntegracion.FTP:
        return 'folder_shared';
      case TipoIntegracion.EMAIL:
        return 'email';
      default:
        return 'integration_instructions';
    }
  }

  /**
   * Obtener etiqueta para tipo de integración
   */
  getTipoLabel(tipo: TipoIntegracion): string {
    const tipoObj = this.tiposIntegracion.find(t => t.value === tipo);
    return tipoObj?.label || tipo;
  }

  /**
   * Obtener clase CSS para estado de conexión
   */
  getEstadoConexionClass(estado: string): string {
    switch (estado) {
      case 'exitosa':
        return 'conexion-exitosa';
      case 'error':
        return 'conexion-error';
      case 'pendiente':
      default:
        return 'conexion-pendiente';
    }
  }

  /**
   * Obtener icono para estado de conexión
   */
  getEstadoConexionIcon(estado: string): string {
    switch (estado) {
      case 'exitosa':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'pendiente':
      default:
        return 'schedule';
    }
  }

  /**
   * Obtener etiqueta para estado de conexión
   */
  getEstadoConexionLabel(estado: string): string {
    switch (estado) {
      case 'exitosa':
        return 'Conectado';
      case 'error':
        return 'Error';
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  }

  /**
   * Obtener icono para operación de log
   */
  getOperacionIcon(operacion: string): string {
    switch (operacion.toLowerCase()) {
      case 'enviar':
        return 'send';
      case 'recibir':
        return 'get_app';
      case 'sincronizar':
        return 'sync';
      case 'probar':
        return 'bug_report';
      default:
        return 'settings';
    }
  }

  /**
   * Obtener icono para estado de log
   */
  getLogEstadoIcon(estado: string): string {
    switch (estado) {
      case 'exitoso':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'pendiente':
        return 'schedule';
      default:
        return 'help';
    }
  }

  /**
   * Obtener etiqueta para estado de log
   */
  getLogEstadoLabel(estado: string): string {
    switch (estado) {
      case 'exitoso':
        return 'Exitoso';
      case 'error':
        return 'Error';
      case 'pendiente':
        return 'Pendiente';
      default:
        return estado;
    }
  }
}