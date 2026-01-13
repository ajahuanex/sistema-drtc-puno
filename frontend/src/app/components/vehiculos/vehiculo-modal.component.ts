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
import {
  placaPeruanaValidator,
  placaDuplicadaValidator,
  anioFabricacionValidator,
  capacidadPasajerosValidator,
  numeroMotorValidator,
  numeroChasisValidator,
  numeroTucValidator
} from '../../validators/vehiculo.validators';

export interface VehiculoModalData {
  empresaId?: string;
  resolucionId?: string;
  vehiculo?: Vehiculo; // Para modo edición
  mode: 'create' | 'edit' | 'batch'; // Agregamos modo batch para múltiples vehículos
  allowMultiple?: boolean; // Permitir agregar múltiples vehículos
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
            <h2>{{ isEditing() ? 'Editar Vehículo' : 'Agregar Vehículos' }}</h2>
          </div>
          <p class="header-subtitle">
            {{ isEditing() ? 'Modifica la información del vehículo' : 'Solo placa y sede de registro son obligatorios. Agrega varios vehículos a la vez.' }}
          </p>
        </div>
        <button mat-icon-button (click)="close()" class="close-button">
          <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
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
                  <app-smart-icon [iconName]="'business'" [size]="24" class="card-icon"></app-smart-icon>
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
                  <!-- Empresa Selector Component -->
                  <app-empresa-selector
                    [label]="'Empresa Actual'"
                    [placeholder]="'Buscar empresa por RUC, razón social o código'"
                    [hint]="cantidadVehiculosEmpresa() > 0 ? cantidadVehiculosEmpresa() + ' vehículo(s) actual(es)' : 'Empresa propietaria del vehículo'"
                    [required]="true"
                    [empresaId]="empresaIdParaSelector()"
                    (empresaSeleccionada)="onEmpresaSeleccionadaSelector($event)"
                    (empresaIdChange)="onEmpresaIdChange($event)">
                  </app-empresa-selector>

                  <!-- Resolución Selector Component -->
                  <app-resolucion-selector
                    [label]="'Resolución'"
                    [placeholder]="'Buscar por número o descripción'"
                    [hint]="'Resolución asociada al vehículo (primigenia o hija)'"
                    [required]="true"
                    [empresaId]="empresaIdParaSelector()"
                    [resolucionId]="resolucionIdParaSelector()"
                    (resolucionSeleccionada)="onResolucionSeleccionadaSelector($event)"
                    (resolucionIdChange)="onResolucionIdChange($event)">
                  </app-resolucion-selector>
                </div>

