import { Component, OnInit, inject, signal, computed, ViewEncapsulation, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { VehiculoService } from '../../services/vehiculo.service';
import { Vehiculo, VehiculoCreate, VehiculoUpdate, DatosTecnicos } from '../../models/vehiculo.model';

@Component({
  selector: 'app-vehiculo-form',
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
    MatExpansionModule
  ],
  template: `
    @if (!modalMode()) {
      <div class="page-header">
        <div class="header-content">
          <div class="header-title">
            <mat-icon class="header-icon">{{ isEditing() ? 'edit' : 'add_circle' }}</mat-icon>
            <h1>{{ isEditing() ? 'Editar Vehículo' : 'Nuevo Vehículo' }}</h1>
          </div>
          <p class="header-subtitle">
            {{ isEditing() ? 'Modifica la información del vehículo' : 'Registra un nuevo vehículo en el sistema' }}
          </p>
        </div>
        <button mat-stroked-button (click)="volver()" class="header-button">
          <mat-icon>arrow_back</mat-icon>
          Volver
        </button>
      </div>
    }

    <div class="content-section">
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
                    <mat-label>Empresa Actual</mat-label>
                    <mat-select formControlName="empresaActualId" (selectionChange)="onEmpresaChange()">
                      <mat-option value="">Selecciona una empresa</mat-option>
                      <mat-option value="1">Empresa A</mat-option>
                      <mat-option value="2">Empresa B</mat-option>
                    </mat-select>
                    <mat-icon matSuffix>business</mat-icon>
                    <mat-hint>Empresa propietaria del vehículo</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Resolución</mat-label>
                    <mat-select formControlName="resolucionId" (selectionChange)="onResolucionChange()">
                      <mat-option value="">Selecciona una resolución</mat-option>
                      <mat-option value="1">Resolución 001/2024</mat-option>
                      <mat-option value="2">Resolución 002/2024</mat-option>
                    </mat-select>
                    <mat-icon matSuffix>description</mat-icon>
                    <mat-hint>Resolución asociada al vehículo</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Número de TUC</mat-label>
                    <input matInput formControlName="numeroTuc" placeholder="Ej: T-123456-2025" (input)="convertirAMayusculas($event, 'numeroTuc')">
                    <mat-icon matSuffix>receipt</mat-icon>
                    <mat-hint>Número del TUC del vehículo</mat-hint>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Rutas Asignadas</mat-label>
                    <mat-select formControlName="rutasAsignadasIds" multiple [disabled]="!puedeSeleccionarRutas()">
                      <mat-option value="1">Ruta 1 - Centro a Norte</mat-option>
                      <mat-option value="2">Ruta 2 - Centro a Sur</mat-option>
                      <mat-option value="3">Ruta 3 - Este a Oeste</mat-option>
                      <mat-option value="4">Ruta 4 - Norte a Sur</mat-option>
                      <mat-option value="5">Ruta 5 - Periférica</mat-option>
                    </mat-select>
                    <mat-icon matSuffix>route</mat-icon>
                    <mat-hint>{{ getRutasHint() }}</mat-hint>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Información Básica -->
            <mat-card class="form-card">
              <mat-card-header class="card-header">
                <div class="card-header-content">
                  <mat-icon class="card-icon">directions_car</mat-icon>
                  <mat-card-title class="card-title">
                    Información Básica
                  </mat-card-title>
                  <mat-card-subtitle class="card-subtitle">
                    Datos principales del vehículo
                  </mat-card-subtitle>
                </div>
              </mat-card-header>
              <mat-card-content class="card-content">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Placa *</mat-label>
                    <input matInput formControlName="placa" placeholder="Ej: ABC-123" (input)="convertirAMayusculas($event, 'placa')">
                    <mat-icon matSuffix>confirmation_number</mat-icon>
                    <mat-hint>Formato: XXX-123</mat-hint>
                    <mat-error *ngIf="vehiculoForm.get('placa')?.hasError('required')">
                      La placa es requerida
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Marca</mat-label>
                    <input matInput formControlName="marca" placeholder="Ej: MERCEDES-BENZ" (input)="convertirAMayusculas($event, 'marca')">
                    <mat-icon matSuffix>branding_watermark</mat-icon>
                    <mat-hint>Marca del vehículo</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Modelo</mat-label>
                    <input matInput formControlName="modelo" placeholder="Ej: O500RS" (input)="convertirAMayusculas($event, 'modelo')">
                    <mat-icon matSuffix>directions_car</mat-icon>
                    <mat-hint>Modelo específico del vehículo</mat-hint>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Categoría</mat-label>
                    <mat-select formControlName="categoria">
                      <mat-option value="M1">M1 - Vehículo de pasajeros hasta 8 asientos</mat-option>
                      <mat-option value="M2">M2 - Vehículo de pasajeros hasta 8 asientos + conductor</mat-option>
                      <mat-option value="M3">M3 - Vehículo de pasajeros más de 8 asientos + conductor</mat-option>
                      <mat-option value="N1">N1 - Vehículo de carga hasta 3.5 toneladas</mat-option>
                      <mat-option value="N2">N2 - Vehículo de carga entre 3.5 y 12 toneladas</mat-option>
                      <mat-option value="N3">N3 - Vehículo de carga más de 12 toneladas</mat-option>
                    </mat-select>
                    <mat-icon matSuffix>category</mat-icon>
                    <mat-hint>Selecciona la categoría</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Asientos</mat-label>
                    <input matInput type="number" formControlName="asientos" placeholder="Ej: 30">
                    <mat-icon matSuffix>airline_seat_recline_normal</mat-icon>
                    <mat-hint>Número de asientos del vehículo</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Año de Fabricación *</mat-label>
                    <input matInput type="number" formControlName="anioFabricacion" placeholder="Ej: 2020">
                    <mat-icon matSuffix>event</mat-icon>
                    <mat-hint>Año de fabricación del vehículo</mat-hint>
                    <mat-error *ngIf="vehiculoForm.get('anioFabricacion')?.hasError('required')">
                      El año de fabricación es requerido
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Estado</mat-label>
                    <mat-select formControlName="estado">
                      <mat-option value="ACTIVO">Activo</mat-option>
                      <mat-option value="INACTIVO">Inactivo</mat-option>
                      <mat-option value="MANTENIMIENTO">En Mantenimiento</mat-option>
                    </mat-select>
                    <mat-icon matSuffix>info</mat-icon>
                    <mat-hint>Estado actual del vehículo</mat-hint>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Especificaciones Técnicas -->
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>build</mat-icon>
                  Especificaciones Técnicas
                </mat-panel-title>
                <mat-panel-description>
                  Datos técnicos del vehículo
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div formGroupName="datosTecnicos">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Número de Motor</mat-label>
                    <input matInput formControlName="motor" placeholder="Ej: ABC123456789" (input)="convertirAMayusculas($event, 'motor')">
                    <mat-icon matSuffix>settings</mat-icon>
                    <mat-hint>Número de motor del vehículo</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Número de Chasis</mat-label>
                    <input matInput formControlName="chasis" placeholder="Ej: A123-B456-C789" (input)="convertirAMayusculas($event, 'chasis')">
                    <mat-icon matSuffix>confirmation_number</mat-icon>
                    <mat-hint>Número de chasis del vehículo</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Número de Cilindros</mat-label>
                    <input matInput type="number" formControlName="cilindros" placeholder="Ej: 6">
                    <mat-icon matSuffix>tune</mat-icon>
                    <mat-hint>Número de cilindros del motor</mat-hint>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Número de Ejes</mat-label>
                    <input matInput type="number" formControlName="ejes" placeholder="Ej: 2">
                    <mat-icon matSuffix>straighten</mat-icon>
                    <mat-hint>Número de ejes del vehículo</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Número de Ruedas</mat-label>
                    <input matInput type="number" formControlName="ruedas" placeholder="Ej: 6">
                    <mat-icon matSuffix>tire_repair</mat-icon>
                    <mat-hint>Número total de ruedas</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Peso Bruto (toneladas)</mat-label>
                    <input matInput type="number" formControlName="pesoBruto" placeholder="Ej: 16.000" step="0.001">
                    <mat-icon matSuffix>scale</mat-icon>
                    <mat-hint>Peso bruto en toneladas</mat-hint>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Peso Neto (toneladas)</mat-label>
                    <input matInput type="number" formControlName="pesoNeto" placeholder="Ej: 8.500" step="0.001">
                    <mat-icon matSuffix>scale</mat-icon>
                    <mat-hint>Peso neto en toneladas</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Carga Útil (toneladas)</mat-label>
                    <input matInput [value]="calcularCargaUtil()" readonly>
                    <mat-icon matSuffix>local_shipping</mat-icon>
                    <mat-hint>Carga útil calculada automáticamente</mat-hint>
                  </mat-form-field>
                </div>

                <!-- Dimensiones del Vehículo -->
                <mat-divider></mat-divider>
                <h4>Dimensiones del Vehículo</h4>
                <div formGroupName="medidas">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Largo (metros)</mat-label>
                      <input matInput type="number" formControlName="largo" placeholder="Ej: 10.5" step="0.1">
                      <mat-icon matSuffix>straighten</mat-icon>
                      <mat-hint>Longitud del vehículo</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Ancho (metros)</mat-label>
                      <input matInput type="number" formControlName="ancho" placeholder="Ej: 2.5" step="0.1">
                      <mat-icon matSuffix>straighten</mat-icon>
                      <mat-hint>Ancho del vehículo</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Alto (metros)</mat-label>
                      <input matInput type="number" formControlName="alto" placeholder="Ej: 3.2" step="0.1">
                      <mat-icon matSuffix>straighten</mat-icon>
                      <mat-hint>Altura del vehículo</mat-hint>
                    </mat-form-field>
                  </div>
                </div>
              </div>
            </mat-expansion-panel>

            <!-- Botones de Acción -->
            <div class="form-actions">
              @if (!modalMode()) {
                <button mat-stroked-button type="button" (click)="volver()" class="secondary-button">
                  <mat-icon>cancel</mat-icon>
                  Cancelar
                </button>
              }
              <button mat-raised-button 
                      color="primary" 
                      type="submit" 
                      [disabled]="vehiculoForm.invalid || isSubmitting()"
                      class="primary-button">
                @if (isSubmitting()) {
                  <mat-spinner diameter="20"></mat-spinner>
                }
                @if (!isSubmitting()) {
                  <mat-icon>{{ isEditing() ? 'save' : 'add' }}</mat-icon>
                }
                {{ isSubmitting() ? 'Guardando...' : (isEditing() ? 'Actualizar' : 'Guardar') }}
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      border-radius: 12px;
      color: white;
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

    .header-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .header-subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: 16px;
    }

    .header-button {
      color: white;
      border-color: rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 8px 16px;
      transition: all 0.3s ease;
    }

    .header-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .content-section {
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .loading-content {
      text-align: center;
    }

    .loading-spinner {
      margin-bottom: 24px;
    }

    .loading-content h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-weight: 500;
    }

    .loading-content p {
      margin: 0;
      color: #666;
    }

    .form-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .vehiculo-form {
      padding: 32px;
    }

    .form-card {
      margin-bottom: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      padding: 20px 24px 16px;
    }

    .card-header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .card-icon {
      color: #1976d2;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .card-title {
      margin: 0;
      color: #333;
      font-weight: 600;
      font-size: 18px;
    }

    .card-subtitle {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .card-content {
      padding: 24px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-field {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e9ecef;
    }

    .primary-button, .secondary-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      text-transform: uppercase;
      font-weight: 500;
      min-height: 48px;
      padding: 0 32px;
      transition: all 0.3s ease;
    }

    .primary-button {
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: white;
      border: none;
    }

    .primary-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(25, 118, 210, 0.3);
    }

    .primary-button:disabled {
      background: #ccc;
      transform: none;
      box-shadow: none;
    }

    .secondary-button {
      color: #666;
      border-color: #ddd;
    }

    .secondary-button:hover {
      background-color: #f5f5f5;
      border-color: #999;
      transform: translateY(-1px);
    }

    mat-expansion-panel {
      margin-bottom: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    mat-expansion-panel-header {
      background-color: #f8f9fa;
      border-radius: 8px 8px 0 0;
    }

    mat-panel-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #333;
      font-weight: 600;
    }

    mat-panel-description {
      color: #666;
    }

    h4 {
      margin: 24px 0 16px 0;
      color: #333;
      font-weight: 600;
      font-size: 16px;
    }

    mat-divider {
      margin: 24px 0;
    }
  `]
})
export class VehiculoFormComponent implements OnInit {
  // Propiedades de entrada para modo modal
  modalMode = input<boolean>(false);
  empresaId = input<string>('');
  resolucionId = input<string>('');

