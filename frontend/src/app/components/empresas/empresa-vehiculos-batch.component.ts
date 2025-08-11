import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { VehiculoCreate, Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { AgregarVehiculosModalComponent } from './agregar-vehiculos-modal.component';

interface Resolucion {
  id: string;
  numero: string;
  tipoResolucion: 'PADRE' | 'HIJO';
  resuelve: string;
  fechaEmision: string;
  estado: 'ACTIVA' | 'SUSPENDIDA' | 'VENCIDA';
  resolucionPadreId?: string;
  rutasAutorizadas: string[];
  // Solo para resoluciones PADRE
  fechaInicioVigencia?: string;
  fechaFinVigencia?: string;
  // Para mostrar jerárquicamente
  resolucionesHijas?: Resolucion[];
  // Cantidad de vehículos
  cantidadVehiculos?: number;
}

@Component({
  selector: 'app-empresa-vehiculos-batch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="page-container">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando información de la empresa...</p>
        </div>
      } @else {
        <div class="content">
          <!-- Header -->
          <div class="page-header">
            <div class="header-content">
              <mat-icon class="header-icon">directions_car</mat-icon>
              <div class="header-text">
                <h1>Gestión de Vehículos por Empresa</h1>
                <p>Empresa: {{ empresa()?.razonSocial?.principal || 'Cargando...' }}</p>
              </div>
            </div>
            <button mat-stroked-button (click)="volver()" class="header-button">
              <mat-icon>arrow_back</mat-icon>
              Volver
            </button>
          </div>

          <!-- Información de la Empresa -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>business</mat-icon>
                Información de la Empresa
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="empresa-info">
                <div class="info-row">
                  <span class="label">RUC:</span>
                  <span class="value">{{ empresa()?.ruc || 'N/A' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Razón Social:</span>
                  <span class="value">{{ empresa()?.razonSocial?.principal || 'N/A' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Estado:</span>
                  <span class="value status-chip" [class]="empresa()?.estado?.toLowerCase()">
                    {{ empresa()?.estado || 'N/A' }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Total Vehículos:</span>
                  <span class="value">{{ vehiculos().length }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Resoluciones Disponibles -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>description</mat-icon>
                Resoluciones Disponibles
              </mat-card-title>
              <mat-card-subtitle>
                Resoluciones primigenias y derivadas de la empresa
              </mat-card-subtitle>
              <div class="header-actions">
                <button mat-stroked-button (click)="agregarResolucion()" class="action-button">
                  <mat-icon>add</mat-icon>
                  Agregar Resolución
                </button>
              </div>
            </mat-card-header>
            <mat-card-content>
              <div class="table-container">
                <table mat-table [dataSource]="resolucionesParaTabla()" class="resoluciones-table">
                  <!-- Número -->
                  <ng-container matColumnDef="numero">
                    <th mat-header-cell *matHeaderCellDef>Número</th>
                    <td mat-cell *matCellDef="let resolucion">
                      <div class="resolucion-numero">
                        @if (resolucion.tipoResolucion === 'HIJO') {
                          <mat-icon class="hija-icon">subdirectory_arrow_right</mat-icon>
                        }
                        {{ resolucion.numero }}
                      </div>
                    </td>
                  </ng-container>

                  <!-- Tipo -->
                  <ng-container matColumnDef="tipo">
                    <th mat-header-cell *matHeaderCellDef>Tipo</th>
                    <td mat-cell *matCellDef="let resolucion">
                      <span class="tipo-chip" [class]="resolucion.tipoResolucion.toLowerCase()">
                        {{ resolucion.tipoResolucion }}
                      </span>
                    </td>
                  </ng-container>

                  <!-- Resuelve -->
                  <ng-container matColumnDef="resuelve">
                    <th mat-header-cell *matHeaderCellDef>Resuelve</th>
                    <td mat-cell *matCellDef="let resolucion">
                      <div class="resuelve-text" [matTooltip]="resolucion.resuelve">
                        {{ resolucion.resuelve.length > 50 ? (resolucion.resuelve | slice:0:50) + '...' : resolucion.resuelve }}
                      </div>
                    </td>
                  </ng-container>

                  <!-- Fecha Emisión -->
                  <ng-container matColumnDef="fechaEmision">
                    <th mat-header-cell *matHeaderCellDef>Fecha Emisión</th>
                    <td mat-cell *matCellDef="let resolucion">
                      {{ resolucion.fechaEmision | date:'dd/MM/yyyy' }}
                    </td>
                  </ng-container>

                  <!-- Vigencia -->
                  <ng-container matColumnDef="vigencia">
                    <th mat-header-cell *matHeaderCellDef>Vigencia</th>
                    <td mat-cell *matCellDef="let resolucion">
                      @if (resolucion.tipoResolucion === 'PADRE' && resolucion.fechaInicioVigencia && resolucion.fechaFinVigencia) {
                        {{ resolucion.fechaInicioVigencia | date:'dd/MM/yyyy' }} - {{ resolucion.fechaFinVigencia | date:'dd/MM/yyyy' }}
                      } @else {
                        <span class="no-vigencia">Sin vigencia</span>
                      }
                    </td>
                  </ng-container>

                  <!-- Estado -->
                  <ng-container matColumnDef="estado">
                    <th mat-header-cell *matHeaderCellDef>Estado</th>
                    <td mat-cell *matCellDef="let resolucion">
                      <span class="status-chip" [class]="resolucion.estado.toLowerCase()">
                        {{ resolucion.estado }}
                      </span>
                    </td>
                  </ng-container>

                  <!-- Vehículos -->
                  <ng-container matColumnDef="vehiculos">
                    <th mat-header-cell *matHeaderCellDef>Vehículos</th>
                    <td mat-cell *matCellDef="let resolucion">
                      <div class="vehiculos-count">
                        <mat-icon class="count-icon">directions_car</mat-icon>
                        <span class="count-number">{{ getCantidadVehiculos(resolucion.id) }}</span>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Acciones -->
                  <ng-container matColumnDef="acciones">
                    <th mat-header-cell *matHeaderCellDef>Acciones</th>
                    <td mat-cell *matCellDef="let resolucion">
                      <button mat-icon-button [matTooltip]="'Ver vehículos'" (click)="verVehiculos(resolucion)" class="action-icon">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button [matTooltip]="'Agregar vehículos'" (click)="agregarVehiculos(resolucion)" class="action-icon">
                        <mat-icon>add_circle</mat-icon>
                      </button>
                      <button mat-icon-button [matTooltip]="'Editar resolución'" class="action-icon">
                        <mat-icon>edit</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="columnasResoluciones"></tr>
                  <tr mat-row *matRowDef="let row; columns: columnasResoluciones;"></tr>
                </table>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Lista de Vehículos -->
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>list</mat-icon>
                Vehículos de la Empresa
              </mat-card-title>
              <mat-card-subtitle>
                Todos los vehículos registrados para esta empresa
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (vehiculos().length === 0) {
                <div class="empty-state">
                  <mat-icon class="empty-icon">directions_car</mat-icon>
                  <h3>No hay vehículos registrados</h3>
                  <p>Agrega vehículos desde las resoluciones disponibles</p>
                </div>
              } @else {
                <div class="table-container">
                  <table mat-table [dataSource]="vehiculos()" class="vehiculos-table">
                    <!-- Placa -->
                    <ng-container matColumnDef="placa">
                      <th mat-header-cell *matHeaderCellDef>Placa</th>
                      <td mat-cell *matCellDef="let vehiculo">
                        <div class="placa-cell">
                          <span class="placa-text">{{ vehiculo.placa }}</span>
                          @if (vehiculo.estado === 'ACTIVO') {
                            <span class="status-dot activo"></span>
                          } @else {
                            <span class="status-dot inactivo"></span>
                          }
                        </div>
                      </td>
                    </ng-container>

                    <!-- Marca/Modelo -->
                    <ng-container matColumnDef="marcaModelo">
                      <th mat-header-cell *matHeaderCellDef>Marca/Modelo</th>
                      <td mat-cell *matCellDef="let vehiculo">
                        <div class="marca-modelo">
                          <div class="marca">{{ vehiculo.marca }}</div>
                          <div class="modelo">{{ vehiculo.modelo }}</div>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Categoría -->
                    <ng-container matColumnDef="categoria">
                      <th mat-header-cell *matHeaderCellDef>Categoría</th>
                      <td mat-cell *matCellDef="let vehiculo">
                        <span class="categoria-chip">{{ vehiculo.categoria }}</span>
                      </td>
                    </ng-container>

                    <!-- Año -->
                    <ng-container matColumnDef="anio">
                      <th mat-header-cell *matHeaderCellDef>Año</th>
                      <td mat-cell *matCellDef="let vehiculo">
                        {{ vehiculo.anioFabricacion }}
                      </td>
                    </ng-container>

                    <!-- Resolución -->
                    <ng-container matColumnDef="resolucion">
                      <th mat-header-cell *matHeaderCellDef>Resolución</th>
                      <td mat-cell *matCellDef="let vehiculo">
                        @if (vehiculo.resolucionId) {
                          <span class="resolucion-text">{{ getResolucionNumero(vehiculo.resolucionId) }}</span>
                        } @else {
                          <span class="sin-resolucion">Sin resolución</span>
                        }
                      </td>
                    </ng-container>

                    <!-- TUC -->
                    <ng-container matColumnDef="tuc">
                      <th mat-header-cell *matHeaderCellDef>TUC</th>
                      <td mat-cell *matCellDef="let vehiculo">
                        @if (vehiculo.tuc?.nroTuc) {
                          <span class="tuc-text">{{ vehiculo.tuc.nroTuc }}</span>
                        } @else {
                          <span class="sin-tuc">Sin TUC</span>
                        }
                      </td>
                    </ng-container>

                    <!-- Estado -->
                    <ng-container matColumnDef="estado">
                      <th mat-header-cell *matHeaderCellDef>Estado</th>
                      <td mat-cell *matCellDef="let vehiculo">
                        <span class="status-chip" [class]="vehiculo.estado.toLowerCase()">
                          {{ vehiculo.estado }}
                        </span>
                      </td>
                    </ng-container>

                    <!-- Acciones -->
                    <ng-container matColumnDef="acciones">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let vehiculo">
                        <button mat-icon-button [matTooltip]="'Ver detalles'" (click)="verDetallesVehiculo(vehiculo)" class="action-icon">
                          <mat-icon>visibility</mat-icon>
                        </button>
                        <button mat-icon-button [matTooltip]="'Editar'" (click)="editarVehiculo(vehiculo)" class="action-icon">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button [matTooltip]="'Eliminar'" (click)="eliminarVehiculo(vehiculo)" class="action-icon danger">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="columnasVehiculos"></tr>
                    <tr mat-row *matRowDef="let row; columns: columnasVehiculos;"></tr>
                  </table>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      gap: 16px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 24px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .header-text h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      color: #333;
    }

    .header-text p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .header-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 4px;
      text-transform: uppercase;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.3s ease;
    }

    .header-button:hover {
      background-color: #f5f5f5;
      transform: translateY(-1px);
    }

    .info-card, .form-card {
      margin-bottom: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .empresa-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      font-weight: 600;
      color: #333;
    }

    .status-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-chip.habilitada, .status-chip.activa {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-chip.en_tramite {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .status-chip.suspendida {
      background-color: #ffebee;
      color: #c62828;
    }

    .status-chip.cancelada, .status-chip.vencida {
      background-color: #f5f5f5;
      color: #666;
    }

    .header-actions {
      margin-left: auto;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 4px;
      text-transform: uppercase;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.3s ease;
    }

    .action-button:hover {
      background-color: #e3f2fd;
      transform: translateY(-1px);
    }

    .table-container {
      overflow-x: auto;
    }

    .resoluciones-table, .vehiculos-table {
      width: 100%;
      background: white;
    }

    .resoluciones-table th, .vehiculos-table th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
      padding: 12px 8px;
    }

    .resoluciones-table td, .vehiculos-table td {
      padding: 12px 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .resolucion-numero {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .hija-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #ff9800;
    }

    .tipo-chip {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .tipo-chip.padre {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .tipo-chip.hija {
      background-color: #fff3e0;
      color: #ff9800;
    }

    .resuelve-text {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .no-vigencia {
      color: #999;
      font-style: italic;
    }

    .vehiculos-count {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .count-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #1976d2;
    }

    .count-number {
      font-weight: 600;
      color: #1976d2;
    }

    .action-icon {
      margin-right: 4px;
    }

    .action-icon.danger {
      color: #f44336;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #666;
      font-weight: 500;
    }

    .empty-state p {
      margin: 0;
      color: #999;
    }

    .placa-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .placa-text {
      font-weight: 600;
      font-family: monospace;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-dot.activo {
      background-color: #4caf50;
    }

    .status-dot.inactivo {
      background-color: #f44336;
    }

    .marca-modelo {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .marca {
      font-weight: 600;
      color: #333;
    }

    .modelo {
      font-size: 12px;
      color: #666;
    }

    .categoria-chip {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .resolucion-text {
      font-weight: 500;
      color: #1976d2;
    }

    .sin-resolucion {
      color: #999;
      font-style: italic;
    }

    .tuc-text {
      font-family: monospace;
      font-weight: 500;
      color: #333;
    }

    .sin-tuc {
      color: #999;
      font-style: italic;
    }
  `]
})
export class EmpresaVehiculosBatchComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  batchForm!: FormGroup;
  isLoading = signal(false);
  isSubmitting = signal(false);
  empresa = signal<Empresa | null>(null);
  empresaId = signal<string | null>(null);
  resoluciones = signal<Resolucion[]>([]);
  resolucionesJerarquicas = signal<Resolucion[]>([]);
  vehiculos = signal<Vehiculo[]>([]);

  // Columnas para las tablas
  columnasResoluciones = ['numero', 'tipo', 'resuelve', 'fechaEmision', 'vigencia', 'estado', 'vehiculos', 'acciones'];
  columnasVehiculos = ['placa', 'marcaModelo', 'categoria', 'anio', 'resolucion', 'tuc', 'estado', 'acciones'];

  ngOnInit(): void {
    this.empresaId.set(this.route.snapshot.paramMap.get('id'));
    this.initializeForm();
    this.loadEmpresa();
    this.loadResoluciones();
    this.loadVehiculos();
  }

  private initializeForm(): void {
    this.batchForm = this.fb.group({
      // Configuración global
      resolucionPredeterminada: [''],
      rutasPredeterminadas: [[]],
      categoriaPredeterminada: ['M3']
    });
  }

  private loadEmpresa(): void {
    if (this.empresaId()) {
      this.isLoading.set(true);
      this.empresaService.getEmpresaById(this.empresaId()!).subscribe({
        next: (empresa) => {
          this.empresa.set(empresa);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error cargando empresa:', error);
          this.snackBar.open('Error al cargar la empresa', 'Cerrar', { duration: 5000 });
          this.isLoading.set(false);
          this.volver();
        }
      });
    }
  }

  private loadResoluciones(): void {
    // Mock data - en producción esto vendría del servicio
    const mockResoluciones: Resolucion[] = [
      {
        id: '1',
        numero: 'RES-001/2024',
        tipoResolucion: 'PADRE',
        resuelve: 'Autorización para operar transporte público',
        fechaEmision: '2024-01-15',
        estado: 'ACTIVA',
        fechaInicioVigencia: '2024-01-15',
        fechaFinVigencia: '2029-01-15',
        rutasAutorizadas: ['1', '2', '3'],
        cantidadVehiculos: 5,
        resolucionesHijas: [
          {
            id: '2',
            numero: 'RES-002/2024',
            tipoResolucion: 'HIJO',
            resuelve: 'Ampliación de rutas para zona norte',
            fechaEmision: '2024-02-20',
            estado: 'ACTIVA',
            resolucionPadreId: '1',
            rutasAutorizadas: ['4', '5'],
            cantidadVehiculos: 3
          },
          {
            id: '3',
            numero: 'RES-003/2024',
            tipoResolucion: 'HIJO',
            resuelve: 'Autorización para vehículos de carga',
            fechaEmision: '2024-03-10',
            estado: 'ACTIVA',
            resolucionPadreId: '1',
            rutasAutorizadas: ['6', '7'],
            cantidadVehiculos: 2
          }
        ]
      },
      {
        id: '4',
        numero: 'RES-004/2024',
        tipoResolucion: 'PADRE',
        resuelve: 'Autorización para transporte interprovincial',
        fechaEmision: '2024-04-01',
        estado: 'ACTIVA',
        fechaInicioVigencia: '2024-04-01',
        fechaFinVigencia: '2029-04-01',
        rutasAutorizadas: ['8', '9', '10'],
        cantidadVehiculos: 4,
        resolucionesHijas: [
          {
            id: '5',
            numero: 'RES-005/2024',
            tipoResolucion: 'HIJO',
            resuelve: 'Ampliación a rutas costeras',
            fechaEmision: '2024-05-15',
            estado: 'ACTIVA',
            resolucionPadreId: '4',
            rutasAutorizadas: ['11', '12'],
            cantidadVehiculos: 1
          }
        ]
      }
    ];
    
    this.resoluciones.set(mockResoluciones);
    this.resolucionesJerarquicas.set(mockResoluciones);
  }

  private loadVehiculos(): void {
    // Mock data - en producción esto vendría del servicio
    const mockVehiculos: Vehiculo[] = [
      {
        id: '1',
        placa: 'ABC-123',
        marca: 'MERCEDES-BENZ',
        modelo: 'O500RS',
        categoria: 'M3',
        anioFabricacion: 2020,
        estado: 'ACTIVO',
        estaActivo: true,
        empresaActualId: this.empresaId()!,
        resolucionId: '1',
        rutasAsignadasIds: ['1', '2'],
        tuc: { nroTuc: 'T-123456-2024', fechaEmision: '2024-01-15' },
        datosTecnicos: {
          motor: 'ABC123456789',
          chasis: 'A123-B456-C789',
          cilindros: 6,
          ejes: 2,
          ruedas: 6,
          asientos: 30,
          pesoNeto: 8.500,
          pesoBruto: 16.000,
          medidas: { largo: 10.5, ancho: 2.5, alto: 3.2 }
        }
      },
      {
        id: '2',
        placa: 'XYZ-789',
        marca: 'VOLVO',
        modelo: 'B12M',
        categoria: 'M3',
        anioFabricacion: 2019,
        estado: 'ACTIVO',
        estaActivo: true,
        empresaActualId: this.empresaId()!,
        resolucionId: '2',
        rutasAsignadasIds: ['4', '5'],
        tuc: { nroTuc: 'T-789012-2024', fechaEmision: '2024-02-20' },
        datosTecnicos: {
          motor: 'XYZ987654321',
          chasis: 'X789-Y012-Z345',
          cilindros: 6,
          ejes: 2,
          ruedas: 6,
          asientos: 25,
          pesoNeto: 7.800,
          pesoBruto: 15.500,
          medidas: { largo: 9.8, ancho: 2.4, alto: 3.0 }
        }
      }
    ];
    
    this.vehiculos.set(mockVehiculos);
  }

  // Método para obtener todas las resoluciones (padres e hijas) en una lista plana
  todasLasResoluciones(): Resolucion[] {
    const todas: Resolucion[] = [];
    
    this.resolucionesJerarquicas().forEach(resolucionPadre => {
      // Agregar resolución padre
      todas.push({
        ...resolucionPadre,
        resolucionesHijas: undefined // Remover para la lista plana
      });
      
      // Agregar resoluciones hijas
      if (resolucionPadre.resolucionesHijas) {
        resolucionPadre.resolucionesHijas.forEach(resolucionHija => {
          todas.push(resolucionHija);
        });
      }
    });
    
    return todas;
  }

  // Método para obtener datos para la tabla (lista plana)
  resolucionesParaTabla(): Resolucion[] {
    return this.todasLasResoluciones();
  }

  // Método para obtener cantidad de vehículos por resolución
  getCantidadVehiculos(resolucionId: string): number {
    return this.vehiculos().filter(v => v.resolucionId === resolucionId).length;
  }

  // Método para obtener número de resolución
  getResolucionNumero(resolucionId: string): string {
    const resolucion = this.todasLasResoluciones().find(r => r.id === resolucionId);
    return resolucion ? resolucion.numero : 'N/A';
  }

  agregarResolucion(): void {
    this.snackBar.open('Funcionalidad de agregar resolución en desarrollo', 'Cerrar', { duration: 3000 });
  }

  verVehiculos(resolucion: Resolucion): void {
    const vehiculosResolucion = this.vehiculos().filter(v => v.resolucionId === resolucion.id);
    this.snackBar.open(`Vehículos de ${resolucion.numero}: ${vehiculosResolucion.length}`, 'Cerrar', { duration: 3000 });
  }

  agregarVehiculos(resolucion: Resolucion): void {
    const dialogRef = this.dialog.open(AgregarVehiculosModalComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: {
        resolucion: resolucion,
        empresaId: this.empresaId()
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Actualizar la lista de vehículos con los nuevos
        const nuevosVehiculos = result.vehiculos.map((vehiculo: VehiculoCreate) => ({
          id: Date.now().toString(), // ID temporal
          placa: vehiculo.placa,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          categoria: vehiculo.categoria,
          anioFabricacion: vehiculo.anioFabricacion,
          estado: 'ACTIVO',
          estaActivo: true,
          empresaActualId: this.empresaId()!,
          resolucionId: result.resolucionId,
          rutasAsignadasIds: vehiculo.rutasAsignadasIds || [],
          tuc: vehiculo.tuc,
          datosTecnicos: vehiculo.datosTecnicos
        }));

        this.vehiculos.update(current => [...current, ...nuevosVehiculos]);
        
        this.snackBar.open(`${result.vehiculos.length} vehículos agregados exitosamente`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  verDetallesVehiculo(vehiculo: Vehiculo): void {
    this.snackBar.open(`Ver detalles de ${vehiculo.placa}`, 'Cerrar', { duration: 3000 });
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    this.snackBar.open(`Editar ${vehiculo.placa}`, 'Cerrar', { duration: 3000 });
  }

  eliminarVehiculo(vehiculo: Vehiculo): void {
    this.snackBar.open(`Eliminar ${vehiculo.placa}`, 'Cerrar', { duration: 3000 });
  }

  volver(): void {
    this.router.navigate(['/empresas', this.empresaId()]);
  }
} 