                <!-- Información de Resoluciones Relacionadas (solo en modo edición) -->
                @if (isEditing() && (resolucionPrimigenia() || resolucionesHijas().length > 0)) {
                  <div class="resoluciones-relacionadas">
                    <mat-divider></mat-divider>
                    <div class="resoluciones-info">
                      <h4 class="resoluciones-title">
                        <mat-icon>account_tree</mat-icon>
                        Resoluciones Relacionadas
                      </h4>
                      
                      <!-- Resolución Primigenia -->
                      @if (resolucionPrimigenia() && resolucionPrimigenia()?.id !== resolucionActual()?.id) {
                        <div class="resolucion-item primigenia">
                          <div class="resolucion-header">
                            <mat-icon class="resolucion-icon">source</mat-icon>
                            <span class="resolucion-label">Resolución Primigenia (PADRE)</span>
                          </div>
                          <div class="resolucion-details">
                            <span class="resolucion-numero">{{ resolucionPrimigenia()?.nroResolucion }}</span>
                            <span class="resolucion-fecha">{{ resolucionPrimigenia()?.fechaEmision | date:'dd/MM/yyyy' }}</span>
                            <span class="resolucion-tipo">{{ resolucionPrimigenia()?.tipoTramite }}</span>
                          </div>
                        </div>
                      }

                      <!-- Resoluciones Hijas -->
                      @if (resolucionesHijas().length > 0) {
                        <div class="resoluciones-hijas">
                          <div class="resolucion-header">
                            <mat-icon class="resolucion-icon">call_split</mat-icon>
                            <span class="resolucion-label">Resoluciones Hijas Disponibles</span>
                          </div>
                          @for (resolucionHija of resolucionesHijas(); track resolucionHija.id) {
                            <div class="resolucion-item hija" 
                                 [class.selected]="resolucionHija.id === resolucionActual()?.id">
                              <div class="resolucion-details">
                                <span class="resolucion-numero">{{ resolucionHija.nroResolucion }}</span>
                                <span class="resolucion-fecha">{{ resolucionHija.fechaEmision | date:'dd/MM/yyyy' }}</span>
                                <span class="resolucion-tipo">{{ resolucionHija.tipoTramite }}</span>
                                @if (resolucionHija.id === resolucionActual()?.id) {
                                  <mat-icon class="current-icon">check_circle</mat-icon>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
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
                  <!-- Campo obligatorio: Placa -->
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Placa *</mat-label>
                    <input matInput 
                           formControlName="placa" 
                           placeholder="Ej: ABC123 o A1B123" 
                           (input)="formatearPlaca($event)" 
                           (blur)="validarPlaca()"
                           maxlength="7"
                           required>
                    <app-smart-icon [iconName]="'directions_car'" [size]="20" matSuffix></app-smart-icon>
                    <mat-hint>Formato: 3 alfanuméricos-guión-3números (Ej: ABC-123, A1B-123)</mat-hint>
                    <mat-error *ngIf="vehiculoForm.get('placa')?.hasError('required')">
                      La placa es obligatoria
                    </mat-error>
                    <mat-error *ngIf="vehiculoForm.get('placa')?.hasError('pattern')">
                      Formato de placa inválido (Ej: ABC-123)
                    </mat-error>
                    <mat-error *ngIf="vehiculoForm.get('placa')?.hasError('placaInvalida')">
                      {{ vehiculoForm.get('placa')?.errors?.['placaInvalida']?.message }}
                    </mat-error>
                  </mat-form-field>
                  
                  <!-- Campo obligatorio: Sede de Registro con buscador -->
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Sede de Registro *</mat-label>
                    <input matInput 
                           formControlName="sedeRegistro"
                           placeholder="Buscar o seleccionar sede..."
                           [matAutocomplete]="sedeAuto"
                           (focus)="onSedeInputFocus()"
                           required>
                    <mat-autocomplete #sedeAuto="matAutocomplete" [autoActiveFirstOption]="true">
                      @for (sede of sedesFiltradas | async; track sede) {
                        <mat-option [value]="sede">
                          <div class="sede-option">
                            <app-smart-icon [iconName]="'location_city'" [size]="20"></app-smart-icon>
                            <span>{{ formatSedeNombre(sede) }}</span>
                          </div>
                        </mat-option>
                      }
                      @empty {
                        <mat-option disabled>
                          <div class="no-results">
                            <app-smart-icon [iconName]="'search_off'" [size]="20"></app-smart-icon>
                            <span>No se encontraron sedes</span>
                          </div>
                        </mat-option>
                      }
                    </mat-autocomplete>
                    <app-smart-icon [iconName]="'location_city'" [size]="20" matSuffix></app-smart-icon>
                    <button matSuffix mat-icon-button 
                            type="button" 
                            (click)="limpiarSede()"
                            *ngIf="vehiculoForm.get('sedeRegistro')?.value"
                            matTooltip="Limpiar sede">
                      <app-smart-icon [iconName]="'clear'" [size]="18"></app-smart-icon>
                    </button>
                    <mat-hint>Sede donde se registra el vehículo</mat-hint>
                    <mat-error *ngIf="vehiculoForm.get('sedeRegistro')?.hasError('required')">
                      La sede de registro es obligatoria
                    </mat-error>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Información Técnica (Opcional) -->
            <mat-expansion-panel class="form-card">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <app-smart-icon [iconName]="'build'" [size]="24" class="card-icon"></app-smart-icon>
                  <span class="panel-title-text">Información Técnica (Opcional)</span>
                </mat-panel-title>
                <mat-panel-description>
                  Marca, modelo, año y otros datos técnicos
                </mat-panel-description>
              </mat-expansion-panel-header>
              
              <div class="expansion-content">
                <!-- Información básica del vehículo -->
                <div class="form-section">
                  <h4 class="section-title">
                    <app-smart-icon [iconName]="'info'" [size]="18"></app-smart-icon>
                    Información Básica
                  </h4>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Marca</mat-label>
                      <input matInput formControlName="marca" placeholder="Ej: Toyota, Mercedes, etc." (input)="convertirAMayusculas($event, 'marca')">
                      <app-smart-icon [iconName]="'branding_watermark'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Marca del vehículo</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Modelo</mat-label>
                      <input matInput formControlName="modelo" placeholder="Ej: Corolla, Sprinter, etc." (input)="convertirAMayusculas($event, 'modelo')">
                      <app-smart-icon [iconName]="'model_training'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Modelo del vehículo</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Año de Fabricación</mat-label>
                      <input matInput formControlName="anioFabricacion" type="number" placeholder="Ej: 2020">
                      <app-smart-icon [iconName]="'calendar_today'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Entre 1990 y {{ getCurrentYear() + 1 }}</mat-hint>
                      <mat-error *ngIf="vehiculoForm.get('anioFabricacion')?.hasError('anioMinimo')">
                        {{ vehiculoForm.get('anioFabricacion')?.errors?.['anioMinimo']?.message }}
                      </mat-error>
                      <mat-error *ngIf="vehiculoForm.get('anioFabricacion')?.hasError('anioMaximo')">
                        {{ vehiculoForm.get('anioFabricacion')?.errors?.['anioMaximo']?.message }}
                      </mat-error>
                      <mat-error *ngIf="vehiculoForm.get('anioFabricacion')?.hasError('anioInvalido')">
                        {{ vehiculoForm.get('anioFabricacion')?.errors?.['anioInvalido']?.message }}
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Categoría</mat-label>
                      <mat-select formControlName="categoria">
                        @for (categoria of configuracionService.categoriasVehiculos(); track categoria) {
                          <mat-option [value]="categoria">{{ categoria }} - Vehículo de transporte</mat-option>
                        }
                      </mat-select>
                      <app-smart-icon [iconName]="'category'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Categoría del vehículo</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Carrocería</mat-label>
                      <mat-select formControlName="carroceria">
                        @for (carroceria of configuracionService.tiposCarroceria(); track carroceria) {
                          <mat-option [value]="carroceria">{{ carroceria }}</mat-option>
                        }
                      </mat-select>
                      <app-smart-icon [iconName]="'directions_bus'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Tipo de carrocería del vehículo</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Color</mat-label>
                      <input matInput formControlName="color" placeholder="Ej: Blanco, Azul, etc." (input)="convertirAMayusculas($event, 'color')">
                      <app-smart-icon [iconName]="'palette'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Color del vehículo</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Número de Asientos</mat-label>
                      <input matInput formControlName="asientos" type="number" placeholder="Ej: 45" min="1" max="100">
                      <app-smart-icon [iconName]="'airline_seat_recline_normal'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Capacidad de pasajeros (1-100)</mat-hint>
                      <mat-error *ngIf="vehiculoForm.get('asientos')?.hasError('capacidadMinima')">
                        {{ vehiculoForm.get('asientos')?.errors?.['capacidadMinima']?.message }}
                      </mat-error>
                      <mat-error *ngIf="vehiculoForm.get('asientos')?.hasError('capacidadMaxima')">
                        {{ vehiculoForm.get('asientos')?.errors?.['capacidadMaxima']?.message }}
                      </mat-error>
                      <mat-error *ngIf="vehiculoForm.get('asientos')?.hasError('capacidadInvalida')">
                        {{ vehiculoForm.get('asientos')?.errors?.['capacidadInvalida']?.message }}
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Estado</mat-label>
                      <mat-select formControlName="estado">
                        @for (estado of configuracionService.estadosVehiculos(); track estado) {
                          <mat-option [value]="estado">{{ estado }}</mat-option>
                        }
                      </mat-select>
                      <app-smart-icon [iconName]="'check_circle'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Estado actual del vehículo</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Número de TUC</mat-label>
                      <input matInput formControlName="numeroTuc" placeholder="Ej: T-123456-2025" (input)="convertirAMayusculas($event, 'numeroTuc')">
                      <app-smart-icon [iconName]="'receipt'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Formato: T-123456-2025</mat-hint>
                      <mat-error *ngIf="vehiculoForm.get('numeroTuc')?.hasError('numeroTucInvalido')">
                        {{ vehiculoForm.get('numeroTuc')?.errors?.['numeroTucInvalido']?.message }}
                      </mat-error>
                    </mat-form-field>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <!-- Datos técnicos del motor -->
                <div class="form-section">
                  <h4 class="section-title">
                    <app-smart-icon [iconName]="'settings'" [size]="18"></app-smart-icon>
                    Datos Técnicos del Motor
                  </h4>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Número de Motor</mat-label>
                      <input matInput formControlName="motor" placeholder="Número de motor" (input)="convertirAMayusculas($event, 'motor')">
                      <app-smart-icon [iconName]="'precision_manufacturing'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Número de serie del motor</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Número de Chasis</mat-label>
                      <input matInput formControlName="chasis" placeholder="Número de chasis" (input)="convertirAMayusculas($event, 'chasis')">
                      <app-smart-icon [iconName]="'engineering'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Número de serie del chasis</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Tipo de Combustible</mat-label>
                      <mat-select formControlName="tipoCombustible">
                        @for (combustible of configuracionService.tiposCombustible(); track combustible) {
                          <mat-option [value]="combustible">{{ combustible }}</mat-option>
                        }
                      </mat-select>
                      <app-smart-icon [iconName]="'local_gas_station'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Tipo de combustible que usa</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Número de Cilindros</mat-label>
                      <input matInput formControlName="cilindros" type="number" placeholder="Ej: 4" min="1" max="12">
                      <app-smart-icon [iconName]="'settings_applications'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Cantidad de cilindros del motor</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Número de Ejes</mat-label>
                      <input matInput formControlName="ejes" type="number" placeholder="Ej: 2" min="2" max="4">
                      <app-smart-icon [iconName]="'linear_scale'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Cantidad de ejes del vehículo</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Número de Llantas</mat-label>
                      <input matInput formControlName="ruedas" type="number" placeholder="Ej: 6" min="4" max="18">
                      <app-smart-icon [iconName]="'trip_origin'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Cantidad total de llantas</mat-hint>
                    </mat-form-field>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <!-- Capacidad y dimensiones -->
                <div class="form-section">
                  <h4 class="section-title">
                    <app-smart-icon [iconName]="'straighten'" [size]="18"></app-smart-icon>
                    Capacidad y Dimensiones
                  </h4>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Peso Neto (t)</mat-label>
                      <input matInput formControlName="pesoNeto" type="number" step="0.001" placeholder="Ej: 2.500" min="0.5" (input)="calcularCargaUtil()">
                      <app-smart-icon [iconName]="'fitness_center'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Peso del vehículo vacío en toneladas</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Peso Bruto (t)</mat-label>
                      <input matInput formControlName="pesoBruto" type="number" step="0.001" placeholder="Ej: 3.500" min="1.0" (input)="calcularCargaUtil()">
                      <app-smart-icon [iconName]="'scale'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Peso máximo con carga en toneladas</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Carga Útil (t)</mat-label>
                      <input matInput formControlName="cargaUtil" type="number" step="0.001" placeholder="Se calcula automáticamente" readonly>
                      <app-smart-icon [iconName]="'local_shipping'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Diferencia entre peso bruto y peso neto (calculado automáticamente)</mat-hint>
                    </mat-form-field>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <!-- Medidas del vehículo -->
                <div class="form-section">
                  <h4 class="section-title">
                    <app-smart-icon [iconName]="'aspect_ratio'" [size]="18"></app-smart-icon>
                    Medidas del Vehículo
                  </h4>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Largo (m)</mat-label>
                      <input matInput formControlName="largo" type="number" step="0.1" placeholder="Ej: 12.0" min="3" max="20">
                      <app-smart-icon [iconName]="'height'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Longitud del vehículo en metros</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Ancho (m)</mat-label>
                      <input matInput formControlName="ancho" type="number" step="0.1" placeholder="Ej: 2.5" min="1.5" max="3">
                      <app-smart-icon [iconName]="'swap_horiz'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Ancho del vehículo en metros</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Alto (m)</mat-label>
                      <input matInput formControlName="alto" type="number" step="0.1" placeholder="Ej: 3.0" min="1.5" max="4">
                      <app-smart-icon [iconName]="'swap_vert'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Altura del vehículo en metros</mat-hint>
                    </mat-form-field>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <!-- Observaciones -->
                <div class="form-section">
                  <h4 class="section-title">
                    <app-smart-icon [iconName]="'note'" [size]="18"></app-smart-icon>
                    Observaciones Adicionales
                  </h4>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field full-width">
                      <mat-label>Observaciones</mat-label>
                      <textarea matInput formControlName="observaciones" rows="3" placeholder="Observaciones adicionales sobre el vehículo..."></textarea>
                      <app-smart-icon [iconName]="'comment'" [size]="20" matSuffix></app-smart-icon>
                      <mat-hint>Información adicional relevante</mat-hint>
                    </mat-form-field>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <!-- Campos Opcionales Avanzados -->
                <div class="form-section">
                  <div class="section-header-with-toggle">
                    <h4 class="section-title">
                      <app-smart-icon [iconName]="'tune'" [size]="18"></app-smart-icon>
                      Información Técnica Avanzada
                    </h4>
                    
                    <button type="button" mat-stroked-button (click)="toggleCamposOpcionales()" class="toggle-button-advanced">
                      <app-smart-icon [iconName]="mostrarCamposOpcionales() ? 'expand_less' : 'expand_more'" [size]="20"></app-smart-icon>
                      {{ mostrarCamposOpcionales() ? 'Ocultar' : 'Mostrar' }} Campos Avanzados
                    </button>
                  </div>

                  <!-- Campos opcionales expandibles -->
                  @if (mostrarCamposOpcionales()) {
                    <div class="campos-opcionales-container">
                      <div class="form-row campos-opcionales">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Cilindrada (cc)</mat-label>
                          <input matInput formControlName="cilindrada" type="number" placeholder="Ej: 2500">
                          <app-smart-icon [iconName]="'speed'" [size]="20" matSuffix></app-smart-icon>
                          <mat-hint>Cilindrada del motor en centímetros cúbicos</mat-hint>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Potencia (HP)</mat-label>
                          <input matInput formControlName="potencia" type="number" placeholder="Ej: 150">
                          <app-smart-icon [iconName]="'flash_on'" [size]="20" matSuffix></app-smart-icon>
                          <mat-hint>Potencia del motor en caballos de fuerza</mat-hint>
                        </mat-form-field>
                      </div>

                      <div class="form-row campos-opcionales">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Número de Serie</mat-label>
                          <input matInput formControlName="numeroSerie" placeholder="Número de serie del vehículo" (input)="convertirAMayusculas($event, 'numeroSerie')">
                          <app-smart-icon [iconName]="'confirmation_number'" [size]="20" matSuffix></app-smart-icon>
                          <mat-hint>Número de serie del fabricante</mat-hint>
                        </mat-form-field>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </mat-expansion-panel>

          </form>
        </div>
      }

      <!-- Footer del modal con botones de acción -->
      <div class="modal-footer">
        <div class="footer-actions">
          <button mat-stroked-button (click)="close()" class="cancel-button">
            <app-smart-icon [iconName]="'cancel'" [size]="20"></app-smart-icon>
            Cancelar
          </button>
          
          <button mat-raised-button 
                  color="primary" 
                  (click)="onSubmit()" 
                  [disabled]="!vehiculoForm.valid || isSubmitting()"
                  class="submit-button">
            <app-smart-icon [iconName]="isEditing() ? 'save' : 'add'" [size]="20"></app-smart-icon>
            <span *ngIf="!isSubmitting()">{{ isEditing() ? 'Guardar Cambios' : 'Crear Vehículo' }}</span>
            <span *ngIf="isSubmitting()">Procesando...</span>
          </button>
          
          <!-- Debug info (temporal) -->
          <div style="margin-top: 10px; font-size: 12px; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">
            <p><strong>Debug Info:</strong></p>
            <p>Formulario válido: {{ vehiculoForm.valid }}</p>
            <p>Enviando: {{ isSubmitting() }}</p>
            <p>Modo edición: {{ isEditing() }}</p>
            <p>Botón habilitado: {{ vehiculoForm.valid && !isSubmitting() }}</p>
            
            <div style="margin-top: 10px;">
              <p><strong>Errores del formulario:</strong></p>
              <div *ngFor="let control of getFormErrors()" style="color: red; font-size: 11px;">
                • {{ control.field }}: {{ control.errors.join(', ') }}
              </div>
            </div>
          </div>
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

    /* Estilos específicos para el acordeón de especificaciones técnicas */
    mat-expansion-panel.form-card {
      border: 1px solid #e0e0e0;
    }

    mat-expansion-panel.form-card .mat-expansion-panel-header {
      background: #f5f5f5;
      padding: 16px;
      margin: -16px -16px 0 -16px;
    }

    mat-expansion-panel.form-card .mat-expansion-panel-header:hover {
      background: #eeeeee;
    }

    mat-expansion-panel.form-card .mat-expansion-panel-content {
      padding: 16px;
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

    .expansion-content {
      padding: 16px;
    }

    .panel-title-text {
      margin-left: 8px;
    }

    .sede-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sede-option span {
      font-size: 14px;
    }

    .no-results {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      padding: 8px;
      color: rgba(0, 0, 0, 0.6);
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

    /* Estilos para resoluciones relacionadas */
    .resoluciones-relacionadas {
      margin-top: 16px;
    }

    .resoluciones-info {
      padding: 16px 0;
    }

    .resoluciones-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 14px;
      font-weight: 500;
    }

    .resolucion-item {
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 8px;
      background: #fafafa;
    }

    .resolucion-item.primigenia {
      border-color: #4caf50;
      background: #f1f8e9;
    }

    .resolucion-item.hija {
      border-color: #2196f3;
      background: #e3f2fd;
    }

    .resolucion-item.selected {
      border-color: #ff9800;
      background: #fff3e0;
      box-shadow: 0 2px 4px rgba(255, 152, 0, 0.2);
    }

    .resolucion-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }

    .resolucion-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .resolucion-label {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .resolucion-details {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .resolucion-numero {
      font-weight: 600;
      color: #1976d2;
      font-size: 14px;
    }

    .resolucion-fecha {
      color: #666;
      font-size: 12px;
    }

    .resolucion-tipo {
      background: #e0e0e0;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      text-transform: uppercase;
      color: #555;
    }

    .current-icon {
      color: #4caf50;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .resoluciones-hijas {
      margin-top: 12px;
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

      .resolucion-details {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }

    /* Estilos para las secciones del formulario */
    .form-section {
      margin-bottom: 24px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
      color: #1976d2;
      border-bottom: 1px solid #e3f2fd;
      padding-bottom: 8px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .expansion-content {
      padding: 16px 0;
    }

    .expansion-content mat-divider {
      margin: 24px 0;
    }

    /* Estilos para la nueva sección de campos opcionales avanzados */
    .section-header-with-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .toggle-button-advanced {
      border: 1px solid #9c27b0;
      color: #9c27b0;
      background-color: transparent;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      padding: 6px 12px;
    }

    .toggle-button-advanced:hover {
      background-color: #f3e5f5;
      border-color: #7b1fa2;
      color: #7b1fa2;
    }

    .campos-opcionales-container {
      animation: slideDown 0.3s ease-out;
      border: 1px solid #e1bee7;
      border-radius: 8px;
      padding: 20px;
      background: linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%);
      margin-top: 12px;
      box-shadow: 0 2px 4px rgba(156, 39, 176, 0.1);
    }

    .campos-opcionales-container .form-field {
      background-color: rgba(255, 255, 255, 0.8);
      border-radius: 4px;
    }

    .campos-opcionales-container .mat-mdc-form-field {
      margin-bottom: 8px;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
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
  configuracionService = inject(ConfiguracionService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef);

  // Estado del componente
  isLoading = signal(false);
  isSubmitting = signal(false);
  vehiculosActuales = signal<Vehiculo[]>([]);
  mostrarCamposOpcionales = signal(false); // Nuevo signal para controlar visibilidad

  // Sedes disponibles desde configuración
  sedesDisponibles = computed(() => this.configuracionService.sedesDisponibles());
  sedeDefault = computed(() => this.configuracionService.sedeDefault());

  // Observable para autocompletado de sedes
  sedesFiltradas!: Observable<string[]>;

  cantidadVehiculosEmpresa = computed(() => {
    const empresaId = this.vehiculoForm?.get('empresaActualId')?.value;
    const vehiculosActuales = this.vehiculosActuales();

    if (!empresaId) {
      return 0;
    }

    return vehiculosActuales.filter(v => v.empresaActualId === empresaId).length;
  });

  isEditing = computed(() => {
    const data = this.modalData() || this.dialogData;
    return data?.mode === 'edit';
  });

  // Datos de referencia
  empresas = signal<Empresa[]>([]);
  resoluciones = signal<Resolucion[]>([]);
  rutasDisponibles = signal<Ruta[]>([]);
  
  // Resoluciones relacionadas (para modo edición)
  resolucionPrimigenia = signal<Resolucion | null>(null);
  resolucionesHijas = signal<Resolucion[]>([]);
  resolucionActual = signal<Resolucion | null>(null);
  
  // Valores preseleccionados para los selectores (computed para reactividad)
  empresaIdSeleccionada = signal<string>('');
  resolucionIdSeleccionada = signal<string>('');
  
  // Computed signals para forzar reactividad en el template
  empresaIdParaSelector = computed(() => {
    // Incluir forceUpdate para forzar recálculo
    this.forceUpdate();
    const empresaId = this.empresaIdSeleccionada();
    return empresaId;
  });
  
  resolucionIdParaSelector = computed(() => {
    // Incluir forceUpdate para forzar recálculo
    this.forceUpdate();
    const resolucionId = this.resolucionIdSeleccionada();
    return resolucionId;
  });

  // Signal para forzar actualización de los selectores
  private forceUpdate = signal(0);

  // Formulario
  vehiculoForm!: FormGroup;

  constructor() {
    // Effect para sincronizar los selectores cuando cambien los signals
    effect(() => {
      const empresaId = this.empresaIdSeleccionada();
      const resolucionId = this.resolucionIdSeleccionada();
      
      // Forzar actualización del formulario si los signals cambian
      if (this.vehiculoForm && (empresaId || resolucionId)) {
        // Usar setTimeout para evitar problemas de timing
        setTimeout(() => {
          this.vehiculoForm.patchValue({
            empresaActualId: empresaId,
            resolucionId: resolucionId
          }, { emitEvent: true }); // Cambiar a true para que los selectores reaccionen
        }, 50);
      }
    });
  }

  ngOnInit(): void {
    console.log('🔍 modalData:', this.modalData());
    // Inicializar formulario inmediatamente para evitar errores de template
    this.initializeForm();
    
    // Cargar configuraciones y actualizar formulario si es necesario
    this.configuracionService.cargarConfiguraciones().then(() => {
      // Recargar formulario con configuraciones actualizadas si es necesario
      this.loadEmpresas();
      this.loadVehiculosActuales();
      this.configurarAutocompletadoSedes();

      // Inicializar datos del modal después de un breve delay para asegurar que todo esté listo
      setTimeout(() => {
        this.initializeModalData();
      }, 100);
    }).catch((error: unknown) => {
      console.error('Error cargando configuraciones, usando valores por defecto:', error);
      // Continuar con valores por defecto si falla la carga
      this.loadEmpresas();
      this.loadVehiculosActuales();
      this.configurarAutocompletadoSedes();

      setTimeout(() => {
        this.initializeModalData();
      }, 100);
    });
  }

  /**
   * Carga todos los vehículos actuales para mostrar estadísticas
   */
  private loadVehiculosActuales(): void {
    this.vehiculoService.getVehiculos().subscribe({
      next: (vehiculos) => {
        this.vehiculosActuales.set(vehiculos);
      },
      error: (error) => {
        console.error('Error cargando vehículos actuales:', error);
      }
    });
  }

  /**
   * Configura el autocompletado para el campo de sede
   */
  private configurarAutocompletadoSedes(): void {
    const sedeControl = this.vehiculoForm.get('sedeRegistro');
    if (sedeControl) {
      this.sedesFiltradas = sedeControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filterSedes(value || ''))
      );
    }
  }

  /**
   * Filtra las sedes según el término de búsqueda
   */
  private _filterSedes(value: string): string[] {
    // Si el valor es null o undefined, mostrar todas las sedes
    if (!value) {
      return this.sedesDisponibles();
    }

    const filterValue = value.toLowerCase().trim();

    // Si el valor está vacío después de trim, mostrar todas
    if (filterValue === '') {
      return this.sedesDisponibles();
    }

    return this.sedesDisponibles().filter(sede =>
      sede.toLowerCase().includes(filterValue)
    );
  }

  /**
   * Maneja el evento focus del input de sede para mostrar todas las opciones
   */
  onSedeInputFocus(): void {
    const sedeControl = this.vehiculoForm.get('sedeRegistro');
    if (sedeControl) {
      // Forzar actualización del observable para mostrar todas las sedes
      sedeControl.setValue(sedeControl.value || '');
    }
  }

  /**
   * Limpia el campo de sede
   */
  limpiarSede(): void {
    this.vehiculoForm.patchValue({ sedeRegistro: '' });
  }

  /**
   * Alterna la visibilidad de los campos opcionales
   */
  toggleCamposOpcionales(): void {
    this.mostrarCamposOpcionales.set(!this.mostrarCamposOpcionales());
  }

  /**
   * Formatea la placa automáticamente mientras el usuario escribe
   * Formato: XXX-123 (3 alfanuméricos, guión, 3 números)
   */
  formatearPlaca(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Solo alfanuméricos

    // Limitar a 6 caracteres (3 + 3)
    if (value.length > 6) {
      value = value.substring(0, 6);
    }

    // Formatear según el patrón XXX-123
    let formattedValue = '';

    // Primeros 3 caracteres: alfanuméricos
    for (let i = 0; i < Math.min(value.length, 3); i++) {
      const char = value[i];
      if (/[A-Z0-9]/.test(char)) {
        formattedValue += char;
      }
    }

    // Últimos 3 caracteres: solo números
    if (value.length > 3) {
      for (let i = 3; i < value.length; i++) {
        const char = value[i];
        if (/\d/.test(char)) {
          formattedValue += char;
        }
      }
    }

    // Agregar guión automáticamente después de los primeros 3 caracteres
    if (formattedValue.length > 3) {
      formattedValue = formattedValue.substring(0, 3) + '-' + formattedValue.substring(3);
    }

    // Actualizar el valor del formulario
    this.vehiculoForm.patchValue({ placa: formattedValue }, { emitEvent: false });

    // Actualizar la posición del cursor
    const cursorPosition = formattedValue.length;
    setTimeout(() => {
      input.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  }

  private initializeModalData(): void {
    const data = this.modalData() || this.dialogData;
    if (!data) {
      return;
    }

    console.log('🔍 Modo de edición:', this.isEditing());
    if (this.isEditing()) {
      this.loadVehiculo();
    } else {
      // En modo creación, pre-configurar empresa y resolución si se proporcionan
      if (data.empresaId) {
        this.vehiculoForm.patchValue({
          empresaActualId: data.empresaId
        });
      }

      if (data.resolucionId) {
        this.vehiculoForm.patchValue({ resolucionId: data.resolucionId });
      }
    }
  }

  private initializeForm(): void {
    this.vehiculoForm = this.fb.group({
      // Campos obligatorios: solo placa y sede de registro
      placa: [
        '',
        [Validators.required, placaPeruanaValidator()],
        [placaDuplicadaValidator(this.vehiculoService, undefined)]
      ],
      sedeRegistro: [this.sedeDefault(), Validators.required],

      // Campos opcionales - usando configuraciones del servicio
      empresaActualId: [''],
      resolucionId: [''],
      numeroTuc: ['', [numeroTucValidator()]],
      rutasAsignadasIds: [[]],
      marca: [''],
      modelo: [''],
      categoria: [this.configuracionService.categoriaVehiculoDefault()],
      carroceria: [this.configuracionService.tipoCarroceriaDefault()],
      anioFabricacion: [new Date().getFullYear(), [anioFabricacionValidator()]],
      estado: [this.configuracionService.estadoVehiculoDefault()],
      color: [''],
      numeroSerie: [''],
      observaciones: [''],
      asientos: [15, [capacidadPasajerosValidator()]],
      
      // Datos técnicos adicionales
      motor: [''],
      chasis: [''],
      ejes: [2],
      cilindros: [null], // Nuevo campo
      ruedas: [null], // Nuevo campo (número de llantas)
      pesoNeto: [2.500, [Validators.min(0.5)]], // Cambiado a toneladas con 3 decimales
      pesoBruto: [3.500, [Validators.min(1.0)]], // Cambiado a toneladas con 3 decimales
      cargaUtil: [{value: 1.000, disabled: true}], // Campo calculado automáticamente
      tipoCombustible: [this.configuracionService.tipoCombustibleDefault()],
      cilindrada: [null],
      potencia: [null],
      largo: [12],
      ancho: [2.5],
      alto: [3]
    });

    // Configurar listeners para auto-completar campos relacionados
    this.setupFormListeners();
  }

  /**
   * Configura listeners para auto-completar campos relacionados
   */
  private setupFormListeners(): void {
    // Listener para número de serie -> chasis
    this.vehiculoForm.get('numeroSerie')?.valueChanges.subscribe(value => {
      if (value && value.trim() && !this.vehiculoForm.get('chasis')?.value) {
        this.vehiculoForm.get('chasis')?.setValue(value, { emitEvent: false });
      }
    });

    // Listener para chasis -> número de serie
    this.vehiculoForm.get('chasis')?.valueChanges.subscribe(value => {
      if (value && value.trim() && !this.vehiculoForm.get('numeroSerie')?.value) {
        this.vehiculoForm.get('numeroSerie')?.setValue(value, { emitEvent: false });
      }
    });

    // Listener para validar que peso bruto sea mayor que peso neto
    this.vehiculoForm.get('pesoNeto')?.valueChanges.subscribe(pesoNeto => {
      const pesoBruto = this.vehiculoForm.get('pesoBruto')?.value;
      if (pesoNeto && pesoBruto && pesoNeto >= pesoBruto) {
        this.vehiculoForm.get('pesoBruto')?.setValue(pesoNeto + 0.5, { emitEvent: false });
      }
    });

    this.vehiculoForm.get('pesoBruto')?.valueChanges.subscribe(pesoBruto => {
      const pesoNeto = this.vehiculoForm.get('pesoNeto')?.value;
      if (pesoNeto && pesoBruto && pesoBruto <= pesoNeto) {
        this.vehiculoForm.get('pesoNeto')?.setValue(pesoBruto - 0.5, { emitEvent: false });
      }
    });
  }

  private loadEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        this.empresas.set(empresas.filter(e => e.estado === EstadoEmpresa.AUTORIZADA));
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
        this.snackBar.open('Error al cargar empresas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private loadVehiculo(): void {
    const data = this.modalData() || this.dialogData;
    if (!data?.vehiculo) {
      return;
    }

    this.isLoading.set(true);
    const vehiculo = data.vehiculo;

    // Cargar TODOS los datos del vehículo en el formulario PRIMERO
    this.vehiculoForm.patchValue({
      placa: vehiculo.placa,
      sedeRegistro: vehiculo.sedeRegistro,
      empresaActualId: vehiculo.empresaActualId,
      resolucionId: vehiculo.resolucionId,
      marca: vehiculo.marca || '',
      modelo: vehiculo.modelo || '',
      anioFabricacion: vehiculo.anioFabricacion || new Date().getFullYear(),
      categoria: vehiculo.categoria || 'M3',
      carroceria: vehiculo.carroceria || this.configuracionService.tipoCarroceriaDefault(),
      estado: vehiculo.estado || 'ACTIVO',
      color: vehiculo.color || '',
      numeroSerie: vehiculo.numeroSerie || '',
      observaciones: vehiculo.observaciones || '',
      numeroTuc: vehiculo.tuc?.nroTuc || '',
      rutasAsignadasIds: vehiculo.rutasAsignadasIds || [],
      asientos: vehiculo.datosTecnicos?.asientos || 15,
      motor: vehiculo.datosTecnicos?.motor || '',
      chasis: vehiculo.datosTecnicos?.chasis || '',
      ejes: vehiculo.datosTecnicos?.ejes || 2,
      cilindros: vehiculo.datosTecnicos?.cilindros || null,
      ruedas: vehiculo.datosTecnicos?.ruedas || null,
      // Convertir pesos de kg a toneladas (dividir por 1000)
      pesoNeto: vehiculo.datosTecnicos?.pesoNeto ? (vehiculo.datosTecnicos.pesoNeto / 1000) : 2.500,
      pesoBruto: vehiculo.datosTecnicos?.pesoBruto ? (vehiculo.datosTecnicos.pesoBruto / 1000) : 3.500,
      cargaUtil: vehiculo.datosTecnicos?.cargaUtil ? (vehiculo.datosTecnicos.cargaUtil / 1000) : null,
      tipoCombustible: vehiculo.datosTecnicos?.tipoCombustible || 'DIESEL',
      cilindrada: vehiculo.datosTecnicos?.cilindrada || null,
      potencia: vehiculo.datosTecnicos?.potencia || null,
      largo: vehiculo.datosTecnicos?.medidas?.largo || 12,
      ancho: vehiculo.datosTecnicos?.medidas?.ancho || 2.5,
      alto: vehiculo.datosTecnicos?.medidas?.alto || 3
    });

    // Mostrar campos opcionales si tienen valores
    if (vehiculo.datosTecnicos?.cilindrada || vehiculo.datosTecnicos?.potencia) {
      this.mostrarCamposOpcionales.set(true);
    }

    // Calcular carga útil si no existe pero hay pesos
    if (!vehiculo.datosTecnicos?.cargaUtil && vehiculo.datosTecnicos?.pesoNeto && vehiculo.datosTecnicos?.pesoBruto) {
      this.calcularCargaUtil();
    }

    // DESPUÉS establecer los signals para que los selectores reaccionen
    setTimeout(() => {
      console.log('🔍 Antes - empresaIdSeleccionada:', this.empresaIdSeleccionada());
      console.log('🔍 Antes - resolucionIdSeleccionada:', this.resolucionIdSeleccionada());
      
      this.empresaIdSeleccionada.set(vehiculo.empresaActualId || '');
      this.resolucionIdSeleccionada.set(vehiculo.resolucionId || '');
      
      console.log('🔍 Después - empresaIdSeleccionada:', this.empresaIdSeleccionada());
      console.log('🔍 Después - resolucionIdSeleccionada:', this.resolucionIdSeleccionada());
      
      // Forzar actualización de los computed signals
      this.forceUpdate.set(this.forceUpdate() + 1);
      
      console.log('- empresaIdSeleccionada:', this.empresaIdSeleccionada());
      console.log('- resolucionIdSeleccionada:', this.resolucionIdSeleccionada());
      
      this.isLoading.set(false);
    }, 200); // Aumentar el delay para asegurar que los selectores estén listos
  }

  /**
   * Convierte texto a mayúsculas en tiempo real
   */
  convertirAMayusculas(event: Event, campo: string): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value.toUpperCase();
    this.vehiculoForm.get(campo)?.setValue(valor, { emitEvent: false });
  }

  /**
   * Calcula automáticamente la carga útil basada en peso bruto - peso neto
   */
  calcularCargaUtil(): void {
    const pesoNeto = this.vehiculoForm.get('pesoNeto')?.value;
    const pesoBruto = this.vehiculoForm.get('pesoBruto')?.value;
    
    if (pesoNeto && pesoBruto && !isNaN(pesoNeto) && !isNaN(pesoBruto)) {
      const cargaUtil = pesoBruto - pesoNeto;
      this.vehiculoForm.get('cargaUtil')?.setValue(cargaUtil.toFixed(3), { emitEvent: false });
    } else {
      this.vehiculoForm.get('cargaUtil')?.setValue(null, { emitEvent: false });
    }
  }

  /**
   * Valida si la placa ya existe en el sistema
   */
  validarPlaca(): void {
    const placa = this.vehiculoForm.get('placa')?.value;

    // Validar que la placa tenga el formato correcto (XXX-000)
    if (!placa || placa.length < 7) {
      return;
    }

    // Validar formato con regex
    const formatoValido = /^[A-Z0-9]{3}-\d{3}$/.test(placa);
    if (!formatoValido) {
      return;
    }

    // Buscar vehículo por placa
    this.vehiculoService.getVehiculoByPlaca(placa).subscribe({
      next: (vehiculo) => {
        if (vehiculo) {
          this.snackBar.open(
            `⚠️ La placa ${placa} ya está registrada`,
            'Cerrar',
            { duration: 4000 }
          );
          // Limpiar la placa para que ingrese otra
          this.vehiculoForm.get('placa')?.setValue('');
        }
      },
      error: (error) => {
        console.error('Error validando placa:', error);
      }
    });
  }

  // Método para manejar la selección desde EmpresaSelectorComponent
  onEmpresaSeleccionadaSelector(empresa: Empresa | null): void {
    if (empresa) {
      // Actualizar el formulario con la empresa seleccionada
      this.vehiculoForm.patchValue({ empresaActualId: empresa.id });
      this.empresaIdSeleccionada.set(empresa.id);
    } else {
      // Limpiar selección
      this.vehiculoForm.patchValue({ empresaActualId: '', resolucionId: '' });
      this.empresaIdSeleccionada.set('');
      this.resolucionIdSeleccionada.set('');
    }
  }

  // Método para manejar cambios en el ID de empresa
  onEmpresaIdChange(empresaId: string): void {
    if (empresaId) {
      this.vehiculoForm.patchValue({ empresaActualId: empresaId });
      this.empresaIdSeleccionada.set(empresaId);
    }
  }

  // Método para manejar la selección desde ResolucionSelectorComponent
  onResolucionSeleccionadaSelector(resolucion: Resolucion | null): void {
    if (resolucion) {
      // Actualizar el formulario con la resolución seleccionada
      this.vehiculoForm.patchValue({ resolucionId: resolucion.id });
      this.resolucionIdSeleccionada.set(resolucion.id);
    } else {
      // Limpiar selección
      this.vehiculoForm.patchValue({ resolucionId: '' });
      this.resolucionIdSeleccionada.set('');
    }
  }

  // Método para manejar cambios en el ID de resolución
  onResolucionIdChange(resolucionId: string): void {
    if (resolucionId) {
      this.vehiculoForm.patchValue({ resolucionId });
      this.resolucionIdSeleccionada.set(resolucionId);
    }
  }

  onSubmit(): void {
    console.log('🔍 isEditing:', this.isEditing());
    console.log('🔍 modalData:', this.modalData());
    if (!this.vehiculoForm?.valid) {
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

  getFormErrors(): Array<{field: string, errors: string[]}> {
    const errors: Array<{field: string, errors: string[]}> = [];
    
    if (!this.vehiculoForm) return errors;
    
    Object.keys(this.vehiculoForm.controls).forEach(key => {
      const control = this.vehiculoForm.get(key);
      if (control && control.invalid && control.errors) {
        const fieldErrors: string[] = [];
        
        if (control.errors['required']) fieldErrors.push('Campo requerido');
        if (control.errors['pattern']) fieldErrors.push('Formato inválido');
        if (control.errors['minlength']) fieldErrors.push(`Mínimo ${control.errors['minlength'].requiredLength} caracteres`);
        if (control.errors['maxlength']) fieldErrors.push(`Máximo ${control.errors['maxlength'].requiredLength} caracteres`);
        if (control.errors['min']) fieldErrors.push(`Valor mínimo: ${control.errors['min'].min}`);
        if (control.errors['max']) fieldErrors.push(`Valor máximo: ${control.errors['max'].max}`);
        if (control.errors['placaPeruana']) fieldErrors.push('Formato de placa inválido');
        if (control.errors['placaDuplicada']) fieldErrors.push('Placa ya existe');
        if (control.errors['anioFabricacion']) fieldErrors.push('Año de fabricación inválido');
        
        if (fieldErrors.length > 0) {
          errors.push({ field: key, errors: fieldErrors });
        }
      }
    });
    
    return errors;
  }

  private createVehiculo(): void {
    const vehiculoData = this.buildVehiculoData();

    this.vehiculoService.createVehiculo(vehiculoData).subscribe({
      next: (vehiculo) => {
        this.snackBar.open('Vehículo creado exitosamente', 'Cerrar', { duration: 3000 });
        this.vehiculoCreated.emit(vehiculoData);
        this.isSubmitting.set(false);
        this.close();
      },
      error: (error) => {
        console.error('Error creando vehículo:', error);
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
      next: (vehiculo) => {
        this.snackBar.open('Vehículo actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.vehiculoUpdated.emit(vehiculoData);
        this.isSubmitting.set(false);
        this.close();
      },
      error: (error) => {
        console.error('❌ Error actualizando vehículo:', error);
        this.snackBar.open('Error al actualizar vehículo', 'Cerrar', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  private buildVehiculoData(): VehiculoCreate {
    const formValue = this.vehiculoForm.value;

    const vehiculoData: VehiculoCreate = {
      placa: formValue.placa!,
      empresaActualId: formValue.empresaActualId || '', // Campo requerido
      tipoServicio: 'PERSONAS', // Valor por defecto - debería venir del formulario
      marca: formValue.marca || '',
      modelo: formValue.modelo || '',
      anioFabricacion: formValue.anioFabricacion || new Date().getFullYear(),
      sedeRegistro: formValue.sedeRegistro!,
      categoria: formValue.categoria || 'M3',
      carroceria: formValue.carroceria || this.configuracionService.tipoCarroceriaDefault(),
      color: formValue.color || '',
      numeroSerie: formValue.numeroSerie || '',
      observaciones: formValue.observaciones || '',
      rutasAsignadasIds: formValue.rutasAsignadasIds || [],
      datosTecnicos: {
        motor: formValue.motor || '',
        chasis: formValue.chasis || '',
        ejes: formValue.ejes || 2,
        cilindros: formValue.cilindros || undefined,
        ruedas: formValue.ruedas || undefined,
        asientos: formValue.asientos || 15,
        // Convertir pesos de toneladas a kilogramos (multiplicar por 1000)
        pesoNeto: formValue.pesoNeto ? Math.round(formValue.pesoNeto * 1000) : 2500,
        pesoBruto: formValue.pesoBruto ? Math.round(formValue.pesoBruto * 1000) : 3500,
        cargaUtil: formValue.cargaUtil ? Math.round(formValue.cargaUtil * 1000) : undefined,
        tipoCombustible: formValue.tipoCombustible || 'DIESEL',
        cilindrada: formValue.cilindrada || undefined,
        potencia: formValue.potencia || undefined,
        medidas: {
          largo: formValue.largo || 12,
          ancho: formValue.ancho || 2.5,
          alto: formValue.alto || 3
        }
      }
    };

    // Solo agregar resolucionId si tiene valor
    if (formValue.resolucionId && formValue.resolucionId.trim() !== '') {
      vehiculoData.resolucionId = formValue.resolucionId;
    }

    // Solo agregar TUC si tiene valor
    if (formValue.numeroTuc && formValue.numeroTuc.trim() !== '') {
      vehiculoData.tuc = {
        nroTuc: formValue.numeroTuc,
        fechaEmision: new Date().toISOString()
      };
    }

    return vehiculoData;
  }

  private buildVehiculoUpdateData(): VehiculoUpdate {
    const formValue = this.vehiculoForm.value;

    const vehiculoData: VehiculoUpdate = {
      placa: formValue.placa,
      empresaActualId: formValue.empresaActualId,
      resolucionId: formValue.resolucionId,
      marca: formValue.marca,
      modelo: formValue.modelo,
      anioFabricacion: formValue.anioFabricacion,
      sedeRegistro: formValue.sedeRegistro,
      categoria: formValue.categoria,
      carroceria: formValue.carroceria,
      estado: formValue.estado,
      rutasAsignadasIds: formValue.rutasAsignadasIds || [],
      datosTecnicos: {
        motor: formValue.motor || '',
        chasis: formValue.chasis || '',
        ejes: formValue.ejes || 2,
        cilindros: formValue.cilindros || undefined,
        ruedas: formValue.ruedas || undefined,
        asientos: formValue.asientos || 15,
        // Convertir pesos de toneladas a kilogramos (multiplicar por 1000)
        pesoNeto: formValue.pesoNeto ? Math.round(formValue.pesoNeto * 1000) : 2500,
        pesoBruto: formValue.pesoBruto ? Math.round(formValue.pesoBruto * 1000) : 3500,
        cargaUtil: formValue.cargaUtil ? Math.round(formValue.cargaUtil * 1000) : undefined,
        tipoCombustible: formValue.tipoCombustible || 'DIESEL',
        cilindrada: formValue.cilindrada,
        potencia: formValue.potencia,
        medidas: {
          largo: formValue.largo || 12,
          ancho: formValue.ancho || 2.5,
          alto: formValue.alto || 3
        }
      }
    };

    // Solo agregar TUC si tiene valor
    if (formValue.numeroTuc && formValue.numeroTuc.trim() !== '') {
      vehiculoData.tuc = {
        nroTuc: formValue.numeroTuc,
        fechaEmision: new Date().toISOString()
      };
    }

    return vehiculoData;
  }

  /**
   * Formatea el nombre de una sede para mostrar en la UI
   */
  formatSedeNombre(sede: string): string {
    if (!sede) return '';
    // Convierte "PUNO" a "Puno", "LIMA" a "Lima", etc.
    return sede.charAt(0).toUpperCase() + sede.slice(1).toLowerCase();
  }

  close(): void {
    this.modalClosed.emit();
    this.dialogRef.close();
  }

  /**
   * Obtener año actual para validación
   */
  getCurrentYear(): number {
    return new Date().getFullYear();
  }
}