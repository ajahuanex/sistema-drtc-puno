import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { OficinaService } from '../../services/oficina.service';
import { Oficina, OficinaCreate, OficinaUpdate } from '../../models/oficina.model';

@Component({
  selector: 'app-oficina-form',
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
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <div class="oficina-form-container">
      <!-- Header -->
      <div class="header">
        <div class="title-section">
          <h1>{{ esEdicion() ? 'Editar Oficina' : 'Nueva Oficina' }}</h1>
          <p>{{ esEdicion() ? 'Modifica los datos de la oficina' : 'Crea una nueva oficina en el sistema' }}</p>
        </div>
        <div class="actions">
          <button mat-button routerLink="/oficinas">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>{{ esEdicion() ? 'Cargando oficina...' : 'Preparando formulario...' }}</p>
        </div>
      } @else {
        <form [formGroup]="oficinaForm" (ngSubmit)="onSubmit()" class="oficina-form">
          <!-- Información Básica -->
          <mat-card class="form-section">
            <mat-card-header>
              <mat-card-title>Información Básica</mat-card-title>
              <mat-card-subtitle>Datos principales de la oficina</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Nombre de la Oficina</mat-label>
                  <input matInput formControlName="nombre" placeholder="Ej: OFICINA DE RECEPCIÓN">
                  <mat-error *ngIf="oficinaForm.get('nombre')?.hasError('required')">
                    El nombre es obligatorio
                  </mat-error>
                  <mat-error *ngIf="oficinaForm.get('nombre')?.hasError('minlength')">
                    El nombre debe tener al menos 3 caracteres
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Tipo de Oficina</mat-label>
                  <mat-select formControlName="tipo" required>
                    <mat-option value="">Seleccione un tipo</mat-option>
                    @for (tipo of tiposOficina(); track tipo.value) {
                      <mat-option [value]="tipo.value">{{ tipo.label | uppercase }}</mat-option>
                    }
                  </mat-select>
                  <mat-error *ngIf="oficinaForm.get('tipo')?.hasError('required')">
                    El tipo es obligatorio
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Ubicación</mat-label>
                  <input matInput formControlName="ubicacion" placeholder="Ej: PLANTA BAJA - ÁREA DE ATENCIÓN">
                  <mat-error *ngIf="oficinaForm.get('ubicacion')?.hasError('required')">
                    La ubicación es obligatoria
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Prioridad</mat-label>
                  <mat-select formControlName="prioridad" required>
                    <mat-option value="">Seleccione prioridad</mat-option>
                    @for (prioridad of prioridadesOficina(); track prioridad.value) {
                      <mat-option [value]="prioridad.value">{{ prioridad.value | uppercase }}</mat-option>
                    }
                  </mat-select>
                  <mat-error *ngIf="oficinaForm.get('prioridad')?.hasError('required')">
                    La prioridad es obligatoria
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Estado</mat-label>
                  <mat-select formControlName="estado" required>
                    <mat-option value="">Seleccione estado</mat-option>
                    @for (estado of estadosOficina(); track estado.value) {
                      <mat-option [value]="estado.value">{{ estado.value | uppercase }}</mat-option>
                    }
                  </mat-select>
                  <mat-error *ngIf="oficinaForm.get('estado')?.hasError('required')">
                    El estado es obligatorio
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Horario de Atención</mat-label>
                  <input matInput formControlName="horarioAtencion" placeholder="Ej: 08:00 - 17:00">
                  <mat-error *ngIf="oficinaForm.get('horarioAtencion')?.hasError('required')">
                    El horario es obligatorio
                  </mat-error>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Información de Contacto -->
          <mat-card class="form-section">
            <mat-card-header>
              <mat-card-title>Información de Contacto</mat-card-title>
              <mat-card-subtitle>Datos para comunicación con la oficina</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Teléfono</mat-label>
                  <input matInput formControlName="telefono" placeholder="Ej: 051-123456">
                  <mat-error *ngIf="oficinaForm.get('telefono')?.hasError('required')">
                    El teléfono es obligatorio
                  </mat-error>
                  <mat-error *ngIf="oficinaForm.get('telefono')?.hasError('pattern')">
                    Formato de teléfono inválido
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" placeholder="Ej: oficina@drtc-puno.gob.pe">
                  <mat-error *ngIf="oficinaForm.get('email')?.hasError('required')">
                    El email es obligatorio
                  </mat-error>
                  <mat-error *ngIf="oficinaForm.get('email')?.hasError('email')">
                    Formato de email inválido
                  </mat-error>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Responsable -->
          <mat-card class="form-section">
            <mat-card-header>
              <mat-card-title>Responsable de la Oficina</mat-card-title>
              <mat-card-subtitle>Información de la persona a cargo</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Nombre del Responsable</mat-label>
                  <input matInput formControlName="responsableNombre" placeholder="Ej: MARÍA GONZÁLEZ">
                  <mat-error *ngIf="oficinaForm.get('responsableNombre')?.hasError('required')">
                    El nombre del responsable es obligatorio
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Cargo</mat-label>
                  <input matInput formControlName="responsableCargo" placeholder="Ej: JEFE DE OFICINA">
                  <mat-error *ngIf="oficinaForm.get('responsableCargo')?.hasError('required')">
                    El cargo es obligatorio
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Teléfono del Responsable</mat-label>
                  <input matInput formControlName="responsableTelefono" placeholder="Ej: 051-123456">
                  <mat-error *ngIf="oficinaForm.get('responsableTelefono')?.hasError('required')">
                    El teléfono del responsable es obligatorio
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Email del Responsable</mat-label>
                  <input matInput formControlName="responsableEmail" placeholder="Ej: responsable@drtc-puno.gob.pe">
                  <mat-error *ngIf="oficinaForm.get('responsableEmail')?.hasError('required')">
                    El email del responsable es obligatorio
                  </mat-error>
                  <mat-error *ngIf="oficinaForm.get('responsableEmail')?.hasError('email')">
                    Formato de email inválido
                  </mat-error>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Configuración Operativa -->
          <mat-card class="form-section">
            <mat-card-header>
              <mat-card-title>Configuración Operativa</mat-card-title>
              <mat-card-subtitle>Parámetros de funcionamiento de la oficina</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Tiempo Estimado de Procesamiento (días)</mat-label>
                  <input matInput type="number" formControlName="tiempoEstimadoProcesamiento" min="1" max="30">
                  <mat-error *ngIf="oficinaForm.get('tiempoEstimadoProcesamiento')?.hasError('required')">
                    El tiempo estimado es obligatorio
                  </mat-error>
                  <mat-error *ngIf="oficinaForm.get('tiempoEstimadoProcesamiento')?.hasError('min')">
                    Mínimo 1 día
                  </mat-error>
                  <mat-error *ngIf="oficinaForm.get('tiempoEstimadoProcesamiento')?.hasError('max')">
                    Máximo 30 días
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Capacidad Máxima de Expedientes</mat-label>
                  <input matInput type="number" formControlName="capacidadMaxima" min="10" max="1000">
                  <mat-error *ngIf="oficinaForm.get('capacidadMaxima')?.hasError('required')">
                    La capacidad máxima es obligatoria
                  </mat-error>
                  <mat-error *ngIf="oficinaForm.get('capacidadMaxima')?.hasError('min')">
                    Mínimo 10 expedientes
                  </mat-error>
                  <mat-error *ngIf="oficinaForm.get('capacidadMaxima')?.hasError('max')">
                    Máximo 1000 expedientes
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Permisos</mat-label>
                  <mat-select formControlName="permisos" multiple>
                    @for (permiso of permisosDisponibles(); track permiso) {
                      <mat-option [value]="permiso">{{ permiso | uppercase }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>Seleccione los permisos que tendrá esta oficina</mat-hint>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Dependencias</mat-label>
                  <mat-select formControlName="dependencias" multiple>
                    @for (oficina of oficinasDisponibles(); track oficina.id) {
                      <mat-option [value]="oficina.id">{{ oficina.nombre | uppercase }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>Seleccione las oficinas de las que depende esta oficina</mat-hint>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Acciones del Formulario -->
          <div class="form-actions">
            <button mat-button type="button" routerLink="/oficinas">
              Cancelar
            </button>
            <button 
              mat-raised-button 
              color="primary" 
              type="submit" 
              [disabled]="oficinaForm.invalid || submitting()">
              @if (submitting()) {
                <mat-spinner diameter="20"></mat-spinner>
              }
              {{ esEdicion() ? 'Actualizar' : 'Crear' }} Oficina
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .oficina-form-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .title-section h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 28px;
      font-weight: 600;
    }

    .title-section p {
      margin: 8px 0 0 0;
      color: #6c757d;
      font-size: 16px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
    }

    .oficina-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-section {
      margin-bottom: 0;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row:last-child {
      margin-bottom: 0;
    }

    .form-field {
      width: 100%;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      padding: 24px 0;
      border-top: 1px solid #e9ecef;
    }

    .form-actions button {
      min-width: 120px;
    }

    @media (max-width: 768px) {
      .oficina-form-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OficinaFormComponent implements OnInit {
  private oficinaService = inject(OficinaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // Signals
  loading = signal(false);
  submitting = signal(false);
  oficinaId = signal<string | null>(null);

  // Formulario
  oficinaForm: FormGroup;

  // Opciones para los campos
  tiposOficina = signal<Array<{value: string, label: string}>>([]);
  estadosOficina = signal<Array<{value: string, label: string}>>([]);
  prioridadesOficina = signal<Array<{value: string, label: string}>>([]);
  oficinasDisponibles = signal<Oficina[]>([]);

  // Permisos disponibles
  permisosDisponibles = signal([
    'RECEPCIONAR_DOCUMENTOS',
    'REVISAR_DOCUMENTOS',
    'APROBAR_DOCUMENTOS',
    'ASIGNAR_OFICINAS',
    'MOVER_EXPEDIENTES',
    'GENERAR_REPORTES',
    'ADMINISTRAR_USUARIOS'
  ]);

  // Computed properties
  esEdicion = computed(() => !!this.oficinaId());

  constructor() {
    this.oficinaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['', Validators.required],
      ubicacion: ['', Validators.required],
      prioridad: ['', Validators.required],
      estado: ['', Validators.required],
      horarioAtencion: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^[\d\-\s\(\)]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      responsableNombre: ['', Validators.required],
      responsableCargo: ['', Validators.required],
      responsableTelefono: ['', Validators.required],
      responsableEmail: ['', [Validators.required, Validators.email]],
      tiempoEstimadoProcesamiento: [1, [Validators.required, Validators.min(1), Validators.max(30)]],
      capacidadMaxima: [100, [Validators.required, Validators.min(10), Validators.max(1000)]],
      permisos: [[]],
      dependencias: [[]]
    });
  }

  ngOnInit(): void {
    this.cargarOpciones();
    this.cargarOficinasDisponibles();
    
    // Verificar si es edición
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.oficinaId.set(id);
        this.cargarOficina(id);
      }
    });
  }

  cargarOpciones(): void {
    this.oficinaService.getTiposOficina().subscribe(tipos => {
      this.tiposOficina.set(tipos);
    });

    this.oficinaService.getEstadosOficina().subscribe(estados => {
      this.estadosOficina.set(estados);
    });

    this.oficinaService.getPrioridadesOficina().subscribe(prioridades => {
      this.prioridadesOficina.set(prioridades);
    });
  }

  cargarOficinasDisponibles(): void {
    this.oficinaService.getOficinas().subscribe(oficinas => {
      this.oficinasDisponibles.set(oficinas);
    });
  }

  cargarOficina(id: string): void {
    this.loading.set(true);
    
    this.oficinaService.getOficina(id).subscribe({
      next: (oficina) => {
        this.poblarFormulario(oficina);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar oficina:', error);
        this.snackBar.open('Error al cargar la oficina', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  poblarFormulario(oficina: Oficina): void {
    this.oficinaForm.patchValue({
      nombre: oficina.nombre,
      tipo: oficina.tipoOficina,
      ubicacion: oficina.ubicacion,
      prioridad: oficina.prioridad,
      estado: oficina.estaActiva ? 'ACTIVA' : 'INACTIVA',
      horarioAtencion: oficina.horarioAtencion,
      telefono: oficina.telefono,
      email: oficina.email,
      responsableNombre: oficina.responsable ? `${oficina.responsable.nombres} ${oficina.responsable.apellidos}` : '',
      responsableCargo: oficina.responsable?.cargo || '',
      responsableTelefono: oficina.responsable?.telefono || '',
      responsableEmail: oficina.responsable?.email || '',
      tiempoEstimadoProcesamiento: oficina.tiempoPromedioTramite,
      capacidadMaxima: oficina.capacidadMaxima,
      permisos: [],
      dependencias: []
    });
  }

  onSubmit(): void {
    if (this.oficinaForm.invalid) {
      return;
    }

    this.submitting.set(true);
    const formValue = this.oficinaForm.value;

    // Preparar datos para el backend
    const oficinaData = {
      nombre: formValue.nombre,
      tipo: formValue.tipo,
      responsable: {
        id: '', // Se asignará en el backend
        nombre: formValue.responsableNombre,
        cargo: formValue.responsableCargo,
        telefono: formValue.responsableTelefono,
        email: formValue.responsableEmail
      },
      ubicacion: formValue.ubicacion,
      telefono: formValue.telefono,
      email: formValue.email,
      horarioAtencion: formValue.horarioAtencion,
      tiempoEstimadoProcesamiento: formValue.tiempoEstimadoProcesamiento,
      capacidadMaxima: formValue.capacidadMaxima,
      prioridad: formValue.prioridad,
      estado: formValue.estado,
      dependencias: formValue.dependencias || [],
      permisos: formValue.permisos || []
    };

    if (this.esEdicion()) {
      this.actualizarOficina(oficinaData);
    } else {
      this.crearOficina(oficinaData);
    }
  }

  crearOficina(oficinaData: any): void {
    this.oficinaService.createOficina(oficinaData).subscribe({
      next: (oficina) => {
        this.snackBar.open('Oficina creada exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/oficinas']);
      },
      error: (error) => {
        console.error('Error al crear oficina:', error);
        this.snackBar.open('Error al crear la oficina', 'Cerrar', { duration: 3000 });
        this.submitting.set(false);
      }
    });
  }

  actualizarOficina(oficinaData: any): void {
    const id = this.oficinaId();
    if (!id) return;

    this.oficinaService.updateOficina(id, oficinaData).subscribe({
      next: (oficina) => {
        this.snackBar.open('Oficina actualizada exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/oficinas']);
      },
      error: (error) => {
        console.error('Error al actualizar oficina:', error);
        this.snackBar.open('Error al actualizar la oficina', 'Cerrar', { duration: 3000 });
        this.submitting.set(false);
      }
    });
  }
} 