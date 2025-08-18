import { Component, inject, signal, computed, ViewEncapsulation, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { RutaService } from '../../services/ruta.service';
import { Vehiculo, VehiculoCreate, VehiculoUpdate, DatosTecnicos } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Ruta } from '../../models/ruta.model';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface VehiculoModalData {
  empresaId?: string;
  resolucionId?: string;
  vehiculo?: Vehiculo; // Para modo edición
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-vehiculo-modal',
  standalone: true,
  encapsulation: ViewEncapsulation.Emulated,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatExpansionModule,
    MatDialogModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatTooltipModule
  ],
  template: `
    <div class="vehiculo-modal">
      <!-- Header del modal -->
      <div class="modal-header">
        <div class="header-content">
          <div class="header-title">
            <mat-icon class="header-icon">{{ isEditing() ? 'edit' : 'add_circle' }}</mat-icon>
            <h2>{{ isEditing() ? 'Editar Vehículo' : 'Nuevo Vehículo' }}</h2>
          </div>
          <p class="header-subtitle">
            {{ isEditing() ? 'Modifica la información del vehículo' : 'Registra un nuevo vehículo en el sistema' }}
          </p>
        </div>
        <button mat-icon-button (click)="close()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <div class="loading-content">
            <mat-spinner diameter="60" class="loading-spinner"></mat-spinner>
            <h3>Cargando información...</h3>
            <p>{{ isEditing() ? 'Obteniendo datos del vehículo' : 'Preparando formulario' }}</p>
          </div>
        </div>
      }

      <!-- Form -->
      @if (!isLoading()) {
        <div class="form-container">
          <form [formGroup]="vehiculoForm" (ngSubmit)="onSubmit()" class="vehiculo-form">
            
            <!-- Información de la Empresa -->
            <mat-card class="form-card">
              <mat-card-header class="card-header">
                <div class="card-header-content">
                  <mat-icon class="card-icon">business</mat-icon>
                  <mat-card-title class="card-title">
                    Información de la Empresa
                  </mat-card-title>
                  <mat-card-subtitle class="card-subtitle">
                    Empresa propietaria del vehículo
                  </mat-card-subtitle>
                </div>
              </mat-card-header>
              <mat-card-content class="card-content">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Empresa Actual *</mat-label>
                    <input matInput 
                           [matAutocomplete]="empresaAuto" 
                           [formControl]="empresaControl"
                           placeholder="Buscar empresa por RUC o razón social"
                           required>
                    <mat-autocomplete #empresaAuto="matAutocomplete" 
                                     [displayWith]="displayEmpresa"
                                     (optionSelected)="onEmpresaSelected($event)">
                      @for (empresa of empresasFiltradas | async; track empresa.id) {
                        <mat-option [value]="empresa">
                          {{ empresa.ruc }} - {{ empresa.razonSocial.principal || 'Sin razón social' }}
                        </mat-option>
                      }
                    </mat-autocomplete>
                    <mat-icon matSuffix>business</mat-icon>
                    <button matSuffix mat-icon-button 
                            type="button" 
                            (click)="limpiarEmpresa()"
                            *ngIf="empresaControl.value"
                            matTooltip="Limpiar empresa">
                      <mat-icon>clear</mat-icon>
                    </button>
                    <mat-hint>Empresa propietaria del vehículo</mat-hint>
                    <mat-error *ngIf="empresaControl.hasError('required')">
                      La empresa es obligatoria
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Resolución *</mat-label>
                    <mat-select formControlName="resolucionId" (selectionChange)="onResolucionChange()" required>
                      <mat-option value="">Selecciona una resolución</mat-option>
                      @for (resolucion of resoluciones(); track resolucion.id) {
                        <mat-option [value]="resolucion.id">
                          {{ resolucion.nroResolucion }} - {{ resolucion.tipoTramite }}
                          <span class="resolucion-tipo-badge" [class]="'tipo-' + (resolucion.tipoTramite === 'PRIMIGENIA' ? 'primigenia' : 'hija')">
                            {{ resolucion.tipoTramite === 'PRIMIGENIA' ? 'PRIMIGENIA' : 'HIJA' }}
                          </span>
                        </mat-option>
                      }
                    </mat-select>
                    <mat-icon matSuffix>description</mat-icon>
                    <mat-hint>Resolución asociada al vehículo (primigenia o hija)</mat-hint>
                    <mat-error *ngIf="vehiculoForm.get('resolucionId')?.hasError('required')">
                      La resolución es obligatoria
                    </mat-error>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Información del Vehículo -->
            <mat-card class="form-card">
              <mat-card-header class="card-header">
                <div class="card-header-content">
                  <mat-icon class="card-icon">directions_car</mat-icon>
                  <mat-card-title class="card-title">
                    Información del Vehículo
                  </mat-card-title>
                  <mat-card-subtitle class="card-subtitle">
                    Datos básicos del vehículo
                  </mat-card-subtitle>
                </div>
              </mat-card-header>
              <mat-card-content class="card-content">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Placa *</mat-label>
                    <input matInput formControlName="placa" placeholder="Ej: ABC-123" (input)="convertirAMayusculas($event, 'placa')" required>
                    <mat-icon matSuffix>directions_car</mat-icon>
                    <mat-hint>Formato: XXX-000 (3 letras, guión, 3-4 números)</mat-hint>
                    <mat-error *ngIf="vehiculoForm.get('placa')?.hasError('required')">
                      La placa es obligatoria
                    </mat-error>
                    <mat-error *ngIf="vehiculoForm.get('placa')?.hasError('pattern')">
                      Formato de placa inválido
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Marca</mat-label>
                    <input matInput formControlName="marca" placeholder="Ej: Toyota, Mercedes, etc." (input)="convertirAMayusculas($event, 'marca')">
                    <mat-icon matSuffix>branding_watermark</mat-icon>
                    <mat-hint>Marca del vehículo</mat-hint>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Modelo</mat-label>
                    <input matInput formControlName="modelo" placeholder="Ej: Corolla, Sprinter, etc." (input)="convertirAMayusculas($event, 'modelo')">
                    <mat-icon matSuffix>model_training</mat-icon>
                    <mat-hint>Modelo del vehículo</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Categoría</mat-label>
                    <mat-select formControlName="categoria">
                      <mat-option value="M1">M1 - Vehículo de pasajeros</mat-option>
                      <mat-option value="M2">M2 - Vehículo de pasajeros</mat-option>
                      <mat-option value="M3">M3 - Vehículo de pasajeros</mat-option>
                      <mat-option value="N1">N1 - Vehículo de carga</mat-option>
                      <mat-option value="N2">N2 - Vehículo de carga</mat-option>
                      <mat-option value="N3">N3 - Vehículo de carga</mat-option>
                    </mat-select>
                    <mat-icon matSuffix>category</mat-icon>
                    <mat-hint>Categoría del vehículo según normativa</mat-hint>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Año de Fabricación *</mat-label>
                    <input matInput formControlName="anioFabricacion" type="number" placeholder="Ej: 2020" required>
                    <mat-icon matSuffix>calendar_today</mat-icon>
                    <mat-hint>Año de fabricación del vehículo</mat-hint>
                    <mat-error *ngIf="vehiculoForm.get('anioFabricacion')?.hasError('required')">
                      El año es obligatorio
                    </mat-error>
                    <mat-error *ngIf="vehiculoForm.get('anioFabricacion')?.hasError('min') || vehiculoForm.get('anioFabricacion')?.hasError('max')">
                      Año inválido
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Número de Asientos</mat-label>
                    <input matInput formControlName="asientos" type="number" placeholder="Ej: 45">
                    <mat-icon matSuffix>airline_seat_recline_normal</mat-icon>
                    <mat-hint>Número de asientos disponibles</mat-hint>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Número de TUC</mat-label>
                    <input matInput formControlName="numeroTuc" placeholder="Ej: T-123456-2025" (input)="convertirAMayusculas($event, 'numeroTuc')">
                    <mat-icon matSuffix>receipt</mat-icon>
                    <mat-hint>Número del TUC del vehículo</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Estado</mat-label>
                    <mat-select formControlName="estado">
                      <mat-option value="ACTIVO">ACTIVO</mat-option>
                      <mat-option value="INACTIVO">INACTIVO</mat-option>
                      <mat-option value="MANTENIMIENTO">MANTENIMIENTO</mat-option>
                      <mat-option value="SUSPENDIDO">SUSPENDIDO</mat-option>
                    </mat-select>
                    <mat-icon matSuffix>check_circle</mat-icon>
                    <mat-hint>Estado actual del vehículo</mat-hint>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Especificaciones Técnicas -->
            <mat-card class="form-card">
              <mat-card-header class="card-header">
                <div class="card-header-content">
                  <mat-icon class="card-icon">build</mat-icon>
                  <mat-card-title class="card-title">
                    Especificaciones Técnicas
                  </mat-card-title>
                  <mat-card-subtitle class="card-subtitle">
                    Datos técnicos del vehículo
                  </mat-card-subtitle>
                </div>
              </mat-card-header>
              <mat-card-content class="card-content">
                <div formGroupName="datosTecnicos">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Motor</mat-label>
                      <input matInput formControlName="motor" placeholder="Ej: 2.0L, 4 cilindros">
                      <mat-icon matSuffix>settings</mat-icon>
                      <mat-hint>Especificaciones del motor</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Chasis</mat-label>
                      <input matInput formControlName="chasis" placeholder="Número de chasis">
                      <mat-icon matSuffix>fingerprint</mat-icon>
                      <mat-hint>Número de chasis del vehículo</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Cilindros</mat-label>
                      <input matInput formControlName="cilindros" placeholder="Ej: 4, 6, 8">
                      <mat-icon matSuffix>tune</mat-icon>
                      <mat-hint>Número de cilindros</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Ejes</mat-label>
                      <input matInput formControlName="ejes" placeholder="Ej: 2, 3, 4">
                      <mat-icon matSuffix>straighten</mat-icon>
                      <mat-hint>Número de ejes</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Ruedas</mat-label>
                      <input matInput formControlName="ruedas" placeholder="Ej: 6, 8, 10">
                      <mat-icon matSuffix>tire_repair</mat-icon>
                      <mat-hint>Número de ruedas</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Peso Neto (kg)</mat-label>
                      <input matInput formControlName="pesoNeto" type="number" placeholder="Ej: 5000">
                      <mat-icon matSuffix>scale</mat-icon>
                      <mat-hint>Peso neto del vehículo</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Peso Bruto (kg)</mat-label>
                      <input matInput formControlName="pesoBruto" type="number" placeholder="Ej: 8000">
                      <mat-icon matSuffix>scale</mat-icon>
                      <mat-hint>Peso bruto del vehículo</mat-hint>
                    </mat-form-field>
                  </div>

                  <!-- Medidas -->
                  <div formGroupName="medidas">
                    <h4>Medidas del Vehículo</h4>
                    <div class="form-row">
                      <mat-form-field appearance="outline" class="form-field">
                        <mat-label>Largo (m)</mat-label>
                        <input matInput formControlName="largo" type="number" step="0.1" placeholder="Ej: 12.5">
                        <mat-icon matSuffix>straighten</mat-icon>
                        <mat-hint>Largo del vehículo en metros</mat-hint>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="form-field">
                        <mat-label>Ancho (m)</mat-label>
                        <input matInput formControlName="ancho" type="number" step="0.1" placeholder="Ej: 2.5">
                        <mat-icon matSuffix>straighten</mat-icon>
                        <mat-hint>Ancho del vehículo en metros</mat-hint>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="form-field">
                        <mat-label>Alto (m)</mat-label>
                        <input matInput formControlName="alto" type="number" step="0.1" placeholder="Ej: 3.2">
                        <mat-icon matSuffix>straighten</mat-icon>
                        <mat-hint>Alto del vehículo en metros</mat-hint>
                      </mat-form-field>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Rutas Asignadas -->
            <mat-card class="form-card">
              <mat-card-header class="card-header">
                <div class="card-header-content">
                  <mat-icon class="card-icon">route</mat-icon>
                  <mat-card-title class="card-title">
                    Rutas Asignadas
                  </mat-card-title>
                  <mat-card-subtitle class="card-subtitle">
                    Rutas que puede operar este vehículo
                  </mat-card-subtitle>
                </div>
              </mat-card-header>
              <mat-card-content class="card-content">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field full-width">
                    <mat-label>Rutas Asignadas *</mat-label>
                    <mat-select formControlName="rutasAsignadasIds" multiple [disabled]="!puedeSeleccionarRutas()">
                      @if (rutasDisponibles().length > 0) {
                        @for (ruta of rutasDisponibles(); track ruta.id) {
                          <mat-option [value]="ruta.id">
                            {{ ruta.codigoRuta }} - {{ ruta.origen }} → {{ ruta.destino }}
                            <span class="ruta-info-badge">
                              {{ ruta.tipoRuta }} | {{ ruta.frecuencias }}
                            </span>
                          </mat-option>
                        }
                      } @else {
                        <mat-option value="" disabled>
                          No hay rutas disponibles en esta resolución
                        </mat-option>
                      }
                    </mat-select>
                    <mat-icon matSuffix>route</mat-icon>
                    <mat-hint>{{ getRutasHint() }}</mat-hint>
                    <mat-error *ngIf="vehiculoForm.get('rutasAsignadasIds')?.hasError('required')">
                      Debe seleccionar al menos una ruta
                    </mat-error>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>
          </form>
        </div>
      }

      <!-- Footer del modal con botones de acción -->
      <div class="modal-footer">
        <div class="footer-actions">
          <button mat-stroked-button (click)="close()" class="cancel-button">
            <mat-icon>cancel</mat-icon>
            Cancelar
          </button>
          <button mat-raised-button 
                  color="primary" 
                  (click)="onSubmit()" 
                  [disabled]="!vehiculoForm.valid || isSubmitting()"
                  class="submit-button">
            <mat-icon>{{ isEditing() ? 'save' : 'add' }}</mat-icon>
            <span *ngIf="!isSubmitting()">{{ isEditing() ? 'Guardar Cambios' : 'Crear Vehículo' }}</span>
            <span *ngIf="isSubmitting()">Procesando...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vehiculo-modal {
      max-width: 900px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 0;
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
      flex: 1;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .header-icon {
      color: #1976d2;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .header-title h2 {
      margin: 0;
      color: #1976d2;
      font-size: 24px;
      font-weight: 500;
    }

    .header-subtitle {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .close-button {
      color: #666;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 60px 24px;
    }

    .loading-content {
      text-align: center;
    }

    .loading-spinner {
      margin-bottom: 16px;
    }

    .form-container {
      padding: 0 24px;
    }

    .form-card {
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .card-header {
      background: #f5f5f5;
      padding: 16px;
      margin: -16px -16px 16px -16px;
    }

    .card-header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .card-icon {
      color: #1976d2;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .card-title {
      margin: 0;
      color: #1976d2;
      font-size: 18px;
      font-weight: 500;
    }

    .card-subtitle {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .card-content {
      padding: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-field {
      width: 100%;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .resolucion-tipo-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
      margin-left: 8px;
    }

    .tipo-primigenia {
      background: #e3f2fd;
      color: #1976d2;
    }

    .tipo-hija {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .ruta-info-badge {
      display: block;
      font-size: 11px;
      color: #666;
      margin-top: 2px;
    }

    .modal-footer {
      padding: 24px;
      border-top: 1px solid #e0e0e0;
      background: #fafafa;
      margin-top: 24px;
    }

    .footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
    }

    .cancel-button {
      color: #666;
    }

    .submit-button {
      min-width: 160px;
    }

    @media (max-width: 768px) {
      .vehiculo-modal {
        max-width: 100%;
        max-height: 100vh;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .modal-header {
        padding: 16px 16px 0 16px;
      }

      .form-container {
        padding: 0 16px;
      }

      .modal-footer {
        padding: 16px;
      }
    }
  `]
})
export class VehiculoModalComponent {
  // Propiedades de entrada
  modalData = input<VehiculoModalData>();
  
