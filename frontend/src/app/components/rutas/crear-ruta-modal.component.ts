import { Component, Inject, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RutaService } from '../../services/ruta.service';
import { ConfiguracionService } from '../../services/configuracion.service';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { RutaCreate, TipoRuta } from '../../models/ruta.model';

export interface CrearRutaModalData {
  empresa: Empresa;
  resolucion: Resolucion;
}

@Component({
  selector: 'app-crear-ruta-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>add_road</mat-icon>
        Nueva Ruta
      </h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      <div class="empresa-info">
        <div class="info-card">
          <div class="info-label">Empresa:</div>
          <div class="info-value">{{ data.empresa.razonSocial }}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Resolución:</div>
          <div class="info-value">{{ data.resolucion.nroResolucion }}</div>
        </div>
      </div>

      <form [formGroup]="rutaForm" class="ruta-form">
        <div class="form-row">
          <mat-form-field appearance="outline" class="codigo-field">
            <mat-label>Código de Ruta</mat-label>
            <input matInput formControlName="codigoRuta" placeholder="01" readonly>
            <mat-hint>Se genera automáticamente</mat-hint>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Origen</mat-label>
            <input matInput formControlName="origen" placeholder="Ciudad de origen">
            <mat-icon matSuffix>place</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Destino</mat-label>
            <input matInput formControlName="destino" placeholder="Ciudad de destino">
            <mat-icon matSuffix>flag</mat-icon>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Frecuencias</mat-label>
            <input matInput formControlName="frecuencias" placeholder="Ej: Diaria, Lunes a Viernes">
            <mat-icon matSuffix>schedule</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tipo de Ruta</mat-label>
            <mat-select formControlName="tipoRuta">
              <mat-option [value]="null">Sin especificar</mat-option>
              @for (tipo of tiposRuta; track tipo.value) {
                <mat-option [value]="tipo.value">{{ tipo.label }}</mat-option>
              }
            </mat-select>
            <mat-hint>Opcional - Puedes dejarlo sin especificar</mat-hint>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Itinerario (Opcional)</mat-label>
            <textarea matInput 
                      formControlName="itinerario" 
                      rows="3" 
                      placeholder="Describe el recorrido detallado de la ruta..."></textarea>
            <mat-icon matSuffix>route</mat-icon>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observaciones (Opcional)</mat-label>
            <textarea matInput 
                      formControlName="observaciones" 
                      rows="2" 
                      placeholder="Observaciones adicionales..."></textarea>
            <mat-icon matSuffix>note</mat-icon>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button mat-button mat-dialog-close type="button">
        <mat-icon>cancel</mat-icon>
        Cancelar
      </button>
      
      <button mat-raised-button 
              color="primary" 
              (click)="guardarRuta()"
              [disabled]="rutaForm.invalid || isSubmitting">
        <mat-spinner *ngIf="isSubmitting" diameter="20"></mat-spinner>
        <mat-icon *ngIf="!isSubmitting">save</mat-icon>
        {{ isSubmitting ? 'Guardando...' : 'Guardar Ruta' }}
      </button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./crear-ruta-modal.component.scss']
})
export class CrearRutaModalComponent implements OnInit {
  private configuracionService = inject(ConfiguracionService);
  
  rutaForm: FormGroup;
  isSubmitting = false;
  siguienteCodigo = '01';

  // ✅ Tipos de ruta desde configuración usando getter
  get tiposRuta() {
    const config = this.configuracionService.tiposRutaConfig();
    const tipos = config.filter((t: any) => t.estaActivo).map((t: any) => ({
      value: t.codigo,
      label: t.nombre
    }));
    console.log('🔍 Tipos de ruta en crear (getter):', tipos);
    return tipos;
  }

  constructor(
    private fb: FormBuilder,
    private rutaService: RutaService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CrearRutaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CrearRutaModalData
  ) {
    this.rutaForm = this.fb.group({
      codigoRuta: ['', Validators.required],
      origen: ['', Validators.required],
      destino: ['', Validators.required],
      frecuencias: ['', Validators.required],
      tipoRuta: [''], // ✅ OPCIONAL - sin valor por defecto ni validación
      itinerario: [''],
      observaciones: ['']
    });
  }

  ngOnInit() {
    this.generarSiguienteCodigo();
    // Debug: Verificar que los tipos se están cargando
    console.log('🔍 Tipos de ruta disponibles en crear:', this.tiposRuta);
    console.log('🔍 Configuración cargada:', this.configuracionService.configuracionesCargadas());
    console.log('🔍 Config raw:', this.configuracionService.tiposRutaConfig());
  }

  generarSiguienteCodigo() {
    this.rutaService.getSiguienteCodigoDisponible(this.data.resolucion.id).subscribe({
      next: (codigo) => {
        this.siguienteCodigo = codigo;
        this.rutaForm.patchValue({ codigoRuta: codigo });
      },
      error: (error) => {
        console.error('Error generando código::', error);
        this.rutaForm.patchValue({ codigoRuta: '01' });
      }
    });
  }

  guardarRuta() {
    if (this.rutaForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.rutaForm.value;

    const nuevaRuta: RutaCreate = {
      codigoRuta: formValue.codigoRuta,
      nombre: `${formValue.origen} - ${formValue.destino}`,
      origen: { id: formValue.origen, nombre: "" },
      destino: { id: formValue.destino, nombre: "" },
      frecuencia: {
        tipo: 'DIARIO',
        cantidad: 1,
        dias: [],
        descripcion: formValue.frecuencias || 'Diaria'
      },
      tipoRuta: formValue.tipoRuta,
      tipoServicio: 'PASAJEROS',
      observaciones: formValue.observaciones || '',
      resolucion: { id: this.data.resolucion.id, nroResolucion: this.data.resolucion.nroResolucion, tipoResolucion: this.data.resolucion.tipoResolucion, estado: this.data.resolucion.estado || "VIGENTE" },
      empresa: { id: this.data.empresa.id, ruc: this.data.empresa.ruc, razonSocial: this.data.empresa.razonSocial.principal },
      itinerario: []
    };

    // Si hay itinerario, guardarlo en descripcion
    if (formValue.itinerario) {
      nuevaRuta.descripcion = formValue.itinerario;
    }

    // console.log removed for production

    this.rutaService.createRuta(nuevaRuta).subscribe({
      next: (rutaCreada) => {
        // console.log removed for production
        this.snackBar.open('Ruta creada exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(rutaCreada);
      },
      error: (error) => {
        console.error('❌ Error creando ruta::', error);
        this.snackBar.open('Error al crear la ruta', 'Cerrar', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }

  private marcarCamposComoTocados() {
    Object.keys(this.rutaForm.controls).forEach(key => {
      const control = this.rutaForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }
}
