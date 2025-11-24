import { Component, OnInit, inject, signal, computed, ViewEncapsulation, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { RutaService } from '../../services/ruta.service';
import { Vehiculo, VehiculoCreate, VehiculoUpdate, DatosTecnicos } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Ruta } from '../../models/ruta.model';
import { VehiculosResolucionModalComponent } from './vehiculos-resolucion-modal.component';
import { Observable, of } from 'rxjs';
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
    MatExpansionModule,
    MatDialogModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatCheckboxModule
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

            <!-- Gestión de Vehículos de la Resolución -->
            <mat-card class="form-card">
              <mat-card-header class="card-header">
                <div class="card-header-content">
                  <mat-icon class="card-icon">directions_car</mat-icon>
                  <mat-card-title class="card-title">
                    Gestión de Vehículos
                  </mat-card-title>
                  <mat-card-subtitle class="card-subtitle">
                    Administra los vehículos de la resolución seleccionada
                  </mat-card-subtitle>
                </div>
              </mat-card-header>
              <mat-card-content class="card-content">
                <div class="vehiculos-info">
                  <p class="info-text">
                    <strong>Empresa:</strong> {{ getEmpresaNombre() }}<br>
                    <strong>Resolución:</strong> {{ getResolucionNumero() }}
                  </p>
                  
                  @if (puedeGestionarVehiculos()) {
                    <div class="vehiculos-actions">
                      <button mat-raised-button 
                              color="primary" 
                              (click)="abrirModalVehiculos()"
                              class="gestionar-button">
                        <mat-icon>manage_accounts</mat-icon>
                        GESTIONAR VEHÍCULOS DE LA RESOLUCIÓN
                      </button>
                      <p class="action-hint">
                        Haz clic para ver, crear, editar o eliminar vehículos de esta resolución
                      </p>
                    </div>
                  } @else {
                    <div class="no-resolucion">
                      <mat-icon class="warning-icon">warning</mat-icon>
                      <p>Debes seleccionar una empresa y resolución para gestionar vehículos</p>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Información del Vehículo Seleccionado -->
            @if (vehiculoSeleccionado()) {
              <mat-card class="form-card">
                <mat-card-header class="card-header">
                  <div class="card-header-content">
                    <mat-icon class="card-icon">directions_car</mat-icon>
                    <mat-card-title class="card-title">
                      Vehículo Seleccionado
                    </mat-card-title>
                    <mat-card-subtitle class="card-subtitle">
                      Información específica del vehículo
                    </mat-card-subtitle>
                  </div>
                </mat-card-header>
                <mat-card-content class="card-content">
                  <div class="vehiculo-info">
                    <div class="vehiculo-header">
                      <mat-icon class="check-icon">check_circle</mat-icon>
                      <h3>{{ vehiculoSeleccionado()?.placa }}</h3>
                    </div>
                    
                    <div class="vehiculo-details">
                      <div class="detail-row">
                        <span class="detail-label">Marca:</span>
                        <span class="detail-value">{{ vehiculoSeleccionado()?.marca }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Categoría:</span>
                        <span class="detail-value">
                          <mat-chip [class]="'categoria-chip-' + vehiculoSeleccionado()?.categoria?.toLowerCase()">
                            {{ vehiculoSeleccionado()?.categoria }}
                          </mat-chip>
                        </span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Año:</span>
                        <span class="detail-value">{{ vehiculoSeleccionado()?.anioFabricacion }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value">
                          <mat-chip [class]="'estado-chip-' + vehiculoSeleccionado()?.estado?.toLowerCase()">
                            {{ vehiculoSeleccionado()?.estado }}
                          </mat-chip>
                        </span>
                      </div>
                    </div>

                    <!-- Información del TUC -->
                    <div class="tuc-section">
                      <h4>Información del TUC</h4>
                      <div class="form-row">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Número de TUC</mat-label>
                          <input matInput formControlName="numeroTuc" placeholder="Ej: T-123456-2025" (input)="convertirAMayusculas($event, 'numeroTuc')">
                          <mat-icon matSuffix>receipt</mat-icon>
                          <mat-hint>Número del TUC del vehículo</mat-hint>
                        </mat-form-field>
                      </div>
                    </div>

                    <!-- Rutas Asignadas -->
                    <div class="rutas-section">
                      <h4>Rutas Asignadas</h4>
                      <div class="form-row">
                        <div class="rutas-selection-container">
                          <label class="selection-label">Rutas Asignadas</label>
                          <p class="selection-hint">{{ getRutasHint() }}</p>
                          
                          @if (rutasDisponibles().length > 0) {
                            <div class="rutas-checkboxes" [class.disabled]="!puedeSeleccionarRutas()">
                              @for (ruta of rutasDisponibles(); track ruta.id) {
                                <div class="ruta-checkbox-item">
                                  <mat-checkbox 
                                    [checked]="vehiculoForm.get('rutasAsignadasIds')?.value?.includes(ruta.id)"
                                    [disabled]="!puedeSeleccionarRutas()"
                                    (change)="onRutaCheckboxChange(ruta.id, $event.checked)"
                                    class="ruta-checkbox">
                                    <div class="ruta-info">
                                      <span class="ruta-codigo">{{ ruta.codigoRuta }}</span>
                                      <span class="ruta-descripcion">{{ ruta.origen }} → {{ ruta.destino }}</span>
                                      <span class="ruta-detalles">{{ ruta.tipoRuta }} | {{ ruta.frecuencias }}</span>
                                    </div>
                                  </mat-checkbox>
                                </div>
                              }
                            </div>
                          } @else {
                            <div class="no-rutas-message">
                              <mat-icon>info</mat-icon>
                              <span>No hay rutas disponibles en esta resolución</span>
                            </div>
                          }
                          
                          @if (vehiculoForm.get('rutasAsignadasIds')?.hasError('required')) {
                            <div class="error-message">
                              <mat-icon>error</mat-icon>
                              <span>Debe seleccionar al menos una ruta</span>
                            </div>
                          }
                        </div>
                      </div>
                    </div>

                    <!-- Información Técnica -->
                    <div class="tecnica-section">
                      <h4>Especificaciones Técnicas</h4>
                      <div class="tecnica-info">
                        @if (vehiculoSeleccionado()?.datosTecnicos) {
                          <div class="datos-tecnicos">
                            <div class="detail-row">
                              <span class="detail-label">Motor:</span>
                              <span class="detail-value">{{ vehiculoSeleccionado()?.datosTecnicos?.motor }}</span>
                            </div>
                            <div class="detail-row">
                              <span class="detail-label">Chasis:</span>
                              <span class="detail-value">{{ vehiculoSeleccionado()?.datosTecnicos?.chasis }}</span>
                            </div>
                            <div class="detail-row">
                              <span class="detail-label">Cilindros:</span>
                              <span class="detail-value">{{ vehiculoSeleccionado()?.datosTecnicos?.cilindros }}</span>
                            </div>
                            <div class="detail-row">
                              <span class="detail-label">Ejes:</span>
                              <span class="detail-value">{{ vehiculoSeleccionado()?.datosTecnicos?.ejes }}</span>
                            </div>
                            <div class="detail-row">
                              <span class="detail-label">Ruedas:</span>
                              <span class="detail-value">{{ vehiculoSeleccionado()?.datosTecnicos?.ruedas }}</span>
                            </div>
                            <div class="detail-row">
                              <span class="detail-label">Peso Neto:</span>
                              <span class="detail-value">{{ vehiculoSeleccionado()?.datosTecnicos?.pesoNeto }} ton</span>
                            </div>
                            <div class="detail-row">
                              <span class="detail-label">Peso Bruto:</span>
                              <span class="detail-value">{{ vehiculoSeleccionado()?.datosTecnicos?.pesoBruto }} ton</span>
                            </div>
                          </div>
                        } @else {
                          <p class="no-datos">No hay datos técnicos disponibles para este vehículo</p>
                        }
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            }

            <!-- Mensaje cuando no hay vehículo seleccionado -->
            @if (!vehiculoSeleccionado()) {
              <mat-card class="form-card">
                <mat-card-header class="card-header">
                  <div class="card-header-content">
                    <mat-icon class="card-icon">info</mat-icon>
                    <mat-card-title class="card-title">
                      Selecciona un Vehículo
                    </mat-card-title>
                    <mat-card-subtitle class="card-subtitle">
                      Para ver información específica del vehículo
                    </mat-card-subtitle>
                  </div>
                </mat-card-header>
                <mat-card-content class="card-content">
                  <div class="no-vehiculo">
                    <mat-icon class="info-icon">info</mat-icon>
                    <p>No hay vehículo seleccionado</p>
                    <p class="subtitle">Selecciona un vehículo desde la gestión para ver sus especificaciones técnicas, TUC y rutas asignadas</p>
                  </div>
                </mat-card-content>
              </mat-card>
            }

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
    }

    .resolucion-tipo-badge {
      display: inline-block;
      margin-left: 8px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tipo-primigenia {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .tipo-hija {
      background: #fff3e0;
      color: #f57c00;
    }

    // Estilos para la gestión de vehículos
    .vehiculos-info {
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .info-text {
      margin: 0 0 20px 0;
      color: #333;
      line-height: 1.6;
    }

    .vehiculos-actions {
      text-align: center;
    }

    .gestionar-button {
      font-weight: 600;
      text-transform: uppercase;
      padding: 12px 24px;
      margin-bottom: 16px;
    }

    .action-hint {
      margin: 0;
      color: #666;
      font-size: 14px;
      font-style: italic;
    }

    .no-resolucion {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .warning-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ff9800;
      margin-bottom: 16px;
    }

    // Estilos para información técnica
    .tecnica-info {
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .vehiculo-seleccionado {
      background-color: #e8f5e8;
      border: 1px solid #4caf50;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
      text-align: center;
    }

    .check-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4caf50;
      margin-bottom: 16px;
    }

    .no-vehiculo {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .info-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #2196f3;
      margin-bottom: 16px;
    }

    .subtitle {
      margin-top: 8px;
      font-size: 14px;
      opacity: 0.7;
    }

    // Estilos para información del vehículo seleccionado
    .vehiculo-info {
      padding: 20px;
    }

    .vehiculo-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e0e0e0;
    }

    .vehiculo-header h3 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #1976d2;
    }

    .vehiculo-details {
      margin-bottom: 32px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .detail-label {
      font-weight: 600;
      color: #333;
      min-width: 120px;
    }

    .detail-value {
      color: #666;
      text-align: right;
    }

    .tuc-section, .rutas-section, .tecnica-section {
      margin-bottom: 32px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .tuc-section h4, .rutas-section h4, .tecnica-section h4 {
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 18px;
      font-weight: 600;
    }

    .datos-tecnicos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .no-datos {
      text-align: center;
      color: #666;
      font-style: italic;
      padding: 20px;
    }

    // Estilos para chips de categoría y estado
    .categoria-chip-m3 {
      background-color: #4caf50;
      color: white;
    }

    .categoria-chip-n3 {
      background-color: #ff9800;
      color: white;
    }

    .categoria-chip-m2 {
      background-color: #2196f3;
      color: white;
    }

    .categoria-chip-n2 {
      background-color: #9c27b0;
      color: white;
    }

    .estado-chip-activo {
      background-color: #4caf50;
      color: white;
    }

    .estado-chip-mantenimiento {
      background-color: #ff9800;
      color: white;
    }

    .estado-chip-inactivo {
      background-color: #f44336;
      color: white;
    }

    .ruta-info-badge {
      display: block;
      margin-top: 4px;
      font-size: 11px;
      color: #666;
      font-style: italic;
    }

    .form-field mat-select {
      max-height: 300px;
    }

    .form-field mat-option {
      padding: 8px 16px;
      line-height: 1.4;
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

    /* Estilos para la selección de rutas con checkboxes */
    .rutas-selection-container {
      margin: 16px 0;
    }
    
    .selection-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }
    
    .selection-hint {
      font-size: 13px;
      color: #666;
      margin: 0 0 16px 0;
      font-weight: 400;
    }
    
    .rutas-checkboxes {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 8px;
      background: #fafafa;
    }
    
    .rutas-checkboxes.disabled {
      opacity: 0.6;
      background: #f5f5f5;
    }
    
    .ruta-checkbox-item {
      padding: 8px 4px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .ruta-checkbox-item:last-child {
      border-bottom: none;
    }
    
    .ruta-checkbox {
      width: 100%;
    }
    
    .ruta-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-left: 8px;
    }
    
    .ruta-codigo {
      font-weight: 600;
      color: #1976d2;
      font-size: 14px;
    }
    
    .ruta-descripcion {
      font-size: 13px;
      color: #333;
      font-weight: 500;
    }
    
    .ruta-detalles {
      font-size: 12px;
      color: #666;
      font-weight: 400;
    }
    
    .no-rutas-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      color: #666;
      font-style: italic;
      background: #f9f9f9;
      border-radius: 8px;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      color: #d32f2f;
      font-size: 12px;
      margin-top: 8px;
    }

    /* Responsive Design con breakpoints mejorados */
    /* Tablets grandes y escritorio pequeño */
    @media (max-width: 1024px) {
      .content-section {
        max-width: 100%;
      }

      .vehiculo-form {
        padding: 24px;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .datos-tecnicos {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
    }

    /* Tablets */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        padding: 20px;

        .header-content {
          margin-bottom: 16px;
        }

        .header-title h1 {
          font-size: 24px;
        }

        .header-subtitle {
          font-size: 14px;
        }

        .header-button {
          width: 100%;
        }
      }

      .vehiculo-form {
        padding: 20px;
      }

      .form-card {
        margin-bottom: 20px;
      }

      .card-header {
        padding: 16px 20px 12px;
      }

      .card-title {
        font-size: 16px;
      }

      .card-subtitle {
        font-size: 13px;
      }

      .card-content {
        padding: 20px;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }

      .form-actions {
        flex-direction: column-reverse;
        gap: 12px;

        button {
          width: 100%;
        }
      }

      .vehiculos-actions {
        .gestionar-button {
          width: 100%;
          padding: 10px 20px;
        }
      }

      .vehiculo-details {
        .detail-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;

          .detail-label {
            min-width: unset;
          }

          .detail-value {
            text-align: left;
          }
        }
      }

      .datos-tecnicos {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .tuc-section,
      .rutas-section,
      .tecnica-section {
        padding: 16px;
        margin-bottom: 24px;

        h4 {
          font-size: 16px;
        }
      }
    }

    /* Móviles */
    @media (max-width: 480px) {
      .page-header {
        padding: 16px;

        .header-title {
          gap: 8px;

          h1 {
            font-size: 20px;
          }
        }

        .header-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        .header-subtitle {
          font-size: 13px;
        }
      }

      .form-container {
        border-radius: 8px;
      }

      .vehiculo-form {
        padding: 16px;
      }

      .form-card {
        margin-bottom: 16px;
        border-radius: 6px;
      }

      .card-header {
        padding: 14px 16px 10px;
      }

      .card-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .card-title {
        font-size: 15px;
      }

      .card-subtitle {
        font-size: 12px;
      }

      .card-content {
        padding: 16px;
      }

      .form-row {
        gap: 14px;
        margin-bottom: 14px;
      }

      .form-field {
        ::ng-deep .mat-form-field-label {
          font-size: 13px;
        }

        ::ng-deep input,
        ::ng-deep mat-select {
          font-size: 14px;
        }

        ::ng-deep .mat-hint {
          font-size: 11px;
        }
      }

      .form-actions {
        margin-top: 24px;
        padding-top: 20px;

        button {
          min-height: 44px;
          font-size: 14px;
          padding: 0 24px;
        }
      }

      .vehiculos-info {
        padding: 16px;
      }

      .info-text {
        font-size: 13px;
      }

      .vehiculos-actions {
        .gestionar-button {
          font-size: 13px;
          padding: 10px 16px;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }

        .action-hint {
          font-size: 12px;
        }
      }

      .vehiculo-info {
        padding: 16px;
      }

      .vehiculo-header {
        gap: 12px;
        margin-bottom: 20px;
        padding-bottom: 12px;

        h3 {
          font-size: 20px;
        }

        .check-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
        }
      }

      .detail-row {
        padding: 10px 0;

        .detail-label,
        .detail-value {
          font-size: 13px;
        }
      }

      .tuc-section,
      .rutas-section,
      .tecnica-section {
        padding: 14px;
        margin-bottom: 20px;
        border-left-width: 3px;

        h4 {
          font-size: 15px;
          margin-bottom: 12px;
        }
      }

      .rutas-checkboxes {
        max-height: 250px;
        padding: 6px;
      }

      .ruta-checkbox-item {
        padding: 6px 4px;
      }

      .ruta-info {
        gap: 3px;
      }

      .ruta-codigo {
        font-size: 13px;
      }

      .ruta-descripcion {
        font-size: 12px;
      }

      .ruta-detalles {
        font-size: 11px;
      }

      .no-vehiculo,
      .no-resolucion {
        padding: 32px 16px;

        .info-icon,
        .warning-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          margin-bottom: 12px;
        }

        p {
          font-size: 14px;
        }

        .subtitle {
          font-size: 12px;
        }
      }
    }

    /* Móviles muy pequeños */
    @media (max-width: 360px) {
      .page-header {
        padding: 12px;

        .header-title h1 {
          font-size: 18px;
        }

        .header-subtitle {
          font-size: 12px;
        }
      }

      .vehiculo-form {
        padding: 12px;
      }

      .form-card {
        margin-bottom: 12px;
      }

      .card-header {
        padding: 12px 14px 8px;
      }

      .card-content {
        padding: 14px;
      }

      .form-row {
        gap: 12px;
      }

      .form-actions {
        button {
          min-height: 40px;
          font-size: 13px;
          padding: 0 20px;
        }
      }

      .vehiculo-header {
        flex-direction: column;
        text-align: center;

        .check-icon {
          margin-bottom: 8px;
        }
      }

      .datos-tecnicos {
        .detail-row {
          font-size: 12px;
        }
      }
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
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  private rutaService = inject(RutaService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  vehiculoForm!: FormGroup;
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  vehiculoId = signal<string | null>(null);
  
  // Datos de referencia
  empresas = signal<Empresa[]>([]);
  resoluciones = signal<Resolucion[]>([]);
  rutasDisponibles = signal<Ruta[]>([]);
  
  // Autocompletado para empresas
  empresasFiltradas!: Observable<Empresa[]>;
  
  // Getters para los controles del formulario
  get empresaControl(): FormControl {
    return this.vehiculoForm.get('empresaActualId') as FormControl;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadEmpresas();
    
    if (!this.modalMode()) {
      this.loadVehiculo();
    } else {
      // En modo modal, pre-configurar empresa y resolución
      this.vehiculoForm.patchValue({
        empresaActualId: this.empresaId(),
        resolucionId: this.resolucionId()
      });
      
      // Cargar resoluciones y rutas si ya hay empresa y resolución
      if (this.empresaId()) {
        this.loadResoluciones(this.empresaId());
        if (this.resolucionId()) {
          this.loadRutasDisponibles(this.resolucionId());
        }
      }
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

  private initializeForm(): void {
    this.vehiculoForm = this.fb.group({
      empresaActualId: ['', Validators.required],
      resolucionId: [{ value: '', disabled: true }, Validators.required],
      numeroTuc: ['', [numeroTucValidator()]],
      rutasAsignadasIds: [[], Validators.required],
      placa: [
        '', 
        [Validators.required, placaPeruanaValidator()],
        [placaDuplicadaValidator(this.vehiculoService, this.vehiculoId() || undefined)]
      ],
      marca: ['', Validators.required],
      modelo: [''],
      categoria: ['M3'],
      asientos: ['', [capacidadPasajerosValidator()]],
      anioFabricacion: ['', [Validators.required, anioFabricacionValidator()]],
      estado: ['ACTIVO'],
      datosTecnicos: this.fb.group({
        motor: ['', [numeroMotorValidator()]],
        chasis: ['', [numeroChasisValidator()]],
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

      this.vehiculoService.getVehiculoById(id).subscribe({
        next: (vehiculo: Vehiculo | null) => {
          if (!vehiculo) {
            this.snackBar.open('Vehículo no encontrado', 'Cerrar', { duration: 3000 });
            this.isLoading.set(false);
            return;
          }
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
          // Update the asientos field separately since it's part of datosTecnicos
          this.vehiculoForm.patchValue({
            asientos: vehiculo.datosTecnicos.asientos
          });
          
          // Cargar resoluciones y rutas para este vehículo
          this.loadResoluciones(vehiculo.empresaActualId);
          this.loadRutasDisponibles(vehiculo.resolucionId);
          
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('Error loading vehicle:', error);
          this.snackBar.open('Error al cargar el vehículo', 'Cerrar', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
    } else {
      this.isLoading.set(false);
    }
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
          anioFabricacion: formValue.anioFabricacion,
          empresaActualId: this.empresaId(),
          resolucionId: this.resolucionId(),
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
            anioFabricacion: formValue.anioFabricacion,
            estado: formValue.estado,
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
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    
    // Limpiar campos dependientes
    this.vehiculoForm.patchValue({
      resolucionId: '',
      rutasAsignadasIds: []
    });
    
    // Cargar resoluciones de la empresa seleccionada
    if (empresaId) {
      this.loadResoluciones(empresaId);
    } else {
      this.resoluciones.set([]);
      this.rutasDisponibles.set([]);
    }
  }

  onResolucionChange(): void {
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    
    // Limpiar rutas asignadas
    this.vehiculoForm.patchValue({
      rutasAsignadasIds: []
    });
    
    // Cargar rutas disponibles de la resolución seleccionada
    if (resolucionId) {
      this.loadRutasDisponibles(resolucionId);
    } else {
      this.rutasDisponibles.set([]);
    }
  }

  puedeSeleccionarRutas(): boolean {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    const hayRutasDisponibles = this.rutasDisponibles().length > 0;
    return !!empresaId && !!resolucionId && hayRutasDisponibles;
  }

  getRutasHint(): string {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    
    if (!empresaId) {
      return 'Selecciona una empresa primero';
    }
    
    if (!resolucionId) {
      return 'Selecciona una resolución primero';
    }
    
    if (this.rutasDisponibles().length === 0) {
      return 'No hay rutas disponibles en esta resolución';
    }
    
    return `Selecciona las rutas autorizadas (${this.rutasDisponibles().length} disponibles)`;
  }

  onRutaCheckboxChange(rutaId: string, checked: boolean): void {
    const rutasControl = this.vehiculoForm.get('rutasAsignadasIds');
    const currentValue = rutasControl?.value || [];
    
    if (checked) {
      // Agregar la ruta si no está ya seleccionada
      if (!currentValue.includes(rutaId)) {
        rutasControl?.setValue([...currentValue, rutaId]);
      }
    } else {
      // Remover la ruta si está seleccionada
      rutasControl?.setValue(currentValue.filter((id: string) => id !== rutaId));
    }
    
    // Marcar el control como touched para activar validaciones
    rutasControl?.markAsTouched();
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

  // Métodos para el modal de gestión de vehículos
  vehiculoSeleccionado = signal<Vehiculo | null>(null);

  getEmpresaNombre(): string {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    if (!empresaId) return 'No seleccionada';
    
    const empresa = this.empresas().find(e => e.id === empresaId);
    return empresa ? `${empresa.ruc} - ${empresa.razonSocial.principal}` : 'No encontrada';
  }

  getResolucionNumero(): string {
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    if (!resolucionId) return 'No seleccionada';
    
    const resolucion = this.resoluciones().find(r => r.id === resolucionId);
    return resolucion ? `${resolucion.nroResolucion} - ${resolucion.tipoTramite}` : 'No encontrada';
  }

  puedeGestionarVehiculos(): boolean {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    return !!empresaId && !!resolucionId;
  }

  abrirModalVehiculos(): void {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    
    if (!empresaId || !resolucionId) {
      this.snackBar.open('Debes seleccionar una empresa y resolución primero', 'Cerrar', { duration: 3000 });
      return;
    }

    const empresa = this.empresas().find(e => e.id === empresaId);
    const resolucion = this.resoluciones().find(r => r.id === resolucionId);
    
    if (!empresa || !resolucion) {
      this.snackBar.open('Error: Empresa o resolución no encontrada', 'Cerrar', { duration: 3000 });
      return;
    }

    // Abrir el modal de gestión de vehículos
    const dialogRef = this.dialog.open(VehiculosResolucionModalComponent, {
      data: { empresa, resolucion },
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '800px'
    });

    // Escuchar cuando se cierre el modal
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si se seleccionó un vehículo, actualizar el formulario
        this.vehiculoSeleccionado.set(result);
        this.snackBar.open(`Vehículo seleccionado: ${result.placa}`, 'Cerrar', { duration: 3000 });
      }
    });
  }
} 