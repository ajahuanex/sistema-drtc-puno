import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ResolucionHijaService } from '../../services/resolucion-hija.service';
import { VehiculoDataService } from '../../services/vehiculo-data.service';
import { RenovacionTucModalComponent } from './renovacion-tuc-modal.component';

export interface VehiculoEdicion {
  placa: string;
  numero_tuc?: string;
  marca?: string;
  modelo?: string;
  anio_fabricacion?: number;
  categoria?: string;
  color?: string;
  rutas?: string[];
  es_saliente?: boolean;
  estado?: string;
  editando?: boolean;
}

@Component({
  selector: 'app-editar-tramite-modal',
  standalone: true,
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  template: `
    <div class="modal-root">
      
      <!-- HEADER -->
      <div class="modal-header-bar">
        <div class="header-left-box">
          <div class="header-icon-box">
            <mat-icon>edit_document</mat-icon>
          </div>
          <div>
            <h2 class="header-title-text">Editar Trámite y Flota Vehicular</h2>
            <p class="header-sub-text">
              {{ data.razon_social }} • RUC: {{ data.ruc }} • Res: <strong>{{ data.nro_resolucion }}</strong>
            </p>
          </div>
        </div>
        
        <div class="header-actions-box">
          <button mat-stroked-button class="btn-tuc-direct" (click)="abrirGeneracionTucs()" matTooltip="Generar o reimprimir TUCs de este trámite">
            <mat-icon>print</mat-icon>
            <span>TUCs del Trámite</span>
          </button>
          <button mat-icon-button mat-dialog-close class="btn-close-modal">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- BODY CON PESTAÑAS -->
      <div class="content-scroll-area">
        
        @if (cargando()) {
          <div class="loading-box">
            <mat-spinner diameter="38"></mat-spinner>
            <p>Cargando datos y vehículos del trámite...</p>
          </div>
        } @else {
          <mat-tab-group class="modern-tabs" animationDuration="150ms">
            
            <!-- PESTAÑA 1: VEHÍCULOS DEL TRÁMITE (AGREGAR / MODIFICAR / ELIMINAR) -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-label-icon">directions_bus</mat-icon>
                <span>Vehículos del Trámite ({{ vehiculos().length }})</span>
              </ng-template>

              <div class="tab-inner-content">
                
                <!-- CAJA PARA AGREGAR NUEVO VEHÍCULO -->
                <div class="card-box">
                  <h3 class="card-title-heading">
                    <mat-icon class="icon-add">add_circle</mat-icon>
                    Agregar Vehículo al Trámite
                  </h3>

                  <div class="add-vehicle-form-grid">
                    
                    <!-- Placa -->
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Placa</mat-label>
                      <input matInput [(ngModel)]="nuevoVehiculo.placa" (blur)="consultarDatosTecnicosPlaca()" (keyup.enter)="consultarDatosTecnicosPlaca()" placeholder="Ej: V1A-950" style="text-transform: uppercase; font-family: monospace; font-weight: bold;">
                      <button mat-icon-button matSuffix type="button" (click)="consultarDatosTecnicosPlaca()" [disabled]="buscandoPlaca" matTooltip="Buscar datos técnicos en BD">
                        <mat-icon *ngIf="!buscandoPlaca">search</mat-icon>
                        <mat-spinner *ngIf="buscandoPlaca" diameter="16"></mat-spinner>
                      </button>
                    </mat-form-field>

                    <!-- Rol Movimiento -->
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Movimiento</mat-label>
                      <mat-select [(ngModel)]="nuevoVehiculo.es_saliente">
                        <mat-option [value]="false">Ingresante (Alta)</mat-option>
                        <mat-option [value]="true">Saliente (Baja)</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <!-- N° TUC -->
                    <mat-form-field appearance="outline" class="w-full" *ngIf="!nuevoVehiculo.es_saliente">
                      <mat-label>N° TUC (Opcional)</mat-label>
                      <input matInput [(ngModel)]="nuevoVehiculo.numero_tuc" placeholder="Ej: 2026-001234">
                    </mat-form-field>

                    <!-- Marca -->
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Marca</mat-label>
                      <input matInput [(ngModel)]="nuevoVehiculo.marca" placeholder="Ej: TOYOTA">
                    </mat-form-field>

                    <!-- Modelo / Año -->
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Modelo / Año</mat-label>
                      <input matInput [(ngModel)]="nuevoVehiculo.modelo" placeholder="Ej: HIACE 2020">
                    </mat-form-field>

                    <!-- Botón Agregar -->
                    <div class="btn-add-wrapper">
                      <button mat-flat-button color="primary" class="btn-add-action" (click)="agregarVehiculoLista()" [disabled]="!nuevoVehiculo.placa || nuevoVehiculo.placa.trim().length < 6">
                        <mat-icon>add</mat-icon>
                        <span>Agregar</span>
                      </button>
                    </div>

                  </div>
                </div>

                <!-- LISTA DE VEHÍCULOS DEL TRÁMITE -->
                <div class="vehicles-list-card">
                  <div class="table-header-info">
                    <span class="info-title">
                      Vehículos Vinculados a este Trámite
                    </span>
                    <span class="info-badge">
                      Total: {{ vehiculos().length }} unidad(es)
                    </span>
                  </div>

                  @if (vehiculos().length === 0) {
                    <div class="empty-vehicles-box">
                      <mat-icon>directions_bus</mat-icon>
                      <p>No hay vehículos registrados en este trámite aún.</p>
                    </div>
                  } @else {
                    <div class="table-overflow-box">
                      <table class="vehicles-table">
                        <thead>
                          <tr>
                            <th>Placa</th>
                            <th>Movimiento</th>
                            <th>N° TUC</th>
                            <th>Marca / Modelo</th>
                            <th>Año / Cat</th>
                            <th class="text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (v of vehiculos(); track $index) {
                            <tr class="vehicle-row">
                              
                              <!-- Placa -->
                              <td class="cell-plate">
                                @if (v.editando) {
                                  <input [(ngModel)]="v.placa" class="inline-input plate-input">
                                } @else {
                                  <span class="plate-pill">{{ v.placa }}</span>
                                }
                              </td>

                              <!-- Movimiento -->
                              <td>
                                @if (v.editando) {
                                  <select [(ngModel)]="v.es_saliente" class="inline-select">
                                    <option [ngValue]="false">Ingresante (Alta)</option>
                                    <option [ngValue]="true">Saliente (Baja)</option>
                                  </select>
                                } @else {
                                  @if (v.es_saliente) {
                                    <span class="role-chip role-baja">
                                      <span class="dot-amber"></span>
                                      Saliente (Baja)
                                    </span>
                                  } @else {
                                    <span class="role-chip role-alta">
                                      <span class="dot-emerald"></span>
                                      Ingresante (Alta)
                                    </span>
                                  }
                                }
                              </td>

                              <!-- N° TUC -->
                              <td class="cell-tuc">
                                @if (v.editando) {
                                  <input [(ngModel)]="v.numero_tuc" class="inline-input tuc-input" placeholder="Sin TUC">
                                } @else {
                                  @if (v.numero_tuc) {
                                    <span class="tuc-number">{{ v.numero_tuc }}</span>
                                  } @else {
                                    <span class="sin-tuc-text">Sin TUC</span>
                                  }
                                }
                              </td>

                              <!-- Marca / Modelo -->
                              <td>
                                @if (v.editando) {
                                  <div class="edit-inputs-row">
                                    <input [(ngModel)]="v.marca" class="inline-input" placeholder="Marca">
                                    <input [(ngModel)]="v.modelo" class="inline-input" placeholder="Modelo">
                                  </div>
                                } @else {
                                  <span class="car-brand">{{ v.marca || '-' }} {{ v.modelo || '' }}</span>
                                }
                              </td>

                              <!-- Año / Categoria -->
                              <td class="cell-meta">
                                @if (v.editando) {
                                  <input [(ngModel)]="v.anio_fabricacion" type="number" class="inline-input year-input" placeholder="Año">
                                } @else {
                                  <span>{{ v.anio_fabricacion || '-' }} ({{ v.categoria || 'M2' }})</span>
                                }
                              </td>

                              <!-- Acciones -->
                              <td class="text-right">
                                <div class="action-buttons-group">
                                  @if (v.editando) {
                                    <button mat-icon-button class="btn-action-ok" (click)="v.editando = false" matTooltip="Guardar cambios">
                                      <mat-icon>done</mat-icon>
                                    </button>
                                  } @else {
                                    <button mat-icon-button class="btn-action-edit" (click)="v.editando = true" matTooltip="Modificar datos del vehículo">
                                      <mat-icon>edit</mat-icon>
                                    </button>
                                  }
                                  
                                  <button mat-icon-button class="btn-action-delete" (click)="eliminarVehiculoLista($index)" matTooltip="Eliminar del trámite">
                                    <mat-icon>delete_outline</mat-icon>
                                  </button>
                                </div>
                              </td>

                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>

              </div>
            </mat-tab>

            <!-- PESTAÑA 2: DATOS ADMINISTRATIVOS DEL TRÁMITE -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-label-icon">description</mat-icon>
                <span>Datos de la Resolución / Expediente</span>
              </ng-template>

              <form [formGroup]="form" class="tab-inner-content">
                <div class="card-box">
                  <h3 class="card-title-heading">
                    <mat-icon class="icon-admin">assignment</mat-icon>
                    Información Legal del Acto Administrativo
                  </h3>

                  <div class="form-admin-grid">
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>N° Resolución</mat-label>
                      <input matInput formControlName="nro_resolucion" placeholder="Ej: R-0123-2026(S)">
                      <mat-hint>Número oficial de la resolución modificatoria</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>N° Expediente</mat-label>
                      <input matInput formControlName="expediente_numero" placeholder="Ej: E-0045-2026">
                      <mat-hint>Expediente administrativo asociado</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Fecha de Resolución</mat-label>
                      <input matInput type="date" formControlName="fecha_resolucion">
                      <mat-hint>Fecha de expedición del documento</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Resolución Matriz / Primigenia</mat-label>
                      <input matInput formControlName="nro_resolucion_primigenia" placeholder="Ej: 0100-2021">
                      <mat-hint>Resolución de autorización matriz</mat-hint>
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="w-full" style="margin-top: 1rem;">
                    <mat-label>Observaciones del Trámite</mat-label>
                    <textarea matInput formControlName="observaciones" rows="3" placeholder="Detalles o fundamentación de la modificación..."></textarea>
                  </mat-form-field>

                </div>
              </form>
            </mat-tab>

          </mat-tab-group>
        }

      </div>

      <!-- FOOTER / ACCIONES -->
      <div class="modal-bottom-bar">
        <button mat-button type="button" mat-dialog-close [disabled]="guardando()" class="btn-cancel">
          Cancelar
        </button>

        <div class="footer-right-buttons">
          <button mat-flat-button color="primary" (click)="guardarCambios()" [disabled]="guardando() || cargando()" class="btn-save">
            <mat-icon *ngIf="guardando()" class="spin-icon">sync</mat-icon>
            <mat-icon *ngIf="!guardando()">save</mat-icon>
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .modal-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 92vh;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      font-family: inherit;
    }

    /* HEADER */
    .modal-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: #ffffff;
    }
    .header-left-box {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .header-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #e0e7ff;
      color: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-icon-box mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .header-title-text {
      font-size: 1.2rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
    .header-sub-text {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0.15rem 0 0 0;
    }
    .header-actions-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-tuc-direct {
      border-color: #059669 !important;
      color: #059669 !important;
      font-size: 0.75rem !important;
      height: 36px !important;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn-tuc-direct mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .btn-close-modal {
      color: #94a3b8;
    }

    /* CONTENT SCROLL */
    .content-scroll-area {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 1.5rem;
      background: #f8fafc;
    }
    .loading-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1rem;
      color: #64748b;
    }
    .loading-box p {
      margin-top: 1rem;
      font-weight: 500;
      font-size: 0.85rem;
    }

    /* TABS */
    .modern-tabs {
      width: 100%;
    }
    .tab-label-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 6px;
      color: #4f46e5;
    }
    .tab-inner-content {
      padding: 1.25rem 0;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* CARD BOX */
    .card-box {
      background: #ffffff;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .card-title-heading {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .icon-add {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #059669;
    }
    .icon-admin {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4f46e5;
    }

    /* ADD VEHICLE GRID */
    .add-vehicle-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.75rem;
      align-items: center;
    }
    .btn-add-wrapper {
      padding-top: 2px;
    }
    .btn-add-action {
      height: 48px !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      font-size: 0.8rem !important;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .w-full {
      width: 100%;
    }

    /* VEHICLES LIST CARD */
    .vehicles-list-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }
    .table-header-info {
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .info-title {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #334155;
    }
    .info-badge {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }
    .empty-vehicles-box {
      padding: 3rem 1rem;
      text-align: center;
      color: #94a3b8;
    }
    .empty-vehicles-box mat-icon {
      font-size: 38px;
      width: 38px;
      height: 38px;
      color: #cbd5e1;
    }

    /* TABLE */
    .table-overflow-box {
      overflow-x: auto;
    }
    .vehicles-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .vehicles-table th {
      background: #f8fafc;
      color: #475569;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    .vehicles-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .vehicle-row:hover {
      background: #f8fafc;
    }

    .plate-pill {
      font-family: monospace;
      font-weight: 700;
      font-size: 0.85rem;
      background: #f1f5f9;
      color: #0f172a;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
    }
    .role-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .role-alta {
      background: #d1fae5;
      color: #065f46;
    }
    .role-baja {
      background: #fef3c7;
      color: #92400e;
    }
    .dot-emerald {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #059669;
    }
    .dot-amber {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #d97706;
    }

    .tuc-number {
      font-family: monospace;
      font-weight: 700;
      color: #4f46e5;
    }
    .sin-tuc-text {
      color: #94a3b8;
      font-style: italic;
      font-size: 0.75rem;
    }

    .car-brand {
      font-weight: 600;
      color: #1e293b;
    }
    .cell-meta {
      color: #64748b;
      font-size: 0.78rem;
    }

    /* INLINE EDITING */
    .inline-input {
      border: 1px solid #818cf8;
      background: #ffffff;
      border-radius: 6px;
      padding: 3px 6px;
      font-size: 0.8rem;
      outline: none;
    }
    .plate-input {
      width: 80px;
      font-family: monospace;
      font-weight: bold;
      text-transform: uppercase;
    }
    .tuc-input {
      width: 100px;
      font-family: monospace;
    }
    .year-input {
      width: 60px;
    }
    .inline-select {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 3px 6px;
      font-size: 0.78rem;
    }
    .edit-inputs-row {
      display: flex;
      gap: 4px;
    }
    .edit-inputs-row input {
      width: 75px;
    }

    /* ACTIONS */
    .action-buttons-group {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .btn-action-ok {
      color: #059669;
    }
    .btn-action-edit {
      color: #475569;
    }
    .btn-action-delete {
      color: #dc2626;
    }

    /* ADMIN FORM GRID */
    .form-admin-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 640px) {
      .form-admin-grid {
        grid-template-columns: 1fr;
      }
    }

    /* BOTTOM BAR */
    .modal-bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
    }
    .btn-save {
      height: 40px;
      border-radius: 8px !important;
      font-weight: 600 !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
    .text-right {
      text-align: right;
    }
  `]
})
export class EditarTramiteModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<EditarTramiteModalComponent>);
  data = inject<any>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private resolucionHijaService = inject(ResolucionHijaService);
  private vehiculoDataService = inject(VehiculoDataService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  cargando = signal<boolean>(true);
  guardando = signal<boolean>(false);
  buscandoPlaca = false;

  vehiculos = signal<VehiculoEdicion[]>([]);

  nuevoVehiculo = {
    placa: '',
    numero_tuc: '',
    marca: '',
    modelo: '',
    anio_fabricacion: undefined as number | undefined,
    categoria: 'M2',
    color: '',
    es_saliente: false
  };

  form = this.fb.group({
    nro_resolucion: ['', Validators.required],
    nro_resolucion_primigenia: [''],
    expediente_numero: [''],
    fecha_resolucion: [''],
    observaciones: ['']
  });

  ngOnInit() {
    this.cargarDatosTramite();
  }

  cargarDatosTramite() {
    this.cargando.set(true);
    const hijaId = this.data.id || this.data._id || this.data.nro_resolucion;

    this.resolucionHijaService.getVehiculosDetalleTramite(hijaId).subscribe({
      next: (resp) => {
        this.cargando.set(false);
        if (resp) {
          let fechaStr = '';
          if (resp.fecha_resolucion) {
            fechaStr = new Date(resp.fecha_resolucion).toISOString().substring(0, 10);
          }

          this.form.patchValue({
            nro_resolucion: resp.nro_resolucion || this.data.nro_resolucion || this.data.id,
            nro_resolucion_primigenia: resp.nro_resolucion_primigenia || this.data.nro_resolucion_primigenia,
            expediente_numero: resp.expediente_numero || this.data.expediente_numero,
            fecha_resolucion: fechaStr,
            observaciones: resp.observaciones || this.data.observaciones
          });

          this.vehiculos.set((resp.vehiculos || []).map((v: any) => ({ ...v, es_saliente: !!v.es_saliente })));
        }
      },
      error: (err) => {
        this.cargando.set(false);
        console.error('Error cargando detalle del trámite:', err);
        const placasIng = this.data.placasIng || this.data.vehiculos_ingresantes || [];
        const placasSal = this.data.placasSal || this.data.vehiculos_salientes || [];
        const tucs = this.data.numeros_tuc || [];

        const lista: VehiculoEdicion[] = [];
        placasIng.forEach((p: string, idx: number) => {
          lista.push({
            placa: p,
            numero_tuc: tucs[idx] || '',
            es_saliente: false
          });
        });
        placasSal.forEach((p: string) => {
          lista.push({
            placa: p,
            es_saliente: true
          });
        });

        this.vehiculos.set(lista);
        this.form.patchValue({
          nro_resolucion: this.data.nro_resolucion || this.data.id,
          nro_resolucion_primigenia: this.data.nro_resolucion_primigenia,
          expediente_numero: this.data.expediente_numero,
          observaciones: this.data.observaciones
        });
      }
    });
  }

  consultarDatosTecnicosPlaca() {
    const placa = (this.nuevoVehiculo.placa || '').trim().toUpperCase();
    if (!placa || placa.length < 6) return;

    this.buscandoPlaca = true;
    this.vehiculoDataService.getVehiculoDataByPlaca(placa).subscribe({
      next: (resp: any) => {
        this.buscandoPlaca = false;
        const v = resp?.data || resp;
        if (v) {
          if (v.marca) this.nuevoVehiculo.marca = v.marca;
          if (v.modelo) this.nuevoVehiculo.modelo = v.modelo;
          if (v.anio_fabricacion) this.nuevoVehiculo.anio_fabricacion = v.anio_fabricacion;
          if (v.categoria) this.nuevoVehiculo.categoria = v.categoria;
          if (v.color) this.nuevoVehiculo.color = v.color;
          this.snackBar.open(`Datos de ${placa} cargados`, 'OK', { duration: 2500 });
        }
      },
      error: () => {
        this.buscandoPlaca = false;
      }
    });
  }

  agregarVehiculoLista() {
    const placa = (this.nuevoVehiculo.placa || '').trim().toUpperCase();
    if (!placa) return;

    const yaExiste = this.vehiculos().some(v => v.placa === placa);
    if (yaExiste) {
      this.snackBar.open(`La placa ${placa} ya se encuentra en este trámite`, 'Cerrar', { duration: 3000 });
      return;
    }

    const item: VehiculoEdicion = {
      placa,
      numero_tuc: this.nuevoVehiculo.numero_tuc?.trim() || undefined,
      marca: this.nuevoVehiculo.marca?.trim() || undefined,
      modelo: this.nuevoVehiculo.modelo?.trim() || undefined,
      anio_fabricacion: this.nuevoVehiculo.anio_fabricacion,
      categoria: this.nuevoVehiculo.categoria || 'M2',
      color: this.nuevoVehiculo.color?.trim() || undefined,
      es_saliente: this.nuevoVehiculo.es_saliente
    };

    this.vehiculos.update(curr => [item, ...curr]);

    this.nuevoVehiculo = {
      placa: '',
      numero_tuc: '',
      marca: '',
      modelo: '',
      anio_fabricacion: undefined,
      categoria: 'M2',
      color: '',
      es_saliente: false
    };

    this.snackBar.open(`Vehículo ${placa} agregado al trámite`, 'OK', { duration: 2500 });
  }

  eliminarVehiculoLista(index: number) {
    const v = this.vehiculos()[index];
    if (confirm(`¿Está seguro de quitar el vehículo ${v.placa} de este trámite?`)) {
      this.vehiculos.update(curr => curr.filter((_, i) => i !== index));
      this.snackBar.open(`Vehículo ${v.placa} retirado`, 'OK', { duration: 2500 });
    }
  }

  guardarCambios() {
    if (this.form.invalid) {
      this.snackBar.open('Complete los campos obligatorios del trámite', 'Cerrar', { duration: 3000 });
      return;
    }

    this.guardando.set(true);
    const hijaId = this.data.id || this.data._id || this.data.nro_resolucion;

    const payload = {
      nro_resolucion: this.form.value.nro_resolucion?.trim(),
      nro_resolucion_primigenia: this.form.value.nro_resolucion_primigenia?.trim(),
      expediente_numero: this.form.value.expediente_numero?.trim(),
      fecha_resolucion: this.form.value.fecha_resolucion || undefined,
      observaciones: this.form.value.observaciones?.trim() || undefined,
      vehiculos: this.vehiculos().map(v => ({
        placa: v.placa.trim().toUpperCase(),
        numero_tuc: v.numero_tuc?.trim(),
        marca: v.marca?.trim(),
        modelo: v.modelo?.trim(),
        anio_fabricacion: v.anio_fabricacion,
        categoria: v.categoria,
        color: v.color?.trim(),
        rutas: v.rutas || [],
        es_saliente: v.es_saliente
      }))
    };

    this.resolucionHijaService.editarTramiteCompleto(hijaId, payload).subscribe({
      next: (resp) => {
        this.guardando.set(false);
        this.snackBar.open('✓ Trámite y flota vehicular actualizados exitosamente', 'OK', { duration: 3500 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        console.error('Error al editar trámite:', err);
        const msg = err.error?.detail || 'Error al guardar los cambios del trámite';
        this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 4000 });
      }
    });
  }

  abrirGeneracionTucs() {
    const vehiculosInfo = this.vehiculos()
      .filter(v => !v.es_saliente)
      .map((v, idx) => ({
        placa: v.placa,
        numero_tuc: v.numero_tuc,
        orden: idx + 1,
        marca: v.marca,
        modelo: v.modelo,
        anio_fabricacion: v.anio_fabricacion,
        categoria: v.categoria || 'M2',
        color: v.color
      }));

    this.dialog.open(RenovacionTucModalComponent, {
      data: {
        nro_resolucion: this.form.value.nro_resolucion || this.data.nro_resolucion || this.data.id,
        ruc: this.data.ruc,
        razon_social: this.data.razon_social || this.data.empresa,
        fecha_emision: this.form.value.fecha_resolucion,
        vehiculos: vehiculosInfo
      },
      width: '1060px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      panelClass: 'tuc-impresion-dialog-panel'
    });
  }
}
