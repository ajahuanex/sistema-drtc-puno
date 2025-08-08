import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { Empresa, EmpresaFiltros, EmpresaEstadisticas } from '../../models/empresa.model';

@Component({
  selector: 'app-empresas',
  standalone: true,
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
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>Empresas Registradas</h1>
        </div>
        <p class="header-subtitle">Gestión integral de empresas de transporte</p>
      </div>
      <div class="header-actions">
        <button mat-raised-button color="primary" (click)="nuevaEmpresa()" class="action-button">
          <mat-icon>add</mat-icon>
          Nueva Empresa
        </button>
        <button mat-button color="accent" (click)="exportarEmpresas()" class="action-button">
          <mat-icon>download</mat-icon>
          Exportar
        </button>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="stats-section" *ngIf="!isLoading && estadisticas">
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon">
            <mat-icon>business</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ estadisticas.totalEmpresas }}</div>
            <div class="stat-label">Total Empresas</div>
          </div>
        </div>
        <div class="stat-card habilitadas">
          <div class="stat-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ estadisticas.empresasHabilitadas }}</div>
            <div class="stat-label">Habilitadas</div>
          </div>
        </div>
        <div class="stat-card en-tramite">
          <div class="stat-icon">
            <mat-icon>pending</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ estadisticas.empresasEnTramite }}</div>
            <div class="stat-label">En Trámite</div>
          </div>
        </div>
        <div class="stat-card suspendidas">
          <div class="stat-icon">
            <mat-icon>block</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ estadisticas.empresasSuspendidas }}</div>
            <div class="stat-label">Suspendidas</div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <!-- Filtros Avanzados -->
      <mat-expansion-panel class="filters-panel">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>filter_list</mat-icon>
            Filtros Avanzados
          </mat-panel-title>
        </mat-expansion-panel-header>
        
        <form [formGroup]="filtrosForm" class="filters-form">
          <div class="filters-grid">
            <mat-form-field appearance="outline">
              <mat-label>RUC</mat-label>
              <input matInput formControlName="ruc" placeholder="Buscar por RUC">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Razón Social</mat-label>
              <input matInput formControlName="razonSocial" placeholder="Buscar por razón social">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="estado">
                <mat-option value="">Todos los estados</mat-option>
                <mat-option value="HABILITADA">Habilitada</mat-option>
                <mat-option value="EN_TRAMITE">En Trámite</mat-option>
                <mat-option value="SUSPENDIDA">Suspendida</mat-option>
                <mat-option value="CANCELADA">Cancelada</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Fecha Desde</mat-label>
              <input matInput [matDatepicker]="fechaDesdePicker" formControlName="fechaDesde">
              <mat-datepicker-toggle matSuffix [for]="fechaDesdePicker"></mat-datepicker-toggle>
              <mat-datepicker #fechaDesdePicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Fecha Hasta</mat-label>
              <input matInput [matDatepicker]="fechaHastaPicker" formControlName="fechaHasta">
              <mat-datepicker-toggle matSuffix [for]="fechaHastaPicker"></mat-datepicker-toggle>
              <mat-datepicker #fechaHastaPicker></mat-datepicker>
            </mat-form-field>
          </div>

          <div class="filters-actions">
            <button mat-raised-button color="primary" (click)="aplicarFiltros()">
              <mat-icon>search</mat-icon>
              Buscar
            </button>
            <button mat-button (click)="limpiarFiltros()">
              <mat-icon>clear</mat-icon>
              Limpiar
            </button>
          </div>
        </form>
      </mat-expansion-panel>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <div class="loading-content">
          <mat-spinner diameter="60" class="loading-spinner"></mat-spinner>
          <h3>Cargando empresas...</h3>
          <p>Obteniendo información de las empresas registradas</p>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && empresas.length === 0" class="empty-container">
        <div class="empty-content">
          <div class="empty-icon-container">
            <mat-icon class="empty-icon">business</mat-icon>
          </div>
          <h2>No hay empresas registradas</h2>
          <p>Comienza agregando la primera empresa de transporte al sistema.</p>
          <div class="empty-actions">
            <button mat-raised-button color="primary" (click)="nuevaEmpresa()" class="primary-action">
              <mat-icon>add</mat-icon>
              Agregar Primera Empresa
            </button>
            <button mat-button color="accent" (click)="recargarEmpresas()" class="secondary-action">
              <mat-icon>refresh</mat-icon>
              Recargar
            </button>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div *ngIf="!isLoading && empresas.length > 0" class="table-section">
        <div class="table-header">
          <div class="table-info">
            <h3>Empresas Registradas</h3>
            <p class="table-subtitle">Se encontraron {{empresas.length}} empresas</p>
          </div>
          <div class="table-actions">
            <button mat-button color="accent" (click)="recargarEmpresas()">
              <mat-icon>refresh</mat-icon>
              Recargar
            </button>
          </div>
        </div>

        <div class="table-container">
          <table mat-table [dataSource]="empresas" class="modern-table">
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
                  <span>Razón Social</span>
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
                  <span>Estado</span>
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

            <!-- Representante Column -->
            <ng-container matColumnDef="representante">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                <div class="header-content">
                  <span>Representante</span>
                </div>
              </th>
              <td mat-cell *matCellDef="let empresa" class="table-cell">
                <div class="cell-content">
                  <span class="cell-text">{{ empresa.representanteLegal.nombres }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Vehículos Column -->
            <ng-container matColumnDef="vehiculos">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell">
                <div class="header-content">
                  <span>Vehículos</span>
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
                  <span>Conductores</span>
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
                  <span>Acciones</span>
                </div>
              </th>
              <td mat-cell *matCellDef="let empresa" class="table-cell">
                <div class="cell-content actions-content">
                  <button mat-icon-button color="primary" (click)="verEmpresa(empresa.id)" 
                          class="action-button" matTooltip="Ver detalles">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button color="accent" (click)="editarEmpresa(empresa.id)"
                          class="action-button" matTooltip="Editar empresa">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="eliminarEmpresa(empresa.id)"
                          class="action-button" matTooltip="Eliminar empresa">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns" class="table-header-row"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>
        </div>
      </div>
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

    .header-subtitle {
      color: #666;
      margin-top: 4px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .action-button {
      margin-left: 10px;
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
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card.total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stat-card.habilitadas {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
    }

    .stat-card.en-tramite {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;
    }

    .stat-card.suspendidas {
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      color: white;
    }

    .stat-icon {
      margin-right: 15px;
    }

    .stat-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .stat-content {
      flex-grow: 1;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }

    /* Filtros */
    .filters-panel {
      margin: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

    .content-section {
      padding: 20px;
    }

    .loading-container {
      text-align: center;
      padding: 40px 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .loading-spinner {
      margin-bottom: 15px;
    }

    .loading-content h3 {
      color: #555;
      margin-bottom: 8px;
    }

    .loading-content p {
      color: #888;
      font-size: 14px;
    }

    .empty-container {
      text-align: center;
      padding: 40px 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .empty-icon-container {
      margin-bottom: 16px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }

    .empty-content h2 {
      color: #666;
      margin-bottom: 8px;
    }

    .empty-content p {
      color: #999;
      margin-bottom: 24px;
    }

    .empty-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .primary-action, .secondary-action {
      padding: 8px 16px;
    }

    .table-section {
      margin-top: 20px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }

    .table-info h3 {
      margin-bottom: 5px;
      color: #333;
    }

    .table-subtitle {
      color: #666;
      font-size: 14px;
    }

    .table-actions button {
      padding: 8px 12px;
    }

    .table-container {
      overflow-x: auto;
    }

    .modern-table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
      background-color: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .table-header-row {
      background-color: #f5f5f5;
      font-weight: bold;
      color: #333;
    }

    .table-header-cell {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #eee;
      background-color: #f5f5f5;
      font-size: 14px;
      color: #333;
    }

    .table-cell {
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
      color: #555;
    }

    .table-row:last-child .table-cell {
      border-bottom: none;
    }

    .cell-content {
      display: flex;
      align-items: center;
    }

    .cell-text {
      font-weight: 500;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      color: #fff;
    }

    .status-habilitada {
      background-color: #4caf50;
    }

    .status-en_tramite {
      background-color: #ff9800;
    }

    .status-suspendida {
      background-color: #f44336;
    }

    .status-cancelada {
      background-color: #9e9e9e;
    }

    .actions-content {
      display: flex;
      gap: 8px;
    }

    .action-button {
      padding: 8px;
    }

    mat-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .table-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .modern-table {
        font-size: 12px;
      }

      .table-header-cell,
      .table-cell {
        padding: 8px 12px;
      }
    }

    /* Hover Effects */
    .table-row:hover {
      background-color: #f8f9fa;
      transition: background-color 0.2s ease;
    }

    .action-button:hover {
      transform: scale(1.1);
      transition: transform 0.2s ease;
    }

    /* Animations */
    .loading-spinner {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }

    /* Modern Card Effects */
    .empty-container,
    .loading-container {
      transition: all 0.3s ease;
    }

    .empty-container:hover,
    .loading-container:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    /* Status Badge Improvements */
    .status-badge {
      position: relative;
      overflow: hidden;
    }

    .status-badge::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s;
    }

    .status-badge:hover::before {
      left: 100%;
    }

    /* Table Improvements */
    .modern-table {
      position: relative;
    }

    .modern-table::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
    }

    /* Header Improvements */
    .header-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #333;
    }

    .header-subtitle {
      margin: 0;
      font-size: 16px;
      color: #666;
    }

    /* Action Button Improvements */
    .action-button {
      border-radius: 8px;
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
    }

    .action-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  `]
})
export class EmpresasComponent implements OnInit {
  empresas: Empresa[] = [];
  displayedColumns: string[] = ['ruc', 'razonSocial', 'estado', 'representante', 'vehiculos', 'conductores', 'acciones'];
  isLoading = false;
  estadisticas?: EmpresaEstadisticas;
  filtrosForm: FormGroup;

  constructor(
    private empresaService: EmpresaService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
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
      console.log('Usuario no autenticado, redirigiendo a login...');
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('Usuario autenticado:', this.authService.getCurrentUser());
    console.log('Token disponible:', !!this.authService.getToken());
    
    this.loadEmpresas();
    this.loadEstadisticas();
  }

  recargarEmpresas(): void {
    console.log('Recargando empresas manualmente...');
    this.loadEmpresas();
    this.loadEstadisticas();
  }

  loadEmpresas(): void {
    this.isLoading = true;
    console.log('Iniciando carga de empresas...');
    
    this.empresaService.getEmpresas(0, 100).subscribe({
      next: (empresas) => {
        console.log('Empresas cargadas exitosamente:', empresas);
        this.empresas = empresas;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
        this.isLoading = false;
        this.snackBar.open('Error al cargar las empresas', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.cdr.detectChanges();
      }
    });
  }

  loadEstadisticas(): void {
    this.empresaService.getEstadisticasEmpresas().subscribe({
      next: (estadisticas) => {
        this.estadisticas = estadisticas;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    });
  }

  aplicarFiltros(): void {
    const filtros = this.filtrosForm.value;
    console.log('Aplicando filtros:', filtros);
    
    this.isLoading = true;
    this.empresaService.getEmpresasConFiltros(filtros).subscribe({
      next: (empresas) => {
        this.empresas = empresas;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error aplicando filtros:', error);
        this.isLoading = false;
        this.snackBar.open('Error al aplicar filtros', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.cdr.detectChanges();
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

  eliminarEmpresa(id: string): void {
    if (confirm('¿Está seguro de que desea eliminar esta empresa? Esta acción no se puede deshacer.')) {
      this.empresaService.deleteEmpresa(id).subscribe({
        next: () => {
          this.snackBar.open('Empresa eliminada exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.loadEmpresas();
          this.loadEstadisticas();
        },
        error: (error) => {
          console.error('Error eliminando empresa:', error);
          this.snackBar.open('Error al eliminar la empresa', 'Cerrar', {
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
        
        this.snackBar.open('Archivo exportado exitosamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      },
      error: (error) => {
        console.error('Error exportando empresas:', error);
        this.snackBar.open('Error al exportar empresas', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }
} 