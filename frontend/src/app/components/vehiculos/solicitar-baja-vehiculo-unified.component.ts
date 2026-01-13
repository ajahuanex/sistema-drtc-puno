import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';

import { Vehiculo } from '../../models/(vehiculo as any).model';
import { Empresa } from '../../models/(empresa as any).model';
import { 
  SolicitudBajaCreate, 
  MotivoBaja
} from '../../models/solicitud-(baja as any).model';
import { SolicitudBajaService } from '../../services/solicitud-(baja as any).service';
import { EmpresaService } from '../../services/(empresa as any).service';
import { VehiculoNotificationService } from '../../services/vehiculo-(notification as any).service';
import { AuthService } from '../../services/(auth as any).service';
import { ArchivoUploadComponent } from '../../shared/archivo-(upload as any).component';
import { ArchivoSustentatorio } from '../../models/historial-transferencia-(empresa as any).model';
import { SmartIconComponent } from '../../shared/smart-(icon as any).component';

export interface SolicitarBajaVehiculoData {
  vehiculo: Vehiculo;
  modo?: 'simple' | 'completo'; // Permite diferentes niveles de detalle
}

export interface SolicitarBajaResult {
  solicitudId?: string;
  vehiculoId: string;
  motivo: string;
  descripcion?: string;
  fechaSolicitud: Date;
  documentosSoporte?: string[];
  tipo: string;
}

