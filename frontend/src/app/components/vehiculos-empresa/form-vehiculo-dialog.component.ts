import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { FlotaEmpresaService, VehiculoEmpresa, VehiculoEmpresaCreate } from '../../services/flota-empresa.service';

export interface FormVehiculoDialogData {
  modo: 'crear' | 'editar';
  ruc: string;
  razon_social?: string;
  nro_resolucion_primigenia?: string;
  vehiculo?: VehiculoEmpresa;
}

@Component({
  selector: 'app-form-vehiculo-dialog',
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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  template: `
    <div class="vehiculo-dialog-container">
      <div class="dialog-header">
        <div class="title-flex">
          <mat-icon class="header-icon">{{ isEdit ? 'edit_note' : 'add_to_photos' }}</mat-icon>
          <div>
            <h2>{{ isEdit ? 'Editar Vehículo: ' + (data.vehiculo?.placa || '') : 'Registrar Nuevo Vehículo en Flota' }}</h2>
            <p class="dialog-subtitle">
              Resolución Primigenia: <strong>{{ data.nro_resolucion_primigenia || data.vehiculo?.nro_resolucion_primigenia || 'Por Definir' }}</strong>
              | Empresa RUC: <strong>{{ data.ruc }}</strong>
            </p>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" [disabled]="saving">
          <mat-icon style="color:#fff;">close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="dialog-body">
        
        <mat-tab-group headerPosition="above" animationDuration="200ms" class="custom-tabs">
          
          <!-- TAB 1: RESOLUCIÓN, EXPEDIENTE & CONTROL -->
          <mat-tab label="1. Autorización & Expediente">
            <div class="tab-content-grid">
              
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Resolución Primigenia</mat-label>
                <input matInput formControlName="nro_resolucion_primigenia" placeholder="Ej: R-0141-2024" required>
                <mat-icon matSuffix color="primary">verified</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Fecha Emisión Resolución</mat-label>
                <input matInput type="date" formControlName="fecha_emision_resolucion">
                <mat-icon matSuffix color="primary">event</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Número de Expediente</mat-label>
                <input matInput formControlName="expediente" placeholder="Ej: E-0123-2026">
                <mat-icon matSuffix>folder</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Fecha de Expediente</mat-label>
                <input matInput type="date" formControlName="fecha_expediente">
                <mat-icon matSuffix color="primary">calendar_today</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Resolución Hija (Opcional)</mat-label>
                <input matInput formControlName="nro_resolucion_hija" placeholder="Ej: R-0375-2024-I">
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Tipo Resolución Hija</mat-label>
                <mat-select formControlName="tipo_resolucion_hija">
                  <mat-option value="">-- Sin Res. Hija --</mat-option>
                  <mat-option value="I">I - Incremento de Flota</mat-option>
                  <mat-option value="S">S - Sustitución de Vehículo</mat-option>
                  <mat-option value="M">M - Modificación</mat-option>
                  <mat-option value="O">O - Otros Trámites</mat-option>
                  <mat-option value="C">C - Cancelación</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Estado de Habilitación</mat-label>
                <mat-select formControlName="estado">
                  <mat-option value="HABILITADO">✅ HABILITADO</mat-option>
                  <mat-option value="INHABILITADO">⛔ INHABILITADO</mat-option>
                  <mat-option value="OBSERVADO">⚠️ OBSERVADO</mat-option>
                  <mat-option value="CANCELADO">❌ CANCELADO</mat-option>
                  <mat-option value="SUSPENDIDO">🚫 SUSPENDIDO</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Número de TUC</mat-label>
                <input matInput formControlName="numero_tuc" placeholder="Ej: TE-000123 o T-V5H-958">
                <mat-icon matSuffix>badge</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always" style="grid-column: 1 / -1;">
                <mat-label>Códigos de Rutas Autorizadas (separados por coma)</mat-label>
                <input matInput formControlName="rutas_str" placeholder="Ej: 01, 02, 03-A">
                <mat-icon matSuffix color="accent">alt_route</mat-icon>
              </mat-form-field>

            </div>
          </mat-tab>

          <!-- TAB 2: ESPECIFICACIONES TÉCNICAS (23 CAMPOS EN ORDEN EXACTO) -->
          <mat-tab label="2. Especificaciones Técnicas (23 Campos)">
            <div class="tech-specs-header">
              <span>Secuencia oficial MTC / DRTC Puno (1 a 23)</span>
            </div>
            <div class="tab-content-grid-4">
              
              <!-- 1. PLACA -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>1. PLACA *</mat-label>
                <input matInput formControlName="placa" placeholder="Ej: V5H-958" style="text-transform:uppercase; font-weight:800; font-family:monospace;" required>
                <mat-icon matSuffix color="primary">directions_car</mat-icon>
              </mat-form-field>

              <!-- 2. MARCA -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>2. MARCA</mat-label>
                <input matInput formControlName="marca" placeholder="Ej: VOLVO, MERCEDES">
              </mat-form-field>

              <!-- 3. MODELO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>3. MODELO</mat-label>
                <input matInput formControlName="modelo" placeholder="Ej: B11R, COASTER">
              </mat-form-field>

              <!-- 4. ANIO_FABRICACION -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>4. AÑO FABRICACIÓN</mat-label>
                <input matInput type="number" formControlName="anio_fabricacion" placeholder="Ej: 2022">
              </mat-form-field>

              <!-- 5. COLOR -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>5. COLOR</mat-label>
                <input matInput formControlName="color" placeholder="Ej: BLANCO AZUL">
              </mat-form-field>

              <!-- 6. CATEGORIA -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>6. CATEGORÍA</mat-label>
                <mat-select formControlName="categoria">
                  <mat-option value="M3">M3 - Bus / Ómnibus (>5 Tn)</mat-option>
                  <mat-option value="M2">M2 - Minibús / Combi</mat-option>
                  <mat-option value="M1">M1 - Auto / Auto Colectivo</mat-option>
                  <mat-option value="N1">N1 - Camioneta Carga</mat-option>
                  <mat-option value="N2">N2 - Camión Mediano</mat-option>
                  <mat-option value="N3">N3 - Camión Pesado / Tráiler</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- 7. CARROCERIA -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>7. CARROCERÍA</mat-label>
                <input matInput formControlName="carroceria" placeholder="Ej: INTERPROVINCIAL, URBANO">
              </mat-form-field>

              <!-- 8. CLASE -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>8. CLASE</mat-label>
                <input matInput formControlName="clase" placeholder="Ej: ÓMNIBUS, MINIBÚS">
              </mat-form-field>

              <!-- 9. COMBUSTIBLE -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>9. COMBUSTIBLE</mat-label>
                <mat-select formControlName="combustible">
                  <mat-option value="DIESEL">DIESEL</mat-option>
                  <mat-option value="GASOLINA">GASOLINA</mat-option>
                  <mat-option value="GNV">GNV (Gas Natural)</mat-option>
                  <mat-option value="GLP">GLP (Gas Licuado)</mat-option>
                  <mat-option value="ELECTRICO">ELÉCTRICO</mat-option>
                  <mat-option value="HIBRIDO">HÍBRIDO</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- 10. NUMERO_MOTOR -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>10. NÚMERO MOTOR</mat-label>
                <input matInput formControlName="numero_motor" placeholder="Ej: D11K450...">
              </mat-form-field>

              <!-- 11. NUMERO_SERIE_VIN -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>11. N° SERIE / VIN</mat-label>
                <input matInput formControlName="numero_serie" placeholder="Ej: 9BM384000...">
              </mat-form-field>

              <!-- 12. NUM_PASAJEROS -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>12. N° PASAJEROS</mat-label>
                <input matInput type="number" formControlName="pasajeros" placeholder="Ej: 50">
              </mat-form-field>

              <!-- 13. NUM_ASIENTOS -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>13. N° ASIENTOS</mat-label>
                <input matInput type="number" formControlName="asientos" placeholder="Ej: 52">
              </mat-form-field>

              <!-- 14. CILINDROS -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>14. CILINDROS</mat-label>
                <input matInput type="number" formControlName="cilindros" placeholder="Ej: 6">
              </mat-form-field>

              <!-- 15. EJES -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>15. EJES</mat-label>
                <input matInput type="number" formControlName="ejes" placeholder="Ej: 3">
              </mat-form-field>

              <!-- 16. RUEDAS -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>16. RUEDAS</mat-label>
                <input matInput type="number" formControlName="ruedas" placeholder="Ej: 10">
              </mat-form-field>

              <!-- 17. PESO_BRUTO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>17. PESO BRUTO (Tn/kg)</mat-label>
                <input matInput type="number" step="0.01" formControlName="peso_bruto" placeholder="Ej: 18.00">
              </mat-form-field>

              <!-- 18. PESO_NETO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>18. PESO NETO (Tn/kg)</mat-label>
                <input matInput type="number" step="0.01" formControlName="peso_neto" placeholder="Ej: 12.50">
              </mat-form-field>

              <!-- 19. CARGA_UTIL -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>19. CARGA ÚTIL (Tn/kg)</mat-label>
                <input matInput type="number" step="0.01" formControlName="carga_util" placeholder="Ej: 5.50">
              </mat-form-field>

              <!-- 20. LARGO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>20. LARGO (m)</mat-label>
                <input matInput type="number" step="0.01" formControlName="largo" placeholder="Ej: 13.20">
              </mat-form-field>

              <!-- 21. ANCHO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>21. ANCHO (m)</mat-label>
                <input matInput type="number" step="0.01" formControlName="ancho" placeholder="Ej: 2.60">
              </mat-form-field>

              <!-- 22. ALTO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>22. ALTO (m)</mat-label>
                <input matInput type="number" step="0.01" formControlName="alto" placeholder="Ej: 3.80">
              </mat-form-field>

              <!-- 23. OBSERVACIONES -->
              <mat-form-field appearance="outline" floatLabel="always" style="grid-column: 1 / -1;">
                <mat-label>23. OBSERVACIONES</mat-label>
                <textarea matInput formControlName="observaciones" rows="2" placeholder="Ej: Observaciones de la ficha técnica del vehículo..."></textarea>
              </mat-form-field>

            </div>
          </mat-tab>

          <!-- TAB 3: ENLACES & NOTAS ADICIONALES -->
          <mat-tab label="3. Enlaces & Historial">
            <div style="display:flex; flex-direction:column; gap:12px; padding-top:16px;">
              
              <mat-form-field appearance="outline" floatLabel="always" style="width:100%;">
                <mat-label>Link Documento TUC (Google Drive)</mat-label>
                <input matInput formControlName="link_tuc" placeholder="https://drive.google.com/file/d/...">
                <mat-icon matSuffix color="primary">link</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always" style="width:100%;">
                <mat-label>Link Cédula / Notificación (Google Drive)</mat-label>
                <input matInput formControlName="link_notificacion" placeholder="https://drive.google.com/file/d/...">
                <mat-icon matSuffix color="accent">description</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always" style="width:100%;">
                <mat-label>Agregar Observación al Historial</mat-label>
                <input matInput formControlName="nueva_observacion" placeholder="Escribe un comentario u observación oficial para el registro...">
                <mat-icon matSuffix>comment</mat-icon>
              </mat-form-field>

            </div>
          </mat-tab>

        </mat-tab-group>

        <!-- ACCIONES INFERIORES -->
        <div class="dialog-actions">
          <button mat-button type="button" (click)="cerrar()" [disabled]="saving">Cancelar</button>
          <button mat-flat-button color="primary" type="submit" class="btn-save" [disabled]="form.invalid || saving">
            @if (saving) {
              <mat-spinner diameter="18" style="display:inline-block; margin-right:8px;"></mat-spinner>
            }
            <mat-icon>{{ isEdit ? 'save' : 'add_circle' }}</mat-icon>
            <span>{{ isEdit ? 'Guardar Cambios' : 'Registrar Vehículo' }}</span>
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .vehiculo-dialog-container {
      background-color: #0f172a;
      color: #f8fafc;
      border-radius: 16px;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .dialog-header {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      padding: 16px 24px;
      border-bottom: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-flex {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #38bdf8;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
    }

    .dialog-subtitle {
      margin: 2px 0 0 0;
      font-size: 12px;
      color: #94a3b8;
    }

    .dialog-body {
      padding: 16px 24px;
      max-height: 75vh;
      overflow-y: auto;
    }

    .tech-specs-header {
      padding: 8px 12px;
      margin-top: 12px;
      background: rgba(56, 189, 248, 0.1);
      border-left: 4px solid #38bdf8;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #38bdf8;
    }

    .tab-content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      padding-top: 16px;
    }

    .tab-content-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding-top: 16px;
    }

    @media (max-width: 900px) {
      .tab-content-grid-4 {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    ::ng-deep .custom-tabs .mat-mdc-tab-header {
      background: #1e293b;
      border-radius: 10px;
    }

    ::ng-deep .custom-tabs .mat-mdc-tab-link, ::ng-deep .custom-tabs .mdc-tab__text-label {
      color: #94a3b8 !important;
      font-weight: 700 !important;
      font-size: 13px !important;
    }

    ::ng-deep .custom-tabs .mdc-tab--active .mdc-tab__text-label {
      color: #38bdf8 !important;
    }

    ::ng-deep .vehiculo-dialog-container input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1);
      cursor: pointer;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 0 0 0;
      border-top: 1px solid #1e293b;
      margin-top: 16px;
    }

    .btn-save {
      background: #2563eb;
      color: white;
      font-weight: 700;
    }
  `]
})
export class FormVehiculoDialogComponent implements OnInit {
  form!: FormGroup;
  saving = false;

