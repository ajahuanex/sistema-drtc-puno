import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehiculoService } from '../../services/vehiculo.service';
import { Vehiculo, VehiculoCreate } from '../../models/vehiculo.model';
import { Resolucion } from '../../models/resolucion.model';
import { Empresa } from '../../models/empresa.model';
import { 
  placaPeruanaValidator, 
  placaDuplicadaValidator,
  anioFabricacionValidator
} from '../../validators/vehiculo.validators';

export interface VehiculosResolucionModalData {
  resolucion: Resolucion;
  empresa: Empresa;
}

@Component({
  selector: 'app-vehiculos-resolucion-modal',
  standalone: true,
  changeDetection: (ChangeDetectionStrategy as any).OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="modal-container">
      <!-- Header del Modal -->
      <div class="modal-header">
        <div class="header-content">
          <h2>VEHÍCULOS DE LA RESOLUCIÓN</h2>
          <div class="resolucion-info">
            <p class="empresa-nombre">{{ (data as any).empresa.(razonSocial as any).principal }}</p>
            <p class="resolucion-numero">{{ (data as any).resolucion.nroResolucion }} - {{ (data as any).resolucion.tipoTramite }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="closeModal()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Contenido del Modal -->
      <div class="modal-content">
        <!-- Botón para agregar nuevo vehículo -->
        <div class="actions-bar">
          <button mat-raised-button color="primary" (click)="mostrarFormularioNuevo()" class="add-button">
            <mat-icon>add</mat-icon>
            AGREGAR NUEVO VEHÍCULO
          </button>
        </div>

        <!-- Tabla de Vehículos -->
        @if (vehiculos().length > 0) {
          <div class="table-container">
            <table mat-table [dataSource]="vehiculos()" class="vehiculos-table">
              <!-- Placa Column -->
              <ng-container matColumnDef="placa">
                <th mat-header-cell *matHeaderCellDef class="table-header">PLACA</th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">{{ (vehiculo as any).placa }}</td>
              </ng-container>

              <!-- Marca Column -->
              <ng-container matColumnDef="marca">
                <th mat-header-cell *matHeaderCellDef class="table-header">MARCA</th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">{{ (vehiculo as any).marca }}</td>
              </ng-container>

              <!-- Categoría Column -->
              <ng-container matColumnDef="categoria">
                <th mat-header-cell *matHeaderCellDef class="table-header">CATEGORÍA</th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                  <mat-chip [class]="'categoria-chip-' + (vehiculo as any).categoria?.toLowerCase()">
                    {{ (vehiculo as any).categoria }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Estado Column -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef class="table-header">ESTADO</th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                  <mat-chip [class]="'estado-chip-' + (vehiculo as any).estado?.toLowerCase()">
                    {{ (vehiculo as any).estado }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Año Column -->
              <ng-container matColumnDef="anioFabricacion">
                <th mat-header-cell *matHeaderCellDef class="table-header">AÑO</th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">{{ (vehiculo as any).anioFabricacion }}</td>
              </ng-container>

              <!-- Rutas Column -->
              <ng-container matColumnDef="rutas">
                <th mat-header-cell *matHeaderCellDef class="table-header">RUTAS</th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                  <mat-chip color="warn" selected>{{ (vehiculo as any).rutasAsignadasIds.length || 0 }}</mat-chip>
                </td>
              </ng-container>

              <!-- Acciones Column -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef class="table-header">ACCIONES</th>
                <td mat-cell *matCellDef="let vehiculo" class="table-cell">
                  <div class="action-buttons">
                    <button mat-icon-button 
                            size="small" 
                            (click)="seleccionarVehiculo(vehiculo)"
                            matTooltip="SELECCIONAR VEHÍCULO"
                            class="select-button">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                    <button mat-icon-button 
                            size="small" 
                            (click)="editarVehiculo(vehiculo)"
                            matTooltip="EDITAR VEHÍCULO"
                            class="edit-button">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button 
                            size="small" 
                            (click)="eliminarVehiculo(vehiculo)"
                            matTooltip="ELIMINAR VEHÍCULO"
                            class="delete-button">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        } @else {
          <div class="no-vehiculos">
            <mat-icon class="no-data-icon">directions_car</mat-icon>
            <p>NO HAY VEHÍCULOS REGISTRADOS EN ESTA RESOLUCIÓN</p>
            <p class="subtitle">Haz clic en "AGREGAR NUEVO VEHÍCULO" para comenzar</p>
          </div>
        }

        <!-- Formulario para nuevo/editar vehículo -->
        @if (mostrarFormulario()) {
          <div class="form-container">
            <div class="form-header">
              <h3>{{ vehiculoEditando() ? 'EDITAR VEHÍCULO' : 'NUEVO VEHÍCULO' }}</h3>
              <button mat-icon-button (click)="ocultarFormulario()" class="close-form-button">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <form [formGroup]="vehiculoForm" class="vehiculo-form">
              <div class="form-grid">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>PLACA *</mat-label>
                  <input matInput 
                         formControlName="placa" 
                         placeholder="ABC-123" 
                         maxlength="10"
                         (input)="convertirPlacaMayusculas($event)">
                  <mat-icon matSuffix 
                           [(class as any).valid-icon]="(vehiculoForm as any).get('placa')?.valid && (vehiculoForm as any).get('placa')?.value"
                           [(class as any).invalid-icon]="(vehiculoForm as any).get('placa')?.invalid && (vehiculoForm as any).get('placa')?.touched">
                    {{ getPlacaIcon() }}
                  </mat-icon>
                  <mat-hint>Formato: ABC-123, AB-1234 o A1B-234</mat-hint>
                  <mat-error *ngIf="(vehiculoForm as any).get('placa')?.hasError('required')">
                    La placa es obligatoria
                  </mat-error>
                  <mat-error *ngIf="(vehiculoForm as any).get('placa')?.hasError('placaInvalida')">
                    {{ (vehiculoForm as any).get('placa')?.errors?.['placaInvalida']?.message }}
                  </mat-error>
                  <mat-error *ngIf="(vehiculoForm as any).get('placa')?.hasError('placaDuplicada')">
                    {{ (vehiculoForm as any).get('placa')?.errors?.['placaDuplicada']?.message }}
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>MARCA *</mat-label>
                  <input matInput 
                         formControlName="marca" 
                         placeholder="MERCEDES-BENZ"
                         [matAutocomplete]="autoMarca">
                  <mat-autocomplete #autoMarca="matAutocomplete">
                    <mat-option *ngFor="let marca of marcasPopulares" [value]="marca">
                      {{ marca }}
                    </mat-option>
                  </mat-autocomplete>
                  <mat-icon matSuffix>branding_watermark</mat-icon>
                  <mat-hint>Selecciona o escribe una marca</mat-hint>
                  <mat-error *ngIf="(vehiculoForm as any).get('marca')?.hasError('required')">
                    La marca es obligatoria
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>CATEGORÍA *</mat-label>
                  <mat-select formControlName="categoria">
                    <mat-option value="M3">M3 - Autobús</mat-option>
                    <mat-option value="N3">N3 - Camión</mat-option>
                    <mat-option value="M2">M2 - Minibús</mat-option>
                    <mat-option value="N2">N2 - Camión Mediano</mat-option>
                  </mat-select>
                  <mat-icon matSuffix>category</mat-icon>
                  <mat-error *ngIf="(vehiculoForm as any).get('categoria')?.hasError('required')">
                    La categoría es obligatoria
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>AÑO DE FABRICACIÓN *</mat-label>
                  <input matInput formControlName="anioFabricacion" type="number">
                  <mat-icon matSuffix>calendar_today</mat-icon>
                  <mat-hint>Entre 1990 y {{ getCurrentYear() + 1 }}</mat-hint>
                  <mat-error *ngIf="(vehiculoForm as any).get('anioFabricacion')?.hasError('required')">
                    El año es obligatorio
                  </mat-error>
                  <mat-error *ngIf="(vehiculoForm as any).get('anioFabricacion')?.hasError('anioMinimo')">
                    {{ (vehiculoForm as any).get('anioFabricacion')?.errors?.['anioMinimo']?.message }}
                  </mat-error>
                  <mat-error *ngIf="(vehiculoForm as any).get('anioFabricacion')?.hasError('anioMaximo')">
                    {{ (vehiculoForm as any).get('anioFabricacion')?.errors?.['anioMaximo']?.message }}
                  </mat-error>
                  <mat-error *ngIf="(vehiculoForm as any).get('anioFabricacion')?.hasError('anioInvalido')">
                    {{ (vehiculoForm as any).get('anioFabricacion')?.errors?.['anioInvalido']?.message }}
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>ESTADO *</mat-label>
                  <mat-select formControlName="estado">
                    <mat-option value="ACTIVO">ACTIVO</mat-option>
                    <mat-option value="MANTENIMIENTO">MANTENIMIENTO</mat-option>
                    <mat-option value="INACTIVO">INACTIVO</mat-option>
                  </mat-select>
                  <mat-icon matSuffix>info</mat-icon>
                  <mat-error *ngIf="(vehiculoForm as any).get('estado')?.hasError('required')">
                    El estado es obligatorio
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button mat-button (click)="ocultarFormulario()" class="cancel-button">
                  CANCELAR
                </button>
                <button mat-raised-button 
                        color="primary" 
                        (click)="guardarVehiculo()"
                        [disabled]="(vehiculoForm as any).invalid || guardando()"
                        class="save-button">
                  <mat-icon>save</mat-icon>
                  {{ vehiculoEditando() ? 'ACTUALIZAR' : 'GUARDAR' }}
                </button>
              </div>
            </form>
          </div>
        }
      </div>

      <!-- Loading Spinner -->
      @if (isLoading()) {
        <div class="loading-overlay">
          <mat-spinner diameter="50"></mat-spinner>
          <p>CARGANDO...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .modal-container {
      width: 90vw;
      max-width: 1200px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px;
      background: linear-gradient(135deg, #1976d2, #1565c0);
      color: white;
      border-radius: 8px 8px 0 0;
    }

    .header-content h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .resolucion-info {
      margin: 0;
    }

    .empresa-nombre {
      margin: 0 0 5px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .resolucion-numero {
      margin: 0;
      font-size: 14px;
      opacity: (0 as any).9;
    }

    .close-button {
      color: white;
    }

    .modal-content {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }

    .actions-bar {
      margin-bottom: 20px;
      display: flex;
      justify-content: flex-end;
    }

    .add-button {
      font-weight: 600;
      text-transform: uppercase;
    }

    .table-container {
      margin-bottom: 20px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,(0 as any).1);
    }

    .vehiculos-table {
      width: 100%;
    }

    .table-header {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
      padding: 12px 16px;
      text-align: left;
    }

    .table-cell {
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .select-button {
      color: #4caf50;
    }

    .edit-button {
      color: #1976d2;
    }

    .delete-button {
      color: #f44336;
    }

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

    .no-vehiculos {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-data-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 20px;
    }

    .subtitle {
      font-size: 14px;
      margin-top: 10px;
      opacity: (0 as any).7;
    }

    .form-container {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .form-header h3 {
      margin: 0;
      color: #333;
    }

    .close-form-button {
      color: #666;
    }

    .vehiculo-form {
      width: 100%;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
    }

    .cancel-button {
      color: #666;
    }

    .save-button {
      font-weight: 600;
      text-transform: uppercase;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, (0 as any).9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .loading-overlay p {
      margin-top: 16px;
      color: #666;
      font-weight: 500;
    }

    /* Estilos para iconos de validación */
    .valid-icon {
      color: #4caf50 !important;
    }

    .invalid-icon {
      color: #f44336 !important;
    }

    mat-(icon as any).mat-icon[matsuffix] {
      transition: color (0 as any).3s ease;
    }

    /* Estilos para campos con validación */
    mat-form-(field as any).mat-form-field-invalid .mat-form-field-outline {
      border-color: #f44336 !important;
    }

    mat-form-(field as any).mat-form-field-valid .mat-form-field-outline {
      border-color: #4caf50 !important;
    }

    /* Animación para mensajes de error */
    mat-error {
      animation: slideIn (0 as any).3s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .modal-container {
        width: 95vw;
        max-height: 95vh;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class VehiculosResolucionModalComponent {
  private dialogRef = inject(MatDialogRef<VehiculosResolucionModalComponent>);
  data = inject(MAT_DIALOG_DATA) as VehiculosResolucionModalData;
  private vehiculoService = inject(VehiculoService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // Signals
  vehiculos = signal<Vehiculo[]>([]);
  isLoading = signal(false);
  mostrarFormulario = signal(false);
  vehiculoEditando = signal<Vehiculo | null>(null);
  guardando = signal(false);

  // Columnas de la tabla
  displayedColumns = ['placa', 'marca', 'categoria', 'estado', 'anioFabricacion', 'rutas', 'acciones'];

  // Marcas populares para autocompletado
  marcasPopulares = [
    'TOYOTA',
    'HYUNDAI',
    'MERCEDES-BENZ',
    'VOLVO',
    'SCANIA',
    'IVECO',
    'MITSUBISHI',
    'ISUZU',
    'HINO',
    'JAC',
    'YUTONG',
    'KING LONG',
    'GOLDEN DRAGON',
    'ZHONGTONG',
    'FOTON'
  ];

  // Formulario
  vehiculoForm: FormGroup;

  constructor() {
    (this as any).vehiculoForm = (this as any).fb.group({
      placa: [
        '', 
        [(Validators as any).required, placaPeruanaValidator()],
        [placaDuplicadaValidator((this as any).vehiculoService, (this as any).vehiculoEditando()?.id)]
      ],
      marca: ['', [(Validators as any).required, (Validators as any).maxLength(50)]],
      categoria: ['', (Validators as any).required],
      anioFabricacion: ['', [(Validators as any).required, anioFabricacionValidator()]],
      estado: ['ACTIVO', (Validators as any).required]
    });

    (this as any).cargarVehiculos();
  }

  cargarVehiculos(): void {
    (this as any).isLoading.set(true);
    (this as any).vehiculoService.getVehiculosPorResolucion(this.data.resolucion.id).subscribe({
      next: (vehiculos: Vehiculo[]) => {
        (this as any).vehiculos.set(vehiculos);
        (this as any).isLoading.set(false);
      },
      error: (error: unknown) => {
        (console as any).error('Error cargando vehículos:', error);
        (this as any).snackBar.open('Error al cargar vehículos', 'Cerrar', { duration: 3000 });
        (this as any).isLoading.set(false);
      }
    });
  }

  mostrarFormularioNuevo(): void {
    (this as any).vehiculoEditando.set(null);
    
    // Resetear el validador asíncrono de placa para nuevo vehículo
    const placaControl = (this as any).vehiculoForm.get('placa');
    if (placaControl) {
      (placaControl as any).clearAsyncValidators();
      (placaControl as any).setAsyncValidators([placaDuplicadaValidator((this as any).vehiculoService)]);
      (placaControl as any).updateValueAndValidity();
    }
    
    (this as any).vehiculoForm.reset({
      estado: 'ACTIVO'
    });
    (this as any).mostrarFormulario.set(true);
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    (this as any).vehiculoEditando.set(vehiculo);
    
    // Actualizar el validador asíncrono de placa con el ID del vehículo actual
    const placaControl = (this as any).vehiculoForm.get('placa');
    if (placaControl) {
      (placaControl as any).clearAsyncValidators();
      (placaControl as any).setAsyncValidators([placaDuplicadaValidator((this as any).vehiculoService, (vehiculo as any).id)]);
      (placaControl as any).updateValueAndValidity();
    }
    
    (this as any).vehiculoForm.patchValue({
      placa: (vehiculo as any).placa,
      marca: (vehiculo as any).marca,
      categoria: (vehiculo as any).categoria,
      anioFabricacion: (vehiculo as any).anioFabricacion,
      estado: (vehiculo as any).estado
    });
    (this as any).mostrarFormulario.set(true);
  }

  ocultarFormulario(): void {
    (this as any).mostrarFormulario.set(false);
    (this as any).vehiculoEditando.set(null);
    (this as any).vehiculoForm.reset();
  }

  guardarVehiculo(): void {
    if ((this as any).vehiculoForm.invalid) return;

    (this as any).guardando.set(true);
    const formData = (this as any).vehiculoForm.value;

    if ((this as any).vehiculoEditando()) {
      // Actualizar vehículo existente
      const vehiculoUpdate = {
        ...(this as any).vehiculoEditando()!,
        ...formData
      };

      (this as any).vehiculoService.updateVehiculo((vehiculoUpdate as any).id, vehiculoUpdate).subscribe({
        next: () => {
          (this as any).snackBar.open(
            `✓ Vehículo ${(formData as any).placa} actualizado exitosamente`, 
            'Cerrar', 
            { duration: 4000 }
          );
          (this as any).cargarVehiculos();
          (this as any).ocultarFormulario();
          (this as any).guardando.set(false);
        },
        error: (error: unknown) => {
          (console as any).error('Error actualizando vehículo:', error);
          const errorMsg = (error as any).error?.message || 'Error al actualizar vehículo';
          (this as any).snackBar.open(`✗ ${errorMsg}`, 'Cerrar', { duration: 5000 });
          (this as any).guardando.set(false);
        }
      });
    } else {
      // Crear nuevo vehículo
      const nuevoVehiculo: VehiculoCreate = {
        ...formData,
        empresaActualId: this.data.empresa.id,
        resolucionId: this.data.resolucion.id,
        rutasAsignadasIds: [],
        estaActivo: true
      };

      (this as any).vehiculoService.createVehiculo(nuevoVehiculo).subscribe({
        next: () => {
          (this as any).snackBar.open(
            `✓ Vehículo ${(formData as any).placa} (${(formData as any).marca}) creado exitosamente`, 
            'Cerrar', 
            { duration: 4000 }
          );
          (this as any).cargarVehiculos();
          (this as any).ocultarFormulario();
          (this as any).guardando.set(false);
        },
        error: (error: unknown) => {
          (console as any).error('Error creando vehículo:', error);
          const errorMsg = (error as any).error?.message || 'Error al crear vehículo';
          (this as any).snackBar.open(`✗ ${errorMsg}`, 'Cerrar', { duration: 5000 });
          (this as any).guardando.set(false);
        }
      });
    }
  }

  eliminarVehiculo(vehiculo: Vehiculo): void {
    if (confirm(
      `¿Estás seguro de eliminar el vehículo ${(vehiculo as any).placa}?\n\n` +
      `El vehículo será marcado como eliminado pero se mantendrá en el sistema para fines de auditoría.`
    )) {
      (this as any).vehiculoService.deleteVehiculo((vehiculo as any).id).subscribe({
        next: () => {
          (this as any).snackBar.open('Vehículo eliminado exitosamente', 'Cerrar', { duration: 3000 });
          (this as any).cargarVehiculos(); // Recargar la lista
        },
        error: (error) => {
          (console as any).error('Error eliminando vehículo:', error);
          (this as any).snackBar.open('Error al eliminar el vehículo', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  closeModal(): void {
    (this as any).dialogRef.close();
  }

  seleccionarVehiculo(vehiculo: Vehiculo): void {
    // Cerrar el modal y devolver el vehículo seleccionado
    (this as any).dialogRef.close(vehiculo);
  }

  // ========================================
  // MÉTODOS DE AYUDA PARA VALIDACIÓN
  // ========================================

  /**
   * Convertir placa a mayúsculas automáticamente
   */
  convertirPlacaMayusculas(event: Event): void {
    const input = (event as any).target as HTMLInputElement;
    const value = (input as any).value.toUpperCase();
    (this as any).vehiculoForm.get('placa')?.setValue(value, { emitEvent: false });
    (input as any).value = value;
  }

  /**
   * Obtener icono para el campo de placa según su estado de validación
   */
  getPlacaIcon(): string {
    const placaControl = (this as any).vehiculoForm.get('placa');
    
    if (!placaControl?.value) {
      return 'directions_car';
    }
    
    if ((placaControl as any).pending) {
      return 'hourglass_empty'; // Validación asíncrona en progreso
    }
    
    if ((placaControl as any).valid) {
      return 'check_circle'; // Válido
    }
    
    if ((placaControl as any).invalid && (placaControl as any).touched) {
      return 'error'; // Inválido
    }
    
    return 'directions_car';
  }

  /**
   * Obtener año actual para validación
   */
  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Mostrar resumen de datos antes de guardar
   */
  mostrarResumenDatos(): string {
    const formData = (this as any).vehiculoForm.value;
    return `
      Placa: ${(formData as any).placa}
      Marca: ${(formData as any).marca}
      Categoría: ${(formData as any).categoria}
      Año: ${(formData as any).anioFabricacion}
      Estado: ${(formData as any).estado}
    `;
  }
} 