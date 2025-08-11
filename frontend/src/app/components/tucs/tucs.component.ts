import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipListbox } from '@angular/material/chips';

import { Tuc, TucCreate, TucUpdate, EstadoTuc } from '../../models/tuc.model';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { TucService } from '../../services/tuc.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-tucs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTabsModule,
    MatBadgeModule,
    MatChipListbox
  ] as const,
  template: `
    <div class="tucs-container">
      <!-- Header con estadísticas -->
      <mat-card class="stats-card">
        <mat-card-content>
          <div class="stats-grid">
            <div class="stat-item" [class.warning]="estadisticas()?.proximosAVencer > 0" [class.danger]="estadisticas()?.vencidos > 0">
              <mat-icon>receipt</mat-icon>
              <div class="stat-content">
                <span class="stat-number">{{ estadisticas()?.total || 0 }}</span>
                <span class="stat-label">Total TUCs</span>
              </div>
            </div>
            
            <div class="stat-item success">
              <mat-icon>check_circle</mat-icon>
              <div class="stat-content">
                <span class="stat-number">{{ estadisticas()?.vigentes || 0 }}</span>
                <span class="stat-label">Vigentes</span>
              </div>
            </div>
            
            <div class="stat-item warning" *ngIf="estadisticas()?.proximosAVencer > 0">
              <mat-icon>warning</mat-icon>
              <div class="stat-content">
                <span class="stat-number">{{ estadisticas()?.proximosAVencer || 0 }}</span>
                <span class="stat-label">Próximos a Vencer</span>
              </div>
            </div>
            
            <div class="stat-item danger" *ngIf="estadisticas()?.vencidos > 0">
              <mat-icon>error</mat-icon>
              <div class="stat-content">
                <span class="stat-number">{{ estadisticas()?.vencidos || 0 }}</span>
                <span class="stat-label">Vencidos</span>
              </div>
            </div>
            
            <div class="stat-item">
              <mat-icon>block</mat-icon>
              <div class="stat-content">
                <span class="stat-number">{{ estadisticas()?.dadosDeBaja || 0 }}</span>
                <span class="stat-label">Dados de Baja</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Filtros y búsqueda -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar TUC</mat-label>
              <input matInput 
                     [(ngModel)]="filtroBusqueda" 
                     placeholder="Número TUC, placa, empresa..."
                     (input)="aplicarFiltros()">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="estado-filter">
              <mat-label>Estado</mat-label>
              <mat-select [(ngModel)]="filtroEstado" (selectionChange)="aplicarFiltros()">
                <mat-option value="">Todos</mat-option>
                <mat-option value="VIGENTE">Vigente</mat-option>
                <mat-option value="DADA_DE_BAJA">Dado de Baja</mat-option>
                <mat-option value="DESECHADA">Desechado</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="empresa-filter">
              <mat-label>Empresa</mat-label>
              <mat-select [(ngModel)]="filtroEmpresa" (selectionChange)="aplicarFiltros()">
                <mat-option value="">Todas</mat-option>
                @for (empresa of empresas() || []; track empresa.id) {
                  <mat-option [value]="empresa.id">{{ empresa.razonSocial }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <button mat-raised-button 
                    color="primary" 
                    (click)="abrirModalCrearTuc()"
                    class="create-button">
              <mat-icon>add</mat-icon>
              Crear TUC
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tabla de TUCs -->
      <mat-card class="table-card">
        <mat-card-content>
          @if (cargando()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Cargando TUCs...</p>
            </div>
          } @else if (tucsFiltrados().length === 0) {
            <div class="empty-state">
              <mat-icon>receipt</mat-icon>
              <h3>No se encontraron TUCs</h3>
              <p>{{ filtroAplicado ? 'Intenta ajustar los filtros de búsqueda' : 'No hay TUCs registrados en el sistema' }}</p>
              @if (!filtroAplicado) {
                <button mat-raised-button color="primary" (click)="abrirModalCrearTuc()">
                  <mat-icon>add</mat-icon>
                  Crear Primer TUC
                </button>
              }
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="tucsFiltrados()" matSort (matSortChange)="ordenarDatos($event)" class="tucs-table">
                
                <!-- Número TUC -->
                <ng-container matColumnDef="nroTuc">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Número TUC </th>
                  <td mat-cell *matCellDef="let tuc"> 
                    <div class="tuc-number">
                      <span class="tuc-numero">{{ tuc.nroTuc }}</span>
                                             @if (tuc.estado === 'VIGENTE') {
                         @if (isTucProximoAVencer(tuc.fechaEmision)) {
                           <mat-icon class="warning-icon" matTooltip="Próximo a vencer">warning</mat-icon>
                         } @else if (isTucVencido(tuc.fechaEmision)) {
                           <mat-icon class="danger-icon" matTooltip="Vencido">error</mat-icon>
                         }
                       }
                    </div>
                  </td>
                </ng-container>

                <!-- Vehículo -->
                <ng-container matColumnDef="vehiculo">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Vehículo </th>
                  <td mat-cell *matCellDef="let tuc"> 
                    @if (tuc.vehiculo) {
                      <div class="vehiculo-info">
                        <span class="placa">{{ tuc.vehiculo.placa | uppercase }}</span>
                        <span class="marca-modelo">{{ tuc.vehiculo.marca | uppercase }} {{ tuc.vehiculo.modelo | uppercase }}</span>
                      </div>
                    } @else {
                      <span class="no-data">Sin vehículo</span>
                    }
                  </td>
                </ng-container>

                <!-- Empresa -->
                <ng-container matColumnDef="empresa">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Empresa </th>
                  <td mat-cell *matCellDef="let tuc"> 
                    @if (tuc.empresa) {
                      <span class="empresa-nombre">{{ tuc.empresa.razonSocial | uppercase }}</span>
                    } @else {
                      <span class="no-data">Sin empresa</span>
                    }
                  </td>
                </ng-container>

                <!-- Resolución -->
                <ng-container matColumnDef="resolucion">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Resolución </th>
                  <td mat-cell *matCellDef="let tuc"> 
                    @if (tuc.resolucion && tuc.resolucion.numero) {
                      <span class="resolucion-numero">{{ tuc.resolucion.numero | uppercase }}</span>
                    } @else {
                      <span class="no-data">Sin resolución</span>
                    }
                  </td>
                </ng-container>

                <!-- Fecha Emisión -->
                <ng-container matColumnDef="fechaEmision">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Fecha Emisión </th>
                  <td mat-cell *matCellDef="let tuc"> 
                    <div class="fecha-info">
                      <span class="fecha">{{ tuc.fechaEmision | date:'dd/MM/yyyy' | uppercase }}</span>
                      <span class="hora">{{ tuc.fechaEmision | date:'HH:mm' }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Estado -->
                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Estado </th>
                  <td mat-cell *matCellDef="let tuc"> 
                    <mat-chip-listbox>
                      <mat-chip-option 
                        [color]="getEstadoColor(tuc.estado)" 
                        [selected]="true"
                        [disabled]="true"
                        class="estado-chip">
                        {{ getEstadoDisplayName(tuc.estado) }}
                      </mat-chip-option>
                    </mat-chip-listbox>
                  </td>
                </ng-container>

                <!-- Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef> Acciones </th>
                  <td mat-cell *matCellDef="let tuc"> 
                    <div class="actions-container">
                      <button mat-icon-button 
                              [matMenuTriggerFor]="menu" 
                              matTooltip="Acciones">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      
                      <mat-menu #menu="matMenu">
                        <button mat-menu-item (click)="verDetalleTuc(tuc)">
                          <mat-icon>visibility</mat-icon>
                          <span>Ver Detalle</span>
                        </button>
                        
                        @if (tuc.estado === 'VIGENTE') {
                          <button mat-menu-item (click)="editarTuc(tuc)">
                            <mat-icon>edit</mat-icon>
                            <span>Editar</span>
                          </button>
                          
                          <button mat-menu-item (click)="darDeBajaTuc(tuc)">
                            <mat-icon>block</mat-icon>
                            <span>Dar de Baja</span>
                          </button>
                        }
                        
                        @if (tuc.estado === 'DADA_DE_BAJA') {
                          <button mat-menu-item (click)="reactivarTuc(tuc)">
                            <mat-icon>refresh</mat-icon>
                            <span>Reactivar</span>
                          </button>
                        }
                        
                        <button mat-menu-item (click)="generarQR(tuc)">
                          <mat-icon>qr_code</mat-icon>
                          <span>Generar QR</span>
                        </button>
                        
                        <button mat-menu-item (click)="descargarDocumento(tuc)">
                          <mat-icon>download</mat-icon>
                          <span>Descargar</span>
                        </button>
                        
                        <button mat-menu-item (click)="eliminarTuc(tuc)" class="danger-action">
                          <mat-icon>delete</mat-icon>
                          <span>Eliminar</span>
                        </button>
                      </mat-menu>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                    (click)="verDetalleTuc(row)"
                    class="tuc-row"></tr>
              </table>

              <!-- Paginación -->
              <mat-paginator 
                [length]="totalTucs()"
                [pageSize]="pageSize"
                [pageSizeOptions]="[10, 25, 50, 100]"
                (page)="cambiarPagina($event)"
                showFirstLastButtons>
              </mat-paginator>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .tucs-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .stats-card {
      margin-bottom: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      padding: 16px 0;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      transition: transform 0.2s, background 0.2s;

      &:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.2);
      }

      &.success { background: rgba(76, 175, 80, 0.2); }
      &.warning { background: rgba(255, 152, 0, 0.2); }
      &.danger { background: rgba(244, 67, 54, 0.2); }
    }

    .stat-item mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 24px;
      font-weight: 700;
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 4px;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 300px;
    }

    .estado-filter,
    .empresa-filter {
      min-width: 200px;
    }

    .create-button {
      white-space: nowrap;
      border-radius: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 24px;
    }

    .table-card {
      margin-bottom: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      gap: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      text-align: center;
      gap: 16px;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }

    .empty-state h3 {
      margin: 0;
      color: #666;
    }

    .empty-state p {
      margin: 0;
      color: #999;
    }

    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .tucs-table {
      width: 100%;
      border-collapse: collapse;
    }

    .tucs-table th {
      background-color: #f5f5f5;
      color: #333;
      font-weight: 600;
      padding: 16px 12px;
      text-align: left;
      border-bottom: 2px solid #e0e0e0;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tucs-table td {
      padding: 16px 12px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: top;
    }

    .tucs-table tr:hover {
      background-color: #fafafa;
    }

    .tuc-row {
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: rgba(25, 118, 210, 0.04);
      }
    }

    .tuc-number {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tuc-numero {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #1976d2;
      font-size: 14px;
      letter-spacing: 0.5px;
    }

    .warning-icon {
      color: #ff9800;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .danger-icon {
      color: #f44336;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .vehiculo-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .placa {
      font-weight: 600;
      color: #333;
      font-size: 14px;
      font-family: 'Courier New', monospace;
      background-color: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }

    .marca-modelo {
      font-size: 12px;
      color: #666;
      font-style: italic;
    }

    .empresa-nombre {
      font-weight: 500;
      color: #333;
      font-size: 13px;
      line-height: 1.3;
    }

    .resolucion-numero {
      font-family: 'Courier New', monospace;
      color: #666;
      font-size: 13px;
      background-color: #f8f9fa;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }

    .fecha-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .fecha {
      font-weight: 500;
      color: #333;
      font-size: 13px;
    }

    .hora {
      font-size: 11px;
      color: #666;
      font-family: 'Courier New', monospace;
    }

    .no-data {
      color: #999;
      font-style: italic;
      font-size: 12px;
    }

    .actions-container {
      display: flex;
      justify-content: center;
    }

    .danger-action {
      color: #f44336;
    }

    mat-paginator {
      border-top: 1px solid #e0e0e0;
      background-color: #fafafa;
    }

    .estado-chip {
      font-weight: 600;
      font-size: 14px;
      padding: 4px 12px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    @media (max-width: 768px) {
      .tucs-container {
        padding: 16px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field,
      .estado-filter,
      .empresa-filter {
        min-width: auto;
      }
    }
  `]
})
export class TucsComponent implements OnInit {
  private tucService = inject(TucService);
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Signals
  tucs = signal<Tuc[]>([]);
  empresas = signal<Empresa[]>([]);
  estadisticas = signal<any>(null);
  cargando = signal(false);

