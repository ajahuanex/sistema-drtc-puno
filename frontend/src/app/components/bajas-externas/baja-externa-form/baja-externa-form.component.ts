import { Component, inject, OnInit, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BajaExternaService } from '../../../services/baja-externa.service';

@Component({
  selector: 'app-baja-externa-form',
  standalone: true,
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }
  ],
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="baja-dialog-root">
      
      <!-- HEADER -->
      <div class="dialog-header">
        <div class="header-info">
          <div class="header-icon-box" [class.icon-local]="form.value.tipo_baja === 'LOCAL'">
            <mat-icon>{{ form.value.tipo_baja === 'EXTERNA' ? 'public' : 'location_city' }}</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title">Registrar Baja Vehicular</h2>
            <p class="dialog-subtitle">
              {{ form.value.tipo_baja === 'EXTERNA' ? 'Notificación externa (MTC / Otra Región)' : 'Baja regional (DRTC Puno / Notificación local)' }}
            </p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="btn-close" matTooltip="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-form">
        <mat-dialog-content class="dialog-content">

          <!-- Selector de Tipo de Baja (Externa vs Local) -->
          <div class="scope-toggle-card">
            <label class="section-label">
              Ámbito de la Baja / Notificación:
            </label>
            <mat-button-toggle-group formControlName="tipo_baja" (change)="onTipoBajaChange()" class="toggle-group-full">
              <mat-button-toggle value="EXTERNA" class="toggle-btn">
                <span class="toggle-label-content">
                  <mat-icon class="icon-indigo">public</mat-icon>
                  <span>Baja Externa (MTC / Otra Región)</span>
                </span>
              </mat-button-toggle>
              <mat-button-toggle value="LOCAL" class="toggle-btn">
                <span class="toggle-label-content">
                  <mat-icon class="icon-amber">location_city</mat-icon>
                  <span>Baja Local (Región Puno)</span>
                </span>
              </mat-button-toggle>
            </mat-button-toggle-group>
          </div>
          
          <!-- Fila: Placa (Único Obligatorio) y Búsqueda -->
          <div class="form-grid-2">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Placa del Vehículo</mat-label>
              <input matInput formControlName="placa" placeholder="Ej: V1A-950" (blur)="autoCompletarPorPlaca()" (keyup.enter)="autoCompletarPorPlaca()" style="text-transform: uppercase; font-family: monospace; font-weight: bold;">
              <button mat-icon-button matSuffix type="button" (click)="autoCompletarPorPlaca()" [disabled]="buscandoVehiculo" matTooltip="Buscar datos de la placa en BD local">
                <mat-icon *ngIf="!buscandoVehiculo">search</mat-icon>
                <mat-spinner *ngIf="buscandoVehiculo" diameter="18"></mat-spinner>
              </button>
              <mat-hint>Obligatorio. Presione Enter o la lupa para autocompletar</mat-hint>
              <mat-error *ngIf="form.get('placa')?.hasError('required')">La placa es obligatoria</mat-error>
              <mat-error *ngIf="form.get('placa')?.hasError('pattern')">Formato inválido (6-8 caracteres)</mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>RUC Empresa (Opcional)</mat-label>
              <input matInput formControlName="ruc_empresa" maxlength="11" placeholder="Ej: 20123456789">
              <mat-hint>11 dígitos (opcional)</mat-hint>
              <mat-error *ngIf="form.get('ruc_empresa')?.hasError('pattern')">Debe contener 11 dígitos numéricos</mat-error>
            </mat-form-field>
          </div>

          <!-- Razón Social y Entidad Destino -->
          <div class="form-grid-2">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Razón Social (Opcional)</mat-label>
              <input matInput formControlName="razon_social" placeholder="Ej: Empresa de Transportes San Román">
              <mat-hint>Empresa titular del vehículo</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Entidad a Notificar (Opcional)</mat-label>
              <input matInput formControlName="entidad_destino" placeholder="Ej: MTC Lima, SUTRAN, Empresa">
              <mat-hint>Destinatario del trámite o notificación</mat-hint>
            </mat-form-field>
          </div>

          <!-- Motivo de la baja y N° Oficio -->
          <div class="form-grid-2">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Motivo de la Baja (Opcional)</mat-label>
              <mat-select formControlName="motivo">
                @if (form.value.tipo_baja === 'EXTERNA') {
                  <mat-option value="Habilitado en MTC Lima">Habilitado en MTC Lima</mat-option>
                  <mat-option value="Habilitado en otra Empresa (Interprovincial)">Habilitado en otra Empresa (Interprovincial)</mat-option>
                  <mat-option value="Duplicidad en Registro MTC">Duplicidad en Registro MTC</mat-option>
                  <mat-option value="Retiro Voluntario Externo">Retiro Voluntario Externo</mat-option>
                  <mat-option value="Otros">Otros</mat-option>
                } @else {
                  <mat-option value="Retiro Voluntario / Renuncia de socio">Retiro Voluntario / Renuncia de socio</mat-option>
                  <mat-option value="Cumplimiento de edad límite / Antigüedad">Cumplimiento de edad límite / Antigüedad</mat-option>
                  <mat-option value="Sustitución vehicular regional">Sustitución vehicular regional</mat-option>
                  <mat-option value="Baja de oficio por DRTC Puno">Baja de oficio por DRTC Puno</mat-option>
                  <mat-option value="Sanción / Cancelación administrativa">Sanción / Cancelación administrativa</mat-option>
                  <mat-option value="Otros">Otros</mat-option>
                }
              </mat-select>
              <mat-hint>Seleccione o elija "Otros"</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>N° Oficio / Exp. Notificación (Opcional)</mat-label>
              <input matInput formControlName="numero_oficio" placeholder="Ej: Oficio N° 045-2025-GR-PUNO">
              <mat-hint>N° de documento para notificar</mat-hint>
            </mat-form-field>
          </div>

          <!-- Observaciones -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Observaciones o Detalle (Opcional)</mat-label>
            <textarea matInput formControlName="observaciones" rows="2" placeholder="Detalles adicionales sobre la baja o notificación..."></textarea>
          </mat-form-field>

          <!-- Zona de Carga de Evidencia: Arrastrar, Pegar (Ctrl+V) o Seleccionar -->
          <div class="evidence-container">
            <div class="evidence-header">
              <label class="evidence-label">
                <mat-icon class="label-icon">attach_file</mat-icon>
                Evidencia / Captura (Opcional)
              </label>
              <span class="paste-hint-pill">
                💡 Puedes presionar <strong>Ctrl+V</strong> para pegar captura
              </span>
            </div>

            <div 
              class="dropzone-box"
              [class.drag-over]="isDragging()"
              [class.has-file]="!!selectedFile"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
            >
              <input type="file" #fileInput (change)="onFileSelected($event)" accept=".pdf,image/*" style="display: none;">
              
              @if (!selectedFile) {
                <div class="dropzone-empty" (click)="fileInput.click()">
                  <div class="upload-icon-circle">
                    <mat-icon>cloud_upload</mat-icon>
                  </div>
                  <p class="dropzone-main-text">
                    Arrastra aquí tu archivo o haz clic para seleccionarlo
                  </p>
                  <p class="dropzone-sub-text">
                    Soporta imágenes (PNG, JPG) o PDF (máx. 10MB)
                  </p>
                  <div class="paste-shortcut-badge">
                    <mat-icon>content_paste</mat-icon>
                    <span>O pega directamente con <strong>Ctrl + V</strong> cualquier captura</span>
                  </div>
                </div>
              } @else {
                <div class="file-loaded-box">
                  <div class="file-info-row">
                    <div class="file-meta-group">
                      @if (isImageFile(selectedFile)) {
                        <div class="file-icon-thumb">
                          <img *ngIf="imagePreview()" [src]="imagePreview()" alt="Preview" class="thumb-img">
                          <mat-icon *ngIf="!imagePreview()" class="icon-indigo">image</mat-icon>
                        </div>
                      } @else {
                        <div class="file-icon-pdf">
                          <mat-icon>picture_as_pdf</mat-icon>
                        </div>
                      }
                      <div class="file-texts">
                        <p class="file-name">{{ selectedFile.name }}</p>
                        <p class="file-size">{{ formatFileSize(selectedFile.size) }} • {{ isImageFile(selectedFile) ? 'Imagen' : 'Documento PDF' }}</p>
                      </div>
                    </div>
                    <button mat-icon-button color="warn" type="button" (click)="removeFile(); fileInput.value=''" matTooltip="Quitar archivo">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>

                  @if (imagePreview()) {
                    <div class="preview-img-container">
                      <img [src]="imagePreview()" alt="Vista previa" class="preview-full-img">
                    </div>
                  }
                </div>
              }
            </div>
          </div>

        </mat-dialog-content>
        
        <!-- ACCIONES -->
        <mat-dialog-actions align="end" class="dialog-actions">
          <button mat-button type="button" mat-dialog-close [disabled]="submitting">Cancelar</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || submitting" class="btn-submit">
            <mat-icon *ngIf="submitting" class="spin-icon">sync</mat-icon>
            <mat-icon *ngIf="!submitting">save</mat-icon>
            <span>Guardar Registro</span>
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .baja-dialog-root {
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      font-family: inherit;
    }

    /* HEADER */
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: #ffffff;
    }
    .header-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .header-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #eef2ff;
      color: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-icon-box mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .header-icon-box.icon-local {
      background: #fef3c7;
      color: #d97706;
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
    .dialog-subtitle {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0.2rem 0 0 0;
    }
    .btn-close {
      color: #94a3b8;
    }
    .btn-close:hover {
      color: #475569;
    }

    /* FORM & CONTENT */
    .dialog-form {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .dialog-content {
      padding: 1.25rem 1.5rem !important;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 75vh;
      overflow-y: auto;
    }

    /* TOGGLE CARD */
    .scope-toggle-card {
      background: #f8fafc;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .section-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 0.5rem;
    }
    .toggle-group-full {
      width: 100%;
      display: flex;
      border-radius: 8px;
    }
    .toggle-btn {
      flex: 1;
      font-weight: 600;
    }
    .toggle-label-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 4px 0;
      font-size: 0.82rem;
    }
    .icon-indigo { color: #4f46e5; }
    .icon-amber { color: #d97706; }

    /* FORM GRID */
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 640px) {
      .form-grid-2 {
        grid-template-columns: 1fr;
      }
    }
    .w-full {
      width: 100%;
    }

    /* EVIDENCE / DROPZONE */
    .evidence-container {
      margin-top: 0.25rem;
    }
    .evidence-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4rem;
    }
    .evidence-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .label-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #4f46e5;
    }
    .paste-hint-pill {
      font-size: 0.72rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
    }

    .dropzone-box {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
      background: #f8fafc;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .dropzone-box:hover {
      border-color: #818cf8;
      background: #f5f7ff;
    }
    .dropzone-box.drag-over {
      border-color: #4f46e5;
      background: #eef2ff;
      transform: scale(1.01);
    }
    .dropzone-box.has-file {
      border-color: #10b981;
      background: #f0fdf4;
      cursor: default;
    }

    .dropzone-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 0;
    }
    .upload-icon-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #e0e7ff;
      color: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }
    .upload-icon-circle mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
    }
    .dropzone-main-text {
      font-size: 0.85rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .dropzone-sub-text {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.25rem 0 0 0;
    }
    .paste-shortcut-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-top: 0.75rem;
      padding: 4px 10px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.75rem;
      color: #4f46e5;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .paste-shortcut-badge mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    /* LOADED FILE */
    .file-loaded-box {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .file-info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .file-meta-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      overflow: hidden;
    }
    .file-icon-thumb {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .file-icon-pdf {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #fee2e2;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .file-texts {
      text-align: left;
      overflow: hidden;
    }
    .file-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 280px;
    }
    .file-size {
      font-size: 0.72rem;
      color: #64748b;
      margin: 0;
    }
    .preview-img-container {
      max-height: 200px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      background: #0f172a08;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .preview-full-img {
      max-height: 200px;
      object-fit: contain;
    }

    /* ACTIONS */
    .dialog-actions {
      padding: 0.85rem 1.5rem !important;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-submit {
      height: 40px;
      border-radius: 8px !important;
      font-weight: 600 !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class BajaExternaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bajaService = inject(BajaExternaService);
  private dialogRef = inject(MatDialogRef<BajaExternaFormComponent>);
  private snackBar = inject(MatSnackBar);
  public data = inject(MAT_DIALOG_DATA, { optional: true });

  submitting = false;
  buscandoVehiculo = false;
  selectedFile: File | null = null;
  imagePreview = signal<string | null>(null);
  isDragging = signal<boolean>(false);

  // Formulario: Solo 'placa' es requerida; los demás campos son opcionales
  form = this.fb.group({
    tipo_baja: ['EXTERNA', Validators.required],
    placa: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]{6,8}$/i)]],
    ruc_empresa: ['', [Validators.pattern(/^\d{11}$/)]],
    razon_social: [''],
    motivo: [''],
    entidad_destino: [''],
    numero_oficio: [''],
    observaciones: ['']
  });

  ngOnInit() {
    if (this.data) {
      if (this.data.tipo_baja) this.form.patchValue({ tipo_baja: this.data.tipo_baja });
      if (this.data.placa) this.form.patchValue({ placa: this.data.placa });
      if (this.data.ruc_empresa) this.form.patchValue({ ruc_empresa: this.data.ruc_empresa });
      if (this.data.razon_social) this.form.patchValue({ razon_social: this.data.razon_social });
      if (this.data.motivo) this.form.patchValue({ motivo: this.data.motivo });
      if (this.data.entidad_destino) this.form.patchValue({ entidad_destino: this.data.entidad_destino });
      if (this.data.numero_oficio) this.form.patchValue({ numero_oficio: this.data.numero_oficio });
      if (this.data.observaciones) this.form.patchValue({ observaciones: this.data.observaciones });
    }
    this.setDefaultMotivo();
  }

  onTipoBajaChange() {
    this.setDefaultMotivo();
  }

  private setDefaultMotivo() {
    const tipo = this.form.value.tipo_baja;
    const currentMotivo = this.form.value.motivo;
    if (!currentMotivo) {
      if (tipo === 'EXTERNA') {
        this.form.patchValue({ 
          motivo: 'Habilitado en MTC Lima',
          entidad_destino: this.form.value.entidad_destino || 'MTC - Dirección General de Autorizaciones'
        });
      } else {
        this.form.patchValue({ 
          motivo: 'Retiro Voluntario / Renuncia de socio',
          entidad_destino: this.form.value.entidad_destino || 'DRTC Puno / Notificación a Empresa'
        });
      }
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          event.preventDefault();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const namedFile = new File([file], `evidencia_pegada_${timestamp}.png`, { type: file.type });
          this.setFile(namedFile);
          this.snackBar.open('¡Captura pegada correctamente desde el portapapeles!', 'OK', { duration: 3000 });
          break;
        }
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.setFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.setFile(file);
    }
  }

  private setFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo no debe superar los 10MB', 'Cerrar', { duration: 3500 });
      return;
    }

    this.selectedFile = file;

    if (this.isImageFile(file)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      this.imagePreview.set(null);
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.imagePreview.set(null);
  }

  isImageFile(file: File | null): boolean {
    return !!file && file.type.startsWith('image/');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  autoCompletarPorPlaca() {
    const placa = this.form.value.placa?.trim();
    if (!placa || placa.length < 6) return;

    this.buscandoVehiculo = true;
    this.bajaService.buscarVehiculo(placa).subscribe({
      next: (resp) => {
        this.buscandoVehiculo = false;
        if (resp && resp.encontrado) {
          if (!this.form.value.ruc_empresa && resp.ruc_empresa) {
            this.form.patchValue({ ruc_empresa: resp.ruc_empresa });
          }
          if (!this.form.value.razon_social && resp.razon_social) {
            this.form.patchValue({ razon_social: resp.razon_social });
          }
          this.snackBar.open(`Vehículo encontrado: ${resp.razon_social || resp.ruc_empresa}`, 'OK', { duration: 2500 });
        }
      },
      error: () => {
        this.buscandoVehiculo = false;
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.submitting = true;
    const formData = new FormData();
    formData.append('placa', (this.form.value.placa || '').toUpperCase().trim());
    formData.append('tipo_baja', this.form.value.tipo_baja || 'EXTERNA');

    if (this.form.value.ruc_empresa) {
      formData.append('ruc_empresa', this.form.value.ruc_empresa.trim());
    }
    if (this.form.value.razon_social) {
      formData.append('razon_social', this.form.value.razon_social.trim());
    }
    if (this.form.value.motivo) {
      formData.append('motivo', this.form.value.motivo);
    }
    if (this.form.value.entidad_destino) {
      formData.append('entidad_destino', this.form.value.entidad_destino.trim());
    }
    if (this.form.value.numero_oficio) {
      formData.append('numero_oficio', this.form.value.numero_oficio.trim());
    }
    if (this.form.value.observaciones) {
      formData.append('observaciones', this.form.value.observaciones.trim());
    }
    if (this.selectedFile) {
      formData.append('archivo', this.selectedFile);
    }

    this.bajaService.registrarBaja(formData).subscribe({
      next: (nuevaBaja) => {
        const msg = nuevaBaja.tipo_baja === 'LOCAL' 
          ? 'Baja local regional registrada correctamente' 
          : 'Baja externa registrada correctamente';
        this.snackBar.open(msg, 'Cerrar', { duration: 3500 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error registrando baja', err);
        const errorDetail = err.error?.detail || 'Error al guardar el registro de baja';
        this.snackBar.open(errorDetail, 'Cerrar', { duration: 4000 });
        this.submitting = false;
      }
    });
  }
}
