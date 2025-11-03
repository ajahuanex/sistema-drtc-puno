import { Component, OnInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { IntegracionService } from '../../services/mesa-partes/integracion.service';
import { Integracion, ConfiguracionWebhook } from '../../models/mesa-partes/integracion.model';

export interface WebhookConfigData {
  integracion: Integracion;
}

@Component({
  selector: 'app-webhook-config-modal',
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
    MatSlideToggleModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>webhook</mat-icon>
        Configurar Webhook - {{ data.integracion.nombre }}
      </h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      <form [formGroup]="webhookForm" class="webhook-form">
        
        <!-- Configuración básica -->
        <div class="form-section">
          <h3>
            <mat-icon>settings</mat-icon>
            Configuración Básica
          </h3>
          
          <div class="form-row">
            <mat-slide-toggle formControlName="activo">
              Webhook activo
            </mat-slide-toggle>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>URL del Webhook *</mat-label>
            <input 
              matInput 
              formControlName="url"
              placeholder="https://tu-servidor.com/webhook"
              type="url">
            <mat-error *ngIf="webhookForm.get('url')?.hasError('required')">
              La URL es requerida
            </mat-error>
            <mat-error *ngIf="webhookForm.get('url')?.hasError('pattern')">
              Ingrese una URL válida
            </mat-error>
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Método HTTP</mat-label>
              <mat-select formControlName="metodo">
                <mat-option value="POST">POST</mat-option>
                <mat-option value="PUT">PUT</mat-option>
                <mat-option value="PATCH">PATCH</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Timeout (segundos)</mat-label>
              <input 
                matInput 
                formControlName="timeout"
                type="number"
                min="1"
                max="60"
                placeholder="30">
            </mat-form-field>
          </div>
        </div>

        <!-- Seguridad -->
        <div class="form-section">
          <h3>
            <mat-icon>security</mat-icon>
            Seguridad
          </h3>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Secreto para Firma</mat-label>
            <input 
              matInput 
              formControlName="secreto"
              placeholder="Secreto para validar la firma HMAC"
              type="password">
            <mat-hint>Se usará para generar la firma HMAC-SHA256 en el header X-Signature</mat-hint>
          </mat-form-field>

          <div class="secret-actions" *ngIf="!webhookForm.get('secreto')?.value">
            <button 
              mat-button 
              type="button"
              (click)="generarSecreto()">
              <mat-icon>auto_fix_high</mat-icon>
              Generar Secreto Automático
            </button>
          </div>
        </div>

        <!-- Eventos -->
        <div class="form-section">
          <h3>
            <mat-icon>event</mat-icon>
            Eventos a Notificar
          </h3>
          
          <div class="eventos-grid">
            <mat-slide-toggle 
              *ngFor="let evento of eventosDisponibles"
              [formControlName]="'evento_' + evento.value"
              class="evento-toggle">
              <div class="evento-info">
                <div class="evento-header">
                  <mat-icon>{{ evento.icon }}</mat-icon>
                  <strong>{{ evento.label }}</strong>
                </div>
                <small>{{ evento.descripcion }}</small>
              </div>
            </mat-slide-toggle>
          </div>
        </div>

        <!-- Headers personalizados -->
        <div class="form-section">
          <div class="section-header">
            <h3>
              <mat-icon>http</mat-icon>
              Headers Personalizados
            </h3>
            <button 
              mat-button 
              type="button"
              (click)="agregarHeader()">
              <mat-icon>add</mat-icon>
              Agregar Header
            </button>
          </div>

          <div class="headers-container" formArrayName="headers">
            <div 
              *ngFor="let header of headers.controls; let i = index"
              [formGroupName]="i"
              class="header-row">
              
              <mat-form-field appearance="outline" class="header-field">
                <mat-label>Nombre</mat-label>
                <input 
                  matInput 
                  formControlName="nombre"
                  placeholder="X-Custom-Header">
              </mat-form-field>

              <mat-form-field appearance="outline" class="header-field">
                <mat-label>Valor</mat-label>
                <input 
                  matInput 
                  formControlName="valor"
                  placeholder="valor-del-header">
              </mat-form-field>

              <button 
                mat-icon-button 
                type="button"
                color="warn"
                (click)="removerHeader(i)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>

          <div class="no-headers" *ngIf="headers.length === 0">
            <mat-icon>http</mat-icon>
            <p>No hay headers personalizados configurados</p>
          </div>
        </div>

        <!-- Configuración avanzada -->
        <div class="form-section">
          <h3>
            <mat-icon>tune</mat-icon>
            Configuración Avanzada
          </h3>
          
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Reintentos</mat-label>
              <input 
                matInput 
                formControlName="reintentos"
                type="number"
                min="0"
                max="5"
                placeholder="3">
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Intervalo de Reintento (segundos)</mat-label>
              <input 
                matInput 
                formControlName="intervaloReintento"
                type="number"
                min="1"
                max="300"
                placeholder="60">
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-slide-toggle formControlName="verificarSSL">
              Verificar certificado SSL
            </mat-slide-toggle>
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button 
        mat-button 
        mat-dialog-close>
        Cancelar
      </button>
      
      <button 
        mat-button 
        type="button"
        [disabled]="!webhookForm.valid || probando"
        (click)="probarWebhook()">
        <mat-icon *ngIf="!probando">bug_report</mat-icon>
        <mat-spinner *ngIf="probando" diameter="20"></mat-spinner>
        Probar Webhook
      </button>
      
      <button 
        mat-raised-button 
        color="primary"
        [disabled]="!webhookForm.valid || guardando"
        (click)="guardar()">
        <mat-icon *ngIf="!guardando">save</mat-icon>
        <mat-spinner *ngIf="guardando" diameter="20"></mat-spinner>
        Guardar Configuración
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .modal-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .webhook-form {
      width: 100%;
    }

    .form-section {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #f0f0f0;
    }

    .form-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .form-section h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      align-items: center;
    }

    .form-field {
      flex: 1;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .secret-actions {
      margin-top: 8px;
    }

    .eventos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .evento-toggle {
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
    }

    .evento-info {
      margin-left: 8px;
    }

    .evento-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .evento-header mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #667eea;
    }

    .evento-info small {
      color: #6c757d;
      font-size: 12px;
    }

    .headers-container {
      margin-bottom: 16px;
    }

    .header-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .header-field {
      flex: 1;
    }

    .no-headers {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .no-headers mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #cbd5e0;
      margin-bottom: 8px;
    }

    .no-headers p {
      margin: 0;
      color: #6c757d;
      font-size: 14px;
    }

    .modal-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        align-items: stretch;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .eventos-grid {
        grid-template-columns: 1fr;
      }

      .header-row {
        flex-direction: column;
      }

      .modal-actions {
        flex-direction: column;
      }

      .modal-actions button {
        width: 100%;
      }
    }
  `]
})
export class WebhookConfigModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private integracionService = inject(IntegracionService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<WebhookConfigModalComponent>);

  webhookForm: FormGroup;
  guardando = false;
  probando = false;

  // Eventos disponibles para webhook
  eventosDisponibles = [
    {
      value: 'documento_creado',
      label: 'Documento Creado',
      descripcion: 'Se notifica cuando se registra un nuevo documento',
      icon: 'add_circle'
    },
    {
      value: 'documento_derivado',
      label: 'Documento Derivado',
      descripcion: 'Se notifica cuando se deriva un documento',
      icon: 'send'
    },
    {
      value: 'documento_recibido',
      label: 'Documento Recibido',
      descripcion: 'Se notifica cuando se recibe un documento derivado',
      icon: 'inbox'
    },
    {
      value: 'documento_atendido',
      label: 'Documento Atendido',
      descripcion: 'Se notifica cuando se marca un documento como atendido',
      icon: 'check_circle'
    },
    {
      value: 'documento_archivado',
      label: 'Documento Archivado',
      descripción: 'Se notifica cuando se archiva un documento',
      icon: 'archive'
    },
    {
      value: 'documento_vencido',
      label: 'Documento Vencido',
      descripcion: 'Se notifica cuando un documento supera su fecha límite',
      icon: 'schedule'
    }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: WebhookConfigData
  ) {
    this.webhookForm = this.createForm();
  }

  ngOnInit(): void {
    this.cargarConfiguracionExistente();
  }

  /**
   * Crear formulario reactivo
   */
  private createForm(): FormGroup {
    return this.fb.group({
      activo: [false],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      metodo: ['POST'],
      timeout: [30, [Validators.min(1), Validators.max(60)]],
      secreto: [''],
      reintentos: [3, [Validators.min(0), Validators.max(5)]],
      intervaloReintento: [60, [Validators.min(1), Validators.max(300)]],
      verificarSSL: [true],
      headers: this.fb.array([]),
      eventos: this.fb.array(this.createEventosControls())
    });
  }

  /**
   * Crear controles para eventos disponibles
   */
  private createEventosControls(): FormGroup[] {
    return this.eventosDisponibles.map(evento => 
      this.fb.group({
        evento: [evento.value],
        seleccionado: [false]
      })
    );
  }

  /**
   * Getter para FormArray de headers
   */
  get headers(): FormArray {
    return this.webhookForm.get('headers') as FormArray;
  }

  /**
   * Getter para FormArray de eventos
   */
  get eventos(): FormArray {
    return this.webhookForm.get('eventos') as FormArray;
  }

  /**
   * Cargar configuración existente si existe
   */
  private cargarConfiguracionExistente(): void {
    if (this.data.integracion.configuracionWebhook) {
      const config = this.data.integracion.configuracionWebhook;
      
      this.webhookForm.patchValue({
        activo: config.activo,
        url: config.url,
        metodo: config.metodo,
        timeout: config.timeout,
        secreto: config.secreto,
        reintentos: config.reintentos,
        intervaloReintento: config.intervaloReintento,
        verificarSSL: config.verificarSSL
      });

      // Cargar eventos seleccionados
      if (config.eventos) {
        this.eventos.controls.forEach(control => {
          const eventoValue = control.get('evento')?.value;
          if (config.eventos.includes(eventoValue)) {
            control.get('seleccionado')?.setValue(true);
          }
        });
      }

      // Cargar headers personalizados
      if (config.headers) {
        Object.entries(config.headers).forEach(([nombre, valor]) => {
          this.headers.push(this.createHeaderGroup(nombre, valor as string));
        });
      }
    }
  }

  /**
   * Crear FormGroup para header personalizado
   */
  private createHeaderGroup(nombre = '', valor = ''): FormGroup {
    return this.fb.group({
      nombre: [nombre, Validators.required],
      valor: [valor, Validators.required]
    });
  }

  /**
   * Agregar nuevo header personalizado
   */
  agregarHeader(): void {
    this.headers.push(this.createHeaderGroup());
  }

  /**
   * Remover header personalizado
   */
  removerHeader(index: number): void {
    this.headers.removeAt(index);
  }

  /**
   * Generar secreto automático
   */
  generarSecreto(): void {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secreto = '';
    
    for (let i = 0; i < 32; i++) {
      secreto += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    
    this.webhookForm.patchValue({ secreto });
    this.snackBar.open('Secreto generado automáticamente', 'Cerrar', {
      duration: 2000
    });
  }

  /**
   * Probar webhook con configuración actual
   */
  probarWebhook(): void {
    if (!this.webhookForm.valid) {
      this.snackBar.open('Complete los campos requeridos', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.probando = true;
    const configuracion = this.construirConfiguracion();
    
    this.integracionService.probarWebhook(this.data.integracion.id, configuracion).subscribe({
      next: (resultado) => {
        this.probando = false;
        if (resultado.exitoso) {
          this.snackBar.open('✅ Webhook probado exitosamente', 'Cerrar', {
            duration: 3000
          });
        } else {
          this.snackBar.open(`❌ Error: ${resultado.mensaje}`, 'Cerrar', {
            duration: 5000
          });
        }
      },
      error: (error) => {
        console.error('Error al probar webhook:', error);
        this.probando = false;
        this.snackBar.open('❌ Error al probar webhook', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  /**
   * Guardar configuración de webhook
   */
  guardar(): void {
    if (!this.webhookForm.valid) {
      this.snackBar.open('Complete los campos requeridos', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.guardando = true;
    const configuracion = this.construirConfiguracion();

    this.integracionService.configurarWebhook(this.data.integracion.id, configuracion).subscribe({
      next: (resultado) => {
        this.guardando = false;
        this.snackBar.open('Configuración de webhook guardada exitosamente', 'Cerrar', {
          duration: 3000
        });
        this.dialogRef.close(resultado);
      },
      error: (error) => {
        console.error('Error al guardar configuración:', error);
        this.guardando = false;
        this.snackBar.open('Error al guardar configuración', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  /**
   * Construir configuración de webhook desde el formulario
   */
  private construirConfiguracion(): ConfiguracionWebhook {
    const formValue = this.webhookForm.value;
    
    // Obtener eventos seleccionados
    const eventos = formValue.eventos
      .filter((evento: any) => evento.seleccionado)
      .map((evento: any) => evento.evento);

    // Construir headers personalizados
    const headers: { [key: string]: string } = {};
    formValue.headers.forEach((header: any) => {
      if (header.nombre && header.valor) {
        headers[header.nombre] = header.valor;
      }
    });

    return {
      activo: formValue.activo,
      url: formValue.url,
      metodo: formValue.metodo,
      timeout: formValue.timeout,
      secreto: formValue.secreto,
      eventos: eventos,
      headers: headers,
      reintentos: formValue.reintentos,
      intervaloReintento: formValue.intervaloReintento,
      verificarSSL: formValue.verificarSSL
    };
  }
}