import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ConfiguracionSistema } from '../../models/configuracion.model';
import { ConfiguracionService } from '../../services/configuracion.service';

export interface EditarConfiguracionData {
  configuracion: ConfiguracionSistema;
}

@Component({
  selector: 'app-editar-configuracion-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatCheckboxModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="editar-configuracion-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>edit</mat-icon>
          Editar Configuración
        </h2>
        <button mat-icon-button 
                (click)="cerrar()"
                class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="configuracion-info">
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>{{ data.configuracion.nombre | titlecase }}</mat-card-title>
              <mat-card-subtitle>{{ data.configuracion.categoria }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="description">{{ data.configuracion.descripcion }}</p>
            </mat-card-content>
          </mat-card>
        </div>

        <form [formGroup]="formulario" class="editar-form">
          <div class="form-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Valor</mat-label>
              <input matInput 
                     formControlName="valor" 
                     [placeholder]="'Ingrese el nuevo valor para ' + data.configuracion.nombre"
                     required>
              <mat-error *ngIf="formulario.get('valor')?.hasError('required')">
                El valor es requerido
              </mat-error>
              <mat-error *ngIf="formulario.get('valor')?.hasError('min')">
                El valor mínimo es {{ formulario.get('valor')?.getError('min')?.min }}
              </mat-error>
              <mat-error *ngIf="formulario.get('valor')?.hasError('max')">
                El valor máximo es {{ formulario.get('valor')?.getError('max')?.max }}
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descripción</mat-label>
              <textarea matInput 
                        formControlName="descripcion" 
                        rows="3"
                        [placeholder]="'Descripción de la configuración'"></textarea>
              <mat-error *ngIf="formulario.get('descripcion')?.hasError('maxlength')">
                La descripción no puede exceder los 500 caracteres
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-checkbox formControlName="esEditable" 
                          color="primary">
              Permitir edición por usuarios
            </mat-checkbox>
            <p class="help-text">
              Si está desmarcado, solo los administradores podrán modificar esta configuración
            </p>
          </div>

          <div class="form-row" *ngIf="mostrarValidaciones()">
            <div class="validaciones">
              <h4>Validaciones Aplicadas:</h4>
              <ul>
                <li *ngIf="esConfiguracionNumerica()">
                  <strong>Valor numérico:</strong> Debe ser un número válido
                </li>
                <li *ngIf="tieneMinimo()">
                  <strong>Valor mínimo:</strong> {{ obtenerMinimo() }}
                </li>
                <li *ngIf="tieneMaximo()">
                  <strong>Valor máximo:</strong> {{ obtenerMaximo() }}
                </li>
                <li *ngIf="esConfiguracionBooleana()">
                  <strong>Valor booleano:</strong> Solo se permiten "true" o "false"
                </li>
              </ul>
            </div>
          </div>
        </form>
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
          {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .editar-configuracion-modal {
      min-width: 500px;
      max-width: 600px;
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

        mat-icon {
          color: #1976d2;
        }
      }

      .close-button {
        color: #666;
      }
    }

    .configuracion-info {
      margin-bottom: 24px;

      .info-card {
        background-color: #f8f9fa;
        border: 1px solid #e0e0e0;

        .mat-card-header {
          padding-bottom: 16px;

          .mat-card-title {
            color: #333;
            font-size: 1.2rem;
            font-weight: 600;
            text-transform: capitalize;
          }

          .mat-card-subtitle {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            font-weight: 500;
          }
        }

        .description {
          color: #666;
          line-height: 1.5;
          margin: 0;
          font-size: 0.9rem;
        }
      }
    }

    .editar-form {
      .form-row {
        margin-bottom: 20px;

        .full-width {
          width: 100%;
        }

        .help-text {
          margin: 8px 0 0 0;
          color: #666;
          font-size: 0.8rem;
          font-style: italic;
        }
      }

      .validaciones {
        background-color: #e3f2fd;
        border: 1px solid #bbdefb;
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;

        h4 {
          margin: 0 0 12px 0;
          color: #1976d2;
          font-size: 1rem;
        }

        ul {
          margin: 0;
          padding-left: 20px;
          color: #333;

          li {
            margin-bottom: 8px;
            line-height: 1.4;

            strong {
              color: #1976d2;
            }
          }
        }
      }
    }

    mat-dialog-actions {
      padding: 24px 0 0 0;
      margin: 0;

      .cancel-button {
        color: #666;
        margin-right: 16px;

        mat-icon {
          margin-right: 8px;
        }
      }

      .save-button {
        background-color: #1976d2;
        color: white;

        mat-icon {
          margin-right: 8px;
        }

        &:disabled {
          background-color: #ccc;
          color: #666;
        }
      }
    }

    // Responsive
    @media (max-width: 600px) {
      .editar-configuracion-modal {
        min-width: 100%;
        max-width: 100%;
      }

      .modal-header h2 {
        font-size: 1.3rem;
      }
    }
  `]
})
export class EditarConfiguracionModalComponent {
  private dialogRef = inject(MatDialogRef<EditarConfiguracionModalComponent>);
  private snackBar = inject(MatSnackBar);
  private configuracionService = inject(ConfiguracionService);
  private fb = inject(FormBuilder);

  data: EditarConfiguracionData = inject(MAT_DIALOG_DATA);
  
  formulario: FormGroup;
  guardando = false;

  constructor() {
    this.formulario = this.fb.group({
      valor: [this.data.configuracion.valor, [Validators.required]],
      descripcion: [this.data.configuracion.descripcion, [Validators.maxLength(500)]],
      esEditable: [this.data.configuracion.esEditable]
    });

    // Agregar validaciones específicas según el tipo de configuración
    this.agregarValidacionesEspecificas();
  }

  private agregarValidacionesEspecificas(): void {
    const valorControl = this.formulario.get('valor');
    if (!valorControl) return;

    // Validaciones para configuraciones numéricas
    if (this.esConfiguracionNumerica()) {
      valorControl.addValidators([
        Validators.pattern(/^\d+$/),
        Validators.min(this.obtenerMinimo() || 0),
        Validators.max(this.obtenerMaximo() || 999999)
      ]);
    }

    // Validaciones para configuraciones booleanas
    if (this.esConfiguracionBooleana()) {
      valorControl.addValidators([
        Validators.pattern(/^(true|false)$/i)
      ]);
    }

    // Validaciones para configuraciones específicas
    this.agregarValidacionesPorNombre();
  }

  private agregarValidacionesPorNombre(): void {
    const nombre = this.data.configuracion.nombre;
    const valorControl = this.formulario.get('valor');

    switch (nombre) {
      case 'ANIOS_VIGENCIA_DEFAULT':
        valorControl?.addValidators([
          Validators.min(1),
          Validators.max(50)
        ]);
        break;
      case 'MAX_ANIOS_VIGENCIA':
        valorControl?.addValidators([
          Validators.min(1),
          Validators.max(100)
        ]);
        break;
      case 'MIN_ANIOS_VIGENCIA':
        valorControl?.addValidators([
          Validators.min(1),
          Validators.max(10)
        ]);
        break;
      case 'DIAS_ANTES_VENCIMIENTO_ALERTA':
        valorControl?.addValidators([
          Validators.min(1),
          Validators.max(365)
        ]);
        break;
      case 'PAGINACION_DEFAULT':
        valorControl?.addValidators([
          Validators.min(5),
          Validators.max(100)
        ]);
        break;
      case 'SESSION_TIMEOUT':
        valorControl?.addValidators([
          Validators.min(300), // 5 minutos mínimo
          Validators.max(86400) // 24 horas máximo
        ]);
        break;
    }
  }

  esConfiguracionNumerica(): boolean {
    const nombre = this.data.configuracion.nombre;
    return [
      'ANIOS_VIGENCIA_DEFAULT',
      'MAX_ANIOS_VIGENCIA',
      'MIN_ANIOS_VIGENCIA',
      'DIAS_ANTES_VENCIMIENTO_ALERTA',
      'TIEMPO_PROCESAMIENTO_DEFAULT',
      'MAX_TIEMPO_PROCESAMIENTO',
      'EXPEDIENTES_POR_OFICINA_LIMITE',
      'DIAS_ANTES_VENCIMIENTO_EXPEDIENTE',
      'CAPACIDAD_MAXIMA_DEFAULT',
      'EMPRESAS_ACTIVAS_LIMITE',
      'DIAS_VALIDEZ_DOCUMENTOS',
      'PAGINACION_DEFAULT',
      'SESSION_TIMEOUT'
    ].includes(nombre);
  }

  esConfiguracionBooleana(): boolean {
    const nombre = this.data.configuracion.nombre;
    return [
      'NOTIFICACIONES_EMAIL',
      'NOTIFICACIONES_PUSH'
    ].includes(nombre);
  }

  tieneMinimo(): boolean {
    return this.esConfiguracionNumerica();
  }

  tieneMaximo(): boolean {
    return this.esConfiguracionNumerica();
  }

  obtenerMinimo(): number {
    const nombre = this.data.configuracion.nombre;
    const minimos: { [key: string]: number } = {
      'ANIOS_VIGENCIA_DEFAULT': 1,
      'MAX_ANIOS_VIGENCIA': 1,
      'MIN_ANIOS_VIGENCIA': 1,
      'DIAS_ANTES_VENCIMIENTO_ALERTA': 1,
      'TIEMPO_PROCESAMIENTO_DEFAULT': 1,
      'MAX_TIEMPO_PROCESAMIENTO': 1,
      'EXPEDIENTES_POR_OFICINA_LIMITE': 1,
      'DIAS_ANTES_VENCIMIENTO_EXPEDIENTE': 1,
      'CAPACIDAD_MAXIMA_DEFAULT': 1,
      'EMPRESAS_ACTIVAS_LIMITE': 1,
      'DIAS_VALIDEZ_DOCUMENTOS': 1,
      'PAGINACION_DEFAULT': 5,
      'SESSION_TIMEOUT': 300
    };
    return minimos[nombre] || 0;
  }

  obtenerMaximo(): number {
    const nombre = this.data.configuracion.nombre;
    const maximos: { [key: string]: number } = {
      'ANIOS_VIGENCIA_DEFAULT': 50,
      'MAX_ANIOS_VIGENCIA': 100,
      'MIN_ANIOS_VIGENCIA': 10,
      'DIAS_ANTES_VENCIMIENTO_ALERTA': 365,
      'TIEMPO_PROCESAMIENTO_DEFAULT': 365,
      'MAX_TIEMPO_PROCESAMIENTO': 365,
      'EXPEDIENTES_POR_OFICINA_LIMITE': 10000,
      'DIAS_ANTES_VENCIMIENTO_EXPEDIENTE': 365,
      'CAPACIDAD_MAXIMA_DEFAULT': 10000,
      'EMPRESAS_ACTIVAS_LIMITE': 100000,
      'DIAS_VALIDEZ_DOCUMENTOS': 3650,
      'PAGINACION_DEFAULT': 100,
      'SESSION_TIMEOUT': 86400
    };
    return maximos[nombre] || 999999;
  }

  mostrarValidaciones(): boolean {
    return this.esConfiguracionNumerica() || this.esConfiguracionBooleana();
  }

  async guardar(): Promise<void> {
    if (this.formulario.invalid) {
      this.snackBar.open('Por favor, corrija los errores en el formulario', 'Cerrar', { duration: 3000 });
      return;
    }

    this.guardando = true;
    const datos = this.formulario.value;

    try {
      const resultado = await this.configuracionService.actualizarConfiguracion(
        this.data.configuracion.id,
        datos.valor
      );

      if (resultado) {
        this.guardando = false;
        this.snackBar.open('Configuración actualizada exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      } else {
        throw new Error('No se pudo actualizar la configuración');
      }
    } catch (error) {
      this.guardando = false;
      console.error('Error actualizando configuración::', error);
      this.snackBar.open('Error actualizando configuración', 'Cerrar', { duration: 3000 });
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