  get isEdit(): boolean {
    return this.data.modo === 'editar' && !!this.data.vehiculo;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FormVehiculoDialogData,
    private dialogRef: MatDialogRef<FormVehiculoDialogComponent>,
    private fb: FormBuilder,
    private service: FlotaEmpresaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const v = this.data.vehiculo || {} as Partial<VehiculoEmpresa>;

    const fechaRes = v.fecha_emision_resolucion 
      ? new Date(v.fecha_emision_resolucion).toISOString().substring(0, 10) 
      : '';

    const fechaExp = v.fecha_expediente 
      ? new Date(v.fecha_expediente).toISOString().substring(0, 10) 
      : '';

    this.form = this.fb.group({
      // Resolución, Expediente & Control
      nro_resolucion_primigenia: [this.data.nro_resolucion_primigenia || v.nro_resolucion_primigenia || '', Validators.required],
      fecha_emision_resolucion: [fechaRes],
      expediente: [v.expediente || v.num_expediente || ''],
      fecha_expediente: [fechaExp],
      nro_resolucion_hija: [v.nro_resolucion_hija || ''],
      tipo_resolucion_hija: [v.tipo_resolucion_hija || ''],
      estado: [v.estado || 'HABILITADO', Validators.required],
      numero_tuc: [v.numero_tuc || ''],
      ruc: [{ value: this.data.ruc || v.ruc || '', disabled: true }],
      rutas_str: [(v.rutas || []).join(', ')],

      // 23 Datos Técnicos del Vehículo en ORDEN STRICTO
      placa: [v.placa || '', [Validators.required, Validators.minLength(6)]],
      marca: [v.marca || ''],
      modelo: [v.modelo || ''],
      anio_fabricacion: [v.anio_fabricacion || ''],
      color: [v.color || ''],
      categoria: [v.categoria || 'M3'],
      carroceria: [v.carroceria || ''],
      clase: [v.clase || ''],
      combustible: [v.combustible || 'DIESEL'],
      numero_motor: [v.numero_motor || ''],
      numero_serie: [v.numero_serie || v.vin || ''],
      pasajeros: [v.pasajeros || ''],
      asientos: [v.asientos || ''],
      cilindros: [v.cilindros || ''],
      ejes: [v.ejes || ''],
      ruedas: [v.ruedas || ''],
      peso_bruto: [v.peso_bruto || ''],
      peso_neto: [v.peso_neto || ''],
      carga_util: [v.carga_util || ''],
      largo: [v.largo || ''],
      ancho: [v.ancho || ''],
      alto: [v.alto || ''],
      observaciones: [v.observaciones || v.detalles || ''],

      // Enlaces & Observaciones Adicionales
      link_tuc: [v.link_tuc || ''],
      link_notificacion: [v.link_notificacion || ''],
      nueva_observacion: ['']
    });
  }