  // Computed
  tucsFiltrados = computed(() => {
    let tucs = this.tucs();
    
    if (this.filtroBusqueda) {
      const busqueda = this.filtroBusqueda.toLowerCase();
      tucs = tucs.filter(tuc => 
        tuc.nroTuc.toLowerCase().includes(busqueda) ||
        (tuc.vehiculo?.placa?.toLowerCase().includes(busqueda)) ||
        (tuc.empresa?.razonSocial?.toLowerCase().includes(busqueda))
      );
    }
    
    if (this.filtroEstado) {
      tucs = tucs.filter(tuc => tuc.estado === this.filtroEstado);
    }
    
    if (this.filtroEmpresa) {
      tucs = tucs.filter(tuc => tuc.empresaId === this.filtroEmpresa);
    }
    
    return tucs;
  });

  totalTucs = computed(() => this.tucsFiltrados().length);

  // Propiedades del componente
  displayedColumns = ['nroTuc', 'vehiculo', 'empresa', 'resolucion', 'fechaEmision', 'estado', 'acciones'];
  pageSize = 25;
  filtroBusqueda = '';
  filtroEstado = '';
  filtroEmpresa = '';
  filtroAplicado = false;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);
    
    // Cargar TUCs con información completa
    this.tucService.getTucs().subscribe({
      next: (tucs) => {
        console.log('TUCs recibidos del servicio:', tucs);
        console.log('Primer TUC completo:', tucs[0]);
        console.log('Propiedades del primer TUC:', {
          id: tucs[0]?.id,
          vehiculo: tucs[0]?.vehiculo,
          empresa: tucs[0]?.empresa,
          resolucion: tucs[0]?.resolucion
        });
        // Los datos mock ya incluyen la información relacionada
        this.tucs.set(tucs);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando TUCs:', error);
        this.notificationService.showError('Error al cargar los TUCs');
        this.cargando.set(false);
      }
    });

    // Cargar empresas para filtros
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => this.empresas.set(empresas),
      error: (error) => console.error('Error cargando empresas:', error)
    });

    // Cargar estadísticas
    this.tucService.getEstadisticasTucs().subscribe({
      next: (stats) => this.estadisticas.set(stats),
      error: (error) => console.error('Error cargando estadísticas:', error)
    });
  }

  aplicarFiltros() {
    this.filtroAplicado = !!(this.filtroBusqueda || this.filtroEstado || this.filtroEmpresa);
  }

  ordenarDatos(sort: Sort) {
    // Implementar ordenamiento
  }

  cambiarPagina(event: PageEvent) {
    // Implementar paginación
  }

  getEstadoColor(estado: EstadoTuc): string {
    switch (estado) {
      case 'VIGENTE': return 'primary';
      case 'DADA_DE_BAJA': return 'warn';
      case 'DESECHADA': return 'accent';
      case 'SUSPENDIDO': return 'warn';
      case 'VENCIDO': return 'warn';
      default: return 'primary';
    }
  }

  getEstadoDisplayName(estado: EstadoTuc): string {
    switch (estado) {
      case 'VIGENTE': return 'VIGENTE';
      case 'DADA_DE_BAJA': return 'DADO DE BAJA';
      case 'DESECHADA': return 'DESECHADO';
      case 'SUSPENDIDO': return 'SUSPENDIDO';
      case 'VENCIDO': return 'VENCIDO';
      default: return String(estado).toUpperCase();
    }
  }

  abrirModalCrearTuc() {
    // TODO: Implementar modal de creación
    this.notificationService.showInfo('Funcionalidad en desarrollo');
  }

  verDetalleTuc(tuc: Tuc) {
    this.router.navigate(['/tucs', tuc.id]);
  }

  editarTuc(tuc: Tuc) {
    // TODO: Implementar edición
    this.notificationService.showInfo('Edición en desarrollo');
  }

  darDeBajaTuc(tuc: Tuc) {
    // TODO: Implementar dar de baja
    this.notificationService.showInfo('Dar de baja en desarrollo');
  }

  reactivarTuc(tuc: Tuc) {
    // TODO: Implementar reactivación
    this.notificationService.showInfo('Reactivación en desarrollo');
  }

  generarQR(tuc: Tuc) {
    // TODO: Implementar generación de QR
    this.notificationService.showInfo('Generación de QR en desarrollo');
  }

  descargarDocumento(tuc: Tuc) {
    // TODO: Implementar descarga
    this.notificationService.showInfo('Descarga en desarrollo');
  }

  eliminarTuc(tuc: Tuc) {
    // TODO: Implementar eliminación
    this.notificationService.showInfo('Eliminación en desarrollo');
  }

  // Métodos auxiliares para el template
  isTucProximoAVencer(fechaEmision: string): boolean {
    return this.tucService.isTucProximoAVencer(fechaEmision);
  }

  isTucVencido(fechaEmision: string): boolean {
    return this.tucService.isTucVencido(fechaEmision);
  }
} 