import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatSelectModule,
    MatTooltipModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <div class="header-title">
          <div class="header-icon-box">
            <mat-icon style="color: #2563eb; font-size: 20px;">build</mat-icon>
          </div>
          <div>
            <h2 class="title-text">Datos Técnicos (vehiculos_data)</h2>
            <span class="subtitle-text">Ficha técnica para evaluación y contraste de unidades</span>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" style="color: #64748b;">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <form [formGroup]="form" class="vehiculo-form">
          
          <!-- Sección 1: Placa y Búsqueda en vehiculos_data -->
          <div class="form-section-compact">
            <div class="placa-search-row">
              <mat-form-field appearance="outline" class="field-placa" subscriptSizing="dynamic">
                <mat-label>Número de Placa</mat-label>
                <input matInput formControlName="placa" placeholder="ABC-123" style="font-family: monospace; font-weight: 700; text-transform: uppercase;">
                <button type="button" mat-icon-button matSuffix (click)="buscarPorPlaca()" [disabled]="form.get('placa')?.invalid || buscando" matTooltip="Consultar en vehiculos_data" color="primary">
                  <mat-icon *ngIf="!buscando">search</mat-icon>
                  <mat-icon *ngIf="buscando" class="spin">sync</mat-icon>
                </button>
              </mat-form-field>
              
              <div class="search-status-box" *ngIf="mensajeBusqueda" [ngClass]="{'error': errorBusqueda}">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;">{{ errorBusqueda ? 'error' : 'check_circle' }}</mat-icon>
                <span>{{ mensajeBusqueda }}</span>
              </div>
            </div>
          </div>

          <!-- Sección 2: Especificaciones Técnicas (vehiculos_data) - SIN MARCA, SIN MODELO, SIN TUC -->
          <div class="form-section-compact">
            <div class="section-badge-header">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #3b82f6;">tune</mat-icon>
              <span>Especificaciones Técnicas Requeridas</span>
            </div>

            <div class="grid-form-compact">
              <!-- Año Fabricación -->
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Año Fabricación</mat-label>
                <input matInput type="number" formControlName="anio_fabricacion" placeholder="Ej. 2018">
              </mat-form-field>

              <!-- Categoría -->
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Categoría</mat-label>
                <input matInput formControlName="categoria" placeholder="Ej. M2-C3 o M3" style="text-transform: uppercase;">
              </mat-form-field>

              <!-- Cantidad de Asientos -->
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Asientos</mat-label>
                <input matInput type="number" formControlName="asientos" placeholder="Ej. 16">
              </mat-form-field>

              <!-- Peso Neto -->
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Peso Neto (tn / kg)</mat-label>
                <input matInput type="number" step="0.01" formControlName="peso_neto" placeholder="Ej. 2.26">
              </mat-form-field>

              <!-- Tipo Carrocería -->
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Carrocería</mat-label>
                <input matInput formControlName="carroceria" placeholder="Ej. MICROBUS" style="text-transform: uppercase;">
              </mat-form-field>

              <!-- Combustible -->
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Combustible</mat-label>
                <mat-select formControlName="combustible">
                  <mat-option value="DIESEL">DIESEL</mat-option>
                  <mat-option value="GASOLINA">GASOLINA</mat-option>
                  <mat-option value="GNV">GNV</mat-option>
                  <mat-option value="GLP">GLP</mat-option>
                  <mat-option value="ELECTRICO">ELECTRICO</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- N° Motor -->
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Motor</mat-label>
                <input matInput formControlName="numero_motor" placeholder="Opcional" style="font-family: monospace; text-transform: uppercase;">
              </mat-form-field>

              <!-- N° Serie / VIN -->
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Serie / VIN</mat-label>
                <input matInput formControlName="numero_serie" placeholder="Opcional" style="font-family: monospace; text-transform: uppercase;">
              </mat-form-field>
            </div>
          </div>

        </form>
      </div>

      <div class="modal-footer">
        <button mat-button (click)="cerrar()" style="color: #64748b;">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()" style="border-radius: 8px;">
          <mat-icon>check</mat-icon> Aplicar Ficha Técnica
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
        width: 32px;
        height: 32px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .title-text {
        margin: 0;
        font-size: 0.98rem;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.2;
      }
      .subtitle-text {
        font-size: 0.72rem;
        color: #64748b;
      }
    }
    .modal-content {
      padding: 1rem;
      overflow-y: auto;
    }
    .form-section-compact {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem;
      margin-bottom: 0.75rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }
    .placa-search-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;

      .field-placa {
        width: 180px;
      }
    }
    .search-status-box {
      font-size: 0.75rem;
      color: #059669;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 5px 8px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 0.35rem;

      &.error {
        color: #dc2626;
        background: #fef2f2;
        border-color: #fecaca;
      }
    }
    .section-badge-header {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.76rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 0.75rem;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .grid-form-compact {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.6rem;

      ::ng-deep .mat-mdc-text-field-wrapper {
        padding-left: 8px !important;
        padding-right: 8px !important;
      }
    }
    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .modal-footer {
      padding: 0.75rem 1.25rem;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
    }
  `]
})
export class VehiculoModalComponent {
  form: FormGroup;
  buscando = false;
  mensajeBusqueda = '';
  errorBusqueda = false;

  private vehiculoDataService = inject(VehiculoDataService);
  private rawMarca = '';
  private rawModelo = '';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<VehiculoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { vehiculo?: any, isEdit?: boolean }
  ) {
    const v = data.vehiculo || {};
    this.rawMarca = v.marca || '';
    this.rawModelo = v.modelo || '';

    this.form = this.fb.group({
      placa: [v.placa || '', [Validators.required, Validators.pattern(/^[A-Z0-9-]{6,8}$/i)]],
      anio_fabricacion: [v.anio_fabricacion || v.anio_modelo || v.ano_fabricacion || v.anio || '', [Validators.required, Validators.min(1970), Validators.max(2027)]],
      categoria: [v.categoria || 'M2', Validators.required],
      asientos: [v.asientos || v.numero_asientos || v.numero_pasajeros || ''],
      peso_neto: [v.peso_neto || v.peso_seco || ''],
      carroceria: [v.carroceria || ''],
      combustible: [v.combustible || 'DIESEL'],
      numero_motor: [v.numero_motor || ''],
      numero_serie: [v.numero_serie || v.vin || '']
    });

    if (v.placa && (!v.anio_fabricacion || !v.asientos)) {
      this.buscarPorPlaca();
    }
  }

  buscarPorPlaca() {
    let placa = this.form.get('placa')?.value;
    if (!placa) return;
    
    placa = placa.toUpperCase().trim();
    if (/^[A-Z0-9]{6}$/.test(placa)) {
      placa = `${placa.substring(0, 3)}-${placa.substring(3)}`;
      this.form.get('placa')?.setValue(placa);
    }

    this.buscando = true;
    this.mensajeBusqueda = 'Consultando vehiculos_data...';
    this.errorBusqueda = false;
    
    this.vehiculoDataService.getVehiculoDataByPlaca(placa).subscribe({
      next: (res) => {
        this.buscando = false;
        if (res.success && res.data) {
          const d = res.data;
          this.mensajeBusqueda = 'Datos técnicos cargados desde vehiculos_data';
          this.rawMarca = d.marca || this.rawMarca;
          this.rawModelo = d.modelo || this.rawModelo;

          this.form.patchValue({
            anio_fabricacion: d.anio_fabricacion || d.anio_modelo || d.ano_fabricacion || d.anoFabricacion || '',
            categoria: d.categoria || 'M2',
            asientos: d.numero_asientos || d.asientos || d.numero_pasajeros || d.pasajeros || '',
            peso_neto: d.peso_neto || d.peso_seco || '',
            carroceria: d.carroceria || '',
            combustible: d.combustible || 'DIESEL',
            numero_motor: d.numero_motor || '',
            numero_serie: d.numero_serie || d.vin || ''
          });
        } else {
          this.errorBusqueda = true;
          this.mensajeBusqueda = res.message || 'No se encontraron datos en vehiculos_data';
        }
      },
      error: () => {
        this.buscando = false;
        this.errorBusqueda = true;
        this.mensajeBusqueda = 'Error al consultar vehiculos_data';
      }
    });
  }

  cerrar() {
    this.dialogRef.close();
  }

  guardar() {
    if (this.form.valid) {
      const value = this.form.value;
      value.placa = (value.placa || '').toUpperCase().trim();
      value.marca = this.rawMarca;
      value.modelo = this.rawModelo;
      this.dialogRef.close(value);
    }
  }
}