  cerrar(updated = false): void {
    this.dialogRef.close(updated);
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const val = this.form.getRawValue();
    const rutasArray = val.rutas_str
      ? val.rutas_str.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean)
      : [];

    const payload: any = {
      ruc: this.data.ruc || val.ruc,
      razon_social: this.data.razon_social || (this.data.vehiculo ? this.data.vehiculo.razon_social : ''),
      nro_resolucion_primigenia: val.nro_resolucion_primigenia.trim().toUpperCase(),
      fecha_emision_resolucion: val.fecha_emision_resolucion ? new Date(val.fecha_emision_resolucion).toISOString() : undefined,
      num_expediente: val.expediente?.trim().toUpperCase() || undefined,
      expediente: val.expediente?.trim().toUpperCase() || undefined,
      fecha_expediente: val.fecha_expediente ? new Date(val.fecha_expediente).toISOString() : undefined,
      nro_resolucion_hija: val.nro_resolucion_hija?.trim().toUpperCase() || undefined,
      tipo_resolucion_hija: val.tipo_resolucion_hija || undefined,
      
      // 23 Datos Técnicos
      placa: val.placa.trim().toUpperCase(),
      marca: val.marca?.trim().toUpperCase() || undefined,
      modelo: val.modelo?.trim().toUpperCase() || undefined,
      anio_fabricacion: val.anio_fabricacion ? Number(val.anio_fabricacion) : undefined,
      color: val.color?.trim().toUpperCase() || undefined,
      categoria: val.categoria,
      carroceria: val.carroceria?.trim().toUpperCase() || undefined,
      clase: val.clase?.trim().toUpperCase() || undefined,
      combustible: val.combustible,
      numero_motor: val.numero_motor?.trim().toUpperCase() || undefined,
      numero_serie: val.numero_serie?.trim().toUpperCase() || undefined,
      vin: val.numero_serie?.trim().toUpperCase() || undefined,
      pasajeros: val.pasajeros ? Number(val.pasajeros) : undefined,
      asientos: val.asientos ? Number(val.asientos) : undefined,
      cilindros: val.cilindros ? Number(val.cilindros) : undefined,
      ejes: val.ejes ? Number(val.ejes) : undefined,
      ruedas: val.ruedas ? Number(val.ruedas) : undefined,
      peso_bruto: val.peso_bruto ? Number(val.peso_bruto) : undefined,
      peso_neto: val.peso_neto ? Number(val.peso_neto) : undefined,
      carga_util: val.carga_util ? Number(val.carga_util) : undefined,
      largo: val.largo ? Number(val.largo) : undefined,
      ancho: val.ancho ? Number(val.ancho) : undefined,
      alto: val.alto ? Number(val.alto) : undefined,
      observaciones: val.observaciones?.trim() || undefined,

      numero_tuc: val.numero_tuc?.trim().toUpperCase() || undefined,
      estado: val.estado,
      rutas: rutasArray,
      link_tuc: val.link_tuc?.trim() || undefined,
      link_notificacion: val.link_notificacion?.trim() || undefined,
      detalles: val.observaciones?.trim() || undefined,
      es_cronologico: false
    };

    if (val.nueva_observacion?.trim()) {
      const actualObs = this.data.vehiculo?.observaciones_historial || [];
      payload.observaciones_historial = [
        ...actualObs,
        {
          fecha: new Date().toISOString(),
          texto: val.nueva_observacion.trim(),
          usuario: 'Operador DRTC'
        }
      ];
    }

    if (this.isEdit && this.data.vehiculo?.id) {
      this.service.update(this.data.vehiculo.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open(`Vehículo ${payload.placa} actualizado con éxito.`, 'Excelente', { duration: 3500 });
          this.cerrar(true);
        },
        error: (err) => {
          this.saving = false;
          this.snackBar.open(`Error al actualizar vehículo: ${err?.error?.detail || err.message}`, 'Cerrar', { duration: 4000 });
        }
      });
    } else {
      const createData: VehiculoEmpresaCreate = payload;
      this.service.create(createData).subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open(`Vehículo ${payload.placa} registrado en la flota exitosamente.`, 'Excelente', { duration: 3500 });
          this.cerrar(true);
        },
        error: (err) => {
          this.saving = false;
          this.snackBar.open(`Error al registrar vehículo: ${err?.error?.detail || err.message}`, 'Cerrar', { duration: 4000 });
        }
      });
    }
  }
}
