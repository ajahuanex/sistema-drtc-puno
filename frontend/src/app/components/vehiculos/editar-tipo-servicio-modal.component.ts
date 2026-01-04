import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { Vehiculo } from '../../models/vehiculo.model';
import { VehiculoService } from '../../services/vehiculo.service';
import { ConfiguracionService } from '../../services/configuracion.service';

export interface EditarTipoServicioModalData {
  vehiculo: Vehiculo;
}

export interface TipoServicioConfig {
  codigo: string;
  nombre: string;
  descripcion: string;
  estaActivo: boolean;
}

@Component({
  selector: 'app-editar-tipo-servicio-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCardModule,
    SmartIconComponent
  ],
  template: `
    <h2 mat-dialog-title>Editar Tipo de Servicio</h2>
    <mat-dialog-content>
      <p>Funcionalidad en desarrollo</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `
})
export class EditarTipoServicioModalComponent {
  constructor(
    private dialogRef: MatDialogRef<EditarTipoServicioModalComponent>
  ) {}
}