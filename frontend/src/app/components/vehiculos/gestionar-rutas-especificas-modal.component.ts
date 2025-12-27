import { Component, OnInit, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VehiculoService } from '../../services/vehiculo.service';
import { ResolucionService } from '../../services/resolucion.service';
import { RutaService } from '../../services/ruta.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Ruta } from '../../models/ruta.model';
import { CrearRutaEspecificaModalComponent } from './crear-ruta-especifica-modal.component';

interface RutaEspecifica {
  id: string;
  rutaGeneralId: string;
  rutaGeneralCodigo: string;
  vehiculoId: string;
  resolucionId: string;
  codigo: string;
  origen: string;
  destino: string;
  distancia: number;
  descripcion: string;
  estado: string;
  tipoRuta: string;
  fechaCreacion: Date;
  horarios: any[];
  paradasAdicionales: any[];
}

@Component({
  selector: 'app-gestionar-rutas-especificas-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="modal-header">
      <h2>Gestionar Rutas Específicas</h2>
      <h3>Vehículo: {{ data.vehiculo.placa }}</h3>
      <button mat-icon-button (click)="cerrar()" class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div class="modal-content">
      @if (cargando()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando información...</p>
        </div>
      } @else {
        <!-- Información del vehículo y resolución -->
        @if (resolucionAsociada()) {
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>info</mat-icon>
                Información del Vehículo
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Placa:</span>
                  <span class="value">{{ data.vehiculo.placa }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Marca/Modelo:</span>
                  <span class="value">{{ data.vehiculo.marca }} {{ data.vehiculo.modelo }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Resolución:</span>
                  <span class="value">{{ resolucionAsociada()?.nroResolucion }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Tipo:</span>
                  <span class="value">{{ resolucionAsociada()?.tipoResolucion }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Empresa:</span>
                  <span class="value">{{ empresaNombre() }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Rutas generales disponibles -->
        <mat-card class="rutas-generales-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>map</mat-icon>
              Rutas Generales Disponibles
            </mat-card-title>
            <mat-card-subtitle>
              Selecciona una ruta general para crear una ruta específica
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (rutasGeneralesDisponibles().length === 0) {
              <div class="empty-state">
                <mat-icon>route</mat-icon>
                <p>No hay rutas generales disponibles</p>
                <small>El vehículo debe estar asociado a una resolución con rutas autorizadas</small>
              </div>
            } @else {
              <div class="rutas-generales-list">
                @for (rutaGeneral of rutasGeneralesDisponibles(); track rutaGeneral.id) {
                  <div class="ruta-general-item">
                    <div class="ruta-info">
                      <h4>{{ rutaGeneral.codigoRuta }}</h4>
                      <p class="trayecto">{{ rutaGeneral.origen }} → {{ rutaGeneral.destino }}</p>
                      <div class="ruta-details">
                        <span class="distancia">
                          <mat-icon>straighten</mat-icon>
                          {{ rutaGeneral.distancia }} km
                        </span>
                        <span class="tipo">
                          <mat-icon>category</mat-icon>
                          {{ rutaGeneral.tipoRuta || 'GENERAL' }}
                        </span>
                      </div>
                    </div>
                    <div class="ruta-actions">
                      <button mat-raised-button color="primary" 
                              (click)="crearRutaEspecifica(rutaGeneral)"
                              [disabled]="yaExisteRutaEspecifica(rutaGeneral.id)">
                        <mat-icon>add</mat-icon>
                        @if (yaExisteRutaEspecifica(rutaGeneral.id)) {
                          Ya Existe
                        } @else {
                          Crear Específica
                        }
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Rutas específicas existentes -->
        <mat-card class="rutas-especificas-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>route</mat-icon>
              Rutas Específicas del Vehículo
              <span class="count-badge">{{ rutasEspecificas().length }}</span>
            </mat-card-title>
            <mat-card-subtitle>
              Rutas personalizadas para este vehículo
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (rutasEspecificas().length === 0) {
              <div class="empty-state">
                <mat-icon>route</mat-icon>
                <p>No hay rutas específicas creadas</p>
                <small>Crea rutas específicas basadas en las rutas generales disponibles</small>
              </div>
            } @else {
              <div class="rutas-especificas-list">
                @for (rutaEspecifica of rutasEspecificas(); track rutaEspecifica.id) {
                  <div class="ruta-especifica-item">
                    <div class="ruta-info">
                      <h4>{{ rutaEspecifica.codigo }}</h4>
                      <p class="trayecto">{{ rutaEspecifica.origen }} → {{ rutaEspecifica.destino }}</p>
                      <p class="descripcion">{{ rutaEspecifica.descripcion }}</p>
                      <div class="ruta-details">
                        <span class="base-ruta">
                          <mat-icon>link</mat-icon>
                          Base: {{ rutaEspecifica.rutaGeneralCodigo }}
                        </span>
                        <span class="estado" [class]="'estado-' + rutaEspecifica.estado.toLowerCase()">
                          {{ rutaEspecifica.estado }}
                        </span>
                        <span class="horarios">
                          <mat-icon>schedule</mat-icon>
                          {{ rutaEspecifica.horarios?.length || 0 }} horarios
                        </span>
                      </div>
                    </div>
                    <div class="ruta-actions">
                      <button mat-icon-button color="primary" 
                              (click)="editarRutaEspecifica(rutaEspecifica)"
                              matTooltip="Editar ruta específica">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              (click)="verDetalleRutaEspecifica(rutaEspecifica)"
                              matTooltip="Ver detalles">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" 
                              (click)="eliminarRutaEspecifica(rutaEspecifica)"
                              matTooltip="Eliminar ruta específica">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>

    <div class="modal-actions">
      <button mat-button (click)="cerrar()">
        <mat-icon>close</mat-icon>
        Cerrar
      </button>
      <button mat-raised-button color="primary" (click)="actualizarDatos()">
        <mat-icon>refresh</mat-icon>
        Actualizar
      </button>
    </div>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #e0e0e0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      position: relative;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .modal-header h3 {
      margin: 4px 0 0 0;
      font-size: 16px;
      font-weight: 400;
      opacity: 0.9;
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

    .info-card {
      margin-bottom: 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
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

    .rutas-generales-card,
    .rutas-especificas-card {
      margin-bottom: 24px;
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

    .rutas-generales-list,
    .rutas-especificas-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .ruta-general-item,
    .ruta-especifica-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
      transition: all 0.2s ease;
    }

    .ruta-general-item:hover,
    .ruta-especifica-item:hover {
      background: #f0f0f0;
      border-color: #1976d2;
    }

    .ruta-info {
      flex: 1;
    }

    .ruta-info h4 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-weight: 600;
      font-size: 16px;
    }

    .trayecto {
      margin: 0 0 8px 0;
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .descripcion {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 13px;
      font-style: italic;
    }

    .ruta-details {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .ruta-details span {
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

    .ruta-details mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .estado-activa {
      background: #d4edda !important;
      color: #155724 !important;
      border-color: #c3e6cb !important;
    }

    .estado-inactiva {
      background: #f8d7da !important;
      color: #721c24 !important;
      border-color: #f5c6cb !important;
    }

    .ruta-actions {
      display: flex;
      gap: 8px;
      align-items: center;
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

    .empty-state p {
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    .empty-state small {
      color: #999;
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

      .ruta-general-item,
      .ruta-especifica-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .ruta-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class GestionarRutasEspecificasModalComponent implements OnInit {
  private vehiculoService = inject(VehiculoService);
  private resolucionService = inject(ResolucionService);
  private rutaService = inject(RutaService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Signals
  cargando = signal(false);
  resolucionAsociada = signal<Resolucion | null>(null);
  rutasGeneralesDisponibles = signal<Ruta[]>([]);
  rutasEspecificas = signal<RutaEspecifica[]>([]);
  empresaNombre = signal<string>('');

  constructor(
    public dialogRef: MatDialogRef<GestionarRutasEspecificasModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { vehiculo: Vehiculo; empresas: Empresa[] }
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.cargando.set(true);
    
    try {
      // Obtener empresa
      const empresa = this.data.empresas.find(e => e.id === this.data.vehiculo.empresaActualId);
      this.empresaNombre.set(empresa?.razonSocial?.principal || 'N/A');

      // Obtener todas las resoluciones
      this.resolucionService.getResoluciones().subscribe({
        next: (resoluciones) => {
          // Buscar resolución asociada al vehículo
          const resolucionAsociada = resoluciones.find(r => 
            r.vehiculosHabilitadosIds && 
            r.vehiculosHabilitadosIds.includes(this.data.vehiculo.id)
          );
          
          this.resolucionAsociada.set(resolucionAsociada || null);

          if (resolucionAsociada) {
            this.cargarRutasGenerales(resolucionAsociada);
          }
          
          this.cargarRutasEspecificas();
        },
        error: (error) => {
          console.error('Error cargando resoluciones:', error);
          this.snackBar.open('Error al cargar resoluciones', 'Cerrar', { duration: 3000 });
        }
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.snackBar.open('Error al cargar datos', 'Cerrar', { duration: 3000 });
    } finally {
      this.cargando.set(false);
    }
  }

  cargarRutasGenerales(resolucion: Resolucion): void {
    if (!resolucion.rutasAutorizadasIds || resolucion.rutasAutorizadasIds.length === 0) {
      this.rutasGeneralesDisponibles.set([]);
      return;
    }

    this.rutaService.getRutas().subscribe({
      next: (todasRutas) => {
        const rutasGenerales = todasRutas.filter(ruta => 
          resolucion.rutasAutorizadasIds!.includes(ruta.id) &&
          (ruta.tipoRuta === 'INTERURBANA' || ruta.tipoRuta === 'INTERPROVINCIAL' || ruta.tipoRuta === 'INTERREGIONAL')
        );
        this.rutasGeneralesDisponibles.set(rutasGenerales);
      },
      error: (error) => {
        console.error('Error cargando rutas generales:', error);
        this.snackBar.open('Error al cargar rutas generales', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cargarRutasEspecificas(): void {
    // TODO: Implementar cuando exista el endpoint
    // Por ahora simulamos datos
    const rutasSimuladas: RutaEspecifica[] = [
      {
        id: '1',
        rutaGeneralId: 'ruta-1',
        rutaGeneralCodigo: 'PUN-JUL-001',
        vehiculoId: this.data.vehiculo.id,
        resolucionId: this.resolucionAsociada()?.id || '',
        codigo: 'PUN-JUL-ESP-001',
        origen: 'PUNO',
        destino: 'JULIACA',
        distancia: 45,
        descripcion: 'Servicio Expreso Mañana',
        estado: 'ACTIVA',
        tipoRuta: 'ESPECIFICA',
        fechaCreacion: new Date(),
        horarios: [
          { horaSalida: '06:00', horaLlegada: '07:30', dias: ['L', 'M', 'X', 'J', 'V'] }
        ],
        paradasAdicionales: []
      }
    ];

    this.rutasEspecificas.set(rutasSimuladas);
  }

  yaExisteRutaEspecifica(rutaGeneralId: string): boolean {
    return this.rutasEspecificas().some(re => re.rutaGeneralId === rutaGeneralId);
  }

  crearRutaEspecifica(rutaGeneral: Ruta): void {
    console.log('🆕 Crear ruta específica basada en:', rutaGeneral);
    
    const dialogRef = this.dialog.open(CrearRutaEspecificaModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        vehiculo: this.data.vehiculo,
        rutaGeneral: rutaGeneral,
        esEdicion: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Ruta específica creada:', result);
        this.snackBar.open('Ruta específica creada exitosamente', 'Cerrar', { duration: 3000 });
        
        // Agregar la nueva ruta a la lista
        const nuevaRuta: RutaEspecifica = {
          id: Date.now().toString(),
          rutaGeneralId: rutaGeneral.id,
          rutaGeneralCodigo: rutaGeneral.codigoRuta,
          vehiculoId: this.data.vehiculo.id,
          resolucionId: this.resolucionAsociada()?.id || '',
          codigo: result.codigo,
          origen: result.origen,
          destino: result.destino,
          distancia: result.distancia,
          descripcion: result.descripcion,
          estado: result.estado,
          tipoRuta: 'ESPECIFICA',
          fechaCreacion: new Date(),
          horarios: result.horarios || [],
          paradasAdicionales: result.paradasAdicionales || []
        };
        
        const rutasActuales = this.rutasEspecificas();
        this.rutasEspecificas.set([...rutasActuales, nuevaRuta]);
      }
    });
  }

  editarRutaEspecifica(rutaEspecifica: RutaEspecifica): void {
    console.log('✏️ Editar ruta específica:', rutaEspecifica);
    
    // Buscar la ruta general asociada
    const rutaGeneral = this.rutasGeneralesDisponibles().find(r => r.id === rutaEspecifica.rutaGeneralId);
    
    if (!rutaGeneral) {
      this.snackBar.open('No se encontró la ruta general asociada', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(CrearRutaEspecificaModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        vehiculo: this.data.vehiculo,
        rutaGeneral: rutaGeneral,
        rutaEspecifica: rutaEspecifica,
        esEdicion: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Ruta específica actualizada:', result);
        this.snackBar.open('Ruta específica actualizada exitosamente', 'Cerrar', { duration: 3000 });
        
        // Actualizar la ruta en la lista
        const rutasActuales = this.rutasEspecificas();
        const rutasActualizadas = rutasActuales.map(r => 
          r.id === rutaEspecifica.id ? { ...r, ...result } : r
        );
        this.rutasEspecificas.set(rutasActualizadas);
      }
    });
  }

  verDetalleRutaEspecifica(rutaEspecifica: RutaEspecifica): void {
    console.log('👁️ Ver detalle ruta específica:', rutaEspecifica);
    
    // TODO: Abrir modal de detalle
    this.snackBar.open(
      `Ver detalle de ${rutaEspecifica.codigo} - Funcionalidad en desarrollo`,
      'Cerrar',
      { duration: 3000 }
    );
  }

  eliminarRutaEspecifica(rutaEspecifica: RutaEspecifica): void {
    if (confirm(`¿Está seguro de eliminar la ruta específica ${rutaEspecifica.codigo}?`)) {
      console.log('🗑️ Eliminar ruta específica:', rutaEspecifica);
      
      // TODO: Implementar eliminación
      this.snackBar.open(
        `Ruta específica ${rutaEspecifica.codigo} eliminada - Funcionalidad en desarrollo`,
        'Cerrar',
        { duration: 3000 }
      );
      
      // Simular eliminación
      const rutasActuales = this.rutasEspecificas();
      const rutasActualizadas = rutasActuales.filter(r => r.id !== rutaEspecifica.id);
      this.rutasEspecificas.set(rutasActualizadas);
    }
  }

  actualizarDatos(): void {
    this.cargarDatos();
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}