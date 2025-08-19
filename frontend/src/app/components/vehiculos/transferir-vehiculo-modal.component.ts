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

import { Vehiculo, VehiculoUpdate } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { EmpresaService } from '../../services/empresa.service';
import { HistorialVehiculoService } from '../../services/historial-vehiculo.service';
import { HistorialTransferenciaEmpresaService } from '../../services/historial-transferencia-empresa.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { ArchivoUploadComponent } from '../../shared/archivo-upload.component';
import { ArchivoSustentatorio } from '../../models/historial-transferencia-empresa.model';

export interface TransferirVehiculoData {
  vehiculo: Vehiculo;
}

@Component({
  selector: 'app-transferir-vehiculo-modal',
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
    ArchivoUploadComponent
  ],
  template: `
    <div class="transferir-vehiculo-modal">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>swap_horiz</mat-icon>
            TRANSFERIR VEHÍCULO
          </mat-card-title>
          <mat-card-subtitle>
            Transferir {{ data.vehiculo.placa }} a otra empresa
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Información del vehículo actual -->
          <div class="vehiculo-info">
            <h4>VEHÍCULO ACTUAL</h4>
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
                <span class="label">EMPRESA ACTUAL:</span>
                <span class="value empresa-actual">{{ empresaActual()?.razonSocial?.principal }}</span>
              </div>
            </div>
          </div>

          <!-- Formulario de transferencia -->
          <form [formGroup]="transferenciaForm" class="transferencia-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>EMPRESA DESTINO</mat-label>
                <mat-select formControlName="empresaDestinoId" required>
                  <mat-option value="">Seleccionar empresa destino</mat-option>
                  @for (empresa of empresasDisponibles(); track empresa.id) {
                    <mat-option [value]="empresa.id">
                      {{ empresa.ruc }} - {{ empresa.razonSocial.principal }}
                    </mat-option>
                  }
                </mat-select>
                <mat-icon matSuffix>business</mat-icon>
                <mat-error *ngIf="transferenciaForm.get('empresaDestinoId')?.hasError('required')">
                  La empresa destino es obligatoria
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>FECHA DE TRANSFERENCIA</mat-label>
                <input matInput 
                       [matDatepicker]="picker" 
                       formControlName="fechaTransferencia"
                       required>
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-icon matSuffix>event</mat-icon>
                <mat-error *ngIf="transferenciaForm.get('fechaTransferencia')?.hasError('required')">
                  La fecha de transferencia es obligatoria
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>MOTIVO DE LA TRANSFERENCIA</mat-label>
                <textarea matInput 
                          formControlName="motivo" 
                          rows="3"
                          placeholder="Describa el motivo de la transferencia..."
                          required></textarea>
                <mat-icon matSuffix>description</mat-icon>
                <mat-error *ngIf="transferenciaForm.get('motivo')?.hasError('required')">
                  El motivo es obligatorio
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>OBSERVACIONES ADICIONALES</mat-label>
                <textarea matInput 
                          formControlName="observaciones" 
                          rows="2"
                          placeholder="Observaciones adicionales (opcional)..."></textarea>
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
                <mat-hint>Si la transferencia está asociada a una resolución específica</mat-hint>
              </mat-form-field>
            </div>
          </form>

          <!-- Resumen de la transferencia -->
          @if (empresaDestinoSeleccionada()) {
            <div class="resumen-transferencia">
              <h4>RESUMEN DE LA TRANSFERENCIA</h4>
              <div class="resumen-content">
                <div class="resumen-item">
                  <span class="resumen-label">DESDE:</span>
                  <span class="resumen-value origen">{{ empresaActual()?.razonSocial?.principal }}</span>
                </div>
                <div class="resumen-item">
                  <span class="resumen-label">HACIA:</span>
                  <span class="resumen-value destino">{{ empresaDestinoSeleccionada()?.razonSocial?.principal }}</span>
                </div>
                <div class="resumen-item">
                  <span class="resumen-label">FECHA:</span>
                  <span class="resumen-value">{{ transferenciaForm.get('fechaTransferencia')?.value | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
            </div>
          }

          <!-- Subida de archivos sustentatorios -->
          <div class="archivos-section">
            <h4>ARCHIVOS SUSTENTATORIOS</h4>
            <p class="archivos-hint">
              Sube documentos que respalden la transferencia (contratos, resoluciones, facturas, etc.)
            </p>
            <app-archivo-upload 
              [archivosExistentes]="archivosSustentatorios()"
              (archivosSubidosChange)="onArchivosChange($event)">
            </app-archivo-upload>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button 
                  (click)="cancelar()"
                  [disabled]="procesando()">
            CANCELAR
          </button>
          <button mat-raised-button 
                  color="primary" 
                  (click)="confirmarTransferencia()"
                  [disabled]="!transferenciaForm.valid || procesando()">
            @if (procesando()) {
              <mat-spinner diameter="20"></mat-spinner>
              PROCESANDO...
            } @else {
              <ng-container>
                <mat-icon>swap_horiz</mat-icon>
                CONFIRMAR TRANSFERENCIA
              </ng-container>
            }
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styleUrls: ['./transferir-vehiculo-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferirVehiculoModalComponent {
  private fb = inject(FormBuilder);
  private empresaService = inject(EmpresaService);
  private historialService = inject(HistorialVehiculoService);
  private historialTransferenciaService = inject(HistorialTransferenciaEmpresaService);
  private vehiculoService = inject(VehiculoService);
  private snackBar = inject(MatSnackBar);

  // Signals
  empresasDisponibles = signal<Empresa[]>([]);
  empresaActual = signal<Empresa | null>(null);
  empresaDestinoSeleccionada = signal<Empresa | null>(null);
  procesando = signal(false);
  archivosSustentatorios = signal<ArchivoSustentatorio[]>([]);

  // Formulario
  transferenciaForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<TransferirVehiculoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransferirVehiculoData
  ) {
    this.transferenciaForm = this.fb.group({
      empresaDestinoId: ['', Validators.required],
      fechaTransferencia: [new Date(), Validators.required],
      motivo: ['', Validators.required],
      observaciones: [''],
      resolucionId: ['']
    });

    this.cargarEmpresas();
    this.cargarEmpresaActual();
    this.configurarObservadores();
  }

  onArchivosChange(archivos: ArchivoSustentatorio[]): void {
    this.archivosSustentatorios.set(archivos);
  }

  private cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        // Filtrar la empresa actual
        const empresasFiltradas = empresas.filter(e => e.id !== this.data.vehiculo.empresaActualId);
        this.empresasDisponibles.set(empresasFiltradas);
      },
      error: (error) => {
        console.error('Error al cargar empresas:', error);
        this.snackBar.open('Error al cargar empresas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private cargarEmpresaActual(): void {
    this.empresaService.getEmpresa(this.data.vehiculo.empresaActualId).subscribe({
      next: (empresa: Empresa) => {
        this.empresaActual.set(empresa);
      },
      error: (error: any) => {
        console.error('Error al cargar empresa actual:', error);
      }
    });
  }

  private configurarObservadores(): void {
    // Observar cambios en la empresa destino seleccionada
    this.transferenciaForm.get('empresaDestinoId')?.valueChanges.subscribe(empresaId => {
      if (empresaId) {
        const empresa = this.empresasDisponibles().find(e => e.id === empresaId);
        this.empresaDestinoSeleccionada.set(empresa || null);
      } else {
        this.empresaDestinoSeleccionada.set(null);
      }
    });
  }

  confirmarTransferencia(): void {
    if (this.transferenciaForm.valid) {
      this.procesando.set(true);
      
      const transferenciaData = this.transferenciaForm.value;
      
      // 1. Registrar en el historial del vehículo
      this.historialService.registrarTransferenciaEmpresa(
        this.data.vehiculo.id,
        this.data.vehiculo.placa,
        this.data.vehiculo.empresaActualId,
        transferenciaData.empresaDestinoId,
        transferenciaData.motivo,
        transferenciaData.observaciones
      ).subscribe({
        next: (historial) => {
          console.log('✅ Transferencia registrada en historial del vehículo:', historial);
          
          // 2. Registrar en el historial de transferencias de empresas
          this.historialTransferenciaService.registrarTransferenciaVehiculo(
            this.data.vehiculo.id,
            this.data.vehiculo.empresaActualId,
            transferenciaData.empresaDestinoId,
            transferenciaData.motivo,
            transferenciaData.observaciones,
            transferenciaData.resolucionId,
            this.archivosSustentatorios()
          ).subscribe({
            next: (historialTransferencia) => {
              console.log('✅ Transferencia registrada en historial de empresas:', historialTransferencia);
              
              // 3. Actualizar el vehículo
              const vehiculoActualizado: VehiculoUpdate = {
                empresaActualId: transferenciaData.empresaDestinoId,
                resolucionId: transferenciaData.resolucionId || this.data.vehiculo.resolucionId
              };
              
              this.vehiculoService.updateVehiculo(this.data.vehiculo.id, vehiculoActualizado).subscribe({
                next: (vehiculo) => {
                  console.log('✅ Vehículo actualizado:', vehiculo);
                  this.snackBar.open('Vehículo transferido exitosamente', 'Cerrar', { duration: 3000 });
                  this.dialogRef.close({
                    success: true,
                    vehiculo: vehiculo,
                    historial: historial,
                    historialTransferencia: historialTransferencia
                  });
                },
                error: (error) => {
                  console.error('❌ Error al actualizar vehículo:', error);
                  this.snackBar.open('Error al actualizar vehículo', 'Cerrar', { duration: 5000 });
                  this.procesando.set(false);
                }
              });
            },
            error: (error) => {
              console.error('❌ Error al registrar en historial de empresas:', error);
              this.snackBar.open('Error al registrar en historial de empresas', 'Cerrar', { duration: 5000 });
              this.procesando.set(false);
            }
          });
        },
        error: (error) => {
          console.error('❌ Error al registrar transferencia en historial del vehículo:', error);
          this.snackBar.open('Error al registrar la transferencia', 'Cerrar', { duration: 5000 });
          this.procesando.set(false);
        }
      });
    }
  }

  cancelar(): void {
    this.dialogRef.close({ success: false });
  }
} 