  // Datos del dialog (alternativa a input)
  dialogData = inject(MAT_DIALOG_DATA);
  
  // Eventos de salida
  vehiculoCreated = output<VehiculoCreate>();
  vehiculoUpdated = output<VehiculoUpdate>();
  modalClosed = output<void>();

  // Servicios
  private fb = inject(FormBuilder);
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  private rutaService = inject(RutaService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef);

  // Estado del componente
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditing = computed(() => {
    const data = this.modalData() || this.dialogData;
    return data?.mode === 'edit';
  });
  
  // Datos de referencia
  empresas = signal<Empresa[]>([]);
  resoluciones = signal<Resolucion[]>([]);
  rutasDisponibles = signal<Ruta[]>([]);
  
  // Autocompletado para empresas
  empresasFiltradas!: Observable<Empresa[]>;
  
  // Formulario
  vehiculoForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
    this.loadEmpresas();
    
    // Usar effect para reaccionar a cambios en modalData o usar dialogData
    effect(() => {
      const data = this.modalData() || this.dialogData;
      if (data && this.vehiculoForm) {
        this.initializeModalData();
      }
    });
  }

  private initializeModalData(): void {
    const data = this.modalData() || this.dialogData;
    if (!data) return;
    
    if (this.isEditing()) {
      this.loadVehiculo();
    } else {
      // En modo creación, pre-configurar empresa y resolución si se proporcionan
      if (data.empresaId) {
        this.vehiculoForm.patchValue({
          empresaActualId: data.empresaId
        });
        
        // Cargar resoluciones y rutas si ya hay empresa y resolución
        this.loadResoluciones(data.empresaId);
        if (data.resolucionId) {
          this.vehiculoForm.patchValue({ resolucionId: data.resolucionId });
          this.loadRutasDisponibles(data.resolucionId);
        }
      }
    }
  }

  // Getters para los controles del formulario
  get empresaControl(): FormControl {
    return this.vehiculoForm.get('empresaActualId') as FormControl;
  }

  private initializeForm(): void {
    this.vehiculoForm = this.fb.group({
      empresaActualId: ['', Validators.required],
      resolucionId: [{ value: '', disabled: true }, Validators.required],
      numeroTuc: [''],
      rutasAsignadasIds: [[], Validators.required],
      placa: ['', [Validators.required, Validators.pattern(/^[A-Z]{1,3}-\d{3,4}$/)]],
      marca: [''],
      modelo: [''],
      categoria: ['M3'],
      asientos: [''],
      anioFabricacion: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      estado: ['ACTIVO'],
      datosTecnicos: this.fb.group({
        motor: [''],
        chasis: [''],
        cilindros: [''],
        ejes: [''],
        ruedas: [''],
        pesoNeto: [''],
        pesoBruto: [''],
        medidas: this.fb.group({
          largo: [''],
          ancho: [''],
          alto: ['']
        })
      })
    });
  }

  private loadEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        this.empresas.set(empresas.filter(e => e.estado === 'HABILITADA'));
        // Configurar autocompletado después de cargar empresas
        setTimeout(() => this.configurarAutocompletado(), 0);
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
        this.snackBar.open('Error al cargar empresas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private configurarAutocompletado(): void {
    // Solo configurar si el formulario está inicializado
    if (this.vehiculoForm && this.empresaControl) {
      // Autocompletado para empresas
      this.empresasFiltradas = this.empresaControl.valueChanges.pipe(
        startWith(''),
        map(value => this.filtrarEmpresas(value))
      );

      // Escuchar cambios en el control de empresa para habilitar/deshabilitar resolución
      this.empresaControl.valueChanges.subscribe(value => {
        if (!value || value === '') {
          // Si no hay empresa seleccionada, deshabilitar resolución
          this.vehiculoForm.get('resolucionId')?.disable();
        } else {
          // Si hay empresa seleccionada, habilitar resolución
          this.vehiculoForm.get('resolucionId')?.enable();
        }
      });
    }
  }

  private filtrarEmpresas(value: any): Empresa[] {
    if (!value) return this.empresas();
    
    // Si el valor es un objeto Empresa, extraer el texto para filtrar
    let filterValue = '';
    if (typeof value === 'string') {
      filterValue = value.toLowerCase();
    } else if (value && typeof value === 'object') {
      filterValue = (value.razonSocial?.principal?.toLowerCase() || value.ruc?.toLowerCase() || '');
    }
    
    return this.empresas().filter(empresa => {
      const rucMatch = empresa.ruc.toLowerCase().includes(filterValue);
      const razonSocialMatch = empresa.razonSocial?.principal?.toLowerCase().includes(filterValue) || false;
      return rucMatch || razonSocialMatch;
    });
  }

  // Método para mostrar la empresa en el input (arrow function para preservar `this`)
  displayEmpresa = (empresa: Empresa | string | null | undefined): string => {
    if (!empresa) return '';
    
    // Si es un string (ID), buscar la empresa en la lista
    if (typeof empresa === 'string') {
      const empresaEncontrada = this.empresas().find(e => e.id === empresa);
      if (empresaEncontrada) {
        empresa = empresaEncontrada;
      } else {
        return 'Empresa no encontrada';
      }
    }
    
    // Verificar que razonSocial existe y tiene la propiedad principal
    if (empresa.razonSocial && empresa.razonSocial.principal) {
      return `${empresa.ruc} - ${empresa.razonSocial.principal}`;
    } else if (empresa.razonSocial) {
      return `${empresa.ruc} - Sin razón social`;
    } else {
      return `${empresa.ruc} - Sin información de razón social`;
    }
  }

  // Método para manejar la selección de empresa
  onEmpresaSelected(event: any): void {
    const empresa = event.option.value;
    if (empresa && empresa.id) {
      // Establecer el objeto empresa completo en el control
      this.empresaControl.setValue(empresa);
      // También actualizar el valor del formulario con el ID
      this.vehiculoForm.patchValue({ empresaActualId: empresa.id });
      
      // Habilitar el campo de resolución
      this.vehiculoForm.get('resolucionId')?.enable();
      
      this.onEmpresaChange();
    }
  }

  private onEmpresaChange(): void {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    if (empresaId) {
      this.loadResoluciones(empresaId);
      // Limpiar resolución seleccionada
      this.vehiculoForm.patchValue({ resolucionId: '' });
    } else {
      this.resoluciones.set([]);
      this.rutasDisponibles.set([]);
    }
  }

  onResolucionChange(): void {
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    if (resolucionId) {
      this.loadRutasDisponibles(resolucionId);
    } else {
      this.rutasDisponibles.set([]);
    }
  }

  private loadResoluciones(empresaId: string): void {
    if (!empresaId) return;
    
    this.resolucionService.getResoluciones().subscribe({
      next: (resoluciones) => {
        // Filtrar resoluciones de la empresa seleccionada
        const resolucionesEmpresa = resoluciones.filter(r => r.empresaId === empresaId);
        this.resoluciones.set(resolucionesEmpresa);
        
        // Si no hay resolución seleccionada, limpiar el campo
        if (!this.vehiculoForm.get('resolucionId')?.value) {
          this.vehiculoForm.patchValue({ resolucionId: '' });
        }
      },
      error: (error) => {
        console.error('Error cargando resoluciones:', error);
        this.snackBar.open('Error al cargar resoluciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private loadRutasDisponibles(resolucionId: string): void {
    if (!resolucionId) return;
    
    this.rutaService.getRutas().subscribe({
      next: (rutas) => {
        // Filtrar rutas de la resolución seleccionada
        const rutasResolucion = rutas.filter(r => r.resolucionId === resolucionId);
        this.rutasDisponibles.set(rutasResolucion);
      },
      error: (error) => {
        console.error('Error cargando rutas:', error);
        this.snackBar.open('Error al cargar rutas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private loadVehiculo(): void {
    const data = this.modalData() || this.dialogData;
    const vehiculo = data?.vehiculo;
    if (vehiculo) {
      this.isLoading.set(true);

      // Cargar datos del vehículo
      this.vehiculoForm.patchValue({
        empresaActualId: vehiculo.empresaActualId,
        resolucionId: vehiculo.resolucionId,
        numeroTuc: vehiculo.tuc?.nroTuc || '',
        rutasAsignadasIds: vehiculo.rutasAsignadasIds || [],
        placa: vehiculo.placa,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        categoria: vehiculo.categoria,
        anioFabricacion: vehiculo.anioFabricacion,
        estado: vehiculo.estado,
        datosTecnicos: {
          motor: vehiculo.datosTecnicos?.motor || '',
          chasis: vehiculo.datosTecnicos?.chasis || '',
          cilindros: vehiculo.datosTecnicos?.cilindros || '',
          ejes: vehiculo.datosTecnicos?.ejes || '',
          ruedas: vehiculo.datosTecnicos?.ruedas || '',
          pesoNeto: vehiculo.datosTecnicos?.pesoNeto || '',
          pesoBruto: vehiculo.datosTecnicos?.pesoBruto || '',
          medidas: {
            largo: vehiculo.datosTecnicos?.medidas?.largo || '',
            ancho: vehiculo.datosTecnicos?.medidas?.ancho || '',
            alto: vehiculo.datosTecnicos?.medidas?.alto || ''
          }
        }
      });

      // Cargar resoluciones y rutas para este vehículo
      this.loadResoluciones(vehiculo.empresaActualId);
      this.loadRutasDisponibles(vehiculo.resolucionId);
      
      this.isLoading.set(false);
    }
  }

  // Método para limpiar el campo de empresa
  limpiarEmpresa(): void {
    this.empresaControl.setValue('');
    this.vehiculoForm.patchValue({ empresaActualId: '' });
    
    // Limpiar resoluciones y rutas
    this.resoluciones.set([]);
    this.rutasDisponibles.set([]);
    
    // Limpiar y deshabilitar campo de resolución
    this.vehiculoForm.patchValue({ resolucionId: '' });
    this.vehiculoForm.get('resolucionId')?.disable();
  }

  // Métodos de utilidad
  puedeSeleccionarRutas(): boolean {
    return this.vehiculoForm.get('empresaActualId')?.value && 
           this.vehiculoForm.get('resolucionId')?.value;
  }

  getRutasHint(): string {
    if (!this.vehiculoForm.get('empresaActualId')?.value) {
      return 'Primero selecciona una empresa';
    }
    if (!this.vehiculoForm.get('resolucionId')?.value) {
      return 'Luego selecciona una resolución';
    }
    return 'Selecciona las rutas que puede operar este vehículo';
  }

  convertirAMayusculas(event: any, controlName: string): void {
    const input = event.target;
    const value = input.value.toUpperCase();
    this.vehiculoForm.patchValue({ [controlName]: value });
  }

  onSubmit(): void {
    if (this.vehiculoForm.valid) {
      this.isSubmitting.set(true);
      const formValue = this.vehiculoForm.value;

      if (this.isEditing()) {
        // Modo edición
        const vehiculoUpdate: VehiculoUpdate = {
          placa: formValue.placa,
          marca: formValue.marca,
          modelo: formValue.modelo,
          categoria: formValue.categoria,
          anioFabricacion: formValue.anioFabricacion,
          empresaActualId: formValue.empresaActualId,
          resolucionId: formValue.resolucionId,
          rutasAsignadasIds: formValue.rutasAsignadasIds || [],
          tuc: formValue.numeroTuc ? {
            nroTuc: formValue.numeroTuc,
            fechaEmision: new Date().toISOString()
          } : undefined,
          datosTecnicos: {
            ...formValue.datosTecnicos,
            asientos: formValue.asientos
          }
        };

        this.vehiculoUpdated.emit(vehiculoUpdate);
      } else {
        // Modo creación
        const vehiculoCreate: VehiculoCreate = {
          placa: formValue.placa,
          marca: formValue.marca,
          modelo: formValue.modelo,
          categoria: formValue.categoria,
          anioFabricacion: formValue.anioFabricacion,
          empresaActualId: formValue.empresaActualId,
          resolucionId: formValue.resolucionId,
          rutasAsignadasIds: formValue.rutasAsignadasIds || [],
          tuc: formValue.numeroTuc ? {
            nroTuc: formValue.numeroTuc,
            fechaEmision: new Date().toISOString()
          } : undefined,
          datosTecnicos: {
            ...formValue.datosTecnicos,
            asientos: formValue.asientos
          }
        };

        this.vehiculoCreated.emit(vehiculoCreate);
      }

      this.isSubmitting.set(false);
      this.close();
    }
  }

  close(): void {
    this.modalClosed.emit();
    this.dialogRef.close();
  }
} 