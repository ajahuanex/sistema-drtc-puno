import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { HistorialVehicularService } from '../../services/historial-vehicular.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { TipoEventoHistorial } from '../../models/historial-vehicular.model';

interface TransferirEmpresaData {
  vehiculo: Vehiculo;
}

@Component({
  selector: 'app-transferir-empresa-modal',
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
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCardModule,
    SmartIconComponent
  ],
  template: `
    <div class="transferir-empresa-modal">
      <div class="modal-header">
        <div class="header-content">
          <app-smart-icon [iconName]="'swap_horiz'" [size]="32" class="header-icon"></app-smart-icon>
          <div>
            <h2 mat-dialog-title>Transferir Vehículo a Otra Empresa</h2>
            <p class="header-subtitle">
              Transferir el vehículo <strong>{{ data.vehiculo.placa }}</strong> a una nueva empresa
            </p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-button">
          <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <!-- Información del vehículo actual -->
        <mat-card class="vehiculo-info-card">
          <mat-card-header>
            <mat-card-title>
              <app-smart-icon [iconName]="'directions_car'" [size]="24"></app-smart-icon>
              Información del Vehículo
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="vehiculo-info">
              <div class="info-row">
                <span class="info-label">Placa:</span>
                <span class="info-value">{{ data.vehiculo.placa }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Marca/Modelo:</span>
                <span class="info-value">{{ data.vehiculo.marca }} {{ data.vehiculo.modelo }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Empresa Actual:</span>
                <span class="info-value">{{ empresaActual()?.razonSocial?.principal || 'No asignada' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Estado:</span>
                <span class="info-value estado" [class]="'estado-' + data.vehiculo.estado?.toLowerCase()">
                  {{ data.vehiculo.estado }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Formulario de transferencia -->
        <form [formGroup]="transferirForm" class="transferir-form">
          <div class="form-section">
            <h3>
              <app-smart-icon [iconName]="'business'" [size]="20"></app-smart-icon>
              Nueva Empresa
            </h3>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Seleccionar Empresa Destino</mat-label>
              <mat-select formControlName="empresaDestinoId" [disabled]="cargandoEmpresas()">
                @if (cargandoEmpresas()) {
                  <mat-option disabled>
                    <mat-spinner diameter="20"></mat-spinner>
                    Cargando empresas...
                  </mat-option>
                } @else {
                  @for (empresa of empresasDisponibles(); track empresa.id) {
                    <mat-option [value]="empresa.id">
                      <div class="empresa-option">
                        <div class="empresa-principal">
                          <strong>{{ empresa.razonSocial?.principal }}</strong>
                        </div>
                        <div class="empresa-secundaria">
                          RUC: {{ empresa.ruc }} | {{ empresa.estado }}
                        </div>
                      </div>
                    </mat-option>
                  }
                }
              </mat-select>
              <app-smart-icon [iconName]="'business'" [size]="20" matSuffix></app-smart-icon>
              @if (transferirForm.get('empresaDestinoId')?.hasError('required')) {
                <mat-error>Debe seleccionar una empresa destino</mat-error>
              }
            </mat-form-field>

            <!-- Información de la empresa seleccionada -->
            @if (empresaSeleccionada()) {
              <mat-card class="empresa-seleccionada-card">
                <mat-card-content>
                  <div class="empresa-seleccionada-info">
                    <h4>
                      <app-smart-icon [iconName]="'info'" [size]="20"></app-smart-icon>
                      Empresa Seleccionada
                    </h4>
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="label">Razón Social:</span>
                        <span class="value">{{ empresaSeleccionada()?.razonSocial?.principal }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">RUC:</span>
                        <span class="value">{{ empresaSeleccionada()?.ruc }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">Estado:</span>
                        <span class="value estado" [class]="'estado-' + empresaSeleccionada()?.estado?.toLowerCase()">
                          {{ empresaSeleccionada()?.estado }}
                        </span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>

          <mat-divider></mat-divider>

          <div class="form-section">
            <h3>
              <app-smart-icon [iconName]="'description'" [size]="20"></app-smart-icon>
              Resoluciones (Opcional)
            </h3>

            <div class="resoluciones-grid">
              <mat-form-field appearance="outline">
                <mat-label>Resolución Padre</mat-label>
                <mat-select formControlName="resolucionPadreId" [disabled]="cargandoResoluciones()">
                  <mat-option value="">Sin resolución padre</mat-option>
                  @if (cargandoResoluciones()) {
                    <mat-option disabled>
                      <mat-spinner diameter="20"></mat-spinner>
                      Cargando...
                    </mat-option>
                  } @else {
                    @for (resolucion of resolucionesPadre(); track resolucion.id) {
                      <mat-option [value]="resolucion.id">
                        {{ resolucion.nroResolucion }} - {{ resolucion.tipoTramite }}
                      </mat-option>
                    }
                  }
                </mat-select>
                <app-smart-icon [iconName]="'description'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Resolución Hija</mat-label>
                <mat-select formControlName="resolucionHijaId">
                  <mat-option value="">Sin resolución hija</mat-option>
                  @if (cargandoResoluciones()) {
                    <mat-option disabled>
                      <mat-spinner diameter="20"></mat-spinner>
                      Cargando...
                    </mat-option>
                  } @else {
                    @for (resolucion of resolucionesHijas(); track resolucion.id) {
                      <mat-option [value]="resolucion.id">
                        {{ resolucion.nroResolucion }} - {{ resolucion.tipoTramite }}
                      </mat-option>
                    }
                  }
                </mat-select>
                <app-smart-icon [iconName]="'description'" [size]="20" matSuffix></app-smart-icon>
              </mat-form-field>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="form-section">
            <h3>
              <app-smart-icon [iconName]="'edit'" [size]="20"></app-smart-icon>
              Detalles de la Transferencia
            </h3>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Motivo de la Transferencia</mat-label>
              <textarea matInput 
                        formControlName="motivo" 
                        rows="3"
                        placeholder="Describa el motivo de la transferencia..."></textarea>
              <app-smart-icon [iconName]="'edit'" [size]="20" matSuffix></app-smart-icon>
              @if (transferirForm.get('motivo')?.hasError('required')) {
                <mat-error>El motivo es requerido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Observaciones Adicionales</mat-label>
              <textarea matInput 
                        formControlName="observaciones" 
                        rows="2"
                        placeholder="Observaciones adicionales (opcional)..."></textarea>
              <app-smart-icon [iconName]="'note'" [size]="20" matSuffix></app-smart-icon>
            </mat-form-field>
          </div>
        </form>

        <!-- Información sobre rutas -->
        @if (data.vehiculo.rutasAsignadasIds?.length || data.vehiculo.rutasEspecificas?.length) {
          <mat-card class="rutas-info-card">
            <mat-card-content>
              <div class="rutas-info-content">
                <app-smart-icon [iconName]="'route'" [size]="24" class="info-icon"></app-smart-icon>
                <div class="rutas-info-text">
                  <h4>Información sobre Rutas</h4>
                  <p>Este vehículo tiene rutas asignadas que serán removidas durante la transferencia:</p>
                  <ul>
                    @if (data.vehiculo.rutasAsignadasIds?.length) {
                      <li>{{ data.vehiculo.rutasAsignadasIds?.length || 0 }} ruta(s) general(es)</li>
                    }
                    @if (data.vehiculo.rutasEspecificas?.length) {
                      <li>{{ data.vehiculo.rutasEspecificas?.length || 0 }} ruta(s) específica(s)</li>
                    }
                  </ul>
                  <p><strong>El vehículo entrará a la nueva empresa sin rutas asignadas.</strong></p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Advertencias -->
        <mat-card class="advertencia-card">
          <mat-card-content>
            <div class="advertencia-content">
              <app-smart-icon [iconName]="'warning'" [size]="24" class="warning-icon"></app-smart-icon>
              <div class="advertencia-text">
                <h4>Importante:</h4>
                <ul>
                  <li>Esta acción transferirá el vehículo a la nueva empresa seleccionada</li>
                  <li>Se registrará automáticamente en el historial vehicular</li>
                  <li>Las rutas específicas del vehículo podrían verse afectadas</li>
                  <li>La transferencia es irreversible una vez confirmada</li>
                </ul>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </mat-dialog-content>

      <mat-dialog-actions class="modal-actions">
        <button mat-button mat-dialog-close [disabled]="procesando()">
          <app-smart-icon [iconName]="'cancel'" [size]="20"></app-smart-icon>
          Cancelar
        </button>
        
        <button mat-raised-button 
                color="primary" 
                (click)="confirmarTransferencia()"
                [disabled]="!transferirForm.valid || procesando()">
          @if (procesando()) {
            <mat-spinner diameter="20"></mat-spinner>
            Procesando...
          } @else {
            <app-smart-icon [iconName]="'swap_horiz'" [size]="20"></app-smart-icon>
            Transferir Vehículo
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .transferir-empresa-modal {
      width: 100%;
      max-width: 800px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 24px 0 24px;
      margin-bottom: 16px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .header-icon {
      color: #1976d2;
    }

    .header-content h2 {
      margin: 0;
      color: #1976d2;
      font-size: 24px;
      font-weight: 500;
    }

    .header-subtitle {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .close-button {
      margin-top: -8px;
    }

    .modal-content {
      padding: 0 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .vehiculo-info-card {
      margin-bottom: 24px;
      background: #f8f9fa;
    }

    .vehiculo-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .info-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
    }

    .info-value {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }

    .estado {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .estado-activo { background: #e8f5e8; color: #2e7d32; }
    .estado-inactivo { background: #ffebee; color: #c62828; }
    .estado-suspendido { background: #fff3e0; color: #f57c00; }

    .transferir-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #1976d2;
      font-size: 16px;
      font-weight: 500;
    }

    .full-width {
      width: 100%;
    }

    .empresa-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px 0;
    }

    .empresa-principal {
      font-size: 14px;
    }

    .empresa-secundaria {
      font-size: 12px;
      color: #666;
    }

    .empresa-seleccionada-card {
      background: #e3f2fd;
      border: 1px solid #1976d2;
    }

    .empresa-seleccionada-info h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 14px;
      font-weight: 500;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .resoluciones-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .rutas-info-card {
      background: #e3f2fd;
      border: 1px solid #2196f3;
      margin-top: 16px;
    }

    .rutas-info-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .info-icon {
      color: #2196f3;
      flex-shrink: 0;
    }

    .rutas-info-text h4 {
      margin: 0 0 8px 0;
      color: #2196f3;
      font-size: 14px;
      font-weight: 600;
    }

    .rutas-info-text p {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 13px;
    }

    .rutas-info-text ul {
      margin: 0 0 8px 0;
      padding-left: 16px;
      color: #666;
      font-size: 13px;
    }

    .rutas-info-text li {
      margin-bottom: 4px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item .label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .info-item .value {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }

    .advertencia-card {
      background: #fff3e0;
      border: 1px solid #f57c00;
      margin-top: 16px;
    }

    .advertencia-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .warning-icon {
      color: #f57c00;
      flex-shrink: 0;
    }

    .advertencia-text h4 {
      margin: 0 0 8px 0;
      color: #f57c00;
      font-size: 14px;
      font-weight: 600;
    }

    .advertencia-text ul {
      margin: 0;
      padding-left: 16px;
      color: #666;
      font-size: 13px;
    }

    .advertencia-text li {
      margin-bottom: 4px;
    }

    .modal-actions {
      padding: 16px 24px 24px 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .modal-actions button {
      min-width: 120px;
    }

    /* Scrollbar personalizado */
    .modal-content::-webkit-scrollbar {
      width: 6px;
    }

    .modal-content::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .modal-content::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .modal-content::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .transferir-empresa-modal {
        max-width: 100%;
      }

      .modal-header {
        padding: 16px 16px 0 16px;
      }

      .modal-content {
        padding: 0 16px;
      }

      .modal-actions {
        padding: 16px;
        flex-direction: column;
      }

      .modal-actions button {
        width: 100%;
      }

      .vehiculo-info {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .resoluciones-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TransferirEmpresaModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<TransferirEmpresaModalComponent>);
  public data = inject<TransferirEmpresaData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  private historialService = inject(HistorialVehicularService);

  // Signals
  procesando = signal(false);
  cargandoEmpresas = signal(false);
  cargandoResoluciones = signal(false);
  empresas = signal<Empresa[]>([]);
  resoluciones = signal<Resolucion[]>([]);
  empresaActual = signal<Empresa | null>(null);

  // Computed
  empresasDisponibles = computed(() => {
    // Filtrar la empresa actual para que no aparezca en la lista
    const todasEmpresas = this.empresas();
    const empresaActualId = this.data.vehiculo.empresaActualId;
    
    return todasEmpresas.filter((empresa: any) => 
      empresa.id !== empresaActualId && 
      empresa.estaActivo === true
    );
  });

  empresaSeleccionada = computed(() => {
    const empresaId = this.transferirForm.get('empresaDestinoId')?.value;
    const empresasDisponibles = this.empresasDisponibles();
    
    // Intentar búsqueda con comparación estricta primero
    let empresa = empresasDisponibles.find((empresa: any) => empresa.id === empresaId);
    
    // Si no se encuentra, intentar comparación con conversión a string
    if (!empresa && empresaId) {
      empresa = empresasDisponibles.find((empresa: any) => String(empresa.id) === String(empresaId));
    }
    
    return empresa || null;
  });

  resolucionesPadre = computed(() => {
    // Solo mostrar resoluciones padre activas
    return this.resoluciones().filter((resolucion: any) => 
      resolucion.tipoResolucion === 'PADRE' &&
      resolucion.estaActivo === true
    );
  });

  resolucionesHijas = computed(() => {
    const resolucionPadreId = this.transferirForm.get('resolucionPadreId')?.value;
    if (!resolucionPadreId) return [];
    
    // Solo mostrar resoluciones hijas de la resolución padre seleccionada
    return this.resoluciones().filter((resolucion: any) => 
      resolucion.resolucionPadreId === resolucionPadreId && 
      resolucion.tipoResolucion === 'HIJO' &&
      resolucion.estaActivo === true
    );
  });

  // Formulario
  transferirForm: FormGroup = this.fb.group({
    empresaDestinoId: ['', [Validators.required]],
    resolucionPadreId: [''],
    resolucionHijaId: [''],
    motivo: ['', [Validators.required, Validators.minLength(10)]],
    observaciones: ['']
  });

  ngOnInit(): void {
    this.cargarEmpresas();
    this.cargarEmpresaActual();
    this.configurarFormulario();
  }

  private configurarFormulario(): void {
    // Limpiar resolución hija cuando cambie la resolución padre
    this.transferirForm.get('resolucionPadreId')?.valueChanges.subscribe((resolucionPadreId: any) => {
      const resolucionHijaControl = this.transferirForm.get('resolucionHijaId');
      resolucionHijaControl?.setValue('');
      
      // Habilitar/deshabilitar resolución hija basado en si hay resolución padre
      if (resolucionPadreId) {
        resolucionHijaControl?.enable();
      } else {
        resolucionHijaControl?.disable();
      }
    });

    // Cargar resoluciones cuando cambie la empresa
    this.transferirForm.get('empresaDestinoId')?.valueChanges.subscribe((empresaId: any) => {
      this.transferirForm.get('resolucionPadreId')?.setValue('');
      this.transferirForm.get('resolucionHijaId')?.setValue('');
      
      // Deshabilitar resolución hija inicialmente
      this.transferirForm.get('resolucionHijaId')?.disable();
      
      if (empresaId) {
        this.cargarResolucionesPorEmpresa(empresaId);
      }
    });

    // Inicializar estado disabled de resolución hija
    this.transferirForm.get('resolucionHijaId')?.disable();
  }

  private async cargarResolucionesPorEmpresa(empresaId: string): Promise<void> {
    this.cargandoResoluciones.set(true);
    
    try {
      // Cargar resoluciones específicas de la empresa
      const resoluciones = await this.resolucionService.getResolucionesPorEmpresa(empresaId).toPromise();
      this.resoluciones.set(resoluciones || []);
    } catch (error) {
      console.error('Error cargando resoluciones de la empresa::', error);
      // Fallback: cargar todas las resoluciones y filtrar
      try {
        const todasResoluciones = await this.resolucionService.getResoluciones().toPromise();
        const resolucionesFiltradas = (todasResoluciones || []).filter((r: any) => r.empresaId === empresaId);
        this.resoluciones.set(resolucionesFiltradas);
      } catch (fallbackError) {
        console.error('Error en fallback::', fallbackError);
        this.snackBar.open('Error al cargar las resoluciones', 'Cerrar', { duration: 3000 });
      }
    } finally {
      this.cargandoResoluciones.set(false);
    }
  }

  private async cargarEmpresas(): Promise<void> {
    this.cargandoEmpresas.set(true);
    
    try {
      const empresas = await this.empresaService.getEmpresas().toPromise();
      this.empresas.set(empresas || []);
    } catch (error) {
      console.error('Error cargando empresas::', error);
      this.snackBar.open('Error al cargar las empresas', 'Cerrar', { duration: 3000 });
    } finally {
      this.cargandoEmpresas.set(false);
    }
  }

  private async cargarEmpresaActual(): Promise<void> {
    if (!this.data.vehiculo.empresaActualId) return;

    try {
      const empresa = await this.empresaService.getEmpresa(this.data.vehiculo.empresaActualId).toPromise();
      this.empresaActual.set(empresa || null);
    } catch (error) {
      console.error('Error cargando empresa actual::', error);
    }
  }

  async confirmarTransferencia(): Promise<void> {
    if (!this.transferirForm.valid) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.procesando.set(true);

    try {
      const formData = this.transferirForm.value;
      const empresaDestino = this.empresaSeleccionada();
      
      // Búsqueda de respaldo si el computed falla
      let empresaFinal = empresaDestino;
      if (!empresaDestino) {
        const empresasDisponiblesArray = this.empresasDisponibles();
        empresaFinal = empresasDisponiblesArray.find((empresa: any) => empresa.id === formData.empresaDestinoId) || null;
      }

      if (!empresaFinal) {
        throw new Error('Empresa destino no encontrada');
      }

      // 1. Actualizar el vehículo con la nueva empresa y limpiar rutas
      const vehiculoActualizado = {
        ...this.data.vehiculo,
        empresaActualId: formData.empresaDestinoId,
        resolucionId: formData.resolucionHijaId || formData.resolucionPadreId || '',
        rutasAsignadasIds: [], // Limpiar rutas generales
        rutasEspecificas: [] // Limpiar rutas específicas
      };

      await this.vehiculoService.updateVehiculo(this.data.vehiculo.id!, vehiculoActualizado).toPromise();

      // 2. Registrar en el historial vehicular
      await this.historialService.crearRegistroHistorial({
        vehiculoId: this.data.vehiculo.id!,
        placa: this.data.vehiculo.placa,
        tipoEvento: TipoEventoHistorial.TRANSFERENCIA_EMPRESA,
        descripcion: `Vehículo ${this.data.vehiculo.placa} transferido de ${this.empresaActual()?.razonSocial?.principal || 'empresa anterior'} a ${empresaFinal.razonSocial?.principal}`,
        empresaAnteriorId: this.data.vehiculo.empresaActualId,
        empresaNuevaId: formData.empresaDestinoId,
        resolucionAnteriorId: this.data.vehiculo.resolucionId,
        resolucionNuevaId: formData.resolucionHijaId || formData.resolucionPadreId || '',
        observaciones: `${formData.motivo}${formData.observaciones ? '. ' + formData.observaciones : ''}`,
        datosAnteriores: {
          empresaId: this.data.vehiculo.empresaActualId,
          empresaNombre: this.empresaActual()?.razonSocial?.principal,
          resolucionId: this.data.vehiculo.resolucionId,
          rutasAsignadas: this.data.vehiculo.rutasAsignadasIds.length || 0,
          rutasEspecificas: this.data.vehiculo.rutasEspecificas?.length || 0
        },
        datosNuevos: {
          empresaId: formData.empresaDestinoId,
          empresaNombre: empresaFinal.razonSocial?.principal,
          resolucionId: formData.resolucionHijaId || formData.resolucionPadreId || '',
          rutasAsignadas: 0,
          rutasEspecificas: 0
        }
      }).toPromise();

      this.snackBar.open(
        `Vehículo ${this.data.vehiculo.placa} transferido exitosamente a ${empresaFinal.razonSocial?.principal}`, 
        'Cerrar', 
        { duration: 5000 }
      );

      this.dialogRef.close({
        success: true,
        vehiculoActualizado,
        empresaDestino
      });

    } catch (error) {
      console.error('Error en la transferencia::', error);
      this.snackBar.open('Error al transferir el vehículo. Intente nuevamente.', 'Cerrar', { duration: 3000 });
    } finally {
      this.procesando.set(false);
    }
  }
}