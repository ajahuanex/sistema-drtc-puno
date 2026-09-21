import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { VehiculoDataService } from '../../services/vehiculo-data.service';

@Component({
  selector: 'app-vehiculo-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <div class="header-title">
          <mat-icon style="color: #2563eb; margin-right: 8px;">directions_car</mat-icon>
          <h2>{{data.isEdit ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}}</h2>
        </div>
        <button mat-icon-button (click)="cerrar()" style="color: #64748b;">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <form [formGroup]="form" class="vehiculo-form">
          
          <div class="form-section">
            <h3 class="section-title"><mat-icon>badge</mat-icon> Identidad y Placa</h3>
            <div class="grid-form align-center">
              <mat-form-field appearance="outline" class="flex-grow">
                <mat-label>Placa</mat-label>
                <input matInput formControlName="placa" placeholder="Ej. ABC-123" style="font-family: monospace; text-transform: uppercase;">
                <button mat-icon-button matSuffix (click)="buscarPorPlaca()" [disabled]="form.get('placa')?.invalid || buscando" matTooltip="Buscar en BD" color="primary">
                  <mat-icon *ngIf="!buscando">search</mat-icon>
                  <mat-icon *ngIf="buscando" class="spin">sync</mat-icon>
                </button>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>N° TUC (Opcional)</mat-label>
                <input matInput formControlName="numero_tuc" placeholder="Ej. 12345678">
              </mat-form-field>
            </div>
            <div *ngIf="mensajeBusqueda" class="search-message" [ngClass]="{'error': errorBusqueda}">
              {{ mensajeBusqueda }}
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title"><mat-icon>handyman</mat-icon> Especificaciones</h3>
            <div class="grid-form">
              <mat-form-field appearance="outline">
                <mat-label>Marca</mat-label>
                <input matInput formControlName="marca">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Modelo</mat-label>
                <input matInput formControlName="modelo">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Año Fabricación</mat-label>
                <input matInput type="number" formControlName="anio_fabricacion">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Categoría</mat-label>
                <mat-select formControlName="categoria">
                  <mat-option value="M2">M2 (Microbús)</mat-option>
                  <mat-option value="M3">M3 (Ómnibus)</mat-option>
                  <mat-option value="N2">N2 (Camión Mediano)</mat-option>
                  <mat-option value="N3">N3 (Camión Pesado)</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Asientos</mat-label>
                <input matInput type="number" formControlName="asientos">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Peso Neto (Kg)</mat-label>
                <input matInput type="number" formControlName="peso_neto">
              </mat-form-field>
            </div>
          </div>

        </form>
      </div>

      <div class="modal-footer">
        <button mat-button (click)="cerrar()" style="color: #64748b;">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()" style="border-radius: 8px;">
          <mat-icon>save</mat-icon> Guardar Vehículo
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      background: #f8fafc;
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header-title {
      display: flex;
      align-items: center;
      h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
    }
    .modal-content {
      padding: 1.5rem;
      overflow-y: auto;
    }
    .form-section {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.5rem;

      mat-icon {
        color: #94a3b8;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
    .grid-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .grid-form.align-center {
      align-items: start;
    }
    .flex-grow {
      flex: 1;
    }
    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .search-message {
      font-size: 0.85rem;
      color: #10b981;
      margin-top: -10px;
      margin-bottom: 10px;
    }
    .search-message.error {
      color: #ef4444;
    }
    .modal-footer {
      padding: 1.25rem 1.5rem;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      position: sticky;
      bottom: 0;
    }
  `]
})
export class VehiculoModalComponent {
  form: FormGroup;
  buscando = false;
  mensajeBusqueda = '';
  errorBusqueda = false;

  private vehiculoDataService = inject(VehiculoDataService);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<VehiculoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { vehiculo?: any, isEdit?: boolean }
  ) {
    this.form = this.fb.group({
      placa: [data.vehiculo?.placa || '', [Validators.required, Validators.pattern(/^[A-Z0-9-]{6,8}$/i)]],
      numero_tuc: [data.vehiculo?.numero_tuc || ''],
      marca: [data.vehiculo?.marca || '', Validators.required],
      modelo: [data.vehiculo?.modelo || '', Validators.required],
      anio_fabricacion: [data.vehiculo?.anio_fabricacion || '', [Validators.required, Validators.min(1980), Validators.max(2027)]],
      categoria: [data.vehiculo?.categoria || 'M2', Validators.required],
      asientos: [data.vehiculo?.asientos || ''],
      peso_neto: [data.vehiculo?.peso_neto || '']
    });
  }

  buscarPorPlaca() {
    let placa = this.form.get('placa')?.value;
    if (!placa) return;
    
    placa = placa.toUpperCase().trim();
    this.buscando = true;
    this.mensajeBusqueda = 'Buscando vehículo...';
    this.errorBusqueda = false;
    
    this.vehiculoDataService.getVehiculoDataByPlaca(placa).subscribe({
      next: (res) => {
        this.buscando = false;
        if (res.success && res.data) {
          this.mensajeBusqueda = 'Vehículo encontrado y autocompletado';
          this.form.patchValue({
            marca: res.data.marca || '',
            modelo: res.data.modelo || '',
            anio_fabricacion: res.data.anio_fabricacion || '',
            categoria: res.data.categoria || 'M2',
            asientos: res.data.asientos || res.data.numero_asientos || '',
            peso_neto: res.data.peso_neto || res.data.peso_seco || ''
          });
        } else {
          this.errorBusqueda = true;
          this.mensajeBusqueda = res.message || 'Vehículo no encontrado en la base de datos local';
        }
      },
      error: (err) => {
        this.buscando = false;
        this.errorBusqueda = true;
        this.mensajeBusqueda = 'Error al buscar vehículo';
      }
    });
  }

  cerrar() {
    this.dialogRef.close();
  }

  guardar() {
    if (this.form.valid) {
      const value = this.form.value;
      value.placa = value.placa.toUpperCase();
      this.dialogRef.close(value);
    }
  }
}

