import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Oficina } from '../../models/oficina.model';
import { OficinaService } from '../../services/oficina.service';

export interface FlujoConfiguracion {
  id: string;
  nombre: string;
  descripcion: string;
  tipoTramite: string;
  oficinas: OficinaFlujo[];
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
}

export interface OficinaFlujo {
  oficinaId: string;
  orden: number;
  tiempoEstimado: number;
  esObligatoria: boolean;
  puedeRechazar: boolean;
  puedeDevolver: boolean;
  documentosRequeridos: string[];
  condiciones: string[];
}

@Component({
  selector: 'app-configurar-flujos-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="configurar-flujos-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>settings</mat-icon>
          Configurar Flujos de Trabajo
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Contenido del Modal -->
      <mat-dialog-content class="modal-content">
        <mat-stepper #stepper linear>
          <!-- Paso 1: Información General -->
          <mat-step [stepControl]="flujoForm" label="Información General">
            <form [formGroup]="flujoForm" class="step-form">
              <div class="form-section">
                <h3>Datos del Flujo</h3>
                
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Nombre del Flujo *</mat-label>
                    <input matInput formControlName="nombre" placeholder="Ej: Flujo de Aprobación de Empresas">
                    <mat-error *ngIf="flujoForm.get('nombre')?.hasError('required')">
                      El nombre es requerido
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Tipo de Trámite *</mat-label>
                    <mat-select formControlName="tipoTramite" required>
                      <mat-option value="">Seleccionar tipo</mat-option>
                      <mat-option value="AUTORIZACION_EMPRESA">Autorización de Empresa</mat-option>
                      <mat-option value="RENOVACION_TUC">Renovación de TUC</mat-option>
                      <mat-option value="MODIFICACION_RUTA">Modificación de Ruta</mat-option>
                      <mat-option value="NUEVA_RUTA">Nueva Ruta</mat-option>
                      <mat-option value="INFRACCION">Infracción</mat-option>
                      <mat-option value="OTRO">Otro</mat-option>
                    </mat-select>
                    <mat-error *ngIf="flujoForm.get('tipoTramite')?.hasError('required')">
                      El tipo de trámite es requerido
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field full-width">
                    <mat-label>Descripción</mat-label>
                    <textarea matInput formControlName="descripcion" rows="3" 
                              placeholder="Descripción detallada del flujo de trabajo..."></textarea>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-checkbox formControlName="activo">
                    Flujo activo
                  </mat-checkbox>
                </div>
              </div>

              <div class="step-actions">
                <button mat-button matStepperNext [disabled]="flujoForm.invalid">
                  Siguiente
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Paso 2: Configuración de Oficinas -->
          <mat-step [stepControl]="flujoForm" label="Configuración de Oficinas">
            <div class="step-content">
              <div class="form-section">
                <h3>Oficinas del Flujo</h3>
                <p class="section-description">
                  Define el orden y configuración de las oficinas que participarán en este flujo
                </p>

                <div class="oficinas-configuracion">
                  <div class="oficinas-header">
                    <h4>Oficinas Disponibles</h4>
                    <button mat-raised-button color="primary" (click)="agregarOficina()">
                      <mat-icon>add</mat-icon>
                      Agregar Oficina
                    </button>
                  </div>

                  <div class="oficinas-lista" formArrayName="oficinas">
                    @for (oficina of oficinasArray.controls; track $index; let i = $index) {
                      <mat-card class="oficina-card">
                        <mat-card-header>
                          <mat-card-title>
                            <mat-form-field appearance="outline" class="orden-field">
                              <mat-label>Orden</mat-label>
                              <input matInput type="number" [formControlName]="i + '.orden'" min="1">
                            </mat-form-field>
                            <mat-form-field appearance="outline" class="oficina-field">
                              <mat-label>Oficina</mat-label>
                              <mat-select [formControlName]="i + '.oficinaId'" required>
                                <mat-option value="">Seleccionar oficina</mat-option>
                                @for (oficina of oficinasDisponibles(); track oficina.id) {
                                  <mat-option [value]="oficina.id">
                                    {{ oficina.nombre }} ({{ oficina.tipoOficina }})
                                  </mat-option>
                                }
                              </mat-select>
                            </mat-form-field>
                          </mat-card-title>
                          <mat-card-actions>
                            <button mat-icon-button color="warn" (click)="removerOficina(i)">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </mat-card-actions>
                        </mat-card-header>

                        <mat-card-content>
                          <div class="oficina-configuracion">
                            <div class="config-row">
                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Tiempo Estimado (días)</mat-label>
                                <input matInput type="number" [formControlName]="i + '.tiempoEstimado'" min="1" max="30">
                              </mat-form-field>

                              <div class="checkboxes">
                                <mat-checkbox [formControlName]="i + '.esObligatoria'">
                                  Oficina obligatoria
                                </mat-checkbox>
                                <mat-checkbox [formControlName]="i + '.puedeRechazar'">
                                  Puede rechazar
                                </mat-checkbox>
                                <mat-checkbox [formControlName]="i + '.puedeDevolver'">
                                  Puede devolver
                                </mat-checkbox>
                              </div>
                            </div>

                            <div class="config-row">
                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Documentos Requeridos</mat-label>
                                <input matInput [formControlName]="i + '.documentosRequeridos'" 
                                       placeholder="Separar con comas">
                              </mat-form-field>

                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Condiciones</mat-label>
                                <input matInput [formControlName]="i + '.condiciones'" 
                                       placeholder="Separar con comas">
                              </mat-form-field>
                            </div>
                          </div>
                        </mat-card-content>
                      </mat-card>
                    }
                  </div>

                  @if (oficinasArray.length === 0) {
                    <div class="no-oficinas">
                      <p>No hay oficinas configuradas. Agrega al menos una oficina para continuar.</p>
                    </div>
                  }
                </div>
              </div>

              <div class="step-actions">
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon>
                  Anterior
                </button>
                <button mat-button matStepperNext [disabled]="oficinasArray.length === 0">
                  Siguiente
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </mat-step>

          <!-- Paso 3: Validación y Confirmación -->
          <mat-step label="Validación y Confirmación">
            <div class="step-content">
              <div class="form-section">
                <h3>Resumen del Flujo</h3>
                
                <div class="resumen-flujo">
                  <div class="resumen-item">
                    <span class="label">Nombre:</span>
                    <span class="value">{{ flujoForm.get('nombre')?.value }}</span>
                  </div>
                  <div class="resumen-item">
                    <span class="label">Tipo de Trámite:</span>
                    <span class="value">{{ flujoForm.get('tipoTramite')?.value }}</span>
                  </div>
                  <div class="resumen-item">
                    <span class="label">Descripción:</span>
                    <span class="value">{{ flujoForm.get('descripcion')?.value || 'Sin descripción' }}</span>
                  </div>
                  <div class="resumen-item">
                    <span class="label">Estado:</span>
                    <span class="value">{{ flujoForm.get('activo')?.value ? 'Activo' : 'Inactivo' }}</span>
                  </div>
                  <div class="resumen-item">
                    <span class="label">Total de Oficinas:</span>
                    <span class="value">{{ oficinasArray.length }}</span>
                  </div>
                </div>

                <div class="oficinas-resumen">
                  <h4>Secuencia de Oficinas</h4>
                  <div class="secuencia">
                    @for (oficina of oficinasArray.controls; track $index; let i = $index) {
                      <div class="secuencia-item">
                        <span class="orden">{{ oficina.get('orden')?.value || i + 1 }}</span>
                        <span class="oficina">{{ getOficinaNombre(oficina.get('oficinaId')?.value) }}</span>
                        <span class="tiempo">{{ oficina.get('tiempoEstimado')?.value || 0 }} días</span>
                        @if (i < oficinasArray.length - 1) {
                          <mat-icon class="arrow">arrow_forward</mat-icon>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>

              <div class="step-actions">
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon>
                  Anterior
                </button>
                <button mat-raised-button color="primary" (click)="guardarFlujo()" [disabled]="procesando()">
                  <mat-icon>save</mat-icon>
                  <mat-spinner *ngIf="procesando()" diameter="20"></mat-spinner>
                  {{ procesando() ? 'Guardando...' : 'Guardar Flujo' }}
                </button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>
      </mat-dialog-content>
    </div>
  `,
  styleUrls: ['./configurar-flujos-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigurarFlujosModalComponent {
  private dialogRef = inject(MatDialogRef<ConfigurarFlujosModalComponent>);
  public data = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private oficinaService = inject(OficinaService);

  // Formulario
  flujoForm: FormGroup;
  procesando = signal(false);

  constructor() {
    this.flujoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      tipoTramite: ['', Validators.required],
      activo: [true],
      oficinas: this.fb.array([])
    });

    // Agregar oficina por defecto
    this.agregarOficina();
  }

  // Getters
  get oficinasArray(): FormArray {
    return this.flujoForm.get('oficinas') as FormArray;
  }

  oficinasDisponibles = computed(() => {
    return this.data?.oficinas || [];
  });

  // Métodos
  agregarOficina(): void {
    const oficina = this.fb.group({
      oficinaId: ['', Validators.required],
      orden: [this.oficinasArray.length + 1, [Validators.required, Validators.min(1)]],
      tiempoEstimado: [5, [Validators.required, Validators.min(1), Validators.max(30)]],
      esObligatoria: [true],
      puedeRechazar: [false],
      puedeDevolver: [false],
      documentosRequeridos: [''],
      condiciones: ['']
    });

    this.oficinasArray.push(oficina);
  }

  removerOficina(index: number): void {
    this.oficinasArray.removeAt(index);
    
    // Reordenar las oficinas restantes
    this.oficinasArray.controls.forEach((control, i) => {
      control.get('orden')?.setValue(i + 1);
    });
  }

  getOficinaNombre(oficinaId: string): string {
    const oficina = this.oficinasDisponibles().find((o: Oficina) => o.id === oficinaId);
    return oficina ? oficina.nombre : 'Oficina no encontrada';
  }

  async guardarFlujo(): Promise<void> {
    if (this.flujoForm.invalid) {
      this.mostrarError('Por favor complete todos los campos requeridos');
      return;
    }

    this.procesando.set(true);

    try {
      const flujoData = {
        ...this.flujoForm.value,
        oficinas: this.oficinasArray.value.map((oficina: any, index: number) => ({
          ...oficina,
          orden: oficina.orden || index + 1,
          documentosRequeridos: oficina.documentosRequeridos ? 
            oficina.documentosRequeridos.split(',').map((d: string) => d.trim()) : [],
          condiciones: oficina.condiciones ? 
            oficina.condiciones.split(',').map((c: string) => c.trim()) : []
        }))
      };

      // Aquí se llamaría al servicio para guardar el flujo
      // await this.oficinaService.guardarFlujo(flujoData);
      
      // Simular proceso
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.mostrarExito('Flujo de trabajo guardado exitosamente');
      this.dialogRef.close({
        success: true,
        flujo: flujoData
      });

    } catch (error) {
      console.error('Error guardando flujo:', error);
      this.mostrarError('Error al guardar el flujo de trabajo');
    } finally {
      this.procesando.set(false);
    }
  }

  // Notificaciones
  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
  }
} 