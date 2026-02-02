import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

import { ConfiguracionSistema } from '../../models/configuracion.model';
import { ConfiguracionService } from '../../services/configuracion.service';

export interface EditarEstadosVehiculosData {
  configuracion: ConfiguracionSistema;
}

export interface EstadoVehiculo {
  codigo: string;
  nombre: string;
  color: string;
  descripcion: string;
}

@Component({
  selector: 'app-editar-estados-vehiculos-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="editar-estados-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>palette</mat-icon>
          Configurar Estados de Vehículos
        </h2>
        <button mat-icon-button 
                (click)="cerrar()"
                class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="info-section">
          <p>Configure los estados disponibles para los vehículos, incluyendo nombres, colores y descripciones.</p>
        </div>

        <form [formGroup]="formulario" class="estados-form">
          <div class="estados-list">
            <div *ngFor="let estadoControl of estadosFormArray.controls; let i = index" 
                 class="estado-item" 
                 [formGroupName]="i">
              
              <div class="estado-header">
                <div class="color-preview" 
                     [style.background-color]="estadoControl.get('color')?.value">
                </div>
                <h4>Estado {{ i + 1 }}</h4>
                <button mat-icon-button 
                        type="button"
                        color="warn" 
                        (click)="eliminarEstado(i)"
                        [disabled]="estadosFormArray.length <= 1"
                        matTooltip="Eliminar estado">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>

              <div class="estado-fields">
                <div class="field-row">
                  <mat-form-field appearance="outline" class="codigo-field">
                    <mat-label>Código</mat-label>
                    <input matInput 
                           formControlName="codigo" 
                           placeholder="ACTIVO"
                           required>
                    <mat-error *ngIf="estadoControl.get('codigo')?.hasError('required')">
                      El código es requerido
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="nombre-field">
                    <mat-label>Nombre</mat-label>
                    <input matInput 
                           formControlName="nombre" 
                           placeholder="Activo"
                           required>
                    <mat-error *ngIf="estadoControl.get('nombre')?.hasError('required')">
                      El nombre es requerido
                    </mat-error>
                  </mat-form-field>

                  <div class="color-field">
                    <label>Color</label>
                    <input type="color" 
                           formControlName="color" 
                           class="color-input">
                  </div>
                </div>

                <div class="field-row">
                  <mat-form-field appearance="outline" class="descripcion-field">
                    <mat-label>Descripción</mat-label>
                    <textarea matInput 
                              formControlName="descripcion" 
                              rows="2"
                              placeholder="Descripción del estado"
                              required></textarea>
                    <mat-error *ngIf="estadoControl.get('descripcion')?.hasError('required')">
                      La descripción es requerida
                    </mat-error>
                  </mat-form-field>
                </div>
              </div>
            </div>
          </div>

          <div class="add-estado-section">
            <button mat-raised-button 
                    type="button"
                    color="accent" 
                    (click)="agregarEstado()">
              <mat-icon>add</mat-icon>
              Agregar Estado
            </button>
          </div>
        </form>

        <div class="preview-section">
          <h3>Vista Previa</h3>
          <div class="estados-preview">
            <span *ngFor="let estado of obtenerEstadosPreview()" 
                  class="estado-chip"
                  [style.background-color]="estado.color"
                  [style.color]="obtenerColorTexto(estado.color)">
              {{ estado.nombre }}
            </span>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button 
                (click)="cerrar()"
                class="cancel-button">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="guardar()"
                [disabled]="formulario.invalid || guardando"
                class="save-button">
          <mat-icon>save</mat-icon>
          {{ guardando ? 'Guardando...' : 'Guardar Estados' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .editar-estados-modal {
      min-width: 700px;
      max-width: 800px;
      max-height: 90vh;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;

      h2 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        color: #1976d2;
        font-size: 1.5rem;
      }
    }

    .info-section {
      background-color: #e3f2fd;
      border: 1px solid #bbdefb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;

      p {
        margin: 0;
        color: #1976d2;
      }
    }

    .estados-list {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 20px;
    }

    .estado-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      background-color: #fafafa;

      .estado-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

        .color-preview {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #ddd;
        }

        h4 {
          margin: 0;
          flex: 1;
          color: #333;
        }
      }

      .estado-fields {
        .field-row {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          align-items: flex-start;

          .codigo-field {
            flex: 1;
          }

          .nombre-field {
            flex: 2;
          }

          .color-field {
            display: flex;
            flex-direction: column;
            gap: 8px;

            label {
              font-size: 14px;
              color: #666;
              font-weight: 500;
            }

            .color-input {
              width: 60px;
              height: 40px;
              border: 1px solid #ddd;
              border-radius: 4px;
              cursor: pointer;
            }
          }

          .descripcion-field {
            flex: 1;
          }
        }
      }
    }

    .add-estado-section {
      text-align: center;
      margin: 20px 0;
    }

    .preview-section {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;

      h3 {
        margin: 0 0 16px 0;
        color: #333;
      }

      .estados-preview {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .estado-chip {
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid rgba(0,0,0,0.1);
        }
      }
    }

    mat-dialog-actions {
      padding: 24px 0 0 0;
      margin: 0;

      .cancel-button {
        color: #666;
        margin-right: 16px;
      }

      .save-button {
        background-color: #1976d2;
        color: white;

        &:disabled {
          background-color: #ccc;
          color: #666;
        }
      }
    }

    @media (max-width: 800px) {
      .editar-estados-modal {
        min-width: 100%;
        max-width: 100%;
      }

      .estado-fields .field-row {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class EditarEstadosVehiculosModalComponent {
  private dialogRef = inject(MatDialogRef<EditarEstadosVehiculosModalComponent>);
  private snackBar = inject(MatSnackBar);
  private configuracionService = inject(ConfiguracionService);
  private fb = inject(FormBuilder);

  data: EditarEstadosVehiculosData = inject(MAT_DIALOG_DATA);
  
  formulario: FormGroup;
  guardando = false;

  constructor() {
    this.formulario = this.fb.group({
      estados: this.fb.array([])
    });

    this.cargarEstadosExistentes();
  }

  get estadosFormArray(): FormArray {
    return this.formulario.get('estados') as FormArray;
  }

  private cargarEstadosExistentes(): void {
    try {
      const estados: EstadoVehiculo[] = JSON.parse(this.data.configuracion.valor);
      
      estados.forEach(estado => {
        this.estadosFormArray.push(this.crearEstadoFormGroup(estado));
      });
    } catch (error) {
      console.error('Error parseando estados existentes::', error);
      // Cargar estados por defecto
      this.cargarEstadosPorDefecto();
    }
  }

  private cargarEstadosPorDefecto(): void {
    const estadosDefault: EstadoVehiculo[] = [
      { codigo: 'ACTIVO', nombre: 'Activo', color: '#4CAF50', descripcion: 'Vehículo operativo y disponible para servicio' },
      { codigo: 'INACTIVO', nombre: 'Inactivo', color: '#F44336', descripcion: 'Vehículo temporalmente fuera de servicio' },
      { codigo: 'MANTENIMIENTO', nombre: 'Mantenimiento', color: '#FF9800', descripcion: 'Vehículo en proceso de reparación o mantenimiento' }
    ];

    estadosDefault.forEach(estado => {
      this.estadosFormArray.push(this.crearEstadoFormGroup(estado));
    });
  }

  private crearEstadoFormGroup(estado?: EstadoVehiculo): FormGroup {
    return this.fb.group({
      codigo: [estado?.codigo || '', [Validators.required, Validators.pattern(/^[A-Z_]+$/)]],
      nombre: [estado?.nombre || '', [Validators.required]],
      color: [estado?.color || '#4CAF50', [Validators.required]],
      descripcion: [estado?.descripcion || '', [Validators.required]]
    });
  }

  agregarEstado(): void {
    this.estadosFormArray.push(this.crearEstadoFormGroup());
  }

  eliminarEstado(index: number): void {
    if (this.estadosFormArray.length > 1) {
      this.estadosFormArray.removeAt(index);
    }
  }

  obtenerEstadosPreview(): EstadoVehiculo[] {
    return this.estadosFormArray.controls.map(control => control.value);
  }

  obtenerColorTexto(colorFondo: string): string {
    // Convertir hex a RGB y calcular luminancia
    const hex = colorFondo.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calcular luminancia
    const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminancia > 0.5 ? '#000000' : '#FFFFFF';
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.snackBar.open('Por favor, corrija los errores en el formulario', 'Cerrar', { duration: 3000 });
      return;
    }

    // Validar códigos únicos
    const estados = this.obtenerEstadosPreview();
    const codigos = estados.map(e => e.codigo);
    const codigosUnicos = new Set(codigos);
    
    if (codigos.length !== codigosUnicos.size) {
      this.snackBar.open('Los códigos de estado deben ser únicos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.guardando = true;
    const estadosJson = JSON.stringify(estados);

    this.configuracionService.actualizarConfiguracion(
      this.data.configuracion.id,
      estadosJson
    ).then((resultado: boolean) => {
      this.guardando = false;
      if (resultado) {
        this.snackBar.open('Estados de vehículos actualizados exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      } else {
        this.snackBar.open('Error actualizando estados de vehículos', 'Cerrar', { duration: 3000 });
      }
    }).catch((error: any) => {
      this.guardando = false;
      console.error('Error actualizando estados::', error);
      this.snackBar.open('Error actualizando estados de vehículos', 'Cerrar', { duration: 3000 });
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}