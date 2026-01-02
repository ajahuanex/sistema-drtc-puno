import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ConfiguracionSistema } from '../../models/configuracion.model';
import { ConfiguracionService } from '../../services/configuracion.service';

export interface EditarConfiguracionConDefaultData {
  configuracion: ConfiguracionSistema;
}

interface OpcionConfigurable {
  valor: string;
  esDefault: boolean;
  label?: string;
}

@Component({
  selector: 'app-editar-configuracion-con-default-modal',
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
    MatChipsModule,
    MatDividerModule,
    ReactiveFormsModule,
    FormsModule
  ],
  template: `
    <div class="editar-configuracion-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>tune</mat-icon>
          Configurar {{ getTituloConfiguracion() }}
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
          <!-- Para configuraciones de lista con valores por defecto -->
          <div *ngIf="esConfiguracionLista()" class="lista-opciones">
            <h3>
              <mat-icon>list</mat-icon>
              Opciones Disponibles
            </h3>
            <p class="help-text">
              Gestiona las opciones disponibles y marca cuál será la opción por defecto
            </p>

            <div class="opciones-container">
              <div *ngFor="let opcion of opciones; let i = index" 
                   class="opcion-item"
                   [class.es-default]="opcion.esDefault">
                <div class="opcion-content">
                  <mat-form-field appearance="outline" class="valor-field">
                    <mat-label>Valor</mat-label>
                    <input matInput 
                           [(ngModel)]="opcion.valor"
                           [ngModelOptions]="{standalone: true}"
                           placeholder="Ingrese el valor">
                  </mat-form-field>
                  
                  <mat-checkbox 
                    [(ngModel)]="opcion.esDefault"
                    [ngModelOptions]="{standalone: true}"
                    (change)="onDefaultChange(i)"
                    color="primary"
                    class="default-checkbox">
                    Por defecto
                  </mat-checkbox>
                </div>
                
                <div class="opcion-actions">
                  <button mat-icon-button 
                          color="warn"
                          (click)="eliminarOpcion(i)"
                          [disabled]="opciones.length <= 1"
                          matTooltip="Eliminar opción">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <div class="agregar-opcion">
              <button mat-stroked-button 
                      color="primary"
                      (click)="agregarOpcion()">
                <mat-icon>add</mat-icon>
                Agregar Opción
              </button>
            </div>
          </div>

          <!-- Para configuraciones de estados (JSON) -->
          <div *ngIf="esConfiguracionEstados()" class="estados-container">
            <h3>
              <mat-icon>settings</mat-icon>
              Estados de Vehículos
            </h3>
            <p class="help-text">
              Configura los estados disponibles para vehículos. Uno debe estar marcado como por defecto.
            </p>

            <div class="estados-list">
              <div *ngFor="let estado of estados; let i = index" 
                   class="estado-item"
                   [class.es-default]="estado.esDefault">
                <div class="estado-header">
                  <mat-form-field appearance="outline" class="codigo-field">
                    <mat-label>Código</mat-label>
                    <input matInput 
                           [(ngModel)]="estado.codigo"
                           [ngModelOptions]="{standalone: true}"
                           placeholder="CODIGO_ESTADO">
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="nombre-field">
                    <mat-label>Nombre</mat-label>
                    <input matInput 
                           [(ngModel)]="estado.nombre"
                           [ngModelOptions]="{standalone: true}"
                           placeholder="Nombre del estado">
                  </mat-form-field>
                  
                  <div class="color-field">
                    <label>Color</label>
                    <input type="color" 
                           [(ngModel)]="estado.color"
                           [ngModelOptions]="{standalone: true}"
                           class="color-picker">
                  </div>
                </div>
                
                <mat-form-field appearance="outline" class="descripcion-field">
                  <mat-label>Descripción</mat-label>
                  <textarea matInput 
                            [(ngModel)]="estado.descripcion"
                            [ngModelOptions]="{standalone: true}"
                            rows="2"
                            placeholder="Descripción del estado"></textarea>
                </mat-form-field>
                
                <div class="estado-actions">
                  <mat-checkbox 
                    [(ngModel)]="estado.esDefault"
                    [ngModelOptions]="{standalone: true}"
                    (change)="onEstadoDefaultChange(i)"
                    color="primary"
                    class="default-checkbox">
                    Estado por defecto
                  </mat-checkbox>
                  
                  <button mat-icon-button 
                          color="warn"
                          (click)="eliminarEstado(i)"
                          [disabled]="estados.length <= 1"
                          matTooltip="Eliminar estado">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <div class="agregar-estado">
              <button mat-stroked-button 
                      color="primary"
                      (click)="agregarEstado()">
                <mat-icon>add</mat-icon>
                Agregar Estado
              </button>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Configuración adicional -->
          <div class="configuracion-adicional">
            <h3>Configuración Adicional</h3>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Descripción</mat-label>
                <textarea matInput 
                          formControlName="descripcion" 
                          rows="3"
                          placeholder="Descripción de la configuración"></textarea>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-checkbox formControlName="esEditable" 
                            color="primary">
                Permitir edición por usuarios
              </mat-checkbox>
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
                [disabled]="!formularioValido() || guardando"
                class="save-button">
          <mat-icon>save</mat-icon>
          {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .editar-configuracion-modal {
      min-width: 700px;
      max-width: 900px;
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

    .configuracion-info {
      margin-bottom: 24px;

      .info-card {
        background-color: #f8f9fa;
        border: 1px solid #e0e0e0;
      }
    }

    .lista-opciones, .estados-container {
      margin-bottom: 24px;

      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #333;
        margin-bottom: 8px;
      }

      .help-text {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 16px;
      }
    }

    .opciones-container {
      margin-bottom: 16px;
    }

    .opcion-item, .estado-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 12px;
      background: white;

      &.es-default {
        border-color: #1976d2;
        background-color: #e3f2fd;
      }

      .opcion-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 16px;

        .valor-field {
          flex: 1;
        }

        .default-checkbox {
          margin-left: auto;
        }
      }
    }

    .estado-item {
      flex-direction: column;
      align-items: stretch;

      .estado-header {
        display: flex;
        gap: 16px;
        align-items: center;
        margin-bottom: 12px;

        .codigo-field {
          flex: 1;
        }

        .nombre-field {
          flex: 2;
        }

        .color-field {
          display: flex;
          flex-direction: column;
          gap: 4px;

          label {
            font-size: 0.8rem;
            color: #666;
          }

          .color-picker {
            width: 50px;
            height: 40px;
            border: 1px solid #ccc;
            border-radius: 4px;
            cursor: pointer;
          }
        }
      }

      .descripcion-field {
        width: 100%;
        margin-bottom: 12px;
      }

      .estado-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }

    .agregar-opcion, .agregar-estado {
      text-align: center;
      margin: 16px 0;
    }

    .configuracion-adicional {
      margin-top: 24px;

      h3 {
        color: #333;
        margin-bottom: 16px;
      }

      .form-row {
        margin-bottom: 16px;

        .full-width {
          width: 100%;
        }
      }
    }

    mat-dialog-actions {
      padding: 24px 0 0 0;
      margin: 0;

      .save-button {
        background-color: #1976d2;
        color: white;

        &:disabled {
          background-color: #ccc;
          color: #666;
        }
      }
    }

    @media (max-width: 768px) {
      .editar-configuracion-modal {
        min-width: 100%;
        max-width: 100%;
      }

      .estado-header {
        flex-direction: column;
        align-items: stretch !important;

        .codigo-field, .nombre-field {
          flex: none !important;
        }
      }
    }
  `]
})
export class EditarConfiguracionConDefaultModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<EditarConfiguracionConDefaultModalComponent>);
  private snackBar = inject(MatSnackBar);
  private configuracionService = inject(ConfiguracionService);
  private fb = inject(FormBuilder);

  data: EditarConfiguracionConDefaultData = inject(MAT_DIALOG_DATA);
  
  formulario: FormGroup;
  guardando = false;
  
  // Para configuraciones de lista
  opciones: OpcionConfigurable[] = [];
  
  // Para configuraciones de estados
  estados: any[] = [];

  constructor() {
    this.formulario = this.fb.group({
      descripcion: [this.data.configuracion.descripcion, [Validators.maxLength(500)]],
      esEditable: [this.data.configuracion.esEditable]
    });
  }

  ngOnInit(): void {
    this.inicializarDatos();
  }

  private inicializarDatos(): void {
    if (this.esConfiguracionLista()) {
      this.inicializarOpciones();
    } else if (this.esConfiguracionEstados()) {
      this.inicializarEstados();
    }
  }

  private inicializarOpciones(): void {
    const valores = this.data.configuracion.valor.split(',');
    const valorDefault = this.data.configuracion.valorDefault;
    
    this.opciones = valores.map(valor => ({
      valor: valor.trim(),
      esDefault: valor.trim() === valorDefault
    }));
  }

  private inicializarEstados(): void {
    try {
      this.estados = JSON.parse(this.data.configuracion.valor);
    } catch (error) {
      console.error('Error parseando estados:', error);
      this.estados = [
        { codigo: 'HABILITADO', nombre: 'Habilitado', color: '#4CAF50', descripcion: 'Vehículo operativo', esDefault: true }
      ];
    }
  }

  esConfiguracionLista(): boolean {
    return ['CATEGORIAS_VEHICULOS', 'TIPOS_CARROCERIA', 'TIPOS_COMBUSTIBLE'].includes(this.data.configuracion.nombre);
  }

  esConfiguracionEstados(): boolean {
    return this.data.configuracion.nombre === 'ESTADOS_VEHICULOS_CONFIG';
  }

  getTituloConfiguracion(): string {
    const titulos: { [key: string]: string } = {
      'CATEGORIAS_VEHICULOS': 'Categorías de Vehículos',
      'TIPOS_CARROCERIA': 'Tipos de Carrocería',
      'TIPOS_COMBUSTIBLE': 'Tipos de Combustible',
      'ESTADOS_VEHICULOS_CONFIG': 'Estados de Vehículos'
    };
    return titulos[this.data.configuracion.nombre] || 'Configuración';
  }

  agregarOpcion(): void {
    this.opciones.push({
      valor: '',
      esDefault: false
    });
  }

  eliminarOpcion(index: number): void {
    if (this.opciones.length > 1) {
      this.opciones.splice(index, 1);
    }
  }

  onDefaultChange(index: number): void {
    // Solo una opción puede ser por defecto
    this.opciones.forEach((opcion, i) => {
      if (i !== index) {
        opcion.esDefault = false;
      }
    });
  }

  agregarEstado(): void {
    this.estados.push({
      codigo: '',
      nombre: '',
      color: '#2196F3',
      descripcion: '',
      esDefault: false
    });
  }

  eliminarEstado(index: number): void {
    if (this.estados.length > 1) {
      this.estados.splice(index, 1);
    }
  }

  onEstadoDefaultChange(index: number): void {
    // Solo un estado puede ser por defecto
    this.estados.forEach((estado, i) => {
      if (i !== index) {
        estado.esDefault = false;
      }
    });
  }

  formularioValido(): boolean {
    if (this.esConfiguracionLista()) {
      const tieneDefault = this.opciones.some(o => o.esDefault);
      const valoresCompletos = this.opciones.every(o => o.valor.trim() !== '');
      return tieneDefault && valoresCompletos;
    }
    
    if (this.esConfiguracionEstados()) {
      const tieneDefault = this.estados.some(e => e.esDefault);
      const estadosCompletos = this.estados.every(e => 
        e.codigo.trim() !== '' && e.nombre.trim() !== ''
      );
      return tieneDefault && estadosCompletos;
    }
    
    return this.formulario.valid;
  }

  async guardar(): Promise<void> {
    if (!this.formularioValido()) {
      this.snackBar.open('Por favor, complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.guardando = true;

    try {
      let nuevoValor = '';
      
      if (this.esConfiguracionLista()) {
        nuevoValor = this.opciones.map(o => o.valor.trim()).join(',');
      } else if (this.esConfiguracionEstados()) {
        nuevoValor = JSON.stringify(this.estados);
      }

      const resultado = await this.configuracionService.actualizarConfiguracion(
        this.data.configuracion.id,
        nuevoValor
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
      console.error('Error actualizando configuración:', error);
      this.snackBar.open('Error actualizando configuración', 'Cerrar', { duration: 3000 });
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}