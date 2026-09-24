import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { VehiculoDataService } from '../../services/vehiculo-data.service';
import { DatosTecnicosVehiculo } from '../../services/vehiculo.service';

export interface EditarFichaTecnicaData {
  placa: string;
  datosTecnicos?: DatosTecnicosVehiculo;
}

@Component({
  selector: 'app-editar-ficha-tecnica-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="editar-ficha-modal-container">
      <div class="modal-header">
        <div class="header-title-box">
          <div class="header-icon">
            <mat-icon>build_circle</mat-icon>
          </div>
          <div>
            <h2>Ficha Técnica Vehicular • SUNARP / MTC</h2>
            <span class="placa-badge-head">{{ data.placa }}</span>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" matTooltip="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-body">
        <form [formGroup]="form">
          <mat-tab-group animationDuration="200ms" class="custom-tab-group">
            
            <!-- TAB 1: IDENTIFICACIÓN Y MOTOR -->
            <mat-tab>
              <ng-template matTabLabel>
                <mat-icon class="tab-ic">fingerprint</mat-icon> Motor & Identificación
              </ng-template>
              
              <div class="tab-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Marca</mat-label>
                  <input matInput formControlName="marca" placeholder="Ej: TOYOTA, MERCEDES-BENZ" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Modelo</mat-label>
                  <input matInput formControlName="modelo" placeholder="Ej: HIACE, COASTER" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Año Fabricación (MTC / TIV)</mat-label>
                  <input matInput type="number" formControlName="anio_fabricacion" placeholder="Ej: 2015" />
                  <mat-hint>Base oficial de permanencia</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Año Modelo (Comercial)</mat-label>
                  <input matInput type="number" formControlName="anio_modelo" placeholder="Ej: 2016" />
                  <mat-hint>Designación del fabricante</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Número de Motor</mat-label>
                  <input matInput formControlName="numero_motor" placeholder="Número grabado en motor" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>VIN / Número de Serie</mat-label>
                  <input matInput formControlName="vin" placeholder="17 caracteres VIN" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Combustible</mat-label>
                  <mat-select formControlName="combustible">
                    <mat-option value="DIESEL">DIÉSEL</mat-option>
                    <mat-option value="GASOLINA">GASOLINA</mat-option>
                    <mat-option value="GNV">GNV</mat-option>
                    <mat-option value="GLP">GLP</mat-option>
                    <mat-option value="ELECTRICO">ELÉCTRICO</mat-option>
                    <mat-option value="HIBRIDO">HÍBRIDO</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Cilindrada (cc)</mat-label>
                  <input matInput type="number" formControlName="cilindrada" placeholder="Ej: 2800" />
                </mat-form-field>
              </div>
            </mat-tab>

            <!-- TAB 2: CARROCERÍA Y CAPACIDAD -->
            <mat-tab>
              <ng-template matTabLabel>
                <mat-icon class="tab-ic">airline_seat_recline_extra</mat-icon> Carrocería & Capacidad
              </ng-template>

              <div class="tab-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Categoría MTC</mat-label>
                  <mat-select formControlName="categoria">
                    <mat-option value="M1">M1 (Vehículo ligero de pasajeros)</mat-option>
                    <mat-option value="M2">M2 (Minibús hasta 5 ton)</mat-option>
                    <mat-option value="M3">M3 (Ómnibus más de 5 ton)</mat-option>
                    <mat-option value="N1">N1 (Carga ligera)</mat-option>
                    <mat-option value="N2">N2 (Carga mediana)</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Tipo Carrocería</mat-label>
                  <input matInput formControlName="carroceria" placeholder="Ej: RURAL, MICROBÚS, OMNIBÚS" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Clase</mat-label>
                  <input matInput formControlName="clase" placeholder="Ej: CAMIONETA RURAL, MICROBÚS" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Color Oficial</mat-label>
                  <input matInput formControlName="color" placeholder="Ej: BLANCO / AZUL" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>N° Asientos</mat-label>
                  <input matInput type="number" formControlName="numero_asientos" placeholder="Total asientos" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>N° Pasajeros</mat-label>
                  <input matInput type="number" formControlName="numero_pasajeros" placeholder="Capacidad pasajeros" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>N° Ejes</mat-label>
                  <input matInput type="number" formControlName="numero_ejes" placeholder="Ej: 2" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>N° Ruedas</mat-label>
                  <input matInput type="number" formControlName="numero_ruedas" placeholder="Ej: 4 ó 6" />
                </mat-form-field>
              </div>
            </mat-tab>

            <!-- TAB 3: PESOS Y MEDIDAS -->
            <mat-tab>
              <ng-template matTabLabel>
                <mat-icon class="tab-ic">straighten</mat-icon> Pesos & Medidas
              </ng-template>

              <div class="tab-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Peso Neto / Tara (Tn)</mat-label>
                  <input matInput type="number" step="0.01" formControlName="peso_neto" placeholder="Ej: 2.15" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Peso Bruto Vehicular (Tn)</mat-label>
                  <input matInput type="number" step="0.01" formControlName="peso_bruto" placeholder="Ej: 3.50" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Carga Útil (Tn)</mat-label>
                  <input matInput type="number" step="0.01" formControlName="carga_util" placeholder="Ej: 1.35" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Longitud (m)</mat-label>
                  <input matInput type="number" step="0.01" formControlName="longitud" placeholder="Ej: 5.38" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Ancho (m)</mat-label>
                  <input matInput type="number" step="0.01" formControlName="ancho" placeholder="Ej: 1.88" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Altura (m)</mat-label>
                  <input matInput type="number" step="0.01" formControlName="altura" placeholder="Ej: 2.28" />
                </mat-form-field>
              </div>
            </mat-tab>
          </mat-tab-group>
        </form>
      </div>

      <div class="modal-footer">
        <button mat-stroked-button (click)="cerrar()" [disabled]="guardando">
          Cancelar
        </button>
        <button mat-flat-button color="primary" (click)="guardar()" [disabled]="guardando || form.invalid">
          @if (guardando) {
            <mat-spinner diameter="18" class="spinner-btn"></mat-spinner> Guardando...
          } @else {
            <mat-icon>save</mat-icon> Guardar Ficha Técnica
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .editar-ficha-modal-container {
      display: flex;
      flex-direction: column;
      max-height: 85vh;
      overflow: hidden;
      font-family: inherit;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: #ffffff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .header-title-box {
        display: flex;
        align-items: center;
        gap: 12px;

        .header-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        h2 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: #f8fafc;
        }

        .placa-badge-head {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 700;
          background: #3b82f6;
          color: #fff;
          padding: 2px 8px;
          border-radius: 4px;
          letter-spacing: 1px;
        }
      }
    }

    .modal-body {
      padding: 20px 24px;
      overflow-y: auto;
      max-height: calc(85vh - 140px);
    }

    .tab-ic {
      margin-right: 6px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .tab-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      padding-top: 20px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;

      .spinner-btn {
        display: inline-block;
        margin-right: 6px;
      }
    }
  `]
})
export class EditarFichaTecnicaModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<EditarFichaTecnicaModalComponent>);
  public data: EditarFichaTecnicaData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private vehiculoDataService = inject(VehiculoDataService);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  guardando: boolean = false;

  ngOnInit(): void {
    const d = this.data.datosTecnicos || {};
    this.form = this.fb.group({
      marca: [d.marca || '', Validators.required],
      modelo: [d.modelo || '', Validators.required],
      anio_fabricacion: [d.anio_fabricacion || null, [Validators.min(1950), Validators.max(2035)]],
      anio_modelo: [d.anio_modelo || null],
      numero_motor: [d.numero_motor || ''],
      vin: [d.vin || ''],
      combustible: [d.combustible || 'DIESEL'],
      cilindrada: [d.cilindrada || null],
      categoria: [d.categoria || 'M2'],
      carroceria: [d.carroceria || ''],
      clase: [d.clase || ''],
      color: [d.color || ''],
      numero_asientos: [d.numero_asientos || null],
      numero_pasajeros: [d.numero_pasajeros || null],
      numero_ejes: [d.numero_ejes || 2],
      numero_ruedas: [d.numero_ruedas || 4],
      peso_neto: [d.peso_neto || null],
      peso_bruto: [d.peso_bruto || null],
      carga_util: [d.carga_util || null],
      longitud: [d.longitud || null],
      ancho: [d.ancho || null],
      altura: [d.altura || null]
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }

  guardar(): void {
    if (this.form.invalid) return;

    this.guardando = true;
    const raw = this.form.value;
    const payload = {
      ...raw,
      placa: this.data.placa,
      placa_actual: this.data.placa
    };

    this.vehiculoDataService.guardarFichaTecnica(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.snackBar.open('Ficha técnica guardada con éxito', 'Aceptar', { duration: 3500 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando = false;
        const msg = err.error?.message || err.error?.detail || 'Error al guardar la ficha técnica';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }
}
