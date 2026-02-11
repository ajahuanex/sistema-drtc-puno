import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RutaService } from '../../services/ruta.service';
import { Ruta, RutaUpdate } from '../../models/ruta.model';
import { Localidad } from '../../models/localidad.model';
import { BuscarLocalidadDialogComponent } from '../../shared/buscar-localidad-dialog.component';

export interface EditarRutaModalData {
  ruta: Ruta;
}

@Component({
  selector: 'app-editar-ruta-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Editar Ruta - {{ data.ruta.codigoRuta }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="campo-seleccion">
          <label>Origen *</label>
          <div class="seleccion-display" [class.has-value]="origenSeleccionado" [class.error]="!origenSeleccionado">
            <span *ngIf="origenSeleccionado" class="value">{{ origenSeleccionado.nombre }}</span>
            <span *ngIf="!origenSeleccionado" class="placeholder">Seleccionar origen...</span>
            <button mat-icon-button type="button" (click)="buscarOrigen()">
              <mat-icon>search</mat-icon>
            </button>
          </div>
        </div>

        <div class="campo-seleccion">
          <label>Destino *</label>
          <div class="seleccion-display" [class.has-value]="destinoSeleccionado" [class.error]="!destinoSeleccionado">
            <span *ngIf="destinoSeleccionado" class="value">{{ destinoSeleccionado.nombre }}</span>
            <span *ngIf="!destinoSeleccionado" class="placeholder">Seleccionar destino...</span>
            <button mat-icon-button type="button" (click)="buscarDestino()">
              <mat-icon>search</mat-icon>
            </button>
          </div>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Frecuencias</mat-label>
          <input matInput formControlName="frecuencias">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo Ruta</mat-label>
          <mat-select formControlName="tipoRuta">
            <mat-option [value]="null">Sin especificar</mat-option>
            <mat-option value="URBANA">Urbana</mat-option>
            <mat-option value="INTERURBANA">Interurbana</mat-option>
            <mat-option value="INTERPROVINCIAL">Interprovincial</mat-option>
            <mat-option value="INTERREGIONAL">Interregional</mat-option>
            <mat-option value="RURAL">Rural</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="estado">
            <mat-option value="ACTIVA">Activa</mat-option>
            <mat-option value="INACTIVA">Inactiva</mat-option>
            <mat-option value="SUSPENDIDA">Suspendida</mat-option>
            <mat-option value="EN_MANTENIMIENTO">En Mantenimiento</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Distancia (km)</mat-label>
          <input matInput type="number" formControlName="distancia">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observaciones</mat-label>
          <textarea matInput formControlName="observaciones" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="guardar()" [disabled]="!valido()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
      padding: 20px;
    }
    
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    mat-form-field {
      width: 100%;
    }
    
    .campo-seleccion {
      margin-bottom: 16px;
    }
    
    .campo-seleccion label {
      display: block;
      font-size: 12px;
      color: rgba(0,0,0,0.6);
      margin-bottom: 4px;
    }
    
    .seleccion-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 4px;
      min-height: 56px;
    }
    
    .seleccion-display .placeholder {
      color: rgba(0,0,0,0.38);
    }

    .seleccion-display.has-value {
      border-color: #1976d2;
      background-color: #e3f2fd;
    }

    .seleccion-display .value {
      font-weight: 500;
      color: #1976d2;
    }

    .seleccion-display.error {
      border-color: #f44336;
      background-color: #ffebee;
    }
  `]
})
export class EditarRutaModalComponent implements OnInit {
  form: FormGroup;
  origenSeleccionado: Localidad | null = null;
  destinoSeleccionado: Localidad | null = null;

  constructor(
    private fb: FormBuilder,
    private rutaService: RutaService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<EditarRutaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditarRutaModalData
  ) {
    this.form = this.fb.group({
      frecuencias: [data.ruta.frecuencias, Validators.required],
      tipoRuta: [data.ruta.tipoRuta],
      estado: [data.ruta.estado, Validators.required],
      distancia: [data.ruta.distancia],
      observaciones: [data.ruta.observaciones]
    });

    if (typeof data.ruta.origen === 'object') {
      this.origenSeleccionado = data.ruta.origen as any;
    }
    if (typeof data.ruta.destino === 'object') {
      this.destinoSeleccionado = data.ruta.destino as any;
    }
  }

  ngOnInit() { }

  buscarOrigen() {
    const dialogRef = this.dialog.open(BuscarLocalidadDialogComponent, {
      width: '600px',
      data: { titulo: 'Seleccionar Origen' }
    });

    dialogRef.afterClosed().subscribe(localidad => {
      if (localidad) {
        this.origenSeleccionado = localidad;
        this.validarOrigenDestinoDiferentes();
      }
    });
  }

  buscarDestino() {
    const dialogRef = this.dialog.open(BuscarLocalidadDialogComponent, {
      width: '600px',
      data: { titulo: 'Seleccionar Destino' }
    });

    dialogRef.afterClosed().subscribe(localidad => {
      if (localidad) {
        this.destinoSeleccionado = localidad;
        this.validarOrigenDestinoDiferentes();
      }
    });
  }

  private validarOrigenDestinoDiferentes() {
    if (this.origenSeleccionado && this.destinoSeleccionado) {
      if (this.origenSeleccionado.id === this.destinoSeleccionado.id) {
        this.snackBar.open('El origen y destino deben ser diferentes', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    }
  }

  valido(): boolean {
    const formValido = this.form.valid;
    const localidadesSeleccionadas = !!this.origenSeleccionado && !!this.destinoSeleccionado;
    const localidadesDiferentes = this.origenSeleccionado?.id !== this.destinoSeleccionado?.id;

    return formValido && localidadesSeleccionadas && localidadesDiferentes;
  }

  guardar() {
    if (!this.valido()) return;

    const update: RutaUpdate = {
      origen: { id: this.origenSeleccionado!.id, nombre: this.origenSeleccionado!.nombre },
      destino: { id: this.destinoSeleccionado!.id, nombre: this.destinoSeleccionado!.nombre },
      frecuencias: this.form.value.frecuencias,
      tipoRuta: this.form.value.tipoRuta,
      estado: this.form.value.estado,
      distancia: this.form.value.distancia,
      observaciones: this.form.value.observaciones,
      nombre: `${this.origenSeleccionado!.nombre} - ${this.destinoSeleccionado!.nombre}`
    };

    this.rutaService.updateRuta(this.data.ruta.id, update).subscribe({
      next: (ruta) => {
        this.snackBar.open('Ruta actualizada', 'OK', { duration: 2000 });
        this.dialogRef.close(ruta);
      },
      error: () => {
        this.snackBar.open('Error al actualizar', 'OK', { duration: 2000 });
      }
    });
  }
}
