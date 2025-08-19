import { Component, Inject, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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

import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { 
  BajaVehiculoCreate, 
  TipoBajaVehiculo, 
  EstadoBajaVehiculo 
} from '../../models/baja-vehiculo.model';
import { BajaVehiculoService } from '../../services/baja-vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ArchivoUploadComponent } from '../../shared/archivo-upload.component';
import { ArchivoSustentatorio } from '../../models/historial-transferencia-empresa.model';

export interface SolicitarBajaVehiculoData {
  vehiculo: Vehiculo;
}

@Component({
  selector: 'app-solicitar-baja-vehiculo-modal',
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
    ArchivoUploadComponent
  ],
  template: `
    <div class="solicitar-baja-modal">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>remove_circle</mat-icon>
            SOLICITAR BAJA DE VEHÍCULO
          </mat-card-title>
          <mat-card-subtitle>
            Solicitar baja de {{ data.vehiculo.placa }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Información del vehículo -->
          <div class="vehiculo-info">
            <h4>VEHÍCULO A DAR DE BAJA</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">PLACA:</span>
                <span class="value">{{ data.vehiculo.placa }}</span>
              </div>
              <div class="info-item">
                <span class="label">MARCA:</span>
                <span class="value">{{ data.vehiculo.marca }}</span>
              </div>
              <div class="info-item">
                <span class="label">MODELO:</span>
                <span class="value">{{ data.vehiculo.modelo }}</span>
              </div>
              <div class="info-item">
                <span class="label">AÑO:</span>
                <span class="value">{{ data.vehiculo.anioFabricacion }}</span>
              </div>
              <div class="info-item">
                <span class="label">EMPRESA:</span>
                <span class="value">{{ empresa()?.razonSocial?.principal }}</span>
              </div>
              <div class="info-item">
                <span class="label">ESTADO ACTUAL:</span>
                <span class="value estado-actual">{{ data.vehiculo.estado }}</span>
              </div>
            </div>
          </div>

          <!-- Formulario de solicitud de baja -->
          <form [formGroup]="bajaForm" class="baja-form">
            <div class="form-section">
              <h4>INFORMACIÓN DE LA BAJA</h4>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>TIPO DE BAJA</mat-label>
                  <mat-select formControlName="tipoBaja" required>
                    <mat-option value="">Seleccionar tipo de baja</mat-option>
                    @for (tipo of tiposBaja; track tipo) {
                      <mat-option [value]="tipo">
                        {{ obtenerNombreTipoBaja(tipo) }}
                      </mat-option>
                    }
                  </mat-select>
                  <mat-icon matSuffix>category</mat-icon>
                  <mat-error *ngIf="bajaForm.get('tipoBaja')?.hasError('required')">
                    El tipo de baja es obligatorio
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>FECHA DE BAJA</mat-label>
                  <input matInput 
                         [matDatepicker]="picker" 
                         formControlName="fechaBaja"
                         required>
                  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-icon matSuffix>event</mat-icon>
                  <mat-error *ngIf="bajaForm.get('fechaBaja')?.hasError('required')">
                    La fecha de baja es obligatoria
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>MOTIVO DE LA BAJA</mat-label>
                  <textarea matInput 
                            formControlName="motivo" 
                            rows="3"
                            placeholder="Describa detalladamente el motivo de la baja..."
                            required></textarea>
                  <mat-icon matSuffix>description</mat-icon>
                  <mat-error *ngIf="bajaForm.get('motivo')?.hasError('required')">
                    El motivo es obligatorio
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>DESCRIPCIÓN ADICIONAL</mat-label>
                  <textarea matInput 
                            formControlName="descripcion" 
                            rows="2"
                            placeholder="Descripción adicional (opcional)..."></textarea>
                  <mat-icon matSuffix>note</mat-icon>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>RESOLUCIÓN ASOCIADA</mat-label>
                  <input matInput 
                         formControlName="resolucionId"
                         placeholder="ID de la resolución (opcional)...">
                  <mat-icon matSuffix>description</mat-icon>
                  <mat-hint>Si la baja está asociada a una resolución específica</mat-hint>
                </mat-form-field>
              </div>
            </div>

            <!-- Campos específicos según tipo de baja -->
            <mat-expansion-panel class="campos-especificos" [expanded]="true">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>settings</mat-icon>
                  CAMPOS ESPECÍFICOS
                </mat-panel-title>
                <mat-panel-description>
                  Información adicional según el tipo de baja
                </mat-panel-description>
              </mat-expansion-panel-header>

              <!-- Sustitución -->
              @if (bajaForm.get('tipoBaja')?.value === 'SUSTITUCION') {
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>VEHÍCULO SUSTITUTO</mat-label>
                    <input matInput 
                           formControlName="vehiculoSustitutoId"
                           placeholder="ID del vehículo que reemplaza...">
                    <mat-icon matSuffix>swap_horiz</mat-icon>
                    <mat-hint>ID del vehículo que sustituye al actual</mat-hint>
                  </mat-form-field>
                </div>
              }

              <!-- Accidente -->
              @if (bajaForm.get('tipoBaja')?.value === 'ACCIDENTE_GRAVE') {
                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>FECHA DEL ACCIDENTE</mat-label>
                    <input matInput 
                           [matDatepicker]="pickerAccidente" 
                           formControlName="fechaAccidente">
                    <mat-datepicker-toggle matSuffix [for]="pickerAccidente"></mat-datepicker-toggle>
                    <mat-datepicker #pickerAccidente></mat-datepicker>
                    <mat-icon matSuffix>event</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>LUGAR DEL ACCIDENTE</mat-label>
                    <input matInput 
                           formControlName="lugarAccidente"
                           placeholder="Ubicación del accidente...">
                    <mat-icon matSuffix>location_on</mat-icon>
                  </mat-form-field>
                </div>
              }

              <!-- Venta -->
              @if (bajaForm.get('tipoBaja')?.value === 'VENTA') {
                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>VALOR DE VENTA</mat-label>
                    <input matInput 
                           type="number"
                           formControlName="valorVenta"
                           placeholder="0.00">
                    <mat-icon matSuffix>attach_money</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>COMPRADOR</mat-label>
                    <input matInput 
                           formControlName="comprador"
                           placeholder="Nombre del comprador...">
                    <mat-icon matSuffix>person</mat-icon>
                  </mat-form-field>
                </div>
              }

              <!-- Vigencia Caducada -->
              @if (bajaForm.get('tipoBaja')?.value === 'VIGENCIA_CADUCADA') {
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>OBSERVACIONES</mat-label>
                    <textarea matInput 
                              formControlName="observaciones" 
                              rows="2"
                              placeholder="Detalles sobre la caducidad de vigencia..."></textarea>
                    <mat-icon matSuffix>warning</mat-icon>
                    <mat-hint>Especifique los detalles de la caducidad</mat-hint>
                  </mat-form-field>
                </div>
              }
            </mat-expansion-panel>

            <!-- Archivos sustentatorios -->
            <div class="archivos-section">
              <h4>ARCHIVOS SUSTENTATORIOS</h4>
              <p class="archivos-hint">
                Sube documentos que respalden la solicitud de baja (reportes, fotos, documentos legales, etc.)
              </p>
              <app-archivo-upload 
                [archivosExistentes]="archivosSustentatorios()"
                (archivosSubidosChange)="onArchivosChange($event)">
              </app-archivo-upload>
            </div>

            <!-- Resumen de la solicitud -->
            @if (bajaForm.get('tipoBaja')?.value) {
              <div class="resumen-solicitud">
                <h4>RESUMEN DE LA SOLICITUD</h4>
                <div class="resumen-content">
                  <div class="resumen-item">
                    <span class="resumen-label">VEHÍCULO:</span>
                    <span class="resumen-value">{{ data.vehiculo.placa }} - {{ data.vehiculo.marca }} {{ data.vehiculo.modelo }}</span>
                  </div>
                  <div class="resumen-item">
                    <span class="resumen-label">TIPO DE BAJA:</span>
                    <span class="resumen-value tipo-baja">{{ obtenerNombreTipoBaja(bajaForm.get('tipoBaja')?.value) }}</span>
                  </div>
                  <div class="resumen-item">
                    <span class="resumen-label">FECHA:</span>
                    <span class="resumen-value">{{ bajaForm.get('fechaBaja')?.value | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="resumen-item">
                    <span class="resumen-label">MOTIVO:</span>
                    <span class="resumen-value">{{ bajaForm.get('motivo')?.value }}</span>
                  </div>
                </div>
              </div>
            }
          </form>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button 
                  (click)="cancelar()"
                  [disabled]="procesando()">
            CANCELAR
          </button>
          <button mat-raised-button 
                  color="warn" 
                  (click)="confirmarSolicitud()"
                  [disabled]="!bajaForm.valid || procesando()">
            @if (procesando()) {
              <mat-spinner diameter="20"></mat-spinner>
              PROCESANDO...
            } @else {
              <ng-container>
                <mat-icon>send</mat-icon>
                ENVIAR SOLICITUD
              </ng-container>
            }
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styleUrls: ['./solicitar-baja-vehiculo-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitarBajaVehiculoModalComponent {
  private fb = inject(FormBuilder);
  private bajaService = inject(BajaVehiculoService);
  private empresaService = inject(EmpresaService);
  private snackBar = inject(MatSnackBar);

  // Signals
  empresa = signal<Empresa | null>(null);
  procesando = signal(false);
  archivosSustentatorios = signal<ArchivoSustentatorio[]>([]);

  // Formulario
  bajaForm: FormGroup;

  // Tipos de baja disponibles
  tiposBaja = this.bajaService.obtenerTiposBaja();

  constructor(
    public dialogRef: MatDialogRef<SolicitarBajaVehiculoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SolicitarBajaVehiculoData
  ) {
    this.bajaForm = this.fb.group({
      tipoBaja: ['', Validators.required],
      fechaBaja: [new Date(), Validators.required],
      motivo: ['', Validators.required],
      descripcion: [''],
      observaciones: [''],
      resolucionId: [''],
      vehiculoSustitutoId: [''],
      fechaAccidente: [''],
      lugarAccidente: [''],
      valorVenta: [''],
      comprador: ['']
    });

    this.cargarEmpresa();
  }

  private cargarEmpresa(): void {
    this.empresaService.getEmpresa(this.data.vehiculo.empresaActualId).subscribe({
      next: (empresa: Empresa) => {
        this.empresa.set(empresa);
      },
      error: (error: any) => {
        console.error('Error al cargar empresa:', error);
        this.snackBar.open('Error al cargar empresa', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onArchivosChange(archivos: ArchivoSustentatorio[]): void {
    this.archivosSustentatorios.set(archivos);
  }

  obtenerNombreTipoBaja(tipo: TipoBajaVehiculo): string {
    return this.bajaService.obtenerNombreTipoBaja(tipo);
  }

  confirmarSolicitud(): void {
    if (this.bajaForm.valid) {
      this.procesando.set(true);
      
      const formData = this.bajaForm.value;
      
      const solicitudBaja: BajaVehiculoCreate = {
        vehiculoId: this.data.vehiculo.id,
        empresaId: this.data.vehiculo.empresaActualId,
        fechaBaja: formData.fechaBaja.toISOString(),
        tipoBaja: formData.tipoBaja,
        motivo: formData.motivo,
        descripcion: formData.descripcion,
        observaciones: formData.observaciones,
        resolucionId: formData.resolucionId || undefined,
        vehiculoSustitutoId: formData.vehiculoSustitutoId || undefined,
        fechaAccidente: formData.fechaAccidente || undefined,
        lugarAccidente: formData.lugarAccidente || undefined,
        valorVenta: formData.valorVenta ? Number(formData.valorVenta) : undefined,
        comprador: formData.comprador || undefined,
        documentosSustentatorios: this.archivosSustentatorios().map(a => a.id)
      };

      this.bajaService.crearBaja(solicitudBaja).subscribe({
        next: (baja) => {
          console.log('✅ Solicitud de baja creada:', baja);
          this.snackBar.open('Solicitud de baja enviada exitosamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close({
            success: true,
            baja: baja
          });
        },
        error: (error) => {
          console.error('❌ Error al crear solicitud de baja:', error);
          this.snackBar.open('Error al enviar solicitud de baja', 'Cerrar', { duration: 5000 });
          this.procesando.set(false);
        }
      });
    }
  }

  cancelar(): void {
    this.dialogRef.close({ success: false });
  }
} 