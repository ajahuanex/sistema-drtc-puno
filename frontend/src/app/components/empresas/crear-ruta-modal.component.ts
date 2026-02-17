import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ruta, TipoRuta, TipoServicio, RutaCreate } from '../../models/ruta.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Localidad } from '../../models/localidad.model';
import { RutaService } from '../../services/ruta.service';
import { ResolucionService } from '../../services/resolucion.service';
import { LocalidadService } from '../../services/localidad.service';

export interface CrearRutaModalData {
  empresa: Empresa;
  resolucion?: Resolucion;
}

@Component({
  selector: 'app-crear-ruta-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="modal-container">
      <mat-card class="modal-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>add_road</mat-icon>
            CREAR NUEVA RUTA
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Información de la empresa -->
          <div class="empresa-info">
            <h3>EMPRESA SELECCIONADA</h3>
            <p><strong>RUC:</strong> {{ empresa.ruc }}</p>
            <p><strong>RAZÓN SOCIAL:</strong> {{ empresa.razonSocial?.principal || 'No disponible' }}</p>
          </div>

          <!-- Selección de resolución -->
          @if (!resolucionSeleccionada) {
            <div class="resolucion-selection">
              <h3>SELECCIONAR RESOLUCIÓN</h3>
              <div class="info-box">
                <mat-icon>info</mat-icon>
                <div>
                  <strong>Reglas de asignación:</strong>
                  <ul>
                    <li>Las rutas solo se pueden crear en resoluciones <strong>PRIMIGENIAS</strong> (PADRE)</li>
                    <li>Las rutas <strong>GENERALES</strong> se asignan a toda la resolución</li>
                    <li>Las rutas <strong>ESPECÍFICAS</strong> se asignan a vehículos individuales</li>
                  </ul>
                </div>
              </div>
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>RESOLUCIÓN *</mat-label>
                <mat-select (selectionChange)="onResolucionSelected($event)" required>
                  @for (resolucion of resoluciones; track resolucion.id) {
                    <mat-option [value]="resolucion">
                      {{ resolucion.nroResolucion }} - {{ resolucion.tipoTramite }}
                      @if (resolucion.tipoResolucion === 'PADRE') {
                        <span class="badge-primigenia">PRIMIGENIA</span>
                      }
                    </mat-option>
                  }
                </mat-select>
                @if (resoluciones.length === 0) {
                  <mat-hint>No hay resoluciones primigenias disponibles para esta empresa</mat-hint>
                }
                <mat-error>Debe seleccionar una resolución primigenia</mat-error>
              </mat-form-field>
            </div>
          }

          <!-- Formulario de ruta -->
          @if (resolucionSeleccionada) {
            <div class="ruta-form">
              <h3>DATOS DE LA RUTA</h3>
              
              <form [formGroup]="rutaForm" (ngSubmit)="onSubmit()">
                <div class="form-grid">
                  <!-- Tipo de asignación de ruta -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>TIPO DE ASIGNACIÓN *</mat-label>
                    <mat-select formControlName="tipoAsignacion" required (selectionChange)="onTipoAsignacionChange($event)">
                      <mat-option value="GENERAL">RUTA GENERAL (Asignada a la resolución primigenia)</mat-option>
                      <mat-option value="ESPECIFICA">RUTA ESPECÍFICA (Asignada a vehículos específicos)</mat-option>
                    </mat-select>
                    <mat-hint>
                      @if (rutaForm.get('tipoAsignacion')?.value === 'GENERAL') {
                        Las rutas generales se asignan a toda la resolución primigenia
                      } @else if (rutaForm.get('tipoAsignacion')?.value === 'ESPECIFICA') {
                        Las rutas específicas se asignan a vehículos individuales
                      }
                    </mat-hint>
                    <mat-error *ngIf="rutaForm.get('tipoAsignacion')?.hasError('required')">
                      Debe seleccionar el tipo de asignación
                    </mat-error>
                  </mat-form-field>

                  <!-- Código de ruta -->
                  <mat-form-field appearance="outline">
                    <mat-label>CÓDIGO DE RUTA *</mat-label>
                    <input matInput 
                           formControlName="codigoRuta" 
                           placeholder="01, 02, 03..."
                           maxlength="2"
                           required>
                    <mat-hint>Código único de 2 dígitos</mat-hint>
                    <mat-error *ngIf="rutaForm.get('codigoRuta')?.hasError('required')">
                      El código es obligatorio
                    </mat-error>
                  </mat-form-field>

                  <!-- Nombre -->
                  <mat-form-field appearance="outline">
                    <mat-label>NOMBRE DE LA RUTA *</mat-label>
                    <input matInput 
                           formControlName="nombre" 
                           placeholder="Ej: Puno - Juliaca"
                           required>
                    <mat-error *ngIf="rutaForm.get('nombre')?.hasError('required')">
                      El nombre es obligatorio
                    </mat-error>
                  </mat-form-field>

                  <!-- Origen -->
                  <mat-form-field appearance="outline">
                    <mat-label>ORIGEN *</mat-label>
                    <mat-select formControlName="origenId" required>
                      @for (localidad of localidades; track localidad.id) {
                        <mat-option [value]="localidad.id">
                          {{ localidad.nombre }} - {{ localidad.provincia }}
                        </mat-option>
                      }
                    </mat-select>
                    <mat-error *ngIf="rutaForm.get('origenId')?.hasError('required')">
                      El origen es obligatorio
                    </mat-error>
                  </mat-form-field>

                  <!-- Destino -->
                  <mat-form-field appearance="outline">
                    <mat-label>DESTINO *</mat-label>
                    <mat-select formControlName="destinoId" required>
                      @for (localidad of localidades; track localidad.id) {
                        <mat-option [value]="localidad.id">
                          {{ localidad.nombre }} - {{ localidad.provincia }}
                        </mat-option>
                      }
                    </mat-select>
                    <mat-error *ngIf="rutaForm.get('destinoId')?.hasError('required')">
                      El destino es obligatorio
                    </mat-error>
                  </mat-form-field>

                  <!-- Frecuencias -->
                  <mat-form-field appearance="outline">
                    <mat-label>FRECUENCIAS *</mat-label>
                    <input matInput 
                           formControlName="frecuencias" 
                           placeholder="Ej: Diaria, Semanal"
                           required>
                    <mat-error *ngIf="rutaForm.get('frecuencias')?.hasError('required')">
                      Las frecuencias son obligatorias
                    </mat-error>
                  </mat-form-field>

                  <!-- Tipo de ruta -->
                  <mat-form-field appearance="outline">
                    <mat-label>TIPO DE RUTA</mat-label>
                    <mat-select formControlName="tipoRuta">
                      <mat-option value="INTERPROVINCIAL">INTERPROVINCIAL</mat-option>
                      <mat-option value="INTERURBANA">INTERURBANA</mat-option>
                      <mat-option value="URBANA">URBANA</mat-option>
                      <mat-option value="NACIONAL">NACIONAL</mat-option>
                      <mat-option value="INTERNACIONAL">INTERNACIONAL</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <!-- Tipo de servicio -->
                  <mat-form-field appearance="outline">
                    <mat-label>TIPO DE SERVICIO</mat-label>
                    <mat-select formControlName="tipoServicio">
                      <mat-option value="PASAJEROS">PASAJEROS</mat-option>
                      <mat-option value="CARGA">CARGA</mat-option>
                      <mat-option value="MIXTO">MIXTO</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <!-- Distancia -->
                  <mat-form-field appearance="outline">
                    <mat-label>DISTANCIA (KM)</mat-label>
                    <input matInput 
                           formControlName="distancia" 
                           type="number"
                           placeholder="0"
                           min="0">
                  </mat-form-field>

                  <!-- Observaciones -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>OBSERVACIONES</mat-label>
                    <textarea matInput 
                              formControlName="observaciones"
                              placeholder="Observaciones adicionales"
                              rows="3"></textarea>
                  </mat-form-field>
                </div>
              </form>
            </div>
          }
        </mat-card-content>

        <mat-dialog-actions align="end">
          <button mat-button mat-dialog-close>CANCELAR</button>
          @if (resolucionSeleccionada) {
            <button mat-raised-button 
                    color="primary" 
                    [disabled]="!rutaForm.valid || isSubmitting"
                    (click)="onSubmit()">
              @if (isSubmitting) {
                <mat-spinner diameter="20"></mat-spinner>
                GUARDANDO...
              } @else {
                <mat-icon>save</mat-icon>
                CREAR RUTA
              }
            </button>
          }
        </mat-dialog-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .modal-container {
      padding: 20px;
      max-width: 700px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-card {
      width: 100%;
    }

    .modal-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2c3e50;
    }

    .empresa-info {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .empresa-info h3 {
      margin: 0 0 12px 0;
      color: #495057;
      font-size: 14px;
      font-weight: 600;
    }

    .empresa-info p {
      margin: 4px 0;
      font-size: 14px;
    }

    .resolucion-selection {
      margin-bottom: 20px;
    }

    .resolucion-selection h3 {
      margin: 0 0 16px 0;
      color: #495057;
      font-size: 16px;
      font-weight: 600;
    }

    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .info-box mat-icon {
      color: #2196f3;
      margin-top: 2px;
    }

    .info-box ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }

    .info-box li {
      margin-bottom: 4px;
      font-size: 14px;
    }

    .badge-primigenia {
      background: #4caf50;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      margin-left: 8px;
    }

    .ruta-form h3 {
      margin: 0 0 20px 0;
      color: #495057;
      font-size: 16px;
      font-weight: 600;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-field {
      width: 100%;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      
      .modal-container {
        padding: 10px;
        max-width: 100%;
      }
    }

    mat-spinner {
      margin-right: 8px;
    }
  `]
})
export class CrearRutaModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CrearRutaModalComponent>);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private rutaService = inject(RutaService);
  private resolucionService = inject(ResolucionService);
  private localidadService = inject(LocalidadService);
  
  data = inject<CrearRutaModalData>(MAT_DIALOG_DATA);

  empresa!: Empresa;
  resoluciones: Resolucion[] = [];
  localidades: Localidad[] = [];
  resolucionSeleccionada: Resolucion | null = null;
  
  rutaForm!: FormGroup;
  isSubmitting = false;

  constructor() {
    this.empresa = this.data.empresa;
    
    this.rutaForm = this.fb.group({
      tipoAsignacion: ['', [Validators.required]],
      codigoRuta: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      origenId: ['', [Validators.required]],
      destinoId: ['', [Validators.required]],
      frecuencias: ['', [Validators.required]],
      tipoRuta: ['INTERPROVINCIAL'],
      tipoServicio: ['PASAJEROS'],
      distancia: [0, [Validators.min(0)]],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.cargarResoluciones();
    this.cargarLocalidades();
    
    // Si ya hay una resolución preseleccionada
    if (this.data.resolucion) {
      this.resolucionSeleccionada = this.data.resolucion;
      this.generarCodigoAutomatico();
    }
  }

  private cargarResoluciones(): void {
    this.resolucionService.getResoluciones().subscribe((resoluciones: Resolucion[]) => {
      // Filtrar solo resoluciones de la empresa y que sean PRIMIGENIAS (PADRE)
      // Las rutas generales solo se asignan a resoluciones primigenias, no a las hijas
      this.resoluciones = resoluciones.filter(r => 
        r.empresaId === this.empresa.id && 
        r.tipoResolucion === 'PADRE' &&
        (r.tipoTramite === 'PRIMIGENIA' || r.tipoTramite === 'RENOVACION') &&
        r.estaActivo
      );
    });
  }

  private async cargarLocalidades(): Promise<void> {
    try {
      const todasLocalidades = await this.localidadService.obtenerLocalidades();
      this.localidades = todasLocalidades.filter(l => l.esta_activa);
    } catch (error) {
      console.error('Error cargando localidades:', error);
      this.localidades = [];
    }
  }

  onTipoAsignacionChange(event: any): void {
    const tipoAsignacion = event.value;
    
    if (tipoAsignacion === 'GENERAL') {
      // Para rutas generales, generar código automático
      this.generarCodigoAutomatico();
      // Actualizar observaciones con información del tipo
      const observacionesActuales = this.rutaForm.get('observaciones')?.value || '';
      const nuevaObservacion = 'RUTA GENERAL - Asignada a resolución primigenia. ' + observacionesActuales;
      this.rutaForm.patchValue({ 
        observaciones: nuevaObservacion.trim()
      });
    } else if (tipoAsignacion === 'ESPECIFICA') {
      // Para rutas específicas, limpiar código para ingreso manual
      this.rutaForm.patchValue({ codigoRuta: '' });
      // Actualizar observaciones con información del tipo
      const observacionesActuales = this.rutaForm.get('observaciones')?.value || '';
      const nuevaObservacion = 'RUTA ESPECÍFICA - Debe asignarse a vehículos específicos. ' + observacionesActuales;
      this.rutaForm.patchValue({ 
        observaciones: nuevaObservacion.trim()
      });
    }
  }

  onResolucionSelected(event: any): void {
    this.resolucionSeleccionada = event.value;
    this.generarCodigoAutomatico();
  }

  private generarCodigoAutomatico(): void {
    if (this.resolucionSeleccionada) {
      // Usar el servicio para obtener el siguiente código disponible desde la API
      this.rutaService.getSiguienteCodigoDisponible(this.resolucionSeleccionada.id)
        .subscribe({
          next: (codigo: string) => {
            // console.log removed for production
            this.rutaForm.patchValue({ codigoRuta: codigo });
          },
          error: (error: any) => {
            console.error('❌ Error generando código automático::', error);
            // Fallback: usar código simple
            this.rutaForm.patchValue({ codigoRuta: '01' });
          }
        });
    }
  }

  onSubmit(): void {
    if (this.rutaForm.valid && this.resolucionSeleccionada) {
      // Validaciones adicionales según las reglas de negocio
      const tipoAsignacion = this.rutaForm.get('tipoAsignacion')?.value;
      
      // Validar que la resolución sea primigenia (PADRE)
      if (this.resolucionSeleccionada.tipoResolucion !== 'PADRE') {
        this.snackBar.open('Error: Solo se pueden crear rutas en resoluciones primigenias (PADRE)', 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      // Validar que la resolución sea PRIMIGENIA o RENOVACION
      if (!['PRIMIGENIA', 'RENOVACION'].includes(this.resolucionSeleccionada.tipoTramite)) {
        this.snackBar.open('Error: Solo se pueden crear rutas en resoluciones PRIMIGENIAS o de RENOVACIÓN', 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      this.isSubmitting = true;
      
      const formValue = this.rutaForm.value;
      
      // Agregar información del tipo de asignación a las observaciones
      let observacionesFinales = formValue.observaciones || '';
      if (tipoAsignacion === 'GENERAL') {
        observacionesFinales = `[RUTA GENERAL] ${observacionesFinales}`.trim();
      } else if (tipoAsignacion === 'ESPECIFICA') {
        observacionesFinales = `[RUTA ESPECÍFICA] ${observacionesFinales}`.trim();
      }
      
      const nuevaRuta: RutaCreate = {
        codigoRuta: formValue.codigoRuta,
        nombre: formValue.nombre,
        origen: {
          id: formValue.origenId,
          nombre: formValue.origenNombre || 'ORIGEN'
        },
        destino: {
          id: formValue.destinoId,
          nombre: formValue.destinoNombre || 'DESTINO'
        },
        itinerario: [],
        resolucion: {
          id: this.resolucionSeleccionada?.id || '',
          nroResolucion: this.resolucionSeleccionada?.nroResolucion || '',
          tipoResolucion: this.resolucionSeleccionada?.tipoResolucion || 'PADRE',
          estado: this.resolucionSeleccionada?.estado || 'VIGENTE'
        },
        frecuencia: {
          tipo: 'DIARIO',
          cantidad: 1,
          dias: [],
          descripcion: formValue.frecuencias || '01 DIARIA'
        },
        tipoRuta: formValue.tipoRuta as TipoRuta,
        tipoServicio: formValue.tipoServicio as TipoServicio,
        distancia: formValue.distancia || 0,
        observaciones: observacionesFinales,
        empresa: { id: this.empresa.id, ruc: this.empresa.ruc, razonSocial: this.empresa.razonSocial.principal }
      };

      // console.log removed for production
      // console.log removed for production
      // console.log removed for production

      this.rutaService.createRuta(nuevaRuta).subscribe({
        next: (rutaGuardada: Ruta) => {
          // console.log removed for production
          const mensaje = tipoAsignacion === 'GENERAL' 
            ? 'Ruta general creada exitosamente y asignada a la resolución primigenia'
            : 'Ruta específica creada exitosamente. Recuerde asignarla a vehículos específicos';
          
          this.snackBar.open(mensaje, 'Cerrar', { 
            duration: 4000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(rutaGuardada);
        },
        error: (error: any) => {
          console.error('❌ Error al crear la ruta::', error);
          this.snackBar.open('Error al crear la ruta: ' + (error.message || 'Error desconocido'), 'Cerrar', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isSubmitting = false;
        }
      });
    } else {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      Object.keys(this.rutaForm.controls).forEach(key => {
        this.rutaForm.get(key)?.markAsTouched();
      });
    }
  }
}