  // Evento de salida para modo modal
  vehiculoCreated = output<VehiculoCreate>();

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehiculoService = inject(VehiculoService);
  private snackBar = inject(MatSnackBar);

  vehiculoForm!: FormGroup;
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  vehiculoId = signal<string | null>(null);

  ngOnInit(): void {
    this.initializeForm();
    
    if (!this.modalMode()) {
      this.loadVehiculo();
    } else {
      // En modo modal, pre-configurar empresa y resolución
      this.vehiculoForm.patchValue({
        empresaActualId: this.empresaId(),
        resolucionId: this.resolucionId()
      });
    }
  }

  private initializeForm(): void {
    this.vehiculoForm = this.fb.group({
      empresaActualId: [''],
      resolucionId: [''],
      numeroTuc: [''],
      rutasAsignadasIds: [[]],
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

  private loadVehiculo(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isLoading.set(true);
      this.isEditing.set(true);
      this.vehiculoId.set(id);

      this.vehiculoService.getVehiculo(id).subscribe({
        next: (vehiculo) => {
          this.vehiculoForm.patchValue({
            empresaActualId: vehiculo.empresaActualId,
            resolucionId: vehiculo.resolucionId,
            numeroTuc: vehiculo.tuc?.nroTuc || '',
            rutasAsignadasIds: vehiculo.rutasAsignadasIds || [],
            placa: vehiculo.placa,
            marca: vehiculo.marca,
            modelo: vehiculo.modelo,
            categoria: vehiculo.categoria,
            asientos: vehiculo.asientos,
            anioFabricacion: vehiculo.anioFabricacion,
            estado: vehiculo.estado,
            datosTecnicos: {
              motor: vehiculo.datosTecnicos.motor,
              chasis: vehiculo.datosTecnicos.chasis,
              cilindros: vehiculo.datosTecnicos.cilindros,
              ejes: vehiculo.datosTecnicos.ejes,
              ruedas: vehiculo.datosTecnicos.ruedas,
              pesoNeto: vehiculo.datosTecnicos.pesoNeto,
              pesoBruto: vehiculo.datosTecnicos.pesoBruto,
              medidas: vehiculo.datosTecnicos.medidas
            }
          });
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading vehicle:', error);
          this.snackBar.open('Error al cargar el vehículo', 'Cerrar', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  onSubmit(): void {
    if (this.vehiculoForm.valid) {
      this.isSubmitting.set(true);
      const formValue = this.vehiculoForm.value;

      if (this.modalMode()) {
        // Modo modal: emitir evento
        const vehiculoCreate: VehiculoCreate = {
          placa: formValue.placa,
          marca: formValue.marca,
          modelo: formValue.modelo,
          categoria: formValue.categoria,
          asientos: formValue.asientos,
          anioFabricacion: formValue.anioFabricacion,
          empresaActualId: this.empresaId(),
          resolucionId: this.resolucionId(),
          rutasAsignadasIds: formValue.rutasAsignadasIds || [],
          tuc: formValue.numeroTuc ? {
            nroTuc: formValue.numeroTuc,
            fechaEmision: new Date().toISOString()
          } : undefined,
          datosTecnicos: formValue.datosTecnicos
        };

        this.vehiculoCreated.emit(vehiculoCreate);
        this.vehiculoForm.reset({
          categoria: 'M3',
          estado: 'ACTIVO',
          empresaActualId: this.empresaId(),
          resolucionId: this.resolucionId(),
          rutasAsignadasIds: [],
          datosTecnicos: {
            motor: '',
            chasis: '',
            cilindros: '',
            ejes: '',
            ruedas: '',
            pesoNeto: '',
            pesoBruto: '',
            medidas: {
              largo: '',
              ancho: '',
              alto: ''
            }
          }
        });
        this.isSubmitting.set(false);
      } else {
        // Modo normal: guardar en servicio
        if (this.isEditing()) {
          const vehiculoUpdate: VehiculoUpdate = {
            placa: formValue.placa,
            marca: formValue.marca,
            modelo: formValue.modelo,
            categoria: formValue.categoria,
            asientos: formValue.asientos,
            anioFabricacion: formValue.anioFabricacion,
            estado: formValue.estado,
            empresaActualId: formValue.empresaActualId,
            resolucionId: formValue.resolucionId,
            rutasAsignadasIds: formValue.rutasAsignadasIds || [],
            tuc: formValue.numeroTuc ? {
              nroTuc: formValue.numeroTuc,
              fechaEmision: new Date().toISOString()
            } : undefined,
            datosTecnicos: formValue.datosTecnicos
          };

          this.vehiculoService.updateVehiculo(this.vehiculoId()!, vehiculoUpdate).subscribe({
            next: () => {
              this.snackBar.open('Vehículo actualizado exitosamente', 'Cerrar', { duration: 3000 });
              this.volver();
            },
            error: (error) => {
              console.error('Error updating vehicle:', error);
              this.snackBar.open('Error al actualizar el vehículo', 'Cerrar', { duration: 3000 });
              this.isSubmitting.set(false);
            }
          });
        } else {
          const vehiculoCreate: VehiculoCreate = {
            placa: formValue.placa,
            marca: formValue.marca,
            modelo: formValue.modelo,
            categoria: formValue.categoria,
            asientos: formValue.asientos,
            anioFabricacion: formValue.anioFabricacion,
            empresaActualId: formValue.empresaActualId,
            resolucionId: formValue.resolucionId,
            rutasAsignadasIds: formValue.rutasAsignadasIds || [],
            tuc: formValue.numeroTuc ? {
              nroTuc: formValue.numeroTuc,
              fechaEmision: new Date().toISOString()
            } : undefined,
            datosTecnicos: formValue.datosTecnicos
          };

          this.vehiculoService.createVehiculo(vehiculoCreate).subscribe({
            next: () => {
              this.snackBar.open('Vehículo creado exitosamente', 'Cerrar', { duration: 3000 });
              this.volver();
            },
            error: (error) => {
              console.error('Error creating vehicle:', error);
              this.snackBar.open('Error al crear el vehículo', 'Cerrar', { duration: 3000 });
              this.isSubmitting.set(false);
            }
          });
        }
      }
    }
  }

  convertirAMayusculas(event: any, campo: string): void {
    const valor = event.target.value;
    const valorMayusculas = valor.toUpperCase();
    
    if (valor !== valorMayusculas) {
      this.vehiculoForm.get(campo)?.setValue(valorMayusculas, { emitEvent: false });
    }
  }

  onEmpresaChange(): void {
    this.vehiculoForm.get('resolucionId')?.setValue('');
    this.vehiculoForm.get('rutasAsignadasIds')?.setValue([]);
  }

  onResolucionChange(): void {
    this.vehiculoForm.get('rutasAsignadasIds')?.setValue([]);
  }

  puedeSeleccionarRutas(): boolean {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    return !!empresaId && !!resolucionId;
  }

  getRutasHint(): string {
    if (!this.puedeSeleccionarRutas()) {
      return 'Selecciona empresa y resolución primero';
    }
    return 'Selecciona las rutas autorizadas';
  }

  calcularCargaUtil(): number {
    const pesoBruto = this.vehiculoForm.get('datosTecnicos.pesoBruto')?.value;
    const pesoNeto = this.vehiculoForm.get('datosTecnicos.pesoNeto')?.value;
    if (pesoBruto && pesoNeto) {
      return Number((pesoBruto - pesoNeto).toFixed(3));
    }
    return 0;
  }

  volver(): void {
    this.router.navigate(['/vehiculos']);
  }
} 