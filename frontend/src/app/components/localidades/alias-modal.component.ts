import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { LocalidadAliasService } from '../../services/localidad-alias.service';
import { LocalidadService } from '../../services/localidad.service';
import { LocalidadAlias, LocalidadAliasCreate, LocalidadAliasUpdate } from '../../models/localidad-alias.model';
import { Localidad } from '../../models/localidad.model';

export interface AliasModalData {
  modo: 'crear' | 'editar';
  alias?: LocalidadAlias;
  aliasPreestablecido?: string; // Nombre de alias preestablecido
  localidadPreestablecida?: any; // Localidad preestablecida
}

@Component({
  selector: 'app-alias-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatAutocompleteModule
  ],
  template: `
    <div class="alias-modal">
      <h2 mat-dialog-title>
        <mat-icon>{{ data.modo === 'crear' ? 'add' : 'edit' }}</mat-icon>
        {{ data.modo === 'crear' ? 'Crear Nuevo Alias' : 'Editar Alias' }}
      </h2>

      <mat-dialog-content>
        <form #aliasForm="ngForm">
          <!-- Alias -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Alias (Nombre Alternativo)</mat-label>
            <input matInput 
                   [(ngModel)]="formData.alias"
                   name="alias"
                   required
                   placeholder="Ej: C.P. LA RINCONADA"
                   [disabled]="guardando">
            <mat-icon matSuffix>label</mat-icon>
            <mat-hint>Nombre alternativo usado en las rutas</mat-hint>
          </mat-form-field>

          <!-- Buscar Localidad -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Buscar Localidad Oficial</mat-label>
            <input matInput
                   [(ngModel)]="busquedaLocalidad"
                   name="busqueda"
                   (input)="buscarLocalidades()"
                   [matAutocomplete]="auto"
                   placeholder="Buscar por nombre..."
                   [disabled]="guardando">
            <mat-icon matSuffix>search</mat-icon>
            <mat-autocomplete #auto="matAutocomplete" (optionSelected)="seleccionarLocalidad($event.option.value)">
              @for (loc of localidadesEncontradas; track loc.id) {
                <mat-option [value]="loc">
                  <div class="localidad-option">
                    <div class="localidad-info">
                      <strong>{{ loc.nombre }}</strong>
                      <span class="tipo">{{ getTipoLabel(loc.tipo) }}</span>
                    </div>
                    @if (getPertenencia(loc)) {
                      <span class="pertenencia">{{ getPertenencia(loc) }}</span>
                    }
                  </div>
                </mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>

          <!-- Localidad Seleccionada -->
          @if (formData.localidad_nombre) {
            <div class="localidad-seleccionada">
              <mat-icon>check_circle</mat-icon>
              <div>
                <strong>Localidad Oficial:</strong>
                <span>{{ formData.localidad_nombre }}</span>
              </div>
              <button mat-icon-button (click)="limpiarLocalidad()" type="button">
                <mat-icon>clear</mat-icon>
              </button>
            </div>
          }

          <!-- Verificado -->
          <div class="checkbox-field">
            <mat-checkbox [(ngModel)]="formData.verificado" name="verificado" [disabled]="guardando">
              Verificado manualmente
            </mat-checkbox>
            <mat-hint>Marca si has verificado que el alias es correcto</mat-hint>
          </div>

          <!-- Notas -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Notas (Opcional)</mat-label>
            <textarea matInput
                      [(ngModel)]="formData.notas"
                      name="notas"
                      rows="3"
                      placeholder="Información adicional sobre este alias"
                      [disabled]="guardando"></textarea>
            <mat-icon matSuffix>notes</mat-icon>
          </mat-form-field>
        </form>

        @if (buscando) {
          <div class="loading-indicator">
            <mat-progress-spinner mode="indeterminate" diameter="30"></mat-progress-spinner>
            <span>Buscando localidades...</span>
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancelar()" [disabled]="guardando">
          Cancelar
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="guardar()"
                [disabled]="!aliasForm.valid || !formData.localidad_id || guardando">
          @if (guardando) {
            <mat-progress-spinner mode="indeterminate" diameter="20"></mat-progress-spinner>
          }
          {{ data.modo === 'crear' ? 'Crear Alias' : 'Guardar Cambios' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .alias-modal {
      min-width: 500px;

      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
      }
    }

    mat-dialog-content {
      padding: 24px;
      min-height: 300px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .localidad-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
      padding: 4px 0;

      .localidad-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;

        strong {
          flex: 1;
        }

        .tipo {
          font-size: 11px;
          color: #666;
          background: #f5f5f5;
          padding: 2px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }
      }

      .pertenencia {
        font-size: 12px;
        color: #888;
        font-style: italic;
      }
    }

    .localidad-seleccionada {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #e8f5e9;
      border-radius: 8px;
      margin-bottom: 16px;

      mat-icon:first-child {
        color: #4caf50;
      }

      div {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;

        strong {
          font-size: 12px;
          color: #666;
        }

        span {
          font-size: 14px;
          color: #333;
        }
      }
    }

    .checkbox-field {
      margin-bottom: 16px;

      mat-hint {
        font-size: 12px;
        color: #666;
        margin-top: 4px;
        display: block;
      }
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-top: 16px;

      span {
        color: #666;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;

      button {
        margin-left: 8px;
      }
    }

    @media (max-width: 600px) {
      .alias-modal {
        min-width: auto;
        width: 100%;
      }
    }
  `]
})
export class AliasModalComponent implements OnInit {
  formData: any = {
    alias: '',
    localidad_id: '',
    localidad_nombre: '',
    verificado: false,
    notas: ''
  };

