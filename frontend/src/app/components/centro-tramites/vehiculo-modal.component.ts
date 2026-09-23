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
            <mat-icon style="color: #2563eb; font-size: 20px;">directions_car</mat-icon>
          </div>
          <div>
            <h2 class="title-text">Ficha Técnica Vehicular (vehiculos_data)</h2>
            <span class="subtitle-text">Especificaciones técnicas completas para habilitación y contraste oficial</span>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" style="color: #64748b;" type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <form [formGroup]="form" class="vehiculo-form">
          
          <!-- Sección 1: Placa y Búsqueda en vehiculos_data -->
          <div class="form-section-compact">
            <div class="placa-search-row">
              <mat-form-field appearance="outline" class="field-placa" subscriptSizing="dynamic">
                <mat-label>Número de Placa *</mat-label>
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

          <!-- Sección 2: Identificación General -->
          <div class="form-section-compact">
            <div class="section-badge-header">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #2563eb;">badge</mat-icon>
              <span>1. Identificación y Fabricación</span>
            </div>

            <div class="grid-form-compact">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Marca *</mat-label>
                <input matInput formControlName="marca" placeholder="Ej. TOYOTA" style="text-transform: uppercase;">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Modelo *</mat-label>
                <input matInput formControlName="modelo" placeholder="Ej. HIACE" style="text-transform: uppercase;">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Año Fabricación *</mat-label>
                <input matInput type="number" formControlName="anio_fabricacion" placeholder="Ej. 2018">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Color</mat-label>
                <input matInput formControlName="color" placeholder="Ej. BLANCO" style="text-transform: uppercase;">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Clase Vehicular</mat-label>
                <input matInput formControlName="clase" placeholder="Ej. CAMIONETA / OMNIBUS" style="text-transform: uppercase;">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Carrocería</mat-label>
                <input matInput formControlName="carroceria" placeholder="Ej. MINIBUS" style="text-transform: uppercase;">
              </mat-form-field>
            </div>
          </div>

          <!-- Sección 3: Clasificación, Combustible y Motor -->
          <div class="form-section-compact">
            <div class="section-badge-header">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #059669;">tune</mat-icon>
              <span>2. Clasificación, Motor e Identificadores</span>
            </div>

            <div class="grid-form-compact">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Categoría *</mat-label>
                <mat-select formControlName="categoria">
                  <mat-option value="M1">M1 (Pasajeros <= 8 as.)</mat-option>
                  <mat-option value="M2">M2 (Minibús / <= 5 ton)</mat-option>
                  <mat-option value="M3">M3 (Ómnibus / > 5 ton)</mat-option>
                  <mat-option value="N1">N1 (Mercancías <= 3.5 ton)</mat-option>
                  <mat-option value="N2">N2 (Mercancías 3.5 a 12 ton)</mat-option>
                  <mat-option value="N3">N3 (Carga Heavy > 12 ton)</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Combustible</mat-label>
                <mat-select formControlName="combustible">
                  <mat-option value="DIESEL">DIESEL</mat-option>
                  <mat-option value="GASOLINA">GASOLINA</mat-option>
                  <mat-option value="GNV">GNV</mat-option>
                  <mat-option value="GLP">GLP</mat-option>
                  <mat-option value="ELECTRICO">ELECTRICO</mat-option>
                  <mat-option value="HIBRIDO">HIBRIDO</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Motor</mat-label>
                <input matInput formControlName="numero_motor" placeholder="Opcional" style="font-family: monospace; text-transform: uppercase;">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>VIN / N° Serie</mat-label>
                <input matInput formControlName="vin" placeholder="Opcional" style="font-family: monospace; text-transform: uppercase;">
              </mat-form-field>
            </div>
          </div>

          <!-- Sección 4: Capacidad y Rodaje -->
          <div class="form-section-compact">
            <div class="section-badge-header">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #d97706;">airline_seat_recline_normal</mat-icon>
              <span>3. Capacidad y Rodaje</span>
            </div>

            <div class="grid-form-compact-4">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Asientos</mat-label>
                <input matInput type="number" formControlName="numero_asientos" placeholder="Ej. 16">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Pasajeros</mat-label>
                <input matInput type="number" formControlName="numero_pasajeros" placeholder="Ej. 15">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Ejes</mat-label>
                <input matInput type="number" formControlName="numero_ejes" placeholder="Ej. 2">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Ruedas</mat-label>
                <input matInput type="number" formControlName="numero_ruedas" placeholder="Ej. 4">
              </mat-form-field>
            </div>
          </div>

          <!-- Sección 5: Pesos y Dimensiones -->
          <div class="form-section-compact">
            <div class="section-badge-header">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #7c3aed;">straighten</mat-icon>
              <span>4. Pesos (Toneladas) y Dimensiones (Metros)</span>
            </div>

            <div class="grid-form-compact-3">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Peso Bruto (Ton)</mat-label>
                <input matInput type="number" step="0.001" formControlName="peso_bruto" placeholder="Ej. 3.500">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Peso Seco/Neto (Ton)</mat-label>
                <input matInput type="number" step="0.001" formControlName="peso_seco" placeholder="Ej. 2.260">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Carga Útil (Ton)</mat-label>
                <input matInput type="number" step="0.001" formControlName="carga_util" placeholder="Ej. 1.240">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Longitud (m)</mat-label>
                <input matInput type="number" step="0.001" formControlName="longitud" placeholder="Ej. 5.380">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Ancho (m)</mat-label>
                <input matInput type="number" step="0.001" formControlName="ancho" placeholder="Ej. 1.880">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Altura (m)</mat-label>
                <input matInput type="number" step="0.001" formControlName="altura" placeholder="Ej. 2.285">
              </mat-form-field>
            </div>
          </div>

          <!-- Observaciones -->
          <div class="form-section-compact" style="margin-bottom: 0;">
            <mat-form-field appearance="outline" style="width: 100%;" subscriptSizing="dynamic">
              <mat-label>Observaciones de Ficha Técnica</mat-label>
              <input matInput formControlName="observaciones" placeholder="Notas sobre la unidad técnica...">
            </mat-form-field>
          </div>

        </form>
      </div>

      <div class="modal-footer">
        <button mat-button (click)="cerrar()" style="color: #64748b;" type="button">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()" style="border-radius: 8px;" type="button">
          <mat-icon>check</mat-icon> Guardar Ficha Técnica
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
        width: 34px;
        height: 34px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
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
        line-height: 1.2;
      }
      .subtitle-text {
        font-size: 0.73rem;
        color: #64748b;
      }
    }
    .modal-content {
      padding: 1rem;
      overflow-y: auto;
      max-height: calc(85vh - 120px);
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
        width: 200px;
      }
    }
    .search-status-box {
      font-size: 0.75rem;
      color: #059669;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 6px 10px;
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
      font-size: 0.78rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 0.65rem;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .grid-form-compact {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.65rem;
    }
    .grid-form-compact-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.65rem;
    }
    .grid-form-compact-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.65rem;
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

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<VehiculoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const v = data?.vehiculo || data || {};

    const anioFab = v.anio_fabricacion || v.anio_modelo || v.ano_fabricacion || v.anio || 2020;
    const asientos = v.asientos || v.numero_asientos || v.numero_pasajeros || 16;
    const pesoNeto = v.peso_neto || v.peso_seco || 0;

    this.form = this.fb.group({
      placa: [v.placa || v.placa_actual || '', [Validators.required, Validators.pattern(/^[A-Z0-9-]{6,10}$/i)]],
      marca: [v.marca || '', Validators.required],
      modelo: [v.modelo || '', Validators.required],
      anio_fabricacion: [anioFab, [Validators.required, Validators.min(1950), Validators.max(2030)]],
      color: [v.color || 'BLANCO'],
      clase: [v.clase || 'CAMIONETA'],
      carroceria: [v.carroceria || 'MINIBUS'],
      categoria: [v.categoria || 'M2', Validators.required],
      combustible: [v.combustible || 'DIESEL'],
      numero_motor: [v.numero_motor || ''],
      vin: [v.vin || v.numero_serie || ''],
      numero_asientos: [asientos, [Validators.min(1)]],
      numero_pasajeros: [v.numero_pasajeros || Math.max(1, asientos - 1), [Validators.min(1)]],
      numero_ejes: [v.numero_ejes || 2, [Validators.min(1)]],
      numero_ruedas: [v.numero_ruedas || 4, [Validators.min(2)]],
      peso_bruto: [v.peso_bruto || 0.0, [Validators.min(0)]],
      peso_seco: [pesoNeto, [Validators.min(0)]],
      carga_util: [v.carga_util || 0.0, [Validators.min(0)]],
      longitud: [v.longitud || 0.0, [Validators.min(0)]],
      ancho: [v.ancho || 0.0, [Validators.min(0)]],
      altura: [v.altura || 0.0, [Validators.min(0)]],
      observaciones: [v.observaciones || '']
    });

    const currentPlaca = v.placa || v.placa_actual;
    if (currentPlaca && (!v.marca || !v.modelo || !v.numero_motor)) {
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
    this.mensajeBusqueda = 'Consultando en vehiculos_data...';
    this.errorBusqueda = false;
    
    this.vehiculoDataService.getVehiculoDataByPlaca(placa).subscribe({
      next: (res) => {
        this.buscando = false;
        if (res.success && res.data) {
          const d = res.data;
          this.mensajeBusqueda = 'Datos técnicos cargados desde vehiculos_data';
          
          this.form.patchValue({
            marca: d.marca || this.form.get('marca')?.value,
            modelo: d.modelo || this.form.get('modelo')?.value,
            anio_fabricacion: d.anio_fabricacion || d.anio_modelo || d.ano_fabricacion || this.form.get('anio_fabricacion')?.value,
            color: d.color || this.form.get('color')?.value || 'BLANCO',
            clase: d.clase || this.form.get('clase')?.value || 'CAMIONETA',
            carroceria: d.carroceria || this.form.get('carroceria')?.value || 'MINIBUS',
            categoria: d.categoria || this.form.get('categoria')?.value || 'M2',
            combustible: d.combustible || this.form.get('combustible')?.value || 'DIESEL',
            numero_motor: d.numero_motor || this.form.get('numero_motor')?.value || '',
            vin: d.vin || d.numero_serie || this.form.get('vin')?.value || '',
            numero_asientos: d.numero_asientos || d.asientos || this.form.get('numero_asientos')?.value || 16,
            numero_pasajeros: d.numero_pasajeros || d.pasajeros || this.form.get('numero_pasajeros')?.value || 15,
            numero_ejes: d.numero_ejes || this.form.get('numero_ejes')?.value || 2,
            numero_ruedas: d.numero_ruedas || this.form.get('numero_ruedas')?.value || 4,
            peso_bruto: d.peso_bruto !== undefined ? d.peso_bruto : this.form.get('peso_bruto')?.value,
            peso_seco: d.peso_seco !== undefined ? d.peso_seco : (d.peso_neto !== undefined ? d.peso_neto : this.form.get('peso_seco')?.value),
            carga_util: d.carga_util !== undefined ? d.carga_util : this.form.get('carga_util')?.value,
            longitud: d.longitud !== undefined ? d.longitud : this.form.get('longitud')?.value,
            ancho: d.ancho !== undefined ? d.ancho : this.form.get('ancho')?.value,
            altura: d.altura !== undefined ? d.altura : this.form.get('altura')?.value,
            observaciones: d.observaciones || this.form.get('observaciones')?.value || ''
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
      const val = this.form.value;
      const cleanPlaca = (val.placa || '').toUpperCase().trim();
      const result = {
        ...val,
        placa: cleanPlaca,
        placa_actual: cleanPlaca,
        asientos: val.numero_asientos,
        peso_neto: val.peso_seco,
        numero_serie: val.vin
      };
      this.dialogRef.close(result);
    }
  }
}
