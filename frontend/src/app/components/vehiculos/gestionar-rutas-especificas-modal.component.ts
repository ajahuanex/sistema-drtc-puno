import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ResolucionService } from '../../services/resolucion.service';
import { RutaService } from '../../services/ruta.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Ruta } from '../../models/ruta.model';
import { Resolucion } from '../../models/resolucion.model';
import { Empresa } from '../../models/empresa.model';

export interface VehiculoModalData {
  vehiculo?: Vehiculo; // Para modo individual
  vehiculos?: Vehiculo[]; // Para modo bloque
  modoBloque?: boolean; // Indica si es modo bloque
  empresas?: Empresa[];
}

interface RutaSeleccionable {
  ruta: Ruta;
  seleccionada: boolean;
  yaAsignada: boolean;
}

@Component({
  selector: 'app-gestionar-rutas-especificas-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatCardModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2>{{ data.modoBloque ? 'Asignar Rutas a Múltiples Vehículos' : 'Asignar Rutas al Vehículo' }}</h2>
        <button mat-icon-button (click)="cerrar()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <div class="vehiculo-info">
          @if (data.modoBloque) {
            <p><strong>Vehículos seleccionados:</strong> {{ data.vehiculos?.length }} vehículo(s)</p>
            <div class="vehiculos-list">
              @for (vehiculo of data.vehiculos?.slice(0, 5); track vehiculo.id) {
                <span class="vehiculo-chip">{{ vehiculo.placa }}</span>
              }
              @if ((data.vehiculos?.length || 0) > 5) {
                <span class="vehiculo-chip more">+{{ (data.vehiculos?.length || 0) - 5 }} más</span>
              }
            </div>
          } @else {
            <p><strong>Vehículo:</strong> {{ data.vehiculo?.placa }}</p>
          }
          @if (resolucionAsociada) {
            <p><strong>Resolución:</strong> {{ resolucionAsociada.nroResolucion }}</p>
          }
        </div>

        @if (cargando) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Cargando rutas disponibles...</p>
          </div>
        } @else if (rutasDisponibles.length === 0) {
          <div class="empty-state">
            <mat-icon>route</mat-icon>
            <p>No hay rutas disponibles</p>
            <small>El vehículo debe estar asociado a una resolución con rutas autorizadas</small>
          </div>
        } @else {
          <div class="rutas-section">
            <h3>Rutas Autorizadas ({{ rutasDisponibles.length }})</h3>
            <p class="subtitle">Selecciona las rutas que este vehículo puede operar</p>
            
            <!-- Encabezado de columnas -->
            <div class="rutas-header">
              <div class="header-checkbox"></div>
              <div class="header-content">
                <span class="header-codigo">Código</span>
                <span class="header-trayecto">Ruta</span>
                <span class="header-descripcion">Itinerario</span>
                <span class="header-frecuencia">Frecuencia</span>
              </div>
            </div>
            
            <div class="rutas-list">
              @for (rutaItem of rutasDisponibles; track rutaItem.ruta.id) {
                <div class="ruta-item" [class.selected]="rutaItem.seleccionada" (click)="toggleRuta(rutaItem)">
                  <div class="ruta-checkbox">
                    <mat-checkbox 
                      [(ngModel)]="rutaItem.seleccionada"
                      color="primary"
                      (click)="$event.stopPropagation()">
                    </mat-checkbox>
                  </div>
                  
                  <div class="ruta-content">
                    <span class="codigo">{{ rutaItem.ruta.codigoRuta }}</span>
                    <span class="trayecto">
                      @if (rutaItem.ruta.origen && rutaItem.ruta.destino && rutaItem.ruta.origen?.nombre !== 'Sin origen') {
                        {{ rutaItem.ruta.origen }} → {{ rutaItem.ruta.destino }}
                      } @else {
                        {{ rutaItem.ruta.nombre || 'Ruta sin nombre' }}
                      }
                    </span>
                    <span class="descripcion">{{ rutaItem.ruta.descripcion || 'Sin itinerario' }}</span>
                    <span class="frecuencia">{{ rutaItem.ruta.frecuencias || 'Sin frecuencia' }}</span>
                  </div>
                </div>
              }
            </div>

            <div class="quick-actions">
              <button mat-button (click)="seleccionarTodas()">
                <mat-icon>select_all</mat-icon>
                Seleccionar Todas
              </button>
              <button mat-button (click)="deseleccionarTodas()">
                <mat-icon>deselect</mat-icon>
                Deseleccionar Todas
              </button>
            </div>
          </div>
        }
      </div>

      <div class="modal-actions">
        <button mat-button (click)="cerrar()">Cancelar</button>
        <button mat-raised-button color="primary" 
                (click)="asignarRutas()"
                [disabled]="cargando">
          <mat-icon>save</mat-icon>
          Guardar Rutas ({{ contarSeleccionadas() }})
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      min-width: 700px;
      width: auto;
      max-width: 90vw;
      max-height: 80vh;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      background: #f5f5f5;
    }
    .modal-content {
      padding: 16px;
      max-height: 60vh;
      overflow-y: auto;
    }
    .vehiculo-info {
      background: #e3f2fd;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .vehiculo-info p {
      margin: 4px 0;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      gap: 16px;
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
    .rutas-section h3 {
      margin: 0 0 8px 0;
      color: #333;
    }
    .subtitle {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 14px;
    }
    .rutas-header {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      background: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 4px;
      font-weight: 600;
      font-size: 12px;
      color: #666;
    }
    .header-checkbox {
      width: 50px;
      margin-right: 12px;
    }
    .header-content {
      flex: 1;
      display: grid;
      grid-template-columns: 60px 200px 1fr 100px;
      gap: 12px;
    }
    .header-codigo {
      text-align: center;
    }
    .header-frecuencia {
      text-align: right;
    }
    .rutas-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 16px;
    }
    .ruta-item {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background: white;
      transition: all 0.2s ease;
      cursor: pointer;
      min-height: 40px;
    }
    .ruta-item:hover {
      background: #f8f9fa;
      border-color: #1976d2;
    }
    .ruta-item.selected {
      border-color: #1976d2;
      background: #e3f2fd;
    }
    .ruta-checkbox {
      margin-right: 12px;
    }
    .ruta-content {
      flex: 1;
      display: grid;
      grid-template-columns: 60px 200px 1fr 100px;
      align-items: center;
      gap: 12px;
      font-size: 13px;
    }
    .codigo {
      font-weight: 600;
      color: #1976d2;
      text-align: center;
    }
    .trayecto {
      font-weight: 500;
      color: #333;
    }
    .descripcion {
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .frecuencia {
      color: #666;
      text-align: right;
      font-size: 12px;
    }
    .quick-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .modal-actions {
      display: flex;
      justify-content: space-between;
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      background: #fafafa;
    }
    .vehiculos-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 8px;
    }
    .vehiculo-chip {
      background: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }
    .vehiculo-chip.more {
      background: #f5f5f5;
      color: #666;
    }
  `]
})
export class GestionarRutasEspecificasModalComponent implements OnInit {
  cargando = false;
  resolucionAsociada: Resolucion | null = null;
  rutasDisponibles: RutaSeleccionable[] = [];

  constructor(
    private dialogRef: MatDialogRef<GestionarRutasEspecificasModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VehiculoModalData,
    private resolucionService: ResolucionService,
    private rutaService: RutaService,
    private vehiculoService: VehiculoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;
    
    try {
      // Obtener vehículos a procesar
      const vehiculos = this.data.modoBloque ? this.data.vehiculos! : [this.data.vehiculo!];
      
      // 1. Buscar resolución asociada (usar la del primer vehículo para modo bloque)
      const resoluciones = await this.resolucionService.getResoluciones().toPromise();
      const vehiculoPrincipal = vehiculos[0];
      
      this.resolucionAsociada = resoluciones?.find((r: any) => 
        r.vehiculosHabilitadosIds?.includes(vehiculoPrincipal.id)
      ) || null;

      if (!this.resolucionAsociada) {
        const mensaje = this.data.modoBloque 
          ? '⚠️ Los vehículos deben tener resolución asociada'
          : '⚠️ Vehículo sin resolución asociada';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        this.cargando = false;
        return;
      }

      // 2. Obtener rutas autorizadas de la resolución
      const todasRutas = await this.rutaService.getRutas().toPromise();
      const rutasAutorizadas = todasRutas?.filter((ruta: any) => 
        this.resolucionAsociada!.rutasAutorizadasIds?.includes(ruta.id)
      ) || [];

      // 3. Para modo bloque, obtener rutas comunes a todos los vehículos
      let rutasYaAsignadas: string[] = [];
      
      if (this.data.modoBloque) {
        // En modo bloque, pre-seleccionar solo las rutas que TODOS los vehículos tienen
        const rutasComunes = rutasAutorizadas.filter((ruta: any) => 
          vehiculos.every((vehiculo: any) => 
            vehiculo.rutasAsignadasIds?.includes(ruta.id)
          )
        );
        rutasYaAsignadas = rutasComunes.map((r: any) => r.id);
      } else {
        // Modo individual
        rutasYaAsignadas = vehiculoPrincipal.rutasAsignadasIds || [];
      }

      // 4. Preparar lista de rutas seleccionables
      this.rutasDisponibles = rutasAutorizadas.map((ruta: any) => ({
        ruta,
        seleccionada: rutasYaAsignadas.includes(ruta.id),
        yaAsignada: false
      }));

      const mensaje = this.data.modoBloque
        ? `✅ ${rutasAutorizadas.length} ruta(s) disponible(s) para ${vehiculos.length} vehículo(s)`
        : `✅ ${rutasAutorizadas.length} ruta(s) disponible(s)`;
      
      this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      this.snackBar.open('Error cargando datos', 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando = false;
    }
  }

  contarSeleccionadas(): number {
    return this.rutasDisponibles.filter((r: any) => r.seleccionada).length;
  }

  seleccionarTodas(): void {
    this.rutasDisponibles.forEach((r: any) => {
      r.seleccionada = true;
    });
  }

  deseleccionarTodas(): void {
    this.rutasDisponibles.forEach((r: any) => r.seleccionada = false);
  }

  toggleRuta(rutaItem: RutaSeleccionable): void {
    rutaItem.seleccionada = !rutaItem.seleccionada;
  }

  async asignarRutas(): Promise<void> {
    // Obtener todas las rutas seleccionadas
    const rutasSeleccionadas = this.rutasDisponibles
      .filter((r: any) => r.seleccionada)
      .map((r: any) => r.ruta.id);

    this.cargando = true;

    try {
      if (this.data.modoBloque) {
        // Modo bloque: actualizar múltiples vehículos
        const vehiculos = this.data.vehiculos!;
        const promesasActualizacion = vehiculos.map((vehiculo: any) => 
          this.vehiculoService.updateVehiculo(vehiculo.id, {
            rutasAsignadasIds: rutasSeleccionadas
          }).toPromise()
        );

        await Promise.all(promesasActualizacion);

        this.snackBar.open(
          `✅ Rutas actualizadas para ${vehiculos.length} vehículo(s). ${rutasSeleccionadas.length} ruta(s) asignada(s)`, 
          'Cerrar', 
          { duration: 3000 }
        );
        
        this.dialogRef.close({ 
          vehiculos: vehiculos,
          rutasAsignadas: rutasSeleccionadas.length,
          modoBloque: true
        });

      } else {
        // Modo individual
        const vehiculo = this.data.vehiculo!;
        
        await this.vehiculoService.updateVehiculo(vehiculo.id, {
          rutasAsignadasIds: rutasSeleccionadas
        }).toPromise();

        const rutasAnteriores = vehiculo.rutasAsignadasIds.length || 0;
        const rutasNuevas = rutasSeleccionadas.length;
        
        let mensaje = '';
        if (rutasNuevas > rutasAnteriores) {
          mensaje = `✅ ${rutasNuevas - rutasAnteriores} ruta(s) agregada(s). Total: ${rutasNuevas}`;
        } else if (rutasNuevas < rutasAnteriores) {
          mensaje = `✅ ${rutasAnteriores - rutasNuevas} ruta(s) removida(s). Total: ${rutasNuevas}`;
        } else {
          mensaje = `✅ Rutas actualizadas. Total: ${rutasNuevas}`;
        }

        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.dialogRef.close({
          ...vehiculo,
          rutasAsignadasIds: rutasSeleccionadas
        });
      }

    } catch (error) {
      console.error('❌ Error actualizando rutas:', error);
      const mensajeError = this.data.modoBloque 
        ? 'Error al actualizar rutas de los vehículos'
        : 'Error al actualizar rutas';
      this.snackBar.open(mensajeError, 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando = false;
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}