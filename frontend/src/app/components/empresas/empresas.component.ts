import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { EmpresaService } from '../../services/empresa.service';
import { RutaService } from '../../services/ruta.service';
import { AuthService } from '../../services/auth.service';
import { Empresa, EmpresaFiltros, EmpresaEstadisticas } from '../../models/empresa.model';
import { Ruta } from '../../models/ruta.model';
import { CrearResolucionModalComponent } from './crear-resolucion-modal.component';
import { ValidacionSunatModalComponent } from './validacion-sunat-modal.component';
import { GestionDocumentosModalComponent } from './gestion-documentos-modal.component';
import { HistorialAuditoriaModalComponent } from './historial-auditoria-modal.component';
import { CrearRutaModalComponent } from './crear-ruta-modal.component';

@Component({
  selector: 'app-empresas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatChipsModule,
    MatDialogModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>EMPRESAS REGISTRADAS</h1>
        </div>
        <p class="header-subtitle">GESTIÓN INTEGRAL DE EMPRESAS DE TRANSPORTE</p>
      </div>
      <div class="header-actions">
        <button mat-raised-button color="primary" (click)="nuevaEmpresa()" class="action-button">
          <mat-icon>add</mat-icon>
          NUEVA EMPRESA
        </button>
        <button mat-raised-button color="accent" (click)="crearResolucion()" class="action-button">
          <mat-icon>gavel</mat-icon>
          CREAR RESOLUCIÓN
        </button>
        <button mat-raised-button color="accent" (click)="crearRutaGeneral()" class="action-button">
          <mat-icon>route</mat-icon>
          CREAR RUTA
        </button>
        <button mat-button color="accent" (click)="dashboardEmpresas()" class="action-button">
          <mat-icon>dashboard</mat-icon>
          DASHBOARD
        </button>
        <button mat-button color="accent" (click)="exportarEmpresas()" class="action-button">
          <mat-icon>download</mat-icon>
          EXPORTAR
        </button>
      </div>
    </div>

    <!-- Estadísticas -->
    @if (!isLoading() && estadisticas()) {
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card total">
            <div class="stat-icon">
              <mat-icon>business</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ estadisticas()?.totalEmpresas }}</div>
              <div class="stat-label">TOTAL EMPRESAS</div>
            </div>
          </div>
          <div class="stat-card habilitadas">
            <div class="stat-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ estadisticas()?.empresasHabilitadas }}</div>
              <div class="stat-label">HABILITADAS</div>
            </div>
          </div>
          <div class="stat-card en-tramite">
            <div class="stat-icon">
              <mat-icon>pending</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ estadisticas()?.empresasEnTramite }}</div>
              <div class="stat-label">EN TRÁMITE</div>
            </div>
          </div>
          <div class="stat-card suspendidas">
            <div class="stat-icon">
              <mat-icon>block</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ estadisticas()?.empresasSuspendidas }}</div>
              <div class="stat-label">SUSPENDIDAS</div>
            </div>
          </div>
        </div>
      </div>
    }

    <div class="content-section">
      <!-- Filtros Avanzados -->
      <mat-expansion-panel class="filters-panel">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>filter_list</mat-icon>
            FILTROS AVANZADOS
          </mat-panel-title>
        </mat-expansion-panel-header>
        
        <form [formGroup]="filtrosForm" class="filters-form">
          <div class="filters-grid">
            <mat-form-field appearance="outline">
              <mat-label>RUC</mat-label>
              <input matInput formControlName="ruc" placeholder="BUSCAR POR RUC">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>RAZÓN SOCIAL</mat-label>
              <input matInput formControlName="razonSocial" placeholder="BUSCAR POR RAZÓN SOCIAL">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>ESTADO</mat-label>
              <mat-select formControlName="estado">
                <mat-option value="">TODOS LOS ESTADOS</mat-option>
                <mat-option value="HABILITADA">HABILITADA</mat-option>
                <mat-option value="EN_TRAMITE">EN TRÁMITE</mat-option>
                <mat-option value="SUSPENDIDA">SUSPENDIDA</mat-option>
                <mat-option value="CANCELADA">CANCELADA</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>FECHA DESDE</mat-label>
              <input matInput [matDatepicker]="fechaDesdePicker" formControlName="fechaDesde">
              <mat-datepicker-toggle matSuffix [for]="fechaDesdePicker"></mat-datepicker-toggle>
              <mat-datepicker #fechaDesdePicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>FECHA HASTA</mat-label>
              <input matInput [matDatepicker]="fechaHastaPicker" formControlName="fechaHasta">
              <mat-datepicker-toggle matSuffix [for]="fechaHastaPicker"></mat-datepicker-toggle>
              <mat-datepicker #fechaHastaPicker></mat-datepicker>
            </mat-form-field>
          </div>

          <div class="filters-actions">
            <button mat-raised-button color="primary" (click)="aplicarFiltros()">
              <mat-icon>search</mat-icon>
              BUSCAR
            </button>
            <button mat-button (click)="limpiarFiltros()">
              <mat-icon>clear</mat-icon>
              LIMPIAR
            </button>
          </div>
        </form>
      </mat-expansion-panel>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <div class="loading-content">
            <mat-spinner diameter="60" class="loading-spinner"></mat-spinner>
            <h3>CARGANDO EMPRESAS...</h3>
            <p>OBTENIENDO INFORMACIÓN DE LAS EMPRESAS REGISTRADAS</p>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && empresas().length === 0) {
        <div class="empty-container">
          <div class="empty-content">
            <div class="empty-icon-container">
              <mat-icon class="empty-icon">business</mat-icon>
            </div>
            <h2>NO HAY EMPRESAS REGISTRADAS</h2>
            <p>COMIENZA AGREGANDO LA PRIMERA EMPRESA DE TRANSPORTE AL SISTEMA.</p>
            <div class="empty-actions">
              <button mat-raised-button color="primary" (click)="nuevaEmpresa()" class="primary-action">
                <mat-icon>add</mat-icon>
                AGREGAR PRIMERA EMPRESA
              </button>
              <button mat-button color="accent" (click)="recargarEmpresas()" class="secondary-action">
                <mat-icon>refresh</mat-icon>
                RECARGAR
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Data Table -->
      @if (!isLoading() && empresas().length > 0) {
        <div class="table-section">
          <div class="table-header">
            <div class="table-info">
              <h3>EMPRESAS REGISTRADAS</h3>
              <p class="table-subtitle">SE ENCONTRARON {{empresas().length}} EMPRESAS</p>
            </div>
            <div class="table-actions">
              <button mat-button color="accent" (click)="recargarEmpresas()">
                <mat-icon>refresh</mat-icon>
                RECARGAR
              </button>
            </div>
          </div>

          <div class="table-container">
            <table mat-table [dataSource]="empresas()" class="modern-table">
              <!-- RUC Column -->
              <ng-container matColumnDef="ruc">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>RUC</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let empresa" class="table-cell">
                  <div class="cell-content">
                    <span class="cell-text">{{ empresa.ruc }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Razón Social Column -->
              <ng-container matColumnDef="razonSocial">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>RAZÓN SOCIAL</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let empresa" class="table-cell">
                  <div class="cell-content">
                    <span class="cell-text">{{ empresa.razonSocial.principal }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Estado Column -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>ESTADO</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let empresa" class="table-cell">
                  <div class="cell-content">
                    <span class="status-badge" [class]="'status-' + empresa.estado.toLowerCase()">
                      {{ empresa.estado }}
                    </span>
                  </div>
                </td>
              </ng-container>

              <!-- Rutas Column -->
              <ng-container matColumnDef="rutas">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>RUTAS</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let empresa" class="table-cell">
                  <div class="cell-content">
                    <mat-chip-set>
                      <mat-chip color="warn" selected>{{ empresa.rutas?.length || 0 }}</mat-chip>
                    </mat-chip-set>
                    <button mat-icon-button 
                            size="small" 
                            (click)="verRutasEmpresa(empresa)"
                            matTooltip="VER RUTAS DE LA EMPRESA"
                            class="ruta-button">
                      <mat-icon>route</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <!-- Vehículos Column -->
              <ng-container matColumnDef="vehiculos">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>VEHÍCULOS</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let empresa" class="table-cell">
                  <div class="cell-content">
                    <mat-chip-set>
                      <mat-chip color="primary" selected>{{ empresa.vehiculosHabilitadosIds.length }}</mat-chip>
                    </mat-chip-set>
                  </div>
                </td>
              </ng-container>

              <!-- Conductores Column -->
              <ng-container matColumnDef="conductores">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>CONDUCTORES</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let empresa" class="table-cell">
                  <div class="cell-content">
                    <mat-chip-set>
                      <mat-chip color="accent" selected>{{ empresa.conductoresHabilitadosIds.length }}</mat-chip>
                    </mat-chip-set>
                  </div>
                </td>
              </ng-container>

              <!-- Acciones Column -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                  <div class="header-content">
                    <span>ACCIONES</span>
                  </div>
                </th>
                <td mat-cell *matCellDef="let empresa" class="table-cell">
                  <div class="cell-content actions-content">
                    <button mat-icon-button [matMenuTriggerFor]="menu" class="action-button" matTooltip="MÁS ACCIONES">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="verEmpresa(empresa.id)">
                        <mat-icon>visibility</mat-icon>
                        <span>VER DETALLES</span>
                      </button>
                      <button mat-menu-item (click)="editarEmpresa(empresa.id)">
                        <mat-icon>edit</mat-icon>
                        <span>EDITAR EMPRESA</span>
                      </button>
                      <button mat-menu-item (click)="gestionarVehiculos(empresa.id)">
                        <mat-icon>directions_car</mat-icon>
                        <span>GESTIONAR VEHÍCULOS</span>
                      </button>
                      <button mat-menu-item (click)="gestionarConductores(empresa.id)">
                        <mat-icon>person</mat-icon>
                        <span>GESTIONAR CONDUCTORES</span>
                      </button>
                      <button mat-menu-item (click)="verResoluciones(empresa.id)">
                        <mat-icon>gavel</mat-icon>
                        <span>VER RESOLUCIONES</span>
                      </button>
                      <button mat-menu-item (click)="gestionarDocumentos(empresa)">
                        <mat-icon>description</mat-icon>
                        <span>GESTIONAR DOCUMENTOS</span>
                      </button>
                      <button mat-menu-item (click)="verHistorialAuditoria(empresa)">
                        <mat-icon>history</mat-icon>
                        <span>HISTORIAL DE AUDITORÍA</span>
                      </button>
                      <button mat-menu-item (click)="validarConSunat(empresa)">
                        <mat-icon>verified</mat-icon>
                        <span>VALIDAR CON SUNAT</span>
                      </button>
                      <button mat-menu-item (click)="crearRuta(empresa)">
                        <mat-icon>route</mat-icon>
                        <span>CREAR RUTA</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item color="warn" (click)="eliminarEmpresa(empresa.id)">
                        <mat-icon>delete</mat-icon>
                        <span>ELIMINAR EMPRESA</span>
                      </button>
                    </mat-menu>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns" class="table-header-row"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-content {
      flex-grow: 1;
      margin-right: 20px;
    }

    .header-title {
      display: flex;
      align-items: center;
    }

    .header-title h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 28px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .header-subtitle {
      color: #666;
      margin-top: 4px;
      text-transform: uppercase;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .action-button {
      margin-left: 10px;
      text-transform: uppercase;
      font-weight: 500;
    }

    /* Estadísticas */
    .stats-section {
      padding: 20px;
      background-color: #fff;
      border-bottom: 1px solid #e0e0e0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card.total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stat-card.habilitadas {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .stat-card.en-tramite {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }

    .stat-card.suspendidas {
      background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
      color: #333;
    }

    .stat-icon {
      margin-right: 15px;
      font-size: 2.5em;
      opacity: 0.8;
    }

    .stat-content {
      flex-grow: 1;
    }

    .stat-value {
      font-size: 2em;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 0.9em;
      opacity: 0.9;
      text-transform: uppercase;
      font-weight: 500;
    }

    /* Filtros */
    .filters-panel {
      margin-bottom: 20px;
    }

    .filters-form {
      padding: 20px 0;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .filters-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    /* Loading */
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 60px 20px;
    }

    .loading-content {
      text-align: center;
    }

    .loading-spinner {
      margin-bottom: 20px;
    }

    .loading-content h3 {
      color: #2c3e50;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .loading-content p {
      color: #666;
      text-transform: uppercase;
    }

    /* Empty State */
    .empty-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 60px 20px;
    }

    .empty-content {
      text-align: center;
      max-width: 400px;
    }

    .empty-icon-container {
      margin-bottom: 20px;
    }

    .empty-icon {
      font-size: 4em;
      color: #ccc;
    }

    .empty-content h2 {
      color: #2c3e50;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .empty-content p {
      color: #666;
      margin-bottom: 30px;
      text-transform: uppercase;
    }

    .empty-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
    }

    .primary-action {
      text-transform: uppercase;
      font-weight: 500;
    }

    .secondary-action {
      text-transform: uppercase;
      font-weight: 500;
    }

    /* Tabla */
    .table-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .table-info h3 {
      margin: 0;
      color: #2c3e50;
      text-transform: uppercase;
    }

    .table-subtitle {
      margin: 5px 0 0 0;
      color: #666;
      text-transform: uppercase;
    }

    .table-container {
      overflow-x: auto;
    }

    .modern-table {
      width: 100%;
      border-collapse: collapse;
    }

    .table-header-cell {
      background-color: #f8f9fa;
      color: #2c3e50;
      font-weight: 600;
      text-transform: uppercase;
      padding: 16px;
      border-bottom: 2px solid #dee2e6;
    }

    .table-cell {
      padding: 16px;
      border-bottom: 1px solid #e9ecef;
    }

    .table-header-row {
      background-color: #f8f9fa;
    }

    .table-row:hover {
      background-color: #f8f9fa;
    }

    .cell-content {
      display: flex;
      align-items: center;
    }

    .cell-text {
      color: #2c3e50;
      font-weight: 500;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-habilitada {
      background-color: #d4edda;
      color: #155724;
    }

    .status-en_tramite {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-suspendida {
      background-color: #f8d7da;
      color: #721c24;
    }

    .status-cancelada {
      background-color: #e2e3e5;
      color: #383d41;
    }

    .actions-content {
      justify-content: center;
    }

    .action-button {
      transition: all 0.3s ease;
    }

    .action-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    /* Estilos para la columna de rutas */
    .ruta-button {
      margin-left: 8px;
      color: #ff9800;
      transition: all 0.3s ease;
    }

    .ruta-button:hover {
      color: #f57c00;
      transform: scale(1.1);
    }

    .ruta-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .filters-actions {
        justify-content: center;
      }

      .empty-actions {
        flex-direction: column;
        align-items: center;
      }

      .table-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }
    }
  `]
})
export class EmpresasComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private rutaService = inject(RutaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // Signals
  empresas = signal<Empresa[]>([]);
  isLoading = signal(false);
  estadisticas = signal<EmpresaEstadisticas | undefined>(undefined);

  // Computed properties
  displayedColumns = ['ruc', 'razonSocial', 'estado', 'rutas', 'vehiculos', 'conductores', 'acciones'];
  filtrosForm: FormGroup;

  constructor() {
    this.filtrosForm = this.fb.group({
      ruc: [''],
      razonSocial: [''],
      estado: [''],
      fechaDesde: [''],
      fechaHasta: ['']
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      console.log('USUARIO NO AUTENTICADO, REDIRIGIENDO A LOGIN...');
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('USUARIO AUTENTICADO:', this.authService.getCurrentUser());
    console.log('TOKEN DISPONIBLE:', !!this.authService.getToken());
    
    this.loadEmpresas();
    this.loadEstadisticas();
  }

  recargarEmpresas(): void {
    console.log('RECARGANDO EMPRESAS MANUALMENTE...');
    this.loadEmpresas();
    this.loadEstadisticas();
  }

  loadEmpresas(): void {
    this.isLoading.set(true);
    console.log('INICIANDO CARGA DE EMPRESAS...');
    
    this.empresaService.getEmpresas(0, 100).subscribe({
      next: (empresas) => {
        console.log('EMPRESAS CARGADAS EXITOSAMENTE:', empresas);
        this.empresas.set(empresas);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('ERROR CARGANDO EMPRESAS:', error);
        this.isLoading.set(false);
        this.snackBar.open('ERROR AL CARGAR LAS EMPRESAS', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  loadEstadisticas(): void {
    this.empresaService.getEstadisticasEmpresas().subscribe({
      next: (estadisticas) => {
        this.estadisticas.set(estadisticas);
      },
      error: (error) => {
        console.error('ERROR CARGANDO ESTADÍSTICAS:', error);
      }
    });
  }

  aplicarFiltros(): void {
    const filtros = this.filtrosForm.value;
    console.log('APLICANDO FILTROS:', filtros);
    
    this.isLoading.set(true);
    this.empresaService.getEmpresasConFiltros(filtros).subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('ERROR APLICANDO FILTROS:', error);
        this.isLoading.set(false);
        this.snackBar.open('ERROR AL APLICAR FILTROS', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.loadEmpresas();
  }

  verEmpresa(id: string): void {
    this.router.navigate(['/empresas', id]);
  }

  editarEmpresa(id: string): void {
    this.router.navigate(['/empresas', id, 'editar']);
  }

  nuevaEmpresa(): void {
    this.router.navigate(['/empresas/nueva']);
  }

  gestionarVehiculos(empresaId: string): void {
    this.router.navigate(['/empresas', empresaId, 'vehiculos', 'batch']);
  }

  gestionarConductores(empresaId: string): void {
    // TODO: Implementar gestión de conductores
    this.snackBar.open('FUNCIÓN EN DESARROLLO', 'CERRAR', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  verResoluciones(empresaId: string): void {
    // TODO: Implementar vista de resoluciones
    this.snackBar.open('FUNCIÓN EN DESARROLLO', 'CERRAR', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  eliminarEmpresa(id: string): void {
    if (confirm('¿ESTÁ SEGURO DE QUE DESEA ELIMINAR ESTA EMPRESA? ESTA ACCIÓN NO SE PUEDE DESHACER.')) {
      this.empresaService.deleteEmpresa(id).subscribe({
        next: () => {
          this.snackBar.open('EMPRESA ELIMINADA EXITOSAMENTE', 'CERRAR', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.loadEmpresas();
          this.loadEstadisticas();
        },
        error: (error) => {
          console.error('ERROR ELIMINANDO EMPRESA:', error);
          this.snackBar.open('ERROR AL ELIMINAR LA EMPRESA', 'CERRAR', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  exportarEmpresas(): void {
    this.empresaService.exportarEmpresas('excel').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'empresas.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('ARCHIVO EXPORTADO EXITOSAMENTE', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      },
      error: (error) => {
        console.error('ERROR EXPORTANDO EMPRESAS:', error);
        this.snackBar.open('ERROR AL EXPORTAR EMPRESAS', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  dashboardEmpresas(): void {
    this.router.navigate(['/empresas/dashboard']);
  }

  gestionarDocumentos(empresa: Empresa): void {
    const dialogRef = this.dialog.open(GestionDocumentosModalComponent, {
      width: '800px',
      data: {
        empresaId: empresa.id,
        empresaRuc: empresa.ruc,
        empresaRazonSocial: empresa.razonSocial.principal,
        documentos: empresa.documentos
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Documentos actualizados:', result);
        this.snackBar.open('DOCUMENTOS ACTUALIZADOS EXITOSAMENTE', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  verHistorialAuditoria(empresa: Empresa): void {
    const dialogRef = this.dialog.open(HistorialAuditoriaModalComponent, {
      width: '900px',
      data: {
        empresaId: empresa.id,
        empresaRuc: empresa.ruc,
        empresaRazonSocial: empresa.razonSocial.principal,
        auditoria: empresa.auditoria
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Auditoría exportada:', result);
      }
    });
  }

  validarConSunat(empresa: Empresa): void {
    const dialogRef = this.dialog.open(ValidacionSunatModalComponent, {
      width: '600px',
      data: {
        ruc: empresa.ruc,
        razonSocial: empresa.razonSocial.principal
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Validación SUNAT:', result);
        this.snackBar.open('VALIDACIÓN SUNAT COMPLETADA', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  crearRuta(empresa: Empresa): void {
    const dialogRef = this.dialog.open(CrearRutaModalComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: {
        empresa: empresa // Pre-cargar la empresa seleccionada
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('RUTA CREADA:', result);
        this.snackBar.open('RUTA CREADA EXITOSAMENTE', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        // Aquí podrías recargar las rutas si es necesario
      }
    });
  }

  crearRutaGeneral(): void {
    const dialogRef = this.dialog.open(CrearRutaModalComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: {} // Los datos se seleccionarán en el modal
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('RUTA CREADA:', result);
        this.snackBar.open('RUTA CREADA EXITOSAMENTE', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        // Aquí podrías recargar las rutas si es necesario
      }
    });
  }

  crearResolucion(): void {
    const dialogRef = this.dialog.open(CrearResolucionModalComponent, {
      width: '700px',
      data: { empresaId: null } // SE SELECCIONARÁ LA EMPRESA EN EL MODAL
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('RESOLUCIÓN CREADA:', result);
        this.snackBar.open('RESOLUCIÓN CREADA EXITOSAMENTE', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        // AQUÍ PODRÍAS RECARGAR LAS RESOLUCIONES SI ES NECESARIO
      }
    });
  }

  verRutasEmpresa(empresa: Empresa): void {
    // Cargar las rutas de la empresa
    this.rutaService.getRutasPorEmpresa(empresa.id).subscribe({
      next: (rutas) => {
        // Mostrar las rutas en un modal o navegar a una vista de rutas
        console.log('RUTAS DE LA EMPRESA:', rutas);
        
        // Por ahora, mostrar en consola y snackbar
        this.snackBar.open(`EMPRESA ${empresa.ruc}: ${rutas.length} RUTAS ENCONTRADAS`, 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        
        // Aquí podrías abrir un modal para mostrar las rutas
        // o navegar a una vista específica de rutas de la empresa
      },
      error: (error) => {
        console.error('ERROR CARGANDO RUTAS:', error);
        this.snackBar.open('ERROR AL CARGAR LAS RUTAS DE LA EMPRESA', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }
} 