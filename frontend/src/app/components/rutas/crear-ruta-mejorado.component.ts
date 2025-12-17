import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { Ruta, TipoRuta, RutaCreate } from '../../models/ruta.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { RutaService } from '../../services/ruta.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';

@Component({
  selector: 'app-crear-ruta-mejorado',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatTableModule,
    MatExpansionModule
  ],
  template: `
    <div class="modal-container">
      <mat-card class="modal-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>add_road</mat-icon>
            Crear Nueva Ruta
          </mat-card-title>
          <mat-card-subtitle>
            Selecciona la resolución primigenia para asociar la ruta
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="rutaForm" (ngSubmit)="onSubmit()">
            
            <!-- Selector de modo -->
            <div class="modo-selector">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Método de selección</mat-label>
                <mat-select formControlName="modoSeleccion" (selectionChange)="onModoChange()">
                  <mat-option value="resolucion">Seleccionar Resolución Directamente</mat-option>
                  <mat-option value="empresa">Seleccionar Empresa → Resolución</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Modo 1: Selección directa de resolución -->
            @if (rutaForm.get('modoSeleccion')?.value === 'resolucion') {
              <div class="resolucion-directa">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Resolución Primigenia *</mat-label>
                  <mat-select formControlName="resolucionId" 
                             (selectionChange)="onResolucionChange()"
                             [disabled]="cargandoResoluciones">
                    @if (cargandoResoluciones) {
                      <mat-option disabled>
                        <mat-spinner diameter="20"></mat-spinner>
                        Cargando resoluciones...
                      </mat-option>
                    } @else {
                      @for (resolucion of resolucionesPrimigenias; track resolucion.id) {
                        <mat-option [value]="resolucion.id">
                          <div class="resolucion-option">
                            <div class="resolucion-numero">{{ resolucion.nroResolucion }}</div>
                            <div class="resolucion-empresa">
                              {{ resolucion.empresa?.ruc }} - {{ resolucion.empresa?.razonSocial }}
                            </div>
                            <div class="resolucion-tipo">{{ resolucion.tipoTramite }}</div>
                          </div>
                        </mat-option>
                      }
                    }
                  </mat-select>
                  <mat-hint>Selecciona una resolución primigenia (PADRE y VIGENTE)</mat-hint>
                  <mat-error *ngIf="rutaForm.get('resolucionId')?.hasError('required')">
                    La resolución es obligatoria
                  </mat-error>
                </mat-form-field>
              </div>
            }

            <!-- Modo 2: Selección por empresa -->
            @if (rutaForm.get('modoSeleccion')?.value === 'empresa') {
              <div class="empresa-resolucion">
                <!-- Selector de empresa -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Empresa *</mat-label>
                  <mat-select formControlName="empresaId" 
                             (selectionChange)="onEmpresaChange()"
                             [disabled]="cargandoEmpresas">
                    @if (cargandoEmpresas) {
                      <mat-option disabled>
                        <mat-spinner diameter="20"></mat-spinner>
                        Cargando empresas...
                      </mat-option>
                    } @else {
                      @for (empresa of empresas; track empresa.id) {
                        <mat-option [value]="empresa.id">
                          <div class="empresa-option">
                            <div class="empresa-ruc">{{ empresa.ruc }}</div>
                            <div class="empresa-razon">{{ empresa.razonSocial?.principal || 'Sin razón social' }}</div>
                          </div>
                        </mat-option>
                      }
                    }
                  </mat-select>
                  <mat-error *ngIf="rutaForm.get('empresaId')?.hasError('required')">
                    La empresa es obligatoria
                  </mat-error>
                </mat-form-field>

                <!-- Selector de resolución de la empresa -->
                @if (rutaForm.get('empresaId')?.value) {
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Resolución Primigenia de la Empresa *</mat-label>
                    <mat-select formControlName="resolucionId" 
                               [disabled]="cargandoResolucionesEmpresa || !resolucionesEmpresa.length">
                      @if (cargandoResolucionesEmpresa) {
                        <mat-option disabled>
                          <mat-spinner diameter="20"></mat-spinner>
                          Cargando resoluciones de la empresa...
                        </mat-option>
                      } @else if (!resolucionesEmpresa.length) {
                        <mat-option disabled>
                          No hay resoluciones primigenias para esta empresa
                        </mat-option>
                      } @else {
                        @for (resolucion of resolucionesEmpresa; track resolucion.id) {
                          <mat-option [value]="resolucion.id">
                            <div class="resolucion-option">
                              <div class="resolucion-numero">{{ resolucion.nroResolucion }}</div>
                              <div class="resolucion-tipo">{{ resolucion.tipoTramite }}</div>
                            </div>
                          </mat-option>
                        }
                      }
                    </mat-select>
                    <mat-hint>Resoluciones PADRE y VIGENTE de la empresa seleccionada</mat-hint>
                    <mat-error *ngIf="rutaForm.get('resolucionId')?.hasError('required')">
                      La resolución es obligatoria
                    </mat-error>
                  </mat-form-field>
                }
              </div>
            }

            <!-- Información de la selección actual -->
            @if (empresaSeleccionada && resolucionSeleccionada) {
              <div class="seleccion-actual">
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>Selección Actual</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <strong>Empresa:</strong> {{ empresaSeleccionada.ruc }} - {{ empresaSeleccionada.razonSocial?.principal }}
                    </div>
                    <div class="info-row">
                      <strong>Resolución:</strong> {{ resolucionSeleccionada.nroResolucion }} - {{ resolucionSeleccionada.tipoTramite }}
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Tabla resumen de rutas existentes -->
              <div class="rutas-existentes">
                <mat-expansion-panel [expanded]="rutasExistentes.length > 0">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>route</mat-icon>
                      Rutas Existentes en esta Resolución
                    </mat-panel-title>
                    <mat-panel-description>
                      @if (cargandoRutasExistentes) {
                        <mat-spinner diameter="20"></mat-spinner>
                        Cargando...
                      } @else {
                        {{ rutasExistentes.length }} ruta(s) registrada(s)
                      }
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  @if (cargandoRutasExistentes) {
                    <div class="loading-container">
                      <mat-spinner diameter="40"></mat-spinner>
                      <p>Cargando rutas existentes...</p>
                    </div>
                  } @else if (rutasExistentes.length > 0) {
                    <div class="tabla-rutas-existentes">
                      <p class="tabla-descripcion">
                        <mat-icon color="accent">info</mat-icon>
                        Estas son las rutas que ya existen para esta resolución. Asegúrate de que tu nueva ruta no sea duplicada.
                      </p>
                      
                      <table mat-table [dataSource]="rutasExistentes" class="rutas-table">
                        <!-- Código -->
                        <ng-container matColumnDef="codigoRuta">
                          <th mat-header-cell *matHeaderCellDef>Código</th>
                          <td mat-cell *matCellDef="let ruta">
                            <span class="codigo-badge">{{ ruta.codigoRuta }}</span>
                          </td>
                        </ng-container>

                        <!-- Origen -->
                        <ng-container matColumnDef="origen">
                          <th mat-header-cell *matHeaderCellDef>Origen</th>
                          <td mat-cell *matCellDef="let ruta">{{ ruta.origen }}</td>
                        </ng-container>

                        <!-- Destino -->
                        <ng-container matColumnDef="destino">
                          <th mat-header-cell *matHeaderCellDef>Destino</th>
                          <td mat-cell *matCellDef="let ruta">{{ ruta.destino }}</td>
                        </ng-container>

                        <!-- Itinerario -->
                        <ng-container matColumnDef="itinerario">
                          <th mat-header-cell *matHeaderCellDef>Itinerario</th>
                          <td mat-cell *matCellDef="let ruta">
                            <span class="itinerario-text">{{ ruta.itinerario || ruta.descripcion || '-' }}</span>
                          </td>
                        </ng-container>

                        <!-- Estado -->
                        <ng-container matColumnDef="estado">
                          <th mat-header-cell *matHeaderCellDef>Estado</th>
                          <td mat-cell *matCellDef="let ruta">
                            <span class="estado-chip" [class.activa]="ruta.estado === 'ACTIVA'">
                              {{ ruta.estado }}
                            </span>
                          </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                      </table>
                    </div>
                  } @else {
                    <div class="sin-rutas">
                      <mat-icon class="sin-rutas-icon">add_road</mat-icon>
                      <h4>Primera Ruta de esta Resolución</h4>
                      <p>Esta será la primera ruta asociada a esta resolución. ¡Perfecto momento para comenzar!</p>
                    </div>
                  }
                </mat-expansion-panel>
              </div>
            }

            <!-- Formulario de datos de la ruta -->
            @if (rutaForm.get('resolucionId')?.value) {
              <div class="datos-ruta">
                <h3>Datos de la Ruta</h3>
                
                <div class="form-row">
                  <mat-form-field appearance="outline" class="codigo-field">
                    <mat-label>Código de Ruta *</mat-label>
                    <div class="codigo-container">
                      <input matInput 
                             formControlName="codigoRuta" 
                             placeholder="01"
                             maxlength="2"
                             pattern="[0-9]{2}"
                             required>
                      <button mat-icon-button 
                              type="button" 
                              (click)="generarCodigoAutomatico()"
                              matTooltip="Generar código automático"
                              [disabled]="!rutaForm.get('resolucionId')?.value">
                        <mat-icon>auto_fix_high</mat-icon>
                      </button>
                    </div>
                    <mat-hint>Código único de dos dígitos (01-99)</mat-hint>
                    <mat-error *ngIf="rutaForm.get('codigoRuta')?.hasError('required')">
                      El código es obligatorio
                    </mat-error>
                    <mat-error *ngIf="rutaForm.get('codigoRuta')?.hasError('pattern')">
                      Debe ser un código de 2 dígitos (01-99)
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Origen *</mat-label>
                    <mat-select formControlName="origen" required>
                      <mat-option value="Puno">Puno</mat-option>
                      <mat-option value="Juliaca">Juliaca</mat-option>
                      <mat-option value="Cusco">Cusco</mat-option>
                      <mat-option value="Arequipa">Arequipa</mat-option>
                      <mat-option value="Lima">Lima</mat-option>
                      <mat-option value="Tacna">Tacna</mat-option>
                    </mat-select>
                    <mat-error *ngIf="rutaForm.get('origen')?.hasError('required')">
                      El origen es obligatorio
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Destino *</mat-label>
                    <mat-select formControlName="destino" required>
                      <mat-option value="Puno">Puno</mat-option>
                      <mat-option value="Juliaca">Juliaca</mat-option>
                      <mat-option value="Cusco">Cusco</mat-option>
                      <mat-option value="Arequipa">Arequipa</mat-option>
                      <mat-option value="Lima">Lima</mat-option>
                      <mat-option value="Tacna">Tacna</mat-option>
                    </mat-select>
                    <mat-error *ngIf="rutaForm.get('destino')?.hasError('required')">
                      El destino es obligatorio
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Frecuencias *</mat-label>
                    <input matInput 
                           formControlName="frecuencias" 
                           placeholder="Ej: Diaria, cada 30 minutos"
                           required>
                    <mat-error *ngIf="rutaForm.get('frecuencias')?.hasError('required')">
                      Las frecuencias son obligatorias
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Tipo de Ruta *</mat-label>
                    <mat-select formControlName="tipoRuta" required>
                      <mat-option value="URBANA">Urbana</mat-option>
                      <mat-option value="INTERURBANA">Interurbana</mat-option>
                      <mat-option value="INTERPROVINCIAL">Interprovincial</mat-option>
                      <mat-option value="INTERREGIONAL">Interregional</mat-option>
                    </mat-select>
                    <mat-error *ngIf="rutaForm.get('tipoRuta')?.hasError('required')">
                      El tipo de ruta es obligatorio
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Tipo de Servicio *</mat-label>
                    <mat-select formControlName="tipoServicio" required>
                      <mat-option value="PASAJEROS">Pasajeros</mat-option>
                      <mat-option value="CARGA">Carga</mat-option>
                      <mat-option value="MIXTO">Mixto</mat-option>
                    </mat-select>
                    <mat-error *ngIf="rutaForm.get('tipoServicio')?.hasError('required')">
                      El tipo de servicio es obligatorio
                    </mat-error>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Descripción/Itinerario</mat-label>
                    <textarea matInput 
                              formControlName="descripcion" 
                              rows="2"
                              placeholder="Descripción del itinerario de la ruta (opcional)"></textarea>
                    <mat-hint>Describe las paradas intermedias o puntos importantes de la ruta</mat-hint>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Observaciones</mat-label>
                    <textarea matInput 
                              formControlName="observaciones" 
                              rows="3"
                              placeholder="Observaciones adicionales sobre la ruta"></textarea>
                  </mat-form-field>
                </div>
              </div>
            }
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button type="button" (click)="onCancel()">
            <mat-icon>cancel</mat-icon>
            Cancelar
          </button>
          <button mat-raised-button 
                  color="primary" 
                  type="submit"
                  (click)="onSubmit()"
                  [disabled]="!rutaForm.valid || isSubmitting">
            @if (isSubmitting) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon>
            }
            Crear Ruta
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .modal-container {
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-card {
      width: 100%;
    }

    .modo-selector {
      margin-bottom: 24px;
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-field {
      flex: 1;
    }

    .codigo-field {
      flex: 0 0 200px; // Campo más pequeño para código de 2 dígitos
      max-width: 200px;
    }

    .codigo-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .codigo-container input {
      text-align: center;
      font-weight: 600;
      font-size: 16px;
    }

    .resolucion-option, .empresa-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .resolucion-numero {
      font-weight: 500;
      color: #1976d2;
    }

    .resolucion-empresa, .empresa-razon {
      font-size: 0.9em;
      color: #666;
    }

    .resolucion-tipo {
      font-size: 0.8em;
      color: #999;
    }

    .empresa-ruc {
      font-weight: 500;
      color: #1976d2;
    }

    .seleccion-actual {
      margin: 24px 0;
    }

    .info-card {
      background-color: #f5f5f5;
    }

    .info-row {
      margin-bottom: 8px;
    }

    .datos-ruta {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }

    .datos-ruta h3 {
      margin: 0 0 16px 0;
      color: #1976d2;
    }

    mat-card-actions {
      padding: 16px 24px;
      gap: 8px;
    }

    // Estilos para la sección de rutas existentes
    .rutas-existentes {
      margin: 24px 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      gap: 16px;
    }

    .tabla-rutas-existentes {
      margin-top: 16px;
    }

    .tabla-descripcion {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 8px;
      font-size: 14px;
      color: #1565c0;
    }

    .rutas-table {
      width: 100%;
      margin-top: 8px;
    }

    .codigo-badge {
      background-color: #1976d2;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .estado-chip {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background-color: rgba(158, 158, 158, 0.1);
      color: #9e9e9e;
    }

    .estado-chip.activa {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .sin-rutas {
      text-align: center;
      padding: 32px 16px;
      color: #666;
    }

    .sin-rutas-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
      margin-bottom: 16px;
    }

    .sin-rutas h4 {
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .sin-rutas p {
      margin: 0;
      font-size: 14px;
    }

    .itinerario-text {
      font-size: 12px;
      color: #666;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-block;
    }

    // Estilos para el expansion panel
    ::ng-deep .mat-expansion-panel-header {
      padding: 16px 24px !important;
    }

    ::ng-deep .mat-expansion-panel-body {
      padding: 0 24px 16px 24px !important;
    }
  `]
})
export class CrearRutaMejoradoComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CrearRutaMejoradoComponent>);
  private snackBar = inject(MatSnackBar);
  private rutaService = inject(RutaService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);

  rutaForm: FormGroup;
  isSubmitting = false;
  
  // Estados de carga
  cargandoEmpresas = false;
  cargandoResoluciones = false;
  cargandoResolucionesEmpresa = false;
  cargandoRutasExistentes = false;

  // Datos
  empresas: Empresa[] = [];
  resolucionesPrimigenias: any[] = [];
  resolucionesEmpresa: any[] = [];
  rutasExistentes: Ruta[] = [];
  
  // Selecciones actuales
  empresaSeleccionada: Empresa | null = null;
  resolucionSeleccionada: any = null;

  // Columnas para la tabla de rutas existentes
  displayedColumns = ['codigoRuta', 'origen', 'destino', 'itinerario', 'estado'];

  private subscriptions: Subscription[] = [];

  constructor() {
    this.rutaForm = this.fb.group({
      modoSeleccion: ['resolucion', Validators.required],
      empresaId: [''],
      resolucionId: ['', Validators.required],
      codigoRuta: ['', Validators.required],
      origen: ['', Validators.required],
      destino: ['', Validators.required],
      frecuencias: ['', Validators.required],
      tipoRuta: ['INTERPROVINCIAL', Validators.required],
      tipoServicio: ['PASAJEROS', Validators.required],
      descripcion: [''],
      observaciones: ['']
    });
  }

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private cargarDatosIniciales() {
    // Cargar resoluciones primigenias por defecto
    this.cargarResolucionesPrimigenias();
    
    // Cargar empresas para el modo empresa
    this.cargarEmpresas();
  }

  private cargarEmpresas() {
    this.cargandoEmpresas = true;
    const sub = this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        this.empresas = empresas.filter(e => e.estaActivo);
        this.cargandoEmpresas = false;
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
        this.cargandoEmpresas = false;
        this.snackBar.open('Error cargando empresas', 'Cerrar', { duration: 3000 });
      }
    });
    this.subscriptions.push(sub);
  }

  private cargarResolucionesPrimigenias() {
    this.cargandoResoluciones = true;
    // Llamar al nuevo endpoint
    const sub = this.rutaService.getTodasResolucionesPrimigenias().subscribe({
      next: (response: any) => {
        this.resolucionesPrimigenias = response.resoluciones || [];
        this.cargandoResoluciones = false;
      },
      error: (error) => {
        console.error('Error cargando resoluciones primigenias:', error);
        this.cargandoResoluciones = false;
        this.snackBar.open('Error cargando resoluciones', 'Cerrar', { duration: 3000 });
      }
    });
    this.subscriptions.push(sub);
  }

  onModoChange() {
    // Limpiar selecciones al cambiar modo
    this.rutaForm.patchValue({
      empresaId: '',
      resolucionId: ''
    });
    this.empresaSeleccionada = null;
    this.resolucionSeleccionada = null;
    this.resolucionesEmpresa = [];
    this.rutasExistentes = [];
  }

  onEmpresaChange() {
    const empresaId = this.rutaForm.get('empresaId')?.value;
    if (empresaId) {
      this.empresaSeleccionada = this.empresas.find(e => e.id === empresaId) || null;
      this.cargarResolucionesEmpresa(empresaId);
    } else {
      this.empresaSeleccionada = null;
      this.resolucionesEmpresa = [];
    }
    
    // Limpiar resolución seleccionada
    this.rutaForm.patchValue({ resolucionId: '' });
    this.resolucionSeleccionada = null;
    this.rutasExistentes = [];
  }

  onResolucionChange() {
    const resolucionId = this.rutaForm.get('resolucionId')?.value;
    if (resolucionId) {
      // Buscar la resolución en ambas listas
      this.resolucionSeleccionada = 
        this.resolucionesPrimigenias.find(r => r.id === resolucionId) ||
        this.resolucionesEmpresa.find(r => r.id === resolucionId) ||
        null;
      
      // Si estamos en modo resolución directa, obtener la empresa
      if (this.rutaForm.get('modoSeleccion')?.value === 'resolucion' && this.resolucionSeleccionada?.empresa) {
        this.empresaSeleccionada = {
          id: this.resolucionSeleccionada.empresa.id,
          ruc: this.resolucionSeleccionada.empresa.ruc,
          razonSocial: { principal: this.resolucionSeleccionada.empresa.razonSocial }
        } as Empresa;
      }

      // Cargar rutas existentes de esta resolución
      this.cargarRutasExistentes(resolucionId);
    } else {
      this.resolucionSeleccionada = null;
      this.rutasExistentes = [];
    }
  }

  private cargarResolucionesEmpresa(empresaId: string) {
    this.cargandoResolucionesEmpresa = true;
    const sub = this.rutaService.getResolucionesPrimigeniasEmpresa(empresaId).subscribe({
      next: (response: any) => {
        this.resolucionesEmpresa = response.resoluciones || [];
        this.cargandoResolucionesEmpresa = false;
      },
      error: (error) => {
        console.error('Error cargando resoluciones de empresa:', error);
        this.cargandoResolucionesEmpresa = false;
        this.snackBar.open('Error cargando resoluciones de la empresa', 'Cerrar', { duration: 3000 });
      }
    });
    this.subscriptions.push(sub);
  }

  private cargarRutasExistentes(resolucionId: string) {
    console.log('🔍 CARGANDO RUTAS EXISTENTES PARA RESOLUCIÓN:', resolucionId);
    
    this.cargandoRutasExistentes = true;
    this.rutasExistentes = [];

    const sub = this.rutaService.getRutasPorResolucion(resolucionId).subscribe({
      next: (rutas) => {
        console.log('✅ RUTAS EXISTENTES CARGADAS:', {
          total: rutas.length,
          resolucionId: resolucionId,
          rutas: rutas.map(r => ({
            id: r.id,
            codigoRuta: r.codigoRuta,
            origen: r.origen,
            destino: r.destino,
            estado: r.estado
          }))
        });

        this.rutasExistentes = rutas;
        this.cargandoRutasExistentes = false;

        // Mostrar mensaje informativo
        if (rutas.length > 0) {
          this.snackBar.open(`Se encontraron ${rutas.length} ruta(s) existente(s) en esta resolución`, 'Cerrar', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('❌ ERROR AL CARGAR RUTAS EXISTENTES:', error);
        this.cargandoRutasExistentes = false;
        this.rutasExistentes = [];
        
        // No mostrar error al usuario, solo log interno
        console.warn('No se pudieron cargar las rutas existentes, continuando sin mostrar resumen');
      }
    });
    this.subscriptions.push(sub);
  }

  generarCodigoAutomatico() {
    const resolucionId = this.rutaForm.get('resolucionId')?.value;
    if (resolucionId) {
      const sub = this.rutaService.getSiguienteCodigoDisponible(resolucionId).subscribe({
        next: (codigo) => {
          this.rutaForm.patchValue({ codigoRuta: codigo });
          this.snackBar.open(`Código generado: ${codigo}`, 'Cerrar', { duration: 2000 });
        },
        error: (error) => {
          console.error('Error generando código:', error);
          this.snackBar.open('Error generando código automático', 'Cerrar', { duration: 3000 });
        }
      });
      this.subscriptions.push(sub);
    }
  }

  onSubmit() {
    if (this.rutaForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formValue = this.rutaForm.value;
      
      // Mapear nombres de ciudades a IDs de localidades
      const mapeoLocalidades: { [key: string]: string } = {
        'Puno': 'PUNO_001',
        'Juliaca': 'JULIACA_001',
        'Cusco': 'CUSCO_001',
        'Arequipa': 'AREQUIPA_001',
        'Lima': 'LIMA_001',
        'Tacna': 'TACNA_001'
      };
      
      const origenId = mapeoLocalidades[formValue.origen] || 'PUNO_001';
      const destinoId = mapeoLocalidades[formValue.destino] || 'JULIACA_001';
      
      const nuevaRuta: RutaCreate = {
        codigoRuta: formValue.codigoRuta,
        nombre: `${formValue.origen} - ${formValue.destino}`,
        origenId: origenId,
        destinoId: destinoId,
        origen: formValue.origen,
        destino: formValue.destino,
        frecuencias: formValue.frecuencias,
        tipoRuta: formValue.tipoRuta,
        tipoServicio: formValue.tipoServicio,
        // descripcion: formValue.descripcion || '', // Campo no disponible en RutaCreate por ahora
        observaciones: formValue.observaciones || '',
        empresaId: this.empresaSeleccionada?.id || '',
        resolucionId: formValue.resolucionId,
        itinerarioIds: []
      };

      console.log('💾 Creando nueva ruta:', nuevaRuta);

      const sub = this.rutaService.createRuta(nuevaRuta).subscribe({
        next: (rutaCreada) => {
          console.log('✅ Ruta creada exitosamente:', rutaCreada);
          this.snackBar.open('Ruta creada exitosamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(rutaCreada);
        },
        error: (error) => {
          console.error('❌ Error creando ruta:', error);
          this.isSubmitting = false;
          
          let mensaje = 'Error al crear la ruta';
          if (error.error?.detail) {
            mensaje = error.error.detail;
          }
          
          this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        }
      });
      this.subscriptions.push(sub);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}