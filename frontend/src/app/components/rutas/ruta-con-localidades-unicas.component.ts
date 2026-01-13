import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { RutaProcessorService, RutaConLocalidadesData, ResultadoProcesamientoRuta } from '../../services/ruta-processor.service';
import { LocalidadManagerService } from '../../services/localidad-manager.service';
import { TipoRuta, TipoServicio } from '../../models/ruta.model';

@Component({
  selector: 'app-ruta-con-localidades-unicas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="ruta-localidades-container">
      <div class="page-header">
        <div>
          <h1>Crear Ruta con Localidades Únicas</h1>
          <p>Sistema inteligente que asegura la unicidad de localidades</p>
        </div>
      </div>

      <mat-stepper #stepper [linear]="true" class="stepper-container">
        <!-- Paso 1: Información de la Ruta -->
        <mat-step [stepControl]="rutaForm" label="Información de la Ruta">
          <form [formGroup]="rutaForm">
            <mat-card class="step-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon color="primary">route</mat-icon>
                  Datos Básicos de la Ruta
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Código de Ruta</mat-label>
                    <input matInput formControlName="codigoRuta" placeholder="Ej: 001">
                    <mat-error *ngIf="rutaForm.get('codigoRuta')?.hasError('required')">
                      El código de ruta es requerido
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Nombre de la Ruta</mat-label>
                    <input matInput formControlName="nombre" placeholder="Ej: Puno - Juliaca">
                    <mat-error *ngIf="rutaForm.get('nombre')?.hasError('required')">
                      El nombre de la ruta es requerido
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Tipo de Ruta</mat-label>
                    <mat-select formControlName="tipoRuta">
                      <mat-option value="URBANA">Urbana</mat-option>
                      <mat-option value="INTERURBANA">Interurbana</mat-option>
                      <mat-option value="INTERPROVINCIAL">Interprovincial</mat-option>
                      <mat-option value="INTERREGIONAL">Interregional</mat-option>
                      <mat-option value="RURAL">Rural</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Tipo de Servicio</mat-label>
                    <mat-select formControlName="tipoServicio">
                      <mat-option value="PASAJEROS">Pasajeros</mat-option>
                      <mat-option value="CARGA">Carga</mat-option>
                      <mat-option value="MIXTO">Mixto</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Empresa</mat-label>
                    <mat-select formControlName="empresaId">
                      @for (empresa of empresas(); track empresa.id) {
                        <mat-option [value]="empresa.id">
                          {{ empresa.razonSocial.principal }} ({{ empresa.ruc }})
                        </mat-option>
                      }
                    </mat-select>
                    <mat-error *ngIf="rutaForm.get('empresaId')?.hasError('required')">
                      La empresa es requerida
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Resolución</mat-label>
                    <mat-select formControlName="resolucionId">
                      @for (resolucion of resoluciones(); track resolucion.id) {
                        <mat-option [value]="resolucion.id">
                          {{ resolucion.nroResolucion }} - {{ resolucion.tipoTramite }}
                        </mat-option>
                      }
                    </mat-select>
                    <mat-error *ngIf="rutaForm.get('resolucionId')?.hasError('required')">
                      La resolución es requerida
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Frecuencias</mat-label>
                    <input matInput formControlName="frecuencias" placeholder="Ej: Lunes a Viernes cada 30 min">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Descripción</mat-label>
                    <textarea matInput formControlName="descripcion" rows="3" placeholder="Descripción de la ruta"></textarea>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>
            
            <div class="step-actions">
              <button mat-raised-button color="primary" matStepperNext [disabled]="!rutaForm.valid">
                Siguiente
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Paso 2: Localidades -->
        <mat-step [stepControl]="localidadesForm" label="Localidades">
          <form [formGroup]="localidadesForm">
            <mat-card class="step-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon color="accent">location_on</mat-icon>
                  Localidades de la Ruta
                </mat-card-title>
                <mat-card-subtitle>
                  El sistema verificará automáticamente la unicidad de las localidades
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <!-- Origen -->
                <div class="localidad-section">
                  <h3>
                    <mat-icon color="primary">my_location</mat-icon>
                    Localidad de Origen
                  </h3>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Nombre de la Localidad</mat-label>
                      <input matInput formControlName="origenNombre" placeholder="Ej: Puno">
                      <mat-error *ngIf="localidadesForm.get('origenNombre')?.hasError('required')">
                        El nombre de origen es requerido
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Departamento</mat-label>
                      <input matInput formControlName="origenDepartamento" placeholder="Ej: Puno">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Provincia</mat-label>
                      <input matInput formControlName="origenProvincia" placeholder="Ej: Puno">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Distrito</mat-label>
                      <input matInput formControlName="origenDistrito" placeholder="Ej: Puno">
                    </mat-form-field>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <!-- Destino -->
                <div class="localidad-section">
                  <h3>
                    <mat-icon color="warn">place</mat-icon>
                    Localidad de Destino
                  </h3>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Nombre de la Localidad</mat-label>
                      <input matInput formControlName="destinoNombre" placeholder="Ej: Juliaca">
                      <mat-error *ngIf="localidadesForm.get('destinoNombre')?.hasError('required')">
                        El nombre de destino es requerido
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Departamento</mat-label>
                      <input matInput formControlName="destinoDepartamento" placeholder="Ej: Puno">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Provincia</mat-label>
                      <input matInput formControlName="destinoProvincia" placeholder="Ej: San Román">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Distrito</mat-label>
                      <input matInput formControlName="destinoDistrito" placeholder="Ej: Juliaca">
                    </mat-form-field>
                  </div>
                </div>

                <!-- Información sobre unicidad -->
                <mat-card class="info-card">
                  <mat-card-content>
                    <div class="info-content">
                      <mat-icon color="primary">info</mat-icon>
                      <div>
                        <h4>Sistema de Localidades Únicas</h4>
                        <p>
                          El sistema verificará automáticamente si las localidades ya existen en la base de datos.
                          Si una localidad ya existe, se reutilizará su ID. Si no existe, se creará una nueva.
                          Esto asegura que no haya localidades duplicadas en el sistema.
                        </p>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </mat-card-content>
            </mat-card>
            
            <div class="step-actions">
              <button mat-button matStepperPrevious>Anterior</button>
              <button mat-raised-button color="primary" matStepperNext [disabled]="!localidadesForm.valid">
                Siguiente
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Paso 3: Confirmación y Procesamiento -->
        <mat-step label="Confirmación">
          <mat-card class="step-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="primary">check_circle</mat-icon>
                Confirmar Creación de Ruta
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (!procesando() && !rutaCreada()) {
                <!-- Resumen de la ruta -->
                <div class="resumen-ruta">
                  <h3>Resumen de la Ruta</h3>
                  <div class="resumen-grid">
                    <div class="resumen-item">
                      <strong>Código:</strong> {{ rutaForm.get('codigoRuta')?.value }}
                    </div>
                    <div class="resumen-item">
                      <strong>Nombre:</strong> {{ rutaForm.get('nombre')?.value }}
                    </div>
                    <div class="resumen-item">
                      <strong>Origen:</strong> {{ localidadesForm.get('origenNombre')?.value }}
                    </div>
                    <div class="resumen-item">
                      <strong>Destino:</strong> {{ localidadesForm.get('destinoNombre')?.value }}
                    </div>
                    <div class="resumen-item">
                      <strong>Tipo:</strong> {{ rutaForm.get('tipoRuta')?.value }}
                    </div>
                    <div class="resumen-item">
                      <strong>Servicio:</strong> {{ rutaForm.get('tipoServicio')?.value }}
                    </div>
                  </div>
                </div>

                <div class="confirmation-actions">
                  <button mat-raised-button color="primary" (click)="crearRuta()" [disabled]="procesando()">
                    <mat-icon>save</mat-icon>
                    Crear Ruta con Localidades Únicas
                  </button>
                </div>
              }

              @if (procesando()) {
                <div class="processing-section">
                  <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
                  <h3>Procesando Ruta...</h3>
                  <p>{{ mensajeProcesamiento() }}</p>
                </div>
              }

              @if (rutaCreada() && resultadoCreacion()) {
                <div class="resultado-section">
                  @if (resultadoCreacion()?.exito) {
                    <div class="resultado-header">
                      <mat-icon color="primary" class="success-icon">check_circle</mat-icon>
                      <h3>¡Ruta Creada Exitosamente!</h3>
                    </div>

                    <div class="resultado-details">
                      <p><strong>ID de Ruta:</strong> {{ resultadoCreacion()?.rutaId }}</p>
                      <p><strong>Localidades Procesadas:</strong> {{ resultadoCreacion()?.localidadesProcesadas?.length || 0 }}</p>
                      <p><strong>Mensaje:</strong> {{ resultadoCreacion()?.mensaje }}</p>
                    </div>
                  } @else {
                    <div class="resultado-header error">
                      <mat-icon color="warn" class="error-icon">error</mat-icon>
                      <h3>Error en el Procesamiento</h3>
                    </div>

                    <div class="resultado-details error">
                      <p><strong>Mensaje:</strong> {{ resultadoCreacion()?.mensaje }}</p>
                      @if (resultadoCreacion()?.errores?.length) {
                        <div class="errores-list">
                          <h4>Errores encontrados:</h4>
                          <ul>
                            @for (error of resultadoCreacion()?.errores; track error) {
                              <li>{{ error }}</li>
                            }
                          </ul>
                        </div>
                      }
                    </div>
                  }

                  <!-- Tabla de localidades procesadas -->
                  @if (resultadoCreacion()?.localidadesProcesadas?.length) {
                    <mat-card class="localidades-procesadas-card">
                      <mat-card-header>
                        <mat-card-title>Localidades Procesadas</mat-card-title>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="table-container">
                          <table mat-table [dataSource]="resultadoCreacion()?.localidadesProcesadas || []" class="localidades-table">
                            <ng-container matColumnDef="nombre">
                              <th mat-header-cell *matHeaderCellDef>Nombre</th>
                              <td mat-cell *matCellDef="let localidad">{{ localidad.nombre }}</td>
                            </ng-container>

                            <ng-container matColumnDef="tipo">
                              <th mat-header-cell *matHeaderCellDef>Tipo</th>
                              <td mat-cell *matCellDef="let localidad">
                                <mat-chip [class]="'tipo-' + localidad.tipo.toLowerCase()">
                                  {{ localidad.tipo }}
                                </mat-chip>
                              </td>
                            </ng-container>

                            <ng-container matColumnDef="estado">
                              <th mat-header-cell *matHeaderCellDef>Estado</th>
                              <td mat-cell *matCellDef="let localidad">
                                <mat-chip [class.nueva]="localidad.esNueva" [class.reutilizada]="!localidad.esNueva">
                                  {{ localidad.esNueva ? 'Nueva' : 'Reutilizada' }}
                                </mat-chip>
                              </td>
                            </ng-container>

                            <ng-container matColumnDef="id">
                              <th mat-header-cell *matHeaderCellDef>ID</th>
                              <td mat-cell *matCellDef="let localidad">
                                <code>{{ localidad.id.substring(0, 8) }}...</code>
                              </td>
                            </ng-container>

                            <tr mat-header-row *matHeaderRowDef="['nombre', 'tipo', 'estado', 'id']"></tr>
                            <tr mat-row *matRowDef="let row; columns: ['nombre', 'tipo', 'estado', 'id'];"></tr>
                          </table>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }

                  <div class="final-actions">
                    <button mat-raised-button color="primary" (click)="nuevaRuta()">
                      <mat-icon>add</mat-icon>
                      Crear Otra Ruta
                    </button>
                    <button mat-stroked-button color="accent" routerLink="/rutas">
                      <mat-icon>list</mat-icon>
                      Ver Todas las Rutas
                    </button>
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>
          
          <div class="step-actions">
            @if (!rutaCreada()) {
              <button mat-button matStepperPrevious [disabled]="procesando()">Anterior</button>
            }
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styleUrls: ['./ruta-con-localidades-unicas.component.scss']
})
export class RutaConLocalidadesUnicasComponent implements OnInit {
  
  // Forms
  rutaForm: FormGroup;
  localidadesForm: FormGroup;
  
  // Signals
  empresas = signal<any[]>([]);
  resoluciones = signal<any[]>([]);
  procesando = signal(false);
  rutaCreada = signal(false);
  resultadoCreacion = signal<ResultadoProcesamientoRuta | null>(null);
  mensajeProcesamiento = signal('Iniciando procesamiento...');

  constructor(
    private fb: FormBuilder,
    private rutaProcessor: RutaProcessorService,
    private localidadManager: LocalidadManagerService,
    private empresaService: EmpresaService,
    private resolucionService: ResolucionService,
    private snackBar: MatSnackBar
  ) {
    this.rutaForm = this.fb.group({
      codigoRuta: ['', Validators.required],
      nombre: ['', Validators.required],
      tipoRuta: ['INTERURBANA', Validators.required],
      tipoServicio: ['PASAJEROS', Validators.required],
      empresaId: ['', Validators.required],
      resolucionId: ['', Validators.required],
      frecuencias: [''],
      descripcion: ['']
    });

    this.localidadesForm = this.fb.group({
      origenNombre: ['', Validators.required],
      origenDepartamento: [''],
      origenProvincia: [''],
      origenDistrito: [''],
      destinoNombre: ['', Validators.required],
      destinoDepartamento: [''],
      destinoProvincia: [''],
      destinoDistrito: ['']
    });
  }

  ngOnInit() {
    this.cargarEmpresas();
    this.cargarResoluciones();
  }

  async cargarEmpresas() {
    try {
      const empresas = await this.empresaService.getEmpresas().toPromise();
      this.empresas.set(empresas || []);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      this.snackBar.open('Error cargando empresas', 'Cerrar', { duration: 3000 });
    }
  }

  async cargarResoluciones() {
    try {
      const resoluciones = await this.resolucionService.getResoluciones().toPromise();
      this.resoluciones.set(resoluciones || []);
    } catch (error) {
      console.error('Error cargando resoluciones:', error);
      this.snackBar.open('Error cargando resoluciones', 'Cerrar', { duration: 3000 });
    }
  }

  async crearRuta() {
    if (!this.rutaForm.valid || !this.localidadesForm.valid) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    try {
      this.procesando.set(true);
      this.mensajeProcesamiento.set('Validando datos de la ruta...');

      // Crear estructura de datos para el procesamiento
      const rutaData = this.rutaForm.value;
      const localidadesData = this.localidadesForm.value;

      const rutaConLocalidades: RutaConLocalidadesData = {
        codigoRuta: rutaData.codigoRuta,
        nombre: rutaData.nombre,
        tipoRuta: rutaData.tipoRuta,
        tipoServicio: rutaData.tipoServicio,
        empresaId: rutaData.empresaId,
        resolucionId: rutaData.resolucionId,
        frecuencias: rutaData.frecuencias || '',
        descripcion: rutaData.descripcion,
        origen: {
          nombre: localidadesData.origenNombre,
          departamento: localidadesData.origenDepartamento,
          provincia: localidadesData.origenProvincia,
          distrito: localidadesData.origenDistrito,
          tipo: 'ORIGEN'
        },
        destino: {
          nombre: localidadesData.destinoNombre,
          departamento: localidadesData.destinoDepartamento,
          provincia: localidadesData.destinoProvincia,
          distrito: localidadesData.destinoDistrito,
          tipo: 'DESTINO'
        }
      };

      this.mensajeProcesamiento.set('Procesando localidades únicas...');

      // Procesar la ruta con localidades únicas
      const resultado = await this.rutaProcessor.procesarRutaCompleta(rutaConLocalidades);

      this.resultadoCreacion.set(resultado);
      this.rutaCreada.set(true);

      if (resultado.exito) {
        this.mensajeProcesamiento.set('¡Ruta creada exitosamente!');
        this.snackBar.open('✅ Ruta creada exitosamente con localidades únicas', 'Cerrar', { duration: 5000 });
      } else {
        this.mensajeProcesamiento.set('Error en el procesamiento');
        this.snackBar.open(`❌ Error: ${resultado.mensaje}`, 'Cerrar', { duration: 5000 });
      }

    } catch (error: any) {
      console.error('Error creando ruta:', error);
      this.snackBar.open(`Error creando ruta: ${error.message || error}`, 'Cerrar', { duration: 5000 });
      
      this.resultadoCreacion.set({
        exito: false,
        localidadesProcesadas: [],
        errores: [error.message || error.toString()],
        mensaje: 'Error inesperado'
      });
      this.rutaCreada.set(true);
    } finally {
      this.procesando.set(false);
    }
  }

  nuevaRuta() {
    // Resetear formularios
    this.rutaForm.reset({
      tipoRuta: 'INTERURBANA',
      tipoServicio: 'PASAJEROS'
    });
    this.localidadesForm.reset();
    
    // Resetear estado
    this.rutaCreada.set(false);
    this.resultadoCreacion.set(null);
    this.procesando.set(false);
    this.mensajeProcesamiento.set('Iniciando procesamiento...');
  }
}