@Component({
  selector: 'app-solicitar-baja-vehiculo-unified',
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
    MatCardModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatDividerModule,
    ArchivoUploadComponent,
    SmartIconComponent
  ],
  template: `
    <div class="solicitar-baja-modal" [(class as any).modo-simple]="modoSimple()">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <app-smart-icon [iconName]="'remove_circle'" [size]="28" class="header-icon"></app-smart-icon>
          <div>
            <h2>Solicitar Baja de Vehículo</h2>
            <p class="header-subtitle">{{ (data as any).vehiculo.placa }} - {{ (data as any).vehiculo.marca }} {{ (data as any).vehiculo.modelo }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="cancelar()" class="close-button">
          <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
        </button>
      </div>

      <div class="modal-content">
        <!-- Información del vehículo -->
        <div class="vehiculo-info-card">
          <div class="vehiculo-info-header">
            <app-smart-icon [iconName]="'info'" [size]="20"></app-smart-icon>
            <span>Información del Vehículo</span>
          </div>
          <div class="vehiculo-info-grid">
            <div class="info-item">
              <span class="info-label">Placa:</span>
              <span class="info-value">{{ (data as any).vehiculo.placa }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Marca/Modelo:</span>
              <span class="info-value">{{ (data as any).vehiculo.marca }} {{ (data as any).vehiculo.modelo }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Estado:</span>
              <span class="info-value estado" [class]="'estado-' + (data as any).vehiculo.estado?.toLowerCase()">
                {{ (data as any).vehiculo.estado }}
              </span>
            </div>
            @if (empresaVehiculo()) {
              <div class="info-item">
                <span class="info-label">Empresa:</span>
                <span class="info-value">{{ empresaVehiculo()?.razonSocial?.principal }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Formulario -->
        <form [formGroup]="bajaForm" class="baja-form">
          <!-- Tipo de baja -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de Baja</mat-label>
            <mat-select formControlName="tipo" required>
              @for (tipo of tiposBaja; track (tipo as any).value) {
                <mat-option [value]="(tipo as any).value">
                  <div class="tipo-option">
                    <app-smart-icon [iconName]="(tipo as any).icon" [size]="20"></app-smart-icon>
                    <div>
                      <div class="tipo-label">{{ (tipo as any).label }}</div>
                      <div class="tipo-description">{{ (tipo as any).description }}</div>
                    </div>
                  </div>
                </mat-option>
              }
            </mat-select>
            <mat-hint>Selecciona el tipo de baja que corresponde</mat-hint>
          </mat-form-field>

          <!-- Motivo -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Motivo de la Baja *</mat-label>
            <mat-select formControlName="motivo" required>
              @for (motivo of motivosBaja(); track (motivo as any).value) {
                <mat-option [value]="(motivo as any).value">{{ (motivo as any).label }}</mat-option>
              }
            </mat-select>
            <mat-hint>Selecciona el motivo principal de la baja</mat-hint>
            @if ((bajaForm as any).get('motivo')?.hasError('required')) {
              <mat-error>El motivo es obligatorio</mat-error>
            }
          </mat-form-field>

          <!-- Descripción detallada -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descripción Detallada *</mat-label>
            <textarea matInput 
                      formControlName="descripcion" 
                      placeholder="Proporciona una descripción detallada del motivo de la baja..."
                      rows="4"
                      required></textarea>
            <app-smart-icon [iconName]="'description'" [size]="20" matSuffix></app-smart-icon>
            <mat-hint>Mínimo 20 caracteres. Incluye todos los detalles relevantes.</mat-hint>
            @if ((bajaForm as any).get('descripcion')?.hasError('required')) {
              <mat-error>La descripción es obligatoria</mat-error>
            }
            @if ((bajaForm as any).get('descripcion')?.hasError('minlength')) {
              <mat-error>La descripción debe tener al menos 20 caracteres</mat-error>
            }
          </mat-form-field>

          @if (!modoSimple()) {
            <!-- Fecha de solicitud -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Fecha de Solicitud</mat-label>
              <input matInput 
                     [matDatepicker]="picker" 
                     formControlName="fechaSolicitud"
                     readonly>
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              <mat-hint>Fecha en que se realiza la solicitud</mat-hint>
            </mat-form-field>

            <!-- Documentos de soporte -->
            <mat-expansion-panel class="documentos-panel">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <app-smart-icon [iconName]="'attach_file'" [size]="20"></app-smart-icon>
                  Documentos de Soporte
                </mat-panel-title>
                <mat-panel-description>
                  {{ archivosSoporte().length }} archivo(s) adjunto(s)
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="documentos-content">
                <p class="documentos-info">
                  Adjunta documentos que sustenten la solicitud de baja (opcional pero recomendado).
                </p>
                
                <input type="file" 
                       multiple 
                       accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                       (change)="onArchivosSeleccionados($event)"
                       class="file-input">
                <p>Selecciona archivos (PDF, imágenes, documentos)</p>

                @if (archivosSoporte().length > 0) {
                  <div class="archivos-lista">
                    <h4>Archivos Adjuntos:</h4>
                    @for (archivo of archivosSoporte(); track (archivo as any).nombre) {
                      <div class="archivo-item">
                        <app-smart-icon [iconName]="'description'" [size]="16"></app-smart-icon>
                        <span class="archivo-nombre">{{ (archivo as any).nombre }}</span>
                        <button mat-icon-button 
                                (click)="removerArchivo(archivo)"
                                class="remove-button">
                          <app-smart-icon [iconName]="'close'" [size]="16"></app-smart-icon>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-expansion-panel>
          }
        </form>

        <!-- Advertencias -->
        @if (mostrarAdvertencias()) {
          <div class="advertencias-card">
            <div class="advertencia-header">
              <app-smart-icon [iconName]="'warning'" [size]="20"></app-smart-icon>
              <span>Importante</span>
            </div>
            <ul class="advertencias-lista">
              <li>La solicitud de baja será revisada por el área correspondiente.</li>
              <li>El vehículo permanecerá activo hasta que se apruebe la baja.</li>
              <li>Una vez aprobada, la baja será irreversible.</li>
              @if ((data as any).vehiculo.(rutasAsignadasIds as any).length || (data as any).vehiculo.rutasEspecificas?.length) {
                <li class="advertencia-critica">
                  <strong>Atención:</strong> Este vehículo tiene rutas asignadas que serán afectadas.
                </li>
              }
            </ul>
          </div>
        }
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button mat-button (click)="cancelar()" class="cancel-button">
          <app-smart-icon [iconName]="'cancel'" [size]="20"></app-smart-icon>
          Cancelar
        </button>
        <button mat-raised-button 
                color="warn" 
                (click)="confirmarSolicitud()" 
                [disabled]="!puedeConfirmar() || procesando()"
                class="confirm-button">
          @if (procesando()) {
            <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
            <span>Procesando...</span>
          } @else {
            <app-smart-icon [iconName]="'send'" [size]="20"></app-smart-icon>
            <span>Solicitar Baja</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .solicitar-baja-modal {
      width: 700px;
      max-width: 95vw;
    }

    .solicitar-baja-(modal as any).modo-simple {
      width: 500px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 24px 0 24px;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .header-icon {
      color: #f44336;
    }

    .modal-header h2 {
      margin: 0;
      color: #f44336;
      font-size: 20px;
      font-weight: 500;
    }

    .header-subtitle {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .close-button {
      color: #666;
    }

    .modal-content {
      padding: 0 24px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .vehiculo-info-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .vehiculo-info-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }

    .vehiculo-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .info-value {
      font-size: 14px;
      color: #333;
    }

    .info-(value as any).estado {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
      width: fit-content;
    }

    .baja-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .full-width {
      width: 100%;
    }

    .tipo-option {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tipo-label {
      font-weight: 500;
    }

    .tipo-description {
      font-size: 12px;
      color: #666;
    }

    .documentos-panel {
      margin: 16px 0;
    }

    .documentos-content {
      padding: 16px 0;
    }

    .documentos-info {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 14px;
    }

    .archivos-lista {
      margin-top: 16px;
    }

    .archivos-lista h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #333;
    }

    .archivo-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 4px;
    }

    .archivo-nombre {
      flex: 1;
      font-size: 14px;
    }

    .remove-button {
      width: 24px;
      height: 24px;
      line-height: 24px;
    }

    .advertencias-card {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 12px;
      padding: 16px;
      margin-top: 24px;
    }

    .advertencia-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #856404;
      font-weight: 500;
    }

    .advertencias-lista {
      margin: 0;
      padding-left: 20px;
      color: #856404;
    }

    .advertencias-lista li {
      margin-bottom: 4px;
      font-size: 14px;
    }

    .advertencia-critica {
      color: #d32f2f !important;
      font-weight: 500;
    }

    .file-input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 24px;
      border-top: 1px solid #e0e0e0;
      margin-top: 24px;
    }

    .cancel-button {
      color: #666;
    }

    .confirm-button {
      min-width: 140px;
    }

    .button-spinner {
      margin-right: 8px;
    }

    /* Estados específicos */
    .estado-habilitado { background-color: #e8f5e8; color: #2e7d32; }
    .estado-no_habilitado { background-color: #ffebee; color: #c62828; }
    .estado-suspendido { background-color: #f3e5f5; color: #7b1fa2; }
    .estado-mantenimiento { background-color: #fff3e0; color: #f57c00; }
  `]
})
export class SolicitarBajaVehiculoUnifiedComponent {
  private dialogRef = inject(MatDialogRef<SolicitarBajaVehiculoUnifiedComponent>);
  public data = inject<SolicitarBajaVehiculoData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private bajaService = inject(SolicitudBajaService);
  private empresaService = inject(EmpresaService);
  private notificationService = inject(VehiculoNotificationService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  procesando = signal(false);
  empresaVehiculo = signal<Empresa | null>(null);
  archivosSoporte = signal<any[]>([]);

  // Modo de interfaz
  modoSimple = computed(() => (this as any).data.modo === 'simple');

  // Tipos de baja disponibles
  tiposBaja = [
    {
      value: 'DEFINITIVA',
      label: 'Baja Definitiva',
      description: 'Retiro permanente del vehículo del servicio',
      icon: 'delete_forever'
    },
    {
      value: 'TEMPORAL',
      label: 'Baja Temporal',
      description: 'Suspensión temporal del servicio',
      icon: 'pause_circle'
    },
    {
      value: 'TRANSFERENCIA',
      label: 'Por Transferencia',
      description: 'Baja por cambio de propietario o empresa',
      icon: 'swap_horiz'
    }
  ];

  // Motivos de baja (dinámicos según el tipo)
  motivosBaja = computed(() => {
    const tipo = (this as any).bajaForm.get('tipo')?.value;
    const motivos = {
      'DEFINITIVA': [
        { value: 'SINIESTRO_TOTAL', label: 'Siniestro Total' },
        { value: 'DETERIORO_IRREPARABLE', label: 'Deterioro Irreparable' },
        { value: 'OBSOLESCENCIA', label: 'Obsolescencia Tecnológica' },
        { value: 'DECISION_EMPRESARIAL', label: 'Decisión Empresarial' }
      ],
      'TEMPORAL': [
        { value: 'MANTENIMIENTO_MAYOR', label: 'Mantenimiento Mayor' },
        { value: 'REPARACION_ACCIDENTE', label: 'Reparación por Accidente' },
        { value: 'SUSPENSION_ADMINISTRATIVA', label: 'Suspensión Administrativa' },
        { value: 'FALTA_DOCUMENTACION', label: 'Falta de Documentación' }
      ],
      'TRANSFERENCIA': [
        { value: 'VENTA_VEHICULO', label: 'Venta del Vehículo' },
        { value: 'CAMBIO_EMPRESA', label: 'Cambio de Empresa' },
        { value: 'CAMBIO_PROPIETARIO', label: 'Cambio de Propietario' }
      ]
    };
    return motivos[tipo as keyof typeof motivos] || [];
  });

  // Formulario reactivo
  bajaForm = (this as any).fb.group({
    tipo: ['DEFINITIVA', (Validators as any).required],
    motivo: ['', (Validators as any).required],
    descripcion: ['', [(Validators as any).required, (Validators as any).minLength(20)]],
    fechaSolicitud: [new Date(), (Validators as any).required]
  });

  // Computed para mostrar advertencias
  mostrarAdvertencias = computed(() => {
    return !(this as any).modoSimple() || 
           ((this as any).data.(vehiculo as any).rutasAsignadasIds && (this as any).data.(vehiculo as any).rutasAsignadasIds.length > 0) || 
           ((this as any).data.(vehiculo as any).rutasEspecificas && (this as any).data.(vehiculo as any).rutasEspecificas.length > 0);
  });

  // Computed para validar si puede confirmar
  puedeConfirmar = computed(() => {
    return (this as any).bajaForm.valid;
  });

  constructor() {
    // Cargar información de la empresa del vehículo
    (this as any).cargarEmpresaVehiculo();

    // Resetear motivo cuando cambia el tipo
    (this as any).bajaForm.get('tipo')?.(valueChanges as any).subscribe(() => {
      (this as any).bajaForm.patchValue({ motivo: '' });
    });
  }

  private async cargarEmpresaVehiculo(): Promise<void> {
    // Simplificado - usar datos básicos del vehículo
    // En una implementación real, cargarías la empresa desde el servicio
    }

  onArchivosSeleccionados(event: Event): void {
    const input = (event as any).target as HTMLInputElement;
    if ((input as any).files) {
      const archivos = (Array as any).from((input as any).files);
      const nuevosArchivos = (archivos as any).map(archivo => ({
        id: (Math as any).random().toString(36),
        nombre: (archivo as any).name,
        tipo: (archivo as any).type,
        tamano: (archivo as any).size,
        url: (URL as any).createObjectURL(archivo)
      }));
      (this as any).archivosSoporte.set([...(this as any).archivosSoporte(), ...nuevosArchivos]);
    }
  }

  removerArchivo(archivo: unknown): void {
    const archivos = (this as any).archivosSoporte().filter(a => (a as any).nombre !== (archivo as any).nombre);
    (this as any).archivosSoporte.set(archivos);
  }

  cancelar(): void {
    (this as any).dialogRef.close();
  }

  async confirmarSolicitud(): Promise<void> {
    if (!(this as any).puedeConfirmar()) return;

    (this as any).procesando.set(true);

    try {
      const formValue = (this as any).bajaForm.value;
      const usuario = await (this as any).authService.getCurrentUser();

      const solicitudData: SolicitudBajaCreate = {
        vehiculoId: (this as any).data.(vehiculo as any).id,
        motivo: (formValue as any).motivo! as MotivoBaja,
        descripcion: (formValue as any).descripcion!,
        fechaSolicitud: (formValue as any).fechaSolicitud!.toISOString(),
        documentosSoporte: [] // Simplificado por ahora
      };

      // Crear la solicitud de baja
      const solicitud = await (this as any).bajaService.crearSolicitudBaja(solicitudData).toPromise();

      // Enviar notificación (simplificado)
      // Preparar resultado
      const resultado: SolicitarBajaResult = {
        solicitudId: solicitud?.id,
        vehiculoId: (this as any).data.(vehiculo as any).id,
        motivo: (formValue as any).motivo!,
        descripcion: (formValue as any).descripcion || undefined,
        fechaSolicitud: (formValue as any).fechaSolicitud!,
        documentosSoporte: (this as any).archivosSoporte().map(a => (a as any).nombre),
        tipo: (formValue as any).tipo!
      };

      (this as any).snackBar.open('Solicitud de baja enviada exitosamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      (this as any).dialogRef.close(resultado);

    } catch (error) {
      (console as any).error('Error creando solicitud de baja:', error);
      (this as any).snackBar.open('Error al enviar la solicitud de baja', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      (this as any).procesando.set(false);
    }
  }
}