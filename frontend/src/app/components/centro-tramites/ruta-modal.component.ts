import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface RutaModalData {
  ruta?: {
    id?: string;
    _id?: string;
    codigoRuta?: string;
    codigo?: string;
    origen?: any;
    destino?: any;
    itinerario?: string;
    frecuencia?: any;
  };
  isNew?: boolean;
}

export function parsearItinerarioTexto(itinerario: any): string {
  if (!itinerario) return '';
  if (typeof itinerario === 'string') {
    if (itinerario.includes('[object Object]') || itinerario.includes('[OBJECT OBJECT]')) return '';
    return itinerario;
  }
  if (Array.isArray(itinerario)) {
    return itinerario
      .map((item: any) => {
        if (!item) return '';
        if (typeof item === 'string') {
          if (item.includes('[object Object]') || item.includes('[OBJECT OBJECT]')) return '';
          return item;
        }
        if (typeof item === 'object') {
          return item.punto || item.nombre || item.localidad || item.distrito || item.descripcion || '';
        }
        return String(item);
      })
      .filter(Boolean)
      .join(' - ');
  }
  return String(itinerario);
}

@Component({
  selector: 'app-ruta-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <div class="header-title">
          <div class="header-icon-box">
            <mat-icon style="color: #0284c7; font-size: 20px;">alt_route</mat-icon>
          </div>
          <div>
            <h2 class="title-text">{{ data.isNew ? 'Nueva Ruta Concesionada' : 'Editar Ruta de Concesión' }}</h2>
            <span class="subtitle-text">Defina el trayecto e itinerario oficial para la nueva resolución</span>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" class="compact-icon-btn" style="color: #64748b;" type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <form [formGroup]="form" class="ruta-form">
          <mat-form-field appearance="outline" style="width: 100%;">
            <mat-label>Código de Ruta *</mat-label>
            <input matInput formControlName="codigoRuta" placeholder="Ej. 01 o 02" style="font-family: monospace; font-weight: 700; text-transform: uppercase;">
            <mat-icon matPrefix style="margin-right: 0.5rem; color: #94a3b8;">tag</mat-icon>
          </mat-form-field>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Origen *</mat-label>
              <input matInput formControlName="origen" placeholder="Ej. PUNO" style="text-transform: uppercase; font-weight: 600;">
              <mat-icon matPrefix style="margin-right: 0.5rem; color: #16a34a;">trip_origin</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Destino *</mat-label>
              <input matInput formControlName="destino" placeholder="Ej. JULIACA" style="text-transform: uppercase; font-weight: 600;">
              <mat-icon matPrefix style="margin-right: 0.5rem; color: #dc2626;">location_on</mat-icon>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" style="width: 100%;">
            <mat-label>Itinerario / Vía</mat-label>
            <input matInput formControlName="itinerario" placeholder="Ej. PUNO - PAUCARCOLLA - CARACOTO - JULIACA" style="text-transform: uppercase;">
            <mat-icon matPrefix style="margin-right: 0.5rem; color: #94a3b8;">timeline</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" style="width: 100%;">
            <mat-label>Frecuencia de Servicio</mat-label>
            <input matInput formControlName="frecuencia" placeholder="Ej. 20 DIARIAS o DIARIO (CADA 15 MINUTOS)" style="text-transform: uppercase;">
            <mat-icon matPrefix style="margin-right: 0.5rem; color: #94a3b8;">schedule</mat-icon>
          </mat-form-field>
        </form>
      </div>

      <div class="modal-footer">
        <button mat-button (click)="cerrar()" style="color: #64748b;" type="button">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()" style="border-radius: 8px;" type="button">
          <mat-icon>check</mat-icon> {{ data.isNew ? 'Agregar Ruta' : 'Guardar Cambios' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }
    .modal-header {
      padding: 0.85rem 1.25rem;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 0.65rem;

      .header-icon-box {
        width: 34px;
        height: 34px;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .title-text {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
      }
      .subtitle-text {
        font-size: 0.73rem;
        color: #64748b;
      }
    }
    .modal-content {
      padding: 1.25rem;
    }
    .ruta-form {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .modal-footer {
      padding: 0.75rem 1.25rem;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
    }
    .compact-icon-btn {
      --mdc-icon-button-state-layer-size: 32px !important;
      --mdc-icon-button-icon-size: 18px !important;
      width: 32px !important;
      height: 32px !important;
      padding: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      line-height: 1 !important;
    }
  `]
})
export class RutaModalComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RutaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RutaModalData
  ) {
    const r = data?.ruta || {};
    const cod = r.codigoRuta || r.codigo || '';
    const orig = typeof r.origen === 'object' ? (r.origen?.nombre || r.origen?.localidad || '') : String(r.origen || '');
    const dest = typeof r.destino === 'object' ? (r.destino?.nombre || r.destino?.localidad || '') : String(r.destino || '');
    const itin = parsearItinerarioTexto(r.itinerario);
    const freq = typeof r.frecuencia === 'object' ? (r.frecuencia?.descripcion || '') : String(r.frecuencia || '');

    this.form = this.fb.group({
      codigoRuta: [cod, [Validators.required]],
      origen: [orig, [Validators.required]],
      destino: [dest, [Validators.required]],
      itinerario: [itin],
      frecuencia: [freq]
    });
  }

  cerrar() {
    this.dialogRef.close();
  }

  guardar() {
    if (this.form.valid) {
      const val = this.form.value;
      const itinStr = (val.itinerario || '').toUpperCase().trim();
      this.dialogRef.close({
        ...this.data?.ruta,
        codigoRuta: (val.codigoRuta || '').toUpperCase().trim(),
        codigo: (val.codigoRuta || '').toUpperCase().trim(),
        origen: (val.origen || '').toUpperCase().trim(),
        destino: (val.destino || '').toUpperCase().trim(),
        itinerario: itinStr,
        frecuencia: (val.frecuencia || '').toUpperCase().trim(),
        editada: true
      });
    }
  }
}
