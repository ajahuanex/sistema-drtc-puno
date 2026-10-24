import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CustodiaService, DocumentoCustodia } from '../../services/custodia.service';
import { EmpresaService } from '../../services/empresa.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';

export interface DialogData {
  documento?: DocumentoCustodia;
  isEdit?: boolean;
}

@Component({
  selector: 'app-custodia-form-dialog',
  standalone: true,
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatAutocompleteModule
  ],
  template: `
    <div class="dialog-container">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-icon-box">
          <mat-icon>{{ isEdit ? 'edit_document' : 'archive' }}</mat-icon>
        </div>
        <div>
          <h2 class="dialog-title">
            {{ isEdit ? 'Editar Registro de Custodia' : 'Nuevo Ingreso a Custodia de Expedientes' }}
          </h2>
          <p class="dialog-subtitle">
            Recepción y control archivístico de expedientes y documentación remitida con Memorándum
          </p>
        </div>
        <button mat-icon-button (click)="cerrar()" class="close-btn" type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Form Body -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="dialog-body">
        
        <!-- SECCIÓN 1: DOCUMENTO DE REMISIÓN (MEMORÁNDUM) -->
        <div class="section-box section-memo">
          <div class="section-title">
            <mat-icon class="sec-icon text-indigo">mail</mat-icon>
            <span>1. Documento de Remisión (Memorándum / Oficio de Envío)</span>
          </div>

          <div class="grid-3">
            <mat-form-field appearance="outline">
              <mat-label>N° de Memorándum *</mat-label>
              <input matInput formControlName="nro_memorandum" placeholder="Ej. MEMO N° 0124-2026-GR-PUNO/DRTC-DCT" required>
              <mat-icon matPrefix>tag</mat-icon>
              @if (form.get('nro_memorandum')?.hasError('required') && form.get('nro_memorandum')?.touched) {
                <mat-error>El número de memorándum es obligatorio</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Fecha del Memorándum</mat-label>
              <input matInput type="date" formControlName="fecha_memorandum">
              <mat-icon matPrefix>calendar_today</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Área / Dependencia Remitente *</mat-label>
              <mat-select formControlName="area_remitente" required>
                @for (a of areasOpciones; track a) {
                  <mat-option [value]="a">{{ a }}</mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>corporate_fare</mat-icon>
            </mat-form-field>
          </div>

          <div class="grid-2">
            <mat-form-field appearance="outline">
              <mat-label>Remitente / Suscribe (Funcionario o Cargo)</mat-label>
              <input matInput formControlName="remitente_nombre" placeholder="Ej. Ing. Juan Pérez - Subdirector de Autorizaciones">
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Asunto o Sumilla del Memo</mat-label>
              <input matInput formControlName="asunto_memorandum" placeholder="Ej. Remite expediente administrativo para custodia y archivo definitivo">
              <mat-icon matPrefix>subject</mat-icon>
            </mat-form-field>
          </div>
        </div>

        <!-- SECCIÓN 2: DATOS DEL EXPEDIENTE ADMINISTRATIVO -->
        <div class="section-box section-expediente">
          <div class="section-title">
            <mat-icon class="sec-icon text-blue">folder_open</mat-icon>
            <span>2. Expediente y Acervo a Custodiar</span>
          </div>

          <div class="grid-4">
            <mat-form-field appearance="outline">
              <mat-label>N° de Expediente *</mat-label>
              <input matInput formControlName="nro_expediente" placeholder="Ej. E-0145-2025" required>
              <mat-icon matPrefix>folder</mat-icon>
              @if (form.get('nro_expediente')?.hasError('required') && form.get('nro_expediente')?.touched) {
                <mat-error>El número de expediente es obligatorio</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>N° de Folios Útiles *</mat-label>
              <input matInput type="number" formControlName="nro_folios" min="1" placeholder="Ej. 145" required>
              <mat-icon matPrefix>format_list_numbered</mat-icon>
              @if (form.get('nro_folios')?.hasError('min')) {
                <mat-error>Mínimo 1 folio</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>N° de Tomos / Cuerpos</mat-label>
              <input matInput type="number" formControlName="nro_tomos" min="1" placeholder="Ej. 1">
              <mat-icon matPrefix>layers</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tipo de Trámite</mat-label>
              <mat-select formControlName="tipo_tramite">
                @for (t of tiposTramite; track t.valor) {
                  <mat-option [value]="t.valor">{{ t.label }}</mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>category</mat-icon>
            </mat-form-field>
          </div>

          <div class="grid-1">
            <mat-form-field appearance="outline">
              <mat-label>Asunto o Materia del Expediente *</mat-label>
              <input matInput formControlName="asunto_expediente" placeholder="Ej. Solicitud de Otorgamiento de Autorización / Concesión de Ruta Puno - Desaguadero" required>
              <mat-icon matPrefix>description</mat-icon>
            </mat-form-field>
          </div>

          <!-- Administrado / Empresa y Resolución Vinculada -->
          <div class="grid-3">
            <mat-form-field appearance="outline">
              <mat-label>RUC o DNI del Administrado</mat-label>
              <input matInput formControlName="ruc" placeholder="Ej. 20448833921" (blur)="onRucBlur()">
              <mat-icon matPrefix>badge</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Razón Social o Nombre del Administrado</mat-label>
              <input matInput formControlName="razon_social" placeholder="Ej. EMPRESA DE TRANSPORTES SUR ANDINO S.A.C.">
              <mat-icon matPrefix>business</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Resolución Directoral Vinculada (si concluyó)</mat-label>
              <input matInput formControlName="nro_resolucion" placeholder="Ej. R-0141-2024">
              <mat-icon matPrefix>gavel</mat-icon>
            </mat-form-field>
          </div>
        </div>

        <!-- SECCIÓN 3: UBICACIÓN FÍSICA EN EL ARCHIVO Y CONSERVACIÓN -->
        <div class="section-box section-ubicacion">
          <div class="section-title">
            <mat-icon class="sec-icon text-amber">inventory_2</mat-icon>
            <span>3. Ubicación Física en Almacén / Archivo de Custodia</span>
          </div>

          <div class="grid-4">
            <mat-form-field appearance="outline">
              <mat-label>Estante / Módulo</mat-label>
              <input matInput formControlName="ubicacion_estante" placeholder="Ej. Estante E-03">
              <mat-icon matPrefix>table_rows</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Caja / Archivador / Balda</mat-label>
              <input matInput formControlName="ubicacion_archivador" placeholder="Ej. Caja 12 / Arch. A-04">
              <mat-icon matPrefix>archive</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Código de Ubicación / Marbete</mat-label>
              <input matInput formControlName="codigo_ubicacion" placeholder="Ej. E03-C12-A04">
              <mat-icon matPrefix>qr_code</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Estado de Conservación Física</mat-label>
              <mat-select formControlName="estado_conservacion">
                <mat-option value="BUENO">Bueno (Íntegro y legible)</mat-option>
                <mat-option value="REGULAR">Regular (Hojas amarillentas o desgastadas)</mat-option>
                <mat-option value="DETERIORADO">Deteriorado (Requiere restauración)</mat-option>
              </mat-select>
              <mat-icon matPrefix>health_and_safety</mat-icon>
            </mat-form-field>
          </div>

          <div class="grid-1">
            <mat-form-field appearance="outline">
              <mat-label>Observaciones Técnicas o Anotaciones Especiales</mat-label>
              <textarea matInput formControlName="observaciones" rows="2" placeholder="Ej. Contiene 02 tarjetas de circulación físicas engrapadas en foja 24, copias legalizadas y planos de ruta."></textarea>
            </mat-form-field>
          </div>
        </div>

        <!-- SECCIÓN 4: CARGA DE ARCHIVOS DIGITALES ESCANEADOS -->
        <div class="section-box section-archivos">
          <div class="section-title">
            <mat-icon class="sec-icon text-emerald">cloud_upload</mat-icon>
            <span>4. Digitalización y Archivos Adjuntos (PDF / Documentos Escaneados)</span>
          </div>

          <div class="grid-2">
            <!-- Archivo 1: Memo -->
            <div class="upload-dropzone" [class.has-file]="archivoMemoSeleccionado() || data.documento?.archivo_memo">
              <div class="dropzone-icon">
                <mat-icon>picture_as_pdf</mat-icon>
              </div>
              <div class="dropzone-info">
                <strong>Archivo Escaneado del Memorándum</strong>
                <span class="file-hint">Memorándum, informe o proveído con el que se remitió (PDF, máx. 30MB)</span>
                
                @if (archivoMemoSeleccionado()) {
                  <div class="file-chip selected">
                    <mat-icon>check_circle</mat-icon>
                    <span class="file-name">{{ archivoMemoSeleccionado()?.name }}</span>
                    <button type="button" mat-icon-button (click)="quitarArchivoMemo($event)" title="Quitar archivo">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </div>
                } @else if (data.documento?.archivo_memo) {
                  <div class="file-chip existing">
                    <mat-icon>link</mat-icon>
                    <span class="file-name">{{ data.documento?.nombre_archivo_memo || 'Memorándum Digitalizado' }}</span>
                    <a [href]="custodiaService.getArchivoUrl(data.documento?.archivo_memo)" target="_blank" class="link-view">Ver PDF</a>
                  </div>
                }
              </div>
              <input type="file" #fileMemoInput accept=".pdf,.doc,.docx,image/*" (change)="onMemoFileSelected($event)" style="display: none;">
              <button type="button" mat-stroked-button class="btn-select-file" (click)="fileMemoInput.click()">
                <mat-icon>upload_file</mat-icon>
                <span>{{ (archivoMemoSeleccionado() || data.documento?.archivo_memo) ? 'Cambiar PDF' : 'Seleccionar Memo PDF' }}</span>
              </button>
            </div>

            <!-- Archivo 2: Expediente Completo -->
            <div class="upload-dropzone" [class.has-file]="archivoExpedienteSeleccionado() || data.documento?.archivo_expediente">
              <div class="dropzone-icon text-blue">
                <mat-icon>folder_zip</mat-icon>
              </div>
              <div class="dropzone-info">
                <strong>Archivo Escaneado del Expediente en Custodia</strong>
                <span class="file-hint">Digitalización integral de las fojas y actuados en custodia (PDF, máx. 80MB)</span>

                @if (archivoExpedienteSeleccionado()) {
                  <div class="file-chip selected">
                    <mat-icon>check_circle</mat-icon>
                    <span class="file-name">{{ archivoExpedienteSeleccionado()?.name }}</span>
                    <button type="button" mat-icon-button (click)="quitarArchivoExpediente($event)" title="Quitar archivo">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </div>
                } @else if (data.documento?.archivo_expediente) {
                  <div class="file-chip existing">
                    <mat-icon>link</mat-icon>
                    <span class="file-name">{{ data.documento?.nombre_archivo_expediente || 'Expediente Escaneado' }}</span>
                    <a [href]="custodiaService.getArchivoUrl(data.documento?.archivo_expediente)" target="_blank" class="link-view">Ver Expediente PDF</a>
                  </div>
                }
              </div>
              <input type="file" #fileExpInput accept=".pdf,.zip,.rar" (change)="onExpedienteFileSelected($event)" style="display: none;">
              <button type="button" mat-stroked-button class="btn-select-file" (click)="fileExpInput.click()">
                <mat-icon>upload_file</mat-icon>
                <span>{{ (archivoExpedienteSeleccionado() || data.documento?.archivo_expediente) ? 'Cambiar Expediente' : 'Seleccionar Expediente PDF' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="dialog-actions">
          <button mat-button type="button" (click)="cerrar()" [disabled]="guardando()">
            Cancelar
          </button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || guardando()" class="btn-guardar">
            <mat-icon>{{ guardando() ? 'hourglass_top' : 'save' }}</mat-icon>
            <span>{{ guardando() ? 'Guardando en Custodia...' : (isEdit ? 'Actualizar Registro' : 'Registrar en Custodia') }}</span>
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      font-family: inherit;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 1.25rem 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dialog-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .dialog-subtitle {
      font-size: 0.78rem;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .close-btn {
      margin-left: auto;
      color: #94a3b8;
    }
    .dialog-body {
      padding: 1.25rem 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .section-box {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem 1.15rem;
      background: #ffffff;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 0.88rem;
      color: #1e293b;
      margin-bottom: 0.85rem;
    }
    .sec-icon {
      font-size: 19px;
      width: 19px;
      height: 19px;
    }
    .text-indigo { color: #4f46e5; }
    .text-blue { color: #2563eb; }
    .text-amber { color: #d97706; }
    .text-emerald { color: #059669; }

    .grid-1 { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
    .grid-4 { display: grid; grid-template-columns: 1.2fr 1fr 1fr 1.2fr; gap: 0.75rem; }

    @media (max-width: 768px) {
      .grid-2, .grid-3, .grid-4 {
        grid-template-columns: 1fr;
      }
    }

    .upload-dropzone {
      border: 1.5px dashed #cbd5e1;
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      transition: all 0.2s;
    }
    .upload-dropzone.has-file {
      border-color: #10b981;
      background: #f0fdf4;
    }
    .dropzone-icon {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      background: #fee2e2;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .dropzone-icon.text-blue {
      background: #eff6ff;
      color: #2563eb;
    }
    .dropzone-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .dropzone-info strong {
      font-size: 0.82rem;
      color: #1e293b;
    }
    .file-hint {
      font-size: 0.72rem;
      color: #64748b;
    }
    .file-chip {
      margin-top: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.74rem;
      font-weight: 600;
    }
    .file-chip.selected {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .file-chip.existing {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .file-chip .file-name {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .link-view {
      color: #2563eb;
      text-decoration: underline;
      font-size: 0.72rem;
      margin-left: 6px;
    }
    .btn-select-file {
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      height: 36px;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 0.5rem;
      border-top: 1px solid #f1f5f9;
      position: sticky;
      bottom: 0;
      background: white;
    }
    .btn-guardar {
      font-weight: 700;
      padding: 0 1.25rem;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  `]
})
export class CustodiaFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CustodiaFormDialogComponent>);
  public custodiaService = inject(CustodiaService);
  private empresaService = inject(EmpresaService);
  private snackBar = inject(MatSnackBar);

  isEdit = false;
  guardando = signal<boolean>(false);

  archivoMemoSeleccionado = signal<File | null>(null);
  archivoExpedienteSeleccionado = signal<File | null>(null);

  areasOpciones = [
    'SUBDIRECCIÓN DE AUTORIZACIONES',
    'SUBDIRECCIÓN DE FISCALIZACIÓN',
    'DIRECCIÓN DE CIRCULACIÓN TERRESTRE',
    'ASESORÍA JURÍDICA',
    'DIRECCIÓN REGIONAL DRTC PUNO',
    'MESA DE PARTES / TRÁMITE DOCUMENTARIO',
    'ARCHIVO CENTRAL GORE PUNO',
    'SUBDIRECCIÓN DE TRANSPORTE TERRESTRE',
    'OTRA DEPENDENCIA'
  ];

  tiposTramite = [
    { valor: 'CONCESION_RUTA', label: 'Concesión / Autorización de Ruta' },
    { valor: 'INCREMENTO_FLOTA', label: 'Incremento de Flota Vehicular' },
    { valor: 'SUSTITUCION_FLOTA', label: 'Sustitución de Flota Vehicular' },
    { valor: 'RENOVACION_PERMISO', label: 'Renovación de Permiso de Operación' },
    { valor: 'MODIFICACION_RUTA', label: 'Modificación de Ruta / Itinerario' },
    { valor: 'BAJA_VEHICULAR', label: 'Baja e Inhabilitación Vehicular' },
    { valor: 'SANCION_FISCALIZACION', label: 'Procedimiento Sancionador / PAD / Fiscalización' },
    { valor: 'DUPLICADO_TUC', label: 'Duplicado o Canje de TUC' },
    { valor: 'TRAMITE_GENERAL', label: 'Trámite Administrativo General' }
  ];

  form: FormGroup = this.fb.group({
    nro_memorandum: ['', Validators.required],
    fecha_memorandum: [new Date().toISOString().substring(0, 10)],
    area_remitente: ['SUBDIRECCIÓN DE AUTORIZACIONES', Validators.required],
    remitente_nombre: [''],
    asunto_memorandum: ['Remite expediente administrativo para custodia y archivo definitivo'],

    nro_expediente: ['', Validators.required],
    fecha_expediente: [''],
    nro_folios: [1, [Validators.required, Validators.min(1)]],
    nro_tomos: [1, [Validators.required, Validators.min(1)]],
    asunto_expediente: ['', Validators.required],
    tipo_tramite: ['CONCESION_RUTA'],

    ruc: [''],
    razon_social: [''],
    nro_resolucion: [''],

    ubicacion_estante: ['Estante 01'],
    ubicacion_archivador: ['Caja 01 / Archivador A'],
    codigo_ubicacion: [''],
    estado_conservacion: ['BUENO'],
    observaciones: ['']
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  ngOnInit(): void {
    if (this.data && this.data.documento) {
      this.isEdit = !!this.data.isEdit;
      const d = this.data.documento;
      this.form.patchValue({
        nro_memorandum: d.nro_memorandum,
        fecha_memorandum: d.fecha_memorandum || '',
        area_remitente: d.area_remitente,
        remitente_nombre: d.remitente_nombre || '',
        asunto_memorandum: d.asunto_memorandum || '',
        nro_expediente: d.nro_expediente,
        fecha_expediente: d.fecha_expediente || '',
        nro_folios: d.nro_folios || 1,
        nro_tomos: d.nro_tomos || 1,
        asunto_expediente: d.asunto_expediente,
        tipo_tramite: d.tipo_tramite || 'TRAMITE_GENERAL',
        ruc: d.ruc || '',
        razon_social: d.razon_social || '',
        nro_resolucion: d.nro_resolucion || '',
        ubicacion_estante: d.ubicacion_estante || '',
        ubicacion_archivador: d.ubicacion_archivador || '',
        codigo_ubicacion: d.codigo_ubicacion || '',
        estado_conservacion: d.estado_conservacion || 'BUENO',
        observaciones: d.observaciones || ''
      });
    }
  }

  onRucBlur(): void {
    const ruc = this.form.get('ruc')?.value?.trim();
    if (ruc && ruc.length === 11 && !this.form.get('razon_social')?.value) {
      this.empresaService.getEmpresas(0, 100).subscribe({
        next: (empresas) => {
          const emp = empresas.find(e => e.ruc === ruc);
          if (emp) {
            this.form.patchValue({ razon_social: emp.razonSocial });
            this.snackBar.open(`✓ Empresa autocompletada: ${emp.razonSocial}`, 'OK', { duration: 2500 });
          }
        }
      });
    }
  }

  onMemoFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.archivoMemoSeleccionado.set(file);
    }
  }

  quitarArchivoMemo(event: Event): void {
    event.stopPropagation();
    this.archivoMemoSeleccionado.set(null);
  }

  onExpedienteFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.archivoExpedienteSeleccionado.set(file);
    }
  }

  quitarArchivoExpediente(event: Event): void {
    event.stopPropagation();
    this.archivoExpedienteSeleccionado.set(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const val = this.form.value;

    if (this.isEdit && this.data.documento) {
      // Actualizar registro
      const docId = this.data.documento.id || this.data.documento._id!;
      this.custodiaService.actualizar(docId, val).subscribe({
        next: (res) => {
          // Si seleccionó nuevo memo o nuevo expediente, subirlos
          const promesas: Promise<any>[] = [];
          if (this.archivoMemoSeleccionado()) {
            promesas.push(this.custodiaService.subirArchivoMemo(docId, this.archivoMemoSeleccionado()!).toPromise());
          }
          if (this.archivoExpedienteSeleccionado()) {
            promesas.push(this.custodiaService.subirArchivoExpediente(docId, this.archivoExpedienteSeleccionado()!).toPromise());
          }

          Promise.all(promesas).then(() => {
            this.guardando.set(false);
            this.snackBar.open('✓ Registro de custodia actualizado correctamente', 'Cerrar', { duration: 3500 });
            this.dialogRef.close(true);
          }).catch(err => {
            this.guardando.set(false);
            this.snackBar.open('✓ Metadatos actualizados, pero hubo un detalle al subir archivos', 'OK', { duration: 4000 });
            this.dialogRef.close(true);
          });
        },
        error: (err) => {
          this.guardando.set(false);
          this.snackBar.open(`❌ Error al actualizar: ${err.message || 'Error en servidor'}`, 'Cerrar', { duration: 5000 });
        }
      });
    } else {
      // Crear registro con multipart (FormData)
      const fd = new FormData();
      Object.keys(val).forEach(k => {
        if (val[k] !== null && val[k] !== undefined && val[k] !== '') {
          fd.append(k, val[k]);
        }
      });

      if (this.archivoMemoSeleccionado()) {
        fd.append('archivo_memo', this.archivoMemoSeleccionado()!);
      }
      if (this.archivoExpedienteSeleccionado()) {
        fd.append('archivo_expediente', this.archivoExpedienteSeleccionado()!);
      }

      this.custodiaService.crearConArchivos(fd).subscribe({
        next: (nuevo) => {
          this.guardando.set(false);
          this.snackBar.open(`✓ Expediente archivado en custodia: ${nuevo.codigo_custodia || nuevo.nro_expediente}`, 'Cerrar', { duration: 4000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.guardando.set(false);
          this.snackBar.open(`❌ Error al registrar en custodia: ${err.message || 'Error en servidor'}`, 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
