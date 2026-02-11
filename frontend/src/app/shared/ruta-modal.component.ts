import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { RutaFormComponent, RutaFormConfig } from './ruta-form.component';
import { Ruta } from '../models/ruta.model';
import { Empresa } from '../models/empresa.model';
import { Resolucion } from '../models/resolucion.model';

export interface RutaModalData {
  empresa?: Empresa;
  resolucion?: Resolucion;
  ruta?: Ruta; // Para edición
  rutasExistentes?: Ruta[]; // Rutas existentes de la resolución
  titulo?: string;
  modoSimple?: boolean;
}

@Component({
  selector: 'app-ruta-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    RutaFormComponent
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>{{ data.ruta ? 'edit_road' : 'add_road' }}</mat-icon>
        {{ data.titulo || (data.ruta ? 'Editar Ruta' : 'Nueva Ruta') }}
      </h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      <app-ruta-form 
        [config]="formConfig"
        (rutaCreada)="onRutaCreada($event)"
        (rutaActualizada)="onRutaActualizada($event)"
        (cancelado)="onCancelado()">
      </app-ruta-form>
    </mat-dialog-content>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      margin: -24px -24px 0 -24px;
      position: relative;
      z-index: 1;
    }

    .modal-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #333;
    }

    .modal-content {
      padding: 24px 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    ::ng-deep .mat-mdc-dialog-container {
      --mdc-dialog-container-color: white;
    }
  `]
})
export class RutaModalComponent {
  formConfig: RutaFormConfig;

  constructor(
    private dialogRef: MatDialogRef<RutaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RutaModalData
  ) {
    this.formConfig = {
      empresa: data.empresa,
      resolucion: data.resolucion,
      ruta: data.ruta,
      rutasExistentes: data.rutasExistentes || [],
      modoSimple: data.modoSimple ?? false,
      mostrarBotones: true
    };
  }

  onRutaCreada(ruta: Ruta) {
    this.dialogRef.close(ruta);
  }

  onRutaActualizada(ruta: Ruta) {
    this.dialogRef.close(ruta);
  }

  onCancelado() {
    this.dialogRef.close();
  }
}