import { Component, OnInit, Inject, inject } from '@angular/core';
import { RutaService } from '../../services/ruta.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Vehiculo } from '../../models/vehiculo.model';
import { Ruta } from '../../models/ruta.model';

interface RutaEspecificaData {
  vehiculo?: Vehiculo;
  vehiculos?: Vehiculo[]; // Para modo bloque
  rutaGeneral: Ruta;
  rutaEspecifica?: any; // Para edición
  esEdicion?: boolean;
  modoBloque?: boolean;
}

@Component({
  selector: 'app-crear-ruta-especifica-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="modal-header">
      @if (data.modoBloque) {
        <h2>{{ data.esEdicion ? 'Editar' : 'Crear' }} Rutas Específicas (Modo Bloque)</h2>
        <h3>{{ data.vehiculos?.length || 0 }} vehículos seleccionados</h3>
      } @else {
        <h2>{{ data.esEdicion ? 'Editar' : 'Crear' }} Ruta Específica</h2>
        <h3>Vehículo: {{ data.vehiculo?.placa }}</h3>
      }
      <button mat-icon-button (click)="cancelar()" class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <form [formGroup]="rutaForm" class="ruta-form">
      <!-- Información de la ruta base -->
      <mat-card class="ruta-base-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>map</mat-icon>
            Ruta Base (General)
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="ruta-base-info">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Código:</span>
                <span class="value">{{ data.rutaGeneral.codigoRuta }}</span>
              </div>
              <div class="info-item">
                <span class="label">Trayecto:</span>
                <span class="value">{{ data.rutaGeneral.origen }} → {{ data.rutaGeneral.destino }}</span>
              </div>
              <div class="info-item">
                <span class="label">Distancia:</span>
                <span class="value">{{ data.rutaGeneral.distancia }} km</span>
              </div>
              <div class="info-item">
                @if (data.modoBloque) {
                  <span class="label">Vehículos:</span>
                  <span class="value">{{ data.vehiculos?.length || 0 }} vehículos seleccionados</span>
                } @else {
                  <span class="label">Vehículo:</span>
                  <span class="value">{{ data.vehiculo?.placa }} ({{ data.vehiculo?.marca }} {{ data.vehiculo?.modelo }})</span>
                }
              </div>
            </div>
            
            <!-- Lista de vehículos en modo bloque -->
            @if (data.modoBloque && data.vehiculos) {
              <div class="vehiculos-bloque-info">
                <h5>Vehículos que recibirán la ruta específica:</h5>
                <div class="vehiculos-chips">
                  @for (vehiculo of data.vehiculos; track vehiculo.id) {
                    <mat-chip>{{ vehiculo.placa }}</mat-chip>
                  }
                </div>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Datos básicos de la ruta específica -->
      <mat-card class="datos-basicos-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>settings</mat-icon>
            Datos de la Ruta Específica
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Código de Ruta Específica</mat-label>
              <input matInput formControlName="codigo" placeholder="Ej: PUN-JUL-ESP-001">
              <mat-hint>Código único para identificar esta ruta específica</mat-hint>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Nombre/Descripción</mat-label>
              <input matInput formControlName="descripcion" 
                     placeholder="Ej: Expreso Mañana, Servicio Nocturno">
              <mat-hint>Descripción que identifique el tipo de servicio</mat-hint>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="estado">
                <mat-option value="ACTIVA">Activa</mat-option>
                <mat-option value="INACTIVA">Inactiva</mat-option>
                <mat-option value="SUSPENDIDA">Suspendida</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tipo de Servicio</mat-label>
              <mat-select formControlName="tipoServicio">
                <mat-option value="REGULAR">Regular</mat-option>
                <mat-option value="EXPRESO">Expreso</mat-option>
                <mat-option value="DIRECTO">Directo</mat-option>
                <mat-option value="NOCTURNO">Nocturno</mat-option>
                <mat-option value="ESPECIAL">Especial</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Horarios específicos -->
      <mat-card class="horarios-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>schedule</mat-icon>
            Horarios Específicos
          </mat-card-title>
          <button type="button" mat-icon-button (click)="agregarHorario()" 
                  matTooltip="Agregar horario">
            <mat-icon>add</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <div formArrayName="horarios">
            @if (horariosFormArray.length === 0) {
              <div class="empty-horarios">
                <mat-icon>schedule</mat-icon>
                <p>No hay horarios definidos</p>
                <button type="button" mat-raised-button color="primary" (click)="agregarHorario()">
                  <mat-icon>add</mat-icon>
                  Agregar Primer Horario
                </button>
              </div>
            } @else {
              @for (horario of horariosFormArray.controls; track $index) {
                <div [formGroupName]="$index" class="horario-item">
                  <div class="horario-header">
                    <h4>Horario {{ $index + 1 }}</h4>
                    <button type="button" mat-icon-button color="warn" 
                            (click)="eliminarHorario($index)"
                            matTooltip="Eliminar horario">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                  
                  <div class="horario-form">
                    <mat-form-field appearance="outline">
                      <mat-label>Hora Salida</mat-label>
                      <input matInput type="time" formControlName="horaSalida">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Hora Llegada</mat-label>
                      <input matInput type="time" formControlName="horaLlegada">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Frecuencia (minutos)</mat-label>
                      <input matInput type="number" formControlName="frecuencia" 
                             placeholder="60" min="15" max="480">
                      <mat-hint>Intervalo entre salidas en minutos</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="dias-semana">
                    <h5>Días de Operación</h5>
                    <div class="dias-grid">
                      <mat-checkbox formControlName="lunes">Lunes</mat-checkbox>
                      <mat-checkbox formControlName="martes">Martes</mat-checkbox>
                      <mat-checkbox formControlName="miercoles">Miércoles</mat-checkbox>
                      <mat-checkbox formControlName="jueves">Jueves</mat-checkbox>
                      <mat-checkbox formControlName="viernes">Viernes</mat-checkbox>
                      <mat-checkbox formControlName="sabado">Sábado</mat-checkbox>
                      <mat-checkbox formControlName="domingo">Domingo</mat-checkbox>
                    </div>
                  </div>
                </div>
              }
            }
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Paradas adicionales -->
      <mat-card class="paradas-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>place</mat-icon>
            Paradas Adicionales
          </mat-card-title>
          <button type="button" mat-icon-button (click)="agregarParada()"
                  matTooltip="Agregar parada">
            <mat-icon>add</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <div formArrayName="paradasAdicionales">
            @if (paradasFormArray.length === 0) {
              <div class="empty-paradas">
                <mat-icon>place</mat-icon>
                <p>No hay paradas adicionales definidas</p>
                <small>Las paradas adicionales son opcionales</small>
              </div>
            } @else {
              @for (parada of paradasFormArray.controls; track $index) {
                <div [formGroupName]="$index" class="parada-item">
                  <div class="parada-header">
                    <h4>Parada {{ $index + 1 }}</h4>
                    <button type="button" mat-icon-button color="warn" 
                            (click)="eliminarParada($index)"
                            matTooltip="Eliminar parada">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                  
                  <div class="parada-form">
                    <mat-form-field appearance="outline">
                      <mat-label>Nombre de Parada</mat-label>
                      <input matInput formControlName="nombre" 
                             placeholder="Ej: Terminal Terrestre">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Ubicación</mat-label>
                      <input matInput formControlName="ubicacion" 
                             placeholder="Ej: Av. Principal 123">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Orden</mat-label>
                      <input matInput type="number" formControlName="orden" 
                             placeholder="1" min="1">
                      <mat-hint>Orden de la parada en el recorrido</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Tiempo de Parada (min)</mat-label>
                      <input matInput type="number" formControlName="tiempoParada" 
                             placeholder="5" min="1" max="60">
                    </mat-form-field>
                  </div>
                </div>
              }
            }
          </div>
        </mat-card-content>
      </mat-card>
    </form>

    <div class="modal-actions">
      <button mat-button (click)="cancelar()">
        <mat-icon>close</mat-icon>
        Cancelar
      </button>
      <button mat-raised-button color="primary" 
              [disabled]="rutaForm.invalid || guardando" 
              (click)="guardar()">
        <mat-icon>{{ guardando ? 'hourglass_empty' : 'save' }}</mat-icon>
        {{ guardando ? 'Guardando...' : (data.esEdicion ? 'Actualizar' : 'Crear') }} Ruta Específica
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
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
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

    .vehiculos-bloque-info {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .vehiculos-bloque-info h5 {
      margin: 0 0 12px 0;
      color: #666;
      font-weight: 600;
      font-size: 14px;
    }

    .vehiculos-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      max-height: 120px;
      overflow-y: auto;
    }

    .ruta-form {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .ruta-base-card,
    .datos-basicos-card,
    .horarios-card,
    .paradas-card {
      margin-bottom: 24px;
    }

    .ruta-base-info {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
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

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .horario-item,
    .parada-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      background: #fafafa;
    }

    .horario-header,
    .parada-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .horario-header h4,
    .parada-header h4 {
      margin: 0;
      color: #1976d2;
      font-weight: 600;
    }

    .horario-form,
    .parada-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .dias-semana {
      margin-top: 16px;
    }

    .dias-semana h5 {
      margin: 0 0 12px 0;
      color: #666;
      font-weight: 600;
      font-size: 14px;
    }

    .dias-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }

    .empty-horarios,
    .empty-paradas {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      text-align: center;
      color: #666;
    }

    .empty-horarios mat-icon,
    .empty-paradas mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #ccc;
    }

    .empty-horarios p,
    .empty-paradas p {
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    .empty-paradas small {
      color: #999;
      margin-bottom: 16px;
    }

    .modal-actions {
      display: flex;
      justify-content: space-between;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      background: #fafafa;
    }

    @media (max-width: 768px) {
      .ruta-form {
        padding: 16px;
      }

      .info-grid,
      .form-grid {
        grid-template-columns: 1fr;
      }

      .horario-form,
      .parada-form {
        grid-template-columns: 1fr;
      }

      .dias-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class CrearRutaEspecificaModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  rutaForm!: FormGroup;
  guardando = false;

  constructor(
    public dialogRef: MatDialogRef<CrearRutaEspecificaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RutaEspecificaData,
    private rutaService: RutaService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  inicializarFormulario(): void {
    this.rutaForm = this.fb.group({
      codigo: [this.generarCodigoAutomatico(), [Validators.required]],
      descripcion: ['', [Validators.required]],
      estado: ['ACTIVA', [Validators.required]],
      tipoServicio: ['REGULAR', [Validators.required]],
      horarios: this.fb.array([]),
      paradasAdicionales: this.fb.array([])
    });

    // Si es edición, cargar datos existentes
    if (this.data.esEdicion && this.data.rutaEspecifica) {
      this.cargarDatosEdicion();
    } else {
      // Agregar un horario por defecto
      this.agregarHorario();
    }
  }

  generarCodigoAutomatico(): string {
    const rutaBase = this.data.rutaGeneral.codigoRuta;
    const timestamp = Date.now().toString().slice(-4);
    return `${rutaBase}-ESP-${timestamp}`;
  }

  cargarDatosEdicion(): void {
    const ruta = this.data.rutaEspecifica;
    
    this.rutaForm.patchValue({
      codigo: ruta.codigo,
      descripcion: ruta.descripcion,
      estado: ruta.estado,
      tipoServicio: ruta.tipoServicio || 'REGULAR'
    });

    // Cargar horarios
    if (ruta.horarios && ruta.horarios.length > 0) {
      ruta.horarios.forEach((horario: unknown) => {
        this.agregarHorario(horario);
      });
    }

    // Cargar paradas
    if (ruta.paradasAdicionales && ruta.paradasAdicionales.length > 0) {
      ruta.paradasAdicionales.forEach((parada: unknown) => {
        this.agregarParada(parada);
      });
    }
  }

  get horariosFormArray(): FormArray {
    return this.rutaForm.get('horarios') as FormArray;
  }

  get paradasFormArray(): FormArray {
    return this.rutaForm.get('paradasAdicionales') as FormArray;
  }

  agregarHorario(horarioData?: unknown): void {
    const horarioForm = this.fb.group({
      horaSalida: [(horarioData as any)?.horaSalida || '', [Validators.required]],
      horaLlegada: [(horarioData as any)?.horaLlegada || '', [Validators.required]],
      frecuencia: [(horarioData as any)?.frecuencia || 60, [Validators.required, Validators.min(15)]],
      lunes: [(horarioData as any)?.lunes || true],
      martes: [(horarioData as any)?.martes || true],
      miercoles: [(horarioData as any)?.miercoles || true],
      jueves: [(horarioData as any)?.jueves || true],
      viernes: [(horarioData as any)?.viernes || true],
      sabado: [(horarioData as any)?.sabado || false],
      domingo: [(horarioData as any)?.domingo || false]
    });

    this.horariosFormArray.push(horarioForm);
  }

  eliminarHorario(index: number): void {
    if (this.horariosFormArray.length > 1) {
      this.horariosFormArray.removeAt(index);
    } else {
      this.snackBar.open('Debe mantener al menos un horario', 'Cerrar', { duration: 3000 });
    }
  }

  agregarParada(paradaData?: unknown): void {
    const paradaForm = this.fb.group({
      nombre: [(paradaData as any)?.nombre || '', [Validators.required]],
      ubicacion: [(paradaData as any)?.ubicacion || ''],
      orden: [(paradaData as any)?.orden || this.paradasFormArray.length + 1, [Validators.required, Validators.min(1)]],
      tiempoParada: [(paradaData as any)?.tiempoParada || 5, [Validators.required, Validators.min(1)]]
    });

    this.paradasFormArray.push(paradaForm);
  }

  eliminarParada(index: number): void {
    this.paradasFormArray.removeAt(index);
  }

  async guardar(): Promise<void> {
    if (this.rutaForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.guardando = true;

    try {
      const formData = this.rutaForm.value;
      
      if (this.data.modoBloque && this.data.vehiculos) {
        // Modo bloque: crear rutas específicas para múltiples vehículos
        const rutasCreadas = [];
        const errores = [];
        
        for (let i = 0; i < this.data.vehiculos.length; i++) {
          const vehiculo = this.data.vehiculos[i];
          
          try {
            // Generar código único para cada vehículo
            const codigoUnico = `${this.data.rutaGeneral.codigoRuta}-ESP-${vehiculo.placa}-${Date.now().toString().slice(-4)}`;
            
            const rutaEspecifica = {
              ...formData,
              codigo: codigoUnico,
              rutaGeneralId: this.data.rutaGeneral.id,
              vehiculoId: vehiculo.id,
              resolucionId: vehiculo.resolucionId || '', // Usar resolución del vehículo
              origen: this.data.rutaGeneral.origen,
              destino: this.data.rutaGeneral.destino,
              distancia: this.data.rutaGeneral.distancia,
              tipoRuta: 'ESPECIFICA',
              fechaCreacion: new Date()
            };
            
            // TODO: Implementar llamada al servicio para cada vehículo
            // const rutaCreada = await this.rutaEspecificaService.crearRutaEspecifica(rutaEspecifica);
            
            rutasCreadas.push(rutaEspecifica);
            } catch (error) {
            console.error(`❌ Error creando ruta para vehículo ${vehiculo.placa}:`, error);
            errores.push(`Error en vehículo ${vehiculo.placa}: ${error}`);
          }
        }
        
        // Simular guardado
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (errores.length > 0) {
          this.snackBar.open(
            `Se crearon ${rutasCreadas.length} rutas con ${errores.length} errores`,
            'Cerrar',
            { duration: 5000 }
          );
        } else {
          this.snackBar.open(
            `${rutasCreadas.length} rutas específicas creadas exitosamente`,
            'Cerrar',
            { duration: 3000 }
          );
        }
        
        this.dialogRef.close({
          modoBloque: true,
          rutasCreadas: rutasCreadas,
          errores: errores,
          count: rutasCreadas.length
        });
        
      } else {
        // Modo individual: crear una sola ruta específica
        const vehiculo = this.data.vehiculo;
        if (!vehiculo) {
          throw new Error('No se encontró información del vehículo');
        }
        
        const rutaEspecifica = {
          ...formData,
          rutaGeneralId: this.data.rutaGeneral.id,
          vehiculoId: vehiculo.id,
          resolucionId: vehiculo.resolucionId || '', // Usar resolución del vehículo
          origen: this.data.rutaGeneral.origen,
          destino: this.data.rutaGeneral.destino,
          distancia: this.data.rutaGeneral.distancia,
          tipoRuta: 'ESPECIFICA',
          fechaCreacion: new Date()
        };

        // Implementar llamada al servicio de rutas
        try {
          const rutaCreada = await this.rutaService.createRuta(rutaEspecifica).toPromise();
          
          this.snackBar.open(
            `Ruta específica ${this.data.esEdicion ? 'actualizada' : 'creada'} exitosamente`,
            'Cerrar',
            { duration: 3000 }
          );

          this.dialogRef.close(rutaCreada);
        } catch (serviceError) {
          throw serviceError; // Re-lanzar para que sea manejado por el catch exterior
        }
      }
      
    } catch (error) {
      console.error('Error guardando ruta específica::', error);
      this.snackBar.open('Error al guardar la ruta específica', 'Cerrar', { duration: 3000 });
    } finally {
      this.guardando = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}