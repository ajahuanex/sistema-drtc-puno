import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { DocumentoService } from '../../services/mesa-partes/documento.service';
import { 
  Documento, 
  DocumentoCreate, 
  TipoDocumento, 
  PrioridadDocumento 
} from '../../models/mesa-partes/documento.model';

interface ArchivoPreview {
  file: File;
  nombre: string;
  tamano: number;
  tipo: string;
  preview?: string;
  progreso: number;
}

@Component({
  selector: 'app-registro-documento',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="registro-documento-container">
      <!-- Mensaje de Éxito -->
      <mat-card class="success-card" *ngIf="mostrarExito && documentoGuardado">
        <mat-card-content>
          <div class="success-content">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h2>¡Documento Registrado Exitosamente!</h2>
            <p class="expediente-number">
              Número de Expediente: <strong>{{ documentoGuardado.numeroExpediente }}</strong>
            </p>
            
            <!-- Código QR -->
            <div class="qr-section" *ngIf="documentoGuardado.codigoQR">
              <p class="qr-label">Código QR para seguimiento:</p>
              <div class="qr-code">
                <img [src]="documentoGuardado.codigoQR" alt="Código QR">
              </div>
              <button 
                mat-stroked-button 
                color="primary"
                (click)="descargarComprobante()">
                <mat-icon>download</mat-icon>
                Descargar Comprobante
              </button>
            </div>

            <!-- Opciones Post-Registro -->
            <div class="post-registro-actions">
              <button 
                mat-raised-button 
                color="primary"
                (click)="registrarNuevo()">
                <mat-icon>add_circle</mat-icon>
                Registrar Nuevo Documento
              </button>
              
              <button 
                mat-raised-button
                (click)="verDocumento()">
                <mat-icon>visibility</mat-icon>
                Ver Documento
              </button>
              
              <button 
                mat-stroked-button
                (click)="derivarDocumento()">
                <mat-icon>send</mat-icon>
                Derivar Documento
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Formulario de Registro -->
      <mat-card class="form-card" *ngIf="!mostrarExito">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>add_circle</mat-icon>
            Registro de Documento
          </mat-card-title>
          <mat-card-subtitle>Complete los datos del documento entrante</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="documentoForm" (ngSubmit)="onSubmit()">
            <!-- Tipo de Documento -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tipo de Documento</mat-label>
                <mat-select formControlName="tipoDocumentoId" required>
                  <mat-option *ngFor="let tipo of tiposDocumento" [value]="tipo.id">
                    {{ tipo.nombre }} ({{ tipo.codigo }})
                  </mat-option>
                </mat-select>
                <mat-icon matPrefix>description</mat-icon>
                <mat-error *ngIf="documentoForm.get('tipoDocumentoId')?.hasError('required')">
                  El tipo de documento es obligatorio
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Número de Documento Externo -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Número de Documento Externo</mat-label>
                <input 
                  matInput 
                  formControlName="numeroDocumentoExterno"
                  placeholder="Ej: OF-2025-001">
                <mat-icon matPrefix>tag</mat-icon>
                <mat-hint>Número del documento original (opcional)</mat-hint>
              </mat-form-field>
            </div>

            <!-- Remitente con Autocompletado -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Remitente</mat-label>
                <input 
                  matInput 
                  formControlName="remitente"
                  [matAutocomplete]="autoRemitente"
                  placeholder="Nombre del remitente"
                  required>
                <mat-icon matPrefix>person</mat-icon>
                <mat-autocomplete #autoRemitente="matAutocomplete">
                  <mat-option *ngFor="let remitente of remitentesFiltrados$ | async" [value]="remitente">
                    {{ remitente }}
                  </mat-option>
                </mat-autocomplete>
                <mat-error *ngIf="documentoForm.get('remitente')?.hasError('required')">
                  El remitente es obligatorio
                </mat-error>
                <mat-error *ngIf="documentoForm.get('remitente')?.hasError('minlength')">
                  El remitente debe tener al menos 3 caracteres
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Asunto -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Asunto</mat-label>
                <textarea 
                  matInput 
                  formControlName="asunto"
                  rows="3"
                  placeholder="Descripción del asunto del documento"
                  required></textarea>
                <mat-icon matPrefix>subject</mat-icon>
                <mat-error *ngIf="documentoForm.get('asunto')?.hasError('required')">
                  El asunto es obligatorio
                </mat-error>
                <mat-error *ngIf="documentoForm.get('asunto')?.hasError('minlength')">
                  El asunto debe tener al menos 10 caracteres
                </mat-error>
                <mat-hint align="end">
                  {{ documentoForm.get('asunto')?.value?.length || 0 }} caracteres
                </mat-hint>
              </mat-form-field>
            </div>

            <!-- Número de Folios y Anexos -->
            <div class="form-row two-columns">
              <mat-form-field appearance="outline">
                <mat-label>Número de Folios</mat-label>
                <input 
                  matInput 
                  type="number"
                  formControlName="numeroFolios"
                  min="0"
                  placeholder="0"
                  required>
                <mat-icon matPrefix>pages</mat-icon>
                <mat-error *ngIf="documentoForm.get('numeroFolios')?.hasError('required')">
                  El número de folios es obligatorio
                </mat-error>
                <mat-error *ngIf="documentoForm.get('numeroFolios')?.hasError('min')">
                  El número debe ser mayor o igual a 0
                </mat-error>
              </mat-form-field>

              <div class="checkbox-field">
                <mat-checkbox formControlName="tieneAnexos">
                  <mat-icon>attach_file</mat-icon>
                  Tiene Anexos
                </mat-checkbox>
              </div>
            </div>

            <!-- Prioridad -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Prioridad</mat-label>
                <mat-select formControlName="prioridad" required>
                  <mat-option [value]="'NORMAL'">
                    <div class="priority-option">
                      <mat-icon class="priority-icon normal">flag</mat-icon>
                      <span>Normal</span>
                    </div>
                  </mat-option>
                  <mat-option [value]="'ALTA'">
                    <div class="priority-option">
                      <mat-icon class="priority-icon alta">flag</mat-icon>
                      <span>Alta</span>
                    </div>
                  </mat-option>
                  <mat-option [value]="'URGENTE'">
                    <div class="priority-option">
                      <mat-icon class="priority-icon urgente">flag</mat-icon>
                      <span>Urgente</span>
                    </div>
                  </mat-option>
                </mat-select>
                <mat-icon matPrefix>priority_high</mat-icon>
                <mat-hint>Seleccione la prioridad del documento</mat-hint>
              </mat-form-field>
            </div>

            <!-- Fecha Límite -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Fecha Límite de Atención</mat-label>
                <input 
                  matInput 
                  [matDatepicker]="picker"
                  formControlName="fechaLimite"
                  placeholder="Seleccione una fecha">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-icon matPrefix>event</mat-icon>
                <mat-hint>Fecha límite para atender el documento (opcional)</mat-hint>
              </mat-form-field>
            </div>

            <!-- Expediente Relacionado -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Expediente Relacionado</mat-label>
                <input 
                  matInput 
                  formControlName="expedienteRelacionadoId"
                  placeholder="Ej: EXP-2025-0001"
                  [matAutocomplete]="autoExpediente">
                <mat-icon matPrefix>folder_open</mat-icon>
                <mat-autocomplete #autoExpediente="matAutocomplete">
                  <mat-option *ngFor="let exp of expedientesFiltrados$ | async" [value]="exp">
                    {{ exp }}
                  </mat-option>
                </mat-autocomplete>
                <mat-hint>Asociar a un expediente existente (opcional)</mat-hint>
              </mat-form-field>
            </div>

            <!-- Upload de Archivos -->
            <div class="form-row">
              <div class="upload-section">
                <div class="upload-header">
                  <mat-icon>cloud_upload</mat-icon>
                  <span>Archivos Adjuntos</span>
                </div>

                <!-- Drag & Drop Zone -->
                <div 
                  class="dropzone"
                  [class.dragover]="isDragging"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event)"
                  (click)="fileInput.click()">
                  <mat-icon class="upload-icon">cloud_upload</mat-icon>
                  <p class="upload-text">
                    Arrastra archivos aquí o <span class="link-text">haz clic para seleccionar</span>
                  </p>
                  <p class="upload-hint">
                    Formatos permitidos: PDF, Word, Excel, Imágenes (máx. 10MB por archivo)
                  </p>
                  <input 
                    #fileInput
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    (change)="onFileSelected($event)"
                    style="display: none;">
                </div>

                <!-- Lista de Archivos -->
                <div class="files-list" *ngIf="archivosAdjuntos.length > 0">
                  <div class="files-header">
                    <span>{{ (archivosAdjuntos)?.length || 0 }} archivo(s) seleccionado(s)</span>
                    <button 
                      mat-button 
                      color="warn"
                      type="button"
                      (click)="eliminarTodosArchivos()">
                      <mat-icon>delete_sweep</mat-icon>
                      Eliminar todos
                    </button>
                  </div>

                  <div class="file-item" *ngFor="let archivo of archivosAdjuntos; let i = index">
                    <div class="file-info">
                      <!-- Preview de imagen -->
                      <div class="file-preview" *ngIf="archivo.preview">
                        <img [src]="archivo.preview" [alt]="archivo.nombre">
                      </div>
                      
                      <!-- Icono por tipo -->
                      <div class="file-icon" *ngIf="!archivo.preview">
                        <mat-icon>{{ getFileIcon(archivo.tipo) }}</mat-icon>
                      </div>

                      <div class="file-details">
                        <div class="file-name" [matTooltip]="archivo.nombre">
                          {{ archivo.nombre }}
                        </div>
                        <div class="file-size">
                          {{ formatFileSize(archivo.tamano) }}
                        </div>
                      </div>
                    </div>

                    <!-- Barra de progreso -->
                    <mat-progress-bar 
                      *ngIf="archivo.progreso < 100"
                      mode="determinate"
                      [value]="archivo.progreso"
                      class="file-progress">
                    </mat-progress-bar>

                    <!-- Botón eliminar -->
                    <button 
                      mat-icon-button 
                      color="warn"
                      type="button"
                      [matTooltip]="'Eliminar archivo'"
                      (click)="eliminarArchivo(i)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de Acción -->
            <div class="form-actions">
              <button 
                mat-raised-button 
                type="button"
                (click)="onCancel()">
                <mat-icon>cancel</mat-icon>
                Cancelar
              </button>
              
              <button 
                mat-raised-button 
                color="primary"
                type="submit"
                [disabled]="documentoForm.invalid || guardando">
                <mat-spinner 
                  *ngIf="guardando" 
                  diameter="20" 
                  class="button-spinner"></mat-spinner>
                <mat-icon *ngIf="!guardando">save</mat-icon>
                {{ guardando ? 'Guardando...' : 'Guardar Documento' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .registro-documento-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }

    .form-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    /* Success Card Styles */
    .success-card {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
      border: 2px solid #667eea;
      margin-bottom: 24px;
    }

    .success-content {
      text-align: center;
      padding: 32px 24px;
    }

    .success-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #10b981;
      margin-bottom: 16px;
    }

    .success-content h2 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-size: 24px;
      font-weight: 600;
    }

    .expediente-number {
      font-size: 18px;
      color: #6c757d;
      margin-bottom: 24px;
    }

    .expediente-number strong {
      color: #667eea;
      font-size: 20px;
    }

    .qr-section {
      margin: 24px 0;
      padding: 24px;
      background: #f7f9fc;
      border-radius: 8px;
    }

    .qr-label {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .qr-code {
      display: inline-block;
      padding: 16px;
      background: white;
      border-radius: 8px;
      margin-bottom: 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .qr-code img {
      display: block;
      width: 200px;
      height: 200px;
    }

    .post-registro-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 24px;
    }

    .post-registro-actions button {
      min-width: 180px;
    }

    /* Priority Option Styles */
    .priority-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .priority-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .priority-icon.normal {
      color: #6c757d;
    }

    .priority-icon.alta {
      color: #f59e0b;
    }

    .priority-icon.urgente {
      color: #ef4444;
    }

    mat-card-header {
      margin-bottom: 24px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
    }

    mat-card-title mat-icon {
      color: #667eea;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    mat-card-subtitle {
      margin-top: 8px;
      color: #6c757d;
    }

    .form-row {
      margin-bottom: 20px;
    }

    .form-row.two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: start;
    }

    .full-width {
      width: 100%;
    }

    .checkbox-field {
      display: flex;
      align-items: center;
      height: 56px;
      padding: 0 12px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 4px;
      background: #fafafa;
    }

    .checkbox-field mat-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .checkbox-field mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #667eea;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e1e4e8;
    }

    .form-actions button {
      min-width: 140px;
    }

    .button-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    mat-form-field {
      font-size: 14px;
    }

    mat-icon[matPrefix] {
      margin-right: 8px;
      color: #667eea;
    }

    /* Upload Section Styles */
    .upload-section {
      border: 1px solid #e1e4e8;
      border-radius: 8px;
      padding: 20px;
      background: #fafbfc;
    }

    .upload-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-weight: 600;
      color: #2c3e50;
    }

    .upload-header mat-icon {
      color: #667eea;
    }

    .dropzone {
      border: 2px dashed #cbd5e0;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: white;
    }

    .dropzone:hover {
      border-color: #667eea;
      background: #f7f9fc;
    }

    .dropzone.dragover {
      border-color: #667eea;
      background: #eef2ff;
      border-style: solid;
    }

    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #cbd5e0;
      margin-bottom: 12px;
    }

    .upload-text {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 14px;
    }

    .link-text {
      color: #667eea;
      font-weight: 500;
    }

    .upload-hint {
      margin: 0;
      color: #6c757d;
      font-size: 12px;
    }

    .files-list {
      margin-top: 20px;
    }

    .files-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e1e4e8;
    }

    .files-header span {
      font-weight: 500;
      color: #2c3e50;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      margin-bottom: 8px;
      transition: all 0.2s ease;
    }

    .file-item:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .file-preview {
      width: 48px;
      height: 48px;
      border-radius: 4px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .file-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .file-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f7f9fc;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .file-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #667eea;
    }

    .file-details {
      flex: 1;
      min-width: 0;
    }

    .file-name {
      font-weight: 500;
      color: #2c3e50;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 14px;
    }

    .file-size {
      color: #6c757d;
      font-size: 12px;
      margin-top: 2px;
    }

    .file-progress {
      width: 100px;
      flex-shrink: 0;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .registro-documento-container {
        padding: 16px;
      }

      .form-row.two-columns {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
      }

      .post-registro-actions {
        flex-direction: column;
      }

      .post-registro-actions button {
        width: 100%;
      }

      .qr-code img {
        width: 150px;
        height: 150px;
      }
    }

    @media (max-width: 480px) {
      .registro-documento-container {
        padding: 12px;
      }

      mat-card-title {
        font-size: 20px;
      }

      .success-content {
        padding: 24px 16px;
      }

      .success-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
      }

      .success-content h2 {
        font-size: 20px;
      }

      .expediente-number {
        font-size: 16px;
      }

      .expediente-number strong {
        font-size: 18px;
      }
    }
  `]
})
export class RegistroDocumentoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private documentoService = inject(DocumentoService);

  @Output() documentoCreado = new EventEmitter<Documento>();

  documentoForm!: FormGroup;
  guardando = false;
  
  // Datos para selects
  tiposDocumento: TipoDocumento[] = [];
  
  // Autocompletado de remitentes
  remitentesFiltrados$!: Observable<string[]>;
  private remitentesHistorico: string[] = [];

  // Upload de archivos
  archivosAdjuntos: ArchivoPreview[] = [];
  isDragging = false;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  // Expedientes relacionados
  expedientesFiltrados$!: Observable<string[]>;
  private expedientesHistorico: string[] = [];

  // Documento creado
  documentoGuardado: Documento | null = null;
  mostrarExito = false;

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarTiposDocumento();
    this.configurarAutocompletadoRemitente();
    this.configurarAutocompletadoExpediente();
  }

  /**
   * Inicializar formulario reactivo con validaciones
   * Requirements: 1.1, 1.2, 1.5, 1.7
   */
  private inicializarFormulario(): void {
    this.documentoForm = this.fb.group({
      tipoDocumentoId: ['', Validators.required],
      numeroDocumentoExterno: [''],
      remitente: ['', [Validators.required, Validators.minLength(3)]],
      asunto: ['', [Validators.required, Validators.minLength(10)]],
      numeroFolios: [0, [Validators.required, Validators.min(0)]],
      tieneAnexos: [false],
      prioridad: [PrioridadDocumento.NORMAL, Validators.required],
      fechaLimite: [null],
      expedienteRelacionadoId: ['']
    });
  }

  /**
   * Cargar tipos de documento disponibles
   * Requirements: 1.1, 2.1
   */
  private cargarTiposDocumento(): void {
    // Cargar tipos de documento desde el servicio real
    this.documentoService.obtenerTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento = tipos;
      },
      error: (error) => {
        console.error('Error cargando tipos de documento::', error);
        this.tiposDocumento = [];
      }
    });
  }

  /**
   * Configurar autocompletado de remitente
   * Requirements: 1.1
   */
  private configurarAutocompletadoRemitente(): void {
    // Cargar remitentes históricos desde el servicio real
    this.documentoService.obtenerRemitentesHistoricos().subscribe({
      next: (remitentes) => {
        this.remitentesHistorico = remitentes;
      },
      error: (error) => {
        console.error('Error cargando remitentes históricos::', error);
        this.remitentesHistorico = [];
      }
    });

    this.remitentesFiltrados$ = this.documentoForm.get('remitente')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => this.filtrarRemitentes(value || ''))
    );
  }

  /**
   * Filtrar remitentes para autocompletado
   */
  private filtrarRemitentes(valor: string): string[] {
    const filtro = valor.toLowerCase();
    return this.remitentesHistorico.filter(remitente =>
      remitente.toLowerCase().includes(filtro)
    );
  }

  /**
   * Configurar autocompletado de expediente relacionado
   * Requirements: 1.4
   */
  private configurarAutocompletadoExpediente(): void {
    // Cargar expedientes históricos desde el servicio real
    this.documentoService.obtenerExpedientesHistoricos().subscribe({
      next: (expedientes) => {
        this.expedientesHistorico = expedientes;
      },
      error: (error) => {
        console.error('Error cargando expedientes históricos::', error);
        this.expedientesHistorico = [];
      }
    });

    this.expedientesFiltrados$ = this.documentoForm.get('expedienteRelacionadoId')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => this.filtrarExpedientes(value || ''))
    );
  }

  /**
   * Filtrar expedientes para autocompletado
   */
  private filtrarExpedientes(valor: string): string[] {
    const filtro = valor.toLowerCase();
    return this.expedientesHistorico.filter(exp =>
      exp.toLowerCase().includes(filtro)
    );
  }

  /**
   * Enviar formulario
   * Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7
   */
  onSubmit(): void {
    if (this.documentoForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    this.guardando = true;

    const documentoData: DocumentoCreate = this.documentoForm.value;

    this.documentoService.crearDocumento(documentoData).subscribe({
      next: (documento) => {
        // console.log removed for production
        
        // Guardar documento creado y mostrar mensaje de éxito
        this.documentoGuardado = documento;
        this.mostrarExito = true;
        
        // Subir archivos adjuntos si existen
        if (this.archivosAdjuntos.length > 0) {
          this.subirArchivosAdjuntos(documento.id);
        }
        
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al crear documento::', error);
        alert('Error al crear el documento. Por favor, intente nuevamente.');
        this.guardando = false;
      }
    });
  }

  /**
   * Subir archivos adjuntos al documento
   * Requirements: 1.3
   */
  private subirArchivosAdjuntos(documentoId: string): void {
    this.archivosAdjuntos.forEach(archivo => {
      this.documentoService.adjuntarArchivo(documentoId, archivo.file).subscribe({
        next: (archivoAdjunto) => {
          // console.log removed for production
        },
        error: (error) => {
          console.error('Error al adjuntar archivo::', error);
        }
      });
    });
  }

  /**
   * Cancelar y limpiar formulario
   */
  onCancel(): void {
    this.resetearFormulario();
  }

  /**
   * Resetear formulario a estado inicial
   */
  private resetearFormulario(): void {
    this.documentoForm.reset({
      tipoDocumentoId: '',
      numeroDocumentoExterno: '',
      remitente: '',
      asunto: '',
      numeroFolios: 0,
      tieneAnexos: false,
      prioridad: PrioridadDocumento.NORMAL,
      fechaLimite: null,
      expedienteRelacionadoId: ''
    });
    this.archivosAdjuntos = [];
  }

  /**
   * Registrar nuevo documento
   * Requirements: 1.6
   */
  registrarNuevo(): void {
    this.mostrarExito = false;
    this.documentoGuardado = null;
    this.resetearFormulario();
  }

  /**
   * Ver documento creado
   * Requirements: 1.6
   */
  verDocumento(): void {
    if (this.documentoGuardado) {
      // console.log removed for production
      // TODO: Navegar a vista de detalle del documento
      alert('Funcionalidad de ver documento pendiente de implementar');
    }
  }

  /**
   * Derivar documento creado
   * Requirements: 1.6
   */
  derivarDocumento(): void {
    if (this.documentoGuardado) {
      // console.log removed for production
      // TODO: Abrir modal de derivación
      alert('Funcionalidad de derivación pendiente de implementar');
    }
  }

  /**
   * Descargar comprobante con QR
   * Requirements: 1.6
   */
  descargarComprobante(): void {
    if (this.documentoGuardado) {
      this.documentoService.generarComprobante(this.documentoGuardado.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `comprobante-${this.documentoGuardado!.numeroExpediente}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error al descargar comprobante::', error);
          alert('Error al descargar el comprobante');
        }
      });
    }
  }

  /**
   * Marcar todos los campos como tocados para mostrar errores
   */
  private marcarCamposComoTocados(): void {
    Object.keys(this.documentoForm.controls).forEach(key => {
      this.documentoForm.get(key)?.markAsTouched();
    });
  }

  // ========== Métodos de Upload de Archivos ==========

  /**
   * Manejar evento dragover
   * Requirements: 1.3
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  /**
   * Manejar evento dragleave
   * Requirements: 1.3
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  /**
   * Manejar evento drop
   * Requirements: 1.3
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.procesarArchivos(Array.from(files));
    }
  }

  /**
   * Manejar selección de archivos desde input
   * Requirements: 1.3
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.procesarArchivos(Array.from(input.files));
      input.value = ''; // Reset input
    }
  }

  /**
   * Procesar archivos seleccionados
   * Requirements: 1.3
   */
  private procesarArchivos(files: File[]): void {
    files.forEach(file => {
      // Validar tipo de archivo
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        console.error(`Tipo de archivo no permitido: ${file.type}`);
        alert(`El archivo "${file.name}" no tiene un formato permitido.`);
        return;
      }

      // Validar tamaño
      if (file.size > this.MAX_FILE_SIZE) {
        console.error(`Archivo muy grande: ${file.size} bytes`);
        alert(`El archivo "${file.name}" excede el tamaño máximo de 10MB.`);
        return;
      }

      // Crear preview
      const archivoPreview: ArchivoPreview = {
        file: file,
        nombre: file.name,
        tamano: file.size,
        tipo: file.type,
        progreso: 0
      };

      // Generar preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          archivoPreview.preview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }

      this.archivosAdjuntos.push(archivoPreview);

      // Simular progreso de carga
      this.simularProgresoCarga(archivoPreview);
    });
  }

  /**
   * Simular progreso de carga de archivo
   * Requirements: 1.3
   */
  private simularProgresoCarga(archivo: ArchivoPreview): void {
    const interval = setInterval(() => {
      archivo.progreso += 10;
      if (archivo.progreso >= 100) {
        clearInterval(interval);
      }
    }, 100);
  }

  /**
   * Eliminar archivo de la lista
   * Requirements: 1.3
   */
  eliminarArchivo(index: number): void {
    this.archivosAdjuntos.splice(index, 1);
  }

  /**
   * Eliminar todos los archivos
   * Requirements: 1.3
   */
  eliminarTodosArchivos(): void {
    if (confirm('¿Está seguro de eliminar todos los archivos?')) {
      this.archivosAdjuntos = [];
    }
  }

  /**
   * Obtener icono según tipo de archivo
   * Requirements: 1.3
   */
  getFileIcon(tipo: string): string {
    if (tipo.includes('pdf')) return 'picture_as_pdf';
    if (tipo.includes('word')) return 'description';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return 'table_chart';
    if (tipo.includes('image')) return 'image';
    return 'insert_drive_file';
  }

  /**
   * Formatear tamaño de archivo
   * Requirements: 1.3
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
