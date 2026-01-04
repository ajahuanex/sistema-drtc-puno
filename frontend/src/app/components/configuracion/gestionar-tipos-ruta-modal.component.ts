import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { ConfiguracionService } from '../../services/configuracion.service';

export interface TipoRutaConfig {
  codigo: string;
  nombre: string;
  descripcion: string;
  estaActivo: boolean;
}

@Component({
  selector: 'app-gestionar-tipos-ruta-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>category</mat-icon>
        Gestionar Tipos de Ruta
      </h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      <div class="section">
        <h3>Agregar Nuevo Tipo de Ruta</h3>
        <form [formGroup]="nuevoTipoForm" class="nuevo-tipo-form">
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Código</mat-label>
              <input matInput formControlName="codigo" placeholder="Ej: URBANA">
              <mat-error *ngIf="nuevoTipoForm.get('codigo')?.hasError('required')">
                El código es obligatorio
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="nombre" placeholder="Ej: Urbana">
              <mat-error *ngIf="nuevoTipoForm.get('nombre')?.hasError('required')">
                El nombre es obligatorio
              </mat-error>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Descripción</mat-label>
            <textarea matInput formControlName="descripcion" rows="2" 
                      placeholder="Descripción del tipo de ruta"></textarea>
          </mat-form-field>

          <div class="form-actions">
            <button mat-raised-button color="primary" 
                    (click)="agregarTipo()" 
                    [disabled]="!nuevoTipoForm.valid">
              <mat-icon>add</mat-icon>
              Agregar
            </button>
          </div>
        </form>
      </div>

      <div class="section">
        <h3>Tipos de Ruta Configurados</h3>
        <mat-table [dataSource]="tiposRuta()" class="tipos-table">
          <ng-container matColumnDef="codigo">
            <mat-header-cell *matHeaderCellDef>Código</mat-header-cell>
            <mat-cell *matCellDef="let tipo">
              <span class="codigo-badge">{{ tipo.codigo }}</span>
            </mat-cell>
          </ng-container>

          <ng-container matColumnDef="nombre">
            <mat-header-cell *matHeaderCellDef>Nombre</mat-header-cell>
            <mat-cell *matCellDef="let tipo">{{ tipo.nombre }}</mat-cell>
          </ng-container>

          <ng-container matColumnDef="descripcion">
            <mat-header-cell *matHeaderCellDef>Descripción</mat-header-cell>
            <mat-cell *matCellDef="let tipo">{{ tipo.descripcion }}</mat-cell>
          </ng-container>

          <ng-container matColumnDef="activo">
            <mat-header-cell *matHeaderCellDef>Estado</mat-header-cell>
            <mat-cell *matCellDef="let tipo">
              <mat-checkbox [checked]="tipo.estaActivo" 
                            (change)="toggleActivo(tipo, $event.checked)">
                {{ tipo.estaActivo ? 'Activo' : 'Inactivo' }}
              </mat-checkbox>
            </mat-cell>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <mat-header-cell *matHeaderCellDef>Acciones</mat-header-cell>
            <mat-cell *matCellDef="let tipo">
              <button mat-icon-button color="warn" 
                      (click)="eliminarTipo(tipo)"
                      matTooltip="Eliminar tipo">
                <mat-icon>delete</mat-icon>
              </button>
            </mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
          <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
        </mat-table>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="guardarCambios()">
        <mat-icon>save</mat-icon>
        Guardar Cambios
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-content {
      padding: 24px;
      max-height: 600px;
      overflow-y: auto;
    }

    .section {
      margin-bottom: 32px;
    }

    .section h3 {
      margin-bottom: 16px;
      color: #333;
    }

    .nuevo-tipo-form {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-field {
      flex: 1;
    }

    .form-field-full {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .tipos-table {
      width: 100%;
    }

    .codigo-badge {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 12px;
    }

    .modal-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }
  `]
})
export class GestionarTiposRutaModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<GestionarTiposRutaModalComponent>);
  private snackBar = inject(MatSnackBar);
  private configuracionService = inject(ConfiguracionService);
  private fb = inject(FormBuilder);

  tiposRuta = signal<TipoRutaConfig[]>([]);
  displayedColumns = ['codigo', 'nombre', 'descripcion', 'activo', 'acciones'];

  nuevoTipoForm: FormGroup = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(/^[A-Z_]+$/)]],
    nombre: ['', [Validators.required]],
    descripcion: ['']
  });

  ngOnInit(): void {
    this.cargarTiposRuta();
  }

  private cargarTiposRuta(): void {
    // Obtener tipos de ruta desde configuración
    const config = this.configuracionService.getConfiguracion('TIPOS_RUTA_CONFIG');
    if (config && config.valor) {
      try {
        const tipos = JSON.parse(config.valor);
        this.tiposRuta.set(tipos);
      } catch (error) {
        console.error('Error parseando tipos de ruta:', error);
        this.tiposRuta.set(this.getTiposRutaDefault());
      }
    } else {
      this.tiposRuta.set(this.getTiposRutaDefault());
    }
  }

  private getTiposRutaDefault(): TipoRutaConfig[] {
    return [
      { codigo: 'URBANA', nombre: 'Urbana', descripcion: 'Transporte dentro de la ciudad', estaActivo: true },
      { codigo: 'INTERURBANA', nombre: 'Interurbana', descripcion: 'Transporte entre ciudades cercanas', estaActivo: true },
      { codigo: 'INTERPROVINCIAL', nombre: 'Interprovincial', descripcion: 'Transporte entre provincias', estaActivo: true },
      { codigo: 'INTERREGIONAL', nombre: 'Interregional', descripcion: 'Transporte entre regiones', estaActivo: true },
      { codigo: 'RURAL', nombre: 'Rural', descripcion: 'Transporte en zonas rurales', estaActivo: true }
    ];
  }

  agregarTipo(): void {
    if (this.nuevoTipoForm.valid) {
      const nuevoTipo: TipoRutaConfig = {
        ...this.nuevoTipoForm.value,
        estaActivo: true
      };

      // Verificar que no exista el código
      const tipos = this.tiposRuta();
      if (tipos.some(t => t.codigo === nuevoTipo.codigo)) {
        this.snackBar.open('Ya existe un tipo de ruta con ese código', 'Cerrar', { duration: 3000 });
        return;
      }

      this.tiposRuta.set([...tipos, nuevoTipo]);
      this.nuevoTipoForm.reset();
      this.snackBar.open('Tipo de ruta agregado', 'Cerrar', { duration: 2000 });
    }
  }

  toggleActivo(tipo: TipoRutaConfig, activo: boolean): void {
    const tipos = this.tiposRuta();
    const index = tipos.findIndex(t => t.codigo === tipo.codigo);
    if (index !== -1) {
      tipos[index].estaActivo = activo;
      this.tiposRuta.set([...tipos]);
    }
  }

  eliminarTipo(tipo: TipoRutaConfig): void {
    if (confirm(`¿Está seguro de eliminar el tipo de ruta "${tipo.nombre}"?`)) {
      const tipos = this.tiposRuta().filter(t => t.codigo !== tipo.codigo);
      this.tiposRuta.set(tipos);
      this.snackBar.open('Tipo de ruta eliminado', 'Cerrar', { duration: 2000 });
    }
  }

  async guardarCambios(): Promise<void> {
    try {
      const tiposActivos = this.tiposRuta().filter(t => t.estaActivo);
      const valorConfig = JSON.stringify(this.tiposRuta());
      
      // Buscar la configuración existente
      let config = this.configuracionService.getConfiguracion('TIPOS_RUTA_CONFIG');
      
      if (config) {
        await this.configuracionService.actualizarConfiguracion(config.id, valorConfig);
      } else {
        // Crear nueva configuración si no existe
        this.configuracionService.crearConfiguracion({
          nombre: 'TIPOS_RUTA_CONFIG',
          valor: valorConfig,
          descripcion: 'Configuración de tipos de ruta disponibles',
          categoria: 'SISTEMA' as any,
          esEditable: true
        }).subscribe();
      }

      this.snackBar.open('Tipos de ruta guardados exitosamente', 'Cerrar', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error guardando tipos de ruta:', error);
      this.snackBar.open('Error guardando los cambios', 'Cerrar', { duration: 3000 });
    }
  }
}