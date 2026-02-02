import { Component, inject, signal, computed, ViewEncapsulation, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { EmpresaSelectorComponent } from '../../shared/empresa-selector.component';
import { ResolucionSelectorComponent } from '../../shared/resolucion-selector.component';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { RutaService } from '../../services/ruta.service';
import { ConfiguracionService } from '../../services/configuracion.service';
import { Vehiculo, VehiculoCreate, VehiculoUpdate, DatosTecnicos } from '../../models/vehiculo.model';
import { Empresa, EstadoEmpresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Ruta } from '../../models/ruta.model';
import { Observable, of, forkJoin } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface VehiculoModalData {
  empresaId?: string;
  resolucionId?: string;
  vehiculo?: Vehiculo;
  mode: 'create' | 'edit' | 'batch';
  allowMultiple?: boolean;
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
    MatTooltipModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    SmartIconComponent,
    EmpresaSelectorComponent,
    ResolucionSelectorComponent
  ],
  template: `
    <div class="vehiculo-modal">
      <!-- Header del modal -->
      <div class="modal-header">
        <div class="header-content">
          <div class="header-title">
            <app-smart-icon 
              [iconName]="isEditing() ? 'edit' : 'add_circle'" 
              [size]="32" 
              class="header-icon">
            </app-smart-icon>
            <h2>{{ isEditing() ? 'Editar Vehículo' : 'Agregar Vehículo' }}</h2>
          </div>
          <p class="header-subtitle">
            {{ isEditing() ? 'Modifica la información del vehículo' : 'Completa la información del nuevo vehículo' }}
          </p>
        </div>
        <button mat-icon-button (click)="close()" class="close-button">
          <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
        </button>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando información...</p>
        </div>
      } @else {
        <!-- Formulario -->
        <form [formGroup]="vehiculoForm" (ngSubmit)="onSubmit()" class="vehiculo-form">
          
          <!-- Información Básica -->
          <mat-card class="form-section">
            <mat-card-header>
              <mat-card-title>Información Básica</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Placa</mat-label>
                  <input matInput formControlName="placa" placeholder="Ej: ABC-123">
                  <mat-icon matSuffix>directions_car</mat-icon>
                  @if (vehiculoForm.get('placa')?.hasError('required')) {
                    <mat-error>La placa es obligatoria</mat-error>
                  }
                  @if (vehiculoForm.get('placa')?.hasError('pattern')) {
                    <mat-error>Formato de placa inválido</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Marca</mat-label>
                  <input matInput formControlName="marca" placeholder="Ej: Toyota">
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Modelo</mat-label>
                  <input matInput formControlName="modelo" placeholder="Ej: Hiace">
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Año de Fabricación</mat-label>
                  <input matInput type="number" formControlName="anioFabricacion" 
                         [min]="1990" [max]="getCurrentYear()">
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Color</mat-label>
                  <input matInput formControlName="color" placeholder="Ej: Blanco">
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Datos Técnicos -->
          <mat-card class="form-section">
            <mat-card-header>
              <mat-card-title>Datos Técnicos</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Número de Motor</mat-label>
                  <input matInput formControlName="numeroMotor">
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Número de Chasis</mat-label>
                  <input matInput formControlName="numeroChasis">
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Capacidad de Pasajeros</mat-label>
                  <input matInput type="number" formControlName="capacidadPasajeros" min="1">
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Carrocería</mat-label>
                  <mat-select formControlName="carroceria">
                    <mat-option value="OMNIBUS">Ómnibus</mat-option>
                    <mat-option value="MICROBUS">Microbús</mat-option>
                    <mat-option value="CAMIONETA">Camioneta</mat-option>
                    <mat-option value="STATION_WAGON">Station Wagon</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Información de Registro -->
          <mat-card class="form-section">
            <mat-card-header>
              <mat-card-title>Información de Registro</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Sede de Registro</mat-label>
                  <mat-select formControlName="sedeRegistro" required>
                    @for (sede of sedesDisponibles(); track sede) {
                      <mat-option [value]="sede">{{ formatSedeNombre(sede) }}</mat-option>
                    }
                  </mat-select>
                  @if (vehiculoForm.get('sedeRegistro')?.hasError('required')) {
                    <mat-error>La sede de registro es obligatoria</mat-error>
                  }
                </mat-form-field>
              </div>

              @if (!isEditing()) {
                <div class="form-row">
                  <app-empresa-selector
                    [empresaId]="empresaIdSeleccionada()"
                    (empresaSeleccionada)="onEmpresaChange($event)"
                    class="full-width">
                  </app-empresa-selector>
                </div>

                @if (empresaIdSeleccionada()) {
                  <div class="form-row">
                    <app-resolucion-selector
                      [empresaId]="empresaIdSeleccionada()"
                      [resolucionId]="resolucionIdSeleccionada()"
                      (resolucionSeleccionada)="onResolucionIdChange($event)"
                      class="full-width">
                    </app-resolucion-selector>
                  </div>
                }
              }
            </mat-card-content>
          </mat-card>

          <!-- Botones de acción -->
          <div class="form-actions">
            <button type="button" mat-button (click)="close()">
              Cancelar
            </button>
            <button type="submit" 
                    mat-raised-button 
                    color="primary" 
                    [disabled]="!vehiculoForm.valid || isSubmitting()">
              @if (isSubmitting()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <app-smart-icon [iconName]="isEditing() ? 'save' : 'add'" [size]="20"></app-smart-icon>
              }
              {{ isEditing() ? 'Actualizar' : 'Crear' }} Vehículo
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .vehiculo-modal {
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 24px 16px;
      border-bottom: 1px solid #e0e0e0;
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

    .header-title h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }

    .header-subtitle {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .close-button {
      margin-left: 16px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .vehiculo-form {
      padding: 24px;
    }

    .form-section {
      margin-bottom: 24px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row:last-child {
      margin-bottom: 0;
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      flex: 1;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }

    .form-actions button {
      min-width: 120px;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-title {
      font-size: 18px;
      font-weight: 500;
    }
  `]
})
export class VehiculoModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  private configuracionService = inject(ConfiguracionService);
  private dialogRef = inject(MatDialogRef<VehiculoModalComponent>);
  private dialogData = inject(MAT_DIALOG_DATA) as VehiculoModalData;

  // Signals
  modalData = input<VehiculoModalData>();
  isLoading = signal(false);
  isSubmitting = signal(false);
  empresaIdSeleccionada = signal<string>('');
  resolucionIdSeleccionada = signal<string>('');
  sedesDisponibles = signal<string[]>([]);

  // Outputs
  vehiculoCreated = output<VehiculoCreate>();
  vehiculoUpdated = output<VehiculoUpdate>();
  modalClosed = output<void>();

  // Computed
  isEditing = computed(() => {
    const data = this.modalData() || this.dialogData;
    return data?.mode === 'edit' && !!data?.vehiculo;
  });

  // Form
  vehiculoForm: FormGroup;

  constructor() {
    this.vehiculoForm = this.fb.group({
      placa: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/)]],
      marca: [''],
      modelo: [''],
      anioFabricacion: ['', [Validators.min(1990), Validators.max(this.getCurrentYear())]],
      color: [''],
      numeroMotor: [''],
      numeroChasis: [''],
      capacidadPasajeros: ['', [Validators.min(1)]],
      carroceria: ['OMNIBUS'],
      sedeRegistro: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    try {
      this.initializeComponent();
    } catch (error) {
      this.snackBar.open('Error inicializando componente', 'Cerrar', { duration: 3000 });
    }
  }

  private initializeComponent(): void {
    this.isLoading.set(true);
    
    // Cargar configuraciones iniciales
    this.loadSedesDisponibles();
    
    // Inicializar datos del modal
    const data = this.modalData() || this.dialogData;
    if (data) {
      this.empresaIdSeleccionada.set(data.empresaId || '');
      this.resolucionIdSeleccionada.set(data.resolucionId || '');
      
      if (this.isEditing() && data.vehiculo) {
        this.loadVehiculoData(data.vehiculo);
      }
    }
    
    this.isLoading.set(false);
  }

  private loadSedesDisponibles(): void {
    // Cargar sedes desde configuración
    const sedes = [
      'PUNO',
      'JULIACA',
      'AZANGARO',
      'AYAVIRI',
      'ILAVE',
      'YUNGUYO'
    ];
    this.sedesDisponibles.set(sedes);
  }

  private loadVehiculoData(vehiculo: Vehiculo): void {
    this.vehiculoForm.patchValue({
      placa: vehiculo.placa,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anioFabricacion: vehiculo.anioFabricacion,
      color: vehiculo.color,
      numeroMotor: vehiculo.datosTecnicos?.motor || '',
      numeroChasis: vehiculo.datosTecnicos?.chasis || '',
      capacidadPasajeros: vehiculo.datosTecnicos?.asientos,
      carroceria: vehiculo.carroceria,
      sedeRegistro: vehiculo.sedeRegistro
    });
  }

  onEmpresaChange(empresa: Empresa | null): void {
    const empresaId = empresa?.id || '';
    this.empresaIdSeleccionada.set(empresaId);
    this.resolucionIdSeleccionada.set('');
  }

  onResolucionIdChange(resolucion: Resolucion | null): void {
    const resolucionId = resolucion?.id || '';
    this.resolucionIdSeleccionada.set(resolucionId);
  }

  onSubmit(): void {
    if (!this.vehiculoForm.valid) {
      this.snackBar.open('Por favor, completa todos los campos obligatorios', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditing()) {
      this.updateVehiculo();
    } else {
      this.createVehiculo();
    }
  }

  private createVehiculo(): void {
    const vehiculoData = this.buildVehiculoData();
    
    this.vehiculoService.createVehiculo(vehiculoData).subscribe({
      next: () => {
        this.snackBar.open('Vehículo creado exitosamente', 'Cerrar', { duration: 3000 });
        this.vehiculoCreated.emit(vehiculoData);
        this.isSubmitting.set(false);
        this.close();
      },
      error: (error) => {
        this.snackBar.open('Error al crear vehículo', 'Cerrar', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  private updateVehiculo(): void {
    const data = this.modalData() || this.dialogData;
    if (!data?.vehiculo?.id) {
      this.isSubmitting.set(false);
      return;
    }

    const vehiculoData = this.buildVehiculoUpdateData();
    this.vehiculoService.updateVehiculo(data.vehiculo.id, vehiculoData).subscribe({
      next: () => {
        this.snackBar.open('Vehículo actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.vehiculoUpdated.emit(vehiculoData);
        this.isSubmitting.set(false);
        this.close();
      },
      error: (error) => {
        this.snackBar.open('Error al actualizar vehículo', 'Cerrar', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  private buildVehiculoData(): VehiculoCreate {
    const formValue = this.vehiculoForm.value;
    
    return {
      placa: formValue.placa,
      marca: formValue.marca || '',
      modelo: formValue.modelo || '',
      anioFabricacion: formValue.anioFabricacion || new Date().getFullYear(),
      color: formValue.color || '',
      carroceria: formValue.carroceria || 'OMNIBUS',
      sedeRegistro: formValue.sedeRegistro,
      empresaActualId: this.empresaIdSeleccionada(),
      resolucionId: this.resolucionIdSeleccionada(),
      categoria: 'M2', // Categoría por defecto
      tipoServicio: 'REGULAR', // Tipo de servicio por defecto
      datosTecnicos: {
        motor: formValue.numeroMotor || '',
        chasis: formValue.numeroChasis || '',
        ejes: 2,
        asientos: formValue.capacidadPasajeros || 0,
        pesoNeto: 0,
        pesoBruto: 0,
        tipoCombustible: 'DIESEL',
        medidas: {
          largo: 0,
          ancho: 0,
          alto: 0
        }
      }
    };
  }

  private buildVehiculoUpdateData(): VehiculoUpdate {
    const formValue = this.vehiculoForm.value;
    
    return {
      placa: formValue.placa,
      marca: formValue.marca,
      modelo: formValue.modelo,
      anioFabricacion: formValue.anioFabricacion,
      carroceria: formValue.carroceria,
      sedeRegistro: formValue.sedeRegistro,
      datosTecnicos: {
        motor: formValue.numeroMotor || '',
        chasis: formValue.numeroChasis || '',
        ejes: 2,
        asientos: formValue.capacidadPasajeros || 0,
        pesoNeto: 0,
        pesoBruto: 0,
        tipoCombustible: 'DIESEL',
        medidas: {
          largo: 0,
          ancho: 0,
          alto: 0
        }
      }
    };
  }

  formatSedeNombre(sede: string): string {
    if (!sede) return '';
    return sede.charAt(0).toUpperCase() + sede.slice(1).toLowerCase();
  }

  close(): void {
    this.modalClosed.emit();
    this.dialogRef.close();
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }
}