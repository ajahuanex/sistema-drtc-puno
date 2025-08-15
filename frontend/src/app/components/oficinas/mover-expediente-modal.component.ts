import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Expediente } from '../../models/expediente.model';
import { Oficina } from '../../models/oficina.model';
import { OficinaService } from '../../services/oficina.service';
import { ExpedienteService } from '../../services/expediente.service';

export interface MoverExpedienteData {
  expediente: Expediente;
  oficinas: Oficina[];
}

@Component({
  selector: 'app-mover-expediente-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    FormsModule
  ],
  template: `
    <div class="mover-expediente-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>swap_horiz</mat-icon>
          Mover Expediente
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Contenido del Modal -->
      <mat-dialog-content class="modal-content">
        <!-- Información del Expediente -->
        <div class="expediente-info">
          <h3>Información del Expediente</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Número:</span>
              <span class="value">{{ data.expediente.nroExpediente }}</span>
            </div>
            <div class="info-item">
              <span class="label">Empresa:</span>
              <span class="value">{{ getEmpresaNombre(data.expediente.empresaId) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Estado Actual:</span>
              <span class="value">{{ data.expediente.estado }}</span>
            </div>
            <div class="info-item">
              <span class="label">Oficina Actual:</span>
              <span class="value">{{ data.expediente.oficinaActual?.nombre || 'Sin asignar' }}</span>
            </div>
          </div>
        </div>

        <!-- Formulario de Movimiento -->
        <form [formGroup]="movimientoForm" class="movimiento-form">
          <div class="form-section">
            <h3>Detalles del Movimiento</h3>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Oficina Destino *</mat-label>
                <mat-select formControlName="oficinaDestinoId" required>
                  <mat-option value="">Seleccionar oficina</mat-option>
                  @for (oficina of oficinasDisponibles(); track oficina.id) {
                    <mat-option [value]="oficina.id">
                      {{ oficina.nombre }} ({{ oficina.tipoOficina }})
                    </mat-option>
                  }
                </mat-select>
                <mat-error *ngIf="movimientoForm.get('oficinaDestinoId')?.hasError('required')">
                  La oficina destino es requerida
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Motivo del Movimiento *</mat-label>
                <mat-select formControlName="motivo" required>
                  <mat-option value="">Seleccionar motivo</mat-option>
                  <mat-option value="REVISION_TECNICA">Revisión Técnica</mat-option>
                  <mat-option value="REVISION_LEGAL">Revisión Legal</mat-option>
                  <mat-option value="APROBACION">Aprobación</mat-option>
                  <mat-option value="FISCALIZACION">Fiscalización</mat-option>
                  <mat-option value="ARCHIVO">Archivo</mat-option>
                  <mat-option value="OTRO">Otro</mat-option>
                </mat-select>
                <mat-error *ngIf="movimientoForm.get('motivo')?.hasError('required')">
                  El motivo es requerido
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Fecha de Movimiento</mat-label>
                <input matInput [matDatepicker]="fechaMovimientoPicker" formControlName="fechaMovimiento">
                <mat-datepicker-toggle matSuffix [for]="fechaMovimientoPicker"></mat-datepicker-toggle>
                <mat-datepicker #fechaMovimientoPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Tiempo Estimado (días)</mat-label>
                <input matInput type="number" formControlName="tiempoEstimado" min="1" max="30">
                <mat-error *ngIf="movimientoForm.get('tiempoEstimado')?.hasError('min')">
                  El tiempo mínimo es 1 día
                </mat-error>
                <mat-error *ngIf="movimientoForm.get('tiempoEstimado')?.hasError('max')">
                  El tiempo máximo es 30 días
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>Observaciones</mat-label>
                <textarea matInput formControlName="observaciones" rows="3" 
                          placeholder="Descripción detallada del motivo del movimiento..."></textarea>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Nivel de Urgencia</mat-label>
                <mat-select formControlName="urgencia">
                  <mat-option value="NORMAL">Normal</mat-option>
                  <mat-option value="URGENTE">Urgente</mat-option>
                  <mat-option value="MUY_URGENTE">Muy Urgente</mat-option>
                  <mat-option value="CRITICO">Crítico</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Prioridad</mat-label>
                <mat-select formControlName="prioridad">
                  <mat-option value="BAJA">Baja</mat-option>
                  <mat-option value="NORMAL">Normal</mat-option>
                  <mat-option value="ALTA">Alta</mat-option>
                  <mat-option value="CRITICA">Crítica</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <!-- Documentos Requeridos -->
          <div class="form-section">
            <h3>Documentos Requeridos</h3>
            <div class="documentos-container">
              <div class="documentos-actuales">
                <h4>Documentos Actuales</h4>
                @if (data.expediente.documentos && data.expediente.documentos.length > 0) {
                  <div class="documentos-lista">
                    @for (doc of data.expediente.documentos; track doc.id) {
                      <mat-chip selected>
                        <mat-icon>description</mat-icon>
                        {{ doc.nombre }}
                      </mat-chip>
                    }
                  </div>
                } @else {
                  <p class="no-documentos">No hay documentos asociados</p>
                }
              </div>

              <div class="documentos-nuevos">
                <h4>Documentos Requeridos en Destino</h4>
                <div class="documentos-input">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Agregar Documento</mat-label>
                    <input matInput [(ngModel)]="nuevoDocumento" 
                           placeholder="Nombre del documento requerido"
                           (keyup.enter)="agregarDocumento()">
                    <mat-icon matSuffix (click)="agregarDocumento()">add</mat-icon>
                  </mat-form-field>
                </div>
                
                @if (documentosRequeridos.length > 0) {
                  <div class="documentos-lista">
                    @for (doc of documentosRequeridos; track doc) {
                      <mat-chip selected (removed)="removerDocumento(doc)">
                        {{ doc }}
                        <mat-icon matChipRemove>cancel</mat-icon>
                      </mat-chip>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Configuraciones Adicionales -->
          <div class="form-section">
            <h3>Configuraciones Adicionales</h3>
            <div class="configuraciones">
              <mat-checkbox formControlName="notificarResponsable">
                Notificar al responsable de la oficina destino
              </mat-checkbox>
              
              <mat-checkbox formControlName="crearRecordatorio">
                Crear recordatorio automático
              </mat-checkbox>
              
              <mat-checkbox formControlName="requerirAprobacion">
                Requerir aprobación del supervisor
              </mat-checkbox>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <!-- Acciones del Modal -->
      <mat-dialog-actions class="modal-actions">
        <button mat-button mat-dialog-close>
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        
        <button mat-raised-button color="primary" 
                (click)="confirmarMovimiento()"
                [disabled]="movimientoForm.invalid || procesando()">
          <mat-icon>swap_horiz</mat-icon>
          <mat-spinner *ngIf="procesando()" diameter="20"></mat-spinner>
          {{ procesando() ? 'Procesando...' : 'Confirmar Movimiento' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./mover-expediente-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoverExpedienteModalComponent {
  private dialogRef = inject(MatDialogRef<MoverExpedienteModalComponent>);
  public data = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private oficinaService = inject(OficinaService);
  private expedienteService = inject(ExpedienteService);

  // Formulario
  movimientoForm: FormGroup;
  nuevoDocumento = '';
  documentosRequeridos: string[] = [];
  procesando = signal(false);

  constructor() {
    this.movimientoForm = this.fb.group({
      oficinaDestinoId: ['', Validators.required],
      motivo: ['', Validators.required],
      fechaMovimiento: [new Date()],
      tiempoEstimado: [5, [Validators.min(1), Validators.max(30)]],
      observaciones: [''],
      urgencia: ['NORMAL'],
      prioridad: ['NORMAL'],
      notificarResponsable: [true],
      crearRecordatorio: [true],
      requerirAprobacion: [false]
    });

    // Inicializar documentos requeridos
    this.documentosRequeridos = this.obtenerDocumentosRequeridos();
  }

  // Computed properties
  oficinasDisponibles = computed(() => {
    return this.data.oficinas.filter((oficina: Oficina) => 
      oficina.id !== this.data.expediente.oficinaActual?.id && 
      oficina.estaActiva
    );
  });

  // Métodos
  agregarDocumento(): void {
    if (this.nuevoDocumento.trim() && !this.documentosRequeridos.includes(this.nuevoDocumento.trim())) {
      this.documentosRequeridos.push(this.nuevoDocumento.trim());
      this.nuevoDocumento = '';
    }
  }

  removerDocumento(documento: string): void {
    const index = this.documentosRequeridos.indexOf(documento);
    if (index > -1) {
      this.documentosRequeridos.splice(index, 1);
    }
  }

  private obtenerDocumentosRequeridos(): string[] {
    // Lógica para determinar documentos requeridos según el tipo de oficina destino
    const documentosBase = [
      'Solicitud de Trámite',
      'Documento de Identidad',
      'Comprobante de Pago'
    ];
    
    return documentosBase;
  }

  getEmpresaNombre(empresaId?: string): string {
    if (!empresaId) return 'Sin empresa';
    // Aquí se podría implementar la lógica para obtener el nombre de la empresa
    // Por ahora retornamos un valor por defecto
    return 'Empresa ID: ' + empresaId;
  }

  async confirmarMovimiento(): Promise<void> {
    if (this.movimientoForm.invalid) {
      this.mostrarError('Por favor complete todos los campos requeridos');
      return;
    }

    this.procesando.set(true);

    try {
      const movimientoData = {
        ...this.movimientoForm.value,
        expedienteId: this.data.expediente.id,
        oficinaOrigenId: this.data.expediente.oficinaActual?.id,
        documentosRequeridos: this.documentosRequeridos,
        fechaMovimiento: this.movimientoForm.value.fechaMovimiento || new Date()
      };

      // Aquí se llamaría al servicio para mover el expediente
      // await this.expedienteService.moverExpediente(movimientoData);
      
      // Simular proceso
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.mostrarExito('Expediente movido exitosamente');
      this.dialogRef.close({
        success: true,
        movimiento: movimientoData
      });

    } catch (error) {
      console.error('Error moviendo expediente:', error);
      this.mostrarError('Error al mover el expediente');
    } finally {
      this.procesando.set(false);
    }
  }

  // Notificaciones
  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
  }
} 