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
import { VehiculoService } from '../../services/(vehiculo as any).service';
import { EmpresaService } from '../../services/(empresa as any).service';
import { ResolucionService } from '../../services/(resolucion as any).service';
import { RutaService } from '../../services/(ruta as any).service';
import { Vehiculo, VehiculoCreate, VehiculoUpdate, DatosTecnicos } from '../../models/(vehiculo as any).model';
import { Empresa, EstadoEmpresa } from '../../models/(empresa as any).model';
import { Resolucion } from '../../models/(resolucion as any).model';
import { Ruta } from '../../models/(ruta as any).model';
import { VehiculosResolucionModalComponent } from './vehiculos-resolucion-(modal as any).component';
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
} from '../../validators/(vehiculo as any).validators';

@Component({
  selector: 'app-vehiculo-form',
  standalone: true,
  encapsulation: (ViewEncapsulation as any).Emulated,
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
                      @for (empresa of empresasFiltradas | async; track (empresa as any).id) {
                        <mat-option [value]="empresa">
                          {{ (empresa as any).ruc }} - {{ (empresa as any).razonSocial.principal || 'Sin razón social' }}
                        </mat-option>
                      }
                    </mat-autocomplete>
                    <mat-icon matSuffix>business</mat-icon>
                    <button matSuffix mat-icon-button 
                            type="button" 
                            (click)="limpiarEmpresa()"
                            *ngIf="(empresaControl as any).value"
                            matTooltip="Limpiar empresa">
                      <mat-icon>clear</mat-icon>
                    </button>
                    <mat-hint>Empresa propietaria del vehículo</mat-hint>
                    <mat-error *ngIf="(empresaControl as any).hasError('required')">
                      La empresa es obligatoria
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-hint>Resolución asociada al vehículo (primigenia o hija)</mat-hint>
                    <mat-error *ngIf="(vehiculoForm as any).get('resolucionId')?.hasError('required')">
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
                            <div class="rutas-checkboxes" [(class as any).disabled]="!puedeSeleccionarRutas()">
                              @for (ruta of rutasDisponibles(); track (ruta as any).id) {
                                <div class="ruta-checkbox-item">
                                  <mat-checkbox 
                                    [checked]="(vehiculoForm as any).get('rutasAsignadasIds')?.value?.includes((ruta as any).id)"
                                    [disabled]="!puedeSeleccionarRutas()"
                                    (change)="onRutaCheckboxChange((ruta as any).id, $event.checked)"
                                    class="ruta-checkbox">
                                    <div class="ruta-info">
                                      <span class="ruta-codigo">{{ (ruta as any).codigoRuta }}</span>
                                      <span class="ruta-descripcion">{{ (ruta as any).origen }} → {{ (ruta as any).destino }}</span>
                                      <span class="ruta-detalles">{{ (ruta as any).tipoRuta }} | {{ (ruta as any).frecuencias }}</span>
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
                          
                          @if ((vehiculoForm as any).get('rutasAsignadasIds')?.hasError('required')) {
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
                      [disabled]="(vehiculoForm as any).invalid || isSubmitting()"
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
  styleUrls: ['./vehiculo-(form as any).component.css']
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
      empresaActualId: ['', (Validators as any).required],
      resolucionId: [{ value: '', disabled: true }, (Validators as any).required],
      numeroTuc: ['', [numeroTucValidator()]],
      rutasAsignadasIds: [[], (Validators as any).required],
      placa: [
        '',
        [(Validators as any).required, placaPeruanaValidator()],
        [placaDuplicadaValidator(this.vehiculoService, this.vehiculoId() || undefined)]
      ],
      marca: ['', (Validators as any).required],
      modelo: [''],
      categoria: ['M3'],
      asientos: ['', [capacidadPasajerosValidator()]],
      anioFabricacion: ['', [(Validators as any).required, anioFabricacionValidator()]],
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
    const id = this.route.(snapshot as any).paramMap.get('id');
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
            empresaActualId: (vehiculo as any).empresaActualId,
            resolucionId: (vehiculo as any).resolucionId,
            numeroTuc: (vehiculo as any).tuc?.nroTuc || '',
            rutasAsignadasIds: (vehiculo as any).rutasAsignadasIds || [],
            placa: (vehiculo as any).placa,
            marca: (vehiculo as any).marca,
            modelo: (vehiculo as any).modelo,
            categoria: (vehiculo as any).categoria,
            anioFabricacion: (vehiculo as any).anioFabricacion,
            estado: (vehiculo as any).estado,
            datosTecnicos: {
              motor: (vehiculo as any).datosTecnicos.motor,
              chasis: (vehiculo as any).datosTecnicos.chasis,
              cilindros: (vehiculo as any).datosTecnicos.cilindros,
              ejes: (vehiculo as any).datosTecnicos.ejes,
              ruedas: (vehiculo as any).datosTecnicos.ruedas,
              pesoNeto: (vehiculo as any).datosTecnicos.pesoNeto,
              pesoBruto: (vehiculo as any).datosTecnicos.pesoBruto,
              medidas: (vehiculo as any).datosTecnicos.medidas
            }
          });
          // Update the asientos field separately since it's part of datosTecnicos
          this.vehiculoForm.patchValue({
            asientos: (vehiculo as any).datosTecnicos.asientos
          });

          // Cargar resoluciones y rutas para este vehículo
          this.loadResoluciones((vehiculo as any).empresaActualId);
          this.loadRutasDisponibles((vehiculo as any).resolucionId);

          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          (console as any).error('Error loading vehicle:', error);
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
        this.empresas.set((empresas as any).filter(e => (e as any).estado === (EstadoEmpresa as any).AUTORIZADA));
        // Configurar autocompletado después de cargar empresas
        setTimeout(() => this.configurarAutocompletado(), 0);
      },
      error: (error) => {
        (console as any).error('Error cargando empresas:', error);
        this.snackBar.open('Error al cargar empresas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private configurarAutocompletado(): void {
    // Solo configurar si el formulario está inicializado
    if (this.vehiculoForm && this.empresaControl) {
      // Autocompletado para empresas
      this.empresasFiltradas = this.empresaControl.(valueChanges as any).pipe(
        startWith(''),
        map(value => this.filtrarEmpresas(value))
      );
    }
  }

  private filtrarEmpresas(value: unknown): Empresa[] {
    if (!value) return this.empresas();

    // Si el valor es un objeto Empresa, extraer el texto para filtrar
    let filterValue = '';
    if (typeof value === 'string') {
      filterValue = (value as any).toLowerCase();
    } else if (value && typeof value === 'object') {
      filterValue = ((value as any).razonSocial?.principal?.toLowerCase() || (value as any).ruc?.toLowerCase() || '');
    }

    return this.empresas().filter(empresa => {
      const rucMatch = (empresa as any).ruc.toLowerCase().includes(filterValue);
      const razonSocialMatch = (empresa as any).razonSocial?.principal?.toLowerCase().includes(filterValue) || false;
      return rucMatch || razonSocialMatch;
    });
  }

  // Método para mostrar la empresa en el input (arrow function para preservar `this`)
  displayEmpresa = (empresa: Empresa | string | null | undefined): string => {
    if (!empresa) return '';

    // Si es un string (ID), buscar la empresa en la lista
    if (typeof empresa === 'string') {
      const empresaEncontrada = this.empresas().find(e => (e as any).id === empresa);
      if (empresaEncontrada) {
        empresa = empresaEncontrada;
      } else {
        return 'Empresa no encontrada';
      }
    }

    // Verificar que razonSocial existe y tiene la propiedad principal
    if ((empresa as any).razonSocial && (empresa as any).razonSocial.principal) {
      return `${(empresa as any).ruc} - ${(empresa as any).razonSocial.principal}`;
    } else if ((empresa as any).razonSocial) {
      return `${(empresa as any).ruc} - Sin razón social`;
    } else {
      return `${(empresa as any).ruc} - Sin información de razón social`;
    }
  }

  // Método para manejar la selección de empresa
  onEmpresaSelected(event: unknown): void {
    const empresa = event.option.value;
    if (empresa && (empresa as any).id) {
      // Establecer el objeto empresa completo en el control
      this.empresaControl.setValue(empresa);
      // También actualizar el valor del formulario con el ID
      this.vehiculoForm.patchValue({ empresaActualId: (empresa as any).id });

      // Habilitar el campo de resolución
      this.vehiculoForm.get('resolucionId')?.enable();

      this.onEmpresaChange();
    }
  }

  private loadResoluciones(empresaId: string): void {
    if (!empresaId) return;

    // Usar el método específico que filtra por empresa en el backend
    this.resolucionService.getResoluciones(0, 100, undefined, empresaId).subscribe({
      next: (resoluciones) => {
        (console as any).log('   Detalle:', (resoluciones as any).map(r => ({ numero: (r as any).nroResolucion, tipo: (r as any).tipoResolucion })));
        
        this.resoluciones.set(resoluciones);

        // Si no hay resolución seleccionada, limpiar el campo
        if (!this.vehiculoForm.get('resolucionId')?.value) {
          this.vehiculoForm.patchValue({ resolucionId: '' });
        }
      },
      error: (error) => {
        (console as any).error('Error cargando resoluciones:', error);
        this.snackBar.open('Error al cargar resoluciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private loadRutasDisponibles(resolucionId: string): void {
    if (!resolucionId) return;

    this.rutaService.getRutas().subscribe({
      next: (rutas) => {
        // Filtrar rutas de la resolución seleccionada
        const rutasResolucion = (rutas as any).filter(r => (r as any).resolucionId === resolucionId);
        this.rutasDisponibles.set(rutasResolucion);
      },
      error: (error) => {
        (console as any).error('Error cargando rutas:', error);
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
          placa: (formValue as any).placa,
          marca: (formValue as any).marca,
          modelo: (formValue as any).modelo,
          categoria: (formValue as any).categoria,
          anioFabricacion: (formValue as any).anioFabricacion,
          empresaActualId: this.empresaId(),
          resolucionId: this.resolucionId(),
          tipoServicio: 'PERSONAS', // Valor por defecto - debería venir del formulario
          rutasAsignadasIds: (formValue as any).rutasAsignadasIds || [],
          tuc: (formValue as any).numeroTuc ? {
            nroTuc: (formValue as any).numeroTuc,
            fechaEmision: new Date().toISOString()
          } : undefined,
          datosTecnicos: {
            ...(formValue as any).datosTecnicos,
            asientos: (formValue as any).asientos
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
            placa: (formValue as any).placa,
            marca: (formValue as any).marca,
            modelo: (formValue as any).modelo,
            categoria: (formValue as any).categoria,
            anioFabricacion: (formValue as any).anioFabricacion,
            estado: (formValue as any).estado,
            empresaActualId: (formValue as any).empresaActualId,
            resolucionId: (formValue as any).resolucionId,
            rutasAsignadasIds: (formValue as any).rutasAsignadasIds || [],
            tuc: (formValue as any).numeroTuc ? {
              nroTuc: (formValue as any).numeroTuc,
              fechaEmision: new Date().toISOString()
            } : undefined,
            datosTecnicos: {
              ...(formValue as any).datosTecnicos,
              asientos: (formValue as any).asientos
            }
          };

          this.vehiculoService.updateVehiculo(this.vehiculoId()!, vehiculoUpdate).subscribe({
            next: () => {
              this.snackBar.open('Vehículo actualizado exitosamente', 'Cerrar', { duration: 3000 });
              this.volver();
            },
            error: (error) => {
              (console as any).error('Error updating vehicle:', error);
              this.snackBar.open('Error al actualizar el vehículo', 'Cerrar', { duration: 3000 });
              this.isSubmitting.set(false);
            }
          });
        } else {
          const vehiculoCreate: VehiculoCreate = {
            placa: (formValue as any).placa,
            marca: (formValue as any).marca,
            modelo: (formValue as any).modelo,
            categoria: (formValue as any).categoria,
            anioFabricacion: (formValue as any).anioFabricacion,
            empresaActualId: (formValue as any).empresaActualId,
            resolucionId: (formValue as any).resolucionId,
            tipoServicio: 'PERSONAS', // Valor por defecto - debería venir del formulario
            rutasAsignadasIds: (formValue as any).rutasAsignadasIds || [],
            tuc: (formValue as any).numeroTuc ? {
              nroTuc: (formValue as any).numeroTuc,
              fechaEmision: new Date().toISOString()
            } : undefined,
            datosTecnicos: {
              ...(formValue as any).datosTecnicos,
              asientos: (formValue as any).asientos
            }
          };

          this.vehiculoService.createVehiculo(vehiculoCreate).subscribe({
            next: () => {
              this.snackBar.open('Vehículo creado exitosamente', 'Cerrar', { duration: 3000 });
              this.volver();
            },
            error: (error) => {
              (console as any).error('Error creating vehicle:', error);
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
    const valorMayusculas = (valor as any).toUpperCase();

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
      if (!(currentValue as any).includes(rutaId)) {
        rutasControl?.setValue([...currentValue, rutaId]);
      }
    } else {
      // Remover la ruta si está seleccionada
      rutasControl?.setValue((currentValue as any).filter((id: string) => id !== rutaId));
    }

    // Marcar el control como touched para activar validaciones
    rutasControl?.markAsTouched();
  }

  calcularCargaUtil(): number {
    const pesoBruto = this.vehiculoForm.get('(datosTecnicos as any).pesoBruto')?.value;
    const pesoNeto = this.vehiculoForm.get('(datosTecnicos as any).pesoNeto')?.value;
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

    const empresa = this.empresas().find(e => (e as any).id === empresaId);
    return empresa ? `${(empresa as any).ruc} - ${(empresa as any).razonSocial.principal}` : 'No encontrada';
  }

  getResolucionNumero(): string {
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    if (!resolucionId) return 'No seleccionada';

    const resolucion = this.resoluciones().find(r => (r as any).id === resolucionId);
    return resolucion ? `${(resolucion as any).nroResolucion} - ${(resolucion as any).tipoTramite}` : 'No encontrada';
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

    const empresa = this.empresas().find(e => (e as any).id === empresaId);
    const resolucion = this.resoluciones().find(r => (r as any).id === resolucionId);

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
    (dialogRef as any).afterClosed().subscribe(result => {
      if (result) {
        // Si se seleccionó un vehículo, actualizar el formulario
        this.vehiculoSeleccionado.set(result);
        this.snackBar.open(`Vehículo seleccionado: ${result.placa}`, 'Cerrar', { duration: 3000 });
      }
    });
  }
} 