  busquedaLocalidad = '';
  localidadesEncontradas: Localidad[] = [];
  buscando = false;
  guardando = false;

  constructor(
    public dialogRef: MatDialogRef<AliasModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AliasModalData,
    private aliasService: LocalidadAliasService,
    private localidadService: LocalidadService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.data.modo === 'editar' && this.data.alias) {
      this.formData = {
        alias: this.data.alias.alias,
        localidad_id: this.data.alias.localidad_id,
        localidad_nombre: this.data.alias.localidad_nombre,
        verificado: this.data.alias.verificado,
        notas: this.data.alias.notas || ''
      };
    } else if (this.data.aliasPreestablecido) {
      // Si viene un alias preestablecido desde verificación de coordenadas
      this.formData.alias = this.data.aliasPreestablecido;
    } else if (this.data.localidadPreestablecida) {
      // Si viene una localidad preestablecida desde gestión de alias
      this.formData.localidad_id = this.data.localidadPreestablecida.id;
      this.formData.localidad_nombre = this.data.localidadPreestablecida.nombre;
    }
  }

  async buscarLocalidades(): Promise<void> {
    const termino = this.busquedaLocalidad.trim();
    
    if (termino.length < 2) {
      this.localidadesEncontradas = [];
      return;
    }

    this.buscando = true;
    
    try {
      const localidades = await this.localidadService.buscarLocalidades(termino, 20);
      this.localidadesEncontradas = localidades;
    } catch (error) {
      console.error('Error buscando localidades:', error);
    } finally {
      this.buscando = false;
    }
  }

  seleccionarLocalidad(localidad: Localidad): void {
    this.formData.localidad_id = localidad.id;
    this.formData.localidad_nombre = localidad.nombre;
    this.busquedaLocalidad = '';
    this.localidadesEncontradas = [];
  }

  limpiarLocalidad(): void {
    this.formData.localidad_id = '';
    this.formData.localidad_nombre = '';
  }

  async guardar(): Promise<void> {
    if (!this.formData.alias || !this.formData.localidad_id) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.guardando = true;

    try {
      if (this.data.modo === 'crear') {
        const nuevoAlias: LocalidadAliasCreate = {
          alias: this.formData.alias,
          localidad_id: this.formData.localidad_id,
          localidad_nombre: this.formData.localidad_nombre,
          verificado: this.formData.verificado,
          notas: this.formData.notas || undefined
        };

        await this.aliasService.crearAlias(nuevoAlias).toPromise();
        this.snackBar.open('Alias creado exitosamente', 'Cerrar', { duration: 3000 });
      } else {
        const actualizacion: LocalidadAliasUpdate = {
          alias: this.formData.alias,
          localidad_id: this.formData.localidad_id,
          localidad_nombre: this.formData.localidad_nombre,
          verificado: this.formData.verificado,
          notas: this.formData.notas || undefined
        };

        await this.aliasService.actualizarAlias(this.data.alias!.id, actualizacion).toPromise();
        this.snackBar.open('Alias actualizado exitosamente', 'Cerrar', { duration: 3000 });
      }

      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error guardando alias:', error);
      const mensaje = error?.error?.detail || 'Error al guardar el alias';
      this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
    } finally {
      this.guardando = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  /**
   * Obtiene la etiqueta legible del tipo de localidad
   */
  getTipoLabel(tipo: string): string {
    const labels: { [key: string]: string } = {
      'PROVINCIA': 'Provincia',
      'DISTRITO': 'Distrito',
      'CENTRO_POBLADO': 'C.P.',
      'DEPARTAMENTO': 'Departamento',
      'CIUDAD': 'Ciudad',
      'PUEBLO': 'Pueblo',
      'LOCALIDAD': 'Localidad'
    };
    return labels[tipo] || tipo;
  }

  /**
   * Obtiene la cadena de pertenencia de una localidad
   * Ej: "Distrito de Ananea, Provincia de San Antonio de Putina"
   */
  getPertenencia(localidad: Localidad): string {
    const partes: string[] = [];

    // Si es centro poblado, mostrar distrito y provincia
    if (localidad.tipo === 'CENTRO_POBLADO') {
      if (localidad.distrito) {
        partes.push(`Distrito de ${localidad.distrito}`);
      }
      if (localidad.provincia) {
        partes.push(`Provincia de ${localidad.provincia}`);
      }
    }
    // Si es distrito, mostrar solo provincia
    else if (localidad.tipo === 'DISTRITO') {
      if (localidad.provincia) {
        partes.push(`Provincia de ${localidad.provincia}`);
      }
    }
    // Si es provincia, mostrar departamento
    else if (localidad.tipo === 'PROVINCIA') {
      if (localidad.departamento) {
        partes.push(`Departamento de ${localidad.departamento}`);
      }
    }

    return partes.join(', ');
  }
}
