import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
import { environment } from '../../../environments/environment';

export interface FormVehiculoDialogData {
  modo: 'crear' | 'editar';
  ruc: string;
  razon_social?: string;
  nro_resolucion_primigenia?: string;
  vehiculo?: VehiculoEmpresa;
}

export interface ExpedienteItem {
  numero: string;
  fecha: string;
}

@Component({
  selector: 'app-form-vehiculo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
          
          <!-- TAB 1: RESOLUCIÓN, EXPEDIENTES & CONTROL -->
          <mat-tab label="1. Autorización & Expediente">
            <div class="tab-content-grid">
              
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Resolución Primigenia *</mat-label>
                <input matInput formControlName="nro_resolucion_primigenia" (blur)="onResolucionPrimigeniaBlur()" placeholder="Ej: 0141 -> R-0141-2024" required>
                <mat-icon matSuffix color="primary">verified</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Fecha Emisión Primigenia</mat-label>
                <input matInput type="date" formControlName="fecha_emision_resolucion">
                <mat-icon matSuffix color="primary">event</mat-icon>
              </mat-form-field>

              <!-- BLOQUE MULTI-EXPEDIENTE -->
              <div class="expedientes-container style-full">
                <div class="expedientes-header">
                  <div class="exp-title">
                    <mat-icon class="icon-accent">folder_open</mat-icon>
                    <span>Expedientes del Trámite (Formato: E-XXXX-YYYY)</span>
                  </div>
                  <button mat-stroked-button type="button" class="btn-add-exp" (click)="agregarExpediente()">
                    <mat-icon>add</mat-icon> Agregar otro Expediente
                  </button>
                </div>

                <div class="expedientes-list">
                  @for (exp of expedientes; track $index) {
                    <div class="expediente-row">
                      <mat-form-field appearance="outline" floatLabel="always" class="exp-input">
                        <mat-label>N° Expediente {{ expedientes.length > 1 ? '#' + ($index + 1) : '' }}</mat-label>
                        <input matInput [(ngModel)]="exp.numero" [ngModelOptions]="{standalone: true}" 
                               (blur)="onExpedienteBlur($index)" placeholder="Ej: 0123 -> E-0123-2026">
                        <mat-icon matSuffix color="primary">folder</mat-icon>
                      </mat-form-field>

                      <mat-form-field appearance="outline" floatLabel="always" class="exp-date">
                        <mat-label>Fecha de Expediente {{ expedientes.length > 1 ? '#' + ($index + 1) : '' }}</mat-label>
                        <input matInput type="date" [(ngModel)]="exp.fecha" [ngModelOptions]="{standalone: true}">
                        <mat-icon matSuffix color="primary">calendar_today</mat-icon>
                      </mat-form-field>

                      @if (expedientes.length > 1) {
                        <button mat-icon-button type="button" color="warn" class="btn-del-exp" (click)="eliminarExpediente($index)" title="Eliminar expediente">
                          <mat-icon>delete_outline</mat-icon>
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Resolución Hija (Opcional)</mat-label>
                <input matInput formControlName="nro_resolucion_hija" (blur)="onResolucionHijaBlur()" placeholder="Ej: 0123 -> R-0123-2026">
                <mat-hint style="font-size:10px; color:#38bdf8;">Formato: R-0123-2026</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Tipo Resolución Hija</mat-label>
                <mat-select formControlName="tipo_resolucion_hija" (selectionChange)="onTipoResolucionHijaChange($event.value)">
                  <mat-option value="">-- Sin Res. Hija --</mat-option>
                  <mat-option value="I">I - Incremento de Flota</mat-option>
                  <mat-option value="S">S - Sustitución de Vehículo</mat-option>
                  <mat-option value="R">R - Renovación</mat-option>
                  <mat-option value="M">M - Modificación</mat-option>
                  <mat-option value="FE">FE - Fe de Erratas</mat-option>
                  <mat-option value="D">D - Duplicado</mat-option>
                  <mat-option value="C">C - Cancelación / Canje</mat-option>
                  <mat-option value="O">O - Otros Trámites</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Estado de Habilitación *</mat-label>
                <mat-select formControlName="estado">
                  <mat-option value="HABILITADO">✅ HABILITADO</mat-option>
                  <mat-option value="INHABILITADO">⛔ INHABILITADO</mat-option>
                  <mat-option value="OBSERVADO">⚠️ OBSERVADO</mat-option>
                  <mat-option value="CANCELADO">❌ CANCELADO</mat-option>
                  <mat-option value="SUSPENDIDO">🚫 SUSPENDIDO</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="tuc-input-wrap">
                <mat-form-field appearance="outline" floatLabel="always" class="field-flex">
                  <mat-label>Número de TUC</mat-label>
                  <input matInput formControlName="numero_tuc" placeholder="Ej: TE-000123">
                  <mat-icon matSuffix>badge</mat-icon>
                </mat-form-field>
                <button mat-stroked-button type="button" class="btn-gen-tuc" (click)="generarSiguienteTuc()" [disabled]="generandoTuc" title="Generar correlativo desde módulo TUCs">
                  @if (generandoTuc) {
                    <mat-spinner diameter="16" style="display:inline-block; margin-right:4px;"></mat-spinner>
                  } @else {
                    <mat-icon>auto_awesome</mat-icon>
                  }
                  <span>Generar TUC</span>
                </button>
              </div>

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
              
              <!-- 1. PLACA CON BÚSQUEDA AUTOMÁTICA -->
              <div class="placa-search-box">
                <mat-form-field appearance="outline" floatLabel="always" style="flex:1;">
                  <mat-label>1. PLACA *</mat-label>
                  <input matInput formControlName="placa" placeholder="Ej: V5H-958" style="text-transform:uppercase; font-weight:800; font-family:monospace;" required>
                </mat-form-field>
                <button mat-flat-button color="accent" type="button" class="btn-search-pcm" (click)="buscarDatosPcmPlaca()" [disabled]="buscandoPcm" title="Consultar SUNARP/PCM o BD local">
                  @if (buscandoPcm) {
                    <mat-spinner diameter="16"></mat-spinner>
                  } @else {
                    <mat-icon>search</mat-icon>
                  }
                </button>
              </div>

              <!-- 2. MARCA -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>2. MARCA</mat-label>
                <input matInput formControlName="marca" placeholder="Ej: TOYOTA, VOLVO">
              </mat-form-field>

              <!-- 3. MODELO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>3. MODELO</mat-label>
                <input matInput formControlName="modelo" placeholder="Ej: HIACE, COASTER">
              </mat-form-field>

              <!-- 4. ANIO_FABRICACION -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>4. AÑO FABRICACIÓN (MTC)</mat-label>
                <input matInput type="number" formControlName="anio_fabricacion" placeholder="Ej: 2022">
                <mat-hint>Base legal de permanencia (TIV)</mat-hint>
              </mat-form-field>

              <!-- 4.1 ANIO_MODELO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>4.1 AÑO MODELO (COMERCIAL)</mat-label>
                <input matInput type="number" formControlName="anio_modelo" placeholder="Ej: 2023">
                <mat-hint>Designación del fabricante</mat-hint>
              </mat-form-field>

              <!-- 5. COLOR -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>5. COLOR</mat-label>
                <input matInput formControlName="color" placeholder="Ej: BLANCO">
              </mat-form-field>

              <!-- 6. CATEGORIA (Solo códigos limpios) -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>6. CATEGORÍA</mat-label>
                <mat-select formControlName="categoria" (selectionChange)="onCategoriaSelectChange($event.value)">
                  <mat-option value="M2">M2</mat-option>
                  <mat-option value="M2-C3">M2-C3</mat-option>
                  <mat-option value="M3">M3</mat-option>
                  <mat-option value="M3-C3">M3-C3</mat-option>
                  <mat-option value="M1">M1</mat-option>
                  <mat-option value="N1">N1</mat-option>
                  <mat-option value="N2">N2</mat-option>
                  <mat-option value="N3">N3</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- 7. CLASE (Al lado de categoría, auto C3 si categoría es M2-C3 o M3-C3) -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>7. CLASE</mat-label>
                <input matInput formControlName="clase" placeholder="Ej: C3 o vacío">
                <mat-hint style="font-size:10px; color:#38bdf8;">Auto 'C3' si cat. es M2-C3 / M3-C3</mat-hint>
              </mat-form-field>

              <!-- 8. CARROCERIA -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>8. CARROCERÍA</mat-label>
                <input matInput formControlName="carroceria" placeholder="Ej: MICROBUS, OMNIBUS">
              </mat-form-field>

              <!-- 9. COMBUSTIBLE -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>9. COMBUSTIBLE</mat-label>
                <mat-select formControlName="combustible">
                  <mat-option value="DIESEL">DIESEL</mat-option>
                  <mat-option value="GASOLINA">GASOLINA</mat-option>
                  <mat-option value="GNV">GNV</mat-option>
                  <mat-option value="GLP">GLP</mat-option>
                  <mat-option value="ELECTRICO">ELÉCTRICO</mat-option>
                  <mat-option value="HIBRIDO">HÍBRIDO</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- 10. NUMERO_MOTOR -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>10. NÚMERO MOTOR</mat-label>
                <input matInput formControlName="numero_motor" class="font-mono">
              </mat-form-field>

              <!-- 11. NUMERO_SERIE_VIN -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>11. N° SERIE / VIN</mat-label>
                <input matInput formControlName="numero_serie" class="font-mono">
              </mat-form-field>

              <!-- 12. NUM_PASAJEROS -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>12. N° PASAJEROS</mat-label>
                <input matInput type="number" formControlName="pasajeros" placeholder="Ej: 15">
              </mat-form-field>

              <!-- 13. NUM_ASIENTOS -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>13. N° ASIENTOS</mat-label>
                <input matInput type="number" formControlName="asientos" placeholder="Ej: 16">
              </mat-form-field>

              <!-- 14. CILINDROS -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>14. CILINDROS</mat-label>
                <input matInput type="number" formControlName="cilindros" placeholder="Ej: 4">
              </mat-form-field>

              <!-- 15. EJES -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>15. EJES</mat-label>
                <input matInput type="number" formControlName="ejes" placeholder="Ej: 2">
              </mat-form-field>

              <!-- 16. RUEDAS -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>16. RUEDAS</mat-label>
                <input matInput type="number" formControlName="ruedas" placeholder="Ej: 4">
              </mat-form-field>

              <!-- 17. PESO_BRUTO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>17. PESO BRUTO (Kg)</mat-label>
                <input matInput type="number" step="0.01" formControlName="peso_bruto">
              </mat-form-field>

              <!-- 18. PESO_NETO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>18. PESO NETO (Kg)</mat-label>
                <input matInput type="number" step="0.01" formControlName="peso_neto">
              </mat-form-field>

              <!-- 19. CARGA_UTIL -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>19. CARGA ÚTIL (Kg)</mat-label>
                <input matInput type="number" step="0.01" formControlName="carga_util">
              </mat-form-field>

              <!-- 20. LARGO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>20. LARGO (m)</mat-label>
                <input matInput type="number" step="0.01" formControlName="largo">
              </mat-form-field>

              <!-- 21. ANCHO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>21. ANCHO (m)</mat-label>
                <input matInput type="number" step="0.01" formControlName="ancho">
              </mat-form-field>

              <!-- 22. ALTO -->
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>22. ALTO (m)</mat-label>
                <input matInput type="number" step="0.01" formControlName="alto">
              </mat-form-field>

              <!-- 23. OBSERVACIONES -->
              <mat-form-field appearance="outline" floatLabel="always" style="grid-column: 1 / -1;">
                <mat-label>23. OBSERVACIONES TÉCNICAS / PROPIETARIO</mat-label>
                <textarea matInput formControlName="observaciones" rows="2" placeholder="Observaciones técnicas de ficha, titular SUNARP, etc..."></textarea>
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

    .style-full {
      grid-column: 1 / -1;
    }

    .expedientes-container {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .expedientes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .exp-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 700;
      color: #38bdf8;
    }

    .icon-accent {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #38bdf8;
    }

    .btn-add-exp {
      height: 32px;
      font-size: 11.5px;
      color: #38bdf8;
      border-color: rgba(56, 189, 248, 0.4);
      font-weight: 600;
      line-height: 30px;
      padding: 0 10px;
    }

    .btn-add-exp mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 2px;
    }

    .expedientes-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .expediente-row {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .exp-input {
      flex: 1.4;
    }

    .exp-date {
      flex: 1;
    }

    .btn-del-exp {
      width: 36px;
      height: 36px;
      margin-top: -16px;
    }

    .tuc-input-wrap {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .field-flex {
      flex: 1;
    }

    .btn-gen-tuc {
      height: 52px;
      margin-top: 2px;
      border-color: rgba(56, 189, 248, 0.5);
      color: #38bdf8;
      font-weight: 700;
      white-space: nowrap;
    }

    .placa-search-box {
      display: flex;
      gap: 6px;
      align-items: flex-start;
    }

    .btn-search-pcm {
      height: 52px;
      min-width: 48px;
      padding: 0 12px;
      margin-top: 2px;
      border-radius: 8px;
    }

    .font-mono {
      font-family: monospace, monospace;
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
  generandoTuc = false;
  buscandoPcm = false;
  expedientes: ExpedienteItem[] = [{ numero: '', fecha: '' }];

  get isEdit(): boolean {
    return this.data.modo === 'editar' && !!this.data.vehiculo;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FormVehiculoDialogData,
    private dialogRef: MatDialogRef<FormVehiculoDialogComponent>,
    private fb: FormBuilder,
    private service: FlotaEmpresaService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  // --------------------------------------------------------------------------
  // FORMATEADORES AUTOMÁTICOS
  // --------------------------------------------------------------------------

  formatExpediente(rawVal: string, defaultYear: number | string = new Date().getFullYear()): string {
    if (!rawVal) return '';
    const str = rawVal.trim().toUpperCase();
    if (!str) return '';

    const clean = str.replace(/^E[-_ ]*/i, '').trim();
    const parts = clean.split(/[-/]/);
    if (parts.length >= 2) {
      const numDigits = parts[0].replace(/\D/g, '');
      const numPart = numDigits ? numDigits.padStart(4, '0') : parts[0];
      const yearPart = parts[1].replace(/\D/g, '') || String(defaultYear);
      return `E-${numPart}-${yearPart}`;
    } else {
      const numDigits = clean.replace(/\D/g, '');
      if (numDigits) {
        const numPart = numDigits.padStart(4, '0');
        return `E-${numPart}-${defaultYear}`;
      }
    }
    return str.startsWith('E-') ? str : `E-${str}`;
  }

  formatResolucionPrimigenia(rawVal: string, defaultYear: number | string = new Date().getFullYear()): string {
    if (!rawVal) return '';
    const str = rawVal.trim().toUpperCase();
    if (!str) return '';

    const clean = str.replace(/^R[-_ ]*/i, '').trim();
    const parts = clean.split(/[-/]/);
    if (parts.length >= 2) {
      const numDigits = parts[0].replace(/\D/g, '');
      const numPart = numDigits ? numDigits.padStart(4, '0') : parts[0];
      const yearPart = parts[1].replace(/\D/g, '') || String(defaultYear);
      return `R-${numPart}-${yearPart}`;
    } else {
      const numDigits = clean.replace(/\D/g, '');
      if (numDigits) {
        const numPart = numDigits.padStart(4, '0');
        return `R-${numPart}-${defaultYear}`;
      }
    }
    return str.startsWith('R-') ? str : `R-${str}`;
  }

  formatResolucionHija(rawVal: string, tipoHija: string = '', defaultYear: number | string = new Date().getFullYear()): string {
    if (!rawVal) return '';
    let str = rawVal.trim().toUpperCase();
    if (!str) return '';

    // Extraer sufijo si se ingresó tipo '0123-2026 -FE', '0123-2026 -I', etc.
    const suffixMatch = str.match(/\s*[-_ ]\s*(FE|[ISRMDCO])$/i);
    if (suffixMatch) {
      if (this.form && !this.form.get('tipo_resolucion_hija')?.value) {
        this.form.patchValue({ tipo_resolucion_hija: suffixMatch[1].toUpperCase() });
      }
      str = str.substring(0, suffixMatch.index).trim();
    }

    const clean = str.replace(/^R[-_ ]*/i, '').trim();
    const parts = clean.split(/[-/]/);
    if (parts.length >= 2) {
      const numDigits = parts[0].replace(/\D/g, '');
      const numPart = numDigits ? numDigits.padStart(4, '0') : parts[0];
      const yearPart = parts[1].replace(/\D/g, '') || String(defaultYear);
      return `R-${numPart}-${yearPart}`;
    } else {
      const numDigits = clean.replace(/\D/g, '');
      if (numDigits) {
        const numPart = numDigits.padStart(4, '0');
        return `R-${numPart}-${defaultYear}`;
      }
    }

    return str.startsWith('R-') ? str : `R-${str}`;
  }

  ngOnInit(): void {
    const v = this.data.vehiculo || {} as Partial<VehiculoEmpresa>;

    const fechaRes = v.fecha_emision_resolucion 
      ? (typeof v.fecha_emision_resolucion === 'string' && v.fecha_emision_resolucion.length >= 10
          ? v.fecha_emision_resolucion.substring(0, 10)
          : new Date(v.fecha_emision_resolucion).toISOString().substring(0, 10))
      : '';

    // Cargar expedientes múltiples
    const rawExpStr = v.expediente || v.num_expediente || '';
    const rawExps = rawExpStr ? rawExpStr.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    let rawFechas: string[] = [];
    if (typeof v.fecha_expediente === 'string') {
      rawFechas = v.fecha_expediente.split(',').map(s => s.trim().substring(0, 10)).filter(Boolean);
    } else if (v.fecha_expediente) {
      try {
        rawFechas = [new Date(v.fecha_expediente).toISOString().substring(0, 10)];
      } catch (_) {}
    }

    if (rawExps.length > 0) {
      this.expedientes = rawExps.map((num, idx) => ({
        numero: num,
        fecha: rawFechas[idx] || (rawFechas[0] ? rawFechas[0] : '')
      }));
    } else {
      this.expedientes = [{
        numero: '',
        fecha: rawFechas[0] || ''
      }];
    }

    let catVal = (v.categoria || 'M2').toUpperCase();
    let claseVal = v.clase || '';
    if (claseVal === 'MICROBUS') {
      claseVal = catVal.includes('C3') ? 'C3' : '';
    } else if (!claseVal && catVal.includes('C3')) {
      claseVal = 'C3';
    }

    this.form = this.fb.group({
      // Resolución, Expediente & Control
      nro_resolucion_primigenia: [this.data.nro_resolucion_primigenia || v.nro_resolucion_primigenia || '', Validators.required],
      fecha_emision_resolucion: [fechaRes],
      nro_resolucion_hija: [v.nro_resolucion_hija || ''],
      tipo_resolucion_hija: [v.tipo_resolucion_hija || ''],
      estado: [v.estado || 'HABILITADO', Validators.required],
      numero_tuc: [v.numero_tuc || ''],
      ruc: [{ value: this.data.ruc || v.ruc || '', disabled: true }],
      rutas_str: [(v.rutas || []).join(', ')],

      // 23 Datos Técnicos del Vehículo en ORDEN STRICTO
      placa: [v.placa || '', [Validators.required, Validators.minLength(6)]],
      marca: [v.marca || ''],
      anio_fabricacion: [v.anio_fabricacion || ''],
      anio_modelo: [v.anio_modelo || ''],
      color: [v.color || ''],
      categoria: [catVal],
      clase: [claseVal],
      carroceria: [v.carroceria || ''],
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

    // En modo creación, si TUC está vacío, precargar el siguiente correlativo opcionalmente
    if (!this.isEdit && !v.numero_tuc) {
      this.generarSiguienteTuc();
    }
  }

  agregarExpediente(): void {
    this.expedientes.push({ numero: '', fecha: '' });
  }

  eliminarExpediente(index: number): void {
    if (this.expedientes.length > 1) {
      this.expedientes.splice(index, 1);
    } else {
      this.expedientes[0] = { numero: '', fecha: '' };
    }
  }

  onExpedienteBlur(index: number): void {
    const item = this.expedientes[index];
    if (!item.numero) return;
    let year: number | string = new Date().getFullYear();
    if (item.fecha) {
      const y = new Date(item.fecha).getFullYear();
      if (y && !isNaN(y)) year = y;
    }
    item.numero = this.formatExpediente(item.numero, year);
  }

  onResolucionPrimigeniaBlur(): void {
    const curVal = this.form.get('nro_resolucion_primigenia')?.value;
    if (!curVal) return;
    const fechaRes = this.form.get('fecha_emision_resolucion')?.value;
    let year: number | string = new Date().getFullYear();
    if (fechaRes) {
      const y = new Date(fechaRes).getFullYear();
      if (y && !isNaN(y)) year = y;
    }
    this.form.patchValue({
      nro_resolucion_primigenia: this.formatResolucionPrimigenia(curVal, year)
    });
  }

  onResolucionHijaBlur(): void {
    const curVal = this.form.get('nro_resolucion_hija')?.value;
    if (!curVal) return;
    const tipoHija = this.form.get('tipo_resolucion_hija')?.value;
    const fechaRes = this.form.get('fecha_emision_resolucion')?.value;
    let year: number | string = new Date().getFullYear();
    if (fechaRes) {
      const y = new Date(fechaRes).getFullYear();
      if (y && !isNaN(y)) year = y;
    }
    this.form.patchValue({
      nro_resolucion_hija: this.formatResolucionHija(curVal, tipoHija, year)
    });
  }

  onTipoResolucionHijaChange(tipo: string): void {
    const curVal = this.form.get('nro_resolucion_hija')?.value;
    if (curVal) {
      const fechaRes = this.form.get('fecha_emision_resolucion')?.value;
      let year: number | string = new Date().getFullYear();
      if (fechaRes) {
        const y = new Date(fechaRes).getFullYear();
        if (y && !isNaN(y)) year = y;
      }
      this.form.patchValue({
        nro_resolucion_hija: this.formatResolucionHija(curVal, tipo, year)
      });
    }
  }

  onCategoriaSelectChange(cat: string): void {
    const upper = (cat || '').toUpperCase();
    if (upper === 'M2-C3' || upper === 'M3-C3' || upper.includes('C3')) {
      this.form.patchValue({ clase: 'C3' });
    } else {
      const curClase = this.form.get('clase')?.value;
      if (curClase === 'C3' || curClase === 'MICROBUS') {
        this.form.patchValue({ clase: '' });
      }
    }
  }

  async generarSiguienteTuc(): Promise<void> {
    this.generandoTuc = true;
    try {
      const resp: any = await this.http.get(`${environment.apiUrl}/tucs/siguiente-numero`).toPromise();
      if (resp?.siguienteNroTuc) {
        this.form.patchValue({ numero_tuc: resp.siguienteNroTuc });
        this.snackBar.open(`N° de TUC generado: ${resp.siguienteNroTuc}`, 'OK', { duration: 2500 });
      }
    } catch (e) {
      console.warn('Error generando correlativo TUC:', e);
      this.snackBar.open('No se pudo autogenerar el N° de TUC', 'Cerrar', { duration: 3000 });
    } finally {
      this.generandoTuc = false;
    }
  }

  async buscarDatosPcmPlaca(): Promise<void> {
    const rawPlaca = this.form.get('placa')?.value;
    if (!rawPlaca || rawPlaca.trim().length < 6) {
      this.snackBar.open('Ingrese una placa válida de al menos 6 caracteres', 'Entendido', { duration: 3000 });
      return;
    }

    this.buscandoPcm = true;
    const cleanPlaca = rawPlaca.trim().toUpperCase();
    try {
      const resp: any = await this.http.get(`${environment.apiUrl}/vehiculos-data/buscar/placa/${cleanPlaca}`).toPromise();
      if (resp?.success && resp?.data) {
        const d = resp.data;
        let cat = (d.categoria || 'M2').toUpperCase();
        let clase = d.clase || '';
        if (clase === 'MICROBUS') {
          clase = cat.includes('C3') ? 'C3' : '';
        } else if (!clase && cat.includes('C3')) {
          clase = 'C3';
        }

        let anioFab = d.anio_fabricacion;
        if (anioFab && Number(anioFab) <= 1900) {
          anioFab = null;
        }

        this.form.patchValue({
          placa: d.placa_actual || d.placa || cleanPlaca,
          marca: d.marca || d.marca_vehiculo || this.form.get('marca')?.value,
          modelo: d.modelo || d.modelo_vehiculo || this.form.get('modelo')?.value,
          anio_fabricacion: anioFab || this.form.get('anio_fabricacion')?.value,
          color: d.color || this.form.get('color')?.value,
          categoria: cat || this.form.get('categoria')?.value,
          clase: clase || this.form.get('clase')?.value,
          carroceria: d.carroceria || d.tipo_carroceria || this.form.get('carroceria')?.value,
          combustible: d.combustible || this.form.get('combustible')?.value || 'DIESEL',
          numero_motor: d.numero_motor || this.form.get('numero_motor')?.value,
          numero_serie: d.numero_serie || d.vin || this.form.get('numero_serie')?.value,
          pasajeros: d.numero_pasajeros || d.pasajeros || this.form.get('pasajeros')?.value,
          asientos: d.numero_asientos || d.asientos || this.form.get('asientos')?.value,
          cilindros: d.cilindrada || d.cilindros || this.form.get('cilindros')?.value,
          ejes: d.numero_ejes || d.ejes || this.form.get('ejes')?.value,
          ruedas: d.numero_ruedas || d.ruedas || this.form.get('ruedas')?.value,
          peso_bruto: d.peso_bruto || this.form.get('peso_bruto')?.value,
          peso_neto: d.peso_neto || d.peso_seco || this.form.get('peso_neto')?.value,
          carga_util: d.carga_util || this.form.get('carga_util')?.value,
          largo: d.longitud || d.largo || this.form.get('largo')?.value,
          ancho: d.ancho || this.form.get('ancho')?.value,
          alto: d.altura || d.alto || this.form.get('alto')?.value,
          observaciones: d.observaciones || (d.propietario ? `Propietario SUNARP: ${d.propietario}` : this.form.get('observaciones')?.value)
        });

        const origenLabel = resp.origen === 'PCM_API' ? 'SUNARP / PCM' : 'Base de Datos Local';
        this.snackBar.open(`Datos obtenidos exitosamente de ${origenLabel}.`, 'Excelente', { duration: 3500 });
      } else {
        this.snackBar.open('No se encontraron registros previos para esta placa. Puede llenar los campos manualmente.', 'Entendido', { duration: 4000 });
      }
    } catch (e) {
      console.warn('Error buscando placa:', e);
      this.snackBar.open('Error al consultar datos técnicos', 'Cerrar', { duration: 3000 });
    } finally {
      this.buscandoPcm = false;
    }
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

    // Combinar expedientes múltiples
    const numExpedientesStr = this.expedientes
      .map(e => (e.numero || '').trim())
      .filter(Boolean)
      .join(', ');

    const fechasExpedientesStr = this.expedientes
      .map(e => (e.fecha || '').trim())
      .filter(Boolean)
      .join(', ');

    const payload: any = {
      ruc: this.data.ruc || val.ruc,
      razon_social: this.data.razon_social || (this.data.vehiculo ? this.data.vehiculo.razon_social : ''),
      nro_resolucion_primigenia: val.nro_resolucion_primigenia.trim().toUpperCase(),
      fecha_emision_resolucion: val.fecha_emision_resolucion ? new Date(val.fecha_emision_resolucion).toISOString() : undefined,
      num_expediente: numExpedientesStr || undefined,
      expediente: numExpedientesStr || undefined,
      fecha_expediente: fechasExpedientesStr || undefined,
      nro_resolucion_hija: val.nro_resolucion_hija?.trim().toUpperCase() || undefined,
      tipo_resolucion_hija: val.tipo_resolucion_hija || undefined,
      
      // 23 Datos Técnicos
      placa: val.placa.trim().toUpperCase(),
      marca: val.marca?.trim().toUpperCase() || undefined,
      anio_fabricacion: val.anio_fabricacion ? Number(val.anio_fabricacion) : undefined,
      anio_modelo: val.anio_modelo ? Number(val.anio_modelo) : undefined,
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
