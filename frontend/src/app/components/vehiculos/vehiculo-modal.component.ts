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
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { RutaService } from '../../services/ruta.service';
import { Vehiculo, VehiculoCreate, VehiculoUpdate, DatosTecnicos } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Ruta } from '../../models/ruta.model';
import { Observable, of, forkJoin } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

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
    EmpresaSelectorComponent
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
                    <app-smart-icon [iconName]="'business'" matSuffix></app-smart-icon>
                    <button matSuffix mat-icon-button 
                            type="button" 
                            (click)="limpiarEmpresa()"
                            *ngIf="empresaControl.value"
                            matTooltip="Limpiar empresa">
                      <app-smart-icon [iconName]="'clear'" [size]="20"></app-smart-icon>
                    </button>
                    @if (cantidadVehiculosEmpresa() > 0) {
                      <mat-hint>
                        <span class="vehiculos-count">
                          <app-smart-icon [iconName]="'directions_car'" [size]="16"></app-smart-icon>
                          {{ cantidadVehiculosEmpresa() }} vehículo(s) actual(es)
                        </span>
                      </mat-hint>
                    } @else {
                      <mat-hint>Empresa propietaria del vehículo</mat-hint>
                    }
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
                  <!-- Campo obligatorio: Placa -->
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Placa *</mat-label>
                    <input matInput 
                           formControlName="placa" 
                           placeholder="Ej: ABC-123" 
                           (input)="convertirAMayusculas($event, 'placa')" 
                           (blur)="validarPlaca()"
                           required>
                    <app-smart-icon [iconName]="'directions_car'" [size]="20" matSuffix></app-smart-icon>
                    <mat-hint>Formato: XXX-000 (3 letras, guión, 3-4 números)</mat-hint>
                    <mat-error *ngIf="vehiculoForm.get('placa')?.hasError('required')">
                      La placa es obligatoria
                    </mat-error>
                    <mat-error *ngIf="vehiculoForm.get('placa')?.hasError('pattern')">
                      Formato de placa inválido
                    </mat-error>
                  </mat-form-field>
                  
                  <!-- Alerta de placa existente -->
                  @if (mostrarOpcionesPlacaExistente() && vehiculoExistente()) {
                    <div class="placa-existente-alert">
                      <mat-card class="alert-card warning">
                        <mat-card-content>
                          <div class="alert-header">
                            <app-smart-icon [iconName]="'warning'" [size]="24" class="warning-icon"></app-smart-icon>
                            <h4>Placa ya registrada</h4>
                          </div>
                          <p class="alert-message">
                            La placa <strong>{{ vehiculoExistente()?.placa }}</strong> ya está registrada.
                          </p>
                          <div class="vehiculo-info-existente">
                            <p><strong>Empresa actual:</strong> {{ getEmpresaNombre(vehiculoExistente()?.empresaActualId || '') }}</p>
                            <p><strong>Marca/Modelo:</strong> {{ vehiculoExistente()?.marca }} {{ vehiculoExistente()?.modelo }}</p>
                            <p><strong>Año:</strong> {{ vehiculoExistente()?.anioFabricacion }}</p>
                          </div>
                          <div class="alert-actions">
                            <button mat-raised-button color="primary" (click)="transferirVehiculoExistente()" type="button">
                              <app-smart-icon [iconName]="'swap_horiz'" [size]="20"></app-smart-icon>
                              Transferir a Nueva Empresa
                            </button>
                            <button mat-raised-button color="accent" (click)="editarVehiculoExistente()" type="button">
                              <app-smart-icon [iconName]="'edit'" [size]="20"></app-smart-icon>
                              Editar Información
                            </button>
                            <button mat-button (click)="cancelarPlacaExistente()" type="button">
                              <app-smart-icon [iconName]="'cancel'" [size]="20"></app-smart-icon>
                              Cancelar
                            </button>
                          </div>
                        </mat-card-content>
                      </mat-card>
                    </div>
                  }

                  <!-- Campo obligatorio: Sede de Registro con buscador -->
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Sede de Registro *</mat-label>
                    <input matInput 
                           formControlName="sedeRegistro"
                           placeholder="Buscar sede..."
                           [matAutocomplete]="sedeAuto"
                           required>
                    <mat-autocomplete #sedeAuto="matAutocomplete">
                      @for (sede of sedesFiltradas | async; track sede) {
                        <mat-option [value]="sede">
                          <div class="sede-option">
                            <app-smart-icon [iconName]="'location_city'" [size]="20"></app-smart-icon>
                            <span>{{ sede }}</span>
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
                    <mat-hint>Año de fabricación</mat-hint>
                    <mat-error *ngIf="vehiculoForm.get('anioFabricacion')?.hasError('min') || vehiculoForm.get('anioFabricacion')?.hasError('max')">
                      Año inválido
                    </mat-error>
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
                    <app-smart-icon [iconName]="'category'" [size]="20" matSuffix></app-smart-icon>
                    <mat-hint>Categoría del vehículo</mat-hint>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Número de Asientos</mat-label>
                    <input matInput formControlName="asientos" type="number" placeholder="Ej: 45">
                    <app-smart-icon [iconName]="'airline_seat_recline_normal'" [size]="20" matSuffix></app-smart-icon>
                    <mat-hint>Número de asientos</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Número de TUC</mat-label>
                    <input matInput formControlName="numeroTuc" placeholder="Ej: T-123456-2025" (input)="convertirAMayusculas($event, 'numeroTuc')">
                    <app-smart-icon [iconName]="'receipt'" [size]="20" matSuffix></app-smart-icon>
                    <mat-hint>Número del TUC</mat-hint>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Estado</mat-label>
                    <mat-select formControlName="estado">
                      <mat-option value="ACTIVO">ACTIVO</mat-option>
                      <mat-option value="INACTIVO">INACTIVO</mat-option>
                      <mat-option value="MANTENIMIENTO">MANTENIMIENTO</mat-option>
                      <mat-option value="SUSPENDIDO">SUSPENDIDO</mat-option>
                    </mat-select>
                    <app-smart-icon [iconName]="'check_circle'" [size]="20" matSuffix></app-smart-icon>
                    <mat-hint>Estado actual del vehículo</mat-hint>
                  </mat-form-field>
                </div>

                <!-- Datos Técnicos Detallados -->
                <mat-divider class="section-divider"></mat-divider>
                <h4 class="section-subtitle">
                  <app-smart-icon [iconName]="'settings'" [size]="20"></app-smart-icon>
                  Especificaciones Técnicas Detalladas
                </h4>
                
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
              </div>
            </mat-expansion-panel>

          </form>
        </div>
      }

      <!-- Lista de vehículos creados (modo múltiple) -->
      @if (isBatchMode() && vehiculosCreados().length > 0) {
        <div class="vehiculos-creados-section">
          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <app-smart-icon [iconName]="'check_circle'" [size]="24"></app-smart-icon>
                Vehículos Agregados ({{ vehiculosCreados().length }})
              </mat-card-title>
              
              <!-- Acciones en bloque -->
              @if (vehiculosSeleccionados().length > 0) {
                <div class="bulk-actions">
                  <span class="selection-count">{{ vehiculosSeleccionados().length }} seleccionado(s)</span>
                  <button mat-raised-button 
                          color="accent"
                          (click)="agregarRutasEnBloque()"
                          class="bulk-action-button">
                    <app-smart-icon [iconName]="'add_road'" [size]="20"></app-smart-icon>
                    Agregar Rutas
                  </button>
                  <button mat-button 
                          (click)="limpiarSeleccion()"
                          class="clear-selection-button">
                    <app-smart-icon [iconName]="'clear'" [size]="20"></app-smart-icon>
                    Limpiar
                  </button>
                </div>
              }
            </mat-card-header>
            <mat-card-content>
              <div class="vehiculos-lista">
                @for (vehiculo of vehiculosCreados(); track $index) {
                  <div class="vehiculo-item" [class.selected]="isVehiculoSeleccionado($index)">
                    <!-- Checkbox para selección -->
                    <mat-checkbox 
                      [checked]="isVehiculoSeleccionado($index)"
                      (change)="toggleVehiculoSeleccion($index)"
                      class="vehiculo-checkbox">
                    </mat-checkbox>
                    
                    <div class="vehiculo-info">
                      <div class="vehiculo-info-main">
                        <strong>{{ vehiculo.placa }}</strong>
                        <span>{{ vehiculo.marca || 'Sin marca' }} {{ vehiculo.modelo || '' }}</span>
                      </div>
                      <div class="vehiculo-info-details">
                        <small>{{ vehiculo.anioFabricacion || 'Sin año' }}</small>
                        @if (vehiculo.rutasAsignadasIds && vehiculo.rutasAsignadasIds.length > 0) {
                          <small class="rutas-badge">
                            <app-smart-icon [iconName]="'route'" [size]="14"></app-smart-icon>
                            {{ vehiculo.rutasAsignadasIds.length }} ruta(s)
                          </small>
                        }
                      </div>
                    </div>
                    <div class="vehiculo-actions">
                      <button mat-icon-button 
                              color="primary"
                              (click)="abrirModalEditarVehiculo($index)"
                              matTooltip="Editar vehículo">
                        <app-smart-icon [iconName]="'edit'" [size]="20" [clickable]="true"></app-smart-icon>
                      </button>
                      <button mat-icon-button 
                              color="accent"
                              (click)="abrirModalAgregarRutas($index)"
                              matTooltip="Agregar rutas">
                        <app-smart-icon [iconName]="'add_road'" [size]="20" [clickable]="true"></app-smart-icon>
                      </button>
                      <button mat-icon-button 
                              color="warn" 
                              (click)="removerVehiculo($index)"
                              matTooltip="Remover vehículo">
                        <app-smart-icon [iconName]="'delete'" [size]="20" [clickable]="true"></app-smart-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <!-- Footer del modal con botones de acción -->
      <div class="modal-footer">
        <div class="footer-actions">
          <button mat-stroked-button (click)="close()" class="cancel-button">
            <app-smart-icon [iconName]="'cancel'" [size]="20"></app-smart-icon>
            Cancelar
          </button>
          
          @if (isBatchMode()) {
            <!-- Botones para modo múltiple -->
            <button mat-button 
                    color="accent"
                    (click)="agregarVehiculoALista()" 
                    [disabled]="!vehiculoForm.valid"
                    class="add-to-list-button">
              <app-smart-icon [iconName]="'add'" [size]="20"></app-smart-icon>
              Agregar a Lista
            </button>
            
            <button mat-raised-button 
                    color="primary" 
                    (click)="guardarTodosVehiculos()" 
                    [disabled]="vehiculosCreados().length === 0 || isSubmitting()"
                    class="submit-button">
              <app-smart-icon [iconName]="isSubmitting() ? 'hourglass_empty' : 'save'" [size]="20"></app-smart-icon>
              <span *ngIf="!isSubmitting()">Guardar {{ vehiculosCreados().length }} Vehículo(s)</span>
              <span *ngIf="isSubmitting()">Guardando...</span>
            </button>
          } @else {
            <!-- Botón para modo individual -->
            <button mat-raised-button 
                    color="primary" 
                    (click)="onSubmit()" 
                    [disabled]="!vehiculoForm.valid || isSubmitting()"
                    class="submit-button">
              <app-smart-icon [iconName]="isEditing() ? 'save' : 'add'" [size]="20"></app-smart-icon>
              <span *ngIf="!isSubmitting()">{{ isEditing() ? 'Guardar Cambios' : 'Crear Vehículo' }}</span>
              <span *ngIf="isSubmitting()">Procesando...</span>
            </button>
          }
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

    .modo-multiple-toggle {
      margin-top: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
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

    .section-divider {
      margin: 24px 0 16px 0;
    }

    .section-subtitle {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 16px 0;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }

    .expansion-content {
      padding: 16px;
    }

    .panel-title-text {
      margin-left: 8px;
    }

    .placa-existente-alert {
      grid-column: 1 / -1;
      margin-top: 16px;
    }

    .alert-card {
      border-left: 4px solid #ff9800;
      background: #fff3e0;
    }

    .alert-card.warning {
      border-left-color: #ff9800;
    }

    .alert-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .alert-header h4 {
      margin: 0;
      color: #e65100;
      font-size: 16px;
      font-weight: 600;
    }

    .warning-icon {
      color: #ff9800;
    }

    .alert-message {
      margin: 8px 0;
      color: #666;
    }

    .vehiculo-info-existente {
      background: white;
      padding: 12px;
      border-radius: 4px;
      margin: 12px 0;
    }

    .vehiculo-info-existente p {
      margin: 4px 0;
      font-size: 14px;
    }

    .alert-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      flex-wrap: wrap;
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

    .vehiculos-creados-section {
      padding: 0 24px;
      margin-bottom: 24px;
    }

    .bulk-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: auto;
    }

    .selection-count {
      font-size: 14px;
      color: #1976d2;
      font-weight: 500;
    }

    .bulk-action-button {
      min-width: 140px;
    }

    .clear-selection-button {
      min-width: 100px;
    }

    .vehiculo-checkbox {
      margin-right: 12px;
    }

    .vehiculo-item.selected {
      background: #e3f2fd;
      border-color: #1976d2;
    }

    .vehiculos-lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;
    }

    .vehiculo-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      transition: all 0.2s ease;
    }

    .vehiculo-item:hover {
      background: #eeeeee;
      border-color: #d0d0d0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .vehiculo-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .vehiculo-info-main {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .vehiculo-info-main strong {
      font-size: 16px;
      color: #1976d2;
      font-weight: 600;
    }

    .vehiculo-info-main span {
      font-size: 14px;
      color: #666;
    }

    .vehiculo-info-details {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .vehiculo-info-details small {
      font-size: 12px;
      color: #999;
    }

    .rutas-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 12px;
      font-weight: 500;
    }

    .vehiculo-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .add-to-list-button {
      min-width: 140px;
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
  
  // Watcher para modalData usando effect
  private modalDataWatcher = effect(() => {
    const data = this.modalData();
    if (data && this.vehiculoForm) {
      this.initializeModalData();
    }
  });
  
  // Watcher para dialogData usando effect
  private dialogDataWatcher = effect(() => {
    const data = this.dialogData;
    if (data && this.vehiculoForm) {
      this.initializeModalData();
    }
  });
  
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
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef);

  // Estado del componente
  isLoading = signal(false);
  isSubmitting = signal(false);
  vehiculosCreados = signal<VehiculoCreate[]>([]);
  vehiculosSeleccionados = signal<number[]>([]); // Índices de vehículos seleccionados
  mostrarListaVehiculos = signal(false);
  modoMultiple = signal(true); // Modo múltiple activado por defecto
  
  // Sedes disponibles (configurables desde Configuración)
  sedesDisponibles = signal<string[]>([
    'Puno',
    'Arequipa', 
    'Lima',
    'Cusco',
    'Juliaca',
    'Tacna'
  ]);
  
  // Observable para autocompletado de sedes
  sedesFiltradas!: Observable<string[]>;
  
  // Validación de placa
  vehiculoExistente = signal<Vehiculo | null>(null);
  mostrarOpcionesPlacaExistente = signal(false);
  
  // Contador de vehículos
  vehiculosActuales = signal<Vehiculo[]>([]);
  
  cantidadVehiculosEmpresa = computed(() => {
    const empresaId = this.vehiculoForm?.get('empresaActualId')?.value;
    if (!empresaId) return 0;
    return this.vehiculosActuales().filter(v => v.empresaActualId === empresaId).length;
  });
  
  cantidadVehiculosResolucion = computed(() => {
    const resolucionId = this.vehiculoForm?.get('resolucionId')?.value;
    if (!resolucionId) return 0;
    return this.vehiculosActuales().filter(v => v.resolucionId === resolucionId).length;
  });
  
  isEditing = computed(() => {
    const data = this.modalData() || this.dialogData;
    return data?.mode === 'edit';
  });
  
  isBatchMode = computed(() => {
    const data = this.modalData() || this.dialogData;
    return data?.mode === 'batch' || data?.allowMultiple === true || this.modoMultiple();
  });
  
  allowChangeEmpresa = computed(() => {
    const data = this.modalData() || this.dialogData;
    return !data?.empresaId; // Solo permitir cambiar empresa si no viene predefinida
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
    this.loadVehiculosActuales();
    this.configurarAutocompletadoSedes();
    
    // Inicializar datos del modal después de un breve delay para asegurar que todo esté listo
    setTimeout(() => {
      this.initializeModalData();
    }, 100);
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
    const filterValue = value.toLowerCase();
    return this.sedesDisponibles().filter(sede => 
      sede.toLowerCase().includes(filterValue)
    );
  }

  private initializeModalData(): void {
    const data = this.modalData() || this.dialogData;
    if (!data) return;
    
    if (this.isEditing()) {
      this.loadVehiculo();
    } else {
      // En modo creación, pre-configurar empresa y resolución si se proporcionan
      if (data.empresaId) {
        // Buscar la empresa por ID para pre-seleccionarla en el autocompletado
        const empresa = this.empresas().find(e => e.id === data.empresaId);
        if (empresa) {
          // Configurar tanto el FormControl del autocompletado como el campo del formulario
          this.empresaControl.setValue(empresa);
          this.vehiculoForm.patchValue({
            empresaActualId: empresa.id
          });
          
          // Cargar resoluciones para esta empresa
          this.loadResoluciones(data.empresaId);
          
          // Habilitar el campo de resolución ya que hay empresa seleccionada
          this.vehiculoForm.get('resolucionId')?.enable();
          
          // Si también hay resolución, pre-configurarla
          if (data.resolucionId) {
            this.vehiculoForm.patchValue({ resolucionId: data.resolucionId });
            this.loadRutasDisponibles(data.resolucionId);
            // También habilitar el campo de rutas
            this.vehiculoForm.get('rutasAsignadasIds')?.enable();
          }
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
      // Campos obligatorios: solo placa y sede de registro
      placa: ['', [Validators.required, Validators.pattern(/^[A-Z]{1,3}-\d{3,4}$/)]],
      sedeRegistro: ['', Validators.required],
      
      // Campos opcionales
      empresaActualId: [''],
      resolucionId: [''],
      numeroTuc: [''],
      rutasAsignadasIds: [[]],
      marca: [''],
      modelo: [''],
      categoria: ['M3'],
      asientos: [''],
      anioFabricacion: ['', [Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
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

  /**
   * Carga las resoluciones de una empresa específica
   */
  private cargarResoluciones(empresaId: string): void {
    if (!empresaId) {
      this.resoluciones.set([]);
      return;
    }

    this.resolucionService.getResolucionesPorEmpresa(empresaId).subscribe({
      next: (resoluciones) => {
        this.resoluciones.set(resoluciones.filter(r => r.estaActivo && r.estado === 'VIGENTE'));
        console.log('✅ Resoluciones cargadas para empresa:', empresaId, resoluciones.length);
      },
      error: (error) => {
        console.error('❌ Error cargando resoluciones:', error);
        this.resoluciones.set([]);
        this.snackBar.open('Error al cargar resoluciones', 'Cerrar', { duration: 3000 });
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

  // Método para manejar la selección de empresa desde EmpresaSelectorComponent
  onEmpresaSeleccionada(empresa: Empresa | null): void {
    if (empresa) {
      console.log('🏢 Empresa seleccionada:', empresa);
      this.vehiculoForm.patchValue({ empresaId: empresa.id });
      this.cargarResoluciones(empresa.id);
    } else {
      console.log('🏢 Empresa deseleccionada');
      this.vehiculoForm.patchValue({ empresaId: '', resolucionId: '' });
      this.resoluciones.set([]);
    }
  }

  // Método para manejar la selección de empresa (método existente)
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
      // Habilitar el control de rutas cuando hay resolución seleccionada
      this.vehiculoForm.get('rutasAsignadasIds')?.enable();
    } else {
      this.rutasDisponibles.set([]);
      // Deshabilitar el control de rutas cuando no hay resolución
      this.vehiculoForm.get('rutasAsignadasIds')?.disable();
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
    
    // Limpiar y deshabilitar campo de rutas
    this.vehiculoForm.patchValue({ rutasAsignadasIds: [] });
    this.vehiculoForm.get('rutasAsignadasIds')?.disable();
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

  // Método para agregar vehículo a la lista (modo múltiple)
  agregarVehiculoALista(): void {
    if (this.vehiculoForm.valid) {
      const vehiculoData = this.prepararDatosVehiculo();
      
      // Verificar que la placa no esté duplicada en la lista
      const placaExiste = this.vehiculosCreados().some(v => v.placa === vehiculoData.placa);
      if (placaExiste) {
        this.snackBar.open('La placa ya está en la lista', 'Cerrar', { duration: 3000 });
        return;
      }
      
      // Agregar a la lista
      this.vehiculosCreados.update(vehiculos => [...vehiculos, vehiculoData]);
      
      // Limpiar formulario para el siguiente vehículo
      this.limpiarFormularioParaSiguiente();
      
      this.snackBar.open(`Vehículo ${vehiculoData.placa} agregado a la lista`, 'Cerrar', { 
        duration: 2000 
      });
    }
  }

  // Método para guardar todos los vehículos de la lista
  guardarTodosVehiculos(): void {
    if (this.vehiculosCreados().length === 0) return;
    
    this.isSubmitting.set(true);
    
    // Crear todos los vehículos usando forkJoin para ejecutar en paralelo
    const vehiculosParaCrear = this.vehiculosCreados();
    const observables = vehiculosParaCrear.map(vehiculo => 
      this.vehiculoService.createVehiculo(vehiculo)
    );
    
    forkJoin(observables).subscribe({
      next: (vehiculosCreados: Vehiculo[]) => {
        this.snackBar.open(
          `${vehiculosCreados.length} vehículo(s) creado(s) exitosamente`, 
          'Cerrar', 
          { duration: 3000 }
        );
        
        // Emitir eventos para cada vehículo creado
        vehiculosCreados.forEach(vehiculo => {
          this.vehiculoCreated.emit(vehiculo);
        });
        
        this.isSubmitting.set(false);
        this.close();
      },
      error: (error: any) => {
        console.error('Error creando vehículos:', error);
        this.snackBar.open('Error al crear vehículos', 'Cerrar', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  // Método para remover vehículo de la lista
  removerVehiculo(index: number): void {
    this.vehiculosCreados.update(vehiculos => 
      vehiculos.filter((_, i) => i !== index)
    );
    
    this.snackBar.open('Vehículo removido de la lista', 'Cerrar', { duration: 2000 });
  }

  // Método para limpiar formulario manteniendo empresa, resolución y sede
  private limpiarFormularioParaSiguiente(): void {
    const empresaActualId = this.vehiculoForm.get('empresaActualId')?.value;
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    const sedeRegistro = this.vehiculoForm.get('sedeRegistro')?.value;
    
    // Resetear solo los campos del vehículo, no empresa, resolución ni sede
    this.vehiculoForm.patchValue({
      placa: '',
      marca: '',
      modelo: '',
      anioFabricacion: '',
      numeroTuc: '',
      rutasAsignadasIds: [],
      categoria: 'M3',
      estado: 'ACTIVO'
    });
    
    // Mantener empresa, resolución y sede seleccionadas
    this.vehiculoForm.patchValue({
      empresaActualId,
      resolucionId,
      sedeRegistro
    });
    
    // Focus en el campo de placa para el siguiente vehículo
    setTimeout(() => {
      const placaInput = document.querySelector('input[formControlName="placa"]') as HTMLInputElement;
      if (placaInput) {
        placaInput.focus();
      }
    }, 100);
  }

  // Método para preparar datos del vehículo
  private prepararDatosVehiculo(): VehiculoCreate {
    const formValue = this.vehiculoForm.value;
    
    return {
      placa: formValue.placa,
      empresaActualId: formValue.empresaActualId || '',
      resolucionId: formValue.resolucionId || '',
      rutasAsignadasIds: formValue.rutasAsignadasIds || [],
      categoria: formValue.categoria || 'M3',
      marca: formValue.marca || '',
      modelo: formValue.modelo || '',
      anioFabricacion: formValue.anioFabricacion || new Date().getFullYear(),
      sedeRegistro: formValue.sedeRegistro, // Nuevo campo obligatorio
      tuc: formValue.numeroTuc ? {
        nroTuc: formValue.numeroTuc,
        fechaEmision: new Date().toISOString()
      } : undefined,
      datosTecnicos: {
        motor: formValue.datosTecnicos?.motor || '',
        chasis: formValue.datosTecnicos?.chasis || '',
        cilindros: formValue.datosTecnicos?.cilindros || 0,
        ejes: formValue.datosTecnicos?.ejes || 0,
        ruedas: formValue.datosTecnicos?.ruedas || 0,
        asientos: formValue.datosTecnicos?.asientos || 0,
        pesoNeto: formValue.datosTecnicos?.pesoNeto || 0,
        pesoBruto: formValue.datosTecnicos?.pesoBruto || 0,
        medidas: {
          largo: formValue.datosTecnicos?.medidas?.largo || 0,
          ancho: formValue.datosTecnicos?.medidas?.ancho || 0,
          alto: formValue.datosTecnicos?.medidas?.alto || 0
        }
      }
    };
  }

  /**
   * Alterna entre modo individual y modo múltiple
   */
  toggleModoMultiple(): void {
    this.modoMultiple.update(value => !value);
    
    if (this.modoMultiple()) {
      this.snackBar.open(
        'Modo múltiple activado. Puedes agregar varios vehículos a la lista', 
        'Entendido', 
        { duration: 4000 }
      );
    } else {
      // Si desactiva el modo múltiple, limpiar la lista
      if (this.vehiculosCreados().length > 0) {
        const confirmar = confirm('¿Deseas limpiar la lista de vehículos agregados?');
        if (confirmar) {
          this.vehiculosCreados.set([]);
        } else {
          // Si no confirma, mantener el modo múltiple activo
          this.modoMultiple.set(true);
        }
      }
    }
  }

  /**
   * Edita un vehículo de la lista
   */
  editarVehiculoLista(index: number): void {
    const vehiculo = this.vehiculosCreados()[index];
    
    // Cargar los datos del vehículo en el formulario
    this.vehiculoForm.patchValue({
      placa: vehiculo.placa,
      empresaActualId: vehiculo.empresaActualId,
      resolucionId: vehiculo.resolucionId,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anioFabricacion: vehiculo.anioFabricacion,
      categoria: vehiculo.categoria,
      rutasAsignadasIds: vehiculo.rutasAsignadasIds || [],
      numeroTuc: vehiculo.tuc?.nroTuc || '',
      datosTecnicos: vehiculo.datosTecnicos
    });
    
    // Remover el vehículo de la lista para que pueda ser re-agregado después de editar
    this.removerVehiculo(index);
    
    this.snackBar.open(
      'Vehículo cargado en el formulario. Modifica los datos y agrégalo nuevamente', 
      'Entendido', 
      { duration: 4000 }
    );
    
    // Scroll al formulario
    setTimeout(() => {
      const formElement = document.querySelector('.form-container');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  /**
   * Abre un diálogo para agregar rutas a un vehículo específico
   */
  agregarRutasVehiculo(index: number): void {
    const vehiculo = this.vehiculosCreados()[index];
    
    // Verificar que tenga resolución
    if (!vehiculo.resolucionId) {
      this.snackBar.open(
        'El vehículo debe tener una resolución asignada para agregar rutas', 
        'Cerrar', 
        { duration: 3000 }
      );
      return;
    }
    
    // Cargar rutas disponibles para la resolución
    this.rutaService.getRutasPorResolucion(vehiculo.resolucionId).subscribe({
      next: (rutas) => {
        // Crear un diálogo simple para seleccionar rutas
        const rutasSeleccionadas = vehiculo.rutasAsignadasIds || [];
        const rutasDisponibles = rutas.filter(r => !rutasSeleccionadas.includes(r.id));
        
        if (rutasDisponibles.length === 0) {
          this.snackBar.open(
            'No hay rutas disponibles para esta resolución', 
            'Cerrar', 
            { duration: 3000 }
          );
          return;
        }
        
        // Por ahora, mostrar mensaje informativo
        // En una implementación completa, aquí se abriría un diálogo de selección
        this.snackBar.open(
          `Vehículo ${vehiculo.placa}: ${rutasDisponibles.length} ruta(s) disponible(s). Edita el vehículo para asignar rutas.`, 
          'Entendido', 
          { duration: 5000 }
        );
      },
      error: (error) => {
        console.error('Error cargando rutas:', error);
        this.snackBar.open('Error al cargar rutas disponibles', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Verifica si un vehículo está seleccionado
   */
  isVehiculoSeleccionado(index: number): boolean {
    return this.vehiculosSeleccionados().includes(index);
  }

  /**
   * Alterna la selección de un vehículo
   */
  toggleVehiculoSeleccion(index: number): void {
    const seleccionados = this.vehiculosSeleccionados();
    if (seleccionados.includes(index)) {
      this.vehiculosSeleccionados.set(seleccionados.filter(i => i !== index));
    } else {
      this.vehiculosSeleccionados.set([...seleccionados, index]);
    }
  }

  /**
   * Limpia la selección de vehículos
   */
  limpiarSeleccion(): void {
    this.vehiculosSeleccionados.set([]);
  }

  /**
   * Abre modal para editar un vehículo
   */
  abrirModalEditarVehiculo(index: number): void {
    const vehiculo = this.vehiculosCreados()[index];
    
    // Crear un diálogo simple para editar
    const dialogRef = this.dialog.open(EditarVehiculoDialogComponent, {
      width: '600px',
      data: { vehiculo, index }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Actualizar el vehículo en la lista
        this.vehiculosCreados.update(vehiculos => {
          const nuevaLista = [...vehiculos];
          nuevaLista[index] = result;
          return nuevaLista;
        });
        
        this.snackBar.open('Vehículo actualizado en la lista', 'Cerrar', { duration: 2000 });
      }
    });
  }

  /**
   * Abre modal para agregar rutas a un vehículo
   */
  abrirModalAgregarRutas(index: number): void {
    const vehiculo = this.vehiculosCreados()[index];
    
    // Verificar que tenga resolución
    if (!vehiculo.resolucionId) {
      this.snackBar.open(
        'El vehículo debe tener una resolución asignada para agregar rutas', 
        'Cerrar', 
        { duration: 3000 }
      );
      return;
    }

    // Abrir diálogo de selección de rutas
    const dialogRef = this.dialog.open(AgregarRutasDialogComponent, {
      width: '700px',
      data: { 
        vehiculo, 
        index,
        resolucionId: vehiculo.resolucionId 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.rutasIds) {
        // Actualizar las rutas del vehículo
        this.vehiculosCreados.update(vehiculos => {
          const nuevaLista = [...vehiculos];
          nuevaLista[index].rutasAsignadasIds = result.rutasIds;
          return nuevaLista;
        });
        
        this.snackBar.open(
          `${result.rutasIds.length} ruta(s) asignada(s) al vehículo ${vehiculo.placa}`, 
          'Cerrar', 
          { duration: 3000 }
        );
      }
    });
  }

  /**
   * Agrega rutas en bloque a los vehículos seleccionados
   */
  agregarRutasEnBloque(): void {
    const seleccionados = this.vehiculosSeleccionados();
    
    if (seleccionados.length === 0) {
      this.snackBar.open('No hay vehículos seleccionados', 'Cerrar', { duration: 2000 });
      return;
    }

    // Verificar que todos tengan resolución
    const vehiculosSinResolucion = seleccionados.filter(index => {
      const vehiculo = this.vehiculosCreados()[index];
      return !vehiculo.resolucionId;
    });

    if (vehiculosSinResolucion.length > 0) {
      this.snackBar.open(
        `${vehiculosSinResolucion.length} vehículo(s) no tienen resolución asignada`, 
        'Cerrar', 
        { duration: 3000 }
      );
      return;
    }

    // Abrir diálogo para seleccionar rutas
    const dialogRef = this.dialog.open(AgregarRutasDialogComponent, {
      width: '700px',
      data: { 
        vehiculos: seleccionados.map(i => this.vehiculosCreados()[i]),
        indices: seleccionados,
        modoBloque: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.rutasIds) {
        // Actualizar las rutas de todos los vehículos seleccionados
        this.vehiculosCreados.update(vehiculos => {
          const nuevaLista = [...vehiculos];
          seleccionados.forEach(index => {
            nuevaLista[index].rutasAsignadasIds = result.rutasIds;
          });
          return nuevaLista;
        });
        
        this.snackBar.open(
          `${result.rutasIds.length} ruta(s) asignada(s) a ${seleccionados.length} vehículo(s)`, 
          'Cerrar', 
          { duration: 3000 }
        );
        
        // Limpiar selección
        this.limpiarSeleccion();
      }
    });
  }

  /**
   * Obtiene el nombre de una empresa por su ID
   */
  getEmpresaNombre(empresaId: string): string {
    const empresa = this.empresas().find(e => e.id === empresaId);
    return empresa?.razonSocial?.principal || 'Empresa desconocida';
  }

  /**
   * Valida si la placa ya existe en el sistema
   */
  validarPlaca(): void {
    const placa = this.vehiculoForm.get('placa')?.value;
    
    if (!placa || placa.length < 6) {
      this.vehiculoExistente.set(null);
      this.mostrarOpcionesPlacaExistente.set(false);
      return;
    }

    // Buscar vehículo por placa
    this.vehiculoService.getVehiculoByPlaca(placa).subscribe({
      next: (vehiculo) => {
        if (vehiculo) {
          const empresaFormulario = this.vehiculoForm.get('empresaActualId')?.value;
          
          // Verificar si es la misma empresa
          if (empresaFormulario && vehiculo.empresaActualId === empresaFormulario) {
            // Mismo empresa - solo mostrar aviso simple
            this.vehiculoExistente.set(null);
            this.mostrarOpcionesPlacaExistente.set(false);
            
            const empresaActual = this.empresas().find(e => e.id === vehiculo.empresaActualId);
            const nombreEmpresa = empresaActual?.razonSocial?.principal || 'esta empresa';
            
            this.snackBar.open(
              `⚠️ La placa ${placa} ya está registrada en ${nombreEmpresa}`,
              'Cerrar',
              { duration: 4000 }
            );
            
            // Limpiar la placa para que ingrese otra
            this.vehiculoForm.get('placa')?.setValue('');
          } else {
            // Diferente empresa - mostrar opciones de transferencia
            this.vehiculoExistente.set(vehiculo);
            this.mostrarOpcionesPlacaExistente.set(true);
            
            const empresaActual = this.empresas().find(e => e.id === vehiculo.empresaActualId);
            const nombreEmpresa = empresaActual?.razonSocial?.principal || 'Empresa desconocida';
            
            this.snackBar.open(
              `⚠️ La placa ${placa} ya está registrada en ${nombreEmpresa}`,
              'Ver opciones',
              { duration: 5000 }
            );
          }
        } else {
          this.vehiculoExistente.set(null);
          this.mostrarOpcionesPlacaExistente.set(false);
        }
      },
      error: (error) => {
        console.error('Error validando placa:', error);
        this.vehiculoExistente.set(null);
        this.mostrarOpcionesPlacaExistente.set(false);
      }
    });
  }

  /**
   * Transfiere el vehículo existente a la nueva empresa
   */
  transferirVehiculoExistente(): void {
    const vehiculo = this.vehiculoExistente();
    const nuevaEmpresaId = this.vehiculoForm.get('empresaActualId')?.value;
    
    if (!vehiculo || !nuevaEmpresaId) {
      this.snackBar.open('Debe seleccionar una empresa destino', 'Cerrar', { duration: 3000 });
      return;
    }

    const empresaDestino = this.empresas().find(e => e.id === nuevaEmpresaId);
    const empresaOrigen = this.empresas().find(e => e.id === vehiculo.empresaActualId);
    
    const confirmar = confirm(
      `¿Confirma la transferencia del vehículo ${vehiculo.placa}?\n\n` +
      `De: ${empresaOrigen?.razonSocial?.principal || 'N/A'}\n` +
      `A: ${empresaDestino?.razonSocial?.principal || 'N/A'}`
    );
    
    if (!confirmar) return;

    this.isSubmitting.set(true);
    
    // Actualizar el vehículo con la nueva empresa
    this.vehiculoService.updateVehiculo(vehiculo.id, {
      empresaActualId: nuevaEmpresaId
    }).subscribe({
      next: (vehiculoActualizado) => {
        this.snackBar.open(
          `Vehículo ${vehiculo.placa} transferido exitosamente`,
          'Cerrar',
          { duration: 3000 }
        );
        
        this.vehiculoExistente.set(null);
        this.mostrarOpcionesPlacaExistente.set(false);
        this.vehiculoForm.get('placa')?.setValue('');
        this.isSubmitting.set(false);
        
        // Emitir evento de actualización
        this.vehiculoUpdated.emit(vehiculoActualizado);
      },
      error: (error) => {
        console.error('Error transfiriendo vehículo:', error);
        this.snackBar.open('Error al transferir vehículo', 'Cerrar', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Carga los datos del vehículo existente en el formulario para editarlo
   */
  editarVehiculoExistente(): void {
    const vehiculo = this.vehiculoExistente();
    
    if (!vehiculo) return;

    // Cargar todos los datos del vehículo en el formulario
    this.vehiculoForm.patchValue({
      placa: vehiculo.placa,
      sedeRegistro: vehiculo.sedeRegistro,
      empresaActualId: vehiculo.empresaActualId,
      resolucionId: vehiculo.resolucionId,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anioFabricacion: vehiculo.anioFabricacion,
      categoria: vehiculo.categoria,
      estado: vehiculo.estado,
      numeroTuc: vehiculo.tuc?.nroTuc,
      datosTecnicos: vehiculo.datosTecnicos
    });

    this.mostrarOpcionesPlacaExistente.set(false);
    
    this.snackBar.open(
      'Datos del vehículo cargados. Modifica lo necesario y guarda.',
      'Entendido',
      { duration: 4000 }
    );
  }

  /**
   * Cancela la operación con placa existente
   */
  cancelarPlacaExistente(): void {
    this.vehiculoExistente.set(null);
    this.mostrarOpcionesPlacaExistente.set(false);
    this.vehiculoForm.get('placa')?.setValue('');
  }

  close(): void {
    this.modalClosed.emit();
    this.dialogRef.close();
  }
}

// Componente de diálogo para editar vehículo
@Component({
  selector: 'app-editar-vehiculo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    SmartIconComponent
  ],
  template: `
    <h2 mat-dialog-title>
      <app-smart-icon [iconName]="'edit'" [size]="24"></app-smart-icon>
      Editar Vehículo
    </h2>
    <mat-dialog-content>
      <form [formGroup]="editForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Placa</mat-label>
          <input matInput formControlName="placa" readonly>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Marca</mat-label>
          <input matInput formControlName="marca">
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Modelo</mat-label>
          <input matInput formControlName="modelo">
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Año</mat-label>
          <input matInput formControlName="anioFabricacion" type="number">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="guardar()" [disabled]="!editForm.valid">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class EditarVehiculoDialogComponent {
  private dialogRef = inject(MatDialogRef<EditarVehiculoDialogComponent>);
  private data = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  editForm = this.fb.group({
    placa: [this.data.vehiculo.placa],
    marca: [this.data.vehiculo.marca],
    modelo: [this.data.vehiculo.modelo],
    anioFabricacion: [this.data.vehiculo.anioFabricacion]
  });

  cancelar(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (this.editForm.valid) {
      this.dialogRef.close({
        ...this.data.vehiculo,
        ...this.editForm.value
      });
    }
  }
}

// Componente de diálogo para agregar rutas
@Component({
  selector: 'app-agregar-rutas-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    SmartIconComponent
  ],
  template: `
    <h2 mat-dialog-title>
      <app-smart-icon [iconName]="'add_road'" [size]="24"></app-smart-icon>
      {{ data.modoBloque ? 'Agregar Rutas en Bloque' : 'Agregar Rutas' }}
    </h2>
    <mat-dialog-content>
      @if (cargando()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando rutas...</p>
        </div>
      } @else {
        <p class="dialog-description">
          {{ data.modoBloque 
            ? 'Selecciona las rutas para ' + data.indices.length + ' vehículo(s)' 
            : 'Selecciona las rutas para el vehículo ' + data.vehiculo.placa 
          }}
        </p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Rutas</mat-label>
          <mat-select [formControl]="rutasControl" multiple>
            @for (ruta of rutasDisponibles(); track ruta.id) {
              <mat-option [value]="ruta.id">
                {{ ruta.codigoRuta }} - {{ ruta.origen }} → {{ ruta.destino }}
              </mat-option>
            }
          </mat-select>
          <mat-hint>Selecciona una o más rutas</mat-hint>
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="guardar()" [disabled]="cargando() || !rutasControl.value?.length">
        Asignar Rutas
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin: 16px 0;
    }
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
    }
    .dialog-description {
      margin-bottom: 16px;
      color: #666;
    }
  `]
})
export class AgregarRutasDialogComponent {
  private dialogRef = inject(MatDialogRef<AgregarRutasDialogComponent>);
  data = inject(MAT_DIALOG_DATA);
  private rutaService = inject(RutaService);

  rutasControl = new FormControl<string[]>([]);
  rutasDisponibles = signal<Ruta[]>([]);
  cargando = signal(true);

  constructor() {
    this.cargarRutas();
  }

  private cargarRutas(): void {
    const resolucionId = this.data.resolucionId || this.data.vehiculos?.[0]?.resolucionId;
    
    if (!resolucionId) {
      this.cargando.set(false);
      return;
    }

    this.rutaService.getRutasPorResolucion(resolucionId).subscribe({
      next: (rutas) => {
        this.rutasDisponibles.set(rutas);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando rutas:', error);
        this.cargando.set(false);
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    this.dialogRef.close({
      rutasIds: this.rutasControl.value || []
    });
  }
} 